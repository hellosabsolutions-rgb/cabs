import { io, Socket } from 'socket.io-client';
import { SOCKET_SERVER_URL } from '../config/env';

/**
 * SocketManager
 * ─────────────
 * Central client for Socket.IO connections.
 * Supports /notifications, /chat, and /tracking namespaces.
 */
class SocketManager {
  private notificationSocket: Socket | null = null;
  private chatSocket: Socket | null = null;
  private trackingSocket: Socket | null = null;

  private getToken(): string | null {
    return localStorage.getItem('fleetos_auth_token');
  }

  /**
   * Get or initialize the /notifications namespace socket
   */
  public getNotificationSocket(): Socket {
    if (!this.notificationSocket) {
      const token = this.getToken();
      this.notificationSocket = io(`${SOCKET_SERVER_URL}/notifications`, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        autoConnect: true,
      });

      this.notificationSocket.on('connect', () => {
        console.log('⚡ Socket.IO connected to /notifications namespace');
      });

      this.notificationSocket.on('connect_error', (err) => {
        console.warn('⚠️ Socket.IO /notifications connect_error:', err.message);
      });

      this.notificationSocket.on('disconnect', (reason) => {
        console.log('🔌 Socket.IO disconnected from /notifications:', reason);
      });
    }

    return this.notificationSocket;
  }

  /**
   * Get or initialize the /chat namespace socket (ready for future chat feature)
   */
  public getChatSocket(): Socket {
    if (!this.chatSocket) {
      const token = this.getToken();
      this.chatSocket = io(`${SOCKET_SERVER_URL}/chat`, {
        auth: { token },
        transports: ['websocket', 'polling'],
        autoConnect: false, // Activated when chat view mounts
      });
    }
    return this.chatSocket;
  }

  /**
   * Get or initialize the /tracking namespace socket (ready for future driver GPS)
   */
  public getTrackingSocket(): Socket {
    if (!this.trackingSocket) {
      const token = this.getToken();
      this.trackingSocket = io(`${SOCKET_SERVER_URL}/tracking`, {
        auth: { token },
        transports: ['websocket', 'polling'],
        autoConnect: false,
      });
    }
    return this.trackingSocket;
  }

  /**
   * Update auth token on existing sockets (call after login)
   */
  public updateToken(token: string) {
    if (this.notificationSocket) {
      this.notificationSocket.auth = { token };
      if (!this.notificationSocket.connected) {
        this.notificationSocket.connect();
      }
    }
    if (this.chatSocket) {
      this.chatSocket.auth = { token };
    }
    if (this.trackingSocket) {
      this.trackingSocket.auth = { token };
    }
  }

  /**
   * Disconnect all sockets (call on logout)
   */
  public disconnectAll() {
    if (this.notificationSocket) {
      this.notificationSocket.disconnect();
      this.notificationSocket = null;
    }
    if (this.chatSocket) {
      this.chatSocket.disconnect();
      this.chatSocket = null;
    }
    if (this.trackingSocket) {
      this.trackingSocket.disconnect();
      this.trackingSocket = null;
    }
  }
}

export const socketManager = new SocketManager();
