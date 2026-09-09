import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { socketManager } from '../services/socket';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import {
  isPushSupported,
  getPushPermissionState,
  requestPushPermissionAndGetToken,
  unregisterPushToken,
  setupForegroundPushListener
} from '../services/pushNotificationService';

export type NotificationCategory =
  | 'compliance'
  | 'maintenance'
  | 'fleet'
  | 'financial'
  | 'bookings'
  | 'system'
  | 'chat';

export type NotificationPriority = 'critical' | 'warning' | 'info' | 'success';

export interface NotificationItem {
  id: string;
  _id?: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  isRead: boolean;
  link?: string | null;
  metadata?: Record<string, any>;
  createdAt: string;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  isConnected: boolean;
  isLoading: boolean;
  activeToast: NotificationItem | null;
  dismissToast: () => void;
  fetchNotifications: (category?: string, unread?: boolean) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: (category?: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  // Push Notification state & actions
  isPushSupported: boolean;
  pushPermission: NotificationPermission;
  isPushEnabled: boolean;
  enablePush: () => Promise<{ success: boolean; error?: string }>;
  disablePush: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeToast, setActiveToast] = useState<NotificationItem | null>(null);

  // Push notification state
  const [isPushSupportedState] = useState<boolean>(() => isPushSupported());
  const [pushPermission, setPushPermission] = useState<NotificationPermission>(() => getPushPermissionState());
  const [isPushEnabled, setIsPushEnabled] = useState<boolean>(() => {
    return (
      isPushSupported() &&
      getPushPermissionState() === 'granted' &&
      Boolean(localStorage.getItem('fleetos_fcm_token'))
    );
  });

  // Enable push notifications
  const enablePush = useCallback(async () => {
    const res = await requestPushPermissionAndGetToken();
    setPushPermission(getPushPermissionState());
    if (res.success) {
      setIsPushEnabled(true);
      return { success: true };
    }
    setIsPushEnabled(false);
    return { success: false, error: res.error };
  }, []);

  // Disable push notifications
  const disablePush = useCallback(async () => {
    await unregisterPushToken();
    setIsPushEnabled(false);
  }, []);

  // Auto-sync token if permission is already granted
  useEffect(() => {
    if (isAuthenticated && user && pushPermission === 'granted') {
      requestPushPermissionAndGetToken().then((res) => {
        if (res.success) setIsPushEnabled(true);
      });
    }
  }, [isAuthenticated, user, pushPermission]);

  // Listen for foreground push messages
  useEffect(() => {
    if (!isAuthenticated) return;

    let unsub: (() => void) | null = null;
    setupForegroundPushListener((payload) => {
      const formatted: NotificationItem = {
        id: (payload.data?.id as string) || `fcm-${Date.now()}`,
        category: (payload.data?.category as any) || 'system',
        priority: (payload.data?.priority as any) || 'info',
        title: payload.notification?.title || (payload.data?.title as string) || 'FleetOS Alert',
        message:
          payload.notification?.body ||
          (payload.data?.body as string) ||
          (payload.data?.message as string) ||
          '',
        isRead: false,
        link: (payload.data?.link as string) || null,
        metadata: payload.data || {},
        createdAt: new Date().toISOString()
      };

      setNotifications((prev) => [formatted, ...prev.filter((n) => n.id !== formatted.id)]);
      setUnreadCount((prev) => prev + 1);
      setActiveToast(formatted);
    }).then((cleanup) => {
      unsub = cleanup;
    });

    return () => {
      if (unsub) unsub();
    };
  }, [isAuthenticated]);

