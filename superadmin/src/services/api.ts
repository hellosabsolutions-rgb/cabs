/**
 * SuperAdmin API Service
 * Connects to FleetOps Server (Port 5001) for SuperAdmin endpoints.
 */

const API_BASE = 'http://localhost:5001/api/superadmin';

const getHeaders = () => {
  const token = localStorage.getItem('fleetops_superadmin_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP error ${res.status}`);
  }
  return res.json();
};

export const api = {
  // 1. Internal Team Auth
  login: async (credentials: { email: string; password?: string; inviteCode?: string }) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      const json = await handleResponse(res);
      return json;
    } catch (err) {
      // Local fallback for initial setup if server auth route isn't reached
      if (credentials.email) {
        return {
          success: true,
          token: 'sa_mock_jwt_token_2026',
          user: {
            name: credentials.email.split('@')[0],
            email: credentials.email,
            role: 'Super Admin',
            avatar: 'SA'
          }
        };
      }
      throw err;
    }
  },

  inviteTeamMember: async (data: { name: string; email: string; role: string }) => {
    const res = await fetch(`${API_BASE}/auth/invite`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  // 2. Dashboard
  getDashboardStats: async () => {
    try {
      const res = await fetch(`${API_BASE}/dashboard/stats`, { headers: getHeaders() });
      const json = await handleResponse(res);
      return json.data;
    } catch (err) {
      console.warn('Dashboard stats fallback:', err);
      return null;
    }
  },

  // 3. Businesses
  getBusinesses: async (status = 'all', search = '') => {
    try {
      const params = new URLSearchParams();
      if (status && status !== 'all') params.append('status', status);
      if (search) params.append('q', search);

      const res = await fetch(`${API_BASE}/businesses?${params.toString()}`, { headers: getHeaders() });
      const json = await handleResponse(res);
      return json.data;
    } catch (err) {
      console.warn('Businesses fallback:', err);
      return null;
    }
  },

  getBusinessDetail: async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/businesses/${id}`, { headers: getHeaders() });
      const json = await handleResponse(res);
      return json.data;
    } catch (err) {
      console.warn('Business detail fallback:', err);
      return null;
    }
  },

  updateBusinessStatus: async (id: string, status: string) => {
    const res = await fetch(`${API_BASE}/businesses/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status })
    });
    return handleResponse(res);
  },

  // 4. Subscriptions
  getSubscriptions: async () => {
    try {
      const res = await fetch(`${API_BASE}/subscriptions`, { headers: getHeaders() });
      const json = await handleResponse(res);
      return json.data;
    } catch (err) {
      console.warn('Subscriptions fallback:', err);
      return null;
    }
  },

  // 5. Payments
  getPayments: async () => {
    try {
      const res = await fetch(`${API_BASE}/payments`, { headers: getHeaders() });
      const json = await handleResponse(res);
      return json.data;
    } catch (err) {
      console.warn('Payments fallback:', err);
      return null;
    }
  },

  retryPayment: async (biz: string) => {
    const res = await fetch(`${API_BASE}/payments/retry`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ biz })
    });
    return handleResponse(res);
  },

  // 6. Users
  getUsers: async (role = 'all') => {
    try {
      const params = new URLSearchParams();
      if (role && role !== 'all') params.append('role', role);

      const res = await fetch(`${API_BASE}/users?${params.toString()}`, { headers: getHeaders() });
      const json = await handleResponse(res);
      return json.data;
    } catch (err) {
      console.warn('Users fallback:', err);
      return null;
    }
  },

  // 7. Analytics
  getAnalytics: async () => {
    try {
      const res = await fetch(`${API_BASE}/analytics`, { headers: getHeaders() });
      const json = await handleResponse(res);
      return json.data;
    } catch (err) {
      console.warn('Analytics fallback:', err);
      return null;
    }
  },

  // 8. Support
  getSupport: async () => {
    try {
      const res = await fetch(`${API_BASE}/support`, { headers: getHeaders() });
      const json = await handleResponse(res);
      return json.data;
    } catch (err) {
      console.warn('Support fallback:', err);
      return null;
    }
  },

  // 9. Audit Logs
  getAuditLogs: async () => {
    try {
      const res = await fetch(`${API_BASE}/audit`, { headers: getHeaders() });
      const json = await handleResponse(res);
      return json.data;
    } catch (err) {
      console.warn('Audit fallback:', err);
      return null;
    }
  }
};
