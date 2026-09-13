import React from 'react';
import {
  LayoutDashboard,
  Building2,
  FolderKanban,
  Users,
  LogOut,
  Shield,
  Sun,
  Moon,
  Plus,
  Target,
  CreditCard,
  FileDown,
  Bell,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export type SuperadminView =
  | 'overview'
  | 'organizations'
  | 'projects'
  | 'users'
  | 'onboard'
  | 'leads'
  | 'subscriptions'
  | 'reports';

interface Props {
  view: SuperadminView;
  onNavigate: (view: SuperadminView) => void;
  liveCount?: number;
  children: React.ReactNode;
}

const NAV: { id: SuperadminView; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'organizations', label: 'Organizations', icon: Building2 },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'leads', label: 'Leads & returns', icon: Target },
  { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
  { id: 'users', label: 'Admin users', icon: Users },
  { id: 'reports', label: 'Reports', icon: FileDown },
];

export const AppShell: React.FC<Props> = ({ view, onNavigate, liveCount = 0, children }) => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <aside
        style={{
          width: 240,
          flexShrink: 0,
          borderRight: '1px solid var(--border)',
          background: 'var(--surface)',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px 20px' }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              overflow: 'hidden',
              border: '1px solid rgba(22,135,245,0.25)',
              background: theme === 'dark' ? '#14273d' : '#eef6ff',
            }}
          >
            <img
              src={theme === 'dark' ? '/logo-dark.jpg' : '/logo-light.png'}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: '-0.3px' }}>KABPRO</div>
            <div style={{ fontSize: 10.5, color: 'var(--text-faint)', fontWeight: 500 }}>
              Superadmin
            </div>
          </div>
          {liveCount > 0 && (
            <div
              title="Live events"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 7px',
                borderRadius: 999,
                background: 'rgba(22,135,245,0.15)',
                color: 'var(--accent)',
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              <Bell size={12} />
              {liveCount}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => onNavigate('onboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            height: 40,
            margin: '0 4px 16px',
            borderRadius: 8,
            border: 'none',
            background: 'var(--accent)',
            color: '#fff',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          <Plus size={16} />
          Onboard org
        </button>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          {NAV.map((item) => {
            const active = view === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: 'none',
                  background: active
                    ? theme === 'dark'
                      ? 'rgba(22,135,245,0.16)'
                      : '#eef6ff'
                    : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--text-dim)',
                  fontWeight: active ? 600 : 500,
                  fontSize: 13,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div
          style={{
            borderTop: '1px solid var(--border)',
            paddingTop: 12,
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px' }}>
            <Shield size={14} color="var(--accent)" />
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user?.name}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text-faint)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user?.email} · {user?.role}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              style={iconBtn}
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button type="button" onClick={logout} style={{ ...iconBtn, flex: 1 }} title="Sign out">
              <LogOut size={15} />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <main style={{ flex: 1, minWidth: 0, padding: '28px 32px', overflow: 'auto' }}>{children}</main>
    </div>
  );
};

const iconBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  height: 36,
  padding: '0 10px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  color: 'var(--text-dim)',
  cursor: 'pointer',
  fontSize: 12.5,
  fontWeight: 500,
};
