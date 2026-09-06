import React, { useState, useEffect, useRef } from 'react';
import { useFleet } from '../../../context/FleetContext';
import {
  Shield,
  FileCheck,
  Wind,
  FileText,
  Settings,
  Tag,
  Calendar,
  CheckCircle2,
  Upload
} from 'lucide-react';
import { MinimalVoiceFiller } from '../../common/MinimalVoiceFiller';
import { DatePicker } from '../../common/DatePicker';

interface AddVehicleComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedVehicle?: string;
}

export type VehicleDocType =
  | 'Insurance'
  | 'Permit'
  | 'Pollution (PUC)'
  | 'RC'
  | 'Fitness'
  | 'Road tax';

const vehicleDocOptions: { label: string; value: VehicleDocType; icon: React.ReactNode; desc: string }[] = [
  { label: 'Insurance', value: 'Insurance', icon: <Shield size={20} color="#38bdf8" />, desc: 'Comprehensive or commercial vehicle policy' },
  { label: 'Permit', value: 'Permit', icon: <FileCheck size={20} color="#ffcc4d" />, desc: 'All India Tourist or State Contract Carriage permit' },
  { label: 'Pollution (PUC)', value: 'Pollution (PUC)', icon: <Wind size={20} color="#39ff6e" />, desc: 'Pollution Under Control emission certificate' },
  { label: 'RC (Registration)', value: 'RC', icon: <FileText size={20} color="#38bdf8" />, desc: 'Vehicle Registration Certificate from Transport Dept' },
  { label: 'Fitness Certificate', value: 'Fitness', icon: <Settings size={20} color="#ffcc4d" />, desc: 'RTO mandatory annual fitness test certificate' },
  { label: 'Road Tax', value: 'Road tax', icon: <Tag size={20} color="#a78bfa" />, desc: 'Motor Vehicle Tax token or annual road tax receipt' }
];

