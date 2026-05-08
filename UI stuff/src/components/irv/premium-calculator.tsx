import { useState, useMemo } from "react";
import type { Property, PremiumLoadingItem, SourceRef, CoveredPeril, DeductibleItem, ExclusionItem, FeeBreakdown } from "@/data/mock-properties";
import { getPremiumConfig } from "@/data/mock-properties";
import {
  Calculator, Plus, ChevronDown, ChevronUp, Clock, MessageSquare, Info,
  Shield, ShieldOff, AlertTriangle, CheckCircle2, XCircle, Flame, Droplets,
  Zap, DollarSign, FileText, Ban, BarChart3, Pencil
} from "lucide-react";
import { PricingChatbot } from "./pricing-chatbot";

interface PremiumCalculatorProps {
  property: Property;
  onNavigateToSource?: (sourceRef: SourceRef) => void;
}

interface AuditEntry {
  id: string;
  timestamp: Date;
  field: string;
  oldValue: number;
  newValue: number;
  reason: string;
  source: "underwriter" | "ai-suggestion";
}

export function PremiumCalculator({ property, onNavigateToSource }: PremiumCalculatorProps) {
  const config = useMemo(() => getPremiumConfig(property), [property]);

  // ─── Editable State ───
  const [baseRate, setBaseRate] = useState(config.baseRatePerMille);
  const [loadings, setLoadings] = useState<PremiumLoadingItem[]>(config.loadings);
  const [commissionRate, setCommissionRate] = useState(config.commissionRate);
  const [coveredPerils, setCoveredPerils] = useState<CoveredPeril[]>(config.coveredPerils);
  const [deductibles, setDeductibles] = useState<DeductibleItem[]>(config.deductibles);
  const [fees, setFees] = useState<FeeBreakdown>({ ...config.fees });
  const [deductiblePercent, setDeductiblePercent] = useState(config.deductiblePercent);

  // ─── UI State ───
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [showAudit, setShowAudit] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [editingReason, setEditingReason] = useState<string | null>(null);
  const [reasonText, setReasonText] = useState("");
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customFactor, setCustomFactor] = useState("");
  const [customLoading, setCustomLoading] = useState(0);
  const [customExplanation, setCustomExplanation] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["loadings"]));

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // ─── Calculations ───
  const includedPerils = coveredPerils.filter(p => p.included);
  const netLoadingPercent = loadings.reduce((sum, l) => sum + l.current, 0);
  const adjustedRate = baseRate * (1 + netLoadingPercent / 100);
  const grossPremium = (property.sumInsured * adjustedRate) / 1000;
  const commission = grossPremium * (commissionRate / 100);
  const netPremium = grossPremium - commission;
  const deductible = property.sumInsured * (deductiblePercent / 100);
  const totalFees = fees.policyFee + fees.surveyFee + fees.adminFee;
  const reinsurancePremium = grossPremium * (fees.reinsuranceCession / 100);
  const brokerageAmount = grossPremium * (fees.brokerageRate / 100);
  const netRetained = grossPremium - brokerageAmount - reinsurancePremium;

  // ─── Audit Helpers ───
  const addAuditEntry = (field: string, oldValue: number, newValue: number, reason: string, source: "underwriter" | "ai-suggestion" = "underwriter") => {
    setAuditLog(prev => [{ id: `audit-${Date.now()}`, timestamp: new Date(), field, oldValue, newValue, reason, source }, ...prev]);
  };

  const handleLoadingChange = (id: string, newValue: number) => {
    const loading = loadings.find(l => l.id === id);
    if (!loading) return;
    setEditingReason(id);
    setReasonText("");
    setLoadings(prev => prev.map(l => l.id === id ? { ...l, current: newValue } : l));
  };

  const confirmReasonAndLog = (id: string) => {
    const loading = loadings.find(l => l.id === id);
    if (!loading || !reasonText.trim()) return;
    addAuditEntry(loading.factor, loading.aiSuggested, loading.current, reasonText);
    setEditingReason(null);
    setReasonText("");
  };

  const handleBaseRateChange = (newRate: number) => {
    addAuditEntry("Base Rate", baseRate, newRate, "Manual base rate adjustment");
    setBaseRate(newRate);
  };

  const togglePeril = (id: string) => {
    setCoveredPerils(prev => prev.map(p => p.id === id ? { ...p, included: !p.included } : p));
  };

  const handleDeductibleChange = (id: string, field: "value" | "minimum" | "type", newVal: number | string) => {
    setDeductibles(prev => prev.map(d => {
      if (d.id !== id) return d;
      const old = d[field];
      const updated = { ...d, [field]: newVal };
      addAuditEntry(`Deductible: ${d.peril} (${field})`, typeof old === "number" ? old : 0, typeof newVal === "number" ? newVal : 0, `${field} changed`);
      return updated;
    }));
  };

  const handleFeeChange = (field: keyof FeeBreakdown, newVal: number) => {
    const oldVal = fees[field];
    setFees(prev => ({ ...prev, [field]: newVal }));
    addAuditEntry(`Fee: ${field}`, oldVal, newVal, "Manual adjustment");
  };

  const addCustomLoading = () => {
    if (!customFactor.trim()) return;
    const newLoading: PremiumLoadingItem = {
      id: `l-custom-${Date.now()}`,
      factor: customFactor,
      aiSuggested: 0,
      current: customLoading,
      explanation: customExplanation || "Custom loading added by underwriter",
      category: "custom",
    };
    setLoadings(prev => [...prev, newLoading]);
    addAuditEntry(customFactor, 0, customLoading, customExplanation || "Custom loading added");
    setCustomFactor("");
    setCustomLoading(0);
    setCustomExplanation("");
    setShowAddCustom(false);
  };

  const handleChatApplyLoading = (factor: string, value: number, explanation: string) => {
    const newLoading: PremiumLoadingItem = {
      id: `l-chat-${Date.now()}`,
      factor,
      aiSuggested: value,
      current: value,
      explanation,
      category: "custom",
    };
    setLoadings(prev => [...prev, newLoading]);
    addAuditEntry(factor, 0, value, `AI suggested: ${explanation}`, "ai-suggestion");
  };

  const formatAED = (n: number) => `AED ${n.toLocaleString("en-AE", { maximumFractionDigits: 0 })}`;

  return (
    <div className="flex h-full">
      {/* Main calculator */}
      <div className={`flex-1 overflow-auto p-4 space-y-4 max-w-4xl mx-auto transition-all ${showChat ? "mr-0" : ""}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
              <Calculator className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Premium Calculator</h2>
              <p className="text-xs text-muted-foreground">AI-prefilled ratings • All values editable for underwriter judgment</p>
            </div>
          </div>
          <button
            onClick={() => setShowChat(!showChat)}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${showChat ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:bg-accent"}`}
          >
            <MessageSquare className="h-4 w-4" />
            AI Pricing Assistant
          </button>
        </div>

        {/* ═══════════════════════════════════════════════ */}
        {/* 1. PREMIUM SUMMARY CARDS                       */}
        {/* ═══════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <SummaryCard label="Sum Insured" value={formatAED(property.sumInsured)} />
          <SummaryCard label="Gross Premium" value={formatAED(grossPremium)} highlight />
          <SummaryCard label="Net Premium" value={formatAED(netPremium)} />
          <SummaryCard label="Net Retained" value={formatAED(netRetained)} />
          <SummaryCard label="Adjusted Rate" value={`${adjustedRate.toFixed(3)}‰`} />
        </div>

        {/* ═══════════════════════════════════════════════ */}
        {/* 2. BASE RATE                                   */}
        {/* ═══════════════════════════════════════════════ */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">Step 1</span>
                <h3 className="text-sm font-semibold text-foreground">Base Rate (per mille)</h3>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{config.baseRateExplanation}</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.01"
                value={baseRate}
                onChange={(e) => handleBaseRateChange(parseFloat(e.target.value) || 0)}
                className="w-24 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-right font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <span className="text-xs text-muted-foreground">‰</span>
            </div>
          </div>
          {baseRate !== config.baseRatePerMille && (
            <p className="text-xs text-risk-medium">
              Modified from AI suggestion: {config.baseRatePerMille}‰
            </p>
          )}
        </div>

        {/* ═══════════════════════════════════════════════ */}
        {/* 3. RISK LOADINGS & DISCOUNTS                   */}
        {/* ═══════════════════════════════════════════════ */}
        <CollapsibleSection
          id="loadings"
          title="Risk Loadings & Discounts"
          icon={<BarChart3 className="h-4 w-4 text-status-pending" />}
          badge={<>Net: <span className={`font-mono font-bold ${netLoadingPercent >= 0 ? "text-risk-high" : "text-risk-low"}`}>{netLoadingPercent > 0 ? "+" : ""}{netLoadingPercent.toFixed(1)}%</span></>}
          step={2}
          expanded={expandedSections.has("loadings")}
          onToggle={() => toggleSection("loadings")}
        >
          <div className="divide-y divide-border">
            {loadings.map((loading) => (
              <div key={loading.id} className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{loading.factor}</p>
                      {loading.category === "custom" && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Custom</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Info className="h-3 w-3 text-muted-foreground shrink-0" />
                      <p className="text-xs text-muted-foreground truncate">{loading.explanation}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {loading.current !== loading.aiSuggested && (
                      <span className="text-[10px] text-muted-foreground line-through">{loading.aiSuggested > 0 ? "+" : ""}{loading.aiSuggested}%</span>
                    )}
                    <input
                      type="number"
                      step="0.5"
                      value={loading.current}
                      onChange={(e) => handleLoadingChange(loading.id, parseFloat(e.target.value) || 0)}
                      className={`w-20 rounded-lg border px-3 py-1.5 text-sm text-right font-mono focus:outline-none focus:ring-1 focus:ring-primary ${
                        loading.current > 0 ? "border-risk-high/30 text-risk-high bg-risk-high/5" : loading.current < 0 ? "border-risk-low/30 text-risk-low bg-risk-low/5" : "border-border text-muted-foreground bg-background"
                      }`}
                    />
                    <span className="text-xs text-muted-foreground w-4">%</span>
                  </div>
                </div>
                {editingReason === loading.id && (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Reason for override (required for audit)..."
                      value={reasonText}
                      onChange={(e) => setReasonText(e.target.value)}
                      className="flex-1 rounded-lg border border-primary/30 bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      autoFocus
                      onKeyDown={(e) => e.key === "Enter" && confirmReasonAndLog(loading.id)}
                    />
                    <button onClick={() => confirmReasonAndLog(loading.id)} disabled={!reasonText.trim()} className="rounded-lg bg-primary px-3 py-1.5 text-xs text-primary-foreground disabled:opacity-50">Log</button>
                    <button onClick={() => setEditingReason(null)} className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent">Skip</button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add custom loading */}
          <div className="px-4 py-2 border-t border-border">
            {!showAddCustom ? (
              <button
                onClick={() => setShowAddCustom(true)}
                className="flex items-center gap-1 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground hover:bg-accent transition-colors w-full justify-center"
              >
                <Plus className="h-3 w-3" /> Add Custom Factor
              </button>
            ) : (
              <div className="space-y-2 py-1">
                <input type="text" placeholder="Factor name (e.g., Inadequate Maintenance)" value={customFactor} onChange={(e) => setCustomFactor(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" autoFocus />
                <div className="flex gap-2">
                  <input type="number" step="0.5" placeholder="Loading %" value={customLoading || ""} onChange={(e) => setCustomLoading(parseFloat(e.target.value) || 0)} className="w-28 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                  <input type="text" placeholder="Explanation..." value={customExplanation} onChange={(e) => setCustomExplanation(e.target.value)} className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div className="flex gap-2">
                  <button onClick={addCustomLoading} disabled={!customFactor.trim()} className="rounded-lg bg-primary px-3 py-1.5 text-xs text-primary-foreground disabled:opacity-50">Add Loading</button>
                  <button onClick={() => setShowAddCustom(false)} className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* ═══════════════════════════════════════════════ */}
        {/* 4. COVERED PERILS & SUBLIMITS                  */}
        {/* ═══════════════════════════════════════════════ */}
        <CollapsibleSection
          id="perils"
          title="Covered Perils & Sublimits"
          icon={<Shield className="h-4 w-4 text-primary" />}
          badge={<>{includedPerils.length}/{coveredPerils.length} included</>}
          step={3}
          expanded={expandedSections.has("perils")}
          onToggle={() => toggleSection("perils")}
        >
          <div className="divide-y divide-border">
            <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              <div className="col-span-1">Inc.</div>
              <div className="col-span-4">Peril</div>
              <div className="col-span-3 text-right">Sublimit</div>
              <div className="col-span-3">Basis</div>
              <div className="col-span-1 text-right">Alloc.</div>
            </div>
            {coveredPerils.map((peril) => (
              <div key={peril.id} className={`grid grid-cols-12 gap-2 px-4 py-2.5 items-center text-xs transition-colors ${!peril.included ? "opacity-50" : ""}`}>
                <div className="col-span-1">
                  <button
                    onClick={() => togglePeril(peril.id)}
                    className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${
                      peril.included ? "bg-primary border-primary text-primary-foreground" : "border-border hover:border-muted-foreground"
                    }`}
                  >
                    {peril.included && <CheckCircle2 className="h-3 w-3" />}
                  </button>
                </div>
                <div className="col-span-4 font-medium text-foreground flex items-center gap-1.5">
                  <PerilIcon peril={peril.name} />
                  {peril.name}
                </div>
                <div className="col-span-3 text-right font-mono text-foreground">
                  {peril.sublimit ? formatAED(peril.sublimit) : "Full SI"}
                </div>
                <div className="col-span-3 text-muted-foreground text-[11px]">{peril.sublimitBasis}</div>
                <div className="col-span-1 text-right font-mono text-muted-foreground">{peril.premiumAllocationPct}%</div>
              </div>
            ))}
          </div>

          {/* Premium Allocation Bar */}
          <div className="px-4 py-3 border-t border-border">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Premium Allocation</p>
            <div className="flex h-3 rounded-full overflow-hidden bg-muted/30">
              {includedPerils.filter(p => p.premiumAllocationPct > 0).map((peril, i) => {
                const colors = [
                  "bg-red-500/80", "bg-orange-500/80", "bg-yellow-500/80", "bg-blue-500/80",
                  "bg-purple-500/80", "bg-green-500/80", "bg-cyan-500/80", "bg-pink-500/80",
                  "bg-indigo-500/80", "bg-amber-500/80", "bg-teal-500/80", "bg-rose-500/80",
                ];
                return (
                  <div
                    key={peril.id}
                    className={`${colors[i % colors.length]} transition-all`}
                    style={{ width: `${peril.premiumAllocationPct}%` }}
                    title={`${peril.name}: ${peril.premiumAllocationPct}%`}
                  />
                );
              })}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
              {includedPerils.filter(p => p.premiumAllocationPct > 0).map((peril, i) => {
                const colors = [
                  "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-blue-500",
                  "bg-purple-500", "bg-green-500", "bg-cyan-500", "bg-pink-500",
                  "bg-indigo-500", "bg-amber-500", "bg-teal-500", "bg-rose-500",
                ];
                return (
                  <div key={peril.id} className="flex items-center gap-1 text-[9px] text-muted-foreground">
                    <div className={`h-1.5 w-1.5 rounded-full ${colors[i % colors.length]}`} />
                    {peril.name.split(" ")[0]} {peril.premiumAllocationPct}%
                  </div>
                );
              })}
            </div>
          </div>
        </CollapsibleSection>

        {/* ═══════════════════════════════════════════════ */}
        {/* 5. DEDUCTIBLE SCHEDULE (NOW EDITABLE)          */}
        {/* ═══════════════════════════════════════════════ */}
        <CollapsibleSection
          id="deductibles"
          title="Deductible Schedule"
          icon={<DollarSign className="h-4 w-4 text-risk-medium" />}
          badge={<><Pencil className="h-2.5 w-2.5 inline mr-1" />{deductibles.length} perils • Editable</>}
          step={4}
          expanded={expandedSections.has("deductibles")}
          onToggle={() => toggleSection("deductibles")}
        >
          <div className="divide-y divide-border">
            <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              <div className="col-span-3">Peril</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2 text-right">Value</div>
              <div className="col-span-2 text-right">Minimum</div>
              <div className="col-span-3">Description</div>
            </div>
            {deductibles.map((d) => (
              <div key={d.id} className="grid grid-cols-12 gap-2 px-4 py-2.5 items-center text-xs">
                <div className="col-span-3 font-medium text-foreground">{d.peril}</div>
                <div className="col-span-2">
                  <select
                    value={d.type}
                    onChange={(e) => handleDeductibleChange(d.id, "type", e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed (AED)</option>
                    <option value="time">Time (days)</option>
                  </select>
                </div>
                <div className="col-span-2 text-right">
                  <input
                    type="number"
                    step={d.type === "percentage" ? "0.1" : "1000"}
                    value={d.value}
                    onChange={(e) => handleDeductibleChange(d.id, "value", parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-border bg-background px-2 py-1 text-xs text-right font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="col-span-2 text-right">
                  <input
                    type="number"
                    step="1000"
                    value={d.minimum ?? ""}
                    placeholder="—"
                    onChange={(e) => handleDeductibleChange(d.id, "minimum", parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-border bg-background px-2 py-1 text-xs text-right font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/40"
                  />
                </div>
                <div className="col-span-3 text-muted-foreground text-[11px]">{d.description}</div>
              </div>
            ))}
          </div>
          {/* Overall Deductible % */}
          <div className="px-4 py-3 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Standard Deductible (% of SI)</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                value={deductiblePercent}
                onChange={(e) => {
                  const nv = parseFloat(e.target.value) || 0;
                  addAuditEntry("Standard Deductible %", deductiblePercent, nv, "Manual adjustment");
                  setDeductiblePercent(nv);
                }}
                className="w-20 rounded-lg border border-border bg-background px-2 py-1 text-xs text-right font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <span className="text-xs text-muted-foreground">% = {formatAED(deductible)}</span>
            </div>
          </div>
        </CollapsibleSection>

        {/* ═══════════════════════════════════════════════ */}
        {/* 6. EXCLUSIONS                                  */}
        {/* ═══════════════════════════════════════════════ */}
        <CollapsibleSection
          id="exclusions"
          title="Exclusions"
          icon={<Ban className="h-4 w-4 text-risk-high" />}
          badge={<>{config.exclusions.filter(e => e.standard).length} standard, {config.exclusions.filter(e => e.negotiable).length} negotiable</>}
          step={5}
          expanded={expandedSections.has("exclusions")}
          onToggle={() => toggleSection("exclusions")}
        >
          <div className="divide-y divide-border">
            {config.exclusions.map((ex) => (
              <div key={ex.id} className="px-4 py-2.5 flex items-start gap-3 text-xs">
                <div className="mt-0.5">
                  {ex.standard ? (
                    <ShieldOff className="h-3.5 w-3.5 text-risk-high/60" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5 text-risk-medium/60" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{ex.name}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">{ex.clause}</span>
                    {ex.negotiable && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Negotiable</span>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-[11px]">{ex.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* ═══════════════════════════════════════════════ */}
        {/* 7. BROKERAGE, CESSIONS & FEES (NOW EDITABLE)  */}
        {/* ═══════════════════════════════════════════════ */}
        <CollapsibleSection
          id="fees"
          title="Brokerage, Cessions & Fees"
          icon={<BarChart3 className="h-4 w-4 text-status-pending" />}
          badge={<><Pencil className="h-2.5 w-2.5 inline mr-1" />Editable</>}
          step={6}
          expanded={expandedSections.has("fees")}
          onToggle={() => toggleSection("fees")}
        >
          <div className="p-4 space-y-3 text-sm">
            <EditableRow label="Brokerage Rate" value={fees.brokerageRate} unit="%" onChange={(v) => handleFeeChange("brokerageRate", v)} computed={formatAED(brokerageAmount)} />
            <EditableRow label="Commission Rate" value={commissionRate} unit="%" onChange={(v) => { addAuditEntry("Commission Rate", commissionRate, v, "Manual adjustment"); setCommissionRate(v); }} computed={formatAED(commission)} />
            <EditableRow label="Reinsurance Cession" value={fees.reinsuranceCession} unit="%" onChange={(v) => handleFeeChange("reinsuranceCession", v)} computed={formatAED(reinsurancePremium)} />
            <div className="border-t border-border pt-3">
              <Row label="Net Retained Premium" value={formatAED(netRetained)} bold highlight />
            </div>
            <div className="border-t border-border pt-3 space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Flat Fees</p>
              <EditableRow label="Policy Issuance Fee" value={fees.policyFee} unit="AED" onChange={(v) => handleFeeChange("policyFee", v)} step={100} />
              <EditableRow label="Risk Survey Fee" value={fees.surveyFee} unit="AED" onChange={(v) => handleFeeChange("surveyFee", v)} step={100} />
              <EditableRow label="Administration Fee" value={fees.adminFee} unit="AED" onChange={(v) => handleFeeChange("adminFee", v)} step={100} />
              <div className="border-t border-border pt-2">
                <Row label="Total Fees" value={formatAED(totalFees)} bold />
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* ═══════════════════════════════════════════════ */}
        {/* 8. PREMIUM BREAKDOWN SUMMARY                   */}
        {/* ═══════════════════════════════════════════════ */}
        <div className="rounded-xl border border-primary/20 bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">Summary</span>
            <h3 className="text-sm font-semibold text-foreground">Premium Breakdown</h3>
          </div>
          <div className="space-y-2 text-sm">
            <Row label="Sum Insured" value={formatAED(property.sumInsured)} />
            <Row label="Base Rate" value={`${baseRate}‰`} />
            <Row label="Net Loadings" value={`${netLoadingPercent > 0 ? "+" : ""}${netLoadingPercent.toFixed(1)}%`} />
            <Row label="Adjusted Rate" value={`${adjustedRate.toFixed(4)}‰`} />
            <div className="border-t border-border pt-2">
              <Row label="Gross Premium" value={formatAED(grossPremium)} bold />
            </div>
            <Row label={`Brokerage (${fees.brokerageRate}%)`} value={`- ${formatAED(brokerageAmount)}`} />
            <Row label={`Commission (${commissionRate}%)`} value={`- ${formatAED(commission)}`} />
            <Row label={`Reinsurance (${fees.reinsuranceCession}%)`} value={`- ${formatAED(reinsurancePremium)}`} />
            <div className="border-t border-border pt-2">
              <Row label="Net Retained" value={formatAED(netRetained)} bold highlight />
            </div>
            <Row label="Fees (Policy + Survey + Admin)" value={formatAED(totalFees)} muted />
            <Row label={`Standard Deductible (${deductiblePercent}%)`} value={formatAED(deductible)} muted />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════ */}
        {/* 9. AUDIT TRAIL                                 */}
        {/* ═══════════════════════════════════════════════ */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <button onClick={() => setShowAudit(!showAudit)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Audit Trail</h3>
              <span className="text-xs text-muted-foreground">({auditLog.length} entries)</span>
            </div>
            {showAudit ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>
          {showAudit && (
            <div className="border-t border-border divide-y divide-border max-h-60 overflow-auto">
              {auditLog.length === 0 ? (
                <p className="px-4 py-6 text-center text-xs text-muted-foreground">No changes recorded yet</p>
              ) : (
                auditLog.map((entry) => (
                  <div key={entry.id} className="px-4 py-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">{entry.field}</span>
                      <span className="text-muted-foreground">{entry.timestamp.toLocaleTimeString()}</span>
                    </div>
                    <p className="text-muted-foreground mt-0.5">{entry.oldValue} → {entry.newValue} {entry.source === "ai-suggestion" && <span className="ml-1 text-primary">(AI)</span>}</p>
                    <p className="text-foreground/70 mt-0.5 italic">"{entry.reason}"</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Chat panel */}
      {showChat && (
        <div className="w-96 border-l border-border shrink-0 h-full">
          <PricingChatbot property={property} onApplyLoading={handleChatApplyLoading} onClose={() => setShowChat(false)} />
        </div>
      )}
    </div>
  );
}

/* ─── Collapsible Section ─── */

function CollapsibleSection({
  id, title, icon, badge, step, expanded, onToggle, children,
}: {
  id: string; title: string; icon: React.ReactNode; badge?: React.ReactNode; step?: number; expanded: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors">
        <div className="flex items-center gap-2">
          {step && <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Step {step}</span>}
          {icon}
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {badge && <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{badge}</span>}
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {expanded && <div className="border-t border-border">{children}</div>}
    </div>
  );
}

/* ─── Helpers ─── */

function PerilIcon({ peril }: { peril: string }) {
  const p = peril.toLowerCase();
  if (p.includes("fire")) return <Flame className="h-3 w-3 text-risk-high/60" />;
  if (p.includes("flood") || p.includes("water")) return <Droplets className="h-3 w-3 text-blue-400/60" />;
  if (p.includes("storm") || p.includes("cyclone")) return <Zap className="h-3 w-3 text-risk-medium/60" />;
  if (p.includes("earthquake")) return <AlertTriangle className="h-3 w-3 text-orange-400/60" />;
  if (p.includes("terrorism")) return <ShieldOff className="h-3 w-3 text-red-400/60" />;
  if (p.includes("business")) return <FileText className="h-3 w-3 text-purple-400/60" />;
  if (p.includes("machinery")) return <Zap className="h-3 w-3 text-yellow-400/60" />;
  if (p.includes("liability")) return <Shield className="h-3 w-3 text-blue-500/60" />;
  return <Shield className="h-3 w-3 text-muted-foreground/40" />;
}

function SummaryCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 text-center ${highlight ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}>
      <p className={`text-lg font-bold font-mono ${highlight ? "text-primary" : "text-foreground"}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function Row({ label, value, bold, highlight, muted }: { label: string; value: string; bold?: boolean; highlight?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`${muted ? "text-muted-foreground" : "text-foreground/80"} ${bold ? "font-semibold" : ""}`}>{label}</span>
      <span className={`font-mono ${bold ? "font-bold" : ""} ${highlight ? "text-primary" : muted ? "text-muted-foreground" : "text-foreground"}`}>{value}</span>
    </div>
  );
}

function EditableRow({ label, value, unit, onChange, computed, step = 0.5 }: { label: string; value: number; unit: string; onChange: (v: number) => void; computed?: string; step?: number }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-foreground/80 text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-20 rounded-lg border border-border bg-background px-2 py-1 text-sm text-right font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <span className="text-xs text-muted-foreground w-8">{unit}</span>
        {computed && <span className="text-xs text-muted-foreground font-mono">= {computed}</span>}
      </div>
    </div>
  );
}
