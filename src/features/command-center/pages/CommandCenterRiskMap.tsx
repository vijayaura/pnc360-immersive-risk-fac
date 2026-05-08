import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Building2,
  DollarSign,
  Eye,
  EyeOff,
  MapPin,
} from 'lucide-react';
import { mockProperties } from '../data/mock-data';

type ViewMode = 'risk' | 'status' | 'sumInsured' | 'type';
type StatusFilter = 'all' | 'pending' | 'approved' | 'referred' | 'rejected';

function getRiskColor(score: number) {
  if (score >= 70) return '#ef4444';
  if (score >= 55) return '#f97316';
  if (score >= 40) return '#eab308';
  return '#22c55e';
}

function getStatusColor(status: string) {
  const map: Record<string, string> = { pending: '#f59e0b', approved: '#22c55e', referred: '#f97316', rejected: '#ef4444' };
  return map[status] || '#94a3b8';
}

function getTypeColor(type: string) {
  const map: Record<string, string> = { warehouse: '#8b5cf6', office: '#3b82f6', retail: '#06b6d4', industrial: '#f97316', residential: '#22c55e' };
  return map[type] || '#94a3b8';
}

function getSumInsuredColor(sum: number) {
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
      <span style={{ background: color }} className="inline-block w-2.5 h-2.5 rounded-full" />
      {label}
    </span>
  );
}

const viewModes: { key: ViewMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'risk', label: 'Risk Score', icon: AlertTriangle },
  { key: 'status', label: 'Status', icon: Eye },
  { key: 'sumInsured', label: 'Sum Insured', icon: DollarSign },
  { key: 'type', label: 'Property Type', icon: Building2 },
];

function MapInner({ viewMode, statusFilter, showLabels }: { viewMode: ViewMode; statusFilter: StatusFilter; showLabels: boolean }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const LRef = useRef<any>(null);
  const [ready, setReady] = useState(false);

  const filtered = mockProperties.filter((p) => statusFilter === 'all' || p.status === statusFilter);

  useEffect(() => {
    import('leaflet').then((mod) => {
      LRef.current = mod;
      setReady(true);
    });
  }, []);

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
      requestAnimationFrame(() => requestAnimationFrame(() => map.invalidateSize({ animate: false })));
    };

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

    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, [ready]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = LRef.current;
    if (!map || !L) return;

    markersRef.current.forEach((l) => map.removeLayer(l));
    markersRef.current = [];

    filtered.forEach((prop) => {
      let color = '#94a3b8';
      if (viewMode === 'risk') color = getRiskColor(prop.riskScore);
      else if (viewMode === 'status') color = getStatusColor(prop.status);
      else if (viewMode === 'sumInsured') color = getSumInsuredColor(prop.sumInsured);
      else if (viewMode === 'type') color = getTypeColor(prop.type);

      const size = viewMode === 'risk' ? (prop.riskScore >= 70 ? 36 : prop.riskScore >= 40 ? 30 : 24) : 28;
      const innerContent = viewMode === 'risk' ? `${prop.riskScore}` : '';

      const html = `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.9);display:flex;align-items:center;justify-content:center;font-size:${size > 30 ? 11 : 10}px;font-weight:700;color:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.25)">${innerContent}</div>`;

      const icon = L.divIcon({ className: 'portfolio-marker', html, iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
      const marker = L.marker([prop.lat, prop.lng], { icon }).addTo(map);

      const riskColor = getRiskColor(prop.riskScore);
      const statusColor = getStatusColor(prop.status);
      marker.bindPopup(`<div style="color:#1e293b;min-width:220px;font-family:system-ui">
        <div style="font-weight:700;font-size:14px;margin-bottom:4px">${prop.name}</div>
        <div style="font-size:11px;color:#64748b;margin-bottom:8px">${prop.address}, ${prop.city}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">
          <div style="background:#f8fafc;border-radius:6px;padding:6px 8px;border:1px solid #e2e8f0">
            <div style="font-size:10px;color:#94a3b8">Risk Score</div>
            <div style="font-size:16px;font-weight:700;color:${riskColor}">${prop.riskScore}</div>
          </div>
          <div style="background:#f8fafc;border-radius:6px;padding:6px 8px;border:1px solid #e2e8f0">
            <div style="font-size:10px;color:#94a3b8">Status</div>
            <div style="font-size:12px;font-weight:600;color:${statusColor};text-transform:capitalize">${prop.status}</div>
          </div>
          <div style="background:#f8fafc;border-radius:6px;padding:6px 8px;border:1px solid #e2e8f0">
            <div style="font-size:10px;color:#94a3b8">Sum Insured</div>
            <div style="font-size:12px;font-weight:600">${formatAED(prop.sumInsured)}</div>
          </div>
          <div style="background:#f8fafc;border-radius:6px;padding:6px 8px;border:1px solid #e2e8f0">
            <div style="font-size:10px;color:#94a3b8">Type</div>
            <div style="font-size:12px;font-weight:600;text-transform:capitalize">${prop.type}</div>
          </div>
        </div>
        <div style="font-size:10px;color:#94a3b8">${prop.broker} • ${prop.constructionMaterial} • ${prop.floors}F • Built ${prop.yearBuilt}</div>
      </div>`, { maxWidth: 300 });

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

    if (filtered.length > 0) {
      const bounds = L.latLngBounds(filtered.map((p: any) => [p.lat, p.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }
  }, [filtered, viewMode, showLabels, ready]);

  return <div ref={mapRef} style={{ height: '450px', width: '100%' }} />;
}

export default function CommandCenterRiskMap() {
  const navigate = useNavigate();

  return (
    <div className="p-5 md:p-8 space-y-6 max-w-[1440px] mx-auto bg-gray-50 min-h-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Risk Map</h1>
        <p className="text-sm text-gray-500 mt-1">Geographic overview of portfolio risk</p>
      </div>

      {/* Map Container */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-8 text-center">
        <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-3" />
        <p className="text-gray-500">Portfolio-wide risk map — select a property to enter the immersive Risk View</p>
        
        {/* Property Buttons */}
        <div className="flex flex-wrap gap-2 justify-center mt-6">
          {mockProperties.map((prop) => (
            <button
              key={prop.id}
              onClick={() => navigate('submissions')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {prop.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
