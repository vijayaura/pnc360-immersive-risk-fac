import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormattedNumberInput } from '@/components/ui/FormattedNumberInput';
import { cn } from '@/shared/utils/lib-utils';
import type {
  CalculationConfig,
  FieldValidation,
} from '@/features/product-config/proposal-form/api/proposalFormDesign';
import { FieldType, Field, SubField } from '../../proposal-form/types';
import * as LucideIcons from 'lucide-react';
import { generateFieldName, parseCSVLabels, formatCSVLabels } from '../hooks/useFieldEditor';
import { renderFieldPreview } from '../utils/render-utils';
import { getConsentMetadata } from '../utils/consent';
import { getCurrentYearValue, getDateFieldDefaultValue } from '../utils/dateDefaults';
import { ConditionalLogicDialog } from './ConditionalLogicDialog';
import { RichTextContent, RichTextEditor } from './RichTextEditor';

const {
  Plus,
  Trash2,
  Edit,
  FileText,
  Type,
  Phone,
  FolderOpen,
  Calculator,
  CalendarDays,
  X,
  Settings,
  GitBranch,
  GripVertical,
  Info,
  Loader2,
  Eye,
  Unplug,
  Check,
  ChevronsUpDown,
} = LucideIcons;

const FROM_DATE_VALIDATION_TYPES = [
  'from_minDateToday',
  'from_maxDateToday',
  'from_minDaysFromToday',
  'from_maxDaysFromToday',
  'from_minDate',
  'from_maxDate',
];

const TO_DATE_VALIDATION_TYPES = [
  'to_minDateToday',
  'to_maxDateToday',
  'to_minDaysFromToday',
  'to_maxDaysFromToday',
  'to_minDate',
  'to_maxDate',
];

const TO_NON_FIXED_VALIDATION_TYPES = [
  'to_minDateToday',
  'to_maxDateToday',
  'to_minDaysFromToday',
  'to_maxDaysFromToday',
];

function filterValidationTypes(
  validations: FieldValidation[] | undefined,
  excludedTypes: string[],
): FieldValidation[] {
  return (validations || []).filter((validation) => !excludedTypes.includes(validation.type));
}

function getValidationNumberValue(
  validations: FieldValidation[] | undefined,
  type: string,
): number | undefined {
  const value = validations?.find((validation) => validation.type === type)?.value;
  return typeof value === 'number' ? value : undefined;
}

function getValidationStringValue(
  validations: FieldValidation[] | undefined,
  type: string,
): string | undefined {
  const value = validations?.find((validation) => validation.type === type)?.value;
  return typeof value === 'string' ? value : undefined;
}

function SafeSelectItem({
  value,
  children,
}: {
  value: unknown;
  children: React.ReactNode;
}) {
  const normalizedValue =
    typeof value === 'string' ? value.trim() : String(value ?? '').trim();
  if (!normalizedValue) return null;
  return <SelectItem value={normalizedValue}>{children}</SelectItem>;
}

function getResetDefaultValueForType(
  type: FieldType,
  currentValue: unknown,
  showYearOnly = false,
) {
  if (type === 'date') {
    return getDateFieldDefaultValue({
      currentValue,
      showYearOnly,
    });
  }

  return undefined;
}

function resolveMapProviderValue(provider?: unknown, apiUrl?: unknown): 'default' | 'google' {
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
}

