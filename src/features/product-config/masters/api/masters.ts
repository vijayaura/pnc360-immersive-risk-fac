import { api, apiGet, apiPatch, apiPost, apiDelete, apiPut } from '@/lib/api/client';

export interface MasterCountryDTO {
  id: number;
  name: string;
  code: string;
  status: string;
  display_order: number;
}

export interface MasterRegionDTO {
  id: number;
  country_id: number;
  name: string;
  status: string;
  display_order: number;
}

export interface MasterZoneDTO {
  id: number;
  region_id: number;
  name: string;
  status: string;
  display_order: number;
}

export interface MasterDataValue {
  id: string;
  valueLabel: string;
  valueCode: string;
  parentValueId: string | null;
  sortOrder: number;
  status: 'active' | 'inactive' | string;
  metadata: any | null;
}

export interface Country {
  id: string;
  value: string;
  label: string;
  code?: string;
  countryId?: string | null;
  active: boolean;
}

export interface RegionValue {
  id: string;
  valueLabel: string; // Example: "Dubai"
  valueCode: string; // Example: "DXB"
  parentValueId: string; // Country ID (links region → country)
  sortOrder: number;
  status: 'active' | 'inactive' | string;
  metadata: any | null;
}
export interface ChildMaster {
  id: string;
  masterKey: string; // "zone" for region → zone mapping
  displayLabel: string;
  description: string | null;
  isHierarchical: boolean;
  parentMasterId: string | null;
  order: number;
  status: 'active' | 'inactive' | string;
}
export interface Region {
  id: string;
  value: string;
  label: string;
  countryId: string;
  active: boolean;
}

export interface ZoneValue {
  id: string;
  valueLabel: string; // Example: "Jumeirah"
  valueCode: string; // Example: "JMR"
  parentValueId: string; // Region ID (links zone → region)
  sortOrder: number;
  status: 'active' | 'inactive' | string;
  metadata: any | null;
}
export interface Zone {
  id: string;
  value: string;
  label: string;
  regionId: string;
  active: boolean;
}

// Additional masters
export interface MasterProjectTypeDTO {
  id: number;
  name: string;
  status: string;
  display_order: number;
}
export interface MasterSubProjectTypeDTO {
  id: number;
  project_type_id: number;
  name: string;
  status: string;
  display_order: number;
}
export interface MasterConstructionTypeDTO {
  id: number;
  name: string;
  status: string;
  display_order: number;
}
export interface MasterRoleTypeDTO {
  id: number;
  display_label: string;
  status: string;
  display_order: number;
}
export interface MasterContractTypeDTO {
  id: number;
  name: string;
  status: string;
  display_order: number;
}
export interface MasterSoilTypeDTO {
  id: number;
  name: string;
  status: string;
  display_order: number;
}
export interface MasterSubcontractorTypeDTO {
  id: number;
  display_label: string;
  status: string;
  display_order: number;
}
export interface MasterConsultantRoleDTO {
  id: number;
  display_label: string;
  status: string;
  display_order: number;
}
export interface MasterSecurityTypeDTO {
  id: number;
  display_label: string;
  status: string;
  display_order: number;
}
export interface MasterAreaTypeDTO {
  id: number;
  display_label: string;
  status: string;
  display_order: number;
}
export interface MasterDocumentTypeDTO {
  id: number;
  display_label: string;
  description?: string;
  required: 'required' | 'optional';
  status: string;
  display_order: number;
}

export interface SimpleMasterItem {
  id: number | string;
  label: string;
  active?: boolean;
  order: number;
}

export interface SubProjectTypeItem extends SimpleMasterItem {
  projectTypeId: number;
}

export interface DocumentTypeItem extends SimpleMasterItem {
  description?: string;
  required?: boolean;
  isRequired?: boolean;
  status?: string;
}

export interface RequiredDocumentItem {
  label: string;
  description?: string;
  isRequired?: boolean;
  status?: string;
}

