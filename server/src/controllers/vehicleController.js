import mongoose from 'mongoose';
import { Vehicle } from '../models/Vehicle.js';
import { Compliance } from '../models/Compliance.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { notify } from '../services/notificationService.js';
import { uploadToCloudinary } from '../services/cloudinaryService.js';
import { createCrudController } from './crudFactory.js';

// Base CRUD controller for vehicles
const baseVehicleController = createCrudController(Vehicle, [
  'registrationNumber',
  'assignedTo',
  'departmentName',
  'model',
  'assignedDriver',
  'hubStand'
]);

/**
 * @desc    Onboard a new vehicle to fleet with mandatory & optional fields and auto-compliance docs
 * @route   POST /api/vehicles
 * @access  Public / Private
 */
export const onboardVehicle = asyncHandler(async (req, res) => {
  const {
    registrationNumber,
    type,
    assignedTo,
    departmentName,
    hubStand,
    model,
    fuelType,
    seatingCapacity,
    assignedDriver,
    odometer,
    fastagTagId,
    fastagBank,
    fastagBalance,
    gpsImei,
    status,
    rcExpiry,
    rcPhoto,
    insuranceExpiry,
    insurancePhoto,
    pollutionExpiry,
    pollutionPhoto,
    permitExpiry,
    permitPhoto,
    authExpiry,
    authPhoto,
    vehiclePhoto,
    fitnessExpiry,
    puccExpiry,
    roadTaxExpiry,
    revenue,
    expense,
    meta,
    agencyId
  } = req.body;

  // 1. Mandatory Field Validations
  if (!registrationNumber || !registrationNumber.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Vehicle registration number is mandatory (e.g. DL01AB1234).'
    });
  }

  const cleanReg = registrationNumber.trim().toUpperCase().replace(/\s+/g, '');

  // Check duplicate registration
  const existingVehicle = await Vehicle.findOne({ registrationNumber: cleanReg });
  if (existingVehicle) {
    return res.status(409).json({
      success: false,
      error: `Vehicle with registration '${cleanReg}' is already onboarded in the fleet.`
    });
  }

  if (!type) {
    return res.status(400).json({
      success: false,
      error: 'Vehicle type is mandatory (Department or Trip-based).'
    });
  }

  // 2. Computed Financials & Meta
  const calcRev = typeof revenue !== 'undefined' && revenue !== null ? Number(revenue) : 0;
  const calcExp = typeof expense !== 'undefined' && expense !== null ? Number(expense) : 0;
  const calcProfit = calcRev - calcExp;

  const finalAssignedTo =
    assignedTo ||
    (type === 'Department'
      ? departmentName || 'Department Contract'
      : departmentName || 'Booking Fleet');

  const finalMeta =
    meta ||
    (type === 'Department'
      ? `${departmentName || finalAssignedTo} Contract Duty`
      : 'Booking / Rental duty');

  // Helper to upload document or photo to Cloudinary
  const uploadDoc = async (val, folder = 'fleetos/vehicles') => {
    if (!val || typeof val !== 'string' || !val.startsWith('data:')) return val || null;
    try {
      const isPdf = val.startsWith('data:application/pdf');
      const uploaded = await uploadToCloudinary(val, {
        folder,
        resource_type: isPdf ? 'raw' : 'auto'
      });
      return uploaded.secure_url;
    } catch (e) {
      console.warn(`Cloudinary upload failed for ${folder}:`, e.message);
      return val;
    }
  };

  const [
    finalVehiclePhoto,
    finalRcPhoto,
    finalInsurancePhoto,
    finalPollutionPhoto,
    finalPermitPhoto,
    finalAuthPhoto
  ] = await Promise.all([
    uploadDoc(vehiclePhoto, 'fleetos/vehicles'),
    uploadDoc(rcPhoto, 'fleetos/compliance'),
    uploadDoc(insurancePhoto, 'fleetos/compliance'),
    uploadDoc(pollutionPhoto, 'fleetos/compliance'),
    uploadDoc(permitPhoto, 'fleetos/compliance'),
    uploadDoc(authPhoto, 'fleetos/compliance')
  ]);

  // 3. Create Vehicle Document
  const vehicle = await Vehicle.create({
    registrationNumber: cleanReg,
    type,
    assignedTo: finalAssignedTo,
    departmentName: departmentName ? departmentName.trim() : undefined,
    hubStand: hubStand ? hubStand.trim() : undefined,
    model: model ? model.trim() : 'Commercial Vehicle',
    fuelType: fuelType || 'Diesel',
    seatingCapacity: Number(seatingCapacity) || 5,
    assignedDriver: assignedDriver && assignedDriver !== 'Unassigned' ? assignedDriver.trim() : undefined,
    odometer: Number(odometer) || 0,
    fastagTagId: fastagTagId ? fastagTagId.trim() : undefined,
    fastagBank: fastagBank ? fastagBank.trim() : undefined,
    fastagBalance: Number(fastagBalance) || 0,
    gpsImei: gpsImei ? gpsImei.trim() : undefined,
    status: status || 'Running',
    rcExpiry: rcExpiry || undefined,
    rcPhoto: finalRcPhoto,
    insuranceExpiry: insuranceExpiry || undefined,
    insurancePhoto: finalInsurancePhoto,
    pollutionExpiry: pollutionExpiry || puccExpiry || undefined,
    pollutionPhoto: finalPollutionPhoto,
    permitExpiry: permitExpiry || undefined,
    permitPhoto: finalPermitPhoto,
    authExpiry: authExpiry || undefined,
    authPhoto: finalAuthPhoto,
    vehiclePhoto: finalVehiclePhoto,
    fitnessExpiry,
    puccExpiry: pollutionExpiry || puccExpiry || undefined,
    roadTaxExpiry,
    revenue: calcRev,
    expense: calcExp,
    profit: calcProfit,
    meta: finalMeta,
    agencyId: agencyId || req.user?.currentAgency || undefined
  });

  // Helper for compliance date status calculation
  const calcComplianceMeta = (expDateStr) => {
    if (!expDateStr) return { statusType: 'ok', daysLeft: 365, expiryLabel: 'Valid' };
    const exp = new Date(expDateStr);
    const now = new Date();
    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (isNaN(diffDays)) return { statusType: 'ok', daysLeft: 365, expiryLabel: 'Valid' };
    if (diffDays < 0) {
      return { statusType: 'late', daysLeft: diffDays, expiryLabel: `Expired ${Math.abs(diffDays)}d ago` };
    } else if (diffDays <= 30) {
      return { statusType: 'soon', daysLeft: diffDays, expiryLabel: `Expires in ${diffDays}d` };
    }
    return { statusType: 'ok', daysLeft: diffDays, expiryLabel: `Valid (${diffDays}d left)` };
  };

  // 4. Auto-generate Compliance Records for 5 documents (RC, Insurance, Pollution, Permit, Auth)
  const complianceEntries = [];

  // Document 1: RC (Registration Certificate)
  if (rcExpiry || rcPhoto) {
    const meta = calcComplianceMeta(rcExpiry);
    complianceEntries.push({
      entityName: cleanReg,
      entityType: 'Vehicle',
      documentName: 'RC',
      expiryDate: rcExpiry || '',
      documentPhoto: rcPhoto || null,
      expiryLabel: meta.expiryLabel,
      statusType: meta.statusType,
      daysLeft: meta.daysLeft
    });
  }

  // Document 2: Insurance Policy
  if (insuranceExpiry || insurancePhoto) {
    const meta = calcComplianceMeta(insuranceExpiry);
    complianceEntries.push({
      entityName: cleanReg,
      entityType: 'Vehicle',
      documentName: 'Insurance',
      expiryDate: insuranceExpiry || '',
      documentPhoto: insurancePhoto || null,
      expiryLabel: meta.expiryLabel,
      statusType: meta.statusType,
      daysLeft: meta.daysLeft
    });
  }

  // Document 3: Pollution (PUCC)
  const finalPollutionExpiry = pollutionExpiry || puccExpiry;
  if (finalPollutionExpiry || pollutionPhoto) {
    const meta = calcComplianceMeta(finalPollutionExpiry);
    complianceEntries.push({
      entityName: cleanReg,
      entityType: 'Vehicle',
      documentName: 'PUC',
      expiryDate: finalPollutionExpiry || '',
      documentPhoto: pollutionPhoto || null,
      expiryLabel: meta.expiryLabel,
      statusType: meta.statusType,
      daysLeft: meta.daysLeft
    });
  }

  // Document 4: Permit (Commercial Vehicle Permit)
  if (permitExpiry || permitPhoto) {
    const meta = calcComplianceMeta(permitExpiry);
    complianceEntries.push({
      entityName: cleanReg,
      entityType: 'Vehicle',
      documentName: 'Permit',
      expiryDate: permitExpiry || '',
      documentPhoto: permitPhoto || null,
      expiryLabel: meta.expiryLabel,
      statusType: meta.statusType,
      daysLeft: meta.daysLeft
    });
  }

  // Document 5: Auth (Permit Authorization)
  if (authExpiry || authPhoto) {
    const meta = calcComplianceMeta(authExpiry);
    complianceEntries.push({
      entityName: cleanReg,
      entityType: 'Vehicle',
      documentName: 'Auth',
      expiryDate: authExpiry || '',
      documentPhoto: authPhoto || null,
      expiryLabel: meta.expiryLabel,
      statusType: meta.statusType,
      daysLeft: meta.daysLeft
    });
  }

  // Optional: Fitness Certificate
  if (fitnessExpiry) {
    const meta = calcComplianceMeta(fitnessExpiry);
    complianceEntries.push({
      entityName: cleanReg,
      entityType: 'Vehicle',
      documentName: 'Vehicle Fitness Certificate',
      expiryDate: fitnessExpiry,
      expiryLabel: meta.expiryLabel,
      statusType: meta.statusType,
      daysLeft: meta.daysLeft
    });
  }

  if (complianceEntries.length > 0) {
    try {
      await Compliance.insertMany(complianceEntries);
    } catch (cErr) {
      console.warn('Could not auto-insert compliance records for vehicle', cErr);
    }
  }

  notify.fleet({
    userId: req.user?._id,
    agencyId: req.user?.currentAgency || agencyId,
    priority: 'success',
    title: 'New Vehicle Onboarded',
    message: `Vehicle ${cleanReg} (${model || 'Fleet Vehicle'}) has been successfully onboarded.`,
    link: '/vehicles',
    metadata: { vehicleId: vehicle._id?.toString(), registrationNumber: cleanReg }
  });

  res.status(201).json({
    success: true,
    message: `Vehicle ${cleanReg} onboarded successfully!`,
    data: vehicle
  });
});

