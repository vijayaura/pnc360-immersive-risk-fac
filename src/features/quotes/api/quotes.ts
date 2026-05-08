import { apiPost, apiPatch, apiUploadFile, apiGet, api, apiRequest } from '@/lib/api/client';
import type { SelectedRiskDetail } from '@/types/selected-risk';

// File Upload Types
export interface UploadedFile {
  original_name: string;
  stored_name: string;
  size_bytes: number;
  s3_uri: string;
  url: string;
  url_expires_in_seconds: number;
}

export interface FileUploadResponse {
  fileId?: string;
  message: string;
  files: UploadedFile[];
  body: {
    policy_id: null;
    document_type: null;
  };
  persisted: boolean;
  logoUrl?: string;
  logoFileId?: string;
}

// Types for Quote Project API
export interface QuoteProjectRequest {
  client_name: string;
  project_name: string;
  project_type: string;
  sub_project_type: string;
  construction_type: string;
  address: string;
  country: string;
  region: string;
  zone: string;
  latitude: number;
  longitude: number;
  sum_insured: number;
  start_date: string;
  completion_date: string;
  construction_period_months: number;
  maintenance_period_months: number;
}

export interface QuoteProjectResponse {
  message: string;
  project_id: number;
  project: {
    id: number;
    project_id: string;
    broker_id: number;
    broker_company_id: number;
    broker_company_name: string;
    broker_user_id: number;
    broker_user_name: string;
    broker_user_role: string;
    broker_user_type: string;
    client_name: string;
    project_name: string;
    project_type: string;
    sub_project_type: string;
    construction_type: string;
    address: string;
    country: string;
    region: string;
    zone: string;
    latitude: string;
    longitude: string;
    sum_insured: string;
    start_date: string;
    completion_date: string;
    construction_period_months: number;
    maintenance_period_months: number;
    created_at: string;
    updated_at: string;
  };
  quote: {
    id: number;
    quote_id: string;
    insurer_id: number | null;
    status: string;
    validity_date: string;
    created_at: string;
    updated_at: string;
  };
}

// Create a new quote project
export const createQuoteProject = async (
  data: QuoteProjectRequest,
): Promise<QuoteProjectResponse> => {
  return apiPost<QuoteProjectResponse>('/quotes/project', data);
};

export interface CreateQuoteRequest {
  templateId: string;
  templateVersionId: string;
  productId: string;
  brokerOrganizationId: string;
  fieldValues: any[];
}

export interface CreateQuoteResponse {
  message: string;
  quoteId: string;
  responseId?: string;
}

export const createQuote = async (data: CreateQuoteRequest): Promise<CreateQuoteResponse> => {
  return apiPost<CreateQuoteResponse>('/proposal-form-response', data);
};

export const updateQuoteProject = async (
  data: QuoteProjectRequest,
  quoteId: number,
): Promise<QuoteProjectResponse> => {
  if (!quoteId) {
    throw new Error('Quote ID is required for update operations');
  }
  const endpoint = `/quotes/project/${quoteId}`;
  console.log('🔄 updateQuoteProject called with:', { quoteId, endpoint });
  return apiPatch<QuoteProjectResponse>(endpoint, data);
};

// Types for Insured Details API
export interface InsuredDetailsRequest {
  insured_name: string;
  role_of_insured: string;
  had_losses_last_5yrs: boolean;
  claims_matrix: Array<{
    year: number;
    count: number;
    amount: number;
    description: string;
  }>;
}

export interface InsuredDetailsResponse {
  message: string;
}

// Types for Contract Structure API
export interface ContractStructureRequest {
  main_contractor: string;
  principal_owner: string;
  contract_type: string;
  contract_number: string;
  experience_years: number;
  sub_contractors: Array<{
    name: string;
    contract_type: string;
    contract_number: string;
  }>;
  consultants: Array<{
    name: string;
    role: string;
    license_number: string;
  }>;
}

export interface ContractStructureResponse {
  message: string;
}

export interface SiteRisksRequest {
  near_water_body: boolean;
  flood_prone_zone: boolean;
  within_city_center: string;
  soil_type: string;
  existing_structure: boolean;
  blasting_or_deep_excavation: boolean;
  site_security_arrangements: string;
  area_type: string;
  describe_existing_structure: string;
}

export interface SiteRisksResponse {
  message: string;
}

export interface CoverRequirementsRequest {
  project_value: number;
  contract_works: number;
  plant_and_equipment: number;
  temporary_works: number;
  other_materials: number;
  principals_property: number;
  cross_liability_cover: string;
}

export interface CoverRequirementsResponse {
  message: string;
  sum_insured: number;
}

export const saveInsuredDetails = async (
  data: InsuredDetailsRequest,
  quoteId: number,
): Promise<InsuredDetailsResponse> => {
  if (!quoteId) {
    throw new Error('Quote ID is required for insured details operations');
  }
  const endpoint = `/quotes/insured/${quoteId}`;
  console.log('💾 saveInsuredDetails (POST) called with:', {
    quoteId,
    endpoint,
    data,
  });
  return apiPost<InsuredDetailsResponse>(endpoint, data);
};

export const updateInsuredDetails = async (
  data: InsuredDetailsRequest,
  quoteId: number,
): Promise<InsuredDetailsResponse> => {
  if (!quoteId) {
    throw new Error('Quote ID is required for insured details operations');
  }
  const endpoint = `/quotes/insured/${quoteId}`;
  console.log('🔄 updateInsuredDetails (PATCH) called with:', {
    quoteId,
    endpoint,
    data,
  });
  return apiPatch<InsuredDetailsResponse>(endpoint, data);
};

export const saveContractStructure = async (
  data: ContractStructureRequest,
  quoteId: number,
): Promise<ContractStructureResponse> => {
  if (!quoteId) {
    throw new Error('Quote ID is required for contract structure operations');
  }
  const endpoint = `/quotes/contract/${quoteId}`;
  console.log('💾 saveContractStructure (POST) called with:', {
    quoteId,
    endpoint,
    data,
  });
  return apiPost<ContractStructureResponse>(endpoint, data);
};

// Update contract structure (PATCH for existing)
export const updateContractStructure = async (
  data: ContractStructureRequest,
  quoteId: number,
): Promise<ContractStructureResponse> => {
  if (!quoteId) {
    throw new Error('Quote ID is required for contract structure operations');
  }
  const endpoint = `/quotes/contract/${quoteId}`;
  console.log('🔄 updateContractStructure (PATCH) called with:', {
    quoteId,
    endpoint,
    data,
  });
  return apiPatch<ContractStructureResponse>(endpoint, data);
};

// Save site risks (POST for new)
export const saveSiteRisks = async (
  data: SiteRisksRequest,
  quoteId: number,
): Promise<SiteRisksResponse> => {
  if (!quoteId) {
    throw new Error('Quote ID is required for site risks operations');
  }
  const endpoint = `/quotes/site-risks/${quoteId}`;
  console.log('💾 saveSiteRisks (POST) called with:', {
    quoteId,
    endpoint,
    data,
  });
  return apiPost<SiteRisksResponse>(endpoint, data);
};

export const updateSiteRisks = async (
  data: SiteRisksRequest,
  quoteId: number,
): Promise<SiteRisksResponse> => {
  if (!quoteId) {
    throw new Error('Quote ID is required for site risks operations');
  }
  const endpoint = `/quotes/site-risks/${quoteId}`;
  console.log('🔄 updateSiteRisks (PATCH) called with:', {
    quoteId,
    endpoint,
    data,
  });
  return apiPatch<SiteRisksResponse>(endpoint, data);
};

export const saveCoverRequirements = async (
  data: CoverRequirementsRequest,
  quoteId: number,
): Promise<CoverRequirementsResponse> => {
  if (!quoteId) {
    throw new Error('Quote ID is required for cover requirements operations');
  }
  const endpoint = `/quotes/cover/${quoteId}`;
  const timestamp = new Date().toISOString();
  console.log(`🚨 [${timestamp}] saveCoverRequirements (POST) called with:`, {
    quoteId,
    endpoint,
    data,
  });
  console.trace('📍 Call stack for saveCoverRequirements POST');
  return apiPost<CoverRequirementsResponse>(endpoint, data);
};

// Update cover requirements (PATCH for existing)
export const updateCoverRequirements = async (
  data: CoverRequirementsRequest,
  quoteId: number,
): Promise<CoverRequirementsResponse> => {
  if (!quoteId) {
    throw new Error('Quote ID is required for cover requirements operations');
  }
  const endpoint = `/quotes/cover/${quoteId}`;
  const timestamp = new Date().toISOString();
  console.log(`🚨 [${timestamp}] updateCoverRequirements (PATCH) called with:`, {
    quoteId,
    endpoint,
    data,
  });
  console.trace('📍 Call stack for updateCoverRequirements PATCH');
  return apiPatch<CoverRequirementsResponse>(endpoint, data);
};

// Types for Required Documents API
export interface DocumentInfo {
  label: string;
  url: string;
}

