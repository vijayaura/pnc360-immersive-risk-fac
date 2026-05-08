// Demo mode detection and management
// Used to switch between production and Riyadh Re (demo) branding

const DEMO_MODE_KEY = 'isDemoMode';

export const DEMO_CREDENTIALS = {
  broker: { email: 'demo@riyadhre.com', password: 'demo2024' },
  insurer: { email: 'demo-insurer@riyadhre.com', password: 'demo2024' },
  marketAdmin: { email: 'demo-admin@riyadhre.com', password: 'demo2024' },
  superAdmin: { email: 'demo-super@riyadhre.com', password: 'demo2024' },
  callCenter: { email: 'demo-callcenter@riyadhre.com', password: 'demo2024' }
};

const DEMO_USER_EMAILS = Object.values(DEMO_CREDENTIALS).map(cred => cred.email.toLowerCase());

/**
 * Check if demo mode is currently active
 */
export function isDemoMode(): boolean {
  try {
    return localStorage.getItem(DEMO_MODE_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Set demo mode on or off
 */
export function setDemoMode(enabled: boolean): void {
  try {
    if (enabled) {
      localStorage.setItem(DEMO_MODE_KEY, 'true');
    } else {
      localStorage.removeItem(DEMO_MODE_KEY);
    }
    // Dispatch event so other tabs/components can react
    window.dispatchEvent(new Event('demoModeChanged'));
  } catch {}
}

/**
 * Check if an email is a demo email
 */
export function isDemoEmail(email: string): boolean {
  return DEMO_USER_EMAILS.includes(email.toLowerCase());
}

/**
 * Get demo credentials for a specific portal type
 */
export function getDemoCredentials(portalType: 'broker' | 'insurer' | 'marketAdmin' | 'superAdmin' | 'callCenter') {
  return DEMO_CREDENTIALS[portalType];
}

/**
 * Clear demo mode (useful for logout)
 */
export function clearDemoMode(): void {
  setDemoMode(false);
}

