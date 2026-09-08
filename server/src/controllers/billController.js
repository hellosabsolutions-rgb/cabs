import { MonthlyBill } from '../models/MonthlyBill.js';
import { DailyDutyLog } from '../models/DailyDutyLog.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

// Initial seed bills for auto-population if DB is empty
const defaultSeedBills = [
  {
    billNumber: 'INV-2026-08-PWD',
    departmentName: 'Public Works Department (PWD)',
    vehicle: 'DL01AB1234',
    billingMonth: '2026-08',
    baseContractAmount: 53755,
    dutyStartDate: '2026-08-01',
    dutyEndDate: '2026-08-31',
    totalKmRun: 2300,
    extraKmCost: 1500,
    extraHoursCost: 0,
    extraDriverAllowance: 0,
    fuelAvgKmpl: 10,
    fuelLitresUsed: 230,
    fuelRatePerLitre: 88.33,
    fuelCost: 20316,
    nightCount: 5,
    nightRate: 300,
    nightCost: 1500,
    tollParkingCost: 320,
    subtotal: 75891,
    gstRate: 5,
    gstType: 'CGST_SGST',
    gstTaxableOn: 'TOTAL',
    gstAmount: 3795,
    cgstAmount: 1898,
    sgstAmount: 1897,
    igstAmount: 0,
    partyGstin: '07AAAGB1234F1Z5',
    totalBill: 79686,
    paidAmount: 0,
    balanceDue: 79686,
    status: 'Sent',
    dueDate: '2026-09-15',
    invoicePdf: 'invoice_pwd_aug2026.pdf'
  },
  {
    billNumber: 'INV-2026-07-PWD',
    departmentName: 'Public Works Department (PWD)',
    vehicle: 'DL01AB1234',
    billingMonth: '2026-07',
    baseContractAmount: 53755,
    dutyStartDate: '2026-07-01',
    dutyEndDate: '2026-07-31',
    totalKmRun: 2100,
    extraKmCost: 1200,
    extraHoursCost: 0,
    extraDriverAllowance: 0,
    fuelAvgKmpl: 10,
    fuelLitresUsed: 210,
    fuelRatePerLitre: 88.33,
    fuelCost: 18549,
    nightCount: 3,
    nightRate: 300,
    nightCost: 900,
    tollParkingCost: 250,
    subtotal: 74654,
    gstRate: 5,
    gstType: 'CGST_SGST',
    gstTaxableOn: 'TOTAL',
    gstAmount: 3733,
    cgstAmount: 1867,
    sgstAmount: 1866,
    igstAmount: 0,
    partyGstin: '07AAAGB1234F1Z5',
    totalBill: 78387,
    paidAmount: 78387,
    balanceDue: 0,
    status: 'Paid',
    dueDate: '2026-08-15',
    invoicePdf: 'invoice_pwd_jul2026.pdf'
  },
  {
    billNumber: 'INV-2026-08-DJN',
    departmentName: 'Delhi Jal Nigam (DJN)',
    vehicle: 'DL05KL4432',
    billingMonth: '2026-08',
    baseContractAmount: 78000,
    dutyStartDate: '2026-08-01',
    dutyEndDate: '2026-08-31',
    totalKmRun: 2800,
    extraKmCost: 3200,
    extraHoursCost: 1500,
    extraDriverAllowance: 500,
    fuelAvgKmpl: 12,
    fuelLitresUsed: 233.3,
    fuelRatePerLitre: 88.33,
    fuelCost: 20607,
    nightCount: 2,
    nightRate: 300,
    nightCost: 600,
    tollParkingCost: 450,
    subtotal: 104257,
    gstRate: 5,
    gstType: 'CGST_SGST',
    gstTaxableOn: 'TOTAL',
    gstAmount: 5213,
    cgstAmount: 2607,
    sgstAmount: 2606,
    igstAmount: 0,
    partyGstin: '07DJND0099Z1ZX',
    totalBill: 109470,
    paidAmount: 109470,
    balanceDue: 0,
    status: 'Paid',
    dueDate: '2026-09-10',
    invoicePdf: 'invoice_djn_aug2026.pdf'
  },
  {
    billNumber: 'INV-2026-08-DHS',
    departmentName: 'Directorate of Health Services',
    vehicle: 'DL03XY9012',
    billingMonth: '2026-08',
    baseContractAmount: 62000,
    dutyStartDate: '2026-08-01',
    dutyEndDate: '2026-08-31',
    totalKmRun: 2500,
    extraKmCost: 2400,
    extraHoursCost: 1650,
    extraDriverAllowance: 0,
    fuelAvgKmpl: 11,
    fuelLitresUsed: 227.3,
    fuelRatePerLitre: 88.33,
    fuelCost: 20077,
    nightCount: 4,
    nightRate: 300,
    nightCost: 1200,
    tollParkingCost: 500,
    subtotal: 87827,
    gstRate: 5,
    gstType: 'CGST_SGST',
    gstTaxableOn: 'TOTAL',
    gstAmount: 4391,
    cgstAmount: 2196,
    sgstAmount: 2195,
    igstAmount: 0,
    partyGstin: '07DHSB5511A1ZZ',
    totalBill: 92218,
    paidAmount: 0,
    balanceDue: 92218,
    status: 'Pending',
    dueDate: '2026-09-20',
    invoicePdf: 'invoice_dhs_aug2026.pdf',
    billType: 'Monthly Tender Rent'
  },
  {
    billNumber: '3454',
    billType: 'Weekend / Off-Duty Cash Memo',
    departmentName: 'Director Horticulture Mission',
    vehicle: 'UK07TE9755',
    billingMonth: '2026-07',
    dutyStartDate: '2026-07-31',
    dutyEndDate: '2026-07-31',
    baseContractAmount: 2255,
    packageFreeKm: 80,
    extraKmRate: 14,
    totalKmRun: 169,
    extraKmCost: 1246,
    extraHoursCost: 0,
    fuelCost: 0,
    tollParkingCost: 0,
    subtotal: 3501,
    gstRate: 5,
    gstType: 'CGST_SGST',
    gstTaxableOn: 'TOTAL',
    gstAmount: 112,
    cgstAmount: 56,
    sgstAmount: 56,
    igstAmount: 0,
    partyGstin: '05AAAGB1234F1Z5',
    totalBill: 3613,
    paidAmount: 3613,
    balanceDue: 0,
    status: 'Paid',
    dueDate: '2026-08-10',
    journeyFrom: 'D.Dun Ranipokhari',
    journeyTo: 'Vikasnagar & Local to D.Dun',
    invoicePdf: 'cashmemo_3454_horticulture.pdf'
  }
];

