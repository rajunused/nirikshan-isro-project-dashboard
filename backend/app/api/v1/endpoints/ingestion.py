"""
ISRO NIRIKSHAN AI-Driven Dynamic ESS Intelligence & Latent-Defect Risk Screening
API Endpoint: ATE Ingestion Suite (STDF v4, ATDF, CSV & Synthetic Generator)
"""

import io
import time
from typing import Dict, List, Optional
from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from app.core.logging import logger
from app.engine.parsers.stdf_v4_parser import STDFv4Parser
from app.engine.parsers.atdf_parser import ATDFParser
from app.engine.parsers.sanitization import ATESanitizer
from app.schemas.ingestion import IngestionResponse, SyntheticLotRequest
from app.services.lot_service import flight_repo

router = APIRouter(prefix="/ingestion", tags=["ATE Ingestion"])


@router.post("/upload-stdf", response_model=IngestionResponse)
async def upload_stdf_file(file: UploadFile = File(...)):
    """
    Ingest IEEE/SEMI binary STDF v4 file from ATE cleanroom test equipment.
    Decodes FAR, MIR, SDR, PIR, PRR, PTR binary records with sanity contact check.
    """
    start_t = time.time()
    try:
        contents = await file.read()
        stream = io.BytesIO(contents)
        parser = STDFv4Parser()
        parsed_lot = parser.extract_lot_telemetry(stream)

        # Sanitize and store in repository
        lot_id = parsed_lot.lot_id or f"LOT-{file.filename}"
        flight_repo.lots[lot_id] = {
            "id": lot_id,
            "device_family": parsed_lot.part_type,
            "chamber_id": "VSSC-TC-04",
            "status": "INGESTED",
            "qualification_level": "MIL-STD-883_CLASS_V"
        }

        quarantined = []
        for part_id, data in parsed_lot.components.items():
            san = ATESanitizer.sanitize_measurement(
                leakage_raw=float(data.get("leakage_ua", 11.0)),
                delay_raw=float(data.get("delay_ns", 1.8)),
                contact_res_raw=float(data.get("contact_res_ohm", 0.4))
            )
            if not san.is_valid:
                quarantined.append(f"{part_id}: {san.quarantine_reason}")
                continue

            flight_repo.components[part_id] = {
                "id": part_id,
                "lot_id": lot_id,
                "type": "NOMINAL",
                "baseline": [san.sanitized_leakage_ua, san.sanitized_leakage_ua * 1.05, san.sanitized_leakage_ua * 1.12, san.sanitized_leakage_ua * 1.2],
                "delay": san.sanitized_delay_ns,
                "x": int(data.get("wafer_x", 0)),
                "y": int(data.get("wafer_y", 0)),
                "driver": "STDF v4 Ingested telemetry"
            }

        elapsed = round((time.time() - start_t) * 1000, 2)
        return IngestionResponse(
            lot_id=lot_id,
            format_type="STDF_V4",
            total_records_parsed=parsed_lot.total_records,
            components_ingested=len(parsed_lot.components) - len(quarantined),
            quarantined_count=len(quarantined),
            quarantine_reasons=quarantined[:10],
            processing_time_ms=elapsed
        )
    except Exception as e:
        logger.error(f"Error parsing STDF file: {e}")
        raise HTTPException(status_code=400, detail=f"STDF Parsing Error: {str(e)}")


