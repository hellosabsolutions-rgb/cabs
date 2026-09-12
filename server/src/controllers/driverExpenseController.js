import mongoose from 'mongoose';
import { DriverExpense, DRIVER_EXPENSE_CATEGORIES } from '../models/DriverExpense.js';
import { Driver } from '../models/Driver.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { uploadToCloudinary } from '../services/cloudinaryService.js';
import { broadcastAll, emitToDriver } from '../services/socketService.js';

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function todayIST() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
}

function serializeDriverExpense(doc) {
  if (!doc) return null;
  const json = typeof doc.toJSON === 'function' ? doc.toJSON() : { ...(doc.toObject?.() || doc) };
  json.id = json.id || json._id?.toString();
  json.createdBy = json.createdBy === 'driver' ? 'driver' : 'admin';
  json.source = 'driver';
  return json;
}

function emitDriverExpense(action, payload) {
  const event = `driver-expense:${action}`;
  try {
    broadcastAll(event, payload);
    const driverId = payload.expense?.driverId || payload.driverId;
    if (driverId) emitToDriver(driverId, event, payload);
  } catch (err) {
    console.warn(`Socket emit ${event} failed:`, err.message);
  }
}

function isAdminCreated(expense) {
  return expense?.createdBy !== 'driver';
}

function driverOwnsExpense(req, expense) {
  if (!req.driver) return true;
  const myId = req.driver._id.toString();
  const myName = (req.driver.name || '').trim().toLowerCase();
  const expenseDriverId = String(expense.driverId || '');
  const expenseDriverName = (expense.driverName || '').trim().toLowerCase();
  return expenseDriverId === myId || (myName && expenseDriverName === myName);
}

function applyDriverScope(req, query) {
  if (!req.driver) return query;
  const myId = req.driver._id.toString();
  const myName = (req.driver.name || '').trim();
  const ownership = [{ driverId: myId }];
  if (myName) ownership.push({ driverName: new RegExp(`^${escapeRegex(myName)}$`, 'i') });
  if (query.$and) {
    query.$and.push({ $or: ownership });
  } else if (query.$or) {
    query.$and = [{ $or: query.$or }, { $or: ownership }];
    delete query.$or;
  } else {
    query.$or = ownership;
  }
  return query;
}

function requireAdmin(req, res) {
  if (req.driver) {
    res.status(403).json({ success: false, error: 'Only office staff can do this.' });
    return false;
  }
  return true;
}

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

  applyDriverScope(req, query);

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

  const data = docs.map(serializeDriverExpense);

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

    // Driver-wise Annual Breakdown (only drivers with entries)
    const driverTotals = drivers
      .map(d => {
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
      })
      .filter(d => d.transactionCount > 0);

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

  // Driver-wise Monthly Breakdown (only drivers with entries)
  const driverTotals = drivers
    .map(d => {
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
    })
    .filter(d => d.transactionCount > 0);

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

export const getDriverExpenseById = asyncHandler(async (req, res) => {
  const expense = await DriverExpense.findById(req.params.id);

  if (!expense) {
    return res.status(404).json({
      success: false,
      error: `Driver expense record with ID ${req.params.id} not found`
    });
  }

  if (!driverOwnsExpense(req, expense)) {
    return res.status(403).json({ success: false, error: 'You can only view your own expenses.' });
  }

  res.status(200).json({
    success: true,
    data: serializeDriverExpense(expense)
  });
});

export const createDriverExpense = asyncHandler(async (req, res) => {
  const createdBy = req.driver ? 'driver' : 'admin';
  const {
    driverId,
    driverName,
    vehicle,
    date = todayIST(),
    category,
    amount,
    status = 'Pending',
    remarks,
    receipt
  } = req.body || {};

  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Valid expense amount is required.'
    });
  }

  if (category && !DRIVER_EXPENSE_CATEGORIES.includes(category)) {
    return res.status(400).json({ success: false, error: 'Invalid expense category.' });
  }

  let resolvedDriverName = driverName;
  let resolvedDriverId = driverId;
  let resolvedVehicle = vehicle;

  if (req.driver) {
    resolvedDriverId = req.driver._id.toString();
    resolvedDriverName = req.driver.name || driverName;
    if (!resolvedVehicle) resolvedVehicle = req.driver.assignedVehicle;
  } else if (!driverName && !driverId) {
    return res.status(400).json({
      success: false,
      error: 'Driver is required.'
    });
  } else if (driverId && !driverName) {
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

  let receiptUrl = typeof receipt === 'string' && receipt.trim() ? receipt.trim() : null;
  if (createdBy === 'driver' && !receiptUrl) {
    return res.status(400).json({ success: false, error: 'Receipt photo is required.' });
  }

  if (receiptUrl && receiptUrl.startsWith('data:')) {
    try {
      const isPdf = receiptUrl.startsWith('data:application/pdf');
      const uploadRes = await uploadToCloudinary(receiptUrl, {
        folder: 'fleetos/driver-expenses',
        resource_type: isPdf ? 'raw' : 'auto'
      });
      if (uploadRes && uploadRes.secure_url) {
        receiptUrl = uploadRes.secure_url;
      }
    } catch (uploadErr) {
      console.warn('Receipt upload to Cloudinary failed, saving raw receipt:', uploadErr.message);
    }
  }

  const expense = await DriverExpense.create({
    driverId: resolvedDriverId,
    driverName: resolvedDriverName,
    vehicle: resolvedVehicle || '—',
    date,
    category: category || (createdBy === 'driver' ? 'Other' : 'Daily Bata / Food'),
    amount: Number(amount),
    status: createdBy === 'driver' ? 'Pending' : (['Approved', 'Pending', 'Paid'].includes(status) ? status : 'Pending'),
    remarks: remarks || '',
    receipt: receiptUrl,
    createdBy,
    createdByName: req.driver?.name || req.user?.name || 'Office'
  });

  const payload = serializeDriverExpense(expense);
  emitDriverExpense('created', { expense: payload });

  res.status(201).json({
    success: true,
    message: `Driver expense of ₹${Number(amount).toLocaleString('en-IN')} recorded for ${resolvedDriverName}`,
    data: payload
  });
});

