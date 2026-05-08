import type {
    ProposalFormEditResponse,
    TemplateFieldItem,
    TemplatePageItem,
} from '@/features/quotes/api/edit-quote';

/**
 * Transforms a `ProposalFormEditResponse` (edit/resume API response) into the
 * flat `initialData` record that `DynamicProposalForm` understands.
 *
 * The API returns field values inside each field's `.value` property, keyed by
 * the template structure. We flatten those into a `{ [field.name]: value }` map
 * so the existing `initializeFormData` utility (which DynamicProposalForm already
 * calls) simply picks them up — no special edit-mode handling required in the UI.
 *
 * Special cases handled:
 *  - combination fields  → parsed from `{ value: [{label, value}] }[]` into row arrays
 *  - datePeriod fields   → parsed from JSON string or object
 *  - multiselect fields  → parsed from JSON string or array
 *  - dropdown "Other"    → preserved as `{ value: 'Other', otherText }` shape
 *
 * The returned object also includes top-level metadata:
 *  - `id`       = responseId (used to resume the save chain)
 *  - `isLocked` = whether the proposal is already locked
 */
export function normalizeEditDataToFormData(
    editData: ProposalFormEditResponse,
): Record<string, unknown> {
    const flat: Record<string, unknown> = {
        id: editData.responseId,
        isLocked: editData.isLocked ?? false,
    };

    const pages: TemplatePageItem[] = editData.template?.pages ?? [];

    pages.forEach((page) => {
        page.sections?.forEach((section) => {
            section.fields?.forEach((field) => {
                const rawValue = getFieldRawValue(field);
                if (rawValue === undefined || rawValue === null) return;

                const fieldName = field.name;

                if (field.type === 'combination') {
                    flat[fieldName] = parseCombinationRows(rawValue, field.subFields ?? []);
                } else if (field.type === 'datePeriod') {
                    flat[fieldName] = parseDatePeriod(rawValue);
                } else if (field.type === 'multiselect' || field.type === 'multiselectDropdown') {
                    flat[fieldName] = parseMultiselect(rawValue);
                } else if (field.type === 'consent') {
                    flat[fieldName] = parseConsentValue(rawValue);
                } else if (field.type === 'dropdown') {
                    flat[fieldName] = parseDropdownValue(field, rawValue);
                } else {
                    flat[fieldName] = rawValue;
                }
            });
        });
    });

    return flat;
}

/**
 * Transforms the document list from the edit API into the shape that
 * `DocumentUpload` expects — with pre-populated upload status when the document
 * was already uploaded in a previous session.
 */
export function normalizeEditDocuments(
    editData: ProposalFormEditResponse,
): Array<{
    id: string | number;
    label: string;
    description: string;
    isRequired: boolean;
}> {
    return (editData.requiredDocuments ?? []).map((doc) => ({
        id: doc.id,
        label: doc.label || '',
        description: doc.description || '',
        isRequired: Boolean(doc.isRequired),
        // Preserve existing upload if present (DynamicProposalForm's DocumentUpload
        // accepts `fileUrl` / `fileName` as initial state via the `documents` prop)
        fileUrl: doc.value?.url || undefined,
        fileName: doc.value?.originalFilename || doc.value?.filename || undefined,
        status: doc.value?.url ? 'uploaded' : 'pending',
    }));
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

type EditableFieldValue = Pick<TemplateFieldItem, 'value'> & {
    valueJson?: unknown;
    valueText?: unknown;
};

function getFieldRawValue(field: EditableFieldValue): unknown {
    if (field.value !== undefined && field.value !== null) {
        return field.value;
    }

    if (field.valueJson !== undefined && field.valueJson !== null) {
        return field.valueJson;
    }

    if (field.valueText !== undefined && field.valueText !== null && field.valueText !== '') {
        return field.valueText;
    }

    return undefined;
}

function parseCombinationRows(
    apiValue: unknown,
    subFields: Array<{ id?: string; name: string; label: string }>,
): unknown[] {
    if (!Array.isArray(apiValue)) return [];
    return apiValue.map((row) => {
        // API shape: { value: [{ label, value }] }
        if (row && Array.isArray(row.value)) {
            const parsed: Record<string, unknown> = {
                _rowId: crypto.randomUUID(),
            };
            (
                row.value as Array<{ id?: string; label?: string; value: unknown }>
            ).forEach((subItem) => {
                const match =
                    subFields.find((sf) => sf.id && subItem.id && sf.id === subItem.id) ||
                    subFields.find((sf) => sf.label === subItem.label);
                if (match) parsed[match.name] = subItem.value;
            });
            return parsed;
        }
        if (row && typeof row === 'object') {
            const existingRow = row as Record<string, unknown>;
            return existingRow._rowId ? existingRow : { ...existingRow, _rowId: crypto.randomUUID() };
        }
        return row;
    });
}

function parseDatePeriod(rawValue: unknown): unknown {
    if (typeof rawValue === 'string' && rawValue.startsWith('{')) {
        try { return JSON.parse(rawValue); } catch { return { startDate: '', endDate: '' }; }
    }
    if (typeof rawValue === 'object' && rawValue !== null) return rawValue;
    return { startDate: '', endDate: '' };
}

function parseMultiselect(rawValue: unknown): unknown[] {
    if (typeof rawValue === 'string' && rawValue.startsWith('[')) {
        try { return parseMultiselect(JSON.parse(rawValue)); } catch { return []; }
    }
    if (Array.isArray(rawValue)) {
        return rawValue
            .map((entry) => {
                if (typeof entry === 'string') return entry;
                if (entry && typeof entry === 'object' && 'value' in entry) {
                    const value = (entry as Record<string, unknown>).value;
                    return value !== undefined && value !== null ? String(value) : '';
                }
                if (entry !== undefined && entry !== null) return String(entry);
                return '';
            })
            .filter((entry) => entry !== '');
    }
    return [];
}

function parseConsentValue(rawValue: unknown): unknown {
    if (!rawValue || typeof rawValue !== 'object' || Array.isArray(rawValue)) {
        return {
            accepted: rawValue === true,
            documents: {},
        };
    }

    const record = rawValue as Record<string, unknown>;
    const documents = Array.isArray(record.documents)
        ? Object.fromEntries(
            record.documents
                .filter(
                    (item): item is Record<string, unknown> =>
                        !!item &&
                        typeof item === 'object' &&
                        !Array.isArray(item) &&
                        typeof item.id === 'string',
                )
                .map((item) => [
                    String(item.id),
                    typeof item.fileName === 'string'
                        ? item.fileName
                        : typeof item.signedUrl === 'string'
                            ? item.signedUrl
                            : typeof item.url === 'string'
                                ? item.url
                                : null,
                ]),
        )
        : record.documents && typeof record.documents === 'object'
            ? record.documents
            : {};

    return {
        accepted: record.accepted === true,
        documents,
    };
}

function parseDropdownValue(field: { options?: unknown; masterValueId?: unknown }, rawValue: unknown): unknown {
    const OTHER = 'Other';
    const fieldMasterValueId = (field as any).masterValueId as string | null | undefined;
    const options = Array.isArray(field.options) ? (field.options as any[]) : [];
    const otherOption = options.find((o) => o && typeof o === 'object' && o.value === OTHER);
    const otherMasterValueId = otherOption ? (otherOption as any).masterValueId : undefined;

    if (
        fieldMasterValueId &&
        otherMasterValueId &&
        String(fieldMasterValueId) === String(otherMasterValueId)
    ) {
        return { value: OTHER, otherText: rawValue };
    }
    return rawValue;
}
