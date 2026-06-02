import * as React from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/shared/utils/lib-utils';

import { rr } from '../risk-room-theme';
import type { RenewalDelta } from '../types';

/** App primary is light — dark foreground text on primary fills; white on saturated semantic fills. */
const SOLID_PRIMARY = rr.solidPrimary;

/** Portal-aligned chips — solid fills; readable text on every tone. */
export const riskRoomChipVariants = cva(
  'inline-flex items-center rounded-full border font-semibold transition-colors',
  {
    variants: {
      size: {
        default: 'gap-1.5 px-2.5 py-0.5 text-xs',
        md: 'gap-1.5 px-2.5 py-1 text-xs',
      },
      tone: {
        default: SOLID_PRIMARY,
        muted: 'border-border bg-muted text-foreground',
        primary: SOLID_PRIMARY,
        sky: 'border-sky-700 bg-sky-600 text-white',
        violet: 'border-violet-700 bg-violet-600 text-white',
        emerald: 'border-emerald-700 bg-emerald-600 text-white',
        red: 'border-red-700 bg-red-600 text-white',
        amber: 'border-amber-700 bg-amber-600 text-white',
        high: 'border-red-700 bg-red-600 text-white',
        medium: 'border-amber-700 bg-amber-600 text-white',
        low: 'border-slate-500 bg-slate-500 text-white',
        layerActive: `${SOLID_PRIMARY} shadow-sm`,
        layerIdle:
          'border-border bg-card text-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground',
      },
    },
    defaultVariants: {
      size: 'default',
      tone: 'default',
    },
  },
);

type ChipVariantProps = VariantProps<typeof riskRoomChipVariants>;

export function RiskRoomChip({
  className,
  size,
  tone,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & ChipVariantProps) {
  return <span className={cn(riskRoomChipVariants({ size, tone }), className)} {...props} />;
}

export function riskRoomChipClass({
  size,
  tone,
  className,
}: ChipVariantProps & { className?: string }) {
  return cn(riskRoomChipVariants({ size, tone }), className);
}

export function renewalDeltaTone(delta: RenewalDelta): NonNullable<ChipVariantProps['tone']> {
  if (delta.source === 'ai' && delta.impact === 'negative') return 'violet';
  if (delta.impact === 'negative') return 'red';
  if (delta.impact === 'positive') return 'emerald';
  return 'muted';
}

export function renewalDeltaCardClass(delta: RenewalDelta) {
  const tone = renewalDeltaTone(delta);
  switch (tone) {
    case 'red':
      return 'border-red-700 bg-red-600 text-white';
    case 'emerald':
      return 'border-emerald-700 bg-emerald-600 text-white';
    case 'violet':
      return 'border-violet-700 bg-violet-600 text-white';
    default:
      return 'border-border bg-muted text-foreground';
  }
}

/** Switch track/thumb that stays visible on a solid primary row. */
export const switchOnSolidPrimary =
  'data-[state=checked]:bg-primary-foreground/30 data-[state=unchecked]:bg-primary-foreground/15 [&>span]:bg-white [&>span]:data-[state=checked]:bg-primary-foreground';
