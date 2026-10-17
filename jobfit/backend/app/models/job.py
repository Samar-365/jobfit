"""SQLAlchemy Model for Job Descriptions."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, JSON
from app.db import Base


class JobDescription(Base):
    """JobDescription model storing pasted job posting and structured requirements."""
    __tablename__ = "jobs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company = Column(String(255), nullable=False, default="Target Company")
    role_title = Column(String(255), nullable=False, default="Target Role")
    raw_text = Column(Text, nullable=False)
    requirements = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
