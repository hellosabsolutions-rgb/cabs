import React, { useState, useRef, useEffect } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { DriverType } from '../../../types/fleet';
import { UserPlus, Camera, FileText, Copy, CheckCircle, Trash2, ExternalLink, AlertCircle, X, Smartphone } from 'lucide-react';
import { MinimalVoiceFiller } from '../../common/MinimalVoiceFiller';
import { DatePicker } from '../../common/DatePicker';
import { ACCEPT_DOC_TYPES, isPdfDocument } from '../../../utils/fileUtils';

interface AddDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const driverTypes: DriverType[] = ['Full Time', 'Part Time', 'Contract', 'Owner Driver'];

export const AddDriverModal: React.FC<AddDriverModalProps> = ({ isOpen, onClose }) => {
  const { vehicles, addDriver } = useFleet();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [driverType, setDriverType] = useState<DriverType>('Full Time');
  const [assignedVehicle, setAssignedVehicle] = useState(vehicles[0]?.registrationNumber || '—');
  const [status, setStatus] = useState<'On duty' | 'Off duty'>('On duty');
  const [monthlySalary, setMonthlySalary] = useState('');
  const [joiningDate, setJoiningDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Photo & License uploads
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFileName, setPhotoFileName] = useState<string>('');
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
      setPhotoFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
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
    e.target.value = '';
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(digitsOnly);
    if (errorMsg) setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const driverFullName = name.trim();
    if (!driverFullName) {
      setErrorMsg('Driver name is required.');
      return;
    }
    const digitsOnly = phone.replace(/\D/g, '');
    if (!digitsOnly || digitsOnly.length !== 10) {
      setPhoneTouched(true);
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }
    const fullPhone = `+91${digitsOnly}`;

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
      setAddress('');
      setEmergencyContact('');
      setLicenseNumber('');
      setLicenseExpiry('');
      setPhotoPreview(null);
      setPhotoFileName('');
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

  const isPhoneValid = phone.length === 10;
  const isPhoneInvalid = phoneTouched && phone.length > 0 && !isPhoneValid;

  return (
    <div className="modal-overlay" onClick={generatedCreds ? undefined : onClose}>
      <div className="modal-dialog app-form-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <h3 className="modal-title">
              <span className="modal-title-icon">
                <UserPlus size={16} />
              </span>
              {generatedCreds ? 'Driver onboarded' : 'Add new driver'}
            </h3>
            <span className="modal-subtitle">
              {generatedCreds
                ? `${generatedCreds.driverName} has been added. Share login credentials below.`
                : 'Fill in identity, license & employment details'}
            </span>
          </div>
          <button
            className="modal-close-btn"
            onClick={() => {
              setGeneratedCreds(null);
              onClose();
            }}
            type="button"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        {/* Credentials Panel — shown after successful onboarding */}
        {generatedCreds && (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div
              style={{
                background: 'rgba(34, 197, 94, 0.08)',
                border: '1px solid rgba(34, 197, 94, 0.25)',
                borderRadius: '12px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}
            >
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text)', lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <Smartphone size={15} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>Send these credentials to <strong>{generatedCreds.driverName}</strong> so they can log in to the Driver App.</span>
              </p>

              {/* Login ID row */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Mobile / Login ID
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg)', borderRadius: '10px', padding: '9px 12px', border: '1px solid var(--border)' }}>
                  <code style={{ flex: 1, fontSize: '14px', fontWeight: 700, color: 'var(--text)', letterSpacing: '0.04em' }}>{generatedCreds.loginId}</code>
                  <button type="button" onClick={() => copyToClipboard(generatedCreds.loginId, 'loginId')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedField === 'loginId' ? '#16a34a' : 'var(--text-faint)', padding: '2px' }}>
                    {copiedField === 'loginId' ? <CheckCircle size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              {/* Password row */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Password
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg)', borderRadius: '10px', padding: '9px 12px', border: '1px solid var(--border)' }}>
                  <code style={{ flex: 1, fontSize: '14px', fontWeight: 700, color: 'var(--text)', letterSpacing: '0.04em' }}>{generatedCreds.password}</code>
                  <button type="button" onClick={() => copyToClipboard(generatedCreds.password, 'password')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedField === 'password' ? '#16a34a' : 'var(--text-faint)', padding: '2px' }}>
                    {copiedField === 'password' ? <CheckCircle size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              {/* WhatsApp Share & Copy Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                <a
                  href={`https://wa.me/${generatedCreds.loginId.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${generatedCreds.driverName},

Your KABPRO Driver App login:
Mobile: ${generatedCreds.loginId}
Password: ${generatedCreds.password}

Download the app and log in to start your duty.

— Fleet Management`)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    background: '#16a34a',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)'
                  }}
                >
                  <ExternalLink size={15} /> Send Credentials via WhatsApp
                </a>

                <button
                  type="button"
                  onClick={() => copyToClipboard(`Hi ${generatedCreds.driverName},\n\nYour KABPRO Driver App login:\nMobile: ${generatedCreds.loginId}\nPassword: ${generatedCreds.password}\n\nDownload the app and log in to start your duty.`, 'both')}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '9px 16px', borderRadius: '10px', border: '1px dashed var(--border)', background: 'transparent', cursor: 'pointer', color: copiedField === 'both' ? '#16a34a' : 'var(--text-dim)', fontSize: '12.5px', fontWeight: 560 }}
                >
                  {copiedField === 'both' ? <><CheckCircle size={14} /> Login Message Copied!</> : <><Copy size={14} /> Copy Full Login Message</>}
                </button>
              </div>
            </div>

            <button
              type="button"
              className="btn-primary-action"
              onClick={() => { setGeneratedCreds(null); setCopiedField(null); onClose(); }}
              style={{ width: '100%' }}
            >
              Done
            </button>
          </div>
        )}

        {/* Form Body — hidden when displaying credentials */}
        {!generatedCreds && (
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <MinimalVoiceFiller
                formType="driver"
                context={{ vehicles: vehicles.map(v => v.registrationNumber) }}
                placeholder="Fill by speaking — try 'Driver phone 9876543210, full time'"
                onApplyParsedData={(data) => {
                  if (data.name) setName(data.name);
                  if (data.phone) setPhone(data.phone.replace(/\D/g, '').slice(0, 10));
                  if (data.driverType) setDriverType(data.driverType);
                  if (data.assignedVehicle) setAssignedVehicle(data.assignedVehicle);
                  if (data.status) setStatus(data.status);
                  if (data.licenseNumber) setLicenseNumber(data.licenseNumber);
                  if (data.address) setAddress(data.address);
                  if (data.emergencyContact) setEmergencyContact(data.emergencyContact);
                }}
              />

              {errorMsg && (
                <div className="form-error" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={15} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Hidden file inputs */}
              <input
                type="file"
                ref={photoInputRef}
                onChange={handlePhotoUpload}
                accept={ACCEPT_DOC_TYPES}
                style={{ display: 'none' }}
              />
              <input
                type="file"
                ref={licenseInputRef}
                onChange={handleLicensePhotoUpload}
                accept={ACCEPT_DOC_TYPES}
                style={{ display: 'none' }}
              />

              {/* SECTION 1: Identity & contact */}
              <div className="section">
                <div className="section-title">Identity & contact</div>

                <div className="grid">
                  {/* Driver Photo Upload */}
                  <div className="field full">
                    <label>
                      Driver photo <span className="opt">optional</span>
                    </label>
                    <div className="upload compact" onClick={() => photoInputRef.current?.click()}>
                      {photoPreview ? (
                        isPdfDocument(photoFileName, photoPreview) ? (
                          <div className="icon" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
                            <FileText size={18} />
                          </div>
                        ) : (
                          <img
                            src={photoPreview}
                            alt="Driver preview"
                            style={{ width: '38px', height: '38px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                          />
                        )
                      ) : (
                        <span className="icon">
                          <Camera size={18} />
                        </span>
                      )}
                      <div className="txt" style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {photoFileName ? photoFileName : photoPreview ? 'Profile photo attached' : 'Click to upload a profile photo'}
                        </div>
                        <div>JPG, PNG or WebP, up to 10MB</div>
                      </div>
                      {photoPreview && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPhotoPreview(null);
                            setPhotoFileName('');
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--danger)',
                            padding: '4px',
                            cursor: 'pointer'
                          }}
                          title="Remove photo"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Full Name */}
                  <div className="field">
                    <label>
                      Full name<span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rajesh Sharma"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                    />
                  </div>

                  {/* Phone Number with single-line +91 */}
                  <div className="field">
                    <label>
                      Phone number<span className="req">*</span>
                    </label>
                    <div className="phone-input">
                      <span className="code">
                        <svg width="15" height="10" viewBox="0 0 16 11" style={{ borderRadius: '2px', flexShrink: 0, display: 'inline-block' }} aria-hidden="true">
                          <rect width="16" height="3.67" fill="#FF9933" />
                          <rect y="3.67" width="16" height="3.67" fill="#FFFFFF" />
                          <rect y="7.34" width="16" height="3.66" fill="#138808" />
                          <circle cx="8" cy="5.5" r="1.3" fill="#000080" />
                        </svg>
                        <span>+91</span>
                      </span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        placeholder="98765 43210"
                        value={phone}
                        onChange={handlePhoneChange}
                        onBlur={() => setPhoneTouched(true)}
                        style={{
                          borderColor: isPhoneInvalid ? 'var(--danger)' : undefined
                        }}
                        required
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '3px' }}>
                      <span className="hint" style={{ color: isPhoneInvalid ? 'var(--danger)' : isPhoneValid ? '#16a34a' : undefined }}>
                        {isPhoneInvalid
                          ? 'Must be exactly 10 digits'
                          : isPhoneValid
                          ? 'Stored as +91' + phone + ' — used to log in'
                          : 'Stored as +91XXXXXXXXXX — used to log in'}
                      </span>
                      <span className="hint" style={{ fontWeight: 600, color: isPhoneValid ? '#16a34a' : undefined }}>
                        {phone.length}/10
                      </span>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="field full">
                    <label>
                      Address <span className="opt">optional</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Flat 102, Sector 12, Dwarka, New Delhi"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                    />
                  </div>

                  {/* Emergency Contact */}
                  <div className="field full">
                    <label>
                      Emergency contact <span className="opt">optional</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. +91 98111 22334"
                      value={emergencyContact}
                      onChange={e => setEmergencyContact(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Employment */}
              <div className="section">
                <div className="section-title">Employment</div>
                <div className="field full">
                  <label style={{ marginBottom: '4px' }}>Driver type</label>
                  <div className="type-select">
                    {driverTypes.map(type => (
                      <button
                        key={type}
                        type="button"
                        className={driverType === type ? 'active' : ''}
                        onClick={() => setDriverType(type)}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION 3: Driving license */}
              <div className="section">
                <div className="section-title">Driving license</div>
                <div className="grid">
                  <div className="field">
                    <label>
                      License number <span className="opt">optional</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. DL-0420180092341"
                      value={licenseNumber}
                      onChange={e => setLicenseNumber(e.target.value)}
                    />
                  </div>

                  <div className="field">
                    <label>
                      Expiry date <span className="opt">optional</span>
                    </label>
                    <DatePicker value={licenseExpiry} onChange={d => setLicenseExpiry(d)} />
                  </div>

                  <div className="field full">
                    <label>
                      License copy <span className="opt">optional</span>
                    </label>
                    <div className="upload compact" onClick={() => licenseInputRef.current?.click()}>
                      {licensePhotoPreview ? (
                        isPdfDocument(licenseFileName, licensePhotoPreview) ? (
                          <div className="icon" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
                            <FileText size={18} />
                          </div>
                        ) : (
                          <img
                            src={licensePhotoPreview}
                            alt="License preview"
                            style={{ width: '38px', height: '38px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                          />
                        )
                      ) : (
                        <span className="icon">
                          <FileText size={18} />
                        </span>
                      )}
                      <div className="txt" style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {licenseFileName
                            ? licenseFileName
                            : licensePhotoPreview
                            ? 'License document uploaded'
                            : 'Click to upload a copy of the license'}
                        </div>
                        <div>JPG, PNG or PDF, up to 10MB</div>
                      </div>
                      {(licensePhotoPreview || licenseFileName) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLicensePhotoPreview(null);
                            setLicenseFileName('');
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--danger)',
                            padding: '4px',
                            cursor: 'pointer'
                          }}
                          title="Remove license copy"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 4: Assignment & payroll */}
              <div className="section" style={{ marginBottom: '8px' }}>
                <div className="section-title">Assignment & payroll</div>
                <div className="grid">
                  <div className="field">
                    <label>
                      Assigned vehicle <span className="opt">optional</span>
                    </label>
                    <select
                      className={!assignedVehicle || assignedVehicle === '—' ? 'empty' : ''}
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

                  <div className="field">
                    <label>Status</label>
                    <select
                      value={status}
                      onChange={e => setStatus(e.target.value as 'On duty' | 'Off duty')}
                    >
                      <option value="On duty">On duty</option>
                      <option value="Off duty">Off duty</option>
                    </select>
                  </div>

                  <div className="field">
                    <label>
                      Monthly salary <span className="opt">optional</span>
                    </label>
                    <div className="unit-input">
                      <span className="prefix">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        placeholder="18,000"
                        style={{ paddingLeft: '26px' }}
                        value={monthlySalary}
                        onChange={e => setMonthlySalary(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label>Joining date</label>
                    <DatePicker value={joiningDate} onChange={d => setJoiningDate(d)} />
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <span className="foot-note">
                Fields marked <span className="req">*</span> are required
              </span>
              <div className="btn-group">
                <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-action"
                  disabled={isSubmitting || isPhoneInvalid}
                >
                  {isSubmitting ? 'Saving...' : 'Save driver'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
