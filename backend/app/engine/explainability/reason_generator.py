"""
ISRO NIRIKSHAN AI-Driven Dynamic ESS Intelligence & Latent-Defect Risk Screening
Explainability: Deterministic Aerospace Reason Generator
Translates algorithmic metrics into MIL-STD-883 Class V QA rationale codes
"""

from typing import Dict, List, Optional
from app.db.models.component import DispositionVerdict, LatentDefectType


class AerospaceReasonGenerator:
    """
    Produces standardized aerospace engineering rationale and failure signature codes
    conforming to ISRO Space Grade Cleanroom Non-Conformance Reporting.
    """

    REASON_CODE_REGISTRY = {
        "MIL-883-M5004-T1": {
            "title": "Early Trapping / Gate-Oxide Contamination",
            "desc": "Elevated quiescent leakage observed prior to thermal activation. Signifies pre-existing gate oxide lattice traps or mobile ionic contamination.",
            "action": "Immediate Quarantine. Disqualify from flight payload assembly."
        },
        "MIL-883-M5004-T2": {
            "title": "Non-Linear Thermal Degradation Runaway",
            "desc": "Accelerating leakage trajectory under 125°C HTOL stress with positive second-derivative curvature. Indicates progressive dielectric breakdown.",
            "action": "Trigger Early Abort. Part poses catastrophic risk of short-circuit in orbit."
        },
        "MIL-883-M5004-T3": {
            "title": "Late-Onset Channel Activation",
            "desc": "Stable initial baseline followed by abrupt trajectory divergence at 96h milestone. Latent defect unmasked only through prolonged ESS stress.",
            "action": "Quarantine unit. Perform destructive physical analysis (DPA) on sibling die."
        },
        "MIL-883-M5004-T4": {
            "title": "Multivariate Physics-of-Failure Decoupling",
            "desc": "Parametric anomaly breaking physical Iddq-to-propagation-delay covariance cluster while appearing nominal under isolated 1D thresholds.",
            "action": "Engineering Review. Conduct curve tracer analysis and thermal diode calibration."
        },
        "AEC-Q001-GDBN": {
            "title": "Good-Die-in-Bad-Neighborhood (GDBN) Proximity Risk",
            "desc": "Passing electrical telemetry but fabricated within a defective cluster on the semiconductor wafer. Susceptible to latent micro-fractures.",
            "action": "Hold for secondary screening. Downgrade from Flight Model to Ground Engineering Model."
        },
        "MIL-883-CLASS-V-PASS": {
            "title": "Class V Flight Conformance Verified",
            "desc": "Electrical trajectory conforms to static and dynamic safety limits throughout 168h ESS screening duration.",
            "action": "Release for satellite flight avionics integration."
        }
    }

    @classmethod
    def generate_rationale(
        cls,
        verdict: DispositionVerdict,
        defect_type: LatentDefectType,
        modified_z: float,
        drift_rate: float,
        mahalanobis_dist: float,
        is_gdbn: bool = False
    ) -> Dict[str, str]:
        if is_gdbn and verdict != DispositionVerdict.REJECT:
            code = "AEC-Q001-GDBN"
        elif defect_type == LatentDefectType.TYPE_1_HIGH_START:
            code = "MIL-883-M5004-T1"
        elif defect_type == LatentDefectType.TYPE_2_ACCELERATING_DRIFT:
            code = "MIL-883-M5004-T2"
        elif defect_type == LatentDefectType.TYPE_3_LATE_ONSET:
            code = "MIL-883-M5004-T3"
        elif defect_type == LatentDefectType.TYPE_4_COVARIANCE_BREAKDOWN:
            code = "MIL-883-M5004-T4"
        elif verdict == DispositionVerdict.ACCEPT:
            code = "MIL-883-CLASS-V-PASS"
        else:
            code = "MIL-883-M5004-T4"

        entry = cls.REASON_CODE_REGISTRY.get(code, cls.REASON_CODE_REGISTRY["MIL-883-CLASS-V-PASS"])
        return {
            "reason_code": code,
            "title": entry["title"],
            "description": entry["desc"],
            "recommended_action": entry["action"],
            "statistical_summary": f"Modified Z: {modified_z:.2f}σ | Drift Rate: {drift_rate:.4f}µA/h | Mahalanobis: {mahalanobis_dist:.2f}"
        }
