# backend/app/ai/career_progression.py
import json
import re
from sqlalchemy.orm import Session
from .router import route_llm_query

def evaluate_career_progression(current_role: str, target_role: str, current_skills: list, db: Session) -> dict:
    prompt = f"""You are a senior enterprise career coach and technical evaluator. Analyze the career advancement path for an employee:
- Current Role: {current_role}
- Target Next Role: {target_role}
- Current Skills: {", ".join(current_skills)}

Perform a professional career evaluation and output a valid JSON object matching the following structure:
{{
  "current_role": "{current_role}",
  "next_role": "{target_role}",
  "required_skills": ["Skill Name 1", "Skill Name 2", "Skill Name 3"],
  "skill_gap_analysis": "Detailed text explanation of what critical skills are missing or need improvement for the target role...",
  "learning_path": ["Step 1: Learn/build X", "Step 2: Read Y", "Step 3: Certification/Project Z"],
  "promotion_readiness": "XX% (Concise justification of this percentage)",
  "improvement_suggestions": ["Actionable suggestion 1", "Actionable suggestion 2"]
}}

Do not include any chat prefix, markdown tag (like ```json), or explanation outside of the JSON block. Output raw JSON.

Evaluation:"""

    llm_res = route_llm_query(prompt, db)
    raw_answer = llm_res["answer"].strip()
    
    # Clean markdown
    if raw_answer.startswith("```"):
        match = re.search(r"```(?:json)?\s*(.*?)\s*```", raw_answer, re.DOTALL)
        if match:
            raw_answer = match.group(1).strip()
            
    try:
        data = json.loads(raw_answer)
        return {
            "current_role": data.get("current_role", current_role),
            "next_role": data.get("next_role", target_role),
            "required_skills": data.get("required_skills", ["Docker", "FastAPI Advanced", "System Architecture"]),
            "skill_gap_analysis": data.get("skill_gap_analysis", "The primary gap lies in cloud deployment and system design patterns."),
            "learning_path": data.get("learning_path", ["Study containerization", "Refactor FastAPI endpoints", "Read System Design Interview"]),
            "promotion_readiness": data.get("promotion_readiness", "70% - Requires mentoring Junior developers"),
            "improvement_suggestions": data.get("improvement_suggestions", ["Lead the next module planning session", "Build a service health check system"])
        }
    except Exception as e:
        print("Failed to parse JSON in career progression:", e)
        # Mock fallback response
        required_skills = ["System Design", "Microservices", "Docker & CI/CD", "Team Leadership"]
        if "senior" in target_role.lower():
            readiness = "60% - Technical skills are strong, but leadership experience is required."
            gap = "Employee needs to demonstrate competency in microservice orchestration, advanced database caching, and leading module developments."
            learning = ["Complete the 'System Design Patterns' track", "Shadow a Tech Lead in Project Beta", "Setup a Kubernetes cluster in local scratch environment"]
            suggestions = ["Take ownership of API optimization module", "Present a technical workshop on FastAPI to the team", "Help HR onboard 2 junior engineers"]
        else:
            readiness = "75% - Technical skills align well, needs more project deliverables."
            gap = "Needs experience in database migrations and writing robust unit test suites."
            learning = ["Study Alembic database migrations", "Complete pytest testing suites guide", "Review Docker container basic usage"]
            suggestions = ["Write automated test cases for the ticket router", "Fix open bug tickets in Kanban board", "Prepare project architecture report"]
            
        return {
            "current_role": current_role,
            "next_role": target_role,
            "required_skills": required_skills,
            "skill_gap_analysis": gap,
            "learning_path": learning,
            "promotion_readiness": readiness,
            "improvement_suggestions": suggestions
        }
