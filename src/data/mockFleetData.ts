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

export const initialVehicles: Vehicle[] = [
  {
    id: 'v1',
    registrationNumber: 'DL01AB1234',
    model: 'Toyota Innova Crysta 2.4 VX',
    type: 'Department',
    assignedTo: 'Public Works Department (PWD)',
    assignedDriver: 'Rahul Sharma',
    status: 'Running',
    meta: 'PWD Department duty',
    fuelType: 'Diesel',
    seatingCapacity: 7,
    odometer: 45470,
    fastagTagId: '34161FA8891',
    fastagBank: 'ICICI Bank FASTag',
    fastagBalance: 2450,
    revenue: 85000,
    expense: 48000,
    profit: 37000
  },
  {
    id: 'v2',
    registrationNumber: 'DL02CD5678',
    model: 'Maruti Suzuki Ertiga ZXi',
    type: 'Trip-based',
    assignedTo: 'Delhi NCR Stand',
    assignedDriver: 'Vikas Kumar',
    status: 'Running',
    meta: 'Trip · Delhi → Chandigarh',
    fuelType: 'Diesel',
    seatingCapacity: 7,
    odometer: 61390,
    fastagTagId: '34161FA9923',
    fastagBank: 'Paytm Payments Bank',
    fastagBalance: 1820,
    revenue: 120000,
    expense: 72000,
    profit: 48000
  },
  {
    id: 'v3',
    registrationNumber: 'DL03EF9012',
    model: 'Mahindra Scorpio-N Z8',
    type: 'Trip-based',
    assignedTo: 'Outstation Fleet Stand',
    assignedDriver: 'Suresh Yadav',
    status: 'Idle',
    meta: 'Parked · Ludhiana yard',
    fuelType: 'Diesel',
    seatingCapacity: 7,
    odometer: 54300,
    fastagTagId: '34161FA7741',
    fastagBank: 'State Bank of India (SBI)',
    fastagBalance: 340, // Low balance alert!
    revenue: 95000,
    expense: 61000,
    profit: 34000
  },
  {
    id: 'v4',
    registrationNumber: 'DL07GH2211',
    model: 'Maruti Suzuki Dzire Tour S',
    type: 'Trip-based',
    assignedTo: 'Airport Hub',
    assignedDriver: 'Sunil Verma',
    status: 'Maintenance',
    meta: 'Service · brake inspection',
    fuelType: 'CNG',
    seatingCapacity: 5,
    odometer: 52180,
    fastagTagId: '34161FA4429',
    fastagBank: 'Kotak Mahindra FASTag',
    fastagBalance: 950,
    revenue: 65000,
    expense: 42000,
    profit: 23000
  },
  {
    id: 'v5',
    registrationNumber: 'DL05KL4432',
    model: 'Tata Tigor EV Executive',
    type: 'Department',
    assignedTo: 'Delhi Jal Nigam (DJN)',
    assignedDriver: 'Vikas Kumar',
    status: 'Active',
    meta: 'Jal Nigam Contract',
    fuelType: 'CNG',
    seatingCapacity: 5,
    odometer: 38210,
    fastagTagId: '34161FA6610',
    fastagBank: 'IDFC First Bank',
    fastagBalance: 3150,
    revenue: 78000,
    expense: 45000,
    profit: 33000
  }
];

export const initialDrivers: Driver[] = [
  {
    id: 'd1',
    name: 'Rahul Sharma',
    phone: '+91 98765 43210',
    address: 'Flat 402, Green Park, New Delhi',
    emergencyContact: '+91 98111 22334',
    licenseNumber: 'DL-0420180092341',
    driverType: 'Full Time',
    assignedVehicle: 'DL01AB1234',
    joiningDate: '12 Jan 2023',
    status: 'On duty'
  },
  {
    id: 'd2',
    name: 'Vikas Kumar',
    phone: '+91 97123 88990',
    address: 'H-12, Sector 15, Rohini, Delhi',
    emergencyContact: '+91 99223 34455',
    licenseNumber: 'DL-1020190045612',
    driverType: 'Contract',
    assignedVehicle: 'DL02CD5678',
    joiningDate: '04 Jun 2022',
    status: 'On duty'
  },
  {
    id: 'd3',
    name: 'Suresh Yadav',
    phone: '+91 98990 11223',
    address: 'Village Badarpur, South Delhi',
    emergencyContact: '+91 97880 55667',
    licenseNumber: 'DL-0720210087654',
    driverType: 'Part Time',
    assignedVehicle: 'DL03EF9012',
    joiningDate: '19 Sep 2024',
    status: 'Off duty'
  }
];

