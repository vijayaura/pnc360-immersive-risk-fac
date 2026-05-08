import { apiGet, apiPost } from '@/lib/api/client';
import { getProposalBundle } from '@/features/quotes/api/quotes';
import type {
  TreatyAllocation,
  TreatyReinsurerAllocation,
  TreatyBreakdownRow,
  TriggeredTreatyItem,
} from '@/features/proposals/api/referrals';
import type {
  ReinsurerPolicyRecord,
  ReinsurerProductNode,
  ReinsurerCoverBreakdown,
  ReinsurerUnitBreakdown,
  ReinsuranceSummary,
  ReinsuranceTotals,
  DashboardFilters,
  ReinsurerBreakdownEntry,
} from '../types';
import { dashboardFiltersNeedDetailEnrichment } from '../utils/filterReinsuranceRecords';

// Re-export for consumers
export type { TreatyAllocation, TreatyReinsurerAllocation };

// ─── List DTOs (matches backend PaginatedReinsuranceAllocationsResponseDto) ──

interface ReinsurancePolicyListItemDto {
  id: string;
  policyOrQuoteId: string;
  riskId?: string | null;
  risk_id?: string | null;
  riskReference?: string | null;
  risk_reference?: string | null;
  riskNumber?: string | null;
  risk_number?: string | null;
  internalReference?: string | null;
  customerName: string | null;
  productName: string | null;
  status: string;
  hasReinsurer: boolean;
  programTypes?: string[] | null;
  programNames?: string[] | null;
  treatyNames?: string[] | null;
  quoteId: string;
  policyId: string | null;
  referralId: string | null;
  /** ISO-ish timestamp from allocation created_at (for dashboard date filters). */
  createdAt?: string | null;
  reinsuredSumInsured?: number;
  reinsuredGrossPremium?: number;
}

