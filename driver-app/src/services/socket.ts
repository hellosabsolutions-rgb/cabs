import { io, Socket } from 'socket.io-client';
import { SOCKET_SERVER_URL } from '../constants/config';
import { getAccessToken } from './authStorage';

/**
 * DriverSocketManager
 * ───────────────────
 * Manages WebSocket connection to the KABPRO backend for real-time driver sync:
 * - Driver profile edits from dashboard (name, phone, status, license)
 * - Vehicle assignments & swaps from fleet manager
 * - Booking assignments & updates
 * - Duty state transitions
 */
class DriverSocketManager {
  private socket: Socket | null = null;
  private isConnecting: boolean = false;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  /**
   * Connect or reconnect to the backend socket server using stored or provided JWT token
   */
  public async connect(overrideToken?: string): Promise<Socket | null> {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    if (this.isConnecting) {
      return this.socket;
    }

    this.isConnecting = true;

    try {
      const token = overrideToken || (await getAccessToken());

      if (!token) {
        console.log('ℹ️ [Socket] No driver token found, skipping socket connection.');
        this.isConnecting = false;
        return null;
      }

      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }

      console.log(`🔌 [Socket] Connecting driver to ${SOCKET_SERVER_URL}...`);

      this.socket = io(SOCKET_SERVER_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        autoConnect: true,
      });

      this.socket.on('connect', () => {
        console.log(`⚡ [Socket] Driver connected successfully [ID: ${this.socket?.id}]`);
        this.emitLocal('connection_status', { status: 'connected' });
      });

      this.socket.on('connect_error', (err) => {
        console.warn('⚠️ [Socket] Connection error:', err.message);
        this.emitLocal('connection_status', { status: 'error', error: err.message });
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 [Socket] Driver disconnected:', reason);
        this.emitLocal('connection_status', { status: 'disconnected', reason });
      });

      // ─── Listen to all driver-relevant events from backend ─────────────
      const driverEvents = [
        'driver:updated',
        'driver:status',
        'driver:vehicle-assigned',
        'driver:vehicle-unassigned',
        'driver:removed',
        'booking:assigned',
        'booking:unassigned',
        'booking:updated',
        'booking:created',
        'booking:completed',
        'duty:updated',
        'driver:duty_started',
        'driver:duty_ended',
        'duty-log:created',
        'duty-log:updated',
        'attendance:updated',
        'notification:new',
      ];

      driverEvents.forEach((eventName) => {
        this.socket?.on(eventName, (data) => {
          console.log(`📡 [Socket Event: ${eventName}]`, data);
          this.emitLocal(eventName, data);
          this.emitLocal('driver:any_change', { event: eventName, data });
        });
      });

      this.isConnecting = false;
      return this.socket;
    } catch (err: any) {
      console.error('❌ [Socket] Setup error:', err.message);
      this.isConnecting = false;
      return null;
    }
  }

  /**
   * Disconnect the socket (e.g. on driver sign out)
   */
  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
    console.log('🔌 [Socket] Driver socket disconnected.');
  }

  /**
   * Subscribe to a socket event
   */
  public on(event: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unbind function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  /**
   * Unsubscribe from a socket event
   */
  public off(event: string, callback: (data: any) => void) {
    this.listeners.get(event)?.delete(callback);
  }

  /**
   * Internal dispatcher for local listeners
   */
  private emitLocal(event: string, data: any) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (err) {
          console.error(`Error in listener for ${event}:`, err);
        }
      });
    }
  }

  /**
   * Check if currently connected
   */
  public isConnected(): boolean {
    return !!this.socket?.connected;
  }
}

export const driverSocket = new DriverSocketManager();
