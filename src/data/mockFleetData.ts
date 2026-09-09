import {
  Vehicle,
  Driver,
  DriverAttendance,
  DriverExpenseItem,
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
  RevenueVsExpenseData
} from '../types/fleet';

export const initialVehicles: Vehicle[] = [];
export const initialDrivers: Driver[] = [];
export const initialDriverAttendance: DriverAttendance[] = [];
export const initialDriverExpenses: DriverExpenseItem[] = [];
export const initialDepartmentContracts: DepartmentContract[] = [];
export const initialDailyDutyLogs: DailyDutyLog[] = [];
export const initialMonthlyBills: MonthlyDepartmentBill[] = [];
export const initialDepartmentPayments: DepartmentPayment[] = [];
export const initialFuelLogs: FuelLogEntry[] = [];
export const initialFastagTransactions: FastagTransaction[] = [];
export const initialContracts: ContractDepartment[] = [];
export const initialTrips: TripFinancial[] = [];
export const initialExpenses: ExpenseRecord[] = [];
export const vehicleComplianceDocs: DocumentCompliance[] = [];
export const driverComplianceDocs: DocumentCompliance[] = [];
export const initialMaintenanceRecords: MaintenanceRecord[] = [];
export const revenueVsExpenseData: RevenueVsExpenseData[] = [];
