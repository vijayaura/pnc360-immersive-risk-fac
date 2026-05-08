import { api, apiGet, apiPost } from '@/lib/api/client';
import { apiDelete, apiPatch } from '@/lib/api/client';
import type { AxiosResponseHeaders, RawAxiosResponseHeaders } from 'axios';

export interface RatingParameterDto {
  id: string;
  definitionId?: string;
  sectionId: string;
  parentFieldId?: string | null;
  productId: string;
  name: string;
  label: string;
  type: string;
  placeholder?: string | null;
  required?: boolean;
  isRatingParameter?: boolean;
  metadata?: Record<string, unknown> | null;
  validations?: Array<{ type: string; value?: unknown }> | null;
  masterId?: string | null;
  combinationRows?: unknown;
  combinationRowLabels?: unknown;
  fieldOrder?: number;
  options?: string[];
  isMasterData?: boolean;
  masterDataTable?: string;
  ratingParameterId?: string;
  isActive?: boolean;
  parameterType?: string;
  deletedAt?: string | null;
  isDefinitionOnly?: boolean;
  activeCategories?: Array<{
    category: 'BASE' | 'FACTOR' | 'PREMIUM_LIMIT';
    ratingParameterId?: string;
    derivedType?: string;
    derivedSubfieldId?: string;
  }>;
}

export async function getRatingParameters(productId: string): Promise<RatingParameterDto[]> {
  return apiGet<RatingParameterDto[]>(`/rating-configuration/parameters/${productId}`);
}

export interface RatingParameterItem {
  formFieldId: string;
  formFieldId2?: string;
  name?: string;
  combinationParameterIds?: string[];
  derivedType?: string;
  derivedSubfieldId?: string;
  label?: string;
  valueType?: string;
  ratingParameterId?: string;
  definitionId?: string;
  fieldName?: string;
  fieldLabel?: string;
}

export interface RatingParametersConfigPayload {
  base: RatingParameterItem[];
  factor: RatingParameterItem[];
  premiumLimit: RatingParameterItem[];
}

export async function updateRatingParametersConfig(
  productId: string,
  payload: RatingParametersConfigPayload,
): Promise<{ success: boolean }> {
  return apiPost<{ success: boolean }>(`/rating-configuration/parameters/${productId}`, payload);
}

export async function saveRatingSelections(
  productId: string,
  payload: {
    base: string[];
    factor: string[];
    premiumLimit: string[];
  },
): Promise<{
  ratingConfigId: string;
  counts: {
    base: number;
    factor: number;
    premiumLimit: number;
  };
}> {
  return apiPost(`/rating-configuration/selections/${productId}`, payload);
}

export async function getRatingSelections(productId: string): Promise<{
  ratingConfigId: string | null;
  base: string[];
  factor: string[];
  premiumLimit: string[];
}> {
  return apiGet(`/rating-configuration/selections/${productId}`);
}

export interface RuleFieldOption {
  value: string;
  label: string;
  sortOrder: number;
  masterValueId: string;
  adjustmentType?: 'PERCENTAGE' | 'FIXED';
  adjustmentValue?: number | string;
  premiumAdjustmentType?: 'PERCENTAGE' | 'FIXED';
  minPremiumValue?: number | null;
  maxPremiumValue?: number | null;
  quoteAction?: 'quote' | 'no_quote' | 'referral';
}

export type RuleCategory = 'BASE' | 'FACTOR' | 'PREMIUM_LIMIT' | 'MATRIX' | 'COMBINATION';

export interface RuleParameterItem {
  formFieldId: string;
  fieldName: string;
  fieldLabel: string;
  fieldType: string;
  required: boolean;
  category: RuleCategory;
  displayOrder: number;
  options: RuleFieldOption[];
  derivedType?: string;
  derivedSubfieldId?: string | null;
  label?: string | null;
  valueType?: string;
  ratingParameterId?: string;
}

export interface MatrixParameterResponseItem {
  id: string;
  formFieldId: string;
  formFieldId2: string;
  field1Name?: string;
  field1Label?: string;
  field2Name?: string;
  field2Label?: string;
  category: 'MATRIX';
  name?: string;
}

