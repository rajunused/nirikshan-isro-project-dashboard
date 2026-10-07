"""
ISRO NIRIKSHAN AI-Driven Dynamic ESS Intelligence & Latent-Defect Risk Screening
Risk Fusion: Cost-Sensitive Optimization Engine
Dynamically adjusts decision boundaries based on False Negative Penalty Multiplier (w_fn: 1.0 to 10.0)
Aerospace Standard: Flight assurance demands zero escapes to orbit.
"""

from dataclasses import dataclass
from typing import Tuple


@dataclass
class CostSensitiveThresholds:
    w_fn: float
    effective_z_reject: float
    effective_z_review: float
    effective_slope_max: float
    effective_mahalanobis_multiplier: float


class CostSensitiveOptimizer:
    """
    Optimizes risk classification cutoffs against an asymmetric cost matrix:
    Cost(FN) = w_fn * C_satellite_failure
    Cost(FP) = 1.0 * C_part_scrap
    """

    BASE_Z_REJECT = 3.5
    BASE_Z_REVIEW = 2.0
    BASE_SLOPE = 0.08

    @classmethod
    def calculate_adjusted_thresholds(
        cls,
        w_fn: float = 5.0,
        configured_base_slope: float = 0.08
    ) -> CostSensitiveThresholds:
        # Clamp w_fn within specified aerospace envelope [1.0, 10.0]
        weight = max(1.0, min(10.0, float(w_fn)))

        # As w_fn increases, thresholds tighten to prevent any latent escapes
        # When w_fn = 1.0 (Commercial): Z_reject = 3.5, Z_review = 2.0
        # When w_fn = 10.0 (ISRO Flight Assurance Class S): Z_reject = 2.8, Z_review = 1.5
        tightening_factor = 1.0 - (0.022 * (weight - 1.0))
        
        adj_z_reject = max(2.5, cls.BASE_Z_REJECT * tightening_factor)
        adj_z_review = max(1.4, cls.BASE_Z_REVIEW * tightening_factor)
        adj_slope = max(0.02, configured_base_slope * tightening_factor)
        adj_maha_mult = max(0.75, 1.0 - (0.025 * (weight - 1.0)))

        return CostSensitiveThresholds(
            w_fn=round(weight, 2),
            effective_z_reject=round(adj_z_reject, 2),
            effective_z_review=round(adj_z_review, 2),
            effective_slope_max=round(adj_slope, 4),
            effective_mahalanobis_multiplier=round(adj_maha_mult, 3)
        )
