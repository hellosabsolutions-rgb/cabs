import { DepartmentContract } from '../models/DepartmentContract.js';
import { broadcastAll } from '../services/socketService.js';

/** YYYY-MM-DD in Asia/Kolkata (matches duty/billing dates in the app). */
export function contractTodayIst() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
}

export function resolveStatusForDates(endDate, requestedStatus = 'Active') {
  const today = contractTodayIst();
  const status = requestedStatus || 'Active';
  if (endDate && endDate < today && status === 'Active') {
    return 'Expired';
  }
  return status;
}

export async function syncExpiredContracts(extraFilter = {}) {
  const today = contractTodayIst();
  await DepartmentContract.updateMany(
    { ...extraFilter, status: 'Active', endDate: { $lt: today } },
    { $set: { status: 'Expired' } }
  );
}

export function serializeContract(doc) {
  const json = doc?.toObject ? doc.toObject() : { ...doc };
  json.id = json.id || (json._id && json._id.toString());
  if (json._id) delete json._id;
  json.nightChargePerDay = Number(json.nightChargePerDay) || 0;
  return json;
}

export function emitContractEvent(action, contract) {
  broadcastAll(`contract:${action}`, { contract: serializeContract(contract) });
}
