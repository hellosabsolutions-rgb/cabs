/**
 * Centralized HTTP client for FleetOS API with Silent Refresh Token Rotation
 */
import { API_BASE_URL } from '../config/env';

const BASE_URL = API_BASE_URL;

interface RequestOptions extends RequestInit {
  data?: any;
  _retry?: boolean;
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

function processQueue(error: any, token: string | null = null) {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

export async function apiRequest<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  let token = localStorage.getItem('fleetos_auth_token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const config: RequestInit = {
    ...options,
    headers,
    ...(options.data ? { body: JSON.stringify(options.data) } : {})
  };

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${endpoint}`, config);
  } catch (networkError: any) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new Error('You are currently offline. Please check your internet connection.');
    }
    throw new Error(
      networkError.message?.includes('Failed to fetch')
        ? `Cannot connect to FleetOS server (${BASE_URL.replace(/\/api\/?$/, '')}). Please ensure backend is running.`
        : networkError.message || 'Network connection error.'
    );
  }

  // Handle 401 Unauthorized with Refresh Token rotation
  const isAuthAuthRoute =
    endpoint.includes('/auth/login') ||
    endpoint.includes('/auth/register') ||
    endpoint.includes('/auth/refresh');

  if (response.status === 401 && !isAuthAuthRoute && !options._retry) {
    const refreshToken = localStorage.getItem('fleetos_refresh_token');

    if (!refreshToken) {
      // No refresh token available, clear session
      localStorage.removeItem('fleetos_auth_token');
      localStorage.removeItem('fleetos_refresh_token');
      localStorage.removeItem('fleetos_auth_user');
      window.dispatchEvent(new CustomEvent('fleetos:unauthorized'));
      const errResult = await response.json().catch(() => ({}));
      throw new Error(errResult.error || 'Session expired. Please log in again.');
    }

    if (isRefreshing) {
      // Refresh already in-flight: wait for resolution and retry with new token
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(newToken => {
        return apiRequest<T>(endpoint, {
          ...options,
          _retry: true,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${newToken}`
          }
        });
      });
    }

    options._retry = true;
    isRefreshing = true;

    try {
      const refreshResponse = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      const refreshData = await refreshResponse.json();

      if (!refreshResponse.ok || !refreshData.success || !refreshData.accessToken) {
        throw new Error(refreshData.error || 'Refresh token expired');
      }

      const newAccessToken = refreshData.accessToken;
      localStorage.setItem('fleetos_auth_token', newAccessToken);

      if (refreshData.refreshToken) {
        localStorage.setItem('fleetos_refresh_token', refreshData.refreshToken);
      }

      processQueue(null, newAccessToken);
      isRefreshing = false;

      // Retry original request with newly issued access token
      return apiRequest<T>(endpoint, {
        ...options,
        _retry: true,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${newAccessToken}`
        }
      });
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      isRefreshing = false;
      localStorage.removeItem('fleetos_auth_token');
      localStorage.removeItem('fleetos_refresh_token');
      localStorage.removeItem('fleetos_auth_user');
      window.dispatchEvent(new CustomEvent('fleetos:unauthorized'));
      throw new Error('Your session has expired. Please sign in again.');
    }
  }

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    let errorMsg = result.error || result.message;
    if (!errorMsg) {
      if (response.status === 400) errorMsg = 'Invalid request data submitted.';
      else if (response.status === 403) errorMsg = 'Permission denied for this operation.';
      else if (response.status === 404) errorMsg = 'Requested resource was not found.';
      else if (response.status === 409) errorMsg = 'Conflict: Record with identical information already exists.';
      else if (response.status === 413) errorMsg = 'File size is too large (max 10MB allowed).';
      else if (response.status === 429) errorMsg = 'Too many requests. Please wait a moment and try again.';
      else if (response.status === 503) errorMsg = 'Fleet service or database is temporarily unavailable.';
      else errorMsg = `Server error (${response.status}). Please try again.`;
    }
    throw new Error(errorMsg);
  }

  return result as T;
}

export const api = {
  get: <T = any>(endpoint: string, options?: RequestOptions) => 
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(endpoint: string, data?: any, options?: RequestOptions) => 
    apiRequest<T>(endpoint, { ...options, method: 'POST', data }),

  put: <T = any>(endpoint: string, data?: any, options?: RequestOptions) => 
    apiRequest<T>(endpoint, { ...options, method: 'PUT', data }),

  patch: <T = any>(endpoint: string, data?: any, options?: RequestOptions) => 
    apiRequest<T>(endpoint, { ...options, method: 'PATCH', data }),

  delete: <T = any>(endpoint: string, options?: RequestOptions) => 
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' })
};

export const driverAssignmentsApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return api.get<{ success: boolean; data: any[]; total: number }>(`/driver-assignments${qs ? `?${qs}` : ''}`);
  },
  getActive: () => api.get<{ success: boolean; data: any[]; count: number }>('/driver-assignments/active'),
  getDriverHistory: (driverId: string) => api.get<{ success: boolean; data: any[]; count: number }>(`/driver-assignments/driver/${driverId}`),
  getVehicleHistory: (registration: string) => api.get<{ success: boolean; data: any[]; count: number }>(`/driver-assignments/vehicle/${encodeURIComponent(registration)}`),
  assign: (data: { driverId: string; vehicleRegistration: string; reason?: string; odometerAtAssignment?: number; notes?: string }) =>
    api.post<{ success: boolean; data: any }>('/driver-assignments', data),
  endAssignment: (id: string, data?: { reason?: string; odometer?: number; notes?: string }) =>
    api.post<{ success: boolean; data: any }>(`/driver-assignments/${id}/end`, data || {})
};

export interface ActivityItem {
  id: string;
  _id?: string;
  agencyId?: string;
  agencyName?: string;
  actorId?: string;
  actorName: string;
  actorEmail?: string;
  actorRole: string;
  actorAvatar?: string | null;
  actorType: 'user' | 'driver' | 'system';
  action: string;
  category: 'trips' | 'duty' | 'vehicles' | 'attendance' | 'expenses' | 'payroll' | 'auth' | 'system';
  description: string;
  targetEntity?: string;
  targetId?: string;
  meta?: any;
  createdAt: string;
}

export interface UserActivityStats {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string | null;
  actorType: 'user' | 'driver';
  role: string;
  status: string;
  agencyName?: string;
  assignedVehicle?: string;
  totalActivities: number;
  todayActivitiesCount: number;
  lastLoginAt?: string | null;
  lastActivity?: {
    action: string;
    description: string;
    category: string;
    timestamp: string;
    timeAgo: string;
  };
}

export const activitiesApi = {
  getAll: (params?: {
    search?: string;
    userId?: string;
    userName?: string;
    actorType?: string;
    category?: string;
    agencyId?: string;
    page?: number;
    limit?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.userId) qs.set('userId', params.userId);
    if (params?.userName) qs.set('userName', params.userName);
    if (params?.actorType) qs.set('actorType', params.actorType);
    if (params?.category) qs.set('category', params.category);
    if (params?.agencyId) qs.set('agencyId', params.agencyId);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    const query = qs.toString();
    return api.get<{
      success: boolean;
      data: ActivityItem[];
      total: number;
      page: number;
      pages: number;
    }>(`/activities${query ? `?${query}` : ''}`);
  },
  getUserStats: (agencyId?: string) => {
    return api.get<{
      success: boolean;
      data: UserActivityStats[];
      total: number;
    }>(`/activities/users-stats${agencyId ? `?agencyId=${agencyId}` : ''}`);
  },
  create: (data: Partial<ActivityItem>) => {
    return api.post<{ success: boolean; data: ActivityItem }>('/activities', data);
  }
};

