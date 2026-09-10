import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/User.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { StaffInvitation } from '../models/StaffInvitation.js';
import {
  generateAccessToken,
  generateRefreshToken,
  generateToken
} from '../middleware/authMiddleware.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { emitLoginAlert } from '../services/notificationEmitter.js';
import { parseDeviceInfo } from '../utils/deviceParser.js';

/**
 * @desc    Register a new user (Restricted - requires invitation or admin setup)
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, rememberMe, inviteCode } = req.body;

  if (inviteCode) {
    // If inviteCode is supplied, route through invitation acceptance logic
    req.body.inviteCode = inviteCode;
    return acceptInvite(req, res);
  }

  // Public signup is disabled - staff onboarding requires email invitation
  return res.status(403).json({
    success: false,
    error: 'Direct registration is disabled. Staff accounts must be activated via an email invitation.'
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
    // Check if user has an active pending staff invitation
    const pendingInvite = await StaffInvitation.findOne({
      email: cleanEmail,
      status: 'pending'
    }).populate('agency', 'name');

    if (pendingInvite) {
      return res.status(401).json({
        success: false,
        error: `You have an invitation to join ${pendingInvite.agency?.name || 'an agency'}! Please activate your staff account below to set your password.`,
        hasPendingInvite: true,
        inviteCode: pendingInvite.inviteCode,
        email: cleanEmail
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Account not found with this email. Staff access is by email invitation only.'
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

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '546992458715-dbhmfbb7bj36h6sfm2m4l8qjisdmd491.apps.googleusercontent.com';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

/**
 * @desc    Google OAuth Sign-in / Sign-up
 * @route   POST /api/auth/google
 * @access  Public
 */
export const googleLogin = asyncHandler(async (req, res) => {
  const { credential, accessToken: googleAccessToken, rememberMe } = req.body;

  if (!credential && !googleAccessToken) {
    return res.status(400).json({
      success: false,
      error: 'Google ID credential token or access token is required.'
    });
  }

  let payload;
  if (credential) {
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID
      });
      payload = ticket.getPayload();
    } catch (verifyError) {
      // Fallback: verify with Google's tokeninfo endpoint if needed
      try {
        const resp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
        if (resp.ok) {
          payload = await resp.json();
        }
      } catch (fallbackError) {
        console.warn('Google token verification fallback error:', fallbackError);
      }
    }
  }

  if (!payload && googleAccessToken) {
    try {
      const resp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${googleAccessToken}` }
      });
      if (resp.ok) {
        payload = await resp.json();
      } else {
        const infoResp = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(googleAccessToken)}`);
        if (infoResp.ok) {
          payload = await infoResp.json();
        }
      }
    } catch (fallbackError) {
      console.warn('Google access token verification error:', fallbackError);
    }
  }

  if (!payload || !payload.email) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired Google credential.'
    });
  }

  const googleId = payload.sub || payload.user_id;
  const email = payload.email;
  const name = payload.name;
  const picture = payload.picture;

  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'No email address associated with this Google account.'
    });
  }

  const cleanEmail = email.toLowerCase().trim();

  // Find user by googleId or email
  let user = await User.findOne({
    $or: [{ googleId }, { email: cleanEmail }]
  });

  if (user) {
    let changed = false;
    if (!user.googleId) {
      user.googleId = googleId;
      changed = true;
    }
    if (!user.avatar && picture) {
      user.avatar = picture;
      changed = true;
    }
    if (changed) {
      await user.save();
    }
  } else {
    user = await User.create({
      name: name || cleanEmail.split('@')[0],
      email: cleanEmail,
      googleId,
      avatar: picture || null,
      role: 'admin',
      authProvider: 'google',
      status: 'Active'
    });
  }

  if (user.status === 'Suspended') {
    return res.status(403).json({
      success: false,
      error: 'Your account has been suspended. Please contact administrator.'
    });
  }

  user.lastLoginAt = new Date();
  await user.save();

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

  try {
    emitLoginAlert({
      userId: user._id,
      email: user.email,
      name: user.name,
      device,
      timestamp: new Date()
    });
  } catch (err) {
    console.warn('Failed to emit login alert notification:', err);
  }

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
      avatar: user.avatar,
      currentAgency: user.currentAgency
    }
  });
});

