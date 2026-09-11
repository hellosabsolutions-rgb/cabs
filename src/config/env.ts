/**
 * Typed access to Vite frontend env vars (`VITE_*` from `.env`).
 */
const required = (value: string | undefined, name: string, fallback?: string) => {
  const resolved = value?.trim() || fallback;
  if (!resolved) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return resolved;
};

export const API_BASE_URL = required(
  import.meta.env.VITE_API_BASE_URL,
  'VITE_API_BASE_URL',
  'http://localhost:5001/api'
);

export const SOCKET_SERVER_URL = required(
  import.meta.env.VITE_SOCKET_SERVER_URL,
  'VITE_SOCKET_SERVER_URL',
  'http://localhost:5001'
);

export const GOOGLE_CLIENT_ID = required(
  import.meta.env.VITE_GOOGLE_CLIENT_ID,
  'VITE_GOOGLE_CLIENT_ID'
);

export const firebaseConfig = {
  apiKey: required(import.meta.env.VITE_FIREBASE_API_KEY, 'VITE_FIREBASE_API_KEY'),
  authDomain: required(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, 'VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: required(import.meta.env.VITE_FIREBASE_PROJECT_ID, 'VITE_FIREBASE_PROJECT_ID'),
  storageBucket: required(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, 'VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: required(
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    'VITE_FIREBASE_MESSAGING_SENDER_ID'
  ),
  appId: required(import.meta.env.VITE_FIREBASE_APP_ID, 'VITE_FIREBASE_APP_ID'),
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID?.trim() || undefined,
};

export const FIREBASE_VAPID_KEY = required(
  import.meta.env.VITE_FIREBASE_VAPID_KEY,
  'VITE_FIREBASE_VAPID_KEY'
);
