import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Hệ thống Vận hành Sản xuất & Thi công Cậu Long"
    ENVIRONMENT: str = "development"
    SECRET_KEY: str = "change-this-to-a-super-secret-key-at-least-32-chars-long-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 giờ

    # Database URL
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./caulong.db")
    SYNC_DATABASE_URL: str = os.getenv("SYNC_DATABASE_URL", "sqlite:///./caulong.db")

    # AI Defaults
    DEFAULT_AI_PROVIDER: str = "gemini"
    AI_MONTHLY_BUDGET_USD: float = 50.0
    AI_BUDGET_ALERT_THRESHOLD: float = 0.8

    model_config = SettingsConfigDict(env_file=".env", extra="allow")

settings = Settings()
