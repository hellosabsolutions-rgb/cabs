import { ActivityLog } from '../models/ActivityLog.js';
import { User } from '../models/User.js';
import { Driver } from '../models/Driver.js';
import { DriverAttendance } from '../models/DriverAttendance.js';
import { DailyDutyLog } from '../models/DailyDutyLog.js';
import { Trip } from '../models/Trip.js';
import { DriverAssignment } from '../models/DriverAssignment.js';
import { DriverExpense } from '../models/DriverExpense.js';
import { Agency } from '../models/Agency.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

/**
 * Service to record an activity event anywhere in backend
 */
export async function logSystemActivity({
  agencyId = null,
  agencyName = '',
  actorId = null,
  actorName = 'System',
  actorEmail = '',
  actorRole = 'system',
  actorAvatar = null,
  actorType = 'user',
  action = 'Activity Recorded',
  category = 'system',
  description = '',
  targetEntity = '',
  targetId = '',
  meta = {}
}) {
  try {
    const log = await ActivityLog.create({
      agencyId,
      agencyName,
      actorId: actorId ? String(actorId) : undefined,
      actorName,
      actorEmail,
      actorRole,
      actorAvatar,
      actorType,
      action,
      category,
      description,
      targetEntity,
      targetId,
      meta
    });
    return log;
  } catch (err) {
    console.warn('Failed to record activity log:', err.message);
    return null;
  }
}

/**
 * @desc    Get all activities with filtering and entity cross-aggregation
 * @route   GET /api/activities
 */
