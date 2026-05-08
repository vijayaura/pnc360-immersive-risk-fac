/// <reference types="google.maps" />
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronUp, Search, AlertCircle, Loader2 } from 'lucide-react';
import { ENV } from '@/config/env';
import { cn } from '@/shared/utils/lib-utils';
import {
  GOOGLE_MAPS_LIBRARIES,
  GOOGLE_MAPS_PREVENT_FONTS_LOADING,
  GOOGLE_MAPS_SCRIPT_ID,
} from '@/shared/constants/googleMapsLoader';
import type { ReinsuranceSummary, ReinsurerPolicyRecord } from '../../types';
import { formatCurrencyCompact } from '@/shared/utils/lib-utils';

const UAE_CENTER = { lat: 25.2048, lng: 55.2708 };
const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' };
const GEO_SELECT_NONE = '__none__';
const RADIUS_SELECT_NONE = 'none';

const UAE_AREAS = [
  { id: 'dubai', name: 'Dubai', center: { lat: 25.2048, lng: 55.2708 } },
  { id: 'abu-dhabi', name: 'Abu Dhabi', center: { lat: 24.4539, lng: 54.3773 } },
  { id: 'sharjah', name: 'Sharjah', center: { lat: 25.3573, lng: 55.4033 } },
  { id: 'ajman', name: 'Ajman', center: { lat: 25.4052, lng: 55.5136 } },
  { id: 'ras-al-khaimah', name: 'Ras Al Khaimah', center: { lat: 25.7889, lng: 55.9597 } },
  { id: 'fujairah', name: 'Fujairah', center: { lat: 25.1288, lng: 56.3264 } },
  { id: 'umm-al-quwain', name: 'Umm Al Quwain', center: { lat: 25.5650, lng: 55.5552 } },
];

const RISK_POINTS = [
  { id: '1', lat: 25.2048, lng: 55.2708, area: 'Dubai', sumInsured: 50000000, riskLevel: 'High', projects: 15 },
  { id: '2', lat: 25.2148, lng: 55.2808, area: 'Dubai', sumInsured: 30000000, riskLevel: 'Medium', projects: 8 },
  { id: '3', lat: 24.4539, lng: 54.3773, area: 'Abu Dhabi', sumInsured: 75000000, riskLevel: 'High', projects: 22 },
  { id: '4', lat: 24.4639, lng: 54.3873, area: 'Abu Dhabi', sumInsured: 20000000, riskLevel: 'Low', projects: 5 },
  { id: '5', lat: 25.3573, lng: 55.4033, area: 'Sharjah', sumInsured: 40000000, riskLevel: 'Medium', projects: 12 },
  { id: '6', lat: 25.4052, lng: 55.5136, area: 'Ajman', sumInsured: 15000000, riskLevel: 'Low', projects: 4 },
  { id: '7', lat: 25.7889, lng: 55.9597, area: 'Ras Al Khaimah', sumInsured: 25000000, riskLevel: 'Medium', projects: 7 },
  { id: '8', lat: 25.1288, lng: 56.3264, area: 'Fujairah', sumInsured: 18000000, riskLevel: 'Low', projects: 3 },
  { id: '9', lat: 25.5650, lng: 55.5552, area: 'Umm Al Quwain', sumInsured: 14000000, riskLevel: 'Low', projects: 3 },
  { id: '10', lat: 25.1900, lng: 55.2700, area: 'Dubai', sumInsured: 42000000, riskLevel: 'High', projects: 14 },
  { id: '11', lat: 24.4600, lng: 54.3800, area: 'Abu Dhabi', sumInsured: 55000000, riskLevel: 'High', projects: 19 },
];

const COVERAGE_RADIUS_OPTIONS: { label: string; meters: number }[] = [
  { label: '500 m', meters: 500 },
  { label: '1 km', meters: 1_000 },
  { label: '2 km', meters: 2_000 },
  { label: '5 km', meters: 5_000 },
  { label: '10 km', meters: 10_000 },
  { label: '25 km', meters: 25_000 },
  { label: '50 km', meters: 50_000 },
];

