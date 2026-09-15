import { MonthlyBill } from '../models/MonthlyBill.js';
import { DailyDutyLog } from '../models/DailyDutyLog.js';
import { DepartmentContract } from '../models/DepartmentContract.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { broadcastAll } from '../services/socketService.js';
import {
  aggregateOfficialDutyLogs,
  calculateMonthlyTenderFinancials
} from '../utils/monthlyBillCalculator.js';
import mongoose from 'mongoose';

function serializeBill(doc) {
  const json = doc?.toObject ? doc.toObject() : { ...doc };
  json.id = json.id || json._id?.toString();
  if (json._id) delete json._id;
  return json;
}

function emitBillEvent(action, bill) {
  broadcastAll(`bill:${action}`, { bill: serializeBill(bill) });
}

/**
 * Helper to compute tax and totals for a bill
 */
export const calculateBillFinancials = (data) => {
  const billType = data.billType || 'Monthly Tender Rent';
  if (billType === 'Weekend / Off-Duty Cash Memo') {
    const baseContractAmount = Number(data.baseContractAmount) || 0;
    const extraKmCost = Number(data.extraKmCost) || 0;
    const extraHoursCost = Number(data.extraHoursCost) || 0;
    const extraDriverAllowance = Number(data.extraDriverAllowance) || 0;
    const fuelCost = Number(data.fuelCost) || 0;
    const nightCost = Number(data.nightCost) || 0;
    const tollParkingCost = Number(data.tollParkingCost) || 0;

    const subtotal =
      baseContractAmount +
      extraKmCost +
      extraHoursCost +
      extraDriverAllowance +
      fuelCost +
      nightCost +
      tollParkingCost;

    const gstRate = Number(data.gstRate) || 0;
    const gstType = data.gstType || 'CGST_SGST';
    const gstTaxableOn = data.gstTaxableOn || 'TOTAL';

    const taxableBase = gstTaxableOn === 'RENT_ONLY' ? baseContractAmount : subtotal;
    const gstAmount = Math.round((taxableBase * gstRate) / 100);

    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (gstRate > 0) {
      if (gstType === 'IGST') {
        igstAmount = gstAmount;
      } else {
        cgstAmount = Math.round(gstAmount / 2);
        sgstAmount = gstAmount - cgstAmount;
      }
    }

    const totalBill = subtotal + gstAmount;
    const paidAmount = Number(data.paidAmount) || 0;
    const balanceDue = Math.max(0, totalBill - paidAmount);

    return {
      subtotal,
      gstRate,
      gstType,
      gstTaxableOn,
      gstAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalBill,
      paidAmount,
      balanceDue
    };
  }

  return calculateMonthlyTenderFinancials(data);
};

async function loadContract(contractId) {
  if (!contractId) return null;
  if (mongoose.Types.ObjectId.isValid(contractId)) {
    return DepartmentContract.findById(contractId);
  }
  return DepartmentContract.findOne({ contractNumber: contractId });
}

async function fetchOfficialLogsForMonth(contract, billingMonth) {
  const monthRegex = new RegExp(`^${billingMonth}`);
  return DailyDutyLog.find({
    departmentName: contract.departmentName,
    vehicle: contract.vehicle,
    dutyType: 'Official Department Duty',
    date: { $regex: monthRegex },
    $and: [
      { $or: [{ billingStatus: 'Unbilled' }, { billingStatus: { $exists: false } }] },
      { $or: [{ monthlyBillId: null }, { monthlyBillId: { $exists: false } }, { monthlyBillId: '' }] }
    ]
  }).lean();
}

