import React, { useEffect, useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import type { Organization, OrgStatus } from '../types';
import {
  Card,
  PageHeader,
  StatusPill,
  fieldStyle,
  orgTone,
  primaryBtn,
  secondaryBtn,
} from '../components/ui';

const STATUSES: Array<OrgStatus | 'All'> = ['All', 'Pending', 'Active', 'Suspended', 'Churned'];

export const OrganizationsPage: React.FC<{
  onOpen: (id: string) => void;
  onOnboard: () => void;
}> = ({ onOpen, onOnboard }) => {
  const { token } = useAuth();
  const [items, setItems] = useState<Organization[]>([]);
  const [status, setStatus] = useState<OrgStatus | 'All'>('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (status !== 'All') params.set('status', status);
      if (search.trim()) params.set('search', search.trim());
      const res = await apiFetch<{ organizations: Organization[] }>(
        `/organizations?${params.toString()}`,
        { token }
      );
      setItems(res.organizations || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, status]);

  return (
    <div>
      <PageHeader
        title="Organizations"
        subtitle="Customer orgs onboarded onto KABPRO admin."
        action={
          <button type="button" style={primaryBtn} onClick={onOnboard}>
            Onboard organization
          </button>
        }
      />

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 320 }}>
          <Search
            size={15}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-faint)',
            }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            placeholder="Search name, email, city…"
            style={{ ...fieldStyle, paddingLeft: 36 }}
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as OrgStatus | 'All')}
          style={{ ...fieldStyle, width: 160 }}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button type="button" style={secondaryBtn} onClick={load}>
          Refresh
        </button>
      </div>

      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
      {loading ? (
        <p style={{ color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Loader2 size={16} className="spin" /> Loading…
        </p>
      ) : (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--text-faint)', fontSize: 12 }}>
                <th style={th}>Organization</th>
                <th style={th}>Admin</th>
                <th style={th}>City</th>
                <th style={th}>Projects</th>
                <th style={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((org) => (
                <tr
                  key={org.id}
                  onClick={() => onOpen(org.id)}
                  style={{ borderTop: '1px solid var(--border)', cursor: 'pointer' }}
                >
                  <td style={td}>
                    <div style={{ fontWeight: 600 }}>{org.name}</div>
                    <div style={{ color: 'var(--text-faint)', fontSize: 12 }}>{org.businessType}</div>
                  </td>
                  <td style={td}>{org.primaryAdmin?.email || org.email || '—'}</td>
                  <td style={td}>{org.city || '—'}</td>
                  <td style={td}>{org.projectCount ?? 0}</td>
                  <td style={td}>
                    <StatusPill label={org.status} tone={orgTone(org.status)} />
                  </td>
                </tr>
              ))}
              {!items.length && (
                <tr>
                  <td colSpan={5} style={{ ...td, color: 'var(--text-faint)' }}>
                    No organizations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};

const th: React.CSSProperties = { padding: '12px 16px', fontWeight: 500 };
const td: React.CSSProperties = { padding: '14px 16px', verticalAlign: 'middle' };
