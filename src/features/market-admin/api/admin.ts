import { apiGet, apiRequest } from '@/lib/api/client';

export interface AdminDashboardQuoteItem {
  id: string;
  quote_id: string;
  sum_insured?: string | number;
  base_premium: string | number;
  total_premium: string | number;
  status: string;
  validity_date: string;
  created_at: string;
  updated_at: string;
  project_name: string;
  client_name: string;
  project_type: string;
  broker_name: string;
  inusrer_name: string; // keeping as provided by backend
  product_id?: string;
  product_code?: string;
  product_name?: string;
  currency?: string;
  quote_number?: string;
}

export interface AdminDashboardQuotesResponse {
  totalQuotes: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  recentQuotes: AdminDashboardQuoteItem[];
}

export async function getAdminDashboardQuotes(param: any): Promise<AdminDashboardQuotesResponse> {
  type MarketDashboardQuoteApiItem = {
    id: string;
    requestId?: string | null;
    broker?: string | null;
    insurer?: string | null;
    sumInsured?: number | null;
    basePremium?: number | null;
    totalPremium?: number | null;
    currency?: string | null;
    productId?: string | null;
    productName?: string | null;
    status?: string | null;
    validityEnd?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    quoteNumber?: string | null;
    policyCreated?: boolean | null;
  };

  type MarketDashboardQuotesApiResponse = {
    data?: MarketDashboardQuoteApiItem[];
    meta?: {
      total?: number;
      page?: number;
      limit?: number;
      totalPages?: number;
    };
  };

  const queryParams = new URLSearchParams();
  Object.entries(param).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      const stringValue = Array.isArray(value) ? value.join(',') : String(value);
      queryParams.append(key, stringValue);
    }
  });
  const query = queryParams.toString();

  const resp = await apiGet<MarketDashboardQuotesApiResponse>(`/quote/market-dashboard?${query}`);
  const items = Array.isArray(resp?.data) ? resp.data : [];

  return {
    totalQuotes: Number(resp?.meta?.total ?? items.length),
    totalPages: Number(resp?.meta?.totalPages ?? 1),
    currentPage: Number(resp?.meta?.page ?? param.page ?? 1),
    limit: Number(resp?.meta?.limit ?? param.limit ?? items.length),
    recentQuotes: items.map(
      (q): AdminDashboardQuoteItem => ({
        id: q.id,
        quote_id: String(q.requestId || q.id),
        client_name: '-',
        project_name: String(q.productName || '-'),
        project_type: '-',
        broker_name: String(q.broker || '-'),
        inusrer_name: String(q.insurer || '-'),
        product_name: q.productName || undefined,
        product_id: q.productId || undefined,
        currency: q.currency || undefined,
        status: String(q.status || ''),
        sum_insured: q.sumInsured ?? '',
        total_premium: q.totalPremium ?? '',
        base_premium: q.basePremium ?? '',
        validity_date: String(q.validityEnd || ''),
        created_at: String(q.createdAt || ''),
        updated_at: String(q.updatedAt || ''),
        quote_number: q.quoteNumber,
      }),
    ),
  };
}

export async function exportAdminDashboardQuotes(param: any): Promise<Blob> {
  const queryParams = new URLSearchParams();
  Object.entries(param).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      const stringValue = Array.isArray(value) ? value.join(',') : String(value);
      queryParams.append(key, stringValue);
    }
  });
  const query = queryParams.toString();

  return apiRequest<Blob>(`/quote/export/market-dashboard?${query}`, {
    method: 'GET',
    responseType: 'blob',
    skipCacheBust: true,
  } as any);
}

export interface AdminDashboardStatisticsResponse {
  data: {
    totalQuotes: number;
    totalPolicies: number;
    totalValue: number;
    totalValueCurrency: string;
    /** Sum insured total when returned by API; omitted if backend does not support it yet. */
    totalSumInsured?: number;
    totalSumInsuredCurrency?: string;
    charts: {
      activityOverview: {
        day: Array<{
          period: string;
          quotes: number;
          policies: number;
        }>;
        month: Array<{
          period: string;
          quotes: number;
          policies: number;
        }>;
      };
      gwpPerformance: {
        day: Array<{
          period: string;
          gwp: number;
          commission: number;
        }>;
        month: Array<{
          period: string;
          gwp: number;
          commission: number;
        }>;
      };
    };
  };
  timestamp: string;
}