async function buildMonthlyPreview({ contractId, billingMonth, gstRate, gstType, gstTaxableOn }) {
  const contract = await loadContract(contractId);
  if (!contract) {
    const err = new Error('Department contract not found.');
    err.statusCode = 404;
    throw err;
  }

  const logs = await fetchOfficialLogsForMonth(contract, billingMonth);
  const agg = aggregateOfficialDutyLogs(logs, contract);

  const dutyStartDate = logs.length ? logs.map((l) => l.date).sort()[0] : `${billingMonth}-01`;
  const dutyEndDate = logs.length ? logs.map((l) => l.date).sort().slice(-1)[0] : `${billingMonth}-28`;

  const financialInput = {
    billType: 'Monthly Tender Rent',
    baseContractAmount: agg.baseContractAmount,
    extraKmCost: agg.extraKmCost,
    extraHoursCost: agg.extraHoursCost,
    extraDriverAllowance: agg.extraDriverAllowance,
    fuelCost: agg.fuelCost,
    nightCount: agg.nightCount,
    nightRate: agg.nightRate,
    nightCost: agg.nightCost,
    tollParkingCost: agg.tollParkingCost,
    totalKmRun: agg.totalKmRun,
    gstRate: gstRate !== undefined ? Number(gstRate) : 5,
    gstType: gstType || 'CGST_SGST',
    gstTaxableOn: gstTaxableOn || 'BASE_AND_NIGHT'
  };

  const financials = calculateMonthlyTenderFinancials(financialInput);

  return {
    contract: serializeBill(contract),
    billingMonth,
    dutyStartDate,
    dutyEndDate,
    logsUsed: agg.logCount,
    dutyLogIds: agg.logIds,
    ...agg,
    ...financials
  };
}

// @desc    Get all monthly bills (with auto-seed if empty)
// @route   GET /api/bills
export const getBills = asyncHandler(async (req, res) => {
  let queryObj = {};

  if (req.query.departmentName && req.query.departmentName !== 'All') {
    queryObj.departmentName = req.query.departmentName;
  }
  if (req.query.billingMonth && req.query.billingMonth !== 'All') {
    queryObj.billingMonth = req.query.billingMonth;
  }
  if (req.query.status && req.query.status !== 'All') {
    queryObj.status = req.query.status;
  }
  if (req.query.billType && req.query.billType !== 'All') {
    queryObj.billType = req.query.billType;
  }
  if (req.query.search) {
    const regex = new RegExp(req.query.search, 'i');
    queryObj.$or = [
      { billNumber: regex },
      { departmentName: regex },
      { vehicle: regex }
    ];
  }

  let count = await MonthlyBill.countDocuments(queryObj);

  const bills = await MonthlyBill.find(queryObj)
    .sort({ createdAt: -1, billingMonth: -1 })
    .lean();

  const data = bills.map(b => ({
    ...b,
    id: b._id.toString()
  }));

  res.status(200).json({
    success: true,
    count: data.length,
    data
  });
});

// @desc    Get monthly billing summary stats
// @route   GET /api/bills/stats
export const getBillStats = asyncHandler(async (req, res) => {
  const bills = await MonthlyBill.find({}).lean();

  let totalBilled = 0;
  let totalPaid = 0;
  let totalPending = 0;
  let totalGstEarned = 0;
  const deptSet = new Set();

  bills.forEach(b => {
    totalBilled += b.totalBill || 0;
    totalPaid += b.paidAmount || 0;
    totalPending += b.balanceDue || 0;
    totalGstEarned += b.gstAmount || 0;
    if (b.departmentName) deptSet.add(b.departmentName);
  });

  res.status(200).json({
    success: true,
    stats: {
      totalBilled,
      totalPaid,
      totalPending,
      totalGstEarned,
      totalBills: bills.length,
      clientDepartments: deptSet.size
    }
  });
});

// @desc    Get single bill by ID
// @route   GET /api/bills/:id
export const getBillById = asyncHandler(async (req, res) => {
  const bill = await MonthlyBill.findById(req.params.id);
  if (!bill) {
    return res.status(404).json({ success: false, error: 'Bill not found' });
  }
  res.status(200).json({ success: true, data: bill });
});

// @desc    Create new monthly bill
// @route   POST /api/bills
export const createBill = asyncHandler(async (req, res) => {
  const financials = calculateBillFinancials(req.body);

  const billData = {
    ...req.body,
    ...financials
  };

  const newBill = await MonthlyBill.create(billData);
  emitBillEvent('created', newBill);

  // If this bill is generated from a Weekend Duty Log, link and update it
  if (req.body.dailyDutyLogId) {
    try {
      await DailyDutyLog.findByIdAndUpdate(req.body.dailyDutyLogId, {
        billingStatus: 'Billed',
        weekendBillNumber: newBill.billNumber,
        weekendBillId: newBill._id.toString()
      });
    } catch (linkErr) {
      console.warn('Could not link dailyDutyLog to bill:', linkErr);
    }
  }

  res.status(201).json({
    success: true,
    data: newBill
  });
});

