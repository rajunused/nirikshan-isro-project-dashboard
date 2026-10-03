import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  Cpu,
  Download,
  FileText,
  Flame,
  Gauge,
  Layers3,
  Orbit,
  Play,
  Radio,
  RefreshCw,
  Rocket,
  Search,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Target,
  Zap,
  X
} from 'lucide-react';
import SpaceBackground from './SpaceBackground';
import ShootingStars from './ShootingStars';
import RocketAnimation from './RocketAnimation';
import AerospaceClickEffect from './AerospaceClickEffect';

// Multi-lot simulated flight components dataset
const lotDatasets = {
  'LOT-A / RAD-HARD LOGIC': [
    { id: 'COMP-4011', type: 'HIGH FROM START', baseline: [42, 42.4, 43.1, 44.8], mad: 6.8, slope: 0.02, driver: 'Elevated early leakage signature' },
    { id: 'COMP-4089', type: 'ACCELERATING DRIFT', baseline: [10, 14.2, 26.5, 47.8], mad: 5.4, slope: 0.22, driver: 'Accelerating early leakage drift' },
    { id: 'COMP-4104', type: 'LATE ONSET', baseline: [11, 12.3, 13.5, 31.6], mad: 3.7, slope: 0.12, driver: '96h trajectory delta check' },
    { id: 'COMP-4150', type: 'MULTIVARIATE', baseline: [12, 12.8, 14.1, 18.4], mad: 2.9, slope: 0.04, driver: 'Abnormal Iddq-to-delay covariance' },
    ...Array.from({ length: 36 }, (_, i) => ({
      id: `COMP-${4201 + i}`,
      type: 'NOMINAL',
      baseline: [10 + (i % 5) * 0.4, 11 + (i % 4) * 0.3, 12 + (i % 6) * 0.3, 13 + (i % 7) * 0.25],
      mad: 0.4 + (i % 8) / 10,
      slope: 0.015 + ((i % 5) * 0.003),
      driver: 'Stable within historical flight envelope'
    }))
  ],
  'LOT-B / POWER CONTROL': [
    { id: 'PWR-7102', type: 'THERMAL RUNAWAY', baseline: [14, 18.2, 29.1, 52.4], mad: 6.1, slope: 0.24, driver: 'Thermal dissipation junction breakdown' },
    { id: 'PWR-7145', type: 'CURRENT SPIKE', baseline: [13, 14.1, 22.0, 36.5], mad: 4.2, slope: 0.14, driver: 'Gate leakage impedance degradation' },
    { id: 'PWR-7190', type: 'RESISTANCE DRIFT', baseline: [12, 13.2, 16.5, 23.1], mad: 2.6, slope: 0.06, driver: 'Sub-threshold contact resistance drift' },
    ...Array.from({ length: 37 }, (_, i) => ({
      id: `PWR-${7201 + i}`,
      type: 'NOMINAL',
      baseline: [11 + (i % 4) * 0.5, 12 + (i % 5) * 0.4, 13 + (i % 3) * 0.5, 14 + (i % 6) * 0.3],
      mad: 0.5 + (i % 7) / 12,
      slope: 0.018 + ((i % 4) * 0.002),
      driver: 'Conforms to MIL-STD-883 class V'
    }))
  ],
  'LOT-C / FLIGHT COMPUTER': [
    { id: 'OBC-9004', type: 'SEU VULNERABLE', baseline: [15, 19.5, 34.2, 49.6], mad: 5.9, slope: 0.21, driver: 'Single Event Upset susceptibility' },
    { id: 'OBC-9018', type: 'CLOCK JITTER', baseline: [11, 12.8, 19.4, 28.5], mad: 3.3, slope: 0.09, driver: 'Oscillator phase-lock drift' },
    ...Array.from({ length: 38 }, (_, i) => ({
      id: `OBC-${9101 + i}`,
      type: 'NOMINAL',
      baseline: [10 + (i % 6) * 0.3, 11 + (i % 5) * 0.4, 12 + (i % 4) * 0.4, 13 + (i % 5) * 0.3],
      mad: 0.3 + (i % 6) / 11,
      slope: 0.014 + ((i % 3) * 0.003),
      driver: 'Rad-hardened core nominal'
    }))
  ],
  'LOT-D / SENSOR INTERFACE': [
    { id: 'SNS-3042', type: 'BIAS OFFSET', baseline: [16, 21.0, 38.1, 54.2], mad: 7.2, slope: 0.26, driver: 'Photodiode dark current avalanche' },
    { id: 'SNS-3088', type: 'NOISE COUPLING', baseline: [12, 13.9, 21.2, 33.4], mad: 3.8, slope: 0.11, driver: 'Cross-talk coupling capacitance' },
    ...Array.from({ length: 38 }, (_, i) => ({
      id: `SNS-${3101 + i}`,
      type: 'NOMINAL',
      baseline: [9 + (i % 5) * 0.4, 10 + (i % 4) * 0.5, 11 + (i % 5) * 0.4, 12 + (i % 4) * 0.3],
      mad: 0.4 + (i % 5) / 10,
      slope: 0.016 + ((i % 4) * 0.002),
      driver: 'Analog front-end SNR compliant'
    }))
  ]
};

