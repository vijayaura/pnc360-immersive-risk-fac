import { useEffect, useRef, useState, useCallback } from "react";
import { mockProperties, type Property } from "@/data/mock-properties";
import {
  currentWeather,
  forecasts,
  weatherAlerts,
  historicalWeatherLosses,
  getWeatherThreatLevel,
  weatherConditionEmoji,
  alertSeverityColor,
  alertTypeEmoji,
  type WeatherAlert,
} from "@/data/mock-weather";
import { Eye, EyeOff, MapPin, Building2, DollarSign, AlertTriangle, CloudRain } from "lucide-react";
import { WeatherAlertsPanel } from "./weather-alerts-panel";

type ViewMode = "risk" | "status" | "sumInsured" | "type" | "weather";
type StatusFilter = "all" | "pending" | "approved" | "referred" | "rejected";

function getRiskColor(score: number): string {
  if (score >= 70) return "#ef4444";
  if (score >= 55) return "#f97316";
  if (score >= 40) return "#eab308";
  return "#22c55e";
}

function getStatusColor(status: string): string {
  const map: Record<string, string> = { pending: "#f59e0b", approved: "#22c55e", referred: "#f97316", rejected: "#ef4444" };
  return map[status] || "#94a3b8";
}

function getTypeColor(type: string): string {
  const map: Record<string, string> = { warehouse: "#8b5cf6", office: "#3b82f6", retail: "#06b6d4", industrial: "#f97316", residential: "#22c55e" };
  return map[type] || "#94a3b8";
}

function getSumInsuredColor(sum: number): string {
  if (sum >= 40000000) return "#ef4444";
  if (sum >= 20000000) return "#f97316";
  if (sum >= 10000000) return "#eab308";
  return "#22c55e";
}

function getMarkerColor(property: Property, mode: ViewMode): string {
  if (mode === "weather") return getWeatherThreatLevel(property.id).color;
  switch (mode) {
    case "risk": return getRiskColor(property.riskScore);
    case "status": return getStatusColor(property.status);
    case "sumInsured": return getSumInsuredColor(property.sumInsured);
    case "type": return getTypeColor(property.type);
  }
}

function getMarkerSize(property: Property, mode: ViewMode): number {
  if (mode === "weather") {
    const threat = getWeatherThreatLevel(property.id).level;
    return threat >= 70 ? 40 : threat >= 45 ? 32 : threat >= 25 ? 28 : 24;
  }
  if (mode === "sumInsured") {
    const base = Math.log10(property.sumInsured) * 4;
    return Math.max(20, Math.min(44, base));
  }
  if (mode === "risk") return property.riskScore >= 70 ? 36 : property.riskScore >= 40 ? 30 : 24;
  return 28;
}

