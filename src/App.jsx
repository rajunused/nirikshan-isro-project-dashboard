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
  X,
  Thermometer,
  Clock,
  Printer,
  UserCheck,
  Globe,
  Info
} from 'lucide-react';

import SpaceBackground from './SpaceBackground';
import ShootingStars from './ShootingStars';
import RocketAnimation from './RocketAnimation';
import AerospaceClickEffect from './AerospaceClickEffect';
import IsroLogo from './IsroLogo';
import MonteCarloRocketDrawer from './MonteCarloRocketDrawer';
import SpaceNewsDrawer from './SpaceNewsDrawer';
import WaferSpatialMap from './WaferSpatialMap';
import ChamberMonitorModal from './ChamberMonitorModal';
import NonConformanceReportModal from './NonConformanceReportModal';
import ActionDispositionModal from './ActionDispositionModal';
import CommandSidebar from './CommandSidebar';

// Multi-lot simulated flight components dataset (MIL-STD-883 Class V Flight Hardware)
const lotDatasets = {
  'LOT-A / RAD-HARD LOGIC': [
    { id: 'COMP-4011', type: 'HIGH FROM START', baseline: [42, 42.4, 43.1, 44.8], mad: 6.8, slope: 0.02, delay: 1.82, driver: 'Elevated early leakage signature (Gate-oxide trap)' },
    { id: 'COMP-4089', type: 'ACCELERATING DRIFT', baseline: [10, 14.2, 26.5, 47.8], mad: 5.4, slope: 0.22, delay: 2.94, driver: 'Accelerating non-linear leakage drift under 125°C HTOL' },
    { id: 'COMP-4104', type: 'LATE ONSET', baseline: [11, 12.3, 13.5, 31.6], mad: 3.7, slope: 0.12, delay: 2.15, driver: '96h trajectory delta check: Latent channel trap creation' },
    { id: 'COMP-4150', type: 'MULTIVARIATE (TYPE 4)', baseline: [12, 12.8, 14.1, 18.4], mad: 2.9, slope: 0.04, delay: 3.42, driver: 'Abnormal Iddq-to-delay covariance (Breaks physical correlation)' },
    ...Array.from({ length: 36 }, (_, i) => ({
      id: `COMP-${4201 + i}`,
      type: 'NOMINAL',
      baseline: [10 + (i % 5) * 0.4, 11 + (i % 4) * 0.3, 12 + (i % 6) * 0.3, 13 + (i % 7) * 0.25],
      mad: 0.4 + (i % 8) / 10,
      slope: 0.015 + ((i % 5) * 0.003),
      delay: Number((1.70 + (i % 7) * 0.08).toFixed(2)),
      driver: 'Stable within historical flight envelope'
    }))
  ],
  'LOT-B / POWER CONTROL': [
    { id: 'PWR-7102', type: 'THERMAL RUNAWAY', baseline: [14, 18.2, 29.1, 52.4], mad: 6.1, slope: 0.24, delay: 3.12, driver: 'Thermal dissipation junction breakdown' },
    { id: 'PWR-7145', type: 'CURRENT SPIKE', baseline: [13, 14.1, 22.0, 36.5], mad: 4.2, slope: 0.14, delay: 2.80, driver: 'Gate leakage impedance degradation' },
    { id: 'PWR-7190', type: 'RESISTANCE DRIFT', baseline: [12, 13.2, 16.5, 23.1], mad: 2.6, slope: 0.06, delay: 2.45, driver: 'Sub-threshold contact resistance drift' },
    { id: 'PWR-7198', type: 'MULTIVARIATE (TYPE 4)', baseline: [13, 13.6, 14.8, 17.2], mad: 2.4, slope: 0.03, delay: 3.55, driver: 'Uncorrelated high delay with low Iddq' },
    ...Array.from({ length: 36 }, (_, i) => ({
      id: `PWR-${7201 + i}`,
      type: 'NOMINAL',
      baseline: [11 + (i % 4) * 0.5, 12 + (i % 5) * 0.4, 13 + (i % 3) * 0.5, 14 + (i % 6) * 0.3],
      mad: 0.5 + (i % 7) / 12,
      slope: 0.018 + ((i % 4) * 0.002),
      delay: Number((1.85 + (i % 5) * 0.09).toFixed(2)),
      driver: 'Conforms to MIL-STD-883 class V'
    }))
  ],
  'LOT-C / FLIGHT COMPUTER': [
    { id: 'OBC-9004', type: 'SEU VULNERABLE', baseline: [15, 19.5, 34.2, 49.6], mad: 5.9, slope: 0.21, delay: 3.25, driver: 'Single Event Upset susceptibility & threshold shift' },
    { id: 'OBC-9018', type: 'CLOCK JITTER', baseline: [11, 12.8, 19.4, 28.5], mad: 3.3, slope: 0.09, delay: 2.92, driver: 'Oscillator phase-lock drift under thermal soak' },
    ...Array.from({ length: 38 }, (_, i) => ({
      id: `OBC-${9101 + i}`,
      type: 'NOMINAL',
      baseline: [10 + (i % 6) * 0.3, 11 + (i % 5) * 0.4, 12 + (i % 4) * 0.4, 13 + (i % 5) * 0.3],
      mad: 0.3 + (i % 6) / 11,
      slope: 0.014 + ((i % 3) * 0.003),
      delay: Number((1.65 + (i % 6) * 0.07).toFixed(2)),
      driver: 'Rad-hardened core nominal'
    }))
  ],
  'LOT-D / SENSOR INTERFACE': [
    { id: 'SNS-3042', type: 'BIAS OFFSET', baseline: [16, 21.0, 38.1, 54.2], mad: 7.2, slope: 0.26, delay: 3.38, driver: 'Photodiode dark current avalanche under high bias' },
    { id: 'SNS-3088', type: 'NOISE COUPLING', baseline: [12, 13.9, 21.2, 33.4], mad: 3.8, slope: 0.11, delay: 2.65, driver: 'Cross-talk coupling capacitance non-linearity' },
    ...Array.from({ length: 38 }, (_, i) => ({
      id: `SNS-${3101 + i}`,
      type: 'NOMINAL',
      baseline: [9 + (i % 5) * 0.4, 10 + (i % 4) * 0.5, 11 + (i % 5) * 0.4, 12 + (i % 4) * 0.3],
      mad: 0.4 + (i % 5) / 10,
      slope: 0.016 + ((i % 4) * 0.002),
      delay: Number((1.75 + (i % 5) * 0.08).toFixed(2)),
      driver: 'Analog front-end SNR compliant'
    }))
  ]
};

