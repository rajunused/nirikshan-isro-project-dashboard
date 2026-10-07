"""
ISRO NIRIKSHAN AI-Driven Dynamic ESS Intelligence & Latent-Defect Risk Screening
Pydantic V2 Schemas: Component Telemetry & Trajectory Prognostics
"""

from typing import Dict, List, Optional, Union
from pydantic import BaseModel, Field


class ComponentTelemetryItem(BaseModel):
    id: str
    lot_id: str
    wafer_x: int
    wafer_y: int
    is_edge: bool
    baseline_0h: float
    leakage_24h: float
    leakage_96h: Optional[float] = None
    forecast_168h: Optional[float] = None
    modified_z_score: float
    mahalanobis_distance: float
    drift_rate_ua_h: float
    verdict: str  # ACCEPT, REVIEW, REJECT
    defect_type: str
    risk_score: float
    failure_mode: Optional[str] = None


class TrajectoryForecastResponse(BaseModel):
    component_id: str
    v0: float
    v24: float
    predicted_168h_p50: float
    predicted_168h_p10: float
    predicted_168h_p90: float
    drift_rate_ua_h: float
    safety_slope_threshold: float
    is_safe: bool
    safety_status_label: str
    trajectory_points: List[Dict[str, Union[int, float, None]]]


class ChamberTelemetryState(BaseModel):
    chamber_id: str = "VSSC-TC-04"
    setpoint_temp_c: float = 125.0
    actual_temp_c: float = 125.1
    temp_deviation_c: float = 0.1
    vdd_bias_volts: float = 3.30
    soak_hours_elapsed: int = 96
    total_scheduled_hours: int = 168
    nitrogen_purge_flow_slpm: float = 12.4
    vacuum_pressure_torr: float = 760.0
    status_label: str = "HTOL_SOAK_NOMINAL"
