import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import type { DashboardData } from '../types';
import { Card, PageHeader, Stat, StatusPill, orgTone, projectTone } from '../components/ui';

export const OverviewPage: React.FC<{ onOpenOrg: (id: string) => void }> = ({ onOpenOrg }) => {
  const { token } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await apiFetch<DashboardData & { success: boolean }>('/dashboard', { token });
        if (!cancelled) setData(res);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) return <p style={{ color: 'var(--text-dim)' }}>Loading platform overview…</p>;
  if (error) return <p style={{ color: 'var(--danger)' }}>{error}</p>;
  if (!data) return null;

  const o = data.overview;

  return (
    <div>
      <PageHeader
        title="Platform overview"
        subtitle="Track organizations, projects, and admin workspaces across KABPRO."
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 14,
          marginBottom: 24,
        }}
      >
        <Stat label="Organizations" value={o.organizations.total} hint={`${o.organizations.active} active`} />
        <Stat label="Pending onboard" value={o.organizations.pending} />
        <Stat label="Projects" value={o.projects.total} hint={`${o.projects.onboarding} onboarding`} />
        <Stat label="Admin users" value={o.adminUsers} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <h3 style={{ margin: '0 0 14px', fontSize: 15 }}>Recent organizations</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(data.recentOrganizations || []).map((org) => (
              <button
                key={org.id}
                type="button"
                onClick={() => onOpenOrg(org.id)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: 'var(--text)',
                  textAlign: 'left',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{org.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                    {org.primaryAdmin?.email || org.email || '—'}
                  </div>
                </div>
                <StatusPill label={org.status} tone={orgTone(org.status)} />
              </button>
            ))}
            {!data.recentOrganizations?.length && (
              <p style={{ color: 'var(--text-faint)', fontSize: 13, margin: 0 }}>
                No organizations yet — onboard your first customer.
              </p>
            )}
          </div>
        </Card>

        <Card>
          <h3 style={{ margin: '0 0 14px', fontSize: 15 }}>Recent projects</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(data.recentProjects || []).map((p) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                    {p.organization?.name || '—'} · {p.adminUser?.email || '—'}
                  </div>
                </div>
                <StatusPill label={p.status} tone={projectTone(p.status)} />
              </div>
            ))}
            {!data.recentProjects?.length && (
              <p style={{ color: 'var(--text-faint)', fontSize: 13, margin: 0 }}>No projects yet.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
