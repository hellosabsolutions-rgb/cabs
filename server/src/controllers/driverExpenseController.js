import mongoose from 'mongoose';
import { DriverExpense } from '../models/DriverExpense.js';
import { Driver } from '../models/Driver.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

/**
 * @desc    Get driver expenses with filtering, date/month/year search, pagination
 * @route   GET /api/driver-expenses
 * @access  Public / Private
 */
export const getDriverExpenses = asyncHandler(async (req, res) => {
  const {
    date,
    month,
    year,
    startDate,
    endDate,
    driverId,
    driverName,
    driver,
    vehicle,
    category,
    status,
    search,
    page = 1,
    limit = 100,
    sort = '-date'
  } = req.query;

  const query = {};

  if (date) {
    query.date = date;
  } else if (month) {
    query.date = { $regex: `^${month}` };
  } else if (year) {
    query.date = { $regex: `^${year}` };
  } else if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = startDate;
    if (endDate) query.date.$lte = endDate;
  }

  const driverFilter = driverId || driverName || driver;
  if (driverFilter && driverFilter !== 'All') {
    const matchedDriver = await Driver.findOne({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(driverFilter) ? driverFilter : new mongoose.Types.ObjectId() },
        { name: new RegExp(`^${driverFilter.trim()}$`, 'i') }
      ]
    }).lean();

    if (matchedDriver) {
      query.$or = [
        { driverId: matchedDriver._id.toString() },
        { driverId: driverFilter },
        { driverName: new RegExp(`^${matchedDriver.name.trim()}$`, 'i') }
      ];
    } else {
      query.$or = [
        { driverId: driverFilter },
        { driverName: new RegExp(`^${driverFilter.trim()}$`, 'i') }
      ];
    }
  }

  if (vehicle && vehicle !== 'All') {
    query.vehicle = vehicle;
  }

  if (category && category !== 'All') {
    query.category = category;
  }

  if (status && status !== 'All') {
    query.status = status;
  }

  if (search) {
    const searchRegex = new RegExp(search.trim(), 'i');
    const searchConditions = [
      { driverName: searchRegex },
      { vehicle: searchRegex },
      { category: searchRegex },
      { remarks: searchRegex }
    ];
    if (query.$or) {
      query.$and = [
        { $or: query.$or },
        { $or: searchConditions }
      ];
      delete query.$or;
    } else {
      query.$or = searchConditions;
    }
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(500, Math.max(1, parseInt(limit, 10) || 100));
  const skip = (pageNum - 1) * limitNum;

  const total = await DriverExpense.countDocuments(query);
  const docs = await DriverExpense.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limitNum)
    .lean();

  // Calculate sum of amounts
  const sumAggregate = await DriverExpense.aggregate([
    { $match: query },
    { $group: { _id: null, totalSum: { $sum: '$amount' } } }
  ]);
  const totalAmount = sumAggregate.length > 0 ? sumAggregate[0].totalSum : 0;

  const data = docs.map(doc => ({
    ...doc,
    id: doc._id.toString()
  }));

  res.status(200).json({
    success: true,
    count: data.length,
    total,
    totalAmount,
    page: pageNum,
    pages: Math.ceil(total / limitNum) || 1,
    data
  });
});

/**
 * @desc    Get Driver Expense Analytics (Monthly & Yearly calculations)
 * @route   GET /api/driver-expenses/analytics
 * @access  Public / Private
 */