interface ReinsurancePolicyListResponseDto {
  data: ReinsurancePolicyListItemDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── Detail DTO (matches backend getReinsurancePolicyDetail response) ───────

interface DetailReferralInformationDto {
  internalReference: string | null;
  customerName: string | null;
  productName: string | null;
  policyQuoteStatus: string;
  createdBy: string | null;
  createdDate: string;
  referralWorkflowStatus: string | null;
}

interface DetailCoverDto {
  coverId: string;
  coverName: string;
  sumInsured: number;
  premium: number;
}

interface DetailSectionDto {
  sectionId: string;
  sectionName: string;
  covers: DetailCoverDto[];
}

interface DetailProductBreakdownDto {
  productName: string | null;
  currency: string;
  sections: DetailSectionDto[];
}

interface DetailTotalsDto {
  sumInsured: number;
  grossPremium: number;
  cededToTreaty: number;
  facultativeCeded: number;
  netRetention: number;
  commissionEarned: number;
  netRetentionAfterCommission: number;
}

interface ReinsurancePolicyDetailDto {
  id: string;
  policyId: string | null;
  policyUuid: string | null;
  quoteId: string;
  quoteNumber: string;
  hasReinsurer: boolean;
  referralId: string | null;
  referralInformation: DetailReferralInformationDto;
  productBreakdown: DetailProductBreakdownDto;
  totals?: DetailTotalsDto;
  brokerOrganizationId?: string | null;
  brokerOrganizationName?: string | null;
  allocationData: Record<string, unknown>;
}

// ─── Breakdown DTO (matches backend getReinsuranceBreakdown response) ───────

export interface ReinsuranceCoverBreakdownDto {
  allocationId: string;
  coverId: string;
  referralId: string | null;
  currency?: string;
  programs: Array<{
    programId: string;
    treatyName?: string | null;
    treatyCode?: string | null;
    reinsuranceType?: string | null;
    facultativeMandatory: boolean;
    facultativeSumInsuredAbove?: number | null;
  }>;
  triggeredTreaties: TriggeredTreatyItem[];
  premiumBreakdown: Array<{ category: string; amount: number; percentage?: number }>;
  treatyBreakdownONR: { type: string; rows: TreatyBreakdownRow[] } | null;
  treatyBreakdownOGR: { type: string; rows: TreatyBreakdownRow[] } | null;
  grossPremium: number;
  sumInsured: number;
  extraRetentionPercent: number;
  extraRetentionAmount: number;
  effectiveSumInsuredForTreaties: number;
  effectiveGrossPremiumForTreaties: number;
  netRetention: number;
  cededToTreaty: number;
  facultativeCeded: number;
  commissionEarned: number;
  treatyAllocations: TreatyAllocation[];
  handling?: {
    layers: HandlingLayer[];
    extraRetentionPercent?: number;
    savedAt: string;
  } | null;
}

// ─── Params ──────────────────────────────────────────────────────────────────

export interface ListReinsurancePoliciesParams {
  page?: number;
  limit?: number;
  search?: string;
  hasReinsurer?: string;
  status?: string;
  productId?: string;
  /** Pass `'true'` to include quote-stage allocations (no policy_id) for the dashboard Quotes tab. */
  includePrePolicy?: string;
  /** Filter allocations by reinsurer entity UUID (server-side). */
  reinsurerId?: string;
  /** Filter allocations by broker entity UUID (server-side). */
  brokerId?: string;
}

// ─── Mappers ─────────────────────────────────────────────────────────────────

function mapListItemToRecord(dto: ReinsurancePolicyListItemDto): ReinsurerPolicyRecord {
  const programTypes = Array.isArray(dto.programTypes)
    ? dto.programTypes.filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    : [];
  const programNames = Array.isArray(dto.programNames)
    ? dto.programNames.filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    : [];
  const treatyNames = Array.isArray(dto.treatyNames)
    ? dto.treatyNames.filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    : [];

  const si = Number(dto.reinsuredSumInsured) || 0;
  const gp = Number(dto.reinsuredGrossPremium) || 0;
  const totals: ReinsuranceTotals | undefined =
    si > 0 || gp > 0
      ? {
          sumInsured: si,
          grossPremium: gp,
          cededToTreaty: 0,
          facultativeCeded: 0,
          netRetention: 0,
          commissionEarned: 0,
          netRetentionAfterCommission: 0,
        }
      : undefined;

  let createdDateIso: string | undefined;
  if (dto.createdAt) {
    const d = new Date(dto.createdAt);
    if (!Number.isNaN(d.getTime())) createdDateIso = d.toISOString();
  }

  return {
    id: dto.id,
    policyOrQuoteId: dto.policyOrQuoteId,
    riskId:
      dto.riskId ??
      dto.risk_id ??
      dto.riskReference ??
      dto.risk_reference ??
      dto.riskNumber ??
      dto.risk_number ??
      dto.internalReference ??
      undefined,
    customerName: dto.customerName ?? '-',
    productName: dto.productName ?? '-',
    status: dto.status,
    hasReinsurance: dto.hasReinsurer,
    referralInfo: { source: '-', createdBy: '-', createdDate: '-', status: '-' },
    productBreakdown: [],
    programTypes,
    programNames,
    treatyNames,
    quoteId: dto.quoteId,
    totals,
    createdDateIso,
  };
}

function mapDetailToRecord(dto: ReinsurancePolicyDetailDto): ReinsurerPolicyRecord {
  const sections = dto.productBreakdown?.sections ?? [];
  const productName = dto.productBreakdown?.productName ?? '-';

  const allocationData = (dto.allocationData ?? {}) as any;
  const programsByCover = (allocationData.programsByCover ?? {}) as Record<string, any[]>;
  const triggeredTreaties = Array.isArray(allocationData.triggeredTreaties)
    ? allocationData.triggeredTreaties
    : [];
  const treatyAllocations = Array.isArray(allocationData.treatyAllocations)
    ? allocationData.treatyAllocations
    : [];
  const handlingOverrides = (allocationData.handlingOverrides ?? {}) as Record<string, any>;

  const getReinsuranceForCover = (coverId: string, sumInsured: number) => {
    const coverTriggered = triggeredTreaties.filter((t: any) => t?.coverId === coverId);
    const coverPrograms = programsByCover[coverId] ?? [];
    const firstProgram = coverPrograms[0];

    // Match referral behavior: show reinsurance only when treaties are triggered
    if (coverTriggered.length === 0) return null;

    // Program column in the table is showing the treaty structure type(s) (e.g., Quota Share, Surplus)
    const programLabels = coverTriggered
      .map((t: any) => t?.treaty?.structureType)
      .filter((v: any) => typeof v === 'string' && v.trim().length > 0);
    const uniqueProgramLabels = Array.from(new Set(programLabels));
    const programType =
      uniqueProgramLabels.length > 0
        ? uniqueProgramLabels.join(', ')
        : String(firstProgram?.reinsuranceType ?? '-');

    // Treaty column in the table is showing reinsurer name(s), not treaty code
    const panelNamesFromTriggered = coverTriggered
      .flatMap((t: any) => (Array.isArray(t?.treaty?.panel) ? t.treaty.panel : []))
      .map((p: any) => p?.name)
      .filter((v: any) => typeof v === 'string' && v.trim().length > 0);

    const coverTreatyIds = coverTriggered
      .map((t: any) => t?.treaty?.id)
      .filter((v: any) => typeof v === 'string' && v.length > 0);

    const reinsurerNamesFromAllocations = treatyAllocations
      .filter((a: any) => a?.coverId === coverId || coverTreatyIds.includes(a?.treatyId))
      .flatMap((a: any) => (Array.isArray(a?.reinsurerBreakdown) ? a.reinsurerBreakdown : []))
      .map((r: any) => r?.name)
      .filter((v: any) => typeof v === 'string' && v.trim().length > 0);

    const uniqueReinsurerNames = Array.from(
      new Set([...panelNamesFromTriggered, ...reinsurerNamesFromAllocations]),
    );
    const reinsurerName =
      uniqueReinsurerNames.length > 0
        ? uniqueReinsurerNames.join(', ')
        : '-';

    const coverAllocations = treatyAllocations.filter(
      (a: any) => a?.coverId === coverId || coverTreatyIds.includes(a?.treatyId),
    );

    const firstAlloc = coverAllocations[0];
    const cedingPercentage = Number(firstAlloc?.cessionPercent ?? 0) || 0;
    const retention = Number(firstAlloc?.retentionPercent ?? 0) || 0;

    // Use saved handling totals when available (reflects extra retention adjustments)
    const coverHandling = handlingOverrides[coverId];
    const hasSavedTotals = coverHandling && typeof coverHandling.cededToTreaty === 'number';

    const cededSumInsured = hasSavedTotals
      ? coverHandling.cededToTreaty
      : coverAllocations.reduce(
          (sum: number, a: any) => sum + (Number(a?.cessionSumInsured) || 0), 0,
        );
    // Retained = Total SI - Ceded (includes unallocated SI that is fully retained)
    const retainedSumInsured = hasSavedTotals
      ? (typeof coverHandling.netRetention === 'number' ? coverHandling.netRetention : sumInsured - cededSumInsured)
      : sumInsured - cededSumInsured;

    // Program name from programsByCover or triggered treaty program
    const programName =
      firstProgram?.treatyName ??
      coverTriggered[0]?.program?.treatyName ??
      '-';

    return {
      type: String(programType),
      programName: String(programName),
      cedingPercentage,
      retention,
      reinsurerName,
      cededSumInsured,
      retainedSumInsured,
    };
  };

  const productBreakdown: ReinsurerProductNode[] = [
    {
      id: 'product-root',
      title: productName,
      covers: sections.map((section): ReinsurerCoverBreakdown => ({
        id: section.sectionId,
        title: section.sectionName,
        units: section.covers.map((cover): ReinsurerUnitBreakdown => ({
          id: cover.coverId,
          title: cover.coverName,
          sumInsured: cover.sumInsured,
          premium: cover.premium,
          reinsurance: getReinsuranceForCover(cover.coverId, cover.sumInsured),
        })),
      })),
    },
  ];

  const ref = dto.referralInformation;

  // Extract distinct reinsurer IDs and broker IDs/names from panel + allocations
  const panelReinsurerIds = triggeredTreaties
    .flatMap((t: any) => (Array.isArray(t?.treaty?.panel) ? t.treaty.panel : []))
    .map((p: any) => p?.reinsurerId || p?.reinsurerOrganizationId)
    .filter((v: any) => typeof v === 'string' && v.length > 0);

  const allocReinsurerIds = treatyAllocations
    .flatMap((a: any) => (Array.isArray(a?.reinsurerBreakdown) ? a.reinsurerBreakdown : []))
    .map((r: any) => r?.reinsurerId)
    .filter((v: any) => typeof v === 'string' && v.length > 0);

  const reinsurerIds = Array.from(new Set([...panelReinsurerIds, ...allocReinsurerIds]));

  const allocBrokerEntries = treatyAllocations
    .flatMap((a: any) => (Array.isArray(a?.reinsurerBreakdown) ? a.reinsurerBreakdown : []))
    .filter((r: any) => r?.brokerId || r?.brokerName);

  // Extract broker info from triggered treaties panel (brokerOrganizationId / brokerId + brokerName)
  const panelBrokerEntries = triggeredTreaties
    .flatMap((t: any) => (Array.isArray(t?.treaty?.panel) ? t.treaty.panel : []))
    .filter((p: any) => p?.brokerOrganizationId || p?.brokerId || p?.brokerName)
    .map((p: any) => ({ brokerId: p.brokerOrganizationId || p.brokerId, brokerName: p.brokerName, reinsurerId: p.reinsurerId || p.reinsurerOrganizationId }));

  // Also extract broker names from saved handling overrides
  const handlingBrokerEntries = Object.values(handlingOverrides)
    .flatMap((h: any) => Array.isArray(h?.layers) ? h.layers : [])
    .flatMap((layer: any) => Array.isArray(layer?.reinsurerBreakdown) ? layer.reinsurerBreakdown : [])
    .filter((r: any) => r?.brokerId || r?.brokerName);

  const allBrokerEntries = [...allocBrokerEntries, ...panelBrokerEntries, ...handlingBrokerEntries];

  const brokerIds = Array.from(new Set(
    allBrokerEntries.map((r: any) => r?.brokerId).filter((v: any) => typeof v === 'string' && v.length > 0),
  ));

  const brokerNames = Array.from(new Set(
    allBrokerEntries.map((r: any) => r?.brokerName).filter((v: any) => typeof v === 'string' && v.trim().length > 0),
  ));


  // Build coverId → coverName lookup from sections
  const coverNameById = new Map<string, string>();
  for (const section of sections) {
    for (const cover of (section.covers ?? [])) {
      if (cover.coverId && cover.coverName) {
        coverNameById.set(cover.coverId, cover.coverName);
      }
    }
  }

  // Build per-reinsurer breakdown entries from treaty allocations
  const reinsurerBreakdownEntries: ReinsurerBreakdownEntry[] = [];
  for (const alloc of treatyAllocations) {
    const rbList = Array.isArray(alloc?.reinsurerBreakdown) ? alloc.reinsurerBreakdown : [];
    for (const rb of rbList) {
      reinsurerBreakdownEntries.push({
        reinsurerId: rb?.reinsurerId ?? '',
        reinsurerName: rb?.name ?? '-',
        sharePercent: Number(rb?.sharePercent) || 0,
        sumInsured: Number(rb?.risk) || 0,
        premium: Number(rb?.sharedPremium ?? rb?.premium) || 0,
        commissionPercent: Number(rb?.commissionPercent) || 0,
        commissionAmount: Number(rb?.commissionAmount) || 0,
        brokerId: rb?.brokerId || undefined,
        brokerName: rb?.brokerName || undefined,
        treatyName: alloc?.treatyName || undefined,
        structureType: alloc?.structureType || undefined,
        rating: rb?.rating || undefined,
        coverName: (alloc?.coverId ? coverNameById.get(alloc.coverId) : undefined) || undefined,
      });
    }
  }

  // Build a lookup: reinsurerId → broker info from panel + handling overrides
  const brokerByReinsurer = new Map<string, { brokerId?: string; brokerName?: string }>();
  for (const entry of panelBrokerEntries) {
    const rid = entry?.reinsurerId;
    if (rid && (entry?.brokerName || entry?.brokerId)) {
      brokerByReinsurer.set(rid, {
        brokerId: entry.brokerId,
        brokerName: entry.brokerName,
      });
    }
  }
  for (const entry of handlingBrokerEntries) {
    const rid = entry?.reinsurerId;
    if (rid && (entry?.brokerName || entry?.brokerId)) {
      brokerByReinsurer.set(rid, {
        brokerId: entry.brokerId,
        brokerName: entry.brokerName,
      });
    }
  }

  // Enrich breakdown entries missing broker info from panel / handling overrides
  for (const rbe of reinsurerBreakdownEntries) {
    if (!rbe.brokerName && rbe.reinsurerId) {
      const hb = brokerByReinsurer.get(rbe.reinsurerId);
      if (hb) {
        rbe.brokerId = rbe.brokerId || hb.brokerId;
        rbe.brokerName = rbe.brokerName || hb.brokerName;
      }
    }
  }

  const totals: ReinsuranceTotals | undefined = dto.totals
    ? {
        sumInsured: Number(dto.totals.sumInsured) || 0,
        grossPremium: Number(dto.totals.grossPremium) || 0,
        cededToTreaty: Number(dto.totals.cededToTreaty) || 0,
        facultativeCeded: Number(dto.totals.facultativeCeded) || 0,
        netRetention: Number(dto.totals.netRetention) || 0,
        commissionEarned: Number(dto.totals.commissionEarned) || 0,
        netRetentionAfterCommission:
          Number(dto.totals.netRetentionAfterCommission) || 0,
      }
    : undefined;

  return {
    id: dto.id,
    policyOrQuoteId: dto.policyId ?? dto.quoteNumber ?? dto.id,
    riskId: ref?.internalReference ?? undefined,
    customerName: ref?.customerName ?? '-',
    productName,
    status: ref?.policyQuoteStatus ?? 'Quoted',
    hasReinsurance: dto.hasReinsurer,
    referralInfo: {
      source: '-',
      createdBy: ref?.createdBy ?? '-',
      createdDate: ref?.createdDate ?? '-',
      status: ref?.referralWorkflowStatus ?? '-',
    },
    productBreakdown,
    referralId: dto.referralId ?? null,
    quoteId: dto.quoteId,
    quoteNumber: dto.quoteNumber || undefined,
    policyUuid: dto.policyUuid ?? null,
    reinsurerIds,
    brokerIds,
    brokerNames,
    reinsurerBreakdownEntries: reinsurerBreakdownEntries.length > 0 ? reinsurerBreakdownEntries : undefined,
    totals,
    currency: dto.productBreakdown?.currency,
    createdDateIso: (() => {
      const raw = ref?.createdDate;
      if (!raw || raw === '-') return undefined;
      const d = new Date(raw);
      return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
    })(),
  };
}

// ─── API Functions ───────────────────────────────────────────────────────────

/** GET /reinsurance/policies/products — distinct product names for filter */
export async function listReinsuranceProductNames(): Promise<string[]> {
  return apiGet<string[]>('/reinsurance/policies/products');
}

/** GET /reinsurance/policies/summary — aggregate totals */
export async function fetchReinsuranceSummary(
  params?: { reinsurerId?: string; brokerId?: string },
): Promise<ReinsuranceSummary> {
  const queryParams: Record<string, string> = {};
  if (params?.reinsurerId) queryParams.reinsurerId = params.reinsurerId;
  if (params?.brokerId) queryParams.brokerId = params.brokerId;
  return apiGet<ReinsuranceSummary>(
    '/reinsurance/policies/summary',
    Object.keys(queryParams).length > 0 ? { params: queryParams } : undefined,
  );
}

/** GET /reinsurance/policies — paginated list */
export async function listReinsurancePolicies(
  params?: ListReinsurancePoliciesParams,
): Promise<{ data: ReinsurerPolicyRecord[]; meta: ReinsurancePolicyListResponseDto['meta'] }> {
  const queryParams: Record<string, string> = {};
  if (params?.page !== undefined) queryParams.page = String(params.page);
  if (params?.limit !== undefined) queryParams.limit = String(params.limit);
  if (params?.search) queryParams.search = params.search;
  if (params?.hasReinsurer) queryParams.hasReinsurer = params.hasReinsurer;
  if (params?.status) queryParams.status = params.status;
  if (params?.productId) queryParams.productId = params.productId;
  if (params?.includePrePolicy) queryParams.includePrePolicy = params.includePrePolicy;
  if (params?.reinsurerId) queryParams.reinsurerId = params.reinsurerId;
  if (params?.brokerId) queryParams.brokerId = params.brokerId;

  const response = await apiGet<ReinsurancePolicyListResponseDto>(
    '/reinsurance/policies',
    Object.keys(queryParams).length > 0 ? { params: queryParams } : undefined,
  );

  return {
    data: response.data.map(mapListItemToRecord),
    meta: response.meta,
  };
}

const MAX_LIST_FETCH_PAGES = 50;
const LIST_PAGE_LIMIT = 100;

/**
 * Fetches every page of `/reinsurance/policies` (limit 100) for dashboard client-side filtering.
 */
export async function fetchAllReinsurancePoliciesPages(
  base?: Omit<ListReinsurancePoliciesParams, 'page' | 'limit'>,
): Promise<ReinsurerPolicyRecord[]> {
  const all: ReinsurerPolicyRecord[] = [];
  let page = 1;
  while (page <= MAX_LIST_FETCH_PAGES) {
    const { data, meta } = await listReinsurancePolicies({
      ...base,
      page,
      limit: LIST_PAGE_LIMIT,
    });
    all.push(...data);
    if (data.length < LIST_PAGE_LIMIT || page >= (meta.totalPages || 1)) break;
    page += 1;
  }
  return all;
}

/** Process items in sequential batches to avoid overwhelming the server */
async function processInBatches<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  batchSize: number,
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
}

