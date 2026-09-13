import React, { useEffect, useState } from 'react';
import { Loader2, Plus, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { ExportMenu } from '../components/ExportMenu';
import {
  Card,
  PageHeader,
  StatusPill,
  fieldStyle,
  labelStyle,
  primaryBtn,
  secondaryBtn,
} from '../components/ui';

type Lead = {
  id: string;
  companyName: string;
  contactName?: string;
  email?: string;
  phone?: string;
  city?: string;
  source?: string;
  status: string;
  notes?: string;
  interestedPlan?: string;
  organization?: { name?: string } | null;
};

const STATUSES = ['All', 'New', 'Contacted', 'Qualified', 'Trial', 'Won', 'Lost'];

export const LeadsPage: React.FC = () => {
  const { token } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [funnel, setFunnel] = useState<Record<string, number>>({});
  const [events, setEvents] = useState<any[]>([]);
  const [status, setStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    city: '',
    source: 'Manual',
    notes: '',
  });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (status !== 'All') params.set('status', status);
      if (search.trim()) params.set('search', search.trim());
      const [l, f, e] = await Promise.all([
        apiFetch<{ leads: Lead[] }>(`/leads?${params}`, { token }),
        apiFetch<{ funnel: any }>('/funnel', { token }),
        apiFetch<{ events: any[] }>('/events?limit=40', { token }),
      ]);
      setLeads(l.leads || []);
      setFunnel(f.funnel || {});
      setEvents(e.events || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, status]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/leads', { method: 'POST', token, body: JSON.stringify(form) });
      setShowForm(false);
      setForm({
        companyName: '',
        contactName: '',
        email: '',
        phone: '',
        city: '',
        source: 'Manual',
        notes: '',
      });
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Create failed');
    }
  };

  const setLeadStatus = async (id: string, next: string) => {
    try {
      await apiFetch(`/leads/${id}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ status: next }),
      });
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  return (
    <div>
      <PageHeader
        title="Leads & returns"
        subtitle="Track inbound leads, admin logins/returns, and convert to onboarded orgs."
        action={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button type="button" style={primaryBtn} onClick={() => setShowForm((v) => !v)}>
              <Plus size={16} /> New lead
            </button>
            <ExportMenu
              defaultKind="leads"
              preset={{
                kind: 'leads',
                status,
                search,
              }}
              label="Export"
            />
          </div>
        }
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12,
          marginBottom: 18,
        }}
      >
        <MiniStat label="Admin logins" value={funnel.adminLogins || 0} />
        <MiniStat label="Return visits" value={funnel.adminReturns || 0} />
        <MiniStat label="Org onboards" value={funnel.orgOnboards || 0} />
        <MiniStat label="Active trials" value={funnel.activeTrials || 0} />
      </div>

      {showForm && (
        <Card style={{ marginBottom: 16 }}>
          <form onSubmit={create} style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Company *">
                <input
                  required
                  style={fieldStyle}
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                />
              </Field>
              <Field label="Contact">
                <input
                  style={fieldStyle}
                  value={form.contactName}
                  onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                />
              </Field>
              <Field label="Email">
                <input
                  style={fieldStyle}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </Field>
              <Field label="Phone">
                <input
                  style={fieldStyle}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </Field>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" style={secondaryBtn} onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button type="submit" style={primaryBtn}>
                Save lead
              </button>
            </div>
          </form>
        </Card>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 300 }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-faint)',
            }}
          />
          <input
            style={{ ...fieldStyle, paddingLeft: 34 }}
            placeholder="Search leads…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
          />
        </div>
        <select
          style={{ ...fieldStyle, width: 150 }}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <button type="button" style={secondaryBtn} onClick={load}>
          Refresh
        </button>
      </div>

      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
      {loading ? (
        <p style={{ color: 'var(--text-dim)' }}>
          <Loader2 size={14} className="spin" /> Loading…
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ color: 'var(--text-faint)', fontSize: 12, textAlign: 'left' }}>
                  <th style={th}>Lead</th>
                  <th style={th}>Status</th>
                  <th style={th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={td}>
                      <div style={{ fontWeight: 600 }}>{l.companyName}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                        {l.email || l.phone || '—'} · {l.source}
                      </div>
                    </td>
                    <td style={td}>
                      <StatusPill
                        label={l.status}
                        tone={
                          l.status === 'Won'
                            ? 'green'
                            : l.status === 'Lost'
                              ? 'red'
                              : l.status === 'Trial'
                                ? 'blue'
                                : 'amber'
                        }
                      />
                    </td>
                    <td style={td}>
                      <select
                        style={{ ...fieldStyle, height: 32, fontSize: 12 }}
                        value={l.status}
                        onChange={(e) => setLeadStatus(l.id, e.target.value)}
                      >
                        {STATUSES.filter((s) => s !== 'All').map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
                {!leads.length && (
                  <tr>
                    <td colSpan={3} style={{ ...td, color: 'var(--text-faint)' }}>
                      No leads yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>

          <Card>
            <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Live activity trail</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 480, overflow: 'auto' }}>
              {events.map((ev) => (
                <div
                  key={ev.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    fontSize: 12.5,
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{ev.title}</div>
                  <div style={{ color: 'var(--text-dim)', marginTop: 2 }}>{ev.message}</div>
                  <div style={{ color: 'var(--text-faint)', marginTop: 4, fontSize: 11 }}>
                    {ev.type} · {ev.createdAt ? new Date(ev.createdAt).toLocaleString() : ''}
                  </div>
                </div>
              ))}
              {!events.length && (
                <p style={{ color: 'var(--text-faint)', fontSize: 13, margin: 0 }}>
                  Logins, returns, and onboards will appear here.
                </p>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

const MiniStat: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <Card>
    <div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{value}</div>
  </Card>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label style={labelStyle}>{label}</label>
    {children}
  </div>
);

const th: React.CSSProperties = { padding: '12px 14px', fontWeight: 500 };
const td: React.CSSProperties = { padding: '12px 14px', verticalAlign: 'middle' };
