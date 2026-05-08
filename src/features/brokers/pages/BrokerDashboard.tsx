import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Banknote,
  Plus,
  FileText,
  Shield,
  Send,
  ScrollText,
  ChevronDown,
  MessageSquare,
  Search,
  TrendingUp,
  X,
} from 'lucide-react';
import { getBrokerCompanyId } from '@/lib/auth';
import { getDashboardStatistics, type DashboardStatistics } from '@/features/market-admin/api/admin';
import { resolveSumInsuredForDisplay } from '@/features/market-admin/constants/dashboardDemoFallbacks';
import { cn, formatNumberCompactMillions } from '@/shared/utils/lib-utils';
import { getProductsList, type ProductItem } from '@/features/product-config/api/products-list';

// Sub-components for tabs
import ProposalsTab from '../components/BrokerDashboard/ProposalsTab';
import QuotesTab from '../components/BrokerDashboard/QuotesTab';
import ReferralsTab from '../components/BrokerDashboard/ReferralsTab';
import PoliciesTab from '../components/BrokerDashboard/PoliciesTab';
import EndorsementsTab from '../components/BrokerDashboard/EndorsementsTab';

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

export default function BrokerDashboard() {
  const navigate = useNavigate();
  const [dashboardStats, setDashboardStats] = useState<DashboardStatistics | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState('proposals');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [dashboardProducts, setDashboardProducts] = useState<ProductItem[]>([]);
  const [productSearchQuery, setProductSearchQuery] = useState('');

  // Resolved broker ID for the logged-in broker user (used to scope endorsements)
  const brokerOrgId = useMemo(() => {
    const id = getBrokerCompanyId();
    return id != null ? String(id) : undefined;
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setIsLoadingStats(true);
        const stats = await getDashboardStatistics(
          selectedProducts.length > 0 ? { productId: selectedProducts } : undefined,
        );
        setDashboardStats(stats);
      } catch (e) {
        console.error('❌ Failed to fetch broker dashboard statistics:', e);
      } finally {
        setIsLoadingStats(false);
      }
    })();
  }, [selectedProducts]);

  useEffect(() => {
    if (!brokerOrgId) {
      setDashboardProducts([]);
      return;
    }

    (async () => {
      try {
        const productsRes = await getProductsList({
          page: 1,
          pageSize: 24,
          assignedProduct: true,
          distributorOrgId: brokerOrgId,
        });
        setDashboardProducts(productsRes.items || []);
      } catch (e) {
        console.error('❌ Failed to fetch broker dashboard products:', e);
      }
    })();
  }, [brokerOrgId]);

  useEffect(() => {
    if (selectedProducts.length === 0) return;

    const availableProductIds = new Set(dashboardProducts.map((product) => String(product.id)));
    const validSelectedProducts = selectedProducts.filter((productId) => availableProductIds.has(productId));

    if (validSelectedProducts.length !== selectedProducts.length) {
      setSelectedProducts(validSelectedProducts);
    }
  }, [dashboardProducts, selectedProducts]);

  const tabsListRef = useRef<HTMLDivElement>(null);
  const unreadReferralCount = dashboardStats?.data?.unreadReferralMessageCount ?? 0;
  const unreadEndorsementCount = dashboardStats?.data?.totalUnreadCount ?? 0;
  const selectedDashboardProducts = useMemo(
    () => dashboardProducts.filter((product) => selectedProducts.includes(String(product.id))),
    [dashboardProducts, selectedProducts],
  );
  const filteredProductsList = useMemo(() => {
    if (!productSearchQuery.trim()) return dashboardProducts;
    const query = productSearchQuery.toLowerCase();
    return dashboardProducts.filter((product) => product.name?.toLowerCase().includes(query));
  }, [dashboardProducts, productSearchQuery]);
  const sumInsuredCardDisplay = useMemo(
    () => resolveSumInsuredForDisplay(dashboardStats?.data),
    [dashboardStats?.data],
  );

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
  }, []);

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
        {/* Header with Product Filter */}
        <div className="flex justify-between items-center mb-6">
          <div>
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
                          id="broker-header-product-all"
                          checked={selectedProducts.length === 0}
                          onCheckedChange={() => {}}
                        />
                        <label
                          htmlFor="broker-header-product-all"
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
                              id={`broker-header-product-${product.id}`}
                              checked={selectedProducts.includes(String(product.id))}
                              onCheckedChange={() => {}}
                            />
                            <label
                              htmlFor={`broker-header-product-${product.id}`}
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
            <p className="text-muted-foreground mt-2">Insurance broker management overview</p>
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
          <Button className="gap-2" onClick={() => navigate('/broker/product-selection')}>
            <Plus className="w-4 h-4" />
            Create New Quote
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Quotes</p>
                  {isLoadingStats ? (
                    <Skeleton className="mt-2 h-8 w-20" />
                  ) : (
                    <div className="text-2xl font-bold text-foreground break-words">
                      {dashboardStats?.data?.totalQuotes ?? 0}
                    </div>
                  )}
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
                  {isLoadingStats ? (
                    <Skeleton className="mt-2 h-8 w-20" />
                  ) : (
                    <div className="text-2xl font-bold text-foreground break-words">
                      {dashboardStats?.data?.totalPolicies ?? 0}
                    </div>
                  )}
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
                  {isLoadingStats ? (
                    <Skeleton className="mt-2 h-8 w-24" />
                  ) : (
                    <div className="flex flex-col gap-0.5">
                      <div
                        className={cn(
                          'font-bold text-foreground break-all leading-tight',
                          (dashboardStats?.data?.totalValue?.toLocaleString() || '0').length > 15 ? 'text-xl' : 'text-2xl',
                        )}
                        title={dashboardStats?.data?.totalValue?.toLocaleString() || '0'}
                      >
                        <span className="mr-1.5">AED</span>
                        {dashboardStats?.data?.totalValue !== undefined
                          ? formatNumberCompactMillions(dashboardStats.data.totalValue)
                          : 0}
                      </div>
                    </div>
                  )}
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
                  {isLoadingStats ? (
                    <Skeleton className="mt-2 h-8 w-24" />
                  ) : (
                    <div className="flex flex-col gap-0.5">
                      <div
                        className={cn(
                          'font-bold text-foreground break-all leading-tight',
                          (sumInsuredCardDisplay.value?.toLocaleString() || '0').length > 15 ? 'text-xl' : 'text-2xl',
                        )}
                        title={sumInsuredCardDisplay.value?.toLocaleString() || '0'}
                      >
                        <span className="mr-1.5">{sumInsuredCardDisplay.currency}</span>
                        {formatNumberCompactMillions(sumInsuredCardDisplay.value)}
                      </div>
                    </div>
                  )}
                </div>
                <div className="rounded-lg bg-primary/10 p-3">
                  <Banknote className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Quotes and Policies */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList
            ref={tabsListRef}
            className="grid w-full grid-cols-5 mb-6 bg-primary/5 p-1 h-12"
          >
            <TabsTrigger
              value="proposals"
              className="flex items-center justify-center gap-2 data-[state=active]:text-primary data-[state=active]:bg-background data-[state=active]:shadow-sm h-10"
            >
              <ScrollText className="w-4 h-4" />
              <span className="truncate">Proposals</span>
            </TabsTrigger>
            <TabsTrigger
              value="quotes"
              className="flex items-center justify-center gap-2 data-[state=active]:text-primary data-[state=active]:bg-background data-[state=active]:shadow-sm h-10"
            >
              <FileText className="w-4 h-4" />
              <span className="truncate">Quotes</span>
            </TabsTrigger>
            <TabsTrigger
              value="referrals"
              className="flex items-center justify-center gap-2 data-[state=active]:text-primary data-[state=active]:bg-background data-[state=active]:shadow-sm h-10"
            >
              <Send className="w-4 h-4" />
              <span className="truncate">Referrals</span>
              {getUnreadBadgeCount(unreadReferralCount)}
            </TabsTrigger>
            <TabsTrigger
              value="policies"
              className="flex items-center justify-center gap-2 data-[state=active]:text-primary data-[state=active]:bg-background data-[state=active]:shadow-sm h-10"
            >
              <Shield className="w-4 h-4" />
              <span className="truncate">Policies</span>
            </TabsTrigger>
            <TabsTrigger
              value="endorsements"
              className="flex items-center justify-center gap-2 data-[state=active]:text-primary data-[state=active]:bg-background data-[state=active]:shadow-sm h-10"
            >
              <FileText className="w-4 h-4" />
              <span className="truncate">Endorsements</span>
              {getUnreadMessageIndicator(unreadEndorsementCount)}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="proposals">
            <ProposalsTab
              itemsPerPage={ITEMS_PER_PAGE}
              isActive={activeTab === 'proposals'}
              selectedProductIds={selectedProducts}
            />
          </TabsContent>

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

          <TabsContent value="policies">
            <PoliciesTab
              itemsPerPage={ITEMS_PER_PAGE}
              isActive={activeTab === 'policies'}
              selectedProductIds={selectedProducts}
            />
          </TabsContent>

          <TabsContent value="endorsements">
            <EndorsementsTab
              itemsPerPage={ITEMS_PER_PAGE}
              isActive={activeTab === 'endorsements'}
              brokerOrgId={brokerOrgId}
              selectedProductIds={selectedProducts}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
