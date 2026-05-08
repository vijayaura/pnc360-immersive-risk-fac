import { apiGet, apiPost, apiPatch, apiDelete } from './client';
import type { ProposalBundleResponseV2, PolicyDetailsAPIResponse } from '@/features/quotes/api/quotes';
import type {
  SaveProposalFormRequest,
  SaveProposalFormResponse,
} from '@/features/product-config/proposal-form/api/saveProposalForm';

export interface EndorsementListItem {
  endorsementId: string;
  policyId?: string;
  requestedBy?: string;
  endorsementReference: string;
  policyNumber: string;
  type: string;
  effectiveDate: string;
  createdAt?: string;
  status: string;
  totalEndorsementAmount?: number | null;
  isUnreadEndorsement?: boolean;
  unreadMessageCount?: number;
}

export interface EndorsementListResponse {
  data: EndorsementListItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/** Single item from GET /policies/:policyId/endorsements */
export interface PolicyEndorsementListItem {
  id: string;
  type: string;
  status: string;
  versionNumber: number;
  endorsementReference: string;
  effectiveDate: string;
  premiumSnapshot: unknown;
  refundAmount: string | null;
  cancellationDetails: string | null;
  productName: string;
  insurerName: string;
  createdAt: string;
}

export interface PolicyEndorsementsListResponse {
  data: PolicyEndorsementListItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/** Supporting document from API (for edit prefill, view, and delete). */
export interface SupportingDocumentItem {
  fileId: string;
  fileName?: string;
  originalFilename?: string;
  contentType?: string;
  sizeBytes?: string;
  url?: string;
  uploadedAt?: string;
  documentName?: string | null;
  documentType?: string | null;
}

export interface EndorsementDocumentItem {
  id?: string;
  fileId?: string;
  fileName?: string;
  originalFilename?: string;
  filename?: string;
  documentName?: string;
  contentType?: string;
  sizeBytes?: string;
  url?: string;
  createdAt?: string;
  uploadedAt?: string;
  documentType?: string | null;
}

export interface EndorsementDetailResponse {
  endorsementId: string;
  formResponseId: string | null;
  endorsementReference: string;
  versionNumber: number;
  status: string;
  type: string;
  policyId: string;
  insurerOrgId?: string | null;
  currency?: string | null;
  effectiveDate?: string;
  premiumSnapshot: unknown;
  refundAmount: string | number | null;
  cancellationDetails: string | null;
  /** Present for type "extensions"; ISO date string. */
  policyExpiryDate?: string | null;
  recalculationDetails?: {
    originalPremium?: number;
    revisedPremium?: number;
    variation?: number;
    proRatedPremium?: number;
    autoCalculatePremium?: boolean | null;
    manualOverride?: boolean | null;
    overridePremium?: number | null;
    loading?: number | null;
    totalEndorsementAmount?: number | null;
    endorsementFees?: Array<{
      label?: string;
      adjustmentType?: string;
      adjustmentValue?: string | number;
      amount?: string | number;
      formula?: string;
    }>;
  } | null;
  createdAt: string;
  updatedAt: string;
  /** Prefilled in edit flow; used to show and delete existing documents. */
  supportingDocuments?: SupportingDocumentItem[];
  /** Required docs for technical/non-technical endorsement flows. */
  endorsementRequiredDocuments?: EndorsementDocumentItem[];
  /** Additional docs for technical/non-technical endorsement flows. */
  additionalDocuments?: EndorsementDocumentItem[];
}

export interface GetEndorsementByIdResponse {
  message?: string;
  data: EndorsementDetailResponse;
}

export interface CreateEndorsementPayload {
  policyId: string;
  type: string;
  effectiveDate: string;
  refundAmount?: number;
  cancellationDetails?: string;
  /** Required when type is "extensions"; ISO date string (yyyy-MM-dd). */
  policyExpiryDate?: string;
}

export type CreateEndorsementResponse = EndorsementDetailResponse;

/** Payload for PATCH /endorsements/:id/status */
export interface UpdateEndorsementStatusPayload {
  status: string;
}

/** Response from PATCH /endorsements/:id/status */
export interface UpdateEndorsementStatusResponse {
  endorsementId: string;
  status: string;
  approvedAt?: string;
  premiumSnapshot?: {
    quoteId: string;
    ratingRunId: string;
  };
}

export async function listEndorsements(params?: {
  page?: number;
  limit?: number;
  search?: string;
  /** Filter by status (e.g. 'draft' | 'submitted' | 'approved' | 'rejected'). Optional. */
  status?: string;
  /** Filter by type (e.g. 'technical' | 'non_technical' | 'cancellation'). Optional. */
  type?: string;
  /** Filter by product ID. Optional – used by dashboard product filters. */
  productId?: string | number;
  /** Filter by broker organisation ID. Optional – used by the broker dashboard. */
  brokerId?: string | number;
}): Promise<EndorsementListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page != null) searchParams.set('page', String(params.page));
  if (params?.limit != null) searchParams.set('limit', String(params.limit));
  if (params?.search != null && params.search.trim() !== '')
    searchParams.set('search', params.search.trim());
  if (params?.status != null && params.status.trim() !== '')
    searchParams.set('status', params.status.trim());
  if (params?.type != null && params.type.trim() !== '')
    searchParams.set('type', params.type.trim());
  if (params?.productId != null && String(params.productId).trim() !== '')
    searchParams.set('productId', String(params.productId).trim());
  if (params?.brokerId != null && String(params.brokerId).trim() !== '')
    searchParams.set('brokerId', String(params.brokerId).trim());
  const query = searchParams.toString();
  return apiGet<EndorsementListResponse>(`/endorsements${query ? `?${query}` : ''}`);
}

