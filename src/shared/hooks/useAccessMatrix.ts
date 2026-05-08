import { useEffect, useMemo, useRef } from 'react';
import { useAccessMatrixStore } from '@/shared/stores/useAccessMatrixStore';
import type { AccessControlResponse } from '@/features/market-admin/api/admin';

function createPermissionChecker(data: AccessControlResponse | null, menuKey?: string) {
  return (id?: string) => {
    if (!data || !id) return false;
    for (const entry of data) {
      const m = (entry?.matrix as Record<string, Record<string, boolean>>) || {};
      if (menuKey && m?.[menuKey] && typeof m[menuKey]?.[id] !== 'undefined') {
        return !!m[menuKey][id];
      }
      const roleKeys = Object.keys(m || {});
      for (const rk of roleKeys) {
        const pm = m[rk];
        if (pm && typeof pm[id] !== 'undefined') {
          if (pm[id] === true) return true;
        }
      }
    }
    return false;
  };
}

export function useAccessMatrix(menuKey?: string) {
  const data = useAccessMatrixStore((s) => s.data);
  const isLoading = useAccessMatrixStore((s) => s.isLoading);
  const error = useAccessMatrixStore((s) => s.error);

  // Capture load() via getState() to avoid subscribing to its reference
  // (Zustand recreates inline functions on every set() call)
  const loadRef = useRef(useAccessMatrixStore.getState().load);

  useEffect(() => {
    loadRef.current = useAccessMatrixStore.getState().load;
  });

  useEffect(() => {
    loadRef.current();
  }, []);

  // checker only re-creates when data or menuKey changes
  const checker = useMemo(() => {
    return createPermissionChecker(data, menuKey);
  }, [data, menuKey]);

  return { hasPermission: checker, isLoading, isError: !!error };
}
