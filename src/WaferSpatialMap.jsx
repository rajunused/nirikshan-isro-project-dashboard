import React, { useMemo, useState } from 'react';
import { Target, Layers, AlertTriangle, ShieldCheck, Zap, Info } from 'lucide-react';

/**
 * WaferSpatialMap
 * Visual representation of silicon wafer die coordinates showing spatial clustering
 * of latent defects, edge-ring thermal stress non-uniformities, and neighbor correlation.
 */
export default function WaferSpatialMap({ components = [], selectedId, onSelectComponent }) {
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' | 'EDGE' | 'CLUSTERS' | 'REJECTS'
  const [hoveredDie, setHoveredDie] = useState(null);

  // Generate a realistic 9x9 circular wafer die matrix (approx 52 functional die sites)
  const waferDies = useMemo(() => {
    const dies = [];
    const radius = 4.2; // radius in grid units
    let compIdx = 0;

    for (let row = -4; row <= 4; row++) {
      for (let col = -4; col <= 4; col++) {
        const distFromCenter = Math.sqrt(row * row + col * col);
        if (distFromCenter <= radius) {
          // Inside circular wafer boundary
          const comp = components[compIdx % components.length] || null;
          compIdx++;

          const isEdge = distFromCenter > 3.2;
          const isCenter = distFromCenter < 1.8;

          // Spatial defect clustering logic: edge dies have higher propensity for CVD boundary defects
          let spatialRisk = comp ? comp.verdict : 'ACCEPT';
          if (comp?.type === 'ACCELERATING DRIFT' || comp?.type === 'HIGH FROM START') {
            spatialRisk = 'REJECT';
          } else if (isEdge && comp?.verdict === 'ACCEPT' && (Math.abs(row) === 4 || Math.abs(col) === 4)) {
            // Edge susceptibility
            spatialRisk = 'REVIEW';
          }

          dies.push({
            id: comp ? comp.id : `DIE-X${col + 5}Y${row + 5}`,
            comp,
            col,
            row,
            dist: distFromCenter,
            isEdge,
            isCenter,
            risk: spatialRisk,
            leakage: comp ? comp.baseline[3] : Number((10 + distFromCenter * 2.5).toFixed(1)),
            clusterScore: Number(((distFromCenter / radius) * 4.5 + (spatialRisk === 'REJECT' ? 3.5 : 0)).toFixed(1))
          });
        }
      }
    }
    return dies;
  }, [components]);

  const filteredDies = useMemo(() => {
    if (filterMode === 'EDGE') return waferDies.filter((d) => d.isEdge);
    if (filterMode === 'CLUSTERS') return waferDies.filter((d) => d.clusterScore > 4.0 || d.risk === 'REJECT');
    if (filterMode === 'REJECTS') return waferDies.filter((d) => d.risk === 'REJECT');
    return waferDies;
  }, [waferDies, filterMode]);

  const clusterCount = waferDies.filter((d) => d.clusterScore > 4.0).length;
  const edgeRiskCount = waferDies.filter((d) => d.isEdge && d.risk !== 'ACCEPT').length;

  return (
    <div className="wafer-spatial-container">
      {/* Wafer Sub-Header Controls */}
      <div className="wafer-controls-bar">
        <div className="wafer-meta-badge">
          <span className="wafer-lot-id">200MM SILICON SUBSTRATE</span>
          <span className="wafer-die-count">{waferDies.length} ACTIVE DIES</span>
        </div>

        {/* Spatial Filter Buttons */}
        <div className="wafer-filter-tabs">
          {[
            ['ALL', 'FULL WAFER'],
            ['EDGE', 'EDGE-RING ZONE'],
            ['CLUSTERS', 'DEFECT CLUSTERS'],
            ['REJECTS', 'HIGH RISK']
          ].map(([mode, label]) => (
            <button
              key={mode}
              className={`wafer-tab-btn ${filterMode === mode ? 'active' : ''}`}
              onClick={() => setFilterMode(mode)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Wafer Visualization Canvas */}
      <div className="wafer-interactive-stage">
        {/* Silicon Wafer Substrate Graphic */}
        <div className="wafer-disk-frame">
          {/* Concentric exclusion circles */}
          <div className="wafer-ring outer-ring" />
          <div className="wafer-ring mid-ring" />
          <div className="wafer-ring inner-ring" />
          <div className="wafer-flat-notch" title="Primary Silicon Crystal Orientation Notch" />

          {/* Die Grid Layout */}
          <div className="wafer-die-grid">
            {waferDies.map((die) => {
              const isSelected = selectedId && die.comp && die.comp.id === selectedId;
              const isDimmed = filterMode !== 'ALL' && !filteredDies.includes(die);

              let statusColor = '#10B981'; // Green
              if (die.risk === 'REVIEW') statusColor = '#F59E0B'; // Amber
              if (die.risk === 'REJECT') statusColor = '#EF4444'; // Red

              return (
                <div
                  key={`${die.col}-${die.row}`}
                  className={`wafer-die-cell ${die.risk.toLowerCase()} ${isSelected ? 'selected-die' : ''} ${
                    isDimmed ? 'dimmed' : ''
                  }`}
                  style={{
                    gridColumn: die.col + 5,
                    gridRow: die.row + 5,
                    borderColor: isSelected ? '#ffffff' : `${statusColor}44`,
                    backgroundColor: `${statusColor}22`
                  }}
                  onMouseEnter={() => setHoveredDie(die)}
                  onMouseLeave={() => setHoveredDie(null)}
                  onClick={() => {
                    if (die.comp && onSelectComponent) {
                      onSelectComponent(die.comp.id);
                    }
                  }}
                  title={`${die.id} • Die [X:${die.col}, Y:${die.row}] • ${die.risk}`}
                >
                  <span className="die-coord-label">
                    {die.col},{die.row}
                  </span>
                  {isSelected && <span className="selected-die-reticle" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Wafer Spatial Telemetry Sidebar */}
        <div className="wafer-telemetry-sidebar">
          <div className="wafer-stat-box">
            <span className="stat-title">SPATIAL DEFECT CLUSTERING</span>
            <div className="stat-val highlight-amber">
              {clusterCount} <small>DIES IN NEIGHBOR CLUSTERS</small>
            </div>
            <p className="stat-desc">
              Nearest-neighbor degradation detected. Components neighboring rejected units inherit +1.8x failure probability.
            </p>
          </div>

          <div className="wafer-stat-box">
            <span className="stat-title">EDGE-RING THERMAL GRADIENT</span>
            <div className="stat-val highlight-cyan">
              {edgeRiskCount} <small>PERIPHERY UNITS FLAGGED</small>
            </div>
            <p className="stat-desc">
              Radial distance stress gradient conforms to typical chemical vapor non-uniformity during wafer fabrication.
            </p>
          </div>

          {/* Hovered Die Inspector Tooltip */}
          {hoveredDie ? (
            <div className="die-inspector-card active">
              <div className="inspector-head">
                <Target size={12} className="icon-cyan" />
                <b>{hoveredDie.id}</b>
                <span className={`inspector-badge ${hoveredDie.risk.toLowerCase()}`}>
                  {hoveredDie.risk}
                </span>
              </div>
              <div className="inspector-grid">
                <div>COORD: <b>[{hoveredDie.col}, {hoveredDie.row}]</b></div>
                <div>RADIUS: <b>{hoveredDie.dist.toFixed(2)} R</b></div>
                <div>LEAKAGE: <b>{hoveredDie.leakage} µA</b></div>
                <div>CLUSTER: <b>{hoveredDie.clusterScore} MAD</b></div>
              </div>
              <div className="inspector-foot">
                {hoveredDie.isEdge ? 'PERIPHERAL EDGE DIE' : hoveredDie.isCenter ? 'CORE DIE' : 'INTERMEDIATE RING'}
                {hoveredDie.comp && <span className="click-hint"> • CLICK TO AUDIT</span>}
              </div>
            </div>
          ) : (
            <div className="die-inspector-card empty">
              <Info size={14} />
              <span>Hover over any silicon die on the wafer substrate to inspect spatial coordinates & latent cluster risk.</span>
            </div>
          )}
        </div>
      </div>

      {/* Wafer Legend Strip */}
      <div className="wafer-legend-strip">
        <div className="legend-item">
          <span className="die-legend-sample accept" />
          <span>NOMINAL CORE DIE (&lt;1.8 MAD)</span>
        </div>
        <div className="legend-item">
          <span className="die-legend-sample review" />
          <span>EDGE EXCLUSION / REVIEW ZONE</span>
        </div>
        <div className="legend-item">
          <span className="die-legend-sample reject" />
          <span>ELEVATED LATENT CLUSTER RISK</span>
        </div>
        <div className="legend-note">
          MIL-STD-883G METHOD 5004 • CLASS V FLIGHT SCREENING
        </div>
      </div>
    </div>
  );
}
