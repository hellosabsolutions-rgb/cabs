import React, { useState, useEffect, useMemo } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { TripFinancial, PaymentMode, TripStatus, TripType } from '../../../types/fleet';
import {
  X,
  Fuel,
  CreditCard,
  User,
  IndianRupee,
  Gauge,
  Calendar,
  Clock,
  MapPin,
  Car,
  AlertTriangle,
  CheckCircle2,
  FileText,
  RotateCcw,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Save
} from 'lucide-react';

interface EditBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: TripFinancial | null;
}

export const EditBookingModal: React.FC<EditBookingModalProps> = ({
  isOpen,
  onClose,
  booking
}) => {
  const { updateBooking, vehicles, drivers } = useFleet();

  // Active section tab: 'expenses' | 'odometer' | 'settlement' | 'tripDetails'
  const [activeTab, setActiveTab] = useState<'expenses' | 'odometer' | 'settlement' | 'tripDetails'>('expenses');

  // Direct Expenses state (User's primary requirement)
  const [fuelCost, setFuelCost] = useState<string>('0');
  const [fastagCost, setFastagCost] = useState<string>('0');
  const [driverBata, setDriverBata] = useState<string>('0');
  const [otherExpenses, setOtherExpenses] = useState<string>('0');

  // Odometer state
  const [startOdometer, setStartOdometer] = useState<string>('0');
  const [endOdometer, setEndOdometer] = useState<string>('');

  // Financial & Fare state
  const [revenue, setRevenue] = useState<string>('0');
  const [advanceAmount, setAdvanceAmount] = useState<string>('0');
  const [advancePaymentMode, setAdvancePaymentMode] = useState<PaymentMode>('UPI');
  const [balancePaid, setBalancePaid] = useState<string>('0');
  const [balancePaymentMode, setBalancePaymentMode] = useState<PaymentMode>('Cash');
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  // Trip details & status
  const [status, setStatus] = useState<TripStatus>('Completed');
  const [vehicle, setVehicle] = useState<string>('');
  const [driverName, setDriverName] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [pickupLocation, setPickupLocation] = useState<string>('');
  const [dropLocation, setDropLocation] = useState<string>('');
  const [route, setRoute] = useState<string>('');
  const [tripType, setTripType] = useState<TripType>('Round Trip');
  const [startDate, setStartDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  // Initialize fields when booking changes
  useEffect(() => {
    if (booking) {
      setFuelCost(String(booking.fuelCost ?? 0));
      setFastagCost(String(booking.fastagCost ?? 0));
      setDriverBata(String(booking.driverBata ?? 0));
      setOtherExpenses(String(booking.otherExpenses ?? 0));

      setStartOdometer(String(booking.startOdometer ?? 0));
      setEndOdometer(booking.endOdometer ? String(booking.endOdometer) : '');

      setRevenue(String(booking.revenue || booking.totalAmount || 0));
      setAdvanceAmount(String(booking.advanceAmount || 0));
      setAdvancePaymentMode(booking.advancePaymentMode || 'UPI');
      setBalancePaid(String(booking.balancePaid || 0));
      setBalancePaymentMode(booking.balancePaymentMode || 'Cash');
      setPaymentNotes(booking.paymentNotes || '');

      setStatus(booking.status || 'Completed');
      setVehicle(booking.vehicle || '');
      setDriverName(booking.driverName || '');
      setCustomerName(booking.customerName || '');
      setCustomerPhone(booking.customerPhone || '');
      setPickupLocation(booking.pickupLocation || '');
      setDropLocation(booking.dropLocation || '');
      setRoute(booking.route || '');
      setTripType(booking.tripType || 'Round Trip');
      setStartDate(booking.startDate || '');
      setStartTime(booking.startTime || '');
      setEndDate(booking.endDate || '');
      setEndTime(booking.endTime || '');
      setNotes(booking.notes || '');

      setFormError('');
      setActiveTab('expenses'); // Default directly to expenses as requested!
    }
  }, [booking]);

  // ESC key handler
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

  // Computed calculations
  const numFuel = Number(fuelCost) || 0;
  const numFastag = Number(fastagCost) || 0;
  const numDriverBata = Number(driverBata) || 0;
  const numOther = Number(otherExpenses) || 0;
  const totalDirectCost = numFuel + numFastag + numDriverBata + numOther;

  const numFare = Number(revenue) || 0;
  const numAdvance = Number(advanceAmount) || 0;
  const numBalance = Number(balancePaid) || 0;
  const totalPaid = numAdvance + numBalance;
  const pendingDue = Math.max(0, numFare - totalPaid);

  const netProfit = numFare - totalDirectCost;
  const profitMarginPct = numFare > 0 ? ((netProfit / numFare) * 100).toFixed(1) : '0';

  const numStartKm = Number(startOdometer) || 0;
  const numEndKm = Number(endOdometer) || 0;
  const totalKmRun = numEndKm >= numStartKm && numEndKm > 0 ? numEndKm - numStartKm : 0;

  const formatINR = (val: number) => '₹' + Math.round(val).toLocaleString('en-IN');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;

    if (numEndKm > 0 && numEndKm < numStartKm) {
      setFormError(`End odometer (${numEndKm} km) cannot be less than start odometer (${numStartKm} km).`);
      setActiveTab('odometer');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError('');

      const payload: Partial<TripFinancial> = {
        fuelCost: numFuel,
        fastagCost: numFastag,
        driverBata: numDriverBata,
        otherExpenses: numOther,
        expenses: totalDirectCost,
        revenue: numFare,
        totalAmount: numFare,
        advanceAmount: numAdvance,
        advancePaymentMode,
        balancePaid: numBalance,
        balancePaymentMode,
        pendingAmount: pendingDue,
        paymentStatus: pendingDue === 0 && numFare > 0 ? 'Paid' : totalPaid > 0 ? 'Partial' : 'Unpaid',
        paymentNotes: paymentNotes.trim() || undefined,
        startOdometer: numStartKm,
        endOdometer: numEndKm > 0 ? numEndKm : undefined,
        totalKmRun: totalKmRun > 0 ? totalKmRun : undefined,
        profit: netProfit,
        margin: `${profitMarginPct}%`,
        status,
        vehicle: vehicle.trim() || booking.vehicle,
        driverName: driverName.trim() || booking.driverName,
        customerName: customerName.trim() || booking.customerName,
        customerPhone: customerPhone.trim() || booking.customerPhone,
        pickupLocation: pickupLocation.trim() || booking.pickupLocation,
        dropLocation: dropLocation.trim() || booking.dropLocation,
        route: route.trim() || (pickupLocation && dropLocation ? `${pickupLocation} → ${dropLocation}` : booking.route),
        tripType,
        startDate: startDate || booking.startDate,
        startTime: startTime || booking.startTime,
        endDate: endDate || booking.endDate,
        endTime: endTime || booking.endTime,
        notes: notes.trim() || undefined
      };

      const bookingId = booking.id || (booking as any)._id;
      const res = await updateBooking(bookingId, payload);

      if (res && !res.success && res.error) {
        setFormError(res.error);
        return;
      }

      onClose();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update booking details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !booking) return null;

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
        backgroundColor: 'rgba(5, 10, 20, 0.78)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'modalFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }}
    >
      <div
        className="modal-dialog"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '760px',
          maxHeight: '92vh',
          background: 'var(--surface, #0f172a)',
          color: 'var(--text, #f8fafc)',
          borderRadius: '16px',
          border: '1px solid var(--border, #334155)',
          boxShadow: '0 25px 65px rgba(0, 0, 0, 0.55), 0 0 0 1px var(--border, #334155)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'modalPopIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: '16px 22px',
            background: 'var(--surface-2, #1e293b)',
            borderBottom: '1px solid var(--border-soft, #334155)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.14)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: 'var(--accent, #38bdf8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px'
              }}
            >
              ✏️
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: 'var(--text, #f8fafc)' }}>
                  Edit Booking & Trip Expenses
                </h3>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: 'rgba(56, 189, 248, 0.12)',
                    color: 'var(--accent, #38bdf8)',
                    border: '1px solid rgba(56, 189, 248, 0.3)'
                  }}
                >
                  {bookingCode}
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-faint, #94a3b8)' }}>
                {booking.vehicle} • {booking.route} • {booking.startDate}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
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

        {/* LIVE PROFIT & EXPENSE METRICS STRIP */}
        <div
          style={{
            padding: '12px 22px',
            background: 'var(--surface-1, #090d16)',
            borderBottom: '1px solid var(--border-soft, #1e293b)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '12px',
            alignItems: 'center'
          }}
        >
          <div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-faint, #94a3b8)', textTransform: 'uppercase', fontWeight: 600 }}>
              Agreed Fare
            </div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text, #f8fafc)' }}>
              {formatINR(numFare)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '10.5px', color: '#f87171', textTransform: 'uppercase', fontWeight: 600 }}>
              Total Expenses
            </div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#ef4444' }}>
              − {formatINR(totalDirectCost)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '10.5px', color: netProfit >= 0 ? '#4ade80' : '#f87171', textTransform: 'uppercase', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              {netProfit >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />} Net Profit ({profitMarginPct}%)
            </div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: netProfit >= 0 ? '#22c55e' : '#ef4444' }}>
              {formatINR(netProfit)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '10.5px', color: pendingDue > 0 ? '#fbbf24' : '#4ade80', textTransform: 'uppercase', fontWeight: 600 }}>
              Pending Balance
            </div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: pendingDue > 0 ? '#f59e0b' : '#22c55e' }}>
              {pendingDue > 0 ? formatINR(pendingDue) : '✓ Fully Paid'}
            </div>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-soft, #334155)',
            background: 'var(--surface-2, #1e293b)',
            padding: '0 22px',
            gap: '8px',
            overflowX: 'auto'
          }}
        >
          <button
            type="button"
            className="subtab-btn"
            onClick={() => setActiveTab('expenses')}
            style={{
              padding: '10px 14px',
              fontSize: '12.5px',
              fontWeight: 700,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'expenses' ? '2px solid var(--accent, #38bdf8)' : '2px solid transparent',
              color: activeTab === 'expenses' ? 'var(--accent, #38bdf8)' : 'var(--text-dim, #94a3b8)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Fuel size={14} style={{ color: '#eab308' }} /> Trip Expenses (Fuel, Toll, Driver)
          </button>

          <button
            type="button"
            className="subtab-btn"
            onClick={() => setActiveTab('odometer')}
            style={{
              padding: '10px 14px',
              fontSize: '12.5px',
              fontWeight: 700,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'odometer' ? '2px solid var(--accent, #38bdf8)' : '2px solid transparent',
              color: activeTab === 'odometer' ? 'var(--accent, #38bdf8)' : 'var(--text-dim, #94a3b8)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Gauge size={14} style={{ color: '#38bdf8' }} /> Odometer & KM Run
          </button>

          <button
            type="button"
            className="subtab-btn"
            onClick={() => setActiveTab('settlement')}
            style={{
              padding: '10px 14px',
              fontSize: '12.5px',
              fontWeight: 700,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'settlement' ? '2px solid var(--accent, #38bdf8)' : '2px solid transparent',
              color: activeTab === 'settlement' ? 'var(--accent, #38bdf8)' : 'var(--text-dim, #94a3b8)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <IndianRupee size={14} style={{ color: '#22c55e' }} /> Customer Settlement
          </button>

          <button
            type="button"
            className="subtab-btn"
            onClick={() => setActiveTab('tripDetails')}
            style={{
              padding: '10px 14px',
              fontSize: '12.5px',
              fontWeight: 700,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'tripDetails' ? '2px solid var(--accent, #38bdf8)' : '2px solid transparent',
              color: activeTab === 'tripDetails' ? 'var(--accent, #38bdf8)' : 'var(--text-dim, #94a3b8)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Car size={14} style={{ color: '#a855f7' }} /> Booking & Route Info
          </button>
        </div>

        {/* ERROR NOTIFICATION */}
        {formError && (
          <div
            style={{
              margin: '14px 22px 0 22px',
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              fontSize: '12.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <AlertTriangle size={15} />
            <span>{formError}</span>
          </div>
        )}

        {/* MODAL FORM BODY */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            flex: 1,
            padding: '20px 22px',
            gap: '18px'
          }}
        >
          {/* TAB 1: TRIP EXPENSES (CORE USER FOCUS) */}
          {activeTab === 'expenses' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  background: 'rgba(56, 189, 248, 0.05)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  fontSize: '12.5px',
                  color: 'var(--text-dim, #94a3b8)',
                  lineHeight: '1.5'
                }}
              >
                💡 <strong>Trip Actual Expenses:</strong> Enter trip expenses incurred (Fuel, Toll/FASTag, Driver payment, and any other incidental costs). These expenses automatically update profitability and sync with the Revenue and P&L modules.
              </div>

              <div
                style={{
                  background: 'var(--surface-2, #1e293b)',
                  border: '1px solid var(--border-soft, #334155)',
                  borderRadius: '14px',
                  padding: '18px'
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text, #f8fafc)', marginBottom: '14px' }}>
                  Trip Expense Breakdown
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                  {/* 1. Fuel Cost */}
                  <div>
                    <label
                      className="form-label"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: 600,
                        fontSize: '12.5px',
                        marginBottom: '6px',
                        color: 'var(--text, #f8fafc)'
                      }}
                    >
                      <Fuel size={14} style={{ color: '#eab308' }} /> Fuel Expense (₹)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint, #64748b)', fontSize: '13px' }}>
                        ₹
                      </span>
                      <input
                        type="number"
                        className="form-input"
                        value={fuelCost}
                        onChange={e => setFuelCost(e.target.value)}
                        min="0"
                        step="any"
                        placeholder="0"
                        style={{ paddingLeft: '28px', fontWeight: 700, fontSize: '14px' }}
                      />
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-faint, #64748b)', marginTop: '3px', display: 'block' }}>
                      Diesel/Petrol expense for this trip
                    </span>
                  </div>

                  {/* 2. FASTag / Toll Cost */}
                  <div>
                    <label
                      className="form-label"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: 600,
                        fontSize: '12.5px',
                        marginBottom: '6px',
                        color: 'var(--text, #f8fafc)'
                      }}
                    >
                      <CreditCard size={14} style={{ color: '#38bdf8' }} /> FASTag / Toll Cost (₹)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint, #64748b)', fontSize: '13px' }}>
                        ₹
                      </span>
                      <input
                        type="number"
                        className="form-input"
                        value={fastagCost}
                        onChange={e => setFastagCost(e.target.value)}
                        min="0"
                        step="any"
                        placeholder="0"
                        style={{ paddingLeft: '28px', fontWeight: 700, fontSize: '14px' }}
                      />
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-faint, #64748b)', marginTop: '3px', display: 'block' }}>
                      Toll deductions & highway charges
                    </span>
                  </div>

                  {/* 3. Driver Bata / Driver Payment */}
                  <div>
                    <label
                      className="form-label"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: 600,
                        fontSize: '12.5px',
                        marginBottom: '6px',
                        color: 'var(--text, #f8fafc)'
                      }}
                    >
                      <User size={14} style={{ color: '#a855f7' }} /> Driver Bata / Payment (₹)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint, #64748b)', fontSize: '13px' }}>
                        ₹
                      </span>
                      <input
                        type="number"
                        className="form-input"
                        value={driverBata}
                        onChange={e => setDriverBata(e.target.value)}
                        min="0"
                        step="any"
                        placeholder="0"
                        style={{ paddingLeft: '28px', fontWeight: 700, fontSize: '14px' }}
                      />
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-faint, #64748b)', marginTop: '3px', display: 'block' }}>
                      Driver allowance, food or cash given
                    </span>
                  </div>

                  {/* 4. Other Expenses */}
                  <div>
                    <label
                      className="form-label"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: 600,
                        fontSize: '12.5px',
                        marginBottom: '6px',
                        color: 'var(--text, #f8fafc)'
                      }}
                    >
                      <IndianRupee size={14} style={{ color: '#94a3b8' }} /> Other Incidentals (₹)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint, #64748b)', fontSize: '13px' }}>
                        ₹
                      </span>
                      <input
                        type="number"
                        className="form-input"
                        value={otherExpenses}
                        onChange={e => setOtherExpenses(e.target.value)}
                        min="0"
                        step="any"
                        placeholder="0"
                        style={{ paddingLeft: '28px', fontWeight: 700, fontSize: '14px' }}
                      />
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-faint, #64748b)', marginTop: '3px', display: 'block' }}>
                      Parking, puncture, permit or wash
                    </span>
                  </div>
                </div>

                {/* Subtotal of expenses */}
                <div
                  style={{
                    marginTop: '16px',
                    paddingTop: '14px',
                    borderTop: '1px solid var(--border-soft, #334155)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '13.5px'
                  }}
                >
                  <span style={{ color: 'var(--text-dim, #94a3b8)', fontWeight: 600 }}>
                    Total Trip Direct Expenses:
                  </span>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: '#ef4444' }}>
                    {formatINR(totalDirectCost)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ODOMETER & KILOMETERS */}
          {activeTab === 'odometer' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  background: 'var(--surface-2, #1e293b)',
                  border: '1px solid var(--border-soft, #334155)',
                  borderRadius: '14px',
                  padding: '18px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px',
                  alignItems: 'center'
                }}
              >
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '12.5px', marginBottom: '6px' }}>
                    Start Odometer (km)
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={startOdometer}
                    onChange={e => setStartOdometer(e.target.value)}
                    min="0"
                    style={{ fontWeight: 700, fontSize: '14px' }}
                    placeholder="0"
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-faint, #64748b)', marginTop: '3px', display: 'block' }}>
                    Initial reading at trip dispatch
                  </span>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '12.5px', marginBottom: '6px' }}>
                    End Odometer (km)
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={endOdometer}
                    onChange={e => setEndOdometer(e.target.value)}
                    min={numStartKm}
                    style={{ fontWeight: 700, fontSize: '14px' }}
                    placeholder={`min. ${numStartKm}`}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-faint, #64748b)', marginTop: '3px', display: 'block' }}>
                    Final reading after trip conclusion
                  </span>
                </div>

                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: 'var(--surface-1, #090d16)',
                    border: '1px solid var(--border-soft, #334155)',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '11px', color: 'var(--text-faint, #94a3b8)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Calculated Total Distance Run
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent, #38bdf8)', marginTop: '4px' }}>
                    {totalKmRun.toLocaleString('en-IN')} <span style={{ fontSize: '13px', fontWeight: 600 }}>km</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOMER SETTLEMENT & FARE */}
          {activeTab === 'settlement' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  background: 'var(--surface-2, #1e293b)',
                  border: '1px solid var(--border-soft, #334155)',
                  borderRadius: '14px',
                  padding: '18px'
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text, #f8fafc)', marginBottom: '14px' }}>
                  Agreed Fare & Customer Payment Status
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                  {/* Total Agreed Fare */}
                  <div>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '12.5px', marginBottom: '6px' }}>
                      Total Agreed Fare (₹) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint, #64748b)', fontSize: '13px' }}>
                        ₹
                      </span>
                      <input
                        type="number"
                        className="form-input"
                        value={revenue}
                        onChange={e => setRevenue(e.target.value)}
                        min="0"
                        step="any"
                        required
                        style={{ paddingLeft: '28px', fontWeight: 700, fontSize: '14px' }}
                      />
                    </div>
                  </div>

                  {/* Advance Received */}
                  <div>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '12.5px', marginBottom: '6px' }}>
                      Advance Received (₹)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint, #64748b)', fontSize: '13px' }}>
                        ₹
                      </span>
                      <input
                        type="number"
                        className="form-input"
                        value={advanceAmount}
                        onChange={e => setAdvanceAmount(e.target.value)}
                        min="0"
                        step="any"
                        style={{ paddingLeft: '28px', fontWeight: 700, fontSize: '14px' }}
                      />
                    </div>
                  </div>

                  {/* Advance Payment Mode */}
                  <div>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '12.5px', marginBottom: '6px' }}>
                      Advance Payment Mode
                    </label>
                    <select
                      className="form-input"
                      value={advancePaymentMode}
                      onChange={e => setAdvancePaymentMode(e.target.value as PaymentMode)}
                      style={{ fontWeight: 600 }}
                    >
                      <option value="UPI">UPI / GPay / PhonePe</option>
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Pending">Pending / Not Paid</option>
                    </select>
                  </div>

                  {/* Balance Paid */}
                  <div>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '12.5px', marginBottom: '6px' }}>
                      Balance Paid / Settled (₹)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint, #64748b)', fontSize: '13px' }}>
                        ₹
                      </span>
                      <input
                        type="number"
                        className="form-input"
                        value={balancePaid}
                        onChange={e => setBalancePaid(e.target.value)}
                        min="0"
                        step="any"
                        style={{ paddingLeft: '28px', fontWeight: 700, fontSize: '14px' }}
                      />
                    </div>
                  </div>

                  {/* Balance Payment Mode */}
                  <div>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '12.5px', marginBottom: '6px' }}>
                      Balance Payment Mode
                    </label>
                    <select
                      className="form-input"
                      value={balancePaymentMode}
                      onChange={e => setBalancePaymentMode(e.target.value as PaymentMode)}
                      style={{ fontWeight: 600 }}
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI / GPay / PhonePe</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>

                  {/* Remaining Due */}
                  <div>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '12.5px', marginBottom: '6px' }}>
                      Remaining Pending Balance
                    </label>
                    <div
                      style={{
                        padding: '9px 12px',
                        borderRadius: '8px',
                        background: pendingDue > 0 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(34, 197, 94, 0.12)',
                        border: `1px solid ${pendingDue > 0 ? 'rgba(245, 158, 11, 0.35)' : 'rgba(34, 197, 94, 0.35)'}`,
                        fontWeight: 800,
                        fontSize: '14px',
                        color: pendingDue > 0 ? '#f59e0b' : '#22c55e'
                      }}
                    >
                      {pendingDue > 0 ? formatINR(pendingDue) : '✓ Full Paid'}
                    </div>
                  </div>
                </div>

                {/* Settlement Notes */}
                <div style={{ marginTop: '14px' }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '12px', marginBottom: '6px' }}>
                    Payment & Settlement Notes (Optional)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={paymentNotes}
                    onChange={e => setPaymentNotes(e.target.value)}
                    placeholder="e.g. Paid via UPI Txn ID #982312, remaining ₹500 to be paid next week"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TRIP DETAILS & OPERATIONAL INFO */}
          {activeTab === 'tripDetails' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  background: 'var(--surface-2, #1e293b)',
                  border: '1px solid var(--border-soft, #334155)',
                  borderRadius: '14px',
                  padding: '18px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '14px'
                }}
              >
                {/* Trip Status */}
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '12.5px', marginBottom: '6px' }}>
                    Trip Lifecycle Status
                  </label>
                  <select
                    className="form-input"
                    value={status}
                    onChange={e => setStatus(e.target.value as TripStatus)}
                    style={{ fontWeight: 700 }}
                  >
                    <option value="Scheduled">Scheduled (Upcoming)</option>
                    <option value="Ongoing">Ongoing (In Progress)</option>
                    <option value="Completed">Completed (Finished)</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Vehicle */}
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '12.5px', marginBottom: '6px' }}>
                    Vehicle
                  </label>
                  <select
                    className="form-input"
                    value={vehicle}
                    onChange={e => setVehicle(e.target.value)}
                    style={{ fontWeight: 600 }}
                  >
                    {vehicles.map(v => (
                      <option key={v.id || v.registrationNumber} value={v.registrationNumber}>
                        {v.registrationNumber} ({v.model || v.name})
                      </option>
                    ))}
                    {!vehicles.some(v => v.registrationNumber === vehicle) && vehicle && (
                      <option value={vehicle}>{vehicle}</option>
                    )}
                  </select>
                </div>

                {/* Driver */}
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '12.5px', marginBottom: '6px' }}>
                    Driver Name
                  </label>
                  <select
                    className="form-input"
                    value={driverName}
                    onChange={e => setDriverName(e.target.value)}
                    style={{ fontWeight: 600 }}
                  >
                    <option value="Unassigned">Unassigned</option>
                    {drivers.map(d => (
                      <option key={d.id || d.name} value={d.name}>
                        {d.name} ({d.phone})
                      </option>
                    ))}
                    {!drivers.some(d => d.name === driverName) && driverName && driverName !== 'Unassigned' && (
                      <option value={driverName}>{driverName}</option>
                    )}
                  </select>
                </div>

                {/* Trip Type */}
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '12.5px', marginBottom: '6px' }}>
                    Trip Type
                  </label>
                  <select
                    className="form-input"
                    value={tripType}
                    onChange={e => setTripType(e.target.value as TripType)}
                  >
                    <option value="Round Trip">Round Trip</option>
                    <option value="One-way (Single)">One-way (Single)</option>
                  </select>
                </div>

                {/* Customer Name */}
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '12.5px', marginBottom: '6px' }}>
                    Customer / Client Name
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="Customer Name"
                  />
                </div>

                {/* Customer Phone */}
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '12.5px', marginBottom: '6px' }}>
                    Customer Phone
                  </label>
                  <input
                    type="tel"
                    className="form-input"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>

                {/* Pickup Location */}
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '12.5px', marginBottom: '6px' }}>
                    Pickup Location
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={pickupLocation}
                    onChange={e => setPickupLocation(e.target.value)}
                    placeholder="e.g. Dehradun Railway Station"
                  />
                </div>

                {/* Drop Location */}
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '12.5px', marginBottom: '6px' }}>
                    Drop Location
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={dropLocation}
                    onChange={e => setDropLocation(e.target.value)}
                    placeholder="e.g. Mussoorie Mall Road"
                  />
                </div>

                {/* Route */}
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '12.5px', marginBottom: '6px' }}>
                    Route Summary
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={route}
                    onChange={e => setRoute(e.target.value)}
                    placeholder="e.g. Dehradun ⇄ Mussoorie Sightseeing"
                  />
                </div>

                {/* Start Date */}
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '12.5px', marginBottom: '6px' }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '12.5px', marginBottom: '6px' }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Remarks / Notes */}
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '12px', marginBottom: '6px' }}>
                  Trip Remarks / Closing Notes
                </label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Additional notes about driver feedback, vehicle condition, client comments, etc."
                />
              </div>
            </div>
          )}

          {/* MODAL FOOTER BUTTONS */}
          <div
            style={{
              paddingTop: '16px',
              borderTop: '1px solid var(--border-soft, #334155)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              marginTop: 'auto'
            }}
          >
            <div style={{ fontSize: '12px', color: 'var(--text-faint, #64748b)' }}>
              Expenses: <strong style={{ color: '#ef4444' }}>{formatINR(totalDirectCost)}</strong> • Profit: <strong style={{ color: netProfit >= 0 ? '#22c55e' : '#ef4444' }}>{formatINR(netProfit)}</strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={onClose}
                disabled={isSubmitting}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn-primary-action"
                disabled={isSubmitting}
                style={{
                  padding: '8px 22px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer'
                }}
              >
                <Save size={14} />
                {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
