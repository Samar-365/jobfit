"""Integration tests for Resume API endpoints."""
import io
import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient

from app.schemas.resume import ParsedResume


@pytest.fixture(autouse=True)
def mock_ollama_parser():
    """Mock the Ollama parser for fast, deterministic API testing."""
    sample_parsed = ParsedResume(
        name="Morgan Lee",
        title="Fullstack Developer",
        email="morgan.lee@example.com",
        phone="+1 555-0100",
        location="Seattle, WA",
        summary="Passionate developer building high-quality software.",
        technical_skills=["Python", "FastAPI", "React", "TypeScript", "PostgreSQL"],
        soft_skills=["Communication", "Agile"],
        experience=[],
        projects=[],
        education=[],
        certifications=[]
    )
    with patch("app.api.resumes.parse_resume_text", new_callable=AsyncMock) as mock_parse:
        mock_parse.return_value = sample_parsed
        yield mock_parse


def test_upload_resume_txt(client: TestClient):
    """Test uploading a valid TXT resume."""
    file_content = b"Morgan Lee\nmorgan.lee@example.com\nFullstack Developer with Python and React."
    response = client.post(
        "/api/resumes",
        files={"file": ("morgan_resume.txt", io.BytesIO(file_content), "text/plain")}
    )

    assert response.status_code == 201
    data = response.json()
    assert data["filename"] == "morgan_resume.txt"
    assert data["file_type"] == "txt"
    assert data["parsed_data"]["name"] == "Morgan Lee"
    assert "Python" in data["parsed_data"]["technical_skills"]
    assert "id" in data


def test_list_and_get_resumes(client: TestClient):
    """Test retrieving lists of resumes and individual records."""
    # Upload first
    file_content = b"Test Candidate\ntest@example.com\nPython Engineer"
    post_resp = client.post(
        "/api/resumes",
        files={"file": ("test.txt", io.BytesIO(file_content), "text/plain")}
    )
    resume_id = post_resp.json()["id"]

    # List all
    list_resp = client.get("/api/resumes")
    assert list_resp.status_code == 200
    resumes = list_resp.json()
    assert len(resumes) >= 1
    assert any(r["id"] == resume_id for r in resumes)

    # Get single
    single_resp = client.get(f"/api/resumes/{resume_id}")
    assert single_resp.status_code == 200
    assert single_resp.json()["id"] == resume_id


def test_update_resume_structured_fields(client: TestClient):
    """Test updating parsed resume fields following manual user adjustments."""
    file_content = b"Candidate Text"
    post_resp = client.post(
        "/api/resumes",
        files={"file": ("candidate.txt", io.BytesIO(file_content), "text/plain")}
    )
    resume_id = post_resp.json()["id"]
    current_parsed = post_resp.json()["parsed_data"]

    # User modifies name and adds a skill
    current_parsed["name"] = "Morgan Lee, PhD"
    current_parsed["technical_skills"].append("GraphQL")

    put_resp = client.put(
        f"/api/resumes/{resume_id}",
        json={"parsed_data": current_parsed}
    )
    assert put_resp.status_code == 200
    updated_data = put_resp.json()
    assert updated_data["parsed_data"]["name"] == "Morgan Lee, PhD"
    assert "GraphQL" in updated_data["parsed_data"]["technical_skills"]


def test_delete_resume(client: TestClient):
    """Test deleting a resume."""
    file_content = b"Delete Me"
    post_resp = client.post(
        "/api/resumes",
        files={"file": ("temp.txt", io.BytesIO(file_content), "text/plain")}
    )
    resume_id = post_resp.json()["id"]

    del_resp = client.delete(f"/api/resumes/{resume_id}")
    assert del_resp.status_code == 204

    # Confirm 404 after deletion
    get_resp = client.get(f"/api/resumes/{resume_id}")
    assert get_resp.status_code == 404
