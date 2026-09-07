import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

/**
 * SocketService
 * ─────────────
 * Singleton that manages the Socket.IO server instance.
 *
 * Namespaces
 *   /notifications  ← active
 *   /chat           ← reserved for future
 *   /tracking       ← reserved for future driver GPS
 *
 * Rooms
 *   user:<userId>       ← personal notifications
 *   agency:<agencyId>   ← fleet-wide broadcasts
 */

let io = null;

// Map of userId → Set of socket IDs (for presence tracking)
const onlineUsers = new Map();

/**
 * Initialise Socket.IO and attach it to the given HTTP server.
 * Must be called once in server.js after createServer().
 */
export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST']
    },
    // Graceful ping/pong to detect dropped connections
    pingTimeout: 60000,
    pingInterval: 25000,
    // Allow both WebSocket and long-polling fallback
    transports: ['websocket', 'polling']
  });

  // ─── JWT Auth Middleware (runs on every namespace) ───────────────────────
  const authMiddleware = async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('AUTH_MISSING: No token provided'));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'fleetos_default_fallback_jwt_secret'
      );

      const user = await User.findById(decoded.id).select('_id name email role currentAgency status');
      if (!user || user.status === 'Suspended') {
        return next(new Error('AUTH_INVALID: User not found or suspended'));
      }

      socket.userId = user._id.toString();
      socket.userRole = user.role;
      socket.agencyId = user.currentAgency?.toString() || null;
      socket.userName = user.name;

      next();
    } catch (err) {
      next(new Error(`AUTH_FAILED: ${err.message}`));
    }
  };

  // ─── /notifications Namespace ─────────────────────────────────────────────
  const notifNs = io.of('/notifications');
  notifNs.use(authMiddleware);

  notifNs.on('connection', (socket) => {
    const { userId, agencyId, userName } = socket;

    // Join personal + agency rooms
    socket.join(`user:${userId}`);
    if (agencyId) socket.join(`agency:${agencyId}`);

    // Track online presence
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socket.id);

    console.log(`🔌 [Socket] ${userName} (${userId}) connected to /notifications [${socket.id}]`);

    // ── Client events ────────────────────────────────────────────────────
    socket.on('notification:mark-read', (notificationId) => {
      // Acknowledge — actual DB update done via REST; socket just broadcasts state
      socket.emit('notification:read-ack', { id: notificationId });
    });

    socket.on('notification:mark-all-read', () => {
      socket.emit('notification:all-read-ack', { userId });
    });

    // Presence ping from client
    socket.on('ping:presence', () => {
      socket.emit('pong:presence', { ts: Date.now(), userId });
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 [Socket] ${userName} disconnected from /notifications [${reason}]`);
      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) onlineUsers.delete(userId);
      }
    });
  });

  // ─── /chat Namespace (reserved for future) ────────────────────────────────
  const chatNs = io.of('/chat');
  chatNs.use(authMiddleware);
  chatNs.on('connection', (socket) => {
    console.log(`💬 [Socket/chat] ${socket.userName} connected [reserved]`);

    // Rooms: join:room → chat room join
    socket.on('chat:join', (roomId) => {
      socket.join(`chat:${roomId}`);
      socket.emit('chat:joined', { roomId });
    });

    socket.on('chat:message', ({ roomId, message }) => {
      // TODO: persist & broadcast
      chatNs.to(`chat:${roomId}`).emit('chat:message', {
        id: Date.now().toString(),
        roomId,
        senderId: socket.userId,
        senderName: socket.userName,
        message,
        ts: new Date().toISOString()
      });
    });

    socket.on('disconnect', () => {
      console.log(`💬 [Socket/chat] ${socket.userName} disconnected`);
    });
  });

  // ─── /tracking Namespace (reserved for GPS driver tracking) ──────────────
  const trackNs = io.of('/tracking');
  trackNs.use(authMiddleware);
  trackNs.on('connection', (socket) => {
    console.log(`📍 [Socket/tracking] ${socket.userName} connected [reserved]`);

    socket.on('location:update', ({ vehicleId, lat, lng, speed }) => {
      // TODO: persist + broadcast to dashboard listeners
      trackNs.to(`vehicle:${vehicleId}`).emit('location:update', {
        vehicleId, lat, lng, speed, ts: Date.now()
      });
    });

    socket.on('disconnect', () => {});
  });

  console.log('🔌 Socket.IO initialized — namespaces: /notifications, /chat, /tracking');
  return io;
};

/**
 * Returns the Socket.IO server instance.
 * Throws if initSocket() hasn't been called yet.
 */
export const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialized. Call initSocket(httpServer) first.');
  return io;
};

/**
 * Emit an event to a specific user's socket room.
 */
export const emitToUser = (userId, event, data) => {
  if (!io) return;
  io.of('/notifications').to(`user:${userId}`).emit(event, data);
};

/**
 * Emit an event to all sockets in an agency room.
 */
export const emitToAgency = (agencyId, event, data) => {
  if (!io) return;
  io.of('/notifications').to(`agency:${agencyId}`).emit(event, data);
};

/**
 * Broadcast to ALL connected notification sockets (admin-only use).
 */
export const broadcastAll = (event, data) => {
  if (!io) return;
  io.of('/notifications').emit(event, data);
};

/**
 * Check if a user has any active socket connections.
 */
export const isUserOnline = (userId) => {
  return onlineUsers.has(userId.toString()) && onlineUsers.get(userId.toString()).size > 0;
};

/**
 * Get count of currently online users.
 */
export const getOnlineCount = () => onlineUsers.size;
