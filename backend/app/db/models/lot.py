"""
ISRO NIRIKSHAN AI-Driven Dynamic ESS Intelligence & Latent-Defect Risk Screening
Database Model: Flight Screening Lot
"""

from typing import List, Optional
from sqlalchemy import String, Integer, Float, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.db.base import Base, TimestampMixin


class LotQualificationLevel(str, enum.Enum):
    CLASS_V = "MIL-STD-883_CLASS_V"
    CLASS_S = "ISRO_SPACE_CLASS_S"
    ENGINEERING_MODEL = "ENGINEERING_MODEL"


class LotStatus(str, enum.Enum):
    INGESTED = "INGESTED"
    SCREENING_ACTIVE = "SCREENING_ACTIVE"
    RECALIBRATION_PENDING = "RECALIBRATION_PENDING"
    SCREENING_COMPLETED = "SCREENING_COMPLETED"
    QUARANTINED = "QUARANTINED"


class Lot(Base, TimestampMixin):
    __tablename__ = "lots"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)  # e.g., 'LOT-A-RADHARD'
    device_family: Mapped[str] = mapped_column(String(128), nullable=False)  # e.g., 'RH-FPGA-701'
    wafer_lot_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    qualification_level: Mapped[LotQualificationLevel] = mapped_column(
        SQLEnum(LotQualificationLevel),
        default=LotQualificationLevel.CLASS_V,
        nullable=False
    )
    status: Mapped[LotStatus] = mapped_column(
        SQLEnum(LotStatus),
        default=LotStatus.SCREENING_ACTIVE,
        nullable=False
    )
    chamber_id: Mapped[str] = mapped_column(String(64), default="VSSC-TC-04")
    total_components: Mapped[int] = mapped_column(Integer, default=0)
    accepted_count: Mapped[int] = mapped_column(Integer, default=0)
    review_count: Mapped[int] = mapped_column(Integer, default=0)
    rejected_count: Mapped[int] = mapped_column(Integer, default=0)
    
    # Population Baseline Cache
    median_leakage: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    mad_leakage: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Relationships
    components: Mapped[List["Component"]] = relationship(
        "Component", back_populates="lot", cascade="all, delete-orphan"
    )
