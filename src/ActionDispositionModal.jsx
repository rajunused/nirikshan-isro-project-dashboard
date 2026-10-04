import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Clock, X, Check, Save, UserCheck, AlertTriangle } from 'lucide-react';

export default function ActionDispositionModal({
  isOpen,
  onClose,
  component,
  currentStatus,
  notes,
  onSaveDisposition
}) {
  const [selectedDisposition, setSelectedDisposition] = useState(
    currentStatus || (component ? component.verdict : 'REVIEW')
  );
  const [inspectorNotes, setInspectorNotes] = useState(notes || '');
  const [inspectorId, setInspectorId] = useState('ISRO-QA-7742');

  if (!isOpen || !component) return null;

  const handleSave = () => {
    onSaveDisposition(component.id, selectedDisposition, inspectorNotes, inspectorId);
    onClose();
  };

  return (
    <div className="action-modal-backdrop" onClick={onClose}>
      <div className="action-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="action-modal-header">
          <div className="action-title-group">
            <div className="action-meta-tag">
              <UserCheck size={13} className="text-cyan" />
              <span>ISRO MISSION ASSURANCE • FLIGHT HARDWARE DISPOSITION</span>
            </div>
            <h2>Quality Engineering Disposition</h2>
            <div className="action-sub">
              COMPONENT: <b>{component.id}</b> • PROFILE: {component.type} • CURRENT VERDICT: {component.verdict}
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Cancel">
            <X size={16} />
          </button>
        </div>

        {/* Component Quick Telemetry Bar */}
        <div className="action-telemetry-bar">
          <div>
            <span>0H BASELINE:</span> <b>{component.baseline[0]} µA</b>
          </div>
          <div>
            <span>24H LEAKAGE:</span> <b>{component.baseline[1]} µA</b>
          </div>
          <div>
            <span>96H RECAL:</span> <b>{component.baseline[2]} µA</b>
          </div>
          <div>
            <span>168H FORECAST:</span> <b className="text-cyan">{component.forecast} µA</b>
          </div>
          <div>
            <span>MAD DELTA:</span> <b className="text-orange">+{component.mad.toFixed(2)} σ</b>
          </div>
        </div>

        {/* 3-Tier Disposition Selection */}
        <div className="disposition-options-grid">
          {/* Option 1: Approve for Flight */}
          <div
            className={`disposition-option-card ${selectedDisposition === 'APPROVE' ? 'selected green' : ''}`}
            onClick={() => setSelectedDisposition('APPROVE')}
          >
            <div className="option-head">
              <ShieldCheck size={18} className="text-green" />
              <b>APPROVE FOR FLIGHT</b>
            </div>
            <p className="option-desc">
              Part validated. Drift velocity and modified Z-score conform to MIL-STD-883 Class V standards. Authorized for
              primary flight payload installation.
            </p>
            <span className="option-select-indicator">
              {selectedDisposition === 'APPROVE' ? '✓ SELECTED' : 'SELECT DISPOSITION'}
            </span>
          </div>

          {/* Option 2: Extended 240h Burn-In */}
          <div
            className={`disposition-option-card ${selectedDisposition === 'EXTENDED_240H' ? 'selected amber' : ''}`}
            onClick={() => setSelectedDisposition('EXTENDED_240H')}
          >
            <div className="option-head">
              <Clock size={18} className="text-amber" />
              <b>EXTENDED 240H SOAK</b>
            </div>
            <p className="option-desc">
              Borderline drift margin. Request an additional 72 hours of thermal stress conditioning at 125°C with an
              interim telemetry capture checkpoint at 200h.
            </p>
            <span className="option-select-indicator">
              {selectedDisposition === 'EXTENDED_240H' ? '✓ SELECTED' : 'SELECT DISPOSITION'}
            </span>
          </div>

          {/* Option 3: Quarantine / Reject */}
          <div
            className={`disposition-option-card ${selectedDisposition === 'REJECT' ? 'selected red' : ''}`}
            onClick={() => setSelectedDisposition('REJECT')}
          >
            <div className="option-head">
              <ShieldAlert size={18} className="text-red" />
              <b>QUARANTINE / REJECT</b>
            </div>
            <p className="option-desc">
              Elevated latent defect probability. Disqualify part from spaceflight sub-assemblies. Issue Non-Conformance
              Report (NCR) to foundry.
            </p>
            <span className="option-select-indicator">
              {selectedDisposition === 'REJECT' ? '✓ SELECTED' : 'SELECT DISPOSITION'}
            </span>
          </div>
        </div>

        {/* Technical Inspector Notes & ID */}
        <div className="disposition-notes-section">
          <div className="inspector-id-row">
            <span className="field-label">QA INSPECTOR AUTHORIZATION ID:</span>
            <input
              type="text"
              className="inspector-id-input"
              value={inspectorId}
              onChange={(e) => setInspectorId(e.target.value)}
              placeholder="e.g. ISRO-QA-7742"
            />
          </div>

          <label className="field-label">ENGINEERING DISPOSITION JUSTIFICATION & ROOT-CAUSE NOTES:</label>
          <textarea
            className="inspector-textarea"
            rows="3"
            value={inspectorNotes}
            onChange={(e) => setInspectorNotes(e.target.value)}
            placeholder="Document rationale, thermal chamber conditions, wafer neighbor proximity, or specific re-test instructions…"
          />
        </div>

        {/* Footer Actions */}
        <div className="action-modal-footer">
          <button className="subtle-btn" onClick={onClose}>
            CANCEL
          </button>
          <button className="primary-action-btn" onClick={handleSave}>
            <Save size={14} />
            <span>COMMIT QA DISPOSITION</span>
          </button>
        </div>
      </div>
    </div>
  );
}
