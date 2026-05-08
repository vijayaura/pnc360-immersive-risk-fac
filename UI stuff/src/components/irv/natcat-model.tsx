import { useState, useMemo } from "react";
import type { Property } from "@/data/mock-properties";
import { runNatCatModel, type PerilType, type NatCatResult, type PerilResult } from "@/data/natcat-models";
import {
  Shield, TrendingUp, AlertTriangle, BarChart3,
  Activity, Loader2, Play, Info, ChevronDown, ChevronUp, Brain, Sparkles,
} from "lucide-react";
import { interpretNatCatResults } from "@/server/natcat.functions";
import { ModelSelector, type AIModelId } from "./model-selector";

interface NatCatModelProps {
  property: Property;
}

interface AIInterpretation {
  interpretation: string;
  recommendations: Array<{ title: string; description: string; impact: string }>;
}

function formatAED(n: number): string {
  if (n >= 1_000_000_000) return `AED ${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `AED ${(n / 1_000).toFixed(0)}K`;
  return `AED ${n}`;
}

function formatPct(n: number): string {
  return `${(n * 100).toFixed(2)}%`;
}

export function NatCatModel({ property }: NatCatModelProps) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<NatCatResult | null>(null);
  const [selectedPerils, setSelectedPerils] = useState<Set<PerilType>>(
    new Set(["flood", "earthquake", "cyclone", "extreme_heat", "sandstorm"])
  );
  const [expandedPeril, setExpandedPeril] = useState<PerilType | null>(null);
  const [aiInterpretation, setAiInterpretation] = useState<AIInterpretation | null>(null);
  const [interpretingAI, setInterpretingAI] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModelId>("google/gemini-3-flash-preview");

  const runModel = () => {
    setRunning(true);
    setAiInterpretation(null);
    setTimeout(() => {
      const res = runNatCatModel(property);
      setResult(res);
      setRunning(false);
    }, 2000);
  };

  const requestAIInterpretation = async () => {
    if (!result) return;
    setInterpretingAI(true);
    try {
      const res = await interpretNatCatResults({
        data: {
          propertyName: property.name,
          propertyType: property.type,
          city: property.city,
          sumInsured: property.sumInsured,
          constructionMaterial: property.constructionMaterial,
          yearBuilt: property.yearBuilt,
          overallRating: result.overallRating,
          totalAAL: result.totalAAL,
          totalPML100: result.totalPML100,
          totalPML250: result.totalPML250,
          perils: result.perils.map(p => ({
            peril: p.peril,
            label: p.label,
            aal: p.aal,
            pml100: p.pml100,
            hazardScore: p.hazardScore,
            vulnerabilityScore: p.vulnerabilityScore,
          })),
          model: selectedModel,
        },
      });
      setAiInterpretation(res);
    } catch {
      // ignore
    } finally {
      setInterpretingAI(false);
    }
  };

  const togglePeril = (p: PerilType) => {
    setSelectedPerils(prev => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p); else next.add(p);
      return next;
    });
  };

  const filteredResult = useMemo(() => {
    if (!result) return null;
    const filtered = result.perils.filter(p => selectedPerils.has(p.peril));
    return {
      ...result,
      perils: filtered,
      totalAAL: filtered.reduce((s, p) => s + p.aal, 0),
      totalPML100: filtered.reduce((s, p) => s + p.pml100, 0),
      totalPML250: filtered.reduce((s, p) => s + p.pml250, 0),
    };
  }, [result, selectedPerils]);

  return (
    <div className="space-y-4 p-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Natural Catastrophe Model
          </h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Probabilistic loss modeling for {property.name} • {property.city}
          </p>
        </div>
        <button
          onClick={runModel}
          disabled={running || selectedPerils.size === 0}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all"
        >
          {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
          {running ? "Running Model..." : result ? "Re-Run Model" : "Run NatCat Model"}
        </button>
      </div>

      {/* Peril Selection */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs font-semibold text-foreground mb-2">Select Perils to Model</p>
        <div className="flex flex-wrap gap-2">
          {(["flood", "earthquake", "cyclone", "extreme_heat", "sandstorm"] as PerilType[]).map(p => {
            const labels: Record<PerilType, { label: string; icon: string }> = {
              flood: { label: "Flood", icon: "🌊" },
              earthquake: { label: "Earthquake", icon: "🏔️" },
              cyclone: { label: "Cyclone", icon: "🌀" },
              extreme_heat: { label: "Extreme Heat", icon: "🔥" },
              sandstorm: { label: "Sandstorm", icon: "🏜️" },
            };
            const active = selectedPerils.has(p);
            return (
              <button
                key={p}
                onClick={() => togglePeril(p)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border transition-all ${
                  active ? "bg-primary/15 border-primary/40 text-primary" : "bg-accent/30 border-border text-muted-foreground hover:border-primary/30"
                }`}
              >
                <span>{labels[p].icon}</span>
                {labels[p].label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Model Configuration Info */}
      <div className="rounded-xl border border-border bg-accent/10 p-3 flex items-start gap-2">
        <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <div className="text-[10px] text-muted-foreground">
          <p><strong>Model basis:</strong> Deterministic hazard functions with UAE-calibrated vulnerability curves.</p>
          <p className="mt-0.5"><strong>Data sources:</strong> USGS seismic catalog, ERA5 wind reanalysis, UAE NCMS rainfall records, building code compliance factors.</p>
          <p className="mt-0.5"><strong>Sum Insured:</strong> {formatAED(property.sumInsured)} • <strong>Construction:</strong> {property.constructionMaterial} • <strong>Year Built:</strong> {property.yearBuilt}</p>
        </div>
      </div>

      {!result && !running && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <BarChart3 className="h-10 w-10 mb-3 opacity-40" />
          <p className="text-sm">Select perils and run the NatCat model</p>
          <p className="text-[10px] mt-1">Analysis will generate loss exceedance curves and PML estimates</p>
        </div>
      )}

      {running && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-foreground font-medium">Running catastrophe model...</p>
          <div className="space-y-1 text-[10px] text-muted-foreground text-center">
            <p>Generating stochastic event sets...</p>
            <p>Computing vulnerability functions...</p>
            <p>Calculating loss distributions...</p>
          </div>
        </div>
      )}

      {filteredResult && !running && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <SummaryCard
              label="Overall Rating"
              value={filteredResult.overallRating}
              color={filteredResult.ratingColor}
              large
            />
            <SummaryCard
              label="Aggregate Annual Loss"
              value={formatAED(filteredResult.totalAAL)}
              sub={`${formatPct(filteredResult.totalAAL / property.sumInsured)} of SI`}
            />
            <SummaryCard
              label="PML — 100yr"
              value={formatAED(filteredResult.totalPML100)}
              sub={`${formatPct(filteredResult.totalPML100 / property.sumInsured)} of SI`}
            />
            <SummaryCard
              label="PML — 250yr"
              value={formatAED(filteredResult.totalPML250)}
              sub={`${formatPct(filteredResult.totalPML250 / property.sumInsured)} of SI`}
            />
          </div>

          {/* Loss Exceedance Curve (text-based chart) */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Loss Exceedance Curve (OEP)
            </h3>
            <div className="space-y-1">
              <div className="grid grid-cols-[80px_1fr_100px_80px] text-[10px] font-semibold text-muted-foreground border-b border-border pb-1 mb-1">
                <span>Return Period</span>
                <span>Gross Loss</span>
                <span>Damage Ratio</span>
                <span>AEP</span>
              </div>
              {[10, 25, 50, 100, 250, 500].map(rp => {
                const totalLoss = filteredResult.perils.reduce((sum, peril) => {
                  const rpData = peril.returnPeriods.find(r => r.returnPeriod === rp);
                  return sum + (rpData?.grossLoss ?? 0);
                }, 0);
                const dr = totalLoss / property.sumInsured;
                const barWidth = Math.min(100, dr * 300);

                return (
                  <div key={rp} className="grid grid-cols-[80px_1fr_100px_80px] items-center text-xs gap-1">
                    <span className="font-semibold text-foreground">{rp}-yr</span>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-4 bg-accent/20 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000"
                          style={{
                            width: `${barWidth}%`,
                            background: dr > 0.3 ? "#dc2626" : dr > 0.15 ? "#ea580c" : dr > 0.05 ? "#d97706" : "#22c55e",
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-foreground font-medium w-24 text-right shrink-0">{formatAED(totalLoss)}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{formatPct(dr)}</span>
                    <span className="text-[10px] text-muted-foreground">{(100 / rp).toFixed(1)}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Peril Contribution */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Peril Contribution to AAL
            </h3>
            <div className="space-y-2">
              {filteredResult.perils
                .sort((a, b) => b.aal - a.aal)
                .map(peril => {
                  const pct = filteredResult.totalAAL > 0 ? (peril.aal / filteredResult.totalAAL) * 100 : 0;
                  return (
                    <div key={peril.peril}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="flex items-center gap-1.5">
                          <span>{peril.icon}</span>
                          <span className="font-medium text-foreground">{peril.label}</span>
                        </span>
                        <span className="text-muted-foreground">{formatAED(peril.aal)} ({pct.toFixed(1)}%)</span>
                      </div>
                      <div className="h-2 bg-accent/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-1000"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Per-Peril Detail Cards */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Detailed Peril Analysis
            </h3>
            {filteredResult.perils.map(peril => (
              <PerilCard
                key={peril.peril}
                peril={peril}
                sumInsured={property.sumInsured}
                expanded={expandedPeril === peril.peril}
                onToggle={() => setExpandedPeril(expandedPeril === peril.peril ? null : peril.peril)}
              />
            ))}
          </div>

          {/* AI Interpretation */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                AI Interpretation
              </h3>
              <div className="flex items-center gap-2">
                <ModelSelector value={selectedModel} onChange={setSelectedModel} disabled={interpretingAI} />
                <button
                onClick={requestAIInterpretation}
                disabled={interpretingAI}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {interpretingAI ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                {interpretingAI ? "Analyzing..." : aiInterpretation ? "Re-analyze" : "Get AI Interpretation"}
              </button>
              </div>
            </div>

            {interpretingAI && (
              <div className="flex items-center justify-center py-6 gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">AI is interpreting NatCat results...</p>
              </div>
            )}

            {aiInterpretation && !interpretingAI && (
              <div className="space-y-3">
                <div className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                  {aiInterpretation.interpretation.split(/(\*\*.*?\*\*)/g).map((part, i) =>
                    part.startsWith("**") && part.endsWith("**")
                      ? <strong key={i}>{part.slice(2, -2)}</strong>
                      : part
                  )}
                </div>
                {aiInterpretation.recommendations.length > 0 && (
                  <div className="space-y-2 mt-3">
                    <p className="text-xs font-semibold text-foreground">Recommendations:</p>
                    {aiInterpretation.recommendations.map((rec, i) => (
                      <div key={i} className={`rounded-lg border p-3 ${
                        rec.impact === "high" ? "border-risk-high/30 bg-risk-high/5" :
                        rec.impact === "medium" ? "border-risk-medium/30 bg-risk-medium/5" :
                        "border-risk-low/30 bg-risk-low/5"
                      }`}>
                        <p className="text-xs font-medium text-foreground">{rec.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{rec.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!aiInterpretation && !interpretingAI && (
              <p className="text-xs text-muted-foreground text-center py-4">
                Click "Get AI Interpretation" for an expert narrative analysis of these results
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value, sub, color, large }: {
  label: string; value: string; sub?: string; color?: string; large?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-[10px] text-muted-foreground font-medium">{label}</p>
      <p className={`${large ? "text-xl" : "text-lg"} font-bold mt-1`} style={color ? { color } : undefined}>
        {value}
      </p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function PerilCard({ peril, sumInsured, expanded, onToggle }: {
  peril: PerilResult; sumInsured: number; expanded: boolean; onToggle: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-accent/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{peril.icon}</span>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">{peril.label}</p>
            <p className="text-[10px] text-muted-foreground">AAL: {formatAED(peril.aal)} • PML₁₀₀: {formatAED(peril.pml100)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <ScoreBadge label="Hazard" score={peril.hazardScore} />
            <ScoreBadge label="Vulnerability" score={peril.vulnerabilityScore} />
          </div>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border p-4 space-y-3 bg-accent/5">
          <p className="text-xs text-muted-foreground">{peril.description}</p>

          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-1 font-medium">Return Period</th>
                  <th className="text-right py-1 font-medium">Gross Loss</th>
                  <th className="text-right py-1 font-medium">Damage Ratio</th>
                  <th className="text-right py-1 font-medium">% of SI</th>
                  <th className="text-right py-1 font-medium">AEP</th>
                </tr>
              </thead>
              <tbody>
                {peril.returnPeriods.map(rp => (
                  <tr key={rp.returnPeriod} className="border-b border-border/50 text-foreground">
                    <td className="py-1.5 font-semibold">{rp.returnPeriod}-year</td>
                    <td className="py-1.5 text-right">{formatAED(rp.grossLoss)}</td>
                    <td className="py-1.5 text-right">{formatPct(rp.damageRatio)}</td>
                    <td className="py-1.5 text-right">{formatPct(rp.grossLoss / sumInsured)}</td>
                    <td className="py-1.5 text-right">{(100 / rp.returnPeriod).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreBadge({ label, score }: { label: string; score: number }) {
  const color = score >= 70 ? "bg-red-500/20 text-red-300" :
    score >= 40 ? "bg-orange-500/20 text-orange-300" :
    "bg-green-500/20 text-green-300";
  return (
    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${color}`}>
      {label}: {score}
    </span>
  );
}
