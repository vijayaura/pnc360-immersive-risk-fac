import { useEffect } from "react";
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { setAuthToken as setApiAuthToken } from "@/lib/api/client";
import { getAuthToken, getRefreshToken } from "@/lib/auth";

/**
 * Hook to initialize auth state from localStorage on app mount
 * This ensures the API client has the correct token when the page is refreshed
 *
 * ✅ NEW WAY: Syncs localStorage → Zustand → API Client
 */
export function useAuthInitialize() {
  useEffect(() => {
    const storedToken = getAuthToken();
    const storedRefreshToken = getRefreshToken();

    if (storedToken) {
      // ✅ Sync localStorage to Zustand store
      const authStore = useAuthStore.getState();
      authStore.setToken(storedToken, storedRefreshToken);
      setApiAuthToken(storedToken);
      console.log("✅ Auth initialized from localStorage");
    }
  }, []);
}

/**
 * ❌ OLD WAY (commented for reference):
 *
 * Before this hook, there was no automatic token synchronization on app mount.
 * When page was refreshed:
 * 1. Zustand loaded from localStorage ✅
 * 2. API client authToken remained null ❌
 * 3. API requests had no Authorization header ❌
 * 4. 401 errors occurred ❌
 * 5. User got redirected to login ❌
 *
 * Solution: This hook bridges the gap by syncing tokens during app initialization
 */
