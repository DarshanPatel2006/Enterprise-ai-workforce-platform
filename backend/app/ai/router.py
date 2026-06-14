# backend/app/ai/router.py
import time
import requests
import json
from sqlalchemy.orm import Session
from ..config import settings
from ..models import AIUsageLog

# Mock replies mapping for simulation mode
MOCK_ANSWERS = {
    "hr": "Based on the Employee Handbook, standard working hours are 9:00 AM to 6:00 PM, Monday to Friday. Leaves must be requested 3 days in advance through the Employee Portal, and approval is subject to manager review. Employees receive 24 days of paid leaves annually.",
    "policy": "Company Policy (Regulation 4.2): All employees must complete their daily attendance clock-in by 9:30 AM to avoid being marked late. Late arrivals exceeding 3 times a month will lead to salary deductions or formal HR reviews. Security rules forbid copying sensitive source code outside the company VPN.",
    "project": "Project Alpha is currently in the 'Development' phase. The milestone for the API integrations module is set for next Friday. All tasks must be created by the Manager in the workspace and tracked on the Kanban board. Task submissions require valid GitHub pull request links or zipped documentations.",
    "training": "For career progression, employees aiming for senior software roles should study Next.js for frontend performance and FastAPI microservices. Recommended training resources: 1. Python Advanced Design Patterns, 2. Enterprise System Architecture in AWS, available in the training drive.",
    "meeting": "Meeting Summary:\nThe team discussed progress on the Enterprise AI Workforce Platform.\n\nAction Items:\n- Develop fallback router logic (Assigned: Lead AI Eng, Deadline: June 18)\n- Design Tailwind layout for dashboards (Assigned: Frontend Developer, Deadline: June 20)\n- Setup ChromaDB vector databases (Assigned: Database Eng, Deadline: June 21)\n\nKey Decisions:\n- Use SQLite for out-of-the-box local running.\n- Fallback sequence is Gemini -> Groq -> OpenRouter -> Local Ollama.",
    "career": "Career Progression Report:\n- Current Role: Junior Developer\n- Next Target Role: Senior Developer\n- Skill Gap Analysis: Strong Python coding; needs improvement in system design, Docker containerization, and vector DB indexing.\n- Learning Path:\n  1. Study FastAPI caching & SQLAlchemy pool optimizations.\n  2. Build a local microservice using Docker.\n  3. Review ChromaDB vector indexing guides.\n- Promotion Readiness: 65% (Requires completing 2 more projects as module owner)."
}

def generate_mock_response(prompt: str) -> str:
    prompt_lower = prompt.lower()
    for key, val in MOCK_ANSWERS.items():
        if key in prompt_lower:
            return val
    # Default mock
    return "Enterprise WMS AI Assistant: Thank you for your inquiry. This response is running in AI simulation mode because no live API keys are configured. If you configure a GEMINI_API_KEY or GROQ_API_KEY in your environment, the platform will route this query to the real model."

def log_ai_usage(db: Session, model: str, query: str, response: str, duration_ms: int, fallback: bool):
    try:
        # Simple token count estimation (approx 4 chars per token)
        tokens_est = len(query) // 4 + len(response) // 4
        log = AIUsageLog(
            model_used=model,
            query=query[:1000],  # cap logging query size
            response=response[:2000],
            response_time_ms=duration_ms,
            tokens_used=tokens_est,
            fallback_occurred=fallback
        )
        db.add(log)
        db.commit()
    except Exception as e:
        print("Error saving AI log:", e)

def route_llm_query(prompt: str, db: Session) -> dict:
    start_time = time.time()
    
    # 1. Attempt GEMINI API (using new google.genai SDK)
    if settings.GEMINI_API_KEY:
        try:
            from google import genai
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt
            )
            answer = response.text
            duration = int((time.time() - start_time) * 1000)
            log_ai_usage(db, "Gemini 2.0 Flash", prompt, answer, duration, False)
            return {"answer": answer, "model": "Gemini 2.0 Flash"}
        except Exception as e:
            print("Gemini API call failed, falling back. Error:", e)
            
    # 2. Attempt GROQ API
    if settings.GROQ_API_KEY:
        try:
            from groq import Groq
            client = Groq(api_key=settings.GROQ_API_KEY)
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                timeout=10
            )
            ans = completion.choices[0].message.content
            duration = int((time.time() - start_time) * 1000)
            log_ai_usage(db, "Groq (Llama-3.3)", prompt, ans, duration, True)
            return {"answer": ans, "model": "Groq Llama-3.3"}
        except Exception as e:
            print("Groq API call failed, falling back. Error:", e)

    # 3. Attempt OpenRouter
    if settings.OPENROUTER_API_KEY:
        try:
            headers = {
                "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
            }
            data = {
                "model": "google/gemini-2.5-flash",
                "messages": [{"role": "user", "content": prompt}],
            }
            res = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=data,
                timeout=10
            )
            if res.status_code == 200:
                ans = res.json()["choices"][0]["message"]["content"]
                duration = int((time.time() - start_time) * 1000)
                log_ai_usage(db, "OpenRouter (Gemini)", prompt, ans, duration, True)
                return {"answer": ans, "model": "OpenRouter (Gemini)"}
        except Exception as e:
            print("OpenRouter API call failed, falling back. Error:", e)

    # 4. Attempt Local Ollama (Qwen)
    try:
        data = {
            "model": "qwen2.5:7b",
            "prompt": prompt,
            "stream": False
        }
        res = requests.post(f"{settings.OLLAMA_URL}/api/generate", json=data, timeout=8)
        if res.status_code == 200:
            ans = res.json()["response"]
            duration = int((time.time() - start_time) * 1000)
            log_ai_usage(db, "Ollama Local Qwen", prompt, ans, duration, True)
            return {"answer": ans, "model": "Ollama Local Qwen"}
    except Exception as e:
         print("Local Ollama call failed or not running, falling back to Simulation mode. Error:", e)

    # 5. Fallback to Simulation Mode (Mock responses)
    ans = generate_mock_response(prompt)
    duration = int((time.time() - start_time) * 1000)
    log_ai_usage(db, "Simulation Mode (Mock LLM)", prompt, ans, duration, True)
    return {"answer": ans, "model": "Simulation Mode (Mock)"}
