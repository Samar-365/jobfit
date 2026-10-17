"""Job Description Pydantic Schemas."""
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class JobRequirementItem(BaseModel):
    id: str = Field(description="Unique requirement identifier e.g. req-1")
    text: str = Field(description="Normalized qualification or requirement sentence")
    category: str = Field(default="must_have", description="'must_have' or 'nice_to_have'")
    importance: str = Field(default="medium", description="'high', 'medium', or 'low'")
    keywords: List[str] = Field(default_factory=list, description="Extracted key skills/terms")


class JobCreate(BaseModel):
    company: Optional[str] = Field(default="Target Company", description="Company or organization name")
    role_title: Optional[str] = Field(default="Target Role", description="Job title")
    raw_text: str = Field(..., min_length=20, description="Full pasted job posting description text")


class JobResponse(BaseModel):
    id: str
    company: str
    role_title: str
    raw_text: str
    requirements: List[JobRequirementItem]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
