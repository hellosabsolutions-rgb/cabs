/**
 * SuperAdmin API Service
 * Handles data fetching and mutation for the FleetOps SuperAdmin Console.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP error ${res.status}`);
  }
  return res.json();
};

export const superAdminApi = {
  // 1. Dashboard
  getDashboardStats: async () => {
    try {
      const res = await fetch(`${API_BASE}/superadmin/dashboard/stats`);
      const json = await handleResponse(res);
      return json.data;
    } catch (err) {
      console.warn('SuperAdmin API offline, using fallback:', err);
      return null;
    }
  },

  // 2. Businesses
  getBusinesses: async (status = 'all', search = '') => {
    try {
      const params = new URLSearchParams();
      if (status && status !== 'all') params.append('status', status);
      if (search) params.append('q', search);

      const res = await fetch(`${API_BASE}/superadmin/businesses?${params.toString()}`);
      const json = await handleResponse(res);
      return json.data;
    } catch (err) {
      console.warn('Businesses API offline, using fallback:', err);
      return null;
    }
  },

  getBusinessDetail: async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/superadmin/businesses/${id}`);
      const json = await handleResponse(res);
      return json.data;
    } catch (err) {
      console.warn('Business Detail API offline:', err);
      return null;
    }
  },

  updateBusinessStatus: async (id: string, status: string) => {
    const res = await fetch(`${API_BASE}/superadmin/businesses/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return handleResponse(res);
  },

  // 3. Subscriptions
  getSubscriptions: async () => {
    try {
      const res = await fetch(`${API_BASE}/superadmin/subscriptions`);
      const json = await handleResponse(res);
      return json.data;
    } catch (err) {
      console.warn('Subscriptions API offline:', err);
      return null;
    }
  },

  // 4. Payments
  getPayments: async () => {
    try {
      const res = await fetch(`${API_BASE}/superadmin/payments`);
      const json = await handleResponse(res);
      return json.data;
    } catch (err) {
      console.warn('Payments API offline:', err);
      return null;
    }
  },

  retryPayment: async (biz: string) => {
    const res = await fetch(`${API_BASE}/superadmin/payments/retry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ biz })
    });
    return handleResponse(res);
  },

  // 5. Users
  getUsers: async (role = 'all') => {
    try {
      const params = new URLSearchParams();
      if (role && role !== 'all') params.append('role', role);

      const res = await fetch(`${API_BASE}/superadmin/users?${params.toString()}`);
      const json = await handleResponse(res);
      return json.data;
    } catch (err) {
      console.warn('Users API offline:', err);
      return null;
    }
  },

  // 6. Analytics
  getAnalytics: async () => {
    try {
      const res = await fetch(`${API_BASE}/superadmin/analytics`);
      const json = await handleResponse(res);
      return json.data;
    } catch (err) {
      console.warn('Analytics API offline:', err);
      return null;
    }
  },

  // 7. Support
  getSupport: async () => {
    try {
      const res = await fetch(`${API_BASE}/superadmin/support`);
      const json = await handleResponse(res);
      return json.data;
    } catch (err) {
      console.warn('Support API offline:', err);
      return null;
    }
  },

  // 8. Audit Logs
  getAuditLogs: async () => {
    try {
      const res = await fetch(`${API_BASE}/superadmin/audit`);
      const json = await handleResponse(res);
      return json.data;
    } catch (err) {
      console.warn('Audit API offline:', err);
      return null;
    }
  }
};
