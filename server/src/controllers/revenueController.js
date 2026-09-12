import mongoose from 'mongoose';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { Revenue } from '../models/Revenue.js';
import { Booking } from '../models/Booking.js';
import { MonthlyBill } from '../models/MonthlyBill.js';
import { Vehicle } from '../models/Vehicle.js';
import { broadcastAll } from '../services/socketService.js';

// Helper: Format local YYYY-MM-DD
function getLocalDateStr(d) {
  const dt = d || new Date();
  const year = dt.getFullYear();
  const month = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper: Calculate standard date ranges
function getDateRange(dateFilter, customStart, customEnd) {
  const now = new Date();
  const todayStr = getLocalDateStr(now);

  if (dateFilter === 'today') {
    return { start: todayStr, end: todayStr };
  }
  if (dateFilter === 'this_week') {
    const day = now.getDay(); // 0 is Sunday, 1 is Monday...
    const diffToMonday = now.getDate() - (day === 0 ? 6 : day - 1);
    const monday = new Date(now.getFullYear(), now.getMonth(), diffToMonday);
    // Cover the full operational cycle (up to next Monday, diffToMonday + 7):
    const sunday = new Date(now.getFullYear(), now.getMonth(), diffToMonday + 7);
    return { start: getLocalDateStr(monday), end: getLocalDateStr(sunday) };
  }
  if (dateFilter === 'this_month') {
    // Entire current calendar month: from 1st of month to the last day of current month!
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start: getLocalDateStr(firstDay), end: getLocalDateStr(lastDay) };
  }
  if (dateFilter === 'last_month') {
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
    return { start: getLocalDateStr(firstDay), end: getLocalDateStr(lastDay) };
  }
  if (dateFilter === 'custom' && customStart && customEnd) {
    return { start: customStart, end: customEnd };
  }
  return null;
}

/**
 * GET /api/revenue
 * Aggregates live source data from Bookings (Trips), Department Bills, and Manual Revenue entries
 */
