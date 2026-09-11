import mongoose from 'mongoose';
import DriverAssignment from '../models/DriverAssignment.js';
import Driver from '../models/Driver.js';
import Vehicle from '../models/Vehicle.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

function normalizePlate(plate) {
  if (!plate || typeof plate !== 'string') return '';
  const trimmed = plate.trim().toUpperCase();
  if (['—', '-', 'UNASSIGNED', 'NONE', 'N/A'].includes(trimmed)) return '';
  return trimmed;
}

function plateKey(reg) {
  return (reg || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

/**
 * Service: Record a new active assignment.
 * Automatically marks previous active assignments for this driver or vehicle as COMPLETED.
 */
export async function recordAssignment({
  driverId,
  driverName,
  vehicleId = null,
  vehicleRegistration,
  assignedBy = 'Admin',
  reason = 'Vehicle assignment',
  odometer = 0,
  agencyId = null,
  notes = ''
}) {
  try {
    const cleanPlate = normalizePlate(vehicleRegistration);
    if (!cleanPlate || !driverId) return null;

    const now = new Date();

    // 1. Resolve vehicleId if not provided
    let vId = vehicleId;
    if (!vId) {
      const v = await Vehicle.findOne({
        registrationNumber: new RegExp(`^${cleanPlate}$`, 'i')
      }).select('_id odometer');
      if (v) {
        vId = v._id;
        if (!odometer && v.odometer) {
          odometer = v.odometer;
        }
      }
    }

    // 2. Resolve driverName if not provided
    let dName = driverName;
    if (!dName) {
      const d = await Driver.findById(driverId).select('name');
      if (d) dName = d.name;
    }

    // 3. Mark previous active assignments for this driver as COMPLETED
    await DriverAssignment.updateMany(
      {
        driverId,
        status: 'ACTIVE'
      },
      {
        $set: {
          status: 'COMPLETED',
          unassignedAt: now,
          unassignedBy: assignedBy,
          reason: `Reassigned to ${cleanPlate}`
        }
      }
    );

    // 4. Mark previous active assignments for this vehicle as COMPLETED
    await DriverAssignment.updateMany(
      {
        vehicleRegistration: cleanPlate,
        status: 'ACTIVE',
        driverId: { $ne: driverId }
      },
      {
        $set: {
          status: 'COMPLETED',
          unassignedAt: now,
          unassignedBy: assignedBy,
          reason: `Vehicle reassigned to ${dName}`
        }
      }
    );

    // 5. Create new ACTIVE assignment
    const assignment = await DriverAssignment.create({
      driverId,
      driverName: dName || 'Driver',
      vehicleId: vId,
      vehicleRegistration: cleanPlate,
      assignedAt: now,
      status: 'ACTIVE',
      assignedBy,
      reason,
      odometerAtAssignment: odometer || 0,
      agencyId,
      notes
    });

    return assignment;
  } catch (err) {
    console.error('Failed to record driver assignment:', err.message);
    return null;
  }
}

/**
 * Service: Record an unassignment.
 * Marks currently active assignment for driver or vehicle as UNASSIGNED.
 */
export async function recordUnassignment({
  driverId = null,
  vehicleRegistration = null,
  unassignedBy = 'Admin',
  reason = 'Unassigned from vehicle',
  odometer = null,
  notes = ''
}) {
  try {
    const filter = { status: 'ACTIVE' };
    if (driverId) {
      filter.driverId = driverId;
    } else if (vehicleRegistration) {
      const cleanPlate = normalizePlate(vehicleRegistration);
      if (!cleanPlate) return null;
      filter.vehicleRegistration = cleanPlate;
    } else {
      return null;
    }

    const now = new Date();
    const updateDoc = {
      status: 'UNASSIGNED',
      unassignedAt: now,
      unassignedBy,
      reason
    };
    if (odometer != null) {
      updateDoc.odometerAtUnassignment = odometer;
    }
    if (notes) {
      updateDoc.notes = notes;
    }

    const updated = await DriverAssignment.updateMany(filter, { $set: updateDoc });
    return updated;
  } catch (err) {
    console.error('Failed to record unassignment:', err.message);
    return null;
  }
}

/**
 * Auto-backfill active assignments from existing Drivers & Vehicles on first setup
 */
export async function autoBackfillAssignments() {
  try {
    const count = await DriverAssignment.countDocuments();
    if (count > 0) return; // Already has records

    const vehicles = await Vehicle.find({
      assignedDriver: { $exists: true, $nin: [null, '', '—', 'None', 'Unassigned'] }
    }).select('_id registrationNumber assignedDriver odometer agencyId');

    for (const v of vehicles) {
      const driver = await Driver.findOne({
        name: new RegExp(`^${v.assignedDriver.trim()}$`, 'i')
      }).select('_id name');

      if (driver) {
        await DriverAssignment.create({
          driverId: driver._id,
          driverName: driver.name,
          vehicleId: v._id,
          vehicleRegistration: v.registrationNumber,
          assignedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          status: 'ACTIVE',
          assignedBy: 'System (Initial Roster)',
          reason: 'Initial fleet roster synchronization',
          odometerAtAssignment: v.odometer || 0,
          agencyId: v.agencyId || null
        });
      }
    }
  } catch (err) {
    console.warn('DriverAssignment autoBackfill skipped:', err.message);
  }
}

/**
 * @desc    Get all driver assignments (paginated, filtered, scalable)
 * @route   GET /api/driver-assignments
 */
export const getAllAssignments = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    driverId,
    vehicleRegistration,
    search,
    from,
    to
  } = req.query;

  const filter = {};

  if (status && status !== 'All') {
    filter.status = status.toUpperCase();
  }

  if (driverId && mongoose.Types.ObjectId.isValid(driverId)) {
    filter.driverId = driverId;
  }

  if (vehicleRegistration) {
    filter.vehicleRegistration = new RegExp(vehicleRegistration.trim(), 'i');
  }

  if (search) {
    const s = search.trim();
    filter.$or = [
      { driverName: new RegExp(s, 'i') },
      { vehicleRegistration: new RegExp(s, 'i') },
      { reason: new RegExp(s, 'i') }
    ];
  }

  if (from || to) {
    filter.assignedAt = {};
    if (from) filter.assignedAt.$gte = new Date(from);
    if (to) filter.assignedAt.$lte = new Date(to);
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [assignments, total] = await Promise.all([
    DriverAssignment.find(filter)
      .sort({ assignedAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    DriverAssignment.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum) || 1,
    data: assignments
  });
});

/**
 * @desc    Get all active assignments
 * @route   GET /api/driver-assignments/active
 */
export const getActiveAssignments = asyncHandler(async (req, res) => {
  const active = await DriverAssignment.find({ status: 'ACTIVE' })
    .sort({ assignedAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    count: active.length,
    data: active
  });
});

/**
 * @desc    Get assignment history for a specific driver
 * @route   GET /api/driver-assignments/driver/:driverId
 */
export const getDriverHistory = asyncHandler(async (req, res) => {
  const { driverId } = req.params;
  const query = mongoose.Types.ObjectId.isValid(driverId)
    ? { driverId }
    : { driverName: new RegExp(`^${driverId}$`, 'i') };

  const history = await DriverAssignment.find(query)
    .sort({ assignedAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    count: history.length,
    data: history
  });
});

/**
 * @desc    Get assignment history for a specific vehicle
 * @route   GET /api/driver-assignments/vehicle/:registration
 */
export const getVehicleHistory = asyncHandler(async (req, res) => {
  const { registration } = req.params;
  const cleanPlate = registration.trim();

  const history = await DriverAssignment.find({
    vehicleRegistration: new RegExp(`^${cleanPlate}$`, 'i')
  })
    .sort({ assignedAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    count: history.length,
    data: history
  });
});

/**
 * @desc    Create a new driver assignment (manual API)
 * @route   POST /api/driver-assignments
 */
export const createAssignment = asyncHandler(async (req, res) => {
  const {
    driverId,
    vehicleRegistration,
    assignedBy = 'Admin',
    reason = 'Manual Assignment',
    odometerAtAssignment = 0,
    notes = ''
  } = req.body;

  if (!driverId || !vehicleRegistration) {
    return res.status(400).json({
      success: false,
      error: 'Driver ID and Vehicle Registration are required'
    });
  }

  const driver = await Driver.findById(driverId);
  if (!driver) {
    return res.status(404).json({ success: false, error: 'Driver not found' });
  }

  const cleanPlate = normalizePlate(vehicleRegistration);
  const vehicle = await Vehicle.findOne({
    registrationNumber: new RegExp(`^${cleanPlate}$`, 'i')
  });

  const assignment = await recordAssignment({
    driverId: driver._id,
    driverName: driver.name,
    vehicleId: vehicle ? vehicle._id : null,
    vehicleRegistration: cleanPlate,
    assignedBy,
    reason,
    odometer: odometerAtAssignment || (vehicle ? vehicle.odometer : 0),
    agencyId: driver.agencyId || (vehicle ? vehicle.agencyId : null),
    notes
  });

  // Sync models
  await Driver.findByIdAndUpdate(driver._id, { assignedVehicle: cleanPlate });
  if (vehicle) {
    await Vehicle.findByIdAndUpdate(vehicle._id, { assignedDriver: driver.name });
  }

  res.status(201).json({
    success: true,
    data: assignment
  });
});

/**
 * @desc    End/Unassign an active assignment
 * @route   POST /api/driver-assignments/:id/end
 */
export const endAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { unassignedBy = 'Admin', reason = 'Manual unassignment', odometer, notes } = req.body;

  const assignment = await DriverAssignment.findById(id);
  if (!assignment) {
    return res.status(404).json({ success: false, error: 'Assignment not found' });
  }

  assignment.status = 'UNASSIGNED';
  assignment.unassignedAt = new Date();
  assignment.unassignedBy = unassignedBy;
  if (reason) assignment.reason = reason;
  if (odometer != null) assignment.odometerAtUnassignment = odometer;
  if (notes) assignment.notes = notes;
  await assignment.save();

  // Clear from Driver and Vehicle if currently assigned
  await Driver.findByIdAndUpdate(assignment.driverId, { assignedVehicle: '—' });
  if (assignment.vehicleRegistration) {
    await Vehicle.findOneAndUpdate(
      { registrationNumber: assignment.vehicleRegistration, assignedDriver: assignment.driverName },
      { $unset: { assignedDriver: 1 } }
    );
  }

  res.status(200).json({
    success: true,
    data: assignment
  });
});

export const driverAssignmentController = {
  getAllAssignments,
  getActiveAssignments,
  getDriverHistory,
  getVehicleHistory,
  createAssignment,
  endAssignment
};

export default driverAssignmentController;
