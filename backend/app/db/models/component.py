"""
ISRO NIRIKSHAN AI-Driven Dynamic ESS Intelligence & Latent-Defect Risk Screening
Database Model: Flight Component Unit
"""

from typing import List, Optional
from sqlalchemy import String, Integer, Float, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.db.base import Base, TimestampMixin


class DispositionVerdict(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPT = "ACCEPT"
    REVIEW = "REVIEW"
    REJECT = "REJECT"


class LatentDefectType(str, enum.Enum):
    NOMINAL = "NOMINAL"
    TYPE_1_HIGH_START = "TYPE_1_HIGH_START"
    TYPE_2_ACCELERATING_DRIFT = "TYPE_2_ACCELERATING_DRIFT"
    TYPE_3_LATE_ONSET = "TYPE_3_LATE_ONSET"
    TYPE_4_COVARIANCE_BREAKDOWN = "TYPE_4_COVARIANCE_BREAKDOWN"
    ATE_CONTACT_FAULT = "ATE_CONTACT_FAULT"


class Component(Base, TimestampMixin):
    __tablename__ = "components"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)  # e.g., 'COMP-4089'
    lot_id: Mapped[str] = mapped_column(String(64), ForeignKey("lots.id"), index=True, nullable=False)
    
    # Wafer Spatial Coordinates
    wafer_x: Mapped[int] = mapped_column(Integer, default=0)
    wafer_y: Mapped[int] = mapped_column(Integer, default=0)
    is_wafer_edge: Mapped[bool] = mapped_column(default=False)

    # Dynamic Analytical Metrics
    modified_z_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    mahalanobis_distance: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    predicted_168h_leakage: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    p10_lower_bound: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    p90_upper_bound: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    drift_rate_ua_h: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    curvature_96h: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Classification & Defect Tiers
    defect_type: Mapped[LatentDefectType] = mapped_column(
        SQLEnum(LatentDefectType),
        default=LatentDefectType.NOMINAL,
        nullable=False
    )
    verdict: Mapped[DispositionVerdict] = mapped_column(
        SQLEnum(DispositionVerdict),
        default=DispositionVerdict.PENDING,
        nullable=False
    )
    risk_score: Mapped[float] = mapped_column(Float, default=0.0)  # 0.0 to 100.0%
    failure_mode_driver: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    disposition_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    inspector_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    # Relationships
    lot: Mapped["Lot"] = relationship("Lot", back_populates="components")
    measurements: Mapped[List["Measurement"]] = relationship(
        "Measurement", back_populates="component", cascade="all, delete-orphan", order_by="Measurement.hour_milestone"
    )
    ncr_reports: Mapped[List["NCRReport"]] = relationship(
        "NCRReport", back_populates="component", cascade="all, delete-orphan"
    )
