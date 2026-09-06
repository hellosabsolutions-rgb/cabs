import { DepartmentContract } from '../models/DepartmentContract.js';
import { Vehicle } from '../models/Vehicle.js';
import { Driver } from '../models/Driver.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { createCrudController } from './crudFactory.js';
import mongoose from 'mongoose';

// Base CRUD controller for fallback
const baseContractController = createCrudController(DepartmentContract, [
  'contractNumber',
  'departmentName',
  'contactPerson',
  'phone',
  'vehicle',
  'driverName'
]);

/**
 * @desc    Get all department contracts with search, filter, sorting, pagination
 * @route   GET /api/contracts
 * @access  Public / Private
 */
export const getContracts = asyncHandler(async (req, res) => {
  const { search, status, vehicle, department, sort = '-createdAt', page = 1, limit = 100 } = req.query;

  const filter = {};

  // Search filter
  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim(), 'i');
    filter.$or = [
      { contractNumber: searchRegex },
      { departmentName: searchRegex },
      { contactPerson: searchRegex },
      { phone: searchRegex },
      { vehicle: searchRegex },
      { driverName: searchRegex }
    ];
  }

  // Specific filters
  if (status && status !== 'All') {
    filter.status = status;
  }

  if (vehicle) {
    filter.vehicle = new RegExp(`^${vehicle.trim()}$`, 'i');
  }

  if (department) {
    filter.departmentName = new RegExp(department.trim(), 'i');
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
  const skip = (pageNum - 1) * limitNum;

  const total = await DepartmentContract.countDocuments(filter);
  const docs = await DepartmentContract.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limitNum)
    .lean();

  const data = docs.map(doc => ({
    ...doc,
    id: doc._id.toString()
  }));

  res.status(200).json({
    success: true,
    count: data.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    data
  });
});

/**
 * @desc    Get contract summary statistics
 * @route   GET /api/contracts/stats
 * @access  Public / Private
 */
export const getContractStats = asyncHandler(async (req, res) => {
  const contracts = await DepartmentContract.find({}).lean();

  let active = 0;
  let pendingRenewal = 0;
  let expired = 0;
  let totalMonthlyRevenue = 0;

  contracts.forEach(c => {
    if (c.status === 'Active') {
      active++;
      totalMonthlyRevenue += Number(c.monthlyBaseAmount || 0);
    } else if (c.status === 'Pending Renewal') {
      pendingRenewal++;
    } else if (c.status === 'Expired') {
      expired++;
    }
  });

  res.status(200).json({
    success: true,
    data: {
      totalContracts: contracts.length,
      active,
      pendingRenewal,
      expired,
      totalMonthlyRevenue
    }
  });
});

/**
 * @desc    Get single contract by ID or Contract Number
 * @route   GET /api/contracts/:id
 * @access  Public / Private
 */
export const getContractById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let contract = null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    contract = await DepartmentContract.findById(id).lean();
  }

  if (!contract) {
    contract = await DepartmentContract.findOne({
      $or: [{ contractNumber: id }, { _id: id }]
    }).lean();
  }

  if (!contract) {
    return res.status(404).json({
      success: false,
      error: `Contract not found with identifier '${id}'.`
    });
  }

  res.status(200).json({
    success: true,
    data: {
      ...contract,
      id: contract._id.toString()
    }
  });
});

/**
 * @desc    Create a new department contract
 * @route   POST /api/contracts
 * @access  Public / Private
 */
