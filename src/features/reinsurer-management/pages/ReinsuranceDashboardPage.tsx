import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';
import { fetchReinsuranceSummary } from '../api/reinsurerManagement';
import { getAnalyticsOverview } from '@/features/analytics/api/analytics';
import { listReinsurers, listReinsurerGrades, type ReinsurerGradeValue } from '@/features/reinsurers/api/reinsurers';
import { listReinsuranceBrokers } from '@/features/reinsurance-brokers/api/reinsurance-brokers';
import { getProductsList } from '@/features/product-config/api/products-list';
import { getProduct } from '@/features/product-config/api/products';
import type { ReinsuranceSummary, DashboardFilters } from '../types';
import type { AnalyticsOverviewResponse } from '@/features/analytics/api/analytics';
import { DashboardFilters as DashboardFiltersUI } from '../components/dashboard/DashboardFilters';
import { QuotesTab } from '../components/dashboard/QuotesTab';
import { PoliciesTab } from '../components/dashboard/PoliciesTab';
import { AnalyticsTab } from '../components/dashboard/AnalyticsTab';

type TabValue = 'quotes' | 'policies' | 'analytics';

const INITIAL_FILTERS: DashboardFilters = {
  search: '',
  reinsurerId: undefined,
  brokerId: undefined,
  coverType: undefined,
  location: undefined,
  dateFrom: undefined,
  dateTo: undefined,
  creditRating: undefined,
  sumInsuredBand: undefined,
};

