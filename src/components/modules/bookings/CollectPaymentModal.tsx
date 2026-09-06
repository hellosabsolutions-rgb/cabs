import React, { useState, useEffect } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { TripFinancial, PaymentMode } from '../../../types/fleet';
import { IndianRupee, CheckCircle2, User, Calendar, X } from 'lucide-react';
import { DatePicker } from '../../common/DatePicker';

interface CollectPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: TripFinancial | null;
}

export const CollectPaymentModal: React.FC<CollectPaymentModalProps> = ({
  isOpen,
  onClose,
  booking
}) => {
  const { recordBookingPayment } = useFleet();

  const totalFare = Number(booking?.revenue || booking?.totalAmount || 0);
  const advance = Number(booking?.advanceAmount || 0);
  const balancePaidAlready = Number(booking?.balancePaid || 0);
  const pendingAmount = Math.max(0, totalFare - (advance + balancePaidAlready));

  const [collectAmount, setCollectAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (booking) {
      setCollectAmount(String(pendingAmount));
      setNotes(`Payment from ${booking.customerName || 'customer'} for booking ${booking.bookingNumber || booking.tripNumber}`);
    }
  }, [booking, pendingAmount]);

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

  if (!isOpen || !booking) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(collectAmount) || 0;
    if (amt <= 0) return;

    await recordBookingPayment(booking.id, {
      amount: amt,
      paymentMode,
      paymentDate,
      notes
    });

    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '480px', width: '95%' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IndianRupee size={18} color="var(--accent)" />
              Record Pending Payment Received
            </h2>
            <p className="modal-subtitle">
              {booking.bookingNumber || booking.tripNumber} — {booking.customerName}
            </p>
          </div>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
          {/* Summary Banner */}
          <div
            style={{
              background: 'var(--surface-2)',
              padding: '12px 14px',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>Total Fare</span>
              <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text)' }}>
                ₹{totalFare.toLocaleString('en-IN')}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>Already Paid</span>
              <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--accent)' }}>
                ₹{(advance + balancePaidAlready).toLocaleString('en-IN')}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>Pending Due</span>
              <div style={{ fontWeight: 800, fontSize: '15px', color: '#ffb400' }}>
                ₹{pendingAmount.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <div>
            <label className="input-label">Amount Received (₹) *</label>
            <input
              type="number"
              className="input-field"
              value={collectAmount}
              onChange={e => setCollectAmount(e.target.value)}
              max={pendingAmount}
              min="1"
              required
              style={{ fontWeight: 700, fontSize: '15px', color: 'var(--accent)' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="input-label">Payment Mode *</label>
              <select
                className="input-field"
                value={paymentMode}
                onChange={e => setPaymentMode(e.target.value as PaymentMode)}
              >
                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer (IMPS / NEFT)</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            <div>
              <label className="input-label">Date Received *</label>
              <DatePicker
                value={paymentDate}
                onChange={date => setPaymentDate(date)}
                required
              />
            </div>
          </div>

          <div>
            <label className="input-label">Payment Note / Ref Number</label>
            <input
              type="text"
              className="input-field"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. UTR #12345678 or Cash handed to driver"
            />
          </div>

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-action">
              Save Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
