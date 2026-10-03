import React, { useEffect, useState } from 'react';
import { Gauge, Radio, Rocket, ShieldCheck, X } from 'lucide-react';

export default function RocketAnimation({ active, onClose }) {
  const [met, setMet] = useState(0);
  const [stage, setStage] = useState('IGNITION & LIFTOFF');

  useEffect(() => {
    if (!active) {
      setMet(0);
      setStage('PRE-LAUNCH STANDBY');
      return;
    }

    const interval = setInterval(() => {
      setMet((prev) => {
        const next = prev + 1;
        if (next < 20) setStage('MAXIMUM DYNAMIC PRESSURE (MAX-Q)');
        else if (next < 45) setStage('S200 STRAP-ON BOOSTER SEPARATION');
        else if (next < 80) setStage('L110 CORE STAGE BURN');
        else if (next < 110) setStage('PAYLOAD FAIRING JETTISON');
        else setStage('ORBITAL INSERTION (LEO 180×180 KM)');
        return next;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [active]);

  if (!active) return null;

  // Real-time telemetry calculations based on elapsed mission ticks
  const altitude = Math.min(220, (met * 1.85)).toFixed(1);
  const velocity = Math.min(7.82, (met * 0.065)).toFixed(2);
  const mach = Math.min(25.4, (met * 0.21)).toFixed(1);
  const downrange = Math.min(480, (met * 4.1)).toFixed(1);

  return (
    <div className="rocket-hud-overlay">
      {/* Precision Technical Flight Telemetry HUD */}
      <div className="rocket-hud-container">
        {/* Header Bar */}
        <div className="rocket-hud-header">
          <div className="hud-title">
            <span className="live-pulse" />
            <Rocket size={15} className="hud-icon" />
            <b>ISRO LV-SIM TELEMETRY HUD</b>
            <span className="hud-stage-pill">{stage}</span>
          </div>
          <div className="hud-controls">
            <span className="hud-met">MET: <b>T+{String(Math.floor(met / 5)).padStart(2, '0')}:{String((met * 12) % 60).padStart(2, '0')}</b></span>
            <button className="hud-close-btn" onClick={onClose} title="Dismiss Telemetry HUD">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Central Flight Stage Visualizer */}
        <div className="rocket-viewport">
          {/* Orbital Grid Lines */}
          <div className="vector-grid">
            <div className="grid-h-line line-1" />
            <div className="grid-h-line line-2" />
            <div className="grid-h-line line-3" />
            <div className="orbital-arc-line" />
          </div>

          {/* Minimalist Professional Aerospace Launch Vehicle */}
          <div className="rocket-vehicle-wrapper">
            <svg
              className="rocket-svg"
              viewBox="0 0 160 320"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Metallic Hull Gradients */}
                <linearGradient id="fairingGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#e2e8f0" />
                  <stop offset="50%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#cbd5e1" />
                </linearGradient>
                <linearGradient id="coreGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#94a3b8" />
                  <stop offset="50%" stopColor="#e2e8f0" />
                  <stop offset="100%" stopColor="#64748b" />
                </linearGradient>
                <linearGradient id="boosterGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#cbd5e1" />
                  <stop offset="50%" stopColor="#f8fafc" />
                  <stop offset="100%" stopColor="#94a3b8" />
                </linearGradient>
                {/* Supersonic Plasma Plume Gradients */}
                <linearGradient id="plumeGradCore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                  <stop offset="25%" stopColor="#60a5fa" stopOpacity="0.9" />
                  <stop offset="65%" stopColor="#f97316" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="plumeGradBooster" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                  <stop offset="35%" stopColor="#fdba74" stopOpacity="0.95" />
                  <stop offset="70%" stopColor="#ea580c" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#b91c1c" stopOpacity="0" />
                </linearGradient>
                <filter id="plumeGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
                </filter>
              </defs>

              {/* === Thrust Plumes (Exhaust with Mach Diamonds) === */}
              {/* Left Booster Plume */}
              <g className="thrust-flame booster-flame-left">
                <path
                  d="M 45 220 Q 42 270 48 300 Q 54 270 51 220 Z"
                  fill="url(#plumeGradBooster)"
                  filter="url(#plumeGlow)"
                  opacity="0.85"
                />
                <path
                  d="M 46 220 Q 44 250 48 275 Q 52 250 50 220 Z"
                  fill="#ffffff"
                  opacity="0.9"
                />
                {/* Mach Diamond Rings */}
                <ellipse cx="48" cy="235" rx="3.5" ry="1.5" fill="#ffffff" />
                <ellipse cx="48" cy="250" rx="2.5" ry="1.2" fill="#fed7aa" />
              </g>

              {/* Right Booster Plume */}
              <g className="thrust-flame booster-flame-right">
                <path
                  d="M 109 220 Q 106 270 112 300 Q 118 270 115 220 Z"
                  fill="url(#plumeGradBooster)"
                  filter="url(#plumeGlow)"
                  opacity="0.85"
                />
                <path
                  d="M 110 220 Q 108 250 112 275 Q 116 250 114 220 Z"
                  fill="#ffffff"
                  opacity="0.9"
                />
                {/* Mach Diamond Rings */}
                <ellipse cx="112" cy="235" rx="3.5" ry="1.5" fill="#ffffff" />
                <ellipse cx="112" cy="250" rx="2.5" ry="1.2" fill="#fed7aa" />
              </g>

              {/* Center Core Plume (Cryogenic/Liquid) */}
              <g className="thrust-flame core-flame">
                <path
                  d="M 72 225 Q 68 280 80 315 Q 92 280 88 225 Z"
                  fill="url(#plumeGradCore)"
                  filter="url(#plumeGlow)"
                />
                <path
                  d="M 75 225 Q 73 260 80 285 Q 87 260 85 225 Z"
                  fill="#93c5fd"
                  opacity="0.95"
                />
                <ellipse cx="80" cy="238" rx="4" ry="1.8" fill="#ffffff" />
                <ellipse cx="80" cy="256" rx="3" ry="1.4" fill="#60a5fa" />
              </g>

              {/* === Main Launch Vehicle Structure === */}
              {/* Left Strap-on Solid Booster (S200) */}
              <g id="booster-left">
                {/* Booster Nose Cone */}
                <path d="M 42 108 Q 48 85 48 85 Q 48 85 54 108 Z" fill="url(#boosterGrad)" stroke="#475569" strokeWidth="0.8" />
                {/* Booster Body Cylinder */}
                <rect x="42" y="108" width="12" height="110" rx="2" fill="url(#boosterGrad)" stroke="#475569" strokeWidth="0.8" />
                {/* Segment Weld Rings */}
                <line x1="42" y1="135" x2="54" y2="135" stroke="#64748b" strokeWidth="0.8" />
                <line x1="42" y1="165" x2="54" y2="165" stroke="#64748b" strokeWidth="0.8" />
                <line x1="42" y1="195" x2="54" y2="195" stroke="#64748b" strokeWidth="0.8" />
                {/* Booster Nozzle */}
                <path d="M 44 218 L 41 224 L 55 224 L 52 218 Z" fill="#334155" stroke="#1e293b" strokeWidth="0.8" />
                {/* Saffron Ring / ISRO Orange Band */}
                <rect x="42" y="112" width="12" height="3" fill="#f97316" />
              </g>

              {/* Right Strap-on Solid Booster (S200) */}
              <g id="booster-right">
                {/* Booster Nose Cone */}
                <path d="M 106 108 Q 112 85 112 85 Q 112 85 118 108 Z" fill="url(#boosterGrad)" stroke="#475569" strokeWidth="0.8" />
                {/* Booster Body Cylinder */}
                <rect x="106" y="108" width="12" height="110" rx="2" fill="url(#boosterGrad)" stroke="#475569" strokeWidth="0.8" />
                {/* Segment Weld Rings */}
                <line x1="106" y1="135" x2="118" y2="135" stroke="#64748b" strokeWidth="0.8" />
                <line x1="106" y1="165" x2="118" y2="165" stroke="#64748b" strokeWidth="0.8" />
                <line x1="106" y1="195" x2="118" y2="195" stroke="#64748b" strokeWidth="0.8" />
                {/* Booster Nozzle */}
                <path d="M 108 218 L 105 224 L 119 224 L 116 218 Z" fill="#334155" stroke="#1e293b" strokeWidth="0.8" />
                {/* Saffron Ring / ISRO Orange Band */}
                <rect x="106" y="112" width="12" height="3" fill="#f97316" />
              </g>

              {/* Center Core Stage (L110 + C25 Upper Stage) */}
              <g id="center-core">
                {/* Aerodynamic Payload Fairing (Ogive) */}
                <path
                  d="M 68 62 C 68 35 78 18 80 18 C 82 18 92 35 92 62 Z"
                  fill="url(#fairingGrad)"
                  stroke="#334155"
                  strokeWidth="1"
                />
                {/* Fairing Split Line */}
                <line x1="80" y1="18" x2="80" y2="62" stroke="#94a3b8" strokeWidth="0.6" strokeDasharray="2 1" />
                
                {/* Upper Stage Interstage (C25 Cryogenic) */}
                <rect x="68" y="62" width="24" height="38" fill="url(#coreGrad)" stroke="#334155" strokeWidth="0.8" />
                {/* Interstage Lattice / Rings */}
                <line x1="68" y1="75" x2="92" y2="75" stroke="#475569" strokeWidth="0.8" />
                <line x1="68" y1="95" x2="92" y2="95" stroke="#475569" strokeWidth="0.8" />
                <circle cx="80" cy="85" r="2.5" fill="#38bdf8" />

                {/* Core Liquid Stage Body (L110) */}
                <rect x="68" y="100" width="24" height="122" fill="url(#coreGrad)" stroke="#334155" strokeWidth="0.9" />
                {/* Core Technical Panel Lines */}
                <line x1="74" y1="100" x2="74" y2="222" stroke="#64748b" strokeWidth="0.5" strokeOpacity="0.6" />
                <line x1="86" y1="100" x2="86" y2="222" stroke="#64748b" strokeWidth="0.5" strokeOpacity="0.6" />
                <line x1="68" y1="140" x2="92" y2="140" stroke="#475569" strokeWidth="0.8" />
                <line x1="68" y1="180" x2="92" y2="180" stroke="#475569" strokeWidth="0.8" />

                {/* Center Core Engine Skirt & Twin Vikas Engines */}
                <path d="M 68 222 L 72 226 L 88 226 L 92 222 Z" fill="#1e293b" />
                <path d="M 74 226 L 72 232 L 78 232 L 76 226 Z" fill="#0f172a" />
                <path d="M 84 226 L 82 232 L 88 232 L 86 226 Z" fill="#0f172a" />

                {/* ISRO Tricolor Accent Bar */}
                <rect x="78" y="112" width="4" height="18" fill="#f97316" />
                <rect x="78" y="130" width="4" height="2" fill="#ffffff" />
                <rect x="78" y="132" width="4" height="18" fill="#10b981" />
              </g>
            </svg>

            {/* Aerodynamic shock cone particles during high velocity */}
            <div className="mach-condensation-cone" />
          </div>

          {/* Real-time Flight Instrument Matrix */}
          <div className="flight-telemetry-matrix">
            <div className="telemetry-cell">
              <span className="cell-label">ALTITUDE</span>
              <span className="cell-value">{altitude} <small>KM</small></span>
              <div className="cell-bar"><i style={{ width: `${Math.min(100, (Number(altitude) / 220) * 100)}%` }} /></div>
            </div>

            <div className="telemetry-cell">
              <span className="cell-label">VELOCITY</span>
              <span className="cell-value">{velocity} <small>KM/S</small></span>
              <div className="cell-bar"><i style={{ width: `${Math.min(100, (Number(velocity) / 7.82) * 100)}%`, background: '#38bdf8' }} /></div>
            </div>

            <div className="telemetry-cell">
              <span className="cell-label">MACH SPEED</span>
              <span className="cell-value">M {mach}</span>
              <div className="cell-bar"><i style={{ width: `${Math.min(100, (Number(mach) / 25.4) * 100)}%`, background: '#f59e0b' }} /></div>
            </div>

            <div className="telemetry-cell">
              <span className="cell-label">DOWNRANGE</span>
              <span className="cell-value">{downrange} <small>KM</small></span>
              <div className="cell-bar"><i style={{ width: `${Math.min(100, (Number(downrange) / 480) * 100)}%`, background: '#10b981' }} /></div>
            </div>
          </div>
        </div>

        {/* Footer Sub-system Diagnostics */}
        <div className="rocket-hud-footer">
          <div className="telemetry-status-tags">
            <span><Gauge size={12} /> DYNAMIC PRESSURE: <b>NOMINAL (Q = 38.4 kPa)</b></span>
            <span><Radio size={12} /> TELEMETRY LINK: <b>ISTRAC GROUND STN LOCK</b></span>
            <span><ShieldCheck size={12} /> ESS SCREENING STATUS: <b>GATED & VERIFIED</b></span>
          </div>
          <div className="mission-flag">LVM3-M5 / NIRIKSHAN PAYLOAD INJECTION</div>
        </div>
      </div>
    </div>
  );
}
