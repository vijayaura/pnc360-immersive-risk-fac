import { apiGet, apiPost, apiPatch } from '@/lib/api/client';

// ---------------------------------------------------------------------------
// Public UI types (used by pages and components)
// ---------------------------------------------------------------------------

export interface ReinsurerGradeValue {
  id: string;
  valueLabel: string;
  valueCode: string;
  sortOrder: number;
  status: string;
}

export interface Reinsurer {
  id: string;
  name: string;
  gradeId?: string;
  grade?: string; // human-readable label — populated from grade master cache by list page
  licenseNumber?: string;
  email?: string;
  phone?: string;
  address?: string;
  operatingCountries?: string[]; // labels only — for display
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

export interface ListReinsurersResponse {
  data: Reinsurer[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateReinsurerRequest {
  name: string;
  gradeId: string;
  licenseNumber?: string;
  contactEmail?: string;
  phone?: string;
  address?: string;
  companyLogo?: string | null;
  companyLogoId?: string | null;
  operatingCountries?: Array<{ id: string; value: string; label: string; active: boolean }>;
  operatingRegions?: Array<{ id: string; value: string; label: string; countryId: string; active: boolean }>;
  operatingZones?: Array<{ id: string; value: string; label: string; regionId: string; active: boolean }>;
  adminEmail: string;
  adminName: string;
  adminPassword: string;
}

export interface UpdateReinsurerRequest {
  name: string;
  gradeId: string;
  licenseNumber?: string;
  contactEmail?: string;
  phone?: string;
  address?: string;
  companyLogo?: string | null;
  companyLogoId?: string | null;
  operatingCountries?: Array<{ id: string; value: string; label: string; active: boolean }>;
  operatingRegions?: Array<{ id: string; value: string; label: string; countryId: string; active: boolean }>;
  operatingZones?: Array<{ id: string; value: string; label: string; regionId: string; active: boolean }>;
  adminEmail?: string;
  adminName?: string;
  adminPassword?: string;
}

export interface UploadReinsurerLogoResponse {
  logoFileId: string;
  logoUrl: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Backend DTO types (internal — match ReinsurerResponseDto from API docs)
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

interface ReinsurerDTO {
  id: string;
  name: string;
  adminEmail: string;
  adminName: string;
  contactEmail?: string;
  phone?: string;
  address?: string;
  gradeId?: string;
  description?: string;
  status: string; // "ACTIVE" | "INACTIVE"
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

interface ListReinsurersDTOResponse {
  data: ReinsurerDTO[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface GradeMasterResponse {
  id: string;
  masterKey: string;
  displayLabel: string;
  isHierarchical: boolean;
  order: number;
  status: string;
  values: ReinsurerGradeValue[];
}

// ---------------------------------------------------------------------------
// Mapper: backend DTO → UI type
// ---------------------------------------------------------------------------

function mapReinsurer(dto: ReinsurerDTO): Reinsurer {
  return {
    id: dto.id,
    name: dto.name,
    gradeId: dto.gradeId,
    // grade label is not in the response — list page resolves it from the grade master cache
    grade: undefined,
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

export async function listReinsurerGrades(): Promise<ReinsurerGradeValue[]> {
  const res = await apiGet<GradeMasterResponse>('/global-masters/reinsurer_grade');
  return res.values || [];
}

export async function listReinsurers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}): Promise<ListReinsurersResponse> {
  const query: Record<string, string | number> = {
    page: params?.page ?? 1,
    limit: params?.limit ?? 10,
  };
  if (params?.search) query.search = params.search;
  // backend expects uppercase: "ACTIVE" | "INACTIVE"
  if (params?.status) query.status = params.status.toUpperCase();

  const res = await apiGet<ListReinsurersDTOResponse>('/reinsurer-management/list', query);
  return {
    data: (res.data || []).map(mapReinsurer),
    meta: res.meta,
  };
}

export async function getReinsurer(reinsurerMapId: string): Promise<Reinsurer> {
  const dto = await apiGet<ReinsurerDTO>(`/reinsurer-management/${reinsurerMapId}`);
  return mapReinsurer(dto);
}

export async function createReinsurer(body: CreateReinsurerRequest): Promise<{ message: string; id?: string }> {
  const res = await apiPost<{ message: string; reinsurer?: { id: string } }>('/reinsurer-management', {
    name: body.name,
    gradeId: body.gradeId,
    licenseNumber: body.licenseNumber,
    contactEmail: body.contactEmail,
    phone: body.phone,
    address: body.address,
    companyLogo: body.companyLogo,
    companyLogoId: body.companyLogoId,
    operatingCountries: body.operatingCountries,
    operatingRegions: body.operatingRegions,
    operatingZones: body.operatingZones,
    adminEmail: body.adminEmail,
    adminName: body.adminName,
    adminPassword: body.adminPassword,
    status: 'ACTIVE',
  });
  return { message: res.message, id: res.reinsurer?.id };
}

export async function updateReinsurer(
  reinsurerMapId: string,
  body: UpdateReinsurerRequest,
): Promise<{ message: string }> {
  const payload: Record<string, unknown> = {
    name: body.name,
    gradeId: body.gradeId,
    licenseNumber: body.licenseNumber,
    contactEmail: body.contactEmail,
    phone: body.phone,
    address: body.address,
    companyLogo: body.companyLogo,
    companyLogoId: body.companyLogoId,
    operatingCountries: body.operatingCountries,
    operatingRegions: body.operatingRegions,
    operatingZones: body.operatingZones,
    adminEmail: body.adminEmail,
    adminName: body.adminName,
  };
  // only send adminPassword when user explicitly provided a new one
  if (body.adminPassword) {
    payload.adminPassword = body.adminPassword;
  }
  await apiPatch<ReinsurerDTO>(`/reinsurer-management/${reinsurerMapId}`, payload);
  return { message: 'Reinsurer updated successfully' };
}

export async function setReinsurerStatus(reinsurerMapId: string, isActive: boolean): Promise<{ message: string }> {
  await apiPatch<ReinsurerDTO>(`/reinsurer-management/${reinsurerMapId}/status`, {
    status: isActive ? 'ACTIVE' : 'INACTIVE',
  });
  return { message: `Reinsurer ${isActive ? 'activated' : 'deactivated'} successfully` };
}

export async function uploadReinsurerLogoFile(formData: FormData): Promise<UploadReinsurerLogoResponse> {
  // FormData fields (set by caller): file (File), key (string e.g. "companyLogo")
  // Follows the same pattern as broker-management/upload which uses the same file+key convention.
  // Response shape mirrors BrokerFileUploadResponse: { url, fileId, key, message }
  const res = await apiPost<{ message: string; url?: string; fileId?: string; key?: string }>(
    '/reinsurer-management/upload',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return {
    logoFileId: res.fileId ?? '',
    logoUrl: res.url ?? '',
    message: res.message,
  };
}
