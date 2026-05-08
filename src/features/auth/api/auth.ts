import { apiPost } from '@/lib/api/client';

export interface LoginRequestBody {
  email: string;
  password: string;
  userType?: string; // e.g., "market-admin"
}

export interface AuthUser {
  id: string | number;
  email: string;
  name?: string;
  role: 'broker' | 'insurer' | 'admin' | 'super_admin';
  user_type: string;
  status?: string;
  company_id?: number;
  organizationId?: string;
  company_name?: string;
  marketId?: string;
  marketDomain?: string;
  logo?: string;
}

export interface MarketInfo {
  marketId: string;
  domain: string;
  name: string;
  clientName: string;
}

export interface Branding {
  themeColor?: string; // HEX format: "#10B981"
  logoUrl?: string; // S3 signed URL
}

export interface BrokerLicense {
  licenseNumber: string;
  validityStart: string;
  validityEnd: string;
  licenseDocumentFileId?: string;
  licenseDocument?: string;
  licenseDocumentUrl?: string;
  licenseDocumentSize?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  market?: MarketInfo; // Present for tenant login
  branding?: Branding; // Marketplace branding (tenant login)
  license?: BrokerLicense; // Present for broker login
}

export async function login(
  body: LoginRequestBody,
  isTenantLogin: boolean = false,
): Promise<LoginResponse> {
  const endpoint = isTenantLogin ? '/auth/tenant/login' : '/auth/login';
  // Mark auth calls to skip interceptor refresh handling and suppress
  // the global session-expired / server error toasts so that the
  // calling page can show the appropriate login-related error UI.
  return apiPost<LoginResponse>(endpoint, body, {
    // interceptor flags read by src/lib/api/client.ts
    _skipAuth: true,
    _suppressGlobalErrorToast: true,
    withCredentials: true,
  } as any);
}

export interface RefreshRequestBody {
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
}

// Note: This is exported for typed use, but the axios client uses a low-level
// call with a skip flag to avoid interceptor recursion during refresh.
export async function refresh(body: RefreshRequestBody): Promise<RefreshResponse> {
  return apiPost<RefreshResponse>('/auth/refresh', body, {
    withCredentials: true,
  });
}

// Tenant-specific refresh endpoint for market-admin, insurer, broker
export async function tenantRefresh(body: RefreshRequestBody): Promise<RefreshResponse> {
  return apiPost<RefreshResponse>('/auth/tenant/refresh', body, {
    withCredentials: true,
  });
}

export interface LogoutResponse {
  refreshToken: string;
}

export interface LogoutRequestBody {
  refreshToken: string;
}

// Super Admin logout endpoint
export async function logout(body: LogoutRequestBody): Promise<LogoutResponse> {
  return apiPost<LogoutResponse>('/auth/logout', body, {
    withCredentials: true,
  });
}

// Tenant-specific logout endpoint for market-admin, insurer, broker
export async function tenantLogout(body: LogoutRequestBody): Promise<LogoutResponse> {
  return apiPost<LogoutResponse>('/auth/tenant/logout', body, {
    withCredentials: true,
  });
}

/**
 * Helper function to logout using the correct endpoint based on user role
 * @param body - Logout request body containing refreshToken
 * @param userRole - User role ('super_admin', 'admin', 'insurer', 'broker')
 */
export async function logoutByRole(
  body: LogoutRequestBody,
  userRole?: string,
): Promise<LogoutResponse> {
  const isSuperAdmin = userRole === 'super_admin';
  return isSuperAdmin ? logout(body) : tenantLogout(body);
}
