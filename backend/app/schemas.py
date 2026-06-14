# backend/app/schemas.py
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import datetime

# --- AUTH SCHEMAS ---
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    email: str
    name: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# --- DEPARTMENT SCHEMAS ---
class DepartmentBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentResponse(DepartmentBase):
    id: int
    class Config:
        from_attributes = True

# --- EMPLOYEE PROFILE SCHEMAS ---
class EmployeeProfileBase(BaseModel):
    employee_id: str
    first_name: str
    last_name: str
    joining_date: datetime.date
    salary: float
    department_id: Optional[int] = None
    manager_id: Optional[int] = None
    leave_balance: int = 24
    attendance_percentage: float = 100.0
    status: str = "active"
    photo_url: Optional[str] = None
    photo_uploaded_at: Optional[datetime.datetime] = None
    photo_locked: bool = False
    blood_group: Optional[str] = None
    office_location: Optional[str] = None

class EmployeeProfileCreate(EmployeeProfileBase):
    email: EmailStr
    password: str
    role: str = "Employee"

class EmployeeProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    salary: Optional[float] = None
    department_id: Optional[int] = None
    manager_id: Optional[int] = None
    leave_balance: Optional[int] = None
    attendance_percentage: Optional[float] = None
    status: Optional[str] = None
    role: Optional[str] = None
    photo_url: Optional[str] = None
    photo_uploaded_at: Optional[datetime.datetime] = None
    photo_locked: Optional[bool] = None
    blood_group: Optional[str] = None
    office_location: Optional[str] = None

class EmployeeProfileResponse(EmployeeProfileBase):
    id: int
    user_id: int
    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    role: str
    is_active: bool
    profile: Optional[EmployeeProfileResponse] = None
    class Config:
        from_attributes = True

# --- TEAM SCHEMAS ---
class TeamMemberBase(BaseModel):
    employee_id: int

class TeamBase(BaseModel):
    name: str
    manager_id: int

class TeamCreate(TeamBase):
    member_ids: List[int] = []

class TeamResponse(TeamBase):
    id: int
    class Config:
        from_attributes = True

# --- PROJECT SCHEMAS ---
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    manager_id: Optional[int] = None
    status: str = "Planning"
    start_date: Optional[datetime.date] = None
    end_date: Optional[datetime.date] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectResponse(ProjectBase):
    id: int
    class Config:
        from_attributes = True

# --- TASK SCHEMAS ---
class TaskBase(BaseModel):
    project_id: int
    title: str
    description: Optional[str] = None
    assigned_to: Optional[int] = None
    status: str = "Todo"
    weight: int = 1
    due_date: Optional[datetime.date] = None

class TaskCreate(TaskBase):
    pass

class TaskResponse(TaskBase):
    id: int
    class Config:
        from_attributes = True

class TaskSubmissionCreate(BaseModel):
    github_link: Optional[str] = None
    drive_link: Optional[str] = None
    notes: Optional[str] = None

class TaskSubmissionResponse(BaseModel):
    id: int
    task_id: int
    github_link: Optional[str] = None
    drive_link: Optional[str] = None
    doc_path: Optional[str] = None
    zip_path: Optional[str] = None
    notes: Optional[str] = None
    status: str
    reviewer_feedback: Optional[str] = None
    submitted_at: datetime.datetime
    class Config:
        from_attributes = True

class TaskSubmissionReview(BaseModel):
    status: str # Approved, Reject, Changes Requested
    reviewer_feedback: str

# --- ATTENDANCE SCHEMAS ---
class AttendanceResponse(BaseModel):
    id: int
    employee_id: int
    date: datetime.date
    clock_in: Optional[datetime.datetime] = None
    clock_out: Optional[datetime.datetime] = None
    total_hours: float
    status: str
    class Config:
        from_attributes = True

# --- LEAVE SCHEMAS ---
class LeaveRequestBase(BaseModel):
    leave_type: str
    start_date: datetime.date
    end_date: datetime.date
    reason: str

class LeaveRequestCreate(LeaveRequestBase):
    pass

class LeaveRequestResolve(BaseModel):
    status: str # Approved, Rejected

class LeaveRequestResponse(LeaveRequestBase):
    id: int
    employee_id: int
    status: str
    responder_id: Optional[int] = None
    created_at: datetime.datetime
    class Config:
        from_attributes = True

# --- SALARY SLIP SCHEMAS ---
class SalarySlipCreate(BaseModel):
    employee_id: int
    base_salary: float
    bonus: float = 0.0
    deductions: float = 0.0
    pay_period: str

class SalarySlipResponse(BaseModel):
    id: int
    employee_id: int
    base_salary: float
    bonus: float
    deductions: float
    net_salary: float
    pay_period: str
    issued_date: datetime.date
    class Config:
        from_attributes = True

class SalaryIncrementRequest(BaseModel):
    increment_amount: float
    effective_date: datetime.date

# --- ANNOUNCEMENT SCHEMAS ---
class AnnouncementCreate(BaseModel):
    title: str
    content: str
    type: str = "General" # General, Promotion, Increment, Award
    metadata_json: Optional[str] = None

class AnnouncementResponse(AnnouncementCreate):
    id: int
    created_at: datetime.datetime
    class Config:
        from_attributes = True

# --- TICKET SCHEMAS ---
class TicketCreate(BaseModel):
    category: str
    title: str
    description: str

class TicketResolve(BaseModel):
    response: str
    status: str = "Resolved" # Resolved, Closed

class TicketResponse(TicketCreate):
    id: int
    employee_id: int
    status: str
    response: Optional[str] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime
    class Config:
        from_attributes = True

# --- AUDIT & AI LOG SCHEMAS ---
class AuditLogResponse(BaseModel):
    id: int
    action: str
    user_id: Optional[int] = None
    details: Optional[str] = None
    timestamp: datetime.datetime
    class Config:
        from_attributes = True

class AIUsageLogResponse(BaseModel):
    id: int
    model_used: str
    query: str
    response: Optional[str] = None
    response_time_ms: int
    tokens_used: int
    fallback_occurred: bool
    timestamp: datetime.datetime
    class Config:
        from_attributes = True

# --- AI WORKSPACE SCHEMAS ---
class AIChatQuery(BaseModel):
    query: str

class AIChatResponse(BaseModel):
    answer: str
    rag_source: str
    model_used: str

class MeetingAssistantResponse(BaseModel):
    summary: str
    action_items: List[str]
    deadlines: List[str]
    key_decisions: List[str]

class CareerRoadmapResponse(BaseModel):
    current_role: str
    next_role: str
    required_skills: List[str]
    skill_gap_analysis: str
    learning_path: List[str]
    promotion_readiness: str
    improvement_suggestions: List[str]
