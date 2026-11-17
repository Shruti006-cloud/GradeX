"""AuditLog model — full implementation."""
import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from app.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("student_submissions.id"), nullable=True)
    question_evaluation_id = Column(Integer, ForeignKey("question_evaluations.id"), nullable=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=True)
    action = Column(String, nullable=False)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    submission = relationship("StudentSubmission", back_populates="audit_logs")
