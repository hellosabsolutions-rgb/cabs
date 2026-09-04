import React from 'react';
import { useFleet } from '../../context/FleetContext';
import { useTheme } from '../../context/ThemeContext';
import { PageId } from '../../types/fleet';
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
  const {
    activePage,
    setActivePage,
    complianceStats,
    vehicleSubTab,
    setVehicleSubTab,
    driverSubTab,
    setDriverSubTab,
    departmentSubTab,
    setDepartmentSubTab,
    expenseSubTab,
    setExpenseSubTab
  } = useFleet();
  const { theme, setTheme } = useTheme();

  const totalAlerts = complianceStats.expiringSoonCount + complianceStats.expiredCount;

  const handleNavClick = (page: PageId) => {
    setActivePage(page);
    if (onCloseMobile) onCloseMobile();
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
            Vehicles
          </div>
        </div>

        <div className="nav-group">
          <div className="nav-label">Drivers</div>
          <div
            className={`nav-item ${activePage === 'drivers' && driverSubTab === 'list' ? 'active' : ''}`}
            onClick={() => {
              setDriverSubTab('list');
              handleNavClick('drivers');
            }}
          >
            <Users />
            Driver list
          </div>
          <div
            className={`nav-item ${activePage === 'drivers' && driverSubTab === 'attendance' ? 'active' : ''}`}
            onClick={() => {
              setDriverSubTab('attendance');
              handleNavClick('drivers');
            }}
          >
            <CalendarCheck />
            Attendance
          </div>
          <div
            className={`nav-item ${activePage === 'drivers' && driverSubTab === 'expenses' ? 'active' : ''}`}
            onClick={() => {
              setDriverSubTab('expenses');
              handleNavClick('drivers');
            }}
          >
            <Receipt />
            Driver expenses
          </div>
        </div>

        <div className="nav-group">
          <div className="nav-label">Departments & contracts</div>
          <div
            className={`nav-item ${activePage === 'departments' && departmentSubTab === 'contracts' ? 'active' : ''}`}
            onClick={() => {
              setDepartmentSubTab('contracts');
              handleNavClick('departments');
            }}
          >
            <FileText />
            Contracts
          </div>
          <div
            className={`nav-item ${activePage === 'departments' && departmentSubTab === 'duty-logs' ? 'active' : ''}`}
            onClick={() => {
              setDepartmentSubTab('duty-logs');
              handleNavClick('departments');
            }}
          >
            <ClipboardList />
            Daily duty logs
          </div>
          <div
            className={`nav-item ${activePage === 'departments' && departmentSubTab === 'billing' ? 'active' : ''}`}
            onClick={() => {
              setDepartmentSubTab('billing');
              handleNavClick('departments');
            }}
          >
            <ReceiptText />
            Monthly billing
          </div>
          <div
            className={`nav-item ${activePage === 'departments' && departmentSubTab === 'payments' ? 'active' : ''}`}
            onClick={() => {
              setDepartmentSubTab('payments');
              handleNavClick('departments');
            }}
          >
            <CreditCard />
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
            Trips
          </div>
        </div>

        <div className="nav-group">
          <div className="nav-label">Money</div>
          <div
            className={`nav-item ${activePage === 'expenses' && expenseSubTab === 'fastag' ? 'active' : ''}`}
            onClick={() => {
              setExpenseSubTab('fastag');
              handleNavClick('expenses');
            }}
          >
            <CreditCard />
            FASTag per vehicle
          </div>
          <div
            className={`nav-item ${activePage === 'expenses' && expenseSubTab === 'fuel' ? 'active' : ''}`}
            onClick={() => {
              setExpenseSubTab('fuel');
              handleNavClick('expenses');
            }}
          >
            <Fuel />
            Fuel tracking & logs
          </div>
          <div
            className={`nav-item ${activePage === 'expenses' && expenseSubTab === 'all' ? 'active' : ''}`}
            onClick={() => {
              setExpenseSubTab('all');
              handleNavClick('expenses');
            }}
          >
            <IndianRupee />
            All expenses
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
