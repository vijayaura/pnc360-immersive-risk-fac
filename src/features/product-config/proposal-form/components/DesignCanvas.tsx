import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    GripVertical,
    ChevronDown,
    ChevronRight,
    ShieldCheck,
    Lock,
    LockOpen,
    Edit,
    Trash2,
    Eye as EyeIcon,
    Plus,
    Calculator,
    Copy,
    CalendarDays,
    LockOpenIcon,
    LockKeyhole,
    LockKeyholeIcon,
    LockKeyholeOpenIcon,
    Globe,
} from 'lucide-react';
import { cn } from '@/shared/utils/lib-utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    CalculationConfig,
    Page,
    Section,
    Field,
    FieldType,
    isFieldLocked,
} from '@/features/product-config/proposal-form/api/proposalFormDesign';

interface DesignCanvasProps {
    pages: Page[];
    isCustomerTemplateMode?: boolean;
    isExistingCustomerTemplateEdit?: boolean;
    hideRatingBadges?: boolean;
    allowMultiplePages?: boolean;
    selectedPageId: string;
    /** Section that receives fields from the sidebar / is the design focus. */
    selectedSectionId?: string | null;
    setSelectedPageId: (id: string) => void;
    draggedPageId: string | null;
    handlePageDragStart: (e: React.DragEvent, id: string) => void;
    handlePageDragOver: (e: React.DragEvent) => void;
    handlePageDragLeave: (e: React.DragEvent) => void;
    handlePageDrop: (e: React.DragEvent, id: string) => void;
    handleDragEnd: () => void;
    togglePageExpansion: (id: string) => void;
    expandedPages: Set<string>;
    updatePageTitle: (id: string, title: string) => void;
    updatePageSubtitle: (id: string, subtitle: string) => void;
    updatePageActive: (id: string, active: boolean) => void;
    setSelectedPageForValidation: (page: Page) => void;
    setIsPageValidationDialogOpen: (open: boolean) => void;
    setIsPageValidationApplyAttempted: (attempted: boolean) => void;
    deletePage: (id: string) => void;
    duplicatePage: (id: string) => void;
    draggedSectionId: string | null;
    handleSectionDragStart: (e: React.DragEvent, pageId: string, sectionId: string) => void;
    handleSectionDragOver: (e: React.DragEvent) => void;
    handleSectionDragLeave: (e: React.DragEvent) => void;
    handleSectionDrop: (e: React.DragEvent, pageId: string, sectionId: string) => void;
    setSelectedSectionId: (id: string) => void;
    expandedSections: Set<string>;
    toggleSectionExpansion: (id: string) => void;
    updateSectionTitle: (pageId: string, sectionId: string, title: string) => void;
    updateSectionSubtitle: (pageId: string, sectionId: string, subtitle: string) => void;
    updateSectionActive: (pageId: string, sectionId: string, active: boolean) => void;
    updateSectionVisibility: (pageId: string, sectionId: string, visibility: any) => void;
    startAddingField: (sectionId: string, initialType?: FieldType) => void;
    deleteSection: (pageId: string, sectionId: string) => void;
    duplicateSection: (pageId: string, sectionId: string) => void;
    dragOverSectionId: string | null;
    setDragOverSectionId: (id: string | null) => void;
    draggedFieldType: string | null;
    draggedFieldId: string | null;
    setFieldConfig: (config: any) => void;
    setIsConfiguringField: (configuring: boolean) => void;
    setIsFieldDialogOpen: (open: boolean) => void;
    setDraggedFieldType: (type: string | null) => void;
    handleDrop: (e: React.DragEvent, fieldId: string | null, pageId: string, sectionId: string) => void;
    handleDragStart: (fieldId: string, pageId: string, sectionId: string) => void;
    handleDragOver: (e: React.DragEvent) => void;
    handleDragLeave: (e: React.DragEvent) => void;
    startEditingField: (pageId: string, sectionId: string, field: Field) => void;
    deleteField: (pageId: string, sectionId: string, fieldId: string) => void;
    duplicateField: (pageId: string, sectionId: string, fieldId: string) => void;
    toggleFieldLock: (pageId: string, sectionId: string, fieldId: string) => void;
    addSection: (pageId: string) => void;
    setCurrentCalculationFieldId: (id: string) => void;
    setCurrentCalculationSectionId: (id: string) => void;
    setCurrentCalculationPageId: (id: string) => void;
    setTempCalculationConfig: (config: any) => void;
    setIsCalculationDialogOpen: (open: boolean) => void;
    setEditingSectionField: (field: any) => void;
    setOptionsInput: (input: string) => void;
    setDependentOptionsInput: (input: string) => void;
    setSubFieldsConfig: (config: any) => void;
    setCombinationRowsCount: (count: number) => void;
    setCombinationRowLabels: (labels: string[]) => void;
    setSelectedFieldId: (id: string | null) => void;
    onOpenApiIntegration?: (pageId: string) => void;
    pageIntegrationCounts?: Record<string, number>;
}

