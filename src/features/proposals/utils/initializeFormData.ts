import type { Page } from '@/features/product-config/proposal-form/api/proposalFormDesign';
import { isMetadataActive } from '@/features/product-config/proposal-form/api/proposalFormDesign';
import { getConsentMetadata } from '@/features/product-config/proposal-form/utils/consent';

export function initializeFormData(
  pages: Page[],
  initialData: Record<string, any>,
  prev: Record<string, any>
) {
  const otherValueCode = "Other";
  const parseCombinationValue = (apiValue: any, subFields: any[]): any[] => {
    if (!Array.isArray(apiValue)) return [];

    return apiValue.map((row: any) => {
      if (row && Array.isArray(row.value)) {
        const parsed: Record<string, any> = {
          _rowId: crypto.randomUUID(),
        };
        row.value.forEach((subItem: any) => {
          const match = subFields?.find(
            (sf: any) => sf.label === subItem.label
          );
          if (match) parsed[match.name] = subItem.value;
        });
        return parsed;
      }
      if (row && typeof row === "object") {
        return row._rowId ? row : { ...row, _rowId: crypto.randomUUID() };
      }
      return row;
    });
  };

  const savedFromPages: Record<string, any> = {};
  const defaults: Record<string, any> = {};

  pages.forEach((page) => {
    if (!isMetadataActive(page)) return;
    page.sections?.forEach((section) => {
      if (!isMetadataActive(section)) return;
      section.fields.forEach((field) => {
        if (!isMetadataActive(field)) return;
        if (["nextButton", "backButton", "submitButton"].includes(field.type))
          return;

        const fieldValue = (field as any).value;
        const metadataDefaultValue = (field as any).metadata?.defaultValue;

        if (fieldValue !== undefined && fieldValue !== null) {
          if (field.type === "combination") {
            const parsed = parseCombinationValue(
              fieldValue,
              (field.subFields || []).filter(isMetadataActive)
            );
            if (parsed.length) savedFromPages[field.name] = parsed;
          } else if (field.type === "dropdown") {
            const fieldMasterValueId = (field as any).masterValueId as
              | string
              | null
              | undefined;
            const otherOption = Array.isArray(field.options)
              ? (field.options as any[]).find(
                  (o) => o && typeof o === "object" && o.value === otherValueCode
                )
              : undefined;
            const otherMasterValueId =
              otherOption && typeof otherOption === "object"
                ? (otherOption as any).masterValueId
                : undefined;

            if (
              fieldMasterValueId &&
              otherMasterValueId &&
              String(fieldMasterValueId) === String(otherMasterValueId)
            ) {
              savedFromPages[field.name] = { value: otherValueCode, otherText: fieldValue };
            } else {
              savedFromPages[field.name] = fieldValue;
            }
          } else {
            savedFromPages[field.name] = fieldValue;
          }
        }

        if (savedFromPages[field.name] !== undefined) return;

        if (field.defaultValue !== undefined) {
          defaults[field.name] = field.defaultValue;
        } else if (metadataDefaultValue !== undefined) {
          defaults[field.name] = metadataDefaultValue;
        } else if (field.type === "checkbox") {
          defaults[field.name] = false;
        } else if (field.type === "consent") {
          const consent = getConsentMetadata(field);
          defaults[field.name] = {
            accepted: false,
            documents: Object.fromEntries(
              (consent.consentDocuments || []).map((doc) => [doc.id, null]),
            ),
          };
        } else if (field.type === "multiselect" || field.type === "multiselectDropdown") {
          defaults[field.name] = [];
        } else if (field.type === "repeatable") {
          defaults[field.name] = field.defaultValue || [];
        } else if (field.type === "combination") {
          defaults[field.name] = [];
        } else {
          defaults[field.name] = "";
        }
      });
    });
  });

  return {
    ...prev,
    ...defaults,
    ...savedFromPages,
    ...initialData,
  };
}