export const createContract = asyncHandler(async (req, res) => {
  const {
    contractNumber,
    departmentName,
    contactPerson,
    phone,
    vehicle,
    driverName,
    monthlyBaseAmount,
    includedKmPerMonth,
    includedHoursPerMonth,
    extraKmRate,
    extraHourRate,
    startDate,
    endDate,
    status,
    documentFile
  } = req.body;

  // 1. Mandatory Validations
  if (!departmentName || !departmentName.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Department name is required.'
    });
  }

  if (!vehicle || !vehicle.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Vehicle assignment is required for a department contract.'
    });
  }

  const baseAmount = Number(monthlyBaseAmount);
  if (isNaN(baseAmount) || baseAmount <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Monthly base contract amount must be greater than 0.'
    });
  }

  // 2. Generate or sanitize contract number
  const cleanContractNumber = contractNumber && contractNumber.trim()
    ? contractNumber.trim().toUpperCase()
    : `CNT-${new Date().getFullYear()}-${departmentName.replace(/[^A-Za-z0-9]/g, '').substring(0, 4).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;

  // Check if contractNumber already exists
  const existing = await DepartmentContract.findOne({ contractNumber: cleanContractNumber });
  if (existing) {
    return res.status(409).json({
      success: false,
      error: `Contract with number '${cleanContractNumber}' already exists.`
    });
  }

  const cleanVehicle = vehicle.trim().toUpperCase();
  const cleanDriver = driverName && driverName.trim() && driverName !== '—' ? driverName.trim() : '—';
  const cleanStartDate = startDate || new Date().toISOString().split('T')[0];
  const cleanEndDate = endDate || (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  })();

  // 3. Create contract document
  const newContract = await DepartmentContract.create({
    contractNumber: cleanContractNumber,
    departmentName: departmentName.trim(),
    contactPerson: contactPerson ? contactPerson.trim() : 'Officer in Charge',
    phone: phone ? phone.trim() : '—',
    vehicle: cleanVehicle,
    driverName: cleanDriver,
    monthlyBaseAmount: baseAmount,
    includedKmPerMonth: Number(includedKmPerMonth) || 2500,
    includedHoursPerMonth: Number(includedHoursPerMonth) || 250,
    extraKmRate: Number(extraKmRate) || 14,
    extraHourRate: Number(extraHourRate) || 120,
    startDate: cleanStartDate,
    endDate: cleanEndDate,
    status: status || 'Active',
    documentFile: documentFile || null
  });

  // 4. Cross-Entity Synchronization
  // Link vehicle to department duty and driver
  try {
    const vehicleDoc = await Vehicle.findOne({ registrationNumber: cleanVehicle });
    if (vehicleDoc) {
      vehicleDoc.type = 'Department';
      vehicleDoc.departmentName = departmentName.trim();
      vehicleDoc.assignedTo = departmentName.trim();
      if (cleanDriver !== '—') {
        vehicleDoc.assignedDriver = cleanDriver;
      }
      await vehicleDoc.save();
    }

    // If driver specified, update driver's assigned vehicle
    if (cleanDriver !== '—') {
      await Driver.findOneAndUpdate(
        { name: cleanDriver },
        { assignedVehicle: cleanVehicle }
      );
    }
  } catch (syncErr) {
    console.warn('Vehicle/Driver cross sync notice on contract creation:', syncErr.message);
  }

  const contractObj = newContract.toObject();
  contractObj.id = contractObj._id.toString();

  res.status(201).json({
    success: true,
    message: `Contract ${cleanContractNumber} registered successfully.`,
    data: contractObj
  });
});

/**
 * @desc    Update a department contract
 * @route   PUT /api/contracts/:id
 * @access  Public / Private
 */
export const updateContract = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let contract = await DepartmentContract.findById(id);
  if (!contract) {
    contract = await DepartmentContract.findOne({ contractNumber: id });
  }

  if (!contract) {
    return res.status(404).json({
      success: false,
      error: `Contract not found with identifier '${id}'.`
    });
  }

  const allowedUpdates = [
    'contractNumber',
    'departmentName',
    'contactPerson',
    'phone',
    'vehicle',
    'driverName',
    'monthlyBaseAmount',
    'includedKmPerMonth',
    'includedHoursPerMonth',
    'extraKmRate',
    'extraHourRate',
    'startDate',
    'endDate',
    'status',
    'documentFile'
  ];

  const oldVehicle = contract.vehicle;

  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      contract[field] = req.body[field];
    }
  });

  await contract.save();

  // If vehicle was changed, update vehicle associations
  if (req.body.vehicle && req.body.vehicle.trim().toUpperCase() !== oldVehicle) {
    const newVehicle = req.body.vehicle.trim().toUpperCase();
    try {
      await Vehicle.findOneAndUpdate(
        { registrationNumber: newVehicle },
        {
          type: 'Department',
          departmentName: contract.departmentName,
          assignedTo: contract.departmentName,
          ...(contract.driverName && contract.driverName !== '—' ? { assignedDriver: contract.driverName } : {})
        }
      );
    } catch (vErr) {
      console.warn('Vehicle update sync notice:', vErr.message);
    }
  }

  const result = contract.toObject();
  result.id = result._id.toString();

  res.status(200).json({
    success: true,
    message: `Contract ${contract.contractNumber} updated successfully.`,
    data: result
  });
});

/**
 * @desc    Update contract status (Active, Expired, Pending Renewal)
 * @route   PATCH /api/contracts/:id/status
 * @access  Public / Private
 */
export const updateContractStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['Active', 'Expired', 'Pending Renewal'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: `Invalid status '${status}'. Must be one of: ${validStatuses.join(', ')}`
    });
  }

  let contract = await DepartmentContract.findById(id);
  if (!contract) {
    contract = await DepartmentContract.findOne({ contractNumber: id });
  }

  if (!contract) {
    return res.status(404).json({
      success: false,
      error: `Contract not found with identifier '${id}'.`
    });
  }

  contract.status = status;
  await contract.save();

  const result = contract.toObject();
  result.id = result._id.toString();

  res.status(200).json({
    success: true,
    message: `Contract status updated to ${status}.`,
    data: result
  });
});

/**
 * @desc    Delete a department contract
 * @route   DELETE /api/contracts/:id
 * @access  Public / Private
 */
export const deleteContract = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let contract = await DepartmentContract.findById(id);
  if (!contract) {
    contract = await DepartmentContract.findOne({ contractNumber: id });
  }

  if (!contract) {
    return res.status(404).json({
      success: false,
      error: `Contract not found with identifier '${id}'.`
    });
  }

  const contractNumber = contract.contractNumber;
  await DepartmentContract.findByIdAndDelete(contract._id);

  res.status(200).json({
    success: true,
    message: `Contract ${contractNumber} was deleted successfully.`
  });
});
