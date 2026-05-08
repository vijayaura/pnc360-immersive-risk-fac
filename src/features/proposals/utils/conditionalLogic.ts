import type {
  ConditionalLogicConfig,
  DropdownCalculationCondition,
  Field,
  LegacyConditionalLogicConfig,
  SubField,
} from '@/features/product-config/proposal-form/api/proposalFormDesign';
import type { NormalizedOption } from '@/shared/utils/form-helpers';

type ResolveConditionalLogicValue = (fieldRef: string) => unknown;
const COMBINATION_SUB_FIELD_REF_PREFIX = 'combination-subfield::';
const DATE_PERIOD_SEPARATOR = '::';

export function createConditionalLogicCombinationSubFieldRef(
  fieldRef: string,
  subFieldRef: string,
): string {
  return `${COMBINATION_SUB_FIELD_REF_PREFIX}${fieldRef}::${subFieldRef}`;
}

export function createConditionalLogicCombinationSubFieldAliases(
  fieldRefs: Array<string | null | undefined>,
  subFieldRefs: Array<string | null | undefined>,
): string[] {
  const aliases: string[] = [];

  fieldRefs.filter(Boolean).forEach((fieldRef) => {
    subFieldRefs.filter(Boolean).forEach((subFieldRef) => {
      aliases.push(
        createConditionalLogicCombinationSubFieldRef(
          String(fieldRef),
          String(subFieldRef),
        ),
      );
    });
  });

  return Array.from(new Set(aliases));
}

export function parseConditionalLogicCombinationSubFieldRef(fieldRef: string): {
  fieldRef: string;
  subFieldRef: string;
} | null {
  if (!fieldRef.startsWith(COMBINATION_SUB_FIELD_REF_PREFIX)) return null;

  const rawValue = fieldRef.slice(COMBINATION_SUB_FIELD_REF_PREFIX.length);
  const separatorIndex = rawValue.indexOf('::');
  if (separatorIndex < 0) return null;

  return {
    fieldRef: rawValue.slice(0, separatorIndex),
    subFieldRef: rawValue.slice(separatorIndex + 2),
  };
}

function findFieldByRef(fields: Field[], fieldRef: string): Field | undefined {
  return fields.find((field) => field.name === fieldRef || field.id === fieldRef);
}

function findSubFieldByRef(subFields: SubField[] | undefined, subFieldRef: string): SubField | undefined {
  return subFields?.find((subField) => subField.name === subFieldRef || subField.id === subFieldRef);
}

export function resolveConditionalLogicFieldValue(
  fields: Field[],
  values: Record<string, unknown>,
  fieldRef: string,
): unknown {
  const parsedSubFieldRef = parseConditionalLogicCombinationSubFieldRef(fieldRef);
  if (parsedSubFieldRef) {
    const combinationField = findFieldByRef(fields, parsedSubFieldRef.fieldRef);
    const combinationValue =
      values[combinationField?.name || ''] ??
      values[combinationField?.id || ''] ??
      values[parsedSubFieldRef.fieldRef];

    if (!Array.isArray(combinationValue)) return [];

    const targetSubField = findSubFieldByRef(combinationField?.subFields, parsedSubFieldRef.subFieldRef);
    const targetSubFieldName = targetSubField?.name || parsedSubFieldRef.subFieldRef;

    return combinationValue
      .map((row) =>
        row && typeof row === 'object'
          ? (row as Record<string, unknown>)[targetSubFieldName]
          : undefined,
      )
      .filter((value) => value !== undefined && value !== null && value !== '');
  }

  const field = findFieldByRef(fields, fieldRef);
  if (!field) return values[fieldRef];

  return values[field.name] ?? values[field.id ?? ''] ?? values[fieldRef];
}

export function resolveConditionalLogicFieldOptions(
  fields: Field[],
  fieldRef: string,
): NormalizedOption[] {
  const parsedSubFieldRef = parseConditionalLogicCombinationSubFieldRef(fieldRef);
  if (parsedSubFieldRef) {
    const combinationField = findFieldByRef(fields, parsedSubFieldRef.fieldRef);
    const targetSubField = findSubFieldByRef(combinationField?.subFields, parsedSubFieldRef.subFieldRef);
    return (targetSubField?.options || []).map((option) =>
      typeof option === 'string'
        ? { label: option, value: option }
        : { label: option.label ?? option.value, value: option.value },
    );
  }

  const field = findFieldByRef(fields, fieldRef);
  return (field?.options || []).map((option) =>
    typeof option === 'string'
      ? { label: option, value: option }
      : { label: option.label ?? option.value, value: option.value },
  );
}

function isEmptyValue(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  );
}

function normalizeStringArray(value: unknown, fallback?: string): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => normalizeStringArray(item)).filter(Boolean);
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (
      typeof record.startDate === 'string' ||
      typeof record.endDate === 'string'
    ) {
      return [
        `${String(record.startDate ?? '')}${DATE_PERIOD_SEPARATOR}${String(record.endDate ?? '')}`,
      ];
    }

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

