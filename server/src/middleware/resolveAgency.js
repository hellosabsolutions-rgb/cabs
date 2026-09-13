import { User } from '../models/User.js';
import { asyncHandler } from './asyncHandler.js';
import { userCanAccessAgency } from '../utils/tenantQuery.js';

/**
 * Attach req.agencyId for multi-tenant data isolation.
 * - Dashboard users: user.currentAgency (auto-picks first linked agency if missing)
 * - Driver app: driver.agencyId
 */
export const resolveAgency = asyncHandler(async (req, res, next) => {
  if (req.driver) {
    const agencyId = req.driver.agencyId?.toString();
    if (!agencyId) {
      return res.status(403).json({
        success: false,
        error: 'Driver is not linked to an agency.',
        code: 'AGENCY_REQUIRED'
      });
    }
    req.agencyId = agencyId;
    return next();
  }

  if (!req.user) {
    return next();
  }

  let agencyId = req.user.currentAgency?.toString() || null;

  const headerAgency = req.headers['x-agency-id'];
  if (headerAgency && agencyId && headerAgency !== agencyId) {
    return res.status(403).json({
      success: false,
      error: 'Agency header does not match your active agency.',
      code: 'AGENCY_MISMATCH'
    });
  }

  if (!agencyId && Array.isArray(req.user.agencies) && req.user.agencies.length > 0) {
    agencyId = req.user.agencies[0].toString();
    await User.findByIdAndUpdate(req.user._id, { currentAgency: agencyId });
    req.user.currentAgency = agencyId;
  }

  if (!agencyId) {
    return res.status(403).json({
      success: false,
      error: 'No active agency. Please create or select an agency first.',
      code: 'AGENCY_REQUIRED'
    });
  }

  const allowed = await userCanAccessAgency(req.user, agencyId);
  if (!allowed) {
    return res.status(403).json({
      success: false,
      error: 'You do not have access to this agency.',
      code: 'AGENCY_FORBIDDEN'
    });
  }

  req.agencyId = agencyId;
  next();
});
