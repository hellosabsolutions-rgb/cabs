import React, { useState, useRef, useEffect } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { DriverType } from '../../../types/fleet';
import { UserPlus, Camera, IdCard, FileText, Copy, CheckCircle, ChevronDown, ExternalLink } from 'lucide-react';
import { MinimalVoiceFiller } from '../../common/MinimalVoiceFiller';
import { DatePicker } from '../../common/DatePicker';
import { ACCEPT_DOC_TYPES, isPdfDocument } from '../../../utils/fileUtils';

// Common dial codes — India first, then popular countries
const DIAL_CODES = [
  { code: 'IN', flag: '🇮🇳', dial: '+91',  name: 'India' },
  { code: 'US', flag: '🇺🇸', dial: '+1',   name: 'USA' },
  { code: 'GB', flag: '🇬🇧', dial: '+44',  name: 'UK' },
  { code: 'AE', flag: '🇦🇪', dial: '+971', name: 'UAE' },
  { code: 'SA', flag: '🇸🇦', dial: '+966', name: 'Saudi Arabia' },
  { code: 'AU', flag: '🇦🇺', dial: '+61',  name: 'Australia' },
  { code: 'CA', flag: '🇨🇦', dial: '+1',   name: 'Canada' },
  { code: 'SG', flag: '🇸🇬', dial: '+65',  name: 'Singapore' },
  { code: 'NP', flag: '🇳🇵', dial: '+977', name: 'Nepal' },
  { code: 'BD', flag: '🇧🇩', dial: '+880', name: 'Bangladesh' },
  { code: 'PK', flag: '🇵🇰', dial: '+92',  name: 'Pakistan' },
  { code: 'LK', flag: '🇱🇰', dial: '+94',  name: 'Sri Lanka' },
  { code: 'MY', flag: '🇲🇾', dial: '+60',  name: 'Malaysia' },
] as const;

interface AddDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const driverTypes: DriverType[] = ['Full Time', 'Part Time', 'Contract', 'Owner Driver'];

