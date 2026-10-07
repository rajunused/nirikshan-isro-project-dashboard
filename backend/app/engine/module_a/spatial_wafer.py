"""
ISRO NIRIKSHAN AI-Driven Dynamic ESS Intelligence & Latent-Defect Risk Screening
Module A: Wafer Spatial Clustering & Good-Die-in-Bad-Neighborhood (GDBN) Engine
Calculates Moran's I spatial autocorrelation and flags clustered latent die risks
"""

from dataclasses import dataclass
from typing import Dict, List, Set, Tuple, Union
import numpy as np


@dataclass
class DieSpatialInfo:
    component_id: str
    x: int
    y: int
    is_anomaly: bool
    is_edge: bool
    bad_neighbor_count: int
    gdbn_risk_flag: bool


class WaferSpatialEngine:
    """
    Implements AEC-Q001 and MIL-PRF-38535 Spatial Part Average Testing (SPAT).
    Screens passing dies that reside inside defective clusters (latent contamination).
    """

    WAFER_RADIUS_UNITS = 6  # Normalized coordinate radius for 8-inch/12-inch wafer map

    @classmethod
    def calculate_morans_i(cls, dies: List[Tuple[int, int, float]]) -> float:
        """
        Calculates Moran's I spatial autocorrelation index for parameter values.
        Moran's I > 0.3 indicates significant spatial clustering.
        dies: list of (x, y, value)
        """
        n = len(dies)
        if n < 4:
            return 0.0

        coords = np.array([[d[0], d[1]] for d in dies])
        values = np.array([d[2] for d in dies])
        mean_val = np.mean(values)

        # Build inverse Euclidean distance spatial weight matrix W
        diff_coords = coords[:, np.newaxis, :] - coords[np.newaxis, :, :]
        dist_matrix = np.sqrt(np.sum(diff_coords ** 2, axis=-1))

        # Weight is 1 for immediate neighbors (dist <= 1.5), 0 otherwise
        np.fill_diagonal(dist_matrix, np.inf)
        W = (dist_matrix <= 1.5).astype(float)
        W_sum = np.sum(W)
        if W_sum == 0:
            return 0.0

        z = values - mean_val
        numerator = np.sum(W * np.outer(z, z))
        denominator = np.sum(z ** 2)

        if denominator == 0:
            return 0.0

        morans_i = (n / W_sum) * (numerator / denominator)
        return round(float(morans_i), 3)

    @classmethod
    def evaluate_gdbn_clusters(
        cls,
        die_list: List[Dict[str, Union[str, int, bool, float]]],
        min_bad_neighbors_for_gdbn: int = 2
    ) -> List[DieSpatialInfo]:
        """
        Evaluates 8-connected neighborhood for each die.
        Flags passing dies that have >= 2 bad neighbors as GDBN risks.
        """
        # Coordinate map: (x, y) -> die dict
        grid: Dict[Tuple[int, int], Dict] = {}
        for d in die_list:
            grid[(int(d["x"]), int(d["y"]))] = d

        results: List[DieSpatialInfo] = []

        # 8-connected neighbor relative offsets
        offsets = [
            (-1, -1), (-1, 0), (-1, 1),
            (0, -1),           (0, 1),
            (1, -1),  (1, 0),  (1, 1)
        ]

        for d in die_list:
            x, y = int(d["x"]), int(d["y"])
            comp_id = str(d["id"])
            is_anomaly = bool(d.get("is_anomaly", False))

            # Wafer radial distance check
            r = np.sqrt(x**2 + y**2)
            is_edge = r >= cls.WAFER_RADIUS_UNITS

            bad_neighbors = 0
            for dx, dy in offsets:
                neighbor = grid.get((x + dx, y + dy))
                if neighbor and neighbor.get("is_anomaly", False):
                    bad_neighbors += 1

            # GDBN rule: Die itself is functionally passing/nominal, but surrounded by bad dies
            gdbn_risk = (not is_anomaly) and (bad_neighbors >= min_bad_neighbors_for_gdbn)

            results.append(DieSpatialInfo(
                component_id=comp_id,
                x=x,
                y=y,
                is_anomaly=is_anomaly,
                is_edge=is_edge,
                bad_neighbor_count=bad_neighbors,
                gdbn_risk_flag=gdbn_risk
            ))

        return results
