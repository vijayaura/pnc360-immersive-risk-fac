import type { Field } from '@/features/product-config/proposal-form/api/proposalFormDesign';

export interface ConsentFieldMetadata {
  consentLinkText?: string;
  consentContentHtml?: string;
  consentDocuments?: ConsentDocumentConfig[];
}

export interface ConsentDocumentConfig {
  id: string;
  label: string;
  description?: string;
  required: boolean;
  active: boolean;
}

export const getConsentMetadata = (field: Pick<Field, 'metadata'>): ConsentFieldMetadata => {
  const metadata = (field.metadata ?? {}) as Record<string, unknown>;

  return {
    consentLinkText:
      typeof metadata.consentLinkText === 'string' ? metadata.consentLinkText : undefined,
    consentContentHtml:
      typeof metadata.consentContentHtml === 'string' ? metadata.consentContentHtml : undefined,
    consentDocuments: Array.isArray(metadata.consentDocuments)
      ? metadata.consentDocuments
          .filter(
            (item): item is Record<string, unknown> =>
              !!item && typeof item === 'object' && typeof item.id === 'string' && typeof item.label === 'string',
          )
          .map((item) => ({
            id: String(item.id),
            label: String(item.label),
            description: typeof item.description === 'string' ? item.description : '',
            required: item.required === true,
            active: item.active !== false,
          }))
      : [],
  };
};

export interface ConsentFieldValue {
  accepted: boolean;
  documents?: Record<string, File | string | null>;
}

export const getConsentFieldValue = (value: unknown): ConsentFieldValue => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    const documents = (() => {
      if (record.documents && typeof record.documents === 'object' && !Array.isArray(record.documents)) {
        return Object.fromEntries(
          Object.entries(record.documents as Record<string, unknown>).map(([key, item]) => [
            key,
            item instanceof File || typeof item === 'string' ? (item as File | string) : null,
          ]),
        );
      }

      if (Array.isArray(record.documents)) {
        return Object.fromEntries(
          record.documents
            .filter(
              (item): item is Record<string, unknown> =>
                !!item && typeof item === 'object' && !Array.isArray(item) && typeof item.id === 'string',
            )
            .map((item) => [
              String(item.id),
              item instanceof File
                ? item
                : typeof item.fileName === 'string'
                  ? item.fileName
                  : typeof item.signedUrl === 'string'
                    ? item.signedUrl
                    : typeof item.url === 'string'
                      ? item.url
                      : null,
            ]),
        );
      }

      return {};
    })();

    return {
      accepted: record.accepted === true,
      documents,
    };
  }

  return {
    accepted: value === true,
    documents: {},
  };
};
