export type PageId = 
  | 'dashboard'
  | 'vehicles'
  | 'drivers'
  | 'departments'
  | 'trips'
  | 'expenses'
  | 'profitability'
  | 'compliance'
  | 'maintenance';

export type VehicleStatus = 'Running' | 'Active' | 'Idle' | 'Maintenance';
export type VehicleType = 'Department' | 'Trip-based';

export interface Vehicle {
  id: string;
  registrationNumber: string;
  type: VehicleType;
  assignedTo: string;
  status: VehicleStatus;
  meta?: string;
  location?: string;
  revenue: number;
  expense: number;
  profit: number;
}

export interface Driver {
  id: string;
  name: string;
  assignedVehicle: string;
  joiningDate: string;
  status: 'On duty' | 'Off duty';
}

export interface ContractDepartment {
  id: string;
  departmentName: string;
  vehicle: string;
  contractAmount: number;
  extraKmHoursCost: number;
  totalBill: number;
  status: 'Sent' | 'Paid' | 'Pending';
}

export interface TripFinancial {
  id: string;
  route: string;
  vehicle: string;
  revenue: number;
  expenses: number;
  profit: number;
  margin: string;
}

export interface ExpenseRecord {
  id: string;
  date: string;
  vehicle: string;
  category: 'Fuel' | 'FASTag / Toll' | 'Driver' | 'Maintenance' | 'General';
  linkedTo: string;
  amount: number;
}

export interface DocumentCompliance {
  id: string;
  entityName: string; // Vehicle registration or Driver name
  entityType: 'Vehicle' | 'Driver';
  documentName: string;
  expiryLabel: string;
  statusType: 'ok' | 'soon' | 'late';
  daysLeft?: number;
}

export type MaintenanceType = 'Service' | 'Repair' | 'Tyre Change';

export interface MaintenanceRecord {
  id: string;
  date: string;
  dateLabel: string;
  vehicle: string;
  type: MaintenanceType;
  tyreCount?: number;
  cost: number;
  bill?: string | null;
  status: 'Completed' | 'In Progress' | 'Scheduled';
  notes?: string;
}

export interface RevenueVsExpenseData {
  month: string;
  revenueHeight: number; // percentage
}