export interface RequiredDocumentsRequest {
  required_document: DocumentInfo[];
}

export interface RequiredDocumentsResponse {
  message: string;
  quote_id: number;
  required_documents: DocumentInfo[];
}

// Save required documents (POST for new)
export const saveRequiredDocuments = async (
  data: RequiredDocumentsRequest,
  quoteId: number,
): Promise<RequiredDocumentsResponse> => {
  if (!quoteId) {
    throw new Error('Quote ID is required for required documents operations');
  }
  const endpoint = `/quotes/${quoteId}/required-documents`;
  console.log('💾 saveRequiredDocuments (POST) called with:', {
    quoteId,
    endpoint,
    data,
  });
  return apiPost<RequiredDocumentsResponse>(endpoint, data);
};

// Update required documents (PATCH for existing)
export const updateRequiredDocuments = async (
  data: RequiredDocumentsRequest,
  quoteId: number,
): Promise<RequiredDocumentsResponse> => {
  if (!quoteId) {
    throw new Error('Quote ID is required for required documents operations');
  }
  const endpoint = `/quotes/${quoteId}/required-documents`;
  console.log('🔄 updateRequiredDocuments (PATCH) called with:', {
    quoteId,
    endpoint,
    data,
  });
  return apiPatch<RequiredDocumentsResponse>(endpoint, data);
};

export interface UploadRequiredDocumentResponse {
  id: string;
  masterDocId: string;
  formResponseId: string;
  filename: string;
  originalFilename: string;
  url: string;
  size: number;
  uploadDate: string;
  uploadedById: string;
  deletedAt: string | null;
  ai_validation_result?: {
    is_valid_document: boolean;
    description_message: string;
  };
}

