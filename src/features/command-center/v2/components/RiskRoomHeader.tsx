import React from 'react';

import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Brain,
  ChevronDown,
  CloudRain,
  Droplets,
  FileText,
  Thermometer,
  Wind,
} from 'lucide-react';

import { cn } from '@/shared/utils/lib-utils';

import { rr } from '../risk-room-theme';
import { RiskRoomChip, renewalDeltaCardClass, riskRoomChipClass } from './risk-room-chip';
import { useLiveWeather, weatherCodeLabel } from '../hooks/useLiveWeather';
import { useRiskRoom } from '../RiskRoomContext';
import { formatAED } from '../risk-room-data';
import { RISK_LAYERS, type RenewalDelta } from '../types';

const LAYER_IDLE = rr.layerIdle;
const LAYER_ACTIVE = rr.layerActive;

export function RiskLayerBar() {
  const { activeLayer, selectRiskLayer } = useRiskRoom();

  return (
    <section className={cn('shrink-0 p-2.5 md:p-3', rr.card)}>
      <p className={cn('mb-2 px-0.5', rr.labelCaps)}>Risk dimensions</p>
      <div className="flex gap-2 overflow-x-auto pb-0.5 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {RISK_LAYERS.map((layer) => (
          <button
            key={layer.id}
            type="button"
            onClick={() => selectRiskLayer(layer.id)}
            className={cn(
              'min-w-[10.5rem] shrink-0 snap-start rounded-lg border px-3 py-2.5 text-left transition-all',
              activeLayer === layer.id ? LAYER_ACTIVE : LAYER_IDLE,
            )}
          >
            <p className="text-xs font-bold text-inherit">{layer.title}</p>
            <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-inherit opacity-90">{layer.description}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

export function RiskRoomHeader({
  onBack,
  briefOpen,
  onBriefToggle,
}: {
  onBack: () => void;
  briefOpen: boolean;
  onBriefToggle: () => void;
}) {
  const { property } = useRiskRoom();
  const { data: weather, isLoading } = useLiveWeather(property.lat, property.lng);

  const scoreTone = property.riskScore >= 70 ? 'text-red-200' : undefined;

  return (
    <header className={cn('shrink-0', rr.header)}>
      <div className="flex flex-wrap items-start gap-2 px-3 py-2.5 md:px-4">
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="inline-flex shrink-0 items-center rounded-md p-1 text-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="hidden h-8 w-px self-center bg-border sm:block" />

        <div className="min-w-0 flex-1 basis-full sm:basis-auto">
          <h1 className={rr.pageTitle}>Underwriting referral</h1>
          <p className={cn('mt-0.5 line-clamp-2', rr.body)}>{property.orientationSummary}</p>
        </div>

        <div className="hidden items-center gap-1.5 sm:ml-auto sm:flex">
          {[
            { label: 'TSI', value: formatAED(property.sumInsured) },
            { label: 'Score', value: String(property.riskScore), valueClass: scoreTone },
            { label: 'Share', value: `${property.shareOffered}%` },
          ].map((s) => (
            <RiskRoomChip key={s.label} tone="default" className="tabular-nums">
              <span className="font-medium text-inherit opacity-90">{s.label}</span>
              <span className={cn('font-semibold text-inherit', s.valueClass)}>{s.value}</span>
            </RiskRoomChip>
          ))}
        </div>

        <RiskRoomChip tone="default" size="md">
          Lead UW
        </RiskRoomChip>
      </div>

      <div className={cn('flex flex-wrap items-center gap-2 px-3 py-2 md:px-4', `border-t ${rr.divider}`)}>
        <RiskRoomChip tone="muted" size="md" className="uppercase tracking-wider">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/40" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Live
        </RiskRoomChip>

        {isLoading ? (
          <span className="text-xs text-foreground">Loading weather…</span>
        ) : weather ? (
          <>
            <LiveChip icon={Thermometer} label={`${Math.round(weather.temperatureC)}°C`} />
            <LiveChip icon={Wind} label={`${weather.windMs.toFixed(1)} m/s`} />
            <LiveChip icon={Droplets} label={`${weather.humidityPct}%`} />
            <LiveChip icon={CloudRain} label={weatherCodeLabel(weather.weatherCode)} />
          </>
        ) : null}

        <button
          type="button"
          onClick={onBriefToggle}
          className={cn(
            riskRoomChipClass({
              size: 'md',
              tone: 'muted',
              className: cn('ml-auto cursor-pointer', briefOpen && 'font-semibold text-primary'),
            }),
          )}
        >
          Risk brief
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', briefOpen && 'rotate-180')} />
        </button>
      </div>

      {briefOpen && (
        <div className={cn('space-y-2 px-3 py-2 md:px-4', `border-t ${rr.divider}`)}>
          <RiskSignalGroup
            title="Identified risks from proposal"
            icon={FileText}
            items={property.renewalDeltas.filter((d) => d.source === 'proposal')}
          />

          <RiskSignalGroup
            title="AI-identified risks"
            icon={Brain}
            items={property.renewalDeltas.filter((d) => d.source === 'ai')}
          />
        </div>
      )}
    </header>
  );
}

function RiskSignalGroup({
  title,
  icon: Icon,
  items,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: RenewalDelta[];
}) {
  if (items.length === 0) return null;

  return (
    <div>
      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        {title}
        <span className="font-normal normal-case tracking-normal text-foreground">· {items.length}</span>
      </p>
      <div className="flex gap-2 overflow-x-auto pb-0.5 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((d) => (
          <article
            key={d.label}
            title={`${d.label}: ${d.value}`}
            className={cn(
              'flex w-[min(152px,68vw)] shrink-0 snap-start flex-col rounded-lg border px-2.5 py-1.5 shadow-sm transition-colors hover:shadow-md',
              renewalDeltaCardClass(d),
            )}
          >
            <p className="truncate text-[10px] font-semibold leading-tight opacity-90">{d.label}</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs font-bold leading-tight">
              {d.direction === 'up' ? (
                <ArrowUp className="h-3 w-3 shrink-0 opacity-90" aria-hidden />
              ) : d.direction === 'down' ? (
                <ArrowDown className="h-3 w-3 shrink-0 opacity-90" aria-hidden />
              ) : null}
              <span className="truncate">{d.value}</span>
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}

function LiveChip({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <RiskRoomChip tone="muted" size="md" className="tabular-nums">
      <Icon className="h-3.5 w-3.5 text-foreground" />
      {label}
    </RiskRoomChip>
  );
}

export function TimelineScrubber() {
  const { property, timelineYear, setTimelineYear } = useRiskRoom();
  const years = property.timeline.map((t) => t.year);
  const min = Math.min(...years);
  const max = Math.max(...years);

  return (
    <div className={cn('px-3 py-4 md:px-4 md:py-5', rr.timeline)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className={rr.timelineLabel}>Time dimension</p>
        <p className="text-sm font-semibold text-white tabular-nums">{timelineYear}</p>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={timelineYear}
        onChange={(e) => setTimelineYear(Number(e.target.value))}
        className="h-1 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
      />
      <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {property.timeline
          .filter((t) => t.year <= timelineYear || t.kind === 'projection')
          .slice(-6)
          .map((ev) => (
            <button
              key={ev.id}
              type="button"
              onClick={() => setTimelineYear(ev.year)}
              className={cn(
                'shrink-0 rounded-md border px-2 py-1 text-left transition-colors',
                ev.year === timelineYear
                  ? 'border-primary bg-primary/20 text-white'
                  : 'border-slate-700 bg-slate-800/80 text-slate-200 hover:border-slate-600 hover:text-white',
              )}
            >
              <p className="text-xs font-bold">{ev.label}</p>
              <p className={rr.timelineMuted}>{ev.year}</p>
            </button>
          ))}
      </div>
    </div>
  );
}
