import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import {
    evaluateConditionalLogic,
    resolveConditionalLogicFieldOptions,
    resolveConditionalLogicFieldValue,
} from '@/features/proposals/utils/conditionalLogic';
import {
    Upload,
    MapPin,
    Trash2,
    Plus,
    ArrowLeft,
    ArrowRight,
    Circle,
    Send
} from 'lucide-react';
import { Field, Page, Section, FieldType } from '../types';
import { isMetadataActive } from '../api/proposalFormDesign';
import { getConsentMetadata } from './consent';
import { LocationPreviewField } from '../components/LocationPreviewField';

/**
 * Determines if a field should be shown in preview based on conditional logic
 */
export const shouldShowFieldInPreview = (
    field: Field,
    pages: Page[],
    fullscreenPreviewValues: Record<string, any>
): boolean => {
    if (!isMetadataActive(field)) return false;
    if (!field.conditionalLogic) return true;
    const allFields = pages.flatMap((p) => p.sections?.flatMap((s) => s.fields) || []);
    return evaluateConditionalLogic(
        field.conditionalLogic,
        (fieldRef) => resolveConditionalLogicFieldValue(allFields, fullscreenPreviewValues, fieldRef),
        (fieldRef) => resolveConditionalLogicFieldOptions(allFields, fieldRef),
    );
};

/**
 * Determines if a section should be shown in preview based on visibility metadata
 */
export const shouldShowSectionInPreview = (
    section: Section,
    pages: Page[],
    fullscreenPreviewValues: Record<string, any>
): boolean => {
    const parentPage = pages.find((page) =>
        (page.sections || []).some((currentSection) => currentSection.id === section.id),
    );
    if ((parentPage?.sections?.length ?? 0) > 1 && !isMetadataActive(section)) return false;
    if (!section.fields || section.fields.length === 0) return false;

    const visibility = section.metadata?.visibility;
    if (visibility) {
        if (
            !visibility.masterValueId &&
            (!visibility.valueText || visibility.valueText.trim() === '')
        ) {
            return false;
        }

        const depFieldName = visibility.field;
        const condition = visibility.condition;
        const valueText = visibility.valueText || '';

        const allFields = pages.flatMap((p) => p.sections?.flatMap((s) => s.fields) || []);
        const depField = allFields.find((f) => f.name === depFieldName);
        const depValue = depField
            ? (fullscreenPreviewValues[depField.id] ?? '')
            : (fullscreenPreviewValues[depFieldName] ?? '');

        const depValueStr = String(
            depValue && typeof depValue === 'object'
                ? ((depValue as { value?: unknown }).value ?? '')
                : (depValue ?? ''),
        );
        const selectedMasterValueId =
            depValue && typeof depValue === 'object'
                ? (depValue as { masterValueId?: unknown }).masterValueId !== undefined &&
                    (depValue as { masterValueId?: unknown }).masterValueId !== null
                    ? String((depValue as { masterValueId?: unknown }).masterValueId)
                    : undefined
                : undefined;

        switch (condition) {
            case 'equals':
                if (visibility.masterValueId && selectedMasterValueId) {
                    if (String(selectedMasterValueId) !== String(visibility.masterValueId)) return false;
                } else if (depValueStr.toLowerCase() !== String(valueText).toLowerCase()) {
                    return false;
                }
                break;
            case 'not_equals':
            case 'notEquals':
                if (visibility.masterValueId && selectedMasterValueId) {
                    if (String(selectedMasterValueId) === String(visibility.masterValueId)) return false;
                } else if (depValueStr.toLowerCase() === String(valueText).toLowerCase()) {
                    return false;
                }
                break;
            case 'contains':
                if (!depValueStr.toLowerCase().includes(String(valueText).toLowerCase())) return false;
                break;
            case 'not_contains':
            case 'notContains':
                if (depValueStr.toLowerCase().includes(String(valueText).toLowerCase())) return false;
                break;
            case 'greater_than':
            case 'greaterThan':
                if (depValueStr === '' || depValue === null || depValue === undefined) return false;
                if (Number(depValueStr) <= Number(valueText)) return false;
                break;
            case 'less_than':
            case 'lessThan':
                if (depValueStr === '' || depValue === null || depValue === undefined) return false;
                if (Number(depValueStr) >= Number(valueText)) return false;
                break;
            case 'greater_than_or_equal':
            case 'greaterThanOrEqual':
                if (depValueStr === '' || depValue === null || depValue === undefined) return false;
                if (Number(depValueStr) < Number(valueText)) return false;
                break;
            case 'less_than_or_equal':
            case 'lessThanOrEqual':
                if (depValueStr === '' || depValue === null || depValue === undefined) return false;
                if (Number(depValueStr) > Number(valueText)) return false;
                break;
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
                break;
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
                break;
            default:
                break;
        }
    }

    return section.fields.some((field) => shouldShowFieldInPreview(field, pages, fullscreenPreviewValues));
};

