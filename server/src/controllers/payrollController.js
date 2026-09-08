import { Driver } from '../models/Driver.js';
import { DriverAdvance } from '../models/DriverAdvance.js';
import { DriverPenalty } from '../models/DriverPenalty.js';
import { DriverPayrollSettlement } from '../models/DriverPayrollSettlement.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import mongoose from 'mongoose';

/**
 * Helper to get current YYYY-MM
 */
const getCurrentMonth = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

/**
 * Robust helper to find driver by MongoDB _id, custom id, or name
 */
export const findDriverByIdOrAny = async (driverId) => {
  if (!driverId) return null;
  let driver = null;
  if (mongoose.Types.ObjectId.isValid(driverId)) {
    driver = await Driver.findById(driverId);
  }
  if (!driver) {
    driver = await Driver.findOne({ id: driverId });
  }
  if (!driver) {
    driver = await Driver.findOne({ name: new RegExp(`^${driverId}$`, 'i') });
  }
  return driver;
};

/**
 * @desc    Get payroll summary for all drivers for a specific month
 * @route   GET /api/payroll/summary?month=YYYY-MM
 * @access  Public / Private
 */
export const getPayrollSummary = asyncHandler(async (req, res) => {
  const month = req.query.month || getCurrentMonth();
  const agencyId = req.user?.agencyId;

  const driverFilter = agencyId ? { agencyId } : {};
  const drivers = await Driver.find(driverFilter).sort({ name: 1 });

  // Fetch all active advances, active penalties, and current month settlements
  const driverIds = drivers.map(d => d._id.toString());
  const driverNames = drivers.map(d => d.name);

  const [activeAdvances, activePenalties, settlements] = await Promise.all([
    DriverAdvance.find({
      $or: [
        { driverId: { $in: driverIds } },
        { driverName: { $in: driverNames } }
      ]
    }),
    DriverPenalty.find({
      $or: [
        { driverId: { $in: driverIds } },
        { driverName: { $in: driverNames } }
      ]
    }),
    DriverPayrollSettlement.find({
      $or: [
        { driverId: { $in: driverIds }, month },
        { driverName: { $in: driverNames }, month }
      ]
    })
  ]);

  // Index by driverId and driverName
  const settlementsByDriver = new Map();
  settlements.forEach(s => {
    settlementsByDriver.set(s.driverId, s);
    if (s.driverName) settlementsByDriver.set(s.driverName, s);
  });

  const advancesByDriver = new Map();
  activeAdvances.forEach(adv => {
    const key = adv.driverId;
    if (!advancesByDriver.has(key)) advancesByDriver.set(key, []);
    advancesByDriver.get(key).push(adv);

    if (adv.driverName && adv.driverName !== key) {
      if (!advancesByDriver.has(adv.driverName)) advancesByDriver.set(adv.driverName, []);
      advancesByDriver.get(adv.driverName).push(adv);
    }
  });

  const penaltiesByDriver = new Map();
  activePenalties.forEach(pen => {
    const key = pen.driverId;
    if (!penaltiesByDriver.has(key)) penaltiesByDriver.set(key, []);
    penaltiesByDriver.get(key).push(pen);

    if (pen.driverName && pen.driverName !== key) {
      if (!penaltiesByDriver.has(pen.driverName)) penaltiesByDriver.set(pen.driverName, []);
      penaltiesByDriver.get(pen.driverName).push(pen);
    }
  });

  const summary = drivers.map(driver => {
    const id = driver._id.toString();
    const settlement = settlementsByDriver.get(id) || settlementsByDriver.get(driver.name) || null;
    const isSettled = !!settlement && settlement.paymentStatus === 'PAID';

    const driverAdvances = advancesByDriver.get(id) || advancesByDriver.get(driver.name) || [];
    const driverPenalties = penaltiesByDriver.get(id) || penaltiesByDriver.get(driver.name) || [];

    // Active advances (or those settled in this month if settled)
    const activeAdvList = isSettled
      ? driverAdvances.filter(a => a.settledInMonth === month)
      : driverAdvances.filter(a => a.status === 'ACTIVE');

    const activePenList = isSettled
      ? driverPenalties.filter(p => p.settledInMonth === month)
      : driverPenalties.filter(p => p.status === 'ACTIVE');

    const advanceBalance = isSettled
      ? settlement.advancesDeducted || 0
      : activeAdvList.reduce((sum, a) => sum + (a.amount || 0), 0);

    const challanBalance = isSettled
      ? settlement.challansDeducted || 0
      : activePenList.reduce((sum, p) => sum + (p.amount || 0), 0);

    const baseSalary = driver.monthlySalary || 0;
    const netPayable = isSettled
      ? settlement.netPaid
      : Math.max(0, baseSalary - advanceBalance - challanBalance);

    let status = 'DUE';
    if (isSettled) {
      status = 'PAID';
    } else if (advanceBalance > 0) {
      status = 'ADVANCE RUNNING';
    } else {
      status = 'DUE';
    }

    return {
      driverId: id,
      name: driver.name,
      phone: driver.phone,
      photo: driver.photo,
      assignedVehicle: driver.assignedVehicle || '—',
      driverType: driver.driverType || 'Full Time',
      joiningDate: driver.joiningDate,
      monthlySalary: baseSalary,
      advanceBalance,
      challanBalance,
      netPayable,
      status,
      settlement: settlement
        ? {
            id: settlement._id.toString(),
            month: settlement.month,
            paidAmount: settlement.netPaid,
            paymentMode: settlement.paymentMode,
            paymentDate: settlement.paymentDate,
            remarks: settlement.remarks
          }
        : null,
      advances: activeAdvList.map(a => ({
        id: a._id.toString(),
        amount: a.amount,
        date: a.date,
        reason: a.reason,
        paymentMode: a.paymentMode,
        status: a.status
      })),
      challans: activePenList.map(p => ({
        id: p._id.toString(),
        amount: p.amount,
        date: p.date,
        reason: p.reason,
        challanNumber: p.challanNumber,
        status: p.status
      }))
    };
  });

  res.status(200).json({
    success: true,
    month,
    count: summary.length,
    data: summary
  });
});

