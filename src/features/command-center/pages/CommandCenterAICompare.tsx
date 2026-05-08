import React, { useState } from 'react';
import {
  Brain,
  Play,
  Loader2,
  Clock,
  Hash,
  ChevronDown,
  ChevronUp,
  Trophy,
  Zap,
  BarChart3,
  AlertTriangle,
} from 'lucide-react';
import { mockProperties } from '../data/mock-data';

const MODELS = [
  { value: 'google/gemini-3-flash-preview', label: 'Gemini 3 Flash', short: 'Gemini' },
  { value: 'openai/gpt-5-mini', label: 'GPT-5 Mini', short: 'GPT-5 Mini' },
];

const TARGET_PROPERTIES = mockProperties.filter(
  (p) => p.name === 'Al Fattan Currency House' || p.name === 'Viva Enterprise Distribution Centre',
);

const FEATURES = [
  { id: 'insights', label: 'Risk Insights' },
  { id: 'pricing', label: 'Pricing Rationale' },
  { id: 'natcat', label: 'NatCat Interpretation' },
  { id: 'documents', label: 'Document Analysis' },
];

const MOCK_RESPONSES: Record<string, string> = {
  'insights|Al Fattan Currency House|google/gemini-3-flash-preview': `Risk Insights for Al Fattan Currency House

1. HIGH — DIFC Location Premium: Property situated in Dubai International Financial Centre commands premium rates due to high-value tenant concentration and business interruption exposure. Estimated loading: +12%.

2. MEDIUM — Glass Curtain Wall Vulnerability: Extensive glass façade creates wind load and impact risk. Post-2017 UAE building code compliance confirmed, but replacement costs are significant.

3. MEDIUM — Age Factor (17 years): Built 2009, MEP systems approaching mid-lifecycle. Recommend electrical and plumbing condition survey before renewal.

4. LOW — Fire Protection: Full sprinkler system and DIFC-mandated fire safety protocols in place. Credit applicable.

5. LOW — Flood Risk: Not in designated flood zone. 2024 Dubai floods had minimal impact on DIFC area due to elevated podium design.`,

  'insights|Al Fattan Currency House|openai/gpt-5-mini': `Al Fattan Currency House — Risk Assessment

1. HIGH — Financial District Aggregation: DIFC concentration risk with multiple high-value insureds in proximity. Correlated loss scenario in major event could exceed individual property limits.

2. MEDIUM — Construction Age & Condition: 2009 construction with reinforced concrete and glass. Recommend updated structural survey. Electrical condition rated "good" but approaching 20-year review threshold.

3. MEDIUM — Business Interruption Exposure: Premium financial tenants (banks, law firms) have high daily revenue. BI sublimit of 30% SI may be insufficient for extended outage scenarios.

4. LOW — Security & Access Control: DIFC security protocols are robust. Low crime risk in controlled financial zone.

5. LOW — Environmental: No industrial adjacency, not near coast. Minimal environmental hazard exposure.`,

  'insights|Viva Enterprise Distribution Centre|google/gemini-3-flash-preview': `Risk Insights for Viva Enterprise Distribution Centre

1. MEDIUM — Industrial Adjacency: Located in Jebel Ali Free Zone South adjacent to industrial operations. Explosion and contamination exposure from neighbouring facilities requires assessment.

2. MEDIUM — Sandwich Panel Construction: Steel sandwich panel (LNC/Kirby) roof and walls — fire spread risk if panels contain combustible insulation. Verify panel fire rating certification.

3. LOW — New Build Advantage: Constructed 2024 to current UAE building codes. Modern fire suppression, electrical systems, and structural standards reduce baseline risk.

4. LOW — Supply Chain Criticality: Viva Supermarket / Landmark Group distribution hub — business interruption could affect retail supply chain. BI coverage recommended.

5. LOW — Sprinkler Coverage: Full sprinkler system installed. Significant fire risk reduction credit applicable.`,

  'insights|Viva Enterprise Distribution Centre|openai/gpt-5-mini': `Viva Enterprise Distribution Centre — Risk Profile

1. MEDIUM — Warehouse Occupancy Loading: Distribution centre with supermarket goods — mixed commodity risk including food, electronics, and general merchandise. Commodity-specific sublimits recommended.

2. MEDIUM — Industrial Zone Exposure: JAFZA South industrial neighbours include chemical and manufacturing operations. Contamination and explosion PML scenarios should be modelled.

3. LOW — Modern Construction: 2024 build with steel frame and sandwich panels. Kirby/LNC systems are industry-standard for UAE warehouses. Fire rating of panels should be confirmed.

4. LOW — Fire Protection: Sprinklers, alarms, extinguishers, and nearby hydrant all confirmed. Comprehensive active protection reduces expected loss frequency.

5. LOW — Location Risk: Not in flood zone, not near coast. Jebel Ali area has good emergency services response times.`,
};

