import { apiGet, apiPost, apiPatch, apiPut, apiDelete } from '@/lib/api/client';

export interface QuoteFormatResponse {
  id: number;
  product_id: number;
  company_name: string;
  company_address: string;
  quotation_prefix: string;
  contact_info: {
    raw?: string;
    email?: string;
    phone?: string;
    website?: string;
  } | null;
  header_bg_color: string;
  header_text_color: string;
  logo_position: 'LEFT' | 'CENTER' | 'RIGHT' | string;
  logo_path: string | null;
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

// Masters: Project Types and Sub Project Types
export interface MasterProjectTypeDTO {
  id: number;
  name: string;
  status: string;
  display_order: number;
}

export interface MasterProjectType {
  id: number;
  name: string;
  status: string;
  displayOrder: number;
}

function mapMasterProjectType(dto: MasterProjectTypeDTO): MasterProjectType {
  return {
    id: dto.id,
    name: dto.name,
    status: dto.status,
    displayOrder: dto.display_order,
  };
}

export async function getMasterProjectTypes(): Promise<MasterProjectType[]> {
  const data = await apiGet<MasterProjectTypeDTO[]>(
    `/admin/master-management/master_project_types`,
  );
  const list = Array.isArray(data) ? data : [];
  return list.map(mapMasterProjectType).sort((a, b) => a.displayOrder - b.displayOrder);
}

export interface MasterSubProjectTypeDTO {
  id: number;
  name: string;
  status: string;
  display_order: number;
  project_type_id?: number;
}

export interface MasterSubProjectType {
  id: number;
  name: string;
  status: string;
  displayOrder: number;
  projectTypeId?: number;
}

function mapMasterSubProjectType(dto: MasterSubProjectTypeDTO): MasterSubProjectType {
  return {
    id: dto.id,
    name: dto.name,
    status: dto.status,
    displayOrder: dto.display_order,
    projectTypeId: dto.project_type_id,
  };
}

export async function getMasterSubProjectTypes(): Promise<MasterSubProjectType[]> {
  const data = await apiGet<MasterSubProjectTypeDTO[]>(
    `/admin/master-management/master_sub_project_types`,
  );
  const list = Array.isArray(data) ? data : [];
  return list.map(mapMasterSubProjectType).sort((a, b) => a.displayOrder - b.displayOrder);
}

export async function getQuoteFormat(
  insurerId: number | string,
  productId: number | string,
): Promise<QuoteFormatResponse> {
  return apiGet<QuoteFormatResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/quote-format`,
  );
}

export interface SaveQuoteFormatResponse {
  message?: string;
  id?: number;
}

export interface SaveQuoteFormatParams {
  product_id: string;
  company_name: string;
  company_address: string;
  quotation_prefix: string;
  contact_info: {
    phone: string;
    email: string;
    website: string;
  };
  header_bg_color: string;
  header_text_color: string;
  logo_position: string; // LEFT | CENTER | RIGHT
  url: string; // logo URL
  show_project_details: boolean;
  show_coverage_types: boolean;
  show_coverage_limits: boolean;
  show_deductibles: boolean;
  show_contractor_info: boolean;
  risk_section_title: string;
  show_base_premium: boolean;
  show_risk_adjustments: boolean;
  show_fees_charges: boolean;
  show_taxes_vat: boolean;
  show_total_premium: boolean;
  premium_section_title: string;
  premium_currency: string;
  show_warranties: boolean;
  show_exclusions: boolean;
  show_deductible_details: boolean;
  show_policy_conditions: boolean;
  terms_section_title: string;
  additional_terms_text: string;
  show_signature_block: boolean;
  authorized_signatory_name: string;
  signatory_title: string;
  signature_block_text: string;
  show_footer: boolean;
  show_general_disclaimer: boolean;
  general_disclaimer_text: string;
  show_regulatory_info: boolean;
  regulatory_info_text: string;
  footer_bg_color: string;
  footer_text_color: string;
}

export async function createQuoteFormat(
  insurerId: number | string,
  productId: number | string,
  params: SaveQuoteFormatParams,
): Promise<SaveQuoteFormatResponse> {
  return apiPost<SaveQuoteFormatResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/quote-format`,
    params,
  );
}

