import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Search, Check, X, AlertCircle, Zap } from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';

interface LocationResult {
  id: string;
  address: string;
  lat: number;
  lng: number;
  type: string;
}

interface LocationSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (coordinates: string, address: string) => void;
  projectAddress: string;
}

// Mock location database - realistic Middle East locations
const mockLocations: LocationResult[] = [
  { id: '1', address: 'Sheikh Zayed Road, Business Bay, Dubai, UAE', lat: 25.2048, lng: 55.2708, type: 'street' },
  { id: '2', address: 'Downtown Dubai, Dubai, UAE', lat: 25.1972, lng: 55.2744, type: 'area' },
  { id: '3', address: 'Dubai Marina, Dubai, UAE', lat: 25.0759, lng: 55.1395, type: 'area' },
  { id: '4', address: 'Jumeirah Beach Residence, Dubai, UAE', lat: 25.0692, lng: 55.1364, type: 'area' },
  { id: '5', address: 'Dubai International Financial Centre, Dubai, UAE', lat: 25.2138, lng: 55.2835, type: 'district' },
  { id: '6', address: 'Palm Jumeirah, Dubai, UAE', lat: 25.1124, lng: 55.1390, type: 'landmark' },
  { id: '7', address: 'Burj Khalifa, Downtown Dubai, UAE', lat: 25.1972, lng: 55.2744, type: 'landmark' },
  { id: '8', address: 'Dubai Mall, Downtown Dubai, UAE', lat: 25.1975, lng: 55.2796, type: 'landmark' },
  { id: '9', address: 'King Abdulaziz Road, Riyadh, Saudi Arabia', lat: 24.7136, lng: 46.6753, type: 'street' },
  { id: '10', address: 'King Fahd Road, Riyadh, Saudi Arabia', lat: 24.7136, lng: 46.6753, type: 'street' },
  { id: '11', address: 'Olaya District, Riyadh, Saudi Arabia', lat: 24.6877, lng: 46.7219, type: 'district' },
  { id: '12', address: 'Al Corniche Road, Doha, Qatar', lat: 25.2854, lng: 51.5310, type: 'street' },
  { id: '13', address: 'West Bay, Doha, Qatar', lat: 25.3548, lng: 51.5326, type: 'district' },
  { id: '14', address: 'The Pearl Qatar, Doha, Qatar', lat: 25.3780, lng: 51.5525, type: 'area' },
  { id: '15', address: 'Kuwait City, Kuwait', lat: 29.3759, lng: 47.9774, type: 'city' },
  { id: '16', address: 'Salmiya, Kuwait', lat: 29.3344, lng: 48.0567, type: 'area' },
  { id: '17', address: 'Manama, Bahrain', lat: 26.2285, lng: 50.5860, type: 'city' },
  { id: '18', address: 'Seef District, Manama, Bahrain', lat: 26.2361, lng: 50.5328, type: 'district' },
  { id: '19', address: 'Muscat, Oman', lat: 23.5859, lng: 58.4059, type: 'city' },
  { id: '20', address: 'Al Khuwair, Muscat, Oman', lat: 23.5990, lng: 58.4526, type: 'district' },
];

