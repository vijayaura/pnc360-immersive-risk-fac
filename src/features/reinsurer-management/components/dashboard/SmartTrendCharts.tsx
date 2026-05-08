import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { AnalyticsOverviewResponse } from '@/features/analytics/api/analytics';
import { CLAIMS_RATIO_TREND, RENEWAL_PERF_TREND } from '../../utils/dashboardDummyData';

interface SmartTrendChartsProps {
  analyticsOverview: AnalyticsOverviewResponse | null;
  loading: boolean;
}

export function SmartTrendCharts({ analyticsOverview, loading }: SmartTrendChartsProps) {
  // Conversion trend data
  const premiumCededData = useMemo(() => {
    const trend = analyticsOverview?.conversion_trend;
    if (!trend?.length) return [];
    return trend.map((item) => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: item.value / 1000,
    }));
  }, [analyticsOverview]);

  // Proposal volume from proposal_trend data
  const capacityData = useMemo(() => {
    const trend = analyticsOverview?.proposal_trend;
    if (!trend?.length) return [];
    return trend.map((item) => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: Math.min(item.value, 100),
    }));
  }, [analyticsOverview]);

  const chartHeight = 180;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Conversion Trend — real data */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Conversion Trend (K)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[180px] w-full" />
          ) : premiumCededData.length === 0 ? (
            <div className="flex items-center justify-center h-[180px] text-muted-foreground text-xs">
              No data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={chartHeight}>
              <AreaChart data={premiumCededData}>
                <defs>
                  <linearGradient id="pcGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '11px' }} />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="url(#pcGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Claims Ratio Trend — requires claims data */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Claims Ratio Trend (%)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[180px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart data={CLAIMS_RATIO_TREND}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '11px' }} />
                <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Proposal Volume Trend — real data */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Proposal Volume Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[180px] w-full" />
          ) : capacityData.length === 0 ? (
            <div className="flex items-center justify-center h-[180px] text-muted-foreground text-xs">
              No data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={chartHeight}>
              <AreaChart data={capacityData}>
                <defs>
                  <linearGradient id="cuGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '11px' }} />
                <Area type="monotone" dataKey="value" stroke="#8b5cf6" fill="url(#cuGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Renewal Performance Trend — requires renewal data */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Renewal Performance Trend (%)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[180px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={chartHeight}>
              <LineChart data={RENEWAL_PERF_TREND}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '11px' }} />
                <Line type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} dot={{ r: 4, fill: '#22c55e' }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