/**
 * Estimates the height of a field for page wrapping
 */
export const estimateFieldHeight = (field: Field): number => {
    const baseHeight = 60;
    const spacing = 16;
    switch (field.type) {
        case 'text':
        case 'number':
        case 'date':
        case 'time':
        case 'dropdown':
        case 'location':
            return baseHeight + spacing;
        case 'textarea':
            return 120 + spacing;
        case 'datePeriod':
        case 'policyPeriod':
            return baseHeight * 2 + spacing;
        case 'checkbox':
        case 'consent':
            return 40 + spacing;
        case 'file':
            return 80 + spacing;
        case 'multiselect':
        case 'multiselectDropdown':
            return baseHeight + spacing;
        case 'combination':
        case 'repeatable': {
            const rows = field.type === 'combination'
                ? Math.max(field.combinationRowLabels?.length || 0, 1)
                : 3;
            const subFieldsCount = field.subFields?.length || 1;
            return rows * 60 + subFieldsCount * 20 + 100 + spacing;
        }
        case 'chooseButton':
            return 50 + spacing;
        default:
            return baseHeight + spacing;
    }
};

/**
 * Determines if a field should span the full width of the container
 */
export const shouldFieldSpanFullWidth = (field: Field): boolean => {
    return [
        'file',
        'location',
        'combination',
        'datePeriod',
        'policyPeriod',
        'chooseButton',
    ].includes(field.type);
};

export interface PreviewState {
    pages: Page[];
    currentPreviewPage: string;
    setCurrentPreviewPage: (id: string) => void;
    getNextPage: (id: string) => string | null;
}

/**
 * Renders a preview of a single field
 */
