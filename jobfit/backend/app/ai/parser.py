"""Structured Resume Parser coordinating Gemma inference and Pydantic validation."""
import re
import json
import logging
from typing import Optional, Dict, Any

from pydantic import ValidationError
from app.ai.ollama_client import ollama_client, OllamaException
from app.ai.prompts import RESUME_PARSER_SYSTEM_PROMPT, build_resume_parse_prompt
from app.schemas.resume import ParsedResume

logger = logging.getLogger(__name__)


def heuristic_fallback_parse(text: str) -> ParsedResume:
    """
    Rule-based fallback parser used if Ollama is unavailable or inference fails.
    Extracts email, phone, and standard sections deterministically without LLM.
    """
    email_match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", text)
    phone_match = re.search(r"(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}", text)
    
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    candidate_name = lines[0] if lines else "Candidate"
    
    # Common skill casing map
    SKILL_CASINGS = {
        "python": "Python",
        "javascript": "JavaScript",
        "typescript": "TypeScript",
        "react": "React",
        "fastapi": "FastAPI",
        "docker": "Docker",
        "sql": "SQL",
        "postgresql": "PostgreSQL",
        "mysql": "MySQL",
        "mongodb": "MongoDB",
        "aws": "AWS",
        "git": "Git",
        "linux": "Linux",
        "c++": "C++",
        "java": "Java",
    }
    skills: list[str] = []
    lower_text = text.lower()
    for raw_skill, pretty_skill in SKILL_CASINGS.items():
        if re.search(rf"\b{re.escape(raw_skill)}\b", lower_text):
            skills.append(pretty_skill)

    return ParsedResume(
        name=candidate_name[:50] if len(candidate_name) < 50 else "Candidate",
        email=email_match.group(0) if email_match else None,
        phone=phone_match.group(0) if phone_match else None,
        summary=lines[1][:250] if len(lines) > 1 else None,
        technical_skills=skills,
        soft_skills=[],
        experience=[],
        projects=[],
        education=[],
        certifications=[]
    )


async def parse_resume_text(
    resume_text: str,
    max_retries: int = 1,
) -> ParsedResume:
    """
    Parse raw resume text into a structured, validated ParsedResume schema using Gemma.
    Implements retry loop and fallback heuristics if Ollama is unreachable.
    """
    if not resume_text.strip():
        return ParsedResume()

    prompt = build_resume_parse_prompt(resume_text)

    for attempt in range(max_retries + 1):
        try:
            # Check availability first
            is_ready = await ollama_client.is_available()
            if not is_ready:
                logger.warning("Ollama is not currently available. Employing deterministic fallback.")
                return heuristic_fallback_parse(resume_text)

            result_dict = await ollama_client.generate_json(
                prompt=prompt,
                system=RESUME_PARSER_SYSTEM_PROMPT,
            )

            # Validate against Pydantic schema
            validated = ParsedResume.model_validate(result_dict)
            return validated

        except (ValidationError, json.JSONDecodeError, OllamaException) as exc:
            logger.warning(
                "Resume parse attempt %s failed: %s", attempt + 1, str(exc)
            )
            if attempt < max_retries:
                # Add explicit repair instruction for retry
                prompt = (
                    f"Your previous JSON output was invalid. "
                    f"Please output strictly valid JSON with no markdown wrapping.\n\n"
                    + build_resume_parse_prompt(resume_text)
                )
                continue
            else:
                logger.error("All parse attempts failed. Falling back to heuristic extraction.")
                return heuristic_fallback_parse(resume_text)
        except Exception as exc:
            logger.error("Unexpected error during parsing: %s", exc)
            return heuristic_fallback_parse(resume_text)

    return heuristic_fallback_parse(resume_text)
