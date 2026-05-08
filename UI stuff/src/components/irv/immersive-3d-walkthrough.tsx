import { useState, useEffect, useCallback, useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, Environment, Grid } from "@react-three/drei";
import * as THREE from "three";
import type { Property } from "@/data/mock-properties";
import { calculateRiskScore, getPremiumConfig } from "@/data/mock-properties";
import { FacilityScene, type ViewMode } from "@/components/irv/facility-explorer-3d";
import { generateFacilityData } from "@/data/facility-generator";
import { alFattanFacilityZones, alFattanEquipmentMarkers } from "@/data/al-fattan-survey-data";
import { facilityZones as vivaZones, equipmentMarkers as vivaEquipment, type FacilityZone } from "@/data/viva-survey-data";
import { generateWalkthroughNarration } from "@/server/walkthrough.functions";
import {
  X, ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX,
  Shield, Flame, AlertTriangle, Building2, Eye, MapPin, BarChart3, Gavel
} from "lucide-react";

interface Immersive3DWalkthroughProps {
  property: Property;
  onExit: () => void;
}

interface WalkthroughStop {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  viewMode: ViewMode;
  facts: string[];
  narrationScript: string;
  highlightZones?: string[];
}

function generateStops(property: Property, zones: FacilityZone[]): WalkthroughStop[] {
  const riskBreakdown = calculateRiskScore(property);
  const premiumConfig = getPremiumConfig(property);
  const highRiskZones = zones.filter(z => z.hazards && z.hazards.length > 0);
  const fireZones = zones.filter(z => z.protectionSystems && z.protectionSystems.length > 0);

  const stops: WalkthroughStop[] = [
    {
      id: "overview",
      title: "Property Overview",
      subtitle: "Aerial Perspective",
      icon: <MapPin className="h-4 w-4" />,
      cameraPosition: [30, 25, 30],
      cameraTarget: [0, 3, 0],
      viewMode: "exterior",
      facts: [
        `${property.type} in ${property.city}, ${property.country}`,
        `Sum Insured: AED ${(property.sumInsured / 1e6).toFixed(0)}M`,
        `Broker: ${property.broker}`,
        `Status: ${property.status}`,
      ],
      narrationScript: "",
    },
    {
      id: "structure",
      title: "Building Structure",
      subtitle: "Construction & Age",
      icon: <Building2 className="h-4 w-4" />,
      cameraPosition: [15, 12, 18],
      cameraTarget: [0, 5, 0],
      viewMode: "xray",
      facts: [
        `${property.constructionMaterial} construction`,
        `${property.floors} floors, built ${property.yearBuilt}`,
        `Occupancy: ${property.occupancy}`,
        `Capacity: ${property.occupancyCapacity.toLocaleString()}`,
      ],
      narrationScript: "",
      highlightZones: zones.slice(0, 1).map(z => z.id),
    },
  ];

  // Add high-risk zone stops (up to 3)
  highRiskZones.slice(0, 3).forEach((zone, i) => {
    const pos = zone.position;
    stops.push({
      id: `hotspot-${i}`,
      title: zone.name,
      subtitle: "Risk Hotspot",
      icon: <AlertTriangle className="h-4 w-4" />,
      cameraPosition: [pos.x * 20 + 8, 8, pos.z * 20 + 8],
      cameraTarget: [pos.x * 20, (zone.size.h * 20) / 2, pos.z * 20],
      viewMode: "hazard",
      facts: [
        zone.description,
        ...(zone.hazards?.slice(0, 2) || []),
        zone.dimensions,
      ].filter((f): f is string => Boolean(f)),
      narrationScript: "",
      highlightZones: [zone.id],
    });
  });

  // Fire safety stop
  stops.push({
    id: "fire-safety",
    title: "Fire Protection Systems",
    subtitle: "Safety Infrastructure",
    icon: <Flame className="h-4 w-4" />,
    cameraPosition: [-18, 14, 20],
    cameraTarget: [0, 4, 0],
    viewMode: "fire-safety",
    facts: [
      `Sprinklers: ${property.fireProtection.sprinklers ? "✅ Installed" : "❌ Missing"}`,
      `Alarms: ${property.fireProtection.alarms ? "✅ Active" : "❌ Missing"}`,
      `Extinguishers: ${property.fireProtection.extinguishers ? "✅ Available" : "❌ Missing"}`,
      `Hydrant nearby: ${property.fireProtection.hydrantNearby ? "✅ Yes" : "❌ No"}`,
    ],
    narrationScript: "",
    highlightZones: fireZones.map(z => z.id),
  });

  // Risk score summary
  stops.push({
    id: "risk-summary",
    title: "Risk Assessment",
    subtitle: "Quantified Score",
    icon: <BarChart3 className="h-4 w-4" />,
    cameraPosition: [22, 20, -15],
    cameraTarget: [0, 5, 0],
    viewMode: "exterior",
    facts: [
      `Overall Risk Score: ${property.riskScore}/100`,
      `Construction Risk: ${riskBreakdown.constructionRisk > 0 ? "Elevated" : "Low"}`,
      `${property.aiInsights.filter(i => i.severity === "high").length} high-severity AI insights`,
      `Flood Zone: ${property.floodZone ? "Yes" : "No"}`,
    ],
    narrationScript: "",
  });

  // Recommendation
  stops.push({
    id: "recommendation",
    title: "Underwriting Recommendation",
    subtitle: "Final Assessment",
    icon: <Gavel className="h-4 w-4" />,
    cameraPosition: [25, 18, 25],
    cameraTarget: [0, 6, 0],
    viewMode: "exterior",
    facts: [
      `Risk Score: ${property.riskScore}/100 — ${property.riskScore >= 70 ? "High Risk" : property.riskScore >= 40 ? "Moderate Risk" : "Favorable Risk"}`,
      `Estimated Premium Rate: ${(premiumConfig.baseRatePerMille * (1 + premiumConfig.loadings.reduce((s, l) => s + l.current, 0) / 100)).toFixed(3)}‰`,
      `Key concern: ${property.aiInsights.find(i => i.severity === "high")?.text.slice(0, 80) || "Standard risk profile"}`,
    ],
    narrationScript: "",
  });

  return stops;
}

