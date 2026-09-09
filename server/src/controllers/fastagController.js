import { FastagTransaction } from '../models/FastagTransaction.js';
import { Vehicle } from '../models/Vehicle.js';
import { Expense } from '../models/Expense.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { emitFastagRecharged, emitLowFastagBalance } from '../services/notificationEmitter.js';
import { uploadToCloudinary } from '../services/cloudinaryService.js';

/**
 * @desc    Get all FASTag transactions with search & filtering
 * @route   GET /api/fastag
 * @access  Public / Private
 */
export const getTransactions = asyncHandler(async (req, res) => {
  const {
    vehicle,
    type,
    status,
    month,
    date,
    search,
    limit = 200,
    page = 1
  } = req.query;

  const query = {};

  if (vehicle && vehicle !== 'All') {
    query.vehicle = vehicle.trim();
  }

  if (type && type !== 'All') {
    query.type = type;
  }

  if (status && status !== 'All') {
    query.status = status;
  }

  if (date) {
    query.date = date;
  } else if (month) {
    // Matches YYYY-MM prefix or month name in date
    query.date = { $regex: new RegExp(month, 'i') };
  }

  if (search && search.trim()) {
    const sRegex = new RegExp(search.trim(), 'i');
    query.$or = [
      { vehicle: sRegex },
      { tagId: sRegex },
      { tollPlaza: sRegex },
      { transactionRef: sRegex },
      { linkedDutyOrTrip: sRegex }
    ];
  }

  const parsedLimit = Math.min(Number(limit) || 200, 500);
  const parsedSkip = (Math.max(Number(page) || 1, 1) - 1) * parsedLimit;

  const [transactions, total] = await Promise.all([
    FastagTransaction.find(query)
      .sort({ date: -1, createdAt: -1 })
      .skip(parsedSkip)
      .limit(parsedLimit)
      .lean(),
    FastagTransaction.countDocuments(query)
  ]);

  const sanitized = transactions.map(tx => ({
    ...tx,
    id: tx._id ? tx._id.toString() : tx.id
  }));

  res.status(200).json({
    success: true,
    total,
    count: sanitized.length,
    data: sanitized
  });
});

/**
 * @desc    Get per-vehicle FASTag summary and fleet-wide KPI metrics
 * @route   GET /api/fastag/per-vehicle
 * @access  Public / Private
 */
export const getPerVehicleSummary = asyncHandler(async (req, res) => {
  const [vehicles, transactions] = await Promise.all([
    Vehicle.find({}).lean(),
    FastagTransaction.find({}).sort({ date: -1, createdAt: -1 }).lean()
  ]);

  let totalFleetBalance = 0;
  let totalTollSpent = 0;
  let lowBalanceCount = 0;

  const vehicleSummaries = vehicles.map(v => {
    const vTxs = transactions.filter(
      tx => tx.vehicle && tx.vehicle.toLowerCase() === v.registrationNumber.toLowerCase()
    );

    const recharges = vTxs.filter(tx => tx.type === 'Recharge');
    const tollDeductions = vTxs.filter(tx => tx.type === 'Toll Deduction');

    const totalTollExpense = tollDeductions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
    const lastRecharge = recharges[0] || null;

    const currentBalance = v.fastagBalance !== undefined ? v.fastagBalance : 0;
    const isLow = currentBalance < 500;

    totalFleetBalance += currentBalance;
    totalTollSpent += totalTollExpense;
    if (isLow) lowBalanceCount++;

    return {
      vehicleReg: v.registrationNumber,
      model: v.model || v.type || 'Vehicle',
      assignedTo: v.assignedTo || 'Unassigned',
      driver: v.assignedDriver || 'Assigned Driver',
      tagId: v.fastagTagId || `34161FA${v.registrationNumber.slice(-4)}`,
      bank: v.fastagBank || 'ICICI Bank FASTag',
      currentBalance,
      isLowBalance: isLow,
      lastRechargeDate: lastRecharge ? lastRecharge.date : 'No recharge logged',
      lastRechargeAmount: lastRecharge ? lastRecharge.amount : 0,
      totalTollExpense,
      transactionsCount: vTxs.length
    };
  });

  res.status(200).json({
    success: true,
    data: {
      vehicleSummaries,
      overallStats: {
        totalFleetBalance,
        totalTollSpent,
        lowBalanceCount,
        totalVehicles: vehicles.length
      }
    }
  });
});

