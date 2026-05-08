import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { CoverAggregation } from '../../utils/reinsuranceDashboardAnalytics';

interface CoverExposureChartProps {
  coverAnalytics: CoverAggregation[];
  loading: boolean;
}

export function CoverExposureChart({ coverAnalytics, loading }: CoverExposureChartProps) {
  const chartData = useMemo(() => {
    if (!coverAnalytics.length) return [];
    return coverAnalytics.map((c) => ({
      name: c.coverName.length > 15 ? c.coverName.slice(0, 15) + '...' : c.coverName,
      value: c.sumInsured / 1_000_000,
      fullName: c.coverName,
    }));
  }, [coverAnalytics]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">Cover Exposure — Sum Insured (AED M)</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[250px] w-full" />
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
            No exposure data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value: number) => [`AED ${value.toFixed(1)}M`, 'Sum Insured']}
                labelFormatter={(label: string) => {
                  const match = chartData.find((d) => d.name === label);
                  return match?.fullName ?? label;
                }}
                contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
              />
              <Bar dataKey="value" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
