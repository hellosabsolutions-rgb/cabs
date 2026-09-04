import React, { useState, useEffect, useRef } from 'react';
import { useFleet } from '../../../context/FleetContext';
import {
  IdCard,
  UserCheck,
  HeartPulse,
  Award,
  Upload,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { MinimalVoiceFiller } from '../../common/MinimalVoiceFiller';

interface AddDriverComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedDriver?: string;
}

export type DriverDocType =
  | 'Driving licence'
  | 'Police verification'
  | 'Medical record'
  | 'ID proof'
  | 'Commercial badge';

const driverDocOptions: { label: string; value: DriverDocType; icon: React.ReactNode; mandatoryNote?: string }[] = [
  { label: 'Driving Licence (DL)', value: 'Driving licence', icon: <IdCard size={20} color="#39ff6e" />, mandatoryNote: 'Mandatory' },
  { label: 'Police Verification', value: 'Police verification', icon: <UserCheck size={20} color="#38bdf8" /> },
  { label: 'Medical Fitness', value: 'Medical record', icon: <HeartPulse size={20} color="#f87171" /> },
  { label: 'ID Proof (Aadhaar)', value: 'ID proof', icon: <IdCard size={20} color="#ffcc4d" /> },
  { label: 'Commercial Badge', value: 'Commercial badge', icon: <Award size={20} color="#a78bfa" /> }
];

