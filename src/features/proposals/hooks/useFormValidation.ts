import { useCallback, useMemo, useState } from "react";
import type { Field, FieldValidation, Page, SubField } from '@/features/product-config/proposal-form/api/proposalFormDesign';
import { isMetadataActive } from '@/features/product-config/proposal-form/api/proposalFormDesign';
import {
  evaluateConditionalLogic,
  resolveConditionalLogicFieldOptions,
  resolveConditionalLogicFieldValue,
} from '@/features/proposals/utils/conditionalLogic';
import { getConsentFieldValue } from '@/features/product-config/proposal-form/utils/consent';
import {
  buildFormDataWithNormalizedCollections,
  getFormFieldValue,
} from '@/features/proposals/utils/formDataFieldAccess';
import { isCombinationCellEmpty } from '@/features/proposals/utils/validateCombinationGroup';

type ValidationMode = 'full' | 'dateOnly';

function isTruthyRequiredFlag(required: unknown): boolean {
  if (required === true) return true;
  if (required === false || required == null || required === '') return false;
  if (typeof required === 'number') return required === 1;
  const t = String(required).trim().toLowerCase();
  return (
    t === 'true' ||
    t === '1' ||
    t === 'yes' ||
    t === 'y' ||
    t === 'on' ||
    t === 'required'
  );
}

/**
 * Format a numeric validation boundary value with thousand separators
 * when the field is a currency or plain number type. Falls back to the
 * raw value for non-numeric fields (e.g. minLength, date-day rules).
 */
function formatValidationNumber(
  rawValue: string | number | boolean | undefined,
  field: { type?: string; metadata?: unknown },
): string {
  const num = Number(rawValue);
  if (isNaN(num)) return String(rawValue ?? '');

  const meta = field.metadata as { numberFormat?: string } | null | undefined;
  const isCurrency = meta?.numberFormat === 'currency';
  const isNumericField = field.type === 'number' || isCurrency;

  if (!isNumericField) return String(rawValue ?? '');

  return num.toLocaleString('en-US', { maximumFractionDigits: 20 });
}

