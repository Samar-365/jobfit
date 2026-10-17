"""Deterministic Scoring Engine for JobFit.
Implements a mathematical, transparent requirement-based scoring formula.
Zero arbitrary or hallucinated ATS scores.
"""
from typing import List, Dict, Tuple
from app.schemas.analysis import MatchStatus, RequirementEvidence

POINTS_MAP: Dict[MatchStatus, float] = {
    MatchStatus.EXACT_MATCH: 1.0,
    MatchStatus.PARTIAL_MATCH: 0.5,
    MatchStatus.NOT_MENTIONED: 0.0,
    MatchStatus.UNASSESSABLE: 0.0,
}

MUST_HAVE_WEIGHT = 0.70
NICE_TO_HAVE_WEIGHT = 0.30


def compute_deterministic_score(
    evidence_items: List[RequirementEvidence],
) -> Tuple[float, float, float, Dict[str, int]]:
    """
    Compute mathematically grounded match scores based on verifiable evidence.
    
    Returns:
        (overall_score, must_have_score, nice_to_have_score, match_status_breakdown)
    """
    if not evidence_items:
        return 0.0, 0.0, 0.0, {
            MatchStatus.EXACT_MATCH.value: 0,
            MatchStatus.PARTIAL_MATCH.value: 0,
            MatchStatus.NOT_MENTIONED.value: 0,
            MatchStatus.UNASSESSABLE.value: 0,
        }

    breakdown: Dict[str, int] = {
        MatchStatus.EXACT_MATCH.value: 0,
        MatchStatus.PARTIAL_MATCH.value: 0,
        MatchStatus.NOT_MENTIONED.value: 0,
        MatchStatus.UNASSESSABLE.value: 0,
    }

    must_have_points = 0.0
    must_have_count = 0

    nice_to_have_points = 0.0
    nice_to_have_count = 0

    for item in evidence_items:
        status_key = item.status.value if isinstance(item.status, MatchStatus) else str(item.status)
        breakdown[status_key] = breakdown.get(status_key, 0) + 1

        points = POINTS_MAP.get(item.status, 0.0)

        category = (item.category or "must_have").lower()
        if "nice" in category or "preferred" in category:
            nice_to_have_points += points
            nice_to_have_count += 1
        else:
            must_have_points += points
            must_have_count += 1

    must_have_score = (
        round((must_have_points / must_have_count) * 100, 1)
        if must_have_count > 0
        else 0.0
    )

    nice_to_have_score = (
        round((nice_to_have_points / nice_to_have_count) * 100, 1)
        if nice_to_have_count > 0
        else 0.0
    )

    if must_have_count > 0 and nice_to_have_count > 0:
        overall_score = round(
            must_have_score * MUST_HAVE_WEIGHT + nice_to_have_score * NICE_TO_HAVE_WEIGHT,
            1,
        )
    elif must_have_count > 0:
        overall_score = must_have_score
    elif nice_to_have_count > 0:
        overall_score = nice_to_have_score
    else:
        overall_score = 0.0

    return overall_score, must_have_score, nice_to_have_score, breakdown
