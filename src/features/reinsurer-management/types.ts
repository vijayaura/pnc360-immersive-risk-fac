export type ReinsurerProgramType = string;

export interface ReinsurerProgram {
  type: ReinsurerProgramType;
  programName: string;
  cedingPercentage: number;
  retention: number;
  reinsurerName: string;
  cededSumInsured: number;
  retainedSumInsured: number;
}

export interface ReinsurerUnitBreakdown {
  id: string;
  title: string;
  sumInsured: number;
  premium: number;
  reinsurance: ReinsurerProgram | null;
}

export interface ReinsurerCoverBreakdown {
  id: string;
  title: string;
  units: ReinsurerUnitBreakdown[];
}

export interface ReinsurerProductNode {
  id: string;
  title: string;
  covers: ReinsurerCoverBreakdown[];
}

export interface ReinsurerReferralInfo {
  source: string;
  createdBy: string;
  createdDate: string;
  status: string;
}

export interface ReinsuranceSummary {
  /** Allocations with triggered reinsurance (quote + policy stages per backend summary). */
  totalQuotes?: number;
  totalPolicies: number;
  totalSumInsured: number;
  totalGrossPremium: number;
  totalRetention: number;
  totalCession: number;
  totalCommission: number;
}

export interface ReinsuranceTotals {
  sumInsured: number;
  grossPremium: number;
  cededToTreaty: number;
  facultativeCeded: number;
  netRetention: number;
  commissionEarned: number;
  netRetentionAfterCommission: number;
}

/** API-ready row: backend can map into this shape */
export interface ReinsurerPolicyRecord {
  id: string;
  /** Display id: bound policy number or quote / request id */
  policyOrQuoteId: string;
  /** Display id for the underlying risk/referral. */
  riskId?: string;
  customerName: string;
  productName: string;
  status: string;
  hasReinsurance: boolean;
  referralInfo: ReinsurerReferralInfo;
  productBreakdown: ReinsurerProductNode[];
  referralId?: string | null;
  quoteId?: string;
  quoteNumber?: string;
  policyUuid?: string | null;
  /** Distinct treaty structure types from triggered treaties (list view) */
  programTypes?: string[];
  /** Distinct reinsurance program names from triggered treaties (list view) */
  programNames?: string[];
  /** Distinct treaty display names from triggered treaties (list view) */
  treatyNames?: string[];
  /** Distinct reinsurer UUIDs from treaty panel + allocations (for filter matching) */
  reinsurerIds?: string[];
  /** Distinct reinsurer broker UUIDs from treaty allocations (for filter matching) */
  brokerIds?: string[];
  /** Distinct reinsurer broker display names from treaty allocations */
  brokerNames?: string[];
  /** Aggregate reinsurance totals (detail view) */
  totals?: ReinsuranceTotals;
  /** Display currency for this policy (detail view) */
  currency?: string;
  /** Raw ISO created date for detail view formatting */
  createdDateIso?: string;
  /** Location derived from proposal bundle (project.country) */
  location?: string;
  /** Per-reinsurer breakdown entries from treaty allocations */
  reinsurerBreakdownEntries?: ReinsurerBreakdownEntry[];
}

export interface DashboardFilters {
  search: string;
  reinsurerId: string | undefined;
  brokerId: string | undefined;
  coverType: string | undefined;
  location: string | undefined;
  dateFrom: string | undefined;
  dateTo: string | undefined;
  creditRating: string | undefined;
  sumInsuredBand: string | undefined;
}

export interface ReinsurerBreakdownEntry {
  reinsurerId: string;
  reinsurerName: string;
  sharePercent: number;
  sumInsured: number;
  premium: number;
  commissionPercent: number;
  commissionAmount: number;
  brokerId?: string;
  brokerName?: string;
  treatyName?: string;
  structureType?: string;
  rating?: string;
  coverName?: string;
}
