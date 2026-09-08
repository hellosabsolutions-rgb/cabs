import React, { useState, useEffect } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { X, CheckCircle2 } from 'lucide-react';

interface SettleSalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    driverId: string;
    driverName: string;
    assignedVehicle?: string;
    monthlySalary: number;
    advanceBalance: number;
    challanBalance: number;
    netPayable: number;
    month?: string;
  } | null;
}

export const SettleSalaryModal: React.FC<SettleSalaryModalProps> = ({
  isOpen,
  onClose,
  item
}) => {
  const { settleDriverSalary, selectedPayrollMonth } = useFleet();

  const [paymentMode, setPaymentMode] = useState<string>('Cash');
  const [paymentDate, setPaymentDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setPaymentMode('Cash');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setRemarks('');
      setErrorMsg('');
    }
  }, [isOpen]);

  if (!isOpen || !item) return null;

  const month = item.month || selectedPayrollMonth;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    const res = await settleDriverSalary({
      driverId: item.driverId,
      month,
      paymentMode,
      paymentDate,
      remarks: remarks.trim()
    });

    setIsSubmitting(false);
    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.error || 'Failed to settle salary payment.');
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
          border: '1px solid var(--border)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          fontFamily: "'Poppins', sans-serif"
        }}
      >
        <div
          style={{
            padding: '22px 24px 16px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start'
          }}
        >
          <div>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--text)',
                margin: 0,
                letterSpacing: '-0.01em',
                fontFamily: "'Poppins', sans-serif"
              }}
            >
              Mark salary payment paid
            </h2>
            <p
              style={{
                fontSize: '12.5px',
                color: 'var(--text-faint)',
                marginTop: '4px',
                marginBottom: 0,
                fontFamily: "'Poppins', sans-serif"
              }}
            >
              For {item.driverName} ({month})
            </p>
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
              padding: '4px',
              display: 'flex',
              borderRadius: '6px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: '0 24px 20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {errorMsg && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  color: '#ef4444',
                  fontSize: '12.5px',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  fontFamily: "'Poppins', sans-serif"
                }}
              >
                {errorMsg}
              </div>
            )}

            {/* Payout Calculation Card */}
            <div
              style={{
                background: 'var(--surface-2)',
                borderRadius: '10px',
                padding: '14px 16px',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-dim)', fontFamily: "'Poppins', sans-serif" }}>
                <span>Base Monthly Salary</span>
                <span style={{ fontWeight: 700, color: 'var(--text)' }}>
                  ₹{(item.monthlySalary || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-dim)', fontFamily: "'Poppins', sans-serif" }}>
                <span>Advances Deducted</span>
                <span style={{ fontWeight: 700, color: '#d97706' }}>
                  −₹{(item.advanceBalance || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-dim)', fontFamily: "'Poppins', sans-serif" }}>
                <span>Challans Deducted</span>
                <span style={{ fontWeight: 700, color: '#ef4444' }}>
                  −₹{(item.challanBalance || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '15px',
                  fontWeight: 700,
                  borderTop: '1px dashed var(--border)',
                  paddingTop: '8px',
                  marginTop: '4px',
                  fontFamily: "'Poppins', sans-serif"
                }}
              >
                <span>Net Amount Handed Over</span>
                <span style={{ color: 'var(--accent, #1687f5)', fontWeight: 800 }}>
                  ₹{(item.netPayable || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    marginBottom: '6px',
                    color: 'var(--text)',
                    fontFamily: "'Poppins', sans-serif"
                  }}
                >
                  Payment Date
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={e => setPaymentDate(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: '0 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--surface-2)',
                    color: 'var(--text)',
                    fontSize: '13.5px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: "'Poppins', sans-serif"
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    marginBottom: '6px',
                    color: 'var(--text)',
                    fontFamily: "'Poppins', sans-serif"
                  }}
                >
                  Paid via
                </label>
                <select
                  value={paymentMode}
                  onChange={e => setPaymentMode(e.target.value)}
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: '0 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--surface-2)',
                    color: 'var(--text)',
                    fontSize: '13.5px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: "'Poppins', sans-serif"
                  }}
                >
                  <option value="Cash">Cash Handover</option>
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="Bank Transfer">Bank Transfer (IMPS/NEFT)</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  marginBottom: '6px',
                  color: 'var(--text)',
                  fontFamily: "'Poppins', sans-serif"
                }}
              >
                Remarks / Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Cash handed over in office"
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
                  fontSize: '13.5px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: "'Poppins', sans-serif"
                }}
              />
            </div>
          </div>

          <div
            style={{
              padding: '14px 24px 20px 24px',
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '10px',
              borderTop: '1px solid var(--border)'
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                height: '38px',
                padding: '0 16px',
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
                padding: '0 18px',
                borderRadius: '6px',
                border: 'none',
                background: 'var(--accent, #1687f5)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'Poppins', sans-serif"
              }}
            >
              {isSubmitting ? 'Recording...' : 'Mark as Paid'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
