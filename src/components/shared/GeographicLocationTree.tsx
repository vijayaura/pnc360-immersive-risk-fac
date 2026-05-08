import { useState, useMemo, useRef, useEffect } from 'react';
import { MapPin, Globe, Building2, ChevronRight } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/shared/utils/lib-utils';
import { getCountryFlag } from '@/lib/country-flag';
import type { Country, Region, Zone } from '@/features/product-config/masters/api/masters';

interface GeographicLocationTreeProps {
  countries: Country[];
  regions: Region[];
  zones: Zone[];
  regionsByCountry: Map<string, Region[]>;
  zonesByRegion: Map<string, Zone[]>;
  searchQuery: string;
  isCountrySelected: (countryId: string) => boolean;
  isRegionSelected: (regionId: string) => boolean;
  isZoneSelected: (zoneId: string) => boolean;
  isCountryIndeterminate: (countryId: string) => boolean;
  isRegionIndeterminate: (regionId: string) => boolean;
  toggleCountry: (countryId: string) => void;
  toggleRegion: (regionId: string) => void;
  toggleZone: (zoneId: string) => void;
  columnHeight?: string;
  disabled?: boolean;
}

export function GeographicLocationTree({
  countries,
  regions,
  zones,
  regionsByCountry,
  zonesByRegion,
  searchQuery,
  isCountrySelected,
  isRegionSelected,
  isZoneSelected,
  isCountryIndeterminate,
  isRegionIndeterminate,
  toggleCountry,
  toggleRegion,
  toggleZone,
  columnHeight = 'h-[280px]',
  disabled = false,
}: GeographicLocationTreeProps) {
  const [activeCountryId, setActiveCountryId] = useState<string | null>(null);
  const [activeRegionId, setActiveRegionId] = useState<string | null>(null);
  const hasInitializedExpansion = useRef(false);
  const query = searchQuery.toLowerCase().trim();

  useEffect(() => {
    if (hasInitializedExpansion.current || countries.length === 0) return;
    hasInitializedExpansion.current = true;
    const firstCountry = countries[0];
    setActiveCountryId(firstCountry.id);
    const firstRegions = regionsByCountry.get(firstCountry.id) ?? [];
    const firstRegion = firstRegions[0];
    if (firstRegion) setActiveRegionId(firstRegion.id);
  }, [countries, regionsByCountry]);

  const filteredCountries = useMemo(() => {
    if (!query) return countries;
    return countries.filter((c) => {
      if (c.label.toLowerCase().includes(query)) return true;
      const countryRegions = regionsByCountry.get(c.id) ?? [];
      return countryRegions.some((r) => {
        if (r.label.toLowerCase().includes(query)) return true;
        const regionZones = zonesByRegion.get(r.id) ?? [];
        return regionZones.some((z) => z.label.toLowerCase().includes(query));
      });
    });
  }, [countries, query, regionsByCountry, zonesByRegion]);

  const filteredRegions = useMemo(() => {
    if (!query) return [];
    return regions.filter(
      (r) =>
        r.label.toLowerCase().includes(query) ||
        (zonesByRegion.get(r.id) ?? []).some((z) => z.label.toLowerCase().includes(query))
    );
  }, [regions, query, zonesByRegion]);

  const filteredZones = useMemo(() => {
    if (!query) return [];
    return zones.filter((z) => z.label.toLowerCase().includes(query));
  }, [zones, query]);

  const activeRegions = useMemo(() => {
    if (query) return filteredRegions;
    if (!activeCountryId) return [];
    return regionsByCountry.get(activeCountryId) ?? [];
  }, [query, activeCountryId, regionsByCountry, filteredRegions]);

  const activeZones = useMemo(() => {
    if (query) return filteredZones;
    if (!activeRegionId) return [];
    return zonesByRegion.get(activeRegionId) ?? [];
  }, [query, activeRegionId, zonesByRegion, filteredZones]);

  const highlight = (text: string) => {
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query);
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span className="bg-accent text-accent-foreground font-semibold rounded px-0.5">
          {text.slice(idx, idx + query.length)}
        </span>
        {text.slice(idx + query.length)}
      </>
    );
  };

  if (filteredCountries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <MapPin className="h-10 w-10 mb-3 opacity-40" />
        <p className="text-sm">No locations match your search.</p>
      </div>
    );
  }

  const headerHeightPx = 36;
  const scrollHeightPx = 320 - headerHeightPx;

  return (
    <div className="grid grid-cols-3 gap-0 w-full h-[320px] min-h-[320px] overflow-hidden">
      {/* Column 1: Countries */}
      <div className="flex flex-col min-w-0 min-h-0 h-full border-r border-border overflow-hidden">
        <div className="px-3 py-2 border-b bg-muted/30 shrink-0">
          <div className="flex items-center gap-1.5 h-[1.5rem]">
            <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
              Countries
            </span>
            <span className="text-[10px] text-muted-foreground ml-auto shrink-0">{filteredCountries.length}</span>
          </div>
        </div>
        <ScrollArea
          className="min-h-0 flex-1 overflow-hidden"
          style={{ height: scrollHeightPx, maxHeight: scrollHeightPx }}
        >
          <div className="py-1">
            {filteredCountries.map((country) => (
              <div
                key={country.id}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors group',
                  activeCountryId === country.id ? 'bg-muted/60' : 'hover:bg-muted/50'
                )}
              >
                <Checkbox
                  checked={
                    isCountryIndeterminate(country.id) ? 'indeterminate' : isCountrySelected(country.id)
                  }
                  onCheckedChange={() => {
                    toggleCountry(country.id);
                    setActiveCountryId(country.id);
                    setActiveRegionId(null);
                    const countryRegions = regionsByCountry.get(country.id) ?? [];
                    const firstRegion = countryRegions[0];
                    if (firstRegion) {
                      setActiveRegionId(firstRegion.id);
                    }
                  }}
                  className="h-3.5 w-3.5 shrink-0"
                  disabled={disabled}
                />
                <div
                  className="flex items-center gap-1.5 flex-1 min-w-0"
                  onClick={() => {
                    setActiveCountryId(country.id);
                    const countryRegions = regionsByCountry.get(country.id) ?? [];
                    const firstRegion = countryRegions[0];
                    setActiveRegionId(firstRegion ? firstRegion.id : null);
                  }}
                >
                  {getCountryFlag(country) ? (
                    <span className="text-base leading-none shrink-0" aria-hidden>
                      {getCountryFlag(country)}
                    </span>
                  ) : null}
                  <span className="text-sm truncate">{highlight(country.label)}</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveCountryId(country.id);
                    const countryRegions = regionsByCountry.get(country.id) ?? [];
                    const firstRegion = countryRegions[0];
                    setActiveRegionId(firstRegion ? firstRegion.id : null);
                  }}
                  className="p-0.5 rounded hover:bg-muted/70 text-muted-foreground opacity-0 group-hover:opacity-100 hover:opacity-100 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                  aria-label={`Expand ${country.label}`}
                >
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Column 2: Regions */}
      <div className="flex flex-col min-w-0 min-h-0 h-full border-r border-border overflow-hidden">
        <div className="px-3 py-2 border-b bg-muted/30 shrink-0">
          <div className="flex items-center gap-1.5 h-[1.5rem]">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
              Regions
            </span>
            {(query || activeCountryId) && (
              <span className="text-[10px] text-muted-foreground ml-auto shrink-0">{activeRegions.length}</span>
            )}
          </div>
        </div>
        <ScrollArea
          className="min-h-0 flex-1 overflow-hidden"
          style={{ height: scrollHeightPx, maxHeight: scrollHeightPx }}
        >
          {!query && !activeCountryId ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-muted-foreground">
              <Building2 className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-xs">Select a country</p>
            </div>
          ) : activeRegions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-muted-foreground">
              <p className="text-xs">No regions available</p>
            </div>
          ) : (
            <div className="py-1">
              {activeRegions.map((region) => (
                <div
                  key={region.id}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors group',
                    activeRegionId === region.id ? 'bg-muted/60' : 'hover:bg-muted/50'
                  )}
                >
                  <Checkbox
                    checked={
                      isRegionIndeterminate(region.id) ? 'indeterminate' : isRegionSelected(region.id)
                    }
                    onCheckedChange={() => {
                      toggleRegion(region.id);
                      setActiveRegionId(region.id);
                    }}
                    className="h-3.5 w-3.5 shrink-0"
                    disabled={disabled}
                  />
                  <div
                    className="flex items-center gap-1.5 flex-1 min-w-0"
                    onClick={() => setActiveRegionId(region.id)}
                  >
                    <span className="text-sm truncate">{highlight(region.label)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveRegionId(region.id);
                    }}
                    className="p-0.5 rounded hover:bg-muted/70 text-muted-foreground opacity-0 group-hover:opacity-100 hover:opacity-100 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                    aria-label={`Expand ${region.label}`}
                  >
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Column 3: Zones */}
      <div className="flex flex-col min-w-0 min-h-0 h-full overflow-hidden">
        <div className="px-3 py-2 border-b bg-muted/30 shrink-0">
          <div className="flex items-center gap-1.5 h-[1.5rem]">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
              Zones
            </span>
            {(query || activeRegionId) && (
              <span className="text-[10px] text-muted-foreground ml-auto shrink-0">{activeZones.length}</span>
            )}
          </div>
        </div>
        <ScrollArea
          className="min-h-0 flex-1 overflow-hidden"
          style={{ height: scrollHeightPx, maxHeight: scrollHeightPx }}
        >
          {!query && !activeRegionId ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-muted-foreground">
              <MapPin className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-xs">Select a region</p>
            </div>
          ) : activeZones.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-muted-foreground">
              <p className="text-xs">No zones available</p>
            </div>
          ) : (
            <div className="py-1">
              {activeZones.map((zone) => (
                <div
                  key={zone.id}
                  className="flex items-center gap-2 px-3 py-1.5 hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    checked={isZoneSelected(zone.id)}
                    onCheckedChange={() => toggleZone(zone.id)}
                    className="h-3.5 w-3.5 shrink-0"
                    disabled={disabled}
                  />
                  <span className="text-sm truncate">{highlight(zone.label)}</span>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
