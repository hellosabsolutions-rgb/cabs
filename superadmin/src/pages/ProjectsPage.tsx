import React, { useEffect, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import type { Project, ProjectStatus } from '../types';
import {
  Card,
  PageHeader,
  StatusPill,
  fieldStyle,
  projectTone,
  secondaryBtn,
} from '../components/ui';

const STATUSES: Array<ProjectStatus | 'All'> = [
  'All',
  'Onboarding',
  'Active',
  'Paused',
  'Archived',
];

export const ProjectsPage: React.FC = () => {
  const { token } = useAuth();
  const [items, setItems] = useState<Project[]>([]);
  const [status, setStatus] = useState<ProjectStatus | 'All'>('All');
  const [search, setSearch] = useState('');
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
      const res = await apiFetch<{ projects: Project[] }>(`/projects?${params}`, { token });
      setItems(res.projects || []);
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

  const patch = async (id: string, next: ProjectStatus) => {
    setBusyId(id);
    try {
      await apiFetch(`/projects/${id}`, {
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
        title="Projects"
        subtitle="Each project is an admin agency workspace you provision and track."
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
            placeholder="Search project, org, admin…"
            style={{ ...fieldStyle, paddingLeft: 36 }}
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as ProjectStatus | 'All')}
          style={{ ...fieldStyle, width: 170 }}
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
                <th style={th}>Project</th>
                <th style={th}>Organization</th>
                <th style={th}>Admin user</th>
                <th style={th}>Usage</th>
                <th style={th}>Status</th>
                <th style={th} />
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={td}>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                      {p.code} · {p.plan}
                    </div>
                  </td>
                  <td style={td}>{p.organization?.name || '—'}</td>
                  <td style={td}>
                    <div>{p.adminUser?.email || '—'}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>
                      {p.adminUser?.lastLoginAt
                        ? `Login ${new Date(p.adminUser.lastLoginAt).toLocaleDateString()}`
                        : 'Never logged in'}
                    </div>
                  </td>
                  <td style={td}>
                    {p.metrics?.vehicles ?? 0} veh · {p.metrics?.drivers ?? 0} drv
                  </td>
                  <td style={td}>
                    <StatusPill label={p.status} tone={projectTone(p.status)} />
                  </td>
                  <td style={td}>
                    {p.status !== 'Active' && (
                      <button
                        type="button"
                        disabled={busyId === p.id}
                        style={{ ...secondaryBtn, height: 32, fontSize: 12 }}
                        onClick={() => patch(p.id, 'Active')}
                      >
                        Go live
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!items.length && (
                <tr>
                  <td colSpan={6} style={{ ...td, color: 'var(--text-faint)' }}>
                    No projects yet.
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
