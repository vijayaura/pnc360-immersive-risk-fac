import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PIProposalForm } from "@/features/proposals/components/PIProposalForm";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from '@/shared/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const PIProposal = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showDiscontinueDialog, setShowDiscontinueDialog] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [quoteReference, setQuoteReference] = useState<string>(() => {
    const saved = localStorage.getItem('piQuoteReference');
    return saved || '';
  });
  const [stepCompletionStatus, setStepCompletionStatus] = useState<Record<string, boolean>>({
    business_information: false,
    risk_profile: false,
    coverage_details: false,
    claims_history: false,
    generate_quote: false
  });

  // Handle discontinuing quote creation
  const handleDiscontinueQuote = () => {
    // Clear all stored quote data
    localStorage.removeItem('piProjectDataExists');
    localStorage.removeItem('piCurrentQuoteId');
    localStorage.removeItem('piQuoteReference');
    localStorage.removeItem('piStepCompletionFlags');

    // Close dialog
    setShowDiscontinueDialog(false);

    // Navigate to dashboard
    navigate('/broker/dashboard');

    toast({
      title: "Quote Creation Discontinued",
      description: `Professional Indemnity quote ${quoteReference} has been discontinued.`,
    });
  };

  // Handle back to dashboard click
  const handleBackToDashboard = () => {
    if (currentStep === 0) {
      // On first page, navigate directly
      navigate('/broker/dashboard');
    } else {
      // On other pages, show confirmation dialog
      setShowDiscontinueDialog(true);
    }
  };

  // Handle step completion status changes
  const handleStepCompletionChange = (completionStatus: Record<string, boolean>) => {
    console.log('📥 Received PI step completion status:', completionStatus);
    setStepCompletionStatus(completionStatus);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        title="Professional Indemnity Insurance Application"
        onBackToDashboard={handleBackToDashboard}
        showBackConfirmation={currentStep > 0}
      />
      <div className="flex-1">
        <PIProposalForm
          onStepChange={setCurrentStep}
          onQuoteReferenceChange={setQuoteReference}
          onStepCompletionChange={handleStepCompletionChange}
        />
      </div>
      <Footer />

      {/* Discontinue Quote Confirmation Dialog */}
      <Dialog open={showDiscontinueDialog} onOpenChange={setShowDiscontinueDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Discontinue PI Quote Creation?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to discontinue creating this Professional Indemnity quote? All unsaved changes will be lost.
            </p>

            {quoteReference && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">
                  Quote Reference: <span className="text-primary">{quoteReference}</span>
                </p>
              </div>
            )}

            {/* Show completed steps */}
            {Object.values(stepCompletionStatus).some(Boolean) && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="text-sm font-medium text-green-800 mb-3">Completed Steps:</h4>
                <div className="space-y-2">
                  {stepCompletionStatus.business_information && (
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span>Business Information</span>
                    </div>
                  )}
                  {stepCompletionStatus.risk_profile && (
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span>Risk Profile</span>
                    </div>
                  )}
                  {stepCompletionStatus.coverage_details && (
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span>Coverage Details</span>
                    </div>
                  )}
                  {stepCompletionStatus.claims_history && (
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span>Claims History</span>
                    </div>
                  )}
                  {stepCompletionStatus.generate_quote && (
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span>Generate Quote</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDiscontinueDialog(false)}
                className="hover:text-slate-700"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDiscontinueQuote}
              >
                Discontinue Quote
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PIProposal;
