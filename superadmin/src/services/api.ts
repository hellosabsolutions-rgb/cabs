import { API_URL } from '../config/env';
import { disconnectSuperadminSocket } from './socket';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

const SESSION_KEY = 'kabpro_superadmin_session';

/** Clear session storage + notify AuthProvider to logout */
export function clearSuperadminSession(reason = 'unauthorized') {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
  try {
    disconnectSuperadminSocket();
  } catch {
    // ignore
  }
  window.dispatchEvent(
    new CustomEvent('kabpro-superadmin:unauthorized', { detail: { reason } })
  );
}

function shouldForceLogout(status: number, path: string) {
  if (path.includes('/auth/login')) return false;
  return status === 401 || status === 403;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<T> {
  const { token, headers, ...rest } = options;
  const res = await fetch(`${API_URL}/superadmin${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  // Non-JSON (exports) callers should use apiFetchBlob
  const data = await res.json().catch(() => ({}));

  if (shouldForceLogout(res.status, path)) {
    clearSuperadminSession(res.status === 403 ? 'forbidden' : 'unauthorized');
    throw new ApiError(
      data?.error || 'Session expired. Please sign in again.',
      res.status
    );
  }

  if (!res.ok || data?.success === false) {
    throw new ApiError(data?.error || `Request failed (${res.status})`, res.status);
  }
  return data as T;
}

/** Binary downloads (xlsx/pdf/doc) with the same auth logout behavior */
export async function apiFetchBlob(
  path: string,
  token?: string | null
): Promise<{ blob: Blob; filename: string }> {
  const res = await fetch(`${API_URL}/superadmin${path}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (shouldForceLogout(res.status, path)) {
    clearSuperadminSession(res.status === 403 ? 'forbidden' : 'unauthorized');
    throw new ApiError('Session expired. Please sign in again.', res.status);
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data?.error || `Export failed (${res.status})`, res.status);
  }

  const blob = await res.blob();
  const cd = res.headers.get('Content-Disposition') || '';
  const match = /filename="([^"]+)"/.exec(cd);
  return { blob, filename: match?.[1] || 'download.bin' };
}
