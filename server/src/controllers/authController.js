import crypto from 'crypto';
import { User } from '../models/User.js';
import { RefreshToken } from '../models/RefreshToken.js';
import {
  generateAccessToken,
  generateRefreshToken,
  generateToken
} from '../middleware/authMiddleware.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { emitLoginAlert } from '../services/notificationEmitter.js';
import { parseDeviceInfo } from '../utils/deviceParser.js';

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, rememberMe } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Please provide name, email, and password.'
    });
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(409).json({
      success: false,
      error: 'An account with this email address already exists.'
    });
  }

  // Create user
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    role: role || 'admin',
    phone: phone ? phone.trim() : undefined
  });

  // Device & Session capture
  const device = parseDeviceInfo(req);
  const { rawToken, tokenHash, expiresAt } = generateRefreshToken(Boolean(rememberMe));

  const session = await RefreshToken.create({
    userId: user._id,
    tokenHash,
    device,
    rememberMe: Boolean(rememberMe),
    expiresAt,
    lastActiveAt: new Date()
  });

  const accessToken = generateAccessToken(user._id, session._id);

  res.status(201).json({
    success: true,
    token: accessToken,
    accessToken,
    refreshToken: rawToken,
    session: {
      id: session._id.toString(),
      device: session.device,
      rememberMe: session.rememberMe,
      expiresAt: session.expiresAt
    },
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar
    }
  });
});

/**
 * @desc    Login user with Remember Me & Device tracking
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password, rememberMe } = req.body;

  // Validate email & password input
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Please provide both email and password.'
    });
  }

  // Find user and explicitly select password field
  const cleanEmail = email.toLowerCase().trim();
  let user = await User.findOne({ email: cleanEmail }).select('+password');
  if (!user && cleanEmail === 'admin@kabpro.com') {
    user = await User.findOne({ email: 'admin@fleetos.com' }).select('+password');
  } else if (!user && cleanEmail === 'admin@fleetos.com') {
    user = await User.findOne({ email: 'admin@kabpro.com' }).select('+password');
  }

  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials. User not found with this email.'
    });
  }

  if (user.status === 'Suspended') {
    return res.status(403).json({
      success: false,
      error: 'Your account has been suspended. Please contact administrator.'
    });
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials. Incorrect password.'
    });
  }

  // Parse device information & generate session
  const device = parseDeviceInfo(req);
  const { rawToken, tokenHash, expiresAt } = generateRefreshToken(Boolean(rememberMe));

  const session = await RefreshToken.create({
    userId: user._id,
    tokenHash,
    device,
    rememberMe: Boolean(rememberMe),
    expiresAt,
    lastActiveAt: new Date()
  });

  const accessToken = generateAccessToken(user._id, session._id);

  // Track last login timestamp
  await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

  // Real-time login notification
  emitLoginAlert({
    userId: user._id,
    userAgent: req.headers['user-agent'] || '',
    ip: req.ip || req.socket.remoteAddress || ''
  });

  res.status(200).json({
    success: true,
    token: accessToken,
    accessToken,
    refreshToken: rawToken,
    session: {
      id: session._id.toString(),
      device: session.device,
      rememberMe: session.rememberMe,
      expiresAt: session.expiresAt
    },
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar
    }
  });
});

/**
 * @desc    Exchange Refresh Token for a new Access Token
 * @route   POST /api/auth/refresh
 * @access  Public
 */
export const refreshTokenHandler = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      error: 'Refresh token is required.'
    });
  }

  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

  const session = await RefreshToken.findOne({
    tokenHash,
    isRevoked: false
  });

  if (!session) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or revoked refresh token. Please sign in again.'
    });
  }

  if (new Date() > session.expiresAt) {
    return res.status(401).json({
      success: false,
      error: 'Refresh token has expired. Please sign in again.'
    });
  }

  const user = await User.findById(session.userId);
  if (!user || user.status === 'Suspended') {
    return res.status(401).json({
      success: false,
      error: 'User account is inactive or suspended.'
    });
  }

  // Update session activity
  session.lastActiveAt = new Date();
  await session.save();

  // Issue new short-lived access token
  const accessToken = generateAccessToken(user._id, session._id);

  res.status(200).json({
    success: true,
    accessToken,
    token: accessToken, // for backwards compatibility
    refreshToken
  });
});

