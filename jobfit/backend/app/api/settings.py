"""API Endpoints for Settings, Governance, and Local Data Purge."""
import os
import shutil
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.config import settings
from app.models.resume import Resume
from app.models.job import JobDescription
from app.models.analysis import Analysis
from app.models.cover_letter import CoverLetter
from app.models.application import Application

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.post("/purge-data", status_code=status.HTTP_200_OK)
def purge_all_local_data(db: Session = Depends(get_db)):
    """
    Comprehensive local data sanitization:
    Wipes all SQLite records (applications, analyses, cover letters, jobs, resumes)
    and removes all uploaded career documents from the local filesystem.
    """
    # 1. Delete all database records across all tables
    db.query(Application).delete()
    db.query(Analysis).delete()
    db.query(CoverLetter).delete()
    db.query(JobDescription).delete()
    db.query(Resume).delete()
    db.commit()

    # 2. Delete all uploaded files in uploads directory
    upload_dir = settings.upload_path
    if upload_dir.exists():
        for filename in os.listdir(upload_dir):
            file_path = upload_dir / filename
            try:
                if file_path.is_file() or file_path.is_symlink():
                    os.unlink(file_path)
                elif file_path.is_dir():
                    shutil.rmtree(file_path)
            except Exception as e:
                pass

    return {
        "status": "purged",
        "message": "All local database records and uploaded resume documents have been permanently wiped.",
    }
