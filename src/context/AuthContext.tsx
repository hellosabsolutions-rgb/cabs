import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'operator';
  phone?: string;
  avatar?: string | null;
}

export interface DeviceSession {
  id: string;
  deviceLabel: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser: string;
  os: string;
  ip: string;
  rememberMe: boolean;
  lastActive: string;
  createdAt: string;
  isCurrent: boolean;
}

export interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isDashboardOpening: boolean;
  triggerDashboardOpening: (durationMs?: number) => void;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string; hasPendingInvite?: boolean; inviteCode?: string }>;
  register: (name: string, email: string, password: string, phone?: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  acceptStaffInvite: (data: { email: string; inviteCode: string; password: string; name?: string; phone?: string; rememberMe?: boolean }) => Promise<{ success: boolean; error?: string; message?: string }>;
  googleLogin: (credentialOrData: string | { credential?: string; accessToken?: string }, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  sessions: DeviceSession[];
  isLoadingSessions: boolean;
  fetchSessions: () => Promise<void>;
  revokeSession: (id: string) => Promise<boolean>;
  revokeAllOtherSessions: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('fleetos_auth_token'));
  const [refreshToken, setRefreshToken] = useState<string | null>(() => localStorage.getItem('fleetos_refresh_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDashboardOpening, setIsDashboardOpening] = useState<boolean>(false);
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState<boolean>(false);

  // Initialize and verify session on load
  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = localStorage.getItem('fleetos_auth_token');
      const storedRefreshToken = localStorage.getItem('fleetos_refresh_token');

      if (!storedToken && !storedRefreshToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        if (response.success && response.user) {
          setUser(response.user);
          setToken(localStorage.getItem('fleetos_auth_token'));
          setRefreshToken(localStorage.getItem('fleetos_refresh_token'));
        } else {
          localStorage.removeItem('fleetos_auth_token');
          localStorage.removeItem('fleetos_refresh_token');
          setToken(null);
          setRefreshToken(null);
          setUser(null);
        }
      } catch (err) {
        console.warn('Session verification failed, attempting refresh or sign-in.');
        // If apiRequest auto-refreshed successfully, storedToken might now be updated
        const freshToken = localStorage.getItem('fleetos_auth_token');
        if (freshToken && freshToken !== storedToken) {
          setToken(freshToken);
        } else {
          localStorage.removeItem('fleetos_auth_token');
          localStorage.removeItem('fleetos_refresh_token');
          setToken(null);
          setRefreshToken(null);
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();

    // Global unauthorized event listener (from silent refresh rejection)
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
      setRefreshToken(null);
      setSessions([]);
    };

    window.addEventListener('fleetos:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('fleetos:unauthorized', handleUnauthorized);
    };
  }, []);

  const triggerDashboardOpening = (durationMs = 2800) => {
    setIsDashboardOpening(true);
    setTimeout(() => {
      setIsDashboardOpening(false);
    }, durationMs);
  };

  const login = async (email: string, password: string, rememberMe = false) => {
    try {
      const response = await api.post('/auth/login', { email, password, rememberMe });
      if (response.success && (response.token || response.accessToken)) {
        const activeToken = response.accessToken || response.token;
        localStorage.setItem('fleetos_auth_token', activeToken);
        setToken(activeToken);

        if (response.refreshToken) {
          localStorage.setItem('fleetos_refresh_token', response.refreshToken);
          setRefreshToken(response.refreshToken);
        }

        setUser(response.user);
        setIsDashboardOpening(true);
        setTimeout(() => {
          setIsDashboardOpening(false);
        }, 2800);
        return { success: true };
      }
      return {
        success: false,
        error: response.error || 'Login failed',
        hasPendingInvite: response.hasPendingInvite,
        inviteCode: response.inviteCode
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed. Please check credentials.' };
    }
  };

  const acceptStaffInvite = async (data: {
    email: string;
    inviteCode: string;
    password: string;
    name?: string;
    phone?: string;
    rememberMe?: boolean;
  }) => {
    try {
      const response = await api.post('/auth/accept-invite', data);
      if (response.success && (response.token || response.accessToken)) {
        const activeToken = response.accessToken || response.token;
        localStorage.setItem('fleetos_auth_token', activeToken);
        setToken(activeToken);

        if (response.refreshToken) {
          localStorage.setItem('fleetos_refresh_token', response.refreshToken);
          setRefreshToken(response.refreshToken);
        }

        setUser(response.user);
        setIsDashboardOpening(true);
        setTimeout(() => {
          setIsDashboardOpening(false);
        }, 2800);
        return { success: true, message: response.message };
      }
      return { success: false, error: response.error || 'Failed to activate staff account.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Invitation activation failed. Please check your code.' };
    }
  };

  const register = async (name: string, email: string, password: string, phone?: string, rememberMe = false) => {
    try {
      const response = await api.post('/auth/register', { name, email, password, phone, role: 'admin', rememberMe });
      if (response.success && (response.token || response.accessToken)) {
        const activeToken = response.accessToken || response.token;
        localStorage.setItem('fleetos_auth_token', activeToken);
        setToken(activeToken);

        if (response.refreshToken) {
          localStorage.setItem('fleetos_refresh_token', response.refreshToken);
          setRefreshToken(response.refreshToken);
        }

        setUser(response.user);
        setIsDashboardOpening(true);
        setTimeout(() => {
          setIsDashboardOpening(false);
        }, 2800);
        return { success: true };
      }
      return { success: false, error: response.error || 'Registration failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed.' };
    }
  };

  const googleLogin = async (data: string | { credential?: string; accessToken?: string }, rememberMe = true) => {
    try {
      const payload = typeof data === 'string' ? { credential: data, rememberMe } : { ...data, rememberMe };
      const response = await api.post('/auth/google', payload);
      if (response.success && (response.token || response.accessToken)) {
        const activeToken = response.accessToken || response.token;
        localStorage.setItem('fleetos_auth_token', activeToken);
        setToken(activeToken);

        if (response.refreshToken) {
          localStorage.setItem('fleetos_refresh_token', response.refreshToken);
          setRefreshToken(response.refreshToken);
        }

        setUser(response.user);
        setIsDashboardOpening(true);
        setTimeout(() => {
          setIsDashboardOpening(false);
        }, 2800);
        return { success: true };
      }
      return { success: false, error: response.error || 'Google sign-in failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Google sign-in failed. Please try again.' };
    }
  };

  const logout = async () => {
    const currentRefreshToken = localStorage.getItem('fleetos_refresh_token');
    try {
      if (currentRefreshToken) {
        await api.post('/auth/logout', { refreshToken: currentRefreshToken });
      }
    } catch (err) {
      console.warn('Logout notification error:', err);
    } finally {
      localStorage.removeItem('fleetos_auth_token');
      localStorage.removeItem('fleetos_refresh_token');
      localStorage.removeItem('fleetos_auth_user');
      setIsDashboardOpening(false);
      setToken(null);
      setRefreshToken(null);
      setUser(null);
      setSessions([]);
    }
  };

  const fetchSessions = useCallback(async () => {
    if (!localStorage.getItem('fleetos_auth_token')) return;
    setIsLoadingSessions(true);
    try {
      const res = await api.get('/auth/sessions');
      if (res.success && Array.isArray(res.sessions)) {
        setSessions(res.sessions);
      }
    } catch (err) {
      console.warn('Failed to load active sessions:', err);
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  const revokeSession = async (id: string): Promise<boolean> => {
    try {
      const res = await api.delete(`/auth/sessions/${id}`);
      if (res.success) {
        await fetchSessions();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to revoke session:', err);
      return false;
    }
  };

  const revokeAllOtherSessions = async (): Promise<boolean> => {
    try {
      const res = await api.delete('/auth/sessions');
      if (res.success) {
        await fetchSessions();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to revoke all other sessions:', err);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        refreshToken,
        isAuthenticated: Boolean(user && token),
        isLoading,
        isDashboardOpening,
        triggerDashboardOpening,
        login,
        register,
        acceptStaffInvite,
        googleLogin,
        logout,
        sessions,
        isLoadingSessions,
        fetchSessions,
        revokeSession,
        revokeAllOtherSessions
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

