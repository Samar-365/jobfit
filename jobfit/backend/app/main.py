"""JobFit FastAPI Application Entrypoint."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db import init_db
from app.models import Resume, JobDescription, Analysis, CoverLetter  # Ensure SQLAlchemy registers tables
from app.api import health, resumes, jobs, analyses, tailoring, cover_letters


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize SQLite database and uploads directory
    init_db()
    _ = settings.upload_path
    yield
    # Shutdown logic if needed


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Local-First AI Job Application Assistant Backend powered by Gemma & Ollama",
    lifespan=lifespan,
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(health.router, prefix="/api")
app.include_router(resumes.router, prefix="/api")
app.include_router(jobs.router, prefix="/api")
app.include_router(analyses.router, prefix="/api")
app.include_router(tailoring.router, prefix="/api")
app.include_router(cover_letters.router, prefix="/api")


@app.get("/")
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs_url": "/docs",
        "health_check": "/api/health",
        "ai_health_check": "/api/health/ai",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
