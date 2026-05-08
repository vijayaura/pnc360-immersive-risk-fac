import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api/client';
import { UploadedFileValue } from '@/features/quotes/api/edit-quote';
import type { ProductWorkflowResponse } from '@/features/product-config/api/workflow';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import type { AxiosRequestConfig } from 'axios';

export interface FieldValidation {
  type: string;
  value?: string | number;
  message?: string;
}

export interface CalculationOperation {
  operator: '+' | '-' | '*' | '/' | '%' | 'percentageOf';
  operandType?: 'field' | 'manual';
  field?: string;
  manualValue?: string | number;
}

export interface ArithmeticCalculationConfig {
  type?: 'arithmetic';
  initialField: string;
  operations: CalculationOperation[];
}

export interface DateCalculationConfig {
  type: 'date';
  initialField: string;
  comparisonMode: 'currentDate' | 'differentDateField' | 'customDate';
  comparisonField?: string;
  customDate?: string;
  unit: 'days' | 'months' | 'years';
}

export type DropdownCalculationSelectionMode = 'single' | 'multiple' | 'remaining' | 'all';

export type DropdownConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'between'
  | 'not_between'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equal'
  | 'less_than_or_equal'
  | 'is_empty'
  | 'is_not_empty';

export interface DropdownCalculationCondition {
  id: string;
  field: string;
  operator: DropdownConditionOperator;
  numberMode?: 'comparison' | 'range';
  value?: string | number;
  rangeFrom?: number;
  rangeTo?: number;
  selectedValues?: string[];
  selectionMode?: DropdownCalculationSelectionMode;
  defaultValue?: string;
}

export interface DropdownCalculationResult {
  selectionMode: DropdownCalculationSelectionMode;
  selectedValues: string[];
  defaultValue?: string;
}

export interface DropdownConditionalRule {
  id: string;
  conditionMode?: 'and' | 'or';
  conditions: DropdownCalculationCondition[];
  result: DropdownCalculationResult;
}

export interface DropdownConditionalCalculationConfig {
  type: 'dropdownConditional';
  rules: DropdownConditionalRule[];
  fallbackResult?: DropdownCalculationResult;
}

export interface LegacyConditionalLogicConfig {
  field: string;
  condition: string;
  value: string;
}

export type ConditionalLogicResult = 'show' | 'hide';

export interface ConditionalLogicRule {
  id: string;
  conditionMode?: 'and' | 'or';
  conditions: DropdownCalculationCondition[];
  result: ConditionalLogicResult;
}

export interface ConditionalLogicConfig {
  type: 'visibilityRules';
  rules: ConditionalLogicRule[];
  fallbackResult?: ConditionalLogicResult;
}

export type CalculationConfig =
  | ArithmeticCalculationConfig
  | DateCalculationConfig
  | DropdownConditionalCalculationConfig;

export interface FieldOption {
  label: string;
  value: string;
  sortOrder?: number;
  masterValueId?: string;
}

export interface SubField {
  id?: string;
  label: string;
  name: string;
  type:
  | 'text'
  | 'number'
  | 'date'
  | 'datePeriod'
  | 'policyPeriod'
  | 'dropdown'
  | 'time'
  | 'location'
  | 'textarea'
  | 'checkbox'
  | 'file'
  | 'chooseButton'
  | 'consent'
  | 'multiselect';
  placeholder?: string;
  fromDateLabel?: string;
  toDateLabel?: string;
  required?: boolean;
  isRatingParameter?: boolean;
  validations?: FieldValidation[];
  options?: FieldOption[] | string[];
  optionsUrl?: string;
  globalMasterKey?: string;
  readOnly?: boolean;
  autoCalculate?: string;
  dependentOn?: string;
  dependentOptions?: Record<string, string[]>;
  dependentOptionsUrl?: string;
  conditionalLogic?: LegacyConditionalLogicConfig | ConditionalLogicConfig;
  currencyField?: string;
  triggerReferral?: boolean;
  conditionalRequired?: {
    field: string;
    condition: string;
    value: string;
  };
  periodCalculationUnit?: 'days' | 'months' | 'years';
  autoCalculatePeriod?: boolean;
  mapProvider?: string;
  mapApiUrl?: string;
  mapApiKey?: string;
  buttonText?: string;
  buttonVariant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost' | 'link';
  showYearOnly?: boolean;
  metadata?: {
    note?: string;
    defaultValue?: string | number | boolean | string[];
    numberFormat?: string;
    calculation?: CalculationConfig;
    allowReselection?: boolean;
    isCustomerName?: boolean;
    referenceFieldId?: string;
    referenceFieldName?: string;
    referenceSubFieldId?: string;
    referenceSubFieldName?: string;
    active?: unknown;
    [key: string]: unknown;
  };
}