export const initialDepartmentContracts: DepartmentContract[] = [
  {
    id: 'cnt1',
    contractNumber: 'CNT-2026-PWD-01',
    departmentName: 'Public Works Department (PWD)',
    contactPerson: 'Er. R. K. Singhal (Exec Engineer)',
    phone: '+91 98101 22334',
    vehicle: 'DL01AB1234',
    driverName: 'Rahul Sharma',
    monthlyBaseAmount: 85000,
    includedKmPerMonth: 2500,
    includedHoursPerMonth: 300,
    extraKmRate: 14,
    extraHourRate: 120,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    status: 'Active',
    documentFile: 'pwd_annual_tender_2026.pdf'
  },
  {
    id: 'cnt2',
    contractNumber: 'CNT-2026-JAL-02',
    departmentName: 'Delhi Jal Nigam (DJN)',
    contactPerson: 'Sunil Mehra (Zonal Officer)',
    phone: '+91 98711 44556',
    vehicle: 'DL05KL4432',
    driverName: 'Vikas Kumar',
    monthlyBaseAmount: 78000,
    includedKmPerMonth: 2200,
    includedHoursPerMonth: 260,
    extraKmRate: 13,
    extraHourRate: 100,
    startDate: '2026-03-01',
    endDate: '2027-02-28',
    status: 'Active',
    documentFile: 'jal_nigam_work_order.pdf'
  },
  {
    id: 'cnt3',
    contractNumber: 'CNT-2025-HLT-04',
    departmentName: 'Directorate of Health Services',
    contactPerson: 'Dr. Anita Roy',
    phone: '+91 99100 88776',
    vehicle: 'DL07GH2211',
    driverName: 'Suresh Yadav',
    monthlyBaseAmount: 65000,
    includedKmPerMonth: 2000,
    includedHoursPerMonth: 240,
    extraKmRate: 12,
    extraHourRate: 90,
    startDate: '2025-08-01',
    endDate: '2026-07-31',
    status: 'Pending Renewal',
    documentFile: 'health_dept_sanction.pdf'
  }
];

