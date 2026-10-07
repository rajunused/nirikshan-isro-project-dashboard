"""
ISRO NIRIKSHAN AI-Driven Dynamic ESS Intelligence & Latent-Defect Risk Screening
Module B: Safety Slope Comparator Engine (dI/dt)
Evaluates electrical parameter drift rate against mission-critical reliability limits
"""

from dataclasses import dataclass
from typing import Optional


@dataclass
class SafetySlopeEvaluation:
    actual_slope_ua_h: float
    threshold_slope_ua_h: float
    slope_ratio: float
    is_safe: bool
    status_label: str


class SafetySlopeComparator:
    """
    Compares parameter drift (dI/dt) across burn-in duration against MIL-STD limits.
    """

    @classmethod
    def evaluate_slope(
        cls,
        drift_rate_ua_h: float,
        threshold_slope_ua_h: float = 0.08
    ) -> SafetySlopeEvaluation:
        threshold = max(0.001, threshold_slope_ua_h)
        actual = abs(drift_rate_ua_h)
        ratio = round(actual / threshold, 3)

        if ratio <= 0.75:
            label = "NOMINAL_STABLE"
            is_safe = True
        elif ratio <= 1.0:
            label = "MARGINAL_APPROACHING_LIMIT"
            is_safe = True
        elif ratio <= 1.5:
            label = "ELEVATED_DRIFT_EXCEEDED"
            is_safe = False
        else:
            label = "CRITICAL_RUNAWAY_DRIFT"
            is_safe = False

        return SafetySlopeEvaluation(
            actual_slope_ua_h=round(actual, 4),
            threshold_slope_ua_h=round(threshold, 4),
            slope_ratio=ratio,
            is_safe=is_safe,
            status_label=label
        )
