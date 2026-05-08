import { apiGet, apiPatch, apiPost, api } from '@/lib/api/client';

// ─── Status / Priority ────────────────────────────────────────────────────────

export type ReferralStatus =
  | 'open'
  | 'in_review'
  | 'query_raised'
  | 'approved'
  | 'approved_with_conditions'
  | 'declined'
  | 'closed';

export type ReferralPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

// ─── List ─────────────────────────────────────────────────────────────────────

export interface ReferralListItem {
  id: string;                  // UUID — use for all API calls
  referralId: string;          // Display ID e.g. "REF-215"
  quoteId: string;             // Display quote ID e.g. "AMQ3F9A2"
  customerName: string | null;
  companyName: string | null;
  projectType: string | null;
  broker: string | null;
  insurer: string | null;
  productName: string | null;
  currency: string | null;
  status: ReferralStatus | string;
  priority: string | null;
  reason: string | null;
  createdAt: string;
  updatedAt: string;
  unreadMessageCount: number;
}

export interface ReferralListResponse {
  data: ReferralListItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── Detail ───────────────────────────────────────────────────────────────────

export interface FormResponseValue {
  fieldId: string;
  fieldName: string;
  valueText: string | null;
  valueJson: unknown;
  masterValueId: string | null;
}

export interface FormResponseFile {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
  url: string;
}

export interface ReferralActivity {
  id: string;
  actorType: string;           // "user" | "system"
  actorId: string | null;
  actionType: string;
  comment: string | null;
  oldStatus: string | null;
  newStatus: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
}

export interface ReferralAdjustment {
  id: string;
  adjustmentType: string;
  adjustmentValue: number | null;
  description: string;
  appliedBy: string;
  createdAt: string;
}

export interface ReferralRequest {
  id: string;
  requestType: string;
  description: string;
  status: string;
  requestedBy: string;
  createdAt: string;
}

export interface ReferralReview {
  id: string;
  referralId: string;
  underwriterNotes: string;
  riskRating: string;          // "low" | "medium" | "high"
  decision: string;
  modificationDetails: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ReferralDetailResponse {
  id: string;
  referralId: string;
  quoteEvaluationId: string;
  ratingRunId: string;
  insurerOrgId: string;
  quoteId: string | null;
  quoteNumber: string | null;
  customerName: string | null;
  companyName: string | null;
  brokerName: string | null;
  insurerName: string | null;
  productName: string | null;
  productId: string | null;
  currency: string | null;
  status: ReferralStatus | string;
  priority: string | null;
  reason: string | null;
  triggerSourceType: string | null;
  triggerDetails: Record<string, unknown> | null;
  referredAt: string;
  updatedAt: string;
  formResponseData: {
    responseId: string;
    templateId: string;
    productId: string;
    status: string;
    submittedAt: string | null;
    isLocked: boolean;
    values: FormResponseValue[];
    files: FormResponseFile[];
  } | null;
  activities: ReferralActivity[];
  adjustments: ReferralAdjustment[];
  requests: ReferralRequest[];
  referralReview: ReferralReview | null;
  projectBreakdown?: Array<{
    id: string;
    title: string;
    covers: Array<{
      id: string;
      title: string;
      units: Array<{
        id: string;
        label: string;
        sumInsured?: number | null;
        premium?: number | null;
        adjustmentType?: string | null;
        quoteAction?: string | null;
      }>;
    }>;
  }> | null;
  totalSumInsured?: number | string | null;
  finalPremium?: number | string | null;
  pricingVersions?: Array<{
    versionId: string;
    versionName: string;
    versionNumber: number;
    createdAt: string;
    value: Array<{ ratingParameterId: string; value: number | null }>;
  }> | null;
  pricingBreakdown?: {
    sumInsured: number;
    sumInsuredFormula?: string;
    base: number;
    baseFormula?: string;
    loading: number;
    loadingFormula?: string;
    discount: number;
    discountFormula?: string;
    fee: number;
    total: number;
    covers: Array<{
      coverId: string;
      code?: string;
      name?: string;
      sectionId?: string;
      sectionName?: string;
      sectionOrder?: number;
      sumInsured: number;
      premium: number;
      netPremium: number;
      taxAmount?: number;
      premiumFormula?: string;
      sumInsuredFormula?: string;
      riskCategoryId?: string;
      units?: Array<{
        rowIndex: number;
        rowLabel: string;
        firstColumnValue?: string;
        sumInsured: number;
        premium?: number;
        netPremium?: number;
        taxAmount?: number;
        sumInsuredFormula?: string;
        premiumFormula?: string;
      }>;
    }>;
    units?: Array<{
      rowIndex: number;
      rowLabel: string;
      firstColumnValue?: string;
      sumInsured: number;
      base: number;
      loading: number;
      discount: number;
      fee: number;
      total: number;
      sumInsuredFormula?: string;
      baseFormula?: string;
      loadingFormula?: string;
      discountFormula?: string;
      covers?: Array<{
        coverId: string;
        name?: string;
        code?: string;
        sectionId?: string;
        sectionName?: string;
        sectionOrder?: number;
        sumInsured: number;
        premium: number;
        netPremium: number;
        taxAmount?: number;
        sumInsuredFormula?: string;
        premiumFormula?: string;
      }>;
      ratingInputs?: Array<{
        fieldId: string;
        fieldName: string;
        fieldLabel: string;
        rawValue?: unknown;
        valueNumber?: number;
        valueBoolean?: boolean;
        valueString?: string;
      }>;
      premiumInputs?: Array<{
        fieldId: string;
        fieldName: string;
        fieldLabel: string;
        rawValue?: unknown;
        valueNumber?: number;
        valueBoolean?: boolean;
        valueString?: string;
      }>;
    }>;
    combinationFirstColumnLabel?: string;
    unitsCount?: number;
    feeCalculations?: unknown[];
  } | null;
  customerDetails?: {
    customerId: string;
    customerRefId: string;
    customerKey: string;
    customerIdentifier: string;
    customerName: string;
    customerSince: string | null;
    lastTransactionAt: string | null;
    lockedFields?: Array<{
      keyName: string;
      value: string;
    }>;
  };
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export interface ChatAttachment {
  id: string;
  fileName: string;
  url: string;
}

export interface ReferralChatMessage {
  id: string;
  referralId: string;
  senderRole: string;          // "insurer" | "broker"
  message: string;
  attachments: ChatAttachment[];
  insurerReadAt: string | null;
  brokerReadAt: string | null;
  createdAt: string;
}

// ─── Reinsurance Context ──────────────────────────────────────────────────────

export interface ReinsuranceContextCover {
  id: string;
  name: string;
}

export interface ReinsuranceContextSection {
  id: string;
  name: string;
  covers: ReinsuranceContextCover[];
}

export interface TriggeredTreatyItem {
  treaty: {
    id: string;
    structureType: string;
    name: string | null;
    treatyCode: string | null;
    quotaSharePercent: number | null;
    cedingCommissionPercent: number | null;
    retentionPercent: number;
    surplusLines: number;
    surplusRetentionPercent: number;
    surplusRetentionLimit: number;
    surplusMaxCapacity: number;
    surplusCedingCommission: number;
    totalCessionPercent: number;
    panel: Array<{ reinsurerId: string; sharePercent: number; name?: string }>;
  };
  program: {
    id: string;
    treatyName: string | null;
    treatyCode: string | null;
    reinsuranceType: string | null;
  };
  coverId: string;
  coverTitle?: string;
  conditionsMatched: string[];
}

export interface TreatyBreakdownRow {
  category: string;
  premium?: number;
  commissionPct?: number;
  commission?: number;
  sharePct?: number;
  risk?: number;
  ratePer?: number;
  rateAfterCommission?: number;
}

export interface TreatyReinsurerAllocation {
  reinsurerId: string;
  name: string;
  brokerId?: string;
  brokerName?: string;
  sharePercent: number;
  risk: number;
  sharedPremium: number;
  commissionPercent: number;
  commissionAmount: number;
  ratePer: number;
  rateAfterCommission: number;
}

export interface TreatyAllocation {
  treatyId: string;
  structureType: string;
  treatyCode: string;
  treatyName?: string;
  coverId?: string;
  programId?: string;
  programName?: string;
  allocatedSumInsured: number;
  allocatedPremium: number;
  percentOfTotal: number;
  retentionPercent: number;
  cessionPercent: number;
  retentionAmount: number;
  cessionAmount: number;
  retentionSumInsured: number;
  cessionSumInsured: number;
  commissionPercent: number;
  commissionAmount: number;
  netRetentionAfterCommission: number;
  technicalRate: number;
  premiumBasisOgrOnr?: string;
  isFacultative?: boolean;
  reinsurerBreakdown: TreatyReinsurerAllocation[];
}

export interface ReinsuranceContextResponse {
  referralId: string;
  productId: string | null;
  sections: ReinsuranceContextSection[];
  programsByCover: Record<
    string,
    Array<{
      programId: string;
      treatyName: string;
      treatyCode: string;
      reinsuranceType: string;
      facultativeMandatory: boolean;
      facultativeSumInsuredAbove: number | null;
    }>
  >;
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
}

// ─── Params ───────────────────────────────────────────────────────────────────

export interface ListReferralsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ReferralStatus | string;
  priority?: string;
  brokerId?: string;
  insurerId?: string;
  productId?: string;
  startDate?: string;
  endDate?: string;
}

// ─── API Functions ────────────────────────────────────────────────────────────

/** GET /referrals */
export async function listReferrals(params?: ListReferralsParams): Promise<ReferralListResponse> {
  const queryParams: Record<string, string> = {};
  if (params?.page !== undefined) queryParams.page = String(params.page);
  if (params?.limit !== undefined) queryParams.limit = String(params.limit);
  if (params?.search) queryParams.search = params.search;
  if (params?.status) queryParams.status = params.status;
  if (params?.priority) queryParams.priority = params.priority;
  if (params?.brokerId) queryParams.brokerId = params.brokerId;
  if (params?.insurerId) queryParams.insurerId = params.insurerId;
  if (params?.productId) queryParams.productId = params.productId;
  if (params?.startDate) queryParams.startDate = params.startDate;
  if (params?.endDate) queryParams.endDate = params.endDate;

  return apiGet<ReferralListResponse>(
    '/referrals',
    Object.keys(queryParams).length > 0 ? { params: queryParams } : undefined,
  );
}

/** GET /referrals/:id */
export async function getReferralDetail(id: string): Promise<ReferralDetailResponse> {
  return apiGet<ReferralDetailResponse>(`/referrals/${encodeURIComponent(id)}`);
}

/** PATCH /referrals/:id/status */
export async function updateReferralStatus(
  id: string,
  payload: { status: string; comment?: string },
): Promise<{ message: string }> {
  return apiPatch<{ message: string }>(`/referrals/${encodeURIComponent(id)}/status`, payload);
}

/** PATCH /referrals/:id/priority */
export async function updateReferralPriority(
  id: string,
  payload: { priority: string },
): Promise<{ message: string }> {
  return apiPatch<{ message: string }>(`/referrals/${encodeURIComponent(id)}/priority`, payload);
}

/** POST /referrals/:id/comments */
export async function addReferralComment(
  id: string,
  payload: { comment: string },
): Promise<{ message: string }> {
  return apiPost<{ message: string }>(`/referrals/${encodeURIComponent(id)}/comments`, payload);
}

export interface CreateManualReferralRequest {
  quoteEvaluationId: string;
  insurerOrgId: string;
  note: string;
  selectedCoverIds?: string[];
}

export interface CreateManualReferralResponse {
  id: string;
  referralId: string;
  status: ReferralStatus;
}

export async function createManualReferral(
  payload: CreateManualReferralRequest,
): Promise<CreateManualReferralResponse> {
  return apiPost<CreateManualReferralResponse>('/referrals/manual', payload);
}

/** POST /referrals/:id/review */
export async function submitReview(
  id: string,
  payload: {
    underwriterNotes: string;
    riskRating: string;
    decision: string;
    modificationDetails?: {
      premiumLoadingType?: 'PERCENTAGE' | 'AMOUNT';
      premiumLoadingValue?: number;
    };
  },
): Promise<{ message: string }> {
  return apiPost<{ message: string }>(`/referrals/${encodeURIComponent(id)}/review`, payload);
}

/** POST /referrals/:referralId/chat/query — multipart/form-data */
export async function raiseQuery(
  referralId: string,
  payload: { category: string; message: string; dueDate?: string; files?: File[] },
): Promise<ReferralChatMessage> {
  const form = new FormData();
  form.append('category', payload.category);
  form.append('message', payload.message || 'Shared file(s)');
  if (payload.dueDate) form.append('dueDate', payload.dueDate);
  if (payload.files) payload.files.forEach((f) => form.append('files', f));
  return apiPost<ReferralChatMessage>(
    `/referrals/${encodeURIComponent(referralId)}/chat/query`,
    form,
  );
}

/** GET /referrals/:referralId/chat/messages */
export async function listChatMessages(referralId: string): Promise<{data: ReferralChatMessage[]; meta: Record<string, unknown>}> {
  return apiGet<{data: ReferralChatMessage[]; meta: Record<string, unknown>}>(
    `/referrals/${encodeURIComponent(referralId)}/chat/messages`,
  );
}

/** GET /reinsurance/referral/:referralId/context */
export async function getReinsuranceContext(
  referralId: string,
  params?: { sumInsured?: number; grossPremium?: number; policyInceptionDate?: string; extraRetentionPercent?: number },
): Promise<ReinsuranceContextResponse> {
  const queryParams: Record<string, string> = {};
  if (params?.sumInsured !== undefined) queryParams.sumInsured = String(params.sumInsured);
  if (params?.grossPremium !== undefined) queryParams.grossPremium = String(params.grossPremium);
  if (params?.policyInceptionDate) queryParams.policyInceptionDate = params.policyInceptionDate;
  if (params?.extraRetentionPercent !== undefined) queryParams.extraRetentionPercent = String(params.extraRetentionPercent);
  return apiGet<ReinsuranceContextResponse>(
    `/reinsurance/referral/${encodeURIComponent(referralId)}/context`,
    Object.keys(queryParams).length > 0 ? { params: queryParams } : undefined,
  );
}

/** POST /reinsurance/referral/:referralId/handling */
export async function saveReinsuranceHandling(
  referralId: string,
  payload: {
    coverId?: string | null;
    unitId?: string | null;
    extraRetentionPercent?: number;
    layers: Array<{
      layerType: string;
      treatyId?: string;
      overridePremium: number;
      isFacultativeMode: boolean;
      isManualOverride: boolean;
      reinsurerBreakdown: Array<{
        name: string;
        sharePercentage: number;
        premium: number;
        commissionPercent: number;
        commissionAmount: number;
      }>;
    }>;
  },
): Promise<unknown> {
  return apiPost<unknown>(
    `/reinsurance/referral/${encodeURIComponent(referralId)}/handling`,
    payload,
  );
}

/** GET /reinsurance/referral/:referralId/handling */
export async function getReinsuranceHandling(
  referralId: string,
  params?: { coverId?: string; unitId?: string },
): Promise<unknown> {
  const queryParams: Record<string, string> = {};
  if (params?.coverId) queryParams.coverId = params.coverId;
  if (params?.unitId) queryParams.unitId = params.unitId;
  return apiGet<unknown>(
    `/reinsurance/referral/${encodeURIComponent(referralId)}/handling`,
    Object.keys(queryParams).length > 0 ? { params: queryParams } : undefined,
  );
}

// ─── Legacy / backward compat ─────────────────────────────────────────────────

/** @deprecated Use getReferralDetail instead */
export async function getReferralById(id: string | number): Promise<ReferralDetailResponse> {
  return getReferralDetail(String(id));
}

// ─── PDF Download (server-generated) ────────────────────────────────────────

export async function downloadReferralPdf(referralId: string): Promise<Blob> {
  const response = await api.post(
    `/referrals/${encodeURIComponent(referralId)}/download-pdf`,
    { timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
    {
      responseType: 'blob',
      headers: { Accept: 'application/pdf' },
    },
  );
  return response.data;
}

export async function downloadBrokerReferralPdf(referralId: string): Promise<Blob> {
  const response = await api.post(
    `/referrals/${encodeURIComponent(referralId)}/broker-download-pdf`,
    { timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
    {
      responseType: 'blob',
      headers: { Accept: 'application/pdf' },
    },
  );
  return response.data;
}

// ─── Legacy / backward compat ─────────────────────────────────────────────────

export type { ReferralListItem as ReferralItem };
export type { ReferralListResponse as ReferralsListResponse };
