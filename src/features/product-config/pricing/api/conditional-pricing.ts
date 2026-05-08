import { api } from '@/lib/api/client';;

export interface ConditionalPricingRuleCondition {
  id?: string;
  parameterId: string;
  operator: string;
  value: any;
  sequenceNo?: number;
  logicalOp?: string;
}

export interface ConditionalPricingRuleAction {
  targetParameterId: string;
  adjustmentType: 'PERCENTAGE' | 'FACTOR' | 'FIXED';
  adjustmentValue: number;
  quoteAction: 'quote' | 'no_quote' | 'referral';
}

export interface ConditionalPricingRule {
  id: string;
  name: string;
  description?: string;
  conditions: ConditionalPricingRuleCondition[];
  actions: ConditionalPricingRuleAction[];
  priority: number;
  isActive: boolean;
  productId: string;
}

export interface CreateConditionalPricingRulePayload {
  name: string;
  description?: string;
  conditions: ConditionalPricingRuleCondition[];
  actions: ConditionalPricingRuleAction[];
  priority?: number;
  isActive?: boolean;
}

export interface UpdateConditionalPricingRulePayload extends Partial<CreateConditionalPricingRulePayload> {}

export const getConditionalPricingRules = async (productId: string) => {
  const response = await api.get<ConditionalPricingRule[]>(`/conditional-pricing/${productId}`);
  return response.data;
};

export const createConditionalPricingRule = async (
  productId: string,
  payload: CreateConditionalPricingRulePayload,
) => {
  const response = await api.post<ConditionalPricingRule>(
    `/conditional-pricing/${productId}`,
    payload,
  );
  return response.data;
};

export const updateConditionalPricingRule = async (
  id: string,
  payload: UpdateConditionalPricingRulePayload,
) => {
  const response = await api.patch<ConditionalPricingRule>(`/conditional-pricing/${id}`, payload);
  return response.data;
};

export const deleteConditionalPricingRule = async (id: string) => {
  const response = await api.delete<{ success: true }>(`/conditional-pricing/${id}`);
  return response.data;
};