function formatDateOffset(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

function getValidationLowerBoundDate(
  validations: FieldValidation[] | undefined,
  prefix: 'from' | 'to',
): string | undefined {
  const candidates: string[] = [];
  if (validations?.some((validation) => validation.type === `${prefix}_minDateToday`)) {
    candidates.push(new Date().toISOString().split('T')[0]);
  }
  const minDays = getValidationNumberValue(validations, `${prefix}_minDaysFromToday`);
  if (typeof minDays === 'number') {
    candidates.push(formatDateOffset(minDays));
  }
  const minDate = getValidationStringValue(validations, `${prefix}_minDate`);
  if (minDate) {
    candidates.push(minDate);
  }
  if (candidates.length === 0) return undefined;
  return candidates.reduce((latest, current) => (current > latest ? current : latest));
}

export interface FieldConfigDialogProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export const FieldConfigDialog = (props: FieldConfigDialogProps) => {
  const {
    pages,
    setPages,
    toast,
    selectedPageId,
    isCalculationDialogOpen,
    setIsCalculationDialogOpen,
    currentCalculationSubFieldIndex,
    setCurrentCalculationSubFieldIndex,
    currentCalculationFieldId,
    currentCalculationSectionId,
    currentCalculationPageId,
    setCurrentCalculationFieldId,
    setCurrentCalculationSectionId,
    setCurrentCalculationPageId,
    tempCalculationConfig,
    setTempCalculationConfig,
    globalMasters,
    isLoadingGlobalMasters,
    isFieldDialogOpen,
    isFieldDialogClosing,
    setIsFieldDialogOpen,
    isConfiguringField,
    fieldConfig,
    setFieldConfig,
    subFieldsConfig,
    setSubFieldsConfig,
    selectedPage,
    selectedSection,
    optionsInput,
    setOptionsInput,
    optionsSourceMode,
    setOptionsSourceMode,
    selectedGlobalMaster,
    setSelectedGlobalMaster,
    selectedMasterValues,
    setSelectedMasterValues,
    dependentOptionsInput,
    setDependentOptionsInput,
    combinationRowLabels,
    setCombinationRowLabels,
    combinationRowsCount,
    setCombinationRowsCount,
    combinationRowLabelsInput,
    setCombinationRowLabelsInput,
    maximizeAdditionOfRows,
    setMaximizeAdditionOfRows,
    maximumRowCountInput,
    setMaximumRowCountInput,
    isSubFieldDialogOpen,
    isSubFieldDialogClosing,
    setIsSubFieldDialogOpen,
    isConfiguringSubField,
    selectedSubFieldId,
    setSelectedSubFieldId,
    subFieldConfig,
    setSubFieldConfig,
    subFieldOptionsInput,
    setSubFieldOptionsInput,
    subFieldDependentOptionsInput,
    setSubFieldDependentOptionsInput,
    startAddingField,
    startEditingField,
    handleCloseFieldDialog,
    canBeRatingParameter,
    validateMinMax,
    validateMinMaxCharacter,
    saveField,
    startAddingSubField,
    startEditingSubField,
    handleCloseSubFieldDialog,
    saveSubField,
    hasMinOrMax,
    hasFormat,
    minMaxError,
    minMaxCharacterError,
    fieldTypes,
    selectedFieldId,
    getNumericFieldsForPage,
    setMinMaxError,
    setMinMaxCharacterError,
    hideRatingParameterControls = false,
    isCustomerTemplateMode = false,
    onOpenFieldApiIntegration,
    fieldIntegrationCount = 0,
  } = props;

  type GlobalMasterLite = {
    id: string;
    masterKey: string;
    displayLabel: string;
    parentMasterId?: string | null;
    values?: Array<{ id: string; valueLabel: string; valueCode?: string }>;
  };

  const getGlobalMasterOptionLabel = (
    master: GlobalMasterLite,
    masters: GlobalMasterLite[],
  ) => {
    const parentMaster = master.parentMasterId
      ? masters.find((item) => item.id === master.parentMasterId)
      : null;
    const parentLabel = parentMaster?.displayLabel;

    return `${master.displayLabel}${parentLabel ? ` (Parent : ${parentLabel})` : ''} (${
      (master.values || []).length
    } values)`;
  };

  const SearchableGlobalMasterSelect = ({
    masters,
    value,
    loading,
    onChange,
  }: {
    masters: GlobalMasterLite[];
    value?: string;
    loading?: boolean;
    onChange: (masterId: string) => void;
  }) => {
    const [open, setOpen] = React.useState(false);
    const selectedMaster = masters.find((master) => master.id === value);
    const selectedMasterLabel = selectedMaster
      ? getGlobalMasterOptionLabel(selectedMaster, masters)
      : null;

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={loading}
            className={cn('w-full justify-between font-normal', !selectedMaster && 'text-muted-foreground')}
          >
            <span className="truncate">
              {loading
                ? 'Loading...'
                : selectedMasterLabel
                  ? selectedMasterLabel
                  : 'Select a global master'}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search global master..." />
            <CommandList>
              <CommandEmpty>No global master found.</CommandEmpty>
              <CommandGroup>
                {masters.map((master) => (
                  <CommandItem
                    key={master.id}
                    value={`${getGlobalMasterOptionLabel(master, masters)} ${master.masterKey}`}
                    onSelect={() => {
                      onChange(master.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === master.id ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <span className="truncate">
                      {getGlobalMasterOptionLabel(master, masters)}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  };

  const getOptionDisplayValue = React.useCallback((option: unknown): string => {
    if (typeof option === 'string') return option;
    if (option && typeof option === 'object') {
      const record = option as Record<string, unknown>;
      if (typeof record.label === 'string' && record.label.trim() !== '') return record.label;
      if (typeof record.value === 'string' && record.value.trim() !== '') return record.value;
    }
    return '';
  }, []);

  const getOptionSelectValue = React.useCallback((option: unknown): string => {
    if (typeof option === 'string') return option;
    if (option && typeof option === 'object') {
      const record = option as Record<string, unknown>;
      if (typeof record.value === 'string' && record.value.trim() !== '') return record.value;
      if (typeof record.label === 'string' && record.label.trim() !== '') return record.label;
    }
    return '';
  }, []);

  const getSelectableOptions = React.useCallback(
    (options: unknown[] | undefined) =>
      (options || [])
        .map((option, idx) => {
          const value = getOptionSelectValue(option).trim();
          const label = getOptionDisplayValue(option).trim();
          if (!value) return null;
          return {
            key: `${idx}-${value}`,
            value,
            label: label || value,
          };
        })
        .filter(
          (option): option is { key: string; value: string; label: string } => option !== null,
        ),
    [getOptionDisplayValue, getOptionSelectValue],
  );

  const getBlankOptionIndexes = React.useCallback(
    (options: unknown[] | undefined) =>
      (options || []).reduce<number[]>((indexes, option, idx) => {
        const value = getOptionSelectValue(option).trim();
        const label = getOptionDisplayValue(option).trim();
        if (!value && !label) indexes.push(idx);
        return indexes;
      }, []),
    [getOptionDisplayValue, getOptionSelectValue],
  );
  const consentMetadata = React.useMemo(
    () => getConsentMetadata(fieldConfig as Field),
    [fieldConfig],
  );
  const fieldBlankOptionIndexes = React.useMemo(
    () => getBlankOptionIndexes(fieldConfig.options),
    [fieldConfig.options, getBlankOptionIndexes],
  );
  const subFieldBlankOptionIndexes = React.useMemo(
    () => getBlankOptionIndexes(subFieldConfig.options),
    [subFieldConfig.options, getBlankOptionIndexes],
  );
  const [optionEditError, setOptionEditError] = React.useState<{
    scope: 'fieldChooseButton' | 'fieldStatic' | 'subField';
    index: number;
    message: string;
  } | null>(null);
  const [fieldChooseButtonOptionIds, setFieldChooseButtonOptionIds] = React.useState<string[]>([]);
  const [fieldStaticOptionIds, setFieldStaticOptionIds] = React.useState<string[]>([]);
  const [subFieldOptionIds, setSubFieldOptionIds] = React.useState<string[]>([]);
  const [activeDragItem, setActiveDragItem] = React.useState<{
    scope:
      | 'fieldChooseButton'
      | 'fieldStatic'
      | 'subFieldOptions'
      | 'subFieldChooseButton'
      | 'subFields';
    index: number;
  } | null>(null);
  const [dragOverItem, setDragOverItem] = React.useState<{
    scope:
      | 'fieldChooseButton'
      | 'fieldStatic'
      | 'subFieldOptions'
      | 'subFieldChooseButton'
      | 'subFields';
    index: number;
  } | null>(null);

  const createStableOptionIds = React.useCallback(
    (count: number, prefix: string) =>
      Array.from({ length: count }, () => `${prefix}-${crypto.randomUUID()}`),
    [],
  );

  const reorderStableIds = React.useCallback(
    (ids: string[], sourceIndex: number, destinationIndex: number) => {
      const nextIds = Array.from(ids);
      const [movedId] = nextIds.splice(sourceIndex, 1);
      if (!movedId) return ids;
      nextIds.splice(destinationIndex, 0, movedId);
      return nextIds;
    },
    [],
  );

  const moveArrayItem = React.useCallback(
    <T,>(items: T[], sourceIndex: number, destinationIndex: number): T[] => {
      if (
        sourceIndex === destinationIndex ||
        sourceIndex < 0 ||
        destinationIndex < 0 ||
        sourceIndex >= items.length ||
        destinationIndex >= items.length
      ) {
        return items;
      }

      const nextItems = Array.from(items);
      const [movedItem] = nextItems.splice(sourceIndex, 1);
      if (movedItem === undefined) return items;
      nextItems.splice(destinationIndex, 0, movedItem);
      return nextItems;
    },
    [],
  );

  const reorderByScope = React.useCallback(
    (
      scope:
        | 'fieldChooseButton'
        | 'fieldStatic'
        | 'subFieldOptions'
        | 'subFieldChooseButton'
        | 'subFields',
      sourceIndex: number,
      destinationIndex: number,
    ) => {
      if (scope === 'fieldChooseButton') {
        const currentOptions = fieldConfig.options || [];
        const nextOptions = moveArrayItem(currentOptions, sourceIndex, destinationIndex);
        setFieldConfig({ ...fieldConfig, options: nextOptions });
        setFieldChooseButtonOptionIds((current) =>
          reorderStableIds(current, sourceIndex, destinationIndex),
        );
        return;
      }

      if (scope === 'fieldStatic') {
        const currentOptions = fieldConfig.options || [];
        const nextOptions = moveArrayItem(currentOptions, sourceIndex, destinationIndex);
        setFieldConfig({ ...fieldConfig, options: nextOptions });
        setFieldStaticOptionIds((current) =>
          reorderStableIds(current, sourceIndex, destinationIndex),
        );
        return;
      }

      if (scope === 'subFieldOptions' || scope === 'subFieldChooseButton') {
        const currentOptions = subFieldConfig.options || [];
        const nextOptions = moveArrayItem(currentOptions, sourceIndex, destinationIndex);
        setSubFieldConfig({ ...subFieldConfig, options: nextOptions });
        setSubFieldOptionIds((current) =>
          reorderStableIds(current, sourceIndex, destinationIndex),
        );
        setSubFieldPreviewKey((prev) => prev + 1);
        return;
      }

      setSubFieldsConfig(moveArrayItem(subFieldsConfig, sourceIndex, destinationIndex));
    },
    [
      fieldConfig,
      moveArrayItem,
      reorderStableIds,
      setFieldConfig,
      setSubFieldConfig,
      setSubFieldsConfig,
      subFieldConfig,
      subFieldsConfig,
    ],
  );

  const startDrag = React.useCallback(
    (
      event: React.DragEvent<HTMLElement>,
      scope:
        | 'fieldChooseButton'
        | 'fieldStatic'
        | 'subFieldOptions'
        | 'subFieldChooseButton'
        | 'subFields',
      index: number,
    ) => {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', `${scope}:${index}`);
      setActiveDragItem({ scope, index });
      setDragOverItem({ scope, index });
    },
    [],
  );

  const handleDragOverItem = React.useCallback(
    (
      event: React.DragEvent<HTMLElement>,
      scope:
        | 'fieldChooseButton'
        | 'fieldStatic'
        | 'subFieldOptions'
        | 'subFieldChooseButton'
        | 'subFields',
      index: number,
    ) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      setDragOverItem((current) =>
        current?.scope === scope && current.index === index ? current : { scope, index },
      );
    },
    [],
  );

  const handleDropItem = React.useCallback(
    (
      event: React.DragEvent<HTMLElement>,
      scope:
        | 'fieldChooseButton'
        | 'fieldStatic'
        | 'subFieldOptions'
        | 'subFieldChooseButton'
        | 'subFields',
      index: number,
    ) => {
      event.preventDefault();

      if (!activeDragItem || activeDragItem.scope !== scope) {
        setActiveDragItem(null);
        setDragOverItem(null);
        return;
      }

      reorderByScope(scope, activeDragItem.index, index);
      setActiveDragItem(null);
      setDragOverItem(null);
    },
    [activeDragItem, reorderByScope],
  );

  const handleDragEnd = React.useCallback(() => {
    setActiveDragItem(null);
    setDragOverItem(null);
  }, []);

  const updateOptionAtIndex = React.useCallback(
    (
      scope: 'fieldChooseButton' | 'fieldStatic' | 'subField',
      options: unknown[] | undefined,
      index: number,
      nextValue: string,
      setter: (nextOptions: unknown[] | undefined) => void,
    ) => {
      if (nextValue.trim() === '') {
        setOptionEditError({
          scope,
          index,
          message: 'At least one character is required for an option name.',
        });
        return;
      }
      setOptionEditError((current) =>
        current?.scope === scope && current.index === index ? null : current,
      );
      const nextOptions = [...(options || [])];
      nextOptions[index] = nextValue;
      setter(nextOptions);
    },
    [],
  );
  const clearOptionEditError = React.useCallback(
    (scope: 'fieldChooseButton' | 'fieldStatic' | 'subField', index: number) => {
      setOptionEditError((current) =>
        current?.scope === scope && current.index === index ? null : current,
      );
    },
    [],
  );
  const hasFieldValidationRules = React.useMemo(
    () =>
      [
        'text',
        'textarea',
        'number',
        'date',
        'datePeriod',
        'policyPeriod',
        'file',
        'multiselect',
        'multiselectDropdown',
      ].includes(fieldConfig.type || ''),
    [fieldConfig.type],
  );
  const matchesAppliedSelection = React.useCallback(
    (savedSelection: unknown, currentSelection: Set<string>) =>
      Array.isArray(savedSelection) &&
      savedSelection.length === currentSelection.size &&
      savedSelection.every((value) => currentSelection.has(String(value))),
    [],
  );

  const [subFieldSelectedGlobalMaster, setSubFieldSelectedGlobalMaster] =
    React.useState<GlobalMasterLite | null>(null);
  const [subFieldSelectedMasterValues, setSubFieldSelectedMasterValues] = React.useState<
    Set<string>
  >(new Set());
  const [subFieldPreviewKey, setSubFieldPreviewKey] = React.useState(0);
  const [isApplyingFieldSelection, startApplyingFieldSelection] = React.useTransition();
  const [isApplyingSubFieldSelection, startApplyingSubFieldSelection] = React.useTransition();
  const [isConditionalLogicDialogOpen, setIsConditionalLogicDialogOpen] = React.useState(false);
  const [conditionalLogicTarget, setConditionalLogicTarget] = React.useState<'field' | 'subfield'>(
    'field',
  );
  const [isConsentDocumentsDialogOpen, setIsConsentDocumentsDialogOpen] = React.useState(false);
  const [isConsentDocumentFormDialogOpen, setIsConsentDocumentFormDialogOpen] =
    React.useState(false);
  const [editingConsentDocumentId, setEditingConsentDocumentId] = React.useState<string | null>(
    null,
  );
  const [consentDocumentDraft, setConsentDocumentDraft] = React.useState({
    label: '',
    description: '',
    required: false,
    active: true,
  });
  const maximizeRowsEnabled =
    typeof maximizeAdditionOfRows === 'boolean'
      ? maximizeAdditionOfRows
      : fieldConfig.metadata?.maximizeAdditionOfRows === true;
  const maximumRowCountValue =
    typeof maximumRowCountInput === 'string'
      ? maximumRowCountInput
      : typeof fieldConfig.metadata?.maximumRowCount === 'number'
        ? String(fieldConfig.metadata.maximumRowCount)
        : '';
  const isCustomerNameEnabled = React.useCallback(
    (value: unknown) => value === true || String(value).toLowerCase() === 'true',
    [],
  );
  const existingCustomerNameFieldIds = React.useMemo(() => {
    const ids = new Set<string>();

    (pages || []).forEach((page: any) => {
      (page.sections || []).forEach((section) => {
        (section.fields || []).forEach((field) => {
          if (field.type === 'text' && isCustomerNameEnabled(field.metadata?.isCustomerName)) {
            ids.add(String(field.id || field.name));
          }

          (field.subFields || []).forEach((subField) => {
            if (
              subField.type === 'text' &&
              isCustomerNameEnabled(subField.metadata?.isCustomerName)
            ) {
              ids.add(String(subField.id || subField.name));
            }
          });
        });
      });
    });

    return ids;
  }, [isCustomerNameEnabled, pages]);
  const currentFieldId = String(selectedFieldId || fieldConfig.id || fieldConfig.name || '');
  const currentSubFieldId = String(
    selectedSubFieldId || subFieldConfig.id || subFieldConfig.name || '',
  );
  const isCurrentFieldCustomerName = isCustomerNameEnabled(fieldConfig.metadata?.isCustomerName);
  const isCurrentSubFieldCustomerName = isCustomerNameEnabled(
    subFieldConfig.metadata?.isCustomerName,
  );
  const localOtherCustomerNameSubFieldExists = React.useMemo(
    () =>
      subFieldsConfig.some((subField) => {
        const subFieldId = String(subField.id || subField.name);
        return (
          subField.type === 'text' &&
          subFieldId !== currentSubFieldId &&
          isCustomerNameEnabled(subField.metadata?.isCustomerName)
        );
      }),
    [currentSubFieldId, isCustomerNameEnabled, subFieldsConfig],
  );
  const shouldShowFieldCustomerNameToggle =
    fieldConfig.type === 'text' &&
    (isCustomerTemplateMode
      ? isCurrentFieldCustomerName ||
        (Array.from(existingCustomerNameFieldIds).every((id) => id === currentFieldId) &&
          !localOtherCustomerNameSubFieldExists)
      : isCurrentFieldCustomerName);
  const shouldShowSubFieldCustomerNameToggle =
    subFieldConfig.type === 'text' &&
    (isCustomerTemplateMode
      ? isCurrentSubFieldCustomerName ||
        (Array.from(existingCustomerNameFieldIds).every((id) => id === currentSubFieldId) &&
          !subFieldsConfig.some((subField) => {
            const subFieldId = String(subField.id || subField.name);
            return (
              subField.type === 'text' &&
              subFieldId !== currentSubFieldId &&
              isCustomerNameEnabled(subField.metadata?.isCustomerName)
            );
          }))
      : isCurrentSubFieldCustomerName);
  const isFieldCustomerNameToggleDisabled = !isCustomerTemplateMode && isCurrentFieldCustomerName;
  const isSubFieldCustomerNameToggleDisabled =
    !isCustomerTemplateMode && isCurrentSubFieldCustomerName;
  const consentDocuments = consentMetadata.consentDocuments || [];
  const handleMaximizeRowsToggle = (checked: boolean) => {
    if (typeof setMaximizeAdditionOfRows === 'function') {
      setMaximizeAdditionOfRows(checked);
    }
    if (typeof setMaximumRowCountInput === 'function') {
      setMaximumRowCountInput('');
    }
    if (typeof setCombinationRowsCount === 'function') {
      setCombinationRowsCount(1);
    }
    if (typeof setCombinationRowLabels === 'function') {
      setCombinationRowLabels([]);
    }
    if (typeof setCombinationRowLabelsInput === 'function') {
      setCombinationRowLabelsInput('');
    }

    setFieldConfig((prev: typeof fieldConfig) => ({
      ...prev,
      metadata: {
        ...(prev.metadata || {}),
        maximizeAdditionOfRows: checked,
        maximumRowCount: undefined,
      },
    }));
  };
  const resetConsentDocumentDraft = React.useCallback(() => {
    setEditingConsentDocumentId(null);
    setConsentDocumentDraft({
      label: '',
      description: '',
      required: false,
      active: true,
    });
  }, []);
  const openConsentDocumentForm = React.useCallback(
    (document?: (typeof consentDocuments)[number]) => {
      if (document) {
        setEditingConsentDocumentId(document.id);
        setConsentDocumentDraft({
          label: document.label,
          description: document.description || '',
          required: document.required,
          active: document.active,
        });
      } else {
        resetConsentDocumentDraft();
      }
      setIsConsentDocumentFormDialogOpen(true);
    },
    [resetConsentDocumentDraft],
  );

  const handleMaximumRowCountChange = (value: string) => {
    if (typeof setMaximumRowCountInput === 'function') {
      setMaximumRowCountInput(value);
    }

    setFieldConfig((prev: typeof fieldConfig) => ({
      ...prev,
      metadata: {
        ...(prev.metadata || {}),
        maximizeAdditionOfRows: true,
        maximumRowCount: value.trim() !== '' ? Number(value) : undefined,
      },
    }));
  };

  // Derived — all combination fields on all pages except the one currently being edited
  const otherCombinationFields = pages
    .flatMap((p) => p.sections?.flatMap((s) => s.fields) ?? [])
    .filter((f) => f.type === 'combination' && f.id !== selectedFieldId);

  React.useEffect(() => {
    const optionCount = Array.isArray(fieldConfig.options) ? fieldConfig.options.length : 0;
    const isChooseButtonField = fieldConfig.type === 'chooseButton';

    if (optionCount === 0 || !isChooseButtonField) {
      if (fieldChooseButtonOptionIds.length > 0) {
        setFieldChooseButtonOptionIds([]);
      }
      return;
    }

    if (fieldChooseButtonOptionIds.length !== optionCount) {
      setFieldChooseButtonOptionIds(createStableOptionIds(optionCount, 'cb-opt'));
    }
  }, [
    createStableOptionIds,
    fieldChooseButtonOptionIds.length,
    fieldConfig.options,
    fieldConfig.type,
  ]);

  React.useEffect(() => {
    const optionCount = Array.isArray(fieldConfig.options) ? fieldConfig.options.length : 0;
    const isStaticOptionsField = fieldConfig.type !== 'chooseButton';

    if (optionCount === 0 || !isStaticOptionsField) {
      if (fieldStaticOptionIds.length > 0) {
        setFieldStaticOptionIds([]);
      }
      return;
    }

    if (fieldStaticOptionIds.length !== optionCount) {
      setFieldStaticOptionIds(createStableOptionIds(optionCount, 'field-opt'));
    }
  }, [
    createStableOptionIds,
    fieldConfig.options,
    fieldConfig.type,
    fieldStaticOptionIds.length,
  ]);

  React.useEffect(() => {
    const optionCount = Array.isArray(subFieldConfig.options) ? subFieldConfig.options.length : 0;

    if (optionCount === 0) {
      if (subFieldOptionIds.length > 0) {
        setSubFieldOptionIds([]);
      }
      return;
    }

    if (subFieldOptionIds.length !== optionCount) {
      setSubFieldOptionIds(createStableOptionIds(optionCount, 'subfield-opt'));
    }
  }, [createStableOptionIds, subFieldConfig.options, subFieldOptionIds.length]);

  React.useEffect(() => {
    if (!isSubFieldDialogOpen) return;
    const gmId =
      subFieldConfig.metadata &&
      typeof (subFieldConfig.metadata as Record<string, unknown>).globalMasterId === 'string'
        ? String((subFieldConfig.metadata as Record<string, unknown>).globalMasterId).trim()
        : '';
    const gmKey =
      typeof subFieldConfig.globalMasterKey === 'string'
        ? subFieldConfig.globalMasterKey.trim()
        : '';
    if (!gmId && !gmKey) {
      setSubFieldSelectedGlobalMaster(null);
      setSubFieldSelectedMasterValues(new Set());
      return;
    }
    const match =
      (gmId ? (globalMasters as GlobalMasterLite[]).find((m) => m.id === gmId) : undefined) ??
      (gmKey
        ? (globalMasters as GlobalMasterLite[]).find((m) => m.masterKey === gmKey)
        : undefined) ??
      null;
    setSubFieldSelectedGlobalMaster(match);

    let initialValues = match?.values ? match.values.map((v) => v.valueLabel) : [];
    if (Array.isArray(subFieldConfig.options) && subFieldConfig.options.length > 0) {
      initialValues = subFieldConfig.options
        .map((option) => getOptionDisplayValue(option))
        .filter((option) => option !== '');
    }
    setSubFieldSelectedMasterValues(new Set(initialValues));
  }, [
    isSubFieldDialogOpen,
    subFieldConfig.id,
    typeof (subFieldConfig.metadata as any)?.globalMasterId,
    (subFieldConfig.metadata as any)?.globalMasterId,
    subFieldConfig.globalMasterKey,
    subFieldConfig.options,
    getOptionDisplayValue,
    globalMasters,
  ]);

  React.useEffect(() => {
    if (!isFieldDialogOpen) return;
    const rawMode =
      fieldConfig.metadata &&
      typeof (fieldConfig.metadata as Record<string, unknown>).optionsSourceMode === 'string'
        ? String((fieldConfig.metadata as Record<string, unknown>).optionsSourceMode).trim()
        : '';

    const gmId =
      fieldConfig.metadata &&
      typeof (fieldConfig.metadata as Record<string, unknown>).globalMasterId === 'string'
        ? String((fieldConfig.metadata as Record<string, unknown>).globalMasterId).trim()
        : '';
    const gmKey =
      typeof (fieldConfig as any).globalMasterKey === 'string'
        ? String((fieldConfig as any).globalMasterKey).trim()
        : '';

    const inferredMode = (() => {
      if (
        rawMode === 'static' ||
        rawMode === 'url' ||
        rawMode === 'globalMaster' ||
        rawMode === 'referenceGlobalMaster' ||
        rawMode === 'coverSelection'
      ) {
        return rawMode;
      }
      if (fieldConfig.optionsUrl !== undefined) return 'url';
      if (gmId || gmKey) {
        const hasLocalOptions =
          Array.isArray(fieldConfig.options) && fieldConfig.options.length > 0;
        return hasLocalOptions ? 'globalMaster' : 'referenceGlobalMaster';
      }
      return 'static';
    })();

    setOptionsSourceMode(inferredMode);

    if (inferredMode !== 'referenceGlobalMaster' && inferredMode !== 'globalMaster') return;
    if (!gmId && !gmKey) return;

    const match =
      (gmId ? (globalMasters as GlobalMasterLite[]).find((m) => m.id === gmId) : undefined) ??
      (gmKey
        ? (globalMasters as GlobalMasterLite[]).find((m) => m.masterKey === gmKey)
        : undefined) ??
      null;

    if (!match) return;

    setSelectedGlobalMaster(match as unknown);

    let initialValues = (match.values || []).map((v) => v.valueLabel);
    // Restore previously saved selection from metadata
    const savedSelection = (fieldConfig.metadata as Record<string, unknown>)?.selectedMasterValues;
    if (Array.isArray(savedSelection) && savedSelection.length > 0) {
      initialValues = savedSelection.map((v) => String(v));
    } else if (Array.isArray(fieldConfig.options) && fieldConfig.options.length > 0) {
      initialValues = fieldConfig.options
        .map((option) => getOptionDisplayValue(option))
        .filter((option) => option !== '');
    }
    setSelectedMasterValues(new Set(initialValues));
  }, [
    isFieldDialogOpen,
    fieldConfig.id,
    typeof (fieldConfig.metadata as any)?.globalMasterId,
    (fieldConfig.metadata as any)?.globalMasterId,
    (fieldConfig as any).globalMasterKey,
    fieldConfig.options,
    globalMasters,
    getOptionDisplayValue,
    setSelectedGlobalMaster,
    setSelectedMasterValues,
    setOptionsSourceMode,
  ]);

  React.useEffect(() => {
    if (!isFieldDialogClosing) return;
    setIsConditionalLogicDialogOpen(false);
    setIsConsentDocumentsDialogOpen(false);
    setIsConsentDocumentFormDialogOpen(false);
    setActiveDragItem(null);
    setDragOverItem(null);
    resetConsentDocumentDraft();
  }, [isFieldDialogClosing, resetConsentDocumentDraft]);

  React.useEffect(() => {
    if (!isSubFieldDialogClosing) return;
    setIsConditionalLogicDialogOpen(false);
    setActiveDragItem(null);
    setDragOverItem(null);
  }, [isSubFieldDialogClosing]);

  return (
    <>
      {/* Field Configuration Dialog */}
      <Dialog open={isFieldDialogOpen} onOpenChange={(open) => !open && handleCloseFieldDialog()}>
        <DialogContent
          showClose={false}
          className={cn(
            'flex w-[calc(100vw-2rem)] max-h-[90vh] flex-col overflow-hidden p-0',
            fieldConfig.type === 'combination' ? 'max-w-7xl' : 'max-w-6xl',
          )}
        >
          <div className="relative h-full w-full overflow-x-hidden overflow-y-auto rounded-lg border border-border bg-background p-6 shadow-lg">
            {isFieldDialogClosing ? (
              <div className="min-h-[240px]" aria-hidden="true" />
            ) : (
              <>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle>{isConfiguringField ? 'Configure Field' : 'Edit Field'}</DialogTitle>
                  <DialogDescription>
                    {isConfiguringField
                      ? 'Configure the field properties and settings 3'
                      : 'Update the field properties and settings'}
                  </DialogDescription>
                  {selectedPage && selectedSection && (
                    <div className="mt-3 inline-flex items-center gap-2 rounded-md bg-primary/10 px-3 py-1.5 text-xs text-primary">
                      <div className="inline-flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-primary" />
                        <span className="font-semibold">
                          {selectedPage.title || 'Untitled Page'}
                        </span>
                      </div>
                      <span className="text-[11px] text-primary/70">/</span>
                      <div className="inline-flex items-center gap-1.5">
                        <FolderOpen className="h-3.5 w-3.5 text-primary" />
                        <span className="font-semibold">
                          {selectedSection.title || 'Untitled Section'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={handleCloseFieldDialog}>
                    Cancel
                  </Button>
                  <Button onClick={saveField}>
                    {isConfiguringField ? 'Add Field' : 'Update Field'}
                  </Button>
                </div>
              </div>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-6 py-4">
              {/* Left Column: Configuration */}
              <div className="space-y-4 px-2">
                {/* Basic Field Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Field Type</Label>
                    <Select
                      value={fieldConfig.type}
                      onValueChange={(value) => {
                        const newType = value as FieldType;
                        const buttonTypes = ['chooseButton'];

                        // Build updated config object
                        const updatedConfig: Partial<Field> = {
                          ...fieldConfig,
                          type: newType,
                          defaultValue: getResetDefaultValueForType(
                            newType,
                            undefined,
                            fieldConfig.showYearOnly,
                          ),
                        };

                        // Clear rating parameter if changing to a non-rating field type
                        if (
                          (newType === 'text' ||
                            newType === 'textarea' ||
                            newType === 'file' ||
                            newType === 'location' ||
                            newType === 'time' ||
                            newType === 'consent' ||
                            buttonTypes.includes(newType)) &&
                          fieldConfig.isRatingParameter
                        ) {
                          updatedConfig.isRatingParameter = false;
                        }

                        if (newType === 'consent') {
                          updatedConfig.required = true;
                          updatedConfig.isRatingParameter = false;
                        }

                        // Clear master data if changing to text, number, date, datePeriod, file, or location types
                        if (
                          (newType === 'text' ||
                            newType === 'textarea' ||
                            newType === 'number' ||
                            newType === 'date' ||
                            newType === 'datePeriod' ||
                            newType === 'policyPeriod' ||
                            newType === 'file' ||
                            newType === 'location') &&
                          fieldConfig.isMasterData
                        ) {
                          updatedConfig.isMasterData = false;
                          updatedConfig.masterDataTable = undefined;
                        }

                        // Initialize defaults for date types
                        if (newType === 'datePeriod' || newType === 'policyPeriod') {
                          updatedConfig.fromDateLabel = updatedConfig.fromDateLabel || 'From Date';
                          updatedConfig.toDateLabel = updatedConfig.toDateLabel || 'To Date';
                          updatedConfig.periodCalculationUnit =
                            updatedConfig.periodCalculationUnit || 'months';
                          updatedConfig.autoCalculatePeriod =
                            updatedConfig.autoCalculatePeriod !== false;
                        } else if (newType === 'date') {
                          updatedConfig.periodCalculationUnit =
                            updatedConfig.periodCalculationUnit || 'months';
                        }

                        // Clear master data if changing to combination type
                        if (newType === 'combination') {
                          const subFields = fieldConfig.subFields?.length
                            ? fieldConfig.subFields
                            : [];
                          setSubFieldsConfig(subFields);
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
                              mapApiKey: '',
                            };
                            updatedConfig.mapApiUrl = 'https://maps.googleapis.com/maps/api/js';
                          }
                        } else {
                          // Clear map configuration if changing away from location type
                          updatedConfig.mapProvider = undefined;
                          const nextMeta = { ...updatedConfig.metadata };
                          delete nextMeta.mapApiUrl;
                          delete nextMeta.mapApiKey;
                          updatedConfig.metadata =
                            Object.keys(nextMeta).length > 0 ? nextMeta : undefined;
                        }

                        setFieldConfig(updatedConfig);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent
                          className="max-h-[320px]"
                          scrollHeight="280px"
                        >
                        {/* Free Input Fields */}
                        <SelectGroup>
                          <SelectLabel>Free Input Fields</SelectLabel>
                          {fieldTypes
                            .filter((ft) =>
                              [
                                'text',
                                'textarea',
                                'date',
                                'time',
                                'number',
                                'consent',
                                'location',
                                'datePeriod',
                                'policyPeriod',
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

                        <SelectSeparator />

                        {/* Master Data Fields */}
                        <SelectGroup>
                          <SelectLabel>Master Data Fields</SelectLabel>
                          {fieldTypes
                            .filter((ft) =>
                              [
                                'dropdown',
                                'checkbox',
                                'multiselect',
                                'multiselectDropdown',
                                'combination',
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

                        <SelectSeparator />

                        {/* Buttons */}
                        <SelectGroup>
                          <SelectLabel>Buttons</SelectLabel>
                          {fieldTypes
                            .filter((ft) => ['chooseButton', 'file'].includes(ft.value))
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
                  <div className="grid gap-4 grid-cols-1">
                    <div className="space-y-2">
                      <Label>Field Label *</Label>
                      <Input
                        value={fieldConfig.label || ''}
                        onChange={(e) => {
                          const label = e.target.value;
                          const autoName = generateFieldName(label);

                          const oldLabel = fieldConfig.label || '';
                          const currentPlaceholder = fieldConfig.placeholder || '';
                          const isDefaultPlaceholder =
                            !currentPlaceholder ||
                            currentPlaceholder === `Please enter ${oldLabel}` ||
                            currentPlaceholder === `Please select ${oldLabel}`;

                          let newPlaceholder = fieldConfig.placeholder;
                          if (isDefaultPlaceholder) {
                            const isSelect = [
                              'dropdown',
                              'multiselect',
                              'multiselectDropdown',
                              'date',
                              'datePeriod',
                            ].includes(fieldConfig.type || '');
                            newPlaceholder = isSelect
                              ? `Please select ${label}`
                              : `Please enter ${label}`;
                          }

                          setFieldConfig({
                            ...fieldConfig,
                            label,
                            name: autoName,
                            placeholder: newPlaceholder,
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
                  </div>
                </div>

                {fieldConfig.type === 'number' && (
                  <div className="space-y-2">
                    <Label>Number Format</Label>
                    <Select
                      value={fieldConfig.metadata?.numberFormat || 'none'}
                      onValueChange={(value) => {
                        setMinMaxError(null);
                        setMinMaxCharacterError(null);
                        const validations = fieldConfig.validations || [];
                        const filtered =
                          value === 'phoneNumber'
                            ? validations.filter((v) => v.type !== 'min' && v.type !== 'max')
                            : validations.filter(
                                (v) => v.type !== 'minLength' && v.type !== 'maxLength',
                              );
                        setFieldConfig({
                          ...fieldConfig,
                          metadata: {
                            ...fieldConfig.metadata,
                            numberFormat: value,
                          },
                          validations: filtered,
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select format (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Standard Number</SelectItem>
                        <SelectItem value="currency">Currency</SelectItem>
                        <SelectItem value="distance">Distance (km)</SelectItem>
                        <SelectItem value="phoneNumber">Phone Number</SelectItem>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Select formatting to apply to this number field.
                    </p>
                  </div>
                )}
                <div
                  className={cn(
                    'grid gap-4',
                    fieldConfig.type === 'consent' ? 'grid-cols-2' : 'grid-cols-1',
                  )}
                >
                  {fieldConfig.type === 'consent' && (
                    <div className="space-y-2">
                      <Label>Hyperlink Label</Label>
                      <Input
                        value={consentMetadata.consentLinkText || ''}
                        onChange={(e) =>
                          setFieldConfig({
                            ...fieldConfig,
                            metadata: {
                              ...(fieldConfig.metadata || {}),
                              consentLinkText: e.target.value,
                            },
                          })
                        }
                        placeholder="Example: Terms and Conditions"
                      />
                      <p className="text-xs text-muted-foreground">
                        This text shows inline after the field label and opens the popup.
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Note (Optional)</Label>
                    <Textarea
                      value={fieldConfig.note || ''}
                      onChange={(e) =>
                        setFieldConfig({
                          ...fieldConfig,
                          note: e.target.value,
                        })
                      }
                      placeholder="Enter a note or hint for this field"
                      rows={2}
                    />
                    <p className="text-xs text-muted-foreground">
                      This note will be shown below the field in the form.
                    </p>
                  </div>
                </div>

                {fieldConfig.type === 'consent' && (
                  <div className="space-y-2">
                    <Label>Default Value</Label>
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
                  </div>
                )}

                {fieldConfig.type === 'consent' && (
                  <div className="space-y-4 rounded-lg border bg-slate-50 p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Label>Popup Content</Label>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 text-xs"
                            >
                              <Eye className="mr-1 h-4 w-4" />
                              View Content
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>Popup Content Preview</DialogTitle>
                            </DialogHeader>
                            <div className="max-h-[70vh] overflow-y-auto rounded-md border bg-background p-4">
                              {consentMetadata.consentContentHtml &&
                              consentMetadata.consentContentHtml.trim() !== '' ? (
                                <RichTextContent html={consentMetadata.consentContentHtml} />
                              ) : (
                                <p className="text-sm text-muted-foreground">
                                  No content to preview yet.
                                </p>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <RichTextEditor
                        value={consentMetadata.consentContentHtml || ''}
                        onChange={(value) =>
                          setFieldConfig({
                            ...fieldConfig,
                            metadata: {
                              ...(fieldConfig.metadata || {}),
                              consentContentHtml: value,
                            },
                          })
                        }
                        placeholder="Enter the consent text, headings, links, and formatted content shown in the popup."
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-4 rounded-lg border bg-background p-4">
                        <div className="space-y-0.5">
                          <Label>Documents Configuration for consent</Label>
                          <p className="text-xs text-muted-foreground">
                            Manage or Add documents for consent.
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="shrink-0"
                          onClick={() => setIsConsentDocumentsDialogOpen(true)}
                        >
                          Configure Documents
                        </Button>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        These document types will be shown as upload controls inside the consent
                        popup.
                      </p>
                    </div>
                  </div>
                )}

                {fieldConfig.type === 'date' && (
                  <div className="flex items-center justify-between pb-2">
                    <div className="space-y-0.5">
                      <Label htmlFor="yearOnly">Year Only</Label>
                      <p className="text-xs text-muted-foreground">
                        Allow users to select only the year
                      </p>
                    </div>
                    <Switch
                      id="yearOnly"
                      checked={fieldConfig.showYearOnly || false}
                      onCheckedChange={(checked) => {
                        setFieldConfig({
                          ...fieldConfig,
                          showYearOnly: checked,
                          defaultValue: '',
                          metadata: {
                            ...(fieldConfig.metadata || {}),
                            is_year_only: checked,
                          },
                        });
                      }}
                    />
                  </div>
                )}

                {/* Placeholder and Default Value in one row */}
                {fieldConfig.type !== 'file' &&
                fieldConfig.type !== 'combination' &&
                fieldConfig.type !== 'chooseButton' &&
                fieldConfig.type !== 'consent' ? (
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
                      {fieldConfig.type === 'checkbox' || fieldConfig.type === 'consent' ? (
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
                            {(() => {
                              const isRefGlobalMaster =
                                optionsSourceMode === 'referenceGlobalMaster' ||
                                String(
                                  (fieldConfig.metadata as Record<string, unknown>)
                                    ?.optionsSourceMode ?? '',
                                ) === 'referenceGlobalMaster';

                              // For referenceGlobalMaster, show only the selected master values
                              if (isRefGlobalMaster && selectedMasterValues.size > 0) {
                                return Array.from(selectedMasterValues as Set<string>).map(
                                  (label) => {
                                    // Find matching option object for the value code
                                    const optObj = Array.isArray(fieldConfig.options)
                                      ? fieldConfig.options.find((o) =>
                                          typeof o === 'string'
                                            ? o === label
                                            : (o as { label?: string }).label === label,
                                        )
                                      : undefined;
                                    const val = (getOptionSelectValue(optObj) || label).trim();
                                    if (!val) return null;
                                    return (
                                      <SafeSelectItem key={label} value={val}>
                                        {label}
                                      </SafeSelectItem>
                                    );
                                  },
                                ).filter(Boolean);
                              }

                              // Fallback: use fieldConfig.options
                              return getSelectableOptions(fieldConfig.options).map((option) => (
                                <SafeSelectItem key={option.key} value={option.value}>
                                  {option.label}
                                </SafeSelectItem>
                              ));
                            })()}
                          </SelectContent>
                        </Select>
                      ) : fieldConfig.type === 'multiselect' ||
                        fieldConfig.type === 'multiselectDropdown' ? (
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
                              {getSelectableOptions(fieldConfig.options).map((option) => (
                                <SafeSelectItem key={option.key} value={option.value}>
                                  {option.label}
                                </SafeSelectItem>
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
                                    {(() => {
                                      if (typeof val !== 'object' || val === null) return val;
                                      const obj = val as Record<string, unknown>;
                                      const vLabel = obj.label;
                                      const vValue = obj.value;
                                      if (typeof vLabel === 'string') return vLabel;
                                      if (typeof vValue === 'string') return vValue;
                                      return String(val);
                                    })()}
                                    <button
                                      onClick={() => {
                                        const newDefaults = [
                                          ...(fieldConfig.defaultValue as string[]),
                                        ];
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
                        <DatePicker
                          mode={fieldConfig.showYearOnly ? 'year' : 'date'}
                          value={
                            typeof fieldConfig.defaultValue === 'string'
                              ? fieldConfig.defaultValue
                              : undefined
                          }
                          onChange={(date) =>
                            setFieldConfig({
                              ...fieldConfig,
                              defaultValue: date || undefined,
                            })
                          }
                        />
                      ) : fieldConfig.type === 'time' ? (
                        <TimePicker
                          value={
                            typeof fieldConfig.defaultValue === 'string'
                              ? fieldConfig.defaultValue
                              : ''
                          }
                          onChange={(time) =>
                            setFieldConfig({
                              ...fieldConfig,
                              defaultValue: time || undefined,
                            })
                          }
                        />
                      ) : fieldConfig.type === 'number' ? (
                        <FormattedNumberInput
                          value={
                            typeof fieldConfig.defaultValue === 'number'
                              ? fieldConfig.defaultValue
                              : undefined
                          }
                          allowDecimals
                          useGrouping={fieldConfig.metadata?.numberFormat !== 'phoneNumber'}
                          onChange={(value) => {
                            setFieldConfig({
                              ...fieldConfig,
                              defaultValue: Number.isNaN(value) ? undefined : value,
                            });
                          }}
                          onBlur={(e) => {
                            const raw = e.target.value.replace(/,/g, '').trim();
                            if (raw === '' || raw === '-') {
                              setFieldConfig({
                                ...fieldConfig,
                                defaultValue: undefined,
                              });
                              return;
                            }
                            const parsed = Number(raw);
                            setFieldConfig({
                              ...fieldConfig,
                              defaultValue: Number.isNaN(parsed)
                                ? fieldConfig.defaultValue
                                : parsed,
                            });
                          }}
                          placeholder="Enter default number"
                        />
                      ) : fieldConfig.type === 'textarea' ? (
                        <Textarea
                          value={
                            typeof fieldConfig.defaultValue === 'string'
                              ? fieldConfig.defaultValue
                              : ''
                          }
                          onChange={(e) =>
                            setFieldConfig({
                              ...fieldConfig,
                              defaultValue: e.target.value || undefined,
                            })
                          }
                          placeholder="Enter default value"
                          rows={3}
                        />
                      ) : (
                        <Input
                          value={
                            typeof fieldConfig.defaultValue === 'string'
                              ? fieldConfig.defaultValue
                              : ''
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
                ) : fieldConfig.type === 'consent' ? null : (
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

                <div className="grid grid-cols-1 gap-4 border-t pt-4 md:grid-cols-3">
                  <div className="flex items-center gap-3 pt-[10px]">
                    <Label htmlFor="requiredField" className="mb-0 whitespace-nowrap">
                      Required
                    </Label>
                    <Switch
                      id="requiredField"
                      checked={
                        fieldConfig.type === 'consent' ? true : fieldConfig.required !== false
                      }
                      onCheckedChange={(checked) => {
                        setFieldConfig({
                          ...fieldConfig,
                          required: checked,
                        });
                      }}
                      disabled={fieldConfig.type === 'consent' || fieldConfig.isRatingParameter}
                    />
                  </div>
                  {fieldConfig.type !== 'consent' && !hideRatingParameterControls && (
                    <div className="flex items-center gap-3 pt-[10px]">
                      <Label htmlFor="ratingParameter" className="mb-0 whitespace-nowrap">
                        Rating Parameter
                      </Label>
                      <Switch
                        id="ratingParameter"
                        checked={fieldConfig.isRatingParameter || false}
                        onCheckedChange={(checked) => {
                          setFieldConfig({
                            ...fieldConfig,
                            isRatingParameter: checked,
                            required: checked ? true : fieldConfig.required,
                          });
                        }}
                        disabled={
                          fieldConfig.type === 'text' ||
                          fieldConfig.type === 'textarea' ||
                          fieldConfig.type === 'file' ||
                          fieldConfig.type === 'location' ||
                          fieldConfig.type === 'time' ||
                          fieldConfig.type === 'consent' ||
                          fieldConfig.type === 'chooseButton'
                        }
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-3 pt-[10px]">
                    <Label htmlFor="field-active-toggle" className="mb-0 whitespace-nowrap">
                      Active
                    </Label>
                    <Switch
                      id="field-active-toggle"
                      checked={fieldConfig.metadata?.active !== false}
                      onCheckedChange={(checked) =>
                        setFieldConfig({
                          ...fieldConfig,
                          metadata: {
                            ...(fieldConfig.metadata || {}),
                            active: checked,
                          },
                        })
                      }
                    />
                  </div>
                </div>

                {/* Number Format & Calculation for Numeric Fields */}
                {fieldConfig.type === 'number' && (
                  <div className="space-y-4 border-t pt-4">
                    <div className="flex items-center justify-between">
                      <Label>Calculation Config</Label>
                      <p className="text-xs text-muted-foreground">
                        Configure formulas after saving the field by clicking the calculator icon in
                        the fields list.
                      </p>
                    </div>
                  </div>
                )}

                {/* Location Coordinates Configuration */}
                {fieldConfig.type === 'location' && (
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="text-sm font-semibold">Map Service Configuration</h3>
                    <div className="space-y-2">
                      <Label>Map Provider</Label>
                      <Select
                        value={resolveMapProviderValue(
                          fieldConfig.metadata?.mapProvider ?? fieldConfig.mapProvider,
                          fieldConfig.metadata?.mapApiUrl ?? fieldConfig.mapApiUrl,
                        )}
                        onValueChange={(value) => {
                          setFieldConfig({
                            ...fieldConfig,
                            mapProvider: value,
                            metadata: {
                              ...fieldConfig.metadata,
                              mapProvider: value,
                              mapApiUrl:
                                value === 'default'
                                  ? 'https://nominatim.openstreetmap.org'
                                  : 'https://maps.googleapis.com/maps/api/js',
                            },
                            // Set default URLs based on provider
                            mapApiUrl:
                              value === 'default'
                                ? 'https://nominatim.openstreetmap.org'
                                : 'https://maps.googleapis.com/maps/api/js',
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

                {fieldConfig.type === 'chooseButton' && (
                  <div className="space-y-4 border-t pt-4">
                    <div className="space-y-2">
                      <Label>Button Options *</Label>
                      <p className="text-xs text-muted-foreground">
                        Add options by typing and pressing Enter. Each will appear as a button.
                      </p>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Type option and press Enter"
                          className="text-sm h-8"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const input = e.currentTarget;
                              const value = input.value.trim();
                              if (
                                value &&
                                !(fieldConfig.options || []).some(
                                  (opt) =>
                                    (typeof opt === 'string' ? opt : opt?.label) === value,
                                )
                              ) {
                                const nextOptions = [...(fieldConfig.options || []), value];
                                setFieldConfig({
                                  ...fieldConfig,
                                  options: nextOptions,
                                });
                                setFieldChooseButtonOptionIds((current) => [
                                  ...current,
                                  ...createStableOptionIds(1, 'cb-opt'),
                                ]);
                                input.value = '';
                              }
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                          onClick={(e) => {
                            const input = e.currentTarget
                              .previousElementSibling as HTMLInputElement;
                            const value = input?.value?.trim();
                            if (
                              value &&
                              !(fieldConfig.options || []).some(
                                (opt) =>
                                  (typeof opt === 'string' ? opt : opt?.label) === value,
                              )
                            ) {
                              const nextOptions = [...(fieldConfig.options || []), value];
                              setFieldConfig({
                                ...fieldConfig,
                                options: nextOptions,
                              });
                              setFieldChooseButtonOptionIds((current) => [
                                ...current,
                                ...createStableOptionIds(1, 'cb-opt'),
                              ]);
                              input.value = '';
                            }
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {fieldConfig.options && fieldConfig.options.length > 0 && (
                        <div className="flex flex-col gap-2 mt-2 mb-2 w-full">
                          {fieldConfig.options.length > 1 && (
                            <div className="flex justify-start gap-2 mb-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => {
                                  const sorted = [...(fieldConfig.options || [])].sort(
                                    (a, b) => {
                                      const valA = typeof a === 'string' ? a : a?.label || '';
                                      const valB = typeof b === 'string' ? b : b?.label || '';
                                      return valA.localeCompare(valB);
                                    },
                                  );
                                  setFieldConfig({ ...fieldConfig, options: sorted });
                                  setFieldChooseButtonOptionIds(
                                    createStableOptionIds(sorted.length, 'cb-opt'),
                                  );
                                }}
                              >
                                Sort A-Z
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => {
                                  const sorted = [...(fieldConfig.options || [])].sort(
                                    (a, b) => {
                                      const valA = typeof a === 'string' ? a : a?.label || '';
                                      const valB = typeof b === 'string' ? b : b?.label || '';
                                      return valB.localeCompare(valA);
                                    },
                                  );
                                  setFieldConfig({ ...fieldConfig, options: sorted });
                                  setFieldChooseButtonOptionIds(
                                    createStableOptionIds(sorted.length, 'cb-opt'),
                                  );
                                }}
                              >
                                Sort Z-A
                              </Button>
                            </div>
                          )}
                          
                          <div className="w-full relative">
                            {(fieldConfig.options || []).map((option, idx) => {
                              const stableId =
                                fieldChooseButtonOptionIds[idx] || `cb-opt-fallback-${idx}`;
                              const isDragging =
                                activeDragItem?.scope === 'fieldChooseButton' &&
                                activeDragItem.index === idx;
                              const isDragOver =
                                dragOverItem?.scope === 'fieldChooseButton' &&
                                dragOverItem.index === idx;
                              return (
                                <div
                                  key={stableId}
                                  className={cn(
                                    'mb-2 rounded-md bg-background transition-all',
                                    isDragging && 'opacity-60 shadow-lg',
                                    isDragOver && !isDragging && 'ring-2 ring-primary/30 border border-primary/20',
                                  )}
                                  onDragOver={(event) =>
                                    handleDragOverItem(event, 'fieldChooseButton', idx)
                                  }
                                  onDrop={(event) => handleDropItem(event, 'fieldChooseButton', idx)}
                                >
                                  <div className="flex items-center gap-2">
                                    <div
                                      draggable
                                      onDragStart={(event) =>
                                        startDrag(event, 'fieldChooseButton', idx)
                                      }
                                      onDragEnd={handleDragEnd}
                                      className={cn(
                                        'flex cursor-grab items-center rounded border border-border/60 bg-muted/30 px-2 py-2 transition-colors',
                                        isDragging && 'cursor-grabbing bg-primary/10 text-primary',
                                      )}
                                    >
                                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <Input
                                      value={
                                        typeof option === 'string'
                                          ? option
                                          : option?.label || ''
                                      }
                                      className="h-8 text-sm"
                                      onChange={(e) => {
                                        updateOptionAtIndex(
                                          'fieldChooseButton',
                                          fieldConfig.options,
                                          idx,
                                          e.target.value,
                                          (nextOptions) =>
                                            setFieldConfig({
                                              ...fieldConfig,
                                              options: nextOptions,
                                            }),
                                        );
                                      }}
                                      onBlur={() =>
                                        clearOptionEditError('fieldChooseButton', idx)
                                      }
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 px-2 text-destructive hover:text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200 cursor-pointer"
                                      onClick={() => {
                                        const nextOptions = (fieldConfig.options || []).filter(
                                          (_, i) => i !== idx,
                                        );
                                        const hasOther = nextOptions.some(
                                          (o) =>
                                            (typeof o === 'string' ? o : o?.label)?.toLowerCase() ===
                                            'other',
                                        );
                                        const nextMeta = {
                                          ...(fieldConfig.metadata || {}),
                                        };
                                        if (!hasOther) delete nextMeta.allowOther;
                                        clearOptionEditError('fieldChooseButton', idx);
                                        setFieldConfig({
                                          ...fieldConfig,
                                          options: nextOptions.length > 0 ? nextOptions : undefined,
                                          metadata:
                                            Object.keys(nextMeta).length > 0 ? nextMeta : undefined,
                                        });
                                        setFieldChooseButtonOptionIds((current) =>
                                          current.filter((_, i) => i !== idx),
                                        );
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  {optionEditError?.scope === 'fieldChooseButton' &&
                                    optionEditError.index === idx && (
                                      <p className="mt-1 text-xs text-destructive">
                                        {optionEditError.message}
                                      </p>
                                    )}
                                </div>
                              );
                            })}
                          </div>
                          
                          {fieldBlankOptionIndexes.length > 0 && (
                            <p className="text-xs text-destructive">
                              Option name is required and cannot be blank.
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Default Selected (optional)</Label>
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
                          <SelectValue placeholder="Select default option (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No default</SelectItem>
                          {getSelectableOptions(fieldConfig.options).map((option) => (
                            <SafeSelectItem key={option.key} value={option.value}>
                              {option.label}
                            </SafeSelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Date Period Configuration */}
                {(fieldConfig.type === 'datePeriod' || fieldConfig.type === 'policyPeriod') && (
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="text-sm font-semibold">
                      {fieldConfig.type === 'policyPeriod'
                        ? 'Policy Period Configuration'
                        : 'Date Period Configuration'}
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>From Date Label</Label>
                        <Input
                          value={fieldConfig.fromDateLabel || 'From Date'}
                          onChange={(e) =>
                            setFieldConfig({
                              ...fieldConfig,
                              fromDateLabel: e.target.value,
                            })
                          }
                          placeholder="e.g., Start Date"
                        />
                        <p className="text-xs text-muted-foreground">
                          Label for the "from" date field
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>To Date Label</Label>
                        <Input
                          value={fieldConfig.toDateLabel || 'To Date'}
                          onChange={(e) =>
                            setFieldConfig({
                              ...fieldConfig,
                              toDateLabel: e.target.value,
                            })
                          }
                          placeholder="e.g., End Date"
                        />
                        <p className="text-xs text-muted-foreground">
                          Label for the "to" date field
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Period Calculation Unit</Label>
                      <Select
                        value={fieldConfig.periodCalculationUnit || 'months'}
                        onValueChange={(value: 'days' | 'months' | 'years') => {
                          setFieldConfig({
                            ...fieldConfig,
                            periodCalculationUnit: value,
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="days">Days</SelectItem>
                          <SelectItem value="months">Months</SelectItem>
                          <SelectItem value="years">Years</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Unit for calculating the period between from and to dates
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="autoCalculatePeriod">Auto Calculate Period</Label>
                        <p className="text-xs text-muted-foreground">
                          Automatically calculate and display the period between dates
                        </p>
                      </div>
                      <Switch
                        id="autoCalculatePeriod"
                        checked={fieldConfig.autoCalculatePeriod !== false}
                        onCheckedChange={(checked) => {
                          setFieldConfig({
                            ...fieldConfig,
                            autoCalculatePeriod: checked,
                          });
                        }}
                      />
                    </div>
                  </div>
                )}

                {fieldConfig.type === 'date' && (
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="text-sm font-semibold">Date Configuration</h3>
                    <div className="space-y-2">
                      <Label>Period Calculation Unit</Label>
                      <Select
                        value={fieldConfig.periodCalculationUnit || 'months'}
                        onValueChange={(value: 'days' | 'months' | 'years') => {
                          setFieldConfig({
                            ...fieldConfig,
                            periodCalculationUnit: value,
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="days">Days</SelectItem>
                          <SelectItem value="months">Months</SelectItem>
                          <SelectItem value="years">Years</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Unit for calculating time periods involving this date (e.g., age in Years)
                      </p>
                    </div>
                  </div>
                )}

                {(fieldConfig.type === 'combination' || fieldConfig.type === 'repeatable') && (
                  <div className="space-y-4">
                    {fieldConfig.type === 'combination' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label>Restrict Maximum Row Count</Label>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    className="text-muted-foreground transition-colors hover:text-foreground"
                                    aria-label="Explain maximum row count restriction"
                                  >
                                    <Info className="h-4 w-4" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p>
                                    When this is on, users can add rows only up to the maximum count
                                    you set. When it is off, row labels decide the available rows.
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <div className="flex items-center space-x-2 h-10">
                            <Switch
                              checked={maximizeRowsEnabled}
                              onCheckedChange={handleMaximizeRowsToggle}
                            />
                          </div>
                        </div>
                        {maximizeRowsEnabled ? (
                          <div className="space-y-2">
                            <Label>Maximum row count</Label>
                            <Input
                              type="number"
                              min="1"
                              value={maximumRowCountValue}
                              onChange={(e) => handleMaximumRowCountChange(e.target.value)}
                              placeholder="Enter maximum number of rows"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="space-y-2">
                              <Label>Row Labels (Optional)</Label>
                              <Input
                                value={combinationRowLabelsInput}
                                onChange={(e) => {
                                  setCombinationRowLabelsInput(e.target.value);
                                }}
                                onBlur={() => {
                                  const labels = parseCSVLabels(combinationRowLabelsInput);
                                  setCombinationRowLabels(labels);
                                  setCombinationRowLabelsInput(formatCSVLabels(labels));
                                }}
                                placeholder='e.g., 2025, 2024, 2023 or "Dubai, UAE", Abu Dhabi'
                              />
                              <p className="text-xs text-muted-foreground">
                                Supports quoted values with commas, e.g. "Dubai, UAE". Row count
                                will match the number of labels.
                              </p>
                            </div>
                          </>
                        )}
                        <div className="space-y-2">
                          <Label>Rows dependent field (Optional)</Label>
                          <Select
                            value={fieldConfig.metadata?.rowsDependentField || 'none'}
                            onValueChange={(value) =>
                              setFieldConfig({
                                ...fieldConfig,
                                metadata: {
                                  ...fieldConfig.metadata,
                                  rowsDependentField: value === 'none' ? null : value,
                                },
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select field" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {getNumericFieldsForPage(
                                pages.find((p) => p.id === selectedPageId) || null,
                              )
                                .filter((f) => f.name !== fieldConfig.name)
                                .map((f) => (
                                  <SafeSelectItem key={f.name} value={f.name}>
                                    {f.label}
                                  </SafeSelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            Number of rows will depend on the value of this field
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label>Import/Export Options</Label>
                          <div className="flex items-center space-x-2 h-10">
                            <Checkbox
                              id="addImportExportButton"
                              checked={fieldConfig.metadata?.addImportExportButton === true}
                              onCheckedChange={(checked) =>
                                setFieldConfig({
                                  ...fieldConfig,
                                  metadata: {
                                    ...fieldConfig.metadata,
                                    addImportExportButton: checked === true,
                                  },
                                })
                              }
                            />
                            <Label
                              htmlFor="addImportExportButton"
                              className="text-sm font-normal cursor-pointer"
                            >
                              Add import export buttons
                            </Label>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Enable CSV import/export functionality for this field
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-bold">
                            Multi Unit Premium Calculation
                          </Label>
                          <div className="flex items-center space-x-2 h-10">
                            <Checkbox
                              id="isCombinationPremium"
                              checked={fieldConfig.metadata?.isCombinationPremium === true}
                              onCheckedChange={(checked) =>
                                setFieldConfig({
                                  ...fieldConfig,
                                  metadata: {
                                    ...fieldConfig.metadata,
                                    isCombinationPremium: checked === true,
                                  },
                                })
                              }
                            />
                            <Label
                              htmlFor="isCombinationPremium"
                              className="text-sm font-normal cursor-pointer"
                            >
                              Enable Multi Unit Premium Calculation
                            </Label>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-bold">Cover Selection By Units</Label>
                          {(() => {
                            const coverSelectionSubFields = (subFieldsConfig || []).filter((sf) => {
                              const meta =
                                sf && typeof sf === 'object'
                                  ? ((sf as unknown as { metadata?: unknown }).metadata as unknown)
                                  : undefined;
                              const mode =
                                meta &&
                                typeof meta === 'object' &&
                                typeof (meta as Record<string, unknown>).optionsSourceMode ===
                                  'string'
                                  ? String(
                                      (meta as Record<string, unknown>).optionsSourceMode,
                                    ).trim()
                                  : '';
                              return mode === 'coverSelection';
                            });

                            const enabled = fieldConfig.metadata?.coverSelectionByUnits === true;
                            const selectedId =
                              typeof fieldConfig.metadata?.coverSelectionSubFieldId === 'string'
                                ? String(fieldConfig.metadata.coverSelectionSubFieldId)
                                : '';
                            const selectedIsValid = coverSelectionSubFields.some(
                              (sf) => sf.id === selectedId,
                            );

                            return (
                              <>
                                <div className="flex items-center space-x-2 h-10">
                                  <Checkbox
                                    id="coverSelectionByUnits"
                                    checked={enabled}
                                    disabled={coverSelectionSubFields.length === 0}
                                    onCheckedChange={(checked) => {
                                      const nextEnabled = checked === true;
                                      const nextSubFieldId = nextEnabled
                                        ? selectedIsValid
                                          ? selectedId
                                          : coverSelectionSubFields[0]?.id
                                        : undefined;
                                      setFieldConfig({
                                        ...fieldConfig,
                                        metadata: {
                                          ...fieldConfig.metadata,
                                          coverSelectionByUnits: nextEnabled,
                                          coverSelectionSubFieldId: nextSubFieldId,
                                        },
                                      });
                                    }}
                                  />
                                  <Label
                                    htmlFor="coverSelectionByUnits"
                                    className="text-sm font-normal cursor-pointer"
                                  >
                                    Show each unit only under its selected cover
                                  </Label>
                                </div>

                                {coverSelectionSubFields.length === 0 ? (
                                  <p className="text-xs text-muted-foreground">
                                    Add a dropdown sub-field with Options Source set to “Fetch from
                                    Covers” to enable this.
                                  </p>
                                ) : enabled ? (
                                  <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">
                                      Cover Type Sub-Field
                                    </Label>
                                    <Select
                                      value={
                                        selectedIsValid
                                          ? selectedId
                                          : coverSelectionSubFields[0]?.id || ''
                                      }
                                      onValueChange={(value) => {
                                        setFieldConfig({
                                          ...fieldConfig,
                                          metadata: {
                                            ...fieldConfig.metadata,
                                            coverSelectionSubFieldId: value,
                                          },
                                        });
                                      }}
                                    >
                                      <SelectTrigger className="h-8">
                                        <SelectValue placeholder="Select sub-field" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {coverSelectionSubFields
                                          .filter(
                                            (sf) =>
                                              typeof sf.id === 'string' && sf.id.trim() !== '',
                                          )
                                          .map((sf) => (
                                          <SafeSelectItem key={sf.id} value={sf.id}>
                                            {sf.label || sf.name || sf.id}
                                          </SafeSelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                ) : null}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                    {fieldConfig.type === 'repeatable' && (
                      <div className="flex items-center space-x-2 py-2">
                        <Switch
                          checked={fieldConfig.allowAddRemove !== false}
                          onCheckedChange={(checked) =>
                            setFieldConfig({ ...fieldConfig, allowAddRemove: checked })
                          }
                        />
                        <Label>Allow Add/Remove Rows</Label>
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-4 mt-2">
                      <div className="space-y-1">
                        <Label className="text-base font-bold text-foreground">
                          Sub-Fields Configuration
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Define the structure of your combination field
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={startAddingSubField}
                        className="shadow-sm hover:shadow-md transition-shadow"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Sub-Field
                      </Button>
                    </div>
                    {subFieldsConfig.length === 0 ? (
                      <div className="p-12 text-center border-2 border-dashed rounded-xl bg-muted/20">
                        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                          <Plus className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-foreground">
                          No sub-fields added yet
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 max-w-[200px] mx-auto">
                          Click "Add Sub-Field" to start building your combination field structure.
                        </p>
                      </div>
                    ) : (
                      <div className="border rounded-xl shadow-sm overflow-hidden bg-card">
                        <div className="">
                          <Table>
                            <TableHeader className="bg-muted/50">
                              <TableRow>
                                <TableHead className="w-[96px] px-3"></TableHead>
                                <TableHead className="px-3">Label *</TableHead>
                                <TableHead className="px-3">Type *</TableHead>
                                <TableHead className="px-3 text-center">Calc</TableHead>
                                <TableHead className="px-3 text-center">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {subFieldsConfig.map((subField, idx) => {
                                const rowId = subField.id || `sf-${idx}`;
                                const isDragging =
                                  activeDragItem?.scope === 'subFields' &&
                                  activeDragItem.index === idx;
                                const isDragOver =
                                  dragOverItem?.scope === 'subFields' &&
                                  dragOverItem.index === idx;
                                return (
                                  <TableRow
                                    key={rowId}
                                    className={cn(
                                      'bg-background group hover:bg-muted/30 transition-shadow',
                                      isDragging && 'opacity-60 shadow-lg',
                                      isDragOver && !isDragging && 'ring-2 ring-primary/30',
                                    )}
                                    onDragOver={(event) => handleDragOverItem(event, 'subFields', idx)}
                                    onDrop={(event) => handleDropItem(event, 'subFields', idx)}
                                  >
                                    <TableCell className="py-1.5 px-3 w-[96px]">
                                      <div
                                        draggable
                                        onDragStart={(event) => startDrag(event, 'subFields', idx)}
                                        onDragEnd={handleDragEnd}
                                        className={cn(
                                          'flex cursor-grab items-center rounded border border-border/60 bg-muted/30 px-2 py-2 transition-colors',
                                          isDragging && 'cursor-grabbing bg-primary/10 text-primary',
                                        )}
                                      >
                                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                                      </div>
                                    </TableCell>
                                                <TableCell className="py-1.5 px-3">
                                                  <span
                                                    className="text-sm truncate block max-w-[250px]"
                                                    title={subField.label}
                                                  >
                                                    {subField.label || '—'}
                                                  </span>
                                                </TableCell>
                                                <TableCell className="py-1.5 px-3 w-[120px]">
                                                  <div className="flex items-center gap-1.5">
                                                    <Badge
                                                      variant="secondary"
                                                      className="capitalize font-normal px-2 py-0.5 text-[10px]"
                                                    >
                                                      {subField.type}
                                                    </Badge>
                                                    {subField.isRatingParameter &&
                                                      !hideRatingParameterControls && (
                                                        <Badge
                                                          variant="default"
                                                          className="text-xs"
                                                        >
                                                          Rating
                                                        </Badge>
                                                      )}
                                                  </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                  {subField.type === 'number' ||
                                                  subField.type === 'dropdown' ? (
                                                    <Button
                                                      variant="ghost"
                                                      size="icon"
                                                      className={`h-8 w-8 ${
                                                        subField.metadata?.calculation
                                                          ? 'text-primary'
                                                          : 'text-muted-foreground'
                                                      }`}
                                                      onClick={() => {
                                                        const calculation = subField.metadata
                                                          ?.calculation as
                                                          | CalculationConfig
                                                          | undefined;
                                                        setCurrentCalculationSubFieldIndex(idx);
                                                        setTempCalculationConfig({
                                                          ...(calculation || {
                                                            type:
                                                              subField.type === 'dropdown'
                                                                ? 'dropdownConditional'
                                                                : subField.type === 'date'
                                                                  ? 'date'
                                                                  : 'arithmetic',
                                                            ...(subField.type === 'dropdown'
                                                              ? {
                                                                  rules: [
                                                                    {
                                                                      id: crypto.randomUUID(),
                                                                      conditions: [
                                                                        {
                                                                          id: crypto.randomUUID(),
                                                                          field: '',
                                                                          operator: 'equals',
                                                                          numberMode: 'comparison',
                                                                          value: '',
                                                                          selectedValues: [],
                                                                          selectionMode: 'single',
                                                                        },
                                                                      ],
                                                                      result: {
                                                                        selectionMode: 'single',
                                                                        selectedValues: [],
                                                                      },
                                                                    },
                                                                  ],
                                                                }
                                                              : {
                                                                  initialField: '',
                                                                  ...(subField.type === 'date'
                                                                    ? {
                                                                        comparisonMode:
                                                                          'currentDate',
                                                                        comparisonField: '',
                                                                        customDate: '',
                                                                        unit: 'days',
                                                                      }
                                                                    : {
                                                                        operations: [],
                                                                      }),
                                                                }),
                                                          }),
                                                        });
                                                        setIsCalculationDialogOpen(true);
                                                      }}
                                                    >
                                                      <Calculator className="w-4 h-4" />
                                                    </Button>
                                                  ) : subField.type === 'date' ? (
                                                    <span
                                                      className={`inline-flex h-8 w-8 items-center justify-center ${
                                                        subField.metadata?.calculation
                                                          ? 'text-primary'
                                                          : 'text-muted-foreground'
                                                      }`}
                                                      title="Date calculation indicator"
                                                    >
                                                      <CalendarDays className="w-4 h-4" />
                                                    </span>
                                                  ) : (
                                                    <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-tight">
                                                      N/A
                                                    </span>
                                                  )}
                                                </TableCell>
                                                <TableCell className="text-center py-1.5 px-3 w-[140px]">
                                                  <div className="flex items-center justify-center gap-1.5">
                                                    <TooltipProvider>
                                                      <Tooltip>
                                                        <TooltipTrigger asChild>
                                                          <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 hover:text-primary hover:bg-primary/5 transition-colors"
                                                            onClick={() =>
                                                              startEditingSubField(subField)
                                                            }
                                                          >
                                                            <Edit className="w-4 h-4" />
                                                          </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                          Edit sub-field
                                                        </TooltipContent>
                                                      </Tooltip>
                                                    </TooltipProvider>

                                                    <TooltipProvider>
                                                      <Tooltip>
                                                        <TooltipTrigger asChild>
                                                          <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/5 transition-colors"
                                                            onClick={() => {
                                                              setSubFieldsConfig(
                                                                subFieldsConfig.filter(
                                                                  (_, i) => i !== idx,
                                                                ),
                                                              );
                                                              setSubFieldOptionsInput((prev) => {
                                                                const next = { ...prev };
                                                                delete next[
                                                                  subField.id || subField.name
                                                                ];
                                                                return next;
                                                              });
                                                            }}
                                                          >
                                                            <Trash2 className="w-4 h-4" />
                                                          </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                          Remove sub-field
                                                        </TooltipContent>
                                                      </Tooltip>
                                                    </TooltipProvider>
                                                  </div>
                                                </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Sub-fields will be combined into an array of objects when submitted. Example:
                      [{"{year: 2025, claimsValue: 3200000, description: '...'}"}]
                    </p>
                  </div>
                )}

                {(fieldConfig.type === 'dropdown' ||
                  fieldConfig.type === 'multiselect' ||
                  fieldConfig.type === 'multiselectDropdown') && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Dependent Dropdown</Label>
                      <Select
                        value={fieldConfig.dependentOn ? fieldConfig.dependentOn : ''}
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
                              optionsUrl: undefined,
                              globalMasterKey: undefined,
                              defaultValue: undefined,
                            });
                            setOptionsInput('');

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
                              dependentOptionsUrl: undefined,

                              // RESET option-related state
                              options: undefined,
                              optionsUrl: undefined,
                              globalMasterKey: undefined,
                              defaultValue: undefined,
                            });
                            setOptionsInput('');
                            setDependentOptionsInput('');
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
                                      field.type === 'multiselectDropdown' ||
                                      field.type === 'text') &&
                                    typeof field.name === 'string' &&
                                    field.name.trim() !== '' &&
                                    field.name !== fieldConfig.name &&
                                    field.id !== selectedFieldId,
                                )
                                .map((field) => (
                                  <SafeSelectItem key={field.id} value={field.name}>
                                    {field.label} ({field.name})
                                  </SafeSelectItem>
                                )),
                            ),
                          )}
                        </SelectContent>
                      </Select>
                      {fieldConfig.dependentOn && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => {
                            setFieldConfig({
                              ...fieldConfig,
                              dependentOn: undefined,
                              dependentOptions: undefined,
                              dependentOptionsUrl: undefined,

                              // RESET option-related state
                              options: undefined,
                              optionsUrl: undefined,
                              globalMasterKey: undefined,
                              defaultValue: undefined,
                            });
                            setOptionsInput('');
                            setDependentOptionsInput('');
                            setOptionsSourceMode('static');
                          }}
                        >
                          Clear <X className="h-1 w-1" />
                        </Button>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Select a parent field to create a dependent dropdown (e.g., Region depends
                        on Country)
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
                                  defaultValue: undefined,
                                });
                              } else {
                                setFieldConfig({
                                  ...fieldConfig,
                                  dependentOptionsUrl: undefined,
                                  dependentOptions: {},
                                  defaultValue: undefined,
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
                          (() => {
                            // Find the parent field and its options
                            const parentField = pages
                              .flatMap((p) => p.sections.flatMap((s) => s.fields))
                              .find((f) => f.name === fieldConfig.dependentOn);

                            // Get all possible parent values - from BOTH static options AND dependentOptions
                            let parentOptions: Array<string | { label: string; value: string }> =
                              [];

                            if (parentField?.options && parentField.options.length > 0) {
                              // Parent has static options
                              parentOptions = parentField.options;
                            } else if (parentField?.dependentOptions) {
                              // Parent is itself a dependent dropdown - collect ALL its possible child values
                              const allDependentValues = Object.values(
                                parentField.dependentOptions,
                              ).flat();
                              parentOptions = allDependentValues.map((val) => ({
                                label: String(val),
                                value: String(val),
                              }));
                            }

                            // If parent has options (static or from its dependentOptions), show structured UI
                            if (parentOptions.length > 0) {
                              return (
                                <div className="space-y-3">
                                  <Label>Configure Options for Each Parent Value</Label>
                                  <p className="text-xs text-muted-foreground mb-2">
                                    Add child options for each parent value. Press Enter or click +
                                    to add.
                                  </p>
                                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                                    {parentOptions.map((parentOpt) => {
                                      const parentValue =
                                        typeof parentOpt === 'string' ? parentOpt : parentOpt.value;
                                      const parentLabel =
                                        typeof parentOpt === 'string' ? parentOpt : parentOpt.label;
                                      const currentChildren =
                                        fieldConfig.dependentOptions?.[parentValue] || [];

                                      return (
                                        <div
                                          key={parentValue}
                                          className="border rounded-lg p-3 bg-muted/30"
                                        >
                                          <div className="flex items-center justify-between mb-2">
                                            <Label className="text-sm font-medium">
                                              {parentLabel}
                                            </Label>
                                            <div className="flex items-center gap-2">
                                              <span className="text-xs text-muted-foreground mr-1">
                                                ({currentChildren.length} options)
                                              </span>
                                              {currentChildren.length > 1 && (
                                                <Button
                                                  type="button"
                                                  variant="ghost"
                                                  size="sm"
                                                  className="h-6 px-1.5 text-[10px] hover:bg-primary/10 hover:text-primary transition-colors"
                                                  onClick={() => {
                                                    const sorted = [...currentChildren].sort(
                                                      (a, b) => String(a).localeCompare(String(b)),
                                                    );
                                                    setFieldConfig({
                                                      ...fieldConfig,
                                                      dependentOptions: {
                                                        ...fieldConfig.dependentOptions,
                                                        [parentValue]: sorted,
                                                      },
                                                    });
                                                  }}
                                                >
                                                  Sort A-Z
                                                </Button>
                                              )}
                                            </div>
                                          </div>
                                          {/* Tags for existing child options */}
                                          <div className="flex flex-wrap gap-1 mb-2">
                                            {currentChildren.map((child, idx) => (
                                              <Badge
                                                key={idx}
                                                variant="secondary"
                                                className="gap-1 pr-1"
                                              >
                                                {child}
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    const newChildren = currentChildren.filter(
                                                      (_, i) => i !== idx,
                                                    );
                                                    setFieldConfig({
                                                      ...fieldConfig,
                                                      dependentOptions: {
                                                        ...fieldConfig.dependentOptions,
                                                        [parentValue]: newChildren,
                                                      },
                                                    });
                                                  }}
                                                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                                                >
                                                  <X className="h-3 w-3" />
                                                </button>
                                              </Badge>
                                            ))}
                                          </div>
                                          {/* Input for adding new child options */}
                                          <div className="flex gap-2">
                                            <Input
                                              placeholder="Type option and press Enter"
                                              className="text-sm h-8"
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                  e.preventDefault();
                                                  const input = e.currentTarget;
                                                  const value = input.value.trim();
                                                  if (value && !currentChildren.includes(value)) {
                                                    setFieldConfig({
                                                      ...fieldConfig,
                                                      dependentOptions: {
                                                        ...fieldConfig.dependentOptions,
                                                        [parentValue]: [...currentChildren, value],
                                                      },
                                                    });
                                                    input.value = '';
                                                  }
                                                }
                                              }}
                                            />
                                            <Button
                                              type="button"
                                              variant="outline"
                                              size="sm"
                                              className="h-8 px-2"
                                              onClick={(e) => {
                                                const input = e.currentTarget
                                                  .previousElementSibling as HTMLInputElement;
                                                const value = input?.value?.trim();
                                                if (value && !currentChildren.includes(value)) {
                                                  setFieldConfig({
                                                    ...fieldConfig,
                                                    dependentOptions: {
                                                      ...fieldConfig.dependentOptions,
                                                      [parentValue]: [...currentChildren, value],
                                                    },
                                                  });
                                                  input.value = '';
                                                }
                                              }}
                                            >
                                              <Plus className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            }

                            // Fallback to textarea for URL-based parent options
                            return (
                              <div className="space-y-2">
                                <Label>Dependent Options Mapping</Label>
                                <p className="text-xs text-muted-foreground mb-2">
                                  Format: Parent Value = Child Option 1, Child Option 2, Child
                                  Option 3
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
                                    const lines = value.split('\n').filter((l) => l.trim());
                                    const mapping: Record<string, string[]> = {};
                                    lines.forEach((line) => {
                                      const [parent, childrenStr] = line
                                        .split('=')
                                        .map((s) => s.trim());
                                      if (parent && childrenStr) {
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
                                  placeholder="USA = North, South, East, West&#10;Canada = Ontario, Quebec, British Columbia"
                                  rows={6}
                                />
                                <p className="text-xs text-muted-foreground">
                                  Parent field options are URL-based. Enter mappings manually.
                                </p>
                              </div>
                            );
                          })()
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {fieldConfig.type !== 'chooseButton' && (
                          <>
                            <div className="space-y-2">
                              <Label>Options Source</Label>
                              <Select
                                value={optionsSourceMode}
                                onValueChange={(
                                  value:
                                    | 'static'
                                    | 'url'
                                    | 'globalMaster'
                                    | 'referenceGlobalMaster'
                                    | 'coverSelection',
                                ) => {
                                  setOptionsSourceMode(value);
                                  setSelectedGlobalMaster(null);
                                  setSelectedMasterValues(new Set());
                                  setOptionsInput('');
                                  setDependentOptionsInput('');
                                  setFieldConfig({
                                    ...fieldConfig,
                                    options: value === 'static' ? [] : undefined,
                                    optionsUrl: value === 'url' ? '' : undefined,
                                    globalMasterKey: undefined,
                                    defaultValue: undefined,
                                    metadata: (() => {
                                      const nextMeta = {
                                        ...(fieldConfig.metadata || {}),
                                        globalMasterId: undefined,
                                        selectedMasterValues: undefined,
                                        optionsSourceMode: value,
                                      };
                                      delete nextMeta.allowOther;
                                      return nextMeta;
                                    })(),
                                  });
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="static">Provide option manually</SelectItem>
                                  <SelectItem value="url">Copy from URL</SelectItem>
                                  <SelectItem value="coverSelection">Copy from Covers</SelectItem>
                                  <SelectItem value="globalMaster">
                                    Copy from Global Master
                                  </SelectItem>
                                  <SelectItem value="referenceGlobalMaster">
                                    Reference Global Master
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {optionsSourceMode === 'coverSelection' ? (
                              <div className="space-y-2">
                                <p className="text-xs text-muted-foreground">
                                  Options will be populated automatically from this product&apos;s
                                  covers.
                                </p>
                              </div>
                            ) : optionsSourceMode === 'globalMaster' ||
                              optionsSourceMode === 'referenceGlobalMaster' ? (
                              <div className="space-y-3">
                                {/* Step 1: Select Global Master */}
                                <div className="space-y-2">
                                  <Label>Step 1: Select Global Master</Label>
                                  <SearchableGlobalMasterSelect
                                    masters={globalMasters as GlobalMasterLite[]}
                                    value={selectedGlobalMaster?.id || ''}
                                    loading={isLoadingGlobalMasters}
                                    onChange={(masterId) => {
                                      const master = globalMasters.find((m) => m.id === masterId);
                                      if (master) {
                                        setFieldConfig({
                                          ...fieldConfig,
                                          options: undefined,
                                          globalMasterKey: undefined,
                                          defaultValue: undefined,
                                          metadata: {
                                            ...(fieldConfig.metadata || {}),
                                            globalMasterId: undefined,
                                            selectedMasterValues: undefined,
                                            optionsSourceMode,
                                          },
                                        });
                                        setOptionsInput('');
                                        setSelectedGlobalMaster(master);
                                        // Pre-select all values by default
                                        const allValues = (master.values || []).map(
                                          (v) => v.valueLabel,
                                        );
                                        setSelectedMasterValues(new Set(allValues));
                                      }
                                    }}
                                  />
                                </div>

                                {/* Step 2: Select specific values */}
                                {optionsSourceMode === 'globalMaster' && selectedGlobalMaster && (
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <Label>
                                        Step 2: Select Values ({selectedMasterValues.size} selected)
                                      </Label>
                                      <div className="flex gap-2">
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            const allValues = (
                                              selectedGlobalMaster.values || []
                                            ).map((v) => v.valueLabel);
                                            setSelectedMasterValues(new Set(allValues));
                                          }}
                                        >
                                          Select All
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => setSelectedMasterValues(new Set())}
                                        >
                                          Clear
                                        </Button>
                                      </div>
                                    </div>
                                    <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1">
                                      {(selectedGlobalMaster.values || [])
                                        .slice()
                                        .sort((a, b) =>
                                          (a.valueLabel || '').localeCompare(b.valueLabel || ''),
                                        )
                                        .map((value) => (
                                          <label
                                            key={value.id}
                                            className="flex items-center gap-2 p-1 hover:bg-muted rounded cursor-pointer"
                                          >
                                            <Checkbox
                                              checked={selectedMasterValues.has(value.valueLabel)}
                                              onCheckedChange={(checked) => {
                                                const newSet = new Set(selectedMasterValues);
                                                if (checked) {
                                                  newSet.add(value.valueLabel);
                                                } else {
                                                  newSet.delete(value.valueLabel);
                                                }
                                                setSelectedMasterValues(newSet);
                                              }}
                                            />
                                            <span className="text-sm">{value.valueLabel}</span>
                                          </label>
                                        ))}
                                    </div>

                                    {/* Apply Button */}
                                    <Button
                                      type="button"
                                      size="sm"
                                      className="w-full"
                                      disabled={
                                        selectedMasterValues.size === 0 ||
                                        isApplyingFieldSelection ||
                                        (fieldConfig.metadata &&
                                          typeof (fieldConfig.metadata as Record<string, unknown>)
                                            .optionsSourceMode === 'string' &&
                                          String(
                                            (fieldConfig.metadata as Record<string, unknown>)
                                              .optionsSourceMode,
                                          ) === 'globalMaster' &&
                                          typeof (fieldConfig.metadata as Record<string, unknown>)
                                            .globalMasterId === 'string' &&
                                          String(
                                            (fieldConfig.metadata as Record<string, unknown>)
                                              .globalMasterId,
                                          ) === selectedGlobalMaster?.id &&
                                          matchesAppliedSelection(
                                            (fieldConfig.metadata as Record<string, unknown>)
                                              .selectedMasterValues,
                                            selectedMasterValues as Set<string>,
                                          ))
                                      }
                                      onClick={() => {
                                        startApplyingFieldSelection(() => {
                                          const appliedSelectedValues = Array.from(
                                            selectedMasterValues as Set<string>,
                                          ).sort((a, b) => String(a).localeCompare(String(b)));
                                          const optionValues = Array.from(
                                            selectedMasterValues as Set<string>,
                                          );
                                          setFieldConfig({
                                            ...fieldConfig,
                                            optionsUrl: undefined,
                                            options: optionValues
                                              .slice()
                                              .sort((a, b) => String(a).localeCompare(String(b))),
                                            globalMasterKey: selectedGlobalMaster?.masterKey,
                                            metadata: {
                                              ...(fieldConfig.metadata || {}),
                                              globalMasterId: selectedGlobalMaster?.id,
                                              selectedMasterValues: appliedSelectedValues,
                                              optionsSourceMode: 'globalMaster',
                                            },
                                          });
                                          setOptionsInput(optionValues.join(', '));
                                        });
                                      }}
                                    >
                                      {isApplyingFieldSelection && (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      )}
                                      {isApplyingFieldSelection
                                        ? 'Applying Selection...'
                                        : 'Apply Selection'}
                                    </Button>
                                  </div>
                                )}

                                {optionsSourceMode === 'referenceGlobalMaster' &&
                                  selectedGlobalMaster && (
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <Label>
                                          Select Values ({selectedMasterValues.size} selected)
                                        </Label>
                                        <div className="flex gap-2">
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                              const allValues = (
                                                selectedGlobalMaster.values || []
                                              ).map((v) => v.valueLabel);
                                              setSelectedMasterValues(new Set(allValues));
                                            }}
                                          >
                                            Select All
                                          </Button>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSelectedMasterValues(new Set())}
                                          >
                                            Clear
                                          </Button>
                                        </div>
                                      </div>
                                      <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1">
                                        {(selectedGlobalMaster.values || []).map((value) => (
                                          <label
                                            key={value.id}
                                            className="flex items-center gap-2 p-1 hover:bg-muted rounded cursor-pointer"
                                          >
                                            <Checkbox
                                              checked={selectedMasterValues.has(value.valueLabel)}
                                              onCheckedChange={(checked) => {
                                                const newSet = new Set(selectedMasterValues);
                                                if (checked) {
                                                  newSet.add(value.valueLabel);
                                                } else {
                                                  newSet.delete(value.valueLabel);
                                                }
                                                setSelectedMasterValues(newSet);
                                              }}
                                            />
                                            <span className="text-sm">{value.valueLabel}</span>
                                          </label>
                                        ))}
                                      </div>
                                      <Button
                                        type="button"
                                        size="sm"
                                        className="w-full"
                                        variant={
                                          fieldConfig.metadata &&
                                          typeof (fieldConfig.metadata as Record<string, unknown>)
                                            .optionsSourceMode === 'string' &&
                                          String(
                                            (fieldConfig.metadata as Record<string, unknown>)
                                              .optionsSourceMode,
                                          ) === 'referenceGlobalMaster' &&
                                          typeof (fieldConfig.metadata as Record<string, unknown>)
                                            .globalMasterId === 'string' &&
                                          String(
                                            (fieldConfig.metadata as Record<string, unknown>)
                                              .globalMasterId,
                                          ) === selectedGlobalMaster.id &&
                                          typeof (fieldConfig as Record<string, unknown>)
                                            .globalMasterKey === 'string' &&
                                          String(
                                            (fieldConfig as Record<string, unknown>)
                                              .globalMasterKey,
                                          ) === selectedGlobalMaster.masterKey &&
                                          matchesAppliedSelection(
                                            (fieldConfig.metadata as Record<string, unknown>)
                                              .selectedMasterValues,
                                            selectedMasterValues as Set<string>,
                                          )
                                            ? 'secondary'
                                            : 'default'
                                        }
                                        disabled={
                                          selectedMasterValues.size === 0 ||
                                          (fieldConfig.metadata &&
                                            typeof (fieldConfig.metadata as Record<string, unknown>)
                                              .optionsSourceMode === 'string' &&
                                            String(
                                              (fieldConfig.metadata as Record<string, unknown>)
                                                .optionsSourceMode,
                                            ) === 'referenceGlobalMaster' &&
                                            typeof (fieldConfig.metadata as Record<string, unknown>)
                                              .globalMasterId === 'string' &&
                                            String(
                                              (fieldConfig.metadata as Record<string, unknown>)
                                                .globalMasterId,
                                            ) === selectedGlobalMaster.id &&
                                            typeof (fieldConfig as Record<string, unknown>)
                                              .globalMasterKey === 'string' &&
                                            String(
                                              (fieldConfig as Record<string, unknown>)
                                                .globalMasterKey,
                                            ) === selectedGlobalMaster.masterKey &&
                                            Array.isArray(
                                              (fieldConfig.metadata as Record<string, unknown>)
                                                ?.selectedMasterValues,
                                            ) &&
                                            (
                                              (fieldConfig.metadata as Record<string, unknown>)
                                                .selectedMasterValues as string[]
                                            ).length === selectedMasterValues.size &&
                                            (
                                              (fieldConfig.metadata as Record<string, unknown>)
                                                .selectedMasterValues as string[]
                                            ).every((v) => selectedMasterValues.has(v)))
                                        }
                                        onClick={() => {
                                          const masterValues = selectedGlobalMaster.values || [];
                                          // Sort selected values by their position in the master list
                                          const selectedValues = Array.from(
                                            selectedMasterValues as Set<string>,
                                          ).sort((a, b) => {
                                            const idxA = masterValues.findIndex(
                                              (mv) => mv.valueLabel === a,
                                            );
                                            const idxB = masterValues.findIndex(
                                              (mv) => mv.valueLabel === b,
                                            );
                                            return (
                                              (idxA === -1 ? Number.MAX_SAFE_INTEGER : idxA) -
                                              (idxB === -1 ? Number.MAX_SAFE_INTEGER : idxB)
                                            );
                                          });
                                          // Build proper option objects preserving master value codes
                                          const optionObjects = selectedValues.map((label, idx) => {
                                            const masterVal = masterValues.find(
                                              (mv) => mv.valueLabel === label,
                                            );
                                            return {
                                              label: masterVal?.valueLabel || label,
                                              value:
                                                masterVal?.valueCode ||
                                                masterVal?.valueLabel ||
                                                label,
                                              sortOrder: masterVal
                                                ? masterValues.indexOf(masterVal) + 1
                                                : idx + 1,
                                            };
                                          });
                                          setFieldConfig({
                                            ...fieldConfig,
                                            optionsUrl: undefined,
                                            options:
                                              optionObjects.length > 0 ? optionObjects : undefined,
                                            globalMasterKey: selectedGlobalMaster.masterKey,
                                            metadata: {
                                              ...(fieldConfig.metadata || {}),
                                              globalMasterId: selectedGlobalMaster.id,
                                              optionsSourceMode: 'referenceGlobalMaster',
                                              selectedMasterValues: selectedValues,
                                            },
                                          });
                                          toast({
                                            title: 'Success',
                                            description: `Field is now referencing ${selectedGlobalMaster.displayLabel}.`,
                                          });
                                        }}
                                      >
                                        {fieldConfig.metadata &&
                                        typeof (fieldConfig.metadata as Record<string, unknown>)
                                          .optionsSourceMode === 'string' &&
                                        String(
                                          (fieldConfig.metadata as Record<string, unknown>)
                                            .optionsSourceMode,
                                        ) === 'referenceGlobalMaster' &&
                                        typeof (fieldConfig.metadata as Record<string, unknown>)
                                          .globalMasterId === 'string' &&
                                        String(
                                          (fieldConfig.metadata as Record<string, unknown>)
                                            .globalMasterId,
                                        ) === selectedGlobalMaster.id &&
                                        typeof (fieldConfig as Record<string, unknown>)
                                          .globalMasterKey === 'string' &&
                                        String(
                                          (fieldConfig as Record<string, unknown>).globalMasterKey,
                                        ) === selectedGlobalMaster.masterKey &&
                                        matchesAppliedSelection(
                                          (fieldConfig.metadata as Record<string, unknown>)
                                            .selectedMasterValues,
                                          selectedMasterValues as Set<string>,
                                        )
                                          ? 'Referenced'
                                          : 'Update Global Master'}
                                      </Button>
                                    </div>
                                  )}

                                {/* Success confirmation */}
                                {fieldConfig.options &&
                                  fieldConfig.options.length > 0 &&
                                  optionsSourceMode === 'globalMaster' && (
                                    <p className="text-xs text-green-600">
                                      ✓ Applied {fieldConfig.options.length} options:{' '}
                                      {fieldConfig.options
                                        .map((option) => getOptionDisplayValue(option))
                                        .filter((option) => option !== '')
                                        .slice(0, 3)
                                        .join(', ')}
                                      {fieldConfig.options.length > 3 ? '...' : ''}
                                    </p>
                                  )}
                              </div>
                            ) : fieldConfig.optionsUrl !== undefined ? (
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
                                <Label>Options</Label>
                                <p className="text-xs text-muted-foreground">
                                  Add options by typing and pressing Enter.
                                </p>
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="Type option and press Enter"
                                    className="text-sm h-8"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const input = e.currentTarget;
                                        const value = input.value.trim();
                                        if (
                                          value &&
                                          !(fieldConfig.options || []).some(
                                            (opt) =>
                                              (typeof opt === 'string' ? opt : opt?.label) ===
                                              value,
                                          )
                                        ) {
                                          const nextOptions = [...(fieldConfig.options || []), value].sort(
                                            (a, b) => {
                                              const vA =
                                                typeof a === 'string' ? a : a?.label || '';
                                              const vB =
                                                typeof b === 'string' ? b : b?.label || '';
                                              return vA.localeCompare(vB);
                                            },
                                          );
                                          setFieldConfig({
                                            ...fieldConfig,
                                            options: nextOptions,
                                          });
                                          setFieldStaticOptionIds(
                                            createStableOptionIds(nextOptions.length, 'field-opt'),
                                          );
                                          input.value = '';
                                        }
                                      }
                                    }}
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-2"
                                    onClick={(e) => {
                                      const input = e.currentTarget
                                        .previousElementSibling as HTMLInputElement;
                                      const value = input?.value?.trim();
                                      if (
                                        value &&
                                        !(fieldConfig.options || []).some(
                                          (opt) =>
                                            (typeof opt === 'string' ? opt : opt?.label) === value,
                                        )
                                      ) {
                                        const nextOptions = [...(fieldConfig.options || []), value].sort(
                                          (a, b) => {
                                            const vA = typeof a === 'string' ? a : a?.label || '';
                                            const vB = typeof b === 'string' ? b : b?.label || '';
                                            return vA.localeCompare(vB);
                                          },
                                        );
                                        setFieldConfig({
                                          ...fieldConfig,
                                          options: nextOptions,
                                        });
                                        setFieldStaticOptionIds(
                                          createStableOptionIds(nextOptions.length, 'field-opt'),
                                        );
                                        input.value = '';
                                      }
                                    }}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="flex flex-col gap-2 mt-2 mb-2 w-full">
                                  {fieldConfig.options && fieldConfig.options.length > 1 && (
                                    <div className="flex justify-start gap-2 mb-1">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() => {
                                          const sorted = [...(fieldConfig.options || [])].sort(
                                            (a, b) => {
                                              const valA =
                                                typeof a === 'string' ? a : a?.label || '';
                                              const valB =
                                                typeof b === 'string' ? b : b?.label || '';
                                              return valA.localeCompare(valB);
                                            },
                                          );
                                          setFieldConfig({ ...fieldConfig, options: sorted });
                                          setFieldStaticOptionIds(
                                            createStableOptionIds(sorted.length, 'field-opt'),
                                          );
                                        }}
                                      >
                                        Sort A-Z
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() => {
                                          const sorted = [...(fieldConfig.options || [])].sort(
                                            (a, b) => {
                                              const valA =
                                                typeof a === 'string' ? a : a?.label || '';
                                              const valB =
                                                typeof b === 'string' ? b : b?.label || '';
                                              return valB.localeCompare(valA);
                                            },
                                          );
                                          setFieldConfig({ ...fieldConfig, options: sorted });
                                          setFieldStaticOptionIds(
                                            createStableOptionIds(sorted.length, 'field-opt'),
                                          );
                                        }}
                                      >
                                        Sort Z-A
                                      </Button>
                                    </div>
                                  )}
                                  <div className="w-full relative">
                                    {(fieldConfig.options || []).map((option, idx) => {
                                      const stableId =
                                        fieldStaticOptionIds[idx] || `field-opt-fallback-${idx}`;
                                      const isDragging =
                                        activeDragItem?.scope === 'fieldStatic' &&
                                        activeDragItem.index === idx;
                                      const isDragOver =
                                        dragOverItem?.scope === 'fieldStatic' &&
                                        dragOverItem.index === idx;
                                      return (
                                        <div
                                          key={stableId}
                                          className={cn(
                                            'mb-2 rounded-md bg-background transition-all',
                                            isDragging && 'opacity-60 shadow-lg',
                                            isDragOver && !isDragging && 'ring-2 ring-primary/30 border border-primary/20',
                                          )}
                                          onDragOver={(event) =>
                                            handleDragOverItem(event, 'fieldStatic', idx)
                                          }
                                          onDrop={(event) => handleDropItem(event, 'fieldStatic', idx)}
                                        >
                                          <div className="flex items-center gap-2">
                                            <div
                                              draggable
                                              onDragStart={(event) => startDrag(event, 'fieldStatic', idx)}
                                              onDragEnd={handleDragEnd}
                                              className={cn(
                                                'flex cursor-grab items-center rounded border border-border/60 bg-muted/30 px-2 py-2 transition-colors',
                                                isDragging && 'cursor-grabbing bg-primary/10 text-primary',
                                              )}
                                            >
                                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <Input
                                              value={
                                                typeof option === 'string'
                                                  ? option
                                                  : option?.label || ''
                                              }
                                              className="h-8 text-sm"
                                              onChange={(e) => {
                                                updateOptionAtIndex(
                                                  'fieldStatic',
                                                  fieldConfig.options,
                                                  idx,
                                                  e.target.value,
                                                  (nextOptions) =>
                                                    setFieldConfig({
                                                      ...fieldConfig,
                                                      options: nextOptions,
                                                    }),
                                                );
                                              }}
                                              onBlur={() =>
                                                clearOptionEditError('fieldStatic', idx)
                                              }
                                            />
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              className="h-8 px-2 text-destructive hover:text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200 cursor-pointer"
                                              onClick={() => {
                                                const nextOptions = (fieldConfig.options || []).filter(
                                                  (_, i) => i !== idx,
                                                );
                                                const hasOther = nextOptions.some(
                                                  (o) =>
                                                    (typeof o === 'string' ? o : o?.label)?.toLowerCase() ===
                                                    'other',
                                                );
                                                const nextMeta = {
                                                  ...(fieldConfig.metadata || {}),
                                                };
                                                if (!hasOther) delete nextMeta.allowOther;
                                                clearOptionEditError('fieldStatic', idx);
                                                setFieldConfig({
                                                  ...fieldConfig,
                                                  options: nextOptions.length > 0 ? nextOptions : undefined,
                                                  metadata:
                                                    Object.keys(nextMeta).length > 0
                                                      ? nextMeta
                                                      : undefined,
                                                });
                                                setFieldStaticOptionIds((current) =>
                                                  current.filter((_, i) => i !== idx),
                                                );
                                              }}
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </div>
                                          {optionEditError?.scope === 'fieldStatic' &&
                                            optionEditError.index === idx && (
                                              <p className="mt-1 text-xs text-destructive">
                                                {optionEditError.message}
                                              </p>
                                            )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                {fieldBlankOptionIndexes.length > 0 && (
                                  <p className="text-xs text-destructive">
                                    Option name is required and cannot be blank.
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                            {fieldConfig.type === 'dropdown' && (
                                <div className="flex items-center gap-2 pt-1">
                                  <Checkbox
                                    checked={String(fieldConfig.metadata?.allowOther) === 'true'}
                                    onCheckedChange={(checked) => {
                                      const nextMeta: Record<string, unknown> = {
                                        ...(fieldConfig.metadata || {}),
                                      };
                                      if (checked) {
                                        nextMeta.allowOther = 'true';
                                      } else {
                                        delete nextMeta.allowOther;
                                      }
                                      setFieldConfig({
                                        ...fieldConfig,
                                        metadata:
                                          Object.keys(nextMeta).length > 0 ? nextMeta : undefined,
                                      });
                                    }}
                                  />
                                  <Label>Allow Other (free text)</Label>
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
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="space-y-2 flex justify-start"
                    onClick={() => {
                      setConditionalLogicTarget('field');
                      setIsConditionalLogicDialogOpen(true);
                    }}
                  >
                    <GitBranch className="mr-2 h-4 w-4" />
                    Configure Conditional Logic
                  </Button>
                </div>

              {onOpenFieldApiIntegration && (
                <div className="space-y-2 border-t pt-4">
                  <Label>API Integration</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="space-y-2 flex justify-start"
                    onClick={() => {
                      if (fieldConfig?.id || fieldConfig?.name) {
                        onOpenFieldApiIntegration(fieldConfig.id || fieldConfig.name);
                      }
                    }}
                  >
                    <Unplug className="mr-2 h-4 w-4" />
                    Configure API Integration
                  </Button>
                  {fieldIntegrationCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {fieldIntegrationCount} integration{fieldIntegrationCount > 1 ? 's' : ''} configured
                    </Badge>
                  )}
                </div>
              )}

                {shouldShowFieldCustomerNameToggle && (
                  <div className="space-y-2">
                    <Label>Customer Name Field</Label>
                    <div className="flex items-center gap-3 rounded-lg border bg-background p-3">
                      <Switch
                        checked={
                          fieldConfig.metadata?.isCustomerName === true ||
                          String(fieldConfig.metadata?.isCustomerName).toLowerCase() === 'true'
                        }
                        disabled={isFieldCustomerNameToggleDisabled}
                        onCheckedChange={(checked) =>
                          setFieldConfig({
                            ...fieldConfig,
                            metadata: {
                              ...(fieldConfig.metadata || {}),
                              isCustomerName: checked,
                            },
                          })
                        }
                      />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Mark this as the customer name</p>
                        <p className="text-xs text-muted-foreground">
                          {isFieldCustomerNameToggleDisabled
                            ? 'This field is already mapped as the customer name and cannot be changed here.'
                            : 'Only one text field in the full customer template can use this setting.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {/* Preview & Validations */}
              <div className="space-y-6 border-t pt-6">
                {/* Field Preview Card */}
                <div className="border rounded-lg bg-background shadow-sm">
                  <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b">
                    <div>
                      <h3 className="text-sm font-semibold tracking-tight">Field Preview</h3>
                      <p className="text-xs text-muted-foreground">
                        Preview how this field will appear in the form
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                      Preview
                    </Badge>
                  </div>
                  <div className="p-4">
                    {fieldConfig.label ? (
                      <div key={`preview-${fieldConfig.type}`}>
                        {renderFieldPreview({
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
                          subFields:
                            subFieldsConfig && subFieldsConfig.length > 0
                              ? subFieldsConfig
                              : fieldConfig.subFields,
                          combinationRowLabels: maximizeRowsEnabled
                            ? undefined
                            : combinationRowLabels && combinationRowLabels.length > 0
                              ? combinationRowLabels
                              : fieldConfig.combinationRowLabels,
                          fromDateLabel: fieldConfig.fromDateLabel,
                          toDateLabel: fieldConfig.toDateLabel,
                          periodCalculationUnit: fieldConfig.periodCalculationUnit,
                          autoCalculatePeriod: fieldConfig.autoCalculatePeriod,
                          note: fieldConfig.note,
                          metadata: {
                            ...(fieldConfig.metadata || {}),
                            maximizeAdditionOfRows: maximizeRowsEnabled,
                            maximumRowCount:
                              maximizeRowsEnabled && maximumRowCountValue.trim() !== ''
                                ? Number(maximumRowCountValue)
                                : undefined,
                          },
                        } as Field)}
                      </div>
                    ) : (
                      <div className="p-6 text-center text-muted-foreground border border-dashed rounded-lg">
                        <p className="text-sm">Enter a field label to see preview</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Validations Section */}
                {hasFieldValidationRules && (
                  <div className="pt-2">
                    <div className="space-y-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border shadow-sm">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold tracking-tight">Validations</h3>
                          <Badge
                            variant="outline"
                            className="text-[10px] uppercase tracking-wide bg-background/60"
                          >
                            Rules
                          </Badge>
                        </div>
                      </div>
                      {(fieldConfig.type === 'text' || fieldConfig.type === 'textarea') && (
                        <div className="space-y-3 p-4 border rounded-lg bg-background">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm">Min Characters</Label>
                              <Input
                                type="number"
                                min="1"
                                disabled={hasFormat}
                                placeholder="e.g., 3"
                                value={
                                  fieldConfig.validations?.find((v) => v.type === 'minLength')
                                    ?.value != null
                                    ? String(
                                        fieldConfig.validations.find((v) => v.type === 'minLength')!
                                          .value,
                                      )
                                    : ''
                                }
                                onChange={(e) => {
                                  setMinMaxCharacterError(null);
                                  const val = e.target.value;
                                  const validations = fieldConfig.validations || [];
                                  const existing = validations.findIndex(
                                    (v) => v.type === 'minLength',
                                  );
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
                            <div className="space-y-2">
                              <Label className="text-sm">Max Characters</Label>
                              <Input
                                type="number"
                                min="1"
                                disabled={hasFormat}
                                placeholder="e.g., 100"
                                value={
                                  fieldConfig.validations?.find((v) => v.type === 'maxLength')
                                    ?.value != null
                                    ? String(
                                        fieldConfig.validations.find((v) => v.type === 'maxLength')!
                                          .value,
                                      )
                                    : ''
                                }
                                onChange={(e) => {
                                  setMinMaxCharacterError(null);
                                  const val = e.target.value;
                                  const validations = fieldConfig.validations || [];
                                  const existing = validations.findIndex(
                                    (v) => v.type === 'maxLength',
                                  );
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
                          </div>
                          {minMaxCharacterError && (
                            <p className="text-xs text-destructive mt-2">{minMaxCharacterError}</p>
                          )}
                          <div className="space-y-2">
                            <Label className="text-sm">Format</Label>
                            <Select
                              disabled={hasMinOrMax}
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
                                fieldConfig.validations?.find((v) => v.type === 'pattern')?.value ||
                                ''
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

                      {fieldConfig.type === 'number' &&
                        (() => {
                          const isPhoneNumber =
                            fieldConfig.metadata?.numberFormat === 'phoneNumber';
                          const minType = isPhoneNumber ? 'minLength' : 'min';
                          const maxType = isPhoneNumber ? 'maxLength' : 'max';
                          return (
                            <div className="space-y-3 p-4 border rounded-lg bg-background">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label className="text-sm">
                                    {isPhoneNumber ? 'Min Length' : 'Min Value'}
                                  </Label>
                                  <Input
                                    type="number"
                                    step={isPhoneNumber ? '1' : 'any'}
                                    min={isPhoneNumber ? 0 : undefined}
                                    placeholder={isPhoneNumber ? 'e.g., 7' : 'e.g., 0'}
                                    value={
                                      fieldConfig.validations?.find((v) => v.type === minType)
                                        ?.value != null
                                        ? String(
                                            fieldConfig.validations.find((v) => v.type === minType)!
                                              .value,
                                          )
                                        : ''
                                    }
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      let validations = [...(fieldConfig.validations || [])];
                                      const stripOther = () => {
                                        validations = isPhoneNumber
                                          ? validations.filter(
                                              (v) => v.type !== 'min' && v.type !== 'max',
                                            )
                                          : validations.filter(
                                              (v) =>
                                                v.type !== 'minLength' && v.type !== 'maxLength',
                                            );
                                      };
                                      const existing = validations.findIndex(
                                        (v) => v.type === minType,
                                      );
                                      if (isPhoneNumber) setMinMaxCharacterError(null);
                                      if (val === '' || val === '-') {
                                        if (existing >= 0) {
                                          validations.splice(existing, 1);
                                        }
                                        stripOther();
                                        setFieldConfig({ ...fieldConfig, validations });
                                        return;
                                      }
                                      const numVal = isPhoneNumber
                                        ? parseInt(val, 10)
                                        : Number(val);
                                      const isValidForPhone = !isPhoneNumber || numVal >= 0;
                                      if (!isNaN(numVal) && val !== '' && isValidForPhone) {
                                        if (existing >= 0) {
                                          validations[existing] = {
                                            type: minType,
                                            value: numVal,
                                          };
                                        } else {
                                          validations.push({
                                            type: minType,
                                            value: numVal,
                                          });
                                        }
                                        stripOther();
                                        setFieldConfig({ ...fieldConfig, validations });
                                      }
                                    }}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm">
                                    {isPhoneNumber ? 'Max Length' : 'Max Value'}
                                  </Label>
                                  <Input
                                    type="number"
                                    step={isPhoneNumber ? '1' : 'any'}
                                    min={isPhoneNumber ? 0 : undefined}
                                    placeholder={isPhoneNumber ? 'e.g., 15' : 'e.g., 100'}
                                    value={
                                      fieldConfig.validations?.find((v) => v.type === maxType)
                                        ?.value != null
                                        ? String(
                                            fieldConfig.validations.find((v) => v.type === maxType)!
                                              .value,
                                          )
                                        : ''
                                    }
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      let validations = [...(fieldConfig.validations || [])];
                                      const stripOther = () => {
                                        validations = isPhoneNumber
                                          ? validations.filter(
                                              (v) => v.type !== 'min' && v.type !== 'max',
                                            )
                                          : validations.filter(
                                              (v) =>
                                                v.type !== 'minLength' && v.type !== 'maxLength',
                                            );
                                      };
                                      const existing = validations.findIndex(
                                        (v) => v.type === maxType,
                                      );
                                      if (val && val !== '' && !isNaN(Number(val))) {
                                        const numVal = isPhoneNumber
                                          ? parseInt(val, 10)
                                          : parseFloat(val);
                                        const isValidForPhone = !isPhoneNumber || numVal >= 0;
                                        if (isValidForPhone) {
                                          if (existing >= 0) {
                                            validations[existing] = {
                                              type: maxType,
                                              value: numVal,
                                            };
                                          } else {
                                            validations.push({
                                              type: maxType,
                                              value: numVal,
                                            });
                                          }
                                        }
                                      } else if (existing >= 0) {
                                        validations.splice(existing, 1);
                                      }
                                      stripOther();
                                      setFieldConfig({ ...fieldConfig, validations });
                                    }}
                                  />
                                </div>
                              </div>
                              {isPhoneNumber
                                ? minMaxCharacterError && (
                                    <p className="text-sm text-destructive mt-2">
                                      {minMaxCharacterError}
                                    </p>
                                  )
                                : minMaxError && (
                                    <p className="text-sm text-destructive mt-2">{minMaxError}</p>
                                  )}
                              <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                  <Label className="text-sm">Integer Only</Label>
                                  <p className="text-xs text-muted-foreground">No decimal values</p>
                                </div>
                                <Switch
                                  checked={
                                    fieldConfig.validations?.some((v) => v.type === 'integer') ||
                                    false
                                  }
                                  onCheckedChange={(checked) => {
                                    const validations = fieldConfig.validations || [];
                                    if (checked) {
                                      const decimalIndex = validations.findIndex(
                                        (v) => v.type === 'decimalPlaces',
                                      );
                                      if (decimalIndex >= 0) {
                                        validations.splice(decimalIndex, 1);
                                      }
                                      if (!validations.some((v) => v.type === 'integer')) {
                                        validations.push({ type: 'integer' });
                                      }
                                    } else {
                                      const integerIndex = validations.findIndex(
                                        (v) => v.type === 'integer',
                                      );
                                      if (integerIndex >= 0) {
                                        validations.splice(integerIndex, 1);
                                      }
                                    }
                                    setFieldConfig({ ...fieldConfig, validations });
                                  }}
                                  disabled={fieldConfig.validations?.some(
                                    (v) => v.type === 'decimalPlaces' && (v.value ?? 0) > 0,
                                  )}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm">Decimal Places</Label>
                                <Input
                                  type="number"
                                  placeholder="e.g., 2"
                                  min="0"
                                  max="10"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  onKeyDown={(e) => {
                                    if (['e', 'E', '+', '-', '.', ','].includes(e.key)) {
                                      e.preventDefault();
                                    }
                                  }}
                                  disabled={fieldConfig.validations?.some(
                                    (v) => v.type === 'integer',
                                  )}
                                  value={
                                    fieldConfig.validations?.find((v) => v.type === 'decimalPlaces')
                                      ?.value != null
                                      ? String(
                                          fieldConfig.validations.find(
                                            (v) => v.type === 'decimalPlaces',
                                          )!.value,
                                        )
                                      : ''
                                  }
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const validations = fieldConfig.validations || [];
                                    const integerIndex = validations.findIndex(
                                      (v) => v.type === 'integer',
                                    );
                                    if (integerIndex >= 0) {
                                      validations.splice(integerIndex, 1);
                                    }
                                    const existing = validations.findIndex(
                                      (v) => v.type === 'decimalPlaces',
                                    );
                                    if (val === '' || val === '0') {
                                      if (existing >= 0) {
                                        validations.splice(existing, 1);
                                      }
                                    } else if (!isNaN(Number(val))) {
                                      const numVal = parseInt(val, 10);
                                      if (existing >= 0) {
                                        validations[existing] = {
                                          type: 'decimalPlaces',
                                          value: numVal,
                                        };
                                      } else {
                                        validations.push({
                                          type: 'decimalPlaces',
                                          value: numVal,
                                        });
                                      }
                                    }
                                    setFieldConfig({ ...fieldConfig, validations });
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })()}

                      {fieldConfig.type === 'date' && (
                        <div className="space-y-3 p-4 border rounded-lg bg-background">
                          {(() => {
                            // Determine which validation group is currently active
                            const hasMinDateToday = fieldConfig.validations?.some(
                              (v) => v.type === 'minDateToday',
                            );
                            const hasMaxDateToday = fieldConfig.validations?.some(
                              (v) => v.type === 'maxDateToday',
                            );
                            const hasDaysFromToday = fieldConfig.validations?.some((v) =>
                              ['minDaysFromToday', 'maxDaysFromToday'].includes(v.type),
                            );
                            const hasFixedDate = fieldConfig.validations?.some((v) =>
                              ['minDate', 'maxDate'].includes(v.type),
                            );
                            const anyValidationActive =
                              hasMinDateToday ||
                              hasMaxDateToday ||
                              hasDaysFromToday ||
                              hasFixedDate;

                            return (
                              <>
                                <div className="flex items-center justify-between">
                                  <div className="space-y-0.5">
                                    <Label className="text-sm">Must be today or later</Label>
                                    <p className="text-xs text-muted-foreground">
                                      Date cannot be in the past
                                    </p>
                                  </div>
                                  <Switch
                                    disabled={anyValidationActive && !hasMinDateToday}
                                    checked={hasMinDateToday || false}
                                    onCheckedChange={(checked) => {
                                      const validations = fieldConfig.validations || [];
                                      if (checked) {
                                        // Clear all other date validations
                                        const filtered = validations.filter(
                                          (v) =>
                                            ![
                                              'minDateToday',
                                              'maxDateToday',
                                              'minDaysFromToday',
                                              'maxDaysFromToday',
                                              'minDate',
                                              'maxDate',
                                            ].includes(v.type),
                                        );
                                        filtered.push({ type: 'minDateToday' });
                                        setFieldConfig({ ...fieldConfig, validations: filtered });
                                      } else {
                                        const filtered = validations.filter(
                                          (v) => v.type !== 'minDateToday',
                                        );
                                        setFieldConfig({ ...fieldConfig, validations: filtered });
                                      }
                                    }}
                                  />
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="space-y-0.5">
                                    <Label className="text-sm">Must be today or earlier</Label>
                                    <p className="text-xs text-muted-foreground">
                                      Date cannot be in the future
                                    </p>
                                  </div>
                                  <Switch
                                    disabled={anyValidationActive && !hasMaxDateToday}
                                    checked={hasMaxDateToday || false}
                                    onCheckedChange={(checked) => {
                                      const validations = fieldConfig.validations || [];
                                      if (checked) {
                                        const filtered = validations.filter(
                                          (v) =>
                                            ![
                                              'minDateToday',
                                              'maxDateToday',
                                              'minDaysFromToday',
                                              'maxDaysFromToday',
                                              'minDate',
                                              'maxDate',
                                            ].includes(v.type),
                                        );
                                        filtered.push({ type: 'maxDateToday' });
                                        setFieldConfig({ ...fieldConfig, validations: filtered });
                                      } else {
                                        const filtered = validations.filter(
                                          (v) => v.type !== 'maxDateToday',
                                        );
                                        setFieldConfig({ ...fieldConfig, validations: filtered });
                                      }
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
                                      disabled={anyValidationActive && !hasDaysFromToday}
                                      value={
                                        fieldConfig.validations?.find(
                                          (v) => v.type === 'minDaysFromToday',
                                        )?.value != null
                                          ? String(
                                              fieldConfig.validations.find(
                                                (v) => v.type === 'minDaysFromToday',
                                              )!.value,
                                            )
                                          : ''
                                      }
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        const validations = fieldConfig.validations || [];
                                        if (val && val !== '' && !isNaN(Number(val))) {
                                          if (!hasDaysFromToday && anyValidationActive) {
                                            const filtered = validations.filter(
                                              (v) =>
                                                ![
                                                  'minDateToday',
                                                  'maxDateToday',
                                                  'minDaysFromToday',
                                                  'maxDaysFromToday',
                                                  'minDate',
                                                  'maxDate',
                                                ].includes(v.type),
                                            );
                                            filtered.push({
                                              type: 'minDaysFromToday',
                                              value: parseInt(val, 10),
                                            });
                                            setFieldConfig({
                                              ...fieldConfig,
                                              validations: filtered,
                                            });
                                          } else {
                                            const existing = validations.findIndex(
                                              (v) => v.type === 'minDaysFromToday',
                                            );
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
                                            setFieldConfig({ ...fieldConfig, validations });
                                          }
                                        } else {
                                          const existing = validations.findIndex(
                                            (v) => v.type === 'minDaysFromToday',
                                          );
                                          if (existing >= 0) {
                                            validations.splice(existing, 1);
                                          }
                                          setFieldConfig({ ...fieldConfig, validations });
                                        }
                                      }}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-sm">Max Days from Today</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      placeholder="e.g., 365"
                                      disabled={anyValidationActive && !hasDaysFromToday}
                                      value={
                                        fieldConfig.validations?.find(
                                          (v) => v.type === 'maxDaysFromToday',
                                        )?.value != null
                                          ? String(
                                              fieldConfig.validations.find(
                                                (v) => v.type === 'maxDaysFromToday',
                                              )!.value,
                                            )
                                          : ''
                                      }
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        const validations = fieldConfig.validations || [];
                                        if (val && val !== '' && !isNaN(Number(val))) {
                                          if (!hasDaysFromToday && anyValidationActive) {
                                            const filtered = validations.filter(
                                              (v) =>
                                                ![
                                                  'minDateToday',
                                                  'maxDateToday',
                                                  'minDaysFromToday',
                                                  'maxDaysFromToday',
                                                  'minDate',
                                                  'maxDate',
                                                ].includes(v.type),
                                            );
                                            filtered.push({
                                              type: 'maxDaysFromToday',
                                              value: parseInt(val, 10),
                                            });
                                            setFieldConfig({
                                              ...fieldConfig,
                                              validations: filtered,
                                            });
                                          } else {
                                            const existing = validations.findIndex(
                                              (v) => v.type === 'maxDaysFromToday',
                                            );
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
                                            setFieldConfig({ ...fieldConfig, validations });
                                          }
                                        } else {
                                          const existing = validations.findIndex(
                                            (v) => v.type === 'maxDaysFromToday',
                                          );
                                          if (existing >= 0) {
                                            validations.splice(existing, 1);
                                          }
                                          setFieldConfig({ ...fieldConfig, validations });
                                        }
                                      }}
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label className="text-sm">Min Date</Label>
                                    <DatePicker
                                      disabled={anyValidationActive && !hasFixedDate}
                                      value={
                                        fieldConfig.validations?.find((v) => v.type === 'minDate')
                                          ?.value || ''
                                      }
                                      onChange={(val) => {
                                        const validations = fieldConfig.validations || [];
                                        if (val) {
                                          if (!hasFixedDate && anyValidationActive) {
                                            const filtered = validations.filter(
                                              (v) =>
                                                ![
                                                  'minDateToday',
                                                  'maxDateToday',
                                                  'minDaysFromToday',
                                                  'maxDaysFromToday',
                                                  'minDate',
                                                  'maxDate',
                                                ].includes(v.type),
                                            );
                                            filtered.push({
                                              type: 'minDate',
                                              value: val,
                                            });
                                            setFieldConfig({
                                              ...fieldConfig,
                                              validations: filtered,
                                            });
                                          } else {
                                            const existing = validations.findIndex(
                                              (v) => v.type === 'minDate',
                                            );
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
                                            setFieldConfig({ ...fieldConfig, validations });
                                          }
                                        } else {
                                          const existing = validations.findIndex(
                                            (v) => v.type === 'minDate',
                                          );
                                          if (existing >= 0) {
                                            validations.splice(existing, 1);
                                          }
                                          setFieldConfig({ ...fieldConfig, validations });
                                        }
                                      }}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-sm">Max Date</Label>
                                    <DatePicker
                                      disabled={anyValidationActive && !hasFixedDate}
                                      value={
                                        fieldConfig.validations?.find((v) => v.type === 'maxDate')
                                          ?.value || ''
                                      }
                                      onChange={(val) => {
                                        const validations = fieldConfig.validations || [];
                                        if (val) {
                                          if (!hasFixedDate && anyValidationActive) {
                                            const filtered = validations.filter(
                                              (v) =>
                                                ![
                                                  'minDateToday',
                                                  'maxDateToday',
                                                  'minDaysFromToday',
                                                  'maxDaysFromToday',
                                                  'minDate',
                                                  'maxDate',
                                                ].includes(v.type),
                                            );
                                            filtered.push({
                                              type: 'maxDate',
                                              value: val,
                                            });
                                            setFieldConfig({
                                              ...fieldConfig,
                                              validations: filtered,
                                            });
                                          } else {
                                            const existing = validations.findIndex(
                                              (v) => v.type === 'maxDate',
                                            );
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
                                            setFieldConfig({ ...fieldConfig, validations });
                                          }
                                        } else {
                                          const existing = validations.findIndex(
                                            (v) => v.type === 'maxDate',
                                          );
                                          if (existing >= 0) {
                                            validations.splice(existing, 1);
                                          }
                                          setFieldConfig({ ...fieldConfig, validations });
                                        }
                                      }}
                                    />
                                  </div>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      )}

                      {(fieldConfig.type === 'datePeriod' ||
                        fieldConfig.type === 'policyPeriod') && (
                        <>
                          {/* Date Validations for From Date */}
                          <div className="space-y-3 p-4 border rounded-lg bg-background mt-4">
                            <h4 className="text-sm font-bold mb-3">From Date Validations</h4>
                            {(() => {
                              const hasMinDateToday = fieldConfig.validations?.some(
                                (v) => v.type === 'from_minDateToday',
                              );
                              const hasMaxDateToday = fieldConfig.validations?.some(
                                (v) => v.type === 'from_maxDateToday',
                              );
                              const hasConflictingToMinDateToday = fieldConfig.validations?.some(
                                (v) => v.type === 'to_minDateToday',
                              );
                              const hasConflictingToMaxDateToday = fieldConfig.validations?.some(
                                (v) => v.type === 'to_maxDateToday',
                              );
                              const toMaxDaysCap = getValidationNumberValue(
                                fieldConfig.validations,
                                'to_maxDaysFromToday',
                              );
                              const toMaxDateCap = getValidationStringValue(
                                fieldConfig.validations,
                                'to_maxDate',
                              );
                              const forcedTodayValidation =
                                hasConflictingToMinDateToday
                                  ? 'max'
                                  : hasConflictingToMaxDateToday
                                    ? 'min'
                                    : null;
                              const hasDaysFromToday = fieldConfig.validations?.some((v) =>
                                ['from_minDaysFromToday', 'from_maxDaysFromToday'].includes(v.type),
                              );
                              const hasFixedDate = fieldConfig.validations?.some((v) =>
                                ['from_minDate', 'from_maxDate'].includes(v.type),
                              );
                              const anyValidationActive =
                                hasMinDateToday ||
                                hasMaxDateToday ||
                                hasDaysFromToday ||
                                hasFixedDate;

                              return (
                                <>
                                  <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                      <Label className="text-sm">Must be today or later</Label>
                                      <p className="text-xs text-muted-foreground">
                                        From date cannot be in the past
                                      </p>
                                    </div>
                                    <Switch
                                      disabled={
                                        forcedTodayValidation === 'max' ||
                                        (anyValidationActive && !hasMinDateToday) ||
                                        !!hasConflictingToMaxDateToday
                                      }
                                      checked={hasMinDateToday || false}
                                      onCheckedChange={(checked) => {
                                        const validations = fieldConfig.validations || [];
                                        if (checked) {
                                          const filtered = filterValidationTypes(validations, [
                                            ...FROM_DATE_VALIDATION_TYPES,
                                            'to_maxDateToday',
                                          ]);
                                          filtered.push({ type: 'from_minDateToday' });
                                          setFieldConfig({ ...fieldConfig, validations: filtered });
                                        } else {
                                          const filtered = validations.filter(
                                            (v) => v.type !== 'from_minDateToday',
                                          );
                                          setFieldConfig({ ...fieldConfig, validations: filtered });
                                        }
                                      }}
                                    />
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                      <Label className="text-sm">Must be today or earlier</Label>
                                      <p className="text-xs text-muted-foreground">
                                        From date cannot be in the future
                                      </p>
                                    </div>
                                    <Switch
                                      disabled={
                                        forcedTodayValidation === 'min' ||
                                        (anyValidationActive && !hasMaxDateToday) ||
                                        !!hasConflictingToMinDateToday
                                      }
                                      checked={hasMaxDateToday || false}
                                      onCheckedChange={(checked) => {
                                        const validations = fieldConfig.validations || [];
                                        if (checked) {
                                          const filtered = filterValidationTypes(validations, [
                                            ...FROM_DATE_VALIDATION_TYPES,
                                            'to_minDateToday',
                                          ]);
                                          filtered.push({ type: 'from_maxDateToday' });
                                          setFieldConfig({ ...fieldConfig, validations: filtered });
                                        } else {
                                          const filtered = validations.filter(
                                            (v) => v.type !== 'from_maxDateToday',
                                          );
                                          setFieldConfig({ ...fieldConfig, validations: filtered });
                                        }
                                      }}
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label className="text-sm">Min Days from Today</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        max={toMaxDaysCap}
                                        placeholder="e.g., 30"
                                        disabled={
                                          forcedTodayValidation !== null ||
                                          (anyValidationActive && !hasDaysFromToday)
                                        }
                                        value={
                                          fieldConfig.validations?.find(
                                            (v) => v.type === 'from_minDaysFromToday',
                                          )?.value != null
                                            ? String(
                                                fieldConfig.validations.find(
                                                  (v) => v.type === 'from_minDaysFromToday',
                                                )!.value,
                                              )
                                            : ''
                                        }
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          const validations = fieldConfig.validations || [];
                                          if (val && val !== '' && !isNaN(Number(val))) {
                                            const parsedValue =
                                              typeof toMaxDaysCap === 'number'
                                                ? Math.min(parseInt(val, 10), toMaxDaysCap)
                                                : parseInt(val, 10);
                                            const baseValidations = filterValidationTypes(
                                              validations,
                                              ['to_maxDateToday'],
                                            );
                                            if (!hasDaysFromToday && anyValidationActive) {
                                              const filtered = baseValidations.filter(
                                                (v) =>
                                                  ![
                                                    'from_minDateToday',
                                                    'from_maxDateToday',
                                                    'from_minDaysFromToday',
                                                    'from_maxDaysFromToday',
                                                    'from_minDate',
                                                    'from_maxDate',
                                                  ].includes(v.type),
                                              );
                                              filtered.push({
                                                type: 'from_minDaysFromToday',
                                                value: parsedValue,
                                              });
                                              setFieldConfig({
                                                ...fieldConfig,
                                                validations: filtered,
                                              });
                                            } else {
                                              const existing = baseValidations.findIndex(
                                                (v) => v.type === 'from_minDaysFromToday',
                                              );
                                              if (existing >= 0) {
                                                baseValidations[existing] = {
                                                  type: 'from_minDaysFromToday',
                                                  value: parsedValue,
                                                };
                                              } else {
                                                baseValidations.push({
                                                  type: 'from_minDaysFromToday',
                                                  value: parsedValue,
                                                });
                                              }
                                              setFieldConfig({
                                                ...fieldConfig,
                                                validations: baseValidations,
                                              });
                                            }
                                          } else {
                                            const existing = validations.findIndex(
                                              (v) => v.type === 'from_minDaysFromToday',
                                            );
                                            if (existing >= 0) {
                                              validations.splice(existing, 1);
                                            }
                                            setFieldConfig({ ...fieldConfig, validations });
                                          }
                                        }}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-sm">Max Days from Today</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        placeholder="e.g., 365"
                                        disabled={
                                          forcedTodayValidation !== null ||
                                          (anyValidationActive && !hasDaysFromToday)
                                        }
                                        value={
                                          fieldConfig.validations?.find(
                                            (v) => v.type === 'from_maxDaysFromToday',
                                          )?.value != null
                                            ? String(
                                                fieldConfig.validations.find(
                                                  (v) => v.type === 'from_maxDaysFromToday',
                                                )!.value,
                                              )
                                            : ''
                                        }
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          const validations = fieldConfig.validations || [];
                                          if (val && val !== '' && !isNaN(Number(val))) {
                                            const baseValidations = filterValidationTypes(
                                              validations,
                                              ['to_maxDateToday'],
                                            );
                                            if (!hasDaysFromToday && anyValidationActive) {
                                              const filtered = baseValidations.filter(
                                                (v) =>
                                                  ![
                                                    'from_minDateToday',
                                                    'from_maxDateToday',
                                                    'from_minDaysFromToday',
                                                    'from_maxDaysFromToday',
                                                    'from_minDate',
                                                    'from_maxDate',
                                                  ].includes(v.type),
                                              );
                                              filtered.push({
                                                type: 'from_maxDaysFromToday',
                                                value: parseInt(val, 10),
                                              });
                                              setFieldConfig({
                                                ...fieldConfig,
                                                validations: filtered,
                                              });
                                            } else {
                                              const existing = baseValidations.findIndex(
                                                (v) => v.type === 'from_maxDaysFromToday',
                                              );
                                              if (existing >= 0) {
                                                baseValidations[existing] = {
                                                  type: 'from_maxDaysFromToday',
                                                  value: parseInt(val, 10),
                                                };
                                              } else {
                                                baseValidations.push({
                                                  type: 'from_maxDaysFromToday',
                                                  value: parseInt(val, 10),
                                                });
                                              }
                                              setFieldConfig({
                                                ...fieldConfig,
                                                validations: baseValidations,
                                              });
                                            }
                                          } else {
                                            const existing = validations.findIndex(
                                              (v) => v.type === 'from_maxDaysFromToday',
                                            );
                                            if (existing >= 0) {
                                              validations.splice(existing, 1);
                                            }
                                            setFieldConfig({ ...fieldConfig, validations });
                                          }
                                        }}
                                      />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label className="text-sm">Min Date</Label>
                                      <DatePicker
                                        disabled={
                                          forcedTodayValidation !== null ||
                                          (anyValidationActive && !hasFixedDate)
                                        }
                                        max={toMaxDateCap}
                                        value={
                                          fieldConfig.validations?.find(
                                            (v) => v.type === 'from_minDate',
                                          )?.value || ''
                                        }
                                        onChange={(val) => {
                                          const validations = fieldConfig.validations || [];
                                          if (val) {
                                            const baseValidations = filterValidationTypes(
                                              validations,
                                              TO_NON_FIXED_VALIDATION_TYPES,
                                            );
                                            if (!hasFixedDate && anyValidationActive) {
                                              const filtered = baseValidations.filter(
                                                (v) =>
                                                  ![
                                                    'from_minDateToday',
                                                    'from_maxDateToday',
                                                    'from_minDaysFromToday',
                                                    'from_maxDaysFromToday',
                                                    'from_minDate',
                                                    'from_maxDate',
                                                  ].includes(v.type),
                                              );
                                              filtered.push({ type: 'from_minDate', value: val });
                                              setFieldConfig({
                                                ...fieldConfig,
                                                validations: filtered,
                                              });
                                            } else {
                                              const existing = baseValidations.findIndex(
                                                (v) => v.type === 'from_minDate',
                                              );
                                              if (existing >= 0) {
                                                baseValidations[existing] = {
                                                  type: 'from_minDate',
                                                  value: val,
                                                };
                                              } else {
                                                baseValidations.push({
                                                  type: 'from_minDate',
                                                  value: val,
                                                });
                                              }
                                              setFieldConfig({
                                                ...fieldConfig,
                                                validations: baseValidations,
                                              });
                                            }
                                          } else {
                                            const existing = validations.findIndex(
                                              (v) => v.type === 'from_minDate',
                                            );
                                            if (existing >= 0) {
                                              validations.splice(existing, 1);
                                            }
                                            setFieldConfig({ ...fieldConfig, validations });
                                          }
                                        }}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-sm">Max Date</Label>
                                      <DatePicker
                                        disabled={
                                          forcedTodayValidation !== null ||
                                          (anyValidationActive && !hasFixedDate)
                                        }
                                        value={
                                          fieldConfig.validations?.find(
                                            (v) => v.type === 'from_maxDate',
                                          )?.value || ''
                                        }
                                        onChange={(val) => {
                                          const validations = fieldConfig.validations || [];
                                          if (val) {
                                            const baseValidations = filterValidationTypes(
                                              validations,
                                              TO_NON_FIXED_VALIDATION_TYPES,
                                            );
                                            if (!hasFixedDate && anyValidationActive) {
                                              const filtered = baseValidations.filter(
                                                (v) =>
                                                  ![
                                                    'from_minDateToday',
                                                    'from_maxDateToday',
                                                    'from_minDaysFromToday',
                                                    'from_maxDaysFromToday',
                                                    'from_minDate',
                                                    'from_maxDate',
                                                  ].includes(v.type),
                                              );
                                              filtered.push({ type: 'from_maxDate', value: val });
                                              setFieldConfig({
                                                ...fieldConfig,
                                                validations: filtered,
                                              });
                                            } else {
                                              const existing = baseValidations.findIndex(
                                                (v) => v.type === 'from_maxDate',
                                              );
                                              if (existing >= 0) {
                                                baseValidations[existing] = {
                                                  type: 'from_maxDate',
                                                  value: val,
                                                };
                                              } else {
                                                baseValidations.push({
                                                  type: 'from_maxDate',
                                                  value: val,
                                                });
                                              }
                                              setFieldConfig({
                                                ...fieldConfig,
                                                validations: baseValidations,
                                              });
                                            }
                                          } else {
                                            const existing = validations.findIndex(
                                              (v) => v.type === 'from_maxDate',
                                            );
                                            if (existing >= 0) {
                                              validations.splice(existing, 1);
                                            }
                                            setFieldConfig({ ...fieldConfig, validations });
                                          }
                                        }}
                                      />
                                    </div>
                                  </div>
                                </>
                              );
                            })()}
                          </div>

                          {/* Date Validations for To Date */}
                          <div className="space-y-3 p-4 border rounded-lg bg-background mt-4">
                            <h4 className="text-sm font-bold mb-3">To Date Validations</h4>
                            {(() => {
                              const hasMinDateToday = fieldConfig.validations?.some(
                                (v) => v.type === 'to_minDateToday',
                              );
                              const hasMaxDateToday = fieldConfig.validations?.some(
                                (v) => v.type === 'to_maxDateToday',
                              );
                              const hasConflictingFromMinDateToday = fieldConfig.validations?.some(
                                (v) => v.type === 'from_minDateToday',
                              );
                              const hasConflictingFromMaxDateToday = fieldConfig.validations?.some(
                                (v) => v.type === 'from_maxDateToday',
                              );
                              const fromHasFixedDate = fieldConfig.validations?.some((v) =>
                                ['from_minDate', 'from_maxDate'].includes(v.type),
                              );
                              const fromHasDaysRange = fieldConfig.validations?.some((v) =>
                                ['from_minDaysFromToday', 'from_maxDaysFromToday'].includes(v.type),
                              );
                              const fromMinDaysFloor =
                                getValidationNumberValue(
                                  fieldConfig.validations,
                                  'from_minDaysFromToday',
                                ) ?? 0;
                              const fromMinDateFloor = getValidationLowerBoundDate(
                                fieldConfig.validations,
                                'from',
                              );
                              const hasDaysFromToday = fieldConfig.validations?.some((v) =>
                                ['to_minDaysFromToday', 'to_maxDaysFromToday'].includes(v.type),
                              );
                              const hasFixedDate = fieldConfig.validations?.some((v) =>
                                ['to_minDate', 'to_maxDate'].includes(v.type),
                              );
                              const anyValidationActive =
                                hasMinDateToday ||
                                hasMaxDateToday ||
                                hasDaysFromToday ||
                                hasFixedDate;

                              return (
                                <>
                                  <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                      <Label className="text-sm">Must be today or later</Label>
                                      <p className="text-xs text-muted-foreground">
                                        To date cannot be in the past
                                      </p>
                                    </div>
                                    <Switch
                                      disabled={
                                        !!fromHasFixedDate ||
                                        (anyValidationActive && !hasMinDateToday) ||
                                        !!hasConflictingFromMaxDateToday
                                      }
                                      checked={hasMinDateToday || false}
                                      onCheckedChange={(checked) => {
                                        const validations = fieldConfig.validations || [];
                                        if (checked) {
                                          const filtered = filterValidationTypes(validations, [
                                            ...TO_DATE_VALIDATION_TYPES,
                                            'from_maxDateToday',
                                          ]);
                                          filtered.push({ type: 'to_minDateToday' });
                                          setFieldConfig({ ...fieldConfig, validations: filtered });
                                        } else {
                                          const filtered = validations.filter(
                                            (v) => v.type !== 'to_minDateToday',
                                          );
                                          setFieldConfig({ ...fieldConfig, validations: filtered });
                                        }
                                      }}
                                    />
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                      <Label className="text-sm">Must be today or earlier</Label>
                                      <p className="text-xs text-muted-foreground">
                                        To date cannot be in the future
                                      </p>
                                    </div>
                                    <Switch
                                      disabled={
                                        !!fromHasFixedDate ||
                                        !!fromHasDaysRange ||
                                        (anyValidationActive && !hasMaxDateToday) ||
                                        !!hasConflictingFromMinDateToday
                                      }
                                      checked={hasMaxDateToday || false}
                                      onCheckedChange={(checked) => {
                                        const validations = fieldConfig.validations || [];
                                        if (checked) {
                                          const filtered = filterValidationTypes(validations, [
                                            ...TO_DATE_VALIDATION_TYPES,
                                            'from_minDateToday',
                                          ]);
                                          filtered.push({ type: 'to_maxDateToday' });
                                          setFieldConfig({ ...fieldConfig, validations: filtered });
                                        } else {
                                          const filtered = validations.filter(
                                            (v) => v.type !== 'to_maxDateToday',
                                          );
                                          setFieldConfig({ ...fieldConfig, validations: filtered });
                                        }
                                      }}
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label className="text-sm">Min Days from Today</Label>
                                      <Input
                                        type="number"
                                        min={fromMinDaysFloor}
                                        placeholder="e.g., 30"
                                        disabled={
                                          !!fromHasFixedDate ||
                                          (anyValidationActive && !hasDaysFromToday)
                                        }
                                        value={
                                          fieldConfig.validations?.find(
                                            (v) => v.type === 'to_minDaysFromToday',
                                          )?.value != null
                                            ? String(
                                                fieldConfig.validations.find(
                                                  (v) => v.type === 'to_minDaysFromToday',
                                                )!.value,
                                              )
                                            : ''
                                        }
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          const validations = fieldConfig.validations || [];
                                          if (val && val !== '' && !isNaN(Number(val))) {
                                            const parsedValue = Math.max(
                                              parseInt(val, 10),
                                              fromMinDaysFloor,
                                            );
                                            if (!hasDaysFromToday && anyValidationActive) {
                                              const filtered = validations.filter(
                                                (v) =>
                                                  ![
                                                    'to_minDateToday',
                                                    'to_maxDateToday',
                                                    'to_minDaysFromToday',
                                                    'to_maxDaysFromToday',
                                                    'to_minDate',
                                                    'to_maxDate',
                                                  ].includes(v.type),
                                              );
                                              filtered.push({
                                                type: 'to_minDaysFromToday',
                                                value: parsedValue,
                                              });
                                              setFieldConfig({
                                                ...fieldConfig,
                                                validations: filtered,
                                              });
                                            } else {
                                              const existing = validations.findIndex(
                                                (v) => v.type === 'to_minDaysFromToday',
                                              );
                                              if (existing >= 0) {
                                                validations[existing] = {
                                                  type: 'to_minDaysFromToday',
                                                  value: parsedValue,
                                                };
                                              } else {
                                                validations.push({
                                                  type: 'to_minDaysFromToday',
                                                  value: parsedValue,
                                                });
                                              }
                                              setFieldConfig({ ...fieldConfig, validations });
                                            }
                                          } else {
                                            const existing = validations.findIndex(
                                              (v) => v.type === 'to_minDaysFromToday',
                                            );
                                            if (existing >= 0) {
                                              validations.splice(existing, 1);
                                            }
                                            setFieldConfig({ ...fieldConfig, validations });
                                          }
                                        }}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-sm">Max Days from Today</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        placeholder="e.g., 365"
                                        disabled={
                                          !!fromHasFixedDate ||
                                          (anyValidationActive && !hasDaysFromToday)
                                        }
                                        value={
                                          fieldConfig.validations?.find(
                                            (v) => v.type === 'to_maxDaysFromToday',
                                          )?.value != null
                                            ? String(
                                                fieldConfig.validations.find(
                                                  (v) => v.type === 'to_maxDaysFromToday',
                                                )!.value,
                                              )
                                            : ''
                                        }
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          const validations = fieldConfig.validations || [];
                                          if (val && val !== '' && !isNaN(Number(val))) {
                                            const nextMaxValue = parseInt(val, 10);
                                            const currentFromMin = getValidationNumberValue(
                                              validations,
                                              'from_minDaysFromToday',
                                            );
                                            const nextValidations = [...validations];
                                            if (
                                              typeof currentFromMin === 'number' &&
                                              currentFromMin > nextMaxValue
                                            ) {
                                              const fromMinIndex = nextValidations.findIndex(
                                                (v) => v.type === 'from_minDaysFromToday',
                                              );
                                              if (fromMinIndex >= 0) {
                                                nextValidations[fromMinIndex] = {
                                                  type: 'from_minDaysFromToday',
                                                  value: nextMaxValue,
                                                };
                                              }
                                            }
                                            if (!hasDaysFromToday && anyValidationActive) {
                                              const filtered = nextValidations.filter(
                                                (v) =>
                                                  ![
                                                    'to_minDateToday',
                                                    'to_maxDateToday',
                                                    'to_minDaysFromToday',
                                                    'to_maxDaysFromToday',
                                                    'to_minDate',
                                                    'to_maxDate',
                                                  ].includes(v.type),
                                              );
                                              filtered.push({
                                                type: 'to_maxDaysFromToday',
                                                value: nextMaxValue,
                                              });
                                              setFieldConfig({
                                                ...fieldConfig,
                                                validations: filtered,
                                              });
                                            } else {
                                              const existing = nextValidations.findIndex(
                                                (v) => v.type === 'to_maxDaysFromToday',
                                              );
                                              if (existing >= 0) {
                                                nextValidations[existing] = {
                                                  type: 'to_maxDaysFromToday',
                                                  value: nextMaxValue,
                                                };
                                              } else {
                                                nextValidations.push({
                                                  type: 'to_maxDaysFromToday',
                                                  value: nextMaxValue,
                                                });
                                              }
                                              setFieldConfig({
                                                ...fieldConfig,
                                                validations: nextValidations,
                                              });
                                            }
                                          } else {
                                            const existing = validations.findIndex(
                                              (v) => v.type === 'to_maxDaysFromToday',
                                            );
                                            if (existing >= 0) {
                                              validations.splice(existing, 1);
                                            }
                                            setFieldConfig({ ...fieldConfig, validations });
                                          }
                                        }}
                                      />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label className="text-sm">Min Date</Label>
                                      <DatePicker
                                      disabled={anyValidationActive && !hasFixedDate}
                                      min={fromMinDateFloor}
                                        value={
                                          fieldConfig.validations?.find(
                                            (v) => v.type === 'to_minDate',
                                          )?.value || ''
                                        }
                                        onChange={(val) => {
                                          const validations = fieldConfig.validations || [];
                                          if (val) {
                                            const clampedVal =
                                              fromMinDateFloor && val < fromMinDateFloor
                                                ? fromMinDateFloor
                                                : val;
                                            if (!hasFixedDate && anyValidationActive) {
                                              const filtered = validations.filter(
                                                (v) =>
                                                  ![
                                                    'to_minDateToday',
                                                    'to_maxDateToday',
                                                    'to_minDaysFromToday',
                                                    'to_maxDaysFromToday',
                                                    'to_minDate',
                                                    'to_maxDate',
                                                  ].includes(v.type),
                                              );
                                              filtered.push({
                                                type: 'to_minDate',
                                                value: clampedVal,
                                              });
                                              setFieldConfig({
                                                ...fieldConfig,
                                                validations: filtered,
                                              });
                                            } else {
                                              const existing = validations.findIndex(
                                                (v) => v.type === 'to_minDate',
                                              );
                                              if (existing >= 0) {
                                                validations[existing] = {
                                                  type: 'to_minDate',
                                                  value: clampedVal,
                                                };
                                              } else {
                                                validations.push({
                                                  type: 'to_minDate',
                                                  value: clampedVal,
                                                });
                                              }
                                              setFieldConfig({ ...fieldConfig, validations });
                                            }
                                          } else {
                                            const existing = validations.findIndex(
                                              (v) => v.type === 'to_minDate',
                                            );
                                            if (existing >= 0) {
                                              validations.splice(existing, 1);
                                            }
                                            setFieldConfig({ ...fieldConfig, validations });
                                          }
                                        }}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-sm">Max Date</Label>
                                      <DatePicker
                                        disabled={anyValidationActive && !hasFixedDate}
                                        value={
                                          fieldConfig.validations?.find(
                                            (v) => v.type === 'to_maxDate',
                                          )?.value || ''
                                        }
                                        onChange={(val) => {
                                          const validations = fieldConfig.validations || [];
                                          if (val) {
                                            const currentFromMinDate = getValidationStringValue(
                                              validations,
                                              'from_minDate',
                                            );
                                            const nextValidations = [...validations];
                                            if (
                                              currentFromMinDate &&
                                              currentFromMinDate > val
                                            ) {
                                              const fromMinIndex = nextValidations.findIndex(
                                                (v) => v.type === 'from_minDate',
                                              );
                                              if (fromMinIndex >= 0) {
                                                nextValidations[fromMinIndex] = {
                                                  type: 'from_minDate',
                                                  value: val,
                                                };
                                              }
                                            }
                                            if (!hasFixedDate && anyValidationActive) {
                                              const filtered = nextValidations.filter(
                                                (v) =>
                                                  ![
                                                    'to_minDateToday',
                                                    'to_maxDateToday',
                                                    'to_minDaysFromToday',
                                                    'to_maxDaysFromToday',
                                                    'to_minDate',
                                                    'to_maxDate',
                                                  ].includes(v.type),
                                              );
                                              filtered.push({ type: 'to_maxDate', value: val });
                                              setFieldConfig({
                                                ...fieldConfig,
                                                validations: filtered,
                                              });
                                            } else {
                                              const existing = nextValidations.findIndex(
                                                (v) => v.type === 'to_maxDate',
                                              );
                                              if (existing >= 0) {
                                                nextValidations[existing] = {
                                                  type: 'to_maxDate',
                                                  value: val,
                                                };
                                              } else {
                                                nextValidations.push({
                                                  type: 'to_maxDate',
                                                  value: val,
                                                });
                                              }
                                              setFieldConfig({
                                                ...fieldConfig,
                                                validations: nextValidations,
                                              });
                                            }
                                          } else {
                                            const existing = validations.findIndex(
                                              (v) => v.type === 'to_maxDate',
                                            );
                                            if (existing >= 0) {
                                              validations.splice(existing, 1);
                                            }
                                            setFieldConfig({ ...fieldConfig, validations });
                                          }
                                        }}
                                      />
                                    </div>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </>
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
                                fieldConfig.validations?.find((v) => v.type === 'maxFileSize')
                                  ?.value != null
                                  ? String(
                                      fieldConfig.validations.find((v) => v.type === 'maxFileSize')!
                                        .value,
                                    )
                                  : ''
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                const validations = fieldConfig.validations || [];
                                const existing = validations.findIndex(
                                  (v) => v.type === 'maxFileSize',
                                );
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
                                fieldConfig.validations?.find((v) => v.type === 'allowedTypes')
                                  ?.value || ''
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                const validations = fieldConfig.validations || [];
                                const existing = validations.findIndex(
                                  (v) => v.type === 'allowedTypes',
                                );
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
                                fieldConfig.validations?.find((v) => v.type === 'maxFiles')
                                  ?.value != null
                                  ? String(
                                      fieldConfig.validations.find((v) => v.type === 'maxFiles')!
                                        .value,
                                    )
                                  : ''
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                const validations = fieldConfig.validations || [];
                                const existing = validations.findIndex(
                                  (v) => v.type === 'maxFiles',
                                );
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

                      {(fieldConfig.type === 'multiselect' ||
                        fieldConfig.type === 'multiselectDropdown') && (
                        <div className="space-y-3 p-4 border rounded-lg bg-background">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm">Min Selections</Label>
                              <Input
                                type="number"
                                placeholder="e.g., 1"
                                min="0"
                                value={
                                  fieldConfig.validations?.find((v) => v.type === 'minSelections')
                                    ?.value != null
                                    ? String(
                                        fieldConfig.validations.find(
                                          (v) => v.type === 'minSelections',
                                        )!.value,
                                      )
                                    : ''
                                }
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const validations = fieldConfig.validations || [];
                                  const existing = validations.findIndex(
                                    (v) => v.type === 'minSelections',
                                  );
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
                                  fieldConfig.validations?.find((v) => v.type === 'maxSelections')
                                    ?.value != null
                                    ? String(
                                        fieldConfig.validations.find(
                                          (v) => v.type === 'maxSelections',
                                        )!.value,
                                      )
                                    : ''
                                }
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const validations = fieldConfig.validations || [];
                                  const existing = validations.findIndex(
                                    (v) => v.type === 'maxSelections',
                                  );
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
                )}
              </div>
            </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Sub-Field Configuration Dialog */}
      <Dialog
        open={isSubFieldDialogOpen}
        onOpenChange={(open) => !open && handleCloseSubFieldDialog()}
      >
        <DialogContent
          showClose={false}
          className="flex w-[calc(100vw-2rem)] max-w-5xl max-h-[90vh] flex-col overflow-hidden p-0"
        >
          <div className="relative h-full w-full overflow-x-hidden overflow-y-auto rounded-lg border border-border bg-background p-6 shadow-lg">
            {isSubFieldDialogClosing ? (
              <div className="min-h-[180px]" aria-hidden="true" />
            ) : (
              <>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle>
                    {isConfiguringSubField ? 'Add Sub-Field' : 'Edit Sub-Field'}
                  </DialogTitle>
                  <DialogDescription>
                    Configure the sub-field properties for the combination field.
                  </DialogDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={handleCloseSubFieldDialog}>
                    Cancel
                  </Button>
                  <Button onClick={saveSubField}>
                    {isConfiguringSubField ? 'Add Sub-Field' : 'Update Sub-Field'}
                  </Button>
                </div>
              </div>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-6 py-4">
              {/* Left Column: Configuration */}
              <div className="space-y-4 px-2">
                {/* Field Type Selection */}
                <div className="flex items-center justify-between rounded-md border bg-muted/20 px-3 py-2">
                  <Label htmlFor="subfield-active-toggle" className="text-sm font-medium">
                    Active
                  </Label>
                  <Switch
                    id="subfield-active-toggle"
                    checked={subFieldConfig.metadata?.active !== false}
                    onCheckedChange={(checked) =>
                      setSubFieldConfig({
                        ...subFieldConfig,
                        metadata: {
                          ...(subFieldConfig.metadata || {}),
                          active: checked,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Field Type *</Label>
                      <Select
                        disabled={!!subFieldConfig.metadata?.referenceFieldId}
                        value={subFieldConfig.type || 'text'}
                        onValueChange={(value: FieldType) => {
                          setSubFieldConfig({
                            ...subFieldConfig,
                            type: value,
                            defaultValue: getResetDefaultValueForType(
                              value,
                              undefined,
                              subFieldConfig.showYearOnly,
                            ),
                            isRatingParameter: ['number', 'dropdown'].includes(value)
                              ? subFieldConfig.isRatingParameter
                              : false,
                          });
                          const key = subFieldConfig.id || subFieldConfig.name;
                          if (value === 'dropdown' || value === 'chooseButton') {
                            const existing =
                              subFieldConfig.options?.map((o) =>
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
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent
                          className="max-h-[320px]"
                          scrollHeight="280px"
                        >
                          <SelectGroup>
                            <SelectLabel>Text & Numbers</SelectLabel>
                            {fieldTypes
                              .filter((ft) => ['text', 'textarea', 'number'].includes(ft.value))
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

                          <SelectGroup>
                            <SelectLabel>Selections</SelectLabel>
                            {fieldTypes
                              .filter((ft) =>
                                ['dropdown', 'date', 'datePeriod', 'time', 'checkbox'].includes(
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

                          <SelectGroup>
                            <SelectLabel>Buttons</SelectLabel>
                            {fieldTypes
                              .filter((ft) => ['chooseButton'].includes(ft.value))
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

                          <SelectGroup>
                            <SelectLabel>Files</SelectLabel>
                            {fieldTypes
                              .filter((ft) => ['file'].includes(ft.value))
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

                          <SelectGroup>
                            <SelectLabel>Map</SelectLabel>
                            {fieldTypes
                              .filter((ft) => ['location'].includes(ft.value))
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
                    <div className="space-y-2">
                      <Label>Field Label *</Label>
                      <Input
                        value={subFieldConfig.label || ''}
                        onChange={(e) => {
                          const label = e.target.value;
                          const autoName = generateFieldName(label);

                          const oldLabel = subFieldConfig.label || '';
                          const currentPlaceholder = subFieldConfig.placeholder || '';
                          const isDefaultPlaceholder =
                            !currentPlaceholder ||
                            currentPlaceholder === `Please enter ${oldLabel}` ||
                            currentPlaceholder === `Please select ${oldLabel}`;

                          let newPlaceholder = subFieldConfig.placeholder;
                          if (isDefaultPlaceholder) {
                            const isSelect = ['dropdown', 'date', 'datePeriod'].includes(
                              subFieldConfig.type || '',
                            );
                            newPlaceholder = isSelect
                              ? `Please select ${label}`
                              : `Please enter ${label}`;
                          }

                          setSubFieldConfig({
                            ...subFieldConfig,
                            label,
                            name: autoName,
                            placeholder: newPlaceholder,
                          });
                        }}
                        placeholder="e.g., Company Name"
                      />
                      <p className="text-xs text-muted-foreground">
                        Field name will be auto-generated from the label
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-6 gap-4">
                    {/* Reference Another Combination Field */}
                    <div className="space-y-4 col-span-6 pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Reference Another Combination Field</Label>
                          <p className="text-xs text-muted-foreground">
                            Auto-populate this column from another combination field
                          </p>
                        </div>
                        <Switch
                          checked={
                            subFieldConfig.type === 'dropdown' &&
                            subFieldConfig.metadata !== undefined &&
                            (subFieldConfig.metadata?.referenceFieldId !== undefined ||
                              subFieldConfig.metadata?.referenceFieldName !== undefined)
                          }
                          onCheckedChange={(checked) => {
                            setSubFieldConfig({
                              ...subFieldConfig,
                              type: 'dropdown',
                              options: [],
                              optionsUrl: undefined,
                              globalMasterKey: undefined,
                              defaultValue: undefined,
                              metadata: {
                                ...subFieldConfig.metadata,
                                referenceFieldId: checked ? '' : undefined,
                                referenceFieldName: checked ? '' : undefined,
                                referenceSubFieldId: checked ? '' : undefined,
                                referenceSubFieldName: checked ? '' : undefined,
                                globalMasterId: undefined,
                                optionsSourceMode: undefined,
                              },
                            });
                          }}
                        />
                      </div>

                      {subFieldConfig.type === 'dropdown' &&
                        subFieldConfig.metadata !== undefined &&
                        (subFieldConfig.metadata?.referenceFieldId !== undefined ||
                          subFieldConfig.metadata?.referenceFieldName !== undefined) && (
                          <div className="space-y-4 pl-4 border-l-2 border-muted">
                            <div className="space-y-2">
                              <Label>Select Source Field</Label>
                              <Select
                                value={subFieldConfig.metadata?.referenceFieldId || ''}
                                onValueChange={(val) => {
                                  const sourceField = otherCombinationFields.find(
                                    (f) => f.id === val,
                                  );
                                  setSubFieldConfig({
                                    ...subFieldConfig,
                                    options: [],
                                    optionsUrl: undefined,
                                    globalMasterKey: undefined,
                                    metadata: {
                                      ...subFieldConfig.metadata,
                                      referenceFieldId: val,
                                      referenceFieldName: sourceField?.name, // Store name for robustness
                                      referenceSubFieldId: '', // Reset sub-field
                                      referenceSubFieldName: '',
                                    },
                                  });
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a combination field" />
                                </SelectTrigger>
                                <SelectContent>
                                  {otherCombinationFields
                                    .filter((f) => typeof f.id === 'string' && f.id.trim() !== '')
                                    .map((f) => (
                                      <SafeSelectItem key={f.id} value={f.id as string}>
                                        {f.label}
                                      </SafeSelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {subFieldConfig.metadata?.referenceFieldId && (
                              <div className="space-y-2">
                                <Label>Select Source Column</Label>
                                <Select
                                  value={subFieldConfig.metadata?.referenceSubFieldId || ''}
                                  onValueChange={(val) => {
                                    const sourceField = otherCombinationFields.find(
                                      (f) => f.id === subFieldConfig.metadata?.referenceFieldId,
                                    );
                                    const sourceSubField = sourceField?.subFields?.find(
                                      (sf) => sf.id === val,
                                    );

                                    setSubFieldConfig({
                                      ...subFieldConfig,
                                      // Force type to dropdown for reference fields
                                      type: 'dropdown',
                                      options: [],
                                      optionsUrl: undefined,
                                      globalMasterKey: undefined,
                                      label: subFieldConfig.label || sourceSubField?.label,
                                      metadata: {
                                        ...subFieldConfig.metadata,
                                        referenceSubFieldId: val,
                                        referenceSubFieldName: sourceSubField?.name,
                                      },
                                    });
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a column" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {otherCombinationFields
                                      .find(
                                        (f) => f.id === subFieldConfig.metadata?.referenceFieldId,
                                      )
                                      ?.subFields
                                      ?.filter(
                                        (sf) => typeof sf.id === 'string' && sf.id.trim() !== '',
                                      )
                                      .map((sf) => (
                                        <SafeSelectItem key={sf.id} value={sf.id as string}>
                                          {sf.label}
                                        </SafeSelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                        )}
                    </div>

                    {subFieldConfig.type === 'number' && (
                      <div className="space-y-2 col-span-6">
                        <Label>Number Format</Label>
                        <Select
                          value={subFieldConfig.metadata?.numberFormat || 'none'}
                          onValueChange={(value) => {
                            const validations = subFieldConfig.validations || [];
                            const filtered =
                              value === 'phoneNumber'
                                ? validations.filter((v) => v.type !== 'min' && v.type !== 'max')
                                : validations.filter(
                                    (v) => v.type !== 'minLength' && v.type !== 'maxLength',
                                  );
                            setSubFieldConfig({
                              ...subFieldConfig,
                              metadata: {
                                ...subFieldConfig.metadata,
                                numberFormat: value,
                              },
                              validations: filtered,
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select format (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Standard Number</SelectItem>
                            <SelectItem value="currency">Currency</SelectItem>
                            <SelectItem value="distance">Distance (km)</SelectItem>
                            <SelectItem value="phoneNumber">Phone Number</SelectItem>
                            <SelectItem value="percentage">Percentage (%)</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Select formatting to apply to this number field.
                        </p>
                      </div>
                    )}
                  </div>

                  {subFieldConfig.type === 'location' && (
                    <div className="space-y-4 border-t pt-4">
                      <h3 className="text-sm font-semibold">Map Service Configuration</h3>
                      <div className="space-y-2">
                        <Label>Map Provider</Label>
                        <Select
                          value={resolveMapProviderValue(
                            subFieldConfig.metadata?.mapProvider ?? subFieldConfig.mapProvider,
                            subFieldConfig.metadata?.mapApiUrl ?? subFieldConfig.mapApiUrl,
                          )}
                          onValueChange={(value) => {
                            setSubFieldConfig({
                              ...subFieldConfig,
                              mapProvider: value,
                              metadata: {
                                ...subFieldConfig.metadata,
                                mapProvider: value,
                                mapApiUrl:
                                  value === 'default'
                                    ? 'https://nominatim.openstreetmap.org'
                                    : 'https://maps.googleapis.com/maps/api/js',
                              },
                              mapApiUrl:
                                value === 'default'
                                  ? 'https://nominatim.openstreetmap.org'
                                  : 'https://maps.googleapis.com/maps/api/js',
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
                  <div className="space-y-2">
                    <Label>Note (Optional)</Label>
                    <Textarea
                      value={subFieldConfig.note || ''}
                      onChange={(e) =>
                        setSubFieldConfig({
                          ...subFieldConfig,
                          note: e.target.value,
                        })
                      }
                      placeholder="Enter a note or hint for this field"
                      rows={2}
                    />
                    <p className="text-xs text-muted-foreground">
                      This note will be shown below the field in the form.
                    </p>
                  </div>

                  {subFieldConfig.type === 'date' && (
                    <div className="flex items-center justify-between pb-2">
                      <div className="space-y-0.5">
                        <Label htmlFor="subFieldYearOnly">Year Only</Label>
                        <p className="text-xs text-muted-foreground">
                          Allow users to select only the year
                        </p>
                      </div>
                      <Switch
                        id="subFieldYearOnly"
                        checked={subFieldConfig.showYearOnly || false}
                        onCheckedChange={(checked) => {
                          setSubFieldConfig({
                            ...subFieldConfig,
                            showYearOnly: checked,
                            defaultValue: '',
                            metadata: {
                              ...(subFieldConfig.metadata || {}),
                              is_year_only: checked,
                            },
                          });
                        }}
                      />
                    </div>
                  )}

                  {/* Placeholder and Default Value in one row */}
                  {subFieldConfig.type !== 'file' &&
                  subFieldConfig.type !== 'combination' &&
                  subFieldConfig.type !== 'chooseButton' ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Placeholder</Label>
                        <Input
                          value={subFieldConfig.placeholder || ''}
                          onChange={(e) =>
                            setSubFieldConfig({
                              ...subFieldConfig,
                              placeholder: e.target.value,
                            })
                          }
                          placeholder="Enter placeholder text"
                        />
                      </div>

                      {/* Default Value */}
                      <div className="space-y-2">
                        <Label>Default Value</Label>
                        {subFieldConfig.type === 'checkbox' ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={subFieldConfig.defaultValue === true}
                              onChange={(e) =>
                                setSubFieldConfig({
                                  ...subFieldConfig,
                                  defaultValue: e.target.checked ? true : undefined,
                                })
                              }
                              className="h-4 w-4 rounded border-gray-300"
                            />
                            <Label className="text-sm font-normal">Checked by default</Label>
                          </div>
                        ) : subFieldConfig.type === 'dropdown' ? (
                          <Select
                            value={
                              typeof subFieldConfig.defaultValue === 'string'
                                ? subFieldConfig.defaultValue
                                : 'none'
                            }
                            onValueChange={(value) => {
                              if (value === 'none') {
                                setSubFieldConfig({
                                  ...subFieldConfig,
                                  defaultValue: undefined,
                                });
                              } else {
                                setSubFieldConfig({
                                  ...subFieldConfig,
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
                              {getSelectableOptions(subFieldConfig.options).map((option) => (
                                <SafeSelectItem key={option.key} value={option.value}>
                                  {option.label}
                                </SafeSelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : subFieldConfig.type === 'date' ? (
                          <DatePicker
                            mode={subFieldConfig.showYearOnly ? 'year' : 'date'}
                            value={
                              typeof subFieldConfig.defaultValue === 'string'
                                ? subFieldConfig.defaultValue
                                : undefined
                            }
                            onChange={(date) =>
                              setSubFieldConfig({
                                ...subFieldConfig,
                                defaultValue: date || undefined,
                              })
                            }
                          />
                        ) : subFieldConfig.type === 'number' ? (
                          <FormattedNumberInput
                            value={
                              typeof subFieldConfig.defaultValue === 'number'
                                ? subFieldConfig.defaultValue
                                : undefined
                            }
                            allowDecimals
                            useGrouping={subFieldConfig.metadata?.numberFormat !== 'phoneNumber'}
                            onChange={(value) => {
                              setSubFieldConfig({
                                ...subFieldConfig,
                                defaultValue: Number.isNaN(value) ? undefined : value,
                              });
                            }}
                            onBlur={(e) => {
                              const raw = e.target.value.replace(/,/g, '').trim();
                              if (raw === '' || raw === '-') {
                                setSubFieldConfig({
                                  ...subFieldConfig,
                                  defaultValue: undefined,
                                });
                                return;
                              }
                              const parsed = Number(raw);
                              setSubFieldConfig({
                                ...subFieldConfig,
                                defaultValue: Number.isNaN(parsed)
                                  ? subFieldConfig.defaultValue
                                  : parsed,
                              });
                            }}
                            placeholder="Enter default number"
                          />
                        ) : subFieldConfig.type === 'textarea' ? (
                          <Textarea
                            rows={3}
                            value={
                              typeof subFieldConfig.defaultValue === 'string'
                                ? subFieldConfig.defaultValue
                                : ''
                            }
                            onChange={(e) =>
                              setSubFieldConfig({
                                ...subFieldConfig,
                                defaultValue: e.target.value || undefined,
                              })
                            }
                            placeholder="Enter default value"
                          />
                        ) : (
                          <Input
                            value={
                              typeof subFieldConfig.defaultValue === 'string'
                                ? subFieldConfig.defaultValue
                                : ''
                            }
                            onChange={(e) =>
                              setSubFieldConfig({
                                ...subFieldConfig,
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
                        value={subFieldConfig.placeholder || ''}
                        onChange={(e) =>
                          setSubFieldConfig({
                            ...subFieldConfig,
                            placeholder: e.target.value,
                          })
                        }
                        placeholder="Enter placeholder text"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-6 gap-4 border-t pt-4">
                    <div className="space-y-2 col-span-3 flex flex-col pt-[10px]">
                      <Label htmlFor="subFieldRequired" className="mb-0">
                        Required
                      </Label>
                      <div className="mt-2">
                        <Switch
                          id="subFieldRequired"
                          checked={
                            Boolean(subFieldConfig.isRatingParameter) ||
                            subFieldConfig.required !== false
                          }
                          onCheckedChange={(checked) => {
                            setSubFieldConfig({
                              ...subFieldConfig,
                              required: checked,
                            });
                          }}
                          disabled={subFieldConfig.isRatingParameter}
                        />
                      </div>
                    </div>
                    {!hideRatingParameterControls && (
                      <div className="space-y-2 col-span-3 flex flex-col pt-[10px]">
                        <Label htmlFor="subFieldRatingParameter" className="mb-0">
                          Rating Parameter
                        </Label>
                        <div className="mt-2">
                          <Switch
                            id="subFieldRatingParameter"
                            checked={subFieldConfig.isRatingParameter || false}
                            onCheckedChange={(checked) => {
                              setSubFieldConfig({
                                ...subFieldConfig,
                                isRatingParameter: checked,
                                required: checked ? true : subFieldConfig.required,
                              });
                            }}
                            disabled={
                              subFieldConfig.type === 'text' ||
                              subFieldConfig.type === 'textarea' ||
                              subFieldConfig.type === 'file' ||
                              subFieldConfig.type === 'date' ||
                              subFieldConfig.type === 'datePeriod' ||
                              subFieldConfig.type === 'checkbox' ||
                              subFieldConfig.type === 'location'
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dependent Dropdown Section */}
                {subFieldConfig.type === 'dropdown' && (
                  <div className="space-y-4 border-t pt-4 mt-4 mb-4">
                    <div className="space-y-2">
                      <Label>Dependent Dropdown</Label>
                      <Select
                        value={subFieldConfig.dependentOn ? subFieldConfig.dependentOn : ''}
                        onValueChange={(value) => {
                          if (value) {
                            setSubFieldConfig({
                              ...subFieldConfig,
                              dependentOn: value,
                              // Clear static options if setting up dependency
                              options: undefined,
                              optionsUrl: undefined,
                              globalMasterKey: undefined,
                              defaultValue: undefined,
                            });
                          } else {
                            setSubFieldConfig({
                              ...subFieldConfig,
                              dependentOn: undefined,
                              dependentOptions: undefined,
                              dependentOptionsUrl: undefined,
                              options: undefined,
                              optionsUrl: undefined,
                              globalMasterKey: undefined,
                              defaultValue: undefined,
                            });
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select parent sub-field (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {(() => {
                            const siblings = subFieldsConfig.filter((sf) => {
                              if (subFieldConfig.id && sf.id === subFieldConfig.id) return false;
                              if (
                                !subFieldConfig.id &&
                                subFieldConfig.name &&
                                sf.name === subFieldConfig.name
                              )
                                return false;
                              return (
                                sf.type === 'dropdown' ||
                                sf.type === 'multiselect' ||
                                sf.type === 'multiselectDropdown' ||
                                sf.type === 'text' ||
                                sf.type === 'chooseButton'
                              );
                            });
                            if (siblings.length === 0) {
                              return (
                                <div className="py-3 px-3 text-xs text-muted-foreground text-center">
                                  No eligible parent sub-fields found. Add a Dropdown sub-field
                                  first (e.g. &quot;Country&quot;), then configure this field to
                                  depend on it.
                                </div>
                              );
                            }
                            return siblings
                              .filter(
                                (sf) => typeof sf.name === 'string' && sf.name.trim() !== '',
                              )
                              .map((sf) => (
                              <SafeSelectItem key={sf.id || sf.name} value={sf.name}>
                                {sf.label} ({sf.name})
                              </SafeSelectItem>
                            ));
                          })()}
                        </SelectContent>
                      </Select>
                      {subFieldConfig.dependentOn && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-6 text-xs mt-2"
                          onClick={() => {
                            setSubFieldConfig({
                              ...subFieldConfig,
                              dependentOn: undefined,
                              dependentOptions: undefined,
                              dependentOptionsUrl: undefined,
                              options: undefined,
                              optionsUrl: undefined,
                              globalMasterKey: undefined,
                              defaultValue: undefined,
                            });
                          }}
                        >
                          Clear <X className="h-3 w-3 ml-1" />
                        </Button>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Select a parent field in this combination to create a dependent dropdown
                        (e.g., State depends on Country)
                      </p>
                    </div>

                    {subFieldConfig.dependentOn ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Dependent Options Source</Label>
                          <Select
                            value={
                              subFieldConfig.dependentOptionsUrl !== undefined ? 'url' : 'input'
                            }
                            onValueChange={(value) => {
                              if (value === 'url') {
                                setSubFieldConfig({
                                  ...subFieldConfig,
                                  dependentOptions: undefined,
                                  dependentOptionsUrl: '',
                                  defaultValue: undefined,
                                });
                              } else {
                                setSubFieldConfig({
                                  ...subFieldConfig,
                                  dependentOptionsUrl: undefined,
                                  dependentOptions: {},
                                  defaultValue: undefined,
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

                        {subFieldConfig.dependentOptionsUrl !== undefined ? (
                          <div className="space-y-2">
                            <Label>Dependent Options URL</Label>
                            <Input
                              type="url"
                              value={subFieldConfig.dependentOptionsUrl || ''}
                              onChange={(e) =>
                                setSubFieldConfig({
                                  ...subFieldConfig,
                                  dependentOptionsUrl: e.target.value,
                                })
                              }
                              placeholder="https://api.example.com/regions?country={parentValue}"
                            />
                            <p className="text-xs text-muted-foreground">
                              URL endpoint that returns dependent options. Use {'{parentValue}'} as
                              placeholder for parent field value.
                            </p>
                          </div>
                        ) : (
                          (() => {
                            const parentSubField = subFieldsConfig.find(
                              (sf) => sf.name === subFieldConfig.dependentOn,
                            );

                            let parentOptions: Array<{ label: string; value: string }> = [];

                            if (parentSubField?.options && parentSubField.options.length > 0) {
                              parentOptions = parentSubField.options.map((opt: any) =>
                                typeof opt === 'string' ? { label: opt, value: opt } : opt,
                              );
                            } else if (parentSubField?.dependentOptions) {
                              const allDependentValues = Object.values(
                                parentSubField.dependentOptions,
                              ).flat();
                              parentOptions = allDependentValues.map((val) => ({
                                label: String(val),
                                value: String(val),
                              }));
                            }

                            if (parentOptions.length > 0) {
                              return (
                                <div className="space-y-4 border rounded-md p-4 bg-muted/30 max-h-[400px] overflow-y-auto">
                                  <Label>Configure Child Options per Parent Value</Label>
                                  {parentOptions.map((parentOpt) => {
                                    const parentVal = parentOpt.value;
                                    const childOpts: string[] = (
                                      subFieldConfig.dependentOptions?.[parentVal] || []
                                    ).map(String);

                                    const updateChildOpts = (newOpts: string[]) => {
                                      setSubFieldConfig({
                                        ...subFieldConfig,
                                        dependentOptions: {
                                          ...subFieldConfig.dependentOptions,
                                          [parentVal]: newOpts,
                                        },
                                      });
                                    };

                                    return (
                                      <div
                                        key={parentVal}
                                        className="space-y-2 p-3 bg-background border rounded shadow-sm"
                                      >
                                        <div className="flex items-center justify-between">
                                          <Label className="text-primary font-medium">
                                            When &quot;{parentOpt.label}&quot; is selected
                                          </Label>
                                          {childOpts.length > 1 && (
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              className="h-6 px-1.5 text-[10px] hover:bg-primary/10 hover:text-primary transition-colors"
                                              onClick={() => {
                                                const sorted = [...childOpts].sort((a, b) =>
                                                  String(a).localeCompare(String(b)),
                                                );
                                                updateChildOpts(sorted);
                                              }}
                                            >
                                              Sort A-Z
                                            </Button>
                                          )}
                                        </div>

                                        {/* Add new option */}
                                        <div className="flex gap-2">
                                          <Input
                                            id={`child-opt-input-${parentVal}`}
                                            placeholder="Type option and press Enter"
                                            className="text-sm h-8"
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') {
                                                e.preventDefault();
                                                const val = e.currentTarget.value.trim();
                                                if (!val || childOpts.includes(val)) return;
                                                updateChildOpts([...childOpts, val]);
                                                e.currentTarget.value = '';
                                              }
                                            }}
                                          />
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="h-8 px-2 shrink-0"
                                            onClick={() => {
                                              const input = document.getElementById(
                                                `child-opt-input-${parentVal}`,
                                              ) as HTMLInputElement | null;
                                              const val = input?.value?.trim();
                                              if (!val || childOpts.includes(val)) return;
                                              updateChildOpts([...childOpts, val]);
                                              if (input) input.value = '';
                                            }}
                                          >
                                            <Plus className="h-4 w-4" />
                                          </Button>
                                        </div>

                                        {/* Option chips */}
                                        {childOpts.length > 0 ? (
                                          <div className="flex flex-wrap gap-1 pt-1">
                                            {childOpts.map((opt, idx) => (
                                              <span
                                                key={`${parentVal}-${idx}-${opt}`}
                                                className="inline-flex items-center gap-1 bg-muted rounded px-2 py-0.5 text-xs font-medium"
                                              >
                                                {opt}
                                                <button
                                                  type="button"
                                                  className="text-muted-foreground hover:text-destructive ml-1 leading-none"
                                                  onClick={() =>
                                                    updateChildOpts(
                                                      childOpts.filter((_, i) => i !== idx),
                                                    )
                                                  }
                                                >
                                                  ×
                                                </button>
                                              </span>
                                            ))}
                                          </div>
                                        ) : (
                                          <p className="text-xs text-muted-foreground">
                                            No options added yet for this parent value.
                                          </p>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            }

                            return (
                              <div className="p-4 border border-dashed rounded-md bg-muted/20 text-center">
                                <p className="text-sm text-muted-foreground">
                                  The parent field does not have static options defined yet.
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Please configure the parent subfield's options first to set up
                                  mapping.
                                </p>
                              </div>
                            );
                          })()
                        )}
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Options Section */}
                {!subFieldConfig.dependentOn &&
                  (subFieldConfig.type === 'dropdown' ||
                    subFieldConfig.type === 'chooseButton') && (
                    <div className="space-y-4 border-t pt-4">
                      <h3 className="text-sm font-semibold">Options Configuration</h3>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Allow Reselection</Label>
                          <p className="text-xs text-muted-foreground">
                            Allow users to clear or reselect the value
                          </p>
                        </div>
                        <Switch
                          checked={subFieldConfig.metadata?.allowReselection || false}
                          onCheckedChange={(checked) => {
                            setSubFieldConfig({
                              ...subFieldConfig,
                              metadata: {
                                ...subFieldConfig.metadata,
                                allowReselection: checked,
                              },
                            });
                          }}
                        />
                      </div>

                      {!(
                        subFieldConfig.type === 'dropdown' &&
                        subFieldConfig.metadata !== undefined &&
                        (subFieldConfig.metadata?.referenceFieldId !== undefined ||
                          subFieldConfig.metadata?.referenceFieldName !== undefined)
                      ) &&
                        subFieldConfig.type === 'dropdown' &&
                        (() => {
                          const inferred =
                            subFieldConfig.metadata &&
                            typeof (subFieldConfig.metadata as Record<string, unknown>)
                              .optionsSourceMode === 'string'
                              ? String(
                                  (subFieldConfig.metadata as Record<string, unknown>)
                                    .optionsSourceMode,
                                )
                              : subFieldConfig.optionsUrl !== undefined
                                ? 'url'
                                : typeof subFieldConfig.globalMasterKey === 'string' &&
                                    subFieldConfig.globalMasterKey
                                  ? 'referenceGlobalMaster'
                                  : 'static';

                          const mode =
                            inferred === 'static' ||
                            inferred === 'url' ||
                            inferred === 'globalMaster' ||
                            inferred === 'referenceGlobalMaster' ||
                            inferred === 'coverSelection'
                              ? inferred
                              : 'static';

                          const setMode = (
                            next:
                              | 'static'
                              | 'url'
                              | 'globalMaster'
                              | 'referenceGlobalMaster'
                              | 'coverSelection',
                          ) => {
                            setSubFieldSelectedGlobalMaster(null);
                            setSubFieldSelectedMasterValues(new Set());
                            setSubFieldConfig({
                              ...subFieldConfig,
                              options: next === 'static' ? [] : undefined,
                              optionsUrl: next === 'url' ? '' : undefined,
                              globalMasterKey: undefined,
                              defaultValue: undefined,
                              metadata: (() => {
                                const nextMeta = {
                                  ...(subFieldConfig.metadata || {}),
                                  globalMasterId: undefined,
                                  selectedMasterValues: undefined,
                                  optionsSourceMode: next,
                                };
                                delete nextMeta.allowOther;
                                return nextMeta;
                              })(),
                            });
                          };

                          const renderManualOptions = () => (
                            <div className="space-y-2">
                              <Label>Options *</Label>
                              <p className="text-xs text-muted-foreground">
                                Add options by typing and pressing Enter. Each option will appear
                                below.
                              </p>

                              <div className="flex gap-2">
                                <Input
                                  placeholder="Type option and press Enter"
                                  className="text-sm h-8"
                                  onKeyDown={(e) => {
                                    if (e.key !== 'Enter') return;
                                    e.preventDefault();

                                    const input = e.currentTarget;
                                    const value = input.value.trim();
                                    if (!value) return;

                                    const existing = (subFieldConfig.options || []).map((opt) =>
                                      typeof opt === 'string' ? opt : opt.label,
                                    );

                                    if (!existing.includes(value)) {
                                      const nextOptions = [...(subFieldConfig.options || []), value].sort(
                                        (a, b) => {
                                          const valA = typeof a === 'string' ? a : a?.label || '';
                                          const valB = typeof b === 'string' ? b : b?.label || '';
                                          return valA.localeCompare(valB);
                                        },
                                      );
                                      setSubFieldConfig({
                                        ...subFieldConfig,
                                        options: nextOptions,
                                      });
                                      setSubFieldOptionIds(
                                        createStableOptionIds(nextOptions.length, 'subfield-opt'),
                                      );
                                      setSubFieldPreviewKey(prev => prev + 1);
                                      input.value = '';
                                    }
                                  }}
                                />

                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-2"
                                  onClick={(e) => {
                                    const input = e.currentTarget
                                      .previousElementSibling as HTMLInputElement;

                                    const value = input?.value?.trim();
                                    if (!value) return;

                                    const existing = (subFieldConfig.options || []).map((opt) =>
                                      typeof opt === 'string' ? opt : opt.label,
                                    );

                                    if (!existing.includes(value)) {
                                      const nextOptions = [...(subFieldConfig.options || []), value].sort(
                                        (a, b) => {
                                          const valA = typeof a === 'string' ? a : a?.label || '';
                                          const valB = typeof b === 'string' ? b : b?.label || '';
                                          return valA.localeCompare(valB);
                                        },
                                      );
                                      setSubFieldConfig({
                                        ...subFieldConfig,
                                        options: nextOptions,
                                      });
                                      setSubFieldOptionIds(
                                        createStableOptionIds(nextOptions.length, 'subfield-opt'),
                                      );
                                      setSubFieldPreviewKey(prev => prev + 1);
                                      input.value = '';
                                    }
                                  }}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="flex flex-col gap-2 pt-2 w-full">
                                {subFieldConfig.options && subFieldConfig.options.length > 1 && (
                                  <div className="flex justify-start gap-2 mb-1">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-xs"
                                      onClick={() => {
                                        const sorted = [...(subFieldConfig.options || [])].sort(
                                          (a, b) => {
                                            const valA = typeof a === 'string' ? a : a?.label || '';
                                            const valB = typeof b === 'string' ? b : b?.label || '';
                                            return valA.localeCompare(valB);
                                          },
                                        );
                                        setSubFieldConfig({ ...subFieldConfig, options: sorted });
                                        setSubFieldOptionIds(
                                          createStableOptionIds(sorted.length, 'subfield-opt'),
                                        );
                                        setSubFieldPreviewKey(prev => prev + 1);
                                      }}
                                    >
                                      Sort A-Z
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-xs"
                                      onClick={() => {
                                        const sorted = [...(subFieldConfig.options || [])].sort(
                                          (a, b) => {
                                            const valA = typeof a === 'string' ? a : a?.label || '';
                                            const valB = typeof b === 'string' ? b : b?.label || '';
                                            return valB.localeCompare(valA);
                                          },
                                        );
                                        setSubFieldConfig({ ...subFieldConfig, options: sorted });
                                        setSubFieldOptionIds(
                                          createStableOptionIds(sorted.length, 'subfield-opt'),
                                        );
                                        setSubFieldPreviewKey(prev => prev + 1);
                                      }}
                                    >
                                      Sort Z-A
                                    </Button>
                                  </div>
                                )}
                                <div className="w-full relative">
                                  {(subFieldConfig.options || []).map((option, idx) => {
                                    const stableId =
                                      subFieldOptionIds[idx] || `subfield-opt-fallback-${idx}`;
                                    const isDragging =
                                      activeDragItem?.scope === 'subFieldOptions' &&
                                      activeDragItem.index === idx;
                                    const isDragOver =
                                      dragOverItem?.scope === 'subFieldOptions' &&
                                      dragOverItem.index === idx;
                                    return (
                                      <div
                                        key={stableId}
                                        className={cn(
                                          'mb-2 rounded-md bg-background transition-all',
                                          isDragging && 'opacity-60 shadow-lg',
                                          isDragOver && !isDragging && 'ring-2 ring-primary/30 border border-primary/20',
                                        )}
                                        onDragOver={(event) =>
                                          handleDragOverItem(event, 'subFieldOptions', idx)
                                        }
                                        onDrop={(event) =>
                                          handleDropItem(event, 'subFieldOptions', idx)
                                        }
                                      >
                                        <div className="flex items-center gap-2">
                                          <div
                                            draggable
                                            onDragStart={(event) =>
                                              startDrag(event, 'subFieldOptions', idx)
                                            }
                                            onDragEnd={handleDragEnd}
                                            className={cn(
                                              'flex cursor-grab items-center rounded border border-border/60 bg-muted/30 px-2 py-2 transition-colors',
                                              isDragging && 'cursor-grabbing bg-primary/10 text-primary',
                                            )}
                                          >
                                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                                          </div>
                                          <Input
                                            value={
                                              typeof option === 'string'
                                                ? option
                                                : option.label || ''
                                            }
                                            className="h-8 text-sm"
                                            onChange={(e) => {
                                              updateOptionAtIndex(
                                                'subField',
                                                subFieldConfig.options,
                                                idx,
                                                e.target.value,
                                                (nextOptions) =>
                                                  setSubFieldConfig({
                                                    ...subFieldConfig,
                                                    options: nextOptions,
                                                  }),
                                              );
                                            }}
                                            onBlur={() => clearOptionEditError('subField', idx)}
                                          />
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-2 text-destructive hover:text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                                            onClick={() => {
                                              const nextOptions = (subFieldConfig.options || []).filter(
                                                (_, i) => i !== idx,
                                              );
                                              clearOptionEditError('subField', idx);
                                              setSubFieldConfig({
                                                ...subFieldConfig,
                                                options: nextOptions,
                                              });
                                              setSubFieldOptionIds((current) =>
                                                current.filter((_, i) => i !== idx),
                                              );
                                              setSubFieldPreviewKey(prev => prev + 1);
                                            }}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                        {optionEditError?.scope === 'subField' &&
                                          optionEditError.index === idx && (
                                            <p className="mt-1 text-xs text-destructive">
                                              {optionEditError.message}
                                            </p>
                                          )}
                                      </div>
                                    );
                                  })}
                                </div>
                                {subFieldBlankOptionIndexes.length > 0 && (
                                  <p className="text-xs text-destructive">
                                    Option name is required and cannot be blank.
                                  </p>
                                )}
                              </div>
                            </div>
                          );

                          const renderGlobalMaster = () => (
                            <div className="space-y-3">
                              <div className="space-y-2">
                                <Label>Step 1: Select Global Master</Label>
                                <SearchableGlobalMasterSelect
                                  masters={globalMasters as GlobalMasterLite[]}
                                  value={subFieldSelectedGlobalMaster?.id || ''}
                                  loading={isLoadingGlobalMasters}
                                  onChange={(masterId) => {
                                    const master =
                                      (globalMasters as GlobalMasterLite[]).find(
                                        (m) => m.id === masterId,
                                      ) ?? null;
                                    setSubFieldConfig({
                                      ...subFieldConfig,
                                      options: undefined,
                                      globalMasterKey: undefined,
                                      defaultValue: undefined,
                                      metadata: {
                                        ...(subFieldConfig.metadata || {}),
                                        globalMasterId: undefined,
                                        selectedMasterValues: undefined,
                                        optionsSourceMode: mode,
                                      },
                                    });
                                    setSubFieldSelectedGlobalMaster(master);
                                    const allValues = master?.values
                                      ? master.values.map((v) => v.valueLabel)
                                      : [];
                                    setSubFieldSelectedMasterValues(new Set(allValues));
                                  }}
                                />
                              </div>

                              {mode === 'globalMaster' && subFieldSelectedGlobalMaster && (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Label>
                                      Step 2: Select Values ({subFieldSelectedMasterValues.size}{' '}
                                      selected)
                                    </Label>
                                    <div className="flex gap-2">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          const allValues = (
                                            subFieldSelectedGlobalMaster.values || []
                                          ).map((v) => v.valueLabel);
                                          setSubFieldSelectedMasterValues(new Set(allValues));
                                        }}
                                      >
                                        Select All
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSubFieldSelectedMasterValues(new Set())}
                                      >
                                        Clear
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1">
                                    {(subFieldSelectedGlobalMaster.values || [])
                                      .slice()
                                      .sort((a, b) =>
                                        (a.valueLabel || '').localeCompare(b.valueLabel || ''),
                                      )
                                      .map((value) => (
                                        <label
                                          key={value.id}
                                          className="flex items-center gap-2 p-1 hover:bg-muted rounded cursor-pointer"
                                        >
                                          <Checkbox
                                            checked={subFieldSelectedMasterValues.has(
                                              value.valueLabel,
                                            )}
                                            onCheckedChange={(checked) => {
                                              const next = new Set(subFieldSelectedMasterValues);
                                              if (checked) next.add(value.valueLabel);
                                              else next.delete(value.valueLabel);
                                              setSubFieldSelectedMasterValues(next);
                                            }}
                                          />
                                          <span className="text-sm">{value.valueLabel}</span>
                                        </label>
                                      ))}
                                  </div>
                                  <Button
                                    type="button"
                                    size="sm"
                                    className="w-full"
                                    disabled={
                                      subFieldSelectedMasterValues.size === 0 ||
                                      isApplyingSubFieldSelection ||
                                      (subFieldConfig.metadata &&
                                        typeof (subFieldConfig.metadata as Record<string, unknown>)
                                          .optionsSourceMode === 'string' &&
                                        String(
                                          (subFieldConfig.metadata as Record<string, unknown>)
                                            .optionsSourceMode,
                                        ) === 'globalMaster' &&
                                        typeof (subFieldConfig.metadata as Record<string, unknown>)
                                          .globalMasterId === 'string' &&
                                        String(
                                          (subFieldConfig.metadata as Record<string, unknown>)
                                            .globalMasterId,
                                        ) === subFieldSelectedGlobalMaster.id &&
                                        matchesAppliedSelection(
                                          (subFieldConfig.metadata as Record<string, unknown>)
                                            .selectedMasterValues,
                                          subFieldSelectedMasterValues as Set<string>,
                                        ))
                                    }
                                    onClick={() => {
                                      startApplyingSubFieldSelection(() => {
                                        const appliedSelectedValues = Array.from(
                                          subFieldSelectedMasterValues as Set<string>,
                                        ).sort((a, b) => String(a).localeCompare(String(b)));
                                        const optionValues = Array.from(
                                          subFieldSelectedMasterValues as Set<string>,
                                        );
                                        setSubFieldConfig({
                                          ...subFieldConfig,
                                          optionsUrl: undefined,
                                          options: optionValues
                                            .slice()
                                            .sort((a, b) => String(a).localeCompare(String(b))),
                                          globalMasterKey: subFieldSelectedGlobalMaster.masterKey,
                                          metadata: {
                                            ...(subFieldConfig.metadata || {}),
                                            globalMasterId: subFieldSelectedGlobalMaster.id,
                                            selectedMasterValues: appliedSelectedValues,
                                            optionsSourceMode: 'globalMaster',
                                          },
                                        });
                                      });
                                    }}
                                  >
                                    {isApplyingSubFieldSelection && (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    )}
                                    {isApplyingSubFieldSelection
                                      ? 'Applying Selection...'
                                      : 'Apply Selection'}
                                  </Button>
                                </div>
                              )}

                              {mode === 'referenceGlobalMaster' && subFieldSelectedGlobalMaster && (
                                <div className="space-y-2">
                                  <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1">
                                    {(subFieldSelectedGlobalMaster.values || []).map((value) => (
                                      <div
                                        key={value.id}
                                        className="flex items-center gap-2 p-1 hover:bg-muted rounded"
                                      >
                                        <Checkbox checked disabled />
                                        <span className="text-sm">{value.valueLabel}</span>
                                      </div>
                                    ))}
                                  </div>
                                  <Button
                                    type="button"
                                    size="sm"
                                    className="w-full"
                                    variant={
                                      subFieldConfig.metadata &&
                                      typeof (subFieldConfig.metadata as Record<string, unknown>)
                                        .optionsSourceMode === 'string' &&
                                      String(
                                        (subFieldConfig.metadata as Record<string, unknown>)
                                          .optionsSourceMode,
                                      ) === 'referenceGlobalMaster' &&
                                      typeof (subFieldConfig.metadata as Record<string, unknown>)
                                        .globalMasterId === 'string' &&
                                      String(
                                        (subFieldConfig.metadata as Record<string, unknown>)
                                          .globalMasterId,
                                      ) === subFieldSelectedGlobalMaster.id
                                        ? 'secondary'
                                        : 'default'
                                    }
                                    disabled={
                                      subFieldConfig.metadata &&
                                      typeof (subFieldConfig.metadata as Record<string, unknown>)
                                        .optionsSourceMode === 'string' &&
                                      String(
                                        (subFieldConfig.metadata as Record<string, unknown>)
                                          .optionsSourceMode,
                                      ) === 'referenceGlobalMaster' &&
                                      typeof (subFieldConfig.metadata as Record<string, unknown>)
                                        .globalMasterId === 'string' &&
                                      String(
                                        (subFieldConfig.metadata as Record<string, unknown>)
                                          .globalMasterId,
                                      ) === subFieldSelectedGlobalMaster.id
                                    }
                                    onClick={() => {
                                      setSubFieldConfig({
                                        ...subFieldConfig,
                                        optionsUrl: undefined,
                                        options: undefined,
                                        globalMasterKey: subFieldSelectedGlobalMaster.masterKey,
                                        metadata: {
                                          ...(subFieldConfig.metadata || {}),
                                          globalMasterId: subFieldSelectedGlobalMaster.id,
                                          optionsSourceMode: 'referenceGlobalMaster',
                                        },
                                      });
                                      toast({
                                        title: 'Success',
                                        description: `Sub-field is now referencing ${subFieldSelectedGlobalMaster.displayLabel}.`,
                                      });
                                    }}
                                  >
                                    {subFieldConfig.metadata &&
                                    typeof (subFieldConfig.metadata as Record<string, unknown>)
                                      .optionsSourceMode === 'string' &&
                                    String(
                                      (subFieldConfig.metadata as Record<string, unknown>)
                                        .optionsSourceMode,
                                    ) === 'referenceGlobalMaster' &&
                                    typeof (subFieldConfig.metadata as Record<string, unknown>)
                                      .globalMasterId === 'string' &&
                                    String(
                                      (subFieldConfig.metadata as Record<string, unknown>)
                                        .globalMasterId,
                                    ) === subFieldSelectedGlobalMaster.id
                                      ? 'Referenced'
                                      : 'Reference Global Master'}
                                  </Button>
                                </div>
                              )}
                            </div>
                          );

                          const renderUrl = () => (
                            <div className="space-y-2">
                              <Label>Options URL</Label>
                              <Input
                                type="url"
                                value={subFieldConfig.optionsUrl || ''}
                                onChange={(e) =>
                                  setSubFieldConfig({
                                    ...subFieldConfig,
                                    optionsUrl: e.target.value,
                                  })
                                }
                                placeholder="https://api.example.com/countries"
                              />
                              <p className="text-xs text-muted-foreground">
                                URL endpoint that returns JSON array of options. Expected format:
                                [&quot;Option 1&quot;, &quot;Option 2&quot;, ...]
                              </p>
                            </div>
                          );

                          return (
                            <>
                              <div className="space-y-2">
                                <Label>Options Source</Label>
                                <Select value={mode} onValueChange={setMode}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="static">Provide option manually</SelectItem>
                                    <SelectItem value="url">Fetch from URL</SelectItem>
                                    <SelectItem value="coverSelection">
                                      Fetch from Covers
                                    </SelectItem>
                                    <SelectItem value="globalMaster">
                                      Fetch from Global Master
                                    </SelectItem>
                                    <SelectItem value="referenceGlobalMaster">
                                      Reference Global Master
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {mode === 'coverSelection' ? (
                                <div className="space-y-2">
                                  <p className="text-xs text-muted-foreground">
                                    Options will be populated automatically from this product&apos;s
                                    covers.
                                  </p>
                                </div>
                              ) : mode === 'url' ? (
                                renderUrl()
                              ) : mode === 'globalMaster' || mode === 'referenceGlobalMaster' ? (
                                renderGlobalMaster()
                              ) : (
                                renderManualOptions()
                              )}

                              {subFieldConfig.type === 'dropdown' && (
                                <div className="flex items-center gap-2 pt-1">
                                  <Checkbox
                                    checked={
                                      String(subFieldConfig.metadata?.allowOther) === 'true'
                                    }
                                    onCheckedChange={(checked) => {
                                      const nextMeta: Record<string, unknown> = {
                                        ...(subFieldConfig.metadata || {}),
                                      };
                                      if (checked) {
                                        nextMeta.allowOther = 'true';
                                      } else {
                                        delete nextMeta.allowOther;
                                      }
                                      setSubFieldConfig({
                                        ...subFieldConfig,
                                        metadata:
                                          Object.keys(nextMeta).length > 0 ? nextMeta : undefined,
                                      });
                                      setSubFieldPreviewKey((prev) => prev + 1);
                                    }}
                                  />
                                  <Label>Allow Other (free text)</Label>
                                </div>
                              )}
                            </>
                          );
                        })()}

                      {!(
                        subFieldConfig.type === 'dropdown' &&
                        subFieldConfig.metadata !== undefined &&
                        (subFieldConfig.metadata?.referenceFieldId !== undefined ||
                          subFieldConfig.metadata?.referenceFieldName !== undefined)
                      ) &&
                        subFieldConfig.type === 'chooseButton' && (
                          <div className="space-y-2">
                            <Label>Options *</Label>
                            <p className="text-xs text-muted-foreground">
                              Add options by typing and pressing Enter. Each will appear as a button.
                            </p>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Type option and press Enter"
                                className="text-sm h-8"
                                onKeyDown={(e) => {
                                  if (e.key !== 'Enter') return;
                                  e.preventDefault();
                                  const input = e.currentTarget;
                                  const value = input.value.trim();
                                  if (!value) return;
                                  const existing = (subFieldConfig.options || []).map((opt) =>
                                    typeof opt === 'string' ? opt : opt.label,
                                  );
                                  if (!existing.includes(value)) {
                                    const nextOptions = [...(subFieldConfig.options || []), value];
                                    setSubFieldConfig({
                                      ...subFieldConfig,
                                      options: nextOptions,
                                    });
                                    setSubFieldOptionIds((current) => [
                                      ...current,
                                      ...createStableOptionIds(1, 'subfield-opt'),
                                    ]);
                                    setSubFieldPreviewKey(prev => prev + 1);
                                    input.value = '';
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 px-2"
                                onClick={(e) => {
                                  const input = e.currentTarget
                                    .previousElementSibling as HTMLInputElement;
                                  const value = input?.value?.trim();
                                  if (!value) return;
                                  const existing = (subFieldConfig.options || []).map((opt) =>
                                    typeof opt === 'string' ? opt : opt.label,
                                  );
                                  if (!existing.includes(value)) {
                                    const nextOptions = [...(subFieldConfig.options || []), value];
                                    setSubFieldConfig({
                                      ...subFieldConfig,
                                      options: nextOptions,
                                    });
                                    setSubFieldOptionIds((current) => [
                                      ...current,
                                      ...createStableOptionIds(1, 'subfield-opt'),
                                    ]);
                                    setSubFieldPreviewKey(prev => prev + 1);
                                    input.value = '';
                                  }
                                }}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            {subFieldConfig.options && subFieldConfig.options.length > 0 && (
                              <div className="flex flex-col gap-2 mt-2 mb-2 w-full">
                                {subFieldConfig.options.length > 1 && (
                                  <div className="flex justify-start gap-2 mb-1">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-xs"
                                      onClick={() => {
                                        const sorted = [...(subFieldConfig.options || [])].sort(
                                          (a, b) => {
                                            const valA = typeof a === 'string' ? a : a?.label || '';
                                            const valB = typeof b === 'string' ? b : b?.label || '';
                                            return valA.localeCompare(valB);
                                          },
                                        );
                                        setSubFieldConfig({ ...subFieldConfig, options: sorted });
                                        setSubFieldOptionIds(
                                          createStableOptionIds(sorted.length, 'subfield-opt'),
                                        );
                                        setSubFieldPreviewKey(prev => prev + 1);
                                      }}
                                    >
                                      Sort A-Z
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-xs"
                                      onClick={() => {
                                        const sorted = [...(subFieldConfig.options || [])].sort(
                                          (a, b) => {
                                            const valA = typeof a === 'string' ? a : a?.label || '';
                                            const valB = typeof b === 'string' ? b : b?.label || '';
                                            return valB.localeCompare(valA);
                                          },
                                        );
                                        setSubFieldConfig({ ...subFieldConfig, options: sorted });
                                        setSubFieldOptionIds(
                                          createStableOptionIds(sorted.length, 'subfield-opt'),
                                        );
                                        setSubFieldPreviewKey(prev => prev + 1);
                                      }}
                                    >
                                      Sort Z-A
                                    </Button>
                                  </div>
                                )}
                                
                                <div className="w-full relative">
                                  {(subFieldConfig.options || []).map((option, idx) => {
                                    const stableId =
                                      subFieldOptionIds[idx] || `subfield-opt-fallback-${idx}`;
                                    const isDragging =
                                      activeDragItem?.scope === 'subFieldChooseButton' &&
                                      activeDragItem.index === idx;
                                    const isDragOver =
                                      dragOverItem?.scope === 'subFieldChooseButton' &&
                                      dragOverItem.index === idx;
                                    return (
                                      <div
                                        key={stableId}
                                        className={cn(
                                          'mb-2 rounded-md bg-background transition-all',
                                          isDragging && 'opacity-60 shadow-lg',
                                          isDragOver && !isDragging && 'ring-2 ring-primary/30 border border-primary/20',
                                        )}
                                        onDragOver={(event) =>
                                          handleDragOverItem(event, 'subFieldChooseButton', idx)
                                        }
                                        onDrop={(event) =>
                                          handleDropItem(event, 'subFieldChooseButton', idx)
                                        }
                                      >
                                        <div className="flex items-center gap-2">
                                          <div
                                            draggable
                                            onDragStart={(event) =>
                                              startDrag(event, 'subFieldChooseButton', idx)
                                            }
                                            onDragEnd={handleDragEnd}
                                            className={cn(
                                              'flex cursor-grab items-center rounded border border-border/60 bg-muted/30 px-2 py-2 transition-colors',
                                              isDragging && 'cursor-grabbing bg-primary/10 text-primary',
                                            )}
                                          >
                                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                                          </div>
                                          <Input
                                            value={
                                              typeof option === 'string'
                                                ? option
                                                : option?.label || ''
                                            }
                                            className="h-8 text-sm"
                                            onChange={(e) => {
                                              updateOptionAtIndex(
                                                'subField',
                                                subFieldConfig.options,
                                                idx,
                                                e.target.value,
                                                (nextOptions) =>
                                                  setSubFieldConfig({
                                                    ...subFieldConfig,
                                                    options: nextOptions,
                                                  }),
                                              );
                                            }}
                                            onBlur={() => clearOptionEditError('subField', idx)}
                                          />
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-2 text-destructive hover:text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200 cursor-pointer"
                                            onClick={() => {
                                              const nextOptions = (subFieldConfig.options || []).filter(
                                                (_, i) => i !== idx,
                                              );
                                              clearOptionEditError('subField', idx);
                                              setSubFieldConfig({
                                                ...subFieldConfig,
                                                options:
                                                  nextOptions.length > 0 ? nextOptions : undefined,
                                              });
                                              setSubFieldOptionIds((current) =>
                                                current.filter((_, i) => i !== idx),
                                              );
                                              setSubFieldPreviewKey(prev => prev + 1);
                                            }}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                        {optionEditError?.scope === 'subField' &&
                                          optionEditError.index === idx && (
                                            <p className="mt-1 text-xs text-destructive">
                                              {optionEditError.message}
                                            </p>
                                          )}
                                      </div>
                                    );
                                  })}
                                </div>
                                
                                {subFieldBlankOptionIndexes.length > 0 && (
                                  <p className="text-xs text-destructive">
                                    Option name is required and cannot be blank.
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                  )}

                {/* Date Configuration */}
                {subFieldConfig.type === 'date' && (
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="text-sm font-semibold">Date Configuration</h3>
                    <div className="space-y-2">
                      <Label>Period Calculation Unit</Label>
                      <Select
                        value={subFieldConfig.periodCalculationUnit || 'months'}
                        onValueChange={(value: 'days' | 'months' | 'years') => {
                          setSubFieldConfig({
                            ...subFieldConfig,
                            periodCalculationUnit: value,
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="days">Days</SelectItem>
                          <SelectItem value="months">Months</SelectItem>
                          <SelectItem value="years">Years</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Unit for calculating time periods involving this date (e.g., age in Years)
                      </p>
                    </div>
                  </div>
                )}

                {/* Date Period Configuration */}
                {subFieldConfig.type === 'datePeriod' && (
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="text-sm font-semibold">Date Period Configuration</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>From Date Label</Label>
                        <Input
                          value={subFieldConfig.fromDateLabel || 'From Date'}
                          onChange={(e) =>
                            setSubFieldConfig({
                              ...subFieldConfig,
                              fromDateLabel: e.target.value,
                            })
                          }
                          placeholder="e.g., Start Date"
                        />
                        <p className="text-xs text-muted-foreground">
                          Label for the "from" date field
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>To Date Label</Label>
                        <Input
                          value={subFieldConfig.toDateLabel || 'To Date'}
                          onChange={(e) =>
                            setSubFieldConfig({
                              ...subFieldConfig,
                              toDateLabel: e.target.value,
                            })
                          }
                          placeholder="e.g., End Date"
                        />
                        <p className="text-xs text-muted-foreground">
                          Label for the "to" date field
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Period Calculation Unit</Label>
                      <Select
                        value={subFieldConfig.periodCalculationUnit || 'months'}
                        onValueChange={(value: 'days' | 'months' | 'years') => {
                          setSubFieldConfig({
                            ...subFieldConfig,
                            periodCalculationUnit: value,
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="days">Days</SelectItem>
                          <SelectItem value="months">Months</SelectItem>
                          <SelectItem value="years">Years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Conditional Logic */}
                <div className="space-y-4 border-t pt-4">
                  <div className="space-y-2">
                    <Label>Conditional Logic</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        setConditionalLogicTarget('subfield');
                        setIsConditionalLogicDialogOpen(true);
                      }}
                    >
                      <GitBranch className="mr-2 h-4 w-4" />
                      Configure Conditional Logic
                    </Button>
                  </div>
                </div>

                {shouldShowSubFieldCustomerNameToggle && (
                  <div className="space-y-2 border-t pt-4">
                    <Label>Customer Name Field</Label>
                    <div className="flex items-center gap-3 rounded-lg border bg-background p-3">
                      <Switch
                        checked={
                          subFieldConfig.metadata?.isCustomerName === true ||
                          String(subFieldConfig.metadata?.isCustomerName).toLowerCase() === 'true'
                        }
                        disabled={isSubFieldCustomerNameToggleDisabled}
                        onCheckedChange={(checked) =>
                          setSubFieldConfig({
                            ...subFieldConfig,
                            metadata: {
                              ...(subFieldConfig.metadata || {}),
                              isCustomerName: checked,
                            },
                          })
                        }
                      />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Mark this as the customer name</p>
                        <p className="text-xs text-muted-foreground">
                          {isSubFieldCustomerNameToggleDisabled
                            ? 'This field is already mapped as the customer name and cannot be changed here.'
                            : 'Only one text field in the full customer template can use this setting.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Preview & Validations */}
              <div className="space-y-6 border-t pt-6">
                {/* Field Preview Card */}
                <div className="border rounded-lg bg-background shadow-sm">
                  <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b">
                    <div>
                      <h3 className="text-sm font-semibold tracking-tight">Field Preview</h3>
                      <p className="text-xs text-muted-foreground">
                        Preview how this field will appear in the form
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                      Preview
                    </Badge>
                  </div>
                  <div className="p-4">
                    {subFieldConfig.label ? (
                      <div key={`subfield-preview-${subFieldPreviewKey}-${subFieldConfig.type}-${(subFieldConfig.options || []).length}`}>
                        {renderFieldPreview({
                          id: 'preview',
                          type: subFieldConfig.type as FieldType,
                          label: subFieldConfig.label,
                          name: subFieldConfig.name || '',
                          placeholder: subFieldConfig.placeholder,
                          required: subFieldConfig.required,
                          defaultValue: subFieldConfig.defaultValue,
                          options: subFieldConfig.options,
                          note: subFieldConfig.note,
                          fromDateLabel: subFieldConfig.fromDateLabel,
                          toDateLabel: subFieldConfig.toDateLabel,
                          periodCalculationUnit: subFieldConfig.periodCalculationUnit,
                        } as Field)}
                      </div>
                    ) : (
                      <div className="p-6 text-center text-muted-foreground border border-dashed rounded-lg">
                        <p className="text-sm">Enter a field label to see preview</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Validations Section */}
                <div className="pt-2">
                  <div className="space-y-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold tracking-tight">Validations</h3>
                        <Badge
                          variant="outline"
                          className="text-[10px] uppercase tracking-wide bg-background/60"
                        >
                          Rules
                        </Badge>
                      </div>
                    </div>
                    {(subFieldConfig.type === 'text' || subFieldConfig.type === 'textarea') && (
                      <div className="space-y-3 p-4 border rounded-lg bg-background">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm">Min Characters</Label>
                            <Input
                              type="number"
                              min="1"
                              placeholder="e.g., 3"
                              value={
                                subFieldConfig.validations?.find((v) => v.type === 'minLength')
                                  ?.value != null
                                  ? String(
                                      subFieldConfig.validations.find(
                                        (v) => v.type === 'minLength',
                                      )!.value,
                                    )
                                  : ''
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                const validations = subFieldConfig.validations || [];
                                const existing = validations.findIndex(
                                  (v) => v.type === 'minLength',
                                );
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
                                setSubFieldConfig({ ...subFieldConfig, validations });
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">Max Characters</Label>
                            <Input
                              type="number"
                              min="1"
                              placeholder="e.g., 100"
                              value={
                                subFieldConfig.validations?.find((v) => v.type === 'maxLength')
                                  ?.value != null
                                  ? String(
                                      subFieldConfig.validations.find(
                                        (v) => v.type === 'maxLength',
                                      )!.value,
                                    )
                                  : ''
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                const validations = subFieldConfig.validations || [];
                                const existing = validations.findIndex(
                                  (v) => v.type === 'maxLength',
                                );
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
                                setSubFieldConfig({ ...subFieldConfig, validations });
                              }}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Format</Label>
                          <Select
                            value={
                              subFieldConfig.validations?.find((v) =>
                                ['email', 'url', 'phone'].includes(v.type),
                              )?.type || undefined
                            }
                            onValueChange={(value) => {
                              const validations = subFieldConfig.validations || [];
                              const existing = validations.findIndex((v) =>
                                ['email', 'url', 'phone'].includes(v.type),
                              );
                              if (existing >= 0) {
                                validations.splice(existing, 1);
                              }
                              if (value) {
                                validations.push({ type: value });
                              }
                              setSubFieldConfig({ ...subFieldConfig, validations });
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
                          {subFieldConfig.validations?.find((v) =>
                            ['email', 'url', 'phone'].includes(v.type),
                          ) && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={() => {
                                const validations = subFieldConfig.validations || [];
                                const existing = validations.findIndex((v) =>
                                  ['email', 'url', 'phone'].includes(v.type),
                                );
                                if (existing >= 0) {
                                  validations.splice(existing, 1);
                                  setSubFieldConfig({ ...subFieldConfig, validations });
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
                              subFieldConfig.validations?.find((v) => v.type === 'pattern')
                                ?.value || ''
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              const validations = subFieldConfig.validations || [];
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
                              setSubFieldConfig({ ...subFieldConfig, validations });
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {subFieldConfig.type === 'number' &&
                      (() => {
                        const isPhoneNumber =
                          subFieldConfig.metadata?.numberFormat === 'phoneNumber';
                        const minType = isPhoneNumber ? 'minLength' : 'min';
                        const maxType = isPhoneNumber ? 'maxLength' : 'max';
                        return (
                          <div className="space-y-3 p-4 border rounded-lg bg-background">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-sm">
                                  {isPhoneNumber ? 'Min Length' : 'Min Value'}
                                </Label>
                                <Input
                                  type="number"
                                  step={isPhoneNumber ? '1' : 'any'}
                                  min={isPhoneNumber ? 0 : undefined}
                                  placeholder={isPhoneNumber ? 'e.g., 7' : 'e.g., 0'}
                                  value={
                                    subFieldConfig.validations?.find((v) => v.type === minType)
                                      ?.value != null
                                      ? String(
                                          subFieldConfig.validations.find(
                                            (v) => v.type === minType,
                                          )!.value,
                                        )
                                      : ''
                                  }
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    let validations = [...(subFieldConfig.validations || [])];
                                    const stripOther = () => {
                                      validations = isPhoneNumber
                                        ? validations.filter(
                                            (v) => v.type !== 'min' && v.type !== 'max',
                                          )
                                        : validations.filter(
                                            (v) => v.type !== 'minLength' && v.type !== 'maxLength',
                                          );
                                    };
                                    const existing = validations.findIndex(
                                      (v) => v.type === minType,
                                    );
                                    if (val === '' || val === '-') {
                                      if (existing >= 0) {
                                        validations.splice(existing, 1);
                                      }
                                      stripOther();
                                      setSubFieldConfig({ ...subFieldConfig, validations });
                                      return;
                                    }
                                    const numVal = isPhoneNumber ? parseInt(val, 10) : Number(val);
                                    const isValidForPhone = !isPhoneNumber || numVal >= 0;
                                    if (!isNaN(numVal) && val !== '' && isValidForPhone) {
                                      if (existing >= 0) {
                                        validations[existing] = {
                                          type: minType,
                                          value: numVal,
                                        };
                                      } else {
                                        validations.push({
                                          type: minType,
                                          value: numVal,
                                        });
                                      }
                                      stripOther();
                                      setSubFieldConfig({ ...subFieldConfig, validations });
                                    }
                                  }}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm">
                                  {isPhoneNumber ? 'Max Length' : 'Max Value'}
                                </Label>
                                <Input
                                  type="number"
                                  step={isPhoneNumber ? '1' : 'any'}
                                  min={isPhoneNumber ? 0 : undefined}
                                  placeholder={isPhoneNumber ? 'e.g., 15' : 'e.g., 100'}
                                  value={
                                    subFieldConfig.validations?.find((v) => v.type === maxType)
                                      ?.value != null
                                      ? String(
                                          subFieldConfig.validations.find(
                                            (v) => v.type === maxType,
                                          )!.value,
                                        )
                                      : ''
                                  }
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    let validations = [...(subFieldConfig.validations || [])];
                                    const stripOther = () => {
                                      validations = isPhoneNumber
                                        ? validations.filter(
                                            (v) => v.type !== 'min' && v.type !== 'max',
                                          )
                                        : validations.filter(
                                            (v) => v.type !== 'minLength' && v.type !== 'maxLength',
                                          );
                                    };
                                    const existing = validations.findIndex(
                                      (v) => v.type === maxType,
                                    );
                                    if (val && val !== '' && !isNaN(Number(val))) {
                                      const numVal = isPhoneNumber
                                        ? parseInt(val, 10)
                                        : Number(val);
                                      const isValidForPhone = !isPhoneNumber || numVal >= 0;
                                      if (isValidForPhone) {
                                        if (existing >= 0) {
                                          validations[existing] = {
                                            type: maxType,
                                            value: numVal,
                                          };
                                        } else {
                                          validations.push({
                                            type: maxType,
                                            value: numVal,
                                          });
                                        }
                                      }
                                    } else if (existing >= 0) {
                                      validations.splice(existing, 1);
                                    }
                                    stripOther();
                                    setSubFieldConfig({ ...subFieldConfig, validations });
                                  }}
                                />
                              </div>
                            </div>

                            {(() => {
                              const minVal = subFieldConfig.validations?.find(
                                (v) => v.type === minType,
                              )?.value;
                              const maxVal = subFieldConfig.validations?.find(
                                (v) => v.type === maxType,
                              )?.value;
                              if (minVal != null && maxVal != null && minVal > maxVal) {
                                return (
                                  <p className="text-sm text-destructive mt-2">
                                    {isPhoneNumber
                                      ? 'Min length cannot be greater than Max length'
                                      : 'Min cannot be greater than Max'}
                                  </p>
                                );
                              }
                              return null;
                            })()}

                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <Label className="text-sm">Integer Only</Label>
                                <p className="text-xs text-muted-foreground">No decimal values</p>
                              </div>
                              <Switch
                                checked={
                                  subFieldConfig.validations?.some((v) => v.type === 'integer') ||
                                  false
                                }
                                onCheckedChange={(checked) => {
                                  const validations = subFieldConfig.validations || [];
                                  if (checked) {
                                    const decimalIndex = validations.findIndex(
                                      (v) => v.type === 'decimalPlaces',
                                    );
                                    if (decimalIndex >= 0) {
                                      validations.splice(decimalIndex, 1);
                                    }
                                    if (!validations.some((v) => v.type === 'integer')) {
                                      validations.push({ type: 'integer' });
                                    }
                                  } else {
                                    const integerIndex = validations.findIndex(
                                      (v) => v.type === 'integer',
                                    );
                                    if (integerIndex >= 0) {
                                      validations.splice(integerIndex, 1);
                                    }
                                  }
                                  setSubFieldConfig({ ...subFieldConfig, validations });
                                }}
                                disabled={subFieldConfig.validations?.some(
                                  (v) => v.type === 'decimalPlaces' && (v.value ?? 0) > 0,
                                )}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-sm">Decimal Places</Label>
                              <Input
                                type="number"
                                placeholder="e.g., 2"
                                min="0"
                                max="10"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                onKeyDown={(e) => {
                                  if (['e', 'E', '+', '-', '.', ','].includes(e.key)) {
                                    e.preventDefault();
                                  }
                                }}
                                disabled={subFieldConfig.validations?.some(
                                  (v) => v.type === 'integer',
                                )}
                                value={
                                  subFieldConfig.validations?.find(
                                    (v) => v.type === 'decimalPlaces',
                                  )?.value != null
                                    ? String(
                                        subFieldConfig.validations.find(
                                          (v) => v.type === 'decimalPlaces',
                                        )!.value,
                                      )
                                    : ''
                                }
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const validations = subFieldConfig.validations || [];
                                  const integerIndex = validations.findIndex(
                                    (v) => v.type === 'integer',
                                  );
                                  if (integerIndex >= 0) {
                                    validations.splice(integerIndex, 1);
                                  }
                                  const existing = validations.findIndex(
                                    (v) => v.type === 'decimalPlaces',
                                  );
                                  if (val === '' || val === '0') {
                                    if (existing >= 0) {
                                      validations.splice(existing, 1);
                                    }
                                  } else if (!isNaN(Number(val))) {
                                    const numVal = parseInt(val, 10);
                                    if (existing >= 0) {
                                      validations[existing] = {
                                        type: 'decimalPlaces',
                                        value: numVal,
                                      };
                                    } else {
                                      validations.push({
                                        type: 'decimalPlaces',
                                        value: numVal,
                                      });
                                    }
                                  }
                                  setSubFieldConfig({ ...subFieldConfig, validations });
                                }}
                              />
                            </div>
                          </div>
                        );
                      })()}

                    {subFieldConfig.type === 'date' && (
                      <div className="space-y-3 p-4 border rounded-lg bg-background">
                        {(() => {
                          const hasMinDateToday = subFieldConfig.validations?.some(
                            (v) => v.type === 'minDateToday',
                          );
                          const hasMaxDateToday = subFieldConfig.validations?.some(
                            (v) => v.type === 'maxDateToday',
                          );
                          const hasDaysFromToday = subFieldConfig.validations?.some((v) =>
                            ['minDaysFromToday', 'maxDaysFromToday'].includes(v.type),
                          );
                          const hasFixedDate = subFieldConfig.validations?.some((v) =>
                            ['minDate', 'maxDate'].includes(v.type),
                          );
                          const anyValidationActive =
                            hasMinDateToday || hasMaxDateToday || hasDaysFromToday || hasFixedDate;

                          return (
                            <>
                              <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                  <Label className="text-sm">Must be today or later</Label>
                                  <p className="text-xs text-muted-foreground">
                                    Date cannot be in the past
                                  </p>
                                </div>
                                <Switch
                                  disabled={anyValidationActive && !hasMinDateToday}
                                  checked={hasMinDateToday || false}
                                  onCheckedChange={(checked) => {
                                    const validations = subFieldConfig.validations || [];
                                    if (checked) {
                                      const filtered = validations.filter(
                                        (v) =>
                                          ![
                                            'minDateToday',
                                            'maxDateToday',
                                            'minDaysFromToday',
                                            'maxDaysFromToday',
                                            'minDate',
                                            'maxDate',
                                          ].includes(v.type),
                                      );
                                      filtered.push({ type: 'minDateToday' });
                                      setSubFieldConfig({
                                        ...subFieldConfig,
                                        validations: filtered,
                                      });
                                    } else {
                                      const filtered = validations.filter(
                                        (v) => v.type !== 'minDateToday',
                                      );
                                      setSubFieldConfig({
                                        ...subFieldConfig,
                                        validations: filtered,
                                      });
                                    }
                                  }}
                                />
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                  <Label className="text-sm">Must be today or earlier</Label>
                                  <p className="text-xs text-muted-foreground">
                                    Date cannot be in the future
                                  </p>
                                </div>
                                <Switch
                                  disabled={anyValidationActive && !hasMaxDateToday}
                                  checked={hasMaxDateToday || false}
                                  onCheckedChange={(checked) => {
                                    const validations = subFieldConfig.validations || [];
                                    if (checked) {
                                      const filtered = validations.filter(
                                        (v) =>
                                          ![
                                            'minDateToday',
                                            'maxDateToday',
                                            'minDaysFromToday',
                                            'maxDaysFromToday',
                                            'minDate',
                                            'maxDate',
                                          ].includes(v.type),
                                      );
                                      filtered.push({ type: 'maxDateToday' });
                                      setSubFieldConfig({
                                        ...subFieldConfig,
                                        validations: filtered,
                                      });
                                    } else {
                                      const filtered = validations.filter(
                                        (v) => v.type !== 'maxDateToday',
                                      );
                                      setSubFieldConfig({
                                        ...subFieldConfig,
                                        validations: filtered,
                                      });
                                    }
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
                                    disabled={anyValidationActive && !hasDaysFromToday}
                                    value={
                                      subFieldConfig.validations?.find(
                                        (v) => v.type === 'minDaysFromToday',
                                      )?.value != null
                                        ? String(
                                            subFieldConfig.validations.find(
                                              (v) => v.type === 'minDaysFromToday',
                                            )!.value,
                                          )
                                        : ''
                                    }
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      const validations = subFieldConfig.validations || [];
                                      if (val && val !== '' && !isNaN(Number(val))) {
                                        if (!hasDaysFromToday && anyValidationActive) {
                                          const filtered = validations.filter(
                                            (v) =>
                                              ![
                                                'minDateToday',
                                                'maxDateToday',
                                                'minDaysFromToday',
                                                'maxDaysFromToday',
                                                'minDate',
                                                'maxDate',
                                              ].includes(v.type),
                                          );
                                          filtered.push({
                                            type: 'minDaysFromToday',
                                            value: parseInt(val, 10),
                                          });
                                          setSubFieldConfig({
                                            ...subFieldConfig,
                                            validations: filtered,
                                          });
                                        } else {
                                          const existing = validations.findIndex(
                                            (v) => v.type === 'minDaysFromToday',
                                          );
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
                                          setSubFieldConfig({ ...subFieldConfig, validations });
                                        }
                                      } else {
                                        const existing = validations.findIndex(
                                          (v) => v.type === 'minDaysFromToday',
                                        );
                                        if (existing >= 0) validations.splice(existing, 1);
                                        setSubFieldConfig({ ...subFieldConfig, validations });
                                      }
                                    }}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm">Max Days from Today</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    placeholder="e.g., 365"
                                    disabled={anyValidationActive && !hasDaysFromToday}
                                    value={
                                      subFieldConfig.validations?.find(
                                        (v) => v.type === 'maxDaysFromToday',
                                      )?.value != null
                                        ? String(
                                            subFieldConfig.validations.find(
                                              (v) => v.type === 'maxDaysFromToday',
                                            )!.value,
                                          )
                                        : ''
                                    }
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      const validations = subFieldConfig.validations || [];
                                      if (val && val !== '' && !isNaN(Number(val))) {
                                        if (!hasDaysFromToday && anyValidationActive) {
                                          const filtered = validations.filter(
                                            (v) =>
                                              ![
                                                'minDateToday',
                                                'maxDateToday',
                                                'minDaysFromToday',
                                                'maxDaysFromToday',
                                                'minDate',
                                                'maxDate',
                                              ].includes(v.type),
                                          );
                                          filtered.push({
                                            type: 'maxDaysFromToday',
                                            value: parseInt(val, 10),
                                          });
                                          setSubFieldConfig({
                                            ...subFieldConfig,
                                            validations: filtered,
                                          });
                                        } else {
                                          const existing = validations.findIndex(
                                            (v) => v.type === 'maxDaysFromToday',
                                          );
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
                                          setSubFieldConfig({ ...subFieldConfig, validations });
                                        }
                                      } else {
                                        const existing = validations.findIndex(
                                          (v) => v.type === 'maxDaysFromToday',
                                        );
                                        if (existing >= 0) validations.splice(existing, 1);
                                        setSubFieldConfig({ ...subFieldConfig, validations });
                                      }
                                    }}
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label className="text-sm">Min Date</Label>
                                  <DatePicker
                                    disabled={anyValidationActive && !hasFixedDate}
                                    value={
                                      (subFieldConfig.validations?.find((v) => v.type === 'minDate')
                                        ?.value as string) || ''
                                    }
                                    onChange={(val) => {
                                      const validations = subFieldConfig.validations || [];
                                      if (val) {
                                        if (!hasFixedDate && anyValidationActive) {
                                          const filtered = validations.filter(
                                            (v) =>
                                              ![
                                                'minDateToday',
                                                'maxDateToday',
                                                'minDaysFromToday',
                                                'maxDaysFromToday',
                                                'minDate',
                                                'maxDate',
                                              ].includes(v.type),
                                          );
                                          filtered.push({ type: 'minDate', value: val });
                                          setSubFieldConfig({
                                            ...subFieldConfig,
                                            validations: filtered,
                                          });
                                        } else {
                                          const existing = validations.findIndex(
                                            (v) => v.type === 'minDate',
                                          );
                                          if (existing >= 0) {
                                            validations[existing] = { type: 'minDate', value: val };
                                          } else {
                                            validations.push({ type: 'minDate', value: val });
                                          }
                                          setSubFieldConfig({ ...subFieldConfig, validations });
                                        }
                                      } else {
                                        const existing = validations.findIndex(
                                          (v) => v.type === 'minDate',
                                        );
                                        if (existing >= 0) validations.splice(existing, 1);
                                        setSubFieldConfig({ ...subFieldConfig, validations });
                                      }
                                    }}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm">Max Date</Label>
                                  <DatePicker
                                    disabled={anyValidationActive && !hasFixedDate}
                                    value={
                                      (subFieldConfig.validations?.find((v) => v.type === 'maxDate')
                                        ?.value as string) || ''
                                    }
                                    onChange={(val) => {
                                      const validations = subFieldConfig.validations || [];
                                      if (val) {
                                        if (!hasFixedDate && anyValidationActive) {
                                          const filtered = validations.filter(
                                            (v) =>
                                              ![
                                                'minDateToday',
                                                'maxDateToday',
                                                'minDaysFromToday',
                                                'maxDaysFromToday',
                                                'minDate',
                                                'maxDate',
                                              ].includes(v.type),
                                          );
                                          filtered.push({ type: 'maxDate', value: val });
                                          setSubFieldConfig({
                                            ...subFieldConfig,
                                            validations: filtered,
                                          });
                                        } else {
                                          const existing = validations.findIndex(
                                            (v) => v.type === 'maxDate',
                                          );
                                          if (existing >= 0) {
                                            validations[existing] = { type: 'maxDate', value: val };
                                          } else {
                                            validations.push({ type: 'maxDate', value: val });
                                          }
                                          setSubFieldConfig({ ...subFieldConfig, validations });
                                        }
                                      } else {
                                        const existing = validations.findIndex(
                                          (v) => v.type === 'maxDate',
                                        );
                                        if (existing >= 0) validations.splice(existing, 1);
                                        setSubFieldConfig({ ...subFieldConfig, validations });
                                      }
                                    }}
                                  />
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    )}

                    {(subFieldConfig.type === 'datePeriod' ||
                      subFieldConfig.type === 'policyPeriod') && (
                      <>
                        <div className="space-y-3 p-4 border rounded-lg bg-background mt-4">
                          <h4 className="text-sm font-bold mb-3">From Date Validations</h4>
                          {(() => {
                            const hasMinDateToday = subFieldConfig.validations?.some(
                              (v) => v.type === 'from_minDateToday',
                            );
                            const hasMaxDateToday = subFieldConfig.validations?.some(
                              (v) => v.type === 'from_maxDateToday',
                            );
                              const hasConflictingToMinDateToday = subFieldConfig.validations?.some(
                                (v) => v.type === 'to_minDateToday',
                              );
                            const hasConflictingToMaxDateToday = subFieldConfig.validations?.some(
                                (v) => v.type === 'to_maxDateToday',
                              );
                              const toMaxDaysCap = getValidationNumberValue(
                                subFieldConfig.validations,
                                'to_maxDaysFromToday',
                              );
                              const toMaxDateCap = getValidationStringValue(
                                subFieldConfig.validations,
                                'to_maxDate',
                              );
                              const forcedTodayValidation =
                                hasConflictingToMinDateToday
                                  ? 'max'
                                  : hasConflictingToMaxDateToday
                                    ? 'min'
                                    : null;
                              const hasDaysFromToday = subFieldConfig.validations?.some((v) =>
                                ['from_minDaysFromToday', 'from_maxDaysFromToday'].includes(v.type),
                              );
                            const hasFixedDate = subFieldConfig.validations?.some((v) =>
                              ['from_minDate', 'from_maxDate'].includes(v.type),
                            );
                            const anyValidationActive =
                              hasMinDateToday ||
                              hasMaxDateToday ||
                              hasDaysFromToday ||
                              hasFixedDate;

                            return (
                              <>
                                <div className="flex items-center justify-between">
                                  <div className="space-y-0.5">
                                    <Label className="text-sm">Must be today or later</Label>
                                    <p className="text-xs text-muted-foreground">
                                      From date cannot be in the past
                                    </p>
                                  </div>
                                  <Switch
                                    disabled={
                                      forcedTodayValidation === 'max' ||
                                      (anyValidationActive && !hasMinDateToday) ||
                                      !!hasConflictingToMaxDateToday
                                    }
                                    checked={hasMinDateToday || false}
                                    onCheckedChange={(checked) => {
                                      const validations = subFieldConfig.validations || [];
                                      if (checked) {
                                        const filtered = filterValidationTypes(validations, [
                                          ...FROM_DATE_VALIDATION_TYPES,
                                          'to_maxDateToday',
                                        ]);
                                        filtered.push({ type: 'from_minDateToday' });
                                        setSubFieldConfig({
                                          ...subFieldConfig,
                                          validations: filtered,
                                        });
                                      } else {
                                        const filtered = validations.filter(
                                          (v) => v.type !== 'from_minDateToday',
                                        );
                                        setSubFieldConfig({
                                          ...subFieldConfig,
                                          validations: filtered,
                                        });
                                      }
                                    }}
                                  />
                                </div>

                                <div className="flex items-center justify-between">
                                  <div className="space-y-0.5">
                                    <Label className="text-sm">Must be today or earlier</Label>
                                    <p className="text-xs text-muted-foreground">
                                      From date cannot be in the future
                                    </p>
                                  </div>
                                  <Switch
                                    disabled={
                                      forcedTodayValidation === 'min' ||
                                      (anyValidationActive && !hasMaxDateToday) ||
                                      !!hasConflictingToMinDateToday
                                    }
                                    checked={hasMaxDateToday || false}
                                    onCheckedChange={(checked) => {
                                      const validations = subFieldConfig.validations || [];
                                      if (checked) {
                                        const filtered = filterValidationTypes(validations, [
                                          ...FROM_DATE_VALIDATION_TYPES,
                                          'to_minDateToday',
                                        ]);
                                        filtered.push({ type: 'from_maxDateToday' });
                                        setSubFieldConfig({
                                          ...subFieldConfig,
                                          validations: filtered,
                                        });
                                      } else {
                                        const filtered = validations.filter(
                                          (v) => v.type !== 'from_maxDateToday',
                                        );
                                        setSubFieldConfig({
                                          ...subFieldConfig,
                                          validations: filtered,
                                        });
                                      }
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
                                      disabled={
                                        forcedTodayValidation !== null ||
                                        (anyValidationActive && !hasDaysFromToday)
                                      }
                                      value={
                                        subFieldConfig.validations?.find(
                                          (v) => v.type === 'from_minDaysFromToday',
                                        )?.value != null
                                          ? String(
                                              subFieldConfig.validations.find(
                                                (v) => v.type === 'from_minDaysFromToday',
                                              )!.value,
                                            )
                                          : ''
                                      }
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        const validations = subFieldConfig.validations || [];
                                        if (val && val !== '' && !isNaN(Number(val))) {
                                          const parsedValue =
                                            typeof toMaxDaysCap === 'number'
                                              ? Math.min(parseInt(val, 10), toMaxDaysCap)
                                              : parseInt(val, 10);
                                          const baseValidations = filterValidationTypes(
                                            validations,
                                            ['to_maxDateToday'],
                                          );
                                          if (!hasDaysFromToday && anyValidationActive) {
                                            const filtered = baseValidations.filter(
                                              (v) =>
                                                ![
                                                  'from_minDateToday',
                                                  'from_maxDateToday',
                                                  'from_minDaysFromToday',
                                                  'from_maxDaysFromToday',
                                                  'from_minDate',
                                                  'from_maxDate',
                                                ].includes(v.type),
                                            );
                                            filtered.push({
                                              type: 'from_minDaysFromToday',
                                              value: parsedValue,
                                            });
                                            setSubFieldConfig({
                                              ...subFieldConfig,
                                              validations: filtered,
                                            });
                                          } else {
                                            const existing = baseValidations.findIndex(
                                              (v) => v.type === 'from_minDaysFromToday',
                                            );
                                            if (existing >= 0) {
                                              baseValidations[existing] = {
                                                type: 'from_minDaysFromToday',
                                                value: parsedValue,
                                              };
                                            } else {
                                              baseValidations.push({
                                                type: 'from_minDaysFromToday',
                                                value: parsedValue,
                                              });
                                            }
                                            setSubFieldConfig({
                                              ...subFieldConfig,
                                              validations: baseValidations,
                                            });
                                          }
                                        } else {
                                          const existing = validations.findIndex(
                                            (v) => v.type === 'from_minDaysFromToday',
                                          );
                                          if (existing >= 0) validations.splice(existing, 1);
                                          setSubFieldConfig({ ...subFieldConfig, validations });
                                        }
                                      }}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-sm">Max Days from Today</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      placeholder="e.g., 365"
                                      disabled={
                                        forcedTodayValidation !== null ||
                                        (anyValidationActive && !hasDaysFromToday)
                                      }
                                      value={
                                        subFieldConfig.validations?.find(
                                          (v) => v.type === 'from_maxDaysFromToday',
                                        )?.value != null
                                          ? String(
                                              subFieldConfig.validations.find(
                                                (v) => v.type === 'from_maxDaysFromToday',
                                              )!.value,
                                            )
                                          : ''
                                      }
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        const validations = subFieldConfig.validations || [];
                                        if (val && val !== '' && !isNaN(Number(val))) {
                                          const baseValidations = filterValidationTypes(
                                            validations,
                                            ['to_maxDateToday'],
                                          );
                                          if (!hasDaysFromToday && anyValidationActive) {
                                            const filtered = baseValidations.filter(
                                              (v) =>
                                                ![
                                                  'from_minDateToday',
                                                  'from_maxDateToday',
                                                  'from_minDaysFromToday',
                                                  'from_maxDaysFromToday',
                                                  'from_minDate',
                                                  'from_maxDate',
                                                ].includes(v.type),
                                            );
                                            filtered.push({
                                              type: 'from_maxDaysFromToday',
                                              value: parseInt(val, 10),
                                            });
                                            setSubFieldConfig({
                                              ...subFieldConfig,
                                              validations: filtered,
                                            });
                                          } else {
                                            const existing = baseValidations.findIndex(
                                              (v) => v.type === 'from_maxDaysFromToday',
                                            );
                                            if (existing >= 0) {
                                              baseValidations[existing] = {
                                                type: 'from_maxDaysFromToday',
                                                value: parseInt(val, 10),
                                              };
                                            } else {
                                              baseValidations.push({
                                                type: 'from_maxDaysFromToday',
                                                value: parseInt(val, 10),
                                              });
                                            }
                                            setSubFieldConfig({
                                              ...subFieldConfig,
                                              validations: baseValidations,
                                            });
                                          }
                                        } else {
                                          const existing = validations.findIndex(
                                            (v) => v.type === 'from_maxDaysFromToday',
                                          );
                                          if (existing >= 0) validations.splice(existing, 1);
                                          setSubFieldConfig({ ...subFieldConfig, validations });
                                        }
                                      }}
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label className="text-sm">Min Date</Label>
                                    <DatePicker
                                      disabled={
                                        forcedTodayValidation !== null ||
                                        (anyValidationActive && !hasFixedDate)
                                      }
                                      max={toMaxDateCap}
                                      value={
                                        (subFieldConfig.validations?.find(
                                          (v) => v.type === 'from_minDate',
                                        )?.value as string) || ''
                                      }
                                      onChange={(val) => {
                                        const validations = subFieldConfig.validations || [];
                                        if (val) {
                                          const baseValidations = filterValidationTypes(
                                            validations,
                                            TO_NON_FIXED_VALIDATION_TYPES,
                                          );
                                          if (!hasFixedDate && anyValidationActive) {
                                            const filtered = baseValidations.filter(
                                              (v) =>
                                                ![
                                                  'from_minDateToday',
                                                  'from_maxDateToday',
                                                  'from_minDaysFromToday',
                                                  'from_maxDaysFromToday',
                                                  'from_minDate',
                                                  'from_maxDate',
                                                ].includes(v.type),
                                            );
                                            filtered.push({ type: 'from_minDate', value: val });
                                            setSubFieldConfig({
                                              ...subFieldConfig,
                                              validations: filtered,
                                            });
                                          } else {
                                            const existing = baseValidations.findIndex(
                                              (v) => v.type === 'from_minDate',
                                            );
                                            if (existing >= 0) {
                                              baseValidations[existing] = {
                                                type: 'from_minDate',
                                                value: val,
                                              };
                                            } else {
                                              baseValidations.push({
                                                type: 'from_minDate',
                                                value: val,
                                              });
                                            }
                                            setSubFieldConfig({
                                              ...subFieldConfig,
                                              validations: baseValidations,
                                            });
                                          }
                                        } else {
                                          const existing = validations.findIndex(
                                            (v) => v.type === 'from_minDate',
                                          );
                                          if (existing >= 0) validations.splice(existing, 1);
                                          setSubFieldConfig({ ...subFieldConfig, validations });
                                        }
                                      }}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-sm">Max Date</Label>
                                    <DatePicker
                                      disabled={
                                        forcedTodayValidation !== null ||
                                        (anyValidationActive && !hasFixedDate)
                                      }
                                      value={
                                        (subFieldConfig.validations?.find(
                                          (v) => v.type === 'from_maxDate',
                                        )?.value as string) || ''
                                      }
                                      onChange={(val) => {
                                        const validations = subFieldConfig.validations || [];
                                        if (val) {
                                          const baseValidations = filterValidationTypes(
                                            validations,
                                            TO_NON_FIXED_VALIDATION_TYPES,
                                          );
                                          if (!hasFixedDate && anyValidationActive) {
                                            const filtered = baseValidations.filter(
                                              (v) =>
                                                ![
                                                  'from_minDateToday',
                                                  'from_maxDateToday',
                                                  'from_minDaysFromToday',
                                                  'from_maxDaysFromToday',
                                                  'from_minDate',
                                                  'from_maxDate',
                                                ].includes(v.type),
                                            );
                                            filtered.push({ type: 'from_maxDate', value: val });
                                            setSubFieldConfig({
                                              ...subFieldConfig,
                                              validations: filtered,
                                            });
                                          } else {
                                            const existing = baseValidations.findIndex(
                                              (v) => v.type === 'from_maxDate',
                                            );
                                            if (existing >= 0) {
                                              baseValidations[existing] = {
                                                type: 'from_maxDate',
                                                value: val,
                                              };
                                            } else {
                                              baseValidations.push({
                                                type: 'from_maxDate',
                                                value: val,
                                              });
                                            }
                                            setSubFieldConfig({
                                              ...subFieldConfig,
                                              validations: baseValidations,
                                            });
                                          }
                                        } else {
                                          const existing = validations.findIndex(
                                            (v) => v.type === 'from_maxDate',
                                          );
                                          if (existing >= 0) validations.splice(existing, 1);
                                          setSubFieldConfig({ ...subFieldConfig, validations });
                                        }
                                      }}
                                    />
                                  </div>
                                </div>
                              </>
                            );
                          })()}
                        </div>

                        <div className="space-y-3 p-4 border rounded-lg bg-background mt-4">
                          <h4 className="text-sm font-bold mb-3">To Date Validations</h4>
                          {(() => {
                            const hasMinDateToday = subFieldConfig.validations?.some(
                              (v) => v.type === 'to_minDateToday',
                            );
                            const hasMaxDateToday = subFieldConfig.validations?.some(
                              (v) => v.type === 'to_maxDateToday',
                            );
                            const hasConflictingFromMinDateToday =
                              subFieldConfig.validations?.some(
                                (v) => v.type === 'from_minDateToday',
                              );
                            const hasConflictingFromMaxDateToday =
                              subFieldConfig.validations?.some(
                                (v) => v.type === 'from_maxDateToday',
                              );
                            const fromHasFixedDate = subFieldConfig.validations?.some((v) =>
                              ['from_minDate', 'from_maxDate'].includes(v.type),
                            );
                            const fromHasDaysRange = subFieldConfig.validations?.some((v) =>
                              ['from_minDaysFromToday', 'from_maxDaysFromToday'].includes(v.type),
                            );
                            const fromMinDaysFloor =
                              getValidationNumberValue(
                                subFieldConfig.validations,
                                'from_minDaysFromToday',
                              ) ?? 0;
                            const fromMinDateFloor = getValidationLowerBoundDate(
                              subFieldConfig.validations,
                              'from',
                            );
                            const hasDaysFromToday = subFieldConfig.validations?.some((v) =>
                              ['to_minDaysFromToday', 'to_maxDaysFromToday'].includes(v.type),
                            );
                            const hasFixedDate = subFieldConfig.validations?.some((v) =>
                              ['to_minDate', 'to_maxDate'].includes(v.type),
                            );
                            const anyValidationActive =
                              hasMinDateToday ||
                              hasMaxDateToday ||
                              hasDaysFromToday ||
                              hasFixedDate;

                            return (
                              <>
                                <div className="flex items-center justify-between">
                                  <div className="space-y-0.5">
                                    <Label className="text-sm">Must be today or later</Label>
                                    <p className="text-xs text-muted-foreground">
                                      To date cannot be in the past
                                    </p>
                                  </div>
                                  <Switch
                                    disabled={
                                      !!fromHasFixedDate ||
                                      (anyValidationActive && !hasMinDateToday) ||
                                      !!hasConflictingFromMaxDateToday
                                    }
                                    checked={hasMinDateToday || false}
                                    onCheckedChange={(checked) => {
                                      const validations = subFieldConfig.validations || [];
                                      if (checked) {
                                        const filtered = filterValidationTypes(validations, [
                                          ...TO_DATE_VALIDATION_TYPES,
                                          'from_maxDateToday',
                                        ]);
                                        filtered.push({ type: 'to_minDateToday' });
                                        setSubFieldConfig({
                                          ...subFieldConfig,
                                          validations: filtered,
                                        });
                                      } else {
                                        const filtered = validations.filter(
                                          (v) => v.type !== 'to_minDateToday',
                                        );
                                        setSubFieldConfig({
                                          ...subFieldConfig,
                                          validations: filtered,
                                        });
                                      }
                                    }}
                                  />
                                </div>

                                <div className="flex items-center justify-between">
                                  <div className="space-y-0.5">
                                    <Label className="text-sm">Must be today or earlier</Label>
                                    <p className="text-xs text-muted-foreground">
                                      To date cannot be in the future
                                    </p>
                                  </div>
                                  <Switch
                                    disabled={
                                      !!fromHasFixedDate ||
                                      !!fromHasDaysRange ||
                                      (anyValidationActive && !hasMaxDateToday) ||
                                      !!hasConflictingFromMinDateToday
                                    }
                                    checked={hasMaxDateToday || false}
                                    onCheckedChange={(checked) => {
                                      const validations = subFieldConfig.validations || [];
                                      if (checked) {
                                        const filtered = filterValidationTypes(validations, [
                                          ...TO_DATE_VALIDATION_TYPES,
                                          'from_minDateToday',
                                        ]);
                                        filtered.push({ type: 'to_maxDateToday' });
                                        setSubFieldConfig({
                                          ...subFieldConfig,
                                          validations: filtered,
                                        });
                                      } else {
                                        const filtered = validations.filter(
                                          (v) => v.type !== 'to_maxDateToday',
                                        );
                                        setSubFieldConfig({
                                          ...subFieldConfig,
                                          validations: filtered,
                                        });
                                      }
                                    }}
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label className="text-sm">Min Days from Today</Label>
                                    <Input
                                      type="number"
                                      min={fromMinDaysFloor}
                                      placeholder="e.g., 30"
                                      disabled={
                                        !!fromHasFixedDate ||
                                        (anyValidationActive && !hasDaysFromToday)
                                      }
                                      value={
                                        subFieldConfig.validations?.find(
                                          (v) => v.type === 'to_minDaysFromToday',
                                        )?.value != null
                                          ? String(
                                              subFieldConfig.validations.find(
                                                (v) => v.type === 'to_minDaysFromToday',
                                              )!.value,
                                            )
                                          : ''
                                      }
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        const validations = subFieldConfig.validations || [];
                                        if (val && val !== '' && !isNaN(Number(val))) {
                                          const parsedValue = Math.max(
                                            parseInt(val, 10),
                                            fromMinDaysFloor,
                                          );
                                          if (!hasDaysFromToday && anyValidationActive) {
                                            const filtered = validations.filter(
                                              (v) =>
                                                ![
                                                  'to_minDateToday',
                                                  'to_maxDateToday',
                                                  'to_minDaysFromToday',
                                                  'to_maxDaysFromToday',
                                                  'to_minDate',
                                                  'to_maxDate',
                                                ].includes(v.type),
                                            );
                                            filtered.push({
                                              type: 'to_minDaysFromToday',
                                              value: parsedValue,
                                            });
                                            setSubFieldConfig({
                                              ...subFieldConfig,
                                              validations: filtered,
                                            });
                                          } else {
                                            const existing = validations.findIndex(
                                              (v) => v.type === 'to_minDaysFromToday',
                                            );
                                            if (existing >= 0) {
                                              validations[existing] = {
                                                type: 'to_minDaysFromToday',
                                                value: parsedValue,
                                              };
                                            } else {
                                              validations.push({
                                                type: 'to_minDaysFromToday',
                                                value: parsedValue,
                                              });
                                            }
                                            setSubFieldConfig({ ...subFieldConfig, validations });
                                          }
                                        } else {
                                          const existing = validations.findIndex(
                                            (v) => v.type === 'to_minDaysFromToday',
                                          );
                                          if (existing >= 0) validations.splice(existing, 1);
                                          setSubFieldConfig({ ...subFieldConfig, validations });
                                        }
                                      }}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-sm">Max Days from Today</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      placeholder="e.g., 365"
                                      disabled={
                                        !!fromHasFixedDate ||
                                        (anyValidationActive && !hasDaysFromToday)
                                      }
                                      value={
                                        subFieldConfig.validations?.find(
                                          (v) => v.type === 'to_maxDaysFromToday',
                                        )?.value != null
                                          ? String(
                                              subFieldConfig.validations.find(
                                                (v) => v.type === 'to_maxDaysFromToday',
                                              )!.value,
                                            )
                                          : ''
                                      }
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        const validations = subFieldConfig.validations || [];
                                        if (val && val !== '' && !isNaN(Number(val))) {
                                          const nextMaxValue = parseInt(val, 10);
                                          const currentFromMin = getValidationNumberValue(
                                            validations,
                                            'from_minDaysFromToday',
                                          );
                                          const nextValidations = [...validations];
                                          if (
                                            typeof currentFromMin === 'number' &&
                                            currentFromMin > nextMaxValue
                                          ) {
                                            const fromMinIndex = nextValidations.findIndex(
                                              (v) => v.type === 'from_minDaysFromToday',
                                            );
                                            if (fromMinIndex >= 0) {
                                              nextValidations[fromMinIndex] = {
                                                type: 'from_minDaysFromToday',
                                                value: nextMaxValue,
                                              };
                                            }
                                          }
                                          if (!hasDaysFromToday && anyValidationActive) {
                                            const filtered = nextValidations.filter(
                                              (v) =>
                                                ![
                                                  'to_minDateToday',
                                                  'to_maxDateToday',
                                                  'to_minDaysFromToday',
                                                  'to_maxDaysFromToday',
                                                  'to_minDate',
                                                  'to_maxDate',
                                                ].includes(v.type),
                                            );
                                            filtered.push({
                                              type: 'to_maxDaysFromToday',
                                              value: nextMaxValue,
                                            });
                                            setSubFieldConfig({
                                              ...subFieldConfig,
                                              validations: filtered,
                                            });
                                          } else {
                                            const existing = nextValidations.findIndex(
                                              (v) => v.type === 'to_maxDaysFromToday',
                                            );
                                            if (existing >= 0) {
                                              nextValidations[existing] = {
                                                type: 'to_maxDaysFromToday',
                                                value: nextMaxValue,
                                              };
                                            } else {
                                              nextValidations.push({
                                                type: 'to_maxDaysFromToday',
                                                value: nextMaxValue,
                                              });
                                            }
                                            setSubFieldConfig({
                                              ...subFieldConfig,
                                              validations: nextValidations,
                                            });
                                          }
                                        } else {
                                          const existing = validations.findIndex(
                                            (v) => v.type === 'to_maxDaysFromToday',
                                          );
                                          if (existing >= 0) validations.splice(existing, 1);
                                          setSubFieldConfig({ ...subFieldConfig, validations });
                                        }
                                      }}
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label className="text-sm">Min Date</Label>
                                    <DatePicker
                                      disabled={anyValidationActive && !hasFixedDate}
                                      min={fromMinDateFloor}
                                      value={
                                        (subFieldConfig.validations?.find(
                                          (v) => v.type === 'to_minDate',
                                        )?.value as string) || ''
                                      }
                                      onChange={(val) => {
                                        const validations = subFieldConfig.validations || [];
                                        if (val) {
                                          const clampedVal =
                                            fromMinDateFloor && val < fromMinDateFloor
                                              ? fromMinDateFloor
                                              : val;
                                          if (!hasFixedDate && anyValidationActive) {
                                            const filtered = validations.filter(
                                              (v) =>
                                                ![
                                                  'to_minDateToday',
                                                  'to_maxDateToday',
                                                  'to_minDaysFromToday',
                                                  'to_maxDaysFromToday',
                                                  'to_minDate',
                                                  'to_maxDate',
                                                ].includes(v.type),
                                            );
                                            filtered.push({
                                              type: 'to_minDate',
                                              value: clampedVal,
                                            });
                                            setSubFieldConfig({
                                              ...subFieldConfig,
                                              validations: filtered,
                                            });
                                          } else {
                                            const existing = validations.findIndex(
                                              (v) => v.type === 'to_minDate',
                                            );
                                            if (existing >= 0) {
                                              validations[existing] = {
                                                type: 'to_minDate',
                                                value: clampedVal,
                                              };
                                            } else {
                                              validations.push({
                                                type: 'to_minDate',
                                                value: clampedVal,
                                              });
                                            }
                                            setSubFieldConfig({ ...subFieldConfig, validations });
                                          }
                                        } else {
                                          const existing = validations.findIndex(
                                            (v) => v.type === 'to_minDate',
                                          );
                                          if (existing >= 0) validations.splice(existing, 1);
                                          setSubFieldConfig({ ...subFieldConfig, validations });
                                        }
                                      }}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-sm">Max Date</Label>
                                    <DatePicker
                                      disabled={anyValidationActive && !hasFixedDate}
                                      value={
                                        (subFieldConfig.validations?.find(
                                          (v) => v.type === 'to_maxDate',
                                        )?.value as string) || ''
                                      }
                                      onChange={(val) => {
                                        const validations = subFieldConfig.validations || [];
                                        if (val) {
                                          const currentFromMinDate = getValidationStringValue(
                                            validations,
                                            'from_minDate',
                                          );
                                          const nextValidations = [...validations];
                                          if (currentFromMinDate && currentFromMinDate > val) {
                                            const fromMinIndex = nextValidations.findIndex(
                                              (v) => v.type === 'from_minDate',
                                            );
                                            if (fromMinIndex >= 0) {
                                              nextValidations[fromMinIndex] = {
                                                type: 'from_minDate',
                                                value: val,
                                              };
                                            }
                                          }
                                          if (!hasFixedDate && anyValidationActive) {
                                            const filtered = nextValidations.filter(
                                              (v) =>
                                                ![
                                                  'to_minDateToday',
                                                  'to_maxDateToday',
                                                  'to_minDaysFromToday',
                                                  'to_maxDaysFromToday',
                                                  'to_minDate',
                                                  'to_maxDate',
                                                ].includes(v.type),
                                            );
                                            filtered.push({ type: 'to_maxDate', value: val });
                                            setSubFieldConfig({
                                              ...subFieldConfig,
                                              validations: filtered,
                                            });
                                          } else {
                                            const existing = nextValidations.findIndex(
                                              (v) => v.type === 'to_maxDate',
                                            );
                                            if (existing >= 0) {
                                              nextValidations[existing] = {
                                                type: 'to_maxDate',
                                                value: val,
                                              };
                                            } else {
                                              nextValidations.push({
                                                type: 'to_maxDate',
                                                value: val,
                                              });
                                            }
                                            setSubFieldConfig({
                                              ...subFieldConfig,
                                              validations: nextValidations,
                                            });
                                          }
                                        } else {
                                          const existing = validations.findIndex(
                                            (v) => v.type === 'to_maxDate',
                                          );
                                          if (existing >= 0) validations.splice(existing, 1);
                                          setSubFieldConfig({ ...subFieldConfig, validations });
                                        }
                                      }}
                                    />
                                  </div>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </>
                    )}

                    {subFieldConfig.type === 'file' && (
                      <div className="space-y-3 p-4 border rounded-lg bg-background">
                        <div className="space-y-2">
                          <Label className="text-sm">Max File Size (MB)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.1"
                            placeholder="e.g., 10"
                            value={
                              subFieldConfig.validations?.find((v) => v.type === 'maxFileSize')
                                ?.value != null
                                ? String(
                                    subFieldConfig.validations.find(
                                      (v) => v.type === 'maxFileSize',
                                    )!.value,
                                  )
                                : ''
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              const validations = subFieldConfig.validations || [];
                              const existing = validations.findIndex(
                                (v) => v.type === 'maxFileSize',
                              );
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
                              setSubFieldConfig({ ...subFieldConfig, validations });
                            }}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm">Allowed File Types</Label>
                          <Input
                            placeholder="e.g., pdf,doc,docx"
                            value={
                              subFieldConfig.validations?.find((v) => v.type === 'allowedTypes')
                                ?.value || ''
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              const validations = subFieldConfig.validations || [];
                              const existing = validations.findIndex(
                                (v) => v.type === 'allowedTypes',
                              );
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
                              setSubFieldConfig({ ...subFieldConfig, validations });
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
                              subFieldConfig.validations?.find((v) => v.type === 'maxFiles')
                                ?.value != null
                                ? String(
                                    subFieldConfig.validations.find((v) => v.type === 'maxFiles')!
                                      .value,
                                  )
                                : ''
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              const validations = subFieldConfig.validations || [];
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
                              setSubFieldConfig({ ...subFieldConfig, validations });
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={isConsentDocumentsDialogOpen}
        onOpenChange={(open) => {
          setIsConsentDocumentsDialogOpen(open);
          if (!open) {
            resetConsentDocumentDraft();
            setIsConsentDocumentFormDialogOpen(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Documents required for policy to be issued</DialogTitle>
            <DialogDescription>
              Manage document types required for policy issuance
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-end">
              <Button type="button" onClick={() => openConsentDocumentForm()}>
                Add Document
              </Button>
            </div>

            <div className="rounded-lg border bg-background">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Display Label</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consentDocuments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No document types configured yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    consentDocuments.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.label}</TableCell>
                        <TableCell className="max-w-[280px] truncate">
                          {doc.description || '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={doc.required ? 'default' : 'secondary'}>
                            {doc.required ? 'Required' : 'Optional'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={doc.active ? 'default' : 'secondary'}>
                            {doc.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-center gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => openConsentDocumentForm(doc)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setFieldConfig({
                                  ...fieldConfig,
                                  metadata: {
                                    ...(fieldConfig.metadata || {}),
                                    consentDocuments: consentDocuments.filter(
                                      (item) => item.id !== doc.id,
                                    ),
                                  },
                                });
                                if (editingConsentDocumentId === doc.id) {
                                  resetConsentDocumentDraft();
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={isConsentDocumentFormDialogOpen}
        onOpenChange={(open) => {
          setIsConsentDocumentFormDialogOpen(open);
          if (!open) resetConsentDocumentDraft();
        }}
      >
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>
              {editingConsentDocumentId ? 'Edit Document Type' : 'Add New Document Type'}
            </DialogTitle>
            <DialogDescription>Create a new document type for policy issuance</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Display Label *</Label>
              <Input
                value={consentDocumentDraft.label}
                onChange={(e) =>
                  setConsentDocumentDraft((prev) => ({ ...prev, label: e.target.value }))
                }
                placeholder="e.g., Signed Declaration"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={consentDocumentDraft.description}
                onChange={(e) =>
                  setConsentDocumentDraft((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="e.g., Upload the signed declaration copy"
              />
            </div>
            <div className="flex items-center justify-between rounded-md border px-4 py-3">
              <div className="space-y-0.5">
                <Label>Required Document</Label>
                <p className="text-xs text-muted-foreground">Mark this upload as mandatory</p>
              </div>
              <Switch
                checked={consentDocumentDraft.required}
                onCheckedChange={(checked) =>
                  setConsentDocumentDraft((prev) => ({ ...prev, required: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-md border px-4 py-3">
              <div className="space-y-0.5">
                <Label>Active</Label>
                <p className="text-xs text-muted-foreground">
                  Show this document upload in the popup
                </p>
              </div>
              <Switch
                checked={consentDocumentDraft.active}
                onCheckedChange={(checked) =>
                  setConsentDocumentDraft((prev) => ({ ...prev, active: checked }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              onClick={() => {
                if (!consentDocumentDraft.label.trim()) {
                  toast({
                    title: 'Validation Error',
                    description: 'Please fill in Display Label.',
                    variant: 'destructive',
                  });
                  return;
                }

                const nextDocument = {
                  id: editingConsentDocumentId || `consent-doc-${Date.now()}`,
                  label: consentDocumentDraft.label.trim(),
                  description: consentDocumentDraft.description.trim(),
                  required: consentDocumentDraft.required,
                  active: consentDocumentDraft.active,
                };

                const nextDocuments = editingConsentDocumentId
                  ? consentDocuments.map((doc) =>
                      doc.id === editingConsentDocumentId ? nextDocument : doc,
                    )
                  : [...consentDocuments, nextDocument];

                setFieldConfig({
                  ...fieldConfig,
                  metadata: {
                    ...(fieldConfig.metadata || {}),
                    consentDocuments: nextDocuments,
                  },
                });
                setIsConsentDocumentFormDialogOpen(false);
                resetConsentDocumentDraft();
              }}
            >
              {editingConsentDocumentId ? 'Update Document Type' : 'Add Document Type'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConditionalLogicDialog
        open={isConditionalLogicDialogOpen}
        onOpenChange={setIsConditionalLogicDialogOpen}
        value={
          conditionalLogicTarget === 'field'
            ? fieldConfig.conditionalLogic
            : subFieldConfig.conditionalLogic
        }
        onApply={(conditionalLogic) => {
          if (conditionalLogicTarget === 'field') {
            setFieldConfig({
              ...fieldConfig,
              conditionalLogic,
            });
            return;
          }

          setSubFieldConfig({
            ...subFieldConfig,
            conditionalLogic,
          });
        }}
        pages={pages}
        excludedFieldRefs={
          conditionalLogicTarget === 'field'
            ? [selectedFieldId || '', fieldConfig.name || '']
            : [selectedSubFieldId || '', subFieldConfig.name || '']
        }
        description={
          conditionalLogicTarget === 'field'
            ? 'Create if / else if visibility rules to show or hide this field.'
            : 'Create if / else if visibility rules to show or hide this sub-field.'
        }
      />
    </>
  );
};
