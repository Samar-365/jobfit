"""API Endpoints for Application Tracking and Management."""
import csv
import io
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db import get_db
from app.models.application import Application
from app.models.analysis import Analysis
from app.schemas.application import (
    ApplicationCreate,
    ApplicationUpdate,
    ApplicationResponse,
    ApplicationStats,
)

router = APIRouter(prefix="/applications", tags=["Applications"])


@router.get("", response_model=List[ApplicationResponse])
def list_applications(
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
) -> List[Application]:
    """Retrieve all tracked applications, optionally filtered by status, ordered by newest first."""
    query = db.query(Application)
    if status_filter and status_filter.lower() != "all":
        query = query.filter(func.lower(Application.status) == status_filter.lower())
    return query.order_by(Application.updated_at.desc()).all()


@router.get("/stats", response_model=ApplicationStats)
def get_application_stats(db: Session = Depends(get_db)) -> ApplicationStats:
    """Retrieve aggregated status metrics and counts for the dashboard."""
    apps = db.query(Application).all()
    recent_analyses = db.query(Analysis).count()

    counts = {
        "Saved": 0,
        "Preparing": 0,
        "Applied": 0,
        "Interview": 0,
        "Offer": 0,
        "Rejected": 0,
        "Withdrawn": 0,
    }

    for app in apps:
        norm_status = app.status.capitalize()
        if norm_status in counts:
            counts[norm_status] += 1
        else:
            # fallback matching
            for k in counts:
                if k.lower() == str(app.status).lower():
                    counts[k] += 1
                    break

    return ApplicationStats(
        total=len(apps),
        saved=counts["Saved"],
        preparing=counts["Preparing"],
        applied=counts["Applied"],
        interview=counts["Interview"],
        offer=counts["Offer"],
        rejected=counts["Rejected"],
        withdrawn=counts["Withdrawn"],
        recent_analyses_count=recent_analyses,
    )


@router.get("/export/csv")
def export_applications_csv(db: Session = Depends(get_db)) -> Response:
    """Export all tracked application records as a downloadable CSV file."""
    applications = db.query(Application).order_by(Application.created_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)

    # Header row
    writer.writerow([
        "ID",
        "Company",
        "Role",
        "Status",
        "Match Score (%)",
        "Applied Date",
        "Salary Range",
        "Notes",
        "Analysis ID",
        "Created At",
        "Updated At",
    ])

    for app in applications:
        writer.writerow([
            app.id,
            app.company,
            app.role,
            app.status,
            f"{app.match_score:.1f}" if app.match_score is not None else "",
            app.applied_date or "",
            app.salary_range or "",
            app.notes or "",
            app.analysis_id or "",
            app.created_at.strftime("%Y-%m-%d %H:%M:%S") if app.created_at else "",
            app.updated_at.strftime("%Y-%m-%d %H:%M:%S") if app.updated_at else "",
        ])

    csv_content = output.getvalue()
    output.close()

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": 'attachment; filename="jobfit_applications.csv"',
            "Cache-Control": "no-cache",
        },
    )


@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def create_application(
    payload: ApplicationCreate,
    db: Session = Depends(get_db),
) -> Application:
    """Create a new tracked job application record."""
    # If match_score is not provided but analysis_id is, auto-populate score and company/role if needed
    match_score = payload.match_score
    if match_score is None and payload.analysis_id:
        analysis = db.query(Analysis).filter(Analysis.id == payload.analysis_id).first()
        if analysis:
            match_score = analysis.score

    app = Application(
        company=payload.company.strip(),
        role=payload.role.strip(),
        job_id=payload.job_id,
        resume_id=payload.resume_id,
        analysis_id=payload.analysis_id,
        status=payload.status,
        applied_date=payload.applied_date,
        salary_range=payload.salary_range,
        match_score=match_score,
        notes=payload.notes or "",
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    return app


@router.get("/{application_id}", response_model=ApplicationResponse)
def get_application(
    application_id: str,
    db: Session = Depends(get_db),
) -> Application:
    """Retrieve an application record by its unique ID."""
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application '{application_id}' not found.",
        )
    return app


@router.patch("/{application_id}", response_model=ApplicationResponse)
def update_application(
    application_id: str,
    payload: ApplicationUpdate,
    db: Session = Depends(get_db),
) -> Application:
    """Update fields of an application (status, notes, dates, salary, etc.)."""
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application '{application_id}' not found.",
        )

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(app, field, value)

    app.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(app)
    return app


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(
    application_id: str,
    db: Session = Depends(get_db),
):
    """Delete an application record."""
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application '{application_id}' not found.",
        )
    db.delete(app)
    db.commit()
    return None
