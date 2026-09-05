import React, { useState, useEffect, useMemo } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { TripType, PaymentMode, VehicleAvailabilityResult } from '../../../types/fleet';
import { Navigation, ArrowRight, RotateCcw, Calendar, AlertTriangle, CheckCircle2, User, Phone, IndianRupee, Car, Clock } from 'lucide-react';
import { MinimalVoiceFiller } from '../../common/MinimalVoiceFiller';
import { DatePicker } from '../../common/DatePicker';

interface AddBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillVehicle?: string;
  prefillDate?: string;
}

export const AddBookingModal: React.FC<AddBookingModalProps> = ({
  isOpen,
  onClose,
  prefillVehicle,
  prefillDate
}) => {
  const { vehicles, drivers, trips, addBooking, checkVehicleAvailability } = useFleet();

  // 1. DATES & SCHEDULE (STEP 1 - User selects date first!)
  const [startDate, setStartDate] = useState(() => prefillDate || new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState(() => {
    const d = new Date();
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  });
  const [endDate, setEndDate] = useState(() => prefillDate || new Date().toISOString().split('T')[0]);

  // Vehicle Availability on the chosen date
  const [availability, setAvailability] = useState<VehicleAvailabilityResult | null>(null);
  const [isCheckingAvail, setIsCheckingAvail] = useState(false);

  // 2. VEHICLE & DRIVER (STEP 2 - Selected according to available cars on that date)
  const [vehicleReg, setVehicleReg] = useState(prefillVehicle || '');
  const [driverName, setDriverName] = useState(drivers[0]?.name || 'Vikas Kumar');
  const [startOdometer, setStartOdometer] = useState('61200');

  // 3. TRIP TYPE & ROUTE
  const [tripType, setTripType] = useState<TripType>('Round Trip');
  const [pickupLocation, setPickupLocation] = useState('Delhi Airport (IGI T3)');
  const [dropLocation, setDropLocation] = useState('Chandigarh Sector 17');

  // 4. CLIENT / PASSENGER DETAILS
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // 5. PRICING & ADVANCE PAYMENT
  const [totalFare, setTotalFare] = useState('18000');
  const [advanceAmount, setAdvanceAmount] = useState('5000');
  const [advanceMode, setAdvanceMode] = useState<PaymentMode>('UPI');

  // Expenses estimates
  const [fuelCost, setFuelCost] = useState('3500');
  const [fastagCost, setFastagCost] = useState('650');
  const [driverBata, setDriverBata] = useState('1200');
  const [otherExpenses, setOtherExpenses] = useState('100');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch availability whenever date changes or modal opens
  useEffect(() => {
    let isCurrent = true;
    const fetchAvail = async () => {
      if (!isOpen || !startDate) return;
      setIsCheckingAvail(true);
      try {
        const result = await checkVehicleAvailability(startDate);
        if (isCurrent && result) {
          setAvailability(result);

          // Check if current vehicle is available
          const isCurrentlyBooked = result.bookedVehicles?.some(b => b.vehicle === vehicleReg);
          const isCurrentlyAvailable = result.availableVehicles?.some(v => v.vehicle === vehicleReg);

          // If prefillVehicle was passed and is available, keep it
          if (prefillVehicle && result.availableVehicles?.some(v => v.vehicle === prefillVehicle)) {
            setVehicleReg(prefillVehicle);
          } else if ((!vehicleReg || isCurrentlyBooked || !isCurrentlyAvailable) && result.availableVehicles?.length > 0) {
            // Auto select the first free vehicle on this date
            setVehicleReg(result.availableVehicles[0].vehicle);
          } else if (result.availableVehicles?.length === 0) {
            setVehicleReg('');
          }
        }
      } catch (err) {
        console.error('Error fetching availability for date:', startDate, err);
      } finally {
        if (isCurrent) setIsCheckingAvail(false);
      }
    };

    fetchAvail();
    return () => {
      isCurrent = false;
    };
  }, [startDate, isOpen]);

  // Sync prefill props
  useEffect(() => {
    if (prefillVehicle) setVehicleReg(prefillVehicle);
    if (prefillDate) {
      setStartDate(prefillDate);
      setEndDate(prefillDate);
    }
  }, [prefillVehicle, prefillDate, isOpen]);

  // When vehicle selection changes, auto-suggest odometer and designated driver
  useEffect(() => {
    const foundVehicle = vehicles.find(v => v.registrationNumber === vehicleReg);
    if (foundVehicle) {
      if (foundVehicle.odometer) setStartOdometer(String(foundVehicle.odometer));
      if (foundVehicle.assignedDriver) {
        const foundDriver = drivers.find(d => d.name === foundVehicle.assignedDriver);
        if (foundDriver) setDriverName(foundDriver.name);
      }
    }
  }, [vehicleReg, vehicles, drivers]);

  // Keyboard escape
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
    setStartDate(dateStr);
    if (endDate < dateStr) setEndDate(dateStr);
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

  const isVehicleConflicted = availability?.bookedVehicles.some(b => b.vehicle === vehicleReg);
  const conflictingBooking = availability?.bookedVehicles.find(b => b.vehicle === vehicleReg);

  const fareNum = Number(totalFare) || 0;
  const advanceNum = Number(advanceAmount) || 0;
  const pendingNum = Math.max(0, fareNum - advanceNum);

  const fuelNum = Number(fuelCost) || 0;
  const fastagNum = Number(fastagCost) || 0;
  const driverNum = Number(driverBata) || 0;
  const otherNum = Number(otherExpenses) || 0;
  const totalExp = fuelNum + fastagNum + driverNum + otherNum;
  const estProfit = fareNum - totalExp;
  const estMargin = fareNum > 0 ? ((estProfit / fareNum) * 100).toFixed(1) + '%' : '0%';

  const isAdvanceDate = startDate > new Date().toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleReg) {
      setErrorMsg('Please select an available vehicle for this date.');
      return;
    }
    if (isVehicleConflicted) {
      setErrorMsg(`Vehicle ${vehicleReg} is already booked on ${startDate}. Please choose a free vehicle.`);
      return;
    }
    if (!pickupLocation.trim() || !dropLocation.trim()) {
      setErrorMsg('Please specify pickup and drop locations.');
      return;
    }
    if (!customerName.trim()) {
      setErrorMsg('Please enter customer / passenger name for this booking.');
      return;
    }
    if (!fareNum || fareNum <= 0) {
      setErrorMsg('Total booking fare must be greater than 0.');
      return;
    }

    const selectedVehicleObj = vehicles.find(v => v.registrationNumber === vehicleReg);

    const bookingPayload = {
      tripType,
      vehicle: vehicleReg,
      vehicleModel: selectedVehicleObj?.model || selectedVehicleObj?.type || 'Commercial MPV',
      driverName,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || undefined,
      pickupLocation: pickupLocation.trim(),
      dropLocation: dropLocation.trim(),
      route: `${pickupLocation.trim()} → ${dropLocation.trim()}`,
      startDate,
      startTime,
      endDate: endDate || startDate,
      startOdometer: Number(startOdometer) || 0,
      revenue: fareNum,
      totalAmount: fareNum,
      advanceAmount: advanceNum,
      advancePaymentMode: advanceNum > 0 ? advanceMode : 'Not Paid',
      pendingAmount: pendingNum,
      paymentStatus: (pendingNum === 0 && fareNum > 0 ? 'Paid' : advanceNum > 0 ? 'Partial' : 'Unpaid') as any,
      fuelCost: fuelNum,
      fastagCost: fastagNum,
      driverBata: driverNum,
      otherExpenses: otherNum,
      status: (isAdvanceDate ? 'Scheduled' : 'Ongoing') as any,
      notes: notes.trim() || undefined,
      isDepartmentVehicle: selectedVehicleObj?.type === 'Department',
      departmentName: selectedVehicleObj?.departmentName
    };

    try {
      await addBooking(bookingPayload);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save booking. Please try again.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        style={{ maxWidth: 660, maxHeight: '92vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Navigation size={18} color="var(--accent)" />
              {isAdvanceDate ? 'Create Advance Booking (Future Date)' : 'Create New Cab Booking'}
            </h3>
            <span className="modal-subtitle">
              Select booking date first, then choose an available vehicle to create booking
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose} type="button">✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <div className="modal-body" style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', padding: '18px 22px' }}>
            {errorMsg && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(255, 92, 92, 0.15)',
                  border: '1px solid rgba(255, 92, 92, 0.3)',
                  color: 'var(--danger)',
                  fontSize: '12.5px'
                }}
              >
                {errorMsg}
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 1: DATE SELECTION FIRST                                              */}
            {/* ========================================================================= */}
            <div
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border-soft)',
                borderRadius: '10px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={15} /> 1. Select Booking Date & Travel Schedule
                </div>
                
                {/* Quick Date Chips */}
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button
                    type="button"
                    className="subtab-btn"
                    onClick={() => handleQuickDate(0)}
                    style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '6px' }}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    className="subtab-btn"
                    onClick={() => handleQuickDate(1)}
                    style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '6px' }}
                  >
                    Tomorrow
                  </button>
                  <button
                    type="button"
                    className="subtab-btn"
                    onClick={() => handleQuickDate(3)}
                    style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '6px' }}
                  >
                    +3 Days
                  </button>
                  <button
                    type="button"
                    className="subtab-btn"
                    onClick={() => handleQuickDate(7)}
                    style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '6px' }}
                  >
                    +1 Week
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600, color: 'var(--text)' }}>
                    Pickup Date (Booking Date) *
                  </label>
                  <DatePicker
                    value={startDate}
                    onChange={date => {
                      setStartDate(date);
                      if (endDate < date) setEndDate(date);
                    }}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Pickup Time</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      className="form-input"
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                      placeholder="e.g. 08:30 AM"
                      style={{ paddingRight: '28px' }}
                    />
                    <Clock size={13} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Return / Drop Date</label>
                  <DatePicker
                    value={endDate}
                    onChange={date => setEndDate(date)}
                    min={startDate}
                    placeholder="Same day (or select)"
                  />
                </div>
              </div>

              {/* Live Availability Banner for Selected Date */}
              <div
                style={{
                  background: availability?.availableCount === 0 ? 'rgba(255, 92, 92, 0.12)' : 'rgba(0, 230, 153, 0.08)',
                  border: `1px solid ${availability?.availableCount === 0 ? 'rgba(255, 92, 92, 0.3)' : 'rgba(0, 230, 153, 0.25)'}`,
                  borderRadius: '8px',
                  padding: '9px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                  fontSize: '12px'
                }}
              >
                {isCheckingAvail ? (
                  <span style={{ color: 'var(--text-dim)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    🔄 Checking available fleet for {formatDateDisplay(startDate)}...
                  </span>
                ) : availability?.availableCount === 0 ? (
                  <span style={{ color: 'var(--danger)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={15} /> All {availability?.totalVehicles} vehicles are booked on {formatDateDisplay(startDate)}! No free car available.
                  </span>
                ) : (
                  <span style={{ color: 'var(--accent)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={15} />
                    <span>
                      <b>{availability?.availableCount} Vehicles Available (Free)</b> on {formatDateDisplay(startDate)}
                      {availability && availability.bookedCount > 0 && (
                        <span style={{ color: 'var(--text-dim)', fontWeight: 500, marginLeft: '6px' }}>
                          ({availability.bookedCount} already booked on this day)
                        </span>
                      )}
                    </span>
                  </span>
                )}

                {isAdvanceDate && (
                  <span className="driver-type-badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontSize: '11px' }}>
                    📅 Advance Booking ({startDate})
                  </span>
                )}
              </div>
            </div>

            {/* ========================================================================= */}
            {/* STEP 2: VEHICLE & DRIVER                                                  */}
            {/* ========================================================================= */}
            <div
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border-soft)',
                borderRadius: '10px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Car size={15} color="var(--accent)" /> 2. Select Available Vehicle
              </div>

              <div className="form-row-2">
                {/* Vehicle Dropdown */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" style={{ marginBottom: 0, fontWeight: 600, color: 'var(--text)' }}>
                      Assigned Vehicle *
                    </label>
                    {vehicleReg && !isVehicleConflicted ? (
                      <span style={{ fontSize: '11px', color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                        <CheckCircle2 size={12} /> Free on {startDate}
                      </span>
                    ) : isVehicleConflicted ? (
                      <span style={{ fontSize: '11px', color: 'var(--danger)', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 700 }}>
                        <AlertTriangle size={12} /> Already Booked!
                      </span>
                    ) : null}
                  </div>

                  <select
                    className="form-input"
                    style={{
                      fontWeight: 600,
                      borderColor: isVehicleConflicted ? 'var(--danger)' : vehicleReg ? 'var(--accent)' : undefined
                    }}
                    value={vehicleReg}
                    onChange={e => setVehicleReg(e.target.value)}
                    required
                  >
                    {!availability || availability.availableVehicles.length === 0 ? (
                      <option value="" disabled>
                        {isCheckingAvail ? 'Checking fleet...' : `⚠️ No free vehicles available on ${startDate}`}
                      </option>
                    ) : (
                      <option value="">-- Select Available Vehicle ({availability.availableVehicles.length} Free) --</option>
                    )}

                    {availability && availability.availableVehicles.length > 0 && (
                      <optgroup label={`🟢 Available to Book on ${startDate} (${availability.availableVehicles.length} Free)`}>
                        {availability.availableVehicles.map(v => (
                          <option key={v.vehicle} value={v.vehicle}>
                            🟢 {v.vehicle} — {v.model} ({v.type === 'Department' ? 'Dept Vehicle' : 'Commercial'}) [Ready]
                          </option>
                        ))}
                      </optgroup>
                    )}

                    {availability && availability.bookedVehicles.length > 0 && (
                      <optgroup label={`❌ Already Booked on ${startDate} (${availability.bookedVehicles.length} Busy)`}>
                        {availability.bookedVehicles.map(b => (
                          <option key={b.vehicle} value={b.vehicle} disabled>
                            🔴 {b.vehicle} — Booked ({b.customerName || 'Busy'} · {b.bookingNumber})
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>

                  {isVehicleConflicted && conflictingBooking && (
                    <div style={{ fontSize: '11.5px', color: 'var(--danger)', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertTriangle size={12} />
                      <span>
                        <b>{vehicleReg}</b> is booked for {conflictingBooking.customerName} ({conflictingBooking.route}). Please pick a free car above.
                      </span>
                    </div>
                  )}
                </div>

                {/* Designated Driver */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600, color: 'var(--text)' }}>
                    Assigned Driver *
                  </label>
                  <select
                    className="form-input"
                    value={driverName}
                    onChange={e => setDriverName(e.target.value)}
                    required
                  >
                    {drivers.map(d => (
                      <option key={d.id} value={d.name}>
                        {d.name} ({d.phone})
                      </option>
                    ))}
                  </select>
                  <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '5px' }}>
                    Auto-synced with vehicle designated driver
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* STEP 3: TRIP TYPE & JOURNEY ROUTE                                         */}
            {/* ========================================================================= */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
                3. Booking Trip Type
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  className={`subtab-btn ${tripType === 'Round Trip' ? 'active' : ''}`}
                  onClick={() => setTripType('Round Trip')}
                  style={{
                    justifyContent: 'center',
                    padding: '9px 12px',
                    fontSize: '12.5px',
                    borderRadius: '8px',
                    border: tripType === 'Round Trip' ? '1px solid var(--accent)' : '1px solid var(--border)'
                  }}
                >
                  <RotateCcw size={14} /> Round Trip (Return)
                </button>
                <button
                  type="button"
                  className={`subtab-btn ${tripType === 'One-way (Single)' ? 'active' : ''}`}
                  onClick={() => setTripType('One-way (Single)')}
                  style={{
                    justifyContent: 'center',
                    padding: '9px 12px',
                    fontSize: '12.5px',
                    borderRadius: '8px',
                    border: tripType === 'One-way (Single)' ? '1px solid var(--accent)' : '1px solid var(--border)'
                  }}
                >
                  <ArrowRight size={14} /> One-way (Drop Only)
                </button>
              </div>
            </div>

            {/* Pickup & Drop Route */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Pickup Location *</label>
                <input
                  type="text"
                  className="form-input"
                  value={pickupLocation}
                  onChange={e => setPickupLocation(e.target.value)}
                  placeholder="e.g. Delhi Airport (IGI T3)"
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Drop Location *</label>
                <input
                  type="text"
                  className="form-input"
                  value={dropLocation}
                  onChange={e => setDropLocation(e.target.value)}
                  placeholder="e.g. Chandigarh Sector 17"
                  required
                />
              </div>
            </div>

            {/* ========================================================================= */}
            {/* STEP 4: PASSENGER & CLIENT DETAILS                                        */}
            {/* ========================================================================= */}
            <div
              style={{
                background: 'var(--surface-2)',
                padding: '14px 16px',
                borderRadius: '10px',
                border: '1px solid var(--border-soft)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={14} color="var(--accent)" /> 4. Client & Passenger Details
              </div>
              <div className="form-row-2">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Customer / Passenger Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="e.g. Dr. Ramesh Gupta"
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Customer Contact Number</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* STEP 5: PRICING, ADVANCE PAYMENT & FINANCIALS                             */}
            {/* ========================================================================= */}
            <div
              style={{
                background: 'rgba(56, 189, 248, 0.05)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '10px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <IndianRupee size={15} /> 5. Booking Fare, Advance Payment & Pending Balance
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600, color: 'var(--text)' }}>
                    Total Agreed Fare (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    style={{ fontSize: '15px', fontWeight: 800, color: 'var(--accent)' }}
                    value={totalFare}
                    onChange={e => setTotalFare(e.target.value)}
                    placeholder="18000"
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600, color: 'var(--text)' }}>
                    Advance Received (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    style={{ fontSize: '15px', fontWeight: 700, color: '#38bdf8' }}
                    value={advanceAmount}
                    onChange={e => setAdvanceAmount(e.target.value)}
                    placeholder="5000"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Advance Payment Mode</label>
                  <select
                    className="form-input"
                    value={advanceMode}
                    onChange={e => setAdvanceMode(e.target.value as PaymentMode)}
                  >
                    <option value="UPI">UPI (GPay / PhonePe)</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Not Paid">Not Paid Yet</option>
                  </select>
                </div>
              </div>

              {/* Pending Balance Banner */}
              <div
                style={{
                  background: pendingNum > 0 ? 'rgba(255, 180, 0, 0.12)' : 'rgba(0, 230, 153, 0.12)',
                  border: `1px solid ${pendingNum > 0 ? 'rgba(255, 180, 0, 0.35)' : 'rgba(0, 230, 153, 0.3)'}`,
                  padding: '9px 12px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '12.5px'
                }}
              >
                <span>
                  Advance Received: <b style={{ color: '#38bdf8' }}>₹{advanceNum.toLocaleString('en-IN')}</b>
                </span>
                <span style={{ fontWeight: 700, color: pendingNum > 0 ? 'var(--warning)' : 'var(--accent)' }}>
                  {pendingNum > 0
                    ? `⚠️ Pending Due: ₹${pendingNum.toLocaleString('en-IN')}`
                    : '✓ Full Payment Received (Paid)'}
                </span>
              </div>
            </div>

            {/* Operating Expenses & Profitability */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Fuel Estimate (₹)</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  value={fuelCost}
                  onChange={e => setFuelCost(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">FASTag / Tolls (₹)</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  value={fastagCost}
                  onChange={e => setFastagCost(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Driver Bata (₹)</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  value={driverBata}
                  onChange={e => setDriverBata(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Other Exp. (₹)</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  value={otherExpenses}
                  onChange={e => setOtherExpenses(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Net Profit Summary Pill */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                background: 'var(--surface-2)',
                borderRadius: '8px',
                border: '1px solid var(--border-soft)',
                fontSize: '12.5px'
              }}
            >
              <span style={{ color: 'var(--text-dim)' }}>
                Est. Operating Expenses: <b>₹{totalExp.toLocaleString('en-IN')}</b>
              </span>
              <span style={{ color: estProfit >= 0 ? 'var(--accent)' : 'var(--danger)', fontWeight: 700 }}>
                Estimated Net Profit: ₹{estProfit.toLocaleString('en-IN')} ({estMargin})
              </span>
            </div>

            {/* Notes */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Notes & Special Instructions (Optional)</label>
              <input
                type="text"
                className="form-input"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. VIP passenger, child seat required, client arrival at T3"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary-action"
              style={{ padding: '8px 22px', fontSize: '13px', fontWeight: 700 }}
              disabled={isVehicleConflicted || (availability && availability.availableVehicles.length === 0)}
            >
              Confirm & Save Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
