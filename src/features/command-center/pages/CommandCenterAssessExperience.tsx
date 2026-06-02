import React, { useEffect, useMemo, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';

import {
  AlertCircle,
  AlertTriangle,
  Brain,
  Building2,
  Calculator,
  Calendar,
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSun,
  DollarSign,
  FileSearch,
  Flame,
  Globe2,
  History,
  Layers,
  Download,
  FileText,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Sun,
  Telescope,
  TrendingUp,
  Wind,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/shared/utils/lib-utils';

import { useCommandCenterProperty } from '../context/CommandCenterContext';
import { StreetViewPanorama } from '../components/StreetViewPanorama';
import { SampleBuildingStructure3D } from '../components/SampleBuildingStructure3D';
import { mockProperties, type AIInsight, type Document, type Property } from '../data/mock-data';

export type AssessMainTabId = 'risk-map' | 'weather' | 'explorer' | 'street' | 'natcat';

export type AssessPanelView =
  | AssessMainTabId
  | 'loss-history'
  | 'survey'
  | 'burning-cost'
  | 'ai-insights'
  | 'risk-score';

export const ASSESS_TOOLS: {
  id: AssessMainTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'risk-map', label: 'Risk map', icon: MapPin },
  { id: 'weather', label: 'Weather trends', icon: CloudSun },
  { id: 'explorer', label: '3D Explorer', icon: Building2 },
  { id: 'street', label: 'Street view', icon: Telescope },
  { id: 'natcat', label: 'NatCat model', icon: Globe2 },
];

function formatAED(n: number) {
  if (n >= 1_000_000_000) return `AED ${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(1)}M`;
  return `AED ${n.toLocaleString()}`;
}

function getRiskColor(score: number) {
  if (score >= 70) return 'text-red-600';
  if (score >= 55) return 'text-orange-600';
  if (score >= 40) return 'text-amber-600';
  return 'text-emerald-600';
}

function getRiskBarBg(score: number) {
  if (score >= 70) return 'bg-red-500';
  if (score >= 55) return 'bg-orange-500';
  if (score >= 40) return 'bg-amber-400';
  return 'bg-emerald-500';
}

/** Composite score box: background keyed to severity; score shown in white. */
function compositeScoreBoxClasses(score: number) {
  if (score >= 70) {
    return 'border-red-400/50 bg-gradient-to-br from-red-600 to-red-800 shadow-lg shadow-red-950/35';
  }
  if (score >= 55) {
    return 'border-orange-400/50 bg-gradient-to-br from-orange-600 to-orange-800 shadow-lg shadow-orange-950/30';
  }
  if (score >= 40) {
    return 'border-amber-400/45 bg-gradient-to-br from-amber-500 to-amber-700 shadow-lg shadow-amber-950/25';
  }
  return 'border-emerald-400/45 bg-gradient-to-br from-emerald-600 to-emerald-800 shadow-lg shadow-emerald-950/28';
}

/** Mock 5-year site weather — demo synthesis */
export type WeatherYearRow = {
  year: string;
  rainfallMm: number;
  maxWindMs: number;
  maxWindKmh: number;
  heatDaysOver42: number;
  peakTempC: number;
  cloudCeilingPct: number;
  stormIndex: number;
  fogHoursProxy: number;
};

export type WeatherTrendMetricId = 'heat' | 'cloud' | 'rain' | 'storm' | 'wind' | 'fog';

function weatherSeriesForProperty(property: Property): WeatherYearRow[] {
  const baseYear = 2022;
  return Array.from({ length: 5 }, (_, i) => {
    const year = baseYear + i;
    const coastal = property.nearCoast ? 1.15 : 1;
    const industrial = property.nearIndustrial ? 1.08 : 1;
    const rainfallMm = Math.round((42 + i * 3 + property.riskScore * 0.08) * coastal * industrial);
    const maxWindMs = Number((18 + i * 0.4 + (property.floodZone ? 2 : 0)).toFixed(1));
    const maxWindKmh = Math.round(maxWindMs * 3.6 * 10) / 10;
    const heatDaysOver42 = Math.round(12 + i + (property.type === 'industrial' ? 4 : 0));
    const peakTempC = Number(
      (
        40.1 +
        i * 0.42 +
        (property.type === 'industrial' ? 0.85 : 0) +
        (property.nearCoast ? 0.25 : 0) +
        property.riskScore * 0.02
      ).toFixed(1),
    );
    const cloudCeilingPct = Math.min(
      100,
      Math.round(24 + i * 4 + property.riskScore * 0.14 + (property.nearCoast ? 8 : -6)),
    );
    const stormIndex = Math.min(
      100,
      Math.round(16 + i * 5 + rainfallMm * 0.22 + maxWindMs * 1.1 + (property.nearCoast ? 10 : 0)),
    );
    const fogHoursProxy = Math.min(
      100,
      Math.round(12 + i * 3 + (property.nearIndustrial ? 22 : 8) + maxWindMs * 0.2),
    );
    return {
      year: String(year),
      rainfallMm,
      maxWindMs,
      maxWindKmh,
      heatDaysOver42,
      peakTempC,
      cloudCeilingPct,
      stormIndex,
      fogHoursProxy,
    };
  });
}

/** Stroke / fill RGB for trend chart — aligned to hazard tile palette */
const WEATHER_TREND_THEME: Record<
  WeatherTrendMetricId,
  {
    label: string;
    dataKey: keyof WeatherYearRow;
    seriesName: string;
    stroke: string;
    fill: string;
    /** Rotated Y-axis title */
    yAxisLabel: string;
    /** Appended to numeric tick values (e.g. °C, km/h) */
    valueSuffix: string;
    tickDecimals: number;
  }
> = {
  heat: {
    label: 'Sun & heat',
    dataKey: 'peakTempC',
    seriesName: 'Peak temperature',
    stroke: 'rgb(217, 119, 6)',
    fill: 'rgb(245, 158, 11)',
    yAxisLabel: 'Peak temperature (°C)',
    valueSuffix: '°C',
    tickDecimals: 1,
  },
  cloud: {
    label: 'Cloud ceiling',
    dataKey: 'cloudCeilingPct',
    seriesName: 'Ceiling stress',
    stroke: 'rgb(71, 85, 105)',
    fill: 'rgb(148, 163, 184)',
    yAxisLabel: 'Ceiling stress (%)',
    valueSuffix: '%',
    tickDecimals: 0,
  },
  rain: {
    label: 'Rain & accumulation',
    dataKey: 'rainfallMm',
    seriesName: 'Rainfall',
    stroke: 'rgb(2, 132, 199)',
    fill: 'rgb(56, 189, 248)',
    yAxisLabel: 'Annual rainfall (mm)',
    valueSuffix: 'mm',
    tickDecimals: 0,
  },
  storm: {
    label: 'Storm & lightning',
    dataKey: 'stormIndex',
    seriesName: 'Storm index',
    stroke: 'rgb(124, 58, 237)',
    fill: 'rgb(167, 139, 250)',
    yAxisLabel: 'Storm & lightning index',
    valueSuffix: '',
    tickDecimals: 0,
  },
  wind: {
    label: 'Wind & gust',
    dataKey: 'maxWindKmh',
    seriesName: 'Design gust',
    stroke: 'rgb(8, 145, 178)',
    fill: 'rgb(34, 211, 238)',
    yAxisLabel: 'Peak gust (km/h)',
    valueSuffix: 'km/h',
    tickDecimals: 1,
  },
  fog: {
    label: 'Fog / low vis',
    dataKey: 'fogHoursProxy',
    seriesName: 'Low visibility',
    stroke: 'rgb(87, 83, 78)',
    fill: 'rgb(168, 162, 158)',
    yAxisLabel: 'Low visibility proxy (h)',
    valueSuffix: 'h',
    tickDecimals: 0,
  },
};

function formatWeatherTrendValue(value: number, suffix: string, decimals: number) {
  const n = Number(value);
  const formatted = n.toLocaleString(undefined, {
    maximumFractionDigits: decimals,
    ...(decimals > 0 ? { minimumFractionDigits: 0 } : {}),
  });
  if (!suffix) return formatted;
  if (suffix === '°C') return `${formatted} °C`;
  return `${formatted} ${suffix}`;
}

function spcLimits(values: number[], sigma = 3) {
  const n = values.length;
  if (n === 0) return { mean: 0, ucl: 1, lcl: 0 };
  const mean = values.reduce((a, b) => a + b, 0) / n;
  if (n === 1) {
    const pad = Math.max(Math.abs(mean) * 0.08, 1);
    return { mean, ucl: mean + pad, lcl: mean - pad };
  }
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1);
  const stdev = Math.sqrt(variance);
  if (stdev === 0) {
    const pad = Math.max(Math.abs(mean) * 0.06, 0.5);
    return { mean, ucl: mean + pad, lcl: mean - pad };
  }
  return { mean, ucl: mean + sigma * stdev, lcl: mean - sigma * stdev };
}

