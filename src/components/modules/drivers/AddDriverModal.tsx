import React, { useState, useRef, useEffect } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { DriverType } from '../../../types/fleet';
import { UserPlus, Camera, IdCard } from 'lucide-react';

interface AddDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const driverTypes: DriverType[] = ['Full Time', 'Part Time', 'Contract', 'Owner Driver'];

export const AddDriverModal: React.FC<AddDriverModalProps> = ({ isOpen, onClose }) => {
  const { vehicles, addDriver } = useFleet();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [driverType, setDriverType] = useState<DriverType>('Full Time');
  const [assignedVehicle, setAssignedVehicle] = useState(vehicles[0]?.registrationNumber || 'DL01AB1234');
  const [status, setStatus] = useState<'On duty' | 'Off duty'>('On duty');
  const [joiningDate, setJoiningDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Photo uploads
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [licensePhotoPreview, setLicensePhotoPreview] = useState<string | null>(null);
  const [licenseFileName, setLicenseFileName] = useState<string>('');

  const [errorMsg, setErrorMsg] = useState('');

  const photoInputRef = useRef<HTMLInputElement>(null);
  const licenseInputRef = useRef<HTMLInputElement>(null);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
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
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLicensePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLicenseFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLicensePhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setErrorMsg('Driver name is required.');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('Driver phone number is required.');
      return;
    }

    // Format Joining Date
    let formattedDate = joiningDate;
    if (joiningDate) {
      const d = new Date(joiningDate + 'T00:00:00');
      formattedDate = d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }

    addDriver({
      name: name.trim(),
      phone: phone.trim(),
      photo: photoPreview || undefined,
      address: address.trim() || undefined,
      emergencyContact: emergencyContact.trim() || undefined,
      licenseNumber: licenseNumber.trim() || undefined,
      licensePhoto: licensePhotoPreview || licenseFileName || undefined,
      driverType,
      assignedVehicle: assignedVehicle || '—',
      joiningDate: formattedDate,
      status
    });

    // Reset & Close
    setName('');
    setPhone('');
    setAddress('');
    setEmergencyContact('');
    setLicenseNumber('');
    setPhotoPreview(null);
    setLicensePhotoPreview(null);
    setLicenseFileName('');
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserPlus size={18} color="var(--accent)" /> Add New Driver
            </h3>
            <span className="modal-subtitle">Fill in driver identity, license & employment details</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} type="button" title="Close modal">
            ✕
          </button>
        </div>

        {/* Body Form */}
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

            {/* Driver Photo Upload */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Driver Photo</label>
              <input
                type="file"
                ref={photoInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <div className="upload-box" onClick={() => photoInputRef.current?.click()}>
                {photoPreview ? (
                  <img src={photoPreview} alt="Driver preview" className="upload-preview upload-preview-avatar" />
                ) : (
                  <div className="upload-icon-placeholder" style={{ borderRadius: '50%' }}>
                    <Camera size={18} color="var(--accent)" />
                  </div>
                )}
                <div className="upload-info">
                  <div className="upload-title">
                    {photoPreview ? 'Photo selected (Click to change)' : 'Click to upload driver profile photo'}
                  </div>
                  <div className="upload-hint">JPG, PNG, WebP up to 5MB</div>
                </div>
                {photoPreview && (
                  <button
                    type="button"
                    className="modal-close-btn"
                    style={{ width: 26, height: 26, fontSize: 11 }}
                    onClick={e => {
                      e.stopPropagation();
                      setPhotoPreview(null);
                    }}
                    title="Remove photo"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Name & Phone Number */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Driver Full Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Rajesh Sharma"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Phone Number *</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="e.g. +91 98765 43210"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Driver Type Selection */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Driver Type</label>
              <div className="driver-type-grid">
                {driverTypes.map(type => (
                  <div
                    key={type}
                    className={`driver-type-option ${driverType === type ? 'active' : ''}`}
                    onClick={() => setDriverType(type)}
                  >
                    {type}
                  </div>
                ))}
              </div>
            </div>

            {/* Address */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Address</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Flat 102, Sector 12, Dwarka, New Delhi"
                value={address}
                onChange={e => setAddress(e.target.value)}
              />
            </div>

            {/* Emergency Contact & License Number */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Emergency Contact Number</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="e.g. +91 98111 22334"
                  value={emergencyContact}
                  onChange={e => setEmergencyContact(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Driving License Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. DL-0420180092341"
                  value={licenseNumber}
                  onChange={e => setLicenseNumber(e.target.value)}
                />
              </div>
            </div>

            {/* Driving License Photo */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Driving License Photo / Document</label>
              <input
                type="file"
                ref={licenseInputRef}
                onChange={handleLicensePhotoUpload}
                accept="image/*,.pdf"
                style={{ display: 'none' }}
              />
              <div className="upload-box" onClick={() => licenseInputRef.current?.click()}>
                {licensePhotoPreview ? (
                  <img src={licensePhotoPreview} alt="License preview" className="upload-preview" />
                ) : (
                  <div className="upload-icon-placeholder">
                    <IdCard size={18} color="var(--accent)" />
                  </div>
                )}
                <div className="upload-info">
                  <div className="upload-title">
                    {licenseFileName
                      ? licenseFileName
                      : licensePhotoPreview
                      ? 'License document uploaded'
                      : 'Click to upload driving license copy'}
                  </div>
                  <div className="upload-hint">Upload front/back photo or scan</div>
                </div>
                {(licensePhotoPreview || licenseFileName) && (
                  <button
                    type="button"
                    className="modal-close-btn"
                    style={{ width: 26, height: 26, fontSize: 11 }}
                    onClick={e => {
                      e.stopPropagation();
                      setLicensePhotoPreview(null);
                      setLicenseFileName('');
                    }}
                    title="Remove license photo"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Vehicle & Status & Joining Date */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Assigned Vehicle</label>
                <select
                  className="form-input"
                  value={assignedVehicle}
                  onChange={e => setAssignedVehicle(e.target.value)}
                >
                  <option value="—">Unassigned (—)</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.registrationNumber}>
                      {v.registrationNumber} ({v.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Status</label>
                <select
                  className="form-input"
                  value={status}
                  onChange={e => setStatus(e.target.value as 'On duty' | 'Off duty')}
                >
                  <option value="On duty">On duty</option>
                  <option value="Off duty">Off duty</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Joining Date</label>
              <input
                type="date"
                className="form-input"
                value={joiningDate}
                onChange={e => setJoiningDate(e.target.value)}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-action">
              <span>+</span> Save Driver
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