/**
 * @desc    Record advance given to a driver
 * @route   POST /api/payroll/advance
 * @access  Public / Private
 */
export const recordAdvance = asyncHandler(async (req, res) => {
  const { driverId, amount, date, paymentMode, reason, remarks } = req.body;

  if (!driverId) {
    return res.status(400).json({ success: false, error: 'Driver is required' });
  }

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ success: false, error: 'Valid advance amount is required' });
  }

  // Find driver
  const driver = await findDriverByIdOrAny(driverId);
  if (!driver) {
    return res.status(404).json({ success: false, error: 'Driver not found' });
  }

  const advance = await DriverAdvance.create({
    driverId: driver._id.toString(),
    driverName: driver.name,
    amount: numAmount,
    date: date || new Date().toISOString().split('T')[0],
    paymentMode: paymentMode || 'Cash',
    reason: reason || 'Personal Advance',
    remarks: remarks || '',
    status: 'ACTIVE',
    agencyId: driver.agencyId
  });

  res.status(201).json({
    success: true,
    message: `Advance of ₹${numAmount.toLocaleString('en-IN')} recorded for ${driver.name}`,
    data: advance
  });
});

/**
 * @desc    Record challan / penalty for a driver
 * @route   POST /api/payroll/penalty
 * @access  Public / Private
 */
export const recordPenalty = asyncHandler(async (req, res) => {
  const { driverId, amount, date, challanNumber, reason, vehicle } = req.body;

  if (!driverId) {
    return res.status(400).json({ success: false, error: 'Driver is required' });
  }

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ success: false, error: 'Valid penalty amount is required' });
  }

  const driver = await findDriverByIdOrAny(driverId);
  if (!driver) {
    return res.status(404).json({ success: false, error: 'Driver not found' });
  }

  const penalty = await DriverPenalty.create({
    driverId: driver._id.toString(),
    driverName: driver.name,
    vehicle: vehicle || driver.assignedVehicle || '—',
    challanNumber: challanNumber || '',
    amount: numAmount,
    date: date || new Date().toISOString().split('T')[0],
    reason: reason || 'Traffic Challan',
    status: 'ACTIVE',
    agencyId: driver.agencyId
  });

  res.status(201).json({
    success: true,
    message: `Challan of ₹${numAmount.toLocaleString('en-IN')} recorded for ${driver.name}`,
    data: penalty
  });
});

/**
 * @desc    Mark salary as paid (settle monthly salary)
 * @route   POST /api/payroll/settle
 * @access  Public / Private
 */
