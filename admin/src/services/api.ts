import { API_URL } from '../config/env';

/**
 * Centralized HTTP client for FleetOS API with Silent Refresh Token Rotation
 */
const BASE_URL = API_URL;

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
    throw new Error(networkError.message || 'Network connection failed.');
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
    throw new Error(result.error || `Request failed with status ${response.status}`);
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

