/**
 * Universal voice parsing engine for all forms across FleetOS
 * Supports Hindi, English, and Hinglish dictation
 */

// Helper to extract numbers from spoken words (e.g., "four thousand five hundred", "pachas hazar")
export function parseSpokenNumber(text: string): number | null {
  const directMatch = text.match(/\b\d+(\.\d+)?\b/);
  if (directMatch) {
    return parseFloat(directMatch[0]);
  }

  // Handle words like "lakh", "hazar", "k"
  const clean = text.toLowerCase();
  const hazarMatch = clean.match(/(\d+)\s*(hazar|thousand|k)\b/);
  if (hazarMatch) {
    return parseFloat(hazarMatch[1]) * 1000;
  }
  const lakhMatch = clean.match(/(\d+)\s*lakh\b/);
  if (lakhMatch) {
    return parseFloat(lakhMatch[1]) * 100000;
  }

  return null;
}

// Helper to find a matching item from an array (names, vehicles, etc.)
export function findBestMatch(text: string, options: string[]): string | undefined {
  const cleanText = text.toLowerCase();
  for (const opt of options) {
    const optLower = opt.toLowerCase();
    if (cleanText.includes(optLower)) return opt;
    // Match first name or registration prefix
    const firstWord = optLower.split(/[\s-]/)[0];
    if (firstWord.length > 3 && cleanText.includes(firstWord)) return opt;
  }
  return undefined;
}

// Helper to extract standard Indian phone numbers (10 digits)
export function parsePhoneNumber(text: string): string | undefined {
  // Look for 10 consecutive digits or spaced digits
  const digitClean = text.replace(/[^\d]/g, '');
  if (digitClean.length >= 10) {
    // Return last 10 digits
    const last10 = digitClean.slice(-10);
    return `+91 ${last10.slice(0, 5)} ${last10.slice(5)}`;
  }
  return undefined;
}

// Helper to extract Indian vehicle registration number (e.g. DL 01 AB 1234, HR 26 DQ 5555)
export function parseVehicleReg(text: string, knownVehicles: string[] = []): string | undefined {
  // First check against known vehicles
  for (const v of knownVehicles) {
    const vClean = v.toLowerCase().replace(/\s+/g, '');
    const textClean = text.toLowerCase().replace(/\s+/g, '');
    if (textClean.includes(vClean)) return v;
  }

  // Standard regex
  const regRegex = /\b([a-z]{2})\s*([0-9]{1,2})\s*([a-z]{0,3})\s*([0-9]{4})\b/i;
  const match = text.match(regRegex);
  if (match) {
    return `${match[1]}${match[2].padStart(2, '0')}${match[3]}${match[4]}`.toUpperCase();
  }
  return undefined;
}

// -------------------------------------------------------------
// Form-specific Parsers
// -------------------------------------------------------------

export interface VoiceParsingContext {
  vehicles?: string[];
  drivers?: string[];
  departments?: string[];
}

/**
 * 1. DRIVER FORM PARSER
 */
