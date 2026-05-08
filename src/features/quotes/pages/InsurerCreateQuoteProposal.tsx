/**
 * Insurer Create Quote - Proposal Form Page
 * Step 3: Full-page proposal form (no sidebar)
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { DynamicProposalForm } from '@/features/proposals/components/DynamicProposalForm';
import { getProfessionalIndemnityAnnualTestData } from '@/__mocks__/testData/professionalIndemnityAnnualTestData';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/shared/hooks/use-toast';
import { getProposalFormDesign, type ProposalFormDesign } from '@/features/product-config/proposal-form/api/proposalFormDesign';
import { submitProposalForm } from '@/features/product-config/proposal-form/api/saveProposalForm';
import { Loader2 } from 'lucide-react';
import { getProduct } from '@/features/product-config/api/products';;

export default function InsurerCreateQuoteProposal() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const productCode = searchParams.get('product'); // This is actually the productId now for dynamic products
  const distributorId = searchParams.get('distributor');
  const distributorName = searchParams.get('distributorName');
  const [showDiscontinueDialog, setShowDiscontinueDialog] = useState(false);

  const [design, setDesign] = useState<ProposalFormDesign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currency, setCurrency] = useState('');

  // Load proposal form design
  useEffect(() => {
    if (!productCode || !distributorId) {
      navigate('/insurer/create-quote');
      return;
    }

    const loadDesign = async () => {
      setIsLoading(true);
      try {
        // Handle legacy hardcoded product
        if (productCode === 'PI_Arch') {
          setDesign({
            productId: 'PI_Arch',
            pages: getProfessionalIndemnityAnnualTestData(),
            templateId: 'PI_Arch_Template',
            templateVersionId: 'v1',
          });
          return;
        }

        // Fetch dynamic design
        const formDesign = await getProposalFormDesign(productCode);
        setDesign(formDesign);
      } catch (error) {
        console.error('Failed to load proposal form design:', error);
        toast({
          title: 'Error',
          description: 'Failed to load the proposal form for this product.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadDesign();
  }, [productCode, distributorId, navigate, toast]);

  useEffect(() => {
    const fetchCurrency = async () => {
      try {
        const productIdForCurrency = design?.productId || productCode;
        if (!productIdForCurrency) return;
        const response = await getProduct(productIdForCurrency);
        setCurrency(response?.currency || '');
      } catch (error) {
        toast({
          title: 'Error',
          description: 'There was an error fetching product details. Please try again.',
          variant: 'destructive',
        });
      }
    };

    fetchCurrency();
  }, [design?.productId, productCode, toast]);

  const handleDiscontinueQuote = () => {
    setShowDiscontinueDialog(false);
    navigate(-1);
    toast({
      title: 'Quote Creation Discontinued',
      description: 'Your quote creation has been discontinued.',
    });
  };

  const handleProposalSubmit = async (responseId: string, fieldValues: any[] = []) => {
    if (!design) return;

    if (!responseId) {
      toast({
        title: 'Submission Error',
        description: 'Response ID is missing. Please navigate through the form before submitting.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Call API to submit proposal form (like broker flow)
      const response = await submitProposalForm({ responseId });

      if (response.responseId) {
        toast({
          title: 'Quote Submitted',
          description: 'Your quote has been submitted successfully.',
        });

        // Navigate to dashboard after a short delay
        setTimeout(() => {
          navigate('/insurer/dashboard');
        }, 1500);
      }
    } catch (error: any) {
      console.error('Failed to submit quote:', error);
      toast({
        title: 'Submission Failed',
        description: error.message || 'Failed to submit quote',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">Loading proposal form...</span>
      </div>
    );
  }

  if (!design || !distributorName) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h2 className="text-xl font-semibold">Form Not Found</h2>
        <p>Could not load the proposal form for this product.</p>
        <Button onClick={() => navigate('/insurer/create-quote')}>Back to Quotes</Button>
      </div>
    );
  }

  const title =
    productCode === 'PI_Arch'
      ? 'Professional Liability Insurance - Architects and Engineers'
      : `Create Quote for ${distributorName}`;

  return (
    <section className="pt-6 pb-20 bg-background min-h-screen">
      <Header title={title} onBackToDashboard={() => setShowDiscontinueDialog(true)} />

      <div className="container px-4 mx-auto my-6">
        {/* Dynamic Proposal Form */}
        <DynamicProposalForm
          pages={design.pages}
          templateId={design.templateId || 'DEFAULT'}
          templateVersionId={design.templateVersionId || 'v1'}
          requiredDocuments={design.requiredDocuments || []}
          productId={design.productId}
          productCode={productCode || design.productId}
          distributorId={distributorId || undefined}
          distributorName={distributorName || undefined}
          onFormSubmit={handleProposalSubmit}
          currency={currency}
          workflow={design.workflow}
        />
      </div>

      <Footer />

      {/* Discontinue Dialog */}
      <Dialog open={showDiscontinueDialog} onOpenChange={setShowDiscontinueDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discontinue Quote Creation?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">
              Are you sure you want to discontinue? All progress will be lost.
            </p>
          </div>
          <div className="flex justify-end gap-3">
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
}
