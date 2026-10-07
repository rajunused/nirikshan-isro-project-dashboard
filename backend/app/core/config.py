"""
ISRO NIRIKSHAN AI-Driven Dynamic ESS Intelligence & Latent-Defect Risk Screening
Core Configuration Module - Pydantic V2 BaseSettings with resilient fallback
"""

import os
from typing import List, Optional
from pydantic import Field, field_validator

try:
    from pydantic_settings import BaseSettings, SettingsConfigDict
except ImportError:
    from pydantic import BaseModel as BaseSettings
    def SettingsConfigDict(**kwargs):
        return kwargs


class Settings(BaseSettings):
    model_config = {
        "case_sensitive": True,
        "extra": "ignore"
    }

    # Project Identity
    PROJECT_NAME: str = "NIRIKSHAN Dynamic ESS Intelligence Engine"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = False

    # Security & Authentication
    JWT_SECRET_KEY: str = Field(
        default="isro_super_secret_aerospace_ground_station_jwt_key_2026_cleanroom_auth",
        description="Cryptographic secret key for signing JWT inspection tokens"
    )
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours for continuous shift duty

    # CORS Configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "https://rajunused.github.io"
    ]

    # Database Configuration (PostgreSQL + TimescaleDB)
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://isro_admin:isro_secure_ess_password@localhost:5432/nirikshan_ess",
        description="Async SQLAlchemy database connection string"
    )
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 1800

    # Distributed Cache & Celery Message Broker
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # Aerospace Dynamic Screening Thresholds (MIL-STD-883 Class V / Class S)
    MODIFIED_Z_REJECT_THRESHOLD: float = 3.5  # Median Absolute Deviation (MAD) σ limit
    MODIFIED_Z_REVIEW_THRESHOLD: float = 2.0
    DEFAULT_SAFETY_SLOPE_THRESHOLD: float = 0.08  # Max allowable leakage drift dI/dt (µA/h)
    MAX_ALLOWABLE_LEAKAGE_LIMIT_UA: float = 50.0  # Absolute hard datasheet ceiling (µA)
    DEFAULT_FALSE_NEGATIVE_PENALTY: float = 5.0  # w_fn: 1.0 to 10.0 flight assurance multiplier
    MAHALANOBIS_CHI2_PERCENTILE: float = 0.99  # Statistical critical value threshold
    SMALL_LOT_THRESHOLD: int = 15  # Fallback blending trigger count

    # Chamber Telemetry Stream Defaults
    CHAMBER_SETPOINT_TEMP_C: float = 125.0
    CHAMBER_ALLOWED_TEMP_TOLERANCE_C: float = 1.5
    CHAMBER_VDD_BIAS_VOLTS: float = 3.30

    @field_validator("DATABASE_URL")
    @classmethod
    def assemble_db_connection(cls, v: str) -> str:
        if v.startswith("postgresql://"):
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v


settings = Settings()
