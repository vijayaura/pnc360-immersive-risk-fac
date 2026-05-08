import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import DynamicProposal from './DynamicProposal';
import { DynamicProposalForm } from '@/features/proposals/components/DynamicProposalForm';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import {
  getProposalFormDesign,
  type Page,
  type RequireDocument,
} from '@/features/product-config/proposal-form/api/proposalFormDesign';
import type { ProductWorkflowResponse } from '@/features/product-config/api/workflow';
import { useToast } from '@/shared/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import type { ProposalBundleResponseV2 } from '@/features/quotes/api/quotes';
import type { ProposalFormEditResponse } from '@/features/quotes/api/edit-quote';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getEndorsementRender, updateEndorsementStatus } from '@/lib/api/endorsements';

type ProposalDesignWithWorkflow = {
  workflow?: ProductWorkflowResponse | null;
};

type EndorsementBundleWithWorkflow = ProposalBundleResponseV2 & {
  workflow?: ProductWorkflowResponse | null;
};

const mapBundleDocumentsToRequiredDocuments = (
  documents: ProposalBundleResponseV2['requiredDocuments'],
): ProposalFormEditResponse['requiredDocuments'] =>
  (documents ?? []).map((document) => ({
    id: document.id,
    label: document.originalFilename || document.filename || 'Uploaded document',
    description: '',
    isRequired: true,
    value: {
      id: document.id,
      filename: document.filename,
      originalFilename: document.originalFilename,
      url: document.url,
      size: Number(document.sizeBytes) || 0,
      uploadDate: document.createdAt,
      uploadedById: '',
    },
  }));

// Placeholder components for other products (to be implemented later)
const ComingSoonProposal = ({ productName }: { productName: string }) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center max-w-md p-8">
        <div className="mb-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">{productName} - Coming Soon</h1>
          <p className="text-muted-foreground mb-6">
            This insurance product is currently under development and will be available soon.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Back to Product Selection
          </button>
        </div>
      </div>
    </div>
  );
};

