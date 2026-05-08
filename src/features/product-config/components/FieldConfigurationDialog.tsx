import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TimePicker } from '@/components/ui/time-picker';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Trash2,
  Type,
  Hash,
  Calendar,
  Clock,
  CheckSquare,
  Upload,
  List,
  MapPin,
  CalendarDays,
  MousePointer2,
  Maximize2,
  FileText,
  ArrowRight,
  ArrowLeft as ArrowLeftIcon,
  Send,
  Circle,
  CheckCircle2,
} from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import {
  type Page,
  type Field,
  type SubField,
  type FieldType,
  type LegacyConditionalLogicConfig,
} from '@/features/product-config/proposal-form/api/proposalFormDesign';
import { getDateFieldDefaultValue } from '@/features/product-config/proposal-form/utils/dateDefaults';
import { LocationPreviewField } from '@/features/product-config/proposal-form/components/LocationPreviewField';

const fieldTypes = [
  { value: 'text', label: 'Text', icon: <Type className="w-4 h-4" />, canBeRating: true },
  { value: 'number', label: 'Number', icon: <Hash className="w-4 h-4" />, canBeRating: true },
  { value: 'date', label: 'Date', icon: <Calendar className="w-4 h-4" />, canBeRating: true },
  { value: 'time', label: 'Time', icon: <Clock className="w-4 h-4" />, canBeRating: true },
  { value: 'dropdown', label: 'Dropdown', icon: <List className="w-4 h-4" />, canBeRating: true },
  {
    value: 'checkbox',
    label: 'Checkbox',
    icon: <CheckSquare className="w-4 h-4" />,
    canBeRating: true,
  },
  {
    value: 'textarea',
    label: 'Text Area',
    icon: <FileText className="w-4 h-4" />,
    canBeRating: false,
  },
  { value: 'file', label: 'File Upload', icon: <Upload className="w-4 h-4" />, canBeRating: false },
  {
    value: 'location',
    label: 'Location',
    icon: <MapPin className="w-4 h-4" />,
    canBeRating: false,
  },
  {
    value: 'datePeriod',
    label: 'Date Period',
    icon: <CalendarDays className="w-4 h-4" />,
    canBeRating: false,
  },
  {
    value: 'multiselect',
    label: 'Multi Select',
    icon: <List className="w-4 h-4" />,
    canBeRating: true,
  },
  {
    value: 'combination',
    label: 'Combination',
    icon: <Maximize2 className="w-4 h-4" />,
    canBeRating: true,
  },
  {
    value: 'chooseButton',
    label: 'Choose Button',
    icon: <MousePointer2 className="w-4 h-4" />,
    canBeRating: false,
  },
  // { value: "nextButton", label: "Next Button", icon: <ArrowRight className="w-4 h-4" />, canBeRating: false },
  // { value: "backButton", label: "Back Button", icon: <ArrowLeftIcon className="w-4 h-4" />, canBeRating: false },
  // { value: "submitButton", label: "Submit Button", icon: <Send className="w-4 h-4" />, canBeRating: false },
  // { value: "button", label: "Button", icon: <MousePointer2 className="w-4 h-4" />, canBeRating: false },
];

const getStringMetadataValue = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const getBooleanMetadataValue = (value: unknown): boolean => value === true;

const resolveMapProviderValue = (provider: unknown, apiUrl: unknown): 'default' | 'google' => {
  const normalizedProvider =
    typeof provider === 'string' ? provider.trim().toLowerCase() : '';
  if (normalizedProvider === 'default' || normalizedProvider === 'google') {
    return normalizedProvider;
  }

  const normalizedApiUrl = typeof apiUrl === 'string' ? apiUrl.trim().toLowerCase() : '';
  if (normalizedApiUrl.includes('maps.googleapis.com')) {
    return 'google';
  }
  if (normalizedApiUrl.includes('nominatim.openstreetmap.org')) {
    return 'default';
  }

  return 'google';
};

const isLegacyConditionalLogic = (
  value: Field['conditionalLogic'],
): value is LegacyConditionalLogicConfig =>
  Boolean(
    value &&
      typeof value === 'object' &&
      'field' in value &&
      'condition' in value &&
      'value' in value,
  );

interface FieldConfigurationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isConfiguringField: boolean;
  fieldConfig: Partial<Field>;
  setFieldConfig: (config: Partial<Field>) => void;
  saveField: () => void;
  pages: Page[];
  setPages: (pages: Page[]) => void;
  subFieldsConfig: SubField[];
  setSubFieldsConfig: (config: SubField[]) => void;
  combinationRowsCount: number;
  setCombinationRowsCount: (count: number) => void;
  combinationRowLabels: string[];
  setCombinationRowLabels: (labels: string[]) => void;
  combinationRowLabelsInput: string;
  setCombinationRowLabelsInput: (input: string) => void;
  optionsInput: string;
  setOptionsInput: (input: string) => void;
  dependentOptionsInput: string;
  setDependentOptionsInput: (input: string) => void;
  subFieldOptionsInput: Record<string, string>;
  setSubFieldOptionsInput: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  selectedFieldId: string | null;
  generateFieldName: (label: string) => string;
}

