import { DriverAttendance } from '../models/DriverAttendance.js';
import { DailyDutyLog } from '../models/DailyDutyLog.js';
import { withAgencyFilter } from './tenantQuery.js';

export function hoursBetween(startStr, endStr) {
  if (!startStr || !endStr || startStr === '—' || endStr === '—') return 0;
  try {
    const parseTime = (tStr) => {
      const [time, modifierRaw] = tStr.trim().split(/\s+/);
      const modifier = (modifierRaw || '').toUpperCase();
      let [hours, minutes] = time.split(':').map(Number);
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      return hours + minutes / 60;
    };
    const startH = parseTime(startStr);
    const endH = parseTime(endStr);
    const diff = endH >= startH ? endH - startH : (24 - startH) + endH;
    return Number(diff.toFixed(1));
  } catch {
    return 0;
  }
}

function isRealTime(value) {
  return typeof value === 'string' && value.trim() && value.trim() !== '—';
}

/**
 * Upsert attendance from a daily duty log (driver check-in / check-out).
 * Start duty → Present + checkIn; end duty → checkOut + working hours.
 */
export async function upsertAttendanceFromDutyLog(req, log) {
  if (!log?.driverId || !log?.date || !isRealTime(log.startTime)) return null;

  const checkIn = log.startTime.trim();
  const checkOut = isRealTime(log.endTime) ? log.endTime.trim() : '—';
  const workingHours =
    checkOut !== '—'
      ? Number(log.totalHours) || hoursBetween(checkIn, checkOut)
      : 0;

  const agencyId = log.agencyId || req.driver?.agencyId || req.agencyId || null;

  const doc = await DriverAttendance.findOneAndUpdate(
    { driverId: String(log.driverId), date: log.date },
    {
      $setOnInsert: {
        driverId: String(log.driverId),
        driverName: log.driverName || 'Driver',
        date: log.date,
        dutyType: 'Department Duty',
        ...(agencyId ? { agencyId } : {})
      },
      $set: {
        status: 'Present',
        checkIn,
        checkOut,
        workingHours,
        assignedVehicle: log.vehicle || undefined
      }
    },
    { upsert: true, new: true }
  );

  return doc;
}

/**
 * Merge duty-log start/end times into attendance records (and backfill missing rows).
 */
export async function enrichAttendanceFromDutyLogs(req, records, queryMeta = {}) {
  const { date, month, year, startDate, endDate } = queryMeta;
  const dutyQuery = {};

  if (date) {
    dutyQuery.date = date;
  } else if (month) {
    dutyQuery.date = { $regex: `^${month}` };
  } else if (year) {
    dutyQuery.date = { $regex: `^${year}` };
  } else if (startDate || endDate) {
    dutyQuery.date = {};
    if (startDate) dutyQuery.date.$gte = startDate;
    if (endDate) dutyQuery.date.$lte = endDate;
  } else {
    return records;
  }

  const logs = await DailyDutyLog.find(withAgencyFilter(req, dutyQuery)).lean();
  if (!logs.length) return records;

  const byKey = new Map();
  const enriched = records.map((record) => {
    const copy = { ...record };
    byKey.set(`${copy.driverId}|${copy.date}`, copy);
    return copy;
  });

  for (const log of logs) {
    if (!log.driverId || !isRealTime(log.startTime)) continue;

    const key = `${log.driverId}|${log.date}`;
    const checkIn = log.startTime.trim();
    const checkOut = isRealTime(log.endTime) ? log.endTime.trim() : '—';
    const workingHours =
      checkOut !== '—'
        ? Number(log.totalHours) || hoursBetween(checkIn, checkOut)
        : 0;

    const existing = byKey.get(key);
    if (existing) {
      const needsSync =
        existing.checkIn !== checkIn ||
        existing.checkOut !== checkOut ||
        Number(existing.workingHours || 0) !== workingHours ||
        (existing.status === 'Absent' && checkIn);

      if (needsSync) {
        existing.checkIn = checkIn;
        existing.checkOut = checkOut;
        existing.workingHours = workingHours;
        if (existing.status === 'Absent') existing.status = 'Present';
        if (log.vehicle) existing.assignedVehicle = log.vehicle;

        if (existing._id) {
          await DriverAttendance.updateOne(
            { _id: existing._id },
            {
              $set: {
                checkIn,
                checkOut,
                workingHours,
                status: existing.status === 'Absent' ? 'Present' : existing.status,
                ...(log.vehicle ? { assignedVehicle: log.vehicle } : {})
              }
            }
          ).catch(() => {});
        }
      }
      continue;
    }

    const doc = await upsertAttendanceFromDutyLog(req, log);
    if (!doc) continue;

    const json = typeof doc.toJSON === 'function' ? doc.toJSON() : { ...doc };
    json.id = json.id || doc._id?.toString();
    enriched.push(json);
    byKey.set(key, json);
  }

  return enriched;
}
