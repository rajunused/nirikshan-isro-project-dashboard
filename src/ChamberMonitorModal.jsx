import React, { useState } from 'react';
import {
  Thermometer,
  Zap,
  Activity,
  CheckCircle2,
  AlertTriangle,
  X,
  Gauge,
  Flame,
  Radio,
  Clock,
  Layers,
  ShieldCheck
} from 'lucide-react';
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

// 168h Thermal Chamber Soak Telemetry Profile
const SOAK_PROFILE = [
  { hour: '0h', temp: 24.5, target: 125, vdd: 3.30, duty: 98, status: 'RAMP UP' },
  { hour: '12h', temp: 124.8, target: 125, vdd: 3.30, duty: 65, status: 'SOAK STABLE' },
  { hour: '24h', temp: 125.1, target: 125, vdd: 3.31, duty: 64, status: 'INTERIM T1' },
  { hour: '48h', temp: 125.0, target: 125, vdd: 3.30, duty: 62, status: 'SOAK STABLE' },
  { hour: '72h', temp: 124.9, target: 125, vdd: 3.29, duty: 63, status: 'SOAK STABLE' },
  { hour: '96h', temp: 125.2, target: 125, vdd: 3.30, duty: 64, status: 'INTERIM T2 (CRITICAL)' },
  { hour: '120h', temp: 125.0, target: 125, vdd: 3.30, duty: 61, status: 'SOAK STABLE' },
  { hour: '144h', temp: 125.1, target: 125, vdd: 3.31, duty: 65, status: 'SOAK STABLE' },
  { hour: '168h', temp: 125.0, target: 125, vdd: 3.30, duty: 62, status: 'FINAL COMPLETION' }
];

// Pre-Screening ATE Sanity Checker Channels
const ATE_SANITY_CHANNELS = [
  { pin: 'CH-01: VDD_CORE', test: 'Contact Resistance', measured: '0.42 Ω', limit: '< 1.5 Ω', status: 'PASS' },
  { pin: 'CH-02: GND_SUB', test: 'Substrate Ground Return', measured: '0.18 Ω', limit: '< 1.0 Ω', status: 'PASS' },
  { pin: 'CH-03: CLK_DIFF+', test: 'High-Speed Clock Jitter', measured: '1.24 ps', limit: '< 8.0 ps', status: 'PASS' },
  { pin: 'CH-04: I/O_LEAK', test: 'Negative Delay Check', measured: '+4.82 ns', limit: '> 0.0 ns', status: 'PASS' },
  { pin: 'CH-05: SENSE_RAD', test: 'Thermal Diode Cal', measured: '125.1°C', limit: '±1.0°C', status: 'PASS' },
  { pin: 'CH-06: PROBE_BUS', test: 'Short-Circuit Leakage', measured: '< 10 nA', limit: '< 500 nA', status: 'PASS' }
];

