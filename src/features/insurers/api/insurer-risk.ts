import { apiGet, apiPost, apiPatch, apiPut, apiDelete } from '@/lib/api/client';
import type { PricingTypeEnum, QuoteOptionEnum, BaseRateSubProjectRequest } from './insurer-pricing';

export type RiskPricingEnum = 'PERCENTAGE' | 'FIXED_AMOUNT';
export type RiskQuoteOptionEnum = 'AUTO_QUOTE' | 'NO_QUOTE' | 'QUOTE_AND_REFER';

export interface ProjectRiskDurationItem {
  from_months: number;
  to_months: number | null;
  pricing_type: RiskPricingEnum;
  loading_discount: number;
  quote_option: RiskQuoteOptionEnum;
}

export interface ProjectRiskLocationFactorRow {
  factor: string;
  low_risk: string;
  moderate_risk: string;
  high_risk: string;
  very_high_risk: string;
}

export interface ProjectRiskHazardRateItem {
  risk_level: string; // e.g., "Low Risk"
  pricing_type: RiskPricingEnum;
  loading_discount: number;
  quote_option: RiskQuoteOptionEnum;
}

export interface ProjectRiskFactorsRequest {
  project_risk_factors: {
    project_duration_loadings: ProjectRiskDurationItem[];
    maintenance_period_loadings: ProjectRiskDurationItem[];
    location_hazard_loadings: {
      risk_definition: { factors: ProjectRiskLocationFactorRow[] };
      location_hazard_rates: ProjectRiskHazardRateItem[];
    };
  };
}

export interface ProjectRiskFactorsUpdateRequest {
  insurer_id: string | number;
  project_risk_factors: {
    project_duration_loadings: ProjectRiskDurationItem[];
    maintenance_period_loadings: ProjectRiskDurationItem[];
    location_hazard_loadings: {
      risk_definition: { factors: ProjectRiskLocationFactorRow[] };
      location_hazard_rates: ProjectRiskHazardRateItem[];
    };
  };
}

export interface ProjectRiskFactorsResponse {
  message?: string;
  data?: any;
}

export async function getProjectRiskFactors(
  insurerId: number | string,
  productId: number | string,
): Promise<ProjectRiskFactorsResponse> {
  return apiGet<ProjectRiskFactorsResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/project-risk-factors`,
    {
      // Avoid 304/empty body from intermediate caches
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
      params: { _ts: Date.now() },
    },
  );
}

export async function createProjectRiskFactors(
  insurerId: number | string,
  productId: number | string,
  body: ProjectRiskFactorsRequest,
): Promise<ProjectRiskFactorsResponse> {
  return apiPost<ProjectRiskFactorsResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/project-risk-factors`,
    body,
  );
}

export async function updateProjectRiskFactors(
  insurerId: number | string,
  productId: number | string,
  body: ProjectRiskFactorsUpdateRequest,
): Promise<ProjectRiskFactorsResponse> {
  return apiPatch<ProjectRiskFactorsResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/project-risk-factors`,
    body,
  );
}

// Contractor Risk Factors
export interface ContractorRiskFactorsResponse {
  message?: string;
  data?: any;
}

export async function getContractorRiskFactors(
  insurerId: number | string,
  productId: number | string,
): Promise<ContractorRiskFactorsResponse> {
  return apiGet<ContractorRiskFactorsResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/contractor-risk-factors`,
    {
      headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
      params: { _ts: Date.now() },
    },
  );
}

// Contractor Risk Factors save interfaces
export interface ContractorRiskFactorsRequest {
  insurer_id?: number;
  contractor_risk_factors: {
    experience_loadings: Array<{
      from_years: number;
      to_years: number;
      pricing_type: string;
      loading_discount: number;
      quote_option: string;
    }>;
    claims_based_loadings: Array<{
      from_claims: number;
      to_claims: number;
      pricing_type: string;
      loading_discount: number;
      quote_option: string;
    }>;
    claim_amount_categories?: Array<{
      from_amount: number;
      to_amount: number;
      pricing_type: string;
      loading_discount: number;
      currency: string;
      quote_option: string;
    }>;
    contractor_number_based?: Array<{
      from_contractors: number;
      to_contractors: number;
      pricing_type: string;
      loading_discount: number;
      quote_option: string;
    }>;
    subcontractor_number_based?: Array<{
      from_subcontractors: number;
      to_subcontractors: number;
      pricing_type: string;
      loading_discount: number;
      quote_option: string;
    }>;
  };
}

export async function createContractorRiskFactors(
  insurerId: number | string,
  productId: number | string,
  body: ContractorRiskFactorsRequest,
): Promise<ContractorRiskFactorsResponse> {
  return apiPost<ContractorRiskFactorsResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/contractor-risk-factors`,
    body,
  );
}

export async function updateContractorRiskFactors(
  insurerId: number | string,
  productId: number | string,
  body: ContractorRiskFactorsRequest,
): Promise<ContractorRiskFactorsResponse> {
  return apiPatch<ContractorRiskFactorsResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/contractor-risk-factors`,
    body,
  );
}

