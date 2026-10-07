"""
ISRO NIRIKSHAN AI-Driven Dynamic ESS Intelligence & Latent-Defect Risk Screening
Pydantic V2 Schemas: Lot Statistics & Hierarchical Baseline Information
"""

from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class LotCreate(BaseModel):
    id: str = Field(..., example="LOT-A-RADHARD")
    device_family: str = Field(..., example="RH-LOGIC-01")
    chamber_id: str = Field(default="VSSC-TC-04")
    qualification_level: str = Field(default="MIL-STD-883_CLASS_V")


class LotSummaryResponse(BaseModel):
    id: str
    device_family: str
    status: str
    chamber_id: str
    total_components: int
    accepted_count: int
    review_count: int
    rejected_count: int
    accept_rate_pct: float
    median_leakage: Optional[float] = None
    mad_leakage: Optional[float] = None


class BaselineMetricsResponse(BaseModel):
    lot_id: str
    is_blended: bool
    sample_size_n: int
    effective_median_ua: float
    effective_mad_ua: float
    lot_weight: float
    historical_weight: float
    historical_reference_median_ua: float
    historical_reference_mad_ua: float
    recommendation: str