// Camera controller that smoothly interpolates between stops
function WalkthroughCamera({
  targetPosition,
  targetLookAt,
  isTransitioning,
  onTransitionComplete,
}: {
  targetPosition: [number, number, number];
  targetLookAt: [number, number, number];
  isTransitioning: boolean;
  onTransitionComplete: () => void;
}) {
  const { camera } = useThree();
  const currentLookAt = useRef(new THREE.Vector3(0, 3, 0));
  const targetPos = useRef(new THREE.Vector3(...targetPosition));
  const targetLook = useRef(new THREE.Vector3(...targetLookAt));
  const transitionDone = useRef(false);

  useEffect(() => {
    targetPos.current.set(...targetPosition);
    targetLook.current.set(...targetLookAt);
    transitionDone.current = false;
  }, [targetPosition, targetLookAt]);

  useFrame((_, delta) => {
    const speed = 1.8;
    const t = 1 - Math.exp(-speed * delta);

    camera.position.lerp(targetPos.current, t);
    currentLookAt.current.lerp(targetLook.current, t);
    camera.lookAt(currentLookAt.current);

    // Check if we've arrived
    if (!transitionDone.current && camera.position.distanceTo(targetPos.current) < 0.3) {
      transitionDone.current = true;
      onTransitionComplete();
    }

    // Gentle ambient sway
    if (!isTransitioning) {
      const time = Date.now() * 0.0002;
      camera.position.x += Math.sin(time) * 0.003;
      camera.position.z += Math.cos(time * 0.7) * 0.002;
      camera.lookAt(currentLookAt.current);
    }
  });

  return null;
}