/**
 * @desc    Recharge vehicle FASTag wallet (updates vehicle balance & logs transaction)
 * @route   POST /api/fastag/recharge
 * @access  Public / Private
 */
export const rechargeWallet = asyncHandler(async (req, res) => {
  const {
    vehicle: vehicleInput,
    vehicleReg,
    amount,
    paymentMode = 'Online / UPI',
    proofSlip,
    note
  } = req.body;

  const targetReg = (vehicleInput || vehicleReg || '').trim();
  const rechargeNum = Number(amount);

  if (!targetReg) {
    return res.status(400).json({
      success: false,
      error: 'Vehicle registration number is required for recharge.'
    });
  }

  if (!rechargeNum || rechargeNum <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Recharge amount must be a positive number.'
    });
  }

  // 1. Find Vehicle
  const vehicle = await Vehicle.findOne({
    registrationNumber: { $regex: new RegExp(`^${targetReg}$`, 'i') }
  });

  const prevBalance = vehicle?.fastagBalance || 0;
  const newBalance = prevBalance + rechargeNum;

  if (vehicle) {
    vehicle.fastagBalance = newBalance;
    await vehicle.save();
  }

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  // 2. Upload proof slip to Cloudinary if provided as base64
  let finalProofSlip = proofSlip || null;
  if (proofSlip && typeof proofSlip === 'string' && proofSlip.startsWith('data:')) {
    try {
      const isPdf = proofSlip.startsWith('data:application/pdf');
      const uploaded = await uploadToCloudinary(proofSlip, {
        folder: 'fleetos/receipts',
        resource_type: isPdf ? 'raw' : 'auto'
      });
      finalProofSlip = uploaded.secure_url;
    } catch (err) {
      console.warn('Cloudinary fastag proof upload failed, saving raw:', err.message);
    }
  }

  // 3. Create FASTag Transaction
  const transaction = await FastagTransaction.create({
    vehicle: vehicle ? vehicle.registrationNumber : targetReg,
    tagId: vehicle?.fastagTagId || `34161FA${targetReg.slice(-4)}`,
    type: 'Recharge',
    date: dateStr,
    time: timeStr,
    tollPlaza: `${vehicle?.fastagBank || 'FASTag'} Wallet Recharge (${paymentMode})`,
    amount: rechargeNum,
    balanceAfter: newBalance,
    lane: `${paymentMode} Topup`,
    transactionRef: `REC-${Date.now().toString().slice(-8)}`,
    linkedDutyOrTrip: note || 'Fleet Wallet Topup',
    proofSlip: finalProofSlip,
    status: 'Successful'
  });

  emitFastagRecharged({
    userId: req.user?._id,
    agencyId: req.user?.currentAgency,
    vehicleReg: targetReg,
    amount: rechargeNum
  });

  res.status(201).json({
    success: true,
    message: `₹${rechargeNum.toLocaleString('en-IN')} successfully added to ${targetReg} FASTag wallet.`,
    data: {
      ...transaction.toJSON(),
      id: transaction._id.toString()
    },
    vehicle: vehicle ? vehicle.toJSON() : null
  });
});

/**
 * @desc    Record FASTag toll deduction (deducts vehicle balance, logs transaction & fleet expense)
 * @route   POST /api/fastag/deduct
 * @access  Public / Private
 */
