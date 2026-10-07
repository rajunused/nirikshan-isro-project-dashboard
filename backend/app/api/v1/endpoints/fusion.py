"""
ISRO NIRIKSHAN AI-Driven Dynamic ESS Intelligence & Latent-Defect Risk Screening
API Endpoint: Risk Fusion & Explainability Engine
"""

from typing import Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.engine.fusion.cost_sensitive import CostSensitiveOptimizer
from app.engine.explainability.reason_generator import AerospaceReasonGenerator
from app.engine.explainability.shap_explainer import SHAPExplainerEngine
from app.db.models.component import DispositionVerdict, LatentDefectType
from app.services.lot_service import flight_repo

router = APIRouter(prefix="/fusion", tags=["Risk Fusion & Explainability"])


class ScreenLotRequest(BaseModel):
    lot_id: str = Field(default="LOT-A / RAD-HARD LOGIC")
    false_negative_penalty_w_fn: float = Field(default=5.0, ge=1.0, le=10.0, description="Cost penalty multiplier")
    safety_slope_threshold: float = Field(default=0.08, ge=0.01, le=0.30, description="Max allowable dI/dt (uA/h)")
    use_historical_baseline: bool = Field(default=True, description="Enable Small-Lot Bayesian Blending")


class ComponentExplainabilityResponse(BaseModel):
    component_id: str
    verdict: str
    defect_type: str
    risk_score: float
    reason_code: str
    title: str
    description: str
    recommended_action: str
    statistical_summary: str
    feature_attributions: List[Dict]


@router.post("/screen-lot")
async def run_lot_screening(req: ScreenLotRequest):
    """
    Executes full multi-module screening across the entire flight lot with cost-sensitive penalty.
    """
    if req.lot_id not in flight_repo.lots:
        raise HTTPException(status_code=404, detail=f"Flight lot '{req.lot_id}' not found")

    results = flight_repo.screen_lot(
        lot_id=req.lot_id,
        w_fn=req.false_negative_penalty_w_fn,
        slope_threshold=req.safety_slope_threshold,
        use_historical_baseline=req.use_historical_baseline
    )

    total = len(results)
    acc = sum(1 for c in results if c["verdict"] == "ACCEPT")
    rev = sum(1 for c in results if c["verdict"] == "REVIEW")
    rej = sum(1 for c in results if c["verdict"] == "REJECT")

    thresholds = CostSensitiveOptimizer.calculate_adjusted_thresholds(
        w_fn=req.false_negative_penalty_w_fn,
        configured_base_slope=req.safety_slope_threshold
    )

    return {
        "lot_id": req.lot_id,
        "total_screened": total,
        "accepted": acc,
        "review": rev,
        "rejected": rej,
        "accept_pct": round(acc / total * 100.0, 1) if total > 0 else 0.0,
        "applied_thresholds": {
            "w_fn": thresholds.w_fn,
            "effective_z_reject": thresholds.effective_z_reject,
            "effective_z_review": thresholds.effective_z_review,
            "effective_slope_max": thresholds.effective_slope_max
        },
        "components": results
    }


@router.get("/explain/{component_id}", response_model=ComponentExplainabilityResponse)
async def explain_component_risk(
    component_id: str,
    w_fn: float = Query(5.0, ge=1.0, le=10.0),
    slope: float = Query(0.08, ge=0.01, le=0.30)
):
    """
    Outputs deterministic aerospace reasoning codes and SHAP feature attributions for a given unit.
    """
    comp = flight_repo.components.get(component_id)
    if not comp:
        raise HTTPException(status_code=404, detail=f"Component '{component_id}' not found")

    screened = flight_repo.screen_lot(lot_id=comp["lot_id"], w_fn=w_fn, slope_threshold=slope)
    target = next((c for c in screened if c["id"] == component_id), None)
    if not target:
        raise HTTPException(status_code=404, detail=f"Telemetry unavailable for '{component_id}'")

    v0 = target["baseline_0h"]
    v24 = target["leakage_24h"]
    delta_24 = v24 - v0

    # Aerospace Reason Generator
    verdict_enum = DispositionVerdict(target["verdict"])
    defect_enum = LatentDefectType(target["defect_type"])
    rationale = AerospaceReasonGenerator.generate_rationale(
        verdict=verdict_enum,
        defect_type=defect_enum,
        modified_z=target["modified_z_score"],
        drift_rate=target["drift_rate_ua_h"],
        mahalanobis_dist=target["mahalanobis_distance"],
        is_gdbn=False
    )

    # SHAP Attributions
    shap_factors = SHAPExplainerEngine.explain_component_risk(
        leakage_0h=v0,
        delta_24h=delta_24,
        modified_z=target["modified_z_score"],
        mahalanobis_dist=target["mahalanobis_distance"],
        delay_ns=comp.get("delay", 1.8),
        is_edge=target["is_edge"],
        risk_score=target["risk_score"]
    )

    return ComponentExplainabilityResponse(
        component_id=component_id,
        verdict=target["verdict"],
        defect_type=target["defect_type"],
        risk_score=target["risk_score"],
        reason_code=rationale["reason_code"],
        title=rationale["title"],
        description=rationale["description"],
        recommended_action=rationale["recommended_action"],
        statistical_summary=rationale["statistical_summary"],
        feature_attributions=shap_factors
    )
