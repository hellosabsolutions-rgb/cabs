import React, { createContext, useContext, useState, useMemo } from 'react';
import {
  PageId,
  Vehicle,
  Driver,
  ContractDepartment,
  TripFinancial,
  ExpenseRecord,
  DocumentCompliance,
  MaintenanceRecord
} from '../types/fleet';
import {
  initialVehicles,
  initialDrivers,
  initialContracts,
  initialTrips,
  initialExpenses,
  vehicleComplianceDocs,
  driverComplianceDocs,
  initialMaintenanceRecords
} from '../data/mockFleetData';

interface PageHeaderInfo {
  title: string;
  subtitle: string;
}

const pageHeaders: Record<PageId, PageHeaderInfo> = {
  dashboard: { title: 'Dashboard', subtitle: 'Overview across department and trip operations' },
  vehicles: { title: 'Vehicles', subtitle: 'Department and trip-based fleet' },
  drivers: { title: 'Drivers', subtitle: 'Driver roster, attendance and expenses' },
  departments: { title: 'Departments & contracts', subtitle: 'Contract vehicles, duty logs and billing' },
  trips: { title: 'Trips', subtitle: 'One way and round trip financials' },
  expenses: { title: 'Expenses', subtitle: 'Fuel, toll, driver and maintenance costs' },
  profitability: { title: 'Profitability', subtitle: 'Department, trip and overall P&L' },
  compliance: { title: 'Compliance', subtitle: 'Vehicle and driver document tracking' },
  maintenance: { title: 'Maintenance', subtitle: 'Service, repair and tyre change records' }
};

export interface AlertItem {
  type: 'soon' | 'late';
  who: string;
  doc: string;
  text: string;
}

interface FleetContextType {
  activePage: PageId;
  setActivePage: (page: PageId) => void;
  pageHeader: PageHeaderInfo;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  vehicles: Vehicle[];
  drivers: Driver[];
  contracts: ContractDepartment[];
  trips: TripFinancial[];
  expenses: ExpenseRecord[];
  maintenanceRecords: MaintenanceRecord[];
  addMaintenanceRecord: (record: Omit<MaintenanceRecord, 'id' | 'status'>) => void;
  
  vehicleCompliance: DocumentCompliance[];
  driverCompliance: DocumentCompliance[];
  
  // Compliance computed metrics
  complianceStats: {
    expiringSoonCount: number;
    expiredCount: number;
    driverDueCount: number;
    totalDocsCount: number;
    alerts: AlertItem[];
  };
}

const FleetContext = createContext<FleetContextType | undefined>(undefined);

export const FleetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [vehicles] = useState<Vehicle[]>(initialVehicles);
  const [drivers] = useState<Driver[]>(initialDrivers);
  const [contracts] = useState<ContractDepartment[]>(initialContracts);
  const [trips] = useState<TripFinancial[]>(initialTrips);
  const [expenses] = useState<ExpenseRecord[]>(initialExpenses);
  const [vehicleCompliance] = useState<DocumentCompliance[]>(vehicleComplianceDocs);
  const [driverCompliance] = useState<DocumentCompliance[]>(driverComplianceDocs);
  
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>(initialMaintenanceRecords);

  const addMaintenanceRecord = (recordData: Omit<MaintenanceRecord, 'id' | 'status'>) => {
    const newRecord: MaintenanceRecord = {
      ...recordData,
      id: 'm_' + Date.now(),
      status: 'Completed'
    };
    setMaintenanceRecords(prev => [newRecord, ...prev]);
  };

  const complianceStats = useMemo(() => {
    const allDocs = [...vehicleCompliance, ...driverCompliance];
    let expiringSoonCount = 0;
    let expiredCount = 0;
    let driverDueCount = 0;
    const alerts: AlertItem[] = [];

    allDocs.forEach(doc => {
      if (doc.statusType === 'soon') {
        expiringSoonCount++;
        alerts.push({
          type: 'soon',
          who: doc.entityName,
          doc: doc.documentName,
          text: doc.expiryLabel
        });
      } else if (doc.statusType === 'late') {
        expiredCount++;
        alerts.push({
          type: 'late',
          who: doc.entityName,
          doc: doc.documentName,
          text: doc.expiryLabel
        });
      }
    });

    driverCompliance.forEach(doc => {
      if (doc.statusType === 'soon' || doc.statusType === 'late') {
        driverDueCount++;
      }
    });

    // Sort alerts: expired ('late') first
    alerts.sort((a, b) => (a.type === 'late' ? -1 : 1));

    return {
      expiringSoonCount,
      expiredCount,
      driverDueCount,
      totalDocsCount: allDocs.length,
      alerts
    };
  }, [vehicleCompliance, driverCompliance]);

  const pageHeader = pageHeaders[activePage];

  return (
    <FleetContext.Provider
      value={{
        activePage,
        setActivePage,
        pageHeader,
        searchQuery,
        setSearchQuery,
        vehicles,
        drivers,
        contracts,
        trips,
        expenses,
        maintenanceRecords,
        addMaintenanceRecord,
        vehicleCompliance,
        driverCompliance,
        complianceStats
      }}
    >
      {children}
    </FleetContext.Provider>
  );
};

export const useFleet = () => {
  const context = useContext(FleetContext);
  if (!context) {
    throw new Error('useFleet must be used within a FleetProvider');
  }
  return context;
};
