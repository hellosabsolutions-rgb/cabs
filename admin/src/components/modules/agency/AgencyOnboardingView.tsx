import React, { useState } from 'react';
import { useAgency } from '../../../context/AgencyContext';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import {
  Building2,
  Briefcase,
  MapPin,
  Phone,
  Mail,
  FileText,
  ShieldCheck,
  Loader2,
  LogOut,
  Sun,
  Moon,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Car,
  Navigation,
  Layers,
  BadgeCheck
} from 'lucide-react';
import { LocationPickerModal } from '../../common/LocationPickerModal';
import { MinimalVoiceFiller } from '../../common/MinimalVoiceFiller';

const businessTypes = [
  'Department & Tour Operator',
  'Cab & Taxi Fleet',
  'Outstation & Corporate Travel',
  'Goods & Logistics',
  'Other'
];

interface StepItem {
  id: number;
  title: string;
  subtitle: string;
  icon: React.ElementType;
}

const STEPS: StepItem[] = [
  {
    id: 1,
    title: 'Company Profile',
    subtitle: 'Name & fleet category',
    icon: Building2
  },
  {
    id: 2,
    title: 'Contact & Base',
    subtitle: 'Location & 10-digit phone',
    icon: MapPin
  },
  {
    id: 3,
    title: 'Tax & Launch',
    subtitle: 'GSTIN, PAN & launch',
    icon: ShieldCheck
  }
];

