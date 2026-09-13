import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Download, FileSpreadsheet, FileText, FileType, Loader2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetchBlob } from '../services/api';
import { fieldStyle, labelStyle, primaryBtn, secondaryBtn } from './ui';

export type ExportKind =
  | 'organizations'
  | 'leads'
  | 'events'
  | 'subscriptions'
  | 'plans';

export type ExportFormat = 'xlsx' | 'pdf' | 'doc';

export type ExportFilters = {
  kind: ExportKind;
  format: ExportFormat;
  from: string;
  to: string;
  status: string;
  country: string;
  search: string;
};

const KIND_OPTIONS: { id: ExportKind; label: string }[] = [
  { id: 'organizations', label: 'Organizations' },
  { id: 'leads', label: 'Leads' },
  { id: 'events', label: 'Activity / logins' },
  { id: 'subscriptions', label: 'Subscriptions' },
  { id: 'plans', label: 'Plans catalog' },
];

const FORMAT_OPTIONS: {
  id: ExportFormat;
  label: string;
  hint: string;
  icon: typeof FileSpreadsheet;
}[] = [
  { id: 'xlsx', label: 'Excel', hint: '.xlsx', icon: FileSpreadsheet },
  { id: 'pdf', label: 'PDF', hint: '.pdf', icon: FileText },
  { id: 'doc', label: 'Word', hint: '.doc', icon: FileType },
];

const STATUS_BY_KIND: Record<ExportKind, string[]> = {
  organizations: ['All', 'Pending', 'Active', 'Suspended', 'Churned'],
  leads: ['All', 'New', 'Contacted', 'Qualified', 'Trial', 'Won', 'Lost'],
  events: ['All'],
  subscriptions: ['All', 'Trial', 'Active', 'PastDue', 'Cancelled', 'Expired'], // match OrganizationSubscription enum
  plans: ['All', 'active', 'inactive'],
};

const COUNTRY_OPTIONS = ['All', 'IN', 'AE', 'US', 'GB', 'SG', 'AU', 'CA', 'SA'];

function defaultFilters(kind: ExportKind = 'organizations'): ExportFilters {
  return {
    kind,
    format: 'xlsx',
    from: '',
    to: '',
    status: 'All',
    country: 'All',
    search: '',
  };
}

function buildExportQuery(f: ExportFilters) {
  const params = new URLSearchParams();
  params.set('kind', f.kind);
  params.set('format', f.format);
  if (f.from) params.set('from', f.from);
  if (f.to) params.set('to', f.to);
  if (f.status && f.status !== 'All') params.set('status', f.status);
  if (f.country && f.country !== 'All') params.set('country', f.country);
  if (f.search.trim()) params.set('search', f.search.trim());
  return params.toString();
}

type ExportMenuProps = {
  /** Prefill dataset when opened from a specific page */
  defaultKind?: ExportKind;
  /** Optional filters carried from the current page */
  preset?: Partial<ExportFilters>;
  label?: string;
};

export const ExportMenu: React.FC<ExportMenuProps> = ({
  defaultKind = 'organizations',
  preset,
  label = 'Export',
}) => {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<ExportFilters>(() => ({
    ...defaultFilters(defaultKind),
    ...preset,
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const statuses = STATUS_BY_KIND[filters.kind] || ['All'];
  const showCountry = filters.kind === 'plans' || filters.kind === 'subscriptions';

  const download = async () => {
    setBusy(true);
    setError('');
    try {
      const { blob, filename } = await apiFetchBlob(`/export?${buildExportQuery(filters)}`, token);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `kabpro-${filters.kind}.${filters.format}`;
      a.click();
      URL.revokeObjectURL(url);
      setOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setBusy(false);
    }
  };

  const toggleOpen = () => {
    if (!open) {
      setError('');
      setFilters({
        ...defaultFilters(defaultKind),
        ...preset,
        kind: (preset?.kind as ExportKind) || defaultKind,
        format: (preset?.format as ExportFormat) || 'xlsx',
      });
    }
    setOpen((v) => !v);
  };

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        type="button"
        style={{ ...secondaryBtn, display: 'inline-flex', alignItems: 'center', gap: 8 }}
        onClick={toggleOpen}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Download size={15} />
        {label}
        <ChevronDown size={14} style={{ opacity: 0.7 }} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Export options"
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            width: 360,
            maxWidth: 'min(360px, calc(100vw - 32px))',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            boxShadow: '0 16px 40px rgba(15, 23, 42, 0.14)',
            padding: 16,
            zIndex: 80,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 14 }}>Export report</div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: 'var(--text-dim)',
                padding: 4,
                display: 'inline-flex',
              }}
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <label style={labelStyle}>Dataset</label>
              <select
                style={fieldStyle}
                value={filters.kind}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    kind: e.target.value as ExportKind,
                    status: 'All',
                  }))
                }
              >
                {KIND_OPTIONS.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={labelStyle}>From</label>
                <input
                  type="date"
                  style={fieldStyle}
                  value={filters.from}
                  onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
                />
              </div>
              <div>
                <label style={labelStyle}>To</label>
                <input
                  type="date"
                  style={fieldStyle}
                  value={filters.to}
                  onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: showCountry ? '1fr 1fr' : '1fr', gap: 10 }}>
              <div>
                <label style={labelStyle}>Status / type</label>
                <select
                  style={fieldStyle}
                  value={filters.status}
                  onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                >
                  {statuses.map((s) => (
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
                    value={filters.country}
                    onChange={(e) => setFilters((f) => ({ ...f, country: e.target.value }))}
                  >
                    {COUNTRY_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {(filters.kind === 'leads' || filters.kind === 'organizations') && (
              <div>
                <label style={labelStyle}>Search</label>
                <input
                  style={fieldStyle}
                  placeholder="Name, email, city…"
                  value={filters.search}
                  onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                />
              </div>
            )}

            <div>
              <label style={labelStyle}>File format</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {FORMAT_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const active = filters.format === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFilters((f) => ({ ...f, format: opt.id }))}
                      style={{
                        border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                        background: active ? 'rgba(22,135,245,0.08)' : 'var(--surface-2)',
                        borderRadius: 10,
                        padding: '10px 8px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        color: 'var(--text)',
                      }}
                    >
                      <Icon size={18} color={active ? 'var(--accent)' : 'var(--text-dim)'} />
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{opt.label}</span>
                      <span style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>{opt.hint}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <p style={{ margin: 0, color: 'var(--danger)', fontSize: 12.5 }}>{error}</p>
            )}

            <button
              type="button"
              style={{ ...primaryBtn, width: '100%', justifyContent: 'center' }}
              disabled={busy}
              onClick={download}
            >
              {busy ? <Loader2 size={16} className="spin" /> : <Download size={16} />}
              {busy ? 'Preparing…' : 'Download report'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
