import React from 'react';
import { useFleet } from '../../context/FleetContext';
import { useTheme } from '../../context/ThemeContext';
import { PageId } from '../../types/fleet';
import {
  LayoutDashboard,
  Truck,
  Users,
  FileText,
  Navigation,
  DollarSign,
  TrendingUp,
  ShieldAlert,
  Wrench,
  BarChart2,
  Bell,
  Settings,
  Sun,
  Moon
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onCloseMobile }) => {
  const { activePage, setActivePage, complianceStats } = useFleet();
  const { theme, setTheme } = useTheme();

  const totalAlerts = complianceStats.expiringSoonCount + complianceStats.expiredCount;

  const handleNavClick = (page: PageId) => {
    setActivePage(page);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="brand">
        <div className="brand-dot"></div>
        <div>
          <div className="brand-name">FleetOS</div>
          <div className="brand-sub">Admin console</div>
        </div>
      </div>

      <div className="nav" id="nav">
        <div className="nav-group">
          <div
            className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleNavClick('dashboard')}
          >
            <LayoutDashboard />
            Dashboard
          </div>
        </div>

        <div className="nav-group">
          <div className="nav-label">Vehicles</div>
          <div
            className={`nav-item ${activePage === 'vehicles' ? 'active' : ''}`}
            onClick={() => handleNavClick('vehicles')}
          >
            <Truck />
            All vehicles
          </div>
          <div className="nav-item" onClick={() => handleNavClick('vehicles')}>
            Department vehicles
          </div>
          <div className="nav-item" onClick={() => handleNavClick('vehicles')}>
            Trip vehicles
          </div>
          <div className="nav-item" onClick={() => handleNavClick('vehicles')}>
            Live tracking
          </div>
        </div>

        <div className="nav-group">
          <div className="nav-label">Drivers</div>
          <div
            className={`nav-item ${activePage === 'drivers' ? 'active' : ''}`}
            onClick={() => handleNavClick('drivers')}
          >
            <Users />
            Driver list
          </div>
          <div className="nav-item" onClick={() => handleNavClick('drivers')}>
            Attendance
          </div>
          <div className="nav-item" onClick={() => handleNavClick('drivers')}>
            Driver expenses
          </div>
        </div>

        <div className="nav-group">
          <div className="nav-label">Departments & contracts</div>
          <div
            className={`nav-item ${activePage === 'departments' ? 'active' : ''}`}
            onClick={() => handleNavClick('departments')}
          >
            <FileText />
            Contracts
          </div>
          <div className="nav-item" onClick={() => handleNavClick('departments')}>
            Daily duty logs
          </div>
          <div className="nav-item" onClick={() => handleNavClick('departments')}>
            Monthly billing
          </div>
          <div className="nav-item" onClick={() => handleNavClick('departments')}>
            Payments
          </div>
        </div>

        <div className="nav-group">
          <div className="nav-label">Trips</div>
          <div
            className={`nav-item ${activePage === 'trips' ? 'active' : ''}`}
            onClick={() => handleNavClick('trips')}
          >
            <Navigation />
            All trips
          </div>
          <div className="nav-item" onClick={() => handleNavClick('trips')}>
            Running
          </div>
          <div className="nav-item" onClick={() => handleNavClick('trips')}>
            Completed
          </div>
        </div>

        <div className="nav-group">
          <div className="nav-label">Money</div>
          <div
            className={`nav-item ${activePage === 'expenses' ? 'active' : ''}`}
            onClick={() => handleNavClick('expenses')}
          >
            <DollarSign />
            Expenses
          </div>
          <div
            className={`nav-item ${activePage === 'profitability' ? 'active' : ''}`}
            onClick={() => handleNavClick('profitability')}
          >
            <TrendingUp />
            Profitability
          </div>
          <div className="nav-item" onClick={() => handleNavClick('dashboard')}>
            Revenue
          </div>
        </div>

        <div className="nav-group">
          <div className="nav-label">Compliance</div>
          <div
            className={`nav-item ${activePage === 'compliance' ? 'active' : ''}`}
            onClick={() => handleNavClick('compliance')}
          >
            <ShieldAlert />
            Vehicle & driver docs
            {totalAlerts > 0 && <span className="badge">{totalAlerts}</span>}
          </div>
          <div
            className={`nav-item ${activePage === 'maintenance' ? 'active' : ''}`}
            onClick={() => handleNavClick('maintenance')}
          >
            <Wrench />
            Maintenance
          </div>
        </div>

        <div className="nav-group">
          <div className="nav-label">System</div>
          <div className="nav-item" onClick={() => handleNavClick('dashboard')}>
            <BarChart2 />
            Reports
          </div>
          <div className="nav-item" onClick={() => handleNavClick('dashboard')}>
            <Bell />
            Notifications
          </div>
          <div className="nav-item" onClick={() => handleNavClick('dashboard')}>
            <Settings />
            Settings
          </div>
        </div>
      </div>

      <div className="theme-toggle-wrap">
        <div className="theme-toggle">
          <div
            className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
            onClick={() => setTheme('dark')}
          >
            <Moon size={14} /> Dark
          </div>
          <div
            className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
            onClick={() => setTheme('light')}
          >
            <Sun size={14} /> Light
          </div>
        </div>
      </div>
    </aside>
  );
};
