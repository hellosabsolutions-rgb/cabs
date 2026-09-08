/**
 * Admin ↔ API connectivity.
 * Dev: Vite proxy forwards /api and /socket.io to the server (see vite.config.ts).
 * Prod: set VITE_API_URL and VITE_SOCKET_URL in .env.production.
 */
const API_BASE = import.meta.env.VITE_API_URL
  ?? (import.meta.env.DEV ? '/api' : 'http://localhost:5000/api');

export const API_URL = API_BASE.replace(/\/$/, '');

export const LANDING_URL =
  import.meta.env.VITE_LANDING_URL?.replace(/\/$/, '') ||
  'https://kabpro.opsiva.in';

export const APP_URL =
  import.meta.env.VITE_APP_URL?.replace(/\/$/, '') ||
  (import.meta.env.DEV ? 'http://localhost:3000' : 'https://admin-kabpro.opsiva.in');

export function getSocketBaseUrl(): string {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL.replace(/\/$/, '');
  }
  if (import.meta.env.DEV) {
    return window.location.origin;
  }
  return 'http://localhost:5000';
}
