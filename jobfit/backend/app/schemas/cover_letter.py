"""Pydantic Schemas for Grounded Cover Letter Generation."""
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class CoverLetterRequest(BaseModel):
    resume_id: str = Field(..., description="ID of candidate's parsed resume")
    company: str = Field(..., description="Company name")
    role_title: str = Field(..., description="Job title")
    job_description: Optional[str] = Field(default=None, description="Optional job description text for deeper tailoring")
    user_motivation_notes: Optional[str] = Field(
        default=None,
        description="Optional personal angle e.g. 'I admire their open-source tools'"
    )
    tone: Optional[str] = Field(default="professional", description="'professional', 'enthusiastic', or 'concise'")


class CoverLetterResponse(BaseModel):
    id: Optional[str] = None
    company: str
    role_title: str
    content_markdown: str
    placeholders_used: List[str] = Field(default_factory=list)
    cited_skills: List[str] = Field(default_factory=list)
    disclaimer: str = "Drafted with grounded resume evidence. Review and fill bracketed tokens before submitting."
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class CoverLetterSave(BaseModel):
    resume_id: str
    company: str
    role_title: str
    content_markdown: str
