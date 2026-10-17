"""AI Package for Ollama and Gemma local inference."""
from app.ai.ollama_client import ollama_client, OllamaClient
from app.ai.prompts import RESUME_PARSER_SYSTEM_PROMPT, build_resume_parse_prompt
from app.ai.parser import parse_resume_text

__all__ = [
    "ollama_client",
    "OllamaClient",
    "RESUME_PARSER_SYSTEM_PROMPT",
    "build_resume_parse_prompt",
    "parse_resume_text",
]
