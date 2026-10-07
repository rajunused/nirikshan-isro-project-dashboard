"""
ISRO NIRIKSHAN AI-Driven Dynamic ESS Intelligence & Latent-Defect Risk Screening
Unit Tests: STDF v4 Binary Parser & ATE Pre-Screening Sanitization
"""

import io
import struct
import pytest
from app.engine.parsers.stdf_v4_parser import STDFv4Parser
from app.engine.parsers.sanitization import ATESanitizer


def test_ate_sanitizer_validation():
    # Pass check
    valid = ATESanitizer.sanitize_measurement(leakage_raw=11.2, delay_raw=1.85, contact_res_raw=0.42)
    assert valid.is_valid is True
    assert valid.quarantine_reason is None

    # Open pin / bad contact
    bad_contact = ATESanitizer.sanitize_measurement(leakage_raw=11.2, delay_raw=1.85, contact_res_raw=2.10)
    assert bad_contact.is_valid is False
    assert "Contact Resistance Fault" in bad_contact.quarantine_reason

    # Negative delay
    neg_delay = ATESanitizer.sanitize_measurement(leakage_raw=11.2, delay_raw=-0.12)
    assert neg_delay.is_valid is False
    assert "Negative or Unphysical Delay" in neg_delay.quarantine_reason


def test_stdf_binary_record_generation_and_parse():
    # Synthesize valid binary STDF stream: FAR (0,10) + MIR (1,10)
    buf = io.BytesIO()
    
    # FAR: Length=2, Type=0, Sub=10. Bytes: cpu=2, ver=4
    far_header = struct.pack("<HBB", 2, 0, 10)
    far_body = struct.pack("<BB", 2, 4)
    buf.write(far_header + far_body)

    # MIR: Type=1, Sub=10
    mir_body = struct.pack("<IIB", 1000, 2000, 1) + b"\x00\x00"
    mir_header = struct.pack("<HBB", len(mir_body), 1, 10)
    buf.write(mir_header + mir_body)

    buf.seek(0)
    parser = STDFv4Parser()
    records = list(parser.parse_stream(buf))

    assert len(records) == 2
    assert records[0].type_name == "FAR"
    assert records[0].fields["stdf_version"] == 4
    assert records[1].type_name == "MIR"
