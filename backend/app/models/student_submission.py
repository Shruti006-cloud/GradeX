"""StudentSubmission model — full implementation."""
import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, JSON, Boolean
from sqlalchemy.orm import relationship
from app.database import Base


class StudentSubmission(Base):
    __tablename__ = "student_submissions"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False)
    student_name = Column(String, nullable=True)
    roll_number = Column(String, nullable=True)
    class_name = Column(String, nullable=True)
    pdf_path = Column(String, nullable=True)
    page_image_paths = Column(JSON, default=list)   # list of image file paths
    total_pages = Column(Integer, default=0)
    ai_detected_name = Column(String, nullable=True)
    ai_detected_roll = Column(String, nullable=True)
    # uploaded / processing / evaluated / reviewed / finalized
    submission_status = Column(String, default="uploaded")
    job_id = Column(Integer, ForeignKey("background_jobs.id"), nullable=True)
    submitted_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
    )

    exam = relationship("Exam", back_populates="submissions")
    evaluations = relationship(
        "QuestionEvaluation",
        back_populates="submission",
        cascade="all, delete-orphan",
    )
    audit_logs = relationship(
        "AuditLog", back_populates="submission", cascade="all, delete-orphan"
    )
