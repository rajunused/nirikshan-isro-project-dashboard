import React, { useState } from 'react';
import {
  Activity,
  Layers3,
  Orbit,
  BarChart3,
  Target,
  Thermometer,
  Radio,
  FileText,
  Rocket,
  ShieldCheck,
  Zap,
  Globe
} from 'lucide-react';

export default function CommandSidebar({
  activeSection = 'overview',
  onSelectSection,
  onOpenChamber,
  onOpenNews,
  onOpenNCR
}) {
  const [hoveredItem, setHoveredItem] = useState(null);

  const navItems = [
    {
      id: 'overview',
      label: 'FLIGHT TELEMETRY OVERVIEW',
      desc: 'Top KPIs & Screening Status',
      Icon: Activity,
      type: 'scroll'
    },
    {
      id: 'module-a',
      label: 'MODULE A: POPULATION MATRIX',
      desc: 'Robust MAD & Wafer Spatial Map',
      Icon: Layers3,
      type: 'scroll'
    },
    {
      id: 'module-b',
      label: 'MODULE B: DRIFT FORENSICS',
      desc: '0h-168h Trajectory & 96h Inject',
      Icon: Orbit,
      type: 'scroll'
    },
    {
      id: 'adv-viz-suite',
      label: 'ADVANCED DATA & DPAT SUITE',
      desc: 'Outlier Bell Curve, Radar & Scatter',
      Icon: BarChart3,
      type: 'scroll'
    },
    {
      id: 'decision-engine',
      label: 'DECISION & EXPLAINABILITY',
      desc: 'Risk Fusion, SHAP & Gated Action',
      Icon: Target,
      type: 'scroll'
    },
    {
      id: 'chamber-monitor',
      label: '125°C IN-CHAMBER MONITOR',
      desc: 'HTOL Environment Telemetry',
      Icon: Thermometer,
      type: 'modal',
      action: onOpenChamber
    },
    {
      id: 'space-news',
      label: 'ORBITAL INTELLIGENCE FEED',
      desc: 'Live Mission News Drawer',
      Icon: Globe,
      type: 'modal',
      action: onOpenNews
    },
    {
      id: 'export-ncr',
      label: 'ISRO NON-CONFORMANCE REPORT',
      desc: 'Print/Export Level-1 NCR Sheet',
      Icon: FileText,
      type: 'modal',
      action: onOpenNCR
    }
  ];

  const handleItemClick = (e, item) => {
    // Record click position on document root for 3D shared-element expanding origin
    const rect = e.currentTarget.getBoundingClientRect();
    const originX = `${((rect.left + rect.width / 2) / window.innerWidth) * 100}%`;
    const originY = `${((rect.top + rect.height / 2) / window.innerHeight) * 100}%`;
    document.documentElement.style.setProperty('--modal-origin-x', originX);
    document.documentElement.style.setProperty('--modal-origin-y', originY);

    if (item.type === 'modal' && item.action) {
      item.action(e);
    } else {
      if (onSelectSection) onSelectSection(item.id);
      const targetEl = document.getElementById(item.id);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <nav className="aerospace-dock-rail" aria-label="Aerospace Command Dock">
      {/* Vertical Luminous Energy Conduit Line */}
      <div className="dock-energy-conduit">
        <span className="energy-pulse-beam" />
      </div>

      {/* Dock Icon Buttons */}
      <div className="dock-buttons-stack">
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          const isHovered = hoveredItem === item.id;
          const Icon = item.Icon;

          return (
            <div
              key={item.id}
              className={`dock-item-wrapper ${isActive ? 'active' : ''} ${isHovered ? 'hovered' : ''}`}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              {/* Rotating Illuminated Orbital Ring with Ion Thruster Trail (Novel Space Effect) */}
              {isActive && (
                <div className="orbital-active-ring">
                  <svg className="orbital-svg-track" viewBox="0 0 54 54">
                    <defs>
                      <linearGradient id="ionThrusterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#29B6D1" stopOpacity="1" />
                        <stop offset="50%" stopColor="#F58220" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#29B6D1" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {/* Outer Rotating Plasma Ring */}
                    <circle
                      cx="27"
                      cy="27"
                      r="23"
                      fill="none"
                      stroke="url(#ionThrusterGrad)"
                      strokeWidth="1.8"
                      strokeDasharray="38 80"
                      className="orbit-spin-circle"
                    />
                    {/* Inner Counter-Rotating Sub-Ring */}
                    <circle
                      cx="27"
                      cy="27"
                      r="19"
                      fill="none"
                      stroke="rgba(41, 182, 209, 0.35)"
                      strokeWidth="1"
                      strokeDasharray="15 35"
                      className="orbit-counter-circle"
                    />
                  </svg>
                  <span className="ion-particle-spark spark-1" />
                  <span className="ion-particle-spark spark-2" />
                </div>
              )}

              {/* The Command Button */}
              <button
                className={`dock-icon-btn ${isActive ? 'btn-active' : ''}`}
                onClick={(e) => handleItemClick(e, item)}
                title={item.label}
                aria-label={item.label}
              >
                {/* Circular Shockwave / Corona Pulse on Hover */}
                {isHovered && <span className="corona-pulse-wave" />}
                <Icon size={18} className="dock-icon" />
              </button>

              {/* Slide-out Monospaced Telemetry Label Flyout */}
              <div className={`dock-label-flyout ${isHovered ? 'revealed' : ''}`}>
                <div className="flyout-title">{item.label}</div>
                <div className="flyout-desc">{item.desc}</div>
                <div className="flyout-arrow" />
              </div>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
