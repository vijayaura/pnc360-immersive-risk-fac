import type { Field, Page } from '@/features/product-config/proposal-form/api/proposalFormDesign';
import type { NumberUnit } from '../types/form';
import {
  NumberField,
  TextareaField,
  TextField,
  DropdownField,
  CheckboxField,
  ConsentField,
  DateField,
  TimeField,
  DatePeriodField,
  RepeatableField,
  MultiselectField,
  MultiselectDropdownField,
  FileField,
  CombinationField,
  ChooseButtonField,
  PolicyPeriodField,
  LocationField,
} from './fields';
import { FetchIntegrationButton } from './DynamicProposalForm/FetchIntegrationButton';

interface Props {
  field: Field;
  value: any;
  error?: string;
  errors?: Record<string, string>;
  formData: Record<string, any>;
  currency?: string;
  numberUnit?: NumberUnit | '';
  onChange: (name: string, value: any) => void;
  shouldShowField: (field: Field) => boolean;
  isFieldRequired: (field: Field) => boolean;
  onOpenMap?: (fieldId: string) => void;
  formResponseId?: string | number | null;
  productId?: string;
  productThemeColor?: string;
  pages?: Page[]; // Pass pages for reference resolution
  disabled?: boolean;
  /** When true, CombinationField disables each subfield where isRatingParameter is true */
  disableRatingParameters?: boolean;
  /** Whether this field has an API integration attached */
  hasIntegration?: boolean;
  /** Callback to execute the field-level integration */
  onExecuteIntegration?: (fieldId: string) => Promise<boolean>;
}

export function FieldRenderer(props: Props) {
  const { field, shouldShowField, hasIntegration, onExecuteIntegration } = props;
  const displayField = {
    ...field,
    label:
      field.metadata?.isCustomerName === true ||
      String(field.metadata?.isCustomerName).toLowerCase() === 'true'
        ? `${field.label} (Customer Name)`
        : field.label,
  };

  if (!shouldShowField(field)) return null;

  const fieldElement = (() => {
    switch (field.type) {
      case 'text':
        return <TextField {...props} field={displayField} />;
      case 'number':
        return <NumberField {...props} field={displayField} />;
      case 'textarea':
        return <TextareaField {...props} field={displayField} />;
      case 'dropdown':
        return <DropdownField {...props} field={displayField} />;
      case 'checkbox':
        return <CheckboxField {...props} field={displayField} />;
      case 'consent':
        return <ConsentField {...props} field={displayField} />;
      case 'date':
        return <DateField {...props} field={displayField} />;
      case 'time':
        return <TimeField {...props} field={displayField} />;
      case 'datePeriod':
        return <DatePeriodField {...props} field={displayField} />;
      case 'repeatable':
        return <RepeatableField {...props} field={displayField} />;
      case 'combination':
        return <CombinationField {...props} field={displayField} pages={props.pages} />;
      case 'multiselect':
        return <MultiselectField {...props} field={displayField} />;
      case 'multiselectDropdown':
        return <MultiselectDropdownField {...props} field={displayField} />;
      case 'file':
        return <FileField {...props} field={displayField} />;
      case 'chooseButton':
        return <ChooseButtonField {...props} field={displayField} />;
      case 'policyPeriod':
        return <PolicyPeriodField {...props} field={displayField} />;
      case 'location':
        return <LocationField {...props} field={displayField} onOpenMap={props.onOpenMap || (() => { })} />;
      default:
        return null;
    }
  })();

  if (!fieldElement) return null;

  if (hasIntegration && onExecuteIntegration) {
    return (
      <div className="relative">
        {fieldElement}
        <div className="absolute right-1.5 bottom-[26px] z-10">
          <FetchIntegrationButton
            onExecute={() => onExecuteIntegration(field.id || field.name)}
            disabled={props.disabled}
          />
        </div>
      </div>
    );
  }

  return fieldElement;
}
