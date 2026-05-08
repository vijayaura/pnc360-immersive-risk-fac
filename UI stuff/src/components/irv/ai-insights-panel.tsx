import { useState } from "react";
import type { Property, AIInsight, SourceRef } from "@/data/mock-properties";
import { Brain, CheckCircle2, XCircle, AlertTriangle, Info, Flame, Droplets, Building, TreePine, ShieldAlert, Loader2, Sparkles } from "lucide-react";
import { SourceTraceIcon } from "./source-trace-icon";
import { generateAIInsights } from "@/server/insights.functions";
import { ModelSelector, type AIModelId } from "./model-selector";

interface AIInsightsPanelProps {
  property: Property;
  insights: AIInsight[];
  onUpdateInsights: (insights: AIInsight[]) => void;
  onNavigateToSource?: (sourceRef: SourceRef) => void;
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  fire: Flame,
  flood: Droplets,
  structural: Building,
  environmental: TreePine,
  security: ShieldAlert,
};

const severityStyles: Record<string, string> = {
  high: "bg-risk-high/20 text-risk-high border-risk-high/30",
  medium: "bg-risk-medium/20 text-risk-medium border-risk-medium/30",
  low: "bg-risk-low/20 text-risk-low border-risk-low/30",
};

export function AIInsightsPanel({ property, insights, onUpdateInsights, onNavigateToSource }: AIInsightsPanelProps) {
  const [generating, setGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModelId>("google/gemini-3-flash-preview");

  const updateStatus = (id: string, status: AIInsight["status"]) => {
    onUpdateInsights(insights.map((i) => (i.id === id ? { ...i, status } : i)));
  };

  const handleGenerateInsights = async () => {
    setGenerating(true);
    try {
      const result = await generateAIInsights({
        data: {
          propertyName: property.name,
          propertyType: property.type,
          city: property.city,
          constructionMaterial: property.constructionMaterial,
          floors: property.floors,
          yearBuilt: property.yearBuilt,
          sumInsured: property.sumInsured,
          occupancy: property.occupancy,
          floodZone: property.floodZone,
          nearCoast: property.nearCoast,
          nearIndustrial: property.nearIndustrial,
          fireProtection: property.fireProtection,
          electricalCondition: property.electricalCondition,
          plumbingCondition: property.plumbingCondition,
          roofCondition: property.roofCondition,
          riskScore: property.riskScore,
          model: selectedModel,
        },
      });

      if (result.insights.length > 0) {
        onUpdateInsights(result.insights);
      }
    } catch {
      // keep existing insights on error
    } finally {
      setGenerating(false);
    }
  };

  const pendingCount = insights.filter((i) => i.status === "pending").length;
  const highCount = insights.filter((i) => i.severity === "high" && i.status !== "dismissed").length;

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
          <Brain className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-foreground">AURA AI Risk Interpretation</h2>
          <p className="text-xs text-muted-foreground">
            {insights.length} insights generated • {pendingCount} pending review • {highCount} high severity
          </p>
        </div>
        <ModelSelector value={selectedModel} onChange={setSelectedModel} disabled={generating} />
        <button
          onClick={handleGenerateInsights}
          disabled={generating}
          className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {generating ? "Generating..." : "Re-generate with AI"}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <MiniStat label="High Severity" value={insights.filter((i) => i.severity === "high").length} color="text-risk-high" />
        <MiniStat label="Medium" value={insights.filter((i) => i.severity === "medium").length} color="text-risk-medium" />
        <MiniStat label="Low" value={insights.filter((i) => i.severity === "low").length} color="text-risk-low" />
      </div>

      {generating && (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Analyzing property profile with AI...</p>
        </div>
      )}

      <div className="space-y-3">
        {insights.map((insight) => {
          const Icon = categoryIcons[insight.category] || Info;
          return (
            <div
              key={insight.id}
              className={`rounded-xl border p-4 transition-all ${
                insight.status === "dismissed"
                  ? "opacity-40 border-border bg-card"
                  : insight.status === "accepted"
                  ? "border-risk-low/30 bg-risk-low/5"
                  : severityStyles[insight.severity]
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-1">
                    <p className="text-sm text-foreground flex-1">{insight.text}</p>
                    <SourceTraceIcon sourceRef={insight.sourceRef} onNavigateToSource={onNavigateToSource} />
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`text-xs font-medium capitalize ${
                      insight.severity === "high" ? "text-risk-high" : insight.severity === "medium" ? "text-risk-medium" : "text-risk-low"
                    }`}>
                      {insight.severity}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {insight.confidence}% confidence
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {insight.category}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {insight.status === "pending" ? (
                    <>
                      <button
                        onClick={() => updateStatus(insight.id, "accepted")}
                        className="p-1.5 rounded-lg hover:bg-risk-low/20 text-risk-low transition-colors"
                        title="Accept insight"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => updateStatus(insight.id, "dismissed")}
                        className="p-1.5 rounded-lg hover:bg-risk-high/20 text-muted-foreground hover:text-risk-high transition-colors"
                        title="Dismiss insight"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      insight.status === "accepted" ? "bg-risk-low/20 text-risk-low" : "bg-muted text-muted-foreground"
                    }`}>
                      {insight.status}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
