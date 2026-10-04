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
  FileSpreadsheet,
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
  Target,
  Zap,
  X,
  Thermometer,
  Clock,
  Printer,
  UserCheck,
  Globe,
  Info,
  Radar as RadarIcon,
  Maximize2,
  ExternalLink
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

// 168h Thermal Chamber Soak Telemetry Profile
const SOAK_CHAMBER_PROFILE = [
  { hour: '0h', temp: 24.5, target: 125, vdd: 3.30 },
  { hour: '12h', temp: 124.8, target: 125, vdd: 3.30 },
  { hour: '24h', temp: 125.1, target: 125, vdd: 3.31 },
  { hour: '48h', temp: 125.0, target: 125, vdd: 3.30 },
  { hour: '72h', temp: 124.9, target: 125, vdd: 3.29 },
  { hour: '96h', temp: 125.2, target: 125, vdd: 3.30 },
  { hour: '120h', temp: 125.0, target: 125, vdd: 3.30 },
  { hour: '144h', temp: 125.1, target: 125, vdd: 3.31 },
  { hour: '168h', temp: 125.0, target: 125, vdd: 3.30 }
];

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
  const [radarOrScatter, setRadarOrScatter] = useState('radar'); // 'radar' | 'scatter'

  // Interactive Dispositions State
  const [dispositions, setDispositions] = useState({});
  const [toastMessage, setToastMessage] = useState(null);
  const [rocketActive, setRocketActive] = useState(false);

  // Modal Open States
  const [isNewsOpen, setIsNewsOpen] = useState(false);
  const [isChamberOpen, setIsChamberOpen] = useState(false);
  const [isNCROpen, setIsNCROpen] = useState(false);
  const [isDispositionOpen, setIsDispositionOpen] = useState(false);

  // Is any modal open for background motion blur & scale down
  const isAnyModalOpen = isNewsOpen || isChamberOpen || isNCROpen || isDispositionOpen;

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

  // Helper to open modals while setting the 3D shared-element transform origin
  const openModalWithOrigin = (setter, e) => {
    if (e && e.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      const originX = `${((rect.left + rect.width / 2) / window.innerWidth) * 100}%`;
      const originY = `${((rect.top + rect.height / 2) / window.innerHeight) * 100}%`;
      document.documentElement.style.setProperty('--modal-origin-x', originX);
      document.documentElement.style.setProperty('--modal-origin-y', originY);
    }
    setter(true);
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
  }, [lot, tab, radarOrScatter]);

  // Scroll Spy to keep active sidebar button in sync with page scroll
  useEffect(() => {
    const sectionIds = [
      'overview',
      'chamber-monitor',
      'module-a',
      'module-b',
      'dpat-suite',
      'decision-engine',
      'component-ledger'
    ];

    const handleScroll = () => {
      const scrollY = window.pageYOffset;
      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionIds[i]);
        if (el) {
          const top = el.getBoundingClientRect().top + scrollY - 140;
          if (scrollY >= top) {
            setActiveSection(sectionIds[i]);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Dynamic components evaluation based on lot, slope, risk appetite, and small-lot fallback
  const rawComponents = lotDatasets[lot] || lotDatasets[lots[0]];
  const evaluatedComponents = useMemo(() => {
    return rawComponents.map((c) => {
      const strictnessMultiplier = 1.0 + (risk - 50) * 0.015;
      const madThresholdReview = 2.0 / strictnessMultiplier;
      const madThresholdReject = 4.0 / strictnessMultiplier;

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

    const seedVariation = Math.sin(mcRunId * 12.9898) * 3.8;
    const driftFactor = (comp.slope || 0.05) * 1.15 + Math.cos(mcRunId * 7.823) * 0.035;

    return hours.map((h, i) => {
      const actualVal = comp.baseline[i];
      const showActual = i < 2 || (i === 2 ? has96 : true);

      const mcSimVal = Number(
        (actualVal + i * 24 * driftFactor + (i >= 2 ? seedVariation : seedVariation * 0.25)).toFixed(1)
      );

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
    return evaluatedComponents.map((c) => {
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

  // DPAT Population Histogram Data
  const dpatHistogramData = useMemo(() => {
    const leakages = evaluatedComponents.map((c) => c.baseline[1]);
    const sorted = [...leakages].sort((a, b) => a - b);
    const mean = sorted.reduce((sum, v) => sum + v, 0) / sorted.length;
    const stdDev = Math.sqrt(sorted.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / sorted.length) || 1.4;

    const gaussian = (x) => {
      const coeff = 1 / (stdDev * Math.sqrt(2 * Math.PI));
      const exponent = -0.5 * Math.pow((x - mean) / stdDev, 2);
      return coeff * Math.exp(exponent);
    };

    const bins = [];
    for (let x = 8; x <= 46; x += 2.5) {
      const count = sorted.filter((v) => v >= x && v < x + 2.5).length;
      const bellValue = Number((gaussian(x + 1.25) * sorted.length * 2.5 * 1.8).toFixed(2));
      bins.push({
        binLabel: `${x.toFixed(0)}`,
        midPoint: x + 1.25,
        count,
        gaussianBell: bellValue
      });
    }
    return bins;
  }, [evaluatedComponents]);

  // 6-Axis Radar Geometry for Section 4
  const radarMetrics = useMemo(() => {
    const leak = Math.min(100, ((comp.baseline?.[1] || 12) / 50) * 100);
    const iddq = Math.min(100, ((comp.baseline?.[0] || 10) / 30) * 100);
    const del = Math.min(100, (((comp.delay || 2.0) - 1.0) / 3.0) * 100);
    const d24 = Math.min(100, (Math.max(0, (comp.baseline?.[1] || 12) - (comp.baseline?.[0] || 10)) / 10) * 100);
    const d96 = Math.min(100, (Math.max(0, (comp.baseline?.[2] || 14) - (comp.baseline?.[0] || 10)) / 25) * 100);
    const zsc = Math.min(100, ((comp.mad || 1.0) / 6.0) * 100);

    const values = [leak, iddq, del, d24, d96, zsc];
    const base = [24, 28, 45, 20, 22, 18];
    const center = { x: 140, y: 110 };
    const radius = 75;

    const getPt = (val, idx) => {
      const angle = (Math.PI * 2 / 6) * idx - Math.PI / 2;
      const r = (val / 100) * radius;
      return { x: center.x + r * Math.cos(angle), y: center.y + r * Math.sin(angle) };
    };

    const unitPts = values.map((v, i) => `${getPt(v, i).x},${getPt(v, i).y}`).join(' ');
    const basePts = base.map((v, i) => `${getPt(v, i).x},${getPt(v, i).y}`).join(' ');

    return { center, radius, values, base, unitPts, basePts, getPt };
  }, [comp]);

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
    <div className={`app ${isAnyModalOpen ? 'modal-active' : ''}`}>
      {/* 3D Cosmic Background */}
      <SpaceBackground />
      <ShootingStars />

      {/* Supersonic Air Shockwave & Rocket Exhaust Click Particles */}
      <AerospaceClickEffect />

      {/* Deep Space Dark Vignette & Subtle Overlay */}
      <div className="matte-noise-overlay" />

      {/* Live Rocket Telemetry & CAD Simulator */}
      <RocketAnimation active={rocketActive} onClose={() => setRocketActive(false)} />

      {/* Modals with 3D Zoom Morph Transition */}
      <ChamberMonitorModal isOpen={isChamberOpen} onClose={() => setIsChamberOpen(false)} />
      <NonConformanceReportModal
        isOpen={isNCROpen}
        onClose={() => setIsNCROpen(false)}
        component={comp}
        lot={lot}
        slope={slope}
      />
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
          <div className="mission-title-group">
            <div className="org-subtext">
              <span className="sat-indicator" /> ISRO • DEPARTMENT OF SPACE • QUALITY ASSURANCE DIRECTORATE
            </div>
            <div className="project-title-row">
              <span className="project-acronym">NIRIKSHAN</span>
              <span className="project-dash">/</span>
              <span className="project-desc">AI-DRIVEN DYNAMIC ESS INTELLIGENCE</span>
              <span className="ps-tag">PS170</span>
            </div>
          </div>
        </div>

        <div className="brand-right">
          <div className="live-status-pill">
            <span className="pulse-dot-green" />
            <span className="status-label">GROUND STATION TELEMETRY</span>
            <span className="spec-badge">MIL-STD-883 CLASS V</span>
          </div>

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
            <small>AEROSPACE CONSOLE V4.3</small>
          </div>
        </div>
      </header>

      {/* --- Live Space News Scrolling Ticker & Drawer --- */}
      <SpaceNewsDrawer
        isOpen={isNewsOpen}
        onClose={() => setIsNewsOpen(false)}
        onOpen={(e) => openModalWithOrigin(setIsNewsOpen, e)}
      />

      {/* --- Mission Cockpit Zero-Dead-Space Container --- */}
      <div className="cockpit-container">
        {/* Left Floating Rail: Aerospace Command Dock (Strictly ordered 1-to-9 sequential buttons) */}
        <aside className="cockpit-left-rail">
          <CommandSidebar
            activeSection={activeSection}
            onSelectSection={(sec) => setActiveSection(sec)}
            onOpenChamber={(e) => openModalWithOrigin(setIsChamberOpen, e)}
            onOpenNews={(e) => openModalWithOrigin(setIsNewsOpen, e)}
            onOpenNCR={(e) => openModalWithOrigin(setIsNCROpen, e)}
          />
        </aside>

        {/* Main Telemetry & Diagnostic Cockpit Area */}
        <main className="cockpit-workspace">
          {/* ============================================================== */}
          {/* SECTION 1: FLIGHT TELEMETRY OVERVIEW & CONTROLS               */}
          {/* ============================================================== */}
          <div id="overview" className="scroll-anchor" />

          {/* Hero Mission Assurance Banner */}
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
              <div className="cosmic-status-badge">
                <span className="status-indicator-beacon" />
                <div className="badge-meta">
                  <span className="badge-title">GROUND-STATION CONSOLE</span>
                  <span className="badge-desc">100% CLIENT-SIDE AUTONOMOUS</span>
                </div>
              </div>

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

            {/* Cost-Sensitivity Slider */}
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

          {/* Interactive KPI Filter Ribbon */}
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

          {/* ============================================================== */}
          {/* SECTION 2: 125°C IN-CHAMBER ENVIRONMENT & ATE SANITY CHECKER  */}
          {/* ============================================================== */}
          <div id="chamber-monitor" className="scroll-anchor" />

          <section className="balanced-two-col">
            {/* Card 1: 125.0°C Thermal Soak Profile & Chamber Context */}
            <div
              className="panel chart-panel scroll-reveal-card"
              onMouseMove={handleCardTilt}
              onMouseLeave={resetCardTilt}
            >
              <div className="panel-head">
                <div>
                  <div className="section-tag">
                    <Thermometer size={13} className="text-orange" /> IN-CHAMBER HTOL PROFILE
                  </div>
                  <h2>125.0°C Thermal Soak & Environment</h2>
                </div>
                <button
                  className="view-chamber-btn"
                  onClick={(e) => openModalWithOrigin(setIsChamberOpen, e)}
                  title="Expand Full Chamber Telemetry Modal"
                >
                  <Maximize2 size={12} />
                  <span>EXPAND PROFILE</span>
                </button>
              </div>

              <div className="chamber-mini-kpi-row">
                <div className="mini-kpi-box">
                  <span className="mini-tag">SETPOINT</span>
                  <b className="mini-val text-orange">125.0°C</b>
                  <small>±0.2°C DEV</small>
                </div>
                <div className="mini-kpi-box">
                  <span className="mini-tag">VDD BIAS</span>
                  <b className="mini-val text-cyan">3.30 V</b>
                  <small>REGULATED</small>
                </div>
                <div className="mini-kpi-box">
                  <span className="mini-tag">SOAK DURATION</span>
                  <b className="mini-val text-green">96 / 168h</b>
                  <small>57.1% COMPLETE</small>
                </div>
                <div className="mini-kpi-box">
                  <span className="mini-tag">CHAMBER ID</span>
                  <b className="mini-val">VSSC-TC-04</b>
                  <small>CLEANROOM COND D</small>
                </div>
              </div>

              <div className="chart-wrap" style={{ height: 180 }}>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={SOAK_CHAMBER_PROFILE} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="chamberSoakGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F58220" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#F58220" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 4" stroke="#ffffff0d" />
                    <XAxis dataKey="hour" stroke="#64748b" fontSize={9} />
                    <YAxis domain={[0, 140]} stroke="#64748b" fontSize={9} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="minimalist-tooltip">
                              <div className="tooltip-id">HOUR: {d.hour}</div>
                              <div className="tooltip-row"><span>CHAMBER TEMP:</span> <b>{d.temp}°C</b></div>
                              <div className="tooltip-row"><span>BIAS:</span> <b>{d.vdd}V</b></div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ReferenceLine y={125} stroke="#F58220" strokeDasharray="3 3" />
                    <Area type="monotone" dataKey="temp" stroke="#F58220" strokeWidth={2} fill="url(#chamberSoakGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Card 2: Automated ATE Contact Sanity Verification */}
            <div
              className="panel ate-sanity-card scroll-reveal-card"
              onMouseMove={handleCardTilt}
              onMouseLeave={resetCardTilt}
            >
              <div className="sanity-card-header">
                <div className="sanity-badge">
                  <span className="live-indicator-beacon" />
                  <Cpu size={12} className="text-cyan" />
                  <span>PRE-SCREENING AUTOMATED ATE SANITY VERIFICATION</span>
                </div>
                <span className="ch-verdict text-green" style={{ fontSize: 10 }}>ALL 6 CHANNELS PASS</span>
              </div>

              <p className="sanity-desc">
                Automated hardware contact verification checks before statistical evaluation. Disqualifies open pins and negative delays from distorting population metrics.
              </p>

              <div className="sanity-channels-table">
                <div className="channel-row pass">
                  <span className="ch-pin">CH-01: VDD_CORE</span>
                  <span className="ch-test">Contact R: 0.42 Ω (&lt;1.5Ω)</span>
                  <span className="ch-verdict text-green">PASS</span>
                </div>
                <div className="channel-row pass">
                  <span className="ch-pin">CH-02: GND_SUB</span>
                  <span className="ch-test">Return R: 0.18 Ω (&lt;1.0Ω)</span>
                  <span className="ch-verdict text-green">PASS</span>
                </div>
                <div className="channel-row pass">
                  <span className="ch-pin">CH-03: CLK_DIFF+</span>
                  <span className="ch-test">Clock Jitter: 1.24 ps (&lt;8.0ps)</span>
                  <span className="ch-verdict text-green">PASS</span>
                </div>
                <div className="channel-row pass">
                  <span className="ch-pin">CH-04: I/O_LEAK</span>
                  <span className="ch-test">Delay: +4.82 ns (&gt;0.0ns check)</span>
                  <span className="ch-verdict text-green">PASS</span>
                </div>
                <div className="channel-row pass">
                  <span className="ch-pin">CH-05: SENSE_RAD</span>
                  <span className="ch-test">Thermal Diode: 125.1°C (±1°C)</span>
                  <span className="ch-verdict text-green">PASS</span>
                </div>
                <div className="channel-row pass">
                  <span className="ch-pin">CH-06: PROBE_BUS</span>
                  <span className="ch-test">Short Leakage: &lt;10 nA (&lt;500nA)</span>
                  <span className="ch-verdict text-green">PASS</span>
                </div>
              </div>

              <div className="sanity-card-footer">
                <CheckCircle2 size={13} className="text-green" />
                <span>Zero ATE contact failures. Component population ready for Dynamic ESS screening.</span>
              </div>
            </div>
          </section>

          {/* ============================================================== */}
          {/* SECTION 3: CORE ANALYTICAL ENGINES (MODULE A & MODULE B)       */}
          {/* ============================================================== */}
          <section className="balanced-two-col">
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
                  <span>MEDIAN <b>{useHistoricalBaseline ? '11.4 µA' : '11.8 µA'}</b></span>
                  <span>MAD <b>{useHistoricalBaseline ? '1.15' : '1.43'}</b></span>
                  <span>MODIFIED Z <b>&gt; 3.5 REJECT</b></span>
                </div>
              </div>

              {/* Sub-Tabs: Z-Score, Mahalanobis Scatter, Wafer Spatial Map, Isolation Forest */}
              <div className="tabs">
                {[
                  ['zscore', 'MODIFIED Z-SCORE'],
                  ['maha', 'ROBUST MAHALANOBIS'],
                  ['wafer', 'WAFER SPATIAL MAP'],
                  ['forest', 'ISOLATION FOREST']
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
                      margin={{ top: 12, right: 12, left: -15, bottom: 20 }}
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
                      <ReferenceLine y={3.5} stroke="#ef4444" strokeDasharray="3 3" />
                      <ReferenceLine y={2.0} stroke="#f59e0b" strokeDasharray="2 2" />
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

              {/* Sub-Tab 2: Robust Mahalanobis 2D Covariance Plot */}
              {tab === 'maha' && (
                <div className="chart-wrap">
                  <div className="maha-header-legend">
                    <span><i className="dot green" /> NOMINAL CORRELATED</span>
                    <span><i className="dot red" /> TYPE 4 ANOMALY (BREAKS COVARIANCE)</span>
                  </div>
                  <ResponsiveContainer width="100%" height={230}>
                    <ScatterChart margin={{ top: 12, right: 18, left: -15, bottom: 20 }}>
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
                                <div className="tooltip-row"><span>DELAY:</span> <b>{pt.delay} ns</b></div>
                                <div className="tooltip-row"><span>LEAKAGE:</span> <b>{pt.leakage} µA</b></div>
                                <div className="tooltip-row"><span>MAHALANOBIS:</span> <b className="text-orange">{pt.md} MAD</b></div>
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
                      <span><i className="dot green" /> ACCEPT (NOMINAL)</span>
                      <span><i className="dot amber" /> REVIEW (COVARIANCE)</span>
                      <span><i className="dot red" /> REJECT (RISK)</span>
                    </div>
                  </div>
                </div>
              )}
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
                      {showMonteCarlo && <span className="mc-run-chip">#{mcRunId}</span>}
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
                  <i style={{ color: verdictColor[comp.verdict] }} className="chip-verdict">
                    {comp.verdict}
                  </i>
                </div>

                {comp.type === 'ACCELERATING DRIFT' && (
                  <div className="early-abort-badge">
                    <AlertTriangle size={12} className="text-red" />
                    <span>EARLY ABORT CRITERION MET: TYPE 2 LATENT DEFECT</span>
                  </div>
                )}
              </div>

              {/* Trajectory Composed Chart with Rocket Drawer Overlay */}
              <div className="chart-wrap trajectory" ref={trajectoryChartRef}>
                <MonteCarloRocketDrawer
                  containerRef={trajectoryChartRef}
                  isActive={showMonteCarlo}
                  runId={mcRunId}
                  data={trajectory}
                />

                <ResponsiveContainer width="100%" height={230}>
                  <ComposedChart data={trajectory} margin={{ top: 15, right: 25, left: 5, bottom: 20 }}>
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
                    <Area name="Healthy Baseline" dataKey="high" stroke="none" fill="url(#healthyBandGrad)" />
                    <Area name="low" dataKey="low" stroke="none" fill="#05080e" />
                    <Area name="P90 Corridor" dataKey="p90" stroke="none" fill="url(#confidenceCorridorGrad)" />
                    <Area name="p10" dataKey="p10" stroke="none" fill="#05080e" />

                    {showMonteCarlo && (
                      <Line
                        name="MC Sim"
                        dataKey="mcSim"
                        stroke="#29B6D1"
                        strokeWidth={2.8}
                        dot={false}
                        className="mc-rocket-line"
                        isAnimationActive={false}
                      />
                    )}

                    <Line
                      name="Safety Ceiling"
                      dataKey="ceiling"
                      stroke="#F59E0B"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                    <Line
                      name="Actual Telemetry"
                      dataKey="actual"
                      stroke="#29B6D1"
                      strokeWidth={2.8}
                      dot={{ r: 4, fill: '#29B6D1', stroke: '#05080e', strokeWidth: 2 }}
                    />
                    <Line
                      name="Predicted Forecast"
                      dataKey="forecast"
                      stroke="#F58220"
                      strokeWidth={2.5}
                      strokeDasharray="6 4"
                      dot={{ r: 4, fill: '#F58220', stroke: '#05080e', strokeWidth: 2 }}
                    />
                    <ReferenceLine
                      y={50}
                      stroke="#EF4444"
                      strokeDasharray="3 3"
                      label={{ value: 'MAX 50 µA', fill: '#EF4444', fontSize: 9, position: 'insideTopRight' }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="trajectory-foot">
                <span><i className="line cyan" /> ACTUAL TELEMETRY</span>
                <span><i className="line orange" /> PREDICTED HORIZON</span>
                <span><i className="line amber dashed" /> SAFETY CEILING (dI/dt)</span>
                <span className="limit">MAX LIMIT: 50 µA</span>
              </div>
            </div>
          </section>

          {/* ============================================================== */}
          {/* SECTION 4: DPAT METROLOGY & 6-AXIS MULTIVARIATE RADAR          */}
          {/* ============================================================== */}
          <div id="dpat-suite" className="scroll-anchor" />

          <section className="balanced-two-col">
            {/* Card 1: DPAT Gaussian Bell Curve */}
            <div
              className="panel chart-panel scroll-reveal-card"
              onMouseMove={handleCardTilt}
              onMouseLeave={resetCardTilt}
            >
              <div className="panel-head">
                <div>
                  <div className="section-tag">
                    <BarChart3 size={13} className="text-cyan" /> DPAT STATISTICAL METROLOGY
                  </div>
                  <h2>Gaussian Bell Curve & Outlier Demarcation</h2>
                </div>
                <div className="dpat-limits-pill">
                  <span className="limit-tag">DPAT +3 MAD: <b>22.4 µA</b></span>
                  <span className="limit-tag">DATASHEET: <b>40.0 µA</b></span>
                </div>
              </div>

              <div className="viz-legend-bar">
                <span className="legend-item"><span className="sample-bar blue" /> LOT HISTOGRAM</span>
                <span className="legend-item"><span className="sample-line orange" /> GAUSSIAN N(µ, σ)</span>
                <span className="legend-item"><span className="sample-line amber dashed" /> +3 MAD LIMIT</span>
                <span className="legend-item"><span className="sample-line red dashed" /> DATASHEET MAX</span>
              </div>

              <div className="chart-wrap" style={{ height: 210 }}>
                <ResponsiveContainer width="100%" height={210}>
                  <ComposedChart data={dpatHistogramData} margin={{ top: 15, right: 20, left: -20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="2 4" stroke="#ffffff0d" />
                    <XAxis dataKey="binLabel" stroke="#64748b" fontSize={9} unit=" µA" />
                    <YAxis stroke="#64748b" fontSize={9} allowDecimals={false} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="minimalist-tooltip">
                              <div className="tooltip-id">BIN: {d.binLabel} µA</div>
                              <div className="tooltip-row"><span>COUNT:</span> <b>{d.count} units</b></div>
                              <div className="tooltip-row"><span>GAUSSIAN DENSITY:</span> <b>{d.gaussianBell}</b></div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ReferenceLine x="22.5" stroke="#F59E0B" strokeDasharray="3 3" strokeWidth={1.5} />
                    <ReferenceLine x="40.0" stroke="#EF4444" strokeDasharray="3 3" strokeWidth={1.5} />
                    <Bar dataKey="count" fill="rgba(41, 182, 209, 0.45)" radius={[3, 3, 0, 0]} />
                    <Line type="monotone" dataKey="gaussianBell" stroke="#F58220" strokeWidth={2.2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="dpat-explainer-banner">
                <div className="explainer-icon"><AlertTriangle size={15} className="text-orange" /></div>
                <div className="explainer-text">
                  <strong>CORE PS170 VALUE: CATCHING THE "IN-SPEC" DEFECT</strong>
                  <span>
                    Selected part <b>{comp.id}</b> measures <b>{comp.baseline[1]} µA</b>. While legally inside the datasheet limit of <b>40.0 µA</b>, it breaches the Dynamic Part Average Testing (DPAT) statistical threshold of <b>22.4 µA</b> (+3.8 MAD). Standard ATE passes it; NIRIKSHAN catches the latent failure before flight integration.
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: 6-Axis Radar Spider Plot / Prognostic Scatter Toggle */}
            <div
              className="panel chart-panel scroll-reveal-card"
              onMouseMove={handleCardTilt}
              onMouseLeave={resetCardTilt}
            >
              <div className="panel-head">
                <div>
                  <div className="section-tag">
                    <RadarIcon size={13} className="text-orange" /> MULTIVARIATE ENVELOPE
                  </div>
                  <h2>6-Axis Latent Defect Radar</h2>
                </div>
                <div className="radar-head-tabs">
                  <button
                    className={`radar-head-tab-btn ${radarOrScatter === 'radar' ? 'active' : ''}`}
                    onClick={() => setRadarOrScatter('radar')}
                  >
                    6-AXIS RADAR
                  </button>
                  <button
                    className={`radar-head-tab-btn ${radarOrScatter === 'scatter' ? 'active' : ''}`}
                    onClick={() => setRadarOrScatter('scatter')}
                  >
                    PROGNOSTIC SCATTER
                  </button>
                </div>
              </div>

              {radarOrScatter === 'radar' ? (
                <div className="radar-layout-split">
                  <div className="radar-quick-view">
                    <svg viewBox="0 0 280 220" className="radar-inline-svg">
                      {/* Web concentric rings */}
                      {[0.25, 0.5, 0.75, 1.0].map((ringLevel, i) => {
                        const r = radarMetrics.radius * ringLevel;
                        const pts = [0, 1, 2, 3, 4, 5]
                          .map((idx) => {
                            const angle = (Math.PI * 2 / 6) * idx - Math.PI / 2;
                            return `${radarMetrics.center.x + r * Math.cos(angle)},${radarMetrics.center.y + r * Math.sin(angle)}`;
                          })
                          .join(' ');
                        return <polygon key={i} points={pts} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />;
                      })}
                      {/* Radial spokes */}
                      {[0, 1, 2, 3, 4, 5].map((idx) => {
                        const pt = radarMetrics.getPt(100, idx);
                        return <line key={idx} x1={radarMetrics.center.x} y1={radarMetrics.center.y} x2={pt.x} y2={pt.y} stroke="rgba(41,182,209,0.2)" strokeWidth="1" />;
                      })}
                      {/* Baseline Polygon */}
                      <polygon
                        points={radarMetrics.basePts}
                        fill="rgba(41, 182, 209, 0.22)"
                        stroke="#29B6D1"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                      />
                      {/* Unit Polygon */}
                      <polygon
                        points={radarMetrics.unitPts}
                        fill={comp.verdict === 'REJECT' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 130, 32, 0.3)'}
                        stroke={comp.verdict === 'REJECT' ? '#EF4444' : '#F58220'}
                        strokeWidth="2.0"
                      />
                      {radarMetrics.values.map((v, i) => {
                        const pt = radarMetrics.getPt(v, i);
                        return (
                          <circle
                            key={i}
                            cx={pt.x}
                            cy={pt.y}
                            r="3.5"
                            fill={comp.verdict === 'REJECT' ? '#EF4444' : '#F58220'}
                            stroke="#ffffff"
                            strokeWidth="1"
                          />
                        );
                      })}
                    </svg>
                    <div className="radar-labels-legend">
                      <span><i className="dot cyan" /> HEALTHY BASELINE</span>
                      <span><i className="dot orange" /> {comp.id} ENVELOPE</span>
                    </div>
                  </div>

                  <div className="radar-metrics-list">
                    <span className="metrics-header">6 MULTIVARIATE AXES</span>
                    <div className="radar-metric-row"><span>LEAKAGE (24h)</span><b>{comp.baseline[1]} µA</b></div>
                    <div className="radar-metric-row"><span>IDDQ STANDBY</span><b>{comp.baseline[0]} µA</b></div>
                    <div className="radar-metric-row"><span>PROP DELAY</span><b>{comp.delay} ns</b></div>
                    <div className="radar-metric-row"><span>Δ-24h DRIFT</span><b>+{(comp.baseline[1] - comp.baseline[0]).toFixed(2)} µA</b></div>
                    <div className="radar-metric-row"><span>Δ-96h DRIFT</span><b>+{(comp.baseline[2] - comp.baseline[0]).toFixed(2)} µA</b></div>
                    <div className="radar-metric-row"><span>ROBUST Z-SCORE</span><b>+{comp.mad.toFixed(1)} MAD</b></div>
                  </div>
                </div>
              ) : (
                <div className="chart-wrap" style={{ height: 230 }}>
                  <div className="maha-header-legend">
                    <span><i className="dot green" /> Q3: STABLE</span>
                    <span><i className="dot amber" /> Q2: LATE ONSET</span>
                    <span><i className="dot red" /> Q1: ACCELERATED FAILURE</span>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <ScatterChart margin={{ top: 10, right: 15, left: -15, bottom: 15 }}>
                      <CartesianGrid strokeDasharray="2 4" stroke="#ffffff0d" />
                      <XAxis type="number" dataKey="d24" name="Δ-24h" unit=" µA" stroke="#64748b" fontSize={9} domain={[0, 8]} />
                      <YAxis type="number" dataKey="d168" name="Δ-168h" unit=" µA" stroke="#64748b" fontSize={9} domain={[0, 45]} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const pt = payload[0].payload;
                            return (
                              <div className="minimalist-tooltip">
                                <div className="tooltip-id">{pt.id}</div>
                                <div className="tooltip-row"><span>EARLY DRIFT Δ(24h):</span> <b>+{pt.d24} µA</b></div>
                                <div className="tooltip-row"><span>FINAL DRIFT Δ(168h):</span> <b>+{pt.d168} µA</b></div>
                                <div className="tooltip-row"><span>VERDICT:</span> <b>{pt.verdict}</b></div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <ReferenceLine x={2.5} stroke="rgba(245, 158, 11, 0.4)" strokeDasharray="3 3" />
                      <ReferenceLine y={12.0} stroke="rgba(245, 158, 11, 0.4)" strokeDasharray="3 3" />
                      <Scatter
                        data={evaluatedComponents.map((c) => ({
                          id: c.id,
                          d24: Number(((c.baseline[1] - c.baseline[0])).toFixed(2)),
                          d168: Number(((c.baseline[3] - c.baseline[0])).toFixed(2)),
                          verdict: c.verdict
                        }))}
                        onClick={(pt) => setSelectedId(pt.id)}
                        cursor="pointer"
                      >
                        {evaluatedComponents.map((c) => (
                          <Cell
                            key={c.id}
                            fill={verdictColor[c.verdict]}
                            r={selectedId === c.id ? 8 : 4.5}
                            stroke={selectedId === c.id ? '#ffffff' : 'none'}
                            strokeWidth={selectedId === c.id ? 2 : 0}
                          />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </section>

          {/* ============================================================== */}
          {/* SECTION 5: DECISION ENGINE, REASON CODES & ACTIONS             */}
          {/* ============================================================== */}
          <div id="decision-engine" className="scroll-anchor" />

          <section className="balanced-two-col">
            {/* Card 1: Diagnostic Reason Codes & Explainability */}
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
                      <ShieldCheck size={11} /> QA APPROVED
                    </span>
                  )}
                  {dispositions[comp.id]?.status === 'EXTENDED_240H' && (
                    <span className="flagged-stamp">
                      <Clock size={11} /> 240H SOAK
                    </span>
                  )}
                  {dispositions[comp.id]?.status === 'REJECT' && (
                    <span className="rejected-stamp">
                      <ShieldAlert size={11} /> QUARANTINED
                    </span>
                  )}
                </div>
              </div>

              {/* Diagnostic Reason Codes */}
              <div className="reasons">
                <div className="reason-item">
                  <span className="reason-num">RC-01</span>
                  <p>
                    <b>Population MAD:</b> 24h leakage ={' '}
                    <span className="val-hi">+{comp.mad.toFixed(1)} MAD</span> above lot median (Robust Modified Z-score).
                  </p>
                </div>
                <div className="reason-item">
                  <span className="reason-num">RC-02</span>
                  <p>
                    <b>Prognostic Horizon:</b> Projected 168h leakage ={' '}
                    <span className="val-hi">{comp.forecast.toFixed(1)} µA</span>{' '}
                    <small>[90% CI: {comp.ci[0]} – {comp.ci[1]} µA]</small>
                  </p>
                </div>
                <div className="reason-item">
                  <span className="reason-num">RC-03</span>
                  <p>
                    <b>Drift Rate Ratio:</b> Slope ({comp.slope.toFixed(3)} µA/h){' '}
                    {comp.slope > slope ? (
                      <span className="text-red">exceeds threshold ({slope.toFixed(2)} µA/h) by {((comp.slope / slope) * 100).toFixed(0)}%</span>
                    ) : (
                      <span className="text-green">conforms within margin ({slope.toFixed(2)} µA/h)</span>
                    )}
                    .
                  </p>
                </div>
              </div>

              <div className="driver-row">
                <span className="driver-label">PRIMARY LATENT DEFECT DRIVER</span>
                <b className="driver-val">{comp.driver}</b>
              </div>

              {/* SHAP Attribution Waterfall */}
              <div className="attribution">
                <div className="field-label">EXPLAINABLE SHAP ATTRIBUTION</div>
                <div className="attrib-bars">
                  <div className="attrib-col">
                    <span>0H BASE</span>
                    <div className="bar-track"><i style={{ width: '28%', background: '#29B6D1' }} /></div>
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
                </div>
              </div>
            </div>

            {/* Card 2: QA Engineering Action Center & Telemetry Dossier */}
            <div
              className="panel verdict-panel scroll-reveal-card"
              onMouseMove={handleCardTilt}
              onMouseLeave={resetCardTilt}
            >
              <div className="verdict-top">
                <div className="section-tag">
                  <UserCheck size={14} className="text-cyan" /> QA INSPECTOR ACTION CENTER
                </div>
                <span className="ch-verdict text-cyan" style={{ fontSize: 10 }}>MIL-STD-883 LEVEL-1</span>
              </div>

              <p className="sanity-desc">
                Authorized QA sign-off actions for flight-qualified hardware dispositioning, non-conformance logging, and engineering telemetry archiving.
              </p>

              <div className="action-buttons-stack">
                <button
                  className="action-btn disposition-modal-trigger full"
                  onClick={(e) => openModalWithOrigin(setIsDispositionOpen, e)}
                  title="Open Inspector Sign-Off Modal"
                >
                  <UserCheck size={14} />
                  <span>RECORD QA INSPECTION DISPOSITION</span>
                </button>

                <button
                  className="action-btn ncr-modal-trigger full"
                  onClick={(e) => openModalWithOrigin(setIsNCROpen, e)}
                  title="Generate Official ISRO Non-Conformance Report"
                >
                  <FileText size={14} />
                  <span>GENERATE ISRO NON-CONFORMANCE REPORT (NCR)</span>
                </button>

                <button
                  className="action-btn export full"
                  onClick={handleExportCSV}
                  title="Download full lot telemetry dossier in CSV"
                >
                  <Download size={14} />
                  <span>EXPORT COMPLETE 40-UNIT LOT DOSSIER (CSV)</span>
                </button>
              </div>

              <div className="part-audit-summary-box">
                <span className="box-title">AUDIT TRAIL TELEMETRY SUMMARY: {comp.id}</span>
                <div className="audit-grid">
                  <div><span>0h Baseline:</span> <b>{comp.baseline[0]} µA</b></div>
                  <div><span>24h Reading:</span> <b>{comp.baseline[1]} µA</b></div>
                  <div><span>96h Recal:</span> <b>{comp.baseline[2]} µA</b></div>
                  <div><span>168h Projected:</span> <b className="text-cyan">{comp.forecast} µA</b></div>
                  <div><span>Drift Velocity:</span> <b>{comp.slope.toFixed(3)} µA/h</b></div>
                  <div><span>Delay (tpd):</span> <b>{comp.delay} ns</b></div>
                </div>
              </div>
            </div>
          </section>

          {/* ============================================================== */}
          {/* SECTION 6: COMPONENT SCREENING INVENTORY & SEARCH LEDGER       */}
          {/* ============================================================== */}
          <div id="component-ledger" className="scroll-anchor" />

          <section className="panel decision-panel scroll-reveal-card">
            <div className="panel-head">
              <div>
                <div className="section-tag">
                  <FileSpreadsheet size={13} className="text-cyan" /> COMPONENT INVENTORY & AUDIT LEDGER
                </div>
                <h2>Flight Hardware Screening Telemetry Matrix</h2>
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
          </section>
        </main>
      </div>

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
