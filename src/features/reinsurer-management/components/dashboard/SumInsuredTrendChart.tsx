import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { AnalyticsOverviewResponse } from '@/features/analytics/api/analytics';

interface SumInsuredTrendChartProps {
  analyticsOverview: AnalyticsOverviewResponse | null;
  loading: boolean;
}

export function SumInsuredTrendChart({ analyticsOverview, loading }: SumInsuredTrendChartProps) {
  const chartData = useMemo(() => {
    const trend = analyticsOverview?.quote_trend;
    if (!trend?.length) return [];
    return trend.map((item) => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: item.value / 1_000_000,
    }));
  }, [analyticsOverview]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sum Insured Trend (AED M)</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[250px] w-full" />
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
            No trend data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="siGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value: number) => [`AED ${value.toFixed(1)}M`, 'Sum Insured']}
                contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#6366f1"
                fill="url(#siGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
