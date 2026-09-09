import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getMessaging, Messaging, isSupported } from 'firebase/messaging';

/**
 * Firebase web config — public client keys (safe in frontend builds).
 * Override via VITE_FIREBASE_* in admin/.env.* when rotating projects.
 */
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBVuaUye79dCwCzqUqZ1H81D0geIN63MKc',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'opsiva-e1ee5.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'opsiva-e1ee5',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'opsiva-e1ee5.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '546992458715',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:546992458715:web:0ad1761fb9a439236ff5fe',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-WYW0TG0FY9'
};

export const VAPID_KEY =
  import.meta.env.VITE_FIREBASE_VAPID_KEY ||
  'BCR3trUdff3ZDhEhkZe6ka1jRxb07z2Xh31YdQuDDEzJnG78RPj3lUBRQNQ1FzI8a0FPKeepA1pGsidl5qxn0Xk';

export const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

let messagingInstance: Messaging | null = null;

export const getFirebaseMessaging = async (): Promise<Messaging | null> => {
  if (typeof window === 'undefined') return null;

  try {
    const supported = await isSupported();
    if (!supported) {
      console.warn('⚠️ [Firebase] Messaging is not supported in this browser environment.');
      return null;
    }

    if (!messagingInstance) {
      messagingInstance = getMessaging(app);
    }
    return messagingInstance;
  } catch (err) {
    console.warn('⚠️ [Firebase] Error checking messaging support:', err);
    return null;
  }
};
