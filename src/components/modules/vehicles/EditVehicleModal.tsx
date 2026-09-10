import React, { useState, useRef, useEffect } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { Vehicle, VehicleStatus, VehicleType } from '../../../types/fleet';
import {
  Building2,
  Briefcase,
  FileText,
  Shield,
  Wind,
  FileCheck,
  Award,
  Truck,
  Check,
  AlertCircle,
  Edit2,
  Calendar,
  X,
  CreditCard
} from 'lucide-react';
import { DatePicker } from '../../common/DatePicker';
import { ACCEPT_DOC_TYPES, isPdfDocument } from '../../../utils/fileUtils';

interface EditVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
}

const commonDepartments = [
  'Public Works Department (PWD)',
  'Delhi Jal Nigam (DJN)',
  'Delhi Development Authority (DDA)',
  'Department of Health & Family Welfare',
  'Transport Department (GNCTD)',
  'Power & Energy Department'
];

const vehicleStatuses: VehicleStatus[] = ['Running', 'Idle', 'Maintenance'];
const fuelTypes: NonNullable<Vehicle['fuelType']>[] = ['Diesel', 'Petrol', 'CNG', 'Electric'];

export const EditVehicleModal: React.FC<EditVehicleModalProps> = ({
  isOpen,
  onClose,
  vehicle
}) => {
  const { drivers, updateVehicle } = useFleet();

  const [registrationNumber, setRegistrationNumber] = useState('');
  const [model, setModel] = useState('');
  const [type, setType] = useState<VehicleType>('Trip-based');
  const [departmentName, setDepartmentName] = useState('');
  const [assignedDriver, setAssignedDriver] = useState('');
  const [fuelType, setFuelType] = useState<NonNullable<Vehicle['fuelType']>>('Diesel');
  const [seatingCapacity, setSeatingCapacity] = useState('5');
  const [odometer, setOdometer] = useState('');
  const [status, setStatus] = useState<VehicleStatus>('Running');
  const [fastagBalance, setFastagBalance] = useState('');
  const [fastagTagId, setFastagTagId] = useState('');
  const [fastagBank, setFastagBank] = useState('');
  const [gpsImei, setGpsImei] = useState('');

  // 5 Compliance Documents
  const [rcExpiry, setRcExpiry] = useState('');
  const [rcPhotoName, setRcPhotoName] = useState('');
  const [rcPhotoPreview, setRcPhotoPreview] = useState<string | null>(null);
  const rcInputRef = useRef<HTMLInputElement>(null);

  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [insurancePhotoName, setInsurancePhotoName] = useState('');
  const [insurancePhotoPreview, setInsurancePhotoPreview] = useState<string | null>(null);
  const insuranceInputRef = useRef<HTMLInputElement>(null);

  const [pollutionExpiry, setPollutionExpiry] = useState('');
  const [pollutionPhotoName, setPollutionPhotoName] = useState('');
  const [pollutionPhotoPreview, setPollutionPhotoPreview] = useState<string | null>(null);
  const pollutionInputRef = useRef<HTMLInputElement>(null);

  const [permitExpiry, setPermitExpiry] = useState('');
  const [permitPhotoName, setPermitPhotoName] = useState('');
  const [permitPhotoPreview, setPermitPhotoPreview] = useState<string | null>(null);
  const permitInputRef = useRef<HTMLInputElement>(null);

  const [authExpiry, setAuthExpiry] = useState('');
  const [authPhotoName, setAuthPhotoName] = useState('');
  const [authPhotoPreview, setAuthPhotoPreview] = useState<string | null>(null);
  const authInputRef = useRef<HTMLInputElement>(null);

  // Vehicle Exterior Photo
  const [vehiclePhotoName, setVehiclePhotoName] = useState('');
  const [vehiclePhotoPreview, setVehiclePhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showComplianceSection, setShowComplianceSection] = useState(false);

  // Populate form fields when vehicle prop changes
  useEffect(() => {
    if (vehicle) {
      setRegistrationNumber(vehicle.registrationNumber || '');
      setModel(vehicle.model || '');
      setType(vehicle.type || 'Trip-based');
      setDepartmentName(vehicle.departmentName || (vehicle.type === 'Department' ? vehicle.assignedTo : '') || '');
      setAssignedDriver(vehicle.assignedDriver || 'Unassigned');
      setFuelType(vehicle.fuelType || 'Diesel');
      setSeatingCapacity(String(vehicle.seatingCapacity || 5));
      setOdometer(vehicle.odometer !== undefined && vehicle.odometer !== null ? String(vehicle.odometer) : '');
      setStatus(vehicle.status === 'Active' ? 'Running' : vehicle.status || 'Running');
      setFastagBalance(vehicle.fastagBalance !== undefined && vehicle.fastagBalance !== null ? String(vehicle.fastagBalance) : '');
      setFastagTagId(vehicle.fastagTagId || '');
      setFastagBank(vehicle.fastagBank || '');
      setGpsImei(vehicle.gpsImei || '');

      setRcExpiry(vehicle.rcExpiry || '');
      setRcPhotoPreview(vehicle.rcPhoto || null);
      setInsuranceExpiry(vehicle.insuranceExpiry || '');
      setInsurancePhotoPreview(vehicle.insurancePhoto || null);
      setPollutionExpiry(vehicle.pollutionExpiry || '');
      setPollutionPhotoPreview(vehicle.pollutionPhoto || null);
      setPermitExpiry(vehicle.permitExpiry || '');
      setPermitPhotoPreview(vehicle.permitPhoto || null);
      setAuthExpiry(vehicle.authExpiry || '');
      setAuthPhotoPreview(vehicle.authPhoto || null);
      setVehiclePhotoPreview(vehicle.vehiclePhoto || null);

      setRcPhotoName(vehicle.rcPhoto ? 'Attached RC Document' : '');
      setInsurancePhotoName(vehicle.insurancePhoto ? 'Attached Insurance Policy' : '');
      setPollutionPhotoName(vehicle.pollutionPhoto ? 'Attached PUC Certificate' : '');
      setPermitPhotoName(vehicle.permitPhoto ? 'Attached Permit Document' : '');
      setAuthPhotoName(vehicle.authPhoto ? 'Attached Authorization' : '');
      setVehiclePhotoName(vehicle.vehiclePhoto ? 'Attached Vehicle Photo' : '');
      setErrorMsg('');
    }
  }, [vehicle, isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, isSubmitting]);

  if (!isOpen || !vehicle) return null;

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setName: (name: string) => void,
    setPreview: (preview: string | null) => void
  ) => {
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
    setErrorMsg('');

    try {
      const res = await updateVehicle(vehicle.id, {
        registrationNumber: cleanReg,
        model: model.trim() || 'Commercial Vehicle',
        type,
        assignedTo: finalAssignedTo,
        departmentName: type === 'Department' ? departmentName.trim() : undefined,
        status,
        meta: type === 'Department' ? (departmentName.trim() ? `${departmentName.trim()} Contract duty` : 'Department cab') : 'Booking / Rental duty',
        fuelType,
        seatingCapacity: Number(seatingCapacity) || 5,
        assignedDriver: (assignedDriver && assignedDriver !== 'Unassigned') ? assignedDriver : undefined,
        odometer: Number(odometer) || 0,
        fastagBalance: Number(fastagBalance) || 0,
        fastagTagId: fastagTagId.trim() || undefined,
        fastagBank: fastagBank.trim() || undefined,
        gpsImei: gpsImei.trim() || undefined,
        vehiclePhoto: vehiclePhotoPreview,
        rcExpiry: rcExpiry || undefined,
        rcPhoto: rcPhotoPreview,
        insuranceExpiry: insuranceExpiry || undefined,
        insurancePhoto: insurancePhotoPreview,
        pollutionExpiry: pollutionExpiry || undefined,
        pollutionPhoto: pollutionPhotoPreview,
        permitExpiry: permitExpiry || undefined,
        permitPhoto: permitPhotoPreview,
        authExpiry: authExpiry || undefined,
        authPhoto: authPhotoPreview
      });

      if (res && !res.success) {
        setErrorMsg(res.error || 'Failed to update vehicle details.');
        return;
      }

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while updating vehicle.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => !isSubmitting && onClose()}>
      <div
        className="modal-dialog"
        style={{ maxWidth: 680, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Edit2 size={18} color="var(--accent)" /> Edit Vehicle Details
            </h3>
            <span className="modal-subtitle">
              Modify specifications, driver allocation, and compliance documents for {vehicle.registrationNumber}
            </span>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={() => !isSubmitting && onClose()}
            disabled={isSubmitting}
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="modal-body" style={{ overflowY: 'auto', flex: 1, paddingRight: '16px' }}>
          {errorMsg && (
            <div
              style={{
                background: 'rgba(255, 92, 92, 0.1)',
                border: '1px solid rgba(255, 92, 92, 0.3)',
                color: 'var(--danger)',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '12.5px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form id="edit-vehicle-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* 1. Fleet Category Selector */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ marginBottom: '6px', fontSize: '12px', fontWeight: 600 }}>
                Fleet Category / Operation Type *
              </label>
              <div
                className="tab-pill-group"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                  background: 'var(--surface-2)',
                  padding: '4px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)'
                }}
              >
                {(['Department', 'Trip-based'] as VehicleType[]).map(t => (
                  <button
                    key={t}
                    type="button"
                    className={`tab-pill ${type === t ? 'active' : ''}`}
                    onClick={() => {
                      setType(t);
                      if (t === 'Department' && !departmentName) {
                        setDepartmentName('Public Works Department (PWD)');
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      height: '36px',
                      fontSize: '12px',
                      fontWeight: 600,
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      background: type === t ? 'var(--surface)' : 'transparent',
                      color: type === t ? 'var(--accent)' : 'var(--text-muted)',
                      boxShadow: type === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {t === 'Department' ? (
                      <>
                        <Building2 size={14} /> Department Contract
                      </>
                    ) : (
                      <>
                        <Briefcase size={14} /> Booking / Rental Fleet
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Registration Number & Make / Model */}
            <div className="form-row-2" style={{ gap: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ marginBottom: '6px', fontSize: '12px', fontWeight: 600 }}>
                  Registration Number *
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{ textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, height: '38px' }}
                  placeholder="e.g. DL01AB1234"
                  value={registrationNumber}
                  onChange={e => setRegistrationNumber(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ marginBottom: '6px', fontSize: '12px', fontWeight: 600 }}>
                  Vehicle Make & Model *
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{ height: '38px' }}
                  placeholder="e.g. Toyota Innova Crysta 2.4 VX"
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Department Name (Only if Department Contract) */}
            {type === 'Department' && (
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
                  <Building2 size={15} /> Department Name *
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{ fontWeight: 600, fontSize: '13.5px', height: '38px' }}
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
            )}

            {/* 3. Designated Driver & Fuel Type */}
            <div className="form-row-2" style={{ gap: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ marginBottom: '6px', fontSize: '12px', fontWeight: 600 }}>
                  Designated Driver
                </label>
                <select
                  className="form-input"
                  style={{ height: '38px' }}
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
                <label className="form-label" style={{ marginBottom: '6px', fontSize: '12px', fontWeight: 600 }}>
                  Fuel Type
                </label>
                <select
                  className="form-input"
                  style={{ height: '38px' }}
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

            {/* 4. Seating Capacity & Odometer */}
            <div className="form-row-2" style={{ gap: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ marginBottom: '6px', fontSize: '12px', fontWeight: 600 }}>
                  Seating Capacity
                </label>
                <select
                  className="form-input"
                  style={{ height: '38px' }}
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
                <label className="form-label" style={{ marginBottom: '6px', fontSize: '12px', fontWeight: 600 }}>
                  Current Odometer (KM)
                </label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  style={{ height: '38px' }}
                  placeholder="e.g. 35000"
                  value={odometer}
                  onChange={e => setOdometer(e.target.value)}
                />
              </div>
            </div>

            {/* 5. Status & FASTag Balance */}
            <div className="form-row-2" style={{ gap: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ marginBottom: '6px', fontSize: '12px', fontWeight: 600 }}>
                  Current Vehicle Status
                </label>
                <select
                  className="form-input"
                  style={{ height: '38px' }}
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
                <label className="form-label" style={{ marginBottom: '6px', fontSize: '12px', fontWeight: 600 }}>
                  FASTag Balance (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  style={{ height: '38px' }}
                  placeholder="e.g. 2500"
                  value={fastagBalance}
                  onChange={e => setFastagBalance(e.target.value)}
                />
              </div>
            </div>

            {/* 6. GPS IMEI & Vehicle Photo */}
            <div className="form-row-2" style={{ gap: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ marginBottom: '6px', fontSize: '12px', fontWeight: 600 }}>
                  GPS Device IMEI / Telematics ID
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{ height: '38px' }}
                  placeholder="e.g. IMEI-86776347168"
                  value={gpsImei}
                  onChange={e => setGpsImei(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ marginBottom: '6px', fontSize: '12px', fontWeight: 600 }}>
                  Vehicle Photo / Document
                </label>
                <input
                  type="file"
                  ref={photoInputRef}
                  onChange={e => handleFileUpload(e, setVehiclePhotoName, setVehiclePhotoPreview)}
                  accept={ACCEPT_DOC_TYPES}
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
                      {vehiclePhotoName || (vehiclePhotoPreview ? 'Photo Attached' : 'Upload vehicle photo')}
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

            {/* FASTag Tag ID & Bank (Secondary Optional Fields) */}
            <div className="form-row-2" style={{ gap: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ marginBottom: '6px', fontSize: '12px', fontWeight: 600 }}>
                  FASTag Tag ID (Optional)
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{ height: '38px' }}
                  placeholder="e.g. 34161FA8891"
                  value={fastagTagId}
                  onChange={e => setFastagTagId(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ marginBottom: '6px', fontSize: '12px', fontWeight: 600 }}>
                  FASTag Bank Name (Optional)
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{ height: '38px' }}
                  placeholder="e.g. ICICI Bank FASTag"
                  value={fastagBank}
                  onChange={e => setFastagBank(e.target.value)}
                />
              </div>
            </div>

            {/* Toggle 5 Compliance Documents Section */}
            <div
              style={{
                marginTop: '6px',
                padding: '12px 14px',
                background: 'var(--surface-3)',
                borderRadius: '10px',
                border: '1px solid var(--border)'
              }}
            >
              <div
                onClick={() => setShowComplianceSection(!showComplianceSection)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileCheck size={16} color="var(--accent)" />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                    Compliance Documents & Expiry Dates (5 Docs)
                  </span>
                </div>
                <span style={{ fontSize: '11.5px', color: 'var(--accent)', fontWeight: 600 }}>
                  {showComplianceSection ? '▲ Hide Documents' : '▼ View / Edit Documents'}
                </span>
              </div>

              {showComplianceSection && (
                <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* RC */}
                  <div className="form-row-2" style={{ gap: '12px', alignItems: 'center' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '11.5px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FileText size={13} color="#38bdf8" /> RC Expiry Date
                      </label>
                      <DatePicker value={rcExpiry} onChange={setRcExpiry} />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '11.5px', fontWeight: 600 }}>
                        RC Document / Photo
                      </label>
                      <input type="file" ref={rcInputRef} onChange={e => handleFileUpload(e, setRcPhotoName, setRcPhotoPreview)} accept={ACCEPT_DOC_TYPES} style={{ display: 'none' }} />
                      <button type="button" className="btn-secondary" style={{ width: '100%', height: '36px', fontSize: '11.5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} onClick={() => rcInputRef.current?.click()}>
                        {rcPhotoPreview ? '✓ RC Attached (Click to change)' : 'Upload RC'}
                      </button>
                    </div>
                  </div>

                  {/* Insurance */}
                  <div className="form-row-2" style={{ gap: '12px', alignItems: 'center' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '11.5px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Shield size={13} color="#38bdf8" /> Insurance Expiry Date
                      </label>
                      <DatePicker value={insuranceExpiry} onChange={setInsuranceExpiry} />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '11.5px', fontWeight: 600 }}>
                        Insurance Policy Document
                      </label>
                      <input type="file" ref={insuranceInputRef} onChange={e => handleFileUpload(e, setInsurancePhotoName, setInsurancePhotoPreview)} accept={ACCEPT_DOC_TYPES} style={{ display: 'none' }} />
                      <button type="button" className="btn-secondary" style={{ width: '100%', height: '36px', fontSize: '11.5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} onClick={() => insuranceInputRef.current?.click()}>
                        {insurancePhotoPreview ? '✓ Policy Attached (Click to change)' : 'Upload Policy'}
                      </button>
                    </div>
                  </div>

                  {/* Pollution */}
                  <div className="form-row-2" style={{ gap: '12px', alignItems: 'center' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '11.5px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Wind size={13} color="var(--success)" /> PUCC / Pollution Expiry
                      </label>
                      <DatePicker value={pollutionExpiry} onChange={setPollutionExpiry} />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '11.5px', fontWeight: 600 }}>
                        PUCC Certificate
                      </label>
                      <input type="file" ref={pollutionInputRef} onChange={e => handleFileUpload(e, setPollutionPhotoName, setPollutionPhotoPreview)} accept={ACCEPT_DOC_TYPES} style={{ display: 'none' }} />
                      <button type="button" className="btn-secondary" style={{ width: '100%', height: '36px', fontSize: '11.5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} onClick={() => pollutionInputRef.current?.click()}>
                        {pollutionPhotoPreview ? '✓ PUC Attached (Click to change)' : 'Upload PUC'}
                      </button>
                    </div>
                  </div>

                  {/* Permit */}
                  <div className="form-row-2" style={{ gap: '12px', alignItems: 'center' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '11.5px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FileCheck size={13} color="#ffcc4d" /> Permit Expiry Date
                      </label>
                      <DatePicker value={permitExpiry} onChange={setPermitExpiry} />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '11.5px', fontWeight: 600 }}>
                        Permit Document
                      </label>
                      <input type="file" ref={permitInputRef} onChange={e => handleFileUpload(e, setPermitPhotoName, setPermitPhotoPreview)} accept={ACCEPT_DOC_TYPES} style={{ display: 'none' }} />
                      <button type="button" className="btn-secondary" style={{ width: '100%', height: '36px', fontSize: '11.5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} onClick={() => permitInputRef.current?.click()}>
                        {permitPhotoPreview ? '✓ Permit Attached (Click to change)' : 'Upload Permit'}
                      </button>
                    </div>
                  </div>

                  {/* Auth */}
                  <div className="form-row-2" style={{ gap: '12px', alignItems: 'center' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '11.5px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Award size={13} color="#a78bfa" /> Authorization (Auth) Expiry
                      </label>
                      <DatePicker value={authExpiry} onChange={setAuthExpiry} />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '11.5px', fontWeight: 600 }}>
                        Auth Document
                      </label>
                      <input type="file" ref={authInputRef} onChange={e => handleFileUpload(e, setAuthPhotoName, setAuthPhotoPreview)} accept={ACCEPT_DOC_TYPES} style={{ display: 'none' }} />
                      <button type="button" className="btn-secondary" style={{ width: '100%', height: '36px', fontSize: '11.5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} onClick={() => authInputRef.current?.click()}>
                        {authPhotoPreview ? '✓ Auth Attached (Click to change)' : 'Upload Auth'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div
          className="modal-footer"
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
            background: 'var(--surface-2)'
          }}
        >
          <button
            type="button"
            className="btn-secondary"
            onClick={() => !isSubmitting && onClose()}
            disabled={isSubmitting}
            style={{ fontSize: '12.5px', padding: '8px 16px' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-vehicle-form"
            className="btn-primary-action"
            disabled={isSubmitting}
            style={{
              fontSize: '12.5px',
              padding: '8px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {isSubmitting ? (
              <>Saving Changes...</>
            ) : (
              <>
                <Check size={14} /> Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
