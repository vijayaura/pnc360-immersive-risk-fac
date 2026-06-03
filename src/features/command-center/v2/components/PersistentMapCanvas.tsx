import React, { useCallback, useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';

import {
  Crosshair,
  Layers,
  MapPin,
  Satellite,
  Telescope,
} from 'lucide-react';

import { cn } from '@/shared/utils/lib-utils';
import { useToast } from '@/shared/hooks/use-toast';

import { riskRoomChipClass } from './risk-room-chip';

import { StreetViewPanorama } from '../../components/StreetViewPanorama';

import { CARTO_LIGHT, ESRI_SATELLITE } from '../api/liveApis';
import { rr } from '../risk-room-theme';
import {
  RISK_INFRASTRUCTURE_LAYERS,
  type RiskInfrastructureKey,
  type SpatialPoi,
} from '../api/spatialUnderwriting';
import { useSpatialUnderwritingPois } from '../hooks/useSpatialUnderwritingPois';
import { MAP_LAYER_HELP, SPATIAL_VIEW_HELP } from '../map-layer-help';
import { useRiskRoom } from '../RiskRoomContext';
import { SPATIAL_TOAST_DURATION_MS } from '../spatial-toast';
import { MAP_LAYERS, type MapLayerId, type SpatialCanvasMode } from '../types';

const RING_RADII = [
  { m: 500, label: '500m' },
  { m: 2000, label: '2km' },
  { m: 10000, label: '10km' },
];

const POI_STYLE: Record<SpatialPoi['kind'], { color: string; icon: string }> = {
  fire_station: { color: '#ef4444', icon: '🚒' },
  hospital: { color: '#f472b6', icon: '🏥' },
  water: { color: '#0ea5e9', icon: '💧' },
  industrial: { color: '#737373', icon: '🏭' },
  construction: { color: '#f59e0b', icon: '🏗️' },
  nuclear: { color: '#eab308', icon: '☢️' },
  firezone: { color: '#ea580c', icon: '🔥' },
  chemical: { color: '#a855f7', icon: '⚗️' },
  airport: { color: '#64748b', icon: '✈️' },
};

const ZONE_KINDS = new Set<SpatialPoi['kind']>([
  'water',
  'industrial',
  'construction',
  'firezone',
  'chemical',
  'airport',
]);

function formatDistance(m?: number) {
  if (m == null) return '—';
  return `${Math.round(m)} m`;
}

function poiTooltip(poi: SpatialPoi) {
  if (poi.kind === 'water' || ZONE_KINDS.has(poi.kind)) {
    return [poi.name, poi.distanceM != null ? `${formatDistance(poi.distanceM)} from property` : null]
      .filter(Boolean)
      .join(' · ');
  }
  return [
    poi.name,
    poi.driveMin != null ? `${poi.driveMin} min drive` : null,
    poi.distanceM != null ? formatDistance(poi.distanceM) : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

function poiMarkerHtml(poi: SpatialPoi, selected: boolean) {
  const style = POI_STYLE[poi.kind];
  const size = selected ? 34 : 28;
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${style.color};border:2px solid ${selected ? '#fff' : 'rgba(255,255,255,0.85)'};box-shadow:0 0 ${selected ? 14 : 8}px ${style.color};display:flex;align-items:center;justify-content:center;font-size:${selected ? 14 : 12}px">${style.icon}</div>`;
}

function invalidateMapSize(map: { invalidateSize: (opts?: { animate?: boolean }) => void }) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      map.invalidateSize({ animate: false });
    });
  });
}