export const deductToll = asyncHandler(async (req, res) => {
  const {
    vehicle: vehicleInput,
    vehicleReg,
    amount,
    tollPlaza,
    lane = 'FASTag ETC Lane',
    date,
    time,
    transactionRef,
    linkedDutyOrTrip,
    proofSlip
  } = req.body;

  const targetReg = (vehicleInput || vehicleReg || '').trim();
  const tollAmount = Number(amount);

  if (!targetReg) {
    return res.status(400).json({
      success: false,
      error: 'Vehicle registration number is required for toll deduction.'
    });
  }

  if (!tollAmount || tollAmount <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Toll deduction amount must be greater than 0.'
    });
  }

  // 1. Find Vehicle & update balance
  const vehicle = await Vehicle.findOne({
    registrationNumber: { $regex: new RegExp(`^${targetReg}$`, 'i') }
  });

  const currentBal = vehicle?.fastagBalance || 0;
  const newBalance = Math.max(0, currentBal - tollAmount);

  if (vehicle) {
    vehicle.fastagBalance = newBalance;
    await vehicle.save();
  }

  const now = new Date();
  const dateStr = date || now.toISOString().split('T')[0];
  const timeStr =
    time ||
    now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  const txRef = transactionRef || `TOLL-${Date.now().toString().slice(-8)}`;
  const plazaName = (tollPlaza || 'Highway Toll Plaza').trim();

  // 2. Create FASTag Transaction
  const transaction = await FastagTransaction.create({
    vehicle: vehicle ? vehicle.registrationNumber : targetReg,
    tagId: vehicle?.fastagTagId || `34161FA${targetReg.slice(-4)}`,
    type: 'Toll Deduction',
    date: dateStr,
    time: timeStr,
    tollPlaza: plazaName,
    lane,
    amount: tollAmount,
    balanceAfter: newBalance,
    transactionRef: txRef,
    linkedDutyOrTrip: linkedDutyOrTrip || 'Toll Plaza Debit',
    proofSlip: proofSlip || null,
    status: 'Successful'
  });

  // 3. Keep Fleet Expenses in sync
  try {
    await Expense.create({
      date: dateStr,
      vehicle: vehicle ? vehicle.registrationNumber : targetReg,
      category: 'FASTag / Toll',
      linkedTo: `${plazaName} (${txRef})`,
      amount: tollAmount
    });
  } catch (expErr) {
    console.warn('Could not auto-create Expense entry for toll deduction:', expErr);
  }

  if (newBalance < 500) {
    emitLowFastagBalance({
      userId: req.user?._id,
      agencyId: req.user?.currentAgency,
      vehicleReg: targetReg,
      balance: newBalance
    });
  }

  res.status(201).json({
    success: true,
    message: `Toll deduction of ₹${tollAmount.toLocaleString('en-IN')} recorded for ${targetReg}.`,
    data: {
      ...transaction.toJSON(),
      id: transaction._id.toString()
    },
    vehicle: vehicle ? vehicle.toJSON() : null
  });
});

/**
 * @desc    Update FASTag details for a vehicle (Balance, Bank, Tag ID)
 * @route   PUT /api/fastag/vehicle/:regNumber
 * @access  Public / Private
 */
export const updateVehicleFastagDetails = asyncHandler(async (req, res) => {
  const { regNumber } = req.params;
  const { balance, bank, tagId } = req.body;

  const vehicle = await Vehicle.findOne({
    registrationNumber: { $regex: new RegExp(`^${regNumber.trim()}$`, 'i') }
  });

  if (!vehicle) {
    return res.status(404).json({
      success: false,
      error: `Vehicle with registration number ${regNumber} not found.`
    });
  }

  if (balance !== undefined) {
    const numBal = Number(balance);
    if (isNaN(numBal) || numBal < 0) {
      return res.status(400).json({
        success: false,
        error: 'FASTag balance must be a non-negative number.'
      });
    }
    vehicle.fastagBalance = numBal;
  }

  if (bank !== undefined) {
    vehicle.fastagBank = bank.trim();
  }

  if (tagId !== undefined) {
    vehicle.fastagTagId = tagId.trim();
  }

  await vehicle.save();

  res.status(200).json({
    success: true,
    message: `FASTag details updated successfully for ${vehicle.registrationNumber}.`,
    data: vehicle.toJSON()
  });
});

/**
 * @desc    Delete a FASTag transaction by ID
 * @route   DELETE /api/fastag/:id
 * @access  Public / Private
 */
export const deleteTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const transaction = await FastagTransaction.findById(id);
  if (!transaction) {
    return res.status(404).json({
      success: false,
      error: 'FASTag transaction not found.'
    });
  }

  await transaction.deleteOne();

  res.status(200).json({
    success: true,
    message: 'FASTag transaction deleted successfully.'
  });
});
