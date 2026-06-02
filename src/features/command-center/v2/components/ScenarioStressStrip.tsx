import React from 'react';

import {
  SlidersHorizontal,
  ThermometerSun,
  Truck,
  Wind,
  Zap,
} from 'lucide-react';

import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/shared/utils/lib-utils';

import { riskRoomChipClass, switchOnSolidPrimary } from './risk-room-chip';
import { useRiskRoom } from '../RiskRoomContext';
import { rr } from '../risk-room-theme';
import {
  formatAED,
  scenarioAdjustedAal,
  scenarioAdjustedScore,
  scenarioRatePerMille,
} from '../risk-room-data';
import type { ScenarioState } from '../types';

const OCCUPANCY_OPTIONS: { id: ScenarioState['occupancyMode']; label: string }[] = [
  { id: 'as-submitted', label: 'As submitted' },
  { id: 'vacancy-stress', label: 'Vacancy stress' },
  { id: 'peak-occupancy', label: 'Peak occupancy' },
];

export function ScenarioStressStrip() {
  const { property, scenario, setScenario } = useRiskRoom();

  const adjScore = scenarioAdjustedScore(property.riskScore, scenario);
  const adjAal = scenarioAdjustedAal(property.sumInsured, property.riskScore, scenario);
  const rate = scenarioRatePerMille(property.sumInsured, property.riskScore, scenario);
  const scoreDelta = adjScore - property.riskScore;
  const stressedSi = property.sumInsured * scenario.siMultiplier;

  return (
    <section className="border-t border-border bg-card">
      <div className="border-b border-border px-3 pb-3 pt-5 md:px-4 md:pt-6">
        <h2 className={rr.sectionTitle}>Experimental Underwriting</h2>
        <p className={cn('mt-1', rr.subtext)}>
          Stress assumptions and scenario controls before quote or referral
        </p>
      </div>

      <div className="px-3 py-3 md:px-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-foreground" />
          <div>
            <p className="text-sm font-bold text-foreground">Scenario stress lab</p>
            <p className="text-xs text-foreground">Experimental assumptions · live score & pricing impact</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <OutcomePill label="Score" value={String(adjScore)} delta={scoreDelta} />
          <OutcomePill label="AAL" value={formatAED(adjAal)} />
          <OutcomePill label="Rate" value={`${rate.toFixed(2)}‰`} />
          <OutcomePill label="Stressed TSI" value={formatAED(stressedSi)} subtle />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <ControlCell label={`Sum insured ± ${Math.round((scenario.siMultiplier - 1) * 100)}%`}>
          <Slider
            min={80}
            max={120}
            step={5}
            value={[Math.round(scenario.siMultiplier * 100)]}
            onValueChange={([v]) => setScenario((s) => ({ ...s, siMultiplier: v / 100 }))}
          />
        </ControlCell>

        <ControlCell label={`BI extension +${scenario.biExtensionDays} days`}>
          <Slider
            min={0}
            max={90}
            step={15}
            value={[scenario.biExtensionDays]}
            onValueChange={([v]) => setScenario((s) => ({ ...s, biExtensionDays: v }))}
          />
        </ControlCell>

        <ControlCell label={`Deductible ${scenario.deductiblePct}%`}>
          <Slider
            min={0}
            max={5}
            step={0.5}
            value={[scenario.deductiblePct]}
            onValueChange={([v]) => setScenario((s) => ({ ...s, deductiblePct: v }))}
          />
        </ControlCell>

        <ControlCell label="Occupancy mode">
          <div className="flex flex-wrap gap-1">
            {OCCUPANCY_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setScenario((s) => ({ ...s, occupancyMode: opt.id }))}
                className={cn(
                  riskRoomChipClass({
                    size: 'md',
                    tone: scenario.occupancyMode === opt.id ? 'default' : 'muted',
                  }),
                  'cursor-pointer hover:brightness-110',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </ControlCell>
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StressChip
          icon={Wind}
          label="Compound wind + flood"
          checked={scenario.compoundWindFlood}
          onChange={(v) => setScenario((s) => ({ ...s, compoundWindFlood: v }))}
        />
        <StressChip
          icon={DropletsIcon}
          label="Flood mitigation"
          checked={scenario.mitigationFlood}
          onChange={(v) => setScenario((s) => ({ ...s, mitigationFlood: v }))}
        />
        <StressChip
          icon={ThermometerSun}
          label="Heat wave +12°C"
          checked={scenario.heatWaveStress}
          onChange={(v) => setScenario((s) => ({ ...s, heatWaveStress: v }))}
        />
        <StressChip
          icon={Zap}
          label="Extreme wind gust"
          checked={scenario.windGustStress}
          onChange={(v) => setScenario((s) => ({ ...s, windGustStress: v }))}
        />
        <StressChip
          icon={Truck}
          label="Supply chain disruption"
          checked={scenario.supplyChainStress}
          onChange={(v) => setScenario((s) => ({ ...s, supplyChainStress: v }))}
        />
      </div>
      </div>
    </section>
  );
}

function DropletsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  );
}

function OutcomePill({
  label,
  value,
  delta,
  subtle,
}: {
  label: string;
  value: string;
  delta?: number;
  subtle?: boolean;
}) {
  return (
    <div
      className={cn(
        riskRoomChipClass({
          size: 'md',
          tone: subtle ? 'muted' : 'default',
          className: 'flex-col items-start rounded-lg px-3 py-2',
        }),
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-inherit opacity-90">{label}</p>
      <p className="text-xs font-bold tabular-nums text-inherit">
        {value}
        {delta != null && delta !== 0 && (
          <span className={cn('ml-1 text-xs font-semibold', delta > 0 ? 'text-red-700' : 'text-emerald-700')}>
            {delta > 0 ? '+' : ''}
            {delta}
          </span>
        )}
      </p>
    </div>
  );
}

function ControlCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={cn('px-3 py-2.5', rr.mutedPanel)}>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground">{label}</p>
      {children}
    </div>
  );
}

function StressChip({
  icon: Icon,
  label,
  checked,
  onChange,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 transition-colors',
        checked ? rr.solidPrimary : 'border-border bg-card text-foreground hover:border-primary/60',
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 text-inherit" />
      <span className="min-w-0 flex-1 text-xs font-medium leading-tight text-inherit">{label}</span>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        className={cn('shrink-0 scale-90', checked && switchOnSolidPrimary)}
      />
    </label>
  );
}
