# backend/app/routes/employee.py
import datetime
import os
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import User, EmployeeProfile, Department, Task, TaskSubmission, LeaveRequest, SalarySlip, AuditLog, Announcement
from ..schemas import UserResponse, TaskResponse, TaskSubmissionCreate, TaskSubmissionResponse, LeaveRequestCreate, LeaveRequestResponse
from ..auth import get_current_active_user

router = APIRouter(prefix="/api/employee", tags=["Employee Panel"])

# --- PROFILE SUMMARY ---
@router.get("/me", response_model=UserResponse)
def get_my_profile(current_user: User = Depends(get_current_active_user)):
    return current_user

# --- FIRST LOGIN ACKNOWLEDGEMENT ---
@router.put("/first-login")
def acknowledge_first_login(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    profile = current_user.profile
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Track acknowledgement by creating an audit log
    log = AuditLog(
        action="First Login Policy Agreement",
        user_id=current_user.id,
        details=f"Employee {current_user.email} agreed to company rules, regulations, and policies."
    )
    db.add(log)
    db.commit()
    return {"message": "Policy agreement acknowledged."}

# --- ASSIGNED TASKS & WORK SUBMISSION ---
@router.get("/tasks", response_model=List[TaskResponse])
def get_my_tasks(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    return db.query(Task).filter(Task.assigned_to == current_user.id).all()

@router.post("/tasks/{task_id}/submit", response_model=TaskSubmissionResponse)
def submit_task_work(task_id: int, submission: TaskSubmissionCreate, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id, Task.assigned_to == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not assigned to you")
        
    # Check if already submitted
    existing = db.query(TaskSubmission).filter(TaskSubmission.task_id == task_id, TaskSubmission.status == "Pending").first()
    if existing:
         raise HTTPException(status_code=400, detail="A submission is already pending review for this task")

    new_submission = TaskSubmission(
        task_id=task_id,
        github_link=submission.github_link,
        drive_link=submission.drive_link,
        notes=submission.notes,
        status="Pending",
        submitted_at=datetime.datetime.utcnow()
    )
    db.add(new_submission)
    
    # Update Task Status to 'Testing'
    task.status = "Testing"
    db.commit()
    db.refresh(new_submission)
    
    # Audit log
    audit = AuditLog(
        action="Task Submission",
        user_id=current_user.id,
        details=f"Submitted work for Task ID {task_id}: {task.title}"
    )
    db.add(audit)
    db.commit()
    
    return new_submission

# --- LEAVE MANAGEMENT ---
@router.post("/leaves", response_model=LeaveRequestResponse)
def apply_leave(leave: LeaveRequestCreate, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    profile = current_user.profile
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    days = (leave.end_date - leave.start_date).days + 1
    if days <= 0:
        raise HTTPException(status_code=400, detail="Invalid leave dates (end date must be after start date)")
        
    if profile.leave_balance < days:
        raise HTTPException(status_code=400, detail=f"Insufficient leave balance. Requested: {days}, Available: {profile.leave_balance}")

    new_request = LeaveRequest(
        employee_id=current_user.id,
        leave_type=leave.leave_type,
        start_date=leave.start_date,
        end_date=leave.end_date,
        reason=leave.reason,
        status="Pending",
        created_at=datetime.datetime.utcnow()
    )
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    
    return new_request

@router.get("/leaves", response_model=List[LeaveRequestResponse])
def get_my_leave_history(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    return db.query(LeaveRequest).filter(LeaveRequest.employee_id == current_user.id).order_by(LeaveRequest.created_at.desc()).all()

# --- EMPLOYEE LIFECYCLE TIMELINE ---
@router.get("/timeline")
def get_my_timeline(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    profile = current_user.profile
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    events = []
    
    # 1. Joining Date
    events.append({
        "date": profile.joining_date.strftime("%Y-%m-%d"),
        "title": "Joined the Company",
        "description": f"Formally appointed as {current_user.role} in the company.",
        "type": "join"
    })
    
    # 2. Salary Changes (slips issued or increments logged)
    slips = db.query(SalarySlip).filter(SalarySlip.employee_id == current_user.id).order_by(SalarySlip.issued_date.asc()).all()
    for s in slips:
        events.append({
            "date": s.issued_date.strftime("%Y-%m-%d"),
            "title": f"Payroll Disbursed ({s.pay_period})",
            "description": f"Received salary payment. Net transferred: ${s.net_salary:,.2f}.",
            "type": "salary"
        })
        
    # 3. Promotions/Department Changes (From AuditLogs)
    from sqlalchemy import or_
    audits = db.query(AuditLog).filter(
        or_(AuditLog.details.contains(current_user.email), AuditLog.user_id == current_user.id)
    ).order_by(AuditLog.timestamp.asc()).all()
    
    for a in audits:
        if ("Promotion" in a.action or "Status Change" in a.action) and current_user.email in a.details:
            events.append({
                "date": a.timestamp.strftime("%Y-%m-%d"),
                "title": a.action,
                "description": a.details,
                "type": "promotion"
            })
        elif "First Login Policy Agreement" in a.action:
            events.append({
                "date": a.timestamp.strftime("%Y-%m-%d"),
                "title": a.action,
                "description": a.details,
                "type": "agreement"
            })
            
    # Sort events by date newest-first
    events.sort(key=lambda x: x["date"], reverse=True)
    return events

@router.post("/upload-photo")
def employee_upload_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    profile = current_user.profile
    if not profile:
        raise HTTPException(status_code=404, detail="Employee profile not found")
        
    if profile.photo_locked:
        raise HTTPException(status_code=400, detail="Photo is locked and cannot be re-uploaded")
        
    # Read file extension
    ext = os.path.splitext(file.filename)[1]
    if ext.lower() not in [".jpg", ".jpeg", ".png"]:
        raise HTTPException(status_code=400, detail="Only JPG and PNG images are supported")
        
    # Save file with timestamp versioning
    import datetime
    timestamp_str = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"photo_{profile.employee_id}_{timestamp_str}{ext}"
    filepath = f"c:/project/backend/uploads/{filename}"
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    
    # Write file
    with open(filepath, "wb") as buffer:
        buffer.write(file.file.read())
        
    # Update profile fields
    profile.photo_url = f"/uploads/{filename}"
    profile.photo_uploaded_at = datetime.datetime.utcnow()
    profile.photo_locked = True
    
    # Create Audit Log entries
    log1 = AuditLog(
        action="PHOTO_UPLOADED",
        user_id=current_user.id,
        details=f"Employee: {profile.employee_id} uploaded official photo."
    )
    log2 = AuditLog(
        action="ID_CARD_GENERATED",
        user_id=current_user.id,
        details=f"Employee Smart ID Card generated for {profile.employee_id}."
    )
    db.add_all([log1, log2])
    db.commit()
    db.refresh(current_user)
    
    return {"photo_url": profile.photo_url}
