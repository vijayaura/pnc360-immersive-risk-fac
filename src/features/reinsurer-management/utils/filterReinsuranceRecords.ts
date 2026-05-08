import type { ReinsurerPolicyRecord, DashboardFilters } from '../types';

/**
 * Normalize a status string for comparison: lowercase + replace spaces with underscores.
 * Handles API returning e.g. "Quote Generated" vs "quote_generated".
 */
export function normalizeStatus(status: string): string {
  return status.toLowerCase().replace(/\s+/g, '_');
}

/** Statuses representing quote-phase records (use underscore form — normalizeStatus handles spaces) */
export const QUOTE_STATUSES = ['draft', 'submitted', 'quoted', 'quote_generated', 'under_review'] as const;

/** Statuses representing policy-phase records */
export const POLICY_STATUSES = ['bound', 'active', 'approved', 'accepted'] as const;

function parseSumInsuredBand(band: string): { min: number; max: number } {
  const normalize = (s: string): number => {
    // Strip currency prefix (e.g. "AED ", "USD ") and commas
    const cleaned = s.trim().replace(/^[A-Za-z]+\s*/g, '').replace(/,/g, '');
    if (cleaned.endsWith('M') || cleaned.endsWith('m')) {
      return parseFloat(cleaned.slice(0, -1)) * 1_000_000;
    }
    if (cleaned.endsWith('B') || cleaned.endsWith('b')) {
      return parseFloat(cleaned.slice(0, -1)) * 1_000_000_000;
    }
    if (cleaned.endsWith('K') || cleaned.endsWith('k')) {
      return parseFloat(cleaned.slice(0, -1)) * 1_000;
    }
    return parseFloat(cleaned) || 0;
  };

  if (band.includes('+')) {
    const min = normalize(band.replace('+', ''));
    return { min, max: Infinity };
  }

  const parts = band.split('-');
  if (parts.length === 2) {
    return { min: normalize(parts[0]), max: normalize(parts[1]) };
  }

  return { min: 0, max: Infinity };
}

/**
 * When true, list rows must be merged with policy detail (and optionally proposal bundle)
 * before reinsurer/broker/location/cover filters can work.
 */
export function dashboardFiltersNeedDetailEnrichment(filters: DashboardFilters): boolean {
  // location and coverType require detail data for matching.
  // brokerId is sent as API query param but backend support is unreliable — enrich
  // so we can also match client-side against record.brokerIds.
  // creditRating requires reinsurerIds (only on detail records) for grade lookup.
  return !!(
    filters.location ||
    filters.coverType ||
    filters.brokerId ||
    filters.creditRating
  );
}

/**
 * Check whether any client-side-only filter is active.
 * "search" is handled by the API so it doesn't count here.
 */
export function hasClientSideFilters(filters: DashboardFilters): boolean {
  return !!(
    filters.coverType ||
    filters.location ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.sumInsuredBand ||
    filters.creditRating ||
    filters.brokerId
  );
}

/**
 * Apply all client-side dashboard filters to a list of reinsurance records.
 */
export function applyDashboardFilters(
  records: ReinsurerPolicyRecord[],
  filters: DashboardFilters,
  reinsurerGradeLookup?: Map<string, string | undefined>,
): ReinsurerPolicyRecord[] {
  return records.filter((record) => {
    // search → free text match against key fields
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const searchable = [
        record.policyOrQuoteId,
        record.quoteNumber,
        record.customerName,
        record.productName,
        record.status,
        ...(record.programNames ?? []),
        ...(record.treatyNames ?? []),
        ...(record.brokerNames ?? []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      // Also include cover names from breakdown (covers[] = sections, units[] = actual covers)
      const coverNames = (record.productBreakdown ?? [])
        .flatMap((p) => p.covers.flatMap((section) => section.units.map((u) => u.title)))
        .join(' ')
        .toLowerCase();

      if (!searchable.includes(q) && !coverNames.includes(q)) {
        return false;
      }
    }

    // coverType → match against cover/section/product names in productBreakdown
    if (filters.coverType) {
      const coverLower = filters.coverType.toLowerCase();
      const breakdown = record.productBreakdown ?? [];

      // Collect all names: unit titles (covers), section titles, and product name
      const unitNames = breakdown.flatMap((p) =>
        p.covers.flatMap((section) => section.units.map((u) => u.title.toLowerCase())),
      );
      const sectionNames = breakdown.flatMap((p) =>
        p.covers.map((section) => section.title.toLowerCase()),
      );
      const allNames = [...unitNames, ...sectionNames];

      const hasMatch = allNames.length > 0
        ? allNames.some((name) => name.includes(coverLower) || coverLower.includes(name))
        : record.productName?.toLowerCase().includes(coverLower);
      if (!hasMatch) return false;
    }

    // Extract YYYY-MM-DD from an ISO date string for date-only comparison
    const toDateOnly = (iso: string): string => iso.slice(0, 10);

    // dateFrom → record must be on or after this date
    if (filters.dateFrom) {
      if (!record.createdDateIso) return false;
      const recordDay = toDateOnly(record.createdDateIso);
      if (recordDay < filters.dateFrom) return false;
    }

    // dateTo → record must be on or before this date
    if (filters.dateTo) {
      if (!record.createdDateIso) return false;
      const recordDay = toDateOnly(record.createdDateIso);
      if (recordDay > filters.dateTo) return false;
    }

    // sumInsuredBand → parse band and compare against record.totals.sumInsured
    if (filters.sumInsuredBand) {
      const { min, max } = parseSumInsuredBand(filters.sumInsuredBand);
      const si = record.totals?.sumInsured ?? 0;
      if (si < min || si > max) return false;
    }

    // reinsurerId is filtered server-side via API query params.
    // brokerId is also sent as API param but we double-check client-side for reliability.
    if (filters.brokerId) {
      const recordBrokerIds = record.brokerIds ?? [];
      const breakdownBrokerIds = (record.reinsurerBreakdownEntries ?? [])
        .map((e) => e.brokerId)
        .filter((v): v is string => !!v);
      const allBrokerIds = new Set([...recordBrokerIds, ...breakdownBrokerIds]);
      if (!allBrokerIds.has(filters.brokerId)) return false;
    }

    // location → match against record.location (country, region)
    if (filters.location) {
      const locationLower = filters.location.toLowerCase();
      if (!record.location?.toLowerCase().includes(locationLower)) {
        return false;
      }
    }

    // creditRating → match against reinsurer gradeIds via lookup map
    if (filters.creditRating && reinsurerGradeLookup) {
      const recordReinsurerIds = record.reinsurerIds ?? [];
      const hasMatchingGrade = recordReinsurerIds.some((rid) => {
        const gradeId = reinsurerGradeLookup.get(rid);
        return gradeId === filters.creditRating;
      });
      if (!hasMatchingGrade) return false;
    }

    return true;
  });
}

/**
 * Paginate a list of records client-side.
 */
export function paginateRecords<T>(
  records: T[],
  page: number,
  pageSize: number,
): { data: T[]; totalPages: number; total: number } {
  const total = records.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const data = records.slice(start, start + pageSize);
  return { data, totalPages, total };
}
