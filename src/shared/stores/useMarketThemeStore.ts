import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  MarketTheme,
  applyMarketTheme,
  clearMarketTheme,
  applySuperAdminTheme,
} from "@/lib/market-theme";

interface MarketThemeState {
  theme: MarketTheme | null;
  isInitialized: boolean;
  setTheme: (theme: MarketTheme | null) => void;
  clearTheme: () => void;
  setInitialized: (val: boolean) => void;
}

export const useMarketThemeStore = create<MarketThemeState>()(
  persist(
    (set) => ({
      theme: null,
      isInitialized: false,
      setTheme: (theme) => {
        set({ theme });
        applyMarketTheme(theme);
      },
      clearTheme: () => {
        set({ theme: null });
        clearMarketTheme();
      },
      setInitialized: (val) => set({ isInitialized: val }),
    }),
    {
      name: "market-theme-storage",
      onRehydrateStorage: () => {
        // Apply theme when store is rehydrated from localStorage
        // BUT skip if user is super-admin (super-admin should always use base defaults)
        return (state) => {
          // Check if current user is super-admin
          try {
            const authStorage = localStorage.getItem('auth-storage');
            if (authStorage) {
              const authData = JSON.parse(authStorage);
              const userRole = authData?.state?.user?.role;
              // If super-admin, always apply super-admin theme (#bad5ea)
              if (userRole === 'super_admin') {
                set({ theme: null });
                applySuperAdminTheme();
                state?.setInitialized(true);
                return;
              }
            }
          } catch (e) {
            // If we can't check auth, proceed normally
            console.warn('[Theme] Could not check user role during rehydration', e);
          }
          
          // Apply theme for non-super-admin users
          if (state?.theme) {
            applyMarketTheme(state.theme);
          }
          state?.setInitialized(true);
        };
      },
    }
  )
);