function WeatherTrendDiamondDot({
  cx,
  cy,
  fill,
}: {
  cx?: number;
  cy?: number;
  fill: string;
}) {
  if (cx == null || cy == null) return null;
  const s = 5.5;
  return (
    <path
      d={`M${cx},${cy - s} L${cx + s},${cy} L${cx},${cy + s} L${cx - s},${cy} Z`}
      fill={fill}
      stroke="#171717"
      strokeWidth={0.9}
    />
  );
}

const LOSS_HISTORY_BURNING_COST = [
  { year: '2022', value: 0.8 },
  { year: '2023', value: 0.57 },
  { year: '2024', value: 1.6 },
  { year: '2025', value: 0 },
  { year: '2026', value: 0 },
] as const;

const BURNING_COST_SUMMARY = {
  currentPerMille: 0.61,
  avg5yPerMille: 0.61,
  baseRatePerMille: 0.35,
} as const;

const LOSS_HISTORY_CLAIMS: {
  date: string;
  peril: string;
  perilVariant: 'water' | 'fire' | 'wind';
  description: string;
  grossPaid: string;
  netPaid: string;
  reserves: string;
  status: string;
  reservesEmphasis?: boolean;
}[] = [
  {
    date: '2024-06-15',
    peril: 'Water Damage',
    perilVariant: 'water',
    description: 'Burst pipe on 42nd floor — major flood damage to plant rooms and two retail units.',
    grossPaid: 'AED 2.4M',
    netPaid: 'AED 1.8M',
    reserves: '—',
    status: 'closed',
  },
  {
    date: '2023-01-08',
    peril: 'Fire',
    perilVariant: 'fire',
    description: 'Electrical panel fire in parking level B2 — smoke infiltration, localized extinguish.',
    grossPaid: 'AED 850K',
    netPaid: 'AED 650K',
    reserves: '—',
    status: 'closed',
  },
  {
    date: '2022-11-20',
    peril: 'Windstorm',
    perilVariant: 'wind',
    description: 'Window panel dislodged during storm; podium-level reinstatement and temporary screen.',
    grossPaid: 'AED 1.2M',
    netPaid: 'AED 900K',
    reserves: 'AED 150K',
    status: 'closed',
    reservesEmphasis: true,
  },
];

function burningCostBarColor(value: number) {
  if (value === 0) return '#14b8a6';
  if (value >= 1.2) return '#ef4444';
  return '#ca8a04';
}

function perilPillClass(variant: 'water' | 'fire' | 'wind', immersive = false) {
  if (immersive) {
    if (variant === 'water') return 'border-sky-500/35 bg-sky-500/15 text-sky-200';
    if (variant === 'fire') return 'border-red-500/35 bg-red-500/15 text-red-200';
    return 'border-violet-500/35 bg-violet-500/15 text-violet-200';
  }
  if (variant === 'water') return 'border-sky-200 bg-sky-50 text-sky-900';
  if (variant === 'fire') return 'border-red-200 bg-red-50 text-red-900';
  return 'border-violet-200 bg-violet-50 text-violet-900';
}

function immersiveStatCard(immersive: boolean) {
  return immersive
    ? 'rounded-xl border border-white/10 bg-white/5 px-4 py-4 transition-colors hover:border-white/20 hover:bg-white/[0.07]'
    : 'rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition-colors hover:border-slate-300';
}

function factorBreakdown(property: Property) {
  const base = property.riskScore;
  return [
    { id: 'structural', label: 'Structural & MEP', score: Math.min(100, base + (property.floors > 50 ? 8 : 0)) },
    { id: 'fire', label: 'Fire & life safety', score: Math.min(100, base - 4 + (property.nearIndustrial ? 12 : 0)) },
    { id: 'natcat', label: 'NatCat & climate', score: Math.min(100, base + (property.nearCoast ? 10 : -2)) },
    { id: 'bi', label: 'Business interruption', score: Math.min(100, base + 5) },
    { id: 'security', label: 'Security & access', score: Math.min(100, base - 8) },
  ];
}

function AssessStreetView({ property, immersive = false }: { property: Property; immersive?: boolean }) {
  return (
    <div className="flex h-full min-h-[520px] flex-col gap-4">
      <div
        className={cn(
          'flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3',
          immersive ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50',
        )}
      >
        <div className={cn('flex items-center gap-2 text-xs', immersive ? 'text-slate-400' : 'text-foreground')}>
          <Telescope className={cn('h-4 w-4', immersive ? 'text-sky-400' : 'text-sky-600')} />
          <span>
            Ground-truth façade at risk coordinates — outdoor Street View panorama with pan &amp; look-around.
          </span>
        </div>
        <span
          className={cn(
            'rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wider',
            immersive
              ? 'border-sky-500/35 bg-sky-500/15 text-sky-200'
              : 'border-sky-200 bg-sky-50 text-sky-800',
          )}
        >
          Google Street View
        </span>
      </div>
      <StreetViewPanorama
        lat={property.lat}
        lng={property.lng}
        propertyId={property.id}
        immersive={immersive}
        minHeight={480}
        className="flex-1 shadow-[inset_0_0_80px_rgba(14,165,233,0.06)]"
      />
    </div>
  );
}

function getRiskHeatColor(score: number) {
  if (score >= 70) return 'rgba(239,68,68,0.35)';
  if (score >= 55) return 'rgba(249,115,22,0.32)';
  if (score >= 40) return 'rgba(234,179,8,0.28)';
  return 'rgba(34,197,94,0.28)';
}

type AssessRiskMapMetric = 'riskScore' | 'sumInsured';

function formatSumInsuredMapLabel(sumInsured: number): string {
  const m = sumInsured / 1_000_000;
  if (m >= 10) return `${Math.round(m)}M`;
  return `${m.toFixed(1)}M`;
}

