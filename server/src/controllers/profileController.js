import { User } from '../models/User.js';
import { Agency } from '../models/Agency.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { generateToken } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../middleware/asyncHandler.js';


/**
 * @desc    Get full profile of current user (with agencies)
 * @route   GET /api/profile
 * @access  Private
 */
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('currentAgency');

  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found.' });
  }

  // Fetch all agencies linked to this user
  const agencies = await Agency.find({
    $or: [{ owner: req.user._id }, { _id: { $in: user.agencies || [] } }]
  }).sort('-createdAt');

  res.status(200).json({
    success: true,
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || null,
      avatar: user.avatar || null,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    },
    currentAgency: user.currentAgency || null,
    agencies
  });
});

/**
 * @desc    Update user profile info (name, phone, avatar)
 * @route   PUT /api/profile
 * @access  Private
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, avatar } = req.body;

  if (!name && phone === undefined && avatar === undefined) {
    return res.status(400).json({
      success: false,
      error: 'Please provide at least one field to update (name, phone, or avatar).'
    });
  }

  const fieldsToUpdate = {};
  if (name && name.trim()) fieldsToUpdate.name = name.trim();
  if (phone !== undefined) fieldsToUpdate.phone = phone ? phone.trim() : '';
  if (avatar !== undefined) fieldsToUpdate.avatar = avatar;

  const user = await User.findByIdAndUpdate(req.user._id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found.' });
  }

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully.',
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || null,
      avatar: user.avatar || null
    }
  });
});

/**
 * @desc    Change password with current password verification
 * @route   PUT /api/profile/password
 * @access  Private
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      error: 'Please provide both your current password and a new password.'
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'New password must be at least 6 characters long.'
    });
  }

  if (currentPassword === newPassword) {
    return res.status(400).json({
      success: false,
      error: 'New password cannot be the same as your current password.'
    });
  }

  // Load user with password field
  const user = await User.findById(req.user._id).select('+password');

  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found.' });
  }

  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      error: 'Current password is incorrect. Please try again.'
    });
  }

  user.password = newPassword;
  await user.save(); // triggers bcrypt pre-save hook

  // Issue a fresh token after password change
  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    message: 'Password changed successfully. Please use your new password on next login.',
    token
  });
});

/**
 * @desc    Upload / update profile avatar (base64 or URL)
 * @route   PUT /api/profile/avatar
 * @access  Private
 */
export const updateAvatar = asyncHandler(async (req, res) => {
  const { avatar } = req.body;

  if (avatar === undefined) {
    return res.status(400).json({ success: false, error: 'Avatar data is required.' });
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { avatar: avatar || null },
    { new: true }
  );

  res.status(200).json({
    success: true,
    message: avatar ? 'Avatar updated successfully.' : 'Avatar removed.',
    avatar: user.avatar
  });
});

/**
 * @desc    Delete / remove profile avatar
 * @route   DELETE /api/profile/avatar
 * @access  Private
 */
export const deleteAvatar = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { avatar: null });

  res.status(200).json({
    success: true,
    message: 'Profile avatar removed successfully.'
  });
});

/**
 * @desc    Get notification preferences for the current user
 * @route   GET /api/profile/notification-preferences
 * @access  Private
 */
export const getNotificationPreferences = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('notificationPreferences');

  const defaults = {
    compliance: true,
    maintenance: true,
    fleet: true,
    financial: true,
    bookings: true
  };

  res.status(200).json({
    success: true,
    preferences: user?.notificationPreferences || defaults
  });
});

/**
 * @desc    Update notification preferences for the current user
 * @route   PUT /api/profile/notification-preferences
 * @access  Private
 */
export const updateNotificationPreferences = asyncHandler(async (req, res) => {
  const { compliance, maintenance, fleet, financial, bookings } = req.body;

  const preferences = {};
  if (typeof compliance === 'boolean') preferences.compliance = compliance;
  if (typeof maintenance === 'boolean') preferences.maintenance = maintenance;
  if (typeof fleet === 'boolean') preferences.fleet = fleet;
  if (typeof financial === 'boolean') preferences.financial = financial;
  if (typeof bookings === 'boolean') preferences.bookings = bookings;

  if (Object.keys(preferences).length === 0) {
    return res.status(400).json({
      success: false,
      error: 'No valid preference fields provided.'
    });
  }

  // Store preferences as a nested document on User
  const updateQuery = {};
  Object.keys(preferences).forEach(key => {
    updateQuery[`notificationPreferences.${key}`] = preferences[key];
  });

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updateQuery },
    { new: true }
  );

  res.status(200).json({
    success: true,
    message: 'Notification preferences saved.',
    preferences: user.notificationPreferences
  });
});

/**
/**
 * @desc    Get list of active sessions
 * @route   GET /api/profile/sessions
 * @access  Private
 */
export const getSessions = asyncHandler(async (req, res) => {
  const sessions = await RefreshToken.find({
    userId: req.user._id,
    isRevoked: false,
    expiresAt: { $gt: new Date() }
  }).sort('-lastActiveAt');

  const formattedSessions = sessions.map(s => {
    const isCurrent =
      Boolean(req.sessionId && s._id.toString() === req.sessionId.toString()) ||
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
 * @desc    Deactivate / delete the user's account
 * @route   DELETE /api/profile
 * @access  Private (Admin only)
 */
export const deactivateAccount = asyncHandler(async (req, res) => {
  // Only admin can deactivate from the profile screen
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Only an admin can deactivate their account.'
    });
  }

  // Suspend instead of hard-delete to preserve referential integrity
  await User.findByIdAndUpdate(req.user._id, { status: 'Suspended' });

  res.status(200).json({
    success: true,
    message: 'Account has been deactivated. Contact support to reactivate.'
  });
});
