import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { FormattedNumberInput } from '@/components/ui/FormattedNumberInput';
import { normalizeOptions, type NormalizedOption } from '@/shared/utils/form-helpers';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, X } from 'lucide-react';
import type {
  ConditionalLogicConfig,
  ConditionalLogicRule,
  DropdownCalculationCondition,
  LegacyConditionalLogicConfig,
  Page,
} from '@/features/product-config/proposal-form/api/proposalFormDesign';
import {
  createConditionalLogicCombinationSubFieldAliases,
  createConditionalLogicCombinationSubFieldRef,
} from '@/features/proposals/utils/conditionalLogic';

type ConditionFieldOption = {
  label: string;
  value: string;
  aliases: string[];
  fieldType: string;
  options: NormalizedOption[];
};

const DATE_PERIOD_SEPARATOR = '::';

const NUMBER_COMPARISON_OPERATOR_OPTIONS: Array<{
  value: DropdownCalculationCondition['operator'];
  label: string;
}> = [
  { value: 'equals', label: 'Equal' },
  { value: 'not_equals', label: 'Not Equal' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'greater_than_or_equal', label: 'Greater Than Or Equal' },
  { value: 'less_than_or_equal', label: 'Less Than Or Equal' },
];

const NUMBER_RANGE_OPERATOR_OPTIONS: Array<{
  value: DropdownCalculationCondition['operator'];
  label: string;
}> = [
  { value: 'between', label: 'In Between' },
  { value: 'not_between', label: 'Not In Between' },
];

const DEFAULT_CONDITION = (): DropdownCalculationCondition => ({
  id: crypto.randomUUID(),
  field: '',
  operator: 'equals',
  numberMode: 'comparison',
  value: '',
  rangeFrom: undefined,
  rangeTo: undefined,
  selectedValues: [],
  selectionMode: 'single',
  defaultValue: undefined,
});

const DEFAULT_RULE = (): ConditionalLogicRule => ({
  id: crypto.randomUUID(),
  conditionMode: 'and',
  conditions: [DEFAULT_CONDITION()],
  result: 'show',
});

const DEFAULT_CONFIG = (): ConditionalLogicConfig => ({
  type: 'visibilityRules',
  rules: [DEFAULT_RULE()],
});

function isConditionalLogicConfig(
  conditionalLogic?: LegacyConditionalLogicConfig | ConditionalLogicConfig,
): conditionalLogic is ConditionalLogicConfig {
  return Boolean(
    conditionalLogic &&
      typeof conditionalLogic === 'object' &&
      'type' in conditionalLogic &&
      conditionalLogic.type === 'visibilityRules',
  );
}

function normalizeConditionalLogic(
  conditionalLogic?: LegacyConditionalLogicConfig | ConditionalLogicConfig,
): ConditionalLogicConfig {
  if (isConditionalLogicConfig(conditionalLogic)) {
    return {
      type: 'visibilityRules',
      rules:
        conditionalLogic.rules?.length > 0
          ? conditionalLogic.rules
          : DEFAULT_CONFIG().rules,
      fallbackResult: conditionalLogic.fallbackResult,
    };
  }

  if (conditionalLogic?.field) {
    return {
      type: 'visibilityRules',
      rules: [
        {
          id: crypto.randomUUID(),
          conditionMode: 'and',
          conditions: [
            {
              ...DEFAULT_CONDITION(),
              field: conditionalLogic.field,
              operator: (conditionalLogic.condition as DropdownCalculationCondition['operator']) || 'equals',
              value: conditionalLogic.value || '',
            },
          ],
          result: 'show',
        },
      ],
    };
  }

  return DEFAULT_CONFIG();
}

