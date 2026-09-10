import React, { useEffect, useState } from 'react';

interface SuperSidebarProps {
  activeView: string;
  onNavigate: (view: string, options?: { tab?: string; filter?: string }) => void;
  isOpen: boolean;
  onClose: () => void;
  counts?: {
    businesses?: number;
    activeSubs?: number;
    tickets?: number;
    notifs?: number;
  };
}

export const SuperSidebar: React.FC<SuperSidebarProps> = ({
  activeView,
  onNavigate,
  isOpen,
  onClose,
  counts = { businesses: 42, activeSubs: 38, tickets: 6, notifs: 4 }
}) => {
  const [clock, setClock] = useState('--:--:--');

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setClock(d.toLocaleTimeString('en-IN', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className={`sa-sidebar ${isOpen ? 'open' : ''}`}>
      {/* Brand Header */}
      <div className="sa-brand">
        <div className="sa-brand-mark">
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12h4l2-6h6l2 6h4" />
            <circle cx="7.5" cy="16.5" r="2.5" />
            <circle cx="16.5" cy="16.5" r="2.5" />
          </svg>
        </div>
        <div>
          <div className="sa-brand-name">FleetOps</div>
          <div className="sa-brand-sub">Super Admin</div>
        </div>
      </div>

      {/* Pulse Status */}
      <div className="sa-sys-status">
        <span className="sa-pulse-dot" />
        <span className="sa-sys-status-text">
          All systems <b>operational</b>
        </span>
        <span className="sa-sys-clock mono">{clock}</span>
      </div>

      {/* Navigation Links */}
      <nav className="sa-nav">
        {/* Dashboard */}
        <div className="sa-nav-group">
          <button
            type="button"
            className={`sa-nav-item ${activeView === 'dashboard' ? 'active' : ''}`}
            onClick={() => onNavigate('dashboard')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="9" rx="1.5" />
              <rect x="14" y="3" width="7" height="5" rx="1.5" />
              <rect x="14" y="12" width="7" height="9" rx="1.5" />
              <rect x="3" y="16" width="7" height="5" rx="1.5" />
            </svg>
            Dashboard
          </button>
        </div>

        {/* Businesses */}
        <div className="sa-nav-group">
          <div className="sa-nav-label">Businesses</div>
          <button
            type="button"
            className={`sa-nav-item ${activeView === 'businesses' ? 'active' : ''}`}
            onClick={() => onNavigate('businesses', { filter: 'all' })}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21h18" />
              <path d="M5 21V7l7-4 7 4v14" />
              <path d="M9 9h.01M9 13h.01M15 9h.01M15 13h.01" />
            </svg>
            All Businesses
            <span className="sa-nav-badge">{counts.businesses ?? 42}</span>
          </button>
          <div className="sa-nav-sub">
            <button type="button" className="sa-nav-item" onClick={() => onNavigate('businesses', { filter: 'Active' })}>
              Active
            </button>
            <button type="button" className="sa-nav-item" onClick={() => onNavigate('businesses', { filter: 'Trial' })}>
              Trial
            </button>
            <button type="button" className="sa-nav-item" onClick={() => onNavigate('businesses', { filter: 'Expired' })}>
              Expired
            </button>
            <button type="button" className="sa-nav-item" onClick={() => onNavigate('businesses', { filter: 'Suspended' })}>
              Suspended
            </button>
          </div>
        </div>

        {/* Subscriptions */}
        <div className="sa-nav-group">
          <div className="sa-nav-label">Subscriptions</div>
          <button
            type="button"
            className={`sa-nav-item ${activeView === 'subscriptions' ? 'active' : ''}`}
            onClick={() => onNavigate('subscriptions', { tab: 'plans' })}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2.5" />
              <path d="M2 10h20" />
            </svg>
            Plans
          </button>
          <div className="sa-nav-sub">
            <button type="button" className="sa-nav-item" onClick={() => onNavigate('subscriptions', { tab: 'active' })}>
              Active Subscriptions
            </button>
            <button type="button" className="sa-nav-item" onClick={() => onNavigate('subscriptions', { tab: 'expiring' })}>
              Expiring Soon
            </button>
            <button type="button" className="sa-nav-item" onClick={() => onNavigate('subscriptions', { tab: 'cancelled' })}>
              Cancelled
            </button>
          </div>
        </div>

        {/* Payments */}
        <div className="sa-nav-group">
          <div className="sa-nav-label">Payments</div>
          <button
            type="button"
            className={`sa-nav-item ${activeView === 'payments' ? 'active' : ''}`}
            onClick={() => onNavigate('payments', { tab: 'transactions' })}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1v22" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            Transactions
          </button>
          <div className="sa-nav-sub">
            <button type="button" className="sa-nav-item" onClick={() => onNavigate('payments', { tab: 'revenue' })}>
              Revenue
            </button>
            <button type="button" className="sa-nav-item" onClick={() => onNavigate('payments', { tab: 'failed' })}>
              Failed Payments
            </button>
            <button type="button" className="sa-nav-item" onClick={() => onNavigate('payments', { tab: 'refunds' })}>
              Refunds
            </button>
          </div>
        </div>

        {/* Users */}
        <div className="sa-nav-group">
          <button
            type="button"
            className={`sa-nav-item ${activeView === 'users' ? 'active' : ''}`}
            onClick={() => onNavigate('users')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Users
          </button>
        </div>

        {/* Analytics */}
        <div className="sa-nav-group">
          <div className="sa-nav-label">Analytics</div>
          <button
            type="button"
            className={`sa-nav-item ${activeView === 'analytics' ? 'active' : ''}`}
            onClick={() => onNavigate('analytics', { tab: 'usage' })}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 20V10M12 20V4M6 20v-6" />
            </svg>
            Platform Usage
          </button>
          <div className="sa-nav-sub">
            <button type="button" className="sa-nav-item" onClick={() => onNavigate('analytics', { tab: 'growth' })}>
              Business Growth
            </button>
            <button type="button" className="sa-nav-item" onClick={() => onNavigate('analytics', { tab: 'revenue-a' })}>
              Revenue Analytics
            </button>
          </div>
        </div>

        {/* Support */}
        <div className="sa-nav-group">
          <div className="sa-nav-label">Support</div>
          <button
            type="button"
            className={`sa-nav-item ${activeView === 'support' ? 'active' : ''}`}
            onClick={() => onNavigate('support', { tab: 'tickets' })}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Tickets
            <span className="sa-nav-badge">{counts.tickets ?? 6}</span>
          </button>
          <div className="sa-nav-sub">
            <button type="button" className="sa-nav-item" onClick={() => onNavigate('support', { tab: 'feedback' })}>
              Feedback
            </button>
          </div>
        </div>

        {/* System & Audit */}
        <div className="sa-nav-group">
          <button
            type="button"
            className={`sa-nav-item ${activeView === 'notifications' ? 'active' : ''}`}
            onClick={() => onNavigate('notifications')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            Notifications
            <span className="sa-nav-badge">{counts.notifs ?? 4}</span>
          </button>

          <button
            type="button"
            className={`sa-nav-item ${activeView === 'audit' ? 'active' : ''}`}
            onClick={() => onNavigate('audit')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 3" />
            </svg>
            Audit Logs
          </button>

          <button
            type="button"
            className={`sa-nav-item ${activeView === 'settings' ? 'active' : ''}`}
            onClick={() => onNavigate('settings')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Settings
          </button>
        </div>
      </nav>

      {/* Internal Staff Profile Footer */}
      <div className="sa-sidebar-foot">
        <div className="sa-avatar">SA</div>
        <div>
          <div className="sa-foot-name">Aarav Mehta</div>
          <div className="sa-foot-role">Super Admin</div>
        </div>
      </div>
    </aside>
  );
};
