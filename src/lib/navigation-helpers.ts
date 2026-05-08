import { PortalType } from '@/types/auth';

/**
 * Navigation helper for post-login redirects
 * Always navigates to the appropriate dashboard based on user role
 * Clears any stored redirect paths to ensure consistent behavior
 */

export const getDefaultDashboardPath = (userRole: string): string => {
  switch (userRole) {
    case PortalType.BROKER:
      return '/broker/dashboard';
    case PortalType.INSURER:
      return '/insurer/dashboard';
    case PortalType.REINSURER:
      return '/reinsurer/dashboard';
    case PortalType.REINSURER_BROKER:
      return '/reinsurer-broker/dashboard';
    case 'admin':
    case PortalType.MARKET_ADMIN:
      return '/market-admin/dashboard';
    case PortalType.SUPER_ADMIN:
      return '/super-admin/dashboard';
    default:
      return '/';
  }
};

/**
 * Clears any stored redirect paths from session storage
 * Should be called on successful login
 */
export const clearRedirectPath = () => {
  sessionStorage.removeItem('redirectAfterLogin');
};

/**
 * Navigate to dashboard after successful login
 * Clears redirect paths and navigates to the appropriate dashboard
 */
export const navigateToDefaultDashboard = (navigate: (path: string) => void, userRole: string) => {
  clearRedirectPath();
  const dashboardPath = getDefaultDashboardPath(userRole);
  navigate(dashboardPath);
};
