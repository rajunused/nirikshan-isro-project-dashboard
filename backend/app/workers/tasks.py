"""
ISRO NIRIKSHAN AI-Driven Dynamic ESS Intelligence & Latent-Defect Risk Screening
Celery Distributed Tasks: STDF Processing, Monte Carlo, and Batch Lot Screening
"""

import io
import time
from typing import Dict, List, Any
from app.workers.celery_app import celery_app
from app.core.logging import logger
from app.engine.parsers.stdf_v4_parser import STDFv4Parser
from app.engine.module_b.trajectory_forecaster import TrajectoryForecaster
from app.engine.module_a.robust_stats import RobustStatsEngine
from app.engine.module_a.hierarchical import HierarchicalBaselineEngine


@celery_app.task(bind=True, name="tasks.ingest_stdf_batch")
def task_ingest_stdf_batch(self, file_bytes_hex: str, filename: str) -> Dict[str, Any]:
    """
    Decodes binary STDF v4 record streams asynchronously.
    """
    logger.info(f"Worker initiated STDF ingestion task for {filename} (ID: {self.request.id})")
    start_t = time.time()
    
    raw_bytes = bytes.fromhex(file_bytes_hex)
    stream = io.BytesIO(raw_bytes)
    
    parser = STDFv4Parser()
    lot_parsed = parser.extract_lot_telemetry(stream)
    
    elapsed = round((time.time() - start_t) * 1000, 2)
    logger.info(f"STDF task completed in {elapsed}ms. Parsed {len(lot_parsed.components)} components.")
    
    return {
        "task_id": self.request.id,
        "lot_id": lot_parsed.lot_id,
        "part_type": lot_parsed.part_type,
        "total_records": lot_parsed.total_records,
        "components_count": len(lot_parsed.components),
        "processing_time_ms": elapsed,
        "status": "SUCCESS"
    }


@celery_app.task(name="tasks.monte_carlo_batch_simulation")
def task_monte_carlo_batch_simulation(
    v0: float,
    v24: float,
    num_runs: int = 100
) -> Dict[str, Any]:
    """
    Executes distributed high-volume Monte Carlo stochastic simulations.
    """
    forecaster = TrajectoryForecaster()
    runs = forecaster.generate_monte_carlo_runs(v0=v0, v24=v24, num_simulations=num_runs)
    return {
        "num_runs": len(runs),
        "v0": v0,
        "v24": v24,
        "simulations": runs
    }