function formatAED(n: number): string {
  if (n >= 1_000_000_000) return `AED ${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `AED ${(n / 1_000).toFixed(0)}K`;
  return `AED ${n}`;
}

const viewModes: { key: ViewMode; label: string; icon: typeof MapPin }[] = [
  { key: "risk", label: "Risk Score", icon: AlertTriangle },
  { key: "status", label: "Status", icon: Eye },
  { key: "sumInsured", label: "Sum Insured", icon: DollarSign },
  { key: "type", label: "Property Type", icon: Building2 },
  { key: "weather", label: "Weather", icon: CloudRain },
];

function buildWeatherPopup(prop: Property): string {
  const weather = currentWeather.find((w) => w.propertyId === prop.id);
  const forecast = forecasts.find((f) => f.propertyId === prop.id);
  const threat = getWeatherThreatLevel(prop.id);
  const losses = historicalWeatherLosses[prop.id] || [];
  const alerts = weatherAlerts.filter((a) => a.affectedPropertyIds.includes(prop.id));
  const riskColor = getRiskColor(prop.riskScore);

  const weatherAdjusted = Math.min(100, prop.riskScore + Math.round(threat.level * 0.3));

  let html = `<div style="color:#1e293b;min-width:260px;font-family:system-ui;max-width:320px">`;
  html += `<div style="font-weight:700;font-size:14px;margin-bottom:2px">${prop.name}</div>`;
  html += `<div style="font-size:11px;color:#64748b;margin-bottom:8px">${prop.address}, ${prop.city}</div>`;

  // Active alerts for this property
  if (alerts.length > 0) {
    html += `<div style="margin-bottom:8px">`;
    alerts.forEach((a) => {
      html += `<div style="background:${alertSeverityColor[a.severity]}15;border-left:3px solid ${alertSeverityColor[a.severity]};padding:4px 8px;border-radius:4px;margin-bottom:4px;font-size:10px">
        <span style="font-weight:700">${alertTypeEmoji[a.type]} ${a.title}</span>
      </div>`;
    });
    html += `</div>`;
  }

  // Current conditions
  if (weather) {
    html += `<div style="background:#f1f5f9;border-radius:8px;padding:8px;margin-bottom:8px">`;
    html += `<div style="font-size:10px;color:#94a3b8;margin-bottom:4px;font-weight:600">CURRENT CONDITIONS</div>`;
    html += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">`;
    html += `<span style="font-size:24px">${weatherConditionEmoji[weather.condition]}</span>`;
    html += `<span style="font-size:22px;font-weight:700">${weather.tempC}°C</span>`;
    html += `<span style="font-size:11px;color:#64748b">Feels ${weather.feelsLikeC}°C</span>`;
    html += `</div>`;
    html += `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;font-size:10px">`;
    html += `<div>💧 ${weather.humidity}%</div>`;
    html += `<div>💨 ${weather.windSpeedKmh} km/h ${weather.windDirection}</div>`;
    html += `<div>👁 ${weather.visibilityKm} km</div>`;
    html += `</div></div>`;
  }

  // Risk adjustment
  html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">`;
  html += `<div style="background:#f1f5f9;border-radius:6px;padding:6px 8px">
    <div style="font-size:10px;color:#94a3b8">Base Risk</div>
    <div style="font-size:16px;font-weight:700;color:${riskColor}">${prop.riskScore}</div>
  </div>`;
  html += `<div style="background:#f1f5f9;border-radius:6px;padding:6px 8px">
    <div style="font-size:10px;color:#94a3b8">Weather-Adjusted</div>
    <div style="font-size:16px;font-weight:700;color:${threat.color}">${weatherAdjusted} <span style="font-size:10px;color:${threat.color}">(${threat.label})</span></div>
  </div>`;
  html += `</div>`;

  // 3-day forecast
  if (forecast) {
    html += `<div style="margin-bottom:8px">`;
    html += `<div style="font-size:10px;color:#94a3b8;font-weight:600;margin-bottom:4px">3-DAY FORECAST</div>`;
    html += `<div style="display:flex;gap:4px">`;
    forecast.days.forEach((d) => {
      html += `<div style="flex:1;background:#f1f5f9;border-radius:6px;padding:4px;text-align:center">
        <div style="font-size:9px;color:#64748b">${d.day}</div>
        <div style="font-size:16px">${weatherConditionEmoji[d.condition]}</div>
        <div style="font-size:10px;font-weight:600">${d.highC}°/${d.lowC}°</div>
        ${d.precipMm > 0 ? `<div style="font-size:9px;color:#3b82f6">🌧${d.precipMm}mm</div>` : ""}
      </div>`;
    });
    html += `</div></div>`;
  }

  // Historical losses
  if (losses.length > 0) {
    html += `<div style="font-size:10px;color:#94a3b8;font-weight:600;margin-bottom:4px">HISTORICAL WEATHER LOSSES</div>`;
    losses.forEach((l) => {
      html += `<div style="font-size:10px;display:flex;justify-content:space-between;margin-bottom:2px">
        <span style="color:#64748b">${l.event}</span>
        <span style="font-weight:600;color:#ef4444">${formatAED(l.lossAED)}</span>
      </div>`;
    });
  }

  html += `</div>`;
  return html;
}