export const settleSalary = asyncHandler(async (req, res) => {
  const { driverId, month, paymentMode, paymentDate, remarks } = req.body;

  if (!driverId) {
    return res.status(400).json({ success: false, error: 'Driver is required' });
  }

  const settleMonth = month || getCurrentMonth();
  const driver = await findDriverByIdOrAny(driverId);
  if (!driver) {
    return res.status(404).json({ success: false, error: 'Driver not found' });
  }

  const strDriverId = driver._id.toString();

  // Find all currently active advances and penalties for this driver
  const [activeAdvances, activePenalties] = await Promise.all([
    DriverAdvance.find({
      $or: [
        { driverId: strDriverId },
        { driverName: driver.name },
        { driverId: driver.id }
      ],
      status: 'ACTIVE'
    }),
    DriverPenalty.find({
      $or: [
        { driverId: strDriverId },
        { driverName: driver.name },
        { driverId: driver.id }
      ],
      status: 'ACTIVE'
    })
  ]);

  const advancesDeducted = activeAdvances.reduce((sum, a) => sum + (a.amount || 0), 0);
  const challansDeducted = activePenalties.reduce((sum, p) => sum + (p.amount || 0), 0);
  const baseSalary = driver.monthlySalary || 0;
  const netPaid = Math.max(0, baseSalary - advancesDeducted - challansDeducted);

  const advanceIds = activeAdvances.map(a => a._id.toString());
  const penaltyIds = activePenalties.map(p => p._id.toString());

  // Mark all deducted advances and penalties as SETTLED for this month
  if (advanceIds.length > 0) {
    await DriverAdvance.updateMany(
      { _id: { $in: advanceIds } },
      { $set: { status: 'SETTLED', settledInMonth: settleMonth } }
    );
  }

  if (penaltyIds.length > 0) {
    await DriverPenalty.updateMany(
      { _id: { $in: penaltyIds } },
      { $set: { status: 'SETTLED', settledInMonth: settleMonth } }
    );
  }

  const settlement = await DriverPayrollSettlement.findOneAndUpdate(
    { driverId: strDriverId, month: settleMonth },
    {
      driverId: strDriverId,
      driverName: driver.name,
      month: settleMonth,
      baseSalary,
      advancesDeducted,
      challansDeducted,
      netPaid,
      paymentMode: paymentMode || 'Cash',
      paymentDate: paymentDate || new Date().toISOString().split('T')[0],
      paymentStatus: 'PAID',
      remarks: remarks || '',
      deductedAdvanceIds: advanceIds,
      deductedPenaltyIds: penaltyIds,
      settledAt: new Date(),
      agencyId: driver.agencyId
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.status(200).json({
    success: true,
    message: `Salary for ${driver.name} marked as PAID for ${settleMonth}`,
    data: settlement
  });
});

/**
 * @desc    Unsettle / revert salary payment to DUE
 * @route   POST /api/payroll/unsettle
 * @access  Public / Private
 */
export const unsettleSalary = asyncHandler(async (req, res) => {
  const { driverId, month } = req.body;

  if (!driverId) {
    return res.status(400).json({ success: false, error: 'Driver is required' });
  }

  const settleMonth = month || getCurrentMonth();
  const driver = await findDriverByIdOrAny(driverId);
  if (!driver) {
    return res.status(404).json({ success: false, error: 'Driver not found' });
  }

  const strDriverId = driver._id.toString();

  // Find settlement
  const settlement = await DriverPayrollSettlement.findOne({
    $or: [{ driverId: strDriverId, month: settleMonth }, { driverName: driver.name, month: settleMonth }]
  });

  if (settlement) {
    // Restore advances deducted in this settlement back to ACTIVE
    if (settlement.deductedAdvanceIds && settlement.deductedAdvanceIds.length > 0) {
      await DriverAdvance.updateMany(
        { _id: { $in: settlement.deductedAdvanceIds } },
        { $set: { status: 'ACTIVE', settledInMonth: null } }
      );
    } else {
      await DriverAdvance.updateMany(
        { driverId: strDriverId, settledInMonth: settleMonth },
        { $set: { status: 'ACTIVE', settledInMonth: null } }
      );
    }

    // Restore penalties deducted in this settlement back to ACTIVE
    if (settlement.deductedPenaltyIds && settlement.deductedPenaltyIds.length > 0) {
      await DriverPenalty.updateMany(
        { _id: { $in: settlement.deductedPenaltyIds } },
        { $set: { status: 'ACTIVE', settledInMonth: null } }
      );
    } else {
      await DriverPenalty.updateMany(
        { driverId: strDriverId, settledInMonth: settleMonth },
        { $set: { status: 'ACTIVE', settledInMonth: null } }
      );
    }

    await DriverPayrollSettlement.deleteOne({ _id: settlement._id });
  }

  res.status(200).json({
    success: true,
    message: `Salary payment for ${driver.name} reverted to DUE for ${settleMonth}`
  });
});

/**
 * @desc    Get detailed payroll history for a driver
 * @route   GET /api/payroll/driver/:driverId?month=YYYY-MM
 * @access  Public / Private
 */
export const getDriverPayrollDetail = asyncHandler(async (req, res) => {
  const { driverId } = req.params;
  const month = req.query.month || getCurrentMonth();

  const driver = await findDriverByIdOrAny(driverId);
  if (!driver) {
    return res.status(404).json({ success: false, error: 'Driver not found' });
  }

  const strDriverId = driver._id.toString();

  const [advances, penalties, settlements] = await Promise.all([
    DriverAdvance.find({
      $or: [{ driverId: strDriverId }, { driverName: driver.name }, { driverId: driver.id }]
    }).sort({ date: -1, createdAt: -1 }),
    DriverPenalty.find({
      $or: [{ driverId: strDriverId }, { driverName: driver.name }, { driverId: driver.id }]
    }).sort({ date: -1, createdAt: -1 }),
    DriverPayrollSettlement.find({
      $or: [{ driverId: strDriverId }, { driverName: driver.name }, { driverId: driver.id }]
    }).sort({ month: -1, createdAt: -1 })
  ]);

  // Current month settlement if any
  const monthSettlement = settlements.find(s => s.month === month) || null;
  const isSettled = !!monthSettlement && monthSettlement.paymentStatus === 'PAID';

  // Active advances / penalties for this month
  const activeAdvList = isSettled
    ? advances.filter(a => a.settledInMonth === month)
    : advances.filter(a => a.status === 'ACTIVE');

  const activePenList = isSettled
    ? penalties.filter(p => p.settledInMonth === month)
    : penalties.filter(p => p.status === 'ACTIVE');

  const advanceBalance = isSettled
    ? monthSettlement.advancesDeducted || 0
    : activeAdvList.reduce((sum, a) => sum + (a.amount || 0), 0);

  const challanBalance = isSettled
    ? monthSettlement.challansDeducted || 0
    : activePenList.reduce((sum, p) => sum + (p.amount || 0), 0);

  const baseSalary = driver.monthlySalary || 0;
  const netPayable = isSettled
    ? monthSettlement.netPaid
    : Math.max(0, baseSalary - advanceBalance - challanBalance);

  let status = 'DUE';
  if (isSettled) {
    status = 'PAID';
  } else if (advanceBalance > 0) {
    status = 'ADVANCE RUNNING';
  } else {
    status = 'DUE';
  }

  // Build combined full ledger
  const ledger = [];

  // 1. Base salary entry for current cycle
  ledger.push({
    id: `salary_${month}`,
    type: 'SALARY',
    date: 'This cycle',
    entryLabel: 'SALARY',
    note: 'Earned this month',
    amount: baseSalary,
    rawAmount: baseSalary,
    isDeduction: false,
    dateRaw: `${month}-01`
  });

  // 2. Advances
  advances.forEach(adv => {
    ledger.push({
      id: adv._id.toString(),
      type: 'ADVANCE',
      date: adv.date,
      entryLabel: 'ADVANCE',
      note: adv.reason || adv.remarks || 'Advance payout',
      amount: adv.amount,
      rawAmount: -adv.amount,
      isDeduction: true,
      status: adv.status,
      paymentMode: adv.paymentMode,
      dateRaw: adv.date,
      item: adv
    });
  });

  // 3. Penalties
  penalties.forEach(pen => {
    ledger.push({
      id: pen._id.toString(),
      type: 'PENALTY',
      date: pen.date,
      entryLabel: 'PENALTY',
      note: pen.reason + (pen.challanNumber ? `, e-challan #${pen.challanNumber}` : ''),
      amount: pen.amount,
      rawAmount: -pen.amount,
      isDeduction: true,
      status: pen.status,
      challanNumber: pen.challanNumber,
      vehicle: pen.vehicle,
      dateRaw: pen.date,
      item: pen
    });
  });

  // 4. Past & current settlements / payments
  settlements.forEach(s => {
    ledger.push({
      id: s._id.toString(),
      type: 'PAID',
      date: s.paymentDate || s.month,
      entryLabel: 'PAID',
      note: `Covers ${s.month} · ${s.paymentMode || 'Cash'}`,
      amount: s.netPaid,
      rawAmount: s.netPaid,
      isDeduction: false,
      status: s.paymentStatus,
      paymentMode: s.paymentMode,
      remarks: s.remarks,
      dateRaw: s.paymentDate || `${s.month}-28`,
      item: s
    });
  });

  // Sort ledger by date descending (keep 'This cycle' at top)
  ledger.sort((a, b) => {
    if (a.date === 'This cycle') return -1;
    if (b.date === 'This cycle') return 1;
    return new Date(b.dateRaw).getTime() - new Date(a.dateRaw).getTime();
  });

  res.status(200).json({
    success: true,
    data: {
      driver: {
        id: strDriverId,
        name: driver.name,
        phone: driver.phone,
        photo: driver.photo,
        assignedVehicle: driver.assignedVehicle || '—',
        driverType: driver.driverType,
        joiningDate: driver.joiningDate,
        monthlySalary: baseSalary
      },
      summary: {
        month,
        baseSalary,
        advanceBalance,
        challanBalance,
        netPayable,
        status,
        settlement: monthSettlement
      },
      advances,
      penalties,
      settlements,
      ledger
    }
  });
});

/**
 * @desc    Update an existing advance
 * @route   PUT /api/payroll/advance/:id
 * @access  Public / Private
 */
export const updateAdvance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amount, date, paymentMode, reason, remarks } = req.body;

  const advance = await DriverAdvance.findById(id);
  if (!advance) {
    return res.status(404).json({ success: false, error: 'Advance not found' });
  }

  if (amount !== undefined) advance.amount = Number(amount);
  if (date !== undefined) advance.date = date;
  if (paymentMode !== undefined) advance.paymentMode = paymentMode;
  if (reason !== undefined) advance.reason = reason;
  if (remarks !== undefined) advance.remarks = remarks;

  await advance.save();

  res.status(200).json({
    success: true,
    message: 'Advance updated successfully',
    data: advance
  });
});

