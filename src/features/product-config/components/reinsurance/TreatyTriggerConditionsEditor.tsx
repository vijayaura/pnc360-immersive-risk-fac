import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Check, ChevronsUpDown, Layers2, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/shared/utils/lib-utils';
import type { TreatyTriggerCondition, TreatyRule } from './types';
import { genId } from './types';
import { getRatingParameters } from '@/features/product-config/pricing/api/ratings';
import type { RatingParameterDto } from '@/features/product-config/pricing/api/ratings';

// ─────────────────────────────────────────────────────────────────────────────
// Types & static parameters
// ─────────────────────────────────────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuidLike = (s?: string | null) => !!s && UUID_RE.test(s.trim());

type TriggerParameter = {
  id: string;
  label: string;
  type: 'number' | 'dropdown';
  options?: { label: string; value: string }[];
};

const STATIC_PARAMETERS: TriggerParameter[] = [
  { id: 'sumInsured', label: 'Sum Insured (AED)', type: 'number' },
  { id: 'premium', label: 'Premium Amount', type: 'number' },
];

const createDefaultCondition = (): TreatyTriggerCondition => ({
  id: genId('cond'),
  parameterId: 'sumInsured',
  operator: 'greaterThan',
  value: 0,
});

// Rules start empty — matches reference image
const createEmptyRule = (): TreatyRule => ({
  id: genId('rule'),
  conditions: [],
});

// ─────────────────────────────────────────────────────────────────────────────
// ConditionRow
// ─────────────────────────────────────────────────────────────────────────────

interface ConditionRowProps {
  condition: TreatyTriggerCondition;
  index: number;
  parameters: TriggerParameter[];
  isLoadingParams?: boolean;
  onUpdate: (updates: Partial<TreatyTriggerCondition>) => void;
  onRemove: () => void;
}

