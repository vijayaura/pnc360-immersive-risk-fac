import { ENV_KEYS, AppEnv, ENV_DEFAULTS, ENV_NAMES } from './env-constants';

function getEnv(key: string, fallback?: string): string {
  const value = import.meta.env[key];
  if (value !== undefined && value !== '') {
    return value;
  }
  if (fallback !== undefined) {
    return fallback;
  }
  throw new Error(`❌ Missing env variable: ${key}`);
}

/** Defaults when Vercel/local omits vars — Vite inlines `import.meta.env` at build time. */
const defaultAppEnv: AppEnv = import.meta.env.PROD ? ENV_NAMES.PROD : ENV_DEFAULTS.APP_ENV;
const defaultApiBaseUrl = import.meta.env.PROD ? '/api/v1' : ENV_DEFAULTS.API_BASE_URL;

export const ENV = {
  APP_ENV: getEnv(ENV_KEYS.APP_ENV, defaultAppEnv) as AppEnv,
  API_BASE_URL: getEnv(ENV_KEYS.API_BASE_URL, defaultApiBaseUrl),
  GOOGLE_MAPS_API_KEY: (typeof window !== 'undefined' && window.APP_CONFIG?.GOOGLE_MAPS_API_KEY) || import.meta.env[ENV_KEYS.GOOGLE_MAPS_API_KEY] || '',
  IS_PROD: import.meta.env.PROD,
};