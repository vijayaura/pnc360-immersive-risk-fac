import { apiGet, apiPost, apiPatch, apiPut, apiDelete } from '@/lib/api/client';
import type { PricingTypeEnum, QuoteOptionEnum, BaseRateSubProjectRequest } from './insurer-pricing';

// CEWs Clauses
export interface ClauseDTO {
  id: number;
  product_id: number;
  clause_code: string;
  title: string;
  purpose_description: string;
  clause_wording: string;
  clause_type: string; // EXCLUSION | WARRANTY | CLAUSE | etc.
  show_type: string; // OPTIONAL | MANDATORY, etc.
  pricing_type: string;
  pricing_value: string;
  display_order: number;
  is_active: number;
  created_at: string;
  updated_at: string;
  insurer_id: number | null;
}

export interface GetClausesResponse {
  clauses: ClauseDTO[];
}

export async function getCewsClauses(
  insurerId: number | string,
  productId: number | string,
): Promise<GetClausesResponse> {
  const ts = Date.now();
  return apiGet<GetClausesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/clauses?t=${ts}`,
  );
}

export interface CreateClauseParams {
  product_id: number | string;
  clause_code: string;
  title: string;
  purpose_description?: string;
  clause_wording?: string;
  clause_type: string; // "clause" | "exclusion" | "warranty"
  show_type: string; // "optional" | "mandatory"
  pricing_type: string; // e.g. "discount" | "loading"
  pricing_value: number;
}

export type CreateClauseResponse = ClauseDTO;

export async function createCewsClause(
  insurerId: number | string,
  productId: number | string,
  body: CreateClauseParams,
): Promise<CreateClauseResponse> {
  return apiPost<CreateClauseResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/clauses`,
    body,
  );
}

export interface UpdateClauseParams {
  title?: string;
  purpose_description?: string;
  clause_wording?: string;
  clause_type?: string; // EXCLUSION | WARRANTY | CLAUSE (case as expected by backend)
  show_type?: string; // OPTIONAL | MANDATORY
  pricing_type?: string; // Fixed | Percentage | discount/loading depending on backend
  pricing_value?: number | string;
  display_order?: number;
  is_active?: boolean | number;
}

export type UpdateClauseResponse = ClauseDTO;

export async function updateCewsClause(
  insurerId: number | string,
  productId: number | string,
  clauseProductId: number | string,
  body: UpdateClauseParams,
): Promise<UpdateClauseResponse> {
  return apiPatch<UpdateClauseResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/clauses/${encodeURIComponent(String(clauseProductId))}`,
    body,
  );
}

// Clause Pricing Configuration - Updated to match API response
export interface ClausePricingOptionResponse {
  type: 'PERCENTAGE' | 'CURRENCY';
  label: string;
  limit: string;
  value: number;
  currency: string;
  display_order: number;
}

export interface ClausePricingItemResponse {
  id: number;
  product_id: number;
  clause_code: string;
  is_enabled: number; // 0 or 1
  is_mandatory: number; // 0 or 1
  base_type: 'PERCENTAGE' | 'CURRENCY';
  base_value: string;
  base_currency: string;
  options: ClausePricingOptionResponse[];
  created_at: string;
  updated_at: string;
  insurer_id: number;
}

// Request interfaces for saving
export interface ClausePricingOption {
  label: string;
  limit: string;
  type: '%' | 'AED';
  value: number;
  currency?: string;
}

export interface ClausePricingBase {
  type: '%' | 'AED';
  value: number;
  currency?: string;
}

export interface ClausePricingItem {
  clause_code: string;
  is_enabled: boolean;
  is_mandatory?: boolean;
  base: ClausePricingBase;
  options: ClausePricingOption[];
}

export interface SaveClausePricingRequest {
  clauses: ClausePricingClauseRequest[];
}

export interface ClausePricingClauseRequest {
  clause_code: string;
  title: string;
  clause_type: 'CLAUSE' | 'WARRANTY' | 'EXCLUSION';
  show_type: 'MANDATORY' | 'OPTIONAL';
  display_order: number;
  is_active: boolean;
  pricing: {
    is_enabled: boolean;
    pricing_type: 'PERCENTAGE' | 'CURRENCY';
    pricing_value: number;
    base_currency: string;
    options: {
      label: string;
      limit: string;
      type: 'PERCENTAGE' | 'CURRENCY';
      value: number;
      display_order: number;
    }[];
  };
}

export interface GetClausePricingResponse {
  clause_pricing: ClausePricingItem[];
}

// Get clause pricing (separate from metadata)
export interface GetClausePricingDataResponse {
  clauses: ClausePricingClauseResponse[];
}

export interface ClausePricingClauseResponse {
  clause_code: string;
  pricing: {
    is_enabled: boolean;
    pricing_type: 'PERCENTAGE' | 'CURRENCY';
    pricing_value: number;
    base_currency: string;
    options: {
      type: 'PERCENTAGE' | 'CURRENCY';
      label: string;
      limit: string;
      value: number;
      currency: string;
      display_order: number;
    }[];
  };
  created_at: string;
  updated_at: string;
}

export async function getClausePricing(
  insurerId: number | string,
  productId: number | string,
): Promise<GetClausePricingDataResponse> {
  const ts = Date.now();
  return apiGet<GetClausePricingDataResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/pricing_clauses?t=${ts}`,
  );
}

// Keep the old interface for backward compatibility
export interface GetClausePricingResponse {
  clause_pricing: ClausePricingItem[];
}

export interface SaveClausePricingResponse {
  message: string;
  clauses: ClausePricingClauseResponse[];
}

export async function saveClausePricing(
  insurerId: number | string,
  productId: number | string,
  body: SaveClausePricingRequest,
): Promise<SaveClausePricingResponse> {
  return apiPost<SaveClausePricingResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/pricing_clauses`,
    body,
  );
}

export interface UpdateClausePricingRequest {
  clause_code?: number;
  items: ClausePricingItem[];
}

export interface UpdateClausePricingResponse {
  message: string;
  data: {
    clause_pricing: ClausePricingItem[];
  };
}

export async function updateClausePricing(
  insurerId: number | string,
  productId: number | string,
  body: UpdateClausePricingRequest,
): Promise<UpdateClausePricingResponse> {
  return apiPatch<UpdateClausePricingResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/pricing_clauses`,
    body,
  );
}

// Project Risk Factors