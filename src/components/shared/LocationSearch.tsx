import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MapPin, Search } from 'lucide-react';
import { LocationSearchModal } from './LocationSearchModal';

interface LocationSearchProps {
  value: string;
  onChange: (coordinates: string) => void;
  projectAddress: string;
  onAddressChange: (address: string) => void;
}

export const LocationSearch: React.FC<LocationSearchProps> = ({
  value,
  onChange,
  projectAddress,
  onAddressChange,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLocationSelect = (coordinates: string, address: string) => {
    onChange(coordinates);
    onAddressChange(address);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="coordinates">Latitude & Longitude</Label>
      <div className="flex gap-2">
        <Input 
          id="coordinates" 
          value={value} 
          onChange={(e) => onChange(e.target.value)} 
          placeholder="For mapping/flood zone scoring"
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2"
        >
          <MapPin className="w-4 h-4" />
          <Search className="w-4 h-4" />
          Search
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Click the search button to find coordinates using Google Maps
      </p>

      <LocationSearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onLocationSelect={handleLocationSelect}
        projectAddress={projectAddress}
      />
    </div>
  );
};