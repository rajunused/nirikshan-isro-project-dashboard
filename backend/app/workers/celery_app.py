"""
ISRO NIRIKSHAN AI-Driven Dynamic ESS Intelligence & Latent-Defect Risk Screening
Celery Distributed Worker Configuration
Handles asynchronous STDF batch parsing, distributed FastMCD, and Monte Carlo runs
"""

from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "nirikshan_workers",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.workers.tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,  # 5 minutes maximum for large STDF datasets
    worker_prefetch_multiplier=1,
)