/**
 * Helper to compute tax and totals for a bill
 */
export const calculateBillFinancials = (data) => {
  const baseContractAmount = Number(data.baseContractAmount) || 0;
  const extraKmCost = Number(data.extraKmCost) || 0;
  const extraHoursCost = Number(data.extraHoursCost) || 0;
  const extraDriverAllowance = Number(data.extraDriverAllowance) || 0;
  const fuelCost = Number(data.fuelCost) || 0;
  const nightCost = Number(data.nightCost) || 0;
  const tollParkingCost = Number(data.tollParkingCost) || 0;

  const subtotal =
    baseContractAmount +
    extraKmCost +
    extraHoursCost +
    extraDriverAllowance +
    fuelCost +
    nightCost +
    tollParkingCost;

  const gstRate = Number(data.gstRate) || 0;
  const gstType = data.gstType || 'CGST_SGST';
  const gstTaxableOn = data.gstTaxableOn || 'TOTAL';

  const taxableBase = gstTaxableOn === 'RENT_ONLY' ? baseContractAmount : subtotal;
  const gstAmount = Math.round((taxableBase * gstRate) / 100);

  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  if (gstRate > 0) {
    if (gstType === 'IGST') {
      igstAmount = gstAmount;
    } else {
      cgstAmount = Math.round(gstAmount / 2);
      sgstAmount = gstAmount - cgstAmount;
    }
  }

  const totalBill = subtotal + gstAmount;
  const paidAmount = Number(data.paidAmount) || 0;
  const balanceDue = Math.max(0, totalBill - paidAmount);

  return {
    subtotal,
    gstRate,
    gstType,
    gstTaxableOn,
    gstAmount,
    cgstAmount,
    sgstAmount,
    igstAmount,
    totalBill,
    paidAmount,
    balanceDue
  };
};