export const getDriverExpenseAnalytics = asyncHandler(async (req, res) => {
  const period = req.query.period || 'month'; // 'month' | 'year' | 'day'
  const today = new Date();
  const currentMonth = req.query.month || today.toISOString().slice(0, 7); // YYYY-MM
  const currentYear = req.query.year || today.getFullYear().toString(); // YYYY
  const currentDate = req.query.date || today.toISOString().split('T')[0];

  const drivers = await Driver.find().sort({ name: 1 }).lean();

  if (period === 'year') {
    // -------------------------------------------------------------
    // YEARLY ANALYTICS
    // -------------------------------------------------------------
    const yearPrefix = `^${currentYear}`;
    const records = await DriverExpense.find({ date: { $regex: yearPrefix } }).lean();

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTrends = monthNames.map((name, index) => {
      const monthNum = String(index + 1).padStart(2, '0');
      const prefix = `${currentYear}-${monthNum}`;
      const mRecords = records.filter(r => r.date.startsWith(prefix));

      let mTotal = 0;
      let mPaid = 0;
      let mPending = 0;
      let mApproved = 0;

      mRecords.forEach(r => {
        const amt = Number(r.amount) || 0;
        mTotal += amt;
        if (r.status === 'Paid') mPaid += amt;
        else if (r.status === 'Approved') mApproved += amt;
        else mPending += amt;
      });

      return {
        monthCode: prefix,
        monthName: name,
        totalAmount: mTotal,
        paidAmount: mPaid,
        pendingAmount: mPending + mApproved,
        transactionCount: mRecords.length
      };
    });

    // Driver-wise Annual Breakdown
    const driverTotals = drivers.map(d => {
      const dRecords = records.filter(
        r => r.driverId === d._id.toString() || r.driverName.toLowerCase() === d.name.toLowerCase()
      );

      let dTotal = 0;
      let dPaid = 0;
      let dPending = 0;

      dRecords.forEach(r => {
        const amt = Number(r.amount) || 0;
        dTotal += amt;
        if (r.status === 'Paid') dPaid += amt;
        else dPending += amt;
      });

      return {
        driverId: d._id.toString(),
        driverName: d.name,
        vehicle: d.assignedVehicle,
        driverType: d.driverType,
        totalAmount: dTotal,
        paidAmount: dPaid,
        pendingAmount: dPending,
        transactionCount: dRecords.length
      };
    });

    let overallTotal = 0;
    let overallPaid = 0;
    let overallPending = 0;
    const categoryTotals = {};

    records.forEach(r => {
      const amt = Number(r.amount) || 0;
      overallTotal += amt;
      if (r.status === 'Paid') overallPaid += amt;
      else overallPending += amt;

      categoryTotals[r.category] = (categoryTotals[r.category] || 0) + amt;
    });

    return res.status(200).json({
      success: true,
      period: 'year',
      year: currentYear,
      summary: {
        totalDrivers: drivers.length,
        totalExpenses: overallTotal,
        paidAmount: overallPaid,
        pendingAmount: overallPending,
        transactionCount: records.length
      },
      categoryTotals,
      monthlyTrends,
      driverTotals
    });
  }

  // -------------------------------------------------------------
  // MONTHLY ANALYTICS (DEFAULT)
  // -------------------------------------------------------------
  const monthPrefix = `^${currentMonth}`;
  const records = await DriverExpense.find({ date: { $regex: monthPrefix } }).sort({ date: -1 }).lean();

  let overallTotal = 0;
  let overallPaid = 0;
  let overallApproved = 0;
  let overallPending = 0;
  let bataTotal = 0;
  let nightHaltTotal = 0;
  let advanceTotal = 0;
  let overtimeTotal = 0;
  let tollTotal = 0;
  let miscTotal = 0;

  records.forEach(r => {
    const amt = Number(r.amount) || 0;
    overallTotal += amt;

    if (r.status === 'Paid') overallPaid += amt;
    else if (r.status === 'Approved') overallApproved += amt;
    else overallPending += amt;

    if (r.category === 'Daily Bata / Food') bataTotal += amt;
    else if (r.category === 'Night Halt Allowance') nightHaltTotal += amt;
    else if (r.category === 'Advance Payout') advanceTotal += amt;
    else if (r.category === 'Overtime') overtimeTotal += amt;
    else if (r.category === 'Toll / Cash Reimbursement') tollTotal += amt;
    else miscTotal += amt;
  });

  // Driver-wise Monthly Breakdown
  const driverTotals = drivers.map(d => {
    const dRecords = records.filter(
      r => r.driverId === d._id.toString() || r.driverName.toLowerCase() === d.name.toLowerCase()
    );

    let dTotal = 0;
    let dPaid = 0;
    let dPending = 0;
    let dBata = 0;
    let dNightHalt = 0;
    let dAdvance = 0;

    dRecords.forEach(r => {
      const amt = Number(r.amount) || 0;
      dTotal += amt;
      if (r.status === 'Paid') dPaid += amt;
      else dPending += amt;

      if (r.category === 'Daily Bata / Food') dBata += amt;
      else if (r.category === 'Night Halt Allowance' || r.category === 'Overtime') dNightHalt += amt;
      else if (r.category === 'Advance Payout') dAdvance += amt;
    });

    return {
      driverId: d._id.toString(),
      driverName: d.name,
      vehicle: d.assignedVehicle,
      driverType: d.driverType,
      totalAmount: dTotal,
      paidAmount: dPaid,
      pendingAmount: dPending,
      bataAmount: dBata,
      nightHaltAmount: dNightHalt,
      advanceAmount: dAdvance,
      transactionCount: dRecords.length,
      records: dRecords.map(r => ({
        ...r,
        id: r._id.toString()
      }))
    };
  });

  // Driver specific summary if filtered
  const driverFilter = req.query.driverId || req.query.driverName || req.query.driver;
  let driverSpecificSummary = null;

  if (driverFilter && driverFilter !== 'All') {
    const dFound = driverTotals.find(
      d =>
        d.driverId === driverFilter ||
        d.driverName.toLowerCase() === driverFilter.toLowerCase()
    );

    if (dFound) {
      let dBata = 0;
      let dNightHalt = 0;
      let dAdvance = 0;
      let dOvertime = 0;
      let dToll = 0;
      let dMisc = 0;
      let dApproved = 0;

      dFound.records.forEach(r => {
        const amt = Number(r.amount) || 0;
        if (r.status === 'Approved') dApproved += amt;
        if (r.category === 'Daily Bata / Food') dBata += amt;
        else if (r.category === 'Night Halt Allowance') dNightHalt += amt;
        else if (r.category === 'Advance Payout') dAdvance += amt;
        else if (r.category === 'Overtime') dOvertime += amt;
        else if (r.category === 'Toll / Cash Reimbursement') dToll += amt;
        else dMisc += amt;
      });

      driverSpecificSummary = {
        driverId: dFound.driverId,
        driverName: dFound.driverName,
        vehicle: dFound.vehicle,
        driverType: dFound.driverType,
        totalExpenses: dFound.totalAmount,
        paidAmount: dFound.paidAmount,
        approvedAmount: dApproved,
        pendingAmount: dFound.pendingAmount,
        transactionCount: dFound.transactionCount,
        categoryBreakdown: {
          bataTotal: dBata,
          nightHaltTotal: dNightHalt,
          advanceTotal: dAdvance,
          overtimeTotal: dOvertime,
          tollTotal: dToll,
          miscTotal: dMisc
        },
        records: dFound.records
      };
    }
  }

  res.status(200).json({
    success: true,
    period: 'month',
    month: currentMonth,
    driverFilter: driverFilter && driverFilter !== 'All' ? driverFilter : null,
    driverSpecificSummary,
    summary: {
      totalDrivers: drivers.length,
      totalExpenses: overallTotal,
      paidAmount: overallPaid,
      approvedAmount: overallApproved,
      pendingAmount: overallPending,
      transactionCount: records.length,
      categoryBreakdown: {
        bataTotal,
        nightHaltTotal,
        advanceTotal,
        overtimeTotal,
        tollTotal,
        miscTotal
      }
    },
    driverTotals,
    allRecords: records.map(r => ({
      ...r,
      id: r._id.toString()
    }))
  });
});

