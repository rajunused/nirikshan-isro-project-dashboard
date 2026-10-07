"""
ISRO NIRIKSHAN AI-Driven Dynamic ESS Intelligence & Latent-Defect Risk Screening
API Endpoint: Flight Lot Management & Hierarchical Baseline Diagnostics
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status

from app.engine.module_a.hierarchical import HierarchicalBaselineEngine
from app.schemas.lot import LotSummaryResponse, BaselineMetricsResponse
from app.services.lot_service import flight_repo

router = APIRouter(prefix="/lots", tags=["Flight Lots"])


@router.get("", response_model=List[str])
async def list_flight_lots():
    """List all registered flight screening lot identifiers."""
    return list(flight_repo.lots.keys())


@router.get("/{lot_id:path}/metrics", response_model=LotSummaryResponse)
async def get_lot_metrics(
    lot_id: str,
    w_fn: float = Query(5.0, ge=1.0, le=10.0),
    slope: float = Query(0.08, ge=0.01, le=0.30)
):
    """
    Returns high-level screening summary metrics and yield ratios for a given lot.
    """
    if lot_id not in flight_repo.lots:
        raise HTTPException(status_code=404, detail=f"Flight Lot '{lot_id}' not found")

    screened = flight_repo.screen_lot(lot_id=lot_id, w_fn=w_fn, slope_threshold=slope)
    total = len(screened)
    acc = sum(1 for c in screened if c["verdict"] == "ACCEPT")
    rev = sum(1 for c in screened if c["verdict"] == "REVIEW")
    rej = sum(1 for c in screened if c["verdict"] == "REJECT")
    rate = round((acc / total * 100.0), 1) if total > 0 else 0.0

    v24s = [c["leakage_24h"] for c in screened]
    blended = HierarchicalBaselineEngine.blend_lot_baseline(v24s)

    lot_info = flight_repo.lots[lot_id]
    return LotSummaryResponse(
        id=lot_id,
        device_family=lot_info.get("device_family", "RH-LOGIC"),
        status=lot_info.get("status", "SCREENING_ACTIVE"),
        chamber_id=lot_info.get("chamber_id", "VSSC-TC-04"),
        total_components=total,
        accepted_count=acc,
        review_count=rev,
        rejected_count=rej,
        accept_rate_pct=rate,
        median_leakage=blended.median_effective,
        mad_leakage=blended.mad_effective
    )


@router.get("/{lot_id:path}/baseline", response_model=BaselineMetricsResponse)
async def get_hierarchical_baseline(lot_id: str):
    """
    Calculates Small-Lot Bayesian Fallback metrics. Blends lot variance with historical golden profile if n < 15.
    """
    comps = flight_repo.get_lot_components(lot_id)
    if not comps:
        raise HTTPException(status_code=404, detail=f"No components registered under lot '{lot_id}'")

    v24s = [c["baseline"][1] for c in comps]
    blended = HierarchicalBaselineEngine.blend_lot_baseline(v24s)

    rec = "Sufficient sample size (N>=15). Using purely empirical lot variance." if not blended.is_blended else \
          f"Small lot condition met (N={blended.lot_size_n} < 15). Blended {blended.lot_weight*100:.0f}% lot with {blended.historical_weight*100:.0f}% historical archive to prevent bad-lot masking."

    return BaselineMetricsResponse(
        lot_id=lot_id,
        is_blended=blended.is_blended,
        sample_size_n=blended.lot_size_n,
        effective_median_ua=blended.median_effective,
        effective_mad_ua=blended.mad_effective,
        lot_weight=blended.lot_weight,
        historical_weight=blended.historical_weight,
        historical_reference_median_ua=11.40,
        historical_reference_mad_ua=1.15,
        recommendation=rec
    )