// @desc    Get all monthly bills (with auto-seed if empty)
// @route   GET /api/bills
export const getBills = asyncHandler(async (req, res) => {
  let queryObj = {};

  if (req.query.departmentName && req.query.departmentName !== 'All') {
    queryObj.departmentName = req.query.departmentName;
  }
  if (req.query.billingMonth && req.query.billingMonth !== 'All') {
    queryObj.billingMonth = req.query.billingMonth;
  }
  if (req.query.status && req.query.status !== 'All') {
    queryObj.status = req.query.status;
  }
  if (req.query.billType && req.query.billType !== 'All') {
    queryObj.billType = req.query.billType;
  }
  if (req.query.search) {
    const regex = new RegExp(req.query.search, 'i');
    queryObj.$or = [
      { billNumber: regex },
      { departmentName: regex },
      { vehicle: regex }
    ];
  }

  let count = await MonthlyBill.countDocuments(queryObj);

  // Auto-seed dummy bills in development only when DB is empty
  if (
    process.env.NODE_ENV !== 'production' &&
    count === 0 &&
    Object.keys(queryObj).length === 0
  ) {
    const totalInDb = await MonthlyBill.countDocuments({});
    if (totalInDb === 0) {
      await MonthlyBill.insertMany(defaultSeedBills);
      count = await MonthlyBill.countDocuments(queryObj);
    }
  }

  const bills = await MonthlyBill.find(queryObj)
    .sort({ createdAt: -1, billingMonth: -1 })
    .lean();

  const data = bills.map(b => ({
    ...b,
    id: b._id.toString()
  }));

  res.status(200).json({
    success: true,
    count: data.length,
    data
  });
});

// @desc    Get monthly billing summary stats
// @route   GET /api/bills/stats
export const getBillStats = asyncHandler(async (req, res) => {
  const bills = await MonthlyBill.find({}).lean();

  let totalBilled = 0;
  let totalPaid = 0;
  let totalPending = 0;
  let totalGstEarned = 0;
  const deptSet = new Set();

  bills.forEach(b => {
    totalBilled += b.totalBill || 0;
    totalPaid += b.paidAmount || 0;
    totalPending += b.balanceDue || 0;
    totalGstEarned += b.gstAmount || 0;
    if (b.departmentName) deptSet.add(b.departmentName);
  });

  res.status(200).json({
    success: true,
    stats: {
      totalBilled,
      totalPaid,
      totalPending,
      totalGstEarned,
      totalBills: bills.length,
      clientDepartments: deptSet.size
    }
  });
});

// @desc    Get single bill by ID
// @route   GET /api/bills/:id
export const getBillById = asyncHandler(async (req, res) => {
  const bill = await MonthlyBill.findById(req.params.id);
  if (!bill) {
    return res.status(404).json({ success: false, error: 'Bill not found' });
  }
  res.status(200).json({ success: true, data: bill });
});

// @desc    Create new monthly bill
// @route   POST /api/bills
export const createBill = asyncHandler(async (req, res) => {
  const financials = calculateBillFinancials(req.body);

  const billData = {
    ...req.body,
    ...financials
  };

  const newBill = await MonthlyBill.create(billData);

  // If this bill is generated from a Weekend Duty Log, link and update it
  if (req.body.dailyDutyLogId) {
    try {
      await DailyDutyLog.findByIdAndUpdate(req.body.dailyDutyLogId, {
        billingStatus: 'Billed',
        weekendBillNumber: newBill.billNumber,
        weekendBillId: newBill._id.toString()
      });
    } catch (linkErr) {
      console.warn('Could not link dailyDutyLog to bill:', linkErr);
    }
  }

  res.status(201).json({
    success: true,
    data: newBill
  });
});

