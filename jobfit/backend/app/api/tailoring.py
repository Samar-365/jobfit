"""API Endpoints for Resume Bullet Point Tailoring."""
from fastapi import APIRouter, status
from app.schemas.tailoring import TailorBulletRequest, TailorBulletResponse
from app.ai.tailoring import tailor_resume_bullet

router = APIRouter(prefix="/tailor", tags=["Tailoring"])


@router.post("/bullet", response_model=TailorBulletResponse, status_code=status.HTTP_200_OK)
async def tailor_bullet(payload: TailorBulletRequest) -> TailorBulletResponse:
    """
    Rephrase a single resume bullet point to align with target job requirements
    while strictly enforcing anti-fabrication guardrails (no invented metrics or claims).
    """
    suggestions = await tailor_resume_bullet(
        bullet_point=payload.bullet_point,
        job_context=payload.job_context,
        style=payload.style or "action_impact",
    )

    return TailorBulletResponse(
        original_text=payload.bullet_point,
        suggestions=suggestions,
    )
