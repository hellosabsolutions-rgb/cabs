import React, { useState, useRef, useEffect } from 'react';
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

export interface CustomStatusDropdownProps<T extends string = string> {
  value: T;
  options: StatusOption<T>[];
  onChange: (newValue: T) => void | Promise<void>;
  disabled?: boolean;
  size?: 'sm' | 'md';
  title?: string;
}

export const CustomStatusDropdown = <T extends string = string>({
  value,
  options,
  onChange,
  disabled = false,
  size = 'sm',
  title
}: CustomStatusDropdownProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; openUp: boolean }>({
    top: 0,
    left: 0,
    width: 0,
    openUp: false
  });

  const activeOption = options.find(o => o.value === value) || options[0] || {
    value,
    label: value,
    color: 'var(--text)',
    bg: 'var(--surface-2)',
    borderColor: 'var(--border)'
  };

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = options.length * 38 + 16;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

    setCoords({
      top: openUp ? rect.top - dropdownHeight - 4 : rect.bottom + 4,
      left: Math.max(8, Math.min(window.innerWidth - 170, rect.left)),
      width: Math.max(150, rect.width),
      openUp
    });
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Close on click outside, scroll, resize, or escape
  useEffect(() => {
    if (!isOpen) return;

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

    const handleScrollOrResize = () => {
      setIsOpen(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (option: StatusOption<T>, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    if (option.value !== value) {
      onChange(option.value);
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        title={title || `Current status: ${activeOption.label}. Click to change.`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: activeOption.bg || 'var(--surface-2)',
          color: activeOption.color || 'var(--text)',
          border: `1px solid ${activeOption.borderColor || 'var(--border)'}`,
          padding: size === 'sm' ? '4px 10px' : '6px 14px',
          borderRadius: '20px',
          fontSize: size === 'sm' ? '11.5px' : '12.5px',
          fontWeight: 600,
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          lineHeight: 1.4,
          fontFamily: "'Poppins', sans-serif",
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
          transition: 'all 0.15s ease',
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
          size={12}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s ease',
            opacity: 0.8,
            color: activeOption.color || 'var(--text-faint)'
          }}
        />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            className="status-dropdown-popover"
            onClick={e => e.stopPropagation()}
            style={{
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${Math.max(160, coords.width)}px`
            }}
          >
            {options.map(option => {
              const isSelected = option.value === value;
              return (
                <div
                  key={option.value}
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
};
