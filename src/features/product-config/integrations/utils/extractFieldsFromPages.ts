import type { Page } from '@/features/product-config/proposal-form/api/proposalFormDesign';

export interface ExtractedField {
  name: string;
  label: string;
  type: string;
}

/**
 * Extracts a flat, deduplicated, alphabetically-sorted list of fields
 * from all proposal form pages (sections, sub-fields, navigation fields).
 */
export function extractFieldsFromPages(pages: Page[]): ExtractedField[] {
  const fields: ExtractedField[] = [];
  const seenFields = new Set<string>();

  pages.forEach((page) => {
    page.sections?.forEach((section) => {
      section.fields.forEach((field) => {
        if (field.name && !seenFields.has(field.name)) {
          seenFields.add(field.name);
          fields.push({
            name: field.name,
            label: field.label || field.name,
            type: field.type || 'text',
          });
        }
        // Extract sub-fields from combination fields
        if (field.type === 'combination' && field.subFields) {
          field.subFields.forEach((subField) => {
            if (subField.name && !seenFields.has(subField.name)) {
              seenFields.add(subField.name);
              fields.push({
                name: subField.name,
                label: subField.label || subField.name,
                type: subField.type || 'text',
              });
            }
          });
        }
      });
    });
    // Extract fields from navigation fields
    page.navigationFields?.forEach((field) => {
      if (field.name && !seenFields.has(field.name)) {
        seenFields.add(field.name);
        fields.push({
          name: field.name,
          label: field.label || field.name,
          type: field.type || 'button',
        });
      }
    });
  });

  return fields.sort((a, b) => a.label.localeCompare(b.label));
}