const ENRICHMENT_BATCH_SIZE = 5;

/**
 * Merge detail (and optional proposal bundle location) so dashboard filters work.
 */
export async function batchEnrichPolicyRecordsForFilters(
  records: ReinsurerPolicyRecord[],
  filters: DashboardFilters,
): Promise<ReinsurerPolicyRecord[]> {
  if (!dashboardFiltersNeedDetailEnrichment(filters) || records.length === 0) {
    return records;
  }

  const detailResults = await processInBatches(
    records,
    async (r) => getReinsurancePolicyDetail(r.id),
    ENRICHMENT_BATCH_SIZE,
  );

  let merged = records.map((r, i) => {
    const res = detailResults[i];
    if (res.status !== 'fulfilled') return r;
    const detail = res.value;
    return { ...r, ...detail, createdDateIso: detail.createdDateIso || r.createdDateIso };
  });

  if (filters.location) {
    try {
      const bundleResults = await processInBatches(
        merged,
        async (record) => {
          if (!record.quoteId) return null;
          const bundle = await getProposalBundle(record.quoteId);
          const country = bundle?.project?.country;
          const region = bundle?.project?.region;
          return country && region ? `${country}, ${region}` : country || region || null;
        },
        ENRICHMENT_BATCH_SIZE,
      );
      merged = merged.map((r, i) => {
        const res = bundleResults[i];
        if (res.status === 'fulfilled' && res.value) {
          return { ...r, location: res.value };
        }
        return r;
      });
    } catch {
      console.error('[batchEnrichPolicyRecordsForFilters] Bundle enrichment failed');
    }
  }

  return merged;
}

