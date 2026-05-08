import { apiGet, apiPost, apiPatch } from '@/lib/api/client';

// ---------------------------------------------------------------------------
// Public UI types (used by pages and components)
// ---------------------------------------------------------------------------

export interface ReinsuranceBroker {
  id: string;
  name: string;
  isDirect: boolean;
  licenseNumber?: string;
  email?: string;
  phone?: string;
  address?: string;
  operatingCountries?: string[];
  operatingRegions?: { name: string; country: string }[];
  operatingZones?: { name: string; region: string; country: string }[];
  geoCoverage?: {
    countries: Array<{ id: string; value: string; label: string }>;
    regions: Array<{ id: string; value: string; label: string; countryId?: string }>;
    zones: Array<{ id: string; value: string; label: string; regionId?: string }>;
  };
  companyLogo?: string | null;
  status: 'active' | 'inactive' | string;
  adminEmail?: string;
  adminName?: string;
}

export interface ListReinsuranceBrokersResponse {
  data: ReinsuranceBroker[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateReinsuranceBrokerRequest {
  name: string;
  licenseNumber?: string;
  contactEmail?: string;
  phone?: string;
  address?: string;
  isDirect?: boolean;
  companyLogo?: string | null;
  companyLogoId?: string | null;
  operatingCountries?: Array<{ id: string; value: string; label: string; active: boolean }>;
  operatingRegions?: Array<{ id: string; value: string; label: string; countryId: string; active: boolean }>;
  operatingZones?: Array<{ id: string; value: string; label: string; regionId: string; active: boolean }>;
  adminEmail?: string;
  adminName?: string;
}

export interface UpdateReinsuranceBrokerRequest {
  name: string;
  licenseNumber?: string;
  contactEmail?: string;
  phone?: string;
  address?: string;
  isDirect?: boolean;
  companyLogo?: string | null;
  companyLogoId?: string | null;
  operatingCountries?: Array<{ id: string; value: string; label: string; active: boolean }>;
  operatingRegions?: Array<{ id: string; value: string; label: string; countryId: string; active: boolean }>;
  operatingZones?: Array<{ id: string; value: string; label: string; regionId: string; active: boolean }>;
  adminEmail?: string;
  adminName?: string;
}

export interface UploadReinsuranceBrokerLogoResponse {
  logoFileId: string;
  logoUrl: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Backend DTO types (internal)
// ---------------------------------------------------------------------------

interface OperatingLocationDto {
  id: string;
  value: string;
  label: string;
  countryId?: string;
  regionId?: string;
  zoneId?: string;
  active?: boolean;
}

interface ReinsuranceBrokerDTO {
  id: string;
  name: string;
  adminEmail: string;
  adminName: string;
  contactEmail?: string;
  phone?: string;
  address?: string;
  isDirect: boolean;
  status: string;
  licenseNumber?: string;
  createdAt: string;
  updatedAt: string;
  contact?: {
    email?: string;
    phone?: string;
    address?: string;
    adminEmail?: string;
  };
  license?: {
    licenseNumber?: string;
    validityStart?: string;
    validityEnd?: string;
    licenseDocumentFileId?: string;
    licenseDocumentSize?: number;
  };
  branding?: {
    logoFileUrl?: string;
    logoFileName?: string;
    logoFileSize?: number;
    brandColor?: string;
  };
  geoCoverage?: {
    countries: OperatingLocationDto[];
    regions: OperatingLocationDto[];
    zones: OperatingLocationDto[];
  };
}

interface ListReinsuranceBrokersDTOResponse {
  data: ReinsuranceBrokerDTO[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ---------------------------------------------------------------------------
// Mapper: backend DTO → UI type
// ---------------------------------------------------------------------------

function mapReinsuranceBroker(dto: ReinsuranceBrokerDTO): ReinsuranceBroker {
  return {
    id: dto.id,
    name: dto.name,
    isDirect: dto.isDirect ?? false,
    licenseNumber: dto.licenseNumber ?? dto.license?.licenseNumber,
    email: dto.contactEmail ?? dto.contact?.email,
    phone: dto.phone ?? dto.contact?.phone,
    address: dto.address ?? dto.contact?.address,
    operatingCountries: dto.geoCoverage?.countries?.map((c) => c.label),
    operatingRegions: dto.geoCoverage?.regions?.map((r) => ({ name: r.label, country: '' })),
    operatingZones: dto.geoCoverage?.zones?.map((z) => ({ name: z.label, region: '', country: '' })),
    geoCoverage: dto.geoCoverage
      ? {
          countries: (dto.geoCoverage.countries || []).map((c) => ({
            id: c.id,
            value: c.value,
            label: c.label,
          })),
          regions: (dto.geoCoverage.regions || []).map((r) => ({
            id: r.id,
            value: r.value,
            label: r.label,
            countryId: r.countryId,
          })),
          zones: (dto.geoCoverage.zones || []).map((z) => ({
            id: z.id,
            value: z.value,
            label: z.label,
            regionId: z.regionId,
          })),
        }
      : undefined,
    companyLogo: dto.branding?.logoFileUrl ?? null,
    status: (dto.status ?? '').toLowerCase() as 'active' | 'inactive',
    adminEmail: dto.adminEmail ?? dto.contact?.adminEmail,
    adminName: dto.adminName,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function listReinsuranceBrokers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}): Promise<ListReinsuranceBrokersResponse> {
  const query: Record<string, string | number> = {
    page: params?.page ?? 1,
    limit: params?.limit ?? 10,
  };
  if (params?.search) query.search = params.search;
  if (params?.status) query.status = params.status.toUpperCase();

  const res = await apiGet<ListReinsuranceBrokersDTOResponse>('/reinsurance-broker-management/list', query);
  return {
    data: (res.data || []).map(mapReinsuranceBroker),
    meta: res.meta,
  };
}

export async function getReinsuranceBroker(brokerId: string): Promise<ReinsuranceBroker> {
  const dto = await apiGet<ReinsuranceBrokerDTO>(`/reinsurance-broker-management/${brokerId}`);
  return mapReinsuranceBroker(dto);
}

export async function createReinsuranceBroker(
  body: CreateReinsuranceBrokerRequest,
): Promise<{ message: string; id?: string }> {
  const res = await apiPost<{ message: string; reinsuranceBroker?: { id: string } }>(
    '/reinsurance-broker-management',
    {
      name: body.name,
      licenseNumber: body.licenseNumber,
      contactEmail: body.contactEmail,
      phone: body.phone,
      address: body.address,
      isDirect: body.isDirect,
      companyLogo: body.companyLogo,
      companyLogoId: body.companyLogoId,
      operatingCountries: body.operatingCountries,
      operatingRegions: body.operatingRegions,
      operatingZones: body.operatingZones,
      adminEmail: body.adminEmail,
      adminName: body.adminName,
      status: 'ACTIVE',
    },
  );
  return { message: res.message, id: res.reinsuranceBroker?.id };
}

export async function updateReinsuranceBroker(
  brokerId: string,
  body: UpdateReinsuranceBrokerRequest,
): Promise<{ message: string }> {
  const payload: Record<string, unknown> = {
    name: body.name,
    licenseNumber: body.licenseNumber,
    contactEmail: body.contactEmail,
    phone: body.phone,
    address: body.address,
    isDirect: body.isDirect,
    companyLogo: body.companyLogo,
    companyLogoId: body.companyLogoId,
    operatingCountries: body.operatingCountries,
    operatingRegions: body.operatingRegions,
    operatingZones: body.operatingZones,
    adminEmail: body.adminEmail,
    adminName: body.adminName,
  };
  await apiPatch<ReinsuranceBrokerDTO>(`/reinsurance-broker-management/${brokerId}`, payload);
  return { message: 'Reinsurance broker updated successfully' };
}

export async function setReinsuranceBrokerStatus(
  brokerId: string,
  isActive: boolean,
): Promise<{ message: string }> {
  await apiPatch<ReinsuranceBrokerDTO>(`/reinsurance-broker-management/${brokerId}/status`, {
    status: isActive ? 'ACTIVE' : 'INACTIVE',
  });
  return { message: `Reinsurance broker ${isActive ? 'activated' : 'deactivated'} successfully` };
}

export async function uploadReinsuranceBrokerLogoFile(
  formData: FormData,
): Promise<UploadReinsuranceBrokerLogoResponse> {
  const res = await apiPost<{ message: string; url?: string; fileId?: string; key?: string }>(
    '/reinsurance-broker-management/upload',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return {
    logoFileId: res.fileId ?? '',
    logoUrl: res.url ?? '',
    message: res.message,
  };
}