/**
 * @desc    Get single driver expense record
 * @route   GET /api/driver-expenses/:id
 * @access  Public / Private
 */
export const getDriverExpenseById = asyncHandler(async (req, res) => {
  const expense = await DriverExpense.findById(req.params.id).lean();

  if (!expense) {
    return res.status(404).json({
      success: false,
      error: `Driver expense record with ID ${req.params.id} not found`
    });
  }

  res.status(200).json({
    success: true,
    data: {
      ...expense,
      id: expense._id.toString()
    }
  });
});

/**
 * @desc    Create new driver expense
 * @route   POST /api/driver-expenses
 * @access  Public / Private
 */
export const createDriverExpense = asyncHandler(async (req, res) => {
  const {
    driverId,
    driverName,
    vehicle,
    date = new Date().toISOString().split('T')[0],
    category,
    amount,
    status = 'Pending',
    remarks,
    receipt
  } = req.body;

  if (!driverName && !driverId) {
    return res.status(400).json({
      success: false,
      error: 'Driver is required.'
    });
  }

  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Valid expense amount is required.'
    });
  }

  let resolvedDriverName = driverName;
  let resolvedDriverId = driverId;
  let resolvedVehicle = vehicle;

  if (driverId && !driverName) {
    const d = await Driver.findById(driverId).lean();
    if (d) {
      resolvedDriverName = d.name;
      if (!resolvedVehicle) resolvedVehicle = d.assignedVehicle;
    }
  } else if (!driverId && driverName) {
    const d = await Driver.findOne({ name: driverName }).lean();
    if (d) {
      resolvedDriverId = d._id.toString();
      if (!resolvedVehicle) resolvedVehicle = d.assignedVehicle;
    } else {
      resolvedDriverId = 'drv_' + Date.now();
    }
  }

  const expense = await DriverExpense.create({
    driverId: resolvedDriverId,
    driverName: resolvedDriverName,
    vehicle: resolvedVehicle || '—',
    date,
    category: category || 'Daily Bata / Food',
    amount: Number(amount),
    status: status || 'Paid',
    remarks: remarks || '',
    receipt: receipt || null
  });

  res.status(201).json({
    success: true,
    message: `Driver expense of ₹${Number(amount).toLocaleString('en-IN')} recorded for ${resolvedDriverName}`,
    data: {
      ...expense.toObject(),
      id: expense._id.toString()
    }
  });
});

