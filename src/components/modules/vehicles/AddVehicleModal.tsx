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
  Calendar,
  Sparkles,
  User,
  UserCheck,
  Fuel as FuelIcon,
  Users as UsersIcon,
  Activity
} from 'lucide-react';
import { MinimalVoiceFiller } from '../../common/MinimalVoiceFiller';
import { ParsedVehicleVoiceData } from '../../../utils/vehicleVoiceParser';
import { DatePicker } from '../../common/DatePicker';
import { ACCEPT_DOC_TYPES, isPdfDocument } from '../../../utils/fileUtils';
import { CustomDropdown, CustomDropdownOption } from '../../common/CustomDropdown';
import { VehicleImagePickerModal } from '../../common/VehicleImagePickerModal';
import { processAndCompressFile } from '../../../utils/imageCompressor';

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
  const { drivers, departmentContracts, addVehicle, fetchLiveDrivers, isLoadingDrivers } = useFleet();

  const [registrationNumber, setRegistrationNumber] = useState('');
  const [model, setModel] = useState('');
  const [type, setType] = useState<VehicleType>(defaultType);
  const [departmentName, setDepartmentName] = useState('');
  const [assignedDriver, setAssignedDriver] = useState('Unassigned');
  const [fuelType, setFuelType] = useState<NonNullable<Vehicle['fuelType']>>('Diesel');
  const [seatingCapacity, setSeatingCapacity] = useState('4');
  const [odometer, setOdometer] = useState('');
  const [status, setStatus] = useState<VehicleStatus>('Running');
  const [fastagBalance, setFastagBalance] = useState('');
  const [gpsImei, setGpsImei] = useState(() => `IMEI-86${Math.floor(Math.random() * 900000000 + 100000000)}`);
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);

  // Auto-fetch fresh drivers from backend when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchLiveDrivers();
    }
  }, [isOpen]);

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

  // 3. Pollution Under Control Certificate (PUCC)
  const [pollutionExpiry, setPollutionExpiry] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().split('T')[0];
  });
  const [pollutionPhotoName, setPollutionPhotoName] = useState('');
  const [pollutionPhotoPreview, setPollutionPhotoPreview] = useState<string | null>(null);
  const pollutionInputRef = useRef<HTMLInputElement>(null);

  // 4. Commercial Vehicle Permit
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
  const [roadTaxExpiry, setRoadTaxExpiry] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Open/Close keyboard listener
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

  // File upload helper factory with instant client-side compression (<= 200 KB)
  const handleFileUpload = (
    setName: (name: string) => void,
    setPreview: (preview: string | null) => void
  ) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const res = await processAndCompressFile(file);
        setName(res.name);
        setPreview(res.dataUrl);
      } catch (err) {
        setName(file.name);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
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
      setErrorMsg('Please enter or select Department Name.');
      return;
    }

    const finalAssignedTo =
      type === 'Department'
        ? (departmentName.trim() || 'Department Contract')
        : 'Booking Fleet';

    setIsSubmitting(true);
    try {
      const res = await addVehicle({
        registrationNumber: cleanReg,
        model: model.trim(),
        type,
        assignedTo: finalAssignedTo,
        departmentName: type === 'Department' ? departmentName.trim() : undefined,
        status,
        revenue: 0,
        expense: 0,
        profit: 0,
        meta: type === 'Department' ? (departmentName.trim() ? `${departmentName.trim()} Contract duty` : 'Department cab') : 'Booking / Rental duty',
        fuelType,
        seatingCapacity: Number(seatingCapacity) || 5,
        assignedDriver: (assignedDriver && assignedDriver !== 'Unassigned') ? assignedDriver : undefined,
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
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <h3 className="modal-title">
              <span className="modal-title-icon">
                <Truck size={16} />
              </span>
              Add vehicle
            </h3>
            <span className="modal-subtitle">
              Specs, assignment, FASTag, and RC documents
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose} type="button" aria-label="Close">
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Minimal Voice Form Filler */}
            <MinimalVoiceFiller
              formType="vehicle"
              context={{
                vehicles: [],
                drivers: drivers.map(d => d.name)
              }}
              placeholder="Speak vehicle info (e.g. 'DL01AB1234 Innova Crysta Diesel PWD')"
              onApplyParsedData={(data) => handleApplyVoiceData(data as any)}
            />

            {errorMsg && <div className="form-error">{errorMsg}</div>}

            <div className="form-group">
              <label className="form-label">
                Fleet category <span className="req">*</span>
              </label>
              <div className="driver-type-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                {vehicleTypes.map(t => (
                  <div
                    key={t}
                    className={`driver-type-option ${type === t ? 'active' : ''}`}
                    onClick={() => setType(t)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    {t === 'Department' ? (
                      <>
                        <Building2 size={14} /> Department contract
                      </>
                    ) : (
                      <>
                        <Briefcase size={14} /> Booking / rental
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">
                  Registration number <span className="req">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}
                  placeholder="DL01AB1234"
                  value={registrationNumber}
                  onChange={e => setRegistrationNumber(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Make and model <span className="req">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Toyota Innova Crysta 2.4 VX"
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Department Name (Only if Department Contract) */}
            {type === 'Department' && (
              <div className="form-group">
                <label className="form-label">
                  Department name <span className="req">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Public Works Department (PWD)"
                  value={departmentName}
                  onChange={e => setDepartmentName(e.target.value)}
                  required
                />
                {departmentContracts.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: 8 }}>
                    {Array.from(new Set(departmentContracts.map(c => c.departmentName).filter(Boolean))).map(dept => (
                      <button
                        key={dept}
                        type="button"
                        className="btn-secondary"
                        style={{
                          height: 28,
                          fontSize: 11,
                          padding: '0 10px',
                          background: departmentName === dept ? 'var(--accent-dim)' : undefined,
                          borderColor: departmentName === dept ? 'var(--accent)' : undefined,
                          color: departmentName === dept ? 'var(--accent)' : undefined
                        }}
                        onClick={() => setDepartmentName(dept)}
                      >
                        {dept.split('(')[0].trim()}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Designated driver</span>
                  {isLoadingDrivers && (
                    <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600 }}>Syncing</span>
                  )}
                </label>
                <CustomDropdown
                  value={assignedDriver}
                  onChange={val => setAssignedDriver(val)}
                  onOpen={() => fetchLiveDrivers()}
                  isLoading={isLoadingDrivers}
                  searchable={true}
                  placeholder="Select Driver..."
                  options={[
                    {
                      value: 'Unassigned',
                      label: 'Unassigned (Pool Vehicle)',
                      sublabel: 'No driver assigned',
                      icon: <UserCheck size={14} style={{ color: 'var(--accent, #38bdf8)' }} />
                    },
                    ...drivers.map(d => ({
                      value: d.name,
                      label: d.name,
                      sublabel: d.driverType || (d.assignedVehicle ? `Vehicle: ${d.assignedVehicle}` : 'Active Driver'),
                      icon: <User size={14} style={{ color: 'var(--text-faint)' }} />
                    }))
                  ]}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Fuel type</label>
                <CustomDropdown
                  value={fuelType}
                  onChange={val => setFuelType(val as NonNullable<Vehicle['fuelType']>)}
                  options={[
                    { value: 'Diesel', label: 'Diesel', icon: <FuelIcon size={14} style={{ color: '#f59e0b' }} /> },
                    { value: 'Petrol', label: 'Petrol', icon: <FuelIcon size={14} style={{ color: '#ef4444' }} /> },
                    { value: 'CNG', label: 'CNG (Clean Gas)', icon: <FuelIcon size={14} style={{ color: '#10b981' }} /> },
                    { value: 'Electric', label: 'Electric (EV)', icon: <Sparkles size={14} style={{ color: '#38bdf8' }} /> }
                  ]}
                />
              </div>
            </div>

            {/* 4. Seating Capacity & Odometer */}
            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Seating capacity</label>
                <CustomDropdown
                  value={seatingCapacity}
                  onChange={val => setSeatingCapacity(val)}
                  options={[
                    { value: '4', label: '4 Seater (Hatchback)', icon: <UsersIcon size={14} /> },
                    { value: '5', label: '5 Seater (Sedan / Compact SUV)', icon: <UsersIcon size={14} /> },
                    { value: '7', label: '7 Seater (Innova / Ertiga / MPV)', icon: <UsersIcon size={14} /> },
                    { value: '8', label: '8 Seater (MUV)', icon: <UsersIcon size={14} /> },
                    { value: '12', label: '12+ Seater (Tempo Traveller / Van)', icon: <UsersIcon size={14} /> }
                  ]}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Current odometer (km)</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  placeholder="35000"
                  value={odometer}
                  onChange={e => setOdometer(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Vehicle status</label>
                <CustomDropdown
                  value={status}
                  onChange={val => setStatus(val as VehicleStatus)}
                  options={[
                    { value: 'Running', label: 'Running (On Road)', badge: 'Active', badgeColor: '#10b981', icon: <Activity size={14} style={{ color: '#10b981' }} /> },
                    { value: 'Active', label: 'Active (Available)', badge: 'Ready', badgeColor: '#38bdf8', icon: <Activity size={14} style={{ color: '#38bdf8' }} /> },
                    { value: 'Idle', label: 'Idle (Standby)', badge: 'Parked', badgeColor: '#f59e0b', icon: <Activity size={14} style={{ color: '#f59e0b' }} /> },
                    { value: 'Maintenance', label: 'Maintenance (Garage)', badge: 'Service', badgeColor: '#ef4444', icon: <Activity size={14} style={{ color: '#ef4444' }} /> }
                  ]}
                />
              </div>

              <div className="form-group">
                <label className="form-label">FASTag starting balance (₹)</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  placeholder="2500"
                  value={fastagBalance}
                  onChange={e => setFastagBalance(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">GPS IMEI</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="IMEI-86776347168"
                  value={gpsImei}
                  onChange={e => setGpsImei(e.target.value)}
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                  <label className="form-label" style={{ margin: 0 }}>Vehicle photo</label>
                  <button
                    type="button"
                    data-no-modal-close="true"
                    onClick={() => setIsImagePickerOpen(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent)',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: 0
                    }}
                  >
                    <Sparkles size={12} /> Library
                  </button>
                </div>
                <input
                  type="file"
                  ref={photoInputRef}
                  onChange={handleVehiclePhotoUpload}
                  accept="image/*,.pdf,application/pdf"
                  onClick={e => { (e.target as HTMLInputElement).value = ''; }}
                  style={{ display: 'none' }}
                />
                <div
                  className="upload-box"
                  onClick={() => setIsImagePickerOpen(true)}
                  style={{ borderColor: vehiclePhotoPreview ? 'var(--accent)' : undefined }}
                >
                  {vehiclePhotoPreview ? (
                    isPdfDocument(vehiclePhotoName, vehiclePhotoPreview) ? (
                      <div style={{ width: 28, height: 28, borderRadius: 4, background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FileText size={16} />
                      </div>
                    ) : (
                      <img
                        src={vehiclePhotoPreview}
                        alt="Vehicle"
                        style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
                      />
                    )
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
                        color: vehiclePhotoName || vehiclePhotoPreview ? 'var(--text)' : 'var(--text-faint)'
                      }}
                    >
                      {vehiclePhotoName || (vehiclePhotoPreview ? 'Vehicle Photo Attached' : 'Pick from library or upload photo')}
                    </div>
                  </div>
                  {vehiclePhotoPreview && (
                    <button
                      type="button"
                      data-no-modal-close="true"
                      onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        setVehiclePhotoName('');
                        setVehiclePhotoPreview(null);
                        if (photoInputRef.current) photoInputRef.current.value = '';
                      }}
                      style={{
                        background: 'rgba(255, 92, 92, 0.15)',
                        border: 'none',
                        color: 'var(--danger, #ef4444)',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        padding: '2px 5px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Remove vehicle photo"
                    >
                      <X size={12} />
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
                    <DatePicker
                      value={rcExpiry}
                      onChange={d => setRcExpiry(d)}
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
                      accept={ACCEPT_DOC_TYPES}
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
                        isPdfDocument(rcPhotoName, rcPhotoPreview) ? (
                          <div style={{ width: 28, height: 28, borderRadius: 4, background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <FileText size={16} />
                          </div>
                        ) : (
                          <img
                            src={rcPhotoPreview}
                            alt="RC"
                            style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
                          />
                        )
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
                          data-no-modal-close="true"
                          onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            setRcPhotoName('');
                            setRcPhotoPreview(null);
                            if (rcInputRef.current) rcInputRef.current.value = '';
                          }}
                          style={{
                            background: 'rgba(255, 92, 92, 0.15)',
                            border: 'none',
                            color: 'var(--danger, #ef4444)',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            padding: '2px 5px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Remove RC scan"
                        >
                          <X size={12} />
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
                    <DatePicker
                      value={insuranceExpiry}
                      onChange={d => setInsuranceExpiry(d)}
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
                      accept={ACCEPT_DOC_TYPES}
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
                        isPdfDocument(insurancePhotoName, insurancePhotoPreview) ? (
                          <div style={{ width: 28, height: 28, borderRadius: 4, background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <FileText size={16} />
                          </div>
                        ) : (
                          <img
                            src={insurancePhotoPreview}
                            alt="Insurance"
                            style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
                          />
                        )
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
                          data-no-modal-close="true"
                          onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            setInsurancePhotoName('');
                            setInsurancePhotoPreview(null);
                            if (insuranceInputRef.current) insuranceInputRef.current.value = '';
                          }}
                          style={{
                            background: 'rgba(255, 92, 92, 0.15)',
                            border: 'none',
                            color: 'var(--danger, #ef4444)',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            padding: '2px 5px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Remove insurance copy"
                        >
                          <X size={12} />
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
                    <Wind size={15} color="var(--success)" />
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
                    <DatePicker
                      value={pollutionExpiry}
                      onChange={d => setPollutionExpiry(d)}
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
                      accept={ACCEPT_DOC_TYPES}
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
                        isPdfDocument(pollutionPhotoName, pollutionPhotoPreview) ? (
                          <div style={{ width: 28, height: 28, borderRadius: 4, background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <FileText size={16} />
                          </div>
                        ) : (
                          <img
                            src={pollutionPhotoPreview}
                            alt="PUCC"
                            style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
                          />
                        )
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
                          data-no-modal-close="true"
                          onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            setPollutionPhotoName('');
                            setPollutionPhotoPreview(null);
                            if (pollutionInputRef.current) pollutionInputRef.current.value = '';
                          }}
                          style={{
                            background: 'rgba(255, 92, 92, 0.15)',
                            border: 'none',
                            color: 'var(--danger, #ef4444)',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            padding: '2px 5px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Remove PUCC scan"
                        >
                          <X size={12} />
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
                    <DatePicker
                      value={permitExpiry}
                      onChange={d => setPermitExpiry(d)}
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
                      accept={ACCEPT_DOC_TYPES}
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
                        isPdfDocument(permitPhotoName, permitPhotoPreview) ? (
                          <div style={{ width: 28, height: 28, borderRadius: 4, background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <FileText size={16} />
                          </div>
                        ) : (
                          <img
                            src={permitPhotoPreview}
                            alt="Permit"
                            style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
                          />
                        )
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
                          data-no-modal-close="true"
                          onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            setPermitPhotoName('');
                            setPermitPhotoPreview(null);
                            if (permitInputRef.current) permitInputRef.current.value = '';
                          }}
                          style={{
                            background: 'rgba(255, 92, 92, 0.15)',
                            border: 'none',
                            color: 'var(--danger, #ef4444)',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            padding: '2px 5px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Remove permit copy"
                        >
                          <X size={12} />
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
                    <DatePicker
                      value={authExpiry}
                      onChange={d => setAuthExpiry(d)}
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
                      accept={ACCEPT_DOC_TYPES}
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
                        isPdfDocument(authPhotoName, authPhotoPreview) ? (
                          <div style={{ width: 28, height: 28, borderRadius: 4, background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <FileText size={16} />
                          </div>
                        ) : (
                          <img
                            src={authPhotoPreview}
                            alt="Auth"
                            style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
                          />
                        )
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
                          data-no-modal-close="true"
                          onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            setAuthPhotoName('');
                            setAuthPhotoPreview(null);
                            if (authInputRef.current) authInputRef.current.value = '';
                          }}
                          style={{
                            background: 'rgba(255, 92, 92, 0.15)',
                            border: 'none',
                            color: 'var(--danger, #ef4444)',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            padding: '2px 5px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Remove auth document"
                        >
                          <X size={12} />
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
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="spin-loader" /> Saving
                </>
              ) : (
                'Register vehicle'
              )}
            </button>
          </div>
        </form>
      </div>

      <VehicleImagePickerModal
        isOpen={isImagePickerOpen}
        onClose={() => setIsImagePickerOpen(false)}
        currentImage={vehiclePhotoPreview}
        suggestedModel={model}
        onSelectImage={(imgUrl, name) => {
          setVehiclePhotoPreview(imgUrl);
          setVehiclePhotoName(name || 'Vehicle Photo');
        }}
      />
    </div>
  );
};
