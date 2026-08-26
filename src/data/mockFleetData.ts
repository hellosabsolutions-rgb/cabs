import {
  Vehicle,
  Driver,
  ContractDepartment,
  TripFinancial,
  ExpenseRecord,
  DocumentCompliance,
  MaintenanceRecord,
  RevenueVsExpenseData
} from '../types/fleet';

export const initialVehicles: Vehicle[] = [
  {
    id: 'v1',
    registrationNumber: 'DL01AB1234',
    type: 'Department',
    assignedTo: 'PWD',
    status: 'Running',
    meta: 'PWD Department duty',
    revenue: 85000,
    expense: 48000,
    profit: 37000
  },
  {
    id: 'v2',
    registrationNumber: 'DL02CD5678',
    type: 'Trip-based',
    assignedTo: '—',
    status: 'Running',
    meta: 'Trip · Delhi → Chandigarh',
    revenue: 120000,
    expense: 72000,
    profit: 48000
  },
  {
    id: 'v3',
    registrationNumber: 'DL03EF9012',
    type: 'Trip-based',
    assignedTo: '—',
    status: 'Idle',
    meta: 'Parked · Ludhiana yard',
    revenue: 95000,
    expense: 61000,
    profit: 34000
  },
  {
    id: 'v4',
    registrationNumber: 'DL07GH2211',
    type: 'Trip-based',
    assignedTo: '—',
    status: 'Maintenance',
    meta: 'Service · brake inspection',
    revenue: 65000,
    expense: 42000,
    profit: 23000
  },
  {
    id: 'v5',
    registrationNumber: 'DL05KL4432',
    type: 'Department',
    assignedTo: 'Jal Nigam',
    status: 'Active',
    meta: 'Jal Nigam Contract',
    revenue: 78000,
    expense: 45000,
    profit: 33000
  }
];

export const initialDrivers: Driver[] = [
  { id: 'd1', name: 'Rahul Sharma', assignedVehicle: 'DL01AB1234', joiningDate: '12 Jan 2023', status: 'On duty' },
  { id: 'd2', name: 'Vikas Kumar', assignedVehicle: 'DL02CD5678', joiningDate: '04 Jun 2022', status: 'On duty' },
  { id: 'd3', name: 'Suresh Yadav', assignedVehicle: 'DL03EF9012', joiningDate: '19 Sep 2024', status: 'Off duty' }
];

export const initialContracts: ContractDepartment[] = [
  { id: 'c1', departmentName: 'PWD', vehicle: 'DL01AB1234', contractAmount: 85000, extraKmHoursCost: 9000, totalBill: 95500, status: 'Sent' },
  { id: 'c2', departmentName: 'Jal Nigam', vehicle: 'DL05KL4432', contractAmount: 78000, extraKmHoursCost: 5200, totalBill: 83200, status: 'Paid' }
];

export const initialTrips: TripFinancial[] = [
  { id: 't1', route: 'Delhi → Chandigarh → Delhi', vehicle: 'DL02CD5678', revenue: 18000, expenses: 10300, profit: 7700, margin: '42.8%' },
  { id: 't2', route: 'Ludhiana → Manali', vehicle: 'DL03EF9012', revenue: 22500, expenses: 15100, profit: 7400, margin: '32.9%' }
];

export const initialExpenses: ExpenseRecord[] = [
  { id: 'e1', date: '26 Aug', vehicle: 'DL02CD5678', category: 'Fuel', linkedTo: 'Trip · Delhi-Chandigarh', amount: 4500 },
  { id: 'e2', date: '26 Aug', vehicle: 'DL01AB1234', category: 'Driver', linkedTo: 'Department duty', amount: 1200 },
  { id: 'e3', date: '25 Aug', vehicle: 'DL07GH2211', category: 'Maintenance', linkedTo: 'General', amount: 8900 }
];

