import { useState } from "react";
import type { Property } from "@/data/mock-properties";
import { FileText, Image, Award, StickyNote, ClipboardList, Upload, Loader2, Sparkles, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { analyzeSubmissionDocuments } from "@/server/documents.functions";
import { ModelSelector, type AIModelId } from "./model-selector";

interface SubmissionDocumentsProps {
  property: Property;
  highlightDocId?: string | null;
}

interface DocAnalysis {
  completenessScore: number;
  completenessNote: string;
  keyFindings: Array<{ finding: string; severity: string; relatedDocument?: string }>;
  missingDocuments: string[];
  riskFlags: string[];
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  proposal: FileText,
  survey: ClipboardList,
  certificate: Award,
  photo: Image,
  report: FileText,
  note: StickyNote,
};

export function SubmissionDocuments({ property, highlightDocId }: SubmissionDocumentsProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<DocAnalysis | null>(null);
  const [selectedModel, setSelectedModel] = useState<AIModelId>("google/gemini-3-flash-preview");

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const result = await analyzeSubmissionDocuments({
        data: {
          propertyName: property.name,
          propertyType: property.type,
          city: property.city,
          broker: property.broker,
          sumInsured: property.sumInsured,
          documents: property.documents.map(d => ({ id: d.id, name: d.name, type: d.type, size: d.size })),
          riskScore: property.riskScore,
          model: selectedModel,
        },
      });
      if (result.analysis) setAnalysis(result.analysis);
    } catch {
      // ignore
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Submission & Evidence</h2>
        <div className="flex items-center gap-2">
          <ModelSelector value={selectedModel} onChange={setSelectedModel} disabled={analyzing} />
          <button
            onClick={runAnalysis}
            disabled={analyzing}
            className="flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {analyzing ? "Analyzing..." : "AI Document Analysis"}
          </button>
          <button className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors">
            <Upload className="h-3.5 w-3.5" /> Upload Document
          </button>
        </div>
      </div>

      {/* AI Analysis Results */}
      {analyzing && (
        <div className="flex flex-col items-center justify-center py-6 gap-2 rounded-xl border border-border bg-card">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Analyzing submission documents with AI...</p>
        </div>
      )}

      {analysis && !analyzing && (
        <div className="space-y-4">
          {/* Completeness Score */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-foreground">Document Completeness</p>
              <span className={`text-lg font-bold ${analysis.completenessScore >= 80 ? "text-risk-low" : analysis.completenessScore >= 60 ? "text-risk-medium" : "text-risk-high"}`}>
                {analysis.completenessScore}%
              </span>
            </div>
            <div className="h-2 bg-accent/20 rounded-full overflow-hidden mb-2">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${analysis.completenessScore}%`,
                  background: analysis.completenessScore >= 80 ? "#22c55e" : analysis.completenessScore >= 60 ? "#d97706" : "#dc2626",
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{analysis.completenessNote}</p>
          </div>

          {/* Key Findings */}
          {analysis.keyFindings.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              <p className="text-sm font-semibold text-foreground">Key Findings</p>
              {analysis.keyFindings.map((f, i) => (
                <div key={i} className={`flex items-start gap-2 rounded-lg p-2 ${
                  f.severity === "critical" ? "bg-risk-high/10" : f.severity === "warning" ? "bg-risk-medium/10" : "bg-accent/30"
                }`}>
                  {f.severity === "critical" ? <AlertTriangle className="h-3.5 w-3.5 text-risk-high shrink-0 mt-0.5" /> :
                   f.severity === "warning" ? <AlertTriangle className="h-3.5 w-3.5 text-risk-medium shrink-0 mt-0.5" /> :
                   <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />}
                  <div>
                    <p className="text-xs text-foreground">{f.finding}</p>
                    {f.relatedDocument && <p className="text-[10px] text-muted-foreground mt-0.5">Related: {f.relatedDocument}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Missing Documents & Risk Flags */}
          <div className="grid grid-cols-2 gap-3">
            {analysis.missingDocuments.length > 0 && (
              <div className="rounded-xl border border-risk-medium/30 bg-risk-medium/5 p-4 space-y-1.5">
                <p className="text-sm font-semibold text-foreground">Missing Documents</p>
                {analysis.missingDocuments.map((doc, i) => (
                  <p key={i} className="text-xs text-risk-medium flex items-center gap-1">• {doc}</p>
                ))}
              </div>
            )}
            {analysis.riskFlags.length > 0 && (
              <div className="rounded-xl border border-risk-high/30 bg-risk-high/5 p-4 space-y-1.5">
                <p className="text-sm font-semibold text-foreground">Risk Flags</p>
                {analysis.riskFlags.map((flag, i) => (
                  <p key={i} className="text-xs text-risk-high flex items-center gap-1">⚠ {flag}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload zone */}
      <div className="rounded-xl border-2 border-dashed border-border bg-card/50 p-8 text-center">
        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Drag and drop files here, or click to browse</p>
        <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, JPG, PNG up to 50MB</p>
      </div>

      {/* Documents list */}
      <div className="space-y-2">
        {property.documents.map((doc) => {
          const Icon = typeIcons[doc.type] || FileText;
          return (
            <div key={doc.id} className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${highlightDocId === doc.id ? "border-primary bg-primary/5 ring-2 ring-primary/20 animate-pulse" : "border-border bg-card hover:bg-accent/30"}`}>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent shrink-0">
                <Icon className="h-5 w-5 text-accent-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{doc.type} • {doc.size} • {doc.uploadDate}</p>
              </div>
              <button className="text-xs text-primary hover:underline shrink-0">Preview</button>
            </div>
          );
        })}
      </div>

      {/* Timeline */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">Submission Timeline</h3>
        <div className="space-y-3 relative">
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />
          {[
            { date: property.submissionDate, event: "Submission received", detail: `From ${property.broker}` },
            { date: property.submissionDate, event: "Documents uploaded", detail: `${property.documents.length} documents` },
            { date: property.submissionDate, event: "AI analysis initiated", detail: `${property.aiInsights.length} insights generated` },
            { date: "Pending", event: "Underwriter review", detail: "Awaiting decision" },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 relative">
              <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 z-10 ${
                i < 3 ? "bg-primary" : "bg-muted"
              }`}>
                <div className={`h-2 w-2 rounded-full ${i < 3 ? "bg-primary-foreground" : "bg-muted-foreground"}`} />
              </div>
              <div>
                <p className="text-sm text-foreground">{item.event}</p>
                <p className="text-xs text-muted-foreground">{item.detail} • {item.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
