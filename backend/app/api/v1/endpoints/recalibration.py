"""
ISRO NIRIKSHAN AI-Driven Dynamic ESS Intelligence & Latent-Defect Risk Screening
API Endpoint: Dynamic 96h Recalibration & Early-Abort Detector
"""

from typing import Dict, Optional
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.engine.module_b.check_96h import Dynamic96hEngine
from app.engine.module_b.quantile_regressor import QuantileRegressorEngine
from app.services.lot_service import flight_repo

router = APIRouter(prefix="/recalibration", tags=["96h Recalibration"])


class Inject96hRequest(BaseModel):
    component_id: str
    v96_value: float = Field(..., ge=0.0, le=200.0, example=26.5)


class Inject96hResponse(BaseModel):
    component_id: str
    v0: float
    v24: float
    v96: float
    curvature: float
    is_accelerating: bool
    trigger_early_abort: bool
    narrowed_p10: float
    narrowed_p90: float
    uncertainty_reduction_pct: float
    recommendation: str


@router.post("/96h-inject", response_model=Inject96hResponse)
async def inject_96h_telemetry(req: Inject96hRequest):
    """
    Dynamically injects 96h mid-screening telemetry.
    Calculates 2nd-order curvature and determines whether to trigger immediate early abort.
    """
    comp = flight_repo.components.get(req.component_id)
    if not comp:
        raise HTTPException(status_code=404, detail=f"Component '{req.component_id}' not found")

    v0 = comp["baseline"][0]
    v24 = comp["baseline"][1]
    
    # Calculate initial corridor
    reg = QuantileRegressorEngine()
    initial_qp = reg.predict_168h_quantiles(v0, v24)

    # Evaluate 96h curvature
    res = Dynamic96hEngine.evaluate_96h_checkpoint(
        v0=v0,
        v24=v24,
        v96=req.v96_value,
        initial_p10=initial_qp.p10,
        initial_p90=initial_qp.p90
    )

    # Update repo baseline
    if len(comp["baseline"]) > 2:
        comp["baseline"][2] = req.v96_value
    else:
        comp["baseline"].append(req.v96_value)

    return Inject96hResponse(
        component_id=req.component_id,
        v0=v0,
        v24=v24,
        v96=req.v96_value,
        curvature=res.curvature,
        is_accelerating=res.is_accelerating,
        trigger_early_abort=res.trigger_early_abort,
        narrowed_p10=res.narrowed_p10,
        narrowed_p90=res.narrowed_p90,
        uncertainty_reduction_pct=res.uncertainty_reduction_pct,
        recommendation=res.recommendation
    )


@router.get("/early-abort-check/{component_id}")
async def check_early_abort(component_id: str):
    """Query current early abort status for a component."""
    comp = flight_repo.components.get(component_id)
    if not comp:
        raise HTTPException(status_code=404, detail=f"Component '{component_id}' not found")

    v0 = comp["baseline"][0]
    v24 = comp["baseline"][1]
    v96 = comp["baseline"][2] if len(comp["baseline"]) > 2 else None

    if v96 is None:
        return {
            "component_id": component_id,
            "has_96h_data": False,
            "early_abort_active": False,
            "message": "96h checkpoint data not yet recorded."
        }

    reg = QuantileRegressorEngine()
    initial_qp = reg.predict_168h_quantiles(v0, v24)
    res = Dynamic96hEngine.evaluate_96h_checkpoint(v0, v24, v96, initial_qp.p10, initial_qp.p90)

    return {
        "component_id": component_id,
        "has_96h_data": True,
        "early_abort_active": res.trigger_early_abort,
        "curvature": res.curvature,
        "recommendation": res.recommendation
    }
