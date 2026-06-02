export const BROKER_FACILITY_OPTIONS = [
  { value: "open_market", label: "Open Market" },
  { value: "proportional_treaty", label: "Proportional Treaty" },
  { value: "non_proportional_treaty", label: "Non-Proportional Treaty" },
  { value: "facultative", label: "Facultative" },
  { value: "binder", label: "Binder / Delegated Authority" },
  { value: "line_slip", label: "Line Slip" },
  { value: "mga_program", label: "MGA Program" },
  { value: "pool", label: "Pool / Consortium" },
] as const;

export const PREFERRED_MARKET_OPTIONS = [
  { value: "gcc", label: "GCC" },
  { value: "mena", label: "MENA" },
  { value: "europe", label: "European Markets" },
  { value: "africa", label: "African Markets" },
  { value: "us", label: "US Markets" },
  { value: "uk", label: "UK & Lloyd's" },
  { value: "asia_pacific", label: "Asia-Pacific" },
  { value: "latin_america", label: "Latin America" },
  { value: "global", label: "Global" },
] as const;

export const REGIONAL_CONNECTION_OPTIONS = [
  { value: "europe", label: "European Markets" },
  { value: "africa", label: "African Markets" },
  { value: "us", label: "US Markets" },
  { value: "gcc", label: "GCC" },
  { value: "mena", label: "MENA" },
  { value: "uk_lloyds", label: "UK & Lloyd's" },
  { value: "asia_pacific", label: "Asia-Pacific" },
  { value: "latin_america", label: "Latin America" },
  { value: "indian_subcontinent", label: "Indian Subcontinent" },
  { value: "southeast_asia", label: "Southeast Asia" },
] as const;

export function getRegionalConnectionLabel(value: string) {
  return REGIONAL_CONNECTION_OPTIONS.find((r) => r.value === value)?.label ?? value;
}
