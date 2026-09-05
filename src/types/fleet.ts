export type PageId = 
  | 'dashboard'
  | 'vehicles'
  | 'drivers'
  | 'departments'
  | 'bookings'
  | 'trips'
  | 'expenses'
  | 'profitability'
  | 'compliance'
  | 'maintenance';

export type VehicleStatus = 'Running' | 'Active' | 'Idle' | 'Maintenance';
export type VehicleType = 'Department' | 'Trip-based';
export type VehicleSubTab = 'all' | 'department' | 'trip' | 'tracking';

export interface Agency {
  id: string;
  _id?: string;
  name: string;
  businessType: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  gstin?: string;
  pan?: string;
  logo?: string | null;
  isDefault?: boolean;
}

export interface Vehicle {
  id: string;
  registrationNumber: string;
  type: VehicleType;
  assignedTo: string;
  departmentName?: string;
  isWeekendTripEnabled?: boolean;
  currentOperationMode?: VehicleType;
  status: VehicleStatus;
  meta?: string;
  location?: string;
  revenue: number;
  expense: number;
  profit: number;
  model?: string;
  fuelType?: 'Diesel' | 'Petrol' | 'CNG' | 'Electric';
  seatingCapacity?: number;
  assignedDriver?: string;
  odometer?: number;
  fastagTagId?: string;
  fastagBank?: string;
  fastagBalance?: number;
  gpsImei?: string;
  vehiclePhoto?: string | null;
  // 5 Mandatory Compliance Documents
  rcExpiry?: string;
  rcPhoto?: string | null;
  insuranceExpiry?: string;
  insurancePhoto?: string | null;
  pollutionExpiry?: string;
  pollutionPhoto?: string | null;
  permitExpiry?: string;
  permitPhoto?: string | null;
  authExpiry?: string;
  authPhoto?: string | null;
  fitnessExpiry?: string;
}

export type DriverType = 'Full Time' | 'Part Time' | 'Contract' | 'Owner Driver';

export interface Driver {
  id: string;
  name: string;
  phone?: string;
  photo?: string;
  address?: string;
  emergencyContact?: string;
  licenseNumber?: string;
  licensePhoto?: string;
  licenseExpiry?: string;
  driverType?: DriverType;
  assignedVehicle: string;
  joiningDate: string;
  status: 'On duty' | 'Off duty';
}

export type AttendanceStatus = 'Present' | 'Late' | 'Absent' | 'On Trip' | 'On Leave';

export interface DriverAttendance {
  id: string;
  driverId: string;
  driverName: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  assignedVehicle?: string;
  dutyType?: 'Department Duty' | 'Trip Duty' | 'Standby' | 'Yard Duty';
  workingHours?: number;
  notes?: string;
}

export type DriverExpenseCategory = 
  | 'Daily Bata / Food'
  | 'Night Halt Allowance'
  | 'Advance Payout'
  | 'Overtime'
  | 'Toll / Cash Reimbursement'
  | 'Uniform / Misc';

export interface DriverExpenseItem {
  id: string;
  driverId: string;
  driverName: string;
  vehicle: string;
  date: string;
  category: DriverExpenseCategory;
  amount: number;
  status: 'Approved' | 'Pending' | 'Paid';
  remarks?: string;
  receipt?: string | null;
}

export interface DepartmentContract {
  id: string;
  contractNumber: string;
  departmentName: string;
  contactPerson: string;
  phone: string;
  vehicle: string;
  driverName?: string;
  monthlyBaseAmount: number;
  includedKmPerMonth: number;
  includedHoursPerMonth: number;
  extraKmRate: number;
  extraHourRate: number;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Expired' | 'Pending Renewal';
  documentFile?: string | null;
}

export interface DailyDutyLog {
  id: string;
  dutySlipNumber: string;
  date: string;
  departmentName: string;
  vehicle: string;
  driverName: string;
  dutyType?: 'Official Department Duty' | 'Weekend / Off-Duty Trip';
  tripDestination?: string;
  tripFare?: number;
  tripNetProfit?: number;
  startKm: number;
  endKm: number;
  totalKm: number;
  extraKm: number;
  startTime: string;
  endTime: string;
  totalHours: number;
  extraHours: number;
  tollParkingAmount: number;
  fuelAmount?: number;
  fuelLitres?: number;
  officerName?: string;
  officerDesignation?: string;
  journeyFrom?: string;
  journeyTo?: string;
  purposeOfJourney?: string;
  headOfAccount?: string;
  motorOilUsed?: string;
  officerSignatureStatus?: 'Signed' | 'Pending' | 'Exempt';
  driverSignatureStatus?: 'Signed' | 'Pending';
  dutySlipPhoto?: string | null;
  fuelBillPhoto?: string | null;
  status: 'Approved' | 'Pending' | 'Rejected';
  notes?: string;
}

