<div align="center">

<!-- Animated Banner -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0f0c29,50:302b63,100:24243e&height=200&section=header&text=Enterprise%20AI%20Workforce%20Platform&fontSize=34&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=Production-Grade%20AI-Powered%20HR%20%7C%20FastAPI%20%7C%20React%20%7C%20ChromaDB%20%7C%20Multi-LLM&descAlignY=58&descSize=14"/>

<!-- Typing Animation -->
<a href="https://git.io/typing-svg">
  <img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=600&size=22&pause=1000&color=7C3AED&center=true&vCenter=true&multiline=false&random=false&width=700&lines=AI+%7C+RAG+%7C+Multi-LLM+Router+%7C+ChromaDB;FastAPI+%7C+React+%7C+JWT+%7C+RBAC;Enterprise+HR+%7C+Payroll+%7C+Projects+%7C+Tasks;Meeting+AI+%7C+Career+Engine+%7C+Document+Generator" alt="Typing SVG" />
</a>

<br/>

<!-- Badges Row 1 -->
![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)

<!-- Badges Row 2 -->
![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector_DB-FF6B35?style=for-the-badge&logo=databricks&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-Local_DB-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-Production-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

<!-- Badges Row 3 -->
![Gemini](https://img.shields.io/badge/Google_Gemini-AI-4285F4?style=for-the-badge&logo=google&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-Llama_3.3-F55036?style=for-the-badge&logo=meta&logoColor=white)
![OpenRouter](https://img.shields.io/badge/OpenRouter-Multi_Model-6366F1?style=for-the-badge&logo=openai&logoColor=white)
![Ollama](https://img.shields.io/badge/Ollama-Local_LLM-000000?style=for-the-badge&logo=ollama&logoColor=white)

<br/>

[![GitHub Stars](https://img.shields.io/github/stars/DarshanPatel2006/Enterprise-ai-workforce-platform?style=social)](https://github.com/DarshanPatel2006/Enterprise-ai-workforce-platform)
[![GitHub Forks](https://img.shields.io/github/forks/DarshanPatel2006/Enterprise-ai-workforce-platform?style=social)](https://github.com/DarshanPatel2006/Enterprise-ai-workforce-platform)

</div>

---

<div align="center">
<h2>⚡ What is this platform?</h2>
</div>

> A **production-grade, enterprise-level AI workforce management system** that combines intelligent HR management, project tracking, document generation, and a full Multi-LLM AI layer — all in a single unified platform. Built from scratch with real-world architecture patterns and designed for portfolio and interview demonstration at senior engineering level.

---

## 🧠 AI Architecture — The Brain

```
╔══════════════════════════════════════════════════════════════════╗
║                    USER QUERY (Any Role)                        ║
╚═══════════════════════════╦══════════════════════════════════════╝
                            ║
                            ▼
╔══════════════════════════════════════════════════════════════════╗
║              MULTI-RAG PIPELINE  (ChromaDB)                     ║
║                                                                  ║
║   ┌─────────────┐  ┌─────────────┐  ┌────────────┐  ┌────────┐ ║
║   │  HR Policy  │  │   Company   │  │  Project   │  │Training│ ║
║   │ Collection  │  │  Policies   │  │   Rules    │  │ Tracks │ ║
║   └─────────────┘  └─────────────┘  └────────────┘  └────────┘ ║
║         Vector Similarity Search → Top-K Retrieval              ║
╚═══════════════════════════╦══════════════════════════════════════╝
                            ║  Context Injected into Prompt
                            ▼
╔══════════════════════════════════════════════════════════════════╗
║                  MULTI-LLM ROUTER                               ║
║                                                                  ║
║  [1] 🟣 Google Gemini 2.0 Flash  ──→  FAIL?                     ║
║                                          │                       ║
║  [2] 🟠 Groq Llama-3.3 70B       ──→  FAIL?                     ║
║                                          │                       ║
║  [3] 🔵 OpenRouter (Gemini)       ──→  FAIL?                     ║
║                                          │                       ║
║  [4] ⚫ Ollama Local Qwen2.5      ──→  FAIL?                     ║
║                                          │                       ║
║  [5] 🟡 Simulation Mode (Mock)    ──→  ALWAYS WORKS             ║
╚═══════════════════════════╦══════════════════════════════════════╝
                            ║
                            ▼
╔══════════════════════════════════════════════════════════════════╗
║               STRUCTURED JSON RESPONSE                          ║
║        { answer, model_used, rag_source }                       ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                        │
│  React Router • TailwindCSS • Axios • Context API           │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │SuperAdmin│ │    HR    │ │ Manager  │ │   Employee   │  │
│  │Dashboard │ │  Panel   │ │Dashboard │ │  Dashboard   │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │  HTTP/REST (Axios)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (FastAPI)                          │
│                                                              │
│  ┌───────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  /api/ai  │  │ /api/hr  │  │/api/admin│  │/api/emp  │  │
│  │  Routes   │  │  Routes  │  │  Routes  │  │  Routes  │  │
│  └─────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│        │             │              │              │         │
│  ┌─────▼─────────────▼──────────────▼──────────────▼─────┐ │
│  │           SQLAlchemy ORM + JWT Middleware               │ │
│  └─────────────────────┬──────────────────────────────────┘ │
└────────────────────────┼────────────────────────────────────┘
                         │
          ┌──────────────┼───────────────┐
          ▼              ▼               ▼
   ┌─────────────┐ ┌──────────┐  ┌──────────────┐
   │  SQLite /   │ │ChromaDB  │  │  AI Providers │
   │   MySQL     │ │ Vectors  │  │  (LLM APIs)   │
   └─────────────┘ └──────────┘  └──────────────┘
```

---

## ✨ Full Feature Set

<table>
<tr>
<td width="50%">

### 🔐 Authentication & Access
- JWT-based login with 24hr expiry
- Role-Based Access Control (RBAC)
- 4 roles: Super Admin, HR, Manager, Employee
- Protected routes on frontend and backend
- No public signup — HR controls all accounts

### 👥 Employee Management
- Full employee lifecycle (hire → offboard)
- Profile management with photo upload
- Department & team assignment
- Timeline / activity history
- Employee ID card generation (PDF)

### 💰 Salary & Payroll
- Salary records per employee
- Full salary history
- Role-restricted management (Super Admin manages HR salaries)
- PDF payslip generation

</td>
<td width="50%">

### 📋 Project & Task Management
- Project creation and management
- Kanban-style task board
- Task weight scoring (1–5)
- Task submission with PR/Drive links
- Manager review: Approve / Reject / Changes
- Deadline tracking

### 🏖️ Leave Management
- Leave application portal
- Manager approval workflow
- Leave balance tracking
- Leave history per employee

### 📢 Announcements
- Company-wide announcements
- Role-targeted notifications
- Priority flagging

</td>
</tr>
</table>

---

## 🤖 AI Modules

| Module | Description | Endpoint |
|---|---|---|
| **RAG Chat Assistant** | Multi-collection vector search + LLM answer generation | `POST /api/ai/chat` |
| **Meeting Assistant** | Transcript → Summary + Action Items + Decisions (JSON) | `POST /api/ai/meeting` |
| **Career Progression Engine** | Skill gap analysis + Learning path + Promotion readiness | `POST /api/ai/career` |
| **Document Generator** | PDF contracts, ID cards, payslips, offer letters | `POST /api/hr/documents/generate` |
| **AI Usage Logger** | Tracks model used, tokens, latency, fallback state | Auto-logged to DB |

---

## 📁 Project Structure

```
enterprise-ai-workforce-platform/
│
├── 📂 backend/
│   ├── 📂 app/
│   │   ├── 📂 ai/
│   │   │   ├── 🤖 router.py              # Multi-LLM fallback router
│   │   │   ├── 🧠 rag.py                 # ChromaDB RAG pipeline
│   │   │   ├── 📝 meeting_assistant.py   # Meeting transcript AI
│   │   │   ├── 📈 career_progression.py  # Career engine AI
│   │   │   └── 📄 document_generator.py  # PDF generation
│   │   ├── 📂 routes/
│   │   │   ├── ai.py         # /api/ai/* endpoints
│   │   │   ├── hr.py         # /api/hr/* endpoints
│   │   │   ├── admin.py      # /api/admin/* endpoints
│   │   │   ├── employee.py   # /api/employee/* endpoints
│   │   │   └── auth.py       # /api/auth/* endpoints
│   │   ├── 🗄️ models.py       # SQLAlchemy DB models
│   │   ├── 📐 schemas.py      # Pydantic request/response schemas
│   │   ├── 🔐 auth.py         # JWT logic + RBAC middleware
│   │   ├── ⚙️ config.py       # Environment config with dotenv
│   │   └── 🚀 main.py         # FastAPI app entry point
│   ├── requirements.txt
│   └── .env                   # ← NOT in repo (gitignored)
│
├── 📂 frontend/
│   ├── 📂 src/
│   │   ├── 📂 pages/          # Role-specific page components
│   │   ├── 📂 components/     # Shared UI components
│   │   ├── 📂 context/        # Auth context provider
│   │   └── App.jsx            # Router + protected routes
│   ├── package.json
│   └── vite.config.js
│
├── 📜 README.md
├── 🚫 .gitignore
└── ▶️ run_all.bat              # One-click start (Windows)
```

---

## ⚙️ Installation & Setup

### Prerequisites

```bash
# Required
Python 3.10+
Node.js 18+
Git
```

### 1️⃣ Clone

```bash
git clone https://github.com/YOUR_USERNAME/enterprise-ai-workforce-platform.git
cd enterprise-ai-workforce-platform
```

### 2️⃣ Backend

```bash
cd backend
pip install -r requirements.txt
```

### 3️⃣ Environment File

Create `backend/.env`:

```env
# Database
DATABASE_URL=sqlite:///./workforce.db

# Security
JWT_SECRET=your-super-secret-key-change-this

# AI Keys (add at least ONE — others auto-skip)
GEMINI_API_KEY=AIzaSy...          # https://aistudio.google.com/app/apikey
GROQ_API_KEY=gsk_...              # https://console.groq.com/keys
OPENROUTER_API_KEY=sk-or-...      # https://openrouter.ai/keys
OLLAMA_URL=http://localhost:11434  # Optional: local Ollama
```

> 💡 **No API keys?** The platform auto-switches to **Simulation Mode** — fully functional for demos.

### 4️⃣ Start Backend

```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 5️⃣ Start Frontend

```bash
cd frontend
npm install
npm run dev
```

### 6️⃣ Open Browser

```
http://localhost:5173
```

---

## 🔑 Default Login Credentials

| Role | Email | Password |
|---|---|---|
| 🔴 Super Admin | `admin@company.com` | `admin123` |
| 🟠 HR Manager | `hr@company.com` | `hr123` |

> All Employee and Manager accounts are created by HR from within the platform.

---

## 🛡️ Role Permission Matrix

| Permission | Super Admin | HR | Manager | Employee |
|---|:---:|:---:|:---:|:---:|
| Create HR accounts | ✅ | ❌ | ❌ | ❌ |
| Create Employee accounts | ✅ | ✅ | ❌ | ❌ |
| Manage HR salary | ✅ | ❌ | ❌ | ❌ |
| Manage Employee salary | ✅ | ✅ | ❌ | ❌ |
| Approve leave requests | ✅ | ✅ | ✅ | ❌ |
| Create projects & tasks | ✅ | ❌ | ✅ | ❌ |
| Submit tasks | ✅ | ❌ | ❌ | ✅ |
| Use AI Assistant | ✅ | ✅ | ✅ | ✅ |
| View AI Usage Logs | ✅ | ❌ | ❌ | ❌ |
| Manage departments | ✅ | ❌ | ❌ | ❌ |

---

## 🧪 API Documentation

Once the backend is running, full interactive API docs are available at:

```
http://localhost:8000/docs        ← Swagger UI
http://localhost:8000/redoc       ← ReDoc
```

---

## 🌐 Tech Stack — Full Detail

<div align="center">

| Category | Technology | Purpose |
|---|---|---|
| **Frontend Framework** | React 18 | Component-based UI |
| **Styling** | TailwindCSS 3 | Utility-first CSS |
| **Routing** | React Router v6 | SPA navigation |
| **HTTP Client** | Axios | API communication |
| **Build Tool** | Vite | Fast dev server + bundler |
| **Backend Framework** | FastAPI | High-performance async API |
| **ORM** | SQLAlchemy | Database abstraction |
| **Validation** | Pydantic v2 | Schema validation |
| **Authentication** | JWT (python-jose) | Stateless auth tokens |
| **Password Hashing** | Passlib + bcrypt | Secure credentials |
| **Local Database** | SQLite | Zero-config local storage |
| **Production DB** | MySQL | Enterprise-grade storage |
| **Vector Database** | ChromaDB | Embedding + similarity search |
| **Embedding Model** | all-MiniLM-L6-v2 | Local semantic embeddings |
| **LLM Provider 1** | Google Gemini 2.0 | Primary AI model |
| **LLM Provider 2** | Groq Llama-3.3-70B | Fallback — ultra fast |
| **LLM Provider 3** | OpenRouter | Multi-model gateway |
| **LLM Provider 4** | Ollama Qwen2.5 | Fully local inference |
| **PDF Generation** | FPDF2 | Document generation |
| **Environment** | python-dotenv | Secure config loading |
| **CORS** | FastAPI middleware | Cross-origin security |

</div>

---

## 📊 Database Schema Overview

```
users ──────────────────── employee_profiles
  │                               │
  ├── leave_requests              ├── salary_records
  ├── ai_usage_logs               └── audit_logs
  └── announcements

departments ────────────── projects
                               │
                           project_tasks
                               │
                           task_submissions
```

---

## 🚀 Deployment Notes

For production deployment:

```env
# Switch from SQLite to MySQL
DATABASE_URL=mysql+pymysql://user:password@host:3306/workforce_db

# Strong JWT secret
JWT_SECRET=<generate-with: openssl rand -hex 32>
```

```bash
# Production backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

# Frontend build
npm run build
```

---

<div align="center">

## 🧑‍💻 Built With

<img src="https://skillicons.dev/icons?i=python,fastapi,react,tailwind,mysql,sqlite,git,vscode,github&theme=dark" />

---

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:24243e,50:302b63,100:0f0c29&height=120&section=footer"/>

**⭐ Star this repository if you found it useful!**

[![GitHub](https://img.shields.io/badge/GitHub-Follow-181717?style=for-the-badge&logo=github)](https://github.com/DarshanPatel2006)

</div>
