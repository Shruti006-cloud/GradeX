"""Exam model — full implementation."""
import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Float
from sqlalchemy.orm import relationship
from app.database import Base


class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=False)
    title = Column(String, nullable=False)
    subject = Column(String, nullable=True)
    class_name = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    total_marks = Column(Float, nullable=True)
    # draft / active / archived
    status = Column(String, default="draft", nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
    )

    teacher = relationship("Teacher", backref="exams")
    questions = relationship(
        "Question", back_populates="exam", cascade="all, delete-orphan"
    )
    submissions = relationship(
        "StudentSubmission", back_populates="exam", cascade="all, delete-orphan"
    )
    answer_keys = relationship(
        "AnswerKey", back_populates="exam", cascade="all, delete-orphan"
    )
