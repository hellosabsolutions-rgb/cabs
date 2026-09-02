import React, { useState, useEffect, useRef } from 'react';
import { useFleet } from '../../../context/FleetContext';

interface AddContractModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddContractModal: React.FC<AddContractModalProps> = ({ isOpen, onClose }) => {
  const { vehicles, drivers, addDepartmentContract } = useFleet();

  const [contractNumber, setContractNumber] = useState(
    () => `CNT-${new Date().getFullYear()}-DEP-0${Math.floor(Math.random() * 90 + 10)}`
  );
  const [departmentName, setDepartmentName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicle, setVehicle] = useState(vehicles[0]?.registrationNumber || 'DL01AB1234');
  const [driverName, setDriverName] = useState(drivers[0]?.name || 'Rahul Sharma');
  const [monthlyBaseAmount, setMonthlyBaseAmount] = useState('');
  const [includedKmPerMonth, setIncludedKmPerMonth] = useState('2500');
  const [includedHoursPerMonth, setIncludedHoursPerMonth] = useState('300');
  const [extraKmRate, setExtraKmRate] = useState('14');
  const [extraHourRate, setExtraHourRate] = useState('120');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  });
  const [status, setStatus] = useState<'Active' | 'Expired' | 'Pending Renewal'>('Active');
  const [docName, setDocName] = useState('');
  const [docPreview, setDocPreview] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const docInputRef = useRef<HTMLInputElement>(null);

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

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setDocPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!departmentName.trim()) {
      setErrorMsg('Department name is required.');
      return;
    }
    if (!monthlyBaseAmount || Number(monthlyBaseAmount) <= 0) {
      setErrorMsg('Please enter a valid monthly base contract amount.');
      return;
    }

    addDepartmentContract({
      contractNumber: contractNumber.trim(),
      departmentName: departmentName.trim(),
      contactPerson: contactPerson.trim() || 'Officer in Charge',
      phone: phone.trim() || '—',
      vehicle,
      driverName: driverName || '—',
      monthlyBaseAmount: Number(monthlyBaseAmount),
      includedKmPerMonth: Number(includedKmPerMonth) || 2500,
      includedHoursPerMonth: Number(includedHoursPerMonth) || 300,
      extraKmRate: Number(extraKmRate) || 14,
      extraHourRate: Number(extraHourRate) || 120,
      startDate,
      endDate,
      status,
      documentFile: docName || docPreview || null
    });

    setDepartmentName('');
    setContactPerson('');
    setPhone('');
    setMonthlyBaseAmount('');
    setDocName('');
    setDocPreview(null);
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <h3 className="modal-title">
              <span>📄</span> Add Department Contract
            </h3>
            <span className="modal-subtitle">Register new government or corporate fleet contract</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="modal-body">
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

            {/* Department Name & Contract No */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Department / Client Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Public Works Department (PWD)"
                  value={departmentName}
                  onChange={e => setDepartmentName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Contract / Tender No. *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="CNT-2026-PWD-01"
                  value={contractNumber}
                  onChange={e => setContractNumber(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Contact Person & Phone */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Contact Person / Officer</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Er. R. K. Singhal"
                  value={contactPerson}
                  onChange={e => setContactPerson(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Contact Phone</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="e.g. +91 98101 22334"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>
            </div>

            {/* Vehicle & Assigned Driver */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Assigned Vehicle</label>
                <select
                  className="form-input"
                  value={vehicle}
                  onChange={e => setVehicle(e.target.value)}
                >
                  {vehicles.map(v => (
                    <option key={v.id} value={v.registrationNumber}>
                      {v.registrationNumber} ({v.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Designated Driver</label>
                <select
                  className="form-input"
                  value={driverName}
                  onChange={e => setDriverName(e.target.value)}
                >
                  {drivers.map(d => (
                    <option key={d.id} value={d.name}>
                      {d.name} ({d.driverType || 'Driver'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Monthly Base & Included Limits */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Monthly Base Rate (₹) *</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  placeholder="e.g. 85000"
                  value={monthlyBaseAmount}
                  onChange={e => setMonthlyBaseAmount(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Included Monthly KM</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  placeholder="2500"
                  value={includedKmPerMonth}
                  onChange={e => setIncludedKmPerMonth(e.target.value)}
                />
              </div>
            </div>

            {/* Extra Rates */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Extra KM Rate (₹ / km)</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  placeholder="14"
                  value={extraKmRate}
                  onChange={e => setExtraKmRate(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Extra Hour Rate (₹ / hr)</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  placeholder="120"
                  value={extraHourRate}
                  onChange={e => setExtraHourRate(e.target.value)}
                />
              </div>
            </div>

            {/* Dates & Status */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Contract Start Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Contract End Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* Document Upload */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Contract / Agreement Document (Optional)</label>
              <input
                type="file"
                ref={docInputRef}
                onChange={handleDocUpload}
                accept=".pdf,.doc,.docx,image/*"
                style={{ display: 'none' }}
              />
              <div className="upload-box" onClick={() => docInputRef.current?.click()}>
                <div className="upload-icon-placeholder">📑</div>
                <div className="upload-info">
                  <div className="upload-title">
                    {docName ? docName : 'Click to attach signed contract PDF / Tender copy'}
                  </div>
                  <div className="upload-hint">PDF, DOCX or scanned images</div>
                </div>
                {docName && (
                  <button
                    type="button"
                    className="modal-close-btn"
                    style={{ width: 26, height: 26, fontSize: 11 }}
                    onClick={e => {
                      e.stopPropagation();
                      setDocName('');
                      setDocPreview(null);
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-action">
              <span>+</span> Save Contract
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