const ProposalRouter = () => {
  const { productId, endorsementId } = useParams<{ productId?: string; endorsementId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(window.location.search);
  const productNameFromQuery = queryParams.get('productName') || '';
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [dynamicFormPages, setDynamicFormPages] = useState<Page[] | null>(null);
  const [additionalInformationPages, setAdditionalInformationPages] = useState<Page[] | null>(null);
  const [requiredDocuments, setRequiredDocuments] = useState<RequireDocument[] | null>(null);
  const [templateId, setTemplateId] = useState<string>('');
  const [templateVersionId, setTemplateVersionId] = useState<string>('');
  const [workflow, setWorkflow] = useState<ProductWorkflowResponse | null>(null);
  const [policyBundle, setPolicyBundle] = useState<ProposalBundleResponseV2 | null>(null);
  const [showDiscontinueDialog, setShowDiscontinueDialog] = useState(false);
  const [submittedToUnderwriter, setSubmittedToUnderwriter] = useState(false);

  const endorsementTypeFromNavigation = (() => {
    const raw = (location.state as { endorsementType?: string } | null)?.endorsementType;
    return raw === 'technical' || raw === 'non_technical' ? raw : undefined;
  })();

  useEffect(() => {
    if (!submittedToUnderwriter) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [submittedToUnderwriter]);

  // Endorsement flow: load proposal from endorsement render API
  useEffect(() => {
    if (!endorsementId) return;
    const loadEndorsementRender = async () => {
      try {
        setIsLoading(true);
        const bundle = await getEndorsementRender(endorsementId);
        setPolicyBundle(bundle);
      } catch (error: unknown) {
        const err = error as Error;
        toast({
          title: 'Error loading endorsement proposal',
          description: err.message,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadEndorsementRender();
  }, [endorsementId, toast]);

  // Product flow: load proposal form design
  useEffect(() => {
    if (!productId || endorsementId) return;
    const loadDesign = async () => {
      try {
        setIsLoading(true);
        const design = await getProposalFormDesign(productId);
        if (design.pages && design.pages.length > 0) {
          setDynamicFormPages(design.pages);
          setAdditionalInformationPages(design.additionalInformationPages || []);
          setTemplateId(design.templateId || '');
          setTemplateVersionId(design.templateVersionId || '');
          setRequiredDocuments(design.requiredDocuments || []);
          setWorkflow((design as ProposalDesignWithWorkflow).workflow || null);
        } else {
          setDynamicFormPages(null);
          setAdditionalInformationPages(null);
        }
      } catch (error: unknown) {
        const err = error as Error;
        toast({
          title: 'Error loading proposal form',
          description: err.message,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadDesign();
  }, [toast, productId, endorsementId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span>Loading proposal form...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Endorsement flow: render form with endorsement render data and free navigation
  if (endorsementId && policyBundle?.template?.pages?.length) {
    const endorsementAdditionalInformationPages =
      policyBundle.additionalInformation?.template?.pages ?? [];
    const requiredDocumentsFromApi = mapBundleDocumentsToRequiredDocuments(
      policyBundle.requiredDocuments,
    );
    const editData = {
      ...policyBundle,
      template: {
        ...policyBundle.template,
        additionalInformationPages: endorsementAdditionalInformationPages,
      },
      isLocked: false,
      currency: policyBundle.template?.currency ?? 'AED',
      requiredDocuments: requiredDocumentsFromApi,
      workflow: (policyBundle as EndorsementBundleWithWorkflow).workflow,
      declarationDocuments: policyBundle.declarationDocuments,
      additionalDocuments: policyBundle.additionalDocuments,
      endorsementRequiredDocuments: policyBundle.endorsementRequiredDocuments,
      endorsementAdditionalDocuments: policyBundle.endorsementAdditionalDocuments,
    } as unknown as ProposalFormEditResponse;
    const productName = policyBundle.template?.name ?? 'Endorsement Proposal';

    const handleFormSubmit = async (_responseId: string) => {
      if (!endorsementId) return;
      try {
        await updateEndorsementStatus(endorsementId, { status: 'submitted' });
        setSubmittedToUnderwriter(true);
        const endorsementsDashboard =
          location.pathname.startsWith('/broker') ? '/broker/endorsements' : '/insurer/endorsements';
        setTimeout(() => {
          setSubmittedToUnderwriter(false);
          navigate(endorsementsDashboard);
        }, 2500);
      } catch (error: unknown) {
        const err = error as Error;
        toast({
          title: 'Submission Failed',
          description: err.message,
          variant: 'destructive',
        });
      }
    };

    const endorsementsDashboard =
      location.pathname.startsWith('/broker') ? '/broker/endorsements' : '/insurer/endorsements';

    return (
      <section className="pt-6 bg-background min-h-screen flex flex-col relative">
        <Header
          title={productName}
          onBackToDashboard={() => setShowDiscontinueDialog(true)}
        />
        <div className="flex-1 py-8">
          <DynamicProposalForm
            editData={editData}
            onFormSubmit={handleFormSubmit}
            allowFreeNavigation
            endorsementId={endorsementId}
            endorsementType={
              endorsementTypeFromNavigation ??
              (policyBundle as { endorsement?: { type?: 'technical' | 'non_technical' } })?.endorsement?.type
            }
          />
        </div>
        {submittedToUnderwriter && (
          <div className="fixed inset-0 bg-background/95 flex items-center justify-center z-50">
            <p className="text-xl font-semibold text-foreground">Submitting to underwriter</p>
          </div>
        )}
        <Footer />
        <Dialog open={showDiscontinueDialog} onOpenChange={setShowDiscontinueDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Discontinue endorsement form?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to discontinue? All unsaved changes will be lost.
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowDiscontinueDialog(false)}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setShowDiscontinueDialog(false);
                  navigate(endorsementsDashboard);
                }}
              >
                Discontinue
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </section>
    );
  }

  // If dynamic form pages are loaded, render DynamicProposal wrapper
  if (dynamicFormPages && dynamicFormPages.length > 0) {
    // If the productId parameter looks like a UUID, it's likely a formResponseId
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      productId || '',
    );
    const isNew = queryParams.get('new') === 'true';
    const savedProposalId = isUUID && !isNew ? productId : undefined;

    return (
      <DynamicProposal
        templateId={templateId}
        templateVersionId={templateVersionId}
        pages={dynamicFormPages}
        additionalInformationPages={additionalInformationPages || []}
        requiredDocuments={requiredDocuments}
        productId={productId}
        savedProposalId={savedProposalId}
        productName={productNameFromQuery}
        workflow={workflow || undefined}
      />
    );
  }

  // Endorsement ID was provided but bundle failed to load
  if (endorsementId) {
    const endorsementsDashboard =
      location.pathname.startsWith('/broker') ? '/broker/endorsements' : '/insurer/endorsements';
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">Could not load endorsement proposal.</p>
            <Button variant="outline" onClick={() => navigate(endorsementsDashboard)}>Back to Endorsements</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No design found - show coming soon
  return <ComingSoonProposal productName={productNameFromQuery} />;
};

export default ProposalRouter;
