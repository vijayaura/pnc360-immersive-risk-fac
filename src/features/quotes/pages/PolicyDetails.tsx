import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, useMatch } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  ArrowLeft,
  Download,
  ChevronDown,
  ChevronUp,
  Eye,
  FileText,
  User,
  Building,
  CreditCard,
  FileEdit,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import {
  getPolicyDetailsById,
  PolicyDetailsAPIResponse,
  getRenderV2,
  ProposalBundleResponse,
  ProposalBundleResponseV2,
  downloadProposal,
  downloadQuotePdf,
  calculateQuoteRating,
  type PremiumBreakdown,
} from '@/features/quotes/api/quotes';
import {
  getEndorsementDetail,
  getEndorsementRender,
  listPolicyEndorsements,
  type PolicyEndorsementListItem,
} from '@/lib/api/endorsements';
import {
  mapApiTypeToDisplay,
  mapApiStatusToStatus,
  type Status,
} from '@/features/insurers/components/endorsement-types';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import { toast } from '@/shared/hooks/use-toast';
import { api } from '@/lib/api/client';
import { formatCurrency, formatCurrencyLocale } from '@/shared/utils/lib-utils';
import { QuoteJourney } from '../components/QuoteDetailsV2/QuoteJourney';
import { TemplatePages } from '../components/QuoteDetailsV2/TemplatePages';
import { convertV2ToViewModel } from '../utils/QuoteDetailsV2/templateAdapter';
import { buildPremiumCalculationSummaryHtml } from '@/features/quotes/utils/premium-calculation-summary';
import { ProjectBreakdownWithRiskLevels } from '@/components/ProjectBreakdownWithRiskLevels';

const withAdditionalInformationPages = (
  renderData: ProposalBundleResponseV2,
): ProposalBundleResponseV2 => {
  const additionalInformationPages = renderData.additionalInformation?.template?.pages ?? [];
  if (!additionalInformationPages.length) {
    return renderData;
  }

  return {
    ...renderData,
    template: {
      ...renderData.template,
      additionalInformationPages,
    },
  };
};

// Helper functions for formatting
const formatFieldName = (key: string): string => {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .replace(/Id\b/g, 'ID')
    .replace(/Tpl\b/g, 'TPL')
    .replace(/Cew\b/g, 'CEW');
};

const formatFieldValue = (key: string, value: unknown): string => {
  if (value === null || value === undefined || value === '') {
    return 'Not specified';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  // Format currency values
  if (
    key.toLowerCase().includes('amount') ||
    key.toLowerCase().includes('premium') ||
    key.toLowerCase().includes('sum_insured') ||
    key.toLowerCase().includes('value')
  ) {
    const num =
      typeof value === 'number'
        ? value
        : Number.parseFloat(typeof value === 'string' ? value : String(value));
    if (!isNaN(num)) {
      return formatCurrency(num, 'AED');
    }
  }

  return String(value);
};

const formatTextValue = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
};

const getFieldValue = (
  values: PolicyDetailsAPIResponse['formResponseData']['values'],
  fieldName: string,
): string | undefined => {
  const field = values?.find((v) => v.fieldName === fieldName);
  if (!field) return undefined;
  const raw = field.valueText ?? field.valueJson;
  const formatted = formatTextValue(raw);
  return formatted ? formatted : undefined;
};

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value === 'string') {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const POLICY_ENDORSEMENTS_LIMIT = 5;

function getEndorsementStatusBadge(status: Status) {
  const variants: Record<Status, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    Draft: 'outline',
    Submitted: 'default',
    Approved: 'secondary',
    Rejected: 'destructive',
  };
  return <Badge variant={variants[status]}>{status}</Badge>;
}

// Generate Proposal Form PDF
const generateProposalPDF = (policyData: PolicyDetailsAPIResponse) => {
  const doc = new jsPDF();
  let yPosition = 20;
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  const labelWidth = 80;
  const valueWidth = pageWidth - labelWidth - 30;

  const addTableRow = (label: string, value: string, isHeader: boolean = false) => {
    if (yPosition > pageHeight - 15) {
      doc.addPage();
      yPosition = 20;
    }

    const fontSize = isHeader ? 10 : 8;
    const isBold = isHeader;
    const rowHeight = isHeader ? 7 : 6;

    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');

    if (!isHeader) {
      doc.setDrawColor(200, 200, 200);
      doc.rect(10, yPosition - 2, labelWidth, rowHeight + 1);
      doc.rect(10 + labelWidth, yPosition - 2, valueWidth, rowHeight + 1);
    }

    const textY = yPosition + rowHeight / 2 - 1;
    doc.text(label, 11, textY);
    doc.text(value, 11 + labelWidth, textY);

    yPosition += isHeader ? rowHeight : rowHeight + 1;
  };

  const addSectionHeader = (title: string) => {
    addTableRow(title, '', true);
  };

  // Header
  doc.setFillColor(0, 64, 128);
  doc.rect(0, 0, pageWidth, 35, 'F');
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('INSURANCE POLICY DETAILS', 10, 15);
  doc.text('PROPOSAL FORM', 10, 22);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const cd = new Date(policyData.createdAt);
  const createdDate = !isNaN(cd.getTime()) 
    ? `${cd.getFullYear()}-${String(cd.getMonth() + 1).padStart(2, '0')}-${String(cd.getDate()).padStart(2, '0')}`
    : '-';
  doc.text(`Date: ${createdDate}`, pageWidth - 80, 22);

  doc.setFontSize(8);
  doc.text(`Quote Reference: ${policyData.quoteReference}`, 10, 30);

  doc.setTextColor(0, 0, 0);
  yPosition = 40;

  const values = policyData.formResponseData?.values || [];

  // Project Details
  addSectionHeader('PROJECT DETAILS');
  addTableRow('Project Name', getFieldValue(values, 'project_name') || 'N/A');
  addTableRow('Project Type', getFieldValue(values, 'project_type') || 'N/A');
  addTableRow('Construction Type', getFieldValue(values, 'construction_type') || 'N/A');
  addTableRow('Start Date', getFieldValue(values, 'start_date') || 'N/A');
  addTableRow('Completion Date', getFieldValue(values, 'completion_date') || 'N/A');
  addTableRow('Address', getFieldValue(values, 'address') || 'N/A');
  addTableRow('Country', getFieldValue(values, 'country') || 'N/A');

  // Insured Details
  addSectionHeader('INSURED DETAILS');
  addTableRow('Insured Name', getFieldValue(values, 'insured_name') || 'N/A');
  addTableRow('Role of Insured', getFieldValue(values, 'role_of_insured') || 'N/A');

  doc.save(`Proposal_${policyData.quoteReference}.pdf`);
};

