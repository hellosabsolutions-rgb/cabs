import { getToken, deleteToken, onMessage, MessagePayload } from 'firebase/messaging';
import { getFirebaseMessaging, VAPID_KEY } from '../config/firebase';
import { api } from './api';

const FCM_TOKEN_STORAGE_KEY = 'fleetos_fcm_token';

/**
 * Check if the current browser environment supports Push Notifications & Service Workers.
 */
export const isPushSupported = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
};

/**
 * Get current browser notification permission state.
 */
export const getPushPermissionState = (): NotificationPermission => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
};

/**
 * Register the Firebase messaging service worker.
 */
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) return null;

  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/'
    });
    await navigator.serviceWorker.ready;
    console.log('✅ [Push] Service Worker registered with scope:', registration.scope);
    return registration;
  } catch (error) {
    console.error('❌ [Push] Failed to register Service Worker:', error);
    return null;
  }
};

/**
 * Request notification permission, register service worker, acquire FCM token,
 * and register the device token with the backend.
 */
export const requestPushPermissionAndGetToken = async (): Promise<{
  success: boolean;
  token?: string;
  error?: string;
  permission?: NotificationPermission;
}> => {
  if (!isPushSupported()) {
    return {
      success: false,
      error: 'Push notifications are not supported in this browser.'
    };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return {
        success: false,
        permission,
        error: permission === 'denied'
          ? 'Push notifications are blocked in your browser settings. Please allow notifications to enable them.'
          : 'Push notification permission was dismissed.'
      };
    }

    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      return {
        success: false,
        error: 'Firebase messaging could not be initialized in this browser.'
      };
    }

    const swRegistration = await registerServiceWorker();
    if (!swRegistration) {
      return {
        success: false,
        error: 'Could not register background service worker.'
      };
    }

    // Retrieve FCM Web Push Token
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swRegistration
    });

    if (!token) {
      return {
        success: false,
        error: 'No registration token returned by Firebase.'
      };
    }

    console.log('🔥 [Push] Acquired FCM Device Token:', token.slice(0, 16) + '...');
    localStorage.setItem(FCM_TOKEN_STORAGE_KEY, token);

    // Register token with backend
    try {
      await api.post('/notifications/fcm-token', {
        token,
        device: navigator.userAgent.slice(0, 100)
      });
      console.log('📡 [Push] Device token registered with FleetOS backend.');
    } catch (apiErr) {
      console.warn('⚠️ [Push] Failed to save token on backend:', apiErr);
    }

    return {
      success: true,
      token,
      permission: 'granted'
    };
  } catch (err: any) {
    console.error('❌ [Push] Error enabling push notifications:', err);
    return {
      success: false,
      error: err.message || 'An error occurred while enabling push notifications.'
    };
  }
};

/**
 * Unregister FCM token and inform backend.
 */
export const unregisterPushToken = async (): Promise<boolean> => {
  const token = localStorage.getItem(FCM_TOKEN_STORAGE_KEY);
  if (!token) return true;

  try {
    const messaging = await getFirebaseMessaging();
    if (messaging) {
      await deleteToken(messaging);
    }

    await api.delete('/notifications/fcm-token', { data: { token } });
    localStorage.removeItem(FCM_TOKEN_STORAGE_KEY);
    console.log('🧹 [Push] Token unregistered successfully.');
    return true;
  } catch (err) {
    console.warn('⚠️ [Push] Error unregistering token:', err);
    localStorage.removeItem(FCM_TOKEN_STORAGE_KEY);
    return false;
  }
};

/**
 * Setup foreground push message listener (when web app is active & in focus).
 */
export const setupForegroundPushListener = async (
  callback: (payload: MessagePayload) => void
): Promise<(() => void) | null> => {
  const messaging = await getFirebaseMessaging();
  if (!messaging) return null;

  try {
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('📬 [Push] Foreground push message received:', payload);
      callback(payload);
    });
    return unsubscribe;
  } catch (err) {
    console.warn('⚠️ [Push] Could not attach foreground listener:', err);
    return null;
  }
};

/**
 * Send a test push notification through the backend.
 */
export const sendDirectTestPush = async (): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const res = await api.post<{ success: boolean; message: string }>('/notifications/test-push');
    return res;
  } catch (err: any) {
    return {
      success: false,
      error: err.response?.data?.error || err.message || 'Failed to dispatch test push'
    };
  }
};
