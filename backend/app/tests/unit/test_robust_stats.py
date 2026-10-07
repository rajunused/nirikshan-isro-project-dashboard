"""
ISRO NIRIKSHAN AI-Driven Dynamic ESS Intelligence & Latent-Defect Risk Screening
Unit Tests: Module A Robust Statistics & Hierarchical Blending
"""

import pytest
import numpy as np
from app.engine.module_a.robust_stats import RobustStatsEngine
from app.engine.module_a.hierarchical import HierarchicalBaselineEngine


def test_median_and_mad_calculation(sample_nominal_measurements):
    med, mad = RobustStatsEngine.calculate_median_and_mad(sample_nominal_measurements)
    assert 11.2 <= med <= 11.5
    assert mad > 0.0
    assert mad < 1.0


def test_modified_z_scores_outlier_rejection(sample_contaminated_measurements):
    z_scores = RobustStatsEngine.calculate_modified_z_scores(sample_contaminated_measurements)
    assert len(z_scores) == len(sample_contaminated_measurements)
    # The two contaminated outliers (42.0 and 45.0) should have |Modified Z| > 3.5
    assert z_scores[-1] > 3.5
    assert z_scores[-2] > 3.5
    # Nominal items should have low Modified Z
    assert z_scores[0] < 2.0


def test_hierarchical_blending_small_lot():
    small_lot = [11.2, 11.5, 11.8, 11.4, 11.6]  # N = 5 (< 15)
    blended = HierarchicalBaselineEngine.blend_lot_baseline(
        small_lot,
        historical_median=11.40,
        historical_mad=1.15
    )
    assert blended.is_blended is True
    assert blended.lot_size_n == 5
    assert blended.lot_weight == round(5 / 15.0, 3)
    assert blended.historical_weight == round(1.0 - (5 / 15.0), 3)
    assert blended.mad_effective > 0.0


def test_hierarchical_blending_large_lot():
    large_lot = [11.0 + (i % 4) * 0.2 for i in range(25)]  # N = 25 (>= 15)
    blended = HierarchicalBaselineEngine.blend_lot_baseline(large_lot)
    assert blended.is_blended is False
    assert blended.lot_weight == 1.0
    assert blended.historical_weight == 0.0
