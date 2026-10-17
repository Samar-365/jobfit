"""SQLAlchemy Model for Job Match Analyses."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Text, DateTime, JSON, ForeignKey
from app.db import Base


class Analysis(Base):
    """Analysis model persisting evidence-backed match evaluations between resume and job."""
    __tablename__ = "analyses"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    resume_id = Column(String(36), ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    
    company = Column(String(255), nullable=False)
    role_title = Column(String(255), nullable=False)
    
    score = Column(Float, nullable=False, default=0.0)
    must_have_score = Column(Float, nullable=False, default=0.0)
    nice_to_have_score = Column(Float, nullable=False, default=0.0)
    
    match_status_breakdown = Column(JSON, nullable=False, default=dict)
    evidence_items = Column(JSON, nullable=False, default=list)
    summary = Column(Text, nullable=False, default="")
    disclaimer = Column(Text, nullable=False, default="Estimated match based on supplied text. Not an ATS guarantee.")
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
