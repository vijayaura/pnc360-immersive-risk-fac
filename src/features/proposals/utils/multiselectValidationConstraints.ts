import type { Field } from '@/features/product-config/proposal-form/api/proposalFormDesign';

export interface MultiselectConstraints {
  minSelections?: number;
  maxSelections?: number;
}

export function getMultiselectValidationConstraints(
  field: Field
): MultiselectConstraints {
  const constraints: MultiselectConstraints = {};

  if (!field.validations || field.validations.length === 0) {
    return constraints;
  }

  // Check for minSelections
  const minSelectionsValidation = field.validations.find(
    (v) => v.type === "minSelections"
  );
  if (
    minSelectionsValidation &&
    typeof minSelectionsValidation.value === "number"
  ) {
    constraints.minSelections = minSelectionsValidation.value;
  }

  // Check for maxSelections
  const maxSelectionsValidation = field.validations.find(
    (v) => v.type === "maxSelections"
  );
  if (
    maxSelectionsValidation &&
    typeof maxSelectionsValidation.value === "number"
  ) {
    constraints.maxSelections = maxSelectionsValidation.value;
  }

  return constraints;
}
