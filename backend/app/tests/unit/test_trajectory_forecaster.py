"""
ISRO NIRIKSHAN AI-Driven Dynamic ESS Intelligence & Latent-Defect Risk Screening
Unit Tests: Module B Trajectory Prognostics, Quantile Regressor & 96h Early-Abort
"""

import pytest
from app.engine.module_b.quantile_regressor import QuantileRegressorEngine
from app.engine.module_b.trajectory_forecaster import TrajectoryForecaster
from app.engine.module_b.safety_slope import SafetySlopeComparator
from app.engine.module_b.check_96h import Dynamic96hEngine


def test_quantile_regressor_intervals():
    reg = QuantileRegressorEngine()
    pred = reg.predict_168h_quantiles(v0=10.0, v24=11.2)
    assert pred.p10 < pred.p50 < pred.p90
    assert pred.corridor_width > 0.0


def test_trajectory_forecaster_drift_rate():
    forecaster = TrajectoryForecaster()
    res = forecaster.forecast_trajectory(v0=10.0, v24=14.2)
    assert res.predicted_168h_p50 > 10.0
    assert res.drift_rate_ua_h > 0.0
    assert len(res.trajectory_points) == 4


def test_safety_slope_comparator():
    # Nominal drift 0.02 vs threshold 0.08
    nominal_eval = SafetySlopeComparator.evaluate_slope(drift_rate_ua_h=0.02, threshold_slope_ua_h=0.08)
    assert nominal_eval.is_safe is True

    # Runaway drift 0.22 vs threshold 0.08
    runaway_eval = SafetySlopeComparator.evaluate_slope(drift_rate_ua_h=0.22, threshold_slope_ua_h=0.08)
    assert runaway_eval.is_safe is False
    assert runaway_eval.slope_ratio > 1.5


def test_dynamic_96h_curvature_early_abort():
    # Accelerating runaway: v0=10.0, v24=14.2, v96=38.5
    res_abort = Dynamic96hEngine.evaluate_96h_checkpoint(
        v0=10.0, v24=14.2, v96=38.5, initial_p10=18.0, initial_p90=32.0
    )
    assert res_abort.trigger_early_abort is True
    assert res_abort.is_accelerating is True
    assert "EARLY ABORT" in res_abort.recommendation

    # Nominal stable: v0=10.0, v24=11.0, v96=12.2
    res_stable = Dynamic96hEngine.evaluate_96h_checkpoint(
        v0=10.0, v24=11.0, v96=12.2, initial_p10=8.0, initial_p90=16.0
    )
    assert res_stable.trigger_early_abort is False
    assert res_stable.uncertainty_reduction_pct > 0.0
