import { apiGet, apiPost, apiRequest } from '@/lib/api/client';

export interface PolicyItem {
  id: string;
  policy_id: string | null;
  /** Display policy number (e.g. POL00013). When present, prefer over policy_id for display. */
  policyNumber?: string | null;
  quote_id?: string | number;
  broker_id?: string | number;
  brokerName?: string | null;
  insurer_id?: string | number;
  insurerName?: string | null;
  start_date?: string;
  end_date?: string;
  base_premium?: string | number;
  total_premium?: string | number;
  status?: string;
  project_name?: string | null;
  client_name?: string | null;
}

export interface PoliciesListResponse {
  data: PolicyItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PolicyDetailResponse extends PolicyItem {
  details?: Record<string, any>;
}

export async function listPolicies(query?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  productId?: string;
  brokerId?: string;
  insurerId?: string;
  startDate?: string;
  endDate?: string;
  filterCancelledPolicies?: boolean;
}): Promise<PoliciesListResponse> {
  const params = new URLSearchParams();
  if (query) {
    if (query.page) params.append('page', query.page.toString());
    if (query.limit) params.append('limit', query.limit.toString());
    if (query.search) params.append('search', query.search);
    if (query.status) params.append('status', query.status);
    if (query.productId) params.append('productId', query.productId);
    if (query.brokerId) params.append('brokerId', query.brokerId);
    if (query.insurerId) params.append('insurerId', query.insurerId);
    if (query.startDate) params.append('startDate', query.startDate);
    if (query.endDate) params.append('endDate', query.endDate);
    if (typeof query.filterCancelledPolicies === 'boolean') {
      params.append('filterCancelledPolicies', String(query.filterCancelledPolicies));
    }
  }
  return apiGet<PoliciesListResponse>(`/policies?${params.toString()}`);
}

export async function getPolicyById(id: string | number): Promise<PolicyDetailResponse> {
  return apiGet<PolicyDetailResponse>(`/policies/${encodeURIComponent(String(id))}`);
}

export async function checkPolicyExistsForQuote(
  quoteId: string | number,
): Promise<{ policy: PolicyItem | null }> {
  return apiGet<{ policy: PolicyItem | null }>(
    `/policies/check/${encodeURIComponent(String(quoteId))}`,
  );
}

export async function checkAcceptanceExistsForQuote(quoteId: string | number): Promise<string> {
  return apiGet<string>(`/quote/${encodeURIComponent(String(quoteId))}/check-acceptance`);
}

export interface IssuePolicyRequest {
  acceptanceId: string;
}

export interface IssuePolicyResponse {
  policyId: string;
  id: string;
  policyNumber: string;
  status: string;
}

export async function issuePolicy(data: IssuePolicyRequest): Promise<IssuePolicyResponse> {
  return apiPost<IssuePolicyResponse>('/policies/issue', data);
}

export async function exportBrokerPolicies(param: any): Promise<Blob> {
  const queryParams = new URLSearchParams();
  Object.entries(param).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      const stringValue = Array.isArray(value) ? value.join(',') : String(value);
      queryParams.append(key, stringValue);
    }
  });
  const query = queryParams.toString();

  return apiRequest<Blob>(`/policies/export?${query}`, {
    method: 'GET',
    responseType: 'blob',
    skipCacheBust: true,
  } as any);
}
