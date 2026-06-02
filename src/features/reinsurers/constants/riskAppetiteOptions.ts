export const LINES_WRITTEN_OPTIONS = [
  { value: "property", label: "Property" },
  { value: "casualty", label: "Casualty / Liability" },
  { value: "marine", label: "Marine & Cargo" },
  { value: "aviation", label: "Aviation" },
  { value: "energy", label: "Energy & Power" },
  { value: "engineering", label: "Engineering & Construction" },
  { value: "financial_lines", label: "Financial Lines" },
  { value: "credit_political", label: "Credit & Political Risk" },
  { value: "agriculture", label: "Agriculture" },
  { value: "motor", label: "Motor" },
  { value: "life_health", label: "Life & Health" },
  { value: "specialty", label: "Specialty" },
] as const;

export const RISK_APPETITE_LEVEL_OPTIONS = [
  { value: "conservative", label: "Conservative — low volatility, established classes" },
  { value: "balanced", label: "Balanced — mix of core and selective growth" },
  { value: "growth", label: "Growth-oriented — expanding capacity in target lines" },
  { value: "aggressive", label: "Aggressive — higher limits, broader peril appetite" },
  { value: "specialty_only", label: "Specialty-only — niche / complex risks" },
] as const;

export const RETENTION_CURRENCY_OPTIONS = [
  { value: "AED", label: "AED" },
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
] as const;

/** Shared peril / class list for accepted and declined risk pickers */
export const RISK_CLASS_OPTIONS = [
  { value: "property_all_risk", label: "Property All Risks" },
  { value: "business_interruption", label: "Business Interruption" },
  { value: "general_liability", label: "General Liability" },
  { value: "professional_indemnity", label: "Professional Indemnity" },
  { value: "directors_officers", label: "Directors & Officers" },
  { value: "cyber", label: "Cyber" },
  { value: "nat_cat_earthquake", label: "Natural Catastrophe — Earthquake" },
  { value: "nat_cat_wind_flood", label: "Natural Catastrophe — Wind / Flood" },
  { value: "engineering_carl_ear", label: "Engineering (CAR / EAR)" },
  { value: "marine_hull_cargo", label: "Marine Hull & Cargo" },
  { value: "aviation_hull_liability", label: "Aviation Hull & Liability" },
  { value: "energy_offshore", label: "Energy — Offshore" },
  { value: "energy_onshore", label: "Energy — Onshore" },
  { value: "terrorism_political", label: "Terrorism & Political Violence" },
  { value: "credit_surety", label: "Credit & Surety" },
  { value: "motor_fleet", label: "Motor / Fleet" },
  { value: "health_medical", label: "Health & Medical" },
  { value: "kidnap_ransom", label: "Kidnap & Ransom" },
] as const;

export const FACILITY_TYPE_OPTIONS = [
  { value: "open_market", label: "Open Market" },
  { value: "proportional_treaty", label: "Proportional Treaty" },
  { value: "non_proportional_treaty", label: "Non-Proportional Treaty" },
  { value: "facultative_only", label: "Facultative Only" },
  { value: "binder", label: "Binder / Delegated Authority" },
  { value: "line_slip", label: "Line Slip" },
  { value: "mixed", label: "Mixed / Multi-structure" },
] as const;
