import mongoose from 'mongoose';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { Maintenance } from '../models/Maintenance.js';
import { Expense } from '../models/Expense.js';
import { broadcastAll } from '../services/socketService.js';

/**
 * Get all maintenance records with optional filtering
 */
export const getAllMaintenance = asyncHandler(async (req, res) => {
  const { vehicle, type, status, search } = req.query;
  const filter = {};

  if (vehicle && vehicle !== 'All') filter.vehicle = vehicle;
  if (type && type !== 'All') filter.type = type;
  if (status && status !== 'All') filter.status = status;
  if (search) {
    const searchRegex = new RegExp(search, 'i');
    filter.$or = [
      { vehicle: searchRegex },
      { type: searchRegex },
      { notes: searchRegex },
      { dateLabel: searchRegex }
    ];
  }

  const records = await Maintenance.find(filter).sort({ createdAt: -1, date: -1 }).lean();
  const data = records.map(r => ({
    ...r,
    id: r._id.toString()
  }));

  res.status(200).json({
    success: true,
    count: data.length,
    data
  });
});

/**
 * Get single maintenance record by ID
 */
export const getMaintenanceById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const record = mongoose.Types.ObjectId.isValid(id)
    ? await Maintenance.findById(id).lean()
    : await Maintenance.findOne({ id }).lean();

  if (!record) {
    return res.status(404).json({
      success: false,
      error: `Maintenance record ${id} not found`
    });
  }

  res.status(200).json({
    success: true,
    data: {
      ...record,
      id: record._id.toString()
    }
  });
});

/**
 * Create maintenance record and automatically create a corresponding Expense entry
 */
export const createMaintenance = asyncHandler(async (req, res) => {
  const { date, dateLabel, vehicle, type, tyreCount, cost, bill, status = 'Completed', notes } = req.body;

  if (!vehicle || !date || cost === undefined) {
    return res.status(400).json({
      success: false,
      error: 'Please provide vehicle, date, and cost'
    });
  }

  const numCost = Number(cost) || 0;

  // 1. Create Maintenance record
  const maintenance = await Maintenance.create({
    date,
    dateLabel: dateLabel || date,
    vehicle,
    type,
    tyreCount: type === 'Tyre Change' ? (Number(tyreCount) || 0) : 0,
    cost: numCost,
    bill: bill || null,
    status,
    notes: notes || ''
  });

  const maintenanceData = {
    ...maintenance.toObject(),
    id: maintenance._id.toString()
  };

  // 2. Automatically create linked Expense record so it shows up in Expenses
  let expenseData = null;
  try {
    const expense = await Expense.create({
      date: dateLabel || date,
      vehicle,
      category: 'Maintenance',
      linkedTo: `Maintenance - ${type}`,
      amount: numCost,
      maintenanceId: maintenance._id
    });
    expenseData = {
      ...expense.toObject(),
      id: expense._id.toString()
    };
  } catch (expErr) {
    console.warn('Auto-creating expense for maintenance failed:', expErr.message);
  }

  try {
    broadcastAll('maintenance:created', { action: 'created', data: maintenanceData });
    if (expenseData) {
      broadcastAll('expense:created', { action: 'created', data: expenseData });
    }
  } catch (sErr) {
    console.warn('Socket broadcast failed:', sErr.message);
  }

  res.status(201).json({
    success: true,
    data: maintenanceData,
    expense: expenseData
  });
});

/**
 * Update maintenance record and keep the linked Expense record synchronized
 */
export const updateMaintenance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateFields = { ...req.body };
  delete updateFields._id;
  delete updateFields.id;

  const maintenance = await Maintenance.findByIdAndUpdate(id, updateFields, {
    new: true,
    runValidators: true
  });

  if (!maintenance) {
    return res.status(404).json({
      success: false,
      error: `Maintenance record ${id} not found`
    });
  }

  const maintenanceData = {
    ...maintenance.toObject(),
    id: maintenance._id.toString()
  };

  // Keep associated expense updated
  try {
    const expenseFields = {};
    if (maintenance.date || maintenance.dateLabel) {
      expenseFields.date = maintenance.dateLabel || maintenance.date;
    }
    if (maintenance.vehicle) expenseFields.vehicle = maintenance.vehicle;
    if (maintenance.cost !== undefined) expenseFields.amount = Number(maintenance.cost) || 0;
    if (maintenance.type) expenseFields.linkedTo = `Maintenance - ${maintenance.type}`;

    await Expense.findOneAndUpdate(
      { maintenanceId: maintenance._id },
      { $set: expenseFields },
      { upsert: true }
    );
  } catch (expErr) {
    console.warn('Failed to update linked expense for maintenance:', expErr.message);
  }

  try {
    broadcastAll('maintenance:updated', { action: 'updated', data: maintenanceData });
  } catch (sErr) {}

  res.status(200).json({
    success: true,
    data: maintenanceData
  });
});

/**
 * Delete maintenance record and its associated Expense
 */
export const deleteMaintenance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const maintenance = await Maintenance.findByIdAndDelete(id);

  if (!maintenance) {
    return res.status(404).json({
      success: false,
      error: `Maintenance record ${id} not found`
    });
  }

  // Delete linked expense
  try {
    await Expense.deleteMany({ maintenanceId: maintenance._id });
  } catch (expErr) {
    console.warn('Failed to delete linked expense for maintenance:', expErr.message);
  }

  try {
    broadcastAll('maintenance:deleted', { action: 'deleted', id: maintenance._id.toString() });
  } catch (sErr) {}

  res.status(200).json({
    success: true,
    message: 'Maintenance record and associated expense removed',
    data: {}
  });
});
