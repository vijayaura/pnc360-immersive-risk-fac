import { setAuthToken } from '@/lib/api/client';
import { getAuthToken } from '@/lib/auth';

export function initAuth() {
  try {
    // Read persisted session synchronously from localStorage (Zustand may not have rehydrated yet).
    // Only touch the axios module token here — do not call useAuthStore.setToken before hydration
    // or a partial persist write could clear the stored user.
    const token = getAuthToken();
    if (token) {
      setAuthToken(token);
    }
  } catch {
    // storage might be unavailable
  }
}
