import type { Product } from '@/features/product-config/api/products';
import type { HeatMapLocation } from '@/features/market-admin/components/MarketAdminHeatMap';

export type HeatmapMasterCountries = Array<{ id: string; label: string; code?: string }>;
export type HeatmapMasterRegions = Array<{ id: string; label: string; countryId: string }>;
export type HeatmapMasterZones = Array<{ id: string; label: string; regionId: string }>;

function getCoverageIds(entries?: unknown[]): string[] {
  return (Array.isArray(entries) ? entries : [])
    .map((entry) => {
      if (typeof entry === 'string') return entry;
      if (entry && typeof entry === 'object') {
        const rawId =
          (entry as { id?: string; value?: string }).id ?? (entry as { value?: string }).value;
        return rawId ? String(rawId) : '';
      }
      return '';
    })
    .filter(Boolean);
}

type LocationBucket = {
  id: string;
  label: string;
  query: string;
  quotes: number;
  policies: number;
  weight: number;
  productIds: Set<string>;
};

/**
 * Aggregates product operating geography with dashboard quote/policy totals for Google Maps heatmap weights.
 */
export function buildHeatmapLocations(
  dashboardProducts: Product[],
  selectedProductIds: string[],
  totalQuotes: number,
  totalPolicies: number,
  masterCountries: HeatmapMasterCountries,
  masterRegions: HeatmapMasterRegions,
  masterZones: HeatmapMasterZones,
): HeatMapLocation[] {
  const countriesById = new Map(masterCountries.map((country) => [country.id, country]));
  const regionsById = new Map(masterRegions.map((region) => [region.id, region]));
  const zonesById = new Map(masterZones.map((zone) => [zone.id, zone]));

  const productsInScope =
    selectedProductIds.length > 0
      ? dashboardProducts.filter((product) => selectedProductIds.includes(String(product.id)))
      : dashboardProducts;

  if (productsInScope.length === 0) return [];

  const totalQuotesN = Number(totalQuotes ?? 0);
  const totalPoliciesN = Number(totalPolicies ?? 0);
  const fallbackWeight = totalQuotesN === 0 && totalPoliciesN === 0;

  const locationBuckets = new Map<string, LocationBucket>();
  const perProductQuotes = totalQuotesN / Math.max(productsInScope.length, 1);
  const perProductPolicies = totalPoliciesN / Math.max(productsInScope.length, 1);

  productsInScope.forEach((product) => {
    const zoneIds = getCoverageIds(product.operatingZones);
    const regionIds = getCoverageIds(product.operatingRegions);
    const countryIds = getCoverageIds(product.operatingCountries);

    const scopedLocations =
      zoneIds.length > 0
        ? zoneIds
            .map((zoneId) => {
              const zone = zonesById.get(zoneId);
              const region = zone ? regionsById.get(zone.regionId) : undefined;
              const country = region ? countriesById.get(region.countryId) : undefined;
              if (!zone) return null;
              return {
                id: `zone:${zone.id}`,
                label: zone.label,
                query: [zone.label, region?.label, country?.label].filter(Boolean).join(', '),
              };
            })
            .filter(Boolean)
        : regionIds.length > 0
          ? regionIds
              .map((regionId) => {
                const region = regionsById.get(regionId);
                const country = region ? countriesById.get(region.countryId) : undefined;
                if (!region) return null;
                return {
                  id: `region:${region.id}`,
                  label: region.label,
                  query: [region.label, country?.label].filter(Boolean).join(', '),
                };
              })
              .filter(Boolean)
          : countryIds
              .map((countryId) => {
                const country = countriesById.get(countryId);
                if (!country) return null;
                return {
                  id: `country:${country.id}`,
                  label: country.label,
                  query: country.label,
                };
              })
              .filter(Boolean);

    if (scopedLocations.length === 0) return;

    const locationShare = 1 / scopedLocations.length;
    scopedLocations.forEach((location) => {
      if (!location) return;
      const bucket = locationBuckets.get(location.id) ?? {
        id: location.id,
        label: location.label,
        query: location.query,
        quotes: 0,
        policies: 0,
        weight: 0,
        productIds: new Set<string>(),
      };

      const quotesContribution = fallbackWeight ? locationShare : perProductQuotes * locationShare;
      const policiesContribution = fallbackWeight
        ? locationShare
        : perProductPolicies * locationShare;

      bucket.quotes += quotesContribution;
      bucket.policies += policiesContribution;
      bucket.weight += quotesContribution + policiesContribution;
      bucket.productIds.add(String(product.id));
      locationBuckets.set(location.id, bucket);
    });
  });

  return Array.from(locationBuckets.values())
    .map((location) => ({
      id: location.id,
      label: location.label,
      query: location.query,
      quotes: location.quotes,
      policies: location.policies,
      weight: location.weight,
      productCount: location.productIds.size,
    }))
    .sort((a, b) => b.weight - a.weight);
}
