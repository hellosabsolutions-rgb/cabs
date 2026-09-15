import mongoose from 'mongoose';
import { DailyDutyLog } from '../models/DailyDutyLog.js';
import { createCrudController } from './crudFactory.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { withAgencyFilter, stampAgencyId } from '../utils/tenantQuery.js';
import { processMediaFields } from '../utils/mediaUploadHelper.js';
import {
  assertOfficialDutyAllowed,
  emitDutyLogEvent,
  serializeDutyLog
} from '../utils/dutyLogHelpers.js';

const mediaFields = [
  { field: 'dutySlipPhoto', folder: 'fleetos/duty/slips' },
  { field: 'fuelBillPhoto', folder: 'fleetos/duty/fuel-bills' }
];

const crud = createCrudController(
  DailyDutyLog,
  [
    'dutySlipNumber',
    'logBookPageNo',
    'month',
    'departmentName',
    'vehicle',
    'driverName',
    'officerName',
    'officerDesignation',
    'journeyFrom',
    'journeyTo',
    'purposeOfJourney',
    'headOfAccount',
    'tripDestination'
  ],
  {
    socketPrefix: null,
    mediaFields
  }
);

/**
 * @desc    List daily duty logs with driver/date/month filters (tenant-scoped)
 * @route   GET /api/duty-logs
 */
export const getDutyLogs = asyncHandler(async (req, res) => {
  const {
    date,
    month,
    year,
    startDate,
    endDate,
    driverName,
    driverId,
    driver,
    vehicle,
    department,
    departmentName,
    status,
    dutyType,
    search,
    page = 1,
    limit = 200,
    sort = '-date'
  } = req.query;

  const query = {};

  if (date) {
    query.date = date;
  } else if (month && /^\d{4}-\d{2}$/.test(String(month))) {
    query.date = { $regex: `^${month}` };
  } else if (month && month !== 'All') {
    query.month = month;
  } else if (year) {
    query.date = { $regex: `^${year}` };
  }

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = startDate;
    if (endDate) query.date.$lte = endDate;
  }

  const driverFilter = driverName || driverId || driver;
  if (driverFilter && driverFilter !== 'All') {
    const trimmed = String(driverFilter).trim();
    query.$or = [
      { driverName: new RegExp(`^${trimmed}$`, 'i') },
      { driverId: trimmed }
    ];
  }

  if (vehicle && vehicle !== 'All') {
    query.vehicle = vehicle;
  }

  const dept = departmentName || department;
  if (dept && dept !== 'All') {
    query.departmentName = dept;
  }

  if (status && status !== 'All') {
    query.status = status;
  }

  if (dutyType && dutyType !== 'All') {
    query.dutyType = dutyType;
  }

  if (search) {
    const searchRegex = new RegExp(String(search).trim(), 'i');
    const searchClause = {
      $or: [
        { dutySlipNumber: searchRegex },
        { logBookPageNo: searchRegex },
        { driverName: searchRegex },
        { vehicle: searchRegex },
        { departmentName: searchRegex },
        { journeyFrom: searchRegex },
        { journeyTo: searchRegex },
        { purposeOfJourney: searchRegex },
        { notes: searchRegex }
      ]
    };
    if (query.$or) {
      query.$and = [{ $or: query.$or }, searchClause];
      delete query.$or;
    } else {
      Object.assign(query, searchClause);
    }
  }

  const scoped = withAgencyFilter(req, query);
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(500, Math.max(1, parseInt(limit, 10) || 200));
  const skip = (pageNum - 1) * limitNum;

  const total = await DailyDutyLog.countDocuments(scoped);
  const docs = await DailyDutyLog.find(scoped)
    .sort(sort)
    .skip(skip)
    .limit(limitNum)
    .lean();

  const data = docs.map((doc) => serializeDutyLog(doc));

  res.status(200).json({
    success: true,
    count: data.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum) || 1,
    data
  });
});

export const getDutyLogById = crud.getById;

export const createDutyLog = asyncHandler(async (req, res) => {
  let contract = null;
  try {
    contract = await assertOfficialDutyAllowed(req.body);
  } catch (err) {
    return res.status(err.statusCode || 400).json({ success: false, error: err.message });
  }

  let payload = stampAgencyId(req, { ...req.body });
  if (!payload.entrySource) payload.entrySource = 'Admin';
  payload.isNightShift = Boolean(payload.isNightShift);
  if (mediaFields.length) {
    payload = await processMediaFields(payload, mediaFields);
  }

  const doc = await DailyDutyLog.create(payload);
  emitDutyLogEvent('created', doc, { contract });

  res.status(201).json({
    success: true,
    data: doc
  });
});

export const updateDutyLog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { _id: id };
  const scoped = withAgencyFilter(req, query);

  const existing = await DailyDutyLog.findOne(scoped);
  if (!existing) {
    return res.status(404).json({ success: false, error: `Resource not found with ID ${id}` });
  }

  if (existing.monthlyBillId) {
    return res.status(403).json({
      success: false,
      error: 'This duty log is linked to a generated bill and cannot be edited.'
    });
  }

  const mergedCheck = { ...existing.toObject(), ...req.body };
  let contract = null;
  try {
    contract = await assertOfficialDutyAllowed(mergedCheck);
  } catch (err) {
    return res.status(err.statusCode || 400).json({ success: false, error: err.message });
  }

  const { agencyId: _drop, ...body } = req.body;
  let payload = body;
  if (mediaFields.length) {
    payload = await processMediaFields(payload, mediaFields);
  }
  if (payload.isNightShift !== undefined) {
    payload.isNightShift = Boolean(payload.isNightShift);
  }

  const doc = await DailyDutyLog.findOneAndUpdate(scoped, payload, {
    new: true,
    runValidators: true
  });

  emitDutyLogEvent('updated', doc, { contract });

  res.status(200).json({
    success: true,
    data: doc
  });
});

export const deleteDutyLog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { _id: id };
  const scoped = withAgencyFilter(req, query);

  const doc = await DailyDutyLog.findOne(scoped);
  if (!doc) {
    return res.status(404).json({ success: false, error: `Resource not found with ID ${id}` });
  }

  if (doc.monthlyBillId) {
    return res.status(403).json({
      success: false,
      error: 'Cannot delete a duty log that is included on a monthly bill.'
    });
  }

  await DailyDutyLog.findOneAndDelete(scoped);
  emitDutyLogEvent('deleted', doc);

  res.status(200).json({
    success: true,
    message: 'Resource deleted successfully',
    data: {}
  });
});
