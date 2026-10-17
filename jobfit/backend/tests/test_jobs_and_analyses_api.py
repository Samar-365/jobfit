"""Integration tests for Job Description and Match Analysis APIs."""
import io
import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient

from app.schemas.resume import ParsedResume
from app.schemas.analysis import MatchStatus, RequirementEvidence


@pytest.fixture(autouse=True)
def mock_ai_engines():
    """Mock the AI requirement extractor and evidence matcher for clean deterministic API tests."""
    with patch("app.api.resumes.parse_resume_text", new_callable=AsyncMock) as mock_res, \
         patch("app.api.analyses.match_resume_to_requirements", new_callable=AsyncMock) as mock_match:
        
        mock_res.return_value = ParsedResume(
            name="Alex Rivera",
            technical_skills=["Python", "FastAPI", "React", "PostgreSQL"],
        )

        sample_evidence = [
            RequirementEvidence(
                requirement_id="req-1",
                requirement_text="Experience building microservices in Python",
                category="must_have",
                status=MatchStatus.EXACT_MATCH,
                resume_quote="Led Python microservices architecture",
                reasoning="Verbatim citation matched.",
                recommendation=None,
            ),
            RequirementEvidence(
                requirement_id="req-2",
                requirement_text="Kubernetes cluster orchestration",
                category="nice_to_have",
                status=MatchStatus.NOT_MENTIONED,
                resume_quote=None,
                reasoning="No Kubernetes experience present.",
                recommendation="Highlight transferable Docker skills.",
            ),
        ]
        mock_match.return_value = (sample_evidence, "Solid alignment on Python services.")
        yield


def test_job_and_analysis_lifecycle(client: TestClient):
    """Verify full workflow: upload resume -> create job -> run analysis -> retrieve analysis -> delete."""
    # 1. Upload resume
    resume_resp = client.post(
        "/api/resumes",
        files={"file": ("resume.txt", io.BytesIO(b"Alex Rivera\nPython Engineer"), "text/plain")}
    )
    assert resume_resp.status_code == 201
    resume_id = resume_resp.json()["id"]

    # 2. Ingest Job Description
    job_payload = {
        "company": "Stripe",
        "role_title": "Backend Software Engineer",
        "raw_text": "Requirements: Experience building microservices in Python and Kubernetes."
    }
    job_resp = client.post("/api/jobs", json=job_payload)
    assert job_resp.status_code == 201
    job_data = job_resp.json()
    assert job_data["company"] == "Stripe"
    assert job_data["role_title"] == "Backend Software Engineer"
    job_id = job_data["id"]

    # 3. Create Analysis
    analysis_payload = {
        "resume_id": resume_id,
        "job_id": job_id,
    }
    analysis_resp = client.post("/api/analyses", json=analysis_payload)
    assert analysis_resp.status_code == 201
    analysis_data = analysis_resp.json()
    assert analysis_data["company"] == "Stripe"
    assert "score" in analysis_data
    # 1 must-have exact (100%), 1 nice-to-have not mentioned (0%) -> 100*0.7 + 0*0.3 = 70.0
    assert analysis_data["score"] == 70.0
    assert analysis_data["must_have_score"] == 100.0
    assert len(analysis_data["evidence_items"]) == 2
    analysis_id = analysis_data["id"]

    # 4. Get Analysis
    get_resp = client.get(f"/api/analyses/{analysis_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == analysis_id

    # 5. List Analyses
    list_resp = client.get("/api/analyses")
    assert list_resp.status_code == 200
    assert len(list_resp.json()) >= 1

    # 6. Delete Analysis
    del_resp = client.delete(f"/api/analyses/{analysis_id}")
    assert del_resp.status_code == 204
