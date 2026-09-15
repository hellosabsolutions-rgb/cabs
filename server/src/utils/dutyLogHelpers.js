import { DepartmentContract } from '../models/DepartmentContract.js';
import { contractTodayIst } from './contractHelpers.js';
import { broadcastAll } from '../services/socketService.js';

function escapeRegExp(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function serializeDutyLog(doc) {
  const json = doc?.toObject ? doc.toObject() : { ...doc };
  json.id = json.id || (json._id && json._id.toString());
  if (json._id) delete json._id;
  json.isNightShift = Boolean(json.isNightShift);
  json.entrySource = json.entrySource || 'Admin';
  json.tollParkingAmount = Number(json.tollParkingAmount) || 0;
  return json;
}

export function contractSnapshot(contract) {
  if (!contract) return null;
  const c = contract.toObject ? contract.toObject() : contract;
  return {
    id: c.id || c._id?.toString(),
    contractNumber: c.contractNumber,
    departmentName: c.departmentName,
    vehicle: c.vehicle,
    monthlyBaseAmount: Number(c.monthlyBaseAmount) || 0,
    includedKmPerMonth: Number(c.includedKmPerMonth) || 0,
    extraKmRate: Number(c.extraKmRate) || 0,
    nightChargePerDay: Number(c.nightChargePerDay) || 0,
    status: c.status,
    endDate: c.endDate
  };
}

export async function findActiveContractForDuty({ departmentName, vehicle, date }) {
  if (!departmentName?.trim() || !vehicle?.trim()) return null;
  const dutyDate = date || contractTodayIst();
  const contracts = await DepartmentContract.find({
    departmentName: new RegExp(`^${escapeRegExp(departmentName.trim())}$`, 'i'),
    vehicle: new RegExp(`^${escapeRegExp(vehicle.trim())}$`, 'i')
  })
    .sort({ endDate: -1 })
    .limit(5);

  for (const c of contracts) {
    if (c.startDate && c.startDate > dutyDate) continue;
    if (c.endDate && c.endDate < dutyDate) continue;
    if (c.status === 'Expired') continue;
    return c;
  }
  return contracts[0] || null;
}

export async function assertOfficialDutyAllowed(body) {
  const dutyType = body.dutyType || 'Official Department Duty';
  if (dutyType !== 'Official Department Duty') return null;

  const dutyDate = body.date || contractTodayIst();
  const contract = await findActiveContractForDuty({
    departmentName: body.departmentName,
    vehicle: body.vehicle,
    date: dutyDate
  });

  if (!contract) return null;

  if (contract.status === 'Expired' || (contract.endDate && contract.endDate < dutyDate)) {
    const err = new Error(
      `Contract ${contract.contractNumber} expired on ${contract.endDate}. Official duty logs are blocked until renewal.`
    );
    err.statusCode = 403;
    throw err;
  }

  if (contract.startDate && contract.startDate > dutyDate) {
    const err = new Error(`Contract ${contract.contractNumber} is not effective until ${contract.startDate}.`);
    err.statusCode = 403;
    throw err;
  }

  return contract;
}

export function emitDutyLogEvent(action, log, extra = {}) {
  const serialized = serializeDutyLog(log);
  broadcastAll(`duty-log:${action}`, {
    action: extra.action || action,
    log: serialized,
    data: serialized,
    contract: extra.contract ? contractSnapshot(extra.contract) : extra.contractSnapshot || null
  });
}
