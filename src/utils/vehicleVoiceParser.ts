/**
 * Utility to parse spoken voice phrases (English & Hinglish) into structured vehicle fields
 */

export interface ParsedVehicleVoiceData {
  registrationNumber?: string;
  model?: string;
  type?: 'Department' | 'Trip-based';
  departmentName?: string;
  hubStand?: string;
  fuelType?: 'Diesel' | 'Petrol' | 'CNG' | 'Electric';
  seatingCapacity?: string;
  assignedDriver?: string;
  odometer?: string;
  fastagBalance?: string;
  status?: 'Running' | 'Active' | 'Idle' | 'Maintenance';
}

const KNOWN_MODELS = [
  'Toyota Innova Crysta',
  'Toyota Innova',
  'Maruti Suzuki Dzire',
  'Swift Dzire',
  'Maruti Dzire',
  'Maruti Suzuki Ertiga',
  'Ertiga',
  'Mahindra Scorpio',
  'Mahindra Bolero',
  'Tata Nexon EV',
  'Tata Nexon',
  'Kia Carens',
  'Maruti WagonR',
  'Honda Amaze',
  'Honda City',
  'Hyundai Aura',
  'Tempo Traveller',
  'Toyota Fortuner'
];

const KNOWN_DEPARTMENTS = [
  { keywords: ['pwd', 'public work', 'public works'], name: 'Public Works Department (PWD)' },
  { keywords: ['jal nigam', 'water dept', 'djn'], name: 'Delhi Jal Nigam (DJN)' },
  { keywords: ['health', 'hospital', 'swasthya'], name: 'Directorate of Health Services' },
  { keywords: ['mcd', 'municipal', 'corporation'], name: 'Municipal Corporation of Delhi (MCD)' },
  { keywords: ['gad', 'general administration'], name: 'General Administration Dept (GAD)' },
  { keywords: ['transport', 'parivahan'], name: 'Transport Department' },
  { keywords: ['irrigation', 'flood'], name: 'Irrigation & Flood Control' }
];