export interface RatingRulesResponse {
  masterDataParameters: RuleParameterItem[];
  freeInputParameters: RuleParameterItem[];
  matrixParameters: MatrixParameterResponseItem[];
}

export async function getRatingRules(productId: string): Promise<RatingRulesResponse> {
  return apiGet<RatingRulesResponse>(`/rating-configuration/rules/${productId}`);
}

export type MatrixAxisType = 'MASTER' | 'RANGE';

export interface MatrixAxisItem {
  id: string;
  label?: string;
  code?: string;
  sortOrder?: number;
  rangeStart?: number;
  rangeEnd?: number;
  displayOrder?: number;
}

export interface MatrixAxisConfig {
  fieldId: string;
  fieldName: string | null;
  fieldLabel: string | null;
  type: MatrixAxisType;
  items: MatrixAxisItem[];
}

export interface CreateCustomParameterPayload {
  formFieldId: string;
  label?: string;
  name?: string;
}

export interface UpdateCustomParameterPayload {
  label?: string;
  name?: string;
}

export type DefinitionSourceType = 'FORM_FIELD' | 'DEFINITION';

export interface DefinitionSourceItem {
  type: DefinitionSourceType;
  id: string;
}

export type CreateRatingParameterDefinitionPayload =
  | {
      parameterType: 'REFERENCE';
      formFieldId: string;
      name: string;
    }
  | {
      parameterType: 'MATRIX';
      name?: string;
      sources: [DefinitionSourceItem, DefinitionSourceItem];
    }
  | {
      parameterType: 'COMBINATION';
      name: string;
      sources: DefinitionSourceItem[];
    };

export async function createCustomParameter(
  productId: string,
  payload: CreateCustomParameterPayload,
): Promise<{
  id: string;
  ratingConfigId: string;
  formFieldId: string;
  label?: string | null;
  category: RuleCategory;
  displayOrder: number;
  derivedType?: string;
  derivedSubfieldId?: string | null;
  valueType?: string;
  name?: string | null;
}> {
  return apiPost(`/rating-configuration/custom-parameter/${productId}`, payload);
}

export async function updateCustomParameter(
  parameterId: string,
  payload: UpdateCustomParameterPayload,
): Promise<{ id: string; label?: string | null; name?: string | null }> {
  return apiPatch(`/rating-configuration/custom-parameter/${parameterId}`, payload);
}

export async function deleteCustomParameter(parameterId: string): Promise<{ success: boolean }> {
  return apiDelete(`/rating-configuration/custom-parameter/${parameterId}`);
}

export async function deleteRatingParameterDefinition(
  definitionId: string,
): Promise<{ success: boolean }> {
  return apiDelete(`/rating-configuration/rating-parameter-definitions/${definitionId}`);
}

export async function createRatingParameterDefinition(
  productId: string,
  payload: CreateRatingParameterDefinitionPayload,
): Promise<{
  id: string;
  parameterType: 'REFERENCE' | 'MATRIX' | 'COMBINATION' | string;
  name?: string | null;
  formFieldId?: string | null;
  valueType?: string;
}> {
  return apiPost(`/rating-configuration/rating-parameter-definitions/${productId}`, payload);
}

export interface RatingParameterDefinitionDto {
  id: string;
  definitionId: string;
  formFieldId?: string | null;
  name: string;
  label: string;
  parameterType: 'REFERENCE' | 'MATRIX' | 'COMBINATION' | string;
  isDefinitionOnly: boolean;
  isActive: boolean;
  derivedType?: string;
  derivedSubfieldId?: string | null;
  sources: Array<{
    type: 'FORM_FIELD' | 'DEFINITION';
    id: string;
    position: number;
  }>;
}

export interface UpdateRatingParameterDefinitionPayload {
  name?: string;
  sources?: DefinitionSourceItem[];
}

export async function updateRatingParameterDefinition(
  definitionId: string,
  payload: UpdateRatingParameterDefinitionPayload,
): Promise<{ id: string; name?: string | null }> {
  return apiPatch(`/rating-configuration/rating-parameter-definitions/${definitionId}`, payload);
}

