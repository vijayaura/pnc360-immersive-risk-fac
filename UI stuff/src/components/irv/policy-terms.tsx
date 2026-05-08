import { useState } from "react";
import type { Property } from "@/data/mock-properties";
import { FileText, Shield, AlertTriangle, CheckCircle2, XCircle, ChevronDown, ChevronUp } from "lucide-react";

interface PolicyTermsProps {
  property: Property;
}

interface CoverageSection {
  id: string;
  name: string;
  sublimit: number | null;
  basis: string;
  included: boolean;
}

interface Exclusion {
  id: string;
  name: string;
  standard: boolean;
  description: string;
}

interface Warranty {
  id: string;
  name: string;
  description: string;
  status: "compliant" | "pending" | "non-compliant";
  deadline?: string;
}

function getDefaultTerms(property: Property) {
  const si = property.sumInsured;

  const coverages: CoverageSection[] = [
    { id: "c-pd", name: "Property Damage — All Risks", sublimit: null, basis: "Reinstatement Value", included: true },
    { id: "c-bi", name: "Business Interruption", sublimit: Math.round(si * 0.3), basis: "Gross Profit — 12 months indemnity", included: true },
    { id: "c-ml", name: "Machinery Breakdown", sublimit: Math.round(si * 0.1), basis: "Repair/Replacement", included: property.type === "industrial" },
    { id: "c-pd-eq", name: "Earthquake & Allied Perils", sublimit: Math.round(si * 0.5), basis: "Per Occurrence", included: true },
    { id: "c-flood", name: "Flood & Inundation", sublimit: Math.round(si * 0.25), basis: "Per Occurrence", included: property.floodZone },
    { id: "c-storm", name: "Storm, Tempest & Cyclone", sublimit: Math.round(si * 0.3), basis: "Per Occurrence", included: true },
    { id: "c-tpl", name: "Third Party Liability", sublimit: 10_000_000, basis: "Any One Occurrence", included: true },
    { id: "c-debris", name: "Debris Removal", sublimit: Math.round(si * 0.05), basis: "Included", included: true },
    { id: "c-rent", name: "Loss of Rent", sublimit: Math.round(si * 0.05), basis: "12 months", included: property.type !== "industrial" },
    { id: "c-terror", name: "Terrorism", sublimit: Math.round(si * 0.1), basis: "Per Occurrence", included: si > 100_000_000 },
  ];

  const exclusions: Exclusion[] = [
    { id: "e-war", name: "War & Civil Commotion", standard: true, description: "Loss or damage arising from war, invasion, or civil war" },
    { id: "e-nuclear", name: "Nuclear & Radioactive", standard: true, description: "Nuclear reaction, radiation, or radioactive contamination" },
    { id: "e-cyber", name: "Cyber Attack", standard: true, description: "Loss arising from malicious cyber activity — LMA5408" },
    { id: "e-wear", name: "Wear & Tear", standard: true, description: "Gradual deterioration, inherent vice, or latent defect" },
    { id: "e-pollution", name: "Gradual Pollution", standard: true, description: "Pollution unless caused by a sudden and accidental insured event" },
    { id: "e-confiscation", name: "Government Confiscation", standard: true, description: "Seizure, confiscation, or requisition by any authority" },
    { id: "e-asbestos", name: "Asbestos", standard: property.yearBuilt < 2000, description: "Loss arising from asbestos in any form" },
    { id: "e-communicable", name: "Communicable Disease", standard: true, description: "Loss arising from or relating to communicable disease — LMA5394" },
  ];

  const warranties: Warranty[] = [
    { id: "w-sprinkler", name: "Sprinkler Maintenance", description: "Automatic sprinkler system to be maintained and tested quarterly per NFPA 25", status: property.fireProtection.sprinklers ? "compliant" : "non-compliant" },
    { id: "w-alarm", name: "Fire Alarm Monitoring", description: "Fire alarm system connected to 24/7 monitoring station", status: property.fireProtection.alarms ? "compliant" : "pending", deadline: property.fireProtection.alarms ? undefined : "2026-09-30" },
    { id: "w-hotwork", name: "Hot Work Permit", description: "All hot work operations require written permit with fire watch for 60 minutes post-completion", status: property.type === "industrial" ? "pending" : "compliant" },
    { id: "w-security", name: "24/7 Security", description: "Premises to have round-the-clock security with CCTV and access control", status: "compliant" },
    { id: "w-electrical", name: "Electrical Inspection", description: "Annual electrical installation inspection by certified engineer — certificate to be provided", status: property.electricalCondition === "good" ? "compliant" : property.electricalCondition === "fair" ? "pending" : "non-compliant", deadline: property.electricalCondition !== "good" ? "2026-12-31" : undefined },
    { id: "w-housekeeping", name: "Housekeeping", description: "Premises to be maintained free of combustible waste accumulation", status: "compliant" },
  ];

  return { coverages, exclusions, warranties };
}

