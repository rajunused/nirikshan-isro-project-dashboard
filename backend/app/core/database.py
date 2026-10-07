"""
ISRO NIRIKSHAN AI-Driven Dynamic ESS Intelligence & Latent-Defect Risk Screening
Asynchronous SQLAlchemy 2.0 Database Engine & Connection Pooling
Provides resilient offline GSE mode when database connection is not active.
"""

from typing import AsyncGenerator
from app.core.config import settings
from app.core.logging import logger

try:
    from sqlalchemy.ext.asyncio import (
        AsyncSession,
        async_sessionmaker,
        create_async_engine
    )
    from sqlalchemy import text

    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=settings.DEBUG,
        pool_size=settings.DB_POOL_SIZE,
        max_overflow=settings.DB_MAX_OVERFLOW,
        pool_timeout=settings.DB_POOL_TIMEOUT,
        pool_recycle=settings.DB_POOL_RECYCLE,
        pool_pre_ping=True
    )

    AsyncSessionLocal = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
        autocommit=False
    )
    HAS_SQLALCHEMY = True

except ImportError:
    HAS_SQLALCHEMY = False
    engine = None
    AsyncSessionLocal = None


async def get_db():
    """
    FastAPI dependency that yields an active async database session.
    Yields None if running in standalone offline Ground Support Equipment mode.
    """
    if not HAS_SQLALCHEMY or AsyncSessionLocal is None:
        yield None
        return

    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_timescaledb_hypertables():
    """
    Ensure TimescaleDB extension and hypertables exist for time-series measurements.
    Gracefully handles environments running standard PostgreSQL or offline mode.
    """
    if not HAS_SQLALCHEMY or engine is None:
        logger.info("Operating in standalone offline Ground Support Equipment (GSE) mode.")
        return

    try:
        from sqlalchemy import text
        async with engine.begin() as conn:
            try:
                await conn.execute(text("CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;"))
                logger.info("TimescaleDB extension verified/enabled.")
            except Exception as e:
                logger.warning(f"TimescaleDB extension skipped (standard PostgreSQL active): {e}")

            try:
                await conn.execute(
                    text("SELECT create_hypertable('measurements', 'timestamp', if_not_exists => TRUE);")
                )
                logger.info("TimescaleDB hypertable initialized on 'measurements'.")
            except Exception as e:
                logger.debug(f"Hypertable creation check: {e}")
    except Exception as e:
        logger.warning(f"Database connection deferred: {e}")
