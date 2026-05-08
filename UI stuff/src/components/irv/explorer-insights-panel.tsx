import type { Property, AIInsight } from "@/data/mock-properties";
import { getLossHistory } from "@/data/mock-claims";
import { AlertTriangle, TrendingDown, Shield, DollarSign, FileCheck, Flame, Droplets, Zap, Building2 } from "lucide-react";

interface ExplorerInsightsPanelProps {
  property: Property;
}

export function ExplorerInsightsPanel({ property }: ExplorerInsightsPanelProps) {
  const lossHistory = getLossHistory(property.id, property.sumInsured);
  const highInsights = property.aiInsights.filter(i => i.severity === "high");
  const medInsights = property.aiInsights.filter(i => i.severity === "medium");

  const riskColor = property.riskScore >= 70 ? "text-risk-high" : property.riskScore >= 40 ? "text-risk-medium" : "text-risk-low";

  return (
    <div className="space-y-3 text-xs">
      {/* Risk Score Summary */}
      <div className="rounded-lg border border-border bg-background/50 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-foreground flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-primary" /> Risk Score
          </span>
          <span className={`text-lg font-bold ${riskColor}`}>{property.riskScore}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="flex items-center gap-1">
            <Flame className="h-3 w-3 text-risk-high" />
            <span className="text-muted-foreground">Fire: {property.fireProtection.sprinklers ? "Protected" : "Unprotected"}</span>
          </div>
          <div className="flex items-center gap-1">
            <Droplets className="h-3 w-3 text-blue-400" />
            <span className="text-muted-foreground">Flood Zone: {property.floodZone ? "Yes" : "No"}</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-risk-medium" />
            <span className="text-muted-foreground">Electrical: {property.electricalCondition}</span>
          </div>
          <div className="flex items-center gap-1">
            <Building2 className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Roof: {property.roofCondition}</span>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="rounded-lg border border-border bg-background/50 p-3">
        <p className="font-bold text-foreground flex items-center gap-1.5 mb-2">
          <AlertTriangle className="h-3.5 w-3.5 text-risk-high" /> Key Risks
          <span className="ml-auto text-[10px] text-risk-high font-normal">{highInsights.length} high</span>
        </p>
        <div className="space-y-1.5">
          {highInsights.slice(0, 3).map(insight => (
            <div key={insight.id} className="text-[10px] text-muted-foreground bg-risk-high/5 rounded px-2 py-1 border-l-2 border-risk-high/40">
              {insight.text.slice(0, 100)}{insight.text.length > 100 ? "..." : ""}
            </div>
          ))}
          {medInsights.slice(0, 2).map(insight => (
            <div key={insight.id} className="text-[10px] text-muted-foreground bg-risk-medium/5 rounded px-2 py-1 border-l-2 border-risk-medium/40">
              {insight.text.slice(0, 100)}{insight.text.length > 100 ? "..." : ""}
            </div>
          ))}
        </div>
      </div>

      {/* Loss History */}
      <div className="rounded-lg border border-border bg-background/50 p-3">
        <p className="font-bold text-foreground flex items-center gap-1.5 mb-2">
          <TrendingDown className="h-3.5 w-3.5 text-risk-medium" /> Loss History
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
          <span className="text-muted-foreground">5yr Incurred</span>
          <span className="text-foreground font-medium text-right">AED {(lossHistory.fiveYearIncurred / 1_000_000).toFixed(1)}M</span>
          <span className="text-muted-foreground">Burning Cost</span>
          <span className="text-foreground font-medium text-right">{lossHistory.burningCost.toFixed(3)}%</span>
          <span className="text-muted-foreground">Claims</span>
          <span className="text-foreground font-medium text-right">{lossHistory.claims.length}</span>
          <span className="text-muted-foreground">Largest Loss</span>
          <span className="text-foreground font-medium text-right">AED {(lossHistory.largestLoss / 1_000_000).toFixed(1)}M</span>
        </div>
      </div>

      {/* Property Details */}
      <div className="rounded-lg border border-border bg-background/50 p-3">
        <p className="font-bold text-foreground flex items-center gap-1.5 mb-2">
          <DollarSign className="h-3.5 w-3.5 text-primary" /> Exposure
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
          <span className="text-muted-foreground">Sum Insured</span>
          <span className="text-foreground font-medium text-right">AED {(property.sumInsured / 1_000_000).toFixed(0)}M</span>
          <span className="text-muted-foreground">Type</span>
          <span className="text-foreground font-medium text-right capitalize">{property.type}</span>
          <span className="text-muted-foreground">Floors</span>
          <span className="text-foreground font-medium text-right">{property.floors}</span>
          <span className="text-muted-foreground">Construction</span>
          <span className="text-foreground font-medium text-right">{property.constructionMaterial}</span>
        </div>
      </div>

      {/* Compliance */}
      <div className="rounded-lg border border-border bg-background/50 p-3">
        <p className="font-bold text-foreground flex items-center gap-1.5 mb-2">
          <FileCheck className="h-3.5 w-3.5 text-status-approved" /> Compliance
        </p>
        <div className="space-y-1 text-[10px]">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Fire Protection</span>
            <span className={property.fireProtection.sprinklers && property.fireProtection.alarms ? "text-status-approved" : "text-risk-high"}>
              {property.fireProtection.sprinklers && property.fireProtection.alarms ? "✅ Compliant" : "⚠️ Gaps"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Electrical</span>
            <span className={property.electricalCondition === "good" ? "text-status-approved" : "text-risk-medium"}>
              {property.electricalCondition === "good" ? "✅ Good" : `⚠️ ${property.electricalCondition}`}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Building Maintenance</span>
            <span className={property.roofCondition === "good" && property.plumbingCondition === "good" ? "text-status-approved" : "text-risk-medium"}>
              {property.roofCondition === "good" && property.plumbingCondition === "good" ? "✅ Good" : "⚠️ Review needed"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
