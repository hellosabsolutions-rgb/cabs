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

  // Update driver status
  await Driver.findByIdAndUpdate(driver._id, {
    status: 'On duty',
    assignedVehicle: vehicle.registrationNumber
  });

  // Update vehicle status
  await Vehicle.findByIdAndUpdate(vehicle._id, {
    status: 'Running',
    odometer: Math.max(vehicle.odometer || 0, odoNumber)
  });

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
  const todayDate = now.toISOString().slice(0, 10);

  // Auto-record / update attendance for today as Present
  try {
    await DriverAttendance.findOneAndUpdate(
      { driverId: driver._id.toString(), date: todayDate },
      {
        $setOnInsert: {
          driverId: driver._id.toString(),
          driverName: driver.name,
          date: todayDate,
          dutyType: 'Department Duty'
        },
        $set: {
          status: 'Present',
          checkIn: istTime,
          assignedVehicle: vehicle.registrationNumber
        }
      },
      { upsert: true, new: true }
    );
  } catch (attErr) {
    console.warn('Could not auto-log attendance on start duty:', attErr.message);
  }

  // Socket emissions for real-time dashboard and mobile sync
  try {
    emitToDriver(driver._id, 'driver:status', { onDuty: true, status: 'On duty', vehicle: vehicle.registrationNumber });
    emitToDriver(driver._id, 'driver:updated', { id: driver._id.toString(), status: 'On duty' });
    broadcastAll('driver:any_change', { driverId: driver._id.toString(), status: 'On duty' });
    broadcastAll('vehicle:updated', { vehicleId: vehicle._id.toString(), status: 'Running', odometer: odoNumber });
  } catch (sockErr) {
    console.warn('Socket emission warning on startDuty:', sockErr.message);
  }

  res.status(200).json({
    success: true,
    message: 'Duty started successfully.',
    startedAt: istFormatted,
    timestamp: now.getTime(),
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
  const todayDate = now.toISOString().slice(0, 10);

  // Update attendance checkout time & working hours if record exists
  try {
    const attRecord = await DriverAttendance.findOne({
      driverId: driver._id.toString(),
      date: todayDate
    });
    if (attRecord) {
      attRecord.checkOut = istTime;
      if (attRecord.checkIn) {
        try {
          const parseTime = (tStr) => {
            const [time, modifier] = tStr.split(' ');
            let [hours, minutes] = time.split(':').map(Number);
            if (modifier === 'PM' && hours < 12) hours += 12;
            if (modifier === 'AM' && hours === 12) hours = 0;
            return hours + minutes / 60;
          };
          const startH = parseTime(attRecord.checkIn);
          const endH = parseTime(istTime);
          const diff = endH >= startH ? endH - startH : (24 - startH) + endH;
          attRecord.workingHours = Number(diff.toFixed(1));
        } catch {
          // Ignore parsing issues
        }
      }
      if (remarks) {
        attRecord.notes = attRecord.notes ? `${attRecord.notes}; ${remarks}` : remarks;
      }
      await attRecord.save();
    }
  } catch (attErr) {
    console.warn('Could not auto-update attendance on end duty:', attErr.message);
  }

  // Create DailyDutyLog entry for official duty bookkeeping
  try {
    const startKm = currentVehicleOdo || odoNumber;
    const dutySlipNumber = `SLIP-${Date.now().toString().slice(-6)}`;
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const currentMonth = monthNames[now.getMonth()];

    await DailyDutyLog.create({
      dutySlipNumber,
      logBookPageNo: String(Math.floor(100 + Math.random() * 900)),
      month: currentMonth,
      date: todayDate,
      departmentName: vehicle?.departmentName || 'General Operations',
      vehicle: vehicle ? vehicle.registrationNumber : (driver.assignedVehicle || 'Fleet'),
      driverName: driver.name || 'Driver',
      dutyType: 'Official Department Duty',
      startKm,
      endKm: odoNumber,
      totalKm: Math.max(0, odoNumber - startKm),
      endTime: istTime,
      dutySlipPhoto: photoUrl || null,
      notes: remarks || '',
      status: 'Approved'
    });
  } catch (logErr) {
    console.warn('Could not auto-create DailyDutyLog on end duty:', logErr.message);
  }

  // Real-time socket broadcast
  try {
    emitToDriver(driver._id, 'driver:status', { onDuty: false, status: 'Off duty' });
    emitToDriver(driver._id, 'driver:updated', { id: driver._id.toString(), status: 'Off duty' });
    broadcastAll('driver:any_change', { driverId: driver._id.toString(), status: 'Off duty' });
    if (vehicle) {
      broadcastAll('vehicle:updated', { vehicleId: vehicle._id.toString(), status: 'Active', odometer: odoNumber });
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