export const AddDriverModal: React.FC<AddDriverModalProps> = ({ isOpen, onClose }) => {
  const { vehicles, addDriver } = useFleet();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dialCode, setDialCode] = useState('+91');
  const [dialOpen, setDialOpen] = useState(false);
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [driverType, setDriverType] = useState<DriverType>('Full Time');
  const [assignedVehicle, setAssignedVehicle] = useState(vehicles[0]?.registrationNumber || '');
  const [status, setStatus] = useState<'On duty' | 'Off duty'>('On duty');
  const [monthlySalary, setMonthlySalary] = useState('');
  const [joiningDate, setJoiningDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Photo uploads
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [licensePhotoPreview, setLicensePhotoPreview] = useState<string | null>(null);
  const [licenseFileName, setLicenseFileName] = useState<string>('');

  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-generated driver credentials shown after successful onboarding
  const [generatedCreds, setGeneratedCreds] = useState<{ loginId: string; password: string; driverName: string } | null>(null);
  const [copiedField, setCopiedField] = useState<'loginId' | 'password' | 'both' | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const licenseInputRef = useRef<HTMLInputElement>(null);


  // Close on ESC key
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const driverFullName = name.trim();
    if (!driverFullName) {
      setErrorMsg('Driver name is required.');
      return;
    }
    const digitsOnly = phone.replace(/\D/g, '');
    if (!digitsOnly || digitsOnly.length < 6) {
      setErrorMsg('Please enter a valid phone number (at least 6 digits).');
      return;
    }
    const fullPhone = `${dialCode}${digitsOnly}`;

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

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await addDriver({
        name: driverFullName,
        phone: fullPhone,
        photo: photoPreview || undefined,
        address: address.trim() || undefined,
        emergencyContact: emergencyContact.trim() || undefined,
        licenseNumber: licenseNumber.trim() || undefined,
        licensePhoto: licensePhotoPreview || licenseFileName || undefined,
        licenseExpiry: licenseExpiry || undefined,
        driverType,
        assignedVehicle: assignedVehicle || '—',
        joiningDate: formattedDate,
        status,
        monthlySalary: monthlySalary ? Number(monthlySalary) : undefined
      });

      if (res && !res.success) {
        setErrorMsg(res.error || 'Failed to save driver. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Reset form fields
      setName('');
      setPhone('');
      setDialCode('+91');
      setAddress('');
      setEmergencyContact('');
      setLicenseNumber('');
      setPhotoPreview(null);
      setLicensePhotoPreview(null);
      setLicenseFileName('');
      setErrorMsg('');
      setIsSubmitting(false);

      // Show generated credentials if backend returned them
      const resAny = res as any;
      if (resAny?.credentials) {
        setGeneratedCreds({
          loginId: resAny.credentials.loginId || fullPhone,
          password: resAny.credentials.password,
          driverName: driverFullName
        });
      } else {
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = async (text: string, field: 'loginId' | 'password' | 'both') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (_) {}
  };

  return (
    <div className="modal-overlay" onClick={generatedCreds ? undefined : onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {generatedCreds
                ? <><CheckCircle size={18} color="var(--success, #22c55e)" /> Driver Onboarded!</>
                : <><UserPlus size={18} color="var(--accent)" /> Add New Driver</>
              }
            </h3>
            <span className="modal-subtitle">
              {generatedCreds
                ? `${generatedCreds.driverName} has been added. Share these credentials.`
                : 'Fill in driver identity, license & employment details'}
            </span>
          </div>
          <button className="modal-close-btn" onClick={() => { setGeneratedCreds(null); onClose(); }} type="button" title="Close modal">
            ✕
          </button>
        </div>

        {/* Credentials Panel — shown after successful onboarding */}
        {generatedCreds && (
          <div style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{
              background: 'var(--surface-muted, rgba(34,197,94,0.08))',
              border: '1px solid rgba(34,197,94,0.25)',
              borderRadius: '12px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-dim)', lineHeight: 1.6 }}>
                📱 Send these credentials to <strong>{generatedCreds.driverName}</strong> so they can log in to the Driver App.
              </p>

              {/* Login ID row */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Mobile / Login ID</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--surface)', borderRadius: '8px', padding: '10px 14px', border: '1px solid var(--border-soft)' }}>
                  <code style={{ flex: 1, fontSize: '15px', fontWeight: 700, color: 'var(--text)', letterSpacing: '0.04em' }}>{generatedCreds.loginId}</code>
                  <button type="button" onClick={() => copyToClipboard(generatedCreds.loginId, 'loginId')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedField === 'loginId' ? 'var(--success, #22c55e)' : 'var(--text-faint)', padding: '2px' }}>
                    {copiedField === 'loginId' ? <CheckCircle size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              {/* Password row */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Password</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--surface)', borderRadius: '8px', padding: '10px 14px', border: '1px solid var(--border-soft)' }}>
                  <code style={{ flex: 1, fontSize: '15px', fontWeight: 700, color: 'var(--text)', letterSpacing: '0.04em' }}>{generatedCreds.password}</code>
                  <button type="button" onClick={() => copyToClipboard(generatedCreds.password, 'password')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedField === 'password' ? 'var(--success, #22c55e)' : 'var(--text-faint)', padding: '2px' }}>
                    {copiedField === 'password' ? <CheckCircle size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              {/* WhatsApp Share & Copy Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <a
                  href={`https://wa.me/${generatedCreds.loginId.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${generatedCreds.driverName},

Your KABPRO Driver App login:
📱 Mobile: ${generatedCreds.loginId}
🔐 Password: ${generatedCreds.password}

Download the app and log in to start your duty.

— Fleet Management`)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '11px 16px',
                    borderRadius: '8px',
                    background: '#16a34a',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)',
                    transition: 'all 0.2s'
                  }}
                >
                  <ExternalLink size={15} /> Send Credentials via WhatsApp
                </a>

                <button
                  type="button"
                  onClick={() => copyToClipboard(`Hi ${generatedCreds.driverName},\n\nYour KABPRO Driver App login:\n📱 Mobile: ${generatedCreds.loginId}\n🔐 Password: ${generatedCreds.password}\n\nDownload the app and log in to start your duty.`, 'both')}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', border: '1px dashed var(--border-soft)', background: 'transparent', cursor: 'pointer', color: copiedField === 'both' ? 'var(--success, #22c55e)' : 'var(--text-dim)', fontSize: '13px', fontWeight: 500, transition: 'all 0.2s' }}
                >
                  {copiedField === 'both' ? <><CheckCircle size={14} /> Login Message Copied!</> : <><Copy size={14} /> Copy Full Login Message</>}
                </button>
              </div>
            </div>

            <button
              type="button"
              className="btn-primary-action"
              onClick={() => { setGeneratedCreds(null); setCopiedField(null); onClose(); }}
            >
              ✓ Done
            </button>
          </div>
        )}

        {/* Body Form — hidden when showing credentials */}
        {!generatedCreds && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="modal-body">
            {/* Minimal Voice Form Filler */}
            <MinimalVoiceFiller
              formType="driver"
              context={{ vehicles: vehicles.map(v => v.registrationNumber) }}
              placeholder="Speak driver details (e.g. 'Driver phone 9876543210 Full Time')"
              onApplyParsedData={(data) => {
                if (data.name) setName(data.name);
                if (data.phone) setPhone(data.phone);
                if (data.driverType) setDriverType(data.driverType);
                if (data.assignedVehicle) setAssignedVehicle(data.assignedVehicle);
                if (data.status) setStatus(data.status);
                if (data.licenseNumber) setLicenseNumber(data.licenseNumber);
                if (data.address) setAddress(data.address);
                if (data.emergencyContact) setEmergencyContact(data.emergencyContact);
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

            {/* Driver Photo Upload */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Driver Photo (Image or PDF)</label>
              <input
                type="file"
                ref={photoInputRef}
                onChange={handlePhotoUpload}
                accept={ACCEPT_DOC_TYPES}
                style={{ display: 'none' }}
              />
              <div className="upload-box" onClick={() => photoInputRef.current?.click()}>
                {photoPreview ? (
                  isPdfDocument(undefined, photoPreview) ? (
                    <div className="upload-icon-placeholder" style={{ borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                      <FileText size={20} />
                    </div>
                  ) : (
                    <img src={photoPreview} alt="Driver preview" className="upload-preview upload-preview-avatar" />
                  )
                ) : (
                  <div className="upload-icon-placeholder" style={{ borderRadius: '50%' }}>
                    <Camera size={18} color="var(--accent)" />
                  </div>
                )}
                <div className="upload-info">
                  <div className="upload-title">
                    {photoPreview ? 'Document selected (Click to change)' : 'Click to upload driver profile photo / document'}
                  </div>
                  <div className="upload-hint">JPG, PNG, WebP or PDF (up to 10MB)</div>
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
                <div style={{ display: 'flex', gap: '8px' }}>
                  {/* Dial code dropdown */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => setDialOpen(o => !o)}
                      style={{
                        height: '38px',
                        padding: '0 10px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-soft)',
                        background: 'var(--surface-muted)',
                        color: 'var(--text)',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {DIAL_CODES.find(d => d.dial === dialCode)?.flag || '🇮🇳'}
                      <span>{dialCode}</span>
                      <ChevronDown size={12} />
                    </button>
                    {dialOpen && (
                      <div style={{
                        position: 'absolute',
                        top: '42px',
                        left: 0,
                        zIndex: 1000,
                        background: 'var(--surface)',
                        border: '1px solid var(--border-soft)',
                        borderRadius: '10px',
                        minWidth: '200px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                        overflow: 'hidden'
                      }}>
                        {DIAL_CODES.map(d => (
                          <button
                            key={d.code}
                            type="button"
                            onClick={() => { setDialCode(d.dial); setDialOpen(false); }}
                            style={{
                              width: '100%',
                              padding: '8px 14px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              background: dialCode === d.dial ? 'var(--surface-muted)' : 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '13px',
                              color: 'var(--text)',
                              textAlign: 'left'
                            }}
                          >
                            <span style={{ fontSize: '16px' }}>{d.flag}</span>
                            <span style={{ flex: 1 }}>{d.name}</span>
                            <code style={{ fontSize: '12px', color: 'var(--text-faint)', fontWeight: 600 }}>{d.dial}</code>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Number input */}
                  <input
                    type="tel"
                    className="form-input"
                    style={{ flex: 1 }}
                    placeholder="98765 43210"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/[^0-9\s\-]/g, ''))}
                    required
                  />
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '4px' }}>
                  Will be stored as <code style={{ fontSize: '11px' }}>{dialCode}{phone.replace(/\D/g, '') || 'XXXXXXXXXX'}</code> — used for login
                </div>
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

            {/* Emergency Contact */}
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

            {/* Driving License Number & Expiry Date */}
            <div className="form-row-2">
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
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">DL Expiry Date</label>
                <DatePicker
                  value={licenseExpiry}
                  onChange={d => setLicenseExpiry(d)}
                />
              </div>
            </div>

            {/* Driving License Photo */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Driving License Document (Image or PDF)</label>
              <input
                type="file"
                ref={licenseInputRef}
                onChange={handleLicensePhotoUpload}
                accept={ACCEPT_DOC_TYPES}
                style={{ display: 'none' }}
              />
              <div className="upload-box" onClick={() => licenseInputRef.current?.click()}>
                {licensePhotoPreview ? (
                  isPdfDocument(licenseFileName, licensePhotoPreview) ? (
                    <div className="upload-icon-placeholder" style={{ borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                      <FileText size={20} />
                    </div>
                  ) : (
                    <img src={licensePhotoPreview} alt="License preview" className="upload-preview" />
                  )
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
                  <div className="upload-hint">JPG, PNG, WebP or PDF format (front/back)</div>
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

            {/* Salary & Joining Date */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Driver Monthly Salary (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  className="form-input"
                  placeholder="e.g. 18000"
                  value={monthlySalary}
                  onChange={e => setMonthlySalary(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Joining Date</label>
                <DatePicker
                  value={joiningDate}
                  onChange={d => setJoiningDate(d)}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-action" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="spinner" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }}></span>
                  <span>Saving Driver...</span>
                </>
              ) : (
                <>
                  <span>+</span> Save Driver
                </>
              )}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};
