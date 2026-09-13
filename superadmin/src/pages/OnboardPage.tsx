import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import {
  Card,
  PageHeader,
  fieldStyle,
  labelStyle,
  primaryBtn,
  secondaryBtn,
} from '../components/ui';

const BUSINESS_TYPES = [
  'Department & Tour Operator',
  'Cab & Taxi Fleet',
  'Outstation & Corporate Travel',
  'Goods & Logistics',
  'Other',
];

const PLANS = ['Trial', 'Starter', 'Growth', 'Enterprise', 'Custom'];

interface Props {
  onDone: (orgId: string) => void;
  onCancel: () => void;
}

export const OnboardPage: React.FC<Props> = ({ onDone, onCancel }) => {
  const { token } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [successNote, setSuccessNote] = useState('');

  const [form, setForm] = useState({
    name: '',
    businessType: 'Cab & Taxi Fleet',
    phone: '',
    email: '',
    city: '',
    state: '',
    address: '',
    gstin: '',
    pan: '',
    notes: '',
    plan: 'Trial',
    projectName: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    adminPhone: '',
    activate: true,
  });

  const set = (key: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessNote('');
    setBusy(true);
    try {
      const res = await apiFetch<{
        organization: { id: string };
        temporaryCredentials?: { email: string };
        message?: string;
      }>('/organizations/onboard', {
        method: 'POST',
        token,
        body: JSON.stringify(form),
      });
      setSuccessNote(
        `Onboarded. Admin can sign in at admin.kabpro.pro with ${res.temporaryCredentials?.email || form.adminEmail}.`
      );
      setTimeout(() => onDone(res.organization.id), 900);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Onboard failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Onboard organization"
        subtitle="Creates the org, fleet admin login, agency workspace, and tracked project in one step."
        action={
          <button type="button" style={secondaryBtn} onClick={onCancel}>
            Cancel
          </button>
        }
      />

      <Card>
        <form onSubmit={submit} style={{ display: 'grid', gap: 18 }}>
          {error && (
            <div
              style={{
                background: 'var(--danger-bg)',
                color: 'var(--danger)',
                border: '1px solid rgba(241,91,74,0.3)',
                padding: '10px 12px',
                borderRadius: 8,
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}
          {successNote && (
            <div
              style={{
                background: 'rgba(38,184,216,0.12)',
                color: 'var(--success)',
                border: '1px solid rgba(38,184,216,0.3)',
                padding: '10px 12px',
                borderRadius: 8,
                fontSize: 13,
              }}
            >
              {successNote}
            </div>
          )}

          <Section title="Organization">
            <Grid>
              <Field label="Company / org name *">
                <input
                  required
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  style={fieldStyle}
                  placeholder="Acme Tours Pvt Ltd"
                />
              </Field>
              <Field label="Business type">
                <select
                  value={form.businessType}
                  onChange={(e) => set('businessType', e.target.value)}
                  style={fieldStyle}
                >
                  {BUSINESS_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Org email">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  style={fieldStyle}
                  placeholder="ops@acme.com"
                />
              </Field>
              <Field label="Phone">
                <input
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  style={fieldStyle}
                  placeholder="9876543210"
                />
              </Field>
              <Field label="City">
                <input value={form.city} onChange={(e) => set('city', e.target.value)} style={fieldStyle} />
              </Field>
              <Field label="State">
                <input value={form.state} onChange={(e) => set('state', e.target.value)} style={fieldStyle} />
              </Field>
              <Field label="GSTIN">
                <input value={form.gstin} onChange={(e) => set('gstin', e.target.value)} style={fieldStyle} />
              </Field>
              <Field label="PAN">
                <input value={form.pan} onChange={(e) => set('pan', e.target.value)} style={fieldStyle} />
              </Field>
            </Grid>
            <Field label="Address">
              <input
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
                style={fieldStyle}
              />
            </Field>
            <Field label="Internal notes">
              <input value={form.notes} onChange={(e) => set('notes', e.target.value)} style={fieldStyle} />
            </Field>
          </Section>

          <Section title="Admin login (admin.kabpro.pro)">
            <Grid>
              <Field label="Admin full name *">
                <input
                  required
                  value={form.adminName}
                  onChange={(e) => set('adminName', e.target.value)}
                  style={fieldStyle}
                />
              </Field>
              <Field label="Admin email *">
                <input
                  required
                  type="email"
                  value={form.adminEmail}
                  onChange={(e) => set('adminEmail', e.target.value)}
                  style={fieldStyle}
                  placeholder="admin@acme.com"
                />
              </Field>
              <Field label="Temp password *">
                <input
                  required
                  type="text"
                  value={form.adminPassword}
                  onChange={(e) => set('adminPassword', e.target.value)}
                  style={fieldStyle}
                  placeholder="Min 6 characters"
                />
              </Field>
              <Field label="Admin phone">
                <input
                  value={form.adminPhone}
                  onChange={(e) => set('adminPhone', e.target.value)}
                  style={fieldStyle}
                />
              </Field>
            </Grid>
          </Section>

          <Section title="Project tracking">
            <Grid>
              <Field label="Project name">
                <input
                  value={form.projectName}
                  onChange={(e) => set('projectName', e.target.value)}
                  style={fieldStyle}
                  placeholder="Defaults to “{Org} Fleet”"
                />
              </Field>
              <Field label="Plan">
                <select value={form.plan} onChange={(e) => set('plan', e.target.value)} style={fieldStyle}>
                  {PLANS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </Field>
            </Grid>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5 }}>
              <input
                type="checkbox"
                checked={form.activate}
                onChange={(e) => set('activate', e.target.checked)}
              />
              Activate immediately (org Active + project Go-live)
            </label>
          </Section>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" style={secondaryBtn} onClick={onCancel} disabled={busy}>
              Cancel
            </button>
            <button type="submit" style={primaryBtn} disabled={busy}>
              {busy ? (
                <>
                  <Loader2 size={16} className="spin" /> Onboarding…
                </>
              ) : (
                'Create & track'
              )}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>{title}</h3>
    <div style={{ display: 'grid', gap: 12 }}>{children}</div>
  </div>
);

const Grid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>{children}</div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label style={labelStyle}>{label}</label>
    {children}
  </div>
);
