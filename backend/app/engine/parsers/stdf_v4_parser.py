"""
ISRO NIRIKSHAN AI-Driven Dynamic ESS Intelligence & Latent-Defect Risk Screening
Standard Test Data Format (STDF v4) Binary Parser
Decodes ATE Binary Records: FAR, MIR, SDR, PIR, PRR, PTR, MPR
"""

import io
import struct
from dataclasses import dataclass, field
from typing import BinaryIO, Dict, Generator, List, Optional, Tuple, Union


@dataclass
class STDFHeader:
    rec_len: int
    rec_typ: int
    rec_sub: int


@dataclass
class STDFRecord:
    header: STDFHeader
    type_name: str
    fields: Dict[str, Union[int, float, str, bytes, list]]


@dataclass
class STDFParsedLot:
    lot_id: str = "UNKNOWN_LOT"
    part_type: str = "GENERIC_IC"
    operator: str = "ATE_OP"
    test_temp: float = 125.0
    start_time: int = 0
    components: Dict[str, Dict[str, Union[float, int, str]]] = field(default_factory=dict)
    quarantined_count: int = 0
    total_records: int = 0


class STDFv4Parser:
    """
    High-performance binary decoder for IEEE/SEMI standard STDF v4 files from
    Teradyne, Advantest, and custom ISRO Cleanroom ATE test benches.
    """

    # Record Type and Subtype mappings
    RECORD_MAP = {
        (0, 10): "FAR",   # File Attributes Record
        (0, 20): "ATR",   # Audit Trail Record
        (1, 10): "MIR",   # Master Information Record
        (1, 20): "MRR",   # Master Results Record
        (1, 30): "PCR",   # Part Count Record
        (1, 40): "HBR",   # Hardware Bin Record
        (1, 50): "SBR",   # Software Bin Record
        (1, 80): "SDR",   # Site Description Record
        (2, 10): "WIR",   # Wafer Information Record
        (2, 20): "WRR",   # Wafer Results Record
        (5, 10): "PIR",   # Part Information Record
        (5, 20): "PRR",   # Part Results Record
        (15, 10): "PTR",  # Parametric Test Record
        (15, 15): "MPR",  # Multiple-Result Parametric Record
    }

    def __init__(self, endianness: str = "<"):
        # Default little-endian for x86 ATE controllers
        self.endianness = endianness

    def read_header(self, stream: BinaryIO) -> Optional[STDFHeader]:
        header_bytes = stream.read(4)
        if len(header_bytes) < 4:
            return None
        rec_len, rec_typ, rec_sub = struct.unpack(f"{self.endianness}HBB", header_bytes)
        return STDFHeader(rec_len=rec_len, rec_typ=rec_typ, rec_sub=rec_sub)

    def read_string(self, stream: BinaryIO) -> str:
        """STDF Pascal string: 1 byte length prefix followed by ASCII characters."""
        len_byte = stream.read(1)
        if not len_byte:
            return ""
        str_len = struct.unpack("B", len_byte)[0]
        if str_len == 0:
            return ""
        data = stream.read(str_len)
        return data.decode("latin-1", errors="replace").strip()

    def parse_stream(self, stream: BinaryIO) -> Generator[STDFRecord, None, None]:
        """Stream generator that yields parsed STDF records sequentially."""
        while True:
            header = self.read_header(stream)
            if not header:
                break

            record_bytes = stream.read(header.rec_len)
            if len(record_bytes) < header.rec_len:
                break

            rec_key = (header.rec_typ, header.rec_sub)
            rec_name = self.RECORD_MAP.get(rec_key, f"UNKNOWN_{header.rec_typ}_{header.rec_sub}")
            rec_stream = io.BytesIO(record_bytes)

            fields: Dict[str, Union[int, float, str, bytes, list]] = {}

            try:
                if rec_name == "FAR":
                    # CPU_TYPE (U*1), STDF_VER (U*1)
                    if len(record_bytes) >= 2:
                        cpu, ver = struct.unpack(f"{self.endianness}BB", record_bytes[:2])
                        fields = {"cpu_type": cpu, "stdf_version": ver}

                elif rec_name == "MIR":
                    # SETUP_T (U*4), START_T (U*4), STAT_NUM (U*1), MODE_COD (C*1), RTST_COD (C*1)...
                    if len(record_bytes) >= 11:
                        setup_t, start_t, stat_num = struct.unpack(f"{self.endianness}IIB", record_bytes[:9])
                        fields["setup_time"] = setup_t
                        fields["start_time"] = start_t
                        fields["station_number"] = stat_num
                        rec_stream.seek(11)
                        fields["lot_id"] = self.read_string(rec_stream)
                        fields["part_type"] = self.read_string(rec_stream)
                        fields["node_name"] = self.read_string(rec_stream)
                        fields["tester_type"] = self.read_string(rec_stream)
                        fields["job_name"] = self.read_string(rec_stream)

                elif rec_name == "PIR":
                    if len(record_bytes) >= 2:
                        head_num, site_num = struct.unpack(f"{self.endianness}BB", record_bytes[:2])
                        fields = {"head_number": head_num, "site_number": site_num}

                elif rec_name == "PRR":
                    # HEAD_NUM(U*1), SITE_NUM(U*1), PART_FLG(B*1), NUM_TEST(U*2), HARD_BIN(U*2), SOFT_BIN(U*2), X_COORD(I*2), Y_COORD(I*2), TEST_T(U*4)
                    if len(record_bytes) >= 17:
                        head, site, part_flg, num_test, hard_bin, soft_bin, x, y, test_t = struct.unpack(
                            f"{self.endianness}BBBHhhII", record_bytes[:19] if len(record_bytes) >= 19 else record_bytes[:17] + b"\x00\x00"
                        )
                        fields["head_number"] = head
                        fields["site_number"] = site
                        fields["part_flag"] = part_flg
                        fields["num_test"] = num_test
                        fields["hard_bin"] = hard_bin
                        fields["soft_bin"] = soft_bin
                        fields["x_coord"] = x
                        fields["y_coord"] = y
                        fields["test_time_ms"] = test_t
                        rec_stream.seek(19 if len(record_bytes) >= 19 else 17)
                        fields["part_id"] = self.read_string(rec_stream)

                elif rec_name == "PTR":
                    # TEST_NUM(U*4), HEAD_NUM(U*1), SITE_NUM(U*1), TEST_FLG(B*1), PARM_FLG(B*1), RESULT(R*4)
                    if len(record_bytes) >= 12:
                        test_num, head, site, test_flg, parm_flg, result = struct.unpack(
                            f"{self.endianness}IBBBf", record_bytes[:11] + record_bytes[11:15] if len(record_bytes) >= 15 else record_bytes[:11] + b"\x00\x00\x00\x00"
                        )
                        fields["test_number"] = test_num
                        fields["head_number"] = head
                        fields["site_number"] = site
                        fields["test_flag"] = test_flg
                        fields["result"] = float(result)
                        rec_stream.seek(15)
                        fields["test_txt"] = self.read_string(rec_stream)
                        fields["alarm_id"] = self.read_string(rec_stream)

                else:
                    fields["raw_bytes_len"] = len(record_bytes)

            except Exception as e:
                fields["parse_error"] = str(e)

            yield STDFRecord(header=header, type_name=rec_name, fields=fields)

    def extract_lot_telemetry(self, stream: BinaryIO) -> STDFParsedLot:
        """
        High-level aggregator: processes binary STDF v4 stream and produces
        structured component measurements mapped by serial ID.
        """
        lot_result = STDFParsedLot()
        current_part_id = "UNKNOWN"
        current_x = 0
        current_y = 0

        for record in self.parse_stream(stream):
            lot_result.total_records += 1

            if record.type_name == "MIR":
                lot_result.lot_id = str(record.fields.get("lot_id", "LOT-STDF-INGEST"))
                lot_result.part_type = str(record.fields.get("part_type", "RH-LOGIC-01"))
                lot_result.start_time = int(record.fields.get("start_time", 0))

            elif record.type_name == "PRR":
                current_part_id = str(record.fields.get("part_id", f"COMP-{len(lot_result.components)+1}"))
                current_x = int(record.fields.get("x_coord", 0))
                current_y = int(record.fields.get("y_coord", 0))
                hard_bin = int(record.fields.get("hard_bin", 1))

                if current_part_id not in lot_result.components:
                    lot_result.components[current_part_id] = {
                        "id": current_part_id,
                        "wafer_x": current_x,
                        "wafer_y": current_y,
                        "hard_bin": hard_bin,
                        "leakage_ua": 11.2,
                        "delay_ns": 1.85,
                        "contact_res_ohm": 0.42
                    }

            elif record.type_name == "PTR":
                test_txt = str(record.fields.get("test_txt", "")).upper()
                result = float(record.fields.get("result", 0.0))

                if current_part_id in lot_result.components:
                    comp = lot_result.components[current_part_id]
                    if "LEAK" in test_txt or "IDDQ" in test_txt or "IDD" in test_txt:
                        comp["leakage_ua"] = result
                    elif "DELAY" in test_txt or "TPD" in test_txt or "PROP" in test_txt:
                        comp["delay_ns"] = result
                    elif "CONT" in test_txt or "RES" in test_txt:
                        comp["contact_res_ohm"] = result

        return lot_result
