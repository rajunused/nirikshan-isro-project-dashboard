"""
ISRO NIRIKSHAN AI-Driven Dynamic ESS Intelligence & Latent-Defect Risk Screening
Structured JSON Telemetry & Audit Logger
"""

import logging
import sys
import json
from datetime import datetime, timezone
from typing import Any, Dict


class AerospaceJSONFormatter(logging.Formatter):
    """
    Format logs as structured JSON records compliant with aerospace GSE log ingestion.
    """

    def format(self, record: logging.LogRecord) -> str:
        log_payload: Dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Attach telemetry metadata if present in extra dict
        if hasattr(record, "telemetry"):
            log_payload["telemetry"] = record.telemetry
        if hasattr(record, "lot_id"):
            log_payload["lot_id"] = record.lot_id
        if hasattr(record, "component_id"):
            log_payload["component_id"] = record.component_id
        if hasattr(record, "inspector_id"):
            log_payload["inspector_id"] = record.inspector_id

        if record.exc_info:
            log_payload["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_payload)


def setup_telemetry_logger(name: str = "nirikshan") -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(AerospaceJSONFormatter())
        logger.addHandler(handler)
        logger.propagate = False

    return logger


logger = setup_telemetry_logger()
