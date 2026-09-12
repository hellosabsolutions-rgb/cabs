import { API_BASE_URL } from '../constants/config';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  getRememberMe,
  saveTokens,
} from './authStorage';

export type DriverProfile = {
  id: string;
  code: string;
  name: string;
  email: string | null;
  mobile: string;
  licence: string;
  licenceValid: string;
  initials: string;
  agency: string;
  photo: string | null;
  onDuty: boolean;
  odometer: number;
  todayKm: number;
};

export type VehicleProfile = {
  id: string;
  reg: string;
  type: string;
  model: string;
  odometer?: number;
  fuelType?: string;
  departmentName?: string;
} | null;

export type TripProfile = {
  id: string;
  status: string;
} | null;

export type DriverAuthPayload = {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  token?: string;
  driver: DriverProfile;
  vehicle: VehicleProfile;
  trip: TripProfile;
  session?: {
    id: string;
    rememberMe: boolean;
    expiresAt?: string;
  };
  error?: string;
};

type RequestOptions = {
  method?: string;
  data?: unknown;
  auth?: boolean;
  _retry?: boolean;
};

let isRefreshing = false;
let refreshWaiters: Array<{
  resolve: (ok: boolean) => void;
  reject: (err: unknown) => void;
}> = [];

function flushRefreshWaiters(ok: boolean, error?: unknown) {
  refreshWaiters.forEach((waiter) => {
    if (ok) waiter.resolve(true);
    else waiter.reject(error ?? new Error('Session expired'));
  });
  refreshWaiters = [];
}

async function parseError(response: Response) {
  const body = await response.json().catch(() => ({} as { error?: string }));
  return body.error || `Request failed (${response.status})`;
}

function isAuthPath(path: string) {
  return (
    path.includes('/auth/driver/login') ||
    path.includes('/auth/driver/google') ||
    path.includes('/auth/refresh') ||
    path.includes('/auth/logout')
  );
}

/**
 * Exchange refresh token for a new access token.
 * Concurrent callers share one in-flight refresh.
 */
export async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return false;

  if (isRefreshing) {
    return new Promise<boolean>((resolve, reject) => {
      refreshWaiters.push({ resolve, reject });
    });
  }

  isRefreshing = true;
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const data = await response.json().catch(() => ({}));
    const accessToken = data.accessToken || data.token;
    if (!response.ok || !accessToken) {
      flushRefreshWaiters(false, new Error(data.error || 'Refresh failed'));
      return false;
    }

    const rememberMe = await getRememberMe();
    await saveTokens(accessToken, data.refreshToken || refreshToken, rememberMe);
    flushRefreshWaiters(true);
    return true;
  } catch (error) {
    flushRefreshWaiters(false, error);
    return false;
  } finally {
    isRefreshing = false;
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options.auth !== false) {
    const token = await getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method || 'GET',
      headers,
      body: options.data !== undefined ? JSON.stringify(options.data) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the server. Check that the API is running.');
  }

  if (
    response.status === 401 &&
    options.auth !== false &&
    !options._retry &&
    !isAuthPath(path)
  ) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiRequest<T>(path, { ...options, _retry: true });
    }
    await clearTokens();
    throw new Error(await parseError(response));
  }

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || `Request failed (${response.status})`);
  }
  return result as T;
}

/** Restore an existing session via access token, or refresh then /me. */
export async function restoreDriverSession(): Promise<DriverAuthPayload | null> {
  const accessToken = await getAccessToken();
  const refreshToken = await getRefreshToken();
  if (!accessToken && !refreshToken) return null;

  if (!accessToken && refreshToken) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      await clearTokens();
      return null;
    }
  }

  try {
    return await apiRequest<DriverAuthPayload>('/auth/driver/me');
  } catch {
    // apiRequest already cleared tokens when silent refresh failed.
    await clearTokens();
    return null;
  }
}

export const driverAuthApi = {
  login: (identifier: string, password: string, rememberMe = true) =>
    apiRequest<DriverAuthPayload>('/auth/driver/login', {
      method: 'POST',
      auth: false,
      data: { identifier, password, rememberMe },
    }),

  google: (
    tokens: { idToken?: string | null; accessToken?: string | null },
    rememberMe = true
  ) =>
    apiRequest<DriverAuthPayload>('/auth/driver/google', {
      method: 'POST',
      auth: false,
      data: { ...tokens, rememberMe },
    }),

  me: () => apiRequest<DriverAuthPayload>('/auth/driver/me'),

  logout: async () => {
    const refreshToken = await getRefreshToken();
    try {
      await apiRequest('/auth/logout', {
        method: 'POST',
        data: { refreshToken },
        auth: false,
      });
    } catch {
      // Local sign-out still proceeds.
    }
  },
};