export type FieldType =
  | 'text'
  | 'number'
  | 'dropdown'
  | 'date'
  | 'time'
  | 'datePeriod'
  | 'policyPeriod'
  | 'checkbox'
  | 'consent'
  | 'file'
  | 'multiselect'
  | 'multiselectDropdown'
  | 'location'
  | 'combination'
  | 'repeatable'
  | 'chooseButton'
  | 'nextButton'
  | 'backButton'
  | 'submitButton'
  | 'button'
  | 'textarea';

export interface Field {
  id?: string;
  type: FieldType;
  label: string;
  name: string;
  isLocked?: boolean;
  placeholder?: string;
  defaultValue?: string | number | boolean | string[];
  required?: boolean;
  isRatingParameter?: boolean;
  mapProvider?: string;
  mapApiUrl?: string;
  mapApiKey?: string;
  isMasterData?: boolean;
  validations?: FieldValidation[];
  conditionalLogic?: LegacyConditionalLogicConfig | ConditionalLogicConfig;
  conditionalRequired?: {
    field: string;
    condition: string;
    value: string;
  };
  options?: string[] | FieldOption[];
  optionsUrl?: string;
  globalMasterKey?: string;
  singleSelect?: boolean;
  dependentOn?: string;
  dependentOptions?: Record<string, string[]>;
  dependentOptionsUrl?: string;
  masterDataTable?: string;
  subFields?: SubField[];
  combinationRows?: number;
  combinationRowLabels?: string[];
  allowAddRemove?: boolean;
  addButtonText?: string;
  removeButtonText?: string;
  dynamicRowsBasedOn?: string;
  validateTotal?: boolean;
  totalValidationField?: string;
  totalValidationFieldEstimated?: string;
  totalValidationSubField?: string;
  totalValidationSubFieldEstimated?: string;
  totalValidationPercentage?: number;
  currencyField?: string;
  buttonText?: string;
  buttonAction?: 'submit' | 'next' | 'back' | 'custom' | 'api';
  buttonApiUrl?: string;
  buttonVariant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost' | 'link';
  buttonTargetPage?: string;
  fromDateLabel?: string;
  toDateLabel?: string;
  periodCalculationUnit?: 'days' | 'months' | 'years';
  autoCalculatePeriod?: boolean;
  note?: string;
  showYearOnly?: boolean;
  metadata?: Record<string, unknown>;
}

export function isFieldLocked(
  field?: Pick<Field, 'isLocked' | 'metadata'> | null,
): boolean {
  if (!field) return false;

  const metadataValue = field.metadata?.isLocked;
  const normalizedMetadataValue =
    metadataValue === true || metadataValue === 'true';

  return field.isLocked === true || normalizedMetadataValue;
}

export function isMetadataActive(
  item?: { metadata?: { active?: unknown; [key: string]: unknown } | null } | null,
): boolean {
  return item?.metadata?.active !== false;
}

export interface Section {
  id?: string;
  title?: string;
  subtitle?: string;
  sectionOrder?: number;
  metadata?: {
    active?: boolean;
    visibility?: {
      field: string;
      condition: string;
      valueText?: string;
      masterId?: string;
      masterValueId?: string;
    };
  };
  fields: Field[];
}

