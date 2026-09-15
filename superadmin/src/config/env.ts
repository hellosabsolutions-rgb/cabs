/**
 * Superadmin ↔ API connectivity.
 * Dev: Vite proxy forwards /api and /socket.io to the server (see vite.config.ts).
 * Prod: set VITE_API_URL and VITE_SOCKET_URL in .env.production.
 */

const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? '/api' : 'https://api.kabpro.pro/api');

export const API_URL = API_BASE.replace(/\/$/, '');

export const APP_URL =
  import.meta.env.VITE_APP_URL?.replace(/\/$/, '') ||
  (import.meta.env.DEV ? 'http://localhost:3100' : 'https://superadmin.kabpro.pro');

export function getSocketBaseUrl(): string {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL.replace(/\/$/, '');
  }
  if (import.meta.env.DEV) {
    return window.location.origin;
  }
  if (API_URL.startsWith('http')) {
    return API_URL.replace(/\/api\/?$/, '');
  }
  return 'https://api.kabpro.pro';
}

export const SOCKET_URL = getSocketBaseUrl();
