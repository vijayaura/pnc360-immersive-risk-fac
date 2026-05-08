import { apiGet, apiPost, apiPatch, apiPut, apiDelete } from '@/lib/api/client';

// Save Base Rates (Pricing → Base Rates by Sub Project Type)
export type PricingTypeEnum = 'FIXED_AMOUNT' | 'PERCENTAGE';
export type QuoteOptionEnum = 'AUTO_QUOTE' | 'NO_QUOTE' | 'QUOTE_AND_REFER';

export interface BaseRateSubProjectRequest {
  name: string;
  pricing_type: PricingTypeEnum;
  base_rate: number;
  currency: string;
  quote_option: QuoteOptionEnum;
}

export interface SaveBaseRatesRequestItem {
  project_type: string;
  sub_projects: BaseRateSubProjectRequest[];
}

export interface SaveBaseRatesRequest {
  base_rates: SaveBaseRatesRequestItem[];
}

export interface SaveBaseRatesResponse {
  message?: string;
}

export async function saveBaseRates(
  insurerId: number | string,
  productId: number | string,
  body: SaveBaseRatesRequest,
): Promise<SaveBaseRatesResponse> {
  return apiPost<SaveBaseRatesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/base-rates`,
    body,
  );
}

export async function updateBaseRates(
  insurerId: number | string,
  productId: number | string,
  body: SaveBaseRatesRequest,
): Promise<SaveBaseRatesResponse> {
  return apiPatch<SaveBaseRatesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/base-rates`,
    body,
  );
}

// Get Base Rates
export interface GetBaseRatesItemSubProject {
  name: string;
  currency: 'AED' | '%';
  base_rate: number;
  pricing_type: PricingTypeEnum;
  quote_option: QuoteOptionEnum;
}

export interface GetBaseRatesItem {
  project_type: string;
  sub_projects: GetBaseRatesItemSubProject[];
}

export type GetBaseRatesResponse = GetBaseRatesItem[];

export async function getBaseRates(
  insurerId: number | string,
  productId: number | string,
): Promise<GetBaseRatesResponse> {
  return apiGet<GetBaseRatesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/base-rates`,
  );
}

// Minimum Premiums - Same structure as Base Rates but with minimum_premiums endpoint
export interface SaveMinimumPremiumsRequestItem {
  project_type: string;
  sub_projects: BaseRateSubProjectRequest[];
}

export interface SaveMinimumPremiumsRequest {
  minimum_premium_rates: SaveMinimumPremiumsRequestItem[];
}

export interface SaveMinimumPremiumsResponse {
  message?: string;
}

export async function saveMinimumPremiums(
  insurerId: number | string,
  productId: number | string,
  body: SaveMinimumPremiumsRequest,
): Promise<SaveMinimumPremiumsResponse> {
  return apiPost<SaveMinimumPremiumsResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/minimum-premium-rates`,
    body,
  );
}

export async function updateMinimumPremiums(
  insurerId: number | string,
  productId: number | string,
  body: SaveMinimumPremiumsRequest,
): Promise<SaveMinimumPremiumsResponse> {
  return apiPatch<SaveMinimumPremiumsResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/minimum-premium-rates`,
    body,
  );
}

// Get Minimum Premiums
export interface GetMinimumPremiumsItemSubProject {
  name: string;
  currency: 'AED' | '%';
  base_rate: number;
  pricing_type: PricingTypeEnum;
  quote_option: QuoteOptionEnum;
}

export interface GetMinimumPremiumsItem {
  project_type: string;
  sub_projects: GetMinimumPremiumsItemSubProject[];
}

export type GetMinimumPremiumsResponse = GetMinimumPremiumsItem[];

export async function getMinimumPremiums(
  insurerId: number | string,
  productId: number | string,
): Promise<GetMinimumPremiumsResponse> {
  try {
    console.log(
      `[getMinimumPremiums] Making API call for insurer ${insurerId}, product ${productId}`,
    );
    const result = await apiGet<any>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
        String(productId),
      )}/minimum-premium-rates`,
    );
    console.log('[getMinimumPremiums] API call successful:', result);

    // The API returns an object with minimum_premium_rates property
    if (result && result.minimum_premium_rates && Array.isArray(result.minimum_premium_rates)) {
      console.log(
        '[getMinimumPremiums] Returning minimum_premium_rates array:',
        result.minimum_premium_rates,
      );
      return result.minimum_premium_rates;
    }

    console.log('[getMinimumPremiums] No minimum_premium_rates found, returning empty array');
    return [];
  } catch (error: any) {
    console.log('[getMinimumPremiums] API call failed:', error);
    // Handle 204 (No Content) as success - return empty array
    if (error?.status === 204) {
      console.log('[getMinimumPremiums] API returned 204 (No Content) - returning empty array');
      return [];
    }
    // Re-throw other errors
    throw error;
  }
}

