import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { asyncHandler } from './asyncHandler.js';

/**
 * Generate a signed JWT token
 */
export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fleetos_default_fallback_jwt_secret', {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
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