export const AddVehicleComplianceModal: React.FC<AddVehicleComplianceModalProps> = ({
  isOpen,
  onClose,
  preselectedVehicle
}) => {
  const { vehicles, addVehicleComplianceDoc } = useFleet();

  const [vehicleReg, setVehicleReg] = useState(
    preselectedVehicle || vehicles[0]?.registrationNumber || 'DL01AB1234'
  );
  const [documentName, setDocumentName] = useState<VehicleDocType>('Insurance');
  const [documentNumber, setDocumentNumber] = useState('');
  const [issuingAuthority, setIssuingAuthority] = useState('ICICI Lombard GIC Ltd');
  const [issueDate, setIssueDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().split('T')[0];
  });
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');
  const [docPhotoName, setDocPhotoName] = useState('');
  const [docPhotoPreview, setDocPhotoPreview] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (preselectedVehicle) {
      setVehicleReg(preselectedVehicle);
    }
  }, [preselectedVehicle]);

  // Adjust default issuing authority according to document type
  useEffect(() => {
    switch (documentName) {
      case 'Insurance':
        setIssuingAuthority('ICICI Lombard General Insurance');
        break;
      case 'Permit':
        setIssuingAuthority('State Transport Authority (STA) Delhi');
        break;
      case 'Pollution (PUC)':
        setIssuingAuthority('Authorized Pollution Testing Centre');
        break;
      case 'RC':
        setIssuingAuthority('Motor Licensing Officer (MLO) Transport Dept');
        break;
      case 'Fitness':
        setIssuingAuthority('Vehicle Inspection Unit, Burari RTO');
        break;
      case 'Road tax':
        setIssuingAuthority('Delhi Transport Taxation Authority');
        break;
    }
  }, [documentName]);

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
    if (!expiryDate) {
      setErrorMsg('Please specify the document expiry date.');
      return;
    }

    const { statusType, expiryLabel, daysLeft } = calculateStatus(expiryDate);

    addVehicleComplianceDoc({
      entityName: vehicleReg,
      entityType: 'Vehicle',
      documentName,
      documentNumber: documentNumber.trim() || undefined,
      issueDate: issueDate || undefined,
      expiryDate,
      issuingAuthority: issuingAuthority.trim() || undefined,
      documentPhoto: docPhotoPreview || docPhotoName || null,
      notes: notes.trim() || undefined,
      expiryLabel,
      statusType,
      daysLeft
    });

    setDocumentNumber('');
    setNotes('');
    setDocPhotoName('');
    setDocPhotoPreview(null);
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
        <div className="modal-header">
          <div className="modal-title-group">
            <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} color="var(--accent)" /> Add Vehicle Compliance Document
            </h3>
            <span className="modal-subtitle">
              Record Insurance, Permit, PUC, RC, Fitness & Road Tax with expiry alerts
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
              formType="vehicle"
              context={{ vehicles: vehicles.map(v => v.registrationNumber) }}
              placeholder="Speak vehicle document info (e.g. 'DL01AB1234 Insurance Policy POL9988')"
              onApplyParsedData={(data) => {
                if (data.registrationNumber) setVehicleReg(data.registrationNumber);
                if (data.vehicle) setVehicleReg(data.vehicle);
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

            {/* 1. Vehicle Selector */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Select Vehicle *</label>
              <select
                className="form-input"
                value={vehicleReg}
                onChange={e => setVehicleReg(e.target.value)}
                required
              >
                {vehicles.map(v => (
                  <option key={v.id} value={v.registrationNumber}>
                    {v.registrationNumber} ({v.model || v.type}) — {v.assignedTo}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Document Type */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Document Type *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {vehicleDocOptions.map(opt => (
                  <div
                    key={opt.value}
                    onClick={() => setDocumentName(opt.value)}
                    style={{
                      border: documentName === opt.value ? '2px solid var(--accent)' : '1px solid var(--border)',
                      background: documentName === opt.value ? 'rgba(57, 255, 110, 0.08)' : 'var(--surface-2)',
                      padding: '10px 8px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ fontSize: '20px', marginBottom: '4px' }}>{opt.icon}</div>
                    <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text)' }}>{opt.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Document / Policy Number & Issuing Authority */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Document / Policy / Cert Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. POL-987742110 or DL01RC8821"
                  value={documentNumber}
                  onChange={e => setDocumentNumber(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Issuing Authority / Insurer</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. ICICI Lombard or Delhi RTO"
                  value={issuingAuthority}
                  onChange={e => setIssuingAuthority(e.target.value)}
                />
              </div>
            </div>

            {/* 4. Issue Date & Expiry Date (Mandatory) */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Issue Date (Optional)</label>
                <DatePicker
                  value={issueDate}
                  onChange={d => setIssueDate(d)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ color: 'var(--accent)', fontWeight: 600 }}>
                  Expiry Date / Valid Till *
                </label>
                <DatePicker
                  value={expiryDate}
                  onChange={d => setExpiryDate(d)}
                  required
                />
              </div>
            </div>

            {/* 5. Document Photo / Scan Upload */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Upload Document Copy (PDF or Photo Proof)</label>
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
                  <img src={docPhotoPreview} alt="Doc preview" className="upload-preview" />
                ) : (
                  <div className="upload-icon-placeholder" style={{ width: 36, height: 36 }}>
                    <Upload size={18} color="var(--accent)" />
                  </div>
                )}
                <div className="upload-info">
                  <div className="upload-title" style={{ fontSize: '12.5px' }}>
                    {docPhotoName ? docPhotoName : `Upload ${documentName} scan or photo`}
                  </div>
                  <div className="upload-hint">RTO certificate or insurer policy copy</div>
                </div>
              </div>
            </div>

            {/* 6. Notes */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Notes / Additional Info (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Zero dep commercial insurance with roadside assistance"
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
              <span>+</span> Save Vehicle Document
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