export function parseDriverVoiceInput(text: string, ctx: VoiceParsingContext = {}) {
  const result: Record<string, any> = {};
  const lower = text.toLowerCase();
  let count = 0;

  // Name: "naam Rajesh Sharma", "driver name Mukesh", "driver Ramesh Kumar"
  const nameMatch = text.match(/(?:driver\s*name|naam|driver|name)\s*(?:is|hai|:)?\s*([a-zA-Z\s]{2,25})(?=\s*(?:phone|mobile|number|type|gadi|vehicle|status|license|$))/i);
  if (nameMatch && nameMatch[1]) {
    const cleanName = nameMatch[1].trim().replace(/\b(ka|ki|ke|hai|ko)\b/gi, '').trim();
    if (cleanName.length >= 3 && !['full time', 'part time', 'contract', 'on duty', 'off duty'].includes(cleanName.toLowerCase())) {
      result.name = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
      count++;
    }
  }

  // Phone
  const phone = parsePhoneNumber(text);
  if (phone) {
    result.phone = phone;
    count++;
  }

  // Driver Type: Full Time, Part Time, Contract, Owner Driver
  if (lower.includes('full time') || lower.includes('permanent')) {
    result.driverType = 'Full Time';
    count++;
  } else if (lower.includes('part time')) {
    result.driverType = 'Part Time';
    count++;
  } else if (lower.includes('contract') || lower.includes('theka')) {
    result.driverType = 'Contract';
    count++;
  } else if (lower.includes('owner') || lower.includes('khud ki gadi')) {
    result.driverType = 'Owner Driver';
    count++;
  }

  // Status: On duty / Off duty
  if (lower.includes('off duty') || lower.includes('chhutti') || lower.includes('leave')) {
    result.status = 'Off duty';
    count++;
  } else if (lower.includes('on duty') || lower.includes('duty pe') || lower.includes('active')) {
    result.status = 'On duty';
    count++;
  }

  // Vehicle
  const v = parseVehicleReg(text, ctx.vehicles || []);
  if (v) {
    result.assignedVehicle = v;
    count++;
  }

  // License Number: e.g. "license DL-04..."
  const licMatch = text.match(/(?:license|licence|dl)\s*(?:number|no)?\s*([a-z0-9\-]{8,18})/i);
  if (licMatch && licMatch[1]) {
    result.licenseNumber = licMatch[1].toUpperCase().replace(/\s+/g, '');
    count++;
  }

  // Address
  const addrMatch = text.match(/(?:address|pata|rehta hai)\s*(?:is|hai|:)?\s*([a-zA-Z0-9\s,]{4,40})/i);
  if (addrMatch && addrMatch[1]) {
    result.address = addrMatch[1].trim();
    count++;
  }

  return { data: result, count };
}

/**
 * 2. VEHICLE FORM PARSER
 */
export function parseVehicleVoiceInput(text: string, ctx: VoiceParsingContext = {}) {
  const result: Record<string, any> = {};
  const lower = text.toLowerCase();
  let count = 0;

  // Reg
  const reg = parseVehicleReg(text, ctx.vehicles || []);
  if (reg) {
    result.registrationNumber = reg;
    count++;
  }

  // Model
  const models = [
    'Toyota Innova Crysta', 'Toyota Innova', 'Maruti Suzuki Dzire', 'Swift Dzire',
    'Maruti Suzuki Ertiga', 'Ertiga', 'Mahindra Scorpio', 'Mahindra Bolero',
    'Tata Nexon EV', 'Tata Nexon', 'Kia Carens', 'Maruti WagonR', 'Honda Amaze', 'Tempo Traveller'
  ];
  for (const m of models) {
    if (lower.includes(m.toLowerCase())) {
      result.model = m;
      count++;
      break;
    }
  }

  // Fuel
  if (lower.includes('diesel') || lower.includes('dijel')) {
    result.fuelType = 'Diesel';
    count++;
  } else if (lower.includes('cng') || lower.includes('gas')) {
    result.fuelType = 'CNG';
    count++;
  } else if (lower.includes('petrol')) {
    result.fuelType = 'Petrol';
    count++;
  } else if (lower.includes('electric') || lower.includes('ev')) {
    result.fuelType = 'Electric';
    count++;
  }

  // Type & Dept
  if (lower.includes('department') || lower.includes('sarkari') || lower.includes('pwd') || lower.includes('jal nigam')) {
    result.type = 'Department';
    count++;
    if (lower.includes('pwd') || lower.includes('public works')) result.departmentName = 'Public Works Department (PWD)';
    else if (lower.includes('jal nigam') || lower.includes('water')) result.departmentName = 'Delhi Jal Nigam (DJN)';
  } else if (lower.includes('trip') || lower.includes('tour') || lower.includes('outstation')) {
    result.type = 'Trip-based';
    count++;
  }

  // Driver
  if (ctx.drivers) {
    const drv = findBestMatch(text, ctx.drivers);
    if (drv) {
      result.assignedDriver = drv;
      count++;
    }
  }

  // Odometer
  const odoMatch = text.match(/(?:odometer|meter|km|reading)\s*(?:is|hai|:)?\s*(\d+)/i);
  if (odoMatch) {
    result.odometer = odoMatch[1];
    count++;
  }

  // 5 Document Expiries (RC, Insurance, Pollution, Permit, Auth)
  const parseDateAfter = (keyword: string): string | null => {
    const idx = lower.indexOf(keyword);
    if (idx === -1) return null;
    const sub = lower.slice(idx + keyword.length, idx + keyword.length + 40);
    const isoMatch = sub.match(/(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/);
    if (isoMatch) return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
    const dmyMatch = sub.match(/(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})/);
    if (dmyMatch) return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
    const yrMatch = sub.match(/\b(202[4-9]|203[0-9])\b/);
    if (yrMatch) return `${yrMatch[1]}-12-31`;
    return null;
  };

  const rcDate = parseDateAfter('rc');
  if (rcDate) { result.rcExpiry = rcDate; count++; }
  const insDate = parseDateAfter('insurance') || parseDateAfter('bima');
  if (insDate) { result.insuranceExpiry = insDate; count++; }
  const polDate = parseDateAfter('pollution') || parseDateAfter('puc');
  if (polDate) { result.pollutionExpiry = polDate; count++; }
  const perDate = parseDateAfter('permit');
  if (perDate) { result.permitExpiry = perDate; count++; }
  const authDate = parseDateAfter('auth') || parseDateAfter('authorization');
  if (authDate) { result.authExpiry = authDate; count++; }

  return { data: result, count };
}

