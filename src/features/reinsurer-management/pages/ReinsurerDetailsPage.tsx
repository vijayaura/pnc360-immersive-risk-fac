import { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle, Clock, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getReinsurancePolicyDetail } from '../api/reinsurerManagement';
import { ProductBreakdownTable } from '../components/ProductBreakdownTable';
import { TemplatePages } from '@/features/quotes/components/QuoteDetailsV2/TemplatePages';
import type { ProposalBundleResponseV2 } from '@/features/quotes/api/quotes';
import { getRenderV2, getProposalBundleV2 } from '@/features/quotes/api/quotes';
import { formatDateDDMMYYYY } from '@/shared/utils/date-format';

const t = (v: unknown) => {
  if (v === null || v === undefined) return '-';
  const s = String(v).trim();
  return s.length ? s : '-';
};

function getRecordStatusBadge(status: string) {
  const s = status.toLowerCase();
  if (s.includes('declin')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-red-50 text-red-700 border-red-200">
        <Clock className="w-3 h-3" />
        {status}
      </span>
    );
  }
  if (s.includes('bound') || s.includes('active')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-green-50 text-green-700 border-green-200">
        <CheckCircle className="w-3 h-3" />
        {status}
      </span>
    );
  }
  if (s.includes('pend') || s.includes('review')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-yellow-50 text-yellow-700 border-yellow-200">
        <Clock className="w-3 h-3" />
        {status}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-gray-100 text-gray-600 border-gray-200">
      <Clock className="w-3 h-3" />
      {status}
    </span>
  );
}