// Construction Types Config
export type ConstructionPricingEnum = 'PERCENTAGE' | 'FIXED_RATE';

export interface ConstructionTypeItemRequest {
  name: string;
  pricing_type: ConstructionPricingEnum;
  value: number;
  quote_option: QuoteOptionEnum;
  display_order: number;
  is_active: boolean;
}

export interface SaveConstructionTypesRequest {
  construction_types_config: {
    items: ConstructionTypeItemRequest[];
  };
}

export interface SaveConstructionTypesResponse {
  message?: string;
}

export interface GetConstructionTypesResponse {
  items: Array<{
    name: string;
    value: number;
    is_active: boolean;
    pricing_type: ConstructionPricingEnum;
    quote_option: QuoteOptionEnum;
    display_order: number;
  }>;
}

export async function getConstructionTypes(
  insurerId: number | string,
  productId: number | string,
): Promise<GetConstructionTypesResponse> {
  const ts = Date.now();
  return apiGet<GetConstructionTypesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/construction-types?t=${ts}`,
  );
}

export async function saveConstructionTypes(
  insurerId: number | string,
  productId: number | string,
  body: SaveConstructionTypesRequest,
): Promise<SaveConstructionTypesResponse> {
  return apiPost<SaveConstructionTypesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/construction-types`,
    body,
  );
}

export async function updateConstructionTypes(
  insurerId: number | string,
  productId: number | string,
  body: SaveConstructionTypesRequest,
): Promise<SaveConstructionTypesResponse> {
  return apiPatch<SaveConstructionTypesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/construction-types`,
    body,
  );
}

// Countries Pricing Config
export type CountryPricingEnum = 'PERCENTAGE' | 'FIXED_RATE';

export interface SaveCountriesItemRequest {
  country?: string;
  name?: string; // backend may accept name as well
  pricing_type: CountryPricingEnum;
  value: number;
  quote_option: QuoteOptionEnum;
}

export interface SaveCountriesRequest {
  countries_config: {
    items: SaveCountriesItemRequest[];
  };
}

export interface SaveCountriesResponse {
  message?: string;
}

export interface GetCountriesResponse {
  items: Array<{
    country?: string;
    name?: string;
    pricing_type: CountryPricingEnum;
    value: number;
    quote_option: QuoteOptionEnum;
  }>;
}

export async function getCountriesPricing(
  insurerId: number | string,
  productId: number | string,
): Promise<GetCountriesResponse> {
  const ts = Date.now();
  return apiGet<GetCountriesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/countries?t=${ts}`,
  );
}

export async function saveCountriesPricing(
  insurerId: number | string,
  productId: number | string,
  body: SaveCountriesRequest,
): Promise<SaveCountriesResponse> {
  return apiPost<SaveCountriesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/countries`,
    body,
  );
}

export async function updateCountriesPricing(
  insurerId: number | string,
  productId: number | string,
  body: SaveCountriesRequest,
): Promise<SaveCountriesResponse> {
  return apiPatch<SaveCountriesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/countries`,
    body,
  );
}

// Regions Pricing Config
export type RegionPricingEnum = 'PERCENTAGE' | 'FIXED_RATE';

export interface SaveRegionsItemRequest {
  name: string;
  pricing_type: RegionPricingEnum;
  value: number;
  quote_option: QuoteOptionEnum;
  display_order: number;
  is_active: boolean;
}

export interface SaveRegionsRequest {
  regions_config: {
    items: SaveRegionsItemRequest[];
  };
}

export interface SaveRegionsResponse {
  message?: string;
}

export interface GetRegionsResponse {
  items: Array<{
    name: string;
    value: number;
    is_active: boolean;
    pricing_type: RegionPricingEnum;
    quote_option: QuoteOptionEnum;
    display_order: number;
  }>;
}

