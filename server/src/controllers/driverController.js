import { Driver } from '../models/Driver.js';
import { Vehicle } from '../models/Vehicle.js';
import { Compliance } from '../models/Compliance.js';
import { Agency } from '../models/Agency.js';
import DriverAssignment from '../models/DriverAssignment.js';
import { recordAssignment, recordUnassignment } from './driverAssignmentController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { createCrudController } from './crudFactory.js';
import { calculateExpiryMeta } from './complianceController.js';
import { emitDriverAdded } from '../services/notificationEmitter.js';
import { uploadToCloudinary } from '../services/cloudinaryService.js';
import { emitToDriver, emitToAgency } from '../services/socketService.js';
import mongoose from 'mongoose';

/**
 * Generate a simple, memorable password for a driver.
 * Format: <agencySlug>@<4-digit-phone-suffix>
 * Example: agency "KABPRO Tours" + phone "9876543210" → kabpro@3210
 */
function generateDriverPassword(agencyName = 'fleet', phone = '') {
  const agencySlug = agencyName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 8);
  const phoneSuffix = String(phone).replace(/\D/g, '').slice(-4) || '0000';
  return `${agencySlug}@${phoneSuffix}`;
}

// Base CRUD controller for drivers
const baseDriverController = createCrudController(Driver, [
  'name',
  'phone',
  'assignedVehicle',
  'licenseNumber',
  'address',
  'emergencyContact'
]);

function plateKey(value = '') {
  return String(value).replace(/[\s-]/g, '').toUpperCase();
}

function normalizeAssignedVehicle(value) {
  if (!value || value === '—' || value === '-' || value === 'Unassigned' || value === 'None') {
    return '—';
  }
  return String(value).trim().toUpperCase().replace(/\s+/g, '');
}

async function findVehicleByPlate(plate) {
  if (!plate || plate === '—') return null;
  const exact = await Vehicle.findOne({ registrationNumber: plate });
  if (exact) return exact;
  const key = plateKey(plate);
  const vehicles = await Vehicle.find({}).select('_id registrationNumber assignedDriver');
  return vehicles.find((item) => plateKey(item.registrationNumber) === key) || null;
}

/**
 * @desc    Get all drivers with search, filtering, and pagination
 * @route   GET /api/drivers
 * @access  Public / Private
 */
export const getDrivers = baseDriverController.getAll;

/**
 * @desc    Get single driver by ID with active assignment and history
 * @route   GET /api/drivers/:id
 * @access  Public / Private
 */
export const getDriverById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { id };

  const driver = await Driver.findOne(query);
  if (!driver) {
    return res.status(404).json({
      success: false,
      error: `Driver not found with ID ${id}`
    });
  }

  const [activeAssignment, assignmentHistory] = await Promise.all([
    DriverAssignment.findOne({ driverId: driver._id, status: 'ACTIVE' }).lean(),
    DriverAssignment.find({ driverId: driver._id })
      .sort({ assignedAt: -1 })
      .limit(20)
      .lean()
  ]);

  const driverData = driver.toObject ? driver.toObject() : driver;
  driverData.activeAssignment = activeAssignment || null;
  driverData.assignmentHistory = assignmentHistory || [];

  res.status(200).json({
    success: true,
    data: driverData
  });
});

/**
 * @desc    Onboard/Create a new driver in the system
 * @route   POST /api/drivers
 * @access  Public / Private
 */