export function useFormValidation(formData: Record<string, any>, pages: Page[] = []) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formDataForConditionalLogic = useMemo(
    () => buildFormDataWithNormalizedCollections(formData, pages),
    [formData, pages],
  );

  const shouldShowField = useCallback(
    (field: Field) => {
      if (!isMetadataActive(field)) return false;
      if (!field.conditionalLogic) return true;
      const allFields = pages.flatMap((page) => (page.sections || []).flatMap((section) => section.fields || []));
      return evaluateConditionalLogic(
        field.conditionalLogic,
        (fieldRef) => resolveConditionalLogicFieldValue(allFields, formDataForConditionalLogic, fieldRef),
        (fieldRef) => resolveConditionalLogicFieldOptions(allFields, fieldRef),
      );
    },
    [formDataForConditionalLogic, pages]
  );

  // Helper function to evaluate a condition
  const evaluateCondition = useCallback(
    (condition: string, depValue: unknown, value: string): boolean => {
      switch (condition) {
        case "equals":
          return String(depValue ?? "") === String(value);
        case "not_equals":
        case "notEquals":
          return String(depValue ?? "") !== String(value);
        case "contains":
          return String(depValue ?? "")
            .toLowerCase()
            .includes(String(value).toLowerCase());
        case "not_contains":
        case "notContains":
          return !String(depValue ?? "")
            .toLowerCase()
            .includes(String(value).toLowerCase());
        case "greater_than":
        case "greaterThan":
          // Return false if value is empty (condition not satisfied)
          if (depValue === "" || depValue === null || depValue === undefined)
            return false;
          return Number(depValue) > Number(value);
        case "less_than":
        case "lessThan":
          // Return false if value is empty (condition not satisfied)
          if (depValue === "" || depValue === null || depValue === undefined)
            return false;
          return Number(depValue) < Number(value);
        case "greater_than_or_equal":
        case "greaterThanOrEqual":
          // Return false if value is empty (condition not satisfied)
          if (depValue === "" || depValue === null || depValue === undefined)
            return false;
          return Number(depValue) >= Number(value);
        case "less_than_or_equal":
        case "lessThanOrEqual":
          // Return false if value is empty (condition not satisfied)
          if (depValue === "" || depValue === null || depValue === undefined)
            return false;
          return Number(depValue) <= Number(value);
        case "is_empty":
        case "isEmpty":
          return (
            depValue === undefined ||
            depValue === null ||
            depValue === "" ||
            (Array.isArray(depValue) && depValue.length === 0)
          );
        case "is_not_empty":
        case "isNotEmpty":
          return (
            depValue !== undefined &&
            depValue !== null &&
            depValue !== "" &&
            !(Array.isArray(depValue) && depValue.length === 0)
          );
        default:
          return false;
      }
    },
    []
  );

  const isFieldRequired = useCallback(
    (field: Field) => {
      if (isTruthyRequiredFlag(field.required)) return true;
      if (!field.conditionalRequired) return false;

      const { field: dep, condition, value } = field.conditionalRequired;
      const depValue = formDataForConditionalLogic[dep];

      return evaluateCondition(condition, depValue, value);
    },
    [formDataForConditionalLogic, evaluateCondition]
  );

  const isSubFieldRequired = useCallback(
    (subField: SubField, row: Record<string, any>) => {
      if (isTruthyRequiredFlag(subField.required)) return true;
      if (!subField.conditionalRequired) return false;

      const { field: dep, condition, value } = subField.conditionalRequired;
      // Check row data first, then fall back to global form data
      const depValue = row[dep] !== undefined ? row[dep] : formDataForConditionalLogic[dep];

      return evaluateCondition(condition, depValue, value);
    },
    [formDataForConditionalLogic, evaluateCondition]
  );

  const isValueEmpty = (value: any, fieldType?: string) => {
    if (value === undefined || value === null) return true;
    if (fieldType === "checkbox" && (value === false || value === 'false')) return true;
    if (typeof value === "string" && value.trim() === "") return true;
    if (Array.isArray(value) && value.length === 0) return true;

    // For date periods and policy periods, we need both startDate and endDate
    if (fieldType === 'datePeriod' || fieldType === 'policyPeriod') {
      if (typeof value === 'object' && !Array.isArray(value)) {
        return !value.startDate && !value.endDate;
      }
      return true;
    }

    // File/Blob from file input is not empty
    if (typeof File !== "undefined" && value instanceof File) return false;
    if (typeof Blob !== "undefined" && value instanceof Blob) return false;
    if (
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.keys(value).length === 0
    )
      return true;
    return false;
  };

  const runFieldValidations = (
    field: { name: string; label: string; type?: string; validations?: FieldValidation[] },
    value: any,
    errors: Record<string, string>,
    errorKey: string
  ) => {
    if (isValueEmpty(value, field.type)) return;

    // For date periods and policy periods, ensure completeness
    if (field.type === 'datePeriod' || field.type === 'policyPeriod') {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        if ((value.startDate && !value.endDate) || (!value.startDate && value.endDate)) {
          errors[errorKey] = `${field.label} must have both start and end dates`;
          return;
        }
        if (value.startDate && value.endDate && value.endDate < value.startDate) {
          errors[errorKey] = `${field.label} To Date cannot be before From Date`;
          return;
        }
      }
    }

    field.validations?.forEach((validation) => {
      switch (validation.type) {
        case "regex":
        case "pattern":
          if (typeof validation.value === "string") {
            try {
              if (!new RegExp(validation.value).test(String(value))) {
                errors[errorKey] =
                  validation.message || `${field.label} is invalid`;
              }
            } catch {
              errors[errorKey] =
                validation.message || `${field.label} is invalid`;
            }
          }
          break;
        case "min":
          if (Number(value) < Number(validation.value)) {
            errors[errorKey] =
              validation.message ||
              `${field.label} must be at least ${formatValidationNumber(validation.value, field)}`;
          }
          break;
        case "max": {
          // Skip max validation for phone/mobile number fields
          // Phone numbers should use maxLength for character count, not max for numeric value
          const isPhoneField =
            /mobile|phone|contact/i.test(field.label || '') ||
            /mobile|phone|contact/i.test(field.name || '');

          if (!isPhoneField && Number(value) > Number(validation.value)) {
            errors[errorKey] =
              validation.message ||
              `${field.label} must be at most ${formatValidationNumber(validation.value, field)}`;
          }
          break;
        }
        case "minLength":
          if (String(value).length < Number(validation.value)) {
            errors[errorKey] =
              validation.message ||
              `${field.label} must be at least ${validation.value} characters`;
          }
          break;
        case "decimalPlaces": {
          if (typeof value === "number" && !isNaN(value)) {
            const places = Number(validation.value);
            if (isNaN(places)) break;

            const str = value.toString();
            const decimalIndex = str.indexOf('.');

            let actualPlaces = 0;
            if (decimalIndex !== -1) {
              const decimalPart = str.slice(decimalIndex + 1);
              actualPlaces = decimalPart.replace(/0+$/, '').length;
            }

            if (actualPlaces > places) {
              errors[field.name] =
                validation.message ||
                `${field.label} must have at most ${places} decimal place${places !== 1 ? 's' : ''}`;
            }
          }
          break;
        }
        case "maxLength":
          // Use >= to ensure exact length is also considered valid
          // For example, if maxLength is 10, then 10 characters should be valid
          if (String(value).length > Number(validation.value)) {
            errors[errorKey] =
              validation.message ||
              `${field.label} must be at most ${validation.value} characters`;
          }
          break;
        case "email": {
          // Simple email regex
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(String(value))) {
            errors[errorKey] =
              validation.message || "Please enter a valid email address";
          }
          break;
        }
        case "url": {
          //Allow optional http/https and basic URL structure
          const urlRegex =
            /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/[\w\-._~:/?#[\]@!$&'()*+,;=]*)?$/;
          if (!urlRegex.test(String(value))) {
            errors[errorKey] =
              validation.message || "Please enter a valid URL";
          }
          break;
        }
        case "phone": {
          // Allow only digits, spaces, +, -, (, )
          const phoneRegex = /^[0-9+\-\s()]{7,20}$/;
          if (!phoneRegex.test(String(value))) {
            errors[errorKey] =
              validation.message || "Please enter a valid phone number";
          }
          break;
        }
        case "minDateToday": {
          const today = new Date().toISOString().split("T")[0];
          if (String(value) < today) {
            errors[errorKey] =
              validation.message || `${field.label} cannot be in the past`;
          }
          break;
        }
        case "maxDateToday": {
          const today = new Date().toISOString().split("T")[0];
          if (String(value) > today) {
            errors[errorKey] =
              validation.message || `${field.label} cannot be in the future`;
          }
          break;
        }
        case "minDaysFromToday": {
          if (typeof validation.value === "number") {
            const minDate = new Date();
            minDate.setDate(minDate.getDate() + validation.value);
            const minDateStr = minDate.toISOString().split("T")[0];
            if (String(value) < minDateStr) {
              errors[errorKey] =
                validation.message ||
                `${field.label} must be at least ${validation.value} days from today`;
            }
          }
          break;
        }
        case "maxDaysFromToday": {
          if (typeof validation.value === "number") {
            const maxDate = new Date();
            maxDate.setDate(maxDate.getDate() + validation.value);
            const maxDateStr = maxDate.toISOString().split("T")[0];
            if (String(value) > maxDateStr) {
              errors[errorKey] =
                validation.message ||
                `${field.label} must be at most ${validation.value} days from today`;
            }
          }
          break;
        }
        case "minDate": {
          if (typeof validation.value === "string") {
            if (String(value) < validation.value) {
              errors[errorKey] =
                validation.message || `${field.label} is too early`;
            }
          }
          break;
        }
        case "maxDate": {
          if (typeof validation.value === "string") {
            if (String(value) > validation.value) {
              errors[errorKey] =
                validation.message || `${field.label} is too late`;
            }
          }
          break;
        }
        case "from_minDateToday": {
          const today = new Date().toISOString().split("T")[0];
          const dateValue =
            typeof value === "string"
              ? value
              : value?.startDate;

          if (dateValue && dateValue < today) {
            errors[errorKey] =
              validation.message || `${field.label} From Date cannot be in the past`;
          }
          break;
        }
        case "from_maxDateToday": {
          const today = new Date().toISOString().split("T")[0];
          const dateValue =
            typeof value === "string"
              ? value
              : value?.startDate;

          if (dateValue && dateValue > today) {
            errors[errorKey] =
              validation.message || `${field.label} From Date cannot be in the future`;
          }
          break;
        }
        case "from_minDaysFromToday": {
          if (typeof validation.value === "number") {
            const minDate = new Date();
            minDate.setDate(minDate.getDate() + validation.value);
            const minDateStr = minDate.toISOString().split("T")[0];
            const dateValue =
              typeof value === "string"
                ? value
                : value?.startDate;

            if (dateValue && dateValue < minDateStr) {
              errors[errorKey] =
                validation.message ||
                `${field.label} From Date must be at least ${validation.value} days from today`;
            }
          }
          break;
        }
        case "from_maxDaysFromToday": {
          if (typeof validation.value === "number") {
            const maxDate = new Date();
            maxDate.setDate(maxDate.getDate() + validation.value);
            const maxDateStr = maxDate.toISOString().split("T")[0];
            const dateValue =
              typeof value === "string"
                ? value
                : value?.startDate;

            if (dateValue && dateValue > maxDateStr) {
              errors[errorKey] =
                validation.message ||
                `${field.label} From Date must be at most ${validation.value} days from today`;
            }
          }
          break;
        }
        case "from_minDate": {
          if (typeof validation.value === "string") {
            const dateValue =
              typeof value === "string"
                ? value
                : value?.startDate;

            if (dateValue && dateValue < validation.value) {
              errors[errorKey] =
                validation.message || `${field.label} From Date is too early`;
            }
          }
          break;
        }
        case "from_maxDate": {
          if (typeof validation.value === "string") {
            const dateValue =
              typeof value === "string"
                ? value
                : value?.startDate;

            if (dateValue && dateValue > validation.value) {
              errors[errorKey] =
                validation.message || `${field.label} From Date is too late`;
            }
          }
          break;
        }
        case "to_minDateToday": {
          const today = new Date().toISOString().split("T")[0];
          const dateValue =
            typeof value === "string"
              ? value
              : value?.endDate;

          if (dateValue && dateValue < today) {
            errors[errorKey] =
              validation.message || `${field.label} To Date cannot be in the past`;
          }
          break;
        }
        case "to_maxDateToday": {
          const today = new Date().toISOString().split("T")[0];
          const dateValue =
            typeof value === "string"
              ? value
              : value?.endDate;

          if (dateValue && dateValue > today) {
            errors[errorKey] =
              validation.message || `${field.label} To Date cannot be in the future`;
          }
          break;
        }
        case "to_minDaysFromToday": {
          if (typeof validation.value === "number") {
            const minDate = new Date();
            minDate.setDate(minDate.getDate() + validation.value);
            const minDateStr = minDate.toISOString().split("T")[0];
            const dateValue =
              typeof value === "string"
                ? value
                : value?.endDate;

            if (dateValue && dateValue < minDateStr) {
              errors[errorKey] =
                validation.message ||
                `${field.label} To Date must be at least ${validation.value} days from today`;
            }
          }
          break;
        }
        case "to_maxDaysFromToday": {
          if (typeof validation.value === "number") {
            const maxDate = new Date();
            maxDate.setDate(maxDate.getDate() + validation.value);
            const maxDateStr = maxDate.toISOString().split("T")[0];
            const dateValue =
              typeof value === "string"
                ? value
                : value?.endDate;

            if (dateValue && dateValue > maxDateStr) {
              errors[errorKey] =
                validation.message ||
                `${field.label} To Date must be at most ${validation.value} days from today`;
            }
          }
          break;
        }
        case "to_minDate": {
          if (typeof validation.value === "string") {
            const dateValue =
              typeof value === "string"
                ? value
                : value?.endDate;

            if (dateValue && dateValue < validation.value) {
              errors[errorKey] =
                validation.message || `${field.label} To Date is too early`;
            }
          }
          break;
        }
        case "to_maxDate": {
          if (typeof validation.value === "string") {
            const dateValue =
              typeof value === "string"
                ? value
                : value?.endDate;

            if (dateValue && dateValue > validation.value) {
              errors[errorKey] =
                validation.message || `${field.label} To Date is too late`;
            }
          }
          break;
        }
        case "minSelections": {
          if (Array.isArray(value) && typeof validation.value === "number") {
            if (value.length < validation.value) {
              errors[errorKey] =
                validation.message ||
                `${field.label} must have at least ${validation.value} selection${validation.value > 1 ? "s" : ""}`;
            }
          }
          break;
        }
        case "maxSelections": {
          if (Array.isArray(value) && typeof validation.value === "number") {
            if (value.length > validation.value) {
              errors[errorKey] =
                validation.message ||
                `${field.label} cannot have more than ${validation.value} selection${validation.value > 1 ? "s" : ""}`;
            }
          }
          break;
        }
      }
    });
  };

  const validateField = (
    field: Field,
    value: any,
    errors: Record<string, string>
  ) => {
    if (field.type === "consent") {
      const consentValue = getConsentFieldValue(value);

      if (isFieldRequired(field) && consentValue.accepted !== true) {
        errors[field.name] = `${field.label} is required`;
        return;
      }

      return;
    }

    if (field.type === "checkbox") {
      if (isFieldRequired(field) && value !== true && value !== 'true') {
        errors[field.name] = `${field.label} must be checked`;
        return;
      }
      return;
    }

    // Only perform top-level empty check if not a combination field.
    // Combination fields rely on sub-field level validation.
    if (field.type !== "combination" && isFieldRequired(field)) {
      if (isValueEmpty(value, field.type)) {
        errors[field.name] = `${field.label} is required`;
        return;
      }
    }

    if (field.type !== "combination") {
      runFieldValidations(field, value, errors, field.name);
    }
  };

  const isDateFieldType = useCallback(
    (fieldType?: Field['type'] | SubField['type']) => (
      fieldType === 'date' || fieldType === 'datePeriod' || fieldType === 'policyPeriod'
    ),
    []
  );

  const shouldValidateDateField = useCallback(
    (
      field: Pick<Field, 'type'> | Pick<SubField, 'type'>,
      value: unknown,
    ) => isDateFieldType(field.type) && !isValueEmpty(value, field.type),
    [isDateFieldType]
  );

  const validatePageFields = useCallback(
    (page: Page, newErrors: Record<string, string>, mode: ValidationMode) => {
      page.sections?.forEach((section) => {
        if (!isMetadataActive(section)) return;
        section.fields.forEach((field) => {
          const isShown = shouldShowField(field);
          const value = getFormFieldValue(formData, field);

          if (!isShown) return;

          const shouldValidateTopLevelField =
            mode === 'full' || shouldValidateDateField(field, value);

          if (shouldValidateTopLevelField) {
            validateField(field, value, newErrors);
          }

          if (field.type === "repeatable" && Array.isArray(value)) {
            value.forEach((row: any, index: number) => {
              field.subFields?.forEach((subField) => {
                if (!isMetadataActive(subField)) return;
                const required = isSubFieldRequired(subField, row);
                const subValue = row[subField.name];
                const errorKey = `${field.name}.${index}.${subField.name}`;
                const shouldValidateSubField =
                  mode === 'full' || shouldValidateDateField(subField, subValue);

                if (!shouldValidateSubField) return;

                if (mode === 'full' && required && isValueEmpty(subValue, subField.type)) {
                  newErrors[errorKey] = subField.type === "checkbox"
                    ? `${subField.label} must be checked`
                    : `${subField.label} is required`;
                }

                if (
                  subField.validations?.length ||
                  subField.type === 'datePeriod' ||
                  subField.type === 'policyPeriod'
                ) {
                  runFieldValidations(subField, subValue, newErrors, errorKey);
                }
              });
            });
          }

          if (field.type === "combination") {
            const rowsCount = Math.max(field.combinationRowLabels?.length || 0, 1);
            const rows = Array.isArray(value) ? value : [];
            const rowsToValidate = Math.max(rowsCount, rows.length) || 1;
            const activeSubFields =
              field.subFields?.filter((sf) => isMetadataActive(sf)) ?? [];

            const toCell = (sf: SubField) => ({
              name: sf.name,
              type: sf.type as string,
              defaultValue: sf.metadata?.defaultValue,
            });

            const gridHasAnyValue = (): boolean => {
              for (let i = 0; i < rowsToValidate; i++) {
                const row = rows[i] || {};
                for (const sf of activeSubFields) {
                  if (!isCombinationCellEmpty(row, toCell(sf))) return true;
                }
              }
              return false;
            };

            const hasAnySubFieldRequired = (): boolean => {
              for (let i = 0; i < rowsToValidate; i++) {
                const row = rows[i] || {};
                for (const sf of activeSubFields) {
                  if (isSubFieldRequired(sf, row)) return true;
                }
              }
              return false;
            };

            const parentReq = isFieldRequired(field);
            const subReq = hasAnySubFieldRequired();

            if (mode === 'full' && parentReq && !subReq && !gridHasAnyValue()) {
              newErrors[field.name] = `${field.label}: At least one field is required`;
            }

            for (let i = 0; i < rowsToValidate; i++) {
              const row = rows[i] || {};
              field.subFields?.forEach((subField) => {
                if (!isMetadataActive(subField)) return;
                const required = isSubFieldRequired(subField, row);
                const rawSubValue = row[subField.name];
                const metadataDefaultValue = subField.metadata?.defaultValue;
                const effectiveSubValue =
                  rawSubValue !== undefined
                    ? rawSubValue
                    : metadataDefaultValue !== undefined
                      ? metadataDefaultValue
                      : subField.type === "checkbox"
                        ? false
                        : subField.type === "number"
                          ? 0
                          : "";
                const errorKey = `${field.name}.${i}.${subField.name}`;
                const shouldValidateSubField =
                  mode === 'full' || shouldValidateDateField(subField, effectiveSubValue);

                if (!shouldValidateSubField) return;

                if (
                  mode === 'full' &&
                  subReq &&
                  required &&
                  isValueEmpty(effectiveSubValue, subField.type)
                ) {
                  newErrors[errorKey] =
                    subField.type === "checkbox"
                      ? `${subField.label} must be checked`
                      : `${subField.label} is required`;
                }

                if (
                  subField.validations?.length ||
                  subField.type === 'datePeriod' ||
                  subField.type === 'policyPeriod'
                ) {
                  runFieldValidations(subField, effectiveSubValue, newErrors, errorKey);
                }
              });
            }
          }
        });
      });
    },
    [
      formData,
      formDataForConditionalLogic,
      isFieldRequired,
      isSubFieldRequired,
      runFieldValidations,
      shouldShowField,
      shouldValidateDateField,
      validateField,
    ]
  );

  const validatePage = useCallback(
    (page: Page) => {
      console.log("Validating page:", page.title, page.id);
      const newErrors: Record<string, string> = {};
      validatePageFields(page, newErrors, 'full');

      setErrors(newErrors);
      return {
        isValid: Object.keys(newErrors).length === 0,
        errors: newErrors
      };
    },
    [validatePageFields]
  );

  const validatePages = useCallback(
    (pagesToValidate: Page[], mode: ValidationMode = 'full') => {
      const newErrors: Record<string, string> = {};
      let firstInvalidPageId: string | null = null;

      pagesToValidate.forEach((page) => {
        const errorCountBeforePage = Object.keys(newErrors).length;
        validatePageFields(page, newErrors, mode);

        if (firstInvalidPageId === null && Object.keys(newErrors).length > errorCountBeforePage) {
          firstInvalidPageId = page.id;
        }
      });

      setErrors(newErrors);
      return {
        isValid: Object.keys(newErrors).length === 0,
        errors: newErrors,
        firstInvalidPageId,
      };
    },
    [validatePageFields]
  );

  const clearError = useCallback((fieldName: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];

      // Also clear any subfield errors that start with this field name
      Object.keys(newErrors).forEach((key) => {
        if (key.startsWith(`${fieldName}.`)) {
          delete newErrors[key];
        }
      });

      return newErrors;
    });
  }, []);

  return {
    errors,
    validatePage,
    validatePages,
    shouldShowField,
    isFieldRequired,
    clearError,
  };
}