export async function getRegionsPricing(
  insurerId: number | string,
  productId: number | string,
): Promise<GetRegionsResponse> {
  const ts = Date.now();
  return apiGet<GetRegionsResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/regions?t=${ts}`,
  );
}

export async function saveRegionsPricing(
  insurerId: number | string,
  productId: number | string,
  body: SaveRegionsRequest,
): Promise<SaveRegionsResponse> {
  return apiPost<SaveRegionsResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/regions`,
    body,
  );
}

export async function updateRegionsPricing(
  insurerId: number | string,
  productId: number | string,
  body: SaveRegionsRequest,
): Promise<SaveRegionsResponse> {
  return apiPatch<SaveRegionsResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/regions`,
    body,
  );
}

// Zones Pricing Config
export type ZonePricingEnum = 'PERCENTAGE' | 'FIXED_RATE';

export interface SaveZonesItemRequest {
  name: string;
  pricing_type: ZonePricingEnum;
  value: number;
  quote_option: QuoteOptionEnum;
  display_order: number;
  is_active: boolean;
}

export interface SaveZonesRequest {
  zones_config: {
    items: SaveZonesItemRequest[];
  };
}

export interface SaveZonesResponse {
  message?: string;
}

export interface GetZonesResponse {
  items: Array<{
    name: string;
    value: number;
    is_active: boolean;
    pricing_type: ZonePricingEnum;
    quote_option: QuoteOptionEnum;
    display_order: number;
  }>;
}

export async function getZonesPricing(
  insurerId: number | string,
  productId: number | string,
): Promise<GetZonesResponse> {
  const ts = Date.now();
  return apiGet<GetZonesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/zones?t=${ts}`,
  );
}

export async function saveZonesPricing(
  insurerId: number | string,
  productId: number | string,
  body: SaveZonesRequest,
): Promise<SaveZonesResponse> {
  return apiPost<SaveZonesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/zones`,
    body,
  );
}

export async function updateZonesPricing(
  insurerId: number | string,
  productId: number | string,
  body: SaveZonesRequest,
): Promise<SaveZonesResponse> {
  return apiPatch<SaveZonesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/zones`,
    body,
  );
}

// Contract Types Config
export type ContractPricingEnum = 'PERCENTAGE' | 'FIXED_RATE';

export interface SaveContractTypesItemRequest {
  name: string;
  pricing_type: ContractPricingEnum;
  value: number;
  quote_option: QuoteOptionEnum;
  display_order: number;
  is_active: boolean;
}

export interface SaveContractTypesRequest {
  contract_types_config: {
    items: SaveContractTypesItemRequest[];
  };
}

export interface SaveContractTypesResponse {
  message?: string;
}

export interface GetContractTypesResponse {
  items: Array<{
    name: string;
    value: number;
    is_active: boolean;
    pricing_type: ContractPricingEnum;
    quote_option: QuoteOptionEnum;
    display_order: number;
  }>;
}

export async function getContractTypes(
  insurerId: number | string,
  productId: number | string,
): Promise<GetContractTypesResponse> {
  const ts = Date.now();
  return apiGet<GetContractTypesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/contract-types?t=${ts}`,
  );
}

export async function saveContractTypes(
  insurerId: number | string,
  productId: number | string,
  body: SaveContractTypesRequest,
): Promise<SaveContractTypesResponse> {
  return apiPost<SaveContractTypesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/contract-types`,
    body,
  );
}

export async function updateContractTypes(
  insurerId: number | string,
  productId: number | string,
  body: SaveContractTypesRequest,
): Promise<SaveContractTypesResponse> {
  return apiPatch<SaveContractTypesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/contract-types`,
    body,
  );
}

// Role Types Config
export type RolePricingEnum = 'PERCENTAGE' | 'FIXED_RATE';

export interface SaveRoleTypesItemRequest {
  name: string;
  pricing_type: RolePricingEnum;
  value: number;
  quote_option: QuoteOptionEnum;
  display_order: number;
  is_active: boolean;
}

export interface SaveRoleTypesRequest {
  role_types_config: {
    items: SaveRoleTypesItemRequest[];
  };
}

export interface SaveRoleTypesResponse {
  message?: string;
}

export interface GetRoleTypesResponse {
  items: Array<{
    name: string;
    value: number;
    is_active: boolean;
    pricing_type: RolePricingEnum;
    quote_option: QuoteOptionEnum;
    display_order: number;
  }>;
}

export async function getRoleTypes(
  insurerId: number | string,
  productId: number | string,
): Promise<GetRoleTypesResponse> {
  return apiGet<GetRoleTypesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/role-types`,
  );
}

