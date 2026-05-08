import type { Property } from "@/data/mock-properties";
import { Eye, RotateCw, Maximize2, MapPin, Navigation, ZoomIn, ZoomOut, Satellite, Camera, ImageIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useState } from "react";

// Survey reference images for Viva Enterprise
import vivaAerial from "@/assets/survey/viva-aerial-view.jpg";
import vivaExterior from "@/assets/survey/viva-building-exterior.jpg";
import vivaMap from "@/assets/survey/viva-map-view.jpg";
import vivaWarehouse from "@/assets/survey/viva-warehouse.jpg";

// Survey reference images for Al Fattan Currency House
import alFattanTower from "@/assets/survey/al-fattan-tower-full.jpg";
import alFattanPodium from "@/assets/survey/al-fattan-podium.jpg";
import alFattanPavilion from "@/assets/survey/al-fattan-pavilion.jpg";
import alFattanSignage from "@/assets/survey/al-fattan-signage.jpg";

interface StreetViewProps {
  property: Property;
}

interface SurveyImage {
  src: string;
  label: string;
}

const surveyImages: Record<string, SurveyImage[]> = {
  "prop-007": [
    { src: vivaAerial, label: "Aerial Plot View — VIVA Distribution Centre & Landmark Mega DC" },
    { src: vivaMap, label: "Google Maps — Site Location (JAFZA South)" },
    { src: vivaExterior, label: "Building Exterior — Tower, Office, Footbridge, Warehouse" },
    { src: vivaWarehouse, label: "Warehouse Interior — High-bay Racking" },
  ],
  "prop-008": [
    { src: alFattanTower, label: "Al Fattan Currency House — Full Tower View (Tower 2: 136m, 34 floors)" },
    { src: alFattanPodium, label: "Podium & Entrance — Retail Pavilion with curved canopy" },
    { src: alFattanPavilion, label: "DIFC Pavilion Area — Glass & steel structure, landscaped plaza" },
    { src: alFattanSignage, label: "Al Fattan Currency House — Building signage and ACP cladding detail" },
  ],
};

// Accurate Street View configs for real UAE landmarks
const streetViewConfig: Record<string, { heading: number; pitch: number; fov: number; description: string; hasStreetView?: boolean }> = {
  "prop-001": { heading: 328, pitch: 30, fov: 75, description: "Looking up at Burj Khalifa from Sheikh Mohammed bin Rashid Boulevard. The world's tallest structure at 828m — note the Y-shaped footprint and tapering silhouette.", hasStreetView: true },
  "prop-002": { heading: 200, pitch: 20, fov: 80, description: "Emirates Towers from Sheikh Zayed Road. The twin triangular towers (355m office + 309m hotel) dominate the Trade Centre skyline.", hasStreetView: true },
  "prop-003": { heading: 90, pitch: 5, fov: 90, description: "Emirates Global Aluminium (DUBAL) smelter complex in Jebel Ali. Massive industrial sheds housing 2,400+ reduction cells operating at 960°C.", hasStreetView: true },
  "prop-004": { heading: 140, pitch: 10, fov: 85, description: "The Dubai Mall exterior from Financial Center Road. The world's largest mall by total area — 1,200+ retail outlets across 502,000 sqm.", hasStreetView: true },
  "prop-005": { heading: 45, pitch: 5, fov: 90, description: "ADNOC Ruwais Refinery — one of the world's largest integrated refining complexes. Distillation columns and cracking units processing 922,000 barrels/day.", hasStreetView: true },
  "prop-006": { heading: 270, pitch: 15, fov: 80, description: "Etihad Towers from the Corniche. Five-tower complex including the 79-floor T2 with its iconic observation deck at 300m.", hasStreetView: true },
  "prop-007": { heading: 180, pitch: 10, fov: 85, description: "Viva Enterprise Distribution Centre, Plot S60323, JAFZA South. 44,600 sqm warehouse (built 2024) with dry & cold chambers, 111 loading bays. Adjacent to Landmark Group Mega DC.", hasStreetView: false },
  "prop-008": { heading: 310, pitch: 25, fov: 75, description: "Al Fattan Currency House, DIFC — Twin office towers (Tower 1: 40m/10 floors, Tower 2: 136m/34 floors) with retail Pavilion. Built 2009. Façade: 40% non-fire rated ACP + 60% double glazed glass. Total Sum Insured AED 2.1B.", hasStreetView: true },
};

