"""Resume Pydantic Schemas for Structured Data & Validation."""
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class WorkExperienceItem(BaseModel):
    company: str = Field(default="", description="Company or organization name")
    role: str = Field(default="", description="Job title or role")
    period: Optional[str] = Field(default=None, description="Employment dates e.g. '2022 - Present'")
    location: Optional[str] = Field(default=None, description="City, State or Remote")
    bullets: List[str] = Field(default_factory=list, description="Verifiable responsibility and achievement bullets")


class ProjectItem(BaseModel):
    title: str = Field(default="", description="Project title")
    description: Optional[str] = Field(default=None, description="Project overview or objective")
    technologies: List[str] = Field(default_factory=list, description="Tools and languages used")
    link: Optional[str] = Field(default=None, description="URL or repository link")


class EducationItem(BaseModel):
    institution: str = Field(default="", description="College, university, or academy name")
    degree: Optional[str] = Field(default=None, description="Degree type e.g. B.S., M.S.")
    field_of_study: Optional[str] = Field(default=None, description="Major or area of specialization")
    graduation_year: Optional[str] = Field(default=None, description="Year or expected graduation")
    gpa: Optional[str] = Field(default=None, description="GPA if explicitly stated")


class CertificationItem(BaseModel):
    name: str = Field(default="", description="Certification or license title")
    issuer: Optional[str] = Field(default=None, description="Issuing body or organization")
    year: Optional[str] = Field(default=None, description="Year obtained or valid through")


class ParsedResume(BaseModel):
    name: str = Field(default="Candidate", description="Full name of candidate")
    title: Optional[str] = Field(default=None, description="Professional headline or current title")
    email: Optional[str] = Field(default=None, description="Contact email")
    phone: Optional[str] = Field(default=None, description="Contact phone number")
    location: Optional[str] = Field(default=None, description="Current location or city/state")
    summary: Optional[str] = Field(default=None, description="Professional summary or objective")
    technical_skills: List[str] = Field(default_factory=list, description="Languages, frameworks, databases, tools")
    soft_skills: List[str] = Field(default_factory=list, description="Communication, leadership, teamwork")
    experience: List[WorkExperienceItem] = Field(default_factory=list, description="Work experience history")
    projects: List[ProjectItem] = Field(default_factory=list, description="Notable personal or open-source projects")
    education: List[EducationItem] = Field(default_factory=list, description="Academic background")
    certifications: List[CertificationItem] = Field(default_factory=list, description="Certifications and credentials")


class ResumeResponse(BaseModel):
    id: str
    filename: str
    file_type: str
    file_size_bytes: int
    raw_text: str
    parsed_data: ParsedResume
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ResumeUpdate(BaseModel):
    parsed_data: ParsedResume
