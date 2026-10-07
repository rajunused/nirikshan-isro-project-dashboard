"""
ISRO NIRIKSHAN AI-Driven Dynamic ESS Intelligence & Latent-Defect Risk Screening
Pydantic V2 Schemas: Non-Conformance Reports (NCR) & Cryptographic Sign-Off
"""

from typing import Dict, List, Optional, Union
from pydantic import BaseModel, Field


class DispositionSignOffRequest(BaseModel):
    component_id: str
    status: str = Field(..., example="REJECT")  # ACCEPT, REVIEW, REJECT, QUARANTINE
    inspector_id: str = Field(..., example="ISRO-QA-883")
    notes: str = Field(..., example="Confirmed gate-oxide leakage drift under 125C HTOL.")


class DispositionResponse(BaseModel):
    component_id: str
    status: str
    inspector_id: str
    timestamp: str
    message: str


class NCRReportSummary(BaseModel):
    report_uuid: str
    component_id: str
    lot_id: str
    inspector_id: str
    disposition_verdict: str
    failure_signature: str
    modified_z_score: float
    mahalanobis_distance: float
    predicted_168h_leakage: float
    sha256_hash: str
    created_at: str
    download_url: str
