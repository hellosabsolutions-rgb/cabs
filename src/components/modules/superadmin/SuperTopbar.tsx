import React from 'react';

interface SuperTopbarProps {
  title: string;
  crumb: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onToggleMobileSidebar: () => void;
  onNotificationClick: () => void;
}

export const SuperTopbar: React.FC<SuperTopbarProps> = ({
  title,
  crumb,
  searchQuery,
  onSearchChange,
  onToggleMobileSidebar,
  onNotificationClick
}) => {
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

      <div className="sa-topbar-avatar" title="Super Admin Account">
        SA
      </div>
    </div>
  );
};