export interface UploadRequiredDocumentParams {
  displayLabel?: string;
  validationQuestions?: Array<{
    id?: string;
    question: string;
  }>;
}
// upload Required Document (multipart/form-data)
export const uploadRequiredDocument = async (
  formResponseId: string | number,
  docId: string | number,
  file: File,
  params?: UploadRequiredDocumentParams,
): Promise<UploadRequiredDocumentResponse> => {
  try {
    const form = new FormData();
    form.append('formResponseId', String(formResponseId));
    form.append('docId', String(docId));
    if (params?.displayLabel) {
      form.append('displayLabel', params.displayLabel);
    }
    if (params?.validationQuestions !== undefined) {
      form.append('validationQuestions', JSON.stringify(params.validationQuestions));
    }
    form.append('file', file);
    const data = await apiPost<UploadRequiredDocumentResponse>('/quote/required-doc', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  } catch (error) {
    console.error('❌ uploadRequiredDocument error:', error);
    throw error;
  }
};

// File Upload Function
export const uploadFile = async (logo: File): Promise<FileUploadResponse> => {
  // console.log("📤 uploadFile called with:", {
  //   fileName: file.name,
  //   fileSize: file.size,
  //   fileType: file.type,
  // });

  try {
    const data = await apiUploadFile<FileUploadResponse>('/insurer-management/upload-logo', logo);
    // console.log("✅ uploadFile success:", data);
    return data;
  } catch (error) {
    console.error('❌ uploadFile error:', error);
    throw error;
  }
};

/**
 * Generic file upload for proposals.
 * Supports custom field names (e.g., for row-indexed combination fields).
 * If formResponseId is provided, it attempts to use the specialized quote document upload.
 */
export const uploadProposalFile = async (
  file: File,
  fileKey: string,
  formResponseId?: string | number,
): Promise<FileUploadResponse> => {
  // Fallback or Initial Upload (no responseId yet)
  try {
    const data = await apiUploadFile<any>('/insurer-management/upload-logo', file, {}, 'logo');

    // Normalize response
    return {
      message: data.message || 'Success',
      files:
        data.files && Array.isArray(data.files)
          ? data.files
          : [
              {
                original_name: file.name,
                stored_name: data.logoFileId || data.fileId || data.key || '',
                size_bytes: file.size,
                s3_uri: '',
                url: data.logoUrl || data.url || '',
                url_expires_in_seconds: 3600,
              },
            ],
      persisted: false,
      body: { policy_id: null, document_type: null },
      logoUrl: data.logoUrl || data.url,
      logoFileId: data.logoFileId || data.fileId || data.key,
    };
  } catch (error) {
    console.error('❌ uploadProposalFile error:', error);
    throw error;
  }
};

// Upload Filled Proposal File to Email Agents API
export interface UploadFilledProposalResponse {
  project_name: string;
  project_type: string;
  sub_project_type: string;
  construction_type: string;
  project_address: string;
  country: string;
  region: string;
  zone: string;
  latitude: string;
  longitude: string;
  start_date: string;
  completion_date: string;
  maintenance_period_months: string;
  insured_name: string;
  role_of_insured: string;
  any_insurance_losses: string;
  main_contractor: string;
  principal_owner: string;
  contract_type: string;
  contract_number: string;
  experience_in_years: string;
  sub_contractors: Array<{
    subcontractor_name: string;
    contract_type: string;
    contract_number: string;
  }>;
  engineer_consultant_details: Array<{
    name: string;
    role_specialization: string;
    license_number: string;
  }>;
  near_water_body?: string;
  flood_prone_zone: string;
  within_city_center: string;
  area_type?: string;
  soil_type: string;
  existing_structure_on_site: string;
  describe_existing_structure?: string;
  blasting_deep_excavation: string;
  site_security_arrangements: string;
  contract_works: string;
  plant_and_equipment: string;
  temporary_works: string;
  other_materials: string;
  principal_surrounding_property: string;
  cross_liability_cover?: string;
}

export const uploadFilledProposal = async (file: File): Promise<UploadFilledProposalResponse> => {
  console.log('📤 uploadFilledProposal called with:', {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
  });

  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(
      'https://broker-buddy-api.stg.aurainsuretech.com/api/v1/email_agents/file/',
      {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type header, let browser set it with boundary
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ uploadFilledProposal success:', data);
    return data;
  } catch (error) {
    console.error('❌ uploadFilledProposal error:', error);
    throw error;
  }
};

// Upload Filled PI Proposal File to Email Agents API
export interface UploadPIFilledProposalResponse {
  company_name?: string;
  trade_license_no?: string;
  registered_address?: string;
  contact_person?: string;
  email?: string;
  operating_country?: string;
  preferred_currency?: string;
  years_of_experience?: string;
  number_of_professionals?: string;
  last_12_months_turnover?: string;
  estimated_coming_12_months_turnover?: string;
  limit_of_indemnity?: string;
  deductible?: string;
  aggregate_limit?: string;
  has_claims?: string;
  claims_history?: Array<{
    claim_date?: string;
    claim_description?: string;
    claim_amount?: string;
    claim_status?: string;
  }>;
  architecture_activity_split?: Array<{
    activity_type?: string;
    last_12_months_amount?: string;
    estimated_coming_12_months_amount?: string;
  }>;
  engineering_activity_split?: Array<{
    activity_type?: string;
    last_12_months_amount?: string;
    estimated_coming_12_months_amount?: string;
  }>;
  extensions_required?: Record<string, any>;
  [key: string]: any; // Allow additional fields
}

export const uploadPIFilledProposal = async (
  file: File,
): Promise<UploadPIFilledProposalResponse> => {
  console.log('📤 uploadPIFilledProposal called with:', {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
  });

  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(
      'https://broker-buddy-api.stg.aurainsuretech.com/api/v1/email_agents/pi-upload-file/',
      {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type header, let browser set it with boundary
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ uploadPIFilledProposal success:', data);
    return data;
  } catch (error) {
    console.error('❌ uploadPIFilledProposal error:', error);
    throw error;
  }
};

// Types for Proposal Bundle API
export interface QuoteMeta {
  quote_id: number;
  quote_reference_number: string;
  broker_id: number;
  insurer_id: number | null;
  status: string;
  validity_date: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectDetails {
  id: number;
  project_id: string;
  broker_id: number;
  broker_company_id: number;
  broker_company_name: string;
  broker_user_id: number;
  broker_user_name: string;
  broker_user_role: string;
  broker_user_type: string;
  client_name: string;
  project_name: string;
  project_type: string;
  sub_project_type: string;
  construction_type: string;
  address: string;
  country: string;
  region: string;
  zone: string;
  latitude: string;
  longitude: string;
  sum_insured: string;
  start_date: string;
  completion_date: string;
  construction_period_months: number;
  maintenance_period_months: number;
  created_at: string;
  updated_at: string;
}

export interface Claim {
  claim_year: number;
  count_of_claims: number;
  amount_of_claims: string;
  description: string;
}

export interface InsuredDetails {
  id: number;
  project_id: number;
  insured_name: string;
  role_of_insured: string;
  had_losses_last_5yrs: number;
  created_at: string;
  updated_at: string;
}

export interface Insured {
  details: InsuredDetails;
  claims: Claim[];
}

export interface SubContractor {
  name: string;
  contract_type: string;
  contract_number: string;
}

export interface Consultant {
  name: string;
  role: string;
  license_number: string;
}

export interface ContractStructureDetails {
  id: number;
  project_id: number;
  main_contractor: string;
  principal_owner: string;
  contract_type: string;
  contract_number: string;
  experience_years: number;
  created_at: string;
  updated_at: string;
}

export interface ContractStructure {
  details: ContractStructureDetails;
  sub_contractors: SubContractor[];
  consultants: Consultant[];
}

export interface SiteRisks {
  id: number;
  project_id: number;
  near_water_body: number;
  flood_prone_zone: number;
  within_city_center: string;
  soil_type: string;
  existing_structure: number;
  blasting_or_deep_excavation: number;
  site_security_arrangements: string;
  area_type: string;
  describe_existing_structure: string;
  created_at: string;
  updated_at: string;
}

export interface CoverRequirements {
  id: number;
  project_id: number;
  project_value: string;
  contract_works: string;
  plant_and_equipment: string;
  temporary_works: string;
  other_materials: string;
  principals_property: string;
  cross_liability_cover: string;
  sum_insured: string;
  computed_sum_insured: number;
  created_at: string;
  updated_at: string;
  // Add more fields as needed based on the complete response
}

export interface ProposalBundleResponse {
  project_id: number;
  quote_meta: QuoteMeta;
  project: ProjectDetails;
  insured: Insured;
  contract_structure: ContractStructure;
  site_risks: SiteRisks;
  cover_requirements: CoverRequirements;
  // Add more sections as needed
}

// Types for Insurer Pricing Configuration API
export interface BaseRate {
  project_type: string;
  sub_projects: {
    name: string;
    currency: string;
    base_rate: number;
    pricing_type: string;
    quote_option: string;
  }[];
}

export interface LocationHazardFactor {
  factor: string;
  low_risk: string;
  high_risk: string;
  moderate_risk: string;
  very_high_risk: string;
}

export interface LocationHazardRates {
  risk_level: string;
  pricing_type: string;
  quote_option: string;
  loading_discount: number;
}

export interface ProjectDurationLoading {
  to_months: number;
  from_months: number;
  pricing_type: string;
  quote_option: string;
  loading_discount: number;
}

export interface MaintenancePeriodLoading {
  to_months: number | null;
  from_months: number;
  pricing_type: string;
  quote_option: string;
  loading_discount: number;
}

export interface ProjectRiskFactors {
  location_hazard_loadings: {
    risk_definition: {
      factors: LocationHazardFactor[];
    };
    location_hazard_rates: LocationHazardRates[];
  };
  project_duration_loadings: ProjectDurationLoading[];
  maintenance_period_loadings: MaintenancePeriodLoading[];
}

export interface ContractorRiskFactors {
  experience_loadings: {
    to_years: number;
    from_years: number;
    pricing_type: string;
    quote_option: string;
    loading_discount: number;
  }[];
  claims_based_loadings: {
    to_claims: number;
    from_claims: number;
    pricing_type: string;
    quote_option: string;
    loading_discount: number;
  }[];
}

export interface CoverageOptions {
  sum_insured_loadings: {
    to_amount: number;
    from_amount: number;
    pricing_type: string;
    quote_option: string;
    loading_discount: number;
  }[];
  cross_liability_cover: {
    cover_option: string;
    pricing_type: string;
    quote_option: string;
    loading_discount: number;
  }[];
  project_value_loadings: {
    to_amount: number;
    from_amount: number;
    pricing_type: string;
    quote_option: string;
    loading_discount: number;
  }[];
  contract_works_loadings: {
    to_amount: number;
    from_amount: number;
    pricing_type: string;
    quote_option: string;
    loading_discount: number;
  }[];
  plant_equipment_loadings: {
    to_amount: number;
    from_amount: number;
    pricing_type: string;
    quote_option: string;
    loading_discount: number;
  }[];
}

export interface PolicyLimitsAndDeductible {
  sub_limits: {
    title: string;
    value: number;
    description: string;
    pricing_type: string;
  }[];
  deductibles: {
    type: string;
    value: number;
    quote_option: string;
    loading_discount: number;
  }[];
  policy_limits: {
    maximum_cover: {
      value: number;
      pricing_type: string;
    };
    minimum_premium: {
      value: number;
      pricing_type: string;
    };
    base_broker_commission: {
      value: number;
      pricing_type: string;
    };
    maximum_broker_commission: {
      value: number;
      pricing_type: string;
    };
    minimum_broker_commission: {
      value: number;
      pricing_type: string;
    };
  };
}

export interface ClausePricingConfig {
  insurer_id: number;
  product_id: number;
  clause_code: string;
  is_enabled: number;
  is_mandatory: number;
  base_type: string;
  base_value: string;
  base_currency: string;
  options: {
    type: string;
    label: string;
    limit: string;
    value: number;
    currency: string;
    display_order: number;
  }[];
  updated_at: string;
  created_at: string;
  meta: {
    clause_code: string;
    title: string;
    clause_type: string;
    display_order: number;
    is_active: number;
  } | null;
}

export interface TplExtension {
  id: number;
  product_id: number;
  title: string;
  description: string;
  limit_value: string;
  pricing_type: string;
  pricing_value: string;
  currency: string;
  is_active: number;
  created_at: string;
  updated_at: string;
  insurer_id: number | null;
}

export interface QuoteFormat {
  id: number;
  product_id: number;
  company_name: string;
  company_address: string;
  quotation_prefix: string;
  contact_info: {
    raw: string;
  };
  header_bg_color: string;
  header_text_color: string;
  logo_position: string;
  logo_path: string;
  show_project_details: number;
  show_coverage_types: number;
  show_coverage_limits: number;
  show_deductibles: number;
  show_contractor_info: number;
  risk_section_title: string;
  show_base_premium: number;
  show_risk_adjustments: number;
  show_fees_charges: number;
  show_taxes_vat: number;
  show_total_premium: number;
  premium_section_title: string;
  premium_currency: string;
  show_warranties: number;
  show_exclusions: number;
  show_deductible_details: number;
  show_policy_conditions: number;
  terms_section_title: string;
  additional_terms_text: string;
  show_signature_block: number;
  authorized_signatory_name: string;
  signatory_title: string;
  signature_block_text: string;
  show_footer: number;
  show_general_disclaimer: number;
  show_regulatory_info: number;
  general_disclaimer_text: string;
  regulatory_info_text: string;
  footer_bg_color: string;
  footer_text_color: string;
  created_at: string;
  updated_at: string;
  insurer_id: number;
}

export interface RequiredDocument {
  id: number;
  product_id: number;
  display_order: number;
  display_label: string;
  description: string;
  is_required: number;
  template_file: string;
  status: string;
  created_at: string;
  updated_at: string;
  insurer_id: number | null;
}

export interface ConfigItem {
  name?: string;
  value: number;
  is_active?: boolean;
  pricing_type: string;
  quote_option: string;
  display_order?: number;
  country?: string;
}

export interface InsurerPricingConfigResponse {
  insurer_id: number;
  product_id: number;
  product: {
    id: number;
    insurer_id: number;
    product_name: string;
    product_type: string;
    description: string;
    is_active: number;
    created_at: string;
    updated_at: string;
  };
  base_rates: BaseRate[];
  project_risk_factors: ProjectRiskFactors;
  contractor_risk_factors: ContractorRiskFactors;
  coverage_options: CoverageOptions;
  policy_limits_and_deductible: PolicyLimitsAndDeductible;
  clause_pricing_config: ClausePricingConfig[];
  quote_config: {
    id: number;
    product_id: number;
    validity_days: number;
    backdate_days: number;
    operating_countries: string[];
    operating_regions: string[];
    operating_zones: string[];
    created_at: string;
    updated_at: string;
    insurer_id: number;
  };
  pricing_config: any;
  tpl_limits: {
    id: number;
    product_id: number;
    default_limit: string;
    currency: string;
    created_at: string;
    updated_at: string;
    insurer_id: number;
  };
  tpl_extensions: TplExtension[];
  quote_format: QuoteFormat;
  required_documents: RequiredDocument[];
  construction_types_config: {
    items: ConfigItem[];
  };
  countries_config: {
    items: ConfigItem[];
  };
  regions_config: {
    items: ConfigItem[];
  };
  zones_config: {
    items: ConfigItem[];
  };
  role_types_config: {
    items: ConfigItem[];
  };
  contract_types_config: {
    items: ConfigItem[];
  };
  soil_types_config: {
    items: ConfigItem[];
  };
  subcontractor_types_config: {
    items: ConfigItem[];
  };
  consultant_roles_config: {
    items: ConfigItem[];
  };
  security_types_config: {
    items: ConfigItem[];
  };
  area_types_config: {
    items: ConfigItem[];
  };
  fee_types_config: {
    items: ConfigItem[];
  };
}

// Get insurer pricing configuration
export async function getInsurerPricingConfig(
  insurerId: number,
): Promise<InsurerPricingConfigResponse> {
  if (!insurerId) {
    throw new Error('Insurer ID is required for getting pricing configuration');
  }
  const endpoint = `/insurers/${insurerId}/products/1/product-config-bundle`;
  console.log('💰 getInsurerPricingConfig called with:', {
    insurerId,
    endpoint,
  });
  return apiGet<InsurerPricingConfigResponse>(endpoint);
}

export interface QuotesComparisonInsurerConfig {
  policy_limits_and_deductible?: PolicyLimitsAndDeductible;
  tpl_limits: {
    default_limit: string;
    currency?: string | null;
  } | null;
  tpl_extensions: Array<{
    id: string;
    title: string;
    description: string | null;
    limit_value: string;
    pricing_type: string;
    pricing_value: number;
    display_order: number;
    is_active: boolean;
  }>;
  clause_pricing_config: Array<{
    id: string;
    clause_code: string;
    title: string;
    is_mandatory: number;
    base_type?: string | null;
    base_value?: string | null;
    pricing_type: string;
    pricing_value: number;
    meta?: Record<string, any> | null;
    options: Array<{
      id?: string;
      type: string;
      label: string;
      limit: string;
      value: number;
      is_active?: boolean;
      display_order?: number;
    }>;
    selected_covers?: Array<{ id: string; name: string; code: string; section_id: string }>;
  }>;
  globalCews?: QuotesComparisonInsurerConfig['clause_pricing_config'];
  clause_pricing_config_by_cover?: Array<{
    id: string;
    name: string;
    code: string;
    section_id: string;
    section_name: string | null;
    section_order: number;
    cover_order: number;
    clauses: QuotesComparisonInsurerConfig['clause_pricing_config'];
  }>;
  deductibles: Array<{
    id: number;
    discount: number;
    quote_action: string;
    value: number;
  }>;
  validationResults: Array<ValidationResult>;
}

export interface ValidationResult {
  fieldId: string;
  fieldLabel: string;
  category: string;
  proposalValue: string;
  configMatch: string | null;
  pricingEffect: string | null;
  decision: string;
}

export interface CoverPremiumItem {
  coverId: string;
  name?: string;
  code?: string;
  sectionId?: string;
  sectionName?: string;
  sectionOrder?: number;
  sumInsured: number;
  premium: number;
  taxAmount: number;
  netPremium: number;
  sumInsuredFormula?: string;
  premiumFormula?: string;
  units?: CoverUnitPremiumItem[];
}

export interface CoverUnitPremiumItem {
  rowIndex: number;
  rowLabel: string;
  firstColumnValue?: string;
  sumInsured: number;
  sumInsuredFormula?: string;
  premium: number;
  premiumFormula?: string;
  taxAmount: number;
  netPremium: number;
}

export interface PremiumBreakdown {
  sumInsured: number;
  sumInsuredFormula: string;
  base: number;
  baseFormula: string;
  loading: number;
  discount: number;
  fee: number;
  total: number;
  covers?: CoverPremiumItem[];
  feeCalculations?: Array<{ label: string; amount: number; type: string }>;
  unitsCount?: number;
  combinationFieldId?: string;
  combinationFieldLabel?: string;
  combinationFirstColumnFieldId?: string;
  combinationFirstColumnLabel?: string;
  units?: PremiumUnitBreakdown[];
}

export interface PremiumUnitBreakdown {
  rowIndex: number;
  rowLabel: string;
  firstColumnValue?: string;
  premiumInputs?: PremiumUnitRatingInput[];
  ratingInputs?: PremiumUnitRatingInput[];
  covers?: CoverPremiumItem[];
  sumInsured: number;
  sumInsuredFormula?: string;
  base: number;
  baseFormula?: string;
  loading: number;
  loadingFormula?: string;
  discount: number;
  discountFormula?: string;
  fee: number;
  total: number;
}

export interface PremiumUnitRatingInput {
  fieldId: string;
  fieldName: string;
  fieldLabel: string;
  rawValue?: unknown;
  valueString?: string;
  valueNumber?: number;
  valueBoolean?: boolean;
}

export interface FeeType {
  label: string;
  adjustmentType: string;
  adjustmentValue: number;
  amount: number;
  formula: string;
}

export interface QuotesComparisonInsurerItem {
  insurer_id: string;
  insurer_name: string;
  status: string;
  product_assigned_details: Array<{
    product_id: number;
    quote_config: {
      backdate_days: number;
      operating_countries: string[];
      operating_regions: string[];
      operating_zones: string[];
    };
  }>;
  annual_premium: number;
  coverage_amount: number;
  sum_insured: number;
  config: QuotesComparisonInsurerConfig;
  ratingBreakdown?: RatingBreakdownItem[];
  premium?: PremiumBreakdown;
  feeTypes?: FeeType[];
  commissions?: Record<string, any>;
  quoteEvaluationId?: string | null;
}

export interface QuotesComparisonAPIResponse {
  quote_id: string;
  product_id: string;
  product_name?: string;
  insurers: QuotesComparisonInsurerItem[];
}

export async function getQuotesComparisonData(
  productId: string | number,
): Promise<QuotesComparisonAPIResponse> {
  const endpoint = `/quote/product/${encodeURIComponent(String(productId))}/comparison`;
  return apiGet<QuotesComparisonAPIResponse>(endpoint);
}

export async function calculateQuoteRating(formResponseId: string | number): Promise<any> {
  const endpoint = `/quote/calculate-rating/${encodeURIComponent(String(formResponseId))}`;
  return apiGet<any>(endpoint);
}

export interface PricingSelectionItem {
  tplExtensionId: string;
  title: string;
  pricingType: string;
  pricingValue: number;
  limitValue: number;
  displayOrder: number;
}

export interface PricingSelectionsRequest {
  items: PricingSelectionItem[];
}

export interface PricingSelectionsResponse {
  message: string;
}

export async function createPricingSelections(
  quoteId: string | number,
  payload: PricingSelectionsRequest,
): Promise<PricingSelectionsResponse> {
  return apiPost<PricingSelectionsResponse>(
    `/quote/${encodeURIComponent(String(quoteId))}/pricing-selections`,
    payload,
  );
}

// Plan Selection Types
export interface PlanSelectionRequest {
  insurer_name: string;
  insurer_id: number;
  premium_amount: number;
  is_minimum_premium_applied: boolean;
  minimum_premium_value: number;
  extensions: {
    tpl_limit: {
      label: string;
      impact_pct: number;
      description: string;
    };
    selected_extensions: Record<
      string,
      {
        code: string;
        label: string;
        impact_pct?: number;
        impact_amount?: number;
        description: string;
      }
    >;
    selected_plan: {
      insurer_name: string;
      base_premium: number;
      coverage_amount: number;
      deductible: number;
    };
  };
  premium_summary: {
    net_premium: number;
    broker_commission_pct: number;
    broker_commission_amount: number;
    broker_min_commission_pct: number;
    broker_max_commission_pct: number;
    broker_base_commission_pct: number;
    cew_adjustments_pct: number;
    cew_adjustments_amount: number;
    total_annual_premium: number;
  };
  selected_covers?: Array<{
    coverId: string;
    name: string;
    sectionId?: string;
    sectionName?: string;
    sumInsured: number;
    netPremium: number;
    isSelected: boolean;
  }>;
}

export interface PlanSelectionResponse {
  message: string;
  offer: {
    id: number;
    insurer_name: string;
    premium_amount: number;
    extensions: PlanSelectionRequest['extensions'];
    created_by: {
      user_id: number;
      role: string;
      insurer_id: number;
      broker_id: number;
    };
    created_at: string;
    updated_at: string;
  };
}

// Required Documents Types
export interface RequiredDocument {
  id: number;
  product_id: number;
  display_order: number;
  label: string;
  description: string;
  is_required: number;
  url: string;
  status: string;
  insurer_id: number;
  created_at: string;
  updated_at: string;
}

export interface ProductRequiredDocumentsResponse {
  documents: RequiredDocument[];
}

// Document Submission Types
export interface DeclarationSubmissionDocument {
  label: string;
  url: string;
}

export interface DocumentSubmissionRequest {
  product_id: number;
  declaration_documents: DeclarationSubmissionDocument[];
}

export interface DocumentSubmissionResponseItem {
  label: string;
  url: string;
  uploaded_at: string;
}

export interface PolicyDetails {
  id: number;
  policy_id: string;
  quote_id: number;
  insurer_id: number;
  broker_id: number;
  start_date: string;
  end_date: string;
  base_premium: string;
  total_premium: string;
  commission_rate: string;
  commission_amount: string;
  document_path: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  proposal_bundle: any; // This is a complex object, keeping as any for now
}

export interface DocumentSubmissionResponse {
  message: string;
  documents: DocumentSubmissionResponseItem[];
  policy: PolicyDetails;
}

// Plan Selection API Functions
export const createPlanSelection = async (
  quoteId: number,
  data: PlanSelectionRequest,
): Promise<PlanSelectionResponse> => {
  const response = await apiPost<PlanSelectionResponse>(`/quotes/${quoteId}/plans`, data);
  return response;
};

export const updatePlanSelection = async (
  quoteId: number,
  planId: string,
  data: PlanSelectionRequest,
): Promise<PlanSelectionResponse> => {
  const response = await apiPatch<PlanSelectionResponse>(
    `/quotes/${quoteId}/plans/${planId}`,
    data,
  );
  return response;
};

// Required Documents API Functions
export const getRequiredDocuments = async (
  insurerId: number,
  productId: number,
): Promise<ProductRequiredDocumentsResponse> => {
  const response = await apiGet<ProductRequiredDocumentsResponse>(
    `/insurers/${insurerId}/products/${productId}/required-documents`,
  );
  return response;
};

// Document Submission API Functions
export const createDocumentSubmission = async (
  quoteId: number,
  data: DocumentSubmissionRequest,
): Promise<DocumentSubmissionResponse> => {
  const response = await apiPost<DocumentSubmissionResponse>(
    `/quotes/${quoteId}/docs-required`,
    data,
  );
  return response;
};

// Rating Context API Functions
export interface RatingContextResponse {
  ratingConfig: RatingConfig;
  parameters: RatingParameter[];
  formulas: Record<string, RatingFormula>;
}

interface RatingConfig {
  productId: string;
  organizationId: string;
  marketUserId: string;
  baseRates: RatingParameter[];
  factors: RatingParameter[];
  premiumLimit: RatingParameter[];
}

interface RatingParameter {
  formFieldId: string;
  fieldName: string;
  category: string;
  input: any;
  rule: RatingRule;
}

interface RatingRule {
  adjustmentType: string;
  adjustmentValue: number;
  quoteAction: string;
}

interface RatingFormula {
  id: string;
  name: string;
  formulaExpression: Record<string, any>;
}

export const getPolicyDetailsById = async (
  policyId: string | number,
): Promise<PolicyDetailsAPIResponse> => {
  const response = await apiGet<PolicyDetailsAPIResponse>(`/policies/${policyId}`);

  const toNumber = (v: unknown): number | undefined => {
    if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
    if (typeof v === 'string') {
      const trimmed = v.trim();
      if (!trimmed) return undefined;
      const parsed = Number(trimmed);
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
  };

  const normalizedSumInsured =
    toNumber(response.sumInsured) ??
    toNumber(response.sumInsuredBreakdown?.value) ??
    toNumber(response.sumInsuredBreakdown?.total) ??
    toNumber(response.sumInsuredBreakdown?.sumInsured);

  return {
    ...response,
    sumInsured: normalizedSumInsured ?? response.sumInsured,
  };
};

export const getRenderV2 = async (policyId: string): Promise<ProposalBundleResponseV2> => {
  const response = await apiGet<ProposalBundleResponseV2>(`/policies/${policyId}/render`);
  return response;
};

export const updateDocumentSubmission = async (
  quoteId: number,
  data: DocumentSubmissionRequest,
): Promise<DocumentSubmissionResponse> => {
  const response = await apiPatch<DocumentSubmissionResponse>(
    `/quotes/${quoteId}/docs-required`,
    data,
  );
  return response;
};

// Policy Details API for actual policies
export interface PolicyTimelineEvent {
  event: string;
  date: string;
}

export interface PolicyDetailsAPIResponse {
  id: string;
  policyId: string;
  policyNumber: string;
  isPolicyCancelled?: boolean;
  quoteId: string;
  ratingRunId: string;
  totalPremium: number;
  totalSumInsured?: number;
  finalPremium?: number;
  currency: string;
  sumInsured: number;
  sumInsuredBreakdown?: {
    value?: number | string;
    total?: number | string;
    sumInsured?: number | string;
  };
  selectedPremium: {
    currency: string;
    feeAmount: number;
    basePremium: number;
    totalPremium: number;
    loadingAmount: number;
    discountAmount: number;
    brokerCommissionPercentage?: number;
    brokerCommissionAmount?: number;
    brokerMinCommissionPercentage?: number;
    brokerMaxCommissionPercentage?: number;
    brokerBaseCommissionPercentage?: number;
  };
  endorsementSummary?: {
    id?: string;
    endorsementReference?: string;
    versionNumber?: number;
    status?: string;
    type?: string;
    effectiveDate?: string;
    createdAt?: string;
    updatedAt?: string;
    premium?: {
      currency?: string;
      originalPremium?: number;
      revisedPremium?: number;
      variation?: number;
      proRatedPremium?: number;
      loading?: number;
      totalEndorsementAmount?: number;
      endorsementFees?: Array<{
        label?: string;
        amount?: number;
        formula?: string;
        adjustmentType?: string;
        adjustmentValue?: number;
      }>;
    } | null;
  } | null;
  endorsementPremium?: {
    id?: string;
    endorsementReference?: string;
    versionNumber?: number;
    status?: string;
    type?: string;
    effectiveDate?: string;
    createdAt?: string;
    updatedAt?: string;
    premium?: {
      currency?: string;
      originalPremium?: number;
      revisedPremium?: number;
      variation?: number;
      proRatedPremium?: number;
      loading?: number;
      totalEndorsementAmount?: number;
      endorsementFees?: Array<{
        label?: string;
        amount?: number;
        formula?: string;
        adjustmentType?: string;
        adjustmentValue?: number;
      }>;
    } | null;
  } | null;
  tplConfiguration?: {
    defaultLimit?: number;
    selectedLimit?: {
      code?: string;
      description?: string;
      loading?: number;
      currency?: string;
      limitValue?: number;
      pricingType?: string;
      premiumImpact?: string;
    } | null;
  } | null;
  configurableItems?: Array<{
    code?: string;
    title?: string;
    selected?: boolean;
    pricingType?: string;
    type?: string;
    loading?: number;
    value?: number;
  }>;
  deductiblesConfiguration?: {
    selectedDeductible?: {
      code?: string;
      value?: number;
      loading?: number;
      quoteOption?: string;
      premiumImpact?: string;
    } | null;
  } | null;
  createdAt: string;
  quoteReference: string;
  policyStartDate: string;
  policyEndDate: string;
  formResponseData: {
    responseId: string;
    templateId: string;
    productId: string;
    status: string;
    submittedAt: string;
    values: {
      fieldId: string;
      fieldName: string;
      valueText: string | null;
      valueJson: any | null;
      masterValueId: string | null;
    }[];
    files: any[];
  };
  quoteDetails: {
    quoteNumber: string;
    basePremium: number;
    loadingAmount: number;
    discountAmount: number;
    feeAmount: number;
    totalPremium: number;
    validTill: string;
  };
  brokerCommissionDetails?: {
    brokerCommissionPercentage?: number;
    brokerCommissionAmount?: number;
    brokerMinCommissionPercentage?: number;
    brokerMaxCommissionPercentage?: number;
    brokerBaseCommissionPercentage?: number;
  };
  productDetails: {
    id: string;
    name: string;
    category: string;
    currency: string;
  };
  projectBreakdown?: ReferralProjectBreakdownSection[] | null;
}

export interface DashboardListQuotesQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  productId?: string;
  brokerId?: string;
  type?: string;
}

export interface QuoteDashboardItem {
  id: string;
  requestId: string;
  quoteNumber: string;
  customer: string | null;
  broker: string | null;
  project: string | null;
  value: number;
  // legacy single premium field (keep if backend uses it)
  premium: number;
  // new dashboard fields
  basePremium?: number;
  totalPremium?: number;
  currency?: string;
  policyCreated?: boolean;
  isQuoteEditable?: boolean;
  sumInsuredBreakdown?: unknown;
  status: string | null;
  createdAt: string;
  updatedAt: string;
  productId: string;
  productName: string | null;
  templateId: string;
  submittedBy: string | null;
  submittingOrgId: string | null;
}

export interface PaginatedQuotesResponse {
  data: QuoteDashboardItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const getQuotesDashboard = async (
  query: DashboardListQuotesQuery,
): Promise<PaginatedQuotesResponse> => {
  const params = new URLSearchParams();
  if (query.page) params.append('page', query.page.toString());
  if (query.limit) params.append('limit', query.limit.toString());
  if (query.search) params.append('search', query.search);
  if (query.status) params.append('status', query.status);
  if (query.productId) params.append('productId', query.productId);
  if (query.brokerId) params.append('brokerId', query.brokerId);
  if (query.type) params.append('type', query.type);

  return apiGet<PaginatedQuotesResponse>(`/quote/dashboard?${params.toString()}`);
};

export async function exportBrokerQuotes(param: any): Promise<Blob> {
  const queryParams = new URLSearchParams();
  Object.entries(param).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      const stringValue = Array.isArray(value) ? value.join(',') : String(value);
      queryParams.append(key, stringValue);
    }
  });
  const query = queryParams.toString();

  return apiRequest<Blob>(`/quote/export/broker?${query}`, {
    method: 'GET',
    responseType: 'blob',
    skipCacheBust: true,
  } as any);
}

export async function exportInsurerQuotes(param: any): Promise<Blob> {
  const queryParams = new URLSearchParams();
  Object.entries(param).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      const stringValue = Array.isArray(value) ? value.join(',') : String(value);
      queryParams.append(key, stringValue);
    }
  });
  const query = queryParams.toString();

  return apiRequest<Blob>(`/quote/export/insurer?${query}`, {
    method: 'GET',
    responseType: 'blob',
    skipCacheBust: true,
  } as any);
}