const heatGradient = [
  'rgba(255, 255, 255, 0)',
  'rgba(255, 245, 157, 0.5)',
  'rgba(255, 204, 128, 0.7)',
  'rgba(255, 138, 101, 0.85)',
  'rgba(239, 83, 80, 0.92)',
  'rgba(198, 40, 40, 1)',
];

const legendItems = [
  { label: 'Low', color: '#fff59d' },
  { label: 'Medium', color: '#ffb74d' },
  { label: 'High', color: '#ef5350' },
  { label: 'Peak', color: '#c62828' },
];

function applyGeocodeGeometryToMap(
  map: google.maps.Map,
  geometry: google.maps.GeocoderGeometry | google.maps.places.PlaceGeometry,
) {
  if (geometry.viewport) {
    map.fitBounds(geometry.viewport);
    return;
  }
  if ('bounds' in geometry && geometry.bounds) {
    map.fitBounds(geometry.bounds);
    return;
  }
  const loc = geometry.location;
  if (loc) {
    map.panTo(loc);
    const z = map.getZoom();
    if (z == null || z < 10) map.setZoom(11);
  }
}

interface RiskAccumulationSectionProps {
  summary: ReinsuranceSummary | null;
  allRecords?: ReinsurerPolicyRecord[];
}

export function RiskAccumulationSection({ summary, allRecords = [] }: RiskAccumulationSectionProps) {
  const resolvedApiKey = ENV.GOOGLE_MAPS_API_KEY.trim();

  const [isExpanded, setIsExpanded] = useState(true);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [radiusSelection, setRadiusSelection] = useState<string>(RADIUS_SELECT_NONE);
  const [pinCenter, setPinCenter] = useState<{ lat: number; lng: number } | null>(null);

  const heatmapLayerRef = useRef<google.maps.visualization.HeatmapLayer | null>(null);
  const radiusCircleRef = useRef<google.maps.Circle | null>(null);
  const searchMarkerRef = useRef<google.maps.Marker | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: GOOGLE_MAPS_SCRIPT_ID,
    googleMapsApiKey: resolvedApiKey,
    libraries: GOOGLE_MAPS_LIBRARIES,
    preventGoogleFontsLoading: GOOGLE_MAPS_PREVENT_FONTS_LOADING,
  });

  const onMapLoaded = useCallback((m: google.maps.Map) => setMap(m), []);

  // --- Computed data ---

  const locationCounts = useMemo(() => {
    if (allRecords.length === 0) return { countries: 0, regions: 0, cities: 0 };
    const locations = new Set<string>();
    allRecords.forEach((r) => {
      if (r.location) locations.add(r.location.trim().toLowerCase());
    });
    const count = locations.size;
    return {
      countries: Math.max(count, 0),
      regions: Math.min(count * 2, allRecords.length),
      cities: Math.min(count * 3, allRecords.length),
    };
  }, [allRecords]);

  const filteredPoints = useMemo(() => {
    if (selectedCountry) {
      const area = UAE_AREAS.find((a) => a.id === selectedCountry);
      if (area) return RISK_POINTS.filter((p) => p.area === area.name);
    }
    return RISK_POINTS;
  }, [selectedCountry]);

  const exposureByCountry = summary?.totalSumInsured ?? filteredPoints.reduce((s, p) => s + p.sumInsured, 0);
  const exposureByRegion = Math.round(exposureByCountry * 0.667);
  const exposureByCity = Math.round(exposureByCountry * 0.416);


  // --- Search helpers ---

  const focusMapFromGeometry = useCallback(
    (geometry: google.maps.GeocoderGeometry | google.maps.places.PlaceGeometry) => {
      if (!map) return;
      applyGeocodeGeometryToMap(map, geometry);
    },
    [map],
  );

  const setSearchMarker = useCallback(
    (position: google.maps.LatLng | google.maps.LatLngLiteral) => {
      if (!map) return;
      const lat = typeof position.lat === 'function' ? position.lat() : position.lat;
      const lng = typeof position.lng === 'function' ? position.lng() : position.lng;
      setPinCenter({ lat, lng });

      if (searchMarkerRef.current) {
        searchMarkerRef.current.setMap(null);
        searchMarkerRef.current = null;
      }
      searchMarkerRef.current = new google.maps.Marker({
        map,
        position: { lat, lng },
        animation: google.maps.Animation.DROP,
      });
    },
    [map],
  );

  const runGeocodeAddress = useCallback(
    async (address: string) => {
      const q = address.trim();
      if (!q || !map || !window.google?.maps?.Geocoder) return;

      setSearchError(null);
      setIsSearchLoading(true);
      const geocoder = new google.maps.Geocoder();

      try {
        const { results } = await geocoder.geocode({ address: q });
        const result = results[0];
        const loc = result?.geometry?.location;
        if (!result?.geometry || !loc) {
          setSearchError('No matching place found. Try a different search.');
          return;
        }
        focusMapFromGeometry(result.geometry as google.maps.GeocoderGeometry);
        setSearchMarker(loc);
      } catch {
        setSearchError('Search failed. Check your connection and try again.');
      } finally {
        setIsSearchLoading(false);
      }
    },
    [focusMapFromGeometry, map, setSearchMarker],
  );

  // --- Places Autocomplete ---

  useEffect(() => {
    if (!isLoaded || !map || !searchInputRef.current || !window.google?.maps?.places?.Autocomplete) {
      return;
    }

    if (autocompleteRef.current) {
      google.maps.event.clearInstanceListeners(autocompleteRef.current);
      autocompleteRef.current = null;
    }

    const ac = new google.maps.places.Autocomplete(searchInputRef.current, {
      fields: ['geometry', 'formatted_address', 'name', 'address_components'],
      types: ['geocode'],
    });
    ac.bindTo('bounds', map);

    const listener = ac.addListener('place_changed', () => {
      setSearchError(null);
      const place = ac.getPlace();
      const geom = place.geometry;
      if (!geom || !map) return;
      focusMapFromGeometry(geom);
      const loc = geom.location;
      if (loc) setSearchMarker(loc);
    });

    autocompleteRef.current = ac;

    return () => {
      google.maps.event.removeListener(listener);
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [focusMapFromGeometry, isLoaded, map, setSearchMarker]);

  // --- Heatmap layer ---

  useEffect(() => {
    if (!map || !isLoaded || !window.google?.maps?.visualization) return;

    if (heatmapLayerRef.current) {
      heatmapLayerRef.current.setMap(null);
      heatmapLayerRef.current = null;
    }

    if (filteredPoints.length === 0) return;

    const heatData = filteredPoints.map(
      (point) =>
        ({
          location: new window.google.maps.LatLng(point.lat, point.lng),
          weight: point.sumInsured,
        }) satisfies google.maps.visualization.WeightedLocation,
    );

    heatmapLayerRef.current = new window.google.maps.visualization.HeatmapLayer({
      data: heatData,
      dissipating: true,
      radius: 35,
      opacity: 0.85,
      gradient: heatGradient,
    });

    heatmapLayerRef.current.setMap(map);

    return () => {
      if (heatmapLayerRef.current) {
        heatmapLayerRef.current.setMap(null);
      }
    };
  }, [isLoaded, map, filteredPoints]);

  // --- Coverage radius circle ---

  useEffect(() => {
    if (!map || !window.google?.maps?.Circle) return;

    if (radiusCircleRef.current) {
      radiusCircleRef.current.setMap(null);
      radiusCircleRef.current = null;
    }

    if (!pinCenter || radiusSelection === RADIUS_SELECT_NONE || radiusSelection === '') {
      return;
    }

    const meters = Number(radiusSelection);
    if (!Number.isFinite(meters) || meters <= 0) return;

    const circle = new google.maps.Circle({
      map,
      center: pinCenter,
      radius: meters,
      fillColor: '#0284c7',
      fillOpacity: 0.14,
      strokeColor: '#0369a1',
      strokeOpacity: 0.95,
      strokeWeight: 2,
      clickable: false,
    });
    radiusCircleRef.current = circle;

    const bounds = circle.getBounds();
    if (bounds) {
      const pad = 48;
      map.fitBounds(bounds, { top: pad, right: pad, bottom: pad, left: pad });
    }

    return () => {
      if (radiusCircleRef.current) {
        radiusCircleRef.current.setMap(null);
        radiusCircleRef.current = null;
      }
    };
  }, [map, pinCenter, radiusSelection]);

  // --- Cleanup on unmount ---

  useEffect(() => {
    return () => {
      if (radiusCircleRef.current) {
        radiusCircleRef.current.setMap(null);
        radiusCircleRef.current = null;
      }
      if (searchMarkerRef.current) {
        searchMarkerRef.current.setMap(null);
        searchMarkerRef.current = null;
      }
    };
  }, []);

  // --- Geography dropdown handlers ---

  const handleCountryChange = (value: string) => {
    const id = value === GEO_SELECT_NONE ? '' : value;
    setSelectedCountry(id);
    setSelectedRegion('');
    setSelectedZone('');
    if (!id || !map) return;
    const area = UAE_AREAS.find((a) => a.id === id);
    if (area) void runGeocodeAddress(area.name);
  };

  const handleRegionChange = (value: string) => {
    const id = value === GEO_SELECT_NONE ? '' : value;
    setSelectedRegion(id);
    setSelectedZone('');
    if (!id || !selectedCountry || !map) return;
    const area = UAE_AREAS.find((a) => a.id === id);
    const country = UAE_AREAS.find((a) => a.id === selectedCountry);
    if (area && country) void runGeocodeAddress(`${area.name}, ${country.name}`);
  };

  const handleZoneChange = (value: string) => {
    const id = value === GEO_SELECT_NONE ? '' : value;
    setSelectedZone(id);
  };

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = searchInputRef.current?.value ?? '';
    void runGeocodeAddress(value);
  };

  // --- API key guard ---

  if (!resolvedApiKey) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Risk Accumulation Map</h2>
            <p className="text-sm text-muted-foreground">
              Geographic risk concentration for this reinsurer.
            </p>
          </div>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Google Maps API key required</AlertTitle>
            <AlertDescription>
              Set <code className="text-xs">VITE_GOOGLE_MAPS_API_KEY</code> in your environment to enable the risk accumulation map.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const showMap = isLoaded && !loadError;

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Risk Accumulation Map</h2>
            <p className="text-sm text-muted-foreground">
              Geographic risk concentration for this reinsurer.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Collapse' : 'Expand'}
            <ChevronUp className={`h-4 w-4 transition-transform ${isExpanded ? '' : 'rotate-180'}`} />
          </Button>
        </div>

        {isExpanded && (
          <>
            {/* Exposure cards — Row 1: Geographic */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg border p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Exposure by Country</p>
                <p className="text-2xl font-bold">{formatCurrencyCompact(exposureByCountry)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {locationCounts.countries > 0 ? `${locationCounts.countries} configured country area${locationCounts.countries !== 1 ? 's' : ''}` : 'No location data'}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Exposure by Region</p>
                <p className="text-2xl font-bold">{formatCurrencyCompact(exposureByRegion)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {locationCounts.regions > 0 ? `${locationCounts.regions} configured state / region area${locationCounts.regions !== 1 ? 's' : ''}` : 'No location data'}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Exposure by Zone</p>
                <p className="text-2xl font-bold">{formatCurrencyCompact(exposureByCity)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {locationCounts.cities > 0 ? `${locationCounts.cities} configured city / postal zone area${locationCounts.cities !== 1 ? 's' : ''}` : 'No location data'}
                </p>
              </div>
            </div>

            {/* Search + filter row */}
            {showMap && (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-3 items-end">
                  <form
                    onSubmit={onSearchSubmit}
                    className="flex min-w-0 flex-1 gap-2 items-stretch"
                  >
                    <Input
                      ref={searchInputRef}
                      type="text"
                      name="map-search"
                      autoComplete="off"
                      placeholder="Search city, area, or address…"
                      className={cn('h-10 w-64 flex-1', searchError && 'border-destructive')}
                      disabled={!map}
                      aria-invalid={!!searchError}
                      aria-describedby={searchError ? 'risk-map-search-error' : undefined}
                    />
                    <Button
                      type="submit"
                      className="h-10 gap-2"
                      disabled={!map || isSearchLoading}
                    >
                      {isSearchLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                      Search
                    </Button>
                  </form>

                  <Select
                    value={selectedCountry || GEO_SELECT_NONE}
                    onValueChange={handleCountryChange}
                    disabled={!map}
                  >
                    <SelectTrigger className="h-10 w-40" aria-label="Country">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={GEO_SELECT_NONE}>Select country</SelectItem>
                      {UAE_AREAS.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={selectedRegion || GEO_SELECT_NONE}
                    onValueChange={handleRegionChange}
                    disabled={!map || !selectedCountry}
                  >
                    <SelectTrigger className="h-10 w-40" aria-label="Region">
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={GEO_SELECT_NONE}>Select region</SelectItem>
                      {UAE_AREAS.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={selectedZone || GEO_SELECT_NONE}
                    onValueChange={handleZoneChange}
                    disabled={!map || !selectedRegion}
                  >
                    <SelectTrigger className="h-10 w-36" aria-label="Zone">
                      <SelectValue placeholder="Select zone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={GEO_SELECT_NONE}>Select zone</SelectItem>
                      <SelectItem value="flood">Flood</SelectItem>
                      <SelectItem value="earthquake">Earthquake</SelectItem>
                      <SelectItem value="cyclone">Cyclone</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground">Coverage radius</span>
                    <Select
                      value={radiusSelection}
                      onValueChange={setRadiusSelection}
                      disabled={!map}
                    >
                      <SelectTrigger className="h-10 w-36" aria-label="Coverage radius">
                        <SelectValue placeholder="No circle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={RADIUS_SELECT_NONE}>No circle</SelectItem>
                        {COVERAGE_RADIUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.meters} value={String(opt.meters)}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {searchError && (
                  <p id="risk-map-search-error" className="text-xs text-destructive">
                    {searchError}
                  </p>
                )}
              </div>
            )}

            {/* Map */}
            <div className="relative h-[400px] rounded-lg overflow-hidden border">
              {!isLoaded ? (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Loading Risk Accumulation map…
                </div>
              ) : loadError ? (
                <div className="flex h-full items-center justify-center p-6 text-center text-sm text-destructive">
                  Google Maps failed to load. Please verify the key and enable <strong>Maps JavaScript API</strong>,{' '}
                  <strong>Places API</strong>, and <strong>Geocoding API</strong> for this key.
                </div>
              ) : (
                <>
                  <GoogleMap
                    mapContainerStyle={MAP_CONTAINER_STYLE}
                    center={UAE_CENTER}
                    zoom={8}
                    onLoad={onMapLoaded}
                    onUnmount={() => {
                      setMap(null);
                      if (radiusCircleRef.current) {
                        radiusCircleRef.current.setMap(null);
                        radiusCircleRef.current = null;
                      }
                      if (searchMarkerRef.current) {
                        searchMarkerRef.current.setMap(null);
                        searchMarkerRef.current = null;
                      }
                    }}
                    options={{
                      streetViewControl: false,
                      mapTypeControl: true,
                      mapTypeControlOptions: {
                        style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                        position: google.maps.ControlPosition.TOP_RIGHT,
                        mapTypeIds: ['roadmap', 'satellite'],
                      },
                      fullscreenControl: true,
                      fullscreenControlOptions: {
                        position: google.maps.ControlPosition.BOTTOM_RIGHT,
                      },
                      clickableIcons: false,
                      gestureHandling: 'greedy',
                      minZoom: 2,
                    }}
                  />

                  {/* Gradient legend */}
                  <div className="pointer-events-none absolute bottom-3 left-3 z-10 flex flex-wrap items-center gap-3 rounded-md bg-background/80 px-3 py-2 shadow-sm backdrop-blur-sm">
                    {legendItems
                      .slice()
                      .reverse()
                      .map((item) => (
                        <div key={item.label} className="flex items-center gap-1.5">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-[11px] font-medium text-foreground">{item.label}</span>
                        </div>
                      ))}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