function buildStandardPopup(prop: Property): string {
  const riskColor = getRiskColor(prop.riskScore);
  const statusColor = getStatusColor(prop.status);
  return `
    <div style="color:#1e293b;min-width:220px;font-family:system-ui">
      <div style="font-weight:700;font-size:14px;margin-bottom:4px">${prop.name}</div>
      <div style="font-size:11px;color:#64748b;margin-bottom:8px">${prop.address}, ${prop.city}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">
        <div style="background:#f1f5f9;border-radius:6px;padding:6px 8px">
          <div style="font-size:10px;color:#94a3b8">Risk Score</div>
          <div style="font-size:16px;font-weight:700;color:${riskColor}">${prop.riskScore}</div>
        </div>
        <div style="background:#f1f5f9;border-radius:6px;padding:6px 8px">
          <div style="font-size:10px;color:#94a3b8">Status</div>
          <div style="font-size:12px;font-weight:600;color:${statusColor};text-transform:capitalize">${prop.status}</div>
        </div>
        <div style="background:#f1f5f9;border-radius:6px;padding:6px 8px">
          <div style="font-size:10px;color:#94a3b8">Sum Insured</div>
          <div style="font-size:12px;font-weight:600">${formatAED(prop.sumInsured)}</div>
        </div>
        <div style="background:#f1f5f9;border-radius:6px;padding:6px 8px">
          <div style="font-size:10px;color:#94a3b8">Type</div>
          <div style="font-size:12px;font-weight:600;text-transform:capitalize">${prop.type}</div>
        </div>
      </div>
      <div style="font-size:10px;color:#94a3b8;margin-bottom:2px">${prop.broker} • ${prop.constructionMaterial} • ${prop.floors}F • Built ${prop.yearBuilt}</div>
      <div style="display:flex;gap:4px;margin-top:6px;flex-wrap:wrap">
        ${prop.floodZone ? '<span style="background:#dbeafe;color:#2563eb;font-size:10px;padding:2px 6px;border-radius:4px">🌊 Flood Zone</span>' : ""}
        ${prop.nearIndustrial ? '<span style="background:#ffedd5;color:#c2410c;font-size:10px;padding:2px 6px;border-radius:4px">⚠️ Industrial</span>' : ""}
        ${prop.nearCoast ? '<span style="background:#e0f2fe;color:#0369a1;font-size:10px;padding:2px 6px;border-radius:4px">🏖 Coastal</span>' : ""}
        ${prop.fireProtection.sprinklers ? '<span style="background:#dcfce7;color:#15803d;font-size:10px;padding:2px 6px;border-radius:4px">✅ Sprinklers</span>' : '<span style="background:#fee2e2;color:#b91c1c;font-size:10px;padding:2px 6px;border-radius:4px">❌ No Sprinklers</span>'}
      </div>
    </div>
  `;
}

