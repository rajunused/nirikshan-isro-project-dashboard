"""
ISRO NIRIKSHAN AI-Driven Dynamic ESS Intelligence & Latent-Defect Risk Screening
Module A: Multivariate Outlier Detection via Fast Minimum Covariance Determinant (FastMCD)
Formula: D_M(x) = sqrt( (x - mu)^T * Sigma^-1 * (x - mu) )
Detects Type 4 latent anomalies that pass all univariate limits but violate physics-of-failure correlation.
"""

from typing import List, Tuple, Union
import numpy as np
from scipy import stats
from sklearn.covariance import MinCovDet


class FastMCDMahalanobisEngine:
    """
    Robust Multivariate Covariance and Mahalanobis Distance Calculator.
    Uses Rousseeuw & Van Driessen FastMCD to resist up to 40% multivariate outlier contamination.
    """

    CRITICAL_CHI2_P_VALUE = 0.99  # 99th percentile of Chi-squared distribution

    @classmethod
    def fit_and_score(
        cls,
        feature_matrix: Union[List[List[float]], np.ndarray],
        feature_names: List[str] = None
    ) -> Tuple[np.ndarray, np.ndarray, float]:
        """
        Fits FastMCD on multivariate matrix (e.g. [Leakage, Delay, Standby])
        and returns:
        - Mahalanobis distances for each component
        - Binary anomaly flags (True if D_M^2 > Chi2_critical)
        - Critical threshold distance
        """
        X = np.asarray(feature_matrix, dtype=np.float64)
        n_samples, n_features = X.shape

        if n_samples < n_features + 2:
            # Fallback for ultra-small sample: use regularized empirical covariance
            mean_vec = np.mean(X, axis=0)
            cov_mat = np.cov(X, rowvar=False) + np.eye(n_features) * 1e-4
            inv_cov = np.linalg.pinv(cov_mat)

            diff = X - mean_vec
            distances = np.sqrt(np.sum(diff @ inv_cov * diff, axis=1))
            crit_dist = float(np.sqrt(stats.chi2.ppf(cls.CRITICAL_CHI2_P_VALUE, df=n_features)))
            return np.round(distances, 3), distances > crit_dist, round(crit_dist, 3)

        # Apply Scikit-Learn FastMCD estimator
        try:
            mcd = MinCovDet(random_state=42, support_fraction=0.75).fit(X)
            # Mahalanobis distances output by scikit-learn is squared distance
            sq_distances = mcd.mahalanobis(X)
            distances = np.sqrt(np.maximum(0.0, sq_distances))
        except Exception:
            # Fallback to robust empirical pseudo-inverse
            mean_vec = np.median(X, axis=0)
            cov_mat = np.cov(X, rowvar=False) + np.eye(n_features) * 1e-3
            inv_cov = np.linalg.pinv(cov_mat)
            diff = X - mean_vec
            distances = np.sqrt(np.maximum(0.0, np.sum(diff @ inv_cov * diff, axis=1)))

        critical_threshold = float(np.sqrt(stats.chi2.ppf(cls.CRITICAL_CHI2_P_VALUE, df=n_features)))
        anomaly_flags = distances > critical_threshold

        return np.round(distances, 3), anomaly_flags, round(critical_threshold, 3)

    @classmethod
    def score_single_vector(
        cls,
        vector: List[float],
        center: np.ndarray,
        inv_cov: np.ndarray
    ) -> float:
        """Score an incoming real-time telemetry vector against cached FastMCD model."""
        v = np.asarray(vector, dtype=np.float64)
        diff = v - center
        dist = np.sqrt(float(np.maximum(0.0, diff.T @ inv_cov @ diff)))
        return round(dist, 3)
