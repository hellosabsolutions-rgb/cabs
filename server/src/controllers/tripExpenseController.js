import { TripExpense, TRIP_EXPENSE_CATEGORIES } from '../models/TripExpense.js';
import { Booking } from '../models/Booking.js';
import { Driver } from '../models/Driver.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { broadcastAll, emitToDriver } from '../services/socketService.js';
import mongoose from 'mongoose';

function todayIST() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
}

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function serializeExpense(doc) {
  if (!doc) return null;
  const json = typeof doc.toJSON === 'function' ? doc.toJSON() : { ...(doc.toObject?.() || doc) };
  json.id = json.id || json._id?.toString();
  json.bookingId = json.bookingId?.toString?.() || json.bookingId;
  json.createdBy = json.createdBy === 'admin' ? 'admin' : 'driver';
  json.status = json.status === 'Paid' ? 'Paid' : json.status === 'Approved' ? 'Approved' : 'Pending';
  return json;
}

function emitTripExpense(action, payload) {
  const event = `trip-expense:${action}`;
  try {
    broadcastAll(event, payload);
    const driverId = payload.expense?.driverId || payload.driverId;
    if (driverId) emitToDriver(driverId, event, payload);
  } catch (err) {
    console.warn(`Socket emit ${event} failed:`, err.message);
  }
}

function isAdminCreated(expense) {
  return expense?.createdBy === 'admin';
}

function driverOwnsExpense(req, expense) {
  if (!req.driver) return true;
  const myId = req.driver._id.toString();
  const myName = (req.driver.name || '').trim().toLowerCase();
  const expenseDriverId = String(expense.driverId || '');
  const expenseDriverName = (expense.driverName || '').trim().toLowerCase();
  return expenseDriverId === myId || (myName && expenseDriverName === myName);
}

async function resolveDriverFromBooking(booking, fallbackId = '') {
  const driverName = (booking.driverName || booking.driver || '').trim();
  if (fallbackId) {
    return { driverId: String(fallbackId), driverName: driverName || '' };
  }
  if (!driverName || driverName.toLowerCase() === 'unassigned') {
    return { driverId: '', driverName: '' };
  }
  const match = await Driver.findOne({
    name: new RegExp(`^${escapeRegex(driverName)}$`, 'i')
  }).select('_id name');
  return {
    driverId: match?._id?.toString() || '',
    driverName: match?.name || driverName
  };
}

export const listTripExpenses = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.bookingId) {
    if (!mongoose.Types.ObjectId.isValid(String(req.query.bookingId))) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }
    filter.bookingId = req.query.bookingId;
  }
  if (req.query.driverId) filter.driverId = req.query.driverId;
  if (req.query.category) filter.category = req.query.category;

  if (req.driver) {
    const myId = req.driver._id.toString();
    const myName = (req.driver.name || '').trim();
    const ownership = [{ driverId: myId }];
    if (myName) {
      ownership.push({ driverName: new RegExp(`^${escapeRegex(myName)}$`, 'i') });
    }
    filter.$or = ownership;
  }

  const docs = await TripExpense.find(filter).sort('-createdAt').limit(500);
  res.status(200).json({
    success: true,
    count: docs.length,
    data: docs.map(serializeExpense)
  });
});

export const createTripExpense = asyncHandler(async (req, res) => {
  const { bookingId, category, amount, notes, receipt, date } = req.body || {};

  if (!bookingId || !mongoose.Types.ObjectId.isValid(String(bookingId))) {
    return res.status(400).json({ success: false, error: 'bookingId is required.' });
  }
  if (!category || !TRIP_EXPENSE_CATEGORIES.includes(category)) {
    return res.status(400).json({ success: false, error: 'Valid category is required.' });
  }
  const amountNum = Number(amount);
  if (!Number.isFinite(amountNum) || amountNum <= 0) {
    return res.status(400).json({ success: false, error: 'Amount must be greater than 0.' });
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return res.status(404).json({ success: false, error: 'Booking not found.' });
  }

  const createdBy = req.driver ? 'driver' : 'admin';
  const receiptUrl = typeof receipt === 'string' && receipt.trim() ? receipt.trim() : null;

  if (createdBy === 'driver' && !receiptUrl) {
    return res.status(400).json({ success: false, error: 'Receipt photo is required.' });
  }

  if (req.driver) {
    const myName = (req.driver.name || '').trim().toLowerCase();
    const bookingDriver = (booking.driverName || booking.driver || '').trim().toLowerCase();
    if (!bookingDriver || bookingDriver !== myName) {
      return res.status(403).json({ success: false, error: 'This booking is not assigned to you.' });
    }
  }

  const resolved = req.driver
    ? { driverId: req.driver._id.toString(), driverName: req.driver.name || booking.driverName || '' }
    : await resolveDriverFromBooking(booking, req.body.driverId);

  if (!req.driver && !resolved.driverId && !resolved.driverName) {
    return res.status(400).json({
      success: false,
      error: 'Assign a driver to this booking before adding a trip expense.'
    });
  }

  const expense = await TripExpense.create({
    bookingId: booking._id,
    bookingNumber: booking.bookingNumber || '',
    driverId: resolved.driverId,
    driverName: resolved.driverName,
    vehicle: booking.vehicle || req.driver?.assignedVehicle || '',
    date: date || todayIST(),
    category,
    amount: amountNum,
    notes: notes || '',
    receipt: receiptUrl,
    createdBy,
    createdByName: req.driver?.name || req.user?.name || 'Office',
    status: req.driver
      ? 'Pending'
      : ['Approved', 'Pending', 'Paid'].includes(req.body?.status)
        ? req.body.status
        : 'Pending'
  });

  const payload = serializeExpense(expense);
  emitTripExpense('created', { expense: payload });

  res.status(201).json({ success: true, data: payload });
});

