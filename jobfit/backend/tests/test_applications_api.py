"""Unit and Integration Tests for Applications Tracker API."""
from fastapi.testclient import TestClient
from app.models.analysis import Analysis
from app.models.resume import Resume
from app.models.job import JobDescription


def test_create_and_get_application(client: TestClient):
    payload = {
        "company": "Anthropic",
        "role": "Frontend Systems Engineer",
        "status": "Preparing",
        "salary_range": "$160k-$190k",
        "applied_date": "2026-10-18",
        "notes": "Referral from teammate. Working on portfolio updates.",
    }
    create_res = client.post("/api/applications", json=payload)
    assert create_res.status_code == 201
    created_data = create_res.json()
    assert created_data["company"] == "Anthropic"
    assert created_data["role"] == "Frontend Systems Engineer"
    assert created_data["status"] == "Preparing"
    app_id = created_data["id"]

    # Get single application
    get_res = client.get(f"/api/applications/{app_id}")
    assert get_res.status_code == 200
    assert get_res.json()["salary_range"] == "$160k-$190k"


def test_list_and_filter_applications(client: TestClient):
    # Create two applications with different statuses
    client.post("/api/applications", json={
        "company": "Stripe",
        "role": "Infrastructure Engineer",
        "status": "Interview",
    })
    client.post("/api/applications", json={
        "company": "Vercel",
        "role": "DX Engineer",
        "status": "Offer",
    })

    # List all
    all_res = client.get("/api/applications")
    assert all_res.status_code == 200
    all_data = all_res.json()
    assert len(all_data) >= 2

    # Filter by Interview
    interview_res = client.get("/api/applications?status=Interview")
    assert interview_res.status_code == 200
    interview_data = interview_res.json()
    assert all(a["status"] == "Interview" for a in interview_data)
    assert any(a["company"] == "Stripe" for a in interview_data)


def test_update_and_delete_application(client: TestClient):
    create_res = client.post("/api/applications", json={
        "company": "GitHub",
        "role": "Platform Engineer",
        "status": "Applied",
        "notes": "Application submitted via careers portal.",
    })
    app_id = create_res.json()["id"]

    # Update status to Interview
    patch_res = client.patch(f"/api/applications/{app_id}", json={
        "status": "Interview",
        "notes": "Recruiter screen passed, onsite scheduled.",
    })
    assert patch_res.status_code == 200
    updated_data = patch_res.json()
    assert updated_data["status"] == "Interview"
    assert "onsite scheduled" in updated_data["notes"]

    # Delete
    del_res = client.delete(f"/api/applications/{app_id}")
    assert del_res.status_code == 204

    # Verify not found
    get_again = client.get(f"/api/applications/{app_id}")
    assert get_again.status_code == 404


def test_applications_stats(client: TestClient):
    stats_res = client.get("/api/applications/stats")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert "total" in stats
    assert "interview" in stats
    assert "offer" in stats
    assert "recent_analyses_count" in stats
    assert isinstance(stats["total"], int)


def test_export_applications_csv(client: TestClient):
    client.post("/api/applications", json={
        "company": "Datadog",
        "role": "Backend Engineer",
        "status": "Saved",
        "salary_range": "$150k-$175k",
        "notes": "Need to tailor resume for distributed systems.",
    })

    csv_res = client.get("/api/applications/export/csv")
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers.get("content-type", "")
    assert "jobfit_applications.csv" in csv_res.headers.get("content-disposition", "")
    content = csv_res.text
    assert "Company,Role,Status" in content or "Company" in content
    assert "Datadog" in content


def test_auto_populate_match_score_from_analysis(client: TestClient, db_session):
    # Setup prerequisite Resume, Job, and Analysis
    resume = Resume(
        filename="test.pdf",
        file_path="uploads/test.pdf",
        file_type="pdf",
        file_size_bytes=1000,
        raw_text="Test resume content",
        parsed_data={"name": "Alex Candidate", "technical_skills": ["Python"]}
    )

    db_session.add(resume)
    db_session.commit()
    db_session.refresh(resume)

    job = JobDescription(
        company="Acme Corp",
        role_title="Senior Python Architect",
        raw_text="Python requirement",
        requirements=[{"id": "req-1", "text": "Python", "category": "must_have", "importance": "high", "keywords": ["Python"]}]
    )
    db_session.add(job)
    db_session.commit()
    db_session.refresh(job)

    analysis = Analysis(
        resume_id=resume.id,
        job_id=job.id,
        company="Acme Corp",
        role_title="Senior Python Architect",
        score=87.5,
        must_have_score=90.0,
        nice_to_have_score=80.0,
        match_status_breakdown={"EXACT_MATCH": 1},
        evidence_items=[],
        summary="Solid candidate fit.",
    )
    db_session.add(analysis)
    db_session.commit()
    db_session.refresh(analysis)

    # Now create application linked to this analysis
    app_res = client.post("/api/applications", json={
        "company": "Acme Corp",
        "role": "Senior Python Architect",
        "analysis_id": analysis.id,
        "status": "Preparing",
    })
    assert app_res.status_code == 201
    app_data = app_res.json()
    assert app_data["match_score"] == 87.5