export const FieldConfigurationDialog: React.FC<FieldConfigurationDialogProps> = ({
  open,
  onOpenChange,
  isConfiguringField,
  fieldConfig,
  setFieldConfig,
  saveField,
  pages,
  setPages,
  subFieldsConfig,
  setSubFieldsConfig,
  combinationRowsCount,
  setCombinationRowsCount,
  combinationRowLabels,
  setCombinationRowLabels,
  combinationRowLabelsInput,
  setCombinationRowLabelsInput,
  optionsInput,
  setOptionsInput,
  dependentOptionsInput,
  setDependentOptionsInput,
  subFieldOptionsInput,
  setSubFieldOptionsInput,
  selectedFieldId,
  generateFieldName,
}) => {
  const { toast } = useToast();
  const legacyConditionalLogic = isLegacyConditionalLogic(fieldConfig.conditionalLogic)
    ? fieldConfig.conditionalLogic
    : undefined;

  const parseCSVLabels = (input: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < input.length; i++) {
      const ch = input[i];
      if (ch === '"') {
        if (inQuotes && input[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        const token = current.trim();
        if (token) result.push(token);
        current = '';
      } else {
        current += ch;
      }
    }
    const finalToken = current.trim();
    if (finalToken) result.push(finalToken);
    return result;
  };

  const formatCSVLabels = (labels: string[]): string =>
    labels
      .map((l) => {
        const escaped = String(l).replace(/"/g, '""');
        return /,|\s/.test(escaped) ? `"${escaped}"` : escaped;
      })
      .join(', ');

  const renderFieldPreview = (field: Field) => {
    switch (field.type) {
      case 'text':
        return (
          <div className="space-y-2">
            <Label>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Input
              placeholder={field.placeholder}
              defaultValue={typeof field.defaultValue === 'string' ? field.defaultValue : undefined}
            />
          </div>
        );
      case 'textarea':
        return (
          <div className="space-y-2">
            <Label>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              placeholder={field.placeholder}
              defaultValue={typeof field.defaultValue === 'string' ? field.defaultValue : undefined}
              className="min-h-[100px]"
            />
          </div>
        );
      case 'number':
        return (
          <div className="space-y-2">
            <Label>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Input
              type="number"
              placeholder={field.placeholder}
              defaultValue={
                typeof field.defaultValue === 'number' ? String(field.defaultValue) : undefined
              }
            />
          </div>
        );
      case 'dropdown':
        return (
          <div className="space-y-2">
            <Label>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Select
              defaultValue={typeof field.defaultValue === 'string' ? field.defaultValue : undefined}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    field.dependentOn
                      ? `Select ${field.label.toLowerCase()} (depends on ${field.dependentOn})`
                      : field.placeholder || 'Select...'
                  }
                />
              </SelectTrigger>
              {field.dependentOptions && (
                <SelectContent>
                  {/* In preview, show all possible options grouped by parent */}
                  {Object.entries(field.dependentOptions).map(([parent, children]) => (
                    <React.Fragment key={parent}>
                      {children.map((child, idx) => (
                        <SelectItem key={`${parent}-${idx}`} value={child}>
                          {child}
                        </SelectItem>
                      ))}
                    </React.Fragment>
                  ))}
                </SelectContent>
              )}
              {!field.dependentOptions && field.options && field.options.length > 0 && (
                <SelectContent>
                  {field.options.map((option, idx) => (
                    <SelectItem
                      key={idx}
                      value={typeof option === 'string' ? option : option.value}
                    >
                      {typeof option === 'string' ? option : option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              )}
              {!field.dependentOptions && field.optionsUrl && (
                <SelectContent>
                  <SelectItem value="loading" disabled>
                    Loading options from URL...
                  </SelectItem>
                </SelectContent>
              )}
            </Select>
            {field.dependentOn && (
              <p className="text-xs text-muted-foreground">
                Options depend on: {field.dependentOn}
              </p>
            )}
            {field.optionsUrl && !field.dependentOn && (
              <p className="text-xs text-muted-foreground">
                Options loaded from: {field.optionsUrl}
              </p>
            )}
          </div>
        );
      case 'date':
        return (
          <div className="space-y-2">
            <Label>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Input
              type="date"
              defaultValue={typeof field.defaultValue === 'string' ? field.defaultValue : undefined}
            />
          </div>
        );
      case 'time':
        return (
          <div className="space-y-2">
            <Label>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <TimePicker
              value={typeof field.defaultValue === 'string' ? field.defaultValue : ''}
              onChange={() => {}}
            />
          </div>
        );
      case 'datePeriod':
        return (
          <div className="space-y-4">
            <Label>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  {field.fromDateLabel || 'From Date'}
                </Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  {field.toDateLabel || 'To Date'}
                </Label>
                <Input type="date" />
              </div>
            </div>
            {field.autoCalculatePeriod !== false && (
              <div className="p-2 bg-muted rounded text-sm">
                <span className="text-muted-foreground">Period: </span>
                <span className="font-medium">0 {field.periodCalculationUnit || 'months'}</span>
              </div>
            )}
          </div>
        );
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              className="w-4 h-4"
              defaultChecked={field.defaultValue === true}
            />
            <Label>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
          </div>
        );
      case 'file':
        return (
          <div className="space-y-2">
            <Label>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Button variant="outline" className="w-full">
              <Upload className="w-4 h-4 mr-2" />
              Upload File
            </Button>
          </div>
        );
      case 'multiselect':
        return (
          <div className="space-y-2">
            <Label>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder || 'Select options...'} />
              </SelectTrigger>
              {field.options && field.options.length > 0 && (
                <SelectContent>
                  {field.options.map((option, idx) => (
                    <SelectItem
                      key={idx}
                      value={typeof option === 'string' ? option : option.value}
                    >
                      {typeof option === 'string' ? option : option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              )}
            </Select>
            {Array.isArray(field.defaultValue) && field.defaultValue.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {field.defaultValue.map((val, idx) => (
                  <Badge key={idx} variant="secondary">
                    {val}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        );
      case 'location':
        return <LocationPreviewField field={field} />;
      case 'combination':
        return (
          <div className="space-y-2">
            <Label>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            {field.subFields && field.subFields.length > 0 ? (
              <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                {/* Table Header */}
                <div
                  className="grid gap-2"
                  style={{
                    gridTemplateColumns: `${
                      field.combinationRowLabels && field.combinationRowLabels.length > 0
                        ? '100px '
                        : ''
                    }repeat(${field.subFields.length}, minmax(0, 1fr)) 80px`,
                  }}
                >
                  {field.combinationRowLabels && field.combinationRowLabels.length > 0 && (
                    <div className="text-xs font-semibold text-muted-foreground">Year</div>
                  )}
                  {field.subFields.map((subField) => (
                    <Label key={subField.id} className="text-xs font-semibold">
                      {subField.label}{' '}
                      {subField.required && <span className="text-destructive">*</span>}
                    </Label>
                  ))}
                  <div className="text-xs font-semibold text-muted-foreground text-center">
                    Actions
                  </div>
                </div>

                {/* Rows (Preview shows configured number of rows) */}
                {Array.from({ length: field.combinationRows || 1 }, (_, rowNum) => (
                  <div
                    key={rowNum}
                    className="grid gap-2 items-center"
                    style={{
                      gridTemplateColumns: `${
                        field.combinationRowLabels && field.combinationRowLabels.length > 0
                          ? '100px '
                          : ''
                      }repeat(${field.subFields.length}, minmax(0, 1fr)) 80px`,
                    }}
                  >
                    {field.combinationRowLabels && field.combinationRowLabels.length > 0 && (
                      <div className="text-sm font-medium text-muted-foreground">
                        {field.combinationRowLabels[rowNum] || `${rowNum + 1}`}
                      </div>
                    )}
                    {field.subFields?.map((subField) => (
                      <div key={subField.id}>
                        {subField.type === 'text' && (
                          <Input
                            type="text"
                            placeholder={
                              subField.placeholder || `Enter ${subField.label.toLowerCase()}`
                            }
                            className="text-sm"
                          />
                        )}
                        {subField.type === 'number' && (
                          <Input
                            type="number"
                            placeholder={
                              subField.placeholder || `Enter ${subField.label.toLowerCase()}`
                            }
                            className="text-sm"
                          />
                        )}
                        {subField.type === 'date' && <Input type="date" className="text-sm" />}
                        {subField.type === 'dropdown' && (
                          <Select>
                            <SelectTrigger className="text-sm">
                              <SelectValue
                                placeholder={
                                  subField.placeholder || `Select ${subField.label.toLowerCase()}`
                                }
                              />
                            </SelectTrigger>
                            {subField.options && subField.options.length > 0 && (
                              <SelectContent>
                                {subField.options.map((option, optIdx) => (
                                  <SelectItem
                                    key={optIdx}
                                    value={typeof option === 'string' ? option : option.value}
                                  >
                                    {typeof option === 'string' ? option : option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            )}
                          </Select>
                        )}
                      </div>
                    ))}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                {/* Add Row Button */}
                <Button variant="outline" className="w-full gap-2">
                  <Plus className="w-4 h-4" />
                  Add Row
                </Button>
              </div>
            ) : (
              <div className="border rounded-lg p-4 bg-muted/30">
                <p className="text-sm text-muted-foreground text-center">
                  No sub-fields configured. Click edit to add sub-fields.
                </p>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Add multiple rows. Each row will be submitted as an object in an array.
            </p>
          </div>
        );
      case 'chooseButton':
        return (
          <div className="space-y-2">
            <Label>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <div className="flex flex-wrap gap-2">
              {field.options && field.options.length > 0 ? (
                field.options.map((option, idx) => {
                  const label = typeof option === 'string' ? option : option.label;
                  const value =
                    typeof option === 'string' ? option : (option.value ?? option.label);
                  const selectedValue =
                    typeof field.defaultValue === 'string' ? field.defaultValue : undefined;
                  const isSelected = selectedValue !== undefined && value === selectedValue;
                  const variant = isSelected ? 'default' : field.buttonVariant || 'outline';
                  return (
                    <Button key={idx} variant={variant} className="gap-2">
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                      {label}
                    </Button>
                  );
                })
              ) : (
                <div className="border rounded-lg p-4 bg-muted/30 w-full">
                  <p className="text-sm text-muted-foreground text-center">
                    No options configured. Click edit to add button options.
                  </p>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Radio-style button selection. Only one option can be selected.
            </p>
          </div>
        );
      case 'nextButton':
        return (
          <div className="space-y-2">
            <Button variant={field.buttonVariant || 'default'} className="w-full gap-2">
              {field.buttonText || 'Next'}
              <ArrowRight className="w-4 h-4" />
            </Button>
            {field.buttonApiUrl && (
              <p className="text-xs text-muted-foreground">API: {field.buttonApiUrl}</p>
            )}
          </div>
        );
      case 'backButton':
        return (
          <div className="space-y-2">
            <Button variant={field.buttonVariant || 'outline'} className="w-full gap-2">
              <ArrowLeftIcon className="w-4 h-4" />
              {field.buttonText || 'Back'}
            </Button>
            {field.buttonTargetPage && (
              <p className="text-xs text-muted-foreground">
                Navigates to: {field.buttonTargetPage}
              </p>
            )}
          </div>
        );
      case 'submitButton':
        return (
          <div className="space-y-2">
            <Button variant={field.buttonVariant || 'default'} className="w-full gap-2">
              <Send className="w-4 h-4" />
              {field.buttonText || 'Submit'}
            </Button>
            {field.buttonApiUrl && (
              <p className="text-xs text-muted-foreground">Submit API: {field.buttonApiUrl}</p>
            )}
          </div>
        );
      case 'button':
        return (
          <div className="space-y-2">
            <Button variant={field.buttonVariant || 'default'} className="w-full gap-2">
              {field.buttonText || field.label || 'Button'}
            </Button>
            {field.buttonApiUrl && (
              <p className="text-xs text-muted-foreground">Action API: {field.buttonApiUrl}</p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`${
          fieldConfig.type === 'combination'
            ? 'max-w-7xl max-h-[90vh] overflow-y-auto'
            : 'max-w-6xl max-h-[90vh] overflow-y-auto'
        } [&>button]:hidden`}
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{isConfiguringField ? 'Configure Field' : 'Edit Field'}</DialogTitle>
              <DialogDescription>
                {isConfiguringField
                  ? 'Configure the field properties and settings'
                  : 'Update the field properties and settings'}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={saveField}>
                {isConfiguringField ? 'Add Field' : 'Update Field'}
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-6 py-4">
          {/* Left Column: Configuration */}
          <div className="space-y-4 overflow-y-auto max-h-[calc(90vh-120px)] pr-2">
            <div className="space-y-2">
              <Label>Field Type</Label>
              <Select
                value={fieldConfig.type}
                onValueChange={(value) => {
                  const newType = value as FieldType;
                  const buttonTypes = [
                    'chooseButton',
                    'nextButton',
                    'backButton',
                    'submitButton',
                    'button',
                  ];

                  // Build updated config object
                  const updatedConfig: Partial<Field> = {
                    ...fieldConfig,
                    type: newType,
                    defaultValue: newType === fieldConfig.type ? fieldConfig.defaultValue : '',
                  };

                  // Clear rating parameter if changing to text, file, location, or button types
                  if (
                    (newType === 'text' ||
                      newType === 'file' ||
                      newType === 'location' ||
                      buttonTypes.includes(newType)) &&
                    fieldConfig.isRatingParameter
                  ) {
                    updatedConfig.isRatingParameter = false;
                  }

                  // Clear master data if changing to text, number, date, datePeriod, file, or location types
                  if (
                    (newType === 'text' ||
                      newType === 'number' ||
                      newType === 'date' ||
                      newType === 'datePeriod' ||
                      newType === 'file' ||
                      newType === 'location') &&
                    fieldConfig.isMasterData
                  ) {
                    updatedConfig.isMasterData = false;
                    updatedConfig.masterDataTable = undefined;
                  }


                  // Initialize date period defaults if changing to datePeriod type
                  if (newType === 'datePeriod') {
                    updatedConfig.fromDateLabel = updatedConfig.fromDateLabel || 'From Date';
                    updatedConfig.toDateLabel = updatedConfig.toDateLabel || 'To Date';
                    updatedConfig.periodCalculationUnit =
                      updatedConfig.periodCalculationUnit || 'months';
                    updatedConfig.autoCalculatePeriod = updatedConfig.autoCalculatePeriod !== false;
                  }

                  // Set default button text based on type
                  if (newType === 'nextButton') {
                    updatedConfig.buttonText = 'Next';
                    updatedConfig.buttonVariant = 'default';
                  } else if (newType === 'backButton') {
                    updatedConfig.buttonText = 'Back';
                    updatedConfig.buttonVariant = 'outline';
                  } else if (newType === 'submitButton') {
                    updatedConfig.buttonText = 'Submit';
                    updatedConfig.buttonVariant = 'default';
                  }

                  // Clear master data if changing to combination type
                  if (newType === 'combination' && fieldConfig.isMasterData) {
                    updatedConfig.isMasterData = false;
                  }

                  // Clear subFields and row config if not combination type
                  if (newType !== 'combination') {
                    setSubFieldsConfig([]);
                    setCombinationRowsCount(1);
                    setCombinationRowLabels([]);
                  }

                  // Initialize map configuration if changing to location type
                  if (newType === 'location') {
                    if (!fieldConfig.mapProvider) {
                      updatedConfig.mapProvider = 'google';
                      updatedConfig.metadata = {
                        ...updatedConfig.metadata,
                        mapProvider: 'google',
                        mapApiUrl: 'https://maps.googleapis.com/maps/api/js',
                      };
                      updatedConfig.mapApiUrl = 'https://maps.googleapis.com/maps/api/js';
                    }
                  } else {
                    // Clear map configuration if changing away from location type
                    updatedConfig.mapProvider = undefined;
                    updatedConfig.mapApiUrl = undefined;
                  }

                  setFieldConfig(updatedConfig);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  className="max-h-[300px]"
                  viewportClassName="max-h-[300px] overflow-y-auto p-1"
                >
                  {/* Free Input Fields */}
                  <SelectGroup>
                    <SelectLabel>Free Input Fields</SelectLabel>
                    {fieldTypes
                      .filter((ft) =>
                        ['text', 'date', 'time', 'number', 'location', 'datePeriod'].includes(
                          ft.value,
                        ),
                      )
                      .map((ft) => (
                        <SelectItem key={ft.value} value={ft.value}>
                          <div className="flex items-center gap-2">
                            {ft.icon}
                            {ft.label}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectGroup>

                  <SelectSeparator />

                  {/* Master Data Fields */}
                  <SelectGroup>
                    <SelectLabel>Master Data Fields</SelectLabel>
                    {fieldTypes
                      .filter((ft) =>
                        ['dropdown', 'checkbox', 'multiselect', 'combination'].includes(ft.value),
                      )
                      .map((ft) => (
                        <SelectItem key={ft.value} value={ft.value}>
                          <div className="flex items-center gap-2">
                            {ft.icon}
                            {ft.label}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectGroup>

                  <SelectSeparator />

                  {/* Buttons */}
                  <SelectGroup>
                    <SelectLabel>Buttons</SelectLabel>
                    {fieldTypes
                      .filter((ft) =>
                        [
                          'chooseButton',
                          'nextButton',
                          'backButton',
                          'submitButton',
                          'button',
                          'file',
                        ].includes(ft.value),
                      )
                      .map((ft) => (
                        <SelectItem key={ft.value} value={ft.value}>
                          <div className="flex items-center gap-2">
                            {ft.icon}
                            {ft.label}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-6 gap-4">
              <div className="space-y-2 col-span-4">
                <Label>Field Label *</Label>
                <Input
                  value={fieldConfig.label || ''}
                  onChange={(e) => {
                    const label = e.target.value;
                    const autoName = generateFieldName(label);
                    setFieldConfig({
                      ...fieldConfig,
                      label,
                      name: autoName,
                      // Update master data table name if master data is enabled
                      masterDataTable:
                        fieldConfig.isMasterData && autoName
                          ? `${autoName}_master`
                          : fieldConfig.masterDataTable,
                    });
                  }}
                  placeholder="e.g., Company Name"
                />
                <p className="text-xs text-muted-foreground">
                  Field name will be auto-generated from the label
                </p>
              </div>
              <div className="space-y-2 col-span-2 flex flex-col pt-[10px]">
                <Label htmlFor="ratingParameter" className="mb-0">
                  Rating Parameter
                </Label>
                <div className="mt-2">
                  <Switch
                    id="ratingParameter"
                    checked={fieldConfig.isRatingParameter || false}
                    onCheckedChange={(checked) => {
                      setFieldConfig({
                        ...fieldConfig,
                        isRatingParameter: checked,
                      });
                    }}
                    disabled={
                      fieldConfig.type === 'text' ||
                      fieldConfig.type === 'file' ||
                      fieldConfig.type === 'location' ||
                      fieldConfig.type === 'chooseButton' ||
                      fieldConfig.type === 'nextButton' ||
                      fieldConfig.type === 'backButton' ||
                      fieldConfig.type === 'submitButton' ||
                      fieldConfig.type === 'button'
                    }
                  />
                </div>
              </div>
            </div>

            {/* Placeholder and Default Value in one row */}
            {fieldConfig.type !== 'file' &&
            fieldConfig.type !== 'combination' &&
            fieldConfig.type !== 'chooseButton' &&
            fieldConfig.type !== 'nextButton' &&
            fieldConfig.type !== 'backButton' &&
            fieldConfig.type !== 'submitButton' &&
            fieldConfig.type !== 'button' ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Placeholder</Label>
                  <Input
                    value={fieldConfig.placeholder || ''}
                    onChange={(e) =>
                      setFieldConfig({
                        ...fieldConfig,
                        placeholder: e.target.value,
                      })
                    }
                    placeholder="Enter placeholder text"
                  />
                </div>

                {/* Default Value */}
                <div className="space-y-2">
                  <Label>Default Value</Label>
                  {fieldConfig.type === 'checkbox' ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={fieldConfig.defaultValue === true}
                        onChange={(e) =>
                          setFieldConfig({
                            ...fieldConfig,
                            defaultValue: e.target.checked ? true : undefined,
                          })
                        }
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label className="text-sm font-normal">Checked by default</Label>
                    </div>
                  ) : fieldConfig.type === 'dropdown' ? (
                    <Select
                      value={
                        typeof fieldConfig.defaultValue === 'string'
                          ? fieldConfig.defaultValue
                          : 'none'
                      }
                      onValueChange={(value) => {
                        if (value === 'none') {
                          setFieldConfig({
                            ...fieldConfig,
                            defaultValue: undefined,
                          });
                        } else {
                          setFieldConfig({
                            ...fieldConfig,
                            defaultValue: value,
                          });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select default value (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No default value</SelectItem>
                        {(fieldConfig.options || []).map((option) => (
                          <SelectItem
                            key={typeof option === 'string' ? option : option.value}
                            value={typeof option === 'string' ? option : option.value}
                          >
                            {typeof option === 'string' ? option : option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : fieldConfig.type === 'multiselect' ? (
                    <div className="space-y-2">
                      <Select
                        value={undefined}
                        onValueChange={(value) => {
                          if (value) {
                            const currentDefaults = Array.isArray(fieldConfig.defaultValue)
                              ? fieldConfig.defaultValue
                              : [];
                            if (!currentDefaults.includes(value)) {
                              setFieldConfig({
                                ...fieldConfig,
                                defaultValue: [...currentDefaults, value],
                              });
                            }
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select default values (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {(fieldConfig.options || []).map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {Array.isArray(fieldConfig.defaultValue) &&
                        fieldConfig.defaultValue.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {fieldConfig.defaultValue.map((val, idx) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="flex items-center gap-1"
                              >
                                {val}
                                <button
                                  onClick={() => {
                                    const newDefaults = [...(fieldConfig.defaultValue as string[])];
                                    newDefaults.splice(idx, 1);
                                    setFieldConfig({
                                      ...fieldConfig,
                                      defaultValue:
                                        newDefaults.length > 0 ? newDefaults : undefined,
                                    });
                                  }}
                                  className="ml-1 hover:text-destructive"
                                >
                                  ×
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                    </div>
                  ) : fieldConfig.type === 'date' ? (
                    <Input
                      type="date"
                      value={
                        typeof fieldConfig.defaultValue === 'string' ? fieldConfig.defaultValue : ''
                      }
                      onChange={(e) =>
                        setFieldConfig({
                          ...fieldConfig,
                          defaultValue: e.target.value || undefined,
                        })
                      }
                    />
                  ) : fieldConfig.type === 'time' ? (
                    <TimePicker
                      value={
                        typeof fieldConfig.defaultValue === 'string' ? fieldConfig.defaultValue : ''
                      }
                      onChange={(time) =>
                        setFieldConfig({
                          ...fieldConfig,
                          defaultValue: time || undefined,
                        })
                      }
                    />
                  ) : fieldConfig.type === 'number' ? (
                    <Input
                      type="number"
                      step="any"
                      value={
                        typeof fieldConfig.defaultValue === 'number'
                          ? String(fieldConfig.defaultValue)
                          : ''
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || val === '-') {
                          setFieldConfig({
                            ...fieldConfig,
                            defaultValue: undefined,
                          });
                        } else {
                          const numVal = Number(val);
                          if (!isNaN(numVal)) {
                            setFieldConfig({
                              ...fieldConfig,
                              defaultValue: numVal,
                            });
                          }
                        }
                      }}
                      placeholder="Enter default number"
                    />
                  ) : (
                    <Input
                      value={
                        typeof fieldConfig.defaultValue === 'string' ? fieldConfig.defaultValue : ''
                      }
                      onChange={(e) =>
                        setFieldConfig({
                          ...fieldConfig,
                          defaultValue: e.target.value || undefined,
                        })
                      }
                      placeholder="Enter default value"
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Placeholder</Label>
                <Input
                  value={fieldConfig.placeholder || ''}
                  onChange={(e) =>
                    setFieldConfig({
                      ...fieldConfig,
                      placeholder: e.target.value,
                    })
                  }
                  placeholder="Enter placeholder text"
                />
              </div>
            )}

            {/* Location Coordinates Configuration */}
            {fieldConfig.type === 'location' && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-sm font-semibold">Map Service Configuration</h3>
                <div className="space-y-2">
                  <Label>Map Provider</Label>
	                  <Select
	                    value={
	                      resolveMapProviderValue(
                          fieldConfig.metadata?.mapProvider ?? fieldConfig.mapProvider,
                          fieldConfig.metadata?.mapApiUrl ?? fieldConfig.mapApiUrl,
                        )
	                    }
                    onValueChange={(value) => {
                      setFieldConfig({
                        ...fieldConfig,
                        metadata: {
                          ...fieldConfig.metadata,
                          mapProvider: value,
                          mapApiUrl:
                            value === 'google'
                              ? 'https://maps.googleapis.com/maps/api/js'
                              : 'https://nominatim.openstreetmap.org',
                        },
                        mapProvider: value, // Keep top-level for immediate UI feedback/compat
                        mapApiUrl:
                          value === 'google'
                            ? 'https://maps.googleapis.com/maps/api/js'
                            : 'https://nominatim.openstreetmap.org',
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select map provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google">Default (Google Map)</SelectItem>
                      <SelectItem value="default">Street Map View</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Select the map service provider you want to use
                  </p>
                </div>
              </div>
            )}

            {/* Combination Field Configuration */}
            {fieldConfig.type === 'combination' && (
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Combination Configuration</h3>
                </div>

                {/* Row Configuration */}
                <div className="space-y-2">
                  <Label>Number of Rows</Label>
                  <Input
                    type="number"
                    min="1"
                    value={combinationRowsCount}
                    onChange={(e) => {
                      const count = parseInt(e.target.value) || 1;
                      setCombinationRowsCount(count);
                      setFieldConfig({
                        ...fieldConfig,
                        combinationRows: count,
                      });
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Row Labels (comma-separated)</Label>
                  <Input
                    value={combinationRowLabelsInput}
                    onChange={(e) => {
                      const input = e.target.value;
                      setCombinationRowLabelsInput(input);
                      const labels = parseCSVLabels(input);
                      setCombinationRowLabels(labels);
                      setFieldConfig({
                        ...fieldConfig,
                        combinationRowLabels: labels,
                      });
                    }}
                    placeholder="e.g., Year 1, Year 2, Year 3"
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional: Labels for each row (e.g., years). If provided, must match number of
                    rows.
                  </p>
                </div>

                {/* Add Import Export Button Checkbox */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
	                    <Switch
	                      id="addImportExportButton"
	                      checked={getBooleanMetadataValue(fieldConfig.metadata?.addImportExportButton)}
	                      onCheckedChange={(checked) => {
	                        setFieldConfig({
                          ...fieldConfig,
                          metadata: {
                            ...fieldConfig.metadata,
                            addImportExportButton: checked,
                          },
                        });
                      }}
                    />
                    <Label
                      htmlFor="addImportExportButton"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Add import export button
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enable import/export functionality for this combination field
                  </p>
                </div>

                <Separator />

                {/* Sub-fields Configuration */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Sub-Fields (Columns)</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newSubField: SubField = {
                          id: `sub_${Date.now()}`,
                          label: '',
                          name: '',
                          type: 'text',
                        };
                        setSubFieldsConfig([...subFieldsConfig, newSubField]);
                        setSubFieldOptionsInput((prev) => ({
                          ...prev,
                          [newSubField.id as string]: '',
                        }));
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Sub-Field
                    </Button>
                  </div>
                  {subFieldsConfig.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4 border rounded">
                      No sub-fields added yet. Click "Add Sub-Field" to create a combination field.
                    </p>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[200px]">Label *</TableHead>
                              <TableHead className="w-[150px]">Type *</TableHead>
                              <TableHead className="w-[200px]">Placeholder</TableHead>
                              <TableHead className="w-[200px]">Options (if dropdown)</TableHead>
                              <TableHead className="w-[100px] text-center">Required</TableHead>
                              <TableHead className="w-[100px] text-center">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {subFieldsConfig.map((subField, idx) => (
                              <TableRow key={subField.id}>
                                <TableCell>
                                  <Input
                                    value={subField.label}
                                    onChange={(e) => {
                                      const updated = [...subFieldsConfig];
                                      updated[idx] = {
                                        ...updated[idx],
                                        label: e.target.value,
                                        name: generateFieldName(e.target.value),
                                      };
                                      setSubFieldsConfig(updated);
                                    }}
                                    placeholder="e.g., Year"
                                    className="h-8"
                                  />
                                  {subField.name && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      <code className="bg-muted px-1 rounded">{subField.name}</code>
                                    </p>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Select
                                    value={subField.type}
                                    onValueChange={(value) => {
                                      const updated = [...subFieldsConfig];
                                      updated[idx] = {
                                        ...updated[idx],
                                        type: value as SubField['type'],
                                      };
                                      setSubFieldsConfig(updated);
                                      const key = subField.id || updated[idx].name;
                                      if (value === 'dropdown') {
                                        const existing =
                                          updated[idx].options?.map((o) =>
                                            typeof o === 'string' ? o : o.label,
                                          ) ?? [];
                                        setSubFieldOptionsInput((prev) => ({
                                          ...prev,
                                          [key as string]: formatCSVLabels(existing),
                                        }));
                                      } else {
                                        setSubFieldOptionsInput((prev) => {
                                          const next = { ...prev };
                                          delete next[key as string];
                                          return next;
                                        });
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="text">Text</SelectItem>
                                      <SelectItem value="number">Number</SelectItem>
                                      <SelectItem value="date">Date</SelectItem>
                                      <SelectItem value="time">Time</SelectItem>
                                      <SelectItem value="dropdown">Dropdown</SelectItem>
                                      <SelectItem value="location">Location</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={subField.placeholder || ''}
                                    onChange={(e) => {
                                      const updated = [...subFieldsConfig];
                                      updated[idx] = {
                                        ...updated[idx],
                                        placeholder: e.target.value,
                                      };
                                      setSubFieldsConfig(updated);
                                    }}
                                    placeholder="Enter placeholder"
                                    className="h-8"
                                  />
                                </TableCell>
                                <TableCell>
                                  {subField.type === 'dropdown' ? (
                                    <Input
                                      value={
                                        subFieldOptionsInput[subField.id || subField.name] ??
                                        formatCSVLabels(
                                          subField.options?.map((o) =>
                                            typeof o === 'string' ? o : o.label,
                                          ) ?? [],
                                        )
                                      }
                                      onChange={(e) => {
                                        const key = subField.id || subField.name;
                                        setSubFieldOptionsInput((prev) => ({
                                          ...prev,
                                          [key as string]: e.target.value,
                                        }));
                                      }}
                                      onBlur={() => {
                                        const key = subField.id || subField.name;
                                        const raw = subFieldOptionsInput[key as string] ?? '';
                                        const parsedOptions = parseCSVLabels(raw);
                                        const updated = [...subFieldsConfig];
                                        updated[idx] = {
                                          ...updated[idx],
                                          options:
                                            parsedOptions.length > 0 ? parsedOptions : undefined,
                                        };
                                        setSubFieldsConfig(updated);
                                        setSubFieldOptionsInput((prev) => ({
                                          ...prev,
                                          [key as string]: formatCSVLabels(parsedOptions),
                                        }));
                                      }}
                                      placeholder="Option 1, Option 2"
                                      className="h-8"
                                    />
                                  ) : (
                                    <span className="text-xs text-muted-foreground">N/A</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Switch
                                    checked={subField.required || false}
                                    onCheckedChange={(checked) => {
                                      const updated = [...subFieldsConfig];
                                      updated[idx] = {
                                        ...updated[idx],
                                        required: checked,
                                      };
                                      setSubFieldsConfig(updated);
                                    }}
                                  />
                                </TableCell>
                                <TableCell className="text-center">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive"
                                    onClick={() => {
                                      setSubFieldsConfig(
                                        subFieldsConfig.filter((_, i) => i !== idx),
                                      );
                                      setSubFieldOptionsInput((prev) => {
                                        const next = { ...prev };
                                        delete next[subField.id || subField.name];
                                        return next;
                                      });
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Sub-fields will be combined into an array of objects when submitted. Example: [
                    {"{year: 2025, claimsValue: 3200000, description: '...'}"}]
                  </p>
                </div>
              </div>
            )}

            {(fieldConfig.type === 'dropdown' ||
              fieldConfig.type === 'multiselect' ||
              fieldConfig.type === 'chooseButton') && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Dependent Dropdown</Label>
                  <Select
                    value={fieldConfig.dependentOn || undefined}
                    onValueChange={(value) => {
                      if (value) {
                        // Find the parent field and mark it as required
                        const parentField = pages
                          .flatMap((page) => page.sections.flatMap((section) => section.fields))
                          .find((field) => field.name === value);

                        if (parentField) {
                          // Update the parent field to be required
                          setPages(
                            pages.map((page) => ({
                              ...page,
                              sections: page.sections.map((section) => ({
                                ...section,
                                fields: section.fields.map((field) =>
                                  field.id === parentField.id
                                    ? { ...field, required: true }
                                    : field,
                                ),
                              })),
                            })),
                          );
                        }

                        setFieldConfig({
                          ...fieldConfig,
                          dependentOn: value,
                          // Clear static options if setting up dependency
                          options: undefined,
                        });

                        toast({
                          title: 'Parent Field Marked Required',
                          description: `The parent field "${
                            parentField?.label || value
                          }" has been automatically marked as required.`,
                        });
                      } else {
                        setFieldConfig({
                          ...fieldConfig,
                          dependentOn: undefined,
                          dependentOptions: undefined,
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent field (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {pages.flatMap((page) =>
                        page.sections.flatMap((section) =>
                          section.fields
                            .filter(
                              (field) =>
                                // Only show dropdown/select fields that aren't the current field
                                (field.type === 'dropdown' ||
                                  field.type === 'multiselect' ||
                                  field.type === 'text') &&
                                field.name !== fieldConfig.name &&
                                field.id !== selectedFieldId,
                            )
                            .map((field) => (
                              <SelectItem key={field.id} value={field.name}>
                                {field.label} ({field.name})
                              </SelectItem>
                            )),
                        ),
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Select a parent field to create a dependent dropdown (e.g., Region depends on
                    Country)
                  </p>
                </div>

                {fieldConfig.dependentOn ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Dependent Options Source</Label>
                      <Select
                        value={fieldConfig.dependentOptionsUrl !== undefined ? 'url' : 'input'}
                        onValueChange={(value) => {
                          if (value === 'url') {
                            setFieldConfig({
                              ...fieldConfig,
                              dependentOptions: undefined,
                              dependentOptionsUrl: '',
                            });
                          } else {
                            setFieldConfig({
                              ...fieldConfig,
                              dependentOptionsUrl: undefined,
                              dependentOptions: {},
                            });
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="input">Manual Input</SelectItem>
                          <SelectItem value="url">Fetch from URL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {fieldConfig.dependentOptionsUrl !== undefined ? (
                      <div className="space-y-2">
                        <Label>Dependent Options URL</Label>
                        <Input
                          type="url"
                          value={fieldConfig.dependentOptionsUrl || ''}
                          onChange={(e) =>
                            setFieldConfig({
                              ...fieldConfig,
                              dependentOptionsUrl: e.target.value,
                            })
                          }
                          placeholder="https://api.example.com/regions?country={parentValue}"
                        />
                        <p className="text-xs text-muted-foreground">
                          URL endpoint that returns dependent options. Use {'{parentValue}'} as
                          placeholder for parent field value. Expected format:{' '}
                          {`{ "USA": ["Option 1", "Option 2"], "Canada": ["Option 3"] }`}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label>Dependent Options Mapping</Label>
                        <p className="text-xs text-muted-foreground mb-2">
                          Format: Parent Value = Child Option 1, Child Option 2, Child Option 3
                        </p>
                        <Textarea
                          value={
                            dependentOptionsInput ||
                            (fieldConfig.dependentOptions
                              ? Object.entries(fieldConfig.dependentOptions)
                                  .map(
                                    ([parent, children]: [string, string[]]) =>
                                      `${parent} = ${children.join(', ')}`,
                                  )
                                  .join('\n')
                              : '')
                          }
                          onChange={(e) => {
                            const value = e.target.value;
                            setDependentOptionsInput(value);
                            // Parse options but keep the raw input for display
                            const lines = value.split('\n').filter((l) => l.trim());
                            const mapping: Record<string, string[]> = {};
                            lines.forEach((line) => {
                              const [parent, childrenStr] = line.split('=').map((s) => s.trim());
                              if (parent && childrenStr) {
                                // Keep all values including numbers as strings
                                mapping[parent] = childrenStr
                                  .split(',')
                                  .map((c) => c.trim())
                                  .filter((c) => c !== '');
                              }
                            });
                            setFieldConfig({
                              ...fieldConfig,
                              dependentOptions:
                                Object.keys(mapping).length > 0 ? mapping : undefined,
                            });
                          }}
                          placeholder="USA = North, South, East, West&#10;Canada = Ontario, Quebec, British Columbia&#10;UK = England, Scotland, Wales&#10;123 = Option 1, Option 2, 456"
                          rows={6}
                        />
                        <p className="text-xs text-muted-foreground">
                          Enter one mapping per line. Example: "USA = North, South, East, West"
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {fieldConfig.type === 'chooseButton' && (
                      <div className="space-y-2">
                        <Label>Button Options (comma-separated) *</Label>
                        <Input
                          value={
                            optionsInput ||
                            fieldConfig.options
                              ?.map((option) =>
                                typeof option === 'string' ? option : option.label,
                              )
                              .join(', ') ||
                            ''
                          }
                          onChange={(e) => {
                            const value = e.target.value;
                            setOptionsInput(value);
                            const parsedOptions = value
                              .split(',')
                              .map((o) => o.trim())
                              .filter((o) => o);
                            setFieldConfig({
                              ...fieldConfig,
                              options: parsedOptions.length > 0 ? parsedOptions : undefined,
                            });
                          }}
                          placeholder="Option 1, Option 2, Option 3"
                        />
                        <p className="text-xs text-muted-foreground">
                          Enter options separated by commas. Each will appear as a button.
                        </p>
                      </div>
                    )}
                    {fieldConfig.type !== 'chooseButton' && (
                      <>
                        <div className="space-y-2">
                          <Label>Options Source</Label>
                          <Select
                            value={fieldConfig.optionsUrl !== undefined ? 'url' : 'static'}
                            onValueChange={(value) => {
                              if (value === 'url') {
                                setFieldConfig({
                                  ...fieldConfig,
                                  options: undefined,
                                  optionsUrl: '',
                                });
                              } else {
                                setFieldConfig({
                                  ...fieldConfig,
                                  optionsUrl: undefined,
                                  options: [],
                                });
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="static">Comma-separated Input</SelectItem>
                              <SelectItem value="url">Fetch from URL</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {fieldConfig.optionsUrl !== undefined ? (
                          <div className="space-y-2">
                            <Label>Options URL</Label>
                            <Input
                              type="url"
                              value={fieldConfig.optionsUrl || ''}
                              onChange={(e) =>
                                setFieldConfig({
                                  ...fieldConfig,
                                  optionsUrl: e.target.value,
                                })
                              }
                              placeholder="https://api.example.com/countries"
                            />
                            <p className="text-xs text-muted-foreground">
                              URL endpoint that returns JSON array of options. Expected format:
                              ["Option 1", "Option 2", ...]
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Label>Options (comma-separated)</Label>
                            <Input
                              value={optionsInput || fieldConfig.options?.join(', ') || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                setOptionsInput(value);
                                // Parse options but keep the raw input for display
                                const parsedOptions = value
                                  .split(',')
                                  .map((o) => o.trim())
                                  .filter((o) => o);
                                setFieldConfig({
                                  ...fieldConfig,
                                  options: parsedOptions.length > 0 ? parsedOptions : undefined,
                                });
                              }}
                              placeholder="Option 1, Option 2, Option 3"
                            />
                            <p className="text-xs text-muted-foreground">
                              Enter options separated by commas
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Conditional Logic</Label>
              <div className="grid grid-cols-3 gap-2">
                <Select
                  value={legacyConditionalLogic?.field || undefined}
                  onValueChange={(value) =>
                    setFieldConfig({
                      ...fieldConfig,
                      conditionalLogic: {
                        ...(legacyConditionalLogic || {}),
                        field: value,
                        condition: legacyConditionalLogic?.condition || 'equals',
                        value: legacyConditionalLogic?.value || '',
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    {pages.flatMap((page) =>
                      (page.sections || []).flatMap((section) =>
                        (section.fields || [])
                          .filter(
                            (field) =>
                              // Exclude current field being configured (by name) or by id if editing
                              field.name !== fieldConfig.name && field.id !== selectedFieldId,
                          )
                          .map((field) => (
                            <SelectItem key={field.id} value={field.name}>
                              {field.label} ({field.name})
                            </SelectItem>
                          )),
                      ),
                    )}
                    {pages.flatMap((page) =>
                      (page.sections || []).flatMap((section) => section.fields || []),
                    ).length === 0 && (
                      <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                        No fields available. Add fields first.
                      </div>
                    )}
                  </SelectContent>
                </Select>
                <Select
                  value={legacyConditionalLogic?.condition || 'equals'}
                  onValueChange={(value) =>
                    setFieldConfig({
                      ...fieldConfig,
                      conditionalLogic: {
                        ...(legacyConditionalLogic || {}),
                        condition: value,
                        field: legacyConditionalLogic?.field || '',
                        value: legacyConditionalLogic?.value || '',
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">Equals</SelectItem>
                    <SelectItem value="not_equals">Not Equals</SelectItem>
                    <SelectItem value="contains">Contains</SelectItem>
                    <SelectItem value="greater_than">Greater Than</SelectItem>
                    <SelectItem value="less_than">Less Than</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Value"
                  value={legacyConditionalLogic?.value || ''}
                  onChange={(e) =>
                    setFieldConfig({
                      ...fieldConfig,
                      conditionalLogic: {
                        value: e.target.value,
                        field: legacyConditionalLogic?.field || '',
                        condition: legacyConditionalLogic?.condition || 'equals',
                      },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Example: If "Industry" equals "Construction", show this field
                </p>
                {legacyConditionalLogic?.field && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => {
                      setFieldConfig({
                        ...fieldConfig,
                        conditionalLogic: undefined,
                      });
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>
          {/* Right Column: Preview */}
          <div className="space-y-4 border-l pl-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="sticky top-0 bg-background pb-4 border-b">
              <h3 className="text-sm font-semibold mb-2">Field Preview</h3>
              <p className="text-xs text-muted-foreground">
                Preview how this field will appear in the form
              </p>
            </div>
            <div className="space-y-4 pt-4">
              {fieldConfig.label ? (
                renderFieldPreview({
                  id: 'preview',
                  type: fieldConfig.type as FieldType,
                  label: fieldConfig.label,
                  name: fieldConfig.name || '',
                  placeholder: fieldConfig.placeholder,
                  required: fieldConfig.required,
                  defaultValue: fieldConfig.defaultValue,
                  options: fieldConfig.options,
                  dependentOn: fieldConfig.dependentOn,
                  dependentOptions: fieldConfig.dependentOptions,
                  optionsUrl: fieldConfig.optionsUrl,
                  masterDataTable: fieldConfig.masterDataTable,
                  subFields: fieldConfig.subFields,
                  combinationRows: fieldConfig.combinationRows,
                  combinationRowLabels: fieldConfig.combinationRowLabels,
                  fromDateLabel: fieldConfig.fromDateLabel,
                  toDateLabel: fieldConfig.toDateLabel,
                  periodCalculationUnit: fieldConfig.periodCalculationUnit,
                  autoCalculatePeriod: fieldConfig.autoCalculatePeriod,
                } as Field)
              ) : (
                <div className="p-8 text-center text-muted-foreground border rounded-lg">
                  <p className="text-sm">Enter a field label to see preview</p>
                </div>
              )}
            </div>

            {/* Validations Section */}
            <div className="space-y-4 pt-6 border-t mt-6 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">Validations</h3>
                <Badge variant="outline" className="text-xs">
                  Rules
                </Badge>
              </div>
              {fieldConfig.type === 'text' && (
                <div className="space-y-3 p-4 border rounded-lg bg-background">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Max Characters</Label>
                      <Input
                        type="number"
                        min="1"
                        placeholder="e.g., 100"
                        value={
                          fieldConfig.validations?.find((v) => v.type === 'maxLength')?.value !=
                          null
                            ? String(
                                fieldConfig.validations.find((v) => v.type === 'maxLength')!.value,
                              )
                            : ''
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          const validations = fieldConfig.validations || [];
                          const existing = validations.findIndex((v) => v.type === 'maxLength');
                          if (val && val !== '' && !isNaN(Number(val))) {
                            if (existing >= 0) {
                              validations[existing] = {
                                type: 'maxLength',
                                value: parseInt(val, 10),
                              };
                            } else {
                              validations.push({
                                type: 'maxLength',
                                value: parseInt(val, 10),
                              });
                            }
                          } else if (existing >= 0) {
                            validations.splice(existing, 1);
                          }
                          setFieldConfig({ ...fieldConfig, validations });
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Min Characters</Label>
                      <Input
                        type="number"
                        min="1"
                        placeholder="e.g., 3"
                        value={
                          fieldConfig.validations?.find((v) => v.type === 'minLength')?.value !=
                          null
                            ? String(
                                fieldConfig.validations.find((v) => v.type === 'minLength')!.value,
                              )
                            : ''
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          const validations = fieldConfig.validations || [];
                          const existing = validations.findIndex((v) => v.type === 'minLength');
                          if (val && val !== '' && !isNaN(Number(val))) {
                            if (existing >= 0) {
                              validations[existing] = {
                                type: 'minLength',
                                value: parseInt(val, 10),
                              };
                            } else {
                              validations.push({
                                type: 'minLength',
                                value: parseInt(val, 10),
                              });
                            }
                          } else if (existing >= 0) {
                            validations.splice(existing, 1);
                          }
                          setFieldConfig({ ...fieldConfig, validations });
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Format</Label>
                    <Select
                      value={
                        fieldConfig.validations?.find((v) =>
                          ['email', 'url', 'phone'].includes(v.type),
                        )?.type || undefined
                      }
                      onValueChange={(value) => {
                        const validations = fieldConfig.validations || [];
                        const existing = validations.findIndex((v) =>
                          ['email', 'url', 'phone'].includes(v.type),
                        );
                        if (existing >= 0) {
                          validations.splice(existing, 1);
                        }
                        if (value) {
                          validations.push({ type: value });
                        }
                        setFieldConfig({ ...fieldConfig, validations });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select format (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="url">URL</SelectItem>
                        <SelectItem value="phone">Phone Number</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldConfig.validations?.find((v) =>
                      ['email', 'url', 'phone'].includes(v.type),
                    ) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => {
                          const validations = fieldConfig.validations || [];
                          const existing = validations.findIndex((v) =>
                            ['email', 'url', 'phone'].includes(v.type),
                          );
                          if (existing >= 0) {
                            validations.splice(existing, 1);
                            setFieldConfig({ ...fieldConfig, validations });
                          }
                        }}
                      >
                        Clear format
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Pattern (Regex)</Label>
                    <Input
                      placeholder="e.g., ^[A-Z0-9]+$"
                      value={
                        fieldConfig.validations?.find((v) => v.type === 'pattern')?.value || ''
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        const validations = fieldConfig.validations || [];
                        const existing = validations.findIndex((v) => v.type === 'pattern');
                        if (val) {
                          if (existing >= 0) {
                            validations[existing] = {
                              type: 'pattern',
                              value: val,
                            };
                          } else {
                            validations.push({ type: 'pattern', value: val });
                          }
                        } else if (existing >= 0) {
                          validations.splice(existing, 1);
                        }
                        setFieldConfig({ ...fieldConfig, validations });
                      }}
                    />
                  </div>
                </div>
              )}

              {fieldConfig.type === 'number' && (
                <div className="space-y-3 p-4 border rounded-lg bg-background">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Min Value</Label>
                      <Input
                        type="number"
                        step="any"
                        placeholder="e.g., 0"
                        value={
                          fieldConfig.validations?.find((v) => v.type === 'min')?.value != null
                            ? String(fieldConfig.validations.find((v) => v.type === 'min')!.value)
                            : ''
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          const validations = fieldConfig.validations || [];
                          const existing = validations.findIndex((v) => v.type === 'min');
                          if (val === '' || val === '-') {
                            if (existing >= 0) {
                              validations.splice(existing, 1);
                            }
                            setFieldConfig({ ...fieldConfig, validations });
                            return;
                          }
                          const numVal = Number(val);
                          if (!isNaN(numVal) && val !== '') {
                            if (existing >= 0) {
                              validations[existing] = {
                                type: 'min',
                                value: numVal,
                              };
                            } else {
                              validations.push({
                                type: 'min',
                                value: numVal,
                              });
                            }
                            setFieldConfig({ ...fieldConfig, validations });
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Max Value</Label>
                      <Input
                        type="number"
                        step="any"
                        placeholder="e.g., 100"
                        value={
                          fieldConfig.validations?.find((v) => v.type === 'max')?.value != null
                            ? String(fieldConfig.validations.find((v) => v.type === 'max')!.value)
                            : ''
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          const validations = fieldConfig.validations || [];
                          const existing = validations.findIndex((v) => v.type === 'max');
                          if (val && val !== '' && !isNaN(Number(val))) {
                            if (existing >= 0) {
                              validations[existing] = {
                                type: 'max',
                                value: parseFloat(val),
                              };
                            } else {
                              validations.push({
                                type: 'max',
                                value: parseFloat(val),
                              });
                            }
                          } else if (existing >= 0) {
                            validations.splice(existing, 1);
                          }
                          setFieldConfig({ ...fieldConfig, validations });
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Integer Only</Label>
                      <p className="text-xs text-muted-foreground">No decimal values</p>
                    </div>
                    <Switch
                      checked={fieldConfig.validations?.some((v) => v.type === 'integer') || false}
                      onCheckedChange={(checked) => {
                        const validations = fieldConfig.validations || [];
                        const existing = validations.findIndex((v) => v.type === 'integer');
                        if (checked && existing < 0) {
                          validations.push({ type: 'integer' });
                        } else if (!checked && existing >= 0) {
                          validations.splice(existing, 1);
                        }
                        setFieldConfig({ ...fieldConfig, validations });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Decimal Places</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 2"
                      min="0"
                      max="10"
                      value={
                        fieldConfig.validations?.find((v) => v.type === 'decimalPlaces')?.value !=
                        null
                          ? String(
                              fieldConfig.validations.find((v) => v.type === 'decimalPlaces')!
                                .value,
                            )
                          : ''
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        const validations = fieldConfig.validations || [];
                        const existing = validations.findIndex((v) => v.type === 'decimalPlaces');
                        if (val && val !== '' && !isNaN(Number(val))) {
                          if (existing >= 0) {
                            validations[existing] = {
                              type: 'decimalPlaces',
                              value: parseInt(val, 10),
                            };
                          } else {
                            validations.push({
                              type: 'decimalPlaces',
                              value: parseInt(val, 10),
                            });
                          }
                        } else if (existing >= 0) {
                          validations.splice(existing, 1);
                        }
                        setFieldConfig({ ...fieldConfig, validations });
                      }}
                    />
                  </div>
                </div>
              )}

              {fieldConfig.type === 'date' && (
                <div className="space-y-3 p-4 border rounded-lg bg-background">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Must be today or later</Label>
                      <p className="text-xs text-muted-foreground">Date cannot be in the past</p>
                    </div>
                    <Switch
                      checked={
                        fieldConfig.validations?.some((v) => v.type === 'minDateToday') || false
                      }
                      onCheckedChange={(checked) => {
                        const validations = fieldConfig.validations || [];
                        const existing = validations.findIndex((v) => v.type === 'minDateToday');
                        if (checked && existing < 0) {
                          validations.push({ type: 'minDateToday' });
                        } else if (!checked && existing >= 0) {
                          validations.splice(existing, 1);
                        }
                        setFieldConfig({ ...fieldConfig, validations });
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Must be today or earlier</Label>
                      <p className="text-xs text-muted-foreground">Date cannot be in the future</p>
                    </div>
                    <Switch
                      checked={
                        fieldConfig.validations?.some((v) => v.type === 'maxDateToday') || false
                      }
                      onCheckedChange={(checked) => {
                        const validations = fieldConfig.validations || [];
                        const existing = validations.findIndex((v) => v.type === 'maxDateToday');
                        if (checked && existing < 0) {
                          validations.push({ type: 'maxDateToday' });
                        } else if (!checked && existing >= 0) {
                          validations.splice(existing, 1);
                        }
                        setFieldConfig({ ...fieldConfig, validations });
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Min Days from Today</Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="e.g., 30"
                        value={
                          fieldConfig.validations?.find((v) => v.type === 'minDaysFromToday')
                            ?.value != null
                            ? String(
                                fieldConfig.validations.find((v) => v.type === 'minDaysFromToday')!
                                  .value,
                              )
                            : ''
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          const validations = fieldConfig.validations || [];
                          const existing = validations.findIndex(
                            (v) => v.type === 'minDaysFromToday',
                          );
                          if (val && val !== '' && !isNaN(Number(val))) {
                            if (existing >= 0) {
                              validations[existing] = {
                                type: 'minDaysFromToday',
                                value: parseInt(val, 10),
                              };
                            } else {
                              validations.push({
                                type: 'minDaysFromToday',
                                value: parseInt(val, 10),
                              });
                            }
                          } else if (existing >= 0) {
                            validations.splice(existing, 1);
                          }
                          setFieldConfig({ ...fieldConfig, validations });
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Max Days from Today</Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="e.g., 365"
                        value={
                          fieldConfig.validations?.find((v) => v.type === 'maxDaysFromToday')
                            ?.value != null
                            ? String(
                                fieldConfig.validations.find((v) => v.type === 'maxDaysFromToday')!
                                  .value,
                              )
                            : ''
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          const validations = fieldConfig.validations || [];
                          const existing = validations.findIndex(
                            (v) => v.type === 'maxDaysFromToday',
                          );
                          if (val && val !== '' && !isNaN(Number(val))) {
                            if (existing >= 0) {
                              validations[existing] = {
                                type: 'maxDaysFromToday',
                                value: parseInt(val, 10),
                              };
                            } else {
                              validations.push({
                                type: 'maxDaysFromToday',
                                value: parseInt(val, 10),
                              });
                            }
                          } else if (existing >= 0) {
                            validations.splice(existing, 1);
                          }
                          setFieldConfig({ ...fieldConfig, validations });
                        }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Min Date</Label>
                      <Input
                        type="date"
                        value={
                          fieldConfig.validations?.find((v) => v.type === 'minDate')?.value || ''
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          const validations = fieldConfig.validations || [];
                          const existing = validations.findIndex((v) => v.type === 'minDate');
                          if (val) {
                            if (existing >= 0) {
                              validations[existing] = {
                                type: 'minDate',
                                value: val,
                              };
                            } else {
                              validations.push({
                                type: 'minDate',
                                value: val,
                              });
                            }
                          } else if (existing >= 0) {
                            validations.splice(existing, 1);
                          }
                          setFieldConfig({ ...fieldConfig, validations });
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Max Date</Label>
                      <Input
                        type="date"
                        value={
                          fieldConfig.validations?.find((v) => v.type === 'maxDate')?.value || ''
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          const validations = fieldConfig.validations || [];
                          const existing = validations.findIndex((v) => v.type === 'maxDate');
                          if (val) {
                            if (existing >= 0) {
                              validations[existing] = {
                                type: 'maxDate',
                                value: val,
                              };
                            } else {
                              validations.push({
                                type: 'maxDate',
                                value: val,
                              });
                            }
                          } else if (existing >= 0) {
                            validations.splice(existing, 1);
                          }
                          setFieldConfig({ ...fieldConfig, validations });
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {fieldConfig.type === 'file' && (
                <div className="space-y-3 p-4 border rounded-lg bg-background">
                  <div className="space-y-2">
                    <Label className="text-sm">Max File Size (MB)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="e.g., 10"
                      value={
                        fieldConfig.validations?.find((v) => v.type === 'maxFileSize')?.value !=
                        null
                          ? String(
                              fieldConfig.validations.find((v) => v.type === 'maxFileSize')!.value,
                            )
                          : ''
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        const validations = fieldConfig.validations || [];
                        const existing = validations.findIndex((v) => v.type === 'maxFileSize');
                        if (val && val !== '' && !isNaN(Number(val))) {
                          if (existing >= 0) {
                            validations[existing] = {
                              type: 'maxFileSize',
                              value: parseFloat(val),
                            };
                          } else {
                            validations.push({
                              type: 'maxFileSize',
                              value: parseFloat(val),
                            });
                          }
                        } else if (existing >= 0) {
                          validations.splice(existing, 1);
                        }
                        setFieldConfig({ ...fieldConfig, validations });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Allowed File Types</Label>
                    <Input
                      placeholder="e.g., pdf,doc,docx"
                      value={
                        fieldConfig.validations?.find((v) => v.type === 'allowedTypes')?.value || ''
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        const validations = fieldConfig.validations || [];
                        const existing = validations.findIndex((v) => v.type === 'allowedTypes');
                        if (val) {
                          if (existing >= 0) {
                            validations[existing] = {
                              type: 'allowedTypes',
                              value: val,
                            };
                          } else {
                            validations.push({
                              type: 'allowedTypes',
                              value: val,
                            });
                          }
                        } else if (existing >= 0) {
                          validations.splice(existing, 1);
                        }
                        setFieldConfig({ ...fieldConfig, validations });
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Comma-separated file extensions (e.g., pdf,doc,docx)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Max Number of Files</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 5"
                      min="1"
                      value={
                        fieldConfig.validations?.find((v) => v.type === 'maxFiles')?.value != null
                          ? String(
                              fieldConfig.validations.find((v) => v.type === 'maxFiles')!.value,
                            )
                          : ''
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        const validations = fieldConfig.validations || [];
                        const existing = validations.findIndex((v) => v.type === 'maxFiles');
                        if (val && val !== '' && !isNaN(Number(val))) {
                          if (existing >= 0) {
                            validations[existing] = {
                              type: 'maxFiles',
                              value: parseInt(val, 10),
                            };
                          } else {
                            validations.push({
                              type: 'maxFiles',
                              value: parseInt(val, 10),
                            });
                          }
                        } else if (existing >= 0) {
                          validations.splice(existing, 1);
                        }
                        setFieldConfig({ ...fieldConfig, validations });
                      }}
                    />
                  </div>
                </div>
              )}

              {fieldConfig.type === 'multiselect' && (
                <div className="space-y-3 p-4 border rounded-lg bg-background">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Min Selections</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 1"
                        min="0"
                        value={
                          fieldConfig.validations?.find((v) => v.type === 'minSelections')?.value !=
                          null
                            ? String(
                                fieldConfig.validations.find((v) => v.type === 'minSelections')!
                                  .value,
                              )
                            : ''
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          const validations = fieldConfig.validations || [];
                          const existing = validations.findIndex((v) => v.type === 'minSelections');
                          if (val && val !== '' && !isNaN(Number(val))) {
                            if (existing >= 0) {
                              validations[existing] = {
                                type: 'minSelections',
                                value: parseInt(val, 10),
                              };
                            } else {
                              validations.push({
                                type: 'minSelections',
                                value: parseInt(val, 10),
                              });
                            }
                          } else if (existing >= 0) {
                            validations.splice(existing, 1);
                          }
                          setFieldConfig({ ...fieldConfig, validations });
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Max Selections</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 5"
                        min="1"
                        value={
                          fieldConfig.validations?.find((v) => v.type === 'maxSelections')?.value !=
                          null
                            ? String(
                                fieldConfig.validations.find((v) => v.type === 'maxSelections')!
                                  .value,
                              )
                            : ''
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          const validations = fieldConfig.validations || [];
                          const existing = validations.findIndex((v) => v.type === 'maxSelections');
                          if (val && val !== '' && !isNaN(Number(val))) {
                            if (existing >= 0) {
                              validations[existing] = {
                                type: 'maxSelections',
                                value: parseInt(val, 10),
                              };
                            } else {
                              validations.push({
                                type: 'maxSelections',
                                value: parseInt(val, 10),
                              });
                            }
                          } else if (existing >= 0) {
                            validations.splice(existing, 1);
                          }
                          setFieldConfig({ ...fieldConfig, validations });
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {(fieldConfig.type === 'dropdown' || fieldConfig.type === 'checkbox') && (
                <div className="p-4 border rounded-lg bg-background">
                  <p className="text-sm text-muted-foreground">
                    {fieldConfig.type === 'dropdown'
                      ? 'Dropdown fields are validated by ensuring selection from the provided options.'
                      : 'Checkbox validation is handled by the Required field toggle above.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
