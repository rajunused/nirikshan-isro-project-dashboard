"""
ISRO NIRIKSHAN AI-Driven Dynamic ESS Intelligence & Latent-Defect Risk Screening
Automated Test Data Format (ATDF) ASCII Parser
Parses text-based delimited ATE test dumps into structured component records
"""

from dataclasses import dataclass, field
from typing import Dict, List, TextIO, Union


@dataclass
class ATDFParsedLot:
    lot_id: str = "UNKNOWN_LOT"
    part_type: str = "GENERIC_IC"
    temperature: float = 125.0
    components: Dict[str, Dict[str, Union[float, int, str]]] = field(default_factory=dict)
    total_records: int = 0


class ATDFParser:
    """
    Parses ATDF ASCII format records (FAR:, MIR:, SDR:, PIR:, PRR:, PTR:)
    separated by '|' delimiters.
    """

    def parse_stream(self, stream: TextIO) -> ATDFParsedLot:
        result = ATDFParsedLot()
        current_part_id = "UNKNOWN"

        for line in stream:
            line = line.strip()
            if not line or line.startswith("#"):
                continue

            parts = [p.strip() for p in line.split("|")]
            record_type = parts[0].upper().rstrip(":")
            result.total_records += 1

            if record_type == "MIR" and len(parts) > 6:
                result.lot_id = parts[5] if len(parts) > 5 and parts[5] else "LOT-ATDF-INGEST"
                result.part_type = parts[6] if len(parts) > 6 and parts[6] else "RH-LOGIC-01"

            elif record_type == "PRR" and len(parts) > 8:
                part_id = parts[8] if len(parts) > 8 and parts[8] else f"COMP-{len(result.components)+1}"
                current_part_id = part_id
                x_coord = int(parts[6]) if len(parts) > 6 and parts[6].lstrip("-").isdigit() else 0
                y_coord = int(parts[7]) if len(parts) > 7 and parts[7].lstrip("-").isdigit() else 0
                hard_bin = int(parts[4]) if len(parts) > 4 and parts[4].isdigit() else 1

                if part_id not in result.components:
                    result.components[part_id] = {
                        "id": part_id,
                        "wafer_x": x_coord,
                        "wafer_y": y_coord,
                        "hard_bin": hard_bin,
                        "leakage_ua": 11.0,
                        "delay_ns": 1.80,
                        "contact_res_ohm": 0.40
                    }

            elif record_type == "PTR" and len(parts) > 6:
                test_txt = parts[6].upper() if len(parts) > 6 else ""
                try:
                    val = float(parts[5]) if len(parts) > 5 and parts[5] else 0.0
                except ValueError:
                    val = 0.0

                if current_part_id in result.components:
                    comp = result.components[current_part_id]
                    if "LEAK" in test_txt or "IDDQ" in test_txt:
                        comp["leakage_ua"] = val
                    elif "DELAY" in test_txt or "TPD" in test_txt:
                        comp["delay_ns"] = val
                    elif "CONT" in test_txt or "RES" in test_txt:
                        comp["contact_res_ohm"] = val

        return result
