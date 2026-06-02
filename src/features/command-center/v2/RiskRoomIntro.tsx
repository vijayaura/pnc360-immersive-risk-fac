import React, { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';

import { Brain } from 'lucide-react';

import { cn } from '@/shared/utils/lib-utils';

import { useCommandCenterProperty } from '../context/CommandCenterContext';
import { CARTO_DARK } from './api/liveApis';
import {
  introPropertyKey,
  isIntroBasemapReady,
  markIntroBasemapReady,
  preloadIntroBasemapTiles,
} from './intro-map-cache';
import { formatAED, getRiskRoomProperty } from './risk-room-data';

const FLY_DURATION_S = 2.85;
const REVEAL_HOLD_MS = 1400;
const EXIT_MS = 900;
const BASEMAP_LOAD_FALLBACK_MS = 10000;
const POST_TILE_READY_PAUSE_MS = 450;
const BOOT_DELAY_MS = 800;
const BOOT_DELAY_CACHED_MS = 180;

export function RiskRoomIntro({ onComplete }: { onComplete: () => void }) {
  const { property: raw } = useCommandCenterProperty();
  const property = getRiskRoomProperty(raw);
  const propertyKey = introPropertyKey(property.lat, property.lng, property.id);
  const mapElRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [phase, setPhase] = useState<'boot' | 'diving' | 'landed' | 'exit'>('boot');
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void preloadIntroBasemapTiles(property.lat, property.lng);
  }, [property.lat, property.lng]);

  useEffect(() => {
    let cancelled = false;
    let loadFallbackTimer: ReturnType<typeof setTimeout> | null = null;
    let tileReadyTimer: ReturnType<typeof setTimeout> | null = null;
    let diveTimer: ReturnType<typeof setTimeout> | null = null;
    let bootTimer: ReturnType<typeof setTimeout> | null = null;

    const basemapCached = isIntroBasemapReady(propertyKey);
    const bootDelay = basemapCached ? BOOT_DELAY_CACHED_MS : BOOT_DELAY_MS;

    (async () => {
      await preloadIntroBasemapTiles(property.lat, property.lng);
      const L = await import('leaflet');
      if (cancelled || !mapElRef.current) return;

      const map = L.map(mapElRef.current, {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        fadeAnimation: true,
        zoomAnimation: true,
      });

      const basemap = L.tileLayer(CARTO_DARK, { subdomains: 'abcd', maxZoom: 20 });
      basemap.addTo(map);
      mapRef.current = map;

      map.setView([property.lat + 18, property.lng - 4], 4, { animate: false });
      requestAnimationFrame(() => requestAnimationFrame(() => map.invalidateSize({ animate: false })));

      let diveStarted = false;

      const finishDive = () => {
        if (cancelled) return;
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

      const startDive = () => {
        if (cancelled || diveStarted) return;
        diveStarted = true;
        if (loadFallbackTimer) {
          clearTimeout(loadFallbackTimer);
          loadFallbackTimer = null;
        }
        if (bootTimer) {
          clearTimeout(bootTimer);
          bootTimer = null;
        }

        setPhase('diving');
        map.flyTo([property.lat, property.lng], 16, { duration: FLY_DURATION_S, easeLinearity: 0.32 });
        markIntroBasemapReady(propertyKey);
        diveTimer = setTimeout(finishDive, FLY_DURATION_S * 1000 + 380);
      };

      const scheduleDiveAfterTiles = () => {
        if (cancelled || diveStarted) return;
        if (tileReadyTimer) clearTimeout(tileReadyTimer);
        tileReadyTimer = setTimeout(() => {
          tileReadyTimer = null;
          if (cancelled || diveStarted) return;
          bootTimer = setTimeout(startDive, bootDelay);
        }, basemapCached ? 0 : POST_TILE_READY_PAUSE_MS);
      };

      const onBasemapReady = () => {
        if (cancelled || diveStarted) return;
        scheduleDiveAfterTiles();
      };

      if (basemapCached) {
        scheduleDiveAfterTiles();
      } else {
        basemap.once('load', onBasemapReady);
        loadFallbackTimer = setTimeout(() => {
          loadFallbackTimer = null;
          if (cancelled || diveStarted) return;
          basemap.off('load', onBasemapReady);
          bootTimer = setTimeout(startDive, bootDelay);
        }, BASEMAP_LOAD_FALLBACK_MS);
      }
    })();

    return () => {
      cancelled = true;
      if (loadFallbackTimer) clearTimeout(loadFallbackTimer);
      if (tileReadyTimer) clearTimeout(tileReadyTimer);
      if (diveTimer) clearTimeout(diveTimer);
      if (bootTimer) clearTimeout(bootTimer);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
      if (completeTimerRef.current) clearTimeout(completeTimerRef.current);
      exitTimerRef.current = null;
      completeTimerRef.current = null;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [property.id, property.lat, property.lng, propertyKey, onComplete]);

  return (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex flex-col bg-[#070b14] text-sm antialiased transition-opacity duration-700',
        phase === 'exit' && 'pointer-events-none opacity-0',
      )}
      aria-label="Entering risk room"
    >
      <div ref={mapElRef} className="absolute inset-0 z-0 h-full w-full" />
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#070b14] via-[#070b14]/45 to-transparent" />

      <div className="relative z-20 flex flex-1 flex-col justify-end p-6 md:p-10">
        <div
          className={cn(
            'max-w-2xl transition-all duration-700',
            phase === 'boot' && 'translate-y-4 opacity-0',
            (phase === 'diving' || phase === 'landed') && 'translate-y-0 opacity-100',
          )}
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/20 ring-1 ring-indigo-400/40">
              <Brain className="h-5 w-5 text-indigo-300" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">Risk room</p>
              <p className="text-sm text-slate-400">Entering the footprint</p>
            </div>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Underwriting referral</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">{property.orientationSummary}</p>

          {phase === 'landed' && (
            <div className="mt-6 grid grid-cols-3 gap-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {[
                { label: 'TSI', value: formatAED(property.sumInsured) },
                { label: 'Score', value: String(property.riskScore) },
                { label: 'Floors', value: String(property.floors) },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 backdrop-blur-md"
                >
                  <p className="text-xs uppercase text-slate-500">{s.label}</p>
                  <p className="text-sm font-bold text-white">{s.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