export interface FormFieldValueDto {
  fieldId?: string | null;
  fieldName?: string | null;
  valueText: string | null;
  valueJson: unknown;
  masterValueId: string | null;
}

export interface FormFileDto {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
  url: string;
}

export interface QuoteDetailCoverItem {
  id: string;
  coverId: string;
  name?: string;
  code?: string;
  description?: string;
  premium?: number;
  taxAmount?: number;
  netPremium?: number;
  sumInsured?: number;
}

export interface QuoteDetailWithFormResponseDto {
  id: string;
  requestId: string;
  customer: string | null;
  broker: string | null;
  project: string | null;
  value: number;
  premium: number;
  totalSumInsured?: number | string;
  finalPremium?: number | string;
  basePremium?: number;
  totalPremium?: number;
  currency?: string;
  status: string | null;
  createdAt: string;
  updatedAt: string;
  policyCreated?: boolean;
  isQuoteEditable?: boolean;
  productId: string;
  productName: string | null;
  templateId: string;
  submittedBy: string | null;
  submittingOrgId: string | null;
  quoteEvaluationId: string | null;
  ratingRunId: string | null;
  covers?: QuoteDetailCoverItem[];
  formResponseData: {
    responseId: string;
    templateId: string;
    productId: string;
    status: string | null;
    submittedAt: string | null;
    createdAt: string;
    updatedAt: string;
    isLocked: boolean;
    values: FormFieldValueDto[];
    files: FormFileDto[];
  } | null;
  sumInsuredBreakdown?: {
    value?: number | string;
    total?: number | string;
    sumInsured?: number | string;
  } | null;
  projectBreakdown?: ReferralProjectBreakdownSection[] | null;
  selectedRisks?: SelectedRiskDetail[] | null;
}

