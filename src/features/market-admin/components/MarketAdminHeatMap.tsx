/// <reference types="google.maps" />
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MapPin, AlertCircle, Loader2, Search } from 'lucide-react';
import { ENV } from '@/config/env';
import { cn } from '@/shared/utils/lib-utils';
import {
  GOOGLE_MAPS_LIBRARIES,
  GOOGLE_MAPS_PREVENT_FONTS_LOADING,
  GOOGLE_MAPS_SCRIPT_ID,
} from '@/shared/constants/googleMapsLoader';
const DEFAULT_WORLD_CENTER = { lat: 24, lng: 12 };
const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' };
const WORLD_BOUNDS = {
  north: 85,
  south: -85,
  west: -179.999,
  east: 179.999,
};

export interface HeatMapLocation {
  id: string;
  label: string;
  query: string;
  quotes: number;
  policies: number;
  weight: number;
  productCount: number;
}

/** Geography masters (same shape as dashboard /global-masters responses). */
export interface HeatMapMasterCountry {
  id: string;
  label: string;
  code?: string;
}
export interface HeatMapMasterRegion {
  id: string;
  label: string;
  countryId: string;
}
export interface HeatMapMasterZone {
  id: string;
  label: string;
  regionId: string;
}

const GEO_SELECT_NONE = '__none__';
/** Placeholder value for “no coverage circle”. */
const RADIUS_SELECT_NONE = 'none';

/** Static radii around the last search / pin (meters). */
const MAP_SEARCH_RADIUS_OPTIONS: { label: string; meters: number }[] = [
  { label: '500 m', meters: 500 },
  { label: '1 km', meters: 1_000 },
  { label: '2 km', meters: 2_000 },
  { label: '5 km', meters: 5_000 },
  { label: '10 km', meters: 10_000 },
  { label: '25 km', meters: 25_000 },
  { label: '50 km', meters: 50_000 },
];

interface MarketAdminHeatMapProps {
  locations: HeatMapLocation[];
  selectedProductLabel: string;
  isAllProductsView?: boolean;
  /** When provided, shows country → region → zone navigation tied to the same APIs as product geography. */
  masterCountries?: HeatMapMasterCountry[];
  masterRegions?: HeatMapMasterRegion[];
  masterZones?: HeatMapMasterZone[];
}

type ResolvedHeatPoint = HeatMapLocation & {
  lat: number;
  lng: number;
};

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

