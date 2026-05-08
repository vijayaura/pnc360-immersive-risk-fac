import { useCallback, useEffect, useMemo, useState } from "react";
import type { Field, Page, SubField } from '@/features/product-config/proposal-form/api/proposalFormDesign';
import { isMetadataActive } from '@/features/product-config/proposal-form/api/proposalFormDesign';
import { getConsentMetadata } from '@/features/product-config/proposal-form/utils/consent';
import {
  evaluateConditionalLogic,
  resolveConditionalLogicFieldOptions,
  resolveConditionalLogicFieldValue,
} from '@/features/proposals/utils/conditionalLogic';
import { isSectionVisibilitySatisfied } from '../utils/sectionVisibility';

interface Params {
  pages: Page[];
  initialData?: Record<string, unknown>;
}

const MAX_RECONCILIATION_PASSES = 25;

type FormData = Record<string, unknown>;

const getAllFields = (pages: Page[]): Field[] =>
  pages
    .filter(isMetadataActive)
    .flatMap((page) =>
      page.sections
        ?.filter(isMetadataActive)
        .flatMap((section) => (section.fields || []).filter(isMetadataActive)) || [],
    );

const getFieldValue = (formData: FormData, field: Pick<Field, 'name' | 'id'>) => {
  if (field.name in formData) return formData[field.name];
  if (field.id && field.id in formData) return formData[field.id];
  return undefined;
};

const getRowStableKey = (row: Record<string, unknown>): string | null => {
  if (row._rowId !== undefined && row._rowId !== null && String(row._rowId).trim() !== '') {
    return `row:${String(row._rowId)}`;
  }

  if (
    row._sourceRowId !== undefined &&
    row._sourceRowId !== null &&
    String(row._sourceRowId).trim() !== ''
  ) {
    return `source:${String(row._sourceRowId)}`;
  }

  return null;
};

const resolveReferencedSubFieldName = (
  sourceField: Field,
  referenceSubField: SubField,
): string | null => {
  const referenceSubFieldId = referenceSubField.metadata?.referenceSubFieldId;
  const referenceSubFieldName = referenceSubField.metadata?.referenceSubFieldName;

  if (!sourceField.subFields?.length) {
    return referenceSubFieldName || null;
  }

  const matchedSubField = sourceField.subFields.find((subField) => {
    if (referenceSubFieldId && subField.id === referenceSubFieldId) return true;
    if (referenceSubFieldName && subField.name === referenceSubFieldName) return true;
    return false;
  });

  return matchedSubField?.name || referenceSubFieldName || null;
};

