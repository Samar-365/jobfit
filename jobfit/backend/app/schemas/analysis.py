"""Analysis and Evidence Matching Pydantic Schemas."""
from enum import Enum
from typing import List, Optional, Dict
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class MatchStatus(str, Enum):
    EXACT_MATCH = "EXACT_MATCH"
    PARTIAL_MATCH = "PARTIAL_MATCH"
    NOT_MENTIONED = "NOT_MENTIONED"
    UNASSESSABLE = "UNASSESSABLE"


class RequirementEvidence(BaseModel):
    requirement_id: str
    requirement_text: str
    category: str = Field(default="must_have", description="'must_have' or 'nice_to_have'")
    status: MatchStatus
    resume_quote: Optional[str] = Field(
        default=None,
        description="Verbatim verifiable snippet quoted directly from candidate's resume"
    )
    reasoning: str = Field(
        description="Factual explanation of how the evidence supports the requirement"
    )
    recommendation: Optional[str] = Field(
        default=None,
        description="Actionable suggestion for addressing unmentioned areas or emphasizing transferable skills"
    )


class AnalysisCreate(BaseModel):
    resume_id: str = Field(..., description="ID of previously parsed candidate resume")
    job_id: Optional[str] = Field(default=None, description="Optional ID of existing JobDescription")
    company: Optional[str] = Field(default="Target Company", description="Target employer name")
    role_title: Optional[str] = Field(default="Target Role", description="Target job title")
    job_description_text: Optional[str] = Field(default=None, description="Pasted job description text if not using existing job_id")


class AnalysisResponse(BaseModel):
    id: str
    resume_id: str
    job_id: str
    company: str
    role_title: str
    score: float = Field(..., description="Deterministic overall match percentage (0-100)")
    must_have_score: float = Field(..., description="Must-have qualifications score (0-100)")
    nice_to_have_score: float = Field(..., description="Nice-to-have qualifications score (0-100)")
    match_status_breakdown: Dict[str, int] = Field(..., description="Count of exact, partial, not_mentioned items")
    evidence_items: List[RequirementEvidence]
    summary: str
    disclaimer: str = "Estimated match based on supplied text. Not an ATS guarantee."
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