export async function saveRoleTypes(
  insurerId: number | string,
  productId: number | string,
  body: SaveRoleTypesRequest,
): Promise<SaveRoleTypesResponse> {
  return apiPost<SaveRoleTypesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/role-types`,
    body,
  );
}

export async function updateRoleTypes(
  insurerId: number | string,
  productId: number | string,
  body: SaveRoleTypesRequest,
): Promise<SaveRoleTypesResponse> {
  return apiPatch<SaveRoleTypesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/role-types`,
    body,
  );
}

// Soil Types Config
export type SoilPricingEnum = 'PERCENTAGE' | 'FIXED_RATE';

export interface SaveSoilTypesItemRequest {
  name: string;
  pricing_type: SoilPricingEnum;
  value: number;
  quote_option: QuoteOptionEnum;
  display_order: number;
  is_active: boolean;
}

export interface SaveSoilTypesRequest {
  soil_types_config: {
    items: SaveSoilTypesItemRequest[];
  };
}

export interface SaveSoilTypesResponse {
  message?: string;
}

export interface GetSoilTypesResponse {
  items: Array<{
    name: string;
    value: number;
    is_active: boolean;
    pricing_type: SoilPricingEnum;
    quote_option: QuoteOptionEnum;
    display_order: number;
  }>;
}

export async function getSoilTypes(
  insurerId: number | string,
  productId: number | string,
): Promise<GetSoilTypesResponse> {
  const ts = Date.now();
  return apiGet<GetSoilTypesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/soil-types?t=${ts}`,
  );
}

export async function saveSoilTypes(
  insurerId: number | string,
  productId: number | string,
  body: SaveSoilTypesRequest,
): Promise<SaveSoilTypesResponse> {
  return apiPost<SaveSoilTypesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/soil-types`,
    body,
  );
}

export async function updateSoilTypes(
  insurerId: number | string,
  productId: number | string,
  body: SaveSoilTypesRequest,
): Promise<SaveSoilTypesResponse> {
  return apiPatch<SaveSoilTypesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/soil-types`,
    body,
  );
}

// Subcontractor Types Config
export type SubcontractorPricingEnum = 'PERCENTAGE' | 'FIXED_RATE';

export interface SaveSubcontractorTypesItemRequest {
  name: string;
  pricing_type: SubcontractorPricingEnum;
  value: number;
  quote_option: QuoteOptionEnum;
  display_order: number;
  is_active: boolean;
}

export interface SaveSubcontractorTypesRequest {
  subcontractor_types_config: {
    items: SaveSubcontractorTypesItemRequest[];
  };
}

export interface SaveSubcontractorTypesResponse {
  message?: string;
}

export interface GetSubcontractorTypesResponse {
  items: Array<{
    name: string;
    value: number;
    is_active: boolean;
    pricing_type: SubcontractorPricingEnum;
    quote_option: QuoteOptionEnum;
    display_order: number;
  }>;
}

export async function getSubcontractorTypes(
  insurerId: number | string,
  productId: number | string,
): Promise<GetSubcontractorTypesResponse> {
  const ts = Date.now();
  return apiGet<GetSubcontractorTypesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/subcontractor-types?t=${ts}`,
  );
}

export async function saveSubcontractorTypes(
  insurerId: number | string,
  productId: number | string,
  body: SaveSubcontractorTypesRequest,
): Promise<SaveSubcontractorTypesResponse> {
  return apiPost<SaveSubcontractorTypesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/subcontractor-types`,
    body,
  );
}

export async function updateSubcontractorTypes(
  insurerId: number | string,
  productId: number | string,
  body: SaveSubcontractorTypesRequest,
): Promise<SaveSubcontractorTypesResponse> {
  return apiPatch<SaveSubcontractorTypesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/subcontractor-types`,
    body,
  );
}

// Consultant Roles Config
export type ConsultantPricingEnum = 'PERCENTAGE' | 'FIXED_RATE';

export interface SaveConsultantRolesItemRequest {
  name: string;
  pricing_type: ConsultantPricingEnum;
  value: number;
  quote_option: QuoteOptionEnum;
  display_order: number;
  is_active: boolean;
}

export interface SaveConsultantRolesRequest {
  consultant_roles_config: {
    items: SaveConsultantRolesItemRequest[];
  };
}