export const vehicleComplianceDocs: DocumentCompliance[] = [
  { id: 'vc1', entityName: 'DL01AB1234', entityType: 'Vehicle', documentName: 'RC', expiryLabel: 'Valid · 3 years', statusType: 'ok' },
  { id: 'vc2', entityName: 'DL01AB1234', entityType: 'Vehicle', documentName: 'Insurance', expiryLabel: 'In 12 days', statusType: 'soon', daysLeft: 12 },
  { id: 'vc3', entityName: 'DL01AB1234', entityType: 'Vehicle', documentName: 'Road tax', expiryLabel: 'Valid · 1 year', statusType: 'ok' },
  { id: 'vc4', entityName: 'DL02CD5678', entityType: 'Vehicle', documentName: 'PUC', expiryLabel: 'Expired 3 days ago', statusType: 'late', daysLeft: -3 },
  { id: 'vc5', entityName: 'DL02CD5678', entityType: 'Vehicle', documentName: 'Permit', expiryLabel: 'Valid · 5 months', statusType: 'ok' },
  { id: 'vc6', entityName: 'DL03EF9012', entityType: 'Vehicle', documentName: 'Fitness', expiryLabel: 'In 15 days', statusType: 'soon', daysLeft: 15 },
  { id: 'vc7', entityName: 'DL03EF9012', entityType: 'Vehicle', documentName: 'State permit', expiryLabel: 'Valid · 6 months', statusType: 'ok' },
  { id: 'vc8', entityName: 'DL07GH2211', entityType: 'Vehicle', documentName: 'Permit', expiryLabel: 'Valid · 4 months', statusType: 'ok' },
  { id: 'vc9', entityName: 'DL05KL4432', entityType: 'Vehicle', documentName: 'National permit', expiryLabel: 'Valid · 7 months', statusType: 'ok' }
];

export const driverComplianceDocs: DocumentCompliance[] = [
  { id: 'dc1', entityName: 'Rahul Sharma', entityType: 'Driver', documentName: 'Driving licence', expiryLabel: 'In 9 days', statusType: 'soon', daysLeft: 9 },
  { id: 'dc2', entityName: 'Rahul Sharma', entityType: 'Driver', documentName: 'ID proof', expiryLabel: 'Valid', statusType: 'ok' },
  { id: 'dc3', entityName: 'Rahul Sharma', entityType: 'Driver', documentName: 'Joining date', expiryLabel: '12 Jan 2023', statusType: 'ok' },
  { id: 'dc4', entityName: 'Vikas Kumar', entityType: 'Driver', documentName: 'Police verification', expiryLabel: 'Valid · 6 months', statusType: 'ok' },
  { id: 'dc5', entityName: 'Vikas Kumar', entityType: 'Driver', documentName: 'Joining date', expiryLabel: '04 Jun 2022', statusType: 'ok' },
  { id: 'dc6', entityName: 'Suresh Yadav', entityType: 'Driver', documentName: 'Medical record', expiryLabel: 'Valid · 8 months', statusType: 'ok' },
  { id: 'dc7', entityName: 'Suresh Yadav', entityType: 'Driver', documentName: 'Joining date', expiryLabel: '19 Sep 2024', statusType: 'ok' }
];

export const initialMaintenanceRecords: MaintenanceRecord[] = [
  { id: 'm1', date: '2026-08-26', dateLabel: '26 Aug', vehicle: 'DL01AB1234', type: 'Service', cost: 4500, bill: 'service_26aug.pdf', status: 'Completed' },
  { id: 'm2', date: '2026-08-20', dateLabel: '20 Aug', vehicle: 'DL01AB1234', type: 'Tyre Change', tyreCount: 4, cost: 24000, bill: 'tyre_20aug.pdf', status: 'Completed' },
  { id: 'm3', date: '2026-08-12', dateLabel: '12 Aug', vehicle: 'DL01AB1234', type: 'Repair', cost: 6800, bill: 'repair_12aug.pdf', status: 'Completed' }
];

export const chartData: RevenueVsExpenseData[] = [
  { month: 'Mar', revenueHeight: 58 },
  { month: 'Apr', revenueHeight: 64 },
  { month: 'May', revenueHeight: 52 },
  { month: 'Jun', revenueHeight: 71 },
  { month: 'Jul', revenueHeight: 66 },
  { month: 'Aug', revenueHeight: 82 }
];
