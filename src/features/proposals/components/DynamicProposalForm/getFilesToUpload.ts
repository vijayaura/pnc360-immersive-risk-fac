import type { Page } from '@/features/product-config/proposal-form/api/proposalFormDesign';
import { getConsentFieldValue } from '@/features/product-config/proposal-form/utils/consent';

/**
 * Collects all File objects from the current form data that belong to the
 * given pages, returning them keyed by their field/sub-field ID so they can
 * be uploaded via multipart alongside the JSON payload.
 */
export function getFilesToUpload(
    targetPages: Page[],
    formData: Record<string, unknown>,
): { key: string; file: File }[] {
    const files: { key: string; file: File }[] = [];

    targetPages.forEach((page) => {
        page.sections.forEach((section) => {
            section.fields.forEach((field) => {
                const raw = formData[field.name];

                if (raw instanceof File) {
                    files.push({ key: field.id, file: raw });
                } else if (field.type === 'consent') {
                    const consentValue = getConsentFieldValue(raw);
                    Object.entries(consentValue.documents || {}).forEach(([documentId, documentValue]) => {
                        if (documentValue instanceof File) {
                            files.push({ key: `${field.id}__${documentId}`, file: documentValue });
                        }
                    });
                } else if (Array.isArray(raw)) {
                    raw.forEach((row, rowIndex) => {
                        if (row && typeof row === 'object') {
                            Object.entries(row).forEach(([subFieldName, cellValue]) => {
                                if (cellValue instanceof File) {
                                    const subField = field.subFields?.find((sf) => sf.name === subFieldName);
                                    const key = subField?.id
                                        ? `${subField.id}__row_${rowIndex}`
                                        : `${field.id}_${subFieldName}__row_${rowIndex}`;
                                    files.push({ key, file: cellValue });
                                }
                            });
                        }
                    });
                }
            });
        });
    });

    return files;
}