export const initialDailyDutyLogs: DailyDutyLog[] = [
  {
    id: 'log1',
    dutySlipNumber: 'SLIP-9081',
    date: '2026-09-02',
    departmentName: 'Public Works Department (PWD)',
    vehicle: 'DL01AB1234',
    driverName: 'Rahul Sharma',
    startKm: 45210,
    endKm: 45345,
    totalKm: 135,
    extraKm: 35,
    startTime: '08:30 AM',
    endTime: '07:30 PM',
    totalHours: 11.0,
    extraHours: 1.0,
    tollParkingAmount: 240,
    fuelAmount: 2400,
    fuelLitres: 25.5,
    officerName: 'Er. R. K. Singhal',
    dutySlipPhoto: 'duty_slip_9081.jpg',
    fuelBillPhoto: 'fuel_slip_pwd_sep02.jpg',
    status: 'Approved',
    notes: 'Site inspection at Ring Road Flyover & ITO'
  },
  {
    id: 'log2',
    dutySlipNumber: 'SLIP-9082',
    date: '2026-09-02',
    departmentName: 'Delhi Jal Nigam (DJN)',
    vehicle: 'DL05KL4432',
    driverName: 'Vikas Kumar',
    startKm: 38100,
    endKm: 38210,
    totalKm: 110,
    extraKm: 10,
    startTime: '09:00 AM',
    endTime: '06:30 PM',
    totalHours: 9.5,
    extraHours: 0,
    tollParkingAmount: 0,
    fuelAmount: 1800,
    fuelLitres: 19.0,
    officerName: 'Sunil Mehra',
    dutySlipPhoto: 'duty_slip_9082.jpg',
    fuelBillPhoto: null,
    status: 'Approved',
    notes: 'Wazirabad Water Treatment Plant visit'
  },
  {
    id: 'log3',
    dutySlipNumber: 'SLIP-9075',
    date: '2026-09-01',
    departmentName: 'Public Works Department (PWD)',
    vehicle: 'DL01AB1234',
    driverName: 'Rahul Sharma',
    startKm: 45080,
    endKm: 45210,
    totalKm: 130,
    extraKm: 30,
    startTime: '08:00 AM',
    endTime: '08:00 PM',
    totalHours: 12.0,
    extraHours: 2.0,
    tollParkingAmount: 180,
    fuelAmount: 0,
    fuelLitres: 0,
    officerName: 'Er. R. K. Singhal',
    dutySlipPhoto: 'duty_slip_9075.jpg',
    fuelBillPhoto: null,
    status: 'Approved',
    notes: 'Drainage work inspection in South Extn'
  },
  {
    id: 'log4',
    dutySlipNumber: 'SLIP-9069',
    date: '2026-08-31',
    departmentName: 'Directorate of Health Services',
    vehicle: 'DL07GH2211',
    driverName: 'Suresh Yadav',
    startKm: 52100,
    endKm: 52180,
    totalKm: 80,
    extraKm: 0,
    startTime: '09:30 AM',
    endTime: '05:30 PM',
    totalHours: 8.0,
    extraHours: 0,
    tollParkingAmount: 60,
    fuelAmount: 1500,
    fuelLitres: 16.0,
    officerName: 'Dr. Anita Roy',
    dutySlipPhoto: null,
    fuelBillPhoto: null,
    status: 'Pending',
    notes: 'Dispensary inspection in Central Zone'
  }
];

export const initialMonthlyBills: MonthlyDepartmentBill[] = [
  {
    id: 'bill1',
    billNumber: 'INV-2026-08-PWD',
    departmentName: 'Public Works Department (PWD)',
    vehicle: 'DL01AB1234',
    billingMonth: '2026-08',
    baseContractAmount: 85000,
    totalKmRun: 2980,
    extraKmCost: 6720,
    extraHoursCost: 2280,
    tollParkingCost: 1500,
    totalBill: 95500,
    paidAmount: 0,
    balanceDue: 95500,
    status: 'Sent',
    dueDate: '2026-09-15',
    invoicePdf: 'invoice_pwd_aug2026.pdf'
  },
  {
    id: 'bill2',
    billNumber: 'INV-2026-08-DJN',
    departmentName: 'Delhi Jal Nigam (DJN)',
    vehicle: 'DL05KL4432',
    billingMonth: '2026-08',
    baseContractAmount: 78000,
    totalKmRun: 2450,
    extraKmCost: 3250,
    extraHoursCost: 1950,
    tollParkingCost: 0,
    totalBill: 83200,
    paidAmount: 83200,
    balanceDue: 0,
    status: 'Paid',
    dueDate: '2026-09-10',
    invoicePdf: 'invoice_djn_aug2026.pdf'
  },
  {
    id: 'bill3',
    billNumber: 'INV-2026-07-PWD',
    departmentName: 'Public Works Department (PWD)',
    vehicle: 'DL01AB1234',
    billingMonth: '2026-07',
    baseContractAmount: 85000,
    totalKmRun: 2890,
    extraKmCost: 5460,
    extraHoursCost: 1800,
    tollParkingCost: 1200,
    totalBill: 93460,
    paidAmount: 93460,
    balanceDue: 0,
    status: 'Paid',
    dueDate: '2026-08-15',
    invoicePdf: 'invoice_pwd_jul2026.pdf'
  },
  {
    id: 'bill4',
    billNumber: 'INV-2026-07-HLT',
    departmentName: 'Directorate of Health Services',
    vehicle: 'DL07GH2211',
    billingMonth: '2026-07',
    baseContractAmount: 65000,
    totalKmRun: 2150,
    extraKmCost: 1800,
    extraHoursCost: 900,
    tollParkingCost: 350,
    totalBill: 68050,
    paidAmount: 0,
    balanceDue: 68050,
    status: 'Overdue',
    dueDate: '2026-08-10',
    invoicePdf: 'invoice_health_jul2026.pdf'
  }
];

