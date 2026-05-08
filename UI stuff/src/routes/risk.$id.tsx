import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight, Building2, MapPin, User, DollarSign, CheckCircle2, Play, Eye, Calendar, Percent } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useCopilotContext } from "@/hooks/use-copilot-context";
import { useSubmissionProperties } from "@/data/submission-property-store";
import { RiskWalkthrough } from "@/components/irv/risk-walkthrough";
import { RiskMap } from "@/components/irv/risk-map";
import { StreetView } from "@/components/irv/street-view";
import { AIInsightsPanel } from "@/components/irv/ai-insights-panel";
import { RiskScorePanel } from "@/components/irv/risk-score-panel";
import { PropertyDigitalTwin } from "@/components/irv/property-digital-twin";
import { ScenarioSimulation } from "@/components/irv/scenario-simulation";
import type { DamageOverlay } from "@/components/irv/scenario-simulation";
import { SubmissionDocuments } from "@/components/irv/submission-documents";
import { FacilityExplorer3D } from "@/components/irv/facility-explorer-3d";
import { Immersive3DWalkthrough } from "@/components/irv/immersive-3d-walkthrough";
import { DecisionWorkflow } from "@/components/irv/decision-workflow";
import { PremiumCalculator } from "@/components/irv/premium-calculator";
import { LossHistoryPanel } from "@/components/irv/loss-history";
import { PolicyTermsPanel } from "@/components/irv/policy-terms";
import { DigitalSurveyReport } from "@/components/irv/digital-survey-report";
import { LiveWeatherPanel } from "@/components/irv/live-weather-panel";
import { NatCatModel } from "@/components/irv/natcat-model";
import { RiskGaugeRing } from "@/components/ui/risk-gauge-ring";
import { StatusBadge as SharedStatusBadge } from "@/components/ui/status-badge";
import type { AIInsight, SourceRef } from "@/data/mock-properties";

export const Route = createFileRoute("/risk/$id")({
  component: RiskWorkspace,
  head: () => ({
    meta: [
      { title: "Immersive Risk View — P&C 360" },
      { name: "description", content: "Immersive underwriting workspace with spatial risk visualization." },
    ],
  }),
  notFoundComponent: () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground">Property not found</h2>
        <Link to="/" className="text-primary text-sm mt-2 inline-block">Back to Dashboard</Link>
      </div>
    </div>
  ),
});

type TabId = "streetview" | "map" | "insights" | "twin" | "explorer3d" | "scoring" | "simulation" | "documents" | "decision" | "pricing" | "losshistory" | "terms" | "survey" | "weather" | "natcat";

interface TabDef {
  id: TabId;
  label: string;
  phase: "assess" | "price" | "decide";
}

const tabs: TabDef[] = [
  { id: "streetview", label: "🔭 Street View", phase: "assess" },
  { id: "map", label: "📍 Risk Map", phase: "assess" },
  { id: "twin", label: "🏢 Digital Twin", phase: "assess" },
  { id: "explorer3d", label: "🔬 3D Explorer", phase: "assess" },
  { id: "weather", label: "🌤️ Live Weather", phase: "assess" },
  { id: "losshistory", label: "📉 Loss History", phase: "assess" },
  { id: "survey", label: "📋 Survey Report", phase: "assess" },
  { id: "insights", label: "🧠 AI Insights", phase: "assess" },
  { id: "scoring", label: "📊 Risk Score", phase: "assess" },
  { id: "natcat", label: "🌍 NatCat Model", phase: "price" },
  { id: "simulation", label: "⚡ Simulation", phase: "price" },
  { id: "pricing", label: "💰 Pricing", phase: "price" },
  { id: "terms", label: "📋 Policy Terms", phase: "price" },
  { id: "documents", label: "📄 Documents", phase: "decide" },
  { id: "decision", label: "✅ Decision", phase: "decide" },
];

const phaseLabels: Record<string, string> = {
  assess: "ASSESS",
  price: "PRICE",
  decide: "DECIDE",
};

const phaseColors: Record<string, string> = {
  assess: "text-primary",
  price: "text-status-pending",
  decide: "text-status-approved",
};

