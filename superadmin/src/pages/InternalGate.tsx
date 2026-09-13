import React from 'react';
import { LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

/** Minimal post-login gate — console modules come later. */
export const InternalGate: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme } = useTheme();

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'var(--bg)',
        color: 'var(--text)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: '28px 26px',
          boxShadow:
            theme === 'dark'
              ? '0 18px 40px rgba(0,0,0,0.45)'
              : '0 16px 40px rgba(15,23,42,0.08)',
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: theme === 'dark' ? 'rgba(22,135,245,0.18)' : '#eef6ff',
            color: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <ShieldCheck size={22} />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.4px' }}>
          You’re in
        </h1>
        <p style={{ fontSize: 13.5, color: 'var(--text-dim)', lineHeight: 1.55, margin: '0 0 18px' }}>
          Signed in as <strong style={{ color: 'var(--text)' }}>{user?.name}</strong> (
          {user?.email}). Superadmin modules will land here next — for now this confirms
          internal auth works.
        </p>
        <button
          type="button"
          onClick={logout}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            height: 42,
            padding: '0 16px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--text)',
            fontWeight: 600,
            fontSize: 13.5,
            cursor: 'pointer',
          }}
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </div>
  );
};
