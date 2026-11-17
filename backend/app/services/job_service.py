"""Job service – background job tracking and state management."""
import datetime
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.background_job import BackgroundJob


def create_job(
    db: Session,
    job_type: str,
    submission_id: Optional[int] = None,
    exam_id: Optional[int] = None,
) -> BackgroundJob:
    """Create a new queued BackgroundJob record."""
    job = BackgroundJob(
        job_type=job_type,
        status="pending",
        submission_id=submission_id,
        exam_id=exam_id,
        progress_pct=0,
        current_step="Queued",
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def update_job_status(
    db: Session,
    job_id: int,
    status: str,
    progress_pct: int = 0,
    current_step: Optional[str] = None,
    error_message: Optional[str] = None,
) -> Optional[BackgroundJob]:
    """Update job status, progress percentage, step label, and error."""
    job = db.query(BackgroundJob).filter(BackgroundJob.id == job_id).first()
    if not job:
        return None
    job.status = status
    job.progress_pct = progress_pct
    if current_step:
        job.current_step = current_step
    if error_message:
        job.error_message = error_message
    job.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(job)
    return job


def get_job(db: Session, job_id: int) -> Optional[BackgroundJob]:
    """Fetch job by ID."""
    return db.query(BackgroundJob).filter(BackgroundJob.id == job_id).first()


def list_jobs(db: Session, exam_id: Optional[int] = None) -> List[BackgroundJob]:
    """List jobs, optionally filtered by exam."""
    q = db.query(BackgroundJob)
    if exam_id is not None:
        q = q.filter(BackgroundJob.exam_id == exam_id)
    return q.order_by(BackgroundJob.created_at.desc()).all()
