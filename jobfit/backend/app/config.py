"""Application Configuration Module using Pydantic Settings."""
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Server Settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True
    APP_NAME: str = "JobFit"
    APP_VERSION: str = "0.1.0"

    # Ollama AI Configuration
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "gemma2:2b"
    OLLAMA_TIMEOUT_SECONDS: float = 60.0

    # Storage & Persistence
    DATABASE_URL: str = "sqlite:///./jobfit.db"
    UPLOAD_DIR: str = "./uploads"

    # CORS Settings
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def upload_path(self) -> Path:
        path = Path(self.UPLOAD_DIR)
        path.mkdir(parents=True, exist_ok=True)
        return path


# Singleton settings instance
settings = Settings()
