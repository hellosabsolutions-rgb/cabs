import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../services/api';
import { disconnectSuperadminSocket } from '../services/socket';
import type { SuperadminUser } from '../types';

interface AuthContextValue {
  user: SuperadminUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const SESSION_KEY = 'kabpro_superadmin_session';
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readSession(): { user: SuperadminUser; token: string } | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.user?.email && parsed?.token) return parsed;
  } catch {
    // ignore
  }
  return null;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initial = readSession();
  const [user, setUser] = useState<SuperadminUser | null>(initial?.user ?? null);
  const [token, setToken] = useState<string | null>(initial?.token ?? null);

  const clearLocalSession = useCallback(() => {
    setUser(null);
    setToken(null);
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
  }, []);

  const logout = useCallback(() => {
    clearLocalSession();
  }, [clearLocalSession]);

  // Auto-logout when API reports invalid token / 401 / 403
  useEffect(() => {
    const onUnauthorized = () => {
      clearLocalSession();
    };
    window.addEventListener('kabpro-superadmin:unauthorized', onUnauthorized);
    return () => window.removeEventListener('kabpro-superadmin:unauthorized', onUnauthorized);
  }, [clearLocalSession]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const data = await apiFetch<{
        success: boolean;
        accessToken?: string;
        token?: string;
        user: SuperadminUser;
        error?: string;
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          rememberMe: false,
        }),
      });

      const nextToken = data.accessToken || data.token;
      if (!nextToken || !data.user) {
        return { success: false, error: 'Login succeeded but no token was returned.' };
      }

      setUser(data.user);
      setToken(nextToken);
      try {
        sessionStorage.setItem(
          SESSION_KEY,
          JSON.stringify({ user: data.user, token: nextToken })
        );
      } catch {
        // ignore
      }
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network error';
      return { success: false, error: message };
    }
  }, []);

  const value = useMemo(
    () => ({ user, token, login, logout }),
    [user, token, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
