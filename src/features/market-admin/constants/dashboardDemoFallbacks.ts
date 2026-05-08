import type { HeatMapLocation } from '@/features/market-admin/components/MarketAdminHeatMap';

/** Shown when `/dashboard/.../statistics` omits `totalSumInsured`. */
export const DUMMY_SUM_INSURED = 48_500_000;
export const DUMMY_SUM_INSURED_CURRENCY = 'AED';

/** UAE sample points so the Risk Accumulation map renders when products lack operating geography. */
export const DEMO_HEATMAP_LOCATIONS: HeatMapLocation[] = [
  {
    id: 'demo:dubai',
    label: 'Dubai',
    query: 'Dubai, United Arab Emirates',
    quotes: 1,
    policies: 1,
    weight: 4,
    productCount: 1,
  },
  {
    id: 'demo:abudhabi',
    label: 'Abu Dhabi',
    query: 'Abu Dhabi, United Arab Emirates',
    quotes: 1,
    policies: 1,
    weight: 3.5,
    productCount: 1,
  },
  {
    id: 'demo:sharjah',
    label: 'Sharjah',
    query: 'Sharjah, United Arab Emirates',
    quotes: 1,
    policies: 1,
    weight: 2.5,
    productCount: 1,
  },
];

export function heatmapLocationsWithFallback(locations: HeatMapLocation[]): HeatMapLocation[] {
  return locations.length > 0 ? locations : DEMO_HEATMAP_LOCATIONS;
}

export type SumInsuredStatsInput = {
  totalSumInsured?: number | string | null;
  totalSumInsuredCurrency?: string | null;
  totalValueCurrency?: string | null;
};

/**
 * Uses API totals when present; otherwise shows placeholder sum insured for dashboard polish until backend supports the field.
 */
export function resolveSumInsuredForDisplay(data: SumInsuredStatsInput | undefined): {
  value: number;
  currency: string;
} {
  const raw = data?.totalSumInsured;
  const hasExplicit = raw !== undefined && raw !== null && raw !== '';
  const value = hasExplicit ? Number(raw) : DUMMY_SUM_INSURED;
  const currency =
    data?.totalSumInsuredCurrency ?? data?.totalValueCurrency ?? DUMMY_SUM_INSURED_CURRENCY;
  return { value, currency };
}