export const getActivities = asyncHandler(async (req, res) => {
  const {
    search = '',
    userId = '',
    userName = '',
    actorType = '',
    category = '',
    agencyId = '',
    limit = 50,
    page = 1
  } = req.query;

  const filter = {};
  if (agencyId && agencyId !== 'all') {
    filter.agencyId = agencyId;
  }
  if (actorType && actorType !== 'all') {
    filter.actorType = actorType;
  }
  if (category && category !== 'all') {
    filter.category = category;
  }
  if (userId && userId !== 'all') {
    filter.actorId = userId;
  }

  // 1. Fetch saved ActivityLog items
  let dbLogs = await ActivityLog.find(filter)
    .sort({ createdAt: -1 })
    .limit(Number(limit) * 2)
    .lean();

  // 2. Synthesize activities from core fleet collections if DB activity logs are few
  const syntheticActivities = [];

  try {
    // Pull recent Driver Assignments
    const assignments = await DriverAssignment.find({})
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();
    for (const a of assignments) {
      syntheticActivities.push({
        id: `synth-assign-${a._id}`,
        agencyId: a.agencyId,
        actorId: a.driverId ? String(a.driverId) : undefined,
        actorName: a.driverName || 'Driver',
        actorRole: 'driver',
        actorType: 'driver',
        action: a.status === 'UNASSIGNED' ? 'Vehicle Unassigned' : 'Vehicle Assigned',
        category: 'vehicles',
        description:
          a.status === 'UNASSIGNED'
            ? `Vehicle ${a.vehicleRegistration} was detached from ${a.driverName || 'driver'}`
            : `Allocated vehicle ${a.vehicleRegistration} to ${a.driverName || 'driver'}`,
        meta: {
          vehicleRegistration: a.vehicleRegistration,
          reason: a.reason,
          assignedBy: a.assignedBy
        },
        createdAt: a.assignedAt || a.createdAt || new Date()
      });
    }

    // Pull recent Attendance records
    const attendanceLogs = await DriverAttendance.find({})
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();
    for (const att of attendanceLogs) {
      syntheticActivities.push({
        id: `synth-att-${att._id}`,
        agencyId: att.agencyId,
        actorId: att.driverId ? String(att.driverId) : undefined,
        actorName: att.driverName || 'Driver',
        actorRole: 'driver',
        actorType: 'driver',
        action: att.status === 'Present' ? 'Clocked In (Present)' : `Attendance Marked (${att.status})`,
        category: 'attendance',
        description: `${att.driverName || 'Driver'} marked status as ${att.status} for ${att.date || 'today'} ${att.assignedVehicle ? `on vehicle ${att.assignedVehicle}` : ''}`,
        meta: {
          status: att.status,
          date: att.date,
          vehicle: att.assignedVehicle
        },
        createdAt: att.createdAt || new Date()
      });
    }

    // Pull recent Daily Duty logs
    const dutyLogs = await DailyDutyLog.find({})
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();
    for (const d of dutyLogs) {
      syntheticActivities.push({
        id: `synth-duty-${d._id}`,
        agencyId: d.agencyId,
        actorId: d.driverId ? String(d.driverId) : undefined,
        actorName: d.driverName || 'Driver',
        actorRole: 'driver',
        actorType: 'driver',
        action: 'Duty Log Logged',
        category: 'duty',
        description: `Logged duty trip for ${d.departmentName || 'Client'}: ${d.vehicle || 'Vehicle'} (${d.startKm && d.endKm ? `${d.endKm - d.startKm} km` : 'completed'})`,
        meta: {
          department: d.departmentName,
          vehicle: d.vehicle,
          km: d.startKm && d.endKm ? d.endKm - d.startKm : 0
        },
        createdAt: d.createdAt || new Date()
      });
    }

    // Pull recent Trips
    const trips = await Trip.find({})
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();
    for (const t of trips) {
      syntheticActivities.push({
        id: `synth-trip-${t._id}`,
        agencyId: t.agencyId,
        actorId: t.driverId ? String(t.driverId) : undefined,
        actorName: t.driverName || 'Driver',
        actorRole: 'driver',
        actorType: 'driver',
        action: `Trip #${t.tripNumber || 'Booking'} (${t.status || 'Active'})`,
        category: 'trips',
        description: `Trip route ${t.route || t.pickupLocation || 'Local Route'} · Revenue ₹${t.revenue || 0}`,
        meta: {
          tripNumber: t.tripNumber,
          route: t.route,
          revenue: t.revenue,
          status: t.status
        },
        createdAt: t.createdAt || new Date()
      });
    }

    // Pull recent Driver Expenses
    const expenses = await DriverExpense.find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    for (const exp of expenses) {
      syntheticActivities.push({
        id: `synth-exp-${exp._id}`,
        agencyId: exp.agencyId,
        actorId: exp.driverId ? String(exp.driverId) : undefined,
        actorName: exp.driverName || 'Driver',
        actorRole: 'driver',
        actorType: 'driver',
        action: `Expense Claim (${exp.category || 'Driver Expense'})`,
        category: 'expenses',
        description: `Claimed ₹${exp.amount || 0} for ${exp.category || 'fleet expense'} on vehicle ${exp.vehicle || '—'}`,
        meta: {
          amount: exp.amount,
          category: exp.category,
          status: exp.status
        },
        createdAt: exp.createdAt || new Date()
      });
    }

    // Pull recent User logins
    const users = await User.find({ lastLoginAt: { $ne: null } })
      .sort({ lastLoginAt: -1 })
      .limit(15)
      .lean();
    for (const u of users) {
      syntheticActivities.push({
        id: `synth-user-${u._id}`,
        actorId: String(u._id),
        actorName: u.name,
        actorEmail: u.email,
        actorRole: u.role || 'admin',
        actorType: 'user',
        action: 'User Session Login',
        category: 'auth',
        description: `${u.name} (${u.role || 'admin'}) authenticated and accessed organization dashboard`,
        meta: {
          role: u.role,
          email: u.email
        },
        createdAt: u.lastLoginAt || u.updatedAt || u.createdAt
      });
    }
  } catch (synthErr) {
    console.warn('Synthetic activity aggregation warning:', synthErr.message);
  }

  // Combine real DB logs and synthetic logs, avoiding duplicates
  const seenIds = new Set(dbLogs.map(l => String(l._id || l.id)));
  const allLogs = [...dbLogs];

  for (const s of syntheticActivities) {
    if (!seenIds.has(s.id)) {
      allLogs.push(s);
      seenIds.add(s.id);
    }
  }

  // Filter in-memory if synthetic logs were merged
  let filtered = allLogs;
  if (actorType && actorType !== 'all') {
    filtered = filtered.filter(l => l.actorType === actorType);
  }
  if (category && category !== 'all') {
    filtered = filtered.filter(l => l.category === category);
  }
  if (userId && userId !== 'all') {
    filtered = filtered.filter(
      l => String(l.actorId) === String(userId) || (l.actorName && l.actorName.toLowerCase() === userId.toLowerCase())
    );
  }
  if (userName && userName !== 'all') {
    filtered = filtered.filter(
      l => l.actorName && l.actorName.toLowerCase().includes(userName.toLowerCase())
    );
  }
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      l =>
        (l.actorName && l.actorName.toLowerCase().includes(q)) ||
        (l.action && l.action.toLowerCase().includes(q)) ||
        (l.description && l.description.toLowerCase().includes(q)) ||
        (l.category && l.category.toLowerCase().includes(q))
    );
  }

  // Sort by date descending
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const total = filtered.length;
  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 50;
  const startIndex = (pageNum - 1) * limitNum;
  const pagedData = filtered.slice(startIndex, startIndex + limitNum);

  res.status(200).json({
    success: true,
    data: pagedData,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum) || 1
  });
});

