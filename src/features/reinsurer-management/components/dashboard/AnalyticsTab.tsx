import { useEffect, useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ReinsuranceSummary, DashboardFilters, ReinsurerPolicyRecord } from '../../types';
import type { AnalyticsOverviewResponse } from '@/features/analytics/api/analytics';
import {
  fetchAllReinsurancePoliciesPages,
  getReinsurancePolicyDetail,
} from '../../api/reinsurerManagement';
import { aggregateReinsuranceData, computeSummaryFromRecords, type CoverAggregation, type AnalyticsScope } from '../../utils/reinsuranceDashboardAnalytics';
import { applyDashboardFilters, hasClientSideFilters } from '../../utils/filterReinsuranceRecords';
import { KpiCards, type AnalyticsKpiScope } from './KpiCards';
import { RiskAccumulationSection } from './RiskAccumulationSection';
import { PortfolioMetrics } from './PortfolioMetrics';
import { ActiveCoversMixChart } from './ActiveCoversMixChart';
import { CoverExposureChart } from './CoverExposureChart';
import { SumInsuredTrendChart } from './SumInsuredTrendChart';
import { FinancialHealthCards } from './FinancialHealthCards';
import { SmartTrendCharts } from './SmartTrendCharts';

interface AnalyticsTabProps {
  filters: DashboardFilters;
  summary: ReinsuranceSummary | null;
  summaryLoading: boolean;
  analyticsOverview: AnalyticsOverviewResponse | null;
  analyticsLoading: boolean;
  reinsurerOptions?: { id: string; name: string; gradeId?: string }[];
  gradeOptions?: { id: string; valueLabel: string }[];
}

