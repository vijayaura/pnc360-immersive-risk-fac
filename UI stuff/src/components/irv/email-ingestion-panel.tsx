import { useState, useEffect } from "react";
import { Mail, Inbox, Loader2, Sparkles, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, X, Clock, Paperclip } from "lucide-react";
import { processEmailSubmission } from "@/server/email-ingestion.functions";
import { useEmailPolling, type EmailCandidate } from "@/hooks/use-email-polling";
import type { Property } from "@/data/mock-properties";
import { getEmailPropertyId, useSubmissionProperties } from "@/data/submission-property-store";

interface ProcessedEmail {
  emailId: string;
  status: "processing" | "done" | "error";
  propertyId?: string;
  propertyName?: string;
  error?: string;
}

interface ParsedAttachmentSummary {
  filename: string;
  size: number;
  mimeType: string;
  parsed: boolean;
  parseStatus: string;
  textChars: number;
}

const formatFileSize = (bytes: number) => bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
const documentTypeFor = (filename: string): Property["documents"][number]["type"] => {
  const name = filename.toLowerCase();
  if (name.includes("slip") || name.includes("proposal")) return "proposal";
  if (name.includes("survey") || name.includes("risk report")) return "survey";
  if (name.includes("claim") || name.includes("loss")) return "report";
  if (/\.(png|jpe?g|webp)$/i.test(name)) return "photo";
  return "report";
};

interface EmailIngestionPanelProps {
  onClose: () => void;
  onSubmissionCreated?: (property: Property) => void;
}

