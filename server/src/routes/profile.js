import express from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
  updateAvatar,
  deleteAvatar,
  getNotificationPreferences,
  updateNotificationPreferences,
  getSessions,
  deactivateAccount
} from '../controllers/profileController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All profile routes require authentication
router.use(protect);

/**
 * @route   GET  /api/profile
 * @desc    Get current user's full profile (with agency info)
 */
router.get('/', getProfile);

/**
 * @route   PUT  /api/profile
 * @desc    Update name, phone
 */
router.put('/', updateProfile);

/**
 * @route   PUT  /api/profile/password
 * @desc    Change password (requires currentPassword verification)
 */
router.put('/password', changePassword);

/**
 * @route   PUT  /api/profile/avatar
 * @desc    Upload / update profile avatar (base64 string or URL)
 */
router.put('/avatar', updateAvatar);

/**
 * @route   DELETE /api/profile/avatar
 * @desc    Remove profile avatar
 */
router.delete('/avatar', deleteAvatar);

/**
 * @route   GET  /api/profile/notification-preferences
 * @desc    Get notification preferences
 */
router.get('/notification-preferences', getNotificationPreferences);

/**
 * @route   PUT  /api/profile/notification-preferences
 * @desc    Update notification preferences
 */
router.put('/notification-preferences', updateNotificationPreferences);

/**
 * @route   GET  /api/profile/sessions
 * @desc    Get list of active sessions for current user
 */
router.get('/sessions', getSessions);

/**
 * @route   DELETE /api/profile
 * @desc    Deactivate account (admin only)
 */
router.delete('/', deactivateAccount);

export default router;