export interface MonthlyDepartmentBill {
  id: string;
  billNumber: string;
  departmentName: string;
  vehicle: string;
  billingMonth: string;
  baseContractAmount: number;
  totalKmRun: number;
  extraKmCost: number;
  extraHoursCost: number;
  tollParkingCost: number;
  subtotal?: number;
  gstRate?: number;
  gstAmount?: number;
  totalBill: number;
  paidAmount: number;
  balanceDue: number;
  status: 'Sent' | 'Paid' | 'Pending' | 'Overdue' | 'Draft';
  dueDate: string;
  invoicePdf?: string | null;
}

export interface DepartmentPayment {
  id: string;
  receiptNumber: string;
  invoiceNumber: string;
  departmentName: string;
  paymentDate: string;
  amountPaid: number;
  paymentMode: 'NEFT / RTGS' | 'Treasury Challan' | 'Cheque' | 'UPI' | 'Direct Transfer';
  referenceNo: string;
  status: 'Received' | 'Reconciled' | 'Processing';
  remarks?: string;
  paymentProof?: string | null;
}

export interface FuelLogEntry {
  id: string;
  vehicle: string;
  driverName: string;
  date: string;
  time: string;
  odometer: number;
  fuelType: 'Diesel' | 'Petrol' | 'CNG';
  litres: number;
  ratePerLitre: number;
  totalCost: number;
  stationName: string;
  paymentMode: 'Fleet Card' | 'Cash' | 'UPI' | 'Company Credit';
  meterPhoto?: string | null;
  receiptPhoto?: string | null;
  notes?: string;
}

export interface FastagTransaction {
  id: string;
  vehicle: string;
  tagId: string;
  type: 'Toll Deduction' | 'Recharge';
  date: string;
  time: string;
  tollPlaza?: string;
  amount: number;
  balanceAfter: number;
  lane?: string;
  transactionRef: string;
  linkedDutyOrTrip?: string;
  proofSlip?: string | null;
  status: 'Successful' | 'Pending' | 'Disputed';
}

// Backward-compatible alias
export interface ContractDepartment {
  id: string;
  departmentName: string;
  vehicle: string;
  contractAmount: number;
  extraKmHoursCost: number;
  totalBill: number;
  status: 'Sent' | 'Paid' | 'Pending';
}

export type TripType = 'One-way (Single)' | 'Round Trip';
export type TripStatus = 'Ongoing' | 'Completed' | 'Scheduled' | 'Cancelled';
export type BookingStatus = TripStatus;
export type PaymentStatus = 'Paid' | 'Partial' | 'Unpaid';
export type PaymentMode = 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque' | 'Pending';

export interface TripFinancial {
  id: string;
  _id?: string;
  tripNumber?: string;
  bookingNumber?: string;
  bookingDate?: string;
  tripType: TripType;
  vehicle: string;
  vehicleModel?: string;
  isDepartmentVehicle?: boolean;
  departmentName?: string;
  weekendDutyType?: 'Saturday Trip' | 'Sunday Trip' | 'Weekend Round Trip' | 'Regular Commercial Trip';
  driverName: string;
  pickupLocation: string;
  dropLocation: string;
  route: string;
  startDate: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  startOdometer: number;
  endOdometer?: number;
  totalKmRun?: number;
  initialFuelLitres?: number;
  fuelCost: number;
  fastagCost: number;
  driverBata: number;
  otherExpenses?: number;
  revenue: number;
  totalAmount?: number;
  advanceAmount?: number;
  advancePaymentMode?: PaymentMode;
  advanceDate?: string;
  balancePaid?: number;
  balancePaymentMode?: PaymentMode;
  balancePaymentDate?: string;
  pendingAmount?: number;
  paymentStatus?: PaymentStatus;
  paymentNotes?: string;
  expenses: number;
  profit: number;
  margin: string;
  status: TripStatus;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
}

export type Booking = TripFinancial;

export interface VehicleAvailabilityItem {
  vehicle: string;
  model: string;
  type: string;
  currentStatus?: string;
  assignedDriver?: string;
  bookingId?: string;
  bookingNumber?: string;
  customerName?: string;
  driverName?: string;
  route?: string;
  status?: string;
  fare?: number;
}

export interface VehicleAvailabilityResult {
  date: string;
  totalVehicles: number;
  availableCount: number;
  bookedCount: number;
  availableVehicles: VehicleAvailabilityItem[];
  bookedVehicles: VehicleAvailabilityItem[];
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
  documentNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  issuingAuthority?: string;
  documentPhoto?: string | null;
  notes?: string;
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

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastNotification {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface LoadingState {
  isLoading: boolean;
  loadingKey: string | null;
}

