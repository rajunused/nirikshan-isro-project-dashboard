"""
ISRO NIRIKSHAN AI-Driven Dynamic ESS Intelligence & Latent-Defect Risk Screening
Database Model: Non-Conformance Reports (NCR) with SHA-256 Cryptographic Digest
"""

from sqlalchemy import String, Integer, Float, ForeignKey, Text, LargeBinary
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class NCRReport(Base, TimestampMixin):
    __tablename__ = "ncr_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    report_uuid: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    component_id: Mapped[str] = mapped_column(String(64), ForeignKey("components.id"), index=True, nullable=False)
    lot_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    
    # Inspector Metadata & Audit
    inspector_id: Mapped[str] = mapped_column(String(64), nullable=False)
    disposition_verdict: Mapped[str] = mapped_column(String(32), nullable=False)  # REJECT, REVIEW, QUARANTINE
    failure_signature: Mapped[str] = mapped_column(String(128), nullable=False)
    
    # Telemetry Snapshot
    modified_z_score: Mapped[float] = mapped_column(Float, nullable=False)
    mahalanobis_distance: Mapped[float] = mapped_column(Float, nullable=False)
    predicted_168h_leakage: Mapped[float] = mapped_column(Float, nullable=False)
    safety_slope_ratio: Mapped[float] = mapped_column(Float, nullable=False)
    
    # Cryptographic Hash & PDF Storage
    sha256_hash: Mapped[str] = mapped_column(String(64), nullable=False)  # SHA-256 of report content
    pdf_blob: Mapped[LargeBinary] = mapped_column(LargeBinary, nullable=True)
    report_metadata_json: Mapped[str] = mapped_column(Text, default="{}")

    # Relationships
    component: Mapped["Component"] = relationship("Component", back_populates="ncr_reports")
