import os
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./propmanager.db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    PAYMENT_GATEWAY_URL: str = os.getenv("PAYMENT_GATEWAY_URL", "https://api.sandbox.payments.example.com")
    PAYMENT_API_KEY: str = os.getenv("PAYMENT_API_KEY", "sk_test_demo_key")

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
