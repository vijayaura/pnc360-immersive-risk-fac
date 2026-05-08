import { apiGet } from '@/lib/api/client';
import { apiPost } from '@/lib/api/client';
import { apiPatch } from '@/lib/api/client';
import { apiPut } from '@/lib/api/client';

// ============================================================================
// FILE UPLOAD TYPES FOR BROKER MANAGEMENT
// ============================================================================

export interface BrokerUploadedFile {
  original_name: string;
  stored_name: string;
  size_bytes: number;
  s3_uri: string;
  url: string;
  url_expires_in_seconds: number;
}

export interface BrokerFileUploadResponse {
  url: string;
  fileId: string;
  key: string;
  message: string;
}

/**
 * Upload a file for broker management (license or logo)
 * POST /broker-management/upload
 * @param file - The file to upload
 * @param key - The key to identify the file type ("logo" for logo, "license" for license)
 * @returns Upload response with file details
 */
export async function uploadBrokerFile(
  file: File,
  key: 'logo' | 'license',
): Promise<BrokerFileUploadResponse> {
  const formData = new FormData();
  formData.append('file', file); // Always send file with "file" key
  formData.append('key', key); // Send "key" field to indicate "logo" or "license"

  return apiPost<BrokerFileUploadResponse>('/broker-management/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

// ============================================================================
// BROKER MANAGEMENT API (New endpoint)
// ============================================================================

export interface CreateBrokerManagementRequest {
  domain?: string;
  name: string;
  brokerEmail?: string;
  contactNumber?: string;
  adminName?: string;
  adminEmail: string;
  adminPassword: string;
  licenseNumber?: string;
  licenseDocumentId?: string;
  companyLogoId?: string;
  validityStartDate?: string;
  validityEndDate?: string;
  // Operating coverage fields
  operatingCountries?: Array<{
    id: string;
    value: string;
    label: string;
    countryId: string | null;
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
}

export interface BrokerManagementResponse {
  id: string;
  name: string;
  adminEmail: string;
  adminName: string;
  brokerEmail?: string;
  contactNumber: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface CreateBrokerManagementResponse {
  message: string;
  broker: BrokerManagementResponse;
  adminCredentials: {
    email: string;
  };
}

/**
 * Create a broker via the broker-management endpoint
 * POST /broker-management/{marketId}
 */
export async function createBrokerViaManagement(
  marketId: string,
  body: CreateBrokerManagementRequest,
): Promise<CreateBrokerManagementResponse> {
  return apiPost<CreateBrokerManagementResponse>(`/broker-management`, body);
}

/**
 * List brokers from broker-management endpoint
 * GET /broker-management/{marketId}/list
 * @returns Array of brokers (direct array, not wrapped in object)
 */
export interface ListBrokersResponse {
  data: BrokerManagementResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * List brokers from broker-management endpoint
 * GET /broker-management/{marketId}/list
 */
export async function listBrokersViaManagement(
  marketId: string,
  params?: any,
): Promise<ListBrokersResponse> {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
  }
  const query = queryParams.toString();

  // const response = await apiGet<BrokerManagementResponse[]>(`/broker-management/${marketId}/list`);
  const response = await apiGet<{ data: BrokerManagementResponse[]; meta: any }>(
    `/broker-management/list?${query}`,
  );

  // Handle potential legacy array response
  const items = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
      ? response.data
      : [];
  const meta = (response as any)?.meta || {
    total: items.length,
    page: 1,
    limit: 10,
    totalPages: 1,
  };

  return {
    data: items,
    meta: {
      total: Number(meta.total),
      page: Number(meta.page),
      limit: Number(meta.limit),
      totalPages: Number(meta.totalPages),
    },
  };
}

export type UpdateBrokerManagementRequest = Partial<CreateBrokerManagementRequest>;

/**
 * Update a broker via the broker-management endpoint
 * PUT /broker-management/{brokerId}
 */
export async function updateBrokerViaManagement(
  brokerId: string,
  body: UpdateBrokerManagementRequest,
): Promise<CreateBrokerManagementResponse> {
  return apiPatch<CreateBrokerManagementResponse>(`/broker-management/${brokerId}`, body);
}

export interface UpdateBrokerLicenseRequest {
  validityStartDate: string;
  validityEndDate: string;
  licenseNumber: string;
  licenseDocumentId: string;
}

export interface UpdateBrokerLicenseResponseLicense {
  licenseNumber: string;
  validityStart: string;
  validityEnd: string;
  licenseDocumentFileId?: string;
  licenseDocument?: string;
  licenseDocumentUrl?: string;
  licenseDocumentSize?: string;
}

export interface UpdateBrokerLicenseResponse {
  id?: string;
  name?: string;
  license?: UpdateBrokerLicenseResponseLicense;
  [key: string]: unknown;
}

export async function updateBrokerLicense(
  organizationId: string | number,
  body: UpdateBrokerLicenseRequest,
): Promise<UpdateBrokerLicenseResponse> {
  return apiPatch<UpdateBrokerLicenseResponse>(
    `/broker-management/${encodeURIComponent(String(organizationId))}/license`,
    body,
  );
}

// ============================================================================
// LEGACY BROKER DTOs & INTERFACES
// ============================================================================

export interface BrokerDTO {
  id: number | string;
  user_id: number | null;
  admin_user_id: number | null;
  name: string;
  company: string | null;
  license_number: string | null;
  license_start_date: string | null;
  license_end_date: string | null;
  license_doc: string | null;
  company_logo?: string | null;
  operating_countries: string[] | null;
  operating_regions?: { name: string; country: string }[] | null;
  operating_zones?: { name: string; region: string; country: string }[] | null;
  brokerEmail: string | null;
  contactNumber: string | null;
  address: string | null;
  join_date: string | null;
  status: 'active' | 'inactive' | string;
  adminEmail?: string | null;
  adminName?: string | null;
  tenantEmail?: string | null;
  geoCoverage?: any;
  license?: any;
  contact?: any;
  branding?: {
    logoFileUrl?: string | null;
    logoFileName?: string | null;
    logoFileSize?: number | null;
    logoFileType?: string | null;
    brandColor?: string | null;
    metadata?: any;
  };
}

export interface Broker {
  id: number | string;
  name: string;
  email?: string;
  brokerEmail?: string;
  phone?: string;
  contactNumber?: string;
  company?: string;
  licenseNumber?: string;
  licenseStartDate?: string | null;
  licenseEndDate?: string | null;
  joinDate?: string; // ISO string for display
  operatingCountries?: string[];
  operatingRegions?: { name: string; country: string }[];
  operatingZones?: { name: string; region: string; country: string }[];
  companyLogo?: string | null;
  status: 'active' | 'inactive' | string;
  adminEmail?: string;
  adminName?: string;
  tenantEmail?: string;

  // New nested structure from API
  license?: {
    licenseNumber?: string;
    validityStart?: string;
    validityEnd?: string;
    licenseDocumentFileId?: string | null;
    licenseDocument?: string | null;
    licenseDocumentUrl?: string | null;
    licenseDocumentSize?: number | null;
    licenseDocumentType?: string | null;
  };

  contact?: {
    email?: string | null;
    phone?: string;
    adminEmail?: string;
  };

  geoCoverage?: {
    countries?: Array<{
      id: string;
      label: string;
      value: string;
      active: boolean;
      countryId: null;
    }>;
    regions?: Array<{
      id: string;
      label: string;
      value: string;
      active: boolean;
      countryId: null;
      regionId: null;
    }>;
    zones?: Array<{
      id: string;
      label: string;
      value: string;
      active: boolean;
      countryId: null;
      regionId: null;
      zoneId: null;
    }>;
  };
  branding?: {
    logoFileUrl?: string | null;
    logoFileName?: string | null;
    logoFileSize?: number | null;
    logoFileType?: string | null;
    brandColor?: string | null;
    metadata?: any;
  };
}

// Types for Broker Insurers API
export interface QuoteConfig {
  product_id: number;
  validity_days: number;
  backdate_days: number;
  operating_countries: string[];
  operating_regions: string[];
  operating_zones: string[];
}

export interface ProductAssignedDetail {
  product_id: number;
  product_name: string;
  product_type: string;
  description: string;
  is_assigned: boolean;
  quote_config: QuoteConfig;
}

export interface BrokerInsurer {
  insurer_id: number;
  insurer_name: string;
  status: string;
  products_assigned: number;
  product_assigned_details: ProductAssignedDetail[];
}

export interface BrokerInsurersResponse {
  broker: {
    id: number;
    name: string;
  };
  insurers: BrokerInsurer[];
}

function toDateInputString(value: string | null | undefined): string | null {
  if (!value) return null;
  // Expecting ISO-like string; take first 10 chars to match <input type="date">
  return value.slice(0, 10);
}

function mapBroker(dto: BrokerDTO): Broker {
  return {
    id: dto.id,
    name: dto.name || '',
    // Prefer explicit brokerEmail, fall back to tenantEmail
    email: dto.brokerEmail ?? dto.tenantEmail ?? undefined,
    brokerEmail: dto.brokerEmail ?? dto.tenantEmail ?? undefined,
    phone: dto.contactNumber ?? undefined,
    company: dto.company ?? undefined,
    licenseNumber: dto.license_number ?? undefined,
    licenseStartDate: toDateInputString(dto.license_start_date),
    licenseEndDate: toDateInputString(dto.license_end_date),
    joinDate: dto.join_date ?? undefined,
    companyLogo: dto.company_logo ?? null,
    status: dto.status,
    adminName: dto.adminName ? dto.adminName : undefined,
    adminEmail: dto.adminEmail ?? undefined,
    tenantEmail: dto.tenantEmail ?? undefined,
    geoCoverage: dto.geoCoverage,
    license: dto.license,
    contact: dto.contact,
    branding: dto.branding,
  };
}

export async function listBrokers(params?: any): Promise<{ data: Broker[]; meta: any }> {
  type BrokerListResponse = {
    brokers: Array<{
      id: number;
      broker_name: string;
      email: string | null;
      admin_email?: string | null;
      license_no: string | null;
      status: 'active' | 'inactive' | string;
      is_active?: boolean;
      products_assigned?: string | number;
    }>;
    meta?: any;
  };

  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
  }
  const query = queryParams.toString();

  const data = await apiGet<BrokerDTO[] | BrokerListResponse>(`/brokers?${query}`);

  let brokers: Broker[] = [];
  let meta = { total: 0, page: 1, limit: 10, totalPages: 1 };

  if (Array.isArray(data)) {
    brokers = data.map(mapBroker);
    meta.total = brokers.length;
  } else if (data && Array.isArray((data as BrokerListResponse).brokers)) {
    brokers = (data as BrokerListResponse).brokers.map((item) => ({
      id: item.id,
      name: item.broker_name || '',
      email: item.email || undefined,
      phone: undefined,
      company: undefined,
      licenseNumber: item.license_no || undefined,
      licenseStartDate: undefined,
      licenseEndDate: undefined,
      joinDate: undefined,
      operatingCountries: undefined,
      operatingRegions: undefined,
      operatingZones: undefined,
      companyLogo: null,
      status: item.status,
      adminEmail: item.admin_email || undefined,
    }));
    if (data.meta) meta = data.meta;
    else meta.total = brokers.length;
  }

  return { data: brokers, meta };
}

export async function getBroker(brokerId: string | number): Promise<Broker> {
  type WrappedBroker = {
    broker: {
      id: number | string;
      name: string;
      license_number: string | null;
      brokerEmail: string | null;
      contactNumber: string | null;
      company_logo?: string | null;
      operating_countries?: string[] | null;
      operating_regions?: string[] | null; // strings in new response
      operating_zones?: string[] | null; // strings in new response
      license_start_date?: string | null;
      license_end_date?: string | null;
      license_doc?: string | null;
      join_date?: string | null;
      status: 'active' | 'inactive' | string;
      admin_user_id?: number;
      created_at?: string;
      updated_at?: string;
      members_count?: number;
      adminEmail?: string | null;
      adminName?: string | null;
      branding?: {
        logoFileUrl?: string | null;
        logoFileName?: string | null;
        logoFileSize?: number | null;
        logoFileType?: string | null;
        brandColor?: string | null;
        metadata?: any;
      };
    };
    admin_user?: { id: number; name?: string; email?: string; status?: string };
  };

  // const data = await apiGet<BrokerDTO | WrappedBroker>(`/brokers/${encodeURIComponent(String(brokerId))}`);
  const data = await apiGet<BrokerDTO | WrappedBroker>(
    `/broker-management/${encodeURIComponent(String(brokerId))}`,
  );

  // Old shape
  if ((data as any).id !== undefined) {
    return mapBroker(data as BrokerDTO);
  }

  // New wrapped shape
  const wrapped = data as WrappedBroker;
  const b = wrapped.broker;
  const broker: Broker = {
    id: b.id,
    name: b.name || '',
    // Management API may expose broker email as brokerEmail or tenantEmail
    email: (b as any).brokerEmail ?? (b as any).tenantEmail ?? undefined,
    brokerEmail: (b as any).brokerEmail ?? (b as any).tenantEmail ?? undefined,
    tenantEmail: (b as any).tenantEmail ?? undefined,
    phone: b.contactNumber ?? undefined,
    company: undefined,
    licenseNumber: b.license_number ?? undefined,
    licenseStartDate:
      b.license_start_date || null ? (b.license_start_date as string).slice(0, 10) : null,
    licenseEndDate: b.license_end_date || null ? (b.license_end_date as string).slice(0, 10) : null,
    joinDate: b.join_date ?? undefined,
    operatingCountries: b.operating_countries ?? undefined,
    // Normalize regions: handle array of strings OR array of objects
    operatingRegions: Array.isArray(b.operating_regions)
      ? (b.operating_regions as any[]).map((item: any) => {
        if (item && typeof item === 'object' && 'name' in item) {
          return { name: String(item.name), country: String((item as any).country || '') };
        }
        return { name: String(item), country: '' };
      })
      : undefined,
    // Normalize zones: handle array of strings OR array of objects
    operatingZones: Array.isArray(b.operating_zones)
      ? (b.operating_zones as any[]).map((item: any) => {
        if (item && typeof item === 'object' && 'name' in item) {
          return {
            name: String(item.name),
            region: String((item as any).region || ''),
            country: String((item as any).country || ''),
          };
        }
        return { name: String(item), region: '', country: '' };
      })
      : undefined,
    companyLogo: b.company_logo ?? null,
    status: b.status,
    adminEmail: (b as any).adminEmail ?? undefined,
    adminName: (b as any).adminName ?? undefined,
    branding: b.branding,
  };

  return broker;
}

export interface CreateBrokerRequest {
  name: string;
  company?: string | null;
  contact_email: string;
  phone: string;
  address?: string | null;
  license_number: string;
  license_start_date: string | null; // YYYY-MM-DD
  license_end_date: string | null; // YYYY-MM-DD
  license_doc: string | null;
  company_logo?: string | null;
  operating_countries: string[] | null;
  operating_regions?: { name: string; country: string }[] | null;
  operating_zones?: { name: string; region: string; country: string }[] | null;
  admin_email: string;
  admin_password: string;
  join_date: string | null; // YYYY-MM-DD
}

export interface CreateBrokerResponse {
  message: string;
  brokerId: number;
  adminUserId: number;
}

export async function createBroker(body: CreateBrokerRequest): Promise<CreateBrokerResponse> {
  return apiPost<CreateBrokerResponse>('/brokers', body);
}

export type UpdateBrokerRequest = CreateBrokerRequest;

export async function updateBroker(
  brokerId: string | number,
  body: UpdateBrokerRequest,
): Promise<Broker> {
  const data = await apiPut<BrokerDTO>(`/brokers/${encodeURIComponent(String(brokerId))}`, body);
  return mapBroker(data);
}

export interface StatusChangeResponse {
  message?: string;
  status?: 'active' | 'inactive' | string;
}

// export async function activateBroker(brokerId: string | number): Promise<StatusChangeResponse> {
//   return apiPatch<StatusChangeResponse>(
//     `/brokers/${encodeURIComponent(String(brokerId))}/activate`,
//   );
// }
//
// export async function deactivateBroker(brokerId: string | number): Promise<StatusChangeResponse> {
//   return apiPatch<StatusChangeResponse>(
//     `/brokers/${encodeURIComponent(String(brokerId))}/deactivate`,
//   );
// }

export async function setBrokerStatus(
  brokerId: string | number,
  isActive: boolean,
): Promise<StatusChangeResponse> {
  const endpoint = isActive ? 'activate' : 'deactivate';
  return apiPatch<StatusChangeResponse>(
    `/broker-management/${encodeURIComponent(String(brokerId))}/status`,
    { status: isActive ? 'ACTIVE' : 'INACTIVE' },
  );
}

// Get insurers assigned to a broker
export async function getBrokerInsurers(brokerId: string | number): Promise<BrokerInsurersResponse> {
  if (brokerId === undefined || brokerId === null || brokerId === '') {
    throw new Error('Broker ID is required for getting assigned insurers');
  }
  const endpoint = `/brokers/${encodeURIComponent(String(brokerId))}/list-insurers`;
  return apiGet<BrokerInsurersResponse>(endpoint);
}