export const renderFieldPreview = (field: Field, previewState?: PreviewState) => {
    const { pages = [], currentPreviewPage = '', setCurrentPreviewPage = () => { }, getNextPage = () => null } = previewState || {};

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
        case 'dropdown': {
            const previewOptions = String(field.metadata?.allowOther).toLowerCase() === 'true'
                ? [
                    ...(field.options || []).filter((option) => {
                        const value = typeof option === 'string'
                            ? option
                            : option.value || option.label || '';
                        return String(value).toLowerCase() !== 'other';
                    }),
                    'Other',
                ]
                : field.options || [];
            const getPreviewOptionText = (option: (typeof previewOptions)[number]) =>
                typeof option === 'string' ? option : option.value || option.label || '';
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
                        {!field.dependentOptions && previewOptions.length > 0 && (
                            <SelectContent>
                                {previewOptions.map((option, idx) => {
                                    const val = getPreviewOptionText(option);
                                    const label = getPreviewOptionText(option);
                                    return (
                                        <SelectItem key={idx} value={val}>
                                            {label}
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        )}
                        {!field.dependentOptions && field.optionsUrl && (
                            <SelectContent>
                                <SelectItem value="loading" disabled>
                                    Loading options from URL...
                                </SelectItem>
                                {String(field.metadata?.allowOther).toLowerCase() === 'true' && (
                                    <SelectItem value="Other">Other</SelectItem>
                                )}
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
        }
        case 'date':
            return (
                <div className="space-y-2">
                    <Label>
                        {field.label} {field.required && <span className="text-destructive">*</span>}
                    </Label>
                    <DatePicker
                        mode={field.showYearOnly ? 'year' : 'date'}
                        value={typeof field.defaultValue === 'string' ? field.defaultValue : undefined}
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
        case 'policyPeriod':
            return (
                <div className="space-y-2">
                    <Label>
                        {field.label} {field.required && <span className="text-destructive">*</span>}
                    </Label>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Start Date</Label>
                            <DatePicker
                                mode={field.showYearOnly ? 'year' : 'date'}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">End Date</Label>
                            <DatePicker
                                mode={field.showYearOnly ? 'year' : 'date'}
                            />
                        </div>
                    </div>
                </div>
            );
        case 'checkbox':
            return (
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id={field.id}
                        checked={field.defaultValue === true}
                        onCheckedChange={() => { }} // Preview only
                    />
                    <Label htmlFor={field.id}>
                        {field.label} {field.required && <span className="text-destructive">*</span>}
                    </Label>
                </div>
            );
        case 'consent': {
            const consent = getConsentMetadata(field);
            return (
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id={field.id}
                        checked={field.defaultValue === true}
                        onCheckedChange={() => { }}
                    />
                    <Label htmlFor={field.id}>
                        {field.label}
                        {consent.consentLinkText && (
                            <span className="ml-1 text-sm font-medium text-primary underline underline-offset-4">
                                {consent.consentLinkText}
                            </span>
                        )}
                        {field.required && <span className="ml-1 text-destructive">*</span>}
                    </Label>
                </div>
            );
        }
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
        case 'multiselectDropdown':
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
                                {field.options.map((option, idx) => {
                                    const val = typeof option === 'string' ? option : (option as any).value || (option as any).label || '';
                                    const label = typeof option === 'string' ? option : (option as any).label || (option as any).value || '';
                                    return (
                                        <SelectItem key={idx} value={val}>
                                            {label}
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        )}
                    </Select>
                    {Array.isArray(field.defaultValue) && field.defaultValue.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {field.defaultValue.map((val, idx) => (
                                <Badge key={idx} variant="secondary">
                                    {typeof val === 'string' ? val : (val as any).label || (val as any).value || ''}
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
                <div className="space-y-3">
                    <Label className="text-sm font-semibold">
                        {field.label} {field.required && <span className="text-destructive">*</span>}
                    </Label>
                    {field.subFields && field.subFields.length > 0 ? (
                        <div className="border rounded-xl p-5 space-y-5 bg-card shadow-sm overflow-auto max-h-[500px]">
                            {/* Table Header */}
                            <div
                                className="grid gap-3 items-end pb-2 border-b"
                                style={{
                                    gridTemplateColumns: `${field.combinationRowLabels && field.combinationRowLabels.length > 0
                                        ? '120px '
                                        : ''
                                        }repeat(${field.subFields.length}, minmax(120px, 1fr)) 60px`,
                                }}
                            >
                                {field.combinationRowLabels && field.combinationRowLabels.length > 0 && (
                                    <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Row Label</div>
                                )}
                                {field.subFields.map((subField) => (
                                    <Label key={subField.id} className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                        {subField.label}{' '}
                                        {subField.required && <span className="text-destructive">*</span>}
                                    </Label>
                                ))}
                                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-center">
                                    Actions
                                </div>
                            </div>

                            {/* Rows (Preview shows configured number of rows) */}
                            {Array.from({ length: Math.max(field.combinationRowLabels?.length || 0, 1) }, (_, rowNum) => (
                                <div
                                    key={rowNum}
                                    className="grid gap-3 items-center group/row"
                                    style={{
                                        gridTemplateColumns: `${field.combinationRowLabels && field.combinationRowLabels.length > 0
                                            ? '120px '
                                            : ''
                                            }repeat(${field.subFields.length}, minmax(120px, 1fr)) 60px`,
                                    }}
                                >
                                    {field.combinationRowLabels && field.combinationRowLabels.length > 0 && (
                                        <div className="text-sm font-semibold text-foreground">
                                            {field.combinationRowLabels[rowNum] || `${rowNum + 1}`}
                                        </div>
                                    )}
                                    {field.subFields.map((subField) => (
                                        <div key={subField.id} className="w-full">
                                            {subField.type === 'text' && (
                                                <Input
                                                    type="text"
                                                    placeholder={
                                                        subField.placeholder || `Enter ${subField.label.toLowerCase()}`
                                                    }
                                                    className="h-9 text-sm shadow-sm"
                                                />
                                            )}
                                            {subField.type === 'number' && (
                                                <Input
                                                    type="number"
                                                    placeholder={
                                                        subField.placeholder || `Enter ${subField.label.toLowerCase()}`
                                                    }
                                                    className="h-9 text-sm shadow-sm"
                                                />
                                            )}
                                            {subField.type === 'date' && (
                                                <DatePicker
                                                    mode={subField.showYearOnly ? 'year' : 'date'}
                                                    className="h-9 shadow-sm"
                                                />
                                            )}
                                            {subField.type === 'dropdown' && (
                                                <Select>
                                                    <SelectTrigger className="h-9 text-sm shadow-sm">
                                                        <SelectValue
                                                            placeholder={
                                                                subField.placeholder || `Select ${subField.label.toLowerCase()}`
                                                            }
                                                        />
                                                    </SelectTrigger>
                                                    {subField.options && subField.options.length > 0 && (
                                                        <SelectContent>
                                                            {subField.options.map((option, optIdx) => {
                                                                const val = typeof option === 'string' ? option : (option as any).value || (option as any).label || '';
                                                                const label = typeof option === 'string' ? option : (option as any).label || (option as any).value || '';
                                                                return (
                                                                    <SelectItem key={optIdx} value={val}>
                                                                        {label}
                                                                    </SelectItem>
                                                                );
                                                            })}
                                                        </SelectContent>
                                                    )}
                                                </Select>
                                            )}
                                            {subField.type === 'chooseButton' && (
                                                <div className="flex flex-wrap gap-1">
                                                    {subField.options && subField.options.length > 0 ? (
                                                        subField.options.map((option, optIdx) => {
                                                            const label = typeof option === 'string' ? option : (option as any).label || (option as any).value || '';
                                                            return (
                                                                <Button key={optIdx} variant="outline" size="sm" className="h-8 text-xs px-3 shadow-none">
                                                                    {label}
                                                                </Button>
                                                            );
                                                        })
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground italic">No options</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    <div className="flex justify-center">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/60 hover:text-destructive hover:bg-destructive/5 opacity-0 group-hover/row:opacity-100 transition-all">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}

                            {/* Add Row Button */}
                            <Button variant="outline" className="w-full gap-2 border-dashed py-6 hover:bg-muted/50 hover:border-primary/50 transition-all">
                                <Plus className="w-4 h-4" />
                                Add Row
                            </Button>
                        </div>
                    ) : (
                        <div className="border-2 border-dashed rounded-xl p-8 bg-muted/20">
                            <p className="text-sm text-muted-foreground text-center">
                                No sub-fields configured. Use the editor to add sub-fields to this combination field.
                            </p>
                        </div>
                    )}
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
                                const label = typeof option === 'string' ? option : (option as any).label || (option as any).value || '';
                                return (
                                    <Button key={idx} variant={field.buttonVariant || 'outline'} className="gap-2">
                                        <Circle className="w-4 h-4" />
                                        {label}
                                    </Button>
                                );
                            })
                        ) : (
                            <div className="flex gap-2">
                                <Button variant="outline" className="gap-2">
                                    <Circle className="w-4 h-4" />
                                    Option 1
                                </Button>
                                <Button variant="outline" className="gap-2">
                                    <Circle className="w-4 h-4" />
                                    Option 2
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            );
        case 'nextButton':
            return (
                <div className="space-y-2">
                    <Button
                        variant={field.buttonVariant || 'default'}
                        className="w-full gap-2"
                        onClick={() => {
                            if (field.buttonTargetPage) {
                                const targetPage = pages.find((p) => p.id === field.buttonTargetPage);
                                if (targetPage) {
                                    setCurrentPreviewPage(field.buttonTargetPage);
                                }
                            } else {
                                const nextPageId = getNextPage(currentPreviewPage);
                                if (nextPageId) {
                                    setCurrentPreviewPage(nextPageId);
                                }
                            }
                        }}
                    >
                        {field.buttonText || 'Next'}
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                </div>
            );
        case 'backButton':
            return (
                <div className="space-y-2">
                    <Button
                        variant={field.buttonVariant || 'outline'}
                        className="w-full gap-2"
                        onClick={() => {
                            if (field.buttonTargetPage) {
                                const targetPage = pages.find((p) => p.id === field.buttonTargetPage);
                                if (targetPage) {
                                    setCurrentPreviewPage(field.buttonTargetPage);
                                }
                            }
                        }}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {field.buttonText || 'Back'}
                    </Button>
                </div>
            );
        case 'submitButton':
            return (
                <div className="space-y-2">
                    <Button
                        variant={field.buttonVariant || 'default'}
                        className="w-full gap-2"
                        onClick={() => {
                            if (field.buttonTargetPage) {
                                const targetPage = pages.find((p) => p.id === field.buttonTargetPage);
                                if (targetPage) {
                                    setCurrentPreviewPage(field.buttonTargetPage);
                                }
                            } else {
                                const nextPageId = getNextPage(currentPreviewPage);
                                if (nextPageId) {
                                    setCurrentPreviewPage(nextPageId);
                                }
                            }
                        }}
                    >
                        <Send className="w-4 h-4" />
                        {field.buttonText || 'Submit'}
                    </Button>
                </div>
            );
        case 'button':
            return (
                <div className="space-y-2">
                    <Button variant={field.buttonVariant || 'default'} className="w-full gap-2">
                        {field.buttonText || field.label || 'Button'}
                    </Button>
                </div>
            );
        default:
            return null;
    }
};
