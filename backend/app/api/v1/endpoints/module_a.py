"""
ISRO NIRIKSHAN AI-Driven Dynamic ESS Intelligence & Latent-Defect Risk Screening
API Endpoint: Module A — Dynamic Anomaly Detection (MAD, FastMCD, Spatial Wafer)
"""

from typing import Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.engine.module_a.robust_stats import RobustStatsEngine
from app.engine.module_a.mahalanobis import FastMCDMahalanobisEngine
from app.engine.module_a.spatial_wafer import WaferSpatialEngine
from app.services.lot_service import flight_repo

router = APIRouter(prefix="/module-a", tags=["Module A: Dynamic Population Anomaly"])


class RobustEvalRequest(BaseModel):
    values: List[float] = Field(..., example=[11.2, 11.5, 12.0, 42.4, 11.8])


class RobustEvalResponse(BaseModel):
    median: float
    mad: float
    modified_z_scores: List[float]
    outliers_count: int
    outliers_indices: List[int]


class SpatialEvaluationResponse(BaseModel):
    lot_id: str
    morans_i_index: float
    is_spatially_clustered: bool
    total_dies: int
    edge_die_count: int
    gdbn_risk_count: int
    dies: List[Dict]


@router.post("/evaluate", response_model=RobustEvalResponse)
async def evaluate_robust_stats(req: RobustEvalRequest):
    """Calculates Median, MAD, and Boris Iglewicz Modified Z-scores."""
    med, mad = RobustStatsEngine.calculate_median_and_mad(req.values)
    z_scores = RobustStatsEngine.calculate_modified_z_scores(req.values, median_override=med, mad_override=mad)
    
    outliers_idx = [i for i, z in enumerate(z_scores) if abs(z) >= 3.5]
    return RobustEvalResponse(
        median=med,
        mad=mad,
        modified_z_scores=z_scores.tolist(),
        outliers_count=len(outliers_idx),
        outliers_indices=outliers_idx
    )


@router.get("/spatial/{lot_id:path}", response_model=SpatialEvaluationResponse)
async def get_wafer_spatial_map(lot_id: str):
    """
    Computes wafer layout, Moran's I spatial autocorrelation, and Good-Die-in-Bad-Neighborhood (GDBN) dies.
    """
    comps = flight_repo.get_lot_components(lot_id)
    if not comps:
        raise HTTPException(status_code=404, detail=f"No components registered for lot '{lot_id}'")

    dies_data = [
        {"id": c["id"], "x": c["x"], "y": c["y"], "is_anomaly": "TYPE" in c.get("type", ""), "leakage": c["baseline"][1]}
        for c in comps
    ]

    # Moran's I
    moran_tuples = [(d["x"], d["y"], d["leakage"]) for d in dies_data]
    morans_i = WaferSpatialEngine.calculate_morans_i(moran_tuples)

    # GDBN
    spatial_results = WaferSpatialEngine.evaluate_gdbn_clusters(dies_data)
    gdbn_count = sum(1 for s in spatial_results if s.gdbn_risk_flag)
    edge_count = sum(1 for s in spatial_results if s.is_edge)

    return SpatialEvaluationResponse(
        lot_id=lot_id,
        morans_i_index=morans_i,
        is_spatially_clustered=morans_i > 0.30,
        total_dies=len(dies_data),
        edge_die_count=edge_count,
        gdbn_risk_count=gdbn_count,
        dies=[
            {
                "id": s.component_id,
                "x": s.x,
                "y": s.y,
                "is_anomaly": s.is_anomaly,
                "is_edge": s.is_edge,
                "bad_neighbor_count": s.bad_neighbor_count,
                "gdbn_risk": s.gdbn_risk_flag
            }
            for s in spatial_results
        ]
    )
