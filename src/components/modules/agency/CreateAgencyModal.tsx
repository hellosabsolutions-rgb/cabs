import React, { useState } from 'react';
import { useAgency } from '../../../context/AgencyContext';
import {
  X,
  Building2,
  Briefcase,
  Phone,
  Mail,
  MapPin,
  FileText,
  Loader2,
  Plus
} from 'lucide-react';
import { LocationPickerModal } from '../../common/LocationPickerModal';

interface CreateAgencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const businessTypes = [
  'Department & Tour Operator',
  'Cab & Taxi Fleet',
  'Outstation & Corporate Travel',
  'Goods & Logistics',
  'Other'
];

export const CreateAgencyModal: React.FC<CreateAgencyModalProps> = ({ isOpen, onClose }) => {
  const { createAgency } = useAgency();

  const [name, setName] = useState('');
  const [businessType, setBusinessType] = useState('Department & Tour Operator');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [mapPickerOpen, setMapPickerOpen] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Agency name is required.');
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
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        gstin: gstin.trim() || undefined,
        pan: pan.trim() || undefined
      });

      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.error || 'Failed to create agency');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 540 }}
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-title">
              <Building2 size={18} color="var(--accent)" />
              Add New Company / Agency
            </div>
            <div className="modal-subtitle">
              Set up another fleet agency or branch to manage separately
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {errorMsg && (
              <div
                style={{
                  background: 'var(--danger-bg)',
                  color: 'var(--danger)',
                  border: '1px solid rgba(255, 92, 92, 0.25)',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              >
                {errorMsg}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Agency / Company Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Punjab Royal Cabs & Tour Travels"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Fleet Business Type</label>
                <select
                  className="form-input"
                  value={businessType}
                  onChange={e => setBusinessType(e.target.value)}
                >
                  {businessTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Contact Phone</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="e.g. +91 98765 43210"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Office Email</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="e.g. info@agency.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
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
                      cursor: 'pointer'
                    }}
                  >
                    <MapPin size={11} /> Pin on Map
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Sector 17, Main Road"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    style={{ paddingRight: '70px' }}
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
                      padding: '3px 8px',
                      fontSize: '11px',
                      color: 'var(--text)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <MapPin size={11} color="var(--accent)" /> Map
                  </button>
                </div>
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">City</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Chandigarh"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">State</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Punjab"
                  value={state}
                  onChange={e => setState(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">GSTIN (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="03AAAAA0000A1Z5"
                  value={gstin}
                  onChange={e => setGstin(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">PAN (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="AAAAA0000A"
                  value={pan}
                  onChange={e => setPan(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-action" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="spin-loader" /> Creating...
                </>
              ) : (
                <>
                  <Plus size={15} /> Create & Switch to Agency
                </>
              )}
            </button>
          </div>
        </form>
      </div>

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
