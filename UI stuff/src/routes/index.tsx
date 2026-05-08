import { createFileRoute, Link } from "@tanstack/react-router";
import { mockProperties } from "@/data/mock-properties";
import { weatherAlerts } from "@/data/mock-weather";
import { PortfolioRiskMap } from "@/components/dashboard/portfolio-risk-map";
import { RiskGaugeRing } from "@/components/ui/risk-gauge-ring";
import { StatusBadge } from "@/components/ui/status-badge";
import { Sparkline } from "@/components/ui/sparkline";
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  ArrowRight,
  Building2,
  Shield,
  CloudLightning,
  Flame,
  Zap,
  Activity,
  MapPin,
  X,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Dashboard — P&C 360 IRV" },
      { name: "description", content: "Underwriting dashboard with risk overview and recent submissions." },
    ],
  }),
});

function Dashboard() {
  const [alertDismissed, setAlertDismissed] = useState(false);
  const pending = mockProperties.filter((p) => p.status === "pending");
  const approved = mockProperties.filter((p) => p.status === "approved");
  const referred = mockProperties.filter((p) => p.status === "referred");
  const rejected = mockProperties.filter((p) => p.status === "rejected");

  const totalInsured = mockProperties.reduce((sum, p) => sum + p.sumInsured, 0);
  const avgRisk = Math.round(mockProperties.reduce((sum, p) => sum + p.riskScore, 0) / mockProperties.length);
  const highRiskCount = mockProperties.filter((p) => p.riskScore >= 70).length;

  const urgentItems = mockProperties.filter(
    (p) => (p.riskScore >= 70 && p.status === "pending") || (p.status === "referred")
  );

  const activeAlerts = weatherAlerts.filter((a) => a.severity === "extreme" || a.severity === "severe");

  return (
    <div className="p-5 md:p-8 space-y-7 max-w-[1440px] mx-auto page-enter">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
            Underwriting Command Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Good morning, Sarah — you have{" "}
            <span className="text-primary font-semibold">{urgentItems.length} items</span>{" "}
            requiring attention
          </p>
        </div>
        <Link
          to="/submissions"
          className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.97]"
        >
          All Submissions <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Weather Alert Banner */}
      {activeAlerts.length > 0 && !alertDismissed && (
        <div className="rounded-xl border border-risk-high/25 bg-gradient-to-r from-risk-high/8 to-risk-high/4 p-4 flex items-start gap-3 animate-count-up">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-risk-high/15 shrink-0">
            <CloudLightning className="h-5 w-5 text-risk-high" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Active Weather Alerts</p>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {activeAlerts.map((a) => `${a.type.replace(/_/g, " ")} — ${a.area}`).join(" • ")}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-bold text-risk-high bg-risk-high/15 rounded-full px-3 py-1">
              {activeAlerts.length} Active
            </span>
            <button
              onClick={() => setAlertDismissed(true)}
              className="p-1 rounded-lg hover:bg-risk-high/10 text-muted-foreground hover:text-risk-high transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 stagger-children">
        <KPICard
          icon={Clock}
          label="Pending Review"
          value={pending.length}
          accent="pending"
          sparkData={[1, 2, 1, 3, 2, 3]}
          trend="+2 this week"
          trendUp
        />
        <KPICard
          icon={CheckCircle2}
          label="Approved"
          value={approved.length}
          accent="approved"
          sparkData={[1, 2, 2, 3, 3, 3]}
          trend="On track"
          trendUp
        />
        <KPICard
          icon={AlertTriangle}
          label="Referred"
          value={referred.length}
          accent="referred"
          sparkData={[1, 1, 2, 1, 2, 2]}
          trend="Needs attention"
          trendUp={false}
        />
        <KPICard
          icon={XCircle}
          label="Declined"
          value={rejected.length}
          accent="rejected"
          sparkData={[1, 0, 1, 0, 0, 0]}
          trend="Within ratio"
          trendUp
        />
      </div>

      {/* Portfolio Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 stagger-children">
        <div className="rounded-xl border border-border bg-card p-5 card-accent-left accent-primary inner-shadow hover-lift transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground font-medium">Total Sum Insured</span>
          </div>
          <p className="text-3xl font-extrabold text-foreground tracking-tight">
            AED {(totalInsured / 1_000_000).toFixed(1)}M
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">{mockProperties.length} properties in portfolio</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 inner-shadow hover-lift transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground font-medium">Average Risk Score</span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-extrabold text-foreground">{avgRisk}</p>
              <p className="text-[11px] text-muted-foreground mt-1">Portfolio weighted average</p>
            </div>
            <RiskGaugeRing score={avgRisk} size="xl" showLabel />
          </div>
        </div>

        <div className={`rounded-xl border bg-card p-5 inner-shadow hover-lift transition-all ${highRiskCount > 0 ? "border-risk-high/25 card-accent-left accent-high" : "border-border"}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${highRiskCount > 0 ? "bg-risk-high/10" : "bg-primary/10"}`}>
              <Flame className={`h-5 w-5 ${highRiskCount > 0 ? "text-risk-high" : "text-primary"}`} />
            </div>
            <span className="text-xs text-muted-foreground font-medium">High Risk Properties</span>
          </div>
          <p className="text-3xl font-extrabold text-foreground">{highRiskCount}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Score ≥ 70 — require scrutiny</p>
        </div>
      </div>

      {/* Priority Queue */}
      {urgentItems.length > 0 && (
        <div className="animate-count-up">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-status-pending/10">
              <Zap className="h-3.5 w-3.5 text-status-pending" />
            </div>
            <h2 className="text-base font-bold text-foreground">Priority Queue</h2>
            <span className="text-[10px] bg-status-pending/15 text-status-pending rounded-full px-2.5 py-0.5 font-semibold">
              {urgentItems.length} items
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {urgentItems.map((prop) => (
              <Link
                key={prop.id}
                to="/risk/$id"
                params={{ id: prop.id }}
                className="group rounded-xl border border-border bg-card p-4 hover-lift transition-all gradient-border-card card-accent-left accent-high"
              >
                <div className="flex items-start gap-3">
                  <RiskGaugeRing score={prop.riskScore} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {prop.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                      <MapPin className="h-2.5 w-2.5" />
                      {prop.broker} • {prop.city}
                    </p>
                    <div className="flex items-center gap-2 mt-2.5">
                      <StatusBadge status={prop.status} />
                      <span className="text-[10px] text-muted-foreground font-medium">
                        AED {(prop.sumInsured / 1_000_000).toFixed(1)}M
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                </div>
                {prop.riskScore >= 70 && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-[11px] text-risk-high font-medium flex items-center gap-1.5">
                      <AlertTriangle className="h-3 w-3" />
                      High risk — {prop.aiInsights.filter((i) => i.severity === "high").length} critical findings
                    </p>
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Portfolio Risk Map */}
      <PortfolioRiskMap />

      {/* Recent Submissions */}
      <div className="animate-count-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-foreground">Recent Submissions</h2>
          <Link to="/submissions" className="text-xs text-primary hover:text-primary/80 font-semibold transition-colors flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {mockProperties.slice(0, 5).map((prop, idx) => (
            <Link
              key={prop.id}
              to="/risk/$id"
              params={{ id: prop.id }}
              className={`flex items-center gap-4 p-4 transition-all group table-row-premium ${
                idx < 4 ? "border-b border-border/50" : ""
              }`}
            >
              <RiskGaugeRing score={prop.riskScore} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                  {prop.name}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {prop.broker} • {prop.city} • AED {(prop.sumInsured / 1_000_000).toFixed(1)}M
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <StatusBadge status={prop.status} />
                <span className="text-[10px] text-muted-foreground hidden md:inline font-medium">{prop.submissionDate}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, accent, sparkData, trend, trendUp }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  accent: "pending" | "approved" | "referred" | "rejected";
  sparkData: number[];
  trend: string;
  trendUp: boolean;
}) {
  const colorMap = {
    pending: { text: "text-status-pending", bg: "bg-status-pending/10", accentClass: "accent-pending", sparkColor: "var(--status-pending)" },
    approved: { text: "text-status-approved", bg: "bg-status-approved/10", accentClass: "accent-approved", sparkColor: "var(--status-approved)" },
    referred: { text: "text-status-referred", bg: "bg-status-referred/10", accentClass: "accent-referred", sparkColor: "var(--status-referred)" },
    rejected: { text: "text-status-rejected", bg: "bg-status-rejected/10", accentClass: "accent-rejected", sparkColor: "var(--status-rejected)" },
  };
  const c = colorMap[accent];

  return (
    <div className={`rounded-xl border border-border bg-card p-4 md:p-5 hover-lift transition-all card-accent-left ${c.accentClass} inner-shadow`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${c.bg}`}>
          <Icon className={`h-4 w-4 ${c.text}`} />
        </div>
        <Sparkline data={sparkData} width={64} height={20} color={c.sparkColor} />
      </div>
      <p className="text-3xl font-extrabold text-foreground animate-count-up tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground mt-1 font-medium">{label}</p>
      <div className="flex items-center gap-1 mt-1.5">
        {trendUp ? (
          <TrendingUp className={`h-3 w-3 ${c.text}`} />
        ) : (
          <AlertTriangle className={`h-3 w-3 ${c.text}`} />
        )}
        <p className={`text-[10px] font-semibold ${c.text}`}>{trend}</p>
      </div>
    </div>
  );
}