/**
 * @desc    Update full driver expense
 * @route   PUT /api/driver-expenses/:id
 * @access  Public / Private
 */
export const updateDriverExpense = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { id };
  const updated = await DriverExpense.findOneAndUpdate(
    query,
    { $set: req.body },
    { new: true, runValidators: true }
  );

  if (!updated) {
    return res.status(404).json({
      success: false,
      error: `Driver expense with ID ${id} not found`
    });
  }

  res.status(200).json({
    success: true,
    message: `Driver expense updated successfully`,
    data: {
      ...updated.toObject(),
      id: updated._id.toString()
    }
  });
});

/**
 * @desc    Update driver expense status ('Approved' | 'Pending' | 'Paid')
 * @route   PATCH /api/driver-expenses/:id/status
 * @access  Public / Private
 */
export const updateDriverExpenseStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['Approved', 'Pending', 'Paid'].includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'Status must be Approved, Pending, or Paid'
    });
  }

  const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { id };
  const updated = await DriverExpense.findOneAndUpdate(
    query,
    { status },
    { new: true }
  );

  if (!updated) {
    return res.status(404).json({
      success: false,
      error: `Driver expense with ID ${id} not found`
    });
  }

  res.status(200).json({
    success: true,
    message: `Expense status updated to ${status}`,
    data: {
      ...updated.toObject(),
      id: updated._id.toString()
    }
  });
});

/**
 * @desc    Delete driver expense
 * @route   DELETE /api/driver-expenses/:id
 * @access  Public / Private
 */
export const deleteDriverExpense = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { id };

  const deleted = await DriverExpense.findOneAndDelete(query);

  if (!deleted) {
    return res.status(404).json({
      success: false,
      error: `Driver expense with ID ${id} not found`
    });
  }

  res.status(200).json({
    success: true,
    message: `Driver expense record deleted successfully`
  });
});
