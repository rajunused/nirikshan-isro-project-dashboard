"""
ISRO NIRIKSHAN AI-Driven Dynamic ESS Intelligence & Latent-Defect Risk Screening
Database Model: Historical Qualified Golden Baseline Distributions
"""

from typing import Optional
from sqlalchemy import String, Integer, Float, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class HistoricalBaseline(Base, TimestampMixin):
    __tablename__ = "historical_baselines"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    device_family: Mapped[str] = mapped_column(String(128), unique=True, index=True, nullable=False)
    
    # Statistical Population Baseline
    median_leakage_ua: Mapped[float] = mapped_column(Float, nullable=False, default=11.4)
    mad_leakage_ua: Mapped[float] = mapped_column(Float, nullable=False, default=1.15)
    mean_delay_ns: Mapped[float] = mapped_column(Float, nullable=False, default=1.80)
    std_delay_ns: Mapped[float] = mapped_column(Float, nullable=False, default=0.25)
    
    # Serialized Covariance Matrix JSON (2x2 or 3x3 for FastMCD)
    covariance_matrix_json: Mapped[str] = mapped_column(
        Text,
        default='[[2.04, 0.18], [0.18, 0.062]]',
        nullable=False
    )
    
    sample_size_n: Mapped[int] = mapped_column(Integer, default=500)
    qualification_authority: Mapped[str] = mapped_column(String(64), default="ISRO-VSSC-QA")
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
