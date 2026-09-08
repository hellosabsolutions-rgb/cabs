import { messaging } from '../config/firebase.js';
import { User } from '../models/User.js';

/**
 * Send Web Push Notification to a list of device FCM tokens via Firebase Admin SDK.
 * Automatically prunes invalid/expired tokens from the database.
 */
export const sendPushNotification = async ({
  tokens = [],
  title,
  body,
  data = {},
  link = '/notifications',
  category = 'system',
  priority = 'info'
}) => {
  if (!messaging) {
    console.warn('[FCM] Firebase Messaging is not initialized. Skipping push notification.');
    return { success: false, reason: 'Firebase Messaging not initialized' };
  }

  // Filter out empty or duplicate tokens
  const uniqueTokens = [...new Set(tokens.filter(Boolean))];
  if (uniqueTokens.length === 0) {
    return { success: true, sentCount: 0, reason: 'No tokens provided' };
  }

  // Ensure all data values are strings for FCM payload compatibility
  const sanitizedData = {
    link: String(link || '/notifications'),
    category: String(category || 'system'),
    priority: String(priority || 'info'),
    click_action: String(link || '/notifications')
  };

  Object.entries(data || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      sanitizedData[key] = typeof value === 'object' ? JSON.stringify(value) : String(value);
    }
  });

  const payload = {
    tokens: uniqueTokens,
    notification: {
      title: title || 'FleetOS Notification',
      body: body || ''
    },
    data: sanitizedData,
    webpush: {
      headers: {
        Urgency: priority === 'critical' ? 'high' : 'normal',
        TTL: '86400' // 24 hours
      },
      notification: {
        title: title || 'FleetOS Notification',
        body: body || '',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `${category}-${Date.now()}`,
        requireInteraction: priority === 'critical',
        data: {
          url: link || '/notifications',
          link: link || '/notifications',
          category,
          priority,
          ...sanitizedData
        }
      },
      fcmOptions: {
        link: link || '/notifications'
      }
    }
  };

  try {
    const response = await messaging.sendEachForMulticast(payload);
    console.log(`📡 [FCM] Sent multicast: ${response.successCount} succeeded, ${response.failureCount} failed out of ${uniqueTokens.length}`);

    // If there were failed tokens, check if they need to be pruned
    if (response.failureCount > 0) {
      const deadTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success && resp.error) {
          const code = resp.error.code;
          if (
            code === 'messaging/registration-token-not-registered' ||
            code === 'messaging/invalid-registration-token' ||
            code === 'messaging/invalid-argument'
          ) {
            deadTokens.push(uniqueTokens[idx]);
          }
        }
      });

      if (deadTokens.length > 0) {
        console.log(`🧹 [FCM] Pruning ${deadTokens.length} expired/invalid device tokens from database...`);
        await User.updateMany(
          {},
          { $pull: { fcmTokens: { token: { $in: deadTokens } } } }
        ).catch((err) => console.warn('Failed to prune dead FCM tokens:', err.message));
      }
    }

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount
    };
  } catch (error) {
    console.error('❌ [FCM] Multicast send error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send push notification to a specific user by ID.
 * Respects user's notification preferences.
 */
export const sendPushToUser = async (userId, { title, body, data = {}, link, category = 'system', priority = 'info' }) => {
  try {
    const user = await User.findById(userId).select('fcmTokens notificationPreferences status').lean();
    if (!user || user.status === 'Suspended') return;

    // Check notification preference for this category
    if (user.notificationPreferences && user.notificationPreferences[category] === false) {
      return;
    }

    const tokens = (user.fcmTokens || []).map((t) => t.token);
    if (!tokens.length) return;

    return await sendPushNotification({
      tokens,
      title,
      body,
      data,
      link,
      category,
      priority
    });
  } catch (error) {
    console.warn(`[FCM] Failed to send push to user ${userId}:`, error.message);
  }
};

/**
 * Send push notification to all active users in an agency.
 */
export const sendPushToAgency = async (agencyId, { title, body, data = {}, link, category = 'fleet', priority = 'info' }) => {
  try {
    const users = await User.find({
      $or: [{ currentAgency: agencyId }, { agencies: agencyId }],
      status: 'Active'
    }).select('fcmTokens notificationPreferences').lean();

    const targetTokens = [];
    for (const u of users) {
      if (u.notificationPreferences && u.notificationPreferences[category] === false) {
        continue;
      }
      (u.fcmTokens || []).forEach((t) => {
        if (t.token) targetTokens.push(t.token);
      });
    }

    if (!targetTokens.length) return;

    return await sendPushNotification({
      tokens: targetTokens,
      title,
      body,
      data,
      link,
      category,
      priority
    });
  } catch (error) {
    console.warn(`[FCM] Failed to send push to agency ${agencyId}:`, error.message);
  }
};

/**
 * Send push notification to all active users in system (system broadcast).
 */
export const sendPushToAllUsers = async ({ title, body, data = {}, link, category = 'system', priority = 'info' }) => {
  try {
    const users = await User.find({ status: 'Active' }).select('fcmTokens notificationPreferences').lean();
    const targetTokens = [];
    for (const u of users) {
      if (u.notificationPreferences && u.notificationPreferences[category] === false) {
        continue;
      }
      (u.fcmTokens || []).forEach((t) => {
        if (t.token) targetTokens.push(t.token);
      });
    }

    if (!targetTokens.length) return;

    return await sendPushNotification({
      tokens: targetTokens,
      title,
      body,
      data,
      link,
      category,
      priority
    });
  } catch (error) {
    console.warn('[FCM] Failed to send push broadcast to all users:', error.message);
  }
};
