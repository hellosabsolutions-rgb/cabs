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
    rcPhoto,
    vehiclePhoto,
    insuranceExpiry,
    fitnessExpiry,
    puccExpiry,
    permitExpiry,
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
    rcPhoto: rcPhoto || null,
    vehiclePhoto: vehiclePhoto || null,
    insuranceExpiry,
    fitnessExpiry,
    puccExpiry,
    permitExpiry,
    roadTaxExpiry,
    revenue: calcRev,
    expense: calcExp,
    profit: calcProfit,
    meta: finalMeta,
    agencyId: agencyId || req.user?.currentAgency || undefined
  });

  // 4. Auto-generate Compliance Records if dates provided
  const complianceEntries = [];

  if (insuranceExpiry) {
    complianceEntries.push({
      entityName: cleanReg,
      entityType: 'Vehicle',
      documentName: 'Commercial Insurance Policy',
      expiryDate: insuranceExpiry,
      documentPhoto: rcPhoto || null,
      expiryLabel: 'Annual Policy',
      statusType: 'ok'
    });
  }

  if (fitnessExpiry) {
    complianceEntries.push({
      entityName: cleanReg,
      entityType: 'Vehicle',
      documentName: 'Vehicle Fitness Certificate',
      expiryDate: fitnessExpiry,
      expiryLabel: 'Fitness Test',
      statusType: 'ok'
    });
  }

  if (puccExpiry) {
    complianceEntries.push({
      entityName: cleanReg,
      entityType: 'Vehicle',
      documentName: 'Pollution Under Control (PUCC)',
      expiryDate: puccExpiry,
      expiryLabel: 'Emissions',
      statusType: 'ok'
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
