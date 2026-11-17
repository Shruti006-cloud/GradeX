"""Evaluation and AuditLog schemas."""
from __future__ import annotations
import datetime
from typing import Optional, List, Any
from pydantic import BaseModel


class TeacherOverrideRequest(BaseModel):
    final_marks: float
    teacher_comment: Optional[str] = None


class QuestionEvaluationResponse(BaseModel):
    id: int
    submission_id: int
    question_id: int
    question_no: Optional[str] = None
    question_text: Optional[str] = None
    transcribed_answer: Optional[str] = None
    page_numbers: Optional[List[int]] = []
    ai_marks: Optional[float] = 0.0
    final_marks: Optional[float] = 0.0
    max_marks: Optional[float] = 0.0
    key_points_matched: Optional[List[str]] = []
    key_points_missed: Optional[List[str]] = []
    mistakes: Optional[List[str]] = []
    feedback: Optional[str] = None
    confidence: Optional[float] = 0.9
    is_flagged: Optional[bool] = False
    flag_reason: Optional[str] = None
    teacher_comment: Optional[str] = None
    is_overridden: Optional[bool] = False
    model_answer: Optional[str] = None
    key_points: Optional[List[str]] = []
    created_at: datetime.datetime
    updated_at: Optional[datetime.datetime] = None

    model_config = {"from_attributes": True, "protected_namespaces": ()}


class AuditLogResponse(BaseModel):
    id: int
    submission_id: Optional[int] = None
    question_evaluation_id: Optional[int] = None
    teacher_id: Optional[int] = None
    action: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    timestamp: datetime.datetime

    model_config = {"from_attributes": True, "protected_namespaces": ()}