export const AgencyOnboardingView: React.FC = () => {
  const { createAgency } = useAgency();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  // Multi-step state
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form inputs
  const [name, setName] = useState('');
  const [businessType, setBusinessType] = useState('Department & Tour Operator');
  const [phone, setPhone] = useState(user?.phone ? user.phone.replace(/\D/g, '').slice(-10) : '');
  const [email, setEmail] = useState(user?.email || '');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('New Delhi');
  const [state, setState] = useState('Delhi');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');

  // UI & Validation states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [mapPickerOpen, setMapPickerOpen] = useState(false);

  // Clean and validate 10-digit phone number
  const validatePhone = (rawPhone: string): { isValid: boolean; error: string; cleanDigits: string } => {
    let clean = rawPhone.replace(/\D/g, '');

    // Strip leading international code if present (+91 or 91 or 0)
    if (clean.length === 12 && clean.startsWith('91')) {
      clean = clean.slice(2);
    } else if (clean.length === 11 && clean.startsWith('0')) {
      clean = clean.slice(1);
    }

    if (!clean) {
      return { isValid: false, error: 'Contact phone number is required.', cleanDigits: clean };
    }

    if (clean.length < 10) {
      return {
        isValid: false,
        error: `Phone number must be exactly 10 digits (currently ${clean.length} digits).`,
        cleanDigits: clean
      };
    }

    if (clean.length > 10) {
      return {
        isValid: false,
        error: `Phone number cannot exceed 10 digits (currently ${clean.length} digits).`,
        cleanDigits: clean
      };
    }

    if (!/^[6-9]/.test(clean)) {
      return {
        isValid: false,
        error: 'Phone number should begin with a valid mobile prefix (6, 7, 8, or 9).',
        cleanDigits: clean
      };
    }

    return { isValid: true, error: '', cleanDigits: clean };
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const digitsOnly = rawVal.replace(/\D/g, '').slice(0, 10);
    setPhone(digitsOnly);

    if (phoneTouched) {
      const validation = validatePhone(digitsOnly);
      setPhoneError(validation.error);
    }
  };

  const handlePhoneBlur = () => {
    setPhoneTouched(true);
    const validation = validatePhone(phone);
    setPhoneError(validation.error);
  };

  // Custom parser for the reusable MinimalVoiceFiller
  const parseAgencyVoice = (text: string): { data: Record<string, any>; count: number } => {
    const data: Record<string, any> = {};
    const lower = text.toLowerCase().trim();

    // 1. Phone detection
    const digits = text.replace(/\D/g, '');
    if (digits.length >= 10) {
      data.phone = digits.slice(-10);
    }

    // 2. Business Type matching
    for (const bType of businessTypes) {
      const bLower = bType.toLowerCase();
      if (lower.includes(bLower) || lower.includes(bLower.split('&')[0].trim())) {
        data.businessType = bType;
        break;
      }
    }

    // 3. Email
    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/) || lower.match(/(?:email|mail)\s*[:=]?\s*([\w.-]+(?:\s*at\s*|\s*@\s*)[\w.-]+(?:\s*dot\s*|\s*\.\s*)\w+)/i);
    if (emailMatch) {
      data.email = (emailMatch[1] || emailMatch[0])
        .toLowerCase()
        .replace(/\s+at\s+/g, '@')
        .replace(/\s+dot\s+/g, '.')
        .replace(/\s+/g, '');
    }

    // 4. City
    const cityMatch = lower.match(/(?:city|shahar|nagar)\s*[:=]?\s*([a-zA-Z\s]+?)(?=\s+(?:state|rajya|phone|mobile|email|gst|pan|$))/i);
    if (cityMatch && cityMatch[1].trim()) {
      const c = cityMatch[1].trim();
      data.city = c.charAt(0).toUpperCase() + c.slice(1);
    }

    // 5. State
    const stateMatch = lower.match(/(?:state|rajya|pradesh)\s*[:=]?\s*([a-zA-Z\s]+?)(?=\s+(?:city|phone|mobile|email|gst|pan|$))/i);
    if (stateMatch && stateMatch[1].trim()) {
      const s = stateMatch[1].trim();
      data.state = s.charAt(0).toUpperCase() + s.slice(1);
    }

    // 6. GSTIN
    const gstinMatch = text.match(/\b\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}\b/i) || lower.match(/(?:gst|gstin)\s*[:=]?\s*([a-zA-Z0-9]{15})/i);
    if (gstinMatch) {
      data.gstin = (gstinMatch[1] || gstinMatch[0]).replace(/\s+/g, '').toUpperCase();
    }

    // 7. PAN
    const panMatch = text.match(/\b[A-Z]{5}\d{4}[A-Z]{1}\b/i) || lower.match(/(?:pan|pancard)\s*[:=]?\s*([a-zA-Z0-9]{10})/i);
    if (panMatch) {
      data.pan = (panMatch[1] || panMatch[0]).replace(/\s+/g, '').toUpperCase();
    }

    // 8. Company Name
    const nameMatch = lower.match(/(?:company|agency|firm|travels|transport|logistics)\s*(?:name|is)?\s*[:=]?\s*([a-zA-Z0-9\s&.-]+?)(?=\s+(?:type|phone|mobile|email|city|state|gst|pan|$))/i);
    if (nameMatch && nameMatch[1].trim()) {
      data.name = nameMatch[1].trim().split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    } else if (!data.phone && !data.email && !data.city && text.trim().length > 3 && !lower.includes('next') && !lower.includes('back')) {
      data.name = text.trim().split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }

    return {
      data,
      count: Object.keys(data).length
    };
  };

  // Step 1 Validation
  const validateStep1 = (): boolean => {
    setErrorMsg('');
    if (!name.trim()) {
      setErrorMsg('Please enter your Company or Agency Name.');
      return false;
    }
    if (name.trim().length < 3) {
      setErrorMsg('Agency Name should be at least 3 characters long.');
      return false;
    }
    return true;
  };

  // Step 2 Validation
  const validateStep2 = (): boolean => {
    setErrorMsg('');
    setPhoneTouched(true);
    const phoneVal = validatePhone(phone);
    if (!phoneVal.isValid) {
      setPhoneError(phoneVal.error);
      setErrorMsg(phoneVal.error);
      return false;
    }
    setPhoneError('');

    if (!city.trim() || !state.trim()) {
      setErrorMsg('Please enter both City and State for your agency headquarters.');
      return false;
    }

    return true;
  };

  // Navigation handlers
  const handleNext = () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      if (validateStep2()) {
        setCurrentStep(3);
      }
    }
  };

  const handleBack = () => {
    setErrorMsg('');
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3);
    }
  };

  const fillDemoAgency = () => {
    setName('Apex Mobility & Fleet Solutions');
    setBusinessType('Department & Tour Operator');
    setPhone('9810012345');
    setPhoneError('');
    setEmail(user?.email || 'contact@apexmobility.in');
    setAddress('Plot 42, Transport Nagar, Sector 62');
    setCity('Noida');
    setState('Uttar Pradesh');
    setGstin('07AAACA1234B1Z2');
    setPan('AAACA1234B');
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }

    if (!validateStep2()) {
      setCurrentStep(2);
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      const res = await createAgency({
        name: name.trim(),
        businessType,
        phone: cleanPhone || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim(),
        state: state.trim(),
        gstin: gstin.trim() || undefined,
        pan: pan.trim() || undefined
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Failed to create agency. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Live phone validation preview
  const currentDigits = phone.replace(/\D/g, '');
  const isPhoneValid = currentDigits.length === 10 && /^[6-9]/.test(currentDigits);

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        background: 'var(--surface)',
        color: 'var(--text)',
        fontFamily: "'Poppins', sans-serif",
        overflowX: 'hidden'
      }}
    >
      {/* ──────────────── LEFT PANEL: MULTI-STEP FORM ──────────────── */}
      <div
        style={{
          flex: '1 1 55%',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '32px 4.5vw 24px',
          background: 'var(--surface)',
          overflowY: 'auto'
        }}
      >
        {/* Top Header Row: Logo, Theme & Logout */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            maxWidth: '560px',
            margin: '0 auto 16px'
          }}
        >
          {/* Logo Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                background: theme === 'dark' ? '#14273d' : '#eef6ff',
                border: '1px solid rgba(22, 135, 245, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                padding: '2px'
              }}
            >
              <img
                src={theme === 'dark' ? '/logo-dark.jpg' : '/logo-light.png'}
                alt="KABPRO Logo"
                style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '8px' }}
                onError={(e) => {
                  (e.currentTarget.parentNode as HTMLElement).innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="16 18 22 12 16 6"></polyline>
                      <polyline points="8 6 2 12 8 18"></polyline>
                    </svg>
                  `;
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.3px', color: 'var(--text)' }}>
                KABPRO
              </span>
              <span style={{ fontSize: '10.5px', color: 'var(--text-faint)', fontWeight: 500, marginTop: '-2px' }}>
                Fleet Management OS
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title="Toggle Theme"
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                width: 34,
                height: 34,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-dim)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            <button
              type="button"
              onClick={logout}
              title="Sign Out"
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                height: 34,
                padding: '0 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--text-dim)',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 500,
                transition: 'all 0.15s ease'
              }}
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div style={{ width: '100%', maxWidth: '560px', margin: '0 auto', padding: '4px 0' }}>
          {/* Welcome Heading */}
          <div style={{ marginBottom: '18px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(22, 135, 245, 0.1)',
                border: '1px solid rgba(22, 135, 245, 0.25)',
                color: 'var(--accent)',
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '11.5px',
                fontWeight: 600,
                marginBottom: '8px'
              }}
            >
              <Sparkles size={12} />
              <span>Agency Onboarding</span>
            </div>
            <h1
              style={{
                fontSize: '28px',
                fontWeight: 700,
                letterSpacing: '-0.5px',
                color: 'var(--text)',
                margin: '0 0 6px'
              }}
            >
              Welcome, {user?.name || 'Fleet Partner'}!
            </h1>
            <p
              style={{
                fontSize: '13px',
                color: 'var(--text-dim)',
                lineHeight: 1.5,
                margin: 0
              }}
            >
              Set up your fleet agency workspace in 3 simple steps to manage vehicles, drivers, duty logs, and billing.
            </p>
          </div>

          {/* ──────────────── REUSABLE MINIMAL VOICE FORM FILLER ──────────────── */}
          <div style={{ marginBottom: '16px' }}>
            <MinimalVoiceFiller
              formType="general"
              placeholder="Speak details to auto-fill (e.g. 'Bisht Travel phone 9557445643 New Delhi Delhi')"
              customParser={parseAgencyVoice}
              onApplyParsedData={(data) => {
                if (data.name) setName(data.name);
                if (data.businessType) setBusinessType(data.businessType);
                if (data.phone) {
                  setPhone(data.phone);
                  setPhoneTouched(true);
                  const val = validatePhone(data.phone);
                  setPhoneError(val.error);
                }
                if (data.email) setEmail(data.email);
                if (data.address) setAddress(data.address);
                if (data.city) setCity(data.city);
                if (data.state) setState(data.state);
                if (data.gstin) setGstin(data.gstin);
                if (data.pan) setPan(data.pan);
              }}
            />
          </div>

          {/* ──────────────── STEPPER PROGRESS BAR ──────────────── */}
          <div
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '14px 18px',
              marginBottom: '22px'
            }}
          >
            {/* Top Stepper Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  top: '18px',
                  left: '32px',
                  right: '32px',
                  height: '2px',
                  background: 'var(--border)',
                  zIndex: 0
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '18px',
                  left: '32px',
                  width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : 'calc(100% - 64px)',
                  height: '2px',
                  background: 'var(--accent)',
                  transition: 'width 0.3s ease',
                  zIndex: 0
                }}
              />

              {STEPS.map((s) => {
                const isDone = currentStep > s.id;
                const isActive = currentStep === s.id;
                const IconComponent = s.icon;

                return (
                  <div
                    key={s.id}
                    onClick={() => {
                      if (s.id < currentStep) {
                        setCurrentStep(s.id as 1 | 2 | 3);
                      }
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      position: 'relative',
                      zIndex: 1,
                      cursor: s.id < currentStep ? 'pointer' : 'default'
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: isDone
                          ? '#22c55e'
                          : isActive
                          ? 'var(--accent)'
                          : 'var(--surface-3)',
                        color: isDone || isActive ? '#ffffff' : 'var(--text-faint)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: isActive ? '3px solid rgba(22, 135, 245, 0.25)' : '2px solid var(--border)',
                        boxShadow: isActive ? '0 0 14px rgba(22, 135, 245, 0.35)' : 'none',
                        transition: 'all 0.25s ease'
                      }}
                    >
                      {isDone ? (
                        <CheckCircle2 size={18} strokeWidth={2.5} />
                      ) : (
                        <IconComponent size={16} />
                      )}
                    </div>

                    <span
                      style={{
                        fontSize: '11.5px',
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? 'var(--text)' : 'var(--text-faint)',
                        marginTop: '6px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {s.title}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Step Subtitle status */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '12px',
                paddingTop: '10px',
                borderTop: '1px solid var(--border-soft)',
                fontSize: '11px',
                color: 'var(--text-faint)'
              }}
            >
              <span>
                Step <strong>{currentStep}</strong> of 3: {STEPS[currentStep - 1].subtitle}
              </span>
              <span style={{ fontWeight: 600, color: 'var(--accent)' }}>
                {currentStep === 1 ? '33% Completed' : currentStep === 2 ? '66% Completed' : '99% Ready'}
              </span>
            </div>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div
              style={{
                background: 'var(--danger-bg)',
                color: 'var(--danger)',
                border: '1px solid rgba(241, 91, 74, 0.3)',
                padding: '11px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                animation: 'slideInDown 0.2s ease'
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* ──────── STEP 1: COMPANY PROFILE ──────── */}
            {currentStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', animation: 'fadeIn 0.25s ease' }}>
                {/* Agency Name */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13.5px',
                      fontWeight: 500,
                      marginBottom: '7px',
                      color: 'var(--text)'
                    }}
                  >
                    Company / Agency Name <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Building2
                      size={17}
                      style={{
                        position: 'absolute',
                        left: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-faint)'
                      }}
                    />
                    <input
                      type="text"
                      placeholder="e.g. Bisht Travel & Logistics Pvt Ltd"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      autoFocus
                      style={{
                        width: '100%',
                        height: '46px',
                        padding: '0 14px 0 42px',
                        borderRadius: '8px',
                        border: '1.5px solid var(--border)',
                        background: 'var(--surface)',
                        color: 'var(--text)',
                        fontSize: '13.5px',
                        outline: 'none',
                        transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'var(--accent)';
                        e.target.style.boxShadow = '0 0 0 3px rgba(22, 135, 245, 0.15)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'var(--border)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-faint)', marginTop: '4px', display: 'block' }}>
                    This will be the official name shown on all invoices, contracts, and trip duty slips.
                  </span>
                </div>

                {/* Fleet Business Type */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13.5px',
                      fontWeight: 500,
                      marginBottom: '7px',
                      color: 'var(--text)'
                    }}
                  >
                    Fleet Business Type <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Briefcase
                      size={17}
                      style={{
                        position: 'absolute',
                        left: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-faint)'
                      }}
                    />
                    <select
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      style={{
                        width: '100%',
                        height: '46px',
                        padding: '0 14px 0 42px',
                        borderRadius: '8px',
                        border: '1.5px solid var(--border)',
                        background: 'var(--surface)',
                        color: 'var(--text)',
                        fontSize: '13.5px',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'var(--accent)';
                        e.target.style.boxShadow = '0 0 0 3px rgba(22, 135, 245, 0.15)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'var(--border)';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      {businessTypes.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Official Email */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13.5px',
                      fontWeight: 500,
                      marginBottom: '7px',
                      color: 'var(--text)'
                    }}
                  >
                    Official Email <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>(For alerts and invoice dispatches)</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail
                      size={17}
                      style={{
                        position: 'absolute',
                        left: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-faint)'
                      }}
                    />
                    <input
                      type="email"
                      placeholder="e.g. bravim.work@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{
                        width: '100%',
                        height: '46px',
                        padding: '0 14px 0 42px',
                        borderRadius: '8px',
                        border: '1.5px solid var(--border)',
                        background: 'var(--surface)',
                        color: 'var(--text)',
                        fontSize: '13.5px',
                        outline: 'none',
                        transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'var(--accent)';
                        e.target.style.boxShadow = '0 0 0 3px rgba(22, 135, 245, 0.15)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'var(--border)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>

                {/* Step 1 Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={fillDemoAgency}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent)',
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: 600,
                      padding: 0
                    }}
                  >
                    <Sparkles size={13} /> Auto-fill Sample Details
                  </button>

                  <button
                    type="button"
                    onClick={handleNext}
                    style={{
                      height: '44px',
                      padding: '0 24px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'var(--accent)',
                      color: '#ffffff',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(22, 135, 245, 0.35)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>Next: Contact & Base</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* ──────── STEP 2: CONTACT & LOCATION ──────── */}
            {currentStep === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', animation: 'fadeIn 0.25s ease' }}>
                {/* Contact Phone with Mandatory 10-Digit Validation */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '7px' }}>
                    <label style={{ fontSize: '13.5px', fontWeight: 500, color: 'var(--text)', margin: 0 }}>
                      Contact Phone <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>

                    {/* Digit Counter Badge */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: isPhoneValid ? '#22c55e' : currentDigits.length > 0 ? 'var(--danger)' : 'var(--text-faint)'
                      }}
                    >
                      {isPhoneValid ? (
                        <>
                          <CheckCircle2 size={12} />
                          <span>10/10 Digits Valid</span>
                        </>
                      ) : (
                        <span>{currentDigits.length}/10 Digits</span>
                      )}
                    </div>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <Phone
                      size={17}
                      style={{
                        position: 'absolute',
                        left: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: phoneError ? 'var(--danger)' : 'var(--text-faint)'
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        left: '38px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'var(--text-dim)',
                        borderRight: '1px solid var(--border)',
                        paddingRight: '8px'
                      }}
                    >
                      +91
                    </div>
                    <input
                      type="tel"
                      placeholder="9557445643"
                      value={phone}
                      onChange={handlePhoneChange}
                      onBlur={handlePhoneBlur}
                      maxLength={10}
                      autoFocus
                      required
                      style={{
                        width: '100%',
                        height: '46px',
                        padding: '0 14px 0 82px',
                        borderRadius: '8px',
                        border: phoneError
                          ? '1.5px solid var(--danger)'
                          : isPhoneValid
                          ? '1.5px solid #22c55e'
                          : '1.5px solid var(--border)',
                        background: 'var(--surface)',
                        color: 'var(--text)',
                        fontSize: '13.5px',
                        fontWeight: 500,
                        letterSpacing: '0.5px',
                        outline: 'none',
                        transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                      }}
                      onFocus={(e) => {
                        if (!phoneError) {
                          e.target.style.borderColor = 'var(--accent)';
                          e.target.style.boxShadow = '0 0 0 3px rgba(22, 135, 245, 0.15)';
                        }
                      }}
                    />
                  </div>

                  {phoneError ? (
                    <div
                      style={{
                        color: 'var(--danger)',
                        fontSize: '12px',
                        marginTop: '5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <AlertCircle size={13} />
                      <span>{phoneError}</span>
                    </div>
                  ) : (
                    <span style={{ fontSize: '11.5px', color: 'var(--text-faint)', marginTop: '4px', display: 'block' }}>
                      Must be a valid 10-digit mobile number for dispatch alerts & driver communication.
                    </span>
                  )}
                </div>

                {/* Office Address with Map Button */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '7px' }}>
                    <label style={{ fontSize: '13.5px', fontWeight: 500, color: 'var(--text)', margin: 0 }}>
                      Office / Hub Address
                    </label>
                    <button
                      type="button"
                      onClick={() => setMapPickerOpen(true)}
                      style={{
                        background: 'rgba(22, 135, 245, 0.1)',
                        border: '1px solid rgba(22, 135, 245, 0.3)',
                        color: 'var(--accent)',
                        borderRadius: '6px',
                        padding: '3px 9px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <MapPin size={12} /> Pin on Map
                    </button>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <MapPin
                      size={17}
                      style={{
                        position: 'absolute',
                        left: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-faint)'
                      }}
                    />
                    <input
                      type="text"
                      placeholder="e.g. Plot 42, Transport Nagar, Phase 2"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      style={{
                        width: '100%',
                        height: '46px',
                        padding: '0 75px 0 42px',
                        borderRadius: '8px',
                        border: '1.5px solid var(--border)',
                        background: 'var(--surface)',
                        color: 'var(--text)',
                        fontSize: '13.5px',
                        outline: 'none'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'var(--accent)';
                        e.target.style.boxShadow = '0 0 0 3px rgba(22, 135, 245, 0.15)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'var(--border)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setMapPickerOpen(true)}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'var(--surface-2)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        padding: '5px 9px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'var(--text)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <MapPin size={12} color="var(--accent)" />
                      Map
                    </button>
                  </div>
                </div>

                {/* City & State (Row) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '13.5px',
                        fontWeight: 500,
                        marginBottom: '7px',
                        color: 'var(--text)'
                      }}
                    >
                      City <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. New Delhi"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        height: '46px',
                        padding: '0 14px',
                        borderRadius: '8px',
                        border: '1.5px solid var(--border)',
                        background: 'var(--surface)',
                        color: 'var(--text)',
                        fontSize: '13.5px',
                        outline: 'none'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'var(--accent)';
                        e.target.style.boxShadow = '0 0 0 3px rgba(22, 135, 245, 0.15)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'var(--border)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '13.5px',
                        fontWeight: 500,
                        marginBottom: '7px',
                        color: 'var(--text)'
                      }}
                    >
                      State <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Delhi"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        height: '46px',
                        padding: '0 14px',
                        borderRadius: '8px',
                        border: '1.5px solid var(--border)',
                        background: 'var(--surface)',
                        color: 'var(--text)',
                        fontSize: '13.5px',
                        outline: 'none'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'var(--accent)';
                        e.target.style.boxShadow = '0 0 0 3px rgba(22, 135, 245, 0.15)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'var(--border)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>

                {/* Step 2 Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={handleBack}
                    style={{
                      height: '44px',
                      padding: '0 18px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--surface-2)',
                      color: 'var(--text)',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <ArrowLeft size={16} />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNext}
                    style={{
                      height: '44px',
                      padding: '0 24px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'var(--accent)',
                      color: '#ffffff',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(22, 135, 245, 0.35)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>Next: Tax & Launch</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* ──────── STEP 3: TAX & LAUNCH ──────── */}
            {currentStep === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', animation: 'fadeIn 0.25s ease' }}>
                {/* GSTIN & PAN (Row) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '13.5px',
                        fontWeight: 500,
                        marginBottom: '7px',
                        color: 'var(--text)'
                      }}
                    >
                      GSTIN <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>(Optional)</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <FileText
                        size={17}
                        style={{
                          position: 'absolute',
                          left: '14px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'var(--text-faint)'
                        }}
                      />
                      <input
                        type="text"
                        placeholder="07AAAAA0000A1Z5"
                        value={gstin}
                        onChange={(e) => setGstin(e.target.value.toUpperCase())}
                        style={{
                          width: '100%',
                          height: '46px',
                          padding: '0 14px 0 42px',
                          borderRadius: '8px',
                          border: '1.5px solid var(--border)',
                          background: 'var(--surface)',
                          color: 'var(--text)',
                          fontSize: '13.5px',
                          outline: 'none',
                          textTransform: 'uppercase'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = 'var(--accent)';
                          e.target.style.boxShadow = '0 0 0 3px rgba(22, 135, 245, 0.15)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'var(--border)';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '13.5px',
                        fontWeight: 500,
                        marginBottom: '7px',
                        color: 'var(--text)'
                      }}
                    >
                      Company PAN <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="AAAAA0000A"
                      value={pan}
                      onChange={(e) => setPan(e.target.value.toUpperCase())}
                      style={{
                        width: '100%',
                        height: '46px',
                        padding: '0 14px',
                        borderRadius: '8px',
                        border: '1.5px solid var(--border)',
                        background: 'var(--surface)',
                        color: 'var(--text)',
                        fontSize: '13.5px',
                        outline: 'none',
                        textTransform: 'uppercase'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'var(--accent)';
                        e.target.style.boxShadow = '0 0 0 3px rgba(22, 135, 245, 0.15)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'var(--border)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>

                {/* Summary Verification Card */}
                <div
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Agency Registration Summary
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        color: '#22c55e',
                        background: 'rgba(34, 197, 94, 0.12)',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <BadgeCheck size={12} /> Ready to Launch
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12.5px' }}>
                    <div>
                      <span style={{ color: 'var(--text-faint)' }}>Agency:</span>{' '}
                      <strong style={{ color: 'var(--text)' }}>{name || 'Not specified'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-faint)' }}>Category:</span>{' '}
                      <strong style={{ color: 'var(--text)' }}>{businessType}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-faint)' }}>Contact Phone:</span>{' '}
                      <strong style={{ color: 'var(--text)' }}>+91 {phone || 'Not specified'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-faint)' }}>Base Location:</span>{' '}
                      <strong style={{ color: 'var(--text)' }}>{city}, {state}</strong>
                    </div>
                  </div>
                </div>

                {/* Step 3 Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={handleBack}
                    style={{
                      height: '46px',
                      padding: '0 20px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--surface-2)',
                      color: 'var(--text)',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <ArrowLeft size={16} />
                    <span>Back</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      flex: 1,
                      marginLeft: '12px',
                      height: '46px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'var(--accent)',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 18px rgba(22, 135, 245, 0.4)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={18} className="spin-loader" />
                        <span>Registering Agency & Launching...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={18} />
                        <span>Register Agency & Launch KABPRO</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '14px 0 0', fontSize: '11px', color: 'var(--text-faint)' }}>
          © {new Date().getFullYear()} KABPRO Logistics & Fleet Management OS • Multi-tenant Agency Architecture
        </div>
      </div>

      {/* ──────────────── RIGHT PANEL: GRAPHIC COMPONENT ──────────────── */}
      <div
        className="onboarding-graphic-panel"
        style={{
          flex: '1 1 45%',
          minHeight: '100vh',
          background: 'radial-gradient(ellipse at 85% 15%, #144273 0%, #092648 38%, #05182f 72%, #030e1c 100%)',
          padding: '44px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          color: '#ffffff',
          overflow: 'hidden'
        }}
      >
        {/* Ambient Glows */}
        <div
          style={{
            position: 'absolute',
            top: '-15%',
            right: '-15%',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(22, 135, 245, 0.3) 0%, rgba(38, 184, 216, 0.12) 40%, rgba(0, 0, 0, 0) 70%)',
            pointerEvents: 'none'
          }}
        />

        <div
          style={{
            position: 'absolute',
            bottom: '10%',
            left: '-10%',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(34, 197, 94, 0.15) 0%, rgba(22, 135, 245, 0.05) 50%, rgba(0, 0, 0, 0) 70%)',
            pointerEvents: 'none'
          }}
        />

        {/* Top Graphic Header */}
        <div style={{ zIndex: 1 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              fontSize: '12px',
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.9)'
            }}
          >
            <Layers size={14} color="#26b8d8" />
            <span>KABPRO FLEET ECOSYSTEM</span>
          </div>

          <h2
            style={{
              fontSize: '32px',
              fontWeight: 700,
              lineHeight: 1.25,
              letterSpacing: '-0.6px',
              color: '#ffffff',
              margin: '18px 0 10px'
            }}
          >
            Power Your Commercial Fleet with Unified Telematics & Billing
          </h2>
          <p style={{ fontSize: '13.5px', color: 'rgba(255, 255, 255, 0.72)', lineHeight: 1.6, margin: 0, maxWidth: '420px' }}>
            Instant vehicle tracking, driver rosters, Fastag expense automation, and multi-department corporate contracts.
          </p>
        </div>

        {/* Middle: Dynamic Live Agency Preview Card */}
        <div
          style={{
            zIndex: 1,
            margin: '24px 0',
            background: 'rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: '16px',
            padding: '22px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.45)'
          }}
        >
          {/* Card Top Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #1687f5 0%, #26b8d8 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '18px',
                  fontWeight: 800,
                  boxShadow: '0 4px 16px rgba(22, 135, 245, 0.4)'
                }}
              >
                {name ? name.trim().charAt(0).toUpperCase() : 'K'}
              </div>

              <div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.2px' }}>
                  {name.trim() || 'Your Fleet Agency'}
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.65)' }}>
                  {businessType}
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(34, 197, 94, 0.16)',
                border: '1px solid rgba(34, 197, 94, 0.35)',
                color: '#4ade80',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.4px'
              }}
            >
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px #4ade80' }} />
              <span>LIVE PREVIEW</span>
            </div>
          </div>

          {/* Interactive Dynamic Metrics Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              padding: '14px',
              background: 'rgba(0, 0, 0, 0.25)',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div>
              <div style={{ fontSize: '10.5px', color: 'rgba(255, 255, 255, 0.55)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Base Hub
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={12} color="#26b8d8" />
                <span>{city ? `${city}, ${state}` : 'New Delhi, Delhi'}</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '10.5px', color: 'rgba(255, 255, 255, 0.55)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Contact Phone
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Phone size={12} color="#4ade80" />
                <span>{isPhoneValid ? `+91 ${phone}` : phone ? `+91 ${phone} (Validating)` : '10-Digit Mobile Required'}</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '10.5px', color: 'rgba(255, 255, 255, 0.55)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Dispatch Engine
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#38bdf8', marginTop: '2px' }}>
                Active & GPS Ready
              </div>
            </div>

            <div>
              <div style={{ fontSize: '10.5px', color: 'rgba(255, 255, 255, 0.55)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Corporate GST
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: gstin ? '#4ade80' : 'rgba(255, 255, 255, 0.7)', marginTop: '2px' }}>
                {gstin ? gstin : 'Standard Billing'}
              </div>
            </div>
          </div>

          {/* Graphic Fleet SVG Path Mini Visualization */}
          <div
            style={{
              marginTop: '16px',
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'rgba(22, 135, 245, 0.08)',
              border: '1px solid rgba(22, 135, 245, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '8px',
                  background: 'rgba(22, 135, 245, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent)'
                }}
              >
                <Car size={17} />
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff' }}>
                  Smart Dispatch & GPS Telematics
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)' }}>
                  Voice-enabled auto-fill ready across all steps
                </div>
              </div>
            </div>

            <Navigation size={18} color="#26b8d8" />
          </div>
        </div>

        {/* Bottom Highlights */}
        <div style={{ zIndex: 1 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              borderTop: '1px solid rgba(255, 255, 255, 0.12)',
              paddingTop: '18px'
            }}
          >
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>1,000+</div>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '2px' }}>
                Fleet Operations Active
              </div>
            </div>

            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>99.9%</div>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '2px' }}>
                Dispatch Uptime
              </div>
            </div>

            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>Automated</div>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '2px' }}>
                GST & Duty Invoicing
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Map Location Picker Modal */}
      <LocationPickerModal
        isOpen={mapPickerOpen}
        onClose={() => setMapPickerOpen(false)}
        initialAddress={address}
        initialCity={city}
        initialState={state}
        onLocationSelect={(loc) => {
          if (loc.address) setAddress(loc.address);
          if (loc.city) setCity(loc.city);
          if (loc.state) setState(loc.state);
        }}
      />
    </div>
  );
};