const pruneInvalidCombinationDependencies = (
  allFields: Field[],
  previousFormData: FormData,
  formData: FormData,
): FormData => {
  const next = { ...formData };

  let hasChanges = true;
  let passes = 0;

  while (hasChanges) {
    passes += 1;
    if (passes > MAX_RECONCILIATION_PASSES) {
      console.warn(
        '[useDynamicFormState] Stopped combination dependency reconciliation after max passes.',
      );
      break;
    }
    hasChanges = false;
    const currentBaseline = { ...next };

    allFields.forEach((field) => {
      if (field.type !== 'combination' || !field.subFields?.length) return;

      const dropdownReferenceSubFields = field.subFields.filter(
        (subField) => subField.type === 'dropdown' && subField.metadata?.referenceFieldId,
      );

      if (!dropdownReferenceSubFields.length) return;

      const currentValue = getFieldValue(next, field);
      if (!Array.isArray(currentValue) || currentValue.length === 0) return;

      const syncedRows = currentValue.reduce<Record<string, unknown>[]>((accumulator, row) => {
        if (!row || typeof row !== 'object') {
          return accumulator;
        }

        let shouldDeleteRow = false;
        let rowChanged = false;
        const nextRow = { ...row };

        dropdownReferenceSubFields.forEach((subField) => {
          if (shouldDeleteRow) return;

          const selectedValue = row[subField.name];

          if (selectedValue === undefined || selectedValue === null || selectedValue === '') {
            return;
          }

          const referenceField = allFields.find(
            (candidate) =>
              candidate.id === subField.metadata?.referenceFieldId ||
              candidate.name === subField.metadata?.referenceFieldName,
          );

          if (!referenceField) {
            nextRow[subField.name] = '';
            rowChanged = true;
            return;
          }

          const sourceSubFieldName = resolveReferencedSubFieldName(referenceField, subField);
          if (!sourceSubFieldName) {
            nextRow[subField.name] = '';
            rowChanged = true;
            return;
          }

          const previousSourceRows = Array.isArray(getFieldValue(previousFormData, referenceField))
            ? (getFieldValue(previousFormData, referenceField) as Record<string, unknown>[])
            : [];
          const baselineSourceRows = Array.isArray(getFieldValue(currentBaseline, referenceField))
            ? (getFieldValue(currentBaseline, referenceField) as Record<string, unknown>[])
            : [];
          const nextSourceRows = Array.isArray(getFieldValue(next, referenceField))
            ? (getFieldValue(next, referenceField) as Record<string, unknown>[])
            : [];

          const selectedValueString = String(selectedValue);
          const valueStillExists = nextSourceRows.some((sourceRow) => {
            if (!sourceRow || typeof sourceRow !== 'object') return false;
            return String(sourceRow[sourceSubFieldName] ?? '') === selectedValueString;
          });

          if (valueStillExists) {
            return;
          }

          const previousMatchingRows = previousSourceRows.filter((sourceRow) => {
            if (!sourceRow || typeof sourceRow !== 'object') return false;
            return String(sourceRow[sourceSubFieldName] ?? '') === selectedValueString;
          });
          const baselineMatchingRows = baselineSourceRows.filter((sourceRow) => {
            if (!sourceRow || typeof sourceRow !== 'object') return false;
            return String(sourceRow[sourceSubFieldName] ?? '') === selectedValueString;
          });
          const relevantPreviousRows =
            baselineMatchingRows.length > 0 ? baselineMatchingRows : previousMatchingRows;

          if (relevantPreviousRows.length === 0) {
            nextRow[subField.name] = '';
            rowChanged = true;
            return;
          }

          const nextSourceRowsByKey = new Map(
            nextSourceRows.reduce<Array<[string, Record<string, unknown>]>>((items, sourceRow) => {
              if (!sourceRow || typeof sourceRow !== 'object') return items;
              const rowKey = getRowStableKey(sourceRow);
              if (!rowKey) return items;
              items.push([rowKey, sourceRow]);
              return items;
            }, []),
          );

          const hadValueChange = relevantPreviousRows.some((sourceRow) => {
            const rowKey = getRowStableKey(sourceRow);
            if (!rowKey) return false;

            const matchingNextRow = nextSourceRowsByKey.get(rowKey);
            if (!matchingNextRow) return false;

            return String(matchingNextRow[sourceSubFieldName] ?? '') !== selectedValueString;
          });

          if (hadValueChange) {
            nextRow[subField.name] = '';
            rowChanged = true;
            return;
          }

          const hasStableRowMatch = relevantPreviousRows.some((sourceRow) => Boolean(getRowStableKey(sourceRow)));
          if (!hasStableRowMatch && nextSourceRows.length === baselineSourceRows.length) {
            nextRow[subField.name] = '';
            rowChanged = true;
            return;
          }

          shouldDeleteRow = true;
        });

        if (!shouldDeleteRow) {
          accumulator.push(rowChanged ? nextRow : row);
        }

        return accumulator;
      }, []);

      const rowsChanged =
        syncedRows.length !== currentValue.length ||
        syncedRows.some((row, rowIndex) => row !== currentValue[rowIndex]);

      if (rowsChanged) {
        next[field.name] = syncedRows;
        hasChanges = true;
      }
    });
  }

  return next;
};

