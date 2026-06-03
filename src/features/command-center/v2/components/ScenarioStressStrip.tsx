import React from 'react';

import {
  Droplets,
  RotateCcw,
  SlidersHorizontal,
  ThermometerSun,
  Truck,
  Wind,
  Zap,
} from 'lucide-react';

import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/shared/utils/lib-utils';

import { switchOnSolidPrimary } from './risk-room-chip';
import { useRiskRoom } from '../RiskRoomContext';
import { rr } from '../risk-room-theme';
import {
  formatAED,
  scenarioAdjustedAal,
  scenarioAdjustedScore,
  scenarioRatePerMille,
} from '../risk-room-data';
import type { ScenarioState } from '../types';
import { DEFAULT_SCENARIO } from '../types';

const OCCUPANCY_OPTIONS: { id: ScenarioState['occupancyMode']; label: string; hint: string }[] = [
  { id: 'as-submitted', label: 'As submitted', hint: 'Broker-declared occupancy' },
  { id: 'vacancy-stress', label: 'Vacancy stress', hint: 'Higher theft & deterioration load' },
  { id: 'peak-occupancy', label: 'Peak occupancy', hint: 'Event / seasonal peak exposure' },
];

const PERIL_STRESSES = [
  { key: 'compoundWindFlood' as const, icon: Wind, label: 'Compound wind + flood', hint: 'Correlated nat-cat event' },
  { key: 'mitigationFlood' as const, icon: Droplets, label: 'Flood mitigation', hint: 'Barriers & pumps in place' },
  { key: 'heatWaveStress' as const, icon: ThermometerSun, label: 'Heat wave +12°C', hint: 'MEP & BI stress' },
  { key: 'windGustStress' as const, icon: Zap, label: 'Extreme wind gust', hint: 'Cladding & roof plant' },
  { key: 'supplyChainStress' as const, icon: Truck, label: 'Supply chain disruption', hint: 'Extended BI / contingent BI' },
];

