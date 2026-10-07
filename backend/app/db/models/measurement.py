"""
ISRO NIRIKSHAN AI-Driven Dynamic ESS Intelligence & Latent-Defect Risk Screening
Database Model: Time-Series Burn-In Measurement Checkpoints (TimescaleDB Hypertable)
"""

from datetime import datetime, timezone
from sqlalchemy import String, Integer, Float, ForeignKey, DateTime, Boolean, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Measurement(Base):
    __tablename__ = "measurements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    component_id: Mapped[str] = mapped_column(String(64), ForeignKey("components.id"), index=True, nullable=False)
    
    # Milestone Inspection Hour (0, 24, 96, 168)
    hour_milestone: Mapped[int] = mapped_column(Integer, nullable=False)
    
    # Electrical Parametric Values
    iddq_leakage_ua: Mapped[float] = mapped_column(Float, nullable=False)  # Quiescent leakage current (µA)
    propagation_delay_ns: Mapped[float] = mapped_column(Float, nullable=False)  # Critical path delay (ns)
    standby_current_ua: Mapped[float] = mapped_column(Float, default=10.0)  # Standby Idd (µA)
    contact_resistance_ohm: Mapped[float] = mapped_column(Float, default=0.5)  # ATE Contact sanity resistance (Ω)
    chamber_temperature_c: Mapped[float] = mapped_column(Float, default=125.0)  # Soak temperature (°C)
    vdd_bias_volts: Mapped[float] = mapped_column(Float, default=3.30)
    
    # Telemetry Status & Validation
    is_valid_contact: Mapped[bool] = mapped_column(Boolean, default=True)
    is_quarantined: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Timestamp for TimescaleDB partitioning
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True
    )

    # Relationships
    component: Mapped["Component"] = relationship("Component", back_populates="measurements")

    __table_args__ = (
        Index("idx_comp_hour", "component_id", "hour_milestone", unique=True),
    )
