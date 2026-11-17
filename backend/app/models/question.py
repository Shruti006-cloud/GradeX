"""Question model — full implementation."""
import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Float, Boolean, JSON
from sqlalchemy.orm import relationship
from app.database import Base


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False)
    question_no = Column(String, nullable=False)          # e.g. "1", "1a", "2b"
    question_text = Column(Text, nullable=False)
    max_marks = Column(Float, nullable=False, default=0.0)
    question_type = Column(String, default="short")       # MCQ / short / long / numerical
    sub_parts = Column(JSON, default=list)                # list of sub-part strings
    order_index = Column(Integer, default=0)
    ai_extracted = Column(Boolean, default=False)
    teacher_confirmed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
    )

    exam = relationship("Exam", back_populates="questions")
    answer_keys = relationship(
        "AnswerKey", back_populates="question", cascade="all, delete-orphan"
    )
    evaluations = relationship(
        "QuestionEvaluation", back_populates="question", cascade="all, delete-orphan"
    )