/**
 * 3. TRIP FORM PARSER
 */
export function parseTripVoiceInput(text: string, ctx: VoiceParsingContext = {}) {
  const result: Record<string, any> = {};
  const lower = text.toLowerCase();
  let count = 0;

  // Customer Name
  const custMatch = text.match(/(?:customer|client|sawari|passenger|name)\s*(?:is|hai|:)?\s*([a-zA-Z\s]{3,25})(?=\s*(?:phone|route|fare|advance|gadi|$))/i);
  if (custMatch && custMatch[1]) {
    result.customerName = custMatch[1].trim();
    count++;
  }

  // Route: "route Delhi to Jaipur", "Delhi se Agra"
  const routeMatch = text.match(/(?:route|destination|kahan|se)\s*(?:to|se)?\s*([a-zA-Z\s]+(?:to|se|-)\s*[a-zA-Z\s]+)/i);
  if (routeMatch && routeMatch[1]) {
    result.route = routeMatch[1].trim();
    count++;
  }

  // Fare / Price
  const fareMatch = text.match(/(?:fare|price|amount|kiraya|total)\s*(?:is|hai|:)?\s*(\d+(?:\s*(?:hazar|thousand|k))?)/i);
  if (fareMatch) {
    const num = parseSpokenNumber(fareMatch[1]);
    if (num) {
      result.revenue = num.toString();
      count++;
    }
  }

  // Advance
  const advMatch = text.match(/(?:advance|peshgi)\s*(?:is|hai|:)?\s*(\d+(?:\s*(?:hazar|thousand|k))?)/i);
  if (advMatch) {
    const num = parseSpokenNumber(advMatch[1]);
    if (num) {
      result.advancePayment = num.toString();
      count++;
    }
  }

  // Vehicle
  const v = parseVehicleReg(text, ctx.vehicles || []);
  if (v) {
    result.vehicle = v;
    count++;
  }

  // Driver
  if (ctx.drivers) {
    const drv = findBestMatch(text, ctx.drivers);
    if (drv) {
      result.driverName = drv;
      count++;
    }
  }

  return { data: result, count };
}

/**
 * 4. ATTENDANCE FORM PARSER
 */
export function parseAttendanceVoiceInput(text: string, ctx: VoiceParsingContext = {}) {
  const result: Record<string, any> = {};
  const lower = text.toLowerCase();
  let count = 0;

  // Driver
  if (ctx.drivers) {
    const drv = findBestMatch(text, ctx.drivers);
    if (drv) {
      result.driverName = drv;
      count++;
    }
  }

  // Status
  if (lower.includes('present') || lower.includes('aaya') || lower.includes('hazir')) {
    result.status = 'Present';
    count++;
  } else if (lower.includes('late') || lower.includes('deri')) {
    result.status = 'Late';
    count++;
  } else if (lower.includes('absent') || lower.includes('nahi aaya') || lower.includes('gayab')) {
    result.status = 'Absent';
    count++;
  } else if (lower.includes('trip') || lower.includes('outstation')) {
    result.status = 'On Trip';
    count++;
  } else if (lower.includes('leave') || lower.includes('chhutti')) {
    result.status = 'On Leave';
    count++;
  }

  // Duty Type
  if (lower.includes('department duty') || lower.includes('sarkari')) {
    result.dutyType = 'Department Duty';
    count++;
  } else if (lower.includes('trip duty') || lower.includes('outstation')) {
    result.dutyType = 'Trip Duty';
    count++;
  } else if (lower.includes('standby')) {
    result.dutyType = 'Standby';
    count++;
  }

  // Vehicle
  const v = parseVehicleReg(text, ctx.vehicles || []);
  if (v) {
    result.assignedVehicle = v;
    count++;
  }

  return { data: result, count };
}

