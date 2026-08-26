import React, { useState } from 'react';
import { useFleet } from '../../context/FleetContext';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { DashboardView } from '../modules/dashboard/DashboardView';
import { VehiclesView } from '../modules/vehicles/VehiclesView';
import { DriversView } from '../modules/drivers/DriversView';
import { DepartmentsView } from '../modules/departments/DepartmentsView';
import { TripsView } from '../modules/trips/TripsView';
import { ExpensesView } from '../modules/expenses/ExpensesView';
import { ProfitabilityView } from '../modules/profitability/ProfitabilityView';
import { ComplianceView } from '../modules/compliance/ComplianceView';
import { MaintenanceView } from '../modules/maintenance/MaintenanceView';

export const MainLayout: React.FC = () => {
  const { activePage } = useFleet();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const renderActiveView = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardView />;
      case 'vehicles':
        return <VehiclesView />;
      case 'drivers':
        return <DriversView />;
      case 'departments':
        return <DepartmentsView />;
      case 'trips':
        return <TripsView />;
      case 'expenses':
        return <ExpensesView />;
      case 'profitability':
        return <ProfitabilityView />;
      case 'compliance':
        return <ComplianceView />;
      case 'maintenance':
        return <MaintenanceView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        isOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />
      <div className="main">
        <Topbar onToggleMobileSidebar={() => setMobileSidebarOpen(prev => !prev)} />
        <main className="content">{renderActiveView()}</main>
      </div>
    </div>
  );
};
