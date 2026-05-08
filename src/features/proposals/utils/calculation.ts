import {
  differenceInCalendarDays,
  differenceInMonths,
  differenceInYears,
  parseISO,
  startOfDay,
} from 'date-fns';
import type {
  ArithmeticCalculationConfig,
  CalculationConfig,
  DateCalculationConfig,
  DropdownCalculationResult,
  DropdownConditionalCalculationConfig,
} from '@/features/product-config/proposal-form/api/proposalFormDesign';
import type { NormalizedOption } from '@/shared/utils/form-helpers';

type ResolveCalculationValue = (fieldRef: string) => unknown;

function hasResolvedCalculationValue(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  if (value instanceof Date) return !Number.isNaN(value.getTime());

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const preferredValue = record.value ?? record.label ?? record.id;
    if (preferredValue !== undefined) {
      return hasResolvedCalculationValue(preferredValue);
    }
  }

  return true;
}

function parseDateValue(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : startOfDay(value);
  }

  const raw = String(value).trim();
  if (!raw) return null;

  if (/^\d{4}$/.test(raw)) {
    const parsed = new Date(Number(raw), 0, 1);
    return Number.isNaN(parsed.getTime()) ? null : startOfDay(parsed);
  }

  const normalized = raw.includes('T') ? raw : `${raw}T00:00:00`;
  const parsed = parseISO(normalized);
  return Number.isNaN(parsed.getTime()) ? null : startOfDay(parsed);
}

export function isDateCalculationConfig(
  calculation?: CalculationConfig,
): calculation is DateCalculationConfig {
  return calculation?.type === 'date';
}

export function isArithmeticCalculationConfig(
  calculation?: CalculationConfig,
): calculation is ArithmeticCalculationConfig {
  return Boolean(calculation) && (calculation.type === 'arithmetic' || calculation.type === undefined);
}

export function isDropdownConditionalCalculationConfig(
  calculation?: CalculationConfig,
): calculation is DropdownConditionalCalculationConfig {
  return calculation?.type === 'dropdownConditional';
}

export function getCalculationTargetField(calculation?: CalculationConfig): string {
  if (!calculation || isDropdownConditionalCalculationConfig(calculation)) return '';
  if (!calculation.initialField) return '';

  if (isDateCalculationConfig(calculation)) {
    if (calculation.comparisonMode === 'differentDateField') {
      return calculation.comparisonField || '';
    }

    if (calculation.comparisonMode === 'customDate') {
      return calculation.customDate || '';
    }
  }

  return calculation.initialField;
}

function calculateArithmetic(
  calculation: ArithmeticCalculationConfig,
  resolveValue: ResolveCalculationValue,
): number | null {
  if (!calculation.initialField) return null;

  const initialRawValue = resolveValue(calculation.initialField);
  if (!hasResolvedCalculationValue(initialRawValue)) return null;

  const initialValue = Number(initialRawValue);
  let result = Number.isNaN(initialValue) ? 0 : initialValue;

  calculation.operations?.forEach((op) => {
    const operandType =
      op.operandType || (op.field ? 'field' : op.manualValue !== undefined ? 'manual' : 'field');
    const rawValue =
      operandType === 'manual' ? op.manualValue : op.field ? resolveValue(op.field) : undefined;
    if (!hasResolvedCalculationValue(rawValue)) {
      switch (op.operator) {
        case '+':
        case '-':
          return;
        case '*':
        case '/':
        case '%':
        case 'percentageOf':
        default:
          result = Number.NaN;
          return;
      }
    }

    const value = Number(rawValue);
    const resolvedValue = Number.isNaN(value) ? 0 : value;

    switch (op.operator) {
      case '+':
        result += resolvedValue;
        break;
      case '-':
        result -= resolvedValue;
        break;
      case '*':
        result *= resolvedValue;
        break;
      case '/':
        result = resolvedValue !== 0 ? result / resolvedValue : 0;
        break;
      case '%':
        result = resolvedValue !== 0 ? result % resolvedValue : 0;
        break;
      case 'percentageOf':
        result = resolvedValue !== 0 ? (result / resolvedValue) * 100 : 0;
        break;
    }
  });

  if (Number.isNaN(result)) return null;
  return result;
}

