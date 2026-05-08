import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { RiskGaugeRing } from "@/components/ui/risk-gauge-ring";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  ArrowRight,
  Search,
  Filter,
  LayoutGrid,
  List,
  ArrowUpDown,
  AlertTriangle,
  Building2,
  Mail,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { EmailIngestionPanel } from "@/components/irv/email-ingestion-panel";
import { useEmailPolling } from "@/hooks/use-email-polling";
import { useSubmissionProperties } from "@/data/submission-property-store";

export const Route = createFileRoute("/submissions")({
  component: SubmissionsPage,
  head: () => ({
    meta: [
      { title: "Submissions — P&C 360 IRV" },
      { name: "description", content: "View and manage all property submissions." },
    ],
  }),
});

type SortKey = "date" | "risk" | "sumInsured" | "name";
type ViewMode = "list" | "grid";

function SubmissionsPage() {
  const navigate = useNavigate();
  const { pendingCount } = useEmailPolling();
  const { properties, refresh } = useSubmissionProperties();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortKey>("date");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [showEmailIngestion, setShowEmailIngestion] = useState(false);

  // Auto-show email panel when pending emails detected
  useEffect(() => {
    if (pendingCount > 0 && !showEmailIngestion) {
      setShowEmailIngestion(true);
    }
  }, [pendingCount]);

  const statusCounts = useMemo(() => ({
    all: properties.length,
    pending: properties.filter((p) => p.status === "pending").length,
    approved: properties.filter((p) => p.status === "approved").length,
    referred: properties.filter((p) => p.status === "referred").length,
    rejected: properties.filter((p) => p.status === "rejected").length,
  }), [properties]);

  const filtered = useMemo(() => {
    let items = properties.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.city.toLowerCase().includes(search.toLowerCase()) ||
        p.broker.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    items = [...items].sort((a, b) => {
      switch (sortBy) {
        case "risk": return b.riskScore - a.riskScore;
        case "sumInsured": return b.sumInsured - a.sumInsured;
        case "name": return a.name.localeCompare(b.name);
        default: return 0;
      }
    });

    return items;
  }, [properties, search, statusFilter, sortBy]);

  const getDaysAgo = (dateStr: string) => {
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days}d ago`;
  };

  const getAgeBadgeColor = (dateStr: string) => {
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (days >= 5) return "text-risk-high";
    if (days >= 3) return "text-status-pending";
    return "text-muted-foreground";
  };

  const getRiskAccent = (score: number) => {
    if (score >= 70) return "accent-high";
    if (score >= 40) return "accent-medium";
    return "accent-low";
  };

  return (
    <div className="p-5 md:p-8 space-y-6 max-w-[1440px] mx-auto page-enter">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">Submissions</h1>
          <p className="text-sm text-muted-foreground mt-1">{properties.length} properties in portfolio</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEmailIngestion((v) => !v)}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-colors relative ${
              showEmailIngestion
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            <Mail className="h-3.5 w-3.5" />
            Email Ingestion
            {pendingCount > 0 && !showEmailIngestion && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-risk-high text-[10px] font-bold text-white px-1.5">
                {pendingCount}
              </span>
            )}
          </button>
          {/* Sort */}
          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2">
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="bg-transparent text-xs text-foreground outline-none cursor-pointer font-medium"
            >
              <option value="date">Date</option>
              <option value="risk">Risk Score</option>
              <option value="sumInsured">Sum Insured</option>
              <option value="name">Name</option>
            </select>
          </div>
          {/* View toggle */}
          <div className="flex rounded-xl border border-border bg-card overflow-hidden">
            <button
              onClick={() => setViewMode("list")}
              className={`p-2.5 transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2.5 transition-colors ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 search-command px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Search by name, city, or broker..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none"
          />
        </div>

        {/* Status filter chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          {(["all", "pending", "approved", "referred", "rejected"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-all ${
                statusFilter === s
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                  : "bg-card border border-border text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {s}{" "}
              <span className={statusFilter === s ? "text-primary-foreground/70" : "text-muted-foreground/60"}>
                ({statusCounts[s]})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Email Ingestion Panel */}
      {showEmailIngestion && (
        <EmailIngestionPanel
          onClose={() => setShowEmailIngestion(false)}
          onSubmissionCreated={() => void refresh()}
        />
      )}

      {/* Results */}
      {viewMode === "list" ? (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Sticky Table Header */}
          <div className="bg-muted/30 border-b border-border frosted-header sticky top-0 z-10">
            <div className="grid grid-cols-[48px_1fr_140px_64px_140px_120px_100px_100px_100px_80px_32px] items-center px-4 py-3 gap-2">
              <span className="section-label">Risk</span>
              <span className="section-label">Risk Name</span>
              <span className="section-label">Insurer</span>
              <span className="section-label text-center">Share</span>
              <span className="section-label">RI Broker</span>
              <span className="section-label">Broker</span>
              <span className="section-label">Start Date</span>
              <span className="section-label">Approached</span>
              <span className="section-label text-right">TSI</span>
              <span className="section-label text-center">Status</span>
              <span />
            </div>
          </div>
          <div className="stagger-children">
            {filtered.map((prop, idx) => (
              <div
                key={prop.id}
                className={`grid grid-cols-[48px_1fr_140px_64px_140px_120px_100px_100px_100px_80px_32px] items-center px-4 py-3.5 gap-2 cursor-pointer table-row-premium group card-accent-left ${getRiskAccent(prop.riskScore)} ${
                  idx < filtered.length - 1 ? "border-b border-border/40" : ""
                }`}
                onClick={() => navigate({ to: "/risk/$id", params: { id: prop.id } })}
              >
                <div>
                  <RiskGaugeRing score={prop.riskScore} size="sm" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">{prop.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{prop.city} • {prop.type}</p>
                </div>
                <p className="text-foreground text-xs truncate">{prop.insurerName}</p>
                <div className="text-center">
                  <span className="inline-flex items-center rounded-full bg-primary/8 text-primary px-2 py-0.5 text-[11px] font-semibold">
                    {prop.shareOffered}%
                  </span>
                </div>
                <p className="text-foreground text-xs truncate">{prop.reinsuranceBroker}</p>
                <p className="text-foreground text-xs truncate">{prop.broker}</p>
                <p className="text-foreground text-xs">{prop.riskStartDate}</p>
                <div>
                  <p className="text-foreground text-xs">{prop.dateApproached}</p>
                  <p className={`text-[10px] font-semibold ${getAgeBadgeColor(prop.dateApproached)}`}>
                    {getDaysAgo(prop.dateApproached)}
                  </p>
                </div>
                <p className="text-foreground text-xs font-semibold text-right">AED {(prop.sumInsured / 1_000_000).toFixed(1)}M</p>
                <div className="text-center">
                  <StatusBadge status={prop.status} />
                </div>
                <div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
          {filtered.map((prop) => (
            <Link
              key={prop.id}
              to="/risk/$id"
              params={{ id: prop.id }}
              className="group rounded-xl border border-border bg-card overflow-hidden hover-lift transition-all gradient-border-card"
            >
              {/* Card header with gradient */}
              <div className={`h-1.5 ${
                prop.riskScore >= 70 ? "bg-gradient-to-r from-risk-high to-risk-high/40" :
                prop.riskScore >= 40 ? "bg-gradient-to-r from-risk-medium to-risk-medium/40" :
                "bg-gradient-to-r from-risk-low to-risk-low/40"
              }`} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                      {prop.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{prop.broker} • {prop.city}</p>
                  </div>
                  <RiskGaugeRing score={prop.riskScore} size="md" />
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-[11px] mb-4">
                  <InfoCell label="Insurer" value={prop.insurerName} />
                  <InfoCell label="Share Offered" value={`${prop.shareOffered}%`} />
                  <InfoCell label="RI Broker" value={prop.reinsuranceBroker} />
                  <InfoCell label="Sum Insured" value={`AED ${(prop.sumInsured / 1_000_000).toFixed(1)}M`} />
                  <InfoCell label="Risk Start" value={prop.riskStartDate} />
                  <InfoCell label="Approached" value={getDaysAgo(prop.dateApproached)} />
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  <StatusBadge status={prop.status} size="md" />
                  {prop.riskScore >= 70 && (
                    <span className="text-[10px] text-risk-high font-semibold flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {prop.aiInsights.filter((i) => i.severity === "high").length} critical
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <Search className="h-10 w-10 mx-auto mb-4 opacity-30" />
          <p className="font-semibold text-foreground">No submissions match your filters</p>
          <p className="text-xs mt-1.5">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-accent/30 rounded-lg px-2.5 py-2">
      <p className="text-muted-foreground text-[10px] font-medium">{label}</p>
      <p className="text-foreground font-semibold truncate mt-0.5">{value}</p>
    </div>
  );
}
