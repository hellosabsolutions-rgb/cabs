import React, { useEffect, useMemo, useState } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { TripFinancial, PaymentMode } from '../../../types/fleet';
import {
  X,
  Navigation,
  Car,
  User,
  Phone,
  Calendar,
  Clock,
  MapPin,
  IndianRupee,
  Fuel,
  CreditCard,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  FileText,
  Radio,
  ExternalLink,
  Edit2,
  Printer
} from 'lucide-react';
import { BookingLiveMap } from './BookingLiveMap';

interface BookingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: TripFinancial | null;
  onComplete?: (booking: TripFinancial) => void;
  onCollectPayment?: (booking: TripFinancial) => void;
}

export const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
  isOpen,
  onClose,
  booking,
  onComplete,
  onCollectPayment
}) => {
  const { drivers, vehicles, updateDriverStatus, assignBookingDriver } = useFleet();

  // Find the driver object if assigned
  const assignedDriverObj = useMemo(() => {
    if (!booking?.driverName || booking.driverName === 'Unassigned') return null;
    return drivers.find(
      d =>
        d.name.toLowerCase() === booking.driverName.toLowerCase() ||
        (d.assignedVehicle && booking.vehicle && d.assignedVehicle.toLowerCase() === booking.vehicle.toLowerCase())
    ) || null;
  }, [booking, drivers]);

  // Find vehicle object
  const vehicleObj = useMemo(() => {
    if (!booking?.vehicle) return null;
    return vehicles.find(
      v => v.registrationNumber.toLowerCase() === booking.vehicle.toLowerCase()
    ) || null;
  }, [booking, vehicles]);

  // Check if driver has started duty
  const isDriverAssigned = Boolean(booking?.driverName && booking.driverName !== 'Unassigned');
  const isDriverOnDuty = isDriverAssigned && (
    assignedDriverObj?.status === 'On duty' ||
    booking?.status === 'Ongoing'
  );

  // Financial calculations
  const totalFare = Number(booking?.revenue || booking?.totalAmount || 0);
  const advance = Number(booking?.advanceAmount || 0);
  const balancePaid = Number(booking?.balancePaid || 0);
  const totalPaid = advance + balancePaid;
  const pendingDue = Math.max(0, totalFare - totalPaid);

  const fuelCost = Number(booking?.fuelCost || 0);
  const fastagCost = Number(booking?.fastagCost || 0);
  const driverBata = Number(booking?.driverBata || 0);
  const otherExpenses = Number(booking?.otherExpenses || 0);
  const totalExpenses = fuelCost + fastagCost + driverBata + otherExpenses || Number(booking?.expenses || 0);
  const profit = totalFare - totalExpenses;
  const marginPct = totalFare > 0 ? ((profit / totalFare) * 100).toFixed(1) : '0';

  // Handle ESC key to close
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

  const handleToggleDriverDuty = async () => {
    if (!assignedDriverObj) return;
    const newStatus = assignedDriverObj.status === 'On duty' ? 'Off duty' : 'On duty';
    await updateDriverStatus(assignedDriverObj.id, newStatus);
  };

  const handlePrint = () => {
    window.print();
  };

  const bookingCode = booking.bookingNumber || booking.tripNumber || `BKG-${booking.id?.slice(-5)}`;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 10, 20, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        className="modal-dialog"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '840px',
          maxHeight: '90vh',
          background: 'var(--surface-1, #0f172a)',
          color: 'var(--text, #f8fafc)',
          borderRadius: '16px',
          border: '1px solid var(--border-soft, #334155)',
          boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.65)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out'
        }}
      >
        {/* MODAL HEADER */}
        <div
          style={{
            padding: '16px 20px',
            background: 'var(--surface-2, #1e293b)',
            borderBottom: '1px solid var(--border-soft, #334155)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent, #38bdf8)'
              }}
            >
              <Navigation size={20} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                  {bookingCode}
                </h3>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 9px',
                    borderRadius: '20px',
                    background:
                      booking.status === 'Ongoing'
                        ? 'rgba(56, 189, 248, 0.15)'
                        : booking.status === 'Completed'
                        ? 'rgba(34, 197, 94, 0.15)'
                        : booking.status === 'Cancelled'
                        ? 'rgba(239, 68, 68, 0.15)'
                        : 'rgba(245, 158, 11, 0.15)',
                    color:
                      booking.status === 'Ongoing'
                        ? '#38bdf8'
                        : booking.status === 'Completed'
                        ? '#22c55e'
                        : booking.status === 'Cancelled'
                        ? '#ef4444'
                        : '#f59e0b',
                    border: `1px solid ${
                      booking.status === 'Ongoing'
                        ? 'rgba(56, 189, 248, 0.35)'
                        : booking.status === 'Completed'
                        ? 'rgba(34, 197, 94, 0.35)'
                        : booking.status === 'Cancelled'
                        ? 'rgba(239, 68, 68, 0.35)'
                        : 'rgba(245, 158, 11, 0.35)'
                    }`
                  }}
                >
                  ● {booking.status}
                </span>

                <span
                  style={{
                    fontSize: '11px',
                    padding: '3px 8px',
                    borderRadius: '14px',
                    background: 'var(--surface-3, #334155)',
                    color: 'var(--text-dim, #94a3b8)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {booking.tripType === 'Round Trip' ? <RotateCcw size={11} /> : <ArrowRight size={11} />}
                  {booking.tripType || 'One-way'}
                </span>
              </div>

              <div style={{ fontSize: '11.5px', color: 'var(--text-faint, #64748b)', marginTop: '2px' }}>
                Booked on: {booking.bookingDate || booking.startDate} {booking.startTime ? `at ${booking.startTime}` : ''}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-soft, #334155)',
                color: 'var(--text-dim, #94a3b8)',
                padding: '6px 10px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title="Print booking slip"
            >
              <Printer size={13} /> Print
            </button>
            <button
              className="modal-close-btn"
              onClick={onClose}
              type="button"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-faint, #94a3b8)',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '6px'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div
          style={{
            padding: '20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}
        >
          {/* 1. LIVE MAP & DRIVER DUTY TRACKING (USER SPECIFIED CORE REQUIREMENT) */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim, #94a3b8)' }}>
                  Live Trip Map & Driver Tracking
                </span>
              </div>

              {isDriverAssigned && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-dim, #94a3b8)' }}>Driver Duty:</span>
                  <span
                    style={{
                      fontWeight: 700,
                      color: isDriverOnDuty ? '#22c55e' : '#f59e0b'
                    }}
                  >
                    {isDriverOnDuty ? '● Active On Duty' : '○ Duty Not Started'}
                  </span>
                </div>
              )}
            </div>

            {/* LEAFLET MAP WITH LIVE TRACKING & ALERT BANNER */}
            <BookingLiveMap
              pickupLocation={booking.pickupLocation || booking.route?.split('→')[0]?.trim() || 'Pickup Location'}
              dropLocation={booking.dropLocation || booking.route?.split('→')[1]?.trim() || 'Drop Location'}
              isDriverOnDuty={isDriverOnDuty}
              driverName={booking.driverName}
              driverPhone={assignedDriverObj?.phone}
              vehicleReg={booking.vehicle}
              bookingStatus={booking.status}
              onMarkDriverOnDuty={assignedDriverObj ? handleToggleDriverDuty : undefined}
            />

            {/* SPECIAL NOTICE IF DRIVER NOT STARTED DUTY */}
            {!isDriverOnDuty && (
              <div
                style={{
                  marginTop: '10px',
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertTriangle size={18} color="#f59e0b" style={{ flexShrink: 0 }} />
                  <div style={{ fontSize: '12px', color: 'var(--text, #f8fafc)' }}>
                    <b>Driver not started duty yet:</b>{' '}
                    {isDriverAssigned
                      ? `Driver ${booking.driverName} has not clocked in / started duty. Live GPS tracking will activate once the driver starts duty on the driver mobile app.`
                      : 'No driver is currently assigned to this booking. Please assign an available driver.'}
                  </div>
                </div>

                {assignedDriverObj && (
                  <button
                    type="button"
                    onClick={handleToggleDriverDuty}
                    style={{
                      background: 'rgba(34, 197, 94, 0.2)',
                      border: '1px solid rgba(34, 197, 94, 0.5)',
                      color: '#22c55e',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '5px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <Radio size={12} /> Start Duty Now
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 2. THREE-COLUMN INFO CARDS: PASSENGER, VEHICLE & DRIVER, TRIP SCHEDULE */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '14px'
            }}
          >
            {/* PASSENGER CARD */}
            <div
              style={{
                background: 'var(--surface-2, #1e293b)',
                borderRadius: '12px',
                padding: '14px',
                border: '1px solid var(--border-soft, #334155)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent, #38bdf8)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>
                <User size={13} /> Passenger / Client
              </div>

              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text, #f8fafc)' }}>
                {booking.customerName || 'Walk-in Customer'}
              </div>

              {booking.customerPhone ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                  <a
                    href={`tel:${booking.customerPhone}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      color: 'var(--accent, #38bdf8)',
                      textDecoration: 'none'
                    }}
                  >
                    <Phone size={13} /> {booking.customerPhone}
                  </a>
                  <a
                    href={`https://wa.me/91${booking.customerPhone.replace(/\D/g, '').slice(-10)}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontSize: '11px',
                      background: 'rgba(34, 197, 94, 0.15)',
                      color: '#22c55e',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      textDecoration: 'none',
                      fontWeight: 700
                    }}
                  >
                    WhatsApp
                  </a>
                </div>
              ) : (
                <span style={{ fontSize: '11.5px', color: 'var(--text-faint, #64748b)' }}>No phone number provided</span>
              )}

              <div style={{ borderTop: '1px solid var(--border-soft, #334155)', paddingTop: '8px', marginTop: '4px', fontSize: '11.5px' }}>
                <span style={{ color: 'var(--text-dim, #94a3b8)' }}>Route:</span>
                <div style={{ fontWeight: 600, color: 'var(--text, #f8fafc)', marginTop: '2px' }}>
                  {booking.route || `${booking.pickupLocation || 'Pickup'} → ${booking.dropLocation || 'Drop'}`}
                </div>
              </div>
            </div>

            {/* ASSIGNED VEHICLE & DRIVER CARD */}
            <div
              style={{
                background: 'var(--surface-2, #1e293b)',
                borderRadius: '12px',
                padding: '14px',
                border: '1px solid var(--border-soft, #334155)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent, #38bdf8)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>
                <Car size={13} /> Vehicle & Driver
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text, #f8fafc)' }}>
                  {booking.vehicle}
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-dim, #94a3b8)' }}>
                  {vehicleObj?.model || booking.vehicleModel || 'Commercial Cab'}
                </span>
              </div>

              {/* Driver with live status badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={13} style={{ color: isDriverOnDuty ? '#22c55e' : 'var(--text-dim, #94a3b8)' }} />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text, #f8fafc)' }}>
                    {booking.driverName || 'Unassigned'}
                  </span>
                </div>

                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: '12px',
                    background: isDriverOnDuty ? 'rgba(34, 197, 94, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                    color: isDriverOnDuty ? '#22c55e' : 'var(--text-dim, #94a3b8)',
                    border: `1px solid ${isDriverOnDuty ? 'rgba(34, 197, 94, 0.3)' : 'rgba(148, 163, 184, 0.3)'}`
                  }}
                >
                  {isDriverOnDuty ? 'Active On Duty' : 'Off Duty'}
                </span>
              </div>

              {assignedDriverObj?.phone && (
                <div style={{ fontSize: '11.5px', marginTop: '2px' }}>
                  <a
                    href={`tel:${assignedDriverObj.phone}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: 'var(--accent, #38bdf8)',
                      textDecoration: 'none',
                      fontWeight: 600
                    }}
                  >
                    <Phone size={11} /> {assignedDriverObj.phone}
                  </a>
                </div>
              )}

              {/* Quick Driver Reassign Selector */}
              <div style={{ borderTop: '1px solid var(--border-soft, #334155)', paddingTop: '8px', marginTop: '4px' }}>
                <div style={{ fontSize: '10.5px', color: 'var(--text-faint, #64748b)', marginBottom: '4px' }}>
                  Change Assigned Driver:
                </div>
                <select
                  value={booking.driverName || 'Unassigned'}
                  onChange={e => {
                    const chosen = e.target.value;
                    const dObj = drivers.find(d => d.name === chosen);
                    assignBookingDriver(booking.id, chosen, dObj?.assignedVehicle || booking.vehicle);
                  }}
                  style={{
                    width: '100%',
                    fontSize: '11.5px',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    background: 'var(--surface-3, #334155)',
                    color: 'var(--text, #f8fafc)',
                    border: '1px solid var(--border-soft, #475569)',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="Unassigned">-- Unassigned --</option>
                  {drivers.map(d => (
                    <option key={d.id || d.name} value={d.name}>
                      {d.name} {d.assignedVehicle ? `(${d.assignedVehicle})` : ''} • {d.status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* TRIP TIMELINE & ODOMETER CARD */}
            <div
              style={{
                background: 'var(--surface-2, #1e293b)',
                borderRadius: '12px',
                padding: '14px',
                border: '1px solid var(--border-soft, #334155)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent, #38bdf8)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>
                <Clock size={13} /> Schedule & Odometer
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-dim, #94a3b8)' }}>Start Date:</span>
                  <span style={{ fontWeight: 700, color: 'var(--text, #f8fafc)' }}>
                    📅 {booking.startDate} {booking.startTime && `• ${booking.startTime}`}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-dim, #94a3b8)' }}>Return/End:</span>
                  <span style={{ fontWeight: 600, color: 'var(--text, #f8fafc)' }}>
                    {booking.endDate || booking.startDate} {booking.endTime ? `• ${booking.endTime}` : ''}
                  </span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-soft, #334155)', paddingTop: '8px', marginTop: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '3px' }}>
                  <span style={{ color: 'var(--text-dim, #94a3b8)' }}>Start Odo:</span>
                  <span style={{ fontWeight: 700, color: 'var(--text, #f8fafc)' }}>
                    {booking.startOdometer ? `${booking.startOdometer.toLocaleString('en-IN')} km` : '0 km'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '3px' }}>
                  <span style={{ color: 'var(--text-dim, #94a3b8)' }}>End Odo:</span>
                  <span style={{ fontWeight: 700, color: booking.endOdometer ? 'var(--text, #f8fafc)' : 'var(--text-faint, #64748b)' }}>
                    {booking.endOdometer ? `${booking.endOdometer.toLocaleString('en-IN')} km` : 'In Progress'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 800, color: 'var(--accent, #38bdf8)', marginTop: '4px' }}>
                  <span>Total Km Run:</span>
                  <span>
                    {booking.totalKmRun || (booking.endOdometer ? booking.endOdometer - (booking.startOdometer || 0) : 0)} km
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. FINANCIAL & PAYMENT DETAILS BREAKDOWN */}
          <div
            style={{
              background: 'var(--surface-2, #1e293b)',
              borderRadius: '14px',
              padding: '16px',
              border: '1px solid var(--border-soft, #334155)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim, #94a3b8)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CreditCard size={14} /> Fare, Payments & Profitability
              </span>

              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: '20px',
                  background: pendingDue > 0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                  color: pendingDue > 0 ? '#f59e0b' : '#22c55e',
                  border: `1px solid ${pendingDue > 0 ? 'rgba(245, 158, 11, 0.35)' : 'rgba(34, 197, 94, 0.35)'}`
                }}
              >
                {pendingDue > 0 ? `⚠️ Due: ₹${pendingDue.toLocaleString('en-IN')}` : '✓ Fully Paid'}
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '12px',
                background: 'var(--surface-1, #0f172a)',
                padding: '12px',
                borderRadius: '10px'
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim, #94a3b8)' }}>Total Agreed Fare</div>
                <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text, #f8fafc)', marginTop: '2px' }}>
                  ₹{totalFare.toLocaleString('en-IN')}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim, #94a3b8)' }}>Advance Received</div>
                <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--accent, #38bdf8)', marginTop: '2px' }}>
                  ₹{advance.toLocaleString('en-IN')}
                </div>
                {advance > 0 && (
                  <div style={{ fontSize: '10px', color: 'var(--text-faint, #64748b)' }}>
                    via {booking.advancePaymentMode || 'UPI'}
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim, #94a3b8)' }}>Balance Paid</div>
                <div style={{ fontSize: '17px', fontWeight: 800, color: '#22c55e', marginTop: '2px' }}>
                  ₹{balancePaid.toLocaleString('en-IN')}
                </div>
                {balancePaid > 0 && (
                  <div style={{ fontSize: '10px', color: 'var(--text-faint, #64748b)' }}>
                    via {booking.balancePaymentMode || 'Cash'}
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim, #94a3b8)' }}>Pending Balance</div>
                <div
                  style={{
                    fontSize: '17px',
                    fontWeight: 800,
                    color: pendingDue > 0 ? '#f59e0b' : '#22c55e',
                    marginTop: '2px'
                  }}
                >
                  ₹{pendingDue.toLocaleString('en-IN')}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim, #94a3b8)' }}>Net Profit</div>
                <div
                  style={{
                    fontSize: '17px',
                    fontWeight: 800,
                    color: profit >= 0 ? '#22c55e' : '#ef4444',
                    marginTop: '2px'
                  }}
                >
                  ₹{profit.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-faint, #64748b)' }}>
                  Margin: {marginPct}%
                </div>
              </div>
            </div>

            {/* EXPENSES BREAKDOWN LINE */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                fontSize: '11.5px',
                color: 'var(--text-dim, #94a3b8)',
                paddingTop: '6px'
              }}
            >
              <span>Fuel Cost: <b style={{ color: 'var(--text, #f8fafc)' }}>₹{fuelCost.toLocaleString('en-IN')}</b></span>
              <span>FASTag / Tolls: <b style={{ color: 'var(--text, #f8fafc)' }}>₹{fastagCost.toLocaleString('en-IN')}</b></span>
              <span>Driver Bata: <b style={{ color: 'var(--text, #f8fafc)' }}>₹{driverBata.toLocaleString('en-IN')}</b></span>
              {otherExpenses > 0 && (
                <span>Other: <b style={{ color: 'var(--text, #f8fafc)' }}>₹{otherExpenses.toLocaleString('en-IN')}</b></span>
              )}
              <span>Total Trip Exp: <b style={{ color: '#ef4444' }}>₹{totalExpenses.toLocaleString('en-IN')}</b></span>
            </div>
          </div>

          {/* 4. SPECIAL NOTES IF ANY */}
          {booking.notes && (
            <div
              style={{
                background: 'var(--surface-2, #1e293b)',
                borderRadius: '10px',
                padding: '12px 14px',
                border: '1px solid var(--border-soft, #334155)',
                fontSize: '12px'
              }}
            >
              <div style={{ fontWeight: 700, color: 'var(--text-dim, #94a3b8)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <FileText size={13} /> Notes & Special Instructions:
              </div>
              <div style={{ color: 'var(--text, #f8fafc)', lineHeight: 1.5 }}>
                {booking.notes}
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER ACTIONS */}
        <div
          style={{
            padding: '14px 20px',
            background: 'var(--surface-2, #1e293b)',
            borderTop: '1px solid var(--border-soft, #334155)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {booking.customerPhone && (
              <a
                href={`tel:${booking.customerPhone}`}
                style={{
                  textDecoration: 'none',
                  background: 'var(--surface-3, #334155)',
                  color: 'var(--text, #f8fafc)',
                  border: '1px solid var(--border-soft, #475569)',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Phone size={13} /> Call Customer
              </a>
            )}

            {assignedDriverObj?.phone && (
              <a
                href={`tel:${assignedDriverObj.phone}`}
                style={{
                  textDecoration: 'none',
                  background: 'var(--surface-3, #334155)',
                  color: 'var(--text, #f8fafc)',
                  border: '1px solid var(--border-soft, #475569)',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Phone size={13} /> Call Driver
              </a>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Collect pending balance button if any */}
            {pendingDue > 0 && onCollectPayment && (
              <button
                type="button"
                className="subtab-btn"
                onClick={() => onCollectPayment(booking)}
                style={{
                  color: '#f59e0b',
                  borderColor: 'rgba(245, 158, 11, 0.4)',
                  background: 'rgba(245, 158, 11, 0.1)',
                  padding: '7px 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <IndianRupee size={13} /> Collect ₹{pendingDue.toLocaleString('en-IN')}
              </button>
            )}

            {/* Complete trip button if ongoing */}
            {booking.status === 'Ongoing' && onComplete && (
              <button
                type="button"
                className="btn-primary-action"
                onClick={() => onComplete(booking)}
                style={{
                  padding: '7px 16px',
                  fontSize: '12px',
                  fontWeight: 700,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <CheckCircle2 size={14} /> Complete & Settle
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'var(--surface-3, #334155)',
                border: '1px solid var(--border-soft, #475569)',
                color: 'var(--text, #f8fafc)',
                padding: '7px 16px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
