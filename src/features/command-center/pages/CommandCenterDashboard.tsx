import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  ArrowRight,
  Building2,
  CloudLightning,
  Flame,
  Zap,
  Activity,
  MapPin,
  X,
  Map,
  Brain,
  FileText,
  Eye,
  EyeOff,
  DollarSign,
} from 'lucide-react';
import { mockProperties, weatherAlerts } from '../data/mock-data';

function RiskRing({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'xl' }) {
  const cfg = {
    sm: { dim: 32, stroke: 3, fs: 'text-[10px]' },
    md: { dim: 40, stroke: 3.5, fs: 'text-xs' },
    xl: { dim: 72, stroke: 5, fs: 'text-lg' },
  }[size];
  const radius = (cfg.dim - cfg.stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - Math.min(score, 100) / 100);
  const color = score >= 70 ? '#ef4444' : score >= 40 ? '#eab308' : '#22c55e';
  return (
    <div className="relative inline-flex" style={{ width: cfg.dim, height: cfg.dim }}>
      <svg width={cfg.dim} height={cfg.dim} viewBox={`0 0 ${cfg.dim} ${cfg.dim}`} className="-rotate-90">
        <circle cx={cfg.dim / 2} cy={cfg.dim / 2} r={radius} fill="none" strokeWidth={cfg.stroke} stroke={color} opacity={0.15} />
        <circle cx={cfg.dim / 2} cy={cfg.dim / 2} r={radius} fill="none" strokeWidth={cfg.stroke} stroke={color} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 0.8s ease-out' }} />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center font-bold ${cfg.fs}`} style={{ color }}>{score}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    approved: 'bg-green-50 text-green-700 border-green-200',
    referred: 'bg-orange-50 text-orange-700 border-orange-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
  };
  const icons: Record<string, React.ReactNode> = {
    pending: <Clock className="h-2.5 w-2.5" />,
    approved: <CheckCircle2 className="h-2.5 w-2.5" />,
    referred: <AlertTriangle className="h-2.5 w-2.5" />,
    rejected: <XCircle className="h-2.5 w-2.5" />,
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${map[status] || map.pending}`}>
      {icons[status]}
      {status}
    </span>
  );
}

function Sparkline({ data, color = '#f59e0b' }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;
  const width = 64;
  const height = 24;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');
  const areaPoints = `0,${height} ${points} ${width},${height}`;
  const gradId = `sg-${color.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="shrink-0">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#${gradId})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle
        cx={width}
        cy={height - ((data[data.length - 1] - min) / range) * (height - 4) - 2}
        r="2"
        fill={color}
      />
    </svg>
  );
}

function KPICard({
  icon: Icon,
  label,
  value,
  colorClass,
  bgClass,
  borderClass,
  trend,
  sparkData,
  sparkColor,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  trend: string;
  sparkData: number[];
  sparkColor: string;
}) {
  return (
    <div className={`rounded-xl border-2 ${borderClass} bg-white p-4 md:p-5 shadow-sm hover:shadow-md transition-all`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${bgClass}`}>
          <Icon className={`h-4 w-4 ${colorClass}`} />
        </div>
        <Sparkline data={sparkData} color={sparkColor} />
      </div>
      <p className={`text-3xl font-extrabold tracking-tight ${colorClass}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1 font-medium">{label}</p>
      <div className="flex items-center gap-1 mt-1.5">
        <TrendingUp className={`h-3 w-3 ${colorClass}`} />
        <p className={`text-[10px] font-semibold ${colorClass}`}>{trend}</p>
      </div>
    </div>
  );
}

type ViewMode = 'risk' | 'status' | 'sumInsured' | 'type';

function getRiskColor(score: number) {
  if (score >= 70) return '#ef4444';
  if (score >= 55) return '#f97316';
  if (score >= 40) return '#eab308';
  return '#22c55e';
}
function getStatusColor(status: string) {
  const m: Record<string, string> = { pending: '#f59e0b', approved: '#22c55e', referred: '#f97316', rejected: '#ef4444' };
  return m[status] || '#94a3b8';
}
function getTypeColor(type: string) {
  const m: Record<string, string> = { warehouse: '#8b5cf6', office: '#3b82f6', retail: '#06b6d4', industrial: '#f97316', residential: '#22c55e' };
  return m[type] || '#94a3b8';
}
function getSIColor(sum: number) {
  if (sum >= 1_000_000_000) return '#ef4444';
  if (sum >= 500_000_000) return '#f97316';
  if (sum >= 100_000_000) return '#eab308';
  return '#22c55e';
}
function formatAED(n: number) {
  if (n >= 1_000_000_000) return `AED ${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(1)}M`;
  return `AED ${n}`;
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1 text-[10px] text-gray-500">
      <span style={{ background: color }} className="inline-block w-2.5 h-2.5 rounded-full shrink-0" />
      {label}
    </span>
  );
}

const VIEW_MODES: { key: ViewMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'risk', label: 'Risk Score', icon: AlertTriangle },
  { key: 'status', label: 'Status', icon: Eye },
  { key: 'sumInsured', label: 'Sum Insured', icon: DollarSign },
  { key: 'type', label: 'Property Type', icon: Building2 },
];

