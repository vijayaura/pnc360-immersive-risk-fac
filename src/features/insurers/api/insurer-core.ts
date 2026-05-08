import { apiGet, apiPost, apiPatch, apiPut, apiDelete } from '@/lib/api/client';
import { type Country, type Region, type Zone } from '@/features/product-config/masters/api/masters';

// Raw shape from backend
export interface InsurerDTO {
  id: string;
  user_id: string | null;
  admin_user_id: string | null;
  adminUserId?: string;
  name: string;
  licenseNumber: string | null;
  contact_email: string | null;
  phone: string | null;
  address: string | null;
  // website removed
  operating_countries: string[] | null;
  operating_regions?: { name: string; country: string }[] | null;
  operating_zones?: { name: string; region: string; country: string }[] | null;
  company_logo: string | null;
  status: 'active' | 'inactive' | string;
  adminEmail?: string | null;
  adminName?: string | null;
  admin_password?: string | null;
  contactNumber?: string | null;
  tenantEmail?: string | null;
  geoCoverage?: MasterLocationResponse | null;
  branding?: {
    brandColor: string;
    logoFileUrl: string;
    logoFileSize?: number | null;
    logoFileType?: string | null;
    metadata: {
      address: string;
      operatingCountries: Country[];
      operatingRegions: Region[];
      operatingZones: Zone[];
    };
  };
  license: {
    licenseDocumentFileId: string | null;
    licenseNumber: string;
    validityEnd: string | null;
    validityStart: string | null;
    licenseDocumentSize?: number | null;
    licenseDocumentType?: string | null;
  };
}

// UI/domain-friendly shape
export interface MasterLocationResponse {
  countries: {
    active: boolean;
    countryId: string;
    id: string;
    label: string;
    value: string;
  }[];
  regions: {
    active: boolean;
    countryId: string;
    id: string;
    label: string;
    value: string;
  }[];
  zones: {
    active: boolean;
    countryId: string;
    id: string;
    label: string;
    value: string;
  }[];
}
export interface Insurer {
  id: string;
  name: string;
  adminUserId?: string;
  licenseNumber?: string;
  email?: string;
  phone?: string;
  address?: string;
  // website removed
  operatingCountries?: string[];
  operatingRegions?: { name: string; country: string }[];
  operatingZones?: { name: string; region: string; country: string }[];
  companyLogo?: string | null;
  status: 'active' | 'inactive' | string;
  adminEmail?: string;
  adminName?: string;
  adminPassword?: string;
  contactNumber?: string;
  tenantEmail?: string;
  geoCoverage?: MasterLocationResponse;
  branding?: {
    brandColor: string;
    logoFileUrl: string;
    logoFileSize?: number | null;
    logoFileType?: string | null;
    metadata: {
      address: string;
      operatingCountries: Country[];
      operatingRegions: Region[];
      operatingZones: Zone[];
    };
  };
  license: {
    licenseDocumentFileId: string;
    licenseNumber: string;
    validityEnd: string;
    validityStart: string;
    licenseDocumentSize?: number | null;
    licenseDocumentType?: string | null;
  };
}

function mapInsurer(dto: InsurerDTO): Insurer {
  return {
    id: dto.id,
    name: dto.name || '',
    adminUserId: dto.adminUserId,
    licenseNumber: dto.licenseNumber ?? undefined,
    email: dto.contact_email ?? undefined,
    phone: dto.phone ?? undefined,
    address: dto.address ?? undefined,
    operatingCountries: dto.operating_countries ?? undefined,
    operatingRegions: dto.operating_regions ?? undefined,
    operatingZones: dto.operating_zones ?? undefined,
    companyLogo: dto.company_logo ?? undefined,
    status: dto.status,
    adminEmail: dto.adminEmail ?? undefined,
    adminName: dto.adminName ?? undefined,
    adminPassword: dto.admin_password ?? undefined,
    contactNumber: dto.contactNumber ?? undefined, // to be implemented later
    tenantEmail: dto.tenantEmail ?? undefined, // to be implemented later
    geoCoverage: dto.geoCoverage ?? undefined,
    branding: dto.branding ?? undefined,
    license: dto.license ?? undefined,
  };
}

