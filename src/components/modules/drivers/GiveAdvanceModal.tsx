import React, { useState, useEffect } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { DatePicker } from '../../common/DatePicker';
import { X, Wallet, AlertCircle, Info } from 'lucide-react';

interface GiveAdvanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDriverId?: string;
}

export const GiveAdvanceModal: React.FC<GiveAdvanceModalProps> = ({
  isOpen,
  onClose,
  initialDriverId
}) => {
  const { drivers, giveDriverAdvance, fetchLiveDrivers } = useFleet();

  const [driverId, setDriverId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState<'Cash Handover' | 'UPI / GPay / PhonePe' | 'Bank Transfer (IMPS/NEFT)' | 'Cheque'>('Cash Handover');
  const [reason, setReason] = useState<string>('Personal Advance');
  const [remarks, setRemarks] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // When modal opens, refresh drivers directly from driver API to ensure 100% up-to-date onboarded list
  useEffect(() => {
    if (isOpen) {
      fetchLiveDrivers?.();
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentMode('Cash Handover');
      setReason('Personal Advance');
      setRemarks('');
      setErrorMsg('');
    }
  }, [isOpen]);

  // Sync selected driverId once drivers are loaded or when initialDriverId changes
  useEffect(() => {
    if (isOpen && drivers && drivers.length > 0) {
      if (initialDriverId && drivers.some(d => d.id === initialDriverId)) {
        setDriverId(initialDriverId);
      } else if (!driverId || !drivers.some(d => d.id === driverId)) {
        setDriverId(drivers[0].id);
      }
    }
  }, [isOpen, initialDriverId, drivers, driverId]);

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

  if (!isOpen) return null;

  const selectedDriver = drivers.find(d => d.id === driverId);

  const handleQuickAdd = (presetValue: number) => {
    const current = Number(amount) || 0;
    setAmount(String(current + presetValue));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverId) {
      setErrorMsg('Please select a driver from the onboarded driver list.');
      return;
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Please enter a valid advance amount greater than ₹0.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    // Normalize payment mode
    let normalizedMode = 'Cash';
    if (paymentMode.includes('UPI')) normalizedMode = 'UPI';
    else if (paymentMode.includes('Bank Transfer')) normalizedMode = 'Bank Transfer';
    else if (paymentMode.includes('Cheque')) normalizedMode = 'Cheque';

    const res = await giveDriverAdvance({
      driverId,
      amount: numAmount,
      date,
      paymentMode: normalizedMode,
      reason,
      remarks: remarks.trim()
    });

    setIsSubmitting(false);
    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.error || 'Failed to record advance.');
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
        {/* Modal Header matching Screenshot */}
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
                background: 'rgba(217, 119, 6, 0.15)',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Wallet size={20} />
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
                Give Driver Advance
              </h2>
              <div style={{ fontSize: '12px', color: 'var(--text-faint)', marginTop: '2px' }}>
                Hand over advance cash or transfer to driver
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

        {/* Form Body */}
        <form noValidate onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
          <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {errorMsg && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  color: '#ef4444',
                  fontSize: '12.5px',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Field 1: Driver * */}
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
                onChange={e => setDriverId(e.target.value)}
                required
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
                {drivers && drivers.length > 0 ? (
                  drivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} {d.assignedVehicle && d.assignedVehicle !== '—' ? `(${d.assignedVehicle})` : ''}
                    </option>
                  ))
                ) : (
                  <option value="">No onboarded drivers found</option>
                )}
              </select>
              {selectedDriver && (
                <div style={{ fontSize: '11.5px', color: 'var(--text-faint)', marginTop: '5px' }}>
                  Base Monthly Salary:{' '}
                  <strong style={{ color: 'var(--text)', fontWeight: 700 }}>
                    ₹{(selectedDriver.monthlySalary || 0).toLocaleString('en-IN')}
                  </strong>
                </div>
              )}
            </div>

            {/* Field 2: Advance Amount (₹) * */}
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
                Advance Amount (₹) *
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
                  min="1"
                  step="any"
                  placeholder="e.g. 2500"
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

              {/* Quick chips: +₹1,000, +₹2,000, +₹2,500, +₹5,000, +₹6,000 */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                {[1000, 2000, 2500, 5000, 6000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleQuickAdd(val)}
                    style={{
                      padding: '3px 9px',
                      fontSize: '11px',
                      fontWeight: 600,
                      borderRadius: '6px',
                      background: 'var(--surface-3, rgba(148, 163, 184, 0.15))',
                      color: 'var(--text-dim)',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--text-faint)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                  >
                    +₹{val.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>

            {/* Field 3: Payment Date and Payment Mode side-by-side */}
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
                  Payment Date
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
                  Payment Mode
                </label>
                <select
                  value={paymentMode}
                  onChange={e => setPaymentMode(e.target.value as any)}
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
                  <option value="Cash Handover">Cash Handover</option>
                  <option value="UPI / GPay / PhonePe">UPI / GPay / PhonePe</option>
                  <option value="Bank Transfer (IMPS/NEFT)">Bank Transfer (IMPS/NEFT)</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
            </div>

            {/* Field 4: Reason / Purpose */}
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
                Reason / Purpose
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
                <option value="Personal Advance">Personal Advance</option>
                <option value="Emergency Medical Advance">Emergency Medical Advance</option>
                <option value="Festival Family Advance">Festival Family Advance</option>
                <option value="Travel Advance">Travel Advance</option>
                <option value="Home / Rent Advance">Home / Rent Advance</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Field 5: Remarks / Notes (Optional) */}
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
                Remarks / Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Requested for family emergency"
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
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

            {/* Field 6: Info Box matching screenshot */}
            <div
              style={{
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
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
              <span style={{ color: '#3b82f6', fontSize: '13px', lineHeight: '18px' }}>ℹ️</span>
              <div>
                This advance will be automatically shown under the driver's running advance balance and will be deducted from their net payable monthly salary when settled.
              </div>
            </div>
          </div>

          {/* Modal Footer matching screenshot */}
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
                background: '#d97706',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(217, 119, 6, 0.3)',
                fontFamily: "'Poppins', sans-serif"
              }}
            >
              {isSubmitting ? 'Recording...' : '+ Give Advance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