const lots = Object.keys(lotDatasets);

const verdictColor = {
  ACCEPT: '#10B981', // Flight Green
  REVIEW: '#F59E0B', // Review Caution Amber
  REJECT: '#EF4444'  // Latent Risk Red
};

export default function App() {
  const [lot, setLot] = useState(lots[0]);
  const [selectedId, setSelectedId] = useState('COMP-4089');
  const [tab, setTab] = useState('zscore'); // 'zscore' | 'maha' | 'wafer' | 'forest'
  const [slope, setSlope] = useState(0.08); // Safety slope limit (µA/h)
  const [risk, setRisk] = useState(62); // Risk appetite / cost sensitivity (10-90%)
  const [has96, setHas96] = useState(true); // 96h Dynamic Injection
  const [activeHour, setActiveHour] = useState('96h'); // Scrubbable time stepper ('0h', '24h', '96h', '168h')
  const [useHistoricalBaseline, setUseHistoricalBaseline] = useState(false); // Small lot fallback
  const [showMonteCarlo, setShowMonteCarlo] = useState(false);
  const [mcRunId, setMcRunId] = useState(1);
  const trajectoryChartRef = useRef(null);
  const [running, setRunning] = useState(false);
  const [query, setQuery] = useState('');
  const [filterVerdict, setFilterVerdict] = useState('ALL');
  const [activeSection, setActiveSection] = useState('overview');

  // Interactive Dispositions State
  const [dispositions, setDispositions] = useState({});
  const [toastMessage, setToastMessage] = useState(null);
  const [rocketActive, setRocketActive] = useState(false);

  // Modal Open States
  const [isNewsOpen, setIsNewsOpen] = useState(false);
  const [isChamberOpen, setIsChamberOpen] = useState(false);
  const [isNCROpen, setIsNCROpen] = useState(false);
  const [isDispositionOpen, setIsDispositionOpen] = useState(false);

  // 3D Card Subtle Mouse Tilt Handler (Max 3.5 deg for pristine aerospace ergonomics)
  const handleCardTilt = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotateX = -(y / (rect.height / 2)) * 3.5;
    const rotateY = (x / (rect.width / 2)) * 3.5;
    card.style.transform = `perspective(1200px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(6px)`;
  };

  const resetCardTilt = (e) => {
    const card = e.currentTarget;
    card.style.transform = `perspective(1200px) rotateX(0deg) rotateY(0deg) translateZ(0px)`;
  };

  // 3D Scroll Reveal Effect using IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );

    const cards = document.querySelectorAll('.scroll-reveal-card');
    cards.forEach((c) => observer.observe(c));

    return () => observer.disconnect();
  }, [lot, tab]);

  // Dynamic components evaluation based on lot, slope, risk appetite, and small-lot fallback
  const rawComponents = lotDatasets[lot] || lotDatasets[lots[0]];
  const evaluatedComponents = useMemo(() => {
    // Robust population statistics: Median and MAD
    // If small-lot fallback is engaged, blend current lot with historical flight archive (N=500, Median=11.4, MAD=1.15)
    const baseMedian = useHistoricalBaseline ? 11.4 : 11.8;
    const baseMAD = useHistoricalBaseline ? 1.15 : 1.43;

    return rawComponents.map((c) => {
      // Cost-sensitivity slider controls strictness (from 1x commercial to 10x flight assurance)
      const strictnessMultiplier = 1.0 + (risk - 50) * 0.015;
      const madThresholdReview = 2.0 / strictnessMultiplier;
      const madThresholdReject = 4.0 / strictnessMultiplier;

      // Override with QA manual disposition if inspector signed off
      const customDisp = dispositions[c.id];

      let verdict = 'ACCEPT';
      if (c.slope > slope * 1.5 || c.mad > madThresholdReject || c.baseline[3] > 45) {
        verdict = 'REJECT';
      } else if (c.slope > slope || c.mad > madThresholdReview || c.baseline[3] > 25 || c.type.includes('MULTIVARIATE')) {
        verdict = 'REVIEW';
      }

      if (customDisp) {
        if (customDisp.status === 'APPROVE') verdict = 'ACCEPT';
        if (customDisp.status === 'REJECT') verdict = 'REJECT';
        if (customDisp.status === 'EXTENDED_240H') verdict = 'REVIEW';
      }

      const forecast = c.baseline[3];
      // Uncertainty corridor: 90% confidence interval (narrows sharply when 96h telemetry is injected)
      const ciSpread = has96 ? c.mad * 0.45 : c.mad * 1.25;
      const ci = [
        Math.max(8, Number((forecast - ciSpread).toFixed(1))),
        Number((forecast + ciSpread * 1.1).toFixed(1))
      ];

      return {
        ...c,
        verdict,
        forecast,
        ci,
        customDisp
      };
    });
  }, [rawComponents, slope, risk, useHistoricalBaseline, dispositions, has96]);

  // Selected component
  const comp = useMemo(() => {
    return evaluatedComponents.find((c) => c.id === selectedId) || evaluatedComponents[0];
  }, [evaluatedComponents, selectedId]);

  // Search & filter list
  const filtered = useMemo(() => {
    return evaluatedComponents.filter((c) => {
      const matchesSearch =
        c.id.toLowerCase().includes(query.toLowerCase()) ||
        c.type.toLowerCase().includes(query.toLowerCase()) ||
        c.driver.toLowerCase().includes(query.toLowerCase());
      const matchesVerdict = filterVerdict === 'ALL' || c.verdict === filterVerdict;
      return matchesSearch && matchesVerdict;
    });
  }, [evaluatedComponents, query, filterVerdict]);

  // KPI Statistics
  const kpiStats = useMemo(() => {
    const total = evaluatedComponents.length;
    const accepted = evaluatedComponents.filter((c) => c.verdict === 'ACCEPT').length;
    const review = evaluatedComponents.filter((c) => c.verdict === 'REVIEW').length;
    const reject = evaluatedComponents.filter((c) => c.verdict === 'REJECT').length;
    return {
      total,
      accepted,
      review,
      reject,
      acceptPct: ((accepted / total) * 100).toFixed(1)
    };
  }, [evaluatedComponents]);

  // Trajectory data for selected component with 96h dynamic injection & Monte Carlo rocket path
  const trajectory = useMemo(() => {
    const hours = ['0h', '24h', '96h', '168h'];
    const healthyEnvelope = [
      { low: 8, high: 14 },
      { low: 9, high: 16 },
      { low: 10, high: 18 },
      { low: 11, high: 20 }
    ];

    // Stochastic seed variance for dynamic Monte Carlo trajectory runs
    const seedVariation = Math.sin(mcRunId * 12.9898) * 3.8;
    const driftFactor = (comp.slope || 0.05) * 1.15 + Math.cos(mcRunId * 7.823) * 0.035;

    return hours.map((h, i) => {
      const actualVal = comp.baseline[i];
      // If has96 is false, hide 96h actual telemetry to simulate pre-96h early prediction
      const showActual = i < 2 || (i === 2 ? has96 : true);

      // Primary simulated Monte Carlo trajectory line drawn by the rocket
      const mcSimVal = Number(
        (actualVal + i * 24 * driftFactor + (i >= 2 ? seedVariation : seedVariation * 0.25)).toFixed(1)
      );

      // Prediction interval corridor (P10 to P90)
      const corridorWidth = has96 ? (i >= 2 ? 2.4 : 1.2) : (i >= 2 ? 6.8 : 2.0);
      const p10 = Number(Math.max(6, (actualVal - corridorWidth)).toFixed(1));
      const p90 = Number((actualVal + corridorWidth * 1.2).toFixed(1));

      return {
        h,
        low: healthyEnvelope[i].low,
        high: healthyEnvelope[i].high,
        actual: showActual ? actualVal : undefined,
        forecast: i >= 1 ? actualVal : undefined,
        p10: i >= 1 ? p10 : undefined,
        p90: i >= 1 ? p90 : undefined,
        ceiling: Number((11 + slope * i * 24).toFixed(1)),
        mcSim: showMonteCarlo ? Math.min(58, Math.max(6, mcSimVal)) : undefined,
        mc1: showMonteCarlo ? Number((mcSimVal * 0.94 - 1.2).toFixed(1)) : undefined,
        mc2: showMonteCarlo ? Number((mcSimVal * 1.06 + 1.2).toFixed(1)) : undefined
      };
    });
  }, [comp, slope, has96, showMonteCarlo, mcRunId]);

  // Multivariate Mahalanobis Scatter Data (Leakage vs Propagation Delay)
  const mahalanobisData = useMemo(() => {
    return evaluatedComponents.map((c, i) => {
      // Normal correlation: higher delay correlates with slightly lower leakage
      // Type 4 anomalies break this physical covariance
      const isCovarianceAnomaly = c.type.includes('MULTIVARIATE');
      const mahalanobisDistance = Number(
        (Math.sqrt(Math.pow((c.baseline[1] - 11.4) / 1.43, 2) + Math.pow((c.delay - 1.8) / 0.25, 2)) +
          (isCovarianceAnomaly ? 4.2 : 0)).toFixed(2)
      );

      return {
        id: c.id,
        leakage: c.baseline[1],
        delay: c.delay,
        md: mahalanobisDistance,
        type: c.type,
        verdict: c.verdict,
        isAnomaly: isCovarianceAnomaly || mahalanobisDistance > 3.8
      };
    });
  }, [evaluatedComponents]);

  // Run Batch Diagnostic Simulator
  const runDiagnostic = () => {
    setRunning(true);
    setToastMessage('Initiating MIL-STD-883G Class V Statistical ESS Batch Diagnostic…');
    setTimeout(() => {
      setRunning(false);
      setToastMessage('Batch Diagnostic Complete: 40 flight hardware units evaluated. 0 ATE contact failures.');
      setTimeout(() => setToastMessage(null), 4500);
    }, 1200);
  };

  // Commit QA Inspector Disposition
  const handleSaveDisposition = (id, status, notes, inspectorId) => {
    setDispositions((prev) => ({
      ...prev,
      [id]: { status, notes, inspectorId, date: new Date().toLocaleDateString() }
    }));
    setToastMessage(`QA Disposition for ${id} recorded: [${status}] by ${inspectorId}`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Export CSV Dossier
  const handleExportCSV = () => {
    const headers = 'Component_ID,Lot,Type,0h_uA,24h_uA,96h_uA,168h_Forecast_uA,MAD_Sigma,Drift_Rate_uAh,Verdict,Driver\n';
    const rows = evaluatedComponents
      .map(
        (c) =>
          `"${c.id}","${lot}","${c.type}",${c.baseline[0]},${c.baseline[1]},${c.baseline[2]},${c.forecast},${c.mad},${c.slope},"${c.verdict}","${c.driver}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ISRO_NIRIKSHAN_${lot.replace(/[^a-zA-Z0-9]/g, '_')}_TELEMETRY.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setToastMessage('Flight Screening Telemetry Dossier Exported as CSV.');
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="app">
      {/* 3D Cosmic Background */}
      <SpaceBackground />
      <ShootingStars />

      {/* Supersonic Air Shockwave & Rocket Exhaust Click Particles */}
      <AerospaceClickEffect />

      {/* Deep Space Dark Vignette & Subtle Overlay */}
      <div className="matte-noise-overlay" />

      {/* Live Rocket Telemetry & CAD Simulator */}
      <RocketAnimation active={rocketActive} onClose={() => setRocketActive(false)} />

      {/* Floating Aerospace Command Sidebar */}
      <CommandSidebar
        activeSection={activeSection}
        onSelectSection={(sec) => setActiveSection(sec)}
        onOpenChamber={() => setIsChamberOpen(true)}
        onOpenNews={() => setIsNewsOpen(true)}
        onOpenNCR={() => setIsNCROpen(true)}
      />

      {/* Live In-Chamber Environment Monitor Modal */}
      <ChamberMonitorModal isOpen={isChamberOpen} onClose={() => setIsChamberOpen(false)} />

      {/* Official ISRO Non-Conformance Report (NCR) Modal */}
      <NonConformanceReportModal
        isOpen={isNCROpen}
        onClose={() => setIsNCROpen(false)}
        component={comp}
        lot={lot}
        slope={slope}
      />

      {/* QA Engineering Disposition Modal */}
      <ActionDispositionModal
        isOpen={isDispositionOpen}
        onClose={() => setIsDispositionOpen(false)}
        component={comp}
        currentStatus={dispositions[comp.id]?.status}
        notes={dispositions[comp.id]?.notes}
        onSaveDisposition={handleSaveDisposition}
      />

      {/* Global Notification Toast */}
      {toastMessage && (
        <div className="status-toast">
          <Sparkles size={14} className="toast-icon" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)}>
            <X size={12} />
          </button>
        </div>
      )}

      {/* --- Aerospace Mission Header Bar --- */}
      <header className="topbar">
        <div className="brand-left">
          {/* Official ISRO Vector Insignia */}
          <div className="isro-official-badge" title="ISRO - Indian Space Research Organisation">
            <IsroLogo className="isro-logo-img" />
          </div>
          <div className="brand-info">
            <div className="eyebrow">
              <span className="isro-hindi">भारतीय अंतरिक्ष अनुसंधान संगठन</span>
              <i>•</i>
              <span>ISRO / DOS HIGH-RELIABILITY ESS HUB</span>
            </div>
            <div className="subline">
              SIH-PS170 <span className="slash">/</span> MISSION-CRITICAL LATENT-DEFECT SCREENING CONSOLE
            </div>
          </div>
        </div>

        <div className="brand-right">
          {/* ATE Sanity Checker & In-Chamber Context Display */}
          <div
            className="chamber-quick-pill"
            onClick={() => setIsChamberOpen(true)}
            role="button"
            tabIndex={0}
            title="Click to open In-Chamber Environment Telemetry"
          >
            <Thermometer size={13} className="text-orange" />
            <div className="chamber-pill-meta">
              <span>CHAMBER: 125.0°C / 3.3V</span>
              <small>ATE SANITY: VERIFIED (0 FAILS)</small>
            </div>
          </div>

          {/* Rocket Simulation Interactive Toggle */}
          <button
            id="rocket-toggle"
            className={`rocket-launch-toggle ${rocketActive ? 'active' : ''}`}
            onClick={() => setRocketActive(!rocketActive)}
            title="Toggle Aerospace Launch Vehicle CAD Simulator"
          >
            <div className="toggle-switch-track">
              <div className="toggle-rocket-knob">
                <Rocket size={14} className="toggle-rocket-icon" />
                {rocketActive && <span className="knob-exhaust-flame" />}
              </div>
            </div>
            <div className="toggle-label-wrap">
              <span className="toggle-kicker">PROPULSION SIM</span>
              <span className="toggle-status">{rocketActive ? 'LAUNCH ACTIVE' : 'STANDBY'}</span>
            </div>
          </button>

          <div className="product-identity">
            <span className="product-title">NIRIKSHAN</span>
            <small>AEROSPACE CONSOLE V4.0</small>
          </div>
        </div>
      </header>

      {/* --- Live Space News Scrolling Ticker & Drawer --- */}
      <SpaceNewsDrawer
        isOpen={isNewsOpen}
        onClose={() => setIsNewsOpen(false)}
        onOpen={() => setIsNewsOpen(true)}
      />

      {/* --- Main Dashboard Container --- */}
      <main className="main-console-content">
        {/* Section 1: Flight Telemetry Overview (Hero & Control Strip) */}
        <div id="overview" className="scroll-anchor" />

        <section
          className="hero scroll-reveal-card"
          onMouseMove={handleCardTilt}
          onMouseLeave={resetCardTilt}
        >
          <div>
            <div className="kicker">
              <Orbit size={14} className="kicker-sun-icon" /> ISRO SIH-PS170 MISSION ASSURANCE CONSOLE
            </div>
            <h1>
              Dynamic ESS <span className="highlight-intelligence">Intelligence</span> & Latent-Defect Screening
            </h1>
            <p>
              Autonomous real-time trajectory screening for satellite avionics and rad-hard space payloads.
              Detects accelerating leakage drift, non-linear gate-oxide degradation, and spatial wafer neighbor risk before flight integration.
            </p>
          </div>

          <div className="hero-actions">
            {/* Real-time Telemetry Status Pill */}
            <div className="cosmic-status-badge">
              <span className="status-indicator-beacon" />
              <div className="badge-meta">
                <span className="badge-title">GROUND-STATION CONSOLE</span>
                <span className="badge-desc">100% CLIENT-SIDE AUTONOMOUS</span>
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
                  <span>RUN STATISTICAL BATCH DIAGNOSTIC</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* Control Strip Panel */}
        <section
          className="control-strip panel scroll-reveal-card"
          onMouseMove={handleCardTilt}
          onMouseLeave={resetCardTilt}
        >
          {/* Active Lot Selector */}
          <div className="field-group">
            <span className="field-label">ACTIVE FLIGHT SCREENING LOT</span>
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

          {/* Cost-Sensitivity / Risk Appetite Slider */}
          <div className="slider-field-group">
            <div className="slider-header">
              <span className="field-label">COST-SENSITIVITY (FP VS FN PENALTY)</span>
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
              <span>COMMERCIAL (1x)</span>
              <span>ISRO FLIGHT ASSURANCE (10x)</span>
            </div>
          </div>

          <div className="panel-divider" />

          {/* Safety Slope Slider */}
          <div className="slider-field-group">
            <div className="slider-header">
              <span className="field-label">SAFETY SLOPE THRESHOLD (MAX-DRIFT dI/dt)</span>
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

          <div className="panel-divider" />

          {/* Small Lot Fallback Toggle */}
          <div className="field-group small-lot-box">
            <span className="field-label">SMALL LOT ROBUST FALLBACK</span>
            <label className="toggle-control" title="Blend with historical flight archive to prevent bad-lot masking">
              <input
                type="checkbox"
                checked={useHistoricalBaseline}
                onChange={(e) => setUseHistoricalBaseline(e.target.checked)}
              />
              <span className="toggle-track" />
              <span className="toggle-text">
                {useHistoricalBaseline ? 'BLENDED (N=500)' : 'LOT ONLY'}
              </span>
            </label>
          </div>
        </section>

        {/* Interactive KPI Filter Grid */}
        <section className="kpi-grid scroll-reveal-card">
          {[
            {
              id: 'ALL',
              label: 'TOTAL SCREENED',
              num: kpiStats.total,
              note: `MIL-STD-883 CLASS V • ${lot.split('/')[0].trim()}`,
              Icon: Layers3,
              color: 'cyan'
            },
            {
              id: 'ACCEPT',
              label: 'FLIGHT ACCEPTED',
              num: kpiStats.accepted,
              note: `${kpiStats.acceptPct}% CONFORMS TO SAFETY LIMITS`,
              Icon: CheckCircle2,
              color: 'green'
            },
            {
              id: 'REVIEW',
              label: 'REVIEW REQUIRED',
              num: kpiStats.review,
              note: 'ELEVATED COVARIANCE OR EDGE DIE',
              Icon: AlertTriangle,
              color: 'amber'
            },
            {
              id: 'REJECT',
              label: 'LATENT DEFECT RISK',
              num: kpiStats.reject,
              note: 'EXCEEDS DRIFT OR HIGH START',
              Icon: Zap,
              color: 'red'
            }
          ].map(({ id, label, num, note, Icon, color }) => (
            <button
              key={id}
              className={`kpi-card panel ${filterVerdict === id ? 'active-filter' : ''}`}
              onClick={() => setFilterVerdict(filterVerdict === id && id !== 'ALL' ? 'ALL' : id)}
              onMouseMove={handleCardTilt}
              onMouseLeave={resetCardTilt}
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

        {/* Section 2: Module A & Module B Dual Analytical Columns */}
        <section className="two-col">
          {/* Panel A: Population & Anomaly Matrix */}
          <div id="module-a" className="scroll-anchor" />
          <div
            className="panel chart-panel scroll-reveal-card"
            onMouseMove={handleCardTilt}
            onMouseLeave={resetCardTilt}
          >
            <div className="panel-head">
              <div>
                <div className="section-tag">
                  <span className="num">A</span> POPULATION & SPATIAL ENGINE
                </div>
                <h2>Hierarchical Dynamic Population Matrix</h2>
              </div>
              <div className="profile-stats">
                <span>
                  MEDIAN <b>{useHistoricalBaseline ? '11.4 µA' : '11.8 µA'}</b>
                </span>
                <span>
                  MAD <b>{useHistoricalBaseline ? '1.15' : '1.43'}</b>
                </span>
                <span>
                  MODIFIED Z <b>&gt; 3.5 REJECT</b>
                </span>
              </div>
            </div>

            {/* Sub-Tabs: Z-Score, Mahalanobis Scatter, Wafer Spatial Map, Isolation Forest */}
            <div className="tabs">
              {[
                ['zscore', 'MODIFIED Z-SCORE (MAD)'],
                ['maha', 'ROBUST MAHALANOBIS (TYPE 4)'],
                ['wafer', 'WAFER SPATIAL DEFECT MAP'],
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

            {/* Sub-Tab 1: Modified Z-Score Bar Chart */}
            {tab === 'zscore' && (
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={evaluatedComponents.slice(0, 24).map((c) => ({
                      id: c.id,
                      name: c.id.slice(-4),
                      score: Number(c.mad.toFixed(2)),
                      verdict: c.verdict
                    }))}
                    margin={{ top: 12, right: 12, left: -10, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="2 4" stroke="#ffffff0d" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} domain={[0, 8]} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="minimalist-tooltip">
                              <div className="tooltip-id">{data.id}</div>
                              <div className="tooltip-row">
                                <span>MODIFIED Z-SCORE:</span>
                                <b>+{data.score} σ</b>
                              </div>
                              <div className="tooltip-row">
                                <span>VERDICT:</span>
                                <b style={{ color: verdictColor[data.verdict] }}>{data.verdict}</b>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ReferenceLine y={3.5} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'REJECT (3.5σ)', fill: '#ef4444', fontSize: 9, position: 'insideTopRight' }} />
                    <ReferenceLine y={2.0} stroke="#f59e0b" strokeDasharray="2 2" label={{ value: 'REVIEW (2.0σ)', fill: '#f59e0b', fontSize: 9, position: 'insideTopRight' }} />
                    <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                      {evaluatedComponents.slice(0, 24).map((c) => (
                        <Cell
                          key={c.id}
                          fill={verdictColor[c.verdict]}
                          cursor="pointer"
                          onClick={() => setSelectedId(c.id)}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Sub-Tab 2: Robust Mahalanobis 2D Covariance Plot (Leakage vs Propagation Delay) */}
            {tab === 'maha' && (
              <div className="chart-wrap">
                <div className="maha-header-legend">
                  <span>
                    <i className="dot green" /> CORRELATED CLUSTER (TYPE 1 NOMINAL)
                  </span>
                  <span>
                    <i className="dot red" /> TYPE 4 ANOMALY (BREAKS LEAKAGE-DELAY CORRELATION)
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={230}>
                  <ScatterChart margin={{ top: 12, right: 18, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="2 4" stroke="#ffffff0d" />
                    <XAxis
                      type="number"
                      dataKey="delay"
                      name="Propagation Delay"
                      unit=" ns"
                      stroke="#64748b"
                      fontSize={9}
                      domain={[1.4, 3.8]}
                    />
                    <YAxis
                      type="number"
                      dataKey="leakage"
                      name="Iddq Leakage"
                      unit=" µA"
                      stroke="#64748b"
                      fontSize={9}
                      domain={[6, 50]}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const pt = payload[0].payload;
                          return (
                            <div className="minimalist-tooltip">
                              <div className="tooltip-id">{pt.id}</div>
                              <div className="tooltip-row">
                                <span>PROPAGATION DELAY:</span> <b>{pt.delay} ns</b>
                              </div>
                              <div className="tooltip-row">
                                <span>24H LEAKAGE:</span> <b>{pt.leakage} µA</b>
                              </div>
                              <div className="tooltip-row">
                                <span>MAHALANOBIS DISTANCE:</span> <b className="text-orange">{pt.md} MAD</b>
                              </div>
                              <div className="tooltip-row">
                                <span>ANOMALY CLASS:</span> <b>{pt.type}</b>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Scatter
                      data={mahalanobisData}
                      onClick={(pt) => setSelectedId(pt.id)}
                      cursor="pointer"
                    >
                      {mahalanobisData.map((entry) => (
                        <Cell
                          key={entry.id}
                          fill={entry.isAnomaly ? '#ef4444' : '#10b981'}
                          stroke={selectedId === entry.id ? '#ffffff' : 'none'}
                          strokeWidth={selectedId === entry.id ? 2 : 0}
                          r={selectedId === entry.id ? 7 : entry.isAnomaly ? 6 : 4}
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Sub-Tab 3: Wafer Spatial Map */}
            {tab === 'wafer' && (
              <WaferSpatialMap
                components={evaluatedComponents}
                selectedId={selectedId}
                onSelectComponent={(id) => setSelectedId(id)}
              />
            )}

            {/* Sub-Tab 4: Isolation Forest Heatmap */}
            {tab === 'forest' && (
              <div className="chart-wrap">
                <div className="isolation-forest-view">
                  <div className="forest-grid">
                    {evaluatedComponents.map((c) => (
                      <div
                        key={c.id}
                        className={`forest-cell ${c.verdict.toLowerCase()} ${
                          selectedId === c.id ? 'selected' : ''
                        }`}
                        onClick={() => setSelectedId(c.id)}
                        title={`${c.id}: ${c.mad.toFixed(1)} MAD • ${c.verdict}`}
                      >
                        <span className="cell-id-sub">{c.id.slice(-4)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="forest-legend">
                    <span>
                      <i className="dot green" /> ACCEPT (NOMINAL)
                    </span>
                    <span>
                      <i className="dot amber" /> REVIEW (ANOMALOUS COVARIANCE)
                    </span>
                    <span>
                      <i className="dot red" /> REJECT (ELEVATED RISK)
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="legend">
              <span>
                <i className="dot cyan" /> NOMINAL POPULATION
              </span>
              <span>
                <i className="dot amber" /> REVIEW BAND
              </span>
              <span>
                <i className="dot red" /> ELEVATED RISK
              </span>
              <span className="method">
                {useHistoricalBaseline
                  ? 'ROBUST FALLBACK: CURRENT LOT BLENDED WITH 500-UNIT ARCHIVE'
                  : `ROBUST BASELINE: ${lot.split('/')[0].trim()} / 168H ARCHIVE`}
              </span>
            </div>
          </div>

          {/* Panel B: Trajectory & Drift Predictor */}
          <div id="module-b" className="scroll-anchor" />
          <div
            className="panel chart-panel scroll-reveal-card"
            onMouseMove={handleCardTilt}
            onMouseLeave={resetCardTilt}
          >
            <div className="panel-head">
              <div>
                <div className="section-tag">
                  <span className="num">B</span> DRIFT FORENSICS & RECALIBRATION
                </div>
                <h2>Trajectory Prognostics & 96h Inject</h2>
              </div>
              <div className="trajectory-header-actions">
                {/* Scrubbable Time Stepper */}
                <div className="time-stepper-group" title="Scrub inspection milestone">
                  {['0h', '24h', '96h', '168h'].map((hr) => (
                    <button
                      key={hr}
                      className={`time-step-btn ${activeHour === hr ? 'active' : ''}`}
                      onClick={() => setActiveHour(hr)}
                    >
                      {hr}
                    </button>
                  ))}
                </div>

                {/* 96h Data Arrival Injection Toggle */}
                <label
                  className="toggle-control"
                  title="Dynamic 96h injection: Narrows uncertainty corridor P10-P90 or triggers early abort"
                >
                  <input
                    type="checkbox"
                    checked={has96}
                    onChange={(e) => setHas96(e.target.checked)}
                  />
                  <span className="toggle-track" />
                  <span className="toggle-text">96H INJECT</span>
                </label>

                {/* Monte Carlo Toggle & Simulation Launcher with Rocket Animation */}
                <div className="mc-btn-group">
                  <button
                    className={`subtle-btn mc-toggle-btn ${showMonteCarlo ? 'active' : ''}`}
                    onClick={() => {
                      if (!showMonteCarlo) {
                        setShowMonteCarlo(true);
                        setMcRunId(1);
                      } else {
                        setMcRunId((prev) => prev + 1);
                      }
                    }}
                    title="Launch Monte Carlo trajectory simulation with rocket flight drawing animation"
                  >
                    <Orbit size={13} className={showMonteCarlo ? 'spin-slow' : ''} />
                    <span>MONTE CARLO</span>
                    {showMonteCarlo && <span className="mc-run-chip">RUN #{mcRunId}</span>}
                  </button>
                  {showMonteCarlo && (
                    <button
                      className="subtle-btn mc-reset-btn"
                      onClick={() => setShowMonteCarlo(false)}
                      title="Clear Monte Carlo simulation"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Selected Component Badge & Early Abort Banner */}
            <div className="selected-chip-row">
              <div className="selected-chip">
                <CircleDot size={14} className="chip-icon" />
                <b className="chip-id">{comp.id}</b>
                <span className="chip-type">{comp.type}</span>
                <span className="chip-lot">{lot.split('/')[1]?.trim() || 'LOGIC'}</span>
                <i style={{ color: verdictColor[comp.verdict] }} className="chip-verdict">
                  {comp.verdict}
                </i>
              </div>

              {/* Dynamic Early-Abort Alert for Accelerating Drift */}
              {comp.type === 'ACCELERATING DRIFT' && (
                <div className="early-abort-badge">
                  <AlertTriangle size={12} className="text-red" />
                  <span>EARLY ABORT CRITERION MET: TYPE 2 LATENT DEFECT</span>
                </div>
              )}
            </div>

            {/* Trajectory Composed Chart with Rocket Drawer Overlay */}
            <div className="chart-wrap trajectory" ref={trajectoryChartRef}>
              {/* Rocket Trajectory Drawer Animation */}
              <MonteCarloRocketDrawer
                containerRef={trajectoryChartRef}
                isActive={showMonteCarlo}
                runId={mcRunId}
                data={trajectory}
              />

              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={trajectory} margin={{ top: 15, right: 25, left: 10, bottom: 20 }}>
                  <defs>
                    <linearGradient id="healthyBandGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#29B6D1" stopOpacity={0.22} />
                      <stop offset="100%" stopColor="#29B6D1" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="confidenceCorridorGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f58220" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#f58220" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke="#ffffff0d" vertical={false} />
                  <XAxis dataKey="h" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis domain={[0, 60]} stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="minimalist-tooltip">
                            <div className="tooltip-id">
                              {comp.id} • INSPECTION: {label}
                            </div>
                            {payload.map((p) => {
                              if (!p.value || p.name === 'low' || p.name === 'p10') return null;
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
                  {/* Healthy Population Envelope */}
                  <Area
                    name="Healthy Baseline"
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

                  {/* 90% Confidence Prediction Corridor (P10 to P90) */}
                  <Area
                    name="P90 Upper Corridor"
                    dataKey="p90"
                    stroke="none"
                    fill="url(#confidenceCorridorGrad)"
                  />
                  <Area
                    name="p10"
                    dataKey="p10"
                    stroke="none"
                    fill="#05080e"
                  />

                  {/* Monte Carlo Simulated Lines */}
                  {showMonteCarlo && (
                    <>
                      <Line
                        name="MC 95% Lower"
                        dataKey="mc1"
                        stroke="#818cf8"
                        strokeWidth={1}
                        strokeDasharray="2 3"
                        dot={false}
                        opacity={0.45}
                        isAnimationActive={false}
                      />
                      <Line
                        name="MC 95% Upper"
                        dataKey="mc2"
                        stroke="#818cf8"
                        strokeWidth={1}
                        strokeDasharray="2 3"
                        dot={false}
                        opacity={0.45}
                        isAnimationActive={false}
                      />
                      <Line
                        name="MC Simulated Trajectory"
                        dataKey="mcSim"
                        stroke="#29B6D1"
                        strokeWidth={2.8}
                        dot={false}
                        className="mc-rocket-line"
                        isAnimationActive={false}
                      />
                    </>
                  )}

                  {/* Safety Slope Ceiling Limit */}
                  <Line
                    name="Safety Slope Ceiling"
                    dataKey="ceiling"
                    stroke="#F59E0B"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                  />

                  {/* Actual Readings */}
                  <Line
                    name="Actual Telemetry"
                    dataKey="actual"
                    stroke="#29B6D1"
                    strokeWidth={2.8}
                    dot={{ r: 4, fill: '#29B6D1', stroke: '#05080e', strokeWidth: 2 }}
                  />

                  {/* Predicted Drift Forecast */}
                  <Line
                    name="Predicted Forecast"
                    dataKey="forecast"
                    stroke="#F58220"
                    strokeWidth={2.5}
                    strokeDasharray="6 4"
                    dot={{ r: 4, fill: '#F58220', stroke: '#05080e', strokeWidth: 2 }}
                  />

                  {/* Absolute Datasheet Failure Ceiling */}
                  <ReferenceLine
                    y={50}
                    stroke="#EF4444"
                    strokeDasharray="3 3"
                    label={{
                      value: 'MAX DATASHEET LIMIT (50 µA)',
                      fill: '#EF4444',
                      fontSize: 9,
                      position: 'insideTopRight'
                    }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="trajectory-foot">
              <span>
                <i className="line cyan" /> ACTUAL TELEMETRY
              </span>
              <span>
                <i className="line orange" /> PREDICTED HORIZON
              </span>
              <span>
                <i className="line amber dashed" /> SAFETY CEILING (dI/dt)
              </span>
              {showMonteCarlo && (
                <span>
                  <i className="line neon-cyan" /> MC SIMULATED TRAJECTORY (RUN #{mcRunId})
                </span>
              )}
              <span className="limit">FLIGHT LIMIT: 50 µA</span>
            </div>
          </div>
        </section>

        {/* Section 3: Decision & Explainability Engine */}
        <div id="decision-engine" className="scroll-anchor" />

        <section className="bottom-grid">
          {/* Component Inventory & Search Matrix */}
          <div
            className="panel decision-panel scroll-reveal-card"
            onMouseMove={handleCardTilt}
            onMouseLeave={resetCardTilt}
          >
            <div className="panel-head">
              <div>
                <div className="section-tag">
                  <span className="num">C</span> RISK FUSION & PART INVENTORY
                </div>
                <h2>Autonomous Component Screening Matrix</h2>
              </div>
              <div className="search-wrap">
                <Search size={14} className="search-icon" />
                <input
                  id="component-search-input"
                  placeholder="Search serial ID, defect type, driver…"
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
              <span className="filter-label">FILTER CLASSIFICATION:</span>
              {['ALL', 'ACCEPT', 'REVIEW', 'REJECT'].map((v) => (
                <button
                  key={v}
                  className={`filter-pill ${filterVerdict === v ? 'active' : ''}`}
                  onClick={() => setFilterVerdict(v)}
                >
                  {v}
                </button>
              ))}
              <span className="filter-count">({filtered.length} units matching)</span>
            </div>

            <div className="component-list-scroll">
              {filtered.length === 0 ? (
                <div className="no-results-msg">No components match current search & filter criteria.</div>
              ) : (
                filtered.map((c) => (
                  <button
                    key={c.id}
                    className={`component-row-btn ${selectedId === c.id ? 'selected' : ''}`}
                    onClick={() => setSelectedId(c.id)}
                  >
                    <span className="status-dot" style={{ background: verdictColor[c.verdict] }} />
                    <b className="comp-id">{c.id}</b>
                    <small className="comp-type">{c.type}</small>
                    <span className="comp-slope">{c.slope.toFixed(2)} µA/h</span>
                    <span className="comp-mad">+{c.mad.toFixed(1)}σ</span>
                    <em style={{ color: verdictColor[c.verdict] }} className="comp-verdict">
                      {c.verdict}
                    </em>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Explainability Engine & Engineering Action Dossier */}
          <div
            className="panel verdict-panel scroll-reveal-card"
            onMouseMove={handleCardTilt}
            onMouseLeave={resetCardTilt}
          >
            <div className="verdict-top">
              <div className="section-tag">
                <Target size={14} /> FLIGHT SCREENING DECISION & EXPLAINABILITY
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
                {dispositions[comp.id]?.status === 'APPROVE' && (
                  <span className="approved-stamp">
                    <ShieldCheck size={12} /> QA FLIGHT APPROVED
                  </span>
                )}
                {dispositions[comp.id]?.status === 'EXTENDED_240H' && (
                  <span className="flagged-stamp">
                    <Clock size={12} /> 240H EXTENDED SOAK
                  </span>
                )}
                {dispositions[comp.id]?.status === 'REJECT' && (
                  <span className="rejected-stamp">
                    <ShieldAlert size={12} /> QUARANTINED
                  </span>
                )}
              </div>

              {/* Action Buttons for selected component */}
              <div className="verdict-action-buttons">
                <button
                  className="action-btn disposition-modal-trigger"
                  onClick={() => setIsDispositionOpen(true)}
                  title="Open Inspector Sign-Off Modal"
                >
                  <UserCheck size={13} />
                  <span>DISPOSITION</span>
                </button>
                <button
                  className="action-btn ncr-modal-trigger"
                  onClick={() => setIsNCROpen(true)}
                  title="Generate Official ISRO Non-Conformance Report"
                >
                  <FileText size={13} />
                  <span>ISRO NCR</span>
                </button>
                <button
                  className="action-btn export"
                  onClick={handleExportCSV}
                  title="Download full lot telemetry dossier in CSV"
                >
                  <Download size={13} />
                  <span>CSV</span>
                </button>
              </div>
            </div>

            {/* Diagnostic Rationales & Reason Codes */}
            <div className="reasons">
              <div className="reason-item">
                <span className="reason-num">RC-01</span>
                <p>
                  <b>Dynamic Population Deviation:</b> Leakage at 24h is{' '}
                  <span className="val-hi">+{comp.mad.toFixed(1)} MAD</span> above lot median (Robust Modified Z-score).
                </p>
              </div>
              <div className="reason-item">
                <span className="reason-num">RC-02</span>
                <p>
                  <b>Prognostic Horizon:</b> Predicted 168h leakage ={' '}
                  <span className="val-hi">{comp.forecast.toFixed(1)} µA</span>{' '}
                  <small>[90% Prediction Interval: {comp.ci[0]} – {comp.ci[1]} µA]</small>
                </p>
              </div>
              <div className="reason-item">
                <span className="reason-num">RC-03</span>
                <p>
                  <b>Drift Rate Ratio:</b> Slope ({comp.slope.toFixed(3)} µA/h){' '}
                  {comp.slope > slope ? (
                    <span style={{ color: '#ef4444' }}>exceeds safety threshold ({slope.toFixed(2)} µA/h) by {((comp.slope / slope) * 100).toFixed(0)}%</span>
                  ) : (
                    <span style={{ color: '#10b981' }}>conforms within safety margin ({slope.toFixed(2)} µA/h)</span>
                  )}
                  .
                </p>
              </div>
            </div>

            <div className="driver-row">
              <span className="driver-label">PRIMARY LATENT RISK DRIVER</span>
              <b className="driver-val">{comp.driver}</b>
            </div>

            {/* SHAP Feature-Importance Waterfall Breakdown */}
            <div className="attribution">
              <div className="field-label">EXPLAINABLE SHAP ATTRIBUTION (DEFECT CONTRIBUTION WEIGHT)</div>
              <div className="attrib-bars">
                <div className="attrib-col">
                  <span>0H VALUE</span>
                  <div className="bar-track">
                    <i style={{ width: '28%', background: '#29B6D1' }} />
                  </div>
                  <small>+28%</small>
                </div>
                <div className="attrib-col">
                  <span>24H DELTA</span>
                  <div className="bar-track">
                    <i
                      style={{
                        width: `${Math.min(100, comp.slope * 380)}%`,
                        background: comp.slope > slope ? '#ef4444' : '#29B6D1'
                      }}
                    />
                  </div>
                  <small>{comp.slope > slope ? '+42%' : '+18%'}</small>
                </div>
                <div className="attrib-col">
                  <span>COVARIANCE</span>
                  <div className="bar-track">
                    <i
                      style={{
                        width: comp.type.includes('MULTIVARIATE') ? '85%' : '35%',
                        background: comp.type.includes('MULTIVARIATE') ? '#ef4444' : '#F59E0B'
                      }}
                    />
                  </div>
                  <small>{comp.type.includes('MULTIVARIATE') ? '+85%' : '+15%'}</small>
                </div>
                <div className="attrib-col">
                  <span>MAD OUTLIER</span>
                  <div className="bar-track">
                    <i
                      style={{
                        width: `${Math.min(100, comp.mad * 14)}%`,
                        background: comp.mad > 3 ? '#ef4444' : '#818cf8'
                      }}
                    />
                  </div>
                  <small>{comp.mad > 3 ? '+74%' : '+22%'}</small>
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
            CHAMBER STATUS: <b>VSSC-TC-04 (125°C NOMINAL)</b>
          </span>
          <span className="dot-sep">•</span>
          <span>
            LAST CALIBRATION SYNC: <b>2026-10-04</b>
          </span>
        </div>
        <div className="footer-right">
          <span>
            <ShieldCheck size={13} className="footer-icon-green" /> ISRO SIH-PS170 CLEANROOM QUALITY ASSURANCE LEVEL-1 COMPLIANT
          </span>
        </div>
      </footer>
    </div>
  );
}