/**
 * @desc    Delete an advance
 * @route   DELETE /api/payroll/advance/:id
 * @access  Public / Private
 */
export const deleteAdvance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const advance = await DriverAdvance.findById(id);
  if (!advance) {
    return res.status(404).json({ success: false, error: 'Advance not found' });
  }

  await DriverAdvance.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: 'Advance deleted successfully'
  });
});

/**
 * @desc    Update an existing penalty / challan
 * @route   PUT /api/payroll/penalty/:id
 * @access  Public / Private
 */
export const updatePenalty = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amount, date, challanNumber, reason, vehicle } = req.body;

  const penalty = await DriverPenalty.findById(id);
  if (!penalty) {
    return res.status(404).json({ success: false, error: 'Penalty not found' });
  }

  if (amount !== undefined) penalty.amount = Number(amount);
  if (date !== undefined) penalty.date = date;
  if (challanNumber !== undefined) penalty.challanNumber = challanNumber;
  if (reason !== undefined) penalty.reason = reason;
  if (vehicle !== undefined) penalty.vehicle = vehicle;

  await penalty.save();

  res.status(200).json({
    success: true,
    message: 'Penalty updated successfully',
    data: penalty
  });
});

/**
 * @desc    Delete a penalty / challan
 * @route   DELETE /api/payroll/penalty/:id
 * @access  Public / Private
 */
