import express from 'express';
import {
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  deleteNotification,
  deleteAllNotifications,
  sendTestNotification
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