function ConditionRow({ condition, index, parameters, isLoadingParams, onUpdate, onRemove }: ConditionRowProps) {
  const param = parameters.find((p) => p.id === condition.parameterId);
  const [paramOpen, setParamOpen] = useState(false);

  // Local display state for thousand-separator formatting
  const [displayValue, setDisplayValue] = useState<string>(
    condition.value !== undefined && condition.value !== 0
      ? Number(condition.value).toLocaleString()
      : ''
  );

  // Sync display when condition.value changes from outside (e.g. parameter switch)
  useEffect(() => {
    setDisplayValue(
      condition.value !== undefined && condition.value !== 0
        ? Number(condition.value).toLocaleString()
        : ''
    );
  }, [condition.parameterId]);

  return (
    <div className="flex items-center gap-2 py-2 border-b last:border-b-0">
      <span className="text-xs text-muted-foreground w-8 shrink-0 font-medium">
        {index === 0 ? 'IF' : 'AND'}
      </span>

      {/* Parameter — searchable combobox */}
      <Popover open={paramOpen} onOpenChange={setParamOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={paramOpen}
            disabled={isLoadingParams}
            className="w-[170px] h-8 text-sm justify-between font-normal"
          >
            <span className="truncate">
              {isLoadingParams
                ? 'Loading...'
                : param?.label ?? 'Parameter'}
            </span>
            <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[220px] p-0" align="start" onWheel={(e) => e.stopPropagation()}>
          <Command>
            <CommandInput placeholder="Search parameters..." className="h-8" />
            <CommandList>
              <CommandEmpty>No parameter found.</CommandEmpty>
              <CommandGroup>
                {parameters.map((p) => (
                  <CommandItem
                    key={p.id}
                    value={p.label}
                    onSelect={() => {
                      onUpdate({
                        parameterId: p.id,
                        operator: p.type === 'number' ? 'greaterThan' : 'in',
                        value: p.type === 'number' ? 0 : (p.options?.[0]?.value ?? ''),
                      });
                      setParamOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-3.5 w-3.5',
                        condition.parameterId === p.id ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    {p.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Operator */}
      <Select
        value={condition.operator}
        onValueChange={(v) => onUpdate({ operator: v as TreatyTriggerCondition['operator'] })}
      >
        <SelectTrigger className="w-[80px] h-8 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="equals">=</SelectItem>
          <SelectItem value="notEquals">≠</SelectItem>
          <SelectItem value="greaterThan">&gt;</SelectItem>
          <SelectItem value="lessThan">&lt;</SelectItem>
          <SelectItem value="greaterThanOrEqual">≥</SelectItem>
          <SelectItem value="lessThanOrEqual">≤</SelectItem>
          <SelectItem value="in">in</SelectItem>
        </SelectContent>
      </Select>

      {/* Value */}
      {param?.type === 'dropdown' && param.options ? (
        <Select
          value={String(condition.value)}
          onValueChange={(v) => onUpdate({ value: v })}
        >
          <SelectTrigger className="w-[130px] h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {param.options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={(e) => {
            // Strip everything except digits and one leading minus
            const raw = e.target.value.replace(/[^0-9.-]/g, '');
            const formatted = raw.length > 4
              ? raw.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
              : raw;
            setDisplayValue(formatted);
            const num = parseFloat(raw);
            onUpdate({ value: isNaN(num) ? 0 : num });
          }}
          onBlur={() => {
            // Re-format with thousand separators on blur
            const num = parseFloat(String(condition.value));
            setDisplayValue(isNaN(num) || num === 0 ? '' : num.toLocaleString('en-US'));
          }}
          onFocus={() => {
            // Show formatted number on focus
            const num = Number(condition.value);
            setDisplayValue(isNaN(num) || num === 0 ? '' : num.toLocaleString('en-US'));
          }}
          className="w-[130px] h-8 text-sm"
          placeholder="0"
        />
      )}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive ml-auto shrink-0"
        onClick={onRemove}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RuleCard — matches reference image layout exactly
// ─────────────────────────────────────────────────────────────────────────────

interface RuleCardProps {
  rule: TreatyRule;
  index: number;
  parameters: TriggerParameter[];
  isLoadingParams?: boolean;
  onUpdateCondition: (condId: string, updates: Partial<TreatyTriggerCondition>) => void;
  onAddCondition: () => void;
  onRemoveCondition: (condId: string) => void;
  onRemoveRule: () => void;
  onSave: () => void;
  isSaved: boolean;
}

function RuleCard({
  rule,
  index,
  parameters,
  isLoadingParams,
  onUpdateCondition,
  onAddCondition,
  onRemoveCondition,
  onRemoveRule,
  onSave,
  isSaved,
}: RuleCardProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      {/* ── Rule header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Layers2 className="w-4 h-4 text-teal-600" />
          <span className="text-sm font-semibold text-foreground">Rule {index + 1}</span>
        </div>
        <button
          type="button"
          className="flex items-center gap-1.5 text-sm text-teal-600 hover:text-destructive transition-colors"
          onClick={onRemoveRule}
        >
          <Trash2 className="w-3.5 h-3.5" />
          Remove rule
        </button>
      </div>

      {/* ── Conditions area ── */}
      <div className="p-4">
        {/* Sub-header: title left, buttons right */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Conditions (all must match within this rule)
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Add multiple conditions</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-sm gap-1.5"
              onClick={onAddCondition}
            >
              <Plus className="w-3.5 h-3.5" />
              Add condition
            </Button>
            <Button
              type="button"
              size="sm"
              className={`h-8 text-sm gap-1.5 transition-all ${
                isSaved
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-teal-700 hover:bg-teal-800 text-white'
              }`}
              onClick={onSave}
            >
              {isSaved ? 'Saved ✓' : 'Save rule'}
            </Button>
          </div>
        </div>

        {/* Conditions list or empty state */}
        {rule.conditions.length === 0 ? (
          <p className="text-sm text-teal-600/80 py-2">
            No conditions yet. Use the button above to add one or more conditions.
          </p>
        ) : (
          <div>
            {rule.conditions.map((cond, idx) => (
              <ConditionRow
                key={cond.id}
                condition={cond}
                index={idx}
                parameters={parameters}
                isLoadingParams={isLoadingParams}
                onUpdate={(updates) => onUpdateCondition(cond.id, updates)}
                onRemove={() => onRemoveCondition(cond.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RulesSection
// ─────────────────────────────────────────────────────────────────────────────

type RuleType = 'inclusion' | 'exclusion';

interface RulesSectionProps {
  title: string;
  subtitle: string;
  rules: TreatyRule[];
  type: RuleType;
  parameters: TriggerParameter[];
  isLoadingParams?: boolean;
  savedRules: Set<string>;
  onAddRule: () => void;
  onRemoveRule: (ruleId: string) => void;
  onAddCondition: (ruleId: string) => void;
  onUpdateCondition: (ruleId: string, condId: string, updates: Partial<TreatyTriggerCondition>) => void;
  onRemoveCondition: (ruleId: string, condId: string) => void;
  onSaveRule: (ruleId: string) => void;
}

function RulesSection({
  title,
  subtitle,
  rules,
  parameters,
  isLoadingParams,
  savedRules,
  onAddRule,
  onRemoveRule,
  onAddCondition,
  onUpdateCondition,
  onRemoveCondition,
  onSaveRule,
}: RulesSectionProps) {
  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-sm gap-1.5 shrink-0"
          onClick={onAddRule}
        >
          <Plus className="w-3.5 h-3.5" />
          Add another rule
        </Button>
      </div>

      {/* Rule cards */}
      {rules.length > 0 && (
        <div className="space-y-3">
          {rules.map((rule, idx) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              index={idx}
              parameters={parameters}
              isLoadingParams={isLoadingParams}
              onUpdateCondition={(condId, updates) => onUpdateCondition(rule.id, condId, updates)}
              onAddCondition={() => onAddCondition(rule.id)}
              onRemoveCondition={(condId) => onRemoveCondition(rule.id, condId)}
              onRemoveRule={() => onRemoveRule(rule.id)}
              onSave={() => onSaveRule(rule.id)}
              isSaved={savedRules.has(rule.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  inclusionRules: TreatyRule[];
  exclusionRules: TreatyRule[];
  onUpdate: (updates: { inclusionRules?: TreatyRule[]; exclusionRules?: TreatyRule[] }) => void;
  productId?: string;
}

export function TreatyTriggerConditionsEditor({ inclusionRules, exclusionRules, onUpdate, productId }: Props) {
  const [savedRules, setSavedRules] = useState<Set<string>>(new Set());
  const [dynamicParams, setDynamicParams] = useState<TriggerParameter[]>([]);
  const [isLoadingParams, setIsLoadingParams] = useState(false);

  useEffect(() => {
    if (!productId) { setDynamicParams([]); return; }
    let cancelled = false;
    const fetchParams = async () => {
      setIsLoadingParams(true);
      try {
        const data: RatingParameterDto[] = await getRatingParameters(productId);
        if (cancelled) return;
        setDynamicParams(
          data
            .map((p): TriggerParameter | null => {
              const label = !isUuidLike(p.label)
                ? p.label
                : !isUuidLike(p.name)
                  ? p.name
                  : null;
              if (!label) return null;

              const normalizedOptions = p.options?.length
                ? p.options.map((o) =>
                    typeof o === 'string'
                      ? { label: o, value: o }
                      : { label: (o as { label: string; value: string }).label, value: (o as { label: string; value: string }).value }
                  )
                : undefined;

              return {
                id: p.name,
                label,
                type: (normalizedOptions?.length ? 'dropdown' : 'number') as 'dropdown' | 'number',
                options: normalizedOptions,
              };
            })
            .filter((p): p is TriggerParameter => p !== null),
        );
      } catch { if (!cancelled) setDynamicParams([]); }
      finally { if (!cancelled) setIsLoadingParams(false); }
    };
    fetchParams();
    return () => { cancelled = true; };
  }, [productId]);

  const parameters: TriggerParameter[] = [...STATIC_PARAMETERS, ...dynamicParams];

  const markSaved = useCallback((ruleId: string) => {
    setSavedRules((prev) => new Set(prev).add(ruleId));
    setTimeout(() => {
      setSavedRules((prev) => {
        const next = new Set(prev);
        next.delete(ruleId);
        return next;
      });
    }, 2000);
  }, []);

  // ── Inclusion helpers ──
  const addInclusionRule = () =>
    onUpdate({ inclusionRules: [...inclusionRules, createEmptyRule()] });

  const removeInclusionRule = (ruleId: string) =>
    onUpdate({ inclusionRules: inclusionRules.filter((r) => r.id !== ruleId) });

  const addInclusionCondition = (ruleId: string) =>
    onUpdate({
      inclusionRules: inclusionRules.map((r) =>
        r.id === ruleId ? { ...r, conditions: [...r.conditions, createDefaultCondition()] } : r
      ),
    });

  const updateInclusionCondition = (
    ruleId: string,
    condId: string,
    updates: Partial<TreatyTriggerCondition>
  ) =>
    onUpdate({
      inclusionRules: inclusionRules.map((r) =>
        r.id === ruleId
          ? { ...r, conditions: r.conditions.map((c) => (c.id === condId ? { ...c, ...updates } : c)) }
          : r
      ),
    });

  const removeInclusionCondition = (ruleId: string, condId: string) =>
    onUpdate({
      inclusionRules: inclusionRules.map((r) =>
        r.id === ruleId ? { ...r, conditions: r.conditions.filter((c) => c.id !== condId) } : r
      ),
    });

  // ── Exclusion helpers ──
  const addExclusionRule = () =>
    onUpdate({ exclusionRules: [...exclusionRules, createEmptyRule()] });

  const removeExclusionRule = (ruleId: string) =>
    onUpdate({ exclusionRules: exclusionRules.filter((r) => r.id !== ruleId) });

  const addExclusionCondition = (ruleId: string) =>
    onUpdate({
      exclusionRules: exclusionRules.map((r) =>
        r.id === ruleId ? { ...r, conditions: [...r.conditions, createDefaultCondition()] } : r
      ),
    });

  const updateExclusionCondition = (
    ruleId: string,
    condId: string,
    updates: Partial<TreatyTriggerCondition>
  ) =>
    onUpdate({
      exclusionRules: exclusionRules.map((r) =>
        r.id === ruleId
          ? { ...r, conditions: r.conditions.map((c) => (c.id === condId ? { ...c, ...updates } : c)) }
          : r
      ),
    });

  const removeExclusionCondition = (ruleId: string, condId: string) =>
    onUpdate({
      exclusionRules: exclusionRules.map((r) =>
        r.id === ruleId ? { ...r, conditions: r.conditions.filter((c) => c.id !== condId) } : r
      ),
    });

  return (
    <div className="space-y-6 pt-2 border-t">
      <RulesSection
        title="Inclusion rules (treaty triggered when any rule matches)"
        subtitle="Each rule has multiple conditions (all must match within the rule). Add multiple rules."
        rules={inclusionRules}
        type="inclusion"
        parameters={parameters}
        isLoadingParams={isLoadingParams}
        savedRules={savedRules}
        onAddRule={addInclusionRule}
        onRemoveRule={removeInclusionRule}
        onAddCondition={addInclusionCondition}
        onUpdateCondition={updateInclusionCondition}
        onRemoveCondition={removeInclusionCondition}
        onSaveRule={markSaved}
      />

      <div className="border-t" />

      <RulesSection
        title="Exclusion rules (treaty NOT eligible when any rule matches)"
        subtitle="Each rule has multiple conditions (all must match within the rule). Add multiple rules."
        rules={exclusionRules}
        type="exclusion"
        parameters={parameters}
        isLoadingParams={isLoadingParams}
        savedRules={savedRules}
        onAddRule={addExclusionRule}
        onRemoveRule={removeExclusionRule}
        onAddCondition={addExclusionCondition}
        onUpdateCondition={updateExclusionCondition}
        onRemoveCondition={removeExclusionCondition}
        onSaveRule={markSaved}
      />
    </div>
  );
}