/**
 * GET /reinsurance/policies (list) + GET /reinsurance/policies/:id (detail) for each record.
 * Enriches every list item with totals, dates, currency by fetching details in batches.
 * Falls back to the basic list record if a detail fetch fails.
 */
export async function listReinsurancePoliciesEnriched(
  params?: ListReinsurancePoliciesParams,
): Promise<{ data: ReinsurerPolicyRecord[]; meta: ReinsurancePolicyListResponseDto['meta'] }> {
  const requestedLimit = params?.limit;
  const listResult = await listReinsurancePolicies({
    ...params,
    ...(requestedLimit !== undefined
      ? { limit: Math.min(requestedLimit, LIST_PAGE_LIMIT) }
      : {}),
  });

  // Enrich with detail data in batches of 5
  const detailResults = await processInBatches(
    listResult.data,
    async (record) => getReinsurancePolicyDetail(record.id),
    ENRICHMENT_BATCH_SIZE,
  );

  const enriched = listResult.data.map((record, i) => {
    const result = detailResults[i];
    if (result.status !== 'fulfilled') return record;
    const detail = result.value;
    return { ...record, ...detail, createdDateIso: detail.createdDateIso || record.createdDateIso };
  });

  // Fetch location data from proposal bundles in batches (best-effort)
  try {
    const bundleResults = await processInBatches(
      enriched,
      async (record) => {
        if (!record.quoteId) return null;
        const bundle = await getProposalBundle(record.quoteId);
        const country = bundle?.project?.country;
        const region = bundle?.project?.region;
        return country && region ? `${country}, ${region}` : country || region || null;
      },
      ENRICHMENT_BATCH_SIZE,
    );

    for (let i = 0; i < enriched.length; i++) {
      const result = bundleResults[i];
      if (result.status === 'fulfilled' && result.value) {
        enriched[i] = { ...enriched[i], location: result.value };
      }
    }
  } catch {
    console.error('[listReinsurancePoliciesEnriched] Bundle enrichment failed, skipping');
  }

  return { data: enriched, meta: listResult.meta };
}

