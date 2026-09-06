import React, { useState, useEffect, useRef } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { CreditCard } from 'lucide-react';
import { DatePicker } from '../../common/DatePicker';

interface AddTollDeductionModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedVehicle?: string;
}

export const AddTollDeductionModal: React.FC<AddTollDeductionModalProps> = ({
  isOpen,
  onClose,
  preselectedVehicle
}) => {
  const { vehicles, addFastagTransaction } = useFleet();

  const [vehicleReg, setVehicleReg] = useState(preselectedVehicle || vehicles[0]?.registrationNumber || 'DL01AB1234');
  const [tollPlaza, setTollPlaza] = useState('Kherki Daula Toll Plaza (Delhi-Gurugram Expy)');
  const [amount, setAmount] = useState('145');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(() => {
    const d = new Date();
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  });
  const [lane, setLane] = useState('Lane 04 (ETC Fastag)');
  const [transactionRef, setTransactionRef] = useState(
    () => `TXN-${Math.floor(Math.random() * 9000000 + 1000000)}`
  );
  const [linkedDutyOrTrip, setLinkedDutyOrTrip] = useState('Official Department Duty');
  const [proofName, setProofName] = useState('');
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const proofInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (preselectedVehicle) {
      setVehicleReg(preselectedVehicle);
    }
  }, [preselectedVehicle]);

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

  const selectedVehicle = vehicles.find(v => v.registrationNumber === vehicleReg) || vehicles[0];
  const currentBal = selectedVehicle?.fastagBalance || 0;
  const deductAmount = Number(amount) || 0;
  const remainingBal = Math.max(0, currentBal - deductAmount);

  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deductAmount || deductAmount <= 0) {
      setErrorMsg('Please enter a valid toll deduction amount.');
      return;
    }

    addFastagTransaction({
      vehicle: vehicleReg,
      tagId: selectedVehicle?.fastagTagId || 'TAG-34161FA',
      type: 'Toll Deduction',
      date,
      time,
      tollPlaza: tollPlaza.trim() || 'Highway Toll Plaza',
      amount: deductAmount,
      balanceAfter: remainingBal,
      lane: lane.trim(),
      transactionRef: transactionRef.trim(),
      linkedDutyOrTrip: linkedDutyOrTrip.trim(),
      proofSlip: proofPreview || proofName || null,
      status: 'Successful'
    });

    setAmount('');
    setProofName('');
    setProofPreview(null);
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <div className="modal-title-group">
            <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard size={18} color="var(--accent)" /> Log Toll Deduction
            </h3>
            <span className="modal-subtitle">Record FASTag plaza deduction for {vehicleReg}</span>
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

            {/* Vehicle Selection */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Vehicle *</label>
              <select
                className="form-input"
                value={vehicleReg}
                onChange={e => setVehicleReg(e.target.value)}
                required
              >
                {vehicles.map(v => (
                  <option key={v.id} value={v.registrationNumber}>
                    {v.registrationNumber} ({v.model || v.type} · Bal: ₹{(v.fastagBalance || 0).toLocaleString('en-IN')})
                  </option>
                ))}
              </select>
            </div>

            {/* Toll Plaza Name */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Toll Plaza / Expressway *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Kherki Daula Toll Plaza, Murthal NH-44"
                value={tollPlaza}
                onChange={e => setTollPlaza(e.target.value)}
                required
              />
            </div>

            {/* Date & Time */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Date *</label>
                <DatePicker
                  value={date}
                  onChange={d => setDate(d)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Time</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="11:15 AM"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                />
              </div>
            </div>

            {/* Amount & Lane */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Toll Amount (₹) *</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  style={{ fontWeight: 600, color: 'var(--accent)' }}
                  placeholder="e.g. 145"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Toll Lane / Gate ID</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Lane 04"
                  value={lane}
                  onChange={e => setLane(e.target.value)}
                />
              </div>
            </div>

            {/* Reference & Linked Trip */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">NPCI Transaction ID / Ref</label>
                <input
                  type="text"
                  className="form-input"
                  value={transactionRef}
                  onChange={e => setTransactionRef(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Linked Trip / Duty Slip</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. PWD Duty or Delhi → Agra"
                  value={linkedDutyOrTrip}
                  onChange={e => setLinkedDutyOrTrip(e.target.value)}
                />
              </div>
            </div>

            {/* Remaining Balance preview */}
            <div
              style={{
                background: 'var(--surface-2)',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-soft)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '12.5px'
              }}
            >
              <span style={{ color: 'var(--text-dim)' }}>Remaining FASTag Balance:</span>
              <span style={{ fontWeight: 700, color: remainingBal < 500 ? 'var(--danger)' : 'var(--text)' }}>
                ₹{remainingBal.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Toll Slip / SMS Photo Upload */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Toll Receipt / SMS Deduction Screenshot</label>
              <input
                type="file"
                ref={proofInputRef}
                onChange={handleProofUpload}
                accept="image/*,.pdf"
                style={{ display: 'none' }}
              />
              <div
                className="upload-box"
                onClick={() => proofInputRef.current?.click()}
                style={{ padding: '8px 12px' }}
              >
                {proofPreview ? (
                  <img src={proofPreview} alt="Receipt" className="upload-preview" />
                ) : (
                  <div className="upload-icon-placeholder" style={{ width: 34, height: 34 }}>
                    <CreditCard size={16} color="var(--accent)" />
                  </div>
                )}
                <div className="upload-info">
                  <div className="upload-title" style={{ fontSize: '12px' }}>
                    {proofName ? proofName : 'Upload toll receipt or SMS screenshot'}
                  </div>
                  <div className="upload-hint">Image proof</div>
                </div>
                {proofName && (
                  <button
                    type="button"
                    className="modal-close-btn"
                    style={{ width: 22, height: 22, fontSize: 10 }}
                    onClick={e => {
                      e.stopPropagation();
                      setProofName('');
                      setProofPreview(null);
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
              <span>+</span> Record Toll Deduction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