export const getQuoteDashboardById = async (
  id: string,
): Promise<QuoteDetailWithFormResponseDto> => {
  return apiGet<QuoteDetailWithFormResponseDto>(`/quote/dashboard/${id}`);
};

// Proposal Bundle Types
export interface ProposalBundleResponse {
  project_id: number;
  quote_meta: {
    quote_id: number;
    quote_reference_number: string;
    broker_id: number;
    insurer_id: number;
    status: string;
    validity_date: string;
    created_at: string;
    updated_at: string;
  };
  project: {
    id: number;
    project_id: string;
    broker_id: number;
    broker_company_id: number;
    broker_company_name: string;
    broker_user_id: number;
    broker_user_name: string;
    broker_user_role: string;
    broker_user_type: string;
    client_name: string;
    project_name: string;
    project_type: string;
    sub_project_type: string;
    construction_type: string;
    address: string;
    country: string;
    region: string;
    zone: string;
    latitude: string;
    longitude: string;
    sum_insured: string;
    start_date: string;
    completion_date: string;
    construction_period_months: number;
    maintenance_period_months: number;
    created_at: string;
    updated_at: string;
  };
  insured: {
    details: {
      id: number;
      project_id: number;
      insured_name: string;
      role_of_insured: string;
      had_losses_last_5yrs: number;
      created_at: string;
      updated_at: string;
    };
    claims: Array<{
      claim_year: number;
      count_of_claims: number;
      amount_of_claims: string;
      description: string;
    }>;
  };
  contract_structure: {
    details: {
      id: number;
      project_id: number;
      main_contractor: string;
      principal_owner: string;
      contract_type: string;
      contract_number: string;
      experience_years: number;
      created_at: string;
      updated_at: string;
    };
    sub_contractors: Array<{
      name: string;
      contract_type: string;
      contract_number: string;
    }>;
    consultants: Array<{
      name: string;
      role: string;
      license_number: string;
    }>;
  };
  site_risks: {
    id: number;
    project_id: number;
    near_water_body: number;
    flood_prone_zone: number;
    within_city_center: string;
    soil_type: string;
    existing_structure: number;
    blasting_or_deep_excavation: number;
    site_security_arrangements: string;
    area_type: string;
    describe_existing_structure: string;
    created_at: string;
    updated_at: string;
  };
  cover_requirements: {
    id: number;
    project_id: number;
    project_value: string;
    contract_works: string;
    plant_and_equipment: string;
    temporary_works: string;
    other_materials: string;
    principals_property: string;
    cross_liability_cover: string;
    sum_insured: string;
    created_at: string;
    updated_at: string;
    computed_sum_insured: number;
  };
  required_documents: Record<
    string,
    {
      url: string;
      label: string;
    }
  >;
  plans: Array<{
    id: number;
    created_at: string;
    created_by: {
      role: string;
      user_id: number;
      broker_id: number;
      insurer_id: number;
    };
    extensions: {
      tpl_limit: {
        label: string;
        impact_pct: number;
        description: string;
      };
      selected_plan: {
        deductible: number;
        base_premium: number;
        insurer_name: string;
        coverage_amount: number;
      };
      selected_extensions: Record<
        string,
        {
          code: string;
          label: string;
          impact_pct: number;
          description: string;
        }
      >;
    };
    insurer_id: number;
    updated_at: string;
    insurer_name: string;
    premium_amount: number;
    minimum_premium_value: number;
    is_minimum_premium_applied: boolean;
  }>;
  required_documents_for_policy_issue: any;
}

