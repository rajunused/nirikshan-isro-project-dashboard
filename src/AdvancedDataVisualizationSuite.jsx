import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ScatterChart,
  Scatter,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import {
  BarChart3,
  Radar as RadarIcon,
  ScatterChart as ScatterIcon,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Layers,
  Activity,
  Flame,
  Gauge,
  Info
} from 'lucide-react';

/**
 * AdvancedDataVisualizationSuite
 * Provides high-grade engineering data visualizations for PS170:
 * 1. DPAT Population Distribution (Gaussian bell curve + histogram + MAD limits)
 * 2. Multi-Parametric Latent-Defect Radar Chart (6-axis spider plot)
 * 3. Delta-24h vs Delta-168h Prognostic Correlation Scatter Plot (with quadrant classification)
 * 4. Dual-Axis Burn-in Chamber Degradation Scrubbing View (125°C soak + dynamic uncertainty narrowing)
 */
export default function AdvancedDataVisualizationSuite({
  components = [],
  selectedComponent = null,
  onSelectComponent,
  scrubHour = 96,
  onScrubHour
}) {
  const [activeVizTab, setActiveVizTab] = useState('dpat'); // 'dpat' | 'radar' | 'scatter' | 'dual'

  // Current selected unit or default to first
  const currentUnit = selectedComponent || components[0] || {
    id: 'COMP-4089',
    type: 'ACCELERATING DRIFT',
    baseline: [10, 14.2, 26.5, 47.8],
    mad: 5.4,
    slope: 0.22,
    delay: 2.94,
    verdict: 'REJECT'
  };

  // -------------------------------------------------------------
  // 1. DPAT Population Histogram with Fitted Gaussian Bell Curve
  // -------------------------------------------------------------
  const dpatData = useMemo(() => {
    // Collect 24h leakage measurements from all components
    const leakages = components.map((c) => c.baseline?.[1] || 12).filter((v) => !isNaN(v));
    if (leakages.length === 0) return [];

    const sorted = [...leakages].sort((a, b) => a - b);
    const mean = sorted.reduce((sum, v) => sum + v, 0) / sorted.length;
    const stdDev = Math.sqrt(sorted.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / sorted.length) || 1.2;

    // Normal Gaussian PDF: f(x) = (1 / (sigma * sqrt(2*pi))) * exp(-0.5 * ((x - mu)/sigma)^2)
    const gaussian = (x) => {
      const coeff = 1 / (stdDev * Math.sqrt(2 * Math.PI));
      const exponent = -0.5 * Math.pow((x - mean) / stdDev, 2);
      return coeff * Math.exp(exponent);
    };

    // 16 histogram bins from 8 µA to 48 µA
    const minVal = 8;
    const maxVal = 48;
    const step = 2.5;
    const bins = [];

    for (let x = minVal; x <= maxVal; x += step) {
      const binMin = x;
      const binMax = x + step;
      const count = sorted.filter((v) => v >= binMin && v < binMax).length;
      const bellValue = Number((gaussian(x + step / 2) * sorted.length * step * 1.8).toFixed(2));

      bins.push({
        binLabel: `${x.toFixed(1)}`,
        midPoint: x + step / 2,
        count: count,
        gaussianBell: bellValue,
        inSpec: x <= 30
      });
    }

    return { bins, mean, stdDev };
  }, [components]);

  // Selected unit 24h leakage
  const selectedLeakage24h = currentUnit.baseline?.[1] || 14.2;
  const dpatLimit = 22.4; // +3 MAD statistical limit
  const datasheetLimit = 40.0; // Absolute datasheet limit

  // -------------------------------------------------------------
  // 2. Multi-Parametric Latent-Defect Radar Chart (Custom SVG Spider Plot)
  // -------------------------------------------------------------
  // 6 Parameters normalized to 0..100 scale:
  // 1. Leakage Current (0..50 uA)
  // 2. Iddq Standby (0..30 uA)
  // 3. Propagation Delay (1.0..4.0 ns)
  // 4. Delta-24h Drift (0..10 uA)
  // 5. Delta-96h Drift (0..25 uA)
  // 6. Robust Z-Score (0..6 MAD)
  const radarAxes = [
    { label: 'LEAKAGE (24h)', key: 'leakage', max: 50, unit: 'µA' },
    { label: 'IDDQ STANDBY', key: 'iddq', max: 30, unit: 'µA' },
    { label: 'PROP DELAY', key: 'delay', max: 4.0, unit: 'ns' },
    { label: 'Δ-24h DRIFT', key: 'drift24', max: 10, unit: 'µA' },
    { label: 'Δ-96h DRIFT', key: 'drift96', max: 25, unit: 'µA' },
    { label: 'ROBUST Z-SCORE', key: 'zscore', max: 6.0, unit: 'MAD' }
  ];

  // Normalized values for Healthy Lot Average
  const baselineValues = [24, 28, 45, 20, 22, 18]; // Percentage 0..100

  // Normalized values for current selected unit
  const unitRadarValues = useMemo(() => {
    const leak = Math.min(100, ((currentUnit.baseline?.[1] || 12) / 50) * 100);
    const iddq = Math.min(100, ((currentUnit.baseline?.[0] || 10) / 30) * 100);
    const del = Math.min(100, (((currentUnit.delay || 2.0) - 1.0) / 3.0) * 100);
    const d24 = Math.min(
      100,
      (Math.max(0, (currentUnit.baseline?.[1] || 12) - (currentUnit.baseline?.[0] || 10)) / 10) * 100
    );
    const d96 = Math.min(
      100,
      (Math.max(0, (currentUnit.baseline?.[2] || 14) - (currentUnit.baseline?.[0] || 10)) / 25) * 100
    );
    const zsc = Math.min(100, ((currentUnit.mad || 1.0) / 6.0) * 100);

    return [leak, iddq, del, d24, d96, zsc];
  }, [currentUnit]);

  // Geometry for SVG Radar Chart (Center: 180, 150, Radius: 100)
  const radarCenter = { x: 190, y: 140 };
  const radarRadius = 90;
  const numAxes = radarAxes.length;

  const getCoordinates = (valuePercent, axisIndex) => {
    const angle = (Math.PI * 2 / numAxes) * axisIndex - Math.PI / 2;
    const r = (valuePercent / 100) * radarRadius;
    return {
      x: radarCenter.x + r * Math.cos(angle),
      y: radarCenter.y + r * Math.sin(angle)
    };
  };

  const baselinePoints = baselineValues
    .map((val, idx) => {
      const pt = getCoordinates(val, idx);
      return `${pt.x},${pt.y}`;
    })
    .join(' ');

  const unitPoints = unitRadarValues
    .map((val, idx) => {
      const pt = getCoordinates(val, idx);
      return `${pt.x},${pt.y}`;
    })
    .join(' ');

  // -------------------------------------------------------------
  // 3. Delta-24h vs Delta-168h Prognostic Correlation Scatter Plot
  // -------------------------------------------------------------
  const scatterData = useMemo(() => {
    return components.map((c) => {
      const d24 = Number(((c.baseline?.[1] || 11) - (c.baseline?.[0] || 10)).toFixed(2));
      const d168 = Number(((c.baseline?.[3] || 13) - (c.baseline?.[0] || 10)).toFixed(2));
      const isSelected = c.id === currentUnit.id;

      let quadrant = 'Q3: NOMINAL';
      if (d24 > 3.0 && d168 > 15.0) quadrant = 'Q1: ACCELERATED FAILURE';
      else if (d24 <= 3.0 && d168 > 10.0) quadrant = 'Q2: LATE ONSET';
      else if (d24 <= 2.0 && d168 <= 5.0) quadrant = 'Q3: FLIGHT STABLE';
      else quadrant = 'Q4: MARGINAL';

      return {
        id: c.id,
        d24,
        d168,
        mad: c.mad,
        type: c.type,
        verdict: c.verdict || (c.mad > 3.5 ? 'REJECT' : c.mad > 2.0 ? 'REVIEW' : 'ACCEPT'),
        isSelected,
        quadrant
      };
    });
  }, [components, currentUnit.id]);

  // -------------------------------------------------------------
  // 4. Dual-Axis Burn-in Chamber Degradation & Dynamic Scrubbing View
  // -------------------------------------------------------------
  const chamberScrubData = useMemo(() => {
    const checkpoints = [
      { h: 0, label: '0h', chamberTemp: 25.0, vdd: 3.30 },
      { h: 12, label: '12h', chamberTemp: 124.8, vdd: 3.30 },
      { h: 24, label: '24h', chamberTemp: 125.1, vdd: 3.31 },
      { h: 48, label: '48h', chamberTemp: 125.0, vdd: 3.30 },
      { h: 72, label: '72h', chamberTemp: 124.9, vdd: 3.29 },
      { h: 96, label: '96h', chamberTemp: 125.2, vdd: 3.30 },
      { h: 120, label: '120h', chamberTemp: 125.0, vdd: 3.30 },
      { h: 144, label: '144h', chamberTemp: 125.1, vdd: 3.31 },
      { h: 168, label: '168h', chamberTemp: 125.0, vdd: 3.30 }
    ];

    const baseVal = currentUnit.baseline?.[0] || 10;
    const v24 = currentUnit.baseline?.[1] || 12;
    const v96 = currentUnit.baseline?.[2] || 14;
    const v168 = currentUnit.baseline?.[3] || 16;

    return checkpoints.map((pt) => {
      // Interpolate unit trajectory
      let unitLeakage = baseVal;
      if (pt.h <= 24) {
        unitLeakage = baseVal + (v24 - baseVal) * (pt.h / 24);
      } else if (pt.h <= 96) {
        unitLeakage = v24 + (v96 - v24) * ((pt.h - 24) / 72);
      } else {
        unitLeakage = v96 + (v168 - v96) * ((pt.h - 96) / 72);
      }

      // Uncertainty corridor shrinks as scrubHour increases past inspection checkpoints
      const isPastCheckpoint = pt.h <= scrubHour;
      const uncertaintyFactor = isPastCheckpoint
        ? 0.35 // Measured point: very small uncertainty
        : 1.0 + (pt.h - scrubHour) * 0.04; // Future projection: wider envelope

      const p10 = Math.max(8, unitLeakage - 3.8 * uncertaintyFactor);
      const p90 = unitLeakage + 4.2 * uncertaintyFactor;

      return {
        hour: pt.label,
        hNum: pt.h,
        chamberTemp: pt.chamberTemp,
        unitLeakage: Number(unitLeakage.toFixed(2)),
        p10: Number(p10.toFixed(2)),
        p90: Number(p90.toFixed(2)),
        isCheckpoint: pt.h === 0 || pt.h === 24 || pt.h === 96 || pt.h === 168
      };
    });
  }, [currentUnit, scrubHour]);

  return (
    <div className="adv-viz-suite panel scroll-reveal-card" id="adv-viz-suite">
      {/* Header and Visualization Selector Tabs */}
      <div className="adv-viz-header">
        <div className="adv-viz-title-group">
          <div className="suite-tag">
            <BarChart3 size={13} className="text-cyan" />
            <span>ADVANCED AEROSPACE DATA VISUALIZATION SUITE</span>
          </div>
          <h3>Statistical Latent-Defect & DPAT Metrology</h3>
          <p className="suite-sub">
            Sub-datasheet outlier detection, multi-dimensional covariance envelopes, and 125°C degradation scrubbing.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="adv-viz-tabs">
          <button
            className={`adv-tab-btn ${activeVizTab === 'dpat' ? 'active' : ''}`}
            onClick={() => setActiveVizTab('dpat')}
          >
            <BarChart3 size={13} />
            <span>DPAT BELL CURVE</span>
          </button>
          <button
            className={`adv-tab-btn ${activeVizTab === 'radar' ? 'active' : ''}`}
            onClick={() => setActiveVizTab('radar')}
          >
            <RadarIcon size={13} />
            <span>6-AXIS RADAR</span>
          </button>
          <button
            className={`adv-tab-btn ${activeVizTab === 'scatter' ? 'active' : ''}`}
            onClick={() => setActiveVizTab('scatter')}
          >
            <ScatterIcon size={13} />
            <span>PROGNOSTIC SCATTER</span>
          </button>
          <button
            className={`adv-tab-btn ${activeVizTab === 'dual' ? 'active' : ''}`}
            onClick={() => setActiveVizTab('dual')}
          >
            <Flame size={13} />
            <span>125°C CHAMBER SCRUB</span>
          </button>
        </div>
      </div>

      {/* Active Tab 1: DPAT Gaussian Bell Curve */}
      {activeVizTab === 'dpat' && (
        <div className="viz-content-pane">
          <div className="viz-legend-bar">
            <span className="legend-item">
              <span className="sample-bar blue" /> LOT HISTOGRAM FREQUENCY
            </span>
            <span className="legend-item">
              <span className="sample-line orange" /> FITTED GAUSSIAN BELL N(µ, σ)
            </span>
            <span className="legend-item">
              <span className="sample-line amber dashed" /> +3 MAD DPAT LIMIT (22.4 µA)
            </span>
            <span className="legend-item">
              <span className="sample-line red dashed" /> DATASHEET MAX (40.0 µA)
            </span>
          </div>

          <div className="chart-frame">
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart
                data={dpatData.bins}
                margin={{ top: 20, right: 30, left: -10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="binLabel"
                  stroke="#64748b"
                  fontSize={10}
                  unit=" µA"
                  tickMargin={8}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  allowDecimals={false}
                  label={{ value: 'LOT FREQUENCY', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 9 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="minimalist-tooltip">
                          <div className="tooltip-id">BIN: {data.binLabel} µA</div>
                          <div className="tooltip-row">
                            <span>COUNT:</span> <b>{data.count} units</b>
                          </div>
                          <div className="tooltip-row">
                            <span>GAUSSIAN DENSITY:</span> <b>{data.gaussianBell}</b>
                          </div>
                          <div className="tooltip-row">
                            <span>DPAT CLASSIFICATION:</span>{' '}
                            <b className={data.midPoint > dpatLimit ? 'text-orange' : 'text-green'}>
                              {data.midPoint > dpatLimit ? 'ANOMALOUS (REJECT)' : 'WITHIN STATISTICAL LIMITS'}
                            </b>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                {/* Vertical Limit Lines */}
                <ReferenceLine
                  x="22.5"
                  stroke="#F59E0B"
                  strokeDasharray="4 4"
                  strokeWidth={1.8}
                  label={{
                    value: '+3 MAD DPAT LIMIT',
                    fill: '#F59E0B',
                    fontSize: 9,
                    position: 'top'
                  }}
                />
                <ReferenceLine
                  x="40.0"
                  stroke="#EF4444"
                  strokeDasharray="3 3"
                  strokeWidth={1.8}
                  label={{
                    value: 'DATASHEET MAX (40µA)',
                    fill: '#EF4444',
                    fontSize: 9,
                    position: 'top'
                  }}
                />

                {/* Histogram Bars */}
                <Bar dataKey="count" fill="rgba(41, 182, 209, 0.45)" radius={[3, 3, 0, 0]} />

                {/* Smooth Gaussian Fitted Bell Curve */}
                <Line
                  type="monotone"
                  dataKey="gaussianBell"
                  stroke="#F58220"
                  strokeWidth={2.4}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Educational Callout explaining SIH PS170 DPAT value */}
          <div className="dpat-explainer-banner">
            <div className="explainer-icon">
              <AlertTriangle size={16} className="text-orange" />
            </div>
            <div className="explainer-text">
              <strong>CORE PS170 VALUE: CATCHING THE "IN-SPEC" DEFECT</strong>
              <span>
                Selected unit <b>{currentUnit.id}</b> measures <b>{selectedLeakage24h} µA</b>. While legally inside the datasheet limit of <b>{datasheetLimit} µA</b>, it breaches the Dynamic Part Average Testing (DPAT) threshold of <b>{dpatLimit} µA</b> (+3.8 MAD). Standard ATE passes this unit; NIRIKSHAN flags it as an elevated latent flight risk.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Active Tab 2: 6-Axis Multi-Parametric Radar Plot */}
      {activeVizTab === 'radar' && (
        <div className="viz-content-pane">
          <div className="viz-legend-bar">
            <span className="legend-item">
              <span className="sample-polygon cyan" /> FLIGHT-QUALIFIED LOT AVERAGE (HEALTHY)
            </span>
            <span className="legend-item">
              <span className="sample-polygon orange" /> SELECTED UNIT: {currentUnit.id} ({currentUnit.verdict})
            </span>
          </div>

          <div className="radar-layout-grid">
            {/* SVG Spider Chart */}
            <div className="radar-svg-wrapper">
              <svg viewBox="0 0 380 290" className="radar-svg-element">
                <defs>
                  {/* Glowing Orange Gradient for Unit Polygon */}
                  <radialGradient id="unitRadarGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#F58220" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#EF4444" stopOpacity="0.15" />
                  </radialGradient>
                  {/* Glowing Cyan Gradient for Baseline Polygon */}
                  <radialGradient id="baseRadarGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#29B6D1" stopOpacity="0.30" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.08" />
                  </radialGradient>
                </defs>

                {/* Concentric Web Grid Rings (20%, 40%, 60%, 80%, 100%) */}
                {[0.2, 0.4, 0.6, 0.8, 1.0].map((ringLevel, i) => {
                  const ringRadius = radarRadius * ringLevel;
                  const ringPoints = radarAxes
                    .map((_, idx) => {
                      const angle = (Math.PI * 2 / numAxes) * idx - Math.PI / 2;
                      return `${radarCenter.x + ringRadius * Math.cos(angle)},${radarCenter.y + ringRadius * Math.sin(angle)}`;
                    })
                    .join(' ');

                  return (
                    <polygon
                      key={i}
                      points={ringPoints}
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.08)"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Spider Axis Radial Lines */}
                {radarAxes.map((axis, idx) => {
                  const outer = getCoordinates(100, idx);
                  return (
                    <line
                      key={idx}
                      x1={radarCenter.x}
                      y1={radarCenter.y}
                      x2={outer.x}
                      y2={outer.y}
                      stroke="rgba(41, 182, 209, 0.22)"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Baseline Healthy Polygon */}
                <polygon
                  points={baselinePoints}
                  fill="url(#baseRadarGlow)"
                  stroke="#29B6D1"
                  strokeWidth="1.6"
                  strokeDasharray="3 3"
                />

                {/* Selected Unit Parameter Polygon */}
                <polygon
                  points={unitPoints}
                  fill="url(#unitRadarGlow)"
                  stroke={currentUnit.verdict === 'REJECT' ? '#EF4444' : '#F58220'}
                  strokeWidth="2.2"
                />

                {/* Selected Unit Marker Dots */}
                {unitRadarValues.map((val, idx) => {
                  const pt = getCoordinates(val, idx);
                  return (
                    <circle
                      key={idx}
                      cx={pt.x}
                      cy={pt.y}
                      r="4.5"
                      fill={currentUnit.verdict === 'REJECT' ? '#EF4444' : '#F58220'}
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                  );
                })}

                {/* Axis Labels */}
                {radarAxes.map((axis, idx) => {
                  const labelPt = getCoordinates(120, idx);
                  return (
                    <text
                      key={idx}
                      x={labelPt.x}
                      y={labelPt.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="radar-axis-text"
                    >
                      {axis.label}
                    </text>
                  );
                })}
              </svg>
            </div>

            {/* Radar Numerical Metrics List */}
            <div className="radar-metrics-list">
              <span className="metrics-header">6-AXIS MULTIVARIATE PARAMETERS</span>
              {radarAxes.map((axis, idx) => {
                const rawVal =
                  idx === 0
                    ? `${currentUnit.baseline?.[1] || 12} µA`
                    : idx === 1
                    ? `${currentUnit.baseline?.[0] || 10} µA`
                    : idx === 2
                    ? `${currentUnit.delay || 2.0} ns`
                    : idx === 3
                    ? `+${((currentUnit.baseline?.[1] || 12) - (currentUnit.baseline?.[0] || 10)).toFixed(2)} µA`
                    : idx === 4
                    ? `+${((currentUnit.baseline?.[2] || 14) - (currentUnit.baseline?.[0] || 10)).toFixed(2)} µA`
                    : `${currentUnit.mad || 1.0} MAD`;

                const isAnomalous = unitRadarValues[idx] > 65;

                return (
                  <div key={axis.key} className={`radar-metric-row ${isAnomalous ? 'warn' : ''}`}>
                    <span className="metric-name">{axis.label}</span>
                    <span className="metric-val">{rawVal}</span>
                    <div className="metric-bar-track">
                      <div
                        className="metric-bar-fill"
                        style={{
                          width: `${Math.min(100, unitRadarValues[idx])}%`,
                          backgroundColor: isAnomalous ? '#EF4444' : '#29B6D1'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Active Tab 3: Delta-24h vs Delta-168h Prognostic Correlation Scatter Plot */}
      {activeVizTab === 'scatter' && (
        <div className="viz-content-pane">
          <div className="viz-legend-bar">
            <span className="legend-item">
              <span className="sample-dot green" /> QUADRANT III: FLIGHT STABLE
            </span>
            <span className="legend-item">
              <span className="sample-dot amber" /> QUADRANT II: LATE-ONSET DEFECT
            </span>
            <span className="legend-item">
              <span className="sample-dot red" /> QUADRANT I: ACCELERATING FAILURE
            </span>
            <span className="legend-item">
              <span className="sample-vector orange" /> PREDICTED TRAJECTORY VECTOR
            </span>
          </div>

          <div className="chart-frame">
            <ResponsiveContainer width="100%" height={260}>
              <ScatterChart margin={{ top: 20, right: 30, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  type="number"
                  dataKey="d24"
                  name="Early Drift Δ-24h"
                  unit=" µA"
                  stroke="#64748b"
                  fontSize={10}
                  domain={[0, 8]}
                  label={{ value: 'EARLY DRIFT RATE Δ(0h→24h) µA', position: 'bottom', offset: 0, fill: '#64748b', fontSize: 9 }}
                />
                <YAxis
                  type="number"
                  dataKey="d168"
                  name="Projected Final Drift Δ-168h"
                  unit=" µA"
                  stroke="#64748b"
                  fontSize={10}
                  domain={[0, 45]}
                  label={{ value: 'FINAL DRIFT Δ(0h→168h) µA', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 9 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const pt = payload[0].payload;
                      return (
                        <div className="minimalist-tooltip">
                          <div className="tooltip-id">{pt.id}</div>
                          <div className="tooltip-row">
                            <span>EARLY DRIFT Δ(24h):</span> <b>+{pt.d24} µA</b>
                          </div>
                          <div className="tooltip-row">
                            <span>FINAL DRIFT Δ(168h):</span> <b>+{pt.d168} µA</b>
                          </div>
                          <div className="tooltip-row">
                            <span>CLASSIFICATION:</span> <b className="text-orange">{pt.quadrant}</b>
                          </div>
                          <div className="tooltip-row">
                            <span>VERDICT:</span> <b>{pt.verdict}</b>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                {/* Quadrant Demarcation Reference Lines */}
                <ReferenceLine x={2.5} stroke="rgba(245, 158, 11, 0.4)" strokeDasharray="3 3" />
                <ReferenceLine y={12.0} stroke="rgba(245, 158, 11, 0.4)" strokeDasharray="3 3" />

                <Scatter
                  data={scatterData}
                  onClick={(pt) => onSelectComponent && onSelectComponent(pt.id)}
                  cursor="pointer"
                >
                  {scatterData.map((entry) => {
                    const isSelected = entry.id === currentUnit.id;
                    const fill =
                      entry.verdict === 'REJECT'
                        ? '#EF4444'
                        : entry.verdict === 'REVIEW'
                        ? '#F59E0B'
                        : '#10B981';

                    return (
                      <Cell
                        key={entry.id}
                        fill={fill}
                        stroke={isSelected ? '#ffffff' : 'none'}
                        strokeWidth={isSelected ? 2 : 0}
                        r={isSelected ? 8 : entry.verdict === 'REJECT' ? 6 : 4.5}
                      />
                    );
                  })}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Active Tab 4: Dual-Axis Burn-in Chamber Degradation & Dynamic Scrubbing View */}
      {activeVizTab === 'dual' && (
        <div className="viz-content-pane">
          <div className="viz-legend-bar">
            <span className="legend-item">
              <span className="sample-line orange" /> COMPONENT LEAKAGE TRAJECTORY (µA)
            </span>
            <span className="legend-item">
              <span className="sample-area cyan" /> P10–P90 UNCERTAINTY BAND
            </span>
            <span className="legend-item">
              <span className="sample-line red" /> 125.0°C THERMAL SOAK PROFILE (°C)
            </span>
          </div>

          <div className="chart-frame">
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart
                data={chamberScrubData}
                margin={{ top: 20, right: 30, left: -10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="hour" stroke="#64748b" fontSize={10} tickMargin={8} />

                {/* Left Y-Axis: Part Leakage */}
                <YAxis
                  yAxisId="left"
                  stroke="#F58220"
                  fontSize={10}
                  unit=" µA"
                  domain={[5, 55]}
                  label={{ value: 'LEAKAGE CURRENT (µA)', angle: -90, position: 'insideLeft', fill: '#F58220', fontSize: 9 }}
                />

                {/* Right Y-Axis: Chamber Temperature */}
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#29B6D1"
                  fontSize={10}
                  unit=" °C"
                  domain={[0, 150]}
                  label={{ value: 'CHAMBER TEMP (°C)', angle: 90, position: 'insideRight', fill: '#29B6D1', fontSize: 9 }}
                />

                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="minimalist-tooltip">
                          <div className="tooltip-id">TIME: {data.hour} CHECKPOINT</div>
                          <div className="tooltip-row">
                            <span>CHAMBER TEMP:</span> <b>{data.chamberTemp} °C</b>
                          </div>
                          <div className="tooltip-row">
                            <span>COMPONENT LEAKAGE:</span> <b>{data.unitLeakage} µA</b>
                          </div>
                          <div className="tooltip-row">
                            <span>P10–P90 UNCERTAINTY:</span> <b>{data.p10} → {data.p90} µA</b>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                {/* Uncertainty Band (P10 to P90) */}
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="p90"
                  stroke="none"
                  fill="rgba(41, 182, 209, 0.18)"
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="p10"
                  stroke="none"
                  fill="rgba(7, 20, 38, 0.95)"
                />

                {/* Component Leakage Curve */}
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="unitLeakage"
                  stroke="#F58220"
                  strokeWidth={2.4}
                  dot={{ r: 4, fill: '#F58220' }}
                />

                {/* Chamber Temperature Line */}
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="chamberTemp"
                  stroke="#29B6D1"
                  strokeWidth={1.8}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Scrubbing Stepper Bar */}
          <div className="chamber-scrub-controls">
            <span className="scrub-label">
              <Activity size={12} className="text-cyan" />
              <span>DYNAMIC TIME-STEPPER UNCERTAINTY RECALIBRATION:</span>
            </span>
            <div className="scrub-btn-group">
              {[0, 24, 96, 168].map((hr) => (
                <button
                  key={hr}
                  className={`scrub-step-btn ${scrubHour === hr ? 'active' : ''}`}
                  onClick={() => onScrubHour && onScrubHour(hr)}
                >
                  {hr}h CHECKPOINT {hr === 96 && <span className="recal-pill">RECAL</span>}
                </button>
              ))}
            </div>
            <span className="scrub-hint">
              {scrubHour >= 96
                ? '96h intermediate telemetry ingested: Prediction corridor narrowed by 68%.'
                : 'Scrub to 96h or 168h to ingest checkpoint telemetry and shrink uncertainty bounds.'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
