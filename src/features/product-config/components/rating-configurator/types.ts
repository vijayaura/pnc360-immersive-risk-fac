export interface RatingParameter {
  id: string;
  definitionId?: string;
  name: string;
  label: string;
  type: string;
  parameterType?: string;
  deletedAt?: string | null;
  isDefinitionOnly?: boolean;
  parentFieldId?: string | null;
  options?: (string | { label: string; value: string })[];
  isMasterData?: boolean;
  masterDataTable?: string;
  masterId?: string;
  pricingOption?: 'value-based' | 'range-based' | 'risk-level';
  pricingTypes?: ('Percentage' | 'Fixed Amount' | 'Per Mille')[];
  decisions?: ('Quote' | 'No Quote' | 'Refer to UW')[];
  riskLevels?: ('Low' | 'Medium' | 'High' | 'Very High')[];
  childFields?: RatingParameter[];
  isRatingParameter?: boolean;
  metadata?: Record<string, unknown> | null;
  isCustom?: boolean;
  isActive?: boolean;
  activeCategories?: Array<{
    category: string;
    ratingParameterId?: string;
    derivedType?: string;
    derivedSubfieldId?: string;
  }>;
  ratingParameterId?: string;
  formFieldId?: string;
  derivedType?: string;
  derivedSubfieldId?: string | null;
  valueType?: string;
  formFieldLabel?: string;
  combinationParameterIds?: string[];
  sources?: Array<{
    type: 'FORM_FIELD' | 'DEFINITION';
    id: string;
    position: number;
  }>;
}

export interface ValueBasedRate {
  id: string;
  parameterId: string;
  parameterValue: string;
  rate: number;
  rateType: 'percentage' | 'fixed';
}

export interface RangeBasedRate {
  id: string;
  parameterId: string;
  minValue: number;
  maxValue: number;
  rate: number;
  rateType: 'percentage' | 'fixed';
}

export interface MultiSelectRate {
  id: string;
  parameterIds: string[];
  parameterValues: Record<string, string>;
  rate: number;
  rateType: 'percentage' | 'fixed';
}

export interface RateTable {
  id: string;
  name: string;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
}

export type FormulaParameterSection = 'RELATIVE_LOADING' | 'DIRECT_VALUE';

export interface FormulaStep {
  id: string;
  type: 'field' | 'operator' | 'number' | 'percentage' | 'variable' | 'function';
  value: string;
  fieldId?: string;
  ratingParameterId?: string;
  order?: number;
  label?: string;
  parameterSection?: FormulaParameterSection;
}

export interface DefaultRatingParam {
  id: string;
  name: string;
  label: string;
  value: number;
  selectedRatingParameters?: string[];
}

export interface CEWField {
  id: string;
  type: 'text' | 'number' | 'dropdown' | 'date' | 'checkbox' | 'file' | 'multiselect' | 'textarea';
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
}

export interface CEWSection {
  id: string;
  title?: string;
  subtitle?: string;
  fields: CEWField[];
}

export interface CEWPage {
  id: string;
  title: string;
  subtitle?: string;
  sections: CEWSection[];
}

export interface CEW {
  id: string;
  title: string;
  description: string;
  code: string;
  formPages?: CEWPage[];
  pricingOption?: 'value-based' | 'range-based';
  pricingTypes?: ('Percentage' | 'Fixed Amount' | 'Per Mille')[];
  decisions?: ('Quote' | 'No Quote' | 'Refer to UW')[];
}

export type MatrixParameter = {
  ratingParameterId?: string;
  formFieldId: string;
  formFieldId2: string;
  name?: string;
};
