import { useParams, useLocation, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Eye,
  CreditCard,
} from 'lucide-react';
import {
  getProposalBundleV2,
  getQuoteDashboardById,
  downloadProposal,
  downloadQuotePdf,
} from '@/features/quotes/api/quotes';
import type {
  ProposalBundleResponse,
  ProposalBundleResponseV2,
  QuoteDetailWithFormResponseDto,
} from '@/features/quotes/api/quotes';
import { convertV2ToViewModel } from '../utils/QuoteDetailsV2/templateAdapter';
import { useToast } from '@/components/ui/use-toast';
import type { toast as toastFn } from '@/components/ui/use-toast';

// Components
import { TopNavigationBar } from '../components/QuoteDetailsV2/TopNavigationBar';
import { QuoteJourney } from '../components/QuoteDetailsV2/QuoteJourney';
import { TemplatePages } from '../components/QuoteDetailsV2/TemplatePages';
import { ProjectBreakdownWithRiskLevels } from '@/components/ProjectBreakdownWithRiskLevels';
import { SelectedRisksPanel } from '@/components/SelectedRisksPanel';

// Handle proposal download from backend
const handleDownloadProposal = async (
  quoteId: string,
  v2Response: ProposalBundleResponseV2,
  setDownloading: (loading: boolean) => void,
  toast: typeof toastFn,
) => {
  setDownloading(true);
  try {
    const blob = await downloadProposal(quoteId);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    const productName = v2Response.template?.name || 'Proposal';
    const quoteRef = v2Response.responseId || quoteId;
    const fileName = `Proposal_${productName.replace(/\s+/g, '_')}_${quoteRef}.pdf`;

    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Success',
      description: 'Proposal PDF has been generated and downloaded.',
    });
  } catch (error) {
    console.error('Error downloading proposal:', error);
    toast({
      title: 'Error',
      description: 'Failed to download proposal PDF. Please try again.',
      variant: 'destructive',
    });
  } finally {
    setDownloading(false);
  }
};

// Handle quote download with format data
const handleDownloadQuote = async (
  quoteId: string,
  v2Response: ProposalBundleResponseV2,
  setDownloadingQuote: (loading: boolean) => void,
  toast: typeof toastFn,
) => {
  setDownloadingQuote(true);
  try {
    const blob = await downloadQuotePdf(quoteId, 'quote', {});
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    const productName = v2Response.template?.name || 'Quote';
    const quoteRef = v2Response.responseId || quoteId;
    const fileName = `${productName.replace(/\s+/g, '_')}_${quoteRef}.pdf`;

    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Success',
      description: 'Quote PDF has been generated and downloaded.',
    });
  } catch (error) {
    console.error('Error downloading quote:', error);
    toast({
      title: 'Error',
      description: 'Failed to download quote PDF. Please try again.',
      variant: 'destructive',
    });
  } finally {
    setDownloadingQuote(false);
  }
};