export interface SaveConsultantRolesResponse {
  message?: string;
}

export interface GetConsultantRolesResponse {
  items: Array<{
    name: string;
    value: number;
    is_active: boolean;
    pricing_type: ConsultantPricingEnum;
    quote_option: QuoteOptionEnum;
    display_order: number;
  }>;
}

export async function getConsultantRoles(
  insurerId: number | string,
  productId: number | string,
): Promise<GetConsultantRolesResponse> {
  const ts = Date.now();
  return apiGet<GetConsultantRolesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/consultant-roles?t=${ts}`,
  );
}

export async function saveConsultantRoles(
  insurerId: number | string,
  productId: number | string,
  body: SaveConsultantRolesRequest,
): Promise<SaveConsultantRolesResponse> {
  return apiPost<SaveConsultantRolesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/consultant-roles`,
    body,
  );
}

export async function updateConsultantRoles(
  insurerId: number | string,
  productId: number | string,
  body: SaveConsultantRolesRequest,
): Promise<SaveConsultantRolesResponse> {
  return apiPatch<SaveConsultantRolesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/consultant-roles`,
    body,
  );
}

// Security Types Config
export type SecurityPricingEnum = 'PERCENTAGE' | 'FIXED_RATE';

export interface SaveSecurityTypesItemRequest {
  name: string;
  pricing_type: SecurityPricingEnum;
  value: number;
  quote_option: QuoteOptionEnum;
  display_order: number;
  is_active: boolean;
}

export interface SaveSecurityTypesRequest {
  security_types_config: {
    items: SaveSecurityTypesItemRequest[];
  };
}

export interface SaveSecurityTypesResponse {
  message?: string;
}

export interface GetSecurityTypesResponse {
  items: Array<{
    name: string;
    value: number;
    is_active: boolean;
    pricing_type: SecurityPricingEnum;
    quote_option: QuoteOptionEnum;
    display_order: number;
  }>;
}

export async function getSecurityTypesConfiguration(
  insurerId: number | string,
  productId: number | string,
): Promise<GetSecurityTypesResponse> {
  const ts = Date.now();
  return apiGet<GetSecurityTypesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/security-types?t=${ts}`,
  );
}

export async function createSecurityTypesConfiguration(
  insurerId: number | string,
  productId: number | string,
  body: SaveSecurityTypesRequest,
): Promise<SaveSecurityTypesResponse> {
  return apiPost<SaveSecurityTypesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/security-types`,
    body,
  );
}

export async function updateSecurityTypesConfiguration(
  insurerId: number | string,
  productId: number | string,
  body: SaveSecurityTypesRequest,
): Promise<SaveSecurityTypesResponse> {
  return apiPatch<SaveSecurityTypesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/security-types`,
    body,
  );
}

// Area Types Config
export type AreaPricingEnum = 'PERCENTAGE' | 'FIXED_RATE';

export interface SaveAreaTypesItemRequest {
  name: string;
  pricing_type: AreaPricingEnum;
  value: number;
  quote_option: QuoteOptionEnum;
  display_order: number;
  is_active: boolean;
}

export interface SaveAreaTypesRequest {
  area_types_config: {
    items: SaveAreaTypesItemRequest[];
  };
}

export interface SaveAreaTypesResponse {
  message?: string;
}

export interface GetAreaTypesResponse {
  items: Array<{
    name: string;
    value: number;
    is_active: boolean;
    pricing_type: AreaPricingEnum;
    quote_option: QuoteOptionEnum;
    display_order: number;
  }>;
}

export async function getAreaTypesConfiguration(
  insurerId: number | string,
  productId: number | string,
): Promise<GetAreaTypesResponse> {
  const ts = Date.now();
  return apiGet<GetAreaTypesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/area-types?t=${ts}`,
  );
}

export async function createAreaTypesConfiguration(
  insurerId: number | string,
  productId: number | string,
  body: SaveAreaTypesRequest,
): Promise<SaveAreaTypesResponse> {
  return apiPost<SaveAreaTypesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/area-types`,
    body,
  );
}

export async function updateAreaTypesConfiguration(
  insurerId: number | string,
  productId: number | string,
  body: SaveAreaTypesRequest,
): Promise<SaveAreaTypesResponse> {
  return apiPatch<SaveAreaTypesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/area-types`,
    body,
  );
}

// Policy Wordings