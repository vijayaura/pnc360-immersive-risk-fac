import { useState } from "react";
import type { Property, AIInsight } from "@/data/mock-properties";
import { calculateRiskScore } from "@/data/mock-properties";
import { CheckCircle2, AlertTriangle, XCircle, FileDown } from "lucide-react";

interface DecisionWorkflowProps {
  property: Property;
  insights: AIInsight[];
}

type Decision = "approve" | "refer" | "reject" | null;

export function DecisionWorkflow({ property, insights }: DecisionWorkflowProps) {
  const [decision, setDecision] = useState<Decision>(null);
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const breakdown = calculateRiskScore(property);
  const acceptedInsights = insights.filter((i) => i.status === "accepted");
  const highSeverity = insights.filter((i) => i.severity === "high" && i.status !== "dismissed");

  const handleSubmit = () => {
    if (decision && notes.trim()) {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="p-4 max-w-3xl mx-auto">
        <div className="rounded-2xl border border-border bg-card p-8 text-center space-y-4">
          <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
            decision === "approve" ? "bg-risk-low/20" : decision === "refer" ? "bg-primary/20" : "bg-risk-high/20"
          }`}>
            {decision === "approve" && <CheckCircle2 className="h-8 w-8 text-risk-low" />}
            {decision === "refer" && <AlertTriangle className="h-8 w-8 text-primary" />}
            {decision === "reject" && <XCircle className="h-8 w-8 text-risk-high" />}
          </div>
          <h2 className="text-xl font-bold text-foreground capitalize">Risk {decision}ed</h2>
          <p className="text-sm text-muted-foreground">Decision recorded for {property.name}</p>
          <button
            onClick={() => setSubmitted(false)}
            className="text-sm text-primary hover:underline"
          >
            Edit Decision
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 max-w-3xl mx-auto">
      <h2 className="text-lg font-semibold text-foreground">Underwriting Decision</h2>

      {/* Summary */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h3 className="text-sm font-medium text-foreground">Risk Summary</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Risk Score</span>
            <span className={`font-bold ${breakdown.total >= 70 ? "text-risk-high" : breakdown.total >= 40 ? "text-risk-medium" : "text-risk-low"}`}>
              {breakdown.total}/100
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sum Insured</span>
            <span className="font-medium text-foreground">AED {(property.sumInsured / 1000000).toFixed(1)}M</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">AI Insights Accepted</span>
            <span className="font-medium text-foreground">{acceptedInsights.length}/{insights.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">High Severity Flags</span>
            <span className="font-bold text-risk-high">{highSeverity.length}</span>
          </div>
        </div>
      </div>

      {/* Decision buttons */}
      <div className="grid grid-cols-3 gap-3">
        <DecisionButton
          type="approve"
          icon={CheckCircle2}
          selected={decision === "approve"}
          onClick={() => setDecision("approve")}
          color="border-risk-low bg-risk-low/10 text-risk-low"
        />
        <DecisionButton
          type="refer"
          icon={AlertTriangle}
          selected={decision === "refer"}
          onClick={() => setDecision("refer")}
          color="border-primary bg-primary/10 text-primary"
        />
        <DecisionButton
          type="reject"
          icon={XCircle}
          selected={decision === "reject"}
          onClick={() => setDecision("reject")}
          color="border-risk-high bg-risk-high/10 text-risk-high"
        />
      </div>

      {/* Notes */}
      {decision && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">Decision Notes (required)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Provide justification for your decision..."
            rows={4}
            className="w-full rounded-xl border border-border bg-input p-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring resize-none"
          />

          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={!notes.trim()}
              className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              Submit Decision
            </button>
            <button className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm text-muted-foreground hover:bg-accent transition-colors">
              <FileDown className="h-4 w-4" /> Export Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DecisionButton({
  type,
  icon: Icon,
  selected,
  onClick,
  color,
}: {
  type: string;
  icon: React.ComponentType<{ className?: string }>;
  selected: boolean;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all capitalize ${
        selected ? `${color} ring-1 ring-current` : "border-border bg-card text-muted-foreground hover:bg-accent"
      }`}
    >
      <Icon className="h-6 w-6" />
      <span className="text-sm font-medium">{type}</span>
    </button>
  );
}
