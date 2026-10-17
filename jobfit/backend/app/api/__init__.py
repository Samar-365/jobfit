"""API Routers Package."""
from app.api.health import router as health_router
from app.api.resumes import router as resumes_router
from app.api.jobs import router as jobs_router
from app.api.analyses import router as analyses_router
from app.api.tailoring import router as tailoring_router
from app.api.cover_letters import router as cover_letters_router

__all__ = [
    "health_router",
    "resumes_router",
    "jobs_router",
    "analyses_router",
    "tailoring_router",
    "cover_letters_router",
]
