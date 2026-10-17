"""Pydantic Schemas for Truthful Resume Tailoring."""
from typing import List, Optional
from pydantic import BaseModel, Field


class TailorBulletRequest(BaseModel):
    bullet_point: str = Field(..., min_length=10, description="Original bullet point from resume")
    job_context: str = Field(..., description="Target role, company, or requirement keywords")
    style: Optional[str] = Field(default="action_impact", description="'action_impact', 'concise', or 'technical'")


class TailoredSuggestion(BaseModel):
    original_text: str
    suggested_text: str
    rationale: str
    aligned_keywords: List[str] = Field(default_factory=list)
    guardrails_passed: bool = True
    warning: Optional[str] = None


class TailorBulletResponse(BaseModel):
    original_text: str
    suggestions: List[TailoredSuggestion]
