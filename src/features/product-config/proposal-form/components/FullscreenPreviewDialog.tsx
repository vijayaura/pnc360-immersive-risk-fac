import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Minimize2, Download, FileText, FileCheck } from 'lucide-react';
import type { Page } from '@/features/product-config/proposal-form/api/proposalFormDesign';
import { isMetadataActive } from '@/features/product-config/proposal-form/api/proposalFormDesign';
import { renderFieldPreview } from '../utils/render-utils';
import { useDynamicFormState } from '@/features/proposals/hooks/useDynamicFormState';
import { useFormValidation } from '@/features/proposals/hooks/useFormValidation';
import { FieldRenderer } from '@/features/proposals/components/FieldRenderer';
import { isSectionVisibilitySatisfied } from '@/features/proposals/utils/sectionVisibility';

export interface FullscreenPreviewDialogProps {
  productName: string;
  productVersion: string;
  pages: Page[];
  isFullscreenPreview: boolean;
  setIsFullscreenPreview: (open: boolean) => void;
  currentPreviewPage: string;
  setCurrentPreviewPage: (id: string) => void;
  getNextPage: (id: string) => string | null;
}

interface PreviewFormBodyProps {
  pages: Page[];
  currentPreviewPage: string;
  setCurrentPreviewPage: (id: string) => void;
  getNextPage: (id: string) => string | null;
}

