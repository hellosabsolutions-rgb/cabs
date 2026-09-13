import { DailyDutyLog } from '../models/DailyDutyLog.js';
import { createCrudController } from './crudFactory.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { withAgencyFilter } from '../utils/tenantQuery.js';

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
    'motorOilUsed',
    'tripDestination'
  ],
  { socketPrefix: 'duty-log' }
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

  const data = docs.map((doc) => ({
    ...doc,
    id: doc._id.toString()
  }));

  res.status(200).json({
    success: true,
    count: data.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum) || 1,
    data
  });
});

export const createDutyLog = crud.create;
export const getDutyLogById = crud.getById;
export const updateDutyLog = crud.update;
export const deleteDutyLog = crud.delete;
