"""
ISRO NIRIKSHAN AI-Driven Dynamic ESS Intelligence & Latent-Defect Risk Screening
Module A: Hierarchical Small-Lot Bayesian Blending Engine
Prevents Bad-Lot Masking when sample size n < 15 by blending with qualified flight archive
Formula: Sigma_blended = sqrt( (n / 15) * MAD_lot^2 + (1 - n / 15) * MAD_historical^2 )
"""

import math
from dataclasses import dataclass
from typing import List, Optional, Tuple, Union
import numpy as np

from app.engine.module_a.robust_stats import RobustStatsEngine


@dataclass
class BlendedBaselineResult:
    median_effective: float
    mad_effective: float
    is_blended: bool
    lot_size_n: int
    lot_weight: float
    historical_weight: float


class HierarchicalBaselineEngine:
    """
    Blends small flight lot sample statistics with historical golden lot profiles
    to guarantee strict statistical power during small satellite payload screening.
    """

    CRITICAL_SAMPLE_THRESHOLD = 15

    @classmethod
    def blend_lot_baseline(
        cls,
        lot_values: Union[List[float], np.ndarray],
        historical_median: float = 11.40,
        historical_mad: float = 1.15
    ) -> BlendedBaselineResult:
        n = len(lot_values)
        if n == 0:
            return BlendedBaselineResult(
                median_effective=historical_median,
                mad_effective=historical_mad,
                is_blended=True,
                lot_size_n=0,
                lot_weight=0.0,
                historical_weight=1.0
            )

        lot_med, lot_mad = RobustStatsEngine.calculate_median_and_mad(lot_values)

        if n >= cls.CRITICAL_SAMPLE_THRESHOLD:
            # Full statistical power achieved from current screening lot
            return BlendedBaselineResult(
                median_effective=lot_med,
                mad_effective=lot_mad,
                is_blended=False,
                lot_size_n=n,
                lot_weight=1.0,
                historical_weight=0.0
            )

        # Small lot condition: Apply Bayesian shrinkage / variance blending
        w_lot = n / float(cls.CRITICAL_SAMPLE_THRESHOLD)
        w_hist = 1.0 - w_lot

        # Blend variance: Sigma_blended = sqrt( w_lot * MAD_lot^2 + w_hist * MAD_hist^2 )
        blended_mad_sq = (w_lot * (lot_mad ** 2)) + (w_hist * (historical_mad ** 2))
        mad_blended = math.sqrt(max(1e-6, blended_mad_sq))

        # Blend median: Med_blended = w_lot * Med_lot + w_hist * Med_hist
        median_blended = (w_lot * lot_med) + (w_hist * historical_median)

        return BlendedBaselineResult(
            median_effective=round(median_blended, 4),
            mad_effective=round(mad_blended, 4),
            is_blended=True,
            lot_size_n=n,
            lot_weight=round(w_lot, 3),
            historical_weight=round(w_hist, 3)
        )
