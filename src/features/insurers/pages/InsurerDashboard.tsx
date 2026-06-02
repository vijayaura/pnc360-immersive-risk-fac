import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Banknote,
  ChevronDown,
  FileText,
  MessageSquare,
  Search,
  Send,
  Shield,
  ShieldCheck,
  TrendingUp,
  X,
} from 'lucide-react';
import { useInsurerDashboardStore, type TabValue } from '@/shared/stores/useInsurerDashboardStore';
import RiskAccumulationDashboard from '@/features/market-admin/pages/RiskAccumulationDashboard';
import {
  getDashboardStatistics,
  type DashboardStatistics,
} from '@/features/market-admin/api/admin';
import { formatCurrencyCompactMillions, formatNumberCompactMillions } from '@/shared/utils/lib-utils';
import QuotesTab from '@/features/insurers/components/InsurerDashboard/QuotesTab';
import ReferralsTab from '@/features/insurers/components/InsurerDashboard/ReferralsTab';
import PoliciesTab from '@/features/insurers/components/InsurerDashboard/PoliciesTab';
import EndorsementsTab from '@/features/insurers/components/InsurerDashboard/EndorsementsTab';
import FacInCasesTab from '@/features/insurers/components/InsurerDashboard/FacInCasesTab';
import { getProducts, type Product } from '@/features/product-config/api/products';
import {
  listMasterCountries,
  listMasterRegions,
  listMasterZones,
} from '@/features/product-config/masters/api/masters';
import { MarketAdminHeatMap } from '@/features/market-admin/components/MarketAdminHeatMap';
import { buildHeatmapLocations } from '@/features/market-admin/utils/buildHeatmapLocations';
import {
  heatmapLocationsWithFallback,
  resolveSumInsuredForDisplay,
} from '@/features/market-admin/constants/dashboardDemoFallbacks';

const ITEMS_PER_PAGE = 5;

const getUnreadBadgeCount = (count?: number) => {
  if (!count || count <= 0) return null;

  return (
    <Badge className="h-5 min-w-5 justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white hover:bg-red-500">
      {count > 99 ? '99+' : count}
    </Badge>
  );
};

const getUnreadMessageIndicator = (count?: number) => {
  if (!count || count <= 0) return null;

  return (
    <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center text-blue-700">
      <MessageSquare className="h-4 w-4" />
      <span className="absolute -right-2 -top-2 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
        {count > 99 ? '99+' : count}
      </span>
    </span>
  );
};