export const createDriver = asyncHandler(async (req, res) => {
  const {
    name,
    phone,
    email,
    photo,
    address,
    emergencyContact,
    licenseNumber,
    licensePhoto,
    licenseExpiry,
    driverType,
    assignedVehicle,
    joiningDate,
    status,
    monthlySalary,
    agencyId
  } = req.body;

  // 1. Mandatory Validations
  if (!name || !name.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Driver full name is required.'
    });
  }

  if (!phone || !phone.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Driver phone number is required.'
    });
  }

  const cleanName = name.trim();
  const cleanPhone = phone.trim();

  // Check duplicate driver by phone number (if given)
  const existingDriver = await Driver.findOne({
    phone: cleanPhone,
    ...(agencyId ? { agencyId } : {})
  });

  if (existingDriver) {
    return res.status(409).json({
      success: false,
      error: `Driver with phone number '${cleanPhone}' already exists (${existingDriver.name}).`
    });
  }

  // 2. Format fields
  const cleanVehicle = normalizeAssignedVehicle(assignedVehicle);

  const cleanJoiningDate = joiningDate || new Date().toISOString().split('T')[0];

  // Upload driver photo and license document to Cloudinary if provided as base64
  let finalPhoto = photo || null;
  if (photo && typeof photo === 'string' && photo.startsWith('data:image')) {
    try {
      const uploaded = await uploadToCloudinary(photo, { folder: 'fleetos/drivers' });
      finalPhoto = uploaded.secure_url;
    } catch (err) {
      console.warn('Cloudinary driver photo upload failed, saving raw:', err.message);
    }
  }

  let finalLicensePhoto = licensePhoto || null;
  if (licensePhoto && typeof licensePhoto === 'string' && licensePhoto.startsWith('data:')) {
    try {
      const isPdf = licensePhoto.startsWith('data:application/pdf');
      const uploaded = await uploadToCloudinary(licensePhoto, {
        folder: 'fleetos/compliance',
        resource_type: isPdf ? 'raw' : 'auto'
      });
      finalLicensePhoto = uploaded.secure_url;
    } catch (err) {
      console.warn('Cloudinary license upload failed, saving raw:', err.message);
    }
  }

  // 3. Resolve agency name for password generation
  let agencyName = 'fleet';
  const resolvedAgencyId = agencyId || req.user?.currentAgency;
  if (resolvedAgencyId) {
    try {
      const agency = await Agency.findById(resolvedAgencyId).select('name').lean();
      if (agency?.name) agencyName = agency.name;
    } catch (_) { /* non-blocking */ }
  }

  // Auto-generate a simple password: <agencySlug>@<last4digits>
  const plainPassword = generateDriverPassword(agencyName, cleanPhone);

  // 4. Create driver document
  const driver = await Driver.create({
    name: cleanName,
    phone: cleanPhone,
    email: email ? String(email).trim().toLowerCase() : undefined,
    photo: finalPhoto,
    address: address ? address.trim() : undefined,
    emergencyContact: emergencyContact ? emergencyContact.trim() : undefined,
    licenseNumber: licenseNumber ? licenseNumber.trim().toUpperCase() : undefined,
    licensePhoto: finalLicensePhoto,
    licenseExpiry: licenseExpiry || undefined,
    driverType: driverType || 'Full Time',
    assignedVehicle: cleanVehicle,
    joiningDate: cleanJoiningDate,
    status: status || 'On duty',
    monthlySalary: Number(monthlySalary) || 0,
    agencyId: resolvedAgencyId || undefined,
    password: plainPassword   // will be bcrypt-hashed by pre-save hook
  });

  // 4. If assigned vehicle is provided, update vehicle's assignedDriver & record assignment
  if (cleanVehicle !== '—') {
    try {
      const vehicle = await findVehicleByPlate(cleanVehicle);
      if (vehicle) {
        await Vehicle.findByIdAndUpdate(vehicle._id, { assignedDriver: cleanName });
        if (vehicle.registrationNumber !== cleanVehicle) {
          await Driver.findByIdAndUpdate(driver._id, { assignedVehicle: vehicle.registrationNumber });
          driver.assignedVehicle = vehicle.registrationNumber;
        }
      }
      await recordAssignment({
        driverId: driver._id,
        driverName: cleanName,
        vehicleId: vehicle ? vehicle._id : null,
        vehicleRegistration: vehicle ? vehicle.registrationNumber : cleanVehicle,
        odometer: vehicle ? vehicle.odometer : 0,
        agencyId: driver.agencyId || (vehicle ? vehicle.agencyId : null),
        reason: 'Driver onboarded with vehicle'
      });
    } catch (vErr) {
      console.warn('Could not auto-sync assignedDriver to vehicle:', vErr.message);
    }
  }

  // 5. Auto-create compliance document for driver license if license number is provided
  if (licenseNumber && licenseNumber.trim()) {
    try {
      const expDateStr = licenseExpiry || (() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() + 3);
        return d.toISOString().split('T')[0];
      })();
      const meta = calculateExpiryMeta(expDateStr);

      await Compliance.create({
        entityName: cleanName,
        entityType: 'Driver',
        documentName: 'Driving licence',
        documentNumber: licenseNumber.trim().toUpperCase(),
        issueDate: cleanJoiningDate,
        expiryDate: expDateStr,
        issuingAuthority: 'Regional Transport Office (RTO)',
        documentPhoto: licensePhoto || null,
        expiryLabel: meta.expiryLabel,
        statusType: meta.statusType,
        daysLeft: meta.daysLeft,
        notes: `Registered during driver onboarding on ${cleanJoiningDate}`
      });
    } catch (cErr) {
      console.warn('Could not auto-create driver compliance document:', cErr.message);
    }
  }

  emitDriverAdded({
    userId: req.user?._id,
    agencyId: req.user?.currentAgency || agencyId,
    driver
  });

  // Return the plain-text password ONCE so admin can share it.
  // After this the password is stored as bcrypt hash and never returned again.
  res.status(201).json({
    success: true,
    message: `Driver ${cleanName} successfully added to the roster`,
    data: driver,
    credentials: {
      loginId: cleanPhone,
      password: plainPassword,
      hint: `Share these credentials with the driver. They can log in using their mobile number and this password.`
    }
  });
});

