export type OrgStatus = 'Pending' | 'Active' | 'Suspended' | 'Churned';
export type ProjectStatus = 'Onboarding' | 'Active' | 'Paused' | 'Archived';
export type Plan = 'Trial' | 'Starter' | 'Growth' | 'Enterprise' | 'Custom';

export interface SuperadminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string | null;
  status?: string;
  lastLoginAt?: string | null;
}

export interface Organization {
  id: string;
  name: string;
  slug?: string;
  businessType?: string;
  status: OrgStatus;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  gstin?: string;
  pan?: string;
  notes?: string;
  projectCount?: number;
  primaryAdmin?: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
    status?: string;
    lastLoginAt?: string;
  } | null;
  primaryAgency?: { id?: string; name?: string; city?: string } | null;
  onboardedAt?: string;
  activatedAt?: string;
  createdAt?: string;
}

export interface Project {
  id: string;
  name: string;
  code?: string;
  status: ProjectStatus;
  plan?: Plan;
  notes?: string;
  metrics?: {
    vehicles?: number;
    drivers?: number;
    bookings?: number;
    lastActivityAt?: string | null;
  };
  organization?: { id?: string; name?: string; status?: string; city?: string } | null;
  adminUser?: {
    id?: string;
    name?: string;
    email?: string;
    status?: string;
    lastLoginAt?: string | null;
  } | null;
  agency?: { id?: string; name?: string; city?: string; onboardStatus?: string } | null;
  goLiveAt?: string | null;
  updatedAt?: string;
  createdAt?: string;
}

export interface DashboardData {
  overview: {
    organizations: { total: number; pending: number; active: number; suspended: number };
    projects: { total: number; onboarding: number; active: number };
    adminUsers: number;
  };
  recentOrganizations: Organization[];
  recentProjects: Project[];
}

export interface TrackedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  status: string;
  lastLoginAt?: string | null;
  createdAt?: string;
  organizationId?: { id?: string; name?: string; status?: string } | null;
  currentAgency?: { id?: string; name?: string; city?: string } | null;
}
