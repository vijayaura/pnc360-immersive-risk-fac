// ─────────────────────────────────────────────────────────────────────────────
// useFieldEditor — field dialog, save, validate, sub-fields, library fields
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/shared/hooks/use-toast';
import { GlobalMasterDto } from '@/features/product-config/masters/api/masters';
import {
    type Page,
    type Field,
    SubField,
    isFieldLocked,
} from '@/features/product-config/proposal-form/api/proposalFormDesign';
import type { FieldType, OptionsSourceMode } from '../types';
import { getCurrentYearValue, getDateFieldDefaultValue } from '../utils/dateDefaults';

// ── Utility helpers ───────────────────────────────────────────────────────────

export const generateFieldName = (label: string): string => {
    if (!label) return '';
    return label
        .trim()
        .toLowerCase()
        .replace(/[\s\-]+/g, '_')
        .replace(/[^a-z0-9_]/g, '')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '');
};

export const parseCSVLabels = (input: string): string[] => {
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

export const formatCSVLabels = (labels: string[]): string =>
    labels
        .map((l) => {
            const escaped = String(l).replace(/"/g, '""');
            return /,|\s/.test(escaped) ? `"${escaped}"` : escaped;
        })
        .join(', ');

/**
 * Radix Dialog portals and @hello-pangea/dnd both touch the DOM on unmount.
 * Closing the dialog in the same event tick as a button click can cause
 * "removeChild: The node to be removed is not a child of this node".
 * Deferring reset by two animation frames lets DnD tear down before the portal closes.
 */
const deferDialogReset = (fn: () => void) => {
    requestAnimationFrame(() => {
        requestAnimationFrame(fn);
    });
};

const formatFieldLocation = (
    page?: Pick<Page, 'title' | 'id'> | null,
    section?: { title?: string; id?: string } | null,
): string => {
    const pageLabel = page?.title?.trim() || page?.id || 'Page';
    const sectionLabel = section?.title?.trim();

    return sectionLabel ? `${pageLabel} / ${sectionLabel}` : pageLabel;
};

const hasBlankOptionLabels = (options: unknown[] | undefined): boolean =>
    (options || []).some((option) => {
        if (typeof option === 'string') return option.trim() === '';
        if (option && typeof option === 'object') {
            const record = option as Record<string, unknown>;
            const label = typeof record.label === 'string' ? record.label.trim() : '';
            const value = typeof record.value === 'string' ? record.value.trim() : '';
            return label === '' && value === '';
        }
        return true;
    });

// ── Hook ──────────────────────────────────────────────────────────────────────

interface UseFieldEditorProps {
    pages: Page[];
    updatePages: (newPages: Page[] | ((current: Page[]) => Page[])) => void;
    selectedPageId: string;
    setSelectedPageId: (id: string) => void;
    globalMasters: GlobalMasterDto[];
    disableRatingParameters?: boolean;
    isCustomerTemplateMode?: boolean;
    isExistingCustomerTemplateEdit?: boolean;
    /** Keeps the design canvas section expanded when opening/closing field dialogs. */
    expandSection?: (sectionId: string | null | undefined) => void;
}

const isCustomerNameMetadataEnabled = (value: unknown): boolean =>
    value === true || String(value).toLowerCase() === 'true';

const countCustomerNameFields = (pages: Page[], excludedIds: Set<string> = new Set()): number =>
    pages.reduce((pageCount, page) => {
        const sectionCount = (page.sections || []).reduce((sum, section) => {
            const fieldCount = (section.fields || []).reduce((fieldSum, field) => {
                const fieldIdentifier = String(field.id || field.name);
                const topLevelMatch =
                    field.type === 'text' &&
                    !excludedIds.has(fieldIdentifier) &&
                    isCustomerNameMetadataEnabled(field.metadata?.isCustomerName)
                        ? 1
                        : 0;

                const subFieldMatch = (field.subFields || []).reduce((subSum, subField) => {
                    const subFieldIdentifier = String(subField.id || subField.name);
                    if (
                        subField.type === 'text' &&
                        !excludedIds.has(subFieldIdentifier) &&
                        isCustomerNameMetadataEnabled(subField.metadata?.isCustomerName)
                    ) {
                        return subSum + 1;
                    }
                    return subSum;
                }, 0);

                return fieldSum + topLevelMatch + subFieldMatch;
            }, 0);

            return sum + fieldCount;
        }, 0);

        return pageCount + sectionCount;
    }, 0);

export function useFieldEditor({
    pages,
    updatePages,
    selectedPageId,
    setSelectedPageId,
    globalMasters,
    disableRatingParameters = false,
    isCustomerTemplateMode = false,
    isExistingCustomerTemplateEdit = false,
    expandSection,
}: UseFieldEditorProps) {
    const { toast } = useToast();
    /** Skips `handleCloseFieldDialog` when Radix fires `onOpenChange` during a programmatic save close. */
    const isCompletingFieldSaveRef = useRef(false);

    // ── Field dialog state ────────────────────────────────────────────────────────
    const [isFieldDialogOpen, setIsFieldDialogOpen] = useState(false);
    const [isFieldDialogClosing, setIsFieldDialogClosing] = useState(false);
    const [isConfiguringField, setIsConfiguringField] = useState(false);
    const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
    const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
    const [fieldConfig, setFieldConfig] = useState<Partial<Field | any>>({
        type: 'text',
        label: '',
        name: '',
        isLocked: false,
        isRatingParameter: false,
        isMasterData: false,
        validations: [],
    });
    const [optionsInput, setOptionsInput] = useState<string>('');
    const [dependentOptionsInput, setDependentOptionsInput] = useState<string>('');

    // ── Options source state ──────────────────────────────────────────────────────
    const [optionsSourceMode, setOptionsSourceMode] = useState<OptionsSourceMode>('static');
    const [selectedGlobalMaster, setSelectedGlobalMaster] = useState<GlobalMasterDto | null>(null);
    const [selectedMasterValues, setSelectedMasterValues] = useState<Set<string>>(new Set());

    // ── Min/Max error state ───────────────────────────────────────────────────────
    const [minMaxError, setMinMaxError] = useState<string | null>(null);
    const [minMaxCharacterError, setMinMaxCharacterError] = useState<string | null>(null);

    // ── Combination / sub-field state ─────────────────────────────────────────────
    const [subFieldsConfig, setSubFieldsConfig] = useState<SubField[]>([]);
    const [combinationRowsCount, setCombinationRowsCount] = useState<number>(1);
    const [combinationRowLabels, setCombinationRowLabels] = useState<string[]>([]);
    const [combinationRowLabelsInput, setCombinationRowLabelsInput] = useState<string>('');
    const [maximizeAdditionOfRows, setMaximizeAdditionOfRows] = useState<boolean>(false);
    const [maximumRowCountInput, setMaximumRowCountInput] = useState<string>('');
    const [subFieldOptionsInput, setSubFieldOptionsInput] = useState<Record<string, string>>({});

    // ── Sub-field dialog state ────────────────────────────────────────────────────
    const [isSubFieldDialogOpen, setIsSubFieldDialogOpen] = useState(false);
    const [isSubFieldDialogClosing, setIsSubFieldDialogClosing] = useState(false);
    const [isConfiguringSubField, setIsConfiguringSubField] = useState(false);
    const [selectedSubFieldId, setSelectedSubFieldId] = useState<string | null>(null);
    const [subFieldConfig, setSubFieldConfig] = useState<Partial<SubField | any>>({
        type: 'text',
        label: '',
        name: '',
        required: false,
        isRatingParameter: false,
        validations: [],
        metadata: {},
    });
    const [subFieldDependentOptionsInput, setSubFieldDependentOptionsInput] = useState<string>('');

    // ── Derived ───────────────────────────────────────────────────────────────────
    const hasMinOrMax = !!fieldConfig.validations?.some(
        (v: any) => v.type === 'minLength' || v.type === 'maxLength',
    );
    const hasFormat = !!fieldConfig.validations?.some((v: any) =>
        ['email', 'url', 'phone'].includes(v.type),
    );
    const effectiveMaximizeAdditionOfRows =
        fieldConfig.type === 'combination'
            ? typeof (fieldConfig.metadata as Record<string, unknown> | undefined)?.maximizeAdditionOfRows === 'boolean'
                ? (fieldConfig.metadata as Record<string, unknown>).maximizeAdditionOfRows === true
                : maximizeAdditionOfRows
            : false;
    const effectiveMaximumRowCountInput =
        fieldConfig.type === 'combination'
            ? typeof (fieldConfig.metadata as Record<string, unknown> | undefined)?.maximumRowCount === 'number'
                    ? String((fieldConfig.metadata as Record<string, unknown>).maximumRowCount)
                    : maximumRowCountInput !== ''
                        ? maximumRowCountInput
                        : ''
            : '';
    const fixedCombinationRowsCount = combinationRowLabels.length > 0 ? combinationRowLabels.length : 1;

    // ── Validation helpers ────────────────────────────────────────────────────────
    const validateMinMax = useCallback((): boolean => {
        if (fieldConfig.type !== 'number') return true;
        const minVal = fieldConfig.validations?.find((v: any) => v.type === 'min')?.value as
            | number
            | undefined;
        const maxVal = fieldConfig.validations?.find((v: any) => v.type === 'max')?.value as
            | number
            | undefined;
        if (minVal !== undefined && maxVal !== undefined) {
            if (minVal > maxVal) {
                setMinMaxError('Min value cannot be greater than Max value');
                return false;
            }
            if (maxVal < minVal) {
                setMinMaxError('Max value cannot be less than Min value');
                return false;
            }
        }
        setMinMaxError(null);
        return true;
    }, [fieldConfig.type, fieldConfig.validations]);

    const validateMinMaxCharacter = useCallback((): boolean => {
        const isText = fieldConfig.type === 'text';
        const isPhoneNumber =
            fieldConfig.type === 'number' && fieldConfig.metadata?.numberFormat === 'phoneNumber';
        if (!isText && !isPhoneNumber) return true;
        const minLengthVal = fieldConfig.validations?.find((v: any) => v.type === 'minLength')
            ?.value as number | undefined;
        const maxLengthVal = fieldConfig.validations?.find((v: any) => v.type === 'maxLength')
            ?.value as number | undefined;
        if (minLengthVal !== undefined && maxLengthVal !== undefined) {
            if (minLengthVal > maxLengthVal) {
                setMinMaxCharacterError(
                    isPhoneNumber
                        ? 'Min length cannot be greater than Max length'
                        : 'Min character cannot be greater than Max character',
                );
                return false;
            }
            if (maxLengthVal < minLengthVal) {
                setMinMaxCharacterError(
                    isPhoneNumber
                        ? 'Max length cannot be less than Min length'
                        : 'Max character cannot be less than Min character',
                );
                return false;
            }
        }
        setMinMaxCharacterError(null);
        return true;
    }, [fieldConfig.type, fieldConfig.metadata, fieldConfig.validations]);

    // ── Close dialog helpers ──────────────────────────────────────────────────────
    const handleCloseFieldDialog = useCallback(() => {
        if (isCompletingFieldSaveRef.current) {
            return;
        }
        setIsFieldDialogClosing(true);
        setIsSubFieldDialogClosing(true);
        deferDialogReset(() => {
            setIsFieldDialogOpen(false);
            setIsFieldDialogClosing(false);
            setIsConfiguringField(false);
            setSelectedFieldId(null);
            setFieldConfig({
                type: 'text',
                label: '',
                name: '',
                isLocked: false,
                required: false,
                isRatingParameter: false,
                isMasterData: false,
                validations: [],
            });
            setOptionsInput('');
            setDependentOptionsInput('');
            setSubFieldsConfig([]);
            setMinMaxError(null);
            setMinMaxCharacterError(null);
            setCombinationRowsCount(1);
            setCombinationRowLabels([]);
            setCombinationRowLabelsInput('');
            setMaximizeAdditionOfRows(false);
            setMaximumRowCountInput('');
            setSubFieldOptionsInput({});
            setOptionsSourceMode('static');
            setSelectedGlobalMaster(null);
            setSelectedMasterValues(new Set());
            setIsSubFieldDialogOpen(false);
            setIsSubFieldDialogClosing(false);
            setIsConfiguringSubField(false);
            setSelectedSubFieldId(null);
            setSubFieldConfig({
                type: 'text',
                label: '',
                name: '',
                required: false,
                isRatingParameter: false,
                validations: [],
                metadata: {},
            });
            setSubFieldDependentOptionsInput('');
        });
    }, []);

    const handleCloseSubFieldDialog = useCallback(() => {
        setIsSubFieldDialogClosing(true);
        deferDialogReset(() => {
            setIsSubFieldDialogOpen(false);
            setIsSubFieldDialogClosing(false);
            setIsConfiguringSubField(false);
            setSelectedSubFieldId(null);
            setSubFieldConfig({
                type: 'text',
                label: '',
                name: '',
                required: false,
                isRatingParameter: false,
                validations: [],
                metadata: {},
            });
            setSubFieldOptionsInput({});
            setSubFieldDependentOptionsInput('');
        });
    }, []);

    // ── Start adding/editing ──────────────────────────────────────────────────────
    const startAddingField = useCallback((sectionId: string, initialType: FieldType = 'text') => {
        setSelectedSectionId(sectionId);
        expandSection?.(sectionId);
        setIsFieldDialogClosing(false);
        setIsConfiguringField(true);
        setFieldConfig({
            type: initialType,
            label: '',
            name: '',
            isLocked: false,
            required: true,
            isRatingParameter: false,
            isMasterData: false,
            buttonText: '',
            buttonVariant: 'default',
            mapProvider: undefined,
            fromDateLabel: 'From Date',
            toDateLabel: 'To Date',
            periodCalculationUnit: 'months',
            autoCalculatePeriod: true,
            note: '',
            defaultValue: initialType === 'date' ? getDateFieldDefaultValue() : undefined,
            showYearOnly: false,
            metadata: { active: true },
        });
        setOptionsInput('');
        setDependentOptionsInput('');
        setSubFieldsConfig([]);
        setCombinationRowsCount(1);
        setCombinationRowLabels([]);
        setCombinationRowLabelsInput('');
        setMaximizeAdditionOfRows(false);
        setMaximumRowCountInput('');
        setSubFieldOptionsInput({});
        setSelectedFieldId(null);
        setOptionsSourceMode('static');
        setSelectedGlobalMaster(null);
        setSelectedMasterValues(new Set());
        setIsFieldDialogOpen(true);
    }, [expandSection]);

    const startEditingField = useCallback((pageId: string, sectionId: string, field: Field) => {
        if (isExistingCustomerTemplateEdit && isFieldLocked(field)) {
            toast({
                title: 'Field locked',
                description: 'This field is locked and cannot be changed.',
                variant: 'destructive',
            });
            return;
        }

        setSelectedPageId(pageId);
        setSelectedSectionId(sectionId);
        expandSection?.(sectionId);
        setIsFieldDialogClosing(false);
        setSelectedFieldId(field.id);
        setIsConfiguringField(false);
        const isYearOnly = Boolean(field.showYearOnly ?? field.metadata?.is_year_only ?? false);
        const currentYearStr = getCurrentYearValue();
        setFieldConfig({
            ...field,
            required: field.type === 'consent' ? true : field.required,
            isRatingParameter:
                disableRatingParameters || field.type === 'consent' ? false : field.isRatingParameter,
            showYearOnly: isYearOnly,
            defaultValue: field.type === 'date'
                ? getDateFieldDefaultValue({
                    currentValue: field.defaultValue ?? field.metadata?.defaultValue,
                    showYearOnly: isYearOnly,
                })
                : field.defaultValue ?? field.metadata?.defaultValue ?? undefined,
            metadata: field.metadata || {},
            note: field?.metadata?.note ?? (field as any).note ?? '',
        });
        setOptionsInput(
            field.options?.map((o) => (typeof o === 'string' ? o : o.value)).join(', ') || '',
        );
        setDependentOptionsInput(
            field.dependentOptions
                ? Object.entries(field.dependentOptions)
                    .map(([parent, children]) => `${parent} = ${(children as string[]).join(', ')}`)
                    .join('\n')
                : '',
        );
        setSubFieldsConfig(field.subFields ?? []);
        const isMaximized = (field.metadata as Record<string, unknown> | undefined)?.maximizeAdditionOfRows === true;
        setMaximizeAdditionOfRows(isMaximized);
        setMaximumRowCountInput(
            isMaximized &&
                typeof (field.metadata as Record<string, unknown> | undefined)?.maximumRowCount === 'number'
                ? String((field.metadata as Record<string, unknown>).maximumRowCount)
                : '',
        );
        setCombinationRowsCount((field as any).combinationRows || 1);
        setCombinationRowLabels((field as any).combinationRowLabels || []);
        setCombinationRowLabelsInput(formatCSVLabels((field as any).combinationRowLabels || []));
        const initialOptionsInput: Record<string, string> = {};
        (field.subFields || []).forEach((sf) => {
            const opts = sf.options?.map((o) => (typeof o === 'string' ? o : o.label)) ?? [];
            initialOptionsInput[sf.id || sf.name] = formatCSVLabels(opts);
        });
        setSubFieldOptionsInput(initialOptionsInput);
        const hasGlobalMasterKey = !!(field as any).globalMasterKey;
        setOptionsSourceMode(
            hasGlobalMasterKey ? 'globalMaster' : (field as any).optionsUrl ? 'url' : 'static',
        );
        setSelectedGlobalMaster(null);
        setSelectedMasterValues(new Set());
        setIsFieldDialogOpen(true);
    }, [disableRatingParameters, expandSection, isExistingCustomerTemplateEdit, setSelectedPageId, toast]);

    const startAddingSubField = useCallback(() => {
        expandSection?.(selectedSectionId ?? undefined);
        setIsSubFieldDialogClosing(false);
        setIsConfiguringSubField(true);
        setSubFieldConfig({
            type: 'text',
            label: '',
            name: '',
            required: true,
            isRatingParameter: false,
            validations: [],
            showYearOnly: false,
            metadata: { active: true },
        });
        setSubFieldOptionsInput({});
        setSubFieldDependentOptionsInput('');
        setSelectedSubFieldId(null);
        setIsSubFieldDialogOpen(true);
    }, [disableRatingParameters, expandSection, selectedSectionId]);

    const startEditingSubField = useCallback((subField: SubField) => {
        expandSection?.(selectedSectionId ?? undefined);
        setIsSubFieldDialogClosing(false);
        setSelectedSubFieldId(subField.id);
        setIsConfiguringSubField(false);
        const isSubFieldYearOnly = Boolean(
            subField.showYearOnly ?? subField.metadata?.is_year_only ?? false,
        );
        setSubFieldConfig({
            type: subField.type,
            label: subField.label,
            name: subField.name,
            note: subField?.metadata?.note || '',
            numberFormat: subField?.metadata?.numberFormat || '',
            placeholder: subField.placeholder,
            required: subField.required || false,
            isRatingParameter: disableRatingParameters ? false : subField.isRatingParameter || false,
            validations: subField.validations,
            options: subField.options,
            fromDateLabel: subField.fromDateLabel,
            toDateLabel: subField.toDateLabel,
            periodCalculationUnit: subField.periodCalculationUnit,
            autoCalculatePeriod: subField.autoCalculatePeriod,
            mapProvider: subField.mapProvider,
            mapApiUrl: subField.mapApiUrl,
            mapApiKey: subField.mapApiKey,
            buttonText: subField.buttonText,
            buttonVariant: subField.buttonVariant,
            metadata: subField.metadata || {},
            showYearOnly: isSubFieldYearOnly,
            defaultValue: subField.type === 'date'
                ? getDateFieldDefaultValue({
                    currentValue: (subField as any).defaultValue || subField.metadata?.defaultValue,
                    showYearOnly: isSubFieldYearOnly,
                })
                : ((subField as any).defaultValue || subField.metadata?.defaultValue || ''),
            // Dependent dropdown config
            dependentOn: (subField as any).dependentOn,
            dependentOptions: (subField as any).dependentOptions,
            dependentOptionsUrl: (subField as any).dependentOptionsUrl,
            conditionalLogic: subField.conditionalLogic,
        });
        const key = subField.id || subField.name;
        if (subField.type === 'dropdown' || subField.type === 'chooseButton') {
            setSubFieldOptionsInput((prev) => ({
                ...prev,
                [key as string]: formatCSVLabels(
                    subField.options?.map((o) => (typeof o === 'string' ? o : o.label)) ?? [],
                ),
            }));
        }
        setSubFieldDependentOptionsInput('');
        setIsSubFieldDialogOpen(true);
    }, [expandSection, selectedSectionId]);

    // ── saveField ─────────────────────────────────────────────────────────────────
    const saveField = useCallback(() => {
        if (!fieldConfig.label) {
            toast({ title: 'Validation Error', description: 'Please fill in Field Label.', variant: 'destructive' });
            return;
        }
        if (!validateMinMax()) {
            toast({ title: 'Invalid Min/Max Values', description: minMaxError, variant: 'destructive' });
            return;
        }
        if (!validateMinMaxCharacter()) {
            toast({ title: 'Invalid Min/Max Character Length', description: minMaxCharacterError, variant: 'destructive' });
            return;
        }
        if (
            (fieldConfig.type === 'combination' || fieldConfig.type === 'repeatable') &&
            subFieldsConfig.length === 0
        ) {
            toast({ title: 'Validation Error', description: 'Combination field must have at least one sub-field.', variant: 'destructive' });
            return;
        }
        if (
            fieldConfig.type === 'combination' &&
            effectiveMaximizeAdditionOfRows &&
            effectiveMaximumRowCountInput.trim() !== '' &&
            Number(effectiveMaximumRowCountInput) < 1
        ) {
            toast({ title: 'Validation Error', description: 'Maximum row count must be at least 1.', variant: 'destructive' });
            return;
        }
        if (fieldConfig.type === 'combination') {
            const invalidSubFields = subFieldsConfig.filter((sf) => !sf.label);
            if (invalidSubFields.length > 0) {
                toast({ title: 'Validation Error', description: 'All sub-fields must have a label.', variant: 'destructive' });
                return;
            }
        }

        const fieldName = fieldConfig.name || generateFieldName(fieldConfig.label);
        if (!fieldName) {
            toast({ title: 'Validation Error', description: 'Could not generate field name. Please enter a valid label.', variant: 'destructive' });
            return;
        }
        if (isCustomerTemplateMode) {
            const excludedIds = new Set<string>();
            if (selectedFieldId) {
                excludedIds.add(String(selectedFieldId));
                const existingField = pages
                    .flatMap((page) => page.sections || [])
                    .flatMap((section) => section.fields || [])
                    .find((field) => field.id === selectedFieldId);
                (existingField?.subFields || []).forEach((subField) => {
                    excludedIds.add(String(subField.id || subField.name));
                });
            }
            const otherCustomerNameCount = countCustomerNameFields(pages, excludedIds);
            const currentFieldCustomerNameCount =
                fieldConfig.type === 'text' &&
                isCustomerNameMetadataEnabled(fieldConfig.metadata?.isCustomerName)
                    ? 1
                    : 0;
            const currentSubFieldCustomerNameCount = subFieldsConfig.reduce((sum, subField) => {
                if (
                    subField.type === 'text' &&
                    isCustomerNameMetadataEnabled(subField.metadata?.isCustomerName)
                ) {
                    return sum + 1;
                }
                return sum;
            }, 0);

            if (otherCustomerNameCount + currentFieldCustomerNameCount + currentSubFieldCustomerNameCount > 1) {
                toast({
                    title: 'Validation Error',
                    description: 'Only one text field can be marked as Customer Name in a customer template.',
                    variant: 'destructive',
                });
                return;
            }
        }

        const restrictedRatingTypes = ['text', 'file', 'location', 'time', 'chooseButton'];
        const restrictedMasterDataTypes = [
            'text', 'number', 'date', 'datePeriod', 'policyPeriod', 'file', 'location', 'combination',
        ];

        const maximumRowCount =
            effectiveMaximizeAdditionOfRows && effectiveMaximumRowCountInput.trim() !== ''
                ? Number(effectiveMaximumRowCountInput)
                : undefined;

        const resolvedOptionsSourceMode =
            (fieldConfig.metadata as { optionsSourceMode?: OptionsSourceMode } | undefined)
                ?.optionsSourceMode ?? optionsSourceMode;

        const requiresNamedOptions = ['dropdown', 'multiselect', 'multiselectDropdown', 'chooseButton'].includes(
            String(fieldConfig.type || ''),
        );
        if (requiresNamedOptions && hasBlankOptionLabels(fieldConfig.options)) {
            toast({
                title: 'Validation Error',
                description: 'Option name cannot be blank or empty.',
                variant: 'destructive',
            });
            return;
        }

        let normalizedFieldOptions: Field['options'] | undefined;
        if (fieldConfig.options && fieldConfig.options.length > 0) {
            const copy = [...fieldConfig.options];
            if (
                resolvedOptionsSourceMode === 'globalMaster' ||
                resolvedOptionsSourceMode === 'referenceGlobalMaster'
            ) {
                normalizedFieldOptions = copy.sort((a, b) => {
                    const orderA =
                        typeof a === 'string' ? 0 : (a?.sortOrder ?? Number.MAX_SAFE_INTEGER);
                    const orderB =
                        typeof b === 'string' ? 0 : (b?.sortOrder ?? Number.MAX_SAFE_INTEGER);
                    return orderA - orderB;
                });
            } else {
                normalizedFieldOptions = copy;
            }
        } else {
            normalizedFieldOptions = undefined;
        }

        const fieldData: Field = {
            id: selectedFieldId || `field${Date.now()}`,
            type: fieldConfig.type as FieldType,
            label: fieldConfig.label,
            name: fieldName,
            isLocked: fieldConfig.isLocked === true,
            placeholder: fieldConfig.placeholder,
            defaultValue: fieldConfig.defaultValue,
            required: fieldConfig.type === 'consent' ? true : fieldConfig.required !== false,
            isRatingParameter: disableRatingParameters
                ? false
                : restrictedRatingTypes.includes(fieldConfig.type || '')
                || fieldConfig.type === 'consent'
                ? false
                : fieldConfig.isRatingParameter || false,
            isMasterData: restrictedMasterDataTypes.includes(fieldConfig.type || '')
                ? false
                : fieldConfig.isMasterData || false,
            validations: fieldConfig.validations,
            conditionalLogic: fieldConfig.conditionalLogic,
            options: normalizedFieldOptions,
            optionsUrl: fieldConfig.optionsUrl,
            dependentOn: fieldConfig.dependentOn,
            dependentOptions: fieldConfig.dependentOptions ? 
                Object.fromEntries(
                    Object.entries(fieldConfig.dependentOptions).map(([k, v]) => [
                        k, [...(v as string[])].sort((a,b) => a.localeCompare(b))
                    ])
                ) : undefined,
            dependentOptionsUrl: fieldConfig.dependentOptionsUrl,
            masterDataTable: fieldConfig.masterDataTable,
            subFields:
                fieldConfig.type === 'combination' || fieldConfig.type === 'repeatable'
                    ? subFieldsConfig
                    : undefined,
            combinationRows:
                fieldConfig.type === 'combination'
                    ? null
                    : undefined,
            combinationRowLabels:
                fieldConfig.type === 'combination' && !effectiveMaximizeAdditionOfRows
                    ? combinationRowLabels || []
                    : fieldConfig.type === 'combination'
                        ? []
                        : undefined,
            buttonText: fieldConfig.buttonText,
            buttonAction: fieldConfig.buttonAction,
            buttonApiUrl: fieldConfig.buttonApiUrl,
            buttonVariant: fieldConfig.buttonVariant,
            buttonTargetPage: fieldConfig.buttonTargetPage,
            mapProvider: fieldConfig.mapProvider,
            fromDateLabel:
                fieldConfig.type === 'datePeriod' || fieldConfig.type === 'policyPeriod'
                    ? fieldConfig.fromDateLabel
                    : undefined,
            toDateLabel:
                fieldConfig.type === 'datePeriod' || fieldConfig.type === 'policyPeriod'
                    ? fieldConfig.toDateLabel
                    : undefined,
            periodCalculationUnit:
                fieldConfig.type === 'datePeriod' || fieldConfig.type === 'policyPeriod'
                    ? fieldConfig.periodCalculationUnit
                    : undefined,
            autoCalculatePeriod:
                fieldConfig.type === 'datePeriod' || fieldConfig.type === 'policyPeriod'
                    ? fieldConfig.autoCalculatePeriod
                    : undefined,
            showYearOnly: fieldConfig.type === 'date' ? fieldConfig.showYearOnly : undefined,
            note: fieldConfig.note,
            metadata: {
                ...(fieldConfig.metadata || {}),
                active: fieldConfig.metadata?.active !== false,
                isLocked: fieldConfig.isLocked === true,
                isCustomerName:
                    fieldConfig.type === 'text'
                        ? isCustomerNameMetadataEnabled(fieldConfig.metadata?.isCustomerName)
                        : undefined,
                maximizeAdditionOfRows:
                    fieldConfig.type === 'combination' ? effectiveMaximizeAdditionOfRows : undefined,
                maximumRowCount:
                    fieldConfig.type === 'combination' ? maximumRowCount : undefined,
                note: fieldConfig.note ?? undefined,
                defaultValue: fieldConfig.defaultValue ?? undefined,
                is_year_only: fieldConfig.type === 'date' ? fieldConfig.showYearOnly : undefined,
            },
        } as any;

        const isEditField = Boolean(selectedFieldId && !isConfiguringField);
        let addFieldLocationLabel: string | undefined;

        if (!isEditField) {
            if (!selectedSectionId) {
                toast({
                    title: 'No section selected',
                    description: 'Select a section on the canvas, or add a section and try again.',
                    variant: 'destructive',
                });
                return;
            }

            const targetPage =
                pages.find((page) =>
                    (page.sections || []).some((section) => section.id === selectedSectionId),
                ) || null;
            const targetSection =
                (targetPage?.sections || []).find((section) => section.id === selectedSectionId) || null;

            if (!targetPage || !targetSection) {
                toast({
                    title: 'Section not found',
                    description: 'That section no longer exists. Select a section on the canvas and try again.',
                    variant: 'destructive',
                });
                return;
            }

            addFieldLocationLabel = formatFieldLocation(targetPage, targetSection);
        }

        const sectionToKeepExpanded = selectedSectionId;
        // Strip dialog content (incl. @hello-pangea/dnd + Radix portaled controls) before `updatePages`
        // mutates the canvas — avoids removeChild races when saving e.g. inactive dropdown fields.
        isCompletingFieldSaveRef.current = true;
        setIsFieldDialogClosing(true);
        setIsSubFieldDialogClosing(true);
        deferDialogReset(() => {
            try {
                if (isEditField) {
                    updatePages((prev) =>
                        prev.map((page) => ({
                            ...page,
                            sections: (page.sections || []).map((section) => ({
                                ...section,
                                fields: (section.fields || []).map((field) =>
                                    field.id === selectedFieldId ? fieldData : field,
                                ),
                            })),
                        })),
                    );
                    toast({ title: 'Field Updated', description: `${fieldConfig.label} has been updated.` });
                } else if (selectedSectionId) {
                    updatePages((prev) =>
                        prev.map((page) => ({
                            ...page,
                            sections: (page.sections || []).map((section) =>
                                section.id === selectedSectionId
                                    ? { ...section, fields: [...(section.fields || []), fieldData] }
                                    : section,
                            ),
                        })),
                    );
                    toast({
                        title: 'Field Added',
                        description: `${fieldConfig.label} has been added to ${addFieldLocationLabel ?? 'form'}.`,
                    });
                }

                setIsFieldDialogOpen(false);
                setIsFieldDialogClosing(false);
                setIsConfiguringField(false);
                setFieldConfig({});
                setOptionsInput('');
                setDependentOptionsInput('');
                setSubFieldsConfig([]);
                setCombinationRowsCount(1);
                setCombinationRowLabels([]);
                setCombinationRowLabelsInput('');
                setMaximizeAdditionOfRows(false);
                setMaximumRowCountInput('');
                setSelectedFieldId(null);
                setOptionsSourceMode('static');
                setSelectedGlobalMaster(null);
                setSelectedMasterValues(new Set());
                setIsSubFieldDialogOpen(false);
                setIsSubFieldDialogClosing(false);
                setIsConfiguringSubField(false);
                setSelectedSubFieldId(null);
                setSubFieldConfig({ metadata: {} });
                setSubFieldDependentOptionsInput('');
                expandSection?.(sectionToKeepExpanded);
            } finally {
                isCompletingFieldSaveRef.current = false;
            }
        });
    }, [
        fieldConfig,
        selectedFieldId,
        isConfiguringField,
        subFieldsConfig,
        combinationRowLabels,
        fixedCombinationRowsCount,
        effectiveMaximizeAdditionOfRows,
        effectiveMaximumRowCountInput,
        selectedSectionId,
        validateMinMax,
        validateMinMaxCharacter,
        updatePages,
        toast,
        minMaxError,
        minMaxCharacterError,
        optionsSourceMode,
        disableRatingParameters,
        isCustomerTemplateMode,
        pages,
        expandSection,
    ]);

    // ── saveSubField ──────────────────────────────────────────────────────────────
    const saveSubField = useCallback(() => {
        if (!subFieldConfig.label) {
            toast({ title: 'Validation Error', description: 'Please fill in Sub-Field Label.', variant: 'destructive' });
            return;
        }
        const fieldName = subFieldConfig.name || generateFieldName(subFieldConfig.label);
        if (!fieldName) {
            toast({ title: 'Validation Error', description: 'Could not generate sub-field name.', variant: 'destructive' });
            return;
        }
        if (
            isCustomerTemplateMode &&
            subFieldConfig.type === 'text' &&
            isCustomerNameMetadataEnabled(subFieldConfig.metadata?.isCustomerName)
        ) {
            const currentSubFieldId = String(selectedSubFieldId || fieldName);
            const otherCustomerNameCount = countCustomerNameFields(
                pages,
                selectedSubFieldId ? new Set([String(selectedSubFieldId)]) : new Set<string>(),
            );
            const localCustomerNameCount = subFieldsConfig.reduce((sum, subField) => {
                const subFieldId = String(subField.id || subField.name);
                if (subFieldId === currentSubFieldId) return sum;
                if (
                    subField.type === 'text' &&
                    isCustomerNameMetadataEnabled(subField.metadata?.isCustomerName)
                ) {
                    return sum + 1;
                }
                return sum;
            }, 0);

            if (otherCustomerNameCount + localCustomerNameCount + 1 > 1) {
                toast({
                    title: 'Validation Error',
                    description: 'Only one text field can be marked as Customer Name in a customer template.',
                    variant: 'destructive',
                });
                return;
            }
        }

        let options: any[] | undefined;
        if (subFieldConfig.type === 'dropdown' || subFieldConfig.type === 'chooseButton') {
            options = subFieldConfig.options ?? [];
        }
        if (
            ['dropdown', 'multiselect', 'multiselectDropdown', 'chooseButton'].includes(
                String(subFieldConfig.type || ''),
            ) &&
            hasBlankOptionLabels(subFieldConfig.options)
        ) {
            toast({
                title: 'Validation Error',
                description: 'Option name cannot be blank or empty.',
                variant: 'destructive',
            });
            return;
        }

        const isRatingParam = disableRatingParameters ? false : Boolean(subFieldConfig.isRatingParameter);
        const subFieldData: any = {
            id: selectedSubFieldId || `subfield${Date.now()}`,
            type: subFieldConfig.type as any,
            label: subFieldConfig.label,
            name: fieldName,
            placeholder: subFieldConfig.placeholder,
            required: isRatingParam || subFieldConfig.required !== false,
            isRatingParameter: isRatingParam,
            validations: subFieldConfig.validations || [],
            conditionalLogic: subFieldConfig.conditionalLogic,
            options: subFieldConfig.dependentOn ? undefined : options ? [...options] : undefined,
            // Dependent dropdown persistence
            dependentOn: subFieldConfig.dependentOn || undefined,
            dependentOptions: subFieldConfig.dependentOn && subFieldConfig.dependentOptions ? 
                Object.fromEntries(
                    Object.entries(subFieldConfig.dependentOptions).map(([k, v]) => [
                        k, [...(v as string[])].sort((a,b) => a.localeCompare(b))
                    ])
                ) : undefined,
            dependentOptionsUrl: subFieldConfig.dependentOn ? (subFieldConfig.dependentOptionsUrl || undefined) : undefined,
            fromDateLabel: subFieldConfig.fromDateLabel,
            toDateLabel: subFieldConfig.toDateLabel,
            periodCalculationUnit: subFieldConfig.periodCalculationUnit,
            autoCalculatePeriod: subFieldConfig.autoCalculatePeriod,
            mapProvider: subFieldConfig.mapProvider,
            mapApiUrl: subFieldConfig.mapApiUrl,
            mapApiKey: subFieldConfig.mapApiKey,
            buttonText: subFieldConfig.buttonText,
            buttonVariant: subFieldConfig.buttonVariant,
            showYearOnly: subFieldConfig.showYearOnly,
            metadata: {
                ...(subFieldConfig.metadata || {}),
                active: subFieldConfig.metadata?.active !== false,
                isCustomerName:
                    subFieldConfig.type === 'text'
                        ? isCustomerNameMetadataEnabled(subFieldConfig.metadata?.isCustomerName)
                        : undefined,
                defaultValue: subFieldConfig?.defaultValue || undefined,
                note: subFieldConfig?.note || undefined,
                is_year_only: subFieldConfig.showYearOnly,
            },
        };

        const isEditSubField = Boolean(selectedSubFieldId && !isConfiguringSubField);
        const sectionToKeepExpanded = selectedSectionId;
        setIsSubFieldDialogClosing(true);
        deferDialogReset(() => {
            if (isEditSubField) {
                setSubFieldsConfig((prev) => prev.map((sf) => (sf.id === selectedSubFieldId ? subFieldData : sf)));
                toast({ title: 'Sub-Field Updated', description: `${subFieldConfig.label} has been updated.` });
            } else {
                setSubFieldsConfig((prev) => [...prev, subFieldData]);
                toast({ title: 'Sub-Field Added', description: `${subFieldConfig.label} has been added.` });
            }

            setIsSubFieldDialogOpen(false);
            setIsSubFieldDialogClosing(false);
            setIsConfiguringSubField(false);
            setSubFieldConfig({ metadata: {} });
            setSubFieldOptionsInput({});
            setSubFieldDependentOptionsInput('');
            setSelectedSubFieldId(null);
            expandSection?.(sectionToKeepExpanded);
        });
    }, [
        subFieldConfig,
        selectedSubFieldId,
        isConfiguringSubField,
        toast,
        disableRatingParameters,
        isCustomerTemplateMode,
        pages,
        subFieldsConfig,
        selectedSectionId,
        expandSection,
    ]);

    // ── addLibraryField ───────────────────────────────────────────────────────────
    const addLibraryField = useCallback((
        libraryField: { id: string; label: string; icon: React.ReactNode; field: Partial<Field> },
        sectionId: string,
    ) => {
        if (!selectedPageId) {
            toast({ title: 'Select Page', description: 'Please select a page first.', variant: 'destructive' });
            return;
        }
        const selectedPage = pages.find((p) => p.id === selectedPageId);
        if (!selectedPage || !selectedPage.sections) {
            toast({ title: 'No Section', description: 'Please create a section first.', variant: 'destructive' });
            return;
        }
        const selectedSection = selectedPage.sections.find((s) => s.id === sectionId);
        if (!selectedSection) {
            toast({ title: 'Section Not Found', description: 'The selected section was not found.', variant: 'destructive' });
            return;
        }

        const fieldData: Field = {
            id: `field${Date.now()}`,
            type: libraryField.field.type as FieldType,
            label: libraryField.field.label || '',
            name: libraryField.field.name || generateFieldName(libraryField.field.label || ''),
            isLocked: libraryField.field.isLocked === true,
            placeholder: libraryField.field.placeholder,
            required: libraryField.field.required || false,
            isRatingParameter: disableRatingParameters ? false : libraryField.field.isRatingParameter || false,
            isMasterData: libraryField.field.isMasterData || false,
            validations: libraryField.field.validations || [],
            conditionalLogic: libraryField.field.conditionalLogic,
            options: libraryField.field.options,
            optionsUrl: libraryField.field.optionsUrl,
            dependentOn: libraryField.field.dependentOn,
            dependentOptions: libraryField.field.dependentOptions,
            dependentOptionsUrl: libraryField.field.dependentOptionsUrl,
            masterDataTable: libraryField.field.masterDataTable,
            defaultValue: libraryField.field.defaultValue,
            metadata: {
                ...(libraryField.field.metadata || {}),
                active: libraryField.field.metadata?.active !== false,
                isLocked: libraryField.field.isLocked === true,
            },
        } as any;

        updatePages((prev) =>
            prev.map((page) =>
                page.id === selectedPageId
                    ? {
                        ...page,
                        sections: (page.sections || []).map((section) =>
                            section.id === sectionId
                                ? { ...section, fields: [...(section.fields || []), fieldData] }
                                : section,
                        ),
                    }
                    : page,
            ),
        );
        toast({
            title: 'Field Added',
            description: `${libraryField.label} has been added to ${formatFieldLocation(selectedPage, selectedSection)}.`,
        });
    }, [disableRatingParameters, selectedPageId, pages, updatePages, toast]);

    return {
        // Dialog state
        isFieldDialogOpen,
        isFieldDialogClosing,
        setIsFieldDialogOpen,
        isConfiguringField,
        setIsConfiguringField,
        selectedFieldId,
        setSelectedFieldId,
        selectedSectionId,
        setSelectedSectionId,
        fieldConfig,
        setFieldConfig,
        optionsInput,
        setOptionsInput,
        dependentOptionsInput,
        setDependentOptionsInput,
        // Options source
        optionsSourceMode,
        setOptionsSourceMode,
        selectedGlobalMaster,
        setSelectedGlobalMaster,
        selectedMasterValues,
        setSelectedMasterValues,
        // Validation errors
        minMaxError,
        setMinMaxError,
        minMaxCharacterError,
        setMinMaxCharacterError,
        hasMinOrMax,
        hasFormat,
        // Combination / sub-field
        subFieldsConfig,
        setSubFieldsConfig,
        combinationRowsCount,
        setCombinationRowsCount,
        combinationRowLabels,
        setCombinationRowLabels,
        combinationRowLabelsInput,
        setCombinationRowLabelsInput,
        maximizeAdditionOfRows,
        setMaximizeAdditionOfRows,
        maximumRowCountInput,
        setMaximumRowCountInput,
        subFieldOptionsInput,
        setSubFieldOptionsInput,
        isSubFieldDialogOpen,
        isSubFieldDialogClosing,
        setIsSubFieldDialogOpen,
        isConfiguringSubField,
        setIsConfiguringSubField,
        selectedSubFieldId,
        subFieldConfig,
        setSubFieldConfig,
        subFieldDependentOptionsInput,
        setSubFieldDependentOptionsInput,
        // Actions
        handleCloseFieldDialog,
        handleCloseSubFieldDialog,
        startAddingField,
        startEditingField,
        startAddingSubField,
        startEditingSubField,
        saveField,
        saveSubField,
        addLibraryField,
        validateMinMax,
        validateMinMaxCharacter,
    };
}
