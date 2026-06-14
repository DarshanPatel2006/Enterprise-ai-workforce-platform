# backend/app/routes/ai.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional, List
from ..database import get_db
from ..schemas import AIChatQuery, AIChatResponse, MeetingAssistantResponse, CareerRoadmapResponse
from ..auth import get_current_active_user, User
from ..ai.rag import execute_rag_query
from ..ai.meeting_assistant import analyze_meeting_transcript
from ..ai.career_progression import evaluate_career_progression

router = APIRouter(prefix="/api/ai", tags=["AI Module Services"])

# --- AI RAG CHAT ASSISTANT ---
@router.post("/chat", response_model=AIChatResponse)
def ai_chat_assistant(query_data: AIChatQuery, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    try:
        # Run query through RAG pipeline (routes to proper ChromaDB collection & calls LLM Router)
        res = execute_rag_query(query_data.query, db)
        return {
            "answer": res["answer"],
            "rag_source": res["rag_source"],
            "model_used": res["model_used"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG query failed: {str(e)}")

# --- AI MEETING ASSISTANT ---
@router.post("/meeting", response_model=MeetingAssistantResponse)
def ai_meeting_assistant(
    transcript: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    text_content = ""
    
    # Check text input or file input
    if transcript:
        text_content = transcript
    elif file:
        try:
            content = file.file.read()
            text_content = content.decode("utf-8")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to read uploaded text file: {str(e)}")
    else:
        raise HTTPException(status_code=400, detail="Please provide either 'transcript' text or upload a text 'file'")
        
    if not text_content.strip():
        raise HTTPException(status_code=400, detail="Meeting transcript content cannot be empty")
        
    try:
        res = analyze_meeting_transcript(text_content, db)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcript analysis failed: {str(e)}")

# --- CAREER PROGRESSION ENGINE ---
@router.post("/career", response_model=CareerRoadmapResponse)
def ai_career_progression(
    target_role: str = Form(...),
    skills: str = Form(...), # Comma-separated list of skills
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    profile = current_user.profile
    if not profile:
        raise HTTPException(status_code=404, detail="Employee profile not found")
        
    skill_list = [s.strip() for s in skills.split(",") if s.strip()]
    if not skill_list:
        raise HTTPException(status_code=400, detail="Please provide a valid list of skills")
        
    try:
        res = evaluate_career_progression(current_user.role, target_role, skill_list, db)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Career progression analysis failed: {str(e)}")