/**
 * @desc    Update driver details
 * @route   PUT /api/drivers/:id
 * @access  Public / Private
 */
export const updateDriver = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { id };

  const existing = await Driver.findOne(query);
  if (!existing) {
    return res.status(404).json({
      success: false,
      error: `Driver not found with ID ${id}`
    });
  }

  const prevVehicle = existing.assignedVehicle;
  let newVehicle = req.body.assignedVehicle;

  if (Object.prototype.hasOwnProperty.call(req.body, 'assignedVehicle')) {
    newVehicle = normalizeAssignedVehicle(req.body.assignedVehicle);
    req.body.assignedVehicle = newVehicle;
  }

  // Extract password before the bulk update — must be handled via .save() to
  // trigger the bcrypt pre-save hook (findOneAndUpdate bypasses it).
  const { password: rawNewPassword, ...safeBody } = req.body;

  const updatedDriver = await Driver.findOneAndUpdate(query, safeBody, {
    new: true,
    runValidators: true
  });

  // If a new password was provided, hash it via .save()
  if (rawNewPassword && rawNewPassword.trim()) {
    updatedDriver.password = rawNewPassword.trim();
    await updatedDriver.save();
  }

  // Sync vehicle if assignment changed or driver name changed
  if (newVehicle !== undefined && normalizeAssignedVehicle(prevVehicle) !== newVehicle) {
    if (prevVehicle && prevVehicle !== '—') {
      const prev = await findVehicleByPlate(prevVehicle);
      if (prev) {
        const linkedToThisDriver =
          !prev.assignedDriver ||
          prev.assignedDriver.trim().toLowerCase() === existing.name.trim().toLowerCase();
        if (linkedToThisDriver) {
          await Vehicle.findByIdAndUpdate(prev._id, { $unset: { assignedDriver: 1 } });
        }
      }
      await recordUnassignment({
        driverId: updatedDriver._id,
        vehicleRegistration: prevVehicle,
        reason: (newVehicle && newVehicle !== '—') ? `Swapped to ${newVehicle}` : 'Driver unassigned from vehicle'
      });
    }

    if (newVehicle && newVehicle !== '—') {
      const next = await findVehicleByPlate(newVehicle);
      if (next) {
        const others = await Driver.find({
          _id: { $ne: updatedDriver._id },
          assignedVehicle: { $exists: true, $nin: [null, '', '—'] }
        }).select('_id assignedVehicle');
        for (const other of others) {
          if (plateKey(other.assignedVehicle) === plateKey(next.registrationNumber)) {
            await Driver.updateOne({ _id: other._id }, { $set: { assignedVehicle: '—' } });
            await recordUnassignment({
              driverId: other._id,
              vehicleRegistration: next.registrationNumber,
              reason: `Vehicle reassigned to ${updatedDriver.name}`
            });
          }
        }

        await Vehicle.findByIdAndUpdate(next._id, { assignedDriver: updatedDriver.name });
        if (next.registrationNumber !== updatedDriver.assignedVehicle) {
          await Driver.findByIdAndUpdate(updatedDriver._id, {
            assignedVehicle: next.registrationNumber
          });
          updatedDriver.assignedVehicle = next.registrationNumber;
        }

        await recordAssignment({
          driverId: updatedDriver._id,
          driverName: updatedDriver.name,
          vehicleId: next._id,
          vehicleRegistration: next.registrationNumber,
          odometer: next.odometer || 0,
          agencyId: updatedDriver.agencyId || next.agencyId || null,
          reason: 'Vehicle assigned to driver'
        });
      }
    } else if (!newVehicle || newVehicle === '—') {
      await recordUnassignment({
        driverId: updatedDriver._id,
        reason: 'Driver unassigned from vehicle'
      });
    }
  } else if (
    req.body.name &&
    req.body.name !== existing.name &&
    updatedDriver.assignedVehicle &&
    updatedDriver.assignedVehicle !== '—'
  ) {
    const linked = await findVehicleByPlate(updatedDriver.assignedVehicle);
    if (linked) {
      await Vehicle.findByIdAndUpdate(linked._id, { assignedDriver: updatedDriver.name });
    }
  }

  // Sync Driving licence compliance document if license details or name changed
  if (req.body.licenseNumber !== undefined || req.body.licenseExpiry !== undefined || req.body.licensePhoto !== undefined || req.body.name !== undefined) {
    try {
      const expDate = req.body.licenseExpiry || updatedDriver.licenseExpiry;
      const meta = expDate ? calculateExpiryMeta(expDate) : null;

      const compUpdate = {
        entityName: updatedDriver.name,
        entityType: 'Driver',
        documentName: 'Driving licence',
        ...(req.body.licenseNumber !== undefined && { documentNumber: (req.body.licenseNumber || '').trim().toUpperCase() }),
        ...(req.body.licenseExpiry !== undefined && { expiryDate: req.body.licenseExpiry }),
        ...(req.body.licensePhoto !== undefined && { documentPhoto: req.body.licensePhoto }),
        ...(meta && {
          expiryLabel: meta.expiryLabel,
          statusType: meta.statusType,
          daysLeft: meta.daysLeft
        })
      };

      const existingComp = await Compliance.findOne({
        entityName: { $in: [existing.name, updatedDriver.name] },
        entityType: 'Driver',
        documentName: { $regex: /licen[cs]e/i }
      });

      if (existingComp) {
        await Compliance.findByIdAndUpdate(existingComp._id, { $set: compUpdate });
      } else if (updatedDriver.licenseNumber) {
        await Compliance.create({
          ...compUpdate,
          documentNumber: updatedDriver.licenseNumber,
          issueDate: updatedDriver.joiningDate || new Date().toISOString().split('T')[0],
          expiryDate: expDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          issuingAuthority: 'Regional Transport Office (RTO)'
        });
      }
    } catch (cErr) {
      console.warn('Could not sync driver compliance document on update:', cErr.message);
    }
  }

  const driverObj = updatedDriver.toObject ? updatedDriver.toObject() : updatedDriver;
  driverObj.id = updatedDriver._id ? updatedDriver._id.toString() : updatedDriver.id;

  // Real-time sync: notify driver mobile app immediately via WebSocket
  emitToDriver(updatedDriver._id, 'driver:updated', {
    action: 'profile_updated',
    driver: driverObj,
    assignedVehicle: updatedDriver.assignedVehicle,
    status: updatedDriver.status,
    message: 'Your profile has been updated from the dashboard'
  });

  res.status(200).json({
    success: true,
    message: `Driver ${updatedDriver.name} updated successfully`,
    data: driverObj
  });
});