export type PageType =
  | 'general'
  | 'form'
  | 'payment'
  | 'quotesList'
  | 'policyDetails'
  | 'underwritingDocuments'
  | 'requiredDocuments';

export interface Page {
  id?: string;
  title: string;
  subtitle?: string;
  pageOrder?: number;
  pageType?: PageType;
  generalTemplateName?: string;
  isGeneralTemplate?: boolean;
  sections?: Section[];
  navigationFields?: Field[];
  paymentUrl?: string;
  quotesUrl?: string;
  pagePayload?: unknown;
  validations?: MultiFieldValidation[];
  metadata?: Record<string, unknown>;
  isCustomerTemplate?: boolean;
  isCustomerProfileTemplatePage?: boolean;
  sourceCustomerProfileTemplateId?: string;
  customerProfileTemplateId?: string | null;
}

export interface MultiFieldValidation {
  id: string;
  fieldNames: string[];
  condition: 'lessThan' | 'moreThan' | 'lessThanOrEqual' | 'moreThanOrEqual' | 'equal';
  value: number;
  message: string;
}

export interface SaveProposalFormDesignRequest {
  name?: string;
  isDraft?: boolean;
  description?: string;
  productId?: string;
  templateId?: string;
  templateVersionId?: string;
  customerProfileTemplateId?: string | null;
  customerCategory?: string;
  pages: Page[];
}

export interface RequireDocument {
  description: string;
  id: string;
  isRequired: boolean;
  label: string;
  validationQuestions?: Array<{
    id?: string;
    question: string;
  }>;
  value?: UploadedFileValue;
}
export interface ProposalFormDesign {
  id?: string;
  productId: string;
  pages: Page[];
  additionalInformationPages?: Page[];
  version?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  templateId?: string;
  templateVersionId?: string;
  requiredDocuments?: RequireDocument[];
  workflow?: ProductWorkflowResponse;
}

export interface ProposalFormTemplate {
  id: string;
  name: string;
  productCategory?: string;
  pages: Page[];
  createdAt: string;
  createdBy: string;
}

