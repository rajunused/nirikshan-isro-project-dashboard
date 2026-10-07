"""
ISRO NIRIKSHAN AI-Driven Dynamic ESS Intelligence & Latent-Defect Risk Screening
API V1 Central Router: Mounts all modular endpoints
"""

from fastapi import APIRouter

from app.api.v1.endpoints.ingestion import router as ingestion_router
from app.api.v1.endpoints.lots import router as lots_router
from app.api.v1.endpoints.components import router as components_router
from app.api.v1.endpoints.module_a import router as module_a_router
from app.api.v1.endpoints.module_b import router as module_b_router
from app.api.v1.endpoints.recalibration import router as recalibration_router
from app.api.v1.endpoints.fusion import router as fusion_router
from app.api.v1.endpoints.audit import router as audit_router

api_v1_router = APIRouter()

api_v1_router.include_router(ingestion_router)
api_v1_router.include_router(lots_router)
api_v1_router.include_router(components_router)
api_v1_router.include_router(module_a_router)
api_v1_router.include_router(module_b_router)
api_v1_router.include_router(recalibration_router)
api_v1_router.include_router(fusion_router)
api_v1_router.include_router(audit_router)