export const AddDriverComplianceModal: React.FC<AddDriverComplianceModalProps> = ({
  isOpen,
  onClose,
  preselectedDriver
}) => {
  const { drivers, addDriverComplianceDoc } = useFleet();

  const [driverName, setDriverName] = useState(
    preselectedDriver || drivers[0]?.name || 'Rahul Sharma'
  );
  const [documentName, setDocumentName] = useState<DriverDocType>('Driving licence');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [category, setCategory] = useState('Transport / Commercial (LMV-TR)');
  const [issuingRto, setIssuingRto] = useState('Delhi Transport Authority (RTO)');
  const [issueDate, setIssueDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 3);
    return d.toISOString().split('T')[0];
  });
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 3);
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');
  const [docPhotoName, setDocPhotoName] = useState('');
  const [docPhotoPreview, setDocPhotoPreview] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-fill driver licence number from driver roster if available
  useEffect(() => {
    const foundDriver = drivers.find(d => d.name === driverName);
    if (foundDriver && foundDriver.licenseNumber && !licenseNumber) {
      setLicenseNumber(foundDriver.licenseNumber);
    }
  }, [driverName, drivers, licenseNumber]);

  useEffect(() => {
    if (preselectedDriver) {
      setDriverName(preselectedDriver);
    }
  }, [preselectedDriver]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocPhotoName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setDocPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateStatus = (expDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expDateStr);
    exp.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        statusType: 'late' as const,
        expiryLabel: `Expired ${Math.abs(diffDays)} days ago`,
        daysLeft: diffDays
      };
    } else if (diffDays <= 30) {
      return {
        statusType: 'soon' as const,
        expiryLabel: `In ${diffDays} days`,
        daysLeft: diffDays
      };
    } else if (diffDays <= 365) {
      const months = Math.round(diffDays / 30);
      return {
        statusType: 'ok' as const,
        expiryLabel: `Valid · ${months} month${months > 1 ? 's' : ''}`,
        daysLeft: diffDays
      };
    } else {
      const years = (diffDays / 365).toFixed(1).replace('.0', '');
      return {
        statusType: 'ok' as const,
        expiryLabel: `Valid · ${years} year${Number(years) > 1 ? 's' : ''}`,
        daysLeft: diffDays
      };
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // MANDATORY CHECK: Only Driving Licence is strictly mandatory
    if (documentName === 'Driving licence') {
      if (!licenseNumber.trim()) {
        setErrorMsg('Driving Licence Number is mandatory. Please enter valid DL number.');
        return;
      }
      if (!expiryDate) {
        setErrorMsg('Driving Licence Expiry Date is mandatory.');
        return;
      }
    }

    const { statusType, expiryLabel, daysLeft } = calculateStatus(expiryDate);

    addDriverComplianceDoc({
      entityName: driverName,
      entityType: 'Driver',
      documentName,
      documentNumber: licenseNumber.trim() || undefined,
      issueDate: issueDate || undefined,
      expiryDate,
      issuingAuthority: issuingRto.trim() || undefined,
      documentPhoto: docPhotoPreview || docPhotoName || null,
      notes: notes.trim()
        ? `${category ? `${category} · ` : ''}${notes.trim()}`
        : category || undefined,
      expiryLabel,
      statusType,
      daysLeft
    });

    setLicenseNumber('');
    setNotes('');
    setDocPhotoName('');
    setDocPhotoPreview(null);
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <div className="modal-title-group">
            <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IdCard size={18} color="var(--accent)" /> Add Driver Compliance Document
            </h3>
            <span className="modal-subtitle">
              Record Driver Driving Licence (Mandatory) & optional compliance records
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="modal-body">
            {/* Minimal Voice Form Filler */}
            <MinimalVoiceFiller
              formType="driver"
              context={{ drivers: drivers.map(d => d.name) }}
              placeholder="Speak compliance doc info (e.g. 'Rahul Sharma Driving Licence DL0420180092341')"
              onApplyParsedData={(data) => {
                if (data.name) {
                  const matched = drivers.find(d => d.name.toLowerCase().includes(data.name.toLowerCase()));
                  if (matched) setDriverName(matched.name);
                }
                if (data.driverName) {
                  const matched = drivers.find(d => d.name.toLowerCase().includes(data.driverName.toLowerCase()));
                  if (matched) setDriverName(matched.name);
                }
                if (data.licenseNumber) setLicenseNumber(data.licenseNumber);
              }}
            />

            {errorMsg && (
              <div
                style={{
                  background: 'var(--danger-bg)',
                  color: 'var(--danger)',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  border: '1px solid rgba(255, 92, 92, 0.3)'
                }}
              >
                {errorMsg}
              </div>
            )}

            {/* 1. Select Driver */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Select Driver (Konse Driver Ka Document Hai) *</label>
              <select
                className="form-input"
                value={driverName}
                onChange={e => setDriverName(e.target.value)}
                required
              >
                {drivers.map(d => (
                  <option key={d.id} value={d.name}>
                    {d.name} ({d.driverType || 'Driver'}) — License: {d.licenseNumber || 'Not set'}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Document Type Selector */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Document Type *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {driverDocOptions.map(opt => (
                  <div
                    key={opt.value}
                    onClick={() => setDocumentName(opt.value)}
                    style={{
                      border: documentName === opt.value ? '2px solid var(--accent)' : '1px solid var(--border)',
                      background: documentName === opt.value ? 'rgba(57, 255, 110, 0.08)' : 'var(--surface-2)',
                      padding: '8px 6px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      position: 'relative',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {opt.mandatoryNote && (
                      <span
                        style={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          fontSize: '9px',
                          background: 'rgba(57, 255, 110, 0.2)',
                          color: 'var(--accent)',
                          padding: '1px 4px',
                          borderRadius: '4px',
                          fontWeight: 700
                        }}
                      >
                        {opt.mandatoryNote}
                      </span>
                    )}
                    <div style={{ fontSize: '18px', marginBottom: '2px' }}>{opt.icon}</div>
                    <div style={{ fontWeight: 600, fontSize: '11.5px', color: 'var(--text)' }}>
                      {opt.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mandatory Driving Licence Highlight Notice */}
            {documentName === 'Driving licence' ? (
              <div
                style={{
                  background: 'rgba(57, 255, 110, 0.08)',
                  border: '1px solid rgba(57, 255, 110, 0.3)',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  fontSize: '11.5px',
                  color: 'var(--text)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <CheckCircle2 size={16} color="var(--accent)" />
                <span>
                  <b>Mandatory Compliance:</b> Commercial fleet me chalane ke liye driver ka <b>Driving Licence (DL Number & Expiry)</b> daalna anivarya (mandatory) hai.
                </span>
              </div>
            ) : (
              <div
                style={{
                  background: 'var(--surface-3)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '11.5px',
                  color: 'var(--text-dim)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <AlertCircle size={14} color="var(--accent)" />
                <span>Ye optional compliance record hai (Driving Licence pehle se mandatory hai).</span>
              </div>
            )}

            {/* 3. Driving Licence Number (Mandatory) & Category */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  {documentName === 'Driving licence'
                    ? 'Driving Licence (DL) Number * (Mandatory)'
                    : 'Document / Certificate Number'}
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{ fontWeight: 700, letterSpacing: '0.5px' }}
                  placeholder="e.g. DL-0420180092341"
                  value={licenseNumber}
                  onChange={e => setLicenseNumber(e.target.value)}
                  required={documentName === 'Driving licence'}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">DL Vehicle Category</label>
                <select
                  className="form-input"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                >
                  <option value="Transport / Commercial (LMV-TR)">Transport / Commercial (LMV-TR)</option>
                  <option value="Non-Transport (LMV-NT)">Non-Transport (LMV-NT)</option>
                  <option value="Heavy Commercial (HMV / HGMV)">Heavy Commercial (HMV / HGMV)</option>
                  <option value="All Commercial Vehicles">All Commercial Vehicles</option>
                </select>
              </div>
            </div>

            {/* 4. Issue Date & Expiry Date (Mandatory) */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Issue Date (Optional)</label>
                <input
                  type="date"
                  className="form-input"
                  value={issueDate}
                  onChange={e => setIssueDate(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ color: 'var(--accent)', fontWeight: 600 }}>
                  Licence Valid Till / Expiry Date * (Mandatory)
                </label>
                <input
                  type="date"
                  className="form-input"
                  style={{ fontWeight: 700 }}
                  value={expiryDate}
                  onChange={e => setExpiryDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* 5. Issuing Authority / RTO */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Issuing RTO / Transport Authority</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Delhi Transport Authority (RTO Janakpuri / Mall Road)"
                value={issuingRto}
                onChange={e => setIssuingRto(e.target.value)}
              />
            </div>

            {/* 6. Document Scan / Photo Upload */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Upload Licence Photo Copy (Optional)</label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*,.pdf"
                style={{ display: 'none' }}
              />
              <div
                className="upload-box"
                onClick={() => fileInputRef.current?.click()}
                style={{ padding: '10px 14px' }}
              >
                {docPhotoPreview ? (
                  <img src={docPhotoPreview} alt="Licence preview" className="upload-preview" />
                ) : (
                  <div className="upload-icon-placeholder" style={{ width: 36, height: 36 }}>
                    <Upload size={18} color="var(--accent)" />
                  </div>
                )}
                <div className="upload-info">
                  <div className="upload-title" style={{ fontSize: '12.5px' }}>
                    {docPhotoName ? docPhotoName : 'Upload Driving Licence copy'}
                  </div>
                  <div className="upload-hint">Image or PDF format</div>
                </div>
              </div>
            </div>

            {/* 7. Notes */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Notes (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Commercial hill driving endorsement verified"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-action">
              <span>+</span> Save Driver Licence
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