/**
 * @desc    Update driver duty status ('On duty' | 'Off duty')
 * @route   PATCH /api/drivers/:id/status
 * @access  Public / Private
 */
export const updateDriverStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['On duty', 'Off duty'].includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'Status must be either "On duty" or "Off duty"'
    });
  }

  const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { id };
  const driver = await Driver.findOneAndUpdate(
    query,
    { status },
    { new: true, runValidators: true }
  );

  if (!driver) {
    return res.status(404).json({
      success: false,
      error: `Driver not found with ID ${id}`
    });
  }

  // Real-time sync: notify driver mobile app immediately via WebSocket
  emitToDriver(driver._id, 'driver:status', {
    action: 'status_changed',
    status: driver.status,
    driverId: driver._id.toString(),
    message: `Your duty status was updated to ${status} from the dashboard`
  });
  emitToDriver(driver._id, 'driver:updated', {
    action: 'status_changed',
    status: driver.status,
    driverId: driver._id.toString()
  });

  res.status(200).json({
    success: true,
    message: `Driver duty status updated to ${status}`,
    data: driver
  });
});

/**
 * @desc    Delete driver from roster
 * @route   DELETE /api/drivers/:id
 * @access  Public / Private
 */
export const deleteDriver = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { id };

  const driver = await Driver.findOneAndDelete(query);

  if (!driver) {
    return res.status(404).json({
      success: false,
      error: `Driver not found with ID ${id}`
    });
  }

  // If driver was assigned to a vehicle, clear it & record unassignment
  if (driver.assignedVehicle && driver.assignedVehicle !== '—') {
    await Vehicle.findOneAndUpdate(
      { registrationNumber: driver.assignedVehicle, assignedDriver: driver.name },
      { $unset: { assignedDriver: 1 } }
    );
    await recordUnassignment({
      driverId: driver._id,
      vehicleRegistration: driver.assignedVehicle,
      reason: 'Driver removed from roster'
    });
  }

  // Real-time sync: notify driver mobile app
  emitToDriver(driver._id, 'driver:removed', {
    action: 'driver_removed',
    driverId: driver._id.toString(),
    message: 'Your driver profile has been removed from the roster'
  });

  res.status(200).json({
    success: true,
    message: `Driver ${driver.name} removed from roster successfully`,
    data: {}
  });
});

