"""Common and Health Schemas."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(..., example="healthy")
    app_name: str = Field(..., example="JobFit")
    version: str = Field(..., example="0.1.0")
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class AIHealthResponse(BaseModel):
    status: str = Field(..., description="'ready', 'unavailable', or 'degraded'")
    ollama_url: str
    target_model: str
    is_target_model_installed: bool
    is_model_running_in_gpu: bool = False
    available_models: List[str] = []
    error_message: Optional[str] = None
    latency_ms: Optional[float] = None
