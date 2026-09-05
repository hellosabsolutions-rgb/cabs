import React, { useState, useEffect } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { TripType } from '../../../types/fleet';
import { Navigation, ArrowRight, RotateCcw, Building2 } from 'lucide-react';
import { MinimalVoiceFiller } from '../../common/MinimalVoiceFiller';
import { DatePicker } from '../../common/DatePicker';

interface AddTripModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddTripModal: React.FC<AddTripModalProps> = ({ isOpen, onClose }) => {
  const { vehicles, drivers, addTrip, switchVehicleMode } = useFleet();

  const [tripType, setTripType] = useState<TripType>('Round Trip');
  const [vehicleReg, setVehicleReg] = useState(
    vehicles.find(v => v.type === 'Trip-based')?.registrationNumber || vehicles[0]?.registrationNumber || 'DL02CD5678'
  );
  const [driverName, setDriverName] = useState(drivers[1]?.name || drivers[0]?.name || 'Vikas Kumar');
  const [pickupLocation, setPickupLocation] = useState('Delhi Airport (IGI T3)');
  const [dropLocation, setDropLocation] = useState('Chandigarh Sector 17');
  const [startOdometer, setStartOdometer] = useState('61200');
  const [fuelLitres, setFuelLitres] = useState('35');
  const [fuelCost, setFuelCost] = useState('3150');
  const [fastagCost, setFastagCost] = useState('650');
  const [driverBata, setDriverBata] = useState('1200');
  const [otherExpenses, setOtherExpenses] = useState('100');
  const [revenue, setRevenue] = useState('14500');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState(() => {
    const d = new Date();
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  });
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // When vehicle changes, update start odometer from vehicle specs
  useEffect(() => {
    const foundVehicle = vehicles.find(v => v.registrationNumber === vehicleReg);
    if (foundVehicle && foundVehicle.odometer) {
      setStartOdometer(String(foundVehicle.odometer));
    }
  }, [vehicleReg, vehicles]);

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

  const fareNum = Number(revenue) || 0;
  const fuelNum = Number(fuelCost) || 0;
  const fastagNum = Number(fastagCost) || 0;
  const driverNum = Number(driverBata) || 0;
  const otherNum = Number(otherExpenses) || 0;
  const totalExp = fuelNum + fastagNum + driverNum + otherNum;
  const estProfit = fareNum - totalExp;
  const estMargin = fareNum > 0 ? ((estProfit / fareNum) * 100).toFixed(1) + '%' : '0%';

