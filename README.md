# GradeX

An intelligent AI-powered academic exam paper evaluation and assessment studio. Teachers create exams and question marking schemes, upload student answer sheets (PDFs), and the system uses Gemini Vision and reasoning to perform step-by-step evaluation, generate score breakdowns, and produce detailed student feedback reports with full teacher override controls.

---

## Architecture Overview

- **Backend**: FastAPI + SQLAlchemy (SQLite / PostgreSQL) + PyMuPDF + Google Gemini API + ReportLab
- **Frontend**: React 18 + Vite + Tailwind CSS + React Router v6 + Axios + Lucide Icons + React Zoom Pan Pinch
- **Containerization**: Docker & Docker Compose

---

## Prerequisites (Windows)

1. **Python 3.11+**
   - Download and install from [python.org](https://www.python.org/downloads/)
   - Ensure "Add python.exe to PATH" is checked during installation.
2. **Node.js 20+ & npm / pnpm**
   - Download and install LTS from [nodejs.org](https://nodejs.org/)
3. **Google Gemini API Key(s)**
   - Get free API key(s) from [Google AI Studio](https://aistudio.google.com/)

---

## Setup Instructions

### 1. Configure Backend Environment

Copy the example environment file to `.env`:
```powershell
cd "c:\Users\User\OneDrive\Desktop\evaluator project\backend"
Copy-Item .env.example .env
```
Open `.env` and fill in your Gemini API keys:
```env
GEMINI_API_KEYS=your_gemini_api_key_here
```

### 2. Install Backend Dependencies

```powershell
cd "c:\Users\User\OneDrive\Desktop\evaluator project\backend"
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 3. Install Frontend Dependencies

```powershell
cd "c:\Users\User\OneDrive\Desktop\evaluator project\frontend"
npm install
```

---

## Running the Application

### Option A: Local Development

1. **Start Backend**:
   ```powershell
   cd "c:\Users\User\OneDrive\Desktop\evaluator project\backend"
   .\venv\Scripts\Activate.ps1
   uvicorn app.main:app --reload --port 8000
   ```
   API will be running at: `http://localhost:8000`  
   Interactive API docs (Swagger): `http://localhost:8000/docs`

2. **Start Frontend**:
   ```powershell
   cd "c:\Users\User\OneDrive\Desktop\evaluator project\frontend"
   npm run dev
   ```
   App will be running at: `http://localhost:5173`

### Option B: Docker Compose

```powershell
cd "c:\Users\User\OneDrive\Desktop\evaluator project"
docker-compose up --build
```

---

## Project Folder Structure

```
evaluator project/
├── backend/
│   ├── app/
│   │   ├── models/            # SQLAlchemy database models
│   │   │   ├── teacher.py
│   │   │   ├── exam.py
│   │   │   ├── question.py
│   │   │   ├── answer_key.py
│   │   │   ├── student_submission.py
│   │   │   ├── question_evaluation.py
│   │   │   ├── audit_log.py
│   │   │   └── background_job.py
│   │   ├── schemas/           # Pydantic v2 schemas
│   │   │   ├── auth.py
│   │   │   ├── teacher.py
│   │   │   ├── exam.py
│   │   │   ├── question.py
│   │   │   ├── submission.py
│   │   │   ├── evaluation.py
│   │   │   └── job.py
│   │   ├── routers/           # FastAPI endpoints
│   │   │   ├── auth.py
│   │   │   ├── teachers.py
│   │   │   ├── exams.py
│   │   │   ├── questions.py
│   │   │   ├── submissions.py
│   │   │   ├── evaluations.py
│   │   │   ├── reports.py
│   │   │   └── jobs.py
│   │   ├── services/          # Business logic & integrations
│   │   │   ├── auth_service.py
│   │   │   ├── exam_service.py
│   │   │   ├── submission_service.py
│   │   │   ├── evaluation_service.py
│   │   │   ├── gemini_service.py
│   │   │   ├── report_service.py
│   │   │   └── job_service.py
│   │   ├── prompts/           # LLM Prompt templates
│   │   │   ├── evaluation_prompt.py
│   │   │   └── extraction_prompt.py
│   │   ├── utils/             # Helpers (PDF, File, Security, Parser)
│   │   │   ├── security.py
│   │   │   ├── pdf_utils.py
│   │   │   ├── file_utils.py
│   │   │   └── response_parser.py
│   │   ├── database.py        # SQLAlchemy engine & session setup
│   │   └── main.py            # FastAPI main entrypoint & lifespan
│   ├── uploads/               # Saved submission PDFs
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/             # Route pages (Login, Dashboard, Exams, etc.)
│   │   ├── components/        # Reusable UI components
│   │   ├── services/          # API client setup (Axios)
│   │   ├── hooks/             # Custom React hooks (useAuth, useExams, etc.)
│   │   ├── App.jsx            # React Router setup
│   │   ├── main.jsx           # App entrypoint
│   │   └── index.css          # Tailwind base styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── Dockerfile.backend
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## API Endpoints List

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Healthcheck endpoint |
| `POST` | `/api/auth/login` | Teacher authentication (returns JWT) |
| `POST` | `/api/auth/logout` | Invalidate current session |
| `GET` | `/api/auth/me` | Current teacher info |
| `POST` | `/api/teachers/` | Register teacher |
| `GET` | `/api/teachers/{id}` | Get teacher profile |
| `PATCH` | `/api/teachers/{id}` | Update teacher profile |
| `POST` | `/api/exams/` | Create a new exam |
| `GET` | `/api/exams/` | List all exams |
| `GET` | `/api/exams/{id}` | Get exam details |
| `PATCH` | `/api/exams/{id}` | Update exam details |
| `DELETE` | `/api/exams/{id}` | Delete exam |
| `POST` | `/api/exams/{id}/questions/` | Add question to exam |
| `GET` | `/api/exams/{id}/questions/` | List questions for exam |
| `GET` | `/api/exams/{id}/questions/{qid}` | Get question details |
| `PATCH` | `/api/exams/{id}/questions/{qid}` | Update question |
| `DELETE`| `/api/exams/{id}/questions/{qid}` | Remove question |
| `POST` | `/api/exams/{id}/questions/{qid}/answer-key` | Set/update expected answer key |
| `POST` | `/api/exams/{id}/submissions/` | Upload student answer PDF |
| `GET` | `/api/exams/{id}/submissions/` | List submissions for exam |
| `GET` | `/api/exams/{id}/submissions/{sid}` | Get submission details |
| `DELETE`| `/api/exams/{id}/submissions/{sid}` | Delete submission |
| `POST` | `/api/exams/{id}/submissions/{sid}/evaluate` | Trigger AI evaluation |
| `GET` | `/api/evaluations/submissions/{sid}` | Get evaluation breakdown |
| `PATCH` | `/api/evaluations/{id}/override` | Teacher manual marks override |
| `GET` | `/api/reports/exams/{id}/summary` | Exam statistical summary |
| `GET` | `/api/reports/submissions/{sid}/pdf` | Download student PDF evaluation report |
| `GET` | `/api/reports/exams/{id}/csv` | Download exam grade sheet CSV |
| `GET` | `/api/jobs/` | List background jobs |
| `GET` | `/api/jobs/{id}` | Get background job status |
