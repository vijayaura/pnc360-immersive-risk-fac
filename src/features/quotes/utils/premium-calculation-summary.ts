import type { PremiumBreakdown } from '@/features/quotes/api/quotes';

export const buildPremiumCalculationSummaryHtml = (args: {
  premium: PremiumBreakdown | null | undefined;
  currency: string;
  title?: string;
}): string => {
  const premium = args.premium ?? null;
  const currency = String(args.currency || '').trim();
  const title = String(args.title || 'Premium Calculation Summary').trim();

  if (!premium) {
    return '';
  }

  const formatMoney = (amount: unknown): string => {
    const n = Number(amount || 0);
    const safe = Number.isFinite(n) ? n : 0;
    const token = currency ? `${currency} ` : '';
    const formatted = safe.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${token}${formatted}`;
  };

  const totalPremium = Number(premium.total || 0);
  const totalSumInsured = Number(premium.sumInsured || 0);
  const units = Array.isArray(premium.units) ? premium.units : [];
  const unitsCount = Number(premium.unitsCount || units.length || 0);

  if (units.length === 0) {
    return '';
  }

  const unitHeader =
    typeof premium.combinationFirstColumnLabel === 'string' &&
    premium.combinationFirstColumnLabel.trim()
      ? premium.combinationFirstColumnLabel.trim()
      : 'Unit';

  const averageRatePerMil =
    totalSumInsured > 0 ? (Number(totalPremium) / Number(totalSumInsured)) * 1000 : 0;

  const escapeHtml = (input: unknown): string => {
    return String(input ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const formatUnitLabel = (u: unknown, index: number): string => {
    const record = u as Record<string, unknown>;
    const first =
      typeof record.firstColumnValue === 'string' ? record.firstColumnValue.trim() : '';
    if (first) return first;
    const rowLabel = typeof record.rowLabel === 'string' ? record.rowLabel.trim() : '';
    if (rowLabel) return rowLabel;
    const letters = (() => {
      let n = Math.floor(index);
      if (!Number.isFinite(n) || n < 0) return '';
      n += 1;
      let result = '';
      while (n > 0) {
        const rem = (n - 1) % 26;
        result = String.fromCharCode(65 + rem) + result;
        n = Math.floor((n - 1) / 26);
      }
      return result;
    })();
    return letters ? `Unit ${letters}` : `Unit ${index + 1}`;
  };

  const unitsRows = units
    .map((u: unknown, index: number) => {
      const r = u as Record<string, unknown>;
      return `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(
            formatUnitLabel(u, index),
          )}</td>
          <td style="padding: 8px; text-align: right; border-bottom: 1px solid #e5e7eb;">${escapeHtml(
            formatMoney(r.sumInsured),
          )}</td>
          <td style="padding: 8px; text-align: right; border-bottom: 1px solid #e5e7eb;">${escapeHtml(
            formatMoney(r.base),
          )}</td>
          <td style="padding: 8px; text-align: right; border-bottom: 1px solid #e5e7eb;">${escapeHtml(
            formatMoney(r.loading),
          )}</td>
          <td style="padding: 8px; text-align: right; border-bottom: 1px solid #e5e7eb;">${escapeHtml(
            formatMoney(r.discount),
          )}</td>
          <td style="padding: 8px; text-align: right; border-bottom: 1px solid #e5e7eb;">${escapeHtml(
            formatMoney(r.total),
          )}</td>
        </tr>`;
    })
    .join('');

  return `
    <div class="section-title">${escapeHtml(title)}</div>
    <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e5e7eb;">Description</th>
          <th style="padding: 8px; text-align: right; border-bottom: 1px solid #e5e7eb;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">Total Policy Premium</td>
          <td style="padding: 8px; text-align: right; border-bottom: 1px solid #e5e7eb;">${escapeHtml(
            formatMoney(totalPremium),
          )}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">Total Sum Insured</td>
          <td style="padding: 8px; text-align: right; border-bottom: 1px solid #e5e7eb;">${escapeHtml(
            formatMoney(totalSumInsured),
          )}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">Number of Units</td>
          <td style="padding: 8px; text-align: right; border-bottom: 1px solid #e5e7eb;">${escapeHtml(
            String(unitsCount),
          )}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">Average Rate Per Mil</td>
          <td style="padding: 8px; text-align: right; border-bottom: 1px solid #e5e7eb;">${escapeHtml(
            Number(averageRatePerMil || 0).toFixed(4),
          )}</td>
        </tr>
      </tbody>
    </table>
    <div class="section-title">Units Breakdown</div>
    <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e5e7eb;">${escapeHtml(
            unitHeader,
          )}</th>
          <th style="padding: 8px; text-align: right; border-bottom: 1px solid #e5e7eb;">Sum Insured</th>
          <th style="padding: 8px; text-align: right; border-bottom: 1px solid #e5e7eb;">Base</th>
          <th style="padding: 8px; text-align: right; border-bottom: 1px solid #e5e7eb;">Loading</th>
          <th style="padding: 8px; text-align: right; border-bottom: 1px solid #e5e7eb;">Discount</th>
          <th style="padding: 8px; text-align: right; border-bottom: 1px solid #e5e7eb;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${unitsRows}
      </tbody>
    </table>
  `;
};
