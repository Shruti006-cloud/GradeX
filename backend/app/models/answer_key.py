"""AnswerKey model — full implementation."""
import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Float, Boolean, JSON
from sqlalchemy.orm import relationship
from app.database import Base


class AnswerKey(Base):
    __tablename__ = "answer_keys"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    model_answer = Column(Text, nullable=True)
    key_points = Column(JSON, default=list)       # list of strings
    marking_scheme = Column(Text, nullable=True)
    marks_split = Column(JSON, default=dict)      # dict of breakdowns
    is_ai_generated = Column(Boolean, default=False)
    teacher_confirmed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
    )

    exam = relationship("Exam", back_populates="answer_keys")
    question = relationship("Question", back_populates="answer_keys")
