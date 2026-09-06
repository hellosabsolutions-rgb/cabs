import React, { useState, useEffect, useRef } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { FuelLogEntry } from '../../../types/fleet';
import { Fuel, Camera, FileText } from 'lucide-react';
import { MinimalVoiceFiller } from '../../common/MinimalVoiceFiller';
import { DatePicker } from '../../common/DatePicker';

interface AddFuelLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedVehicle?: string;
}

export const AddFuelLogModal: React.FC<AddFuelLogModalProps> = ({
  isOpen,
  onClose,
  preselectedVehicle
}) => {
  const { vehicles, drivers, addFuelLog } = useFleet();

  const [vehicle, setVehicle] = useState(preselectedVehicle || vehicles[0]?.registrationNumber || 'DL01AB1234');
  const [driverName, setDriverName] = useState(drivers[0]?.name || 'Rahul Sharma');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(() => {
    const d = new Date();
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  });
  const [odometer, setOdometer] = useState('45400');
  const [fuelType, setFuelType] = useState<FuelLogEntry['fuelType']>('Diesel');
  const [litres, setLitres] = useState('35.0');
  const [ratePerLitre, setRatePerLitre] = useState('89.62');
  const [totalCost, setTotalCost] = useState('3137');
  const [stationName, setStationName] = useState('Indian Oil Corporation (Ring Road)');
  const [paymentMode, setPaymentMode] = useState<FuelLogEntry['paymentMode']>('Fleet Card');
  const [notes, setNotes] = useState('');

  // Photo proofs
  const [meterPhotoName, setMeterPhotoName] = useState('');
  const [meterPhotoPreview, setMeterPhotoPreview] = useState<string | null>(null);

  const [receiptPhotoName, setReceiptPhotoName] = useState('');
  const [receiptPhotoPreview, setReceiptPhotoPreview] = useState<string | null>(null);

  const [errorMsg, setErrorMsg] = useState('');

  const meterInputRef = useRef<HTMLInputElement>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (preselectedVehicle) {
      setVehicle(preselectedVehicle);
    }
  }, [preselectedVehicle]);

  // Recalculate total cost when litres or rate changes
  const handleLitresChange = (val: string) => {
    setLitres(val);
    const l = parseFloat(val);
    const r = parseFloat(ratePerLitre);
    if (!isNaN(l) && !isNaN(r)) {
      setTotalCost(String(Math.round(l * r)));
    }
  };

  const handleRateChange = (val: string) => {
    setRatePerLitre(val);
    const l = parseFloat(litres);
    const r = parseFloat(val);
    if (!isNaN(l) && !isNaN(r)) {
      setTotalCost(String(Math.round(l * r)));
    }
  };

  const handleTotalCostChange = (val: string) => {
    setTotalCost(val);
    const t = parseFloat(val);
    const l = parseFloat(litres);
    if (!isNaN(t) && !isNaN(l) && l > 0) {
      setRatePerLitre((t / l).toFixed(2));
    }
  };

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

  const handleMeterPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMeterPhotoName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMeterPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReceiptPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptPhotoName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!litres || Number(litres) <= 0) {
      setErrorMsg('Please enter valid fuel quantity (litres/kg).');
      return;
    }
    if (!totalCost || Number(totalCost) <= 0) {
      setErrorMsg('Please enter valid fuel expense total amount.');
      return;
    }

    addFuelLog({
      vehicle,
      driverName,
      date,
      time,
      odometer: Number(odometer) || 0,
      fuelType,
      litres: Number(litres),
      ratePerLitre: Number(ratePerLitre) || 0,
      totalCost: Number(totalCost),
      stationName: stationName.trim() || 'Petrol Pump',
      paymentMode,
      meterPhoto: meterPhotoPreview || meterPhotoName || null,
      receiptPhoto: receiptPhotoPreview || receiptPhotoName || null,
      notes: notes.trim() || undefined
    });

    setErrorMsg('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Fuel size={18} color="var(--accent)" /> Add Vehicle Fuel Refill
            </h3>
            <span className="modal-subtitle">Log vehicle, quantity, date/time with pump meter & bill photo proof</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="modal-body">
            {/* Minimal Voice Form Filler */}
            <MinimalVoiceFiller
              formType="expense"
              context={{
                vehicles: vehicles.map(v => v.registrationNumber),
                drivers: drivers.map(d => d.name)
              }}
              placeholder="Speak fuel refill info (e.g. 'DL01AB1234 Rahul Sharma 35 Litre 3150 Rupees Indian Oil')"
              onApplyParsedData={(data) => {
                if (data.vehicle) setVehicle(data.vehicle);
                if (data.driverName) setDriverName(data.driverName);
                if (data.litres) setLitres(data.litres);
                if (data.totalCost || data.amount) setTotalCost(data.totalCost || data.amount);
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

            {/* 1. Vehicle & Driver */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Vehicle *</label>
                <select
                  className="form-input"
                  value={vehicle}
                  onChange={e => setVehicle(e.target.value)}
                  required
                >
                  {vehicles.map(v => (
                    <option key={v.id} value={v.registrationNumber}>
                      {v.registrationNumber} ({v.type} · {v.assignedTo})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Driver In Vehicle</label>
                <select
                  className="form-input"
                  value={driverName}
                  onChange={e => setDriverName(e.target.value)}
                >
                  {drivers.map(d => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 2. Date, Time, Odometer */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Date *</label>
                <DatePicker
                  value={date}
                  onChange={d => setDate(d)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Time of Refill</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="08:45 AM"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Odometer KM at Refill *</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  placeholder="e.g. 45345"
                  value={odometer}
                  onChange={e => setOdometer(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Fuel Type</label>
                <select
                  className="form-input"
                  value={fuelType}
                  onChange={e => setFuelType(e.target.value as FuelLogEntry['fuelType'])}
                >
                  <option value="Diesel">Diesel</option>
                  <option value="Petrol">Petrol</option>
                  <option value="CNG">CNG</option>
                </select>
              </div>
            </div>

            {/* 3. Fuel Quantity, Rate, Total */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ color: 'var(--accent)' }}>
                  Quantity ({fuelType === 'CNG' ? 'Kg' : 'Litres'}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  className="form-input"
                  placeholder="e.g. 35.5"
                  value={litres}
                  onChange={e => handleLitresChange(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Rate / {fuelType === 'CNG' ? 'Kg' : 'Litre'} (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  className="form-input"
                  placeholder="e.g. 89.62"
                  value={ratePerLitre}
                  onChange={e => handleRateChange(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Total Fuel Cost (₹) *</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  style={{ fontWeight: 600, color: 'var(--accent)' }}
                  placeholder="e.g. 3180"
                  value={totalCost}
                  onChange={e => handleTotalCostChange(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Payment Mode</label>
                <select
                  className="form-input"
                  value={paymentMode}
                  onChange={e => setPaymentMode(e.target.value as FuelLogEntry['paymentMode'])}
                >
                  <option value="Fleet Card">Fleet Card / Petro Card</option>
                  <option value="UPI">UPI / GPay / Paytm</option>
                  <option value="Cash">Cash Advance</option>
                  <option value="Company Credit">Company Credit Account</option>
                </select>
              </div>
            </div>

            {/* Station Name */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Petrol Pump / Station Name & Location</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Indian Oil Corporation, Ring Road Flyover Pump"
                value={stationName}
                onChange={e => setStationName(e.target.value)}
              />
            </div>

            {/* 4. PHOTO PROOFS */}
            <div style={{ marginTop: '4px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Camera size={14} color="var(--accent)" /> Fuel Photo Proofs (Meter Reading & Pump Receipt)
              </div>

              <div className="form-row-2">
                {/* Dispenser Meter Reading Photo */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '11px' }}>
                    1. Dispenser Meter Photo Proof
                  </label>
                  <input
                    type="file"
                    ref={meterInputRef}
                    onChange={handleMeterPhotoUpload}
                    accept="image/*,.pdf"
                    style={{ display: 'none' }}
                  />
                  <div
                    className="upload-box"
                    onClick={() => meterInputRef.current?.click()}
                    style={{ padding: '8px 12px' }}
                  >
                    {meterPhotoPreview ? (
                      <img src={meterPhotoPreview} alt="Meter" className="upload-preview" />
                    ) : (
                      <div className="upload-icon-placeholder" style={{ width: 34, height: 34 }}>
                        <Camera size={16} color="var(--accent)" />
                      </div>
                    )}
                    <div className="upload-info">
                      <div className="upload-title" style={{ fontSize: '12px' }}>
                        {meterPhotoName ? meterPhotoName : 'Pump meter photo'}
                      </div>
                      <div className="upload-hint">Shows litres & total ₹</div>
                    </div>
                    {meterPhotoName && (
                      <button
                        type="button"
                        className="modal-close-btn"
                        style={{ width: 22, height: 22, fontSize: 10 }}
                        onClick={e => {
                          e.stopPropagation();
                          setMeterPhotoName('');
                          setMeterPhotoPreview(null);
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Printed Bill / Receipt Photo */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '11px' }}>
                    2. Printed Bill / Receipt Proof
                  </label>
                  <input
                    type="file"
                    ref={receiptInputRef}
                    onChange={handleReceiptPhotoUpload}
                    accept="image/*,.pdf"
                    style={{ display: 'none' }}
                  />
                  <div
                    className="upload-box"
                    onClick={() => receiptInputRef.current?.click()}
                    style={{ padding: '8px 12px' }}
                  >
                    {receiptPhotoPreview ? (
                      <img src={receiptPhotoPreview} alt="Receipt" className="upload-preview" />
                    ) : (
                      <div className="upload-icon-placeholder" style={{ width: 34, height: 34 }}>
                        <FileText size={16} color="var(--accent)" />
                      </div>
                    )}
                    <div className="upload-info">
                      <div className="upload-title" style={{ fontSize: '12px' }}>
                        {receiptPhotoName ? receiptPhotoName : 'Pump bill / receipt'}
                      </div>
                      <div className="upload-hint">Printed receipt proof</div>
                    </div>
                    {receiptPhotoName && (
                      <button
                        type="button"
                        className="modal-close-btn"
                        style={{ width: 22, height: 22, fontSize: 10 }}
                        onClick={e => {
                          e.stopPropagation();
                          setReceiptPhotoName('');
                          setReceiptPhotoPreview(null);
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Notes / Trip Purpose</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Full tank for PWD site inspection"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-action">
              <span>+</span> Save Fuel Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
