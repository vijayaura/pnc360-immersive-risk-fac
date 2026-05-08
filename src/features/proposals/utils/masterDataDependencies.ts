import type { Field, Page } from '@/features/product-config/proposal-form/api/proposalFormDesign';
import { normalizeOptions, type NormalizedOption } from '@/shared/utils/form-helpers';

type MasterData = {
  id?: string | null;
  parentMasterId?: string | null;
};

type MasterOption = {
  value?: string;
  label?: string;
  masterValueId?: string;
  masterValueData?: {
    id?: string | null;
    parentValueId?: string | null;
  } | null;
};

export interface MasterDependentOptionsState {
  isDependent: boolean;
  parentField?: Field;
  parentValueMissing: boolean;
  options?: NormalizedOption[];
}

const selectableTypes = new Set(['dropdown', 'multiselect', 'multiselectDropdown']);

const getMasterData = (field?: Field | null): MasterData | undefined =>
  field ? ((field as Field & { masterData?: MasterData }).masterData ?? undefined) : undefined;

const getOptionId = (option: unknown): string | null => {
  if (!option || typeof option !== 'object') return null;
  const opt = option as MasterOption;
  return opt.masterValueId ?? opt.masterValueData?.id ?? null;
};

const getOptionParentId = (option: unknown): string | null => {
  if (!option || typeof option !== 'object') return null;
  return (option as MasterOption).masterValueData?.parentValueId ?? null;
};

const normalizeSelectedValues = (value: unknown): string[] => {
  if (value == null || value === '') return [];

  if (Array.isArray(value)) {
    return value.flatMap(normalizeSelectedValues);
  }

  if (typeof value === 'object') {
    const objectValue = (value as Record<string, unknown>).value;
    return objectValue == null ? [] : normalizeSelectedValues(objectValue);
  }

  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const getAllFields = (pages?: Page[]): Field[] =>
  (pages || [])
    .flatMap((page) => page.sections || [])
    .flatMap((section) => section.fields || []);

const findParentMasterField = (field: Field, pages?: Page[]): Field | undefined => {
  const parentMasterId = getMasterData(field)?.parentMasterId;
  if (!parentMasterId) return undefined;

  return getAllFields(pages).find((candidate) => {
    if (candidate.name === field.name || !selectableTypes.has(candidate.type)) return false;
    return getMasterData(candidate)?.id === parentMasterId;
  });
};

const getSelectedMasterValueIds = (parentField: Field, formData?: Record<string, unknown>): Set<string> => {
  const selectedValues = normalizeSelectedValues(formData?.[parentField.name]);
  const selectedValueSet = new Set(selectedValues);

  return new Set(
    ((parentField.options || []) as unknown[])
      .filter((option) => {
        if (typeof option === 'string') return selectedValueSet.has(option);
        const opt = option as MasterOption;
        return (
          selectedValueSet.has(String(opt.value ?? '')) ||
          selectedValueSet.has(String(opt.label ?? '')) ||
          selectedValueSet.has(String(opt.masterValueId ?? '')) ||
          selectedValueSet.has(String(opt.masterValueData?.id ?? ''))
        );
      })
      .map(getOptionId)
      .filter((id): id is string => Boolean(id)),
  );
};

export const resolveMasterDependentOptions = (
  field: Field,
  pages?: Page[],
  formData?: Record<string, unknown>,
): MasterDependentOptionsState => {
  const parentMasterId = getMasterData(field)?.parentMasterId;
  if (!parentMasterId) {
    return { isDependent: false, parentValueMissing: false };
  }

  const parentField = findParentMasterField(field, pages);
  if (!parentField) {
    return { isDependent: false, parentValueMissing: false };
  }

  const selectedParentOptionIds = getSelectedMasterValueIds(parentField, formData);
  if (selectedParentOptionIds.size === 0) {
    return { isDependent: true, parentField, parentValueMissing: true, options: [] };
  }

  const filteredRawOptions = ((field.options || []) as unknown[]).filter((option) => {
    const parentValueId = getOptionParentId(option);
    return parentValueId ? selectedParentOptionIds.has(parentValueId) : false;
  });

  return {
    isDependent: true,
    parentField,
    parentValueMissing: false,
    options: normalizeOptions(filteredRawOptions as Parameters<typeof normalizeOptions>[0]),
  };
};