function RiskWorkspace() {
  const { id } = Route.useParams();
  const { properties, loading } = useSubmissionProperties();
  const property = properties.find((p) => p.id === id);
  const [activeTab, setActiveTab] = useState<TabId>("streetview");
  const [insights, setInsights] = useState<AIInsight[]>(property?.aiInsights || []);
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [highlightDocId, setHighlightDocId] = useState<string | null>(null);
  const [visitedTabs, setVisitedTabs] = useState<Set<TabId>>(new Set(["streetview"]));
  const [walkthroughMode, setWalkthroughMode] = useState(false);
  const [immersive3DMode, setImmersive3DMode] = useState(false);
  const [damageOverlay, setDamageOverlay] = useState<DamageOverlay | null>(null);
  const copilotCtx = useCopilotContext();

  // Push property context to copilot
  useEffect(() => {
    if (property) {
      copilotCtx.setProperty(property);
      setInsights(property.aiInsights || []);
    }
    return () => copilotCtx.setProperty(null);
  }, [property]);

  // Push active tab to copilot
  useEffect(() => {
    copilotCtx.setActiveTab(activeTab);
  }, [activeTab]);

  // Listen for copilot tab navigation
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.tab) handleTabChange(detail.tab as TabId);
    };
    window.addEventListener("copilot-navigate-tab", handler);
    return () => window.removeEventListener("copilot-navigate-tab", handler);
  }, []);

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
    setVisitedTabs((prev) => new Set(prev).add(tabId));
  };

  const handleNavigateToSource = (sourceRef: SourceRef) => {
    setHighlightDocId(sourceRef.documentId);
    handleTabChange("documents");
  };

  const handleNavigateTo3D = (overlay: DamageOverlay) => {
    setDamageOverlay(overlay);
    handleTabChange("explorer3d");
  };

  if (loading && !property) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-sm font-semibold text-primary">Loading workspace...</div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground">Property not found</h2>
          <Link to="/" className="text-primary text-sm mt-2 inline-block">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const activePhase = tabs.find((t) => t.id === activeTab)?.phase || "assess";

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Breadcrumb + Property Header */}
      <div className="border-b border-border shrink-0 frosted-header">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 px-5 pt-2.5 text-[11px] text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/submissions" className="hover:text-foreground transition-colors">Submissions</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-semibold">{property.name}</span>
        </div>

        {/* Property Summary — Hero Strip */}
        <div className="flex items-center gap-4 px-5 py-3">
          <Link to="/submissions" className="p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex-1 min-w-0 flex items-center gap-5">
            <div className="min-w-0">
              <h1 className="text-lg font-extrabold text-foreground truncate tracking-tight">{property.name}</h1>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{property.address}, {property.city}</span>
                <span className="flex items-center gap-1"><User className="h-3 w-3" />{property.broker}</span>
              </div>
            </div>
          </div>

          {/* Key Metrics Strip */}
          <div className="hidden lg:flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-2 bg-accent/40 rounded-lg px-3 py-1.5">
              <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
              <div>
                <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">TSI</p>
                <p className="text-xs font-bold text-foreground">AED {(property.sumInsured / 1_000_000).toFixed(1)}M</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-accent/40 rounded-lg px-3 py-1.5">
              <Percent className="h-3.5 w-3.5 text-muted-foreground" />
              <div>
                <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">Share</p>
                <p className="text-xs font-bold text-foreground">{property.shareOffered}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-accent/40 rounded-lg px-3 py-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <div>
                <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">Start</p>
                <p className="text-xs font-bold text-foreground">{property.riskStartDate}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <button
              onClick={() => setImmersive3DMode(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary/15 to-primary/5 text-primary hover:from-primary/25 hover:to-primary/10 text-[11px] font-semibold transition-all border border-primary/20 active:scale-[0.97]"
              title="Immersive 3D guided walkthrough with narration"
            >
              <Eye className="h-3.5 w-3.5" />
              <span className="hidden md:inline">3D Tour</span>
            </button>
            <button
              onClick={() => setWalkthroughMode(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-[11px] font-semibold transition-all shadow-sm shadow-primary/20 active:scale-[0.97]"
              title="Start risk walkthrough"
            >
              <Play className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Walkthrough</span>
            </button>
            <RiskGaugeRing score={property.riskScore} size="md" />
            <SharedStatusBadge status={property.status} size="md" />
          </div>
        </div>

        {/* Phase Progress Bar */}
        <div className="px-5 pb-0.5">
          <div className="flex h-0.5 rounded-full overflow-hidden bg-border/30">
            {(["assess", "price", "decide"] as const).map((phase) => {
              const phaseTabs = tabs.filter((t) => t.phase === phase);
              const visited = phaseTabs.filter((t) => visitedTabs.has(t.id)).length;
              const pct = (visited / phaseTabs.length) * 100;
              const colorClass = phase === "assess" ? "bg-primary" : phase === "price" ? "bg-status-pending" : "bg-status-approved";
              return (
                <div key={phase} className="flex-1 px-px">
                  <div className={`h-full rounded-full ${colorClass} transition-all duration-500`} style={{ width: `${pct}%` }} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-0.5 px-5 py-2 overflow-x-auto">
          {(["assess", "price", "decide"] as const).map((phase, pi) => {
            const phaseTabs = tabs.filter((t) => t.phase === phase);
            const phaseComplete = phaseTabs.every((t) => visitedTabs.has(t.id));
            return (
              <div key={phase} className="flex items-center gap-0.5">
                {pi > 0 && <div className="phase-separator mx-1.5" />}
                <span className={`section-label mr-1 ${
                  activePhase === phase ? phaseColors[phase] : "text-muted-foreground/40"
                }`}>
                  {phaseLabels[phase]}
                  {phaseComplete && <CheckCircle2 className="h-2.5 w-2.5 inline ml-0.5 -mt-0.5" />}
                </span>
                {phaseTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`relative rounded-lg px-2.5 py-1.5 text-[11px] font-medium whitespace-nowrap transition-all ${
                      activeTab === tab.id
                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                        : visitedTabs.has(tab.id)
                        ? "text-foreground/70 hover:bg-accent hover:text-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                    {visitedTabs.has(tab.id) && activeTab !== tab.id && (
                      <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-status-approved ring-1 ring-card" />
                    )}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === "streetview" && <StreetView property={property} />}
        {activeTab === "map" && <RiskMap property={property} />}
        {activeTab === "insights" && <AIInsightsPanel property={property} insights={insights} onUpdateInsights={setInsights} onNavigateToSource={handleNavigateToSource} />}
        {activeTab === "twin" && <PropertyDigitalTwin property={property} />}
        {activeTab === "explorer3d" && <FacilityExplorer3D property={property} damageOverlay={damageOverlay} />}
        {activeTab === "losshistory" && <LossHistoryPanel property={property} />}
        {activeTab === "survey" && <DigitalSurveyReport property={property} />}
        {activeTab === "weather" && <LiveWeatherPanel property={property} />}
        {activeTab === "natcat" && <NatCatModel property={property} />}
        {activeTab === "scoring" && <RiskScorePanel property={property} overrides={overrides} onUpdateOverrides={setOverrides} />}
        {activeTab === "simulation" && <ScenarioSimulation property={property} onNavigateTo3D={handleNavigateTo3D} />}
        {activeTab === "pricing" && <PremiumCalculator property={property} onNavigateToSource={handleNavigateToSource} />}
        {activeTab === "terms" && <PolicyTermsPanel property={property} />}
        {activeTab === "documents" && <SubmissionDocuments property={property} highlightDocId={highlightDocId} />}
        {activeTab === "decision" && <DecisionWorkflow property={property} insights={insights} />}
      </div>

      {/* Walkthrough overlay */}
      {walkthroughMode && (
        <RiskWalkthrough
          property={property}
          onExit={(targetTab) => {
            setWalkthroughMode(false);
            if (targetTab) handleTabChange(targetTab as TabId);
          }}
        />
      )}

      {/* Immersive 3D walkthrough overlay */}
      {immersive3DMode && (
        <Immersive3DWalkthrough
          property={property}
          onExit={() => setImmersive3DMode(false)}
        />
      )}
    </div>
  );
}

// RiskBadge and StatusBadge are now imported from shared components