/**
 * @desc    Update vehicle details with optional Cloudinary uploads & sync
 * @route   PUT /api/vehicles/:id
 * @access  Private / Admin
 */
export const updateVehicle = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isMongoId = mongoose.Types.ObjectId.isValid(id);
  const query = isMongoId ? { _id: id } : { id };

  const existing = await Vehicle.findOne(query);
  if (!existing) {
    return res.status(404).json({
      success: false,
      error: `Vehicle not found with ID ${id}`
    });
  }

  const updateData = { ...req.body };

  // Helper to upload document or photo to Cloudinary
  const uploadDoc = async (val, folder = 'fleetos/vehicles') => {
    if (!val || typeof val !== 'string' || !val.startsWith('data:')) return val || null;
    try {
      const isPdf = val.startsWith('data:application/pdf');
      const uploaded = await uploadToCloudinary(val, {
        folder,
        resource_type: isPdf ? 'raw' : 'auto'
      });
      return uploaded.secure_url;
    } catch (e) {
      console.warn(`Cloudinary upload failed for ${folder}:`, e.message);
      return val;
    }
  };

  // If new base64 photos provided, upload to Cloudinary
  if (updateData.vehiclePhoto && typeof updateData.vehiclePhoto === 'string' && updateData.vehiclePhoto.startsWith('data:')) {
    updateData.vehiclePhoto = await uploadDoc(updateData.vehiclePhoto, 'fleetos/vehicles');
  }
  if (updateData.rcPhoto && typeof updateData.rcPhoto === 'string' && updateData.rcPhoto.startsWith('data:')) {
    updateData.rcPhoto = await uploadDoc(updateData.rcPhoto, 'fleetos/compliance');
  }
  if (updateData.insurancePhoto && typeof updateData.insurancePhoto === 'string' && updateData.insurancePhoto.startsWith('data:')) {
    updateData.insurancePhoto = await uploadDoc(updateData.insurancePhoto, 'fleetos/compliance');
  }
  if (updateData.pollutionPhoto && typeof updateData.pollutionPhoto === 'string' && updateData.pollutionPhoto.startsWith('data:')) {
    updateData.pollutionPhoto = await uploadDoc(updateData.pollutionPhoto, 'fleetos/compliance');
  }
  if (updateData.permitPhoto && typeof updateData.permitPhoto === 'string' && updateData.permitPhoto.startsWith('data:')) {
    updateData.permitPhoto = await uploadDoc(updateData.permitPhoto, 'fleetos/compliance');
  }
  if (updateData.authPhoto && typeof updateData.authPhoto === 'string' && updateData.authPhoto.startsWith('data:')) {
    updateData.authPhoto = await uploadDoc(updateData.authPhoto, 'fleetos/compliance');
  }

  if (updateData.registrationNumber) {
    updateData.registrationNumber = updateData.registrationNumber.trim().toUpperCase().replace(/\s+/g, '');
  }

  if (updateData.type === 'Department') {
    if (updateData.departmentName) {
      updateData.assignedTo = updateData.departmentName.trim();
    }
  } else if (updateData.type === 'Trip-based') {
    updateData.assignedTo = updateData.departmentName?.trim() || 'Booking Fleet';
  }

  const updated = await Vehicle.findOneAndUpdate(query, updateData, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    message: `Vehicle ${updated.registrationNumber} updated successfully!`,
    data: updated
  });
});

export const vehicleController = {
  ...baseVehicleController,
  create: onboardVehicle,
  update: updateVehicle
};
