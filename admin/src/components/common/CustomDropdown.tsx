import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Search, Loader2, User } from 'lucide-react';

export interface CustomDropdownOption<T = string> {
  value: T;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
  avatar?: string;
  badge?: string;
  badgeColor?: string;
  disabled?: boolean;
}

export interface CustomDropdownProps<T = string> {
  label?: string;
  value: T;
  onChange: (value: T) => void;
  options: CustomDropdownOption<T>[];
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  searchable?: boolean;
  onOpen?: () => void;
  className?: string;
  style?: React.CSSProperties;
  buttonStyle?: React.CSSProperties;
  menuStyle?: React.CSSProperties;
  icon?: React.ReactNode;
}

// Deterministic pastel color palette for avatars matching screenshot
const AVATAR_PALETTES = [
  { bg: '#e0e7ff', text: '#4338ca', darkBg: 'rgba(99, 102, 241, 0.28)', darkText: '#a5b4fc' }, // indigo
  { bg: '#dcfce7', text: '#15803d', darkBg: 'rgba(34, 197, 94, 0.28)', darkText: '#86efac' },  // green
  { bg: '#fef3c7', text: '#b45309', darkBg: 'rgba(245, 158, 11, 0.28)', darkText: '#fcd34d' }, // amber
  { bg: '#e0f2fe', text: '#0369a1', darkBg: 'rgba(14, 165, 233, 0.28)', darkText: '#7dd3fc' }, // sky
  { bg: '#fae8ff', text: '#86198f', darkBg: 'rgba(217, 70, 239, 0.28)', darkText: '#f0abfc' }, // fuchsia
  { bg: '#fce7f3', text: '#be185d', darkBg: 'rgba(236, 72, 153, 0.28)', darkText: '#f472b6' }, // pink
  { bg: '#ffe4e6', text: '#be123c', darkBg: 'rgba(244, 63, 94, 0.28)', darkText: '#fda4af' },  // rose
  { bg: '#ccfbf1', text: '#0f766e', darkBg: 'rgba(20, 184, 166, 0.28)', darkText: '#5eead4' }, // teal
];

function getAvatarPalette(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
}

