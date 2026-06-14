# backend/app/routes/admin.py
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import User, EmployeeProfile, Department, AuditLog, AIUsageLog, Attendance, LeaveRequest
from ..schemas import UserResponse, EmployeeProfileCreate, DepartmentCreate, DepartmentResponse, AuditLogResponse, AIUsageLogResponse
from ..auth import require_super_admin, get_password_hash

router = APIRouter(prefix="/api/admin", tags=["Super Admin Panel"])

def log_admin_action(db: Session, admin_id: int, action: str, details: str):
    log = AuditLog(action=action, user_id=admin_id, details=details)
    db.add(log)
    db.commit()

# --- HR ACCOUNTS MANAGEMENT ---
@router.post("/hr", response_model=UserResponse)
def create_hr_account(hr_data: EmployeeProfileCreate, current_admin: User = Depends(require_super_admin), db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == hr_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    existing_profile = db.query(EmployeeProfile).filter(EmployeeProfile.employee_id == hr_data.employee_id).first()
    if existing_profile:
        raise HTTPException(status_code=400, detail="Employee ID already exists")

    # Create User
    new_user = User(
        email=hr_data.email,
        password_hash=get_password_hash(hr_data.password),
        role="HR",
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create Employee Profile for HR
    new_profile = EmployeeProfile(
        user_id=new_user.id,
        employee_id=hr_data.employee_id,
        first_name=hr_data.first_name,
        last_name=hr_data.last_name,
        joining_date=hr_data.joining_date,
        salary=hr_data.salary,
        department_id=hr_data.department_id,
        manager_id=hr_data.manager_id,
        status="active"
    )
    db.add(new_profile)
    db.commit()
    db.refresh(new_user)
    
    log_admin_action(db, current_admin.id, "HR Creation", f"Created HR account: {hr_data.email} ({hr_data.first_name} {hr_data.last_name})")
    return new_user

@router.put("/hr/{user_id}/toggle", response_model=UserResponse)
def toggle_hr_status(user_id: int, current_admin: User = Depends(require_super_admin), db: Session = Depends(get_db)):
    hr_user = db.query(User).filter(User.id == user_id, User.role == "HR").first()
    if not hr_user:
        raise HTTPException(status_code=404, detail="HR account not found")
        
    hr_user.is_active = not hr_user.is_active
    db.commit()
    db.refresh(hr_user)
    
    status_str = "activated" if hr_user.is_active else "disabled"
    log_admin_action(db, current_admin.id, "HR Status Change", f"HR user {hr_user.email} status toggled to {status_str}")
    return hr_user

# --- DEPARTMENT MANAGEMENT ---
@router.post("/departments", response_model=DepartmentResponse)
def create_department(dept: DepartmentCreate, current_admin: User = Depends(require_super_admin), db: Session = Depends(get_db)):
    existing_dept = db.query(Department).filter((Department.name == dept.name) | (Department.code == dept.code)).first()
    if existing_dept:
        raise HTTPException(status_code=400, detail="Department name or code already exists")
        
    new_dept = Department(
        name=dept.name,
        code=dept.code.upper(),
        description=dept.description
    )
    db.add(new_dept)
    db.commit()
    db.refresh(new_dept)
    
    log_admin_action(db, current_admin.id, "Department Creation", f"Created Department: {new_dept.name} ({new_dept.code})")
    return new_dept

@router.get("/departments", response_model=List[DepartmentResponse])
def get_departments(db: Session = Depends(get_db)):
    return db.query(Department).all()

@router.delete("/departments/{dept_id}")
def delete_department(dept_id: int, current_admin: User = Depends(require_super_admin), db: Session = Depends(get_db)):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
        
    db.delete(dept)
    db.commit()
    log_admin_action(db, current_admin.id, "Department Deletion", f"Deleted Department ID {dept_id}")
    return {"message": "Department deleted successfully"}

# --- SYSTEM AUDIT & AI LOGS ---
@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(current_admin: User = Depends(require_super_admin), db: Session = Depends(get_db)):
    return db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(100).all()

@router.get("/ai-logs", response_model=List[AIUsageLogResponse])
def get_ai_logs(current_admin: User = Depends(require_super_admin), db: Session = Depends(get_db)):
    return db.query(AIUsageLog).order_by(AIUsageLog.timestamp.desc()).limit(100).all()

# --- ADMINISTRATIVE ANALYTICS DASHBOARD ---
@router.get("/analytics")
def get_admin_analytics(current_admin: User = Depends(require_super_admin), db: Session = Depends(get_db)):
    total_employees = db.query(User).filter(User.role == "Employee").count()
    active_employees = db.query(User).filter(User.role == "Employee", User.is_active == True).count()
    total_departments = db.query(Department).count()
    
    # Simple attendance stats: count present today
    today = datetime.date.today()
    present_today = db.query(Attendance).filter(Attendance.date == today, Attendance.status == "Present").count()
    late_today = db.query(Attendance).filter(Attendance.date == today, Attendance.status == "Late").count()
    
    # Leave status counts
    pending_leaves = db.query(LeaveRequest).filter(LeaveRequest.status == "Pending").count()
    approved_leaves = db.query(LeaveRequest).filter(LeaveRequest.status == "Approved").count()
    
    # AI Stats
    total_ai_calls = db.query(AIUsageLog).count()
    fallback_calls = db.query(AIUsageLog).filter(AIUsageLog.fallback_occurred == True).count()
    avg_response_time = 0.0
    if total_ai_calls > 0:
        times = db.query(AIUsageLog.response_time_ms).all()
        avg_response_time = sum(t[0] for t in times) / total_ai_calls
        
    return {
        "total_employees": total_employees + db.query(User).filter(User.role == "HR").count() + db.query(User).filter(User.role == "Manager").count(),
        "active_employees": active_employees + db.query(User).filter(User.role == "HR", User.is_active == True).count() + db.query(User).filter(User.role == "Manager", User.is_active == True).count(),
        "departments_count": total_departments,
        "attendance_today": {
            "present": present_today,
            "late": late_today,
            "absent": max(0, active_employees - present_today - late_today)
        },
        "leaves": {
            "pending": pending_leaves,
            "approved": approved_leaves
        },
        "ai_usage": {
            "total_calls": total_ai_calls,
            "fallback_calls": fallback_calls,
            "avg_response_time_ms": int(avg_response_time)
        }
    }