// @desc    Update monthly bill
// @route   PUT /api/bills/:id
export const updateBill = asyncHandler(async (req, res) => {
  let bill = await MonthlyBill.findById(req.params.id);
  if (!bill) {
    return res.status(404).json({ success: false, error: 'Bill not found' });
  }

  const merged = { ...bill.toObject(), ...req.body };
  const financials = calculateBillFinancials(merged);

  Object.assign(bill, req.body, financials);
  await bill.save();

  res.status(200).json({
    success: true,
    data: bill
  });
});

// @desc    Update bill status (Quick action)
// @route   PATCH or PUT /api/bills/:id/status
export const updateBillStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const bill = await MonthlyBill.findById(req.params.id);

  if (!bill) {
    return res.status(404).json({ success: false, error: 'Bill not found' });
  }

  bill.status = status;
  if (status === 'Paid') {
    bill.paidAmount = bill.totalBill;
    bill.balanceDue = 0;
  } else if (status === 'Sent' || status === 'Pending') {
    if (bill.paidAmount >= bill.totalBill) {
      bill.paidAmount = 0;
      bill.balanceDue = bill.totalBill;
    }
  }

  await bill.save();

  res.status(200).json({
    success: true,
    data: bill
  });
});

// @desc    Apply GST rate across multiple/all bills
// @route   POST /api/bills/apply-gst
export const applyGstBulk = asyncHandler(async (req, res) => {
  const { gstRate, gstType = 'CGST_SGST', gstTaxableOn = 'TOTAL', departmentName } = req.body;

  const rate = Number(gstRate);
  if (isNaN(rate) || rate < 0) {
    return res.status(400).json({ success: false, error: 'Valid GST rate is required' });
  }

  const filter = {};
  if (departmentName && departmentName !== 'All') {
    filter.departmentName = departmentName;
  }

  const bills = await MonthlyBill.find(filter);
  const updatedBills = [];

  for (const bill of bills) {
    const subtotal =
      (bill.baseContractAmount || 0) +
      (bill.extraKmCost || 0) +
      (bill.extraHoursCost || 0) +
      (bill.extraDriverAllowance || 0) +
      (bill.fuelCost || 0) +
      (bill.nightCost || 0) +
      (bill.tollParkingCost || 0);

    const taxableBase = gstTaxableOn === 'RENT_ONLY' ? (bill.baseContractAmount || 0) : subtotal;
    const gstAmount = Math.round((taxableBase * rate) / 100);

    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (rate > 0) {
      if (gstType === 'IGST') {
        igstAmount = gstAmount;
      } else {
        cgstAmount = Math.round(gstAmount / 2);
        sgstAmount = gstAmount - cgstAmount;
      }
    }

    const totalBill = subtotal + gstAmount;
    const paidAmount = bill.status === 'Paid' ? totalBill : (bill.paidAmount || 0);
    const balanceDue = Math.max(0, totalBill - paidAmount);

    bill.subtotal = subtotal;
    bill.gstRate = rate;
    bill.gstType = gstType;
    bill.gstTaxableOn = gstTaxableOn;
    bill.gstAmount = gstAmount;
    bill.cgstAmount = cgstAmount;
    bill.sgstAmount = sgstAmount;
    bill.igstAmount = igstAmount;
    bill.totalBill = totalBill;
    bill.paidAmount = paidAmount;
    bill.balanceDue = balanceDue;

    await bill.save();
    updatedBills.push(bill);
  }

  res.status(200).json({
    success: true,
    message: `Applied ${rate}% GST to ${updatedBills.length} invoices.`,
    updatedCount: updatedBills.length,
    data: updatedBills
  });
});

