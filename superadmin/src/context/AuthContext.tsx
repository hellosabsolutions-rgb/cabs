import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

interface SuperUser {
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: SuperUser | null;
  login: (credentials: { email: string; password?: string; inviteCode?: string }) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SuperUser | null>(() => {
    const saved = localStorage.getItem('fleetops_superadmin_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = localStorage.getItem('fleetops_superadmin_token');
    if (!token) {
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: { email: string; password?: string; inviteCode?: string }) => {
    const res = await api.login(credentials);
    if (res.token) {
      localStorage.setItem('fleetops_superadmin_token', res.token);
      localStorage.setItem('fleetops_superadmin_user', JSON.stringify(res.user));
      setUser(res.user);
    }
  };

  const logout = () => {
    localStorage.removeItem('fleetops_superadmin_token');
    localStorage.removeItem('fleetops_superadmin_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, login, logout, isLoading }}>
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
