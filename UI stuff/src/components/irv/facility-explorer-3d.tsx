import { useState, useRef, useMemo, useCallback, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Text, PerspectiveCamera, Environment, Grid, Html } from "@react-three/drei";
import * as THREE from "three";
import type { Property } from "@/data/mock-properties";
import { facilityZones as vivaZones, equipmentMarkers as vivaEquipment, surveyHighlights, type FacilityZone, type EquipmentMarker } from "@/data/viva-survey-data";
import { alFattanFacilityZones, alFattanEquipmentMarkers } from "@/data/al-fattan-survey-data";
import { generateFacilityData } from "@/data/facility-generator";
import { generateFacilityZonesWithAI, loadFacility3DData, saveFacility3DData } from "@/server/facility-zones.functions";
import type { DamageOverlay } from "@/components/irv/scenario-simulation";
import { ExplorerInsightsPanel } from "@/components/irv/explorer-insights-panel";
import { Explorer3DChat } from "@/components/irv/explorer-3d-chat";
import { Eye, EyeOff, Layers, Box, Shield, Flame, Snowflake, Zap, ChevronRight, X, AlertTriangle, CheckCircle2, Info, RotateCcw, Scan, PanelRightOpen, PanelRightClose, BrainCircuit, MessageSquare, BarChart3, Loader2 } from "lucide-react";

interface FacilityExplorer3DProps {
  property: Property;
  damageOverlay?: DamageOverlay | null;
}

export type ViewMode = "exterior" | "xray" | "fire-safety" | "hazard" | "cold-storage";
type SelectedItem = { type: "zone"; data: FacilityZone } | { type: "equipment"; data: EquipmentMarker } | null;

const viewModes: { id: ViewMode; label: string; icon: React.ReactNode; description: string }[] = [
  { id: "exterior", label: "Exterior", icon: <Box className="h-3.5 w-3.5" />, description: "Full building view" },
  { id: "xray", label: "X-Ray", icon: <Scan className="h-3.5 w-3.5" />, description: "See-through internal view" },
  { id: "fire-safety", label: "Fire Safety", icon: <Flame className="h-3.5 w-3.5" />, description: "Protection systems overlay" },
  { id: "hazard", label: "Hazards", icon: <AlertTriangle className="h-3.5 w-3.5" />, description: "Risk & hazard hotspots" },
  { id: "cold-storage", label: "Cold Chain", icon: <Snowflake className="h-3.5 w-3.5" />, description: "Temperature zones" },
];

