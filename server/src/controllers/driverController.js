import { Driver } from '../models/Driver.js';
import { Vehicle } from '../models/Vehicle.js';
import { Compliance } from '../models/Compliance.js';
import DriverAssignment from '../models/DriverAssignment.js';
import { recordAssignment, recordUnassignment } from './driverAssignmentController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { createCrudController } from './crudFactory.js';
import { calculateExpiryMeta } from './complianceController.js';
import { emitDriverAdded } from '../services/notificationEmitter.js';
import { uploadToCloudinary } from '../services/cloudinaryService.js';
import mongoose from 'mongoose';

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

  // 3. Create driver document
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
    agencyId: agencyId || undefined
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

  res.status(201).json({
    success: true,
    message: `Driver ${cleanName} successfully added to the roster`,
    data: driver
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

  const updatedDriver = await Driver.findOneAndUpdate(query, req.body, {
    new: true,
    runValidators: true
  });

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

  res.status(200).json({
    success: true,
    message: `Driver ${driver.name} removed from roster successfully`,
    data: {}
  });
});

export const driverController = {
  getAll: getDrivers,
  getById: getDriverById,
  create: createDriver,
  update: updateDriver,
  updateStatus: updateDriverStatus,
  delete: deleteDriver
};
