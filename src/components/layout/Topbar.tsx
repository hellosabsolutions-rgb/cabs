import React, { useState, useRef, useEffect } from 'react';
import { useFleet } from '../../context/FleetContext';
import { useAuth } from '../../context/AuthContext';
import { useAgency } from '../../context/AgencyContext';
import { useTheme } from '../../context/ThemeContext';
import { Search, Bell, Menu, RefreshCw, LogOut, User, Shield, Building2, Sun, Moon } from 'lucide-react';

interface TopbarProps {
  onToggleMobileSidebar: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleMobileSidebar }) => {
  const { pageHeader, searchQuery, setSearchQuery, complianceStats, refreshData, isLoading } = useFleet();
  const { user, logout } = useAuth();
  const { currentAgency } = useAgency();
  const { theme, toggleTheme } = useTheme();

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const totalAlerts = complianceStats.expiringSoonCount + complianceStats.expiredCount;

  // Compute initials
  const initials = user?.name
    ? user.name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'AD';

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="menu-toggle" onClick={onToggleMobileSidebar} aria-label="Toggle menu">
          <Menu size={18} />
        </button>
        <div>
          <h1 className="page-title">{pageHeader.title}</h1>
          <p className="page-sub">{pageHeader.subtitle}</p>
        </div>
      </div>

      <div className="topbar-right">
        <div className="search-box">
          <Search size={14} className="search-icon" />
          <input
            className="search"
            placeholder="Search vehicles, trips, drivers..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <button
          type="button"
          className="icon-btn"
          onClick={refreshData}
          disabled={isLoading}
          title="Synchronize & refresh fleet data"
          aria-label="Refresh data"
        >
          <RefreshCw size={15} className={isLoading ? 'spin-loader' : ''} />
        </button>

        <button
          type="button"
          className="icon-btn"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode (Blue KABPRO)' : 'Switch to Dark Mode (Dark KABPRO)'}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={15} color="#ffcc4d" /> : <Moon size={15} color="#3b82f6" />}
        </button>

        <div className="icon-btn" title={`${totalAlerts} active alert(s)`}>
          <Bell size={16} />
          {totalAlerts > 0 && <div className="dot" />}
        </div>

        {/* Profile Avatar & Dropdown Menu */}
        <div style={{ position: 'relative' }} ref={profileRef}>
          <div
            className="avatar"
            onClick={() => setProfileOpen(prev => !prev)}
            title={`Logged in as ${user?.name || 'Administrator'}`}
          >
            {initials}
          </div>

          {profileOpen && (
            <div
              style={{
                position: 'absolute',
                top: '46px',
                right: 0,
                width: 240,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
                padding: '12px',
                zIndex: 100,
                animation: 'modalSlideUp 0.18s ease'
              }}
            >
              {/* User Info Card */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  paddingBottom: '10px',
                  borderBottom: '1px solid var(--border-soft)'
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '10px',
                    background: 'var(--accent-dim)',
                    color: 'var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '13px'
                  }}
                >
                  {initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user?.name || 'Administrator'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-faint)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user?.email || 'admin@kabpro.com'}
                  </div>
                </div>
              </div>

              {/* Role badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 0 6px',
                  fontSize: '11px',
                  color: 'var(--text-dim)'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Shield size={12} color="var(--accent)" /> Access Role:
                </span>
                <span
                  style={{
                    background: 'var(--accent-dim)',
                    color: 'var(--accent)',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    fontSize: '10px'
                  }}
                >
                  {user?.role || 'admin'}
                </span>
              </div>

              {/* Agency Name */}
              {currentAgency && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 0 10px',
                    fontSize: '11px',
                    color: 'var(--text-dim)'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Building2 size={12} color="#38bdf8" /> Active Agency:
                  </span>
                  <span
                    style={{
                      maxWidth: 120,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontWeight: 600,
                      color: 'var(--text)'
                    }}
                    title={currentAgency.name}
                  >
                    {currentAgency.name}
                  </span>
                </div>
              )}

              {/* Logout Button */}
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  logout();
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '8px 0',
                  borderRadius: '8px',
                  border: '1px solid var(--danger)',
                  background: 'var(--danger-bg)',
                  color: 'var(--danger)',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <LogOut size={13} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
