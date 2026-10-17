"""Unit tests for job requirement extraction and evidence correlation."""
import asyncio
from unittest.mock import AsyncMock, patch
from app.schemas.job import JobRequirementItem
from app.schemas.resume import ParsedResume
from app.schemas.analysis import MatchStatus
from app.ai.matcher import (
    extract_job_requirements,
    match_resume_to_requirements,
    heuristic_job_requirements_extract,
    heuristic_match_evaluation,
)


def test_heuristic_job_requirements_extract():
    """Verify bullet point requirement extraction from text."""
    job_text = """
    Software Engineer - Backend
    Requirements:
    - 3+ years experience with Python and FastAPI
    - Experience with relational databases like PostgreSQL
    - Solid understanding of Docker containerization
    Nice to have:
    - Familiarity with Kubernetes cluster deployment
    """
    reqs = heuristic_job_requirements_extract(job_text)
    assert len(reqs) >= 3
    must_haves = [r for r in reqs if r.category == "must_have"]
    assert len(must_haves) >= 2


def test_heuristic_match_evidence_grounding():
    """Verify that heuristic matching properly correlates resume text and quotes evidence."""
    resume_text = (
        "Alex Rivera\n"
        "Fullstack Software Engineer with 5+ years building FastAPI microservices.\n"
        "Architected high-throughput services with PostgreSQL."
    )
    parsed_resume = ParsedResume(
        name="Alex Rivera",
        technical_skills=["Python", "FastAPI", "PostgreSQL"],
    )
    requirements = [
        JobRequirementItem(
            id="req-1",
            text="Experience building scalable microservices in FastAPI",
            category="must_have",
        ),
        JobRequirementItem(
            id="req-2",
            text="Kubernetes cluster orchestration and helm charts",
            category="nice_to_have",
        ),
    ]

    evidence_items, summary = heuristic_match_evaluation(
        resume_text=resume_text,
        parsed_resume=parsed_resume,
        requirements=requirements,
    )

    assert len(evidence_items) == 2
    # First requirement has FastAPI and microservices in resume text -> EXACT_MATCH
    assert evidence_items[0].status == MatchStatus.EXACT_MATCH
    assert evidence_items[0].resume_quote is not None
    assert "FastAPI" in evidence_items[0].resume_quote

    # Second requirement (Kubernetes) is not in resume -> NOT_MENTIONED
    assert evidence_items[1].status == MatchStatus.NOT_MENTIONED
    assert evidence_items[1].resume_quote is None


def test_match_resume_with_mocked_ollama():
    """Verify Gemma evidence matching when Ollama returns structured JSON."""
    mock_response = {
        "summary": "Candidate matches backend criteria well.",
        "evidence_items": [
            {
                "requirement_id": "req-1",
                "requirement_text": "Python experience",
                "category": "must_have",
                "status": "EXACT_MATCH",
                "resume_quote": "5+ years building FastAPI microservices",
                "reasoning": "Direct verifiable citation.",
                "recommendation": None,
            }
        ]
    }

    with patch("app.ai.ollama_client.ollama_client.is_available", new_callable=AsyncMock) as mock_avail, \
         patch("app.ai.ollama_client.ollama_client.generate_json", new_callable=AsyncMock) as mock_gen:
        mock_avail.return_value = True
        mock_gen.return_value = mock_response

        requirements = [
            JobRequirementItem(id="req-1", text="Python experience", category="must_have")
        ]
        parsed_resume = ParsedResume(name="Alex Rivera", technical_skills=["Python"])

        evidence_items, summary = asyncio.run(
            match_resume_to_requirements(
                resume_text="5+ years building FastAPI microservices",
                parsed_resume=parsed_resume,
                requirements=requirements,
            )
        )

        assert len(evidence_items) == 1
        assert evidence_items[0].status == MatchStatus.EXACT_MATCH
        assert evidence_items[0].resume_quote == "5+ years building FastAPI microservices"
