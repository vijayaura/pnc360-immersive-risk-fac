import { apiGet, apiPost, apiPatch, apiPut, apiDelete } from '@/lib/api/client';

export interface RequiredDocumentDTO {
  id: number;
  product_id: number;
  display_order: number;
  label: string; // Updated from display_label to match new API
  display_label?: string; // Keep for backward compatibility
  description: string | null;
  is_required: boolean;
  status: string; // 'active' | 'inactive'
  url: string | null; // Updated from template_file_url to match new API
  template_file_url?: string | null; // Keep for backward compatibility
}

export interface GetRequiredDocumentsResponse {
  documents: RequiredDocumentDTO[];
}

// New product-level required document response (one-per-row)
export interface ProductRequiredDocumentItem {
  id: string;
  productId: string;
  organizationId: string;
  marketUserId: string;
  templateFile: string | null;
  originalFilename: string | null;
  displayLabel: string;
  description?: string | null;
  displayOrder: number;
  isRequired: boolean;
  isActive: boolean;
  aiQuestionValidation?: boolean;
  validationQuestions?: Array<{
    id?: string;
    question: string;
    [key: string]: unknown;
  }>;
  referToUnderWrtiterAllowed?: boolean;
  version: number;
  createdById: string;
  updatedById?: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getProductRequiredDocuments(
  productId: number | string,
): Promise<ProductRequiredDocumentItem[]> {
  return apiGet<ProductRequiredDocumentItem[]>(
    `/required-document/product/${encodeURIComponent(String(productId))}`,
  );
}

export async function getRequiredDocuments(
  insurerId: number | string,
  productId: number | string,
): Promise<GetRequiredDocumentsResponse> {
  const ts = Date.now();
  return apiGet<GetRequiredDocumentsResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/required-documents?t=${ts}`,
  );
}

export interface CreateRequiredDocumentParams {
  display_order?: number;
  display_label: string;
  description?: string;
  is_required: boolean | string;
  is_active: boolean;
  ai_question_validation?: boolean;
  validation_questions?: Array<{
    id?: string;
    question: string;
  }>;
  refer_to_under_wrtiter_allowed?: boolean;
  template_file?: File | null;
}

export interface CreateRequiredDocumentResponse {
  message?: string;
  document?: RequiredDocumentDTO;
}

export async function saveProductRequiredDocument(
  productId: number | string,
  params: CreateRequiredDocumentParams,
): Promise<ProductRequiredDocumentItem[]> {
  const form = new FormData();
  form.append('displayLabel', params.display_label);
  form.append('description', params.description ?? '');
  form.append(
    'isRequired',
    String(
      typeof params.is_required === 'string' ? params.is_required === 'true' : !!params.is_required,
    ),
  );
  form.append('isActive', String(!!params.is_active));
  if (params.ai_question_validation !== undefined) {
    form.append('aiQuestionValidation', String(!!params.ai_question_validation));
  }
  if (params.validation_questions !== undefined) {
    form.append('validationQuestions', JSON.stringify(params.validation_questions));
  }
  if (params.refer_to_under_wrtiter_allowed !== undefined) {
    form.append(
      'referToUnderWrtiterAllowed',
      String(!!params.refer_to_under_wrtiter_allowed),
    );
  }
  if (params.template_file instanceof File) {
    form.append('templateFile', params.template_file);
  }
  return apiPost<ProductRequiredDocumentItem[]>(
    `/required-document/product/${encodeURIComponent(String(productId))}/document`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
}

// Deprecated legacy insurer path - use product-level functions above

export interface UpdateRequiredDocumentParams {
  display_label?: string;
  description?: string;
  is_required?: boolean;
  is_active?: boolean;
  ai_question_validation?: boolean;
  validation_questions?: Array<{
    id?: string;
    question: string;
  }>;
  refer_to_under_wrtiter_allowed?: boolean;
  template_file?: File | null;
}

export interface UpdateRequiredDocumentResponse {
  message: string;
  document: {
    id: number;
    product_id: number;
    display_order: number;
    display_label: string;
    description: string;
    is_required: number; // 0 or 1
    template_file: string | null;
    status: string; // 'ACTIVE' | 'INACTIVE'
    created_at: string;
    updated_at: string;
    insurer_id: number;
  };
}

export async function updateProductRequiredDocument(
  productId: number | string,
  documentId: string,
  params: UpdateRequiredDocumentParams,
): Promise<ProductRequiredDocumentItem[]> {
  const form = new FormData();
  if (params.display_label !== undefined) form.append('displayLabel', params.display_label);
  if (params.description !== undefined) form.append('description', params.description || '');
  if (params.is_required !== undefined) form.append('isRequired', String(!!params.is_required));
  if (params.is_active !== undefined) form.append('isActive', String(!!params.is_active));
  if (params.ai_question_validation !== undefined) {
    form.append('aiQuestionValidation', String(!!params.ai_question_validation));
  }
  if (params.validation_questions !== undefined) {
    form.append('validationQuestions', JSON.stringify(params.validation_questions));
  }
  if (params.refer_to_under_wrtiter_allowed !== undefined) {
    form.append(
      'referToUnderWrtiterAllowed',
      String(!!params.refer_to_under_wrtiter_allowed),
    );
  }
  if (params.template_file instanceof File) {
    form.append('templateFile', params.template_file);
  }
  return apiPut<ProductRequiredDocumentItem[]>(
    `/required-document/product/${encodeURIComponent(
      String(productId),
    )}/document/${encodeURIComponent(String(documentId))}`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
}

export async function deleteProductRequiredDocument(
  productId: number | string,
  documentId: string,
): Promise<ProductRequiredDocumentItem[]> {
  return apiDelete<ProductRequiredDocumentItem[]>(
    `/required-document/product/${encodeURIComponent(
      String(productId),
    )}/document/${encodeURIComponent(String(documentId))}`,
  );
}

export async function deleteProductRequiredDocumentTemplate(
  productId: number | string,
  documentId: string,
): Promise<ProductRequiredDocumentItem[]> {
  return apiDelete<ProductRequiredDocumentItem[]>(
    `/required-document/product/${encodeURIComponent(
      String(productId),
    )}/document/${encodeURIComponent(String(documentId))}/template`,
  );
}

export async function deleteProductRequiredDocumentValidationQuestion(
  productId: number | string,
  documentId: string,
  questionId: string,
): Promise<ProductRequiredDocumentItem[]> {
  return apiDelete<ProductRequiredDocumentItem[]>(
    `/required-document/product/${encodeURIComponent(
      String(productId),
    )}/document/${encodeURIComponent(
      String(documentId),
    )}/validation-question/${encodeURIComponent(String(questionId))}`,
  );
}

export async function getProductRequiredDocumentSignedUrl(
  productId: number | string,
  documentId: string,
): Promise<{ signedUrl: string; expiresIn: number }> {
  return apiGet<{ signedUrl: string; expiresIn: number }>(
    `/required-document/product/${encodeURIComponent(
      String(productId),
    )}/document/${encodeURIComponent(String(documentId))}/signed-url`,
  );
}

export async function deleteAllProductRequiredDocuments(
  productId: number | string,
): Promise<{ message: string }> {
  return apiDelete<{ message: string }>(
    `/required-document/product/${encodeURIComponent(String(productId))}`,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Endorsement documents (same shape as product required documents, different API base)
// ─────────────────────────────────────────────────────────────────────────────

export interface ProductEndorsementDocumentItem extends ProductRequiredDocumentItem {}

export async function getProductEndorsementDocuments(
  productId: number | string,
): Promise<ProductEndorsementDocumentItem[]> {
  return apiGet<ProductEndorsementDocumentItem[]>(
    `/endorsement-required-document/product/${encodeURIComponent(String(productId))}`,
  );
}

export async function saveProductEndorsementDocument(
  productId: number | string,
  params: CreateRequiredDocumentParams,
): Promise<ProductEndorsementDocumentItem[]> {
  const form = new FormData();
  form.append('displayLabel', params.display_label);
  form.append('description', params.description ?? '');
  form.append(
    'isRequired',
    String(
      typeof params.is_required === 'string' ? params.is_required === 'true' : !!params.is_required,
    ),
  );
  form.append('isActive', String(!!params.is_active));
  if (params.ai_question_validation !== undefined) {
    form.append('aiQuestionValidation', String(!!params.ai_question_validation));
  }
  if (params.validation_questions !== undefined) {
    form.append('validationQuestions', JSON.stringify(params.validation_questions));
  }
  if (params.refer_to_under_wrtiter_allowed !== undefined) {
    form.append(
      'referToUnderWrtiterAllowed',
      String(!!params.refer_to_under_wrtiter_allowed),
    );
  }
  if (params.template_file instanceof File) {
    form.append('templateFile', params.template_file);
  }
  return apiPost<ProductEndorsementDocumentItem[]>(
    `/endorsement-required-document/product/${encodeURIComponent(String(productId))}/document`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
}

export async function updateProductEndorsementDocument(
  productId: number | string,
  documentId: string,
  params: UpdateRequiredDocumentParams,
): Promise<ProductEndorsementDocumentItem[]> {
  const form = new FormData();
  if (params.display_label !== undefined) form.append('displayLabel', params.display_label);
  if (params.description !== undefined) form.append('description', params.description || '');
  if (params.is_required !== undefined) form.append('isRequired', String(!!params.is_required));
  if (params.is_active !== undefined) form.append('isActive', String(!!params.is_active));
  if (params.ai_question_validation !== undefined) {
    form.append('aiQuestionValidation', String(!!params.ai_question_validation));
  }
  if (params.validation_questions !== undefined) {
    form.append('validationQuestions', JSON.stringify(params.validation_questions));
  }
  if (params.refer_to_under_wrtiter_allowed !== undefined) {
    form.append(
      'referToUnderWrtiterAllowed',
      String(!!params.refer_to_under_wrtiter_allowed),
    );
  }
  if (params.template_file instanceof File) {
    form.append('templateFile', params.template_file);
  }
  return apiPut<ProductEndorsementDocumentItem[]>(
    `/endorsement-required-document/product/${encodeURIComponent(
      String(productId),
    )}/document/${encodeURIComponent(String(documentId))}`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
}

export async function deleteProductEndorsementDocument(
  productId: number | string,
  documentId: string,
): Promise<ProductEndorsementDocumentItem[]> {
  return apiDelete<ProductEndorsementDocumentItem[]>(
    `/endorsement-required-document/product/${encodeURIComponent(
      String(productId),
    )}/document/${encodeURIComponent(String(documentId))}`,
  );
}

export async function deleteProductEndorsementDocumentTemplate(
  productId: number | string,
  documentId: string,
): Promise<ProductEndorsementDocumentItem[]> {
  return apiDelete<ProductEndorsementDocumentItem[]>(
    `/endorsement-required-document/product/${encodeURIComponent(
      String(productId),
    )}/document/${encodeURIComponent(String(documentId))}/template`,
  );
}

export async function deleteProductEndorsementDocumentValidationQuestion(
  productId: number | string,
  documentId: string,
  questionId: string,
): Promise<ProductEndorsementDocumentItem[]> {
  return apiDelete<ProductEndorsementDocumentItem[]>(
    `/endorsement-required-document/product/${encodeURIComponent(
      String(productId),
    )}/document/${encodeURIComponent(
      String(documentId),
    )}/validation-question/${encodeURIComponent(String(questionId))}`,
  );
}

export async function getProductEndorsementDocumentSignedUrl(
  productId: number | string,
  documentId: string,
): Promise<{ signedUrl: string; expiresIn: number }> {
  return apiGet<{ signedUrl: string; expiresIn: number }>(
    `/endorsement-required-document/product/${encodeURIComponent(
      String(productId),
    )}/document/${encodeURIComponent(String(documentId))}/signed-url`,
  );
}

// Broker Product Assignments
// Updated to use new backend API: POST /underwriter/distributors/:id/products

// ─────────────────────────────────────────────────────────────────────────────
// Underwriting documents (cloned from product required documents, different API base)
// ─────────────────────────────────────────────────────────────────────────────

export interface ProductUnderwritingDocumentItem extends ProductRequiredDocumentItem {}

export async function getProductUnderwritingDocuments(
  productId: number | string,
): Promise<ProductUnderwritingDocumentItem[]> {
  return apiGet<ProductUnderwritingDocumentItem[]>(
    `/underwriting-required-document/product/${encodeURIComponent(String(productId))}`,
  );
}

export async function saveProductUnderwritingDocument(
  productId: number | string,
  params: CreateRequiredDocumentParams,
): Promise<ProductUnderwritingDocumentItem[]> {
  const form = new FormData();
  form.append('displayLabel', params.display_label);
  form.append('description', params.description ?? '');
  form.append(
    'isRequired',
    String(
      typeof params.is_required === 'string' ? params.is_required === 'true' : !!params.is_required,
    ),
  );
  form.append('isActive', String(!!params.is_active));
  if (params.ai_question_validation !== undefined) {
    form.append('aiQuestionValidation', String(!!params.ai_question_validation));
  }
  if (params.validation_questions !== undefined) {
    form.append('validationQuestions', JSON.stringify(params.validation_questions));
  }
  if (params.refer_to_under_wrtiter_allowed !== undefined) {
    form.append(
      'referToUnderWrtiterAllowed',
      String(!!params.refer_to_under_wrtiter_allowed),
    );
  }
  if (params.template_file instanceof File) {
    form.append('templateFile', params.template_file);
  }
  return apiPost<ProductUnderwritingDocumentItem[]>(
    `/underwriting-required-document/product/${encodeURIComponent(String(productId))}/document`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
}

export async function updateProductUnderwritingDocument(
  productId: number | string,
  documentId: string,
  params: UpdateRequiredDocumentParams,
): Promise<ProductUnderwritingDocumentItem[]> {
  const form = new FormData();
  if (params.display_label !== undefined) form.append('displayLabel', params.display_label);
  if (params.description !== undefined) form.append('description', params.description || '');
  if (params.is_required !== undefined) form.append('isRequired', String(!!params.is_required));
  if (params.is_active !== undefined) form.append('isActive', String(!!params.is_active));
  if (params.ai_question_validation !== undefined) {
    form.append('aiQuestionValidation', String(!!params.ai_question_validation));
  }
  if (params.validation_questions !== undefined) {
    form.append('validationQuestions', JSON.stringify(params.validation_questions));
  }
  if (params.refer_to_under_wrtiter_allowed !== undefined) {
    form.append(
      'referToUnderWrtiterAllowed',
      String(!!params.refer_to_under_wrtiter_allowed),
    );
  }
  if (params.template_file instanceof File) {
    form.append('templateFile', params.template_file);
  }
  return apiPut<ProductUnderwritingDocumentItem[]>(
    `/underwriting-required-document/product/${encodeURIComponent(
      String(productId),
    )}/document/${encodeURIComponent(String(documentId))}`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
}

export async function deleteProductUnderwritingDocument(
  productId: number | string,
  documentId: string,
): Promise<ProductUnderwritingDocumentItem[]> {
  return apiDelete<ProductUnderwritingDocumentItem[]>(
    `/underwriting-required-document/product/${encodeURIComponent(
      String(productId),
    )}/document/${encodeURIComponent(String(documentId))}`,
  );
}

export async function deleteProductUnderwritingDocumentTemplate(
  productId: number | string,
  documentId: string,
): Promise<ProductUnderwritingDocumentItem[]> {
  return apiDelete<ProductUnderwritingDocumentItem[]>(
    `/underwriting-required-document/product/${encodeURIComponent(
      String(productId),
    )}/document/${encodeURIComponent(String(documentId))}/template`,
  );
}

export async function deleteProductUnderwritingDocumentValidationQuestion(
  productId: number | string,
  documentId: string,
  questionId: string,
): Promise<ProductUnderwritingDocumentItem[]> {
  return apiDelete<ProductUnderwritingDocumentItem[]>(
    `/underwriting-required-document/product/${encodeURIComponent(
      String(productId),
    )}/document/${encodeURIComponent(
      String(documentId),
    )}/validation-question/${encodeURIComponent(String(questionId))}`,
  );
}

export async function getProductUnderwritingDocumentSignedUrl(
  productId: number | string,
  documentId: string,
): Promise<{ signedUrl: string; expiresIn: number }> {
  return apiGet<{ signedUrl: string; expiresIn: number }>(
    `/underwriting-required-document/product/${encodeURIComponent(
      String(productId),
    )}/document/${encodeURIComponent(String(documentId))}/signed-url`,
  );
}
