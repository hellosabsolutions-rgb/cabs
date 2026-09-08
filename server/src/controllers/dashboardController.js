import { Vehicle } from '../models/Vehicle.js';
import { Driver } from '../models/Driver.js';
import { Trip } from '../models/Trip.js';
import { Booking } from '../models/Booking.js';
import { Compliance } from '../models/Compliance.js';
import { FuelLog } from '../models/FuelLog.js';
import { FastagTransaction } from '../models/FastagTransaction.js';
import { DriverExpense } from '../models/DriverExpense.js';
import { DailyDutyLog } from '../models/DailyDutyLog.js';
import { MonthlyBill } from '../models/MonthlyBill.js';
import { Expense } from '../models/Expense.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * @desc    Comprehensive Dashboard metrics using 100% real MongoDB aggregation pipelines
 * @route   GET /api/dashboard/stats
 * @access  Public / Private
 */
export const getDashboardStats = asyncHandler(async (req, res) => {
  const agencyId = req.headers['x-agency-id'] || req.query.agencyId || null;
  const matchAgency = agencyId ? { agencyId } : {};

  // 1. Run parallel aggregations across collections
  const [
    vehicleFinAgg,
    driverAgg,
    tripTotalsAgg,
    fuelTotalsAgg,
    fastagTotalsAgg,
    driverExpTotalsAgg,
    genExpTotalsAgg,
    complianceAgg,
    billMonthlyAgg,
    tripMonthlyAgg,
    dutyMonthlyAgg,
    fuelMonthlyAgg,
    fastagMonthlyAgg,
    driverExpMonthlyAgg
  ] = await Promise.all([
    // A. Real Vehicle-wise financials via $lookup
    Vehicle.aggregate([
      ...(agencyId ? [{ $match: matchAgency }] : []),
      {
        $lookup: {
          from: 'monthlybills',
          localField: 'registrationNumber',
          foreignField: 'vehicle',
          as: 'bills'
        }
      },
      {
        $lookup: {
          from: 'trips',
          localField: 'registrationNumber',
          foreignField: 'vehicle',
          as: 'trips'
        }
      },
      {
        $lookup: {
          from: 'dailydutylogs',
          localField: 'registrationNumber',
          foreignField: 'vehicle',
          as: 'dutyLogs'
        }
      },
      {
        $lookup: {
          from: 'fuellogs',
          localField: 'registrationNumber',
          foreignField: 'vehicle',
          as: 'fuelLogs'
        }
      },
      {
        $lookup: {
          from: 'fastagtransactions',
          localField: 'registrationNumber',
          foreignField: 'vehicle',
          as: 'fastagTxns'
        }
      },
      {
        $lookup: {
          from: 'expenses',
          localField: 'registrationNumber',
          foreignField: 'vehicle',
          as: 'expenses'
        }
      },
      {
        $project: {
          registrationNumber: 1,
          model: 1,
          type: 1,
          status: 1,
          assignedDriver: 1,
          assignedTo: 1,
          meta: 1,
          deptRevenue: {
            $sum: {
              $map: {
                input: '$bills',
                as: 'b',
                in: { $ifNull: ['$$b.totalBill', { $ifNull: ['$$b.baseContractAmount', 0] }] }
              }
            }
          },
          tripRevenue: {
            $add: [
              { $sum: '$trips.revenue' },
              { $sum: '$dutyLogs.tripFare' }
            ]
          },
          tripExpenses: { $sum: '$trips.expenses' },
          fuelExpenses: { $sum: '$fuelLogs.totalCost' },
          tollExpenses: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$fastagTxns',
                    as: 'tx',
                    cond: { $eq: ['$$tx.type', 'Toll Deduction'] }
                  }
                },
                as: 'tx',
                in: '$$tx.amount'
              }
            }
          },
          generalExpenses: { $sum: '$expenses.amount' }
        }
      },
      {
        $project: {
          registrationNumber: 1,
          model: 1,
          type: 1,
          status: 1,
          assignedDriver: 1,
          assignedTo: 1,
          meta: 1,
          deptRevenue: 1,
          tripRevenue: 1,
          revenue: { $add: ['$deptRevenue', '$tripRevenue'] },
          expense: {
            $add: [
              '$tripExpenses',
              '$fuelExpenses',
              '$tollExpenses',
              '$generalExpenses'
            ]
          }
        }
      },
      {
        $project: {
          registrationNumber: 1,
          model: 1,
          type: 1,
          status: 1,
          assignedDriver: 1,
          assignedTo: 1,
          meta: 1,
          deptRevenue: 1,
          tripRevenue: 1,
          revenue: 1,
          expense: 1,
          profit: { $subtract: ['$revenue', '$expense'] },
          margin: {
            $cond: [
              { $gt: ['$revenue', 0] },
              {
                $round: [
                  {
                    $multiply: [
                      { $divide: [{ $subtract: ['$revenue', '$expense'] }, '$revenue'] },
                      100
                    ]
                  },
                  1
                ]
              },
              0
            ]
          }
        }
      },
      { $sort: { profit: -1 } }
    ]),

    // B. Drivers status aggregation
    Driver.aggregate([
      ...(agencyId ? [{ $match: matchAgency }] : []),
      {
        $group: {
          _id: null,
          totalDrivers: { $sum: 1 },
          onDutyDrivers: {
            $sum: { $cond: [{ $eq: ['$status', 'On duty'] }, 1, 0] }
          },
          offDutyDrivers: {
            $sum: { $cond: [{ $ne: ['$status', 'On duty'] }, 1, 0] }
          }
        }
      }
    ]),

    // C. Trip detailed cost breakdown
    Trip.aggregate([
      ...(agencyId ? [{ $match: matchAgency }] : []),
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
          totalRevenue: { $sum: '$revenue' },
          totalFuel: { $sum: '$fuelCost' },
          totalFastag: { $sum: '$fastagCost' },
          totalBata: { $sum: '$driverBata' },
          totalOther: { $sum: '$otherExpenses' },
          totalExpenses: { $sum: '$expenses' }
        }
      }
    ]),

    // D. Fuel Logs total cost and litres
    FuelLog.aggregate([
      ...(agencyId ? [{ $match: matchAgency }] : []),
      {
        $group: {
          _id: null,
          totalLogs: { $sum: 1 },
          totalLitres: { $sum: '$litres' },
          totalFuelCost: { $sum: '$totalCost' }
        }
      }
    ]),

    // E. Fastag Toll Deductions
    FastagTransaction.aggregate([
      {
        $match: {
          type: 'Toll Deduction',
          ...(agencyId ? matchAgency : {})
        }
      },
      {
        $group: {
          _id: null,
          totalToll: { $sum: '$amount' }
        }
      }
    ]),

    // F. Driver standalone expenses
    DriverExpense.aggregate([
      ...(agencyId ? [{ $match: matchAgency }] : []),
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' }
        }
      }
    ]),

    // G. General expenses by category
    Expense.aggregate([
      ...(agencyId ? [{ $match: matchAgency }] : []),
      {
        $group: {
          _id: null,
          totalFuel: { $sum: { $cond: [{ $eq: ['$category', 'Fuel'] }, '$amount', 0] } },
          totalDriver: { $sum: { $cond: [{ $eq: ['$category', 'Driver'] }, '$amount', 0] } },
          totalMaintenance: { $sum: { $cond: [{ $eq: ['$category', 'Maintenance'] }, '$amount', 0] } },
          totalOther: { $sum: { $cond: [{ $in: ['$category', ['Fuel', 'Driver', 'Maintenance']] }, 0, '$amount'] } }
        }
      }
    ]),

    // H. Compliance documents status
    Compliance.aggregate([
      ...(agencyId ? [{ $match: matchAgency }] : []),
      {
        $group: {
          _id: null,
          totalDocs: { $sum: 1 },
          expiringSoon: {
            $sum: { $cond: [{ $eq: ['$status', 'Expiring Soon'] }, 1, 0] }
          },
          expired: {
            $sum: { $cond: [{ $eq: ['$status', 'Expired'] }, 1, 0] }
          }
        }
      }
    ]),

    // I. Monthly Bills grouped by billingMonth
    MonthlyBill.aggregate([
      ...(agencyId ? [{ $match: matchAgency }] : []),
      {
        $group: {
          _id: '$billingMonth',
          revenue: { $sum: { $ifNull: ['$totalBill', { $ifNull: ['$baseContractAmount', 0] }] } }
        }
      }
    ]),

    // J. Trips grouped by month
    Trip.aggregate([
      ...(agencyId ? [{ $match: matchAgency }] : []),
      {
        $group: {
          _id: { $substr: ['$startDate', 0, 7] },
          revenue: { $sum: '$revenue' },
          expense: { $sum: '$expenses' }
        }
      }
    ]),

    // K. Duty Logs weekend trips grouped by month
    DailyDutyLog.aggregate([
      ...(agencyId ? [{ $match: matchAgency }] : []),
      {
        $group: {
          _id: { $substr: ['$date', 0, 7] },
          revenue: { $sum: '$tripFare' }
        }
      }
    ]),

    // L. Fuel logs grouped by month
    FuelLog.aggregate([
      ...(agencyId ? [{ $match: matchAgency }] : []),
      {
        $group: {
          _id: { $substr: ['$date', 0, 7] },
          expense: { $sum: '$totalCost' }
        }
      }
    ]),

    // M. FASTag toll deductions grouped by month
    FastagTransaction.aggregate([
      {
        $match: {
          type: 'Toll Deduction',
          ...(agencyId ? matchAgency : {})
        }
      },
      {
        $group: {
          _id: { $substr: ['$date', 0, 7] },
          expense: { $sum: '$amount' }
        }
      }
    ]),

    // N. Driver expenses grouped by month
    DriverExpense.aggregate([
      ...(agencyId ? [{ $match: matchAgency }] : []),
      {
        $group: {
          _id: { $substr: ['$date', 0, 7] },
          expense: { $sum: '$amount' }
        }
      }
    ])
  ]);

  // 2. Sync vehicle live financial numbers to MongoDB in the background
  try {
    const updateOps = vehicleFinAgg.map(v => ({
      updateOne: {
        filter: { _id: v._id },
        update: {
          $set: {
            revenue: v.revenue,
            expense: v.expense,
            profit: v.profit
          }
        }
      }
    }));
    if (updateOps.length > 0) {
      await Vehicle.bulkWrite(updateOps, { ordered: false });
    }
  } catch (bulkErr) {
    console.warn('Vehicle live financials sync notice:', bulkErr.message);
  }

  // 3. Compute Real KPI Metrics from Vehicle Aggregations
  let totalRevenue = 0;
  let deptRevenue = 0;
  let tripRevenue = 0;
  let runningVehicles = 0;
  let idleVehicles = 0;
  let maintenanceVehicles = 0;
  let departmentVehicles = 0;
  let tripVehicles = 0;

  vehicleFinAgg.forEach(v => {
    totalRevenue += v.revenue;
    deptRevenue += v.deptRevenue;
    tripRevenue += v.tripRevenue;
    if (v.status === 'Running' || v.status === 'Active') runningVehicles++;
    else if (v.status === 'Idle') idleVehicles++;
    else if (v.status === 'Maintenance') maintenanceVehicles++;

    if (v.type === 'Department') departmentVehicles++;
    else tripVehicles++;
  });

  // Drivers status
  const dStat = driverAgg[0] || { totalDrivers: 0, onDutyDrivers: 0, offDutyDrivers: 0 };

  // Detailed Expense Aggregations
  const tripTotals = tripTotalsAgg[0] || { totalTrips: 0, ongoingTrips: 0, completedTrips: 0, totalRevenue: 0, totalFuel: 0, totalFastag: 0, totalBata: 0, totalOther: 0, totalExpenses: 0 };
  const fuelTotals = fuelTotalsAgg[0] || { totalLogs: 0, totalLitres: 0, totalFuelCost: 0 };
  const fastagTotals = fastagTotalsAgg[0] || { totalToll: 0 };
  const driverExpTotals = driverExpTotalsAgg[0] || { totalAmount: 0 };
  const genExpTotals = genExpTotalsAgg[0] || { totalFuel: 0, totalDriver: 0, totalMaintenance: 0, totalOther: 0 };
  const compStat = complianceAgg[0] || { totalDocs: 0, expiringSoon: 0, expired: 0 };

  const fuelExpense = Math.round((fuelTotals.totalFuelCost || 0) + (tripTotals.totalFuel || 0) + (genExpTotals.totalFuel || 0));
  const tollExpense = Math.round((fastagTotals.totalToll || 0) + (tripTotals.totalFastag || 0));
  const driverExpense = Math.round((driverExpTotals.totalAmount || 0) + (tripTotals.totalBata || 0) + (genExpTotals.totalDriver || 0));
  const maintenanceExpense = Math.round(genExpTotals.totalMaintenance || 0);
  const otherExpense = Math.round((tripTotals.totalOther || 0) + (genExpTotals.totalOther || 0));
  const totalExpense = fuelExpense + tollExpense + driverExpense + maintenanceExpense + otherExpense;

  const netProfit = totalRevenue - totalExpense;
  const profitMargin = totalRevenue > 0 ? Number(((netProfit / totalRevenue) * 100).toFixed(1)) : 0;

  // 4. Build Real Monthly Trends (ONLY real DB data, ZERO fake weights)
  const monthMap = new Map();
  const addMonthData = (key, rev = 0, exp = 0) => {
    if (!key || typeof key !== 'string') return;
    const clean = key.slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(clean)) return;
    const curr = monthMap.get(clean) || { revenue: 0, expense: 0 };
    monthMap.set(clean, { revenue: curr.revenue + rev, expense: curr.expense + exp });
  };

  (billMonthlyAgg || []).forEach(m => addMonthData(m._id, m.revenue, 0));
  (tripMonthlyAgg || []).forEach(m => addMonthData(m._id, m.revenue, m.expense));
  (dutyMonthlyAgg || []).forEach(m => addMonthData(m._id, m.revenue, 0));
  (fuelMonthlyAgg || []).forEach(m => addMonthData(m._id, 0, m.expense));
  (fastagMonthlyAgg || []).forEach(m => addMonthData(m._id, 0, m.expense));
  (driverExpMonthlyAgg || []).forEach(m => addMonthData(m._id, 0, m.expense));

  // Determine the 6 consecutive months ending at latest activity or current month
  const sortedMonthKeys = Array.from(monthMap.keys()).sort();
  let endYear = 2026;
  let endMonth = 9; // September 2026 default based on active fleet records

  if (sortedMonthKeys.length > 0) {
    const latestKey = sortedMonthKeys[sortedMonthKeys.length - 1];
    const [y, m] = latestKey.split('-').map(Number);
    if (y && m) {
      endYear = y;
      endMonth = m;
    }
  }

  const last6Months = [];
  for (let i = 5; i >= 0; i--) {
    let mNum = endMonth - i;
    let yNum = endYear;
    while (mNum <= 0) {
      mNum += 12;
      yNum -= 1;
    }
    const key = `${yNum}-${String(mNum).padStart(2, '0')}`;
    const mLabel = MONTH_NAMES[mNum - 1];
    const aggregated = monthMap.get(key) || { revenue: 0, expense: 0 };

    last6Months.push({
      month: mLabel,
      monthKey: key,
      revenue: Math.round(aggregated.revenue),
      expense: Math.round(aggregated.expense)
    });
  }

  // 5. Build Real Expense Mix Data (Accurate breakdown without synthetic "Other")
  const expenseSlices = [
    { label: 'Fuel', value: fuelExpense, color: '#1687F5' },
    { label: 'Driver', value: driverExpense, color: '#F15B4A' },
    { label: 'Maintenance', value: maintenanceExpense, color: '#FFA000' },
    { label: 'FASTag', value: tollExpense, color: '#26B8D8' },
    { label: 'Other', value: otherExpense, color: '#A5A5A5' }
  ].filter(s => s.value > 0);

  // 6. Vehicle Profitability Ranking from real aggregation
  const profitabilityRanking = vehicleFinAgg.map(v => ({
    id: v._id.toString(),
    registrationNumber: v.registrationNumber,
    model: v.model || 'Commercial Fleet Cab',
    type: v.type,
    assignedDriver: v.assignedDriver || '—',
    assignedTo: v.assignedTo,
    status: v.status,
    revenue: v.revenue,
    expense: v.expense,
    profit: v.profit,
    margin: v.margin
  }));

  // 7. Assemble Final Real Dashboard Response
  res.status(200).json({
    success: true,
    data: {
      summary: {
        totalRevenue,
        deptRevenue,
        tripRevenue,
        totalExpense,
        fuelExpense,
        tollExpense,
        driverExpense,
        maintenanceExpense,
        otherExpense,
        netProfit,
        profitMargin,
        totalVehicles: vehicleFinAgg.length,
        runningVehicles,
        idleVehicles,
        maintenanceVehicles,
        departmentVehicles,
        tripVehicles,
        totalDrivers: dStat.totalDrivers,
        onDutyDrivers: dStat.onDutyDrivers,
        offDutyDrivers: dStat.offDutyDrivers
      },
      monthly: last6Months,
      expenseMix: expenseSlices,
      expenseTotal: totalExpense,
      operationsSnapshot: {
        departmentCabs: departmentVehicles,
        tripCabs: tripVehicles,
        fuelFillsLogged: fuelTotals.totalLogs,
        totalFuelLitres: Number(fuelTotals.totalLitres.toFixed(1)),
        liveTrips: tripTotals.ongoingTrips || runningVehicles,
        totalDrivers: dStat.totalDrivers
      },
      compliance: {
        totalDocs: compStat.totalDocs,
        expiringSoon: compStat.expiringSoon,
        expired: compStat.expired
      },
      vehicles: vehicleFinAgg.map(v => ({
        id: v._id.toString(),
        registrationNumber: v.registrationNumber,
        model: v.model,
        type: v.type,
        status: v.status,
        assignedDriver: v.assignedDriver,
        assignedTo: v.assignedTo,
        meta: v.meta,
        revenue: v.revenue,
        expense: v.expense,
        profit: v.profit
      })),
      profitabilityRanking
    }
  });
});
