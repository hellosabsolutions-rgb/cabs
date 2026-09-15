/**
 * Monthly tender bill math per fleet-contract-dutylog-bill-flow.pdf
 * GST applies only to base contract amount + night shift charges.
 */

export function aggregateOfficialDutyLogs(logs, contract) {
  const official = (logs || []).filter(
    (l) => (l.dutyType || 'Official Department Duty') === 'Official Department Duty'
  );

  const totalKmRun = official.reduce((sum, l) => sum + (Number(l.totalKm) || Math.max(0, (Number(l.endKm) || 0) - (Number(l.startKm) || 0))), 0);
  const includedKm = Number(contract?.includedKmPerMonth) || 0;
  const extraKmRate = Number(contract?.extraKmRate) || 0;
  const extraKm = Math.max(0, totalKmRun - includedKm);
  const extraKmCost = Math.round(extraKm * extraKmRate);

  const nightCount = official.filter((l) => Boolean(l.isNightShift)).length;
  const nightRate = Number(contract?.nightChargePerDay) || 0;
  const nightCost = Math.round(nightCount * nightRate);

  const tollParkingCost = official.reduce((sum, l) => sum + (Number(l.tollParkingAmount) || 0), 0);

  const baseContractAmount = Number(contract?.monthlyBaseAmount) || 0;

  return {
    logIds: official.map((l) => (l._id ? l._id.toString() : l.id)).filter(Boolean),
    logCount: official.length,
    totalKmRun,
    includedKm,
    extraKm,
    extraKmCost,
    nightCount,
    nightRate,
    nightCost,
    tollParkingCost,
    baseContractAmount,
    extraHoursCost: 0,
    extraDriverAllowance: 0,
    fuelCost: 0
  };
}

export function calculateMonthlyTenderFinancials(data) {
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
  const gstTaxableOn = data.gstTaxableOn || 'BASE_AND_NIGHT';

  let taxableBase = subtotal;
  if (gstTaxableOn === 'BASE_AND_NIGHT' || gstTaxableOn === 'RENT_ONLY') {
    taxableBase = baseContractAmount + nightCost;
  } else if (gstTaxableOn === 'TOTAL') {
    taxableBase = subtotal;
  }

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
    gstTaxableAmount: taxableBase,
    gstAmount,
    cgstAmount,
    sgstAmount,
    igstAmount,
    totalBill,
    paidAmount,
    balanceDue
  };
}
