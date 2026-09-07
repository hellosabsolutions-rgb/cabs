import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface StatusOption {
  value: string;
  label: string;
  color?: string;
  bg?: string;
  borderColor?: string;
}

interface StatusDropdownProps {
  value: string;
  options: StatusOption[] | string[];
  onChange: (newValue: any) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  title?: string;
}

const DEFAULT_STATUS_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  // Vehicle statuses
  running: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.14)', border: 'rgba(16, 185, 129, 0.35)' },
  active: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.14)', border: 'rgba(16, 185, 129, 0.35)' },
  idle: { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.3)' },
  maintenance: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.14)', border: 'rgba(245, 158, 11, 0.35)' },

  // Booking / Trip statuses
  scheduled: { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.14)', border: 'rgba(56, 189, 248, 0.35)' },
  ongoing: { color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.14)', border: 'rgba(6, 182, 212, 0.35)' },
  completed: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.14)', border: 'rgba(16, 185, 129, 0.35)' },
  cancelled: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.14)', border: 'rgba(239, 68, 68, 0.35)' },

  // Driver duty
  'on duty': { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.14)', border: 'rgba(34, 197, 94, 0.35)' },
  'off duty': { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.3)' },

  // Payment / Billing
  paid: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.14)', border: 'rgba(16, 185, 129, 0.35)' },
  sent: { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.14)', border: 'rgba(56, 189, 248, 0.35)' },
  draft: { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.3)' },
  overdue: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.14)', border: 'rgba(239, 68, 68, 0.35)' },
  partial: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.14)', border: 'rgba(245, 158, 11, 0.35)' },
  unpaid: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.14)', border: 'rgba(239, 68, 68, 0.35)' }
};

export const StatusDropdown: React.FC<StatusDropdownProps> = ({
  value,
  options,
  onChange,
  disabled = false,
  size = 'md',
  title = 'Click to change status'
}) => {
  const normalizedValue = (value || '').toLowerCase().trim();
  const currentStyle = DEFAULT_STATUS_STYLES[normalizedValue] || {
    color: 'var(--text)',
    bg: 'var(--surface-3)',
    border: 'var(--border)'
  };

  const normalizedOptions: StatusOption[] = options.map((opt) => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt };
    }
    return opt;
  });

  const isSmall = size === 'sm';

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        verticalAlign: 'middle'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        title={title}
        aria-label={title}
        style={{
          appearance: 'none',
          WebkitAppearance: 'none',
          MozAppearance: 'none',
          background: currentStyle.bg,
          color: currentStyle.color,
          border: `1px solid ${currentStyle.border}`,
          borderRadius: '9999px',
          padding: isSmall ? '3px 22px 3px 9px' : '4px 26px 4px 11px',
          fontSize: isSmall ? '11px' : '11.5px',
          fontWeight: 600,
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          lineHeight: 1.3,
          letterSpacing: '0.2px',
          transition: 'all 0.15s ease',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08)'
        }}
      >
        {normalizedOptions.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            style={{
              background: 'var(--surface-1, #1e2433)',
              color: 'var(--text, #f1f5f9)',
              fontSize: '12px',
              padding: '6px'
            }}
          >
            ● {opt.label}
          </option>
        ))}
      </select>

      <ChevronDown
        size={isSmall ? 10 : 12}
        style={{
          position: 'absolute',
          right: isSmall ? '7px' : '9px',
          pointerEvents: 'none',
          color: currentStyle.color,
          opacity: 0.85
        }}
      />
    </div>
  );
};