function getInitials(name: string) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function CustomDropdown<T extends string | number>({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select',
  disabled = false,
  isLoading = false,
  searchable = false,
  onOpen,
  className = '',
  style = {},
  buttonStyle = {},
  menuStyle = {},
  icon,
}: CustomDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDark, setIsDark] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [coords, setCoords] = useState<{ top: number; left: number; width: number; openUp: boolean }>({
    top: 0,
    left: 0,
    width: 0,
    openUp: false
  });

  // Check current theme
  useEffect(() => {
    const checkTheme = () => {
      const theme = document.documentElement.getAttribute('data-theme');
      setIsDark(theme === 'dark');
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  // Find currently selected option
  const selectedOption = options.find(opt => opt.value === value);

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const estimatedHeight = Math.min(290, options.length * 44 + (searchable ? 52 : 16));
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < estimatedHeight && rect.top > estimatedHeight;

    setCoords({
      top: openUp ? rect.top - estimatedHeight - 6 : rect.bottom + 6,
      left: Math.max(8, Math.min(window.innerWidth - rect.width - 8, rect.left)),
      width: rect.width,
      openUp
    });
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
      if (onOpen) onOpen();
    } else {
      setIsOpen(false);
    }
  };

  // Close on outside click, resize, scroll, or Escape key
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
      updatePosition();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Focus search input on open if searchable
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen, searchable]);

  // Filter options if searchable
  const filteredOptions = options.filter(opt => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      opt.label.toLowerCase().includes(query) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(query))
    );
  });

  const renderAvatar = (opt: CustomDropdownOption<T>, size = 26) => {
    if (opt.avatar) {
      return (
        <div
          className="sleek-glass-dropdown-avatar"
          style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}
        >
          <img src={opt.avatar} alt={opt.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      );
    }

    if (opt.icon) {
      return (
        <div
          className="sleek-glass-dropdown-avatar"
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
            color: isDark ? '#f8fafc' : '#334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          {opt.icon}
        </div>
      );
    }

    const palette = getAvatarPalette(opt.label || String(opt.value));
    return (
      <div
        className="sleek-glass-dropdown-avatar"
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          backgroundColor: isDark ? palette.darkBg : palette.bg,
          color: isDark ? palette.darkText : palette.text,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size <= 26 ? '10.5px' : '11.5px',
          fontWeight: 700,
          flexShrink: 0,
          userSelect: 'none'
        }}
      >
        {getInitials(opt.label)}
      </div>
    );
  };

  return (
    <div
      className={`sleek-glass-dropdown ${className}`}
      style={{ position: 'relative', width: '100%', ...style }}
    >
      {/* Optional Top Label matching Screenshot ("Select user") */}
      {label && (
        <label className="sleek-glass-dropdown-header-label">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        data-no-modal-close="true"
        disabled={disabled}
        onClick={handleToggle}
        className={`sleek-glass-dropdown-btn ${isOpen ? 'is-open' : ''}`}
        style={buttonStyle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="sleek-glass-dropdown-content">
          {isLoading ? (
            <Loader2 size={16} className="spin-animation" style={{ color: '#38bdf8', flexShrink: 0 }} />
          ) : selectedOption ? (
            renderAvatar(selectedOption, 26)
          ) : (
            <span className="sleek-glass-dropdown-icon">
              {icon || <User size={16} strokeWidth={1.8} style={{ color: '#94a3b8' }} />}
            </span>
          )}

          {selectedOption ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
              <span
                className="sleek-glass-dropdown-label"
                style={{ color: 'var(--text)', fontWeight: 600 }}
              >
                {selectedOption.label}
              </span>

              {selectedOption.sublabel && (
                <span className="sleek-glass-dropdown-sublabel">
                  {selectedOption.sublabel.startsWith('@') ? selectedOption.sublabel : `@${selectedOption.sublabel}`}
                </span>
              )}
            </div>
          ) : (
            <span
              className="sleek-glass-dropdown-label"
              style={{ color: '#94a3b8', fontWeight: 400 }}
            >
              {placeholder}
            </span>
          )}

          {selectedOption?.badge && (
            <span
              className="sleek-glass-badge"
              style={selectedOption.badgeColor ? {
                background: selectedOption.badgeColor,
                borderColor: selectedOption.badgeColor,
                color: '#fff'
              } : undefined}
            >
              {selectedOption.badge}
            </span>
          )}
        </div>

        <ChevronDown
          size={15}
          className="sleek-glass-dropdown-chevron"
        />
      </button>

      {/* Floating Dropdown Card Popover (using Portal for overflow resilience) */}
      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            data-no-modal-close="true"
            className="sleek-glass-dropdown-menu"
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${Math.max(200, coords.width)}px`,
              zIndex: 999999,
              ...menuStyle
            }}
            role="listbox"
            onClick={e => e.stopPropagation()}
          >
            {/* Search bar inside dropdown if searchable */}
            {searchable && (
              <div className="sleek-glass-dropdown-search-box">
                <Search
                  size={14}
                  style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                    pointerEvents: 'none'
                  }}
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onClick={e => e.stopPropagation()}
                  className="sleek-glass-dropdown-search-input"
                />
              </div>
            )}

            {/* Options List */}
            <div className="sleek-glass-dropdown-list">
              {isLoading && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '16px 12px',
                    color: '#38bdf8',
                    fontSize: '12.5px',
                  }}
                >
                  <Loader2 size={15} className="spin-animation" />
                  <span>Loading options...</span>
                </div>
              )}

              {filteredOptions.length === 0 && !isLoading ? (
                <div
                  style={{
                    padding: '18px 12px',
                    textAlign: 'center',
                    fontSize: '12px',
                    color: '#94a3b8',
                  }}
                >
                  No options found
                </div>
              ) : (
                filteredOptions.map(opt => {
                  const isSelected = opt.value === value;

                  return (
                    <button
                      key={String(opt.value)}
                      type="button"
                      data-no-modal-close="true"
                      disabled={opt.disabled}
                      onClick={(e) => {
                        e.stopPropagation();
                        onChange(opt.value);
                        setIsOpen(false);
                      }}
                      className={`sleek-glass-dropdown-item ${isSelected ? 'is-selected' : ''}`}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden', flex: 1 }}>
                        {renderAvatar(opt, 28)}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', minWidth: 0 }}>
                          <span style={{ fontWeight: 600, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {opt.label}
                          </span>
                          {opt.sublabel && (
                            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 400, flexShrink: 0 }}>
                              {opt.sublabel.startsWith('@') ? opt.sublabel : `@${opt.sublabel}`}
                            </span>
                          )}
                        </div>
                      </div>

                      {opt.badge && (
                        <span
                          className="sleek-glass-badge"
                          style={opt.badgeColor ? {
                            background: opt.badgeColor,
                            borderColor: opt.badgeColor,
                            color: '#fff'
                          } : undefined}
                        >
                          {opt.badge}
                        </span>
                      )}

                      {isSelected && (
                        <Check size={15} strokeWidth={2.5} className="sleek-glass-dropdown-check" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