// @desc    Update monthly bill
// @route   PUT /api/bills/:id
export const updateBill = asyncHandler(async (req, res) => {
  let bill = await MonthlyBill.findById(req.params.id);
  if (!bill) {
    return res.status(404).json({ success: false, error: 'Bill not found' });
  }

  if (bill.locked && !req.body.adminOverride) {
    return res.status(403).json({
      success: false,
      error: 'This invoice is locked after generation. Unlock with admin override to edit line items.'
    });
  }

  const merged = { ...bill.toObject(), ...req.body };
  const financials = calculateBillFinancials(merged);

  Object.assign(bill, req.body, financials);
  await bill.save();
  emitBillEvent('updated', bill);

  res.status(200).json({
    success: true,
    data: bill
  });
});

// @desc    Update bill status (Quick action)
// @route   PATCH or PUT /api/bills/:id/status
export const updateBillStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const bill = await MonthlyBill.findById(req.params.id);

  if (!bill) {
    return res.status(404).json({ success: false, error: 'Bill not found' });
  }

  bill.status = status;
  if (status === 'Paid') {
    bill.paidAmount = bill.totalBill;
    bill.balanceDue = 0;
  } else if (status === 'Sent' || status === 'Pending') {
    if (bill.paidAmount >= bill.totalBill) {
      bill.paidAmount = 0;
      bill.balanceDue = bill.totalBill;
    }
  }

  await bill.save();
  emitBillEvent('updated', bill);

  res.status(200).json({
    success: true,
    data: bill
  });
});

// @desc    Preview monthly tender bill from duty logs + contract
// @route   POST /api/bills/preview-monthly
export const previewMonthlyBill = asyncHandler(async (req, res) => {
  const { contractId, billingMonth, gstRate, gstType, gstTaxableOn } = req.body;
  if (!contractId || !billingMonth) {
    return res.status(400).json({ success: false, error: 'contractId and billingMonth (YYYY-MM) are required.' });
  }

  const preview = await buildMonthlyPreview({ contractId, billingMonth, gstRate, gstType, gstTaxableOn });
  res.status(200).json({ success: true, data: preview });
});

// @desc    Generate & lock monthly tender bill from duty logs
// @route   POST /api/bills/generate-monthly
export const generateMonthlyBill = asyncHandler(async (req, res) => {
  const {
    contractId,
    billingMonth,
    gstRate,
    gstType,
    gstTaxableOn,
    status = 'Sent',
    dueDate,
    partyGstin,
    billNumber: customBillNumber,
    extraDriverAllowance = 0
  } = req.body;

  if (!contractId || !billingMonth) {
    return res.status(400).json({ success: false, error: 'contractId and billingMonth (YYYY-MM) are required.' });
  }

  const contract = await loadContract(contractId);
  if (!contract) {
    return res.status(404).json({ success: false, error: 'Department contract not found.' });
  }

  const duplicate = await MonthlyBill.findOne({
    contractId: contract._id.toString(),
    billingMonth,
    billType: 'Monthly Tender Rent'
  });
  if (duplicate) {
    return res.status(409).json({
      success: false,
      error: `Invoice already exists for ${contract.departmentName} in ${billingMonth}.`,
      data: serializeBill(duplicate)
    });
  }

  const preview = await buildMonthlyPreview({ contractId, billingMonth, gstRate, gstType, gstTaxableOn });
  if (preview.logsUsed === 0) {
    return res.status(400).json({
      success: false,
      error: 'No unbilled official duty logs found for this contract and month.'
    });
  }

  const billNumber =
    customBillNumber?.trim() ||
    `INV-${billingMonth}-${contract.departmentName.substring(0, 3).toUpperCase()}-${contract.vehicle.replace(/\s+/g, '').slice(-4)}`;

  const financialInput = {
    billType: 'Monthly Tender Rent',
    baseContractAmount: preview.baseContractAmount,
    extraKmCost: preview.extraKmCost,
    extraHoursCost: preview.extraHoursCost,
    extraDriverAllowance: Number(extraDriverAllowance) || 0,
    fuelCost: 0,
    nightCount: preview.nightCount,
    nightRate: preview.nightRate,
    nightCost: preview.nightCost,
    tollParkingCost: preview.tollParkingCost,
    gstRate: preview.gstRate,
    gstType: preview.gstType,
    gstTaxableOn: preview.gstTaxableOn,
    paidAmount: status === 'Paid' ? preview.totalBill : 0
  };
  const financials = calculateMonthlyTenderFinancials(financialInput);

  const due =
    dueDate ||
    (() => {
      const d = new Date();
      d.setDate(d.getDate() + 15);
      return d.toISOString().split('T')[0];
    })();

  const newBill = await MonthlyBill.create({
    billNumber,
    billType: 'Monthly Tender Rent',
    contractId: contract._id.toString(),
    dutyLogIds: preview.dutyLogIds,
    departmentName: contract.departmentName,
    vehicle: contract.vehicle,
    billingMonth,
    dutyStartDate: preview.dutyStartDate,
    dutyEndDate: preview.dutyEndDate,
    baseContractAmount: preview.baseContractAmount,
    totalKmRun: preview.totalKmRun,
    extraKmCost: preview.extraKmCost,
    extraHoursCost: preview.extraHoursCost,
    extraDriverAllowance: Number(extraDriverAllowance) || 0,
    fuelCost: 0,
    nightCount: preview.nightCount,
    nightRate: preview.nightRate,
    nightCost: preview.nightCost,
    tollParkingCost: preview.tollParkingCost,
    partyGstin: partyGstin || null,
    status,
    dueDate: due,
    locked: true,
    lockedAt: new Date(),
    lockReason: 'Auto-locked on monthly generation',
    ...financials,
    balanceDue: status === 'Paid' ? 0 : financials.totalBill
  });

  if (preview.dutyLogIds.length) {
    await DailyDutyLog.updateMany(
      { _id: { $in: preview.dutyLogIds } },
      {
        $set: {
          billingStatus: 'Billed',
          monthlyBillId: newBill._id.toString()
        }
      }
    );
  }

  emitBillEvent('created', newBill);

  res.status(201).json({
    success: true,
    message: `Invoice ${billNumber} generated from ${preview.logsUsed} duty logs.`,
    data: newBill
  });
});

