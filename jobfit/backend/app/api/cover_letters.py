"""API Endpoints for Grounded Cover Letter Generation and Management."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.resume import Resume
from app.models.cover_letter import CoverLetter
from app.schemas.cover_letter import CoverLetterRequest, CoverLetterResponse, CoverLetterSave
from app.schemas.resume import ParsedResume
from app.ai.cover_letter import generate_grounded_cover_letter

router = APIRouter(prefix="/cover-letters", tags=["Cover Letters"])


@router.post("/generate", response_model=CoverLetterResponse, status_code=status.HTTP_201_CREATED)
async def generate_cover_letter(
    payload: CoverLetterRequest,
    db: Session = Depends(get_db),
) -> CoverLetterResponse:
    """
    Generate a grounded cover letter draft connecting verified resume evidence
    to target job criteria, using explicit bracketed placeholders for unstated personal motivations.
    """
    resume = db.query(Resume).filter(Resume.id == payload.resume_id).first()
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resume '{payload.resume_id}' not found."
        )

    parsed = ParsedResume.model_validate(resume.parsed_data)

    content_markdown, placeholders, cited_skills = await generate_grounded_cover_letter(
        resume_text=resume.raw_text,
        parsed_resume=parsed,
        company=payload.company,
        role_title=payload.role_title,
        job_description=payload.job_description or "",
        motivation_notes=payload.user_motivation_notes or "",
    )

    # Persist in SQLite
    cover_letter = CoverLetter(
        resume_id=resume.id,
        company=payload.company,
        role_title=payload.role_title,
        content_markdown=content_markdown,
    )
    db.add(cover_letter)
    db.commit()
    db.refresh(cover_letter)

    return CoverLetterResponse(
        id=cover_letter.id,
        company=cover_letter.company,
        role_title=cover_letter.role_title,
        content_markdown=cover_letter.content_markdown,
        placeholders_used=placeholders,
        cited_skills=cited_skills,
        created_at=cover_letter.created_at,
    )


@router.get("", response_model=List[CoverLetterResponse])
def list_cover_letters(db: Session = Depends(get_db)) -> List[CoverLetter]:
    """Retrieve all saved cover letter drafts."""
    return db.query(CoverLetter).order_by(CoverLetter.created_at.desc()).all()


@router.get("/{letter_id}", response_model=CoverLetterResponse)
def get_cover_letter(letter_id: str, db: Session = Depends(get_db)) -> CoverLetter:
    """Retrieve a single cover letter draft by ID."""
    letter = db.query(CoverLetter).filter(CoverLetter.id == letter_id).first()
    if not letter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cover letter '{letter_id}' not found."
        )
    return letter


@router.put("/{letter_id}", response_model=CoverLetterResponse)
def update_cover_letter(
    letter_id: str,
    payload: CoverLetterSave,
    db: Session = Depends(get_db),
) -> CoverLetter:
    """Save manual edits to a cover letter markdown draft."""
    letter = db.query(CoverLetter).filter(CoverLetter.id == letter_id).first()
    if not letter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cover letter '{letter_id}' not found."
        )

    letter.company = payload.company
    letter.role_title = payload.role_title
    letter.content_markdown = payload.content_markdown
    db.commit()
    db.refresh(letter)
    return letter


@router.delete("/{letter_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_cover_letter(letter_id: str, db: Session = Depends(get_db)) -> None:
    """Delete a cover letter draft."""
    letter = db.query(CoverLetter).filter(CoverLetter.id == letter_id).first()
    if not letter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cover letter '{letter_id}' not found."
        )
    db.delete(letter)
    db.commit()
    return None