const isObjectEmpty = (value: Record<string, unknown>) =>
  Object.values(value).every((item) => {
    if (item === undefined || item === null) return true;
    if (typeof item === 'string') return item.trim() === '';
    if (typeof item === 'boolean') return item === false;
    if (Array.isArray(item)) return item.length === 0;
    if (typeof File !== 'undefined' && item instanceof File) return false;
    if (typeof Blob !== 'undefined' && item instanceof Blob) return false;
    if (typeof item === 'object') return isObjectEmpty(item as Record<string, unknown>);
    return false;
  });

const hasMeaningfulValue = (value: unknown): boolean => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return !Number.isNaN(value);
  if (Array.isArray(value)) return value.length > 0;
  if (typeof File !== 'undefined' && value instanceof File) return true;
  if (typeof Blob !== 'undefined' && value instanceof Blob) return true;
  if (typeof value === 'object') return !isObjectEmpty(value as Record<string, unknown>);
  return true;
};

const getResetValue = (field: Pick<Field, 'type' | 'defaultValue' | 'metadata'> | SubField) => {
  const metadataDefaultValue = field.metadata?.defaultValue;

  if ('defaultValue' in field && field.defaultValue !== undefined) {
    return field.defaultValue;
  }
  if (metadataDefaultValue !== undefined) {
    return metadataDefaultValue;
  }

  switch (field.type) {
    case 'checkbox':
      return false;
    case 'multiselect':
    case 'multiselectDropdown':
    case 'combination':
    case 'repeatable':
      return [];
    case 'datePeriod':
    case 'policyPeriod':
      return {
        startDate: '',
        endDate: '',
      };
    default:
      return '';
  }
};

const getConsentResetValue = (field: Field) => {
  const consent = getConsentMetadata(field);
  return {
    accepted: false,
    documents: Object.fromEntries(
      (consent.consentDocuments || []).map((doc) => [doc.id, null]),
    ),
  };
};

const setFieldValueByRefs = (
  target: FormData,
  field: Pick<Field, 'name' | 'id'>,
  value: unknown,
) => {
  target[field.name] = value;
  if (field.id && field.id in target) {
    target[field.id] = value;
  }
};

const resetHiddenFieldValue = (
  target: FormData,
  field: Field,
): boolean => {
  const currentValue = getFieldValue(target, field);
  if (!hasMeaningfulValue(currentValue)) {
    return false;
  }

  if (field.type === 'consent') {
    setFieldValueByRefs(target, field, getConsentResetValue(field));
    return true;
  }

  setFieldValueByRefs(target, field, getResetValue(field));
  return true;
};

const pruneHiddenFieldValues = (
  pages: Page[],
  allFields: Field[],
  formData: FormData,
): FormData => {
  const next = { ...formData };
  let didChange = false;

  const shouldShowFieldForValues = (field: Field | SubField) => {
    if (!isMetadataActive(field)) return false;
    if (!field.conditionalLogic) return true;
    return evaluateConditionalLogic(
      field.conditionalLogic,
      (fieldRef) => resolveConditionalLogicFieldValue(allFields, next, fieldRef),
      (fieldRef) => resolveConditionalLogicFieldOptions(allFields, fieldRef),
    );
  };

  let hasChanges = true;
  let passes = 0;

  while (hasChanges) {
    passes += 1;
    if (passes > MAX_RECONCILIATION_PASSES) {
      console.warn(
        '[useDynamicFormState] Stopped hidden field pruning after max passes.',
      );
      break;
    }
    hasChanges = false;

    pages.forEach((page) => {
      if (!isMetadataActive(page)) return;
      page.sections?.forEach((section) => {
        let sectionVisible = isMetadataActive(section);
        const visibility = section.metadata?.visibility;

        if (sectionVisible && visibility) {
          const depField = allFields.find(
            (candidate) =>
              candidate.name === visibility.field || candidate.id === visibility.field,
          );
          const rawDepValue = depField
            ? next[depField.name] ?? (depField.id ? next[depField.id] : undefined)
            : next[visibility.field];
          sectionVisible = isSectionVisibilitySatisfied(visibility, depField, rawDepValue);
        }

        section.fields.forEach((field) => {
          const fieldVisible = sectionVisible && shouldShowFieldForValues(field);

          if (!fieldVisible) {
            if (resetHiddenFieldValue(next, field)) {
              hasChanges = true;
              didChange = true;
            }
            return;
          }

          if (
            (field.type !== 'combination' && field.type !== 'repeatable') ||
            !field.subFields?.length
          ) {
            return;
          }

          const rows = getFieldValue(next, field);
          if (!Array.isArray(rows) || rows.length === 0) return;

          let rowsChanged = false;
          const nextRows = rows.map((row) => {
            if (!row || typeof row !== 'object') return row;

            let rowChanged = false;
            const nextRow = { ...(row as Record<string, unknown>) };

            field.subFields?.forEach((subField) => {
              if (shouldShowFieldForValues(subField)) return;

              const currentSubFieldValue = nextRow[subField.name];
              if (!hasMeaningfulValue(currentSubFieldValue)) return;

              nextRow[subField.name] = getResetValue(subField);
              rowChanged = true;
            });

            if (rowChanged) {
              rowsChanged = true;
              return nextRow;
            }

            return row;
          });

          if (rowsChanged) {
            setFieldValueByRefs(next, field, nextRows);
            hasChanges = true;
            didChange = true;
          }
        });
      });
    });
  }

  return didChange ? next : formData;
};

