import type { Field, Page } from '@/features/product-config/proposal-form/api/proposalFormDesign';
import { isMetadataActive } from '@/features/product-config/proposal-form/api/proposalFormDesign';

/**
 * Read a field value the same way as dynamic form state: prefer `name`, then `id`.
 * Normalizes invalid combination/repeatable shapes (e.g. `""` from legacy defaults) to `[]`
 * so validation and conditional logic see a stable row array before any user interaction.
 */
export function getFormFieldValue(
  formData: Record<string, unknown>,
  field: Pick<Field, 'name' | 'id' | 'type'>,
): unknown {
  let v: unknown;
  if (field.name in formData) v = formData[field.name];
  else if (field.id && field.id in formData) v = formData[field.id];
  else return undefined;

  if (field.type === 'combination' || field.type === 'repeatable') {
    if (Array.isArray(v)) return v;
    if (v === '' || v === undefined || v === null) return [];
    return [];
  }

  return v;
}

/**
 * Shallow copy of `formData` with every combination/repeatable field value normalized via
 * {@link getFormFieldValue}. Use for conditional visibility / preview so sub-fields are not
 * treated as hidden until the user touches the parent (raw `""` vs `[]`).
 */
export function buildFormDataWithNormalizedCollections(
  formData: Record<string, unknown>,
  pages: Page[],
): Record<string, unknown> {
  const snap: Record<string, unknown> = { ...formData };
  for (const page of pages) {
    if (!isMetadataActive(page)) continue;
    for (const section of page.sections || []) {
      if (!isMetadataActive(section)) continue;
      for (const field of section.fields || []) {
        if (!isMetadataActive(field)) continue;
        if (field.type === 'combination' || field.type === 'repeatable') {
          const v = getFormFieldValue(formData, field);
          snap[field.name] = v;
          if (field.id) snap[field.id] = v;
        }
      }
    }
  }
  return snap;
}
