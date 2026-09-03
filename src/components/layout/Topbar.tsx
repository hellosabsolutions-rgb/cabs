import React from 'react';
import { useFleet } from '../../context/FleetContext';
import { Search, Bell, Menu, RefreshCw } from 'lucide-react';

interface TopbarProps {
  onToggleMobileSidebar: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleMobileSidebar }) => {
  const { pageHeader, searchQuery, setSearchQuery, complianceStats, refreshData, isLoading } = useFleet();

  const totalAlerts = complianceStats.expiringSoonCount + complianceStats.expiredCount;

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

        <div className="icon-btn" title={`${totalAlerts} active alert(s)`}>
          <Bell size={16} />
          {totalAlerts > 0 && <div className="dot" />}
        </div>

        <div className="avatar" title="User Profile">
          RS
        </div>
      </div>
    </header>
  );
};
