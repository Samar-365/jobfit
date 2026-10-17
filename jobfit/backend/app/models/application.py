"""SQLAlchemy Model for Application Tracking."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Text, DateTime, ForeignKey
from app.db import Base


class Application(Base):
    """Application model representing a tracked job application."""
    __tablename__ = "applications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company = Column(String(255), nullable=False)
    role = Column(String(255), nullable=False)
    
    # Optional foreign key references to linked job, resume, and analysis
    job_id = Column(String(36), ForeignKey("jobs.id", ondelete="SET NULL"), nullable=True)
    resume_id = Column(String(36), ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True)
    analysis_id = Column(String(36), ForeignKey("analyses.id", ondelete="SET NULL"), nullable=True)
    
    # Statuses: Saved, Preparing, Applied, Interview, Offer, Rejected, Withdrawn
    status = Column(String(50), nullable=False, default="Saved")
    applied_date = Column(String(100), nullable=True)
    salary_range = Column(String(100), nullable=True)
    match_score = Column(Float, nullable=True)
    notes = Column(Text, nullable=True, default="")
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
