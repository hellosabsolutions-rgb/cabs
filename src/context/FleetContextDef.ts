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
  MaintenanceRecord,
  ToastNotification,
  ToastType
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

  // Loading & Global Status Management
  isLoading: boolean;
  loadingKey: string | null;
  refreshData: () => Promise<void>;
  withLoading: <T>(fn: () => Promise<T> | T, key?: string) => Promise<T>;

  // Global Toast Notifications
  toasts: ToastNotification[];
  showToast: (type: ToastType, message: string, title?: string, duration?: number) => void;
  dismissToast: (id: string) => void;

  // Driver subtabs & actions
  driverSubTab: DriverSubTab;
  setDriverSubTab: (tab: DriverSubTab) => void;
  drivers: Driver[];
  addDriver: (driver: Omit<Driver, 'id'>) => Promise<{ success: boolean; driver?: Driver; error?: string } | void> | void;
  updateDriverStatus: (id: string, status: 'On duty' | 'Off duty') => Promise<void>;
  updateDriver: (id: string, data: Partial<Driver>) => Promise<{ success: boolean; driver?: Driver; error?: string }>;
  deleteDriver: (id: string) => Promise<{ success: boolean; error?: string }>;
  attendanceRecords: DriverAttendance[];
  markAttendance: (record: Omit<DriverAttendance, 'id'>) => Promise<{ success: boolean; data?: DriverAttendance; error?: string } | void> | void;
  updateAttendanceStatus: (id: string, status: AttendanceStatus) => Promise<{ success: boolean; data?: DriverAttendance; error?: string } | void> | void;
  updateAttendance: (id: string, data: Partial<DriverAttendance>) => Promise<{ success: boolean; data?: DriverAttendance; error?: string }>;
  bulkMarkAttendance: (date: string, records: Omit<DriverAttendance, 'id'>[]) => Promise<{ success: boolean; error?: string }>;
  fetchLiveAttendance: (queryParam?: string | { date?: string; month?: string; year?: string }) => Promise<void>;
  driverExpenses: DriverExpenseItem[];
  fetchLiveDriverExpenses: (queryParam?: string | { date?: string; month?: string; year?: string; driver?: string; driverName?: string; driverId?: string }) => Promise<void>;
  addDriverExpense: (expense: Omit<DriverExpenseItem, 'id'>) => Promise<{ success: boolean; data?: DriverExpenseItem; error?: string }>;
  updateDriverExpense: (id: string, data: Partial<DriverExpenseItem>) => Promise<{ success: boolean; data?: DriverExpenseItem; error?: string }>;
  updateDriverExpenseStatus: (id: string, status: 'Approved' | 'Pending' | 'Paid') => Promise<{ success: boolean; data?: DriverExpenseItem; error?: string }>;
  deleteDriverExpense: (id: string) => Promise<{ success: boolean; error?: string }>;

  // Department subtabs & actions
  departmentSubTab: DepartmentSubTab;
  setDepartmentSubTab: (tab: DepartmentSubTab) => void;
  departmentContracts: DepartmentContract[];
  addDepartmentContract: (contract: Omit<DepartmentContract, 'id'>) => Promise<{ success: boolean; contract?: DepartmentContract; error?: string }>;
  updateContractStatus: (id: string, status: DepartmentContract['status']) => Promise<void>;
  updateDepartmentContract: (id: string, data: Partial<DepartmentContract>) => Promise<{ success: boolean; contract?: DepartmentContract; error?: string }>;
  deleteDepartmentContract: (id: string) => Promise<{ success: boolean; error?: string }>;
  dailyDutyLogs: DailyDutyLog[];
  fetchLiveDailyDutyLogs: (queryParam?: { month?: string; date?: string; vehicle?: string; department?: string; status?: string; search?: string }) => Promise<void>;
  addDailyDutyLog: (log: Omit<DailyDutyLog, 'id'>) => Promise<{ success: boolean; log?: DailyDutyLog; error?: string }>;
  updateDailyDutyLogStatus: (id: string, status: DailyDutyLog['status']) => Promise<void>;
  deleteDailyDutyLog: (id: string) => Promise<{ success: boolean; error?: string }>;
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
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => Promise<{ success: boolean; vehicle?: Vehicle; error?: string } | void> | void;
  updateVehicleStatus: (id: string, status: VehicleStatus) => void;
  switchVehicleMode: (id: string, mode: VehicleType) => void;

  contracts: ContractDepartment[];
  trips: TripFinancial[];
  bookings: TripFinancial[];
  fetchLiveBookings: () => Promise<void>;
  addTrip: (trip: Omit<TripFinancial, 'id'>) => Promise<{ success: boolean; data?: TripFinancial; error?: string } | void> | void;
  addBooking: (booking: Partial<TripFinancial>) => Promise<{ success: boolean; data?: TripFinancial; error?: string }>;
  completeTrip: (
    id: string,
    data: {
      endOdometer: number;
      fuelCost: number;
      fastagCost: number;
      driverBata: number;
      otherExpenses?: number;
      notes?: string;
      balanceReceived?: boolean;
      balancePaid?: number;
      balancePaymentMode?: string;
      paymentNotes?: string;
    }
  ) => Promise<{ success: boolean; data?: TripFinancial; error?: string } | void> | void;
  completeBooking: (
    id: string,
    data: {
      endOdometer: number;
      fuelCost: number;
      fastagCost: number;
      driverBata: number;
      otherExpenses?: number;
      notes?: string;
      balanceReceived?: boolean;
      balancePaid?: number;
      balancePaymentMode?: string;
      paymentNotes?: string;
    }
  ) => Promise<{ success: boolean; data?: TripFinancial; error?: string }>;
  recordBookingPayment: (
    id: string,
    payment: {
      amount: number;
      paymentMode?: string;
      paymentDate?: string;
      notes?: string;
    }
  ) => Promise<{ success: boolean; data?: TripFinancial; error?: string }>;
  checkVehicleAvailability: (date: string) => Promise<import('../types/fleet').VehicleAvailabilityResult | null>;
  expenses: ExpenseRecord[];
  addExpense: (expense: Omit<ExpenseRecord, 'id'>) => void;
  maintenanceRecords: MaintenanceRecord[];
  addMaintenanceRecord: (record: Omit<MaintenanceRecord, 'id' | 'status'>) => void;

  vehicleCompliance: DocumentCompliance[];
  addVehicleComplianceDoc: (doc: Omit<DocumentCompliance, 'id'>) => void;
  driverCompliance: DocumentCompliance[];
  addDriverComplianceDoc: (doc: Omit<DocumentCompliance, 'id'>) => void;

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
