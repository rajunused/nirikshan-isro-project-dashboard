"""
ISRO NIRIKSHAN AI-Driven Dynamic ESS Intelligence & Latent-Defect Risk Screening
Unit Tests: Module A FastMCD Mahalanobis Covariance Inversion
"""

import pytest
import numpy as np
from app.engine.module_a.mahalanobis import FastMCDMahalanobisEngine


def test_fastmcd_mahalanobis_detection(sample_multivariate_data):
    distances, flags, crit_thresh = FastMCDMahalanobisEngine.fit_and_score(sample_multivariate_data)
    assert len(distances) == len(sample_multivariate_data)
    assert crit_thresh > 0.0

    # The last point [11.0, 3.4] is a Type 4 anomaly breaking the covariance structure
    assert distances[-1] > distances[0]
    assert distances[-1] > crit_thresh or distances[-1] >= 3.0


def test_fastmcd_small_sample_fallback():
    # Only 3 samples in 2D space
    small_data = [[11.0, 1.8], [11.5, 1.9], [12.0, 2.0]]
    distances, flags, crit = FastMCDMahalanobisEngine.fit_and_score(small_data)
    assert len(distances) == 3
    assert not np.isnan(distances).any()