export function PersistentMapCanvas({ mapReady = true }: { mapReady?: boolean }) {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layersRef = useRef<any[]>([]);
  const LRef = useRef<any>(null);
  const [mapGeneration, setMapGeneration] = useState(0);

  const {
    property,
    mapLayers,
    toggleMapLayer,
    spatialCanvasMode,
    setSpatialCanvasMode,
    selectedClaimId,
    setSelectedClaimId,
    annotations,
    timelineYear,
  } = useRiskRoom();

  const { toast } = useToast();

  const showLayerToast = useCallback(
    (id: MapLayerId, enabling: boolean) => {
      const help = MAP_LAYER_HELP[id];
      toast({
        title: `${help.label} · ${enabling ? 'On' : 'Off'}`,
        description: help.explanation,
        duration: SPATIAL_TOAST_DURATION_MS,
      });
    },
    [toast],
  );

  const handleLayerToggle = useCallback(
    (id: MapLayerId) => {
      const enabling = !mapLayers.has(id);
      toggleMapLayer(id);
      showLayerToast(id, enabling);
    },
    [mapLayers, toggleMapLayer, showLayerToast],
  );

  const handleViewMode = useCallback(
    (mode: SpatialCanvasMode) => {
      setSpatialCanvasMode(mode);
      const help = SPATIAL_VIEW_HELP[mode];
      toast({
        title: help.label,
        description: help.explanation,
        duration: SPATIAL_TOAST_DURATION_MS,
      });
    },
    [setSpatialCanvasMode, toast],
  );

  const needsSpatialData =
    mapLayers.has('firestations') ||
    mapLayers.has('water') ||
    mapLayers.has('hospitals') ||
    RISK_INFRASTRUCTURE_LAYERS.some((l) => mapLayers.has(l.id as MapLayerId));

  const { data: spatialData } = useSpatialUnderwritingPois(
    property.lat,
    property.lng,
    needsSpatialData,
  );

  useEffect(() => {
    import('leaflet').then((mod) => {
      LRef.current = mod;
    });
  }, []);

  useEffect(() => {
    if (!mapReady || spatialCanvasMode === 'streetview' || !mapEl.current) return;

    let cancelled = false;

    (async () => {
      const L = LRef.current ?? (await import('leaflet'));
      if (cancelled || !mapEl.current) return;
      LRef.current = L;

      const el = mapEl.current;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const map = L.map(el, {
        center: [property.lat, property.lng],
        zoom: 16,
        zoomControl: false,
        attributionControl: true,
      });

      const tileUrl = spatialCanvasMode === 'satellite' ? ESRI_SATELLITE : CARTO_LIGHT;
      if (spatialCanvasMode === 'satellite') {
        L.tileLayer(tileUrl, { attribution: '© Esri', maxZoom: 19 }).addTo(map);
      } else {
        L.tileLayer(tileUrl, { attribution: '© OSM © CARTO', subdomains: 'abcd', maxZoom: 20 }).addTo(map);
      }
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapRef.current = map;
      setMapGeneration((g) => g + 1);
      invalidateMapSize(map);
      window.setTimeout(() => {
        if (!cancelled && mapRef.current === map) invalidateMapSize(map);
      }, 120);
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [property.lat, property.lng, spatialCanvasMode, mapReady]);

  useEffect(() => {
    if (!mapReady || spatialCanvasMode === 'streetview') return;
    const map = mapRef.current;
    if (map) invalidateMapSize(map);
  }, [mapReady, spatialCanvasMode]);

  useEffect(() => {
    if (!mapReady || spatialCanvasMode === 'streetview' || !mapEl.current) return;

    const el = mapEl.current;
    const observer = new ResizeObserver(() => {
      if (mapRef.current) mapRef.current.invalidateSize({ animate: false });
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, [mapReady, spatialCanvasMode]);

  useEffect(() => {
    if (!mapReady || spatialCanvasMode === 'streetview') return;
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L) return;

    layersRef.current.forEach((l) => map.removeLayer(l));
    layersRef.current = [];

    if (mapLayers.has('footprint')) {
      const footprint = L.circle([property.lat, property.lng], {
        radius: 85,
        color: '#38bdf8',
        fillColor: '#38bdf8',
        fillOpacity: 0.15,
        weight: 2,
      }).addTo(map);
      layersRef.current.push(footprint);
    }

    if (mapLayers.has('flood')) {
      const flood = L.circle([property.lat, property.lng], {
        radius: 400,
        color: '#22d3ee',
        fillColor: '#22d3ee',
        fillOpacity: property.floodZone ? 0.22 : 0.08,
        weight: 1,
        dashArray: '6 4',
      }).addTo(map);
      layersRef.current.push(flood);
    }

    if (mapLayers.has('wind')) {
      const wind = L.circle([property.lat, property.lng], {
        radius: 1200,
        color: '#a78bfa',
        fillColor: '#a78bfa',
        fillOpacity: property.nearCoast ? 0.14 : 0.07,
        weight: 1,
        dashArray: '4 6',
      }).addTo(map);
      layersRef.current.push(wind);
    }

    if (mapLayers.has('fire')) {
      const fire = L.circle([property.lat, property.lng], {
        radius: 650,
        color: '#fb923c',
        fillColor: '#fb923c',
        fillOpacity: property.nearIndustrial ? 0.16 : 0.06,
        weight: 1,
      }).addTo(map);
      layersRef.current.push(fire);
    }

    if (mapLayers.has('bi')) {
      RING_RADII.forEach(({ m }, i) => {
        const ring = L.circle([property.lat, property.lng], {
          radius: m,
          color: '#fbbf24',
          fillColor: 'transparent',
          weight: 1,
          opacity: 0.35 - i * 0.08,
        }).addTo(map);
        layersRef.current.push(ring);
      });
    }

    const addPoiMarkers = (pois: SpatialPoi[] | undefined, layerKey: MapLayerId, kind: SpatialPoi['kind']) => {
      if (!mapLayers.has(layerKey) || !pois) return;
      const style = POI_STYLE[kind];
      pois.forEach((poi, idx) => {
        const selected = idx === 0;
        const icon = L.divIcon({
          className: 'rr-poi-pin',
          html: poiMarkerHtml(poi, selected),
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });
        const marker = L.marker([poi.lat, poi.lng], { icon }).addTo(map);
        marker.bindTooltip(poiTooltip(poi), { direction: 'top', opacity: 0.95 });
        if (ZONE_KINDS.has(kind)) {
          const zoneRadius =
            kind === 'water'
              ? Math.min(350, Math.max(80, (poi.distanceM ?? 200) * 0.15))
              : kind === 'firezone'
                ? 500
                : kind === 'airport'
                  ? 800
                  : 400;
          const zone = L.circle([poi.lat, poi.lng], {
            radius: zoneRadius,
            color: style.color,
            fillColor: style.color,
            fillOpacity: kind === 'firezone' ? 0.14 : 0.08,
            weight: 1,
            dashArray: kind === 'water' ? '4 4' : undefined,
          }).addTo(map);
          layersRef.current.push(zone);
        }
        layersRef.current.push(marker);
      });
    };

    if (spatialData) {
      addPoiMarkers(spatialData.fireStations, 'firestations', 'fire_station');
      addPoiMarkers(spatialData.waterBodies, 'water', 'water');
      addPoiMarkers(spatialData.hospitals, 'hospitals', 'hospital');
      RISK_INFRASTRUCTURE_LAYERS.forEach(({ id }) => {
        addPoiMarkers(
          spatialData.riskInfrastructure[id as RiskInfrastructureKey],
          id as MapLayerId,
          id as SpatialPoi['kind'],
        );
      });
    }

    if (mapLayers.has('claims')) {
      property.geoClaims.forEach((claim) => {
        const claimYear = parseInt(claim.date.slice(0, 4), 10);
        if (claimYear > timelineYear) return;

        const color =
          claim.perilVariant === 'fire' ? '#ef4444' : claim.perilVariant === 'water' ? '#0ea5e9' : '#a855f7';
        const selected = selectedClaimId === claim.id;
        const html = `<div style="width:${selected ? 32 : 26}px;height:${selected ? 32 : 26}px;border-radius:50%;background:${color};border:2px solid ${selected ? '#fff' : 'rgba(255,255,255,0.8)'};box-shadow:0 0 ${selected ? 16 : 8}px ${color};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff">${claim.floor ?? '•'}</div>`;
        const icon = L.divIcon({ className: 'rr-claim-pin', html, iconSize: [32, 32], iconAnchor: [16, 16] });
        const marker = L.marker([claim.lat, claim.lng], { icon }).addTo(map);
        marker.on('click', () => setSelectedClaimId(claim.id));
        layersRef.current.push(marker);
      });
    }

    if (mapLayers.has('peers')) {
      property.peers.forEach((peer) => {
        const html = `<div style="width:22px;height:22px;border-radius:50%;background:#64748b;border:2px solid rgba(255,255,255,0.7);font-size:8px;font-weight:700;color:#fff;display:flex;align-items:center;justify-content:center">${peer.riskScore}</div>`;
        const icon = L.divIcon({ className: 'rr-peer-pin', html, iconSize: [22, 22], iconAnchor: [11, 11] });
        const m = L.marker([peer.lat, peer.lng], { icon }).addTo(map);
        m.bindTooltip(peer.name, { direction: 'top', opacity: 0.95 });
        layersRef.current.push(m);
      });
    }

    annotations.forEach((ann) => {
      const html = `<div style="max-width:120px;padding:4px 8px;border-radius:8px;background:rgba(15,23,42,0.92);border:1px solid rgba(99,102,241,0.5);color:#e2e8f0;font-size:9px;line-height:1.3">${ann.text.slice(0, 48)}…</div>`;
      const icon = L.divIcon({ className: 'rr-ann', html, iconAnchor: [0, 0] });
      const m = L.marker([ann.lat, ann.lng], { icon }).addTo(map);
      layersRef.current.push(m);
    });

    const pinHtml = `<div style="width:14px;height:14px;border-radius:50%;background:#6366f1;border:3px solid #fff;box-shadow:0 0 20px rgba(99,102,241,0.9)"></div>`;
    const pin = L.marker([property.lat, property.lng], {
      icon: L.divIcon({ className: 'rr-center', html: pinHtml, iconSize: [14, 14], iconAnchor: [7, 7] }),
      zIndexOffset: 1000,
    }).addTo(map);
    layersRef.current.push(pin);
  }, [
    property,
    mapLayers,
    selectedClaimId,
    setSelectedClaimId,
    annotations,
    timelineYear,
    spatialData,
    spatialCanvasMode,
    mapReady,
    mapGeneration,
  ]);

  return (
    <div className={cn('relative h-full min-h-[364px] w-full overflow-hidden', rr.mapFrame)}>
      {spatialCanvasMode === 'streetview' ? (
        <div className="absolute inset-0 z-[1]">
          <StreetViewPanorama
            lat={property.lat}
            lng={property.lng}
            propertyId={property.id}
            immersive
            fill
            className="h-full"
          />
        </div>
      ) : (
        <div ref={mapEl} className="absolute inset-0 z-0" />
      )}

      {spatialCanvasMode !== 'streetview' && (
        <div className={cn('pointer-events-none absolute inset-x-0 top-0 z-[400] px-4 pb-10 pt-3', rr.mapOverlay)}>
        <div className="pointer-events-auto space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={riskRoomChipClass({
                size: 'md',
                tone: 'default',
                className: 'uppercase tracking-wider backdrop-blur-md',
              })}
            >
              <Crosshair className="h-3.5 w-3.5 text-inherit" />
              Site map
            </span>
            {MAP_LAYERS.filter((l) => l.group === 'hazard').map((layer) => (
              <LayerChip key={layer.id} layer={layer} active={mapLayers.has(layer.id)} onToggle={handleLayerToggle} />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('text-[9px] font-bold uppercase tracking-widest', rr.labelCaps)}>Proximity</span>
            {MAP_LAYERS.filter((l) => l.group === 'proximity').map((layer) => (
              <LayerChip key={layer.id} layer={layer} active={mapLayers.has(layer.id)} onToggle={handleLayerToggle} />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('text-[9px] font-bold uppercase tracking-widest', rr.labelCaps)}>Risk infrastructure</span>
            {MAP_LAYERS.filter((l) => l.group === 'risk').map((layer) => (
              <LayerChip key={layer.id} layer={layer} active={mapLayers.has(layer.id)} onToggle={handleLayerToggle} />
            ))}
          </div>
        </div>
        </div>
      )}

      <div className="pointer-events-auto absolute bottom-3 left-3 z-[400] flex gap-2">
        <button
          type="button"
          onClick={() => handleViewMode('map')}
          className={cn(
            riskRoomChipClass({
              size: 'md',
              tone: spatialCanvasMode === 'map' ? 'layerActive' : 'layerIdle',
            }),
            'backdrop-blur-md',
          )}
        >
          <Layers className="h-3.5 w-3.5 text-inherit" /> Map
        </button>
        <button
          type="button"
          onClick={() => handleViewMode('satellite')}
          className={cn(
            riskRoomChipClass({
              size: 'md',
              tone: spatialCanvasMode === 'satellite' ? 'layerActive' : 'layerIdle',
            }),
            'backdrop-blur-md',
          )}
        >
          <Satellite className="h-3.5 w-3.5 text-inherit" /> Satellite
        </button>
        <button
          type="button"
          onClick={() => handleViewMode('streetview')}
          className={cn(
            riskRoomChipClass({
              size: 'md',
              tone: spatialCanvasMode === 'streetview' ? 'layerActive' : 'layerIdle',
            }),
            'backdrop-blur-md',
          )}
        >
          <Telescope className="h-3.5 w-3.5 text-inherit" /> Street View
        </button>
      </div>

      {spatialCanvasMode !== 'streetview' && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-[300] -translate-x-1/2 -translate-y-1/2">
          <MapPin className="h-8 w-8 text-gray-400/40" aria-hidden />
        </div>
      )}
    </div>
  );
}

function LayerChip({
  layer,
  active,
  onToggle,
}: {
  layer: (typeof MAP_LAYERS)[number];
  active: boolean;
  onToggle: (id: MapLayerId) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(layer.id)}
      className={cn(
        riskRoomChipClass({
          size: 'md',
          tone: active ? 'layerActive' : 'layerIdle',
        }),
        'backdrop-blur-md',
      )}
    >
      <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: layer.color }} />
      <span className="text-inherit">{layer.label}</span>
    </button>
  );
}