function parseTemporalComparable(value: string): number | null {
  const trimmedValue = value.trim();
  if (!trimmedValue) return null;

  if (/^\d{2}:\d{2}(:\d{2})?$/.test(trimmedValue)) {
    const [hours = '0', minutes = '0', seconds = '0'] = trimmedValue.split(':');
    return (
      Number(hours) * 60 * 60 +
      Number(minutes) * 60 +
      Number(seconds)
    );
  }

  const amPmMatch = trimmedValue.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (amPmMatch) {
    let hours = Number(amPmMatch[1]);
    const minutes = Number(amPmMatch[2]);
    const seconds = Number(amPmMatch[3] || '0');
    const meridiem = amPmMatch[4].toUpperCase();

    if (meridiem === 'PM' && hours < 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;

    return hours * 60 * 60 + minutes * 60 + seconds;
  }

  const parsedDate = Date.parse(trimmedValue);
  return Number.isNaN(parsedDate) ? null : parsedDate;
}

function resolveSelectedValues(
  condition: DropdownCalculationCondition,
  availableOptions: NormalizedOption[],
): string[] {
  const selectedValues = (condition.selectedValues || []).map(String);

  if (condition.selectionMode === 'all') {
    return availableOptions.map((option) => option.value);
  }

  if (condition.selectionMode === 'remaining') {
    const excluded = new Set(selectedValues);
    return availableOptions
      .map((option) => option.value)
      .filter((value) => !excluded.has(value));
  }

  if (condition.selectionMode === 'single') {
    return selectedValues.slice(0, 1);
  }

  return selectedValues;
}

function matchesCondition(
  sourceValue: unknown,
  condition: DropdownCalculationCondition,
  availableOptions: NormalizedOption[],
): boolean {
  const defaultSourceValue =
    (isEmptyValue(sourceValue) ? condition.defaultValue : undefined) ?? sourceValue;

  if (condition.numberMode === 'range') {
    const numericValues = normalizeStringArray(defaultSourceValue, condition.defaultValue)
      .map((value) => Number(value))
      .filter((value) => !Number.isNaN(value));
    if (numericValues.length === 0) return false;

    const hasFrom = typeof condition.rangeFrom === 'number' && !Number.isNaN(condition.rangeFrom);
    const hasTo = typeof condition.rangeTo === 'number' && !Number.isNaN(condition.rangeTo);
    if (!hasFrom && !hasTo) return false;

    const isWithinRange = numericValues.some((numericValue) => {
      if (hasFrom && numericValue < Number(condition.rangeFrom)) return false;
      if (hasTo && numericValue > Number(condition.rangeTo)) return false;
      return true;
    });

    return condition.operator === 'not_between' ? !isWithinRange : isWithinRange;
  }

  const selectedValues = resolveSelectedValues(condition, availableOptions);
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
  const sourceNumbers = valueAsArray
    .map((value) => Number(value))
    .filter((value) => !Number.isNaN(value));
  const compareNumber = Number(compareArray[0]);
  const sourceTemporalValues = valueAsArray
    .map((value) => parseTemporalComparable(value))
    .filter((value): value is number => value !== null);
  const compareTemporalValue = parseTemporalComparable(compareArray[0] ?? '');

  switch (condition.operator) {
    case 'equals':
      if (compareTemporalValue !== null && sourceTemporalValues.length > 0) {
        return sourceTemporalValues.some((value) => value === compareTemporalValue);
      }
      return valueAsArray.some((value) => compareArray.includes(value));
    case 'not_equals':
      if (compareTemporalValue !== null && sourceTemporalValues.length > 0) {
        return sourceTemporalValues.every((value) => value !== compareTemporalValue);
      }
      return valueAsArray.every((value) => !compareArray.includes(value));
    case 'contains':
      return compareArray.some((value) => sourceText.includes(value.toLowerCase()));
    case 'not_contains':
      return compareArray.every((value) => !sourceText.includes(value.toLowerCase()));
    case 'greater_than':
      if (!Number.isNaN(compareNumber)) {
        return sourceNumbers.some((value) => value > compareNumber);
      }
      return compareTemporalValue !== null && sourceTemporalValues.some((value) => value > compareTemporalValue);
    case 'less_than':
      if (!Number.isNaN(compareNumber)) {
        return sourceNumbers.some((value) => value < compareNumber);
      }
      return compareTemporalValue !== null && sourceTemporalValues.some((value) => value < compareTemporalValue);
    case 'greater_than_or_equal':
      if (!Number.isNaN(compareNumber)) {
        return sourceNumbers.some((value) => value >= compareNumber);
      }
      return compareTemporalValue !== null && sourceTemporalValues.some((value) => value >= compareTemporalValue);
    case 'less_than_or_equal':
      if (!Number.isNaN(compareNumber)) {
        return sourceNumbers.some((value) => value <= compareNumber);
      }
      return compareTemporalValue !== null && sourceTemporalValues.some((value) => value <= compareTemporalValue);
    default:
      return false;
  }
}

function evaluateLegacyConditionalLogic(
  conditionalLogic: LegacyConditionalLogicConfig,
  resolveValue: ResolveConditionalLogicValue,
): boolean {
  const depValue = resolveValue(conditionalLogic.field);
  const depText = String(depValue ?? '');
  const depNumericValue = Number(depValue);
  const conditionNumericValue = Number(conditionalLogic.value);
  const depTemporalValue = parseTemporalComparable(depText);
  const conditionTemporalValue = parseTemporalComparable(String(conditionalLogic.value));

  switch (conditionalLogic.condition) {
    case 'equals':
      if (depTemporalValue !== null && conditionTemporalValue !== null) {
        return depTemporalValue === conditionTemporalValue;
      }
      return depText === String(conditionalLogic.value);
    case 'not_equals':
    case 'notEquals':
      if (depTemporalValue !== null && conditionTemporalValue !== null) {
        return depTemporalValue !== conditionTemporalValue;
      }
      return depText !== String(conditionalLogic.value);
    case 'contains':
      return depText.toLowerCase().includes(String(conditionalLogic.value).toLowerCase());
    case 'not_contains':
    case 'notContains':
      return !depText.toLowerCase().includes(String(conditionalLogic.value).toLowerCase());
    case 'greater_than':
    case 'greaterThan':
      if (depValue === '' || depValue === null || depValue === undefined) return false;
      if (!Number.isNaN(depNumericValue) && !Number.isNaN(conditionNumericValue)) {
        return depNumericValue > conditionNumericValue;
      }
      return depTemporalValue !== null &&
        conditionTemporalValue !== null &&
        depTemporalValue > conditionTemporalValue;
    case 'less_than':
    case 'lessThan':
      if (depValue === '' || depValue === null || depValue === undefined) return false;
      if (!Number.isNaN(depNumericValue) && !Number.isNaN(conditionNumericValue)) {
        return depNumericValue < conditionNumericValue;
      }
      return depTemporalValue !== null &&
        conditionTemporalValue !== null &&
        depTemporalValue < conditionTemporalValue;
    case 'greater_than_or_equal':
    case 'greaterThanOrEqual':
      if (depValue === '' || depValue === null || depValue === undefined) return false;
      if (!Number.isNaN(depNumericValue) && !Number.isNaN(conditionNumericValue)) {
        return depNumericValue >= conditionNumericValue;
      }
      return depTemporalValue !== null &&
        conditionTemporalValue !== null &&
        depTemporalValue >= conditionTemporalValue;
    case 'less_than_or_equal':
    case 'lessThanOrEqual':
      if (depValue === '' || depValue === null || depValue === undefined) return false;
      if (!Number.isNaN(depNumericValue) && !Number.isNaN(conditionNumericValue)) {
        return depNumericValue <= conditionNumericValue;
      }
      return depTemporalValue !== null &&
        conditionTemporalValue !== null &&
        depTemporalValue <= conditionTemporalValue;
    case 'is_empty':
    case 'isEmpty':
      return isEmptyValue(depValue);
    case 'is_not_empty':
    case 'isNotEmpty':
      return !isEmptyValue(depValue);
    default:
      return true;
  }
}

export function isConditionalLogicConfig(
  conditionalLogic?: LegacyConditionalLogicConfig | ConditionalLogicConfig,
): conditionalLogic is ConditionalLogicConfig {
  return Boolean(
    conditionalLogic &&
      typeof conditionalLogic === 'object' &&
      'type' in conditionalLogic &&
      conditionalLogic.type === 'visibilityRules',
  );
}

export function evaluateConditionalLogic(
  conditionalLogic: LegacyConditionalLogicConfig | ConditionalLogicConfig | undefined,
  resolveValue: ResolveConditionalLogicValue,
  resolveFieldOptions: (fieldRef: string) => NormalizedOption[],
): boolean {
  if (!conditionalLogic) return true;

  if (!isConditionalLogicConfig(conditionalLogic)) {
    return evaluateLegacyConditionalLogic(conditionalLogic, resolveValue);
  }

  for (const rule of conditionalLogic.rules || []) {
    const results = (rule.conditions || []).map((condition) =>
      matchesCondition(resolveValue(condition.field), condition, resolveFieldOptions(condition.field)),
    );
    const matches =
      (rule.conditionMode || 'and') === 'or'
        ? results.some(Boolean)
        : results.every(Boolean);

    if (matches) {
      return rule.result === 'show';
    }
  }

  if (conditionalLogic.fallbackResult) {
    return conditionalLogic.fallbackResult === 'show';
  }

  const rules = conditionalLogic.rules || [];
  const hasShowRule = rules.some((rule) => rule.result === 'show');
  const hasHideRule = rules.some((rule) => rule.result === 'hide');

  if (hasShowRule && !hasHideRule) {
    return false;
  }

  return true;
}
