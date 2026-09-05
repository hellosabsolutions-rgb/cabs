import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useFleet } from '../../context/FleetContext';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { DashboardView } from '../modules/dashboard/DashboardView';
import { VehiclesView } from '../modules/vehicles/VehiclesView';
import { DriversView } from '../modules/drivers/DriversView';
import { DepartmentsView } from '../modules/departments/DepartmentsView';
import { BookingsView } from '../modules/bookings/BookingsView';
import { TripsView } from '../modules/trips/TripsView';
import { ExpensesView } from '../modules/expenses/ExpensesView';
import { ProfitabilityView } from '../modules/profitability/ProfitabilityView';
import { ComplianceView } from '../modules/compliance/ComplianceView';
import { MaintenanceView } from '../modules/maintenance/MaintenanceView';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { ToastContainer } from '../common/ToastContainer';
import { useAuth } from '../../context/AuthContext';
import { useAgency } from '../../context/AgencyContext';
import { LoginView } from '../modules/auth/LoginView';
import { AgencyOnboardingView } from '../modules/agency/AgencyOnboardingView';
import { Loader2 } from 'lucide-react';

export const MainLayout: React.FC = () => {
  const { activePage } = useFleet();
  const location = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { currentAgency, agencies, isLoading: agencyLoading } = useAgency();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // If verifying authentication session or agency on boot
  if (authLoading || (isAuthenticated && agencyLoading)) {
    return (
      <div
        style={{
          minHeight: '100vh',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg)',
          gap: '12px'
        }}
      >
        <Loader2 size={32} className="spin-loader" color="var(--accent)" />
        <div style={{ fontSize: '13px', color: 'var(--text-faint)', fontWeight: 500 }}>
          Initializing KABPRO Session...
        </div>
      </div>
    );
  }

  // If not logged in, show Login & Account Creation Screen
  if (!isAuthenticated) {
    return (
      <>
        <LoginView />
        <ToastContainer />
      </>
    );
  }

  // If logged in but has no agency registered yet, show Agency Onboarding Screen
  if (!currentAgency && agencies.length === 0) {
    return (
      <>
        <AgencyOnboardingView />
        <ToastContainer />
      </>
    );
  }

  return (
    <div className="app-container">
      {/* Mobile sidebar backdrop */}
      <div
        className={`sidebar-backdrop ${mobileSidebarOpen ? 'visible' : ''}`}
        onClick={() => setMobileSidebarOpen(false)}
      />
      <Sidebar
        isOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />
      <div className="main">
        <Topbar onToggleMobileSidebar={() => setMobileSidebarOpen(prev => !prev)} />
        <main className="content">
          <ErrorBoundary key={location.pathname}>
            <Routes>
              {/* Dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardView />} />

              {/* Vehicles */}
              <Route path="/vehicles" element={<VehiclesView />} />

              {/* Drivers & Subtabs */}
              <Route path="/drivers" element={<Navigate to="/drivers/list" replace />} />
              <Route path="/drivers/list" element={<DriversView />} />
              <Route path="/drivers/attendance" element={<DriversView />} />
              <Route path="/drivers/expenses" element={<DriversView />} />

              {/* Departments & Subtabs */}
              <Route path="/departments" element={<Navigate to="/departments/contracts" replace />} />
              <Route path="/departments/contracts" element={<DepartmentsView />} />
              <Route path="/departments/duty-logs" element={<DepartmentsView />} />
              <Route path="/departments/billing" element={<DepartmentsView />} />
              <Route path="/departments/payments" element={<DepartmentsView />} />

              {/* Booking */}
              <Route path="/booking" element={<BookingsView />} />
              <Route path="/bookings" element={<BookingsView />} />
              <Route path="/trips" element={<Navigate to="/booking" replace />} />

              {/* Money & Expenses */}
              <Route path="/expenses" element={<Navigate to="/expenses/fastag" replace />} />
              <Route path="/expenses/fastag" element={<ExpensesView />} />
              <Route path="/expenses/fuel" element={<ExpensesView />} />
              <Route path="/expenses/all" element={<ExpensesView />} />

              {/* Profitability */}
              <Route path="/profitability" element={<ProfitabilityView />} />

              {/* Compliance & Maintenance */}
              <Route path="/compliance" element={<ComplianceView />} />
              <Route path="/maintenance" element={<MaintenanceView />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>
      <ToastContainer />
    </div>
  );
};
