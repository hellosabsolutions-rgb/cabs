import React, { useState, useEffect } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { X } from 'lucide-react';

interface EditAdvanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  advance: {
    _id?: string;
    id?: string;
    amount: number;
    date: string;
    paymentMode?: string;
    reason?: string;
    remarks?: string;
  } | null;
  onUpdated?: () => void;
}

export const EditAdvanceModal: React.FC<EditAdvanceModalProps> = ({
  isOpen,
  onClose,
  advance,
  onUpdated
}) => {
  const { updateDriverAdvance } = useFleet();

  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [paidVia, setPaidVia] = useState<string>('Cash');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (isOpen && advance) {
      setAmount(String(advance.amount || ''));
      setDate(advance.date || new Date().toISOString().split('T')[0]);
      setPaidVia(advance.paymentMode || 'Cash');
      setNote(advance.remarks || advance.reason || '');
      setErrorMsg('');
    }
  }, [isOpen, advance]);

  if (!isOpen || !advance) return null;

  const advanceId = advance._id || advance.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!advanceId) return;

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Please enter a valid advance amount.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const res = await updateDriverAdvance(advanceId, {
      amount: numAmount,
      date,
      paymentMode: paidVia,
      reason: note.trim() || 'Advance payout',
      remarks: note.trim()
    });

    setIsSubmitting(false);
    if (res.success) {
      onUpdated?.();
      onClose();
    } else {
      setErrorMsg(res.error || 'Failed to update advance.');
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
          maxWidth: '460px',
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
              Edit advance
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
              Modify recorded advance payment details.
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
          <div style={{ padding: '0 24px 20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                Amount (₹)
              </label>
              <input
                type="number"
                min="1"
                step="any"
                value={amount}
                onChange={e => setAmount(e.target.value)}
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
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
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
                  value={paidVia}
                  onChange={e => setPaidVia(e.target.value)}
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
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
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
                Note (optional)
              </label>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
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
              {isSubmitting ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
