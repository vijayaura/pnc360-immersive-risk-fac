import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAccessMatrix } from '@/shared/hooks/useAccessMatrix';
import { useAccessMatrixStore } from '@/shared/stores/useAccessMatrixStore';

type RequirePermissionProps = {
  areaKey?: string;
  permissionId: string;
  fallback?: string;
  children: ReactNode;
};

export default function RequirePermission({
  areaKey = 'marketAdmin',
  permissionId,
  fallback = '/market-admin/dashboard',
  children,
}: RequirePermissionProps) {
  const { hasPermission, isLoading } = useAccessMatrix(areaKey);
  const data = useAccessMatrixStore((s) => s.data);
  const location = useLocation();
  // Only block rendering if we have NO data yet and are still loading.
  // If data already exists (from persist or prior fetch), keep rendering
  // children even during a re-fetch — prevents mount/unmount cycles.
  if (!data && isLoading) return null;
  if (!hasPermission(permissionId)) {
    return <Navigate to={fallback} state={{ from: location }} replace />;
  }
  return <>{children}</>;
}
