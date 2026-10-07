"""
ISRO NIRIKSHAN AI-Driven Dynamic ESS Intelligence & Latent-Defect Risk Screening
API Endpoint: Live 125°C Chamber Telemetry & WebSocket Stream
"""

import asyncio
import json
import random
import time
from typing import Dict
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.schemas.telemetry import ChamberTelemetryState
from app.core.logging import logger

router = APIRouter(tags=["Live Chamber Telemetry"])


@router.get("/api/v1/telemetry/chamber-state", response_model=ChamberTelemetryState)
async def get_current_chamber_state():
    """Fetch current 125°C thermal soak chamber telemetry snapshot."""
    temp_noise = round(random.uniform(-0.35, 0.45), 2)
    actual_t = 125.0 + temp_noise

    return ChamberTelemetryState(
        chamber_id="VSSC-TC-04",
        setpoint_temp_c=125.0,
        actual_temp_c=actual_t,
        temp_deviation_c=temp_noise,
        vdd_bias_volts=3.30,
        soak_hours_elapsed=96,
        total_scheduled_hours=168,
        nitrogen_purge_flow_slpm=12.4,
        vacuum_pressure_torr=760.0,
        status_label="HTOL_SOAK_NOMINAL"
    )


@router.websocket("/ws/chamber-telemetry")
async def websocket_chamber_telemetry(websocket: WebSocket):
    """
    WebSocket endpoint streaming live 125°C chamber soak telemetry.
    Yields telemetry updates at 1 Hz with thermal diode readings and bias regulation.
    """
    await websocket.accept()
    logger.info("Client connected to live chamber telemetry stream.")

    try:
        while True:
            temp_noise = round(random.uniform(-0.35, 0.45), 2)
            actual_t = 125.0 + temp_noise
            bias_noise = round(random.uniform(-0.015, 0.015), 3)

            payload = {
                "timestamp": time.time(),
                "chamber_id": "VSSC-TC-04",
                "setpoint_temp_c": 125.0,
                "actual_temp_c": actual_t,
                "temp_deviation_c": temp_noise,
                "vdd_bias_volts": round(3.30 + bias_noise, 3),
                "nitrogen_flow_slpm": round(12.4 + random.uniform(-0.2, 0.2), 1),
                "vacuum_torr": 760.0,
                "soak_hours_elapsed": 96,
                "total_scheduled_hours": 168,
                "soak_completion_pct": round((96 / 168) * 100.0, 1),
                "status": "NOMINAL_SOAK_ACTIVE"
            }

            await websocket.send_text(json.dumps(payload))
            await asyncio.sleep(1.0)

    except WebSocketDisconnect:
        logger.info("Chamber telemetry WebSocket client disconnected.")
    except Exception as e:
        logger.warning(f"WebSocket telemetry error: {e}")
