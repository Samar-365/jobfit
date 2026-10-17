"""Context-Grounded Cover Letter Generator with Placeholder Protections."""
import logging
from typing import Tuple, List

from app.ai.ollama_client import ollama_client
from app.ai.prompts import COVER_LETTER_SYSTEM_PROMPT, build_cover_letter_prompt
from app.schemas.resume import ParsedResume

logger = logging.getLogger(__name__)


def heuristic_cover_letter(
    parsed_resume: ParsedResume,
    company: str,
    role_title: str,
    motivation_notes: str = "",
) -> Tuple[str, List[str], List[str]]:
    """
    Template-based grounded cover letter generator used when Ollama is offline.
    Uses verifiable candidate resume details and inserts explicit bracketed placeholders.
    """
    name = parsed_resume.name or "Candidate"
    skills = parsed_resume.technical_skills[:4]
    skills_str = ", ".join(skills) if skills else "software engineering"

    recent_exp = parsed_resume.experience[0] if parsed_resume.experience else None
    exp_text = (
        f"In my recent role as {recent_exp.role} at {recent_exp.company}, I focused on "
        f"{recent_exp.bullets[0] if recent_exp.bullets else 'scalable software delivery'}."
        if recent_exp
        else "Throughout my software engineering career, I have focused on delivering robust systems."
    )

    placeholders = [
        f"[Explain what specifically attracts you to {company}'s team and mission]",
        f"[Add any additional detail about a favorite project or achievement]",
    ]

    motivation_paragraph = (
        motivation_notes
        if motivation_notes.strip()
        else placeholders[0]
    )

    markdown = f"""# Cover Letter: {role_title} at {company}

**Candidate:** {name}  
**Target Position:** {role_title}  
**Target Organization:** {company}  

---

Dear Hiring Team at {company},

I am writing to express my strong interest in the **{role_title}** position at **{company}**. With a strong technical background in **{skills_str}**, I am eager to contribute to your engineering objectives.

{motivation_paragraph}

{exp_text} My practical experience aligns well with the demands of modern, distributed architectures. I am particularly motivated by building maintainable code, adhering to rigorous testing standards, and collaborating across engineering functions.

{placeholders[1]}

Thank you for your time and consideration. I would welcome the opportunity to discuss how my verified background and hands-on experience can support {company}'s roadmap.

Sincerely,  
**{name}**
"""
    return markdown.strip(), placeholders, skills


async def generate_grounded_cover_letter(
    resume_text: str,
    parsed_resume: ParsedResume,
    company: str,
    role_title: str,
    job_description: str = "",
    motivation_notes: str = "",
) -> Tuple[str, List[str], List[str]]:
    """
    Generate a factual, grounded cover letter draft via Gemma with explicit placeholders.
    """
    try:
        is_ready = await ollama_client.is_available()
        if not is_ready:
            return heuristic_cover_letter(parsed_resume, company, role_title, motivation_notes)

        prompt = build_cover_letter_prompt(
            resume_text=resume_text,
            company=company,
            role_title=role_title,
            job_description=job_description,
            motivation_notes=motivation_notes,
        )

        result = await ollama_client.generate_json(
            prompt=prompt,
            system=COVER_LETTER_SYSTEM_PROMPT,
        )

        content = result.get("content_markdown", "").strip()
        placeholders = result.get("placeholders_used", [])
        cited_skills = result.get("cited_skills", [])

        if not content:
            return heuristic_cover_letter(parsed_resume, company, role_title, motivation_notes)

        return content, placeholders, cited_skills

    except Exception as exc:
        logger.warning("Error generating cover letter via Gemma: %s", exc)
        return heuristic_cover_letter(parsed_resume, company, role_title, motivation_notes)