export const LocationSearchModal: React.FC<LocationSearchModalProps> = ({
  isOpen,
  onClose,
  onLocationSelect,
  projectAddress,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(null);
  const [useDemo, setUseDemo] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const { toast } = useToast();

  // Simulate Google Maps search with realistic delay
  useEffect(() => {
    if (!useDemo || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      const filtered = mockLocations.filter(location =>
        location.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      // Add some realistic variations
      const enhanced = filtered.map(loc => ({
        ...loc,
        // Add slight coordinate variations for realism
        lat: loc.lat + (Math.random() - 0.5) * 0.001,
        lng: loc.lng + (Math.random() - 0.5) * 0.001,
      }));

      setSearchResults(enhanced.slice(0, 5)); // Limit to 5 results like Google
    }, 300); // Realistic search delay

    return () => clearTimeout(timeoutId);
  }, [searchQuery, useDemo]);

  // Auto-search project address when demo mode is enabled
  useEffect(() => {
    if (useDemo && projectAddress && !selectedLocation) {
      const timeoutId = setTimeout(() => {
        const found = mockLocations.find(loc =>
          loc.address.toLowerCase().includes(projectAddress.toLowerCase()) ||
          projectAddress.toLowerCase().includes(loc.address.toLowerCase())
        );

        if (found) {
          setSelectedLocation({
            ...found,
            lat: found.lat + (Math.random() - 0.5) * 0.001,
            lng: found.lng + (Math.random() - 0.5) * 0.001,
            address: projectAddress, // Use the actual project address
          });
          
          toast({
            title: "Location found",
            description: "Coordinates auto-detected from project address.",
          });
        }
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [useDemo, projectAddress]);

  const handleLocationSelect = (location: LocationResult) => {
    setSelectedLocation(location);
    setSearchQuery(location.address);
    setSearchResults([]);
  };

  const confirmLocation = () => {
    if (selectedLocation) {
      const coordinates = `${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}`;
      onLocationSelect(coordinates, selectedLocation.address);
      onClose();
      
      toast({
        title: "Location confirmed",
        description: "Coordinates have been updated.",
      });
    }
  };

  const enableDemoMode = () => {
    setUseDemo(true);
    toast({
      title: "Demo mode enabled",
      description: "You can now search locations using simulated data.",
    });
  };

  const handleClose = () => {
    setSelectedLocation(null);
    setSearchQuery('');
    setSearchResults([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Location Search
          </DialogTitle>
          <DialogDescription>
            Search for a location to automatically get coordinates for your project.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!useDemo && !apiKey ? (
            <div className="space-y-4">
              {/* API Key Input */}
              <Card className="bg-primary-light border-primary/20">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium text-foreground">Google Maps API</h4>
                        <p className="text-sm text-muted-foreground">
                          Enter your Google Maps API key for real location data.
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apiKey">API Key</Label>
                      <Input
                        id="apiKey"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Enter Google Maps API key"
                        type="password"
                        autoComplete="off"
                      />
                    </div>
                    <Button className="w-full" disabled>
                      <Search className="w-4 h-4 mr-2" />
                      Enable Google Maps
                    </Button>
                    <p className="text-xs text-primary">
                      Get your API key from{' '}
                      <a
                        href="https://console.cloud.google.com/google/maps-apis"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        Google Cloud Console
                      </a>
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Demo Mode Option */}
              <Card className="bg-warning-light border-warning/20">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Zap className="w-5 h-5 text-warning mt-0.5" />
                      <div>
                        <h4 className="font-medium text-foreground">Try Demo Mode</h4>
                        <p className="text-sm text-muted-foreground">
                          Experience the location search with realistic Middle East locations.
                        </p>
                      </div>
                    </div>
                    <Button onClick={enableDemoMode} variant="outline" className="w-full border-warning/20 hover:bg-warning-light">
                      <Zap className="w-4 h-4 mr-2" />
                      Use Demo Mode
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <>
              {/* Search Interface */}
              <div className="space-y-2">
                <Label htmlFor="locationSearch">Search Location</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Type Dubai, Riyadh, Doha, Kuwait..."
                    className="pl-10"
                  />
                  {useDemo && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <span className="text-xs bg-warning-light text-warning px-2 py-1 rounded">
                        DEMO
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {useDemo 
                    ? "Demo mode - Search Middle East locations like Dubai, Riyadh, Doha..."
                    : "Type an address or location name and select from the dropdown"
                  }
                </p>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Search Results</Label>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {searchResults.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => handleLocationSelect(result)}
                        className="w-full text-left p-2 hover:bg-muted rounded-md transition-colors text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{result.address}</div>
                            <div className="text-xs text-muted-foreground capitalize">
                              {result.type} • {result.lat.toFixed(4)}, {result.lng.toFixed(4)}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected Location */}
              {selectedLocation && (
                <Card className="bg-success-light border-success/20">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-success mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">Selected Location</h4>
                          <p className="text-sm text-muted-foreground">{selectedLocation.address}</p>
                          <p className="text-xs text-success mt-1">
                            Coordinates: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={confirmLocation} size="sm" variant="success">
                          <Check className="w-4 h-4 mr-1" />
                          Use This Location
                        </Button>
                        <Button onClick={() => setSelectedLocation(null)} variant="outline" size="sm">
                          <X className="w-4 h-4 mr-1" />
                          Clear
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};