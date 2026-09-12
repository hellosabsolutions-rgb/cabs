import * as XLSX from 'xlsx';
import { Driver, DriverType, Vehicle, VehicleType, VehicleStatus } from '../types/fleet';

/**
 * Standard headers for the Driver Onboarding template
 */
export const DRIVER_HEADERS = [
  'Full Name',
  'Phone Number',
  'Driver Type',
  'License Number',
  'License Expiry',
  'Assigned Vehicle',
  'Monthly Salary',
  'Joining Date',
  'Status',
  'Address',
  'Emergency Contact'
];

export const DRIVER_CSV_HEADERS = DRIVER_HEADERS;

/**
 * Sample row data for the user to understand expected format
 */
export const DRIVER_SAMPLE_ROWS = [
  {
    name: 'Ramesh Sharma',
    phone: '9876543210',
    driverType: 'Full Time',
    licenseNumber: 'DL0420110012345',
    licenseExpiry: '2028-12-31',
    assignedVehicle: 'DL01AB1234',
    monthlySalary: 25000,
    joiningDate: '2024-01-15',
    status: 'On duty',
    address: 'Flat 101, Galaxy Apts, Sector 62, Noida, UP',
    emergencyContact: '9811223344'
  },
  {
    name: 'Suresh Verma',
    phone: '9812345678',
    driverType: 'Contract',
    licenseNumber: 'HR2620150098765',
    licenseExpiry: '2029-06-30',
    assignedVehicle: '—',
    monthlySalary: 22000,
    joiningDate: '2024-03-01',
    status: 'On duty',
    address: 'H.No 45, DLF Phase 3, Gurgaon, Haryana',
    emergencyContact: '9822334455'
  },
  {
    name: 'Amit Singh',
    phone: '9899112233',
    driverType: 'Part Time',
    licenseNumber: 'UP1420180054321',
    licenseExpiry: '2027-11-20',
    assignedVehicle: '—',
    monthlySalary: 16000,
    joiningDate: '2024-05-10',
    status: 'Off duty',
    address: 'Sector 15, Vasundhara, Ghaziabad',
    emergencyContact: '9877665544'
  }
];

export const DRIVER_CSV_SAMPLE_ROWS = DRIVER_SAMPLE_ROWS;

/**
 * Downloads a pre-formatted Excel (.xlsx) template with sample driver data
 */