export function Immersive3DWalkthrough({ property, onExit }: Immersive3DWalkthroughProps) {
  const [currentStop, setCurrentStop] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [contentVisible, setContentVisible] = useState(false);
  const [narrationScripts, setNarrationScripts] = useState<string[]>([]);
  const [scriptsLoading, setScriptsLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  const isViva = property.id === "prop-007";
  const isAlFattan = property.id === "prop-008";
  const { zones, equipment } = useMemo(() => {
    if (isViva) return { zones: vivaZones, equipment: vivaEquipment };
    if (isAlFattan) return { zones: alFattanFacilityZones, equipment: alFattanEquipmentMarkers };
    return generateFacilityData(property);
  }, [property, isViva, isAlFattan]);

  const stops = useMemo(() => generateStops(property, zones), [property, zones]);

  // Fetch AI narration scripts
  useEffect(() => {
    const fetchScripts = async () => {
      try {
        const result = await generateWalkthroughNarration({
          data: {
            stops: stops.map(s => ({
              title: s.title,
              propertyName: property.name,
              propertyType: property.type,
              sumInsured: property.sumInsured,
              riskScore: property.riskScore,
              facts: s.facts,
            })),
            propertyContext: `${property.name} — ${property.type} in ${property.city}. ${property.floors} floors, ${property.constructionMaterial}. Risk score: ${property.riskScore}. Sum insured: AED ${(property.sumInsured / 1e6).toFixed(0)}M.`,
          },
        });
        setNarrationScripts(result.scripts);
      } catch {
        // Use empty strings - will trigger fallback display
        setNarrationScripts(stops.map(() => ""));
      } finally {
        setScriptsLoading(false);
      }
    };
    fetchScripts();
  }, [stops, property]);

  const speak = useCallback((text: string) => {
    if (isMuted || !text || typeof window === "undefined" || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;

    // Try to get a good English voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.name.includes("Google") && v.lang.startsWith("en")) ||
      voices.find(v => v.lang.startsWith("en-") && v.name.includes("Male")) ||
      voices.find(v => v.lang.startsWith("en"));
    if (preferred) utterance.voice = preferred;

    utterance.onend = () => {
      if (isPlaying) {
        timerRef.current = setTimeout(() => {
          goToStop(currentStop + 1);
        }, 2000);
      }
    };

    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isMuted, isPlaying, currentStop]);

  const goToStop = useCallback((index: number) => {
    if (index < 0 || index >= stops.length) {
      if (index >= stops.length) setIsPlaying(false);
      return;
    }
    window.speechSynthesis?.cancel();
    clearTimeout(timerRef.current);
    setContentVisible(false);
    setIsTransitioning(true);
    setCurrentStop(index);
  }, [stops.length]);

  const handleTransitionComplete = useCallback(() => {
    setIsTransitioning(false);
    setContentVisible(true);
    const script = narrationScripts[currentStop] || "";
    if (script) {
      speak(script);
    } else if (isPlaying && !scriptsLoading) {
      timerRef.current = setTimeout(() => goToStop(currentStop + 1), 8000);
    }
  }, [currentStop, narrationScripts, speak, isPlaying, scriptsLoading, goToStop]);

  // Handle mute toggle
  useEffect(() => {
    if (isMuted) {
      window.speechSynthesis?.cancel();
    }
  }, [isMuted]);

  // Keyboard controls
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onExit();
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); goToStop(currentStop + 1); }
      if (e.key === "ArrowLeft") goToStop(currentStop - 1);
      if (e.key === "p") setIsPlaying(p => !p);
      if (e.key === "m") setIsMuted(m => !m);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentStop, goToStop, onExit]);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      clearTimeout(timerRef.current);
    };
  }, []);

  const stop = stops[currentStop];
  const script = narrationScripts[currentStop] || "";

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden">
      {/* 3D Canvas — full background */}
      <div className="absolute inset-0">
        <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
          <PerspectiveCamera makeDefault position={[30, 25, 30]} fov={50} />
          <ambientLight intensity={0.35} />
          <directionalLight position={[15, 20, 10]} intensity={0.7} castShadow shadow-mapSize={[2048, 2048]} />
          <directionalLight position={[-10, 15, -5]} intensity={0.25} />
          <fog attach="fog" args={["#0a0a0f", 35, 80]} />

          <Suspense fallback={null}>
            <FacilityScene
              viewMode={stop.viewMode}
              showEquipment={true}
              showLabels={false}
              selectedItem={null}
              onSelectItem={() => {}}
              hoveredZone={null}
              onHoverZone={() => {}}
              isViva={isViva}
              zones={zones}
              equipment={equipment}
              highlightedZones={stop.highlightZones || []}
              propertyId={property.id}
            />
          </Suspense>

          <WalkthroughCamera
            targetPosition={stop.cameraPosition}
            targetLookAt={stop.cameraTarget}
            isTransitioning={isTransitioning}
            onTransitionComplete={handleTransitionComplete}
          />

          <Grid
            args={[60, 60]}
            position={[0, -0.01, 0]}
            cellSize={1}
            cellThickness={0.3}
            cellColor="#1e293b"
            sectionSize={5}
            sectionThickness={0.6}
            sectionColor="#334155"
            fadeDistance={60}
            infiniteGrid
          />
        </Canvas>
      </div>

      {/* Cinematic vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.7) 100%)",
      }} />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 md:px-6 py-3">
        <div className="flex items-center gap-3">
          <button onClick={onExit} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all backdrop-blur-sm">
            <X className="h-4 w-4" />
          </button>
          <div>
            <p className="text-white/30 text-[9px] font-bold tracking-[0.3em] uppercase">Immersive 3D Walkthrough</p>
            <p className="text-white text-sm font-semibold">{property.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsMuted(m => !m)} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all backdrop-blur-sm" title={isMuted ? "Unmute" : "Mute"}>
            {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          </button>
          <button onClick={() => setIsPlaying(p => !p)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-xs transition-all backdrop-blur-sm">
            {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            <span className="hidden md:inline">{isPlaying ? "Pause" : "Play"}</span>
          </button>
          <span className="text-white/25 text-xs font-mono">{currentStop + 1}/{stops.length}</span>
        </div>
      </div>

      {/* Content overlay card */}
      <div className={`absolute bottom-24 left-4 md:left-8 z-20 max-w-md transition-all duration-700 ${contentVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl">
          {/* Stop indicator */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center h-7 w-7 rounded-full bg-white/10 text-white/60">
              {stop.icon}
            </div>
            <div>
              <p className="text-white/40 text-[9px] font-bold tracking-[0.2em] uppercase">{stop.subtitle}</p>
              <h3 className="text-white text-lg font-bold tracking-tight">{stop.title}</h3>
            </div>
          </div>

          {/* Facts */}
          <div className="space-y-1.5 mb-4">
            {stop.facts.map((fact, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary/60 mt-1.5 shrink-0" />
                <p className="text-white/70 text-xs leading-relaxed">{fact}</p>
              </div>
            ))}
          </div>

          {/* Narration script */}
          {script && (
            <div className="border-t border-white/10 pt-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Volume2 className="h-3 w-3 text-primary/60" />
                <p className="text-white/30 text-[9px] font-bold tracking-wider uppercase">Narration</p>
              </div>
              <p className="text-white/50 text-[11px] leading-relaxed italic">{script}</p>
            </div>
          )}
        </div>
      </div>

      {/* Right side — stop dots */}
      <div className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 z-20 hidden md:flex flex-col gap-2.5">
        {stops.map((s, i) => (
          <button key={s.id} onClick={() => goToStop(i)} className="group flex items-center gap-2" title={s.title}>
            <span className={`text-[9px] font-medium transition-all duration-300 whitespace-nowrap ${
              i === currentStop ? "text-white/70 opacity-100 translate-x-0" : "text-white/0 opacity-0 translate-x-2"
            } group-hover:text-white/50 group-hover:opacity-100 group-hover:translate-x-0`}>
              {s.title}
            </span>
            <div className={`h-2 w-2 rounded-full transition-all duration-500 ${
              i === currentStop ? "bg-white scale-125 shadow-[0_0_10px_rgba(255,255,255,0.5)]" :
              i < currentStop ? "bg-white/40" : "bg-white/15"
            }`} />
          </button>
        ))}
      </div>

      {/* Bottom nav */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4">
        <button onClick={() => goToStop(currentStop - 1)} disabled={currentStop === 0} className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white/50 hover:text-white disabled:opacity-20 transition-all backdrop-blur-sm">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="w-36 md:w-48 h-1 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-white/50 rounded-full transition-all duration-1000 ease-out" style={{ width: `${((currentStop + 1) / stops.length) * 100}%` }} />
        </div>
        <button onClick={() => goToStop(currentStop + 1)} disabled={currentStop === stops.length - 1} className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white/50 hover:text-white disabled:opacity-20 transition-all backdrop-blur-sm">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Keyboard hints */}
      <div className="absolute bottom-2 right-4 z-20 text-white/15 text-[9px] hidden md:flex gap-3">
        <span>← → Navigate</span>
        <span>Space Next</span>
        <span>M Mute</span>
        <span>P Pause</span>
        <span>Esc Exit</span>
      </div>
    </div>
  );
}
