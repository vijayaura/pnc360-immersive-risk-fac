import { apiGet, apiPost, apiPatch, apiPut, apiDelete } from '@/lib/api/client';
import type { PricingTypeEnum, QuoteOptionEnum, BaseRateSubProjectRequest } from './insurer-pricing';

// Insurer Dashboard
export interface DashboardQuoteRequest {
  id: number;
  quote_id: string;
  broker_id: number;
  insurer_id: number | null;
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
}

export interface GetInsurerDashboardResponse {
  totalQuotes: number;
  totalPolicies: number;
  totalValue: number;
  quoteRequests: DashboardQuoteRequest[];
}

export async function getInsurerDashboard(): Promise<GetInsurerDashboardResponse> {
  return apiGet<GetInsurerDashboardResponse>(`/insurer/dashboard/quotes`);
}

export interface GetBrokerQuotesListParams {
  brokerId: string | number;
  page?: number;
  limit?: number;
}

// Interface matching the actual API response for broker quote list items
export interface BrokerQuoteListItem {
  id: string;
  brokerId: string;
  brokerName: string;
  productId: string;
  productName: string;
  quoteNumber: string;
  totalPremium: number;
  status: string;
  code?: string;
  submittedAt: string | null;
}

export interface BrokerQuotesListMeta {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

export interface GetBrokerQuotesListResponse {
  items: BrokerQuoteListItem[];
  meta: BrokerQuotesListMeta;
}

export async function getBrokerQuotesList({
  brokerId,
  page = 1,
  limit = 10,
}: GetBrokerQuotesListParams): Promise<GetBrokerQuotesListResponse> {
  return apiGet<GetBrokerQuotesListResponse>(
    `/quote/insurer/list?page=${page}&limit=${limit}&brokerId=${encodeURIComponent(String(brokerId))}`,
  );
}

// CEWs (TPL limits and Extensions)
export interface TplLimitsDTO {
  id: number;
  product_id: number;
  default_limit: string;
  currency: string;
  created_at: string;
  updated_at: string;
  insurer_id: number;
}

export interface TplExtensionDTO {
  id: number;
  product_id: number;
  title: string;
  description: string | null;
  limit_value: string;
  pricing_type: 'PERCENTAGE' | 'FIXED_RATE' | '' | string;
  pricing_value: string;
  currency: string;
  is_active: number;
  created_at: string;
  updated_at: string;
  insurer_id: number;
}

export interface GetTplResponse {
  limits: TplLimitsDTO;
  extensions: TplExtensionDTO[];
}

export async function getTplLimitsAndExtensions(
  insurerId: number | string,
  productId: number | string,
): Promise<GetTplResponse> {
  const ts = Date.now();
  return apiGet<GetTplResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/tpl?t=${ts}`,
  );
}

export interface UpdateTplExtensionItemRequest {
  id?: number; // include when updating existing extension rows
  title: string;
  description?: string | null;
  limit_value: number;
  pricing_type: 'percentage' | 'fixed';
  pricing_value: number;
  currency?: string;
}

export interface UpdateTplRequest {
  product_id: number | string;
  default_limit: number;
  currency: string;
  extensions: UpdateTplExtensionItemRequest[];
}

export type UpdateTplResponse = GetTplResponse;

export async function updateTplLimitsAndExtensions(
  insurerId: number | string,
  productId: number | string,
  body: UpdateTplRequest,
): Promise<UpdateTplResponse> {
  return apiPatch<UpdateTplResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/tpl`,
    body,
  );
}

// CEW Configuration APIs (New)
export interface TplExtensionDto {
  title: string;
  description: string;
  tplLimitValue: number;
  pricingType: 'Percentage' | 'Fixed' | 'Flat';
  loadingDiscount: number;
  displayOrder?: number;
  isActive?: boolean;
}

export interface TplConfigDto {
  defaultTplLimit: number;
  currency?: string;
  extensions: TplExtensionDto[];
}

export interface TplExtensionResponseDto {
  id: string;
  title: string;
  description: string;
  tplLimitValue: number;
  pricingType: 'Percentage' | 'Fixed' | 'Flat';
  loadingDiscount: number;
  displayOrder: number;
  isActive: boolean;
}

export interface TplConfigResponseDto {
  id: string;
  defaultTplLimit: number;
  currency: string;
  extensions: TplExtensionResponseDto[];
  version: number;
}

export interface CewConfigurationResponseDto {
  tplConfig: TplConfigResponseDto;
  clauses: any[];
  productId: string;
  organizationId: string;
}

export async function saveTplConfiguration(
  productId: string,
  body: TplConfigDto,
): Promise<CewConfigurationResponseDto> {
  return apiPost<CewConfigurationResponseDto>(
    `/cew-configuration/product/${encodeURIComponent(productId)}/tpl-config`,
    body,
  );
}

export async function getCewConfiguration(productId: string): Promise<CewConfigurationResponseDto> {
  return apiGet<CewConfigurationResponseDto>(
    `/cew-configuration/product/${encodeURIComponent(productId)}`,
  );
}

// Create TPL limits & extensions (first-time save)
export interface CreateTplExtensionItemRequest {
  title: string;
  description?: string | null;
  limit_value: number;
  pricing_type: 'percentage' | 'fixed';
  pricing_value: number;
  currency: string;
}

export interface CreateTplRequest {
  extensions: CreateTplExtensionItemRequest[];
}

export interface CreateTplResponse {
  message?: string;
}

export async function createTplLimitsAndExtensions(
  insurerId: number | string,
  productId: number | string,
  body: CreateTplRequest,
): Promise<CreateTplResponse> {
  return apiPost<CreateTplResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/tpl`,
    body,
  );
}
