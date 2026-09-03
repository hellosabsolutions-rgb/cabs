/**
 * Centralized HTTP client for FleetOS API
 */
const BASE_URL = 'http://localhost:5000/api';

interface RequestOptions extends RequestInit {
  data?: any;
}

export async function apiRequest<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const token = localStorage.getItem('fleetos_auth_token');

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

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  // Handle unauthorized / token expired
  if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
    localStorage.removeItem('fleetos_auth_token');
    localStorage.removeItem('fleetos_auth_user');
    window.location.reload();
  }

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || `Request failed with status ${response.status}`);
  }

  return result;
}

export const api = {
  get: <T = any>(endpoint: string, options?: RequestOptions) => 
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(endpoint: string, data?: any, options?: RequestOptions) => 
    apiRequest<T>(endpoint, { ...options, method: 'POST', data }),

  put: <T = any>(endpoint: string, data?: any, options?: RequestOptions) => 
    apiRequest<T>(endpoint, { ...options, method: 'PUT', data }),

  delete: <T = any>(endpoint: string, options?: RequestOptions) => 
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' })
};