export const deletePenalty = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const penalty = await DriverPenalty.findById(id);
  if (!penalty) {
    return res.status(404).json({ success: false, error: 'Penalty not found' });
  }

  await DriverPenalty.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: 'Penalty deleted successfully'
  });
});

/**
 * @desc    Delete a payroll settlement
 * @route   DELETE /api/payroll/settlement/:id
 * @access  Public / Private
 */
export const deleteSettlement = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const settlement = await DriverPayrollSettlement.findById(id);
  if (!settlement) {
    return res.status(404).json({ success: false, error: 'Settlement record not found' });
  }

  // Restore advances & penalties to ACTIVE
  if (settlement.deductedAdvanceIds && settlement.deductedAdvanceIds.length > 0) {
    await DriverAdvance.updateMany(
      { _id: { $in: settlement.deductedAdvanceIds } },
      { $set: { status: 'ACTIVE', settledInMonth: null } }
    );
  } else {
    await DriverAdvance.updateMany(
      { driverId: settlement.driverId, settledInMonth: settlement.month },
      { $set: { status: 'ACTIVE', settledInMonth: null } }
    );
  }

  if (settlement.deductedPenaltyIds && settlement.deductedPenaltyIds.length > 0) {
    await DriverPenalty.updateMany(
      { _id: { $in: settlement.deductedPenaltyIds } },
      { $set: { status: 'ACTIVE', settledInMonth: null } }
    );
  } else {
    await DriverPenalty.updateMany(
      { driverId: settlement.driverId, settledInMonth: settlement.month },
      { $set: { status: 'ACTIVE', settledInMonth: null } }
    );
  }

  await DriverPayrollSettlement.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: 'Settlement payment deleted and deducted amounts restored to active'
  });
});
