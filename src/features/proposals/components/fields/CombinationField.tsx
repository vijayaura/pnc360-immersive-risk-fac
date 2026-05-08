import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { FormattedNumberInput } from '@/components/ui/FormattedNumberInput';
import { Textarea } from '@/components/ui/textarea';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { BaseFieldProps } from '../../types/form';
import type {
  ArithmeticCalculationConfig,
  Field,
  SubField,
} from '@/features/product-config/proposal-form/api/proposalFormDesign';
import { FieldLabelWithNote } from './FieldLabelWithNote';
import { getDateValidationConstraints } from '../../utils/dateValidationConstraints';
import { Plus, Upload, Download, X, Eye, MapPin, Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  downloadProposalTemplate,
  uploadProposalTemplate,
} from '@/features/product-config/proposal-form/api/saveProposalForm';
import { parseDatePeriod } from '@/shared/utils/datePeriodParser';
import {
  calculateConfiguredValue,
  evaluateDropdownConditionalCalculation,
  isArithmeticCalculationConfig,
  isDateCalculationConfig,
  isDropdownConditionalCalculationConfig,
} from '@/features/proposals/utils/calculation';
import * as XLSX from 'xlsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Page } from '@/features/product-config/proposal-form/api/proposalFormDesign';
import { shouldShowFieldInPreview } from '@/features/product-config/proposal-form/utils/render-utils';
import { normalizeOptions } from '@/shared/utils/form-helpers';
import { cn } from '@/shared/utils/lib-utils';
import { buildFormDataWithNormalizedCollections } from '@/features/proposals/utils/formDataFieldAccess';
import { buildFileAcceptAttr, validateFileAgainstRules } from '../../utils/fileValidation';
import type { NumberUnit } from '../../types/form';

const NUMBER_UNIT_MULTIPLIER: Record<NumberUnit, number> = {
  millions: 1_000_000,
  hundredThousand: 100_000,
  thousand: 1_000,
};

