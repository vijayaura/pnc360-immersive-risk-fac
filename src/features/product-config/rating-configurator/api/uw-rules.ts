import { apiGet, apiPost, apiPatch, apiDelete, api } from '@/lib/api/client';

export interface UWRuleCondition {
  id?: string;
  parameterId: string;
  operator:
    | "equals"
    | "notEquals"
    | "greaterThan"
    | "lessThan"
    | "greaterThanOrEqual"
    | "lessThanOrEqual"
    | "contains"
    | "in";
  value: string | number | string[];
  sequenceNo: number;
  logicalOp: "AND" | "OR";
}

export interface UWRulePayload {
  name: string;
  description?: string;
  priority: number;
  isActive: boolean;
  adjustmentType: 'PERCENTAGE' | 'FACTOR' | 'FIXED';
  adjustmentValue: number;
  quoteAction: 'quote' | 'no_quote' | 'referral';
  conditions: UWRuleCondition[];
}

export interface UWRule extends UWRulePayload {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface UWRulesParams {
  search?: string;
  page?: number;
  limit?: number;
}

export interface UWRulesMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UWRulesResponse {
  data: UWRule[];
  meta: UWRulesMeta;
}

export interface UWRulesExportResponse {
  data: UWRule[];
  exportedAt: string;
  productId: string;
  totalRules: number;
}

export interface UWRulesImportRequest {
  rules: UWRulePayload[];
  overwriteExisting?: boolean;
}

export interface UWRulesImportResponse {
  imported: number;
  updated: number;
  skipped: number;
  errors: Array<{
    rule: string;
    error: string;
  }>;
}

export const getUWRules = async (productId: string, params?: UWRulesParams) => {
  const query: Record<string, string> = {};
  if (params?.search) query.search = params.search;
  if (params?.page) query.page = String(params.page);
  if (params?.limit) query.limit = String(params.limit);
  return apiGet<UWRulesResponse | UWRule[]>(
    `/uw-rules/${productId}`,
    Object.keys(query).length ? { params: query } : undefined,
  );
};

export const createUWRule = async (productId: string, data: UWRulePayload) => {
  return apiPost<UWRule>(`/uw-rules/${productId}`, data);
};

export const updateUWRule = async (ruleId: string, data: Partial<UWRulePayload>) => {
  return apiPatch<UWRule>(`/uw-rules/${ruleId}`, data);
};

export const deleteUWRule = async (ruleId: string) => {
  return apiDelete<void>(`/uw-rules/${ruleId}`);
};

export const exportUWRules = async (productId: string) => {
  return apiGet<UWRulesExportResponse>(`/uw-rules/${productId}/export`);
};

export const exportUWRulesAsExcel = async (productId: string) => {
  // Use the existing API instance to get the proper base URL and headers
  const response = await api.get(`/uw-rules/${productId}/export`, {
    headers: {
      'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
    responseType: 'blob',
  });
  
  return response.data;
};

export const importUWRules = async (productId: string, data: UWRulesImportRequest) => {
  return apiPost<UWRulesImportResponse>(`/uw-rules/${productId}/import`, data);
};

export const importUWRulesFromExcel = async (productId: string, file: File, overwriteExisting: boolean = false) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('overwriteExisting', String(overwriteExisting));
  
  const response = await api.post(`/uw-rules/${productId}/import`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data as UWRulesImportResponse;
};
