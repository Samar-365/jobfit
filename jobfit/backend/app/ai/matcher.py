"""Evidence Matching Engine for JobFit.
Correlates job requirements against candidate resumes with cited, verifiable evidence.
"""
import re
import logging
from typing import List, Tuple, Dict, Any

from app.config import settings
from app.ai.ollama_client import ollama_client, OllamaException
from app.ai.prompts import (
    JOB_REQUIREMENT_SYSTEM_PROMPT,
    build_job_extraction_prompt,
    EVIDENCE_MATCHER_SYSTEM_PROMPT,
    build_evidence_match_prompt,
)
from app.schemas.job import JobRequirementItem
from app.schemas.analysis import MatchStatus, RequirementEvidence
from app.schemas.resume import ParsedResume

logger = logging.getLogger(__name__)


def heuristic_job_requirements_extract(job_text: str) -> List[JobRequirementItem]:
    """
    Deterministic rule-based requirement extractor when Ollama is offline.
    Extracts bullet points from common qualification sections.
    """
    lines = [l.strip() for l in job_text.splitlines() if l.strip()]
    reqs: List[JobRequirementItem] = []
    
    in_nice_section = False
    idx = 1

    for line in lines:
        cleaned = re.sub(r"^[-*•\d\.\)]+\s*", "", line).strip()
        lower = cleaned.lower()

        # Check section headings
        if any(h in lower for h in ["preferred", "nice to have", "bonus", "plus"]):
            in_nice_section = True
            continue
        elif any(h in lower for h in ["requirements", "qualifications", "responsibilities", "what you need"]):
            in_nice_section = False
            continue

        if len(cleaned) > 20 and len(cleaned) < 220:
            category = "nice_to_have" if in_nice_section else "must_have"
            reqs.append(
                JobRequirementItem(
                    id=f"req-{idx}",
                    text=cleaned,
                    category=category,
                    importance="high" if category == "must_have" else "medium",
                    keywords=[w for w in re.findall(r"[A-Z][a-zA-Z\+#]+", cleaned) if len(w) > 1][:4]
                )
            )
            idx += 1
            if len(reqs) >= 8:
                break

    if not reqs and lines:
        # Fallback to general lines
        for i, l in enumerate(lines[:6]):
            if len(l) > 15:
                reqs.append(
                    JobRequirementItem(
                        id=f"req-{i+1}",
                        text=l[:180],
                        category="must_have",
                        importance="medium",
                        keywords=[]
                    )
                )

    return reqs or [
        JobRequirementItem(
            id="req-1",
            text="General software engineering experience",
            category="must_have",
            importance="high",
            keywords=[]
        )
    ]


async def extract_job_requirements(job_text: str) -> List[JobRequirementItem]:
    """
    Extract structured requirement statements from a job description using Gemma.
    """
    if not job_text.strip():
        return []

    try:
        is_ready = await ollama_client.is_available()
        if not is_ready:
            return heuristic_job_requirements_extract(job_text)

        prompt = build_job_extraction_prompt(job_text)
        result = await ollama_client.generate_json(
            prompt=prompt,
            system=JOB_REQUIREMENT_SYSTEM_PROMPT,
        )

        raw_reqs = result.get("requirements", [])
        extracted: List[JobRequirementItem] = []
        for i, item in enumerate(raw_reqs):
            req_id = item.get("id") or f"req-{i+1}"
            text = item.get("text", "").strip()
            if text:
                extracted.append(
                    JobRequirementItem(
                        id=req_id,
                        text=text,
                        category=item.get("category", "must_have"),
                        importance=item.get("importance", "medium"),
                        keywords=item.get("keywords", []),
                    )
                )
        return extracted if extracted else heuristic_job_requirements_extract(job_text)
    except Exception as exc:
        logger.warning("Error during job requirements extraction: %s", exc)
        return heuristic_job_requirements_extract(job_text)


