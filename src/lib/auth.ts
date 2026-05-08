const ACCESS_TOKEN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'auth-storage';
const COMPANY_KEY = 'insurerCompany';
const BROKER_COMPANY_KEY = 'brokerCompany';
const BROKER_LICENSE_KEY = 'brokerLicense';

export function setAuthTokens(token: string, refreshToken?: string | null): void {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    if (refreshToken !== undefined) {
      if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      else localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  } catch { }
}

export function setAuthUser(user: unknown): void {
  try {
    // Wrap in state object to match Zustand persistence format
    const data = {
      state: { user }
    };
    localStorage.setItem(USER_KEY, JSON.stringify(data));
  } catch { }
}

export function getAuthUser<T = unknown>(): T | null {
  try {
    // Read directly from Zustand's localStorage persistence
    const raw = localStorage.getItem(USER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return (parsed?.state?.user as T) || null;
    }
    return null;
  } catch {
    return null;
  }
}

export function getAuthToken(): string | null {
  try {
    // Prefer Zustand store token if available
    const raw = localStorage.getItem(USER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.state?.token) return parsed.state.token;
    }
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getRefreshToken(): string | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.state?.refreshToken) return parsed.state.refreshToken;
    }
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearAuth(): void {
  try {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(COMPANY_KEY);
    localStorage.removeItem(BROKER_COMPANY_KEY);
    localStorage.removeItem(BROKER_LICENSE_KEY);
  } catch { }
}

interface AuthUserSession {
  organizationId?: string;
  organization_id?: string;
  company_id?: number | string;
  market_id?: number | string;
  marketId?: string;
  [key: string]: any;
}

export interface StoredCompanyInfo {
  id: number;
  name: string;
  logo?: string | null;
  licenseEndDate?: string | null;
}

export function setInsurerCompany(company: StoredCompanyInfo): void {
  try {
    localStorage.setItem(COMPANY_KEY, JSON.stringify(company));
  } catch { }
}

export function getInsurerCompany(): StoredCompanyInfo | null {
  try {
    const raw = localStorage.getItem(COMPANY_KEY);
    return raw ? (JSON.parse(raw) as StoredCompanyInfo) : null;
  } catch {
    return null;
  }
}

export function getInsurerCompanyId(): string | number | null {
  // 1. Prioritize dedicated company storage (Explicitly selected context)
  const company = getInsurerCompany();
  if (company?.id) return company.id;

  // 2. Fallback to user session object (Tenant specific keys from Zustand/JWT)
  const user = getAuthUser<AuthUserSession>();
  const sessionOrgId = user?.organizationId || user?.organization_id;
  if (sessionOrgId) return sessionOrgId;

  // 3. Last resort fallback to other user session keys
  if (!user) return null;
  return user.company_id ?? null;
}

// Broker company storage helpers
export function setBrokerCompany(company: StoredCompanyInfo): void {
  try {
    localStorage.setItem(BROKER_COMPANY_KEY, JSON.stringify(company));
  } catch { }
}

export function getBrokerCompany(): StoredCompanyInfo | null {
  try {
    const raw = localStorage.getItem(BROKER_COMPANY_KEY);
    return raw ? (JSON.parse(raw) as StoredCompanyInfo) : null;
  } catch {
    return null;
  }
}

export function getBrokerCompanyId(): string | number | null {
  // 1. Prioritize dedicated company storage (Explicitly selected context)
  const company = getBrokerCompany();
  if (company?.id) return company.id;

  // 2. Fallback to user session object (Tenant specific keys from Zustand/JWT)
  const user = getAuthUser<any>();
  const sessionOrgId = user?.organizationId || user?.organization_id;
  if (sessionOrgId) return sessionOrgId;

  // 3. Last resort fallback to other user session keys
  if (!user) return null;
  return user.company_id ?? null;
}

export interface StoredBrokerLicense {
  licenseNumber: string;
  validityStart: string;
  validityEnd: string;
  licenseDocumentFileId?: string;
  licenseDocument?: string;
  licenseDocumentUrl?: string;
  licenseDocumentSize?: string;
}

export function setBrokerLicense(license: StoredBrokerLicense | null): void {
  try {
    if (license) {
      localStorage.setItem(BROKER_LICENSE_KEY, JSON.stringify(license));
    } else {
      localStorage.removeItem(BROKER_LICENSE_KEY);
    }
  } catch { }
}

export function getBrokerLicense(): StoredBrokerLicense | null {
  try {
    const raw = localStorage.getItem(BROKER_LICENSE_KEY);
    return raw ? (JSON.parse(raw) as StoredBrokerLicense) : null;
  } catch {
    return null;
  }
}

/**
 * Get the Market/Parent ID
 * Used by Market Admins for global configurations
 */
export function getMarketId(): string | number | null {
  const user = getAuthUser<any>();
  if (!user) return null;

  return user.marketId || user.market_id || null;
}
