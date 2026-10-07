"""
ISRO NIRIKSHAN AI-Driven Dynamic ESS Intelligence & Latent-Defect Risk Screening
Module A: Robust Statistics Engine
Calculates Median, Median Absolute Deviation (MAD), and Modified Z-scores
Formula: M_i = 0.6745 * (x_i - Median) / MAD
"""

from typing import List, Tuple, Union
import numpy as np


class RobustStatsEngine:
    """
    Computes outlier-resistant central tendency and dispersion metrics.
    Robust against high outlier contamination (up to 50% breakdown point).
    """

    EPSILON = 1e-6
    NORMAL_CONSISTENCY_CONSTANT = 0.6745

    @classmethod
    def calculate_median_and_mad(cls, values: Union[List[float], np.ndarray]) -> Tuple[float, float]:
        """
        Calculates median and MAD for a 1D array of electrical parametric measurements.
        """
        arr = np.asarray(values, dtype=np.float64)
        if len(arr) == 0:
            return 0.0, 1.0

        median = float(np.median(arr))
        abs_deviations = np.abs(arr - median)
        mad = float(np.median(abs_deviations))

        # Variance floor protection: If MAD == 0 due to discrete quantization,
        # fallback to robust average absolute deviation or minimum epsilon
        if mad < cls.EPSILON:
            mean_dev = float(np.mean(abs_deviations))
            mad = mean_dev if mean_dev > cls.EPSILON else cls.EPSILON

        return round(median, 4), round(mad, 4)

    @classmethod
    def calculate_modified_z_scores(
        cls,
        values: Union[List[float], np.ndarray],
        median_override: float = None,
        mad_override: float = None
    ) -> np.ndarray:
        """
        Calculates Boris Iglewicz & David Hoaglin Modified Z-scores.
        Values exceeding |M_i| > 3.5 are statistically rejected outliers.
        """
        arr = np.asarray(values, dtype=np.float64)
        if len(arr) == 0:
            return np.array([], dtype=np.float64)

        if median_override is not None and mad_override is not None:
            median = median_override
            mad = mad_override if mad_override > cls.EPSILON else cls.EPSILON
        else:
            median, mad = cls.calculate_median_and_mad(arr)

        modified_z = cls.NORMAL_CONSISTENCY_CONSTANT * (arr - median) / mad
        return np.round(modified_z, 3)

    @classmethod
    def score_single_value(cls, value: float, median: float, mad: float) -> float:
        """Score a single component against known population distribution."""
        effective_mad = mad if mad > cls.EPSILON else cls.EPSILON
        z = cls.NORMAL_CONSISTENCY_CONSTANT * (value - median) / effective_mad
        return round(float(z), 3)