/**
 * 5. EXPENSE & FUEL LOG PARSER
 */
export function parseExpenseVoiceInput(text: string, ctx: VoiceParsingContext = {}) {
  const result: Record<string, any> = {};
  const lower = text.toLowerCase();
  let count = 0;

  // Amount
  const amtMatch = text.match(/(?:amount|kharcha|rupees|rs|cost|paise|price)\s*(?:is|hai|:)?\s*(\d+(?:\s*(?:hazar|thousand|k))?)/i);
  if (amtMatch) {
    const num = parseSpokenNumber(amtMatch[1]);
    if (num) {
      result.amount = num.toString();
      result.totalCost = num.toString();
      count++;
    }
  } else {
    const num = parseSpokenNumber(text);
    if (num && num > 20) {
      result.amount = num.toString();
      count++;
    }
  }

  // Litres (for fuel)
  const litreMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:litre|liter|ltr|l)\b/i);
  if (litreMatch) {
    result.litres = litreMatch[1];
    count++;
  }

  // Category
  if (lower.includes('fuel') || lower.includes('diesel') || lower.includes('petrol') || lower.includes('cng')) {
    result.category = 'Fuel';
    count++;
  } else if (lower.includes('toll') || lower.includes('fastag')) {
    result.category = 'FASTag / Toll';
    count++;
  } else if (lower.includes('driver') || lower.includes('bata') || lower.includes('khana')) {
    result.category = 'Driver';
    count++;
  } else if (lower.includes('maintenance') || lower.includes('service') || lower.includes('repair')) {
    result.category = 'Maintenance';
    count++;
  }

  // Vehicle
  const v = parseVehicleReg(text, ctx.vehicles || []);
  if (v) {
    result.vehicle = v;
    count++;
  }

  // Driver
  if (ctx.drivers) {
    const drv = findBestMatch(text, ctx.drivers);
    if (drv) {
      result.driverName = drv;
      count++;
    }
  }

  return { data: result, count };
}

/**
 * Universal Form Voice Router
 */
export function parseVoiceForForm(
  formType: 'driver' | 'vehicle' | 'trip' | 'attendance' | 'expense' | 'dutyLog' | 'contract' | 'general',
  text: string,
  ctx: VoiceParsingContext = {}
): { data: Record<string, any>; count: number } {
  switch (formType) {
    case 'driver':
      return parseDriverVoiceInput(text, ctx);
    case 'vehicle':
      return parseVehicleVoiceInput(text, ctx);
    case 'trip':
      return parseTripVoiceInput(text, ctx);
    case 'attendance':
      return parseAttendanceVoiceInput(text, ctx);
    case 'expense':
      return parseExpenseVoiceInput(text, ctx);
    default:
      // General multi-parser
      const dRes = parseDriverVoiceInput(text, ctx);
      const vRes = parseVehicleVoiceInput(text, ctx);
      const eRes = parseExpenseVoiceInput(text, ctx);
      const combined = { ...dRes.data, ...vRes.data, ...eRes.data };

      // Check GST percent
      const gstMatch = text.match(/(?:gst|tax)\s*(?:@|rate|percent|percentage|is|hai|:)?\s*(\d+(?:\.\d+)?)\s*%?/i)
        || text.match(/(\d+(?:\.\d+)?)\s*%?\s*(?:percent)?\s*(?:gst|tax)/i);
      if (gstMatch && gstMatch[1]) {
        combined.gstRate = gstMatch[1];
      }

      return { data: combined, count: Object.keys(combined).length };
  }
}
