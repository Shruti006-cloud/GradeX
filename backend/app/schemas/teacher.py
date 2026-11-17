"""Teacher schemas."""
import datetime
from pydantic import BaseModel, EmailStr


class TeacherBase(BaseModel):
    email: EmailStr
    full_name: str


class TeacherCreate(TeacherBase):
    password: str


class TeacherUpdate(BaseModel):
    full_name: str | None = None
    password: str | None = None


class TeacherResponse(TeacherBase):
    id: int
    is_active: bool
    created_at: datetime.datetime

    model_config = {"from_attributes": True}
