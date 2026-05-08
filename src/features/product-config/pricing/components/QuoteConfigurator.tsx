import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Save } from 'lucide-react';
import type { InsurerMetadata } from '@/features/insurers/api/insurers';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  listMasterCountries,
  listMasterRegions,
  listMasterZones,
} from '@/features/product-config/masters/api/masters';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getQuoteCoverage, type QuoteCoverageResponse } from '@/features/insurers/api/insurers';
import GeographicCoverage from '@/components/shared/GeographicCoverage';

export const QUOTE_VALIDITY_PERIOD_UNIT = {
  DAYS: 'days',
  MONTHS: 'months',
  YEARS: 'years',
} as const;

export type QUOTE_VALIDITY_PERIOD_UNIT =
  (typeof QUOTE_VALIDITY_PERIOD_UNIT)[keyof typeof QUOTE_VALIDITY_PERIOD_UNIT];

export type QuoteConfiguratorProps = {
  isLoadingQuoteConfig: boolean;
  isSavingQuoteConfig: boolean;
  onSave: (values?: {
    countryIds: string[];
    regionIds: string[];
    zoneIds: string[];
  }) => Promise<void> | void;
  quoteConfig: any;
  updateQuoteConfig: (section: string, field: string, value: any) => void;
  insurerMetadata?: InsurerMetadata | null;
  metadataError?: string | null;
  quoteConfigError?: string | null;
  quoteCoverageData?: QuoteCoverageResponse | null;
  productId?: string | number;
  productOperatingGeography?: {
    operatingCountries?: Array<{ id: string }>;
    operatingRegions?: Array<{ id: string }>;
    operatingZones?: Array<{ id: string }>;
  } | null;
};

