/// <reference types="google.maps" />

import React, { useEffect, useRef, useState } from 'react';

import { Loader } from '@googlemaps/js-api-loader';
import { AlertCircle, ExternalLink, Loader2 } from 'lucide-react';

import { ENV } from '@/config/env';
import { cn } from '@/shared/utils/lib-utils';

import {
  GOOGLE_MAPS_LIBRARIES,
  GOOGLE_MAPS_PREVENT_FONTS_LOADING,
  GOOGLE_MAPS_SCRIPT_ID,
} from '@/shared/constants/googleMapsLoader';

type RenderMode = 'loading' | 'js' | 'embed' | 'legacy' | 'thumbnail';

export function googleStreetViewEmbedUrl(lat: number, lng: number, apiKey: string, heading = 270, pitch = 0) {
  const params = new URLSearchParams({
    key: apiKey,
    location: `${lat},${lng}`,
    heading: String(heading),
    pitch: String(pitch),
    fov: '90',
  });
  return `https://www.google.com/maps/embed/v1/streetview?${params.toString()}`;
}

/** Legacy svembed — no API key; coverage-dependent. */
export function legacyStreetViewEmbedUrl(lat: number, lng: number, heading = 270) {
  return `https://maps.google.com/maps?q=&layer=c&cbll=${lat},${lng}&cbp=12,${heading},0,0,5&output=svembed`;
}

export function streetViewThumbnailUrl(lat: number, lng: number, heading = 270) {
  const params = new URLSearchParams({
    cb_client: 'maps_sv.tactile',
    w: '1200',
    h: '800',
    pitch: '0',
    yaw: String(heading),
    thumbfov: '100',
    location: `${lat},${lng}`,
  });
  return `https://streetviewpixels-pa.googleapis.com/v1/thumbnail?${params.toString()}`;
}

export function streetViewExternalUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
}

const PROPERTY_VIEW: Record<string, { heading: number; pitch: number }> = {
  'prop-001': { heading: 328, pitch: 30 },
};

type StreetViewPanoramaProps = {
  lat: number;
  lng: number;
  heading?: number;
  pitch?: number;
  propertyId?: string;
  immersive?: boolean;
  className?: string;
  minHeight?: number;
  fill?: boolean;
};

export function StreetViewPanorama({
  lat,
  lng,
  heading,
  pitch,
  propertyId,
  immersive = false,
  className,
  minHeight = 480,
  fill = false,
}: StreetViewPanoramaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiKey = ENV.GOOGLE_MAPS_API_KEY.trim();
  const preset = propertyId ? PROPERTY_VIEW[propertyId] : undefined;
  const resolvedHeading = heading ?? preset?.heading ?? 270;
  const resolvedPitch = pitch ?? preset?.pitch ?? 0;

  const [mode, setMode] = useState<RenderMode>(apiKey ? 'loading' : 'legacy');

  useEffect(() => {
    if (!apiKey) {
      setMode('legacy');
      return;
    }

    let cancelled = false;
    setMode('loading');

    const loader = new Loader({
      apiKey,
      version: 'weekly',
      id: `${GOOGLE_MAPS_SCRIPT_ID}-streetview`,
      libraries: [...GOOGLE_MAPS_LIBRARIES],
      preventGoogleFontsLoading: GOOGLE_MAPS_PREVENT_FONTS_LOADING,
    });

    loader
      .load()
      .then(() => {
        if (cancelled || !containerRef.current || !window.google?.maps) {
          if (!cancelled) setMode('embed');
          return;
        }

        const service = new google.maps.StreetViewService();
        service.getPanorama({ location: { lat, lng }, radius: 2000 }, (data, status) => {
          if (cancelled || !containerRef.current) return;

          if (status !== google.maps.StreetViewStatus.OK || !data?.location?.latLng) {
            setMode('embed');
            return;
          }

          const panoHeading = data.tiles?.centerHeading ?? resolvedHeading;

          new google.maps.StreetViewPanorama(containerRef.current, {
            position: data.location.latLng,
            pov: { heading: panoHeading, pitch: resolvedPitch },
            zoom: 1,
            addressControl: !fill,
            linksControl: true,
            panControl: true,
            motionTracking: false,
            motionTrackingControl: false,
            enableCloseButton: false,
            fullscreenControl: true,
            showRoadLabels: false,
          });

          setMode('js');
        });
      })
      .catch(() => {
        if (!cancelled) setMode('embed');
      });

    return () => {
      cancelled = true;
    };
  }, [apiKey, lat, lng, resolvedHeading, resolvedPitch, fill]);

  const heightStyle = fill ? { height: '100%', minHeight: '100%' } : { minHeight };

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        !fill && 'rounded-2xl border',
        immersive ? 'border-white/10 bg-[#0a101c]' : 'border-slate-200 bg-white',
        fill && 'h-full border-0 bg-[#070b14]',
        className,
      )}
    >
      {(mode === 'loading' || mode === 'js') && (
        <div ref={containerRef} className="h-full w-full" style={heightStyle} aria-label="Street View panorama" />
      )}

      {mode === 'embed' && apiKey && (
        <iframe
          title="Street View panorama"
          src={googleStreetViewEmbedUrl(lat, lng, apiKey, resolvedHeading, resolvedPitch)}
          className="h-full w-full border-0"
          style={heightStyle}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
      )}

      {mode === 'legacy' && (
        <iframe
          title="Street View panorama"
          src={legacyStreetViewEmbedUrl(lat, lng, resolvedHeading)}
          className="h-full w-full border-0"
          style={heightStyle}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
      )}

      {mode === 'thumbnail' && (
        <a
          href={streetViewExternalUrl(lat, lng)}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative block h-full w-full"
          style={heightStyle}
        >
          <img
            src={streetViewThumbnailUrl(lat, lng, resolvedHeading)}
            alt="Street View preview"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#0a101c]/55">
            <ExternalLink className="h-8 w-8 text-sky-400" />
            <p className="text-sm font-semibold text-white">Open Street View in Google Maps</p>
          </div>
        </a>
      )}

      {mode === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#0a101c]/85 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          <p className="text-xs text-slate-400">Loading Street View panorama…</p>
        </div>
      )}

      {!apiKey && mode === 'legacy' && (
        <div className="absolute left-3 top-3 z-10 max-w-xs rounded-lg border border-amber-500/30 bg-amber-950/90 px-3 py-2 backdrop-blur-md">
          <div className="flex gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <p className="text-[11px] leading-snug text-amber-100/90">
              Add <code className="text-amber-200">VITE_GOOGLE_MAPS_API_KEY</code> for full interactive Street View.
            </p>
          </div>
        </div>
      )}

      <div
        className={cn(
          'absolute bottom-0 left-0 right-0 flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-[10px]',
          immersive || fill
            ? 'bg-gradient-to-t from-[#070b14]/90 to-transparent text-slate-500'
            : 'bg-gradient-to-t from-white to-transparent text-slate-600',
        )}
      >
        <span>
          {lat.toFixed(5)}, {lng.toFixed(5)}
          {mode === 'js' ? ' · Interactive Street View' : ' · Street View'}
        </span>
        <a
          href={streetViewExternalUrl(lat, lng)}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'inline-flex items-center gap-1 font-semibold',
            immersive || fill ? 'text-sky-400 hover:text-sky-300' : 'text-sky-700 hover:text-sky-800',
          )}
        >
          Open in Google Maps
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
