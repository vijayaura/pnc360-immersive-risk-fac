import { apiGet, apiPost, apiPatch, apiPut, apiDelete } from '@/lib/api/client';

export interface PolicyWording {
  label: string;
  url: string; // Direct URL for downloading the document
  is_active: boolean;
}

export interface GetPolicyWordingsResponse {
  wordings: PolicyWording[];
}

export async function getPolicyWordings(
  insurerId: number | string,
  productId: number | string,
): Promise<GetPolicyWordingsResponse> {
  const ts = Date.now();
  return apiGet<GetPolicyWordingsResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/policy-wordings?t=${ts}`,
  );
}

// Upload Policy Wording (multipart/form-data)
export interface UploadPolicyWordingResponse {
  message?: string;
  wording?: PolicyWording;
}

export interface UploadPolicyWordingParams {
  product_id: string; // e.g. "1"
  label: string; // e.g. "Professional Liability Policy Wording v2.1"
  is_active: string; // boolean string: "true" | "false"
  document: File; // PDF file
}

export async function uploadPolicyWording(
  insurerId: number | string,
  productId: number | string,
  params: UploadPolicyWordingParams,
): Promise<UploadPolicyWordingResponse> {
  const form = new FormData();
  form.append('product_id', params.product_id);
  form.append('label', params.label);
  form.append('is_active', params.is_active);
  form.append('document', params.document);

  return apiPost<UploadPolicyWordingResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/policy-wordings`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
}

// New JSON-based Policy Wordings API
export interface PolicyWordingRequest {
  wordings: Array<{
    label: string;
    url: string;
    is_active: boolean;
  }>;
}

export interface PolicyWordingResponse {
  wordings: PolicyWording[];
}

