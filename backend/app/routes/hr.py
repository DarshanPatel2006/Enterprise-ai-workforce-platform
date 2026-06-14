# backend/app/routes/hr.py
import datetime
import os
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import User, EmployeeProfile, Department, Attendance, LeaveRequest, SalarySlip, AuditLog, Announcement
from ..schemas import UserResponse, EmployeeProfileCreate, EmployeeProfileUpdate, LeaveRequestResponse, LeaveRequestResolve, SalarySlipResponse, SalarySlipCreate, AttendanceResponse
from ..auth import require_hr_or_admin, get_password_hash, get_current_active_user
from ..ai.document_generator import generate_pdf_document

router = APIRouter(prefix="/api/hr", tags=["HR Panel"])

def log_hr_action(db: Session, hr_id: int, action: str, details: str):
    log = AuditLog(action=action, user_id=hr_id, details=details)
    db.add(log)
    db.commit()

# --- EMPLOYEE MANAGEMENT ---
@router.post("/employees", response_model=UserResponse)
def create_employee(emp_data: EmployeeProfileCreate, current_hr: User = Depends(require_hr_or_admin), db: Session = Depends(get_db)):
    # Enforce role validation
    if current_hr.role == "HR":
        if emp_data.role not in ["Employee", "Manager"]:
            raise HTTPException(status_code=403, detail="HR cannot create HR or Super Admin accounts")

    # Check email and employee id
    existing_user = db.query(User).filter(User.email == emp_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    existing_profile = db.query(EmployeeProfile).filter(EmployeeProfile.employee_id == emp_data.employee_id).first()
    if existing_profile:
        raise HTTPException(status_code=400, detail="Employee ID already exists")

    # Create User
    new_user = User(
        email=emp_data.email,
        password_hash=get_password_hash(emp_data.password),
        role=emp_data.role, # Employee or Manager
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create Profile
    new_profile = EmployeeProfile(
        user_id=new_user.id,
        employee_id=emp_data.employee_id,
        first_name=emp_data.first_name,
        last_name=emp_data.last_name,
        joining_date=emp_data.joining_date,
        salary=emp_data.salary,
        department_id=emp_data.department_id,
        manager_id=emp_data.manager_id,
        leave_balance=emp_data.leave_balance,
        attendance_percentage=100.0,
        status="active",
        blood_group=emp_data.blood_group,
        office_location=emp_data.office_location
    )
    db.add(new_profile)
    db.commit()
    db.refresh(new_user)
    
    log_hr_action(db, current_hr.id, "Employee Creation", f"Created employee profile: {emp_data.email} as {emp_data.role}")
    return new_user

@router.get("/employees", response_model=List[UserResponse])
def list_employees(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    if current_user.role == "HR":
        return db.query(User).filter(User.role.in_(["Employee", "Manager"])).all()
    return db.query(User).filter(User.role.in_(["Employee", "Manager", "HR"])).all()

@router.put("/employees/{user_id}", response_model=UserResponse)
def update_employee(user_id: int, emp_update: EmployeeProfileUpdate, current_hr: User = Depends(require_hr_or_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    # Enforce HR limits
    if current_hr.role == "HR":
        if user.role in ["HR", "Super Admin"]:
            raise HTTPException(status_code=403, detail="HR cannot modify HR or Super Admin accounts")
        if emp_update.role and emp_update.role in ["HR", "Super Admin"]:
            raise HTTPException(status_code=403, detail="HR cannot assign HR or Super Admin roles")

    profile = user.profile
    if not profile:
        raise HTTPException(status_code=404, detail="Profile record missing")
        
    # Update user role if changed
    if emp_update.role:
        user.role = emp_update.role
        
    # Update profile fields
    for field, value in emp_update.dict(exclude_unset=True).items():
        if field == "role":
            continue
        if hasattr(profile, field):
            setattr(profile, field, value)
            
    db.commit()
    db.refresh(user)
    log_hr_action(db, current_hr.id, "Employee Update", f"Updated employee profile for User ID {user_id}")
    return user

@router.put("/employees/{user_id}/toggle", response_model=UserResponse)
def toggle_employee_active(user_id: int, current_hr: User = Depends(require_hr_or_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    if current_hr.role == "HR" and user.role in ["HR", "Super Admin"]:
        raise HTTPException(status_code=403, detail="HR cannot modify HR or Super Admin accounts")
        
    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    
    state = "activated" if user.is_active else "deactivated"
    log_hr_action(db, current_hr.id, "Employee Status Change", f"Toggled status of user {user.email} to {state}")
    return user

@router.delete("/employees/{user_id}")
def delete_employee(user_id: int, current_hr: User = Depends(require_hr_or_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    if current_hr.role == "HR" and user.role in ["HR", "Super Admin"]:
        raise HTTPException(status_code=403, detail="HR cannot delete HR or Super Admin accounts")
        
    email = user.email
    db.delete(user)
    db.commit()
    
    log_hr_action(db, current_hr.id, "Employee Deletion", f"Deleted employee account: {email}")
    return {"message": "Employee deleted successfully"}

# --- SALARY MANAGEMENT ---
@router.post("/salaries/slips", response_model=SalarySlipResponse)
def generate_salary_slip(slip_data: SalarySlipCreate, current_hr: User = Depends(require_hr_or_admin), db: Session = Depends(get_db)):
    if current_hr.role == "HR":
        target_user = db.query(User).filter(User.id == slip_data.employee_id).first()
        if target_user and target_user.role in ["HR", "Super Admin"]:
            raise HTTPException(status_code=403, detail="HR cannot manage salaries for HR or Super Admin accounts")

    # Calculate net salary
    net_salary = slip_data.base_salary + slip_data.bonus - slip_data.deductions
    new_slip = SalarySlip(
        employee_id=slip_data.employee_id,
        base_salary=slip_data.base_salary,
        bonus=slip_data.bonus,
        deductions=slip_data.deductions,
        net_salary=net_salary,
        pay_period=slip_data.pay_period,
        issued_date=datetime.date.today()
    )
    db.add(new_slip)
    db.commit()
    db.refresh(new_slip)
    
    log_hr_action(db, current_hr.id, "Salary Slip Issued", f"Generated salary slip for User ID {slip_data.employee_id} for period {slip_data.pay_period}")
    return new_slip

@router.get("/salaries/history/{employee_id}", response_model=List[SalarySlipResponse])
def get_salary_history(employee_id: int, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    if current_user.role == "HR":
        target_user = db.query(User).filter(User.id == employee_id).first()
        if target_user and target_user.role in ["HR", "Super Admin"]:
            raise HTTPException(status_code=403, detail="HR cannot view salaries for HR or Super Admin accounts")
    return db.query(SalarySlip).filter(SalarySlip.employee_id == employee_id).order_by(SalarySlip.issued_date.desc()).all()

# --- LEAVE APPLICATIONS ---
@router.get("/leaves", response_model=List[LeaveRequestResponse])
def list_leave_requests(current_hr: User = Depends(require_hr_or_admin), db: Session = Depends(get_db)):
    return db.query(LeaveRequest).order_by(LeaveRequest.created_at.desc()).all()

@router.put("/leaves/{leave_id}/resolve", response_model=LeaveRequestResponse)
def resolve_leave_request(leave_id: int, action: LeaveRequestResolve, current_hr: User = Depends(require_hr_or_admin), db: Session = Depends(get_db)):
    req = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Leave request not found")
        
    if req.status != "Pending":
        raise HTTPException(status_code=400, detail="Leave request already resolved")
        
    req.status = action.status
    req.responder_id = current_hr.id
    
    # Deduct leave balance if approved
    if action.status == "Approved":
        profile = db.query(EmployeeProfile).filter(EmployeeProfile.user_id == req.employee_id).first()
        if profile:
            days = (req.end_date - req.start_date).days + 1
            profile.leave_balance = max(0, profile.leave_balance - days)
            
    db.commit()
    db.refresh(req)
    
    # Create system announcement for leave approval/rejection (optional/audit)
    log_hr_action(db, current_hr.id, "Leave Approval", f"Leave request ID {leave_id} resolved as {action.status}")
    return req

# --- ATTENDANCE SUMMARY ---
@router.get("/attendance", response_model=List[AttendanceResponse])
def list_attendance_records(date: Optional[datetime.date] = None, db: Session = Depends(get_db)):
    query = db.query(Attendance)
    if date:
        query = query.filter(Attendance.date == date)
    return query.order_by(Attendance.date.desc(), Attendance.clock_in.desc()).all()

# --- DOCUMENT INTELLIGENCE / LETTER GENERATION ---
@router.post("/documents/generate")
def generate_hr_document(letter_type: str, emp_id: int, additional_info: dict, current_hr: User = Depends(require_hr_or_admin), db: Session = Depends(get_db)):
    emp = db.query(User).filter(User.id == emp_id).first()
    if not emp or not emp.profile:
        raise HTTPException(status_code=404, detail="Employee profile not found")
        
    profile = emp.profile
    data = {
        "name": f"{profile.first_name} {profile.last_name}",
        "role": emp.role,
        "salary": f"{profile.salary:,.2f}",
        "joining_date": profile.joining_date.strftime("%B %d, %Y")
    }
    # Update with custom metadata (like old_role, reason, area, etc.)
    data.update(additional_info)
    
    filename = f"{letter_type.lower()}_letter_{profile.employee_id}_{datetime.date.today().strftime('%Y%m%d')}.pdf"
    filepath = generate_pdf_document(letter_type, data, filename)
    
    log_hr_action(db, current_hr.id, "Document Generation", f"Generated {letter_type} document for {data['name']}")
    
    if os.path.exists(filepath):
        return FileResponse(
            filepath, 
            media_type="application/pdf", 
            filename=filename
        )
    else:
        raise HTTPException(status_code=500, detail="Failed to locate generated document file.")

@router.post("/employees/{user_id}/upload-photo")
def hr_upload_employee_photo(
    user_id: int,
    file: UploadFile = File(...),
    current_hr: User = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.profile:
        raise HTTPException(status_code=404, detail="Employee profile not found")
    
    # If initiator is HR, check that target is not HR/Admin
    if current_hr.role == "HR" and user.role in ["HR", "Super Admin"]:
        raise HTTPException(status_code=403, detail="HR cannot modify photos for HR or Super Admin accounts")
    
    # Read file extension
    ext = os.path.splitext(file.filename)[1]
    if ext.lower() not in [".jpg", ".jpeg", ".png"]:
        raise HTTPException(status_code=400, detail="Only JPG and PNG images are supported")
    
    # Save file with timestamp versioning
    timestamp_str = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"photo_{user.profile.employee_id}_{timestamp_str}{ext}"
    filepath = f"c:/project/backend/uploads/{filename}"
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    
    # Write file
    with open(filepath, "wb") as buffer:
        buffer.write(file.file.read())
    
    # Update profile
    user.profile.photo_url = f"/uploads/{filename}"
    user.profile.photo_uploaded_at = datetime.datetime.utcnow()
    user.profile.photo_locked = True
    
    # Log Audit Action: PHOTO_UPDATED
    log = AuditLog(
        action="PHOTO_UPDATED",
        user_id=current_hr.id,
        details=f"Employee: {user.profile.employee_id} | Updated By: {current_hr.profile.employee_id if current_hr.profile else 'Admin'}"
    )
    db.add(log)
    db.commit()
    db.refresh(user)
    
    return {"photo_url": user.profile.photo_url}