export interface ActivityData {
  period: string;
  quotes: number;
  policies: number;
}

export interface GWPData {
  period: string;
  gwp: number;
  commission: number;
}

export async function getAdminDashboardStatistics(
  param: any = {},
): Promise<AdminDashboardStatisticsResponse> {
  const queryParams = new URLSearchParams();
  Object.entries(param).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      const stringValue = Array.isArray(value) ? value.join(',') : String(value);
      queryParams.append(key, stringValue);
    }
  });
  const query = queryParams.toString();
  return apiGet<AdminDashboardStatisticsResponse>(
    `/dashboard/market-statistics${query ? `?${query}` : ''}`,
  );
}

// ---------- ADMIN DASHBOARD REFERRALS ----------

export interface AdminDashboardReferralItem {
  id: string;
  referralId: string;
  quoteId: string;
  broker: string;
  insurer: string;
  productName: string;
  currency: string;
  status: string;
  priority?: string | null;
  reason: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminDashboardReferralsResponse {
  data: AdminDashboardReferralItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

type AdminDashboardReferralsApiItem = {
  id?: string;
  referralId?: string;
  quoteId?: string;
  broker?: string;
  insurer?: string;
  productName?: string;
  currency?: string;
  status?: string;
  priority?: string | null;
  reason?: string;
  createdAt?: string;
  updatedAt?: string;
};

type AdminDashboardReferralsApiResponse = {
  data?: AdminDashboardReferralsApiItem[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
};

export async function getAdminDashboardReferrals(
  param: any,
): Promise<AdminDashboardReferralsResponse> {
  const queryParams = new URLSearchParams();
  Object.entries(param).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      const stringValue = Array.isArray(value) ? value.join(',') : String(value);
      queryParams.append(key, stringValue);
    }
  });
  const query = queryParams.toString();
  const resp = await apiGet<AdminDashboardReferralsApiResponse>(
    `/referrals/market-dashboard?${query}`,
  );
  const items = Array.isArray(resp?.data) ? resp.data : [];

  return {
    data: items.map(
      (r): AdminDashboardReferralItem => ({
        id: String(r.id ?? ''),
        referralId: String(r.referralId ?? ''),
        quoteId: String(r.quoteId ?? ''),
        broker: String(r.broker ?? ''),
        insurer: String(r.insurer ?? ''),
        productName: String(r.productName ?? ''),
        currency: String(r.currency ?? ''),
        status: String(r.status ?? ''),
        priority: r.priority ?? null,
        reason: String(r.reason ?? ''),
        createdAt: String(r.createdAt ?? ''),
        updatedAt: String(r.updatedAt ?? ''),
      }),
    ),
    meta: {
      total: Number(resp?.meta?.total ?? items.length),
      page: Number(resp?.meta?.page ?? 1),
      limit: Number((resp?.meta?.limit ?? items.length) || 10),
      totalPages: Number(resp?.meta?.totalPages ?? 1),
    },
  };
}

export interface BrokerDashboardQuoteItem {
  id: number;
  quote_id: string;
  broker_id: number;
  insurer_id: number;
  project_id: number;
  base_premium: string;
  total_premium: string;
  status: string;
  validity_date: string;
  created_at: string;
  updated_at: string;
  project_name: string;
  client_name: string;
  broker_name: string;
  required_documents: Array<{
    url: string;
    label: string;
  }>;
  insurer_offers: Array<any>;
  req_doc_for_policy_issue?: Array<any>;
}

// export interface BrokerDashboardQuotesResponse {
//   totalQuotes: number;
//   totalPolicies: number;
//   totalValue: string;
//   recentQuotes?: any[];
//   totalPremiumValue: string | boolean;
//   quoteRequests: BrokerDashboardQuoteItem[];
// }