/**
 * @desc    Get user & driver telemetry statistics including last activity
 * @route   GET /api/activities/users-stats
 */
export const getUserStats = asyncHandler(async (req, res) => {
  const { agencyId } = req.query;

  const agencyFilter = agencyId && agencyId !== 'all' ? { agencyId } : {};

  // Fetch all users and drivers
  const [users, drivers, agencies] = await Promise.all([
    User.find({}).select('name email role avatar status lastLoginAt currentAgency createdAt updatedAt').lean(),
    Driver.find(agencyFilter).select('name phone driverType status assignedVehicle joiningDate lastLoginAt photo createdAt updatedAt').lean(),
    Agency.find({}).select('name _id').lean()
  ]);

  const agencyMap = {};
  agencies.forEach(a => {
    agencyMap[String(a._id)] = a.name;
  });

  const memberStats = [];

  // Helper to calculate relative time
  const formatTimeAgo = date => {
    if (!date) return 'No activity yet';
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  // 1. Process System Users (Admin, Manager, Operator)
  for (const u of users) {
    const uId = String(u._id);
    // Find latest activity from ActivityLog
    const latestLog = await ActivityLog.findOne({
      $or: [{ actorId: uId }, { actorName: u.name }]
    })
      .sort({ createdAt: -1 })
      .lean();

    const totalLogs = await ActivityLog.countDocuments({
      $or: [{ actorId: uId }, { actorName: u.name }]
    });

    const todayLogs = await ActivityLog.countDocuments({
      $or: [{ actorId: uId }, { actorName: u.name }],
      createdAt: { $gte: startOfToday }
    });

    const effectiveLastDate = latestLog?.createdAt || u.lastLoginAt || u.updatedAt || u.createdAt;
    const lastAction = latestLog?.action || (u.lastLoginAt ? 'Session Login' : 'Account Configured');
    const lastDesc =
      latestLog?.description ||
      (u.lastLoginAt
        ? `Logged in to administrative portal (${formatTimeAgo(u.lastLoginAt)})`
        : 'System user account registered');

    memberStats.push({
      id: uId,
      name: u.name,
      email: u.email,
      avatar: u.avatar,
      actorType: 'user',
      role: u.role || 'admin',
      status: u.status || 'Active',
      agencyName: u.currentAgency ? agencyMap[String(u.currentAgency)] || 'Default Agency' : 'Organization Admin',
      totalActivities: totalLogs + (u.lastLoginAt ? 1 : 0),
      todayActivitiesCount: todayLogs,
      lastLoginAt: u.lastLoginAt,
      lastActivity: {
        action: lastAction,
        description: lastDesc,
        category: latestLog?.category || 'auth',
        timestamp: effectiveLastDate,
        timeAgo: formatTimeAgo(effectiveLastDate)
      }
    });
  }

  // 2. Process Drivers
  for (const d of drivers) {
    const dId = String(d._id);
    const dName = d.name;

    // Cross-query latest driver events
    const [latestAssign, latestAtt, latestDuty, latestExp, latestLog] = await Promise.all([
      DriverAssignment.findOne({ $or: [{ driverId: dId }, { driverName: dName }] })
        .sort({ assignedAt: -1, createdAt: -1 })
        .lean(),
      DriverAttendance.findOne({ $or: [{ driverId: dId }, { driverName: dName }] })
        .sort({ createdAt: -1 })
        .lean(),
      DailyDutyLog.findOne({ $or: [{ driverId: dId }, { driverName: dName }] })
        .sort({ createdAt: -1 })
        .lean(),
      DriverExpense.findOne({ $or: [{ driverId: dId }, { driverName: dName }] })
        .sort({ createdAt: -1 })
        .lean(),
      ActivityLog.findOne({ $or: [{ actorId: dId }, { actorName: dName }] })
        .sort({ createdAt: -1 })
        .lean()
    ]);

    // Aggregate counts
    const [attCount, dutyCount, expCount, assignCount, logCount] = await Promise.all([
      DriverAttendance.countDocuments({ $or: [{ driverId: dId }, { driverName: dName }] }),
      DailyDutyLog.countDocuments({ $or: [{ driverId: dId }, { driverName: dName }] }),
      DriverExpense.countDocuments({ $or: [{ driverId: dId }, { driverName: dName }] }),
      DriverAssignment.countDocuments({ $or: [{ driverId: dId }, { driverName: dName }] }),
      ActivityLog.countDocuments({ $or: [{ actorId: dId }, { actorName: dName }] })
    ]);

    const totalActivities = attCount + dutyCount + expCount + assignCount + logCount;

    // Find the latest of all events
    const candidates = [
      latestLog && {
        action: latestLog.action,
        description: latestLog.description,
        category: latestLog.category || 'duty',
        timestamp: latestLog.createdAt
      },
      latestAssign && {
        action: latestAssign.status === 'UNASSIGNED' ? 'Vehicle Unassigned' : 'Vehicle Assigned',
        description: `${latestAssign.status === 'UNASSIGNED' ? 'Unassigned from' : 'Assigned to'} vehicle ${latestAssign.vehicleRegistration}`,
        category: 'vehicles',
        timestamp: latestAssign.assignedAt || latestAssign.createdAt
      },
      latestDuty && {
        action: 'Duty Log Submitted',
        description: `Duty logged on ${latestDuty.vehicle || 'vehicle'} (${latestDuty.departmentName || 'Commercial duty'})`,
        category: 'duty',
        timestamp: latestDuty.createdAt
      },
      latestAtt && {
        action: `Attendance (${latestAtt.status})`,
        description: `Marked attendance as ${latestAtt.status} for ${latestAtt.date || 'today'}`,
        category: 'attendance',
        timestamp: latestAtt.createdAt
      },
      latestExp && {
        action: 'Expense Submitted',
        description: `Logged ₹${latestExp.amount || 0} under ${latestExp.category || 'Expense'}`,
        category: 'expenses',
        timestamp: latestExp.createdAt
      }
    ].filter(Boolean);

    candidates.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const topEvent = candidates[0];

    const fallbackDate = d.lastLoginAt || d.updatedAt || d.createdAt;
    const lastAction = topEvent?.action || (d.assignedVehicle ? `Vehicle ${d.assignedVehicle} Assigned` : 'Driver Roster Added');
    const lastDesc =
      topEvent?.description ||
      (d.assignedVehicle
        ? `Permanently mapped to vehicle ${d.assignedVehicle}`
        : 'Registered in fleet pool roster');
    const effectiveDate = topEvent?.timestamp || fallbackDate;

    // Today's activities
    const [attToday, dutyToday] = await Promise.all([
      DriverAttendance.countDocuments({
        $or: [{ driverId: dId }, { driverName: dName }],
        createdAt: { $gte: startOfToday }
      }),
      DailyDutyLog.countDocuments({
        $or: [{ driverId: dId }, { driverName: dName }],
        createdAt: { $gte: startOfToday }
      })
    ]);

    memberStats.push({
      id: dId,
      name: d.name,
      phone: d.phone,
      avatar: d.photo,
      actorType: 'driver',
      role: 'driver',
      status: d.status || 'On duty',
      assignedVehicle: d.assignedVehicle,
      agencyName: d.agencyId ? agencyMap[String(d.agencyId)] || 'Agency Fleet' : 'Fleet Operations',
      totalActivities,
      todayActivitiesCount: attToday + dutyToday,
      lastLoginAt: d.lastLoginAt,
      lastActivity: {
        action: lastAction,
        description: lastDesc,
        category: topEvent?.category || 'duty',
        timestamp: effectiveDate,
        timeAgo: formatTimeAgo(effectiveDate)
      }
    });
  }

  // Sort overall members by last activity timestamp descending
  memberStats.sort((a, b) => {
    const timeA = a.lastActivity?.timestamp ? new Date(a.lastActivity.timestamp).getTime() : 0;
    const timeB = b.lastActivity?.timestamp ? new Date(b.lastActivity.timestamp).getTime() : 0;
    return timeB - timeA;
  });

  res.status(200).json({
    success: true,
    data: memberStats,
    total: memberStats.length
  });
});

/**
 * @desc    Create a custom activity log
 * @route   POST /api/activities
 */
export const createActivity = asyncHandler(async (req, res) => {
  const {
    agencyId,
    agencyName,
    actorId,
    actorName,
    actorEmail,
    actorRole,
    actorAvatar,
    actorType,
    action,
    category,
    description,
    targetEntity,
    targetId,
    meta
  } = req.body;

  if (!action || !description) {
    return res.status(400).json({
      success: false,
      error: 'Action and description are required'
    });
  }

  const log = await ActivityLog.create({
    agencyId,
    agencyName,
    actorId,
    actorName: actorName || 'System',
    actorEmail,
    actorRole: actorRole || 'admin',
    actorAvatar,
    actorType: actorType || 'user',
    action,
    category: category || 'system',
    description,
    targetEntity,
    targetId,
    meta: meta || {}
  });

  res.status(201).json({
    success: true,
    data: log
  });
});

export const activityController = {
  getActivities,
  getUserStats,
  createActivity,
  logSystemActivity
};

export default activityController;
