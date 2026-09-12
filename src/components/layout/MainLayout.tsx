import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useFleet } from '../../context/FleetContext';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { DashboardView } from '../modules/dashboard/DashboardView';
import { VehiclesView } from '../modules/vehicles/VehiclesView';
import { VehicleDetailView } from '../modules/vehicles/VehicleDetailView';
import { DriversView } from '../modules/drivers/DriversView';
import { DepartmentsView } from '../modules/departments/DepartmentsView';
import { BookingsView } from '../modules/bookings/BookingsView';
import { TripsView } from '../modules/trips/TripsView';
import { ExpensesView } from '../modules/expenses/ExpensesView';
import { ProfitabilityView } from '../modules/profitability/ProfitabilityView';
import { ComplianceView } from '../modules/compliance/ComplianceView';
import { MaintenanceView } from '../modules/maintenance/MaintenanceView';
import { NotificationsView } from '../modules/notifications/NotificationsView';
import { ProfileView } from '../modules/profile/ProfileView';
import { ReportIssueView } from '../modules/reports/ReportIssueView';
import { ActivityView } from '../modules/activity/ActivityView';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { ToastContainer } from '../common/ToastContainer';
import { useAuth } from '../../context/AuthContext';
import { useAgency } from '../../context/AgencyContext';
import { LoginView } from '../modules/auth/LoginView';
import { AgencyOnboardingView } from '../modules/agency/AgencyOnboardingView';
import { CabLoadingScreen } from '../common/CabLoadingScreen';

export const MainLayout: React.FC = () => {
  const { activePage } = useFleet();
  const location = useLocation();
  const { isAuthenticated, isLoading: authLoading, isDashboardOpening } = useAuth();
  const { currentAgency, agencies, isLoading: agencyLoading } = useAgency();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // If verifying authentication session, agency loading on boot, or user just logged in opening the dashboard
  if (authLoading || (isAuthenticated && agencyLoading) || isDashboardOpening) {
    return (
      <>
        <CabLoadingScreen subtitle="Loading your dashboard…" />
        <ToastContainer />
      </>
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
      <ErrorBoundary fallbackTitle="Navigation Menu Error">
        <Sidebar
          isOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />
      </ErrorBoundary>
      <div className="main">
        <ErrorBoundary fallbackTitle="Header Bar Error">
          <Topbar onToggleMobileSidebar={() => setMobileSidebarOpen(prev => !prev)} />
        </ErrorBoundary>
        <main className="content">
          <ErrorBoundary key={location.pathname} resetKey={location.pathname} fallbackTitle="Error Loading View">
            <Routes>
              {/* Dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardView />} />

              {/* Vehicles */}
              <Route path="/vehicles" element={<VehiclesView />} />
              <Route path="/vehicles/:id" element={<VehicleDetailView />} />

              {/* Drivers & Subtabs */}
              <Route path="/drivers" element={<Navigate to="/drivers/list" replace />} />
              <Route path="/drivers/list" element={<DriversView />} />
              <Route path="/drivers/attendance" element={<DriversView />} />
              <Route path="/drivers/expenses" element={<DriversView />} />
              <Route path="/drivers/payroll" element={<DriversView />} />

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

              {/* Notifications, Profile, Activity & Reports */}
              <Route path="/activity" element={<ActivityView />} />
              <Route path="/notifications" element={<NotificationsView />} />
              <Route path="/profile" element={<ProfileView />} />
              <Route path="/report" element={<ReportIssueView />} />
              <Route path="/reports" element={<ReportIssueView />} />

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
