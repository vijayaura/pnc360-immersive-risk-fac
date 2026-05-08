import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrencyCompact } from '@/shared/utils/lib-utils';
import type { ReinsuranceSummary } from '../../types';

export type AnalyticsKpiScope = 'all' | 'quotes' | 'policies';

interface KpiCardsProps {
  summary: ReinsuranceSummary | null;
  summaryLoading: boolean;
  /** Which analytics lens is selected (same KPI source; labels emphasize the lens). */
  analyticsScope?: AnalyticsKpiScope;
}

export function KpiCards({ summary, summaryLoading, analyticsScope = 'all' }: KpiCardsProps) {
  const quoteDesc =
    analyticsScope === 'policies'
      ? 'Quote-stage allocations with triggered reinsurance (for conversion context).'
      : 'Total quoted / quote-stage cases with triggered reinsurance.';

  const allKpis = [
    {
      label: 'Total Quotes Ceded',
      value: summary?.totalQuotes ?? 0,
      isCurrency: false,
      loading: summaryLoading,
      description: quoteDesc,
      scopes: ['all', 'quotes'] as AnalyticsKpiScope[],
    },
    {
      label: 'Total Policies Ceded',
      value: summary?.totalPolicies,
      isCurrency: false,
      loading: summaryLoading,
      description: 'Total issued policy cases with triggered reinsurance.',
      scopes: ['all', 'policies'] as AnalyticsKpiScope[],
    },
    {
      label: 'Total GWP Ceded',
      value: summary?.totalCession,
      isCurrency: true,
      loading: summaryLoading,
      description: 'Total gross written premium ceded.',
      scopes: ['all', 'quotes', 'policies'] as AnalyticsKpiScope[],
    },
  ];

  const kpis = allKpis.filter((kpi) => kpi.scopes.includes(analyticsScope));
  const gridCols = kpis.length >= 4 ? 'xl:grid-cols-4' : 'xl:grid-cols-3';

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridCols} gap-4`}>
      {kpis.map(({ label, value, isCurrency, loading, description }) => (
        <Card key={label}>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-sm font-medium text-muted-foreground">{label}</p>
            </div>
            {loading ? (
              <Skeleton className="h-8 w-24 mb-2" />
            ) : (
              <p className="text-3xl font-bold text-foreground mb-2">
                {isCurrency ? formatCurrencyCompact(value ?? 0) : (value ?? 0)}
              </p>
            )}
            <p className="text-xs text-muted-foreground">{description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