export default function QuoteDetailsV2() {
  const { id: quoteId } = useParams<{ id?: string }>();
  const location = useLocation();
  const isInsurerPortal = location.pathname.startsWith('/insurer');
  const { toast } = useToast();
  const [bundle, setBundle] = useState<ProposalBundleResponse | null>(null);
  const [v2Response, setV2Response] = useState<ProposalBundleResponseV2 | null>(null);
  const [quoteDashboardData, setQuoteDashboardData] = useState<QuoteDetailWithFormResponseDto | null>(
    null,
  );
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [downloadingQuote, setDownloadingQuote] = useState(false);
  const [downloadingProposal, setDownloadingProposal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [policyCreatedParam, setPolicyCreatedParam] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const toNumber = (value: unknown): number | undefined => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
    if (typeof value === 'string') {
      const parsed = Number(value.trim());
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
  };
  useEffect(() => {
    const policyCreatedParam = searchParams.get('policy-created');

    if (policyCreatedParam) {
      setPolicyCreatedParam(policyCreatedParam);

      const newParams = new URLSearchParams(searchParams);
      newParams.delete('policy-created');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Auto-expand all workflow sections by default
  useEffect(() => {
    if (v2Response) {
      setExpandedSections((prev) => {
        const newSet = new Set(prev);
        
        // Expand summary
        newSet.add('policy_summary');
        
        // Expand proposal pages
        (v2Response.template?.pages ?? []).forEach((p) => newSet.add(`page_${p.id}`));
        
        // Expand additional info pages
        (v2Response.template?.additionalInformationPages ?? []).forEach((p) =>
          newSet.add(`additional_information_page_${p.id}`),
        );
        
        // Always expand workflow sections by default to ensure visibility
        newSet.add('declaration_documents');
        newSet.add('required_documents');
        newSet.add('selected_premium');
        
        return newSet;
      });
    }
  }, [v2Response]);

  useEffect(() => {
    async function bootstrap() {
      if (!quoteId) {
        setError('Quote ID not found');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);

        // Fetch V2 data
        const [v2, dashboard] = await Promise.all([
          getProposalBundleV2(quoteId),
          getQuoteDashboardById(quoteId).catch(() => null),
        ]);
        setV2Response(v2);
        setQuoteDashboardData(dashboard);

        // Convert to V1 view model
        const vm = convertV2ToViewModel(v2);
        setBundle(vm);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load quote details');
      } finally {
        setLoading(false);
      }
    }
    bootstrap();
  }, [quoteId]);

  const toggleSectionExpansion = (sectionKey: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionKey)) {
        newSet.delete(sectionKey);
      } else {
        newSet.add(sectionKey);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quote details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (!bundle || !v2Response) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Quote not found</p>
        </div>
      </div>
    );
  }

  const showContinueEditing =
    location.pathname.includes('/broker/') &&
    (quoteDashboardData
      ? quoteDashboardData.policyCreated === false && quoteDashboardData.isQuoteEditable === true
      : policyCreatedParam === 'false');

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8fafc' }}>
      {/* Top Navigation Bar */}
      <TopNavigationBar
        bundle={bundle}
        onDownloadProposal={() =>
          handleDownloadProposal(quoteId!, v2Response, setDownloadingProposal, toast)
        }
        onDownloadQuote={() =>
          handleDownloadQuote(quoteId!, v2Response, setDownloadingQuote, toast)
        }
        downloadingProposal={downloadingProposal}
        downloadingQuote={downloadingQuote}
        showContinueEditing={showContinueEditing}
        quoteId={quoteId}
        productName={v2Response.template?.name}
      />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Quote Journey Progress Bar */}
        <QuoteJourney v2Response={v2Response} currentStatus={bundle.quote_meta?.status} />

        {/* 1. Proposal Form (Dynamic template pages from V2 API) */}
        <div id="section_proposal_form">
          <TemplatePages
            v2Response={v2Response}
            expandedSections={expandedSections}
            onToggle={toggleSectionExpansion}
          />
        </div>

        {/* 2. Underwriting Documents (requiredDocuments) */}
        <Card
          className="bg-white border border-blue-200 mb-4"
          data-section="required_documents"
          id="section_underwriting_documents"
        >
          <CardHeader
            className="pb-3 cursor-pointer"
            onClick={() => toggleSectionExpansion('required_documents')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Underwriting Documents
                  </CardTitle>
                  <p className="text-xs text-gray-500 mt-1">
                    Documents submitted for underwriting
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {expandedSections.has('required_documents') ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </div>
            </div>
          </CardHeader>
          {expandedSections.has('required_documents') && (
            <CardContent className="pt-0">
              {(v2Response.requiredDocuments?.length ?? 0) > 0 ? (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {v2Response.requiredDocuments?.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between px-4 py-3 border-b border-gray-200 last:border-b-0"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-900 truncate max-w-sm">
                          {doc.originalFilename}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-primary/80"
                        onClick={() => window.open(doc.url, '_blank')}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 p-4 border border-dashed border-gray-200 rounded-lg text-center">
                  No underwriting documents available.
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* 4. Policy Issuance Documents (declarationDocuments) */}
        <Card
          className="bg-white border border-blue-200 mb-4"
          data-section="declaration_documents"
          id="section_policy_issuance_documents"
        >
          <CardHeader
            className="pb-3 cursor-pointer"
            onClick={() => toggleSectionExpansion('declaration_documents')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Policy Issuance Documents
                  </CardTitle>
                  <p className="text-xs text-gray-500 mt-1">
                    Documents required by the selected insurer
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {expandedSections.has('declaration_documents') ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </div>
            </div>
          </CardHeader>
          {expandedSections.has('declaration_documents') && (
            <CardContent className="pt-0">
              {(v2Response.declarationDocuments?.length ?? 0) > 0 ? (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {v2Response.declarationDocuments?.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between px-4 py-3 border-b border-gray-200 last:border-b-0"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-900 truncate max-w-sm">
                          {doc.originalFilename}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-primary/80"
                        onClick={() => window.open(doc.url, '_blank')}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 p-4 border border-dashed border-gray-200 rounded-lg text-center">
                  No policy issuance documents available.
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {isInsurerPortal && (
          <div className="mt-6">
            <ProjectBreakdownWithRiskLevels
              collapsible
              totalSumInsured={
                toNumber(quoteDashboardData?.totalSumInsured) ??
                toNumber(quoteDashboardData?.sumInsuredBreakdown?.value) ??
                toNumber(quoteDashboardData?.sumInsuredBreakdown?.total) ??
                toNumber(quoteDashboardData?.sumInsuredBreakdown?.sumInsured) ??
                toNumber(quoteDashboardData?.value)
              }
              finalPremium={
                toNumber(quoteDashboardData?.finalPremium) ??
                toNumber(quoteDashboardData?.totalPremium) ?? toNumber(quoteDashboardData?.premium)
              }
              projectBreakdown={quoteDashboardData?.projectBreakdown}
            />
            <div className="mt-4">
              <SelectedRisksPanel
                subtitle="Selected risk category/level per cover from proposal answers"
                items={quoteDashboardData?.selectedRisks ?? []}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
