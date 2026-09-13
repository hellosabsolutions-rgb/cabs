import { Agency } from '../models/Agency.js';
import { Booking } from '../models/Booking.js';
import { DailyDutyLog } from '../models/DailyDutyLog.js';
import { Driver } from '../models/Driver.js';
import { DriverAdvance } from '../models/DriverAdvance.js';
import { DriverExpense } from '../models/DriverExpense.js';
import { FuelLog } from '../models/FuelLog.js';
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

function istTodayDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(now);
}

async function computeDriverWallet(driver) {
  const driverId = driver._id.toString();
  const driverName = driver.name || '';
  const agencyFilter = driver.agencyId ? { agencyId: driver.agencyId } : {};
  const ownerFilter = {
    $or: [{ driverId }, { driverName }],
    ...agencyFilter
  };

  const [advances, expenses, fuels] = await Promise.all([
    DriverAdvance.find({ ...ownerFilter, status: 'ACTIVE' }).lean(),
    DriverExpense.find({ ...ownerFilter, status: { $in: ['Approved', 'Paid'] } }).lean(),
    FuelLog.find({ driverName, ...agencyFilter }).lean()
  ]);

  const opening = advances.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  const spent =
    expenses.reduce((sum, row) => sum + (Number(row.amount) || 0), 0) +
    fuels.reduce((sum, row) => sum + (Number(row.totalCost) || 0), 0);

  return {
    opening,
    spent,
    remaining: opening - spent
  };
}

async function computeTodayKm(driver, vehicle) {
  const todayDate = istTodayDate();
  const driverName = driver.name || '';
  const vehicleReg = vehicle?.registrationNumber;

  const logFilter = {
    date: todayDate,
    ...(driver.agencyId ? { agencyId: driver.agencyId } : {}),
    $or: [{ driverName }, ...(vehicleReg ? [{ vehicle: vehicleReg }] : [])]
  };

  const logs = await DailyDutyLog.find(logFilter).lean();
  let todayKm = logs.reduce((sum, log) => sum + (Number(log.totalKm) || 0), 0);

  const openLog = logs.find(
    (log) => log.status === 'Pending' && (!log.endTime || log.endTime === '—')
  );
  if (openLog?.startKm && vehicle?.odometer && vehicle.odometer > openLog.startKm) {
    todayKm = Math.max(todayKm, vehicle.odometer - openLog.startKm);
  }

  return todayKm;
}

async function findActiveTrip(driver) {
  const driverName = driver.name?.trim();
  if (!driverName) return null;

  const tripFilter = {
    $and: [
      {
        $or: [
          { driverName: new RegExp(`^${driverName}$`, 'i') },
          { driverId: driver._id }
        ]
      },
      { status: { $in: ['Scheduled', 'Ongoing'] } },
      { driverName: { $nin: ['Unassigned', 'None', '—', '', null] } }
    ]
  };
  if (driver.agencyId) {
    tripFilter.$and.push({ agencyId: driver.agencyId });
  }

  const booking = await Booking.findOne(tripFilter).sort({ startDate: 1 }).lean();
  if (!booking) return null;

  return {
    id: booking.bookingNumber || booking.tripNumber || booking._id.toString(),
    status: booking.status
  };
}

export async function serializeDriverAuth(driver) {
  const [vehicle, agency, wallet, trip] = await Promise.all([
    findAssignedVehicle(driver),
    driver.agencyId ? Agency.findById(driver.agencyId) : null,
    computeDriverWallet(driver),
    findActiveTrip(driver)
  ]);
  const todayKm = await computeTodayKm(driver, vehicle);
  const vehicleOdometer = vehicle?.odometer || 0;

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
      odometer: vehicleOdometer,
      todayKm
    },
    vehicle: vehicle
      ? {
          id: vehicle._id.toString(),
          reg: vehicle.registrationNumber,
          type: vehicle.type || vehicle.vehicleType || 'Commercial',
          model: vehicle.model || vehicle.make || '—',
          departmentName: vehicle.departmentName || '',
          fuelType: vehicle.fuelType || 'Diesel',
          odometer: vehicleOdometer
        }
      : null,
    trip,
    wallet
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