export async function listPolicyEndorsements(
  policyId: string,
  params?: { page?: number; limit?: number }
): Promise<PolicyEndorsementsListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page != null) searchParams.set('page', String(params.page));
  if (params?.limit != null) searchParams.set('limit', String(params.limit));
  const query = searchParams.toString();
  return apiGet<PolicyEndorsementsListResponse>(
    `/policies/${encodeURIComponent(policyId)}/endorsements${query ? `?${query}` : ''}`
  );
}

export async function getEndorsementById(id: string): Promise<GetEndorsementByIdResponse> {
  return apiGet<GetEndorsementByIdResponse>(`/endorsements/${encodeURIComponent(id)}`);
}

export async function getEndorsementDetail(
  endorsementId: string
): Promise<PolicyDetailsAPIResponse> {
  return apiGet<PolicyDetailsAPIResponse>(
    `/endorsement-detail/${encodeURIComponent(endorsementId)}`
  );
}

export async function createEndorsement(formData: FormData): Promise<CreateEndorsementResponse> {
  return apiPost<CreateEndorsementResponse>('/endorsements', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export async function getEndorsementRender(
  endorsementId: string
): Promise<ProposalBundleResponseV2> {
  return apiGet<ProposalBundleResponseV2>(
    `/endorsements/${encodeURIComponent(endorsementId)}/render`
  );
}

export async function updateEndorsementForm(
  endorsementId: string,
  data: SaveProposalFormRequest,
  files?: { key: string; file: File }[]
): Promise<SaveProposalFormResponse> {
  if (files && files.length > 0) {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value === null || value === undefined) return;
      if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    });
    files.forEach(({ key, file }) => formData.append(key, file));
    return apiPatch<SaveProposalFormResponse>(
      `/endorsements/${encodeURIComponent(endorsementId)}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  }
  return apiPatch<SaveProposalFormResponse>(
    `/endorsements/${encodeURIComponent(endorsementId)}`,
    data
  );
}

export async function updateEndorsementStatus(
  endorsementId: string,
  payload: UpdateEndorsementStatusPayload
): Promise<UpdateEndorsementStatusResponse> {
  return apiPatch<UpdateEndorsementStatusResponse>(
    `/endorsements/${encodeURIComponent(endorsementId)}/status`,
    payload
  );
}

export async function saveEndorsement(
  endorsementId: string,
  formData: FormData
): Promise<CreateEndorsementResponse> {
  return apiPost<CreateEndorsementResponse>(
    `/endorsements/${encodeURIComponent(endorsementId)}/save`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
}

export interface SaveCancellationRefundPayload {
  policyId: string;
  refundAmount: number;
}

export async function saveCancellationRefund(
  endorsementId: string,
  payload: SaveCancellationRefundPayload
): Promise<CreateEndorsementResponse> {
  return apiPost<CreateEndorsementResponse>(
    `/endorsements/${encodeURIComponent(endorsementId)}/save`,
    payload
  );
}

export interface SaveReCalculatedPremiumPayload {
  originalPremium: number;
  revisedPremium: number;
  variation: number;
  proRatedPremium: number;
  autoCalculatePremium?: boolean;
  manualOverride?: boolean;
  overridePremium?: number;
  loading?: number;
  totalEndorsementAmount?: number;
  fees?: Array<{
    label: string;
    adjustmentType: string;
    adjustmentValue: number;
  }>;
  endorsementFees?: Array<{
    label: string;
    adjustmentType: string;
    adjustmentValue: number;
    amount?: number;
    formula?: string;
  }>;
}

export async function saveReCalculatedPremium(
  endorsementId: string,
  payload: SaveReCalculatedPremiumPayload
): Promise<CreateEndorsementResponse> {
  return apiPost<CreateEndorsementResponse>(
    `/endorsements/${encodeURIComponent(endorsementId)}/save/re-calculated-premium`,
    payload
  );
}

export interface EndorsementFeeTypeItem {
  id: string;
  label: string;
  adjustmentType: string;
  adjustmentValue: string | number;
  status: string;
  isEditable?: boolean;
  parentId?: string | null;
  organizationId?: string;
  productId?: string;
  createdById?: string;
  updatedById?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface SaveEndorsementFeeTypePayload {
  id?: string;
  label: string;
  adjustmentType: string;
  adjustmentValue: number;
  status: string;
  productId?: string;
}

export async function getInsurerEndorsementFeeTypes(
  insurerId: string | number
): Promise<EndorsementFeeTypeItem[]> {
  return apiGet<EndorsementFeeTypeItem[]>(
    `/insurer/${encodeURIComponent(String(insurerId))}/endorsement-fee-types`
  );
}

export async function saveInsurerEndorsementFeeType(
  insurerId: string | number,
  payload: SaveEndorsementFeeTypePayload
): Promise<EndorsementFeeTypeItem> {
  return apiPost<EndorsementFeeTypeItem>(
    `/insurer/${encodeURIComponent(String(insurerId))}/endorsement-fee-types`,
    payload
  );
}

export async function saveInsurerEndorsementFeeTypes(
  insurerId: string | number,
  payload: SaveEndorsementFeeTypePayload[]
): Promise<EndorsementFeeTypeItem[]> {
  return apiPost<EndorsementFeeTypeItem[]>(
    `/insurer/${encodeURIComponent(String(insurerId))}/endorsement-fee-types`,
    payload
  );
}

export async function getProductEndorsementFeeTypes(
  productId: string | number
): Promise<EndorsementFeeTypeItem[]> {
  return apiGet<EndorsementFeeTypeItem[]>(
    `/product/${encodeURIComponent(String(productId))}/endorsement-fee-types`
  );
}

export async function saveProductEndorsementFeeTypes(
  productId: string | number,
  payload: SaveEndorsementFeeTypePayload[]
): Promise<EndorsementFeeTypeItem[]> {
  return apiPost<EndorsementFeeTypeItem[]>(
    `/product/${encodeURIComponent(String(productId))}/endorsement-fee-types`,
    payload
  );
}

export async function deleteUploadedFile(fileId: string): Promise<void> {
  await apiDelete<void>(
    `/required-document/uploaded-file/${encodeURIComponent(fileId)}`
  );
}

export interface EndorsementPremiumBreakdown {
  originalPremium: number;
  revisedPremium: number;
  variation: number;
  proRatedPremium?: number;
  totalEndorsementAmount?: number;
  fees?: Array<{
    label?: string;
    adjustmentType?: string;
    adjustmentValue?: string | number;
  }>;
  endorsementFees?: Array<{
    label?: string;
    adjustmentType?: string;
    adjustmentValue?: string | number;
    amount?: string | number;
    formula?: string;
  }>;
}

export type CalculatePremiumResponse = {
  quote_id?: string;
  quoteId?: string;
  formResponseId?: string;
  product_id?: string;
  productId?: string;
  insurers?: unknown[];
  results?: unknown[];
  breakdown?: EndorsementPremiumBreakdown;
  [key: string]: unknown;
};

export async function calculateEndorsementPremium(
  endorsementId: string
): Promise<CalculatePremiumResponse> {
  const _ts = Date.now();
  return apiGet<CalculatePremiumResponse>(
    `/endorsements/${encodeURIComponent(endorsementId)}/calculate-premium`
  );
}

export interface RecalculatePremiumPayload {
  revisedPremiumAmount: number;
}

export interface RecalculatePremiumResponse {
  originalPremium: number;
  revisedPremium: number;
  variation: number;
  proRatedPremium: number;
  overridePremium?: number;
  endorsementFee?: number;
  endorsementFees?: Array<{
    label?: string;
    adjustmentType?: string;
    adjustmentValue?: string | number;
    amount?: string | number;
    formula?: string;
  }>;
  totalEndorsementAmount?: number;
  totalPolicyDays?: number;
  remainingDays?: number;
  loading?: number;
}

export async function recalculateEndorsementPremium(
  endorsementId: string,
  payload: RecalculatePremiumPayload
): Promise<RecalculatePremiumResponse> {
  return apiPost<RecalculatePremiumResponse>(
    `/endorsements/${encodeURIComponent(endorsementId)}/recalculate-premium`,
    payload
  );
}

export interface SelectPremiumSelectedPremium {
  basePremium: number;
  totalPremium: number;
  loadingAmount?: number;
  discountAmount?: number;
  feeAmount: number;
  currency: string;
  netPremium?: number;
  brokerCommissionPercentage?: number;
  brokerCommissionAmount?: number;
  brokerMinCommissionPercentage?: number;
  brokerMaxCommissionPercentage?: number;
  brokerBaseCommissionPercentage?: number;
  cewAdjustmentsPercentage?: number;
  cewAdjustmentsAmount?: number;
  feeComponents?: Record<string, number>;
  [key: string]: unknown;
}

export interface SelectPremiumTplItem {
  defaultLimit?: number;
  selectedLimit: {
    code?: string;
    currency?: string;
    description?: string;
    limitValue: number;
    loading?: number;
    premiumImpact?: string;
    pricingType?: string;
    [key: string]: unknown;
  };
}

export interface SelectPremiumDeductiblesConfiguration {
  selectedDeductible: {
    code?: string;
    value: number;
    quoteOption?: string;
    loading?: number;
    premiumImpact?: string;
    [key: string]: unknown;
  };
}

export interface SelectPremiumConfigurableItem {
  code: string;
  title: string;
  description?: string;
  type?: string;
  pricingType?: string;
  loading?: number;
  value?: number;
  evaluatedAmount?: number;
  premiumImpact?: string;
  isMandatory?: boolean;
  isOptional?: boolean;
  selected: boolean;
  tags?: string[];
  selected_covers?: Array<{
    id: string;
    name?: string;
    code?: string;
    section_id?: string;
    section_name?: string;
    section_order?: number;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

export interface SelectPremiumRequest {
  configurableItems?: SelectPremiumConfigurableItem[];
  deductiblesConfiguration?: Array<SelectPremiumDeductiblesConfiguration>;
  selectedPremium: SelectPremiumSelectedPremium;
  selectedCovers?: Array<{
    coverId: string;
    isSelected: boolean;
    [key: string]: unknown;
  }>;
  tplConfiguration?: SelectPremiumTplItem[];
}

export interface SelectPremiumResponse {
  message?: string;
  status?: string;
  id?: string;
  [key: string]: unknown;
}

export async function selectEndorsementPremium(
  endorsementId: string,
  payload: SelectPremiumRequest
): Promise<SelectPremiumResponse> {
  return apiPost<SelectPremiumResponse>(
    `/endorsements/${encodeURIComponent(endorsementId)}/select-premium`,
    payload
  );
}

export interface SelectedPremiumSnapshotConfigurableItem {
  code: string;
  title?: string;
  description?: string;
  type?: string;
  value?: number;
  loading?: number;
  selected?: boolean;
  isOptional?: boolean;
  isMandatory?: boolean;
  pricingType?: string;
  premiumImpact?: string;
  evaluatedAmount?: number;
  tags?: unknown[];
  selected_covers?: Array<{
    id: string;
    name?: string;
    code?: string;
    section_id?: string;
    section_name?: string;
    section_order?: number;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

export interface SelectedPremiumSnapshotTplLimit {
  code?: string;
  limitValue: number;
  loading?: number;
  currency?: string;
  description?: string;
  pricingType?: string;
  premiumImpact?: string;
  [key: string]: unknown;
}

export interface SelectedPremiumSnapshotTplItem {
  defaultLimit?: number;
  selectedLimit: SelectedPremiumSnapshotTplLimit;
}

export interface SelectedPremiumSnapshotSelectedPremium {
  currency?: string;
  basePremium?: number;
  totalPremium?: number;
  feeAmount?: number;
  netPremium?: number;
  loadingAmount?: number;
  discountAmount?: number;
  brokerCommissionPercentage?: number;
  brokerCommissionAmount?: number;
  brokerMinCommissionPercentage?: number;
  brokerMaxCommissionPercentage?: number;
  brokerBaseCommissionPercentage?: number;
  cewAdjustmentsPercentage?: number;
  cewAdjustmentsAmount?: number;
  feeComponents?: Record<string, number>;
  [key: string]: unknown;
}

export interface SelectedPremiumSnapshot {
  covers?: Array<{
    coverId?: string;
    isSelected?: boolean;
    [key: string]: unknown;
  }>;
  premium?: Record<string, unknown>;
  quoteId?: string;
  feeAmount?: number;
  sumInsured?: number;
  basePremium?: number;
  ratingRunId?: string;
  totalPremium?: number;
  loadingAmount?: number;
  discountAmount?: number;
  selectedPremium?: SelectedPremiumSnapshotSelectedPremium;
  selectedCovers?: Array<{
    coverId?: string;
    isSelected?: boolean;
    [key: string]: unknown;
  }>;
  tplConfiguration?: SelectedPremiumSnapshotTplItem[];
  configurableItems?: SelectedPremiumSnapshotConfigurableItem[];
  deductiblesConfiguration?: unknown[];
  [key: string]: unknown;
}

export interface GetSelectedPremiumResponse {
  endorsementId: string;
  premiumSnapshot?: SelectedPremiumSnapshot;
  updatedAt?: string;
  [key: string]: unknown;
}

export async function getEndorsementSelectedPremium(
  endorsementId: string
): Promise<GetSelectedPremiumResponse> {
  return apiGet<GetSelectedPremiumResponse>(
    `/endorsements/${encodeURIComponent(endorsementId)}/selected-premium`
  );
}

/** Single field difference from GET /endorsements/:id/difference */
export interface EndorsementDifferenceItem {
  fieldId: string;
  fieldName: string;
  previousValueText: string | null;
  previousValueJson: unknown;
  previousMasterValueId: string | null;
  currentValueText: string | null;
  currentValueJson: unknown;
  currentMasterValueId: string | null;
  isRatingParameter?: boolean;
  premiumImpact?: number | string | null;
  premiumImpactType?: string | null;
}

/** Response from GET /endorsements/:id/difference */
export interface EndorsementDifferenceResponse {
  cewDifferance?: Array<{
    category: string;
    key: string;
    label: string;
    previous: unknown;
    current: unknown;
    changeType: string;
    premiumImpact?: string | number | null;
  }>;
  endorsementId: string;
  policyId: string;
  currentVersionNumber: number;
  comparedWith: {
    type: string;
    endorsementId?: string;
    versionNumber?: number;
    formResponseId?: string;
  };
  comparedValues: {
    previous: Record<string, { fieldId: string; fieldName: string; valueText: string; valueJson: unknown; masterValueId: string | null }>;
    current: Record<string, { fieldId: string; fieldName: string; valueText: string; valueJson: unknown; masterValueId: string | null }>;
  };
  differences: EndorsementDifferenceItem[];
  totalDifferences: number;
}

export async function getEndorsementDifference(
  endorsementId: string
): Promise<EndorsementDifferenceResponse> {
  return apiGet<EndorsementDifferenceResponse>(
    `/endorsements/${encodeURIComponent(endorsementId)}/difference`
  );
}

import type {
  ChatHistoryResponse,
  SendQueryRequest,
  SendQueryResponse,
  RespondToChatRequest,
} from '@/features/quotes/api/quotes';

export const getEndorsementChatHistory = async (
  endorsementId: string,
  includeAttachments?: string,
): Promise<ChatHistoryResponse> => {
  const params = new URLSearchParams();
  params.set('includeAttachments', includeAttachments ? 'true' : 'false');
  return apiGet<ChatHistoryResponse>(`/endorsements/${endorsementId}/chat/messages?${params.toString()}`);
};

export const sendEndorsementQuery = async (
  endorsementId: string,
  payload: SendQueryRequest,
): Promise<SendQueryResponse> => {
  if (payload.files && payload.files.length > 0) {
    const formData = new FormData();
    if (payload.queryCategory) {
      formData.append('queryCategory', payload.queryCategory);
    }
    formData.append('message', payload.message || 'Shared file(s)');
    formData.append('dueDate', payload.dueDate);
    payload.files.forEach((file) => formData.append('files', file));
    return apiPost<SendQueryResponse>(`/endorsements/${endorsementId}/chat/query`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }
  const { files, ...rest } = payload;
  return apiPost<SendQueryResponse>(`/endorsements/${endorsementId}/chat/query`, rest);
};

export const respondToEndorsementChat = async (
  endorsementId: string,
  payload: RespondToChatRequest,
): Promise<unknown> => {
  const formData = new FormData();
  formData.append('message', payload.message);
  formData.append('parentMessageId', payload.parentMessageId);
  if (payload.files) {
    payload.files.forEach((file) => formData.append('files', file));
  }

  return apiPost(`/endorsements/${endorsementId}/chat/respond`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
