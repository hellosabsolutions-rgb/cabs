import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getMessaging, Messaging, isSupported } from 'firebase/messaging';
import { FIREBASE_VAPID_KEY, firebaseConfig } from './env';

export { firebaseConfig };
export const VAPID_KEY = FIREBASE_VAPID_KEY;

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
