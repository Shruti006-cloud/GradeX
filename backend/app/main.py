"""GradeX – FastAPI application entry point."""
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

load_dotenv()

from app.database import engine, Base
from app import models  # noqa: F401 – ensures all models are registered
from app.routers import auth, teachers, exams, questions, submissions, evaluations, reports, jobs

# Ensure uploads directory exists
os.makedirs("uploads", exist_ok=True)


def _seed_default_teacher():
    """Insert a default teacher account if none exists."""
    from app.database import SessionLocal
    from app.models.teacher import Teacher
    from app.utils.security import hash_password

    db = SessionLocal()
    try:
        email = os.getenv("DEFAULT_TEACHER_EMAIL", "teacher@school.com")
        if not db.query(Teacher).filter(Teacher.email == email).first():
            teacher = Teacher(
                email=email,
                hashed_password=hash_password(
                    os.getenv("DEFAULT_TEACHER_PASSWORD", "password123")
                ),
                full_name="Default Teacher",
                is_active=True,
            )
            db.add(teacher)
            db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables on startup
    Base.metadata.create_all(bind=engine)
    # Seed default teacher
    _seed_default_teacher()
    yield


app = FastAPI(
    title="GradeX",
    version="2.0.0",
    description="GradeX — Automated AI-assisted examination evaluation system with human-in-the-loop teacher review.",
    lifespan=lifespan,
)

# CORS configuration
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        frontend_url,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Mount API routers
app.include_router(auth.router, prefix="/api")
app.include_router(teachers.router, prefix="/api")
app.include_router(exams.router, prefix="/api")
app.include_router(questions.router, prefix="/api")
app.include_router(submissions.router, prefix="/api")
app.include_router(evaluations.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(jobs.router, prefix="/api")


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok", "app": "GradeX"}
