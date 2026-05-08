import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api/client';

export interface CEWRuleCondition {
  id?: string;
  ruleId?: string;
  parameterId: string;
  operator:
    | 'equals'
    | 'notEquals'
    | 'greaterThan'
    | 'lessThan'
    | 'greaterThanOrEqual'
    | 'lessThanOrEqual'
    | 'contains'
    | 'in';
  value: string;
  sequenceNo: number;
  logicalOp: 'AND' | 'OR';
}

/** Payload for POST (create) - conditions without id, selectedCews required */
export interface CreateCEWRulePayload {
  isActive: boolean;
  conditions: Omit<CEWRuleCondition, 'id' | 'ruleId'>[];
  selectedCews: string[];
}

/** Payload for PATCH (update) - conditions may include id for existing */
export interface UpdateCEWRulePayload {
  isActive?: boolean;
  conditions?: CEWRuleCondition[];
  selectedCews?: string[];
}

export interface CEWRule {
  id: string;
  isActive: boolean;
  productId: string;
  organizationId: string;
  selectedCews: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  createdById: string;
  updatedById: string | null;
  conditions: CEWRuleCondition[];
}

export const getCEWRules = async (productId: string) => {
  return apiGet<CEWRule[]>(`/product-cew-rules/${productId}`);
};

export const createCEWRule = async (productId: string, data: CreateCEWRulePayload) => {
  return apiPost<CEWRule>(`/product-cew-rules/${productId}`, data);
};

export const updateCEWRule = async (ruleId: string, data: UpdateCEWRulePayload) => {
  return apiPatch<CEWRule>(`/product-cew-rules/${ruleId}`, data);
};

export const deleteCEWRule = async (ruleId: string) => {
  return apiDelete<void>(`/product-cew-rules/${ruleId}`);
};