function AssessRiskMap({ property, immersive = false }: { property: Property; immersive?: boolean }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layersRef = useRef<any[]>([]);
  const LRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [mapMetric, setMapMetric] = useState<AssessRiskMapMetric>('riskScore');

  const maxMockSumInsured = useMemo(
    () => Math.max(...mockProperties.map((p) => p.sumInsured), 1),
    [],
  );

  useEffect(() => {
    import('leaflet').then((mod) => {
      LRef.current = mod;
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current || !LRef.current) return;
    const L = LRef.current;
    const el = mapRef.current;

    const init = () => {
      if (mapInstanceRef.current) return;
      const map = L.map(el, {
        center: [property.lat, property.lng],
        zoom: 12,
        zoomControl: true,
        attributionControl: true,
      });
      L.tileLayer(
        immersive
          ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
          : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20,
      }).addTo(map);
      mapInstanceRef.current = map;
      requestAnimationFrame(() => requestAnimationFrame(() => map.invalidateSize({ animate: false })));
    };

    if (el.offsetWidth > 0 && el.offsetHeight > 0) init();
    else {
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
  }, [ready, property.lat, property.lng, immersive]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = LRef.current;
    if (!map || !L) return;

    layersRef.current.forEach((l) => map.removeLayer(l));
    layersRef.current = [];

    const heatBase =
      mapMetric === 'riskScore'
        ? property.riskScore
        : Math.min(100, (property.sumInsured / maxMockSumInsured) * 100);

    const heatRadii = [900, 650, 400];
    heatRadii.forEach((r, idx) => {
      const circle = L.circle([property.lat, property.lng], {
        radius: r,
        color: 'transparent',
        fillColor: getRiskHeatColor(heatBase + idx * 4),
        fillOpacity: 0.45 - idx * 0.12,
        weight: 0,
      }).addTo(map);
      layersRef.current.push(circle);
    });

    mockProperties.forEach((p) => {
      const isFocus = p.id === property.id;
      const color = isFocus ? '#38bdf8' : '#52525b';
      const label =
        mapMetric === 'riskScore' ? String(p.riskScore) : formatSumInsuredMapLabel(p.sumInsured);
      const fontPx = isFocus ? 10 : 9;
      const h = isFocus ? 26 : 22;
      const padX = 7;
      const minW = isFocus ? 28 : 24;
      const w = Math.max(minW, Math.round(label.length * fontPx * 0.58 + padX * 2));
      const shadow = isFocus ? '0 0 14px rgba(56,189,248,0.85)' : '0 2px 8px rgba(0,0,0,0.35)';
      const html = `<div style="width:${w}px;height:${h}px;border-radius:999px;background:${color};border:2px solid rgba(255,255,255,0.9);box-shadow:${shadow};display:flex;align-items:center;justify-content:center;font-size:${fontPx}px;font-weight:700;color:#fff;white-space:nowrap;padding:0 ${padX}px">${label}</div>`;
      const icon = L.divIcon({
        className: 'cc-risk-marker',
        html,
        iconSize: [w, h],
        iconAnchor: [w / 2, h / 2],
      });
      const m = L.marker([p.lat, p.lng], { icon }).addTo(map);
      layersRef.current.push(m);
    });

    map.flyTo([property.lat, property.lng], 12, { duration: 0.6 });
  }, [property, ready, mapMetric, maxMockSumInsured]);

  const locationRisks = [
    { label: 'Flood / pluvial', level: property.floodZone ? 'Elevated' : 'Low', detail: property.floodZone ? 'Hydrology models flag ponding near hardscape.' : 'Terrain drainage favourable at footprint.' },
    { label: 'Wind & convective', level: property.nearCoast ? 'Moderate+' : 'Moderate', detail: property.nearCoast ? 'Coastal exposure — higher gust design load.' : 'Interior desert wind regime — primary peril dust/ haboob stress on MEP.' },
    { label: 'Surround hazard', level: property.nearIndustrial ? 'Elevated' : 'Controlled', detail: property.nearIndustrial ? 'Industrial adjacency — HAZMAT and exposure concentration.' : 'CBD / typology-typical surround density.' },
  ];

  return (
    <div className="grid h-full min-h-[520px] gap-4 lg:grid-cols-[1fr_320px]">
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl border',
          immersive ? 'border-white/10 bg-[#0a101c]' : 'border-slate-200 bg-white',
        )}
      >
        <div ref={mapRef} className="h-full min-h-[480px] w-full" />
        <div className="pointer-events-auto absolute left-1/2 top-3 z-[500] flex -translate-x-1/2 gap-2">
          <button
            type="button"
            onClick={() => setMapMetric('riskScore')}
            className={cn(
              'rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide shadow-sm transition-colors',
              mapMetric === 'riskScore'
                ? 'border-sky-400 bg-sky-500 text-white'
                : immersive
                  ? 'border-white/15 bg-slate-900/90 text-slate-300 hover:border-white/25'
                  : 'border-slate-200 bg-white/95 text-foreground hover:border-slate-300',
            )}
          >
            Risk score
          </button>
          <button
            type="button"
            onClick={() => setMapMetric('sumInsured')}
            className={cn(
              'rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide shadow-sm transition-colors',
              mapMetric === 'sumInsured'
                ? 'border-sky-400 bg-sky-500 text-white'
                : immersive
                  ? 'border-white/15 bg-slate-900/90 text-slate-300 hover:border-white/25'
                  : 'border-slate-200 bg-white/95 text-foreground hover:border-slate-300',
            )}
            title="Sum insured in AED millions (M)"
          >
            Sum insured (M)
          </button>
        </div>
        <div
          className={cn(
            'pointer-events-none absolute left-3 top-14 rounded-lg border px-3 py-2 backdrop-blur-sm sm:top-3 sm:left-3',
            immersive ? 'border-white/10 bg-slate-900/90' : 'border-slate-200 bg-white/95',
          )}
        >
          <p className={cn('text-[10px] font-semibold uppercase tracking-widest', immersive ? 'text-slate-400' : 'text-foreground')}>
            Location risk lens
          </p>
          <p className={cn('text-sm font-bold', immersive ? 'text-white' : 'text-foreground')}>{property.name}</p>
        </div>
      </div>
      <div
        className={cn(
          'flex flex-col gap-3 rounded-2xl border p-4',
          immersive ? 'border-white/10 bg-[#0a101c]/70' : 'border-slate-200 bg-slate-50',
        )}
      >
        <h3 className={cn('text-xs font-semibold uppercase tracking-wider', immersive ? 'text-slate-400' : 'text-foreground')}>
          Perils at this location
        </h3>
        <ul className="space-y-3">
          {locationRisks.map((row) => (
            <li
              key={row.label}
              className={cn(
                'rounded-xl border p-3',
                immersive ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={cn('text-sm font-medium', immersive ? 'text-slate-200' : 'text-foreground')}>{row.label}</span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                    row.level.includes('Elevated')
                      ? immersive
                        ? 'bg-orange-500/20 text-orange-300'
                        : 'bg-orange-100 text-orange-900'
                      : row.level.includes('Moderate+')
                        ? immersive
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-amber-100 text-amber-900'
                        : immersive
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-emerald-100 text-emerald-900',
                  )}
                >
                  {row.level}
                </span>
              </div>
              <p className={cn('mt-1.5 text-[11px] leading-relaxed', immersive ? 'text-slate-400' : 'text-foreground')}>
                {row.detail}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Assess3DExplorer({ property, immersive = false }: { property: Property; immersive?: boolean }) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border',
        immersive ? 'border-white/10' : 'border-slate-200',
      )}
    >
      <SampleBuildingStructure3D property={property} immersive={immersive} />
    </div>
  );
}

function weatherPerilCards(property: Property, latest: WeatherYearRow) {
  const coastal = property.nearCoast;
  const industrial = property.nearIndustrial;
  const heatRisk = Math.min(
    100,
    Math.round(18 + latest.heatDaysOver42 * 2.2 + (property.type === 'industrial' ? 14 : 0)),
  );
  const rainRisk = Math.min(
    100,
    Math.round(12 + latest.rainfallMm * 0.32 + (property.floodZone ? 28 : 0)),
  );
  const windRisk = Math.min(
    100,
    Math.round(16 + latest.maxWindMs * 2.6 + (coastal ? 14 : 0)),
  );
  const stormRisk = Math.min(
    100,
    Math.round(20 + rainRisk * 0.28 + windRisk * 0.22 + (coastal ? 12 : industrial ? 8 : 0)),
  );
  const cloudCoverRisk = Math.min(100, Math.round(22 + property.riskScore * 0.18 + (rainRisk * 0.15)));
  const visibilityRisk = Math.min(
    100,
    Math.round(14 + (industrial ? 22 : 10) + (property.type === 'warehouse' ? 12 : 0) + windRisk * 0.12),
  );

  return [
    {
      id: 'heat',
      title: 'Sun & heat',
      metric: `${latest.heatDaysOver42} days above 42°C (yr)`,
      blurb: 'UV, façade thermal load, MEP peak demand',
      risk: heatRisk,
      icon: Sun,
      iconWrap: 'bg-amber-100 text-amber-600 ring-amber-200/60',
      cardTint: 'from-amber-50/90 via-white to-orange-50/40',
      iconMotion: 'motion-safe:animate-weather-float motion-safe:[animation-duration:2.6s]',
    },
    {
      id: 'cloud',
      title: 'Cloud ceiling',
      metric: 'Broken layers · monsoon fringe influence',
      blurb: 'Helo / drone surveys & renewal seasonality',
      risk: cloudCoverRisk,
      icon: Cloud,
      iconWrap: 'bg-slate-200 text-foreground ring-slate-300/60',
      cardTint: 'from-slate-50 via-white to-slate-100/50',
      iconMotion: 'motion-safe:animate-weather-float motion-safe:[animation-duration:3.4s]',
      invert: true,
    },
    {
      id: 'rain',
      title: 'Rain & accumulation',
      metric: `${latest.rainfallMm} mm annual (site proxy)`,
      blurb: 'Pluvial ingress, podium ponding, shaft leakage',
      risk: rainRisk,
      icon: CloudRain,
      iconWrap: 'bg-sky-100 text-sky-600 ring-sky-200/70',
      cardTint: 'from-sky-50/90 via-white to-cyan-50/40',
      iconMotion: 'motion-safe:animate-weather-rain-drip',
    },
    {
      id: 'storm',
      title: 'Storm & lightning',
      metric: 'Convective burst index — moderate',
      blurb: 'Roof plant, LPS continuity, strike density proxy',
      risk: stormRisk,
      icon: CloudLightning,
      iconWrap: 'bg-violet-100 text-violet-600 ring-violet-200/70',
      cardTint: 'from-violet-50/80 via-white to-indigo-50/35',
      iconMotion: 'motion-safe:animate-weather-pulse-soft',
    },
    {
      id: 'wind',
      title: 'Wind & gust',
      metric: `${latest.maxWindMs} m/s design gust (trend)`,
      blurb: 'Cladding, cranes, curtain-wall pressure cycles',
      risk: windRisk,
      icon: Wind,
      iconWrap: 'bg-cyan-100 text-cyan-600 ring-cyan-200/70',
      cardTint: 'from-cyan-50/85 via-white to-teal-50/35',
      iconMotion: 'motion-safe:animate-weather-sway',
    },
    {
      id: 'fog',
      title: 'Fog / low vis',
      metric: industrial ? 'Industrial haze + dust load' : 'Typical morning clarity',
      blurb: 'Logistics, helipad, façade access windows',
      risk: visibilityRisk,
      icon: CloudFog,
      iconWrap: 'bg-stone-100 text-stone-600 ring-stone-200/70',
      cardTint: 'from-stone-50/90 via-white to-neutral-50/40',
      iconMotion: 'motion-safe:animate-weather-float motion-safe:[animation-duration:4s]',
    },
  ] as const;
}

