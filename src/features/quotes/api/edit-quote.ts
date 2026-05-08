import { apiGet } from '@/lib/api/client';
import type { ProductWorkflowResponse } from './workflow';
import type { PageType, FieldType } from './proposalFormDesign';

export interface TemplateFieldValidation {
  type: string;
}

export interface TemplateSubField {
  id: string;
  name: string;
  type:
    | 'text'
    | 'number'
    | 'date'
    | 'datePeriod'
    | 'time'
    | 'location'
    | 'dropdown'
    | 'textarea'
    | 'checkbox'
    | 'file'
    | 'chooseButton';
  label: string;
  options: { label: string; value: string }[] | string[];
  required: boolean;
  placeholder: string;
  isRatingParameter: boolean;
}

export interface TemplateFieldItem {
  id: string;
  name: string;
  type: FieldType;
  label: string;
  options: { label: string; value: string; sortOrder: number }[] | string[];
  required: boolean;
  placeholder?: string;
  validations?: TemplateFieldValidation[];
  subFields?: TemplateSubField[];
  isRatingParameter: boolean;
  value?: unknown;
  // Dependent dropdown properties
  dependentOn?: string;
  dependentOptions?: Record<string, string[]>;
  dependentOptionsUrl?: string;
  // Conditional logic for field visibility
  conditionalLogic?: {
    field: string;
    condition: string;
    value: string;
  };
  // DatePeriod specific properties
  fromDateLabel?: string;
  toDateLabel?: string;
  periodCalculationUnit?: 'days' | 'months' | 'years';
  autoCalculatePeriod?: boolean;
  // Combination field properties
  combinationRows?: number;
  combinationRowLabels?: string[];
  // ChooseButton / Button properties
  buttonVariant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost' | 'link';
  // Metadata for additional field config
  metadata?: {
    masterKey?: string;
    fromDateLabel?: string;
    toDateLabel?: string;
    periodCalculationUnit?: string;
    autoCalculatePeriod?: string | boolean;
  };
}

export interface TemplatePageSection {
  id: string;
  title: string;
  fields: TemplateFieldItem[];
  subtitle: string;
  sectionOrder: number;
  metadata?: {
    visibility?: {
      field: string;
      condition: string;
      valueText?: string;
      masterId?: string;
      masterValueId?: string;
    };
  };
}
export interface TemplateNavigationField {
  type: FieldType;
  navOrder: number;
  buttonText: string;
  buttonAction: 'submit' | 'next' | 'back' | 'custom' | 'api';
  buttonTargetPage?: string;
  label: string;
  name: string;
}

export interface TemplatePageValidation {
  id: string;
  fieldNames: string[];
  condition: 'lessThan' | 'moreThan' | 'lessThanOrEqual' | 'moreThanOrEqual' | 'equal';
  value: number;
  message: string;
}

export interface TemplatePageItem {
  id: string;
  title: string;
  pageType: PageType;
  sections: TemplatePageSection[];
  subtitle: string;
  pageOrder: number;
  navigationFields: TemplateNavigationField[];
  validations: TemplatePageValidation[];
}

export interface ProposalTemplate {
  name: string;
  pages: TemplatePageItem[];
  additionalInformationPages?: TemplatePageItem[];
  productId: string;
  templateId: string;
  currency?: string;
}

export interface UploadedFileValue {
  id: string;
  filename: string;
  originalFilename: string;
  url: string;
  size: number;
  uploadDate: string;
  uploadedById: string;
}
export interface RequireDocument {
  description: string;
  id: string;
  isRequired: boolean;
  label: string;
  validationQuestions?: Array<{
    id?: string;
    question: string;
  }>;
  value: UploadedFileValue;
}
export interface IntegrationBlockedInfo {
  integrationId: string;
  integrationName: string;
  errorMessage: string;
  blockedAtPage: string;
}

export interface ProposalFormEditResponse {
  responseId: string;
  templateId: string;
  templateVersionId: string;
  productId: string;
  status: string;
  template: ProposalTemplate;
  requiredDocuments?: RequireDocument[];
  workflow?: ProductWorkflowResponse;
  isLocked?: boolean;
  integrationBlockedInfo?: IntegrationBlockedInfo | null;
  currency: string;
}

export const getProposalFormForEdit = async (
  quoteId: string,
): Promise<ProposalFormEditResponse> => {
  const response = await apiGet<ProposalFormEditResponse>(`/quote/${quoteId}/render`);
  return response;
};