export const updateDriverExpense = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { id };
  const expense = await DriverExpense.findOne(query);

  if (!expense) {
    return res.status(404).json({
      success: false,
      error: `Driver expense with ID ${id} not found`
    });
  }

  if (req.driver && isAdminCreated(expense)) {
    return res.status(403).json({
      success: false,
      error: 'This expense was added by office. You cannot edit it.'
    });
  }

  if (!driverOwnsExpense(req, expense)) {
    return res.status(403).json({ success: false, error: 'You can only edit your own expenses.' });
  }

  if (req.driver && expense.status === 'Paid') {
    return res.status(403).json({
      success: false,
      error: 'This expense is already paid. Ask office if it needs a change.'
    });
  }

  const body = { ...(req.body || {}) };
  if (req.driver) {
    delete body.status;
    delete body.driverId;
    delete body.driverName;
    delete body.createdBy;
  }

  if (body.receipt && typeof body.receipt === 'string' && body.receipt.startsWith('data:')) {
    try {
      const isPdf = body.receipt.startsWith('data:application/pdf');
      const uploadRes = await uploadToCloudinary(body.receipt, {
        folder: 'fleetos/driver-expenses',
        resource_type: isPdf ? 'raw' : 'auto'
      });
      if (uploadRes && uploadRes.secure_url) {
        body.receipt = uploadRes.secure_url;
      }
    } catch (uploadErr) {
      console.warn('Cloudinary upload warning on updateDriverExpense:', uploadErr.message);
    }
  }

  if (body.category && !DRIVER_EXPENSE_CATEGORIES.includes(body.category)) {
    return res.status(400).json({ success: false, error: 'Invalid expense category.' });
  }

  Object.assign(expense, body);
  await expense.save();

  const payload = serializeDriverExpense(expense);
  emitDriverExpense('updated', { expense: payload });

  res.status(200).json({
    success: true,
    message: 'Driver expense updated successfully',
    data: payload
  });
});

export const updateDriverExpenseStatus = asyncHandler(async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['Approved', 'Pending', 'Paid'].includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'Status must be Approved, Pending, or Paid'
    });
  }

  const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { id };
  const updated = await DriverExpense.findOneAndUpdate(query, { status }, { new: true });

  if (!updated) {
    return res.status(404).json({
      success: false,
      error: `Driver expense with ID ${id} not found`
    });
  }

  const payload = serializeDriverExpense(updated);
  emitDriverExpense('updated', { expense: payload });

  res.status(200).json({
    success: true,
    message: `Expense status updated to ${status}`,
    data: payload
  });
});

export const bulkUpdateDriverExpenseStatus = asyncHandler(async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const { ids, status } = req.body || {};
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, error: 'ids array is required.' });
  }
  if (!status || !['Approved', 'Pending', 'Paid'].includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'Status must be Approved, Pending, or Paid'
    });
  }

  const objectIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(String(id)));
  const otherIds = ids.filter((id) => !mongoose.Types.ObjectId.isValid(String(id)));
  const orQuery = [];
  if (objectIds.length) orQuery.push({ _id: { $in: objectIds } });
  if (otherIds.length) orQuery.push({ id: { $in: otherIds } });

  if (orQuery.length === 0) {
    return res.status(400).json({ success: false, error: 'No valid expense ids provided.' });
  }

  const match = orQuery.length === 1 ? orQuery[0] : { $or: orQuery };
  await DriverExpense.updateMany(match, { $set: { status } });
  const docs = await DriverExpense.find(match);
  const expenses = docs.map(serializeDriverExpense);
  expenses.forEach((expense) => emitDriverExpense('updated', { expense }));

  res.status(200).json({
    success: true,
    count: expenses.length,
    data: expenses
  });
});

export const deleteDriverExpense = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { id };
  const deleted = await DriverExpense.findOne(query);

  if (!deleted) {
    return res.status(404).json({
      success: false,
      error: `Driver expense with ID ${id} not found`
    });
  }

  if (req.driver && isAdminCreated(deleted)) {
    return res.status(403).json({
      success: false,
      error: 'This expense was added by office. You cannot delete it.'
    });
  }

  if (!driverOwnsExpense(req, deleted)) {
    return res.status(403).json({ success: false, error: 'You can only delete your own expenses.' });
  }

  const payload = {
    expenseId: deleted._id.toString(),
    driverId: deleted.driverId
  };

  await deleted.deleteOne();
  emitDriverExpense('deleted', payload);

  res.status(200).json({
    success: true,
    message: 'Driver expense record deleted successfully',
    data: payload
  });
});
