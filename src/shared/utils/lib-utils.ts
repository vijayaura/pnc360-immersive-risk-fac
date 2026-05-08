import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(
  value: number | string | null | undefined,
  minFraction: number = 0,
  maxFraction: number = 2,
): string {
  if (value === null || value === undefined) return '-';
  const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
  if (isNaN(num)) return String(value);
  return num.toLocaleString('en-US', {
    minimumFractionDigits: minFraction,
    maximumFractionDigits: maxFraction
  });
}

export function formatCurrency(
  value: number | string | null | undefined,
  currency: string = 'AED',
): string {
  if (value === null || value === undefined) return '-';
  const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
  if (isNaN(num)) return String(value);

  const formattedNumber = num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return `${currency} ${formattedNumber}`;
}

export const compactNumber = new Intl.NumberFormat('en', {
  notation: 'compact',
  compactDisplay: 'short',
  maximumFractionDigits: 1,
});

export function formatNumberCompact(value: number | string | null | undefined): string {
  const raw = value ?? null;
  const num =
    typeof raw === 'number'
      ? raw
      : typeof raw === 'string'
        ? parseFloat(raw.replace(/,/g, '').trim())
        : NaN;
  if (!Number.isFinite(num)) return '-';
  const abs = Math.abs(num);
  if (abs >= 1000) return compactNumber.format(num);
  return num.toLocaleString();
}

export function formatCurrencyCompact(
  value: number | string | null | undefined,
  currency: string = 'AED',
): string {
  const raw = value ?? null;
  const num =
    typeof raw === 'number'
      ? raw
      : typeof raw === 'string'
        ? parseFloat(raw.replace(/,/g, '').trim())
        : NaN;
  if (!Number.isFinite(num)) return '-';
  const abs = Math.abs(num);
  if (abs >= 1000) return `${currency} ${compactNumber.format(num)}`;
  return `${currency} ${num.toLocaleString()}`;
}

export function formatNumberCompactMillions(
  value: number | string | null | undefined,
): string {
  const raw = value ?? null;
  const num =
    typeof raw === 'number'
      ? raw
      : typeof raw === 'string'
        ? parseFloat(raw.replace(/,/g, '').trim())
        : NaN;

  if (!Number.isFinite(num)) return '-';

  const abs = Math.abs(num);
  if (abs < 1_000_000) {
    return num.toLocaleString();
  }

  return compactNumber.format(num);
}

export function formatCurrencyCompactMillions(
  value: number | string | null | undefined,
  currency: string = 'AED',
): string {
  const formattedNumber = formatNumberCompactMillions(value);
  if (formattedNumber === '-') return '-';
  return `${currency} ${formattedNumber}`;
}

export function formatCurrencyLocale(
  value: number | string | null | undefined,
  currency?: string,
): string {
  if (value === null || value === undefined) return '-';
  const num =
    typeof value === 'number'
      ? value
      : Number(String(value).replace(/,/g, '').trim());
  if (!Number.isFinite(num)) return '-';
  const token = currency ? `${currency} ` : '';
  
  const formattedNumber = num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return `${token}${formattedNumber}`;
}