export async function updateQuoteFormat(
  insurerId: number | string,
  productId: number | string,
  params: Partial<SaveQuoteFormatParams>,
): Promise<SaveQuoteFormatResponse> {
  return apiPatch<SaveQuoteFormatResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/quote-format`,
    params,
  );
}

export interface ProductQuoteFormatResponse {
  id: string;
  companyName: string;
  companyAddress: string;
  quotationPrefix: string;
  contactInfo: {
    email: string;
    phone: string;
    website: string;
  } | null;
  headerBgColor: string;
  headerTextColor: string;
  logoPosition: string;
  showProjectDetails: boolean;
  showCoverageTypes: boolean;
  showCoverageLimits: boolean;
  showDeductibles: boolean;
  showContractorInfo: boolean;
  riskSectionTitle: string;
  showBasePremium: boolean;
  showRiskAdjustments: boolean;
  showFeesCharges: boolean;
  showTaxesVat: boolean;
  showTotalPremium: boolean;
  premiumSectionTitle: string;
  premiumCurrency: string;
  showWarranties: boolean;
  showExclusions: boolean;
  showDeductibleDetails: boolean;
  showPolicyConditions: boolean;
  termsSectionTitle: string;
  additionalTermsText: string;
  showSignatureBlock: boolean;
  authorizedSignatoryName: string;
  signatoryTitle: string;
  signatureBlockText: string;
  showFooter: boolean;
  showGeneralDisclaimer: boolean;
  generalDisclaimerText: string;
  showRegulatoryInfo: boolean;
  regulatoryInfoText: string;
  footerBgColor: string;
  footerTextColor: string;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  productId: string;
  organizationId: string;
  marketUserId: string;
  createdById: string;
  updatedById: string | null;
  version: number;
}

export interface SaveProductQuoteFormatRequest {
  companyName: string;
  companyAddress: string;
  quotationPrefix: string;
  contactInfo: {
    email: string;
    phone: string;
    website: string;
  } | null;
  headerBgColor: string;
  headerTextColor: string;
  logoPosition: string;
  showProjectDetails: boolean;
  showCoverageTypes: boolean;
  showCoverageLimits: boolean;
  showDeductibles: boolean;
  showContractorInfo: boolean;
  riskSectionTitle: string;
  showBasePremium: boolean;
  showRiskAdjustments: boolean;
  showFeesCharges: boolean;
  showTaxesVat: boolean;
  showTotalPremium: boolean;
  premiumSectionTitle: string;
  premiumCurrency: string;
  showWarranties: boolean;
  showExclusions: boolean;
  showDeductibleDetails: boolean;
  showPolicyConditions: boolean;
  termsSectionTitle: string;
  additionalTermsText: string;
  showSignatureBlock: boolean;
  authorizedSignatoryName: string;
  signatoryTitle: string;
  signatureBlockText: string;
  showFooter: boolean;
  showGeneralDisclaimer: boolean;
  generalDisclaimerText: string;
  showRegulatoryInfo: boolean;
  regulatoryInfoText: string;
  footerBgColor: string;
  footerTextColor: string;
  logoUrl: string | null;
  logoFileId?: string | null;
}

export async function getProductQuoteFormat(
  templateId: number | string,
): Promise<ProductQuoteFormatResponse> {
  return apiGet<ProductQuoteFormatResponse>(
    `/quote-format/template/${encodeURIComponent(String(templateId))}`,
  );
}

export async function saveProductQuoteFormat(
  productId: number | string,
  body: SaveProductQuoteFormatRequest,
): Promise<ProductQuoteFormatResponse> {
  return apiPost<ProductQuoteFormatResponse>(
    `/quote-format/product/${encodeURIComponent(String(productId))}`,
    body,
  );
}

// Upload Quote Format Logo (multipart/form-data, field name 'logo')
export interface UploadLogoResponse {
  logoUrl: string;
  logoFileId: string;
  message: string;
}

export async function uploadQuoteFormatLogo(
  productId: number | string,
  file: File,
): Promise<UploadLogoResponse> {
  const form = new FormData();
  form.append('logo', file);
  return apiPost<UploadLogoResponse>(
    `/quote-format/product/${encodeURIComponent(String(productId))}/logo`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
}

// Required Documents