import { ENV_KEYS, AppEnv, ENV_DEFAULTS } from './env-constants';

function getEnv(key: string, fallback?: string): string {
  return (
    import.meta.env[key] ??
    fallback ??
    (() => {
      throw new Error(`❌ Missing env variable: ${key}`);
    })()
  );
}

export const ENV = {
  APP_ENV: getEnv(ENV_KEYS.APP_ENV) as AppEnv,
  API_BASE_URL: getEnv(ENV_KEYS.API_BASE_URL, ENV_DEFAULTS.API_BASE_URL),
  GOOGLE_MAPS_API_KEY: (typeof window !== 'undefined' && window.APP_CONFIG?.GOOGLE_MAPS_API_KEY) || import.meta.env[ENV_KEYS.GOOGLE_MAPS_API_KEY] || '',
  IS_PROD: import.meta.env.PROD,
};