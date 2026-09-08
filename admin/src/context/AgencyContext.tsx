import React, { createContext, useContext, useState, useEffect } from 'react';
import { Agency } from '../types/fleet';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

export interface CreateAgencyDto {
  name: string;
  businessType?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  gstin?: string;
  pan?: string;
  logo?: string | null;
}

export interface AgencyContextType {
  agencies: Agency[];
  currentAgency: Agency | null;
  isLoading: boolean;
  createAgency: (data: CreateAgencyDto) => Promise<{ success: boolean; agency?: Agency; error?: string }>;
  updateAgency: (id: string, data: Partial<CreateAgencyDto>) => Promise<{ success: boolean; agency?: Agency; error?: string }>;
  switchAgency: (agencyId: string) => Promise<{ success: boolean; error?: string }>;
  refreshAgencies: () => Promise<void>;
}

const AgencyContext = createContext<AgencyContextType | undefined>(undefined);

export const AgencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [currentAgency, setCurrentAgency] = useState<Agency | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchAgencies = async () => {
    if (!isAuthenticated) {
      setAgencies([]);
      setCurrentAgency(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.get('/agencies');
      if (res.success) {
        const agencyList: Agency[] = res.agencies || [];
        setAgencies(agencyList);
        // If currentAgency returned from backend, set it, else default to first agency
        const active = res.currentAgency || agencyList[0] || null;
        setCurrentAgency(active);
      }
    } catch (err) {
      console.warn('Could not load user agencies from backend', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgencies();
  }, [isAuthenticated, user?.id]);

  const createAgency = async (data: CreateAgencyDto) => {
    try {
      const res = await api.post('/agencies', data);
      if (res.success && res.agency) {
        const newAgency: Agency = res.agency;
        setAgencies(prev => [newAgency, ...prev]);
        setCurrentAgency(newAgency);
        return { success: true, agency: newAgency };
      }
      return { success: false, error: res.error || 'Failed to create agency' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error creating agency' };
    }
  };

  const updateAgency = async (id: string, data: Partial<CreateAgencyDto>) => {
    try {
      const res = await api.put(`/agencies/${id}`, data);
      if (res.success && res.agency) {
        const updated: Agency = res.agency;
        setAgencies(prev => prev.map(a => (a.id === id || a._id === id ? updated : a)));
        if (currentAgency && (currentAgency.id === id || currentAgency._id === id)) {
          setCurrentAgency(updated);
        }
        return { success: true, agency: updated };
      }
      return { success: false, error: res.error || 'Failed to update agency' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error updating agency' };
    }
  };

  const switchAgency = async (agencyId: string) => {
    try {
      const res = await api.post(`/agencies/switch/${agencyId}`);
      if (res.success && res.currentAgency) {
        setCurrentAgency(res.currentAgency);
        return { success: true };
      }
      // Local fallback if offline
      const found = agencies.find(a => a.id === agencyId || a._id === agencyId);
      if (found) {
        setCurrentAgency(found);
        return { success: true };
      }
      return { success: false, error: res.error || 'Could not switch agency' };
    } catch (err: any) {
      // Local fallback
      const found = agencies.find(a => a.id === agencyId || a._id === agencyId);
      if (found) {
        setCurrentAgency(found);
        return { success: true };
      }
      return { success: false, error: err.message || 'Error switching agency' };
    }
  };

  const refreshAgencies = async () => {
    await fetchAgencies();
  };

  return (
    <AgencyContext.Provider
      value={{
        agencies,
        currentAgency,
        isLoading,
        createAgency,
        updateAgency,
        switchAgency,
        refreshAgencies
      }}
    >
      {children}
    </AgencyContext.Provider>
  );
};

export const useAgency = () => {
  const context = useContext(AgencyContext);
  if (!context) {
    throw new Error('useAgency must be used within an AgencyProvider');
  }
  return context;
};