// @desc    Unlock a locked bill (admin override)
// @route   POST /api/bills/:id/unlock
export const unlockBill = asyncHandler(async (req, res) => {
  const bill = await MonthlyBill.findById(req.params.id);
  if (!bill) {
    return res.status(404).json({ success: false, error: 'Bill not found' });
  }
  bill.locked = false;
  bill.lockReason = req.body.reason || 'Unlocked by admin';
  await bill.save();
  emitBillEvent('updated', bill);
  res.status(200).json({ success: true, data: bill });
});

// @desc    Apply GST rate across multiple/all bills
// @route   POST /api/bills/apply-gst
export const applyGstBulk = asyncHandler(async (req, res) => {
  const { gstRate, gstType = 'CGST_SGST', gstTaxableOn = 'BASE_AND_NIGHT', departmentName } = req.body;

  const rate = Number(gstRate);
  if (isNaN(rate) || rate < 0) {
    return res.status(400).json({ success: false, error: 'Valid GST rate is required' });
  }

  const filter = {};
  if (departmentName && departmentName !== 'All') {
    filter.departmentName = departmentName;
  }

  const bills = await MonthlyBill.find(filter);
  const updatedBills = [];

  for (const bill of bills) {
    if (bill.locked) continue;
    const merged = {
      ...bill.toObject(),
      gstRate: rate,
      gstType,
      gstTaxableOn
    };
    const financials = calculateBillFinancials(merged);
    Object.assign(bill, financials);
    bill.gstRate = rate;
    bill.gstType = gstType;
    bill.gstTaxableOn = gstTaxableOn;
    if (bill.status === 'Paid') {
      bill.paidAmount = bill.totalBill;
      bill.balanceDue = 0;
    }
    await bill.save();
    emitBillEvent('updated', bill);
    updatedBills.push(bill);
  }

  res.status(200).json({
    success: true,
    message: `Applied ${rate}% GST to ${updatedBills.length} invoices.`,
    updatedCount: updatedBills.length,
    data: updatedBills
  });
});

