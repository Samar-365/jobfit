"""API Endpoints for Resume-to-Job Matching and Evidence Gap Analysis."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.resume import Resume
from app.models.job import JobDescription
from app.models.analysis import Analysis
from app.schemas.analysis import AnalysisCreate, AnalysisResponse
from app.schemas.job import JobRequirementItem
from app.schemas.resume import ParsedResume
from app.ai.matcher import extract_job_requirements, match_resume_to_requirements
from app.services.scoring_engine import compute_deterministic_score

router = APIRouter(prefix="/analyses", tags=["Analyses"])


@router.post("", response_model=AnalysisResponse, status_code=status.HTTP_201_CREATED)
async def create_analysis(
    payload: AnalysisCreate,
    db: Session = Depends(get_db),
) -> Analysis:
    """
    Run evidence-backed match analysis between a resume and target job.
    Evaluates requirements against resume text, cites verbatim quotes,
    and computes deterministic scores.
    """
    # 1. Fetch Resume
    resume = db.query(Resume).filter(Resume.id == payload.resume_id).first()
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resume '{payload.resume_id}' not found."
        )

    parsed_resume = ParsedResume.model_validate(resume.parsed_data)

    # 2. Resolve or Create Job Description
    if payload.job_id:
        job = db.query(JobDescription).filter(JobDescription.id == payload.job_id).first()
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Job description '{payload.job_id}' not found."
            )
        requirements = [JobRequirementItem.model_validate(r) for r in job.requirements]
    else:
        if not payload.job_description_text or len(payload.job_description_text.strip()) < 20:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Must provide either a valid job_id or job_description_text."
            )
        extracted_reqs = await extract_job_requirements(payload.job_description_text)
        job = JobDescription(
            company=payload.company or "Target Company",
            role_title=payload.role_title or "Target Role",
            raw_text=payload.job_description_text,
            requirements=[r.model_dump() for r in extracted_reqs],
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        requirements = extracted_reqs

    # 3. Match resume text to requirements with evidence citations
    evidence_items, summary = await match_resume_to_requirements(
        resume_text=resume.raw_text,
        parsed_resume=parsed_resume,
        requirements=requirements,
    )

    # 4. Calculate deterministic scores
    overall_score, must_have_score, nice_to_have_score, breakdown = compute_deterministic_score(
        evidence_items
    )

    # 5. Persist Analysis record
    analysis = Analysis(
        resume_id=resume.id,
        job_id=job.id,
        company=job.company,
        role_title=job.role_title,
        score=overall_score,
        must_have_score=must_have_score,
        nice_to_have_score=nice_to_have_score,
        match_status_breakdown=breakdown,
        evidence_items=[item.model_dump() for item in evidence_items],
        summary=summary,
        disclaimer="Estimated match based on supplied text. Not an ATS guarantee.",
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    return analysis


@router.get("", response_model=List[AnalysisResponse])
def list_analyses(db: Session = Depends(get_db)) -> List[Analysis]:
    """Retrieve all saved analyses, ordered by latest first."""
    return db.query(Analysis).order_by(Analysis.created_at.desc()).all()


@router.get("/{analysis_id}", response_model=AnalysisResponse)
def get_analysis(analysis_id: str, db: Session = Depends(get_db)) -> Analysis:
    """Retrieve a single match analysis by ID."""
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis '{analysis_id}' not found."
        )
    return analysis


@router.delete("/{analysis_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_analysis(analysis_id: str, db: Session = Depends(get_db)) -> None:
    """Delete a saved analysis record."""
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis '{analysis_id}' not found."
        )
    db.delete(analysis)
    db.commit()
    return None
