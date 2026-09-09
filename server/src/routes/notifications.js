import express from 'express';
import {
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  deleteNotification,
  deleteAllNotifications,
  sendTestNotification,
  registerFcmToken,
  unregisterFcmToken,
  sendDirectTestPush
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All notification routes require authentication
router.use(protect);

/**
 * @route   GET /api/notifications
 * @desc    Get paginated notifications (filterable by category, unread)
 */
router.get('/', getNotifications);

/**
  * @route   POST /api/notifications/test
  * @desc    Send a test notification through queue and socket
  */
router.post('/test', sendTestNotification);

/**
 * @route   POST /api/notifications/test-push
 * @desc    Send a direct FCM Web Push notification to registered device tokens
 */
router.post('/test-push', sendDirectTestPush);

/**
 * @route   POST /api/notifications/fcm-token
 * @desc    Register FCM device push token for authenticated user
 */
router.post('/fcm-token', registerFcmToken);

/**
 * @route   DELETE /api/notifications/fcm-token
 * @desc    Unregister FCM device push token
 */
router.delete('/fcm-token', unregisterFcmToken);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count for badge
 */
router.get('/unread-count', getUnreadCount);

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all (or category-filtered) notifications as read
 */
router.put('/read-all', markAllRead);

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark a single notification as read
 */
router.put('/:id/read', markRead);

/**
 * @route   DELETE /api/notifications/all
 * @desc    Delete all notifications for current user
 */
router.delete('/all', deleteAllNotifications);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Soft-delete a notification
 */
router.delete('/:id', deleteNotification);

export default router;
