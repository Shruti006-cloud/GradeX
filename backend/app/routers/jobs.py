"""Jobs router – poll background job progress."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.teacher import Teacher
from app.models.background_job import BackgroundJob
from app.schemas.job import JobResponse
from app.services.auth_service import get_current_teacher
from app.services.job_service import get_job, list_jobs

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("/{job_id}", response_model=JobResponse)
def get_job_status(
    job_id: int,
    db: Session = Depends(get_db),
):
    """Get real-time background job progress."""
    job = get_job(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.get("", response_model=List[JobResponse])
def get_jobs_list(
    exam_id: Optional[int] = None,
    current_teacher: Teacher = Depends(get_current_teacher),
    db: Session = Depends(get_db),
):
    """List jobs, optionally filtered by exam."""
    return list_jobs(db, exam_id=exam_id)
