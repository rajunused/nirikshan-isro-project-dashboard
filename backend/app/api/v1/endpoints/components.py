"""
ISRO NIRIKSHAN AI-Driven Dynamic ESS Intelligence & Latent-Defect Risk Screening
API Endpoint: Component Telemetry & Filtered Queries
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status

from app.schemas.telemetry import ComponentTelemetryItem
from app.services.lot_service import flight_repo

router = APIRouter(prefix="/components", tags=["Components"])


@router.get("", response_model=List[ComponentTelemetryItem])
async def list_components(
    lot_id: str = Query("LOT-A / RAD-HARD LOGIC"),
    verdict: Optional[str] = Query(None, description="Filter by ACCEPT, REVIEW, REJECT"),
    w_fn: float = Query(5.0, ge=1.0, le=10.0),
    slope: float = Query(0.08, ge=0.01, le=0.30)
):
    """
    Returns screened component list with dynamic metrics (Modified Z, Mahalanobis, drift rate, verdict).
    """
    screened = flight_repo.screen_lot(lot_id=lot_id, w_fn=w_fn, slope_threshold=slope)
    if verdict and verdict.upper() != "ALL":
        screened = [c for c in screened if c["verdict"] == verdict.upper()]

    return [
        ComponentTelemetryItem(
            id=c["id"],
            lot_id=c["lot_id"],
            wafer_x=c["wafer_x"],
            wafer_y=c["wafer_y"],
            is_edge=c["is_edge"],
            baseline_0h=c["baseline_0h"],
            leakage_24h=c["leakage_24h"],
            leakage_96h=c["leakage_96h"],
            forecast_168h=c["forecast_168h"],
            modified_z_score=c["modified_z_score"],
            mahalanobis_distance=c["mahalanobis_distance"],
            drift_rate_ua_h=c["drift_rate_ua_h"],
            verdict=c["verdict"],
            defect_type=c["defect_type"],
            risk_score=c["risk_score"],
            failure_mode=c["failure_mode"]
        )
        for c in screened
    ]


@router.get("/{component_id}", response_model=ComponentTelemetryItem)
async def get_component_detail(
    component_id: str,
    w_fn: float = Query(5.0),
    slope: float = Query(0.08)
):
    """Fetch individual component telemetry and screening state."""
    raw = flight_repo.components.get(component_id)
    if not raw:
        raise HTTPException(status_code=404, detail=f"Component '{component_id}' not found")

    screened = flight_repo.screen_lot(lot_id=raw["lot_id"], w_fn=w_fn, slope_threshold=slope)
    target = next((c for c in screened if c["id"] == component_id), None)
    if not target:
        raise HTTPException(status_code=404, detail=f"Screening data unavailable for '{component_id}'")

    return ComponentTelemetryItem(
        id=target["id"],
        lot_id=target["lot_id"],
        wafer_x=target["wafer_x"],
        wafer_y=target["wafer_y"],
        is_edge=target["is_edge"],
        baseline_0h=target["baseline_0h"],
        leakage_24h=target["leakage_24h"],
        leakage_96h=target["leakage_96h"],
        forecast_168h=target["forecast_168h"],
        modified_z_score=target["modified_z_score"],
        mahalanobis_distance=target["mahalanobis_distance"],
        drift_rate_ua_h=target["drift_rate_ua_h"],
        verdict=target["verdict"],
        defect_type=target["defect_type"],
        risk_score=target["risk_score"],
        failure_mode=target["failure_mode"]
    )