export const getProposalBundle = async (quoteId: string): Promise<ProposalBundleResponse> => {
  const response = await apiGet<ProposalBundleResponse>(`/quotes/getProposalBundle/${quoteId}`);
  // const response = await apiGet<ProposalBundleResponse>(`/referrals/${quoteId}`);
  return response;
};

//////////////// Get Proposal Bundle V2 ///////////////////////

export interface TemplateFieldValidation {
  type: string;
}

export interface TemplateSubField {
  id: string;
  name: string;
  type: string;
  label: string;
  options: string[];
  required: boolean;
  placeholder: string;
  isRatingParameter: boolean;
  metadata?: Record<string, unknown>;
}

export interface TemplateFieldItem {
  id: string;
  name: string;
  type: string;
  label: string;
  options: string[];
  required: boolean;
  placeholder?: string;
  validations?: TemplateFieldValidation[];
  subFields?: TemplateSubField[];
  isRatingParameter: boolean;
  value?: any;
  metadata?: Record<string, unknown>;
}

export interface TemplatePageSection {
  id: string;
  title: string;
  fields: TemplateFieldItem[];
  subtitle: string;
  sectionOrder: number;
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
}

export interface TemplateNavigationField {
  type: string;
  navOrder: number;
  buttonText: string;
  buttonAction: string;
  buttonTargetPage?: string;
}

export interface TemplatePageItem {
  id: string;
  title: string;
  pageType: string;
  sections: TemplatePageSection[];
  subtitle: string;
  pageOrder: number;
  navigationFields: TemplateNavigationField[];
  metadata?: Record<string, unknown>;
}

export interface ProposalTemplate {
  name: string;
  pages: TemplatePageItem[];
  additionalInformationPages?: TemplatePageItem[];
  productId: string;
  templateId: string;
  currency?: string;
}

export interface DeclarationDocument {
  id: string;
  originalFilename: string;
  filename: string;
  url: string;
  contentType: string;
  sizeBytes: string | number;
  createdAt: string;
  ai_validation_result?: {
    is_valid_document: boolean;
    description_message: string;
  };
}

export interface AdditionalDocument {
  id: string;
  documentName: string;
  originalFilename: string;
  filename: string;
  url: string;
  contentType: string;
  sizeBytes: string | number;
  createdAt: string;
}

/** Same shape as DeclarationDocument; used for endorsement required docs from render API */
export type EndorsementRequiredDocument = DeclarationDocument;
/** Same shape as AdditionalDocument; used for endorsement additional docs from render API */
export type EndorsementAdditionalDocument = AdditionalDocument;

export interface ProposalBundleResponseV2 {
  lastFilledPageId: string;
  responseId: string;
  templateId: string;
  templateVersionId: string;
  productId: string;
  status: string;
  template: ProposalTemplate;
  requiredDocuments?: DeclarationDocument[];
  declarationDocuments?: DeclarationDocument[];
  additionalDocuments?: AdditionalDocument[];
  endorsementRequiredDocuments?: EndorsementRequiredDocument[];
  endorsementAdditionalDocuments?: EndorsementAdditionalDocument[];
  additionalInformation?: {
    responseId: string;
    quoteResponseId?: string;
    templateId: string;
    templateVersionId: string;
    productId: string;
    status: string;
    isLocked?: boolean;
    lastFilledPageId?: string;
    template?: {
      name?: string;
      pages?: TemplatePageItem[];
      productId?: string;
      templateId?: string;
      templateVersionId?: string;
    };
  } | null;
  workflow?: {
    id: string;
    name: string;
    status: string;
    productId: string;
    steps: Array<{
      id: string;
      stepOrder: number;
      title: string;
      isOptional: boolean;
      component: {
        id: string;
        key: string;
        name: string;
      };
      config: Record<string, any>;
    }>;
  };
}