export async function savePolicyWordings(
  insurerId: number | string,
  productId: number | string,
  params: PolicyWordingRequest,
): Promise<PolicyWordingResponse> {
  return apiPost<PolicyWordingResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/policy-wordings`,
    params,
  );
}

// Wording Configurator (Product-scoped)
export interface TemplateFileDto {
  id: string;
  url: string;
  fileName: string;
  contentType: string;
  size: number;
  s3Key?: string;
  s3Bucket?: string;
}

export interface DocumentTypeItemDto {
  displayLabel: string;
  description?: string;
  displayOrder: number;
  isRequired: boolean;
  isActive: boolean;
  templateFile?: TemplateFileDto;
}

export interface SaveWordingConfigurationRequest {
  documentTypes: DocumentTypeItemDto[];
}

export interface WordingConfigurationResponse {
  id: string;
  productId: string;
  organizationId: string;
  marketUserId: string;
  documentTypes: DocumentTypeItemDto[];
  version: number;
  createdById: string;
  updatedById?: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getWordingConfigurator(
  productId: number | string,
): Promise<WordingConfigurationResponse> {
  return apiGet<WordingConfigurationResponse>(
    `/wording-configurator/product/${encodeURIComponent(String(productId))}`,
  );
}

export async function saveWordingConfigurator(
  productId: number | string,
  body: SaveWordingConfigurationRequest,
  files: File[] = [],
): Promise<WordingConfigurationResponse> {
  const form = new FormData();
  (body.documentTypes || []).forEach((item, idx) => {
    form.append(`documentTypes[${idx}][displayLabel]`, item.displayLabel);
    form.append(`documentTypes[${idx}][description]`, item.description ?? '');
    form.append(`documentTypes[${idx}][displayOrder]`, String(item.displayOrder));
    form.append(`documentTypes[${idx}][isRequired]`, String(item.isRequired));
    form.append(`documentTypes[${idx}][isActive]`, String(item.isActive));
  });
  for (const f of files) {
    form.append('files', f);
  }
  return apiPost<WordingConfigurationResponse>(
    `/wording-configurator/product/${encodeURIComponent(String(productId))}`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
}

// Wording CRUD (aligned with controller)
export interface WordingDocumentTypeResponseItem {
  id: string;
  productId: string;
  organizationId: string;
  marketUserId: string;
  templateFile: string | null;
  originalFilename: string | null;
  displayLabel: string;
  description?: string;
  displayOrder: number;
  isRequired: boolean;
  isActive: boolean;
  version: number;
  createdById: string;
  updatedById?: string | null;
  createdAt: string;
  updatedAt: string;
  fileSize?: number;
}

export interface AddWordingDocumentTypeParams {
  displayLabel: string;
  description?: string;
  isRequired: boolean;
  isActive: boolean;
}

export interface UpdateWordingDocumentTypeParams {
  displayLabel?: string;
  description?: string;
  isRequired?: boolean;
  isActive?: boolean;
}

export async function getWordingDocumentTypes(
  productId: number | string,
): Promise<WordingDocumentTypeResponseItem[]> {
  return apiGet<WordingDocumentTypeResponseItem[]>(
    `/wording-configurator/product/${encodeURIComponent(String(productId))}`,
  );
}

export async function addWordingDocumentType(
  productId: number | string,
  params: AddWordingDocumentTypeParams,
  templateFile?: File,
): Promise<WordingDocumentTypeResponseItem[]> {
  const form = new FormData();
  form.append('displayLabel', params.displayLabel);
  if (typeof params.description === 'string') {
    form.append('description', params.description);
  }
  form.append('isRequired', String(!!params.isRequired));
  form.append('isActive', String(!!params.isActive));
  if (templateFile instanceof File) {
    form.append('templateFile', templateFile);
  }
  return apiPost<WordingDocumentTypeResponseItem[]>(
    `/wording-configurator/product/${encodeURIComponent(String(productId))}/document`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
}

export async function updateWordingDocumentType(
  productId: number | string,
  documentTypeId: number | string,
  params: UpdateWordingDocumentTypeParams,
  templateFile?: File,
): Promise<WordingDocumentTypeResponseItem[]> {
  const form = new FormData();
  if (typeof params.displayLabel === 'string') {
    form.append('displayLabel', params.displayLabel);
  }
  if (typeof params.description === 'string') {
    form.append('description', params.description);
  }
  if (typeof params.isRequired === 'boolean') {
    form.append('isRequired', String(params.isRequired));
  }
  if (typeof params.isActive === 'boolean') {
    form.append('isActive', String(params.isActive));
  }
  if (templateFile instanceof File) {
    form.append('templateFile', templateFile);
  }
  return apiPut<WordingDocumentTypeResponseItem[]>(
    `/wording-configurator/product/${encodeURIComponent(
      String(productId),
    )}/document/${encodeURIComponent(String(documentTypeId))}`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
}

export async function deleteWordingConfiguration(
  productId: number | string,
): Promise<{ message: string }> {
  return apiDelete<{ message: string }>(
    `/wording-configurator/product/${encodeURIComponent(String(productId))}`,
  );
}

export async function deleteWordingDocumentType(
  productId: number | string,
  documentTypeId: number | string,
): Promise<WordingDocumentTypeResponseItem[]> {
  return apiDelete<WordingDocumentTypeResponseItem[]>(
    `/wording-configurator/product/${encodeURIComponent(
      String(productId),
    )}/document/${encodeURIComponent(String(documentTypeId))}`,
  );
}

export async function deleteWordingTemplateFile(
  productId: number | string,
  documentTypeId: number | string,
): Promise<WordingDocumentTypeResponseItem[]> {
  return apiDelete<WordingDocumentTypeResponseItem[]>(
    `/wording-configurator/product/${encodeURIComponent(
      String(productId),
    )}/document/${encodeURIComponent(String(documentTypeId))}/file`,
  );
}

export async function getWordingTemplateSignedUrl(
  productId: number | string,
  documentTypeId: number | string,
): Promise<{ signedUrl: string; expiresIn: number }> {
  return apiGet<{ signedUrl: string; expiresIn: number }>(
    `/wording-configurator/product/${encodeURIComponent(
      String(productId),
    )}/document/${encodeURIComponent(String(documentTypeId))}/file`,
  );
}
// Update Policy Wording (multipart/form-data, all fields optional)
export interface UpdatePolicyWordingParams {
  label?: string;
  is_active?: string; // "true" | "false"
  document?: File; // optional
}

export interface UpdatePolicyWordingResponse {
  message?: string;
  wording?: PolicyWording;
}

export async function updatePolicyWording(
  insurerId: number | string,
  productId: number | string,
  wordingId: number | string,
  params: UpdatePolicyWordingParams,
): Promise<UpdatePolicyWordingResponse> {
  const form = new FormData();
  if (typeof params.label === 'string') form.append('label', params.label);
  if (typeof params.is_active === 'string') form.append('is_active', params.is_active);
  if (params.document instanceof File) form.append('document', params.document);

  return apiPatch<UpdatePolicyWordingResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/policy-wordings/${encodeURIComponent(String(wordingId))}`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
}

// Quote Format