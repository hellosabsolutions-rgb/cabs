import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, Loader2 } from 'lucide-react';

export interface CustomDropdownOption<T = string> {
  value: T;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  disabled?: boolean;
}

export interface CustomDropdownProps<T = string> {
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

export function CustomDropdown<T extends string | number>({
  value,
  onChange,
  options,
  placeholder = 'Select option...',
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
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Find currently selected option
  const selectedOption = options.find(opt => opt.value === value);

  // Automatically toggle & trigger onOpen
  const handleToggle = () => {
    if (disabled) return;
    const willOpen = !isOpen;
    setIsOpen(willOpen);
    if (willOpen && onOpen) {
      onOpen();
    }
  };

  // Close on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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

  return (
    <div
      ref={containerRef}
      className={`sleek-glass-dropdown custom-dropdown-container ${className}`}
      style={{ position: 'relative', width: '100%', ...style }}
    >
      {/* Trigger Button */}
      <button
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
            <Loader2 size={14} className="spin-animation" style={{ color: 'var(--accent, #38bdf8)', flexShrink: 0 }} />
          ) : selectedOption?.icon || icon ? (
            <span className="sleek-glass-dropdown-icon">
              {selectedOption?.icon || icon}
            </span>
          ) : null}

          <span
            className="sleek-glass-dropdown-label"
            style={{
              color: selectedOption ? 'inherit' : 'var(--text-faint, rgba(255,255,255,0.4))',
            }}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>

          {selectedOption?.sublabel && (
            <span className="sleek-glass-dropdown-sublabel">
              ({selectedOption.sublabel})
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
          size={14}
          className="sleek-glass-dropdown-chevron"
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          data-no-modal-close="true"
          className="sleek-glass-dropdown-menu"
          style={menuStyle}
          role="listbox"
        >
          {/* Search bar inside dropdown if searchable */}
          {searchable && (
            <div className="sleek-glass-dropdown-search-box">
              <Search
                size={13}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-faint, rgba(255,255,255,0.4))',
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
                  padding: '14px 10px',
                  color: 'var(--accent, #38bdf8)',
                  fontSize: '11.5px',
                }}
              >
                <Loader2 size={14} className="spin-animation" />
                <span>Fetching options...</span>
              </div>
            )}

            {filteredOptions.length === 0 && !isLoading ? (
              <div
                style={{
                  padding: '16px 10px',
                  textAlign: 'center',
                  fontSize: '11.5px',
                  color: 'var(--text-faint, rgba(255,255,255,0.4))',
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
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`sleek-glass-dropdown-item ${isSelected ? 'is-selected' : ''}`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1 }}>
                      {opt.icon && (
                        <span className="sleek-glass-dropdown-item-icon">
                          {opt.icon}
                        </span>
                      )}
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {opt.label}
                      </span>
                      {opt.sublabel && (
                        <span style={{ fontSize: '11px', color: 'var(--text-faint, rgba(255,255,255,0.4))', flexShrink: 0 }}>
                          ({opt.sublabel})
                        </span>
                      )}
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
                      <Check size={13.5} strokeWidth={2.5} className="sleek-glass-dropdown-check" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
