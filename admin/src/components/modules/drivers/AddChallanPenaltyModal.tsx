import React, { useState, useEffect } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { DatePicker } from '../../common/DatePicker';
import { ShieldAlert, X, AlertCircle } from 'lucide-react';

interface AddChallanPenaltyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDriverId?: string;
}

export const AddChallanPenaltyModal: React.FC<AddChallanPenaltyModalProps> = ({
  isOpen,
  onClose,
  initialDriverId
}) => {
  const { drivers, vehicles, addDriverPenalty, fetchLiveDrivers } = useFleet();

  const [driverId, setDriverId] = useState<string>('');
  const [vehicle, setVehicle] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [challanNumber, setChallanNumber] = useState<string>('');
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState<string>('Traffic Challan - Speeding');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      fetchLiveDrivers?.();
      setAmount('');
      setChallanNumber('');
      setDate(new Date().toISOString().split('T')[0]);
      setReason('Traffic Challan - Speeding');
      setErrorMsg('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && drivers && drivers.length > 0) {
      const selectedId =
        initialDriverId && drivers.some(d => d.id === initialDriverId)
          ? initialDriverId
          : driverId && drivers.some(d => d.id === driverId)
          ? driverId
          : drivers[0].id;

      setDriverId(selectedId);
      const d = drivers.find(drv => drv.id === selectedId);
      setVehicle(d?.assignedVehicle || (vehicles.length > 0 ? vehicles[0].registrationNumber : '—'));
    }
  }, [isOpen, initialDriverId, drivers, vehicles, driverId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isSubmitting, onClose]);

  const handleDriverChange = (id: string) => {
    setDriverId(id);
    const d = drivers.find(drv => drv.id === id);
    if (d?.assignedVehicle && d.assignedVehicle !== '—') {
      setVehicle(d.assignedVehicle);
    }
  };

  const handleQuickAdd = (presetValue: number) => {
    const current = Number(amount) || 0;
    setAmount(String(current + presetValue));
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverId) {
      setErrorMsg('Please select a driver.');
      return;
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Please enter a valid penalty amount greater than ₹0.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const res = await addDriverPenalty({
      driverId,
      vehicle,
      challanNumber: challanNumber.trim(),
      amount: numAmount,
      date,
      reason
    });

    setIsSubmitting(false);
    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.error || 'Failed to record challan.');
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px'
      }}
    >
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          color: 'var(--text)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '480px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid var(--border)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          fontFamily: "'Poppins', sans-serif"
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--surface)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2
                style={{
                  fontSize: '17.5px',
                  fontWeight: 700,
                  color: 'var(--text)',
                  margin: 0,
                  letterSpacing: '-0.01em'
                }}
              >
                Record Driver Penalty / Challan
              </h2>
              <div style={{ fontSize: '12px', color: 'var(--text-faint)', marginTop: '2px' }}>
                Traffic violation, speeding, or administrative penalty
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-faint)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body - noValidate prevents native browser step popups */}
        <form
          noValidate
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}
        >
          <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {errorMsg && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  color: '#ef4444',
                  fontSize: '12.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: '1px solid rgba(239, 68, 68, 0.25)'
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Select Driver & Vehicle */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: '6px',
                    color: 'var(--text)'
                  }}
                >
                  Driver *
                </label>
                <select
                  value={driverId}
                  onChange={e => handleDriverChange(e.target.value)}
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: '0 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--surface-2)',
                    color: 'var(--text)',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  required
                >
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: '6px',
                    color: 'var(--text)'
                  }}
                >
                  Vehicle
                </label>
                <select
                  value={vehicle}
                  onChange={e => setVehicle(e.target.value)}
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: '0 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--surface-2)',
                    color: 'var(--text)',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="—">Unassigned (—)</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.registrationNumber}>
                      {v.registrationNumber}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Penalty Amount */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  marginBottom: '6px',
                  color: 'var(--text)'
                }}
              >
                Challan Amount (₹) *
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-faint)',
                    fontWeight: 700,
                    fontSize: '15px'
                  }}
                >
                  ₹
                </span>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  placeholder="e.g. 500"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  required
                  autoFocus
                  style={{
                    width: '100%',
                    height: '42px',
                    paddingLeft: '28px',
                    paddingRight: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--surface-2)',
                    color: 'var(--text)',
                    fontSize: '14.5px',
                    fontWeight: 600,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Quick Amount Chips */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                {[500, 1000, 1500, 2000, 5000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleQuickAdd(val)}
                    style={{
                      padding: '3px 9px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      borderRadius: '6px',
                      background: 'var(--surface-2)',
                      color: 'var(--text-dim)',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    +₹{val.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>

            {/* Date of Violation & Challan Number */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: '6px',
                    color: 'var(--text)'
                  }}
                >
                  Date of Violation
                </label>
                <DatePicker value={date} onChange={d => setDate(d)} />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: '6px',
                    color: 'var(--text)'
                  }}
                >
                  Challan / Notice # (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. CH-DL-2026-8812"
                  value={challanNumber}
                  onChange={e => setChallanNumber(e.target.value.toUpperCase())}
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: '0 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--surface-2)',
                    color: 'var(--text)',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Reason / Violation Type */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  marginBottom: '6px',
                  color: 'var(--text)'
                }}
              >
                Violation / Reason
              </label>
              <select
                value={reason}
                onChange={e => setReason(e.target.value)}
                style={{
                  width: '100%',
                  height: '42px',
                  padding: '0 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                  color: 'var(--text)',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                <option value="Traffic Challan - Speeding">Traffic Challan - Speeding</option>
                <option value="Traffic Challan - Red Light Violation">Traffic Challan - Red Light Violation</option>
                <option value="Traffic Challan - Improper Parking">Traffic Challan - Improper Parking</option>
                <option value="Traffic Challan - No Seatbelt">Traffic Challan - No Seatbelt</option>
                <option value="Company Policy Penalty - Unauthorized Absence">Company Policy Penalty - Unauthorized Absence</option>
                <option value="Vehicle Misuse / Damage Penalty">Vehicle Misuse / Damage Penalty</option>
                <option value="Other Penalty">Other Penalty</option>
              </select>
            </div>

            {/* Deduction Note */}
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '8px',
                padding: '12px 14px',
                fontSize: '12px',
                lineHeight: 1.5,
                color: 'var(--text-dim)',
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start'
              }}
            >
              <span style={{ color: '#ef4444', fontSize: '13px', lineHeight: '18px' }}>⚠️</span>
              <div>
                This penalty will be tracked under the driver's challan balance and automatically deducted from their monthly salary payment when settled.
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div
            style={{
              padding: '14px 22px 18px 22px',
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '10px',
              borderTop: '1px solid var(--border)',
              background: 'var(--surface)'
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                height: '38px',
                padding: '0 18px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text)',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: "'Poppins', sans-serif"
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                height: '38px',
                padding: '0 20px',
                borderRadius: '6px',
                border: 'none',
                background: '#ef4444',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(239, 68, 68, 0.3)',
                fontFamily: "'Poppins', sans-serif"
              }}
            >
              {isSubmitting ? 'Recording...' : '+ Record Penalty'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
