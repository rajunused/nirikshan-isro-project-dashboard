"""
ISRO NIRIKSHAN AI-Driven Dynamic ESS Intelligence & Latent-Defect Risk Screening
FastAPI Application Entry Point & Lifespan Event Coordinator
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.logging import logger
from app.core.database import init_timescaledb_hypertables
from app.api.v1.router import api_v1_router
from app.api.v1.endpoints.telemetry import router as telemetry_ws_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application Lifespan Events: Database connection check, TimescaleDB hypertable setup.
    """
    logger.info("Initializing NIRIKSHAN Dynamic ESS Backend Services...")
    try:
        await init_timescaledb_hypertables()
    except Exception as e:
        logger.warning(f"Database hypertable initialization deferred: {e}")
    logger.info("NIRIKSHAN Backend Engine online and ready for ATE screening.")
    yield
    logger.info("Shutting down NIRIKSHAN services...")


def create_application() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description="Mission-critical ground station telemetry & dynamic ESS latent-defect risk screening system for ISRO satellite avionics.",
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc"
    )

    # Cross-Origin Resource Sharing (CORS) Middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Permits local React dashboard and GitHub Pages live URL
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Mount REST API V1 and WebSocket routes
    app.include_router(api_v1_router, prefix=settings.API_V1_STR)
    app.include_router(telemetry_ws_router)

    @app.get("/health", status_code=status.HTTP_200_OK, tags=["System Health"])
    async def health_check():
        return {
            "status": "HEALTHY",
            "system": "ISRO NIRIKSHAN ATE Analytics Engine",
            "version": settings.VERSION,
            "environment": settings.ENVIRONMENT
        }

    @app.get("/", tags=["Root"])
    async def root_info():
        return {
            "system": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "docs": "/docs",
            "api_v1": settings.API_V1_STR,
            "telemetry_ws": "/ws/chamber-telemetry"
        }

    return app


app = create_application()
