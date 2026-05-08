import { formatNumber } from '@/shared/utils/lib-utils';

/**
 * Parse a scalar into a finite number for display. Accepts commas; rejects
 * identifier-style leading zeros (e.g. "007", "01234").
 */
export function parseFiniteNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const normalized = trimmed.replace(/,/g, '');
  if (!/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?$/.test(normalized)) {
    return null;
  }
  if (/^-?0\d+\./.test(normalized)) return null;
  if (/^-?0\d+$/.test(normalized)) return null;
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : null;
}

function isYearLikeInteger(n: number): boolean {
  return Number.isInteger(n) && n >= 1800 && n <= 2100;
}

function isLikelyIdentifierField(name: string, label: string): boolean {
  const hay = `${name} ${label}`.toLowerCase();
  return (
    /(?:^|_)(?:id|uuid|code|reference|ref|phone|mobile|fax|zip|postal|iban|account|emirates)\b/i.test(
      hay,
    ) ||
    /\b(?:policy|quote)\s*(?:number|no|ref)\b/i.test(hay) ||
    /\b(?:national|passport)\s*(?:id|no|number)\b/i.test(hay)
  );
}

function isLikelyQuantityOrAmountField(name: string, label: string): boolean {
  const hay = `${name} ${label}`.toLowerCase();
  return /\b(?:amount|premium|sum|insured|value|quantity|price|cost|fee|total|limit|salary|income|turnover|revenue|area|sqm|sqft|employees|headcount|units|stories|floors|capacity|weight|distance|length|width|height|volume)\b/.test(
    hay,
  );
}

/** Integers we should not group (years, IDs, codes, etc.). */
export function shouldSkipThousandSeparatorInteger(
  n: number,
  name: string,
  label: string,
): boolean {
  if (!Number.isInteger(n)) return false;
  if (isYearLikeInteger(n)) return true;
  const nLower = name.toLowerCase();
  const lbl = label.toLowerCase();
  if (nLower.includes('year') || lbl.includes('year')) return true;
  if (isLikelyIdentifierField(name, label)) return true;
  return false;
}

export function snapNumericNoise(n: number): number {
  if (Math.abs(n - Math.round(n)) < 1e-6) return Math.round(n);
  return n;
}

/**
 * Format proposal `number` fields on policy/quote detail accordions.
 */
export function formatTemplateNumberField(
  value: unknown,
  name: string,
  label?: string,
): string {
  const n = parseFiniteNumber(value);
  if (n === null) return String(value ?? '');

  const snapped = snapNumericNoise(n);
  const intSnap = Number.isInteger(snapped);
  const lbl = label ?? '';

  if (intSnap && shouldSkipThousandSeparatorInteger(snapped, name, lbl)) {
    return String(snapped);
  }

  return formatNumber(snapped, intSnap ? 0 : 0, intSnap ? 0 : 2);
}

/**
 * When a text/textarea value is purely numeric, optionally add grouping.
 * Returns null when the value should stay on the generic text formatter.
 */
export function tryFormatNumericTextField(
  value: unknown,
  name: string,
  label?: string,
): string | null {
  const n = parseFiniteNumber(value);
  if (n === null) return null;

  const snapped = snapNumericNoise(n);
  const intSnap = Number.isInteger(snapped);
  const lbl = label ?? '';

  if (intSnap && shouldSkipThousandSeparatorInteger(snapped, name, lbl)) {
    return null;
  }

  if (!intSnap) {
    return formatNumber(snapped, 0, 2);
  }

  const absInt = Math.abs(snapped);
  if (absInt >= 1_000_000) {
    return formatNumber(snapped, 0, 0);
  }
  if (absInt >= 1000 && isLikelyQuantityOrAmountField(name, lbl)) {
    return formatNumber(snapped, 0, 0);
  }

  return null;
}