/** GET /reinsurance/policies/:allocationId — policy detail */
export async function getReinsurancePolicyDetail(
  allocationId: string,
): Promise<ReinsurerPolicyRecord> {
  const dto = await apiGet<ReinsurancePolicyDetailDto>(
    `/reinsurance/policies/${encodeURIComponent(allocationId)}`,
  );
  return mapDetailToRecord(dto);
}

/** GET /reinsurance/policies/:allocationId/breakdown/:coverId — cover breakdown */
export async function getReinsuranceCoverBreakdown(
  allocationId: string,
  coverId: string,
  params?: { extraRetentionPercent?: number },
): Promise<ReinsuranceCoverBreakdownDto> {
  const queryParams: Record<string, string> = {};
  if (params?.extraRetentionPercent !== undefined) queryParams.extraRetentionPercent = String(params.extraRetentionPercent);
  return apiGet<ReinsuranceCoverBreakdownDto>(
    `/reinsurance/policies/${encodeURIComponent(allocationId)}/breakdown/${encodeURIComponent(coverId)}`,
    Object.keys(queryParams).length > 0 ? { params: queryParams } : undefined,
  );
}

/** POST /reinsurance/policies/:allocationId/breakdown/:coverId — save breakdown */
export interface HandlingLayer {
  layerType: string;
  treatyId?: string;
  overridePremium: number;
  cededSumInsured?: number;
  isFacultativeMode: boolean;
  isManualOverride: boolean;
  reinsurerBreakdown: Array<{
    reinsurerId?: string;
    name: string;
    rating?: string;
    brokerId?: string;
    brokerName?: string;
    sharePercent: number;
    risk?: number;
    premium: number;
    commissionPercent: number;
    commissionAmount: number;
  }>;
}

export async function saveReinsuranceBreakdown(
  allocationId: string,
  coverId: string,
  payload: { layers: HandlingLayer[]; extraRetentionPercent?: number; cededToTreaty?: number; netRetention?: number },
): Promise<unknown> {
  return apiPost<unknown>(
    `/reinsurance/policies/${encodeURIComponent(allocationId)}/breakdown/${encodeURIComponent(coverId)}`,
    payload,
  );
}
