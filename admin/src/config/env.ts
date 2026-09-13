/**
 * Admin ↔ API connectivity + shared public client config.
 * Dev: Vite proxy forwards /api and /socket.io to the server (see vite.config.ts).
 * Prod: set VITE_API_URL and VITE_SOCKET_URL in .env.production.
 */

const API_BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? '/api' : 'http://localhost:5000/api');

export const API_URL = API_BASE.replace(/\/$/, '');

/** Alias for older imports */
export const API_BASE_URL = API_URL;

export const LANDING_URL =
  import.meta.env.VITE_LANDING_URL?.replace(/\/$/, '') || 'https://kabpro.pro';

export const APP_URL =
  import.meta.env.VITE_APP_URL?.replace(/\/$/, '') ||
  (import.meta.env.DEV ? 'http://localhost:3000' : 'https://admin.kabpro.pro');

export function getSocketBaseUrl(): string {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL.replace(/\/$/, '');
  }
  if (import.meta.env.VITE_SOCKET_SERVER_URL) {
    return import.meta.env.VITE_SOCKET_SERVER_URL.replace(/\/$/, '');
  }
  if (import.meta.env.DEV) {
    return window.location.origin;
  }
  return 'http://localhost:5000';
}

/** Alias for older imports */
export const SOCKET_SERVER_URL = getSocketBaseUrl();

export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ||
  '546992458715-dbhmfbb7bj36h6sfm2m4l8qjisdmd491.apps.googleusercontent.com';

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

export const FIREBASE_VAPID_KEY =
  import.meta.env.VITE_FIREBASE_VAPID_KEY ||
  'BCR3trUdff3ZDhEhkZe6ka1jRxb07z2Xh31YdQuDDEzJnG78RPj3lUBRQNQ1FzI8a0FPKeepA1pGsidl5qxn0Xk';
