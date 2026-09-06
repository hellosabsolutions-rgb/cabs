import { Driver } from '../models/Driver.js';
import { Vehicle } from '../models/Vehicle.js';
import { Compliance } from '../models/Compliance.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { createCrudController } from './crudFactory.js';
import { calculateExpiryMeta } from './complianceController.js';
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

/**
 * @desc    Get all drivers with search, filtering, and pagination
 * @route   GET /api/drivers
 * @access  Public / Private
 */
export const getDrivers = baseDriverController.getAll;

/**
 * @desc    Get single driver by ID
 * @route   GET /api/drivers/:id
 * @access  Public / Private
 */
export const getDriverById = baseDriverController.getById;

/**
 * @desc    Onboard/Create a new driver in the system
 * @route   POST /api/drivers
 * @access  Public / Private
 */
export const createDriver = asyncHandler(async (req, res) => {
  const {
    name,
    phone,
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
  const cleanVehicle = assignedVehicle && assignedVehicle !== '—' && assignedVehicle !== 'Unassigned'
    ? assignedVehicle.trim()
    : '—';

  const cleanJoiningDate = joiningDate || new Date().toISOString().split('T')[0];

  // 3. Create driver document
  const driver = await Driver.create({
    name: cleanName,
    phone: cleanPhone,
    photo: photo || null,
    address: address ? address.trim() : undefined,
    emergencyContact: emergencyContact ? emergencyContact.trim() : undefined,
    licenseNumber: licenseNumber ? licenseNumber.trim().toUpperCase() : undefined,
    licensePhoto: licensePhoto || null,
    licenseExpiry: licenseExpiry || undefined,
    driverType: driverType || 'Full Time',
    assignedVehicle: cleanVehicle,
    joiningDate: cleanJoiningDate,
    status: status || 'On duty',
    agencyId: agencyId || undefined
  });

  // 4. If assigned vehicle is provided, update vehicle's assignedDriver
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
  const newVehicle = req.body.assignedVehicle;

  const updatedDriver = await Driver.findOneAndUpdate(query, req.body, {
    new: true,
    runValidators: true
  });

  // Sync vehicle if assignment changed or driver name changed
  if (newVehicle && newVehicle !== prevVehicle) {
    if (prevVehicle && prevVehicle !== '—') {
      await Vehicle.findOneAndUpdate(
        { registrationNumber: prevVehicle, assignedDriver: existing.name },
        { $unset: { assignedDriver: 1 } }
      );
    }
    if (newVehicle !== '—') {
      await Vehicle.findOneAndUpdate(
        { registrationNumber: newVehicle },
        { assignedDriver: updatedDriver.name }
      );
    }
  } else if (req.body.name && req.body.name !== existing.name && updatedDriver.assignedVehicle && updatedDriver.assignedVehicle !== '—') {
    await Vehicle.findOneAndUpdate(
      { registrationNumber: updatedDriver.assignedVehicle },
      { assignedDriver: updatedDriver.name }
    );
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

  // If driver was assigned to a vehicle, clear it
  if (driver.assignedVehicle && driver.assignedVehicle !== '—') {
    await Vehicle.findOneAndUpdate(
      { registrationNumber: driver.assignedVehicle, assignedDriver: driver.name },
      { $unset: { assignedDriver: 1 } }
    );
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