export default function ReinsurerDetailsPage() {
  const { policyId } = useParams<{ policyId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const isMarketAdmin = location.pathname.startsWith('/market-admin');
  const backPath = isMarketAdmin
    ? '/market-admin/reinsurance-dashboard'
    : '/insurer/reinsurer-management';
  const breakdownBasePath = isMarketAdmin
    ? '/market-admin/reinsurer-management/full-breakdown'
    : '/insurer/reinsurer-management/full-breakdown';

  const [showProposalDialog, setShowProposalDialog] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [proposalBundle, setProposalBundle] = useState<ProposalBundleResponseV2 | null>(null);
  const [proposalLoading, setProposalLoading] = useState(false);
  const [proposalFetched, setProposalFetched] = useState(false);

  const { data: policy, isLoading: loading, isError: error } = useQuery({
    queryKey: ['reinsurance-policy-detail', policyId],
    queryFn: () => getReinsurancePolicyDetail(policyId!),
    enabled: !!policyId,
  });

  const handleViewProposal = async () => {
    setShowProposalDialog(true);

    // Fetch real proposal data on first open
    if (!proposalFetched && (policy?.policyUuid || policy?.quoteId)) {
      setProposalLoading(true);
      try {
        const bundle = policy.policyUuid
          ? await getRenderV2(policy.policyUuid)
          : await getProposalBundleV2(policy.quoteId!);
        setProposalBundle(bundle);
        if (bundle) {
          setExpandedSections((prev) => {
            const next = new Set(prev);
            next.add('proposal_form');
            (bundle.template?.pages ?? []).forEach((page) => {
              next.add(`page_${page.id}`);
            });
            return next;
          });
        }
      } catch (err) {
        console.error('[ReinsurerDetailsPage] Failed to load proposal data:', err);
      } finally {
        setProposalLoading(false);
        setProposalFetched(true);
      }
    }
  };

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  if (!policyId) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ backgroundColor: '#f8fafc' }}
      >
        <p className="text-destructive text-sm">Missing record identifier.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ backgroundColor: '#f8fafc' }}
      >
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !policy) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4 p-6"
        style={{ backgroundColor: '#f8fafc' }}
      >
        <p className="text-slate-600 text-sm">Record not found.</p>
        <Button type="button" variant="outline" onClick={() => navigate(backPath)}>
          Back to list
        </Button>
      </div>
    );
  }

  const { referralInfo } = policy;

  const createdDateDisplay = policy.createdDateIso
    ? formatDateDDMMYYYY(policy.createdDateIso)
    : t(referralInfo.createdDate);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8fafc' }}>
      <div className="mx-auto w-full max-w-none px-4 py-6 pb-8 relative">
        {/* Single combined panel (underwriting + reinsurance context in one view) */}
        <div className="rounded-lg border border-slate-200 overflow-hidden bg-white shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3 bg-primary text-primary-foreground">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                className="gap-1 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground -ml-1"
                onClick={() => navigate(backPath)}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <span className="h-6 w-px bg-primary-foreground/30" />
              <h2 className="text-lg font-semibold leading-tight">
                Reinsurer details — {t(policy.policyOrQuoteId)}
              </h2>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="secondary"
                size="sm"
                className="gap-1.5 bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/30"
                onClick={handleViewProposal}
              >
                <FileText className="h-3.5 w-3.5" />
                View Proposal
              </Button>
              <span className="text-xs text-primary-foreground/80 uppercase tracking-wide">
                Re-insurer
              </span>
              {policy.hasReinsurance ? (
                <Badge variant="secondary" className="bg-primary-foreground text-primary border-0">
                  Yes
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="border-primary-foreground/40 text-primary-foreground bg-transparent"
                >
                  No
                </Badge>
              )}
            </div>
          </div>

          <div className="bg-muted/30 p-6 space-y-10">
            <section aria-labelledby="referral-info-heading">
              <h3
                id="referral-info-heading"
                className="text-sm font-semibold text-slate-900 mb-3"
              >
                Referral Information
              </h3>
              <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="grid grid-cols-3 divide-x divide-y divide-slate-200">
                  <div className="px-4 py-3">
                    <div className="text-xs text-muted-foreground mb-1">Customer</div>
                    <div className="text-sm font-semibold text-foreground break-words">{t(policy.customerName)}</div>
                  </div>
                  <div className="px-4 py-3">
                    <div className="text-xs text-muted-foreground mb-1">Product</div>
                    <div className="text-sm font-semibold text-foreground break-words">{t(policy.productName)}</div>
                  </div>
                  <div className="px-4 py-3">
                    <div className="text-xs text-muted-foreground mb-1">Policy / Quote Status</div>
                    <div className="text-sm">{getRecordStatusBadge(policy.status)}</div>
                  </div>
                  <div className="px-4 py-3">
                    <div className="text-xs text-muted-foreground mb-1">Source</div>
                    <div className="text-sm">
                      <Badge variant="outline">{t(referralInfo.source)}</Badge>
                    </div>
                  </div>
                  <div className="px-4 py-3">
                    <div className="text-xs text-muted-foreground mb-1">Created By</div>
                    <div className="text-sm font-semibold text-foreground break-words">{t(referralInfo.createdBy)}</div>
                  </div>
                  <div className="px-4 py-3">
                    <div className="text-xs text-muted-foreground mb-1">Created Date</div>
                    <div className="text-sm font-semibold text-foreground break-words">{createdDateDisplay}</div>
                  </div>
                </div>
              </div>
            </section>

            <section aria-labelledby="product-breakdown-heading">
              <h3
                id="product-breakdown-heading"
                className="text-sm font-semibold text-slate-900 mb-3"
              >
                Product Breakdown
              </h3>
              <ProductBreakdownTable
                productBreakdown={policy.productBreakdown}
                policyId={policy.id}
                quoteNumber={policy.policyOrQuoteId}
                customerName={policy.customerName}
                breakdownBasePath={breakdownBasePath}
                readOnly={isMarketAdmin}
              />
            </section>
          </div>
        </div>
      </div>

      {/* View Proposal Dialog */}
      <Dialog open={showProposalDialog} onOpenChange={setShowProposalDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Proposal Form</DialogTitle>
            <DialogDescription>
              Full proposal template with submitted values for {t(policy.policyOrQuoteId)}.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2">
            {proposalLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : proposalBundle ? (
              <TemplatePages
                v2Response={proposalBundle}
                expandedSections={expandedSections}
                onToggle={toggleSection}
              />
            ) : (
              <div className="text-sm text-muted-foreground">
                Proposal form data is not available for this record.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
