# backend/app/ai/rag.py
import os
import chromadb
from sqlalchemy.orm import Session
from .router import route_llm_query

# Pre-seeded document structures for each knowledge base
DEFAULT_RAG_DOCUMENTS = {
    "HR": [
        {"id": "hr_1", "text": "Employee Handbook (Leaves): Employees are entitled to 24 days of paid leave per year. Sick leave requires a medical certificate if extending beyond 2 consecutive days. Annual leaves should be applied for at least 3 days in advance and approved by the manager."},
        {"id": "hr_2", "text": "Working Hours and Attendance: The standard workday is 8 hours, from 9:00 AM to 6:00 PM, with a 1-hour lunch break between 1:00 PM and 2:00 PM. Attendance is clocked via the portal. Late arrival is defined as logging in after 9:30 AM."},
        {"id": "hr_3", "text": "Salary and Benefits: Salaries are disbursed on the last working day of every calendar month. Bonus distributions are calculated based on performance metrics tracked in the system and are approved by HR."}
    ],
    "POLICY": [
        {"id": "pol_1", "text": "Late Arrivals Policy: Late arrivals are monitored. 3 late clock-ins in a calendar month will trigger a warning notification. Subsequent late arrivals may result in deduction of half-day salary or disciplinary meetings."},
        {"id": "pol_2", "text": "Information Security Policy: Employees must not download corporate source code, data, or documents onto unauthorized personal devices. All work-related repositories must reside on company-approved GitHub accounts."},
        {"id": "pol_3", "text": "Office Code of Conduct: Standard professional etiquette must be maintained. Hybrid work allows 2 days of remote work per week, subject to prior alignment and approval from the reporting manager."}
    ],
    "PROJECT": [
        {"id": "proj_1", "text": "Project Management Rules: All engineering tasks must be logged in the project board, classified as Todo, In Progress, Testing, or Completed. Weight (1 to 5) represents complexity and productivity impact."},
        {"id": "proj_2", "text": "Work Submission Requirements: Every completed task must have a submission entry containing a valid GitHub Pull Request (PR) link, Google Drive link, or uploaded zip of documentation and files."},
        {"id": "proj_3", "text": "Milestone Reviews: Project Managers must review task submissions within 48 hours. Submissions can be Approved, Rejected, or marked as 'Changes Requested' with detailed reviewer feedback."}
    ],
    "TRAINING": [
        {"id": "train_1", "text": "Frontend Development Learning Track: Required skills include React, TailwindCSS, React Router, and state management. Suggested training resource: 'Modern React Design Patterns' available on the internal drive."},
        {"id": "train_2", "text": "Backend Development Learning Track: Core stack comprises FastAPI, SQLAlchemy, SQLite/MySQL, and JWT auth. Suggested study: 'FastAPI Microservice Architectures' by Google DeepMind authors."},
        {"id": "train_3", "text": "AI Integration Track: Covers LLM prompt engineering, fallback routing, and RAG vector searches with ChromaDB. Suggested study: 'Enterprise Vector DB Practices'."}
    ]
}

