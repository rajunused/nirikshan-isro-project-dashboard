"""
ISRO NIRIKSHAN AI-Driven Dynamic ESS Intelligence & Latent-Defect Risk Screening
Module B: Trajectory Forecaster & Monte Carlo Simulation Engine
Calculates 0h + 24h to 168h drift rate and synthesizes stochastic flight degradation paths
"""

from dataclasses import dataclass
from typing import Dict, List, Optional
import numpy as np

from app.engine.module_b.quantile_regressor import QuantileRegressorEngine, QuantilePrediction


@dataclass
class TrajectoryForecastResult:
    predicted_168h_p50: float
    predicted_168h_p10: float
    predicted_168h_p90: float
    drift_rate_ua_h: float
    is_accelerating: bool
    trajectory_points: List[Dict[str, float]]


class TrajectoryForecaster:
    """
    Simulates and projects time-series degradation paths across 0h, 24h, 96h, and 168h milestones.
    """

    def __init__(self):
        self.regressor = QuantileRegressorEngine()

    def forecast_trajectory(
        self,
        v0: float,
        v24: float,
        v96: Optional[float] = None,
        v168_actual: Optional[float] = None
    ) -> TrajectoryForecastResult:
        """
        Calculates predicted 168h value and nominal drift rate (µA/h).
        """
        qp = self.regressor.predict_168h_quantiles(v0, v24)
        pred_168 = qp.p50

        # Drift rate = (Predicted_V168 - V0) / 168
        drift_rate = (pred_168 - v0) / 168.0

        # Trajectory curve interpolation
        points = [
            {"hour": 0, "actual": v0, "forecast": v0, "p10": v0, "p90": v0},
            {"hour": 24, "actual": v24, "forecast": v24, "p10": max(0.0, v24 - 1.2), "p90": v24 + 1.2},
            {
                "hour": 96,
                "actual": v96,
                "forecast": round(v0 + drift_rate * 96, 2),
                "p10": round(qp.p10 * 0.7 + v0 * 0.3, 2),
                "p90": round(qp.p90 * 0.7 + v0 * 0.3, 2)
            },
            {
                "hour": 168,
                "actual": v168_actual,
                "forecast": pred_168,
                "p10": qp.p10,
                "p90": qp.p90
            }
        ]

        is_accel = False
        if v96 is not None:
            # Check 24-to-96 acceleration vs 0-to-24
            rate_early = (v24 - v0) / 24.0
            rate_mid = (v96 - v24) / 72.0
            if rate_mid > (rate_early * 1.5) and rate_mid > 0.05:
                is_accel = True

        return TrajectoryForecastResult(
            predicted_168h_p50=pred_168,
            predicted_168h_p10=qp.p10,
            predicted_168h_p90=qp.p90,
            drift_rate_ua_h=round(drift_rate, 4),
            is_accelerating=is_accel,
            trajectory_points=points
        )

    def generate_monte_carlo_runs(
        self,
        v0: float,
        v24: float,
        num_simulations: int = 20,
        seed: int = 42
    ) -> List[List[float]]:
        """
        Executes N Monte Carlo stochastic brownian drift simulations for flight assurance envelopes.
        """
        rng = np.random.default_rng(seed)
        delta_24 = v24 - v0
        base_slope = delta_24 / 24.0

        simulations = []
        hours = [0, 24, 96, 168]

        for _ in range(num_simulations):
            path = [v0, v24]
            # Stochastic variance for 96h and 168h
            noise_96 = rng.normal(0, 1.4)
            slope_perturb = base_slope * rng.uniform(0.85, 1.25)
            v96_sim = max(1.0, v24 + slope_perturb * 72.0 + noise_96)

            noise_168 = rng.normal(0, 2.2)
            v168_sim = max(1.0, v96_sim + slope_perturb * 72.0 + noise_168)

            path.extend([round(float(v96_sim), 2), round(float(v168_sim), 2)])
            simulations.append(path)

        return simulations
