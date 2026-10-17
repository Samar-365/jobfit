"""SQLAlchemy Model for Saved Cover Letters."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from app.db import Base


class CoverLetter(Base):
    """CoverLetter model persisting generated and user-edited cover letter drafts."""
    __tablename__ = "cover_letters"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    resume_id = Column(String(36), ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    company = Column(String(255), nullable=False)
    role_title = Column(String(255), nullable=False)
    content_markdown = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
