import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useFleet } from '../../context/FleetContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
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
  Fuel,
  Banknote,
  LifeBuoy,
  Activity
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onCloseMobile }) => {
  const { complianceStats } = useFleet();
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();
  const location = useLocation();

  const totalAlerts = complianceStats.expiringSoonCount + complianceStats.expiredCount;
  const currentPath = location.pathname.toLowerCase();

  const isItemActive = (path: string, exact = false) => {
    if (exact) return currentPath === path;
    if (path === '/dashboard') return currentPath === '/' || currentPath.startsWith('/dashboard');
    if (path === '/booking' || path === '/bookings') return currentPath.startsWith('/booking') || currentPath.startsWith('/bookings') || currentPath.startsWith('/trips');
    if (path === '/drivers/list') return currentPath === '/drivers' || currentPath === '/drivers/' || currentPath.startsWith('/drivers/list');
    if (path === '/drivers/payroll') return currentPath.startsWith('/drivers/payroll');
    if (path === '/departments/contracts') return currentPath === '/departments' || currentPath.startsWith('/departments/contracts');
    if (path === '/expenses/fastag') return currentPath === '/expenses' || currentPath.startsWith('/expenses/fastag');
    if (path === '/report' || path === '/reports') return currentPath.startsWith('/report') || currentPath.startsWith('/reports');
    return currentPath.startsWith(path);
  };

  const navClass = (path: string, exact = false) => {
    return `nav-item ${isItemActive(path, exact) ? 'active' : ''}`;
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="brand">
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
              ? '0 2px 10px rgba(22, 135, 245, 0.2), 0 0 0 1px rgba(255,255,255,0.08)'
              : '0 2px 10px rgba(22, 135, 245, 0.15), 0 0 0 1px rgba(0,0,0,0.06)',
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
            {t('brand.subtitle', 'Commercial Fleet')}
          </div>
        </div>
      </div>

      {/* Agency Switcher & Profile Dropdown */}
      <div style={{ padding: '14px 12px 8px' }}>
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
            {t('nav.dashboard', 'Dashboard')}
          </NavLink>
        </div>

        {/* Vehicles */}
        <div className="nav-group">
          <div className="nav-label">{t('nav.group.vehicles', 'Vehicles')}</div>
          <NavLink
            to="/vehicles"
            className={navClass('/vehicles')}
            onClick={onCloseMobile}
          >
            <Truck />
            {t('nav.vehicles', 'Vehicles')}
          </NavLink>
        </div>

        {/* Drivers */}
        <div className="nav-group">
          <div className="nav-label">{t('nav.group.drivers', 'Drivers')}</div>
          <NavLink
            to="/drivers/list"
            className={navClass('/drivers/list')}
            onClick={onCloseMobile}
          >
            <Users />
            {t('nav.driverList', 'Driver list')}
          </NavLink>
          <NavLink
            to="/drivers/attendance"
            className={navClass('/drivers/attendance')}
            onClick={onCloseMobile}
          >
            <CalendarCheck />
            {t('nav.attendance', 'Attendance')}
          </NavLink>
          <NavLink
            to="/drivers/expenses"
            className={navClass('/drivers/expenses')}
            onClick={onCloseMobile}
          >
            <Receipt />
            {t('nav.driverExpenses', 'Driver expenses')}
          </NavLink>
          <NavLink
            to="/drivers/payroll"
            className={navClass('/drivers/payroll')}
            onClick={onCloseMobile}
          >
            <Banknote />
            {t('nav.driverPayroll', 'Driver payroll')}
          </NavLink>
        </div>

        {/* Departments & Contracts */}
        <div className="nav-group">
          <div className="nav-label">{t('nav.group.departments', 'Departments & contracts')}</div>
          <NavLink
            to="/departments/contracts"
            className={navClass('/departments/contracts')}
            onClick={onCloseMobile}
          >
            <FileText />
            {t('nav.contracts', 'Contracts')}
          </NavLink>
          <NavLink
            to="/departments/duty-logs"
            className={navClass('/departments/duty-logs')}
            onClick={onCloseMobile}
          >
            <ClipboardList />
            {t('nav.dutyLogs', 'Daily duty logs')}
          </NavLink>
          <NavLink
            to="/departments/billing"
            className={navClass('/departments/billing')}
            onClick={onCloseMobile}
          >
            <ReceiptText />
            {t('nav.billing', 'Monthly billing')}
          </NavLink>
          <NavLink
            to="/departments/payments"
            className={navClass('/departments/payments')}
            onClick={onCloseMobile}
          >
            <CreditCard />
            {t('nav.payments', 'Payments')}
          </NavLink>
        </div>

        {/* Booking */}
        <div className="nav-group">
          <div className="nav-label">{t('nav.group.booking', 'Booking')}</div>
          <NavLink
            to="/booking"
            className={navClass('/booking')}
            onClick={onCloseMobile}
          >
            <Navigation />
            {t('nav.booking', 'Booking')}
          </NavLink>
        </div>

        {/* Money */}
        <div className="nav-group">
          <div className="nav-label">{t('nav.group.money', 'Money')}</div>
          <NavLink
            to="/expenses/fastag"
            className={navClass('/expenses/fastag')}
            onClick={onCloseMobile}
          >
            <CreditCard />
            {t('nav.fastag', 'FASTag per vehicle')}
          </NavLink>
          <NavLink
            to="/expenses/fuel"
            className={navClass('/expenses/fuel')}
            onClick={onCloseMobile}
          >
            <Fuel />
            {t('nav.fuelTracking', 'Fuel tracking & logs')}
          </NavLink>
          <NavLink
            to="/expenses/all"
            className={navClass('/expenses/all')}
            onClick={onCloseMobile}
          >
            <IndianRupee />
            {t('nav.allExpenses', 'All expenses')}
          </NavLink>
          <NavLink
            to="/profitability"
            className={navClass('/profitability')}
            onClick={onCloseMobile}
          >
            <TrendingUp />
            {t('nav.profitability', 'Profitability')}
          </NavLink>
          <NavLink
            to="/profitability"
            className={navClass('/profitability', true)}
            onClick={onCloseMobile}
          >
            <IndianRupee />
            {t('nav.revenue', 'Revenue')}
          </NavLink>
        </div>

        {/* Compliance */}
        <div className="nav-group">
          <div className="nav-label">{t('nav.group.compliance', 'Compliance')}</div>
          <NavLink
            to="/compliance"
            className={navClass('/compliance')}
            onClick={onCloseMobile}
          >
            <ShieldAlert />
            {t('nav.documents', 'Documents')}
            {totalAlerts > 0 && <span className="badge">{totalAlerts}</span>}
          </NavLink>
          <NavLink
            to="/maintenance"
            className={navClass('/maintenance')}
            onClick={onCloseMobile}
          >
            <Wrench />
            {t('nav.maintenance', 'Maintenance')}
          </NavLink>
        </div>

        {/* System */}
        <div className="nav-group">
          <div className="nav-label">{t('nav.group.system', 'System')}</div>
          <NavLink
            to="/activity"
            className={navClass('/activity')}
            onClick={onCloseMobile}
          >
            <Activity />
            {t('nav.activity', 'Activity')}
          </NavLink>
          <NavLink
            to="/report"
            className={navClass('/report')}
            onClick={onCloseMobile}
          >
            <LifeBuoy />
            {t('nav.report', 'Report')}
          </NavLink>
          <NavLink
            to="/notifications"
            className={navClass('/notifications')}
            onClick={onCloseMobile}
          >
            <Bell />
            {t('nav.notifications', 'Notifications')}
            {totalAlerts > 0 && <span className="badge">{totalAlerts}</span>}
          </NavLink>
          <NavLink
            to="/profile"
            className={navClass('/profile')}
            onClick={onCloseMobile}
          >
            <Settings />
            {t('nav.profile', 'Profile & Settings')}
          </NavLink>
        </div>
      </div>

      <div className="theme-toggle-wrap">
        <div className="theme-toggle">
          <div
            className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
            onClick={() => setTheme('dark')}
          >
            <Moon size={14} /> {t('theme.dark', 'Dark')}
          </div>
          <div
            className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
            onClick={() => setTheme('light')}
          >
            <Sun size={14} /> {t('theme.light', 'Light')}
          </div>
        </div>
      </div>
    </aside>
  );
};
