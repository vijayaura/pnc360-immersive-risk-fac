// Axios-based JSON API client with typed helpers, interceptors, and error handling
import axios, { AxiosInstance, AxiosRequestConfig, AxiosError, AxiosHeaders } from 'axios';
import { toast } from '@/components/ui/sonner';
import { getRefreshToken, setAuthTokens, clearAuth } from '@/lib/auth';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { isDemoMode } from '@/lib/demo-mode';
import { ENV_CHECKS } from '@/config/env-constants';
import { ENV } from '@/config/env';

export class ApiError extends Error {
  status?: number;
  code?: string;
  data?: unknown;

  constructor(message: string, status?: number, code?: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

const DEFAULT_BASE_URL: string = ENV.API_BASE_URL || '/api/v1';

let authToken: string | null = null;
export function setAuthToken(token: string | null): void {
  authToken = token;
}

export const api: AxiosInstance = axios.create({
  baseURL: DEFAULT_BASE_URL,
  // timeout: 15000,
  headers: {
    Accept: 'application/json',
  },
  withCredentials: false,
});

// Log the initial base URL
// console.log("🔧 Initial API base URL:", DEFAULT_BASE_URL);

export function setBaseUrl(url: string): void {
  try {
    const parsed = new URL(url);
    // Ensure path contains /api/v1 if not provided
    if (!/\/api\/v\d+/.test(parsed.pathname)) {
      parsed.pathname = parsed.pathname.replace(/\/$/, '') + '/api/v1';
    }
    const finalUrl = parsed.toString().replace(/\/$/, '');
    api.defaults.baseURL = finalUrl;
    // console.log("✅ API base URL set to:", finalUrl);
  } catch {
    // Fallback for relative values (e.g., '/api/v1')
    const normalized = url.endsWith('/api/v1') ? url : url.replace(/\/$/, '') + '/api/v1';
    api.defaults.baseURL = normalized;
    // console.log("✅ API base URL set to (fallback):", normalized);
  }
}

api.interceptors.request.use((config) => {
  const headers =
    config.headers instanceof AxiosHeaders ? config.headers : new AxiosHeaders(config.headers);

  // ✅ NEW WAY: Get token from Zustand store, fallback to authToken variable
  const currentToken = useAuthStore.getState().token || authToken;
  if (currentToken) {
    headers.set('Authorization', `Bearer ${currentToken}`);
  }

  // ❌ OLD WAY (commented for reference):
  // if (authToken) {
  //   headers.set("Authorization", `Bearer ${authToken}`);
  // }

  // For all GET requests, disable caches and add a cache-busting param to ensure fresh data
  if (String(config.method).toLowerCase() === 'get') {
    headers.set('Cache-Control', 'no-cache');
    headers.set('Pragma', 'no-cache');
    // Skip cache busting if explicitly requested
    if (!(config as any).skipCacheBust) {
      // 🛡️ SECURITY: Sanitize params to avoid "undefined" or "null" being sent as string values
      const rawParams = (config.params as any) || {};
      const cleanParams: Record<string, string> = {};

      Object.keys(rawParams).forEach((key) => {
        const val = rawParams[key];
        if (val !== undefined && val !== null && val !== '') {
          cleanParams[key] = String(val);
        }
      });

      const params = new URLSearchParams(cleanParams);
      if (!params.has('_ts')) params.set('_ts', String(Date.now()));
      config.params = params;
    }
  }
  config.headers = headers;

  // Log all outgoing API requests for debugging
  // const fullUrl = `${config.baseURL || api.defaults.baseURL}${config.url}`;
  // console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${fullUrl}`);

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    type InternalAxiosConfig = AxiosRequestConfig & {
      _retry?: boolean;
      _skipAuth?: boolean;
      _suppressGlobalErrorToast?: boolean;
    };

    const originalRequest = error.config as InternalAxiosConfig;
    const status = error.response?.status;
    const data: any = error.response?.data;

    if (status === 401 && !originalRequest?._retry && !originalRequest?._skipAuth) {
      originalRequest._retry = true;
      try {
        // ✅ Get refresh token from Zustand store first, fallback to localStorage
        let refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) {
          refreshToken = getRefreshToken();
        }
        if (!refreshToken) throw new Error('Missing refresh token');

        const user = useAuthStore.getState().user;
        const isSuperAdmin = user?.role === 'super_admin';
        const refreshEndpoint = isSuperAdmin ? '/auth/refresh' : '/auth/tenant/refresh';

        // Use a raw axios call to avoid recursion via interceptors
        const resp = await axios.post<{ accessToken: string; refreshToken?: string }>(
          `${api.defaults.baseURL}${refreshEndpoint}`,
          { refreshToken },
          {
            headers: {
              Accept: 'application/json',
            },
            withCredentials: true,
            // timeout: 15000,
          },
        );

        const newAccessToken = resp.data.accessToken;

        useAuthStore.getState().setToken(newAccessToken, refreshToken);
        setAuthToken(newAccessToken);
        setAuthTokens(newAccessToken, refreshToken);

        const retryHeaders =
          originalRequest.headers instanceof AxiosHeaders
            ? originalRequest.headers
            : new AxiosHeaders(originalRequest.headers);
        retryHeaders.set('Authorization', `Bearer ${newAccessToken}`);
        originalRequest.headers = retryHeaders;
        return api.request(originalRequest);
      } catch (refreshErr) {
        useAuthStore.getState().logout();
        clearAuth();

        // Notify and redirect to appropriate login page after refresh failure
        try {
          if (!originalRequest?._suppressGlobalErrorToast) {
            // Show a more professional session expiry message
            toast.error('Authentication Error', {
              description: 'There was a problem with your session. Please log in again.',
              duration: 5000,
            });
          }
          // Save current path for redirect after login
          if (typeof window !== 'undefined') {
            const currentPath = window.location?.pathname || '/';
            sessionStorage.setItem('redirectAfterLogin', currentPath);

            // Determine login page based on current portal
            const goTo = currentPath.startsWith('/broker')
              ? '/broker/login'
              : currentPath.startsWith('/insurer')
                ? '/insurer/login'
                : currentPath.startsWith('/market-admin')
                  ? '/admin/login'
                  : currentPath.startsWith('/super-admin')
                    ? '/super-admin/login'
                    : '/';

            // Redirect after a short delay to allow user to see the message
            if (!currentPath.startsWith(goTo)) {
              setTimeout(() => {
                window.location.assign(goTo);
              }, 2000);
            }
          }
        } catch {
          // ignore toast or location errors
        }
        // bubble up original error after handling
      }
    }

    const code = (data && data.code) || (error as any).code;
    const message = (data && data.message) || error.message || 'Request failed';

    const inDemoMode = isDemoMode();
    const isTokenError =
      status === 401 &&
      (message?.toLowerCase().includes('token') ||
        message?.toLowerCase().includes('signature') ||
        message?.toLowerCase().includes('invalid') ||
        message?.toLowerCase().includes('authorization') ||
        message?.toLowerCase().includes('denied') ||
        message?.toLowerCase().includes('no token'));

    if (inDemoMode && status === 401) {
      // Return a mock response based on the request method and URL
      let mockData: any = {};
      const url = originalRequest?.url || '';
      const method = originalRequest?.method?.toLowerCase() || 'get';

      if (method === 'get') {
        // For GET requests, return appropriate empty structures
        if (
          url.includes('list') ||
          url.includes('products') ||
          url.includes('quotes') ||
          url.includes('policies')
        ) {
          mockData = { items: [], data: [], products: [], quotes: [], policies: [] };
        } else if (url.includes('get') || url.includes('fetch') || url.includes('load')) {
          mockData = {};
        } else {
          mockData = { items: [], data: [] };
        }
      } else {
        // For POST/PATCH/PUT/DELETE, return success response
        mockData = { success: true, message: 'Demo mode - operation skipped', id: 'demo-id' };
      }

      return Promise.resolve({
        data: mockData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: originalRequest,
      } as any);
    }

    if (ENV_CHECKS.isLocal(ENV.APP_ENV)) {
      // eslint-disable-next-line no-console
      console.error('[API ERROR]', { message, status, code, data });
    }

    // Global server error toast (5xx) or network error
    // ❌ DISABLED: Skip showing errors for demo tokens (they're expected to fail API calls)
    try {
      const isServerError = typeof status === 'number' && status >= 500;
      const isNetworkError =
        !error.response && (error as any).message?.toString()?.toLowerCase().includes('network');

      if (
        !inDemoMode &&
        !isTokenError &&
        (isServerError || isNetworkError) &&
        !originalRequest?._suppressGlobalErrorToast
      ) {
        const title = isNetworkError ? 'Network error' : 'Server error';
        const description = isNetworkError
          ? 'Please check your connection and try again.'
          : message || 'An unexpected error occurred.';
      }
    } catch {
      // ignore toast errors
    }

    throw new ApiError(message, status, code, data);
  },
);

export async function apiRequest<T>(path: string, config: AxiosRequestConfig = {}): Promise<T> {
  const response = await api.request<T>({ url: path, ...config });
  return response.data as T;
}

export async function apiGet<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
  return apiRequest<T>(path, { method: 'GET', ...(config || {}) });
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  return apiRequest<T>(path, { method: 'POST', data: body, ...(config || {}) });
}

export async function apiPut<T>(
  path: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  return apiRequest<T>(path, { method: 'PUT', data: body, ...(config || {}) });
}

export async function apiDelete<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
  return apiRequest<T>(path, { method: 'DELETE', ...(config || {}) });
}

export async function apiPatch<T>(
  path: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  return apiRequest<T>(path, { method: 'PATCH', data: body, ...(config || {}) });
}

export async function apiUploadFile<T>(
  path: string,
  file: File,
  config?: AxiosRequestConfig,
  fieldName: string = 'logo',
  extraData?: Record<string, string | number | boolean>,
): Promise<T> {
  const formData = new FormData();
  formData.append(fieldName, file);

  if (extraData) {
    Object.entries(extraData).forEach(([key, value]) => {
      formData.append(key, String(value));
    });
  }

  return apiRequest<T>(path, {
    method: 'POST',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    ...(config || {}),
  });
}