function PortfolioRiskMapInner() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Layer[]>([]);
  const overlayLayersRef = useRef<L.Layer[]>([]);
  const LRef = useRef<typeof import("leaflet") | null>(null);
  const [ready, setReady] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("risk");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showLabels, setShowLabels] = useState(true);
  const [showAlertZones, setShowAlertZones] = useState(true);

  const filtered = mockProperties.filter(
    (p) => statusFilter === "all" || p.status === statusFilter
  );

  useEffect(() => {
    import("leaflet").then((mod) => {
      LRef.current = mod;
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current || mapInstanceRef.current || !LRef.current) return;
    const L = LRef.current;
    const map = L.map(mapRef.current, { center: [24.8, 54.9], zoom: 9, zoomControl: true });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: "© OpenStreetMap © CARTO",
    }).addTo(map);
    mapInstanceRef.current = map;
    return () => { map.remove(); mapInstanceRef.current = null; };
  }, [ready]);

  // Weather alert zone overlays
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = LRef.current;
    if (!map || !L) return;

    overlayLayersRef.current.forEach((l) => map.removeLayer(l));
    overlayLayersRef.current = [];

    if (viewMode === "weather" && showAlertZones) {
      weatherAlerts.forEach((alert) => {
        const color = alertSeverityColor[alert.severity];
        const poly = L.polygon(alert.polygon, {
          color,
          fillColor: color,
          fillOpacity: 0.12,
          weight: 2,
          dashArray: alert.severity === "extreme" ? undefined : "6,4",
        }).addTo(map);
        poly.bindPopup(`<div style="color:#1e293b;min-width:200px;font-family:system-ui">
          <div style="font-weight:700;font-size:13px;margin-bottom:4px">${alertTypeEmoji[alert.type]} ${alert.title}</div>
          <span style="display:inline-block;background:${color};color:white;font-size:9px;padding:1px 6px;border-radius:4px;font-weight:700;text-transform:uppercase;margin-bottom:6px">${alert.severity}</span>
          <p style="font-size:11px;color:#64748b;margin:6px 0">${alert.description}</p>
          <div style="font-size:10px;color:#94a3b8">📍 ${alert.area}</div>
          <div style="font-size:10px;color:#94a3b8;margin-top:2px">🕐 ${new Date(alert.startTime).toLocaleString()} — ${new Date(alert.endTime).toLocaleString()}</div>
          <div style="font-size:10px;font-weight:600;margin-top:6px">${alert.affectedPropertyIds.length} properties affected</div>
        </div>`, { maxWidth: 300 });
        overlayLayersRef.current.push(poly);
      });
    }
  }, [viewMode, showAlertZones, ready]);

  // Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = LRef.current;
    if (!map || !L) return;

    markersRef.current.forEach((l) => map.removeLayer(l));
    markersRef.current = [];

    filtered.forEach((prop) => {
      const color = getMarkerColor(prop, viewMode);
      const size = getMarkerSize(prop, viewMode);
      const isWeather = viewMode === "weather";
      const threat = isWeather ? getWeatherThreatLevel(prop.id) : null;
      const weather = isWeather ? currentWeather.find((w) => w.propertyId === prop.id) : null;
      const highPulse = isWeather ? (threat && threat.level >= 70) : (viewMode === "risk" && prop.riskScore >= 70);

      let innerContent = "";
      if (isWeather && weather) {
        innerContent = `<span style="font-size:${size > 30 ? 16 : 14}px">${weatherConditionEmoji[weather.condition]}</span>`;
      } else if (viewMode === "risk") {
        innerContent = `${prop.riskScore}`;
      } else if (viewMode === "sumInsured") {
        innerContent = `${(prop.sumInsured / 1_000_000).toFixed(0)}M`;
      }

      const html = `
        <div style="position:relative;width:${size}px;height:${size}px">
          ${highPulse ? `<div style="position:absolute;inset:-4px;border-radius:50%;background:${color};opacity:0.25;animation:pulse 2s infinite"></div>` : ""}
          <div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.8);display:flex;align-items:center;justify-content:center;font-size:${size > 30 ? 11 : 10}px;font-weight:700;color:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.5);position:relative;z-index:1">
            ${innerContent}
          </div>
        </div>
      `;

      const icon = L.divIcon({
        className: "portfolio-marker",
        html,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([prop.lat, prop.lng], { icon }).addTo(map);
      const popupHtml = isWeather ? buildWeatherPopup(prop) : buildStandardPopup(prop);
      marker.bindPopup(popupHtml, { maxWidth: 340 });

      if (showLabels) {
        const labelIcon = L.divIcon({
          className: "portfolio-label",
          html: `<div style="font-size:10px;font-weight:600;color:#e2e8f0;text-align:center;white-space:nowrap;text-shadow:0 1px 3px rgba(0,0,0,0.8);pointer-events:none">${prop.name.split(" ").slice(0, 2).join(" ")}</div>`,
          iconSize: [100, 16],
          iconAnchor: [50, -size / 2 - 2],
        });
        const label = L.marker([prop.lat, prop.lng], { icon: labelIcon, interactive: false }).addTo(map);
        markersRef.current.push(label);
      }

      markersRef.current.push(marker);
    });

    if (filtered.length > 0) {
      const L2 = LRef.current!;
      const bounds = L2.latLngBounds(filtered.map((p) => [p.lat, p.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }
  }, [filtered, viewMode, showLabels, ready]);

  const handleAlertClick = useCallback((alert: WeatherAlert) => {
    const map = mapInstanceRef.current;
    const L = LRef.current;
    if (!map || !L) return;
    setViewMode("weather");
    const bounds = L.latLngBounds(alert.polygon);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
  }, []);

  // Weather exposure stats
  const weatherStats = viewMode === "weather" ? (() => {
    const severeProps = new Set<string>();
    const warningProps = new Set<string>();
    weatherAlerts.forEach((a) => {
      a.affectedPropertyIds.forEach((id) => {
        if (a.severity === "extreme" || a.severity === "severe") severeProps.add(id);
        else warningProps.add(id);
      });
    });
    const severeExposure = mockProperties.filter((p) => severeProps.has(p.id)).reduce((s, p) => s + p.sumInsured, 0);
    const watchExposure = mockProperties.filter((p) => warningProps.has(p.id) && !severeProps.has(p.id)).reduce((s, p) => s + p.sumInsured, 0);
    return { severeCount: severeProps.size, warningCount: warningProps.size - severeProps.size, severeExposure, watchExposure };
  })() : null;

  return (
    <div>
      {viewMode === "weather" && <WeatherAlertsPanel onAlertClick={handleAlertClick} />}

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-border bg-card">
          <MapPin className="h-4 w-4 text-primary shrink-0" />
          <span className="text-xs font-semibold text-foreground mr-2">Portfolio Risk Map</span>

          <div className="flex gap-1">
            {viewModes.map((vm) => (
              <button
                key={vm.key}
                onClick={() => setViewMode(vm.key)}
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
                  viewMode === vm.key
                    ? vm.key === "weather"
                      ? "bg-blue-600 text-white"
                      : "bg-primary text-primary-foreground"
                    : "bg-accent/50 text-muted-foreground hover:bg-accent"
                }`}
              >
                <vm.icon className="h-3 w-3" />
                <span className="hidden sm:inline">{vm.label}</span>
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-border mx-1" />

          {viewMode !== "weather" && (
            <div className="flex gap-1">
              {(["all", "pending", "approved", "referred", "rejected"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`rounded-md px-2 py-1 text-[10px] font-medium capitalize transition-colors ${
                    statusFilter === s ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {viewMode === "weather" && (
            <button
              onClick={() => setShowAlertZones(!showAlertZones)}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
                showAlertZones ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50"
              }`}
            >
              <AlertTriangle className="h-3 w-3" />
              Alert Zones
            </button>
          )}

          <div className="flex-1" />

          <button
            onClick={() => setShowLabels(!showLabels)}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-muted-foreground hover:bg-accent"
          >
            {showLabels ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            Labels
          </button>
        </div>

        <div ref={mapRef} className="h-[400px] w-full" />

        <div className="flex flex-wrap items-center gap-3 px-3 py-2 border-t border-border text-[10px] text-muted-foreground">
          {viewMode === "risk" && (
            <>
              <LegendDot color="#22c55e" label="Low (<40)" />
              <LegendDot color="#eab308" label="Medium (40-54)" />
              <LegendDot color="#f97316" label="Elevated (55-69)" />
              <LegendDot color="#ef4444" label="High (70+)" />
            </>
          )}
          {viewMode === "status" && (
            <>
              <LegendDot color="#f59e0b" label="Pending" />
              <LegendDot color="#22c55e" label="Approved" />
              <LegendDot color="#f97316" label="Referred" />
              <LegendDot color="#ef4444" label="Rejected" />
            </>
          )}
          {viewMode === "sumInsured" && (
            <>
              <LegendDot color="#22c55e" label="<10M" />
              <LegendDot color="#eab308" label="10-20M" />
              <LegendDot color="#f97316" label="20-40M" />
              <LegendDot color="#ef4444" label="40M+" />
            </>
          )}
          {viewMode === "type" && (
            <>
              <LegendDot color="#8b5cf6" label="Warehouse" />
              <LegendDot color="#3b82f6" label="Office" />
              <LegendDot color="#06b6d4" label="Retail" />
              <LegendDot color="#f97316" label="Industrial" />
              <LegendDot color="#22c55e" label="Residential" />
            </>
          )}
          {viewMode === "weather" && (
            <>
              <LegendDot color="#22c55e" label="Clear" />
              <LegendDot color="#d97706" label="Watch" />
              <LegendDot color="#ea580c" label="Warning" />
              <LegendDot color="#dc2626" label="Severe" />
              <span className="h-3 w-px bg-border mx-1" />
              {weatherStats && (
                <>
                  <span className="text-destructive font-semibold">{weatherStats.severeCount} severe ({formatAED(weatherStats.severeExposure)})</span>
                  <span>•</span>
                  <span className="text-orange-400 font-semibold">{weatherStats.warningCount} watch ({formatAED(weatherStats.watchExposure)})</span>
                </>
              )}
            </>
          )}
          {viewMode !== "weather" && (
            <span className="ml-auto">{filtered.length} properties • {formatAED(filtered.reduce((s, p) => s + p.sumInsured, 0))} TIV</span>
          )}
        </div>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span style={{ background: color }} className="inline-block w-2.5 h-2.5 rounded-full" />
      {label}
    </span>
  );
}

export function PortfolioRiskMap() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);
  if (!isClient) {
    return (
      <div className="rounded-xl border border-border bg-card h-[460px] flex items-center justify-center">
        <span className="text-muted-foreground text-sm">Loading map...</span>
      </div>
    );
  }
  return <PortfolioRiskMapInner />;
}