/**
 * @desc    Bulk onboard drivers from CSV import
 * @route   POST /api/drivers/bulk
 * @access  Public / Private
 */
export const bulkCreateDrivers = asyncHandler(async (req, res) => {
  const driversList = req.body.drivers;
  if (!Array.isArray(driversList) || driversList.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Please provide an array of drivers to import.'
    });
  }

  const results = {
    total: driversList.length,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: []
  };

  const processedDrivers = [];

  for (let i = 0; i < driversList.length; i++) {
    const item = driversList[i];
    const rowNum = i + 1;

    if (!item.name || !String(item.name).trim()) {
      results.errors.push(`Row #${rowNum}: Driver name is required.`);
      results.skipped++;
      continue;
    }

    if (!item.phone || !String(item.phone).trim()) {
      results.errors.push(`Row #${rowNum} (${item.name}): Phone number is required.`);
      results.skipped++;
      continue;
    }

    const cleanName = String(item.name).trim();
    const cleanPhone = String(item.phone).trim();
    const agencyId = req.user?.agencyId || item.agencyId;

    const cleanVehicle = item.assignedVehicle && item.assignedVehicle !== '—' && item.assignedVehicle.toLowerCase() !== 'unassigned'
      ? String(item.assignedVehicle).trim()
      : '—';

    const cleanJoiningDate = item.joiningDate || new Date().toISOString().split('T')[0];

    const driverPayload = {
      name: cleanName,
      phone: cleanPhone,
      address: item.address ? String(item.address).trim() : undefined,
      emergencyContact: item.emergencyContact ? String(item.emergencyContact).trim() : undefined,
      licenseNumber: item.licenseNumber ? String(item.licenseNumber).trim().toUpperCase() : undefined,
      licenseExpiry: item.licenseExpiry || undefined,
      driverType: item.driverType || 'Full Time',
      assignedVehicle: cleanVehicle,
      joiningDate: cleanJoiningDate,
      status: item.status || 'On duty',
      monthlySalary: Number(item.monthlySalary) || 0,
      ...(agencyId ? { agencyId } : {})
    };

    try {
      // Check existing driver by phone
      const existing = await Driver.findOne({
        phone: cleanPhone,
        ...(agencyId ? { agencyId } : {})
      });

      let savedDriver;
      if (existing) {
        Object.assign(existing, driverPayload);
        savedDriver = await existing.save();
        results.updated++;
      } else {
        savedDriver = await Driver.create(driverPayload);
        results.created++;
      }

      processedDrivers.push(savedDriver);

      // 1. Sync vehicle assignedDriver if valid vehicle was given
      if (cleanVehicle !== '—') {
        try {
          await Vehicle.findOneAndUpdate(
            { registrationNumber: cleanVehicle },
            { assignedDriver: cleanName }
          );
        } catch (vErr) {
          console.warn('Could not auto-sync assignedDriver to vehicle:', vErr.message);
        }
      }

      // 2. Sync compliance document for driver license if licenseNumber is provided
      if (driverPayload.licenseNumber) {
        try {
          const expDateStr = driverPayload.licenseExpiry || (() => {
            const d = new Date();
            d.setFullYear(d.getFullYear() + 3);
            return d.toISOString().split('T')[0];
          })();
          const meta = calculateExpiryMeta(expDateStr);

          await Compliance.findOneAndUpdate(
            {
              entityName: cleanName,
              entityType: 'Driver',
              documentName: 'Driving licence'
            },
            {
              documentNumber: driverPayload.licenseNumber,
              issueDate: cleanJoiningDate,
              expiryDate: expDateStr,
              issuingAuthority: 'Regional Transport Office (RTO)',
              expiryLabel: meta.expiryLabel,
              statusType: meta.statusType,
              daysLeft: meta.daysLeft,
              ...(agencyId ? { agencyId } : {})
            },
            { upsert: true, new: true }
          );
        } catch (cErr) {
          console.warn('Could not auto-create license compliance:', cErr.message);
        }
      }
    } catch (err) {
      results.errors.push(`Row #${rowNum} (${cleanName}): ${err.message}`);
      results.skipped++;
    }
  }

  res.status(200).json({
    success: true,
    message: `Processed ${results.total} drivers: ${results.created} created, ${results.updated} updated, ${results.skipped} skipped.`,
    data: processedDrivers,
    summary: results
  });
});

export const driverController = {
  getAll: getDrivers,
  getById: getDriverById,
  create: createDriver,
  bulkCreate: bulkCreateDrivers,
  update: updateDriver,
  updateStatus: updateDriverStatus,
  delete: deleteDriver
};
