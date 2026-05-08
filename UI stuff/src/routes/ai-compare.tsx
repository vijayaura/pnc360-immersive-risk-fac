import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Brain, Play, Loader2, Clock, Hash, ChevronDown, ChevronUp, Trophy, Zap, BarChart3 } from "lucide-react";
import { runBenchmark } from "@/server/ai-benchmark.functions";
import { compareModels } from "@/server/ai-compare.functions";
import { mockProperties } from "@/data/mock-properties";

export const Route = createFileRoute("/ai-compare")({
  component: AIComparePage,
});

const MODELS = [
  { value: "google/gemini-3-flash-preview", label: "Gemini 3 Flash", short: "Gemini" },
  { value: "openai/gpt-5-mini", label: "GPT-5 Mini", short: "GPT-5 Mini" },
];

const TARGET_PROPERTIES = mockProperties.filter(
  (p) => p.name === "Al Fattan Currency House" || p.name === "Viva Enterprise Distribution Centre"
);

interface BenchmarkResult {
  feature: string;
  property: string;
  model: string;
  content: string;
  latencyMs: number;
  tokens: number;
  success: boolean;
  error?: string;
}

interface FeatureSpec {
  id: string;
  label: string;
  buildPrompt: (p: (typeof TARGET_PROPERTIES)[0]) => {
    prompt: string;
    systemPrompt?: string;
  };
}

const FEATURES: FeatureSpec[] = [
  {
    id: "insights",
    label: "Risk Insights",
    buildPrompt: (p) => ({
      prompt: `Analyze the risk profile of ${p.name} (${p.type}) in ${p.city}. Built ${p.yearBuilt}, ${p.constructionMaterial}, ${p.floors} floors, AED ${(p.sumInsured / 1_000_000).toFixed(0)}M SI. Flood zone: ${p.floodZone}, near coast: ${p.nearCoast}. Sprinklers: ${p.fireProtection.sprinklers}, electrical: ${p.electricalCondition}. Generate 5 key risk insights with severity (high/medium/low) and category.`,
      systemPrompt: "You are an expert P&C insurance risk analyst for the UAE market. Provide structured risk insights.",
    }),
  },
  {
    id: "pricing",
    label: "Pricing Rationale",
    buildPrompt: (p) => ({
      prompt: `For ${p.name} (${p.type}, AED ${(p.sumInsured / 1_000_000).toFixed(0)}M SI) in ${p.city}: explain the rationale for premium loadings considering construction (${p.constructionMaterial}, ${p.yearBuilt}), flood zone (${p.floodZone}), coastal proximity (${p.nearCoast}), fire protection, and electrical condition (${p.electricalCondition}). Suggest 3 specific loadings with percentages.`,
      systemPrompt: "You are an expert insurance pricing analyst for UAE commercial property. Reference 2024 Dubai floods and UAE market conditions.",
    }),
  },
  {
    id: "natcat",
    label: "NatCat Interpretation",
    buildPrompt: (p) => ({
      prompt: `Interpret NatCat model results for ${p.name} (${p.type}) in ${p.city}, AED ${(p.sumInsured / 1_000_000).toFixed(0)}M SI, ${p.constructionMaterial}, built ${p.yearBuilt}. Estimated AAL: 0.25% of SI, PML-100yr: 5% of SI, PML-250yr: 10% of SI. Flood contributes 40% of AAL, earthquake 30%, cyclone 20%, sandstorm 10%. Provide narrative interpretation and 3 risk mitigation recommendations.`,
      systemPrompt: "You are a catastrophe modeling expert interpreting NatCat results for UAE property underwriters.",
    }),
  },
  {
    id: "documents",
    label: "Document Analysis",
    buildPrompt: (p) => ({
      prompt: `Review submission documents for ${p.name} (${p.type}, AED ${(p.sumInsured / 1_000_000).toFixed(0)}M SI) in ${p.city}. Broker: ${p.broker}. Documents: ${p.documents.map((d) => `${d.name} (${d.type})`).join(", ")}. Assess completeness, identify missing documents, flag compliance concerns for UAE insurance market.`,
      systemPrompt: "You are a senior insurance underwriting analyst reviewing submission completeness for the UAE market.",
    }),
  },
];

