import React, { useState, useEffect } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { MinusCircle, ShieldCheck, ArrowRight } from 'lucide-react';
import { MinimalVoiceFiller } from '../../common/MinimalVoiceFiller';
import { DatePicker } from '../../common/DatePicker';

interface DeductTollModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedVehicle?: string;
}

const commonPlazas = [
  'Kherki Daula Toll Plaza (NH-48)',
  'Panipat Toll Plaza (NH-44)',
  'Delhi-Meerut Expressway (Dasna Toll)',
  'Eastern Peripheral Expressway (EPE)',
  'Yamuna Expressway (Jewar Toll)',
  'Kundli Toll Plaza',
  'Badarpur Border Flyover Toll'
];

export const DeductTollModal: React.FC<DeductTollModalProps> = ({
  isOpen,
  onClose,
  preselectedVehicle
}) => {
  const { vehicles, addFastagTransaction } = useFleet();

  const [vehicleReg, setVehicleReg] = useState(
    preselectedVehicle || vehicles[0]?.registrationNumber || 'DL01AB1234'
  );
  const [tollPlaza, setTollPlaza] = useState('Kherki Daula Toll Plaza (NH-48)');
  const [amount, setAmount] = useState('150');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(() => {
    const d = new Date();
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  });
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

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

  const selectedVehicleObj = vehicles.find(v => v.registrationNumber === vehicleReg);
  const currentBal = selectedVehicleObj?.fastagBalance || 0;
  const numAmount = Number(amount) || 0;
  const estNewBal = Math.max(0, currentBal - numAmount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) {
      setErrorMsg('Please enter a valid toll deduction amount.');
      return;
    }

    const txRef = `TOLL-${Date.now().toString().slice(-6)}`;

    addFastagTransaction({
      vehicle: vehicleReg,
      tagId: selectedVehicleObj?.fastagTagId || `34161FA${vehicleReg.slice(-4)}`,
      date,
      time,
      amount: numAmount,
      balanceAfter: estNewBal,
      type: 'Toll Deduction',
      tollPlaza: tollPlaza.trim() || 'Highway Toll Plaza',
      transactionRef: txRef,
      status: 'Successful'
    });

    setAmount('150');
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <div className="modal-title-group">
            <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MinusCircle size={18} color="var(--danger)" /> Record Toll Deduction
            </h3>
            <span className="modal-subtitle">
              Manually record toll expense & deduct from vehicle FASTag balance
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
              formType="expense"
              context={{ vehicles: vehicles.map(v => v.registrationNumber) }}
              placeholder="Speak toll info (e.g. 'DL01AB1234 Kherki Daula Toll 150 Rupees')"
              onApplyParsedData={(data) => {
                if (data.vehicle) setVehicleReg(data.vehicle);
                if (data.amount) setAmount(data.amount);
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

            {/* Vehicle Selection */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Select Vehicle *</label>
              <select
                className="form-input"
                value={vehicleReg}
                onChange={e => setVehicleReg(e.target.value)}
              >
                {vehicles.map(v => (
                  <option key={v.id} value={v.registrationNumber}>
                    {v.registrationNumber} ({v.model || v.type}) — Bal: ₹{(v.fastagBalance || 0).toLocaleString('en-IN')}
                  </option>
                ))}
              </select>
            </div>

            {/* Toll Plaza Name & Quick Chips */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Toll Plaza Name / Location *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Kherki Daula Toll Plaza"
                value={tollPlaza}
                onChange={e => setTollPlaza(e.target.value)}
                required
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '6px' }}>
                {commonPlazas.map(plaza => (
                  <button
                    key={plaza}
                    type="button"
                    className="btn-secondary"
                    style={{
                      fontSize: '10.5px',
                      padding: '2px 7px',
                      background: tollPlaza === plaza ? 'var(--surface-3)' : undefined,
                      color: tollPlaza === plaza ? 'var(--accent)' : undefined,
                      borderColor: tollPlaza === plaza ? 'var(--accent)' : undefined
                    }}
                    onClick={() => setTollPlaza(plaza)}
                  >
                    {plaza.split('(')[0].trim()}
                  </button>
                ))}
              </div>
            </div>

            {/* Toll Amount Deducted (₹) */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Toll Amount Deducted (₹) *</label>
                <div style={{ position: 'relative' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--danger)',
                      fontWeight: 700
                    }}
                  >
                    ₹
                  </span>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    style={{ paddingLeft: '28px', fontWeight: 700, fontSize: '15px', color: 'var(--danger)' }}
                    placeholder="150"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Date of Toll Cross</label>
                <DatePicker
                  value={date}
                  onChange={d => setDate(d)}
                  required
                />
              </div>
            </div>

            {/* Live Balance Change Preview */}
            <div
              style={{
                background: 'rgba(255, 92, 92, 0.08)',
                border: '1px solid rgba(255, 92, 92, 0.25)',
                padding: '12px 14px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '12.5px'
              }}
            >
              <div>
                <div style={{ color: 'var(--text-faint)', fontSize: '11px' }}>FASTag Wallet Balance Impact:</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <span style={{ textDecoration: 'line-through', color: 'var(--text-dim)' }}>
                    ₹{currentBal.toLocaleString('en-IN')}
                  </span>
                  <ArrowRight size={13} color="var(--text-faint)" />
                  <b style={{ color: estNewBal < 500 ? 'var(--danger)' : 'var(--accent)', fontSize: '14px' }}>
                    ₹{estNewBal.toLocaleString('en-IN')}
                  </b>
                  <span style={{ fontSize: '11px', color: 'var(--danger)', fontWeight: 600 }}>
                    (-₹{numAmount} deducted)
                  </span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    background: 'rgba(255, 92, 92, 0.15)',
                    color: 'var(--danger)',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600
                  }}
                >
                  Manual Toll Entry
                </span>
              </div>
            </div>

            {/* Optional Notes */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Notes / Duty Reference (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Delhi to Gurgaon airport trip or PWD inspection route"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary-action"
              style={{ background: 'var(--danger)', borderColor: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <MinusCircle size={14} /> Deduct ₹{numAmount} Toll
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
