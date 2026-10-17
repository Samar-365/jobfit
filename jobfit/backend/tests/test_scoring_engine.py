"""Unit tests for deterministic scoring engine."""
from app.schemas.analysis import MatchStatus, RequirementEvidence
from app.services.scoring_engine import compute_deterministic_score


def test_empty_evidence_scores_zero():
    """Verify empty evidence list yields zero score."""
    overall, must_have, nice_to_have, breakdown = compute_deterministic_score([])
    assert overall == 0.0
    assert must_have == 0.0
    assert nice_to_have == 0.0
    assert breakdown[MatchStatus.EXACT_MATCH.value] == 0


def test_perfect_match_scores_100():
    """Verify all exact matches return 100.0 across all components."""
    evidence = [
        RequirementEvidence(
            requirement_id="req-1",
            requirement_text="Python experience",
            category="must_have",
            status=MatchStatus.EXACT_MATCH,
            resume_quote="5 years in Python",
            reasoning="Exact match",
        ),
        RequirementEvidence(
            requirement_id="req-2",
            requirement_text="Docker skills",
            category="nice_to_have",
            status=MatchStatus.EXACT_MATCH,
            resume_quote="Docker containerization",
            reasoning="Exact match",
        ),
    ]

    overall, must_have, nice_to_have, breakdown = compute_deterministic_score(evidence)
    assert overall == 100.0
    assert must_have == 100.0
    assert nice_to_have == 100.0
    assert breakdown[MatchStatus.EXACT_MATCH.value] == 2
    assert breakdown[MatchStatus.NOT_MENTIONED.value] == 0


def test_mixed_weights_calculation():
    """
    Test deterministic weighted formula:
    Must-have: 1 exact (1.0), 1 partial (0.5) -> avg 0.75 -> 75.0%
    Nice-to-have: 1 not mentioned (0.0) -> 0.0%
    Overall = 75.0 * 0.70 + 0.0 * 0.30 = 52.5%
    """
    evidence = [
        RequirementEvidence(
            requirement_id="req-1",
            requirement_text="FastAPI backend",
            category="must_have",
            status=MatchStatus.EXACT_MATCH,
            resume_quote="FastAPI microservices",
            reasoning="Exact match",
        ),
        RequirementEvidence(
            requirement_id="req-2",
            requirement_text="PostgreSQL DBA",
            category="must_have",
            status=MatchStatus.PARTIAL_MATCH,
            resume_quote="Designed Postgres schemas",
            reasoning="Partial match",
        ),
        RequirementEvidence(
            requirement_id="req-3",
            requirement_text="Kubernetes cluster admin",
            category="nice_to_have",
            status=MatchStatus.NOT_MENTIONED,
            resume_quote=None,
            reasoning="Not mentioned",
        ),
    ]

    overall, must_have, nice_to_have, breakdown = compute_deterministic_score(evidence)
    assert must_have == 75.0
    assert nice_to_have == 0.0
    assert overall == 52.5
    assert breakdown[MatchStatus.EXACT_MATCH.value] == 1
    assert breakdown[MatchStatus.PARTIAL_MATCH.value] == 1
    assert breakdown[MatchStatus.NOT_MENTIONED.value] == 1
