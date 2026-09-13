import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFleet } from '../../context/FleetContext';
import { useAuth } from '../../context/AuthContext';
import { useAgency } from '../../context/AgencyContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSelector } from '../common/LanguageSelector';
import { Search, Bell, Menu, RefreshCw, LogOut, User, Shield, Building2, Sun, Moon } from 'lucide-react';

interface TopbarProps {
  onToggleMobileSidebar: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleMobileSidebar }) => {
  const { pageHeader, searchQuery, setSearchQuery, complianceStats, refreshData, isLoading } = useFleet();
  const { user, logout } = useAuth();
  const { currentAgency } = useAgency();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount, isConnected } = useNotifications();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const totalAlerts = complianceStats.expiringSoonCount + complianceStats.expiredCount;
  const displayCount = unreadCount > 0 ? unreadCount : totalAlerts;

  // Resolve translated page title & subtitle based on path
  const pathSegment = location.pathname.split('/')[1] || 'dashboard';
  const pageTitleKey = `page.${pathSegment}.title` as any;
  const pageSubKey = `page.${pathSegment}.sub` as any;
  const title = t(pageTitleKey, pageHeader.title);
  const subtitle = t(pageSubKey, pageHeader.subtitle);

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
          <h1 className="page-title">{title}</h1>
          <p className="page-sub">{subtitle}</p>
        </div>
      </div>

      <div className="topbar-right">
        <div className="search-box">
          <Search size={14} className="search-icon" />
          <input
            className="search"
            placeholder={t('topbar.searchPlaceholder', 'Search vehicles, trips, drivers...')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <button
          type="button"
          className="icon-btn"
          onClick={refreshData}
          disabled={isLoading}
          title={t('topbar.refreshTooltip', 'Synchronize & refresh fleet data')}
          aria-label="Refresh data"
        >
          <RefreshCw size={15} className={isLoading ? 'spin-loader' : ''} />
        </button>

        {/* Indian Native Languages Selector */}
        <LanguageSelector />

        <button
          type="button"
          className="icon-btn"
          onClick={toggleTheme}
          title={theme === 'dark' ? t('topbar.themeLight', 'Switch to light mode') : t('topbar.themeDark', 'Switch to dark mode')}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={15} color="#fff36a" /> : <Moon size={15} color="#1687f5" />}
        </button>

        <div
          className="icon-btn"
          title={`${displayCount} active notification(s) • ${isConnected ? 'Real-time Connected' : 'Connecting...'}`}
          onClick={() => navigate('/notifications')}
          style={{ cursor: 'pointer', position: 'relative' }}
        >
          <Bell size={16} />
          {displayCount > 0 ? (
            <div className="badge-pill">
              {displayCount > 99 ? '99+' : displayCount}
            </div>
          ) : isConnected ? (
            <span
              style={{
                position: 'absolute',
                bottom: '5px',
                right: '5px',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--success)'
              }}
              title="Socket connected"
            />
          ) : null}
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
                  <Shield size={12} color="var(--accent)" /> {t('topbar.role', 'Access Role:')}
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
                    <Building2 size={12} color="#38bdf8" /> {t('topbar.activeAgency', 'Active Agency:')}
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

              {/* View Profile Button */}
              <button
                type="button"
                onClick={() => { setProfileOpen(false); navigate('/profile'); }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '8px 0',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                  color: 'var(--text)',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  marginBottom: '8px'
                }}
              >
                <User size={13} /> {t('topbar.viewProfile', 'View Profile')}
              </button>

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
                <LogOut size={13} /> {t('topbar.signOut', 'Sign Out')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
