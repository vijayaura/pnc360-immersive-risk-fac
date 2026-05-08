import type { Field, Page } from '@/features/product-config/proposal-form/api/proposalFormDesign';

export type NumberUnit = 'millions' | 'thousand' | 'hundredThousand';

export interface BaseFieldProps {
  field: Field | any;
  value: any;
  error?: string;
  errors?: Record<string, string>;
  formData?: Record<string, any>;
  currency?: string;
  numberUnit?: NumberUnit | '';
  onChange: (name: string, value: any) => void;
  isFieldRequired: (field: Field) => boolean;
  onOpenMap?: (fieldId: string) => void;
  formResponseId?: string | number | null;
  productId?: string;
  productThemeColor?: string;
  pages?: Page[];
  /** When true (e.g. non-technical endorsement rating params), field is read-only with prefilled value */
  disabled?: boolean;
  /** When true (non-technical endorsement), CombinationField disables each subfield that has isRatingParameter */
  disableRatingParameters?: boolean;
}
