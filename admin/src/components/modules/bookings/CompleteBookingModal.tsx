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
        style={{
          maxWidth: '660px',
          width: '95%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--surface-1)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px var(--border)',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 22px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--surface-2)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.12)',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>
                Complete Booking & Settle Payment
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: 'var(--text-faint)' }}>
                {trip.bookingNumber || trip.tripNumber} — {trip.route} ({trip.vehicle})
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={onClose}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-faint)',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div
            style={{
              margin: '14px 22px 0 22px',
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              fontSize: '12.5px'
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* Scrollable Form Content */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '18px 22px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}
        >
          {/* Odometer Section */}
          <div
            style={{
              background: 'var(--surface-2)',
              padding: '14px 18px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              display: 'grid',
              gridTemplateColumns: '1fr 1.2fr 1fr',
              alignItems: 'center',
              gap: '16px'
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-faint)', fontWeight: 600, textTransform: 'uppercase' }}>
                Start Odometer
              </div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text)', marginTop: '4px' }}>
                {trip.startOdometer.toLocaleString('en-IN')} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-faint)' }}>km</span>
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                End Odometer (km) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="number"
                className="form-input"
                value={endOdometer}
                onChange={e => setEndOdometer(e.target.value)}
                min={trip.startOdometer}
                required
                style={{ fontWeight: 700, fontSize: '14px' }}
                placeholder={`min. ${trip.startOdometer}`}
              />
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-faint)', fontWeight: 600, textTransform: 'uppercase' }}>
                Total KM Run
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent)', marginTop: '4px' }}>
                {totalKmRun.toLocaleString('en-IN')} <span style={{ fontSize: '12px', fontWeight: 600 }}>km</span>
              </div>
            </div>
          </div>

          {/* Actual Expenses Incurred */}
          <div
            style={{
              background: 'var(--surface-2)',
              padding: '14px 18px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Trip Direct Expenses Incurred
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              <div>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Fuel size={13} style={{ color: '#eab308' }} /> Fuel Cost (₹)
                </label>
                <input
                  type="number"
                  className="form-input"
                  value={fuelCost}
                  onChange={e => setFuelCost(e.target.value)}
                  min="0"
                />
              </div>

              <div>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <CreditCard size={13} style={{ color: '#38bdf8' }} /> FASTag (₹)
                </label>
                <input
                  type="number"
                  className="form-input"
                  value={fastagCost}
                  onChange={e => setFastagCost(e.target.value)}
                  min="0"
                />
              </div>

              <div>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <User size={13} style={{ color: '#a855f7' }} /> Driver Bata (₹)
                </label>
                <input
                  type="number"
                  className="form-input"
                  value={driverBata}
                  onChange={e => setDriverBata(e.target.value)}
                  min="0"
                />
              </div>

              <div>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <IndianRupee size={13} style={{ color: 'var(--text-faint)' }} /> Other Exp. (₹)
                </label>
                <input
                  type="number"
                  className="form-input"
                  value={otherExpenses}
                  onChange={e => setOtherExpenses(e.target.value)}
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* PROFIT & REVENUE SUMMARY */}
          <div
            style={{
              padding: '12px 18px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(34, 197, 94, 0.08) 100%)',
              border: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px' }}>
              <span>
                Fare: <strong style={{ color: 'var(--text)' }}>₹{totalFare.toLocaleString('en-IN')}</strong>
              </span>
              <span style={{ color: 'var(--border)' }}>•</span>
              <span>
                Expenses: <strong style={{ color: '#ef4444' }}>-₹{totalTripExpenses.toLocaleString('en-IN')}</strong>
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Net Trip Profit:</span>
              <span
                style={{
                  fontWeight: 800,
                  color: netProfit >= 0 ? '#22c55e' : '#ef4444',
                  fontSize: '15px'
                }}
              >
                ₹{netProfit.toLocaleString('en-IN')}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: '12px',
                  background: netProfit >= 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: netProfit >= 0 ? '#22c55e' : '#ef4444'
                }}
              >
                {profitMargin}
              </span>
            </div>
          </div>

          {/* MANDATORY PAYMENT SETTLEMENT SECTION */}
          <div
            style={{
              background: pendingDue > 0
                ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.06) 0%, rgba(245, 158, 11, 0.02) 100%)'
                : 'rgba(34, 197, 94, 0.06)',
              border: pendingDue > 0 ? '1px solid rgba(245, 158, 11, 0.28)' : '1px solid rgba(34, 197, 94, 0.25)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', fontWeight: 700, color: 'var(--text)' }}>
                <HelpCircle size={17} style={{ color: pendingDue > 0 ? '#f59e0b' : '#22c55e' }} />
                Payment Received Check (Payment Aayi Ya Nahi?)
              </div>
              <span
                style={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: '14px',
                  background: pendingDue > 0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                  color: pendingDue > 0 ? '#f59e0b' : '#22c55e',
                  border: pendingDue > 0 ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(34, 197, 94, 0.3)'
                }}
              >
                {pendingDue > 0 ? `₹${pendingDue.toLocaleString('en-IN')} Pending to Collect` : 'Already Settled in Full'}
              </span>
            </div>

            {/* Payment Ledger breakdown */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px',
                background: 'var(--surface-1)',
                border: '1px solid var(--border)',
                padding: '12px 14px',
                borderRadius: '10px'
              }}
            >
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-faint)', fontWeight: 500 }}>Total Agreed Fare</span>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)', marginTop: '2px' }}>
                  ₹{totalFare.toLocaleString('en-IN')}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-faint)', fontWeight: 500 }}>Advance Received</span>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--accent)', marginTop: '2px' }}>
                  ₹{advancePaid.toLocaleString('en-IN')}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-faint)', fontWeight: 500 }}>Remaining Balance Due</span>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: '15px',
                    color: pendingDue > 0 ? '#f59e0b' : '#22c55e',
                    marginTop: '2px'
                  }}
                >
                  ₹{pendingDue.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {pendingDue > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label className="form-label" style={{ fontWeight: 600, color: 'var(--text)', fontSize: '12px', margin: 0 }}>
                  Did you receive the remaining balance payment of ₹{pendingDue.toLocaleString('en-IN')}?
                </label>

                {/* 3 Choice Selector */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentDecision('full');
                      setCustomPaidAmount(String(pendingDue));
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '10px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      border: paymentDecision === 'full' ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                      background: paymentDecision === 'full' ? 'rgba(56, 189, 248, 0.12)' : 'var(--surface-1)',
                      color: paymentDecision === 'full' ? 'var(--accent)' : 'var(--text)'
                    }}
                  >
                    <CheckCircle2 size={14} /> Full (₹{pendingDue.toLocaleString('en-IN')})
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentDecision('partial')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '10px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      border: paymentDecision === 'partial' ? '1.5px solid #f59e0b' : '1px solid var(--border)',
                      background: paymentDecision === 'partial' ? 'rgba(245, 158, 11, 0.12)' : 'var(--surface-1)',
                      color: paymentDecision === 'partial' ? '#f59e0b' : 'var(--text)'
                    }}
                  >
                    Partial Received
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentDecision('none');
                      setCustomPaidAmount('0');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '10px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      border: paymentDecision === 'none' ? '1.5px solid #ef4444' : '1px solid var(--border)',
                      background: paymentDecision === 'none' ? 'rgba(239, 68, 68, 0.12)' : 'var(--surface-1)',
                      color: paymentDecision === 'none' ? '#ef4444' : 'var(--text)'
                    }}
                  >
                    <AlertTriangle size={14} /> Keep Pending
                  </button>
                </div>

                {/* If Received (Full or Partial), ask for mode & amount */}
                {paymentDecision !== 'none' && (
                  <div style={{ display: 'grid', gridTemplateColumns: paymentDecision === 'partial' ? '1.2fr 1fr' : '1fr', gap: '12px', marginTop: '4px' }}>
                    {paymentDecision === 'partial' && (
                      <div>
                        <label className="form-label" style={{ fontWeight: 600 }}>Partial Amount Received Now (₹) *</label>
                        <input
                          type="number"
                          className="form-input"
                          value={customPaidAmount}
                          onChange={e => setCustomPaidAmount(e.target.value)}
                          max={pendingDue}
                          placeholder="Enter collected amount"
                          required
                        />
                      </div>
                    )}

                    <div>
                      <label className="form-label" style={{ fontWeight: 600 }}>Balance Payment Mode</label>
                      <select
                        className="form-input"
                        value={balancePaymentMode}
                        onChange={e => setBalancePaymentMode(e.target.value as PaymentMode)}
                        style={{ cursor: 'pointer' }}
                      >
                        <option value="UPI">UPI (GPay / PhonePe / QR)</option>
                        <option value="Cash">Cash to Driver / Office</option>
                        <option value="Bank Transfer">Bank Transfer (IMPS / NEFT)</option>
                        <option value="Cheque">Cheque</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: '12.5px', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} /> All fare payments for this booking have already been received in full.
              </div>
            )}
          </div>

          {/* Closing Notes */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontWeight: 600 }}>
              Closing Notes / Trip Remarks
            </label>
            <input
              type="text"
              className="form-input"
              value={closingNotes}
              onChange={e => setClosingNotes(e.target.value)}
              placeholder="e.g. Passenger satisfied, car returned in clean condition"
            />
          </div>

          {/* Form Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
              paddingTop: '10px',
              borderTop: '1px solid var(--border)'
            }}
          >
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              style={{ padding: '9px 18px', fontSize: '13px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{
                padding: '9px 22px',
                fontSize: '13px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <CheckCircle2 size={15} /> Complete Trip & Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
