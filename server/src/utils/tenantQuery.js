import mongoose from 'mongoose';
import { Agency } from '../models/Agency.js';

/**
 * Resolve active agency id from request (user dashboard or driver app).
 */
export function getAgencyId(req) {
  if (req.agencyId) return String(req.agencyId);
  if (req.driver?.agencyId) return String(req.driver.agencyId);
  if (req.user?.currentAgency) return String(req.user.currentAgency);
  return null;
}

/**
 * Merge agencyId into a Mongo filter when tenant context is present.
 */
export function withAgencyFilter(req, filter = {}) {
  const agencyId = getAgencyId(req);
  if (!agencyId) return filter;
  return { ...filter, agencyId };
}

/**
 * Stamp agencyId on create/update payloads (ignore client override).
 */
export function stampAgencyId(req, body = {}) {
  const agencyId = getAgencyId(req);
  if (!agencyId) return body;
  const { agencyId: _drop, ...rest } = body;
  return { ...rest, agencyId };
}

/**
 * Check whether user may access an agency (owner or linked list).
 */
export async function userCanAccessAgency(user, agencyId) {
  if (!user || !agencyId) return false;
  const id = String(agencyId);
  const linked = (user.agencies || []).map(a => String(a));
  if (linked.includes(id)) return true;
  const owned = await Agency.exists({ _id: agencyId, owner: user._id });
  return Boolean(owned);
}

export function toObjectId(id) {
  if (!id) return null;
  if (mongoose.Types.ObjectId.isValid(id)) return new mongoose.Types.ObjectId(id);
  return null;
}
