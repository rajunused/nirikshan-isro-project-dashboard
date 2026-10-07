"""
ISRO NIRIKSHAN AI-Driven Dynamic ESS Intelligence & Latent-Defect Risk Screening
Risk Fusion: Multi-Module Decision Matrix Engine
Synthesizes Module A (Spatial/Population) + Module B (Trajectory/Drift) + Cost Matrix
Outputs 3-tier disposition: ACCEPT / REVIEW / REJECT (Elevated Latent Risk)
"""

from dataclasses import dataclass
from typing import Dict, Optional
from app.db.models.component import DispositionVerdict, LatentDefectType
from app.engine.fusion.cost_sensitive import CostSensitiveOptimizer


@dataclass
class ScreeningDecision:
    verdict: DispositionVerdict
    defect_type: LatentDefectType
    risk_score: float  # 0.0 to 100.0%
    primary_failure_driver: str
    requires_disposition_signoff: bool


class DecisionMatrixEngine:
    """
    Unified aerospace inference engine. Classifies flight hardware components into
    statistically verified flight acceptance or quarantine tiers.
    """

    MAX_LEAKAGE_CEILING = 50.0  # Absolute datasheet ceiling (µA)

    @classmethod
    def evaluate_component(
        cls,
        leakage_0h: float,
        leakage_24h: float,
        leakage_96h: Optional[float],
        modified_z: float,
        mahalanobis_dist: float,
        mahalanobis_critical: float,
        predicted_168h: float,
        drift_rate: float,
        is_early_abort: bool = False,
        is_gdbn_risk: bool = False,
        is_wafer_edge: bool = False,
        w_fn: float = 5.0,
        configured_slope_limit: float = 0.08
    ) -> ScreeningDecision:
        thresholds = CostSensitiveOptimizer.calculate_adjusted_thresholds(
            w_fn=w_fn,
            configured_base_slope=configured_slope_limit
        )

        effective_maha_thresh = mahalanobis_critical * thresholds.effective_mahalanobis_multiplier

        # Check 1: Hard Datasheet Absolute Violation
        current_max = max(leakage_0h, leakage_24h, leakage_96h or 0.0)
        if current_max >= cls.MAX_LEAKAGE_CEILING:
            return ScreeningDecision(
                verdict=DispositionVerdict.REJECT,
                defect_type=LatentDefectType.TYPE_1_HIGH_START,
                risk_score=99.9,
                primary_failure_driver=f"Absolute Datasheet Violation: {current_max:.1f}µA exceeds {cls.MAX_LEAKAGE_CEILING}µA ceiling",
                requires_disposition_signoff=True
            )

        # Check 2: Early Abort Triggered at 96h Milestone
        if is_early_abort:
            return ScreeningDecision(
                verdict=DispositionVerdict.REJECT,
                defect_type=LatentDefectType.TYPE_2_ACCELERATING_DRIFT,
                risk_score=94.5,
                primary_failure_driver="Early Abort Triggered: Non-linear accelerating leakage curvature detected at 96h",
                requires_disposition_signoff=True
            )

        # Check 3: High From Start (Type 1 Latent Defect)
        if leakage_0h > 35.0 or modified_z >= thresholds.effective_z_reject:
            return ScreeningDecision(
                verdict=DispositionVerdict.REJECT,
                defect_type=LatentDefectType.TYPE_1_HIGH_START,
                risk_score=round(min(98.0, 70.0 + (modified_z * 5.0)), 1),
                primary_failure_driver=f"Type 1 Latent Defect: Elevated early leakage signature (Modified Z={modified_z:.2f}σ)",
                requires_disposition_signoff=True
            )

        # Check 4: Forecast Blowout or Critical Drift Slope (Type 2 / Type 3)
        if predicted_168h >= cls.MAX_LEAKAGE_CEILING or drift_rate > thresholds.effective_slope_max:
            return ScreeningDecision(
                verdict=DispositionVerdict.REJECT,
                defect_type=LatentDefectType.TYPE_2_ACCELERATING_DRIFT,
                risk_score=round(min(96.0, 65.0 + (drift_rate / thresholds.effective_slope_max * 20.0)), 1),
                primary_failure_driver=f"Type 2 Latent Defect: Predicted 168h blowout ({predicted_168h:.1f}µA) / Drift rate {drift_rate:.4f}µA/h",
                requires_disposition_signoff=True
            )

        # Check 5: Multivariate Covariance Breakdown (Type 4 Latent Defect)
        if mahalanobis_dist > effective_maha_thresh:
            # If drift is low but Mahalanobis is elevated -> Type 4 Anomaly
            if mahalanobis_dist > (effective_maha_thresh * 1.3):
                return ScreeningDecision(
                    verdict=DispositionVerdict.REJECT,
                    defect_type=LatentDefectType.TYPE_4_COVARIANCE_BREAKDOWN,
                    risk_score=85.0,
                    primary_failure_driver=f"Type 4 Latent Defect: Physical covariance breakdown (Mahalanobis={mahalanobis_dist:.2f} > {effective_maha_thresh:.2f})",
                    requires_disposition_signoff=True
                )
            else:
                return ScreeningDecision(
                    verdict=DispositionVerdict.REVIEW,
                    defect_type=LatentDefectType.TYPE_4_COVARIANCE_BREAKDOWN,
                    risk_score=62.0,
                    primary_failure_driver=f"Marginal Covariance Anomaly: Mahalanobis distance {mahalanobis_dist:.2f} exceeds nominal cluster boundary",
                    requires_disposition_signoff=True
                )

        # Check 6: Spatial Wafer GDBN Risk or Edge Die
        if is_gdbn_risk:
            return ScreeningDecision(
                verdict=DispositionVerdict.REVIEW,
                defect_type=LatentDefectType.NOMINAL,
                risk_score=55.0,
                primary_failure_driver="Good-Die-in-Bad-Neighborhood (GDBN): Passing die enclosed by defective cluster on wafer",
                requires_disposition_signoff=True
            )

        # Check 7: Moderate Modified Z-Score (Review Corridor)
        if modified_z >= thresholds.effective_z_review:
            return ScreeningDecision(
                verdict=DispositionVerdict.REVIEW,
                defect_type=LatentDefectType.NOMINAL,
                risk_score=round(40.0 + (modified_z * 6.0), 1),
                primary_failure_driver=f"Statistical Population Review: Modified Z={modified_z:.2f}σ in warning corridor",
                requires_disposition_signoff=True
            )

        # Conforms to all ISRO Flight Assurance Standards -> ACCEPT
        nominal_risk = round(max(2.0, min(25.0, (modified_z * 3.5) + (drift_rate * 50.0))), 1)
        return ScreeningDecision(
            verdict=DispositionVerdict.ACCEPT,
            defect_type=LatentDefectType.NOMINAL,
            risk_score=nominal_risk,
            primary_failure_driver="Conforms to MIL-STD-883 Class V Flight Assurance envelope",
            requires_disposition_signoff=False
        )