/**
 * @desc    Accept staff invitation & create/activate staff account
 * @route   POST /api/auth/accept-invite
 * @access  Public
 */
export const acceptInvite = asyncHandler(async (req, res) => {
  const { email, inviteCode, password, name, phone, rememberMe } = req.body;

  if (!email || !inviteCode || !password) {
    return res.status(400).json({
      success: false,
      error: 'Please provide email, invitation code, and password.'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'Password must be at least 6 characters long.'
    });
  }

  const cleanEmail = email.toLowerCase().trim();
  const cleanCode = inviteCode.toUpperCase().trim();

  // Find invitation
  const invitation = await StaffInvitation.findOne({
    email: cleanEmail,
    inviteCode: cleanCode,
    status: 'pending'
  }).populate('agency');

  if (!invitation) {
    return res.status(400).json({
      success: false,
      error: 'Invalid invitation code or email. Please verify your invitation details.'
    });
  }

  // Check expiration
  if (new Date(invitation.expiresAt) < new Date()) {
    invitation.status = 'expired';
    await invitation.save();
    return res.status(400).json({
      success: false,
      error: 'This invitation has expired. Please ask your administrator to send a new invitation.'
    });
  }

  // Check if a user with this email already exists
  let user = await User.findOne({ email: cleanEmail });
  if (user) {
    // If user exists, attach agency & role
    const agencyIdStr = invitation.agency._id.toString();
    const alreadyLinked = user.agencies.some(aId => aId.toString() === agencyIdStr);
    if (!alreadyLinked) {
      user.agencies.push(invitation.agency._id);
    }
    user.currentAgency = invitation.agency._id;
    user.role = invitation.role || 'operator';
    user.password = password;
    if (name && name.trim()) user.name = name.trim();
    if (phone && phone.trim()) user.phone = phone.trim();
    await user.save();
  } else {
    // Create new staff user
    user = await User.create({
      name: (name && name.trim()) || invitation.name || cleanEmail.split('@')[0],
      email: cleanEmail,
      password,
      role: invitation.role || 'operator',
      phone: phone ? phone.trim() : undefined,
      currentAgency: invitation.agency._id,
      agencies: [invitation.agency._id]
    });
  }

  // Mark invitation as accepted
  invitation.status = 'accepted';
  invitation.acceptedAt = new Date();
  invitation.acceptedUser = user._id;
  await invitation.save();

  // Capture device & create session
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

  res.status(200).json({
    success: true,
    message: `Welcome to ${invitation.agency.name}! Your staff account is activated.`,
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
      avatar: user.avatar,
      currentAgency: invitation.agency._id
    }
  });
});

/**
 * @desc    Verify invitation code validity and return agency info
 * @route   GET /api/auth/verify-invite
 * @access  Public
 */
export const verifyInviteCode = asyncHandler(async (req, res) => {
  const { code, token, email } = req.query;

  if (!code && !token) {
    return res.status(400).json({
      success: false,
      error: 'Please provide an invitation code or token.'
    });
  }

  const query = { status: 'pending' };
  if (code) query.inviteCode = String(code).toUpperCase().trim();
  if (token) query.inviteToken = String(token).trim();
  if (email) query.email = String(email).toLowerCase().trim();

  const invitation = await StaffInvitation.findOne(query).populate('agency', 'name businessType logo');

  if (!invitation) {
    return res.status(404).json({
      success: false,
      error: 'Invitation not found or has already been used.'
    });
  }

  if (new Date(invitation.expiresAt) < new Date()) {
    invitation.status = 'expired';
    await invitation.save();
    return res.status(400).json({
      success: false,
      error: 'This invitation has expired. Please request a new invite from your administrator.'
    });
  }

  res.status(200).json({
    success: true,
    valid: true,
    invitation: {
      email: invitation.email,
      name: invitation.name,
      role: invitation.role,
      inviteCode: invitation.inviteCode,
      agency: invitation.agency
    }
  });
});

