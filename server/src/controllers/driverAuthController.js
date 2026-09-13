import { Driver } from '../models/Driver.js';
import { Vehicle } from '../models/Vehicle.js';
import { DriverAttendance } from '../models/DriverAttendance.js';
import { DailyDutyLog } from '../models/DailyDutyLog.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { verifyGoogleIdentity } from '../services/googleAuth.js';
import { emitToDriver, broadcastAll } from '../services/socketService.js';
import {
  findAssignedVehicle,
  findDriverByIdentifier,
  issueDriverSession,
  serializeDriverAuth
} from '../services/driverSession.js';

function nextDriverCode() {
  return `DRV-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function serializeDoc(doc) {
  if (!doc) return null;
  const json = typeof doc.toJSON === 'function' ? doc.toJSON() : { ...(doc.toObject?.() || doc) };
  json.id = json.id || json._id?.toString();
  return json;
}

function hoursBetween(startStr, endStr) {
  if (!startStr || !endStr || startStr === '—' || endStr === '—') return 0;
  try {
    const parseTime = (tStr) => {
      const [time, modifier] = tStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      return hours + minutes / 60;
    };
    const startH = parseTime(startStr);
    const endH = parseTime(endStr);
    const diff = endH >= startH ? endH - startH : (24 - startH) + endH;
    return Number(diff.toFixed(1));
  } catch {
    return 0;
  }
}

function istTodayDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(now);
}

function monthNameIst(now = new Date()) {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthIndex = Number(
    new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', month: 'numeric' }).format(now)
  ) - 1;
  return monthNames[monthIndex] || monthNames[now.getMonth()];
}

async function upsertOpenDutyLog({ driver, vehicle, odoNumber, istTime, todayDate, photoUrl, locationAddress }) {
  const vehicleReg = vehicle?.registrationNumber || driver.assignedVehicle || 'Fleet';
  const existing = await DailyDutyLog.findOne({
    driverName: driver.name || 'Driver',
    vehicle: vehicleReg,
    date: todayDate,
    dutyType: 'Official Department Duty',
    status: 'Pending'
  }).sort({ createdAt: -1 });

  if (existing) {
    existing.startKm = odoNumber;
    existing.endKm = odoNumber;
    existing.totalKm = 0;
    existing.startTime = istTime;
    existing.endTime = '—';
    existing.totalHours = 0;
    if (photoUrl) existing.dutySlipPhoto = photoUrl;
    if (locationAddress) existing.journeyFrom = locationAddress;
    await existing.save();
    return { log: existing, created: false };
  }

  const log = await DailyDutyLog.create({
    dutySlipNumber: `SLIP-${Date.now().toString().slice(-6)}`,
    logBookPageNo: String(Math.floor(100 + Math.random() * 900)),
    month: monthNameIst(),
    date: todayDate,
    departmentName: vehicle?.departmentName || 'General Operations',
    vehicle: vehicleReg,
    driverName: driver.name || 'Driver',
    dutyType: 'Official Department Duty',
    startKm: odoNumber,
    endKm: odoNumber,
    totalKm: 0,
    startTime: istTime,
    endTime: '—',
    totalHours: 0,
    dutySlipPhoto: photoUrl || null,
    journeyFrom: locationAddress || '',
    notes: 'On duty',
    status: 'Pending',
    officerSignatureStatus: 'Pending',
    driverSignatureStatus: 'Pending'
  });

  return { log, created: true };
}

/**
 * @desc    Driver password login (mobile, email, or driver code)
 * @route   POST /api/auth/driver/login
 * @access  Public
 */
export const driverLogin = asyncHandler(async (req, res) => {
  const { identifier, email, password, rememberMe } = req.body;
  console.log(req.body)
  const loginId = identifier || email;

  if (!loginId || !password) {
    return res.status(400).json({
      success: false,
      error: 'Please provide your mobile number or email, and password.'
    });
  }

  // Step 1: Check if driver exists at all
  const driver = await findDriverByIdentifier(loginId);
  if (!driver) {
    return res.status(401).json({
      success: false,
      error: 'No driver account found. Please contact your agency or fleet manager to get your login credentials.',
      code: 'DRIVER_NOT_REGISTERED'
    });
  }

  // Step 2: Validate password
  const passwordMatch = await driver.matchPassword(password);
  if (!passwordMatch) {
    return res.status(401).json({
      success: false,
      error: 'Incorrect password. Please use the credentials shared by your agency.',
      code: 'INVALID_PASSWORD'
    });
  }

  const payload = await issueDriverSession(driver, req, rememberMe !== false);
  res.status(200).json(payload);
});

/**
 * @desc    Driver Google Sign-In — verifies ID / access token then issues app JWTs
 * @route   POST /api/auth/driver/google
 * @access  Public
 */
export const driverGoogleLogin = asyncHandler(async (req, res) => {
  const { idToken, accessToken, rememberMe } = req.body;

  let googleUser;
  try {
    googleUser = await verifyGoogleIdentity({ idToken, accessToken });
  } catch (err) {
    const status = err.statusCode || 401;
    return res.status(status).json({
      success: false,
      error: err.message || 'Google sign-in could not be verified.'
    });
  }

  let driver = await Driver.findOne({
    $or: [{ googleId: googleUser.sub }, { email: googleUser.email }]
  }).select('+password');

  if (!driver) {
    driver = await Driver.create({
      name: googleUser.name,
      email: googleUser.email,
      googleId: googleUser.sub,
      photo: googleUser.picture,
      code: nextDriverCode(),
      status: 'Off duty',
      assignedVehicle: '—'
    });
  } else {
    driver.googleId = googleUser.sub;
    driver.email = driver.email || googleUser.email;
    if (googleUser.picture) driver.photo = googleUser.picture;
    await driver.save();
  }

  const payload = await issueDriverSession(driver, req, rememberMe !== false);
  res.status(200).json(payload);
});

/**
 * @desc    Current driver profile
 * @route   GET /api/auth/driver/me
 * @access  Private (driver)
 */
export const getDriverMe = asyncHandler(async (req, res) => {
  const profile = await serializeDriverAuth(req.driver);
  res.status(200).json({
    success: true,
    ...profile
  });
});

/**
 * @desc    Start driver duty
 * @route   POST /api/auth/driver/duty/start
 * @access  Private (driver)
 */
export const startDriverDuty = asyncHandler(async (req, res) => {
  const driver = req.driver;
  const vehicle = await findAssignedVehicle(driver);

  if (!vehicle) {
    return res.status(400).json({
      success: false,
      error: 'Cannot start duty: No vehicle is assigned to your driver profile in the backend. Please contact your fleet manager or administrator.'
    });
  }

  const { startOdometer, photoUrl, location } = req.body;
  const odoNumber = Number(startOdometer) || vehicle.odometer || 0;

  // Check last known odo
  if (vehicle.odometer && odoNumber < vehicle.odometer) {
    return res.status(400).json({
      success: false,
      error: `Starting odometer (${odoNumber} km) cannot be less than vehicle last recorded odometer (${vehicle.odometer} km).`
    });
  }

  const now = new Date();
  const istFormatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
  const istFormatted = istFormatter.format(now);
  const istTime = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(now);
  const todayDate = istTodayDate(now);

  // Parse and normalize location payload
  let locationData = null;
  let locationAddress = null;
  let latitude = null;
  let longitude = null;

  if (location) {
    if (typeof location === 'string') {
      locationAddress = location.trim();
      locationData = { address: locationAddress, latitude: null, longitude: null };
    } else if (typeof location === 'object') {
      latitude = Number(location.latitude) || null;
      longitude = Number(location.longitude) || null;
      locationAddress = location.address?.trim() || (latitude && longitude ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` : null);
      locationData = {
        latitude,
        longitude,
        address: locationAddress,
        accuracy: location.accuracy || null,
        timestamp: location.timestamp || now.getTime()
      };
    }
  }

  // Update driver status and live duty location
  const driverUpdateFields = {
    status: 'On duty',
    assignedVehicle: vehicle.registrationNumber
  };
  if (locationAddress || latitude || longitude) {
    driverUpdateFields.dutyStartLocation = {
      latitude,
      longitude,
      address: locationAddress,
      time: istFormatted
    };
    driverUpdateFields.currentLocation = {
      latitude,
      longitude,
      address: locationAddress,
      updatedAt: now
    };
  }
  await Driver.findByIdAndUpdate(driver._id, driverUpdateFields);

  // Update vehicle status and location
  const vehicleUpdateFields = {
    status: 'Running',
    odometer: Math.max(vehicle.odometer || 0, odoNumber)
  };
  if (locationAddress) {
    vehicleUpdateFields.currentLocation = locationAddress;
  }
  await Vehicle.findByIdAndUpdate(vehicle._id, vehicleUpdateFields);

  // Auto-record / update attendance for today as Present with check-in location
  let attendanceDoc = null;
  try {
    const attendanceSetFields = {
      status: 'Present',
      checkIn: istTime,
      checkOut: '—',
      workingHours: 0,
      assignedVehicle: vehicle.registrationNumber
    };
    if (locationAddress) {
      attendanceSetFields.location = locationAddress;
    }
    if (latitude && longitude) {
      attendanceSetFields.coordinates = { latitude, longitude };
    }

    attendanceDoc = await DriverAttendance.findOneAndUpdate(
      { driverId: driver._id.toString(), date: todayDate },
      {
        $setOnInsert: {
          driverId: driver._id.toString(),
          driverName: driver.name,
          date: todayDate,
          dutyType: 'Department Duty'
        },
        $set: attendanceSetFields
      },
      { upsert: true, new: true }
    );
  } catch (attErr) {
    console.warn('Could not auto-log attendance on start duty:', attErr.message);
  }

  let dutyLogDoc = null;
  let dutyLogCreated = false;
  try {
    const result = await upsertOpenDutyLog({
      driver,
      vehicle,
      odoNumber,
      istTime,
      todayDate,
      photoUrl,
      locationAddress
    });
    dutyLogDoc = result.log;
    dutyLogCreated = result.created;
  } catch (logErr) {
    console.warn('Could not auto-create DailyDutyLog on start duty:', logErr.message);
  }

  const attendancePayload = serializeDoc(attendanceDoc);
  const dutyLogPayload = serializeDoc(dutyLogDoc);

  // Socket emissions for real-time dashboard and mobile sync
  try {
    const dutyPayload = {
      driverId: driver._id.toString(),
      driverName: driver.name,
      vehicle: vehicle.registrationNumber,
      status: 'On duty',
      startedAt: istFormatted,
      startOdometer: odoNumber,
      location: locationData,
      action: 'check-in',
      log: dutyLogPayload,
      attendance: attendancePayload
    };

    emitToDriver(driver._id, 'driver:status', { onDuty: true, status: 'On duty', vehicle: vehicle.registrationNumber, location: locationData });
    emitToDriver(driver._id, 'driver:updated', { id: driver._id.toString(), status: 'On duty', location: locationData, dutyStartLocation: driverUpdateFields.dutyStartLocation });
    emitToDriver(driver._id, 'duty:updated', { action: 'check-in', log: dutyLogPayload, attendance: attendancePayload });
    broadcastAll('driver:duty_started', dutyPayload);
    broadcastAll('driver:any_change', { driverId: driver._id.toString(), status: 'On duty', location: locationData, action: 'check-in' });
    broadcastAll('vehicle:updated', { vehicleId: vehicle._id.toString(), status: 'Running', odometer: odoNumber, location: locationAddress });
    if (attendancePayload) {
      broadcastAll('attendance:updated', { action: 'check-in', record: attendancePayload });
    }
    if (dutyLogPayload) {
      broadcastAll(dutyLogCreated ? 'duty-log:created' : 'duty-log:updated', {
        action: 'check-in',
        log: dutyLogPayload
      });
    }
  } catch (sockErr) {
    console.warn('Socket emission warning on startDuty:', sockErr.message);
  }

  res.status(200).json({
    success: true,
    message: 'Duty started successfully.',
    startedAt: istFormatted,
    timestamp: now.getTime(),
    location: locationData,
    vehicle: {
      id: vehicle._id.toString(),
      reg: vehicle.registrationNumber,
      type: vehicle.type,
      model: vehicle.model || '—',
      odometer: odoNumber
    }
  });
});