export const getProposalBundleV2 = async (quoteId: string): Promise<ProposalBundleResponseV2> => {
  const response = await apiGet<ProposalBundleResponseV2>(`/quote/${quoteId}/render`);
  return response;
};

export interface AcceptQuoteSelectedPremium {
  basePremium: number;
  totalPremium: number;
  loadingAmount: number;
  discountAmount: number;
  feeAmount: number;
  currency: string;
}

export interface AcceptQuoteTplSelectedLimit {
  code?: string;
  limitValue: number;
  description?: string;
  pricingType?: string;
  loading?: number;
  premiumImpact?: string;
  currency?: string;
}

export interface AcceptQuoteTplConfiguration {
  defaultLimit?: number;
  selectedLimit: AcceptQuoteTplSelectedLimit;
}

export interface AcceptQuoteDeductible {
  code?: string;
  value: number;
  quoteOption?: string;
  loading?: number;
  premiumImpact?: string;
}

export interface AcceptQuoteDeductiblesConfiguration {
  selectedDeductible: AcceptQuoteDeductible;
}

export interface AcceptQuoteConfigurableItem {
  code: string;
  title: string;
  description?: string;
  type?: string;
  pricingType?: string;
  loading?: number;
  premiumImpact?: string;
  isMandatory?: boolean;
  isOptional?: boolean;
  selected: boolean;
  tags?: string[];
}

export interface AcceptQuoteRequest {
  decision: string;
  brokerOrgId: string | number;
  insurerOrgId: string | number;
  productId?: string | number;
  selectedPremium: AcceptQuoteSelectedPremium;
  tplConfiguration?: AcceptQuoteTplConfiguration;
  deductiblesConfiguration?: AcceptQuoteDeductiblesConfiguration;
  configurableItems?: AcceptQuoteConfigurableItem[];
  remarks: string;
}

export interface AcceptQuoteResponse {
  message?: string;
  status?: string;
  id?: string;
}

export const downloadProposal = async (quoteId: string): Promise<Blob> => {
  const response = await api.post(
    `/quote/${quoteId}/download-proposal`,
    {},
    {
      responseType: 'blob',
    },
  );
  return response.data;
};

export interface DownloadQuotePdfPayload {
  values?: Record<string, string>;
  cewSelectedItems?: unknown[];
  selectedDeductible?: unknown;
  deductibleAdjustmentPercent?: number;
  brokerCommissionPercent?: number;
  selectedTplLimitValue?: number;
  hiddenTypes?: string[];
  footerVisible?: boolean;
  signatureVisible?: boolean;
  stampVisible?: boolean;
  disclaimerVisible?: boolean;
  regulatoryInfoVisible?: boolean;
}

export const downloadQuotePdf = async (
  quoteId: string,
  type: 'quote' | 'policy',
  payload: DownloadQuotePdfPayload = {},
  includePremiumBreakdown?: boolean,
): Promise<Blob> => {
  const query = includePremiumBreakdown ? '?includePremiumBreakdown=true' : '';
  const response = await api.post(
    `/quote/${encodeURIComponent(String(quoteId))}/download-pdf/${type}${query}`,
    { ...payload, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
    {
      responseType: 'blob',
      headers: { Accept: 'application/pdf' },
    },
  );
  return response.data;
};

export const acceptQuote = async (
  quoteId: string,
  payload: AcceptQuoteRequest,
): Promise<AcceptQuoteResponse> => {
  return apiPost<AcceptQuoteResponse>(
    `/quote/${encodeURIComponent(String(quoteId))}/accept-quote`,
    payload,
  );
};

export interface IssuePolicyRequest {
  acceptanceId: string;
  effectiveFrom: string; // ISO
  effectiveTo: string; // ISO
}

export interface IssuePolicyResponse {
  message?: string;
  status?: string;
  policyId?: string | number;
}

export const issuePolicy = async (payload: IssuePolicyRequest): Promise<IssuePolicyResponse> => {
  return apiPost<IssuePolicyResponse>('/policies/issue', payload);
};

// Get Referral Data
export type ReferralPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type ReferralSource = 'Manual' | 'Rule-based';
export type FormResponseStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED';
export type ActorType = 'system' | 'user' | 'broker' | 'insurer';
export interface FormValue {
  fieldId: string;
  fieldName: string;
  valueText: string | null;
  valueJson: Record<string, any> | null;
  masterValueId: string | null;
}
export interface FormFile {
  id?: string;
  fileName?: string;
  fileUrl?: string;
  uploadedAt?: string;
}

export interface FormResponseData {
  responseId: string;
  templateId: string;
  templateVersionId: string;
  templateVersionSnapshot?: Record<string, unknown> | null;
  productId: string;
  status: FormResponseStatus;
  submittedAt: string | null;
  isLocked: boolean;
  values: FormValue[];
  files: FormFile[];
}

export interface Activity {
  id: string;
  actorType: ActorType;
  actionType: string;
  comment: string;
  createdAt: string; // ISO date string
}

export interface Adjustment {
  id?: string;
  type?: string;
  value?: number;
  reason?: string;
}
export interface RequestItem {
  id?: string;
  requestType?: string;
  status?: string;
  createdAt?: string;
}
export type ReferralStatus =
  | 'Open'
  | 'Responded'
  | 'Closed'
  | 'Approved'
  | 'Declined'
  | 'In Review'
  | 'Query Raised'
  | 'Approved With Conditions';

export const ReferralDecisions = {
  APPROVE_AS_IS: 'approve_as_is',
  APPROVE_WITH_CONDITIONS: 'approve_with_conditions',
  REQUEST_MORE_DOCUMENTS: 'request_more_documents',
  APPLY_PREMIUM_LOADING: 'apply_premium_loading',
  APPLY_DEDUCTIBLE_CHANGE: 'apply_deductible_change',
  APPLY_COVERAGE_EXCLUSION: 'apply_coverage_exclusion',
  DECLINE_QUOTE: 'decline_quote',
};
export type Decision = (typeof ReferralDecisions)[keyof typeof ReferralDecisions];

export const ReferralRiskRatings = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
};
export type RiskRating = (typeof ReferralRiskRatings)[keyof typeof ReferralRiskRatings];

export const ReferralPremiumLoadingTypes = {
  PERCENTAGE: 'percentage',
  AMOUNT: 'amount',
};
export type PremiumLoadingType =
  (typeof ReferralPremiumLoadingTypes)[keyof typeof ReferralPremiumLoadingTypes];
export interface ReferralReview {
  id: string;
  referralId: string;
  comments: string;
  riskRating: RiskRating;
  decision: Decision;
  modificationDetails: Record<string, any>;
  submittedAt: string;
  updatedAt: string;
}

export interface ReferralProjectBreakdownUnit {
  id: string;
  label: string;
  sumInsured?: number | null;
  premium?: number | null;
  adjustmentType?: string | null;
  quoteAction?: string | null;
}

export interface ReferralProjectBreakdownCover {
  id: string;
  title: string;
  units: ReferralProjectBreakdownUnit[];
}

export interface ReferralProjectBreakdownSection {
  id: string;
  title: string;
  covers: ReferralProjectBreakdownCover[];
}

export interface ReferralApiResponse {
  customerDetails?: {
    customerId: string;
    customerRefId: string;
    customerKey: string;
    customerIdentifier: string;
    customerName: string;
    customerSince: string;
    lastTransactionAt: string;
    lockedFields: Array<{
      keyName: string;
      value: string;
    }>;
  };
  id: string;
  referralId: string;
  quoteEvaluationId: string;
  quoteId?: string;
  quoteNumber?: string;
  ratingRunId: string;
  insurerOrgId: string;
  insurerName: string;
  brokerName: string;
  productName: string;
  productId?: string | null;
  currency?: string | null;
  status: ReferralStatus;
  priority: ReferralPriority;
  reason: string | null;

  triggerSourceType?: string | null;
  triggerDetails?: {
    rules?: Array<{
      ruleType?: string;
      ruleId?: string;
      formFieldId?: string;
      formFieldLabel?: string | null;
      ratingParameterId?: string;
      quoteAction?: string;
      category?: string;
      adjustmentType?: string;
      adjustmentValue?: number;
      masterValueId?: string | null;
      masterValueLabel?: string | null;
      rangeStart?: number | null;
      rangeEnd?: number | null;
      ruleName?: string;
      name?: string;
      ruleSeverity?: string;
      thresholdBreached?: string;
      conditions?: string;
      recommendation?: string;
      description?: string;
    }>;
    ratingBreakdown?: RatingBreakdownItem[] | null;
  } | null;

