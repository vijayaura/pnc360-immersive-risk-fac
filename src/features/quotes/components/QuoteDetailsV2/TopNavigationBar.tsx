import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Download, Loader2 } from 'lucide-react';
import { getHumanReadableStatus } from '@/features/quotes/utils/QuoteDetailsV2/formatters';
import type { ProposalBundleResponse } from '@/features/quotes/api/quotes';
import { useNavigate } from 'react-router-dom';

interface TopNavigationBarProps {
  bundle: ProposalBundleResponse;
  onDownloadProposal: () => void;
  onDownloadQuote: () => void;
  downloadingProposal: boolean;
  downloadingQuote: boolean;
  showContinueEditing?: boolean;
  quoteId?: string;
  productName?: string;
}

export function TopNavigationBar({
  bundle,
  onDownloadProposal,
  onDownloadQuote,
  downloadingProposal,
  downloadingQuote,
  showContinueEditing = false,
  quoteId,
  productName,
}: TopNavigationBarProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Quote Details -{' '}
                {bundle.quote_meta?.quote_reference_number ||
                  bundle.quote_meta?.quote_id ||
                  'Unknown'}
              </h1>
              <p className="text-sm text-gray-600">
                {bundle.insured?.details?.insured_name ||
                  bundle.project?.client_name ||
                  'Insurance Quote'}
              </p>
              {/* {productName && (
                <div className="mt-1 inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                  Product: {productName}
                </div>
              )} */}
            </div>
            <div className="px-4 py-2 bg-primary text-white rounded-lg font-medium text-sm">
              {getHumanReadableStatus(bundle.quote_meta?.status || '')}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {showContinueEditing && quoteId && (
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => navigate(`/customer/proposal?resume=${quoteId}`)}
            >
              <Edit className="h-4 w-4" />
              Continue Editing
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={onDownloadProposal}
            disabled={downloadingProposal || downloadingQuote}
          >
            {downloadingProposal ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {downloadingProposal ? 'Downloading...' : 'Download Proposal'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={onDownloadQuote}
            disabled={downloadingProposal || downloadingQuote}
          >
            {downloadingQuote ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {downloadingQuote ? 'Generating...' : 'Download Quote'}
          </Button>
        </div>
      </div>
    </div>
  );
}
