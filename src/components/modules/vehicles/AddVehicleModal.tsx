import React, { useState, useEffect, useRef } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { Vehicle, VehicleType, VehicleStatus } from '../../../types/fleet';
import { Building2, MapPin } from 'lucide-react';

interface AddVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: VehicleType;
}

const vehicleTypes: VehicleType[] = ['Department', 'Trip-based'];
const fuelTypes: NonNullable<Vehicle['fuelType']>[] = ['Diesel', 'Petrol', 'CNG', 'Electric'];
const vehicleStatuses: VehicleStatus[] = ['Running', 'Active', 'Idle', 'Maintenance'];

const commonDepartments = [
  'Public Works Department (PWD)',
  'Delhi Jal Nigam (DJN)',
  'Directorate of Health Services',
  'Municipal Corporation of Delhi (MCD)',
  'General Administration Dept (GAD)',
  'Transport Department',
  'Irrigation & Flood Control'
];

export const AddVehicleModal: React.FC<AddVehicleModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'Department'
}) => {
  const { drivers, departmentContracts, addVehicle } = useFleet();

  const [registrationNumber, setRegistrationNumber] = useState('');
  const [model, setModel] = useState('Toyota Innova Crysta');
  const [type, setType] = useState<VehicleType>(defaultType);
  const [departmentName, setDepartmentName] = useState('Public Works Department (PWD)');
  const [hubStand, setHubStand] = useState('Delhi NCR Trip Stand');
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
        setDepartmentName(departmentContracts[0]?.departmentName || 'Public Works Department (PWD)');
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

    if (type === 'Department' && !departmentName.trim()) {
      setErrorMsg('Please enter or select Department Name (Gaadi konse department mai lagi hai).');
      return;
    }

    const finalAssignedTo =
      type === 'Department'
        ? departmentName.trim()
        : departmentName.trim() && departmentName !== 'Public Works Department (PWD)'
        ? `${hubStand.trim()} · ${departmentName.trim()}`
        : hubStand.trim();

    addVehicle({
      registrationNumber: cleanReg,
      model: model.trim(),
      type,
      assignedTo: finalAssignedTo,
      departmentName: type === 'Department' ? departmentName.trim() : (departmentName.trim() || undefined),
      status,
      revenue: type === 'Department' ? 85000 : 110000,
      expense: 45000,
      profit: type === 'Department' ? 40000 : 65000,
      meta: type === 'Department' ? `${departmentName} Contract duty` : `Trip · ${hubStand}`,
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
      <div className="modal-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
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

            {/* 1. Fleet Category / Operation Type */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Fleet Category / Operation Type *</label>
              <div className="driver-type-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                {vehicleTypes.map(t => (
                  <div
                    key={t}
                    className={`driver-type-option ${type === t ? 'active' : ''}`}
                    onClick={() => {
                      setType(t);
                      if (t === 'Department' && !departmentName) {
                        setDepartmentName('Public Works Department (PWD)');
                      }
                    }}
                  >
                    {t === 'Department' ? '🏛️ Department Contract' : '🧳 Trip / Rental Fleet'}
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Registration Number & Make / Model */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Registration Number (e.g. DL01AB1234) *</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}
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

            {/* 3. PROMINENT DEPARTMENT NAME: Gaadi Konse Department Mai Lagi Hai */}
            {type === 'Department' ? (
              <div
                style={{
                  background: 'var(--surface-3)',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <label
                  className="form-label"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0, color: 'var(--accent)', fontWeight: 600 }}
                >
                  <Building2 size={15} /> Department Name (Gaadi Konse Department Mai Lagi Hai) *
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{ fontWeight: 600, fontSize: '13.5px' }}
                  placeholder="e.g. Public Works Department (PWD), Delhi Jal Nigam..."
                  value={departmentName}
                  onChange={e => setDepartmentName(e.target.value)}
                  required
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {commonDepartments.map(dept => (
                    <button
                      key={dept}
                      type="button"
                      className="btn-secondary"
                      style={{
                        fontSize: '11px',
                        padding: '3px 8px',
                        background: departmentName === dept ? 'var(--surface-2)' : undefined,
                        borderColor: departmentName === dept ? 'var(--accent)' : undefined,
                        color: departmentName === dept ? 'var(--accent)' : undefined
                      }}
                      onClick={() => setDepartmentName(dept)}
                    >
                      {dept.split('(')[0].trim()}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="form-row-2">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={13} /> Assigned Hub / Trip Stand *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Delhi NCR Trip Stand, Airport Terminal"
                    value={hubStand}
                    onChange={e => setHubStand(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">
                    Attached Department / Corporate Client (Optional)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. PWD Pool or Corporate Client"
                    value={departmentName === 'Public Works Department (PWD)' ? '' : departmentName}
                    onChange={e => setDepartmentName(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* 4. Designated Driver & Fuel Type */}
            <div className="form-row-2">
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
            </div>

            {/* 5. Seating Capacity & Odometer */}
            <div className="form-row-2">
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

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Current Odometer (KM)</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  placeholder="e.g. 35000"
                  value={odometer}
                  onChange={e => setOdometer(e.target.value)}
                />
              </div>
            </div>

            {/* 6. Status & FASTag Balance */}
            <div className="form-row-2">
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

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">FASTag Starting Balance (₹)</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  placeholder="e.g. 2500"
                  value={fastagBalance}
                  onChange={e => setFastagBalance(e.target.value)}
                />
              </div>
            </div>

            {/* 7. GPS IMEI & Insurance Expiry */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">GPS Device IMEI / Telematics ID</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. IMEI-86776347168"
                  value={gpsImei}
                  onChange={e => setGpsImei(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Insurance Expiry Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={insuranceExpiry}
                  onChange={e => setInsuranceExpiry(e.target.value)}
                />
              </div>
            </div>

            {/* 8. Fitness Expiry */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Fitness Certificate Expiry Date</label>
              <input
                type="date"
                className="form-input"
                value={fitnessExpiry}
                onChange={e => setFitnessExpiry(e.target.value)}
              />
            </div>

            {/* 9. Vehicle Photo & RC Proof Upload */}
            <div className="form-row-2">
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
                    <img src={vehiclePhotoPreview} alt="Vehicle" className="upload-preview" />
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
                </div>
              </div>

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
                    <img src={rcPhotoPreview} alt="RC" className="upload-preview" />
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
