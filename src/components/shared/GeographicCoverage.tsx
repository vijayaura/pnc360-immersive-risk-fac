import { useState } from 'react';
import { MapPin, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { GeographicLocationTree } from '@/components/shared/GeographicLocationTree';
import { GeographicSelectionSummary } from '@/components/shared/GeographicSelectionSummary';
import { useGeographicSelection } from '@/features/product-config/hooks/useGeographicSelection';
import type { Country, Region, Zone } from '@/features/product-config/masters/api/masters';

export type GeoCountry = { id: string; label: string };
export type GeoRegion = { id: string; label: string; countryId: string };
export type GeoZone = { id: string; label: string; regionId: string };

type Props = {
  countries: (Country | GeoCountry)[];
  regions: (Region | GeoRegion)[];
  zones: (Zone | GeoZone)[];
  selectedCountries: string[];
  selectedRegions: string[];
  selectedZones: string[];
  onCountriesChange: (ids: string[]) => void;
  onRegionsChange: (ids: string[]) => void;
  onZonesChange: (ids: string[]) => void;
  required?: boolean;
  showTitle?: boolean;
  countriesError?: string;
  regionsError?: string;
  zonesError?: string;
  disabled?: boolean;
};

export default function GeographicCoverage({
  countries,
  regions,
  zones,
  selectedCountries,
  selectedRegions,
  selectedZones,
  onCountriesChange,
  onRegionsChange,
  onZonesChange,
  required = false,
  showTitle = true,
  countriesError,
  regionsError,
  zonesError,
  disabled = false,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');

  const geographicSelection = useGeographicSelection({
    countries: countries as Country[],
    regions: regions as Region[],
    zones: zones as Zone[],
    selectedCountryIds: selectedCountries,
    selectedRegionIds: selectedRegions,
    selectedZoneIds: selectedZones,
    onCountriesChange,
    onRegionsChange,
    onZonesChange,
  });

  const hasError = countriesError || regionsError || zonesError;
  const errorMessage = countriesError || regionsError || zonesError;

  return (
    <div className={showTitle ? 'pt-6 border-t' : 'pt-0'}>
      {showTitle && (
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Geographic Coverage
          {required && <span className="text-destructive">*</span>}
        </h3>
      )}

      <div className="space-y-4">
        <div className="relative mx-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search countries, regions, or zones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9 bg-muted/50 border-0 focus-visible:ring-1"
            disabled={disabled}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-sm hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          <div className="xl:col-span-3 rounded-xl border bg-card overflow-hidden min-w-0">
            <GeographicLocationTree
              countries={countries as Country[]}
              regions={regions as Region[]}
              zones={zones as Zone[]}
              regionsByCountry={geographicSelection.regionsByCountry}
              zonesByRegion={geographicSelection.zonesByRegion}
              searchQuery={searchQuery}
              isCountrySelected={geographicSelection.isCountrySelected}
              isRegionSelected={geographicSelection.isRegionSelected}
              isZoneSelected={geographicSelection.isZoneSelected}
              isCountryIndeterminate={geographicSelection.isCountryIndeterminate}
              isRegionIndeterminate={geographicSelection.isRegionIndeterminate}
              toggleCountry={geographicSelection.toggleCountry}
              toggleRegion={geographicSelection.toggleRegion}
              toggleZone={geographicSelection.toggleZone}
              columnHeight="h-[280px]"
              disabled={disabled}
            />
          </div>
          <div className="xl:col-span-1">
            <div className="rounded-xl border bg-card p-4 h-full min-h-[320px]">
              <GeographicSelectionSummary
                summary={geographicSelection.getSummary()}
                totalSelected={geographicSelection.totalSelected}
                onRemoveZone={geographicSelection.removeZone}
                onClearAll={geographicSelection.clearAll}
                scrollHeight="h-[280px]"
                disabled={disabled}
              />
            </div>
          </div>
        </div>
      </div>

      {hasError && (
        <div className="text-sm text-destructive mt-4">
          <p>• {errorMessage}</p>
        </div>
      )}
    </div>
  );
}
