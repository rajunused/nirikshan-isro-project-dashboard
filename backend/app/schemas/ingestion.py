"""
ISRO NIRIKSHAN AI-Driven Dynamic ESS Intelligence & Latent-Defect Risk Screening
Pydantic V2 Schemas: Data Ingestion & Synthetic ATE Generation
"""

from typing import Dict, List, Optional, Union
from pydantic import BaseModel, Field


class IngestionResponse(BaseModel):
    lot_id: str
    format_type: str  # STDF_V4, ATDF, CSV
    total_records_parsed: int
    components_ingested: int
    quarantined_count: int
    quarantine_reasons: List[str] = Field(default_factory=list)
    processing_time_ms: float
    status: str = "SUCCESS"


class SyntheticLotRequest(BaseModel):
    lot_id: str = Field(default="LOT-SYNTH-RADHARD", description="Designation for generated flight lot")
    device_family: str = Field(default="RH-FPGA-701", description="Device family catalog ID")
    total_components: int = Field(default=40, ge=5, le=500, description="Total units to synthesize")
    include_type1_high_start: bool = Field(default=True, description="Inject Type 1 latent defect")
    include_type2_accelerating: bool = Field(default=True, description="Inject Type 2 accelerating drift")
    include_type3_late_onset: bool = Field(default=True, description="Inject Type 3 96h late onset")
    include_type4_covariance: bool = Field(default=True, description="Inject Type 4 multivariate breakdown")
    wafer_diameter_inches: int = Field(default=8, description="Wafer diameter in inches")


class RawMeasurementInput(BaseModel):
    component_id: str
    hour: int
    leakage_ua: float
    delay_ns: float
    contact_res_ohm: float = 0.42
    chamber_temp_c: float = 125.0
