import type { Property } from "@/data/mock-properties";
import { getLossHistory, type Claim } from "@/data/mock-claims";
import { History, TrendingUp, AlertTriangle, DollarSign, Calendar, Flame, Droplets, Wind, Zap, Shield, Lock } from "lucide-react";

interface LossHistoryProps {
  property: Property;
}

const perilIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  fire: Flame,
  flood: Droplets,
  windstorm: Wind,
  earthquake: AlertTriangle,
  theft: Lock,
  liability: Shield,
  water_damage: Droplets,
  electrical: Zap,
};

const perilColors: Record<string, string> = {
  fire: "text-risk-high bg-risk-high/10",
  flood: "text-blue-400 bg-blue-400/10",
  windstorm: "text-purple-400 bg-purple-400/10",
  earthquake: "text-risk-medium bg-risk-medium/10",
  theft: "text-muted-foreground bg-muted/50",
  liability: "text-primary bg-primary/10",
  water_damage: "text-blue-300 bg-blue-300/10",
  electrical: "text-yellow-400 bg-yellow-400/10",
};

export function LossHistoryPanel({ property }: LossHistoryProps) {
  const history = getLossHistory(property.id, property.sumInsured, property.claims);

  return (
    <div className="p-4 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
          <History className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Loss History — 5 Year</h2>
          <p className="text-xs text-muted-foreground">{history.claims.length} claims recorded • Burning cost: {history.burningCost.toFixed(2)}‰</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard icon={DollarSign} label="5-Year Incurred" value={`AED ${formatAmt(history.fiveYearIncurred)}`} color="text-foreground" />
        <SummaryCard icon={TrendingUp} label="Burning Cost" value={`${history.burningCost.toFixed(2)}‰`} color={history.burningCost > 1 ? "text-risk-high" : history.burningCost > 0.5 ? "text-risk-medium" : "text-risk-low"} />
        <SummaryCard icon={AlertTriangle} label="Largest Loss" value={`AED ${formatAmt(history.largestLoss)}`} color="text-risk-high" />
        <SummaryCard icon={Calendar} label="Frequency" value={`${history.frequencyPerYear.toFixed(1)}/yr`} color={history.frequencyPerYear > 1 ? "text-risk-medium" : "text-risk-low"} />
      </div>

      {/* Burning Cost Analysis */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h3 className="text-sm font-medium text-foreground">Burning Cost Analysis</h3>
        <div className="flex items-end gap-1 h-32">
          {[...Array(5)].map((_, i) => {
            const year = new Date().getFullYear() - 4 + i;
            const yearClaims = history.claims.filter(c => new Date(c.date).getFullYear() === year);
            const yearIncurred = yearClaims.reduce((s, c) => s + c.grossPaid, 0);
            const yearBurning = property.sumInsured > 0 ? (yearIncurred / property.sumInsured) * 1000 : 0;
            const maxHeight = 100;
            const barHeight = Math.max(4, Math.min(maxHeight, (yearBurning / Math.max(history.burningCost * 2, 1)) * maxHeight));
            return (
              <div key={year} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] text-muted-foreground">{yearBurning.toFixed(2)}‰</span>
                <div
                  className={`w-full rounded-t-md ${yearBurning > 1 ? "bg-risk-high/60" : yearBurning > 0.5 ? "bg-risk-medium/60" : "bg-risk-low/60"}`}
                  style={{ height: `${barHeight}px` }}
                />
                <span className="text-[10px] text-muted-foreground">{year}</span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground border-t border-border pt-2">
          <span>5-yr avg: {history.burningCost.toFixed(2)}‰</span>
          <span>Base rate: {(property.type === "industrial" ? 1.2 : property.type === "retail" ? 0.45 : 0.35).toFixed(2)}‰</span>
          <span className={history.burningCost > 0.5 ? "text-risk-high font-medium" : "text-risk-low font-medium"}>
            {history.burningCost > 0.5 ? "⚠️ Above market rate" : "✅ Below market rate"}
          </span>
        </div>
      </div>

      {/* Claims Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-3 border-b border-border">
          <h3 className="text-sm font-medium text-foreground">Claims Register</h3>
        </div>
        {history.claims.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No claims in the last 5 years — clean loss record ✅</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-accent/30">
                  <th className="text-left p-2 font-medium text-muted-foreground">Date</th>
                  <th className="text-left p-2 font-medium text-muted-foreground">Peril</th>
                  <th className="text-left p-2 font-medium text-muted-foreground">Description</th>
                  <th className="text-right p-2 font-medium text-muted-foreground">Gross Paid</th>
                  <th className="text-right p-2 font-medium text-muted-foreground">Net Paid</th>
                  <th className="text-right p-2 font-medium text-muted-foreground">Reserves</th>
                  <th className="text-center p-2 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.claims.map((claim) => {
                  const Icon = perilIcons[claim.peril] || AlertTriangle;
                  return (
                    <tr key={claim.id} className="border-b border-border/50 hover:bg-accent/20 transition-colors">
                      <td className="p-2 text-foreground whitespace-nowrap">{claim.date}</td>
                      <td className="p-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${perilColors[claim.peril] || ""}`}>
                          <Icon className="h-3 w-3" />
                          {claim.peril.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-2 text-muted-foreground max-w-[200px] truncate">{claim.description}</td>
                      <td className="p-2 text-right text-foreground font-mono">AED {formatAmt(claim.grossPaid)}</td>
                      <td className="p-2 text-right text-foreground font-mono">AED {formatAmt(claim.netPaid)}</td>
                      <td className="p-2 text-right font-mono">
                        {claim.reserves > 0 ? <span className="text-risk-medium">AED {formatAmt(claim.reserves)}</span> : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="p-2 text-center">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          claim.status === "closed" ? "bg-risk-low/10 text-risk-low" :
                          claim.status === "open" ? "bg-risk-high/10 text-risk-high" :
                          "bg-risk-medium/10 text-risk-medium"
                        }`}>
                          {claim.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* UW Recommendation */}
      <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
        <p className="text-xs font-medium text-primary mb-1">📋 Loss History Assessment</p>
        <p className="text-xs text-muted-foreground">
          {history.burningCost > 1
            ? `⛔ Burning cost of ${history.burningCost.toFixed(2)}‰ significantly exceeds base rate. Consider experience-rated premium, increased deductible, or loss-sensitive programme. ${history.claims.filter(c => c.status === "open").length} open claims with outstanding reserves of AED ${formatAmt(history.claims.filter(c => c.status === "open").reduce((s, c) => s + c.reserves, 0))}.`
            : history.burningCost > 0.3
            ? `⚠️ Moderate loss experience at ${history.burningCost.toFixed(2)}‰. Frequency of ${history.frequencyPerYear.toFixed(1)} claims/year warrants monitoring. Consider risk improvement warranties.`
            : history.claims.length === 0
            ? `✅ Clean loss record — no claims in 5 years. Supports preferential terms and may justify premium discount.`
            : `✅ Favourable loss experience at ${history.burningCost.toFixed(2)}‰. Low frequency and severity support current pricing.`}
        </p>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 text-center">
      <Icon className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={`text-sm font-bold ${color}`}>{value}</p>
    </div>
  );
}

function formatAmt(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toFixed(0);
}