export async function getRatingParameterDefinitions(
  productId: string,
): Promise<RatingParameterDefinitionDto[]> {
  return apiGet<RatingParameterDefinitionDto[]>(
    `/rating-configuration/rating-parameter-definitions/${productId}`,
  );
}

export interface MatrixRuleCell {
  id?: string;
  xRuleType: MatrixAxisType;
  yRuleType: MatrixAxisType;
  xMasterValueId?: string;
  yMasterValueId?: string;
  xRangeRuleId?: string;
  yRangeRuleId?: string;
  adjustmentType: 'PERCENTAGE' | 'FIXED' | 'FACTOR';
  adjustmentValue: number;
  premiumAdjustmentType?: 'PERCENTAGE' | 'FIXED';
  minPremiumValue?: number | null;
  maxPremiumValue?: number | null;
  quoteAction: 'quote' | 'no_quote' | 'referral';
}

export interface MatrixConfigItem {
  ratingParameterId: string;
  name?: string | null;
  x: MatrixAxisConfig;
  y: MatrixAxisConfig;
  rules: MatrixRuleCell[];
}

export interface MatrixRatingConfigResponse {
  ratingConfigId: string | null;
  matrices: MatrixConfigItem[];
}

export async function getMatrixRatingConfig(
  productId: string,
): Promise<MatrixRatingConfigResponse> {
  return apiGet<MatrixRatingConfigResponse>(`/rating-configuration/matrix/${productId}`);
}

export interface RangeConfig {
  id?: string;
  rangeStart: number;
  rangeEnd: number;
  adjustmentType: 'PERCENTAGE' | 'FIXED' | 'percentage' | 'fixed';
  adjustmentValue: number;
  premiumAdjustmentType?: 'PERCENTAGE' | 'FIXED' | 'percentage' | 'fixed';
  minPremiumValue?: number;
  maxPremiumValue?: number;
  quoteAction: 'quote' | 'no_quote' | 'referral';
  displayOrder?: number;
  ratingParameterId?: string;
  subField?: string;
}

