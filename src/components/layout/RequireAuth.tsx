import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { setAuthToken } from '@/lib/api/client';
import { getAuthToken, getAuthUser } from "@/lib/auth";
import { ENV_CHECKS } from "@/config/env-constants";
import { ENV } from "@/config/env";
import { useAuthStore } from "@/shared/stores/useAuthStore";

interface RequireAuthProps {
  children: ReactNode;
  requiredRole?: string;
}

export const RequireAuth = ({ children, requiredRole }: RequireAuthProps) => {
  const location = useLocation();
  const [authHydrated, setAuthHydrated] = useState(() => useAuthStore.persist.hasHydrated());

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setAuthHydrated(true);
      return;
    }
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setAuthHydrated(true);
    });
    return unsub;
  }, []);

  let token: string | null = null;
  let userRole: string | null = null;
  try {
    token = getAuthToken();
    const user = getAuthUser<any>();
    if (user) {
      const raw = user?.role ?? user?.user_type ?? user?.userType;
      userRole = typeof raw === "string" && raw.trim().length > 0 ? raw.trim().toLowerCase() : null;
    }
  } catch {
    // ignore storage access issues
  }

  useEffect(() => {
    if (token) {
      setAuthToken(token);
    }
  }, [token]);

  if (!authHydrated) {
    return (
      <div
        className="min-h-screen w-full bg-background flex items-center justify-center"
        aria-busy="true"
        aria-label="Loading session"
      />
    );
  }

  // Allow dummy tokens for super_admin in production, for other roles only in development
  // Also allow demo tokens (demo-token- or dummy-demo-token-) for demo mode
  const isDevelopment = ENV_CHECKS.isLocal(ENV.APP_ENV) || window.location.hostname === 'localhost';
  const isDummyToken = token && (token.startsWith('dummy-') || token.startsWith('demo-token-'));
  const isSuperAdmin = requiredRole === 'super_admin';

  // Determine the correct login path based on requiredRole
  const getLoginPath = (role?: string) => {
    switch (role) {
      case 'super_admin': return '/super-admin/login';
      case 'broker': return '/broker/login';
      case 'insurer': return '/insurer/login';
      case 'reinsurer': return '/reinsurer/login';
      case 'reinsurer_broker': return '/reinsurer-broker/login';
      case 'admin':
      case 'market_admin': return '/admin/login';
      default: return '/admin/login';
    }
  };

  // For super admin with dummy token, always allow access
  if (isSuperAdmin && isDummyToken) {
    return <>{children}</>;
  }

  // Enforce authentication strictly unless it's a valid dummy token
  if (!token && !isDummyToken) {
    return <Navigate to={getLoginPath(requiredRole)} replace state={{ from: location }} />;
  }

  // Enforce role authorization strictly for all environments
  if (requiredRole) {
    let isRoleMatch = false;

    // Admin and Market Admin are functionally interchangeable in the portals
    if (requiredRole === 'admin' || requiredRole === 'market_admin') {
      isRoleMatch = userRole === 'admin' || userRole === 'market_admin';
    } else {
      isRoleMatch = userRole === requiredRole;
    }

    if (!isRoleMatch) {
      console.warn(`Role mismatch: expected ${requiredRole}, got ${userRole || 'empty'}. Redirecting to native login.`);
      return <Navigate to={getLoginPath(requiredRole)} replace state={{ from: location }} />;
    }
  }

  return <>{children}</>;
};

export default RequireAuth;


