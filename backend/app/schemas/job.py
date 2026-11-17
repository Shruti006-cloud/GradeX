"""BackgroundJob schemas."""
from __future__ import annotations
import datetime
from typing import Optional
from pydantic import BaseModel


class JobResponse(BaseModel):
    id: int
    job_type: str
    status: str
    submission_id: Optional[int] = None
    exam_id: Optional[int] = None
    progress_pct: int = 0
    current_step: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime.datetime
    updated_at: Optional[datetime.datetime] = None

    model_config = {"from_attributes": True}
