"""API Endpoints for Resume Upload, Parsing, Retrieval, and Updates."""
import os
from typing import List
from pathlib import Path
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.resume import Resume
from app.schemas.resume import ResumeResponse, ResumeUpdate, ParsedResume
from app.services.file_parser import save_uploaded_file, extract_text_from_file
from app.ai.parser import parse_resume_text

router = APIRouter(prefix="/resumes", tags=["Resumes"])


@router.post("", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED)
async def upload_and_parse_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> Resume:
    """
    Upload a resume (PDF, DOCX, or TXT), safely store locally,
    extract raw text, and parse into structured schemas using Gemma.
    """
    # 1. Safe storage
    original_filename, safe_path, file_size = await save_uploaded_file(file)
    file_ext = Path(original_filename).suffix.lower()

    # 2. Extract plain text
    try:
        raw_text = extract_text_from_file(safe_path, file_ext)
    except Exception as exc:
        # Cleanup uploaded file if parsing fails
        if safe_path.exists():
            os.remove(safe_path)
        raise exc

    # 3. Parse structured schema with Gemma
    parsed_model: ParsedResume = await parse_resume_text(raw_text)

    # 4. Persist to SQLite
    resume = Resume(
        filename=original_filename,
        file_path=str(safe_path),
        file_type=file_ext.lstrip("."),
        file_size_bytes=file_size,
        raw_text=raw_text,
        parsed_data=parsed_model.model_dump(),
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return resume


@router.get("", response_model=List[ResumeResponse])
def list_resumes(db: Session = Depends(get_db)) -> List[Resume]:
    """Retrieve all uploaded resumes, ordered by latest first."""
    return db.query(Resume).order_by(Resume.created_at.desc()).all()


@router.get("/{resume_id}", response_model=ResumeResponse)
def get_resume(resume_id: str, db: Session = Depends(get_db)) -> Resume:
    """Retrieve a single resume by its UUID."""
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resume with id '{resume_id}' not found."
        )
    return resume


@router.put("/{resume_id}", response_model=ResumeResponse)
def update_resume(
    resume_id: str,
    update_data: ResumeUpdate,
    db: Session = Depends(get_db),
) -> Resume:
    """Update structured fields of a resume following manual user edits."""
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resume with id '{resume_id}' not found."
        )

    resume.parsed_data = update_data.parsed_data.model_dump()
    db.commit()
    db.refresh(resume)
    return resume


@router.post("/{resume_id}/reparse", response_model=ResumeResponse)
async def reparse_resume(
    resume_id: str,
    db: Session = Depends(get_db),
) -> Resume:
    """Re-run Gemma extraction on previously saved raw resume text."""
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resume with id '{resume_id}' not found."
        )

    parsed_model: ParsedResume = await parse_resume_text(resume.raw_text)
    resume.parsed_data = parsed_model.model_dump()
    db.commit()
    db.refresh(resume)
    return resume


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resume(resume_id: str, db: Session = Depends(get_db)) -> None:
    """Delete resume from database and remove uploaded file from filesystem."""
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resume with id '{resume_id}' not found."
        )

    # Remove physical file if it exists
    file_path = Path(resume.file_path)
    if file_path.exists():
        try:
            os.remove(file_path)
        except Exception:
            pass

    db.delete(resume)
    db.commit()
    return None