  referredAt: string;
  updatedAt: string;

  formResponseData: FormResponseData;
  activities: Activity[];
  adjustments: Adjustment[];
  requests: RequestItem[];

  projectBreakdown?: ReferralProjectBreakdownSection[] | null;
  totalSumInsured?: number | string | null;
  finalPremium?: number | string | null;

  referralReview?: ReferralReview | null;
  proposalBundle?: ProposalBundleResponseV2 | null;

  pricingVersions?: Array<{
    versionId: string;
    versionName: string;
    versionNumber: number;
    createdAt: string;
    value: Array<{ ratingParameterId: string; value: number | null }>;
  }> | null;

  pricingBreakdown?: {
    sumInsured: number;
    base: number;
    loading: number;
    discount: number;
    fee: number;
    total: number;

    covers: Array<{
      coverId: string;
      code?: string;
      name?: string;
      sectionId?: string;
      sectionName?: string;
      sectionOrder?: number;
      sumInsured: number;
      premium: number;
      netPremium: number;
      taxAmount?: number;
      premiumFormula?: string;
      sumInsuredFormula?: string;
      units?: Array<{
        rowIndex: number;
        rowLabel: string;
        firstColumnValue?: string;
        sumInsured: number;
        premium?: number;
        netPremium?: number;
        taxAmount?: number;
        sumInsuredFormula?: string;
        premiumFormula?: string;
      }>;
    }>;

    units?: Array<{
      rowIndex: number;
      rowLabel: string;
      firstColumnValue?: string;
      sumInsured: number;
      base: number;
      loading: number;
      discount: number;
      fee: number;
      total: number;

      sumInsuredFormula?: string;
      baseFormula?: string;
      loadingFormula?: string;
      discountFormula?: string;

      covers?: Array<{
        coverId: string;
        name?: string;
        code?: string;
        sectionId?: string;
        sectionName?: string;
        sectionOrder?: number;
        sumInsured: number;
        premium: number;
        netPremium: number;
        taxAmount?: number;
        sumInsuredFormula?: string;
        premiumFormula?: string;
      }>;

      premiumInputs?: Array<{
        fieldId: string;
        fieldName: string;
        fieldLabel: string;
        valueNumber?: number;
        valueBoolean?: boolean;
        valueString?: string;
        rawValue?: unknown;
      }>;

      ratingInputs?: Array<{
        fieldId: string;
        fieldName: string;
        fieldLabel: string;
        valueNumber?: number;
        valueBoolean?: boolean;
        valueString?: string;
        rawValue?: unknown;
      }>;
    }>;

    combinationFirstColumnLabel?: string;
    unitsCount?: number;
    feeCalculations?: unknown[];
  } | null;
}

export const getReferralData = async (referralId: string): Promise<ReferralApiResponse> => {
  return apiGet<ReferralApiResponse>(`/referrals/${referralId}`);
};

export interface AddReferralCommentRequest {
  comment: string;
}

export interface AddReferralCommentResponse {
  id?: string;
  status?: string;
  message?: string;
}

export const addReferralComment = async (
  referralId: string,
  payload: AddReferralCommentRequest,
): Promise<AddReferralCommentResponse> => {
  return apiPost<AddReferralCommentResponse>(
    `/referrals/${encodeURIComponent(String(referralId))}/comments`,
    payload,
  );
};

export interface SubmitReferralReviewRequest {
  underwriterNotes: string;
  riskRating: RiskRating;
  decision: Decision;
  modificationDetails?: Record<string, any>;
}

export interface SubmitReferralReviewResponse {
  message: string;
}

export const submitReferralReview = async (
  referralId: string,
  payload: SubmitReferralReviewRequest,
): Promise<SubmitReferralReviewResponse> => {
  return apiPost<SubmitReferralReviewResponse>(
    `/referrals/${encodeURIComponent(String(referralId))}/review`,
    payload,
  );
};

export interface RatingBreakdownItem {
  fieldId: string;
  fieldLabel: string;
  category: string;
  proposalValue: string;
  configMatch: string;
  pricingEffect: string;
  pricingType?: string | null;
  ratingParameterId?: string | null;
  decision: string;
  componentType: string;
  sourceType: string;
  calculatedValue: number;
  amount: number;
  formula: string;
}

export interface PricingVersionEntry {
  ratingParameterId: string;
  fieldLabel: string;
  editedValue: number;
}

/** Shape returned by the API inside referral detail response */
export interface ApiPricingVersionValue {
  ratingParameterId: string;
  value: number | null;
}

export interface PricingVersion {
  id: string; // maps to versionId
  versionName: string;
  versionNumber: number;
  createdAt: string;
  entries: PricingVersionEntry[];
}

/** Convert raw API pricingVersions array to our PricingVersion shape.
 *  Pass ratingBreakdown rows to resolve human-readable field labels. */
export function mapApiPricingVersions(
  raw: Array<{
    versionId: string;
    versionName: string;
    versionNumber: number;
    createdAt: string;
    value: ApiPricingVersionValue[];
  }>,
  ratingBreakdown?: Array<{ ratingParameterId?: string | null; fieldLabel?: string }>,
): PricingVersion[] {
  const labelMap = new Map<string, string>();
  if (ratingBreakdown) {
    for (const item of ratingBreakdown) {
      if (item.ratingParameterId && item.fieldLabel) {
        labelMap.set(item.ratingParameterId, item.fieldLabel);
      }
    }
  }
  return raw.map((v) => ({
    id: v.versionId,
    versionName: v.versionName,
    versionNumber: v.versionNumber,
    createdAt: v.createdAt,
    entries: v.value
      .filter((e) => e.value !== null)
      .map((e) => ({
        ratingParameterId: e.ratingParameterId,
        fieldLabel: labelMap.get(e.ratingParameterId) ?? e.ratingParameterId,
        editedValue: e.value as number,
      })),
  }));
}

export interface SavePricingVersionPayload {
  versionName: string;
  pricingUpdates: Array<{
    ratingParameterId: string;
    editedValue: number;
  }>;
}

export const savePricingVersion = async (
  referralId: string,
  payload: SavePricingVersionPayload,
): Promise<{ id: string; versionName: string; createdAt: string }> => {
  return apiPost(`/referrals/${encodeURIComponent(referralId)}/pricing-version`, payload);
};

// Chat API types
export interface ChatAttachment {
  id: string;
  referralId: string;
  messageId: string;
  uploadedById: string;
  uploadedByRole: string;
  documentName: string;
  documentType: string;
  documentSize: string;
  documentUrl: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  referralId: string;
  senderId: string;
  senderRole: 'insurer' | 'broker';
  messageType: 'query' | 'response';
  queryCategory: string | null;
  message: string;
  status: string;
  dueDate: string | null;
  brokerReadAt: string | null;
  brokerReadById?: string | null;
  insurerReadAt: string | null;
  insurerReadById?: string | null;
  createdAt: string;
  updatedAt: string;
  attachments: ChatAttachment[];
}

export interface ChatHistoryResponse {
  data: ChatMessage[];
  meta: {
    totalQuery: number;
  };
}

export interface SendQueryRequest {
  queryCategory?: string;
  message: string;
  dueDate: string;
  files?: File[];
}

export interface SendQueryResponse {
  message?: string;
  data?: ChatMessage;
  status?: string;
}

export const getReferralChatHistory = async (
  referralId: string,
  includeAttachments?: string,
): Promise<ChatHistoryResponse> => {
  const params = new URLSearchParams();
  params.set('includeAttachments', includeAttachments ? 'true' : 'false');
  return apiGet<ChatHistoryResponse>(`/referrals/${referralId}/chat/messages?${params.toString()}`);
};

export const sendReferralQuery = async (
  referralId: string,
  payload: SendQueryRequest,
): Promise<SendQueryResponse> => {
  if (payload.files && payload.files.length > 0) {
    const formData = new FormData();
    if (payload.queryCategory) {
      formData.append('queryCategory', payload.queryCategory);
    }
    formData.append('message', payload.message || 'Shared file(s)');
    formData.append('dueDate', payload.dueDate);
    payload.files.forEach((file) => formData.append('files', file));
    return apiPost<SendQueryResponse>(`/referrals/${referralId}/chat/query`, formData);
  }
  const { files, ...rest } = payload;
  return apiPost<SendQueryResponse>(`/referrals/${referralId}/chat/query`, rest);
};

export interface RespondToChatRequest {
  message: string;
  parentMessageId: string;
  files?: File[];
}

export const respondToReferralChat = async (
  referralId: string,
  payload: RespondToChatRequest,
): Promise<any> => {
  const formData = new FormData();
  formData.append('message', payload.message || 'Shared file(s)');
  formData.append('parentMessageId', payload.parentMessageId);
  if (payload.files) {
    payload.files.forEach((file) => formData.append('files', file));
  }

  return apiPost(`/referrals/${referralId}/chat/respond`, formData);
};