export function EmailIngestionPanel({ onClose, onSubmissionCreated }: EmailIngestionPanelProps) {
  const { pendingEmails, pendingCount, lastChecked, checking, poll, dismissEmail } = useEmailPolling();
  const { saveEmailProperty } = useSubmissionProperties();
  const [processed, setProcessed] = useState<Record<string, ProcessedEmail>>({});

  const formatLastChecked = () => {
    if (!lastChecked) return "Never";
    const mins = Math.round((Date.now() - lastChecked.getTime()) / 60000);
    if (mins < 1) return "Just now";
    if (mins === 1) return "1 min ago";
    return `${mins} mins ago`;
  };

  const processEmail = async (email: EmailCandidate) => {
    setProcessed((prev) => ({
      ...prev,
      [email.id]: { emailId: email.id, status: "processing" },
    }));

    try {
      const result = await processEmailSubmission({
        data: {
          emailId: email.id,
          subject: email.subject,
          from: email.from,
          body: email.body,
          date: email.date,
          attachments: email.attachments || [],
        },
      });

      if (result.error || !result.submission) {
        setProcessed((prev) => ({
          ...prev,
          [email.id]: { emailId: email.id, status: "error", error: result.error || "No data returned" },
        }));
        return;
      }

      const sub = result.submission;
      const nextId = getEmailPropertyId(email.id);
      const uploadDate = new Date().toISOString().split("T")[0];
      const parsedAttachments = ((result.attachmentsParsed || []) as ParsedAttachmentSummary[]).length
        ? (result.attachmentsParsed || []) as ParsedAttachmentSummary[]
        : (email.attachments || []).map((a) => ({ filename: a.filename, size: a.size, mimeType: a.mimeType, parsed: false, parseStatus: "Detected, extraction status unavailable", textChars: 0 }));

      const newProperty: Property = {
        id: nextId,
        name: `${sub.propertyName} [Email]`,
        address: sub.address || "Via email submission",
        city: sub.city || "Dubai",
        country: sub.country || "UAE",
        lat: sub.lat || 0,
        lng: sub.lng || 0,
        type: sub.type || "office",
        constructionMaterial: sub.constructionMaterial || "Unknown",
        floors: sub.floors || 1,
        yearBuilt: sub.yearBuilt || 2015,
        occupancy: sub.occupancy || "Commercial",
        occupancyCapacity: sub.occupancyCapacity || 500,
        sumInsured: sub.sumInsured || 100_000_000,
        fireProtection: {
          sprinklers: sub.sprinklers ?? true,
          alarms: sub.alarms ?? true,
          extinguishers: sub.extinguishers ?? true,
          hydrantNearby: sub.hydrantNearby ?? true,
        },
        electricalCondition: sub.electricalCondition || "fair",
        plumbingCondition: sub.plumbingCondition || "fair",
        roofCondition: sub.roofCondition || "fair",
        status: "pending",
        broker: sub.broker || "Via Email",
        submissionDate: new Date().toISOString().split("T")[0],
        riskScore: sub.riskScore || 50,
        images: [],
        aiInsights: (sub.insights || []).map((ins: any, i: number) => ({
          id: `ei-${nextId}-${i}`,
          text: ins.text,
          severity: ins.severity,
          confidence: ins.confidence,
          category: ins.category,
          status: "pending" as const,
        })),
        documents: [
          {
            id: `doc-email-${nextId}`,
            name: `Email: ${email.subject}`,
            type: "note" as const,
            size: formatFileSize(new Blob([email.body || email.snippet || ""]).size),
            uploadDate,
          },
          ...parsedAttachments.map((att, index) => ({
            id: `doc-${nextId}-${index}`,
            name: att.parsed ? att.filename : `${att.filename} — extraction limited`,
            type: documentTypeFor(att.filename),
            size: formatFileSize(att.size),
            uploadDate,
          })),
        ],
        floodZone: sub.floodZone ?? false,
        nearCoast: sub.nearCoast ?? false,
        nearIndustrial: sub.nearIndustrial ?? false,
        insurerName: sub.insurerName || "TBD",
        shareOffered: sub.shareOffered || 25,
        reinsuranceBroker: sub.reinsuranceBroker || "TBD",
        riskStartDate: sub.riskStartDate || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
        dateApproached: sub.dateApproached || uploadDate,
        claims: (sub.claims || []).map((c: any) => ({
          date: c.date || "2024-01-01",
          peril: c.peril || "water_damage",
          description: c.description || "Claim from documents",
          grossPaid: c.grossPaid || 0,
          netPaid: c.netPaid || 0,
          reserves: c.reserves || 0,
          status: c.status || "closed",
        })),
      };

      const saved = await saveEmailProperty(newProperty, {
        emailId: email.id,
        subject: email.subject,
        from: email.from,
        date: email.date,
      });
      if (saved.error || !saved.property) {
        setProcessed((prev) => ({
          ...prev,
          [email.id]: { emailId: email.id, status: "error", error: saved.error || "Failed to save submission" },
        }));
        return;
      }

      dismissEmail(email.id);
      onSubmissionCreated?.(saved.property);

      setProcessed((prev) => ({
        ...prev,
        [email.id]: {
          emailId: email.id,
          status: "done",
          propertyId: saved.property.id,
          propertyName: saved.property.name,
        },
      }));
    } catch (e) {
      setProcessed((prev) => ({
        ...prev,
        [email.id]: { emailId: email.id, status: "error", error: e instanceof Error ? e.message : "Failed" },
      }));
    }
  };

  const unprocessedEmails = pendingEmails.filter((e) => !processed[e.id]);
  const processedList = Object.values(processed).filter((p) => p.status === "done" || p.status === "error");

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Email Ingestion</h3>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span>Auto-scanning Gmail</span>
              <span>•</span>
              <Clock className="h-3 w-3" />
              <span>Last: {formatLastChecked()}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-risk-high text-[11px] font-bold text-white px-2">
              {pendingCount} new
            </span>
          )}
          <button
            onClick={poll}
            disabled={checking}
            className="flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {checking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            {checking ? "Scanning..." : "Refresh"}
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-3 max-h-[500px] overflow-y-auto">
        {!checking && pendingEmails.length === 0 && processedList.length === 0 && (
          <div className="text-center py-10">
            <CheckCircle2 className="h-10 w-10 mx-auto text-risk-low/40 mb-3" />
            <p className="text-sm text-muted-foreground font-medium">No submission emails detected</p>
            <p className="text-[11px] text-muted-foreground/60 mt-1">
              Inbox is scanned every 3 minutes for keywords: submission, risk survey, quote request, etc.
            </p>
          </div>
        )}

        {checking && pendingEmails.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Scanning Gmail inbox...</p>
          </div>
        )}

        {/* Unprocessed emails — ready for approval */}
        {unprocessedEmails.map((email) => (
          <div key={email.id} className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-risk-high/10 text-risk-high px-2 py-0.5 text-[10px] font-bold">NEW</span>
                  <p className="text-sm font-semibold text-foreground truncate">{email.subject || "(No subject)"}</p>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  From: {email.from} • {email.date}
                </p>
              </div>
              <button
                onClick={() => processEmail(email)}
                disabled={processed[email.id]?.status === "processing"}
                className="flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:bg-primary/90 transition-colors shrink-0 disabled:opacity-50"
              >
                {processed[email.id]?.status === "processing" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                {processed[email.id]?.status === "processing" ? "Processing..." : "Approve & Process"}
              </button>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">{email.snippet}</p>
            {email.attachments && email.attachments.length > 0 && (
              <div className="flex items-center gap-1.5 mt-1">
                <Paperclip className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-medium text-primary">
                  {email.attachments.length} attachment{email.attachments.length > 1 ? "s" : ""}:
                </span>
                <span className="text-[10px] text-muted-foreground truncate">
                  {email.attachments.map(a => a.filename).join(", ")}
                </span>
              </div>
            )}
          </div>
        ))}

        {/* Processed results */}
        {processedList.map((p) => (
          <div
            key={p.emailId}
            className={`rounded-xl border p-4 space-y-2 ${
              p.status === "done"
                ? "border-risk-low/30 bg-risk-low/5"
                : "border-risk-high/30 bg-risk-high/5"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {p.propertyName || "Email processed"}
                </p>
              </div>
              {p.status === "done" && <CheckCircle2 className="h-4 w-4 text-risk-low shrink-0" />}
              {p.status === "error" && <AlertTriangle className="h-4 w-4 text-risk-high shrink-0" />}
            </div>
            {p.status === "done" && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-risk-low font-medium">
                  ✓ Created: {p.propertyName} ({p.propertyId})
                </p>
                <a
                  href={`/risk/${p.propertyId}`}
                  className="text-[11px] text-primary font-medium flex items-center gap-1 hover:underline"
                >
                  View <ArrowRight className="h-3 w-3" />
                </a>
              </div>
            )}
            {p.status === "error" && (
              <p className="text-xs text-risk-high">{p.error}</p>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      {(unprocessedEmails.length > 0) && (
        <div className="px-5 py-3 border-t border-border bg-muted/20 flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">
            {unprocessedEmails.length} email(s) awaiting approval
          </p>
          <button
            onClick={() => unprocessedEmails.forEach(processEmail)}
            className="text-[11px] text-primary font-medium hover:underline"
          >
            Approve All ({unprocessedEmails.length})
          </button>
        </div>
      )}
    </div>
  );
}
