import { Driver } from '../models/Driver.js';
import { Vehicle } from '../models/Vehicle.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { verifyGoogleIdentity } from '../services/googleAuth.js';
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
  const loginId = identifier || email;

  if (!loginId || !password) {
    return res.status(400).json({
      success: false,
      error: 'Please provide your mobile, email or driver ID, and password.'
    });
  }

  const driver = await findDriverByIdentifier(loginId);
  if (!driver || !(await driver.matchPassword(password))) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials.'
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
