/**
 * DynamicProposal Page Wrapper
 * Wraps DynamicProposalForm with Header/Footer for consistent layout
 */

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { DynamicProposalForm } from '@/features/proposals/components/DynamicProposalForm';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '@/shared/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Page, RequireDocument } from '@/features/product-config/proposal-form/api/proposalFormDesign';

const EMPTY_REQUIRED_DOCUMENTS: RequireDocument[] = [];
import type { ProductWorkflowResponse } from '@/features/product-config/api/workflow';
import { submitProposalForm } from '@/features/product-config/proposal-form/api/saveProposalForm';
import { getProduct } from '@/features/product-config/api/products';;

interface DynamicProposalProps {
  pages: Page[];
  additionalInformationPages?: Page[];
  productId?: string;
  productName?: string;
  productCode?: string;
  templateId?: string;
  templateVersionId?: string;
  requiredDocuments?: RequireDocument[];
  declarationDocuments?: RequireDocument[];
  workflow?: ProductWorkflowResponse;
  savedProposalId?: string;
}

const DynamicProposal = ({
  templateId,
  templateVersionId,
  pages,
  additionalInformationPages,
  productId,
  productName,
  productCode,
  requiredDocuments,
  declarationDocuments,
  workflow,
  savedProposalId,
}: DynamicProposalProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [showDiscontinueDialog, setShowDiscontinueDialog] = useState(false);
  const [currency, setCurrency] = useState('');
  const [reinsuranceMandatory, setReinsuranceMandatory] = useState(false);
  const [productThemeColor, setProductThemeColor] = useState<string | undefined>(undefined);

  const initialDataFromNavigation = useMemo(() => {
    const raw = (location.state as { initialData?: Record<string, unknown> } | null)?.initialData;
    return raw && typeof raw === 'object' ? raw : undefined;
  }, [location.state]);

  const getProductDetails = useCallback(async () => {
    if (!productId) return;
    try {
      const response = await getProduct(productId, { timeout: 15000 });
      setCurrency(response?.currency || '');
      setReinsuranceMandatory(response?.reinsuranceMandatory ?? false);
      setProductThemeColor(
        (response as { themeColor?: string; theme_color?: string; branding?: { themeColor?: string; theme_color?: string } })?.themeColor ||
          (response as { themeColor?: string; theme_color?: string; branding?: { themeColor?: string; theme_color?: string } })?.theme_color ||
          (response as { branding?: { themeColor?: string; theme_color?: string } })?.branding?.themeColor ||
          (response as { branding?: { themeColor?: string; theme_color?: string } })?.branding?.theme_color ||
          undefined,
      );
    } catch (error) {
      toast({
        title: 'Error',
        description: 'There was an error fetching product details. Please try again.',
        variant: 'destructive',
      });
    }
  }, [productId, toast]);

  useEffect(() => {
    getProductDetails();
  }, [getProductDetails]);

  // Handle discontinuing quote creation
  const handleDiscontinueQuote = () => {
    // Close dialog
    setShowDiscontinueDialog(false);

    // Navigate to dashboard
    navigate(-1);

    toast({
      title: 'Quote Creation Discontinued',
      description: 'Your quote creation has been discontinued.',
    });
  };

  const handleFormSubmit = async (responseId?: string) => {
    if (!responseId) {
      toast({
        title: 'Submission Error',
        description: 'Response ID is missing. Please navigate through the form before submitting.',
        variant: 'destructive',
      });
      return;
    }
    try {
      // Call API to submit proposal form
      const response = await submitProposalForm({ responseId });

      if (response.responseId) {
        toast({
          title: 'Proposal Submitted',
          description:
            'Your proposal has been submitted successfully. You will be redirected to quotes.',
        });
        setTimeout(() => {
          navigate('/broker/dashboard');
        }, 1500);
      }
    } catch (error) {
      console.error('Error submitting proposal form:', error);
      toast({
        title: 'Submission Error',
        description: 'There was an error submitting your proposal. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <section className="pt-6 bg-background min-h-screen flex flex-col">
      <Header title={productName} onBackToDashboard={() => setShowDiscontinueDialog(true)} />

      <div className="flex-1 py-8">
        <DynamicProposalForm
          templateId={templateId}
          templateVersionId={templateVersionId}
          pages={pages}
          additionalInformationPages={additionalInformationPages}
          productId={productId}
          productName={productName}
          productCode={productCode}
          productThemeColor={productThemeColor}
          onFormSubmit={handleFormSubmit}
          initialData={{ ...(initialDataFromNavigation ?? {}), id: savedProposalId }}
          savedProposalId={savedProposalId}
          requiredDocuments={requiredDocuments ?? EMPTY_REQUIRED_DOCUMENTS}
          declarationDocuments={declarationDocuments}
          workflow={workflow}
          currency={currency}
          reinsuranceMandatory={reinsuranceMandatory}
        />
      </div>

      <Footer />

      {/* Discontinue Dialog */}
      <Dialog open={showDiscontinueDialog} onOpenChange={setShowDiscontinueDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Discontinue Quote Creation?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to discontinue creating this quote? All unsaved data will be lost.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowDiscontinueDialog(false)} className="hover:text-slate-700">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDiscontinueQuote}>
              Discontinue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default DynamicProposal;