export interface BrokerDashboardQuoteItemResponse {
  id: string;
  templateId: string;
  templateVersionId: string;
  productId: string;
  proposalId: string;
  productName: string;
  submittedById: string;
  submittingOrgId: string | null;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | string; // extend if needed
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  validityDate?: string | null;
  recentQuotes?: any[];
  totalQuotes?: number;
  totalPremiumValue?: string | boolean;
  totalPremium?: number | string;
  sumInsured?: string | boolean;
  premium?: string | boolean;
  validUntil?: string | boolean;
}
export type BrokerDashboardQuotesResponse = {
  items: BrokerDashboardQuoteItemResponse[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
};

export async function getBrokerDashboardProposals(query?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  createdAt?: string;
  productId?: string;
  type?: string;
}): Promise<BrokerDashboardQuotesResponse> {
  const params: Record<string, any> = {};
  if (query?.page) params.page = query.page;
  if (query?.limit) params.limit = query.limit;
  if (query?.search) params.search = query.search;
  if (query?.status) params.status = query.status;
  if (query?.createdAt) params.createdAt = query.createdAt;
  if (query?.productId) params.productId = query.productId;
  if (query?.type) params.type = query.type;
  return apiGet<BrokerDashboardQuotesResponse>('quote/all', {
    params,
    skipCacheBust: true,
  } as any);
}

// Broker Dashboard Policies
export interface BrokerDashboardPolicyItem {
  id: number;
  policy_id: string | null;
  quote_id: number;
  broker_id: number;
  insurer_id: number;
  start_date: string;
  end_date: string;
  base_premium: string;
  total_premium: string;
  status: string;
  project_name: string;
  client_name: string;
}

export interface BrokerDashboardPoliciesResponse {
  totalQuotes: number;
  totalActiveQuotes: number;
  totalPolicies: number;
  totalActivePolicies: number;
  totalPremiumValue: string;
  totalCommission: string;
  issuedPolicies: BrokerDashboardPolicyItem[];
}

// ---------- ADMIN DASHBOARD POLICIES ----------

export interface AdminDashboardPolicyItem {
  id: string;
  policyNumber: string;
  projectName: string | null;
  sumInsured: number | null;
  premium: number | null;
  productName: string;
  insurerName: string;
  currency: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface AdminDashboardPoliciesResponse {
  data: AdminDashboardPolicyItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

type AdminDashboardPoliciesApiItem = {
  id?: string;
  policyNumber?: string;
  projectName?: string | null;
  sumInsured?: number | null;
  premium?: number | null;
  productName?: string | null;
  insurerName?: string | null;
  currency?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  createdAt?: string | null;
};

type AdminDashboardPoliciesApiResponse = {
  data?: AdminDashboardPoliciesApiItem[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
};

// ---------- ROLE ----------
export interface Role {
  id: string;
  name: string;
}

// ---------- PERMISSION ----------
export interface Permission {
  id: string;
  name: string;
  category: string;
  description: string;
}

// ---------- MATRIX PERMISSION BOOLEAN MAP ----------
export type PermissionMatrix = {
  [permissionId: string]: boolean;
};

// ---------- ROLE → MATRIX MAP ----------
export type RolePermissionMatrix = {
  [roleId: string]: PermissionMatrix;
};

// ---------- MAIN STRUCTURE ----------
export interface AccessControlEntry {
  id: string;
  roles: Role[];
  permissions: Permission[];
  matrix: RolePermissionMatrix;
  createdAt: string;
  updatedAt: string;
}

// ---------- FULL RESPONSE TYPE (ARRAY) ----------
export type AccessControlResponse = AccessControlEntry[];

// Market Admin Product APIs
export interface MarketAdminProductItem {
  id: string;
  name: string;
  category: string;
  currency: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
}

export interface MarketAdminProductResponse {
  items?: MarketAdminProductItem[];
  data?: MarketAdminProductItem[];
  result?: MarketAdminProductItem[];
  meta?: {
    totalItems?: number;
    itemCount?: number;
    itemsPerPage?: number;
    totalPages?: number;
    currentPage?: number;
  };
}

export type MarketAdminProductResponsePayload =
  | MarketAdminProductResponse
  | MarketAdminProductItem[];

export async function getMarketAdminMenuItems(): Promise<AccessControlResponse> {
  return apiGet<AccessControlResponse>('/auth-matrix/tenant/data');
}

export async function getBrokerDashboardPolicies(): Promise<BrokerDashboardPoliciesResponse> {
  return apiGet<BrokerDashboardPoliciesResponse>('/broker/dashboard/policies');
}

// Admin Dashboard APIs

export async function getAdminDashboardPolicies(
  param: any,
): Promise<AdminDashboardPoliciesResponse> {
  const queryParams = new URLSearchParams();
  Object.entries(param).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      const stringValue = Array.isArray(value) ? value.join(',') : String(value);
      queryParams.append(key, stringValue);
    }
  });
  const query = queryParams.toString();
  const resp = await apiGet<AdminDashboardPoliciesApiResponse>(
    `/policies/market-dashboard?${query}`,
  );
  const items = Array.isArray(resp?.data) ? resp.data : [];