export interface ProductMasterResponseDto {
  masters: ProductMasterDto[];
}

export interface ProductMasterDto {
  id?: string;
  masterId: string;
  displayLabel: string;
  masterKey: string;
  parentMasterId?: string | null;
  values: ProductMasterValueDto[];
}

export interface ProductMasterValueDto {
  id: string;
  masterId: string;
  valueLabel: string;
  valueCode: string;
  parentValueId: string | null;
  sortOrder: number;
  isActive: boolean;
  metadata: Record<string, unknown> | null;
  createdById: string;
  updatedById: string;
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function listMasterCountries(): Promise<Country[]> {
  const data: any = await apiGet<any>('/global-masters/country');
  const values = data?.values || [];
  // console.log("Fetched Countries RAW:", data);
  return values
    .filter((v) => v.status === 'active')
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((v) => {
      const code = (v.valueCode ?? v.code ?? '').toString().toLowerCase().trim().slice(0, 2);
      return {
        id: v.id,
        value: toSlug(v.valueLabel),
        label: v.valueLabel,
        code: code || undefined,
        countryId: v.parentValueId, // or proper mapping if API uses different field
        active: v.status === 'active',
      };
    });

  // const data = await apiGet<MasterCountryDTO[]>("/admin/master-management/master_countries");
  // return (data || [])
  //   .filter((c) => c.status === "active")
  //   .sort((a, b) => a.display_order - b.display_order)
  //   .map((c) => ({
  //     id: c.id,
  //     value: toSlug(c.name),
  //     label: c.name,
  //     active: c.status === "active",
  //   }));
}

export async function listMasterRegions(): Promise<Region[]> {
  const data: any = await apiGet<any>('/global-masters/region');
  const values = data?.values || [];
  return values
    .filter((r) => r.status === 'active')
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((r) => ({
      id: r.id,
      value: toSlug(r.valueLabel),
      label: r.valueLabel,
      countryId: r.parentValueId,
      active: r.status === 'active',
    }));

  // const data = await apiGet<MasterRegionDTO[]>("/admin/master-management/master_regions");
  // return (data || [])
  //   .filter((r) => r.status === "active")
  //   .sort((a, b) => a.display_order - b.display_order)
  //   .map((r) => ({
  //     id: r.id,
  //     value: toSlug(r.name),
  //     label: r.name,
  //     countryId: r.country_id,
  //     active: r.status === "active",
  //   }));
}

export async function listMasterZones(): Promise<Zone[]> {
  const data: any = await apiGet<any>('/global-masters/zone');
  const values = data?.values || [];
  return values
    .filter((z) => z.status === 'active')
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((z) => ({
      id: z.id,
      value: toSlug(z.valueLabel),
      label: z.valueLabel,
      regionId: z.parentValueId,
      active: z.status === 'active',
    }));

  // const data = await apiGet<MasterZoneDTO[]>("/admin/master-management/master_zones");
  // return (data || [])
  //   .filter((z) => z.status === "active")
  //   .sort((a, b) => a.display_order - b.display_order)
  //   .map((z) => ({
  //     id: z.id,
  //     value: toSlug(z.name),
  //     label: z.name,
  //     regionId: z.region_id,
  //     active: z.status === "active",
  //   }));
}

export interface CurrencyOption {
  value: string;
  label: string;
  symbol?: string;
  decimalPlaces?: number;
}

export async function getCurrencyMasterOptions(): Promise<CurrencyOption[]> {
  const data: any = await apiGet<any>('/global-masters/currency');
  const values = data?.values || [];
  return values
    .filter((v: any) => v.status === 'active')
    .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
    .map((v: any) => ({
      value: v.valueCode,
      label: `${v.valueCode} - ${v.valueLabel}`,
      symbol: v.metadata?.symbol,
      decimalPlaces: v.metadata?.decimalPlaces,
    }));
}

export interface ProductCategoryOption {
  value: string;
  label: string;
}

export async function getProductCategoryMasterOptions(): Promise<ProductCategoryOption[]> {
  const data: any = await apiGet<any>('/global-masters/product_category');
  const values = data?.values || [];

  const uniqueValues = values.filter(
    (v: any, index: number, self: any[]) =>
      index === self.findIndex((t) => t.valueCode === v.valueCode),
  );

  return uniqueValues
    .filter((v: any) => v.status === 'active')
    .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
    .map((v: any) => ({
      value: v.valueCode,
      label: v.valueLabel,
    }));
}

export async function listMasterProjectTypes(): Promise<SimpleMasterItem[]> {
  const data = await apiGet<MasterProjectTypeDTO[]>(
    '/admin/master-management/master_project_types',
  );
  return (data || []).map((it) => ({
    id: it.id,
    label: it.name,
    active: it.status === 'active',
    order: it.display_order,
  }));
}

export async function listMasterSubProjectTypes(): Promise<SubProjectTypeItem[]> {
  const data = await apiGet<MasterSubProjectTypeDTO[]>(
    '/admin/master-management/master_sub_project_types',
  );
  return (data || []).map((it) => ({
    id: it.id,
    projectTypeId: it.project_type_id,
    label: it.name,
    active: it.status === 'active',
    order: it.display_order,
  }));
}

export async function listMasterConstructionTypes(): Promise<SimpleMasterItem[]> {
  const data = await apiGet<MasterConstructionTypeDTO[]>(
    '/admin/master-management/master_construction_types',
  );
  return (data || []).map((it) => ({
    id: it.id,
    label: it.name,
    active: it.status === 'active',
    order: it.display_order,
  }));
}

export async function listMasterRoleTypes(): Promise<SimpleMasterItem[]> {
  const data = await apiGet<MasterRoleTypeDTO[]>('/admin/master-management/master_role_types');
  return (data || []).map((it) => ({
    id: it.id,
    label: it.display_label,
    active: it.status === 'active',
    order: it.display_order,
  }));
}

export async function listMasterContractTypes(): Promise<SimpleMasterItem[]> {
  const data = await apiGet<MasterContractTypeDTO[]>(
    '/admin/master-management/master_contract_types',
  );
  return (data || []).map((it) => ({
    id: it.id,
    label: it.name,
    active: it.status === 'active',
    order: it.display_order,
  }));
}

export async function listMasterSoilTypes(): Promise<SimpleMasterItem[]> {
  const data = await apiGet<MasterSoilTypeDTO[]>('/admin/master-management/master_soil_types');
  return (data || []).map((it) => ({
    id: it.id,
    label: it.name,
    active: it.status === 'active',
    order: it.display_order,
  }));
}

export async function listMasterSubcontractorTypes(): Promise<SimpleMasterItem[]> {
  const data = await apiGet<MasterSubcontractorTypeDTO[]>(
    '/admin/master-management/master_subcontractor_types',
  );
  return (data || []).map((it) => ({
    id: it.id,
    label: it.display_label,
    active: it.status === 'active',
    order: it.display_order,
  }));
}

export async function listMasterConsultantRoles(): Promise<SimpleMasterItem[]> {
  const data = await apiGet<MasterConsultantRoleDTO[]>(
    '/admin/master-management/master_consultant_roles',
  );
  return (data || []).map((it) => ({
    id: it.id,
    label: it.display_label,
    active: it.status === 'active',
    order: it.display_order,
  }));
}

export async function listMasterSecurityTypes(): Promise<SimpleMasterItem[]> {
  const data = await apiGet<MasterSecurityTypeDTO[]>(
    '/admin/master-management/master_security_types',
  );
  return (data || []).map((it) => ({
    id: it.id,
    label: it.display_label,
    active: it.status === 'active',
    order: it.display_order,
  }));
}

export async function listMasterAreaTypes(): Promise<SimpleMasterItem[]> {
  const data = await apiGet<MasterAreaTypeDTO[]>('/admin/master-management/master_area_types');
  return (data || []).map((it) => ({
    id: it.id,
    label: it.display_label,
    active: it.status === 'active',
    order: it.display_order,
  }));
}

export async function listMasterDocumentTypes(): Promise<DocumentTypeItem[]> {
  const data = await apiGet<MasterDocumentTypeDTO[]>(
    '/admin/master-management/master_document_types',
  );
  return (data || []).map((it) => ({
    id: it.id,
    label: it.display_label,
    description: it.description,
    required: it.required === 'required',
    active: it.status === 'active',
    order: it.display_order,
  }));
}

export async function fetchMasterRequiredDocs(productId: string): Promise<DocumentTypeItem[]> {
  return apiGet<DocumentTypeItem[]>(`/product-master-docs/product/${productId}`);
}

export async function addNewMasterDocumentType(
  productId: string,
  body: RequiredDocumentItem,
): Promise<DocumentTypeItem[]> {
  return apiPost<DocumentTypeItem[]>(`/product-master-docs/product/${productId}`, body);
}

export async function updateMasterRequiredDoc(
  documentId: string,
  body: RequiredDocumentItem,
): Promise<DocumentTypeItem[]> {
  return apiPut<DocumentTypeItem[]>(`/product-master-docs/document/${documentId}`, body);
}

export async function deleteMasterRequiredDoc(documentId: string): Promise<DocumentTypeItem[]> {
  return apiDelete<DocumentTypeItem[]>(`/product-master-docs/document/${documentId}`);
}

// Creates
export async function createMasterProjectType(body: {
  name: string;
  status: ActiveStatus;
  display_order: number;
}): Promise<MasterProjectTypeDTO> {
  return apiPost<MasterProjectTypeDTO>('/admin/master-management/master_project_types', body);
}

export async function createMasterSubProjectType(body: {
  project_type_id: number;
  name: string;
  status: ActiveStatus;
  display_order: number;
}): Promise<MasterSubProjectTypeDTO> {
  return apiPost<MasterSubProjectTypeDTO>(
    '/admin/master-management/master_sub_project_types',
    body,
  );
}

export async function createMasterConstructionType(body: {
  name: string;
  status: ActiveStatus;
  display_order: number;
}): Promise<MasterConstructionTypeDTO> {
  return apiPost<MasterConstructionTypeDTO>(
    '/admin/master-management/master_construction_types',
    body,
  );
}

export async function createMasterCountry(body: {
  name: string;
  status: ActiveStatus;
  display_order: number;
  code?: string;
}): Promise<MasterCountryDTO> {
  return apiPost<MasterCountryDTO>('/admin/master-management/master_countries', body);
}

export async function createMasterRegion(body: {
  country_id: number;
  name: string;
  status: ActiveStatus;
  display_order: number;
}): Promise<MasterRegionDTO> {
  return apiPost<MasterRegionDTO>('/admin/master-management/master_regions', body);
}

export async function createMasterZone(body: {
  region_id: number;
  name: string;
  status: ActiveStatus;
  display_order: number;
}): Promise<MasterZoneDTO> {
  return apiPost<MasterZoneDTO>('/admin/master-management/master_zones', body);
}

export async function createMasterRoleType(body: {
  display_label: string;
  status: ActiveStatus;
  display_order: number;
}): Promise<MasterRoleTypeDTO> {
  return apiPost<MasterRoleTypeDTO>('/admin/master-management/master_role_types', body);
}

export async function createMasterContractType(body: {
  name: string;
  status: ActiveStatus;
  display_order: number;
}): Promise<MasterContractTypeDTO> {
  return apiPost<MasterContractTypeDTO>('/admin/master-management/master_contract_types', body);
}

export async function createMasterSoilType(body: {
  name: string;
  status: ActiveStatus;
  display_order: number;
}): Promise<MasterSoilTypeDTO> {
  return apiPost<MasterSoilTypeDTO>('/admin/master-management/master_soil_types', body);
}

export async function createMasterSubcontractorType(body: {
  display_label: string;
  status: ActiveStatus;
  display_order: number;
}): Promise<MasterSubcontractorTypeDTO> {
  return apiPost<MasterSubcontractorTypeDTO>(
    '/admin/master-management/master_subcontractor_types',
    body,
  );
}

export async function createMasterConsultantRole(body: {
  display_label: string;
  status: ActiveStatus;
  display_order: number;
}): Promise<MasterConsultantRoleDTO> {
  return apiPost<MasterConsultantRoleDTO>('/admin/master-management/master_consultant_roles', body);
}

export async function createMasterSecurityType(body: {
  display_label: string;
  status: ActiveStatus;
  display_order: number;
}): Promise<MasterSecurityTypeDTO> {
  return apiPost<MasterSecurityTypeDTO>('/admin/master-management/master_security_types', body);
}

export async function createMasterAreaType(body: {
  display_label: string;
  status: ActiveStatus;
  display_order: number;
}): Promise<MasterAreaTypeDTO> {
  return apiPost<MasterAreaTypeDTO>('/admin/master-management/master_area_types', body);
}

export async function createMasterDocumentType(body: {
  display_label: string;
  description?: string;
  required: 'required' | 'optional';
  status: ActiveStatus;
  display_order: number;
}): Promise<MasterDocumentTypeDTO> {
  return apiPost<MasterDocumentTypeDTO>('/admin/master-management/master_document_types', body);
}

// Imports/Exports
export async function downloadProductMasterTemplate(): Promise<Blob> {
  const response = await api.get('/product-masters/templates/import', {
    responseType: 'blob',
  });
  return response.data;
}

export async function uploadProductMasterTemplate(productId: string, file: File): Promise<void> {
  const formData = new FormData();
  formData.append('file', file);

  await apiPost(`/product-masters/${productId}/imports/excel`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

// Deletes
export interface DeleteResult {
  success: boolean;
}

export async function deleteMasterProjectType(id: number): Promise<DeleteResult> {
  await apiDelete(`/admin/master-management/master_project_types/${id}`);
  return { success: true };
}

export async function deleteMasterSubProjectType(id: number): Promise<DeleteResult> {
  await apiDelete(`/admin/master-management/master_sub_project_types/${id}`);
  return { success: true };
}

export async function deleteMasterConstructionType(id: number): Promise<DeleteResult> {
  await apiDelete(`/admin/master-management/master_construction_types/${id}`);
  return { success: true };
}

export async function deleteMasterCountry(id: number): Promise<DeleteResult> {
  await apiDelete(`/admin/master-management/master_countries/${id}`);
  return { success: true };
}

export async function deleteMasterRegion(id: number): Promise<DeleteResult> {
  await apiDelete(`/admin/master-management/master_regions/${id}`);
  return { success: true };
}

export async function deleteMasterZone(id: number): Promise<DeleteResult> {
  await apiDelete(`/admin/master-management/master_zones/${id}`);
  return { success: true };
}

export async function deleteMasterRoleType(id: number): Promise<DeleteResult> {
  await apiDelete(`/admin/master-management/master_role_types/${id}`);
  return { success: true };
}

export async function deleteMasterContractType(id: number): Promise<DeleteResult> {
  await apiDelete(`/admin/master-management/master_contract_types/${id}`);
  return { success: true };
}

export async function deleteMasterSoilType(id: number): Promise<DeleteResult> {
  await apiDelete(`/admin/master-management/master_soil_types/${id}`);
  return { success: true };
}

export async function deleteMasterSubcontractorType(id: number): Promise<DeleteResult> {
  await apiDelete(`/admin/master-management/master_subcontractor_types/${id}`);
  return { success: true };
}

export async function deleteMasterConsultantRole(id: number): Promise<DeleteResult> {
  await apiDelete(`/admin/master-management/master_consultant_roles/${id}`);
  return { success: true };
}

export async function deleteMasterSecurityType(id: number): Promise<DeleteResult> {
  await apiDelete(`/admin/master-management/master_security_types/${id}`);
  return { success: true };
}

export async function deleteMasterAreaType(id: number): Promise<DeleteResult> {
  await apiDelete(`/admin/master-management/master_area_types/${id}`);
  return { success: true };
}

export async function deleteMasterDocumentType(id: number): Promise<DeleteResult> {
  await apiDelete(`/admin/master-management/master_document_types/${id}`);
  return { success: true };
}

// Updates
export type ActiveStatus = 'active' | 'inactive';

export async function updateMasterProjectType(
  id: number,
  body: { name: string; status: ActiveStatus; display_order: number },
): Promise<MasterProjectTypeDTO> {
  return apiPatch<MasterProjectTypeDTO>(
    `/admin/master-management/master_project_types/${id}`,
    body,
  );
}

export async function updateMasterSubProjectType(
  id: number,
  body: { project_type_id: number; name: string; status: ActiveStatus; display_order: number },
): Promise<MasterSubProjectTypeDTO> {
  return apiPatch<MasterSubProjectTypeDTO>(
    `/admin/master-management/master_sub_project_types/${id}`,
    body,
  );
}

export async function updateMasterConstructionType(
  id: number,
  body: { name: string; status: ActiveStatus; display_order: number },
): Promise<MasterConstructionTypeDTO> {
  return apiPatch<MasterConstructionTypeDTO>(
    `/admin/master-management/master_construction_types/${id}`,
    body,
  );
}

export async function updateMasterCountry(
  id: number,
  body: { name: string; status: ActiveStatus; display_order: number; code?: string },
): Promise<MasterCountryDTO> {
  return apiPatch<MasterCountryDTO>(`/admin/master-management/master_countries/${id}`, body);
}

export async function updateMasterRegion(
  id: number,
  body: { country_id: number; name: string; status: ActiveStatus; display_order: number },
): Promise<MasterRegionDTO> {
  return apiPatch<MasterRegionDTO>(`/admin/master-management/master_regions/${id}`, body);
}

export async function updateMasterZone(
  id: number,
  body: { region_id: number; name: string; status: ActiveStatus; display_order: number },
): Promise<MasterZoneDTO> {
  return apiPatch<MasterZoneDTO>(`/admin/master-management/master_zones/${id}`, body);
}

export async function updateMasterRoleType(
  id: number,
  body: { display_label: string; status: ActiveStatus; display_order: number },
): Promise<MasterRoleTypeDTO> {
  return apiPatch<MasterRoleTypeDTO>(`/admin/master-management/master_role_types/${id}`, body);
}

export async function updateMasterContractType(
  id: number,
  body: { name: string; status: ActiveStatus; display_order: number },
): Promise<MasterContractTypeDTO> {
  return apiPatch<MasterContractTypeDTO>(
    `/admin/master-management/master_contract_types/${id}`,
    body,
  );
}

export async function updateMasterSoilType(
  id: number,
  body: { name: string; status: ActiveStatus; display_order: number },
): Promise<MasterSoilTypeDTO> {
  return apiPatch<MasterSoilTypeDTO>(`/admin/master-management/master_soil_types/${id}`, body);
}

export async function updateMasterSubcontractorType(
  id: number,
  body: { display_label: string; status: ActiveStatus; display_order: number },
): Promise<MasterSubcontractorTypeDTO> {
  return apiPatch<MasterSubcontractorTypeDTO>(
    `/admin/master-management/master_subcontractor_types/${id}`,
    body,
  );
}

export async function updateMasterConsultantRole(
  id: number,
  body: { display_label: string; status: ActiveStatus; display_order: number },
): Promise<MasterConsultantRoleDTO> {
  return apiPatch<MasterConsultantRoleDTO>(
    `/admin/master-management/master_consultant_roles/${id}`,
    body,
  );
}

export async function updateMasterSecurityType(
  id: number,
  body: { display_label: string; status: ActiveStatus; display_order: number },
): Promise<MasterSecurityTypeDTO> {
  return apiPatch<MasterSecurityTypeDTO>(
    `/admin/master-management/master_security_types/${id}`,
    body,
  );
}

export async function updateMasterAreaType(
  id: number,
  body: { display_label: string; status: ActiveStatus; display_order: number },
): Promise<MasterAreaTypeDTO> {
  return apiPatch<MasterAreaTypeDTO>(`/admin/master-management/master_area_types/${id}`, body);
}

export async function updateMasterDocumentType(
  id: number,
  body: {
    display_label: string;
    description?: string;
    required: 'required' | 'optional';
    status: ActiveStatus;
    display_order: number;
  },
): Promise<MasterDocumentTypeDTO> {
  return apiPatch<MasterDocumentTypeDTO>(
    `/admin/master-management/master_document_types/${id}`,
    body,
  );
}

export interface CommonMasterItem {
  id: string;
  displayLabel: string;
  masterKey: string;
  description?: string;
  isHierarchical?: boolean;
  parentMasterId?: string | null;
  values: CommonMasterValueItem[];
  order?: number;
  status?: string;
}

export interface CommonMasterValueItem {
  id: string;
  valueLabel: string;
  valueCode: string;
  parentValueId?: string | null;
  sortOrder: number;
  isActive?: boolean;
  metadata?: Record<string, unknown> | null;
}
export interface CreateProductMasterRequest {
  displayLabel: string;
  masterKey: string;
  order: number;
  options: string;
  parentMasterId?: string;
  isHierarchical?: boolean;
  hierarchicalOptions?: Record<string, string>;
}

export async function createProductMaster(
  productId: string,
  body: CreateProductMasterRequest,
): Promise<ProductMasterDto> {
  return apiPost<ProductMasterDto>(`/product/${productId}/masters`, body);
}

export async function getProductMasters(productId: string): Promise<ProductMasterResponseDto> {
  return apiGet<ProductMasterResponseDto>(`/product/${productId}/masters`);
}

export interface GlobalMasterValueDto {
  id: string;
  valueLabel: string;
  valueCode: string;
  parentValueId?: string | null;
  sortOrder: number;
  status?: string;
  metadata?: any | null;
}

export interface GlobalMasterDto {
  id: string;
  masterKey: string;
  displayLabel: string;
  description?: string | null;
  isHierarchical?: boolean;
  parentMasterId?: string | null;
  order?: number;
  status?: string;
  values?: GlobalMasterValueDto[];
  children?: Partial<GlobalMasterDto>[];
}

export async function getAllGlobalMasters(): Promise<GlobalMasterDto[]> {
  return apiGet<GlobalMasterDto[]>('/global-masters/all');
}

export interface CreateGlobalMasterRequest {
  masterKey: string;
  displayLabel: string;
  description?: string;
  isHierarchical?: boolean;
  parentMasterId?: string;
  order?: number;
  status?: string;
  options?: string;
  hierarchicalOptions?: Record<string, string>;
}

export async function createGlobalMaster(
  data: CreateGlobalMasterRequest,
): Promise<GlobalMasterDto> {
  return apiPost<GlobalMasterDto>('/global-masters', data);
}

export interface UpdateGlobalMasterRequest {
  displayLabel?: string;
  description?: string;
  isHierarchical?: boolean;
  parentMasterId?: string;
  order?: number;
  status?: string;
}

export async function updateGlobalMaster(
  id: string,
  data: UpdateGlobalMasterRequest,
): Promise<GlobalMasterDto> {
  return apiPatch<GlobalMasterDto>(`/global-masters/${id}`, data);
}

export async function deleteGlobalMaster(id: string): Promise<DeleteResult> {
  await apiDelete(`/global-masters/${id}`);
  return { success: true };
}

export interface CreateProductMasterValueRequest {
  masterId: string;
  valueLabel: string;
  valueCode: string;
  parentValueId?: string | null;
  sortOrder: number;
  isActive?: boolean;
  metadata?: Record<string, any> | null;
}

export async function createProductMasterValue(
  data: CreateProductMasterValueRequest,
): Promise<ProductMasterValueDto> {
  return apiPost<ProductMasterValueDto>('product-master-value', data);
}

export interface UpdateProductMasterValueRequest {
  valueLabel?: string;
  valueCode?: string;
  parentValueId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  isDeleted?: boolean;
  metadata?: Record<string, any> | null;
}

export async function updateProductMasterValue(
  id: string,
  data: UpdateProductMasterValueRequest,
): Promise<ProductMasterValueDto> {
  return apiPatch<ProductMasterValueDto>(`product-master-value/${id}`, data);
}

export async function deleteProductMasterValue(id: string): Promise<DeleteResult> {
  await apiDelete(`/product-master-value/${id}`);
  return { success: true };
}

export interface CreateGlobalMasterValueRequest {
  globalMasterId: string;
  valueLabel: string;
  valueCode: string;
  parentValueId?: string | null;
  sortOrder: number;
  status?: string;
  metadata?: Record<string, unknown> | null;
}

export async function createGlobalMasterValue(
  data: CreateGlobalMasterValueRequest,
): Promise<GlobalMasterValueDto> {
  return apiPost<GlobalMasterValueDto>('/global-masters/values', data);
}

export interface UpdateGlobalMasterValueRequest {
  valueLabel?: string;
  valueCode?: string;
  parentValueId?: string | null;
  sortOrder?: number;
  status?: string;
  metadata?: Record<string, unknown> | null;
}

export async function updateGlobalMasterValue(
  id: string,
  data: UpdateGlobalMasterValueRequest,
): Promise<GlobalMasterValueDto> {
  return apiPatch<GlobalMasterValueDto>(`/global-masters/values/${id}`, data);
}

export async function deleteGlobalMasterValue(id: string): Promise<DeleteResult> {
  await apiDelete(`/global-masters/values/${id}`);
  return { success: true };
}

// ============================================
// Global Master Import to Product Master APIs
// ============================================

export interface AvailableGlobalMasterDto {
  id: string;
  masterKey: string;
  displayLabel: string;
  valuesCount: number;
  alreadyImported: boolean;
}

export interface ImportGlobalMasterRequest {
  globalMasterId: string;
}

export interface ImportGlobalMasterResponse {
  success: boolean;
  productMaster: {
    id: string;
    productId: string;
    masterKey: string;
    displayLabel: string;
    sourceType: 'global' | 'custom';
    sourceGlobalMasterId: string;
  };
  valuesCreated: number;
}

/**
 * Get list of Global Masters available for import to a product.
 * Returns import status (alreadyImported) for each.
 */
export async function getAvailableGlobalMasters(
  productId: string,
): Promise<AvailableGlobalMasterDto[]> {
  return apiGet<AvailableGlobalMasterDto[]>(
    `/product-masters/${productId}/available-global-masters`,
  );
}

/**
 * Import a Global Master into a Product Master.
 * Creates a copy with gm_ prefix on masterKey.
 * One-way: changes to Product Master don't affect Global Master.
 */
export async function importGlobalMaster(
  productId: string,
  globalMasterId: string,
): Promise<ImportGlobalMasterResponse> {
  return apiPost<ImportGlobalMasterResponse>(`/product-masters/${productId}/imports/global`, {
    globalMasterId,
  });
}
