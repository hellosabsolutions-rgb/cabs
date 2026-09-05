import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useFleet } from '../../context/FleetContext';
import { useTheme } from '../../context/ThemeContext';
import { AgencySwitcher } from './AgencySwitcher';
import {
  LayoutDashboard,
  Truck,
  Users,
  CalendarCheck,
  Receipt,
  FileText,
  ClipboardList,
  ReceiptText,
  CreditCard,
  Navigation,
  IndianRupee,
  TrendingUp,
  ShieldAlert,
  Wrench,
  BarChart2,
  Bell,
  Settings,
  Sun,
  Moon,
  Fuel
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onCloseMobile }) => {
  const { complianceStats } = useFleet();
  const { theme, setTheme } = useTheme();
  const location = useLocation();

  const totalAlerts = complianceStats.expiringSoonCount + complianceStats.expiredCount;
  const currentPath = location.pathname.toLowerCase();

  const isItemActive = (path: string, exact = false) => {
    if (exact) return currentPath === path;
    if (path === '/dashboard') return currentPath === '/' || currentPath.startsWith('/dashboard');
    if (path === '/booking' || path === '/bookings') return currentPath.startsWith('/booking') || currentPath.startsWith('/bookings') || currentPath.startsWith('/trips');
    if (path === '/drivers/list') return currentPath === '/drivers' || currentPath.startsWith('/drivers/list');
    if (path === '/departments/contracts') return currentPath === '/departments' || currentPath.startsWith('/departments/contracts');
    if (path === '/expenses/fastag') return currentPath === '/expenses' || currentPath.startsWith('/expenses/fastag');
    return currentPath.startsWith(path);
  };

  const navClass = (path: string, exact = false) => {
    return `nav-item ${isItemActive(path, exact) ? 'active' : ''}`;
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 16px 14px' }}>
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '3px',
            boxShadow: theme === 'dark'
              ? '0 2px 10px rgba(0, 230, 153, 0.15), 0 0 0 1px rgba(255,255,255,0.1)'
              : '0 2px 10px rgba(37, 99, 235, 0.15), 0 0 0 1px rgba(0,0,0,0.06)',
            flexShrink: 0,
            overflow: 'hidden',
            transition: 'all 0.3s ease'
          }}
        >
          <img
            src={theme === 'dark' ? '/logo-dark.jpg' : '/logo-light.png'}
            alt="KABPRO Logo"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              borderRadius: '8px'
            }}
          />
        </div>
        <div>
          <div className="brand-name" style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '0.5px' }}>
            KABPRO
          </div>
          <div className="brand-sub" style={{ fontSize: '10px', color: 'var(--text-faint)', letterSpacing: '0.4px' }}>
            Commercial Fleet
          </div>
        </div>
      </div>

      {/* Agency Switcher & Profile Dropdown */}
      <div style={{ padding: '0 12px 12px' }}>
        <AgencySwitcher />
      </div>

      <div className="nav" id="nav">
        {/* Dashboard */}
        <div className="nav-group">
          <NavLink
            to="/dashboard"
            className={navClass('/dashboard')}
            onClick={onCloseMobile}
          >
            <LayoutDashboard />
            Dashboard
          </NavLink>
        </div>

        {/* Vehicles */}
        <div className="nav-group">
          <div className="nav-label">Vehicles</div>
          <NavLink
            to="/vehicles"
            className={navClass('/vehicles')}
            onClick={onCloseMobile}
          >
            <Truck />
            Vehicles
          </NavLink>
        </div>

        {/* Drivers */}
        <div className="nav-group">
          <div className="nav-label">Drivers</div>
          <NavLink
            to="/drivers/list"
            className={navClass('/drivers/list')}
            onClick={onCloseMobile}
          >
            <Users />
            Driver list
          </NavLink>
          <NavLink
            to="/drivers/attendance"
            className={navClass('/drivers/attendance')}
            onClick={onCloseMobile}
          >
            <CalendarCheck />
            Attendance
          </NavLink>
          <NavLink
            to="/drivers/expenses"
            className={navClass('/drivers/expenses')}
            onClick={onCloseMobile}
          >
            <Receipt />
            Driver expenses
          </NavLink>
        </div>

        {/* Departments & Contracts */}
        <div className="nav-group">
          <div className="nav-label">Departments & contracts</div>
          <NavLink
            to="/departments/contracts"
            className={navClass('/departments/contracts')}
            onClick={onCloseMobile}
          >
            <FileText />
            Contracts
          </NavLink>
          <NavLink
            to="/departments/duty-logs"
            className={navClass('/departments/duty-logs')}
            onClick={onCloseMobile}
          >
            <ClipboardList />
            Daily duty logs
          </NavLink>
          <NavLink
            to="/departments/billing"
            className={navClass('/departments/billing')}
            onClick={onCloseMobile}
          >
            <ReceiptText />
            Monthly billing
          </NavLink>
          <NavLink
            to="/departments/payments"
            className={navClass('/departments/payments')}
            onClick={onCloseMobile}
          >
            <CreditCard />
            Payments
          </NavLink>
        </div>

        {/* Booking */}
        <div className="nav-group">
          <div className="nav-label">Booking</div>
          <NavLink
            to="/booking"
            className={navClass('/booking')}
            onClick={onCloseMobile}
          >
            <Navigation />
            Booking
          </NavLink>
        </div>

        {/* Money */}
        <div className="nav-group">
          <div className="nav-label">Money</div>
          <NavLink
            to="/expenses/fastag"
            className={navClass('/expenses/fastag')}
            onClick={onCloseMobile}
          >
            <CreditCard />
            FASTag per vehicle
          </NavLink>
          <NavLink
            to="/expenses/fuel"
            className={navClass('/expenses/fuel')}
            onClick={onCloseMobile}
          >
            <Fuel />
            Fuel tracking & logs
          </NavLink>
          <NavLink
            to="/expenses/all"
            className={navClass('/expenses/all')}
            onClick={onCloseMobile}
          >
            <IndianRupee />
            All expenses
          </NavLink>
          <NavLink
            to="/profitability"
            className={navClass('/profitability')}
            onClick={onCloseMobile}
          >
            <TrendingUp />
            Profitability
          </NavLink>
          <NavLink
            to="/profitability"
            className={navClass('/profitability', true)}
            onClick={onCloseMobile}
          >
            <IndianRupee />
            Revenue
          </NavLink>
        </div>

        {/* Compliance */}
        <div className="nav-group">
          <div className="nav-label">Compliance</div>
          <NavLink
            to="/compliance"
            className={navClass('/compliance')}
            onClick={onCloseMobile}
          >
            <ShieldAlert />
            Vehicle & driver docs
            {totalAlerts > 0 && <span className="badge">{totalAlerts}</span>}
          </NavLink>
          <NavLink
            to="/maintenance"
            className={navClass('/maintenance')}
            onClick={onCloseMobile}
          >
            <Wrench />
            Maintenance
          </NavLink>
        </div>

        {/* System */}
        <div className="nav-group">
          <div className="nav-label">System</div>
          <NavLink to="/dashboard" className="nav-item" onClick={onCloseMobile}>
            <BarChart2 />
            Reports
          </NavLink>
          <NavLink to="/dashboard" className="nav-item" onClick={onCloseMobile}>
            <Bell />
            Notifications
          </NavLink>
          <NavLink to="/dashboard" className="nav-item" onClick={onCloseMobile}>
            <Settings />
            Settings
          </NavLink>
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
