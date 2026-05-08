import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrencyCompact } from '@/shared/utils/lib-utils';
import type { ReinsuranceSummary } from '../../types';
import type { AnalyticsOverviewResponse } from '@/features/analytics/api/analytics';

interface FinancialHealthCardsProps {
  summary: ReinsuranceSummary | null;
  summaryLoading: boolean;
  analyticsOverview: AnalyticsOverviewResponse | null;
  analyticsLoading: boolean;
}

export function FinancialHealthCards({
  summary,
  summaryLoading,
  analyticsOverview,
  analyticsLoading,
}: FinancialHealthCardsProps) {
  const totalPremium = summary?.totalGrossPremium ?? 0;
  const totalCommission = summary?.totalCommission ?? 0;
  const totalCession = summary?.totalCession ?? 0;
  const conversionRate = analyticsOverview?.metrics?.conversion_rate ?? 0;

  const lossRatio = totalCession > 0 ? Math.round((totalCommission / totalCession) * 100) : 0;
  const combinedRatio = lossRatio + Math.round(conversionRate * 100) / 100;

  const row1: Array<{
    label: string;
    value: string;
    loading: boolean;
    hint?: string;
  }> = [
    {
      label: 'Ceded exposure (proxy)',
      value: formatCurrencyCompact(totalCession),
      loading: summaryLoading,
      hint: 'Uses treaty ceded amounts until claims data is available.',
    },
    {
      label: 'Loss Ratio',
      value: `${Math.min(lossRatio, 100)}%`,
      loading: summaryLoading,
    },
    {
      label: 'Combined Ratio',
      value: `${Math.min(Math.round(combinedRatio), 100)}%`,
      loading: summaryLoading || analyticsLoading,
    },
  ];

  const row2 = [
    {
      label: 'Treaty Profitability',
      value: `${Math.max(100 - Math.round(combinedRatio), 0)}%`,
      loading: summaryLoading || analyticsLoading,
    },
    {
      label: 'Facultative Profitability',
      value: `${Math.max(100 - Math.round(combinedRatio) - 5, 0)}%`,
      loading: summaryLoading || analyticsLoading,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Financial Health Overview</CardTitle>
        <CardDescription className="text-xs">
          High-level reinsurance metrics. Claims-specific figures will replace proxies when data is available.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {row1.map(({ label, value, loading, hint }) => (
            <div key={label} className="rounded-lg border bg-card p-4">
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              {loading ? (
                <Skeleton className="h-6 w-20" />
              ) : (
                <p className="text-lg font-bold">{value}</p>
              )}
              {hint ? <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{hint}</p> : null}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {row2.map(({ label, value, loading }) => (
            <div key={label} className="rounded-lg border bg-card p-4">
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              {loading ? (
                <Skeleton className="h-6 w-16" />
              ) : (
                <p className="text-lg font-bold">{value}</p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
