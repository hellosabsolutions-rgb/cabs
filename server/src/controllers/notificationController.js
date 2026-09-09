import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { emitToUser } from '../services/socketService.js';

const PAGE_SIZE = 30;

/**
 * @desc    Get paginated notifications for the current user
 * @route   GET /api/notifications?category=&unread=true&page=1
 * @access  Private
 */
export const getNotifications = asyncHandler(async (req, res) => {
  const { category, unread, page = 1 } = req.query;

  const filter = {
    userId: req.user._id,
    isDeleted: false
  };

  if (category && category !== 'all') filter.category = category;
  if (unread === 'true') filter.isRead = false;

  const skip = (Number(page) - 1) * PAGE_SIZE;

  const [notifications, total] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(PAGE_SIZE)
      .lean(),
    Notification.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true,
    page: Number(page),
    pageSize: PAGE_SIZE,
    total,
    hasMore: skip + PAGE_SIZE < total,
    notifications
  });
});

/**
 * @desc    Get unread notification count (for badge)
 * @route   GET /api/notifications/unread-count
 * @access  Private
 */
export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    userId: req.user._id,
    isRead: false,
    isDeleted: false
  });

  res.status(200).json({ success: true, count });
});

/**
 * @desc    Mark a single notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
export const markRead = asyncHandler(async (req, res) => {
  const notif = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { isRead: true },
    { new: true }
  );

  if (!notif) {
    return res.status(404).json({ success: false, error: 'Notification not found.' });
  }

  // Emit updated unread count to user
  const newCount = await Notification.countDocuments({
    userId: req.user._id, isRead: false, isDeleted: false
  });
  emitToUser(req.user._id.toString(), 'notification:unread-count', { count: newCount });

  res.status(200).json({ success: true, notification: notif });
});

/**
 * @desc    Mark all notifications as read for current user
 * @route   PUT /api/notifications/read-all
 * @access  Private
 */
export const markAllRead = asyncHandler(async (req, res) => {
  const { category } = req.query;

  const filter = { userId: req.user._id, isRead: false, isDeleted: false };
  if (category && category !== 'all') filter.category = category;

  const result = await Notification.updateMany(filter, { isRead: true });

  // Emit zero count to user
  emitToUser(req.user._id.toString(), 'notification:unread-count', { count: 0 });

  res.status(200).json({
    success: true,
    message: `${result.modifiedCount} notifications marked as read.`,
    modifiedCount: result.modifiedCount
  });
});

/**
 * @desc    Delete (soft-delete) a notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
export const deleteNotification = asyncHandler(async (req, res) => {
  const notif = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { isDeleted: true },
    { new: true }
  );

  if (!notif) {
    return res.status(404).json({ success: false, error: 'Notification not found.' });
  }

  // Refresh unread count after deletion
  const newCount = await Notification.countDocuments({
    userId: req.user._id, isRead: false, isDeleted: false
  });
  emitToUser(req.user._id.toString(), 'notification:unread-count', { count: newCount });

  res.status(200).json({ success: true, message: 'Notification deleted.' });
});

/**
 * @desc    Delete ALL notifications for current user (hard reset)
 * @route   DELETE /api/notifications/all
 * @access  Private
 */
export const deleteAllNotifications = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { userId: req.user._id, isDeleted: false },
    { isDeleted: true }
  );

  emitToUser(req.user._id.toString(), 'notification:unread-count', { count: 0 });

  res.status(200).json({ success: true, message: 'All notifications cleared.' });
});

/**
 * @desc    Trigger a test notification via queue & socket
 * @route   POST /api/notifications/test
 * @access  Private
 */
export const sendTestNotification = asyncHandler(async (req, res) => {
  const {
    category = 'bookings',
    priority = 'success',
    title = 'Live Socket.IO Alert',
    message = 'Queue processed and Socket.IO emitted this alert in real-time!',
    link = '/bookings'
  } = req.body;

  const { notify } = await import('../services/notificationService.js');

  if (typeof notify[category] === 'function') {
    notify[category]({
      userId: req.user._id,
      agencyId: req.user.currentAgency,
      priority,
      title,
      message,
      link,
      metadata: { test: true, timestamp: new Date().toISOString() }
    });
  } else {
    notify.system({
      userId: req.user._id,
      priority,
      title,
      message,
      link,
      metadata: { test: true }
    });
  }

  res.status(200).json({
    success: true,
    message: 'Test notification enqueued and scheduled for real-time delivery.'
  });
});

/**
 * @desc    Register FCM device push token for the current user
 * @route   POST /api/notifications/fcm-token
 * @access  Private
 */
export const registerFcmToken = asyncHandler(async (req, res) => {
  const { token, device = 'web' } = req.body;
  if (!token) {
    return res.status(400).json({ success: false, error: 'FCM token is required' });
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  if (!user.fcmTokens) user.fcmTokens = [];

  const existingIdx = user.fcmTokens.findIndex((t) => t.token === token);
  if (existingIdx >= 0) {
    user.fcmTokens[existingIdx].updatedAt = new Date();
    user.fcmTokens[existingIdx].device = device;
  } else {
    user.fcmTokens.push({ token, device, updatedAt: new Date() });
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: 'FCM device token registered successfully',
    tokenCount: user.fcmTokens.length
  });
});

/**
 * @desc    Unregister FCM device push token
 * @route   DELETE /api/notifications/fcm-token
 * @access  Private
 */
export const unregisterFcmToken = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ success: false, error: 'FCM token is required' });
  }

  await User.findByIdAndUpdate(req.user._id, {
    $pull: { fcmTokens: { token } }
  });

  res.status(200).json({
    success: true,
    message: 'FCM device token unregistered successfully'
  });
});

/**
 * @desc    Send a direct FCM test push notification to user's registered devices
 * @route   POST /api/notifications/test-push
 * @access  Private
 */
export const sendDirectTestPush = asyncHandler(async (req, res) => {
  const { sendPushToUser } = await import('../services/fcmService.js');
  const user = await User.findById(req.user._id).select('fcmTokens name').lean();

  if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'No push tokens registered for this user. Please enable browser push notifications first.'
    });
  }

  const result = await sendPushToUser(req.user._id.toString(), {
    title: '🔔 Test Web Push Notification',
    body: `Hello ${user.name || 'Fleet Manager'}! Firebase Cloud Messaging Web Push is working live on FleetOS.`,
    link: '/notifications',
    category: 'system',
    priority: 'critical'
  });

  res.status(200).json({
    success: true,
    message: 'Test push notification sent via Firebase Cloud Messaging!',
    result
  });
});