export interface GroupedRuleParameterItem {
  formFieldId: string;
  fieldName: string;
  fieldLabel: string;
  fieldType: string;
  required: boolean;
  category: RuleCategory | null;
  displayOrder: number;
  options: RuleFieldOption[];
  ranges?: RangeConfig[];
  masterRules?: (MasterOptionConfig & { id?: string; subField?: string })[];
  ratingParameterId?: string;
  definitionId?: string | null;
  parameterType?: 'FORM_FIELD' | 'REFERENCE' | 'COMBINATION' | 'MATRIX' | 'DERIVED' | string | null;
  derivedParameters?: RatingParameterItem[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subFields?: any[];
}

export interface GroupedRatingParametersResponse {
  ratingConfigId: string;
  base: GroupedRuleParameterItem[];
  factor: GroupedRuleParameterItem[];
  premiumLimit: GroupedRuleParameterItem[];
}

export async function getGroupedRatingParameters(
  productId: string,
): Promise<GroupedRatingParametersResponse> {
  return apiGet<GroupedRatingParametersResponse>(
    `/rating-configuration/parameters/${productId}/grouped`,
  );
}

export type FormulaParameterSection = 'RELATIVE_LOADING' | 'DIRECT_VALUE';

export interface FormulaTokenPayload {
  type: 'field' | 'operator' | 'number' | 'PERCENTAGE' | 'variable' | 'function';
  value: string;
  fieldId?: string;
  ratingParameterId?: string;
  order: number;
  label?: string;
  parameterSection?: FormulaParameterSection;
}

export interface SaveRatingFormulaPayload {
  name: 'SUM_INSURED' | 'PREMIUM' | 'BASE_RATE';
  formulaExpression: FormulaTokenPayload[];
  isCombinationPremium?: boolean;
  isCoverSelectionByUnits?: boolean;
  coverId?: string;
  multiUnitCombinationFieldId?: string;
}

export async function saveRatingFormula(
  productId: string,
  payload: SaveRatingFormulaPayload,
): Promise<{ success: boolean }> {
  return apiPost<{ success: boolean }>(`/rating-configuration/formula/${productId}`, payload);
}
export interface RatingFormulaDto {
  name: 'SUM_INSURED' | 'PREMIUM' | 'BASE_RATE';
  formulaExpression: FormulaTokenPayload[];
  isCombinationPremium?: boolean;
  isCoverSelectionByUnits?: boolean;
  coverId?: string;
  multiUnitCombinationFieldId?: string;
}
export async function getRatingFormulas(productId: string): Promise<RatingFormulaDto[]> {
  const res = await apiGet<{ formulas: RatingFormulaDto[] }>(
    `/rating-configuration/formula/${productId}`,
  );
  return res.formulas || [];
}

export interface MasterOptionConfig {
  optionValue: string;
  masterValueId: string;
  adjustmentType: 'PERCENTAGE' | 'FIXED' | 'percentage' | 'fixed';
  adjustmentValue: number;
  premiumAdjustmentType?: 'PERCENTAGE' | 'FIXED' | 'percentage' | 'fixed';
  minPremiumValue?: number;
  maxPremiumValue?: number;
  quoteAction: 'quote' | 'no_quote' | 'referral';
  subField?: string;
}

export interface ParameterValuesPayload {
  ratingConfigId: string;
  formFieldId: string;
  category: RuleCategory | null;
  type: 'MASTER' | 'RANGE';
  masters?: MasterOptionConfig[];
  ranges?: RangeConfig[];
  deletedIds?: string[];
}

export interface GroupedValuesPayload {
  ratingConfigId: string;
  category: RuleCategory | null;
  parameters: Array<{
    formFieldId: string;
    ratingParameterId?: string;
    type: 'MASTER' | 'RANGE';
    masters?: MasterOptionConfig[];
    ranges?: RangeConfig[];
    deletedIds?: string[];
  }>;
}

export async function saveRatingValues(
  payload: GroupedValuesPayload,
): Promise<{ success: boolean }> {
  return apiPost<{ success: boolean }>(`rating-configuration/pricing-configuration/save`, payload);
}

export interface MatrixCellPayload {
  id?: string;
  xType: MatrixAxisType;
  yType: MatrixAxisType;
  xMasterValueId?: string;
  yMasterValueId?: string;
  xRangeRuleId?: string;
  yRangeRuleId?: string;
  adjustmentType: 'PERCENTAGE' | 'FIXED' | 'FACTOR';
  adjustmentValue: number;
  premiumAdjustmentType?: 'PERCENTAGE' | 'FIXED';
  minPremiumValue?: number;
  maxPremiumValue?: number;
  quoteAction: 'quote' | 'no_quote' | 'referral';
}

export interface MatrixSavePayload {
  ratingConfigId: string;
  matrices: Array<{
    ratingParameterId: string;
    xFieldId: string;
    yFieldId: string;
    xRanges?: {
      id?: string;
      rangeStart: number;
      rangeEnd: number;
      displayOrder?: number;
    }[];
    yRanges?: {
      id?: string;
      rangeStart: number;
      rangeEnd: number;
      displayOrder?: number;
    }[];
    cells: MatrixCellPayload[];
    deletedIds?: string[];
  }>;
}

export interface CombinationRowValuePayload {
  childDefinitionId?: string;
  childRatingParameterId?: string;
  valueType: 'DROPDOWN' | 'NUMBER_RANGE';
  masterValueId?: string;
  coverId?: string;
  rangeFrom?: number;
  rangeTo?: number;
}

export interface CombinationRuleRowPayload {
  id?: string;
  rowOrder: number;
  loading: number;
  premiumAdjustmentType?: 'PERCENTAGE' | 'FIXED';
  minPremiumValue?: number;
  maxPremiumValue?: number;
  adjustmentType?: 'PERCENTAGE' | 'FIXED' | 'FACTOR';
  quoteAction?: 'quote' | 'no_quote' | 'referral';
  values: CombinationRowValuePayload[];
}

export interface CombinationSavePayload {
  ratingConfigId: string;
  combinations: Array<{
    ratingParameterId: string;
    rows: CombinationRuleRowPayload[];
  }>;
}

export interface CombinationConfigResponse {
  ratingConfigId: string | null;
  combinations: Array<{
    ratingParameterId: string;
    definitionId?: string;
    name?: string | null;
    labelName?: string | null;
    category?: 'BASE' | 'FACTOR' | 'PREMIUM_LIMIT' | string | null;
    combinationParameterIds?: string[];
    childDefinitionIds?: string[];
    combinationItems?: Array<{
      definitionId?: string | null;
      label?: string | null;
      parameterType?: string | null;
      dependencyOrder?: number | null;
      formFieldId?: string | null;
      ratingParameterId?: string | null;
      fieldType?: string | null;
      optionsSourceMode?: string | null;
      options?: Array<{
        label?: string | null;
        value?: string | null;
        masterValueId?: string | null;
        coverId?: string | null;
      }>;
      masterDataTable?: string | null;
      tableName?: string | null;
    }>;
    childParameters?: Array<{
      definitionId?: string | null;
      label?: string | null;
      parameterType?: string | null;
      dependencyOrder?: number | null;
      formFieldId?: string | null;
      ratingParameterId?: string | null;
      fieldType?: string | null;
      optionsSourceMode?: string | null;
      options?: Array<{
        label?: string | null;
        value?: string | null;
        masterValueId?: string | null;
        coverId?: string | null;
      }>;
      masterDataTable?: string | null;
      tableName?: string | null;
    }>;
    dependencyMappings?: Array<{
      childDefinitionId?: string | null;
      dependencyOrder?: number | null;
      ratingParameterId?: string | null;
    }>;
    rows: Array<{
      id: string;
      rowOrder: number;
      loading: number;
      premiumAdjustmentType?: 'PERCENTAGE' | 'FIXED' | null;
      minPremiumValue?: number | null;
      maxPremiumValue?: number | null;
      adjustmentType?: 'PERCENTAGE' | 'FIXED' | 'FACTOR';
      quoteAction?: 'quote' | 'no_quote' | 'referral';
      values: Array<{
        id: string;
        childDefinitionId?: string | null;
        childRatingParameterId?: string | null;
        valueType: 'DROPDOWN' | 'NUMBER_RANGE';
        masterValueId?: string | null;
        coverId?: string | null;
        rangeFrom?: number | null;
        rangeTo?: number | null;
      }>;
    }>;
  }>;
}

export async function getCombinationRatingConfig(
  productId: string,
): Promise<CombinationConfigResponse> {
  return apiGet<CombinationConfigResponse>(`/rating-configuration/combination/${productId}`);
}

export async function saveCombinationRatingValues(
  productId: string,
  payload: CombinationSavePayload,
): Promise<{ ratingConfigId: string; saved: number }> {
  return apiPost<{ ratingConfigId: string; saved: number }>(
    `/rating-configuration/combination/${productId}`,
    payload,
  );
}

export async function saveMatrixRatingValues(
  productId: string,
  payload: MatrixSavePayload,
): Promise<{ success: boolean; ratingConfigId: string }> {
  return apiPost<{ success: boolean; ratingConfigId: string }>(
    `/rating-configuration/matrix/${productId}`,
    payload,
  );
}

export async function saveParameterRatingValues(
  productId: string,
  payload: ParameterValuesPayload,
): Promise<{ success: boolean }> {
  return apiPost<{ success: boolean }>(
    `/rating-configuration/values/parameter/${productId}`,
    payload,
  );
}

export interface PolicyLimit {
  maximumCoverValue: number;
  maximumCoverType: 'currency' | 'percentage';
  minimumPremiumValue: number;
  minimumPremiumType: 'currency' | 'percentage';
  brokerCommissionPercent: number;
  brokerCommissionType: 'currency' | 'percentage';
  maxBrokerCommissionPercent: number;
  maxBrokerCommissionType: 'currency' | 'percentage';
  minBrokerCommissionPercent: number;
  minBrokerCommissionType: 'currency' | 'percentage';
}

export interface Deductible {
  id: string | number;
  discount: string | number;
  title?: string;
  description?: string;
  pricingType?: 'Percentage' | 'Fixed' | 'Flat';
  showType?: 'OPTIONAL' | 'MANDATORY';
}

export interface PolicyLimitsAndDeductiblesResponse {
  limits: PolicyLimit;
  policyDeductibles: Deductible[];
}

export async function getPolicyLimits(productId: string): Promise<PolicyLimit> {
  const data = await apiGet<ProductPolicyLimitDto>(`/product/${productId}/policy-limit`);
  return {
    maximumCoverValue: data.maximumCoverValue || 0,
    maximumCoverType: data.maximumCoverType || 'currency',
    minimumPremiumValue: data.minimumPremiumValue || 0,
    minimumPremiumType: data.minimumPremiumType || 'currency',
    brokerCommissionPercent: data.brokerCommissionPercent || 0,
    brokerCommissionType: data.brokerCommissionType || 'percentage',
    maxBrokerCommissionPercent: data.maxBrokerCommissionPercent || 0,
    maxBrokerCommissionType: data.maxBrokerCommissionType || 'percentage',
    minBrokerCommissionPercent: data.minBrokerCommissionPercent || 0,
    minBrokerCommissionType: data.minBrokerCommissionType || 'percentage',
  };
}

export async function getPolicyDeductibles(productId: string): Promise<Deductible[]> {
  const data = await apiGet<ProductPolicyDeductibleDto[]>(
    `/product/${productId}/policy-deductibles`,
  );
  return data.map((d) => ({
    id: d.id || '',
    discount: d.discount,
    title: d.title ?? '',
    description: d.description ?? '',
    pricingType: d.pricingType ?? 'Percentage',
    showType: d.showType ?? 'OPTIONAL',
  }));
}

export async function savePolicyDeductibles(
  productId: string,
  data: ProductPolicyDeductibleDto[],
): Promise<Deductible[]> {
  const response = await apiPost<ProductPolicyDeductibleDto[]>(
    `/product/${productId}/policy-deductibles`,
    data,
  );
  return response.map((d) => ({
    id: d.id || '',
    discount: d.discount,
    title: d.title ?? '',
    description: d.description ?? '',
    pricingType: d.pricingType ?? 'Percentage',
    showType: d.showType ?? 'OPTIONAL',
  }));
}

export interface ProductPolicyLimitDto {
  id?: string;
  maximumCoverValue: number;
  maximumCoverType: 'currency' | 'percentage';
  minimumPremiumValue: number;
  minimumPremiumType: 'currency' | 'percentage';
  brokerCommissionPercent: number;
  brokerCommissionType: 'currency' | 'percentage';
  maxBrokerCommissionPercent: number;
  maxBrokerCommissionType: 'currency' | 'percentage';
  minBrokerCommissionPercent: number;
  minBrokerCommissionType: 'currency' | 'percentage';
}

export interface ProductPolicyDeductibleDto {
  id?: string;
  title?: string;
  description?: string;
  pricingType: 'Percentage' | 'Fixed' | 'Flat';
  discount: number;
  showType?: 'OPTIONAL' | 'MANDATORY';
}

export interface SaveProductPolicyConfigDto {
  policyLimit: ProductPolicyLimitDto;
  policyDeductibles: ProductPolicyDeductibleDto[];
}

export async function savePolicyConfig(
  productId: string,
  data: SaveProductPolicyConfigDto,
): Promise<{ success: boolean }> {
  return apiPost<{ success: boolean }>(`/product/${productId}/policy-config`, data);
}

export interface FeeType {
  id: string | number;
  label: string;
  pricingType: 'percentage' | 'fixed' | 'factor';
  value: string;
  status: 'active' | 'inactive';
  isEditable?: boolean;
  organizationId?: string;
  isNew?: boolean;
}

export interface FeeTypePayload {
  id?: string;
  label: string;
  adjustmentType: 'PERCENTAGE' | 'FIXED' | 'FACTOR';
  adjustmentValue: number;
  status: 'ACTIVE' | 'INACTIVE';
  isEditable?: boolean;
  organizationId?: string;
  isNew?: boolean;
}

export async function getFeeTypes(productId: string): Promise<FeeTypePayload[]> {
  return apiGet<FeeTypePayload[]>(`/product/${productId}/fee-types`);
}

export async function saveFeeTypes(
  productId: string,
  data: FeeTypePayload[],
): Promise<{ success: boolean }> {
  return apiPost<{ success: boolean }>(`/product/${productId}/fee-types`, data);
}

export interface ProductRiskLevel {
  id: string;
  label: string;
  order: number;
}

export interface ProductRiskCategory {
  id: string;
  riskCategorisationId: string;
  name: string;
  riskLevels: ProductRiskLevel[];
}

export interface RiskCategorisationPayload {
  id?: string;
  riskCategoryId: string;
  riskLevelId: string;
  adjustmentType: 'PERCENTAGE' | 'FIXED' | 'FACTOR';
  adjustmentValue: number;
  quoteAction: 'quote' | 'no_quote' | 'referral';
}

export async function getRiskCategories(productId: string): Promise<ProductRiskCategory[]> {
  return apiGet<ProductRiskCategory[]>(`/product/${productId}/risk-categories`);
}

export async function getRiskCategorisations(
  productId: string,
): Promise<RiskCategorisationPayload[]> {
  return apiGet<RiskCategorisationPayload[]>(`/risk-categorisation/pricing/${productId}`);
}

export async function getRiskCategorisationByRiskCategory(
  productId: string,
  riskCategoryId: string,
): Promise<unknown> {
  return apiGet<unknown>(`/risk-categorisation/pricing/${productId}/risk/${riskCategoryId}`);
}

export async function saveRiskCategorisations(
  productId: string,
  data: RiskCategorisationPayload[],
): Promise<{ success: boolean }> {
  return apiPost<{ success: boolean }>(`/risk-categorisation/pricing/${productId}`, data);
}

export async function deleteRiskCategorisation(pricingId: string): Promise<{ success: boolean }> {
  return apiDelete<{ success: boolean }>(`/risk-categorisation/pricing/${pricingId}`);
}

export interface RiskCategorisationExportResponse {
  blob: Blob;
  headers: RawAxiosResponseHeaders | AxiosResponseHeaders;
}

export async function exportRiskCategorisationByRiskCategory(
  productId: string,
  riskCategoryId: string,
): Promise<RiskCategorisationExportResponse> {
  const response = await api.get(
    `/risk-categorisation/pricing/${productId}/risk/${riskCategoryId}/export`,
    {
      responseType: 'blob',
      headers: {
        Accept:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/octet-stream',
      },
    },
  );

  return {
    blob: response.data,
    headers: response.headers,
  };
}

export async function exportRatingParameters(
  productId: string,
  category: string,
  ratingParameterId?: string,
): Promise<Blob> {
  return apiGet<Blob>(`/rating-configuration/parameters/${productId}/export`, {
    params: { category, ratingParameterId },
    responseType: 'blob',
  });
}

export async function exportCombinationParameters(
  productId: string,
  category: string,
  ratingParameterId: string,
): Promise<Blob> {
  return apiGet<Blob>(`/rating-configuration/combination/${productId}/export`, {
    params: { category, ratingParameterId },
    responseType: 'blob',
  });
}

export async function importRatingParameters(
  productId: string,
  file: File,
  category: string,
  ratingParameterId?: string,
): Promise<{ success: boolean }> {
  const formData = new FormData();
  formData.append('file', file);
  return apiPost<{ success: boolean }>(
    `/rating-configuration/parameters/${productId}/import`,
    formData,
    {
      params: { category, ratingParameterId },
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
}

export async function importCombinationParameters(
  productId: string,
  file: File,
  category: string,
  ratingParameterId: string,
): Promise<{ success: boolean }> {
  const formData = new FormData();
  formData.append('file', file);
  return apiPost<{ success: boolean }>(
    `/rating-configuration/combination/${productId}/import`,
    formData,
    {
      params: { category, ratingParameterId },
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
}
