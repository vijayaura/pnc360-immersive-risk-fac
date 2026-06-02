import React from 'react';

import {
  Brain,
  Check,
  Link2,
  X,
} from 'lucide-react';


import { cn } from '@/shared/utils/lib-utils';

import { RiskRoomChip } from './risk-room-chip';
import { useRiskRoom } from '../RiskRoomContext';
import { rr } from '../risk-room-theme';
import {
  formatAED,
  scenarioAdjustedAal,
  scenarioAdjustedScore,
} from '../risk-room-data';

import { ContextWorkspace } from './ContextWorkspace';

function scoreColor(score: number) {
  if (score >= 70) return 'from-red-600 to-red-800 border-red-400/50';
  if (score >= 55) return 'from-orange-600 to-orange-800 border-orange-400/50';
  if (score >= 40) return 'from-amber-500 to-amber-700 border-amber-400/45';
  return 'from-emerald-600 to-emerald-800 border-emerald-400/45';
}

function factorBreakdown(score: number, floors: number, nearIndustrial: boolean, nearCoast: boolean) {
  return [
    { label: 'Structural & MEP', score: Math.min(100, score + (floors > 50 ? 8 : 0)) },
    { label: 'Fire & life safety', score: Math.min(100, score - 4 + (nearIndustrial ? 12 : 0)) },
    { label: 'NatCat & climate', score: Math.min(100, score + (nearCoast ? 10 : -2)) },
    { label: 'Business interruption', score: Math.min(100, score + 5) },
    { label: 'Security & access', score: Math.min(100, score - 8) },
  ];
}

