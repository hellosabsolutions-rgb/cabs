import React, { useState, useEffect, useRef } from 'react';
import { useFleet } from '../../../context/FleetContext';

interface AddDutyLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddDutyLogModal: React.FC<AddDutyLogModalProps> = ({ isOpen, onClose }) => {
  const { departmentContracts, drivers, addDailyDutyLog } = useFleet();

  const [dutySlipNumber, setDutySlipNumber] = useState(
    () => `SLIP-${Math.floor(Math.random() * 9000 + 1000)}`
  );
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedContractId, setSelectedContractId] = useState(departmentContracts[0]?.id || '');
  const [driverName, setDriverName] = useState(drivers[0]?.name || 'Rahul Sharma');
  const [startKm, setStartKm] = useState('45345');
  const [endKm, setEndKm] = useState('45470');
  const [startTime, setStartTime] = useState('08:30 AM');
  const [endTime, setEndTime] = useState('06:30 PM');
  const [totalHours, setTotalHours] = useState('10.0');
  const [tollParkingAmount, setTollParkingAmount] = useState('0');
  
  // Fuel expense fields
  const [fuelAmount, setFuelAmount] = useState('');
  const [fuelLitres, setFuelLitres] = useState('');
  const [fuelBillName, setFuelBillName] = useState('');
  const [fuelBillPreview, setFuelBillPreview] = useState<string | null>(null);

  const [officerName, setOfficerName] = useState('');
  const [notes, setNotes] = useState('');
  const [slipPhotoName, setSlipPhotoName] = useState('');
  const [slipPhotoPreview, setSlipPhotoPreview] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const photoInputRef = useRef<HTMLInputElement>(null);
  const fuelInputRef = useRef<HTMLInputElement>(null);

  const selectedContract = departmentContracts.find(c => c.id === selectedContractId) || departmentContracts[0];

  useEffect(() => {
    if (departmentContracts.length > 0 && !selectedContractId) {
      setSelectedContractId(departmentContracts[0].id);
      if (departmentContracts[0].driverName) {
        setDriverName(departmentContracts[0].driverName);
      }
    }
  }, [departmentContracts, selectedContractId]);

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

  const handleContractChange = (id: string) => {
    setSelectedContractId(id);
    const c = departmentContracts.find(item => item.id === id);
    if (c && c.driverName) {
      setDriverName(c.driverName);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSlipPhotoName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSlipPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFuelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFuelBillName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFuelBillPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const calcTotalKm = Math.max(0, (Number(endKm) || 0) - (Number(startKm) || 0));
  const calcExtraKm = Math.max(0, calcTotalKm - 100); // 100 km daily benchmark

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(endKm) < Number(startKm)) {
      setErrorMsg('End KM reading cannot be less than Start KM reading.');
      return;
    }

    addDailyDutyLog({
      dutySlipNumber: dutySlipNumber.trim(),
      date,
      departmentName: selectedContract?.departmentName || 'Public Works Department (PWD)',
      vehicle: selectedContract?.vehicle || 'DL01AB1234',
      driverName,
      startKm: Number(startKm) || 0,
      endKm: Number(endKm) || 0,
      totalKm: calcTotalKm,
      extraKm: calcExtraKm,
      startTime,
      endTime,
      totalHours: Number(totalHours) || 10,
      extraHours: Math.max(0, (Number(totalHours) || 10) - 10),
      tollParkingAmount: Number(tollParkingAmount) || 0,
      fuelAmount: fuelAmount ? Number(fuelAmount) : undefined,
      fuelLitres: fuelLitres ? Number(fuelLitres) : undefined,
      officerName: officerName.trim() || undefined,
      dutySlipPhoto: slipPhotoPreview || slipPhotoName || null,
      fuelBillPhoto: fuelBillPreview || fuelBillName || null,
      status: 'Approved',
      notes: notes.trim() || undefined
    });

    setNotes('');
    setFuelAmount('');
    setFuelLitres('');
    setFuelBillName('');
    setFuelBillPreview(null);
    setSlipPhotoName('');
    setSlipPhotoPreview(null);
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <h3 className="modal-title">
              <span>📋</span> Log Daily Duty Slip
            </h3>
            <span className="modal-subtitle">Record official department vehicle running, KM & hours</span>
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

            {/* Department Contract & Slip No */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Department Contract *</label>
                <select
                  className="form-input"
                  value={selectedContractId}
                  onChange={e => handleContractChange(e.target.value)}
                  required
                >
                  {departmentContracts.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.departmentName} ({c.vehicle})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Duty Slip No. *</label>
                <input
                  type="text"
                  className="form-input"
                  value={dutySlipNumber}
                  onChange={e => setDutySlipNumber(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Date & Driver */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Duty Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Driver On Duty</label>
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

            {/* Odometer Readings: Start & End KM */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Start Odometer KM *</label>
                <input
                  type="number"
                  className="form-input"
                  value={startKm}
                  onChange={e => setStartKm(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">End Odometer KM *</label>
                <input
                  type="number"
                  className="form-input"
                  value={endKm}
                  onChange={e => setEndKm(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Calculated Running & Fuel summary */}
            <div
              style={{
                background: 'var(--surface-2)',
                padding: '8px 12px',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '12px',
                border: '1px solid var(--border)'
              }}
            >
              <span>Total Distance: <b style={{ color: 'var(--accent)' }}>{calcTotalKm} km</b></span>
              <span>Extra KM: <b>{calcExtraKm} km</b></span>
              <span>Fuel Added: <b style={{ color: fuelAmount && Number(fuelAmount) > 0 ? 'var(--warning)' : 'var(--text-dim)' }}>
                {fuelAmount ? `₹${Number(fuelAmount).toLocaleString('en-IN')}` : '₹0'}
              </b></span>
            </div>

            {/* Timings & Total Hours */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Start Time</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="08:30 AM"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">End Time</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="06:30 PM"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                />
              </div>
            </div>

            {/* Total Hours & Toll/Parking */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Total Hours</label>
                <input
                  type="number"
                  step="0.5"
                  className="form-input"
                  value={totalHours}
                  onChange={e => setTotalHours(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Toll / Parking Paid (₹)</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  placeholder="0"
                  value={tollParkingAmount}
                  onChange={e => setTollParkingAmount(e.target.value)}
                />
              </div>
            </div>

            {/* Fuel Expense & Fuel Quantity */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span>⛽</span> Fuel Expense (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  placeholder="e.g. 2500"
                  value={fuelAmount}
                  onChange={e => setFuelAmount(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Fuel Quantity (Litres / CNG Kg)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  className="form-input"
                  placeholder="e.g. 26.5"
                  value={fuelLitres}
                  onChange={e => setFuelLitres(e.target.value)}
                />
              </div>
            </div>

            {/* Officer Name & Route Details */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Officer / Authorized User</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Er. Singhal (Exec Engineer)"
                  value={officerName}
                  onChange={e => setOfficerName(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Route / Locations Visited</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. ITO, Connaught Place, Ring Road site"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Duty Slip Scan / Signature */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Duty Slip Photo / Signed Sheet</label>
              <input
                type="file"
                ref={photoInputRef}
                onChange={handlePhotoUpload}
                accept="image/*,.pdf"
                style={{ display: 'none' }}
              />
              <div className="upload-box" onClick={() => photoInputRef.current?.click()}>
                {slipPhotoPreview ? (
                  <img src={slipPhotoPreview} alt="Slip preview" className="upload-preview" />
                ) : (
                  <div className="upload-icon-placeholder">📑</div>
                )}
                <div className="upload-info">
                  <div className="upload-title">
                    {slipPhotoName ? slipPhotoName : 'Click to attach signed duty slip scan'}
                  </div>
                  <div className="upload-hint">Upload officer signed physical slip</div>
                </div>
                {(slipPhotoPreview || slipPhotoName) && (
                  <button
                    type="button"
                    className="modal-close-btn"
                    style={{ width: 26, height: 26, fontSize: 11 }}
                    onClick={e => {
                      e.stopPropagation();
                      setSlipPhotoName('');
                      setSlipPhotoPreview(null);
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Fuel Bill / Receipt Upload */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Fuel Bill / Petrol Pump Receipt (Optional)</label>
              <input
                type="file"
                ref={fuelInputRef}
                onChange={handleFuelUpload}
                accept="image/*,.pdf"
                style={{ display: 'none' }}
              />
              <div className="upload-box" onClick={() => fuelInputRef.current?.click()}>
                {fuelBillPreview ? (
                  <img src={fuelBillPreview} alt="Fuel receipt preview" className="upload-preview" />
                ) : (
                  <div className="upload-icon-placeholder">⛽</div>
                )}
                <div className="upload-info">
                  <div className="upload-title">
                    {fuelBillName ? fuelBillName : 'Click to attach petrol pump invoice / receipt'}
                  </div>
                  <div className="upload-hint">Upload fuel pump printed bill or image</div>
                </div>
                {(fuelBillPreview || fuelBillName) && (
                  <button
                    type="button"
                    className="modal-close-btn"
                    style={{ width: 26, height: 26, fontSize: 11 }}
                    onClick={e => {
                      e.stopPropagation();
                      setFuelBillName('');
                      setFuelBillPreview(null);
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-action">
              <span>+</span> Record Duty Slip
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
