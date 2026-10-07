"""
ISRO NIRIKSHAN AI-Driven Dynamic ESS Intelligence & Latent-Defect Risk Screening
ATE Ingestion Sanitization & Contact Sanity Check
Disqualifies open pins, negative delays, and fixture anomalies before statistical evaluation
"""

from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple, Union


@dataclass
class SanitizationResult:
    is_valid: bool
    sanitized_leakage_ua: float
    sanitized_delay_ns: float
    sanitized_contact_res_ohm: float
    quarantine_reason: Optional[str] = None


class ATESanitizer:
    """
    MIL-STD-883 Method 5004 / 5005 Cleanroom Pre-Screening Sanity Verifier.
    Protects dynamic population algorithms from being contaminated by fixture contact errors.
    """

    MAX_CONTACT_RESISTANCE_OHM = 1.50   # Hard limit for kelvin probe contact sanity
    MIN_PROPAGATION_DELAY_NS = 0.05     # Physical lower bound for CMOS gate transition
    MAX_PROPAGATION_DELAY_NS = 20.0     # Sensible upper bound for logic family
    MAX_VALID_LEAKAGE_UA = 1000.0       # Gross catastrophic short limit

    @classmethod
    def sanitize_measurement(
        cls,
        leakage_raw: float,
        delay_raw: float,
        contact_res_raw: float = 0.42,
        leakage_unit: str = "UA",
        delay_unit: str = "NS"
    ) -> SanitizationResult:
        """
        Normalize units to standard µA and ns, then execute strict sanity validation.
        """
        # Unit Normalization for Leakage
        leakage_u = leakage_unit.upper()
        if leakage_u == "NA":
            leakage_ua = leakage_raw / 1000.0
        elif leakage_u == "MA":
            leakage_ua = leakage_raw * 1000.0
        elif leakage_u == "A":
            leakage_ua = leakage_raw * 1e6
        else:
            leakage_ua = leakage_raw

        # Unit Normalization for Delay
        delay_u = delay_unit.upper()
        if delay_u == "PS":
            delay_ns = delay_raw / 1000.0
        elif delay_u == "US":
            delay_ns = delay_raw * 1000.0
        else:
            delay_ns = delay_raw

        # Check 1: Open pin / high contact resistance
        if contact_res_raw > cls.MAX_CONTACT_RESISTANCE_OHM:
            return SanitizationResult(
                is_valid=False,
                sanitized_leakage_ua=leakage_ua,
                sanitized_delay_ns=delay_ns,
                sanitized_contact_res_ohm=contact_res_raw,
                quarantine_reason=f"ATE Contact Resistance Fault: {contact_res_raw:.2f}Ω exceeds limit of {cls.MAX_CONTACT_RESISTANCE_OHM}Ω"
            )

        # Check 2: Unphysical negative delay
        if delay_ns < cls.MIN_PROPAGATION_DELAY_NS:
            return SanitizationResult(
                is_valid=False,
                sanitized_leakage_ua=leakage_ua,
                sanitized_delay_ns=delay_ns,
                sanitized_contact_res_ohm=contact_res_raw,
                quarantine_reason=f"Negative or Unphysical Delay: {delay_ns:.3f}ns < {cls.MIN_PROPAGATION_DELAY_NS}ns threshold"
            )

        # Check 3: Gross short-circuit
        if leakage_ua > cls.MAX_VALID_LEAKAGE_UA:
            return SanitizationResult(
                is_valid=False,
                sanitized_leakage_ua=leakage_ua,
                sanitized_delay_ns=delay_ns,
                sanitized_contact_res_ohm=contact_res_raw,
                quarantine_reason=f"Gross Catastrophic Short: Leakage {leakage_ua:.1f}µA exceeds {cls.MAX_VALID_LEAKAGE_UA}µA"
            )

        # Passes all ATE sanity checks
        return SanitizationResult(
            is_valid=True,
            sanitized_leakage_ua=round(leakage_ua, 3),
            sanitized_delay_ns=round(delay_ns, 3),
            sanitized_contact_res_ohm=round(contact_res_raw, 3),
            quarantine_reason=None
        )
