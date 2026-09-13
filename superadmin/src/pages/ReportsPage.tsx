import React, { useMemo, useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { ExportMenu, type ExportKind } from '../components/ExportMenu';
import { Card, PageHeader, fieldStyle, labelStyle, secondaryBtn } from '../components/ui';

const KINDS: { id: ExportKind; label: string; hint: string }[] = [
  { id: 'organizations', label: 'Organizations', hint: 'Onboarded customers and status' },
  { id: 'leads', label: 'Leads', hint: 'Inbound pipeline and conversion' },
  { id: 'events', label: 'Activity', hint: 'Logins, returns, and platform events' },
  { id: 'subscriptions', label: 'Subscriptions', hint: 'Trials and plan assignments' },
  { id: 'plans', label: 'Plans', hint: 'Country-based catalog pricing' },
];

export const ReportsPage: React.FC = () => {
  const [kind, setKind] = useState<ExportKind>('organizations');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [status, setStatus] = useState('All');
  const [country, setCountry] = useState('All');
  const [search, setSearch] = useState('');

  const preset = useMemo(
    () => ({ kind, from, to, status, country, search }),
    [kind, from, to, status, country, search]
  );

  const statusOptions =
    kind === 'leads'
      ? ['All', 'New', 'Contacted', 'Qualified', 'Trial', 'Won', 'Lost']
      : kind === 'organizations'
        ? ['All', 'Pending', 'Active', 'Suspended', 'Churned']
        : kind === 'subscriptions'
          ? ['All', 'Trial', 'Active', 'PastDue', 'Cancelled', 'Expired']
          : kind === 'plans'
            ? ['All', 'active', 'inactive']
            : ['All'];

  const showCountry = kind === 'plans' || kind === 'subscriptions';

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Filter by date and type, then download once — format options live in Export."
        action={<ExportMenu defaultKind={kind} preset={preset} label="Export" />}
      />

      <Card style={{ marginBottom: 16 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 12,
            alignItems: 'end',
          }}
        >
          <div>
            <label style={labelStyle}>Dataset</label>
            <select
              style={fieldStyle}
              value={kind}
              onChange={(e) => {
                setKind(e.target.value as ExportKind);
                setStatus('All');
              }}
            >
              {KINDS.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>From</label>
            <input
              type="date"
              style={fieldStyle}
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>To</label>
            <input type="date" style={fieldStyle} value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Status / type</label>
            <select
              style={fieldStyle}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s === 'active' ? 'Active only' : s === 'inactive' ? 'Inactive only' : s}
                </option>
              ))}
            </select>
          </div>
          {showCountry && (
            <div>
              <label style={labelStyle}>Country</label>
              <select
                style={fieldStyle}
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                {['All', 'IN', 'AE', 'US', 'GB', 'SG', 'AU', 'CA', 'SA'].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}
          {(kind === 'leads' || kind === 'organizations') && (
            <div>
              <label style={labelStyle}>Search</label>
              <input
                style={fieldStyle}
                placeholder="Name, email, city…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}
          <div>
            <button
              type="button"
              style={{ ...secondaryBtn, width: '100%' }}
              onClick={() => {
                setFrom('');
                setTo('');
                setStatus('All');
                setCountry('All');
                setSearch('');
              }}
            >
              Reset filters
            </button>
          </div>
        </div>
        <p style={{ margin: '12px 0 0', fontSize: 12.5, color: 'var(--text-dim)' }}>
          Use the header <strong style={{ fontWeight: 600 }}>Export</strong> button to choose file
          format and download with these filters applied.
        </p>
      </Card>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 12,
        }}
      >
        {KINDS.map((k) => {
          const active = kind === k.id;
          return (
            <Card
              key={k.id}
              onClick={() => {
                setKind(k.id);
                setStatus('All');
              }}
              style={{
                cursor: 'pointer',
                borderColor: active ? 'var(--accent)' : 'var(--border)',
                background: active ? 'rgba(22,135,245,0.06)' : 'var(--surface)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <FileSpreadsheet size={18} color={active ? 'var(--accent)' : 'var(--text-dim)'} />
                <div style={{ fontWeight: 700, fontSize: 14 }}>{k.label}</div>
              </div>
              <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-dim)', lineHeight: 1.45 }}>
                {k.hint}
              </p>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