export function parseVehicleVoiceInput(
  rawTranscript: string,
  availableDrivers: string[] = []
): { parsed: ParsedVehicleVoiceData; detectedFieldsCount: number } {
  const text = rawTranscript.toLowerCase();
  const result: ParsedVehicleVoiceData = {};
  let detectedFieldsCount = 0;

  // 1. Parse Vehicle Registration Number
  // Examples: "DL 01 AB 1234", "DL01AB1234", "HR 26 DQ 5555", "UP 16 Z 8080"
  // Match standard Indian vehicle registration patterns
  const regRegex = /\b([a-z]{2})\s*([0-9]{1,2})\s*([a-z]{0,3})\s*([0-9]{4})\b/i;
  const regMatch = rawTranscript.match(regRegex);
  if (regMatch) {
    const fullReg = `${regMatch[1]}${regMatch[2].padStart(2, '0')}${regMatch[3]}${regMatch[4]}`.toUpperCase();
    result.registrationNumber = fullReg;
    detectedFieldsCount++;
  } else {
    // Check if explicitly said "number DL..."
    const numPrefix = text.match(/(?:number|gadi number|gaadi number|registration)\s+([a-z0-9\s]{4,14})/i);
    if (numPrefix && numPrefix[1]) {
      const cleaned = numPrefix[1].toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (cleaned.length >= 6 && cleaned.length <= 11) {
        result.registrationNumber = cleaned;
        detectedFieldsCount++;
      }
    }
  }

  // 2. Parse Vehicle Model
  for (const m of KNOWN_MODELS) {
    if (text.includes(m.toLowerCase()) || text.includes(m.toLowerCase().replace(/\s+/g, ''))) {
      result.model = m;
      detectedFieldsCount++;
      break;
    }
  }

  // 3. Parse Fuel Type
  if (text.includes('diesel') || text.includes('dijel')) {
    result.fuelType = 'Diesel';
    detectedFieldsCount++;
  } else if (text.includes('cng') || text.includes('gas')) {
    result.fuelType = 'CNG';
    detectedFieldsCount++;
  } else if (text.includes('petrol')) {
    result.fuelType = 'Petrol';
    detectedFieldsCount++;
  } else if (text.includes('electric') || text.includes('ev') || text.includes('battery') || text.includes('bijli')) {
    result.fuelType = 'Electric';
    detectedFieldsCount++;
  }

  // 4. Parse Vehicle Type & Department
  if (text.includes('sarkari') || text.includes('government') || text.includes('department')) {
    result.type = 'Department';
    detectedFieldsCount++;
  } else if (text.includes('trip') || text.includes('commercial') || text.includes('tour') || text.includes('outstation')) {
    result.type = 'Trip-based';
    detectedFieldsCount++;
  }

  // Check specific Department
  for (const dept of KNOWN_DEPARTMENTS) {
    if (dept.keywords.some(k => text.includes(k))) {
      result.departmentName = dept.name;
      result.type = 'Department';
      detectedFieldsCount++;
      break;
    }
  }

  // 5. Parse Assigned Driver
  // Check against available drivers list first
  for (const drv of availableDrivers) {
    const drvLower = drv.toLowerCase();
    const firstName = drvLower.split(' ')[0];
    if (text.includes(drvLower) || (firstName.length > 3 && text.includes(firstName))) {
      result.assignedDriver = drv;
      detectedFieldsCount++;
      break;
    }
  }

  // If driver prefix is spoken e.g. "driver Amit Kumar"
  if (!result.assignedDriver) {
    const driverMatch = text.match(/(?:driver|chalak)\s+([a-z]+(?:\s+[a-z]+)?)/i);
    if (driverMatch && driverMatch[1]) {
      const rawName = driverMatch[1].trim();
      const capitalized = rawName
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      result.assignedDriver = capitalized;
      detectedFieldsCount++;
    }
  }

  // 6. Parse Seating Capacity
  // "7 seater", "7 seat", "saat seater", "5 seater"
  const seatMatch = text.match(/([4-9]|1[0-2])\s*(?:seater|seat|capacity)/);
  if (seatMatch) {
    result.seatingCapacity = seatMatch[1];
    detectedFieldsCount++;
  } else if (text.includes('saat seater') || text.includes('7 seater')) {
    result.seatingCapacity = '7';
    detectedFieldsCount++;
  } else if (text.includes('panch seater') || text.includes('5 seater')) {
    result.seatingCapacity = '5';
    detectedFieldsCount++;
  }

  // 7. Parse Odometer KM
  const odoMatch = text.match(/(?:odometer|km|reading|chali hai|chali)\s*(?:hai)?\s*([0-9]{3,6})/);
  if (odoMatch && odoMatch[1]) {
    result.odometer = odoMatch[1];
    detectedFieldsCount++;
  }

  // 8. Parse Fastag Balance
  const fastagMatch = text.match(/(?:fastag|fast tag|toll)\s*(?:balance)?\s*(?:me|mai)?\s*([0-9]{3,5})/);
  if (fastagMatch && fastagMatch[1]) {
    result.fastagBalance = fastagMatch[1];
    detectedFieldsCount++;
  }

  // 9. Parse Status
  if (text.includes('running') || text.includes('chalu') || text.includes('on duty')) {
    result.status = 'Running';
    detectedFieldsCount++;
  } else if (text.includes('idle') || text.includes('khadi') || text.includes('free')) {
    result.status = 'Idle';
    detectedFieldsCount++;
  } else if (text.includes('maintenance') || text.includes('service') || text.includes('garage') || text.includes('kharab')) {
    result.status = 'Maintenance';
    detectedFieldsCount++;
  }

  return { parsed: result, detectedFieldsCount };
}