// @desc    Generate Weekend Cash Memo Bill from Daily Duty Log
// @route   POST /api/bills/weekend-memo
export const generateWeekendBillFromLog = asyncHandler(async (req, res) => {
  const { dailyDutyLogId } = req.body;
  if (!dailyDutyLogId) {
    return res.status(400).json({ success: false, error: 'dailyDutyLogId is required' });
  }

  const log = await DailyDutyLog.findById(dailyDutyLogId);
  if (!log) {
    return res.status(404).json({ success: false, error: 'Daily duty log not found' });
  }

  // If already billed, find existing bill
  if (log.weekendBillId) {
    const existing = await MonthlyBill.findById(log.weekendBillId);
    if (existing) {
      return res.status(200).json({ success: true, message: 'Bill already exists', data: existing });
    }
  }

  // Calculate pricing
  const basePrice = Number(log.packageBasePrice) || 2255;
  const freeKm = Number(log.packageFreeKm) || 80;
  const totalKm = Number(log.totalKm) || Math.max(0, (log.endKm || 0) - (log.startKm || 0));
  const extraKm = Math.max(0, totalKm - freeKm);
  const extraKmRate = Number(log.extraKmRate) || 14;
  const extraKmCost = log.extraKmCost ?? (extraKm * extraKmRate);
  const tollParking = Number(log.tollParkingAmount) || 0;
  const extraFuel = Number(log.extraFuelCost || log.fuelAmount) || 0;

  const subtotal = log.subtotal || (basePrice + extraKmCost + tollParking + extraFuel);
  const gstRate = log.gstRate !== undefined ? Number(log.gstRate) : 5;
  const gstAmount = log.gstAmount !== undefined ? Number(log.gstAmount) : Math.round((subtotal * gstRate) / 100);
  const totalBill = log.totalFare && log.totalFare > 0 ? log.totalFare : (subtotal + gstAmount);

  const billNumber = log.dutySlipNumber.match(/^\d+$/) ? log.dutySlipNumber : `MEMO-${log.dutySlipNumber}`;

  // Create Bill in database
  const newBill = await MonthlyBill.create({
    billNumber,
    billType: 'Weekend / Off-Duty Cash Memo',
    dailyDutyLogId: log._id.toString(),
    departmentName: log.departmentName,
    vehicle: log.vehicle,
    billingMonth: log.month || '2026-08',
    dutyStartDate: log.date,
    dutyEndDate: log.date,
    baseContractAmount: basePrice,
    packageFreeKm: freeKm,
    extraKmRate,
    totalKmRun: totalKm,
    extraKmCost,
    extraHoursCost: 0,
    fuelCost: extraFuel,
    tollParkingCost: tollParking,
    subtotal,
    gstRate,
    gstType: 'CGST_SGST',
    gstTaxableOn: 'TOTAL',
    gstAmount,
    cgstAmount: Math.round(gstAmount / 2),
    sgstAmount: gstAmount - Math.round(gstAmount / 2),
    igstAmount: 0,
    partyGstin: '05AAAGB1234F1Z5',
    totalBill,
    paidAmount: totalBill,
    balanceDue: 0,
    status: 'Paid',
    dueDate: log.date,
    journeyFrom: log.journeyFrom || 'D.Dun Bangarawali',
    journeyTo: log.journeyTo || log.tripDestination || 'Vikasnagar & Local to D.Dun',
    invoicePdf: `cashmemo_${billNumber}.pdf`
  });

  // Update DailyDutyLog
  log.billingStatus = 'Billed';
  log.weekendBillNumber = billNumber;
  log.weekendBillId = newBill._id.toString();
  await log.save();

  emitBillEvent('created', newBill);

  res.status(201).json({
    success: true,
    message: `Cash Memo #${billNumber} issued successfully`,
    data: newBill
  });
});

// @desc    Delete monthly bill
// @route   DELETE /api/bills/:id
export const deleteBill = asyncHandler(async (req, res) => {
  const bill = await MonthlyBill.findById(req.params.id);
  if (!bill) {
    return res.status(404).json({ success: false, error: 'Bill not found' });
  }

  if (bill.locked && bill.billType === 'Monthly Tender Rent') {
    return res.status(403).json({
      success: false,
      error: 'Locked monthly invoices cannot be deleted. Unlock first if you must remove it.'
    });
  }

  if (bill.dailyDutyLogId) {
    try {
      await DailyDutyLog.findByIdAndUpdate(bill.dailyDutyLogId, {
        billingStatus: 'Unbilled',
        weekendBillNumber: null,
        weekendBillId: null
      });
    } catch (resetErr) {
      console.warn('Could not reset dailyDutyLog billing status', resetErr);
    }
  }

  if (Array.isArray(bill.dutyLogIds) && bill.dutyLogIds.length) {
    await DailyDutyLog.updateMany(
      { _id: { $in: bill.dutyLogIds } },
      { $set: { billingStatus: 'Unbilled', monthlyBillId: null } }
    );
  }

  const payload = serializeBill(bill);
  await bill.deleteOne();
  emitBillEvent('deleted', payload);
  res.status(200).json({ success: true, message: 'Invoice deleted successfully' });
});
