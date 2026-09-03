import { Vehicle } from '../models/Vehicle.js';
import { Driver } from '../models/Driver.js';
import { Trip } from '../models/Trip.js';
import { Compliance } from '../models/Compliance.js';
import { FuelLog } from '../models/FuelLog.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

/**
 * Optimized Dashboard metrics using parallel MongoDB aggregation pipelines
 */
export const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    vehicleStats,
    driverStats,
    tripStats,
    fuelStats,
    complianceStats
  ] = await Promise.all([
    // Vehicle Counts & Financials
    Vehicle.aggregate([
      {
        $group: {
          _id: null,
          totalVehicles: { $sum: 1 },
          runningVehicles: {
            $sum: { $cond: [{ $eq: ['$status', 'Running'] }, 1, 0] }
          },
          activeVehicles: {
            $sum: { $cond: [{ $in: ['$status', ['Running', 'Active']] }, 1, 0] }
          },
          idleVehicles: {
            $sum: { $cond: [{ $eq: ['$status', 'Idle'] }, 1, 0] }
          },
          maintenanceVehicles: {
            $sum: { $cond: [{ $eq: ['$status', 'Maintenance'] }, 1, 0] }
          },
          totalRevenue: { $sum: '$revenue' },
          totalExpense: { $sum: '$expense' },
          totalProfit: { $sum: '$profit' }
        }
      }
    ]),

    // Drivers Counts
    Driver.aggregate([
      {
        $group: {
          _id: null,
          totalDrivers: { $sum: 1 },
          onDutyDrivers: {
            $sum: { $cond: [{ $eq: ['$status', 'On duty'] }, 1, 0] }
          }
        }
      }
    ]),

    // Trips Ongoing vs Completed
    Trip.aggregate([
      {
        $group: {
          _id: null,
          totalTrips: { $sum: 1 },
          ongoingTrips: {
            $sum: { $cond: [{ $eq: ['$status', 'Ongoing'] }, 1, 0] }
          },
          completedTrips: {
            $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
          },
          tripsRevenue: { $sum: '$revenue' },
          tripsProfit: { $sum: '$profit' }
        }
      }
    ]),

    // Fuel Consumption & Spend
    FuelLog.aggregate([
      {
        $group: {
          _id: null,
          totalFuelLitres: { $sum: '$litres' },
          totalFuelCost: { $sum: '$totalCost' }
        }
      }
    ]),

    // Compliance Alerts
    Compliance.aggregate([
      {
        $group: {
          _id: null,
          totalDocs: { $sum: 1 },
          expiringSoon: {
            $sum: { $cond: [{ $eq: ['$statusType', 'soon'] }, 1, 0] }
          },
          expired: {
            $sum: { $cond: [{ $eq: ['$statusType', 'late'] }, 1, 0] }
          }
        }
      }
    ])
  ]);

  const v = vehicleStats[0] || {
    totalVehicles: 0,
    runningVehicles: 0,
    activeVehicles: 0,
    idleVehicles: 0,
    maintenanceVehicles: 0,
    totalRevenue: 0,
    totalExpense: 0,
    totalProfit: 0
  };

  const d = driverStats[0] || { totalDrivers: 0, onDutyDrivers: 0 };
  const t = tripStats[0] || { totalTrips: 0, ongoingTrips: 0, completedTrips: 0, tripsRevenue: 0, tripsProfit: 0 };
  const f = fuelStats[0] || { totalFuelLitres: 0, totalFuelCost: 0 };
  const c = complianceStats[0] || { totalDocs: 0, expiringSoon: 0, expired: 0 };

  res.status(200).json({
    success: true,
    data: {
      vehicles: v,
      drivers: d,
      trips: t,
      fuel: f,
      compliance: c
    }
  });
});
