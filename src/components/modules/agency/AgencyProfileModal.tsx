import React, { useState, useEffect } from 'react';
import { useAgency } from '../../../context/AgencyContext';
import { useFleet } from '../../../context/FleetContext';
import {
  X,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  Check,
  Plus,
  Loader2,
  Briefcase
} from 'lucide-react';
import { LocationPickerModal } from '../../common/LocationPickerModal';

interface AgencyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateNew: () => void;
}

const businessTypes = [
  'Department & Tour Operator',
  'Cab & Taxi Fleet',
  'Outstation & Corporate Travel',
  'Goods & Logistics',
  'Other'
];

export const AgencyProfileModal: React.FC<AgencyProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenCreateNew
}) => {
  const { currentAgency, agencies, updateAgency, switchAgency } = useAgency();
  const { vehicles, trips, drivers } = useFleet();

  const [activeTab, setActiveTab] = useState<'profile' | 'agencies'>('profile');
  const [name, setName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [mapPickerOpen, setMapPickerOpen] = useState(false);

  useEffect(() => {
    if (currentAgency) {
      setName(currentAgency.name || '');
      setBusinessType(currentAgency.businessType || 'Department & Tour Operator');
      setPhone(currentAgency.phone || '');
      setEmail(currentAgency.email || '');
      setAddress(currentAgency.address || '');
      setCity(currentAgency.city || '');
      setState(currentAgency.state || '');
      setGstin(currentAgency.gstin || '');
      setPan(currentAgency.pan || '');
    }
  }, [currentAgency]);

  if (!isOpen || !currentAgency) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setIsSaving(true);

    try {
      const id = currentAgency.id || currentAgency._id;
      if (!id) return;

      const res = await updateAgency(id, {
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
        setFeedback({ type: 'success', message: 'Agency profile updated successfully!' });
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to update agency' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 580 }}
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-title">
              <Building2 size={18} color="var(--accent)" />
              {currentAgency.name}
            </div>
            <div className="modal-subtitle">
              Agency Profile, Settings & Multi-Branch Management
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={15} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface-2)',
            padding: '0 20px'
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'profile' ? 'var(--accent)' : 'var(--text-dim)',
              fontWeight: activeTab === 'profile' ? 600 : 500,
              fontSize: '13px',
              borderBottom: activeTab === 'profile' ? '2px solid var(--accent)' : 'none',
              cursor: 'pointer'
            }}
          >
            Company Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('agencies')}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'agencies' ? 'var(--accent)' : 'var(--text-dim)',
              fontWeight: activeTab === 'agencies' ? 600 : 500,
              fontSize: '13px',
              borderBottom: activeTab === 'agencies' ? '2px solid var(--accent)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            All Agencies / Companies ({agencies.length})
          </button>
        </div>

        {activeTab === 'profile' ? (
          <form onSubmit={handleSaveProfile}>
            <div className="modal-body">
              {/* Quick Fleet Metric Strip */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '10px',
                  background: 'var(--surface-2)',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-soft)'
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>FLEET VEHICLES</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)' }}>
                    {vehicles.length}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>ACTIVE DRIVERS</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>
                    {drivers.length}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>TOTAL TRIPS</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#38bdf8' }}>
                    {trips.length}
                  </div>
                </div>
              </div>

              {feedback && (
                <div
                  style={{
                    background: feedback.type === 'success' ? 'rgba(57, 255, 110, 0.12)' : 'var(--danger-bg)',
                    color: feedback.type === 'success' ? 'var(--accent)' : 'var(--danger)',
                    border: `1px solid ${feedback.type === 'success' ? 'rgba(57, 255, 110, 0.3)' : 'rgba(255, 92, 92, 0.3)'}`,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}
                >
                  {feedback.message}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Agency / Company Name *</label>
                <input
                  type="text"
                  className="form-input"
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
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Official Email</label>
                  <input
                    type="email"
                    className="form-input"
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
                    value={city}
                    onChange={e => setCity(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">State</label>
                  <input
                    type="text"
                    className="form-input"
                    value={state}
                    onChange={e => setState(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">GSTIN</label>
                  <input
                    type="text"
                    className="form-input"
                    value={gstin}
                    onChange={e => setGstin(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Company PAN</label>
                  <input
                    type="text"
                    className="form-input"
                    value={pan}
                    onChange={e => setPan(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Close
              </button>
              <button type="submit" className="btn-primary-action" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 size={14} className="spin-loader" /> Saving...
                  </>
                ) : (
                  'Save Agency Profile'
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="modal-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '12.5px', color: 'var(--text-faint)' }}>
                Switch between your registered companies or add a new branch:
              </span>
              <button
                type="button"
                className="btn-primary-action"
                onClick={() => {
                  onClose();
                  onOpenCreateNew();
                }}
                style={{ fontSize: '11.5px', padding: '6px 12px' }}
              >
                <Plus size={13} /> Add Agency
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {agencies.map(agency => {
                const isSelected =
                  (currentAgency.id && currentAgency.id === agency.id) ||
                  (currentAgency._id && currentAgency._id === agency._id);

                return (
                  <div
                    key={agency.id || agency._id}
                    onClick={() => {
                      const id = agency.id || agency._id;
                      if (id) switchAgency(id);
                    }}
                    style={{
                      background: isSelected ? 'var(--accent-dim)' : 'var(--surface-2)',
                      border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: '10px',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '8px',
                          background: 'var(--surface-3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isSelected ? 'var(--accent)' : 'var(--text-dim)'
                        }}
                      >
                        <Building2 size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text)' }}>
                          {agency.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                          {agency.city ? `${agency.city}, ${agency.state || ''}` : agency.businessType}
                        </div>
                      </div>
                    </div>

                    {isSelected ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: 'var(--accent)',
                          color: 'var(--accent-text)',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700
                        }}
                      >
                        <Check size={12} /> Active
                      </span>
                    ) : (
                      <span style={{ fontSize: '11.5px', color: 'var(--text-dim)' }}>
                        Click to Switch
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
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