export function InsightRail() {
  const {
    property,
    scenario,
    selectedClaimId,
    setSelectedClaimId,
  } = useRiskRoom();

  const adjScore = scenarioAdjustedScore(property.riskScore, scenario);
  const adjAal = scenarioAdjustedAal(property.sumInsured, property.riskScore, scenario);
  const factors = factorBreakdown(property.riskScore, property.floors, property.nearIndustrial, property.nearCoast);

  return (
    <aside className="flex flex-col gap-3 pb-4">
      <section className={cn('shrink-0 p-4', rr.cardLg)}>
        <p className={rr.labelCaps}>Composite risk</p>
        <div className="mt-3 flex items-center gap-4">
          <div
            className={cn(
              'flex h-16 w-16 items-center justify-center rounded-2xl border bg-gradient-to-br text-2xl font-bold text-white shadow-md',
              scoreColor(adjScore),
            )}
          >
            {adjScore}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Scenario-adjusted</p>
            <p className="text-xs text-foreground">Base {property.riskScore} · AAL {formatAED(adjAal)}</p>
          </div>
        </div>
        <div className="mt-4 space-y-2.5">
          {factors.map((f) => (
            <div key={f.label}>
              <div className="flex justify-between text-[11px]">
                <span className="text-foreground">{f.label}</span>
                <span className="font-semibold text-foreground">{f.score}</span>
              </div>
              <div className={cn('mt-1 h-1.5 overflow-hidden rounded-full', rr.progressTrack)}>
                <div className={cn('h-full rounded-full', rr.progressFill)} style={{ width: `${f.score}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {selectedClaimId && (
        <section className={cn('rounded-2xl border border-border p-4', rr.mutedPanel)}>
            {(() => {
            const c = property.geoClaims.find((x) => x.id === selectedClaimId);
            if (!c) return null;
            return (
              <>
                <p className={rr.labelCaps}>Selected claim pin</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{c.peril}</p>
                <p className="text-xs text-foreground">{c.description}</p>
                <p className="mt-2 text-xs text-foreground">{c.grossPaid} gross · Floor {c.floor}</p>
                <button
                  type="button"
                  onClick={() => setSelectedClaimId(null)}
                  className="mt-2 text-xs text-primary hover:text-primary/80"
                >
                  Clear selection
                </button>
              </>
            );
          })()}
        </section>
      )}

      <PeerBenchmarkStrip />
    </aside>
  );
}

export function EvidenceInsightsStrip() {
  const { property, insightStatuses, setInsightStatus } = useRiskRoom();

  return (
    <section className="border-t border-border bg-card px-3 py-5 md:px-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <div>
            <p className="text-sm font-bold text-foreground">Evidence-linked insights</p>
            <p className="text-xs text-foreground">Scroll horizontally · accept or dismiss with source lineage</p>
          </div>
        </div>
        <span className="hidden shrink-0 text-xs text-foreground sm:inline">
          {property.enrichedInsights.length} factors
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:thin] [scrollbar-color:rgba(0,0,0,0.15)_transparent] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300">
        {property.enrichedInsights.map((ins) => {
          const status = insightStatuses[ins.id] ?? ins.status;
          return (
            <article
              key={ins.id}
              className={cn(
                'flex w-[min(320px,85vw)] shrink-0 snap-start flex-col rounded-2xl border p-4 transition-colors',
                status === 'accepted'
                  ? 'border-emerald-700 bg-emerald-600 text-white'
                  : status === 'dismissed'
                    ? 'border-slate-400 bg-slate-500 text-white opacity-60'
                    : 'border-border bg-card text-foreground shadow-sm',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <RiskRoomChip
                  tone={
                    ins.severity === 'high' ? 'high' : ins.severity === 'medium' ? 'medium' : 'low'
                  }
                  className="uppercase"
                >
                  {ins.severity}
                </RiskRoomChip>
                <span
                  className={cn(
                    'text-[10px] tabular-nums',
                    status === 'pending' ? 'text-foreground' : 'text-white/90',
                  )}
                >
                  {ins.confidence}%
                </span>
              </div>

              <p
                className={cn(
                  'mt-3 flex-1 text-xs leading-relaxed',
                  status === 'pending' ? 'text-foreground' : 'text-white',
                )}
              >
                {ins.text}
              </p>
              <p
                className={cn(
                  'mt-2 text-xs font-medium',
                  status === 'pending' ? 'text-foreground' : 'text-white/90',
                )}
              >
                {ins.underwritingImpact}
              </p>

              <div className="mt-3 flex flex-wrap gap-1">
                {ins.sources.map((src) => (
                  <RiskRoomChip
                    key={src.id}
                    tone="muted"
                    className="max-w-full truncate"
                    title={`${src.label} · ${src.capturedAt}`}
                  >
                    <Link2 className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      {src.type}: {src.label.slice(0, 20)}
                      {src.page ? ` ${src.page}` : ''}
                    </span>
                  </RiskRoomChip>
                ))}
              </div>

              {status === 'pending' ? (
                <div className="mt-3 flex gap-2 border-t border-border pt-3">
                  <button
                    type="button"
                    onClick={() => setInsightStatus(ins.id, 'accepted')}
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    <Check className="h-3 w-3" /> Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => setInsightStatus(ins.id, 'dismissed')}
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-border py-1.5 text-xs text-foreground hover:border-primary/40 hover:bg-muted/50"
                  >
                    <X className="h-3 w-3" /> Dismiss
                  </button>
                </div>
              ) : (
                <p
                  className={cn(
                    'mt-3 border-t pt-3 text-xs font-semibold uppercase tracking-wide',
                    status === 'accepted' || status === 'dismissed'
                      ? 'border-white/25 text-white'
                      : 'border-border text-foreground',
                  )}
                >
                  {status}
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function PeerBenchmarkStrip() {
  const { property } = useRiskRoom();
  return (
    <section className={cn('p-4', rr.cardLg)}>
      <p className={rr.labelCaps}>Peer benchmark ghost</p>
      <ul className="space-y-2">
        {property.peers.map((p) => (
          <li key={p.id} className="flex items-center justify-between text-xs">
            <span className="truncate text-foreground">{p.name}</span>
            <span className="shrink-0 tabular-nums text-foreground">
              {p.riskScore} · {p.ratePerMille.toFixed(2)}‰
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-foreground">Toggle Peers on map to compare footprint cluster.</p>
    </section>
  );
}

export function ContextDrawer() {
  const { contextMode, property } = useRiskRoom();

  if (!contextMode) return null;

  const titles: Record<string, string> = {
    ground: 'Physical · Ground truth',
    perils: 'Environmental · Peril intelligence',
    experience: 'Operational · Occupancy & survey',
    pricing: 'Financial · Loss & pricing',
    predictive: 'Predictive · AI & scenarios',
  };

  return (
    <div className={cn('shrink-0 overflow-hidden shadow-md', rr.panel)}>
      <div className="border-b border-border px-3 py-2.5 md:px-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-foreground">{titles[contextMode]}</p>
          {contextMode === 'predictive' && (
            <p className="truncate text-[10px] text-foreground">{property.submissionHeat}</p>
          )}
        </div>
      </div>

      <div className="p-3 md:p-4">
        <ContextWorkspace />
      </div>
    </div>
  );
}
