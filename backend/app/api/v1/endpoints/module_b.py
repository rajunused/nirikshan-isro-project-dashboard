"""
ISRO NIRIKSHAN AI-Driven Dynamic ESS Intelligence & Latent-Defect Risk Screening
API Endpoint: Module B — Trajectory Prognostics, Quantile Intervals & Monte Carlo
"""

from typing import Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.engine.module_b.trajectory_forecaster import TrajectoryForecaster
from app.engine.module_b.safety_slope import SafetySlopeComparator
from app.schemas.telemetry import TrajectoryForecastResponse
from app.services.lot_service import flight_repo

router = APIRouter(prefix="/module-b", tags=["Module B: Trajectory Prognostics"])


@router.get("/forecast/{component_id}", response_model=TrajectoryForecastResponse)
async def get_trajectory_forecast(
    component_id: str,
    slope_threshold: float = Query(0.08, ge=0.01, le=0.30)
):
    """
    Predicts 168h parameter value using exclusively 0h and 24h data with P10/P50/P90 quantile envelopes.
    """
    comp = flight_repo.components.get(component_id)
    if not comp:
        raise HTTPException(status_code=404, detail=f"Component '{component_id}' not found")

    v0 = comp["baseline"][0]
    v24 = comp["baseline"][1]
    v96 = comp["baseline"][2] if len(comp["baseline"]) > 2 else None
    v168 = comp["baseline"][3] if len(comp["baseline"]) > 3 else None

    forecaster = TrajectoryForecaster()
    res = forecaster.forecast_trajectory(v0=v0, v24=v24, v96=v96, v168_actual=v168)

    safety = SafetySlopeComparator.evaluate_slope(
        drift_rate_ua_h=res.drift_rate_ua_h,
        threshold_slope_ua_h=slope_threshold
    )

    return TrajectoryForecastResponse(
        component_id=component_id,
        v0=v0,
        v24=v24,
        predicted_168h_p50=res.predicted_168h_p50,
        predicted_168h_p10=res.predicted_168h_p10,
        predicted_168h_p90=res.predicted_168h_p90,
        drift_rate_ua_h=res.drift_rate_ua_h,
        safety_slope_threshold=slope_threshold,
        is_safe=safety.is_safe,
        safety_status_label=safety.status_label,
        trajectory_points=res.trajectory_points
    )


@router.get("/monte-carlo/{component_id}")
async def get_monte_carlo_trajectories(
    component_id: str,
    runs: int = Query(25, ge=5, le=100),
    seed: int = Query(42)
):
    """
    Generates stochastic Monte Carlo degradation paths from 0h/24h burn-in telemetry.
    """
    comp = flight_repo.components.get(component_id)
    if not comp:
        raise HTTPException(status_code=404, detail=f"Component '{component_id}' not found")

    v0 = comp["baseline"][0]
    v24 = comp["baseline"][1]

    forecaster = TrajectoryForecaster()
    simulations = forecaster.generate_monte_carlo_runs(v0=v0, v24=v24, num_simulations=runs, seed=seed)

    return {
        "component_id": component_id,
        "runs_count": len(simulations),
        "milestone_hours": [0, 24, 96, 168],
        "simulations": simulations
    }