export function PolicyTermsPanel({ property }: PolicyTermsProps) {
  const terms = getDefaultTerms(property);
  const [coverages, setCoverages] = useState(terms.coverages);
  const [expandedSection, setExpandedSection] = useState<string | null>("coverages");

  const toggle = (id: string) => setExpandedSection(expandedSection === id ? null : id);

  const nonCompliant = terms.warranties.filter(w => w.status === "non-compliant").length;
  const pending = terms.warranties.filter(w => w.status === "pending").length;

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Policy Terms & Conditions</h2>
          <p className="text-xs text-muted-foreground">
            {coverages.filter(c => c.included).length} coverages active • {nonCompliant} warranty breaches • {pending} pending
          </p>
        </div>
      </div>

      {/* Coverage Sections */}
      <CollapsibleSection
        title="Coverage Sections"
        subtitle={`${coverages.filter(c => c.included).length} of ${coverages.length} included`}
        icon={Shield}
        expanded={expandedSection === "coverages"}
        onToggle={() => toggle("coverages")}
      >
        <div className="space-y-2">
          {coverages.map((cov) => (
            <div key={cov.id} className={`flex items-center gap-3 rounded-lg border p-3 transition-all ${cov.included ? "border-border bg-card" : "border-border/50 bg-card/50 opacity-60"}`}>
              <button
                onClick={() => setCoverages(prev => prev.map(c => c.id === cov.id ? { ...c, included: !c.included } : c))}
                className={`shrink-0 ${cov.included ? "text-risk-low" : "text-muted-foreground"}`}
              >
                {cov.included ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground">{cov.name}</p>
                <p className="text-[10px] text-muted-foreground">{cov.basis}</p>
              </div>
              <div className="text-right shrink-0">
                {cov.sublimit ? (
                  <p className="text-xs font-bold text-foreground">AED {formatAmt(cov.sublimit)}</p>
                ) : (
                  <p className="text-[10px] text-muted-foreground">Full SI</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Exclusions */}
      <CollapsibleSection
        title="Exclusions"
        subtitle={`${terms.exclusions.length} standard exclusions`}
        icon={XCircle}
        expanded={expandedSection === "exclusions"}
        onToggle={() => toggle("exclusions")}
      >
        <div className="space-y-2">
          {terms.exclusions.map((exc) => (
            <div key={exc.id} className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
              <XCircle className="h-4 w-4 text-risk-high shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-foreground">{exc.name}</p>
                <p className="text-[10px] text-muted-foreground">{exc.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Warranties */}
      <CollapsibleSection
        title="Warranties & Conditions Precedent"
        subtitle={`${nonCompliant} non-compliant, ${pending} pending`}
        icon={AlertTriangle}
        expanded={expandedSection === "warranties"}
        onToggle={() => toggle("warranties")}
      >
        <div className="space-y-2">
          {terms.warranties.map((w) => (
            <div key={w.id} className={`flex items-start gap-3 rounded-lg border p-3 ${
              w.status === "non-compliant" ? "border-risk-high/30 bg-risk-high/5" :
              w.status === "pending" ? "border-risk-medium/30 bg-risk-medium/5" :
              "border-border bg-card"
            }`}>
              {w.status === "compliant" ? <CheckCircle2 className="h-4 w-4 text-risk-low shrink-0 mt-0.5" /> :
               w.status === "pending" ? <AlertTriangle className="h-4 w-4 text-risk-medium shrink-0 mt-0.5" /> :
               <XCircle className="h-4 w-4 text-risk-high shrink-0 mt-0.5" />}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-foreground">{w.name}</p>
                  <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full capitalize ${
                    w.status === "compliant" ? "bg-risk-low/10 text-risk-low" :
                    w.status === "pending" ? "bg-risk-medium/10 text-risk-medium" :
                    "bg-risk-high/10 text-risk-high"
                  }`}>{w.status.replace("-", " ")}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{w.description}</p>
                {w.deadline && <p className="text-[10px] text-risk-medium mt-1">⏰ Compliance deadline: {w.deadline}</p>}
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Deductible Schedule */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h3 className="text-sm font-medium text-foreground">Deductible Schedule</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between rounded-lg bg-accent/30 p-2">
            <span className="text-muted-foreground">Property Damage</span>
            <span className="font-medium text-foreground">AED {formatAmt(property.sumInsured * 0.02)} or 2% of claim</span>
          </div>
          <div className="flex justify-between rounded-lg bg-accent/30 p-2">
            <span className="text-muted-foreground">Business Interruption</span>
            <span className="font-medium text-foreground">30 days</span>
          </div>
          <div className="flex justify-between rounded-lg bg-accent/30 p-2">
            <span className="text-muted-foreground">Nat-Cat Perils</span>
            <span className="font-medium text-foreground">AED {formatAmt(property.sumInsured * 0.05)} or 5%</span>
          </div>
          <div className="flex justify-between rounded-lg bg-accent/30 p-2">
            <span className="text-muted-foreground">Third Party Liability</span>
            <span className="font-medium text-foreground">AED 50,000</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CollapsibleSection({ title, subtitle, icon: Icon, expanded, onToggle, children }: {
  title: string; subtitle: string; icon: React.ComponentType<{ className?: string }>; expanded: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button onClick={onToggle} className="flex items-center gap-3 w-full p-4 text-left hover:bg-accent/30 transition-colors">
        <Icon className="h-4 w-4 text-primary shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-[10px] text-muted-foreground">{subtitle}</p>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {expanded && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function formatAmt(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toFixed(0);
}
