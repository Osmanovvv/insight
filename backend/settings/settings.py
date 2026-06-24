"""
Insight IS — Application Settings (Pydantic BaseSettings)
"""

from typing import List
from pydantic_settings import BaseSettings
from pydantic import field_validator


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://postgres:password@localhost:5432/insight_db"

    # JWT
    secret_key: str = "change-me-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 30

    # News APIs
    news_api_key: str = ""
    news_data_api_key: str = ""
    mediastack_api_key: str = ""
    gnews_api_key: str = ""
    # RSS (основной источник новостей, без ключей)
    rss_feed_url: str = "https://ria.ru/export/rss2/index.xml"

    # Financial APIs
    alpha_vantage_key: str = ""
    polygon_key: str = ""
    finnhub_key: str = ""

    # AI APIs
    gemini_api_key: str = ""

    # App
    debug: bool = True
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    cors_origins: str | List[str] = "http://localhost:3000,http://localhost:5173"

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()