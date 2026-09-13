import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Driver } from '../models/Driver.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { asyncHandler } from './asyncHandler.js';

/**
 * Generate a short-lived access token (default 15 minutes)
 */
export const generateAccessToken = (id, sessionId = null, kind = 'user') => {
  return jwt.sign(
    { id, sessionId, kind },
    process.env.JWT_SECRET || 'fleetos_default_fallback_jwt_secret',
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRE || '15m'
    }
  );
};

/**
 * Generate a secure cryptographically random refresh token
 */
export const generateRefreshToken = (rememberMe = false) => {
  const rawToken = crypto.randomBytes(40).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const expiryDays = rememberMe ? 30 : 1;
  const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

  return {
    rawToken,
    tokenHash,
    expiresAt
  };
};

/**
 * Backwards compatibility token generator (longer default for non-refreshed flows)
 */
export const generateToken = (id) => {
  return generateAccessToken(id);
};

/**
 * Protect routes - verifies Bearer token in Authorization header
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route. Missing authentication token.'
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fleetos_default_fallback_jwt_secret'
    );

    if (decoded.kind === 'driver') {
      return res.status(401).json({
        success: false,
        error: 'Driver token cannot access this route.'
      });
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'The user belonging to this token no longer exists.'
      });
    }

    if (user.status === 'Suspended') {
      return res.status(403).json({
        success: false,
        error: 'Your account has been suspended. Please contact administrator.'
      });
    }

    req.user = user;
    req.sessionId = decoded.sessionId || null;
    req.authKind = decoded.kind || 'user';

    // Asynchronously update last active time of session if sessionId exists
    if (decoded.sessionId) {
      RefreshToken.findByIdAndUpdate(decoded.sessionId, {
        lastActiveAt: new Date()
      }).catch(() => {});
    }

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Token is invalid or has expired. Please log in again.'
    });
  }
});

/**
 * Protect driver-app routes — verifies a driver JWT
 */
export const protectDriver = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized. Missing authentication token.'
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fleetos_default_fallback_jwt_secret'
    );

    if (decoded.kind && decoded.kind !== 'driver') {
      return res.status(401).json({
        success: false,
        error: 'This route is for drivers only.'
      });
    }

    const driver = await Driver.findById(decoded.id);

    if (!driver) {
      return res.status(401).json({
        success: false,
        error: 'The driver belonging to this token no longer exists.'
      });
    }

    req.driver = driver;
    req.sessionId = decoded.sessionId || null;
    req.authKind = 'driver';

    if (decoded.sessionId) {
      RefreshToken.findByIdAndUpdate(decoded.sessionId, {
        lastActiveAt: new Date()
      }).catch(() => {});
    }

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Token is invalid or has expired. Please log in again.'
    });
  }
});

/**
 * Grant access to specific roles (e.g. 'admin', 'manager')
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role '${req.user?.role}' is not authorized to perform this action.`
      });
    }
    next();
  };
};

