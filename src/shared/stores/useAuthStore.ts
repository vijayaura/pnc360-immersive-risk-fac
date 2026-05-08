import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import { setAuthToken } from '@/lib/api/client';
import { useMarketThemeStore } from '@/shared/stores/useMarketThemeStore';

/**
 * Company Information Interface
 */
export interface StoredCompanyInfo {
  id: number;
  name: string;
  logo?: string | null;
  licenseEndDate?: string | null;
}

/**
 * User Interface
 */
export interface User {
  id: string | number;
  email: string;
  name?: string;
  role: 'broker' | 'insurer' | 'reinsurer' | 'reinsurer_broker' | 'admin' | 'super_admin';
  user_type?: string;
  userType?: string;
  organizationId?: string;
  organization_id?: string;
  company_id?: number;
  company_name?: string;
  marketId?: string;
  marketDomain?: string;
  logo?: string;
}

/**
 * Auth State Interface
 */
interface AuthState {
  // Core Auth State
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  // Company Information (Role-specific)
  brokerCompany: StoredCompanyInfo | null;
  insurerCompany: StoredCompanyInfo | null;

  // Actions - Core Auth
  setUser: (user: User) => void;
  setToken: (token: string, refreshToken?: string | null) => void;
  setRefreshToken: (refreshToken: string | null) => void;
  logout: () => void;

  // Actions - Company Management
  setBrokerCompany: (company: StoredCompanyInfo | null) => void;
  setInsurerCompany: (company: StoredCompanyInfo | null) => void;

  // Getters - Role Checks
  isBroker: () => boolean;
  isInsurer: () => boolean;
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;

  // Getters - Company Helpers
  getCompany: () => StoredCompanyInfo | null;
  getCompanyId: () => number | null;
}

/**
 * Zustand Auth Store
 *
 * This store manages all authentication state using Zustand's persist middleware.
 * It replaces the old localStorage-based auth.ts functions.
 *
 * Usage:
 * - In React components: const user = useAuthStore((state) => state.user);
 * - Outside React: const user = useAuthStore.getState().user;
 */
export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        brokerCompany: null,
        insurerCompany: null,

        // Core Auth Actions
        setUser: (user) => {
          set({ user, isAuthenticated: true });
        },

        setToken: (token, refreshToken = null) => {
          set({ token, refreshToken });
          // Update API client token
          setAuthToken(token);
        },

        setRefreshToken: (refreshToken) => {
          set({ refreshToken });
        },

        logout: () => {
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            brokerCompany: null,
            insurerCompany: null,
          });
          // Clear API client token
          setAuthToken(null);
          // Clear legacy authToken from localStorage
          try {
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
          } catch {
            // Ignore errors if localStorage is unavailable
          }
        },

        // Company Management Actions
        setBrokerCompany: (company) => {
          set({ brokerCompany: company });
        },

        setInsurerCompany: (company) => {
          set({ insurerCompany: company });
        },

        // Role Check Getters
        isBroker: () => {
          return get().user?.role === 'broker';
        },

        isInsurer: () => {
          return get().user?.role === 'insurer' || get().user?.role === 'reinsurer';
        },

        isAdmin: () => {
          return get().user?.role === 'admin';
        },

        isSuperAdmin: () => {
          return get().user?.role === 'super_admin';
        },

        // Company Helpers
        getCompany: () => {
          const state = get();
          if (state.user?.role === 'broker') {
            return state.brokerCompany;
          }
          if (state.user?.role === 'insurer') {
            return state.insurerCompany;
          }
          return null;
        },

        getCompanyId: () => {
          const company = get().getCompany();
          if (company?.id) return company.id;
          return get().user?.company_id ?? null;
        },
      }),
      {
        name: 'auth-storage', // localStorage key
        partialize: (state) => ({
          // Only persist essential auth data
          user: state.user,
          token: state.token,
          refreshToken: state.refreshToken,
          isAuthenticated: state.isAuthenticated,
          brokerCompany: state.brokerCompany,
          insurerCompany: state.insurerCompany,
        }),
      },
    ),
    { name: 'AuthStore' }, // DevTools name
  ),
);
