"""Exam schemas."""
from __future__ import annotations
import datetime
from typing import Optional
from pydantic import BaseModel


class ExamBase(BaseModel):
    title: str
    subject: Optional[str] = None
    class_name: Optional[str] = None
    description: Optional[str] = None
    total_marks: Optional[float] = None
    status: Optional[str] = "draft"


class ExamCreate(ExamBase):
    pass


class ExamUpdate(BaseModel):
    title: Optional[str] = None
    subject: Optional[str] = None
    class_name: Optional[str] = None
    description: Optional[str] = None
    total_marks: Optional[float] = None
    status: Optional[str] = None


class ExamResponse(ExamBase):
    id: int
    teacher_id: int
    created_at: datetime.datetime
    updated_at: Optional[datetime.datetime] = None
    total_submissions: Optional[int] = 0
    evaluated_count: Optional[int] = 0
    class_average: Optional[float] = 0.0
    highest_score: Optional[float] = 0.0
    lowest_score: Optional[float] = 0.0

    model_config = {"from_attributes": True}
