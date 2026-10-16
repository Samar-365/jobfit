"""Health check endpoints for system and local AI runtime."""
import time
from fastapi import APIRouter
import httpx

from app.config import settings
from app.schemas.common import HealthResponse, AIHealthResponse

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("", response_model=HealthResponse)
async def check_system_health() -> HealthResponse:
    """Check standard application health."""
    return HealthResponse(
        status="healthy",
        app_name=settings.APP_NAME,
        version=settings.APP_VERSION,
    )


@router.get("/ai", response_model=AIHealthResponse)
async def check_ai_health() -> AIHealthResponse:
    """
    Check local Ollama runtime and Gemma model availability.
    Inspects model registry and currently running processes.
    """
    t0 = time.perf_counter()
    target_model = settings.OLLAMA_MODEL

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            # 1. Fetch available models
            tags_resp = await client.get(f"{settings.OLLAMA_BASE_URL}/api/tags")
            if tags_resp.status_code != 200:
                return AIHealthResponse(
                    status="unavailable",
                    ollama_url=settings.OLLAMA_BASE_URL,
                    target_model=target_model,
                    is_target_model_installed=False,
                    error_message=f"Ollama returned HTTP {tags_resp.status_code}"
                )

            tags_data = tags_resp.json()
            models_list = [m.get("name", "") for m in tags_data.get("models", [])]
            
            # Check if target model or any model starting with target_model is present
            is_installed = any(
                m == target_model or m.startswith(f"{target_model}:") or target_model.startswith(m)
                for m in models_list
            )

            # 2. Check running models via /api/ps
            is_in_gpu = False
            try:
                ps_resp = await client.get(f"{settings.OLLAMA_BASE_URL}/api/ps")
                if ps_resp.status_code == 200:
                    ps_data = ps_resp.json()
                    for running in ps_data.get("models", []):
                        if target_model in running.get("name", ""):
                            # e.g., '100% GPU' or 'GPU' in processor
                            proc = running.get("processor", "")
                            if "GPU" in proc:
                                is_in_gpu = True
            except Exception:
                pass  # Optional enhancement

            latency_ms = round((time.perf_counter() - t0) * 1000, 2)

            status = "ready" if is_installed else "degraded"
            error = None if is_installed else f"Target model '{target_model}' not found in Ollama library."

            return AIHealthResponse(
                status=status,
                ollama_url=settings.OLLAMA_BASE_URL,
                target_model=target_model,
                is_target_model_installed=is_installed,
                is_model_running_in_gpu=is_in_gpu,
                available_models=models_list,
                error_message=error,
                latency_ms=latency_ms
            )

    except httpx.ConnectError:
        return AIHealthResponse(
            status="unavailable",
            ollama_url=settings.OLLAMA_BASE_URL,
            target_model=target_model,
            is_target_model_installed=False,
            error_message="Could not connect to Ollama. Please ensure Ollama is running (`ollama serve`)."
        )
    except httpx.TimeoutException:
        return AIHealthResponse(
            status="unavailable",
            ollama_url=settings.OLLAMA_BASE_URL,
            target_model=target_model,
            is_target_model_installed=False,
            error_message="Connection to Ollama timed out after 5.0 seconds."
        )
    except Exception as e:
        return AIHealthResponse(
            status="unavailable",
            ollama_url=settings.OLLAMA_BASE_URL,
            target_model=target_model,
            is_target_model_installed=False,
            error_message=f"Unexpected error checking AI status: {str(e)}"
        )