export function useDynamicFormState({ pages, initialData = {} }: Params) {
  const [formData, setFormData] = useState<FormData>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const allFields = useMemo(() => getAllFields(pages), [pages]);

  const handleFieldChange = useCallback((fieldName: string, value: unknown) => {
    setFormData((prev) => {
      const next = { ...prev, [fieldName]: value };

      // Recursively clear all dependent fields when parent changes
      const clearDependentFields = (parentName: string, visited: Set<string>) => {
        if (visited.has(parentName)) return;
        visited.add(parentName);

        pages.forEach((page) => {
          page.sections?.forEach((section) => {
            section.fields.forEach((field) => {
              if (field.dependentOn === parentName) {
                // Clear this dependent field
                if (field.type === "checkbox") {
                  next[field.name] = false;
                } else if (field.type === "consent") {
                  next[field.name] = getConsentResetValue(field);
                } else if (field.type === "multiselect" || field.type === "multiselectDropdown") {
                  next[field.name] = [];
                } else {
                  next[field.name] = "";
                }
                // Recursively clear its descendants
                clearDependentFields(field.name, visited);
              }
            });
          });
        });
      };

      clearDependentFields(fieldName, new Set<string>());
      return pruneHiddenFieldValues(
        pages,
        allFields,
        pruneInvalidCombinationDependencies(allFields, prev, next),
      );
    });
  }, [pages, allFields]);

  const getInitialFieldValue = useCallback((field: Field): unknown => {
    const metadataDefaultValue = field.metadata?.defaultValue;
    if (field.defaultValue !== undefined) return field.defaultValue;
    if (metadataDefaultValue !== undefined) return metadataDefaultValue;
    if (field.type === "checkbox") return false;
    if (field.type === "consent") return getConsentResetValue(field);
    if (field.type === "multiselect" || field.type === "multiselectDropdown") return [];
    return "";
  }, []);

  useEffect(() => {
    if (isInitialized) return;

    const merged: FormData = {};

    pages.forEach((page) => {
      page.sections?.forEach((section) => {
        section.fields.forEach((field) => {
          if (
            field.type === "nextButton" ||
            field.type === "backButton" ||
            field.type === "submitButton"
          ) {
            return;
          }
          merged[field.name] = getInitialFieldValue(field);
        });
      });
    });

    Object.assign(merged, initialData);
    setFormData(merged);
    setIsInitialized(true);
  }, [pages, initialData, isInitialized, getInitialFieldValue]);

  useEffect(() => {
    if (!isInitialized) return;

    setFormData((prev) => {
      const next = pruneHiddenFieldValues(pages, allFields, prev);
      return next === prev ? prev : next;
    });
  }, [pages, allFields, isInitialized]);

  return {
    formData,
    setFormData,
    handleFieldChange,
    isInitialized,
  };
}