const InsurerDashboard = () => {
  const [dashboardStats, setDashboardStats] = useState<DashboardStatistics | null>(null);
  const [dashboardProducts, setDashboardProducts] = useState<Product[]>([]);
  const [masterCountries, setMasterCountries] = useState<
    Array<{ id: string; label: string; code?: string }>
  >([]);
  const [masterRegions, setMasterRegions] = useState<
    Array<{ id: string; label: string; countryId: string }>
  >([]);
  const [masterZones, setMasterZones] = useState<
    Array<{ id: string; label: string; regionId: string }>
  >([]);
  const [productSearchQuery, setProductSearchQuery] = useState('');

  const {
    activeTab,
    setActiveTab,
    selectedProducts,
    setSelectedProducts,
  } = useInsurerDashboardStore();

  const [isRiskAccumulationOpen, setIsRiskAccumulationOpen] = useState(false);

  const closeRiskAccumulation = useCallback(() => setIsRiskAccumulationOpen(false), []);

  const tabsListRef = useRef<HTMLDivElement>(null);
  const unreadReferralCount = dashboardStats?.data?.unreadReferralMessageCount ?? 0;
  const unreadEndorsementCount = dashboardStats?.data?.unreadEndorsementMessageCount ?? 0;

  // Reset tab to first tab (quotes) when dashboard mounts
  useEffect(() => {
    setActiveTab('quotes');
  }, [setActiveTab]);

  useEffect(() => {
    (async () => {
      try {
        const stats = await getDashboardStatistics(
          selectedProducts.length > 0 ? { productId: selectedProducts } : undefined,
        );
        setDashboardStats(stats);
      } catch (e) {
        console.error('❌ Failed to fetch insurer dashboard statistics:', e);
      }
    })();
  }, [selectedProducts]);

  useEffect(() => {
    (async () => {
      const results = await Promise.allSettled([
        getProducts(),
        listMasterCountries(),
        listMasterRegions(),
        listMasterZones(),
      ]);

      const [productsRes, countriesRes, regionsRes, zonesRes] = results;

      if (productsRes.status === 'fulfilled') {
        setDashboardProducts((productsRes.value.items ?? []) as Product[]);
      } else {
        console.error('Failed to fetch insurer dashboard products:', productsRes.reason);
      }

      if (countriesRes.status === 'fulfilled') {
        setMasterCountries(
          countriesRes.value.map((country) => ({
            id: String(country.id),
            label: country.label,
            code: country.code,
          })),
        );
      } else {
        console.error('Failed to fetch countries (heat map filters):', countriesRes.reason);
      }

      if (regionsRes.status === 'fulfilled') {
        setMasterRegions(
          regionsRes.value.map((region) => ({
            id: String(region.id),
            label: region.label,
            countryId: String(region.countryId),
          })),
        );
      } else {
        console.error('Failed to fetch regions (heat map filters):', regionsRes.reason);
      }

      if (zonesRes.status === 'fulfilled') {
        setMasterZones(
          zonesRes.value.map((zone) => ({
            id: String(zone.id),
            label: zone.label,
            regionId: String(zone.regionId),
          })),
        );
      } else {
        console.error('Failed to fetch zones (heat map filters):', zonesRes.reason);
      }
    })();
  }, []);

  useEffect(() => {
    if (selectedProducts.length === 0) return;

    const availableProductIds = new Set(dashboardProducts.map((product) => String(product.id)));
    const validSelectedProducts = selectedProducts.filter((productId) => availableProductIds.has(productId));

    if (validSelectedProducts.length !== selectedProducts.length) {
      setSelectedProducts(validSelectedProducts);
    }
  }, [dashboardProducts, selectedProducts, setSelectedProducts]);

  const selectedDashboardProducts = useMemo(
    () => dashboardProducts.filter((product) => selectedProducts.includes(String(product.id))),
    [dashboardProducts, selectedProducts],
  );

  const heatmapSelectedProductIds = useMemo(() => {
    return selectedProducts;
  }, [selectedProducts]);

  const heatmapProductLabel = useMemo(() => {
    if (selectedProducts.length === 0) return 'all products';
    if (selectedProducts.length === 1) return selectedDashboardProducts[0]?.name || 'the selected product';
    return `${selectedProducts.length} selected products`;
  }, [selectedDashboardProducts, selectedProducts]);

  const filteredProductsList = useMemo(() => {
    if (!productSearchQuery.trim()) return dashboardProducts;
    const query = productSearchQuery.toLowerCase();
    return dashboardProducts.filter((product) => product.name?.toLowerCase().includes(query));
  }, [dashboardProducts, productSearchQuery]);

  const heatmapLocations = useMemo(() => {
    const built = buildHeatmapLocations(
      dashboardProducts,
      heatmapSelectedProductIds,
      dashboardStats?.data?.totalQuotes ?? 0,
      dashboardStats?.data?.totalPolicies ?? 0,
      masterCountries,
      masterRegions,
      masterZones,
    );
    return heatmapLocationsWithFallback(built);
  }, [
    dashboardProducts,
    dashboardStats?.data?.totalPolicies,
    dashboardStats?.data?.totalQuotes,
    heatmapSelectedProductIds,
    masterCountries,
    masterRegions,
    masterZones,
  ]);

  const sumInsuredCardDisplay = useMemo(
    () => resolveSumInsuredForDisplay(dashboardStats?.data),
    [dashboardStats?.data],
  );

  // Auto-scroll active tab into view
  useEffect(() => {
    if (activeTab && tabsListRef.current) {
      const activeElement = tabsListRef.current.querySelector(`[data-state="active"]`);
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background p-6 cityscape-bg">
      <div className="w-full px-4 space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-auto max-w-full p-0 border-0 bg-transparent hover:bg-transparent focus:ring-0 focus:ring-offset-0"
                  >
                    <div className="flex max-w-full items-center gap-2">
                      <h1
                        className="max-w-[min(78vw,40rem)] truncate text-4xl font-bold text-foreground text-left"
                        title={
                          selectedProducts.length === 0
                            ? 'All Products Dashboard'
                            : selectedProducts.length === 1
                              ? `${selectedDashboardProducts[0]?.name || selectedProducts[0]} Dashboard`
                              : 'Selected Products Dashboard'
                        }
                      >
                        {selectedProducts.length === 0
                          ? 'All Products Dashboard'
                          : selectedProducts.length === 1
                            ? `${selectedDashboardProducts[0]?.name || selectedProducts[0]} Dashboard`
                            : 'Selected Products Dashboard'}
                      </h1>
                      <ChevronDown className="w-5 h-5 text-muted-foreground fill-current" />
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[300px] p-0 bg-card border border-border shadow-large"
                  align="start"
                >
                  <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <h4 className="font-semibold text-foreground">Select Products</h4>
                      <div className="flex gap-2">
                        {filteredProductsList.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const allFilteredIds = filteredProductsList.map((product) => String(product.id));
                              setSelectedProducts(Array.from(new Set([...selectedProducts, ...allFilteredIds])));
                            }}
                            className="h-8 px-2 text-xs text-primary hover:text-primary/80"
                          >
                            Select All
                          </Button>
                        )}
                        {selectedProducts.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedProducts([])}
                          className="h-8 px-2 text-xs text-destructive hover:text-destructive/80"
                        >
                          Clear
                        </Button>
                        )}
                      </div>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                      <Input
                        placeholder="Filter products..."
                        className="h-8 pl-8 text-xs"
                        value={productSearchQuery}
                        onChange={(e) => setProductSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                      <div
                        className="flex items-center space-x-2 p-1 hover:bg-muted/50 rounded-md transition-colors cursor-pointer"
                        onClick={() => setSelectedProducts([])}
                      >
                        <Checkbox
                          id="header-product-all"
                          checked={selectedProducts.length === 0}
                          onCheckedChange={() => {}}
                        />
                        <label
                          htmlFor="header-product-all"
                          className="text-sm font-medium leading-none cursor-pointer flex-1"
                        >
                          All Products Dashboard
                        </label>
                      </div>
                      {filteredProductsList.length > 0 ? (
                        filteredProductsList.map((product) => (
                          <div
                            key={String(product.id)}
                            className="flex items-center space-x-2 p-1 hover:bg-muted/50 rounded-md transition-colors cursor-pointer"
                            onClick={() => {
                              const productId = String(product.id);
                              setSelectedProducts(
                                selectedProducts.includes(productId)
                                  ? selectedProducts.filter((id) => id !== productId)
                                  : [...selectedProducts, productId],
                              );
                            }}
                          >
                            <Checkbox
                              id={`header-product-${product.id}`}
                              checked={selectedProducts.includes(String(product.id))}
                              onCheckedChange={() => {}}
                            />
                            <label
                              htmlFor={`header-product-${product.id}`}
                              className="text-sm font-medium leading-none cursor-pointer flex-1"
                            >
                              {product.name}
                            </label>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-sm text-muted-foreground italic">
                          No products found
                        </div>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <p className="text-muted-foreground mt-2">Insurance provider management overview</p>
            {selectedProducts.length > 0 && (
              <div className="mt-3 flex max-w-[min(90vw,42rem)] flex-wrap gap-2">
                {selectedDashboardProducts.map((product) => (
                  <Badge
                    key={String(product.id)}
                    variant="secondary"
                    className="flex max-w-[220px] items-center gap-1.5 px-2.5 py-1 text-xs"
                    title={product.name}
                  >
                    <span className="truncate">{product.name}</span>
                    <button
                      type="button"
                      className="shrink-0 rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-background/70 hover:text-foreground"
                      onClick={() =>
                        setSelectedProducts(selectedProducts.filter((id) => id !== String(product.id)))
                      }
                      aria-label={`Remove ${product.name}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <MarketAdminHeatMap
          locations={heatmapLocations}
          selectedProductLabel={heatmapProductLabel}
          isAllProductsView={selectedProducts.length === 0}
          masterCountries={masterCountries}
          masterRegions={masterRegions}
          masterZones={masterZones}
        />

        <RiskAccumulationDashboard
          isOpen={isRiskAccumulationOpen}
          onClose={closeRiskAccumulation}
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Quotes</p>
                  <p className="text-2xl font-bold text-foreground">
                    {dashboardStats?.data?.totalQuotes ?? 0}
                  </p>
                </div>
                <div className="rounded-lg bg-primary/10 p-3">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Policies</p>
                  <p className="text-2xl font-bold text-foreground">
                    {dashboardStats?.data?.totalPolicies ?? 0}
                  </p>
                </div>
                <div className="rounded-lg bg-primary/10 p-3">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Premium Value</p>
                  <p className="text-2xl font-bold text-foreground">
                    {dashboardStats?.data?.totalValueCurrency &&
                      dashboardStats?.data?.totalValue !== undefined
                      ? formatCurrencyCompactMillions(
                          dashboardStats.data.totalValue,
                          dashboardStats.data.totalValueCurrency,
                        )
                      : 0}
                  </p>
                </div>
                <div className="rounded-lg bg-accent/10 p-3">
                  <TrendingUp className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Sum Insured</p>
                  <p className="text-2xl font-bold text-foreground">
                    {sumInsuredCardDisplay.currency}{' '}
                    {formatNumberCompactMillions(sumInsuredCardDisplay.value)}
                  </p>
                </div>
                <div className="rounded-lg bg-primary/10 p-3">
                  <Banknote className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)} className="w-full">
          <TabsList
            ref={tabsListRef}
            className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 mb-6 bg-primary/5 p-1 min-h-12 gap-1"
          >
            <TabsTrigger
              value="quotes"
              className="flex items-center justify-center gap-2 data-[state=active]:text-primary data-[state=active]:bg-background data-[state=active]:shadow-sm h-10 px-2"
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span className="truncate">Quote Requests</span>
            </TabsTrigger>
            <TabsTrigger
              value="referrals"
              className="flex items-center justify-center gap-2 data-[state=active]:text-primary data-[state=active]:bg-background data-[state=active]:shadow-sm h-10 px-2"
            >
              <Send className="w-4 h-4 shrink-0" />
              <span className="truncate">Referrals</span>
              {getUnreadBadgeCount(unreadReferralCount)}
            </TabsTrigger>
            <TabsTrigger
              value="fac-in"
              className="flex items-center justify-center gap-2 data-[state=active]:text-primary data-[state=active]:bg-background data-[state=active]:shadow-sm h-10 px-2"
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span className="truncate">Facultative In</span>
            </TabsTrigger>
            <TabsTrigger
              value="policies"
              className="flex items-center justify-center gap-2 data-[state=active]:text-primary data-[state=active]:bg-background data-[state=active]:shadow-sm h-10 px-2"
            >
              <Shield className="w-4 h-4 shrink-0" />
              <span className="truncate">Issued Policies</span>
            </TabsTrigger>
            <TabsTrigger
              value="endorsements"
              className="flex items-center justify-center gap-2 data-[state=active]:text-primary data-[state=active]:bg-background data-[state=active]:shadow-sm h-10 px-2"
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span className="truncate">Endorsements</span>
              {getUnreadMessageIndicator(unreadEndorsementCount)}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quotes">
            <QuotesTab
              itemsPerPage={ITEMS_PER_PAGE}
              isActive={activeTab === 'quotes'}
              selectedProductIds={selectedProducts}
            />
          </TabsContent>

          <TabsContent value="referrals">
            <ReferralsTab
              itemsPerPage={ITEMS_PER_PAGE}
              isActive={activeTab === 'referrals'}
              selectedProductIds={selectedProducts}
            />
          </TabsContent>

          <TabsContent value="fac-in">
            <FacInCasesTab returnTo="/insurer/dashboard" />
          </TabsContent>

          <TabsContent value="policies">
            <PoliciesTab
              itemsPerPage={ITEMS_PER_PAGE}
              isActive={activeTab === 'policies'}
              selectedProductIds={selectedProducts}
            />
          </TabsContent>

          <TabsContent value="endorsements" className="mt-0">
            <EndorsementsTab
              itemsPerPage={ITEMS_PER_PAGE}
              isActive={activeTab === 'endorsements'}
              selectedProductIds={selectedProducts}
            />
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
};

export default InsurerDashboard;