// Coverage Options & Extensions API
export interface CoverageOptionLoading {
  currency: string;
  to_amount: number;
  from_amount: number;
  pricing_type: 'PERCENTAGE' | 'AMOUNT';
  quote_option: 'AUTO_QUOTE' | 'MANUAL_QUOTE';
  loading_discount: number;
}

export interface CrossLiabilityCover {
  cover_option: string;
  pricing_type: 'PERCENTAGE' | 'AMOUNT';
  quote_option: 'AUTO_QUOTE' | 'MANUAL_QUOTE';
  loading_discount: number;
}

export interface CoverageOptionsResponse {
  sum_insured_loadings: CoverageOptionLoading[];
  cross_liability_cover: CrossLiabilityCover[];
  project_value_loadings: CoverageOptionLoading[];
  contract_works_loadings: CoverageOptionLoading[];
  plant_equipment_loadings: CoverageOptionLoading[];
  temporay_work?: CoverageOptionLoading[];
  other_materials?: CoverageOptionLoading[];
  Principal_Existing_Surrounding_Property?: CoverageOptionLoading[];
}

export async function getCoverageOptions(
  insurerId: number | string,
  productId: number | string,
): Promise<CoverageOptionsResponse> {
  return apiGet<CoverageOptionsResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/coverage-options`,
  );
}

// POST Coverage Options interfaces
export interface SaveCoverageOptionsRequest {
  coverage_options: {
    sum_insured_loadings: CoverageOptionLoading[];
    project_value_loadings: CoverageOptionLoading[];
    contract_works_loadings: CoverageOptionLoading[];
    plant_equipment_loadings: CoverageOptionLoading[];
    temporay_work?: CoverageOptionLoading[];
    other_materials?: CoverageOptionLoading[];
    Principal_Existing_Surrounding_Property?: CoverageOptionLoading[];
    cross_liability_cover: CrossLiabilityCover[];
  };
}

export interface SaveCoverageOptionsResponse {
  message: string;
  coverage_options: {
    sum_insured_loadings: CoverageOptionLoading[];
    project_value_loadings: CoverageOptionLoading[];
    contract_works_loadings: CoverageOptionLoading[];
    plant_equipment_loadings: CoverageOptionLoading[];
    cross_liability_cover: CrossLiabilityCover[];
  };
}

export async function saveCoverageOptions(
  insurerId: number | string,
  productId: number | string,
  data: SaveCoverageOptionsRequest,
): Promise<SaveCoverageOptionsResponse> {
  return apiPost<SaveCoverageOptionsResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/coverage-options`,
    data,
  );
}

// PATCH Coverage Options interfaces
export interface UpdateCoverageOptionsRequest {
  insurer_id: number;
  coverage_options: {
    sum_insured_loadings: Omit<CoverageOptionLoading, 'currency'>[];
    project_value_loadings: Omit<CoverageOptionLoading, 'currency'>[];
    contract_works_loadings?: Omit<CoverageOptionLoading, 'currency'>[];
    plant_equipment_loadings?: Omit<CoverageOptionLoading, 'currency'>[];
    temporay_work?: Omit<CoverageOptionLoading, 'currency'>[];
    other_materials?: Omit<CoverageOptionLoading, 'currency'>[];
    Principal_Existing_Surrounding_Property?: Omit<CoverageOptionLoading, 'currency'>[];
    cross_liability_cover?: CrossLiabilityCover[];
  };
}

export interface UpdateCoverageOptionsResponse {
  message: string;
  data: {
    sum_insured_loadings: CoverageOptionLoading[];
    project_value_loadings: CoverageOptionLoading[];
    contract_works_loadings?: CoverageOptionLoading[];
    plant_equipment_loadings?: CoverageOptionLoading[];
    temporay_work?: CoverageOptionLoading[];
    other_materials?: CoverageOptionLoading[];
    Principal_Existing_Surrounding_Property?: CoverageOptionLoading[];
    cross_liability_cover?: CrossLiabilityCover[];
  };
}

export async function updateCoverageOptions(
  insurerId: number | string,
  productId: number | string,
  data: UpdateCoverageOptionsRequest,
): Promise<UpdateCoverageOptionsResponse> {
  return apiPatch<UpdateCoverageOptionsResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/coverage-options`,
    data,
  );
}

// Policy Limits & Deductibles interfaces
export interface SubLimit {
  title: string;
  value: number;
  description: string;
  pricing_type: 'PERCENTAGE_OF_SUM_INSURED' | 'FIXED_AMOUNT' | 'PERCENTAGE_OF_LOSS';
}

export interface Deductible {
  type: 'FIXED_AMOUNT' | 'PERCENTAGE_OF_LOSS' | 'PERCENTAGE_OF_SUM_INSURED';
  value: number;
  quote_option: 'AUTO_QUOTE' | 'MANUAL_QUOTE';
  loading_discount: number;
}

export interface PolicyLimit {
  value: number;
  pricing_type: 'FIXED_AMOUNT' | 'PERCENTAGE';
}

export interface PolicyLimitsResponse {
  sub_limits: SubLimit[];
  deductibles: Deductible[];
  policy_limits: {
    maximum_cover: PolicyLimit;
    minimum_premium: PolicyLimit;
    base_broker_commission: PolicyLimit;
    maximum_broker_commission: PolicyLimit;
    minimum_broker_commission: PolicyLimit;
  };
}

export async function getPolicyLimits(
  insurerId: number | string,
  productId: number | string,
): Promise<PolicyLimitsResponse> {
  return apiGet<PolicyLimitsResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/policy-limits`,
  );
}