  return {
    data: items.map(
      (p): AdminDashboardPolicyItem => ({
        id: String(p.id ?? ''),
        policyNumber: String(p.policyNumber ?? ''),
        projectName: p.projectName ?? null,
        sumInsured: p.sumInsured ?? null,
        premium: p.premium ?? null,
        productName: String(p.productName ?? ''),
        insurerName: String(p.insurerName ?? ''),
        currency: String(p.currency ?? ''),
        startDate: String(p.startDate ?? ''),
        endDate: String(p.endDate ?? ''),
        createdAt: String(p.createdAt ?? ''),
      }),
    ),
    meta: {
      total: Number(resp?.meta?.total ?? items.length),
      page: Number(resp?.meta?.page ?? 1),
      limit: Number((resp?.meta?.limit ?? items.length) || 10),
      totalPages: Number(resp?.meta?.totalPages ?? 1),
    },
  };
}

export async function exportAdminDashboardPolicies(param: any): Promise<Blob> {
  const queryParams = new URLSearchParams();
  Object.entries(param).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      const stringValue = Array.isArray(value) ? value.join(',') : String(value);
      queryParams.append(key, stringValue);
    }
  });
  const query = queryParams.toString();

  return apiRequest<Blob>(`/policies/export/market-dashboard?${query}`, {
    method: 'GET',
    responseType: 'blob',
    skipCacheBust: true,
  } as any);
}

export async function exportAdminDashboardReferrals(param: any): Promise<Blob> {
  const queryParams = new URLSearchParams();
  Object.entries(param).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      const stringValue = Array.isArray(value) ? value.join(',') : String(value);
      queryParams.append(key, stringValue);
    }
  });
  const query = queryParams.toString();

  return apiRequest<Blob>(`/referrals/export/market-dashboard?${query}`, {
    method: 'GET',
    responseType: 'blob',
    skipCacheBust: true,
  } as any);
}

// Insurer Dashboard APIs
export async function getInsurerDashboardQuotes(): Promise<BrokerDashboardQuotesResponse> {
  return apiGet<BrokerDashboardQuotesResponse>('/insurer/dashboard/quotes');
}

export async function getInsurerDashboardPolicies(): Promise<BrokerDashboardPoliciesResponse> {
  return apiGet<BrokerDashboardPoliciesResponse>('/insurer/dashboard/policies');
}

// Market admin product APIs
export async function getAdminDashboardProducts(): Promise<MarketAdminProductResponsePayload> {
  return apiGet<MarketAdminProductResponsePayload>('/product/list');
}

// Generic dashboard statistics for current role (insurer/broker/admin)
export interface DashboardStatistics {
  data?: {
    totalQuotes?: number;
    totalPolicies?: number;
    totalValue?: number;
    totalValueCurrency?: string;
    totalSumInsured?: number;
    totalSumInsuredCurrency?: string;
    totalUnreadCount?: number;
    unreadEndorsementMessageCount?: number;
    unreadReferralMessageCount?: number;
    [key: string]: unknown;
  };
  timestamp?: string;
  [key: string]: unknown;
}

export interface DashboardStatisticsQuery {
  productId?: string | string[];
}

export async function getDashboardStatistics(
  params?: DashboardStatisticsQuery,
): Promise<DashboardStatistics> {
  const queryParams = new URLSearchParams();

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      const stringValue = Array.isArray(value) ? value.join(',') : String(value);
      queryParams.append(key, stringValue);
    }
  });

  const query = queryParams.toString();
  return apiGet<DashboardStatistics>(`/dashboard/statistics${query ? `?${query}` : ''}`);
}
