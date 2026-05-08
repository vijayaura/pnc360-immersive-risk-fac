import React from 'react';
import { Plus, Calculator, LayoutTemplate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Page } from '@/features/product-config/proposal-form/api/proposalFormDesign';
import type { NewPageConfig } from '../types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ComponentsSidebarProps {
  selectedPage: Page | null;
  selectedPageId: string;
  selectedSectionId: string | null;
  addPage: () => void;
  addSection: (pageId: string) => void;
  fieldTypes: any[];
  setDraggedFieldType: (type: string | null) => void;
  setDragOverSectionId: (id: string | null) => void;
  toast: any;
  startAddingField: (sectionId: string, initialType?: string) => void;
  isAddPageDialogOpen: boolean;
  setIsAddPageDialogOpen: (open: boolean) => void;
  newPageConfig: NewPageConfig;
  setNewPageConfig: (config: NewPageConfig) => void;
  handleCreatePage: () => void;
  allowMultiplePages?: boolean;
  isGeneralTemplateMode?: boolean;
  showTemplatesButton?: boolean;
  onOpenTemplatesDialog?: () => void;
}

export const ComponentsSidebar: React.FC<ComponentsSidebarProps> = ({
  selectedPage,
  selectedPageId,
  selectedSectionId,
  addPage,
  addSection,
  fieldTypes,
  setDraggedFieldType,
  setDragOverSectionId,
  toast,
  startAddingField,
  isAddPageDialogOpen,
  setIsAddPageDialogOpen,
  newPageConfig,
  setNewPageConfig,
  handleCreatePage,
  allowMultiplePages = true,
  isGeneralTemplateMode = false,
  showTemplatesButton = false,
  onOpenTemplatesDialog,
}) => {
  const isFormLikePage =
    selectedPage?.pageType === 'form' ||
    selectedPage?.pageType === 'general' ||
    selectedPage?.pageType === 'quotesList';

  const resolveTargetSectionId = (): string | null =>
    selectedSectionId ?? selectedPage?.sections?.[0]?.id ?? null;

  const beginAddFieldFromSidebar = (fieldType: string) => {
    const sectionId = resolveTargetSectionId();
    if (!sectionId) {
      toast({
        title: 'Select Section',
        description: 'Add a section to this page before adding fields.',
        variant: 'destructive',
      });
      return;
    }
    startAddingField(sectionId, fieldType);
  };

  const sidebarInsertSection = React.useMemo(() => {
    const sections = selectedPage?.sections ?? [];
    if (!sections.length) return null;
    const match = selectedSectionId ? sections.find((s) => s.id === selectedSectionId) : undefined;
    return match ?? sections[0] ?? null;
  }, [selectedPage?.sections, selectedSectionId]);

  const sidebarInsertSectionLabel =
    sidebarInsertSection?.title?.trim() || (sidebarInsertSection ? 'Untitled section' : '');

  return (
    <div className="proposal-form-panel-scroll w-64 min-h-0 flex-shrink-0 overflow-y-auto border-r bg-background">
      <div className="p-4">
        <div className="mb-4">
          <h3 className="font-semibold text-foreground">Components</h3>
        </div>
        <div className="space-y-2">
          {allowMultiplePages && (
            <Button
              variant="outline"
              className="w-full justify-start gap-2 bg-primary/5 hover:bg-primary/10 border-primary/20 text-foreground hover:text-foreground"
              onClick={addPage}
            >
              <Plus className="w-4 h-4" />
              Add Page
            </Button>
          )}
          {selectedPage && isFormLikePage && (
            <Button
              variant="outline"
              className="w-full justify-start gap-2 bg-primary/5 hover:bg-primary/10 border-primary/20 text-foreground hover:text-foreground"
              onClick={() => {
                addSection(selectedPageId);
              }}
            >
              <Plus className="w-4 h-4" />
              Add Section
            </Button>
          )}
          {showTemplatesButton && onOpenTemplatesDialog && (
            <Button
              variant="outline"
              className="w-full justify-start gap-2 bg-primary/5 hover:bg-primary/10 border-primary/20 text-foreground hover:text-foreground"
              onClick={onOpenTemplatesDialog}
            >
              <LayoutTemplate className="w-4 h-4" />
              Templates
            </Button>
          )}
        </div>

        <Separator className="my-4" />

        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-xs font-semibold mb-1">Free Input Fields</h4>
            <p className="text-[10px] text-muted-foreground mb-1">Drag and drop into sections</p>
            {(() => {
              const freeDataFields = fieldTypes.filter((ft) =>
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
              );
              const availableFields = selectedPage?.pageType === 'quotesList' ? [] : freeDataFields;

              return availableFields.map((ft) => (
                <Button
                  key={ft.value}
                  variant="outline"
                  className="mb-2 flex h-auto w-full min-w-0 justify-between gap-2 py-1.5 text-xs cursor-grab border-primary/20 bg-primary/5 text-foreground hover:bg-primary/10 hover:text-foreground active:cursor-grabbing"
                  draggable
                  onDragStart={(e) => {
                    setDraggedFieldType(ft.value);
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('fieldType', ft.value);
                  }}
                  onDragEnd={() => {
                    setDraggedFieldType(null);
                    setDragOverSectionId(null);
                  }}
                  onClick={() => beginAddFieldFromSidebar(ft.value)}
                >
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="flex shrink-0 items-center">{ft.icon}</span>
                    <span className="min-w-0 truncate text-left" title={String(ft.label)}>
                      {ft.label}
                    </span>
                  </span>
                  {ft.canBeRating && (
                    <Calculator
                      className="h-3 w-3 shrink-0 text-primary"
                      aria-label="Can be used as rating parameter"
                      role="img"
                    />
                  )}
                </Button>
              ));
            })()}
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="text-xs font-semibold mb-1">Master Data Fields</h4>
            <p className="text-[10px] text-muted-foreground mb-1">Drag and drop into sections</p>
            {(() => {
              const masterDataFields = fieldTypes.filter((ft) =>
                [
                  'dropdown',
                  'checkbox',
                  'multiselect',
                  'multiselectDropdown',
                  'combination',
                ].includes(ft.value),
              );
              const availableFields =
                selectedPage?.pageType === 'quotesList' ? [] : masterDataFields;

              return availableFields.map((ft) => (
                <Button
                  key={ft.value}
                  variant="outline"
                  className="mb-2 flex h-auto w-full min-w-0 justify-between gap-2 py-1.5 text-xs cursor-grab border-primary/20 bg-primary/5 text-foreground hover:bg-primary/10 hover:text-foreground active:cursor-grabbing"
                  draggable
                  onDragStart={(e) => {
                    setDraggedFieldType(ft.value);
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('fieldType', ft.value);
                  }}
                  onDragEnd={() => {
                    setDraggedFieldType(null);
                    setDragOverSectionId(null);
                  }}
                  onClick={() => beginAddFieldFromSidebar(ft.value)}
                >
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="flex shrink-0 items-center">{ft.icon}</span>
                    <span className="min-w-0 truncate text-left" title={String(ft.label)}>
                      {ft.label}
                    </span>
                  </span>
                  {ft.canBeRating && (
                    <Calculator
                      className="h-3 w-3 shrink-0 text-primary"
                      aria-label="Can be used as rating parameter"
                      role="img"
                    />
                  )}
                </Button>
              ));
            })()}
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="text-xs font-semibold mb-1">Buttons</h4>
            <p className="text-[10px] text-muted-foreground mb-1">Drag and drop into sections</p>
            {(() => {
              const buttonFields = fieldTypes.filter((ft) =>
                ['chooseButton', 'file'].includes(ft.value),
              );
              const availableFields =
                selectedPage?.pageType === 'quotesList'
                  ? buttonFields.filter((ft) => ['chooseButton'].includes(ft.value))
                  : buttonFields;

              return availableFields.map((ft) => (
                <Button
                  key={ft.value}
                  variant="outline"
                  className="mb-2 flex h-auto w-full min-w-0 justify-between gap-2 py-1.5 text-xs cursor-grab border-primary/20 bg-primary/5 text-foreground hover:bg-primary/10 hover:text-foreground active:cursor-grabbing"
                  draggable
                  onDragStart={(e) => {
                    setDraggedFieldType(ft.value);
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('fieldType', ft.value);
                  }}
                  onDragEnd={() => {
                    setDraggedFieldType(null);
                    setDragOverSectionId(null);
                  }}
                  onClick={() => beginAddFieldFromSidebar(ft.value)}
                >
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="flex shrink-0 items-center">{ft.icon}</span>
                    <span className="min-w-0 truncate text-left" title={String(ft.label)}>
                      {ft.label}
                    </span>
                  </span>
                  {ft.canBeRating && (
                    <Calculator
                      className="h-3 w-3 shrink-0 text-primary"
                      aria-label="Can be used as rating parameter"
                      role="img"
                    />
                  )}
                </Button>
              ));
            })()}
          </div>
        </div>
      </div>
      {allowMultiplePages && (
        <Dialog open={isAddPageDialogOpen} onOpenChange={setIsAddPageDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Page</DialogTitle>
              <DialogDescription>
                Select the type of page you want to add to the proposal form
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Page Title *</Label>
                <Input
                  value={newPageConfig.title}
                  onChange={(e) => setNewPageConfig({ ...newPageConfig, title: e.target.value })}
                  placeholder="e.g., Company Information"
                />
              </div>
              <div className="space-y-2">
                <Label>Page Type *</Label>
                <Select
                  value={newPageConfig.pageType}
                  onValueChange={(value) =>
                    setNewPageConfig({
                      ...newPageConfig,
                      pageType: value as any,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {isGeneralTemplateMode ? (
                      <SelectItem value="general">
                        General Template Page (with sections and fields)
                      </SelectItem>
                    ) : (
                      <>
                        <SelectItem value="form">
                          Form Page (Default - with sections and fields)
                        </SelectItem>
                        <SelectItem value="underwritingDocuments">
                          Underwriting Documents Page (Static design)
                        </SelectItem>
                        <SelectItem value="quotesList">Quotes List Page (Static design)</SelectItem>
                        <SelectItem value="payment">
                          Payment Page (Static design - requires payment URL)
                        </SelectItem>
                        <SelectItem value="requiredDocuments">
                          Required Documents / KYC Documents Page (Static design)
                        </SelectItem>
                        <SelectItem value="policyDetails">
                          Policy Details Page (Static design)
                        </SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {newPageConfig.pageType === 'general' &&
                    'General template page where you can add sections and fields'}
                  {newPageConfig.pageType === 'form' &&
                    'Regular form page where you can add sections and fields'}
                  {newPageConfig.pageType === 'payment' &&
                    'Payment page with redirect URL. Static design will be implemented.'}
                  {newPageConfig.pageType === 'quotesList' &&
                    'Quotes list page. Static design will be implemented.'}
                  {newPageConfig.pageType === 'policyDetails' &&
                    'Policy details page. Static design will be implemented.'}
                  {newPageConfig.pageType === 'underwritingDocuments' &&
                    "Underwriting Documents page. Static design matching CAR's design. Data will be shown from insurer product config and master management."}
                  {newPageConfig.pageType === 'requiredDocuments' &&
                    "Required Documents page. Static design matching CAR's design. Data will be shown from insurer product config and master management."}
                </p>
              </div>
              {newPageConfig.pageType === 'payment' && (
                <div className="space-y-2">
                  <Label>Payment Redirection URL *</Label>
                  <Input
                    type="url"
                    value={newPageConfig.paymentUrl}
                    onChange={(e) =>
                      setNewPageConfig({
                        ...newPageConfig,
                        paymentUrl: e.target.value,
                      })
                    }
                    placeholder="https://payment.example.com/checkout"
                  />
                  <p className="text-xs text-muted-foreground">
                    URL where users will be redirected for payment processing
                  </p>
                </div>
              )}
              {newPageConfig.pageType === 'quotesList' && (
                <div className="space-y-2">
                  <Label>Quotes API URL *</Label>
                  <Input
                    type="url"
                    value={newPageConfig.quotesUrl}
                    onChange={(e) =>
                      setNewPageConfig({
                        ...newPageConfig,
                        quotesUrl: e.target.value,
                      })
                    }
                    placeholder="https://api.example.com/quotes"
                  />
                  <p className="text-xs text-muted-foreground">
                    API endpoint to fetch quotes list. This URL will be called to retrieve quotes
                    data.
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddPageDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePage}>Create Page</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
