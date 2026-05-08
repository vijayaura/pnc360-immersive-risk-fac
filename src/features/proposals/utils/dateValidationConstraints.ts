import type { Field, SubField } from '@/features/product-config/proposal-form/api/proposalFormDesign';

export interface DateConstraints {
  minDate?: string;
  maxDate?: string;
  fromMinDate?: string;
  fromMaxDate?: string;
  toMinDate?: string;
  toMaxDate?: string;
}

export function getDateValidationConstraints(field: Field | SubField): DateConstraints {
  const constraints: DateConstraints = {};

  if (!field.validations || field.validations.length === 0) {
    return constraints;
  }

  // ===== Single Date Field Constraints =====
  
  // Check for minDateToday
  if (field.validations.some((v) => v.type === "minDateToday")) {
    const today = new Date().toISOString().split("T")[0];
    constraints.minDate = today;
  }

  // Check for maxDateToday
  if (field.validations.some((v) => v.type === "maxDateToday")) {
    const today = new Date().toISOString().split("T")[0];
    constraints.maxDate = today;
  }

  // Check for minDaysFromToday
  const minDaysValidation = field.validations.find(
    (v) => v.type === "minDaysFromToday"
  );
  if (minDaysValidation && typeof minDaysValidation.value === "number") {
    const date = new Date();
    date.setDate(date.getDate() + minDaysValidation.value);
    constraints.minDate = date.toISOString().split("T")[0];
  }

  // Check for maxDaysFromToday
  const maxDaysValidation = field.validations.find(
    (v) => v.type === "maxDaysFromToday"
  );
  if (maxDaysValidation && typeof maxDaysValidation.value === "number") {
    const date = new Date();
    date.setDate(date.getDate() + maxDaysValidation.value);
    constraints.maxDate = date.toISOString().split("T")[0];
  }

  // Check for explicit minDate
  const minDateValidation = field.validations.find(
    (v) => v.type === "minDate"
  );
  if (minDateValidation && typeof minDateValidation.value === "string") {
    constraints.minDate = minDateValidation.value;
  }

  // Check for explicit maxDate
  const maxDateValidation = field.validations.find(
    (v) => v.type === "maxDate"
  );
  if (maxDateValidation && typeof maxDateValidation.value === "string") {
    constraints.maxDate = maxDateValidation.value;
  }

  // ===== From Date Constraints (datePeriod / policyPeriod) =====

  // Check for from_minDateToday
  if (field.validations.some((v) => v.type === "from_minDateToday")) {
    const today = new Date().toISOString().split("T")[0];
    constraints.fromMinDate = today;
  }

  // Check for from_maxDateToday
  if (field.validations.some((v) => v.type === "from_maxDateToday")) {
    const today = new Date().toISOString().split("T")[0];
    constraints.fromMaxDate = today;
  }

  // Check for from_minDaysFromToday
  const fromMinDaysValidation = field.validations.find(
    (v) => v.type === "from_minDaysFromToday"
  );
  if (fromMinDaysValidation && typeof fromMinDaysValidation.value === "number") {
    const date = new Date();
    date.setDate(date.getDate() + fromMinDaysValidation.value);
    constraints.fromMinDate = date.toISOString().split("T")[0];
  }

  // Check for from_maxDaysFromToday
  const fromMaxDaysValidation = field.validations.find(
    (v) => v.type === "from_maxDaysFromToday"
  );
  if (fromMaxDaysValidation && typeof fromMaxDaysValidation.value === "number") {
    const date = new Date();
    date.setDate(date.getDate() + fromMaxDaysValidation.value);
    constraints.fromMaxDate = date.toISOString().split("T")[0];
  }

  // Check for explicit from_minDate
  const fromMinDateValidation = field.validations.find(
    (v) => v.type === "from_minDate"
  );
  if (fromMinDateValidation && typeof fromMinDateValidation.value === "string") {
    constraints.fromMinDate = fromMinDateValidation.value;
  }

  // Check for explicit from_maxDate
  const fromMaxDateValidation = field.validations.find(
    (v) => v.type === "from_maxDate"
  );
  if (fromMaxDateValidation && typeof fromMaxDateValidation.value === "string") {
    constraints.fromMaxDate = fromMaxDateValidation.value;
  }

  // ===== To Date Constraints (datePeriod / policyPeriod) =====

  // Check for to_minDateToday
  if (field.validations.some((v) => v.type === "to_minDateToday")) {
    const today = new Date().toISOString().split("T")[0];
    constraints.toMinDate = today;
  }

  // Check for to_maxDateToday
  if (field.validations.some((v) => v.type === "to_maxDateToday")) {
    const today = new Date().toISOString().split("T")[0];
    constraints.toMaxDate = today;
  }

  // Check for to_minDaysFromToday
  const toMinDaysValidation = field.validations.find(
    (v) => v.type === "to_minDaysFromToday"
  );
  if (toMinDaysValidation && typeof toMinDaysValidation.value === "number") {
    const date = new Date();
    date.setDate(date.getDate() + toMinDaysValidation.value);
    constraints.toMinDate = date.toISOString().split("T")[0];
  }

  // Check for to_maxDaysFromToday
  const toMaxDaysValidation = field.validations.find(
    (v) => v.type === "to_maxDaysFromToday"
  );
  if (toMaxDaysValidation && typeof toMaxDaysValidation.value === "number") {
    const date = new Date();
    date.setDate(date.getDate() + toMaxDaysValidation.value);
    constraints.toMaxDate = date.toISOString().split("T")[0];
  }

  // Check for explicit to_minDate
  const toMinDateValidation = field.validations.find(
    (v) => v.type === "to_minDate"
  );
  if (toMinDateValidation && typeof toMinDateValidation.value === "string") {
    constraints.toMinDate = toMinDateValidation.value;
  }

  // Check for explicit to_maxDate
  const toMaxDateValidation = field.validations.find(
    (v) => v.type === "to_maxDate"
  );
  if (toMaxDateValidation && typeof toMaxDateValidation.value === "string") {
    constraints.toMaxDate = toMaxDateValidation.value;
  }

  // Ensure the "to" side never starts before the configured "from" lower bound.
  if (constraints.fromMinDate) {
    if (!constraints.toMinDate || constraints.toMinDate < constraints.fromMinDate) {
      constraints.toMinDate = constraints.fromMinDate;
    }
  }

  if (constraints.toMaxDate) {
    if (!constraints.fromMaxDate || constraints.fromMaxDate > constraints.toMaxDate) {
      constraints.fromMaxDate = constraints.toMaxDate;
    }
  }

  return constraints;
}
