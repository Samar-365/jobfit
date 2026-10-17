"""API Endpoints for Job Description Management and Requirement Extraction."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.job import JobDescription
from app.schemas.job import JobCreate, JobResponse
from app.ai.matcher import extract_job_requirements

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def create_job_description(
    payload: JobCreate,
    db: Session = Depends(get_db),
) -> JobDescription:
    """
    Ingest a job posting description, extract structured requirements using Gemma,
    and persist in SQLite.
    """
    requirements = await extract_job_requirements(payload.raw_text)

    job = JobDescription(
        company=payload.company or "Target Company",
        role_title=payload.role_title or "Target Role",
        raw_text=payload.raw_text,
        requirements=[r.model_dump() for r in requirements],
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


@router.get("", response_model=List[JobResponse])
def list_jobs(db: Session = Depends(get_db)) -> List[JobDescription]:
    """Retrieve all saved job descriptions, ordered by newest first."""
    return db.query(JobDescription).order_by(JobDescription.created_at.desc()).all()


@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: str, db: Session = Depends(get_db)) -> JobDescription:
    """Retrieve a single job description by ID."""
    job = db.query(JobDescription).filter(JobDescription.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job description '{job_id}' not found."
        )
    return job


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(job_id: str, db: Session = Depends(get_db)) -> None:
    """Delete a saved job description."""
    job = db.query(JobDescription).filter(JobDescription.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job description '{job_id}' not found."
        )
    db.delete(job)
    db.commit()
    return None
