import React, { useMemo, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { MapPin } from 'lucide-react';
import { GoogleMapDialog } from '@/components/shared/GoogleMapDialog';
import { OpenStreetMapDialog } from '@/components/shared/OpenStreetMapDialog';
import type { Field } from '@/features/product-config/proposal-form/api/proposalFormDesign';

interface LocationPreviewFieldProps {
  field: Field;
}

const GOOGLE_MAPS_API_URL = 'https://maps.googleapis.com/maps/api/js';
const OPEN_STREET_MAP_API_URL = 'https://nominatim.openstreetmap.org';

const getMapProvider = (field: Field): 'default' | 'google' => {
  const explicitProvider = String(field.metadata?.mapProvider || field.mapProvider || '').trim();
  if (explicitProvider === 'google' || explicitProvider === 'default') {
    return explicitProvider;
  }

  const apiUrl = String(field.metadata?.mapApiUrl || field.mapApiUrl || '').toLowerCase();
  if (apiUrl.includes('maps.googleapis.com')) {
    return 'google';
  }

  return 'google';
};

const splitLocationValue = (value?: string) => {
  if (!value) {
    return {
      address: '',
      coordinates: undefined as string | undefined,
    };
  }

  if (!value.includes('|')) {
    return {
      address: value,
      coordinates: undefined as string | undefined,
    };
  }

  const [address, coordinates] = value.split('|');
  return {
    address: address.trim(),
    coordinates: coordinates?.trim() || undefined,
  };
};

export const LocationPreviewField: React.FC<LocationPreviewFieldProps> = ({ field }) => {
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(
    typeof field.defaultValue === 'string' ? field.defaultValue : '',
  );

  const provider = getMapProvider(field);
  const apiUrl =
    String(field.metadata?.mapApiUrl || field.mapApiUrl || '').trim() ||
    (provider === 'google' ? GOOGLE_MAPS_API_URL : OPEN_STREET_MAP_API_URL);

  const parsedLocation = useMemo(() => splitLocationValue(selectedValue), [selectedValue]);

  const handleLocationSelect = (coordinates: string, address: string) => {
    setSelectedValue(`${address} | ${coordinates}`);
    setIsMapOpen(false);
  };

  return (
    <div className="space-y-2">
      <Label>
        {field.label} {field.required && <span className="text-destructive">*</span>}
      </Label>
      <div className="relative">
        <Input
          readOnly
          value={parsedLocation.address}
          placeholder={field.placeholder || 'Select location on map'}
          className="cursor-pointer pr-10"
          onClick={() => setIsMapOpen(true)}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          <MapPin className="h-4 w-4" />
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        {provider === 'google' ? 'Google Map' : 'Street Map'} preview via `{apiUrl}`
      </p>

      {provider === 'google' ? (
        <GoogleMapDialog
          isOpen={isMapOpen}
          onClose={() => setIsMapOpen(false)}
          onLocationSelect={handleLocationSelect}
          currentAddress={parsedLocation.address}
          currentCoordinates={parsedLocation.coordinates}
          apiUrl={apiUrl}
        />
      ) : (
        <OpenStreetMapDialog
          isOpen={isMapOpen}
          onClose={() => setIsMapOpen(false)}
          onLocationSelect={handleLocationSelect}
          currentAddress={parsedLocation.address}
          currentCoordinates={parsedLocation.coordinates}
          apiUrl={apiUrl}
        />
      )}
    </div>
  );
};
