import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, Trash2, Sparkles, FileText, AlertCircle, X, Check } from 'lucide-react';
import { useFleet } from '../../../context/FleetContext';
import { MinimalVoiceFiller } from '../../common/MinimalVoiceFiller';
import { DatePicker } from '../../common/DatePicker';

interface AddContractModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddContractModal: React.FC<AddContractModalProps> = ({ isOpen, onClose }) => {
  const { vehicles, drivers, addDepartmentContract } = useFleet();

  const [contractNumber, setContractNumber] = useState('');
  const [departmentName, setDepartmentName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [vehicle, setVehicle] = useState(vehicles[0]?.registrationNumber || '');
  const [driverName, setDriverName] = useState(drivers[0]?.name || '');
  const [monthlyBaseAmount, setMonthlyBaseAmount] = useState('');
  const [includedKmPerMonth, setIncludedKmPerMonth] = useState('');
  const [extraKmRate, setExtraKmRate] = useState('');
  const [extraHourRate, setExtraHourRate] = useState('');
  const [nightChargePerDay, setNightChargePerDay] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  });
  const [docName, setDocName] = useState('');
  const [docPreview, setDocPreview] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setDocPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    // Reset inputs so the same file can be selected again if needed
    e.target.value = '';
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(digitsOnly);
    if (errorMsg) setErrorMsg('');
  };

  const handleAutoGenerateContractNo = () => {
    const randomSuffix = Math.floor(Math.random() * 90 + 10);
    const prefix = departmentName.trim()
      ? departmentName.trim().substring(0, 3).toUpperCase()
      : 'DEP';
    setContractNumber(`CNT-${new Date().getFullYear()}-${prefix}-0${randomSuffix}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!departmentName.trim()) {
      setErrorMsg('Department / Client name is required.');
      return;
    }

    if (!monthlyBaseAmount || Number(monthlyBaseAmount) <= 0) {
      setErrorMsg('Please enter a valid monthly base contract amount.');
      return;
    }

    if (phone.trim() && phone.trim().length !== 10) {
      setPhoneTouched(true);
      setErrorMsg('Contact phone number must be exactly 10 digits.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const finalContractNumber = contractNumber.trim() ||
      `CNT-${new Date().getFullYear()}-DEP-0${Math.floor(Math.random() * 90 + 10)}`;

    try {
      const res = await addDepartmentContract({
        contractNumber: finalContractNumber,
        departmentName: departmentName.trim(),
        contactPerson: contactPerson.trim() || 'Officer in Charge',
        phone: phone.trim() ? `+91 ${phone.trim()}` : '—',
        vehicle,
        driverName: driverName || '—',
        monthlyBaseAmount: Number(monthlyBaseAmount),
        includedKmPerMonth: Number(includedKmPerMonth) || 2500,
        includedHoursPerMonth: 300,
        extraKmRate: Number(extraKmRate) || 14,
        extraHourRate: Number(extraHourRate) || 120,
        nightChargePerDay: Math.max(0, Number(nightChargePerDay) || 0),
        startDate,
        endDate,
        status: 'Active',
        documentFile: docPreview || docName || null
      });

      if (res && !res.success && res.error) {
        setErrorMsg(res.error);
        setIsSubmitting(false);
        return;
      }

      setDepartmentName('');
      setContractNumber('');
      setContactPerson('');
      setPhone('');
      setMonthlyBaseAmount('');
      setIncludedKmPerMonth('');
      setExtraKmRate('');
      setExtraHourRate('');
      setNightChargePerDay('');
      setDocName('');
      setDocPreview(null);
      setErrorMsg('');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to register contract.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPhoneValid = phone.length === 10;
  const isPhoneInvalid = phoneTouched && phone.length > 0 && !isPhoneValid;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog app-form-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <h3 className="modal-title">
              <span className="modal-title-icon">
                <FileText size={16} />
              </span>
              Add department contract
            </h3>
            <span className="modal-subtitle">
              Register a new government or corporate fleet contract
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose} type="button" aria-label="Close">
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <MinimalVoiceFiller
              formType="general"
              context={{
                vehicles: vehicles.map(v => v.registrationNumber),
                drivers: drivers.map(d => d.name)
              }}
              placeholder="Fill by speaking — try 'Public Works Department, monthly rate 85000'"
              onApplyParsedData={(data) => {
                if (data.departmentName) setDepartmentName(data.departmentName);
                if (data.vehicle) setVehicle(data.vehicle);
                if (data.driverName) setDriverName(data.driverName);
                if (data.amount) setMonthlyBaseAmount(data.amount);
              }}
            />

            {errorMsg && (
              <div className="form-error" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={15} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* ========================================================
                SECTION 1: CONTRACT PHOTO / DOCUMENT (FIRST STEP)
                ======================================================== */}
            <div className="section">
              <div className="section-title">
                <span>Contract document & photo</span>
                <span className="opt" style={{ color: 'var(--accent)', fontWeight: 600 }}>Step 1 — Upload photo / PDF</span>
              </div>

              {/* Hidden file inputs for Camera and File Picker */}
              <input
                type="file"
                ref={cameraInputRef}
                accept="image/*"
                capture="environment"
                onChange={handleDocUpload}
                style={{ display: 'none' }}
              />
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleDocUpload}
                style={{ display: 'none' }}
              />

              {docName || docPreview ? (
                /* Uploaded Document / Photo Preview Card */
                <div
                  style={{
                    border: '1px solid var(--line)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    background: 'var(--accent-soft)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    {docPreview && docPreview.startsWith('data:image') ? (
                      <img
                        src={docPreview}
                        alt="Contract Photo"
                        style={{
                          width: '44px',
                          height: '44px',
                          objectFit: 'cover',
                          borderRadius: '6px',
                          border: '1px solid var(--line)',
                          flexShrink: 0
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '8px',
                          background: 'var(--panel)',
                          border: '1px solid var(--line)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--accent)',
                          flexShrink: 0
                        }}
                      >
                        <FileText size={20} />
                      </div>
                    )}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {docName || 'Contract Photo / Copy'}
                        </span>
                        <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#16a34a', background: 'rgba(34, 197, 94, 0.12)', padding: '1px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <Check size={11} /> Attached
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--ink-soft)', marginTop: '2px' }}>
                        Contract copy saved with this record
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      style={{
                        background: 'var(--panel)',
                        border: '1px solid var(--line)',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        color: 'var(--ink-soft)',
                        cursor: 'pointer'
                      }}
                    >
                      Re-take
                    </button>
                    <button
                      type="button"
                      onClick={() => { setDocName(''); setDocPreview(null); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--danger)',
                        padding: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title="Remove document"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ) : (
                /* Clean Upload / Camera Zone */
                <div
                  style={{
                    border: '1.5px dashed var(--line)',
                    borderRadius: '8px',
                    padding: '16px 14px',
                    background: 'var(--panel)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 14px',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        borderRadius: '7px',
                        background: 'var(--accent)',
                        color: '#ffffff',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <Camera size={15} /> Take Contract Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 14px',
                        fontSize: '12.5px',
                        fontWeight: 560,
                        borderRadius: '7px',
                        background: 'var(--accent-soft)',
                        color: 'var(--accent)',
                        border: '1px solid var(--line)',
                        cursor: 'pointer'
                      }}
                    >
                      <Upload size={15} /> Browse PDF / Image
                    </button>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--ink-faint)' }}>
                    Capture paper agreement directly with camera, or attach signed PDF / tender scan
                  </div>
                </div>
              )}
            </div>

            {/* ========================================================
                SECTION 2: CLIENT & CONTRACT DETAILS
                ======================================================== */}
            <div className="section">
              <div className="section-title">Client & contract</div>
              <div className="grid">
                <div className="field full">
                  <label>
                    Department / client name<span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Public Works Department (PWD)"
                    value={departmentName}
                    onChange={e => setDepartmentName(e.target.value)}
                    required
                  />
                </div>

                <div className="field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label>Contract / tender no.</label>
                    <button
                      type="button"
                      className="link"
                      onClick={handleAutoGenerateContractNo}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent)',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                    >
                      <Sparkles size={11} /> Auto-generate
                    </button>
                  </div>
                  <div className="autogen">
                    <input
                      type="text"
                      placeholder="e.g. CNT-2026-PWD-01"
                      value={contractNumber}
                      onChange={e => setContractNumber(e.target.value)}
                    />
                  </div>
                  <span className="hint">Auto-generated — edit if you have an official number</span>
                </div>

                <div className="field">
                  <label>
                    Contact person <span className="opt">optional</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Er. R. K. Singhal"
                    value={contactPerson}
                    onChange={e => setContactPerson(e.target.value)}
                  />
                </div>

                <div className="field full">
                  <label>
                    Contact phone <span className="opt">optional</span>
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
                      placeholder="10-digit mobile number"
                      value={phone}
                      onChange={handlePhoneChange}
                      onBlur={() => setPhoneTouched(true)}
                      style={{
                        borderColor: isPhoneInvalid ? 'var(--danger)' : undefined
                      }}
                    />
                  </div>
                  <div className="hint-row">
                    <span className="hint" style={{ color: isPhoneInvalid ? 'var(--danger)' : isPhoneValid ? '#16a34a' : undefined }}>
                      {isPhoneInvalid
                        ? 'Must be exactly 10 digits'
                        : isPhoneValid
                        ? 'Valid 10-digit number'
                        : 'Used for billing alerts and payment reminders'}
                    </span>
                    <span className="hint" style={{ fontWeight: 600, color: isPhoneValid ? '#16a34a' : undefined }}>
                      {phone.length}/10
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================
                SECTION 3: FLEET ALLOCATION
                ======================================================== */}
            <div className="section">
              <div className="section-title">Fleet allocation</div>
              <div className="grid">
                <div className="field">
                  <label>
                    Assigned vehicle <span className="opt">optional</span>
                  </label>
                  <select
                    className={vehicles.length === 0 ? 'empty' : ''}
                    value={vehicle}
                    onChange={e => setVehicle(e.target.value)}
                  >
                    {vehicles.length === 0 && <option value="">No vehicles registered — add one first</option>}
                    {vehicles.map(v => (
                      <option key={v.id} value={v.registrationNumber}>
                        {v.registrationNumber} ({v.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>
                    Designated driver <span className="opt">optional</span>
                  </label>
                  <select
                    className={drivers.length === 0 ? 'empty' : ''}
                    value={driverName}
                    onChange={e => setDriverName(e.target.value)}
                  >
                    {drivers.length === 0 && <option value="">No drivers registered — add one first</option>}
                    {drivers.map(d => (
                      <option key={d.id} value={d.name}>
                        {d.name} ({d.driverType || 'Driver'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* ========================================================
                SECTION 4: BILLING RATES & LIMITS
                ======================================================== */}
            <div className="section">
              <div className="section-title">Billing rates & limits</div>
              <div className="grid">
                <div className="field">
                  <label>
                    Monthly base rate<span className="req">*</span>
                  </label>
                  <div className="unit-input">
                    <span className="prefix">₹</span>
                    <input
                      type="number"
                      min="1"
                      placeholder="85,000"
                      style={{ paddingLeft: '26px' }}
                      value={monthlyBaseAmount}
                      onChange={e => setMonthlyBaseAmount(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="field">
                  <label>
                    Included monthly KM <span className="opt">optional</span>
                  </label>
                  <div className="unit-input suffix">
                    <input
                      type="number"
                      min="0"
                      placeholder="2,500"
                      style={{ paddingRight: '54px' }}
                      value={includedKmPerMonth}
                      onChange={e => setIncludedKmPerMonth(e.target.value)}
                    />
                    <span className="suffix-label">km/mo</span>
                  </div>
                </div>

                <div className="field">
                  <label>
                    Extra KM rate <span className="opt">optional</span>
                  </label>
                  <div className="unit-input suffix">
                    <span className="prefix">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="14"
                      style={{ paddingLeft: '26px', paddingRight: '44px' }}
                      value={extraKmRate}
                      onChange={e => setExtraKmRate(e.target.value)}
                    />
                    <span className="suffix-label">/km</span>
                  </div>
                </div>

                <div className="field">
                  <label>
                    Extra hour rate <span className="opt">optional</span>
                  </label>
                  <div className="unit-input suffix">
                    <span className="prefix">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="120"
                      style={{ paddingLeft: '26px', paddingRight: '44px' }}
                      value={extraHourRate}
                      onChange={e => setExtraHourRate(e.target.value)}
                    />
                    <span className="suffix-label">/hr</span>
                  </div>
                </div>

                <div className="field">
                  <label>
                    Night / late shift charge <span className="opt">optional</span>
                  </label>
                  <div className="unit-input suffix">
                    <span className="prefix">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="500"
                      style={{ paddingLeft: '26px', paddingRight: '52px' }}
                      value={nightChargePerDay}
                      onChange={e => setNightChargePerDay(e.target.value)}
                    />
                    <span className="suffix-label">/day</span>
                  </div>
                  <span className="hint">Counted on monthly bill for each night-shift duty day</span>
                </div>
              </div>
            </div>

            {/* ========================================================
                SECTION 5: CONTRACT DURATION & DATES
                ======================================================== */}
            <div className="section" style={{ marginBottom: '8px' }}>
              <div className="section-title">Contract duration & validity</div>
              <div className="grid">
                <div className="field">
                  <label>
                    Contract start date<span className="req">*</span>
                  </label>
                  <DatePicker value={startDate} onChange={d => setStartDate(d)} />
                </div>

                <div className="field">
                  <label>
                    Contract end date<span className="req">*</span>
                  </label>
                  <DatePicker value={endDate} onChange={d => setEndDate(d)} />
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <span className="foot-note">
              Fields marked <span className="req">*</span> are required
            </span>
            <div className="btn-group">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary-action"
                disabled={isSubmitting || isPhoneInvalid}
              >
                {isSubmitting ? 'Saving...' : 'Save contract'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