export function MarketAdminHeatMap({
  locations,
  selectedProductLabel,
  isAllProductsView = false,
  masterCountries = [],
  masterRegions = [],
  masterZones = [],
}: MarketAdminHeatMapProps) {
  const resolvedApiKey = ENV.GOOGLE_MAPS_API_KEY.trim();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [resolvedPoints, setResolvedPoints] = useState<ResolvedHeatPoint[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  /**
   * Collapsed = '' to match Radix single + collapsible (it emits "" when closed, not undefined).
   * Normalizing to undefined caused a controlled-state mismatch and double-clicks to reopen.
   */
  const [riskMapAccordion, setRiskMapAccordion] = useState<string>('');
  const [geoCountryId, setGeoCountryId] = useState('');
  const [geoRegionId, setGeoRegionId] = useState('');
  const [geoZoneId, setGeoZoneId] = useState('');
  /** Center of last geocoded search / geography pin (for coverage circle). */
  const [pinCenter, setPinCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusSelection, setRadiusSelection] = useState<string>(RADIUS_SELECT_NONE);

  const onMapLoaded = useCallback((m: google.maps.Map) => {
    didFitHeatmapBoundsRef.current = false;
    setMap(m);
  }, []);

  const geocodeCacheRef = useRef<Map<string, { lat: number; lng: number }>>(new Map());
  const heatmapLayerRef = useRef<google.maps.visualization.HeatmapLayer | null>(null);
  const radiusCircleRef = useRef<google.maps.Circle | null>(null);
  const searchMarkerRef = useRef<google.maps.Marker | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const didFitHeatmapBoundsRef = useRef(false);

  const heatmapLocationsKey = useMemo(
    () => locations.map((l) => `${l.id}:${l.weight}`).join('|'),
    [locations],
  );

  const hasGeographyMasters = masterCountries.length > 0 && masterRegions.length > 0;

  const sortedCountries = useMemo(
    () => [...masterCountries].sort((a, b) => a.label.localeCompare(b.label)),
    [masterCountries],
  );

  const countriesById = useMemo(
    () => new Map(masterCountries.map((c) => [c.id, c])),
    [masterCountries],
  );
  const regionsById = useMemo(
    () => new Map(masterRegions.map((r) => [r.id, r])),
    [masterRegions],
  );
  const zonesById = useMemo(() => new Map(masterZones.map((z) => [z.id, z])), [masterZones]);

  const regionsForCountry = useMemo(() => {
    if (!geoCountryId) return [];
    return masterRegions
      .filter((r) => r.countryId === geoCountryId)
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [geoCountryId, masterRegions]);

  const zonesForRegion = useMemo(() => {
    if (!geoRegionId) return [];
    return masterZones
      .filter((z) => z.regionId === geoRegionId)
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [geoRegionId, masterZones]);

  useEffect(() => {
    didFitHeatmapBoundsRef.current = false;
  }, [heatmapLocationsKey]);

  const { isLoaded, loadError } = useJsApiLoader({
    id: GOOGLE_MAPS_SCRIPT_ID,
    googleMapsApiKey: resolvedApiKey,
    libraries: GOOGLE_MAPS_LIBRARIES,
    preventGoogleFontsLoading: GOOGLE_MAPS_PREVENT_FONTS_LOADING,
  });

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

  useEffect(() => {
    if (!isLoaded || !window.google?.maps?.Geocoder || locations.length === 0) {
      if (locations.length === 0) {
        setResolvedPoints([]);
      }
      return;
    }

    let cancelled = false;
    const geocoder = new window.google.maps.Geocoder();

    const resolveLocations = async () => {
      const resolved = await Promise.all(
        locations.map(async (location) => {
          const cached = geocodeCacheRef.current.get(location.query);
          if (cached) {
            return { ...location, ...cached };
          }

          try {
            const result = await geocoder.geocode({ address: location.query });
            const position = result.results[0]?.geometry?.location;
            if (!position) return null;
            const coordinates = { lat: position.lat(), lng: position.lng() };
            geocodeCacheRef.current.set(location.query, coordinates);
            return { ...location, ...coordinates };
          } catch (error) {
            console.error('Failed to geocode heatmap location:', location.query, error);
            return null;
          }
        }),
      );

      if (!cancelled) {
        setResolvedPoints(resolved.filter(Boolean) as ResolvedHeatPoint[]);
      }
    };

    void resolveLocations();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, locations]);

  useEffect(() => {
    if (!map || !isLoaded || !window.google?.maps?.visualization) return;

    if (heatmapLayerRef.current) {
      heatmapLayerRef.current.setMap(null);
      heatmapLayerRef.current = null;
    }

    if (resolvedPoints.length === 0) return;

    const heatData = resolvedPoints.map(
      (point) =>
        ({
          location: new window.google.maps.LatLng(point.lat, point.lng),
          weight: point.weight,
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
  }, [isLoaded, map, resolvedPoints]);

  useEffect(() => {
    if (
      !map ||
      resolvedPoints.length === 0 ||
      isAllProductsView ||
      !window.google?.maps?.LatLngBounds ||
      didFitHeatmapBoundsRef.current
    ) {
      return;
    }

    const bounds = new window.google.maps.LatLngBounds();
    resolvedPoints.forEach((point) => bounds.extend({ lat: point.lat, lng: point.lng }));
    map.fitBounds(bounds);
    didFitHeatmapBoundsRef.current = true;

    const listener = window.google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
      if (map.getZoom() && map.getZoom()! > 7) {
        map.setZoom(7);
      }
    });

    return () => {
      window.google.maps.event.removeListener(listener);
    };
  }, [isAllProductsView, map, resolvedPoints, heatmapLocationsKey]);

  useEffect(() => {
    if (!map || !window.google?.maps?.Circle) return;

    if (radiusCircleRef.current) {
      radiusCircleRef.current.setMap(null);
      radiusCircleRef.current = null;
    }

    if (
      !pinCenter ||
      radiusSelection === RADIUS_SELECT_NONE ||
      radiusSelection === ''
    ) {
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

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = searchInputRef.current?.value ?? '';
    void runGeocodeAddress(value);
  };

  const handleGeoCountryChange = (value: string) => {
    const id = value === GEO_SELECT_NONE ? '' : value;
    setGeoCountryId(id);
    setGeoRegionId('');
    setGeoZoneId('');
    if (!id || !map) return;
    const c = countriesById.get(id);
    if (c) void runGeocodeAddress(c.label);
  };

  const handleGeoRegionChange = (value: string) => {
    const id = value === GEO_SELECT_NONE ? '' : value;
    setGeoRegionId(id);
    setGeoZoneId('');
    if (!id || !geoCountryId || !map) return;
    const r = regionsById.get(id);
    const c = countriesById.get(geoCountryId);
    if (r && c) void runGeocodeAddress(`${r.label}, ${c.label}`);
  };

  const handleGeoZoneChange = (value: string) => {
    const id = value === GEO_SELECT_NONE ? '' : value;
    setGeoZoneId(id);
    if (!id || !geoRegionId || !geoCountryId || !map) return;
    const z = zonesById.get(id);
    const r = regionsById.get(geoRegionId);
    const c = countriesById.get(geoCountryId);
    if (z && r && c) void runGeocodeAddress(`${z.label}, ${r.label}, ${c.label}`);
  };

  if (!resolvedApiKey) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Risk Accumulation Map</CardTitle>
          <CardDescription>Set `VITE_GOOGLE_MAPS_API_KEY` to enable the Google map.</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Google Maps API key required</AlertTitle>
            <AlertDescription>
              The dashboard can prepare the heatmap data, but Google Maps cannot render until the API key is available.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const showMap = isLoaded && !loadError;
  const isPlottingHeat = locations.length > 0 && resolvedPoints.length === 0;
  const isRiskMapExpanded = riskMapAccordion === 'risk-map';

  return (
    <Card className="mb-8 overflow-hidden p-0">
      <Accordion
        type="single"
        collapsible
        value={riskMapAccordion}
        onValueChange={setRiskMapAccordion}
        className="w-full"
      >
        <AccordionItem value="risk-map" className="border-b-0">
          <AccordionTrigger className="px-6 py-4 hover:no-underline [&>svg]:text-muted-foreground">
            <div className="flex w-full flex-col gap-3 text-left sm:flex-row sm:items-start sm:justify-between sm:pr-2">
              <div className="space-y-1.5">
                <span className="text-lg font-semibold leading-none tracking-tight text-foreground">
                  Risk Accumulation Map
                </span>
                <p className="text-sm font-normal text-muted-foreground">
                  Geographic risk concentration for {selectedProductLabel}. Expand to search and explore the map.
                </p>
              </div>
              <Badge variant="outline" className="w-fit shrink-0 gap-1.5 border-primary/20 bg-primary/5 text-foreground">
                <span className="font-semibold text-primary">Risk</span>
                <span className="text-muted-foreground">·</span>
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                <span className="tabular-nums">{resolvedPoints.length}</span>
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="border-t border-border/60 bg-muted/5 px-6 !pb-6 pt-0 [&[data-state=closed]]:animate-none [&[data-state=open]]:animate-none">
            <div className="min-h-0">
              {isRiskMapExpanded ? (
                <div className="space-y-4 pt-4">
                  {showMap && (
                    <div className="space-y-2">
                      <div className="flex w-full flex-col gap-2 xl:flex-row xl:flex-wrap xl:items-end">
                        <form
                          onSubmit={onSearchSubmit}
                          className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-stretch"
                        >
                          <Input
                            ref={searchInputRef}
                            type="text"
                            name="map-search"
                            autoComplete="off"
                            placeholder="Search city, area, or address…"
                            className={cn('h-10 min-w-[12rem] flex-1', searchError && 'border-destructive')}
                            disabled={!map}
                            aria-invalid={!!searchError}
                            aria-describedby={searchError ? 'map-search-error' : undefined}
                          />
                          <Button
                            type="submit"
                            variant="default"
                            className="h-10 shrink-0 gap-2 px-4 sm:w-auto sm:min-w-[7.5rem]"
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

                        {hasGeographyMasters && (
                          <div className="flex min-w-0 w-full flex-col gap-2 sm:flex-row xl:w-auto xl:flex-1 xl:min-w-0">
                            <Select
                              value={geoCountryId || GEO_SELECT_NONE}
                              onValueChange={handleGeoCountryChange}
                              disabled={!map}
                            >
                              <SelectTrigger
                                className="h-10 w-full min-w-[10rem] sm:max-xl:flex-1 xl:min-w-[9.5rem] xl:max-w-[14rem]"
                                aria-label="Country"
                              >
                                <SelectValue placeholder="Country" />
                              </SelectTrigger>
                              <SelectContent position="popper" className="max-h-72">
                                <SelectItem value={GEO_SELECT_NONE}>Select country</SelectItem>
                                {sortedCountries.map((c) => (
                                  <SelectItem key={c.id} value={c.id}>
                                    {c.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select
                              value={geoRegionId || GEO_SELECT_NONE}
                              onValueChange={handleGeoRegionChange}
                              disabled={!map || !geoCountryId}
                            >
                              <SelectTrigger
                                className="h-10 w-full min-w-[10rem] sm:max-xl:flex-1 xl:min-w-[9.5rem] xl:max-w-[14rem]"
                                aria-label="Region"
                              >
                                <SelectValue placeholder="Region" />
                              </SelectTrigger>
                              <SelectContent position="popper" className="max-h-72">
                                <SelectItem value={GEO_SELECT_NONE}>Select region</SelectItem>
                                {regionsForCountry.map((r) => (
                                  <SelectItem key={r.id} value={r.id}>
                                    {r.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select
                              value={geoZoneId || GEO_SELECT_NONE}
                              onValueChange={handleGeoZoneChange}
                              disabled={!map || !geoRegionId}
                            >
                              <SelectTrigger
                                className="h-10 w-full min-w-[10rem] sm:max-xl:flex-1 xl:min-w-[9.5rem] xl:max-w-[14rem]"
                                aria-label="Zone"
                              >
                                <SelectValue placeholder="Zone" />
                              </SelectTrigger>
                              <SelectContent position="popper" className="max-h-72">
                                <SelectItem value={GEO_SELECT_NONE}>Select zone</SelectItem>
                                {zonesForRegion.map((z) => (
                                  <SelectItem key={z.id} value={z.id}>
                                    {z.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        <div className="flex w-full min-w-0 flex-col gap-1 sm:w-auto xl:shrink-0">
                          <span className="text-xs font-medium text-muted-foreground">Coverage radius</span>
                          <Select
                            value={radiusSelection}
                            onValueChange={setRadiusSelection}
                            disabled={!map}
                          >
                            <SelectTrigger
                              className="h-10 w-full min-w-[10rem] sm:w-[11rem]"
                              aria-label="Coverage radius around search"
                            >
                              <SelectValue placeholder="Radius" />
                            </SelectTrigger>
                            <SelectContent position="popper" className="max-h-72">
                              <SelectItem value={RADIUS_SELECT_NONE}>No circle</SelectItem>
                              {MAP_SEARCH_RADIUS_OPTIONS.map((opt) => (
                                <SelectItem key={opt.meters} value={String(opt.meters)}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {searchError && (
                        <p id="map-search-error" className="text-xs text-destructive">
                          {searchError}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="relative h-[460px] overflow-hidden rounded-xl border bg-muted/10">
                  {!isLoaded ? (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Loading Risk Accumulation map...
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
                        center={DEFAULT_WORLD_CENTER}
                        zoom={2}
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
                          restriction: {
                            latLngBounds: WORLD_BOUNDS,
                            strictBounds: true,
                          },
                        }}
                      />

                      {isPlottingHeat && (
                        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-background/40">
                          <div className="flex items-center gap-2 rounded-lg border bg-background px-4 py-2 text-sm text-muted-foreground shadow-sm">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Plotting heat data…
                          </div>
                        </div>
                      )}

                      {!isPlottingHeat && locations.length === 0 && resolvedPoints.length === 0 && (
                        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-background/50 p-6 text-center text-sm text-muted-foreground">
                          No geographic data is available for the current product selection yet.
                        </div>
                      )}
                    </>
                  )}

                  {isLoaded && !loadError && (
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
                  )}
                </div>
              </div>
            ) : null}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