@router.post("/upload-atdf", response_model=IngestionResponse)
async def upload_atdf_file(file: UploadFile = File(...)):
    """
    Ingest ASCII Test Data Format (ATDF) text dump.
    """
    start_t = time.time()
    try:
        contents = await file.read()
        text_stream = io.StringIO(contents.decode("latin-1", errors="replace"))
        parser = ATDFParser()
        parsed_lot = parser.parse_stream(text_stream)

        lot_id = parsed_lot.lot_id or f"LOT-{file.filename}"
        flight_repo.lots[lot_id] = {
            "id": lot_id,
            "device_family": parsed_lot.part_type,
            "chamber_id": "VSSC-TC-04",
            "status": "INGESTED",
            "qualification_level": "MIL-STD-883_CLASS_V"
        }

        quarantined = []
        for part_id, data in parsed_lot.components.items():
            san = ATESanitizer.sanitize_measurement(
                leakage_raw=float(data.get("leakage_ua", 11.0)),
                delay_raw=float(data.get("delay_ns", 1.8)),
                contact_res_raw=float(data.get("contact_res_ohm", 0.4))
            )
            if not san.is_valid:
                quarantined.append(f"{part_id}: {san.quarantine_reason}")
                continue

            flight_repo.components[part_id] = {
                "id": part_id,
                "lot_id": lot_id,
                "type": "NOMINAL",
                "baseline": [san.sanitized_leakage_ua, san.sanitized_leakage_ua * 1.05, san.sanitized_leakage_ua * 1.12, san.sanitized_leakage_ua * 1.2],
                "delay": san.sanitized_delay_ns,
                "x": int(data.get("wafer_x", 0)),
                "y": int(data.get("wafer_y", 0)),
                "driver": "ATDF Ingested telemetry"
            }

        elapsed = round((time.time() - start_t) * 1000, 2)
        return IngestionResponse(
            lot_id=lot_id,
            format_type="ATDF",
            total_records_parsed=parsed_lot.total_records,
            components_ingested=len(parsed_lot.components) - len(quarantined),
            quarantined_count=len(quarantined),
            quarantine_reasons=quarantined[:10],
            processing_time_ms=elapsed
        )
    except Exception as e:
        logger.error(f"Error parsing ATDF file: {e}")
        raise HTTPException(status_code=400, detail=f"ATDF Parsing Error: {str(e)}")


@router.post("/generate-synthetic-lot", response_model=IngestionResponse)
async def generate_synthetic_lot(req: SyntheticLotRequest):
    """
    Generates statistically controlled flight lots containing nominal and latent-defect units.
    """
    start_t = time.time()
    flight_repo.lots[req.lot_id] = {
        "id": req.lot_id,
        "device_family": req.device_family,
        "chamber_id": "VSSC-TC-04",
        "status": "SCREENING_ACTIVE",
        "qualification_level": "MIL-STD-883_CLASS_V"
    }

    comps_to_add = []
    # Injected defect types if requested
    if req.include_type1_high_start:
        comps_to_add.append({
            "id": f"{req.lot_id}-T1",
            "type": "TYPE_1_HIGH_START",
            "baseline": [42.5, 43.1, 44.0, 45.2],
            "delay": 1.84, "x": -2, "y": 3,
            "driver": "Pre-existing gate oxide lattice trap"
        })
    if req.include_type2_accelerating:
        comps_to_add.append({
            "id": f"{req.lot_id}-T2",
            "type": "TYPE_2_ACCELERATING_DRIFT",
            "baseline": [10.2, 14.8, 27.4, 48.9],
            "delay": 2.95, "x": 3, "y": 2,
            "driver": "Accelerating non-linear dielectric breakdown"
        })
    if req.include_type3_late_onset:
        comps_to_add.append({
            "id": f"{req.lot_id}-T3",
            "type": "TYPE_3_LATE_ONSET",
            "baseline": [11.0, 12.2, 13.8, 32.5],
            "delay": 2.10, "x": 1, "y": -4,
            "driver": "Late-onset channel activation at 96h"
        })
    if req.include_type4_covariance:
        comps_to_add.append({
            "id": f"{req.lot_id}-T4",
            "type": "TYPE_4_COVARIANCE_BREAKDOWN",
            "baseline": [12.1, 12.9, 14.3, 18.2],
            "delay": 3.48, "x": -4, "y": 1,
            "driver": "Abnormal Iddq-to-delay physical covariance"
        })

    remaining = max(1, req.total_components - len(comps_to_add))
    for i in range(remaining):
        c_id = f"{req.lot_id}-{100 + i}"
        comps_to_add.append({
            "id": c_id,
            "type": "NOMINAL",
            "baseline": [11.0 + (i % 4) * 0.4, 12.0 + (i % 3) * 0.3, 13.0 + (i % 5) * 0.3, 14.0 + (i % 4) * 0.25],
            "delay": round(1.75 + (i % 6) * 0.08, 2),
            "x": int((i % 7) - 3),
            "y": int((i // 7) - 3),
            "driver": "Conforms to MIL-STD-883 Class V"
        })

    for c in comps_to_add:
        c["lot_id"] = req.lot_id
        flight_repo.components[c["id"]] = c

    elapsed = round((time.time() - start_t) * 1000, 2)
    return IngestionResponse(
        lot_id=req.lot_id,
        format_type="SYNTHETIC_GENERATOR",
        total_records_parsed=len(comps_to_add),
        components_ingested=len(comps_to_add),
        quarantined_count=0,
        quarantine_reasons=[],
        processing_time_ms=elapsed
    )