export const DesignCanvas: React.FC<DesignCanvasProps> = ({
    pages,
    isCustomerTemplateMode = false,
    isExistingCustomerTemplateEdit = false,
    hideRatingBadges = false,
    allowMultiplePages = true,
    selectedPageId,
    selectedSectionId = null,
    setSelectedPageId,
    draggedPageId,
    handlePageDragStart,
    handlePageDragOver,
    handlePageDragLeave,
    handlePageDrop,
    handleDragEnd,
    togglePageExpansion,
    expandedPages,
    updatePageTitle,
    updatePageSubtitle,
    updatePageActive,
    setSelectedPageForValidation,
    setIsPageValidationDialogOpen,
    setIsPageValidationApplyAttempted,
    deletePage,
    duplicatePage,
    draggedSectionId,
    handleSectionDragStart,
    handleSectionDragOver,
    handleSectionDragLeave,
    handleSectionDrop,
    setSelectedSectionId,
    expandedSections,
    toggleSectionExpansion,
    updateSectionTitle,
    updateSectionSubtitle,
    updateSectionActive,
    updateSectionVisibility,
    startAddingField,
    deleteSection,
    duplicateSection,
    dragOverSectionId,
    setDragOverSectionId,
    draggedFieldType,
    draggedFieldId,
    setFieldConfig,
    setIsConfiguringField,
    setIsFieldDialogOpen,
    setDraggedFieldType,
    handleDrop,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    startEditingField,
    deleteField,
    duplicateField,
    toggleFieldLock,
    addSection,
    setCurrentCalculationFieldId,
    setCurrentCalculationSectionId,
    setCurrentCalculationPageId,
    setTempCalculationConfig,
    setIsCalculationDialogOpen,
    setEditingSectionField,
    setOptionsInput,
    setDependentOptionsInput,
    setSubFieldsConfig,
    setCombinationRowsCount,
    setCombinationRowLabels,
    setSelectedFieldId,
    onOpenApiIntegration,
    pageIntegrationCounts,
}) => {
    const [openVisibilityPopoverKey, setOpenVisibilityPopoverKey] = React.useState<string | null>(null);
    const [initialSectionVisibility, setInitialSectionVisibility] = React.useState<any>(undefined);
    const isFormLikePage = (pageType?: string) =>
        pageType === 'form' || pageType === 'general' || pageType === 'quotesList';
    const getGeneralTemplateName = (page: Page) => {
        if (typeof page.generalTemplateName === 'string' && page.generalTemplateName.trim()) {
            return page.generalTemplateName.trim();
        }

        const metadataTemplateName = page.metadata?.generalTemplateName;
        return typeof metadataTemplateName === 'string' && metadataTemplateName.trim()
            ? metadataTemplateName.trim()
            : '';
    };

    const cloneVisibility = (visibility: any) => (visibility ? { ...visibility } : undefined);

    const closeVisibilityPopover = () => {
        setOpenVisibilityPopoverKey(null);
        setInitialSectionVisibility(undefined);
    };

    return (
        <div className="proposal-form-panel-scroll min-h-0 flex-1 overflow-y-auto border-r bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:20px_20px]">
            <div className="p-6">
                <div className="space-y-4">
                    {pages.map((page: any, pageIdx: number) => {
                        const isLockedCustomerTemplatePage = !!page.isCustomerProfileTemplatePage;
                        const generalTemplateName = getGeneralTemplateName(page);
                        const canDragPage = allowMultiplePages && !isLockedCustomerTemplatePage;
                        const pageUsesSections = isFormLikePage(page.pageType);
                        const pageSections = page.sections || [];
                        const areAllPageSectionsInactive =
                            pageUsesSections &&
                            pageSections.length > 1 &&
                            pageSections.every((section: any) => section.metadata?.active === false);

                        return (
                        <Card
                            key={page.id ?? `page-${pageIdx}`}
                            className={`${selectedPageId === page.id ? 'ring-2 ring-primary' : ''} ${draggedPageId === page.id ? 'opacity-50' : ''
                                }`}
                            draggable={canDragPage}
                            onClick={() => setSelectedPageId(page.id)}
                            onDragStart={(e) => {
                                if (canDragPage) handlePageDragStart(e, page.id);
                            }}
                            onDragOver={(e) => {
                                if (canDragPage) handlePageDragOver(e);
                            }}
                            onDragLeave={(e) => {
                                if (canDragPage) handlePageDragLeave(e);
                            }}
                            onDrop={(e) => {
                                if (canDragPage) handlePageDrop(e, page.id);
                            }}
                            onDragEnd={handleDragEnd}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2 flex-1">
                                        {canDragPage && (
                                            <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab active:cursor-grabbing flex-shrink-0" />
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => {
                                                setSelectedPageId(page.id);
                                                togglePageExpansion(page.id);
                                            }}
                                        >
                                            {expandedPages.has(page.id) ? (
                                                <ChevronDown className="w-4 h-4" />
                                            ) : (
                                                <ChevronRight className="w-4 h-4" />
                                            )}
                                        </Button>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    value={page.title}
                                                    onChange={(e) => updatePageTitle(page.id, e.target.value)}
                                                    className="font-semibold border-none p-0 h-auto"
                                                    placeholder="Page Title"
                                                />
                                            </div>
                                            <Input
                                                value={page.subtitle || ''}
                                                onChange={(e) => updatePageSubtitle(page.id, e.target.value)}
                                                className="text-sm text-muted-foreground border-none p-0 h-auto mt-1"
                                                placeholder="Page Subtitle (optional)"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {isLockedCustomerTemplatePage && (
                                            <Badge variant="secondary" className="shrink-0">
                                                Customer Template
                                            </Badge>
                                        )}
                                        {generalTemplateName && (
                                            <Badge variant="outline" className="max-w-[220px] shrink-0">
                                                <span className="truncate">{generalTemplateName}</span>
                                            </Badge>
                                        )}
                                        <div
                                            className="flex items-center gap-2 px-2"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Label
                                                htmlFor={`page-active-${page.id}`}
                                                className="text-xs font-medium text-muted-foreground"
                                            >
                                                Active
                                            </Label>
                                            <Switch
                                                id={`page-active-${page.id}`}
                                                checked={!areAllPageSectionsInactive && page.metadata?.active !== false}
                                                disabled={areAllPageSectionsInactive}
                                                onCheckedChange={(checked) => updatePageActive(page.id, checked)}
                                            />
                                        </div>
                                        {onOpenApiIntegration && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={cn(
                                                    'h-8 w-8 transition-colors relative',
                                                    (pageIntegrationCounts?.[page.id] ?? 0) > 0 &&
                                                    'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary',
                                                )}
                                                onClick={() => onOpenApiIntegration(page.id)}
                                                title="API Integration"
                                            >
                                                <Globe className="w-4 h-4" />
                                                {(pageIntegrationCounts?.[page.id] ?? 0) > 0 && (
                                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                                                        {pageIntegrationCounts[page.id]}
                                                    </span>
                                                )}
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={cn(
                                                'h-8 w-8 transition-colors',
                                                page.validations &&
                                                page.validations.length > 0 &&
                                                'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary',
                                            )}
                                            onClick={() => {
                                                setSelectedPageForValidation(page);
                                                setIsPageValidationDialogOpen(true);
                                                setIsPageValidationApplyAttempted(false);
                                            }}
                                            title="Page Validations"
                                        >
                                            <ShieldCheck className="w-4 h-4" />
                                        </Button>
                                        {canDragPage && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:bg-primary/10 hover:backdrop-blur-sm hover:text-primary transition-all duration-200"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    duplicatePage(page.id);
                                                }}
                                                title="Duplicate Page"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </Button>
                                        )}
                                        {canDragPage && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                                                    onClick={() => deletePage(page.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            {expandedPages.has(page.id) && (
                                <CardContent className="space-y-4">
                                    {isFormLikePage(page.pageType) &&
                                        page.sections &&
                                        page.sections.map((section: any, sectionIdx: number) => {
                                            const isSidebarTargetSection =
                                                Boolean(selectedSectionId) &&
                                                selectedSectionId === section.id &&
                                                page.id === selectedPageId;
                                            return (
                                            <Card
                                                key={section.id ?? `section-${sectionIdx}`}
                                                className={cn(
                                                    // Same surface for every section; only the sidebar target gets a light focus ring.
                                                    'border border-primary/20 bg-primary/5 transition-smooth',
                                                    isSidebarTargetSection &&
                                                        'shadow-sm ring-1 ring-inset ring-primary/30',
                                                    draggedSectionId === section.id && 'opacity-50',
                                                )}
                                                draggable
                                                onDragStart={(e) => handleSectionDragStart(e, page.id, section.id)}
                                                onDragOver={handleSectionDragOver}
                                                onDragLeave={handleSectionDragLeave}
                                                onDrop={(e) => handleSectionDrop(e, page.id, section.id)}
                                                onDragEnd={handleDragEnd}
                                                onClick={() => {
                                                    setSelectedPageId(page.id);
                                                    setSelectedSectionId(section.id);
                                                }}
                                            >
                                                <CardHeader className="pb-3">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex items-center gap-2 flex-1">
                                                            <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab active:cursor-grabbing flex-shrink-0" />
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleSectionExpansion(section.id);
                                                                }}
                                                            >
                                                                {expandedSections.has(section.id) ? (
                                                                    <ChevronDown className="w-4 h-4" />
                                                                ) : (
                                                                    <ChevronRight className="w-4 h-4" />
                                                                )}
                                                            </Button>
                                                            <div className="flex-1">
                                                                <Input
                                                                    value={section.title || ''}
                                                                    onChange={(e) =>
                                                                        updateSectionTitle(page.id, section.id, e.target.value)
                                                                    }
                                                                    className="font-medium border-none p-0 h-auto bg-transparent"
                                                                    placeholder="Section Title"
                                                                    onBlur={(e) => {
                                                                        setEditingSectionField(null);
                                                                    }}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') {
                                                                            (e.target as HTMLInputElement).blur();
                                                                        }
                                                                        if (e.key === 'Escape') {
                                                                            setEditingSectionField(null);
                                                                        }
                                                                    }}
                                                                />
                                                                <Input
                                                                    value={section.subtitle || ''}
                                                                    onChange={(e) =>
                                                                        updateSectionSubtitle(page.id, section.id, e.target.value)
                                                                    }
                                                                    className="text-sm text-muted-foreground border-none p-0 h-auto mt-1 bg-transparent"
                                                                    placeholder="Section Subtitle (optional)"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            {page.sections.length > 1 && (
                                                                <div
                                                                    className="flex items-center gap-2 px-2"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <Label
                                                                        htmlFor={`section-active-${section.id}`}
                                                                        className="text-xs font-medium text-muted-foreground"
                                                                    >
                                                                        Active
                                                                    </Label>
                                                                    <Switch
                                                                        id={`section-active-${section.id}`}
                                                                        checked={section.metadata?.active !== false}
                                                                        onCheckedChange={(checked) =>
                                                                            updateSectionActive(page.id, section.id, checked)
                                                                        }
                                                                    />
                                                                </div>
                                                            )}
                                                            <Popover
                                                                open={openVisibilityPopoverKey === `${page.id}:${section.id}`}
                                                                onOpenChange={(open) => {
                                                                    if (open) {
                                                                        setOpenVisibilityPopoverKey(`${page.id}:${section.id}`);
                                                                        setInitialSectionVisibility(
                                                                            cloneVisibility(section.metadata?.visibility),
                                                                        );
                                                                        return;
                                                                    }

                                                                    closeVisibilityPopover();
                                                                }}
                                                            >
                                                                <PopoverTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className={cn(
                                                                            'h-8 w-8',
                                                                            section.metadata?.visibility &&
                                                                            'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary',
                                                                        )}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                        }}
                                                                        title="Section Visibility Condition"
                                                                    >
                                                                        <EyeIcon className="w-4 h-4" />
                                                                    </Button>
                                                                </PopoverTrigger>
                                                                <PopoverContent
                                                                    className="w-96 space-y-3"
                                                                    side="bottom"
                                                                    align="end"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <div className="space-y-1">
                                                                        <div className="text-sm font-medium">
                                                                            Section Visibility Condition
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground">
                                                                            Show this section only when the condition below is true.
                                                                        </div>
                                                                    </div>
                                                                    <div className="grid grid-cols-3 gap-2">
                                                                        {(() => {
                                                                            const visibility = section.metadata?.visibility;
                                                                            const allFields = pages.flatMap((p) =>
                                                                                (p.sections || []).flatMap((s) => s.fields || []),
                                                                            );
                                                                            const selectedFieldFound = visibility?.field
                                                                                ? allFields.find(
                                                                                    (field) => field.name === visibility?.field,
                                                                                )
                                                                                : undefined;
                                                                            const isDropdownField =
                                                                                selectedFieldFound &&
                                                                                (selectedFieldFound.type === 'dropdown' ||
                                                                                    selectedFieldFound.type === 'multiselect' ||
                                                                                    selectedFieldFound.type === 'multiselectDropdown');
                                                                            const dropdownOptions: Array<{
                                                                                label: string;
                                                                                valueKey: string;
                                                                                valueText: string;
                                                                                masterId?: string;
                                                                                masterValueId?: string;
                                                                            }> =
                                                                                selectedFieldFound && Array.isArray(selectedFieldFound.options)
                                                                                    ? selectedFieldFound.options.map((opt: any) => {
                                                                                        if (typeof opt === 'string') {
                                                                                            return {
                                                                                                label: opt,
                                                                                                valueKey: opt,
                                                                                                valueText: opt,
                                                                                            };
                                                                                        }
                                                                                        return {
                                                                                            label: opt.label ?? opt.value ?? '',
                                                                                            valueKey: String(
                                                                                                opt.masterValueId ??
                                                                                                opt.value ??
                                                                                                opt.label ??
                                                                                                '',
                                                                                            ),
                                                                                            valueText: opt.label ?? opt.value ?? '',
                                                                                            masterId:
                                                                                                opt.masterId !== undefined &&
                                                                                                    opt.masterId !== null
                                                                                                    ? String(opt.masterId)
                                                                                                    : undefined,
                                                                                            masterValueId:
                                                                                                opt.masterValueId !== undefined &&
                                                                                                    opt.masterValueId !== null
                                                                                                    ? String(opt.masterValueId)
                                                                                                    : undefined,
                                                                                        };
                                                                                    })
                                                                                    : [];
                                                                            const selectedDropdownValue =
                                                                                visibility?.masterValueId || visibility?.valueText;
                                                                            return (
                                                                                <>
                                                                                    <Select
                                                                                        value={visibility?.field || undefined}
                                                                                        onValueChange={(value) => {
                                                                                            updateSectionVisibility(page.id, section.id, {
                                                                                                field: value,
                                                                                                condition: visibility?.condition || 'equals',
                                                                                                valueText: '',
                                                                                            });
                                                                                        }}
                                                                                    >
                                                                                        <SelectTrigger>
                                                                                            <SelectValue placeholder="Field" />
                                                                                        </SelectTrigger>
                                                                                        <SelectContent>
                                                                                            {allFields
                                                                                                .filter((field) => field.id !== undefined)
                                                                                                .map((field) => (
                                                                                                    <SelectItem key={field.id} value={field.name}>
                                                                                                        {field.label} ({field.name})
                                                                                                    </SelectItem>
                                                                                                ))}
                                                                                            {allFields.length === 0 && (
                                                                                                <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                                                                                                    No fields available. Add fields first.
                                                                                                </div>
                                                                                            )}
                                                                                        </SelectContent>
                                                                                    </Select>
                                                                                    <Select
                                                                                        value={visibility?.condition || 'equals'}
                                                                                        onValueChange={(value) => {
                                                                                            if (!visibility?.field) {
                                                                                                return;
                                                                                            }
                                                                                            updateSectionVisibility(page.id, section.id, {
                                                                                                field: visibility.field,
                                                                                                condition: value,
                                                                                                valueText: visibility?.valueText || '',
                                                                                                masterId: visibility?.masterId,
                                                                                                masterValueId: visibility?.masterValueId,
                                                                                            });
                                                                                        }}
                                                                                    >
                                                                                        <SelectTrigger>
                                                                                            <SelectValue />
                                                                                        </SelectTrigger>
                                                                                        <SelectContent>
                                                                                            <SelectItem value="equals">Equals</SelectItem>
                                                                                            <SelectItem value="not_equals">
                                                                                                Not Equals
                                                                                            </SelectItem>
                                                                                            <SelectItem value="contains">Contains</SelectItem>
                                                                                            <SelectItem value="greater_than">
                                                                                                Greater Than
                                                                                            </SelectItem>
                                                                                            <SelectItem value="less_than">
                                                                                                Less Than
                                                                                            </SelectItem>
                                                                                        </SelectContent>
                                                                                    </Select>
                                                                                    {isDropdownField ? (
                                                                                        <Select
                                                                                            value={selectedDropdownValue || undefined}
                                                                                            onValueChange={(value) => {
                                                                                                if (!visibility?.field) {
                                                                                                    return;
                                                                                                }
                                                                                                const opt = dropdownOptions.find(
                                                                                                    (o) => o.valueKey === value,
                                                                                                );
                                                                                                updateSectionVisibility(page.id, section.id, {
                                                                                                    field: visibility.field,
                                                                                                    condition: visibility.condition || 'equals',
                                                                                                    valueText: opt?.valueText ?? value,
                                                                                                    masterId: opt?.masterId,
                                                                                                    masterValueId: opt?.masterValueId,
                                                                                                });
                                                                                            }}
                                                                                        >
                                                                                            <SelectTrigger>
                                                                                                <SelectValue placeholder="Select option" />
                                                                                            </SelectTrigger>
                                                                                            <SelectContent>
                                                                                                {dropdownOptions.map((opt) => (
                                                                                                    <SelectItem
                                                                                                        key={opt.valueKey}
                                                                                                        value={opt.valueKey}
                                                                                                    >
                                                                                                        {opt.label}
                                                                                                    </SelectItem>
                                                                                                ))}
                                                                                            </SelectContent>
                                                                                        </Select>
                                                                                    ) : (
                                                                                        <Input
                                                                                            placeholder="Value"
                                                                                            value={visibility?.valueText || ''}
                                                                                            onChange={(e) => {
                                                                                                if (!visibility?.field) {
                                                                                                    return;
                                                                                                }
                                                                                                updateSectionVisibility(page.id, section.id, {
                                                                                                    field: visibility.field,
                                                                                                    condition: visibility.condition || 'equals',
                                                                                                    valueText: e.target.value,
                                                                                                });
                                                                                            }}
                                                                                        />
                                                                                    )}
                                                                                </>
                                                                            );
                                                                        })()}
                                                                    </div>
                                                                    <div className="flex items-center justify-between gap-3">
                                                                        <p className="text-xs text-muted-foreground">
                                                                            {(() => {
                                                                                const visibility = section.metadata?.visibility;
                                                                                const allFields = pages.flatMap((p) =>
                                                                                    (p.sections || []).flatMap((s) => s.fields || []),
                                                                                );
                                                                                const selectedFieldFound = visibility?.field
                                                                                    ? allFields.find(
                                                                                        (field) => field.name === visibility?.field,
                                                                                    )
                                                                                    : undefined;
                                                                                const selectedFieldLabel =
                                                                                    selectedFieldFound?.label ||
                                                                                    visibility?.field ||
                                                                                    'selected field';
                                                                                const isDropdownField =
                                                                                    selectedFieldFound &&
                                                                                    (selectedFieldFound.type === 'dropdown' ||
                                                                                        selectedFieldFound.type === 'multiselect' ||
                                                                                        selectedFieldFound.type === 'multiselectDropdown');
                                                                                const dropdownOptions =
                                                                                    selectedFieldFound &&
                                                                                    Array.isArray(selectedFieldFound.options)
                                                                                        ? selectedFieldFound.options.map((opt: any) =>
                                                                                            typeof opt === 'string'
                                                                                                ? {
                                                                                                    label: opt,
                                                                                                    valueKey: opt,
                                                                                                }
                                                                                                : {
                                                                                                    label: opt.label ?? opt.value ?? '',
                                                                                                    valueKey: String(
                                                                                                        opt.masterValueId ??
                                                                                                        opt.value ??
                                                                                                        opt.label ??
                                                                                                        '',
                                                                                                    ),
                                                                                                },
                                                                                        )
                                                                                        : [];
                                                                                const selectedConditionLabel = (() => {
                                                                                    const condition = visibility?.condition || 'equals';
                                                                                    switch (condition) {
                                                                                        case 'not_equals':
                                                                                            return 'does not equal';
                                                                                        case 'contains':
                                                                                            return 'contains';
                                                                                        case 'greater_than':
                                                                                            return 'is greater than';
                                                                                        case 'less_than':
                                                                                            return 'is less than';
                                                                                        case 'equals':
                                                                                        default:
                                                                                            return 'equals';
                                                                                    }
                                                                                })();
                                                                                const selectedValueLabel =
                                                                                    (isDropdownField
                                                                                        ? dropdownOptions.find(
                                                                                            (opt) =>
                                                                                                opt.valueKey ===
                                                                                                (visibility?.masterValueId || visibility?.valueText),
                                                                                        )?.label
                                                                                        : undefined) ||
                                                                                    visibility?.valueText ||
                                                                                    'value';

                                                                                return `Example: If "${selectedFieldLabel}" ${selectedConditionLabel} "${selectedValueLabel}", show this section.`;
                                                                            })()}
                                                                        </p>
                                                                    </div>
                                                                    <div className="ml-auto flex justify-end items-center gap-2">
                                                                        {section.metadata?.visibility?.field && (
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="h-6 text-xs"
                                                                                onClick={() =>
                                                                                    updateSectionVisibility(
                                                                                        page.id,
                                                                                        section.id,
                                                                                        undefined,
                                                                                    )
                                                                                }
                                                                            >
                                                                                Clear
                                                                            </Button>
                                                                        )}
                                                                        <PopoverPrimitive.Close asChild>
                                                                            <Button
                                                                                type="button"
                                                                                variant="outline"
                                                                                size="sm"
                                                                                className="h-6 text-xs"
                                                                                onClick={() => {
                                                                                    updateSectionVisibility(
                                                                                        page.id,
                                                                                        section.id,
                                                                                        cloneVisibility(initialSectionVisibility),
                                                                                    );
                                                                                    closeVisibilityPopover();
                                                                                }}
                                                                            >
                                                                                Cancel
                                                                            </Button>
                                                                        </PopoverPrimitive.Close>
                                                                        <PopoverPrimitive.Close asChild>
                                                                            <Button
                                                                                type="button"
                                                                                size="sm"
                                                                                className="h-6 text-xs"
                                                                                onClick={closeVisibilityPopover}
                                                                            >
                                                                                Save
                                                                            </Button>
                                                                        </PopoverPrimitive.Close>
                                                                    </div>
                                                                </PopoverContent>
                                                            </Popover>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedSectionId(section.id);
                                                                    startAddingField(section.id);
                                                                }}
                                                            >
                                                                <Plus className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-muted-foreground hover:bg-primary/10 hover:backdrop-blur-sm hover:text-primary transition-all duration-200"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    duplicateSection(page.id, section.id);
                                                                }}
                                                                title="Duplicate Section"
                                                            >
                                                                <Copy className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                                                                onClick={() => deleteSection(page.id, section.id)}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardHeader>
                                                {expandedSections.has(section.id) && (
                                                    <CardContent
                                                        className={`space-y-2 ${dragOverSectionId === section.id
                                                            ? 'bg-primary/5 border-2 border-primary border-dashed rounded'
                                                            : ''
                                                            }`}
                                                        onDragOver={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            if (draggedFieldType || draggedFieldId) {
                                                                e.dataTransfer.dropEffect = 'move';
                                                                setDragOverSectionId(section.id);
                                                            }
                                                        }}
                                                        onDragLeave={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                                                setDragOverSectionId(null);
                                                            }
                                                        }}
                                                        onDrop={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setDragOverSectionId(null);

                                                            if (draggedFieldType && !draggedFieldId) {
                                                                setSelectedPageId(page.id);
                                                                startAddingField(section.id, draggedFieldType as FieldType);
                                                                setDraggedFieldType(null);
                                                                return;
                                                            }

                                                            if (draggedFieldId) {
                                                                handleDrop(e, null, page.id, section.id);
                                                            }
                                                        }}
                                                    >
                                                        {section.fields.map((field: Field, fieldIdx: number) => {
                                                            const isInheritedLockedField =
                                                                field.metadata?.inheritedLockedFromTemplate === true;
                                                            const isFieldLockedInProposalMode =
                                                                !isCustomerTemplateMode && isFieldLocked(field);
                                                            const isLockedExistingCustomerTemplateField =
                                                                isExistingCustomerTemplateEdit && isFieldLocked(field);
                                                            const canMutateField =
                                                                !isFieldLockedInProposalMode &&
                                                                !isInheritedLockedField &&
                                                                !isLockedExistingCustomerTemplateField;

                                                            return (
                                                            <div
                                                                key={field.id ?? `field-${fieldIdx}`}
                                                                draggable={canMutateField}
                                                                onDragStart={(e) => {
                                                                    if (!canMutateField) return;
                                                                    handleDragStart(field.id, page.id, section.id);
                                                                    e.dataTransfer.effectAllowed = 'move';
                                                                    e.dataTransfer.setData('fieldId', field.id);
                                                                }}
                                                                onDragOver={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    if (canMutateField && draggedFieldId) {
                                                                        handleDragOver(e);
                                                                    }
                                                                }}
                                                                onDragLeave={(e) => {
                                                                    if (canMutateField && draggedFieldId) {
                                                                        handleDragLeave(e);
                                                                    }
                                                                }}
                                                                onDrop={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    if (canMutateField && draggedFieldId) {
                                                                        handleDrop(e, field.id, page.id, section.id);
                                                                    }
                                                                }}
                                                                onDragEnd={() => {
                                                                    if (canMutateField) {
                                                                        handleDragEnd();
                                                                    }
                                                                }}
                                                                className={`flex items-center gap-2 p-2 rounded border bg-background transition-colors ${
                                                                    canMutateField ? 'cursor-move hover:bg-muted/50' : 'cursor-not-allowed opacity-75'
                                                                    } ${draggedFieldId === field.id ? 'opacity-50' : 'opacity-100'
                                                                    }`}
                                                            >
                                                                <GripVertical className={`w-4 h-4 text-muted-foreground ${canMutateField ? 'cursor-grab active:cursor-grabbing' : ''}`} />
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-sm font-medium">{field.label}</span>
                                                                        <Badge variant="outline" className="text-xs">
                                                                            {field.type}
                                                                        </Badge>
                                                                        {field.isRatingParameter && !hideRatingBadges && (
                                                                            <Badge variant="default" className="text-xs">
                                                                                Rating
                                                                            </Badge>
                                                                        )}
                                                                        {field.isMasterData && (
                                                                            <Badge variant="secondary" className="text-xs">
                                                                                Master Data
                                                                            </Badge>
                                                                        )}
                                                                        {isFieldLocked(field) && (
                                                                            <Badge variant="secondary" className="text-xs">
                                                                                Locked
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                {(field.type === 'number' || field.type === 'dropdown') && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className={`h-8 w-8 ${field.metadata?.calculation
                                                                            ? 'text-primary'
                                                                            : 'text-muted-foreground'
                                                                            }`}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            if (!canMutateField) return;
                                                                            const calculation =
                                                                                field.metadata?.calculation as
                                                                                    | CalculationConfig
                                                                                    | undefined;
                                                                            setCurrentCalculationFieldId(
                                                                                (field.id as string) || field.name || '',
                                                                            );
                                                                            setCurrentCalculationSectionId(section.id || '');
                                                                            setCurrentCalculationPageId(page.id || '');
                                                                            setTempCalculationConfig({
                                                                                ...(calculation || {
                                                                                    type: field.type === 'dropdown' ? 'dropdownConditional' : field.type === 'date' ? 'date' : 'arithmetic',
                                                                                    ...(field.type === 'dropdown'
                                                                                        ? {
                                                                                            rules: [
                                                                                                {
                                                                                                    id: crypto.randomUUID(),
                                                                                                    conditionMode: 'and',
                                                                                                    conditions: [
                                                                                                        {
                                                                                                            id: crypto.randomUUID(),
                                                                                                            field: '',
                                                                                                            operator: 'equals',
                                                                                                            numberMode: 'comparison',
                                                                                                            value: '',
                                                                                                            selectedValues: [],
                                                                                                            selectionMode: 'single',
                                                                                                            defaultValue: undefined,
                                                                                                        },
                                                                                                    ],
                                                                                                    result: {
                                                                                                        selectionMode: 'single',
                                                                                                        selectedValues: [],
                                                                                                        defaultValue: undefined,
                                                                                                    },
                                                                                                },
                                                                                            ],
                                                                                        }
                                                                                        : field.type === 'date'
                                                                                            ? {
                                                                                                comparisonMode: 'currentDate',
                                                                                                comparisonField: '',
                                                                                                customDate: '',
                                                                                                unit: 'days',
                                                                                            }
                                                                                            : {}),
                                                                                }),
                                                                                initialField:
                                                                                    (field.metadata?.calculation as any)?.initialField || '',
                                                                                operations:
                                                                                    (field.metadata?.calculation as any)?.operations || [],
                                                                            });
                                                                            setIsCalculationDialogOpen(true);
                                                                        }}
                                                                        disabled={!canMutateField}
                                                                    >
                                                                        <Calculator className="w-4 h-4" />
                                                                    </Button>
                                                                )}
                                                                {field.type === 'date' && (
                                                                    <span
                                                                        className={`inline-flex h-8 w-8 items-center justify-center ${
                                                                            field.metadata?.calculation
                                                                                ? 'text-primary'
                                                                                : 'text-muted-foreground'
                                                                        }`}
                                                                        title="Date calculation indicator"
                                                                    >
                                                                        <CalendarDays className="w-4 h-4" />
                                                                    </span>
                                                                )}
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-muted-foreground hover:bg-primary/10 hover:backdrop-blur-sm hover:text-primary transition-all duration-200"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (canMutateField && field.id) {
                                                                            duplicateField(page.id, section.id, field.id);
                                                                        }
                                                                    }}
                                                                    title="Duplicate Field"
                                                                    disabled={!canMutateField}
                                                                >
                                                                    <Copy className="w-4 h-4" />
                                                                </Button>
                                                                {isCustomerTemplateMode && field.id && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            if (isInheritedLockedField) return;
                                                                            toggleFieldLock(page.id, section.id, field.id!);
                                                                        }}
                                                                        title={isFieldLocked(field) ? 'Unlock Field' : 'Lock Field'}
                                                                        disabled={
                                                                            isInheritedLockedField ||
                                                                            isLockedExistingCustomerTemplateField
                                                                        }
                                                                    >
                                                                        {isFieldLocked(field) ? (
                                                                            <LockKeyholeIcon className="w-4 h-4" />
                                                                        ) : (
                                                                            <LockKeyholeOpenIcon className="w-4 h-4" />
                                                                        )}
                                                                    </Button>
                                                                )}
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 hover:bg-primary/10 hover:backdrop-blur-sm hover:text-primary transition-all duration-200"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (canMutateField) {
                                                                            startEditingField(page.id, section.id, field);
                                                                        }
                                                                    }}
                                                                    title="Edit Field"
                                                                    disabled={!canMutateField}
                                                                >
                                                                    <Edit className="w-4 h-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (canMutateField) {
                                                                            deleteField(page.id, section.id, field.id!);
                                                                        }
                                                                    }}
                                                                    disabled={!canMutateField}
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                            );
                                                        })}
                                                        {section.fields.length === 0 && (
                                                            <p className="text-sm text-muted-foreground text-center py-4">
                                                                No fields yet. Click + to add a field.
                                                            </p>
                                                        )}
                                                    </CardContent>
                                                )}
                                            </Card>
                                        );
                                        })}
                                    {isFormLikePage(page.pageType) &&
                                        (!page.sections || page.sections.length === 0) && (
                                            <Button
                                                variant="outline"
                                                className="w-full"
                                                onClick={() => addSection(page.id)}
                                            >
                                                <Plus className="w-4 h-4 mr-2" />
                                                Add Section
                                            </Button>
                                        )}
                                    {!isFormLikePage(page.pageType) && (
                                        <div className="p-4 border rounded-lg bg-muted/30 text-center">
                                            <p className="text-sm text-muted-foreground">
                                                {page.pageType === 'payment' &&
                                                    `Payment Page - Static Design (Payment URL: ${page.paymentUrl || 'Not configured'
                                                    })`}
                                                {page.pageType === 'quotesList' &&
                                                    `Quotes List Page - Static Design (Quotes URL: ${page.quotesUrl || 'Not configured'
                                                    })`}
                                                {page.pageType === 'policyDetails' &&
                                                    'Policy Details Page - Static Design'}
                                                {page.pageType === 'underwritingDocuments' &&
                                                    'Underwriting Documents Page - Static Design (Data from insurer product config and master management)'}
                                                {page.pageType === 'requiredDocuments' &&
                                                    'Required Documents Page - Static Design (Data from insurer product config and master management)'}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            )}
                        </Card>
                    )})}
                </div>
            </div>
        </div>
    );
};
