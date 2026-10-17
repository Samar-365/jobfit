"""AI Package for Ollama and Gemma local inference."""
from app.ai.ollama_client import ollama_client, OllamaClient
from app.ai.prompts import (
    RESUME_PARSER_SYSTEM_PROMPT,
    build_resume_parse_prompt,
    JOB_REQUIREMENT_SYSTEM_PROMPT,
    build_job_extraction_prompt,
    EVIDENCE_MATCHER_SYSTEM_PROMPT,
    build_evidence_match_prompt,
    TAILORING_SYSTEM_PROMPT,
    build_tailoring_prompt,
    COVER_LETTER_SYSTEM_PROMPT,
    build_cover_letter_prompt,
)
from app.ai.parser import parse_resume_text
from app.ai.matcher import extract_job_requirements, match_resume_to_requirements
from app.ai.tailoring import tailor_resume_bullet, validate_tailoring_guardrails
from app.ai.cover_letter import generate_grounded_cover_letter

__all__ = [
    "ollama_client",
    "OllamaClient",
    "RESUME_PARSER_SYSTEM_PROMPT",
    "build_resume_parse_prompt",
    "JOB_REQUIREMENT_SYSTEM_PROMPT",
    "build_job_extraction_prompt",
    "EVIDENCE_MATCHER_SYSTEM_PROMPT",
    "build_evidence_match_prompt",
    "TAILORING_SYSTEM_PROMPT",
    "build_tailoring_prompt",
    "COVER_LETTER_SYSTEM_PROMPT",
    "build_cover_letter_prompt",
    "parse_resume_text",
    "extract_job_requirements",
    "match_resume_to_requirements",
    "tailor_resume_bullet",
    "validate_tailoring_guardrails",
    "generate_grounded_cover_letter",
]