function calculateDateDifference(
  calculation: DateCalculationConfig,
  resolveValue: ResolveCalculationValue,
): number | null {
  if (!calculation.initialField) return null;

  const initialRawValue = resolveValue(calculation.initialField);
  if (!hasResolvedCalculationValue(initialRawValue)) return null;

  const fromDate = parseDateValue(initialRawValue);
  if (!fromDate) return null;

  let comparisonValue: unknown;
  switch (calculation.comparisonMode) {
    case 'currentDate':
      comparisonValue = new Date();
      break;
    case 'differentDateField':
      comparisonValue = calculation.comparisonField
        ? resolveValue(calculation.comparisonField)
        : undefined;
      break;
    case 'customDate':
      comparisonValue = calculation.customDate;
      break;
  }

  if (!hasResolvedCalculationValue(comparisonValue)) return null;

  const toDate = parseDateValue(comparisonValue);
  if (!toDate) return null;

  switch (calculation.unit) {
    case 'months':
      return differenceInMonths(toDate, fromDate);
    case 'years':
      return differenceInYears(toDate, fromDate);
    case 'days':
    default:
      return differenceInCalendarDays(toDate, fromDate);
  }
}

export function calculateConfiguredValue(
  calculation: CalculationConfig | undefined,
  resolveValue: ResolveCalculationValue,
): number | null {
  if (!calculation) return null;

  if (isDateCalculationConfig(calculation)) {
    return calculateDateDifference(calculation, resolveValue);
  }

  if (isArithmeticCalculationConfig(calculation)) {
    return calculateArithmetic(calculation, resolveValue);
  }

  return null;
}

function isEmptyValue(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  );
}

function resolveSelectedValues(
  mode: DropdownCalculationResult['selectionMode'] | undefined,
  selectedValues: string[] | undefined,
  availableOptions: NormalizedOption[],
): string[] {
  const chosenValues = (selectedValues || []).map(String);
  if (mode === 'all') {
    return availableOptions.map((option) => option.value);
  }
  if (mode === 'remaining') {
    const excluded = new Set(chosenValues);
    return availableOptions
      .map((option) => option.value)
      .filter((value) => !excluded.has(value));
  }

  if (mode === 'single') {
    return chosenValues.slice(0, 1);
  }

  return chosenValues;
}

function normalizeStringArray(value: unknown, fallback?: string): string[] {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => normalizeStringArray(item))
      .filter(Boolean);
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const preferredValue = record.value ?? record.label ?? record.id;
    if (preferredValue !== undefined && preferredValue !== null && preferredValue !== '') {
      return [String(preferredValue)];
    }
  }

  if (value === undefined || value === null || value === '') {
    return fallback ? [fallback] : [];
  }

  return [String(value)];
}