export interface ListInsurersResponse {
  data: Insurer[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function listInsurers(params?: any): Promise<ListInsurersResponse> {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
  }

  const query = queryParams.toString();
  const resp = await apiGet<{ data: InsurerDTO[]; meta: any }>(`/insurer-management/list?${query}`);

  // Handle case where API might return array directly (legacy) or new object format
  const items = Array.isArray(resp) ? resp : (Array.isArray(resp?.data) ? resp.data : []);
  const meta = resp?.meta || { total: items.length, page: 1, limit: 10, totalPages: 1 };

  return {
    data: items.map(mapInsurer),
    meta: {
      total: Number(meta.total),
      page: Number(meta.page),
      limit: Number(meta.limit),
      totalPages: Number(meta.totalPages),
    },
  };
}

export async function getInsurer(insurerId: string | number): Promise<Insurer> {
  // const data = await apiGet<InsurerDTO>(`/insurers/${encodeURIComponent(String(insurerId))}`);
  const data = await apiGet<InsurerDTO>(
    `/insurer-management/${encodeURIComponent(String(insurerId))}`,
  );
  return mapInsurer(data);
}

export interface UploadLogoFileResponse {
  logoFileId: string;
  logoUrl: string;
  message: string;
}

export async function uploadInsurerLogoFile(file: FormData): Promise<UploadLogoFileResponse> {
  return apiPost('/insurer-management/upload-logo', file);
}
export interface CreateInsurerRequest {
  name: string;
  adminName?: string;
  adminEmail: string;
  adminPassword: string;
  insurerEmail: string;
  domain?: string;
  contactNumber: string;
  licenseNumber?: string;
  operatingCountries?: Array<{
    id: string;
    value: string;
    label: string;
    countryId?: string | null;
    active: boolean;
  }>;
  operatingRegions?: Array<{
    id: string;
    value: string;
    label: string;
    countryId: string;
    active: boolean;
  }>;
  operatingZones?: Array<{
    id: string;
    value: string;
    label: string;
    regionId: string;
    active: boolean;
  }>;
  companyLogo?: string | File | null;
  companyLogoId?: string | null;
  address?: string;
  // name: string;
  // license_number: string;
  // contact_email: string;
  // phone: string;
  // address: string;
  // // website removed from request
  // company_logo?: string | null;
  // operating_countries: string[] | null;
  // operating_regions: { name: string; country: string }[] | null;
  // operating_zones: { name: string; region: string; country: string }[] | null;
  // admin_email: string;
  // admin_password: string;
}

export interface CreateInsurerResponse {
  message: string;
  insurer_id: number;
  admin_user_id: number;
}

export async function createInsurer(body: CreateInsurerRequest): Promise<CreateInsurerResponse> {
  return apiPost<CreateInsurerResponse>('/insurer-management', body);
  // return apiPost<CreateInsurerResponse>("/insurers", body);
}

export type UpdateInsurerRequest = CreateInsurerRequest;

export async function updateInsurer(
  insurerId: string | number,
  body: UpdateInsurerRequest,
): Promise<Insurer> {
  const data = await apiPatch<InsurerDTO>(
    `/insurer-management/${encodeURIComponent(String(insurerId))}`,
    body,
  );
  return mapInsurer(data);
}

export interface StatusChangeResponse {
  message?: string;
  status?: 'active' | 'inactive' | string;
}

// export async function activateInsurer(insurerId: string | number): Promise<StatusChangeResponse> {
//   return apiPut<StatusChangeResponse>(
//     `/insurers/${encodeURIComponent(String(insurerId))}/activate`,
//   );
// }
//
// export async function deactivateInsurer(insurerId: string | number): Promise<StatusChangeResponse> {
//   return apiPut<StatusChangeResponse>(
//     `/insurers/${encodeURIComponent(String(insurerId))}/deactivate`,
//   );
// }

export async function setInsurerStatus(
  insurerId: string | number,
  isActive: boolean,
): Promise<StatusChangeResponse> {
  const endpoint = isActive ? 'ACTIVE' : 'INACTIVE';
  return apiPatch<StatusChangeResponse>(
    `/insurer-management/${encodeURIComponent(String(insurerId))}`,
    { status: endpoint },
  );
}

// Broker/Distributor assignments for an insurer
// Updated to use new backend API: /underwriter/distributors

// New API response format (camelCase) - matches backend integration guide exactly
export interface DistributorDTO {
  id: string; // UUID string
  name: string;
  email: string | null;
  licenseNumber: string | null;
  orgStatus: 'ACTIVE' | 'INACTIVE' | string; // Organization status
  isAssociated: boolean; // Whether broker is associated with this insurer
  isActive: boolean; // Association active status (only relevant if associated)
  status: 'active' | 'inactive' | string;
  productsAssigned: number; // Count of products assigned to this distributor
  associationId: string | null; // null if not associated
  createdAt: string | null; // null if not associated
}

export interface ListDistributorsResponse {
  distributors: DistributorDTO[];
}

// Legacy DTO format for backwards compatibility
export interface BrokerAssignmentDTO {
  id: number;
  broker_name: string;
  email: string | null;
  license_no: string | null;
  status: 'active' | 'inactive' | string;
  is_active: boolean | number;
  products_assigned: string | number | null;
}

export interface BrokerAssignmentsResponse {
  insurer_id: number;
  brokers: BrokerAssignmentDTO[];
}

// Frontend-friendly type (supports both string and number IDs for compatibility)
export interface BrokerAssignment {
  id: number | string;
  name: string;
  email?: string;
  licenseNumber?: string;
  orgStatus?: string; // Organization status: ACTIVE, INACTIVE
  isAssociated?: boolean; // Whether broker is associated with this insurer
  status: 'active' | 'inactive' | string;
  isActive: boolean;
  productsAssigned: number;
  associationId?: string | null;
}

// Map new API response to frontend format
function mapDistributorToAssignment(dto: DistributorDTO): BrokerAssignment {
  return {
    id: dto.id,
    name: dto.name || '',
    email: dto.email ?? undefined,
    licenseNumber: dto.licenseNumber ?? undefined,
    orgStatus: dto.orgStatus,
    isAssociated: dto.isAssociated,
    status: dto.status,
    isActive: dto.isActive,
    productsAssigned: dto.productsAssigned || 0,
    associationId: dto.associationId,
  };
}

// Legacy mapper for backwards compatibility
function mapBrokerAssignment(dto: BrokerAssignmentDTO): BrokerAssignment {
  return {
    id: dto.id,
    name: dto.broker_name || '',
    email: dto.email ?? undefined,
    licenseNumber: dto.license_no ?? undefined,
    status: dto.status,
    isActive: typeof dto.is_active === 'boolean' ? dto.is_active : Number(dto.is_active) === 1,
    productsAssigned: dto.products_assigned == null ? 0 : Number(dto.products_assigned),
  };
}

/**
 * Get all distributors associated with the current underwriter
 * Uses new backend API: GET /underwriter/distributors
 * No insurer_id parameter needed - extracted from JWT token
 */
export async function getInsurerBrokerAssignments(
  _insurerId?: number | string, // Parameter kept for backwards compatibility but not used
): Promise<BrokerAssignment[]> {
  try {
    // Try new API first
    const data = await apiGet<ListDistributorsResponse>(`/underwriter/distributors`);
    const list = Array.isArray(data?.distributors) ? data.distributors : [];
    return list.map(mapDistributorToAssignment);
  } catch (error: any) {
    // If new API fails with 404, it might not be deployed yet - fall back to old API
    if (error?.status === 404 && _insurerId) {
      console.warn('[API] New distributors endpoint not found, falling back to legacy API');
      const data = await apiGet<BrokerAssignmentsResponse>(`/insurer/broker-assignment`, {
        params: { insurer_id: _insurerId },
      });
      const list = Array.isArray(data?.brokers) ? data.brokers : [];
      return list.map(mapBrokerAssignment);
    }
    throw error;
  }
}

/**
 * Get broker/distributor assignments for quote creation flow
 * Includes ?assignedProduct=true filter to only show brokers with assigned products
 * Used ONLY in InsurerCreateBrokerQuote flow
 */
export async function getInsurerBrokerAssignmentsForQuoteCreation(
  _insurerId?: number | string,
): Promise<BrokerAssignment[]> {
  try {
    const data = await apiGet<ListDistributorsResponse>(
      `/underwriter/distributors?assignedProduct=true`,
    );
    const list = Array.isArray(data?.distributors) ? data.distributors : [];
    return list.map(mapDistributorToAssignment);
  } catch (error: any) {
    // For quote creation, if API fails, throw error (no fallback needed)
    throw error;
  }
}

// Toggle broker/distributor active status
export interface ToggleBrokerStatusRequest {
  isActive: boolean; // New API uses camelCase
}

// New API response format - matches backend integration guide
export interface ToggleDistributorResponse {
  id: string; // Association ID
  underwriterOrgId: string;
  distributerOrgId: string;
  isActive: boolean;
  updatedAt: string;
  updatedBy: string;
}

// Legacy response format
export interface ToggleBrokerStatusResponse {
  message?: string;
  insurer_id?: number;
  broker_id?: number;
  status: 'active' | 'inactive' | string;
  isActive?: boolean;
}

/**
 * Toggle distributor active status (enable/disable)
 * Uses new backend API: PATCH /underwriter/distributors/:distributerOrgId/toggle
 */
export async function toggleBrokerStatus(
  _insurerId: number | string, // Parameter kept for backwards compatibility but not used
  brokerId: number | string,
  isActive: boolean,
): Promise<ToggleBrokerStatusResponse> {
  try {
    // Try new API first
    const response = await apiPatch<ToggleDistributorResponse>(
      `/underwriter/distributors/${encodeURIComponent(String(brokerId))}/toggle`,
      { isActive },
    );
    // Map new response to legacy format for backwards compatibility
    return {
      status: response.isActive ? 'active' : 'inactive',
      isActive: response.isActive,
    };
  } catch (error: any) {
    // If new API fails with 404, fall back to old API
    if (error?.status === 404) {
      console.warn('[API] New toggle endpoint not found, falling back to legacy API');
      return apiPatch<ToggleBrokerStatusResponse>(
        `/insurer/${encodeURIComponent(String(brokerId))}/toggle-status`,
        { is_active: isActive },
        { params: { insurer_id: _insurerId } },
      );
    }
    throw error;
  }
}

// Get products with assignment status for a distributor

// New API response format
export interface DistributorProductsResponse {
  distributor: {
    id: string;
    name: string;
    email: string | null;
    isActive: boolean;
    status: string;
  };
  allProducts: Array<{
    productId: string;
    productName: string;
    productCategory: string;
    productStatus: string;
    assigned: boolean;
    isGeoCoverageAllowed?: boolean;
  }>;
}

// Legacy response format
export interface BrokerProductsResponse {
  insurer_id: number;
  broker: { id: number; name?: string; status?: string; is_active?: boolean };
  products: Array<{
    product_id: number;
    product_name: string;
    product_type: string;
    assigned: boolean;
    is_active: boolean;
  }>;
}

// Frontend-friendly type (supports both string and number IDs)
export interface BrokerProductAssignment {
  productId: number | string;
  productName: string;
  productType: string;
  productCategory?: string;
  productStatus?: string;
  assigned: boolean;
  isActive: boolean;
  isGeoCoverageAllowed?: boolean;
  minCommission?: number | string;
  baseCommission?: number | string;
  maxCommission?: number | string;
}

/**
 * Get all products with assignment status for a specific distributor
 * Uses new backend API: GET /underwriter/distributors/:distributerOrgId/products
 */
export async function getBrokerAssignedProducts(
  _insurerId: number | string, // Parameter kept for backwards compatibility but not used
  brokerId: number | string,
): Promise<BrokerProductAssignment[]> {
  try {
    // Try new API first
    const data = await apiGet<DistributorProductsResponse>(
      `/underwriter/distributors/${encodeURIComponent(String(brokerId))}/products`,
    );
    const list = Array.isArray(data?.allProducts) ? data.allProducts : [];
    return list.map((p) => ({
      productId: p.productId,
      productName: p.productName,
      productType: p.productCategory, // Map productCategory to productType for backwards compatibility
      productCategory: p.productCategory,
      productStatus: p.productStatus,
      assigned: !!p.assigned,
      // Allow checkbox if productStatus is 'active' (case-insensitive) or if not set (default to enabled)
      isActive: !p.productStatus || p.productStatus.toLowerCase() === 'active',
      isGeoCoverageAllowed: p.isGeoCoverageAllowed ?? false,
    }));
  } catch (error: any) {
    // If new API fails with 404, fall back to old API
    if (error?.status === 404) {
      console.warn('[API] New products endpoint not found, falling back to legacy API');
      const data = await apiGet<BrokerProductsResponse>(
        `/insurer/${encodeURIComponent(String(brokerId))}/products`,
        { params: { insurer_id: _insurerId } },
      );
      const list = Array.isArray(data?.products) ? data.products : [];
      return list.map((p) => ({
        productId: p.product_id,
        productName: p.product_name,
        productType: p.product_type,
        assigned: !!p.assigned,
        isActive: !!p.is_active,
        isGeoCoverageAllowed: false,
      }));
    }
    throw error;
  }
}

/**
 * Get products assigned to a specific broker for quote creation flow
 * Includes ?assignedProduct=true filter
 * Used ONLY in InsurerCreateBrokerQuote flow
 */
export async function getBrokerAssignedProductsForQuoteCreation(
  _insurerId: number | string,
  brokerId: number | string,
): Promise<BrokerProductAssignment[]> {
  try {
    const data = await apiGet<DistributorProductsResponse>(
      `/underwriter/distributors/${encodeURIComponent(String(brokerId))}/products?assignedProduct=true`,
    );
    const list = Array.isArray(data?.allProducts) ? data.allProducts : [];
    return list.map((p) => ({
      productId: p.productId,
      productName: p.productName,
      productType: p.productCategory,
      productCategory: p.productCategory,
      productStatus: p.productStatus,
      assigned: !!p.assigned,
      isActive: !p.productStatus || p.productStatus.toLowerCase() === 'active',
      isGeoCoverageAllowed: p.isGeoCoverageAllowed ?? false,
    }));
  } catch (error: any) {
    // If new API fails, throw error (no fallback for quote creation flow)
    throw error;
  }
}

// Insurer Metadata API
export interface InsurerMetadata {
  id: number;
  name: string;
  license_number: string;
  contact_email: string;
  phone: string;
  address: string;
  website: string | null;
  company_logo: string | null;
  operating_countries: string[];
  operating_regions: Array<{
    name: string;
    country: string;
  }>;
  operating_zones: Array<{
    name: string;
    region: string;
    country: string;
  }>;
  status: string;
  admin_user_id: number;
  created_at: string;
  updated_at: string;
  admin_email: string;
  admin_password: string | null;
}

export async function getInsurerMetadata(insurerId: number | string): Promise<InsurerMetadata> {
  return await apiGet<InsurerMetadata>(`/insurer-management/${encodeURIComponent(String(insurerId))}`);
}

// Get saved Quote Config
export interface GetQuoteConfigResponse {
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
}

export async function getQuoteConfig(
  insurerId: number | string,
  productId: number | string,
): Promise<GetQuoteConfigResponse> {
  return await apiGet<GetQuoteConfigResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/quote-config`,
  );
}

// Get Quote Config for UI Population
export interface QuoteConfigUIResponse {
  id: number;
  product_id: number;
  validity_days: number;
  backdate_days: number;
  validity_period?: number;
  validity_period_unit?: 'days' | 'months' | 'years';
  operating_countries: string[];
  operating_regions: string[];
  operating_zones: string[];
  created_at: string;
  updated_at: string;
  insurer_id: number;
}

export async function getQuoteConfigForUI(
  insurerId: number | string,
  productId: number | string,
): Promise<QuoteConfigUIResponse> {
  return await apiGet<QuoteConfigUIResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/quote-config`,
  );
}
