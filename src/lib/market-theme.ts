// Market Theme Management
// Handles dynamic theming based on market branding configuration

/**
 * Market theme configuration (matches backend API)
 */
export interface MarketTheme {
  marketId: string | number;
  name: string;
  clientName: string;
  logoUrl?: string;
  themeColor?: string; // HEX format: "#3B82F6"
}

/**
 * Default theme values (matches index.css :root)
 */
const DEFAULT_THEME = {
  primary: "213 78% 74%",
  primaryHover: "213 78% 68%",
  primaryLight: "213 88% 94%",
  accent: "213 78% 74%",
  muted: "213 88% 95%",
  secondary: "213 88% 95%",
  border: "213 88% 90%",
  input: "213 88% 90%",
  sidebarBackground: "0 0% 100%",
  sidebarForeground: "213 25% 29%",
  sidebarPrimary: "213 78% 74%",
  sidebarAccent: "213 88% 95%",
  sidebarAccentForeground: "213 25% 29%",
  sidebarBorder: "213 88% 90%",
  sidebarRing: "213 78% 74%",
};

/**
 * Convert HEX color to HSL
 */
function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  // Remove # if present
  hex = hex.replace(/^#/, "");

  // Handle 8-digit hex (RRGGHHAA) by taking first 6 chars
  if (hex.length === 8) {
    hex = hex.substring(0, 6);
  }

  if (hex.length !== 6) return null;

  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Generate complementary colors from a primary color (HEX or HSL)
 */
function generateThemeColors(primaryColor: string) {
  let h: number, s: number, l: number;

  // Check if HEX format
  if (primaryColor.startsWith("#")) {
    const hsl = hexToHsl(primaryColor);
    if (!hsl) return DEFAULT_THEME;
    h = hsl.h;
    s = hsl.s;
    l = hsl.l;
  } else {
    // Assume HSL format: "213 78% 74%"
    const match = primaryColor.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
    if (!match) return DEFAULT_THEME;
    h = parseInt(match[1], 10);
    s = parseInt(match[2], 10);
    l = parseInt(match[3], 10);
  }

  return {
    primary: `${h} ${s}% ${l}%`,
    primaryHover: `${h} ${s}% ${Math.max(l - 6, 20)}%`,
    primaryLight: `${h} ${Math.min(s + 10, 100)}% ${Math.min(l + 20, 95)}%`,
    accent: `${h} ${s}% ${l}%`,
    // Muted and secondary use a very light tint of the theme hue — used by skeleton loaders
    muted: `${h} ${Math.min(s + 10, 60)}% 95%`,
    secondary: `${h} ${Math.min(s + 10, 60)}% 95%`,
    // Borders and inputs match theme hue so they don't clash with other portals' defaults
    border: `${h} ${Math.min(s + 15, 50)}% 88%`,
    input: `${h} ${Math.min(s + 15, 50)}% 88%`,
    // Sidebar uses darker version of primary
    sidebarBackground: `${h} ${Math.max(s - 30, 25)}% 18%`,
    sidebarForeground: "0 0% 100%",
    sidebarPrimary: `${h} ${s}% ${Math.min(l + 5, 80)}%`,
    sidebarAccent: `${h} ${Math.max(s - 20, 25)}% 26%`,
    sidebarAccentForeground: "0 0% 100%",
    sidebarBorder: `${h} ${Math.max(s - 25, 20)}% 28%`,
    sidebarRing: `${h} ${s}% ${Math.min(l + 5, 80)}%`,
  };
}

/**
 * Apply market theme by setting CSS variables on :root
 */
export function applyMarketTheme(theme: MarketTheme | null): void {
  if (!theme?.themeColor) {
    // Remove custom theme, revert to default
    clearMarketTheme();
    return;
  }

  const colors = generateThemeColors(theme.themeColor);
  const root = document.documentElement;

  // Set CSS variables
  root.style.setProperty("--primary", colors.primary);
  root.style.setProperty("--primary-hover", colors.primaryHover);
  root.style.setProperty("--primary-light", colors.primaryLight);
  root.style.setProperty("--accent", colors.accent);
  // Muted & secondary drive skeleton loader colors — must match theme hue
  root.style.setProperty("--muted", colors.muted);
  root.style.setProperty("--secondary", colors.secondary);
  root.style.setProperty("--border", colors.border);
  root.style.setProperty("--input", colors.input);
  root.style.setProperty("--ring", colors.primary);

  // Sidebar (market-admin, broker, insurer)
  root.style.setProperty("--sidebar-background", colors.sidebarBackground);
  root.style.setProperty("--sidebar-foreground", colors.sidebarForeground);
  root.style.setProperty("--sidebar-primary", colors.sidebarPrimary);
  root.style.setProperty("--sidebar-accent", colors.sidebarAccent);
  root.style.setProperty("--sidebar-accent-foreground", colors.sidebarAccentForeground);
  root.style.setProperty("--sidebar-border", colors.sidebarBorder);
  root.style.setProperty("--sidebar-ring", colors.sidebarRing);

  // Mark as custom themed (for CSS overrides if needed)
  root.classList.add("market-themed");
  // Remove demo mode theme if present
  root.classList.remove("riyadh-re-theme");
}

/**
 * Clear custom market theme, revert to defaults
 */
export function clearMarketTheme(): void {
  const root = document.documentElement;

  // Remove inline styles
  root.style.removeProperty("--primary");
  root.style.removeProperty("--primary-hover");
  root.style.removeProperty("--primary-light");
  root.style.removeProperty("--accent");
  root.style.removeProperty("--muted");
  root.style.removeProperty("--secondary");
  root.style.removeProperty("--border");
  root.style.removeProperty("--input");
  root.style.removeProperty("--ring");
  root.style.removeProperty("--sidebar-background");
  root.style.removeProperty("--sidebar-foreground");
  root.style.removeProperty("--sidebar-primary");
  root.style.removeProperty("--sidebar-primary-foreground");
  root.style.removeProperty("--sidebar-accent");
  root.style.removeProperty("--sidebar-accent-foreground");
  root.style.removeProperty("--sidebar-border");
  root.style.removeProperty("--sidebar-ring");

  root.classList.remove("market-themed");
  root.classList.remove("super-admin-theme");
}

/**
 * Super-admin portal theme: #041736 (Dark Midnight Blue).
 * Used only for super-admin; market-admin, broker, insurer use market themes.
 */
export const SUPER_ADMIN_THEME_COLOR = "#669ef9";
/**
 * Super-admin sidebar: very light, airy surface with a subtle blue tint (#bad5ea family).
 * Lower saturation + high lightness for a clean, refined look; gentle hover states.
 * Foreground is a soft gray (not harsh black) for comfortable reading.
 */
const SUPER_ADMIN_SIDEBAR = {
  sidebarBackground: "207 18% 98.5%",
  sidebarForeground: "213 14% 42%",
  sidebarPrimary: "207 53% 82%",
  sidebarPrimaryForeground: "0 0% 100%",
  sidebarAccent: "207 22% 95%",
  sidebarAccentForeground: "213 14% 42%",
  sidebarBorder: "207 12% 94%",
  sidebarRing: "207 53% 82%",
};

/**
 * Apply super-admin theme (#bad5ea and variants) on :root.
 * Call when super-admin is active so the portal always uses Aura colors.
 * Sidebar uses light variants so the side menu is not dark.
 */
export function applySuperAdminTheme(): void {
  const colors = generateThemeColors(SUPER_ADMIN_THEME_COLOR);
  const root = document.documentElement;

  root.style.setProperty("--primary", colors.primary);
  root.style.setProperty("--primary-hover", colors.primaryHover);
  root.style.setProperty("--primary-light", colors.primaryLight);
  root.style.setProperty("--accent", colors.accent);
  // Muted & secondary drive skeleton loader colors — must match theme hue
  root.style.setProperty("--muted", colors.muted);
  root.style.setProperty("--secondary", colors.secondary);
  root.style.setProperty("--ring", colors.primary);

  // Super-admin: light sidebar (not the dark one from generateThemeColors)
  root.style.setProperty("--sidebar-background", SUPER_ADMIN_SIDEBAR.sidebarBackground);
  root.style.setProperty("--sidebar-foreground", SUPER_ADMIN_SIDEBAR.sidebarForeground);
  root.style.setProperty("--sidebar-primary", SUPER_ADMIN_SIDEBAR.sidebarPrimary);
  root.style.setProperty("--sidebar-primary-foreground", SUPER_ADMIN_SIDEBAR.sidebarPrimaryForeground);
  root.style.setProperty("--sidebar-accent", SUPER_ADMIN_SIDEBAR.sidebarAccent);
  root.style.setProperty("--sidebar-accent-foreground", SUPER_ADMIN_SIDEBAR.sidebarAccentForeground);
  root.style.setProperty("--sidebar-border", SUPER_ADMIN_SIDEBAR.sidebarBorder);
  root.style.setProperty("--sidebar-ring", SUPER_ADMIN_SIDEBAR.sidebarRing);

  root.classList.add("super-admin-theme");
  root.classList.remove("market-themed");
  root.classList.remove("riyadh-re-theme");
}

/**
 * Robustly fetch and apply market theme based on an identifier
 * (Can be a marketId, domain, or slug)
 */
export async function discoverAndApplyTheme(identifier: string | number): Promise<void> {
  try {
    // In a real app, this would be an API call
    // For now, if it's a known demo identifier, we apply that
    if (identifier === "riyadh-re") {
      document.documentElement.classList.add("riyadh-re-theme");
      return;
    }

    // Otherwise, clear custom themes to ensure we show the system default
    clearMarketTheme();
  } catch (error) {
    console.error("Failed to discover market theme:", error);
    clearMarketTheme();
  }
}

/**
 * Portal-specific defaults for "Fresh App" scenarios
 */
export const PORTAL_DEFAULTS: Record<string, MarketTheme> = {
  broker: {
    marketId: "default-broker",
    name: "Aura Distributor",
    clientName: "Riyadh Re Platform",
    themeColor: "#3B82F6", // Professional Blue
  },
  insurer: {
    marketId: "default-insurer",
    name: "Aura Underwriter",
    clientName: "Riyadh Re Platform",
    themeColor: "#0D9488", // Teal/Green
  },
  admin: {
    marketId: "default-admin",
    name: "Aura Admin",
    clientName: "P&C 360",
    themeColor: "#6366F1", // Indigo
  }
};

/**
 * Apply a portal default theme if no custom theme is active
 */
export function applyPortalDefault(portalType: string): void {
  const defaultTheme = PORTAL_DEFAULTS[portalType];
  if (defaultTheme) {
    applyMarketTheme(defaultTheme);
  }
}
