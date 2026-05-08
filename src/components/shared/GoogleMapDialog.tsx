/// <reference types="google.maps" />
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  GoogleMap,
  MarkerF,
  useJsApiLoader,
} from '@react-google-maps/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Check, MapPin, AlertCircle } from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import { ENV } from '@/config/env';
import {
  GOOGLE_MAPS_LIBRARIES,
  GOOGLE_MAPS_PREVENT_FONTS_LOADING,
  GOOGLE_MAPS_SCRIPT_ID,
} from '@/shared/constants/googleMapsLoader';

interface GoogleMapDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (coordinates: string, address: string) => void;
  currentAddress?: string;
  currentCoordinates?: string;
  apiKey?: string;
  apiUrl?: string;
}

const DEFAULT_CENTER = { lat: 25.2048, lng: 55.2708 };
const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' };

type SelectedLocation = {
  lat: number;
  lng: number;
  address: string;
};

const parseCoordinates = (coordinates?: string): SelectedLocation | null => {
  if (!coordinates) return null;

  const [lat, lng] = coordinates.split(',').map((value) => Number.parseFloat(value.trim()));
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

  return {
    lat,
    lng,
    address: '',
  };
};

export const GoogleMapDialog: React.FC<GoogleMapDialogProps> = ({
  isOpen,
  onClose,
  onLocationSelect,
  currentAddress,
  currentCoordinates,
  apiKey,
  apiUrl,
}) => {
  const { toast } = useToast();
  const resolvedApiKey = (apiKey || ENV.GOOGLE_MAPS_API_KEY || '').trim();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [searchQuery, setSearchQuery] = useState(currentAddress || '');
  const [isSearching, setIsSearching] = useState(false);
  const searchRequestIdRef = useRef(0);

  const initialSelection = useMemo(() => {
    const parsedCoordinates = parseCoordinates(currentCoordinates);
    if (!parsedCoordinates) return null;

    return {
      ...parsedCoordinates,
      address: currentAddress || '',
    };
  }, [currentAddress, currentCoordinates]);

  useEffect(() => {
    if (!isOpen) return;
    setSearchQuery(currentAddress || '');
    setSelectedLocation(initialSelection);
  }, [currentAddress, initialSelection, isOpen]);

  const reverseGeocode = async (lat: number, lng: number) => {
    const geocoder = new window.google.maps.Geocoder();
    const response = await geocoder.geocode({ location: { lat, lng } });
    return response.results[0]?.formatted_address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const handleMapClick = async (event: google.maps.MapMouseEvent) => {
    if (!event.latLng) return;

    const lat = event.latLng.lat();
    const lng = event.latLng.lng();

    try {
      const address = await reverseGeocode(lat, lng);
      setSelectedLocation({ lat, lng, address });
    } catch (error) {
      console.error('Error reverse geocoding selected location:', error);
      setSelectedLocation({
        lat,
        lng,
        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      });
    }
  };

  const handleSearch = async (query: string) => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return;

    const requestId = ++searchRequestIdRef.current;
    setIsSearching(true);
    try {
      const geocoder = new window.google.maps.Geocoder();
      const response = await geocoder.geocode({ address: normalizedQuery });
      const result = response.results[0];

      if (!result?.geometry.location) {
        return;
      }

      if (requestId !== searchRequestIdRef.current) return;

      const lat = result.geometry.location.lat();
      const lng = result.geometry.location.lng();
      const address = result.formatted_address || normalizedQuery;

      setSelectedLocation({ lat, lng, address });
      map?.panTo({ lat, lng });
      map?.setZoom(15);
    } catch (error) {
      console.error('Error searching Google Maps location:', error);
    } finally {
      if (requestId === searchRequestIdRef.current) {
        setIsSearching(false);
      }
    }
  };

  useEffect(() => {
    if (!isOpen || !resolvedApiKey || !window.google?.maps) return;

    const query = searchQuery.trim();
    if (query.length < 3) {
      searchRequestIdRef.current += 1;
      setIsSearching(false);
      return;
    }

    if (selectedLocation?.address && query === selectedLocation.address) {
      searchRequestIdRef.current += 1;
      setIsSearching(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void handleSearch(query);
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [isOpen, resolvedApiKey, searchQuery, selectedLocation?.address]);

  const handleConfirm = () => {
    if (!selectedLocation) return;

    onLocationSelect(
      `${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}`,
      selectedLocation.address,
    );
    onClose();
    toast({
      title: 'Location selected',
      description: 'Coordinates have been updated.',
    });
  };

  const handleClear = () => {
    searchRequestIdRef.current += 1;
    setIsSearching(false);
    setSelectedLocation(null);
    setSearchQuery('');
  };

  const center = selectedLocation
    ? { lat: selectedLocation.lat, lng: selectedLocation.lng }
    : initialSelection
      ? { lat: initialSelection.lat, lng: initialSelection.lng }
      : DEFAULT_CENTER;

  const renderContent = () => {
    if (!resolvedApiKey) {
      return (
        <div className="p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Google Maps API key required</AlertTitle>
            <AlertDescription>
              Set `VITE_GOOGLE_MAPS_API_KEY` in the app environment to enable the Google map
              provider. Expected API URL: {apiUrl || 'https://maps.googleapis.com/maps/api/js'}
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return (
        <LoadedGoogleMapContent
          center={center}
          isSearching={isSearching}
          searchQuery={searchQuery}
          selectedLocation={selectedLocation}
          setMap={setMap}
          setSearchQuery={setSearchQuery}
          onMapClick={(event) => void handleMapClick(event)}
          onConfirm={handleConfirm}
          onClear={handleClear}
          apiKey={resolvedApiKey}
        />
      );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex h-[80vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Google Maps Location Search
          </DialogTitle>
          <DialogDescription>
            Search for an address or click directly on the map to pick the project location.
          </DialogDescription>
        </DialogHeader>

        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};

interface LoadedGoogleMapContentProps {
  apiKey: string;
  center: { lat: number; lng: number };
  isSearching: boolean;
  searchQuery: string;
  selectedLocation: SelectedLocation | null;
  setMap: (map: google.maps.Map | null) => void;
  setSearchQuery: (value: string) => void;
  onMapClick: (event: google.maps.MapMouseEvent) => void;
  onConfirm: () => void;
  onClear: () => void;
}

const LoadedGoogleMapContent: React.FC<LoadedGoogleMapContentProps> = ({
  apiKey,
  center,
  isSearching,
  searchQuery,
  selectedLocation,
  setMap,
  setSearchQuery,
  onMapClick,
  onConfirm,
  onClear,
}) => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: GOOGLE_MAPS_SCRIPT_ID,
    googleMapsApiKey: apiKey,
    libraries: GOOGLE_MAPS_LIBRARIES,
    preventGoogleFontsLoading: GOOGLE_MAPS_PREVENT_FONTS_LOADING,
  });

  if (loadError) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unable to load Google Maps</AlertTitle>
          <AlertDescription>
            Check that the JavaScript API is enabled and the API key allows this domain.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
      <div className="border-y bg-muted/20 px-4 py-3">
        <div className="relative">
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search address or place"
            className="pr-10"
          />
          {isSearching && (
            <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
      </div>

      <div className="flex-1 bg-muted/20 p-4 pt-3">
        <div className="relative h-full overflow-hidden rounded-lg border bg-background">
          {!isLoaded && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {isLoaded && (
            <GoogleMap
              mapContainerStyle={MAP_CONTAINER_STYLE}
              center={center}
              zoom={selectedLocation ? 15 : 13}
              onLoad={(loadedMap) => setMap(loadedMap)}
              onUnmount={() => setMap(null)}
              onClick={onMapClick}
              options={{
                mapTypeControl: true,
                mapTypeControlOptions: {
                  position: window.google.maps.ControlPosition.TOP_RIGHT,
                },
                streetViewControl: false,
                fullscreenControl: true,
                fullscreenControlOptions: {
                  position: window.google.maps.ControlPosition.BOTTOM_RIGHT,
                },
                clickableIcons: false,
              }}
            >
              {selectedLocation && (
                <MarkerF position={{ lat: selectedLocation.lat, lng: selectedLocation.lng }} />
              )}
            </GoogleMap>
          )}

          {selectedLocation && (
            <div className="absolute bottom-6 left-1/2 z-10 w-[90%] max-w-md -translate-x-1/2 rounded-lg border bg-background p-4 shadow-lg">
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Selected Location
                  </p>
                  <p className="truncate text-sm font-medium">{selectedLocation.address}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={onConfirm} className="flex-1">
                    <Check className="mr-2 h-4 w-4" />
                    Confirm Location
                  </Button>
                  <Button variant="outline" onClick={onClear}>
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
