import type { ReinsurerPolicyRecord, ReinsuranceSummary } from '../types';
import { normalizeStatus, QUOTE_STATUSES, POLICY_STATUSES } from './filterReinsuranceRecords';

export type AnalyticsScope = 'all' | 'quotes' | 'policies';

function filterRecordsByScope(records: ReinsurerPolicyRecord[], scope: AnalyticsScope): ReinsurerPolicyRecord[] {
  if (scope === 'all') return records;
  const allowedStatuses: readonly string[] = scope === 'quotes' ? QUOTE_STATUSES : POLICY_STATUSES;
  return records.filter((r) => allowedStatuses.includes(normalizeStatus(r.status ?? '')));
}

export interface CoverAggregation {
  coverName: string;
  productName: string;
  /** Sum of unit.sumInsured across all records for this cover */
  sumInsured: number;
  /** Sum of unit.reinsurance.cededSumInsured across all records */
  cededSumInsured: number;
  /** Sum of unit.premium across all records for this cover */
  premium: number;
  /** Number of records containing this cover */
  recordCount: number;
}

export interface ReinsuranceDashboardAggregates {
  byCover: CoverAggregation[];
  totalSumInsured: number;
  totalPremium: number;
  totalCession: number;
  totalCommission: number;
  totalRecords: number;
}

/**
 * Compute the selected reinsurer's share ratio for a single record.
 * Returns a number between 0 and 1 representing how much of the record's
 * totals belong to the selected reinsurer.
 */
function computeReinsurerShareRatio(
  record: ReinsurerPolicyRecord,
  reinsurerId: string,
): number {
  const entries = record.reinsurerBreakdownEntries;
  if (!entries || entries.length === 0) return 0;

  const matchingEntries = entries.filter((e) => e.reinsurerId === reinsurerId);
  if (matchingEntries.length === 0) return 0;

  // Sum the reinsurer's allocated SI
  const reinsurerSI = matchingEntries.reduce((sum, e) => sum + e.sumInsured, 0);
  const totalSI = record.totals?.sumInsured ?? 0;

  if (totalSI > 0 && reinsurerSI > 0) {
    return Math.min(reinsurerSI / totalSI, 1);
  }

  // Fallback: use share percentage average
  const totalSharePct = matchingEntries.reduce((sum, e) => sum + e.sharePercent, 0);
  return Math.min(totalSharePct / 100, 1);
}

/**
 * Aggregates enriched reinsurance policy records into cover-level chart data.
 *
 * When `reinsurerId` is provided, all SI / premium / cession values are scaled
 * to show only the selected reinsurer's proportional share.
 */
export function aggregateReinsuranceData(
  records: ReinsurerPolicyRecord[],
  reinsurerId?: string,
  scope: AnalyticsScope = 'all',
): ReinsuranceDashboardAggregates {
  records = filterRecordsByScope(records, scope);
  const coverMap = new Map<
    string,
    { productName: string; sumInsured: number; cededSumInsured: number; premium: number; recordIds: Set<string> }
  >();

  let totalSumInsured = 0;
  let totalPremium = 0;
  let totalCession = 0;
  let totalCommission = 0;

  for (const record of records) {
    // When a reinsurer filter is active, compute their share ratio
    const shareRatio = reinsurerId
      ? computeReinsurerShareRatio(record, reinsurerId)
      : 1;

    // Skip records where the selected reinsurer has no participation
    if (reinsurerId && shareRatio === 0) continue;

    // Accumulate record-level totals (scaled by share)
    totalCession += (record.totals?.cededToTreaty ?? 0) * shareRatio;
    totalCommission += (record.totals?.commissionEarned ?? 0) * shareRatio;

    for (const product of record.productBreakdown ?? []) {
      for (const cover of product.covers) {
        for (const unit of cover.units) {
          const key = unit.title || cover.title;
          if (!key) continue;

          const existing = coverMap.get(key);
          const unitSI = (unit.sumInsured ?? 0) * shareRatio;
          const unitCededSI = (unit.reinsurance?.cededSumInsured ?? 0) * shareRatio;
          const unitPremium = (unit.premium ?? 0) * shareRatio;

          totalSumInsured += unitSI;
          totalPremium += unitPremium;

          if (existing) {
            existing.sumInsured += unitSI;
            existing.cededSumInsured += unitCededSI;
            existing.premium += unitPremium;
            existing.recordIds.add(record.id);
          } else {
            coverMap.set(key, {
              productName: product.title,
              sumInsured: unitSI,
              cededSumInsured: unitCededSI,
              premium: unitPremium,
              recordIds: new Set([record.id]),
            });
          }
        }
      }
    }
  }

  const byCover: CoverAggregation[] = Array.from(coverMap.entries()).map(
    ([coverName, data]) => ({
      coverName,
      productName: data.productName,
      sumInsured: data.sumInsured,
      cededSumInsured: data.cededSumInsured,
      premium: data.premium,
      recordCount: data.recordIds.size,
    }),
  );

  // Sort descending by sumInsured for chart readability
  byCover.sort((a, b) => b.sumInsured - a.sumInsured);

  return { byCover, totalSumInsured, totalPremium, totalCession, totalCommission, totalRecords: records.length };
}

/**
 * Build a ReinsuranceSummary from enriched records, optionally scoped to a single reinsurer's share.
 * Used when a reinsurer filter is active so KPIs reflect proportional values.
 */
export function computeSummaryFromRecords(
  records: ReinsurerPolicyRecord[],
  reinsurerId?: string,
  scope: AnalyticsScope = 'all',
): ReinsuranceSummary {
  records = filterRecordsByScope(records, scope);
  let totalPolicies = 0;
  let totalQuotes = 0;
  let totalSumInsured = 0;
  let totalGrossPremium = 0;
  let totalCession = 0;
  let totalRetention = 0;
  let totalCommission = 0;

  for (const record of records) {
    const shareRatio = reinsurerId
      ? computeReinsurerShareRatio(record, reinsurerId)
      : 1;

    if (reinsurerId && shareRatio === 0) continue;

    const status = normalizeStatus(record.status ?? '');
    const isPolicy = (POLICY_STATUSES as readonly string[]).includes(status);
    if (isPolicy) {
      totalPolicies += 1;
    } else {
      totalQuotes += 1;
    }

    totalSumInsured += (record.totals?.sumInsured ?? 0) * shareRatio;
    totalGrossPremium += (record.totals?.grossPremium ?? 0) * shareRatio;
    totalCession += (record.totals?.cededToTreaty ?? 0) * shareRatio;
    totalRetention += (record.totals?.netRetention ?? 0) * shareRatio;
    totalCommission += (record.totals?.commissionEarned ?? 0) * shareRatio;
  }

  return {
    totalQuotes,
    totalPolicies,
    totalSumInsured,
    totalGrossPremium,
    totalCession,
    totalRetention,
    totalCommission,
  };
}