const PreviewFormBody: React.FC<PreviewFormBodyProps> = ({
  pages,
  currentPreviewPage,
  setCurrentPreviewPage,
  getNextPage,
}) => {
  const handleGoToNextPage = () => {
    const nextId = getNextPage(currentPreviewPage);
    if (nextId) {
      setCurrentPreviewPage(nextId);
    }
  };

  const { formData, handleFieldChange, isInitialized } = useDynamicFormState({ pages });
  const { shouldShowField, isFieldRequired } = useFormValidation(formData, pages);

  const isPageEffectivelyActive = React.useCallback((page: Page) => {
    const sections = page.sections || [];
    const allSectionsInactive =
      sections.length > 1 &&
      sections.every((section) => section.metadata?.active === false);

    return !allSectionsInactive && isMetadataActive(page);
  }, []);

  const shouldShowSection = React.useCallback(
    (section: NonNullable<Page['sections']>[number], sectionCount: number) => {
      if (sectionCount > 1 && !isMetadataActive(section)) return false;
      if (!section.fields?.length) return false;

      const visibility = section.metadata?.visibility;
      if (visibility) {
        const allFields = pages.flatMap((page) =>
          (page.sections || []).flatMap((currentSection) => currentSection.fields || []),
        );
        const depField = allFields.find(
          (candidate) =>
            candidate.name === visibility.field || candidate.id === visibility.field,
        );
        const rawDepValue = depField
          ? formData[depField.name] ?? (depField.id ? formData[depField.id] : undefined)
          : formData[visibility.field];

        if (!isSectionVisibilitySatisfied(visibility, depField, rawDepValue)) {
          return false;
        }
      }

      return section.fields.some((field) => shouldShowField(field));
    },
    [formData, pages, shouldShowField],
  );

  return (
    <div className="flex-1 overflow-y-auto space-y-6">
      {/* Horizontal Page Navigation */}
      <div className="mb-4 border-b overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {pages.map((page, pageIdx) => (
            <button
              key={page.id ?? `page-tab-${pageIdx}`}
              onClick={() => setCurrentPreviewPage(page.id as string)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${currentPreviewPage === page.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                }`}
            >
              {page.title}
            </button>
          ))}
        </div>
      </div>

      {/* Current Page Preview */}
      <div className="space-y-6">
        {pages
          .filter((page) => isPageEffectivelyActive(page) && page.id === currentPreviewPage)
          .map((page, pageIdx) => (
            <Card key={page.id ?? `page-card-${pageIdx}`}>
              <CardHeader>
                <CardTitle>{page.title}</CardTitle>
                {page.subtitle && <CardDescription>{page.subtitle}</CardDescription>}
              </CardHeader>
              <CardContent className="space-y-6">
                {(page.pageType === 'form' || page.pageType === 'general' || page.pageType === 'quotesList') &&
                  page.sections &&
                  page.sections.length > 0 ? (
                  page.sections
                    .filter((section) => shouldShowSection(section, page.sections?.length ?? 0))
                    .map((section, sectionIdx) => (
                      <div key={section.id ?? `section-${sectionIdx}`} className="space-y-4">
                        {section.title && (
                          <div>
                            <h4 className="font-semibold">{section.title}</h4>
                            {section.subtitle && (
                              <p className="text-sm text-muted-foreground">
                                {section.subtitle}
                              </p>
                            )}
                          </div>
                        )}
                        <div className="grid grid-cols-1 gap-x-4 gap-y-2 md:grid-cols-2 md:gap-x-6 md:gap-y-3">
                          {section.fields.map((field, fieldIdx) => {
                            if (!shouldShowField(field)) return null;

                            const fieldWrapperClassName =
                              field.metadata?.fullWidth === true
                                ? 'md:col-span-2'
                                : field.metadata?.fullWidth === false
                                  ? ''
                                  : [
                                        'repeatable',
                                        'combination',
                                        'multiselect',
                                        'datePeriod',
                                        'policyPeriod',
                                      ].includes(field.type)
                                    ? 'md:col-span-2'
                                    : '';

                            const isNavigationField = [
                              'nextButton',
                              'backButton',
                              'submitButton',
                              'button',
                            ].includes(field.type);

                            return (
                              <div
                                key={field.id ?? `field-${fieldIdx}`}
                                className={fieldWrapperClassName}
                              >
                                {isNavigationField ? (
                                  renderFieldPreview(field, {
                                    pages,
                                    currentPreviewPage,
                                    setCurrentPreviewPage,
                                    getNextPage,
                                  })
                                ) : (
                                  <FieldRenderer
                                    field={field}
                                    value={formData[field.name]}
                                    error={undefined}
                                    errors={{}}
                                    formData={formData}
                                    onChange={handleFieldChange}
                                    shouldShowField={shouldShowField}
                                    isFieldRequired={isFieldRequired}
                                    onOpenMap={() => {}}
                                    pages={pages}
                                    disabled={!isInitialized}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                ) : page.pageType === 'payment' ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Users will be redirected to the payment URL configured for this page.
                    </p>
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">
                        Payment Redirection URL
                      </Label>
                      <div className="p-3 border rounded-lg bg-background text-sm">
                        {page.paymentUrl || 'https://payment.example.com/checkout'}
                      </div>
                    </div>
                    <Button className="w-full" onClick={handleGoToNextPage}>
                      Proceed to Payment
                    </Button>
                  </div>
                ) : page.pageType === 'policyDetails' ? (
                  <p className="text-sm text-muted-foreground">
                    Policy details will be shown here in the final application.
                  </p>
                ) : page.pageType === 'underwritingDocuments' ? (
                  <div className="space-y-4">
                    <h4 className="font-semibold">Underwriting Documents</h4>
                    <p className="text-sm text-muted-foreground">
                      Static list of underwriting documents as configured for the product.
                    </p>
                    <div className="space-y-2">
                      {[
                        'Company Registration Certificate',
                        'Trade License',
                        'Project Details Document',
                        'Financial Statements',
                      ].map((label) => (
                        <div
                          key={label}
                          className="flex items-center justify-between p-3 border rounded-lg bg-background"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">
                              {label}
                            </span>
                          </div>
                          <Button variant="outline" size="sm" className="gap-2">
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : page.pageType === 'requiredDocuments' ? (
                  <div className="space-y-4">
                    <h4 className="font-semibold">Required Documents</h4>
                    <p className="text-sm text-muted-foreground">
                      Static list of required / KYC documents as configured for the product.
                    </p>
                    <div className="space-y-2">
                      {[
                        'Identity Proof',
                        'Address Proof',
                        'Bank Statement',
                        'Medical Certificate',
                      ].map((label) => (
                        <div
                          key={label}
                          className="flex items-center justify-between p-3 border rounded-lg bg-background"
                        >
                          <div className="flex items-center gap-3">
                            <FileCheck className="h-5 w-5 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">
                              {label}
                            </span>
                          </div>
                          <Button variant="outline" size="sm" className="gap-2">
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No sections yet. Click + to add a section.
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
};

export const FullscreenPreviewDialog: React.FC<FullscreenPreviewDialogProps> = ({
  productName,
  productVersion,
  pages,
  isFullscreenPreview,
  setIsFullscreenPreview,
  currentPreviewPage,
  setCurrentPreviewPage,
  getNextPage,
}) => {
  const [previewStateVersion, setPreviewStateVersion] = React.useState(0);

  React.useEffect(() => {
    if (!isFullscreenPreview) return;
    setPreviewStateVersion((current) => current + 1);
  }, [isFullscreenPreview, pages]);

  return (
    <Dialog open={isFullscreenPreview} onOpenChange={setIsFullscreenPreview}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex items-center">
            <DialogTitle>Form Preview</DialogTitle>
            <DialogDescription>
              {productName}
              {productVersion ? ` - Version ${productVersion}` : ''}
            </DialogDescription>
        </DialogHeader>
        {isFullscreenPreview ? (
          <PreviewFormBody
            key={previewStateVersion}
            pages={pages}
            currentPreviewPage={currentPreviewPage}
            setCurrentPreviewPage={setCurrentPreviewPage}
            getNextPage={getNextPage}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
