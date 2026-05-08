import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import { getMarketAdminMenuItems, type AccessControlResponse } from '@/features/market-admin/api/admin';

interface AccessMatrixState {
  data: AccessControlResponse | null;
  lastFetchedAt: number | null;
  lastOrgIdFetched: string | number | null;
  isLoading: boolean;
  error: string | null;
  load: (orgId?: string | number | null) => Promise<void>;
  clear: () => void;
}

export const useAccessMatrixStore = create<AccessMatrixState>()(
  devtools(
    persist(
      (set, get) => ({
        data: null,
        lastFetchedAt: null,
        lastOrgIdFetched: null,
        isLoading: false,
        error: null,

        load: async (orgId?: string | number | null) => {
          // Normalize undefined → null so the cache guard comparison works
          // (undefined !== null would always bypass the cache)
          const normalizedOrgId = orgId ?? null;
          const state = get();
          const isSameOrg = normalizedOrgId === state.lastOrgIdFetched;

          if (
            isSameOrg &&
            state.data &&
            state.lastFetchedAt &&
            Date.now() - state.lastFetchedAt < 5 * 60 * 1000
          ) {
            return;
          }
          if (state.isLoading) return;
          set({ isLoading: true, error: null });
          try {
            const resp = await getMarketAdminMenuItems();
            set({
              data: resp,
              lastFetchedAt: Date.now(),
              lastOrgIdFetched: normalizedOrgId,
              isLoading: false,
            });
          } catch (e: unknown) {
            const error = e as { message?: string };
            set({ error: error?.message || 'Failed to load access matrix', isLoading: false });
          }
        },

        clear: () => {
          set({ data: null, lastFetchedAt: null, error: null });
        },
      }),
      {
        name: 'access-matrix-storage',
        partialize: (state) => ({
          data: state.data,
          lastFetchedAt: state.lastFetchedAt,
          lastOrgIdFetched: state.lastOrgIdFetched,
        }),
      },
    ),
    { name: 'AccessMatrixStore' },
  ),
);
