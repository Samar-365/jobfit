"""Unit and integration tests for truthful bullet tailoring and grounded cover letters."""
import io
import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient

from app.schemas.tailoring import TailoredSuggestion
from app.ai.tailoring import (
    validate_tailoring_guardrails,
    heuristic_tailor_bullet,
    tailor_resume_bullet,
)
from app.ai.cover_letter import heuristic_cover_letter
from app.schemas.resume import ParsedResume, WorkExperienceItem


def test_guardrails_flag_invented_metrics():
    """Verify that guardrails catch and flag numbers not present in original text."""
    original = "Built microservices for document processing."
    fabricated = "Built microservices for document processing, reducing latency by 45% and saving $200k."

    is_safe, warning = validate_tailoring_guardrails(original, fabricated)
    assert is_safe is False
    assert warning is not None
    assert "45%" in warning or "200k" in warning


def test_guardrails_flag_unearned_credentials():
    """Verify that guardrails catch unearned certifications/degrees."""
    original = "Managed cloud infrastructure and Kubernetes deployments."
    fabricated = "Managed cloud infrastructure as a Certified Kubernetes Administrator (CKA) with a PhD."

    is_safe, warning = validate_tailoring_guardrails(original, fabricated)
    assert is_safe is False
    assert warning is not None
    assert "phd" in warning.lower()


def test_guardrails_allow_genuine_rephrasing():
    """Verify authentic active verb upgrades without added numbers pass cleanly."""
    original = "Worked on Python APIs with FastAPI."
    upgraded = "Architected high-throughput Python REST APIs leveraging FastAPI."

    is_safe, warning = validate_tailoring_guardrails(original, suggested=upgraded)
    assert is_safe is True
    assert warning is None


def test_guardrails_preserve_original_metrics():
    """Verify that existing factual numbers in the original bullet are permitted."""
    original = "Optimized PostgreSQL indexes, reducing query latency by 35% across 20M records."
    upgraded = "Architected PostgreSQL indexes, reducing query latency by 35% across 20M records."

    is_safe, warning = validate_tailoring_guardrails(original, upgraded)
    assert is_safe is True
    assert warning is None


def test_heuristic_tailoring_upgrades_weak_verbs():
    """Verify rule-based fallback upgrades common passive verbs."""
    bullet = "worked on database migrations using Alembic"
    suggestions = heuristic_tailor_bullet(bullet, "FastAPI backend")
    assert len(suggestions) >= 1
    assert "Engineered" in suggestions[0].suggested_text
    assert suggestions[0].guardrails_passed is True


def test_cover_letter_placeholder_policy():
    """Verify cover letters use bracketed placeholders for unstated personal motivations."""
    parsed = ParsedResume(
        name="Taylor Swift",
        technical_skills=["Python", "FastAPI"],
        experience=[
            WorkExperienceItem(
                company="Acme Corp",
                role="Software Engineer",
                bullets=["Built APIs"],
            )
        ],
    )
    markdown, placeholders, skills = heuristic_cover_letter(
        parsed_resume=parsed,
        company="Datadog",
        role_title="Backend Engineer",
        motivation_notes="",
    )

    assert "[" in markdown and "]" in markdown
    assert len(placeholders) >= 1
    assert "Datadog" in markdown
    assert "Backend Engineer" in markdown


def test_tailor_bullet_api(client: TestClient):
    """Test POST /api/tailor/bullet endpoint."""
    payload = {
        "bullet_point": "helped with building responsive web interfaces in React",
        "job_context": "Frontend Engineer, React, TypeScript",
        "style": "action_impact",
    }
    resp = client.post("/api/tailor/bullet", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["suggestions"]) >= 1
    assert data["original_text"] == payload["bullet_point"]
    assert data["suggestions"][0]["guardrails_passed"] is True


def test_cover_letter_lifecycle_api(client: TestClient):
    """Test cover letter generation, retrieval, update, and deletion endpoints."""
    # 1. Upload sample resume first
    res_resp = client.post(
        "/api/resumes",
        files={"file": ("resume.txt", io.BytesIO(b"Jane Doe\nPython Developer"), "text/plain")}
    )
    resume_id = res_resp.json()["id"]

    # 2. Generate cover letter
    gen_payload = {
        "resume_id": resume_id,
        "company": "Linear",
        "role_title": "Product Engineer",
        "user_motivation_notes": "I use Linear daily and love keyboard-first software.",
    }
    gen_resp = client.post("/api/cover-letters/generate", json=gen_payload)
    assert gen_resp.status_code == 201
    letter_data = gen_resp.json()
    assert letter_data["company"] == "Linear"
    assert "Linear" in letter_data["content_markdown"]
    letter_id = letter_data["id"]

    # 3. List cover letters
    list_resp = client.get("/api/cover-letters")
    assert list_resp.status_code == 200
    assert any(l["id"] == letter_id for l in list_resp.json())

    # 4. Update cover letter
    put_resp = client.put(
        f"/api/cover-letters/{letter_id}",
        json={
            "resume_id": resume_id,
            "company": "Linear",
            "role_title": "Senior Product Engineer",
            "content_markdown": "# Custom Edited Cover Letter\n\nDear Linear Team..."
        }
    )
    assert put_resp.status_code == 200
    assert put_resp.json()["role_title"] == "Senior Product Engineer"

    # 5. Delete cover letter
    del_resp = client.delete(f"/api/cover-letters/{letter_id}")
    assert del_resp.status_code == 204
