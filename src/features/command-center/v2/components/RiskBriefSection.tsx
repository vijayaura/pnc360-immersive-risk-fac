import React from 'react';

import { ArrowDown, ArrowUp, Brain, FileText } from 'lucide-react';

import { cn } from '@/shared/utils/lib-utils';

import { rr } from '../risk-room-theme';
import { riskBriefCardClass } from './risk-room-chip';
import type { RenewalDelta } from '../types';

function RiskBriefGroup({
  icon: Icon,
  title,
  subtitle,
  count,
  accentClass,
  iconClass,
  items,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  count: number;
  accentClass: string;
  iconClass: string;
  items: RenewalDelta[];
}) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className={cn('flex items-start gap-2 border-l-[3px] pl-2.5', accentClass)}>
        <div
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-background shadow-sm',
            iconClass,
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold leading-tight text-foreground">
            {title}
            <span className="ml-1 font-semibold tabular-nums text-muted-foreground">· {count}</span>
          </p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      <ul className="space-y-1.5">
        {items.map((delta, index) => (
          <li key={`${title}-${delta.label}`}>
            <RiskBriefCard delta={delta} index={index} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function RiskBriefCard({ delta: d, index }: { delta: RenewalDelta; index: number }) {
  return (
    <article
      title={`${d.label}: ${d.value}`}
      className={cn(
        'flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 shadow-sm',
        riskBriefCardClass(d, index),
      )}
    >
      <p className="min-w-0 flex-1 text-xs font-semibold leading-snug">{d.label}</p>
      <p className="flex shrink-0 items-center gap-1 text-xs font-bold leading-snug">
        {d.direction === 'up' ? (
          <ArrowUp className="h-3 w-3 opacity-80" aria-hidden />
        ) : d.direction === 'down' ? (
          <ArrowDown className="h-3 w-3 opacity-80" aria-hidden />
        ) : null}
        <span className="max-w-[9rem] truncate text-right sm:max-w-none">{d.value}</span>
      </p>
    </article>
  );
}

export function RiskBriefSection({ renewalDeltas }: { renewalDeltas: RenewalDelta[] }) {
  const proposal = renewalDeltas.filter((d) => d.source === 'proposal');
  const ai = renewalDeltas.filter((d) => d.source === 'ai');

  if (proposal.length === 0 && ai.length === 0) return null;

  return (
    <section className={cn('shrink-0 space-y-4 p-4', rr.cardLg)}>
      <p className={rr.labelCaps}>Risk brief</p>

      <RiskBriefGroup
        icon={FileText}
        title="Proposal"
        subtitle="Identified from submission"
        count={proposal.length}
        accentClass="border-emerald-500"
        iconClass="text-emerald-600"
        items={proposal}
      />

      {proposal.length > 0 && ai.length > 0 && <div className="h-px bg-border" />}

      <RiskBriefGroup
        icon={Brain}
        title="AI signals"
        subtitle="Model-enriched risks"
        count={ai.length}
        accentClass="border-violet-500"
        iconClass="text-violet-600"
        items={ai}
      />
    </section>
  );
}
