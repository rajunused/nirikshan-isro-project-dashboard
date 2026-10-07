"""
ISRO NIRIKSHAN AI-Driven Dynamic ESS Intelligence & Latent-Defect Risk Screening
Integration Tests: Full REST API End-to-End Screening Flow
"""

import pytest
from fastapi.testclient import TestClient


def test_health_check(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"


def test_list_lots_and_metrics(client: TestClient):
    # List lots
    lots_res = client.get("/api/v1/lots")
    assert lots_res.status_code == 200
    lots = lots_res.json()
    assert len(lots) >= 2
    lot_id = lots[0]

    # Metrics
    metrics_res = client.get(f"/api/v1/lots/{lot_id}/metrics?w_fn=5.0&slope=0.08")
    assert metrics_res.status_code == 200
    metrics = metrics_res.json()
    assert metrics["total_components"] >= 40
    assert metrics["accepted_count"] > 0
    assert metrics["rejected_count"] > 0


def test_components_query_and_filter(client: TestClient):
    # Query components
    res = client.get("/api/v1/components?lot_id=LOT-A / RAD-HARD LOGIC&verdict=REJECT")
    assert res.status_code == 200
    items = res.json()
    assert len(items) >= 1
    assert all(i["verdict"] == "REJECT" for i in items)


def test_module_a_robust_eval(client: TestClient):
    payload = {"values": [11.0, 11.2, 11.4, 11.3, 42.0]}
    res = client.post("/api/v1/module-a/evaluate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["outliers_count"] == 1
    assert data["outliers_indices"] == [4]


def test_module_b_trajectory_forecast(client: TestClient):
    res = client.get("/api/v1/module-b/forecast/COMP-4089?slope_threshold=0.08")
    assert res.status_code == 200
    data = res.json()
    assert data["component_id"] == "COMP-4089"
    assert data["predicted_168h_p50"] > 30.0
    assert data["is_safe"] is False


def test_dynamic_96h_injection(client: TestClient):
    payload = {"component_id": "COMP-4104", "v96_value": 13.5}
    res = client.post("/api/v1/recalibration/96h-inject", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["component_id"] == "COMP-4104"
    assert "curvature" in data


def test_fusion_screen_lot_and_explain(client: TestClient):
    # Screen lot
    screen_payload = {
        "lot_id": "LOT-A / RAD-HARD LOGIC",
        "false_negative_penalty_w_fn": 6.5,
        "safety_slope_threshold": 0.08,
        "use_historical_baseline": True
    }
    res = client.post("/api/v1/fusion/screen-lot", json=screen_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["total_screened"] == 40
    assert "applied_thresholds" in data

    # Explain COMP-4089
    exp_res = client.get("/api/v1/fusion/explain/COMP-4089?w_fn=6.5")
    assert exp_res.status_code == 200
    exp_data = exp_res.json()
    assert exp_data["reason_code"] is not None
    assert len(exp_data["feature_attributions"]) > 0


def test_ncr_pdf_generation_and_disposition(client: TestClient):
    # Commit disposition
    disp_payload = {
        "component_id": "COMP-4089",
        "status": "REJECT",
        "inspector_id": "ISRO-QA-CHIEF",
        "notes": "Verified accelerating gate oxide runaway."
    }
    disp_res = client.post("/api/v1/audit/disposition", json=disp_payload)
    assert disp_res.status_code == 200

    # Download NCR PDF
    ncr_res = client.get("/api/v1/audit/ncr/COMP-4089?inspector_id=ISRO-QA-CHIEF")
    assert ncr_res.status_code == 200
    assert ncr_res.headers["content-type"] == "application/pdf"
    assert "x-report-sha256" in ncr_res.headers
    assert len(ncr_res.content) > 100


def test_chamber_telemetry_state(client: TestClient):
    res = client.get("/api/v1/telemetry/chamber-state")
    assert res.status_code == 200
    data = res.json()
    assert data["chamber_id"] == "VSSC-TC-04"
    assert 124.0 <= data["actual_temp_c"] <= 126.0