  const dismissToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  // Fetch unread count from API
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get<{ success: boolean; count: number }>('/notifications/unread-count');
      if (res && typeof res.count === 'number') {
        setUnreadCount(res.count);
      }
    } catch {
      // Ignore initial auth error if token not ready
    }
  }, [isAuthenticated]);

  // Fetch notifications from API
  const fetchNotifications = useCallback(
    async (category?: string, unread?: boolean) => {
      if (!isAuthenticated) return;
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (category && category !== 'all') params.append('category', category);
        if (unread) params.append('unread', 'true');

        const query = params.toString() ? `?${params.toString()}` : '';
        const res = await api.get<{
          success: boolean;
          notifications: any[];
          total: number;
        }>(`/notifications${query}`);

        if (res && res.success && Array.isArray(res.notifications)) {
          const mapped: NotificationItem[] = res.notifications.map((n) => ({
            id: n._id || n.id,
            _id: n._id,
            category: n.category || 'system',
            priority: n.priority || 'info',
            title: n.title,
            message: n.message,
            isRead: Boolean(n.isRead),
            link: n.link || null,
            metadata: n.metadata || {},
            createdAt: n.createdAt || new Date().toISOString(),
          }));
          setNotifications(mapped);
        }
      } catch (err) {
        console.warn('Failed to fetch notifications:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated]
  );

  const refreshNotifications = useCallback(async () => {
    await Promise.all([fetchNotifications(), fetchUnreadCount()]);
  }, [fetchNotifications, fetchUnreadCount]);

  // Mark single notification as read
  const markRead = useCallback(async (id: string) => {
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await api.put(`/notifications/${id}/read`);
    } catch (err) {
      console.warn('Failed to mark notification as read:', err);
    }
  }, []);

  // Mark all notifications as read
  const markAllRead = useCallback(
    async (category?: string) => {
      setNotifications((prev) =>
        prev.map((n) => {
          if (!category || category === 'all' || n.category === category) {
            return { ...n, isRead: true };
          }
          return n;
        })
      );
      setUnreadCount(0);

      try {
        const query = category && category !== 'all' ? `?category=${category}` : '';
        await api.put(`/notifications/read-all${query}`);
      } catch (err) {
        console.warn('Failed to mark all as read:', err);
      }
    },
    []
  );

  // Soft-delete single notification
  const deleteNotification = useCallback(async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await api.delete(`/notifications/${id}`);
      fetchUnreadCount();
    } catch (err) {
      console.warn('Failed to delete notification:', err);
    }
  }, [fetchUnreadCount]);

  // Clear all notifications
  const clearAll = useCallback(async () => {
    setNotifications([]);
    setUnreadCount(0);
    try {
      await api.delete('/notifications/all');
    } catch (err) {
      console.warn('Failed to clear notifications:', err);
    }
  }, []);

  // Socket connection & real-time event listeners
  useEffect(() => {
    if (!isAuthenticated || !user) {
      socketManager.disconnectAll();
      setIsConnected(false);
      return;
    }

    const token = localStorage.getItem('fleetos_auth_token');
    if (token) {
      socketManager.updateToken(token);
    }

    const socket = socketManager.getNotificationSocket();

    const handleConnect = () => {
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleNewNotification = (item: any) => {
      const formatted: NotificationItem = {
        id: item.id || item._id,
        category: item.category || 'system',
        priority: item.priority || 'info',
        title: item.title,
        message: item.message,
        isRead: false,
        link: item.link || null,
        metadata: item.metadata || {},
        createdAt: item.createdAt || new Date().toISOString(),
      };

      // Prepend to notifications list
      setNotifications((prev) => [formatted, ...prev.filter((n) => n.id !== formatted.id)]);
      setUnreadCount((prev) => prev + 1);

      // Trigger pop-up toast
      setActiveToast(formatted);
    };

    const handleUnreadCount = (data: { count: number }) => {
      if (typeof data.count === 'number') {
        setUnreadCount(data.count);
      }
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('notification:new', handleNewNotification);
    socket.on('notification:agency', handleNewNotification);
    socket.on('notification:unread-count', handleUnreadCount);

    if (socket.connected) {
      setIsConnected(true);
    }

    // Initial load
    fetchNotifications();
    fetchUnreadCount();

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('notification:new', handleNewNotification);
      socket.off('notification:agency', handleNewNotification);
      socket.off('notification:unread-count', handleUnreadCount);
    };
  }, [isAuthenticated, user, fetchNotifications, fetchUnreadCount]);

  // Auto-hide toast after 5.5 seconds
  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      setActiveToast(null);
    }, 5500);
    return () => clearTimeout(timer);
  }, [activeToast]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isConnected,
        isLoading,
        activeToast,
        dismissToast,
        fetchNotifications,
        markRead,
        markAllRead,
        deleteNotification,
        clearAll,
        refreshNotifications,
        isPushSupported: isPushSupportedState,
        pushPermission,
        isPushEnabled,
        enablePush,
        disablePush,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