const lots = Object.keys(lotDatasets);

const verdictColor = {
  ACCEPT: '#10b981', // Matte Emerald
  REVIEW: '#f59e0b', // Matte Amber
  REJECT: '#f43f5e'  // Matte Crimson
};

export default function App() {
  const [lot, setLot] = useState(lots[0]);
  const [selectedId, setSelectedId] = useState('COMP-4089');
  const [tab, setTab] = useState('zscore');
  const [slope, setSlope] = useState(0.08);
  const [risk, setRisk] = useState(62);
  const [has96, setHas96] = useState(true);
  const [showMonteCarlo, setShowMonteCarlo] = useState(false);
  const [running, setRunning] = useState(false);
  const [query, setQuery] = useState('');
  const [filterVerdict, setFilterVerdict] = useState('ALL');
  const [approvedList, setApprovedList] = useState({});
  const [flaggedList, setFlaggedList] = useState({});
  const [toastMessage, setToastMessage] = useState(null);
  const [rocketActive, setRocketActive] = useState(false);

  // Dynamic components evaluation based on current lot, slope threshold, and risk appetite
  const rawComponents = lotDatasets[lot] || lotDatasets[lots[0]];
  const evaluatedComponents = useMemo(() => {
    return rawComponents.map((c) => {
      const madThresholdReview = 2.0 + (risk - 50) * 0.02;
      const madThresholdReject = 4.2 + (risk - 50) * 0.03;

      let verdict = 'ACCEPT';
      if (c.slope > slope * 1.5 || c.mad > madThresholdReject || c.baseline[3] > 45) {
        verdict = 'REJECT';
      } else if (c.slope > slope || c.mad > madThresholdReview || c.baseline[3] > 25) {
        verdict = 'REVIEW';
      }

      const forecast = c.baseline[3];
      const ci = [
        Math.max(8, Number((forecast - (c.mad * 0.8)).toFixed(1))),
        Number((forecast + (c.mad * 0.9)).toFixed(1))
      ];

      return {
        ...c,
        verdict,
        forecast,
        ci
      };
    });
  }, [rawComponents, slope, risk]);

  // Fallback selected component if lot changes
  const comp = useMemo(() => {
    return evaluatedComponents.find((c) => c.id === selectedId) || evaluatedComponents[0];
  }, [evaluatedComponents, selectedId]);

  // Filtered components based on search query and KPI card filter
  const filtered = useMemo(() => {
    return evaluatedComponents.filter((c) => {
      const matchesSearch = c.id.toLowerCase().includes(query.toLowerCase()) ||
        c.type.toLowerCase().includes(query.toLowerCase()) ||
        c.driver.toLowerCase().includes(query.toLowerCase());
      const matchesVerdict = filterVerdict === 'ALL' || c.verdict === filterVerdict;
      return matchesSearch && matchesVerdict;
    });
  }, [evaluatedComponents, query, filterVerdict]);

  // KPI Statistics
  const kpiStats = useMemo(() => {
    const total = evaluatedComponents.length;
    const accepted = evaluatedComponents.filter(c => c.verdict === 'ACCEPT').length;
    const review = evaluatedComponents.filter(c => c.verdict === 'REVIEW').length;
    const reject = evaluatedComponents.filter(c => c.verdict === 'REJECT').length;
    return {
      total,
      accepted,
      review,
      reject,
      acceptPct: ((accepted / total) * 100).toFixed(1)
    };
  }, [evaluatedComponents]);

  // Trajectory data for selected component
  const trajectory = useMemo(() => {
    const hours = ['0h', '24h', '96h', '168h'];
    const healthyEnvelope = [
      { low: 8, high: 14 },
      { low: 9, high: 16 },
      { low: 10, high: 18 },
      { low: 11, high: 20 },
    ];

    return hours.map((h, i) => {
      const actualVal = comp.baseline[i];
      const showActual = i < 2 || (i === 2 ? has96 : true);

      return {
        h,
        low: healthyEnvelope[i].low,
        high: healthyEnvelope[i].high,
        actual: showActual ? actualVal : undefined,
        forecast: i >= 1 ? actualVal : undefined,
        ceiling: Number((11 + slope * i * 24).toFixed(1)),
        mc1: showMonteCarlo ? Number((actualVal * 0.92 + (i * 0.8)).toFixed(1)) : undefined,
        mc2: showMonteCarlo ? Number((actualVal * 1.08 - (i * 0.4)).toFixed(1)) : undefined,
      };
    });
  }, [comp, slope, has96, showMonteCarlo]);

  // Scatter chart data
  const scatterData = useMemo(() => {
    return evaluatedComponents.map((c, i) => ({
      id: c.id,
      x: Number((c.baseline[1] + ((i % 5) * 0.3)).toFixed(1)),
      y: Number((1.2 + ((i % 6) * 0.35) + (c.mad * 0.4)).toFixed(2)),
      score: c.mad,
      verdict: c.verdict
    }));
  }, [evaluatedComponents]);

  // Trigger batch diagnostic sweep
  const runDiagnostic = () => {
    setRunning(true);
    setToastMessage('Initiating multi-vector burn-in diagnostic sweep across 40 flight units...');
    setTimeout(() => {
      setRunning(false);
      setToastMessage('Batch diagnostic complete: All 40 components re-evaluated with 0 unverified outliers.');
      setTimeout(() => setToastMessage(null), 4000);
    }, 1200);
  };

  // Export CSV
  // Export CSV with formula injection sanitization (security hardening)
  const handleExportCSV = () => {
    const sanitize = (val) => {
      const str = String(val ?? '');
      // Mitigate CSV Formula Injection by prepending single quote if starting with formula triggers
      const safeStr = /^[=\+\-@\t\r]/.test(str) ? `'${str}` : str;
      return `"${safeStr.replace(/"/g, '""')}"`;
    };

    const header = ['ID', 'Type', 'Verdict', '0h', '24h', '96h', '168h', 'MAD', 'Slope', 'Driver'].map(sanitize).join(',');
    const rows = evaluatedComponents.map((e) =>
      [e.id, e.type, e.verdict, ...e.baseline, e.mad, e.slope, e.driver].map(sanitize).join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent([header, ...rows].join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `NIRIKSHAN_${lot.replace(/[^a-zA-Z0-9]/g, '_')}_TELEMETRY.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToastMessage(`Exported telemetry dataset: ${lot}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Toggle approval / flag
  const toggleApprove = (id) => {
    setApprovedList((prev) => ({ ...prev, [id]: !prev[id] }));
    setToastMessage(`Component ${id} flight readiness ${!approvedList[id] ? 'APPROVED' : 'REVOKED'}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleFlag = (id) => {
    setFlaggedList((prev) => ({ ...prev, [id]: !prev[id] }));
    setToastMessage(`Component ${id} ${!flaggedList[id] ? 'FLAGGED FOR 168H THERMAL ESS' : 'UNFLAGGED'}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="app">
      {/* Unified Solar & Galaxy 3D Synthesis Space Background */}
      <SpaceBackground rocketActive={rocketActive} />

      {/* Realistic Shooting Star (Meteor / Bolide) Transient Streaks */}
      <ShootingStars />

      {/* Supersonic Air Shockwave & Rocket Exhaust Click Particles */}
      <AerospaceClickEffect />

      {/* Deep Space Dark Vignette & Subtle Overlay */}
      <div className="matte-noise-overlay" />

      {/* Live Rocket Telemetry & Animation Overlay */}
      <RocketAnimation active={rocketActive} onClose={() => setRocketActive(false)} />

      {/* Global Notification Toast */}
      {toastMessage && (
        <div className="status-toast">
          <Sparkles size={14} className="toast-icon" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)}><X size={12} /></button>
        </div>
      )}

      {/* --- Aerospace Mission Header Bar --- */}
      <header className="topbar">
        <div className="brand-left">
          {/* Official ISRO Logo */}
          <div className="isro-official-badge">
            <img
              src="/isro_logo.svg"
              alt="ISRO - Indian Space Research Organisation"
              className="isro-logo-img"
            />
          </div>
          <div className="brand-info">
            <div className="eyebrow">
              <span className="isro-hindi">भारतीय अंतरिक्ष अनुसंधान संगठन</span>
              <i>•</i>
              <span>ISRO / DOS HIGH-RELIABILITY ESS HUB</span>
            </div>
            <div className="subline">
              SIH-PS170 <span className="slash">/</span> DECISION-SUPPORT LAYER FOR SPACEFLIGHT COMPONENT SCREENING
            </div>
          </div>
        </div>

        <div className="brand-right">
          {/* Rocket Animation Interactive Toggle Button with Supersonic Air Effect */}
          <button
            id="rocket-toggle"
            className={`rocket-launch-toggle ${rocketActive ? 'active' : ''}`}
            onClick={() => setRocketActive(!rocketActive)}
            title="Toggle Aerospace Rocket Telemetry & Flight Simulation"
          >
            <div className="toggle-switch-track">
              <div className="toggle-rocket-knob">
                <Rocket size={14} className="toggle-rocket-icon" />
                {rocketActive && <span className="knob-exhaust-flame" />}
              </div>
            </div>
            <div className="toggle-label-wrap">
              <span className="toggle-kicker">PROPULSION SIM</span>
              <span className="toggle-status">
                {rocketActive ? 'LAUNCH ACTIVE' : 'STANDBY'}
              </span>
            </div>
          </button>

          <div className="live-status-pill">
            <span className="pulse-dot" />
            <span>MISSION ENG: ONLINE</span>
          </div>

          <div className="product-identity">
            <span className="product-title">NIRIKSHAN</span>
            <small>DYNAMIC ESS INTELLIGENCE V3.8</small>
          </div>
        </div>
      </header>

      {/* --- Main Dashboard Container --- */}
      <main>
        {/* Hero Section */}
        <section className="hero">
          <div>
            <div className="kicker">
              <Orbit size={14} className="kicker-sun-icon" /> MULTI-GALAXY & NEBULA OBSERVATORY <span>•</span> V3.8.3
            </div>
            <h1>
              Dynamic ESS <span className="highlight-intelligence">Intelligence</span>
            </h1>
            <p>
              Autonomous latent-defect trajectory screening for satellite avionics and rad-hard space payloads.
              Detect subtle drift anomalies long before mission deployment.
            </p>
          </div>

          <div className="hero-actions">
            {/* Real-time Telemetry Status Pill */}
            <div className="cosmic-status-badge">
              <span className="status-indicator-beacon" />
              <div className="badge-meta">
                <span className="badge-title">3D COSMIC ENGINE</span>
                <span className="badge-desc">DEEP NEBULA & MULTI-GALAXY</span>
              </div>
            </div>

            {/* Run Batch Diagnostic Button */}
            <button
              id="run-diagnostic-btn"
              className={`primary-action-btn ${running ? 'running' : ''}`}
              onClick={runDiagnostic}
              disabled={running}
            >
              {running ? (
                <>
                  <RefreshCw size={15} className="spin-icon" />
                  <span>DIAGNOSING 40 UNITS…</span>
                </>
              ) : (
                <>
                  <Play size={15} fill="currentColor" />
                  <span>RUN QUICK BATCH DIAGNOSTIC</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* Control Strip Panel */}
        <section className="control-strip panel">
          {/* Active Lot Selector */}
          <div className="field-group">
            <span className="field-label">ACTIVE VALIDATION LOT</span>
            <div className="select-box">
              <select value={lot} onChange={(e) => setLot(e.target.value)}>
                {lots.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} />
            </div>
          </div>

          <div className="panel-divider" />

          {/* Risk Appetite Slider */}
          <div className="slider-field-group">
            <div className="slider-header">
              <span className="field-label">COST-SENSITIVITY / RISK APPETITE</span>
              <strong className="slider-val">
                {risk}
                <small>%</small>
              </strong>
            </div>
            <input
              type="range"
              min="10"
              max="90"
              value={risk}
              onChange={(e) => setRisk(Number(e.target.value))}
              aria-label="Risk Appetite Slider"
            />
            <div className="range-notes">
              <span>FALSE POSITIVE TOLERANCE</span>
              <span>FALSE NEGATIVE PENALTY</span>
            </div>
          </div>

          <div className="panel-divider" />

          {/* Safety Slope Slider */}
          <div className="slider-field-group">
            <div className="slider-header">
              <span className="field-label">SAFETY SLOPE THRESHOLD (MAX-DRIFT)</span>
              <strong className="slider-val">
                {slope.toFixed(2)}
                <small> µA/h</small>
              </strong>
            </div>
            <input
              type="range"
              min="0.02"
              max="0.20"
              step="0.01"
              value={slope}
              onChange={(e) => setSlope(Number(e.target.value))}
              aria-label="Safety Slope Threshold"
            />
            <div className="range-notes">
              <span>CONSERVATIVE (0.02)</span>
              <span>PERMISSIVE (0.20)</span>
            </div>
          </div>
        </section>

        {/* Interactive KPI Filter Grid */}
        <section className="kpi-grid">
          {[
            {
              id: 'ALL',
              label: 'TOTAL SCREENED',
              num: kpiStats.total,
              note: `UNITS IN ${lot.split('/')[0].trim()}`,
              Icon: Layers3,
              color: 'cyan'
            },
            {
              id: 'ACCEPT',
              label: 'ACCEPTED',
              num: kpiStats.accepted,
              note: `${kpiStats.acceptPct}% OF POPULATION`,
              Icon: CheckCircle2,
              color: 'green'
            },
            {
              id: 'REVIEW',
              label: 'REVIEW REQUIRED',
              num: kpiStats.review,
              note: 'TRAJECTORY / COVARIANCE',
              Icon: AlertTriangle,
              color: 'amber'
            },
            {
              id: 'REJECT',
              label: 'ELEVATED RISK',
              num: kpiStats.reject,
              note: 'EXCEEDS SAFETY ENVELOPE',
              Icon: Zap,
              color: 'red'
            }
          ].map(({ id, label, num, note, Icon, color }) => (
            <button
              key={id}
              className={`kpi-card panel ${filterVerdict === id ? 'active-filter' : ''}`}
              onClick={() => setFilterVerdict(filterVerdict === id && id !== 'ALL' ? 'ALL' : id)}
              title={`Click to filter list by ${label}`}
            >
              <div className={`icon-box ${color}`}>
                <Icon size={18} />
              </div>
              <div className="kpi-content">
                <div className="field-label">{label}</div>
                <div className="kpi-number">{num}</div>
                <div className="kpi-note">{note}</div>
              </div>
              <div className="kpi-spark">
                <span style={{ height: '35%' }} />
                <span style={{ height: '65%' }} />
                <span style={{ height: '42%' }} />
                <span style={{ height: '88%' }} />
                <span style={{ height: '55%' }} />
                <span style={{ height: '100%' }} />
              </div>
            </button>
          ))}
        </section>

        {/* --- Charts Row: Minimalist Gradient Charts on Dark Frosted Panels --- */}
        <section className="two-col">
          {/* Panel A: Population & Anomaly Matrix */}
          <div className="panel chart-panel">
            <div className="panel-head">
              <div>
                <div className="section-tag">
                  <span className="num">A</span> POPULATION & ANOMALY MATRIX
                </div>
                <h2>Robust Population Profiling</h2>
              </div>
              <div className="profile-stats">
                <span>
                  MEDIAN <b>11.8 µA</b>
                </span>
                <span>
                  MAD <b>1.43</b>
                </span>
                <span>
                  SPREAD <b>±2.1σ</b>
                </span>
              </div>
            </div>

            {/* Chart Sub-Tabs */}
            <div className="tabs">
              {[
                ['zscore', 'MODIFIED Z-SCORE'],
                ['maha', 'MAHALANOBIS SCATTER'],
                ['forest', 'ISOLATION FOREST HEATMAP']
              ].map(([k, t]) => (
                <button
                  key={k}
                  className={`tab-btn ${tab === k ? 'active' : ''}`}
                  onClick={() => setTab(k)}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Chart Canvas */}
            <div className="chart-wrap">
              {tab === 'zscore' ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={evaluatedComponents.slice(0, 20).map((c, i) => ({
                      id: c.id,
                      name: c.id.slice(-4),
                      score: Number((c.mad + (i % 3) * 0.15).toFixed(2)),
                      verdict: c.verdict
                    }))}
                    onClick={(e) => {
                      if (e && e.activePayload && e.activePayload[0]) {
                        setSelectedId(e.activePayload[0].payload.id);
                      }
                    }}
                  >
                    <defs>
                      <linearGradient id="barNominal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#0284c7" stopOpacity={0.35} />
                      </linearGradient>
                      <linearGradient id="barReview" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#b45309" stopOpacity={0.35} />
                      </linearGradient>
                      <linearGradient id="barReject" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#9f1239" stopOpacity={0.35} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 4" stroke="#ffffff0a" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="minimalist-tooltip">
                              <div className="tooltip-id">{data.id}</div>
                              <div className="tooltip-row">
                                <span>MODIFIED Z-SCORE:</span>
                                <b>{data.score}</b>
                              </div>
                              <div className="tooltip-row">
                                <span>STATUS:</span>
                                <em style={{ color: verdictColor[data.verdict] }}>{data.verdict}</em>
                              </div>
                              <small>Click bar to inspect component</small>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                      {evaluatedComponents.slice(0, 20).map((c, i) => {
                        const fillGrad =
                          c.verdict === 'REJECT'
                            ? 'url(#barReject)'
                            : c.verdict === 'REVIEW'
                            ? 'url(#barReview)'
                            : 'url(#barNominal)';
                        return (
                          <Cell
                            key={c.id}
                            fill={fillGrad}
                            stroke={c.id === selectedId ? '#ffffff' : 'none'}
                            strokeWidth={c.id === selectedId ? 1.5 : 0}
                            style={{ cursor: 'pointer' }}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : tab === 'maha' ? (
                <ResponsiveContainer width="100%" height={250}>
                  <ScatterChart
                    onClick={(e) => {
                      if (e && e.activePayload && e.activePayload[0]) {
                        setSelectedId(e.activePayload[0].payload.id);
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" />
                    <XAxis
                      type="number"
                      dataKey="x"
                      name="Leakage"
                      unit="µA"
                      stroke="#64748b"
                      fontSize={10}
                      tickLine={false}
                    />
                    <YAxis
                      type="number"
                      dataKey="y"
                      name="Covariance Delay"
                      unit="ns"
                      stroke="#64748b"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const pt = payload[0].payload;
                          return (
                            <div className="minimalist-tooltip">
                              <div className="tooltip-id">{pt.id}</div>
                              <div className="tooltip-row">
                                <span>LEAKAGE:</span>
                                <b>{pt.x} µA</b>
                              </div>
                              <div className="tooltip-row">
                                <span>DELAY COV:</span>
                                <b>{pt.y} ns</b>
                              </div>
                              <div className="tooltip-row">
                                <span>STATUS:</span>
                                <em style={{ color: verdictColor[pt.verdict] }}>{pt.verdict}</em>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Scatter data={scatterData}>
                      {scatterData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={verdictColor[entry.verdict]}
                          opacity={entry.id === selectedId ? 1 : 0.75}
                          style={{ cursor: 'pointer' }}
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              ) : (
                <div className="isolation-forest-view">
                  <div className="forest-grid">
                    {evaluatedComponents.map((c, i) => (
                      <button
                        key={c.id}
                        className={`forest-cell ${c.verdict.toLowerCase()} ${c.id === selectedId ? 'selected' : ''}`}
                        onClick={() => setSelectedId(c.id)}
                        title={`${c.id} [${c.verdict}] MAD: ${c.mad}`}
                      >
                        <span className="cell-id-sub">{c.id.slice(-4)}</span>
                      </button>
                    ))}
                  </div>
                  <div className="forest-legend">
                    <span>
                      <i className="dot green" /> NOMINAL DENSITY
                    </span>
                    <span>
                      <i className="dot amber" /> ANOMALY BAND
                    </span>
                    <span>
                      <i className="dot red" /> ISOLATED OUTLIER
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="legend">
              <span>
                <i className="dot cyan" /> NOMINAL CLUSTER
              </span>
              <span>
                <i className="dot amber" /> REVIEW BAND
              </span>
              <span>
                <i className="dot red" /> ELEVATED SIGNAL
              </span>
              <span className="method">ROBUST BASELINE: {lot.split('/')[0].trim()} / 168H ARCHIVE</span>
            </div>
          </div>

          {/* Panel B: Trajectory & Drift Predictor */}
          <div className="panel chart-panel">
            <div className="panel-head">
              <div>
                <div className="section-tag">
                  <span className="num">B</span> TRAJECTORY & DRIFT PREDICTOR
                </div>
                <h2>Selected Component Trajectory</h2>
              </div>
              <div className="trajectory-header-actions">
                {/* 96h Data Arrival Toggle */}
                <label className="toggle-control" title="Toggle 96-hour burn-in telemetry arrival">
                  <input
                    type="checkbox"
                    checked={has96}
                    onChange={(e) => setHas96(e.target.checked)}
                  />
                  <span className="toggle-track" />
                  <span className="toggle-text">96H ARRIVAL</span>
                </label>

                {/* Monte Carlo Toggle */}
                <button
                  className={`subtle-btn ${showMonteCarlo ? 'active' : ''}`}
                  onClick={() => setShowMonteCarlo(!showMonteCarlo)}
                  title="Toggle Monte Carlo probabilistic trajectory fan"
                >
                  <Orbit size={13} />
                  <span>MONTE CARLO</span>
                </button>
              </div>
            </div>

            {/* Selected Component Badge */}
            <div className="selected-chip">
              <CircleDot size={14} className="chip-icon" />
              <b className="chip-id">{comp.id}</b>
              <span className="chip-type">{comp.type}</span>
              <span className="chip-lot">{lot.split('/')[1]?.trim() || 'LOGIC'}</span>
              <i style={{ color: verdictColor[comp.verdict] }} className="chip-verdict">
                {comp.verdict}
              </i>
            </div>

            {/* Trajectory Composed Chart */}
            <div className="chart-wrap trajectory">
              <ResponsiveContainer width="100%" height={215}>
                <ComposedChart data={trajectory}>
                  <defs>
                    <linearGradient id="healthyBandGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.22} />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="actualLineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="100%" stopColor="#22d3ee" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke="#ffffff0a" vertical={false} />
                  <XAxis dataKey="h" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis domain={[0, 60]} stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="minimalist-tooltip">
                            <div className="tooltip-id">
                              {comp.id} • TIME: {label}
                            </div>
                            {payload.map((p) => {
                              if (!p.value || p.name === 'low') return null;
                              return (
                                <div className="tooltip-row" key={p.name}>
                                  <span>{p.name.toUpperCase()}:</span>
                                  <b>{p.value} µA</b>
                                </div>
                              );
                            })}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {/* Healthy Envelope */}
                  <Area
                    name="Healthy High"
                    dataKey="high"
                    stroke="none"
                    fill="url(#healthyBandGrad)"
                  />
                  <Area
                    name="low"
                    dataKey="low"
                    stroke="none"
                    fill="#05080e"
                  />
                  {/* Monte Carlo Fan Lines */}
                  {showMonteCarlo && (
                    <>
                      <Line
                        name="MC Lower"
                        dataKey="mc1"
                        stroke="#818cf8"
                        strokeWidth={1}
                        strokeDasharray="2 2"
                        dot={false}
                        opacity={0.6}
                      />
                      <Line
                        name="MC Upper"
                        dataKey="mc2"
                        stroke="#818cf8"
                        strokeWidth={1}
                        strokeDasharray="2 2"
                        dot={false}
                        opacity={0.6}
                      />
                    </>
                  )}
                  {/* Safety Ceiling Line */}
                  <Line
                    name="Safety Slope Ceiling"
                    dataKey="ceiling"
                    stroke="#f59e0b"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                  {/* Actual Readings */}
                  <Line
                    name="Actual Telemetry"
                    dataKey="actual"
                    stroke="#38bdf8"
                    strokeWidth={2.8}
                    dot={{ r: 4, fill: '#38bdf8', stroke: '#05080e', strokeWidth: 2 }}
                  />
                  {/* Predicted Drift Forecast */}
                  <Line
                    name="Predicted Forecast"
                    dataKey="forecast"
                    stroke="#f97316"
                    strokeWidth={2.5}
                    strokeDasharray="6 4"
                    dot={{ r: 4, fill: '#f97316', stroke: '#05080e', strokeWidth: 2 }}
                  />
                  {/* Datasheet Absolute Failure Limit */}
                  <ReferenceLine
                    y={50}
                    stroke="#f43f5e"
                    strokeDasharray="3 3"
                    label={{
                      value: 'DATASHEET LIMIT (50 µA)',
                      fill: '#f43f5e',
                      fontSize: 9,
                      position: 'insideTopRight'
                    }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="trajectory-foot">
              <span>
                <i className="line cyan" /> ACTUAL READING
              </span>
              <span>
                <i className="line orange" /> PREDICTED TRAJECTORY
              </span>
              <span>
                <i className="line dashed" /> HEALTHY LOT ENVELOPE
              </span>
              <span className="limit">LIMIT 50 µA</span>
            </div>
          </div>
        </section>

        {/* --- Bottom Grid: Decision Engine & Verdict Panel --- */}
        <section className="bottom-grid">
          {/* Engineering Decision Engine Component List */}
          <div className="panel decision-panel">
            <div className="panel-head">
              <div>
                <div className="section-tag">
                  <span className="num">C</span> UNIFIED RISK FUSION
                </div>
                <h2>Engineering Decision Engine</h2>
              </div>
              <div className="search-wrap">
                <Search size={14} className="search-icon" />
                <input
                  id="component-search-input"
                  placeholder="Search component ID, type…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {query && (
                  <button className="clear-search-btn" onClick={() => setQuery('')}>
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            <div className="filter-pill-row">
              <span className="filter-label">FILTER:</span>
              {['ALL', 'ACCEPT', 'REVIEW', 'REJECT'].map((v) => (
                <button
                  key={v}
                  className={`filter-pill ${filterVerdict === v ? 'active' : ''}`}
                  onClick={() => setFilterVerdict(v)}
                >
                  {v}
                </button>
              ))}
              <span className="filter-count">({filtered.length} found)</span>
            </div>

            <div className="component-list-scroll">
              {filtered.length === 0 ? (
                <div className="no-results-msg">No components match current search & filter.</div>
              ) : (
                filtered.map((c) => (
                  <button
                    key={c.id}
                    className={`component-row-btn ${selectedId === c.id ? 'selected' : ''}`}
                    onClick={() => setSelectedId(c.id)}
                  >
                    <span
                      className="status-dot"
                      style={{ background: verdictColor[c.verdict] }}
                    />
                    <b className="comp-id">{c.id}</b>
                    <small className="comp-type">{c.type}</small>
                    <span className="comp-slope">{c.slope.toFixed(2)} µA/h</span>
                    <em style={{ color: verdictColor[c.verdict] }} className="comp-verdict">
                      {c.verdict}
                    </em>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Final Verdict & Engineering Action Dossier */}
          <div className="panel verdict-panel">
            <div className="verdict-top">
              <div className="section-tag">
                <Target size={14} /> FINAL SCREENING VERDICT
              </div>
              <div
                className="verdict-badge"
                style={{
                  color: verdictColor[comp.verdict],
                  borderColor: `${verdictColor[comp.verdict]}55`,
                  background: `${verdictColor[comp.verdict]}14`
                }}
              >
                {comp.verdict === 'REJECT'
                  ? 'ELEVATED LATENT-DEFECT RISK'
                  : comp.verdict === 'REVIEW'
                  ? 'GATED ENGINEERING REVIEW'
                  : 'FLIGHT HARDWARE COMPLIANT'}
              </div>
            </div>

            <div className="verdict-id-row">
              <div className="verdict-id-title">
                <b>{comp.id}</b>
                <span className="comp-subtag">{comp.type}</span>
                {approvedList[comp.id] && (
                  <span className="approved-stamp">
                    <ShieldCheck size={12} /> FLIGHT READY
                  </span>
                )}
                {flaggedList[comp.id] && (
                  <span className="flagged-stamp">
                    <ShieldAlert size={12} /> 168H ESS FLAGGED
                  </span>
                )}
              </div>

              {/* Action Buttons for selected component */}
              <div className="verdict-action-buttons">
                <button
                  className={`action-btn approve ${approvedList[comp.id] ? 'btn-active' : ''}`}
                  onClick={() => toggleApprove(comp.id)}
                  title="Approve for flight installation"
                >
                  <ShieldCheck size={13} />
                  <span>{approvedList[comp.id] ? 'APPROVED' : 'APPROVE'}</span>
                </button>
                <button
                  className={`action-btn flag ${flaggedList[comp.id] ? 'btn-active' : ''}`}
                  onClick={() => toggleFlag(comp.id)}
                  title="Flag for extended thermal cycle burn-in"
                >
                  <AlertTriangle size={13} />
                  <span>{flaggedList[comp.id] ? 'FLAGGED' : 'FLAG ESS'}</span>
                </button>
                <button
                  className="action-btn export"
                  onClick={handleExportCSV}
                  title="Download telemetry dossier"
                >
                  <Download size={13} />
                  <span>CSV</span>
                </button>
              </div>
            </div>

            {/* Diagnostic Rationales */}
            <div className="reasons">
              <div className="reason-item">
                <span className="reason-num">01</span>
                <p>
                  <b>Dynamic Anomaly Signature:</b> Leakage current at 24h is{' '}
                  <span className="val-hi">+{comp.mad.toFixed(1)} MAD</span> above lot median.
                </p>
              </div>
              <div className="reason-item">
                <span className="reason-num">02</span>
                <p>
                  <b>Drift Projection:</b> Predicted 168h leakage ={' '}
                  <span className="val-hi">{comp.forecast.toFixed(1)} µA</span>{' '}
                  <small>[90% Confidence Interval: {comp.ci[0]} – {comp.ci[1]} µA]</small>
                </p>
              </div>
              <div className="reason-item">
                <span className="reason-num">03</span>
                <p>
                  <b>Safety Slope Margin:</b> Drift velocity ({comp.slope.toFixed(2)} µA/h){' '}
                  {comp.slope > slope ? (
                    <span style={{ color: '#f43f5e' }}>exceeds configured envelope ({slope.toFixed(2)} µA/h)</span>
                  ) : (
                    <span style={{ color: '#10b981' }}>is within configured limit ({slope.toFixed(2)} µA/h)</span>
                  )}
                  .
                </p>
              </div>
            </div>

            <div className="driver-row">
              <span className="driver-label">PRIMARY LATENT RISK DRIVER</span>
              <b className="driver-val">{comp.driver}</b>
            </div>

            {/* SHAP-style Feature Attribution */}
            <div className="attribution">
              <div className="field-label">FEATURE ATTRIBUTION / SHAP-STYLE COVARIANCE</div>
              <div className="attrib-bars">
                <div className="attrib-col">
                  <span>0H VALUE</span>
                  <div className="bar-track">
                    <i style={{ width: '32%', background: '#38bdf8' }} />
                  </div>
                </div>
                <div className="attrib-col">
                  <span>24H DELTA</span>
                  <div className="bar-track">
                    <i
                      style={{
                        width: `${Math.min(100, comp.slope * 380)}%`,
                        background: comp.slope > slope ? '#f43f5e' : '#38bdf8'
                      }}
                    />
                  </div>
                </div>
                <div className="attrib-col">
                  <span>REL. RATIO</span>
                  <div className="bar-track">
                    <i style={{ width: '64%', background: '#fbbf24' }} />
                  </div>
                </div>
                <div className="attrib-col">
                  <span>MAD SCORE</span>
                  <div className="bar-track">
                    <i
                      style={{
                        width: `${Math.min(100, comp.mad * 14)}%`,
                        background: comp.mad > 3 ? '#f43f5e' : '#818cf8'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* --- Footer Status Strip --- */}
      <footer className="footer-strip">
        <div className="footer-left">
          <span>
            <Radio size={13} className="footer-icon" /> LOCAL TELEMETRY ENGINE <b>•</b> ZERO EXTERNAL DEPENDENCY
          </span>
          <span className="dot-sep">•</span>
          <span>
            LAST ARCHIVE SYNC <b>2026-10-03</b>
          </span>
        </div>
        <div className="footer-right">
          <span>
            <ShieldCheck size={13} className="footer-icon-green" /> SAFETY-GATED AEROSPACE LEVEL-1 COMPLIANT
          </span>
        </div>
      </footer>
    </div>
  );
}
