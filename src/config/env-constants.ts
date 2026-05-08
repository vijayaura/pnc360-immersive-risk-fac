/**
 * Single source of truth for ALL environment-related constants
 * ❗ Do not hardcode env strings anywhere else in the app
 */

export const ENV_NAMES = {
  LOCAL: 'local',
  DEV: 'development',
  UAT: 'uat',
  PROD: 'production',
} as const;

export const ENV_DEFAULTS = {
  API_BASE_URL: 'http://localhost:3000',
} as const;

/**
 * Derived type — never manually edit
 */
export type AppEnv = (typeof ENV_NAMES)[keyof typeof ENV_NAMES];

/**
 * Vite-exposed environment variable keys
 * (Keeps names centralized & typo-safe)
 */
export const ENV_KEYS = {
  APP_ENV: 'VITE_APP_ENV',
  API_BASE_URL: 'VITE_API_BASE_URL',
  GOOGLE_MAPS_API_KEY: 'VITE_GOOGLE_MAPS_API_KEY',
} as const;

export type EnvKey = (typeof ENV_KEYS)[keyof typeof ENV_KEYS];

/**
 * Helper comparison flags
 * (Prevents repeating comparison logic)
 */
export const ENV_CHECKS = {
  isLocal: (env: AppEnv) => env === ENV_NAMES.LOCAL,
  isDev: (env: AppEnv) => env === ENV_NAMES.DEV,
  isUat: (env: AppEnv) => env === ENV_NAMES.UAT,
  isProd: (env: AppEnv) => env === ENV_NAMES.PROD,
} as const;
