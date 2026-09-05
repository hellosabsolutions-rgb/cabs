import React, { useState, useEffect } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { VehicleAvailabilityResult } from '../../../types/fleet';
import { Calendar, CheckCircle2, AlertTriangle, Car, User, Navigation, Plus, RefreshCw, X } from 'lucide-react';
import { DatePicker } from '../../common/DatePicker';

interface VehicleAvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVehicleForBooking?: (vehicleReg: string, date: string) => void;
}

export const VehicleAvailabilityModal: React.FC<VehicleAvailabilityModalProps> = ({
  isOpen,
  onClose,
  onSelectVehicleForBooking
}) => {
  const { checkVehicleAvailability } = useFleet();
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [data, setData] = useState<VehicleAvailabilityResult | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAvailability = async (date: string) => {
    setLoading(true);
    try {
      const res = await checkVehicleAvailability(date);
      setData(res);
    } catch (err) {
      console.error('Failed to fetch availability', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAvailability(selectedDate);
    }
  }, [isOpen, selectedDate]);

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

  const handleQuickDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const dateStr = d.toISOString().split('T')[0];
    setSelectedDate(dateStr);
  };

  const formatDateDisplay = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-');
      const date = new Date(Number(y), Number(m) - 1, Number(d));
      return date.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        style={{ maxWidth: 780, maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Car size={18} color="var(--accent)" />
              Vehicle Availability Checker
            </h3>
            <span className="modal-subtitle">
              Check which vehicles are free or already booked on any chosen date
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose} type="button">✕</button>
        </div>

        <div className="modal-body" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '18px 22px' }}>

        {/* Date Selector Banner */}
        <div
          style={{
            background: 'var(--surface-2)',
            padding: '12px 16px',
            borderRadius: '10px',
            border: '1px solid var(--border-soft)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
              Check Date:
            </span>
            <div style={{ width: '180px' }}>
              <DatePicker
                value={selectedDate}
                onChange={date => setSelectedDate(date)}
                placeholder="Choose date"
                inputStyle={{ padding: '6px 12px', fontSize: '13px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              className="subtab-btn"
              onClick={() => handleQuickDate(0)}
              style={{ fontSize: '11.5px', padding: '4px 10px' }}
            >
              Today
            </button>
            <button
              type="button"
              className="subtab-btn"
              onClick={() => handleQuickDate(1)}
              style={{ fontSize: '11.5px', padding: '4px 10px' }}
            >
              Tomorrow
            </button>
            <button
              type="button"
              className="subtab-btn"
              onClick={() => handleQuickDate(7)}
              style={{ fontSize: '11.5px', padding: '4px 10px' }}
            >
              +1 Week Later
            </button>
            <button
              type="button"
              className="subtab-btn"
              onClick={() => fetchAvailability(selectedDate)}
              style={{ fontSize: '11.5px', padding: '4px 10px' }}
            >
              <RefreshCw size={12} className={loading ? 'spin-loader' : ''} />
            </button>
          </div>
        </div>

        {/* Quick Summary Pill Counters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '16px' }}>
          <div style={{ background: 'var(--surface)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-soft)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>Total Fleet Vehicles</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)', marginTop: '2px' }}>
              {data ? data.totalVehicles : '...'}
            </div>
          </div>
          <div style={{ background: 'rgba(0, 230, 153, 0.08)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(0, 230, 153, 0.25)' }}>
            <div style={{ fontSize: '11px', color: 'var(--accent)' }}>🟢 Free / Available Vehicles</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent)', marginTop: '2px' }}>
              {data ? data.availableCount : '...'}
            </div>
          </div>
          <div style={{ background: 'rgba(255, 92, 92, 0.08)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 92, 92, 0.25)' }}>
            <div style={{ fontSize: '11px', color: 'var(--danger)' }}>🔴 Booked / Busy Vehicles</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--danger)', marginTop: '2px' }}>
              {data ? data.bookedCount : '...'}
            </div>
          </div>
        </div>

        {/* 2 Column View: Available vs Booked */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '20px' }}>
          {/* Left Column: Free Vehicles */}
          <div>
            <div
              style={{
                fontSize: '13.5px',
                fontWeight: 700,
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '10px'
              }}
            >
              <CheckCircle2 size={16} /> Available to Book ({data ? data.availableVehicles.length : 0})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data && data.availableVehicles.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-faint)', background: 'var(--surface-2)', borderRadius: '8px', fontSize: '12px' }}>
                  No free vehicles on this date. All vehicles are booked!
                </div>
              ) : (
                data?.availableVehicles.map(v => (
                  <div
                    key={v.vehicle}
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border-soft)',
                      borderRadius: '8px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      transition: 'transform 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)' }}>
                        {v.vehicle}
                      </span>
                      <span
                        className="driver-type-badge"
                        style={{ background: 'rgba(0, 230, 153, 0.12)', color: 'var(--accent)', fontSize: '10.5px' }}
                      >
                        Free / Ready
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                      {v.model} • <span style={{ color: 'var(--text-faint)' }}>{v.type}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '6px', borderTop: '1px solid var(--border-soft)' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                        Driver: <b>{v.assignedDriver}</b>
                      </span>
                      {onSelectVehicleForBooking && (
                        <button
                          type="button"
                          className="btn-primary-action"
                          style={{ fontSize: '11px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => {
                            onSelectVehicleForBooking(v.vehicle, selectedDate);
                            onClose();
                          }}
                        >
                          <Plus size={12} /> Book This
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Booked Vehicles */}
          <div>
            <div
              style={{
                fontSize: '13.5px',
                fontWeight: 700,
                color: 'var(--danger)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '10px'
              }}
            >
              <AlertTriangle size={16} /> Booked on {formatDateDisplay(selectedDate)} ({data ? data.bookedVehicles.length : 0})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data && data.bookedVehicles.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-faint)', background: 'var(--surface-2)', borderRadius: '8px', fontSize: '12px' }}>
                  No bookings scheduled for this date yet. All cars are free!
                </div>
              ) : (
                data?.bookedVehicles.map(b => (
                  <div
                    key={b.vehicle + (b.bookingNumber || '')}
                    style={{
                      background: 'rgba(255, 92, 92, 0.04)',
                      border: '1px solid rgba(255, 92, 92, 0.2)',
                      borderRadius: '8px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)' }}>
                        {b.vehicle}
                      </span>
                      <span
                        className="driver-type-badge"
                        style={{ background: 'rgba(255, 92, 92, 0.15)', color: 'var(--danger)', fontSize: '10.5px' }}
                      >
                        {b.bookingNumber || 'Booked'}
                      </span>
                    </div>

                    <div style={{ fontSize: '11.5px', color: 'var(--text-dim)' }}>
                      {b.model}
                    </div>

                    <div style={{ fontSize: '11.5px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <Navigation size={11} color="var(--accent)" /> {b.route}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '6px', borderTop: '1px solid rgba(255, 92, 92, 0.15)', fontSize: '11px', color: 'var(--text-dim)' }}>
                      <span>Client: <b>{b.customerName}</b></span>
                      <span>Driver: <b>{b.driverName}</b></span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="modal-footer">
        <button type="button" className="btn-secondary" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  </div>
);
};
