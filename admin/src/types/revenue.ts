export type RevenueType = 'Trip' | 'Department' | 'Other';
export type RevenuePaymentStatus = 'Received' | 'Partial' | 'Pending' | 'Overdue';
export type RevenuePaymentMethod = 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque' | 'Pending' | 'Other';

export interface RevenueItem {
  id: string;
  revenueId: string;
  type: RevenueType;
  sourceType: 'Booking' | 'DepartmentBill' | 'Manual';
  sourceId?: string;
  bookingNumber?: string;
  billNumber?: string;
  route?: string;
  vehicle: string;
  driver?: string;
  customer: string;
  departmentName?: string;
  billingMonth?: string;
  date: string;
  dueDate?: string;
  amount: number;
  receivedAmount: number;
  pendingAmount: number;
  paymentStatus: RevenuePaymentStatus;
  paymentMethod?: string;
  referenceNo?: string;
  fuelCost: number;
  driverCost: number;
  fastagCost: number;
  totalDirectCost: number;
  profit: number;
  margin: number;
  tripStatus?: string;
  billType?: string;
  notes?: string;
}

export interface RevenueSummary {
  totalRevenue: number;
  tripRevenue: number;
  deptRevenue: number;
  otherRevenue: number;
  totalDirectCost: number;
  fuelCost: number;
  driverCost: number;
  fastagCost: number;
  totalContribution: number;
  tripProfit: number;
  deptProfit: number;
  margin: number;
  tripMargin: number;
  deptMargin: number;
  collection: {
    totalReceived: number;
    totalPending: number;
    totalOverdue: number;
  };
  counts: {
    total: number;
    trips: number;
    departments: number;
    manual: number;
    outstanding: number;
  };
}

export interface RevenueTimeSeriesPoint {
  date: string;
  totalRevenue: number;
  tripRevenue: number;
  deptRevenue: number;
  receivedAmount: number;
}

export interface VehicleEconomicsItem {
  vehicle: string;
  revenue: number;
  fuelCost: number;
  driverCost: number;
  fastagCost: number;
  directCost: number;
  profit: number;
  margin: number;
  tripCount: number;
  deptCount: number;
  totalOperations: number;
}

export interface RevenueOverviewData {
  summary: RevenueSummary;
  trends: RevenueTimeSeriesPoint[];
  vehicleEconomics: VehicleEconomicsItem[];
  trips: RevenueItem[];
  departments: RevenueItem[];
  outstanding: RevenueItem[];
  records: RevenueItem[];
}