  const selectedVehicleObj = vehicles.find(v => v.registrationNumber === vehicleReg);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupLocation.trim() || !dropLocation.trim()) {
      setErrorMsg('Please specify pickup and drop locations.');
      return;
    }
    if (!fareNum || fareNum <= 0) {
      setErrorMsg('Please enter customer trip fare / billing amount.');
      return;
    }

    const route =
      tripType === 'Round Trip'
        ? `${pickupLocation.trim()} → ${dropLocation.trim()} → ${pickupLocation.trim()}`
        : `${pickupLocation.trim()} → ${dropLocation.trim()}`;

    addTrip({
      tripNumber: `TRIP-${Math.floor(Math.random() * 9000 + 1000)}`,
      tripType,
      vehicle: vehicleReg,
      vehicleModel: selectedVehicleObj?.model || selectedVehicleObj?.type,
      driverName,
      pickupLocation: pickupLocation.trim(),
      dropLocation: dropLocation.trim(),
      route,
      startDate,
      startTime,
      startOdometer: Number(startOdometer) || 0,
      initialFuelLitres: Number(fuelLitres) || 0,
      fuelCost: fuelNum,
      fastagCost: fastagNum,
      driverBata: driverNum,
      otherExpenses: otherNum,
      revenue: fareNum,
      expenses: totalExp,
      profit: estProfit,
      margin: estMargin,
      status: 'Ongoing',
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      notes: notes.trim() || undefined
    });

    if (selectedVehicleObj && selectedVehicleObj.type === 'Department') {
      switchVehicleMode(selectedVehicleObj.id, 'Trip-based');
    }

    setErrorMsg('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <div className="modal-title-group">
            <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Navigation size={18} color="var(--accent)" /> Add Trip (New Booking)
            </h3>
            <span className="modal-subtitle">
              Dispatch commercial or outstation cab with fuel, toll & profit estimation
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="modal-body">
            {/* Minimal Voice Form Filler */}
            <MinimalVoiceFiller
              formType="trip"
              context={{
                vehicles: vehicles.map(v => v.registrationNumber),
                drivers: drivers.map(d => d.name)
              }}
              placeholder="Speak trip details (e.g. 'Customer Amit Sharma Delhi to Jaipur DL02CD5678 Fare 14500')"
              onApplyParsedData={(data) => {
                if (data.customerName) setCustomerName(data.customerName);
                if (data.customerPhone) setCustomerPhone(data.customerPhone);
                if (data.route) {
                  const parts = data.route.split(/\s*(?:to|se|-)\s*/i);
                  if (parts.length >= 2) {
                    setPickupLocation(parts[0]);
                    setDropLocation(parts[1]);
                  } else {
                    setDropLocation(data.route);
                  }
                }
                if (data.vehicle) setVehicleReg(data.vehicle);
                if (data.driverName) setDriverName(data.driverName);
                if (data.revenue) setRevenue(data.revenue);
                if (data.advancePayment) setNotes(prev => (prev ? `${prev} · Advance: ₹${data.advancePayment}` : `Advance: ₹${data.advancePayment}`));
              }}
            />

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

            {/* 1. Trip Type: Single (One-way) vs Round Trip */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Trip Type (Single ya Round Trip) *</label>
              <div className="driver-type-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                {(['One-way (Single)', 'Round Trip'] as TripType[]).map(t => (
                  <div
                    key={t}
                    className={`driver-type-option ${tripType === t ? 'active' : ''}`}
                    onClick={() => setTripType(t)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    {t === 'One-way (Single)' ? (
                      <>
                        <ArrowRight size={14} /> Single (One-Way)
                      </>
                    ) : (
                      <>
                        <RotateCcw size={14} /> Round Trip
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Route */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Pickup Location *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Delhi Airport (IGI T3)"
                  value={pickupLocation}
                  onChange={e => setPickupLocation(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Drop Location *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Chandigarh Sector 17"
                  value={dropLocation}
                  onChange={e => setDropLocation(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* 3. Vechile konsi & Driver kon hai */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Vehicle (Vechile Konsi) *</label>
                <select
                  className="form-input"
                  value={vehicleReg}
                  onChange={e => setVehicleReg(e.target.value)}
                >
                  {vehicles.map(v => (
                    <option key={v.id} value={v.registrationNumber}>
                      {v.registrationNumber} ({v.model || v.type})
                      {v.type === 'Department' ? ` · [Dept: ${v.departmentName || v.assignedTo}] (Weekend Trip Allowed)` : ' · [Trip Cab]'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Designated Driver (Driver Kon Hai) *</label>
                <select
                  className="form-input"
                  value={driverName}
                  onChange={e => setDriverName(e.target.value)}
                >
                  {drivers.map(d => (
                    <option key={d.id} value={d.name}>
                      {d.name} ({d.driverType || 'Driver'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notice if Department Vehicle is being dispatched on Trip */}
            {selectedVehicleObj?.type === 'Department' && (
              <div
                style={{
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  padding: '9px 13px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: 'var(--text-dim)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Building2 size={16} color="#38bdf8" style={{ flexShrink: 0 }} />
                <div>
                  <b style={{ color: 'var(--text)' }}>Weekend / Off-Duty Trip Mode:</b> This vehicle is assigned to{' '}
                  <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{selectedVehicleObj.departmentName || selectedVehicleObj.assignedTo}</span> on weekdays. Dispatching it on a trip will record its profit and fuel/FASTag under Trips, while the department's monthly contract billing remains intact.
                </div>
              </div>
            )}

            {/* 4. Start Odometer & Start Date/Time */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Start Odometer Reading (KM) *</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  placeholder="e.g. 61200"
                  value={startOdometer}
                  onChange={e => setStartOdometer(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Start Date & Time</label>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <DatePicker
                      value={startDate}
                      onChange={date => setStartDate(date)}
                    />
                  </div>
                  <input
                    type="text"
                    className="form-input"
                    style={{ width: '110px' }}
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* 5. Fuel */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Fuel Quantity (Litres / KG)</label>
                <input
                  type="number"
                  step="0.5"
                  className="form-input"
                  placeholder="e.g. 35 L"
                  value={fuelLitres}
                  onChange={e => setFuelLitres(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Fuel Refill Cost (₹) *</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  style={{ fontWeight: 600, color: '#ffcc4d' }}
                  placeholder="e.g. 3150"
                  value={fuelCost}
                  onChange={e => setFuelCost(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* 6. FASTag & Driver Bata */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Estimated FASTag Toll (₹)</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  style={{ color: '#38bdf8' }}
                  placeholder="e.g. 650"
                  value={fastagCost}
                  onChange={e => setFastagCost(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Driver Bata / Allowance (₹)</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  placeholder="e.g. 1200"
                  value={driverBata}
                  onChange={e => setDriverBata(e.target.value)}
                />
              </div>
            </div>

            {/* 7. Trip Fare / Revenue */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Customer Trip Fare (₹) *</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent)' }}
                  placeholder="e.g. 14500"
                  value={revenue}
                  onChange={e => setRevenue(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Customer Name & Mobile</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Aman Singhal · 98101xxxxx"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                />
              </div>
            </div>

            {/* Real-time Estimated Profit Banner */}
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
                <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>ESTIMATED EXPENSES</div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-dim)', marginTop: '2px' }}>
                  Fuel: ₹{fuelNum.toLocaleString('en-IN')} · Toll: ₹{fastagNum.toLocaleString('en-IN')} · Driver: ₹{driverNum.toLocaleString('en-IN')}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>ESTIMATED NET PROFIT</div>
                <div style={{ fontSize: '17px', fontWeight: 800, color: estProfit >= 0 ? 'var(--accent)' : 'var(--danger)' }}>
                  ₹{estProfit.toLocaleString('en-IN')}
                  <span style={{ fontSize: '11.5px', fontWeight: 500, marginLeft: '6px' }}>({estMargin})</span>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-action">
              <span>+</span> Dispatch Trip
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