export type SosPayload = {
  driverId?: string;
  driverName?: string;
  driverMobile?: string;
  vehicleReg?: string;
  tripId?: string;
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
  address?: string | null;
  timestamp?: string;
};

export const sosApi = {
  sendSos: (data: SosPayload) =>
    apiRequest<{ success: boolean; message: string; sosId?: string; mapsLink?: string }>('/sos', {
      method: 'POST',
      data,
    }),
};

export const dutyApi = {
  getServerTime: () =>
    apiRequest<{
      success: boolean;
      timestamp: number;
      iso: string;
      timezone: string;
      ist: string;
    }>('/server-time', { auth: false }),

  detectOdometer: (data: { image: string; currentOdo?: number }) =>
    apiRequest<{
      success: boolean;
      detected: boolean;
      odometer: number | null;
      confidence?: number;
      allNumbers?: number[];
      rawText?: string;
    }>('/auth/driver/duty/detect-odometer', {
      method: 'POST',
      data,
    }),

  startDuty: (data: { startOdometer: number; photoUrl?: string; location?: string }) =>
    apiRequest<{
      success: boolean;
      message: string;
      startedAt: string;
      timestamp: number;
      vehicle: {
        id: string;
        reg: string;
        type: string;
        model: string;
        odometer: number;
      };
    }>('/auth/driver/duty/start', {
      method: 'POST',
      data,
    }),

  endDuty: (data: { endOdometer: number; remarks?: string; photoUrl?: string; location?: string }) =>
    apiRequest<{
      success: boolean;
      message: string;
      endedAt: string;
      timestamp: number;
      endOdometer: number;
      kmRun: number;
      remarks?: string;
      vehicle?: {
        id: string;
        reg: string;
        odometer: number;
      } | null;
    }>('/auth/driver/duty/end', {
      method: 'POST',
      data,
    }),
};

export type FuelLogPayload = {
  vehicle: string;
  driverName: string;
  date: string;
  time: string;
  odometer: number;
  fuelType: string;
  litres: number;
  ratePerLitre: number;
  totalCost: number;
  stationName?: string;
  location?: string;
  receiptPhoto?: string;
  meterPhoto?: string;
  coordinates?: { latitude: number | null; longitude: number | null };
};

export const fuelApi = {
  create: (data: FuelLogPayload) =>
    apiRequest<{ success: boolean; data?: any }>('/fuel-logs', {
      method: 'POST',
      data,
    }),
};

export type BookingStatus = 'Scheduled' | 'Ongoing' | 'Completed' | 'Cancelled';

export type UpdateBookingStatusPayload = {
  status: BookingStatus;
  startOdometer?: number;
  endOdometer?: number;
  notes?: string;
};

export const bookingApi = {
  getMyBookings: (params?: { status?: string }) => {
    const q = params?.status && params.status !== 'All' ? `?status=${encodeURIComponent(params.status)}` : '';
    return apiRequest<{
      success: boolean;
      count: number;
      data: any[];
    }>(`/bookings/my${q}`, {
      method: 'GET',
    });
  },

  getBookingById: (id: string) =>
    apiRequest<{
      success: boolean;
      data: any;
    }>(`/bookings/${id}`, {
      method: 'GET',
    }),

  updateStatus: (id: string, data: UpdateBookingStatusPayload) =>
    apiRequest<{
      success: boolean;
      message: string;
      data: any;
    }>(`/bookings/${id}/status`, {
      method: 'PATCH',
      data,
    }),

  assignDriver: (id: string, data: { driverName: string; vehicle?: string }) =>
    apiRequest<{
      success: boolean;
      message: string;
      data: any;
    }>(`/bookings/${id}/assign`, {
      method: 'PATCH',
      data,
    }),

  unassignDriver: (id: string) =>
    apiRequest<{
      success: boolean;
      message: string;
      data: any;
    }>(`/bookings/${id}/assign`, {
      method: 'PATCH',
      data: { driverName: 'Unassigned' },
    }),
};


