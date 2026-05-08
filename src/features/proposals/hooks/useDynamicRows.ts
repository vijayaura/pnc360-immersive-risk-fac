import { useEffect } from 'react';
import type { Page } from '@/features/product-config/proposal-form/api/proposalFormDesign';

interface Params {
  pages: Page[];
  formData: Record<string, unknown>;
  isInitialized: boolean;
  onChange: (name: string, value: unknown) => void;
  useIdAsKey?: boolean;
}

export function useDynamicRows({
  pages,
  formData,
  isInitialized,
  onChange,
  useIdAsKey = false,
}: Params) {
  useEffect(() => {
    if (!isInitialized) return;

    pages.forEach((page) => {
      page.sections?.forEach((section) => {
        section.fields.forEach((field) => {
          const dependentFieldName = field.dynamicRowsBasedOn || field.metadata?.rowsDependentField;
          if (!dependentFieldName) return;

          // Determine which key to use for this field in formData.
          // We need to be consistent with how the parent form component keys its fields.
          const currentKey = useIdAsKey && field.id ? field.id : field.name;

          const current = formData[currentKey];

          // Find dependent field's value (could be by name or ID)
          let dependentValue = formData[dependentFieldName];
          if (dependentValue === undefined) {
            // Try finding field by name to get its ID
            const dependentField = pages
              .flatMap((p) => p.sections || [])
              .flatMap((s) => s.fields || [])
              .find((f) => f.name === dependentFieldName);
            if (dependentField?.id && formData[dependentField.id] !== undefined) {
              dependentValue = formData[dependentField.id];
            }
          }

          // CLEANUP: If value has commas (from NumberField formatting), remove them
          const cleanedValue =
            typeof dependentValue === 'string' ? dependentValue.replace(/,/g, '') : dependentValue;

          // Cap at 100 rows max rowsDependentField
          const rawLength = Number(cleanedValue) || 0;
          const targetLength = Math.min(100, Math.max(0, rawLength));

          // If it's not an array yet, initialize it if the target field has a value
          if (!Array.isArray(current)) {
            if (targetLength > 0) {
              const rows = Array.from({ length: targetLength }, () => {
                const row: Record<string, unknown> = {};
                field.subFields?.forEach((sf) => {
                  const metadataDefaultValue = (sf as any).metadata?.defaultValue;
                  if (metadataDefaultValue !== undefined) {
                    row[sf.name] = metadataDefaultValue;
                  } else if (sf.type === 'number') {
                    row[sf.name] = '';
                  } else if (sf.type === 'checkbox') {
                    row[sf.name] = false;
                  } else {
                    row[sf.name] = '';
                  }
                });
                return row;
              });
              onChange(currentKey, rows);
            }
            return;
          }

          if (current.length === targetLength) return;

          const rows = [...current];

          if (rows.length < targetLength) {
            for (let i = rows.length; i < targetLength; i++) {
              const row: Record<string, unknown> = {};
              field.subFields?.forEach((sf) => {
                const metadataDefaultValue = (sf as any).metadata?.defaultValue;
                if (metadataDefaultValue !== undefined) {
                  row[sf.name] = metadataDefaultValue;
                } else if (sf.type === 'number') {
                  row[sf.name] = '';
                } else if (sf.type === 'checkbox') {
                  row[sf.name] = false;
                } else {
                  row[sf.name] = '';
                }
              });
              rows.push(row);
            }
          } else {
            rows.length = targetLength;
          }

          onChange(currentKey, rows);
        });
      });
    });
  }, [pages, formData, isInitialized, onChange, useIdAsKey]);
}