type ViewType = "streetview" | "satellite";

export function StreetView({ property }: StreetViewProps) {
  const config = streetViewConfig[property.id] || { heading: 0, pitch: 0, fov: 90, description: "Street-level view of the property.", hasStreetView: true };
  const [heading, setHeading] = useState(config.heading);
  const [fov, setFov] = useState(config.fov);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewType, setViewType] = useState<ViewType>(config.hasStreetView === false ? "satellite" : "streetview");
  const [showSurvey, setShowSurvey] = useState(false);
  const [surveyIdx, setSurveyIdx] = useState(0);

  const images = surveyImages[property.id] || [];

  const zoomIn = () => setFov((prev) => Math.max(20, prev - 15));
  const zoomOut = () => setFov((prev) => Math.min(120, prev + 15));

  const streetViewUrl = `https://www.google.com/maps/embed/v1/streetview?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&location=${property.lat},${property.lng}&heading=${heading}&pitch=${config.pitch}&fov=${fov}`;
  const satelliteUrl = `https://www.google.com/maps/embed/v1/view?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&center=${property.lat},${property.lng}&zoom=18&maptype=satellite`;

  const rotateView = (delta: number) => {
    setHeading((prev) => (prev + delta + 360) % 360);
  };

  return (
    <div className={`flex flex-col ${isFullscreen ? "fixed inset-0 z-50 bg-background" : "h-full"}`}>
      {/* Controls bar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border shrink-0 bg-card/80 backdrop-blur-sm flex-wrap">
        <Eye className="h-4 w-4 text-primary shrink-0" />
        <span className="text-xs font-medium text-foreground">Immersive View</span>
        <div className="h-4 w-px bg-border mx-1" />

        {/* View type toggle */}
        <div className="flex items-center rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => setViewType("streetview")}
            className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium transition-colors ${viewType === "streetview" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}
          >
            <Camera className="h-3 w-3" /> Street
          </button>
          <button
            onClick={() => setViewType("satellite")}
            className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium transition-colors ${viewType === "satellite" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}
          >
            <Satellite className="h-3 w-3" /> Satellite
          </button>
        </div>

        {viewType === "streetview" && (
          <>
            <div className="h-4 w-px bg-border mx-0.5" />
            <div className="flex items-center gap-1">
              <button onClick={() => rotateView(-45)} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground transition-colors" title="Rotate left">← Rotate</button>
              <button onClick={() => rotateView(45)} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground transition-colors" title="Rotate right">Rotate →</button>
              <div className="h-4 w-px bg-border mx-0.5" />
              <button onClick={zoomIn} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground transition-colors" title="Zoom in">
                <ZoomIn className="h-3 w-3" /> +
              </button>
              <button onClick={zoomOut} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground transition-colors" title="Zoom out">
                <ZoomOut className="h-3 w-3" /> −
              </button>
              <div className="h-4 w-px bg-border mx-0.5" />
              <button onClick={() => { setHeading(config.heading); setFov(config.fov); }} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground transition-colors" title="Reset view">
                <RotateCw className="h-3 w-3" /> Reset
              </button>
            </div>
          </>
        )}

        <div className="flex-1" />

        {/* Survey images button */}
        {images.length > 0 && (
          <button
            onClick={() => setShowSurvey(!showSurvey)}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${showSurvey ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground"}`}
          >
            <ImageIcon className="h-3 w-3" /> Survey Photos ({images.length})
          </button>
        )}

        {viewType === "streetview" && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Navigation className="h-3 w-3" />
            <span>{heading}°</span>
          </div>
        )}

        <button onClick={() => setIsFullscreen(!isFullscreen)} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
          <Maximize2 className="h-3 w-3" />
          {isFullscreen ? "Exit" : "Full"}
        </button>

        <a href={`https://www.google.com/maps/@${property.lat},${property.lng},18z`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
          Open in Maps ↗
        </a>
      </div>

      {/* Context bar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-card/50 shrink-0">
        <MapPin className="h-4 w-4 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-foreground font-medium truncate">{property.address}, {property.city}</p>
          <p className="text-[11px] text-muted-foreground">{config.description}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-muted-foreground bg-accent px-2 py-0.5 rounded-full">
            {property.lat.toFixed(4)}°N, {property.lng.toFixed(4)}°E
          </span>
        </div>
      </div>

      {/* No Street View banner */}
      {viewType === "streetview" && config.hasStreetView === false && (
        <div className="px-4 py-2 bg-status-pending/10 border-b border-border flex items-center gap-2">
          <Satellite className="h-4 w-4 text-status-pending shrink-0" />
          <p className="text-xs text-foreground">
            <span className="font-medium">Street View unavailable</span> for this industrial zone — showing satellite imagery instead.
            <button onClick={() => setViewType("satellite")} className="ml-2 text-primary underline underline-offset-2 hover:text-primary/80">Switch to Satellite</button>
          </p>
        </div>
      )}

      {/* Main view area */}
      <div className="flex-1 relative min-h-[400px]">
        <iframe
          key={`view-${viewType}-${heading}`}
          src={viewType === "satellite" ? satelliteUrl : streetViewUrl}
          className="absolute inset-0 w-full h-full border-0"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={`${viewType === "satellite" ? "Satellite" : "Street"} View of ${property.name}`}
        />

        <div className="absolute top-3 left-3 flex items-center gap-2 rounded-lg bg-background/80 backdrop-blur-sm border border-border px-3 py-1.5 pointer-events-none">
          <div className="h-2 w-2 rounded-full bg-risk-low animate-pulse" />
          <span className="text-[11px] font-medium text-foreground">
            {viewType === "satellite" ? "SATELLITE VIEW" : "LIVE STREET VIEW"}
          </span>
        </div>

        <div className="absolute bottom-3 left-3 pointer-events-none">
          <div className="rounded-lg bg-background/80 backdrop-blur-sm border border-border px-3 py-2">
            <p className="text-xs font-semibold text-foreground">{property.name}</p>
            <p className="text-[10px] text-muted-foreground">{property.type} • {property.constructionMaterial} • {property.floors} floor{property.floors > 1 ? "s" : ""}</p>
          </div>
        </div>

        {/* Survey images overlay */}
        {showSurvey && images.length > 0 && (
          <div className="absolute top-3 right-3 bottom-3 w-[320px] bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden z-10">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-bold text-foreground">Survey Reference Photos</span>
              </div>
              <button onClick={() => setShowSurvey(false)} className="p-1 rounded-lg hover:bg-accent text-muted-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center p-3">
              <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border border-border bg-background">
                <img src={images[surveyIdx].src} alt={images[surveyIdx].label} className="absolute inset-0 w-full h-full object-contain" />
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 text-center leading-snug">{images[surveyIdx].label}</p>
            </div>
            <div className="flex items-center justify-between px-3 py-2 border-t border-border">
              <button onClick={() => setSurveyIdx((i) => (i - 1 + images.length) % images.length)} className="p-1.5 rounded-lg bg-accent hover:bg-primary hover:text-primary-foreground text-muted-foreground transition-colors">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="text-[10px] text-muted-foreground">{surveyIdx + 1} / {images.length}</span>
              <button onClick={() => setSurveyIdx((i) => (i + 1) % images.length)} className="p-1.5 rounded-lg bg-accent hover:bg-primary hover:text-primary-foreground text-muted-foreground transition-colors">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