const buildScrollCursor = (direction: 'left' | 'right') => {
  const arrowPath =
    direction === 'left'
      ? 'M16.5 7.5 11 13l5.5 5.5'
      : 'M9.5 7.5 15 13l-5.5 5.5';

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26">
      <path
        d="${arrowPath}"
        fill="none"
        stroke="#0f172a"
        stroke-width="2.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  `;

  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 13 13, ${direction === 'left' ? 'w-resize' : 'e-resize'}`;
};

const LEFT_SCROLL_CURSOR = buildScrollCursor('left');
const RIGHT_SCROLL_CURSOR = buildScrollCursor('right');

const toRgba = (color: string, alpha: number) => {
  const trimmed = color.trim();

  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) {
    let hex = trimmed.slice(1);
    if (hex.length === 3) {
      hex = hex
        .split('')
        .map((char) => char + char)
        .join('');
    }

    const int = Number.parseInt(hex, 16);
    const r = (int >> 16) & 255;
    const g = (int >> 8) & 255;
    const b = int & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  const rgbMatch = trimmed.match(/^rgb\(\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})\s*\)$/i);
  if (rgbMatch) {
    return `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${alpha})`;
  }

  return null;
};

type ResolveCombinationCalculationValue = (fieldRef: string) => unknown;

function hasCombinationCalculationValue(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function calculateCombinationArithmeticValue(
  calculation: ArithmeticCalculationConfig,
  resolveValue: ResolveCombinationCalculationValue,
): number | null {
  let result: number | null = null;

  const initialRawValue = resolveValue(calculation.initialField);
  if (hasCombinationCalculationValue(initialRawValue)) {
    const initialValue = Number(initialRawValue);
    result = Number.isNaN(initialValue) ? 0 : initialValue;
  }

  calculation.operations?.forEach((op) => {
    const operandType =
      op.operandType || (op.field ? 'field' : op.manualValue !== undefined ? 'manual' : 'field');
    const rawValue =
      operandType === 'manual' ? op.manualValue : op.field ? resolveValue(op.field) : undefined;

    if (!hasCombinationCalculationValue(rawValue)) {
      return;
    }

    const numericValue = Number(rawValue);
    const operandValue = Number.isNaN(numericValue) ? 0 : numericValue;

    if (result === null) {
      result = operandValue;
      return;
    }

    switch (op.operator) {
      case '+':
        result += operandValue;
        break;
      case '-':
        result -= operandValue;
        break;
      case '*':
        result *= operandValue;
        break;
      case '/':
        result = operandValue !== 0 ? result / operandValue : 0;
        break;
      case '%':
        result = operandValue !== 0 ? result % operandValue : 0;
        break;
      case 'percentageOf':
        result = operandValue !== 0 ? (result / operandValue) * 100 : 0;
        break;
    }
  });

  return result;
}

export function CombinationField({
  field,
  value = [],
  onChange,
  isFieldRequired,
  error,
  errors,
  formResponseId,
  formData,
  currency: productCurrency,
  numberUnit,
  productId,
  productThemeColor,
  pages,
  onOpenMap,
  disabled: fieldDisabled,
  disableRatingParameters,
}: BaseFieldProps & { field: Field; formData: Record<string, unknown>; pages?: Page[] }) {
  const { toast } = useToast();
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [openDropdownKey, setOpenDropdownKey] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const formDataForPreview = useMemo(
    () => buildFormDataWithNormalizedCollections(formData || {}, pages || []),
    [formData, pages],
  );
  const activeScrollBlurStyle = useMemo(() => {
    const strong = productThemeColor ? toRgba(productThemeColor, 0.18) : null;
    const soft = productThemeColor ? toRgba(productThemeColor, 0.08) : null;

    return strong && soft
      ? {
          '--combination-scroll-blur-strong': strong,
          '--combination-scroll-blur-soft': soft,
        } as React.CSSProperties
      : undefined;
  }, [productThemeColor]);

  const visibleSubFields = useMemo(() => {
    if (!field.subFields) return [];
    return field.subFields.filter((sf) =>
      shouldShowFieldInPreview(sf as unknown as Field, pages || [], formDataForPreview)
    );
  }, [field.subFields, pages, formDataForPreview]);

  const openPreview = (file: File) => {
    setPreviewFile(file);
    setIsPreviewOpen(true);
  };

  const canPreviewFile = (file: File) => {
    return file.type.startsWith('image/') || file.type === 'application/pdf';
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    rowIndex: number,
    subField: SubField,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const validationError = validateFileAgainstRules(file, subField.label, subField.validations);
      if (validationError) {
        e.target.value = '';
        toast({
          title: 'Invalid file',
          description: validationError,
          variant: 'destructive',
        });
        return;
      }

      updateCell(rowIndex, subField.name, file);
    }
  };
  const configuredRows = Math.max(field.combinationRowLabels?.length || 0, 1);
  const isDependent = !!field.metadata?.rowsDependentField || !!field.dynamicRowsBasedOn;
  const sourceRows = useMemo(() => {
    if (Array.isArray(value) && value.length > 0) {
      return value;
    }

    const fieldValue = (field as { value?: unknown }).value;
    if (Array.isArray(fieldValue) && fieldValue.length > 0) {
      return fieldValue;
    }

    return Array.isArray(value) ? value : [];
  }, [field, value]);
  const actualRows = Array.isArray(sourceRows) ? sourceRows.length : 0;
  const rowsCount = Math.max(configuredRows, actualRows);
  const rows = useMemo(() => (Array.isArray(sourceRows) ? sourceRows : []), [sourceRows]);

  const hasLabels =
    field.combinationRowLabels &&
    field.combinationRowLabels.some((l) => l && String(l).trim() !== '');
  const maximizeAdditionOfRows = field.metadata?.maximizeAdditionOfRows === true;
  const maximumRowCount =
    maximizeAdditionOfRows &&
    typeof field.metadata?.maximumRowCount === 'number' &&
    field.metadata.maximumRowCount > 0
      ? field.metadata.maximumRowCount
      : undefined;
  const hasReference = field.subFields?.some((sf) => sf.metadata?.referenceFieldId);
  const isDropdownReference = field.subFields?.some(
    (sf) => sf.metadata?.referenceFieldId && sf.type === 'dropdown',
  );

  // Allow adding rows even if reference exists (user wants manual control with dropdown options)
  // Also allow if it's dependent but is a dropdown reference (overriding sync)
  const canAddRows = !hasLabels && (!isDependent || !!isDropdownReference);
  const canDeleteRows = !hasLabels && (!isDependent || !!isDropdownReference);
  const minRows = Math.max(field.combinationRowLabels?.length || 0, 1);

  // Calculate options for reference fields
  const referenceOptions = useMemo(() => {
    const optionsMap: Record<string, string[]> = {};
    if (!formData || !pages) return optionsMap;

    field.subFields?.forEach((sf) => {
      const refId = sf.metadata?.referenceFieldId;
      const refName = sf.metadata?.referenceFieldName;
      if ((refId || refName) && sf.type === 'dropdown') {
        const refSubId = sf.metadata.referenceSubFieldId;
        const refSubName = sf.metadata.referenceSubFieldName;

        // Resolve source field
        let sourceField: Field | undefined;
        for (const page of pages) {
          for (const section of page.sections || []) {
            const found = section.fields?.find((f) => {
              if (refId && f.id === refId) return true;
              if (refName && f.name === refName) return true;
              return false;
            });
            if (found) {
              sourceField = found;
              break;
            }
          }
          if (sourceField) break;
        }

        if (sourceField) {
          // Get values
          // Try getting value by ID or Name
          const sourceValue = (formData[sourceField.id] ||
            formData[sourceField.name] ||
            []) as Record<string, unknown>[];

          if (Array.isArray(sourceValue)) {
            // Find the subfield name in source
            let sourceSubFieldName = '';
            if (sourceField.subFields) {
              const foundSub = sourceField.subFields.find((s) => {
                if (refSubId && s.id === refSubId) return true;
                if (refSubName && s.name === refSubName) return true;
                return false;
              });
              if (foundSub) sourceSubFieldName = foundSub.name;
            } else if (refSubName) {
              sourceSubFieldName = refSubName;
            }

            if (sourceSubFieldName) {
              const values = sourceValue
                .map((row) => row[sourceSubFieldName])
                .filter((v) => v !== undefined && v !== null && v !== '')
                .map((v) => String(v));
              // Unique values
              optionsMap[sf.name] = Array.from(new Set(values));
            }
          }
        }
      }
    });
    return optionsMap;
  }, [formData, pages, field.subFields]);

  const subDropdowns = field.subFields?.filter((sf) => sf.type === 'dropdown') || [];
  const firstDropdownSubField = field.subFields?.find((sf) => sf.type === 'dropdown') ?? null;
  const firstDropdownAllowsReselection = Boolean(firstDropdownSubField?.metadata?.allowReselection);

  const usedByField: Record<string, Set<string>> = {};
  for (const sf of subDropdowns) {
    usedByField[sf.name] = new Set(rows.map((r) => r[sf.name]).filter((v) => !!v));
  }

  const canAddNewRow =
    canAddRows &&
    (maximumRowCount === undefined || rows.length < maximumRowCount) &&
    (!firstDropdownSubField ||
      firstDropdownAllowsReselection ||
      !!isDropdownReference ||
      (firstDropdownSubField.metadata?.referenceFieldId
        ? referenceOptions[firstDropdownSubField.name]?.length || 0
        : firstDropdownSubField.options?.length || 0) >
      (usedByField[firstDropdownSubField.name]?.size || 0));

  const findFieldByReference = useMemo(() => {
    return (refFieldId?: string, refFieldName?: string): Field | undefined => {
      if (!pages?.length) return undefined;
      for (const page of pages) {
        for (const section of page.sections || []) {
          const found = section.fields?.find((f) => {
            if (refFieldId && f.id === refFieldId) return true;
            if (refFieldName && f.name === refFieldName) return true;
            return false;
          });
          if (found) return found;
        }
      }
      return undefined;
    };
  }, [pages]);

  const allFields = useMemo(
    () => pages?.flatMap((page) => page.sections || []).flatMap((section) => section.fields || []) || [],
    [pages],
  );

  const isFieldRatingDisabledInChain = useMemo(() => {
    const visit = (targetField: Field | undefined, visited: Set<string>): boolean => {
      if (!disableRatingParameters || !targetField) return false;

      const visitKey = String(targetField.id || targetField.name || '');
      if (visitKey) {
        if (visited.has(visitKey)) return false;
        visited.add(visitKey);
      }

      if ((targetField as { isRatingParameter?: boolean }).isRatingParameter) {
        return true;
      }

      if (
        targetField.subFields?.some((sub) =>
          Boolean((sub as { isRatingParameter?: boolean }).isRatingParameter),
        )
      ) {
        return true;
      }

      const referencedSubFields =
        targetField.subFields?.filter(
          (sub) => sub.metadata?.referenceFieldId || sub.metadata?.referenceFieldName,
        ) || [];

      for (const sub of referencedSubFields) {
        const sourceField = findFieldByReference(
          sub.metadata?.referenceFieldId,
          sub.metadata?.referenceFieldName,
        );

        if (!sourceField) continue;

        const refSubFieldId = sub.metadata?.referenceSubFieldId;
        const refSubFieldName = sub.metadata?.referenceSubFieldName;
        if (refSubFieldId || refSubFieldName) {
          const referencedSubField = sourceField.subFields?.find((sourceSubField) => {
            if (refSubFieldId && sourceSubField.id === refSubFieldId) return true;
            if (refSubFieldName && sourceSubField.name === refSubFieldName) return true;
            return false;
          });

          if (
            referencedSubField &&
            Boolean((referencedSubField as { isRatingParameter?: boolean }).isRatingParameter)
          ) {
            return true;
          }
        }

        if (visit(sourceField, visited)) {
          return true;
        }
      }

      return false;
    };

    return (targetField: Field | undefined) => visit(targetField, new Set<string>());
  }, [disableRatingParameters, findFieldByReference]);

  const isSubFieldDrivingRatingInChain = useMemo(() => {
    const matchesField = (candidateField: Field, targetField: Field) => {
      if (targetField.id && candidateField.id === targetField.id) return true;
      if (targetField.name && candidateField.name === targetField.name) return true;
      return false;
    };

    const matchesSubField = (candidateSubField: SubField, targetSubField: SubField) => {
      if (targetSubField.id && candidateSubField.id === targetSubField.id) return true;
      if (targetSubField.name && candidateSubField.name === targetSubField.name) return true;
      return false;
    };

    const visit = (
      sourceField: Field | undefined,
      sourceSubField: SubField | undefined,
      visited: Set<string>,
    ): boolean => {
      if (!disableRatingParameters || !sourceField || !sourceSubField) return false;

      const visitKey = `${sourceField.id || sourceField.name || 'field'}::${sourceSubField.id || sourceSubField.name || 'subfield'}`;
      if (visited.has(visitKey)) return false;
      visited.add(visitKey);

      for (const candidateField of allFields) {
        const getConnectedSubFields = (startSubField: SubField): SubField[] => {
          const queue: SubField[] = [startSubField];
          const connected = new Map<string, SubField>();

          while (queue.length > 0) {
            const currentSubField = queue.shift();
            if (!currentSubField) continue;

            const currentKey = String(currentSubField.id || currentSubField.name || '');
            if (!currentKey || connected.has(currentKey)) continue;
            connected.set(currentKey, currentSubField);

            for (const siblingSubField of candidateField.subFields || []) {
              const siblingKey = siblingSubField.name || siblingSubField.id;
              const currentName = currentSubField.name || currentSubField.id;
              if (!siblingKey || !currentName) continue;

              if (
                siblingSubField.dependentOn === currentName ||
                currentSubField.dependentOn === siblingKey
              ) {
                queue.push(siblingSubField);
              }
            }
          }

          return Array.from(connected.values());
        };

        for (const candidateSubField of candidateField.subFields || []) {
          const referencesCurrentField =
            (candidateSubField.metadata?.referenceFieldId &&
              sourceField.id &&
              candidateSubField.metadata.referenceFieldId === sourceField.id) ||
            (candidateSubField.metadata?.referenceFieldName &&
              sourceField.name &&
              candidateSubField.metadata.referenceFieldName === sourceField.name);

          if (!referencesCurrentField) continue;

          const referencesCurrentSubField =
            (candidateSubField.metadata?.referenceSubFieldId &&
              sourceSubField.id &&
              candidateSubField.metadata.referenceSubFieldId === sourceSubField.id) ||
            (candidateSubField.metadata?.referenceSubFieldName &&
              sourceSubField.name &&
              candidateSubField.metadata.referenceSubFieldName === sourceSubField.name);

          if (!referencesCurrentSubField) continue;

          if (
            matchesField(candidateField, sourceField) &&
            matchesSubField(candidateSubField, sourceSubField)
          ) {
            continue;
          }

          for (const connectedSubField of getConnectedSubFields(candidateSubField)) {
            if ((connectedSubField as { isRatingParameter?: boolean }).isRatingParameter) {
              return true;
            }

            if (
              !(
                matchesField(candidateField, sourceField) &&
                matchesSubField(connectedSubField, sourceSubField)
              ) &&
              visit(candidateField, connectedSubField, visited)
            ) {
              return true;
            }
          }
        }
      }

      return false;
    };

    return (sourceField: Field | undefined, sourceSubField: SubField | undefined) =>
      visit(sourceField, sourceSubField, new Set<string>());
  }, [allFields, disableRatingParameters]);

  const isSubFieldRatingInvolvementBase = useMemo(() => {
    return (subField: SubField): boolean => {
      if (!disableRatingParameters) return false;

      const isReference =
        Boolean(subField.metadata?.referenceFieldId) || Boolean(subField.metadata?.referenceFieldName);
      const sourceField = isReference
        ? findFieldByReference(
            subField.metadata?.referenceFieldId,
            subField.metadata?.referenceFieldName,
          )
        : undefined;

      const isReferencedSourceRatingDisabled = sourceField
        ? isFieldRatingDisabledInChain(sourceField)
        : false;
      const isDrivingDownstreamRating = isSubFieldDrivingRatingInChain(field, subField);

      return Boolean(
        (subField as { isRatingParameter?: boolean }).isRatingParameter ||
        isDrivingDownstreamRating ||
        isReferencedSourceRatingDisabled
      );
    };
  }, [
    disableRatingParameters,
    field,
    findFieldByReference,
    isFieldRatingDisabledInChain,
    isSubFieldDrivingRatingInChain,
  ]);

  const isSubFieldEffectivelyRatingLocked = useMemo(() => {
    const getRelatedSubFields = (targetSubField: SubField): SubField[] => {
      if (!field.subFields?.length) return [];

      const targetKey = targetSubField.name || targetSubField.id;
      if (!targetKey) return [];

      return field.subFields.filter((candidateSubField) => {
        if (candidateSubField === targetSubField) return true;

        const candidateDependencyKey = candidateSubField.dependentOn;
        const candidateKey = candidateSubField.name || candidateSubField.id;

        return candidateDependencyKey === targetKey || candidateKey === targetSubField.dependentOn;
      });
    };

    const visit = (subField: SubField, visited: Set<string>): boolean => {
      const visitKey = String(subField.id || subField.name || '');
      if (visitKey) {
        if (visited.has(visitKey)) return false;
        visited.add(visitKey);
      }

      if (isSubFieldRatingInvolvementBase(subField)) {
        return true;
      }

      for (const relatedSubField of getRelatedSubFields(subField)) {
        if (relatedSubField === subField) continue;
        if (visit(relatedSubField, visited)) {
          return true;
        }
      }

      return false;
    };

    return (subField: SubField): boolean => {
      if (!disableRatingParameters) return false;
      return visit(subField, new Set<string>());
    };
  }, [disableRatingParameters, field.subFields, isSubFieldRatingInvolvementBase]);

  const isWholeCombinationRowRatingLocked = useMemo(() => {
    if (!disableRatingParameters) return false;
    if (!field.subFields?.length) return false;
    return field.subFields.some((subField) => isSubFieldEffectivelyRatingLocked(subField));
  }, [disableRatingParameters, field.subFields, isSubFieldEffectivelyRatingLocked]);

  const updateCell = (rowIndex: number, name: string, val: unknown) => {
    const next = [...rows];
    next[rowIndex] = {
      ...next[rowIndex],
      [name]: val,
    };
    onChange(field.name, next);
  };

  const resolveCombinationFieldValue = useCallback(
    (row: Record<string, unknown>, _currentSubField: SubField | undefined, ref: string) => {
      const getRowSubFieldValue = (
        targetRow: Record<string, unknown> | undefined,
        subField: SubField | undefined,
      ) => {
        if (!targetRow || !subField) return undefined;

        if (targetRow[subField.name] !== undefined) {
          return targetRow[subField.name];
        }

        const rawCells = (targetRow as { value?: unknown }).value;
        if (!Array.isArray(rawCells)) return undefined;

        const matchedCell = rawCells.find((cell) => {
          if (!cell || typeof cell !== 'object') return false;
          const record = cell as { id?: unknown; label?: unknown };
          return (
            (subField.id && record.id && String(record.id) === String(subField.id)) ||
            (subField.label && record.label && String(record.label) === String(subField.label))
          );
        }) as { value?: unknown } | undefined;

        return matchedCell?.value;
      };

      const isPageFieldRef = ref.startsWith('PAGE__');
      const resolvedRef = ref.replace(/^PAGE__/, '');
      const subMatch = !isPageFieldRef
        ? field.subFields?.find((sub) => sub.id === resolvedRef || sub.name === resolvedRef)
        : undefined;

      if (subMatch) {
        const key = subMatch.name;
        const comboRows =
          (formData?.[field.id] as Record<string, unknown>[]) ||
          (formData?.[field.name] as Record<string, unknown>[]) ||
          [];
        const sourceRow = comboRows.find((candidateRow) => candidateRow?._rowId === row._rowId) || row;
        const raw =
          getRowSubFieldValue(row, subMatch) ??
          getRowSubFieldValue(sourceRow, subMatch);

        if (raw === undefined) {
          const metadataDefaultValue = subMatch.metadata?.defaultValue;
          if (metadataDefaultValue !== undefined) {
            return metadataDefaultValue;
          }
        }

        return raw;
      }

      const globalField =
        allFields.find((candidate) => candidate.id === resolvedRef) ||
        allFields.find((candidate) => candidate.name === resolvedRef);

      if (globalField && formData) {
        return formData[globalField.id] !== undefined
          ? formData[globalField.id]
          : formData[globalField.name];
      }

      if (formData && formData[resolvedRef] !== undefined) {
        return formData[resolvedRef];
      }

      if (!isPageFieldRef && row[resolvedRef] !== undefined) {
        return row[resolvedRef];
      }

      return undefined;
    },
    [allFields, field.id, field.name, field.subFields, formData],
  );

  const resolveDropdownFieldOptions = useCallback(
    (sf: SubField, row: Record<string, unknown>) => {
      const isReference =
        Boolean(sf.metadata?.referenceFieldId) || Boolean(sf.metadata?.referenceFieldName);
      const hasOwnOptions = Array.isArray(sf.options) && sf.options.length > 0;

      let effectiveOptions = hasOwnOptions
        ? sf.options || []
        : isReference
          ? referenceOptions[sf.name] || []
          : sf.options || [];

      if (sf.dependentOn) {
        const parentValue = row[sf.dependentOn];
        if (!parentValue) {
          effectiveOptions = [];
        } else if (sf.dependentOptions) {
          const parentValues =
            typeof parentValue === 'string'
              ? parentValue
                  .split(',')
                  .map((value) => value.trim())
                  .filter((value) => value)
              : Array.isArray(parentValue)
                ? parentValue
                : [parentValue];

          const allDependentOpts = new Set<string>();
          parentValues.forEach((parent) => {
            const options = sf.dependentOptions?.[String(parent)] || [];
            options.forEach((option: unknown) => allDependentOpts.add(String(option)));
          });

          effectiveOptions = Array.from(allDependentOpts);
        } else {
          effectiveOptions = [];
        }
      }

      const normalizedBaseOptions = normalizeOptions(effectiveOptions);

      if (!isDropdownConditionalCalculationConfig(sf.metadata?.calculation)) {
        return {
          options: normalizedBaseOptions,
          defaultValue:
            typeof sf.metadata?.defaultValue === 'string' ? sf.metadata.defaultValue : undefined,
        };
      }

      return (
        evaluateDropdownConditionalCalculation(
          sf.metadata.calculation,
          (ref) => resolveCombinationFieldValue(row, sf, ref),
          (ref) => {
            const resolvedRef = ref.replace(/^PAGE__/, '');
            const localSubField =
              field.subFields?.find((candidate) => candidate.id === resolvedRef || candidate.name === resolvedRef) ||
              null;

            if (localSubField?.type === 'dropdown') {
              return normalizeOptions(localSubField.options);
            }

            const pageField =
              allFields.find((candidate) => candidate.id === resolvedRef) ||
              allFields.find((candidate) => candidate.name === resolvedRef);

            return pageField?.type === 'dropdown' ? normalizeOptions(pageField.options) : [];
          },
          normalizedBaseOptions,
        ) || {
          options: normalizedBaseOptions,
          defaultValue:
            typeof sf.metadata?.defaultValue === 'string' ? sf.metadata.defaultValue : undefined,
        }
      );
    },
    [allFields, field.subFields, referenceOptions, resolveCombinationFieldValue],
  );

  const deletedRowIdsRef = useRef<Set<string>>(new Set());
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const hoverScrollFrameRef = useRef<number | null>(null);
  const hoverScrollVelocityRef = useRef(0);
  const [hoverScrollDirection, setHoverScrollDirection] = useState<'left' | 'right' | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = useCallback(() => {
    const element = scrollContainerRef.current;
    if (!element) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    const { scrollLeft, scrollWidth, clientWidth } = element;
    const maxScrollLeft = Math.max(scrollWidth - clientWidth, 0);
    const scrollTolerance = 4;

    setCanScrollLeft(scrollLeft > scrollTolerance);
    setCanScrollRight(scrollLeft < maxScrollLeft - scrollTolerance);
  }, []);

  const stopHoverScroll = useCallback(() => {
    hoverScrollVelocityRef.current = 0;
    setHoverScrollDirection(null);
    if (hoverScrollFrameRef.current !== null) {
      cancelAnimationFrame(hoverScrollFrameRef.current);
      hoverScrollFrameRef.current = null;
    }
  }, []);

  const ensureHoverScroll = useCallback(() => {
    if (hoverScrollFrameRef.current !== null) return;

    const tick = () => {
      const element = scrollContainerRef.current;
      const velocity = hoverScrollVelocityRef.current;

      if (!element || velocity === 0) {
        hoverScrollFrameRef.current = null;
        return;
      }

      const previousScrollLeft = element.scrollLeft;
      element.scrollLeft += velocity;

      if (element.scrollLeft === previousScrollLeft) {
        hoverScrollVelocityRef.current = 0;
        hoverScrollFrameRef.current = null;
        return;
      }

      hoverScrollFrameRef.current = requestAnimationFrame(tick);
    };

    hoverScrollFrameRef.current = requestAnimationFrame(tick);
  }, []);

  const handleHoverAutoScroll = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const element = scrollContainerRef.current;
      if (!element || (!canScrollLeft && !canScrollRight)) {
        stopHoverScroll();
        return;
      }

      const bounds = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const edgeThreshold = Math.min(96, Math.max(56, bounds.width * 0.12));
      const maxVelocity = 18;
      let nextVelocity = 0;

      if (x <= edgeThreshold && canScrollLeft) {
        const intensity = 1 - x / edgeThreshold;
        nextVelocity = -Math.max(1.5, intensity * maxVelocity);
      } else if (x >= bounds.width - edgeThreshold && canScrollRight) {
        const intensity = 1 - (bounds.width - x) / edgeThreshold;
        nextVelocity = Math.max(1.5, intensity * maxVelocity);
      }

      hoverScrollVelocityRef.current = nextVelocity;
      setHoverScrollDirection(nextVelocity < 0 ? 'left' : nextVelocity > 0 ? 'right' : null);

      if (nextVelocity === 0) {
        stopHoverScroll();
        return;
      }

      ensureHoverScroll();
    },
    [canScrollLeft, canScrollRight, ensureHoverScroll, stopHoverScroll],
  );

  const setScrollAreaRoot = useCallback((node: HTMLDivElement | null) => {
    scrollContainerRef.current = node?.querySelector(
      '[data-radix-scroll-area-viewport]',
    ) as HTMLDivElement | null;
    updateScrollButtons();
  }, [updateScrollButtons]);

  useEffect(() => {
    if (isDependent || (hasReference && !isDropdownReference)) return;
    if (rows.length > 0) return;
    if (!rowsCount) return;

    const baseRow: Record<string, unknown> = {
      _rowId: crypto.randomUUID(),
    };

    field.subFields?.forEach((sf) => {
      const metadataDefaultValue = sf.metadata?.defaultValue;
      if (metadataDefaultValue !== undefined) {
        baseRow[sf.name] = metadataDefaultValue;
      } else if (sf.type === 'checkbox') {
        baseRow[sf.name] = false;
      } else if (sf.type === 'number') {
        baseRow[sf.name] = '';
      } else {
        baseRow[sf.name] = '';
      }
    });

    const initialRows = Array.from({ length: rowsCount }, () => ({
      ...baseRow,
      _rowId: crypto.randomUUID(),
    }));

    onChange(field.name, initialRows);
  }, [isDependent, hasReference, rows.length, rowsCount, field.subFields, field.name, onChange]);

  useEffect(() => {
    if (!Array.isArray(rows)) return;
    if (!field.subFields || field.subFields.length === 0) return;

    let hasChanges = false;

    const normalizedRows = rows.map((row) => {
      const newRow: Record<string, unknown> = { ...row };

      if (Array.isArray((row as { value?: unknown }).value)) {
        const parsedRow: Record<string, unknown> = {
          _rowId:
            typeof (row as { _rowId?: unknown })._rowId === 'string' &&
            String((row as { _rowId?: unknown })._rowId).trim() !== ''
              ? (row as { _rowId: string })._rowId
              : crypto.randomUUID(),
        };

        ((row as { value: Array<{ id?: string; label?: string; value: unknown }> }).value || []).forEach(
          (subItem) => {
            const matchedSubField =
              field.subFields?.find(
                (subField) => subField.id && subItem.id && subField.id === subItem.id,
              ) ||
              field.subFields?.find((subField) => subField.label === subItem.label);

            if (matchedSubField) {
              parsedRow[matchedSubField.name] = subItem.value;
            }
          },
        );

        Object.assign(newRow, parsedRow);
        delete (newRow as { value?: unknown }).value;
        hasChanges = true;
      }

      field.subFields?.forEach((sf) => {
        if (sf.metadata?.referenceFieldId) return;

        if (newRow[sf.name] === undefined) {
          const metadataDefaultValue = sf.metadata?.defaultValue;

          if (metadataDefaultValue !== undefined) {
            newRow[sf.name] = metadataDefaultValue;
          } else if (sf.type === 'checkbox') {
            newRow[sf.name] = false;
          } else if (sf.type === 'number') {
            newRow[sf.name] = '';
          } else {
            newRow[sf.name] = '';
          }

          hasChanges = true;
        }
      });

      return newRow;
    });

    if (hasChanges) {
      onChange(field.name, normalizedRows);
    }
  }, [rows, field.subFields, field.name, onChange]);

  useEffect(() => {
    const element = scrollContainerRef.current;
    if (!element) return;

    updateScrollButtons();

    const handleScroll = () => updateScrollButtons();
    element.addEventListener('scroll', handleScroll, { passive: true });

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => updateScrollButtons())
        : null;

    resizeObserver?.observe(element);

    return () => {
      element.removeEventListener('scroll', handleScroll);
      resizeObserver?.disconnect();
    };
  }, [rowsCount, field.subFields?.length, updateScrollButtons]);

  useEffect(() => stopHoverScroll, [stopHoverScroll]);

  // Sync Logic for Reference Fields
  useEffect(() => {
    if (!pages) return;

    // Skip auto-sync if we want to use reference fields as dropdown options instead
    // We detect this if any reference field is configured as 'dropdown'
    const referenceFields = field.subFields?.filter((sf) => sf.metadata?.referenceFieldId);
    if (!referenceFields || referenceFields.length === 0) return;

    const isDropdownReference = referenceFields.some((sf) => sf.type === 'dropdown');
    if (isDropdownReference) return;

    // Use the first reference field to drive row count
    const primaryRef = referenceFields[0];
    const sourceFieldId = primaryRef.metadata?.referenceFieldId;
    const sourceFieldName = primaryRef.metadata?.referenceFieldName;

    if (!sourceFieldId && !sourceFieldName) return;

    // Resolve source field
    let sourceField: Field | undefined;
    let sourceValue: Record<string, unknown>[] = [];

    // Find the source field in pages
    for (const page of pages) {
      for (const section of page.sections || []) {
        // Try to match by ID or Name
        const found = section.fields?.find((f) => {
          if (sourceFieldId && f.id === sourceFieldId) return true;
          if (sourceFieldName && f.name === sourceFieldName) return true;
          return false;
        });
        if (found) {
          sourceField = found;
          break;
        }
      }
      if (sourceField) break;
    }

    if (sourceField) {
      // Try getting value by ID or Name
      sourceValue = (formData[sourceField.id] || formData[sourceField.name] || []) as Record<
        string,
        unknown
      >[];
    } else {
      // Fallback: Try looking up directly in formData by ID or Name
      sourceValue = (formData[sourceFieldId] ||
        (sourceFieldName ? formData[sourceFieldName] : []) ||
        []) as Record<string, unknown>[];
    }

    if (!Array.isArray(sourceValue)) return;

    let hasChanges = false;
    let nextRows = Array.isArray(value) ? [...value] : [];

    // 1. Sync Row Count (Append Only)
    // We use _rowId to match rows.

    // First, ensure all source rows have _rowId (if not, we can't reliably sync)
    // But since source is also a combination field, it should have them if we updated addRow.
    // However, existing data might not. We can auto-assign transient IDs if missing,
    // but better if they are stable. We assume source handles its own ID generation.

    // Iterate over source rows and update/add to nextRows
    sourceValue.forEach((sourceRow) => {
      if (!sourceRow || typeof sourceRow !== 'object') return;

      // If source row doesn't have ID, we can't sync it reliably for deletion.
      // Fallback to index-based if ID is missing? No, that causes the "delete shifts" bug.
      // We MUST assume IDs exist or generate them on the fly?
      // If we generate on the fly here, they won't match next render.
      // So we just skip if no ID? Or fallback to index?
      // Let's assume ID exists for now (since we added it to addRow).

      const sourceId = sourceRow._rowId as string | undefined;

      // If source ID is missing (legacy data), generate one on the fly for matching?
      // Or fallback to index-based logic just for this row?
      // Better to assume legacy rows map 1:1 if no IDs are present.

      let effectiveSourceId = sourceId;
      if (!effectiveSourceId) {
        // If source has no ID, we can't do robust sync.
        // BUT we must show the row!
        // Let's generate a temporary ID based on index to allow rendering.
        // This is a fallback for legacy/unsaved data.
        effectiveSourceId = `legacy_index_${sourceValue.indexOf(sourceRow)}`;
      }

      const existingRowIndex = nextRows.findIndex(
        (r) => (r as Record<string, unknown>)._sourceRowId === effectiveSourceId,
      );

      if (existingRowIndex !== -1) {
        // Update existing row (even if hidden)
        const existingRow = nextRows[existingRowIndex];

        // Sync values
        let rowChanged = false;
        const newRow = { ...existingRow };

        referenceFields.forEach((refSf) => {
          const refSubId = refSf.metadata?.referenceSubFieldId;
          const refSubFieldName = refSf.metadata?.referenceSubFieldName;

          let sourceSubFieldName = '';
          if (sourceField && sourceField.subFields) {
            const foundSub = sourceField.subFields.find((sf) => {
              if (refSubId && sf.id === refSubId) return true;
              if (refSubFieldName && sf.name === refSubFieldName) return true;
              return false;
            });
            if (foundSub) sourceSubFieldName = foundSub.name;
          } else if (refSubFieldName) {
            sourceSubFieldName = refSubFieldName;
          }

          if (sourceSubFieldName) {
            const sourceCellVal = sourceRow[sourceSubFieldName];
            if (newRow[refSf.name] !== sourceCellVal) {
              newRow[refSf.name] = sourceCellVal;
              rowChanged = true;
            }
          }
        });

        if (rowChanged) {
          nextRows[existingRowIndex] = newRow;
          hasChanges = true;
        }
      } else {
        // New row from source.
        // CHECK: Did we previously delete this row?
        // We can check if any *other* rows have this source ID (already handled by findIndex).
        // But if user deleted it, it's GONE from nextRows.
        // We need a way to know "User deleted SourceID X".
        // Without soft delete, we can't know.
        // BUT user said "it is just emptying the value".
        // The previous bug was probably syncing issue.
        // Simplest logic as requested:
        // "Show delete button and delete that row if user clicks on delete"
        // AND "Don't allow to add there"
        // So we only ADD rows if they are NEW in source (not just missing in target).

        // Problem: If I delete Row A in target, next render loop sees Row A in source.
        // It says "Row A missing in target, add it!". So it comes back.
        // To prevent this without soft-delete, we need to track "deleted source IDs".
        // OR we just assume: If source has MORE rows than target, we append.
        // BUT that breaks ID mapping (Row 2 becomes Row 1).

        // User said: "WTF when I click on delete... it is just emptying the value".
        // This suggests the soft-delete logic was visually hiding it but maybe not fully working or confusing.

        // Let's go back to the APPEND ONLY logic but with ID mapping?
        // If we can't track deleted IDs, we can't distinguish "User deleted this" vs "New row".

        // Maybe we just allow it to come back if source updates?
        // User said: "allow to delete but don't allow to add there".

        // Let's try this:
        // We only sync rows that ALREADY EXIST in target.
        // AND we append new rows ONLY if they are truly new (created after our last sync).
        // That's hard to know.

        // Alternative:
        // We store `_deletedSourceRowIds` in a hidden field or metadata? No.

        // Let's implement the "Append Only" logic strictly.
        // We iterate source rows.
        // If match found in target -> Update values.
        // If NO match found -> Add it?
        // IF we Add it, it undoes the delete.

        // Let's look at what user asked: "Write the straight forward logic".
        // Straight forward:
        // 1. If I delete a row, it's gone.
        // 2. If source adds a NEW row, it appears.

        // How to distinguish "Deleted Row A" from "New Row C"?
        // Only by ID.
        // If we don't persist "Deleted IDs", we can't.

        // BUT maybe we can just accept that "If you delete it, it comes back on next reload/sync" is annoying.
        // However, the "emptying value" bug likely came from the soft-delete rendering logic.

        // Let's try this:
        // We will add the row back ONLY if it is NOT in the `rows` array.
        // Wait, that's the same.

        // What if we maintain a local state of `deletedRowIds` in the component?
        // That works for the session. If they save and reload, it might come back?
        // No, if they save, the target has fewer rows.
        // On reload, source has N, target has N-1.
        // Sync sees N vs N-1. It sees missing ID. It adds it back.

        // The ONLY way to persist deletion is to store "I deleted X".
        // OR to change the sync logic:
        // "Sync values for matching IDs. Do NOT add missing IDs automatically."
        // "Only add missing IDs if...?"

        // If we NEVER add missing IDs, then new source rows never appear.

        // Correct Logic with `_hidden`:
        // The `_hidden` approach WAS the correct way to handle this (Soft Delete).
        // User said "it is just emptying the value".
        // This implies the row was still there (taking up space) but empty?
        // Or maybe my rendering logic for `_hidden` was wrong?
        // I did `filter(r => !r._hidden)`. So it should have disappeared.

        // Let's re-read the user complaint:
        // "when I click on delete in combination field 2 then it is just emptying the value of the dependent field"
        // Maybe `onChange` was called with the full array (including hidden),
        // but the parent component or form engine re-rendered it poorly?

        // If I remove `_hidden` logic and use direct filter:
        // `const next = rows.filter((_, idx) => idx !== rowIndex);`
        // Then the row is gone from `value`.
        // Then `useEffect` runs.
        // It sees source row exists. It sees target row missing.
        // It adds it back.

        // To fix this without soft-delete:
        // We need to persist the deletion.
        // But we can't change the data structure easily.

        // Wait, if I use `_sourceRowId`, I can check if the current row was added *by this sync cycle*? No.

        // Let's try the "Append Only based on Count" logic again?
        // No, that breaks sorting/matching.

        // Let's go with: **Only sync existing rows**.
        // New rows in source are added.
        // How to know if it's new?
        // We can't easily.

        // Let's try this:
        // We assume that if `nextRows` doesn't have the ID, and it's present in `source`,
        // it *might* be a deleted row.
        // UNLESS we are initializing (first load).

        // What if we just don't auto-add rows in the effect?
        // We add a "Sync Rows" button? No, user wants auto.

        // Let's look at the `_hidden` implementation again.
        // I filtered `rows` at the top level: `const rows = ... filter(!hidden)`.
        // Render mapped `rows`.
        // So visually it should be gone.
        // `onChange` sent the hidden row back to form state.
        // Maybe `FieldRenderer` is doing something with the value?
        // It passes `formData` back to us.

        // If I use the "Simple Delete" (hard delete):
        // I need to prevent the `useEffect` from re-adding it.
        // I can use a `ref` to store `deletedSourceIds` during the session.
        // This solves it for the current editing session.
        // If they save and reload, the row is gone from target.
        // On reload, `deletedSourceIds` is empty.
        // Sync sees missing row. Adds it back.
        // This effectively means "Un-deleting" on reload.
        // This might be acceptable behavior? "If I delete it, it stays deleted while I'm here. If I reload, it syncs again."

        // Let's try implementing `deletedSourceIds` via `useRef`.

        const isDeleted = deletedRowIdsRef.current.has(effectiveSourceId as string);
        if (!isDeleted) {
          const newRow: Record<string, unknown> = {
            _rowId: crypto.randomUUID(),
            _sourceRowId: effectiveSourceId,
          };

          field.subFields?.forEach((sf) => {
            const isRef = referenceFields.some((ref) => ref.name === sf.name);
            const metadataDefaultValue = sf.metadata?.defaultValue;

            if (isRef) {
              const refSubId = sf.metadata?.referenceSubFieldId;
              const refSubFieldName = sf.metadata?.referenceSubFieldName;
              let sourceSubFieldName = '';

              if (sourceField && sourceField.subFields) {
                const foundSub = sourceField.subFields.find((s) => {
                  if (refSubId && s.id === refSubId) return true;
                  if (refSubFieldName && s.name === refSubFieldName) return true;
                  return false;
                });

                if (foundSub) {
                  sourceSubFieldName = foundSub.name;
                }
              } else if (refSubFieldName) {
                sourceSubFieldName = refSubFieldName;
              }

              if (sourceSubFieldName) {
                const sourceVal = sourceRow[sourceSubFieldName];
                if (sourceVal !== undefined) {
                  newRow[sf.name] = sourceVal;
                } else if (metadataDefaultValue !== undefined) {
                  newRow[sf.name] = metadataDefaultValue;
                } else if (sf.type === 'checkbox') {
                  newRow[sf.name] = false;
                } else if (sf.type === 'number') {
                  newRow[sf.name] = '';
                } else {
                  newRow[sf.name] = '';
                }
              } else if (metadataDefaultValue !== undefined) {
                newRow[sf.name] = metadataDefaultValue;
              } else if (sf.type === 'checkbox') {
                newRow[sf.name] = false;
              } else if (sf.type === 'number') {
                newRow[sf.name] = '';
              } else {
                newRow[sf.name] = '';
              }
            } else if (metadataDefaultValue !== undefined) {
              newRow[sf.name] = metadataDefaultValue;
            } else if (sf.type === 'checkbox') {
              newRow[sf.name] = false;
            } else if (sf.type === 'number') {
              newRow[sf.name] = '';
            } else {
              newRow[sf.name] = '';
            }
          });

          nextRows.push(newRow);
          hasChanges = true;
        }
      }
    });

    // Check for deleted source rows
    const validSourceIds = new Set(
      sourceValue.map((r) => r._rowId || `legacy_index_${sourceValue.indexOf(r)}`),
    );
    const rowsToRemove = nextRows
      .map((r, idx) => ({ ...r, originalIndex: idx }))
      .filter(
        (r) =>
          (r as Record<string, unknown>)._sourceRowId &&
          !validSourceIds.has((r as Record<string, unknown>)._sourceRowId as string),
      );

    if (rowsToRemove.length > 0) {
      // Remove them (filter out)
      nextRows = nextRows.filter(
        (r) =>
          !(r as Record<string, unknown>)._sourceRowId ||
          validSourceIds.has((r as Record<string, unknown>)._sourceRowId as string),
      );
      hasChanges = true;
    }

    if (hasChanges) {
      onChange(field.name, nextRows);
    }
  }, [formData, field.subFields, value, onChange, pages]);

  // Effect to handle calculations
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    let hasChanges = false;
    const nextRows = rows.map((row) => {
      const newRow = { ...row };
      let rowChanged = false;

      field.subFields?.forEach((sf) => {
        const calculation = sf.metadata?.calculation;
        // Only process if calculation config exists
        const getValue = (ref: string) => resolveCombinationFieldValue(newRow, sf, ref);

        if (isDropdownConditionalCalculationConfig(calculation) && sf.type === 'dropdown') {
          const dropdownState = resolveDropdownFieldOptions(sf, newRow);
          const allowedValues = new Set(dropdownState.options.map((option) => option.value));
          const currentValue =
            newRow[sf.name] && typeof newRow[sf.name] === 'object'
              ? String((newRow[sf.name] as Record<string, unknown>)?.value ?? '')
              : newRow[sf.name]
                ? String(newRow[sf.name])
                : '';

          const nextValue =
            currentValue && allowedValues.has(currentValue)
              ? currentValue
              : dropdownState.defaultValue && allowedValues.has(dropdownState.defaultValue)
                ? dropdownState.defaultValue
                : currentValue && !allowedValues.has(currentValue)
                  ? ''
                  : currentValue;

          if (currentValue !== nextValue) {
            newRow[sf.name] = nextValue;
            rowChanged = true;
            hasChanges = true;
          }
          return;
        }

        if (calculation?.initialField) {
          const result = isArithmeticCalculationConfig(calculation)
            ? calculateCombinationArithmeticValue(calculation, getValue)
            : calculateConfiguredValue(calculation, getValue);
          if (result === null) {
            if (newRow[sf.name] !== '') {
              newRow[sf.name] = '';
              rowChanged = true;
              hasChanges = true;
            }
            return;
          }

          // Only update if value is different to avoid infinite loops
          if (newRow[sf.name] !== result) {
            newRow[sf.name] = result;
            rowChanged = true;
            hasChanges = true;
          }
        }
      });
      return rowChanged ? newRow : row;
    });

    if (hasChanges) {
      onChange(field.name, nextRows);
    }
  }, [
    rows,
    field.subFields,
    onChange,
    formData,
    field.name,
    resolveCombinationFieldValue,
    resolveDropdownFieldOptions,
  ]);

  const addRow = () => {
    const newRow: Record<string, unknown> = {
      _rowId: crypto.randomUUID(), // Ensure stable ID
    };

    field.subFields?.forEach((sf) => {
      const metadataDefaultValue = sf.metadata?.defaultValue;
      if (metadataDefaultValue !== undefined) {
        newRow[sf.name] = metadataDefaultValue;
      } else if (sf.type === 'checkbox') {
        newRow[sf.name] = false;
      } else if (sf.type === 'number') {
        newRow[sf.name] = '';
      } else {
        newRow[sf.name] = '';
      }
    });
    const currentDisplayed = Math.max(configuredRows, rows.length);
    const neededLength = currentDisplayed + 1;
    const itemsToAdd = neededLength - rows.length;

    const additionalRows = Array(itemsToAdd)
      .fill(null)
      .map(() => ({ ...newRow, _rowId: crypto.randomUUID() })); // Ensure each new row has unique ID

    const next = [...rows, ...additionalRows];
    onChange(field.name, next);
  };

  const removeRow = (rowIndex: number) => {
    if (isWholeCombinationRowRatingLocked) return;
    // If it's a reference field, we might allow deleting down to 0 or 1.
    // Assuming standard minRows logic applies.
    if (rows.length <= minRows && !canDeleteRows) return;

    // Track the deleted source row ID if it exists
    const rowToDelete = rows[rowIndex];
    const sourceId = rowToDelete?._sourceRowId;
    if (sourceId) {
      deletedRowIdsRef.current.add(sourceId);
    }

    const next = rows.filter((_, idx) => idx !== rowIndex);
    onChange(field.name, next);
  };

  const columnWidths =
    visibleSubFields.map((sf) =>
      sf.type === 'datePeriod' || sf.type === 'location'
        ? 'minmax(500px, 1fr)'
        : 'minmax(200px, 1fr)',
    ) || [];

  if (hasLabels) {
    columnWidths.unshift('minmax(200px, 1fr)');
  }

  // Use a perfectly aligned grid if there are exactly 2 standard subfields (matches md:grid-cols-2 gap-x-6 padding mathematically)
  const isStandard2Col = !hasLabels && visibleSubFields.length === 2 && columnWidths.every(w => w === 'minmax(200px, 1fr)');

  const gridTemplateColumns = isStandard2Col
    ? `calc(50% - 12px) 1fr`
    : (canAddRows || canDeleteRows ? `${columnWidths.join(' ')} 50px` : columnWidths.join(' '));

  // Helper function to export data to CSV
  const exportToCSV = (): string => {
    const headers = visibleSubFields.map((sf) => sf.label);
    const headerRow = hasLabels ? ['Label', ...headers].join(',') : headers.join(',');

    const dataRows = rows.map((row, idx) => {
      const values =
        visibleSubFields.map((sf) => {
          const value = row[sf.name] ?? '';
          // Escape commas and quotes in CSV
          const stringValue = String(value);
          if (
            stringValue.includes(',') ||
            stringValue.includes('"') ||
            stringValue.includes('\n')
          ) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        });

      if (hasLabels) {
        const label = field.combinationRowLabels?.[idx] || `Row ${idx + 1}`;
        return [label, ...values].join(',');
      }
      return values.join(',');
    });

    return [headerRow, ...dataRows].join('\n');
  };

  const importFromFile = (file: File) => {
    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        let workbook: XLSX.WorkBook;

        // Check file type and parse accordingly
        if (file.name.endsWith('.csv')) {
          // Parse CSV
          const text = data as string;
          workbook = XLSX.read(text, { type: 'string' });
        } else {
          // Parse Excel (.xlsx, .xls)
          workbook = XLSX.read(data, { type: 'binary' });
        }

        // Get the first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const jsonData: unknown[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length < 2) {
          toast({
            title: 'Import Error',
            description: 'File must contain headers and at least one row of data',
            variant: 'destructive',
          });
          return;
        }

        const headers = jsonData[0];
        const dataRows = jsonData.slice(1);

        // Track validation issues
        const validationIssues: {
          row: number;
          field: string;
          message: string;
          type: 'error' | 'warning';
        }[] = [];

        const importedRows = dataRows.map((rowValues, rowIdx) => {
          const row: Record<string, unknown> = {};

          let startIdx = 0;
          if (hasLabels) {
            startIdx = 1; // Skip the label column
          }

          field.subFields?.forEach((sf, idx) => {
            const valueIdx = startIdx + idx;
            if (valueIdx < rowValues.length) {
              const value = rowValues[valueIdx];

              // Handle datePeriod type
              if (sf.type === 'datePeriod') {
                if (value && String(value).trim() !== '') {
                  const parsed = parseDatePeriod(String(value));

                  if (parsed.isValid) {
                    // Store as object with startDate and endDate
                    row[sf.name] = {
                      startDate: parsed.startDate,
                      endDate: parsed.endDate,
                    };

                    // Log warnings if any
                    if (parsed.warnings.length > 0) {
                      parsed.warnings.forEach((warning) => {
                        validationIssues.push({
                          row: rowIdx + 2, // +2 because: +1 for header, +1 for 1-indexed
                          field: sf.label || sf.name,
                          message: warning,
                          type: 'warning',
                        });
                      });
                    }
                  } else {
                    // Invalid date period - store empty and log error
                    row[sf.name] = {
                      startDate: '',
                      endDate: '',
                    };

                    parsed.errors.forEach((error) => {
                      validationIssues.push({
                        row: rowIdx + 2,
                        field: sf.label || sf.name,
                        message: error,
                        type: 'error',
                      });
                    });
                  }
                } else {
                  // Empty value
                  row[sf.name] = {
                    startDate: '',
                    endDate: '',
                  };
                }
              }
              // Convert to appropriate type for other field types
              else if (sf.type === 'number') {
                row[sf.name] = value ? parseFloat(String(value)) : '';
              } else if (sf.type === 'checkbox') {
                row[sf.name] =
                  value === true ||
                  value === 'true' ||
                  value === 'TRUE' ||
                  value === 1 ||
                  value === '1';
              } else {
                row[sf.name] = value !== undefined && value !== null ? String(value) : '';
              }
            } else {
              // No value provided
              if (sf.type === 'datePeriod') {
                row[sf.name] = {
                  startDate: '',
                  endDate: '',
                };
              } else {
                row[sf.name] = sf.type === 'checkbox' ? false : '';
              }
            }
          });

          return row;
        });

        onChange(field.name, importedRows);

        // Show validation summary
        const errorCount = validationIssues.filter((i) => i.type === 'error').length;
        const warningCount = validationIssues.filter((i) => i.type === 'warning').length;

        if (errorCount > 0 || warningCount > 0) {
          // Show first 3 specific issues
          const issuesList = validationIssues
            .slice(0, 3)
            .map((issue) => `Row ${issue.row}: ${issue.message}`)
            .join('\n');

          const remaining = validationIssues.length - 3;
          const moreText = remaining > 0 ? `\n+${remaining} more` : '';

          toast({
            title: errorCount > 0 ? '⚠️ Import Issues Found' : 'ℹ️ Please Review',
            description: `${issuesList}${moreText}`,
            variant: errorCount > 0 ? 'destructive' : 'default',
            duration: 20000,
          });
        } else {
          toast({
            title: '✅ Success',
            description: `${importedRows.length} row${importedRows.length > 1 ? 's' : ''} imported successfully`,
            duration: 20000,
          });
        }
      } catch (error) {
        console.error('Import error:', error);
        toast({
          title: 'Import Error',
          description: 'Failed to parse file. Please check the file format.',
          variant: 'destructive',
        });
      } finally {
        setIsImporting(false);
      }
    };
    reader.onerror = () => {
      setIsImporting(false);
      toast({
        title: 'Import Error',
        description: 'Failed to read file. Please try again.',
        variant: 'destructive',
      });
    };

    // Read file based on type
    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };

  const validateRowsForExport = (): string[] => {
    const today = new Date().toISOString().split('T')[0];
    const issues: string[] = [];

    rows.forEach((rowValue, rowIndex) => {
      visibleSubFields.forEach((sf) => {
        if (!sf.validations?.length) return;

        const rowCellValue = rowValue?.[sf.name];
        if (rowCellValue === undefined || rowCellValue === null || rowCellValue === '') return;

        sf.validations.forEach((validation) => {
          if (validation.type !== 'maxDateToday') return;

          const parsedDate =
            typeof rowCellValue === 'string'
              ? rowCellValue.split('T')[0]
              : String(rowCellValue).split('T')[0];

          if (parsedDate && parsedDate > today) {
            issues.push(
              `Row ${rowIndex + 1}: ${sf.label || sf.name} cannot be in the future`,
            );
          }
        });
      });
    });

    return issues;
  };

  const isTableBusy = isImporting || isExporting;
  const tableBusyLabel = isImporting ? 'Importing...' : 'Exporting...';

  const groupErrorMessage =
    error ||
    errors?.[`${field.name}.__group`] ||
    errors?.[field.name];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <FieldLabelWithNote
          label={field.label}
          required={isFieldRequired(field)}
          note={field.metadata?.note}
        />

        <div className="flex items-center gap-2">
          {/* Import/Export Buttons */}
          {field.metadata?.addImportExportButton && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs"
                disabled={isTableBusy}
                onClick={async () => {
                  setIsExporting(true);
                  try {
                    const exportValidationIssues = validateRowsForExport();
                    if (exportValidationIssues.length > 0) {
                      toast({
                        title: 'Validation Error',
                        description: exportValidationIssues[0],
                        variant: 'destructive',
                      });
                      return;
                    }

                    // Try to get productId from props or field
                    const effectiveProductId = productId || field.productId;
                    if (!effectiveProductId) {
                       throw new Error("Product ID is required to export template");
                    }

                    // Attempt to find sectionId. Usually sections have IDs if coming from the backend.
                    let sectionId = (field as Field & { sectionId?: string }).sectionId;
                    if (!sectionId && pages) {
                      for (const page of pages) {
                        const section = page.sections?.find((s) => s.fields.some((f) => f.id === field.id));
                        if (section?.id) {
                          sectionId = section.id;
                          break;
                        }
                      }
                    }

                    if (!sectionId) {
                      throw new Error("Section ID could not be determined for this field");
                    }

                    // Map current user input state (rows) to the format required by the download/export API
                    const exportRowsPayload = rows.map((rowValue, rowIndex) => {
                       const label = field.combinationRowLabels?.[rowIndex] || `Row ${rowIndex + 1}`;
                       const valueArr = visibleSubFields.map((sf) => {
                          const base: { id: string; value: unknown; options?: string[] } = {
                             id: String(sf.id),
                             value: rowValue[sf.name] ?? "",
                          };

                          if (sf.type === 'dropdown') {
                             const resolved = resolveDropdownFieldOptions(sf, rowValue as Record<string, unknown>);
                             base.options = (resolved.options || []).map((option) => option.label || option.value);
                          }

                          return base;
                       });

                       return {
                         label,
                         value: valueArr,
                       };
                    });

                    // Call API to download template with the actual data the user has filled
                    const blob = await downloadProposalTemplate(
                      String(effectiveProductId),
                      {
                        fieldId: String(field.id),
                        sectionId: String(sectionId),
                        responseId: formResponseId ? String(formResponseId) : null,
                        subFieldIds: visibleSubFields.map(sf => String(sf.id)),
                        rows: exportRowsPayload,
                      }
                    );

                    // Create download link
                    const link = document.createElement('a');
                    const url = URL.createObjectURL(blob);
                    link.setAttribute('href', url);
                    link.setAttribute('download', `${field.name}_template.xlsx`);
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);

                    toast({
                      title: 'Export Successful',
                      description: 'Template has been downloaded successfully',
                    });
                  } catch (error) {
                    console.error('Export error:', error);
                    toast({
                      title: 'Export Failed',
                      description:
                        error instanceof Error
                          ? error.message
                          : 'Failed to download template. Please try again.',
                      variant: 'destructive',
                    });
                  } finally {
                    setIsExporting(false);
                  }
                }}
              >
                <Upload className="w-3 h-3 mr-1.5" />
                Export
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs"
                disabled={isTableBusy}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.xlsx,.xls,.csv';
                  input.onchange = async (e: Event) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      if (productId) {
                        setIsImporting(true);
                        try {
                          const response = await uploadProposalTemplate(
                            String(productId),
                            file,
                            field.id ? String(field.id) : undefined,
                            formResponseId ? String(formResponseId) : undefined,
                          );

                          // Process the API response and populate the combination field
                          if (Array.isArray(response) && response.length > 0) {
                            // Track validation issues
                            const validationIssues: {
                              row: number;
                              field: string;
                              message: string;
                              type: 'error' | 'warning';
                            }[] = [];

                            const processedRows = response.map((row: unknown[], rowIdx: number) => {
                              const rowData: Record<string, unknown> = {};

                              // Map the response data to subFields
                              if (Array.isArray(row)) {
                                row.forEach((fieldData: unknown, index: number) => {
                                  const data = fieldData as { title?: string; value?: unknown };
                                  // Try to find the corresponding subField by:
                                  // 1. Index (position in array)
                                  // 2. Title/Label match (case-insensitive)
                                  let subField = field.subFields?.[index];

                                  // If no match by index, try matching by title
                                  if (!subField && data.title && field.subFields) {
                                    const normalizedTitle = data.title.toLowerCase().trim();
                                    subField = field.subFields.find(
                                      (sf) => sf.label?.toLowerCase().trim() === normalizedTitle,
                                    );
                                  }

                                  if (subField) {
                                    const fieldName = subField.name;
                                    const fieldType = subField.type;
                                    const value = data.value;

                                    // Handle datePeriod type
                                    if (fieldType === 'datePeriod') {
                                      if (value && String(value).trim() !== '') {
                                        const parsed = parseDatePeriod(String(value));

                                        if (parsed.isValid) {
                                          // Store as object with startDate and endDate
                                          rowData[fieldName] = {
                                            startDate: parsed.startDate,
                                            endDate: parsed.endDate,
                                          };

                                          // Log warnings if any
                                          if (parsed.warnings.length > 0) {
                                            parsed.warnings.forEach((warning) => {
                                              validationIssues.push({
                                                row: rowIdx + 1,
                                                field: subField.label || subField.name,
                                                message: warning,
                                                type: 'warning',
                                              });
                                            });
                                          }
                                        } else {
                                          // Invalid date period - store empty and log error
                                          rowData[fieldName] = {
                                            startDate: '',
                                            endDate: '',
                                          };

                                          parsed.errors.forEach((error) => {
                                            validationIssues.push({
                                              row: rowIdx + 1,
                                              field: subField.label || subField.name,
                                              message: error,
                                              type: 'error',
                                            });
                                          });
                                        }
                                      } else {
                                        // Empty value
                                        rowData[fieldName] = {
                                          startDate: '',
                                          endDate: '',
                                        };
                                      }
                                    }
                                    // Convert value based on field type
                                    else if (fieldType === 'number') {
                                      rowData[fieldName] =
                                        value !== undefined && value !== null && value !== ''
                                          ? parseFloat(String(value))
                                          : '';
                                    } else if (fieldType === 'checkbox') {
                                      rowData[fieldName] =
                                        value === true ||
                                        value === 'true' ||
                                        value === 'TRUE' ||
                                        value === 1 ||
                                        value === '1';
                                    } else if (fieldType === 'date') {
                                      // Handle date values
                                      rowData[fieldName] = value ? String(value) : '';
                                    } else if (fieldType === 'dropdown') {
                                      // Handle dropdown values - ensure it's a valid option
                                      rowData[fieldName] =
                                        value !== undefined && value !== null ? String(value) : '';
                                    } else {
                                      // Default: text, textarea, etc.
                                      rowData[fieldName] =
                                        value !== undefined && value !== null ? String(value) : '';
                                    }
                                  } else {
                                    // Log warning if field couldn't be matched
                                    console.warn(
                                      `Could not match field at index ${index} with title "${data.title}" to any subField`,
                                    );
                                  }
                                });
                              }

                              return rowData;
                            });

                            // Update the field value with processed rows
                            onChange(field.name, processedRows);

                            // Show validation summary
                            const errorCount = validationIssues.filter(
                              (i) => i.type === 'error',
                            ).length;
                            const warningCount = validationIssues.filter(
                              (i) => i.type === 'warning',
                            ).length;

                            if (errorCount > 0 || warningCount > 0) {
                              // Show first 3 specific issues
                              const issuesList = validationIssues
                                .slice(0, 3)
                                .map((issue) => `Row ${issue.row}: ${issue.message}`)
                                .join('\n');

                              const remaining = validationIssues.length - 3;
                              const moreText = remaining > 0 ? `\n+${remaining} more` : '';

                              toast({
                                title: errorCount > 0 ? '⚠️ Import Issues Found' : 'ℹ️ Please Review',
                                description: `${issuesList}${moreText}`,
                                variant: errorCount > 0 ? 'destructive' : 'default',
                                duration: 20000,
                                // Keep the user informed so they can review
                              });
                            } else {
                              toast({
                                title: '✅ Success',
                                description: `${processedRows.length} row${processedRows.length > 1 ? 's' : ''} imported successfully`,
                                duration: 20000,
                              });
                            }
                          } else {
                            toast({
                              title: 'Import Warning',
                              description: 'No data found in the uploaded file',
                              variant: 'destructive',
                            });
                          }
                        } catch (error) {
                          console.error('Upload error:', error);
                          toast({
                            title: 'Import Failed',
                            description:
                              error instanceof Error ? error.message : 'Failed to upload file',
                            variant: 'destructive',
                          });
                        } finally {
                          setIsImporting(false);
                        }
                      } else {
                        importFromFile(file);
                      }
                    }
                  };
                  input.click();
                }}
              >
                <Download className="w-3 h-3 mr-1.5" />
                Import
              </Button>
            </>
          )}
          {canAddRows && canAddNewRow && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs"
              onClick={addRow}
              disabled={isTableBusy || fieldDisabled || isWholeCombinationRowRatingLocked}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Row
            </Button>
          )}
        </div>
      </div>

      {groupErrorMessage ? (
        <p className="text-sm text-destructive" role="alert">
          {groupErrorMessage}
        </p>
      ) : null}

      <div
        className="relative"
        onMouseMove={handleHoverAutoScroll}
        onMouseLeave={stopHoverScroll}
        style={{
          cursor:
            hoverScrollDirection === 'left'
              ? LEFT_SCROLL_CURSOR
              : hoverScrollDirection === 'right'
                ? RIGHT_SCROLL_CURSOR
                : undefined,
        }}
      >
        {hoverScrollDirection ? (
          <div className="pointer-events-none absolute inset-y-0 left-0 right-0 z-10 overflow-hidden rounded-md">
            <div
              className={cn(
                'absolute inset-y-0 left-0 w-12 rounded-l-md bg-gradient-to-r from-[var(--combination-scroll-blur-strong,hsl(var(--primary)/0.18))] via-[var(--combination-scroll-blur-soft,hsl(var(--primary)/0.08))] to-transparent backdrop-blur-[1.5px] transition-opacity duration-150',
                hoverScrollDirection === 'left' && canScrollLeft ? 'opacity-100' : 'opacity-0',
              )}
              style={activeScrollBlurStyle}
              aria-hidden="true"
            />
            <div
              className={cn(
                'absolute inset-y-0 right-0 w-12 rounded-r-md bg-gradient-to-l from-[var(--combination-scroll-blur-strong,hsl(var(--primary)/0.18))] via-[var(--combination-scroll-blur-soft,hsl(var(--primary)/0.08))] to-transparent backdrop-blur-[1.5px] transition-opacity duration-150',
                hoverScrollDirection === 'right' && canScrollRight ? 'opacity-100' : 'opacity-0',
              )}
              style={activeScrollBlurStyle}
              aria-hidden="true"
            />
          </div>
        ) : null}

        <ScrollArea
          ref={setScrollAreaRoot}
          className={cn(
            'h-auto rounded-md border border-border transition-opacity',
            isTableBusy && 'pointer-events-none opacity-40',
          )}
          aria-busy={isTableBusy}
        >
          <div className="min-w-full inline-block align-middle">
            <div
              className={`text-sm grid ${isStandard2Col ? 'gap-x-6 gap-y-4' : 'gap-4'} p-4 bg-primary/5 border-b border-border font-semibold items-center sticky top-0 z-10`}
              style={{
                gridTemplateColumns,
              }}
            >
              {hasLabels && <span></span>}
              {visibleSubFields.map((sf) => (
                <FieldLabelWithNote
                  key={sf.id}
                  label={sf.label}
                  required={sf.required}
                  note={sf.metadata?.note}
                  asSpan
                />
              ))}
              {canAddRows && !isStandard2Col && <span className="text-center text-sm">Actions</span>}
            </div>

            {/* Rows */}
            {Array.from({ length: rowsCount }).map((_, rowIndex) => {
              const rowLabel = field.combinationRowLabels?.[rowIndex];
              const rowValue = rows[rowIndex] || {};
              const canRemove = canDeleteRows && rows.length > minRows && !isWholeCombinationRowRatingLocked;

              return (
                <div
                  key={rowIndex}
                  className={`grid ${isStandard2Col ? 'gap-x-6 gap-y-4' : 'gap-4'} p-4 border-t border-border items-center`}
                  style={{
                    gridTemplateColumns,
                  }}
                >
                  {hasLabels && <div className="font-medium">{rowLabel}</div>}

                {visibleSubFields.map((sf, sfIndex) => {
                  const metadataDefaultValue = sf.metadata?.defaultValue;
                  const rawCellValue =
                    rowValue[sf.name] !== undefined
                      ? rowValue[sf.name]
                      : Array.isArray((rowValue as { value?: unknown }).value)
                        ? (
                            (
                              (rowValue as {
                                value?: Array<{ id?: string; label?: string; value: unknown }>;
                              }).value || []
                            ).find(
                              (subItem) =>
                                (sf.id && subItem.id && String(subItem.id) === String(sf.id)) ||
                                (sf.label &&
                                  subItem.label &&
                                  String(subItem.label) === String(sf.label)),
                            ) as { value?: unknown } | undefined
                          )?.value
                        : undefined;
                  const cellValue =
                    rawCellValue !== undefined
                      ? rawCellValue
                      : metadataDefaultValue !== undefined
                        ? metadataDefaultValue
                        : sf.type === 'checkbox'
                          ? false
                          : sf.type === 'number'
                            ? ''
                            : '';
                  const subFieldError = errors?.[`${field.name}.${rowIndex}.${sf.name}`];
                  const isReference =
                    Boolean(sf.metadata?.referenceFieldId) ||
                    Boolean(sf.metadata?.referenceFieldName);
                  const isReferencedSourceRatingDisabled = (() => {
                    if (!disableRatingParameters || !isReference) return false;
                    const sourceField = findFieldByReference(
                      sf.metadata?.referenceFieldId,
                      sf.metadata?.referenceFieldName,
                    );
                    if (!sourceField) return false;
                    return isFieldRatingDisabledInChain(sourceField);
                  })();
                  const isSubfieldRatingDisabled = isSubFieldEffectivelyRatingLocked(sf);
                  const isCellDisabled =
                    fieldDisabled ||
                    isSubfieldRatingDisabled ||
                    isReferencedSourceRatingDisabled ||
                    (isReference && sf.type !== 'dropdown');
                  const shouldForceDisableReferenceDropdown =
                    isReference && sf.type === 'dropdown' && isCellDisabled;

                  // If it's a reference field but configured as dropdown, treat as normal dropdown
                  const fieldType = sf.type;

                  let input = null;

                  switch (fieldType) {
                    case 'text':
                      // Handle mobile number specifically
                      if (
                        sf.name === 'mobile_number' ||
                        sf.name === 'phoneNumber' ||
                        sf.name === 'mobileNumber' ||
                        (typeof sf.label === 'string' &&
                          sf.label.toLowerCase().includes('mobile number'))
                      ) {
                        input = (
                          <Input
                            value={typeof cellValue === 'string' ? cellValue : ''}
                            type="text"
                            inputMode="tel"
                            onChange={(e) => updateCell(rowIndex, sf.name, e.target.value)}
                            placeholder={sf.placeholder || 'Mobile number'}
                            className={subFieldError ? 'border-destructive' : ''}
                            disabled={isCellDisabled}
                          />
                        );
                      } else {
                        input = (
                          <Input
                            value={cellValue as string}
                            type={fieldType}
                            onChange={(e) => updateCell(rowIndex, sf.name, e.target.value)}
                            placeholder={sf.placeholder}
                            className={subFieldError ? 'border-destructive' : ''}
                            disabled={
                              isReference &&
                              sf.type === 'dropdown' &&
                              !shouldForceDisableReferenceDropdown
                                ? false
                                : isCellDisabled
                            }
                          />
                        );
                      }
                      break;
                    case 'number': {
                      const hasIntegerRule = sf.validations?.some((v) => v.type === 'integer');
                      const decimalPlacesRule = sf.validations?.find(
                        (v) => v.type === 'decimalPlaces',
                      );
                      const calculatedDateUnit = isDateCalculationConfig(sf.metadata?.calculation)
                        ? sf.metadata?.calculation.unit
                        : '';
                      const isLikelyYear =
                        !sf.metadata?.forceFormatting &&
                        (sf.name.toLowerCase().includes('year') ||
                          (sf.label ?? '').toLowerCase().includes('year') ||
                          (Number.isInteger(Number(cellValue)) &&
                            Number(cellValue) >= 1900 &&
                            Number(cellValue) <= 2100));

                      let maxDecimals: number | undefined;
                      let allowDecimals: boolean;
                      if (hasIntegerRule) {
                        allowDecimals = false;
                        maxDecimals = 0;
                      } else if (decimalPlacesRule) {
                        maxDecimals = Number(decimalPlacesRule.value);
                        allowDecimals = maxDecimals > 0;
                      } else {
                        allowDecimals = true;
                        maxDecimals = undefined;
                      }

                      const isPhone =
                        sf.metadata?.numberFormat === 'phoneNumber' ||
                        sf.name === 'mobile_number' ||
                        sf.name === 'phoneNumber' ||
                        sf.name === 'mobileNumber' ||
                        (typeof sf.label === 'string' &&
                          sf.label.toLowerCase().includes('mobile number'));

                      if (isPhone) {
                        input = (
                          <Input
                            value={cellValue ? String(cellValue) : ''}
                            type="text"
                            inputMode="tel"
                            onChange={(e) => updateCell(rowIndex, sf.name, e.target.value)}
                            placeholder={sf.placeholder || 'Phone number'}
                            className={subFieldError ? 'border-destructive' : ''}
                            disabled={isCellDisabled}
                          />
                        );
                      } else {
                        input = calculatedDateUnit ? (
                          <div className="relative">
                            <Input
                              value={
                                cellValue === undefined || cellValue === null || cellValue === ''
                                  ? ''
                                  : isLikelyYear
                                    ? String(cellValue)
                                    : Number(cellValue).toLocaleString('en-US', {
                                        maximumFractionDigits: 10,
                                      })
                              }
                              readOnly
                              disabled
                              placeholder={sf.placeholder}
                              className={`${subFieldError ? 'border-destructive' : ''} pr-20`}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground bg-background pl-1">
                              {calculatedDateUnit}
                            </span>
                          </div>
                        ) : (
                          (() => {
                            const isCurrencySubField = sf.metadata?.numberFormat === 'currency';
                            const useNumberUnitForSubField = Boolean(
                              isCurrencySubField &&
                              numberUnit &&
                              NUMBER_UNIT_MULTIPLIER[numberUnit],
                            );
                            const multiplier = useNumberUnitForSubField
                              ? NUMBER_UNIT_MULTIPLIER[numberUnit as NumberUnit]
                              : 1;
                            const displayMaxDecimals = useNumberUnitForSubField
                              ? numberUnit === 'millions'
                                ? 6
                                : numberUnit === 'hundredThousand'
                                  ? 5
                                  : 3
                              : maxDecimals;
                            const displayAllowDecimals = useNumberUnitForSubField
                              ? true
                              : allowDecimals;
                            const numericCellValue =
                              typeof cellValue === 'number'
                                ? cellValue
                                : cellValue
                                  ? Number(cellValue)
                                  : undefined;
                            const displayValue =
                              useNumberUnitForSubField &&
                              typeof numericCellValue === 'number' &&
                              Number.isFinite(numericCellValue)
                                ? numericCellValue / multiplier
                                : numericCellValue;
                            const suffix =
                              isCurrencySubField && useNumberUnitForSubField
                                ? `${productCurrency || 'AED'} (${numberUnit === 'hundredThousand'
                                    ? 'Hundred Thousands'
                                    : numberUnit === 'millions'
                                      ? 'Millions'
                                      : 'Thousands'})`
                                : undefined;

                            return (
                              <FormattedNumberInput
                                value={displayValue}
                                onChange={(val) =>
                                  updateCell(
                                    rowIndex,
                                    sf.name,
                                    useNumberUnitForSubField &&
                                      typeof val === 'number' &&
                                      Number.isFinite(val)
                                      ? val * multiplier
                                      : val,
                                  )
                                }
                                allowEmpty
                                allowDecimals={displayAllowDecimals}
                                maxDecimals={displayMaxDecimals}
                                useGrouping={!isLikelyYear}
                                placeholder={sf.placeholder}
                                suffix={suffix}
                                className={subFieldError ? 'border-destructive' : ''}
                                disabled={!!sf.metadata?.calculation || isCellDisabled}
                              />
                            );
                          })()
                        );
                      }
                      break;
                    }

                    case 'textarea':
                      input = (
                        <Textarea
                          value={cellValue as string}
                          onChange={(e) => updateCell(rowIndex, sf.name, e.target.value)}
                          className={subFieldError ? 'border-destructive' : ''}
                          placeholder={sf.placeholder}
                          disabled={isCellDisabled}
                        />
                      );
                      break;

                    case 'dropdown': {
                      const allowReselection =
                        Boolean(sf.metadata?.allowReselection) ||
                        (isReference && sf.type === 'dropdown');
                      const dropdownState = resolveDropdownFieldOptions(sf, rowValue);
                      const otherValueCode = 'Other';
                      const allowOther =
                        String(sf.metadata?.allowOther).toLowerCase() === 'true';
                      let normalizedOptions = dropdownState.options;
                      if (
                        allowOther &&
                        !normalizedOptions.some((option) => option.value === otherValueCode)
                      ) {
                        normalizedOptions = [
                          ...normalizedOptions,
                          { label: otherValueCode, value: otherValueCode },
                        ];
                      }
                      let isDependentDisabled = false;
                      let placeholderText = sf.placeholder || 'Select an option';

                      if (sf.dependentOn) {
                        const parentValue = rowValue[sf.dependentOn];
                        if (!parentValue) {
                          isDependentDisabled = true;
                          const parentLabel = field.subFields?.find((s) => s.name === sf.dependentOn)?.label || sf.dependentOn;
                          placeholderText = `Select ${parentLabel} first`;
                        }
                      }
                      const selectedValue =
                        cellValue && typeof cellValue === 'object'
                          ? String((cellValue as Record<string, unknown>)?.value ?? '')
                          : cellValue
                            ? String(cellValue)
                            : '';
                      const selectedLabel = selectedValue
                        ? normalizedOptions.find((opt) => opt.value === selectedValue)?.label ||
                          selectedValue
                        : '';
                      const otherTextValue =
                        cellValue && typeof cellValue === 'object'
                          ? String((cellValue as Record<string, unknown>)?.otherText ?? '')
                          : '';
                      const buttonLabel =
                        selectedValue === otherValueCode
                          ? otherTextValue
                            ? `Other: ${otherTextValue}`
                            : otherValueCode
                          : selectedLabel || placeholderText;
                      const dropdownKey = `${rowIndex}:${sf.name}`;
                      const isDropdownDisabled =
                        isDependentDisabled ||
                        (isReference &&
                        sf.type === 'dropdown' &&
                        !shouldForceDisableReferenceDropdown
                          ? false
                          : isCellDisabled);

                      input = (
                        <Popover
                          open={openDropdownKey === dropdownKey}
                          onOpenChange={(open) =>
                            setOpenDropdownKey(open ? dropdownKey : null)
                          }
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={openDropdownKey === dropdownKey}
                              disabled={isDropdownDisabled}
                              className={cn(
                                'w-full justify-between font-normal px-3',
                                !selectedValue && 'text-muted-foreground',
                                subFieldError && 'border-destructive',
                              )}
                            >
                              <span className="truncate text-left">
                                {buttonLabel}
                              </span>
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-[--radix-popover-trigger-width] p-0"
                            align="start"
                          >
                            <Command>
                              <CommandInput
                                placeholder={`Search ${sf.label.toLowerCase()}...`}
                              />
                              <CommandList>
                                <CommandEmpty>No option found.</CommandEmpty>
                                <CommandGroup>
                                  {normalizedOptions.map((option) => {
                                    const isUsedElsewhere =
                                      !allowReselection &&
                                      rows.some(
                                        (r, idx) =>
                                          idx !== rowIndex && r[sf.name] === option.value,
                                      );
                                    return (
                                      <CommandItem
                                        key={option.value}
                                        value={`${option.label} ${option.value}`}
                                        disabled={isUsedElsewhere}
                                        onSelect={() => {
                                          if (option.value === otherValueCode) {
                                            updateCell(rowIndex, sf.name, {
                                              value: otherValueCode,
                                              otherText: otherTextValue,
                                            });
                                            setOpenDropdownKey(dropdownKey);
                                          } else {
                                            updateCell(rowIndex, sf.name, option.value);
                                            setOpenDropdownKey(null);
                                          }
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            'mr-2 h-4 w-4',
                                            selectedValue === option.value
                                              ? 'opacity-100'
                                              : 'opacity-0',
                                          )}
                                        />
                                        {option.label}
                                      </CommandItem>
                                    );
                                  })}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                            {allowOther &&
                              selectedValue === otherValueCode &&
                              !isDropdownDisabled && (
                                <div className="border-t p-2">
                                  <Input
                                    value={otherTextValue}
                                    onChange={(e) =>
                                      updateCell(rowIndex, sf.name, {
                                        value: otherValueCode,
                                        otherText: e.target.value,
                                      })
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        setOpenDropdownKey(null);
                                      }
                                    }}
                                    placeholder="Please specify"
                                  />
                                </div>
                              )}
                          </PopoverContent>
                        </Popover>
                      );
                      break;
                    }

                    case 'location':
                    case 'Location':
                      input = (
                        <div className="relative">
                          <Input
                            value={
                              cellValue && String(cellValue).includes('|')
                                ? String(cellValue).split('|')[0].trim()
                                : String(cellValue || '')
                            }
                            readOnly
                            placeholder={sf.placeholder || 'Select location'}
                            className={subFieldError ? 'border-destructive pr-10' : 'pr-10'}
                            disabled={isCellDisabled}
                            onClick={() => {
                              if (!isCellDisabled && onOpenMap) {
                                onOpenMap(`COMBINATION:${field.id}:${rowIndex}:${sf.name}`);
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 text-primary hover:text-primary hover:bg-transparent"
                            disabled={isCellDisabled}
                            onClick={() => {
                              if (onOpenMap) {
                                onOpenMap(`COMBINATION:${field.id}:${rowIndex}:${sf.name}`);
                              }
                            }}
                          >
                            <MapPin className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                      break;

                    case 'checkbox':
                      input = (
                        <div className="flex justify-center">
                          <Checkbox
                            checked={!!cellValue}
                            onCheckedChange={(checked) => updateCell(rowIndex, sf.name, checked)}
                            disabled={isCellDisabled}
                          />
                        </div>
                      );
                      break;
                    case 'time': {
                      input = (
                        <TimePicker
                          value={cellValue ? String(cellValue) : ''}
                          onChange={(time) => updateCell(rowIndex, sf.name, time)}
                          className={subFieldError ? 'border-destructive' : ''}
                          disabled={isCellDisabled}
                        />
                      );
                      break;
                    }

                    case 'date': {
                      const dateConstraints = getDateValidationConstraints(sf);
                      input = (
                        <DatePicker
                          value={cellValue ? String(cellValue) : ''}
                          onChange={(date) => updateCell(rowIndex, sf.name, date || '')}
                          min={dateConstraints.minDate}
                          max={dateConstraints.maxDate}
                          mode={sf.metadata?.is_year_only ? 'year' : 'date'}
                          placeholder={sf.metadata?.is_year_only ? 'Select year' : 'Select date'}
                          className={subFieldError ? 'border-destructive' : ''}
                          disabled={isCellDisabled}
                        />
                      );
                      break;
                    }

                    case 'datePeriod': {
                      const periodValue: { startDate: string; endDate: string } =
                        typeof cellValue === 'object' && cellValue !== null
                          ? (cellValue as { startDate: string; endDate: string })
                          : { startDate: '', endDate: '' };
                      const periodConstraints = getDateValidationConstraints(sf);
                      const effectiveToMinDate =
                        periodConstraints.toMinDate && periodValue.startDate
                          ? periodConstraints.toMinDate > periodValue.startDate
                            ? periodConstraints.toMinDate
                            : periodValue.startDate
                          : periodValue.startDate || periodConstraints.toMinDate;

                      input = (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              {sf.fromDateLabel && (
                                <label className="text-[10px] uppercase font-medium text-muted-foreground ml-1">
                                  {sf.fromDateLabel}
                                </label>
                              )}
                              <DatePicker
                                value={periodValue.startDate || ''}
                                onChange={(date) => {
                                  const newValue = {
                                    ...periodValue,
                                    startDate: date || '',
                                  };

                                  // If start date is after end date, clear end date
                                  if (date && periodValue.endDate && date > periodValue.endDate) {
                                    newValue.endDate = '';
                                    toast({
                                      title: 'ℹ️ End Date Cleared',
                                      description: 'Please select a new end date',
                                      duration: 20000,
                                    });
                                  }

                                  updateCell(rowIndex, sf.name, newValue);
                                }}
                                min={periodConstraints.fromMinDate}
                                max={periodConstraints.fromMaxDate}
                                placeholder="Start date"
                                className={subFieldError ? 'border-destructive' : ''}
                                disabled={isCellDisabled}
                              />
                            </div>
                            <div className="space-y-1">
                              {sf.toDateLabel && (
                                <label className="text-[10px] uppercase font-medium text-muted-foreground ml-1">
                                  {sf.toDateLabel}
                                </label>
                              )}
                              <DatePicker
                                value={periodValue.endDate || ''}
                                onChange={(date) => {
                                  // Validate that end date is not before start date
                                  if (
                                    date &&
                                    periodValue.startDate &&
                                    date < periodValue.startDate
                                  ) {
                                    toast({
                                      title: '❌ Invalid Date',
                                      description: 'End date must be after start date',
                                      variant: 'destructive',
                                      duration: 20000,
                                    });
                                    return; // Don't update if invalid
                                  }

                                  updateCell(rowIndex, sf.name, {
                                    ...periodValue,
                                    endDate: date || '',
                                  });
                                }}
                                min={effectiveToMinDate}
                                max={periodConstraints.toMaxDate}
                                placeholder="End date"
                                className={subFieldError ? 'border-destructive' : ''}
                                disabled={isCellDisabled}
                              />
                            </div>
                          </div>
                        </div>
                      );
                      break;
                    }

                    case 'file': {
                      const displayValue =
                        cellValue instanceof File ? cellValue.name : String(cellValue || '');
                      input = (
                        <div className="flex flex-col gap-2">
                          {cellValue ? (
                            <div className="flex items-center gap-2 text-sm bg-primary/5 p-2 rounded border">
                              <Upload className="w-3 h-3 text-muted-foreground" />
                              <span className="truncate max-w-[120px]" title={displayValue}>
                                {displayValue}
                              </span>
                              <div className="ml-auto flex items-center gap-0">
                                {cellValue instanceof File && canPreviewFile(cellValue) && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => openPreview(cellValue)}
                                  >
                                    <Eye className="w-3 h-3" />
                                  </Button>
                                )}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => updateCell(rowIndex, sf.name, '')}
                                  disabled={isCellDisabled}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="relative">
                              <Input
                                type="file"
                                accept={buildFileAcceptAttr(sf.validations)}
                                className={subFieldError ? 'border-destructive' : ''}
                                onChange={(e) => handleFileChange(e, rowIndex, sf)}
                                disabled={isCellDisabled}
                              />
                            </div>
                          )}
                        </div>
                      );
                      break;
                    }

                    case 'chooseButton': {
                      const chooseOptions = sf.options || [];
                      input = (
                        <div className="flex flex-wrap gap-1">
                          {chooseOptions.length > 0 ? (
                            chooseOptions.map((opt) => {
                              const optLabel = typeof opt === 'string' ? opt : opt.label;
                              const optValue = typeof opt === 'string' ? opt : (opt.value ?? opt.label);
                              const isSelected = cellValue === optValue;
                              return (
                                <Button
                                  key={optValue}
                                  type="button"
                                  variant={isSelected ? 'default' : 'outline'}
                                  size="sm"
                                  className="h-8 text-xs px-3 gap-1"
                                  disabled={isCellDisabled}
                                  onClick={() => updateCell(rowIndex, sf.name, isSelected ? '' : optValue)}
                                >
                                  {optLabel}
                                </Button>
                              );
                            })
                          ) : (
                            <span className="text-xs text-muted-foreground italic">No options</span>
                          )}
                        </div>
                      );
                      break;
                    }

                    default:
                      input = <div className="text-xs text-muted-foreground">Unsupported</div>;
                  }

                  const isLastSubfield = isStandard2Col && sfIndex === visibleSubFields.length - 1;

                  return (
                    <div key={sf.id} id={`field-${field.name}.${rowIndex}.${sf.name}`} className="min-w-0 w-full">
                      {isLastSubfield && canDeleteRows ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            {input}
                          </div>
                          <div className="flex-shrink-0 flex items-center justify-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeRow(rowIndex)}
                              aria-label="Remove row"
                              disabled={!canRemove || fieldDisabled}
                              className={
                                !canRemove
                                  ? 'opacity-30 cursor-not-allowed h-9 w-9 px-0'
                                  : 'text-destructive hover:text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200 h-9 w-9 px-0'
                              }
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        input
                      )}
                      {subFieldError ? (
                        <p className="text-xs text-destructive mt-1">{subFieldError}</p>
                      ) : (
                        <p className="text-xs text-transparent min-h-[16px] mt-1">&nbsp;</p>
                      )}
                    </div>
                  );
                })}

                {/* Remove Row Button */}
                {!isStandard2Col && canDeleteRows && (
                  <div>
                    <div className="flex justify-center items-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRow(rowIndex)}
                        aria-label="Remove row"
                        disabled={!canRemove || fieldDisabled}
                        className={
                          !canRemove
                            ? 'opacity-30 cursor-not-allowed'
                            : 'text-destructive hover:text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200'
                        }
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    {/* Invisible spacer to match the error-message height of the adjacent inputs */}
                    <p className="text-xs text-transparent min-h-[16px] mt-1">&nbsp;</p>
                  </div>
                )}
                </div>
              );
            })}

          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {isTableBusy && (
          <div className="absolute inset-0 z-30 flex items-center justify-center rounded-md bg-background/30">
            <div className="flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>{tableBusyLabel}</span>
            </div>
          </div>
        )}
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>{previewFile?.name}</DialogTitle>
          </DialogHeader>
          {previewFile &&
            (previewFile.type.startsWith('image/') ? (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <img
                  src={URL.createObjectURL(previewFile)}
                  alt={previewFile.name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ) : (
              <iframe
                src={URL.createObjectURL(previewFile)}
                className="w-full h-full border-0"
                title="File Preview"
              />
            ))}
        </DialogContent>
      </Dialog>
    </div>
  );
}