export function summarizeConditionalLogic(
  conditionalLogic?: LegacyConditionalLogicConfig | ConditionalLogicConfig,
): string {
  if (!conditionalLogic) return 'No conditional logic configured';

  if (!isConditionalLogicConfig(conditionalLogic)) {
    if (!conditionalLogic.field) return 'No conditional logic configured';
    return '1 visibility rule configured';
  }

  const ruleCount = conditionalLogic.rules?.length || 0;
  const hasFallback = Boolean(conditionalLogic.fallbackResult);
  if (!ruleCount && !hasFallback) return 'No conditional logic configured';
  return `${ruleCount} rule${ruleCount === 1 ? '' : 's'} configured${hasFallback ? ' + else' : ''}`;
}

interface ConditionalLogicDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value?: LegacyConditionalLogicConfig | ConditionalLogicConfig;
  onApply: (value: ConditionalLogicConfig | undefined) => void;
  pages: Page[];
  excludedFieldRefs?: string[];
  title?: string;
  description?: string;
}

export const ConditionalLogicDialog: React.FC<ConditionalLogicDialogProps> = ({
  open,
  onOpenChange,
  value,
  onApply,
  pages,
  excludedFieldRefs = [],
  title = 'Configure Conditional Logic',
  description = 'Create if / else if visibility rules to show or hide this field.',
}) => {
  const availableFields = React.useMemo<ConditionFieldOption[]>(() => {
    const excluded = new Set(excludedFieldRefs.filter(Boolean));
    return pages.flatMap((page) =>
      (page.sections || []).flatMap((section) =>
        (section.fields || [])
          .filter(
            (field) =>
              !excluded.has(field.id || '') &&
              !excluded.has(field.name) &&
              !['file', 'location'].includes(field.type),
          )
          .flatMap((field) => {
            if (field.type === 'combination' && field.subFields?.length) {
              const parentRef = (field.id as string) || field.name;
              return field.subFields
                .filter(
                  (subField) =>
                    !excluded.has(subField.id || '') &&
                    !excluded.has(subField.name) &&
                    !['file', 'location'].includes(subField.type),
                )
                .map((subField) => ({
                  label: `${subField.label} (${field.label})`,
                  value: createConditionalLogicCombinationSubFieldRef(
                    parentRef,
                    (subField.id as string) || subField.name,
                  ),
                  aliases: createConditionalLogicCombinationSubFieldAliases(
                    [field.id as string, field.name],
                    [subField.id as string, subField.name],
                  ),
                  fieldType: subField.type,
                  options: normalizeOptions(subField.options),
                }));
            }

            return [
              {
                label: section.title ? `${field.label} (${section.title})` : field.label,
                value: (field.id as string) || field.name,
                aliases: [field.id, field.name].filter(Boolean) as string[],
                fieldType: field.type,
                options: normalizeOptions(field.options),
              },
            ];
          }),
      ),
    );
  }, [excludedFieldRefs, pages]);

  const [tempConfig, setTempConfig] = React.useState<ConditionalLogicConfig>(DEFAULT_CONFIG);

  React.useEffect(() => {
    if (!open) return;
    setTempConfig(normalizeConditionalLogic(value));
  }, [open, value]);

  const getFieldMeta = React.useCallback(
    (fieldRef?: string) =>
      availableFields.find((field) => field.aliases.includes(fieldRef || '')) || null,
    [availableFields],
  );

  const parseDatePeriodValue = React.useCallback((value?: string | number) => {
    const raw = typeof value === 'string' ? value : '';
    const [startDate = '', endDate = ''] = raw.split(DATE_PERIOD_SEPARATOR);
    return { startDate, endDate };
  }, []);

  const getValuePlaceholder = React.useCallback(
    (
      fieldMeta: ConditionFieldOption | null,
      kind:
        | 'value'
        | 'rangeFrom'
        | 'rangeTo'
        | 'date'
        | 'datePeriodStart'
        | 'datePeriodEnd'
        | 'time'
        | 'chooseButton',
    ) => {
      const fieldLabel = fieldMeta?.label || 'field';

      switch (kind) {
        case 'rangeFrom':
          return `Enter minimum value`;
        case 'rangeTo':
          return `Enter maximum value`;
        case 'date':
          return `Select date`;
        case 'datePeriodStart':
          return `Select start date`;
        case 'datePeriodEnd':
          return `Select end date`;
        case 'time':
          return `Select time`;
        case 'chooseButton':
          return `Select option`;
        default:
          return `Enter value`;
      }
    },
    [],
  );

  const updateRule = (ruleIndex: number, updater: (rule: ConditionalLogicRule) => ConditionalLogicRule) => {
    setTempConfig((current) => ({
      ...current,
      rules: current.rules.map((rule, index) => (index === ruleIndex ? updater(rule) : rule)),
    }));
  };

  const updateCondition = (
    ruleIndex: number,
    conditionIndex: number,
    updater: (condition: DropdownCalculationCondition) => DropdownCalculationCondition,
  ) => {
    updateRule(ruleIndex, (rule) => ({
      ...rule,
      conditions: rule.conditions.map((condition, index) =>
        index === conditionIndex ? updater(condition) : condition,
      ),
    }));
  };

  const getReservedConditionOptionValues = React.useCallback(
    (fieldRef: string, ruleIndex: number, conditionIndex: number) => {
      if (!fieldRef) return new Set<string>();

      const reservedValues = new Set<string>();
      const currentRule = tempConfig.rules[ruleIndex];
      if (!currentRule) return reservedValues;

      currentRule.conditions.forEach((condition, currentConditionIndex) => {
        if (currentConditionIndex === conditionIndex) return;
        if (condition.field !== fieldRef) return;

        (condition.selectedValues || []).forEach((value) => reservedValues.add(String(value)));
      });

      return reservedValues;
    },
    [tempConfig.rules],
  );

  const getDropdownConditionUsageMeta = React.useCallback(
    (fieldRef: string, ruleIndex: number, conditionIndex: number) => {
      if (!fieldRef) {
        return { matchingCount: 0, isFirstMatch: true };
      }

      const matchingConditions: Array<{ ruleIndex: number; conditionIndex: number }> = [];
      const currentRule = tempConfig.rules[ruleIndex];
      if (!currentRule) {
        return { matchingCount: 0, isFirstMatch: true };
      }

      currentRule.conditions.forEach((condition, currentConditionIndex) => {
        if (condition.field !== fieldRef) return;
        matchingConditions.push({
          ruleIndex,
          conditionIndex: currentConditionIndex,
        });
      });

      const firstMatch = matchingConditions[0];
      const isFirstMatch =
        firstMatch?.ruleIndex === ruleIndex && firstMatch?.conditionIndex === conditionIndex;

      return {
        matchingCount: matchingConditions.length,
        isFirstMatch,
      };
    },
    [tempConfig.rules],
  );

  const isConditionComplete = React.useCallback(
    (condition: DropdownCalculationCondition) => {
      if (!condition.field) return false;
      const fieldMeta = getFieldMeta(condition.field);

      if (condition.numberMode === 'range') {
        return (
          typeof condition.rangeFrom === 'number' ||
          typeof condition.rangeTo === 'number'
        );
      }

      if (fieldMeta?.fieldType === 'dropdown') {
        if (condition.selectionMode === 'all') return true;
        if (condition.selectionMode === 'remaining') return true;
        if (condition.selectionMode === 'single') return (condition.selectedValues || []).length === 1;
        return (condition.selectedValues || []).length > 0;
      }

      if (fieldMeta?.fieldType === 'datePeriod') {
        const { startDate, endDate } = parseDatePeriodValue(condition.value);
        return Boolean(startDate || endDate);
      }

      return String(condition.value ?? '').trim() !== '';
    },
    [getFieldMeta, parseDatePeriodValue],
  );

  const isConfigComplete = React.useMemo(() => {
    const hasConfiguredRules = tempConfig.rules.some((rule) =>
      rule.conditions.some((condition) => Boolean(condition.field)),
    );

    if (!hasConfiguredRules && !tempConfig.fallbackResult) {
      return true;
    }

    return tempConfig.rules.every((rule) =>
      ((rule.conditionMode || 'and') === 'or'
        ? rule.conditions.some((condition) => isConditionComplete(condition))
        : rule.conditions.every((condition) => isConditionComplete(condition))),
    );
  }, [isConditionComplete, tempConfig.rules]);

  const renderSelectionEditor = (
    condition: DropdownCalculationCondition,
    availableOptions: NormalizedOption[],
    onChange: (condition: DropdownCalculationCondition) => void,
    options?: {
      autoSelectRemaining?: boolean;
      allowSelectAll?: boolean;
      helperText?: string;
    },
  ) => {
    const rawSelectedValues = (condition.selectedValues || []).map(String);
    const allowedSelectionModes: DropdownCalculationCondition['selectionMode'][] = [
      'single',
      'multiple',
      ...(options?.autoSelectRemaining ? (['remaining'] as const) : []),
      ...(options?.allowSelectAll ? (['all'] as const) : []),
    ];
    const selectionMode =
      allowedSelectionModes.find((mode) => mode === (condition.selectionMode || 'single')) ||
      'single';
    const selectedValuesList =
      selectionMode === 'all'
        ? availableOptions.map((option) => option.value)
        : selectionMode === 'remaining' && options?.autoSelectRemaining
          ? availableOptions
              .map((option) => option.value)
              .filter((value) => !rawSelectedValues.includes(value))
          : rawSelectedValues;
    const selectedValues = new Set(selectedValuesList);
    const selectedOptionItems = availableOptions.filter((option) =>
      selectedValues.has(option.value),
    );

    return (
      <div className="space-y-3">
        <div className="space-y-2">
          <Label>Selection Mode</Label>
          <Select
            value={selectionMode}
            onValueChange={(value) =>
              onChange({
                ...condition,
                selectionMode: value as DropdownCalculationCondition['selectionMode'],
                selectedValues: [],
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single option</SelectItem>
              <SelectItem value="multiple">Multiple option</SelectItem>
              {options?.autoSelectRemaining ? (
                <SelectItem value="remaining">Remaining option</SelectItem>
              ) : null}
              {options?.allowSelectAll ? <SelectItem value="all">All option</SelectItem> : null}
            </SelectContent>
          </Select>
          {options?.helperText ? (
            <p className="text-xs text-muted-foreground">{options.helperText}</p>
          ) : null}
        </div>

        {(selectionMode === 'remaining' && options?.autoSelectRemaining) ||
        selectionMode === 'all' ? (
          <div className="rounded-md border bg-background p-3 text-sm text-muted-foreground">
            {selectedValuesList.length > 0
              ? `${
                  selectionMode === 'all'
                    ? 'Auto-selected all options'
                    : 'Auto-selected remaining options'
                }: ${selectedOptionItems.map((option) => option.label).join(', ')}`
              : selectionMode === 'all'
                ? 'No options available.'
                : 'No remaining options available.'}
          </div>
        ) : (
          <div className="space-y-3">
            {selectedOptionItems.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedOptionItems.map((option) => (
                  <Badge key={option.value} variant="secondary" className="flex items-center gap-1">
                    <span>{option.label}</span>
                    <button
                      type="button"
                      className="rounded-sm hover:text-destructive"
                      onClick={() => {
                        const nextSelectedValues =
                          selectionMode === 'remaining' && options?.autoSelectRemaining
                            ? Array.from(new Set([...rawSelectedValues, option.value]))
                            : selectedValuesList.filter((value) => value !== option.value);
                        onChange({
                          ...condition,
                          selectedValues: nextSelectedValues,
                        });
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border bg-background p-3">
              {availableOptions.length === 0 ? (
                <p className="text-xs text-muted-foreground">No options available.</p>
              ) : (
                availableOptions.map((option) => (
                  <label key={option.value} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={selectedValues.has(option.value)}
                      onCheckedChange={(checked) => {
                        const nextValues = selectionMode === 'single' ? [] : [...selectedValuesList];
                        const filtered = nextValues.filter((value) => value !== option.value);
                        onChange({
                          ...condition,
                          selectedValues: checked ? [...filtered, option.value] : filtered,
                        });
                      }}
                    />
                    <span>{option.label}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderConditionEditor = (
    ruleIndex: number,
    condition: DropdownCalculationCondition,
    conditionIndex: number,
  ) => {
    const fieldMeta = getFieldMeta(condition.field);
    const fieldType = fieldMeta?.fieldType;
    const supportsRange = fieldType === 'number';
    const isDropdownField = fieldType === 'dropdown';
    const sourceOptions = fieldMeta?.options || [];
    const reservedSourceValues = getReservedConditionOptionValues(
      condition.field,
      ruleIndex,
      conditionIndex,
    );
    const { matchingCount: matchingConditionUsageCount, isFirstMatch } =
      getDropdownConditionUsageMeta(
      condition.field,
      ruleIndex,
      conditionIndex,
      );
    const selectableSourceOptions = sourceOptions.filter(
      (option) =>
        !reservedSourceValues.has(option.value) ||
        (condition.selectedValues || []).includes(option.value),
    );
    const resolvedNumberMode = condition.numberMode || 'comparison';
    const operatorOptions =
      fieldType === 'number'
        ? resolvedNumberMode === 'range'
          ? NUMBER_RANGE_OPERATOR_OPTIONS
          : NUMBER_COMPARISON_OPERATOR_OPTIONS
        : fieldType === 'date'
          ? [
              { value: 'equals', label: 'Equals' },
              { value: 'not_equals', label: 'Not Equals' },
              { value: 'greater_than', label: 'After' },
              { value: 'less_than', label: 'Before' },
              { value: 'greater_than_or_equal', label: 'On Or After' },
              { value: 'less_than_or_equal', label: 'On Or Before' },
            ]
          : fieldType === 'datePeriod'
            ? [
                { value: 'equals', label: 'Equals' },
                { value: 'not_equals', label: 'Not Equals' },
              ]
            : fieldType === 'time'
              ? [
                  { value: 'equals', label: 'Equals' },
                  { value: 'not_equals', label: 'Not Equals' },
                  { value: 'greater_than', label: 'After' },
                  { value: 'less_than', label: 'Before' },
                  { value: 'greater_than_or_equal', label: 'On Or After' },
                  { value: 'less_than_or_equal', label: 'On Or Before' },
                ]
          : fieldType === 'checkbox'
            ? [
                { value: 'equals', label: 'Equals' },
                { value: 'not_equals', label: 'Not Equals' },
              ]
            : fieldType === 'chooseButton'
              ? [
                  { value: 'equals', label: 'Equals' },
                  { value: 'not_equals', label: 'Not Equals' },
                ]
            : [
                { value: 'equals', label: 'Equals' },
                { value: 'not_equals', label: 'Not Equals' },
                { value: 'contains', label: 'Contains' },
                { value: 'not_contains', label: 'Not Contains' },
              ];
    const resolvedOperator = operatorOptions.some((option) => option.value === condition.operator)
      ? condition.operator
      : operatorOptions[0]?.value || 'equals';

    return (
      <div key={condition.id} className="space-y-3 rounded-lg border p-3">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
          <div className="space-y-2">
            <Label>Field</Label>
            <Select
              value={condition.field}
              onValueChange={(value) => {
                const nextFieldMeta = getFieldMeta(value);

                updateCondition(ruleIndex, conditionIndex, (current) => ({
                  ...DEFAULT_CONDITION(),
                  id: current.id,
                  field: value,
                  value: nextFieldMeta?.fieldType === 'checkbox' ? 'true' : '',
                }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select field" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto" scrollHeight="240px">
                {availableFields.map((field) => (
                  <SelectItem key={field.value} value={field.value}>
                    {field.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {supportsRange ? (
            <div className="space-y-2">
              <Label>Number Mode</Label>
              <Select
                value={resolvedNumberMode}
                onValueChange={(value) =>
                  updateCondition(ruleIndex, conditionIndex, (current) => ({
                    ...current,
                    numberMode: value as DropdownCalculationCondition['numberMode'],
                    operator:
                      value === 'range'
                        ? 'between'
                        : NUMBER_COMPARISON_OPERATOR_OPTIONS[0].value,
                    value: '',
                    rangeFrom: undefined,
                    rangeTo: undefined,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comparison">Single Value</SelectItem>
                  <SelectItem value="range">Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label>Condition</Label>
            <Select
              value={resolvedOperator}
              onValueChange={(value) =>
                updateCondition(ruleIndex, conditionIndex, (current) => ({
                  ...current,
                  operator: value as DropdownCalculationCondition['operator'],
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {operatorOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end justify-end">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-destructive"
              disabled={tempConfig.rules[ruleIndex]?.conditions.length === 1}
              onClick={() =>
                updateRule(ruleIndex, (rule) => ({
                  ...rule,
                  conditions:
                    rule.conditions.length > 1
                      ? rule.conditions.filter((_, index) => index !== conditionIndex)
                      : rule.conditions,
                }))
              }
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {supportsRange && resolvedNumberMode === 'range' ? (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>From</Label>
              <FormattedNumberInput
                value={condition.rangeFrom}
                allowEmpty
                placeholder={getValuePlaceholder(fieldMeta, 'rangeFrom')}
                onChange={(value) =>
                  updateCondition(ruleIndex, conditionIndex, (current) => ({
                    ...current,
                    rangeFrom: value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>To</Label>
              <FormattedNumberInput
                value={condition.rangeTo}
                allowEmpty
                placeholder={getValuePlaceholder(fieldMeta, 'rangeTo')}
                onChange={(value) =>
                  updateCondition(ruleIndex, conditionIndex, (current) => ({
                    ...current,
                    rangeTo: value,
                  }))
                }
              />
            </div>
          </div>
        ) : isDropdownField && fieldMeta ? (
          renderSelectionEditor(
            condition,
            selectableSourceOptions,
            (nextCondition) => updateCondition(ruleIndex, conditionIndex, () => nextCondition),
            {
              autoSelectRemaining: !isFirstMatch && matchingConditionUsageCount > 1,
              allowSelectAll: isFirstMatch,
              helperText:
                !isFirstMatch && matchingConditionUsageCount > 1
                  ? 'Options already used in other conditions inside this same rule are hidden here to avoid conflicts.'
                  : 'All option is available the first time this dropdown is used within a rule. Remaining option appears from the second use onward.',
            },
          )
        ) : fieldType === 'date' ? (
          <div className="space-y-2 flex flex-col">
            <Label>Value</Label>
            <DatePicker
              value={typeof condition.value === 'string' ? condition.value : ''}
              placeholder={getValuePlaceholder(fieldMeta, 'date')}
              className="max-w-[15rem]"
              onChange={(value) =>
                updateCondition(ruleIndex, conditionIndex, (current) => ({
                  ...current,
                  value: value || '',
                }))
              }
            />
          </div>
        ) : fieldType === 'datePeriod' ? (
          <div className="space-y-2">
            <Label>Value</Label>
            <div className="grid gap-3 md:grid-cols-2">
              <DatePicker
                value={parseDatePeriodValue(condition.value).startDate}
                onChange={(value) => {
                  const currentPeriod = parseDatePeriodValue(condition.value);
                  updateCondition(ruleIndex, conditionIndex, (current) => ({
                    ...current,
                    value: `${value || ''}${DATE_PERIOD_SEPARATOR}${currentPeriod.endDate}`,
                  }));
                }}
                placeholder={getValuePlaceholder(fieldMeta, 'datePeriodStart')}
              />
              <DatePicker
                value={parseDatePeriodValue(condition.value).endDate}
                onChange={(value) => {
                  const currentPeriod = parseDatePeriodValue(condition.value);
                  updateCondition(ruleIndex, conditionIndex, (current) => ({
                    ...current,
                    value: `${currentPeriod.startDate}${DATE_PERIOD_SEPARATOR}${value || ''}`,
                  }));
                }}
                placeholder={getValuePlaceholder(fieldMeta, 'datePeriodEnd')}
              />
            </div>
          </div>
        ) : fieldType === 'time' ? (
          <div className="space-y-2">
            <Label>Value</Label>
            <TimePicker
              value={String(condition.value ?? '')}
              placeholder={getValuePlaceholder(fieldMeta, 'time')}
              className="max-w-[15rem]"
              onChange={(time) =>
                updateCondition(ruleIndex, conditionIndex, (current) => ({
                  ...current,
                  value: time,
                }))
              }
            />
          </div>
        ) : fieldType === 'checkbox' ? (
          <div className="space-y-2">
            <Label>Value</Label>
            <Select
              value={String(condition.value ?? 'true')}
              onValueChange={(value) =>
                updateCondition(ruleIndex, conditionIndex, (current) => ({
                  ...current,
                  value,
                }))
              }
            >
              <SelectTrigger className="max-w-[15rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Is checked</SelectItem>
                <SelectItem value="false">Is not checked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : fieldType === 'chooseButton' && fieldMeta ? (
          <div className="space-y-2">
            <Label>Value</Label>
            <Select
              value={String(condition.value ?? '')}
              onValueChange={(value) =>
                updateCondition(ruleIndex, conditionIndex, (current) => ({
                  ...current,
                  value,
                }))
              }
            >
              <SelectTrigger className="max-w-[15rem]">
                <SelectValue placeholder={getValuePlaceholder(fieldMeta, 'chooseButton')} />
              </SelectTrigger>
              <SelectContent>
                {fieldMeta.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Value</Label>
            {fieldType === 'number' ? (
              <FormattedNumberInput
                value={typeof condition.value === 'number' ? condition.value : undefined}
                allowEmpty
                className="max-w-[15rem]"
                placeholder={getValuePlaceholder(fieldMeta, 'value')}
                onChange={(value) =>
                  updateCondition(ruleIndex, conditionIndex, (current) => ({
                    ...current,
                    value: value ?? '',
                  }))
                }
              />
            ) : (
              <Input
                type="text"
                value={String(condition.value ?? '')}
                className="max-w-[15rem]"
                placeholder={getValuePlaceholder(fieldMeta, 'value')}
                onChange={(event) =>
                  updateCondition(ruleIndex, conditionIndex, (current) => ({
                    ...current,
                    value: event.target.value,
                  }))
                }
              />
            )}
          </div>
        )}
      </div>
    );
  };

  const handleApply = () => {
    const hasConfiguredRules = tempConfig.rules.some((rule) =>
      rule.conditions.some((condition) => Boolean(condition.field)),
    );
    if (!hasConfiguredRules && !tempConfig.fallbackResult) {
      onApply(undefined);
    } else {
      onApply(tempConfig);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[980px]"
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="max-h-[70vh] space-y-5 overflow-y-auto py-2">
          {tempConfig.rules.map((rule, ruleIndex) => (
            <div
              key={rule.id}
              className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_8px_24px_rgba(15,23,42,0.05)]"
            >
              <div className="border-b border-primary/10 bg-gradient-to-r from-primary/[0.08] via-primary/[0.04] to-transparent px-5 py-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-foreground shadow-sm">
                        {ruleIndex === 0 ? 'IF' : `ELSE IF ${ruleIndex}`}
                      </span>
                      <span className="text-sm font-medium text-muted-foreground">
                        Rule {ruleIndex + 1}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Configure the conditions for this visibility rule, then choose whether the
                      field should be shown or hidden when it matches.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 text-destructive"
                    disabled={tempConfig.rules.length === 1}
                    onClick={() =>
                      setTempConfig((current) => ({
                        ...current,
                        rules:
                          current.rules.length > 1
                            ? current.rules.filter((_, index) => index !== ruleIndex)
                            : current.rules,
                      }))
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-5 p-5">
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(240px,0.8fr)]">
                  <div className="space-y-4">
                    <div className="rounded-xl border border-primary/10 bg-background p-4 shadow-sm">
                      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold">Conditions</h4>
                          <p className="text-xs text-muted-foreground">
                            Choose whether all conditions must match or any one condition can
                            match.
                          </p>
                        </div>
                        <div className="w-full space-y-2 md:max-w-[220px]">
                          <Select
                            value={rule.conditionMode || 'and'}
                            onValueChange={(value) =>
                              updateRule(ruleIndex, (current) => ({
                                ...current,
                                conditionMode: value as 'and' | 'or',
                              }))
                            }
                          >
                            <SelectTrigger className="h-10 bg-muted/30">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="and">AND</SelectItem>
                              <SelectItem value="or">OR</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {rule.conditions.map((condition, conditionIndex) =>
                        renderConditionEditor(ruleIndex, condition, conditionIndex),
                      )}
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        updateRule(ruleIndex, (current) => ({
                          ...current,
                          conditions: [...current.conditions, DEFAULT_CONDITION()],
                        }))
                      }
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Condition
                    </Button>
                  </div>

                  <div className="space-y-3 rounded-xl border border-primary/10 bg-gradient-to-b from-primary/[0.04] to-background p-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold">Then Result</h4>
                      <p className="text-xs text-muted-foreground">
                        Choose how this field should behave when the rule matches.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Visibility Result
                      </Label>
                      <Select
                        value={rule.result}
                        onValueChange={(value) =>
                          updateRule(ruleIndex, (current) => ({
                            ...current,
                            result: value as ConditionalLogicRule['result'],
                          }))
                        }
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="show">Show Field</SelectItem>
                          <SelectItem value="hide">Hide Field</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-start">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setTempConfig((current) => ({
                  ...current,
                  rules: [...current.rules, DEFAULT_RULE()],
                }))
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Else If
            </Button>
          </div>

          <div className="rounded-2xl border border-dashed border-primary/20 bg-gradient-to-r from-muted/40 via-background to-background p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-primary/20 bg-background px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                    ELSE
                  </span>
                  <h4 className="text-sm font-semibold">Fallback Result</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Used when no earlier visibility rule matches.
                </p>
              </div>

              {tempConfig.fallbackResult ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() =>
                    setTempConfig((current) => ({
                      ...current,
                      fallbackResult: undefined,
                    }))
                  }
                >
                  Remove Else
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setTempConfig((current) => ({
                      ...current,
                      fallbackResult: 'show',
                    }))
                  }
                >
                  Add Else
                </Button>
              )}
            </div>

            {tempConfig.fallbackResult ? (
              <div className="mt-4 max-w-sm space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Visibility Result
                </Label>
                <Select
                  value={tempConfig.fallbackResult}
                  onValueChange={(value) =>
                    setTempConfig((current) => ({
                      ...current,
                      fallbackResult: value as ConditionalLogicConfig['fallbackResult'],
                    }))
                  }
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="show">Show Field</SelectItem>
                    <SelectItem value="hide">Hide Field</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setTempConfig(DEFAULT_CONFIG());
            }}
          >
            Clear Conditional Logic
          </Button>
          <Button type="button" disabled={!isConfigComplete} onClick={handleApply}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
