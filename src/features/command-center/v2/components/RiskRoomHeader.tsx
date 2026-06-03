import React from 'react';

import {
  ArrowLeft,
  Brain,
  Building2,
  CloudRain,
  Factory,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/shared/utils/lib-utils';

import { rr } from '../risk-room-theme';
import { RiskRoomChip } from './risk-room-chip';
import { useRiskRoom } from '../RiskRoomContext';
import { formatAED } from '../risk-room-data';
import { RISK_LAYERS, type RiskLayerId } from '../types';

const LAYER_ICONS: Record<RiskLayerId, LucideIcon> = {
  physical: Building2,
  environmental: CloudRain,
  operational: Factory,
  financial: TrendingUp,
  predictive: Brain,
};

const LAYER_CARD_STYLES: Record<
  (typeof RISK_LAYERS)[number]['accent'],
  { card: string; icon: string }
> = {
  sky: {
    card: 'border-sky-700 bg-sky-600 text-white',
    icon: 'bg-sky-500/50 text-white',
  },
  emerald: {
    card: 'border-emerald-700 bg-emerald-600 text-white',
    icon: 'bg-emerald-500/50 text-white',
  },
  amber: {
    card: 'border-amber-700 bg-amber-600 text-white',
    icon: 'bg-amber-500/50 text-white',
  },
  violet: {
    card: 'border-violet-700 bg-violet-600 text-white',
    icon: 'bg-violet-500/50 text-white',
  },
  indigo: {
    card: 'border-indigo-700 bg-indigo-600 text-white',
    icon: 'bg-indigo-500/50 text-white',
  },
};

export function RiskLayerBar() {
  const { activeLayer, selectRiskLayer } = useRiskRoom();

  return (
    <section className="shrink-0">
      <p className={cn('mb-3 px-0.5', rr.labelCaps)}>Risk dimensions</p>
      <div className="flex gap-3 overflow-x-auto overscroll-x-contain px-1 py-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {RISK_LAYERS.map((layer) => {
          const Icon = LAYER_ICONS[layer.id];
          const styles = LAYER_CARD_STYLES[layer.accent];
          const isActive = activeLayer === layer.id;

          return (
            <button
              key={layer.id}
              type="button"
              onClick={() => selectRiskLayer(layer.id)}
              className={cn(
                'group flex min-w-[11.5rem] shrink-0 snap-start flex-col rounded-xl border px-4 py-3.5 text-left shadow-sm transition-all',
                'hover:shadow-md hover:brightness-105',
                styles.card,
                isActive
                  ? 'z-10 shadow-lg ring-2 ring-inset ring-white/50 brightness-110'
                  : 'opacity-95 hover:opacity-100',
              )}
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-inner',
                    styles.icon,
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </div>
                {isActive && (
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                    Active
                  </span>
                )}
              </div>
              <p className="text-sm font-bold leading-tight text-white">{layer.title}</p>
              <p className="mt-1.5 line-clamp-2 text-xs leading-snug text-white/85">{layer.description}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function RiskRoomHeader({ onBack }: { onBack: () => void }) {
  const { property } = useRiskRoom();

  const scoreTone = property.riskScore >= 70 ? 'text-red-200' : undefined;

  return (
    <header className={cn('shrink-0', rr.header)}>
      <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 md:px-4">
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="inline-flex shrink-0 items-center rounded-md p-1 text-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="hidden h-8 w-px shrink-0 self-center bg-border sm:block" />

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

        <RiskRoomChip tone="default" size="md" className="hidden sm:inline-flex">
          Lead UW
        </RiskRoomChip>
      </div>
    </header>
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
