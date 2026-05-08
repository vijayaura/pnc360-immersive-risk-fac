import {
  weatherAlerts,
  alertTypeEmoji,
  alertSeverityColor,
  type WeatherAlert,
} from "@/data/mock-weather";
import { mockProperties } from "@/data/mock-properties";
import { AlertTriangle, ChevronRight } from "lucide-react";

interface WeatherAlertsPanelProps {
  onAlertClick?: (alert: WeatherAlert) => void;
}

function formatAED(n: number): string {
  if (n >= 1_000_000_000) return `AED ${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `AED ${(n / 1_000).toFixed(0)}K`;
  return `AED ${n}`;
}

const sortedAlerts = [...weatherAlerts].sort((a, b) => {
  const order: Record<string, number> = { extreme: 0, severe: 1, moderate: 2, minor: 3 };
  return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
});

export function WeatherAlertsPanel({ onAlertClick }: WeatherAlertsPanelProps) {
  const totalExposed = weatherAlerts.reduce((sum, a) => {
    const ids = new Set(a.affectedPropertyIds);
    return sum + mockProperties.filter((p) => ids.has(p.id)).reduce((s, p) => s + p.sumInsured, 0);
  }, 0);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden mb-4">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-destructive/10">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        <span className="text-xs font-semibold text-foreground">Active Weather Alerts</span>
        <span className="ml-auto text-[10px] text-muted-foreground">
          {weatherAlerts.length} alerts • {formatAED(totalExposed)} total exposure at risk
        </span>
      </div>

      <div className="flex gap-2 p-2 overflow-x-auto">
        {sortedAlerts.map((alert) => {
          const affectedProps = mockProperties.filter((p) => alert.affectedPropertyIds.includes(p.id));
          const exposedSI = affectedProps.reduce((s, p) => s + p.sumInsured, 0);
          const borderColor = alertSeverityColor[alert.severity];

          return (
            <button
              key={alert.id}
              onClick={() => onAlertClick?.(alert)}
              className="shrink-0 w-[260px] rounded-lg border bg-card p-3 text-left hover:bg-accent/50 transition-colors group"
              style={{ borderColor, borderWidth: 1, borderLeftWidth: 3 }}
            >
              <div className="flex items-start gap-2 mb-1.5">
                <span className="text-lg leading-none">{alertTypeEmoji[alert.type]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase text-white"
                      style={{ background: borderColor }}
                    >
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-foreground mt-1 leading-tight truncate">
                    {alert.title}
                  </p>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
              </div>

              <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2 mb-2">
                {alert.description}
              </p>

              <div className="flex items-center gap-3 text-[10px]">
                <span className="text-foreground font-medium">
                  {affectedProps.length} properties
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="font-medium" style={{ color: borderColor }}>
                  {formatAED(exposedSI)} exposed
                </span>
              </div>

              <p className="text-[9px] text-muted-foreground mt-1.5 truncate">
                📍 {alert.area}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
