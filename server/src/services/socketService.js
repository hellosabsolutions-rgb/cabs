import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Driver } from '../models/Driver.js';

/**
 * SocketService
 * ─────────────
 * Singleton that manages the Socket.IO server instance.
 *
 * Namespaces
 *   / (root)        ← active (supports driver mobile app & web clients)
 *   /notifications  ← active (web dashboard & mobile notifications)
 *   /chat           ← reserved for future
 *   /tracking       ← reserved for future driver GPS
 *
 * Rooms
 *   user:<userId>       ← personal user notifications
 *   driver:<driverId>   ← direct driver app push events
 *   agency:<agencyId>   ← fleet-wide broadcasts
 */

let io = null;

// Map of userId/driverId → Set of socket IDs (for presence tracking)
const onlineUsers = new Map();

/**
 * Initialise Socket.IO and attach it to the given HTTP server.
 * Must be called once in server.js after createServer().
 */
export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*', // Allow web dashboard, mobile apps (Expo/React Native), and local dev
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

      // Check if this is a driver token
      if (decoded.kind === 'driver') {
        const driver = await Driver.findById(decoded.id).select('_id name phone status assignedVehicle agencyId');
        if (!driver) {
          return next(new Error('AUTH_INVALID: Driver not found'));
        }

        socket.userId = driver._id.toString();
        socket.driverId = driver._id.toString();
        socket.isDriver = true;
        socket.userRole = 'driver';
        socket.agencyId = driver.agencyId?.toString() || null;
        socket.userName = driver.name;
        return next();
      }

      // Otherwise, standard dashboard user
      const user = await User.findById(decoded.id).select('_id name email role currentAgency status');
      if (!user || user.status === 'Suspended') {
        return next(new Error('AUTH_INVALID: User not found or suspended'));
      }

      socket.userId = user._id.toString();
      socket.userRole = user.role;
      socket.agencyId = user.currentAgency?.toString() || null;
      socket.userName = user.name;
      socket.isDriver = false;

      next();
    } catch (err) {
      next(new Error(`AUTH_FAILED: ${err.message}`));
    }
  };

  // ─── Common Connection Setup for Namespaces ─────────────────────────────
  const setupNamespaceEvents = (ns, nsName) => {
    ns.use(authMiddleware);

    ns.on('connection', (socket) => {
      const { userId, agencyId, userName, isDriver, driverId } = socket;

      // Join personal & driver rooms
      socket.join(`user:${userId}`);
      if (isDriver && driverId) {
        socket.join(`driver:${driverId}`);
      }
      if (agencyId) {
        socket.join(`agency:${agencyId}`);
      }

      // Track online presence
      const presenceKey = isDriver ? `driver:${driverId}` : userId;
      if (!onlineUsers.has(presenceKey)) onlineUsers.set(presenceKey, new Set());
      onlineUsers.get(presenceKey).add(socket.id);

      console.log(`🔌 [Socket] ${userName} (${isDriver ? 'Driver' : 'User'} ${userId}) connected to ${nsName} [${socket.id}]`);

      // ── Client events ────────────────────────────────────────────────────
      socket.on('notification:mark-read', (notificationId) => {
        socket.emit('notification:read-ack', { id: notificationId });
      });

      socket.on('notification:mark-all-read', () => {
        socket.emit('notification:all-read-ack', { userId });
      });

      socket.on('ping:presence', () => {
        socket.emit('pong:presence', { ts: Date.now(), userId });
      });

      socket.on('disconnect', (reason) => {
        console.log(`🔌 [Socket] ${userName} disconnected from ${nsName} [${reason}]`);
        const sockets = onlineUsers.get(presenceKey);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) onlineUsers.delete(presenceKey);
        }
      });
    });
  };

  // Setup default root namespace and /notifications namespace
  setupNamespaceEvents(io, '/');
  const notifNs = io.of('/notifications');
  setupNamespaceEvents(notifNs, '/notifications');

  // ─── /chat Namespace (reserved for future) ────────────────────────────────
  const chatNs = io.of('/chat');
  chatNs.use(authMiddleware);
  chatNs.on('connection', (socket) => {
    console.log(`💬 [Socket/chat] ${socket.userName} connected [reserved]`);

    socket.on('chat:join', (roomId) => {
      socket.join(`chat:${roomId}`);
      socket.emit('chat:joined', { roomId });
    });

    socket.on('chat:message', ({ roomId, message }) => {
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
      trackNs.to(`vehicle:${vehicleId}`).emit('location:update', {
        vehicleId, lat, lng, speed, ts: Date.now()
      });
    });

    socket.on('disconnect', () => {});
  });

  console.log('🔌 Socket.IO initialized — namespaces: /, /notifications, /chat, /tracking');
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
 * Emit an event to a specific driver's socket room across both root and /notifications.
 */
export const emitToDriver = (driverId, event, data) => {
  if (!io) return;
  const idStr = driverId?.toString();
  if (!idStr) return;
  io.to(`driver:${idStr}`).emit(event, data);
  io.to(`user:${idStr}`).emit(event, data);
  io.of('/notifications').to(`driver:${idStr}`).emit(event, data);
  io.of('/notifications').to(`user:${idStr}`).emit(event, data);
};

/**
 * Emit an event to a specific user's socket room.
 */
export const emitToUser = (userId, event, data) => {
  if (!io) return;
  const idStr = userId?.toString();
  if (!idStr) return;
  io.to(`user:${idStr}`).emit(event, data);
  io.of('/notifications').to(`user:${idStr}`).emit(event, data);
};

/**
 * Emit an event to all sockets in an agency room.
 */
export const emitToAgency = (agencyId, event, data) => {
  if (!io) return;
  const idStr = agencyId?.toString();
  if (!idStr) return;
  io.to(`agency:${idStr}`).emit(event, data);
  io.of('/notifications').to(`agency:${idStr}`).emit(event, data);
};

/**
 * Broadcast to ALL connected notification sockets.
 */
export const broadcastAll = (event, data) => {
  if (!io) return;
  io.emit(event, data);
  io.of('/notifications').emit(event, data);
};

/**
 * Check if a user or driver has any active socket connections.
 */
export const isUserOnline = (userId) => {
  const idStr = userId?.toString();
  return (
    (onlineUsers.has(idStr) && onlineUsers.get(idStr).size > 0) ||
    (onlineUsers.has(`driver:${idStr}`) && onlineUsers.get(`driver:${idStr}`).size > 0)
  );
};

/**
 * Get count of currently online users.
 */
export const getOnlineCount = () => onlineUsers.size;
