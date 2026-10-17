"""Pydantic Schemas for Application Tracking."""
from typing import Optional, Literal
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

ApplicationStatus = Literal[
    "Saved",
    "Preparing",
    "Applied",
    "Interview",
    "Offer",
    "Rejected",
    "Withdrawn",
]


class ApplicationCreate(BaseModel):
    company: str = Field(..., min_length=1, description="Company or employer name")
    role: str = Field(..., min_length=1, description="Job title or role name")
    job_id: Optional[str] = Field(default=None, description="Linked job description ID")
    resume_id: Optional[str] = Field(default=None, description="Linked resume ID")
    analysis_id: Optional[str] = Field(default=None, description="Linked analysis ID")
    status: ApplicationStatus = Field(default="Saved", description="Application status")
    applied_date: Optional[str] = Field(default=None, description="Date applied (e.g. YYYY-MM-DD or display string)")
    salary_range: Optional[str] = Field(default=None, description="Target or listed compensation")
    match_score: Optional[float] = Field(default=None, description="JobFit match score percentage")
    notes: Optional[str] = Field(default="", description="Personal notes or status context")


class ApplicationUpdate(BaseModel):
    company: Optional[str] = None
    role: Optional[str] = None
    job_id: Optional[str] = None
    resume_id: Optional[str] = None
    analysis_id: Optional[str] = None
    status: Optional[ApplicationStatus] = None
    applied_date: Optional[str] = None
    salary_range: Optional[str] = None
    match_score: Optional[float] = None
    notes: Optional[str] = None


class ApplicationResponse(BaseModel):
    id: str
    company: str
    role: str
    job_id: Optional[str] = None
    resume_id: Optional[str] = None
    analysis_id: Optional[str] = None
    status: str
    applied_date: Optional[str] = None
    salary_range: Optional[str] = None
    match_score: Optional[float] = None
    notes: Optional[str] = ""
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ApplicationStats(BaseModel):
    total: int
    saved: int
    preparing: int
    applied: int
    interview: int
    offer: int
    rejected: int
    withdrawn: int
    recent_analyses_count: int = 0
