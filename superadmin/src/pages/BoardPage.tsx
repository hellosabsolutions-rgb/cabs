import React, { useEffect, useState } from 'react';
import { AppShell, SuperadminView } from '../components/AppShell';
import { OverviewPage } from './OverviewPage';
import { OrganizationsPage } from './OrganizationsPage';
import { OrganizationDetailPage } from './OrganizationDetailPage';
import { ProjectsPage } from './ProjectsPage';
import { UsersPage } from './UsersPage';
import { OnboardPage } from './OnboardPage';
import { LeadsPage } from './LeadsPage';
import { SubscriptionsPage } from './SubscriptionsPage';
import { ReportsPage } from './ReportsPage';
import { useAuth } from '../context/AuthContext';
import { connectSuperadminSocket, disconnectSuperadminSocket } from '../services/socket';

export const BoardPage: React.FC = () => {
  const { token } = useAuth();
  const [view, setView] = useState<SuperadminView>('overview');
  const [orgId, setOrgId] = useState<string | null>(null);
  const [liveCount, setLiveCount] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    connectSuperadminSocket(token, (payload: any) => {
      setLiveCount((c) => c + 1);
      const title = payload?.title || payload?.body || 'Platform update';
      setToast(String(title));
      window.setTimeout(() => setToast(null), 4000);
    });
    return () => disconnectSuperadminSocket();
  }, [token]);

  const openOrg = (id: string) => {
    setOrgId(id);
    setView('organizations');
  };

  const navigate = (next: SuperadminView) => {
    if (next !== 'organizations') setOrgId(null);
    setView(next);
  };

  let body: React.ReactNode = null;
  if (view === 'overview') body = <OverviewPage onOpenOrg={openOrg} />;
  else if (view === 'onboard') {
    body = (
      <OnboardPage onCancel={() => setView('organizations')} onDone={(id) => openOrg(id)} />
    );
  } else if (view === 'organizations' && orgId) {
    body = <OrganizationDetailPage id={orgId} onBack={() => setOrgId(null)} />;
  } else if (view === 'organizations') {
    body = (
      <OrganizationsPage onOpen={openOrg} onOnboard={() => setView('onboard')} />
    );
  } else if (view === 'projects') body = <ProjectsPage />;
  else if (view === 'users') body = <UsersPage />;
  else if (view === 'leads') body = <LeadsPage />;
  else if (view === 'subscriptions') body = <SubscriptionsPage />;
  else if (view === 'reports') body = <ReportsPage />;

  const shellView =
    view === 'onboard' ? 'organizations' : view;

  return (
    <>
      <AppShell view={shellView} onNavigate={navigate} liveCount={liveCount}>
        {body}
      </AppShell>
      {toast && (
        <div
          style={{
            position: 'fixed',
            right: 20,
            bottom: 20,
            zIndex: 9999,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '12px 16px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
            maxWidth: 320,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {toast}
        </div>
      )}
    </>
  );
};
