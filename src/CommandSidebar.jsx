import React, { useState } from 'react';
import {
  Activity,
  Thermometer,
  Layers3,
  Orbit,
  BarChart3,
  Target,
  FileSpreadsheet,
  Globe,
  FileText
} from 'lucide-react';

export default function CommandSidebar({
  activeSection = 'overview',
  onSelectSection,
  onOpenChamber,
  onOpenNews,
  onOpenNCR
}) {
  const [hoveredItem, setHoveredItem] = useState(null);

  // Strictly ordered sequential mission navigation (Top to Bottom order matching page layout)
  const navItems = [
    {
      id: 'overview',
      label: '1. FLIGHT TELEMETRY OVERVIEW',
      desc: 'Top KPIs & Lot Screening Controls',
      Icon: Activity,
      type: 'scroll'
    },
    {
      id: 'chamber-monitor',
      label: '2. 125°C IN-CHAMBER & ATE SANITY',
      desc: 'HTOL Soak Profile & Contact Verification',
      Icon: Thermometer,
      type: 'scroll'
    },
    {
      id: 'module-a',
      label: '3. MODULE A: POPULATION MATRIX',
      desc: 'Robust MAD, Mahalanobis & Wafer Map',
      Icon: Layers3,
      type: 'scroll'
    },
    {
      id: 'module-b',
      label: '4. MODULE B: DRIFT FORENSICS',
      desc: '0h-168h Trajectory & 96h Dynamic Inject',
      Icon: Orbit,
      type: 'scroll'
    },
    {
      id: 'dpat-suite',
      label: '5. DPAT & 6-AXIS RADAR METROLOGY',
      desc: 'Gaussian Bell Curve & Multivariate Spider',
      Icon: BarChart3,
      type: 'scroll'
    },
    {
      id: 'decision-engine',
      label: '6. DECISION & EXPLAINABILITY',
      desc: 'Risk Fusion, Reason Codes & Actions',
      Icon: Target,
      type: 'scroll'
    },
    {
      id: 'component-ledger',
      label: '7. COMPONENT INVENTORY LEDGER',
      desc: 'Flight Hardware Unit Audit Ledger',
      Icon: FileSpreadsheet,
      type: 'scroll'
    },
    {
      id: 'space-news',
      label: '8. ORBITAL INTELLIGENCE FEED',
      desc: 'Live Space Missions Dispatch Drawer',
      Icon: Globe,
      type: 'modal',
      action: onOpenNews
    },
    {
      id: 'export-ncr',
      label: '9. ISRO NON-CONFORMANCE REPORT',
      desc: 'Print/Export Level-1 QA NCR Sheet',
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
        // Smooth scroll with offset for topbar
        const headerOffset = 80;
        const elementPosition = targetEl.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({
          top: Math.max(0, offsetPosition),
          behavior: 'smooth'
        });
      }
    }
  };

  return (
    <nav className="aerospace-dock-rail" aria-label="Aerospace Command Dock">
      {/* Vertical Luminous Energy Conduit Line */}
      <div className="dock-energy-conduit">
        <span className="energy-pulse-beam" />
      </div>

      {/* Dock Icon Buttons in strict sequential order */}
      <div className="dock-buttons-stack">
        {navItems.map((item, idx) => {
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
              {/* Rotating Illuminated Orbital Ring with Ion Thruster Trail */}
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
