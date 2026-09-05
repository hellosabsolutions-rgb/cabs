import React, { useState, useEffect } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { TripFinancial, PaymentMode } from '../../../types/fleet';
import { CheckCircle2, AlertTriangle, Fuel, CreditCard, User, IndianRupee, HelpCircle } from 'lucide-react';

interface CompleteBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: TripFinancial | null;
}

export const CompleteBookingModal: React.FC<CompleteBookingModalProps> = ({
  isOpen,
  onClose,
  trip
}) => {
  const { completeBooking } = useFleet();

  const [endOdometer, setEndOdometer] = useState('');
  const [fuelCost, setFuelCost] = useState('0');
  const [fastagCost, setFastagCost] = useState('0');
  const [driverBata, setDriverBata] = useState('0');
  const [otherExpenses, setOtherExpenses] = useState('0');
  const [closingNotes, setClosingNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Payment prompt state: 'full' | 'partial' | 'none'
  const [paymentDecision, setPaymentDecision] = useState<'full' | 'partial' | 'none'>('full');
  const [customPaidAmount, setCustomPaidAmount] = useState('');
  const [balancePaymentMode, setBalancePaymentMode] = useState<PaymentMode>('UPI');
  const [paymentNotes, setPaymentNotes] = useState('');

  const totalFare = Number(trip?.revenue || trip?.totalAmount || 0);
  const advancePaid = Number(trip?.advanceAmount || 0);
  const alreadySettled = Number(trip?.balancePaid || 0);
  const pendingDue = Math.max(0, totalFare - (advancePaid + alreadySettled));

  useEffect(() => {
    if (trip) {
      setEndOdometer(String(trip.endOdometer || trip.startOdometer + 250));
      setFuelCost(String(trip.fuelCost || 0));
      setFastagCost(String(trip.fastagCost || 0));
      setDriverBata(String(trip.driverBata || 0));
      setOtherExpenses(String(trip.otherExpenses || 0));
      setClosingNotes(trip.notes || '');

      if (pendingDue === 0) {
        setPaymentDecision('none');
      } else {
        setPaymentDecision('full');
        setCustomPaidAmount(String(pendingDue));
      }
    }
  }, [trip, pendingDue]);

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

  if (!isOpen || !trip) return null;

  const endKmNum = Number(endOdometer) || trip.startOdometer;
  const totalKmRun = Math.max(0, endKmNum - trip.startOdometer);

  const finalFuel = Number(fuelCost) || 0;
  const finalFastag = Number(fastagCost) || 0;
  const finalDriver = Number(driverBata) || 0;
  const finalOther = Number(otherExpenses) || 0;

  const totalTripExpenses = finalFuel + finalFastag + finalDriver + finalOther;
  const netProfit = totalFare - totalTripExpenses;
  const profitMargin = totalFare > 0 ? ((netProfit / totalFare) * 100).toFixed(1) + '%' : '0%';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (endKmNum < trip.startOdometer) {
      setErrorMsg(`End odometer (${endKmNum} km) cannot be less than start odometer (${trip.startOdometer} km).`);
      return;
    }

    let collectedBalance = 0;
    let balanceReceived = false;

    if (paymentDecision === 'full') {
      collectedBalance = pendingDue;
      balanceReceived = pendingDue > 0;
    } else if (paymentDecision === 'partial') {
      collectedBalance = Number(customPaidAmount) || 0;
      balanceReceived = collectedBalance > 0;
    } else {
      collectedBalance = 0;
      balanceReceived = false;
    }

    await completeBooking(trip.id, {
      endOdometer: endKmNum,
      fuelCost: finalFuel,
      fastagCost: finalFastag,
      driverBata: finalDriver,
      otherExpenses: finalOther,
      notes: closingNotes.trim() || undefined,
      balanceReceived,
      balancePaid: collectedBalance,
      balancePaymentMode,
      paymentNotes: paymentNotes.trim() || (paymentDecision === 'none' ? 'Balance payment pending from customer' : undefined)
    });

    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '680px', width: '95%', maxHeight: '92vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={20} color="var(--accent)" />
              Complete Booking & Settle Payment
            </h2>
            <p className="modal-subtitle">
              {trip.bookingNumber || trip.tripNumber} — {trip.route} ({trip.vehicle})
            </p>
          </div>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        {errorMsg && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(255, 92, 92, 0.15)',
              border: '1px solid rgba(255, 92, 92, 0.3)',
              color: 'var(--danger)',
              fontSize: '12.5px',
              marginTop: '12px'
            }}
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
          {/* Odometer Section */}
          <div
            style={{
              background: 'var(--surface-2)',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>Start Odometer</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>
                {trip.startOdometer.toLocaleString('en-IN')} km
              </div>
            </div>

            <div style={{ width: '150px' }}>
              <label className="input-label" style={{ fontSize: '11px' }}>End Odometer (km) *</label>
              <input
                type="number"
                className="input-field"
                value={endOdometer}
                onChange={e => setEndOdometer(e.target.value)}
                min={trip.startOdometer}
                required
                style={{ fontWeight: 700 }}
              />
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>Total KM Run</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--accent)' }}>
                {totalKmRun.toLocaleString('en-IN')} km
              </div>
            </div>
          </div>

          {/* Actual Expenses Incurred */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            <div>
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Fuel size={12} color="#ffcc4d" /> Fuel Cost (₹)
              </label>
              <input
                type="number"
                className="input-field"
                value={fuelCost}
                onChange={e => setFuelCost(e.target.value)}
              />
            </div>
            <div>
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CreditCard size={12} color="#38bdf8" /> FASTag (₹)
              </label>
              <input
                type="number"
                className="input-field"
                value={fastagCost}
                onChange={e => setFastagCost(e.target.value)}
              />
            </div>
            <div>
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <User size={12} /> Driver Bata (₹)
              </label>
              <input
                type="number"
                className="input-field"
                value={driverBata}
                onChange={e => setDriverBata(e.target.value)}
              />
            </div>
            <div>
              <label className="input-label">Other Exp. (₹)</label>
              <input
                type="number"
                className="input-field"
                value={otherExpenses}
                onChange={e => setOtherExpenses(e.target.value)}
              />
            </div>
          </div>

          {/* PROFIT & REVENUE SUMMARY */}
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'var(--surface-2)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '12px'
            }}
          >
            <span>Fare: <b>₹{totalFare.toLocaleString('en-IN')}</b> | Expenses: <b style={{ color: 'var(--danger)' }}>-₹{totalTripExpenses.toLocaleString('en-IN')}</b></span>
            <span style={{ fontWeight: 800, color: netProfit >= 0 ? 'var(--accent)' : 'var(--danger)', fontSize: '13px' }}>
              Net Profit: ₹{netProfit.toLocaleString('en-IN')} ({profitMargin})
            </span>
          </div>

          {/* MANDATORY PAYMENT SETTLEMENT SECTION (User's specific core question requirement!) */}
          <div
            style={{
              background: pendingDue > 0
                ? 'linear-gradient(135deg, rgba(255, 180, 0, 0.08), rgba(255, 92, 92, 0.05))'
                : 'rgba(0, 230, 153, 0.08)',
              border: pendingDue > 0 ? '1px solid rgba(255, 180, 0, 0.35)' : '1px solid rgba(0, 230, 153, 0.3)',
              borderRadius: '10px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 800, color: 'var(--text)' }}>
                <HelpCircle size={16} color={pendingDue > 0 ? '#ffb400' : 'var(--accent)'} />
                Payment Received Check (Payment Aayi Ya Nhi?)
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: pendingDue > 0 ? 'rgba(255, 180, 0, 0.2)' : 'rgba(0, 230, 153, 0.2)',
                  color: pendingDue > 0 ? '#ffb400' : 'var(--accent)'
                }}
              >
                {pendingDue > 0 ? `₹${pendingDue.toLocaleString('en-IN')} Pending to Collect` : 'Already Settled in Full'}
              </span>
            </div>

            {/* Payment Ledger breakdown */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '10px',
                background: 'var(--surface)',
                padding: '10px',
                borderRadius: '8px'
              }}
            >
              <div>
                <span style={{ fontSize: '10.5px', color: 'var(--text-faint)' }}>Total Agreed Fare:</span>
                <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text)' }}>
                  ₹{totalFare.toLocaleString('en-IN')}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '10.5px', color: 'var(--text-faint)' }}>Advance Received:</span>
                <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--accent)' }}>
                  ₹{advancePaid.toLocaleString('en-IN')}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '10.5px', color: 'var(--text-faint)' }}>Remaining Balance Due:</span>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: '14px',
                    color: pendingDue > 0 ? '#ffb400' : 'var(--accent)'
                  }}
                >
                  ₹{pendingDue.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {pendingDue > 0 ? (
              <>
                <label className="input-label" style={{ fontWeight: 600 }}>
                  Did you receive the remaining balance payment of ₹{pendingDue.toLocaleString('en-IN')}?
                </label>

                {/* 3 Choice Selector */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  <button
                    type="button"
                    className={`subtab-btn ${paymentDecision === 'full' ? 'active' : ''}`}
                    onClick={() => {
                      setPaymentDecision('full');
                      setCustomPaidAmount(String(pendingDue));
                    }}
                    style={{
                      justifyContent: 'center',
                      padding: '8px',
                      fontSize: '11.5px',
                      color: paymentDecision === 'full' ? 'var(--accent)' : undefined
                    }}
                  >
                    <CheckCircle2 size={13} /> Full Received (₹{pendingDue.toLocaleString('en-IN')})
                  </button>

                  <button
                    type="button"
                    className={`subtab-btn ${paymentDecision === 'partial' ? 'active' : ''}`}
                    onClick={() => setPaymentDecision('partial')}
                    style={{
                      justifyContent: 'center',
                      padding: '8px',
                      fontSize: '11.5px',
                      color: paymentDecision === 'partial' ? '#ffb400' : undefined
                    }}
                  >
                    Partial Received
                  </button>

                  <button
                    type="button"
                    className={`subtab-btn ${paymentDecision === 'none' ? 'active' : ''}`}
                    onClick={() => {
                      setPaymentDecision('none');
                      setCustomPaidAmount('0');
                    }}
                    style={{
                      justifyContent: 'center',
                      padding: '8px',
                      fontSize: '11.5px',
                      color: paymentDecision === 'none' ? 'var(--danger)' : undefined
                    }}
                  >
                    <AlertTriangle size={13} /> Not Received (Keep Pending)
                  </button>
                </div>

                {/* If Received (Full or Partial), ask for mode & amount */}
                {paymentDecision !== 'none' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px', marginTop: '4px' }}>
                    {paymentDecision === 'partial' && (
                      <div>
                        <label className="input-label">Partial Amount Received Now (₹) *</label>
                        <input
                          type="number"
                          className="input-field"
                          value={customPaidAmount}
                          onChange={e => setCustomPaidAmount(e.target.value)}
                          max={pendingDue}
                          placeholder="Amount received"
                          required
                        />
                      </div>
                    )}

                    <div style={{ gridColumn: paymentDecision === 'full' ? '1 / -1' : 'auto' }}>
                      <label className="input-label">Balance Payment Mode</label>
                      <select
                        className="input-field"
                        value={balancePaymentMode}
                        onChange={e => setBalancePaymentMode(e.target.value as PaymentMode)}
                      >
                        <option value="UPI">UPI (GPay / PhonePe / QR)</option>
                        <option value="Cash">Cash to Driver / Office</option>
                        <option value="Bank Transfer">Bank Transfer (IMPS / NEFT)</option>
                        <option value="Cheque">Cheque</option>
                      </select>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ fontSize: '12px', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} /> All fare payments for this booking have already been received in full.
              </div>
            )}
          </div>

          <div>
            <label className="input-label">Closing Notes / Trip Remarks</label>
            <input
              type="text"
              className="input-field"
              value={closingNotes}
              onChange={e => setClosingNotes(e.target.value)}
              placeholder="e.g. Passenger satisfied, car returned in good condition"
            />
          </div>

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-action" style={{ padding: '8px 20px', fontSize: '13px' }}>
              Complete Trip & Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
