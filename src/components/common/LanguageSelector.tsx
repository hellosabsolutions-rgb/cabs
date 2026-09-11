import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Languages, Check, Search, ChevronDown, X } from 'lucide-react';

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage, currentLanguage, availableLanguages, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
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
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const filteredLanguages = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return availableLanguages;
    return availableLanguages.filter(
      (lang) =>
        lang.name.toLowerCase().includes(query) ||
        lang.native.toLowerCase().includes(query) ||
        lang.code.toLowerCase().includes(query) ||
        lang.region.toLowerCase().includes(query)
    );
  }, [search, availableLanguages]);

  const handleSelect = (code: typeof language) => {
    setLanguage(code);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        className="icon-btn language-trigger-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        title={t('lang.title', 'Select Language')}
        aria-label="Language Selector"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '0 10px',
          width: 'auto',
          minWidth: '38px',
          height: '38px',
          borderRadius: '10px',
          border: isOpen ? '1px solid var(--accent)' : '1px solid var(--border)',
          background: isOpen ? 'var(--accent-dim)' : 'var(--surface)',
          color: 'var(--text)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        <Languages size={16} color="var(--accent)" />
        <span
          style={{
            fontSize: '12px',
            fontWeight: 600,
            maxWidth: '75px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {currentLanguage.native}
        </span>
        <ChevronDown
          size={13}
          style={{
            color: 'var(--text-faint)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="language-dropdown-menu"
          style={{
            position: 'absolute',
            top: '46px',
            right: 0,
            width: '320px',
            maxHeight: '440px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
            overflow: 'hidden',
            animation: 'modalSlideUp 0.18s ease',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 14px 10px',
              borderBottom: '1px solid var(--border-soft)',
              background: 'var(--surface-2)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '4px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Languages size={15} color="var(--accent)" />
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
                  {t('lang.title', 'Choose Language')}
                </span>
              </div>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  padding: '2px 6px',
                  borderRadius: '6px',
                  background: 'var(--accent-dim)',
                  color: 'var(--accent)',
                }}
              >
                23 Languages
              </span>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: '11px',
                color: 'var(--text-faint)',
                lineHeight: 1.3,
              }}
            >
              {t('lang.allScheduled', 'All 22 Official Indian Languages + English')}
            </p>

            {/* Search Box */}
            <div
              style={{
                position: 'relative',
                marginTop: '10px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Search
                size={13}
                style={{
                  position: 'absolute',
                  left: '10px',
                  color: 'var(--text-faint)',
                  pointerEvents: 'none',
                }}
              />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('lang.search', 'Search language...')}
                style={{
                  width: '100%',
                  padding: '7px 28px 7px 30px',
                  fontSize: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  outline: 'none',
                }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  style={{
                    position: 'absolute',
                    right: '6px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-faint)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2px',
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Languages List */}
          <div
            style={{
              overflowY: 'auto',
              flex: 1,
              padding: '6px',
            }}
          >
            {filteredLanguages.length === 0 ? (
              <div
                style={{
                  padding: '24px 12px',
                  textAlign: 'center',
                  fontSize: '12px',
                  color: 'var(--text-faint)',
                }}
              >
                No languages match "{search}"
              </div>
            ) : (
              filteredLanguages.map((lang) => {
                const isSelected = lang.code === language;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleSelect(lang.code)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: isSelected
                        ? '1px solid rgba(22, 135, 245, 0.4)'
                        : '1px solid transparent',
                      background: isSelected ? 'var(--accent-dim)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      marginBottom: '2px',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'var(--surface-2)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: isSelected ? 700 : 600,
                            color: isSelected ? 'var(--accent)' : 'var(--text)',
                          }}
                        >
                          {lang.native}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            color: isSelected ? 'var(--accent)' : 'var(--text-dim)',
                          }}
                        >
                          ({lang.name})
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '10px',
                          color: 'var(--text-faint)',
                          lineHeight: 1.2,
                        }}
                      >
                        {lang.region}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          background: 'var(--border-soft)',
                          color: 'var(--text-dim)',
                        }}
                      >
                        {lang.code}
                      </span>
                      {isSelected && <Check size={14} color="var(--accent)" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