const QuoteConfigurator: React.FC<QuoteConfiguratorProps> = ({
  isLoadingQuoteConfig,
  isSavingQuoteConfig,
  onSave,
  quoteConfig,
  updateQuoteConfig,
  insurerMetadata,
  metadataError,
  quoteConfigError,
  quoteCoverageData,
  productId,
  productOperatingGeography,
}) => {
  const schema = z.object({
    countries: z.array(z.string()).default([]),
    regions: z.array(z.string()).default([]),
    zones: z.array(z.string()).default([]),
    countryIds: z.array(z.string()).default([]),
    regionIds: z.array(z.string()).default([]),
    zoneIds: z.array(z.string()).default([]),
  });
  const { handleSubmit, setValue, reset, watch } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      countries: Array.isArray(quoteConfig?.details?.countries)
        ? quoteConfig.details.countries
        : [],
      regions: Array.isArray(quoteConfig?.details?.regions) ? quoteConfig.details.regions : [],
      zones: Array.isArray(quoteConfig?.details?.zones) ? quoteConfig.details.zones : [],
      countryIds: Array.isArray(quoteConfig?.details?.countryIds)
        ? quoteConfig.details.countryIds
        : [],
      regionIds: Array.isArray(quoteConfig?.details?.regionIds)
        ? quoteConfig.details.regionIds
        : [],
      zoneIds: Array.isArray(quoteConfig?.details?.zoneIds) ? quoteConfig.details.zoneIds : [],
    },
  });
  const [mastersCountries, setMastersCountries] = useState<Array<{ id: string; label: string }>>(
    [],
  );
  const [mastersRegions, setMastersRegions] = useState<
    Array<{ id: string; label: string; countryId: string }>
  >([]);
  const [mastersZones, setMastersZones] = useState<
    Array<{ id: string; label: string; regionId: string }>
  >([]);
  const [mastersLoading, setMastersLoading] = useState(false);
  const [mastersError, setMastersError] = useState<string | null>(null);
  const [localCoverage, setLocalCoverage] = useState<QuoteCoverageResponse | null>(null);
  const [coverageLoading, setCoverageLoading] = useState(false);
  const [coverageError, setCoverageError] = useState<string | null>(null);
  const lastAppliedCoverageKey = useRef<string | null>(null);

  const displayCountries = useMemo(() => {
    const allowed = productOperatingGeography?.operatingCountries;
    if (allowed === undefined) return mastersCountries;
    const idSet = new Set((allowed || []).map((x) => String(x.id)));
    return mastersCountries.filter((c) => idSet.has(c.id));
  }, [mastersCountries, productOperatingGeography?.operatingCountries]);

  const displayRegions = useMemo(() => {
    const allowed = productOperatingGeography?.operatingRegions;
    if (allowed === undefined) return mastersRegions;
    const idSet = new Set((allowed || []).map((x) => String(x.id)));
    return mastersRegions.filter((r) => idSet.has(r.id));
  }, [mastersRegions, productOperatingGeography?.operatingRegions]);

  const displayZones = useMemo(() => {
    const allowed = productOperatingGeography?.operatingZones;
    if (allowed === undefined) return mastersZones;
    const idSet = new Set((allowed || []).map((x) => String(x.id)));
    return mastersZones.filter((z) => idSet.has(z.id));
  }, [mastersZones, productOperatingGeography?.operatingZones]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setMastersLoading(true);
        setMastersError(null);
        const [c, r, z] = await Promise.all([
          listMasterCountries(),
          listMasterRegions(),
          listMasterZones(),
        ]);
        if (!mounted) return;
        setMastersCountries(c.map((x) => ({ id: String(x.id), label: x.label })));
        setMastersRegions(
          r.map((x) => ({ id: String(x.id), label: x.label, countryId: String(x.countryId) })),
        );
        setMastersZones(
          z.map((x) => ({ id: String(x.id), label: x.label, regionId: String(x.regionId) })),
        );
      } catch (e: any) {
        if (!mounted) return;
        setMastersError(e?.message || 'Failed to load masters');
      } finally {
        if (mounted) setMastersLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!productId) return;
      try {
        setCoverageLoading(true);
        setCoverageError(null);
        const resp = await getQuoteCoverage(String(productId));
        if (!mounted) return;
        setLocalCoverage(resp || null);
      } catch (e: any) {
        if (!mounted) return;
        setCoverageError(e?.message || 'Failed to load quote coverage');
      } finally {
        if (mounted) setCoverageLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [productId]);
  const effectiveCoverage = useMemo(() => {
    return quoteCoverageData ?? localCoverage ?? null;
  }, [quoteCoverageData, localCoverage]);
  const queryClient = useQueryClient();
  const detailsQueryKey = useMemo(
    () => ['quote-details', String(productId || 'unknown')],
    [productId],
  );
  const { data: cachedDetails } = useQuery({
    queryKey: detailsQueryKey,
    queryFn: async () => quoteConfig?.details || {},
    initialData: quoteConfig?.details || {},
    staleTime: 60_000,
  });
  useEffect(() => {
    if (quoteConfig?.details) {
      queryClient.setQueryData(detailsQueryKey, quoteConfig.details);
    }
  }, [quoteConfig?.details, queryClient, detailsQueryKey]);
  useEffect(() => {
    const d = (cachedDetails as any) || {};
    reset(
      {
        countries: Array.isArray(d.countries) ? d.countries : [],
        regions: Array.isArray(d.regions) ? d.regions : [],
        zones: Array.isArray(d.zones) ? d.zones : [],
        countryIds: Array.isArray(d.countryIds) ? d.countryIds : [],
        regionIds: Array.isArray(d.regionIds) ? d.regionIds : [],
        zoneIds: Array.isArray(d.zoneIds) ? d.zoneIds : [],
      },
      {
        keepDirtyValues: true,
        keepDirty: true,
      },
    );
  }, [cachedDetails, reset]);
  useEffect(() => {
    const key = effectiveCoverage
      ? `${effectiveCoverage.id}-${(effectiveCoverage as any).updatedAt || (effectiveCoverage as any).updated_at || ''
      }`
      : null;
    if (!effectiveCoverage || lastAppliedCoverageKey.current === key) return;
    if (mastersCountries.length === 0 || mastersRegions.length === 0 || mastersZones.length === 0)
      return;
    const slug = (s: string) =>
      s
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    const countriesById = new Map(mastersCountries.map((c) => [c.id, c.label]));
    const regionsById = new Map(mastersRegions.map((r) => [r.id, r.label]));
    const zonesById = new Map(mastersZones.map((z) => [z.id, z.label]));
    const insurerCountries = (insurerMetadata?.operating_countries || []).map(String);
    const insurerRegions = (insurerMetadata?.operating_regions || []).map((r: any) =>
      String(r?.name || ''),
    );
    const insurerZones = (insurerMetadata?.operating_zones || []).map((z: any) =>
      String(z?.name || ''),
    );
    const insurerCountryBySlug = new Map(insurerCountries.map((n) => [slug(n), n]));
    const insurerRegionBySlug = new Map(insurerRegions.map((n) => [slug(n), n]));
    const insurerZoneBySlug = new Map(insurerZones.map((n) => [slug(n), n]));
    const allowedCountryIds = productOperatingGeography?.operatingCountries?.length
      ? new Set(productOperatingGeography.operatingCountries.map((x) => String(x.id)))
      : null;
    const allowedRegionIds = productOperatingGeography?.operatingRegions?.length
      ? new Set(productOperatingGeography.operatingRegions.map((x) => String(x.id)))
      : null;
    const allowedZoneIds = productOperatingGeography?.operatingZones?.length
      ? new Set(productOperatingGeography.operatingZones.map((x) => String(x.id)))
      : null;
    const countriesIds: string[] = [];
    const regionsIds: string[] = [];
    const zonesIds: string[] = [];
    const countriesLabels: string[] = [];
    const regionsLabels: string[] = [];
    const zonesLabels: string[] = [];
    (effectiveCoverage.geography || []).forEach((g: any) => {
      const id = String(g.masterValueId);
      if (g.masterType === 'country') {
        if (!allowedCountryIds || allowedCountryIds.has(id)) {
          countriesIds.push(id);
          const lbl = countriesById.get(id);
          if (lbl) countriesLabels.push(lbl);
        }
      } else if (g.masterType === 'region') {
        if (!allowedRegionIds || allowedRegionIds.has(id)) {
          regionsIds.push(id);
          const lbl = regionsById.get(id);
          if (lbl) regionsLabels.push(lbl);
        }
      } else if (g.masterType === 'zone') {
        if (!allowedZoneIds || allowedZoneIds.has(id)) {
          zonesIds.push(id);
          const lbl = zonesById.get(id);
          if (lbl) zonesLabels.push(lbl);
        }
      }
    });
    const coverageDisplayCountries = countriesLabels.map(
      (lbl) => insurerCountryBySlug.get(slug(lbl)) || lbl,
    );
    const coverageDisplayRegions = regionsLabels.map(
      (lbl) => insurerRegionBySlug.get(slug(lbl)) || lbl,
    );
    const coverageDisplayZones = zonesLabels.map((lbl) => insurerZoneBySlug.get(slug(lbl)) || lbl);
    const isFirstApply = lastAppliedCoverageKey.current == null;
    reset(
      {
        countries: coverageDisplayCountries.length
          ? coverageDisplayCountries
          : Array.isArray(quoteConfig?.details?.countries)
            ? quoteConfig.details.countries
            : [],
        regions: coverageDisplayRegions.length
          ? coverageDisplayRegions
          : Array.isArray(quoteConfig?.details?.regions)
            ? quoteConfig.details.regions
            : [],
        zones: coverageDisplayZones.length
          ? coverageDisplayZones
          : Array.isArray(quoteConfig?.details?.zones)
            ? quoteConfig.details.zones
            : [],
        countryIds: countriesIds.length
          ? countriesIds
          : Array.isArray(quoteConfig?.details?.countryIds)
            ? quoteConfig.details.countryIds
            : [],
        regionIds: regionsIds.length
          ? regionsIds
          : Array.isArray(quoteConfig?.details?.regionIds)
            ? quoteConfig.details.regionIds
            : [],
        zoneIds: zonesIds.length
          ? zonesIds
          : Array.isArray(quoteConfig?.details?.zoneIds)
            ? quoteConfig.details.zoneIds
            : [],
      },
      { keepDirtyValues: !isFirstApply },
    );
    updateQuoteConfig(
      'details',
      'countries',
      coverageDisplayCountries.length
        ? coverageDisplayCountries
        : quoteConfig?.details?.countries || [],
    );
    updateQuoteConfig(
      'details',
      'regions',
      coverageDisplayRegions.length ? coverageDisplayRegions : quoteConfig?.details?.regions || [],
    );
    updateQuoteConfig(
      'details',
      'zones',
      coverageDisplayZones.length ? coverageDisplayZones : quoteConfig?.details?.zones || [],
    );
    updateQuoteConfig(
      'details',
      'countryIds',
      countriesIds.length ? countriesIds : quoteConfig?.details?.countryIds || [],
    );
    updateQuoteConfig(
      'details',
      'regionIds',
      regionsIds.length ? regionsIds : quoteConfig?.details?.regionIds || [],
    );
    updateQuoteConfig(
      'details',
      'zoneIds',
      zonesIds.length ? zonesIds : quoteConfig?.details?.zoneIds || [],
    );
    lastAppliedCoverageKey.current = key;
  }, [
    effectiveCoverage,
    mastersCountries,
    mastersRegions,
    mastersZones,
    productOperatingGeography,
  ]);
  const onSubmit = (values: z.infer<typeof schema>) => {
    updateQuoteConfig('details', 'countries', values.countries || []);
    updateQuoteConfig('details', 'regions', values.regions || []);
    updateQuoteConfig('details', 'zones', values.zones || []);
    updateQuoteConfig('details', 'countryIds', values.countryIds || []);
    updateQuoteConfig('details', 'regionIds', values.regionIds || []);
    updateQuoteConfig('details', 'zoneIds', values.zoneIds || []);
    queryClient.setQueryData(detailsQueryKey, (prev: any) => ({
      ...(prev || {}),
      countries: values.countries || [],
      regions: values.regions || [],
      zones: values.zones || [],
      countryIds: values.countryIds || [],
      regionIds: values.regionIds || [],
      zoneIds: values.zoneIds || [],
    }));
    onSave?.({
      countryIds: values.countryIds || [],
      regionIds: values.regionIds || [],
      zoneIds: values.zoneIds || [],
    });
  };
  const onCountryIdsChange = (ids: string[]) => {
    setValue('countryIds', ids, { shouldDirty: true });
    updateQuoteConfig('details', 'countryIds', ids);
    const countryLabels = displayCountries.filter((c) => ids.includes(c.id)).map((c) => c.label);
    setValue('countries', countryLabels, { shouldDirty: true });
    updateQuoteConfig('details', 'countries', countryLabels);
    const validRegions = displayRegions.filter((r) => ids.includes(r.countryId));
    const currentRegionIds = (watch('regionIds') || []) as string[];
    const nextRegionIds = currentRegionIds.filter((id) => validRegions.some((r) => r.id === id));
    setValue('regionIds', nextRegionIds, { shouldDirty: true });
    updateQuoteConfig('details', 'regionIds', nextRegionIds);
    const nextRegionLabels = displayRegions
      .filter((r) => nextRegionIds.includes(r.id))
      .map((r) => r.label);
    setValue('regions', nextRegionLabels, { shouldDirty: true });
    updateQuoteConfig('details', 'regions', nextRegionLabels);
    const validZones = displayZones.filter((z) => nextRegionIds.includes(z.regionId));
    const currentZoneIds = (watch('zoneIds') || []) as string[];
    const nextZoneIds = currentZoneIds.filter((id) => validZones.some((z) => z.id === id));
    setValue('zoneIds', nextZoneIds, { shouldDirty: true });
    updateQuoteConfig('details', 'zoneIds', nextZoneIds);
    const nextZoneLabels = displayZones
      .filter((z) => nextZoneIds.includes(z.id))
      .map((z) => z.label);
    setValue('zones', nextZoneLabels, { shouldDirty: true });
    updateQuoteConfig('details', 'zones', nextZoneLabels);
    queryClient.setQueryData(detailsQueryKey, (prev: any) => ({
      ...(prev || {}),
      countryIds: ids,
      countries: countryLabels,
      regionIds: nextRegionIds,
      regions: nextRegionLabels,
      zoneIds: nextZoneIds,
      zones: nextZoneLabels,
    }));
  };
  const onRegionIdsChange = (ids: string[]) => {
    setValue('regionIds', ids, { shouldDirty: true });
    updateQuoteConfig('details', 'regionIds', ids);
    const regionLabels = displayRegions.filter((r) => ids.includes(r.id)).map((r) => r.label);
    setValue('regions', regionLabels, { shouldDirty: true });
    updateQuoteConfig('details', 'regions', regionLabels);
    const validZones = displayZones.filter((z) => ids.includes(z.regionId));
    const currentZoneIds = (watch('zoneIds') || []) as string[];
    const nextZoneIds = currentZoneIds.filter((id) => validZones.some((z) => z.id === id));
    setValue('zoneIds', nextZoneIds, { shouldDirty: true });
    updateQuoteConfig('details', 'zoneIds', nextZoneIds);
    const nextZoneLabels = displayZones
      .filter((z) => nextZoneIds.includes(z.id))
      .map((z) => z.label);
    setValue('zones', nextZoneLabels, { shouldDirty: true });
    updateQuoteConfig('details', 'zones', nextZoneLabels);
    queryClient.setQueryData(detailsQueryKey, (prev: any) => ({
      ...(prev || {}),
      regionIds: ids,
      regions: regionLabels,
      zoneIds: nextZoneIds,
      zones: nextZoneLabels,
    }));
  };
  const onZoneIdsChange = (ids: string[]) => {
    setValue('zoneIds', ids, { shouldDirty: true });
    updateQuoteConfig('details', 'zoneIds', ids);
    const zoneLabels = displayZones.filter((z) => ids.includes(z.id)).map((z) => z.label);
    setValue('zones', zoneLabels, { shouldDirty: true });
    updateQuoteConfig('details', 'zones', zoneLabels);
    queryClient.setQueryData(detailsQueryKey, (prev: any) => ({
      ...(prev || {}),
      zoneIds: ids,
      zones: zoneLabels,
    }));
  };
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Quote Coverage Configuration</CardTitle>
            <CardDescription>
              Configure quotation coverage and operating regions
            </CardDescription>
          </div>
          <Button
            type="button"
            onClick={handleSubmit(onSubmit)}
            size="sm"
            disabled={isSavingQuoteConfig}
          >
            {isSavingQuoteConfig ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Quote Coverage
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoadingQuoteConfig ? (
          <div className="space-y-6">
            {/* Form Fields Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-36"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>


          </div>
        ) : (
          <>
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Geographic Coverage
              </h3>
              {metadataError && (
                <div className="text-sm rounded-md border border-destructive/20 bg-destructive/10 text-destructive px-3 py-2 mb-4">
                  {metadataError}
                </div>
              )}
              {quoteConfigError && (
                <div className="text-sm rounded-md border border-destructive/20 bg-destructive/10 text-destructive px-3 py-2 mb-4">
                  {quoteConfigError}
                </div>
              )}
              <GeographicCoverage
                countries={displayCountries}
                regions={displayRegions}
                zones={displayZones}
                selectedCountries={watch('countryIds') || []}
                selectedRegions={watch('regionIds') || []}
                selectedZones={watch('zoneIds') || []}
                onCountriesChange={onCountryIdsChange}
                onRegionsChange={onRegionIdsChange}
                onZonesChange={onZoneIdsChange}
                showTitle={false}
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default QuoteConfigurator;
