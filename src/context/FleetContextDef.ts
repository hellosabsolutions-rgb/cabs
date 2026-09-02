import { createContext } from 'react';
import {
  PageId,
  Vehicle,
  VehicleType,
  Driver,
  DriverAttendance,
  DriverExpenseItem,
  VehicleStatus,
  AttendanceStatus,
  VehicleSubTab,
  DepartmentContract,
  DailyDutyLog,
  MonthlyDepartmentBill,
  DepartmentPayment,
  FuelLogEntry,
  FastagTransaction,
  ContractDepartment,
  TripFinancial,
  ExpenseRecord,
  DocumentCompliance,
  MaintenanceRecord
} from '../types/fleet';

export type DriverSubTab = 'list' | 'attendance' | 'expenses';
export type DepartmentSubTab = 'contracts' | 'duty-logs' | 'billing' | 'payments';

export interface AlertItem {
  type: 'soon' | 'late';
  who: string;
  doc: string;
  text: string;
}

export interface FleetContextType {
  activePage: PageId;
  setActivePage: (page: PageId) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  pageHeader: { title: string; subtitle: string };

  // Driver subtabs & actions
  driverSubTab: DriverSubTab;
  setDriverSubTab: (tab: DriverSubTab) => void;
  drivers: Driver[];
  addDriver: (driver: Omit<Driver, 'id'>) => void;
  attendanceRecords: DriverAttendance[];
  markAttendance: (record: Omit<DriverAttendance, 'id'>) => void;
  updateAttendanceStatus: (id: string, status: AttendanceStatus) => void;
  driverExpenses: DriverExpenseItem[];
  addDriverExpense: (expense: Omit<DriverExpenseItem, 'id'>) => void;
  updateDriverExpenseStatus: (id: string, status: 'Approved' | 'Pending' | 'Paid') => void;

  // Department subtabs & actions
  departmentSubTab: DepartmentSubTab;
  setDepartmentSubTab: (tab: DepartmentSubTab) => void;
  departmentContracts: DepartmentContract[];
  addDepartmentContract: (contract: Omit<DepartmentContract, 'id'>) => void;
  updateContractStatus: (id: string, status: DepartmentContract['status']) => void;
  dailyDutyLogs: DailyDutyLog[];
  addDailyDutyLog: (log: Omit<DailyDutyLog, 'id'>) => void;
  updateDailyDutyLogStatus: (id: string, status: DailyDutyLog['status']) => void;
  monthlyBills: MonthlyDepartmentBill[];
  addMonthlyBill: (bill: Omit<MonthlyDepartmentBill, 'id'>) => void;
  updateBillStatus: (id: string, status: MonthlyDepartmentBill['status']) => void;
  departmentPayments: DepartmentPayment[];
  addDepartmentPayment: (payment: Omit<DepartmentPayment, 'id'>) => void;

  // Fuel, FASTag & Expenses
  expenseSubTab: 'fuel' | 'fastag' | 'all';
  setExpenseSubTab: (tab: 'fuel' | 'fastag' | 'all') => void;
  fuelLogs: FuelLogEntry[];
  addFuelLog: (entry: Omit<FuelLogEntry, 'id'>) => void;
  fastagTransactions: FastagTransaction[];
  addFastagTransaction: (tx: Omit<FastagTransaction, 'id'>) => void;
  rechargeFastag: (vehicleReg: string, amount: number, paymentMode: string, proof?: string | null) => void;
  updateFastagDetails: (vehicleReg: string, balance: number, bank?: string, tagId?: string) => void;

  // Vehicles Subtabs & Actions
  vehicleSubTab: VehicleSubTab;
  setVehicleSubTab: (tab: VehicleSubTab) => void;
  vehicles: Vehicle[];
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => void;
  updateVehicleStatus: (id: string, status: VehicleStatus) => void;
  switchVehicleMode: (id: string, mode: VehicleType) => void;

  contracts: ContractDepartment[];
  trips: TripFinancial[];
  addTrip: (trip: Omit<TripFinancial, 'id'>) => void;
  completeTrip: (
    id: string,
    data: {
      endOdometer: number;
      fuelCost: number;
      fastagCost: number;
      driverBata: number;
      otherExpenses?: number;
      notes?: string;
    }
  ) => void;
  expenses: ExpenseRecord[];
  addExpense: (expense: Omit<ExpenseRecord, 'id'>) => void;
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

export const FleetContext = createContext<FleetContextType | undefined>(undefined);
