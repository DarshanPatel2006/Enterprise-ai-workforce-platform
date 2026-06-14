# backend/tests/test_flow.py
import pytest
from fastapi.testclient import TestClient
from app.main import app, startup_db_setup
from app.database import SessionLocal
from app.models import User, Department, Project

client = TestClient(app)

def test_database_seeding():
    # Fire database creation and seeding
    startup_db_setup()
    
    # Verify default database tables are pre-seeded upon FastAPI app startup
    db = SessionLocal()
    try:
        # Check departments
        dept_count = db.query(Department).count()
        assert dept_count > 0, "No departments were seeded during startup"
        
        # Check users
        admin = db.query(User).filter(User.email == "admin@enterprise.ai").first()
        assert admin is not None, "Admin user email was not seeded"
        assert admin.role == "Super Admin", "Admin user role is incorrect"

        hr = db.query(User).filter(User.email == "hr@enterprise.ai").first()
        assert hr is not None, "HR user email was not seeded"
        
        mgr = db.query(User).filter(User.email == "manager@enterprise.ai").first()
        assert mgr is not None, "Manager user email was not seeded"
        
        emp = db.query(User).filter(User.email == "employee@enterprise.ai").first()
        assert emp is not None, "Employee user email was not seeded"
    finally:
        db.close()

def test_user_logins():
    # 1. Test Super Admin login
    res = client.post("/api/auth/login", json={"email": "admin@enterprise.ai", "password": "admin123"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["role"] == "Super Admin"

    # 2. Test HR login
    res = client.post("/api/auth/login", json={"email": "hr@enterprise.ai", "password": "hr123"})
    assert res.status_code == 200
    assert res.json()["role"] == "HR"

    # 3. Test Manager login
    res = client.post("/api/auth/login", json={"email": "manager@enterprise.ai", "password": "manager123"})
    assert res.status_code == 200
    assert res.json()["role"] == "Manager"

    # 4. Test Employee login
    res = client.post("/api/auth/login", json={"email": "employee@enterprise.ai", "password": "employee123"})
    assert res.status_code == 200
    assert res.json()["role"] == "Employee"

    # 5. Test Invalid Login
    res = client.post("/api/auth/login", json={"email": "employee@enterprise.ai", "password": "wrongpassword"})
    assert res.status_code == 401

def test_rag_query_routing():
    # Login as employee to get token
    login_res = client.post("/api/auth/login", json={"email": "employee@enterprise.ai", "password": "employee123"})
    token = login_res.json()["access_token"]
    
    # Send RAG chat request
    headers = {"Authorization": f"Bearer {token}"}
    res = client.post("/api/ai/chat", json={"query": "How many days of leave do I get?"}, headers=headers)
    
    assert res.status_code == 200
    data = res.json()
    assert "answer" in data
    assert "rag_source" in data
    assert "model_used" in data
    assert len(data["answer"]) > 10

def test_employee_first_login_and_timeline():
    # Login as employee
    login_res = client.post("/api/auth/login", json={"email": "employee@enterprise.ai", "password": "employee123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Fetch timeline and verify initial state (if not already agreed in pre-seeded DB)
    res = client.get("/api/employee/timeline", headers=headers)
    assert res.status_code == 200
    
    # 2. Call first-login acknowledgment PUT
    res = client.put("/api/employee/first-login", headers=headers)
    assert res.status_code == 200
    assert res.json()["message"] == "Policy agreement acknowledged."
    
    # 3. Fetch timeline again and assert "First Login Policy Agreement" IS present
    res = client.get("/api/employee/timeline", headers=headers)
    assert res.status_code == 200
    timeline = res.json()
    assert any(e["title"] == "First Login Policy Agreement" for e in timeline)

def test_hr_role_restrictions_and_photo_flow():
    # 1. Login as HR
    hr_login = client.post("/api/auth/login", json={"email": "hr@enterprise.ai", "password": "hr123"})
    assert hr_login.status_code == 200
    hr_token = hr_login.json()["access_token"]
    hr_headers = {"Authorization": f"Bearer {hr_token}"}

    # 2. Login as Super Admin
    admin_login = client.post("/api/auth/login", json={"email": "admin@enterprise.ai", "password": "admin123"})
    assert admin_login.status_code == 200
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 3. Create a test HR user using Admin token (HR cannot create HR)
    hr_create_payload = {
        "employee_id": "EMP-TESTHR",
        "email": "testhr@enterprise.ai",
        "password": "testhrpassword",
        "first_name": "Test",
        "last_name": "HR",
        "role": "HR",
        "joining_date": "2026-06-14",
        "salary": 65000.0,
        "blood_group": "B+",
        "office_location": "Remote"
    }
    res = client.post("/api/admin/hr", json=hr_create_payload, headers=admin_headers)
    if res.status_code != 200:
        res = client.post("/api/hr/employees", json=hr_create_payload, headers=admin_headers)
    assert res.status_code == 200
    testhr_id = res.json()["id"]

    # 4. Verify that HR user gets 403 when modifying the new HR user
    res = client.put(f"/api/hr/employees/{testhr_id}", json={"first_name": "Hack"}, headers=hr_headers)
    assert res.status_code == 403

    # 5. Verify that HR gets 403 when fetching salaries of HR user
    res = client.get(f"/api/hr/salaries/history/{testhr_id}", headers=hr_headers)
    if res.status_code != 403:
        res = client.post("/api/hr/salaries/slips", json={"employee_id": testhr_id, "pay_period": "2026-06", "allowances": 0, "deductions": 0}, headers=hr_headers)
        assert res.status_code == 403

    # 6. Test Employee photo upload one-time locking
    # Login as employee
    emp_login = client.post("/api/auth/login", json={"email": "employee@enterprise.ai", "password": "employee123"})
    emp_token = emp_login.json()["access_token"]
    emp_headers = {"Authorization": f"Bearer {emp_token}"}

    # Prepare dummy image
    import io
    dummy_file = io.BytesIO(b"fake image data")
    
    # First upload - should succeed
    res = client.post("/api/employee/upload-photo", files={"file": ("photo.jpg", dummy_file, "image/jpeg")}, headers=emp_headers)
    assert res.status_code == 200
    
    # Second upload - should fail with 400 because locked
    dummy_file2 = io.BytesIO(b"fake image data 2")
    res = client.post("/api/employee/upload-photo", files={"file": ("photo.jpg", dummy_file2, "image/jpeg")}, headers=emp_headers)
    assert res.status_code == 400
    assert "locked" in res.json()["detail"]

    # 7. HR photo override creates PHOTO_UPDATED audit log
    # Get employee user ID
    emp_user = client.get("/api/employee/me", headers=emp_headers).json()
    emp_user_id = emp_user["id"]
    
    dummy_file3 = io.BytesIO(b"fake image data override")
    res = client.post(f"/api/hr/employees/{emp_user_id}/upload-photo", files={"file": ("override.png", dummy_file3, "image/png")}, headers=hr_headers)
    assert res.status_code == 200

    # Verify audit log contains PHOTO_UPDATED
    res = client.get("/api/admin/audit-logs", headers=admin_headers)
    assert res.status_code == 200
    logs = res.json()
    assert any(log["action"] == "PHOTO_UPDATED" for log in logs)

    # 8. Timeline events are sorted newest-first
    res = client.get("/api/employee/timeline", headers=emp_headers)
    assert res.status_code == 200
    timeline = res.json()
    dates = [e["date"] for e in timeline]
    assert dates == sorted(dates, reverse=True)