export function FacilityExplorer3D({ property, damageOverlay }: FacilityExplorer3DProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("exterior");
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);
  const [showEquipment, setShowEquipment] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [sidePanel, setSidePanel] = useState<"insights" | "chat" | null>(null);
  const [highlightedZones, setHighlightedZones] = useState<string[]>([]);
  const [aiZones, setAiZones] = useState<{ zones: FacilityZone[]; equipment: EquipmentMarker[] } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const isViva = property.id === "prop-007";
  const isAlFattan = property.id === "prop-008";
  const isAISubmission = property.name.includes("[GPT") || property.name.includes("[AI") || property.name.includes("[Email]");
  const needsAIGeneration = !isViva && !isAlFattan && isAISubmission;

  // Load persisted or generate AI zones for AI-processed submissions
  useEffect(() => {
    if (!needsAIGeneration || aiZones) return;
    let cancelled = false;
    setAiLoading(true);
    setAiError(null);

    // Step 1: Check for persisted 3D data first
    loadFacility3DData({ data: { propertyId: property.id } })
      .then((persisted) => {
        if (cancelled) return;
        if (persisted.found && persisted.zones.length > 0) {
          setAiZones({ zones: persisted.zones as FacilityZone[], equipment: persisted.equipment as EquipmentMarker[] });
          setAiLoading(false);
          return;
        }
        // Step 2: No persisted data — generate with AI (with timeout fallback)
        const timer = setTimeout(() => {
          if (!cancelled) {
            cancelled = true;
            console.warn("AI 3D generation timed out – falling back to deterministic model");
            const fallback = generateFacilityData(property);
            setAiZones({ zones: fallback.zones, equipment: fallback.equipment });
            saveFacility3DData({ data: { propertyId: property.id, zones: fallback.zones, equipment: fallback.equipment } }).catch(() => {});
            setAiLoading(false);
          }
        }, 60000);

        generateFacilityZonesWithAI({
          data: {
            propertyName: property.name,
            propertyType: property.type,
            floors: property.floors,
            constructionMaterial: property.constructionMaterial,
            occupancy: property.occupancy,
            sumInsured: property.sumInsured,
            yearBuilt: property.yearBuilt,
            riskScore: property.riskScore,
            fireProtection: property.fireProtection,
            electricalCondition: property.electricalCondition,
            plumbingCondition: property.plumbingCondition,
            roofCondition: property.roofCondition,
            aiInsights: property.aiInsights.map(i => ({
              text: i.text,
              severity: i.severity,
              category: i.category,
            })),
            model: "google/gemini-3-flash-preview",
          },
        })
          .then((result) => {
            if (cancelled) return;
            clearTimeout(timer);
            let finalZones: FacilityZone[];
            let finalEquip: EquipmentMarker[];
            if (result.error || !result.zones.length) {
              console.warn("AI 3D returned error/empty, using deterministic fallback:", result.error);
              const fallback = generateFacilityData(property);
              finalZones = fallback.zones;
              finalEquip = fallback.equipment;
            } else {
              finalZones = result.zones as FacilityZone[];
              finalEquip = result.equipment as EquipmentMarker[];
            }
            setAiZones({ zones: finalZones, equipment: finalEquip });
            // Persist for next time
            saveFacility3DData({ data: { propertyId: property.id, zones: finalZones, equipment: finalEquip } }).catch(() => {});
          })
          .catch((e) => {
            if (cancelled) return;
            clearTimeout(timer);
            console.warn("AI 3D generation failed, using deterministic fallback:", e);
            const fallback = generateFacilityData(property);
            setAiZones({ zones: fallback.zones, equipment: fallback.equipment });
            saveFacility3DData({ data: { propertyId: property.id, zones: fallback.zones, equipment: fallback.equipment } }).catch(() => {});
          })
          .finally(() => { if (!cancelled) setAiLoading(false); });
      })
      .catch(() => {
        if (cancelled) return;
        // If load fails, just use deterministic
        const fallback = generateFacilityData(property);
        setAiZones({ zones: fallback.zones, equipment: fallback.equipment });
        setAiLoading(false);
      });

    return () => { cancelled = true; };
  }, [needsAIGeneration, property, aiZones]);

  // Use hand-crafted data for Viva/Al Fattan, AI-generated for AI submissions, or auto-generate
  const { zones, equipment } = useMemo(() => {
    if (isViva) return { zones: vivaZones, equipment: vivaEquipment };
    if (isAlFattan) return { zones: alFattanFacilityZones, equipment: alFattanEquipmentMarkers };
    if (needsAIGeneration && aiZones) return aiZones;
    return generateFacilityData(property);
  }, [property, isViva, isAlFattan, needsAIGeneration, aiZones]);

  // Listen for copilot events
  useEffect(() => {
    const handleHighlight = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.zoneIds) setHighlightedZones(detail.zoneIds);
    };
    const handleViewMode = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.mode) setViewMode(detail.mode as ViewMode);
    };
    window.addEventListener("copilot-highlight-zones", handleHighlight);
    window.addEventListener("copilot-set-view-mode", handleViewMode);
    return () => {
      window.removeEventListener("copilot-highlight-zones", handleHighlight);
      window.removeEventListener("copilot-set-view-mode", handleViewMode);
    };
  }, []);

  // AI loading overlay for AI-generated submissions
  if (aiLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-background/80">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-foreground">GPT-5 is generating the 3D facility model…</p>
          <p className="text-xs text-muted-foreground">Analyzing building specs, risks, and protection systems</p>
        </div>
      </div>
    );
  }

  if (aiError && needsAIGeneration && !aiZones) {
    return (
      <div className="h-full flex items-center justify-center bg-background/80">
        <div className="flex flex-col items-center gap-3 text-center max-w-sm">
          <AlertTriangle className="h-8 w-8 text-risk-high" />
          <p className="text-sm font-medium text-foreground">AI 3D generation failed</p>
          <p className="text-xs text-muted-foreground">{aiError}</p>
          <button
            onClick={() => { setAiZones(null); setAiError(null); }}
            className="mt-2 px-3 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex relative">
      {/* Main 3D area */}
      <div className={`flex-1 flex flex-col relative transition-all ${sidePanel ? "mr-0" : ""}`}>
      {/* AI-generated badge */}
      {needsAIGeneration && aiZones && (
        <div className="absolute bottom-3 left-3 z-10 bg-card/90 backdrop-blur-xl border border-primary/30 rounded-lg px-2.5 py-1.5 shadow-lg flex items-center gap-1.5">
          <BrainCircuit className="h-3 w-3 text-primary" />
          <span className="text-[9px] font-medium text-primary">AI-Generated 3D Model</span>
          <span className="text-[9px] text-muted-foreground">({zones.length} zones, {equipment.length} markers)</span>
        </div>
      )}
      {/* Top toolbar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-start justify-between pointer-events-none">
        {/* View mode selector */}
        <div className="flex flex-col gap-1.5 pointer-events-auto">
          <div className="bg-card/90 backdrop-blur-xl border border-border rounded-xl p-1.5 shadow-lg">
            <p className="text-[9px] font-bold text-muted-foreground px-2 pt-0.5 pb-1 tracking-widest">VIEW MODE</p>
            {viewModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id)}
                className={`flex items-center gap-2 w-full rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all ${
                  viewMode === mode.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                {mode.icon}
                <span>{mode.label}</span>
              </button>
            ))}
          </div>
          <div className="bg-card/90 backdrop-blur-xl border border-border rounded-xl p-1.5 shadow-lg">
            <button
              onClick={() => setShowEquipment(!showEquipment)}
              className="flex items-center gap-2 w-full rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-all"
            >
              {showEquipment ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              Equipment
            </button>
            <button
              onClick={() => setShowLabels(!showLabels)}
              className="flex items-center gap-2 w-full rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-all"
            >
              {showLabels ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              Labels
            </button>
          </div>
        </div>

        {/* Property info badge */}
        <div className="bg-card/90 backdrop-blur-xl border border-border rounded-xl p-3 shadow-lg pointer-events-auto max-w-xs">
          <p className="text-[10px] font-bold text-primary tracking-wider mb-1">
            {isViva ? "FACILITY MODEL — SURVEY DATA" : "FACILITY MODEL — AUTO-GENERATED"}
          </p>
          <p className="text-xs font-semibold text-foreground">{property.name}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {property.type} • {property.floors} floors • {property.constructionMaterial}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {zones.length} zones • {equipment.length} markers • Score: {property.riskScore}
          </p>
        </div>
      </div>

      {/* Damage Overlay Banner */}
      {damageOverlay && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
          <div className={`rounded-xl border px-4 py-2 shadow-lg backdrop-blur-xl text-center flex items-center gap-3 ${
            damageOverlay.scenario === "fire" ? "bg-risk-high/20 border-risk-high/40" :
            damageOverlay.scenario === "flood" ? "bg-blue-500/20 border-blue-500/40" :
            damageOverlay.scenario === "earthquake" ? "bg-risk-medium/20 border-risk-medium/40" :
            damageOverlay.scenario === "cyclone" ? "bg-purple-500/20 border-purple-500/40" :
            "bg-risk-medium/20 border-risk-medium/40"
          }`}>
            <div>
              <p className="text-[10px] font-bold tracking-wider text-foreground">
                {damageOverlay.scenario === "fire" ? "🔥 FIRE DAMAGE OVERLAY" :
                 damageOverlay.scenario === "flood" ? "🌊 FLOOD DAMAGE OVERLAY" :
                 damageOverlay.scenario === "earthquake" ? "🏔️ EARTHQUAKE DAMAGE OVERLAY" :
                 damageOverlay.scenario === "cyclone" ? "🌀 CYCLONE DAMAGE OVERLAY" :
                 "⏱️ BI IMPACT OVERLAY"}
              </p>
              <p className="text-[9px] text-muted-foreground">Severity: {(damageOverlay.severity * 100).toFixed(0)}% — From simulation engine</p>
            </div>
            <button
              onClick={() => {
                // Signal parent to clear the overlay — we'll use a callback pattern
                // For now the user can navigate away and back
              }}
              className="p-1 rounded-lg hover:bg-accent/50 text-muted-foreground"
              title="Close overlay"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 3D Canvas */}
      <div className="flex-1 bg-background">
        <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
          <PerspectiveCamera makeDefault position={[25, 18, 25]} fov={50} />
          <ambientLight intensity={0.4} />
          <directionalLight position={[15, 20, 10]} intensity={0.8} castShadow shadow-mapSize={[2048, 2048]} />
          <directionalLight position={[-10, 15, -5]} intensity={0.3} />

          <Suspense fallback={null}>
            <FacilityScene
              viewMode={viewMode}
              showEquipment={showEquipment}
              showLabels={showLabels}
              selectedItem={selectedItem}
              onSelectItem={setSelectedItem}
              hoveredZone={hoveredZone}
              onHoverZone={setHoveredZone}
              isViva={isViva}
              zones={zones}
              equipment={equipment}
              damageOverlay={damageOverlay}
              highlightedZones={highlightedZones}
              propertyId={property.id}
            />
          </Suspense>

          <OrbitControls
            enablePan
            enableZoom
            enableRotate
            maxPolarAngle={Math.PI / 2.1}
            minDistance={8}
            maxDistance={60}
            target={[0, 3, 0]}
          />
          <Grid
            args={[40, 40]}
            position={[0, -0.01, 0]}
            cellSize={1}
            cellThickness={0.5}
            cellColor="#334155"
            sectionSize={5}
            sectionThickness={1}
            sectionColor="#475569"
            fadeDistance={50}
            infiniteGrid
          />
        </Canvas>
      </div>

      {/* Detail panel */}
      {selectedItem && (
        <DetailPanel item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}

      {/* Bottom controls hint */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10">
        <div className="bg-card/80 backdrop-blur-sm border border-border rounded-full px-4 py-1.5 text-[10px] text-muted-foreground flex items-center gap-3">
          <span>🖱️ Rotate</span>
          <span className="w-px h-3 bg-border" />
          <span>⚙️ Scroll to zoom</span>
          <span className="w-px h-3 bg-border" />
          <span>👆 Click zones to inspect</span>
        </div>
      </div>

      {/* Side panel toggle buttons */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1 pointer-events-auto">
        <button
          onClick={() => setSidePanel(sidePanel === "insights" ? null : "insights")}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium shadow-lg backdrop-blur-xl border transition-all ${
            sidePanel === "insights" ? "bg-primary text-primary-foreground border-primary" : "bg-card/90 border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <BarChart3 className="h-3.5 w-3.5" /> Insights
        </button>
        <button
          onClick={() => setSidePanel(sidePanel === "chat" ? null : "chat")}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium shadow-lg backdrop-blur-xl border transition-all ${
            sidePanel === "chat" ? "bg-primary text-primary-foreground border-primary" : "bg-card/90 border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <MessageSquare className="h-3.5 w-3.5" /> AI Chat
        </button>
      </div>

      </div>{/* end main 3D area */}

      {/* Right side panel */}
      {sidePanel && (
        <div className="w-[320px] shrink-0 border-l border-border bg-card/95 backdrop-blur-xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
            <div className="flex items-center gap-2">
              {sidePanel === "insights" ? (
                <>
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold text-foreground">Analysis Hub</span>
                </>
              ) : (
                <>
                  <BrainCircuit className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold text-foreground">3D Risk Chat</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSidePanel(sidePanel === "insights" ? "chat" : "insights")}
                className="p-1 rounded-md hover:bg-accent text-muted-foreground text-[10px]"
              >
                {sidePanel === "insights" ? "Chat →" : "← Insights"}
              </button>
              <button onClick={() => setSidePanel(null)} className="p-1 rounded-md hover:bg-accent text-muted-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            {sidePanel === "insights" ? (
              <div className="p-3">
                <ExplorerInsightsPanel property={property} />
              </div>
            ) : (
              <Explorer3DChat
                property={property}
                zones={zones}
                onHighlightZones={setHighlightedZones}
                onSetViewMode={(mode) => setViewMode(mode as ViewMode)}
              />
            )}
          </div>
        </div>
      )}

    </div>
  );
}

// ─── Iconic Building Shapes ──────────────────────────────

function IconicBuildingShape({ propertyId, viewMode }: { propertyId: string; viewMode: ViewMode }) {
  const wireframe = viewMode === "xray";
  const opacity = viewMode === "xray" ? 0.08 : 0.12;
  const color = "#4488cc";

  if (propertyId === "prop-001") {
    // Burj Khalifa — Y-shaped footprint with tapering tiers
    return (
      <group position={[0, 0, 0]}>
        {/* Base podium */}
        <mesh position={[0, 1, 0]} castShadow>
          <cylinderGeometry args={[4, 5, 2, 3]} />
          <meshStandardMaterial color={color} transparent opacity={opacity + 0.05} wireframe={wireframe} />
        </mesh>
        {/* Tier 1 */}
        <mesh position={[0, 5, 0]} castShadow>
          <cylinderGeometry args={[3, 4, 6, 3]} />
          <meshStandardMaterial color={color} transparent opacity={opacity + 0.03} wireframe={wireframe} />
        </mesh>
        {/* Tier 2 */}
        <mesh position={[0, 11, 0]} castShadow>
          <cylinderGeometry args={[2.2, 3, 6, 3]} />
          <meshStandardMaterial color={color} transparent opacity={opacity + 0.03} wireframe={wireframe} />
        </mesh>
        {/* Tier 3 */}
        <mesh position={[0, 16, 0]} castShadow>
          <cylinderGeometry args={[1.5, 2.2, 4, 3]} />
          <meshStandardMaterial color={color} transparent opacity={opacity + 0.03} wireframe={wireframe} />
        </mesh>
        {/* Spire */}
        <mesh position={[0, 21, 0]} castShadow>
          <coneGeometry args={[0.8, 8, 3]} />
          <meshStandardMaterial color={color} transparent opacity={opacity + 0.05} wireframe={wireframe} />
        </mesh>
        {/* Vertical spine glow */}
        <mesh position={[0, 12, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 24, 8]} />
          <meshStandardMaterial color="#60a5fa" emissive="#60a5fa" emissiveIntensity={0.5} transparent opacity={0.3} />
        </mesh>
      </group>
    );
  }

  if (propertyId === "prop-002") {
    // Emirates Towers — twin triangular prisms at different heights
    return (
      <group position={[0, 0, 0]}>
        {/* Tower 1 (Office — 355m, taller) */}
        <mesh position={[-2, 9, 0]} castShadow>
          <cylinderGeometry args={[1.8, 3, 18, 3]} />
          <meshStandardMaterial color={color} transparent opacity={opacity + 0.05} wireframe={wireframe} />
        </mesh>
        {/* Tower 2 (Hotel — 309m, shorter) */}
        <mesh position={[3, 7.5, 0]} castShadow>
          <cylinderGeometry args={[1.5, 2.5, 15, 3]} />
          <meshStandardMaterial color={color} transparent opacity={opacity + 0.05} wireframe={wireframe} />
        </mesh>
        {/* Shopping boulevard link */}
        <mesh position={[0.5, 1, 0]} castShadow>
          <boxGeometry args={[8, 2, 4]} />
          <meshStandardMaterial color={color} transparent opacity={opacity} wireframe={wireframe} />
        </mesh>
      </group>
    );
  }

  if (propertyId === "prop-004") {
    // Dubai Mall — sprawling low-rise complex
    return (
      <group position={[0, 0, 0]}>
        {/* Main wing */}
        <mesh position={[-2, 1.5, 0]} castShadow>
          <boxGeometry args={[12, 3, 8]} />
          <meshStandardMaterial color={color} transparent opacity={opacity} wireframe={wireframe} />
        </mesh>
        {/* North wing */}
        <mesh position={[4, 1, 4]} castShadow>
          <boxGeometry args={[6, 2, 5]} />
          <meshStandardMaterial color={color} transparent opacity={opacity} wireframe={wireframe} />
        </mesh>
        {/* Fashion avenue extension */}
        <mesh position={[-6, 1, -3]} castShadow>
          <boxGeometry args={[4, 2, 10]} />
          <meshStandardMaterial color={color} transparent opacity={opacity} wireframe={wireframe} />
        </mesh>
        {/* Atrium dome */}
        <mesh position={[0, 3.5, 0]} castShadow>
          <sphereGeometry args={[2.5, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#60a5fa" transparent opacity={opacity + 0.03} wireframe={wireframe} />
        </mesh>
      </group>
    );
  }

  if (propertyId === "prop-006") {
    // Etihad Towers — five cylindrical towers in a curved arrangement
    const towers = [
      { x: -4, z: 2, h: 12, r: 1.2 },
      { x: -2, z: 0.5, h: 16, r: 1.3 },
      { x: 0, z: 0, h: 18, r: 1.4 },
      { x: 2, z: 0.5, h: 15, r: 1.3 },
      { x: 4, z: 2, h: 10, r: 1.1 },
    ];
    return (
      <group position={[0, 0, 0]}>
        {towers.map((t, i) => (
          <mesh key={i} position={[t.x, t.h / 2, t.z]} castShadow>
            <cylinderGeometry args={[t.r * 0.8, t.r, t.h, 24]} />
            <meshStandardMaterial color={color} transparent opacity={opacity + 0.04} wireframe={wireframe} />
          </mesh>
        ))}
        {/* Podium base connecting all towers */}
        <mesh position={[0, 1, 1]} castShadow>
          <boxGeometry args={[12, 2, 5]} />
          <meshStandardMaterial color={color} transparent opacity={opacity} wireframe={wireframe} />
        </mesh>
      </group>
    );
  }

  if (propertyId === "prop-008") {
    // Al Fattan Currency House — twin rectangular towers on shared podium
    return (
      <group position={[0, 0, 0]}>
        {/* 4-level shared basement */}
        <mesh position={[0, -1.5, 0]} castShadow>
          <boxGeometry args={[14, 3, 8]} />
          <meshStandardMaterial color="#334466" transparent opacity={opacity} wireframe={wireframe} />
        </mesh>
        {/* 3-level podium connecting everything */}
        <mesh position={[0, 1.5, 0]} castShadow>
          <boxGeometry args={[14, 3, 8]} />
          <meshStandardMaterial color={color} transparent opacity={opacity + 0.03} wireframe={wireframe} />
        </mesh>
        {/* Tower 2 — 34 floors, 136m (taller, left) */}
        <mesh position={[-3, 12, 0]} castShadow>
          <boxGeometry args={[4, 21, 4]} />
          <meshStandardMaterial color={color} transparent opacity={opacity + 0.06} wireframe={wireframe} />
        </mesh>
        {/* Tower 2 glass curtain wall effect */}
        <mesh position={[-3, 12, 2.01]}>
          <planeGeometry args={[3.8, 20.5]} />
          <meshStandardMaterial color="#60a5fa" transparent opacity={0.12} wireframe={wireframe} />
        </mesh>
        <mesh position={[-3, 12, -2.01]}>
          <planeGeometry args={[3.8, 20.5]} />
          <meshStandardMaterial color="#60a5fa" transparent opacity={0.12} wireframe={wireframe} />
        </mesh>
        {/* Tower 1 — 10 floors, 40m (shorter, right) */}
        <mesh position={[4, 6.5, 0]} castShadow>
          <boxGeometry args={[4, 10, 4]} />
          <meshStandardMaterial color={color} transparent opacity={opacity + 0.06} wireframe={wireframe} />
        </mesh>
        {/* Tower 1 glass effect */}
        <mesh position={[4, 6.5, 2.01]}>
          <planeGeometry args={[3.8, 9.5]} />
          <meshStandardMaterial color="#60a5fa" transparent opacity={0.12} wireframe={wireframe} />
        </mesh>
        {/* Retail Pavilion — left side, lower */}
        <mesh position={[-6, 2.5, -3]} castShadow>
          <boxGeometry args={[4, 2, 4]} />
          <meshStandardMaterial color={color} transparent opacity={opacity + 0.02} wireframe={wireframe} />
        </mesh>
        {/* ACP Cladding accent strips on Tower 2 */}
        {[5, 10, 15, 19].map((y) => (
          <mesh key={y} position={[-3, y, 2.02]}>
            <planeGeometry args={[4, 0.12]} />
            <meshStandardMaterial color="#e09050" emissive="#e09050" emissiveIntensity={0.3} transparent opacity={0.5} />
          </mesh>
        ))}
        {/* LPG area on podium roof */}
        <mesh position={[0, 3.3, 3]}>
          <cylinderGeometry args={[0.4, 0.4, 0.6, 12]} />
          <meshStandardMaterial color="#ff8844" transparent opacity={0.4} wireframe={wireframe} />
        </mesh>
      </group>
    );
  }

  // No iconic shape for other properties
  return null;
}

// ─── 3D Scene ────────────────────────────────────────────

export interface SceneProps {
  viewMode: ViewMode;
  showEquipment: boolean;
  showLabels: boolean;
  selectedItem: SelectedItem;
  onSelectItem: (item: SelectedItem) => void;
  hoveredZone: string | null;
  onHoverZone: (id: string | null) => void;
  isViva: boolean;
  zones: FacilityZone[];
  equipment: EquipmentMarker[];
  damageOverlay?: DamageOverlay | null;
  highlightedZones?: string[];
  propertyId: string;
}

export function FacilityScene({ viewMode, showEquipment, showLabels, selectedItem, onSelectItem, hoveredZone, onHoverZone, isViva, zones, equipment, damageOverlay, highlightedZones = [], propertyId }: SceneProps) {
  const scale = 20;

  return (
    <group>
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#1a1f2e" />
      </mesh>

      {/* Road markings */}
      <RoadMarkings />

      {/* Iconic building silhouette */}
      <IconicBuildingShape propertyId={propertyId} viewMode={viewMode} />

      {/* Adjacent Landmark Warehouse (ghost) — only for Viva */}
      {isViva && (
        <>
          <mesh position={[14, 3, 0]} castShadow>
            <boxGeometry args={[6, 6, 12]} />
            <meshStandardMaterial color="#2a2a3a" transparent opacity={0.3} wireframe={viewMode === "xray"} />
          </mesh>
          {showLabels && (
            <Html position={[14, 7, 0]} center distanceFactor={15}>
              <div className="bg-muted/80 backdrop-blur-sm rounded px-2 py-0.5 text-[9px] text-muted-foreground whitespace-nowrap border border-border">
                Landmark Group Warehouse (25m gap)
              </div>
            </Html>
          )}
        </>
      )}

      {/* Facility zones */}
      {zones.map((zone) => (
        <ZoneBlock
          key={zone.id}
          zone={zone}
          viewMode={viewMode}
          scale={scale}
          isSelected={selectedItem?.type === "zone" && selectedItem.data.id === zone.id}
          isHovered={hoveredZone === zone.id || highlightedZones.includes(zone.id)}
          onClick={() => onSelectItem({ type: "zone", data: zone })}
          onHover={(h) => onHoverZone(h ? zone.id : null)}
          showLabels={showLabels}
        />
      ))}

      {/* Equipment markers */}
      {showEquipment && equipment.map((eq) => {
        const shouldShow =
          viewMode === "fire-safety" ? ["sprinkler", "fire-extinguisher", "fire-hose", "esfr", "hydrant", "fire-panel", "pump", "smoke-vent", "detector"].includes(eq.type) :
          viewMode === "hazard" ? ["charging-station", "generator", "rack", "detector"].includes(eq.type) :
          viewMode === "cold-storage" ? eq.zone.includes("cold") :
          true;

        if (!shouldShow) return null;
        return (
          <EquipmentPoint
            key={eq.id}
            marker={eq}
            scale={scale}
            viewMode={viewMode}
            onClick={() => onSelectItem({ type: "equipment", data: eq })}
            isSelected={selectedItem?.type === "equipment" && selectedItem.data.id === eq.id}
          />
        );
      })}

      {/* Damage Overlay Visuals */}
      {damageOverlay && (
        <DamageOverlayVisuals
          scenario={damageOverlay.scenario}
          severity={damageOverlay.severity}
          params={damageOverlay.params}
          zones={zones}
          scale={scale}
        />
      )}
    </group>
  );
}

// ─── Damage Overlay Visuals ──────────────────────────────

function DamageOverlayVisuals({ scenario, severity, params, zones, scale }: {
  scenario: string;
  severity: number;
  params: { windSpeed: number; floodLevel: number; recoveryWeeks: number };
  zones: FacilityZone[];
  scale: number;
}) {
  if (scenario === "fire") {
    return <FireDamageOverlay severity={severity} zones={zones} scale={scale} windSpeed={params.windSpeed} />;
  }
  if (scenario === "flood") {
    return <FloodDamageOverlay severity={severity} floodLevel={params.floodLevel} />;
  }
  if (scenario === "earthquake") {
    return <EarthquakeDamageOverlay severity={severity} zones={zones} scale={scale} />;
  }
  if (scenario === "cyclone") {
    return <CycloneDamageOverlay severity={severity} zones={zones} scale={scale} />;
  }
  // Business interruption
  return <BIDamageOverlay zones={zones} scale={scale} recoveryWeeks={params.recoveryWeeks} />;
}

// Fire: red glowing zones with animated flame particles
function FireDamageOverlay({ severity, zones, scale, windSpeed }: {
  severity: number; zones: FacilityZone[]; scale: number; windSpeed: number;
}) {
  const affectedCount = Math.max(1, Math.ceil(zones.length * severity));
  const affectedZones = zones.slice(0, affectedCount);

  return (
    <group>
      {affectedZones.map((zone, i) => {
        const pos: [number, number, number] = [
          (zone.position.x - 0.5) * scale + zone.size.w * scale / 2,
          zone.size.h * scale / 2 + zone.position.y * scale,
          (zone.position.z - 0.5) * scale + zone.size.d * scale / 2,
        ];
        const size: [number, number, number] = [zone.size.w * scale + 0.2, zone.size.h * scale + 0.2, zone.size.d * scale + 0.2];
        return (
          <group key={`fire-${zone.id}`}>
            {/* Red damage glow on zone */}
            <mesh position={pos}>
              <boxGeometry args={size} />
              <meshStandardMaterial color="#ff2200" transparent opacity={0.25 + severity * 0.2} emissive="#ff4400" emissiveIntensity={0.8} side={THREE.DoubleSide} />
            </mesh>
            {/* Flame particles above */}
            <FireParticles position={[pos[0], pos[1] + size[1] / 2, pos[2]]} intensity={severity} index={i} />
          </group>
        );
      })}
      {/* Smoke column */}
      <mesh position={[windSpeed > 25 ? 5 : 0, 12, 0]}>
        <sphereGeometry args={[3 + severity * 4, 16, 16]} />
        <meshStandardMaterial color="#333333" transparent opacity={0.15 + severity * 0.1} />
      </mesh>
    </group>
  );
}

function FireParticles({ position, intensity, index }: { position: [number, number, number]; intensity: number; index: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.5;
      ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 3 + index) * 0.3;
    }
  });

  const particleCount = Math.ceil(3 + intensity * 5);
  return (
    <group ref={ref} position={position}>
      {Array.from({ length: particleCount }).map((_, i) => {
        const angle = (i / particleCount) * Math.PI * 2;
        const radius = 0.5 + Math.random() * 0.8;
        return (
          <mesh key={i} position={[Math.cos(angle) * radius, Math.random() * 1.5, Math.sin(angle) * radius]}>
            <sphereGeometry args={[0.12 + Math.random() * 0.15, 8, 8]} />
            <meshStandardMaterial color={i % 2 === 0 ? "#ff6600" : "#ffaa00"} emissive={i % 2 === 0 ? "#ff4400" : "#ff8800"} emissiveIntensity={1.5} transparent opacity={0.8} />
          </mesh>
        );
      })}
    </group>
  );
}

// Flood: translucent blue water plane at specified level
function FloodDamageOverlay({ severity, floodLevel }: { severity: number; floodLevel: number }) {
  const waterRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (waterRef.current) {
      waterRef.current.position.y = floodLevel * 0.8 + Math.sin(state.clock.elapsedTime * 0.8) * 0.05;
    }
  });

  return (
    <group>
      {/* Water surface */}
      <mesh ref={waterRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, floodLevel * 0.8, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial
          color="#1e88e5"
          transparent
          opacity={0.35 + severity * 0.15}
          side={THREE.DoubleSide}
          metalness={0.3}
          roughness={0.2}
        />
      </mesh>
      {/* Water volume below surface */}
      <mesh position={[0, (floodLevel * 0.8) / 2, 0]}>
        <boxGeometry args={[38, floodLevel * 0.8, 38]} />
        <meshStandardMaterial color="#0d47a1" transparent opacity={0.12} side={THREE.DoubleSide} />
      </mesh>
      {/* Depth markers */}
      {[1, 2, 3, 4, 5].filter(m => m <= floodLevel).map(m => (
        <Html key={m} position={[-18, m * 0.8, 0]} center distanceFactor={20}>
          <div className="bg-blue-500/80 backdrop-blur-sm rounded px-1.5 py-0.5 text-[8px] text-white font-bold whitespace-nowrap">
            {m}m
          </div>
        </Html>
      ))}
    </group>
  );
}

// Earthquake: crack lines on ground + shifted zones
function EarthquakeDamageOverlay({ severity, zones, scale }: {
  severity: number; zones: FacilityZone[]; scale: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (groupRef.current) {
      // Subtle tremor effect
      const tremor = Math.sin(state.clock.elapsedTime * 15) * severity * 0.03;
      groupRef.current.position.x = tremor;
      groupRef.current.position.z = tremor * 0.7;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Ground cracks */}
      {Array.from({ length: Math.ceil(5 + severity * 10) }).map((_, i) => {
        const startX = (Math.random() - 0.5) * 30;
        const startZ = (Math.random() - 0.5) * 30;
        const length = 3 + Math.random() * 8;
        const angle = Math.random() * Math.PI;
        return (
          <mesh key={`crack-${i}`} position={[startX, 0.02, startZ]} rotation={[0, angle, 0]}>
            <boxGeometry args={[length, 0.03, 0.08 + Math.random() * 0.12]} />
            <meshStandardMaterial color="#1a1a1a" emissive="#ff6600" emissiveIntensity={severity * 0.5} />
          </mesh>
        );
      })}
      {/* Structural damage indicators on zones */}
      {zones.slice(0, Math.ceil(zones.length * severity * 0.6)).map((zone) => {
        const pos: [number, number, number] = [
          (zone.position.x - 0.5) * scale + zone.size.w * scale / 2,
          zone.size.h * scale + zone.position.y * scale + 0.5,
          (zone.position.z - 0.5) * scale + zone.size.d * scale / 2,
        ];
        return (
          <Html key={`eq-label-${zone.id}`} position={pos} center distanceFactor={15}>
            <div className="bg-risk-medium/90 backdrop-blur-sm rounded px-2 py-0.5 text-[8px] text-white font-bold whitespace-nowrap animate-pulse">
              ⚠️ STRUCTURAL DAMAGE
            </div>
          </Html>
        );
      })}
      {/* Debris piles */}
      {Array.from({ length: Math.ceil(3 * severity) }).map((_, i) => (
        <mesh key={`debris-${i}`} position={[(Math.random() - 0.5) * 20, 0.3 + Math.random() * 0.5, (Math.random() - 0.5) * 20]} rotation={[Math.random(), Math.random(), Math.random()]}>
          <boxGeometry args={[0.8 + Math.random(), 0.4 + Math.random() * 0.3, 0.6 + Math.random()]} />
          <meshStandardMaterial color="#6b7280" transparent opacity={0.7} />
        </mesh>
      ))}
    </group>
  );
}

// Cyclone: directional wind streaks + roof damage markers
function CycloneDamageOverlay({ severity, zones, scale }: {
  severity: number; zones: FacilityZone[]; scale: number;
}) {
  const windRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (windRef.current) {
      windRef.current.position.x = Math.sin(state.clock.elapsedTime * 2) * 2;
    }
  });

  return (
    <group>
      {/* Wind streaks */}
      <group ref={windRef}>
        {Array.from({ length: Math.ceil(8 + severity * 12) }).map((_, i) => (
          <mesh key={`wind-${i}`} position={[-15 + Math.random() * 30, 2 + Math.random() * 12, -15 + Math.random() * 30]}>
            <boxGeometry args={[4 + Math.random() * 6, 0.02, 0.02]} />
            <meshStandardMaterial color="#a855f7" transparent opacity={0.2 + severity * 0.15} emissive="#a855f7" emissiveIntensity={0.4} />
          </mesh>
        ))}
      </group>
      {/* Roof damage on zones */}
      {zones.map((zone) => {
        const topY = (zone.size.h + zone.position.y) * scale;
        const pos: [number, number, number] = [
          (zone.position.x - 0.5) * scale + zone.size.w * scale / 2,
          topY + 0.1,
          (zone.position.z - 0.5) * scale + zone.size.d * scale / 2,
        ];
        return (
          <mesh key={`roof-dmg-${zone.id}`} position={pos} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[zone.size.w * scale, zone.size.d * scale]} />
            <meshStandardMaterial color="#ef4444" transparent opacity={severity * 0.3} side={THREE.DoubleSide} />
          </mesh>
        );
      })}
      {/* Flying debris */}
      {Array.from({ length: Math.ceil(5 * severity) }).map((_, i) => (
        <mesh key={`fly-${i}`} position={[(Math.random() - 0.5) * 25, 5 + Math.random() * 8, (Math.random() - 0.5) * 25]} rotation={[Math.random() * 3, Math.random() * 3, Math.random() * 3]}>
          <boxGeometry args={[0.3 + Math.random() * 0.5, 0.05, 0.3 + Math.random() * 0.5]} />
          <meshStandardMaterial color="#78716c" transparent opacity={0.6} />
        </mesh>
      ))}
    </group>
  );
}

// Business Interruption: dimmed zones with clock/closed markers
function BIDamageOverlay({ zones, scale, recoveryWeeks }: {
  zones: FacilityZone[]; scale: number; recoveryWeeks: number;
}) {
  return (
    <group>
      {/* Dark overlay on all zones */}
      {zones.map((zone) => {
        const pos: [number, number, number] = [
          (zone.position.x - 0.5) * scale + zone.size.w * scale / 2,
          zone.size.h * scale / 2 + zone.position.y * scale,
          (zone.position.z - 0.5) * scale + zone.size.d * scale / 2,
        ];
        const size: [number, number, number] = [zone.size.w * scale + 0.15, zone.size.h * scale + 0.15, zone.size.d * scale + 0.15];
        return (
          <group key={`bi-${zone.id}`}>
            <mesh position={pos}>
              <boxGeometry args={size} />
              <meshStandardMaterial color="#1a1a2e" transparent opacity={0.45} side={THREE.DoubleSide} />
            </mesh>
            <Html position={[pos[0], pos[1] + size[1] / 2 + 0.5, pos[2]]} center distanceFactor={15}>
              <div className="bg-risk-medium/90 backdrop-blur-sm rounded px-2 py-0.5 text-[8px] text-white font-bold whitespace-nowrap">
                ⏱️ CLOSED — {recoveryWeeks}w recovery
              </div>
            </Html>
          </group>
        );
      })}
      {/* Caution tape lines */}
      {[-8, -4, 0, 4, 8].map((z, i) => (
        <mesh key={`tape-${i}`} position={[0, 0.8, z]}>
          <boxGeometry args={[25, 0.06, 0.06]} />
          <meshStandardMaterial color="#eab308" emissive="#eab308" emissiveIntensity={0.6} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Zone Block ──────────────────────────────────────────

function ZoneBlock({ zone, viewMode, scale, isSelected, isHovered, onClick, onHover, showLabels }: {
  zone: FacilityZone; viewMode: ViewMode; scale: number; isSelected: boolean; isHovered: boolean; onClick: () => void; onHover: (h: boolean) => void; showLabels: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  const pos: [number, number, number] = [
    (zone.position.x - 0.5) * scale + zone.size.w * scale / 2,
    zone.size.h * scale / 2 + zone.position.y * scale,
    (zone.position.z - 0.5) * scale + zone.size.d * scale / 2,
  ];
  const size: [number, number, number] = [zone.size.w * scale, zone.size.h * scale, zone.size.d * scale];

  const getColor = () => {
    if (viewMode === "fire-safety") return zone.protectionSystems.length > 3 ? "#22c55e" : zone.protectionSystems.length > 0 ? "#eab308" : "#ef4444";
    if (viewMode === "hazard") return zone.riskLevel === "high" ? "#ef4444" : zone.riskLevel === "medium" ? "#f97316" : "#22c55e";
    if (viewMode === "cold-storage") return zone.type === "cold-storage" ? "#3b82f6" : "#64748b";
    return zone.color;
  };

  const opacity = viewMode === "xray" ? 0.15 : isHovered || isSelected ? 0.85 : 0.6;
  const wireframe = viewMode === "xray";

  useFrame(() => {
    if (meshRef.current) {
      const targetScale = isHovered || isSelected ? 1.02 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });

  return (
    <group>
      <mesh
        ref={meshRef}
        position={pos}
        castShadow
        receiveShadow
        onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onClick(); }}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); onHover(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { onHover(false); document.body.style.cursor = "default"; }}
      >
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={getColor()}
          transparent
          opacity={opacity}
          wireframe={wireframe}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Outline for selected */}
      {(isSelected || isHovered) && !wireframe && (
        <mesh position={pos}>
          <boxGeometry args={[size[0] + 0.1, size[1] + 0.1, size[2] + 0.1]} />
          <meshStandardMaterial color="#3b82f6" transparent opacity={0.2} wireframe />
        </mesh>
      )}

      {/* X-ray internal wireframe */}
      {viewMode === "xray" && (
        <mesh position={pos}>
          <boxGeometry args={size} />
          <meshStandardMaterial color={getColor()} wireframe transparent opacity={0.5} />
        </mesh>
      )}

      {/* Label */}
      {showLabels && (
        <Html position={[pos[0], pos[1] + size[1] / 2 + 0.5, pos[2]]} center distanceFactor={15}>
          <div className={`rounded px-2 py-0.5 text-[9px] font-semibold whitespace-nowrap border transition-all ${
            isSelected ? "bg-primary text-primary-foreground border-primary" :
            isHovered ? "bg-accent text-foreground border-border" :
            "bg-card/70 backdrop-blur-sm text-muted-foreground border-border/50"
          }`}>
            {zone.name.length > 25 ? zone.name.slice(0, 25) + "…" : zone.name}
          </div>
        </Html>
      )}
    </group>
  );
}

// ─── Equipment Marker ────────────────────────────────────

function EquipmentPoint({ marker, scale, viewMode, onClick, isSelected }: {
  marker: EquipmentMarker; scale: number; viewMode: ViewMode; onClick: () => void; isSelected: boolean;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const pos: [number, number, number] = [
    (marker.position.x - 0.5) * scale,
    marker.position.y * scale + 0.3,
    (marker.position.z - 0.5) * scale,
  ];

  const color =
    viewMode === "fire-safety" ? "#ef4444" :
    viewMode === "hazard" ? "#f97316" :
    "#3b82f6";

  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = pos[1] + Math.sin(state.clock.elapsedTime * 2 + marker.position.x * 10) * 0.15;
    }
  });

  return (
    <group>
      <mesh ref={ref} position={pos} onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onClick(); }}
        onPointerOver={() => { document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { document.body.style.cursor = "default"; }}
      >
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color={isSelected ? "#ffffff" : color} emissive={color} emissiveIntensity={isSelected ? 1.5 : 0.8} />
      </mesh>
      {/* Pulse ring */}
      <mesh position={pos} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.45, 32]} />
        <meshStandardMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ─── Road markings ───────────────────────────────────────

function RoadMarkings() {
  return (
    <group>
      {/* Roads on 3 sides */}
      {[
        { pos: [0, 0.01, -10] as [number, number, number], size: [30, 0.02, 2] as [number, number, number] },
        { pos: [0, 0.01, 10] as [number, number, number], size: [30, 0.02, 2] as [number, number, number] },
        { pos: [-12, 0.01, 0] as [number, number, number], size: [2, 0.02, 20] as [number, number, number] },
      ].map((road, i) => (
        <mesh key={i} position={road.pos}>
          <boxGeometry args={road.size} />
          <meshStandardMaterial color="#374151" />
        </mesh>
      ))}
    </group>
  );
}

// ─── Detail Panel ────────────────────────────────────────

function DetailPanel({ item, onClose }: { item: SelectedItem; onClose: () => void }) {
  if (!item) return null;

  if (item.type === "zone") {
    const zone = item.data;
    return (
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-card/95 backdrop-blur-xl border-t border-border p-4 max-h-[40vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-[10px] font-bold text-primary tracking-wider uppercase">{zone.type.replace("-", " ")}</p>
            <h3 className="text-base font-bold text-foreground">{zone.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{zone.description}</p>
            {zone.dimensions && <p className="text-[11px] text-muted-foreground/80 mt-0.5">{zone.dimensions}</p>}
          </div>
          <button onClick={onClose} className="p-1 hover:bg-accent rounded-lg"><X className="h-4 w-4" /></button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
          {/* Details */}
          <div className="rounded-xl border border-border bg-accent/30 p-3">
            <h4 className="text-[10px] font-bold text-muted-foreground tracking-wider mb-2 flex items-center gap-1"><Info className="h-3 w-3" /> DETAILS</h4>
            <div className="space-y-1">
              {Object.entries(zone.details).map(([k, v]) => (
                <div key={k} className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="text-foreground font-medium text-right max-w-[60%]">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hazards */}
          <div className="rounded-xl border border-border bg-accent/30 p-3">
            <h4 className="text-[10px] font-bold text-muted-foreground tracking-wider mb-2 flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-risk-high" /> HAZARDS</h4>
            {zone.hazards.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">No significant hazards identified</p>
            ) : (
              <div className="space-y-1">
                {zone.hazards.map((h, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[11px]">
                    <span className="text-risk-high mt-0.5">⚠</span>
                    <span className="text-foreground">{h}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-2 flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground">Risk Level:</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                zone.riskLevel === "high" ? "bg-risk-high/15 text-risk-high" :
                zone.riskLevel === "medium" ? "bg-risk-medium/15 text-risk-medium" :
                "bg-risk-low/15 text-risk-low"
              }`}>{zone.riskLevel.toUpperCase()}</span>
            </div>
          </div>

          {/* Protection */}
          <div className="rounded-xl border border-border bg-accent/30 p-3">
            <h4 className="text-[10px] font-bold text-muted-foreground tracking-wider mb-2 flex items-center gap-1"><Shield className="h-3 w-3 text-risk-low" /> PROTECTION</h4>
            {zone.protectionSystems.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">No dedicated systems</p>
            ) : (
              <div className="space-y-1">
                {zone.protectionSystems.map((s, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[11px]">
                    <CheckCircle2 className="h-3 w-3 text-risk-low shrink-0 mt-0.5" />
                    <span className="text-foreground">{s}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Equipment detail
  const eq = item.data;
  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 bg-card/95 backdrop-blur-xl border-t border-border p-4 shadow-2xl animate-in slide-in-from-bottom-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold text-primary tracking-wider uppercase">{eq.type.replace("-", " ")}</p>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <span className="text-base">{eq.icon}</span> {eq.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">{eq.details}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
              eq.status === "operational" ? "bg-risk-low/15 text-risk-low" :
              eq.status === "maintenance" ? "bg-risk-medium/15 text-risk-medium" :
              "bg-risk-high/15 text-risk-high"
            }`}>
              {eq.status === "operational" ? "✅" : "⚠️"} {eq.status}
            </span>
            <span className="text-[10px] text-muted-foreground">Zone: {eq.zone}</span>
          </div>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-accent rounded-lg"><X className="h-4 w-4" /></button>
      </div>
    </div>
  );
}
