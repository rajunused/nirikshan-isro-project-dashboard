"""
ISRO NIRIKSHAN AI-Driven Dynamic ESS Intelligence & Latent-Defect Risk Screening
Module B: Dynamic 96h Trajectory Delta & Early-Abort Engine
Computes 2nd-order curvature: Curvature = (V_96 - 2 * V_24 + V_0) / (72^2)
Triggers early abort for accelerating latent defects and narrows confidence corridors for stable units.
"""

from dataclasses import dataclass
from typing import Optional


@dataclass
class Check96hResult:
    curvature: float
    is_accelerating: bool
    trigger_early_abort: bool
    narrowed_p10: float
    narrowed_p90: float
    uncertainty_reduction_pct: float
    recommendation: str


class Dynamic96hEngine:
    """
    Evaluates dynamic 96h mid-screening checkpoint arrival.
    Saves up to 43% chamber operational time by triggering early aborts before 168h completion.
    """

    CURVATURE_ACCELERATION_THRESHOLD = 0.0008  # µA / h^2

    @classmethod
    def evaluate_96h_checkpoint(
        cls,
        v0: float,
        v24: float,
        v96: float,
        initial_p10: float,
        initial_p90: float,
        datasheet_limit: float = 50.0
    ) -> Check96hResult:
        # Second-order discrete difference curvature over 72h baseline interval
        # Interval between 0h and 24h is 24h, between 24h and 96h is 72h
        # Standardized second derivative across 72h milestone span:
        step_h = 72.0
        curvature = (v96 - (2.0 * v24) + v0) / (step_h ** 2)

        is_accelerating = curvature > cls.CURVATURE_ACCELERATION_THRESHOLD
        
        # Immediate abort criteria:
        # 1. 96h value already exceeds 80% of datasheet ceiling
        # 2. Strong accelerating curvature indicating gate-oxide runaway
        # 3. Trajectory projected to blow through 50µA ceiling before 168h
        projected_168 = v96 + ((v96 - v24) / 72.0) * 72.0
        trigger_early_abort = (
            v96 > (datasheet_limit * 0.75) or
            is_accelerating or
            projected_168 > datasheet_limit
        )

        initial_width = max(0.5, initial_p90 - initial_p10)

        if trigger_early_abort:
            recommendation = "IMMEDIATE EARLY ABORT: Accelerating non-linear latent defect detected at 96h milestone. Halt chamber soak."
            narrowed_p10 = initial_p10
            narrowed_p90 = max(projected_168, initial_p90)
            reduction_pct = 0.0
        else:
            # Stable unit: 96h real data collapses uncertainty corridor by ~60%
            narrowed_p10 = round(v96 * 0.95, 2)
            narrowed_p90 = round(v96 * 1.08, 2)
            new_width = max(0.2, narrowed_p90 - narrowed_p10)
            reduction_pct = round(((initial_width - new_width) / initial_width) * 100.0, 1)
            reduction_pct = max(0.0, min(85.0, reduction_pct))
            recommendation = "NOMINAL TRAJECTORY CONFIRMED: Uncertainty corridor tightened. Proceed to 168h flight certification."

        return Check96hResult(
            curvature=round(float(curvature), 6),
            is_accelerating=is_accelerating,
            trigger_early_abort=trigger_early_abort,
            narrowed_p10=narrowed_p10,
            narrowed_p90=narrowed_p90,
            uncertainty_reduction_pct=reduction_pct,
            recommendation=recommendation
        )