export const initialDepartmentPayments: DepartmentPayment[] = [
  {
    id: 'pay1',
    receiptNumber: 'REC-2026-8891',
    invoiceNumber: 'INV-2026-08-DJN',
    departmentName: 'Delhi Jal Nigam (DJN)',
    paymentDate: '2026-09-01',
    amountPaid: 83200,
    paymentMode: 'Treasury Challan',
    referenceNo: 'CHALLAN-DJN-998821',
    status: 'Received',
    remarks: 'Full settlement for Aug 2026 billing',
    paymentProof: 'challan_receipt_djn.pdf'
  },
  {
    id: 'pay2',
    receiptNumber: 'REC-2026-8840',
    invoiceNumber: 'INV-2026-07-PWD',
    departmentName: 'Public Works Department (PWD)',
    paymentDate: '2026-08-20',
    amountPaid: 93460,
    paymentMode: 'NEFT / RTGS',
    referenceNo: 'UTR-SBIN004889211',
    status: 'Reconciled',
    remarks: 'Electronic fund transfer via SBI Treasury branch',
    paymentProof: 'pwd_utr_receipt.png'
  },
  {
    id: 'pay3',
    receiptNumber: 'REC-2026-8790',
    invoiceNumber: 'INV-2026-06-PWD',
    departmentName: 'Public Works Department (PWD)',
    paymentDate: '2026-07-22',
    amountPaid: 91200,
    paymentMode: 'NEFT / RTGS',
    referenceNo: 'UTR-SBIN003771990',
    status: 'Reconciled',
    remarks: 'June 2026 bill cleared in full',
    paymentProof: 'pwd_june_payment.pdf'
  }
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

export const initialDriverAttendance: DriverAttendance[] = [
  {
    id: 'att1',
    driverId: 'd1',
    driverName: 'Rahul Sharma',
    date: '2026-09-02',
    status: 'Present',
    checkIn: '08:30 AM',
    checkOut: '07:00 PM',
    assignedVehicle: 'DL01AB1234',
    dutyType: 'Department Duty',
    workingHours: 10.5,
    notes: 'PWD Headquarters Delhi route'
  },
  {
    id: 'att2',
    driverId: 'd2',
    driverName: 'Vikas Kumar',
    date: '2026-09-02',
    status: 'On Trip',
    checkIn: '06:00 AM',
    checkOut: '—',
    assignedVehicle: 'DL02CD5678',
    dutyType: 'Trip Duty',
    workingHours: 8.0,
    notes: 'Delhi to Chandigarh Outstation Trip'
  },
  {
    id: 'att3',
    driverId: 'd3',
    driverName: 'Suresh Yadav',
    date: '2026-09-02',
    status: 'On Leave',
    checkIn: '—',
    checkOut: '—',
    assignedVehicle: 'DL03EF9012',
    dutyType: 'Standby',
    workingHours: 0,
    notes: 'Approved medical leave'
  }
];

export const initialDriverExpenses: DriverExpenseItem[] = [
  {
    id: 'de1',
    driverId: 'd1',
    driverName: 'Rahul Sharma',
    vehicle: 'DL01AB1234',
    date: '2026-09-01',
    category: 'Daily Bata / Food',
    amount: 350,
    status: 'Paid',
    remarks: 'Full day PWD field duty allowance',
    receipt: 'bata_sep01.jpg'
  },
  {
    id: 'de2',
    driverId: 'd2',
    driverName: 'Vikas Kumar',
    vehicle: 'DL02CD5678',
    date: '2026-08-31',
    category: 'Night Halt Allowance',
    amount: 800,
    status: 'Approved',
    remarks: 'Overnight stay at Chandigarh terminal',
    receipt: 'nighthalt_vikas.pdf'
  },
  {
    id: 'de3',
    driverId: 'd2',
    driverName: 'Vikas Kumar',
    vehicle: 'DL02CD5678',
    date: '2026-08-30',
    category: 'Toll / Cash Reimbursement',
    amount: 640,
    status: 'Paid',
    remarks: 'Emergency cash toll paid at Karnal bypass',
    receipt: 'toll_cash_slip.png'
  },
  {
    id: 'de4',
    driverId: 'd1',
    driverName: 'Rahul Sharma',
    vehicle: 'DL01AB1234',
    date: '2026-08-28',
    category: 'Overtime',
    amount: 500,
    status: 'Paid',
    remarks: '4 hours late night duty for Jal Nigam inspection',
    receipt: null
  },
  {
    id: 'de5',
    driverId: 'd3',
    driverName: 'Suresh Yadav',
    vehicle: 'DL03EF9012',
    date: '2026-08-25',
    category: 'Advance Payout',
    amount: 3000,
    status: 'Paid',
    remarks: 'Mid-month salary advance',
    receipt: 'advance_voucher_104.pdf'
  }
];

export const initialFuelLogs: FuelLogEntry[] = [
  {
    id: 'fuel1',
    vehicle: 'DL01AB1234',
    driverName: 'Rahul Sharma',
    date: '2026-09-02',
    time: '08:45 AM',
    odometer: 45345,
    fuelType: 'Diesel',
    litres: 35.5,
    ratePerLitre: 89.62,
    totalCost: 3180,
    stationName: 'Indian Oil Co. (Ring Road Pump, New Delhi)',
    paymentMode: 'Fleet Card',
    meterPhoto: 'pump_meter_sep02_pwd.jpg',
    receiptPhoto: 'fuel_slip_pwd_sep02.jpg',
    notes: 'Full tank for PWD inspection route'
  },
  {
    id: 'fuel2',
    vehicle: 'DL02CD5678',
    driverName: 'Vikas Kumar',
    date: '2026-09-01',
    time: '06:15 AM',
    odometer: 61200,
    fuelType: 'Diesel',
    litres: 48.0,
    ratePerLitre: 89.62,
    totalCost: 4300,
    stationName: 'Bharat Petroleum (Karnal Bypass Highway)',
    paymentMode: 'Fleet Card',
    meterPhoto: 'pump_dispenser_vikas.jpg',
    receiptPhoto: 'bpcl_receipt_karnal.png',
    notes: 'Outstation Delhi to Chandigarh trip refill'
  },
  {
    id: 'fuel3',
    vehicle: 'DL05KL4432',
    driverName: 'Vikas Kumar',
    date: '2026-08-31',
    time: '09:30 AM',
    odometer: 38100,
    fuelType: 'CNG',
    litres: 22.4, // kg for CNG
    ratePerLitre: 75.59,
    totalCost: 1693,
    stationName: 'IGL CNG Station (Sector 10, Rohini)',
    paymentMode: 'UPI',
    meterPhoto: 'igl_cng_meter_dl05.jpg',
    receiptPhoto: 'igl_cng_bill_aug31.jpg',
    notes: 'Jal Nigam duty refueling'
  },
  {
    id: 'fuel4',
    vehicle: 'DL03EF9012',
    driverName: 'Suresh Yadav',
    date: '2026-08-28',
    time: '07:10 PM',
    odometer: 54300,
    fuelType: 'Diesel',
    litres: 40.0,
    ratePerLitre: 89.62,
    totalCost: 3585,
    stationName: 'HP Fuel Centre (Ludhiana Bypass)',
    paymentMode: 'Company Credit',
    meterPhoto: 'hp_meter_dl03.jpg',
    receiptPhoto: 'hp_slip_ludhiana.pdf',
    notes: 'Refill after Manali outstation return'
  }
];

export const initialFastagTransactions: FastagTransaction[] = [
  {
    id: 'ft1',
    vehicle: 'DL01AB1234',
    tagId: '34161FA8891',
    type: 'Toll Deduction',
    date: '2026-09-02',
    time: '11:15 AM',
    tollPlaza: 'Kherki Daula Toll Plaza (Delhi-Gurugram Expy)',
    amount: 145,
    balanceAfter: 2450,
    lane: 'Lane 04 (ETC Fastag Fast)',
    transactionRef: 'TXN-KD8829141',
    linkedDutyOrTrip: 'SLIP-9081 (PWD Inspection)',
    proofSlip: 'fastag_kd_toll_receipt.jpg',
    status: 'Successful'
  },
  {
    id: 'ft2',
    vehicle: 'DL01AB1234',
    tagId: '34161FA8891',
    type: 'Toll Deduction',
    date: '2026-09-02',
    time: '04:30 PM',
    tollPlaza: 'Badarpur Border Elevated Toll',
    amount: 95,
    balanceAfter: 2595,
    lane: 'Lane 02 (ETC Northbound)',
    transactionRef: 'TXN-BB7741289',
    linkedDutyOrTrip: 'SLIP-9081 (PWD Inspection)',
    proofSlip: null,
    status: 'Successful'
  },
  {
    id: 'ft3',
    vehicle: 'DL02CD5678',
    tagId: '34161FA9923',
    type: 'Toll Deduction',
    date: '2026-09-01',
    time: '07:45 AM',
    tollPlaza: 'Murthal Toll Plaza (NH-44)',
    amount: 220,
    balanceAfter: 1820,
    lane: 'Lane 06 (FASTag High Speed)',
    transactionRef: 'TXN-MT9901412',
    linkedDutyOrTrip: 'Trip · Delhi → Chandigarh',
    proofSlip: 'murthal_toll_sms_proof.png',
    status: 'Successful'
  },
  {
    id: 'ft4',
    vehicle: 'DL02CD5678',
    tagId: '34161FA9923',
    type: 'Toll Deduction',
    date: '2026-09-01',
    time: '09:20 AM',
    tollPlaza: 'Panipat Elevated Toll Plaza',
    amount: 175,
    balanceAfter: 2040,
    lane: 'Lane 03',
    transactionRef: 'TXN-PN6632190',
    linkedDutyOrTrip: 'Trip · Delhi → Chandigarh',
    proofSlip: null,
    status: 'Successful'
  },
  {
    id: 'ft5',
    vehicle: 'DL03EF9012',
    tagId: '34161FA7741',
    type: 'Toll Deduction',
    date: '2026-08-28',
    time: '06:10 PM',
    tollPlaza: 'Ludhiana South Toll Plaza',
    amount: 130,
    balanceAfter: 340, // Low balance
    lane: 'Lane 01',
    transactionRef: 'TXN-LD5541289',
    linkedDutyOrTrip: 'Outstation Manali Return',
    proofSlip: 'ludhiana_toll_slip.jpg',
    status: 'Successful'
  },
  {
    id: 'ft6',
    vehicle: 'DL01AB1234',
    tagId: '34161FA8891',
    type: 'Recharge',
    date: '2026-08-30',
    time: '10:00 AM',
    tollPlaza: 'ICICI Bank FASTag Wallet Topup',
    amount: 2000,
    balanceAfter: 2690,
    lane: 'Online Recharge',
    transactionRef: 'UTR-ICIC00293819',
    linkedDutyOrTrip: 'Fleet Wallet Topup',
    proofSlip: 'fastag_recharge_icici_2000.pdf',
    status: 'Successful'
  }
];


