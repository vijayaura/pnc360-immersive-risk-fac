import type { Property } from "@/data/mock-properties";
import { calculateRiskScore, mockProperties } from "@/data/mock-properties";
import { TrendingUp, Minus, Plus, BarChart3 } from "lucide-react";

interface RiskScorePanelProps {
  property: Property;
  overrides: Record<string, number>;
  onUpdateOverrides: (overrides: Record<string, number>) => void;
}

export function RiskScorePanel({ property, overrides, onUpdateOverrides }: RiskScorePanelProps) {
  const breakdown = calculateRiskScore(property);

  const factors = [
    { key: "baseScore", label: "Base Score", value: breakdown.baseScore, editable: false },
    { key: "locationRisk", label: "Location Risk", value: breakdown.locationRisk, editable: true },
    { key: "constructionRisk", label: "Construction Risk", value: breakdown.constructionRisk, editable: true },
    { key: "occupancyRisk", label: "Occupancy Risk", value: breakdown.occupancyRisk, editable: true },
    { key: "protectionCredit", label: "Protection Credit", value: breakdown.protectionCredit, editable: true },
    { key: "adjacentRisk", label: "Adjacent Risk", value: breakdown.adjacentRisk, editable: true },
    { key: "roofCondition", label: "Roof Condition", value: breakdown.roofCondition, editable: true },
    { key: "fireStationProximity", label: "Fire Station Proximity", value: breakdown.fireStationProximity, editable: false },
    { key: "floodZoneRisk", label: "Flood Zone Risk", value: breakdown.floodZoneRisk, editable: true },
  ];

  const totalWithOverrides = factors.reduce((sum, f) => sum + (overrides[f.key] ?? f.value), 0);
  const clampedTotal = Math.max(0, Math.min(100, totalWithOverrides));

  const adjustOverride = (key: string, delta: number) => {
    const current = overrides[key] ?? factors.find((f) => f.key === key)!.value;
    onUpdateOverrides({ ...overrides, [key]: current + delta });
  };

  const resetOverrides = () => onUpdateOverrides({});

  const scoreColor = clampedTotal >= 70 ? "text-risk-high" : clampedTotal >= 40 ? "text-risk-medium" : "text-risk-low";
  const scoreBg = clampedTotal >= 70 ? "bg-risk-high" : clampedTotal >= 40 ? "bg-risk-medium" : "bg-risk-low";

  return (
    <div className="p-4 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Dynamic Risk Score</h2>
      </div>

      {/* Score gauge */}
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <div className="relative w-40 h-40 mx-auto mb-4">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            <circle cx="60" cy="60" r="50" fill="none" stroke="oklch(0.22 0.02 260)" strokeWidth="10" />
            <circle
              cx="60" cy="60" r="50" fill="none"
              stroke="currentColor"
              className={scoreColor}
              strokeWidth="10"
              strokeDasharray={`${(clampedTotal / 100) * 314} 314`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl font-bold ${scoreColor}`}>{clampedTotal}</span>
            <span className="text-xs text-muted-foreground">/ 100</span>
          </div>
        </div>
        <p className={`text-sm font-medium ${scoreColor}`}>
          {clampedTotal >= 70 ? "High Risk" : clampedTotal >= 40 ? "Medium Risk" : "Low Risk"}
        </p>
        {Object.keys(overrides).length > 0 && (
          <button onClick={resetOverrides} className="mt-2 text-xs text-primary hover:underline">
            Reset all adjustments
          </button>
        )}
      </div>

      {/* Factor breakdown */}
      <div className="space-y-2">
        {factors.map((factor) => {
          const currentValue = overrides[factor.key] ?? factor.value;
          const isOverridden = factor.key in overrides;
          return (
            <div key={factor.key} className={`flex items-center gap-3 rounded-xl border p-3 ${isOverridden ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{factor.label}</p>
              </div>
              <div className="flex items-center gap-2">
                {factor.editable && (
                  <button onClick={() => adjustOverride(factor.key, -1)} className="p-1 rounded hover:bg-accent text-muted-foreground">
                    <Minus className="h-3 w-3" />
                  </button>
                )}
                <span className={`text-sm font-mono font-bold w-10 text-center ${
                  currentValue > 0 ? "text-risk-high" : currentValue < 0 ? "text-risk-low" : "text-muted-foreground"
                }`}>
                  {currentValue > 0 ? `+${currentValue}` : currentValue}
                </span>
                {factor.editable && (
                  <button onClick={() => adjustOverride(factor.key, 1)} className="p-1 rounded hover:bg-accent text-muted-foreground">
                    <Plus className="h-3 w-3" />
                  </button>
                )}
              </div>
              {/* Bar */}
              <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full ${currentValue > 0 ? "bg-risk-high" : currentValue < 0 ? "bg-risk-low" : "bg-muted-foreground"}`}
                  style={{ width: `${Math.min(100, Math.abs(currentValue) * 5)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Peer Benchmarking */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Peer Benchmarking</h3>
        </div>
        <p className="text-[10px] text-muted-foreground">Compared against {mockProperties.filter(p => p.type === property.type).length} similar {property.type} risks in portfolio</p>
        <PeerBenchmark property={property} currentScore={clampedTotal} />
      </div>
    </div>
  );
}

function PeerBenchmark({ property, currentScore }: { property: Property; currentScore: number }) {
  const peers = mockProperties.filter(p => p.type === property.type);
  const avgScore = peers.length > 0 ? Math.round(peers.reduce((s, p) => s + p.riskScore, 0) / peers.length) : 50;
  const avgSI = peers.length > 0 ? peers.reduce((s, p) => s + p.sumInsured, 0) / peers.length : property.sumInsured;
  const avgRate = property.type === "industrial" ? 1.2 : property.type === "retail" ? 0.45 : property.type === "warehouse" ? 0.65 : 0.35;
  const marketRate = avgRate * 0.95; // slightly below book rate

  const comparisons = [
    {
      label: "Risk Score",
      thisRisk: currentScore,
      portfolio: avgScore,
      format: (v: number) => `${v}/100`,
      better: currentScore < avgScore,
    },
    {
      label: "Sum Insured",
      thisRisk: property.sumInsured,
      portfolio: avgSI,
      format: (v: number) => `AED ${v >= 1e9 ? (v/1e9).toFixed(1) + "B" : (v/1e6).toFixed(0) + "M"}`,
      better: true,
    },
    {
      label: "Base Rate",
      thisRisk: avgRate,
      portfolio: marketRate,
      format: (v: number) => `${v.toFixed(2)}‰`,
      better: avgRate <= marketRate,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {comparisons.map((c) => (
        <div key={c.label} className="rounded-lg border border-border p-3 text-center space-y-1">
          <p className="text-[10px] text-muted-foreground">{c.label}</p>
          <p className="text-sm font-bold text-foreground">{c.format(c.thisRisk)}</p>
          <div className="flex items-center justify-center gap-1 text-[9px]">
            <span className="text-muted-foreground">Portfolio avg:</span>
            <span className={c.better ? "text-risk-low font-medium" : "text-risk-medium font-medium"}>
              {c.format(c.portfolio)}
            </span>
          </div>
          <p className={`text-[9px] font-medium ${c.better ? "text-risk-low" : "text-risk-high"}`}>
            {c.better ? "✅ Favorable" : "⚠️ Above avg"}
          </p>
        </div>
      ))}
    </div>
  );
}
