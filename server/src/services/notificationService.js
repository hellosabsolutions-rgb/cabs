import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { emitToUser, emitToAgency } from './socketService.js';

/**
 * NotificationService
 * ────────────────────
 * In-memory queue with async drain loop.
 *
 * Flow:
 *   controller/emitter → enqueue() → queue[] → drain() → MongoDB + Socket.IO
 *
 * Queue item shape:
 * {
 *   userId:   ObjectId | string,
 *   agencyId: ObjectId | string | null,
 *   category: 'compliance'|'maintenance'|'fleet'|'financial'|'bookings'|'system'|'chat',
 *   priority: 'critical'|'warning'|'info'|'success',
 *   title:    string,
 *   message:  string,
 *   metadata: object   ← links back to source (bookingId, vehicleId, etc.)
 * }
 */

// The in-memory queue
const queue = [];

// Drain state — prevent concurrent drains
let isDraining = false;

/**
 * Push a notification into the queue and schedule a drain.
 */
export const enqueue = (notificationData) => {
  queue.push(notificationData);
  scheduleDrain();
};

/**
 * Schedule a drain on the next event-loop tick (non-blocking).
 */
const scheduleDrain = () => {
  if (isDraining) return;
  setImmediate(drain);
};

/**
 * Drain the entire queue:
 *  1. Dequeue all pending items
 *  2. Bulk-insert into MongoDB
 *  3. Emit each saved notification via Socket.IO
 */
const drain = async () => {
  if (isDraining || queue.length === 0) return;
  isDraining = true;

  // Grab all pending items atomically
  const batch = queue.splice(0, queue.length);

  try {
    // Resolve missing userIds by querying active users
    const expandedBatch = [];
    let defaultUsers = null;

    for (const item of batch) {
      if (item.userId) {
        expandedBatch.push(item);
      } else {
        if (!defaultUsers) {
          defaultUsers = await User.find({ status: 'Active' }).select('_id currentAgency').lean();
        }
        if (defaultUsers && defaultUsers.length > 0) {
          for (const u of defaultUsers) {
            expandedBatch.push({
              ...item,
              userId: u._id,
              agencyId: item.agencyId || u.currentAgency || null
            });
          }
        } else {
          expandedBatch.push(item);
        }
      }
    }

    // Bulk insert (ordered: false = fastest, partial failures don't block)
    const saved = await Notification.insertMany(expandedBatch, { ordered: false });

    // Emit each saved notification to its owner
    for (const notif of saved) {
      const payload = {
        id: notif._id.toString(),
        category: notif.category,
        priority: notif.priority,
        title: notif.title,
        message: notif.message,
        link: notif.link || null,
        metadata: notif.metadata,
        isRead: false,
        createdAt: notif.createdAt.toISOString()
      };

      // Emit to personal room
      if (notif.userId) {
        emitToUser(notif.userId.toString(), 'notification:new', payload);
      }

      // Also emit to agency room (for fleet-wide events)
      if (notif.agencyId) {
        emitToAgency(notif.agencyId.toString(), 'notification:agency', payload);
      }
    }
  } catch (err) {
    // On failure, put items back in the queue to retry
    console.error('[NotificationService] Drain failed, re-queuing batch:', err.message);
    queue.unshift(...batch);
  } finally {
    isDraining = false;
    // If more items arrived while draining, schedule another drain
    if (queue.length > 0) scheduleDrain();
  }
};

/**
 * Convenience builder functions for each domain category.
 */

export const notify = {
  /**
   * Compliance alert (document expiry etc.)
   */
  compliance: ({ userId, agencyId, priority = 'warning', title, message, link = '/compliance', metadata = {} }) => {
    enqueue({ userId, agencyId, category: 'compliance', priority, title, message, link, metadata });
  },

  /**
   * Maintenance event (service scheduled, completed etc.)
   */
  maintenance: ({ userId, agencyId, priority = 'info', title, message, link = '/maintenance', metadata = {} }) => {
    enqueue({ userId, agencyId, category: 'maintenance', priority, title, message, link, metadata });
  },

  /**
   * Fleet event (vehicle status change, driver assignment etc.)
   */
  fleet: ({ userId, agencyId, priority = 'info', title, message, link = '/vehicles', metadata = {} }) => {
    enqueue({ userId, agencyId, category: 'fleet', priority, title, message, link, metadata });
  },

  /**
   * Financial alert (low FASTag, payment received, expense logged etc.)
   */
  financial: ({ userId, agencyId, priority = 'warning', title, message, link = '/fastag', metadata = {} }) => {
    enqueue({ userId, agencyId, category: 'financial', priority, title, message, link, metadata });
  },

  /**
   * Booking event (new booking, trip started, completed, cancelled etc.)
   */
  bookings: ({ userId, agencyId, priority = 'info', title, message, link = '/bookings', metadata = {} }) => {
    enqueue({ userId, agencyId, category: 'bookings', priority, title, message, link, metadata });
  },

  /**
   * System notification (login, password change, account update etc.)
   */
  system: ({ userId, agencyId = null, priority = 'info', title, message, link = '/profile', metadata = {} }) => {
    enqueue({ userId, agencyId, category: 'system', priority, title, message, link, metadata });
  },

  /**
   * Chat notification (future use)
   */
  chat: ({ userId, agencyId = null, priority = 'info', title, message, link = '/chat', metadata = {} }) => {
    enqueue({ userId, agencyId, category: 'chat', priority, title, message, link, metadata });
  }
};

/**
 * Get current queue depth (for health monitoring)
 */
export const getQueueDepth = () => queue.length;
