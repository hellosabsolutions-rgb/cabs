import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, LogOut, Shield } from 'lucide-react';

interface TopbarProps {
  title: string;
  crumb: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onToggleMobileSidebar: () => void;
  onNotificationClick: () => void;
  onProfileClick?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  title,
  crumb,
  searchQuery,
  onSearchChange,
  onToggleMobileSidebar,
  onNotificationClick,
  onProfileClick
}) => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="sa-topbar">
      <button type="button" className="sa-hamburger" onClick={onToggleMobileSidebar}>
        <svg viewBox="0 0 24 24" fill="none" stroke="var(--sa-text)" strokeWidth="2" strokeLinecap="round">
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      </button>

      <div>
        <div className="sa-page-title">{title}</div>
        <div className="sa-page-crumb">{crumb}</div>
      </div>

      <div className="sa-search-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          placeholder="Search businesses, users, tickets…"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <button type="button" className="sa-icon-btn" onClick={onNotificationClick} title="View Notifications">
        <span className="sa-dot" />
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      </button>

      {/* User Avatar with Profile Dropdown */}
      <div style={{ position: 'relative' }} ref={dropdownRef}>
        <div
          className="sa-topbar-avatar"
          style={{ cursor: 'pointer' }}
          onClick={() => setDropdownOpen(prev => !prev)}
          title={user?.email || 'Super Admin'}
        >
          {user?.avatar || 'SA'}
        </div>

        {dropdownOpen && (
          <div
            style={{
              position: 'absolute',
              top: '44px',
              right: '0',
              width: '230px',
              background: 'var(--sa-card)',
              border: '1px solid var(--sa-border)',
              borderRadius: '10px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              padding: '12px',
              zIndex: 100,
              color: 'var(--sa-text)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '10px', borderBottom: '1px solid var(--sa-border)' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--sa-blue)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}>
                {user?.avatar || 'SA'}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {user?.name || 'Aarav Mehta'}
                </div>
                <div style={{ fontSize: '11px', color: '#7C8AA8', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {user?.email || 'aarav.mehta@fleetops.in'}
                </div>
              </div>
            </div>

            <div style={{ paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  if (onProfileClick) onProfileClick();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--sa-text)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <User size={14} />
                <span>Admin Profile</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background: 'rgba(228, 87, 46, 0.1)',
                  border: '1px solid rgba(228, 87, 46, 0.25)',
                  color: 'var(--sa-coral)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  marginTop: '4px'
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(228, 87, 46, 0.2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(228, 87, 46, 0.1)')}
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
