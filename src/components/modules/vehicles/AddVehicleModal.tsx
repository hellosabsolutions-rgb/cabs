import React, { useState, useEffect, useRef } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { Vehicle, VehicleType, VehicleStatus } from '../../../types/fleet';

interface AddVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: VehicleType;
}

const vehicleTypes: VehicleType[] = ['Department', 'Trip-based'];
const fuelTypes: NonNullable<Vehicle['fuelType']>[] = ['Diesel', 'Petrol', 'CNG', 'Electric'];
const vehicleStatuses: VehicleStatus[] = ['Running', 'Active', 'Idle', 'Maintenance'];

export const AddVehicleModal: React.FC<AddVehicleModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'Department'
}) => {
  const { drivers, departmentContracts, addVehicle } = useFleet();

  const [registrationNumber, setRegistrationNumber] = useState('');
  const [model, setModel] = useState('Toyota Innova Crysta');
  const [type, setType] = useState<VehicleType>(defaultType);
  const [assignedTo, setAssignedTo] = useState('Public Works Department (PWD)');
  const [assignedDriver, setAssignedDriver] = useState(drivers[0]?.name || 'Rahul Sharma');
  const [fuelType, setFuelType] = useState<NonNullable<Vehicle['fuelType']>>('Diesel');
  const [seatingCapacity, setSeatingCapacity] = useState('7');
  const [odometer, setOdometer] = useState('35000');
  const [status, setStatus] = useState<VehicleStatus>('Running');
  const [fastagBalance, setFastagBalance] = useState('2500');
  const [gpsImei, setGpsImei] = useState(() => `IMEI-86${Math.floor(Math.random() * 900000000 + 100000000)}`);
  const [insuranceExpiry, setInsuranceExpiry] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  });
  const [fitnessExpiry, setFitnessExpiry] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 2);
    return d.toISOString().split('T')[0];
  });

  // RC & Vehicle Photo Upload
  const [rcPhotoName, setRcPhotoName] = useState('');
  const [rcPhotoPreview, setRcPhotoPreview] = useState<string | null>(null);

  const [vehiclePhotoName, setVehiclePhotoName] = useState('');
  const [vehiclePhotoPreview, setVehiclePhotoPreview] = useState<string | null>(null);

  const [errorMsg, setErrorMsg] = useState('');

  const rcInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (defaultType) {
      setType(defaultType);
      if (defaultType === 'Department') {
        setAssignedTo(departmentContracts[0]?.departmentName || 'Public Works Department (PWD)');
      } else {
        setAssignedTo('Delhi NCR Trip Stand');
      }
    }
  }, [defaultType, departmentContracts]);

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

  const handleRcUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRcPhotoName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setRcPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVehiclePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVehiclePhotoName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setVehiclePhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanReg = registrationNumber.trim().toUpperCase().replace(/\s+/g, '');
    if (!cleanReg) {
      setErrorMsg('Please enter vehicle registration number (e.g. DL01AB1234).');
      return;
    }

    addVehicle({
      registrationNumber: cleanReg,
      model: model.trim(),
      type,
      assignedTo: assignedTo.trim() || (type === 'Department' ? 'PWD' : '—'),
      status,
      revenue: type === 'Department' ? 85000 : 110000,
      expense: 45000,
      profit: type === 'Department' ? 40000 : 65000,
      meta: type === 'Department' ? `${assignedTo} Department duty` : `Trip · ${assignedTo}`,
      fuelType,
      seatingCapacity: Number(seatingCapacity) || 5,
      assignedDriver: assignedDriver !== 'Unassigned' ? assignedDriver : undefined,
      odometer: Number(odometer) || 0,
      fastagBalance: Number(fastagBalance) || 0,
      gpsImei: gpsImei.trim(),
      rcPhoto: rcPhotoPreview || rcPhotoName || null,
      insuranceExpiry,
      fitnessExpiry
    });

    setRegistrationNumber('');
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <h3 className="modal-title">
              <span>🚚</span> Add New Vehicle to Fleet
            </h3>
            <span className="modal-subtitle">
              Register commercial or department vehicle with specs, driver, FASTag & RC proof
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

            {/* Vehicle Type Selector */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Fleet Category / Operation Type *</label>
              <div className="driver-type-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                {vehicleTypes.map(t => (
                  <div
                    key={t}
                    className={`driver-type-option ${type === t ? 'active' : ''}`}
                    onClick={() => {
                      setType(t);
                      if (t === 'Department') {
                        setAssignedTo('Public Works Department (PWD)');
                      } else {
                        setAssignedTo('Delhi NCR Trip Stand');
                      }
                    }}
                  >
                    {t === 'Department' ? '🏛️ Department Contract' : '🧳 Trip / Rental Fleet'}
                  </div>
                ))}
              </div>
            </div>

            {/* Registration Number & Vehicle Model */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Registration Number (e.g. DL01AB1234) *</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}
                  placeholder="DL01AB1234"
                  value={registrationNumber}
                  onChange={e => setRegistrationNumber(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Vehicle Make & Model *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Toyota Innova Crysta 2.4 VX"
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Assigned To / Client & Designated Driver */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  {type === 'Department' ? 'Assigned Department *' : 'Assigned Hub / Trip Stand'}
                </label>
                {type === 'Department' ? (
                  <select
                    className="form-input"
                    value={assignedTo}
                    onChange={e => setAssignedTo(e.target.value)}
                  >
                    {departmentContracts.map(c => (
                      <option key={c.id} value={c.departmentName}>
                        {c.departmentName}
                      </option>
                    ))}
                    <option value="Delhi Jal Nigam (DJN)">Delhi Jal Nigam (DJN)</option>
                    <option value="Directorate of Health Services">Directorate of Health Services</option>
                    <option value="General Administration Dept">General Administration Dept</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Delhi NCR, Airport Stand, Outstation"
                    value={assignedTo}
                    onChange={e => setAssignedTo(e.target.value)}
                  />
                )}
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Designated Driver</label>
                <select
                  className="form-input"
                  value={assignedDriver}
                  onChange={e => setAssignedDriver(e.target.value)}
                >
                  <option value="Unassigned">Unassigned (Pool Vehicle)</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.name}>
                      {d.name} ({d.driverType || 'Driver'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Fuel Type & Seating Capacity */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Fuel Type</label>
                <select
                  className="form-input"
                  value={fuelType}
                  onChange={e => setFuelType(e.target.value as NonNullable<Vehicle['fuelType']>)}
                >
                  {fuelTypes.map(f => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Seating Capacity</label>
                <select
                  className="form-input"
                  value={seatingCapacity}
                  onChange={e => setSeatingCapacity(e.target.value)}
                >
                  <option value="4">4 Seater (Hatchback)</option>
                  <option value="5">5 Seater (Sedan / Compact SUV)</option>
                  <option value="7">7 Seater (Innova / Ertiga / MPV)</option>
                  <option value="8">8 Seater (MUV)</option>
                  <option value="12">12+ Seater (Tempo Traveller)</option>
                </select>
              </div>
            </div>

            {/* Current Odometer & Initial Status */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Current Odometer (KM)</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  placeholder="e.g. 42000"
                  value={odometer}
                  onChange={e => setOdometer(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Current Vehicle Status</label>
                <select
                  className="form-input"
                  value={status}
                  onChange={e => setStatus(e.target.value as VehicleStatus)}
                >
                  {vehicleStatuses.map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* FASTag Balance & GPS IMEI */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">FASTag Balance (₹)</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  placeholder="e.g. 2500"
                  value={fastagBalance}
                  onChange={e => setFastagBalance(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">GPS Device IMEI / Telematics ID</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. IMEI-868291039821"
                  value={gpsImei}
                  onChange={e => setGpsImei(e.target.value)}
                />
              </div>
            </div>

            {/* Insurance & Fitness Validity */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Insurance Expiry Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={insuranceExpiry}
                  onChange={e => setInsuranceExpiry(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Fitness Certificate Expiry</label>
                <input
                  type="date"
                  className="form-input"
                  value={fitnessExpiry}
                  onChange={e => setFitnessExpiry(e.target.value)}
                />
              </div>
            </div>

            {/* Document Uploads: Vehicle Photo & RC Certificate */}
            <div className="form-row-2">
              {/* Vehicle Photo */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Vehicle Photo / Thumbnail</label>
                <input
                  type="file"
                  ref={photoInputRef}
                  onChange={handleVehiclePhotoUpload}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                <div
                  className="upload-box"
                  onClick={() => photoInputRef.current?.click()}
                  style={{ padding: '8px 12px' }}
                >
                  {vehiclePhotoPreview ? (
                    <img src={vehiclePhotoPreview} alt="Vehicle preview" className="upload-preview" />
                  ) : (
                    <div className="upload-icon-placeholder" style={{ width: 34, height: 34, fontSize: 16 }}>
                      🚗
                    </div>
                  )}
                  <div className="upload-info">
                    <div className="upload-title" style={{ fontSize: '12px' }}>
                      {vehiclePhotoName ? vehiclePhotoName : 'Upload vehicle photo'}
                    </div>
                    <div className="upload-hint">Image preview</div>
                  </div>
                  {vehiclePhotoName && (
                    <button
                      type="button"
                      className="modal-close-btn"
                      style={{ width: 22, height: 22, fontSize: 10 }}
                      onClick={e => {
                        e.stopPropagation();
                        setVehiclePhotoName('');
                        setVehiclePhotoPreview(null);
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* RC Upload */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Registration Certificate (RC) Copy</label>
                <input
                  type="file"
                  ref={rcInputRef}
                  onChange={handleRcUpload}
                  accept="image/*,.pdf"
                  style={{ display: 'none' }}
                />
                <div
                  className="upload-box"
                  onClick={() => rcInputRef.current?.click()}
                  style={{ padding: '8px 12px' }}
                >
                  {rcPhotoPreview ? (
                    <img src={rcPhotoPreview} alt="RC preview" className="upload-preview" />
                  ) : (
                    <div className="upload-icon-placeholder" style={{ width: 34, height: 34, fontSize: 16 }}>
                      📄
                    </div>
                  )}
                  <div className="upload-info">
                    <div className="upload-title" style={{ fontSize: '12px' }}>
                      {rcPhotoName ? rcPhotoName : 'Upload RC scan copy'}
                    </div>
                    <div className="upload-hint">PDF or image</div>
                  </div>
                  {rcPhotoName && (
                    <button
                      type="button"
                      className="modal-close-btn"
                      style={{ width: 22, height: 22, fontSize: 10 }}
                      onClick={e => {
                        e.stopPropagation();
                        setRcPhotoName('');
                        setRcPhotoPreview(null);
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-action">
              <span>+</span> Register Vehicle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
