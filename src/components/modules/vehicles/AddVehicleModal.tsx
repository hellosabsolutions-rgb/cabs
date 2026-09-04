import React, { useState, useEffect, useRef } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { Vehicle, VehicleType, VehicleStatus } from '../../../types/fleet';
import {
  Building2,
  MapPin,
  Truck,
  Briefcase,
  Upload,
  FileText,
  Loader2,
  Shield,
  Wind,
  FileCheck,
  Award,
  X,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { MinimalVoiceFiller } from '../../common/MinimalVoiceFiller';
import { ParsedVehicleVoiceData } from '../../../utils/vehicleVoiceParser';

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

  // -------------------------------------------------------------
  // 5 Mandatory Compliance Documents: RC, Insurance, Pollution, Permit, Auth
  // -------------------------------------------------------------
  // 1. RC (Registration Certificate)
  const [rcExpiry, setRcExpiry] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 5);
    return d.toISOString().split('T')[0];
  });
  const [rcPhotoName, setRcPhotoName] = useState('');
  const [rcPhotoPreview, setRcPhotoPreview] = useState<string | null>(null);
  const rcInputRef = useRef<HTMLInputElement>(null);

  // 2. Insurance Policy
  const [insuranceExpiry, setInsuranceExpiry] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  });
  const [insurancePhotoName, setInsurancePhotoName] = useState('');
  const [insurancePhotoPreview, setInsurancePhotoPreview] = useState<string | null>(null);
  const insuranceInputRef = useRef<HTMLInputElement>(null);

  // 3. Pollution Under Control (PUCC)
  const [pollutionExpiry, setPollutionExpiry] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().split('T')[0];
  });
  const [pollutionPhotoName, setPollutionPhotoName] = useState('');
  const [pollutionPhotoPreview, setPollutionPhotoPreview] = useState<string | null>(null);
  const pollutionInputRef = useRef<HTMLInputElement>(null);

  // 4. Commercial Permit
  const [permitExpiry, setPermitExpiry] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 5);
    return d.toISOString().split('T')[0];
  });
  const [permitPhotoName, setPermitPhotoName] = useState('');
  const [permitPhotoPreview, setPermitPhotoPreview] = useState<string | null>(null);
  const permitInputRef = useRef<HTMLInputElement>(null);

  // 5. Permit Authorization (Auth)
  const [authExpiry, setAuthExpiry] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  });
  const [authPhotoName, setAuthPhotoName] = useState('');
  const [authPhotoPreview, setAuthPhotoPreview] = useState<string | null>(null);
  const authInputRef = useRef<HTMLInputElement>(null);

  // Vehicle Exterior Photo / Thumbnail
  const [vehiclePhotoName, setVehiclePhotoName] = useState('');
  const [vehiclePhotoPreview, setVehiclePhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [fitnessExpiry, setFitnessExpiry] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 2);
    return d.toISOString().split('T')[0];
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // File upload helper factory
  const handleFileUpload = (
    setName: (name: string) => void,
    setPreview: (preview: string | null) => void
  ) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRcUpload = handleFileUpload(setRcPhotoName, setRcPhotoPreview);
  const handleInsuranceUpload = handleFileUpload(setInsurancePhotoName, setInsurancePhotoPreview);
  const handlePollutionUpload = handleFileUpload(setPollutionPhotoName, setPollutionPhotoPreview);
  const handlePermitUpload = handleFileUpload(setPermitPhotoName, setPermitPhotoPreview);
  const handleAuthUpload = handleFileUpload(setAuthPhotoName, setAuthPhotoPreview);
  const handleVehiclePhotoUpload = handleFileUpload(setVehiclePhotoName, setVehiclePhotoPreview);

  const handleSubmit = async (e: React.FormEvent) => {
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

    setIsSubmitting(true);
    try {
      const res = await addVehicle({
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
        vehiclePhoto: vehiclePhotoPreview || vehiclePhotoName || null,
        // 5 Documents: RC, Insurance, Pollution, Permit, Auth
        rcExpiry,
        rcPhoto: rcPhotoPreview || rcPhotoName || null,
        insuranceExpiry,
        insurancePhoto: insurancePhotoPreview || insurancePhotoName || null,
        pollutionExpiry,
        pollutionPhoto: pollutionPhotoPreview || pollutionPhotoName || null,
        permitExpiry,
        permitPhoto: permitPhotoPreview || permitPhotoName || null,
        authExpiry,
        authPhoto: authPhotoPreview || authPhotoName || null,
        fitnessExpiry
      });

      if (res && !res.success) {
        setErrorMsg(res.error || 'Failed to onboard vehicle to database.');
        return;
      }

      setRegistrationNumber('');
      setErrorMsg('');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during onboarding.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyVoiceData = (data: ParsedVehicleVoiceData) => {
    if (data.registrationNumber) setRegistrationNumber(data.registrationNumber);
    if (data.model) setModel(data.model);
    if (data.type) setType(data.type);
    if (data.departmentName) setDepartmentName(data.departmentName);
    if (data.hubStand) setHubStand(data.hubStand);
    if (data.fuelType) setFuelType(data.fuelType);
    if (data.seatingCapacity) setSeatingCapacity(data.seatingCapacity);
    if (data.assignedDriver) setAssignedDriver(data.assignedDriver);
    if (data.odometer) setOdometer(data.odometer);
    if (data.fastagBalance) setFastagBalance(data.fastagBalance);
    if (data.status) setStatus(data.status);
    if (data.rcExpiry) setRcExpiry(data.rcExpiry);
    if (data.insuranceExpiry) setInsuranceExpiry(data.insuranceExpiry);
    if (data.pollutionExpiry) setPollutionExpiry(data.pollutionExpiry);
    if (data.permitExpiry) setPermitExpiry(data.permitExpiry);
    if (data.authExpiry) setAuthExpiry(data.authExpiry);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 580, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Truck size={18} color="var(--accent)" /> Add New Vehicle to Fleet
            </h3>
            <span className="modal-subtitle">
              Register commercial or department vehicle with specs, driver, FASTag & RC proof
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}
        >
          <div className="modal-body" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            {/* Minimal Voice Form Filler */}
            <MinimalVoiceFiller
              formType="vehicle"
              context={{
                vehicles: [],
                drivers: drivers.map(d => d.name)
              }}
              placeholder="Speak vehicle info (e.g. 'DL01AB1234 Innova Crysta Diesel PWD Rahul Sharma')"
              onApplyParsedData={(data) => handleApplyVoiceData(data as any)}
            />

            {errorMsg && (
              <div
                style={{
                  background: 'var(--danger-bg)',
                  color: 'var(--danger)',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  border: '1px solid rgba(255, 92, 92, 0.3)',
                  marginBottom: '12px'
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
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    {t === 'Department' ? (
                      <>
                        <Building2 size={14} /> Department Contract
                      </>
                    ) : (
                      <>
                        <Briefcase size={14} /> Trip / Rental Fleet
                      </>
                    )}
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

            {/* 7. GPS IMEI & Vehicle Photo */}
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
                <label className="form-label">Vehicle Exterior Photo / Thumbnail</label>
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
                  style={{
                    padding: '4px 10px',
                    height: '38px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    borderColor: vehiclePhotoPreview ? 'var(--accent)' : undefined
                  }}
                >
                  {vehiclePhotoPreview ? (
                    <img
                      src={vehiclePhotoPreview}
                      alt="Vehicle"
                      style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
                    />
                  ) : (
                    <Truck size={14} color="var(--accent)" style={{ flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '11.5px',
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        color: vehiclePhotoName ? 'var(--text)' : 'var(--text-faint)'
                      }}
                    >
                      {vehiclePhotoName || 'Upload vehicle photo'}
                    </div>
                  </div>
                  {vehiclePhotoPreview && (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        setVehiclePhotoName('');
                        setVehiclePhotoPreview(null);
                      }}
                      style={{
                        background: 'rgba(255, 92, 92, 0.1)',
                        border: 'none',
                        color: 'var(--danger)',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        padding: '2px 5px',
                        fontSize: '11px'
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 8. MANDATORY FLEET DOCUMENTS (RC, Insurance, Pollution, Permit, Auth) */}
            <div
              style={{
                marginTop: '16px',
                padding: '16px',
                background: 'var(--surface-3)',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: '14px',
                      color: 'var(--text)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <FileCheck size={17} color="var(--accent)" />
                    5 Mandatory Fleet Documents (Expiry & Photos)
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-faint)', marginTop: '2px' }}>
                    RC, Insurance, Pollution, Permit & Auth (Auto-synced to Live Compliance)
                  </div>
                </div>
                <span className="status-chip active" style={{ fontSize: '10.5px' }}>
                  5 Tracked Docs
                </span>
              </div>

              {/* Doc 1: RC */}
              <div
                style={{
                  background: 'var(--surface-2)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={15} color="#38bdf8" />
                    <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text)' }}>
                      1. Registration Certificate (RC)
                    </span>
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-faint)', textTransform: 'uppercase' }}>
                    RTO Document
                  </span>
                </div>
                <div className="form-row-2" style={{ marginBottom: 0 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '11px', marginBottom: '4px' }}>
                      RC Expiry Date *
                    </label>
                    <input
                      type="date"
                      className="form-input"
                      value={rcExpiry}
                      onChange={e => setRcExpiry(e.target.value)}
                      style={{ fontSize: '12px', height: '38px' }}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '11px', marginBottom: '4px' }}>
                      RC Photo / Scan Copy
                    </label>
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
                      style={{
                        padding: '4px 10px',
                        height: '38px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        borderColor: rcPhotoPreview ? 'var(--accent)' : undefined
                      }}
                    >
                      {rcPhotoPreview ? (
                        <img
                          src={rcPhotoPreview}
                          alt="RC"
                          style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
                        />
                      ) : (
                        <Upload size={14} color="var(--accent)" style={{ flexShrink: 0 }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '11.5px',
                            fontWeight: 500,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            color: rcPhotoName ? 'var(--text)' : 'var(--text-faint)'
                          }}
                        >
                          {rcPhotoName || 'Upload RC scan / photo'}
                        </div>
                      </div>
                      {rcPhotoPreview && (
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            setRcPhotoName('');
                            setRcPhotoPreview(null);
                          }}
                          style={{
                            background: 'rgba(255, 92, 92, 0.1)',
                            border: 'none',
                            color: 'var(--danger)',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            padding: '2px 5px',
                            fontSize: '11px'
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Doc 2: Insurance */}
              <div
                style={{
                  background: 'var(--surface-2)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={15} color="#38bdf8" />
                    <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text)' }}>
                      2. Commercial Insurance Policy
                    </span>
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-faint)', textTransform: 'uppercase' }}>
                    Annual Policy
                  </span>
                </div>
                <div className="form-row-2" style={{ marginBottom: 0 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '11px', marginBottom: '4px' }}>
                      Insurance Expiry Date *
                    </label>
                    <input
                      type="date"
                      className="form-input"
                      value={insuranceExpiry}
                      onChange={e => setInsuranceExpiry(e.target.value)}
                      style={{ fontSize: '12px', height: '38px' }}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '11px', marginBottom: '4px' }}>
                      Insurance Policy Copy / Photo
                    </label>
                    <input
                      type="file"
                      ref={insuranceInputRef}
                      onChange={handleInsuranceUpload}
                      accept="image/*,.pdf"
                      style={{ display: 'none' }}
                    />
                    <div
                      className="upload-box"
                      onClick={() => insuranceInputRef.current?.click()}
                      style={{
                        padding: '4px 10px',
                        height: '38px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        borderColor: insurancePhotoPreview ? 'var(--accent)' : undefined
                      }}
                    >
                      {insurancePhotoPreview ? (
                        <img
                          src={insurancePhotoPreview}
                          alt="Insurance"
                          style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
                        />
                      ) : (
                        <Upload size={14} color="var(--accent)" style={{ flexShrink: 0 }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '11.5px',
                            fontWeight: 500,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            color: insurancePhotoName ? 'var(--text)' : 'var(--text-faint)'
                          }}
                        >
                          {insurancePhotoName || 'Upload insurance copy'}
                        </div>
                      </div>
                      {insurancePhotoPreview && (
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            setInsurancePhotoName('');
                            setInsurancePhotoPreview(null);
                          }}
                          style={{
                            background: 'rgba(255, 92, 92, 0.1)',
                            border: 'none',
                            color: 'var(--danger)',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            padding: '2px 5px',
                            fontSize: '11px'
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Doc 3: Pollution (PUCC) */}
              <div
                style={{
                  background: 'var(--surface-2)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Wind size={15} color="#39ff6e" />
                    <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text)' }}>
                      3. Pollution Under Control (PUCC)
                    </span>
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-faint)', textTransform: 'uppercase' }}>
                    Emissions
                  </span>
                </div>
                <div className="form-row-2" style={{ marginBottom: 0 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '11px', marginBottom: '4px' }}>
                      Pollution Expiry Date *
                    </label>
                    <input
                      type="date"
                      className="form-input"
                      value={pollutionExpiry}
                      onChange={e => setPollutionExpiry(e.target.value)}
                      style={{ fontSize: '12px', height: '38px' }}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '11px', marginBottom: '4px' }}>
                      PUCC Photo / Scan Copy
                    </label>
                    <input
                      type="file"
                      ref={pollutionInputRef}
                      onChange={handlePollutionUpload}
                      accept="image/*,.pdf"
                      style={{ display: 'none' }}
                    />
                    <div
                      className="upload-box"
                      onClick={() => pollutionInputRef.current?.click()}
                      style={{
                        padding: '4px 10px',
                        height: '38px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        borderColor: pollutionPhotoPreview ? 'var(--accent)' : undefined
                      }}
                    >
                      {pollutionPhotoPreview ? (
                        <img
                          src={pollutionPhotoPreview}
                          alt="PUCC"
                          style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
                        />
                      ) : (
                        <Upload size={14} color="var(--accent)" style={{ flexShrink: 0 }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '11.5px',
                            fontWeight: 500,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            color: pollutionPhotoName ? 'var(--text)' : 'var(--text-faint)'
                          }}
                        >
                          {pollutionPhotoName || 'Upload PUCC scan'}
                        </div>
                      </div>
                      {pollutionPhotoPreview && (
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            setPollutionPhotoName('');
                            setPollutionPhotoPreview(null);
                          }}
                          style={{
                            background: 'rgba(255, 92, 92, 0.1)',
                            border: 'none',
                            color: 'var(--danger)',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            padding: '2px 5px',
                            fontSize: '11px'
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Doc 4: Commercial Permit */}
              <div
                style={{
                  background: 'var(--surface-2)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileCheck size={15} color="#ffcc4d" />
                    <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text)' }}>
                      4. Commercial Vehicle Permit
                    </span>
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-faint)', textTransform: 'uppercase' }}>
                    State / AITP
                  </span>
                </div>
                <div className="form-row-2" style={{ marginBottom: 0 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '11px', marginBottom: '4px' }}>
                      Permit Expiry Date *
                    </label>
                    <input
                      type="date"
                      className="form-input"
                      value={permitExpiry}
                      onChange={e => setPermitExpiry(e.target.value)}
                      style={{ fontSize: '12px', height: '38px' }}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '11px', marginBottom: '4px' }}>
                      Permit Certificate Copy / Photo
                    </label>
                    <input
                      type="file"
                      ref={permitInputRef}
                      onChange={handlePermitUpload}
                      accept="image/*,.pdf"
                      style={{ display: 'none' }}
                    />
                    <div
                      className="upload-box"
                      onClick={() => permitInputRef.current?.click()}
                      style={{
                        padding: '4px 10px',
                        height: '38px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        borderColor: permitPhotoPreview ? 'var(--accent)' : undefined
                      }}
                    >
                      {permitPhotoPreview ? (
                        <img
                          src={permitPhotoPreview}
                          alt="Permit"
                          style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
                        />
                      ) : (
                        <Upload size={14} color="var(--accent)" style={{ flexShrink: 0 }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '11.5px',
                            fontWeight: 500,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            color: permitPhotoName ? 'var(--text)' : 'var(--text-faint)'
                          }}
                        >
                          {permitPhotoName || 'Upload permit copy'}
                        </div>
                      </div>
                      {permitPhotoPreview && (
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            setPermitPhotoName('');
                            setPermitPhotoPreview(null);
                          }}
                          style={{
                            background: 'rgba(255, 92, 92, 0.1)',
                            border: 'none',
                            color: 'var(--danger)',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            padding: '2px 5px',
                            fontSize: '11px'
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Doc 5: Permit Authorization (Auth) */}
              <div
                style={{
                  background: 'var(--surface-2)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Award size={15} color="#a78bfa" />
                    <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text)' }}>
                      5. Permit Authorization (Auth)
                    </span>
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-faint)', textTransform: 'uppercase' }}>
                    National / State Auth
                  </span>
                </div>
                <div className="form-row-2" style={{ marginBottom: 0 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '11px', marginBottom: '4px' }}>
                      Auth Expiry Date *
                    </label>
                    <input
                      type="date"
                      className="form-input"
                      value={authExpiry}
                      onChange={e => setAuthExpiry(e.target.value)}
                      style={{ fontSize: '12px', height: '38px' }}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '11px', marginBottom: '4px' }}>
                      Authorization Letter Photo / Scan
                    </label>
                    <input
                      type="file"
                      ref={authInputRef}
                      onChange={handleAuthUpload}
                      accept="image/*,.pdf"
                      style={{ display: 'none' }}
                    />
                    <div
                      className="upload-box"
                      onClick={() => authInputRef.current?.click()}
                      style={{
                        padding: '4px 10px',
                        height: '38px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        borderColor: authPhotoPreview ? 'var(--accent)' : undefined
                      }}
                    >
                      {authPhotoPreview ? (
                        <img
                          src={authPhotoPreview}
                          alt="Auth"
                          style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
                        />
                      ) : (
                        <Upload size={14} color="var(--accent)" style={{ flexShrink: 0 }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '11.5px',
                            fontWeight: 500,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            color: authPhotoName ? 'var(--text)' : 'var(--text-faint)'
                          }}
                        >
                          {authPhotoName || 'Upload auth document'}
                        </div>
                      </div>
                      {authPhotoPreview && (
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            setAuthPhotoName('');
                            setAuthPhotoPreview(null);
                          }}
                          style={{
                            background: 'rgba(255, 92, 92, 0.1)',
                            border: 'none',
                            color: 'var(--danger)',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            padding: '2px 5px',
                            fontSize: '11px'
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary-action"
              disabled={isSubmitting}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="spin-loader" /> Registering...
                </>
              ) : (
                <>
                  <span>+</span> Register Vehicle
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
