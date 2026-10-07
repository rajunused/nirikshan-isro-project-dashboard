"""
ISRO NIRIKSHAN AI-Driven Dynamic ESS Intelligence & Latent-Defect Risk Screening
Pytest Configuration & Shared Fixtures
"""

import sys
import os
import pytest
from typing import Dict, List
from fastapi.testclient import TestClient

# Ensure backend root is on Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.main import app
from app.services.lot_service import flight_repo


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def sample_nominal_measurements() -> List[float]:
    return [11.2, 11.4, 11.1, 11.5, 11.3, 11.6, 11.2, 11.4, 11.3, 11.5, 11.4, 11.2]


@pytest.fixture
def sample_contaminated_measurements() -> List[float]:
    # 10 nominal parts (~11.4 uA) + 2 high outliers (42.0 uA and 45.0 uA)
    return [11.2, 11.4, 11.1, 11.5, 11.3, 11.6, 11.2, 11.4, 11.3, 11.5, 42.0, 45.0]


@pytest.fixture
def sample_multivariate_data() -> List[List[float]]:
    import numpy as np
    rng = np.random.default_rng(42)
    mean = [11.4, 1.80]
    cov = [[1.2, 0.15], [0.15, 0.08]]
    pts = rng.multivariate_normal(mean, cov, size=30).tolist()
    data = [[round(p[0], 2), round(p[1], 2)] for p in pts]
    # Add Type 4 anomaly: nominal leakage (11.4) with severe delay decoupling (3.85)
    data.append([11.4, 3.85])
    return data
