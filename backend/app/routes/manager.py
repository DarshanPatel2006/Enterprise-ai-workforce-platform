# backend/app/routes/manager.py
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import User, EmployeeProfile, Team, TeamMember, Project, Task, TaskSubmission, Attendance, AuditLog
from ..schemas import TeamCreate, TeamResponse, ProjectCreate, ProjectResponse, TaskCreate, TaskResponse, TaskSubmissionResponse, TaskSubmissionReview
from ..auth import require_manager_or_higher

router = APIRouter(prefix="/api/manager", tags=["Manager Panel"])

def log_manager_action(db: Session, manager_id: int, action: str, details: str):
    log = AuditLog(action=action, user_id=manager_id, details=details)
    db.add(log)
    db.commit()

# --- TEAM MANAGEMENT ---
@router.post("/teams", response_model=TeamResponse)
def create_team(team: TeamCreate, current_manager: User = Depends(require_manager_or_higher), db: Session = Depends(get_db)):
    existing = db.query(Team).filter(Team.name == team.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Team name already exists")
        
    new_team = Team(name=team.name, manager_id=team.manager_id)
    db.add(new_team)
    db.commit()
    db.refresh(new_team)
    
    # Assign members
    for emp_id in team.member_ids:
        mem = TeamMember(team_id=new_team.id, employee_id=emp_id)
        db.add(mem)
    db.commit()
    db.refresh(new_team)
    
    log_manager_action(db, current_manager.id, "Team Creation", f"Created Team {team.name} with {len(team.member_ids)} members")
    return new_team

@router.get("/teams", response_model=List[TeamResponse])
def get_manager_teams(current_manager: User = Depends(require_manager_or_higher), db: Session = Depends(get_db)):
    # Returns teams managed by the current manager, or all if HR/Admin
    if current_manager.role in ["HR", "Super Admin"]:
        return db.query(Team).all()
    return db.query(Team).filter(Team.manager_id == current_manager.id).all()

# --- PROJECT MANAGEMENT ---
@router.post("/projects", response_model=ProjectResponse)
def create_project(proj: ProjectCreate, current_manager: User = Depends(require_manager_or_higher), db: Session = Depends(get_db)):
    new_proj = Project(
        name=proj.name,
        description=proj.description,
        manager_id=current_manager.id,
        status=proj.status,
        start_date=proj.start_date,
        end_date=proj.end_date
    )
    db.add(new_proj)
    db.commit()
    db.refresh(new_proj)
    log_manager_action(db, current_manager.id, "Project Creation", f"Created Project: {proj.name}")
    return new_proj

@router.get("/projects", response_model=List[ProjectResponse])
def get_projects(current_manager: User = Depends(require_manager_or_higher), db: Session = Depends(get_db)):
    if current_manager.role in ["HR", "Super Admin"]:
        return db.query(Project).all()
    return db.query(Project).filter(Project.manager_id == current_manager.id).all()

# --- TASK MANAGEMENT ---
@router.post("/tasks", response_model=TaskResponse)
def create_task(task: TaskCreate, current_manager: User = Depends(require_manager_or_higher), db: Session = Depends(get_db)):
    # Verify project exists
    proj = db.query(Project).filter(Project.id == task.project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
        
    new_task = Task(
        project_id=task.project_id,
        title=task.title,
        description=task.description,
        assigned_to=task.assigned_to,
        status=task.status,
        weight=task.weight,
        due_date=task.due_date
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    
    log_manager_action(db, current_manager.id, "Task Creation", f"Created Task: {task.title} under Project ID {task.project_id}")
    return new_task

@router.get("/tasks/{project_id}", response_model=List[TaskResponse])
def get_project_tasks(project_id: int, db: Session = Depends(get_db)):
    return db.query(Task).filter(Task.project_id == project_id).all()

# --- WORK REVIEW SYSTEM ---
@router.get("/submissions", response_model=List[TaskSubmissionResponse])
def get_team_submissions(current_manager: User = Depends(require_manager_or_higher), db: Session = Depends(get_db)):
    # Find tasks that belong to projects managed by this manager
    if current_manager.role in ["HR", "Super Admin"]:
        return db.query(TaskSubmission).order_by(TaskSubmission.submitted_at.desc()).all()
        
    project_ids = [p.id for p in db.query(Project).filter(Project.manager_id == current_manager.id).all()]
    return db.query(TaskSubmission).join(Task).filter(Task.project_id.in_(project_ids)).order_by(TaskSubmission.submitted_at.desc()).all()

@router.put("/submissions/{sub_id}/review", response_model=TaskSubmissionResponse)
def review_submission(sub_id: int, review: TaskSubmissionReview, current_manager: User = Depends(require_manager_or_higher), db: Session = Depends(get_db)):
    submission = db.query(TaskSubmission).filter(TaskSubmission.id == sub_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
        
    submission.status = review.status
    submission.reviewer_feedback = review.reviewer_feedback
    
    # Update Task Status based on approval
    task = submission.task
    if review.status == "Approved":
        task.status = "Completed"
    elif review.status == "Changes Requested":
        task.status = "In Progress"
    elif review.status == "Rejected":
        task.status = "Todo"
        
    db.commit()
    db.refresh(submission)
    
    log_manager_action(db, current_manager.id, "Submission Review", f"Reviewed submission for Task ID {task.id} as {review.status}")
    return submission

# --- TEAM ANALYTICS ---
@router.get("/analytics")
def get_team_analytics(current_manager: User = Depends(require_manager_or_higher), db: Session = Depends(get_db)):
    if current_manager.role in ["HR", "Super Admin"]:
        team_members_count = db.query(User).filter(User.role == "Employee").count()
        project_ids = [p.id for p in db.query(Project).all()]
    else:
        # Get manager's team members
        teams = db.query(Team).filter(Team.manager_id == current_manager.id).all()
        team_ids = [t.id for t in teams]
        members = db.query(TeamMember).filter(TeamMember.team_id.in_(team_ids)).all()
        member_ids = list(set([m.employee_id for m in members]))
        team_members_count = len(member_ids)
        
        # Get manager's projects
        projects = db.query(Project).filter(Project.manager_id == current_manager.id).all()
        project_ids = [p.id for p in projects]

    # Task metrics
    total_tasks = db.query(Task).filter(Task.project_id.in_(project_ids)).count()
    completed_tasks = db.query(Task).filter(Task.project_id.in_(project_ids), Task.status == "Completed").count()
    in_progress_tasks = db.query(Task).filter(Task.project_id.in_(project_ids), Task.status == "In Progress").count()
    testing_tasks = db.query(Task).filter(Task.project_id.in_(project_ids), Task.status == "Testing").count()
    todo_tasks = db.query(Task).filter(Task.project_id.in_(project_ids), Task.status == "Todo").count()

    # Calculate average productivity score (based on task weights completed)
    # Let's say: score = (Sum(weight of completed tasks) / Sum(weight of all tasks)) * 100
    productivity_score = 100.0
    if total_tasks > 0:
        total_weight = db.query(Task.weight).filter(Task.project_id.in_(project_ids)).all()
        completed_weight = db.query(Task.weight).filter(Task.project_id.in_(project_ids), Task.status == "Completed").all()
        
        sum_total = sum(w[0] for w in total_weight)
        sum_comp = sum(w[0] for w in completed_weight)
        if sum_total > 0:
            productivity_score = (sum_comp / sum_total) * 100
            
    # Project progress percentage
    project_progress = {}
    for pid in project_ids:
        p = db.query(Project).filter(Project.id == pid).first()
        tasks_p = db.query(Task).filter(Task.project_id == pid).count()
        comp_p = db.query(Task).filter(Task.project_id == pid, Task.status == "Completed").count()
        progress = 100.0 if tasks_p == 0 else (comp_p / tasks_p) * 100
        project_progress[p.name] = int(progress)

    return {
        "team_size": team_members_count,
        "tasks": {
            "total": total_tasks,
            "completed": completed_tasks,
            "in_progress": in_progress_tasks,
            "testing": testing_tasks,
            "todo": todo_tasks
        },
        "productivity_score": int(productivity_score),
        "projects_progress": project_progress
    }
