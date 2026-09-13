import React, { useEffect, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import type { TrackedUser } from '../types';
import {
  Card,
  PageHeader,
  StatusPill,
  fieldStyle,
  secondaryBtn,
} from '../components/ui';

export const UsersPage: React.FC = () => {
  const { token } = useAuth();
  const [items, setItems] = useState<TrackedUser[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'All' | 'Active' | 'Suspended'>('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (status !== 'All') params.set('status', status);
      if (search.trim()) params.set('search', search.trim());
      const res = await apiFetch<{ users: TrackedUser[] }>(`/users?${params}`, { token });
      setItems(res.users || []);
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

  const toggle = async (user: TrackedUser) => {
    const next = user.status === 'Active' ? 'Suspended' : 'Active';
    setBusyId(user.id);
    try {
      await apiFetch(`/users/${user.id}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ status: next }),
      });
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Admin users"
        subtitle="Fleet admin accounts that log into admin.kabpro.pro — provisioned or self-serve."
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
            placeholder="Search name or email…"
            style={{ ...fieldStyle, paddingLeft: 36 }}
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as 'All' | 'Active' | 'Suspended')}
          style={{ ...fieldStyle, width: 150 }}
        >
          <option value="All">All</option>
          <option value="Active">Active</option>
          <option value="Suspended">Suspended</option>
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
                <th style={th}>User</th>
                <th style={th}>Organization</th>
                <th style={th}>Agency</th>
                <th style={th}>Last login</th>
                <th style={th}>Status</th>
                <th style={th} />
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr key={u.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={td}>
                    <div style={{ fontWeight: 600 }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                      {u.email} · {u.role}
                    </div>
                  </td>
                  <td style={td}>{u.organizationId?.name || '—'}</td>
                  <td style={td}>{u.currentAgency?.name || '—'}</td>
                  <td style={td}>
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}
                  </td>
                  <td style={td}>
                    <StatusPill
                      label={u.status}
                      tone={u.status === 'Active' ? 'green' : 'red'}
                    />
                  </td>
                  <td style={td}>
                    <button
                      type="button"
                      disabled={busyId === u.id}
                      style={{ ...secondaryBtn, height: 32, fontSize: 12 }}
                      onClick={() => toggle(u)}
                    >
                      {u.status === 'Active' ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
              {!items.length && (
                <tr>
                  <td colSpan={6} style={{ ...td, color: 'var(--text-faint)' }}>
                    No admin users found.
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
