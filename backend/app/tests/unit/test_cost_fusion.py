"""
ISRO NIRIKSHAN AI-Driven Dynamic ESS Intelligence & Latent-Defect Risk Screening
Unit Tests: Cost-Sensitive Optimization & Decision Matrix Fusion
"""

import pytest
from app.engine.fusion.cost_sensitive import CostSensitiveOptimizer
from app.engine.fusion.decision_matrix import DecisionMatrixEngine
from app.db.models.component import DispositionVerdict, LatentDefectType


def test_cost_sensitive_threshold_tightening():
    # Commercial w_fn = 1.0 vs ISRO Flight Assurance w_fn = 10.0
    thresh_commercial = CostSensitiveOptimizer.calculate_adjusted_thresholds(w_fn=1.0)
    thresh_isro = CostSensitiveOptimizer.calculate_adjusted_thresholds(w_fn=10.0)

    # Flight assurance must have strictly tighter thresholds (lower allowable deviation)
    assert thresh_isro.effective_z_reject < thresh_commercial.effective_z_reject
    assert thresh_isro.effective_z_review < thresh_commercial.effective_z_review
    assert thresh_isro.effective_slope_max < thresh_commercial.effective_slope_max


def test_decision_matrix_nominal_accept():
    decision = DecisionMatrixEngine.evaluate_component(
        leakage_0h=11.2,
        leakage_24h=11.5,
        leakage_96h=12.0,
        modified_z=0.45,
        mahalanobis_dist=1.8,
        mahalanobis_critical=3.8,
        predicted_168h=13.2,
        drift_rate=0.012,
        w_fn=5.0
    )
    assert decision.verdict == DispositionVerdict.ACCEPT
    assert decision.defect_type == LatentDefectType.NOMINAL
    assert decision.requires_disposition_signoff is False


def test_decision_matrix_accelerating_drift_reject():
    decision = DecisionMatrixEngine.evaluate_component(
        leakage_0h=10.0,
        leakage_24h=14.2,
        leakage_96h=26.5,
        modified_z=5.4,
        mahalanobis_dist=2.8,
        mahalanobis_critical=3.8,
        predicted_168h=48.2,
        drift_rate=0.22,
        is_early_abort=True,
        w_fn=5.0
    )
    assert decision.verdict == DispositionVerdict.REJECT
    assert decision.defect_type == LatentDefectType.TYPE_2_ACCELERATING_DRIFT
    assert decision.risk_score > 90.0
    assert decision.requires_disposition_signoff is True


def test_decision_matrix_type4_covariance_breakdown():
    # Normal 1D leakage and slope, but extreme Mahalanobis distance
    decision = DecisionMatrixEngine.evaluate_component(
        leakage_0h=11.8,
        leakage_24h=12.2,
        leakage_96h=12.8,
        modified_z=1.2,
        mahalanobis_dist=5.9,
        mahalanobis_critical=3.8,
        predicted_168h=14.1,
        drift_rate=0.015,
        w_fn=5.0
    )
    assert decision.verdict == DispositionVerdict.REJECT
    assert decision.defect_type == LatentDefectType.TYPE_4_COVARIANCE_BREAKDOWN
    assert decision.requires_disposition_signoff is True