const PolicyDetails = () => {
  const { id: policyId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const insurerEndorsementRoute = useMatch({ path: '/insurer/endorsement/:id', end: true });
  const brokerEndorsementRoute = useMatch({ path: '/broker/endorsement/:id', end: true });
  const marketAdminEndorsementRoute = useMatch({ path: '/market-admin/endorsement/:id', end: true });
  const endorsementId =
    insurerEndorsementRoute?.params?.id ?? brokerEndorsementRoute?.params?.id ?? marketAdminEndorsementRoute?.params?.id ?? null;
  const [policyData, setPolicyData] = useState<PolicyDetailsAPIResponse | null>(null);
  const [allData, setAllData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [isDownloadingPolicy, setIsDownloadingPolicy] = useState(false);
  const [isDownloadingSlip, setIsDownloadingSlip] = useState(false);
  const [isDownloadingProposal, setIsDownloadingProposal] = useState(false);
  const [isDownloadingQuote, setIsDownloadingQuote] = useState(false);
  const [v2Response, setV2Response] = useState<ProposalBundleResponseV2 | null>(null);
  const [bundle, setBundle] = useState<ProposalBundleResponse | null>(null);
  const [documentPreview, setDocumentPreview] = useState<{
    url: string;
    title: string;
    kind: 'image' | 'pdf';
  } | null>(null);

  const [policyEndorsements, setPolicyEndorsements] = useState<PolicyEndorsementListItem[]>([]);
  const [policyEndorsementsMeta, setPolicyEndorsementsMeta] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null>(null);
  const [policyEndorsementsLoading, setPolicyEndorsementsLoading] = useState(false);
  const [policyEndorsementsError, setPolicyEndorsementsError] = useState<string | null>(null);
  const [policyEndorsementsPage, setPolicyEndorsementsPage] = useState(1);

  // Detect if we're in insurer or broker portal
  const isInsurerPortal = location.pathname.startsWith('/insurer');
  const isBrokerPortal = location.pathname.startsWith('/broker');
  const endorsementsPath = isInsurerPortal
    ? '/insurer/endorsements'
    : isBrokerPortal
      ? '/broker/endorsements'
      : null;
  const canCreateEndorsement =
    isBrokerPortal && endorsementsPath && !endorsementId && !policyData?.isPolicyCancelled;

  const handleCreateEndorsement = () => {
    if (!isBrokerPortal) return;
    if (endorsementsPath) {
      navigate(`${endorsementsPath}?mode=create&policyId=${policyId || ''}`);
    }
  };

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

  const handleDownloadProposalForm = async () => {
    if (policyData) {
      const quoteId = policyData.formResponseData?.responseId;
      if (!quoteId || !v2Response) {
        generateProposalPDF(policyData);
        return;
      }

      setIsDownloadingProposal(true);
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
        let description = 'Failed to download proposal PDF. Please try again.';

        if (error instanceof Error) {
          description = error.message;
        }

        try {
          const errorObj = error as { data?: unknown; response?: { data?: unknown } };
          const errorData = errorObj?.data || errorObj?.response?.data;
          if (errorData instanceof Blob) {
            const text = await errorData.text();
            const json = JSON.parse(text);
            if (json.message) {
              description = json.message;
            }
          }
        } catch (e) {
          console.error('Failed to parse error blob:', e);
        }

        toast({
          title: 'Error',
          description,
          variant: 'destructive',
        });
      } finally {
        setIsDownloadingProposal(false);
      }
    }
  };

  const downloadPolicyDocument = async (options: {
    includePremiumBreakdown: boolean;
    filePrefix: string;
    successTitle: string;
    successDescription: string;
    errorDescription: string;
    setLoading: (value: boolean) => void;
  }) => {
    if (!policyData) return;

    options.setLoading(true);
    try {
      const responseId = policyData.formResponseData.responseId;
      const currency =
        policyData.selectedPremium?.currency ||
        policyData.currency ||
        policyData.productDetails?.currency ||
        'N/A';

      const totalPremium = policyData.totalPremium || 0;
      const basePremium = policyData.quoteDetails?.basePremium || 0;
      const brokerCommissionAmount =
        policyData.brokerCommissionDetails?.brokerCommissionAmount ??
        policyData.selectedPremium?.brokerCommissionAmount ??
        0;

      const premiumSummaryHtml = await (async () => {
        try {
          const rating = await calculateQuoteRating(String(responseId));
          const results = (() => {
            const r = rating as unknown as { results?: unknown; insurers?: unknown };
            if (Array.isArray(r.results)) return r.results as Array<Record<string, unknown>>;
            if (Array.isArray(r.insurers)) return r.insurers as Array<Record<string, unknown>>;
            return [] as Array<Record<string, unknown>>;
          })();

          const matched = results.find(
            (r) => String(r.quoteId ?? r.quote_id ?? '') === String(policyData.quoteId || ''),
          );
          const premium = (matched?.premium as PremiumBreakdown | null) ?? null;
          return buildPremiumCalculationSummaryHtml({ premium, currency });
        } catch {
          return '';
        }
      })();

      const payload = {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        cewSelectedItems: [],
        values: {
          sumInsured: formatCurrency(
            policyData.totalSumInsured || policyData.sumInsured || 0,
            currency,
          ),
          basePremium: formatCurrency(basePremium, currency),
          totalPremium: formatCurrency(totalPremium, currency),
          subtotal: formatCurrency(totalPremium, currency),
          annualPremium: formatCurrency(totalPremium, currency),
          loading: formatCurrency(policyData.quoteDetails?.loadingAmount || 0, currency),
          discount: formatCurrency(policyData.quoteDetails?.discountAmount || 0, currency),
          vat: formatCurrency(0, currency),
          brokerCommission: formatCurrency(brokerCommissionAmount, currency),
          premiumBreakdown: premiumSummaryHtml,
        },
      };

      const requestUrl = options.includePremiumBreakdown
        ? `/quote/${responseId}/download-pdf/policy?includePremiumBreakdown=true`
        : `/quote/${responseId}/download-pdf/policy`;

      const resp = await api.request<Blob>({
        url: requestUrl,
        method: 'POST',
        data: payload,
        responseType: 'blob',
        headers: { Accept: 'application/pdf' },
      });

      const blob = resp.data as unknown as Blob;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const policyRef = policyData.policyNumber || 'Policy';
      link.download = `${options.filePrefix}_${policyRef}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: options.successTitle,
        description: options.successDescription,
        variant: 'default',
      });
    } catch (error) {
      console.error('Error downloading policy document:', error);
      let description = error instanceof Error ? error.message : options.errorDescription;

      try {
        const errorObj = error as { data?: unknown; response?: { data?: unknown } };
        const errorData = errorObj?.data || errorObj?.response?.data;
        if (errorData instanceof Blob) {
          const text = await errorData.text();
          const json = JSON.parse(text);
          if (json.message) {
            description = json.message;
          }
        }
      } catch (e) {
        console.error('Failed to parse error blob:', e);
      }

      toast({
        title: 'Download Failed',
        description,
        variant: 'destructive',
      });
    } finally {
      options.setLoading(false);
    }
  };

  const handleDownloadPolicy = async () => {
    await downloadPolicyDocument({
      includePremiumBreakdown: true,
      filePrefix: 'Policy',
      successTitle: 'Policy Downloaded',
      successDescription: 'Policy PDF has been generated and downloaded.',
      errorDescription: 'Failed to download policy PDF',
      setLoading: setIsDownloadingPolicy,
    });
  };

  const handleDownloadSlip = async () => {
    await downloadPolicyDocument({
      includePremiumBreakdown: false,
      filePrefix: 'Slip',
      successTitle: 'Slip Downloaded',
      successDescription: 'Slip PDF has been generated and downloaded.',
      errorDescription: 'Failed to download slip PDF',
      setLoading: setIsDownloadingSlip,
    });
  };

  const handleDownloadQuote = async () => {
    setIsDownloadingQuote(true);
    try {
      if (!policyData) return;
      const responseId = policyData.formResponseData?.responseId;
      if (!responseId) return;

      const currency =
        policyData.selectedPremium?.currency ||
        policyData.currency ||
        policyData.productDetails?.currency ||
        'N/A';
      const blob = await downloadQuotePdf(responseId, 'quote', {
        values: {
          sumInsured: formatCurrency(
            policyData.totalSumInsured || policyData.sumInsured || 0,
            currency,
          ),
        },
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const productName = v2Response?.template?.name || policyData.productDetails?.name || 'Quote';
      const quoteRef = policyData.quoteReference || responseId;
      const fileName = `${productName.replace(/\s+/g, '_')}_${quoteRef}.pdf`;

      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Quote Downloaded',
        description: 'Quote PDF has been generated and downloaded.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error downloading quote:', error);
      let description = error instanceof Error ? error.message : 'Failed to download quote PDF';

      try {
        const errorObj = error as { data?: unknown; response?: { data?: unknown } };
        const errorData = errorObj?.data || errorObj?.response?.data;
        if (errorData instanceof Blob) {
          const text = await errorData.text();
          const json = JSON.parse(text);
          if (json.message) {
            description = json.message;
          }
        }
      } catch (e) {
        console.error('Failed to parse error blob:', e);
      }

      toast({
        title: 'Download Failed',
        description,
        variant: 'destructive',
      });
    } finally {
      setIsDownloadingQuote(false);
    }
  };

  useEffect(() => {
    const loadPolicyData = async () => {
      const id = endorsementId ?? policyId;
      if (!id) {
        setError(endorsementId ? 'Endorsement ID not found' : 'Policy ID not found');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        if (endorsementId) {
          const [data, renderData] = await Promise.all([
            getEndorsementDetail(endorsementId),
            getEndorsementRender(endorsementId),
          ]);
          const normalizedRenderData = withAdditionalInformationPages(renderData);
          setPolicyData(data);
          setAllData(data);
          setV2Response(normalizedRenderData);
          const vm = convertV2ToViewModel(normalizedRenderData);
          setBundle(vm);
        } else {
          const data = await getPolicyDetailsById(id);
          const renderData = await getRenderV2(id);
          const normalizedRenderData = withAdditionalInformationPages(renderData);
          setV2Response(normalizedRenderData);
          const vm = convertV2ToViewModel(normalizedRenderData);
          setBundle(vm);
          setPolicyData(data);
          setAllData(data);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadPolicyData();
  }, [policyId, endorsementId]);

  const effectivePolicyId = policyId ?? policyData?.policyId ?? policyData?.id;

  useEffect(() => {
    if (!effectivePolicyId) return;
    let cancelled = false;
    setPolicyEndorsementsLoading(true);
    setPolicyEndorsementsError(null);
    listPolicyEndorsements(effectivePolicyId, {
      page: policyEndorsementsPage,
      limit: POLICY_ENDORSEMENTS_LIMIT,
    })
      .then((res) => {
        if (!cancelled) {
          setPolicyEndorsements(res.data);
          setPolicyEndorsementsMeta(res.meta);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setPolicyEndorsementsError(
            err instanceof Error ? err.message : 'Failed to load endorsements',
          );
          setPolicyEndorsements([]);
          setPolicyEndorsementsMeta(null);
        }
      })
      .finally(() => {
        if (!cancelled) setPolicyEndorsementsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [effectivePolicyId, policyEndorsementsPage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading policy details...</p>
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

  if (!policyData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Policy not found</p>
        </div>
      </div>
    );
  }

  const values = policyData.formResponseData?.values || [];
  const requiredDocuments = v2Response?.requiredDocuments ?? [];
  const declarationDocuments = v2Response?.declarationDocuments ?? [];
  const additionalDocuments = v2Response?.additionalDocuments ?? [];
  const endorsementRequiredDocuments = v2Response?.endorsementRequiredDocuments ?? [];
  const endorsementAdditionalDocuments = v2Response?.endorsementAdditionalDocuments ?? [];
  const shouldShowPolicyEndorsementsSection =
    Boolean(effectivePolicyId) &&
    (policyEndorsementsLoading ||
      Boolean(policyEndorsementsError) ||
      (policyEndorsementsMeta?.total ?? policyEndorsements.length) > 0);
  const endorsementSummary = policyData.endorsementSummary ?? policyData.endorsementPremium;
  const endorsementPremiumDetails = endorsementSummary?.premium;
  const endorsementFees = endorsementPremiumDetails?.endorsementFees ?? [];
  const endorsementSummaryType = String(endorsementSummary?.type || '')
    .toLowerCase()
    .replace(/-/g, '_');
  const endorsementSummaryTypeLabel = (() => {
    if (endorsementSummaryType === 'technical') return 'Financial';
    if (endorsementSummaryType === 'non_technical') return 'Non Financial';
    if (endorsementSummaryType === 'cancellation') return 'Cancellation';
    if (endorsementSummaryType === 'extensions') return 'Extensions';
    return endorsementSummary?.type || 'N/A';
  })();
  const isCancellationEndorsementSummary = endorsementSummaryType === 'cancellation';
  const endorsementAmountLabel = isCancellationEndorsementSummary
    ? 'Refund Amount'
    : 'Total Endorsement Amount';
  const endorsementAmountValue =
    endorsementPremiumDetails?.totalEndorsementAmount != null
      ? Number(endorsementPremiumDetails.totalEndorsementAmount) *
        (isCancellationEndorsementSummary ? -1 : 1)
      : null;
  const hasEndorsementSummary = Boolean(
    endorsementSummary &&
      Object.keys(endorsementSummary).length > 0 &&
      (endorsementPremiumDetails?.originalPremium != null ||
        endorsementPremiumDetails?.revisedPremium != null ||
        endorsementPremiumDetails?.totalEndorsementAmount != null ||
        endorsementSummary.createdAt != null ||
        endorsementSummary.effectiveDate != null ||
        endorsementSummary.type != null ||
        endorsementFees.length > 0),
  );
  const endorsementSummaryCurrency =
    endorsementPremiumDetails?.currency || policyData.currency || policyData.selectedPremium?.currency;
  const displayCurrency =
    policyData.selectedPremium?.currency || policyData.currency || policyData.productDetails?.currency || 'AED';
  const brokerCommissionDetails = policyData.brokerCommissionDetails;
  const brokerCommissionAmount =
    brokerCommissionDetails?.brokerCommissionAmount ??
    policyData.selectedPremium?.brokerCommissionAmount ??
    0;
  const brokerCommissionPercentage =
    brokerCommissionDetails?.brokerCommissionPercentage ??
    policyData.selectedPremium?.brokerCommissionPercentage;
  const brokerBaseCommissionPercentage =
    brokerCommissionDetails?.brokerBaseCommissionPercentage ??
    policyData.selectedPremium?.brokerBaseCommissionPercentage;
  const brokerMinCommissionPercentage =
    brokerCommissionDetails?.brokerMinCommissionPercentage ??
    policyData.selectedPremium?.brokerMinCommissionPercentage;
  const brokerMaxCommissionPercentage =
    brokerCommissionDetails?.brokerMaxCommissionPercentage ??
    policyData.selectedPremium?.brokerMaxCommissionPercentage;
  const hasBrokerCommissionDetails =
    brokerCommissionDetails != null ||
    brokerCommissionPercentage != null ||
    brokerBaseCommissionPercentage != null ||
    brokerMinCommissionPercentage != null ||
    brokerMaxCommissionPercentage != null ||
    brokerCommissionAmount > 0;

  const handleDownloadDeclarationDocument = (doc: {
    id: string;
    originalFilename: string;
    url: string;
  }) => {
    const link = document.createElement('a');
    link.href = doc.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.download = doc.originalFilename || 'Document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAdditionalDocument = (doc: {
    id: string;
    url: string;
    originalFilename: string;
    documentName?: string;
  }) => {
    const link = document.createElement('a');
    link.href = doc.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.download = doc.documentName ?? doc.originalFilename ?? 'Document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const canPreviewDocument = (contentType?: string, url?: string): 'image' | 'pdf' | false => {
    const type = (contentType ?? '').toLowerCase();
    if (type.startsWith('image/')) return 'image';
    if (type === 'application/pdf') return 'pdf';
    if (url) {
      const lower = url.toLowerCase();
      if (/\.(png|jpg|jpeg|gif|webp|bmp|svg)(\?|$)/.test(lower)) return 'image';
      if (/\.pdf(\?|$)/.test(lower)) return 'pdf';
    }
    return false;
  };

  const openDocumentPreview = (url: string, title: string, contentType?: string) => {
    const kind = canPreviewDocument(contentType, url);
    if (kind) setDocumentPreview({ url, title, kind });
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8fafc' }}>
      {/* Top Navigation Bar */}
      <div className="border-b border-gray-200 bg-white px-4 py-3 md:px-6 sticky top-0 z-10">
        {/* Two rows by default so policy / insured copy stays readable; one row only on very wide screens */}
        <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between 2xl:gap-6">
          <div className="flex min-w-0 items-start gap-2 2xl:min-w-0 2xl:flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (location.state?.fromPayment) {
                  navigate('/broker/dashboard');
                } else {
                  window.history.back();
                }
              }}
              className="flex h-8 shrink-0 items-center gap-1 px-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back</span>
            </Button>
            <div className="min-w-0 flex-1">
              <h1
                className="break-words text-base font-bold text-gray-900 2xl:truncate md:text-lg"
                title={`Policy Details - ${policyData.policyNumber || 'Unknown'}`}
              >
                Policy Details - <span className="text-primary">{policyData.policyNumber || 'Unknown'}</span>
              </h1>
              <p className="mt-0.5 break-words text-xs text-gray-600 2xl:truncate md:text-sm">
                {getFieldValue(values, 'insured_name') || 'Insurance Policy'}
              </p>
            </div>
          </div>

          <div className="flex w-full flex-wrap items-center justify-start gap-2 2xl:w-auto 2xl:flex-nowrap 2xl:justify-end 2xl:shrink-0">
            {canCreateEndorsement && (
              <Button
                variant="default"
                size="sm"
                className="flex h-9 shrink-0 items-center gap-2 whitespace-nowrap"
                onClick={handleCreateEndorsement}
              >
                <FileEdit className="h-4 w-4 shrink-0" />
                <span>Create Endorsement</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="flex h-9 shrink-0 items-center gap-2 whitespace-nowrap"
              onClick={handleDownloadProposalForm}
              disabled={isDownloadingProposal}
            >
              {isDownloadingProposal ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 shrink-0" />
              )}
              <span>Download Proposal Form</span>
            </Button>
            {(isInsurerPortal || isBrokerPortal) && (
              <Button
                variant="outline"
                size="sm"
                className="flex h-9 shrink-0 items-center gap-2 whitespace-nowrap"
                onClick={handleDownloadQuote}
                disabled={isDownloadingQuote || !bundle}
              >
                {isDownloadingQuote ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 shrink-0" />
                )}
                {isDownloadingQuote ? 'Generating...' : 'Download Quote'}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="flex h-9 shrink-0 items-center gap-2 whitespace-nowrap"
              onClick={handleDownloadSlip}
              disabled={isDownloadingSlip}
            >
              {isDownloadingSlip ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              ) : (
                <Download className="h-4 w-4 shrink-0" />
              )}
              <span>Download Slip</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex h-9 shrink-0 items-center gap-2 whitespace-nowrap"
              onClick={handleDownloadPolicy}
              disabled={isDownloadingPolicy}
            >
              {isDownloadingPolicy ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              ) : (
                <Download className="h-4 w-4 shrink-0" />
              )}
              <span>Download Policy</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Total endorsements for this policy - above Quote Progress Journey */}
        {shouldShowPolicyEndorsementsSection && (
          <Card className="bg-white border border-blue-200 mb-4">
            <CardHeader>
              <CardTitle>
                Total endorsements for this policy
                {policyEndorsementsMeta != null ? ` (${policyEndorsementsMeta.total})` : ''}
              </CardTitle>
              <CardDescription>List of all endorsements for this policy.</CardDescription>
            </CardHeader>
            <CardContent>
              {policyEndorsementsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : policyEndorsementsError ? (
                <div className="text-center py-8">
                  <p className="text-destructive text-sm">{policyEndorsementsError}</p>
                </div>
              ) : policyEndorsements.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No endorsements found</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Endorsement Reference</TableHead>
                        <TableHead>Policy Number</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Effective Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {policyEndorsements.map((end) => (
                        <TableRow key={end.id}>
                          <TableCell className="font-medium">{end.endorsementReference}</TableCell>
                          <TableCell>{policyData?.policyNumber ?? '—'}</TableCell>
                          <TableCell>{mapApiTypeToDisplay(end.type)}</TableCell>
                          <TableCell>
                            {end.effectiveDate ? format(new Date(end.effectiveDate), 'PPP') : '—'}
                          </TableCell>
                          <TableCell>
                            {getEndorsementStatusBadge(mapApiStatusToStatus(end.status))}
                          </TableCell>
                          <TableCell className="text-center">
                            {(() => {
                              const mappedStatus = mapApiStatusToStatus(end.status);
                              const isDraft =
                                String(mappedStatus || '')
                                  .trim()
                                  .toLowerCase() === 'draft';

                              return (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (isDraft) return;
                                const base = isBrokerPortal
                                  ? '/broker'
                                  : isInsurerPortal
                                    ? '/insurer'
                                    : '/market-admin';
                                navigate(`${base}/endorsement/${end.id}`);
                              }}
                              disabled={isDraft}
                            >
                              <Eye className="w-4 h-4" />
                              View Details
                            </Button>
                              );
                            })()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {policyEndorsementsMeta && !policyEndorsementsLoading && (
                    <div className="px-0 py-4 border-t flex justify-between items-center mt-4">
                      <div className="text-sm text-muted-foreground">
                        Showing {policyEndorsements.length} of {policyEndorsementsMeta.total}{' '}
                        results
                      </div>
                      <div className="ml-auto">
                        <Pagination className="w-auto justify-end">
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (policyEndorsementsPage > 1)
                                    setPolicyEndorsementsPage(policyEndorsementsPage - 1);
                                }}
                                className={
                                  policyEndorsementsPage === 1 ||
                                  policyEndorsements.length === 0 ||
                                  (policyEndorsementsMeta?.total ?? 0) === 0
                                    ? 'pointer-events-none opacity-50'
                                    : ''
                                }
                              />
                            </PaginationItem>
                            {(() => {
                              const maxPages = 5;
                              const totalPages = policyEndorsementsMeta.totalPages;
                              let startPage = 1;
                              let endPage = Math.min(maxPages, totalPages);
                              if (totalPages > maxPages) {
                                if (policyEndorsementsPage <= 3) {
                                  startPage = 1;
                                  endPage = maxPages;
                                } else if (policyEndorsementsPage >= totalPages - 2) {
                                  startPage = totalPages - maxPages + 1;
                                  endPage = totalPages;
                                } else {
                                  startPage = policyEndorsementsPage - 2;
                                  endPage = policyEndorsementsPage + 2;
                                }
                              }
                              return Array.from(
                                { length: endPage - startPage + 1 },
                                (_, i) => startPage + i,
                              ).map((pageNum) => (
                                <PaginationItem key={pageNum}>
                                  <PaginationLink
                                    href="#"
                                    isActive={policyEndorsementsPage === pageNum}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setPolicyEndorsementsPage(pageNum);
                                    }}
                                  >
                                    {pageNum}
                                  </PaginationLink>
                                </PaginationItem>
                              ));
                            })()}
                            <PaginationItem>
                              <PaginationNext
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (policyEndorsementsPage < policyEndorsementsMeta.totalPages)
                                    setPolicyEndorsementsPage(policyEndorsementsPage + 1);
                                }}
                                className={
                                  policyEndorsementsPage === policyEndorsementsMeta.totalPages ||
                                  policyEndorsements.length === 0 ||
                                  (policyEndorsementsMeta?.total ?? 0) === 0
                                    ? 'pointer-events-none opacity-50'
                                    : ''
                                }
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        <QuoteJourney
          isPolicyCreated={true}
          v2Response={v2Response}
          currentStatus={bundle.quote_meta?.status}
        />

        {/* Policy Summary */}
        <Card className="bg-white border border-blue-200 mb-4" data-section="policy_summary">
          <CardHeader
            className="pb-3 cursor-pointer"
            onClick={() => toggleSectionExpansion('policy_summary')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Policy Summary
                  </CardTitle>
                  <div className="text-xs text-gray-400 mt-1">
                    {policyData.createdAt
                      ? new Date(policyData.createdAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Policy Reference: ' + (policyData.quoteReference || 'N/A')}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs text-gray-400">Total Premium</div>
                  <div className="text-sm text-gray-600 font-medium">
                    {formatCurrency(policyData.totalPremium ?? 0, displayCurrency)}
                  </div>
                </div>
                {expandedSections.has('policy_summary') ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </div>
            </div>
          </CardHeader>
          {expandedSections.has('policy_summary') && (
            <CardContent className="pt-0">
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="grid lg:grid-cols-4">
                  <div className="p-3 border-r border-b border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Policy Number</div>
                    <div className="text-sm font-medium">{policyData.policyNumber}</div>
                  </div>
                  <div className="p-3 border-r border-b border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Total Premium</div>
                    <div className="text-sm font-medium">
                      {formatCurrency(policyData.totalPremium ?? 0, displayCurrency)}
                    </div>
                  </div>
                  <div className="p-3 border-r border-b border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Sum Insured</div>
                    <div className="text-sm font-medium">
                      {formatCurrency(policyData.sumInsured ?? 0, displayCurrency)}
                    </div>
                  </div>
                  <div className="p-3 border-b border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Quote Reference</div>
                    <div className="text-sm font-medium">{policyData.quoteReference}</div>
                  </div>
                  <div className="p-3 border-r border-b border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Policy Start Date</div>
                    <div className="text-sm font-medium">
                      {policyData.policyStartDate
                        ? format(new Date(policyData.policyStartDate), 'yyyy-MM-dd')
                        : 'N/A'}
                    </div>
                  </div>
                  <div className="p-3 border-r border-b border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Policy End Date</div>
                    <div className="text-sm font-medium">
                      {policyData.policyEndDate
                        ? format(new Date(policyData.policyEndDate), 'yyyy-MM-dd')
                        : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {hasEndorsementSummary && (
          <Card
            className="bg-white border border-blue-200 mb-4"
            data-section="endorsement_summary"
          >
            <CardHeader
              className="pb-3 cursor-pointer"
              onClick={() => toggleSectionExpansion('endorsement_summary')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Latest Endorsement Summary
                    </CardTitle>
                    <div className="text-xs text-gray-400 mt-1">
                      {endorsementSummary?.createdAt
                        ? format(new Date(endorsementSummary.createdAt), 'yyyy-MM-dd HH:mm')
                        : 'Endorsement Reference: ' +
                          (endorsementSummary?.endorsementReference || 'N/A')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-gray-400">{endorsementAmountLabel}</div>
                    <div className="text-sm text-gray-600 font-medium">
                      {endorsementAmountValue != null
                        ? formatCurrencyLocale(
                            endorsementAmountValue,
                            endorsementSummaryCurrency,
                          )
                        : 'N/A'}
                    </div>
                  </div>
                  {expandedSections.has('endorsement_summary') ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </div>
            </CardHeader>
            {expandedSections.has('endorsement_summary') && (
              <CardContent className="pt-0">
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="grid lg:grid-cols-4">
                    <div className="p-3 border-r border-b border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Endorsement Reference</div>
                      <div className="text-sm font-medium">
                        {endorsementSummary?.endorsementReference || 'N/A'}
                      </div>
                    </div>
                    <div className="p-3 border-r border-b border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Type</div>
                      <div className="text-sm font-medium">
                        {endorsementSummaryTypeLabel}
                      </div>
                    </div>
                    <div className="p-3 border-r border-b border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Original Premium</div>
                      <div className="text-sm font-medium">
                        {endorsementPremiumDetails?.originalPremium != null
                          ? formatCurrencyLocale(
                              endorsementPremiumDetails.originalPremium,
                              endorsementSummaryCurrency,
                            )
                          : 'N/A'}
                      </div>
                    </div>
                    <div className="p-3 border-r border-b border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Revised Premium</div>
                      <div className="text-sm font-medium">
                        {endorsementPremiumDetails?.revisedPremium != null
                          ? formatCurrencyLocale(
                              endorsementPremiumDetails.revisedPremium,
                              endorsementSummaryCurrency,
                            )
                          : 'N/A'}
                      </div>
                    </div>
                    <div className="p-3 border-r border-b border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Effective Date</div>
                      <div className="text-sm font-medium">
                        {endorsementSummary?.effectiveDate
                          ? format(new Date(endorsementSummary.effectiveDate), 'yyyy-MM-dd')
                          : 'N/A'}
                      </div>
                    </div>
                    {endorsementFees.map((fee, index) => (
                      <div
                        key={`${fee.label ?? 'endorsement-fee'}-${index}`}
                        className="p-3 border-r border-b border-gray-200"
                      >
                        <div className="text-xs text-gray-500 mb-1">
                          {fee.label || `Charge ${index + 1}`}
                        </div>
                        <div className="text-sm font-medium">
                          {formatCurrencyLocale(Number(fee.amount ?? 0), endorsementSummaryCurrency)}
                        </div>
                      </div>
                    ))}
                    <div className="p-3 border-r border-b border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">{endorsementAmountLabel}</div>
                      <div className="text-sm font-medium">
                        {endorsementAmountValue != null
                          ? formatCurrencyLocale(
                              endorsementAmountValue,
                              endorsementSummaryCurrency,
                            )
                          : 'N/A'}
                      </div>
                    </div>
                    <div className="p-3 border-b border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Created At</div>
                      <div className="text-sm font-medium">
                        {endorsementSummary?.createdAt
                          ? format(new Date(endorsementSummary.createdAt), 'yyyy-MM-dd HH:mm')
                          : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Dynamic template pages from V2 API */}
        <TemplatePages
          v2Response={v2Response}
          expandedSections={expandedSections}
          onToggle={toggleSectionExpansion}
        />

        {isInsurerPortal && (
          <div className="mb-4">
            <ProjectBreakdownWithRiskLevels
              collapsible
              totalSumInsured={
                toNumber(policyData.totalSumInsured) ?? toNumber(policyData.sumInsured)
              }
              finalPremium={toNumber(policyData.finalPremium) ?? toNumber(policyData.totalPremium)}
              projectBreakdown={policyData.projectBreakdown}
            />
          </div>
        )}


        {/* 2. Underwriting Documents (Required Documents) */}
        {requiredDocuments.length > 0 && (
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
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {requiredDocuments.map((doc) => {
                    const previewKind = canPreviewDocument(doc.contentType, doc.url);
                    const validationMessage = doc.ai_validation_result?.description_message?.trim();
                    const isValidDocument = doc.ai_validation_result?.is_valid_document;
                    return (
                      <div
                        key={doc.id}
                        className="px-4 py-3 border-b border-gray-200 last:border-b-0"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-900">
                                  {doc.originalFilename}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {previewKind && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center gap-2"
                                  onClick={() =>
                                    openDocumentPreview(doc.url, doc.originalFilename, doc.contentType)
                                  }
                                >
                                  <Eye className="h-4 w-4" />
                                  View
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2"
                                onClick={() => handleDownloadDeclarationDocument(doc)}
                              >
                                <Download className="h-4 w-4" />
                                Download
                              </Button>
                            </div>
                          </div>
                          {validationMessage ? (
                            isValidDocument ? (
                              <div className="flex w-full items-start gap-2 rounded-md border border-success/20 bg-success/5 px-3 py-2 text-xs text-success lg:text-sm">
                                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                <span>{validationMessage}</span>
                              </div>
                            ) : (
                              <div className="flex w-full items-start gap-2 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive lg:text-sm">
                                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                <span>{validationMessage}</span>
                              </div>
                            )
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* 3. Policy Issuance Documents (Declaration Documents) */}
        {declarationDocuments.length > 0 && (
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
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {declarationDocuments.map((doc) => {
                    const previewKind = canPreviewDocument(doc.contentType, doc.url);
                    const validationMessage = doc.ai_validation_result?.description_message?.trim();
                    const isValidDocument = doc.ai_validation_result?.is_valid_document;
                    return (
                      <div
                        key={doc.id}
                        className="px-4 py-3 border-b border-gray-200 last:border-b-0"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-900">
                                  {doc.originalFilename}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {previewKind && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center gap-2"
                                  onClick={() =>
                                    openDocumentPreview(doc.url, doc.originalFilename, doc.contentType)
                                  }
                                >
                                  <Eye className="h-4 w-4" />
                                  View
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2"
                                onClick={() => handleDownloadDeclarationDocument(doc)}
                              >
                                <Download className="h-4 w-4" />
                                Download
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {additionalDocuments.length > 0 && (
          <Card
            className="bg-white border border-blue-200 mb-4"
            data-section="additional_documents"
          >
            <CardHeader
              className="pb-3 cursor-pointer"
              onClick={() => toggleSectionExpansion('additional_documents')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Additional Documents
                    </CardTitle>
                    <p className="text-xs text-gray-500 mt-1">
                      Extra documents uploaded for this policy
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {expandedSections.has('additional_documents') ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </div>
            </CardHeader>
            {expandedSections.has('additional_documents') && (
              <CardContent className="pt-0">
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {additionalDocuments.map((doc) => {
                    const previewKind = canPreviewDocument(doc.contentType, doc.url);
                    const displayName = doc.documentName || doc.originalFilename;
                    return (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between px-4 py-3 border-b border-gray-200 last:border-b-0"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-900">{displayName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {previewKind && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2"
                              onClick={() =>
                                openDocumentPreview(doc.url, displayName, doc.contentType)
                              }
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                            onClick={() => handleDownloadAdditionalDocument(doc)}
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {endorsementRequiredDocuments.length > 0 && (
          <Card
            className="bg-white border border-blue-200 mb-4"
            data-section="endorsement_required_documents"
          >
            <CardHeader
              className="pb-3 cursor-pointer"
              onClick={() => toggleSectionExpansion('endorsement_required_documents')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Endorsement Documents
                    </CardTitle>
                    <p className="text-xs text-gray-500 mt-1">
                      Documents submitted in endorsement required documents
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {expandedSections.has('endorsement_required_documents') ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </div>
            </CardHeader>
            {expandedSections.has('endorsement_required_documents') && (
              <CardContent className="pt-0">
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {endorsementRequiredDocuments.map((doc) => {
                    const previewKind = canPreviewDocument(doc.contentType, doc.url);
                    return (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between px-4 py-3 border-b border-gray-200 last:border-b-0"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-900">
                            {doc.originalFilename}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {previewKind && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2"
                              onClick={() =>
                                openDocumentPreview(doc.url, doc.originalFilename, doc.contentType)
                              }
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                            onClick={() => handleDownloadDeclarationDocument(doc)}
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {endorsementAdditionalDocuments.length > 0 && (
          <Card
            className="bg-white border border-blue-200 mb-4"
            data-section="endorsement_additional_documents"
          >
            <CardHeader
              className="pb-3 cursor-pointer"
              onClick={() => toggleSectionExpansion('endorsement_additional_documents')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Endorsement Additional Documents
                    </CardTitle>
                    <p className="text-xs text-gray-500 mt-1">
                      Additional files uploaded for this endorsement
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {expandedSections.has('endorsement_additional_documents') ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </div>
            </CardHeader>
            {expandedSections.has('endorsement_additional_documents') && (
              <CardContent className="pt-0">
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {endorsementAdditionalDocuments.map((doc) => {
                    const previewKind = canPreviewDocument(doc.contentType, doc.url);
                    const displayName = doc.documentName || doc.originalFilename;
                    return (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between px-4 py-3 border-b border-gray-200 last:border-b-0"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-900">{displayName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {previewKind && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2"
                              onClick={() =>
                                openDocumentPreview(doc.url, displayName, doc.contentType)
                              }
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                            onClick={() => handleDownloadAdditionalDocument(doc)}
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        <Dialog open={!!documentPreview} onOpenChange={(open) => !open && setDocumentPreview(null)}>
          <DialogContent className="max-w-3xl h-[85vh] flex flex-col overflow-hidden">
            <DialogHeader>
              <DialogTitle>{documentPreview?.title}</DialogTitle>
            </DialogHeader>
            {documentPreview &&
              (documentPreview.kind === 'image' ? (
                <div className="w-full flex-1 flex items-center justify-center bg-muted min-h-0">
                  <img
                    src={documentPreview.url}
                    alt={documentPreview.title}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ) : documentPreview.kind === 'pdf' ? (
                <iframe
                  src={documentPreview.url}
                  className="w-full flex-1 min-h-0 border-0"
                  title="File Preview"
                />
              ) : (
                <div className="flex items-center justify-center p-8 text-muted-foreground">
                  Preview not available. Use download to open the file.
                </div>
              ))}
          </DialogContent>
        </Dialog>

        <Card className="bg-white border border-blue-200 mb-4" data-section="broker_details">
          <CardHeader
            className="pb-3 cursor-pointer"
            onClick={() => toggleSectionExpansion('broker_details')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Broker Details
                  </CardTitle>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {expandedSections.has('broker_details') ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </div>
            </div>
          </CardHeader>
          {expandedSections.has('broker_details') && (
            <CardContent className="pt-0">
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="grid lg:grid-cols-4">
                  <div className="p-3 border-r border-b border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Broker Name</div>
                    <div className="text-sm font-medium">{allData?.brokerDetails?.name}</div>
                  </div>
                  <div className="p-3 border-r border-b border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Broker Email</div>
                    <div className="text-sm font-medium">{allData?.brokerDetails?.email}</div>
                  </div>
                  <div className="p-3 border-r border-b border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Contact Number</div>
                    <div className="text-sm font-medium">
                      {allData?.brokerDetails?.contactNumber}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        <Card className="bg-white border border-blue-200 mb-4" data-section="insurer_details">
          <CardHeader
            className="pb-3 cursor-pointer"
            onClick={() => toggleSectionExpansion('insurer_details')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Insurer Details
                  </CardTitle>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {expandedSections.has('insurer_details') ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </div>
            </div>
          </CardHeader>
          {expandedSections.has('insurer_details') && (
            <CardContent className="pt-0">
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="grid lg:grid-cols-4">
                  <div className="p-3 border-r border-b border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Insurer Name</div>
                    <div className="text-sm font-medium">{allData?.insurerDetails?.name}</div>
                  </div>
                  <div className="p-3 border-r border-b border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Insurer Email</div>
                    <div className="text-sm font-medium">{allData?.insurerDetails?.email}</div>
                  </div>
                  <div className="p-3 border-r border-b border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Contact Number</div>
                    <div className="text-sm font-medium">
                      {allData?.insurerDetails?.contactNumber}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Selected Premium Details */}
        <Card className="bg-white border border-blue-200 mb-4" data-section="selected_premium">
          <CardHeader
            className="pb-3 cursor-pointer"
            onClick={() => toggleSectionExpansion('selected_premium')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Selected Premium
                  </CardTitle>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {expandedSections.has('selected_premium') ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </div>
            </div>
          </CardHeader>
          {expandedSections.has('selected_premium') && (
            <CardContent className="pt-0">
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="grid lg:grid-cols-3">
                  <div className="p-3 border-r border-b border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Base Premium</div>
                    <div className="text-sm font-medium">
                      {formatCurrency(policyData.selectedPremium?.basePremium ?? 0, displayCurrency)}
                    </div>
                  </div>
                  <div className="p-3 border-r border-b border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Total Premium</div>
                    <div className="text-sm font-medium">
                      {formatCurrency(policyData.selectedPremium?.totalPremium ?? 0, displayCurrency)}
                    </div>
                  </div>
                  <div className="p-3 border-b border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Fees</div>
                    <div className="text-sm font-medium">
                      {formatCurrency(policyData.selectedPremium?.feeAmount ?? 0, displayCurrency)}
                    </div>
                  </div>
                </div>
                {(policyData.tplConfiguration ||
                  (policyData.configurableItems && policyData.configurableItems.length > 0) ||
                  policyData.deductiblesConfiguration) && (
                  <div className="border-t border-gray-200">
                    {policyData.tplConfiguration?.selectedLimit && (
                      <div className="p-3 border-b border-gray-200 grid grid-cols-2">
                        <div className="text-xs text-gray-500">
                          Limit –{' '}
                          {policyData.tplConfiguration.selectedLimit.description ||
                            policyData.tplConfiguration.selectedLimit.code}
                        </div>
                        <div className="text-sm font-medium text-right">
                          {formatCurrency(
                            ((policyData.selectedPremium?.basePremium || 0) *
                              (policyData.tplConfiguration.selectedLimit.loading || 0)) /
                            100,
                            displayCurrency
                          )}
                        </div>
                      </div>
                    )}
                    {policyData.configurableItems &&
                      policyData.configurableItems
                        .filter((i) => i?.selected !== false)
                        .map((item, idx: number) => {
                          const isPct = String(item?.pricingType || item?.type || '')
                            .toLowerCase()
                            .includes('percent');
                          const loadingNum = Number(item?.loading ?? item?.value ?? 0);
                          const base = Number(policyData.selectedPremium?.basePremium || 0);
                          const impact = isPct ? (base * loadingNum) / 100 : loadingNum;
                          return (
                            <div
                              key={`cew_${idx}`}
                              className="p-3 border-b border-gray-200 grid grid-cols-2"
                            >
                              <div className="text-xs text-gray-500">
                                Clause – {item?.title || item?.code}
                              </div>
                              <div className="text-sm font-medium text-right">
                                {formatCurrency(impact, displayCurrency)}
                              </div>
                            </div>
                          );
                        })}
                    {policyData.deductiblesConfiguration?.selectedDeductible && (
                      <div className="p-3 grid grid-cols-2">
                        <div className="text-xs text-gray-500">
                          Deductible –{' '}
                          {policyData.deductiblesConfiguration.selectedDeductible.value}
                        </div>
                        <div className="text-sm font-medium text-right text-red-600">
                          -{formatCurrency(
                            (Number(policyData.selectedPremium?.basePremium || 0) *
                              Number(
                                policyData.deductiblesConfiguration.selectedDeductible.loading || 0,
                              )) /
                            100,
                            displayCurrency
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        {hasBrokerCommissionDetails && (
          <Card className="bg-white border border-blue-200 mb-4" data-section="broker_commission">
            <CardHeader
              className="pb-3 cursor-pointer"
              onClick={() => toggleSectionExpansion('broker_commission')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                    <CreditCard className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Broker Commission
                    </CardTitle>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {expandedSections.has('broker_commission') ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </div>
            </CardHeader>
            {expandedSections.has('broker_commission') && (
              <CardContent className="pt-0">
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="grid lg:grid-cols-2">
                    <div className="p-3 border-r border-b border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Commission Amount</div>
                      <div className="text-sm font-medium">
                        {formatCurrency(brokerCommissionAmount, displayCurrency)}
                      </div>
                    </div>
                    <div className="p-3 border-r border-b border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Commission Percentage</div>
                      <div className="text-sm font-medium">
                        {brokerCommissionPercentage != null ? `${brokerCommissionPercentage}%` : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default PolicyDetails;
