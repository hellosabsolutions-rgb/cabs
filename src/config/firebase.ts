import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getMessaging, Messaging, isSupported } from 'firebase/messaging';

export const firebaseConfig = {
  apiKey: "AIzaSyBVuaUye79dCwCzqUqZ1H81D0geIN63MKc",
  authDomain: "opsiva-e1ee5.firebaseapp.com",
  projectId: "opsiva-e1ee5",
  storageBucket: "opsiva-e1ee5.firebasestorage.app",
  messagingSenderId: "546992458715",
  appId: "1:546992458715:web:0ad1761fb9a439236ff5fe",
  measurementId: "G-WYW0TG0FY9"
};

export const VAPID_KEY = "BCR3trUdff3ZDhEhkZe6ka1jRxb07z2Xh31YdQuDDEzJnG78RPj3lUBRQNQ1FzI8a0FPKeepA1pGsidl5qxn0Xk";

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