export function ScenarioStressStrip() {
  const { property, scenario, setScenario } = useRiskRoom();

  const adjScore = scenarioAdjustedScore(property.riskScore, scenario);
  const adjAal = scenarioAdjustedAal(property.sumInsured, property.riskScore, scenario);
  const rate = scenarioRatePerMille(property.sumInsured, property.riskScore, scenario);
  const scoreDelta = adjScore - property.riskScore;
  const stressedSi = property.sumInsured * scenario.siMultiplier;
  const siPct = Math.round((scenario.siMultiplier - 1) * 100);
  const activeStressCount = PERIL_STRESSES.filter(({ key }) => scenario[key]).length;

  const resetScenario = () => setScenario(DEFAULT_SCENARIO);

  return (
    <section className="border-t border-border bg-muted/20">
      <div className="border-b border-border px-3 pb-3 pt-5 md:px-4 md:pt-6">
        <h2 className={rr.sectionTitle}>Experimental underwriting</h2>
      </div>

      <div className="px-3 py-4 md:px-4 md:py-5">
        <div className={cn('overflow-hidden', rr.cardLg)}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 md:px-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-muted/60">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Scenario stress lab</p>
                <p className="text-xs text-muted-foreground">
                  Adjust assumptions to preview score, AAL, and rate before decision
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={resetScenario}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>

          <div className="grid grid-cols-2 gap-px border-b border-border bg-border lg:grid-cols-4">
            <ImpactMetric
              label="Risk score"
              value={String(adjScore)}
              detail={scoreDelta !== 0 ? `${scoreDelta > 0 ? '+' : ''}${scoreDelta} vs base ${property.riskScore}` : `Base ${property.riskScore}`}
              accent={scoreDelta > 0 ? 'warn' : scoreDelta < 0 ? 'good' : 'neutral'}
            />
            <ImpactMetric label="AAL" value={formatAED(adjAal)} detail="Scenario-adjusted" />
            <ImpactMetric label="Technical rate" value={`${rate.toFixed(2)}‰`} detail="Per mille on stressed TSI" />
            <ImpactMetric label="Stressed TSI" value={formatAED(stressedSi)} detail={siPct !== 0 ? `${siPct > 0 ? '+' : ''}${siPct}% vs submitted` : 'As submitted'} subtle />
          </div>

          <div className="grid gap-6 p-4 md:p-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="space-y-5">
              <div>
                <p className={rr.labelCaps}>Coverage assumptions</p>
                <div className="mt-3 space-y-4">
                  <SliderField
                    label="Sum insured"
                    valueLabel={`${siPct >= 0 ? '+' : ''}${siPct}% · ${formatAED(stressedSi)}`}
                    min={80}
                    max={120}
                    step={5}
                    value={Math.round(scenario.siMultiplier * 100)}
                    onChange={(v) => setScenario((s) => ({ ...s, siMultiplier: v / 100 }))}
                  />
                  <SliderField
                    label="BI extension"
                    valueLabel={`+${scenario.biExtensionDays} days`}
                    min={0}
                    max={90}
                    step={15}
                    value={scenario.biExtensionDays}
                    onChange={(v) => setScenario((s) => ({ ...s, biExtensionDays: v }))}
                  />
                  <SliderField
                    label="Deductible"
                    valueLabel={`${scenario.deductiblePct}%`}
                    min={0}
                    max={5}
                    step={0.5}
                    value={scenario.deductiblePct}
                    onChange={(v) => setScenario((s) => ({ ...s, deductiblePct: v }))}
                  />
                </div>
              </div>

              <div>
                <p className={rr.labelCaps}>Occupancy mode</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {OCCUPANCY_OPTIONS.map((opt) => {
                    const active = scenario.occupancyMode === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setScenario((s) => ({ ...s, occupancyMode: opt.id }))}
                        className={cn(
                          'rounded-xl border px-3 py-2.5 text-left transition-colors',
                          active
                            ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                            : 'border-border bg-background text-foreground hover:border-primary/50',
                        )}
                      >
                        <p className="text-xs font-bold">{opt.label}</p>
                        <p className={cn('mt-0.5 text-[10px] leading-snug', active ? 'text-primary-foreground/85' : 'text-muted-foreground')}>
                          {opt.hint}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-2">
                <p className={rr.labelCaps}>Peril stress scenarios</p>
                <span className="rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  {activeStressCount} active
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {PERIL_STRESSES.map(({ key, icon: Icon, label, hint }) => {
                  const checked = scenario[key];
                  return (
                    <label
                      key={key}
                      className={cn(
                        'flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 transition-colors',
                        checked
                          ? 'border-primary/40 bg-primary/5'
                          : 'border-border bg-background hover:border-primary/30',
                      )}
                    >
                      <div
                        className={cn(
                          'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                          checked ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-foreground">{label}</p>
                        <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">{hint}</p>
                      </div>
                      <Switch
                        checked={checked}
                        onCheckedChange={(v) => setScenario((s) => ({ ...s, [key]: v }))}
                        className={cn('mt-1 shrink-0', checked && switchOnSolidPrimary)}
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ImpactMetric({
  label,
  value,
  detail,
  accent = 'neutral',
  subtle,
}: {
  label: string;
  value: string;
  detail: string;
  accent?: 'neutral' | 'warn' | 'good';
  subtle?: boolean;
}) {
  return (
    <div className={cn('bg-card px-4 py-3 md:px-5', subtle && 'bg-muted/30')}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p
        className={cn(
          'mt-1 text-lg font-bold tabular-nums leading-none',
          accent === 'warn' ? 'text-red-600' : accent === 'good' ? 'text-emerald-600' : 'text-foreground',
        )}
      >
        {value}
      </p>
      <p className="mt-1.5 text-[10px] leading-snug text-muted-foreground">{detail}</p>
    </div>
  );
}

function SliderField({
  label,
  valueLabel,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  valueLabel: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 px-3 py-3">
      <div className="mb-2.5 flex items-baseline justify-between gap-2">
        <p className="text-xs font-semibold text-foreground">{label}</p>
        <p className="text-xs font-bold tabular-nums text-primary">{valueLabel}</p>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
      />
    </div>
  );
}
