import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, ChevronDown, ChevronUp } from "lucide-react";
import { getHumanReadableStatus } from "../../utils/QuoteDetailsV2/formatters";
import type { ProposalBundleResponse } from '@/features/quotes/api/quotes';
import { formatDateYYYYMMDD } from "@/shared/utils/date-format";

interface QuoteSummaryProps {
  bundle: ProposalBundleResponse;
  isExpanded: boolean;
  onToggle: () => void;
}

export function QuoteSummary({ bundle, isExpanded, onToggle }: QuoteSummaryProps) {
  if (!bundle.quote_meta) return null;

  return (
    <Card className="bg-white border border-blue-200 mb-4" data-section="quote_summary">
      <CardHeader 
        className="pb-3 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Quote Summary
              </CardTitle>
              <div className="text-xs text-gray-400 mt-1">
                {bundle.quote_meta.created_at ? 
                  formatDateYYYYMMDD(bundle.quote_meta.created_at) : 'No date available'
                }
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-gray-400">Quote Reference</div>
              <div className="text-sm text-gray-600 font-medium">
                {bundle.quote_meta.quote_reference_number || bundle.quote_meta.quote_id}
              </div>
            </div>
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="grid lg:grid-cols-4">
              <div className="p-3 border-r border-b border-gray-200">
                <div className="text-xs text-gray-500 mb-1">Quote Reference</div>
                <div className="text-sm font-medium">{bundle.quote_meta.quote_reference_number || bundle.quote_meta.quote_id}</div>
              </div>
              <div className="p-3 border-r border-b border-gray-200">
                <div className="text-xs text-gray-500 mb-1">Status</div>
                <div className="text-sm font-medium">
                  <Badge variant="outline">{getHumanReadableStatus(bundle.quote_meta.status || '')}</Badge>
                </div>
              </div>
              <div className="p-3 border-r border-b border-gray-200">
                <div className="text-xs text-gray-500 mb-1">Created Date</div>
                <div className="text-sm font-medium">
                  {bundle.quote_meta.created_at ? 
                    formatDateYYYYMMDD(bundle.quote_meta.created_at) : 'Not available'
                  }
                </div>
              </div>
              <div className="p-3 border-b border-gray-200">
                <div className="text-xs text-gray-500 mb-1">Validity Date</div>
                <div className="text-sm font-medium">
                  {bundle.quote_meta.validity_date ? 
                    formatDateYYYYMMDD(bundle.quote_meta.validity_date) : 'Not set'
                  }
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
