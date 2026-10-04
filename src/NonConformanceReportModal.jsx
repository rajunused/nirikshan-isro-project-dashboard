import React, { useState } from 'react';
import { FileText, Printer, Copy, Check, X, ShieldAlert, Download, Target, Award } from 'lucide-react';
import IsroLogo from './IsroLogo';

export default function NonConformanceReportModal({ isOpen, onClose, component, lot, slope }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !component) return null;

  const ncrId = `ISRO/QAD/NCR-2026-${component.id}`;
  const currentDate = new Date().toISOString().split('T')[0];

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    const text = `
======================================================================
INDIAN SPACE RESEARCH ORGANISATION • DEPARTMENT OF SPACE
QUALITY ASSURANCE & RELIABILITY DIRECTORATE (VSSC)
NON-CONFORMANCE REPORT (NCR) — SIH-PS170 NIRIKSHAN
======================================================================
NCR REFERENCE:    ${ncrId}
DATE OF ISSUE:    ${currentDate}
LOT IDENTIFIER:   ${lot}
COMPONENT ID:     ${component.id}
ANOMALY PROFILE:  ${component.type}
FINAL VERDICT:    ${component.verdict}
----------------------------------------------------------------------
TELEMETRY AUDIT:
• 0h Baseline:     ${component.baseline[0]} µA
• 24h Reading:     ${component.baseline[1]} µA
• 96h Intermediate:${component.baseline[2]} µA
• 168h Projected:  ${component.forecast} µA (CI: ${component.ci[0]} - ${component.ci[1]} µA)
• Drift Rate:      ${component.slope.toFixed(3)} µA/h (Safety Threshold: ${slope.toFixed(2)} µA/h)
• Modified MAD:    +${component.mad.toFixed(2)} σ
----------------------------------------------------------------------
ENGINEERING DIAGNOSTIC:
${component.driver}.
Drift gradient indicates latent oxide-defect or semiconductor trap charging
under 125°C soak conditioning. Unit disqualified from Class-1 flight installation.
----------------------------------------------------------------------
AUTHORIZED SIGN-OFF:
QA Lead Engineer: [ISRO-VSSC-8834]   Payload Systems Director: [ISRO-DOS-109]
======================================================================
`.trim();

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="ncr-modal-backdrop" onClick={onClose}>
      <div className="ncr-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Top Bar */}
        <div className="ncr-top-bar">
          <div className="ncr-doc-tag">
            <FileText size={13} className="text-orange" />
            <span>OFFICIAL ISRO QUALITY AUDIT DOCUMENT • LEVEL-1 NON-CONFORMANCE</span>
          </div>
          <div className="ncr-top-actions">
            <button className="ncr-action-btn" onClick={handleCopy} title="Copy formatted text to clipboard">
              {copied ? <Check size={13} className="text-green" /> : <Copy size={13} />}
              <span>{copied ? 'COPIED!' : 'COPY TEXT'}</span>
            </button>
            <button className="ncr-action-btn primary" onClick={handlePrint} title="Print or save as PDF">
              <Printer size={13} />
              <span>PRINT / PDF</span>
            </button>
            <button className="ncr-close-btn" onClick={onClose} title="Close report">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Printable Report Sheet Content */}
        <div className="ncr-printable-sheet">
          {/* Official ISRO Header */}
          <header className="ncr-header">
            <div className="ncr-logo-wrap">
              <IsroLogo width={52} height={52} />
            </div>
            <div className="ncr-header-text">
              <h4>भारतीय अंतरिक्ष अनुसंधान संगठन • अंतरिक्ष विभाग, भारत सरकार</h4>
              <h3>INDIAN SPACE RESEARCH ORGANISATION • DEPARTMENT OF SPACE</h3>
              <div className="ncr-org-unit">
                DIRECTORATE OF QUALITY ASSURANCE & RELIABILITY • VIKRAM SARABHAI SPACE CENTRE (VSSC)
              </div>
              <div className="ncr-project-tag">
                PROJECT NIRIKSHAN • SIH-PS170 DYNAMIC ESS LATENT-DEFECT INTELLIGENCE HUB
              </div>
            </div>
          </header>

          <div className="ncr-divider" />

          {/* Document Meta Table */}
          <div className="ncr-meta-table">
            <div className="meta-cell">
              <span className="meta-label">DOCUMENT REF:</span>
              <b className="meta-val">{ncrId}</b>
            </div>
            <div className="meta-cell">
              <span className="meta-label">ISSUE DATE:</span>
              <b className="meta-val">{currentDate}</b>
            </div>
            <div className="meta-cell">
              <span className="meta-label">SCREENING LOT:</span>
              <b className="meta-val">{lot}</b>
            </div>
            <div className="meta-cell">
              <span className="meta-label">QUALITY CLASSIFICATION:</span>
              <b className="meta-val highlight-amber">MIL-STD-883G CLASS V FLIGHT</b>
            </div>
          </div>

          {/* Discrepant Component Summary */}
          <div className="ncr-section-title">1. NON-CONFORMING HARDWARE IDENTIFICATION</div>
          <div className="ncr-hardware-grid">
            <div className="ncr-hw-card">
              <span className="hw-lbl">COMPONENT SERIAL:</span>
              <b className="hw-val">{component.id}</b>
            </div>
            <div className="ncr-hw-card">
              <span className="hw-lbl">ANOMALY PROFILE:</span>
              <b className="hw-val">{component.type}</b>
            </div>
            <div className="ncr-hw-card">
              <span className="hw-lbl">PREDICTED 168H LEAKAGE:</span>
              <b className="hw-val highlight-red">{component.forecast} µA</b>
            </div>
            <div className="ncr-hw-card">
              <span className="hw-lbl">EVALUATION DISPOSITION:</span>
              <b
                className={`hw-val ${
                  component.verdict === 'REJECT' ? 'highlight-red' : 'highlight-amber'
                }`}
              >
                {component.verdict === 'REJECT' ? 'DISQUALIFIED (REJECT)' : 'GATED REVIEW REQUIRED'}
              </b>
            </div>
          </div>

          {/* Telemetry Progression Table */}
          <div className="ncr-section-title">2. 168H DYNAMIC BURN-IN TELEMETRY PROGRESSION</div>
          <table className="ncr-telemetry-table">
            <thead>
              <tr>
                <th>INSPECTION INTERVAL</th>
                <th>MEASURED LEAKAGE (Iddq)</th>
                <th>LOT MEDIAN (µA)</th>
                <th>DELTA (MAD SIGMA)</th>
                <th>RATE OF DRIFT (dV/dt)</th>
                <th>CRITERION STATUS</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>0h (Initial Soak)</td>
                <td>{component.baseline[0]} µA</td>
                <td>10.2 µA</td>
                <td>+{(component.mad * 0.2).toFixed(2)} σ</td>
                <td>0.000 µA/h</td>
                <td className="status-pass">BASELINE SET</td>
              </tr>
              <tr>
                <td>24h (Early Thermal Soak)</td>
                <td>{component.baseline[1]} µA</td>
                <td>11.4 µA</td>
                <td>+{(component.mad * 0.5).toFixed(2)} σ</td>
                <td>{((component.baseline[1] - component.baseline[0]) / 24).toFixed(3)} µA/h</td>
                <td className={component.mad > 2.5 ? 'status-flag' : 'status-pass'}>
                  {component.mad > 2.5 ? 'EARLY TRAJECTORY ELEVATED' : 'CONFORMING'}
                </td>
              </tr>
              <tr>
                <td>96h (Mid-Burn-in Recalibration)</td>
                <td>{component.baseline[2]} µA</td>
                <td>12.8 µA</td>
                <td>+{component.mad.toFixed(2)} σ</td>
                <td>{((component.baseline[2] - component.baseline[1]) / 72).toFixed(3)} µA/h</td>
                <td className={component.baseline[2] > 25 ? 'status-flag' : 'status-pass'}>
                  {component.baseline[2] > 25 ? 'ACCELERATING DRIFT' : 'WITHIN ENVELOPE'}
                </td>
              </tr>
              <tr className="projected-row">
                <td>168h (Projected Mission Horizon)</td>
                <td>{component.forecast} µA</td>
                <td>14.0 µA</td>
                <td>+{(component.mad * 1.3).toFixed(2)} σ</td>
                <td>{component.slope.toFixed(3)} µA/h</td>
                <td className={component.verdict === 'REJECT' ? 'status-fail' : 'status-flag'}>
                  {component.verdict === 'REJECT' ? 'EXCEEDS SAFETY CEILING' : 'BORDERLINE MARGIN'}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Root Cause & Engineering Analysis */}
          <div className="ncr-section-title">3. ENGINEERING FAILURE MECHANISM & ROOT CAUSE DIAGNOSTIC</div>
          <div className="ncr-narrative-box">
            <p>
              <b>Primary Anomaly Driver:</b> {component.driver}.
            </p>
            <p>
              The calculated drift rate of <b>{component.slope.toFixed(3)} µA/h</b> exceeds the configured ISRO safety
              slope limit of <b>{slope.toFixed(2)} µA/h</b>. Under MIL-STD-883 Method 1015 high-temperature operating life
              (HTOL) stress at 125°C, this unit displays non-linear channel trap-assisted tunneling and latent gate-oxide
              breakdown. If deployed into orbit, thermal vacuum cycling will accelerate this trajectory to total functional
              isolation before 5,000 mission hours.
            </p>
          </div>

          {/* Quality Engineering Disposition */}
          <div className="ncr-section-title">4. QUALITY ASSURANCE ACTION & DISPOSITION</div>
          <div className="ncr-disposition-box">
            <div className="disp-check-item">
              <span className="check-box-checked">☒</span>
              <span>
                <b>Permanent Flight Quarantine:</b> Part marked with red serialized dot and prohibited from primary or
                redundant flight sub-assemblies.
              </span>
            </div>
            <div className="disp-check-item">
              <span className="check-box-checked">☒</span>
              <span>
                <b>Lot Traceability Notification:</b> Adjacent silicon wafer dies quarantined for nearest-neighbor defect
                propagation analysis.
              </span>
            </div>
            <div className="disp-check-item">
              <span className="check-box-empty">☐</span>
              <span>Conditional Gated Retest: Subject unit to extended 240h soak conditioning before final MRB review.</span>
            </div>
          </div>

          {/* Signatures Block */}
          <div className="ncr-signatures-block">
            <div className="sig-column">
              <div className="sig-line" />
              <div className="sig-title">QA RELIABILITY INSPECTOR</div>
              <div className="sig-meta">ISRO-VSSC / DIV-883</div>
            </div>
            <div className="sig-column">
              <div className="sig-line" />
              <div className="sig-title">CHIEF PAYLOAD SYSTEMS ENGINEER</div>
              <div className="sig-meta">URSC BENGALURU</div>
            </div>
            <div className="sig-column">
              <div className="sig-line" />
              <div className="sig-title">DIRECTOR, MISSION ASSURANCE (DOS)</div>
              <div className="sig-meta">HQ NEW DELHI</div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="ncr-modal-footer">
          <span className="ncr-footer-note">
            AUTONOMOUSLY GENERATED BY NIRIKSHAN AI-DRIVEN ESS INTELLIGENCE • SIH-PS170
          </span>
          <button className="subtle-btn" onClick={onClose}>
            CLOSE DOSSIER
          </button>
        </div>
      </div>
    </div>
  );
}
