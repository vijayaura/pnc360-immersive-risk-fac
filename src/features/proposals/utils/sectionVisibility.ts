export type SectionVisibilityConfig = {
  field: string;
  condition: string;
  valueText?: string;
  masterId?: string;
  masterValueId?: string;
};

export type VisibilityFieldOption = {
  value?: string;
  label?: string;
  masterId?: string;
  masterValueId?: string;
};

export type VisibilityField = {
  id?: string;
  name?: string;
  type?: string;
  options?: VisibilityFieldOption[] | string[];
};

export const isSectionVisibilitySatisfied = (
  visibility: SectionVisibilityConfig,
  depField: VisibilityField | undefined,
  rawDepValue: unknown,
): boolean => {
  if (
    !visibility.masterValueId &&
    (!visibility.valueText || visibility.valueText.trim() === '')
  ) {
    return false;
  }

  let depValue: unknown = rawDepValue;
  if (depField && depField.type === 'dropdown') {
    if (rawDepValue && typeof rawDepValue === 'object') {
      const rawObj = rawDepValue as { value?: unknown };
      depValue =
        rawObj.value !== undefined && rawObj.value !== null
          ? String(rawObj.value)
          : '';
    } else if (rawDepValue !== undefined && rawDepValue !== null) {
      depValue = String(rawDepValue);
    } else {
      depValue = '';
    }
  }

  let expectedValue: string = visibility.valueText ?? '';

  let selectedMasterValueId: string | undefined;

  if (
    depField &&
    (depField.type === 'dropdown' || depField.type === 'multiselect' || depField.type === 'multiselectDropdown')
  ) {
    const options = Array.isArray(depField.options)
      ? depField.options
      : [];
    if (visibility.masterValueId) {
      const match = (options as Array<{
        value?: string;
        label?: string;
        masterValueId?: string;
      }>).find(
        (opt) =>
          opt.masterValueId &&
          String(opt.masterValueId) === String(visibility.masterValueId),
      );
      if (match) {
        expectedValue = match.value ?? match.label ?? expectedValue;
      }
    }
    if (!expectedValue && visibility.valueText) {
      expectedValue = visibility.valueText;
    }

    if (rawDepValue && typeof rawDepValue === 'object') {
      const rawObj = rawDepValue as {
        masterValueId?: unknown;
        value?: unknown;
        label?: unknown;
      };
      if (rawObj.masterValueId !== undefined && rawObj.masterValueId !== null) {
        selectedMasterValueId = String(rawObj.masterValueId);
      } else {
        const depValueStrInner = String(depValue ?? '');
        const matchByValueOrLabel = (options as Array<{
          value?: string;
          label?: string;
          masterValueId?: string;
        }>).find((opt) => {
          const optValue = opt.value ?? opt.label;
          return (
            optValue !== undefined &&
            depValueStrInner.toLowerCase() === String(optValue).toLowerCase()
          );
        });
        if (matchByValueOrLabel?.masterValueId) {
          selectedMasterValueId = String(matchByValueOrLabel.masterValueId);
        }
      }
    }
  }

  const depValueStr = String(depValue ?? '');
  const cmpValue = expectedValue;

  switch (visibility.condition) {
    case 'equals':
      if (
        depField &&
        (depField.type === 'dropdown' || depField.type === 'multiselect' || depField.type === 'multiselectDropdown') &&
        visibility.masterValueId &&
        selectedMasterValueId
      ) {
        if (String(selectedMasterValueId) !== String(visibility.masterValueId)) {
          return false;
        }
      } else if (depValueStr.toLowerCase() !== cmpValue.toLowerCase()) {
        return false;
      }
      return true;
    case 'not_equals':
    case 'notEquals':
      if (
        depField &&
        (depField.type === 'dropdown' || depField.type === 'multiselect' || depField.type === 'multiselectDropdown') &&
        visibility.masterValueId &&
        selectedMasterValueId
      ) {
        if (String(selectedMasterValueId) === String(visibility.masterValueId)) {
          return false;
        }
      } else if (depValueStr.toLowerCase() === cmpValue.toLowerCase()) {
        return false;
      }
      return true;
    case 'contains':
      if (!depValueStr.toLowerCase().includes(cmpValue.toLowerCase())) {
        return false;
      }
      return true;
    case 'not_contains':
    case 'notContains':
      if (depValueStr.toLowerCase().includes(cmpValue.toLowerCase())) {
        return false;
      }
      return true;
    case 'greater_than':
    case 'greaterThan':
      if (depValueStr === '' || depValue === null || depValue === undefined) {
        return false;
      }
      if (Number(depValueStr) <= Number(cmpValue)) return false;
      return true;
    case 'less_than':
    case 'lessThan':
      if (depValueStr === '' || depValue === null || depValue === undefined) {
        return false;
      }
      if (Number(depValueStr) >= Number(cmpValue)) return false;
      return true;
    case 'greater_than_or_equal':
    case 'greaterThanOrEqual':
      if (depValueStr === '' || depValue === null || depValue === undefined) {
        return false;
      }
      if (Number(depValueStr) < Number(cmpValue)) return false;
      return true;
    case 'less_than_or_equal':
    case 'lessThanOrEqual':
      if (depValueStr === '' || depValue === null || depValue === undefined) {
        return false;
      }
      if (Number(depValueStr) > Number(cmpValue)) return false;
      return true;
    case 'is_empty':
    case 'isEmpty':
      if (
        !(
          depValue === undefined ||
          depValue === null ||
          depValueStr === '' ||
          (Array.isArray(depValue) && depValue.length === 0)
        )
      ) {
        return false;
      }
      return true;
    case 'is_not_empty':
    case 'isNotEmpty':
      if (
        !(
          depValue !== undefined &&
          depValue !== null &&
          depValueStr !== '' &&
          !(Array.isArray(depValue) && depValue.length === 0)
        )
      ) {
        return false;
      }
      return true;
    default:
      return true;
  }
};
