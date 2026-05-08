/**
 * Helpers for combination-field validation (used by useFormValidation).
 */

export type CombinationCellConfig = {
  name: string;
  type?: string;
  defaultValue?: unknown;
};

function isPrimitiveEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

function isDatePeriodLikeEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'object' && !Array.isArray(value)) {
    const o = value as Record<string, unknown>;
    return !o.startDate && !o.endDate;
  }
  return true;
}

function isDaterangeRowEmpty(row: Record<string, unknown>, baseName: string): boolean {
  const start = row[`${baseName}Start`];
  const end = row[`${baseName}End`];
  return isPrimitiveEmpty(start) && isPrimitiveEmpty(end);
}

/** True when a single combination cell has no meaningful value (for “any filled?” checks). */
export function isCombinationCellEmpty(
  row: Record<string, unknown>,
  cell: CombinationCellConfig,
): boolean {
  const type = cell.type;

  if (type === 'daterange') {
    return isDaterangeRowEmpty(row, cell.name);
  }

  const raw = row[cell.name];
  const value =
    raw !== undefined && raw !== null
      ? raw
      : cell.defaultValue !== undefined
        ? cell.defaultValue
        : undefined;

  if (type === 'checkbox') {
    return value !== true && value !== 'true';
  }

  if (type === 'datePeriod' || type === 'policyPeriod') {
    return isDatePeriodLikeEmpty(value);
  }

  if (typeof File !== 'undefined' && value instanceof File) return false;
  if (typeof Blob !== 'undefined' && value instanceof Blob) return false;

  if (value === undefined || value === null) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value as object).length === 0
  ) {
    return true;
  }

  return false;
}