export function AnalyticsTab({
  filters,
  summary,
  summaryLoading,
  analyticsOverview,
  analyticsLoading,
  reinsurerOptions = [],
}: AnalyticsTabProps) {
  const [portfolioLens, setPortfolioLens] = useState<AnalyticsKpiScope>('all');

  // Own data fetching: reinsurance allocation records for chart aggregation
  const [allRecords, setAllRecords] = useState<ReinsurerPolicyRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [detailCache, setDetailCache] = useState<Record<string, ReinsurerPolicyRecord>>({});
  const [enriching, setEnriching] = useState(false);

  // Build lookup: reinsurerId → gradeId (for credit rating filter)
  const gradeIdByReinsurer = useMemo(() => {
    const map = new Map<string, string | undefined>();
    for (const r of reinsurerOptions) {
      map.set(r.id, r.gradeId);
    }
    return map;
  }, [reinsurerOptions]);

  // Fetch all reinsurance records — re-runs when API-level filters change
  useEffect(() => {
    let isMounted = true;
    setRecordsLoading(true);

    fetchAllReinsurancePoliciesPages({
      search: filters.search || undefined,
      reinsurerId: filters.reinsurerId,
      brokerId: filters.brokerId,
      includePrePolicy: 'true',
    })
      .then((rows) => {
        if (isMounted) setAllRecords(rows);
      })
      .catch((err) => {
        console.error('[AnalyticsTab] Failed to fetch records:', err);
        if (isMounted) setAllRecords([]);
      })
      .finally(() => {
        if (isMounted) setRecordsLoading(false);
      });

    return () => { isMounted = false; };
  }, [filters.search, filters.reinsurerId, filters.brokerId]);

  // Enrich all records with detail data (productBreakdown, totals)
  useEffect(() => {
    let isMounted = true;
    if (allRecords.length === 0) {
      setDetailCache({});
      return;
    }

    const idsToFetch = allRecords
      .filter((r) => !detailCache[r.id] && r.productBreakdown.length === 0)
      .map((r) => r.id);

    if (idsToFetch.length === 0) return;

    setEnriching(true);
    Promise.allSettled(idsToFetch.map((id) => getReinsurancePolicyDetail(id)))
      .then((results) => {
        if (!isMounted) return;
        setDetailCache((prev) => {
          const next = { ...prev };
          results.forEach((res, idx) => {
            if (res.status === 'fulfilled') next[idsToFetch[idx]] = res.value;
          });
          return next;
        });
      })
      .finally(() => {
        if (isMounted) setEnriching(false);
      });

    return () => { isMounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allRecords.map((r) => r.id).join(',')]);

  // Merge detail-enriched data into records, preserving list record's createdDateIso
  const enrichedRecords = useMemo(
    () => allRecords.map((r) => {
      const detail = detailCache[r.id];
      if (!detail) return r;
      return { ...r, ...detail, createdDateIso: detail.createdDateIso || r.createdDateIso };
    }),
    [allRecords, detailCache],
  );

  const filteredRecords = useMemo(
    () => applyDashboardFilters(enrichedRecords, filters, gradeIdByReinsurer),
    [enrichedRecords, filters, gradeIdByReinsurer],
  );

  // Aggregate into chart data (scoped to selected reinsurer's share and portfolio lens)
  const aggregates = useMemo(
    () => aggregateReinsuranceData(filteredRecords, filters.reinsurerId, portfolioLens),
    [filteredRecords, filters.reinsurerId, portfolioLens],
  );
  const coverAggregations = aggregates.byCover;

  // When a reinsurer is selected or sub-tab is active, compute a proportional summary
  const computedSummary = useMemo(() => {
    if (!filters.reinsurerId && !hasClientSideFilters(filters) && portfolioLens === 'all') return null;
    return computeSummaryFromRecords(filteredRecords, filters.reinsurerId, portfolioLens);
  }, [filteredRecords, filters, portfolioLens]);

  // Use computed summary when reinsurer filter is active, otherwise use API summary
  const effectiveSummary = computedSummary ?? summary;
  const effectiveSummaryLoading = (filters.reinsurerId || hasClientSideFilters(filters) || portfolioLens !== 'all')
    ? (recordsLoading || enriching)
    : summaryLoading;

  const coverLoading = recordsLoading || enriching;

  return (
    <div className="space-y-6">
      <Tabs
        value={portfolioLens}
        onValueChange={(v) => setPortfolioLens(v as AnalyticsKpiScope)}
        className="w-full"
      >
        <TabsList className="grid w-full max-w-md grid-cols-3 bg-muted/50 p-1 h-9 rounded-lg border">
          <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
          <TabsTrigger value="quotes" className="text-xs">Quotes</TabsTrigger>
          <TabsTrigger value="policies" className="text-xs">Policies</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4 space-y-6">
          <KpiCards summary={effectiveSummary} summaryLoading={effectiveSummaryLoading} analyticsScope="all" />
          <AnalyticsBody
            summary={effectiveSummary}
            summaryLoading={effectiveSummaryLoading}
            analyticsOverview={analyticsOverview}
            analyticsLoading={analyticsLoading}
            coverAggregations={coverAggregations}
            coverLoading={coverLoading}
          />
        </TabsContent>

        <TabsContent value="quotes" className="mt-4 space-y-6">
          <KpiCards summary={effectiveSummary} summaryLoading={effectiveSummaryLoading} analyticsScope="quotes" />
          <AnalyticsBody
            summary={effectiveSummary}
            summaryLoading={effectiveSummaryLoading}
            analyticsOverview={analyticsOverview}
            analyticsLoading={analyticsLoading}
            coverAggregations={coverAggregations}
            coverLoading={coverLoading}
          />
        </TabsContent>

        <TabsContent value="policies" className="mt-4 space-y-6">
          <KpiCards summary={effectiveSummary} summaryLoading={effectiveSummaryLoading} analyticsScope="policies" />
          <AnalyticsBody
            summary={effectiveSummary}
            summaryLoading={effectiveSummaryLoading}
            analyticsOverview={analyticsOverview}
            analyticsLoading={analyticsLoading}
            coverAggregations={coverAggregations}
            coverLoading={coverLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface AnalyticsBodyProps {
  summary: ReinsuranceSummary | null;
  summaryLoading: boolean;
  analyticsOverview: AnalyticsOverviewResponse | null;
  analyticsLoading: boolean;
  coverAggregations: CoverAggregation[];
  coverLoading: boolean;
}

function AnalyticsBody({
  summary,
  summaryLoading,
  analyticsOverview,
  analyticsLoading,
  coverAggregations,
  coverLoading,
}: AnalyticsBodyProps) {
  return (
    <>
      <RiskAccumulationSection summary={summary} />

      <PortfolioMetrics
        summary={summary}
        summaryLoading={summaryLoading}
        analyticsOverview={analyticsOverview}
        analyticsLoading={analyticsLoading}
      />

      <ActiveCoversMixChart coverAnalytics={coverAggregations} loading={coverLoading} />

      <CoverExposureChart coverAnalytics={coverAggregations} loading={coverLoading} />

      <SumInsuredTrendChart analyticsOverview={analyticsOverview} loading={analyticsLoading} />

      <FinancialHealthCards
        summary={summary}
        summaryLoading={summaryLoading}
        analyticsOverview={analyticsOverview}
        analyticsLoading={analyticsLoading}
      />

      <SmartTrendCharts analyticsOverview={analyticsOverview} loading={analyticsLoading} />
    </>
  );
}
