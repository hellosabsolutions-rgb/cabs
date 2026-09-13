import React, { useEffect, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import type { Organization, OrgStatus, Project, ProjectStatus } from '../types';
import {
  Card,
  PageHeader,
  StatusPill,
  orgTone,
  projectTone,
  primaryBtn,
  secondaryBtn,
} from '../components/ui';

export const OrganizationDetailPage: React.FC<{
  id: string;
  onBack: () => void;
}> = ({ id, onBack }) => {
  const { token } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch<{ organization: Organization; projects: Project[] }>(
        `/organizations/${id}`,
        { token }
      );
      setOrganization(res.organization);
      setProjects(res.projects || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  const setOrgStatus = async (status: OrgStatus) => {
    setBusy(true);
    try {
      await apiFetch(`/organizations/${id}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ status }),
      });
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  const setProjectStatus = async (projectId: string, status: ProjectStatus) => {
    setBusy(true);
    try {
      await apiFetch(`/projects/${projectId}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ status }),
      });
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <p style={{ color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Loader2 size={16} className="spin" /> Loading organization…
      </p>
    );
  }
  if (!organization) {
    return (
      <div>
        <button type="button" style={secondaryBtn} onClick={onBack}>
          <ArrowLeft size={15} /> Back
        </button>
        <p style={{ color: 'var(--danger)', marginTop: 16 }}>{error || 'Not found'}</p>
      </div>
    );
  }

  return (
    <div>
      <button type="button" style={{ ...secondaryBtn, marginBottom: 16 }} onClick={onBack}>
        <ArrowLeft size={15} /> Back to organizations
      </button>

      <PageHeader
        title={organization.name}
        subtitle={`${organization.businessType || 'Fleet org'} · ${organization.email || ''}`}
        action={<StatusPill label={organization.status} tone={orgTone(organization.status)} />}
      />

      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, marginBottom: 20 }}>
        <Card>
          <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Tracking</h3>
          <Row label="Primary admin" value={organization.primaryAdmin?.email || '—'} />
          <Row label="Admin name" value={organization.primaryAdmin?.name || '—'} />
          <Row
            label="Last admin login"
            value={
              organization.primaryAdmin?.lastLoginAt
                ? new Date(organization.primaryAdmin.lastLoginAt).toLocaleString()
                : 'Never'
            }
          />
          <Row label="City" value={[organization.city, organization.state].filter(Boolean).join(', ') || '—'} />
          <Row label="Onboarded" value={organization.onboardedAt ? new Date(organization.onboardedAt).toLocaleString() : '—'} />
          {organization.notes && <Row label="Notes" value={organization.notes} />}
        </Card>

        <Card>
          <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Lifecycle</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {(['Pending', 'Active', 'Suspended', 'Churned'] as OrgStatus[]).map((s) => (
              <button
                key={s}
                type="button"
                disabled={busy || organization.status === s}
                onClick={() => setOrgStatus(s)}
                style={{
                  ...secondaryBtn,
                  opacity: organization.status === s ? 0.55 : 1,
                  height: 36,
                  fontSize: 12.5,
                }}
              >
                Mark {s}
              </button>
            ))}
          </div>
          <p style={{ margin: '14px 0 0', fontSize: 12.5, color: 'var(--text-faint)', lineHeight: 1.5 }}>
            Suspending an org also pauses its projects and suspends the primary admin login.
          </p>
        </Card>
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ margin: 0, fontSize: 14 }}>Projects / admin workspaces</h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--text-faint)', fontSize: 12 }}>
              <th style={th}>Project</th>
              <th style={th}>Admin</th>
              <th style={th}>Fleet</th>
              <th style={th}>Status</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={td}>
                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>{p.code} · {p.plan}</div>
                </td>
                <td style={td}>{p.adminUser?.email || '—'}</td>
                <td style={td}>
                  {p.metrics?.vehicles ?? 0} veh · {p.metrics?.drivers ?? 0} drv
                </td>
                <td style={td}>
                  <StatusPill label={p.status} tone={projectTone(p.status)} />
                </td>
                <td style={td}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {p.status !== 'Active' && (
                      <button
                        type="button"
                        style={{ ...primaryBtn, height: 32, fontSize: 12 }}
                        disabled={busy}
                        onClick={() => setProjectStatus(p.id, 'Active')}
                      >
                        Go live
                      </button>
                    )}
                    {p.status === 'Active' && (
                      <button
                        type="button"
                        style={{ ...secondaryBtn, height: 32, fontSize: 12 }}
                        disabled={busy}
                        onClick={() => setProjectStatus(p.id, 'Paused')}
                      >
                        Pause
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!projects.length && (
              <tr>
                <td colSpan={5} style={{ ...td, color: 'var(--text-faint)' }}>
                  No projects linked.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
    <div style={{ width: 140, color: 'var(--text-faint)', fontSize: 12.5 }}>{label}</div>
    <div style={{ flex: 1, fontSize: 13.5, fontWeight: 500 }}>{value}</div>
  </div>
);

const th: React.CSSProperties = { padding: '12px 16px', fontWeight: 500 };
const td: React.CSSProperties = { padding: '14px 16px', verticalAlign: 'middle' };