export function downloadDriverExcelTemplate(): void {
  const wsData = [
    DRIVER_HEADERS,
    ...DRIVER_SAMPLE_ROWS.map(r => [
      r.name,
      r.phone,
      r.driverType,
      r.licenseNumber,
      r.licenseExpiry,
      r.assignedVehicle,
      r.monthlySalary,
      r.joiningDate,
      r.status,
      r.address,
      r.emergencyContact
    ])
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set clean column widths
  ws['!cols'] = [
    { wch: 22 }, // Full Name
    { wch: 16 }, // Phone Number
    { wch: 15 }, // Driver Type
    { wch: 22 }, // License Number
    { wch: 16 }, // License Expiry
    { wch: 18 }, // Assigned Vehicle
    { wch: 16 }, // Monthly Salary
    { wch: 16 }, // Joining Date
    { wch: 14 }, // Status
    { wch: 38 }, // Address
    { wch: 18 }  // Emergency Contact
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Drivers Onboarding');
  XLSX.writeFile(wb, 'fleet_driver_onboarding_template.xlsx');
}

/**
 * Exports current driver roster to an Excel (.xlsx) file
 */
export function exportDriversToExcel(drivers: Driver[], filename?: string): void {
  const wsData = [
    DRIVER_HEADERS,
    ...drivers.map(d => [
      d.name || '',
      d.phone || '',
      d.driverType || 'Full Time',
      d.licenseNumber || '',
      d.licenseExpiry || '',
      d.assignedVehicle && d.assignedVehicle !== '—' ? d.assignedVehicle : '—',
      d.monthlySalary !== undefined ? d.monthlySalary : '',
      d.joiningDate || '',
      d.status || 'On duty',
      d.address || '',
      d.emergencyContact || ''
    ])
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = [
    { wch: 22 },
    { wch: 16 },
    { wch: 15 },
    { wch: 22 },
    { wch: 16 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 38 },
    { wch: 18 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Driver Roster');
  const actualName = filename || `fleet_drivers_roster_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, actualName);
}

// Backward compatibility CSV helpers
export function generateDriverCsvTemplate(): string {
  const headerLine = DRIVER_HEADERS.join(',');
  const sampleLines = DRIVER_SAMPLE_ROWS.map(r =>
    [
      `"${r.name}"`,
      `"${r.phone}"`,
      `"${r.driverType}"`,
      `"${r.licenseNumber}"`,
      `"${r.licenseExpiry}"`,
      `"${r.assignedVehicle}"`,
      r.monthlySalary,
      `"${r.joiningDate}"`,
      `"${r.status}"`,
      `"${r.address}"`,
      `"${r.emergencyContact}"`
    ].join(',')
  );
  return [headerLine, ...sampleLines].join('\r\n');
}

export function exportDriversToCsv(drivers: Driver[]): string {
  const headerLine = DRIVER_HEADERS.join(',');
  const driverLines = drivers.map(d =>
    [
      `"${d.name || ''}"`,
      `"${d.phone || ''}"`,
      `"${d.driverType || 'Full Time'}"`,
      `"${d.licenseNumber || ''}"`,
      `"${d.licenseExpiry || ''}"`,
      `"${d.assignedVehicle && d.assignedVehicle !== '—' ? d.assignedVehicle : '—'}"`,
      d.monthlySalary !== undefined ? d.monthlySalary : '',
      `"${d.joiningDate || ''}"`,
      `"${d.status || 'On duty'}"`,
      `"${d.address || ''}"`,
      `"${d.emergencyContact || ''}"`
    ].join(',')
  );
  return [headerLine, ...driverLines].join('\r\n');
}

export function downloadCsv(csvContent: string, filename: string): void {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface ParsedDriverRow {
  rowNumber: number;
  data: Omit<Driver, 'id'>;
  isValid: boolean;
  errors: string[];
}

export interface CsvParseResult {
  totalRows: number;
  validDrivers: Array<Omit<Driver, 'id'>>;
  parsedRows: ParsedDriverRow[];
  errorCount: number;
}

/**
 * Smart mapping of column header string to standardized driver field key
 */
function mapHeaderToField(header: string): string | null {
  const norm = header.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!norm) return null;

  if (norm.includes('name') || norm === 'fullname' || norm === 'drivername' || norm === 'driver') {
    return 'name';
  }
  if (norm.includes('phone') || norm.includes('mobile') || norm.includes('contact') || norm === 'tel') {
    return 'phone';
  }
  if (norm.includes('drivertype') || norm === 'type' || norm.includes('contracttype')) {
    return 'driverType';
  }
  if (norm.includes('licensenumber') || norm.includes('licenseno') || norm === 'dl' || norm === 'dlnumber' || norm.includes('drivinglicence')) {
    return 'licenseNumber';
  }
  if (norm.includes('expiry') || norm.includes('dlexpiry') || norm.includes('licenseexpiry')) {
    return 'licenseExpiry';
  }
  if (norm.includes('vehicle') || norm.includes('assignedvehicle') || norm === 'cab' || norm.includes('carnumber')) {
    return 'assignedVehicle';
  }
  if (norm.includes('salary') || norm.includes('monthlysalary') || norm === 'pay' || norm.includes('wage')) {
    return 'monthlySalary';
  }
  if (norm.includes('join') || norm.includes('doj') || norm.includes('joiningdate')) {
    return 'joiningDate';
  }
  if (norm.includes('status') || norm.includes('dutystatus')) {
    return 'status';
  }
  if (norm.includes('address') || norm.includes('location') || norm.includes('residence')) {
    return 'address';
  }
  if (norm.includes('emergency') || norm.includes('altcontact') || norm.includes('altphone')) {
    return 'emergencyContact';
  }

  return null;
}

/**
 * Formats date value from Excel numeric date or date string to YYYY-MM-DD
 */
function formatExcelDate(raw: any): string {
  if (!raw) return '';
  if (typeof raw === 'number') {
    try {
      const d = XLSX.SSF.parse_date_code(raw);
      if (d) {
        return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
      }
    } catch {
      // fallback
    }
  }
  const str = String(raw).trim();
  if (str.match(/^\d{4}-\d{2}-\d{2}$/)) return str;
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  return str;
}

/**
 * Parses any uploaded file (.xlsx, .xls, .csv) and returns validated driver records
 */
export async function parseDriverFile(file: File): Promise<CsvParseResult> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];

  if (!ws) {
    return { totalRows: 0, validDrivers: [], parsedRows: [], errorCount: 0 };
  }

  // Convert worksheet to array of row arrays
  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  if (!rows || rows.length === 0) {
    return { totalRows: 0, validDrivers: [], parsedRows: [], errorCount: 0 };
  }

  // First non-empty row as header
  let headerIndex = 0;
  while (headerIndex < rows.length && rows[headerIndex].every((c: any) => String(c || '').trim() === '')) {
    headerIndex++;
  }

  if (headerIndex >= rows.length) {
    return { totalRows: 0, validDrivers: [], parsedRows: [], errorCount: 0 };
  }

  const headerCells = rows[headerIndex].map((c: any) => String(c || '').trim());
  const fieldMapping: Record<number, string> = {};

  headerCells.forEach((h, idx) => {
    const field = mapHeaderToField(h);
    if (field) {
      fieldMapping[idx] = field;
    }
  });

  const parsedRows: ParsedDriverRow[] = [];
  const validDrivers: Array<Omit<Driver, 'id'>> = [];
  let errorCount = 0;

  for (let i = headerIndex + 1; i < rows.length; i++) {
    const cells = rows[i];
    if (!cells || cells.every((c: any) => String(c || '').trim() === '')) {
      continue;
    }

    const rowObj: any = {};
    cells.forEach((val: any, idx: number) => {
      const field = fieldMapping[idx];
      if (field) {
        rowObj[field] = val;
      }
    });

    const errors: string[] = [];

    // Validate Name
    const cleanName = String(rowObj.name || '').trim();
    if (!cleanName) {
      errors.push('Driver name is required.');
    }

    // Validate Phone
    const cleanPhone = String(rowObj.phone || '').trim().replace(/[^0-9+]/g, '');
    if (!cleanPhone) {
      errors.push('Phone number is required.');
    } else if (cleanPhone.replace(/\D/g, '').length < 10) {
      errors.push('Phone number must have at least 10 digits.');
    }

    // Driver Type
    let cleanType: DriverType = 'Full Time';
    const rawType = String(rowObj.driverType || '').toLowerCase();
    if (rawType.includes('part')) cleanType = 'Part Time';
    else if (rawType.includes('contract')) cleanType = 'Contract';
    else if (rawType.includes('owner')) cleanType = 'Owner Driver';
    else cleanType = 'Full Time';

    // Status
    let cleanStatus: 'On duty' | 'Off duty' = 'On duty';
    const rawStatus = String(rowObj.status || '').toLowerCase();
    if (rawStatus.includes('off') || rawStatus.includes('inactive')) {
      cleanStatus = 'Off duty';
    }

    // Salary
    let cleanSalary: number | undefined = undefined;
    if (rowObj.monthlySalary !== undefined && rowObj.monthlySalary !== '') {
      const num = Number(String(rowObj.monthlySalary).replace(/[^0-9.]/g, ''));
      if (!isNaN(num) && num >= 0) {
        cleanSalary = num;
      }
    }

    // Assigned Vehicle
    const cleanVehicle = rowObj.assignedVehicle &&
      String(rowObj.assignedVehicle).trim() !== '—' &&
      String(rowObj.assignedVehicle).trim().toLowerCase() !== 'unassigned'
        ? String(rowObj.assignedVehicle).trim()
        : '—';

    // Joining Date
    let cleanJoiningDate = formatExcelDate(rowObj.joiningDate);
    if (!cleanJoiningDate) {
      cleanJoiningDate = new Date().toISOString().split('T')[0];
    }

    // License Expiry
    const cleanLicenseExpiry = formatExcelDate(rowObj.licenseExpiry);

    const driverRecord: Omit<Driver, 'id'> = {
      name: cleanName,
      phone: cleanPhone,
      driverType: cleanType,
      status: cleanStatus,
      assignedVehicle: cleanVehicle,
      licenseNumber: String(rowObj.licenseNumber || '').trim().toUpperCase() || undefined,
      licenseExpiry: cleanLicenseExpiry || undefined,
      monthlySalary: cleanSalary,
      joiningDate: cleanJoiningDate,
      address: String(rowObj.address || '').trim() || undefined,
      emergencyContact: String(rowObj.emergencyContact || '').trim() || undefined
    };

    const isValid = errors.length === 0;
    if (!isValid) errorCount++;
    else validDrivers.push(driverRecord);

    parsedRows.push({
      rowNumber: parsedRows.length + 1,
      data: driverRecord,
      isValid,
      errors
    });
  }

  return {
    totalRows: parsedRows.length,
    validDrivers,
    parsedRows,
    errorCount
  };
}

// Keep parseDriverCsv pointing to parseDriverFile for compatibility
export const parseDriverCsv = parseDriverFile;

/**
 * =======================================================================
 * VEHICLE BULK ONBOARDING HELPERS
 * =======================================================================
 */

export const VEHICLE_HEADERS = [
  'Registration Number',
  'Vehicle Type',
  'Model / Make',
  'Department / Client Assigned',
  'Designated Driver',
  'Status',
  'Fuel Type',
  'Seating Capacity',
  'Current Odometer (KM)',
  'FASTag Tag ID',
  'FASTag Bank',
  'FASTag Balance',
  'GPS IMEI Number',
  'RC Expiry',
  'Insurance Expiry',
  'PUC Expiry',
  'Permit Expiry',
  'Fitness Expiry'
];

export const VEHICLE_CSV_HEADERS = VEHICLE_HEADERS;

export const VEHICLE_SAMPLE_ROWS = [
  {
    registrationNumber: 'DL01AB1234',
    type: 'Trip-based' as VehicleType,
    model: 'Toyota Innova Crysta',
    assignedTo: 'General / Retail Bookings',
    assignedDriver: 'Ramesh Sharma',
    status: 'Running' as VehicleStatus,
    fuelType: 'Diesel' as const,
    seatingCapacity: 7,
    odometer: 45200,
    fastagTagId: '34161FA820320491',
    fastagBank: 'ICICI Bank',
    fastagBalance: 2500,
    gpsImei: '865432049182374',
    rcExpiry: '2028-12-31',
    insuranceExpiry: '2025-11-20',
    pollutionExpiry: '2025-08-15',
    permitExpiry: '2026-05-30',
    fitnessExpiry: '2027-02-18'
  },
  {
    registrationNumber: 'HR26DQ5678',
    type: 'Department' as VehicleType,
    model: 'Maruti Suzuki Dzire',
    assignedTo: 'Ministry of Finance',
    assignedDriver: 'Suresh Verma',
    status: 'Idle' as VehicleStatus,
    fuelType: 'CNG' as const,
    seatingCapacity: 4,
    odometer: 32100,
    fastagTagId: '34161FA820998877',
    fastagBank: 'Paytm Payments Bank',
    fastagBalance: 1200,
    gpsImei: '865432049911223',
    rcExpiry: '2029-06-30',
    insuranceExpiry: '2026-03-15',
    pollutionExpiry: '2025-10-10',
    permitExpiry: '2026-08-20',
    fitnessExpiry: '2027-06-12'
  },
  {
    registrationNumber: 'UP16CD9012',
    type: 'Trip-based' as VehicleType,
    model: 'Maruti Suzuki Ertiga',
    assignedTo: 'General / Retail Bookings',
    assignedDriver: 'Amit Singh',
    status: 'Running' as VehicleStatus,
    fuelType: 'Petrol' as const,
    seatingCapacity: 7,
    odometer: 28450,
    fastagTagId: '34161FA820554433',
    fastagBank: 'SBI',
    fastagBalance: 1800,
    gpsImei: '865432049332211',
    rcExpiry: '2030-01-15',
    insuranceExpiry: '2025-12-05',
    pollutionExpiry: '2025-09-25',
    permitExpiry: '2026-04-10',
    fitnessExpiry: '2027-04-30'
  }
];

/**
 * Downloads a pre-formatted Excel (.xlsx) template with sample vehicle data
 */
export function downloadVehicleExcelTemplate(): void {
  const wsData = [
    VEHICLE_HEADERS,
    ...VEHICLE_SAMPLE_ROWS.map(r => [
      r.registrationNumber,
      r.type,
      r.model,
      r.assignedTo,
      r.assignedDriver,
      r.status,
      r.fuelType,
      r.seatingCapacity,
      r.odometer,
      r.fastagTagId,
      r.fastagBank,
      r.fastagBalance,
      r.gpsImei,
      r.rcExpiry,
      r.insuranceExpiry,
      r.pollutionExpiry,
      r.permitExpiry,
      r.fitnessExpiry
    ])
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths for easy reading
  ws['!cols'] = [
    { wch: 22 }, // Registration Number
    { wch: 16 }, // Vehicle Type
    { wch: 25 }, // Model / Make
    { wch: 28 }, // Department / Client Assigned
    { wch: 20 }, // Designated Driver
    { wch: 14 }, // Status
    { wch: 14 }, // Fuel Type
    { wch: 16 }, // Seating Capacity
    { wch: 22 }, // Current Odometer (KM)
    { wch: 22 }, // FASTag Tag ID
    { wch: 20 }, // FASTag Bank
    { wch: 18 }, // FASTag Balance
    { wch: 22 }, // GPS IMEI Number
    { wch: 16 }, // RC Expiry
    { wch: 16 }, // Insurance Expiry
    { wch: 16 }, // PUC Expiry
    { wch: 16 }, // Permit Expiry
    { wch: 16 }  // Fitness Expiry
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Vehicles Onboarding');
  XLSX.writeFile(wb, 'fleet_vehicle_onboarding_template.xlsx');
}

/**
 * Exports current vehicle roster to an Excel (.xlsx) file
 */
export function exportVehiclesToExcel(vehicles: Vehicle[], filename?: string): void {
  const wsData = [
    VEHICLE_HEADERS,
    ...vehicles.map(v => [
      v.registrationNumber || '',
      v.type || 'Trip-based',
      v.model || '',
      v.assignedTo || '',
      v.assignedDriver || '—',
      v.status || 'Idle',
      v.fuelType || '',
      v.seatingCapacity || '',
      v.odometer || 0,
      v.fastagTagId || '',
      v.fastagBank || '',
      v.fastagBalance || 0,
      v.gpsImei || '',
      v.rcExpiry || '',
      v.insuranceExpiry || '',
      v.pollutionExpiry || '',
      v.permitExpiry || '',
      v.fitnessExpiry || ''
    ])
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = [
    { wch: 22 },
    { wch: 16 },
    { wch: 25 },
    { wch: 28 },
    { wch: 20 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 22 },
    { wch: 22 },
    { wch: 20 },
    { wch: 18 },
    { wch: 22 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Fleet Vehicles');
  XLSX.writeFile(wb, filename || 'fleet_vehicles_export.xlsx');
}

export interface ParsedVehicleRow {
  rowNumber: number;
  data: Omit<Vehicle, 'id'>;
  isValid: boolean;
  errors: string[];
}

export interface VehicleCsvParseResult {
  totalRows: number;
  validVehicles: Array<Omit<Vehicle, 'id'>>;
  parsedRows: ParsedVehicleRow[];
  errorCount: number;
}

/**
 * Smart mapping of column header string to vehicle field key
 */
function mapHeaderToVehicleField(header: string): string | null {
  const norm = header.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!norm) return null;

  if (
    norm.includes('registration') ||
    norm.includes('regno') ||
    norm === 'vehicle' ||
    norm === 'vehicleno' ||
    norm === 'plateno' ||
    norm === 'carno' ||
    norm === 'cabno'
  ) {
    return 'registrationNumber';
  }

  if (norm.includes('vehicletype') || norm === 'type' || norm === 'category') {
    return 'type';
  }

  if (norm.includes('model') || norm.includes('make') || norm === 'car' || norm === 'variant') {
    return 'model';
  }

  if (norm.includes('dept') || norm.includes('department') || norm.includes('client') || norm.includes('assignedto')) {
    return 'assignedTo';
  }

  if (norm.includes('driver') || norm.includes('pilot') || norm.includes('chauffeur')) {
    return 'assignedDriver';
  }

  if (norm.includes('status')) {
    return 'status';
  }

  if (norm.includes('fuel') || norm.includes('fueltype')) {
    return 'fuelType';
  }

  if (norm.includes('seat') || norm.includes('capacity') || norm === 'seating') {
    return 'seatingCapacity';
  }

  if (norm.includes('odometer') || norm.includes('odo') || norm === 'km' || norm === 'kms' || norm.includes('reading')) {
    return 'odometer';
  }

  if (norm.includes('tagid') || norm === 'fastag' || norm === 'fastagno' || norm.includes('fastagtag')) {
    return 'fastagTagId';
  }

  if (norm.includes('fastagbank') || norm.includes('tagbank')) {
    return 'fastagBank';
  }

  if (norm.includes('fastagbalance') || norm.includes('tagbalance')) {
    return 'fastagBalance';
  }

  if (norm.includes('gps') || norm.includes('imei') || norm.includes('deviceid')) {
    return 'gpsImei';
  }

  if (norm.includes('rc') || norm.includes('registrationcert')) {
    return 'rcExpiry';
  }

  if (norm.includes('insur') || norm.includes('insurance')) {
    return 'insuranceExpiry';
  }

  if (norm.includes('puc') || norm.includes('pollut')) {
    return 'pollutionExpiry';
  }

  if (norm.includes('permit')) {
    return 'permitExpiry';
  }

  if (norm.includes('fit') || norm.includes('fitness')) {
    return 'fitnessExpiry';
  }

  return null;
}

/**
 * Parses any uploaded file (.xlsx, .xls, .csv) and returns validated vehicle records
 */
export async function parseVehicleFile(file: File): Promise<VehicleCsvParseResult> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];

  if (!ws) {
    return { totalRows: 0, validVehicles: [], parsedRows: [], errorCount: 0 };
  }

  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  if (!rows || rows.length === 0) {
    return { totalRows: 0, validVehicles: [], parsedRows: [], errorCount: 0 };
  }

  // Find first non-empty header row
  let headerIndex = 0;
  while (headerIndex < rows.length && rows[headerIndex].every((c: any) => String(c || '').trim() === '')) {
    headerIndex++;
  }

  if (headerIndex >= rows.length) {
    return { totalRows: 0, validVehicles: [], parsedRows: [], errorCount: 0 };
  }

  const headerCells = rows[headerIndex].map((c: any) => String(c || '').trim());
  const fieldMapping: Record<number, string> = {};

  headerCells.forEach((h, idx) => {
    const field = mapHeaderToVehicleField(h);
    if (field) {
      fieldMapping[idx] = field;
    }
  });

  const parsedRows: ParsedVehicleRow[] = [];
  const validVehicles: Array<Omit<Vehicle, 'id'>> = [];
  let errorCount = 0;

  for (let i = headerIndex + 1; i < rows.length; i++) {
    const cells = rows[i];
    if (!cells || cells.every((c: any) => String(c || '').trim() === '')) {
      continue;
    }

    const rowObj: any = {};
    cells.forEach((val: any, idx: number) => {
      const field = fieldMapping[idx];
      if (field) {
        rowObj[field] = val;
      }
    });

    const errors: string[] = [];

    // Validate Registration Number
    const rawReg = String(rowObj.registrationNumber || '').trim().toUpperCase().replace(/\s+/g, '');
    if (!rawReg) {
      errors.push('Registration number is required.');
    } else if (rawReg.length < 5) {
      errors.push('Registration number is too short (e.g. DL01AB1234).');
    }

    // Vehicle Type
    let cleanType: VehicleType = 'Trip-based';
    const rawType = String(rowObj.type || '').toLowerCase();
    if (rawType.includes('dept') || rawType.includes('contract')) {
      cleanType = 'Department';
    } else {
      cleanType = 'Trip-based';
    }

    // Vehicle Status
    let cleanStatus: VehicleStatus = 'Idle';
    const rawStatus = String(rowObj.status || '').toLowerCase();
    if (rawStatus.includes('run') || rawStatus.includes('active') || rawStatus.includes('duty') || rawStatus.includes('trip')) {
      cleanStatus = 'Running';
    } else if (rawStatus.includes('maint') || rawStatus.includes('repair') || rawStatus.includes('shop')) {
      cleanStatus = 'Maintenance';
    } else {
      cleanStatus = 'Idle';
    }

    // Assigned To
    let cleanAssignedTo = String(rowObj.assignedTo || '').trim();
    if (!cleanAssignedTo) {
      cleanAssignedTo = cleanType === 'Department' ? 'Department Contract' : 'General / Retail Bookings';
    }

    // Assigned Driver
    let cleanDriver = String(rowObj.assignedDriver || '').trim();
    if (cleanDriver === '—' || cleanDriver.toLowerCase() === 'unassigned' || !cleanDriver) {
      cleanDriver = 'Unassigned';
    }

    // Fuel Type
    let cleanFuel: 'Diesel' | 'Petrol' | 'CNG' | 'Electric' | undefined = undefined;
    const rawFuel = String(rowObj.fuelType || '').toLowerCase();
    if (rawFuel.includes('diesel')) cleanFuel = 'Diesel';
    else if (rawFuel.includes('petrol')) cleanFuel = 'Petrol';
    else if (rawFuel.includes('cng')) cleanFuel = 'CNG';
    else if (rawFuel.includes('elec') || rawFuel.includes('ev')) cleanFuel = 'Electric';

    // Seating Capacity
    let cleanSeats: number | undefined = undefined;
    if (rowObj.seatingCapacity !== undefined && rowObj.seatingCapacity !== '') {
      const seats = parseInt(String(rowObj.seatingCapacity).replace(/[^0-9]/g, ''), 10);
      if (!isNaN(seats) && seats > 0) cleanSeats = seats;
    }

    // Odometer
    let cleanOdo = 0;
    if (rowObj.odometer !== undefined && rowObj.odometer !== '') {
      const odo = parseInt(String(rowObj.odometer).replace(/[^0-9]/g, ''), 10);
      if (!isNaN(odo) && odo >= 0) cleanOdo = odo;
    }

    // FASTag Balance
    let cleanFastagBal = 0;
    if (rowObj.fastagBalance !== undefined && rowObj.fastagBalance !== '') {
      const bal = parseFloat(String(rowObj.fastagBalance).replace(/[^0-9.-]/g, ''));
      if (!isNaN(bal)) cleanFastagBal = bal;
    }

    // Expiry Dates (No images as per requirement)
    const rcExp = formatExcelDate(rowObj.rcExpiry);
    const insExp = formatExcelDate(rowObj.insuranceExpiry);
    const pucExp = formatExcelDate(rowObj.pollutionExpiry);
    const perExp = formatExcelDate(rowObj.permitExpiry);
    const fitExp = formatExcelDate(rowObj.fitnessExpiry);

    const vehicleRecord: Omit<Vehicle, 'id'> = {
      registrationNumber: rawReg,
      type: cleanType,
      model: String(rowObj.model || '').trim() || undefined,
      assignedTo: cleanAssignedTo,
      departmentName: cleanType === 'Department' ? cleanAssignedTo : undefined,
      assignedDriver: cleanDriver,
      status: cleanStatus,
      fuelType: cleanFuel,
      seatingCapacity: cleanSeats,
      odometer: cleanOdo,
      fastagTagId: String(rowObj.fastagTagId || '').trim() || undefined,
      fastagBank: String(rowObj.fastagBank || '').trim() || undefined,
      fastagBalance: cleanFastagBal,
      gpsImei: String(rowObj.gpsImei || '').trim() || undefined,
      revenue: 0,
      expense: 0,
      profit: 0,
      rcExpiry: rcExp || undefined,
      insuranceExpiry: insExp || undefined,
      pollutionExpiry: pucExp || undefined,
      permitExpiry: perExp || undefined,
      fitnessExpiry: fitExp || undefined
    };

    const isValid = errors.length === 0;
    if (!isValid) {
      errorCount++;
    } else {
      validVehicles.push(vehicleRecord);
    }

    parsedRows.push({
      rowNumber: parsedRows.length + 1,
      data: vehicleRecord,
      isValid,
      errors
    });
  }

  return {
    totalRows: parsedRows.length,
    validVehicles,
    parsedRows,
    errorCount
  };
}