export interface CustomerProfileTemplateListItem {
  id: string;
  name: string;
  productId?: string | null;
  customerCategory: string;
  templateVersionId?: string;
  fields?: Array<{
    name: string;
    type: string;
    isLocked: boolean;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerProfileTemplatesResponse {
  categories?: Array<{
    category: string;
    templates: CustomerProfileTemplateListItem[];
  }>;
  templates?: CustomerProfileTemplateListItem[];
}

export interface CustomerProfileTemplateCategory {
  id: string;
  name: string;
  createdById?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface GeneralTemplateListItem {
  id: string;
  name: string;
  description?: string | null;
  productId?: string | null;
  templateType?: 'general';
  templateVersionId?: string;
  fields?: Array<{
    name: string;
    type: string;
    isLocked?: boolean;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface GeneralTemplatesResponse {
  templates?: GeneralTemplateListItem[];
}

export interface ProposalFormVersion {
  id: string;
  designId: string;
  version: string;
  pages: Page[];
  createdAt: string;
}

export interface ValidateFormDesignRequest {
  pages: Page[];
}

export interface ValidateFormDesignResponse {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

export type ProductFormDesignType = 'proposal-form' | 'additional-information';

function normalizeDesignForSave(design: SaveProposalFormDesignRequest): SaveProposalFormDesignRequest {
  return {
    ...design,
    pages: design.pages.map((page, pageIndex) => ({
      ...page,
      pageOrder: page.pageOrder ?? pageIndex + 1,
      sections: (page.sections || []).map((section, sectionIndex) => ({
        ...section,
        sectionOrder: section.sectionOrder ?? sectionIndex + 1,
      })),
    })),
  };
}

function getProductFormDesignBasePath(designType: ProductFormDesignType): string {
  return designType === 'additional-information'
    ? '/additional-information'
    : '/proposal-form/template';
}

export async function getProposalFormDesign(
  productId: string,
  options?: {
    generalTemplateIds?: string[];
  },
): Promise<ProposalFormDesign> {
  type AuthUser = { userType?: string } | null | undefined;
  const user = useAuthStore.getState().user as AuthUser;
  const isAdminUser = user?.userType === 'market_admin' || user?.userType === 'super_admin';
  const params = new URLSearchParams();

  if (!isAdminUser) {
    params.set('isPublished', 'true');
  }
  if (options?.generalTemplateIds?.length) {
    params.set('generalTemplateIds', options.generalTemplateIds.join(','));
  }

  const queryParam = params.toString();

  const config: AxiosRequestConfig & { skipCacheBust?: boolean } = {
    skipCacheBust: true,
  };

  return apiGet<ProposalFormDesign>(
    `/proposal-form/product/${productId}${queryParam ? `?${queryParam}` : ''}`,
    config,
  );
}

export async function saveProposalFormDesign(
  design: SaveProposalFormDesignRequest,
): Promise<ProposalFormDesign> {
  const normalized = normalizeDesignForSave(design);
  return apiPost<ProposalFormDesign>(`/proposal-form/template`, normalized);
}

export async function updateProposalFormDesign(
  templateId: string,
  design: SaveProposalFormDesignRequest,
): Promise<ProposalFormDesign> {
  const normalized = normalizeDesignForSave(design);
  return apiPatch<ProposalFormDesign>(`/proposal-form/template/${templateId}`, normalized);
}

export async function getAdditionalInformationDesign(
  additionalInformationId: string,
): Promise<ProposalFormDesign> {
  const config: AxiosRequestConfig & { skipCacheBust?: boolean } = {
    skipCacheBust: true,
  };

  return apiGet<ProposalFormDesign>(
    `/additional-information/${encodeURIComponent(additionalInformationId)}`,
    config,
  );
}

export async function saveAdditionalInformationDesign(
  additionalInformationId: string,
  design: SaveProposalFormDesignRequest,
): Promise<ProposalFormDesign> {
  const normalized = normalizeDesignForSave(design);
  return apiPost<ProposalFormDesign>(
    `${getProductFormDesignBasePath('additional-information')}/${encodeURIComponent(additionalInformationId)}`,
    normalized,
  );
}

export async function updateAdditionalInformationDesign(
  additionalInformationId: string,
  design: SaveProposalFormDesignRequest,
): Promise<ProposalFormDesign> {
  const normalized = normalizeDesignForSave(design);
  return apiPatch<ProposalFormDesign>(
    `${getProductFormDesignBasePath('additional-information')}/${encodeURIComponent(additionalInformationId)}`,
    normalized,
  );
}

export async function getCustomerProfileTemplateDesign(
  templateId: string,
): Promise<ProposalFormDesign> {
  const config: AxiosRequestConfig & { skipCacheBust?: boolean } = {
    skipCacheBust: true,
  };

  return apiGet<ProposalFormDesign>(
    `/proposal-form/customer-profile-template/${encodeURIComponent(templateId)}`,
    config,
  );
}

export async function saveCustomerProfileTemplateDesign(
  design: SaveProposalFormDesignRequest,
): Promise<ProposalFormDesign> {
  const normalized = normalizeDesignForSave(design);
  return apiPost<ProposalFormDesign>(`/proposal-form/customer-profile-template`, normalized);
}

export async function updateCustomerProfileTemplateDesign(
  templateId: string,
  design: SaveProposalFormDesignRequest,
): Promise<ProposalFormDesign> {
  const normalized = normalizeDesignForSave(design);
  return apiPatch<ProposalFormDesign>(
    `/proposal-form/customer-profile-template/${encodeURIComponent(templateId)}`,
    normalized,
  );
}

export async function getCustomerProfileTemplates(): Promise<CustomerProfileTemplateListItem[]> {
  return getCustomerProfileTemplatesByCategory();
}

export async function getCustomerProfileTemplatesByCategory(
  customerCategory?: string,
): Promise<CustomerProfileTemplateListItem[]> {
  const config: AxiosRequestConfig & { skipCacheBust?: boolean } = {
    skipCacheBust: true,
  };

  const params = new URLSearchParams();
  if (customerCategory) params.set('customerCategory', customerCategory);
  const query = params.toString();

  const response = await apiGet<CustomerProfileTemplatesResponse>(
    `/customer-profile-templates${query ? `?${query}` : ''}`,
    config,
  );

  return Array.isArray(response?.templates) ? response.templates : [];
}

export async function getCustomerProfileTemplateCategories(): Promise<
  CustomerProfileTemplateCategory[]
> {
  const config: AxiosRequestConfig & { skipCacheBust?: boolean } = {
    skipCacheBust: true,
  };

  const response = await apiGet<CustomerProfileTemplateCategory[]>(
    '/customer-profile-templates/categories',
    config,
  );

  return Array.isArray(response) ? response : [];
}

export async function createCustomerProfileTemplateCategory(payload: {
  name: string;
}): Promise<CustomerProfileTemplateCategory> {
  return apiPost<CustomerProfileTemplateCategory>('/customer-profile-templates/categories', payload);
}

export async function deleteCustomerProfileTemplate(templateId: string): Promise<void> {
  return apiDelete<void>(`/proposal-form/customer-profile-template/${encodeURIComponent(templateId)}`);
}

export async function getGeneralTemplateDesign(
  templateId: string,
): Promise<ProposalFormDesign> {
  const config: AxiosRequestConfig & { skipCacheBust?: boolean } = {
    skipCacheBust: true,
  };

  return apiGet<ProposalFormDesign>(
    `/general-templates/${encodeURIComponent(templateId)}`,
    config,
  );
}

export async function saveGeneralTemplateDesign(
  design: SaveProposalFormDesignRequest,
): Promise<ProposalFormDesign> {
  const normalized = normalizeDesignForSave(design);
  return apiPost<ProposalFormDesign>('/general-templates', normalized);
}

export async function updateGeneralTemplateDesign(
  templateId: string,
  design: SaveProposalFormDesignRequest,
): Promise<ProposalFormDesign> {
  const normalized = normalizeDesignForSave(design);
  return apiPatch<ProposalFormDesign>(
    `/general-templates/${encodeURIComponent(templateId)}`,
    normalized,
  );
}

export async function getGeneralTemplates(): Promise<GeneralTemplateListItem[]> {
  const config: AxiosRequestConfig & { skipCacheBust?: boolean } = {
    skipCacheBust: true,
  };

  const response = await apiGet<GeneralTemplatesResponse>('/general-templates', config);

  return Array.isArray(response?.templates) ? response.templates : [];
}

export async function deleteGeneralTemplate(templateId: string): Promise<void> {
  await apiDelete<{ success: boolean }>(`/general-templates/${encodeURIComponent(templateId)}`);
}

export async function getProposalFormDesignVersions(
  productId: string,
): Promise<ProposalFormVersion[]> {
  return apiGet<ProposalFormVersion[]>(
    `/admin/products/${productId}/proposal-form-design/versions`,
  );
}

export async function saveProposalFormTemplate(
  productId: string,
  template: { name: string; productCategory?: string; pages: Page[] },
): Promise<ProposalFormTemplate> {
  return apiPost<ProposalFormTemplate>(
    `/admin/products/${productId}/proposal-form-design/templates`,
    template,
  );
}

export async function getProposalFormTemplates(productId: string): Promise<ProposalFormTemplate[]> {
  return apiGet<ProposalFormTemplate[]>(
    `/admin/products/${productId}/proposal-form-design/templates`,
  );
}

export async function validateProposalFormDesign(
  productId: string,
  design: ValidateFormDesignRequest,
): Promise<ValidateFormDesignResponse> {
  return apiPost<ValidateFormDesignResponse>(
    `/admin/products/${productId}/proposal-form-design/validate`,
    design,
  );
}