class PortableRAGManager:
    """
    Manages vector search using ChromaDB.
    Falls back to a keyword-based similarity index if ChromaDB is unavailable
    or during local simulation.
    """
    def __init__(self):
        self.chroma_client = None
        self.collections = {}
        self.use_fallback = False
        
        # Try to initialize ChromaDB Persistent Client
        try:
            db_path = "c:/project/tools/chroma_db"
            if not os.path.exists(db_path):
                os.makedirs(db_path)
            self.chroma_client = chromadb.PersistentClient(path=db_path)
            
            # Initialize collections and seed them
            for category, docs in DEFAULT_RAG_DOCUMENTS.items():
                col_name = f"collection_{category.lower()}"
                # Get or create collection
                collection = self.chroma_client.get_or_create_collection(name=col_name)
                
                # Check if already seeded
                existing = collection.get()
                if not existing or len(existing["ids"]) == 0:
                    ids = [doc["id"] for doc in docs]
                    texts = [doc["text"] for doc in docs]
                    metadatas = [{"category": category} for _ in docs]
                    collection.add(documents=texts, ids=ids, metadatas=metadatas)
                
                self.collections[category] = collection
            print("ChromaDB RAG Manager initialized successfully.")
        except Exception as e:
            print("Could not initialize ChromaDB (using lightweight keyword fallback):", e)
            self.use_fallback = True
            
    def _fallback_search(self, category: str, query: str, top_k: int = 2) -> str:
        # Simple scoring based on word matching
        query_words = set(query.lower().split())
        docs = DEFAULT_RAG_DOCUMENTS.get(category, [])
        scored_docs = []
        for doc in docs:
            doc_words = doc["text"].lower().split()
            score = sum(1 for w in query_words if w in doc_words)
            scored_docs.append((score, doc["text"]))
        
        # Sort by score descending and take top_k
        scored_docs.sort(key=lambda x: x[0], reverse=True)
        retrieved_texts = [text for score, text in scored_docs[:top_k] if score > 0]
        
        # If no word matches, just return the first two default docs
        if not retrieved_texts:
            retrieved_texts = [doc["text"] for doc in docs[:top_k]]
            
        return "\n\n".join(retrieved_texts)

    def search_rag(self, category: str, query: str) -> dict:
        category = category.upper()
        if category not in DEFAULT_RAG_DOCUMENTS:
            category = "HR" # Default
            
        if self.use_fallback:
            context = self._fallback_search(category, query)
            source = f"Fallback Text Database ({category} Collection)"
        else:
            try:
                collection = self.collections[category]
                results = collection.query(query_texts=[query], n_results=2)
                documents = results["documents"][0]
                context = "\n\n".join(documents)
                source = f"ChromaDB Vector Index ({category} Collection)"
            except Exception as e:
                print("ChromaDB query failed, falling back:", e)
                context = self._fallback_search(category, query)
                source = f"ChromaDB Query Fallback ({category} Collection)"
                
        return {"context": context, "source": source}

rag_manager = PortableRAGManager()

def classify_query(query: str, db: Session) -> str:
    # 1. Try to use LLM to classify the query
    prompt = f"""Classify the user query into exactly one of these categories: HR, POLICY, PROJECT, TRAINING.
Examples:
- "How do I apply for annual leave?" -> HR
- "What is the policy for hybrid remote work?" -> POLICY
- "How do I submit my task on the project board?" -> PROJECT
- "Are there any training resources for React?" -> TRAINING

Query: "{query}"
Respond with exactly one word (either HR, POLICY, PROJECT, or TRAINING) and nothing else. Do not write markdown tags or punctuation.
Category:"""
    
    try:
        response = route_llm_query(prompt, db)
        classification = response["answer"].strip().upper()
        # Clean response
        for category in ["HR", "POLICY", "PROJECT", "TRAINING"]:
            if category in classification:
                return category
    except Exception as e:
        print("LLM query classification failed, using keyword fallback. Error:", e)
        
    # 2. Keyword-based classifier fallback
    query_lower = query.lower()
    
    hr_keywords = ["leave", "holiday", "salary", "bonus", "payroll", "medical", "sick", "handbook", "pay", "attendance"]
    policy_keywords = ["vpn", "security", "late", "conduct", "rules", "hybrid", "remote", "regulation", "discipline"]
    project_keywords = ["task", "project", "kanban", "milestone", "github", "pr", "submission", "board"]
    training_keywords = ["learn", "skill", "training", "course", "resource", "study", "career", "progression"]
    
    for kw in hr_keywords:
        if kw in query_lower:
            return "HR"
    for kw in policy_keywords:
        if kw in query_lower:
            return "POLICY"
    for kw in project_keywords:
        if kw in query_lower:
            return "PROJECT"
    for kw in training_keywords:
        if kw in query_lower:
            return "TRAINING"
            
    return "HR" # Default

def execute_rag_query(query: str, db: Session) -> dict:
    # Classify query
    category = classify_query(query, db)
    
    # Retrieve context
    search_res = rag_manager.search_rag(category, query)
    context = search_res["context"]
    source = search_res["source"]
    
    # Generate final answer
    system_prompt = f"""You are the Enterprise AI Workforce Platform Virtual Assistant.
Answer the employee's query based on the following retrieved context. If the context does not contain enough information, use your general knowledge but mention that it is a general response.
Keep your answer professional, clear, and structured.

Retrieved Context:
{context}

User Query:
{query}

Answer:"""

    llm_res = route_llm_query(system_prompt, db)
    
    return {
        "answer": llm_res["answer"],
        "rag_source": source,
        "model_used": llm_res["model"]
    }