export const updateTripExpense = asyncHandler(async (req, res) => {
  const expense = await TripExpense.findById(req.params.id);
  if (!expense) {
    return res.status(404).json({ success: false, error: 'Trip expense not found.' });
  }
  if (req.driver && isAdminCreated(expense)) {
    return res.status(403).json({
      success: false,
      error: 'This expense was added by office. You cannot edit it.'
    });
  }
  if (!driverOwnsExpense(req, expense)) {
    return res.status(403).json({ success: false, error: 'You can only edit your own trip expenses.' });
  }

  const { category, amount, notes, receipt, date, status } = req.body || {};
  if (category) {
    if (!TRIP_EXPENSE_CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, error: 'Invalid category.' });
    }
    expense.category = category;
  }
  if (amount !== undefined) {
    const amountNum = Number(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return res.status(400).json({ success: false, error: 'Amount must be greater than 0.' });
    }
    expense.amount = amountNum;
  }
  if (notes !== undefined) expense.notes = notes;
  if (date !== undefined) {
    expense.date = String(date).trim() || todayIST();
  }
  if (status !== undefined) {
    if (req.driver) {
      return res.status(403).json({ success: false, error: 'Only office can change payout status.' });
    }
    if (!['Approved', 'Pending', 'Paid'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Status must be Approved, Pending, or Paid.' });
    }
    expense.status = status;
  }
  if (receipt !== undefined) {
    const receiptUrl = typeof receipt === 'string' && receipt.trim() ? receipt.trim() : null;
    if (req.driver && !receiptUrl) {
      return res.status(400).json({ success: false, error: 'Receipt photo is required.' });
    }
    expense.receipt = receiptUrl;
  }

  await expense.save();
  const payload = serializeExpense(expense);
  emitTripExpense('updated', { expense: payload });

  res.status(200).json({ success: true, data: payload });
});

export const updateTripExpenseStatus = asyncHandler(async (req, res) => {
  if (req.driver) {
    return res.status(403).json({ success: false, error: 'Only office can change payout status.' });
  }

  const { status } = req.body || {};
  if (!status || !['Approved', 'Pending', 'Paid'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Status must be Approved, Pending, or Paid.' });
  }

  const expense = await TripExpense.findById(req.params.id);
  if (!expense) {
    return res.status(404).json({ success: false, error: 'Trip expense not found.' });
  }

  expense.status = status;
  await expense.save();
  const payload = serializeExpense(expense);
  emitTripExpense('updated', { expense: payload });

  res.status(200).json({ success: true, data: payload });
});

export const bulkUpdateTripExpenseStatus = asyncHandler(async (req, res) => {
  if (req.driver) {
    return res.status(403).json({ success: false, error: 'Only office can change payout status.' });
  }

  const { ids, status } = req.body || {};
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, error: 'ids array is required.' });
  }
  if (!status || !['Approved', 'Pending', 'Paid'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Status must be Approved, Pending, or Paid.' });
  }

  const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(String(id)));
  if (validIds.length === 0) {
    return res.status(400).json({ success: false, error: 'No valid expense ids provided.' });
  }

  await TripExpense.updateMany({ _id: { $in: validIds } }, { $set: { status } });
  const docs = await TripExpense.find({ _id: { $in: validIds } });
  const expenses = docs.map(serializeExpense);
  expenses.forEach((expense) => emitTripExpense('updated', { expense }));

  res.status(200).json({
    success: true,
    count: expenses.length,
    data: expenses
  });
});

export const deleteTripExpense = asyncHandler(async (req, res) => {
  const expense = await TripExpense.findById(req.params.id);
  if (!expense) {
    return res.status(404).json({ success: false, error: 'Trip expense not found.' });
  }
  if (req.driver && isAdminCreated(expense)) {
    return res.status(403).json({
      success: false,
      error: 'This expense was added by office. You cannot delete it.'
    });
  }
  if (!driverOwnsExpense(req, expense)) {
    return res.status(403).json({ success: false, error: 'You can only delete your own trip expenses.' });
  }

  const payload = {
    expenseId: expense._id.toString(),
    bookingId: expense.bookingId?.toString(),
    driverId: expense.driverId
  };

  await expense.deleteOne();
  emitTripExpense('deleted', payload);

  res.status(200).json({ success: true, data: payload });
});
