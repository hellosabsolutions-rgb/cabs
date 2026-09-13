import React, { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export interface StatusOption<T extends string = string> {
  value: T;
  label: string;
  color?: string;
  bg?: string;
  borderColor?: string;
  icon?: React.ReactNode;
}

export interface StatusDropdownProps<T extends string = string> {
  value: T;
  options: StatusOption<T>[] | T[];
  onChange: (newValue: T) => void | Promise<void>;
  disabled?: boolean;
  size?: 'sm' | 'md';
  title?: string;
}

const DEFAULT_STATUS_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  running: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.14)', border: 'rgba(16, 185, 129, 0.35)' },
  active: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.14)', border: 'rgba(16, 185, 129, 0.35)' },
  idle: { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.3)' },
  maintenance: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.14)', border: 'rgba(245, 158, 11, 0.35)' },
  scheduled: { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.14)', border: 'rgba(56, 189, 248, 0.35)' },
  ongoing: { color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.14)', border: 'rgba(6, 182, 212, 0.35)' },
  completed: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.14)', border: 'rgba(16, 185, 129, 0.35)' },
  cancelled: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.14)', border: 'rgba(239, 68, 68, 0.35)' },
  upcoming: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.14)', border: 'rgba(245, 158, 11, 0.35)' },
  present: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.14)', border: 'rgba(34, 197, 94, 0.35)' },
  late: { color: '#eab308', bg: 'rgba(234, 179, 8, 0.14)', border: 'rgba(234, 179, 8, 0.35)' },
  absent: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.14)', border: 'rgba(239, 68, 68, 0.35)' },
  'on leave': { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.3)' },
  'on duty': { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.14)', border: 'rgba(34, 197, 94, 0.35)' },
  'off duty': { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.3)' },
  paid: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.14)', border: 'rgba(16, 185, 129, 0.35)' },
  sent: { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.14)', border: 'rgba(56, 189, 248, 0.35)' },
  draft: { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.3)' },
  overdue: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.14)', border: 'rgba(239, 68, 68, 0.35)' },
  partial: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.14)', border: 'rgba(245, 158, 11, 0.35)' },
  unpaid: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.14)', border: 'rgba(239, 68, 68, 0.35)' },
  approved: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.14)', border: 'rgba(16, 185, 129, 0.35)' },
  pending: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.14)', border: 'rgba(245, 158, 11, 0.35)' },
  rejected: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.14)', border: 'rgba(239, 68, 68, 0.35)' }
};

function fallbackStyle(value: string) {
  return (
    DEFAULT_STATUS_STYLES[value.toLowerCase().trim()] || {
      color: 'var(--text)',
      bg: 'var(--surface-3)',
      border: 'var(--border)'
    }
  );
}

export function StatusDropdown<T extends string = string>({
  value,
  options,
  onChange,
  disabled = false,
  size = 'md',
  title
}: StatusDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 160, openUp: false });

  const normalizedOptions: StatusOption<T>[] = options.map(opt => {
    if (typeof opt === 'string') {
      const fallback = fallbackStyle(opt);
      return {
        value: opt,
        label: opt,
        color: fallback.color,
        bg: fallback.bg,
        borderColor: fallback.border
      };
    }
    const fallback = fallbackStyle(opt.value);
    return {
      ...opt,
      color: opt.color || fallback.color,
      bg: opt.bg || fallback.bg,
      borderColor: opt.borderColor || fallback.border
    };
  });

  const activeOption =
    normalizedOptions.find(o => o.value === value) ||
    normalizedOptions.find(o => o.value.toLowerCase() === (value || '').toLowerCase()) || {
      value,
      label: value,
      color: 'var(--text)',
      bg: 'var(--surface-3)',
      borderColor: 'var(--border)'
    };

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const menuWidth = Math.max(168, rect.width);
    const estimatedHeight = Math.min(320, normalizedOptions.length * 40 + 20);
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUp = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;
    const top = openUp
      ? Math.max(8, rect.top - estimatedHeight - 6)
      : Math.min(window.innerHeight - estimatedHeight - 8, rect.bottom + 6);

    setCoords({
      top,
      left: Math.max(8, Math.min(window.innerWidth - menuWidth - 8, rect.left)),
      width: menuWidth,
      openUp
    });
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    setIsOpen(prev => !prev);
  };

  useLayoutEffect(() => {
    if (!isOpen) return;

    updatePosition();

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, normalizedOptions.length]);

  const handleSelect = (option: StatusOption<T>, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    if (option.value !== value) {
      onChange(option.value);
    }
  };

  const isSmall = size === 'sm';

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle' }}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        title={title || `Current status: ${activeOption.label}. Click to change.`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: activeOption.bg,
          color: activeOption.color,
          border: `1px solid ${activeOption.borderColor}`,
          borderRadius: '9999px',
          padding: isSmall ? '3px 10px 3px 9px' : '4px 12px 4px 10px',
          fontSize: isSmall ? '11px' : '11.5px',
          fontWeight: 600,
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          lineHeight: 1.3,
          letterSpacing: '0.2px',
          transition: 'filter 0.15s ease',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          fontFamily: "'Poppins', sans-serif",
          opacity: disabled ? 0.6 : 1
        }}
        onMouseEnter={e => {
          if (!disabled) e.currentTarget.style.filter = 'brightness(1.08)';
        }}
        onMouseLeave={e => {
          if (!disabled) e.currentTarget.style.filter = 'none';
        }}
      >
        <span
          style={{
            width: '6.5px',
            height: '6.5px',
            borderRadius: '50%',
            backgroundColor: activeOption.color || 'currentColor',
            flexShrink: 0
          }}
        />
        <span>{activeOption.label}</span>
        <ChevronDown
          size={isSmall ? 11 : 12}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s ease',
            opacity: 0.85,
            color: activeOption.color || 'currentColor'
          }}
        />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            className="status-dropdown-popover"
            role="listbox"
            onClick={e => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              zIndex: 100000
            }}
          >
            {normalizedOptions.map(option => {
              const isSelected =
                option.value === value || option.value.toLowerCase() === (value || '').toLowerCase();
              return (
                <div
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  className={`status-dropdown-item ${isSelected ? 'active' : ''}`}
                  onClick={e => handleSelect(option, e)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                    {option.icon ? (
                      option.icon
                    ) : (
                      <span
                        style={{
                          width: '7.5px',
                          height: '7.5px',
                          borderRadius: '50%',
                          backgroundColor: option.color || 'currentColor',
                          boxShadow: option.color ? `0 0 7px ${option.color}66` : 'none',
                          flexShrink: 0
                        }}
                      />
                    )}
                    <span style={{ whiteSpace: 'nowrap' }}>{option.label}</span>
                  </div>
                  {isSelected && (
                    <Check
                      size={13}
                      style={{
                        color: option.color || 'var(--accent)',
                        strokeWidth: 2.5,
                        marginLeft: '8px'
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}
