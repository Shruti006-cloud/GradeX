"""Question and AnswerKey schemas."""
from __future__ import annotations
import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class QuestionBase(BaseModel):
    question_no: str
    question_text: str
    max_marks: float = 1.0
    question_type: Optional[str] = "short"
    sub_parts: Optional[List[str]] = []
    order_index: Optional[int] = 0


class QuestionCreate(QuestionBase):
    pass


class QuestionUpdate(BaseModel):
    question_no: Optional[str] = None
    question_text: Optional[str] = None
    max_marks: Optional[float] = None
    question_type: Optional[str] = None
    sub_parts: Optional[List[str]] = None
    order_index: Optional[int] = None
    teacher_confirmed: Optional[bool] = None


class QuestionResponse(QuestionBase):
    id: int
    exam_id: int
    ai_extracted: bool = False
    teacher_confirmed: bool = False
    created_at: datetime.datetime
    updated_at: Optional[datetime.datetime] = None

    model_config = {"from_attributes": True}


class AnswerKeyBase(BaseModel):
    model_answer: Optional[str] = None
    key_points: Optional[List[str]] = []
    marking_scheme: Optional[str] = None
    marks_split: Optional[Dict[str, Any]] = {}
    model_config = {"protected_namespaces": ()}


class AnswerKeyCreate(AnswerKeyBase):
    question_id: int


class AnswerKeyUpdate(BaseModel):
    model_answer: Optional[str] = None
    key_points: Optional[List[str]] = None
    marking_scheme: Optional[str] = None
    marks_split: Optional[Dict[str, Any]] = None
    teacher_confirmed: Optional[bool] = None


class AnswerKeyResponse(AnswerKeyBase):
    id: int
    exam_id: int
    question_id: int
    question_no: Optional[str] = None
    is_ai_generated: bool = False
    teacher_confirmed: bool = False
    created_at: datetime.datetime
    updated_at: Optional[datetime.datetime] = None

    model_config = {"from_attributes": True}
