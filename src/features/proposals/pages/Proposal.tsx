import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '@/shared/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DynamicProposalForm } from '../components/DynamicProposalForm';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { type ProposalFormEditResponse, getProposalFormForEdit } from '@/features/quotes/api/edit-quote';
import { submitProposalForm } from '@/features/product-config/proposal-form/api/saveProposalForm';

const Proposal = () => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const formResponseId = params.get('resume');
  const productName = params.get('productName');
  const productIdFromUrl = params.get('productId');
  const { toast } = useToast();
  const [showDiscontinueDialog, setShowDiscontinueDialog] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [quoteReference] = useState<string>(() => localStorage.getItem('quoteReference') || '');
  const [stepCompletionStatus, setStepCompletionStatus] = useState<Record<string, boolean>>({});

  // call dynamic pages

  type LocalQueryOptions = UseQueryOptions<
    ProposalFormEditResponse,
    Error,
    ProposalFormEditResponse,
    ['proposalForm', string]
  >;

  const queryOptions: LocalQueryOptions = {
    queryKey: ['proposalForm', formResponseId ?? ''],
    queryFn: () => getProposalFormForEdit(formResponseId || ''),
    staleTime: 1000 * 60 * 2,
    enabled: Boolean(formResponseId),
  };

  const {
    data: quotesDataRes,
    isLoading: isLoadingQuotes,
  } = useQuery(queryOptions);

  // Handle discontinuing quote creation/editing
  const handleDiscontinueQuote = () => {
    // Clear all stored quote data
    localStorage.removeItem('projectDataExists');
    localStorage.removeItem('currentQuoteId');
    localStorage.removeItem('quoteReference');
    localStorage.removeItem('stepCompletionFlags');

    // Close dialog
    setShowDiscontinueDialog(false);

    // Navigate to dashboard
    navigate(-1);

    const isEditMode = Boolean(formResponseId);
    toast({
      title: isEditMode ? 'Quote Edit Discontinued' : 'Quote Creation Discontinued',
      description: `Quote ${quoteReference} editing has been discontinued.`,
    });
  };

  // Handle back to dashboard click
  const handleBackToDashboard = () => {
    if (currentStep === 0) {
      // On project details page, navigate directly
      navigate('/broker/dashboard');
    } else {
      // On other pages, show confirmation dialog
      setShowDiscontinueDialog(true);
    }
  };

  // Handle step completion status changes (kept for the discontinue dialog UI)
  const handleStepCompletionChange = (completionStatus: Record<string, boolean>) => {
    setStepCompletionStatus(completionStatus);
  };

  // Handle final form submission
  const handleFormSubmit = async (responseId: string) => {
    try {
      const response = await submitProposalForm({ responseId });
      if (response.responseId) {
        toast({
          title: 'Proposal Submitted',
          description: 'Your proposal has been submitted successfully. You will be redirected to quotes.',
        });
      }
      localStorage.removeItem('projectDataExists');
      localStorage.removeItem('currentQuoteId');
      localStorage.removeItem('quoteReference');
      localStorage.removeItem('stepCompletionFlags');
      setTimeout(() => {
        navigate('/broker/dashboard', {
          state: { successMessage: 'Proposal submitted successfully', responseId },
        });
      }, 1000);
    } catch (error: unknown) {
      interface ApiError { response?: { data?: { message?: string } }; message?: string; }
      const apiError = error as ApiError;
      toast({
        title: 'Submission Failed',
        description: apiError?.response?.data?.message || apiError?.message || 'Failed to submit proposal. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Resolve the best product name available from URL param or API response
  const resolvedProductName =
    productName || quotesDataRes?.template?.name || (isLoadingQuotes ? 'Loading...' : undefined);
  const headerTitle = resolvedProductName;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        onBackToDashboard={handleBackToDashboard}
        showBackConfirmation={currentStep > 0}
        title={headerTitle}
      />
      <main className="flex-1 py-8">
        {isLoadingQuotes ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          </div>
        ) : (
          <DynamicProposalForm
            // Edit / resume mode: pass the full API response.
            // Create mode: don't pass editData — use the individual props instead.
            editData={quotesDataRes ?? null}
            // Fallback props for create mode (productId / productName from URL).
            // resolvedProductName ensures the card title shows correctly in both modes.
            productId={productIdFromUrl ?? undefined}
            productName={resolvedProductName}
            requiredDocuments={[]}
            onFormSubmit={(responseId) => handleFormSubmit(responseId)}
            onStepChange={setCurrentStep}
            onStepCompletionChange={handleStepCompletionChange}
          />
        )}
      </main>
      <Footer />

      {/* Discontinue Quote Confirmation Dialog */}
      <Dialog open={showDiscontinueDialog} onOpenChange={setShowDiscontinueDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              {formResponseId ? 'Discontinue Quote Edit?' : 'Discontinue Quote Creation?'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to discontinue {formResponseId ? 'editing' : 'creating'} this quote?
              <br />
              All unsaved changes will be lost.
            </p>

            {quoteReference && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">
                  Quote Reference: <span className="text-primary">{quoteReference}</span>
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowDiscontinueDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDiscontinueQuote}
              >
                {formResponseId ? 'Discontinue Edit' : 'Discontinue Quote'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Proposal;
