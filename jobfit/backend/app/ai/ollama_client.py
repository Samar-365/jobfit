"""Ollama Async HTTP Client with resilient timeouts and JSON schema enforcement."""
import json
import logging
from typing import Any, Dict, Optional
import httpx
from app.config import settings

logger = logging.getLogger(__name__)


class OllamaException(Exception):
    """Base exception for Ollama client errors."""
    pass


class OllamaConnectionError(OllamaException):
    """Raised when Ollama server cannot be reached."""
    pass


class OllamaTimeoutError(OllamaException):
    """Raised when Ollama inference exceeds timeout threshold."""
    pass


class OllamaClient:
    """Asynchronous HTTP client for local Ollama inference."""

    def __init__(
        self,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
        timeout_seconds: Optional[float] = None,
    ):
        self.base_url = (base_url or settings.OLLAMA_BASE_URL).rstrip("/")
        self.model = model or settings.OLLAMA_MODEL
        self.timeout = timeout_seconds or settings.OLLAMA_TIMEOUT_SECONDS

    async def is_available(self) -> bool:
        """Check if Ollama service is up and reachable."""
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                resp = await client.get(f"{self.base_url}/api/tags")
                return resp.status_code == 200
        except Exception:
            return False

    async def generate(
        self,
        prompt: str,
        system: Optional[str] = None,
        format_type: Optional[str] = None,
        options: Optional[Dict[str, Any]] = None,
    ) -> str:
        """
        Send a generation prompt to Ollama.
        Supports format="json" for structured grammar output.
        """
        payload: Dict[str, Any] = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": options or {
                "temperature": 0.1,  # Low temperature for strict factual extraction
                "top_p": 0.9,
            },
        }

        if system:
            payload["system"] = system

        if format_type:
            payload["format"] = format_type

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json=payload,
                )

                if response.status_code != 200:
                    raise OllamaException(
                        f"Ollama returned HTTP {response.status_code}: {response.text}"
                    )

                data = response.json()
                return data.get("response", "").strip()

        except httpx.TimeoutException as exc:
            logger.error("Ollama generation timed out after %s seconds", self.timeout)
            raise OllamaTimeoutError(
                f"Ollama inference timed out after {self.timeout}s on model '{self.model}'."
            ) from exc
        except httpx.ConnectError as exc:
            logger.error("Could not connect to Ollama server at %s", self.base_url)
            raise OllamaConnectionError(
                f"Could not connect to Ollama server at {self.base_url}. Please ensure Ollama is running."
            ) from exc
        except Exception as exc:
            if isinstance(exc, OllamaException):
                raise
            logger.error("Unexpected error during Ollama generation: %s", exc)
            raise OllamaException(f"Ollama generation failed: {str(exc)}") from exc

    async def generate_json(
        self,
        prompt: str,
        system: Optional[str] = None,
        options: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Generate response with forced JSON format and parse into dictionary.
        """
        raw_text = await self.generate(
            prompt=prompt,
            system=system,
            format_type="json",
            options=options,
        )

        # Attempt clean JSON parse
        try:
            return json.loads(raw_text)
        except json.JSONDecodeError:
            # Clean markdown fences if model returned ```json ... ```
            clean_text = raw_text.strip()
            if clean_text.startswith("```json"):
                clean_text = clean_text[7:]
            elif clean_text.startswith("```"):
                clean_text = clean_text[3:]
            if clean_text.endswith("```"):
                clean_text = clean_text[:-3]
            clean_text = clean_text.strip()
            return json.loads(clean_text)


# Singleton instance
ollama_client = OllamaClient()
