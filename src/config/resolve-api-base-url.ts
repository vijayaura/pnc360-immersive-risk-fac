/** Same-origin path; vercel.json rewrites to QA API. */
export const VERCEL_API_PROXY_PATH = '/api/v1';

/**
 * Vercel hosts the SPA on *.vercel.app while the API is on another origin.
 * Use the proxy path so the browser does not trigger CORS (even if VITE_API_BASE_URL is set to the full QA URL).
 */
export function resolveApiBaseUrl(configured: string): string {
  if (import.meta.env.VERCEL === '1') {
    return VERCEL_API_PROXY_PATH;
  }

  if (typeof window !== 'undefined' && window.location.hostname.endsWith('.vercel.app')) {
    return VERCEL_API_PROXY_PATH;
  }

  return configured;
}
