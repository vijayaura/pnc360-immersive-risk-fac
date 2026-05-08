import { api } from '@/lib/api/client';

export interface RequiredDocumentForInsurer {
  id: string;
  productId: string;
  organizationId: string;
  marketUserId: string;
  templateFile?: string | null;
  fileUrl?: string | null;
  signedUrl?: string | null;
  originalFilename?: string | null;
  displayLabel: string;
  description?: string | null;
  displayOrder?: number;
  isRequired: boolean;
  isActive: boolean;
  aiQuestionValidation?: boolean;
  validationQuestions?: Array<{
    id?: string;
    question: string;
  }>;
  ai_validation_result?: {
    is_valid_document: boolean;
    description_message: string;
  };
  version?: number;
  createdById?: string;
  updatedById?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export async function getRequiredDocumentsForInsurer(
  productId: string | number,
  insurerOrganizationId: string | number,
): Promise<RequiredDocumentForInsurer[]> {
  const url = `/required-document/product/${productId}/insurer/${insurerOrganizationId}`;
  const resp = await api.get(url);
  const data = (resp?.data as any) ?? [];
  if (Array.isArray(data)) return data;
  if (data?.items && Array.isArray(data.items)) return data.items;
  return [];
}

/** Endorsement required documents – same shape as declaration required docs. */
export async function getEndorsementRequiredDocumentsForInsurer(
  productId: string | number,
  insurerOrganizationId: string | number,
): Promise<RequiredDocumentForInsurer[]> {
  const url = `/endorsement-required-document/product/${productId}/insurer/${insurerOrganizationId}`;
  const resp = await api.get(url);
  const data = (resp?.data as any) ?? [];
  if (Array.isArray(data)) return data;
  if (data?.items && Array.isArray(data.items)) return data.items;
  return [];
}

export interface UploadDeclarationDocumentResponse {
  id?: string;
  originalFilename?: string;
  url?: string;
  fileUrl?: string;
  filename?: string;
  contentType?: string;
  ai_validation_result?: {
    is_valid_document: boolean;
    description_message: string;
  };
  size?: number;
  metadata?: {
    aiValidation?: {
      is_valid_document: boolean;
      description_message: string;
      validatedAt?: string;
    };
  };
}

export async function uploadDeclarationDocument(
  responseId: string | number,
  file: File,
  params?: {
    displayLabel?: string;
    validationQuestions?: Array<{
      id?: string;
      question: string;
    }>;
  },
): Promise<UploadDeclarationDocumentResponse> {
  const formData = new FormData();
  formData.append("responseId", String(responseId));
  if (params?.displayLabel) {
    formData.append("displayLabel", params.displayLabel);
  }
  if (params?.validationQuestions !== undefined) {
    formData.append("validationQuestions", JSON.stringify(params.validationQuestions));
  }
  formData.append("file", file);
  const resp = await api.post("/required-document/upload-doc", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return (resp?.data as any) ?? {};
}

export async function uploadAdditionalDocument(
  responseId: string | number,
  file: File,
  title?: string,
): Promise<UploadDeclarationDocumentResponse> {
  const formData = new FormData();
  formData.append("responseId", String(responseId));
  formData.append("file", file);
  if (title != null && title.trim() !== "") {
    formData.append("documentName", title.trim());
  }
  const resp = await api.post("/required-document/upload-additional-doc", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return (resp?.data as any) ?? {};
}

/** Upload required document for an endorsement (endorsement documents step). */
export async function uploadEndorsementDocument(
  responseId: string | number,
  file: File,
  params?: {
    displayLabel?: string;
    validationQuestions?: Array<{
      id?: string;
      question: string;
    }>;
  },
  endorsementId?: string,
): Promise<UploadDeclarationDocumentResponse> {
  const formData = new FormData();
  formData.append("responseId", String(responseId));
  if (params?.displayLabel) {
    formData.append("displayLabel", params.displayLabel);
  }
  if (params?.validationQuestions !== undefined) {
    formData.append("validationQuestions", JSON.stringify(params.validationQuestions));
  }
  formData.append("file", file);
  if (endorsementId != null && endorsementId.trim() !== "") {
    formData.append("endorsementId", endorsementId.trim());
  }
  const resp = await api.post("/endorsement-required-document/upload-doc", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return (resp?.data as any) ?? {};
}

/** Upload additional document for an endorsement (endorsement documents step). */
export async function uploadEndorsementAdditionalDocument(
  responseId: string | number,
  file: File,
  title?: string,
  endorsementId?: string,
): Promise<UploadDeclarationDocumentResponse> {
  const formData = new FormData();
  formData.append("responseId", String(responseId));
  formData.append("file", file);
  if (title != null && title.trim() !== "") {
    formData.append("documentName", title.trim());
  }
  if (endorsementId != null && endorsementId.trim() !== "") {
    formData.append("endorsementId", endorsementId.trim());
  }
  const resp = await api.post("/endorsement-required-document/upload-additional-doc", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return (resp?.data as any) ?? {};
}

export interface SignedUrlResponse {
  url?: string;
  signedUrl?: string;
}

export async function getDeclarationSignedUrl(
  productId: string | number,
  documentId: string | number,
): Promise<string> {
  const url = `/required-document/product/${productId}/document/${documentId}/signed-url`;
  const resp = await api.get(url);
  const data = (resp?.data as any) ?? {};
  return data?.url || data?.signedUrl || "";
}

export async function deleteUploadedFile(fileId: string | number): Promise<void> {
  await api.delete(`/required-document/uploaded-file/${fileId}`);
}
