import { Vehicle } from '../models/Vehicle.js';
import { Compliance } from '../models/Compliance.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
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
  const calcRev = Number(revenue) || (type === 'Department' ? 85000 : 110000);
  const calcExp = Number(expense) || 45000;
  const calcProfit = calcRev - calcExp;

  const finalAssignedTo =
    assignedTo ||
    (type === 'Department'
      ? departmentName || 'Public Works Department (PWD)'
      : hubStand || 'Delhi NCR Stand');

  const finalMeta =
    meta ||
    (type === 'Department'
      ? `${departmentName || finalAssignedTo} Contract Duty`
      : `Trip · ${hubStand || finalAssignedTo}`);

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
    rcPhoto: rcPhoto || null,
    insuranceExpiry: insuranceExpiry || undefined,
    insurancePhoto: insurancePhoto || null,
    pollutionExpiry: pollutionExpiry || puccExpiry || undefined,
    pollutionPhoto: pollutionPhoto || null,
    permitExpiry: permitExpiry || undefined,
    permitPhoto: permitPhoto || null,
    authExpiry: authExpiry || undefined,
    authPhoto: authPhoto || null,
    vehiclePhoto: vehiclePhoto || null,
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

  res.status(201).json({
    success: true,
    message: `Vehicle ${cleanReg} onboarded successfully!`,
    data: vehicle
  });
});

export const vehicleController = {
  ...baseVehicleController,
  create: onboardVehicle
};
