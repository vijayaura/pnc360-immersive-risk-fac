import { useCallback, useMemo } from 'react';
import type { Country, Region, Zone } from '@/features/product-config/masters/api/masters';

export interface GeographicSelectionInput {
  countries: Country[];
  regions: Region[];
  zones: Zone[];
  selectedCountryIds: string[];
  selectedRegionIds: string[];
  selectedZoneIds: string[];
  onCountriesChange: (ids: string[]) => void;
  onRegionsChange: (ids: string[]) => void;
  onZonesChange: (ids: string[]) => void;
}

export interface SummaryEntry {
  country: Country;
  regions: { region: Region; zones: Zone[] }[];
}

export function useGeographicSelection({
  countries,
  regions,
  zones,
  selectedZoneIds,
  onCountriesChange,
  onRegionsChange,
  onZonesChange,
}: GeographicSelectionInput) {
  const regionsByCountry = useMemo(() => {
    const map = new Map<string, Region[]>();
    regions.forEach((r) => {
      const list = map.get(r.countryId) ?? [];
      list.push(r);
      map.set(r.countryId, list);
    });
    return map;
  }, [regions]);

  const zonesByRegion = useMemo(() => {
    const map = new Map<string, Zone[]>();
    zones.forEach((z) => {
      const list = map.get(z.regionId) ?? [];
      list.push(z);
      map.set(z.regionId, list);
    });
    return map;
  }, [zones]);

  const deriveRegionAndCountryFromZones = useCallback(
    (zoneIds: string[]) => {
      const regionIdsSet = new Set<string>();
      const countryIdsSet = new Set<string>();
      zoneIds.forEach((zoneId) => {
        const zone = zones.find((z) => z.id === zoneId);
        if (!zone) return;
        regionIdsSet.add(zone.regionId);
        const region = regions.find((r) => r.id === zone.regionId);
        if (region) countryIdsSet.add(region.countryId);
      });
      return {
        regionIds: Array.from(regionIdsSet),
        countryIds: Array.from(countryIdsSet),
      };
    },
    [zones, regions]
  );

  const toggleZone = useCallback(
    (zoneId: string) => {
      const next = selectedZoneIds.includes(zoneId)
        ? selectedZoneIds.filter((id) => id !== zoneId)
        : [...selectedZoneIds, zoneId];
      onZonesChange(next);
      const { regionIds, countryIds } = deriveRegionAndCountryFromZones(next);
      onRegionsChange(regionIds);
      onCountriesChange(countryIds);
    },
    [selectedZoneIds, onZonesChange, onRegionsChange, onCountriesChange, deriveRegionAndCountryFromZones]
  );

  const toggleRegion = useCallback(
    (regionId: string) => {
      const regionZones = zonesByRegion.get(regionId) ?? [];
      const isRegionFullySelected = regionZones.every((z) => selectedZoneIds.includes(z.id));
      const nextZoneIds = isRegionFullySelected
        ? selectedZoneIds.filter((id) => !regionZones.some((z) => z.id === id))
        : [...new Set([...selectedZoneIds, ...regionZones.map((z) => z.id)])];
      onZonesChange(nextZoneIds);
      const { regionIds, countryIds } = deriveRegionAndCountryFromZones(nextZoneIds);
      onRegionsChange(regionIds);
      onCountriesChange(countryIds);
    },
    [
      zonesByRegion,
      selectedZoneIds,
      onZonesChange,
      onRegionsChange,
      onCountriesChange,
      deriveRegionAndCountryFromZones,
    ]
  );

  const toggleCountry = useCallback(
    (countryId: string) => {
      const countryRegions = regionsByCountry.get(countryId) ?? [];
      const allZonesInCountry = countryRegions.flatMap((r) => zonesByRegion.get(r.id) ?? []);
      const isCountryFullySelected = countryRegions.every((r) =>
        (zonesByRegion.get(r.id) ?? []).every((z) => selectedZoneIds.includes(z.id))
      );
      const nextZoneIds = isCountryFullySelected
        ? selectedZoneIds.filter((id) => !allZonesInCountry.some((z) => z.id === id))
        : [...new Set([...selectedZoneIds, ...allZonesInCountry.map((z) => z.id)])];
      onZonesChange(nextZoneIds);
      const { regionIds, countryIds } = deriveRegionAndCountryFromZones(nextZoneIds);
      onRegionsChange(regionIds);
      onCountriesChange(countryIds);
    },
    [
      regionsByCountry,
      zonesByRegion,
      selectedZoneIds,
      onZonesChange,
      onRegionsChange,
      onCountriesChange,
      deriveRegionAndCountryFromZones,
    ]
  );

  const isCountrySelected = useCallback(
    (countryId: string) => {
      const countryRegions = regionsByCountry.get(countryId) ?? [];
      return (
        countryRegions.length > 0 &&
        countryRegions.every((r) => {
          const zs = zonesByRegion.get(r.id) ?? [];
          return zs.every((z) => selectedZoneIds.includes(z.id));
        })
      );
    },
    [regionsByCountry, zonesByRegion, selectedZoneIds]
  );

  const isRegionSelected = useCallback(
    (regionId: string) => {
      const zs = zonesByRegion.get(regionId) ?? [];
      return zs.length > 0 && zs.every((z) => selectedZoneIds.includes(z.id));
    },
    [zonesByRegion, selectedZoneIds]
  );

  const isZoneSelected = useCallback(
    (zoneId: string) => selectedZoneIds.includes(zoneId),
    [selectedZoneIds]
  );

  const isCountryIndeterminate = useCallback(
    (countryId: string) => {
      if (isCountrySelected(countryId)) return false;
      const countryRegions = regionsByCountry.get(countryId) ?? [];
      return countryRegions.some((r) => {
        const zs = zonesByRegion.get(r.id) ?? [];
        return zs.some((z) => selectedZoneIds.includes(z.id));
      });
    },
    [regionsByCountry, zonesByRegion, selectedZoneIds, isCountrySelected]
  );

  const isRegionIndeterminate = useCallback(
    (regionId: string) => {
      if (isRegionSelected(regionId)) return false;
      const zs = zonesByRegion.get(regionId) ?? [];
      return zs.some((z) => selectedZoneIds.includes(z.id));
    },
    [zonesByRegion, selectedZoneIds, isRegionSelected]
  );

  const removeZone = useCallback(
    (zoneId: string) => {
      toggleZone(zoneId);
    },
    [toggleZone]
  );

  const clearAll = useCallback(() => {
    onCountriesChange([]);
    onRegionsChange([]);
    onZonesChange([]);
  }, [onCountriesChange, onRegionsChange, onZonesChange]);

  const totalSelected = selectedZoneIds.length;

  const getSummary = useCallback((): SummaryEntry[] => {
    const result: SummaryEntry[] = [];
    const countryIdsUsed = new Set<string>();
    selectedZoneIds.forEach((zoneId) => {
      const zone = zones.find((z) => z.id === zoneId);
      if (!zone) return;
      const region = regions.find((r) => r.id === zone.regionId);
      if (!region) return;
      countryIdsUsed.add(region.countryId);
    });

    countryIdsUsed.forEach((countryId) => {
      const country = countries.find((c) => c.id === countryId);
      if (!country) return;
      const countryRegions = regionsByCountry.get(countryId) ?? [];
      const regionEntries: { region: Region; zones: Zone[] }[] = [];
      countryRegions.forEach((region) => {
        const regionZones = (zonesByRegion.get(region.id) ?? []).filter((z) =>
          selectedZoneIds.includes(z.id)
        );
        if (regionZones.length > 0) {
          regionEntries.push({ region, zones: regionZones });
        }
      });
      if (regionEntries.length > 0) {
        result.push({ country, regions: regionEntries });
      }
    });

    result.sort((a, b) => a.country.label.localeCompare(b.country.label));
    result.forEach((entry) => {
      entry.regions.sort((a, b) => a.region.label.localeCompare(b.region.label));
    });
    return result;
  }, [
    countries,
    regions,
    zones,
    regionsByCountry,
    zonesByRegion,
    selectedZoneIds,
  ]);

  return {
    toggleCountry,
    toggleRegion,
    toggleZone,
    isCountrySelected,
    isRegionSelected,
    isZoneSelected,
    isCountryIndeterminate,
    isRegionIndeterminate,
    getSummary,
    totalSelected,
    removeZone,
    clearAll,
    regionsByCountry,
    zonesByRegion,
  };
}
