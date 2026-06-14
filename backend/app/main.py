# backend/app/main.py
import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, SessionLocal
from .config import settings
from .routes import auth, admin, hr, manager, employee, tickets, announcements, ai
from .models import User, EmployeeProfile, Department, Project, Task, Attendance, LeaveRequest, Ticket, Announcement
from .auth import get_password_hash

app = FastAPI(
    title="Enterprise AI Workforce Management Platform API",
    description="Backend API for Enterprise AI Workforce Management Platform",
    version="1.0.0"
)

# Enable CORS for React frontend communications
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(hr.router)
app.include_router(manager.router)
app.include_router(employee.router)
app.include_router(tickets.router)
app.include_router(announcements.router)
app.include_router(ai.router)

# Mount static file uploads folder
import os
from fastapi.staticfiles import StaticFiles
os.makedirs("c:/project/backend/uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="c:/project/backend/uploads"), name="uploads")

# Database Startup Seeding Routine
@app.on_event("startup")
def startup_db_setup():
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # 1. Seed Departments if empty
        if db.query(Department).count() == 0:
            eng = Department(name="Engineering & AI", code="ENG", description="Core software development and AI engineering team.")
            hr_dept = Department(name="Human Resources", code="HR", description="Employee relations, lifecycle, and compliance.")
            mkt = Department(name="Marketing & Growth", code="MKT", description="Enterprise sales, customer growth, and marketing.")
            db.add_all([eng, hr_dept, mkt])
            db.commit()
            print("Departments seeded.")
            
        eng_dept = db.query(Department).filter(Department.code == "ENG").first()
        hr_department = db.query(Department).filter(Department.code == "HR").first()

        # 2. Seed Default Accounts
        # Super Admin
        admin_user = db.query(User).filter(User.email == "admin@enterprise.ai").first()
        if not admin_user:
            admin_user = User(
                email="admin@enterprise.ai",
                password_hash=get_password_hash("admin123"),
                role="Super Admin",
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            print("Super Admin account created.")

        # HR
        hr_user = db.query(User).filter(User.email == "hr@enterprise.ai").first()
        if not hr_user:
            hr_user = User(
                email="hr@enterprise.ai",
                password_hash=get_password_hash("hr123"),
                role="HR",
                is_active=True
            )
            db.add(hr_user)
            db.commit()
            db.refresh(hr_user)
            
            hr_profile = EmployeeProfile(
                user_id=hr_user.id,
                employee_id="HR-101",
                first_name="Sarah",
                last_name="Connor",
                joining_date=datetime.date(2024, 1, 15),
                salary=85000.0,
                department_id=hr_department.id,
                status="active"
            )
            db.add(hr_profile)
            db.commit()
            print("HR account and profile created.")
            
        # Manager
        manager_user = db.query(User).filter(User.email == "manager@enterprise.ai").first()
        if not manager_user:
            manager_user = User(
                email="manager@enterprise.ai",
                password_hash=get_password_hash("manager123"),
                role="Manager",
                is_active=True
            )
            db.add(manager_user)
            db.commit()
            db.refresh(manager_user)
            
            manager_profile = EmployeeProfile(
                user_id=manager_user.id,
                employee_id="MGR-201",
                first_name="Marcus",
                last_name="Aurelius",
                joining_date=datetime.date(2023, 6, 1),
                salary=115000.0,
                department_id=eng_dept.id,
                status="active"
            )
            db.add(manager_profile)
            db.commit()
            print("Manager account and profile created.")

        # Employee
        emp_user = db.query(User).filter(User.email == "employee@enterprise.ai").first()
        if not emp_user:
            emp_user = User(
                email="employee@enterprise.ai",
                password_hash=get_password_hash("employee123"),
                role="Employee",
                is_active=True
            )
            db.add(emp_user)
            db.commit()
            db.refresh(emp_user)
            
            emp_profile = EmployeeProfile(
                user_id=emp_user.id,
                employee_id="EMP-301",
                first_name="Thomas",
                last_name="Anderson",
                joining_date=datetime.date(2025, 3, 10),
                salary=72000.0,
                department_id=eng_dept.id,
                manager_id=manager_user.id, # Thomas reports to Marcus
                leave_balance=22,
                status="active"
            )
            db.add(emp_profile)
            db.commit()
            print("Employee account and profile created.")

        # 3. Seed Projects & Tasks if empty
        if db.query(Project).count() == 0:
            proj = Project(
                name="Enterprise WMS AI Core",
                description="Core development for the Enterprise AI workforce management platform, focusing on multi-RAG, routing, and high fidelity dashboards.",
                manager_id=manager_user.id,
                status="Active",
                start_date=datetime.date(2026, 6, 1),
                end_date=datetime.date(2026, 8, 31)
            )
            db.add(proj)
            db.commit()
            db.refresh(proj)
            
            task1 = Task(
                project_id=proj.id,
                title="Design Multi-LLM Routing Fallback Framework",
                description="Implement the LLM router to handle fallback chain: Gemini -> Groq -> OpenRouter -> Local Qwen. Add usage logging.",
                assigned_to=emp_user.id,
                status="Completed",
                weight=3,
                due_date=datetime.date(2026, 6, 20)
            )
            task2 = Task(
                project_id=proj.id,
                title="Setup ChromaDB collections & write RAG routers",
                description="Build ChromaDB vector indices for HR handbook, Policy regulations, project requirements, and training material.",
                assigned_to=emp_user.id,
                status="In Progress",
                weight=4,
                due_date=datetime.date(2026, 6, 25)
            )
            task3 = Task(
                project_id=proj.id,
                title="Build Tailwind CSS UI Dashboard Mockups",
                description="Develop premium dark-themed navigation menu, sidebar components, and custom data charts for role access.",
                assigned_to=emp_user.id,
                status="Todo",
                weight=2,
                due_date=datetime.date(2026, 6, 28)
            )
            db.add_all([task1, task2, task3])
            db.commit()
            print("Projects and Tasks seeded.")

        # 4. Seed Attendance History if empty
        if db.query(Attendance).count() == 0:
            # Seed past 15 days of attendance
            today = datetime.date.today()
            for d in range(15):
                date_val = today - datetime.timedelta(days=d)
                # Exclude weekends
                if date_val.weekday() >= 5:
                    continue
                # Employee attendance
                clock_in = datetime.datetime.combine(date_val, datetime.time(9, int(5 + (d % 3)*10))) # alternating late/on time
                clock_out = datetime.datetime.combine(date_val, datetime.time(18, int(0 + (d % 2)*15)))
                status_str = "Present" if clock_in.minute < 30 else "Late"
                
                att = Attendance(
                    employee_id=emp_user.id,
                    date=date_val,
                    clock_in=clock_in,
                    clock_out=clock_out,
                    total_hours=8.5 + (d % 2)*0.5,
                    status=status_str
                )
                db.add(att)
            db.commit()
            print("Attendance history seeded.")

        # 5. Seed Announcements if empty
        if db.query(Announcement).count() == 0:
            ann1 = Announcement(
                title="New Hybrid Work Policy Update",
                content="Effective immediately, all teams are authorized to work hybrid (remote 2 days, office 3 days a week). Please coordinate schedules with your respective department managers to maintain coverage.",
                type="General"
            )
            ann2 = Announcement(
                title="Congratulations on Q2 Milestones!",
                content="A big shout out to the Engineering and AI team for delivering the RAG vector search prototype ahead of schedule! Keep up the incredible work.",
                type="Award"
            )
            db.add_all([ann1, ann2])
            db.commit()
            print("Announcements seeded.")

        # 6. Seed Tickets if empty
        if db.query(Ticket).count() == 0:
            ticket = Ticket(
                employee_id=emp_user.id,
                category="Device",
                title="Dual Monitor request for Development",
                description="Requesting a second 27-inch monitor for backend system engineering. Having double monitors would help with debugging logs and editing schemas side-by-side.",
                status="Open"
            )
            db.add(ticket)
            db.commit()
            print("Tickets seeded.")

    except Exception as e:
        print("Startup seeding failed:", e)
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "Welcome to the Enterprise AI Workforce Management Platform API!"}