type ResultMap = Record<string, BenchmarkResult>;

function resultKey(feature: string, property: string, model: string) {
  return `${feature}|${property}|${model}`;
}

function AIComparePage() {
  const [results, setResults] = useState<ResultMap>({});
  const [running, setRunning] = useState(false);
  const [expandedCells, setExpandedCells] = useState<Set<string>>(new Set());
  const [customPrompt, setCustomPrompt] = useState("");
  const [customSystem, setCustomSystem] = useState("");
  const [customResult, setCustomResult] = useState<{ modelA: any; modelB: any } | null>(null);
  const [customLoading, setCustomLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"benchmark" | "custom">("benchmark");

  const totalTests = FEATURES.length * TARGET_PROPERTIES.length * MODELS.length;
  const completedTests = Object.keys(results).length;

  const runFullBenchmark = async () => {
    setRunning(true);
    setResults({});

    const tasks: Array<{
      feature: string;
      property: string;
      model: string;
      prompt: string;
      systemPrompt?: string;
    }> = [];

    for (const feature of FEATURES) {
      for (const prop of TARGET_PROPERTIES) {
        const { prompt, systemPrompt } = feature.buildPrompt(prop);
        for (const model of MODELS) {
          tasks.push({
            feature: feature.id,
            property: prop.name,
            model: model.value,
            prompt,
            systemPrompt,
          });
        }
      }
    }

    // Run in batches of 2 to avoid rate limits
    for (let i = 0; i < tasks.length; i += 2) {
      const batch = tasks.slice(i, i + 2);
      const batchResults = await Promise.all(
        batch.map((t) =>
          runBenchmark({
            data: {
              feature: t.feature,
              model: t.model,
              propertyName: t.property,
              prompt: t.prompt,
              systemPrompt: t.systemPrompt,
            },
          }).catch((e): BenchmarkResult => ({
            feature: t.feature,
            property: t.property,
            model: t.model,
            content: "",
            latencyMs: 0,
            tokens: 0,
            success: false,
            error: e instanceof Error ? e.message : "Unknown",
          }))
        )
      );

      setResults((prev) => {
        const next = { ...prev };
        for (const r of batchResults) {
          next[resultKey(r.feature, r.property, r.model)] = r;
        }
        return next;
      });
    }

    setRunning(false);
  };

  const runCustom = async () => {
    if (!customPrompt.trim()) return;
    setCustomLoading(true);
    setCustomResult(null);
    try {
      const res = await compareModels({
        data: {
          prompt: customPrompt,
          systemPrompt: customSystem || undefined,
          modelA: MODELS[0].value,
          modelB: MODELS[1].value,
        },
      });
      setCustomResult(res);
    } catch {
      /* ignore */
    } finally {
      setCustomLoading(false);
    }
  };

  const toggleExpand = (key: string) => {
    setExpandedCells((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Compute verdicts
  const getFeatureVerdict = (featureId: string) => {
    let geminiScore = 0;
    let gptScore = 0;

    for (const prop of TARGET_PROPERTIES) {
      const gemini = results[resultKey(featureId, prop.name, MODELS[0].value)];
      const gpt = results[resultKey(featureId, prop.name, MODELS[1].value)];
      if (!gemini || !gpt) continue;

      // Latency — lower wins
      if (gemini.latencyMs < gpt.latencyMs) geminiScore++;
      else if (gpt.latencyMs < gemini.latencyMs) gptScore++;

      // Content length — longer usually means more thorough
      if (gemini.content.length > gpt.content.length * 1.1) geminiScore++;
      else if (gpt.content.length > gemini.content.length * 1.1) gptScore++;

      // Success
      if (gemini.success && !gpt.success) geminiScore += 2;
      else if (gpt.success && !gemini.success) gptScore += 2;
    }

    if (geminiScore > gptScore) return { winner: "Gemini", reason: `Gemini leads ${geminiScore}-${gptScore}` };
    if (gptScore > geminiScore) return { winner: "GPT-5 Mini", reason: `GPT-5 Mini leads ${gptScore}-${geminiScore}` };
    return { winner: "Tie", reason: "Both models performed equally" };
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
          <Brain className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">AI Model Comparison</h1>
          <p className="text-sm text-muted-foreground">
            Benchmark Gemini vs GPT-5 Mini across all underwriting features using Al Fattan & Viva cases
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
        <button
          onClick={() => setActiveTab("benchmark")}
          className={`rounded-md px-4 py-2 text-xs font-medium transition-all ${activeTab === "benchmark" ? "bg-background text-foreground shadow" : "text-muted-foreground"}`}
        >
          <BarChart3 className="h-3.5 w-3.5 inline mr-1.5" />
          Full Benchmark
        </button>
        <button
          onClick={() => setActiveTab("custom")}
          className={`rounded-md px-4 py-2 text-xs font-medium transition-all ${activeTab === "custom" ? "bg-background text-foreground shadow" : "text-muted-foreground"}`}
        >
          <Zap className="h-3.5 w-3.5 inline mr-1.5" />
          Custom Prompt
        </button>
      </div>

      {activeTab === "benchmark" && (
        <>
          {/* Run button */}
          <div className="flex items-center gap-4">
            <button
              onClick={runFullBenchmark}
              disabled={running}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {running ? `Running... (${completedTests}/${totalTests})` : "Run Full Benchmark"}
            </button>
            <p className="text-xs text-muted-foreground">
              {FEATURES.length} features × {TARGET_PROPERTIES.length} properties × {MODELS.length} models = {totalTests} tests
            </p>
          </div>

          {/* Progress */}
          {running && (
            <div className="h-2 bg-accent/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${(completedTests / totalTests) * 100}%` }}
              />
            </div>
          )}

          {/* Results Matrix */}
          {completedTests > 0 && (
            <div className="space-y-6">
              {FEATURES.map((feature) => {
                const verdict = getFeatureVerdict(feature.id);
                return (
                  <div key={feature.id} className="rounded-xl border border-border bg-card overflow-hidden">
                    {/* Feature header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-accent/10 border-b border-border">
                      <h3 className="text-sm font-semibold text-foreground">{feature.label}</h3>
                      {completedTests >= FEATURES.length * TARGET_PROPERTIES.length * MODELS.length && (
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          verdict.winner === "Gemini" ? "bg-blue-500/20 text-blue-400" :
                          verdict.winner === "GPT-5 Mini" ? "bg-green-500/20 text-green-400" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          <Trophy className="h-3 w-3 inline mr-1" />
                          {verdict.winner} — {verdict.reason}
                        </span>
                      )}
                    </div>

                    {/* Property rows */}
                    {TARGET_PROPERTIES.map((prop) => (
                      <div key={prop.id} className="border-b border-border last:border-0">
                        <div className="px-4 py-2 bg-accent/5">
                          <p className="text-xs font-medium text-muted-foreground">{prop.name}</p>
                        </div>
                        <div className="grid grid-cols-2 divide-x divide-border">
                          {MODELS.map((model) => {
                            const key = resultKey(feature.id, prop.name, model.value);
                            const r = results[key];
                            const cellKey = `${feature.id}-${prop.id}-${model.value}`;
                            const isExpanded = expandedCells.has(cellKey);

                            return (
                              <div key={model.value} className="p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-foreground">{model.short}</span>
                                  {r && (
                                    <div className="flex items-center gap-3">
                                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                        <Clock className="h-3 w-3" /> {r.latencyMs}ms
                                      </span>
                                      {r.tokens > 0 && (
                                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                          <Hash className="h-3 w-3" /> {r.tokens}
                                        </span>
                                      )}
                                      <span className="text-[10px] text-muted-foreground">
                                        {r.content.length} chars
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {!r && (
                                  <div className="flex items-center gap-2 py-2">
                                    {running ? (
                                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    ) : (
                                      <span className="text-xs text-muted-foreground">Pending</span>
                                    )}
                                  </div>
                                )}

                                {r && !r.success && (
                                  <p className="text-xs text-risk-high">Error: {r.error}</p>
                                )}

                                {r && r.success && (
                                  <>
                                    <div className={`text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap ${isExpanded ? "" : "line-clamp-4"}`}>
                                      {r.content.slice(0, isExpanded ? undefined : 500)}
                                    </div>
                                    {r.content.length > 200 && (
                                      <button
                                        onClick={() => toggleExpand(cellKey)}
                                        className="flex items-center gap-1 text-[10px] text-primary hover:underline"
                                      >
                                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                        {isExpanded ? "Collapse" : "Expand"}
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}

              {/* Final Recommendation */}
              {completedTests >= totalTests && (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 space-y-4">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    Recommendation Summary
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {FEATURES.map((feature) => {
                      const verdict = getFeatureVerdict(feature.id);
                      return (
                        <div key={feature.id} className="rounded-lg border border-border bg-card p-3">
                          <p className="text-xs font-semibold text-foreground">{feature.label}</p>
                          <p className={`text-sm font-bold mt-1 ${
                            verdict.winner === "Gemini" ? "text-blue-400" :
                            verdict.winner === "GPT-5 Mini" ? "text-green-400" :
                            "text-muted-foreground"
                          }`}>
                            {verdict.winner}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{verdict.reason}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Overall */}
                  {(() => {
                    const geminiWins = FEATURES.filter((f) => getFeatureVerdict(f.id).winner === "Gemini").length;
                    const gptWins = FEATURES.filter((f) => getFeatureVerdict(f.id).winner === "GPT-5 Mini").length;
                    const overall = geminiWins > gptWins ? "Gemini 3 Flash" : gptWins > geminiWins ? "GPT-5 Mini" : "Tie";
                    return (
                      <div className="rounded-lg bg-accent/30 p-4 text-center">
                        <p className="text-xs text-muted-foreground">Overall Winner</p>
                        <p className="text-xl font-bold text-foreground mt-1">{overall}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Gemini: {geminiWins} wins | GPT-5 Mini: {gptWins} wins | Ties: {FEATURES.length - geminiWins - gptWins}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-2">
                          Note: Production will use GPT-4.1 via Azure Foundry UAE. GPT-5 Mini is used here as the closest available comparison model.
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === "custom" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Custom Prompt Comparison</h3>
            <input
              value={customSystem}
              onChange={(e) => setCustomSystem(e.target.value)}
              placeholder="System prompt (optional)..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex gap-2">
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Enter your test prompt..."
                rows={3}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
              <button
                onClick={runCustom}
                disabled={!customPrompt.trim() || customLoading}
                className="self-end rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {customLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Compare"}
              </button>
            </div>
          </div>

          {customLoading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-foreground font-medium">Running both models...</p>
            </div>
          )}

          {customResult && !customLoading && (
            <div className="grid grid-cols-2 gap-4">
              {[customResult.modelA, customResult.modelB].map((r: any, i: number) => (
                <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-accent/10">
                    <div>
                      <p className="text-xs font-semibold text-foreground">{MODELS[i]?.short || r.model}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{r.model}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" /> {r.latencyMs}ms
                      </span>
                      {r.tokens > 0 && (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Hash className="h-3 w-3" /> {r.tokens}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-4 max-h-[500px] overflow-auto">
                    <div className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">{r.content}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground text-center">
        Image generation (scenario simulation) only available on Gemini. Production target: GPT-4.1 via Azure Foundry UAE.
      </p>
    </div>
  );
}
