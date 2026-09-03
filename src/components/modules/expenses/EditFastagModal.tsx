import React, { useState, useEffect } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { Edit3, CheckCircle2, Building2, Briefcase } from 'lucide-react';

interface EditFastagModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleReg: string;
}

const commonFastagBanks = [
  'ICICI Bank FASTag',
  'Paytm Payments Bank',
  'State Bank of India (SBI)',
  'Kotak Mahindra FASTag',
  'IDFC First Bank',
  'Airtel Payments Bank',
  'Axis Bank FASTag',
  'HDFC Bank FASTag'
];

export const EditFastagModal: React.FC<EditFastagModalProps> = ({
  isOpen,
  onClose,
  vehicleReg
}) => {
  const { vehicles, updateFastagDetails } = useFleet();

  const currentVehicle = vehicles.find(v => v.registrationNumber === vehicleReg);

  const [balance, setBalance] = useState('2450');
  const [bank, setBank] = useState('ICICI Bank FASTag');
  const [tagId, setTagId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (currentVehicle) {
      setBalance(String(currentVehicle.fastagBalance || 0));
      setBank(currentVehicle.fastagBank || 'ICICI Bank FASTag');
      setTagId(currentVehicle.fastagTagId || `34161FA${currentVehicle.registrationNumber.slice(-4)}`);
    }
  }, [currentVehicle, isOpen]);

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

  if (!isOpen || !currentVehicle) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numBal = Number(balance);
    if (isNaN(numBal) || numBal < 0) {
      setErrorMsg('Please enter a valid FASTag balance (0 or higher).');
      return;
    }

    updateFastagDetails(vehicleReg, numBal, bank.trim(), tagId.trim());
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <div className="modal-title-group">
            <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Edit3 size={18} color="var(--accent)" /> Edit FASTag Balance & Details
            </h3>
            <span className="modal-subtitle">
              Manual balance correction & bank info for {vehicleReg}
            </span>
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

            {/* Vehicle Info Readonly */}
            <div
              style={{
                background: 'var(--surface-3)',
                padding: '10px 14px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: '1px solid var(--border)'
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)' }}>
                  {vehicleReg}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                  {currentVehicle.model || currentVehicle.type} · Driver: {currentVehicle.assignedDriver || 'Driver'}
                </div>
              </div>
              <span className={`tag ${currentVehicle.type === 'Department' ? 'dept' : 'trip'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                {currentVehicle.type === 'Department' ? (
                  <>
                    <Building2 size={11} /> Department
                  </>
                ) : (
                  <>
                    <Briefcase size={11} /> Trip Cab
                  </>
                )}
              </span>
            </div>

            {/* Current Balance (Manual Edit) */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 600, color: 'var(--accent)' }}>
                Current FASTag Wallet Balance (Kitne Paise Hai) (₹) *
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--accent)',
                    fontWeight: 700
                  }}
                >
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  style={{ paddingLeft: '28px', fontWeight: 800, fontSize: '16px', color: 'var(--accent)' }}
                  placeholder="2450"
                  value={balance}
                  onChange={e => setBalance(e.target.value)}
                  required
                />
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '4px', display: 'block' }}>
                Type the latest balance from your FASTag bank SMS or netbanking app.
              </span>
            </div>

            {/* FASTag Bank / Issuer */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">FASTag Bank / Issuer Provider *</label>
              <select
                className="form-input"
                value={bank}
                onChange={e => setBank(e.target.value)}
              >
                {commonFastagBanks.map(b => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Tag ID / Barcode */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Tag ID / Account Serial Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 34161FA8891"
                value={tagId}
                onChange={e => setTagId(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-action" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={14} /> Update Balance
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