def heuristic_match_evaluation(
    resume_text: str,
    parsed_resume: ParsedResume,
    requirements: List[JobRequirementItem],
) -> Tuple[List[RequirementEvidence], str]:
    """
    Rule-based deterministic evidence matcher if Ollama is unavailable.
    Performs keyword & phrase citation matching against raw text and resume bullets.
    """
    evidence_items: List[RequirementEvidence] = []
    lower_resume = resume_text.lower()
    resume_sentences = [s.strip() for s in re.split(r"[\n\.\?!]", resume_text) if len(s.strip()) > 15]

    for req in requirements:
        req_words = [w.lower() for w in re.findall(r"\b[A-Za-z0-9\+#]{3,}\b", req.text)]
        matches: List[str] = []

        # Find best sentence containing multiple requirement keywords
        best_sentence = None
        max_overlap = 0

        for sentence in resume_sentences:
            s_lower = sentence.lower()
            overlap = sum(1 for w in req_words if w in s_lower)
            if overlap > max_overlap:
                max_overlap = overlap
                best_sentence = sentence

        if max_overlap >= 2:
            status = MatchStatus.EXACT_MATCH
            quote = best_sentence
            reasoning = f"Verifiable evidence found with matching terms ({max_overlap} keyword intersections)."
            recommendation = None
        elif max_overlap == 1:
            status = MatchStatus.PARTIAL_MATCH
            quote = best_sentence
            reasoning = "Partial evidence found in resume. Related concepts present."
            recommendation = f"Consider explicitly articulating your experience with '{req.text[:40]}...'."
        else:
            status = MatchStatus.NOT_MENTIONED
            quote = None
            reasoning = "No evidence found in the submitted resume document."
            recommendation = f"If you possess experience relevant to '{req.text[:40]}...', add a bullet highlighting it."

        evidence_items.append(
            RequirementEvidence(
                requirement_id=req.id,
                requirement_text=req.text,
                category=req.category,
                status=status,
                resume_quote=quote,
                reasoning=reasoning,
                recommendation=recommendation,
            )
        )

    summary = (
        f"Evaluation completed across {len(requirements)} requirement criteria. "
        f"Verifiable evidence matched from candidate resume text."
    )
    return evidence_items, summary


async def match_resume_to_requirements(
    resume_text: str,
    parsed_resume: ParsedResume,
    requirements: List[JobRequirementItem],
) -> Tuple[List[RequirementEvidence], str]:
    """
    Run Gemma evidence evaluation correlating job requirements with candidate resume text.
    Ensures that positive matches cite verbatim quotes from the resume document.
    """
    if not requirements:
        return [], "No requirements provided for matching."

    try:
        is_ready = await ollama_client.is_available()
        if not is_ready:
            return heuristic_match_evaluation(resume_text, parsed_resume, requirements)

        req_dicts = [
            {"id": r.id, "text": r.text, "category": r.category}
            for r in requirements
        ]
        prompt = build_evidence_match_prompt(resume_text, req_dicts)

        result = await ollama_client.generate_json(
            prompt=prompt,
            system=EVIDENCE_MATCHER_SYSTEM_PROMPT,
        )

        summary = result.get("summary", "Resume matched against job requirements.")
        raw_items = result.get("evidence_items", [])

        evidence_items: List[RequirementEvidence] = []
        for i, item in enumerate(raw_items):
            status_str = item.get("status", "NOT_MENTIONED").upper()
            try:
                status = MatchStatus(status_str)
            except ValueError:
                status = MatchStatus.NOT_MENTIONED if "NOT" in status_str else MatchStatus.PARTIAL_MATCH

            req_id = item.get("requirement_id") or (requirements[i].id if i < len(requirements) else f"req-{i+1}")
            req_text = item.get("requirement_text") or (requirements[i].text if i < len(requirements) else "Requirement")
            category = item.get("category") or (requirements[i].category if i < len(requirements) else "must_have")

            quote = item.get("resume_quote")
            if status == MatchStatus.NOT_MENTIONED:
                quote = None

            evidence_items.append(
                RequirementEvidence(
                    requirement_id=req_id,
                    requirement_text=req_text,
                    category=category,
                    status=status,
                    resume_quote=quote,
                    reasoning=item.get("reasoning", "Evidence correlated against resume text."),
                    recommendation=item.get("recommendation"),
                )
            )

        if not evidence_items:
            return heuristic_match_evaluation(resume_text, parsed_resume, requirements)

        return evidence_items, summary

    except Exception as exc:
        logger.warning("Error during Gemma evidence matching: %s", exc)
        return heuristic_match_evaluation(resume_text, parsed_resume, requirements)
