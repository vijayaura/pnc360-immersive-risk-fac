import React, { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';

import { Brain, MapPin, Sparkles } from 'lucide-react';

import { cn } from '@/shared/utils/lib-utils';

import { useCommandCenterProperty } from '../context/CommandCenterContext';

const FLY_DURATION_S = 2.85;
const REVEAL_HOLD_MS = 1400;
const EXIT_MS = 900;
const BASEMAP_LOAD_FALLBACK_MS = 10000;
const POST_TILE_READY_PAUSE_MS = 450;

/**
 * Full-screen intro: CARTO light street map loads crisply at wide scale, then flies to the risk footprint,
 * then surfaces key stats before the main immersive UI takes over.
 */
export function CommandCenterMapIntro({ onComplete }: { onComplete: () => void }) {
  const { property } = useCommandCenterProperty();
  const mapElRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const [phase, setPhase] = useState<'boot' | 'diving' | 'landed' | 'exit'>('boot');
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    let loadFallbackTimer: ReturnType<typeof setTimeout> | null = null;
    let tileReadyTimer: ReturnType<typeof setTimeout> | null = null;
    let diveTimer: ReturnType<typeof setTimeout> | null = null;

    (async () => {
      const L = await import('leaflet');
      if (cancelled || !mapElRef.current) return;

      const el = mapElRef.current;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const map = L.map(el, {
        zoomControl: false,
        attributionControl: true,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        fadeAnimation: true,
        zoomAnimation: true,
      });

      const basemap = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        {
          attribution: '© OpenStreetMap © CARTO',
          subdomains: 'abcd',
          maxZoom: 20,
        },
      );
      basemap.addTo(map);

      mapRef.current = map;

      const startLat = property.lat + 18;
      const startLng = property.lng - 4;
      map.setView([startLat, startLng], 4, { animate: false });
      requestAnimationFrame(() => requestAnimationFrame(() => map.invalidateSize({ animate: false })));

      let diveStarted = false;
      const startDive = () => {
        if (cancelled || diveStarted) return;
        diveStarted = true;
        if (loadFallbackTimer) {
          clearTimeout(loadFallbackTimer);
          loadFallbackTimer = null;
        }
        setPhase('diving');
        map.flyTo([property.lat, property.lng], 16, { duration: FLY_DURATION_S, easeLinearity: 0.32 });

        const markerHtml = `<div class="cc-intro-pulse-wrap">
  <div class="cc-intro-pulse"></div>
  <div class="cc-intro-pin"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>
</div>`;
        const icon = L.divIcon({
          className: 'cc-intro-marker',
          html: markerHtml,
          iconSize: [56, 56],
          iconAnchor: [28, 48],
        });

        const finishDive = () => {
          if (cancelled) return;
          if (!mapRef.current) return;
          layerRef.current = L.marker([property.lat, property.lng], { icon, interactive: false }).addTo(
            mapRef.current,
          );
          setPhase('landed');
          exitTimerRef.current = setTimeout(() => {
            if (cancelled) return;
            setPhase('exit');
            completeTimerRef.current = setTimeout(() => {
              if (cancelled) return;
              onComplete();
            }, EXIT_MS);
          }, REVEAL_HOLD_MS);
        };

        diveTimer = window.setTimeout(finishDive, FLY_DURATION_S * 1000 + 380);
      };

      const scheduleDiveAfterTiles = () => {
        if (cancelled || diveStarted) return;
        if (tileReadyTimer) clearTimeout(tileReadyTimer);
        tileReadyTimer = window.setTimeout(() => {
          tileReadyTimer = null;
          if (cancelled || diveStarted) return;
          startDive();
        }, POST_TILE_READY_PAUSE_MS);
      };

      const onBasemapReady = () => {
        if (cancelled || diveStarted) return;
        scheduleDiveAfterTiles();
      };

      basemap.once('load', onBasemapReady);

      loadFallbackTimer = window.setTimeout(() => {
        loadFallbackTimer = null;
        if (cancelled || diveStarted) return;
        basemap.off('load', onBasemapReady);
        startDive();
      }, BASEMAP_LOAD_FALLBACK_MS);
    })();

    return () => {
      cancelled = true;
      if (loadFallbackTimer) clearTimeout(loadFallbackTimer);
      if (tileReadyTimer) clearTimeout(tileReadyTimer);
      if (diveTimer) clearTimeout(diveTimer);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
      if (completeTimerRef.current) clearTimeout(completeTimerRef.current);
      exitTimerRef.current = null;
      completeTimerRef.current = null;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [property.id, property.lat, property.lng, onComplete]);

  return (
    <>
      <style>{`
        .cc-intro-marker { background: transparent !important; border: none !important; }
        .cc-intro-pulse-wrap { position: relative; width: 56px; height: 56px; pointer-events: none; }
        .cc-intro-pulse {
          position: absolute; inset: 0; margin: auto; width: 48px; height: 48px; border-radius: 9999px;
          background: rgba(14, 165, 233, 0.35);
          animation: cc-pulse 1.6s ease-out infinite;
        }
        .cc-intro-pin {
          position: absolute; left: 50%; bottom: 2px; transform: translateX(-50%);
          filter: drop-shadow(0 4px 14px rgba(0,0,0,0.45));
        }
        @keyframes cc-pulse {
          0% { transform: scale(0.6); opacity: 0.95; }
          70% { transform: scale(1.35); opacity: 0; }
          100% { transform: scale(1.35); opacity: 0; }
        }
        @keyframes cc-fade-up {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes cc-bar {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
      `}</style>

      <div
        className={cn(
          'fixed inset-0 z-[70] flex flex-col bg-slate-950 transition-all duration-700 ease-out',
          phase === 'exit' && 'pointer-events-none scale-[1.03] opacity-0',
        )}
        aria-busy={phase !== 'exit'}
        aria-label="Loading immersive risk view"
      >
        <div ref={mapElRef} className="absolute inset-0 h-full w-full" />

        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-900/50 via-white/10 to-slate-900/40"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(15,23,42,0.55)_100%)]"
          aria-hidden
        />

        <div className="relative z-10 flex shrink-0 items-center gap-3 px-5 py-5 md:px-8">
          <div
            className={cn(
              'flex items-center gap-3 transition-all duration-700',
              phase === 'boot' && 'translate-y-2 opacity-0',
              (phase === 'diving' || phase === 'landed') && 'translate-y-0 opacity-100',
              phase === 'exit' && '-translate-y-2 opacity-0',
            )}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 shadow-lg ring-1 ring-white/20 backdrop-blur-md">
              <Brain className="h-6 w-6 text-sky-300" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-300/90">Immersive Risk</p>
              <p className="text-lg font-bold tracking-tight text-white md:text-xl">
                {phase === 'boot'
                  ? 'Loading map…'
                  : phase === 'landed' || phase === 'exit'
                    ? 'Opening risk file…'
                    : 'Locking coordinates…'}
              </p>
            </div>
          </div>
          <div className="ml-auto hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-sky-100/90 shadow-lg backdrop-blur-md sm:flex">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span className="font-medium">Loading map tiles</span>
          </div>
        </div>

        <div className="relative z-10 mt-auto flex flex-1 flex-col justify-end px-4 pb-6 md:px-8 md:pb-10">
          {phase === 'diving' && (
            <div className="mb-6 flex justify-center">
              <div className="h-1 w-48 overflow-hidden rounded-full bg-white/10 md:w-72">
                <div
                  className="h-full w-full origin-left rounded-full bg-gradient-to-r from-sky-500 via-cyan-300 to-sky-400"
                  style={{
                    animation: `cc-bar ${FLY_DURATION_S}s cubic-bezier(0.33, 1, 0.68, 1) forwards`,
                  }}
                />
              </div>
            </div>
          )}

          {(phase === 'landed' || phase === 'exit') && (
            <div
              className={cn(
                'mx-auto w-full max-w-2xl rounded-2xl border border-white/15 bg-slate-950/75 p-5 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl',
                phase === 'exit' && 'translate-y-8 scale-95 opacity-0 transition-all duration-700',
              )}
              style={{
                animation: phase === 'landed' ? 'cc-fade-up 0.65s cubic-bezier(0.22, 1, 0.36, 1) both' : undefined,
              }}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/20 text-sky-300">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-sky-300/80">Risk located</p>
                  <h2 className="mt-1 text-2xl font-bold leading-tight text-white">{property.name}</h2>
                  <p className="mt-1 text-sm text-slate-300">
                    {property.address}, {property.city}
                  </p>
                </div>
              </div>

              <div
                className="mt-5 grid grid-cols-2 gap-2 border-t border-white/10 pt-4"
                style={{ animation: 'cc-fade-up 0.55s 0.12s cubic-bezier(0.22, 1, 0.36, 1) both' }}
              >
                <IntroStat label="TSI" value={formatAEDShort(property.sumInsured)} />
                <IntroStat label="Score" value={String(property.riskScore)} />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function formatAEDShort(n: number) {
  if (n >= 1_000_000_000) return `AED ${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(1)}M`;
  return `AED ${(n / 1_000).toFixed(0)}K`;
}

function IntroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2">
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-0.5 truncate font-mono text-[11px] font-semibold text-white">{value}</p>
    </div>
  );
}