export default function ReinsuranceDashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabValue>('quotes');
  const [filters, setFilters] = useState<DashboardFilters>(INITIAL_FILTERS);

  // Reinsurance summary (KPIs)
  const [summary, setSummary] = useState<ReinsuranceSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  // Analytics overview (SI trend, smart trend charts)
  const [analyticsOverview, setAnalyticsOverview] = useState<AnalyticsOverviewResponse | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Filter dropdown options
  const [reinsurerOptions, setReinsurerOptions] = useState<{ id: string; name: string; gradeId?: string }[]>([]);
  const [brokerOptions, setBrokerOptions] = useState<{ id: string; name: string }[]>([]);
  const [coverTypeOptions, setCoverTypeOptions] = useState<string[]>([]);
  const [gradeOptions, setGradeOptions] = useState<ReinsurerGradeValue[]>([]);
  // Map cover name → product IDs that contain that cover (for QuotesTab API filtering)
  const [coverToProductIds, setCoverToProductIds] = useState<Record<string, string[]>>({});

  // Fetch summary + filter dropdown options on mount
  useEffect(() => {
    let isMounted = true;

    fetchReinsuranceSummary()
      .then((data) => { if (isMounted) setSummary(data); })
      .catch((err) => { console.error('[ReinsuranceDashboard] Summary fetch failed:', err); })
      .finally(() => { if (isMounted) setSummaryLoading(false); });

    listReinsurers({ page: 1, limit: 100 })
      .then((res) => {
        if (isMounted) {
          setReinsurerOptions((res?.data || []).map((r) => ({ id: r.id, name: r.name, gradeId: r.gradeId })));
        }
      })
      .catch(() => {});

    listReinsuranceBrokers({ page: 1, limit: 100 })
      .then((res) => {
        if (isMounted) {
          setBrokerOptions((res?.data || []).map((b) => ({ id: b.id, name: b.name })));
        }
      })
      .catch(() => {});

    // Fetch product details to extract cover names for the covers filter dropdown
    getProductsList({ page: 1, pageSize: 100 })
      .then(async (res) => {
        if (!isMounted) return;
        const products = res.items || [];
        const details = await Promise.allSettled(
          products.map((p) => getProduct(p.id)),
        );
        if (!isMounted) return;
        const coverNames: string[] = [];
        const coverProductMap: Record<string, string[]> = {};
        details.forEach((result, idx) => {
          if (result.status === 'fulfilled') {
            const productId = products[idx].id;
            const sections = result.value.sections || [];
            sections.forEach((s) =>
              s.covers.forEach((c) => {
                coverNames.push(c.name);
                if (!coverProductMap[c.name]) coverProductMap[c.name] = [];
                if (!coverProductMap[c.name].includes(productId)) {
                  coverProductMap[c.name].push(productId);
                }
              }),
            );
          }
        });
        // Fallback: if no covers found, use product names
        if (coverNames.length > 0) {
          setCoverTypeOptions([...new Set(coverNames)].sort());
          setCoverToProductIds(coverProductMap);
        } else {
          const names = products.map((p) => p.name).filter(Boolean);
          setCoverTypeOptions([...new Set(names)].sort());
          const nameMap: Record<string, string[]> = {};
          products.forEach((p) => {
            if (p.name) {
              if (!nameMap[p.name]) nameMap[p.name] = [];
              nameMap[p.name].push(p.id);
            }
          });
          setCoverToProductIds(nameMap);
        }
      })
      .catch((err) => { console.error('[ReinsuranceDashboard] Products list fetch failed:', err); });

    // Fetch reinsurer grade options for credit rating filter
    listReinsurerGrades()
      .then((grades) => { if (isMounted) setGradeOptions(grades); })
      .catch((err) => { console.error('[ReinsuranceDashboard] Grades fetch failed:', err); });

    return () => { isMounted = false; };
  }, []);

  // Fetch analytics overview (still needed for SI trend + smart trend charts)
  useEffect(() => {
    let isMounted = true;

    const params: { productIds?: string } | undefined =
      filters.coverType && coverToProductIds[filters.coverType]
        ? { productIds: coverToProductIds[filters.coverType].join(',') }
        : undefined;

    setAnalyticsLoading(true);

    getAnalyticsOverview(params)
      .then((result) => {
        if (isMounted) setAnalyticsOverview(result);
      })
      .catch((err) => {
        console.error('[ReinsuranceDashboard] Analytics overview fetch failed:', err);
      })
      .finally(() => {
        if (isMounted) setAnalyticsLoading(false);
      });

    return () => { isMounted = false; };
  }, [filters.coverType, coverToProductIds]);

  const handleFilterChange = useCallback(
    (key: keyof DashboardFilters, value: string | undefined) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleClearFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex flex-col">
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => navigate('/market-admin/reinsurance-management')}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Reinsurance Dashboard</h1>
              <p className="text-sm text-muted-foreground">All reinsurers dashboard</p>
            </div>
          </div>

          {/* Filters */}
          <DashboardFiltersUI
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            reinsurers={reinsurerOptions}
            brokers={brokerOptions}
            coverTypeOptions={coverTypeOptions}
            gradeOptions={gradeOptions}
          />

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as TabValue)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 h-11 rounded-lg border">
              <TabsTrigger
                value="quotes"
                className="text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md"
              >
                Quotes
              </TabsTrigger>
              <TabsTrigger
                value="policies"
                className="text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md"
              >
                Policies
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md"
              >
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="quotes" className="mt-4">
              <QuotesTab
                filters={filters}
                reinsurerOptions={reinsurerOptions}
                brokerOptions={brokerOptions}
                coverToProductIds={coverToProductIds}
                gradeOptions={gradeOptions}
              />
            </TabsContent>

            <TabsContent value="policies" className="mt-4">
              <PoliciesTab
                filters={filters}
                reinsurerOptions={reinsurerOptions}
                brokerOptions={brokerOptions}
                gradeOptions={gradeOptions}
              />
            </TabsContent>

            <TabsContent value="analytics" className="mt-4">
              <AnalyticsTab
                filters={filters}
                summary={summary}
                summaryLoading={summaryLoading}
                analyticsOverview={analyticsOverview}
                analyticsLoading={analyticsLoading}
                reinsurerOptions={reinsurerOptions}
                gradeOptions={gradeOptions}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
