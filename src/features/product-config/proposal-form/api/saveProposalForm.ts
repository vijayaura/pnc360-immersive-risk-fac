import { apiPost, apiUploadFile } from '@/lib/api/client';
import { useAuthStore } from '@/shared/stores/useAuthStore';

export interface fieldsValues {
  fieldId: string;
  fieldName: string;
  valueText?: string;
  valueJson?: any;
  masterValueId?: string;
}
export interface SaveProposalFormRequest {
  templateId: string;
  templateVersionId: string;
  productId: string;
  responseId: string | null;
  currentPageId: string;
  fieldValues: fieldsValues[];
  isAdditionalInformation?: boolean;
  isLastProposalFormPage?: boolean;
  brokerOrganizationId?: string;
}
export interface SaveProposalFormResponse {
  nextPageId: string | null;
  responseId: string;
  status: string;
}
export const saveProposalForm = async (
  data: SaveProposalFormRequest,
  files?: { key: string; file: File }[],
): Promise<SaveProposalFormResponse> => {
  if (files && files.length > 0) {
    const formData = new FormData();

    // Flatten data into FormData
    Object.entries(data).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        // Skip null/undefined or append as empty string if expected
        return;
      }
      if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    });

    // Append each file. Multiple files for same key will append correctly.
    files.forEach(({ key, file }) => {
      formData.append(key, file);
    });

    return apiPost<SaveProposalFormResponse>('/proposal-form-response', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  return apiPost<SaveProposalFormResponse>('/proposal-form-response', data);
};

export const submitProposalForm = async ({
  responseId,
}: {
  responseId: string;
}): Promise<SaveProposalFormResponse> => {
  return apiPost<SaveProposalFormResponse>(`/proposal-form-response/${responseId}/submit`);
};

/**
 * Download template for a specific combination field
 * @param productId - The ID of the product
 * @param payload - The data needed to generate the template (includes fieldId, sectionId, subFieldIds, rows, etc.)
 * @returns Promise that resolves to the Excel file blob
 */
export interface DownloadTemplateRequest {
  fieldId: string;
  sectionId: string;
  responseId?: string | null;
  subFieldIds: string[];
  rows: Array<{
    label: string;
    value: Array<{
      id: string;
      value: any;
    }>;
  }>;
}

export const downloadProposalTemplate = async (
  productId: string,
  payload: DownloadTemplateRequest,
): Promise<Blob> => {
  const url = `${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/proposal-form/product/${productId}/download-template`;

  const token = useAuthStore.getState().token;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token || ''}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[AUTH] Failed to download template error:', errorText);
    throw new Error(`Failed to download template: ${response.statusText}`);
  }

  return response.blob();
};


/**
 * Upload proposal template for a specific product
 * @param productId - The ID of the product
 * @param file - The file to upload
 * @param fieldId - The ID of the field
 * @param responseId - The ID of the form response
 * @returns Promise with the upload response
 */
export const uploadProposalTemplate = async (
  productId: string,
  file: File,
  fieldId?: string,
  responseId?: string,
): Promise<unknown[][]> => {
  const queryParams = new URLSearchParams();
  if (fieldId) queryParams.set('fieldId', fieldId);
  if (responseId) queryParams.set('responseId', responseId);

  const queryString = queryParams.toString();
  const url = `/proposal-form/product/${productId}/upload-template${queryString ? `?${queryString}` : ''}`;

  return apiUploadFile(url, file, undefined, 'file');
};
