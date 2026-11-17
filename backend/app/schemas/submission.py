"""StudentSubmission schemas."""
from __future__ import annotations
import datetime
from typing import Optional, List
from pydantic import BaseModel


class HeaderUpdate(BaseModel):
    student_name: Optional[str] = None
    roll_number: Optional[str] = None
    class_name: Optional[str] = None


class SubmissionResponse(BaseModel):
    id: int
    exam_id: int
    student_name: Optional[str] = None
    roll_number: Optional[str] = None
    class_name: Optional[str] = None
    pdf_path: Optional[str] = None
    page_image_paths: Optional[List[str]] = []
    page_image_urls: Optional[List[str]] = []
    total_pages: Optional[int] = 0
    ai_detected_name: Optional[str] = None
    ai_detected_roll: Optional[str] = None
    submission_status: str = "uploaded"
    job_id: Optional[int] = None
    total_marks: Optional[float] = 0.0
    max_marks: Optional[float] = 0.0
    percentage: Optional[float] = 0.0
    grade: Optional[str] = "F"
    submitted_at: datetime.datetime
    updated_at: Optional[datetime.datetime] = None

    model_config = {"from_attributes": True}
