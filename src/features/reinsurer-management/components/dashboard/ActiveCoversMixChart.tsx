import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { CoverAggregation } from '../../utils/reinsuranceDashboardAnalytics';
import { formatCurrencyCompact } from '@/shared/utils/lib-utils';

const COLORS = [
  '#6366f1', // indigo
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#f97316', // orange
  '#ec4899', // pink
  '#14b8a6', // teal
];

interface ActiveCoversMixChartProps {
  coverAnalytics: CoverAggregation[];
  loading: boolean;
}

export function ActiveCoversMixChart({ coverAnalytics, loading }: ActiveCoversMixChartProps) {
  const chartData = useMemo(() => {
    if (!coverAnalytics.length) return [];
    return coverAnalytics.map((c) => ({
      name: c.coverName,
      value: c.sumInsured,
    }));
  }, [coverAnalytics]);

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Active Covers Mix</CardTitle>
        <CardDescription>Distribution of active covers by sum insured.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-[280px]">
            <Skeleton className="h-[220px] w-[220px] rounded-full" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
            No cover data available
          </div>
        ) : (
          <div className="flex items-start gap-6">
            <div className="w-1/2 h-[300px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={130}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [
                      formatCurrencyCompact(value),
                      'Sum Insured',
                    ]}
                    contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex-1 min-w-0 max-h-[260px] overflow-y-auto space-y-2">
              {chartData.map((item, index) => {
                const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
                return (
                  <div
                    key={item.name}
                    className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm text-muted-foreground truncate">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-bold">{formatCurrencyCompact(item.value)}</span>
                      <span className="text-xs text-muted-foreground">({percentage}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