function WeatherPerilCard({
  title,
  metric,
  blurb,
  risk,
  icon: Icon,
  iconWrap,
  cardTint,
  iconMotion,
  invert = false,
  animIndex = 0,
}: {
  title: string;
  metric: string;
  blurb: string;
  risk: number;
  icon: React.ComponentType<{ className?: string }>;
  iconWrap: string;
  cardTint: string;
  iconMotion: string;
  invert?: boolean;
  animIndex?: number;
}) {
  const ringPct = Math.min(100, risk);
  const iconShell = invert
    ? 'bg-white/15 text-white ring-2 ring-inset ring-white/35 shadow-inner backdrop-blur-[2px]'
    : iconWrap;

  return (
    <div
      className={cn(
        'group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border p-5 sm:p-6',
        'motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out',
        'motion-safe:hover:z-10 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-xl',
        invert
          ? 'border-slate-500/30 bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 motion-safe:hover:border-white/25 motion-safe:hover:shadow-slate-950/45 motion-safe:hover:brightness-[1.03]'
          : cn(
              'border-slate-200/90 bg-gradient-to-br shadow-sm',
              cardTint,
              'motion-safe:hover:border-slate-300 motion-safe:hover:shadow-slate-300/45',
            ),
        'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
        'motion-safe:animate-card-enter motion-reduce:animate-none',
      )}
      style={{ animationDelay: `${animIndex * 70}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-inner ring-2 ring-inset',
            iconShell,
          )}
        >
          <span className={cn('inline-flex will-change-transform motion-reduce:animate-none', iconMotion)} aria-hidden>
            <Icon className="h-6 w-6" strokeWidth={1.75} />
          </span>
        </div>
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
          <svg className="absolute h-14 w-14 -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className={invert ? 'text-white/25' : 'text-slate-200'}
            />
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={`${(ringPct / 100) * 97.4} 97.4`}
              strokeLinecap="round"
              className={cn(
                ringPct >= 70
                  ? 'text-red-400'
                  : ringPct >= 55
                    ? 'text-orange-400'
                    : ringPct >= 40
                      ? 'text-amber-300'
                      : 'text-emerald-300',
              )}
            />
          </svg>
          <span
            className={cn(
              'relative text-sm font-black tabular-nums',
              invert ? 'text-white' : getRiskColor(risk),
            )}
          >
            {risk}
          </span>
        </div>
      </div>
      <p className={cn('mt-4 text-sm font-bold leading-snug', invert ? 'text-white' : 'text-foreground')}>{title}</p>
      <p className={cn('mt-2 text-xs font-medium leading-snug', invert ? 'text-slate-200' : 'text-foreground')}>
        {metric}
      </p>
      <p className={cn('mt-2.5 text-[11px] leading-relaxed', invert ? 'text-slate-300' : 'text-foreground')}>{blurb}</p>
      <div
        className={cn(
          'mt-4 flex items-center justify-between gap-2 border-t pt-3',
          invert ? 'border-white/20' : 'border-slate-200/70',
        )}
      >
        <span
          className={cn(
            'text-[10px] font-semibold uppercase tracking-wide',
            invert ? 'text-slate-300' : 'text-foreground',
          )}
        >
          Hazard risk
        </span>
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-[10px] font-bold motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-105',
            invert
              ? risk >= 70
                ? 'bg-red-500/35 text-red-100'
                : risk >= 55
                  ? 'bg-orange-500/35 text-orange-50'
                  : risk >= 40
                    ? 'bg-amber-400/35 text-amber-50'
                    : 'bg-emerald-500/30 text-emerald-50'
              : risk >= 70
                ? 'bg-red-100 text-red-800'
                : risk >= 55
                  ? 'bg-orange-100 text-orange-900'
                  : risk >= 40
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-emerald-100 text-emerald-900',
          )}
        >
          {risk >= 70 ? 'High' : risk >= 55 ? 'Elevated' : risk >= 40 ? 'Moderate' : 'Low'}
        </span>
      </div>
    </div>
  );
}

function AssessWeather({ property, immersive = false }: { property: Property; immersive?: boolean }) {
  const data = weatherSeriesForProperty(property);
  const latest = data[data.length - 1];
  const perilCards = weatherPerilCards(property, latest);
  const [trendMetric, setTrendMetric] = useState<WeatherTrendMetricId>('rain');
  const trendTheme = WEATHER_TREND_THEME[trendMetric];
  const trendDataKey = trendTheme.dataKey;

  const { mean, ucl, lcl, yDomain } = useMemo(() => {
    const values = data.map((row) => Number(row[trendDataKey]));
    const lim = spcLimits(values);
    const band = Math.max(lim.ucl - lim.lcl, Math.abs(lim.mean) * 0.1, 1);
    const pad = band * 0.06;
    const low = Math.min(...values, lim.lcl) - pad;
    const high = Math.max(...values, lim.ucl) + pad;
    return { ...lim, yDomain: [low, high] as [number, number] };
  }, [data, trendDataKey]);

  const axisStroke = immersive ? '#64748b' : '#334155';
  const axisTick = immersive ? '#94a3b8' : '#334155';
  const axisLabel = immersive ? '#cbd5e1' : '#475569';
  const gridStroke = immersive ? 'rgba(148,163,184,0.2)' : 'rgba(148,163,184,0.45)';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h3 className={cn('text-sm font-semibold', immersive ? 'text-slate-100' : 'text-foreground')}>
            Site weather & peril snapshot
          </h3>
          <p className={cn('mt-1 max-w-xl text-xs', immersive ? 'text-slate-400' : 'text-foreground')}>
            App-style hazard tiles with underwriting risk scores (demo). The trend control uses an SPC-style chart
            (subgroup means by year) with center line and control limits; line and markers follow each hazard&apos;s
            palette.
          </p>
        </div>
        <div
          className={cn(
            'flex items-center gap-2 rounded-xl border px-3 py-2 shadow-sm',
            immersive ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white',
          )}
        >
          <CloudSun className="h-5 w-5 text-sky-400" />
          <div className={cn('text-[11px]', immersive ? 'text-slate-400' : 'text-foreground')}>
            <span className={cn('font-semibold', immersive ? 'text-slate-200' : 'text-foreground')}>
              {property.city}
            </span>
            <span className="text-foreground"> · </span>
            {latest.year} window · {property.lat.toFixed(2)}°, {property.lng.toFixed(2)}°
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {perilCards.map((c, i) => (
          <WeatherPerilCard
            key={c.id}
            title={c.title}
            metric={c.metric}
            blurb={c.blurb}
            risk={c.risk}
            icon={c.icon}
            iconWrap={c.iconWrap}
            cardTint={c.cardTint}
            iconMotion={c.iconMotion}
            invert={immersive || ('invert' in c ? Boolean(c.invert) : false)}
            animIndex={i}
          />
        ))}
      </div>

      <div>
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h4
            className={cn(
              'text-xs font-bold uppercase tracking-wider',
              immersive ? 'text-slate-400' : 'text-foreground',
            )}
          >
            5 year trend by weather type
          </h4>
          <Select value={trendMetric} onValueChange={(v) => setTrendMetric(v as WeatherTrendMetricId)}>
            <SelectTrigger
              className={cn(
                'h-9 w-full text-xs font-medium sm:w-[min(100%,280px)]',
                immersive
                  ? 'border-white/10 bg-white/5 text-slate-200'
                  : 'border-slate-200 bg-white',
              )}
            >
              <SelectValue placeholder="Choose metric" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(WEATHER_TREND_THEME) as WeatherTrendMetricId[]).map((id) => (
                <SelectItem key={id} value={id} className="text-xs">
                  {WEATHER_TREND_THEME[id].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div
          className={cn(
            'h-[280px] w-full rounded-2xl border p-4 sm:h-[300px] sm:p-5',
            immersive ? 'border-white/10 bg-[#0a0f18]' : 'border-slate-200 bg-white',
          )}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              key={`${property.id}-${trendMetric}`}
              data={data}
              margin={{ top: 8, right: 148, left: 6, bottom: 28 }}
            >
              <CartesianGrid strokeDasharray="4 6" stroke={gridStroke} />
              <XAxis
                dataKey="year"
                stroke={axisStroke}
                tick={{ fill: axisTick, fontSize: 11 }}
                tickLine={{ stroke: axisStroke }}
                label={{
                  value: 'Year (subgroup)',
                  position: 'insideBottom',
                  offset: -4,
                  fill: axisLabel,
                  fontSize: 10,
                }}
              />
              <YAxis
                domain={yDomain}
                stroke={axisStroke}
                tick={{ fill: axisTick, fontSize: 10 }}
                tickLine={{ stroke: axisStroke }}
                width={72}
                tickFormatter={(v) =>
                  formatWeatherTrendValue(Number(v), trendTheme.valueSuffix, trendTheme.tickDecimals)
                }
                label={{
                  value: trendTheme.yAxisLabel,
                  angle: -90,
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fill: axisLabel, fontSize: 10 },
                }}
              />
              <Tooltip
                contentStyle={{
                  background: immersive ? '#0f172a' : '#ffffff',
                  border: `1px solid ${trendTheme.stroke}`,
                  borderRadius: '8px',
                  fontSize: '12px',
                  boxShadow: immersive ? '0 4px 16px rgba(0,0,0,0.4)' : '0 4px 16px rgba(15, 23, 42, 0.08)',
                  color: immersive ? '#e2e8f0' : '#0f172a',
                }}
                labelStyle={{ color: immersive ? '#f1f5f9' : '#0f172a' }}
                formatter={(value: number) => [
                  formatWeatherTrendValue(value, trendTheme.valueSuffix, trendTheme.tickDecimals),
                  trendTheme.yAxisLabel,
                ]}
              />
              <ReferenceLine
                y={mean}
                stroke="#0f172a"
                strokeWidth={1}
                label={{
                  value: 'Center line (mean)',
                  position: 'right',
                  fill: '#0f172a',
                  fontSize: 9,
                  fontWeight: 600,
                }}
              />
              <ReferenceLine
                y={ucl}
                stroke="#475569"
                strokeDasharray="6 5"
                strokeWidth={1}
                label={{
                  value: 'Upper control limit (UCL)',
                  position: 'right',
                  fill: '#475569',
                  fontSize: 9,
                }}
              />
              <ReferenceLine
                y={lcl}
                stroke="#475569"
                strokeDasharray="6 5"
                strokeWidth={1}
                label={{
                  value: 'Lower control limit (LCL)',
                  position: 'right',
                  fill: '#475569',
                  fontSize: 9,
                }}
              />
              <Line
                type="linear"
                dataKey={trendDataKey}
                name={trendTheme.seriesName}
                stroke={trendTheme.stroke}
                strokeWidth={1.75}
                dot={(dotProps) => (
                  <WeatherTrendDiamondDot cx={dotProps.cx} cy={dotProps.cy} fill={trendTheme.stroke} />
                )}
                activeDot={(adProps) => (
                  <WeatherTrendDiamondDot cx={adProps.cx} cy={adProps.cy} fill={trendTheme.fill} />
                )}
                isAnimationActive
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {(['maxWindMs', 'heatDaysOver42'] as const).map((k, idx) => (
          <div
            key={k}
            className={cn(
              'rounded-xl border p-4',
              immersive ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white shadow-sm',
            )}
          >
            <p className={cn('text-[10px] font-bold uppercase tracking-wider', immersive ? 'text-slate-400' : 'text-foreground')}>
              {idx === 0 ? 'Peak gust trend (m/s)' : 'Days &gt; 42°C'}
            </p>
            <p className={cn('mt-2 text-2xl font-bold', immersive ? 'text-white' : 'text-foreground')}>{latest[k]}</p>
            <p className={cn('mt-1 text-[11px]', immersive ? 'text-slate-500' : 'text-foreground')}>
              Latest year {latest.year}
            </p>
          </div>
        ))}
        <div
          className={cn(
            'rounded-xl border p-4',
            immersive ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white shadow-sm',
          )}
        >
          <p className={cn('text-[10px] font-bold uppercase tracking-wider', immersive ? 'text-slate-400' : 'text-foreground')}>
            Composite climate
          </p>
          <p className={cn('mt-2 text-2xl font-bold', immersive ? 'text-sky-400' : 'text-sky-700')}>
            {Math.round(
              perilCards.reduce((s, c) => s + c.risk, 0) / (perilCards.length || 1),
            )}
          </p>
          <p className={cn('mt-1 text-[11px]', immersive ? 'text-slate-500' : 'text-foreground')}>
            Mean hazard across tiles (demo)
          </p>
        </div>
      </div>
    </div>
  );
}

function AssessBurningCost({ property, immersive = false }: { property: Property; immersive?: boolean }) {
  const { currentPerMille, avg5yPerMille, baseRatePerMille } = BURNING_COST_SUMMARY;
  const aboveMarket = currentPerMille > baseRatePerMille;
  const deltaVsBase = currentPerMille - baseRatePerMille;
  const axisTick = immersive ? '#94a3b8' : '#64748b';
  const axisLine = immersive ? '#475569' : '#cbd5e1';
  const gridStroke = immersive ? 'rgba(148,163,184,0.15)' : 'rgba(226, 232, 240, 0.9)';

  return (
    <div className="space-y-6">
      <div
        className={cn(
          'flex flex-wrap items-start gap-4 rounded-xl border p-5 md:p-6',
          immersive ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-white shadow-sm',
        )}
      >
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border',
            immersive ? 'border-white/10 bg-sky-500/15' : 'border-slate-200 bg-sky-50',
          )}
        >
          <Calculator className={cn('h-5 w-5', immersive ? 'text-sky-300' : 'text-sky-700')} strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className={cn('text-base font-bold tracking-tight md:text-lg', immersive ? 'text-white' : 'text-foreground')}>
            Burning cost
          </h3>
          <p className={cn('mt-1 max-w-2xl text-xs leading-relaxed', immersive ? 'text-slate-400' : 'text-foreground')}>
            Historical burning cost (‰) by year against the book base rate — demo pricing view for{' '}
            <span className={cn('font-medium', immersive ? 'text-slate-200' : 'text-foreground')}>{property.name}</span>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: TrendingUp, label: 'Current (portfolio)', value: `${currentPerMille.toFixed(2)}‰`, valueClass: 'text-amber-500' },
          { icon: Calendar, label: '5-year average', value: `${avg5yPerMille.toFixed(2)}‰`, valueClass: immersive ? 'text-white' : 'text-foreground' },
          { icon: Calculator, label: 'Base rate', value: `${baseRatePerMille.toFixed(2)}‰`, valueClass: immersive ? 'text-slate-200' : 'text-foreground' },
          {
            icon: AlertTriangle,
            label: 'vs base',
            value: `${deltaVsBase >= 0 ? '+' : ''}${deltaVsBase.toFixed(2)}‰`,
            valueClass: aboveMarket ? 'text-red-500' : 'text-emerald-500',
          },
        ].map(({ icon: Icon, label, value, valueClass }) => (
          <div key={label} className={immersiveStatCard(immersive)}>
            <div className={cn('flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider', immersive ? 'text-slate-400' : 'text-foreground')}>
              <Icon className="h-3.5 w-3.5 text-slate-400" />
              {label}
            </div>
            <p className={cn('mt-2 text-xl font-bold tabular-nums', valueClass)}>{value}</p>
          </div>
        ))}
      </div>

      <div className={cn('rounded-xl border p-5 md:p-6', immersive ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-slate-50/90')}>
        <h4 className={cn('text-xs font-bold uppercase tracking-widest', immersive ? 'text-slate-400' : 'text-foreground')}>
          Burning cost analysis
        </h4>
        <div className="mt-4 h-[220px] w-full md:h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[...LOSS_HISTORY_BURNING_COST]} margin={{ top: 28, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="4 6" stroke={gridStroke} vertical={false} />
              <XAxis dataKey="year" tick={{ fill: axisTick, fontSize: 11 }} tickLine={false} axisLine={{ stroke: axisLine }} />
              <YAxis
                tick={{ fill: axisTick, fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: axisLine }}
                width={40}
                tickFormatter={(v) => `${v}‰`}
                domain={[0, 1.8]}
              />
              <Tooltip
                cursor={{ fill: immersive ? 'rgba(255,255,255,0.06)' : 'rgba(241, 245, 249, 0.6)' }}
                contentStyle={{
                  background: immersive ? '#0f172a' : '#ffffff',
                  border: immersive ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: immersive ? '#e2e8f0' : '#0f172a',
                  boxShadow: immersive ? '0 4px 16px rgba(0,0,0,0.4)' : '0 4px 16px rgba(15, 23, 42, 0.08)',
                }}
                labelStyle={{ color: axisTick }}
                formatter={(value: number) => [`${Number(value).toFixed(2)}‰`, 'Burning cost']}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={52} minPointSize={6}>
                {[...LOSS_HISTORY_BURNING_COST].map((entry) => (
                  <Cell key={`bc-light-${entry.year}`} fill={burningCostBarColor(entry.value)} />
                ))}
                <LabelList
                  dataKey="value"
                  position="top"
                  offset={8}
                  formatter={(v: number) => `${Number(v).toFixed(2)}‰`}
                  fill={immersive ? '#cbd5e1' : '#334155'}
                  fontSize={11}
                  fontWeight={600}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div
          className={cn(
            'mt-3 flex flex-col gap-2 border-t pt-4 text-[11px] sm:flex-row sm:items-center sm:justify-between',
            immersive ? 'border-white/10 text-slate-400' : 'border-slate-200 text-foreground',
          )}
        >
          <p>
            <span className="text-foreground">5-yr avg:</span>{' '}
            <span className={cn('font-semibold', immersive ? 'text-slate-200' : 'text-foreground')}>
              {avg5yPerMille.toFixed(2)}‰
            </span>
            <span className={cn('mx-2', immersive ? 'text-slate-600' : 'text-foreground')}>·</span>
            <span className="text-foreground">Base rate:</span>{' '}
            <span className={cn('font-semibold', immersive ? 'text-slate-200' : 'text-foreground')}>
              {baseRatePerMille.toFixed(2)}‰
            </span>
          </p>
          {aboveMarket ? (
            <div className="flex items-center gap-1.5 text-red-500">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span className="font-semibold">Above market rate</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-emerald-500">
              <span className="font-semibold">Within base band</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AssessLossHistory({ property, immersive = false }: { property: Property; immersive?: boolean }) {
  const claimsCount = LOSS_HISTORY_CLAIMS.length;

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border',
        immersive
          ? 'border-white/10 bg-[#0a101c]/80 shadow-none'
          : 'border-slate-200 bg-white text-foreground shadow-sm',
      )}
    >
      <div
        className={cn(
          'border-b px-5 py-5 md:px-6 md:py-6',
          immersive ? 'border-white/10 bg-slate-900/50' : 'border-slate-100 bg-slate-50/80',
        )}
      >
        <div className="flex flex-wrap items-start gap-4">
          <div
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border shadow-sm',
              immersive ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white',
            )}
          >
            <History className={cn('h-5 w-5', immersive ? 'text-slate-300' : 'text-foreground')} strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <h3
              className={cn(
                'text-base font-bold tracking-tight md:text-lg',
                immersive ? 'text-white' : 'text-foreground',
              )}
            >
              Loss History — 5 Year
            </h3>
            <p className={cn('mt-1 text-xs', immersive ? 'text-slate-400' : 'text-foreground')}>
              {claimsCount} claims recorded · {property.name}
              <span className={cn('mx-2', immersive ? 'text-slate-600' : 'text-foreground')}>·</span>
              <span className={immersive ? 'text-slate-500' : 'text-foreground'}>Burning cost trend → </span>
              <span className={cn('font-medium', immersive ? 'text-sky-400' : 'text-sky-700')}>
                Price · Burning cost
              </span>
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className={immersiveStatCard(immersive)}>
            <div
              className={cn(
                'flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider',
                immersive ? 'text-slate-400' : 'text-foreground',
              )}
            >
              <DollarSign className="h-3.5 w-3.5 text-slate-400" />
              5-Year Incurred
            </div>
            <p className={cn('mt-2 text-xl font-bold tabular-nums', immersive ? 'text-white' : 'text-foreground')}>
              AED 4.6M
            </p>
          </div>
          <div className={immersiveStatCard(immersive)}>
            <div
              className={cn(
                'flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider',
                immersive ? 'text-slate-400' : 'text-foreground',
              )}
            >
              <AlertTriangle className="h-3.5 w-3.5 text-slate-400" />
              Largest Loss
            </div>
            <p className="mt-2 text-xl font-bold tabular-nums text-red-500">AED 2.4M</p>
          </div>
          <div className={immersiveStatCard(immersive)}>
            <div
              className={cn(
                'flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider',
                immersive ? 'text-slate-400' : 'text-foreground',
              )}
            >
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              Frequency
            </div>
            <p className={cn('mt-2 text-xl font-bold tabular-nums', immersive ? 'text-teal-400' : 'text-teal-700')}>
              0.6/yr
            </p>
          </div>
        </div>
      </div>

      <div className={cn('px-5 py-5 md:px-6 md:pb-6', immersive ? 'bg-transparent' : 'bg-white')}>
        <h4
          className={cn(
            'text-xs font-bold uppercase tracking-widest',
            immersive ? 'text-slate-400' : 'text-foreground',
          )}
        >
          Claims Register
        </h4>
        <div
          className={cn(
            'mt-4 overflow-x-auto rounded-xl border',
            immersive ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-slate-50/50',
          )}
        >
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr
                className={cn(
                  'border-b text-[10px] font-bold uppercase tracking-wider',
                  immersive
                    ? 'border-slate-700/80 bg-slate-800/90 text-slate-300'
                    : 'border-slate-200 bg-slate-100 text-foreground',
                )}
              >
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Peril</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Gross Paid</th>
                <th className="px-4 py-3">Net Paid</th>
                <th className="px-4 py-3">Reserves</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {LOSS_HISTORY_CLAIMS.map((row) => (
                <tr
                  key={row.date + row.peril}
                  className={cn(
                    'border-b last:border-0',
                    immersive ? 'border-white/5 bg-transparent' : 'border-slate-100 bg-white',
                  )}
                >
                  <td
                    className={cn(
                      'whitespace-nowrap px-4 py-3 font-mono text-xs',
                      immersive ? 'text-slate-400' : 'text-foreground',
                    )}
                  >
                    {row.date}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                        perilPillClass(row.perilVariant, immersive),
                      )}
                    >
                      {row.peril}
                    </span>
                  </td>
                  <td
                    className={cn(
                      'max-w-[280px] px-4 py-3 text-xs leading-snug',
                      immersive ? 'text-slate-400' : 'text-foreground',
                    )}
                  >
                    {row.description}
                  </td>
                  <td
                    className={cn(
                      'whitespace-nowrap px-4 py-3 text-xs font-medium',
                      immersive ? 'text-slate-200' : 'text-foreground',
                    )}
                  >
                    {row.grossPaid}
                  </td>
                  <td
                    className={cn(
                      'whitespace-nowrap px-4 py-3 text-xs',
                      immersive ? 'text-slate-300' : 'text-foreground',
                    )}
                  >
                    {row.netPaid}
                  </td>
                  <td
                    className={cn(
                      'whitespace-nowrap px-4 py-3 text-xs',
                      row.reservesEmphasis
                        ? 'font-semibold text-amber-500'
                        : immersive
                          ? 'text-slate-500'
                          : 'text-foreground',
                    )}
                  >
                    {row.reserves}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                        immersive
                          ? 'border-emerald-500/35 bg-emerald-500/15 text-emerald-300'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-800',
                      )}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AssessSurvey({ property, immersive = false }: { property: Property; immersive?: boolean }) {
  const attachmentTypes = new Set<Document['type']>(['survey', 'report', 'proposal', 'certificate', 'note']);
  const attachments = property.documents.filter((d) => attachmentTypes.has(d.type));

  const typeIcon = (type: Document['type']) => {
    if (type === 'survey' || type === 'report') return FileSearch;
    if (type === 'proposal') return FileText;
    return FileText;
  };

  const typeLabel: Record<Document['type'], string> = {
    survey: 'Survey',
    report: 'Engineering report',
    proposal: 'Proposal',
    certificate: 'Certificate',
    note: 'UW notes',
    photo: 'Photo',
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_min(300px,100%)]">
      <div
        className={cn(
          'space-y-3 rounded-2xl border p-5',
          immersive ? 'border-white/10 bg-white/[0.03]' : 'border-border bg-muted/40',
        )}
      >
        <h3 className={cn('text-sm font-semibold', immersive ? 'text-white' : 'text-foreground')}>
          Executive survey synthesis
        </h3>
        <p className={cn('text-xs leading-relaxed', immersive ? 'text-slate-400' : 'text-foreground')}>
          Consolidated from risk engineer walk-down, façade inspection, and sprinkler riser tests. Attachments below
          are sourced from the submission pack and survey file share.
        </p>
        <ul className={cn('mt-4 space-y-3 text-xs', immersive ? 'text-slate-400' : 'text-foreground')}>
          <li className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            Passive fire: stair pressurization within tolerance; refuge floors signed off Q1 2026.
          </li>
          <li className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            Roof plant: lightning protection continuity verified; HVAC vibration isolators aged but serviceable.
          </li>
          <li className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
            Water ingress: podium-level damp in two shafts — remediation scheduled pre-inception.
          </li>
        </ul>
      </div>

      <div className="space-y-2">
        <p
          className={cn(
            'text-xs font-semibold uppercase tracking-wider',
            immersive ? 'text-slate-400' : 'text-foreground',
          )}
        >
          Survey & underwriting attachments
        </p>
        {attachments.length === 0 ? (
          <p className={cn('text-xs', immersive ? 'text-slate-500' : 'text-foreground')}>
            No survey or underwriting documents on file.
          </p>
        ) : (
          <ul className="space-y-2">
            {attachments.map((d) => {
              const Icon = typeIcon(d.type);
              return (
                <li
                  key={d.id}
                  className={cn(
                    'flex items-start gap-2.5 rounded-xl border px-3 py-2.5',
                    immersive ? 'border-white/10 bg-white/5' : 'border-border bg-card',
                  )}
                >
                  <div
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                      immersive ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'truncate text-xs font-medium',
                        immersive ? 'text-slate-200' : 'text-foreground',
                      )}
                    >
                      {d.name}
                    </p>
                    <p className={cn('text-[10px]', immersive ? 'text-slate-500' : 'text-foreground')}>
                      {typeLabel[d.type]} · {d.uploadDate} · {d.size}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={cn(
                      'inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold',
                      immersive
                        ? 'bg-primary/20 text-primary hover:bg-primary/30'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90',
                    )}
                    title={`Download ${d.name}`}
                  >
                    <Download className="h-3 w-3" />
                    PDF
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function AssessNatCatModel({ property, immersive = false }: { property: Property; immersive?: boolean }) {
  const [version, setVersion] = useState(0);
  const [busy, setBusy] = useState(false);

  const metrics = useMemo(() => {
    const si = property.sumInsured;
    const rs = property.riskScore;
    const hazardAdj = 1 + rs / 200;
    const aal = si * (0.0042 + rs / 12000) * hazardAdj;
    const pml100 = si * (0.038 + rs / 8000) * hazardAdj;
    const pml250 = si * (0.047 + rs / 7000) * hazardAdj;
    const overallRating =
      rs >= 60 ? 'High' : rs >= 45 ? 'Elevated' : rs >= 35 ? 'Moderate' : 'Controlled';
    const ratingClass =
      overallRating === 'High'
        ? immersive
          ? 'bg-red-500/20 text-red-300'
          : 'bg-red-100 text-red-900'
        : overallRating === 'Elevated'
          ? immersive
            ? 'bg-orange-500/20 text-orange-300'
            : 'bg-orange-100 text-orange-900'
          : overallRating === 'Moderate'
            ? immersive
              ? 'bg-amber-500/20 text-amber-300'
              : 'bg-amber-100 text-amber-900'
            : immersive
              ? 'bg-emerald-500/20 text-emerald-300'
              : 'bg-emerald-100 text-emerald-900';

    const periods = [10, 25, 50, 100, 250, 500] as const;
    const mult = [0.85, 1.15, 1.65, 2.45, 3.15, 4.05];
    const oep = periods.map((yr, i) => {
      const gross = aal * mult[i] * (2.8 + i * 0.15);
      return {
        period: `${yr}-yr`,
        grossLoss: Math.round(gross),
        damageRatio: Number(((gross / si) * 100).toFixed(2)),
      };
    });

    const perilShare = [
      { name: 'Cyclone & windstorm', pct: 0.364 },
      { name: 'Flood & inundation', pct: 0.228 },
      { name: 'Extreme heat', pct: 0.162 },
      { name: 'Earthquake', pct: 0.128 },
      { name: 'Sandstorm & dust', pct: 0.118 },
    ];
    const perilRows = perilShare.map((row) => ({
      ...row,
      aalPortion: aal * row.pct,
    }));

    return {
      aal,
      pml100,
      pml250,
      overallRating,
      ratingClass,
      oep,
      perilRows,
    };
  }, [property.sumInsured, property.riskScore, version, immersive]);

  const handleRerun = () => {
    setBusy(true);
    window.setTimeout(() => {
      setVersion((v) => v + 1);
      setBusy(false);
    }, 650);
  };

  const siLabel = formatAED(property.sumInsured);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className={cn('text-lg font-bold tracking-tight', immersive ? 'text-white' : 'text-foreground')}>
            Natural catastrophe model
          </h3>
          <p className={cn('mt-1 text-sm', immersive ? 'text-slate-400' : 'text-foreground')}>
            Probabilistic loss modeling for {property.name} — {property.city}
          </p>
        </div>
        <button
          type="button"
          onClick={handleRerun}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg border border-sky-500/40 bg-sky-600 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-sm transition-colors hover:bg-sky-500 disabled:opacity-60"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', busy && 'animate-spin')} />
          {busy ? 'Running…' : 'Re-run model'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {['Flood', 'Earthquake', 'Cyclone', 'Extreme heat', 'Sandstorm'].map((p) => (
          <span
            key={p}
            className={cn(
              'rounded-full border px-3 py-1 text-[11px] font-semibold',
              immersive
                ? 'border-white/10 bg-white/5 text-slate-300'
                : 'border-slate-200 bg-slate-50 text-foreground',
            )}
          >
            {p}
          </span>
        ))}
      </div>

      <div
        className={cn(
          'rounded-xl border p-4 text-sm',
          immersive ? 'border-white/10 bg-white/[0.03] text-slate-300' : 'border-slate-200 bg-slate-50/80 text-foreground',
        )}
      >
        <p>
          <span className={cn('font-semibold', immersive ? 'text-slate-100' : 'text-foreground')}>Model basis:</span>{' '}
          UAE exposure curves · EUR EP2024 hazard blend (demo).
        </p>
        <p className="mt-2">
          <span className={cn('font-semibold', immersive ? 'text-slate-100' : 'text-foreground')}>Sum insured:</span>{' '}
          {siLabel}
          <span className={cn('mx-2', immersive ? 'text-slate-600' : 'text-slate-300')}>·</span>
          <span className={cn('font-semibold', immersive ? 'text-slate-100' : 'text-foreground')}>Construction:</span>{' '}
          {property.constructionMaterial}
          <span className={cn('mx-2', immersive ? 'text-slate-600' : 'text-slate-300')}>·</span>
          <span className={cn('font-semibold', immersive ? 'text-slate-100' : 'text-foreground')}>Year built:</span>{' '}
          {property.yearBuilt}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className={immersiveStatCard(immersive)}>
          <p className={cn('text-[10px] font-bold uppercase tracking-wider', immersive ? 'text-slate-400' : 'text-foreground')}>
            Overall rating
          </p>
          <p className={cn('mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-bold', metrics.ratingClass)}>
            {metrics.overallRating}
          </p>
        </div>
        {[
          { label: 'Aggregate annual loss', value: formatAED(metrics.aal), sub: `${((metrics.aal / property.sumInsured) * 100).toFixed(2)}% of SI` },
          { label: 'PML — 100 yr', value: formatAED(metrics.pml100), sub: `${((metrics.pml100 / property.sumInsured) * 100).toFixed(2)}% of SI` },
          { label: 'PML — 250 yr', value: formatAED(metrics.pml250), sub: `${((metrics.pml250 / property.sumInsured) * 100).toFixed(2)}% of SI` },
        ].map(({ label, value, sub }) => (
          <div key={label} className={immersiveStatCard(immersive)}>
            <p className={cn('text-[10px] font-bold uppercase tracking-wider', immersive ? 'text-slate-400' : 'text-foreground')}>
              {label}
            </p>
            <p className={cn('mt-2 text-lg font-bold tabular-nums', immersive ? 'text-white' : 'text-foreground')}>{value}</p>
            <p className={cn('mt-1 text-[11px]', immersive ? 'text-slate-500' : 'text-foreground')}>{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className={cn('rounded-xl border p-4', immersive ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-white shadow-sm')}>
          <p className={cn('text-xs font-bold', immersive ? 'text-slate-100' : 'text-foreground')}>
            Loss exceedance curve (OEP)
          </p>
          <p className={cn('text-[11px]', immersive ? 'text-slate-500' : 'text-foreground')}>Gross loss by return period</p>
          <div className="mt-4 h-56 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.oep} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={immersive ? 'rgba(148,163,184,0.15)' : '#e2e8f0'} />
                <XAxis dataKey="period" tick={{ fontSize: 10, fill: immersive ? '#94a3b8' : '#64748b' }} />
                <YAxis
                  tick={{ fontSize: 10, fill: immersive ? '#94a3b8' : '#64748b' }}
                  tickFormatter={(v) => `${(Number(v) / 1_000_000).toFixed(0)}M`}
                />
                <Tooltip
                  formatter={(val: number) => [formatAED(val), 'Gross loss']}
                  labelStyle={{ color: immersive ? '#94a3b8' : '#64748b' }}
                  contentStyle={{
                    borderRadius: 8,
                    fontSize: 12,
                    background: immersive ? '#0f172a' : '#fff',
                    border: immersive ? '1px solid rgba(255,255,255,0.1)' : undefined,
                    color: immersive ? '#e2e8f0' : undefined,
                  }}
                />
                <Bar dataKey="grossLoss" radius={[4, 4, 0, 0]} maxBarSize={36}>
                  {metrics.oep.map((_, i) => (
                    <Cell
                      key={i}
                      fill={
                        i <= 1 ? '#22c55e' : i <= 3 ? '#eab308' : '#f97316'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={cn('rounded-xl border p-4', immersive ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-white shadow-sm')}>
          <p className={cn('text-xs font-bold', immersive ? 'text-slate-100' : 'text-foreground')}>
            Peril contribution to AAL
          </p>
          <div className="mt-4 flex flex-col gap-3">
            {metrics.perilRows.map((row) => (
              <div key={row.name}>
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className={cn('font-medium', immersive ? 'text-slate-200' : 'text-foreground')}>{row.name}</span>
                  <span className={cn('shrink-0 tabular-nums', immersive ? 'text-slate-400' : 'text-foreground')}>
                    {formatAED(row.aalPortion)}{' '}
                    <span className="text-foreground">({(row.pct * 100).toFixed(1)}%)</span>
                  </span>
                </div>
                <div className={cn('mt-1.5 h-2 overflow-hidden rounded-full', immersive ? 'bg-slate-700/80' : 'bg-slate-100')}>
                  <div
                    className="h-full rounded-full bg-sky-500"
                    style={{ width: `${row.pct * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const AI_SIDEBAR_INSIGHTS: {
  id: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  severity: AIInsight['severity'];
  text: string;
  confidence: number;
}[] = [
  {
    id: 'structural',
    category: 'Structural',
    icon: Building2,
    severity: 'medium',
    text: "World's tallest building — extreme high-rise premium applies (163 floors). Evacuation time estimated 2+ hours.",
    confidence: 98,
  },
  {
    id: 'fire-cladding',
    category: 'Fire',
    icon: Flame,
    severity: 'high',
    text: 'Aluminium & glass cladding — potential fire spread risk. Panels meet post–2017 UAE fire code.',
    confidence: 88,
  },
  {
    id: 'fire-suppression',
    category: 'Fire',
    icon: ShieldCheck,
    severity: 'low',
    text: 'Full advanced fire suppression with pressurized refuge floors every 25 stories.',
    confidence: 97,
  },
];

function aiInsightCategoryIcon(category: AIInsight['category']) {
  switch (category) {
    case 'fire':
      return Flame;
    case 'flood':
      return CloudRain;
    case 'structural':
      return Building2;
    case 'environmental':
      return Cloud;
    case 'security':
      return ShieldCheck;
    default:
      return Brain;
  }
}

function aiInsightSeverityShell(severity: AIInsight['severity'], immersive: boolean) {
  if (immersive) {
    switch (severity) {
      case 'high':
        return 'border-red-400/35 bg-red-500/15 text-red-200 shadow-inner';
      case 'medium':
        return 'border-orange-400/35 bg-orange-500/15 text-orange-200 shadow-inner';
      default:
        return 'border-emerald-400/35 bg-emerald-500/15 text-emerald-200 shadow-inner';
    }
  }

  switch (severity) {
    case 'high':
      return 'border-red-200 bg-red-50 text-red-700 shadow-sm';
    case 'medium':
      return 'border-orange-200 bg-orange-50 text-orange-700 shadow-sm';
    default:
      return 'border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm';
  }
}

function AssessAIInsights({ property, immersive = false }: { property: Property; immersive?: boolean }) {
  const items =
    property.aiInsights.length > 0
      ? property.aiInsights.map((insight) => ({
          id: insight.id,
          category: insight.category.charAt(0).toUpperCase() + insight.category.slice(1),
          icon: aiInsightCategoryIcon(insight.category),
          severity: insight.severity,
          text: insight.text,
          confidence: insight.confidence,
        }))
      : AI_SIDEBAR_INSIGHTS.map((item) => ({
          id: item.id,
          category: item.category,
          icon: item.icon,
          severity: item.severity,
          text: item.text,
          confidence: item.confidence,
        }));

  return (
    <div className="flex flex-col gap-3 pb-1">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.id}
            className={cn(
              'flex gap-3.5 rounded-xl border p-4 shadow-sm transition-colors',
              immersive
                ? 'border-white/10 bg-white/[0.06] backdrop-blur-sm hover:border-white/15 hover:bg-white/[0.09]'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80',
            )}
          >
            <div
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ring-2 ring-inset',
                immersive ? 'ring-white/5' : 'ring-slate-100',
                aiInsightSeverityShell(item.severity, immersive),
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <p
                className={cn(
                  'text-[10px] font-bold uppercase tracking-wide',
                  immersive ? 'text-indigo-200/95' : 'text-foreground',
                )}
              >
                {item.category}
              </p>
              <p
                className={cn(
                  'mt-2 text-[13px] font-medium leading-snug',
                  immersive ? 'text-indigo-50' : 'text-foreground',
                )}
              >
                {item.text}
              </p>
              <p
                className={cn(
                  'mt-3 text-[10px] font-semibold tabular-nums',
                  immersive ? 'text-indigo-300/95' : 'text-foreground',
                )}
              >
                Confidence {item.confidence}%
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AssessRiskScoreFactors({ property, immersive = false }: { property: Property; immersive?: boolean }) {
  const factors = factorBreakdown(property);
  return (
    <div className="space-y-4">
      <div
        className={cn(
          'flex flex-wrap items-stretch gap-4 rounded-2xl border px-5 py-4',
          immersive
            ? 'border-white/10 bg-gradient-to-r from-white/5 to-white/[0.02]'
            : 'border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100',
        )}
      >
        <div
          className={cn(
            'flex min-w-[5.5rem] shrink-0 items-center justify-center rounded-xl border px-6 py-4 motion-safe:animate-card-enter motion-reduce:animate-none',
            compositeScoreBoxClasses(property.riskScore),
          )}
        >
          <p className="text-4xl font-black tabular-nums text-white drop-shadow-sm sm:text-5xl">{property.riskScore}</p>
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
          <p
            className={cn(
              'text-[10px] font-bold uppercase tracking-[0.2em]',
              immersive ? 'text-slate-400' : 'text-foreground',
            )}
          >
            Composite
          </p>
          <p className={cn('text-xs leading-snug', immersive ? 'text-slate-400' : 'text-foreground')}>
            Weighted blend of factor scores (demo calibration)
          </p>
        </div>
      </div>
      <div className="space-y-4">
        {factors.map((f) => (
          <div
            key={f.id}
            className={cn(
              'rounded-xl border px-4 py-3',
              immersive ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50',
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className={cn('text-sm font-medium', immersive ? 'text-slate-200' : 'text-foreground')}>
                {f.label}
              </span>
              <span className={cn('text-sm font-bold tabular-nums', getRiskColor(f.score))}>{f.score}</span>
            </div>
            <div
              className={cn(
                'mt-2 h-2 overflow-hidden rounded-full',
                immersive ? 'bg-slate-700/80' : 'bg-slate-200',
              )}
            >
              <div
                className={cn('h-full rounded-full transition-all', getRiskBarBg(f.score))}
                style={{ width: `${f.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CommandCenterAssessPanels({
  view,
  immersive = false,
}: {
  view: AssessPanelView;
  immersive?: boolean;
}) {
  const { property } = useCommandCenterProperty();

  switch (view) {
    case 'street':
      return <AssessStreetView property={property} immersive={immersive} />;
    case 'risk-map':
      return <AssessRiskMap property={property} immersive={immersive} />;
    case 'explorer':
      return <Assess3DExplorer property={property} immersive={immersive} />;
    case 'weather':
      return <AssessWeather property={property} immersive={immersive} />;
    case 'loss-history':
      return <AssessLossHistory property={property} immersive={immersive} />;
    case 'burning-cost':
      return <AssessBurningCost property={property} immersive={immersive} />;
    case 'survey':
      return <AssessSurvey property={property} immersive={immersive} />;
    case 'natcat':
      return <AssessNatCatModel property={property} immersive={immersive} />;
    case 'ai-insights':
      return <AssessAIInsights property={property} immersive={immersive} />;
    case 'risk-score':
      return <AssessRiskScoreFactors property={property} immersive={immersive} />;
    default:
      return null;
  }
}
