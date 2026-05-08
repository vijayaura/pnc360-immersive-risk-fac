export type PeriodValue = { startDate: string; endDate: string };

/** Normalize document-extraction output into `{ startDate, endDate }` for policy/date period fields. */
export function parseExtractedPeriodPayload(value: unknown, valueText: unknown): PeriodValue | null {
  const candidates: unknown[] = [];
  const push = (v: unknown) => {
    if (v === undefined || v === null) return;
    if (typeof v === 'string' && v.trim() === '') return;
    candidates.push(typeof v === 'string' ? v.trim() : v);
  };
  push(value);
  push(valueText);

  const fromRangeString = (s: string): PeriodValue | null => {
    // Labeled formats like:
    // - "start date: 2026-04-01, end date: 2026-04-30"
    // - "StartDate = 2026-04-01 EndDate = 2026-04-30"
    const labeled = s.match(
      /start\s*date\s*[:=]\s*(\d{4}-\d{2}-\d{2})[\s,;/|-]*end\s*date\s*[:=]\s*(\d{4}-\d{2}-\d{2})/i,
    );
    if (labeled) {
      const startDate = labeled[1];
      const endDate = labeled[2];
      if (startDate && endDate) return { startDate, endDate };
    }

    // Range formats like:
    // - "2025-04-01 to 2026-04-30"
    // - "2025-04-01 - 2026-04-30"
    // - "2025-04-01–2026-04-30" (en dash)
    const m = s.match(/(\d{4}-\d{2}-\d{2})\s*(?:to|[-–—]|until)\s*(\d{4}-\d{2}-\d{2})/i);
    if (!m) return null;
    const startDate = m[1];
    const endDate = m[2];
    return startDate && endDate ? { startDate, endDate } : null;
  };

  const pick = (obj: Record<string, unknown>, keys: string[]): string => {
    for (const k of keys) {
      const raw = obj[k];
      if (raw === undefined || raw === null) continue;
      const s = String(raw).trim();
      if (s !== '') return s;
    }
    return '';
  };

  const fromObject = (obj: Record<string, unknown>): PeriodValue | null => {
    const startDate = pick(obj, [
      'startDate',
      'start_date',
      'fromDate',
      'from_date',
      'effectiveDate',
      'effective_date',
      'beginDate',
      'begin_date',
    ]);
    const endDate = pick(obj, [
      'endDate',
      'end_date',
      'toDate',
      'to_date',
      'expiryDate',
      'expiry_date',
      'untilDate',
      'until_date',
    ]);
    if (startDate && endDate) return { startDate, endDate };
    return null;
  };

  const fromAnyTwoIsoDates = (s: string): PeriodValue | null => {
    const matches = s.match(/\d{4}-\d{2}-\d{2}/g);
    if (!matches || matches.length < 2) return null;
    return { startDate: matches[0], endDate: matches[1] };
  };

  for (const raw of candidates) {
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      const out = fromObject(raw as Record<string, unknown>);
      if (out) return out;
      continue;
    }
    if (typeof raw === 'string' && raw.startsWith('{')) {
      try {
        const parsed = JSON.parse(raw) as unknown;
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          const out = fromObject(parsed as Record<string, unknown>);
          if (out) return out;
        }
      } catch {
        /* try next candidate */
      }
    }
    if (typeof raw === 'string') {
      const out = fromRangeString(raw);
      if (out) return out;
      const out2 = fromAnyTwoIsoDates(raw);
      if (out2) return out2;
    }
  }

  return null;
}

export function extractionItemLooksLikePeriodField(
  itemType: unknown,
  formFieldType: string | undefined,
): boolean {
  if (formFieldType === 'policyPeriod' || formFieldType === 'datePeriod') return true;
  if (typeof itemType !== 'string') return false;
  const n = itemType.toLowerCase().replace(/[\s_-]/g, '');
  return n === 'policyperiod' || n === 'dateperiod';
}

