import React, { useState, useEffect } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { TripFinancial } from '../../../types/fleet';
import { CheckCircle2, Fuel, CreditCard, User } from 'lucide-react';

interface CompleteTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: TripFinancial | null;
}

export const CompleteTripModal: React.FC<CompleteTripModalProps> = ({
  isOpen,
  onClose,
  trip
}) => {
  const { completeTrip } = useFleet();

  const [endOdometer, setEndOdometer] = useState('');
  const [fuelCost, setFuelCost] = useState('0');
  const [fastagCost, setFastagCost] = useState('0');
  const [driverBata, setDriverBata] = useState('0');
  const [otherExpenses, setOtherExpenses] = useState('0');
  const [closingNotes, setClosingNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (trip) {
      setEndOdometer(String(trip.startOdometer + 250)); // sensible default
      setFuelCost(String(trip.fuelCost || 0));
      setFastagCost(String(trip.fastagCost || 0));
      setDriverBata(String(trip.driverBata || 0));
      setOtherExpenses(String(trip.otherExpenses || 0));
      setClosingNotes(trip.notes || '');
    }
  }, [trip]);

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
  const netProfit = trip.revenue - totalTripExpenses;
  const profitMargin =
    trip.revenue > 0 ? ((netProfit / trip.revenue) * 100).toFixed(1) + '%' : '0%';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (endKmNum < trip.startOdometer) {
      setErrorMsg(`End odometer (${endKmNum} km) cannot be less than start odometer (${trip.startOdometer} km).`);
      return;
    }

    completeTrip(trip.id, {
      endOdometer: endKmNum,
      fuelCost: finalFuel,
      fastagCost: finalFastag,
      driverBata: finalDriver,
      otherExpenses: finalOther,
      notes: closingNotes.trim() || undefined
    });

    setErrorMsg('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <div className="modal-title-group">
            <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} color="var(--accent)" /> Complete Trip & Calculate Profit
            </h3>
            <span className="modal-subtitle">
              Closing details for {trip.tripNumber || 'Trip'} · {trip.route}
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

            {/* Trip Info Header Banner */}
            <div
              style={{
                background: 'var(--surface-3)',
                padding: '12px 16px',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '14px' }}>
                  {trip.vehicle} · {trip.driverName}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', marginTop: '2px' }}>
                  Route: {trip.route}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>CUSTOMER FARE</div>
                <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--accent)', marginTop: '2px' }}>
                  ₹{trip.revenue.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Odometer Closing & KM Calculation */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  End Odometer Reading (KM) *
                  <span style={{ fontSize: '11px', color: 'var(--text-faint)', marginLeft: '6px' }}>
                    (Start: {trip.startOdometer} km)
                  </span>
                </label>
                <input
                  type="number"
                  min={trip.startOdometer}
                  className="form-input"
                  style={{ fontWeight: 600 }}
                  value={endOdometer}
                  onChange={e => setEndOdometer(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Total KM Run</label>
                <div
                  className="form-input"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    fontWeight: 700,
                    color: 'var(--accent)',
                    background: 'var(--surface-2)'
                  }}
                >
                  {totalKmRun.toLocaleString('en-IN')} KM
                </div>
              </div>
            </div>

            {/* Expenses Breakdown: Fuel, FASTag & Driver Bata */}
            <div
              style={{
                background: 'var(--surface-2)',
                padding: '14px',
                borderRadius: '10px',
                border: '1px solid var(--border-soft)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text)' }}>
                Final Trip Expenses Breakdown (Kharcha)
              </div>

              {/* Fuel Dala */}
              <div className="form-row-2">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Fuel size={13} color="#ffcc4d" /> Fuel Kitne Ka Dala (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    style={{ fontWeight: 600, color: '#ffcc4d' }}
                    value={fuelCost}
                    onChange={e => setFuelCost(e.target.value)}
                    required
                  />
                </div>

                {/* FASTag Kitna */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CreditCard size={13} color="#38bdf8" /> Kitna FASTag Toll Laga (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    style={{ fontWeight: 600, color: '#38bdf8' }}
                    value={fastagCost}
                    onChange={e => setFastagCost(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Driver Ko Kitna Diya & Other Expenses */}
              <div className="form-row-2">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <User size={13} /> Driver Ko Kitna Diya (Bata ₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={driverBata}
                    onChange={e => setDriverBata(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Parking / Other Misc (₹)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={otherExpenses}
                    onChange={e => setOtherExpenses(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* LIVE TRIP PROFIT SUMMARY CARD */}
            <div
              style={{
                background: netProfit >= 0 ? 'rgba(57, 255, 110, 0.08)' : 'rgba(255, 92, 92, 0.08)',
                border: `1px solid ${netProfit >= 0 ? 'rgba(57, 255, 110, 0.3)' : 'rgba(255, 92, 92, 0.3)'}`,
                padding: '14px 18px',
                borderRadius: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                <span style={{ color: 'var(--text-dim)' }}>Trip Customer Fare (Revenue):</span>
                <b>₹{trip.revenue.toLocaleString('en-IN')}</b>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-faint)' }}>
                <span>Fuel (₹{finalFuel}) + FASTag (₹{finalFastag}) + Driver (₹{finalDriver}) + Misc (₹{finalOther}):</span>
                <span style={{ color: 'var(--danger)' }}>-₹{totalTripExpenses.toLocaleString('en-IN')}</span>
              </div>

              <div
                style={{
                  borderTop: '1px solid var(--border-soft)',
                  paddingTop: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>COUNT PROFIT (MUNAFA)</div>
                  <div
                    style={{
                      fontSize: '20px',
                      fontWeight: 800,
                      color: netProfit >= 0 ? 'var(--accent)' : 'var(--danger)',
                      marginTop: '2px'
                    }}
                  >
                    ₹{netProfit.toLocaleString('en-IN')}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>PROFIT MARGIN</div>
                  <div
                    style={{
                      fontSize: '16px',
                      fontWeight: 700,
                      color: netProfit >= 0 ? 'var(--accent)' : 'var(--danger)',
                      marginTop: '2px'
                    }}
                  >
                    {profitMargin}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-action" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={14} /> Complete Trip & Save Profit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
