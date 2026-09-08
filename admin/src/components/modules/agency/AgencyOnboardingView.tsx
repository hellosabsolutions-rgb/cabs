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
  Sparkles
} from 'lucide-react';
import { LocationPickerModal } from '../../common/LocationPickerModal';

const businessTypes = [
  'Department & Tour Operator',
  'Cab & Taxi Fleet',
  'Outstation & Corporate Travel',
  'Goods & Logistics',
  'Other'
];

export const AgencyOnboardingView: React.FC = () => {
  const { createAgency } = useAgency();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const [name, setName] = useState('');
  const [businessType, setBusinessType] = useState('Department & Tour Operator');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('New Delhi');
  const [state, setState] = useState('Delhi');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [mapPickerOpen, setMapPickerOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Please enter your Company or Agency Name.');
      return;
    }

    if (!city.trim() || !state.trim()) {
      setErrorMsg('Please enter City and State.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createAgency({
        name: name.trim(),
        businessType,
        phone: phone.trim() || undefined,
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

  const fillDemoAgency = () => {
    setName('Apex Mobility & Fleet Solutions');
    setBusinessType('Department & Tour Operator');
    setPhone('+91 98100 12345');
    setEmail(user?.email || 'contact@apexmobility.in');
    setAddress('Transport Nagar, Sector 62');
    setCity('Noida');
    setState('Uttar Pradesh');
    setGstin('07AAACA1234B1Z2');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        padding: '24px 16px',
        position: 'relative'
      }}
    >
      {/* Top right buttons */}
      <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          className="icon-btn"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={logout}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px' }}
        >
          <LogOut size={13} /> Sign Out
        </button>
      </div>

      {/* Onboarding Container */}
      <div
        style={{
          width: '100%',
          maxWidth: 620,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
          animation: 'modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header Hero */}
        <div
          style={{
            padding: '28px 24px',
            background: 'var(--surface-2)',
            borderBottom: '1px solid var(--border-soft)',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '14px',
              background: 'var(--accent-dim)',
              color: 'var(--accent)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px'
            }}
          >
            <Building2 size={26} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px' }}>
            Welcome, {user?.name || 'Partner'}!
          </h2>
          <p style={{ fontSize: '12.5px', color: 'var(--text-faint)', marginTop: '4px', maxWidth: 440, margin: '6px auto 0' }}>
            Register your Company or Fleet Agency. All your vehicles, drivers, contracts, duty logs, and expenses will be managed under this agency.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {errorMsg && (
            <div
              style={{
                background: 'var(--danger-bg)',
                color: 'var(--danger)',
                border: '1px solid rgba(255, 92, 92, 0.25)',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '12.5px',
                marginBottom: '18px'
              }}
            >
              {errorMsg}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Agency Name */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Company / Agency Name *</label>
              <div style={{ position: 'relative' }}>
                <Building2
                  size={16}
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }}
                />
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Sharma Travels & Fleet Logistics Pvt Ltd"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={{ paddingLeft: '38px', fontWeight: 500 }}
                  required
                />
              </div>
            </div>

            {/* Business Type & Phone */}
            <div className="form-row-2">
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Fleet Business Type *</label>
                <div style={{ position: 'relative' }}>
                  <Briefcase
                    size={16}
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }}
                  />
                  <select
                    className="form-input"
                    value={businessType}
                    onChange={e => setBusinessType(e.target.value)}
                    style={{ paddingLeft: '38px' }}
                  >
                    {businessTypes.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Contact Phone</label>
                <div style={{ position: 'relative' }}>
                  <Phone
                    size={16}
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }}
                  />
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="e.g. +91 98101 23456"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    style={{ paddingLeft: '38px' }}
                  />
                </div>
              </div>
            </div>

            {/* Email & Office Address */}
            <div className="form-row-2">
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Official Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail
                    size={16}
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }}
                  />
                  <input
                    type="email"
                    className="form-input"
                    placeholder="e.g. contact@sharmafleet.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={{ paddingLeft: '38px' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Office Address</label>
                  <button
                    type="button"
                    onClick={() => setMapPickerOpen(true)}
                    style={{
                      background: 'var(--accent-dim)',
                      border: '1px solid rgba(57, 255, 110, 0.35)',
                      color: 'var(--accent)',
                      borderRadius: '6px',
                      padding: '2px 8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    title="Open map and drag pointer to pick location"
                  >
                    <MapPin size={12} /> Pin on Map
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <MapPin
                    size={16}
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Plot 42, Transport Nagar"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    style={{ paddingLeft: '38px', paddingRight: '80px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setMapPickerOpen(true)}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'var(--surface-3)',
                      border: '1px solid var(--border)',
                      borderRadius: '5px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      color: 'var(--text)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Select on map"
                  >
                    <MapPin size={11} color="var(--accent)" />
                    Map
                  </button>
                </div>
              </div>
            </div>

            {/* City & State */}
            <div className="form-row-2">
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">City *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. New Delhi"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">State *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Delhi"
                  value={state}
                  onChange={e => setState(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* GSTIN & PAN */}
            <div className="form-row-2">
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">GSTIN (Optional)</label>
                <div style={{ position: 'relative' }}>
                  <FileText
                    size={16}
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 07AAAAA0000A1Z5"
                    value={gstin}
                    onChange={e => setGstin(e.target.value)}
                    style={{ paddingLeft: '38px' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Company PAN (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. AAAAA0000A"
                  value={pan}
                  onChange={e => setPan(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Quick Demo fill */}
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={fillDemoAgency}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent)',
                fontSize: '11.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 500
              }}
            >
              <Sparkles size={13} /> Auto-fill Sample Company Details
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="submit-btn"
            disabled={isSubmitting}
            style={{
              marginTop: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 0',
              fontSize: '14px'
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="spin-loader" />
                Registering Agency...
              </>
            ) : (
              <>
                <ShieldCheck size={18} />
                Register Agency & Launch KABPRO
              </>
            )}
          </button>
        </form>
      </div>

      {/* Interactive Map Location Picker */}
      <LocationPickerModal
        isOpen={mapPickerOpen}
        onClose={() => setMapPickerOpen(false)}
        initialAddress={address}
        initialCity={city}
        initialState={state}
        onLocationSelect={loc => {
          if (loc.address) setAddress(loc.address);
          if (loc.city) setCity(loc.city);
          if (loc.state) setState(loc.state);
        }}
      />
    </div>
  );
};