export default function ChamberMonitorModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('temp'); // 'temp' | 'ate'

  if (!isOpen) return null;

  return (
    <div className="chamber-modal-backdrop modal-3d-backdrop open" onClick={onClose}>
      <div className="chamber-modal-card modal-3d-box" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="chamber-modal-header">
          <div className="chamber-title-group">
            <div className="chamber-meta-tag">
              <span className="live-indicator-beacon" />
              <Thermometer size={13} className="text-orange" />
              <span>ISRO CLEANROOM QUALIFICATION • VSSC-TC-04</span>
            </div>
            <h2>In-Chamber ESS Environment Telemetry</h2>
            <div className="chamber-subtitle">
              MIL-STD-883G METHOD 1015 COND D • 125°C HIGH-TEMPERATURE OPERATING LIFE (HTOL)
            </div>
          </div>

          <div className="chamber-header-actions">
            <div className="chamber-status-pill">
              <span className="pulse-dot-green" />
              <span>ENVIRONMENT: NOMINAL</span>
            </div>
            <button className="modal-close-btn" onClick={onClose} title="Close chamber monitor">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Real-time KPI Tiles */}
        <div className="chamber-kpi-grid">
          <div className="chamber-kpi-card">
            <span className="kpi-label">CHAMBER TEMP</span>
            <div className="kpi-reading highlight-orange">
              125.1 <small>°C</small>
            </div>
            <div className="kpi-sub">SETPOINT: 125.0°C (±0.2°C DEV)</div>
          </div>

          <div className="chamber-kpi-card">
            <span className="kpi-label">VDD BIAS VOLTAGE</span>
            <div className="kpi-reading highlight-cyan">
              3.30 <small>V</small>
            </div>
            <div className="kpi-sub">NOMINAL FLIGHT BUS LIMIT</div>
          </div>

          <div className="chamber-kpi-card">
            <span className="kpi-label">SOAK PROGRESS</span>
            <div className="kpi-reading highlight-green">
              96.0 <small>/ 168h</small>
            </div>
            <div className="kpi-sub">57.1% DURATION COMPLETED</div>
          </div>

          <div className="chamber-kpi-card">
            <span className="kpi-label">ATE CONTACT SANITY</span>
            <div className="kpi-reading highlight-green">
              PASS <small>(0 FAILS)</small>
            </div>
            <div className="kpi-sub">ZERO NEGATIVE DELAYS</div>
          </div>
        </div>

        {/* Sub-Tabs */}
        <div className="chamber-tabs">
          <button
            className={`chamber-tab ${activeTab === 'temp' ? 'active' : ''}`}
            onClick={() => setActiveTab('temp')}
          >
            <Thermometer size={13} />
            <span>168H THERMAL SOAK PROFILE</span>
          </button>
          <button
            className={`chamber-tab ${activeTab === 'ate' ? 'active' : ''}`}
            onClick={() => setActiveTab('ate')}
          >
            <ShieldCheck size={13} />
            <span>AUTOMATED ATE CONTACT SANITY CHECK (CH-01 TO CH-06)</span>
          </button>
        </div>

        {/* Tab 1: Thermal Profile Chart */}
        {activeTab === 'temp' && (
          <div className="chamber-chart-panel">
            <div className="chamber-chart-legend">
              <span>
                <i className="line orange" /> MEASURED SOAK TEMPERATURE (°C)
              </span>
              <span>
                <i className="line cyan dashed" /> HEATER DUTY CYCLE (%)
              </span>
              <span className="target-note">TARGET: 125.0°C STEADY-STATE</span>
            </div>

            <div className="chamber-chart-wrap">
              <ResponsiveContainer width="100%" height={230}>
                <AreaChart data={SOAK_PROFILE}>
                  <defs>
                    <linearGradient id="soakGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f58220" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#f58220" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke="#ffffff0d" vertical={false} />
                  <XAxis dataKey="hour" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis domain={[20, 140]} stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="minimalist-tooltip">
                            <div className="tooltip-id">TIME: {label}</div>
                            <div className="tooltip-row">
                              <span>TEMPERATURE:</span>
                              <b>{payload[0].value} °C</b>
                            </div>
                            <div className="tooltip-row">
                              <span>STAGE:</span>
                              <b>{payload[0].payload.status}</b>
                            </div>
                            <div className="tooltip-row">
                              <span>HEATER DUTY:</span>
                              <b>{payload[0].payload.duty}%</b>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine y={125} stroke="#f58220" strokeDasharray="3 3" />
                  <Area
                    type="monotone"
                    dataKey="temp"
                    stroke="#f58220"
                    strokeWidth={2.4}
                    fill="url(#soakGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tab 2: ATE Sanity Checker Matrix */}
        {activeTab === 'ate' && (
          <div className="ate-sanity-matrix">
            <div className="ate-table-header">
              <span>TEST CHANNEL</span>
              <span>TEST PARAMETER</span>
              <span>MEASURED VALUE</span>
              <span>FLIGHT SPEC LIMIT</span>
              <span>SANITY VERDICT</span>
            </div>

            <div className="ate-table-body">
              {ATE_SANITY_CHANNELS.map((ch) => (
                <div key={ch.pin} className="ate-table-row">
                  <b className="ch-pin">{ch.pin}</b>
                  <span className="ch-test">{ch.test}</span>
                  <span className="ch-measured highlight-cyan">{ch.measured}</span>
                  <span className="ch-limit">{ch.limit}</span>
                  <span className="ch-status pass">
                    <CheckCircle2 size={12} /> {ch.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="ate-table-footer">
              <CheckCircle2 size={13} className="text-green" />
              <span>
                <b>Sanity Checker Verified:</b> Zero open-pin contact anomalies or negative propagation delays detected.
                All 40 units in active lot are electrically valid for statistical MAD and Mahalanobis screening.
              </span>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="chamber-modal-foot">
          <div className="chamber-foot-specs">
            <span>CHAMBER: VSSC-TC-04</span>
            <span>ATMOSPHERE: 99.999% N2 PURGE</span>
            <span>PRESSURE: 101.3 kPa</span>
            <span>THERMOCOUPLES: 8-CHANNEL CALIBRATED</span>
          </div>
          <button className="subtle-btn" onClick={onClose}>
            CLOSE MONITOR
          </button>
        </div>
      </div>
    </div>
  );
}
