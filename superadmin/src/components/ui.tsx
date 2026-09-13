import React from 'react';

export const StatusPill: React.FC<{ label: string; tone?: 'blue' | 'green' | 'amber' | 'red' | 'gray' }> = ({
  label,
  tone = 'gray',
}) => {
  const colors: Record<string, { bg: string; color: string; border: string }> = {
    blue: { bg: 'rgba(22,135,245,0.12)', color: '#1687f5', border: 'rgba(22,135,245,0.25)' },
    green: { bg: 'rgba(38,184,216,0.14)', color: '#0e8fa8', border: 'rgba(38,184,216,0.3)' },
    amber: { bg: 'rgba(201,162,39,0.14)', color: '#a88412', border: 'rgba(201,162,39,0.35)' },
    red: { bg: 'rgba(241,91,74,0.12)', color: '#f15b4a', border: 'rgba(241,91,74,0.3)' },
    gray: { bg: 'var(--surface-2)', color: 'var(--text-dim)', border: 'var(--border)' },
  };
  const c = colors[tone];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: 999,
        fontSize: 11.5,
        fontWeight: 600,
        background: c.bg,
        color: c.color,
        border: `1px solid ${c.border}`,
      }}
    >
      {label}
    </span>
  );
};

export function orgTone(status?: string) {
  if (status === 'Active') return 'green' as const;
  if (status === 'Pending') return 'amber' as const;
  if (status === 'Suspended' || status === 'Churned') return 'red' as const;
  return 'gray' as const;
}

export function projectTone(status?: string) {
  if (status === 'Active') return 'green' as const;
  if (status === 'Onboarding') return 'blue' as const;
  if (status === 'Paused') return 'amber' as const;
  if (status === 'Archived') return 'gray' as const;
  return 'gray' as const;
}

export const PageHeader: React.FC<{
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}> = ({ title, subtitle, action }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 16,
      marginBottom: 24,
    }}
  >
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.4px', margin: 0 }}>{title}</h1>
      {subtitle && (
        <p style={{ margin: '6px 0 0', color: 'var(--text-dim)', fontSize: 13.5 }}>{subtitle}</p>
      )}
    </div>
    {action}
  </div>
);

export const Card: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}> = ({ children, style, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: 18,
      ...style,
    }}
  >
    {children}
  </div>
);

export const Stat: React.FC<{ label: string; value: number | string; hint?: string }> = ({
  label,
  value,
  hint,
}) => (
  <Card>
    <div style={{ fontSize: 12, color: 'var(--text-faint)', fontWeight: 500, marginBottom: 8 }}>
      {label}
    </div>
    <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.6px' }}>{value}</div>
    {hint && (
      <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 6 }}>{hint}</div>
    )}
  </Card>
);

export const fieldStyle: React.CSSProperties = {
  width: '100%',
  height: 42,
  padding: '0 12px',
  borderRadius: 8,
  border: '1.5px solid var(--border)',
  background: 'var(--surface)',
  color: 'var(--text)',
  fontSize: 13.5,
  outline: 'none',
};

export const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12.5,
  fontWeight: 500,
  marginBottom: 6,
  color: 'var(--text)',
};

export const primaryBtn: React.CSSProperties = {
  height: 42,
  padding: '0 16px',
  borderRadius: 8,
  border: 'none',
  background: 'var(--accent)',
  color: '#fff',
  fontWeight: 600,
  fontSize: 13.5,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
};

export const secondaryBtn: React.CSSProperties = {
  height: 42,
  padding: '0 14px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  color: 'var(--text)',
  fontWeight: 600,
  fontSize: 13,
  cursor: 'pointer',
};
