from pydantic_settings import BaseSettings
from functools import lru_cache
import os
from dotenv import load_dotenv

load_dotenv(".env")
if os.path.exists(".env.local"):
    load_dotenv(".env.local", override=True)

# Application settings loaded from environment variables
class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    REFRESH_TOKEN_EXPIRE_DAYS: int

    APP_NAME: str = "Smart Palm Monitoring and Detection System"
    DEBUG: bool = False

    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    FROM_EMAIL: str = ""
    ADMIN_EMAIL: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

# Cached settings instance (avoid reloading)
# @lru_cache()
def get_settings() -> Settings:
    return Settings()

# Global settings object
settings = get_settings()