// @desc    Generate Weekend Cash Memo Bill from Daily Duty Log
// @route   POST /api/bills/weekend-memo
export const generateWeekendBillFromLog = asyncHandler(async (req, res) => {
  const { dailyDutyLogId } = req.body;
  if (!dailyDutyLogId) {
    return res.status(400).json({ success: false, error: 'dailyDutyLogId is required' });
  }

  const log = await DailyDutyLog.findById(dailyDutyLogId);
  if (!log) {
    return res.status(404).json({ success: false, error: 'Daily duty log not found' });
  }

  // If already billed, find existing bill
  if (log.weekendBillId) {
    const existing = await MonthlyBill.findById(log.weekendBillId);
    if (existing) {
      return res.status(200).json({ success: true, message: 'Bill already exists', data: existing });
    }
  }

  // Calculate pricing
  const basePrice = Number(log.packageBasePrice) || 2255;
  const freeKm = Number(log.packageFreeKm) || 80;
  const totalKm = Number(log.totalKm) || Math.max(0, (log.endKm || 0) - (log.startKm || 0));
  const extraKm = Math.max(0, totalKm - freeKm);
  const extraKmRate = Number(log.extraKmRate) || 14;
  const extraKmCost = log.extraKmCost ?? (extraKm * extraKmRate);
  const tollParking = Number(log.tollParkingAmount) || 0;
  const extraFuel = Number(log.extraFuelCost || log.fuelAmount) || 0;

  const subtotal = log.subtotal || (basePrice + extraKmCost + tollParking + extraFuel);
  const gstRate = log.gstRate !== undefined ? Number(log.gstRate) : 5;
  const gstAmount = log.gstAmount !== undefined ? Number(log.gstAmount) : Math.round((subtotal * gstRate) / 100);
  const totalBill = log.totalFare && log.totalFare > 0 ? log.totalFare : (subtotal + gstAmount);

  const billNumber = log.dutySlipNumber.match(/^\d+$/) ? log.dutySlipNumber : `MEMO-${log.dutySlipNumber}`;

  // Create Bill in database
  const newBill = await MonthlyBill.create({
    billNumber,
    billType: 'Weekend / Off-Duty Cash Memo',
    dailyDutyLogId: log._id.toString(),
    departmentName: log.departmentName,
    vehicle: log.vehicle,
    billingMonth: log.month || '2026-08',
    dutyStartDate: log.date,
    dutyEndDate: log.date,
    baseContractAmount: basePrice,
    packageFreeKm: freeKm,
    extraKmRate,
    totalKmRun: totalKm,
    extraKmCost,
    extraHoursCost: 0,
    fuelCost: extraFuel,
    tollParkingCost: tollParking,
    subtotal,
    gstRate,
    gstType: 'CGST_SGST',
    gstTaxableOn: 'TOTAL',
    gstAmount,
    cgstAmount: Math.round(gstAmount / 2),
    sgstAmount: gstAmount - Math.round(gstAmount / 2),
    igstAmount: 0,
    partyGstin: '05AAAGB1234F1Z5',
    totalBill,
    paidAmount: totalBill,
    balanceDue: 0,
    status: 'Paid',
    dueDate: log.date,
    journeyFrom: log.journeyFrom || 'D.Dun Bangarawali',
    journeyTo: log.journeyTo || log.tripDestination || 'Vikasnagar & Local to D.Dun',
    invoicePdf: `cashmemo_${billNumber}.pdf`
  });

  // Update DailyDutyLog
  log.billingStatus = 'Billed';
  log.weekendBillNumber = billNumber;
  log.weekendBillId = newBill._id.toString();
  await log.save();

  res.status(201).json({
    success: true,
    message: `Cash Memo #${billNumber} issued successfully`,
    data: newBill
  });
});

// @desc    Delete monthly bill
// @route   DELETE /api/bills/:id
export const deleteBill = asyncHandler(async (req, res) => {
  const bill = await MonthlyBill.findById(req.params.id);
  if (!bill) {
    return res.status(404).json({ success: false, error: 'Bill not found' });
  }

  // If this was linked to a dailyDutyLog, reset its billingStatus
  if (bill.dailyDutyLogId) {
    try {
      await DailyDutyLog.findByIdAndUpdate(bill.dailyDutyLogId, {
        billingStatus: 'Unbilled',
        weekendBillNumber: null,
        weekendBillId: null
      });
    } catch (resetErr) {
      console.warn('Could not reset dailyDutyLog billing status', resetErr);
    }
  }

  await bill.deleteOne();
  res.status(200).json({ success: true, message: 'Invoice deleted successfully' });
});
