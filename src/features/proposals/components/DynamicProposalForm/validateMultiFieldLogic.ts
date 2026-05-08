import type { Page } from '@/features/product-config/proposal-form/api/proposalFormDesign';

/**
 * Validates page-level multi-field numeric rules (e.g. sum of split percentages must equal 100).
 * Returns an error message string if validation fails, or null if all validations pass.
 */
export function validateMultiFieldLogic(
    page: Page & {
        validations?: Array<{
            fieldNames: string[];
            condition: 'lessThan' | 'moreThan' | 'lessThanOrEqual' | 'moreThanOrEqual' | 'equal';
            value: number;
            message?: string;
        }>
    },
    formValues: Record<string, unknown>,
): string | null {
    const validations = page.validations || [];
    if (!validations.length) return null;

    for (const validation of validations) {
        let sum = 0;

        for (const fieldPath of validation.fieldNames) {
            // fieldPath could be "fieldName" or "combinationName.subFieldName"
            const [parentName, subName] = fieldPath.split('.');

            // Find the field in the page to determine its type
            let targetField: { name: string; type: string } | null = null;
            page.sections?.forEach((s) => {
                s.fields?.forEach((f) => {
                    if (f.name === parentName) targetField = f;
                });
            });

            if (!targetField) continue;

            if (subName && (targetField as any).type === 'combination') {
                // Combination field: sum values across all rows
                const rows = formValues[(targetField as any).name];
                if (Array.isArray(rows)) {
                    rows.forEach((row) => {
                        const val = Number((row as any)[subName]);
                        if (!isNaN(val)) sum += val;
                    });
                }
            } else {
                // Regular numeric field
                const val = Number(formValues[(targetField as any).name]);
                if (!isNaN(val)) sum += val;
            }
        }

        const targetValue = validation.value;
        let isValid = true;

        switch (validation.condition) {
            case 'lessThan':
                isValid = sum < targetValue;
                break;
            case 'moreThan':
                isValid = sum > targetValue;
                break;
            case 'lessThanOrEqual':
                isValid = sum <= targetValue;
                break;
            case 'moreThanOrEqual':
                isValid = sum >= targetValue;
                break;
            case 'equal':
                isValid = sum === targetValue;
                break;
        }

        if (!isValid) {
            return validation.message || `Validation failed for ${page.title}`;
        }
    }

    return null;
}