function matchesDropdownCondition(
  sourceValue: unknown,
  condition: DropdownConditionalCalculationConfig['rules'][number]['conditions'][number],
  availableOptions: NormalizedOption[],
): boolean {
  const defaultSourceValue =
    (isEmptyValue(sourceValue) ? condition.defaultValue : undefined) ?? sourceValue;

  if (condition.numberMode === 'range') {
    const numericValue = Number(defaultSourceValue);
    if (Number.isNaN(numericValue)) return false;

    const hasFrom = typeof condition.rangeFrom === 'number' && !Number.isNaN(condition.rangeFrom);
    const hasTo = typeof condition.rangeTo === 'number' && !Number.isNaN(condition.rangeTo);
    if (!hasFrom && !hasTo) return false;
    const isWithinRange =
      (!hasFrom || numericValue >= Number(condition.rangeFrom)) &&
      (!hasTo || numericValue <= Number(condition.rangeTo));
    return condition.operator === 'not_between' ? !isWithinRange : isWithinRange;
  }

  const selectedValues =
    condition.selectionMode === 'remaining'
      ? (condition.selectedValues || []).map(String)
      : resolveSelectedValues(
          condition.selectionMode,
          condition.selectedValues,
          availableOptions,
        );

  const compareValue =
    condition.value !== undefined && condition.value !== null
      ? condition.value
      : selectedValues.length > 0
        ? selectedValues
        : undefined;

  const valueAsArray = normalizeStringArray(defaultSourceValue, condition.defaultValue);
  const compareArray = Array.isArray(compareValue)
    ? compareValue.map((item) => String(item))
    : compareValue !== undefined
      ? [String(compareValue)]
      : [];

  if (selectedValues.length > 0) {
    switch (condition.operator) {
      case 'equals':
      case 'contains':
        return valueAsArray.some((value) => selectedValues.includes(value));
      case 'not_equals':
      case 'not_contains':
        return valueAsArray.every((value) => !selectedValues.includes(value));
      default:
        break;
    }
  }

  const sourceText = valueAsArray.join(',').toLowerCase();
  const compareText = compareArray[0]?.toLowerCase() ?? '';
  const sourceNumber = Number(valueAsArray[0]);
  const compareNumber = Number(compareArray[0]);

  switch (condition.operator) {
    case 'equals':
      return valueAsArray.some((value) => compareArray.includes(value));
    case 'not_equals':
      return valueAsArray.every((value) => !compareArray.includes(value));
    case 'contains':
      return compareArray.some((value) => sourceText.includes(value.toLowerCase()));
    case 'not_contains':
      return compareArray.every((value) => !sourceText.includes(value.toLowerCase()));
    case 'greater_than':
      return !Number.isNaN(sourceNumber) && !Number.isNaN(compareNumber) && sourceNumber > compareNumber;
    case 'less_than':
      return !Number.isNaN(sourceNumber) && !Number.isNaN(compareNumber) && sourceNumber < compareNumber;
    case 'greater_than_or_equal':
      return !Number.isNaN(sourceNumber) && !Number.isNaN(compareNumber) && sourceNumber >= compareNumber;
    case 'less_than_or_equal':
      return !Number.isNaN(sourceNumber) && !Number.isNaN(compareNumber) && sourceNumber <= compareNumber;
    default:
      return false;
  }
}

export function evaluateDropdownConditionalCalculation(
  calculation: DropdownConditionalCalculationConfig | undefined,
  resolveValue: ResolveCalculationValue,
  resolveFieldOptions: (fieldRef: string) => NormalizedOption[],
  availableOptions: NormalizedOption[],
): { options: NormalizedOption[]; defaultValue?: string } | null {
  if (!calculation) return null;

  const applyResult = (result: DropdownCalculationResult) => {
    const allowedValues = new Set(
      resolveSelectedValues(result.selectionMode, result.selectedValues, availableOptions),
    );
    const filteredOptions = availableOptions.filter((option) => allowedValues.has(option.value));
    const defaultValue =
      result.defaultValue && filteredOptions.some((option) => option.value === result.defaultValue)
        ? result.defaultValue
        : undefined;

    return {
      options: filteredOptions,
      defaultValue,
    };
  };

  for (const rule of calculation.rules || []) {
    const conditionResults = (rule.conditions || []).map((condition) =>
      matchesDropdownCondition(
        resolveValue(condition.field),
        condition,
        resolveFieldOptions(condition.field),
      ),
    );
    const matches =
      (rule.conditionMode || 'and') === 'or'
        ? conditionResults.some(Boolean)
        : conditionResults.every(Boolean);

    if (matches) {
      return applyResult(rule.result);
    }
  }

  if (calculation.fallbackResult) {
    return applyResult(calculation.fallbackResult);
  }

  return {
    options: availableOptions,
    defaultValue: undefined,
  };
}
