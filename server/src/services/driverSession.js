import { Agency } from '../models/Agency.js';
import { Driver } from '../models/Driver.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { Vehicle } from '../models/Vehicle.js';
import { generateAccessToken, generateRefreshToken } from '../middleware/authMiddleware.js';
import { parseDeviceInfo } from '../utils/deviceParser.js';

function initialsFromName(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

function formatLicenceDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function plateKey(value = '') {
  return String(value).replace(/[\s-]/g, '').toUpperCase();
}

export async function findAssignedVehicle(driver) {
  if (!driver) return null;
  const assigned = driver.assignedVehicle;

  // 1. Check if driver has an explicit assignedVehicle string
  if (assigned && assigned !== '—' && String(assigned).trim() !== '') {
    const exact = await Vehicle.findOne({
      $or: [{ registrationNumber: assigned }, { registrationNumber: plateKey(assigned) }]
    });
    if (exact) return exact;

    const vehicles = await Vehicle.find({});
    const found = vehicles.find((item) => plateKey(item.registrationNumber) === plateKey(assigned));
    if (found) return found;
  }

  // 2. Also check if any vehicle has this driver assigned in vehicle.assignedDriver
  const driverQueries = [];
  if (driver.name) driverQueries.push({ assignedDriver: driver.name });
  if (driver.code) driverQueries.push({ assignedDriver: driver.code });
  if (driver._id) driverQueries.push({ assignedDriver: driver._id.toString() });

  if (driverQueries.length > 0) {
    const byDriver = await Vehicle.findOne({ $or: driverQueries });
    if (byDriver) {
      // Sync back to driver record if needed
      if (!driver.assignedVehicle || driver.assignedVehicle === '—') {
        await Driver.findByIdAndUpdate(driver._id, { assignedVehicle: byDriver.registrationNumber }).catch(() => {});
        driver.assignedVehicle = byDriver.registrationNumber;
      }
      return byDriver;
    }
  }

  return null;
}

export async function serializeDriverAuth(driver) {
  const [vehicle, agency] = await Promise.all([
    findAssignedVehicle(driver),
    driver.agencyId ? Agency.findById(driver.agencyId) : null
  ]);

  return {
    driver: {
      id: driver._id.toString(),
      code: driver.code || `DRV-${driver._id.toString().slice(-4).toUpperCase()}`,
      name: driver.name,
      email: driver.email || null,
      mobile: driver.phone || '',
      licence: driver.licenseNumber || '—',
      licenceValid: formatLicenceDate(driver.licenseExpiry),
      initials: initialsFromName(driver.name),
      agency: agency?.name || 'KABPRO',
      photo: driver.photo || null,
      onDuty: driver.status === 'On duty',
      odometer: vehicle?.odometer || 0,
      todayKm: 0
    },
    vehicle: vehicle
      ? {
          id: vehicle._id.toString(),
          reg: vehicle.registrationNumber,
          type: vehicle.type,
          model: vehicle.model || '—',
          departmentName: vehicle.departmentName || '',
          fuelType: vehicle.fuelType || 'Diesel',
          odometer: vehicle.odometer || 0
        }
      : null,
    trip: null
  };
}

export async function issueDriverSession(driver, req, rememberMe = true) {
  const device = parseDeviceInfo(req);
  const { rawToken, tokenHash, expiresAt } = generateRefreshToken(Boolean(rememberMe));

  const session = await RefreshToken.create({
    driverId: driver._id,
    kind: 'driver',
    tokenHash,
    device,
    rememberMe: Boolean(rememberMe),
    expiresAt,
    lastActiveAt: new Date()
  });

  await Driver.findByIdAndUpdate(driver._id, { lastLoginAt: new Date() });

  const accessToken = generateAccessToken(driver._id, session._id, 'driver');
  const profile = await serializeDriverAuth(driver);

  return {
    success: true,
    token: accessToken,
    accessToken,
    refreshToken: rawToken,
    session: {
      id: session._id.toString(),
      device: session.device,
      rememberMe: session.rememberMe,
      expiresAt: session.expiresAt
    },
    ...profile
  };
}

export function digitsOnly(value = '') {
  return String(value).replace(/\D/g, '');
}

export async function findDriverByIdentifier(identifier) {
  const raw = String(identifier || '').trim();
  if (!raw) return null;

  const emailLike = raw.toLowerCase();
  const phone = digitsOnly(raw);
  const code = raw.toUpperCase();

  const or = [{ code }, { email: emailLike }];
  if (phone.length >= 8) {
    // Exact stored value & full digit-string suffix match
    or.push({ phone: raw }, { phone: { $regex: `${phone}$` } });

    // Cross-match: login with +91XXXXXXXXXX should find stored 10-digit number
    // and vice versa (stored +91XXXXXXXXXX should find login with raw 10-digit)
    const last10 = phone.slice(-10);
    if (last10.length === 10 && last10 !== phone) {
      // e.g. login sends +919682578167 → also try regex ending in 9682578167
      or.push({ phone: { $regex: `${last10}$` } });
    }
    if (phone.length === 10) {
      // e.g. stored as +919682578167, login sends 9682578167 → already handled by suffix regex above
      // Also try with common Indian prefix
      or.push({ phone: `+91${phone}` }, { phone: `91${phone}` });
    }
  }

  return Driver.findOne({ $or: or }).select('+password');
}
