"""QuestionEvaluation model — full implementation."""
import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Float, Boolean, JSON
from sqlalchemy.orm import relationship
from app.database import Base


class QuestionEvaluation(Base):
    __tablename__ = "question_evaluations"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("student_submissions.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    question_no = Column(String, nullable=True)
    transcribed_answer = Column(Text, nullable=True)
    page_numbers = Column(JSON, default=list)         # list of int page indices
    ai_marks = Column(Float, nullable=True)
    final_marks = Column(Float, nullable=True)
    max_marks = Column(Float, nullable=True)
    key_points_matched = Column(JSON, default=list)
    key_points_missed = Column(JSON, default=list)
    mistakes = Column(JSON, default=list)
    feedback = Column(Text, nullable=True)
    confidence = Column(Float, nullable=True)
    is_flagged = Column(Boolean, default=False)
    flag_reason = Column(String, nullable=True)
    teacher_comment = Column(Text, nullable=True)
    is_overridden = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
    )

    submission = relationship("StudentSubmission", back_populates="evaluations")
    question = relationship("Question", back_populates="evaluations")
