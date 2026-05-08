import type { Field, FieldOption } from '@/features/product-config/proposal-form/api/proposalFormDesign';
import { isMetadataActive } from '@/features/product-config/proposal-form/api/proposalFormDesign';
import { getConsentFieldValue, getConsentMetadata } from '@/features/product-config/proposal-form/utils/consent';

export function serializePageFields(fields: Field[], formData: Record<string, unknown>) {
  return fields.flatMap((field) => {
    if (!isMetadataActive(field)) return [];
    const raw = formData[field.name];
    const otherValueCode = 'Other';
    const getOptionValue = (o: unknown): string => {
      if (typeof o === 'string') return o;
      if (o && typeof o === 'object' && 'value' in o) {
        const v = (o as FieldOption).value;
        return v !== undefined && v !== null ? String(v) : '';
      }
      return '';
    };
    const getOptionMasterValueId = (o: unknown): string | undefined => {
      if (o && typeof o === 'object' && 'masterValueId' in o) {
        const v = (o as FieldOption).masterValueId;
        return v !== undefined && v !== null ? String(v) : undefined;
      }
      return undefined;
    };

    const getSelectionValue = (item: unknown): string => {
      if (item === undefined || item === null) return '';
      if (typeof item === 'string') return item;
      if (typeof item === 'number' || typeof item === 'boolean') return String(item);
      if (typeof item === 'object' && 'value' in item) {
        const v = (item as Record<string, unknown>).value;
        return v !== undefined && v !== null ? String(v) : '';
      }
      return '';
    };

    const getSelectionLabel = (item: unknown): string => {
      if (item && typeof item === 'object' && 'label' in item) {
        const v = (item as Record<string, unknown>).label;
        if (v !== undefined && v !== null) return String(v);
      }
      return getSelectionValue(item);
    };

    // Combination & Repeatable - Single entry with nested JSON
    if (field.type === 'combination' || field.type === 'repeatable') {
      const rows: Record<string, unknown>[] = Array.isArray(raw) ? raw : [];
      // Filter out hidden/deleted rows
      const visibleRows = rows.filter((r) => !r._hidden);

      const processedRows = visibleRows.map((row, index) => {
        if (!row || typeof row !== 'object') return row;

        const subFields = (field.subFields || []).filter(isMetadataActive);
        const values = subFields.map((sf) => {
          let val = (row as Record<string, unknown>)[sf.name];
          if (val instanceof File) {
            val = val.name;
          }
          return {
            id: sf.id,
            label: sf.label,
            value: val !== undefined && val !== null ? val : '',
          };
        });

        return {
          label: `Row ${index + 1}`,
          value: values,
        };
      });

      return [
        {
          fieldId: field.id,
          fieldName: field.name,
          valueJson: processedRows,
          valueText: JSON.stringify(processedRows),
        },
      ];
    }

    if (field.type === 'multiselect' || field.type === 'multiselectDropdown') {
      const selectedValues = Array.isArray(raw)
        ? raw.map((item) => getSelectionValue(item)).filter((item) => item)
        : [];

      const selectedJson = selectedValues.map((selectedValue) => {
        const selectedOption = field.options?.find(
          (o) => getOptionValue(o).toLowerCase() === selectedValue.toLowerCase(),
        );
        return {
          value: selectedValue,
          label: selectedOption ? getSelectionLabel(selectedOption) : selectedValue,
          masterValueId: getOptionMasterValueId(selectedOption),
        };
      });

      return [
        {
          fieldId: field.id,
          fieldName: field.name,
          valueJson: selectedJson,
          valueText: JSON.stringify(selectedValues),
        },
      ];
    }

    // Arrays (fallback for multiple selections etc)
    if (Array.isArray(raw)) {
      return [
        {
          fieldId: field.id,
          fieldName: field.name,
          valueText: JSON.stringify(raw),
        },
      ];
    }

    // Dropdown master value
    if (field.type === 'dropdown') {
      const selectedValue =
        raw && typeof raw === 'object'
          ? String((raw as Record<string, unknown>)?.value ?? '')
          : raw !== undefined && raw !== null
            ? String(raw)
            : '';
      const valueText =
        selectedValue === otherValueCode
          ? String((raw as Record<string, unknown>)?.otherText ?? '')
          : selectedValue;

      const selectedOption = field.options?.find(
        (o) => getOptionValue(o).toLowerCase() === selectedValue.toLowerCase(),
      );
      const mvid = getOptionMasterValueId(selectedOption);

      return [
        {
          fieldId: field.id,
          fieldName: field.name,
          valueText,
          masterValueId: mvid,
        },
      ];
    }

    // DatePeriod & PolicyPeriod - serialize as JSON object
    if (field.type === 'datePeriod' || field.type === 'policyPeriod') {
      return [
        {
          fieldId: field.id,
          fieldName: field.name,
          valueJson: raw && typeof raw === 'object' ? raw : null,
          valueText: raw && typeof raw === 'object' ? JSON.stringify(raw) : '',
        },
      ];
    }

    if (field.type === 'consent') {
      const consentValue = getConsentFieldValue(raw);
      const consentMetadata = getConsentMetadata(field);
      const serialized = {
        accepted: consentValue.accepted,
        documents: (consentMetadata.consentDocuments || []).map((doc) => {
          const uploadedValue = consentValue.documents?.[doc.id];
          return {
            id: doc.id,
            label: doc.label,
            description: doc.description || '',
            required: doc.required,
            active: doc.active,
            fileName:
              uploadedValue instanceof File
                ? uploadedValue.name
                : typeof uploadedValue === 'string'
                  ? uploadedValue
                  : null,
          };
        }),
      };

      return [
        {
          fieldId: field.id,
          fieldName: field.name,
          valueJson: serialized,
          valueText: JSON.stringify(serialized),
        },
      ];
    }

    // Local File object (atomic upload refactor)
    if (raw instanceof File) {
      return [
        {
          fieldId: field.id,
          fieldName: field.name,
          valueText: raw.name,
        },
      ];
    }

    // Default - handle objects by stringifying
    if (raw !== undefined && raw !== null && typeof raw === 'object') {
      return [
        {
          fieldId: field.id,
          fieldName: field.name,
          valueText: JSON.stringify(raw),
        },
      ];
    }

    return [
      {
        fieldId: field.id,
        fieldName: field.name,
        valueText: raw !== undefined && raw !== null ? String(raw) : '',
      },
    ];
  });
}
