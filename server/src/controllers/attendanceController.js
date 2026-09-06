import mongoose from 'mongoose';
import { DriverAttendance } from '../models/DriverAttendance.js';
import { Driver } from '../models/Driver.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

/**
 * @desc    Get attendance records with filtering, date search, and pagination
 * @route   GET /api/attendance
 * @access  Public / Private
 */
export const getAttendance = asyncHandler(async (req, res) => {
  const {
    date,
    month,
    year,
    startDate,
    endDate,
    driverId,
    status,
    dutyType,
    search,
    page = 1,
    limit = 100,
    sort = '-date'
  } = req.query;

  const query = {};

  // Single date filter
  if (date) {
    query.date = date;
  } else if (month) {
    // e.g. 2026-09
    query.date = { $regex: `^${month}` };
  } else if (year) {
    // e.g. 2026
    query.date = { $regex: `^${year}` };
  } else if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = startDate;
    if (endDate) query.date.$lte = endDate;
  }

  // Driver ID filter
  if (driverId) {
    query.driverId = driverId;
  }

  // Status filter
  if (status && status !== 'All') {
    query.status = status;
  }

  // Duty type filter
  if (dutyType && dutyType !== 'All') {
    query.dutyType = dutyType;
  }

  // Search keyword across driverName, assignedVehicle, notes
  if (search) {
    const searchRegex = new RegExp(search.trim(), 'i');
    query.$or = [
      { driverName: searchRegex },
      { assignedVehicle: searchRegex },
      { dutyType: searchRegex },
      { notes: searchRegex }
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(500, Math.max(1, parseInt(limit, 10) || 100));
  const skip = (pageNum - 1) * limitNum;

  const total = await DriverAttendance.countDocuments(query);
  const records = await DriverAttendance.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limitNum)
    .lean();

  const data = records.map(doc => ({
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

/**
 * @desc    Get attendance summary stats for a specific date or overall
 * @route   GET /api/attendance/summary
 * @access  Public / Private
 */
export const getAttendanceSummary = asyncHandler(async (req, res) => {
  const queryDate = req.query.date || new Date().toISOString().split('T')[0];

  const records = await DriverAttendance.find({ date: queryDate }).lean();
  const totalDrivers = await Driver.countDocuments({ status: { $ne: 'Inactive' } });

  let present = 0;
  let onTrip = 0;
  let late = 0;
  let absent = 0;
  let onLeave = 0;
  let totalWorkingHours = 0;

  records.forEach(r => {
    if (r.status === 'Present') present++;
    else if (r.status === 'On Trip') onTrip++;
    else if (r.status === 'Late') late++;
    else if (r.status === 'Absent') absent++;
    else if (r.status === 'On Leave') onLeave++;

    totalWorkingHours += Number(r.workingHours) || 0;
  });

  const activeCount = present + onTrip + late;
  const avgDutyHours = activeCount > 0 ? (totalWorkingHours / activeCount).toFixed(1) : '0.0';

  res.status(200).json({
    success: true,
    date: queryDate,
    stats: {
      totalRegisteredDrivers: totalDrivers,
      presentOnDuty: present + onTrip,
      presentOnly: present,
      onTrip,
      late,
      absent,
      onLeave,
      lateAbsentLeave: late + absent + onLeave,
      totalWorkingHours: Number(totalWorkingHours.toFixed(1)),
      avgDutyHours: Number(avgDutyHours),
      totalLogged: records.length
    }
  });
});

/**
 * @desc    Get Monthly and Yearly attendance analytics & driver breakdown
 * @route   GET /api/attendance/analytics
 * @access  Public / Private
 */
export const getAttendanceAnalytics = asyncHandler(async (req, res) => {
  const period = req.query.period || 'month'; // 'month' | 'year'
  const today = new Date();
  const currentMonth = req.query.month || today.toISOString().slice(0, 7); // YYYY-MM
  const currentYear = req.query.year || today.getFullYear().toString(); // YYYY

  // Get active drivers list
  const drivers = await Driver.find().sort({ name: 1 }).lean();

  if (period === 'year') {
    // Yearly Analytics
    const yearPrefix = `^${currentYear}`;
    const records = await DriverAttendance.find({ date: { $regex: yearPrefix } }).lean();

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTrends = monthNames.map((name, index) => {
      const monthNum = String(index + 1).padStart(2, '0');
      const prefix = `${currentYear}-${monthNum}`;
      const mRecords = records.filter(r => r.date.startsWith(prefix));

      let mPresent = 0;
      let mLate = 0;
      let mAbsent = 0;
      let mLeave = 0;
      let mHours = 0;

      mRecords.forEach(r => {
        if (r.status === 'Present' || r.status === 'On Trip') mPresent++;
        else if (r.status === 'Late') mLate++;
        else if (r.status === 'Absent') mAbsent++;
        else if (r.status === 'On Leave') mLeave++;
        mHours += Number(r.workingHours) || 0;
      });

      return {
        monthCode: prefix,
        monthName: name,
        totalLogged: mRecords.length,
        present: mPresent,
        late: mLate,
        absent: mAbsent,
        onLeave: mLeave,
        totalHours: Number(mHours.toFixed(1)),
        rate: mRecords.length > 0 ? Math.round(((mPresent + mLate) / mRecords.length) * 100) : 0
      };
    });

    // Driver-wise annual totals
    const driverTotals = drivers.map(d => {
      const dRecords = records.filter(r => r.driverId === d._id.toString() || r.driverName.toLowerCase() === d.name.toLowerCase());
      let dPresent = 0;
      let dLate = 0;
      let dAbsent = 0;
      let dLeave = 0;
      let dHours = 0;

      dRecords.forEach(r => {
        if (r.status === 'Present' || r.status === 'On Trip') dPresent++;
        else if (r.status === 'Late') dLate++;
        else if (r.status === 'Absent') dAbsent++;
        else if (r.status === 'On Leave') dLeave++;
        dHours += Number(r.workingHours) || 0;
      });

      const totalLogged = dRecords.length;
      const rate = totalLogged > 0 ? Math.round(((dPresent + dLate) / totalLogged) * 100) : 0;

      return {
        driverId: d._id.toString(),
        driverName: d.name,
        photo: d.photo,
        assignedVehicle: d.assignedVehicle,
        driverType: d.driverType,
        totalLogged,
        presentDays: dPresent,
        lateDays: dLate,
        absentDays: dAbsent,
        leaveDays: dLeave,
        totalHours: Number(dHours.toFixed(1)),
        avgDutyHours: (dPresent + dLate > 0) ? Number((dHours / (dPresent + dLate)).toFixed(1)) : 0,
        attendanceRate: rate
      };
    });

    let overallHours = 0;
    let overallPresent = 0;
    let overallLate = 0;
    let overallAbsent = 0;
    let overallLeave = 0;

    records.forEach(r => {
      if (r.status === 'Present' || r.status === 'On Trip') overallPresent++;
      else if (r.status === 'Late') overallLate++;
      else if (r.status === 'Absent') overallAbsent++;
      else if (r.status === 'On Leave') overallLeave++;
      overallHours += Number(r.workingHours) || 0;
    });

    return res.status(200).json({
      success: true,
      period: 'year',
      year: currentYear,
      summary: {
        totalDrivers: drivers.length,
        totalRecords: records.length,
        overallPresent,
        overallLate,
        overallAbsent,
        overallLeave,
        overallHours: Number(overallHours.toFixed(1)),
        avgAnnualRate: records.length > 0 ? Math.round(((overallPresent + overallLate) / records.length) * 100) : 0
      },
      monthlyTrends,
      driverTotals
    });
  }

  // Default: Monthly Analytics
  const monthPrefix = `^${currentMonth}`;
  const records = await DriverAttendance.find({ date: { $regex: monthPrefix } }).sort({ date: 1 }).lean();

  // Driver-wise monthly totals
  const driverTotals = drivers.map(d => {
    const dRecords = records.filter(r => r.driverId === d._id.toString() || r.driverName.toLowerCase() === d.name.toLowerCase());
    let dPresent = 0;
    let dOnTrip = 0;
    let dLate = 0;
    let dAbsent = 0;
    let dLeave = 0;
    let dHours = 0;

    dRecords.forEach(r => {
      if (r.status === 'Present') dPresent++;
      else if (r.status === 'On Trip') dOnTrip++;
      else if (r.status === 'Late') dLate++;
      else if (r.status === 'Absent') dAbsent++;
      else if (r.status === 'On Leave') dLeave++;
      dHours += Number(r.workingHours) || 0;
    });

    const activeDays = dPresent + dOnTrip + dLate;
    const totalLogged = dRecords.length;
    const rate = totalLogged > 0 ? Math.round((activeDays / totalLogged) * 100) : 0;

    return {
      driverId: d._id.toString(),
      driverName: d.name,
      photo: d.photo,
      assignedVehicle: d.assignedVehicle,
      driverType: d.driverType,
      totalLogged,
      presentDays: dPresent + dOnTrip,
      presentOnly: dPresent,
      onTripDays: dOnTrip,
      lateDays: dLate,
      absentDays: dAbsent,
      leaveDays: dLeave,
      totalHours: Number(dHours.toFixed(1)),
      avgDutyHours: activeDays > 0 ? Number((dHours / activeDays).toFixed(1)) : 0,
      attendanceRate: rate,
      records: dRecords.map(r => ({
        ...r,
        id: r._id.toString()
      }))
    };
  });

  let overallHours = 0;
  let overallPresent = 0;
  let overallOnTrip = 0;
  let overallLate = 0;
  let overallAbsent = 0;
  let overallLeave = 0;

  records.forEach(r => {
    if (r.status === 'Present') overallPresent++;
    else if (r.status === 'On Trip') overallOnTrip++;
    else if (r.status === 'Late') overallLate++;
    else if (r.status === 'Absent') overallAbsent++;
    else if (r.status === 'On Leave') overallLeave++;
    overallHours += Number(r.workingHours) || 0;
  });

  const activeCount = overallPresent + overallOnTrip + overallLate;

  res.status(200).json({
    success: true,
    period: 'month',
    month: currentMonth,
    summary: {
      totalDrivers: drivers.length,
      totalRecords: records.length,
      presentCount: overallPresent + overallOnTrip,
      onTripCount: overallOnTrip,
      lateCount: overallLate,
      absentCount: overallAbsent,
      leaveCount: overallLeave,
      totalHours: Number(overallHours.toFixed(1)),
      avgDutyHours: activeCount > 0 ? Number((overallHours / activeCount).toFixed(1)) : 0,
      attendanceRate: records.length > 0 ? Math.round((activeCount / records.length) * 100) : 0
    },
    driverTotals,
    allRecords: records.map(r => ({
      ...r,
      id: r._id.toString()
    }))
  });
});

/**
 * @desc    Get single attendance record by ID
 * @route   GET /api/attendance/:id
 * @access  Public / Private
 */
export const getAttendanceById = asyncHandler(async (req, res) => {
  const record = await DriverAttendance.findById(req.params.id).lean();

  if (!record) {
    return res.status(404).json({
      success: false,
      error: `Attendance record with ID ${req.params.id} not found`
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
 * @desc    Mark / Upsert attendance record for a driver on a date
 * @route   POST /api/attendance
 * @access  Public / Private
 */
export const markAttendance = asyncHandler(async (req, res) => {
  const {
    driverId,
    driverName,
    date = new Date().toISOString().split('T')[0],
    status = 'Present',
    checkIn,
    checkOut,
    assignedVehicle,
    dutyType = 'Department Duty',
    workingHours,
    notes
  } = req.body;

  if (!driverId && !driverName) {
    return res.status(400).json({
      success: false,
      error: 'driverId or driverName is required.'
    });
  }

  // Lookup driver if name or id is missing
  let resolvedDriverId = driverId;
  let resolvedDriverName = driverName;
  let resolvedVehicle = assignedVehicle;

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

  const isAbsentOrLeave = status === 'Absent' || status === 'On Leave';
  const defaultCheckIn = isAbsentOrLeave ? '—' : (checkIn || '08:30 AM');
  const defaultCheckOut = isAbsentOrLeave ? '—' : (checkOut || '06:30 PM');
  const defaultHours = isAbsentOrLeave ? 0 : (workingHours !== undefined ? Number(workingHours) : 10);

  const updatePayload = {
    driverId: resolvedDriverId,
    driverName: resolvedDriverName,
    date,
    status,
    checkIn: defaultCheckIn,
    checkOut: defaultCheckOut,
    assignedVehicle: resolvedVehicle || '—',
    dutyType,
    workingHours: defaultHours,
    ...(notes !== undefined && { notes })
  };

  // Upsert: Find existing record for this driver and date
  const record = await DriverAttendance.findOneAndUpdate(
    { driverId: resolvedDriverId, date },
    { $set: updatePayload },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  res.status(200).json({
    success: true,
    message: `Attendance marked as ${status} for ${resolvedDriverName}`,
    data: {
      ...record.toObject(),
      id: record._id.toString()
    }
  });
});

/**
 * @desc    Bulk mark attendance (e.g. "Mark All Present")
 * @route   POST /api/attendance/bulk
 * @access  Public / Private
 */
export const bulkMarkAttendance = asyncHandler(async (req, res) => {
  const { date = new Date().toISOString().split('T')[0], records = [] } = req.body;

  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'records must be a non-empty array of attendance records.'
    });
  }

  const bulkOps = records.map(rec => {
    const isAbsentOrLeave = rec.status === 'Absent' || rec.status === 'On Leave';
    return {
      updateOne: {
        filter: { driverId: rec.driverId, date: rec.date || date },
        update: {
          $set: {
            driverId: rec.driverId,
            driverName: rec.driverName,
            date: rec.date || date,
            status: rec.status || 'Present',
            checkIn: isAbsentOrLeave ? '—' : (rec.checkIn || '08:30 AM'),
            checkOut: isAbsentOrLeave ? '—' : (rec.checkOut || '06:30 PM'),
            assignedVehicle: rec.assignedVehicle || '—',
            dutyType: rec.dutyType || 'Department Duty',
            workingHours: isAbsentOrLeave ? 0 : (rec.workingHours !== undefined ? Number(rec.workingHours) : 10),
            ...(rec.notes && { notes: rec.notes })
          }
        },
        upsert: true
      }
    };
  });

  const result = await DriverAttendance.bulkWrite(bulkOps);

  // Fetch updated records for this date
  const updatedRecords = await DriverAttendance.find({ date }).lean();

  res.status(200).json({
    success: true,
    message: `Successfully processed attendance for ${records.length} drivers`,
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
    upsertedCount: result.upsertedCount,
    data: updatedRecords.map(doc => ({
      ...doc,
      id: doc._id.toString()
    }))
  });
});

/**
 * @desc    Update attendance status (click-to-toggle)
 * @route   PATCH /api/attendance/:id/status
 * @access  Public / Private
 */
export const updateAttendanceStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, workingHours, checkIn, checkOut } = req.body;

  if (!status) {
    return res.status(400).json({
      success: false,
      error: 'status is required.'
    });
  }

  const existing = await DriverAttendance.findById(id);
  if (!existing) {
    return res.status(404).json({
      success: false,
      error: `Attendance record with ID ${id} not found`
    });
  }

  existing.status = status;

  if (status === 'Absent' || status === 'On Leave') {
    existing.checkIn = '—';
    existing.checkOut = '—';
    existing.workingHours = 0;
  } else {
    if (existing.checkIn === '—') existing.checkIn = checkIn || '08:30 AM';
    if (existing.checkOut === '—') existing.checkOut = checkOut || '06:30 PM';
    if (workingHours !== undefined) {
      existing.workingHours = Number(workingHours);
    } else if (existing.workingHours === 0) {
      existing.workingHours = 10;
    }
  }

  await existing.save();

  res.status(200).json({
    success: true,
    message: `Attendance status updated to ${status}`,
    data: {
      ...existing.toObject(),
      id: existing._id.toString()
    }
  });
});

/**
 * @desc    Update full attendance record (or create if matching driver + date)
 * @route   PUT /api/attendance/:id
 * @access  Public / Private
 */
export const updateAttendance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    driverId,
    driverName,
    date,
    status,
    checkIn,
    checkOut,
    assignedVehicle,
    dutyType,
    workingHours,
    notes
  } = req.body;

  let record = null;

  if (mongoose.Types.ObjectId.isValid(id)) {
    record = await DriverAttendance.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
  } else if (driverId && date) {
    record = await DriverAttendance.findOneAndUpdate(
      { driverId, date },
      { $set: req.body },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  } else if (id.startsWith('temp_')) {
    const rawDriverId = id.replace('temp_', '');
    record = await DriverAttendance.findOneAndUpdate(
      { driverId: rawDriverId, date: date || new Date().toISOString().split('T')[0] },
      { $set: req.body },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  }

  if (!record) {
    return res.status(404).json({
      success: false,
      error: `Attendance record with ID ${id} not found and insufficient info to create it.`
    });
  }

  res.status(200).json({
    success: true,
    message: 'Attendance record updated successfully',
    data: {
      ...record.toObject(),
      id: record._id.toString()
    }
  });
});

/**
 * @desc    Delete attendance record
 * @route   DELETE /api/attendance/:id
 * @access  Public / Private
 */
export const deleteAttendance = asyncHandler(async (req, res) => {
  const record = await DriverAttendance.findByIdAndDelete(req.params.id);

  if (!record) {
    return res.status(404).json({
      success: false,
      error: `Attendance record with ID ${req.params.id} not found`
    });
  }

  res.status(200).json({
    success: true,
    message: 'Attendance record deleted successfully'
  });
});
