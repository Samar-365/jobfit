"""Truthful Resume Tailoring Engine with Anti-Fabrication Guardrails."""
import re
import logging
from typing import List, Tuple, Optional

from app.ai.ollama_client import ollama_client
from app.ai.prompts import TAILORING_SYSTEM_PROMPT, build_tailoring_prompt
from app.schemas.tailoring import TailoredSuggestion

logger = logging.getLogger(__name__)

ACTION_VERB_UPGRADES = {
    "worked on": "Engineered",
    "helped with": "Collaborated to build",
    "responsible for": "Spearheaded",
    "did": "Executed",
    "made": "Architected",
    "fixed": "Resolved",
    "assisted": "Contributed to",
    "used": "Leveraged",
    "handled": "Administered",
}


def validate_tailoring_guardrails(original: str, suggested: str) -> Tuple[bool, Optional[str]]:
    """
    Validate that suggested bullet point does NOT fabricate metrics, numbers,
    percentages, or credentials absent in original text.
    Returns: (is_safe, warning_message)
    """
    orig_nums = set(re.findall(r"\b\d+(?:[\.,]\d+)?%?(?:[kKmMbB])?\b", original))
    sugg_nums = set(re.findall(r"\b\d+(?:[\.,]\d+)?%?(?:[kKmMbB])?\b", suggested))

    invented_nums = sugg_nums - orig_nums
    if invented_nums:
        return (
            False,
            f"Guardrail Alert: Suggested text introduced unevidenced metrics {list(invented_nums)} not present in original."
        )

    # Check for unearned credentials/degrees
    credentials = ["phd", "ph.d", "master's", "mba", "certified kubernetes", "pmp"]
    lower_orig = original.lower()
    lower_sugg = suggested.lower()
    for cred in credentials:
        if cred in lower_sugg and cred not in lower_orig:
            return (
                False,
                f"Guardrail Alert: Suggested text introduced credential '{cred}' not evidenced in original."
            )

    return True, None


def heuristic_tailor_bullet(bullet: str, job_context: str) -> List[TailoredSuggestion]:
    """
    Rule-based deterministic tailoring used when Ollama is offline.
    Upgrades weak verbs and integrates context keywords truthfully.
    """
    upgraded = bullet
    for weak, strong in ACTION_VERB_UPGRADES.items():
        if weak in upgraded.lower():
            pattern = re.compile(re.escape(weak), re.IGNORECASE)
            upgraded = pattern.sub(strong, upgraded, count=1)
            break

    # If first word is a common lower verb, capitalize
    words = upgraded.split()
    if words:
        words[0] = words[0].capitalize()
    v1 = " ".join(words)

    # Suggestion 2: concise phrasing
    v2 = f"{v1} (aligned with {job_context.split()[0] if job_context else 'target role'})" if len(v1) < 120 else v1

    return [
        TailoredSuggestion(
            original_text=bullet,
            suggested_text=v1,
            rationale="Upgraded opening verb to strong action verb while preserving exact factual core.",
            aligned_keywords=[w for w in job_context.split() if len(w) > 3][:3],
            guardrails_passed=True,
            warning=None,
        ),
        TailoredSuggestion(
            original_text=bullet,
            suggested_text=v2,
            rationale="Focused phrasing highlighting relevant domain terminology without adding claims.",
            aligned_keywords=[],
            guardrails_passed=True,
            warning=None,
        ),
    ]


async def tailor_resume_bullet(
    bullet_point: str,
    job_context: str,
    style: str = "action_impact",
) -> List[TailoredSuggestion]:
    """
    Generate truthful, tailored bullet point suggestions with Gemma and guardrail validation.
    """
    if not bullet_point.strip():
        return []

    try:
        is_ready = await ollama_client.is_available()
        if not is_ready:
            return heuristic_tailor_bullet(bullet_point, job_context)

        prompt = build_tailoring_prompt(bullet_point, job_context, style)
        result = await ollama_client.generate_json(
            prompt=prompt,
            system=TAILORING_SYSTEM_PROMPT,
        )

        raw_suggestions = result.get("suggestions", [])
        validated_suggestions: List[TailoredSuggestion] = []

        for item in raw_suggestions:
            suggested_text = item.get("suggested_text", "").strip()
            if not suggested_text:
                continue

            # Run guardrail check
            passed, warning = validate_tailoring_guardrails(bullet_point, suggested_text)

            validated_suggestions.append(
                TailoredSuggestion(
                    original_text=bullet_point,
                    suggested_text=suggested_text,
                    rationale=item.get("rationale", "Aligned action verbs and keywords."),
                    aligned_keywords=item.get("aligned_keywords", []),
                    guardrails_passed=passed,
                    warning=warning,
                )
            )

        return validated_suggestions or heuristic_tailor_bullet(bullet_point, job_context)

    except Exception as exc:
        logger.warning("Error during bullet tailoring: %s", exc)
        return heuristic_tailor_bullet(bullet_point, job_context)