function getMockResponse(featureId: string, propName: string, model: string) {
  const key = `${featureId}|${propName}|${model}`;
  const content = MOCK_RESPONSES[key] || `${featureId} analysis for ${propName}\n\nThis is a mock response demonstrating the AI comparison interface. In production, this would call the actual ${model} API with the property data and return structured underwriting insights.\n\nKey factors considered:\n- Property type and construction\n- Location and environmental risks\n- Fire protection systems\n- Sum insured and business interruption exposure\n- Historical loss data`;
  return { content, latencyMs: Math.floor(Math.random() * 1500) + 800, tokens: Math.floor(content.length / 4) };
}

interface BenchmarkResult {
  feature: string;
  property: string;
  model: string;
  content: string;
  latencyMs: number;
  tokens: number;
  success: boolean;
}

type ResultMap = Record<string, BenchmarkResult>;

function resultKey(feature: string, property: string, model: string) {
  return `${feature}|${property}|${model}`;
}

export default function CommandCenterAICompare() {
  const [results, setResults] = useState<ResultMap>({});
  const [running, setRunning] = useState(false);
  const [expandedCells, setExpandedCells] = useState<Set<string>>(new Set());
  const [customPrompt, setCustomPrompt] = useState('');
  const [customSystem, setCustomSystem] = useState('');
  const [customResult, setCustomResult] = useState<{ modelA: BenchmarkResult; modelB: BenchmarkResult } | null>(null);
  const [customLoading, setCustomLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'benchmark' | 'custom'>('benchmark');

  const totalTests = FEATURES.length * TARGET_PROPERTIES.length * MODELS.length;
  const completedTests = Object.keys(results).length;

  const runFullBenchmark = async () => {
    setRunning(true);
    setResults({});
    for (const feature of FEATURES) {
      for (const prop of TARGET_PROPERTIES) {
        for (const model of MODELS) {
          await new Promise((r) => setTimeout(r, 300));
          const mock = getMockResponse(feature.id, prop.name, model.value);
          setResults((prev) => ({
            ...prev,
            [resultKey(feature.id, prop.name, model.value)]: {
              feature: feature.id, property: prop.name, model: model.value, ...mock, success: true,
            },
          }));
        }
      }
    }
    setRunning(false);
  };

  const runCustom = async () => {
    if (!customPrompt.trim()) return;
    setCustomLoading(true);
    setCustomResult(null);
    await new Promise((r) => setTimeout(r, 1500));
    const mockContent = (modelName: string) =>
      `Response from ${modelName}\n\nSystem: ${customSystem || '(none)'}\n\nPrompt: ${customPrompt}\n\nThis is a mock response demonstrating the side-by-side comparison interface. In production, this would send your prompt to both ${modelName} and return the actual responses for comparison.\n\nKey differences you might observe:\n- Response length and detail level\n- Structured vs narrative format\n- Latency and token efficiency\n- Domain-specific terminology usage`;
    setCustomResult({
      modelA: { feature: 'custom', property: 'custom', model: MODELS[0].value, content: mockContent(MODELS[0].label), latencyMs: Math.floor(Math.random() * 1200) + 600, tokens: 180, success: true },
      modelB: { feature: 'custom', property: 'custom', model: MODELS[1].value, content: mockContent(MODELS[1].label), latencyMs: Math.floor(Math.random() * 1800) + 900, tokens: 210, success: true },
    });
    setCustomLoading(false);
  };

  const toggleExpand = (key: string) => {
    setExpandedCells((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const getFeatureVerdict = (featureId: string) => {
    let geminiScore = 0; let gptScore = 0;
    for (const prop of TARGET_PROPERTIES) {
      const gemini = results[resultKey(featureId, prop.name, MODELS[0].value)];
      const gpt = results[resultKey(featureId, prop.name, MODELS[1].value)];
      if (!gemini || !gpt) continue;
      if (gemini.latencyMs < gpt.latencyMs) geminiScore++; else if (gpt.latencyMs < gemini.latencyMs) gptScore++;
      if (gemini.content.length > gpt.content.length * 1.1) geminiScore++; else if (gpt.content.length > gemini.content.length * 1.1) gptScore++;
    }
    if (geminiScore > gptScore) return { winner: 'Gemini', reason: `Gemini leads ${geminiScore}-${gptScore}` };
    if (gptScore > geminiScore) return { winner: 'GPT-5 Mini', reason: `GPT-5 Mini leads ${gptScore}-${geminiScore}` };
    return { winner: 'Tie', reason: 'Both models performed equally' };
  };

  return (
    <div className="min-h-full bg-gray-50 p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <Brain className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">AI Model Comparison</h1>
          <p className="text-sm text-gray-500">Benchmark Gemini vs GPT-5 Mini across all underwriting features using Al Fattan & Viva cases</p>
        </div>
        <div className="hidden md:flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <span className="text-xs text-amber-700 font-medium">Demo mode — mock responses</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1 w-fit">
        <button onClick={() => setActiveTab('benchmark')} className={`rounded-md px-4 py-2 text-xs font-medium transition-all ${activeTab === 'benchmark' ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-700'}`}>
          <BarChart3 className="h-3.5 w-3.5 inline mr-1.5" />Full Benchmark
        </button>
        <button onClick={() => setActiveTab('custom')} className={`rounded-md px-4 py-2 text-xs font-medium transition-all ${activeTab === 'custom' ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-700'}`}>
          <Zap className="h-3.5 w-3.5 inline mr-1.5" />Custom Prompt
        </button>
      </div>

      {activeTab === 'benchmark' && (
        <>
          <div className="flex items-center gap-4">
            <button onClick={runFullBenchmark} disabled={running} className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm">
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {running ? `Running... (${completedTests}/${totalTests})` : 'Run Full Benchmark'}
            </button>
            <p className="text-xs text-gray-500">{FEATURES.length} features × {TARGET_PROPERTIES.length} properties × {MODELS.length} models = {totalTests} tests</p>
          </div>

          {running && (
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${(completedTests / totalTests) * 100}%` }} />
            </div>
          )}

          {completedTests > 0 && (
            <div className="space-y-6">
              {FEATURES.map((feature) => {
                const verdict = getFeatureVerdict(feature.id);
                return (
                  <div key={feature.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-900">{feature.label}</h3>
                      {completedTests >= totalTests && (
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${verdict.winner === 'Gemini' ? 'bg-blue-100 text-blue-700' : verdict.winner === 'GPT-5 Mini' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          <Trophy className="h-3 w-3 inline mr-1" />{verdict.winner} — {verdict.reason}
                        </span>
                      )}
                    </div>
                    {TARGET_PROPERTIES.map((prop) => (
                      <div key={prop.id} className="border-b border-gray-100 last:border-0">
                        <div className="px-4 py-2 bg-gray-50/50">
                          <p className="text-xs font-medium text-gray-500">{prop.name}</p>
                        </div>
                        <div className="grid grid-cols-2 divide-x divide-gray-100">
                          {MODELS.map((model) => {
                            const key = resultKey(feature.id, prop.name, model.value);
                            const r = results[key];
                            const cellKey = `${feature.id}-${prop.id}-${model.value}`;
                            const isExpanded = expandedCells.has(cellKey);
                            return (
                              <div key={model.value} className="p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-gray-800">{model.short}</span>
                                  {r && (
                                    <div className="flex items-center gap-3">
                                      <span className="flex items-center gap-1 text-[10px] text-gray-400"><Clock className="h-3 w-3" /> {r.latencyMs}ms</span>
                                      <span className="flex items-center gap-1 text-[10px] text-gray-400"><Hash className="h-3 w-3" /> {r.tokens}</span>
                                    </div>
                                  )}
                                </div>
                                {!r && (
                                  <div className="flex items-center gap-2 py-2">
                                    {running ? <Loader2 className="h-4 w-4 animate-spin text-gray-400" /> : <span className="text-xs text-gray-400">Pending</span>}
                                  </div>
                                )}
                                {r && r.success && (
                                  <>
                                    <div className={`text-xs text-gray-700 leading-relaxed whitespace-pre-wrap ${isExpanded ? '' : 'line-clamp-4'}`}>
                                      {r.content.slice(0, isExpanded ? undefined : 400)}
                                    </div>
                                    {r.content.length > 200 && (
                                      <button onClick={() => toggleExpand(cellKey)} className="flex items-center gap-1 text-[10px] text-primary hover:underline">
                                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                        {isExpanded ? 'Collapse' : 'Expand'}
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

              {completedTests >= totalTests && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />Recommendation Summary
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {FEATURES.map((feature) => {
                      const verdict = getFeatureVerdict(feature.id);
                      return (
                        <div key={feature.id} className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                          <p className="text-xs font-semibold text-gray-800">{feature.label}</p>
                          <p className={`text-sm font-bold mt-1 ${verdict.winner === 'Gemini' ? 'text-blue-600' : verdict.winner === 'GPT-5 Mini' ? 'text-green-600' : 'text-gray-500'}`}>{verdict.winner}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{verdict.reason}</p>
                        </div>
                      );
                    })}
                  </div>
                  {(() => {
                    const geminiWins = FEATURES.filter((f) => getFeatureVerdict(f.id).winner === 'Gemini').length;
                    const gptWins = FEATURES.filter((f) => getFeatureVerdict(f.id).winner === 'GPT-5 Mini').length;
                    const overall = geminiWins > gptWins ? 'Gemini 3 Flash' : gptWins > geminiWins ? 'GPT-5 Mini' : 'Tie';
                    return (
                      <div className="rounded-lg bg-gray-100 p-4 text-center">
                        <p className="text-xs text-gray-500">Overall Winner</p>
                        <p className="text-xl font-bold text-gray-900 mt-1">{overall}</p>
                        <p className="text-xs text-gray-500 mt-1">Gemini: {geminiWins} wins | GPT-5 Mini: {gptWins} wins | Ties: {FEATURES.length - geminiWins - gptWins}</p>
                        <p className="text-[10px] text-gray-400 mt-2">Note: Production will use GPT-4.1 via Azure Foundry UAE. GPT-5 Mini is used here as the closest available comparison model.</p>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {completedTests === 0 && !running && (
            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
              <Brain className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-sm font-semibold text-gray-700">Ready to benchmark</p>
              <p className="text-xs text-gray-400 mt-1.5">Click "Run Full Benchmark" to compare Gemini vs GPT-5 Mini across {totalTests} test cases</p>
            </div>
          )}
        </>
      )}

      {activeTab === 'custom' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900">Custom Prompt Comparison</h3>
            <input value={customSystem} onChange={(e) => setCustomSystem(e.target.value)} placeholder="System prompt (optional)..." className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-gray-400" />
            <div className="flex gap-2">
              <textarea value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} placeholder="Enter your test prompt..." rows={3} className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-primary resize-none placeholder:text-gray-400" />
              <button onClick={runCustom} disabled={!customPrompt.trim() || customLoading} className="self-end rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm">
                {customLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Compare'}
              </button>
            </div>
          </div>

          {customLoading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-gray-700 font-medium">Running both models...</p>
            </div>
          )}

          {customResult && !customLoading && (
            <div className="grid grid-cols-2 gap-4">
              {[customResult.modelA, customResult.modelB].map((r, i) => (
                <div key={i} className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <div>
                      <p className="text-xs font-semibold text-gray-900">{MODELS[i]?.short || r.model}</p>
                      <p className="text-[10px] text-gray-400 font-mono">{r.model}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-[10px] text-gray-400"><Clock className="h-3 w-3" /> {r.latencyMs}ms</span>
                      <span className="flex items-center gap-1 text-[10px] text-gray-400"><Hash className="h-3 w-3" /> {r.tokens}</span>
                    </div>
                  </div>
                  <div className="p-4 max-h-[500px] overflow-auto">
                    <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{r.content}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="text-[10px] text-gray-400 text-center">Demo mode — responses are mocked. Production target: GPT-4.1 via Azure Foundry UAE.</p>
    </div>
  );
}