/**
 * @desc    Logout user and invalidate session
 * @route   POST /api/auth/logout
 * @access  Public / Private
 */
export const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await RefreshToken.findOneAndUpdate({ tokenHash }, { isRevoked: true });
  } else if (req.sessionId) {
    await RefreshToken.findByIdAndUpdate(req.sessionId, { isRevoked: true });
  }

  res.status(200).json({
    success: true,
    message: 'Logged out successfully.'
  });
});

/**
 * @desc    Get all active sessions for current user
 * @route   GET /api/auth/sessions
 * @access  Private (Protect)
 */
export const getActiveSessions = asyncHandler(async (req, res) => {
  const sessions = await RefreshToken.find({
    userId: req.user._id,
    isRevoked: false,
    expiresAt: { $gt: new Date() }
  }).sort('-lastActiveAt');

  const formattedSessions = sessions.map(s => {
    const isCurrent =
      Boolean(req.sessionId && s._id.toString() === req.sessionId.toString()) ||
      // Fallback matching if session ID was not encoded in legacy token
      (sessions.length === 1);

    return {
      id: s._id.toString(),
      device: s.device,
      deviceLabel: s.device?.label || 'Desktop Browser',
      deviceType: s.device?.deviceType || 'desktop',
      browser: s.device?.browser || 'Browser',
      os: s.device?.os || 'OS',
      ip: s.device?.ip || 'Unknown IP',
      rememberMe: s.rememberMe,
      lastActive: s.lastActiveAt || s.updatedAt,
      createdAt: s.createdAt,
      isCurrent
    };
  });

  res.status(200).json({
    success: true,
    sessions: formattedSessions
  });
});

/**
 * @desc    Revoke / log out a specific session
 * @route   DELETE /api/auth/sessions/:id
 * @access  Private (Protect)
 */
export const revokeSession = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const session = await RefreshToken.findOne({
    _id: id,
    userId: req.user._id
  });

  if (!session) {
    return res.status(404).json({
      success: false,
      error: 'Session not found or already revoked.'
    });
  }

  session.isRevoked = true;
  await session.save();

  res.status(200).json({
    success: true,
    message: 'Session has been logged out successfully.'
  });
});

/**
 * @desc    Revoke / log out all other sessions except current
 * @route   DELETE /api/auth/sessions
 * @access  Private (Protect)
 */
export const revokeAllOtherSessions = asyncHandler(async (req, res) => {
  const query = {
    userId: req.user._id,
    isRevoked: false
  };

  if (req.sessionId) {
    query._id = { $ne: req.sessionId };
  }

  await RefreshToken.updateMany(query, { isRevoked: true });

  res.status(200).json({
    success: true,
    message: 'All other sessions have been logged out.'
  });
});

/**
 * @desc    Get currently authenticated user profile
 * @route   GET /api/auth/me
 * @access  Private (Protect)
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar
    }
  });
});

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private (Protect)
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const fieldsToUpdate = {};
  if (req.body.name) fieldsToUpdate.name = req.body.name.trim();
  if (req.body.phone !== undefined) fieldsToUpdate.phone = req.body.phone.trim();
  if (req.body.avatar !== undefined) fieldsToUpdate.avatar = req.body.avatar;

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar
    }
  });
});

/**
 * @desc    Update password
 * @route   PUT /api/auth/password
 * @access  Private (Protect)
 */
export const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      error: 'Please provide both current and new password.'
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'New password must be at least 6 characters long.'
    });
  }

  const user = await User.findById(req.user.id).select('+password');

  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      error: 'Current password does not match.'
    });
  }

  user.password = newPassword;
  await user.save();

  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    message: 'Password updated successfully.',
    token
  });
});