function PortfolioMapInner({ viewMode, showLabels }: { viewMode: ViewMode; showLabels: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const LRef = useRef<any>(null);
  const [ready, setReady] = useState(false);

  // Load Leaflet
  useEffect(() => {
    import('leaflet').then((mod) => { LRef.current = mod; setReady(true); });
  }, []);

  // Init map — wait for container to have real dimensions
  useEffect(() => {
    if (!ready || !mapRef.current || mapInstanceRef.current || !LRef.current) return;

    const L = LRef.current;
    const el = mapRef.current;

    const init = () => {
      if (mapInstanceRef.current) return;
      const map = L.map(el, { center: [24.8, 54.9], zoom: 9, zoomControl: true });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);
      mapInstanceRef.current = map;
      // Give browser one more frame to finish layout, then fix size
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          map.invalidateSize({ animate: false });
        });
      });
    };

    // If container already has size, init immediately; otherwise wait
    if (el.offsetWidth > 0 && el.offsetHeight > 0) {
      init();
    } else {
      const ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
            ro.disconnect();
            init();
            break;
          }
        }
      });
      ro.observe(el);
      return () => ro.disconnect();
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [ready]);

  // Update markers when viewMode / showLabels changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = LRef.current;
    if (!map || !L) return;

    markersRef.current.forEach((l) => map.removeLayer(l));
    markersRef.current = [];

    mockProperties.forEach((prop) => {
      let color = '#94a3b8';
      if (viewMode === 'risk') color = getRiskColor(prop.riskScore);
      else if (viewMode === 'status') color = getStatusColor(prop.status);
      else if (viewMode === 'sumInsured') color = getSIColor(prop.sumInsured);
      else if (viewMode === 'type') color = getTypeColor(prop.type);

      const size = viewMode === 'risk' ? (prop.riskScore >= 70 ? 36 : prop.riskScore >= 40 ? 30 : 24) : 28;
      const inner = viewMode === 'risk' ? `${prop.riskScore}` : '';

      const html = `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.9);display:flex;align-items:center;justify-content:center;font-size:${size > 30 ? 11 : 10}px;font-weight:700;color:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.25)">${inner}</div>`;

      const icon = L.divIcon({ className: 'portfolio-marker', html, iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
      const marker = L.marker([prop.lat, prop.lng], { icon }).addTo(map);

      marker.bindPopup(`<div style="color:#1e293b;min-width:200px;font-family:system-ui">
        <div style="font-weight:700;font-size:13px;margin-bottom:3px">${prop.name}</div>
        <div style="font-size:11px;color:#64748b;margin-bottom:8px">${prop.city} • ${prop.type}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px">
          <div style="background:#f8fafc;border-radius:5px;padding:5px 7px;border:1px solid #e2e8f0">
            <div style="font-size:9px;color:#94a3b8">Risk Score</div>
            <div style="font-size:15px;font-weight:700;color:${getRiskColor(prop.riskScore)}">${prop.riskScore}</div>
          </div>
          <div style="background:#f8fafc;border-radius:5px;padding:5px 7px;border:1px solid #e2e8f0">
            <div style="font-size:9px;color:#94a3b8">Status</div>
            <div style="font-size:11px;font-weight:600;color:${getStatusColor(prop.status)};text-transform:capitalize">${prop.status}</div>
          </div>
          <div style="background:#f8fafc;border-radius:5px;padding:5px 7px;border:1px solid #e2e8f0;grid-column:span 2">
            <div style="font-size:9px;color:#94a3b8">Sum Insured</div>
            <div style="font-size:12px;font-weight:600">${formatAED(prop.sumInsured)}</div>
          </div>
        </div>
        <div style="font-size:10px;color:#94a3b8;margin-top:6px">${prop.broker}</div>
      </div>`, { maxWidth: 260 });

      if (showLabels) {
        const labelIcon = L.divIcon({
          className: 'portfolio-label',
          html: `<div style="font-size:10px;font-weight:600;color:#1e293b;text-align:center;white-space:nowrap;text-shadow:0 1px 2px rgba(255,255,255,0.8);pointer-events:none">${prop.name.split(' ').slice(0, 2).join(' ')}</div>`,
          iconSize: [100, 16],
          iconAnchor: [50, -size / 2 - 2],
        });
        const label = L.marker([prop.lat, prop.lng], { icon: labelIcon, interactive: false }).addTo(map);
        markersRef.current.push(label);
      }

      markersRef.current.push(marker);
    });

    const bounds = L.latLngBounds(mockProperties.map((p: any) => [p.lat, p.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
  }, [viewMode, showLabels, ready]);

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <div
        ref={mapRef}
        style={{ height: '380px', width: '100%' }}
      />
    </div>
  );
}

function PortfolioRiskMap() {
  const [isClient, setIsClient] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('risk');
  const [showLabels, setShowLabels] = useState(true);

  useEffect(() => setIsClient(true), []);

  const totalTIV = mockProperties.reduce((s, p) => s + p.sumInsured, 0);

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 border-b border-gray-200 bg-gray-50 rounded-t-xl">
        <MapPin className="h-4 w-4 text-primary shrink-0" />
        <span className="text-xs font-semibold text-gray-800 mr-1">Portfolio Risk Map</span>

        <div className="flex gap-1">
          {VIEW_MODES.map((vm) => (
            <button
              key={vm.key}
              onClick={() => setViewMode(vm.key)}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${viewMode === vm.key ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              <vm.icon className="h-3 w-3" />
              <span className="hidden sm:inline">{vm.label}</span>
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <button
          onClick={() => setShowLabels(!showLabels)}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-gray-500 hover:bg-gray-100 transition-colors"
        >
          {showLabels ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          Labels
        </button>
      </div>

      {/* Map Container - Map Hidden for Now */}
      <div style={{ height: '380px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', border: '1px dashed #d1d5db', borderRadius: '8px' }}>
        <div className="text-center">
          <MapPin className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <span className="text-gray-400 text-sm block">Map temporarily disabled</span>
          <span className="text-gray-300 text-xs">Portfolio visualization will be restored soon</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 px-3 py-2 border-t border-gray-200 bg-gray-50 rounded-b-xl">
        {viewMode === 'risk' && (
          <>
            <LegendDot color="#22c55e" label="Low (<40)" />
            <LegendDot color="#eab308" label="Medium (40-54)" />
            <LegendDot color="#f97316" label="Elevated (55-69)" />
            <LegendDot color="#ef4444" label="High (70+)" />
          </>
        )}
        {viewMode === 'status' && (
          <>
            <LegendDot color="#f59e0b" label="Pending" />
            <LegendDot color="#22c55e" label="Approved" />
            <LegendDot color="#f97316" label="Referred" />
            <LegendDot color="#ef4444" label="Rejected" />
          </>
        )}
        {viewMode === 'sumInsured' && (
          <>
            <LegendDot color="#22c55e" label="<100M" />
            <LegendDot color="#eab308" label="100-500M" />
            <LegendDot color="#f97316" label="500M-1B" />
            <LegendDot color="#ef4444" label="1B+" />
          </>
        )}
        {viewMode === 'type' && (
          <>
            <LegendDot color="#8b5cf6" label="Warehouse" />
            <LegendDot color="#3b82f6" label="Office" />
            <LegendDot color="#06b6d4" label="Retail" />
            <LegendDot color="#f97316" label="Industrial" />
            <LegendDot color="#22c55e" label="Residential" />
          </>
        )}
        <span className="ml-auto text-[10px] text-gray-500">{mockProperties.length} properties • {formatAED(totalTIV)} TIV</span>
      </div>
    </div>
  );
}

export default function CommandCenterDashboard({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const navigate = useNavigate();
  const goTo = (tab: string) => onNavigate ? onNavigate(tab) : navigate(tab);
  const [alertDismissed, setAlertDismissed] = useState(false);

  const pending = mockProperties.filter((p) => p.status === 'pending');
  const approved = mockProperties.filter((p) => p.status === 'approved');
  const referred = mockProperties.filter((p) => p.status === 'referred');
  const rejected = mockProperties.filter((p) => p.status === 'rejected');

  const totalInsured = mockProperties.reduce((sum, p) => sum + p.sumInsured, 0);
  const avgRisk = Math.round(mockProperties.reduce((sum, p) => sum + p.riskScore, 0) / mockProperties.length);
  const highRiskCount = mockProperties.filter((p) => p.riskScore >= 70).length;

  const urgentItems = mockProperties.filter(
    (p) => (p.riskScore >= 70 && p.status === 'pending') || p.status === 'referred',
  );

  const activeAlerts = weatherAlerts.filter((a) => a.severity === 'extreme' || a.severity === 'severe');

  return (
    <div className="p-5 md:p-8 space-y-7 max-w-[1440px] mx-auto bg-gray-50 min-h-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
            Underwriting Immersive Risk Assessment
          </h1>
          <p className="text-sm text-gray-500 mt-1.5">
            Good morning, Sarah — you have{' '}
            <span className="text-primary font-semibold">{urgentItems.length} items</span>{' '}
            requiring attention
          </p>
        </div>
        <button
          onClick={() => goTo('submissions')}
          className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-all shadow-md"
        >
          All Submissions <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Weather Alert Banner */}
      {activeAlerts.length > 0 && !alertDismissed && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 shrink-0">
            <CloudLightning className="h-5 w-5 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-900">Active Weather Alerts</p>
            <p className="text-xs text-red-700 mt-0.5 line-clamp-2">
              {activeAlerts.map((a) => `${a.type} — ${a.area}`).join(' • ')}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-bold text-red-700 bg-red-100 rounded-full px-3 py-1">
              {activeAlerts.length} Active
            </span>
            <button
              onClick={() => setAlertDismissed(true)}
              className="p-1 rounded-lg hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <KPICard icon={Clock} label="Pending Review" value={pending.length} colorClass="text-amber-600" bgClass="bg-amber-50" borderClass="border-amber-200" trend="+2 this week" sparkData={[1, 2, 1, 3, 2, 4]} sparkColor="#d97706" />
        <KPICard icon={CheckCircle2} label="Approved" value={approved.length} colorClass="text-green-600" bgClass="bg-green-50" borderClass="border-green-200" trend="On track" sparkData={[1, 2, 2, 3, 3, 3]} sparkColor="#16a34a" />
        <KPICard icon={AlertTriangle} label="Referred" value={referred.length} colorClass="text-orange-600" bgClass="bg-orange-50" borderClass="border-orange-200" trend="Needs attention" sparkData={[1, 1, 2, 1, 2, 2]} sparkColor="#ea580c" />
        <KPICard icon={XCircle} label="Declined" value={rejected.length} colorClass="text-red-600" bgClass="bg-red-50" borderClass="border-red-200" trend="Within ratio" sparkData={[1, 0, 1, 0, 0, 0]} sparkColor="#dc2626" />
      </div>

      {/* Portfolio Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xs text-gray-500 font-medium">Total Sum Insured</span>
          </div>
          <p className="text-3xl font-extrabold text-gray-900 tracking-tight">
            AED {(totalInsured / 1_000_000_000).toFixed(1)}B
          </p>
          <p className="text-[11px] text-gray-400 mt-1">{mockProperties.length} properties in portfolio</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xs text-gray-500 font-medium">Average Risk Score</span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-extrabold text-gray-900">{avgRisk}</p>
              <p className="text-[11px] text-gray-400 mt-1">Portfolio weighted average</p>
            </div>
            <RiskRing score={avgRisk} size="xl" />
          </div>
        </div>

        <div className={`rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-all ${highRiskCount > 0 ? 'border-red-200' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${highRiskCount > 0 ? 'bg-red-50' : 'bg-primary/10'}`}>
              <Flame className={`h-5 w-5 ${highRiskCount > 0 ? 'text-red-500' : 'text-primary'}`} />
            </div>
            <span className="text-xs text-gray-500 font-medium">High Risk Properties</span>
          </div>
          <p className="text-3xl font-extrabold text-gray-900">{highRiskCount}</p>
          <p className="text-[11px] text-gray-400 mt-1">Score ≥ 70 — require scrutiny</p>
        </div>
      </div>

      {/* Priority Queue */}
      {urgentItems.length > 0 && (
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100">
              <Zap className="h-3.5 w-3.5 text-amber-600" />
            </div>
            <h2 className="text-base font-bold text-gray-900">Priority Queue</h2>
            <span className="text-[10px] bg-amber-100 text-amber-700 rounded-full px-2.5 py-0.5 font-semibold">
              {urgentItems.length} items
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {urgentItems.slice(0, 3).map((prop) => (
              <div
                key={prop.id}
                className="group rounded-xl border border-gray-200 bg-white p-4 hover:shadow-md hover:border-primary/40 transition-all cursor-pointer"
                onClick={() => goTo('submissions')}
              >
                <div className="flex items-start gap-3">
                  <RiskRing score={prop.riskScore} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-primary transition-colors">
                      {prop.name}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1">
                      <MapPin className="h-2.5 w-2.5" />
                      {prop.broker} • {prop.city}
                    </p>
                    <div className="flex items-center gap-2 mt-2.5">
                      <StatusBadge status={prop.status} />
                      <span className="text-[10px] text-gray-400 font-medium">
                        AED {(prop.sumInsured / 1_000_000).toFixed(1)}M
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-all shrink-0 mt-1" />
                </div>
                {prop.riskScore >= 70 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-[11px] text-red-600 font-medium flex items-center gap-1.5">
                      <AlertTriangle className="h-3 w-3" />
                      High risk — {prop.aiInsights.filter((i) => i.severity === 'high').length} critical findings
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Portfolio Risk Map */}
      <PortfolioRiskMap />

      {/* Quick Nav */}
      <div>
        <h2 className="text-base font-bold text-gray-900 mb-4">Quick Navigation</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Submissions', desc: 'View all property submissions', icon: FileText, path: 'submissions' },
            { label: 'Risk Map', desc: 'Geographic portfolio overview', icon: Map, path: 'risk-map' },
            { label: 'AI Compare', desc: 'Benchmark AI models', icon: Brain, path: 'ai-compare' },
          ].map((item) => (
            <button
              key={item.path}
              onClick={() => goTo(item.path)}
              className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 hover:shadow-md hover:border-primary/40 transition-all text-left"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors">{item.label}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{item.desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-all" />
            </button>
          ))}
        </div>
      </div>

      {/* Recent Submissions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900">Recent Submissions</h2>
          <button
            onClick={() => goTo('submissions')}
            className="text-xs text-primary hover:text-primary/80 font-semibold transition-colors flex items-center gap-1"
          >
            View all <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          {mockProperties.slice(0, 5).map((prop, idx) => (
            <div
              key={prop.id}
              className={`flex items-center gap-4 p-4 transition-all group cursor-pointer hover:bg-gray-50 ${idx < 4 ? 'border-b border-gray-100' : ''}`}
              onClick={() => goTo('submissions')}
            >
              <RiskRing score={prop.riskScore} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-primary transition-colors">
                  {prop.name}
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {prop.broker} • {prop.city} • AED {(prop.sumInsured / 1_000_000).toFixed(1)}M
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <StatusBadge status={prop.status} />
                <span className="text-[10px] text-gray-400 hidden md:inline font-medium">{prop.submissionDate}</span>
                <ArrowRight className="h-4 w-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-all" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
