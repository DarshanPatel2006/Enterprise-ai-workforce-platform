# backend/app/models.py
import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False) # "Super Admin", "HR", "Manager", "Employee"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    profile = relationship("EmployeeProfile", back_populates="user", uselist=False, cascade="all, delete-orphan", foreign_keys="EmployeeProfile.user_id")
    audit_logs = relationship("AuditLog", back_populates="user")
    tickets = relationship("Ticket", back_populates="employee")
    leaves = relationship("LeaveRequest", foreign_keys="LeaveRequest.employee_id", back_populates="employee")
    attendances = relationship("Attendance", back_populates="employee")
    assigned_tasks = relationship("Task", back_populates="assignee")

class Department(Base):
    __tablename__ = "departments"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    code = Column(String(20), unique=True, nullable=False) # e.g., "HR", "ENG", "MKT"
    description = Column(String(255))
    
    # Relationships
    employees = relationship("EmployeeProfile", back_populates="department")

class EmployeeProfile(Base):
    __tablename__ = "employee_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    employee_id = Column(String(50), unique=True, nullable=False, index=True) # ID-001
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    joining_date = Column(Date, nullable=False)
    salary = Column(Float, default=0.0)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    manager_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True) # Manager's User ID
    leave_balance = Column(Integer, default=24) # Leaves left in year
    attendance_percentage = Column(Float, default=100.0)
    status = Column(String(30), default="active") # active, suspended, terminated, retired
    photo_url = Column(String(255), nullable=True)
    photo_uploaded_at = Column(DateTime, nullable=True)
    photo_locked = Column(Boolean, default=False)
    blood_group = Column(String(10), nullable=True)
    office_location = Column(String(100), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="profile", foreign_keys=[user_id])
    department = relationship("Department", back_populates="employees")
    manager = relationship("User", foreign_keys=[manager_id])

class Team(Base):
    __tablename__ = "teams"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    manager_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True) # Manager's User ID
    
    # Relationships
    manager = relationship("User")
    members = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")

class TeamMember(Base):
    __tablename__ = "team_members"
    
    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    employee_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False) # Employee's User ID
    
    # Relationships
    team = relationship("Team", back_populates="members")
    employee = relationship("User")

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    manager_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True) # Project Manager User ID
    status = Column(String(50), default="Planning") # Planning, Active, Testing, Completed, On Hold
    start_date = Column(Date)
    end_date = Column(Date)
    
    # Relationships
    manager = relationship("User")
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(150), nullable=False)
    description = Column(Text)
    assigned_to = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True) # Employee User ID
    status = Column(String(50), default="Todo") # Todo, In Progress, Testing, Completed
    weight = Column(Integer, default=1) # Contribution weight (1-5) for productivity calculations
    due_date = Column(Date)
    
    # Relationships
    project = relationship("Project", back_populates="tasks")
    assignee = relationship("User", back_populates="assigned_tasks")
    submissions = relationship("TaskSubmission", back_populates="task", cascade="all, delete-orphan")

class TaskSubmission(Base):
    __tablename__ = "task_submissions"
    
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    github_link = Column(String(255))
    drive_link = Column(String(255))
    doc_path = Column(String(255)) # Local path to documentation
    zip_path = Column(String(255)) # Local path to ZIP file
    notes = Column(Text)
    status = Column(String(50), default="Pending") # Pending, Approved, Reject, Changes Requested
    reviewer_feedback = Column(Text)
    submitted_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    task = relationship("Task", back_populates="submissions")

class Attendance(Base):
    __tablename__ = "attendances"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False, default=datetime.date.today)
    clock_in = Column(DateTime)
    clock_out = Column(DateTime)
    total_hours = Column(Float, default=0.0)
    status = Column(String(50), default="Present") # Present, Late, Absent
    
    # Relationships
    employee = relationship("User", back_populates="attendances")

class LeaveRequest(Base):
    __tablename__ = "leave_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    leave_type = Column(String(50), nullable=False) # Sick, Casual, Annual, Unpaid
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(String(50), default="Pending") # Pending, Approved, Rejected
    responder_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True) # HR User ID
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    employee = relationship("User", foreign_keys=[employee_id], back_populates="leaves")
    responder = relationship("User", foreign_keys=[responder_id])

class SalarySlip(Base):
    __tablename__ = "salary_slips"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    base_salary = Column(Float, nullable=False)
    bonus = Column(Float, default=0.0)
    deductions = Column(Float, default=0.0)
    net_salary = Column(Float, nullable=False)
    pay_period = Column(String(50), nullable=False) # e.g., "June 2026"
    issued_date = Column(Date, default=datetime.date.today)
    
    # Relationships
    employee = relationship("User")

class Announcement(Base):
    __tablename__ = "announcements"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    content = Column(Text, nullable=False)
    type = Column(String(50), default="General") # General, Promotion, Increment, Award
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    metadata_json = Column(Text, nullable=True) # Stores JSON formatted change details e.g., salary increment numbers

class Ticket(Base):
    __tablename__ = "tickets"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category = Column(String(50), nullable=False) # Salary, Attendance, Leave, Device, General
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(50), default="Open") # Open, In Progress, Resolved, Closed
    response = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Relationships
    employee = relationship("User", back_populates="tickets")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    action = Column(String(100), nullable=False) # e.g., "Salary Change", "Employee Creation"
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True) # Initiator User ID
    details = Column(Text)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")

class AIUsageLog(Base):
    __tablename__ = "ai_usage_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    model_used = Column(String(50), nullable=False)
    query = Column(Text, nullable=False)
    response = Column(Text)
    response_time_ms = Column(Integer)
    tokens_used = Column(Integer, default=0)
    fallback_occurred = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
