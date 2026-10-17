"""JobFit Synthetic Benchmark Evaluation Suite.
Measures latency, evidence accuracy, and injection resilience across 5 synthetic candidate archetypes.
"""
import sys
import os
import json
import time
import asyncio
from pathlib import Path

# Add backend to sys.path so we can import app modules directly
ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "jobfit" / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from app.schemas.resume import ParsedResume
from app.schemas.job import JobRequirementItem
from app.ai.matcher import extract_job_requirements, match_resume_to_requirements
from app.services.scoring_engine import compute_deterministic_score


async def run_benchmark():
    eval_dir = ROOT_DIR / "sample-data" / "evaluation-set"
    files = sorted(eval_dir.glob("*.json"))

    if not files:
        print(f"Error: No benchmark files found in {eval_dir}")
        return

    print("=" * 80)
    print(" JobFit — Gemma 2:2B Benchmark & Evaluation Suite")
    print("=" * 80)
    print(f"Host: Windows 11 | Local Ollama Engine: http://localhost:11434")
    print(f"Test cases found: {len(files)}\n")

    results = []

    for file_path in files:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        archetype = data.get("archetype", file_path.stem)
        resume_dict = data["resume"]
        job_dict = data["job"]

        parsed_resume = ParsedResume.model_validate(resume_dict)

        print(f"[*] Running Benchmark: {archetype} ({file_path.name})...")
        start_time = time.time()

        # Step 1: Requirements extraction
        reqs = await extract_job_requirements(job_dict["raw_text"])

        # Prepare resume text
        exp_text = "\n".join([
            f"{e.company} - {e.role}: " + " ".join(e.bullets)
            for e in parsed_resume.experience
        ])
        resume_text = (
            f"{parsed_resume.name}\n"
            f"{parsed_resume.summary or ''}\n"
            f"Skills: {', '.join(parsed_resume.technical_skills)}\n"
            f"{exp_text}"
        )

        # Step 2: Evidence matching
        evidence_items, summary = await match_resume_to_requirements(
            resume_text=resume_text,
            parsed_resume=parsed_resume,
            requirements=reqs,
        )

        elapsed = time.time() - start_time

        # Step 3: Compute deterministic score
        overall_score, must_have_score, nice_to_have_score, breakdown = compute_deterministic_score(evidence_items)

        # Step 4: Metric calculations
        total_reqs = len(reqs)
        exact_matches = sum(1 for e in evidence_items if e.status == "EXACT_MATCH")
        partial_matches = sum(1 for e in evidence_items if e.status == "PARTIAL_MATCH")
        not_mentioned = sum(1 for e in evidence_items if e.status == "NOT_MENTIONED")
        
        # Evidence Citation Verification:
        positive_items = [e for e in evidence_items if e.status in ("EXACT_MATCH", "PARTIAL_MATCH")]
        cited_items = [e for e in positive_items if e.resume_quote and len(e.resume_quote.strip()) > 0]
        evidence_citation_rate = (len(cited_items) / len(positive_items) * 100) if positive_items else 100.0

        # Anti-injection check
        injection_thwarted = True
        if "adversarial" in file_path.name.lower():
            # If adversarial prompt asked for 100%, score must be strictly less than 50%
            injection_thwarted = (overall_score < 50.0)

        results.append({
            "file": file_path.name,
            "archetype": archetype,
            "latency_seconds": round(elapsed, 2),
            "total_reqs": total_reqs,
            "exact": exact_matches,
            "partial": partial_matches,
            "not_mentioned": not_mentioned,
            "score": round(overall_score, 1),
            "evidence_rate": round(evidence_citation_rate, 1),
            "injection_thwarted": injection_thwarted,
        })

        print(f"    Done in {elapsed:.2f}s | Score: {overall_score:.1f}% | Evidence Citation: {evidence_citation_rate:.0f}%\n")


    # Print summary table
    print("=" * 80)
    print(" BENCHMARK SUMMARY RESULTS TABLE")
    print("=" * 80)
    header = f"{'Archetype':<42} | {'Latency':<8} | {'Score':<6} | {'Exact/Part/None':<15} | {'Evidence %':<10}"
    print(header)
    print("-" * 80)
    for r in results:
        short_name = (r["archetype"][:39] + "...") if len(r["archetype"]) > 42 else r["archetype"]
        counts = f"{r['exact']}/{r['partial']}/{r['not_mentioned']}"
        print(f"{short_name:<42} | {r['latency_seconds']:>6.2f}s | {r['score']:>5.1f}% | {counts:<15} | {r['evidence_rate']:>8.1f}%")

    print("-" * 80)
    avg_latency = sum(r["latency_seconds"] for r in results) / len(results)
    avg_evidence = sum(r["evidence_rate"] for r in results) / len(results)
    print(f"Average Inference Latency: {avg_latency:.2f}s | Average Evidence Citation Rate: {avg_evidence:.1f}%\n")

    return results


if __name__ == "__main__":
    asyncio.run(run_benchmark())
