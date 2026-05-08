import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrencyCompact } from '@/shared/utils/lib-utils';
import type { ReinsuranceSummary } from '../../types';
import type { AnalyticsOverviewResponse } from '@/features/analytics/api/analytics';

interface PortfolioMetricsProps {
  summary: ReinsuranceSummary | null;
  summaryLoading: boolean;
  analyticsOverview: AnalyticsOverviewResponse | null;
  analyticsLoading: boolean;
}

export function PortfolioMetrics({
  summary,
  summaryLoading,
  analyticsOverview,
  analyticsLoading,
}: PortfolioMetricsProps) {
  const netPremium = (summary?.totalGrossPremium ?? 0) - (summary?.totalCommission ?? 0);

  const metrics = [
    {
      label: 'Net Premium After Commissions',
      value: formatCurrencyCompact(netPremium),
      loading: summaryLoading,
    },
    // {
    //   label: 'Claims Notified',
    //   value: String(analyticsOverview?.metrics?.total_proposals ?? 0),
    //   loading: analyticsLoading,
    // },
    // {
    //   label: 'Claims Settled',
    //   value: String(analyticsOverview?.metrics?.total_policies ?? 0),
    //   loading: analyticsLoading,
    // },
    {
      label: 'Renewal Retention Ratio',
      value: `${Math.round(analyticsOverview?.metrics?.conversion_rate ?? 0)}%`,
      loading: analyticsLoading,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {metrics.map(({ label, value, loading }) => (
        <Card key={label}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                {loading ? (
                  <Skeleton className="h-7 w-24 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{value}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
