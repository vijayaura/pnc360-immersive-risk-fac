import { useState } from "react";
import type { Property } from "@/data/mock-properties";
import { generateDamageImage } from "@/server/simulation-image.functions";
import { Flame, Droplets, Clock, Play, RotateCcw, TrendingDown, DollarSign, Building2, Users, ShieldAlert, Truck, Mountain, Wind, Image, Loader2, Eye } from "lucide-react";

type ScenarioType = "fire" | "flood" | "interruption" | "earthquake" | "cyclone";

interface ScenarioSimulationProps {
  property: Property;
  onNavigateTo3D?: (damageOverlay: DamageOverlay) => void;
}

export interface DamageOverlay {
  scenario: ScenarioType;
  severity: number;
  params: { windSpeed: number; floodLevel: number; recoveryWeeks: number };
}

interface FinancialImpact {
  propertyDamage: number;
  businessInterruption: number;
  liabilityExposure: number;
  debrisRemoval: number;
  contingentBI: number;
  extraExpense: number;
  totalGross: number;
  deductible: number;
  netClaim: number;
  reinsuranceRecovery: number;
  netRetention: number;
  lossRatio: number;
}

export function ScenarioSimulation({ property, onNavigateTo3D }: ScenarioSimulationProps) {
  const [scenario, setScenario] = useState<ScenarioType>("fire");
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [params, setParams] = useState({ windSpeed: 15, floodLevel: 2, recoveryWeeks: 12 });
  const [damageImageUrl, setDamageImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const runSimulation = async () => {
    setRunning(true);
    setCompleted(false);
    setDamageImageUrl(null);
    setImageError(null);

    // Run simulation calculation
    setTimeout(() => {
      setRunning(false);
      setCompleted(true);
    }, 2500);

    // Generate AI damage image in parallel
    setImageLoading(true);
    try {
      const severity = scenario === "fire" ? params.windSpeed / 50 :
                       scenario === "flood" ? params.floodLevel / 10 :
                       scenario === "earthquake" ? 0.6 :
                       scenario === "cyclone" ? 0.7 : 0.5;
      const result = await generateDamageImage({
        data: {
          propertyName: property.name,
          propertyType: property.type,
          floors: property.floors,
          scenario,
          severity,
          params,
        },
      });
      if (result.imageUrl) {
        setDamageImageUrl(result.imageUrl);
      } else if (result.error) {
        setImageError(result.error);
      }
    } catch (e) {
      setImageError(e instanceof Error ? e.message : "Failed to generate image");
    } finally {
      setImageLoading(false);
    }
  };

  const reset = () => {
    setCompleted(false);
    setRunning(false);
    setDamageImageUrl(null);
    setImageError(null);
  };

  const scenarios: { id: ScenarioType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "fire", label: "Fire Spread", icon: Flame },
    { id: "flood", label: "Flood Impact", icon: Droplets },
    { id: "earthquake", label: "Earthquake", icon: Mountain },
    { id: "cyclone", label: "Cyclone", icon: Wind },
    { id: "interruption", label: "Business Interruption", icon: Clock },
  ];

  const financialImpact = completed ? calculateFinancialImpact(property, scenario, params) : null;

  return (
    <div className="p-4 space-y-6 max-w-5xl mx-auto">
      <h2 className="text-lg font-semibold text-foreground">Scenario Simulation Engine</h2>

      {/* Scenario selector */}
      <div className="flex gap-3 flex-wrap">
        {scenarios.map((s) => (
          <button
            key={s.id}
            onClick={() => { setScenario(s.id); reset(); }}
            className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
              scenario === s.id ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:bg-accent"
            }`}
          >
            <s.icon className="h-4 w-4" />
            {s.label}
          </button>
        ))}
      </div>

      {/* Parameters */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <h3 className="text-sm font-medium text-foreground">Simulation Parameters — {property.name}</h3>
        {scenario === "fire" && (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Wind Speed (km/h)</label>
              <input type="range" min={0} max={50} value={params.windSpeed} onChange={(e) => setParams({ ...params, windSpeed: Number(e.target.value) })} className="w-full mt-1" />
              <span className="text-sm text-foreground font-mono">{params.windSpeed} km/h</span>
            </div>
            <div className="text-xs text-muted-foreground bg-accent/50 rounded-lg p-2">
              {property.type === "industrial"
                ? `⚠️ Industrial occupancy (${property.occupancy}) — accelerated spread model with hazmat multiplier`
                : property.floors > 20
                  ? `🏢 High-rise (${property.floors} floors) — vertical spread model with stack effect`
                  : `🏬 Standard ${property.type} fire model applied`}
            </div>
          </div>
        )}
        {scenario === "flood" && (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Water Level (meters)</label>
              <input type="range" min={0} max={10} step={0.5} value={params.floodLevel} onChange={(e) => setParams({ ...params, floodLevel: Number(e.target.value) })} className="w-full mt-1" />
              <span className="text-sm text-foreground font-mono">{params.floodLevel}m</span>
            </div>
            <div className="text-xs text-muted-foreground bg-accent/50 rounded-lg p-2">
              {property.floodZone
                ? `🌊 Property is in a designated flood zone — 2024 Dubai floods reference: up to 1.5m water recorded in Downtown area`
                : property.nearCoast
                  ? `🌊 Coastal proximity — storm surge model applied. Salt water damage increases remediation costs 40%`
                  : `✅ Not in flood zone — flash flood scenario from extreme rainfall event`}
            </div>
          </div>
        )}
        {scenario === "earthquake" && (
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground bg-accent/50 rounded-lg p-2">
              🏔️ UAE seismic context: Zagros fault system (Iran) is ~200km from UAE coastline. The 2013 M5.1 Qeshm earthquake was felt in Dubai.
              {property.floors > 20
                ? ` High-rise (${property.floors} floors) — resonance amplification model applied for long-period ground motion.`
                : ` Standard seismic vulnerability model for ${property.constructionMaterial} construction.`}
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg border border-border p-2">
                <p className="text-muted-foreground">Design PGA</p>
                <p className="font-medium text-foreground">0.15g (UAE Code)</p>
              </div>
              <div className="rounded-lg border border-border p-2">
                <p className="text-muted-foreground">Scenario PGA</p>
                <p className="font-medium text-risk-medium">0.25g (475-yr return)</p>
              </div>
            </div>
          </div>
        )}
        {scenario === "cyclone" && (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Wind Speed (km/h)</label>
              <input type="range" min={80} max={250} step={10} value={params.windSpeed} onChange={(e) => setParams({ ...params, windSpeed: Number(e.target.value) })} className="w-full mt-1" />
              <span className="text-sm text-foreground font-mono">{params.windSpeed} km/h — {params.windSpeed < 120 ? "Cat 1" : params.windSpeed < 160 ? "Cat 2" : params.windSpeed < 200 ? "Cat 3" : "Cat 4"}</span>
            </div>
            <div className="text-xs text-muted-foreground bg-accent/50 rounded-lg p-2">
              🌀 Gulf cyclone exposure: Cyclone Shaheen (2021) and Cyclone Gonu (2007) demonstrated UAE vulnerability.
              {property.nearCoast ? " ⚠️ Coastal location — combined wind + storm surge model applied." : " Inland location — wind damage model only."}
            </div>
          </div>
        )}
        {scenario === "interruption" && (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Recovery Timeline (weeks)</label>
              <input type="range" min={1} max={52} value={params.recoveryWeeks} onChange={(e) => setParams({ ...params, recoveryWeeks: Number(e.target.value) })} className="w-full mt-1" />
              <span className="text-sm text-foreground font-mono">{params.recoveryWeeks} weeks</span>
            </div>
            <div className="text-xs text-muted-foreground bg-accent/50 rounded-lg p-2">
              {property.type === "industrial"
                ? `🏭 Industrial BI: Revenue loss at AED ${((property.sumInsured * 0.002) / 7).toFixed(0)}/day based on asset-to-revenue ratio`
                : property.type === "retail"
                  ? `🛍️ Retail BI: Estimated daily revenue AED ${((property.sumInsured * 0.001) / 7).toFixed(0)}/day + tenant loss-of-rent exposure`
                  : `🏢 Office BI: Relocation costs + revenue impact at AED ${((property.sumInsured * 0.0008) / 7).toFixed(0)}/day`}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={runSimulation}
            disabled={running}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <Play className="h-4 w-4" />
            {running ? "Simulating..." : "Run Simulation"}
          </button>
          {completed && (
            <button onClick={reset} className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors">
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {running && (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <div className="animate-pulse space-y-3">
            <div className="h-40 bg-muted rounded-lg" />
            <p className="text-sm text-muted-foreground">Running {scenario} simulation for {property.name}...</p>
            <div className="flex justify-center gap-4 text-xs text-muted-foreground">
              <span>Modelling spread pattern...</span>
              <span>Calculating financial impact...</span>
              <span>Generating AI damage visualization...</span>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {completed && financialImpact && (
        <div className="space-y-4">
          {/* AI Damage Image */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Image className="h-4 w-4 text-primary" />
                AI-Generated Damage Visualization
              </h3>
              {onNavigateTo3D && (
                <button
                  onClick={() => onNavigateTo3D({
                    scenario,
                    severity: scenario === "fire" ? params.windSpeed / 50 : scenario === "flood" ? params.floodLevel / 10 : 0.5,
                    params,
                  })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-[11px] font-semibold transition-all"
                >
                  <Eye className="h-3.5 w-3.5" />
                  View on 3D Model
                </button>
              )}
            </div>
            {imageLoading && (
              <div className="h-64 rounded-lg bg-muted flex items-center justify-center">
                <div className="text-center space-y-2">
                  <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
                  <p className="text-xs text-muted-foreground">Generating AI damage visualization...</p>
                </div>
              </div>
            )}
            {damageImageUrl && (
              <img src={damageImageUrl} alt={`AI-generated ${scenario} damage visualization for ${property.name}`} className="w-full rounded-lg object-cover max-h-80" />
            )}
            {imageError && !imageLoading && (
              <div className="h-48 rounded-lg bg-muted/50 border border-border flex items-center justify-center">
                <div className="text-center space-y-1">
                  <p className="text-xs text-muted-foreground">⚠️ {imageError}</p>
                  <p className="text-[10px] text-muted-foreground">Damage visualization unavailable — financial analysis unaffected</p>
                </div>
              </div>
            )}
            {!damageImageUrl && !imageLoading && !imageError && (
              <div className="h-48 rounded-lg bg-muted/50 border border-border flex items-center justify-center">
                <p className="text-xs text-muted-foreground">Damage image will appear after simulation</p>
              </div>
            )}
          </div>

          {/* Heatmap */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-medium text-foreground mb-3">
              {scenario === "fire" ? "🔥" : scenario === "flood" ? "🌊" : scenario === "earthquake" ? "🏔️" : scenario === "cyclone" ? "🌀" : "⏱️"} Spatial Impact — {property.name}
            </h3>
            <SimulationHeatmap scenario={scenario} property={property} params={params} />
          </div>

          {/* Loss Tiers */}
          <div className="grid grid-cols-3 gap-3">
            <LossCard label="Best Case" amount={calculateLoss(property, scenario, params, "best")} color="text-risk-low" />
            <LossCard label="Expected" amount={calculateLoss(property, scenario, params, "expected")} color="text-risk-medium" />
            <LossCard label="Worst Case" amount={calculateLoss(property, scenario, params, "worst")} color="text-risk-high" />
          </div>

          {/* Financial Impact Breakdown */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Financial Impact Analysis — Expected Scenario</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <ImpactRow icon={Building2} label="Property Damage" amount={financialImpact.propertyDamage} description={scenario === "fire" ? "Structure, contents, stock destruction" : scenario === "flood" ? "Water damage to structure & contents" : scenario === "earthquake" ? "Structural damage, non-structural element failure" : scenario === "cyclone" ? "Wind damage to structure, roof, façade" : "N/A — covered under triggering peril"} />
              <ImpactRow icon={Clock} label="Business Interruption" amount={financialImpact.businessInterruption} description={`Lost revenue during recovery period`} />
              <ImpactRow icon={Users} label="Liability Exposure" amount={financialImpact.liabilityExposure} description={`Third-party claims — ${property.occupancyCapacity.toLocaleString()} persons capacity`} />
              <ImpactRow icon={Truck} label="Debris Removal & Cleanup" amount={financialImpact.debrisRemoval} description={property.type === "industrial" ? "Includes hazmat decontamination" : "Standard demolition & debris clearance"} />
              <ImpactRow icon={TrendingDown} label="Contingent BI" amount={financialImpact.contingentBI} description="Downstream supply chain / tenant impact" />
              <ImpactRow icon={ShieldAlert} label="Extra Expense" amount={financialImpact.extraExpense} description="Temporary premises, expediting costs" />
            </div>

            {/* Totals */}
            <div className="border-t border-border pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-foreground font-medium">Gross Loss</span>
                <span className="text-foreground font-bold">AED {formatAmount(financialImpact.totalGross)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Less: Deductible ({scenario === "earthquake" || scenario === "cyclone" ? "5%" : "2%"} of SI)</span>
                <span className="text-muted-foreground">- AED {formatAmount(financialImpact.deductible)}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-border pt-2">
                <span className="text-foreground font-medium">Net Claim</span>
                <span className="text-risk-high font-bold">AED {formatAmount(financialImpact.netClaim)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Reinsurance Recovery (QS 70% above AED 10M)</span>
                <span className="text-risk-low">- AED {formatAmount(financialImpact.reinsuranceRecovery)}</span>
              </div>
              <div className="flex justify-between text-sm bg-accent/50 rounded-lg p-2">
                <span className="text-foreground font-semibold">Net Retention</span>
                <span className="text-primary font-bold">AED {formatAmount(financialImpact.netRetention)}</span>
              </div>
            </div>

            {/* Loss Ratio */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-border p-3 text-center">
                <p className="text-[10px] text-muted-foreground">Gross Loss Ratio</p>
                <p className={`text-xl font-bold ${financialImpact.lossRatio > 100 ? "text-risk-high" : financialImpact.lossRatio > 60 ? "text-risk-medium" : "text-risk-low"}`}>
                  {financialImpact.lossRatio.toFixed(0)}%
                </p>
              </div>
              <div className="rounded-lg border border-border p-3 text-center">
                <p className="text-[10px] text-muted-foreground">Sum Insured</p>
                <p className="text-sm font-bold text-foreground">AED {formatAmount(property.sumInsured)}</p>
              </div>
              <div className="rounded-lg border border-border p-3 text-center">
                <p className="text-[10px] text-muted-foreground">% of TIV Impacted</p>
                <p className="text-xl font-bold text-risk-medium">
                  {((financialImpact.totalGross / property.sumInsured) * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Recommendation */}
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
              <p className="text-xs font-medium text-primary mb-1">📋 Underwriting Recommendation</p>
              <p className="text-xs text-muted-foreground">
                {financialImpact.lossRatio > 100
                  ? `⛔ Scenario produces a loss ratio of ${financialImpact.lossRatio.toFixed(0)}%. Consider increasing premium, raising deductible, or applying sub-limits for ${scenario} peril. Facultative reinsurance recommended.`
                  : financialImpact.lossRatio > 60
                    ? `⚠️ Elevated loss ratio at ${financialImpact.lossRatio.toFixed(0)}%. Review ${scenario} sub-limits and consider risk improvement warranties.`
                    : `✅ Loss ratio within acceptable range at ${financialImpact.lossRatio.toFixed(0)}%. Standard terms apply. Monitor for accumulation with adjacent risks.`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatAmount(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(2)}B`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return amount.toFixed(0);
}

function calculateFinancialImpact(property: Property, scenario: ScenarioType, params: { windSpeed: number; floodLevel: number; recoveryWeeks: number }): FinancialImpact {
  const si = property.sumInsured;
  const annualRevenue = si * (property.type === "industrial" ? 0.8 : property.type === "retail" ? 0.5 : 0.3);

  let propertyDamage = 0;
  let biWeeks = 0;

  if (scenario === "fire") {
    const severity = params.windSpeed / 25;
    const baseRate = property.type === "industrial" ? 0.25 : property.floors > 20 ? 0.12 : 0.08;
    const protectionFactor = property.fireProtection.sprinklers ? 0.5 : 1.0;
    propertyDamage = si * baseRate * severity * protectionFactor;
    biWeeks = Math.ceil(12 * severity * (property.type === "industrial" ? 1.5 : 1));
  } else if (scenario === "flood") {
    const severity = params.floodLevel / 5;
    const baseRate = property.floodZone ? 0.2 : 0.08;
    const saltFactor = property.nearCoast ? 1.4 : 1.0;
    propertyDamage = si * baseRate * severity * saltFactor;
    biWeeks = Math.ceil(8 * severity);
  } else if (scenario === "earthquake") {
    // PGA-based damage model
    const pga = 0.25; // 475-year return
    const vulnerability = property.constructionMaterial.includes("Steel") ? 0.08 : property.constructionMaterial.includes("Concrete") ? 0.12 : 0.18;
    const heightFactor = property.floors > 50 ? 1.5 : property.floors > 20 ? 1.2 : 1.0;
    propertyDamage = si * vulnerability * heightFactor * (pga / 0.15);
    biWeeks = Math.ceil(16 * heightFactor);
  } else if (scenario === "cyclone") {
    const windSeverity = params.windSpeed / 180;
    const baseRate = property.nearCoast ? 0.15 : 0.08;
    const roofFactor = property.roofCondition === "poor" ? 1.5 : property.roofCondition === "fair" ? 1.2 : 1.0;
    propertyDamage = si * baseRate * windSeverity * roofFactor;
    // Storm surge for coastal
    if (property.nearCoast) propertyDamage *= 1.3;
    biWeeks = Math.ceil(10 * windSeverity);
  } else {
    propertyDamage = 0;
    biWeeks = params.recoveryWeeks;
  }

  const weeklyRevenue = annualRevenue / 52;
  const businessInterruption = weeklyRevenue * biWeeks;
  const liabilityExposure = property.occupancyCapacity * (scenario === "fire" ? 5000 : scenario === "flood" ? 2000 : scenario === "earthquake" ? 8000 : scenario === "cyclone" ? 4000 : 500);
  const debrisRemoval = propertyDamage * (property.type === "industrial" ? 0.15 : 0.08);
  const contingentBI = businessInterruption * 0.2;
  const extraExpense = businessInterruption * 0.1;

  const totalGross = propertyDamage + businessInterruption + liabilityExposure + debrisRemoval + contingentBI + extraExpense;
  const deductiblePct = (scenario === "earthquake" || scenario === "cyclone") ? 0.05 : 0.02;
  const deductible = Math.max(si * deductiblePct, 100000);
  const netClaim = Math.max(0, totalGross - deductible);
  const reinsuranceRecovery = netClaim > 10_000_000 ? (netClaim - 10_000_000) * 0.7 : 0;
  const netRetention = netClaim - reinsuranceRecovery;

  const estimatedPremium = si * 0.003;
  const lossRatio = (totalGross / estimatedPremium) * 100;

  return { propertyDamage, businessInterruption, liabilityExposure, debrisRemoval, contingentBI, extraExpense, totalGross, deductible, netClaim, reinsuranceRecovery, netRetention, lossRatio };
}

function ImpactRow({ icon: Icon, label, amount, description }: { icon: React.ComponentType<{ className?: string }>; label: string; amount: number; description: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border p-3">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium text-foreground">{label}</span>
          <span className="text-xs font-bold text-foreground">AED {formatAmount(amount)}</span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  );
}

function SimulationHeatmap({ scenario, property, params }: { scenario: ScenarioType; property: Property; params: { windSpeed: number; floodLevel: number; recoveryWeeks: number } }) {
  const gridSize = 12;
  const center = Math.floor(gridSize / 2);

  const getCellIntensity = (row: number, col: number) => {
    const dist = Math.sqrt((row - center) ** 2 + (col - center) ** 2);
    if (scenario === "fire") {
      const spreadRadius = 2 + params.windSpeed / 10;
      return Math.max(0, 1 - dist / spreadRadius);
    }
    if (scenario === "flood") {
      return row > gridSize - params.floodLevel * 1.5 ? Math.max(0, 1 - (gridSize - row) / (params.floodLevel * 1.5)) : 0;
    }
    if (scenario === "earthquake") {
      // Concentric rings of decreasing intensity
      const ring = Math.abs(dist - 3);
      return Math.max(0, 1 - ring / 4) * 0.8;
    }
    if (scenario === "cyclone") {
      // Wind-driven directional damage
      const windDir = col / gridSize;
      return Math.max(0, windDir * (1 - dist / 8));
    }
    return dist < 3 ? 1 - dist / 3 : 0;
  };

  const getColor = (intensity: number) => {
    if (scenario === "fire") return `rgba(239, 83, 80, ${intensity * 0.8})`;
    if (scenario === "flood") return `rgba(79, 195, 247, ${intensity * 0.7})`;
    if (scenario === "earthquake") return `rgba(255, 152, 0, ${intensity * 0.7})`;
    if (scenario === "cyclone") return `rgba(156, 39, 176, ${intensity * 0.7})`;
    return `rgba(255, 167, 38, ${intensity * 0.6})`;
  };

  return (
    <div className="flex justify-center">
      <div className="inline-grid gap-0.5" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
        {Array.from({ length: gridSize * gridSize }).map((_, i) => {
          const row = Math.floor(i / gridSize);
          const col = i % gridSize;
          const intensity = getCellIntensity(row, col);
          const isCenter = row === center && col === center;
          return (
            <div
              key={i}
              className="w-6 h-6 rounded-sm"
              style={{
                backgroundColor: isCenter ? "oklch(0.62 0.19 250)" : intensity > 0.05 ? getColor(intensity) : "oklch(0.20 0.02 260)",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function calculateLoss(property: Property, scenario: ScenarioType, params: { windSpeed: number; floodLevel: number; recoveryWeeks: number }, tier: "best" | "expected" | "worst") {
  const base = property.sumInsured;
  const multipliers: Record<ScenarioType, Record<string, number>> = {
    fire: { best: 0.05, expected: 0.15, worst: 0.4 },
    flood: { best: 0.03, expected: 0.12, worst: 0.3 },
    earthquake: { best: 0.04, expected: 0.18, worst: 0.45 },
    cyclone: { best: 0.03, expected: 0.14, worst: 0.35 },
    interruption: { best: 0.02, expected: 0.08, worst: 0.2 },
  };
  const factor = multipliers[scenario][tier];
  const paramMultiplier = scenario === "fire" ? params.windSpeed / 25 :
                          scenario === "flood" ? params.floodLevel / 5 :
                          scenario === "earthquake" ? 1.0 :
                          scenario === "cyclone" ? params.windSpeed / 180 :
                          params.recoveryWeeks / 26;
  return Math.round(base * factor * Math.max(0.5, paramMultiplier));
}

function LossCard({ label, amount, color }: { label: string; amount: number; color: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-center">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>AED {formatAmount(amount)}</p>
    </div>
  );
}
