import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel, SelectSeparator } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { FormattedNumberInput } from '@/components/ui/FormattedNumberInput';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { MultiFieldValidation } from '@/features/product-config/proposal-form/api/proposalFormDesign';
import { Plus, Trash2 } from 'lucide-react';

export interface PageValidationDialogProps {
  [key: string]: any;
}


export const PageValidationDialog = (props: PageValidationDialogProps) => {
  const {
    navigate,
    toast,
    productId,
    productName,
    productVersion,
    pages,
    setPages,
    isEditing,
    templateId,
    isInitialLoad,
    isLoading,
    isSaving,
    isSavingDraft,
    isPublishing,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    isPublished,
    setIsPublished,
    updatePages,
    handleSaveForm,
    transformPagesToPayload,
    selectedPageId,
    setSelectedPageId,
    editingSectionField,
    setEditingSectionField,
    selectedTemplate,
    setSelectedTemplate,
    selectedLibraryField,
    setSelectedLibraryField,
    isCalculationDialogOpen,
    setIsCalculationDialogOpen,
    currentCalculationSubFieldIndex,
    setCurrentCalculationSubFieldIndex,
    currentCalculationFieldId,
    setCurrentCalculationFieldId,
    currentCalculationSectionId,
    setCurrentCalculationSectionId,
    currentCalculationPageId,
    setCurrentCalculationPageId,
    tempCalculationConfig,
    setTempCalculationConfig,
    globalMasters,
    setGlobalMasters,
    isLoadingGlobalMasters,
    setIsLoadingGlobalMasters,
    draggedFieldId,
    draggedFieldPageId,
    draggedFieldSectionId,
    draggedPageId,
    draggedSectionId,
    setDraggedFieldId,
    setDraggedFieldPageId,
    setDraggedFieldSectionId,
    setDraggedPageId,
    setDraggedSectionId,
    draggedFieldType,
    setDraggedFieldType,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handlePageDragStart,
    handlePageDragOver,
    handlePageDragLeave,
    handlePageDrop,
    handleSectionDragStart,
    handleSectionDragOver,
    handleSectionDragLeave,
    handleSectionDrop,
    addPage,
    deletePage,
    updatePage,
    handlePageValidation,
    handleCancelPageValidation,
    handleApplyPageValidation,
    handleAddPageValidation,
    handleUpdatePageValidation,
    handleDeletePageValidation,
    getNumericFieldsForPage,
    getPageMultiFieldValidationIssues,
    isPageValidationApplyAttempted,
    isPageValidationDialogOpen,
    setIsPageValidationDialogOpen,
    selectedPageForValidation,
    selectedPageValidationRules,
    setSelectedPageValidationRules,
    validationRows,
    setValidationRows,
    expandedPages,
    setExpandedPages,
    togglePageExpansion,
    addSection,
    deleteSection,
    updateSection,
    duplicateSection,
    expandedSections,
    toggleSectionExpansion,
    deleteField,
    isFieldDialogOpen,
    setIsFieldDialogOpen,
    isConfiguringField,
    setIsConfiguringField,
    fieldConfig,
    setFieldConfig,
    subFieldsConfig,
    setSubFieldsConfig,
    selectedPage,
    setSelectedPage,
    selectedSection,
    setSelectedSection,
    selectedField,
    setSelectedField,
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
    isSubFieldDialogOpen,
    setIsSubFieldDialogOpen,
    isConfiguringSubField,
    setIsConfiguringSubField,
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
    isFullscreenPreview,
    setIsFullscreenPreview,
    shouldShowField,
    renderFieldPreview,
    fieldTypes,
    fieldsLibrary,
    FRONTEND_ID_REGEX
  } = props;

  return (
    <Dialog
      open={isPageValidationDialogOpen}
      onOpenChange={(open) => !open && handleCancelPageValidation()}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col gap-0 p-0" showClose={false}>
        <DialogHeader className="p-6">
          <DialogTitle>Page Validations - {selectedPageForValidation?.title}</DialogTitle>
          <DialogDescription>
            Add validations that involve multiple numeric fields. For example, sum of Field A +
            Field B should be less than 100.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 border-y">
          <div className="space-y-6">
            <Button onClick={handleAddPageValidation} className="w-full" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Multi-Field Validation
            </Button>

            {selectedPageForValidation?.validations?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                No multi-field validations added yet.
              </div>
            ) : (
              <div className="space-y-4">
                {(() => {
                  const numericFields = getNumericFieldsForPage(selectedPageForValidation);
                  const validationIssues =
                    getPageMultiFieldValidationIssues(selectedPageForValidation);
                  return selectedPageForValidation?.validations?.map((validation) => {
                    const issuesForThisValidation =
                      validationIssues.issuesById[validation.id] || [];
                    return (
                      <Card key={validation.id} className="p-4 bg-muted/20">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-4">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label className="text-sm font-semibold">
                                    Select Fields to Sum
                                  </Label>
                                  {numericFields.length > 0 && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2 text-xs"
                                      onClick={() => {
                                        const allNames = numericFields.map((f) => f.name);
                                        const isAllSelected = allNames.every((name) =>
                                          validation.fieldNames.includes(name),
                                        );
                                        handleUpdatePageValidation(validation.id, {
                                          fieldNames: isAllSelected ? [] : allNames,
                                        });
                                      }}
                                    >
                                      {numericFields.every((f) =>
                                        validation.fieldNames.includes(f.name),
                                      )
                                        ? 'Clear All'
                                        : 'Select All'}
                                    </Button>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-background min-h-[40px]">
                                  {numericFields.length === 0 ? (
                                    <p className="text-sm text-destructive font-medium p-1">
                                      No numeric fields present in this page.
                                    </p>
                                  ) : (
                                    numericFields.map((f) => {
                                      const isSelected = validation.fieldNames.includes(f.name);
                                      return (
                                        <Badge
                                          key={f.name}
                                          variant={isSelected ? 'default' : 'outline'}
                                          className="cursor-pointer hover:opacity-80 transition-opacity"
                                          onClick={() => {
                                            const newFieldNames = isSelected
                                              ? validation.fieldNames.filter(
                                                  (name) => name !== f.name,
                                                )
                                              : [...validation.fieldNames, f.name];
                                            handleUpdatePageValidation(validation.id, {
                                              fieldNames: newFieldNames,
                                            });
                                          }}
                                        >
                                          {f.label}
                                        </Badge>
                                      );
                                    })
                                  )}
                                </div>
                                <p className="text-[11px] text-muted-foreground">
                                  Click on the fields above to include them in the validation sum.
                                </p>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label className="text-sm font-semibold">Condition</Label>
                                  <Select
                                    value={validation.condition}
                                    onValueChange={(val: MultiFieldValidation['condition']) =>
                                      handleUpdatePageValidation(validation.id, {
                                        condition: val,
                                      })
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select condition" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="lessThan">Less Than (&lt;)</SelectItem>
                                      <SelectItem value="moreThan">More Than (&gt;)</SelectItem>
                                      <SelectItem value="lessThanOrEqual">
                                        Less Than or Equal (&le;)
                                      </SelectItem>
                                      <SelectItem value="moreThanOrEqual">
                                        More Than or Equal (&ge;)
                                      </SelectItem>
                                      <SelectItem value="equal">Equal (=)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm font-semibold">Value</Label>
                                  <FormattedNumberInput
                                    value={
                                      Number.isFinite(validation.value)
                                        ? validation.value
                                        : undefined
                                    }
                                    onChange={(value) => {
                                      handleUpdatePageValidation(validation.id, {
                                        value:
                                          value === undefined
                                            ? NaN
                                            : Math.max(0, value),
                                      });
                                    }}
                                    placeholder="Validation value"
                                    allowEmpty
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label className="text-sm font-semibold">Error Message</Label>
                                <Input
                                  value={validation.message}
                                  onChange={(e) =>
                                    handleUpdatePageValidation(validation.id, {
                                      message: e.target.value,
                                    })
                                  }
                                  placeholder="Message to show when validation fails"
                                />
                              </div>
                              {isPageValidationApplyAttempted &&
                                issuesForThisValidation.length > 0 && (
                                  <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
                                    <div className="space-y-1">
                                      {issuesForThisValidation.map((issue) => (
                                        <p key={issue} className="text-xs text-destructive">
                                          {issue}
                                        </p>
                                      ))}
                                    </div>
                                  </div>
                                )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive h-8 w-8"
                              onClick={() => handleDeletePageValidation(validation.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="p-6">
          <Button variant="outline" onClick={handleCancelPageValidation}>
            Cancel
          </Button>
          <Button onClick={handleApplyPageValidation}>Apply Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
