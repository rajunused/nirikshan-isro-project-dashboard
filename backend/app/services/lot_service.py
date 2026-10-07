"""
ISRO NIRIKSHAN AI-Driven Dynamic ESS Intelligence & Latent-Defect Risk Screening
Aerospace Flight Data Repository & State Manager
Provides synchronized access to flight lots, component telemetry, and screening state.
"""

import math
from typing import Dict, List, Optional, Tuple, Union
import numpy as np

from app.db.models.component import DispositionVerdict, LatentDefectType
from app.engine.module_a.robust_stats import RobustStatsEngine
from app.engine.module_a.hierarchical import HierarchicalBaselineEngine
from app.engine.module_a.mahalanobis import FastMCDMahalanobisEngine
from app.engine.module_a.spatial_wafer import WaferSpatialEngine
from app.engine.module_b.trajectory_forecaster import TrajectoryForecaster
from app.engine.module_b.check_96h import Dynamic96hEngine
from app.engine.fusion.decision_matrix import DecisionMatrixEngine


class FlightDataRepository:
    """
    Central repository for flight lots. Seeded with qualified MIL-STD-883 Class V datasets.
    Supports dynamic ingestion, re-evaluation, and disposition updates.
    """

    def __init__(self):
        self.lots: Dict[str, Dict] = {}
        self.components: Dict[str, Dict] = {}
        self.dispositions: Dict[str, Dict] = {}
        self.ncr_archive: Dict[str, Dict] = {}
        self._seed_default_lots()

    def _seed_default_lots(self):
        """Seed realistic flight screening lots modeled from ISRO cleanroom standards."""
        # LOT-A: RAD-HARD LOGIC (40 components)
        lot_a_id = "LOT-A / RAD-HARD LOGIC"
        self.lots[lot_a_id] = {
            "id": lot_a_id,
            "device_family": "RH-LOGIC-01",
            "chamber_id": "VSSC-TC-04",
            "status": "SCREENING_ACTIVE",
            "qualification_level": "MIL-STD-883_CLASS_V"
        }

        # 4 Seeded Injected Latent Defects + 36 Nominal units
        comps_a = [
            {
                "id": "COMP-4011",
                "type": "TYPE_1_HIGH_START",
                "baseline": [42.0, 42.4, 43.1, 44.8],
                "delay": 1.82,
                "x": -2, "y": 3,
                "driver": "Elevated early leakage signature (Gate-oxide trap)"
            },
            {
                "id": "COMP-4089",
                "type": "TYPE_2_ACCELERATING_DRIFT",
                "baseline": [10.0, 14.2, 26.5, 47.8],
                "delay": 2.94,
                "x": 3, "y": 2,
                "driver": "Accelerating non-linear leakage drift under 125°C HTOL"
            },
            {
                "id": "COMP-4104",
                "type": "TYPE_3_LATE_ONSET",
                "baseline": [11.0, 12.3, 13.5, 31.6],
                "delay": 2.15,
                "x": 1, "y": -4,
                "driver": "96h trajectory delta check: Latent channel trap creation"
            },
            {
                "id": "COMP-4150",
                "type": "TYPE_4_COVARIANCE_BREAKDOWN",
                "baseline": [12.0, 12.8, 14.1, 18.4],
                "delay": 3.42,
                "x": -4, "y": 1,
                "driver": "Abnormal Iddq-to-delay covariance (Breaks physical correlation)"
            }
        ]

        # 36 Nominal Units
        for i in range(36):
            comp_id = f"COMP-{4201 + i}"
            base_0 = round(10.0 + (i % 5) * 0.4, 1)
            base_24 = round(11.0 + (i % 4) * 0.3, 1)
            base_96 = round(12.0 + (i % 6) * 0.3, 1)
            base_168 = round(13.0 + (i % 7) * 0.25, 1)
            delay = round(1.70 + (i % 7) * 0.08, 2)
            angle = (2 * math.pi / 36) * i
            r = 1.5 + (i % 4) * 1.1
            x = int(round(r * math.cos(angle)))
            y = int(round(r * math.sin(angle)))

            comps_a.append({
                "id": comp_id,
                "type": "NOMINAL",
                "baseline": [base_0, base_24, base_96, base_168],
                "delay": delay,
                "x": x, "y": y,
                "driver": "Stable within historical flight envelope"
            })

        for c in comps_a:
            c["lot_id"] = lot_a_id
            self.components[c["id"]] = c

        # LOT-B: POWER CONTROL
        lot_b_id = "LOT-B / POWER CONTROL"
        self.lots[lot_b_id] = {
            "id": lot_b_id,
            "device_family": "RH-PMIC-33",
            "chamber_id": "VSSC-TC-02",
            "status": "SCREENING_ACTIVE",
            "qualification_level": "ISRO_SPACE_CLASS_S"
        }

        comps_b = [
            {
                "id": "PWR-7102",
                "type": "TYPE_2_ACCELERATING_DRIFT",
                "baseline": [14.0, 18.2, 29.1, 52.4],
                "delay": 3.12, "x": -1, "y": 3,
                "driver": "Thermal dissipation junction breakdown"
            },
            {
                "id": "PWR-7145",
                "type": "TYPE_1_HIGH_START",
                "baseline": [38.0, 39.1, 41.0, 44.5],
                "delay": 2.80, "x": 2, "y": -2,
                "driver": "Gate leakage impedance degradation"
            },
            {
                "id": "PWR-7198",
                "type": "TYPE_4_COVARIANCE_BREAKDOWN",
                "baseline": [13.0, 13.6, 14.8, 17.2],
                "delay": 3.55, "x": -3, "y": -2,
                "driver": "Uncorrelated high delay with low Iddq"
            }
        ]

        for i in range(37):
            comp_id = f"PWR-{7201 + i}"
            base_0 = round(11.0 + (i % 4) * 0.5, 1)
            base_24 = round(12.0 + (i % 5) * 0.4, 1)
            base_96 = round(13.0 + (i % 3) * 0.5, 1)
            base_168 = round(14.0 + (i % 6) * 0.3, 1)
            delay = round(1.85 + (i % 5) * 0.09, 2)
            angle = (2 * math.pi / 37) * i
            r = 1.5 + (i % 4) * 1.2
            x = int(round(r * math.cos(angle)))
            y = int(round(r * math.sin(angle)))

            comps_b.append({
                "id": comp_id,
                "type": "NOMINAL",
                "baseline": [base_0, base_24, base_96, base_168],
                "delay": delay,
                "x": x, "y": y,
                "driver": "Conforms to MIL-STD-883 class V"
            })

        for c in comps_b:
            c["lot_id"] = lot_b_id
            self.components[c["id"]] = c

    def get_lot_components(self, lot_id: str) -> List[Dict]:
        return [c for c in self.components.values() if c["lot_id"] == lot_id]

    def screen_lot(
        self,
        lot_id: str,
        w_fn: float = 5.0,
        slope_threshold: float = 0.08,
        use_historical_baseline: bool = True
    ) -> List[Dict]:
        """
        Executes unified screening pipeline: Module A + Module B + Fusion.
        """
        comps = self.get_lot_components(lot_id)
        if not comps:
            return []

        # 1. Module A: Population Baseline (Hierarchical Blending)
        v24_values = [c["baseline"][1] for c in comps]
        if use_historical_baseline:
            blended = HierarchicalBaselineEngine.blend_lot_baseline(v24_values)
            median_val = blended.median_effective
            mad_val = blended.mad_effective
        else:
            median_val, mad_val = RobustStatsEngine.calculate_median_and_mad(v24_values)

        # 2. Module A: FastMCD Covariance Matrix
        feature_matrix = [[c["baseline"][1], c["delay"]] for c in comps]
        maha_dists, _, maha_crit = FastMCDMahalanobisEngine.fit_and_score(feature_matrix)

        # 3. Module A: Spatial GDBN
        die_list = [
            {"id": c["id"], "x": c["x"], "y": c["y"], "is_anomaly": "TYPE" in c.get("type", "")}
            for c in comps
        ]
        spatial_infos = {s.component_id: s for s in WaferSpatialEngine.evaluate_gdbn_clusters(die_list)}

        # 4. Forecaster instance
        forecaster = TrajectoryForecaster()

        screened = []
        for i, c in enumerate(comps):
            v0 = c["baseline"][0]
            v24 = c["baseline"][1]
            v96 = c["baseline"][2] if len(c["baseline"]) > 2 else None
            v168_actual = c["baseline"][3] if len(c["baseline"]) > 3 else None

            # Calculate individual Modified Z-score
            mod_z = RobustStatsEngine.score_single_value(v24, median_val, mad_val)
            maha_d = float(maha_dists[i]) if i < len(maha_dists) else 2.0

            # Module B forecast
            fc = forecaster.forecast_trajectory(v0, v24, v96, v168_actual)

            # 96h Early Abort Check
            is_early_abort = False
            if v96 is not None:
                check96 = Dynamic96hEngine.evaluate_96h_checkpoint(v0, v24, v96, fc.predicted_168h_p10, fc.predicted_168h_p90)
                is_early_abort = check96.trigger_early_abort

            sp_info = spatial_infos.get(c["id"])
            is_gdbn = sp_info.gdbn_risk_flag if sp_info else False
            is_edge = sp_info.is_edge if sp_info else False

            # Fusion Decision
            decision = DecisionMatrixEngine.evaluate_component(
                leakage_0h=v0,
                leakage_24h=v24,
                leakage_96h=v96,
                modified_z=mod_z,
                mahalanobis_dist=maha_d,
                mahalanobis_critical=maha_crit,
                predicted_168h=fc.predicted_168h_p50,
                drift_rate=fc.drift_rate_ua_h,
                is_early_abort=is_early_abort,
                is_gdbn_risk=is_gdbn,
                is_wafer_edge=is_edge,
                w_fn=w_fn,
                configured_slope_limit=slope_threshold
            )

            # Check for QA disposition override
            disp_override = self.dispositions.get(c["id"])
            final_verdict = disp_override["status"] if disp_override else decision.verdict.value

            screened.append({
                "id": str(c["id"]),
                "lot_id": str(lot_id),
                "wafer_x": int(c["x"]),
                "wafer_y": int(c["y"]),
                "is_edge": bool(is_edge),
                "baseline_0h": float(v0),
                "leakage_24h": float(v24),
                "leakage_96h": float(v96) if v96 is not None else None,
                "forecast_168h": float(fc.predicted_168h_p50),
                "p10": float(fc.predicted_168h_p10),
                "p90": float(fc.predicted_168h_p90),
                "modified_z_score": float(mod_z),
                "mahalanobis_distance": float(maha_d),
                "drift_rate_ua_h": float(fc.drift_rate_ua_h),
                "verdict": str(final_verdict),
                "defect_type": str(decision.defect_type.value),
                "risk_score": float(decision.risk_score),
                "failure_mode": str(decision.primary_failure_driver)
            })

        return screened


# Singleton repository instance
flight_repo = FlightDataRepository()
