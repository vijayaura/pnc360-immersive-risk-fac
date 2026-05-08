export const deriveProductCode = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');

export const formatIfNumber = (value: string): string => {
  // Trim to avoid whitespace issues
  const trimmed = value.trim();

  // Check if it's a valid number
  if (trimmed === '' || isNaN(Number(trimmed)) || trimmed.length > 3) {
    return value;
  }

  const number = Number(trimmed);

  // Use Intl for proper comma formatting
  return number.toLocaleString('en-US');
}

export const formatCurrencyNumber = (
  value: number,
  currency: string,
  maxFractionDigits: number = 2,
): string => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFractionDigits,
    notation: 'compact',
    compactDisplay: 'short',
  }).format(value);
};