export const getRevenueOverview = asyncHandler(async (req, res) => {
  const {
    dateFilter = 'all',
    startDate,
    endDate,
    vehicle,
    department,
    type = 'All',
    paymentStatus = 'All',
    search = ''
  } = req.query;

  const todayStr = getLocalDateStr(new Date());
  let dateRange = null;
  if (dateFilter && dateFilter !== 'all') {
    dateRange = getDateRange(dateFilter, startDate, endDate);
  }

  // 1. Fetch Manual Revenue entries
  const manualFilter = { sourceType: 'Manual' };
  if (vehicle && vehicle !== 'All') manualFilter.vehicle = vehicle;
  if (department && department !== 'All') manualFilter.customer = department;
  if (dateRange) {
    manualFilter.date = { $gte: dateRange.start, $lte: dateRange.end };
  }
  const manualRecords = await Revenue.find(manualFilter).lean();

  // 2. Fetch Bookings (Trips)
  const bookingFilter = {};
  if (vehicle && vehicle !== 'All') bookingFilter.vehicle = vehicle;
  if (department && department !== 'All') {
    bookingFilter.$or = [{ customerName: department }, { departmentName: department }];
  }
  if (dateRange) {
    bookingFilter.startDate = { $gte: dateRange.start, $lte: dateRange.end };
  }
  const bookings = await Booking.find(bookingFilter).lean();

  // 3. Fetch Department Monthly Bills
  const billFilter = {};
  if (vehicle && vehicle !== 'All') billFilter.vehicle = vehicle;
  if (department && department !== 'All') billFilter.departmentName = department;
  const bills = await MonthlyBill.find(billFilter).lean();

  // 4. Transform Bookings into Unified Revenue Items
  const tripItems = bookings.map(b => {
    const rev = Number(b.revenue || b.totalAmount || 0);
    const fuel = Number(b.fuelCost || 0);
    const driver = Number(b.driverBata || 0);
    const fastag = Number(b.fastagCost || 0);
    const directCost = fuel + driver + fastag;
    const profit = rev - directCost;
    const margin = rev > 0 ? Number(((profit / rev) * 100).toFixed(1)) : 0;

    const advance = Number(b.advanceAmount || 0);
    const balance = Number(b.balancePaid || 0);
    const received = advance + balance;
    const pending = Math.max(0, rev - received);

    let status = 'Pending';
    if (received >= rev && rev > 0) {
      status = 'Received';
    } else if (received > 0) {
      status = 'Partial';
    } else if (b.startDate < todayStr && pending > 0) {
      status = 'Overdue';
    }

    const dueDate = b.endDate || b.startDate;

    return {
      id: `trip_${b._id}`,
      revenueId: `REV-${b.bookingNumber || b._id.toString().slice(-6).toUpperCase()}`,
      type: 'Trip',
      sourceType: 'Booking',
      sourceId: b._id.toString(),
      bookingNumber: b.bookingNumber,
      route: b.route,
      vehicle: b.vehicle,
      driver: b.driverName,
      customer: b.customerName,
      date: b.startDate,
      dueDate,
      amount: rev,
      receivedAmount: received,
      pendingAmount: pending,
      paymentStatus: status,
      paymentMethod: b.balancePaymentMode !== 'Pending' ? b.balancePaymentMode : b.advancePaymentMode || 'UPI',
      referenceNo: b.bookingNumber || `TRIP-${b._id.toString().slice(-4)}`,
      fuelCost: fuel,
      driverCost: driver,
      fastagCost: fastag,
      totalDirectCost: directCost,
      profit,
      margin,
      tripStatus: b.status || 'Scheduled',
      notes: b.notes || ''
    };
  });

  // 5. Transform Department Bills into Unified Revenue Items
  const deptItems = bills
    .filter(b => {
      if (!dateRange) return true;
      const bDate = b.dutyStartDate || `${b.billingMonth}-01`;
      return bDate >= dateRange.start && bDate <= dateRange.end;
    })
    .map(b => {
      const rev = Number(b.totalBill || 0);
      const fuel = Number(b.fuelCost || 0);
      const driver = Number(b.extraDriverAllowance || 0);
      const fastag = Number(b.tollParkingCost || 0);
      const directCost = fuel + driver + fastag;
      const profit = rev - directCost;
      const margin = rev > 0 ? Number(((profit / rev) * 100).toFixed(1)) : 0;

      const received = Number(b.paidAmount || 0);
      const pending = Number(b.balanceDue || Math.max(0, rev - received));

      let status = 'Pending';
      const bDate = b.dutyEndDate || `${b.billingMonth}-28`;
      if (b.status === 'Paid' || received >= rev) {
        status = 'Received';
      } else if (b.status === 'Partial' || received > 0) {
        status = 'Partial';
      } else if (b.status === 'Overdue' || bDate < todayStr) {
        status = 'Overdue';
      }

      return {
        id: `dept_${b._id}`,
        revenueId: `REV-${b.billNumber || b._id.toString().slice(-6).toUpperCase()}`,
        type: 'Department',
        sourceType: 'DepartmentBill',
        sourceId: b._id.toString(),
        billNumber: b.billNumber,
        departmentName: b.departmentName,
        billingMonth: b.billingMonth,
        vehicle: b.vehicle,
        driver: 'Contract Fleet',
        customer: b.departmentName,
        date: b.dutyStartDate || `${b.billingMonth}-01`,
        dueDate: bDate,
        amount: rev,
        receivedAmount: received,
        pendingAmount: pending,
        paymentStatus: status,
        paymentMethod: 'Bank Transfer',
        referenceNo: b.billNumber || `BILL-${b._id.toString().slice(-4)}`,
        fuelCost: fuel,
        driverCost: driver,
        fastagCost: fastag,
        totalDirectCost: directCost,
        profit,
        margin,
        billType: b.billType,
        notes: ''
      };
    });

  // 6. Transform Manual entries
  const manualItems = manualRecords.map(m => {
    const rev = Number(m.amount || 0);
    const fuel = Number(m.directCosts?.fuelCost || 0);
    const driver = Number(m.directCosts?.driverCost || 0);
    const fastag = Number(m.directCosts?.fastagCost || 0);
    const directCost = Number(m.directCosts?.totalDirectCost || fuel + driver + fastag);
    const profit = Number(m.profit !== undefined ? m.profit : rev - directCost);
    const margin = rev > 0 ? Number(((profit / rev) * 100).toFixed(1)) : 0;

    return {
      id: m._id.toString(),
      revenueId: m.revenueId || `REV-${m._id.toString().slice(-6).toUpperCase()}`,
      type: m.type || 'Other',
      sourceType: 'Manual',
      sourceId: m._id.toString(),
      vehicle: m.vehicle || '—',
      driver: m.driver || '—',
      customer: m.customer || '—',
      date: m.date,
      dueDate: m.dueDate || m.date,
      amount: rev,
      receivedAmount: Number(m.receivedAmount || 0),
      pendingAmount: Number(m.pendingAmount || Math.max(0, rev - (m.receivedAmount || 0))),
      paymentStatus: m.paymentStatus || 'Pending',
      paymentMethod: m.paymentMethod || 'Other',
      referenceNo: m.referenceNo || '—',
      fuelCost: fuel,
      driverCost: driver,
      fastagCost: fastag,
      totalDirectCost: directCost,
      profit,
      margin,
      notes: m.notes || ''
    };
  });

  // 7. Combine all revenue items
  let allItems = [...tripItems, ...deptItems, ...manualItems];

  // Apply Type Filter
  if (type && type !== 'All') {
    allItems = allItems.filter(item => item.type.toLowerCase() === type.toLowerCase());
  }

  // Apply Payment Status Filter
  if (paymentStatus && paymentStatus !== 'All') {
    allItems = allItems.filter(item => item.paymentStatus.toLowerCase() === paymentStatus.toLowerCase());
  }

  // Apply Search Query Filter
  if (search) {
    const s = search.toLowerCase();
    allItems = allItems.filter(
      item =>
        item.customer.toLowerCase().includes(s) ||
        item.vehicle.toLowerCase().includes(s) ||
        item.driver.toLowerCase().includes(s) ||
        item.referenceNo.toLowerCase().includes(s) ||
        (item.route && item.route.toLowerCase().includes(s))
    );
  }

  // Sort descending by date
  allItems.sort((a, b) => b.date.localeCompare(a.date));

  // 8. Compute Summary Totals
  let totalRevenue = 0;
  let tripRevenue = 0;
  let deptRevenue = 0;
  let otherRevenue = 0;

  let totalFuel = 0;
  let totalDriver = 0;
  let totalFastag = 0;
  let totalDirectCost = 0;

  let tripProfit = 0;
  let deptProfit = 0;
  let totalProfit = 0;

  let totalReceived = 0;
  let totalPending = 0;
  let totalOverdue = 0;

  allItems.forEach(item => {
    totalRevenue += item.amount;
    totalReceived += item.receivedAmount;
    totalPending += item.pendingAmount;
    if (item.paymentStatus === 'Overdue') {
      totalOverdue += item.pendingAmount;
    }

    totalFuel += item.fuelCost;
    totalDriver += item.driverCost;
    totalFastag += item.fastagCost;
    totalDirectCost += item.totalDirectCost;
    totalProfit += item.profit;

    if (item.type === 'Trip') {
      tripRevenue += item.amount;
      tripProfit += item.profit;
    } else if (item.type === 'Department') {
      deptRevenue += item.amount;
      deptProfit += item.profit;
    } else {
      otherRevenue += item.amount;
    }
  });

  const overallMargin = totalRevenue > 0 ? Number(((totalProfit / totalRevenue) * 100).toFixed(1)) : 0;
  const tripMargin = tripRevenue > 0 ? Number(((tripProfit / tripRevenue) * 100).toFixed(1)) : 0;
  const deptMargin = deptRevenue > 0 ? Number(((deptProfit / deptRevenue) * 100).toFixed(1)) : 0;

  // 9. Time-Series Trends Calculation
  const trendMap = new Map();
  allItems.forEach(item => {
    const day = item.date;
    if (!trendMap.has(day)) {
      trendMap.set(day, { date: day, totalRevenue: 0, tripRevenue: 0, deptRevenue: 0, receivedAmount: 0 });
    }
    const t = trendMap.get(day);
    t.totalRevenue += item.amount;
    t.receivedAmount += item.receivedAmount;
    if (item.type === 'Trip') t.tripRevenue += item.amount;
    else if (item.type === 'Department') t.deptRevenue += item.amount;
  });
  const trends = Array.from(trendMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  // 10. Vehicle-wise Economics Calculation
  const vehicleMap = new Map();
  allItems.forEach(item => {
    const vKey = item.vehicle && item.vehicle !== '—' ? item.vehicle : 'Unassigned';
    if (!vehicleMap.has(vKey)) {
      vehicleMap.set(vKey, {
        vehicle: vKey,
        revenue: 0,
        fuelCost: 0,
        driverCost: 0,
        fastagCost: 0,
        directCost: 0,
        profit: 0,
        tripCount: 0,
        deptCount: 0,
        totalOperations: 0
      });
    }
    const vStat = vehicleMap.get(vKey);
    vStat.revenue += item.amount;
    vStat.fuelCost += item.fuelCost;
    vStat.driverCost += item.driverCost;
    vStat.fastagCost += item.fastagCost;
    vStat.directCost += item.totalDirectCost;
    vStat.profit += item.profit;
    vStat.totalOperations++;
    if (item.type === 'Trip') vStat.tripCount++;
    if (item.type === 'Department') vStat.deptCount++;
  });

  const vehicleEconomics = Array.from(vehicleMap.values())
    .map(v => ({
      ...v,
      margin: v.revenue > 0 ? Number(((v.profit / v.revenue) * 100).toFixed(1)) : 0
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // 11. Outstanding / Collection Records
  const outstandingList = allItems
    .filter(item => item.pendingAmount > 0)
    .sort((a, b) => (a.dueDate || a.date).localeCompare(b.dueDate || b.date));

  res.status(200).json({
    success: true,
    summary: {
      totalRevenue,
      tripRevenue,
      deptRevenue,
      otherRevenue,
      totalDirectCost,
      fuelCost: totalFuel,
      driverCost: totalDriver,
      fastagCost: totalFastag,
      totalContribution: totalProfit,
      tripProfit,
      deptProfit,
      margin: overallMargin,
      tripMargin,
      deptMargin,
      collection: {
        totalReceived,
        totalPending,
        totalOverdue
      },
      counts: {
        total: allItems.length,
        trips: tripItems.length,
        departments: deptItems.length,
        manual: manualItems.length,
        outstanding: outstandingList.length
      }
    },
    trends,
    vehicleEconomics,
    trips: allItems.filter(i => i.type === 'Trip'),
    departments: allItems.filter(i => i.type === 'Department'),
    outstanding: outstandingList,
    records: allItems
  });
});

/**
 * POST /api/revenue
 * Create a manual revenue record (for Other Revenue or exceptional entries)
 */
export const createManualRevenue = asyncHandler(async (req, res) => {
  const {
    type = 'Other',
    customer,
    vehicle,
    driver,
    date,
    dueDate,
    amount,
    receivedAmount = 0,
    paymentStatus = 'Pending',
    paymentMethod = 'Other',
    referenceNo,
    fuelCost = 0,
    driverCost = 0,
    fastagCost = 0,
    notes = ''
  } = req.body;

  const numAmount = Number(amount) || 0;
  const numReceived = Number(receivedAmount) || 0;
  const numFuel = Number(fuelCost) || 0;
  const numDriver = Number(driverCost) || 0;
  const numFastag = Number(fastagCost) || 0;
  const directCost = numFuel + numDriver + numFastag;
  const profit = numAmount - directCost;
  const margin = numAmount > 0 ? Number(((profit / numAmount) * 100).toFixed(1)) : 0;
  const pending = Math.max(0, numAmount - numReceived);

  const revenueCount = await Revenue.countDocuments();
  const revenueId = `REV-${1000 + revenueCount + 1}`;

  const revenue = await Revenue.create({
    revenueId,
    type,
    sourceType: 'Manual',
    customer,
    vehicle,
    driver,
    date: date || new Date().toISOString().split('T')[0],
    dueDate: dueDate || date || new Date().toISOString().split('T')[0],
    amount: numAmount,
    receivedAmount: numReceived,
    pendingAmount: pending,
    paymentStatus: numReceived >= numAmount && numAmount > 0 ? 'Received' : paymentStatus,
    paymentMethod,
    referenceNo: referenceNo || `REF-${Date.now().toString().slice(-5)}`,
    directCosts: {
      fuelCost: numFuel,
      driverCost: numDriver,
      fastagCost: numFastag,
      totalDirectCost: directCost
    },
    profit,
    margin,
    notes
  });

  const serialized = {
    ...revenue.toObject(),
    id: revenue._id.toString()
  };

  try {
    broadcastAll('revenue:created', { action: 'created', data: serialized });
  } catch (sErr) {}

  res.status(201).json({
    success: true,
    data: serialized
  });
});

/**
 * PUT /api/revenue/:id
 * Update manual revenue or record a payment on an existing revenue item
 */
export const updateRevenue = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateFields = { ...req.body };
  delete updateFields._id;
  delete updateFields.id;

  // If receivedAmount or amount changed, recompute pendingAmount and profit
  if (updateFields.amount !== undefined || updateFields.receivedAmount !== undefined) {
    const existing = await Revenue.findById(id);
    if (existing) {
      const amt = updateFields.amount !== undefined ? Number(updateFields.amount) : existing.amount;
      const rec = updateFields.receivedAmount !== undefined ? Number(updateFields.receivedAmount) : existing.receivedAmount;
      updateFields.pendingAmount = Math.max(0, amt - rec);
      if (rec >= amt && amt > 0) {
        updateFields.paymentStatus = 'Received';
      }
    }
  }

  const revenue = await Revenue.findByIdAndUpdate(id, updateFields, {
    new: true,
    runValidators: true
  });

  if (!revenue) {
    return res.status(404).json({
      success: false,
      error: `Revenue record ${id} not found`
    });
  }

  const serialized = {
    ...revenue.toObject(),
    id: revenue._id.toString()
  };

  try {
    broadcastAll('revenue:updated', { action: 'updated', data: serialized });
  } catch (sErr) {}

  res.status(200).json({
    success: true,
    data: serialized
  });
});

/**
 * DELETE /api/revenue/:id
 * Delete a manual revenue record
 */
export const deleteRevenue = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const revenue = await Revenue.findByIdAndDelete(id);

  if (!revenue) {
    return res.status(404).json({
      success: false,
      error: `Revenue record ${id} not found`
    });
  }

  try {
    broadcastAll('revenue:deleted', { action: 'deleted', id: revenue._id.toString() });
  } catch (sErr) {}

  res.status(200).json({
    success: true,
    message: 'Revenue record removed',
    data: {}
  });
});
