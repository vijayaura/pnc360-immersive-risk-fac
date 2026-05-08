import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from '@/shared/hooks/use-toast';
import { MapPin, X, Filter, TrendingUp, AlertTriangle, DollarSign, Building2, Users, Layers } from "lucide-react";
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// UAE Areas/Emirates
const uaeAreas = [
  { id: "dubai", name: "Dubai", center: [25.2048, 55.2708], color: "#3b82f6" },
  { id: "abu-dhabi", name: "Abu Dhabi", center: [24.4539, 54.3773], color: "#ef4444" },
  { id: "sharjah", name: "Sharjah", center: [25.3573, 55.4033], color: "#10b981" },
  { id: "ajman", name: "Ajman", center: [25.4052, 55.5136], color: "#f59e0b" },
  { id: "ras-al-khaimah", name: "Ras Al Khaimah", center: [25.7889, 55.9597], color: "#8b5cf6" },
  { id: "fujairah", name: "Fujairah", center: [25.1288, 56.3264], color: "#ec4899" },
  { id: "umm-al-quwain", name: "Umm Al Quwain", center: [25.5650, 55.5552], color: "#06b6d4" },
];

// Sample risk data points - expanded across all UAE areas
const sampleRiskData = [
  // Dubai - Multiple points
  { id: "1", lat: 25.2048, lng: 55.2708, area: "Dubai", sumInsured: 50000000, premium: 250000, riskLevel: "High", projects: 15 },
  { id: "2", lat: 25.2148, lng: 55.2808, area: "Dubai", sumInsured: 30000000, premium: 150000, riskLevel: "Medium", projects: 8 },
  { id: "3", lat: 25.1948, lng: 55.2608, area: "Dubai", sumInsured: 45000000, premium: 225000, riskLevel: "High", projects: 18 },
  { id: "4", lat: 25.2248, lng: 55.2908, area: "Dubai", sumInsured: 28000000, premium: 140000, riskLevel: "Medium", projects: 10 },
  { id: "5", lat: 25.1848, lng: 55.2508, area: "Dubai", sumInsured: 35000000, premium: 175000, riskLevel: "Medium", projects: 12 },
  { id: "6", lat: 25.2348, lng: 55.3008, area: "Dubai", sumInsured: 22000000, premium: 110000, riskLevel: "Low", projects: 6 },
  
  // Abu Dhabi - Multiple points
  { id: "7", lat: 24.4539, lng: 54.3773, area: "Abu Dhabi", sumInsured: 75000000, premium: 375000, riskLevel: "High", projects: 22 },
  { id: "8", lat: 24.4639, lng: 54.3873, area: "Abu Dhabi", sumInsured: 20000000, premium: 100000, riskLevel: "Low", projects: 5 },
  { id: "9", lat: 24.4439, lng: 54.3673, area: "Abu Dhabi", sumInsured: 60000000, premium: 300000, riskLevel: "High", projects: 20 },
  { id: "10", lat: 24.4739, lng: 54.3973, area: "Abu Dhabi", sumInsured: 32000000, premium: 160000, riskLevel: "Medium", projects: 11 },
  { id: "11", lat: 24.4339, lng: 54.3573, area: "Abu Dhabi", sumInsured: 48000000, premium: 240000, riskLevel: "High", projects: 16 },
  { id: "12", lat: 24.4839, lng: 54.4073, area: "Abu Dhabi", sumInsured: 18000000, premium: 90000, riskLevel: "Low", projects: 4 },
  
  // Sharjah - Multiple points
  { id: "13", lat: 25.3573, lng: 55.4033, area: "Sharjah", sumInsured: 40000000, premium: 200000, riskLevel: "Medium", projects: 12 },
  { id: "14", lat: 25.3673, lng: 55.4133, area: "Sharjah", sumInsured: 26000000, premium: 130000, riskLevel: "Medium", projects: 9 },
  { id: "15", lat: 25.3473, lng: 55.3933, area: "Sharjah", sumInsured: 33000000, premium: 165000, riskLevel: "Medium", projects: 10 },
  { id: "16", lat: 25.3773, lng: 55.4233, area: "Sharjah", sumInsured: 19000000, premium: 95000, riskLevel: "Low", projects: 5 },
  
  // Ajman - Multiple points
  { id: "17", lat: 25.4052, lng: 55.5136, area: "Ajman", sumInsured: 15000000, premium: 75000, riskLevel: "Low", projects: 4 },
  { id: "18", lat: 25.4152, lng: 55.5236, area: "Ajman", sumInsured: 24000000, premium: 120000, riskLevel: "Medium", projects: 7 },
  { id: "19", lat: 25.3952, lng: 55.5036, area: "Ajman", sumInsured: 17000000, premium: 85000, riskLevel: "Low", projects: 4 },
  
  // Ras Al Khaimah - Multiple points
  { id: "20", lat: 25.7889, lng: 55.9597, area: "Ras Al Khaimah", sumInsured: 25000000, premium: 125000, riskLevel: "Medium", projects: 7 },
  { id: "21", lat: 25.7989, lng: 55.9697, area: "Ras Al Khaimah", sumInsured: 31000000, premium: 155000, riskLevel: "Medium", projects: 9 },
  { id: "22", lat: 25.7789, lng: 55.9497, area: "Ras Al Khaimah", sumInsured: 21000000, premium: 105000, riskLevel: "Low", projects: 6 },
  { id: "23", lat: 25.8089, lng: 55.9797, area: "Ras Al Khaimah", sumInsured: 29000000, premium: 145000, riskLevel: "Medium", projects: 8 },
  
  // Fujairah - Multiple points
  { id: "24", lat: 25.1288, lng: 56.3264, area: "Fujairah", sumInsured: 18000000, premium: 90000, riskLevel: "Low", projects: 3 },
  { id: "25", lat: 25.1388, lng: 56.3364, area: "Fujairah", sumInsured: 23000000, premium: 115000, riskLevel: "Medium", projects: 6 },
  { id: "26", lat: 25.1188, lng: 56.3164, area: "Fujairah", sumInsured: 16000000, premium: 80000, riskLevel: "Low", projects: 3 },
  
  // Umm Al Quwain - Multiple points
  { id: "27", lat: 25.5650, lng: 55.5552, area: "Umm Al Quwain", sumInsured: 14000000, premium: 70000, riskLevel: "Low", projects: 3 },
  { id: "28", lat: 25.5750, lng: 55.5652, area: "Umm Al Quwain", sumInsured: 20000000, premium: 100000, riskLevel: "Low", projects: 5 },
  { id: "29", lat: 25.5550, lng: 55.5452, area: "Umm Al Quwain", sumInsured: 17000000, premium: 85000, riskLevel: "Low", projects: 4 },
  
  // Additional scattered points across UAE
  { id: "30", lat: 25.1900, lng: 55.2700, area: "Dubai", sumInsured: 42000000, premium: 210000, riskLevel: "High", projects: 14 },
  { id: "31", lat: 24.4600, lng: 54.3800, area: "Abu Dhabi", sumInsured: 55000000, premium: 275000, riskLevel: "High", projects: 19 },
  { id: "32", lat: 25.3600, lng: 55.4100, area: "Sharjah", sumInsured: 27000000, premium: 135000, riskLevel: "Medium", projects: 8 },
  { id: "33", lat: 25.4100, lng: 55.5200, area: "Ajman", sumInsured: 22000000, premium: 110000, riskLevel: "Medium", projects: 6 },
  { id: "34", lat: 25.7900, lng: 55.9600, area: "Ras Al Khaimah", sumInsured: 26000000, premium: 130000, riskLevel: "Medium", projects: 7 },
  { id: "35", lat: 25.1300, lng: 56.3300, area: "Fujairah", sumInsured: 19500000, premium: 97500, riskLevel: "Low", projects: 4 },
];

