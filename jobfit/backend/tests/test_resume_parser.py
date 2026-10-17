"""Unit tests for Gemma resume prompt design, parsing logic, and fallback routines."""
import pytest
from unittest.mock import AsyncMock, patch

from app.schemas.resume import ParsedResume
from app.ai.prompts import build_resume_parse_prompt, RESUME_PARSER_SYSTEM_PROMPT
from app.ai.parser import parse_resume_text, heuristic_fallback_parse


def test_build_resume_parse_prompt_boundaries():
    """Verify resume text is encapsulated within security boundary tags."""
    sample_text = "John Doe\njohn@example.com\nPython Developer"
    prompt = build_resume_parse_prompt(sample_text)

    assert "<resume_document>" in prompt
    assert "</resume_document>" in prompt
    assert sample_text in prompt
    assert "technical_skills" in prompt


def test_heuristic_fallback_parse():
    """Verify deterministic fallback parses contact info and known keywords without LLM."""
    raw_text = (
        "Sarah Connor\n"
        "sarah.connor@cyberdyne.io | (555) 123-4567 | Los Angeles, CA\n"
        "Experienced Engineer with deep knowledge of Python, Docker, React, and FastAPI."
    )
    result = heuristic_fallback_parse(raw_text)

    assert result.name == "Sarah Connor"
    assert result.email == "sarah.connor@cyberdyne.io"
    assert "(555) 123-4567" in (result.phone or "")
    assert "Python" in result.technical_skills
    assert "Docker" in result.technical_skills
    assert "FastAPI" in result.technical_skills


import asyncio


def test_parse_resume_text_with_mocked_ollama():
    """Verify successful parsing when Ollama returns valid structured JSON."""
    mock_json = {
        "name": "Jordan Smith",
        "title": "Backend Engineer",
        "email": "jordan@example.com",
        "phone": "+1 415-555-0199",
        "location": "New York, NY",
        "summary": "Specialized in Python web development.",
        "technical_skills": ["Python", "FastAPI", "PostgreSQL"],
        "soft_skills": ["Mentorship", "Problem Solving"],
        "experience": [
            {
                "company": "Acme Corp",
                "role": "Software Developer",
                "period": "2021 - Present",
                "location": "New York, NY",
                "bullets": ["Engineered REST APIs with FastAPI."]
            }
        ],
        "projects": [],
        "education": [],
        "certifications": []
    }

    with patch("app.ai.ollama_client.ollama_client.is_available", new_callable=AsyncMock) as mock_avail, \
         patch("app.ai.ollama_client.ollama_client.generate_json", new_callable=AsyncMock) as mock_gen:
        mock_avail.return_value = True
        mock_gen.return_value = mock_json

        resume_text = "Jordan Smith\njordan@example.com\nBackend Developer"
        result = asyncio.run(parse_resume_text(resume_text))

        assert isinstance(result, ParsedResume)
        assert result.name == "Jordan Smith"
        assert result.title == "Backend Engineer"
        assert len(result.technical_skills) == 3
        assert len(result.experience) == 1
        assert result.experience[0].company == "Acme Corp"


def test_parse_resume_text_offline_fallback():
    """Verify that when Ollama is unavailable, the fallback parser executes cleanly."""
    with patch("app.ai.ollama_client.ollama_client.is_available", new_callable=AsyncMock) as mock_avail:
        mock_avail.return_value = False

        resume_text = "Jane Doe\njane@test.com\nExpert in Python, React, and Git."
        result = asyncio.run(parse_resume_text(resume_text))

        assert isinstance(result, ParsedResume)
        assert result.name == "Jane Doe"
        assert result.email == "jane@test.com"
        assert "Python" in result.technical_skills
        assert "React" in result.technical_skills
