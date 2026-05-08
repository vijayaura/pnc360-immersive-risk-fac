import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import type { Property } from "@/data/mock-properties";
import { floodZonePolygons, fireStations, industrialZones } from "@/data/mock-properties";
import { Layers, Droplets, Flame, Factory, MapPin } from "lucide-react";

interface RiskMapProps {
  property: Property;
}

export function RiskMap({ property }: RiskMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [overlays, setOverlays] = useState({
    floodZones: true,
    fireStations: true,
    industrialZones: true,
  });
  const [annotations, setAnnotations] = useState<{ lat: number; lng: number; label: string }[]>([]);
  const [addingAnnotation, setAddingAnnotation] = useState(false);
  const overlayLayersRef = useRef<L.Layer[]>([]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [property.lat, property.lng],
      zoom: 15,
      zoomControl: true,
    });

    // Tile layers
    const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    });

    const satellite = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { attribution: "© Esri" }
    );

    const terrain = L.tileLayer(
      "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      { attribution: "© OpenTopoMap" }
    );

    osm.addTo(map);
    L.control.layers({ "Standard": osm, "Satellite": satellite, "Terrain": terrain }).addTo(map);

    // Property marker
    const propertyIcon = L.divIcon({
      className: "custom-marker",
      html: `<div style="background:oklch(0.62 0.19 250);width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid oklch(0.95 0.01 250);box-shadow:0 2px 8px rgba(0,0,0,0.4)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
      </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    L.marker([property.lat, property.lng], { icon: propertyIcon })
      .addTo(map)
      .bindPopup(`<div style="color:#000"><strong>${property.name}</strong><br/>${property.address}<br/>Risk Score: ${property.riskScore}</div>`);

    // Radius circle
    L.circle([property.lat, property.lng], {
      radius: 500,
      color: "oklch(0.62 0.19 250)",
      fillColor: "oklch(0.62 0.19 250)",
      fillOpacity: 0.05,
      weight: 1,
      dashArray: "5,5",
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [property]);

  // Handle overlays
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing overlays
    overlayLayersRef.current.forEach((l) => map.removeLayer(l));
    overlayLayersRef.current = [];

    if (overlays.floodZones) {
      floodZonePolygons.forEach((fz) => {
        const poly = L.polygon(fz.positions, {
          color: "#4fc3f7",
          fillColor: "#4fc3f7",
          fillOpacity: 0.15,
          weight: 2,
        }).addTo(map);
        poly.bindPopup(`<div style="color:#000"><strong>🌊 ${fz.name}</strong><br/>Flood Risk Zone</div>`);
        overlayLayersRef.current.push(poly);
      });
    }

    if (overlays.fireStations) {
      fireStations.forEach((fs) => {
        const circle = L.circle([fs.lat, fs.lng], {
          radius: fs.radius,
          color: "#ef5350",
          fillColor: "#ef5350",
          fillOpacity: 0.08,
          weight: 1,
        }).addTo(map);

        const icon = L.divIcon({
          className: "fire-station-marker",
          html: `<div style="background:#ef5350;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;font-size:12px">🚒</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker([fs.lat, fs.lng], { icon }).addTo(map);
        marker.bindPopup(`<div style="color:#000"><strong>🚒 ${fs.name}</strong><br/>Coverage: ${fs.radius}m radius</div>`);
        overlayLayersRef.current.push(circle, marker);
      });
    }

    if (overlays.industrialZones) {
      industrialZones.forEach((iz) => {
        const poly = L.polygon(iz.positions, {
          color: "#ffa726",
          fillColor: "#ffa726",
          fillOpacity: 0.12,
          weight: 2,
        }).addTo(map);
        poly.bindPopup(`<div style="color:#000"><strong>⚠️ ${iz.name}</strong><br/>Industrial Zone</div>`);
        overlayLayersRef.current.push(poly);
      });
    }
  }, [overlays]);

  // Handle annotations
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (addingAnnotation) {
      const handler = (e: L.LeafletMouseEvent) => {
        const label = prompt("Enter annotation label:");
        if (label) {
          setAnnotations((prev) => [...prev, { lat: e.latlng.lat, lng: e.latlng.lng, label }]);
        }
        setAddingAnnotation(false);
      };
      map.once("click", handler);
      map.getContainer().style.cursor = "crosshair";
      return () => {
        map.off("click", handler);
        map.getContainer().style.cursor = "";
      };
    } else {
      map.getContainer().style.cursor = "";
    }
  }, [addingAnnotation]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    annotations.forEach((a) => {
      const icon = L.divIcon({
        className: "annotation-marker",
        html: `<div style="background:#ff7043;color:white;padding:2px 8px;border-radius:4px;font-size:11px;white-space:nowrap;font-weight:600;box-shadow:0 2px 4px rgba(0,0,0,0.3)">${a.label}</div>`,
        iconAnchor: [0, 0],
      });
      L.marker([a.lat, a.lng], { icon }).addTo(map);
    });
  }, [annotations]);

  const toggleOverlay = (key: keyof typeof overlays) => {
    setOverlays((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="h-full flex flex-col">
      {/* Overlay controls */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border shrink-0 overflow-x-auto">
        <Layers className="h-4 w-4 text-muted-foreground shrink-0" />
        <OverlayToggle icon={Droplets} label="Flood Zones" active={overlays.floodZones} onClick={() => toggleOverlay("floodZones")} color="text-blue-400" />
        <OverlayToggle icon={Flame} label="Fire Stations" active={overlays.fireStations} onClick={() => toggleOverlay("fireStations")} color="text-red-400" />
        <OverlayToggle icon={Factory} label="Industrial" active={overlays.industrialZones} onClick={() => toggleOverlay("industrialZones")} color="text-orange-400" />
        <div className="h-4 w-px bg-border mx-1" />
        <button
          onClick={() => setAddingAnnotation(!addingAnnotation)}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
            addingAnnotation ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-accent"
          }`}
        >
          <MapPin className="h-3.5 w-3.5" />
          {addingAnnotation ? "Click map to annotate" : "Add Annotation"}
        </button>
      </div>
      <div ref={mapRef} className="flex-1 min-h-[400px]" />
    </div>
  );
}

function OverlayToggle({
  icon: Icon,
  label,
  active,
  onClick,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
        active ? "bg-accent text-foreground" : "bg-card text-muted-foreground opacity-50"
      }`}
    >
      <Icon className={`h-3.5 w-3.5 ${active ? color : ""}`} />
      {label}
    </button>
  );
}