/**
 * @desc    End driver duty
 * @route   POST /api/auth/driver/duty/end
 * @access  Private (driver)
 */
export const endDriverDuty = asyncHandler(async (req, res) => {
  const driver = req.driver;
  let vehicle = await findAssignedVehicle(driver);
  if (!vehicle && driver.assignedVehicle && driver.assignedVehicle !== '—') {
    vehicle = await Vehicle.findOne({ registrationNumber: driver.assignedVehicle });
  }

  const { endOdometer, remarks, photoUrl, location } = req.body;
  const odoNumber = Number(endOdometer);

  if (isNaN(odoNumber) || odoNumber <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Please provide a valid ending odometer reading.'
    });
  }

  const currentVehicleOdo = vehicle?.odometer || 0;
  if (currentVehicleOdo > 0 && odoNumber < currentVehicleOdo) {
    return res.status(400).json({
      success: false,
      error: `Ending odometer (${odoNumber} km) cannot be less than current odometer (${currentVehicleOdo} km).`
    });
  }

  const kmRun = Math.max(0, odoNumber - currentVehicleOdo);

  // Update driver status to Off duty
  await Driver.findByIdAndUpdate(driver._id, {
    status: 'Off duty'
  });

  // Update vehicle status & odometer if vehicle exists
  if (vehicle) {
    await Vehicle.findByIdAndUpdate(vehicle._id, {
      status: 'Active',
      odometer: Math.max(vehicle.odometer || 0, odoNumber)
    });
  }

  const now = new Date();
  const istFormatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
  const istFormatted = istFormatter.format(now);
  const istTime = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(now);
  const todayDate = istTodayDate(now);

  // Update attendance checkout time & working hours if record exists
  let attendanceDoc = null;
  try {
    const attRecord = await DriverAttendance.findOne({
      driverId: driver._id.toString(),
      date: todayDate
    });
    if (attRecord) {
      attRecord.checkOut = istTime;
      if (attRecord.checkIn) {
        attRecord.workingHours = hoursBetween(attRecord.checkIn, istTime);
      }
      if (remarks) {
        attRecord.notes = attRecord.notes ? `${attRecord.notes}; ${remarks}` : remarks;
      }
      await attRecord.save();
      attendanceDoc = attRecord;
    }
  } catch (attErr) {
    console.warn('Could not auto-update attendance on end duty:', attErr.message);
  }

  // Complete today's open duty slip, or create a finished one if check-in was missed
  let dutyLogDoc = null;
  let dutyLogCreated = false;
  try {
    const vehicleReg = vehicle ? vehicle.registrationNumber : (driver.assignedVehicle || 'Fleet');
    const startKm = currentVehicleOdo || odoNumber;
    const totalKm = Math.max(0, odoNumber - startKm);

    const openLog = await DailyDutyLog.findOne({
      driverName: driver.name || 'Driver',
      vehicle: vehicleReg,
      date: todayDate,
      dutyType: 'Official Department Duty',
      status: 'Pending'
    }).sort({ createdAt: -1 });

    if (openLog) {
      const resolvedStartKm = openLog.startKm || startKm;
      openLog.endKm = odoNumber;
      openLog.totalKm = Math.max(0, odoNumber - resolvedStartKm);
      openLog.endTime = istTime;
      openLog.totalHours = hoursBetween(openLog.startTime, istTime) || 10;
      openLog.dutySlipPhoto = photoUrl || openLog.dutySlipPhoto || null;
      openLog.notes = remarks || (openLog.notes === 'On duty' ? '' : (openLog.notes || ''));
      openLog.status = 'Approved';
      openLog.officerSignatureStatus = openLog.officerSignatureStatus === 'Pending' ? 'Pending' : openLog.officerSignatureStatus;
      openLog.driverSignatureStatus = 'Signed';
      await openLog.save();
      dutyLogDoc = openLog;
    } else {
      dutyLogDoc = await DailyDutyLog.create({
        dutySlipNumber: `SLIP-${Date.now().toString().slice(-6)}`,
        logBookPageNo: String(Math.floor(100 + Math.random() * 900)),
        month: monthNameIst(now),
        date: todayDate,
        departmentName: vehicle?.departmentName || 'General Operations',
        vehicle: vehicleReg,
        driverName: driver.name || 'Driver',
        dutyType: 'Official Department Duty',
        startKm,
        endKm: odoNumber,
        totalKm,
        startTime: attendanceDoc?.checkIn || '09:00 AM',
        endTime: istTime,
        totalHours: hoursBetween(attendanceDoc?.checkIn, istTime) || 10,
        dutySlipPhoto: photoUrl || null,
        notes: remarks || '',
        status: 'Approved'
      });
      dutyLogCreated = true;
    }
  } catch (logErr) {
    console.warn('Could not auto-create DailyDutyLog on end duty:', logErr.message);
  }

  const attendancePayload = serializeDoc(attendanceDoc);
  const dutyLogPayload = serializeDoc(dutyLogDoc);

  // Real-time socket broadcast
  try {
    emitToDriver(driver._id, 'driver:status', { onDuty: false, status: 'Off duty' });
    emitToDriver(driver._id, 'driver:updated', { id: driver._id.toString(), status: 'Off duty' });
    emitToDriver(driver._id, 'duty:updated', { action: 'check-out', log: dutyLogPayload, attendance: attendancePayload });
    broadcastAll('driver:duty_ended', {
      driverId: driver._id.toString(),
      driverName: driver.name,
      status: 'Off duty',
      endedAt: istFormatted,
      endOdometer: odoNumber,
      kmRun,
      action: 'check-out',
      log: dutyLogPayload,
      attendance: attendancePayload
    });
    broadcastAll('driver:any_change', { driverId: driver._id.toString(), status: 'Off duty', action: 'check-out' });
    if (vehicle) {
      broadcastAll('vehicle:updated', { vehicleId: vehicle._id.toString(), status: 'Active', odometer: odoNumber });
    }
    if (attendancePayload) {
      broadcastAll('attendance:updated', { action: 'check-out', record: attendancePayload });
    }
    if (dutyLogPayload) {
      broadcastAll(dutyLogCreated ? 'duty-log:created' : 'duty-log:updated', {
        action: 'check-out',
        log: dutyLogPayload
      });
    }
  } catch (sockErr) {
    console.warn('Socket emission warning on endDuty:', sockErr.message);
  }

  res.status(200).json({
    success: true,
    message: 'Duty ended successfully.',
    endedAt: istFormatted,
    timestamp: now.getTime(),
    endOdometer: odoNumber,
    kmRun,
    remarks: remarks || '',
    vehicle: vehicle ? {
      id: vehicle._id.toString(),
      reg: vehicle.registrationNumber,
      odometer: odoNumber
    } : null
  });
});

/**
 * @desc    Auto-detect odometer integers from live odometer photo
 * @route   POST /api/auth/driver/duty/detect-odometer
 * @access  Public / Driver
 */
export const detectOdometer = asyncHandler(async (req, res) => {
  const { image, currentOdo } = req.body;

  if (!image) {
    return res.status(400).json({
      success: false,
      error: 'Please provide an image (base64) to detect odometer reading.'
    });
  }

  const { detectOdometerFromImage } = await import('../services/odometerOcrService.js');
  const result = await detectOdometerFromImage(image, Number(currentOdo) || 0);

  res.status(200).json(result);
});