// Heat map component
function HeatMapLayer({ center, radius, intensity }: { center: [number, number], radius: number, intensity: number }) {
  const map = useMap();
  
  const getColor = (intensity: number) => {
    if (intensity > 0.7) return "rgba(239, 68, 68, 0.6)"; // Red - High
    if (intensity > 0.4) return "rgba(245, 158, 11, 0.6)"; // Orange - Medium
    return "rgba(59, 130, 246, 0.6)"; // Blue - Low
  };

  return (
    <Circle
      center={center}
      radius={radius}
      pathOptions={{
        fillColor: getColor(intensity),
        fillOpacity: 0.4,
        color: getColor(intensity),
        weight: 2,
      }}
    />
  );
}

// Calculate distance between two coordinates (in meters)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const RiskAccumulationDashboard = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { toast } = useToast();
  const [selectedArea, setSelectedArea] = useState<string>("all");
  const [radiusFilter, setRadiusFilter] = useState<number>(100);
  const [selectedPoint, setSelectedPoint] = useState<typeof sampleRiskData[0] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([25.2048, 55.2708]);
  const [mapZoom, setMapZoom] = useState<number>(8);

  // Filter risk data based on selected area and radius
  const filteredRiskData = useMemo(() => {
    let data = sampleRiskData;
    
    if (selectedArea !== "all") {
      const area = uaeAreas.find(a => a.id === selectedArea);
      if (area) {
        data = data.filter(point => {
          const distance = calculateDistance(
            area.center[0],
            area.center[1],
            point.lat,
            point.lng
          );
          return distance <= radiusFilter;
        });
      }
    }
    
    return data;
  }, [selectedArea, radiusFilter]);

  // Analytics calculations
  const analytics = useMemo(() => {
    const totalSumInsured = filteredRiskData.reduce((sum, point) => sum + point.sumInsured, 0);
    const totalPremium = filteredRiskData.reduce((sum, point) => sum + point.premium, 0);
    const totalProjects = filteredRiskData.reduce((sum, point) => sum + point.projects, 0);
    const highRiskCount = filteredRiskData.filter(p => p.riskLevel === "High").length;
    const mediumRiskCount = filteredRiskData.filter(p => p.riskLevel === "Medium").length;
    const lowRiskCount = filteredRiskData.filter(p => p.riskLevel === "Low").length;

    return {
      totalSumInsured,
      totalPremium,
      totalProjects,
      highRiskCount,
      mediumRiskCount,
      lowRiskCount,
      averageRiskLevel: highRiskCount > mediumRiskCount && highRiskCount > lowRiskCount 
        ? "High" 
        : mediumRiskCount > lowRiskCount 
        ? "Medium" 
        : "Low"
    };
  }, [filteredRiskData]);

  const handleAreaChange = (areaId: string) => {
    setSelectedArea(areaId);
    if (areaId !== "all") {
      const area = uaeAreas.find(a => a.id === areaId);
      if (area) {
        setMapCenter(area.center as [number, number]);
        setMapZoom(11);
      }
    } else {
      setMapCenter([25.2048, 55.2708]);
      setMapZoom(8);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "High": return "destructive";
      case "Medium": return "default";
      case "Low": return "secondary";
      default: return "outline";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-full h-[95vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">Risk Accumulation Dashboard</DialogTitle>
              <DialogDescription>Analyze risk concentration across UAE areas with heat map visualization</DialogDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex">
          {/* Left Sidebar - Filters and Analytics */}
          <div className="w-80 border-r bg-muted/30 overflow-y-auto p-4 space-y-4">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Area</Label>
                  <Select value={selectedArea} onValueChange={handleAreaChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Areas</SelectItem>
                      {uaeAreas.map(area => (
                        <SelectItem key={area.id} value={area.id}>
                          {area.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Radius (meters)</Label>
                  <Input
                    type="number"
                    value={radiusFilter}
                    onChange={(e) => setRadiusFilter(Number(e.target.value))}
                    min={50}
                    max={1000}
                    step={50}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Total Sum Insured</p>
                    <p className="text-lg font-bold">
                      {(analytics.totalSumInsured / 1000000).toFixed(1)}M AED
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Total Premium</p>
                    <p className="text-lg font-bold">
                      {(analytics.totalPremium / 1000).toFixed(0)}K AED
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Total Projects</p>
                    <p className="text-lg font-bold">{analytics.totalProjects}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Risk Points</p>
                    <p className="text-lg font-bold">{filteredRiskData.length}</p>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <p className="text-xs font-semibold">Risk Distribution</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive">High</Badge>
                        <span className="text-xs text-muted-foreground">Risk</span>
                      </div>
                      <span className="text-sm font-medium">{analytics.highRiskCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="default">Medium</Badge>
                        <span className="text-xs text-muted-foreground">Risk</span>
                      </div>
                      <span className="text-sm font-medium">{analytics.mediumRiskCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Low</Badge>
                        <span className="text-xs text-muted-foreground">Risk</span>
                      </div>
                      <span className="text-sm font-medium">{analytics.lowRiskCount}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Risk Points List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Risk Points ({filteredRiskData.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {filteredRiskData.map(point => (
                    <div
                      key={point.id}
                      className="p-2 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => setSelectedPoint(point)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{point.area}</span>
                        <Badge variant={getRiskColor(point.riskLevel) as any}>
                          {point.riskLevel}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <p>Sum Insured: {(point.sumInsured / 1000000).toFixed(1)}M AED</p>
                        <p>Projects: {point.projects}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Map */}
          <div className="flex-1 relative">
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              style={{ height: '100%', width: '100%' }}
              className="z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                subdomains="abcd"
                maxZoom={20}
              />

              {/* Heat map circles for each risk point */}
              {filteredRiskData.map(point => {
                const intensity = point.riskLevel === "High" ? 0.8 : point.riskLevel === "Medium" ? 0.5 : 0.3;
                return (
                  <HeatMapLayer
                    key={point.id}
                    center={[point.lat, point.lng]}
                    radius={radiusFilter}
                    intensity={intensity}
                  />
                );
              })}

              {/* Markers for each risk point */}
              {filteredRiskData.map(point => (
                <Marker
                  key={point.id}
                  position={[point.lat, point.lng]}
                  icon={L.icon({
                    iconUrl: point.riskLevel === "High" 
                      ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png'
                      : point.riskLevel === "Medium"
                      ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png'
                      : 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                  })}
                >
                  <Popup>
                    <div className="p-2">
                      <p className="font-semibold mb-2">{point.area}</p>
                      <div className="space-y-1 text-sm">
                        <p><strong>Sum Insured:</strong> {(point.sumInsured / 1000000).toFixed(1)}M AED</p>
                        <p><strong>Premium:</strong> {(point.premium / 1000).toFixed(0)}K AED</p>
                        <p><strong>Projects:</strong> {point.projects}</p>
                        <p><strong>Risk Level:</strong> <Badge variant={getRiskColor(point.riskLevel) as any}>{point.riskLevel}</Badge></p>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Area center markers */}
              {selectedArea !== "all" && (() => {
                const area = uaeAreas.find(a => a.id === selectedArea);
                if (area) {
                  return (
                    <Circle
                      center={area.center as [number, number]}
                      radius={radiusFilter}
                      pathOptions={{
                        fillColor: area.color,
                        fillOpacity: 0.1,
                        color: area.color,
                        weight: 2,
                        dashArray: "5, 5"
                      }}
                    />
                  );
                }
                return null;
              })()}
            </MapContainer>

            {/* Map Legend */}
            <div className="absolute bottom-4 right-4 bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg z-[1000]">
              <p className="text-xs font-semibold mb-2">Risk Level</p>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>High Risk</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span>Medium Risk</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span>Low Risk</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RiskAccumulationDashboard;