// POST Policy Limits interfaces
export interface SavePolicyLimitItem {
  pricing_type: 'FIXED_AMOUNT' | 'PERCENTAGE';
  value: number;
}

export interface SaveSubLimit {
  title: string;
  description: string;
  pricing_type: 'PERCENTAGE_OF_SUM_INSURED' | 'FIXED_AMOUNT' | 'PERCENTAGE_OF_LOSS';
  value: number;
}

export interface SaveDeductible {
  type: 'FIXED_AMOUNT' | 'PERCENTAGE_OF_LOSS' | 'PERCENTAGE_OF_SUM_INSURED';
  value: number;
  loading_discount: number;
  quote_option: 'AUTO_QUOTE' | 'MANUAL_QUOTE';
}

export interface SavePolicyLimitsRequest {
  policy_limits_and_deductible: {
    policy_limits: {
      minimum_premium: SavePolicyLimitItem;
      maximum_cover: SavePolicyLimitItem;
      base_broker_commission: SavePolicyLimitItem;
      minimum_broker_commission: SavePolicyLimitItem;
      maximum_broker_commission: SavePolicyLimitItem;
    };
    sub_limits: SaveSubLimit[];
    deductibles: SaveDeductible[];
  };
}

export interface SavePolicyLimitsResponse {
  message: string;
  policy_limits_and_deductible: {
    policy_limits: {
      minimum_premium: SavePolicyLimitItem;
      maximum_cover: SavePolicyLimitItem;
      base_broker_commission: SavePolicyLimitItem;
      minimum_broker_commission: SavePolicyLimitItem;
      maximum_broker_commission: SavePolicyLimitItem;
    };
    sub_limits: SaveSubLimit[];
    deductibles: SaveDeductible[];
  };
}

export async function savePolicyLimits(
  insurerId: number | string,
  productId: number | string,
  data: SavePolicyLimitsRequest,
): Promise<SavePolicyLimitsResponse> {
  return apiPost<SavePolicyLimitsResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/policy-limits`,
    data,
  );
}

// PATCH Policy Limits interfaces
export interface UpdatePolicyLimitItem {
  pricing_type: 'FIXED_AMOUNT' | 'PERCENTAGE';
  value: number;
}

export interface UpdateSubLimit {
  title: string;
  description: string;
  pricing_type: 'PERCENTAGE_OF_SUM_INSURED' | 'FIXED_AMOUNT' | 'PERCENTAGE_OF_LOSS';
  value: number;
}

export interface UpdateDeductible {
  type: 'FIXED_AMOUNT' | 'PERCENTAGE_OF_LOSS' | 'PERCENTAGE_OF_SUM_INSURED';
  value: number;
  loading_discount: number;
  quote_option: 'AUTO_QUOTE' | 'MANUAL_QUOTE';
}

export interface UpdatePolicyLimitsRequest {
  policy_limits_and_deductible: {
    policy_limits: {
      minimum_premium: UpdatePolicyLimitItem;
      maximum_cover: UpdatePolicyLimitItem;
      base_broker_commission: UpdatePolicyLimitItem;
      minimum_broker_commission: UpdatePolicyLimitItem;
      maximum_broker_commission: UpdatePolicyLimitItem;
    };
    sub_limits: UpdateSubLimit[];
    deductibles: UpdateDeductible[];
  };
}

export interface UpdatePolicyLimitsResponse {
  message: string;
  data: {
    policy_limits: {
      minimum_premium: UpdatePolicyLimitItem;
      maximum_cover: UpdatePolicyLimitItem;
      base_broker_commission: UpdatePolicyLimitItem;
      minimum_broker_commission: UpdatePolicyLimitItem;
      maximum_broker_commission: UpdatePolicyLimitItem;
    };
    sub_limits: UpdateSubLimit[];
    deductibles: UpdateDeductible[];
  };
}

export async function updatePolicyLimits(
  insurerId: number | string,
  productId: number | string,
  data: UpdatePolicyLimitsRequest,
): Promise<UpdatePolicyLimitsResponse> {
  return apiPatch<UpdatePolicyLimitsResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/policy-limits`,
    data,
  );
}

// ===== QUOTE COVERAGE API FUNCTIONS =====
