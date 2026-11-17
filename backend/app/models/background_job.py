"""BackgroundJob model — full implementation."""
import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from app.database import Base


class BackgroundJob(Base):
    __tablename__ = "background_jobs"

    id = Column(Integer, primary_key=True, index=True)
    job_type = Column(String, nullable=False)
    # pending / running / done / failed
    status = Column(String, default="pending")
    submission_id = Column(Integer, ForeignKey("student_submissions.id"), nullable=True)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=True)
    progress_pct = Column(Integer, default=0)
    current_step = Column(String, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
    )
