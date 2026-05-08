import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { formatDateDDMMYYYY } from '@/shared/utils/date-format';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollableTabs } from "@/components/ui/ScrollableTabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { RefreshCw, Search, ChevronDown, TrendingUp, TrendingDown, FileText, ShieldCheck } from "lucide-react";
import { useToast } from "@/shared/hooks/use-toast";
import { getAdminDashboardProducts } from "@/features/market-admin/api/admin";
import { parseDashboardProductPayload } from "@/features/market-admin/utils/parseDashboardProductPayload";
import type { Product } from "@/features/product-config/api/products";
import {
  getAnalyticsConversion,
  getAnalyticsOverview,
  getAnalyticsProducts,
  getAnalyticsQuotesSummary,
  type AnalyticsQueryParams,
  type AnalyticsConversionResponse,
  type AnalyticsOverviewResponse,
  type AnalyticsProductsResponse,
  type AnalyticsQuotesSummaryResponse,
} from "@/features/analytics/api/analytics";

type TrendPoint = {
  date: string;
  value: number;
};

type ProductOption = {
  id: string;
  name: string;
};

interface AnalyticsData {
  proposals: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    trend: number;
  };
  quotes: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    trend: number;
  };
  policies: {
    total: number;
    trend: number;
  };
  premium: number;
  sumInsured: number;
  overviewConversionRate: number;
  overviewTrends: {
    proposals: TrendPoint[];
    quotes: TrendPoint[];
    conversion: TrendPoint[];
  };
  conversionRatios: {
    proposalToQuote: number;
    quoteToPolicy: number;
    trend: number;
    chart: {
      categories: string[];
      series: Array<{
        key: string;
        label: string;
        data: number[];
      }>;
    };
  };
  lostBusiness: {
    total: number;
    reasons: Array<{ reason: string; count: number; percentage: number }>;
  };
  businessSource: {
    sources: Array<{ source: string; count: number; percentage: number; revenue: number }>;
  };
  activityLogs: Array<{
    id: string;
    user: string;
    role: "UNDERWRITER" | "BRM";
    action: string;
    timestamp: string;
    details: string;
  }>;
  productPerformance: Array<{
    productId?: string;
    product: string;
    proposals: number;
    quotes: number;
    policies: number;
    revenue: number;
    conversionRate: number;
  }>;
  productChart: {
    categories: string[];
    series: Array<{
      key: string;
      label: string;
      data: number[];
    }>;
  };
  distributionChannelPerformance: Array<{
    channel: string;
    proposals: number;
    quotes: number;
    policies: number;
    revenue: number;
    conversionRate: number;
  }>;
  lossRatios: {
    overall: number;
    byProduct: Array<{ product: string; lossRatio: number; claims: number; premium: number }>;
  };
}

type EndpointStatus = "idle" | "success" | "error";

type AnalyticsApiStatus = {
  overview: EndpointStatus;
  summary: EndpointStatus;
  conversion: EndpointStatus;
  products: EndpointStatus;
};

const formatCurrency = (value: number) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

const formatShortDate = (date: string) => formatDateDDMMYYYY(date);

const normalizeSearchText = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");

const calculateTrend = (points: TrendPoint[]) => {
  if (points.length < 2) return 0;
  const previous = points[points.length - 2]?.value ?? 0;
  const current = points[points.length - 1]?.value ?? 0;
  if (previous === 0) return current === 0 ? 0 : 100;
  return Number((((current - previous) / previous) * 100).toFixed(1));
};

const mergeProductOptions = (base: ProductOption[], incoming: ProductOption[]) => {
  const merged = new Map<string, ProductOption>();
  [...base, ...incoming].forEach((product) => {
    if (product.id) {
      merged.set(product.id, product);
    }
  });
  return Array.from(merged.values()).sort((a, b) => a.name.localeCompare(b.name));
};

const createStaticFallbackSections = (): Pick<
  AnalyticsData,
  "lostBusiness" | "businessSource" | "activityLogs" | "distributionChannelPerformance" | "lossRatios"
> => {
  const reasons = [
    "Price too high",
    "Competitor offer better",
    "Coverage insufficient",
    "Customer changed mind",
    "Application rejected",
    "Other",
  ];

  const sources = [
    "Direct",
    "Broker",
    "Sales Agent",
    "Agency",
    "Online (B2C)",
    "Referral",
  ];

  const products = [
    "CAR",
    "PI",
    "Money Insurance",
    "WC",
    "Property Contents",
    "PAR",
  ];

  const channels = [
    "Broker",
    "Sales Agent",
    "Agency",
    "Direct",
    "Online (B2C)",
  ];

  const channelPerf = channels
    .map((channel) => {
      const proposals = Math.floor(Math.random() * 300) + 100;
      const quotes = Math.floor(Math.random() * (proposals * 0.8)) + Math.floor(proposals * 0.2);
      const policies = Math.floor(Math.random() * (quotes * 0.8)) + Math.floor(quotes * 0.1);
      return {
        channel,
        proposals,
        quotes: Math.min(quotes, proposals),
        policies: Math.min(policies, quotes),
        revenue: Math.floor(Math.random() * 3000000) + 1000000,
        conversionRate: 0,
      };
    })
    .map((item) => ({
      ...item,
      conversionRate: item.quotes > 0 ? (item.policies / item.quotes) * 100 : 0,
    }));

  return {
    lostBusiness: {
      total: 84,
      reasons: reasons
        .map((reason) => ({
          reason,
          count: Math.floor(Math.random() * 50) + 5,
          percentage: 0,
        }))
        .map((item, _, all) => ({
          ...item,
          percentage: (item.count / all.reduce((sum, current) => sum + current.count, 0)) * 100,
        })),
    },
    businessSource: {
      sources: sources
        .map((source) => ({
          source,
          count: Math.floor(Math.random() * 200) + 50,
          percentage: 0,
          revenue: Math.floor(Math.random() * 500000) + 100000,
        }))
        .map((item, _, all) => ({
          ...item,
          percentage: (item.count / all.reduce((sum, current) => sum + current.count, 0)) * 100,
        })),
    },
    activityLogs: Array.from({ length: 20 }, (_, index) => {
      const actions = [
        "Reviewed proposal",
        "Generated quote",
        "Approved quote",
        "Rejected quote",
        "Issued policy",
        "Modified quote terms",
        "Requested additional information",
        "Escalated to manager",
        "Updated risk assessment",
        "Completed underwriting review",
      ];
      const quoteIds = Array.from({ length: 20 }, (_, itemIndex) => `Q-${String(itemIndex + 1000).padStart(4, "0")}`);
      return {
        id: `log-${index + 1}`,
        user: ["Ahmed Al-Mansoori", "Sarah Johnson", "Mohammed Hassan", "Fatima Al-Zahra", "Ali Ahmad"][index % 5],
        role: index % 2 === 0 ? "UNDERWRITER" : "BRM",
        action: actions[index % actions.length],
        timestamp: new Date(Date.now() - index * 3600000).toISOString(),
        details: `${actions[index % actions.length]} for ${quoteIds[index % quoteIds.length]}`,
      };
    }),
    distributionChannelPerformance: channelPerf,
    lossRatios: {
      overall: 45.2,
      byProduct: products.map((product) => ({
        product,
        lossRatio: Math.random() * 60 + 20,
        claims: Math.floor(Math.random() * 50) + 10,
        premium: Math.floor(Math.random() * 2000000) + 500000,
      })),
    },
  };
};

const createApiBackedEmptyData = (): Omit<
  AnalyticsData,
  "lostBusiness" | "businessSource" | "activityLogs" | "distributionChannelPerformance" | "lossRatios"
> => ({
  proposals: {
    total: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    trend: 0,
  },
  quotes: {
    total: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    trend: 0,
  },
  policies: {
    total: 0,
    trend: 0,
  },
  premium: 0,
  sumInsured: 0,
  overviewConversionRate: 0,
  overviewTrends: {
    proposals: [],
    quotes: [],
    conversion: [],
  },
  conversionRatios: {
    proposalToQuote: 0,
    quoteToPolicy: 0,
    trend: 0,
    chart: {
      categories: [],
      series: [],
    },
  },
  productPerformance: [],
  productChart: {
    categories: [],
    series: [],
  },
});

const createInitialAnalyticsData = (): AnalyticsData => ({
  ...createApiBackedEmptyData(),
  ...createStaticFallbackSections(),
});

const EMPTY_API_STATUS: AnalyticsApiStatus = {
  overview: "idle",
  summary: "idle",
  conversion: "idle",
  products: "idle",
};

const mapOverviewData = (
  current: AnalyticsData,
  overview: AnalyticsOverviewResponse,
): AnalyticsData => {
  const proposalTrend = overview.proposal_trend ?? [];
  const quoteTrend = overview.quote_trend ?? [];
  const conversionTrend = overview.conversion_trend ?? [];

  return {
    ...current,
    proposals: {
      ...current.proposals,
      total: overview.metrics.total_proposals ?? current.proposals.total,
      trend: calculateTrend(proposalTrend),
    },
    quotes: {
      ...current.quotes,
      total: overview.metrics.total_quotes ?? current.quotes.total,
      trend: calculateTrend(quoteTrend),
    },
    policies: {
      ...current.policies,
      total: overview.metrics.total_policies ?? current.policies.total,
      trend: calculateTrend(conversionTrend),
    },
    premium: overview.metrics.total_premium ?? current.premium,
    sumInsured: overview.metrics.total_sum_insured ?? current.sumInsured,
    overviewConversionRate: overview.metrics.conversion_rate ?? current.overviewConversionRate,
    overviewTrends: {
      proposals: proposalTrend,
      quotes: quoteTrend,
      conversion: conversionTrend,
    },
  };
};

const mapQuotesSummaryData = (
  current: AnalyticsData,
  summary: AnalyticsQuotesSummaryResponse,
): AnalyticsData => ({
  ...current,
  quotes: {
    ...current.quotes,
    total: summary.total ?? current.quotes.total,
    today: summary.today ?? current.quotes.today,
    thisWeek: summary.this_week ?? current.quotes.thisWeek,
    thisMonth: summary.this_month ?? current.quotes.thisMonth,
  },
});

const mapConversionData = (
  current: AnalyticsData,
  conversion: AnalyticsConversionResponse,
): AnalyticsData => ({
  ...current,
  conversionRatios: {
    proposalToQuote: conversion.proposal_to_quote ?? current.conversionRatios.proposalToQuote,
    quoteToPolicy: conversion.quote_to_policy ?? current.conversionRatios.quoteToPolicy,
    trend: calculateTrend(
      (conversion.chart?.categories ?? []).map((date, index) => ({
        date,
        value: conversion.chart?.series?.find((item) => item.key === "quote_to_policy")?.data?.[index] ?? 0,
      })),
    ),
    chart: conversion.chart ?? current.conversionRatios.chart,
  },
});

const mapProductsData = (
  current: AnalyticsData,
  productsResponse: AnalyticsProductsResponse,
): AnalyticsData => ({
  ...current,
  productPerformance: (productsResponse.products ?? []).map((item) => ({
    productId: item.product_id,
    product: item.product_name,
    proposals: item.proposals,
    quotes: item.quotes,
    policies: item.policies,
    revenue: item.revenue,
    conversionRate: item.conversion_rate,
  })),
  productChart: productsResponse.chart ?? current.productChart,
});

const AnalyticsReporting = () => {
  const { toast } = useToast();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [productsList, setProductsList] = useState<ProductOption[]>([]);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [productsLoading, setProductsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>(createInitialAnalyticsData);
  const [apiStatus, setApiStatus] = useState<AnalyticsApiStatus>(EMPTY_API_STATUS);

  useEffect(() => {
    const fetchProducts = async () => {
      setProductsLoading(true);
      try {
        const response = await getAdminDashboardProducts();
        const productsItems = parseDashboardProductPayload(response);

        const formattedProducts = productsItems
          .filter((product) => product && typeof product === "object")
          .map((product: Product & Record<string, unknown>) => ({
            id: String(product.id || product.productId || product.product_id || product._id || ""),
            name: String(
              product.name ||
                product.productName ||
                product.product_name ||
                product.label ||
                product.title ||
                "Unknown Product",
            ),
          }))
          .filter((product) => product.id);

        setProductsList((current) => mergeProductOptions(current, formattedProducts));
      } catch (error) {
        console.error("Failed to fetch analytics products:", error);
        toast({
          title: "Error",
          description: "Failed to load products for filter",
          variant: "destructive",
        });
      } finally {
        setProductsLoading(false);
      }
    };

    fetchProducts();
  }, [toast]);

  const fetchAnalyticsData = useCallback(async () => {
    setIsRefreshing(true);

    try {
      const analyticsParams: AnalyticsQueryParams | undefined =
        selectedProducts.length > 0
          ? {
              productIds: selectedProducts.join(","),
            }
          : undefined;

      const [
        overviewResult,
        quotesSummaryResult,
        conversionResult,
        productsResult,
      ] = await Promise.allSettled([
        getAnalyticsOverview(analyticsParams),
        getAnalyticsQuotesSummary(analyticsParams),
        getAnalyticsConversion(analyticsParams),
        getAnalyticsProducts(analyticsParams),
      ]);

      let nextData: AnalyticsData = {
        ...createApiBackedEmptyData(),
        ...createStaticFallbackSections(),
      };
      let hasLiveData = false;
      const nextStatus: AnalyticsApiStatus = {
        overview: overviewResult.status === "fulfilled" ? "success" : "error",
        summary: quotesSummaryResult.status === "fulfilled" ? "success" : "error",
        conversion: conversionResult.status === "fulfilled" ? "success" : "error",
        products: productsResult.status === "fulfilled" ? "success" : "error",
      };

      if (overviewResult.status === "fulfilled") {
        nextData = mapOverviewData(nextData, overviewResult.value);
        hasLiveData = true;
      }

      if (quotesSummaryResult.status === "fulfilled") {
        nextData = mapQuotesSummaryData(nextData, quotesSummaryResult.value);
        hasLiveData = true;
      }

      if (conversionResult.status === "fulfilled") {
        nextData = mapConversionData(nextData, conversionResult.value);
        hasLiveData = true;
      }

      if (productsResult.status === "fulfilled") {
        nextData = mapProductsData(nextData, productsResult.value);
        hasLiveData = true;
        const apiProducts = (productsResult.value.products ?? []).map((item) => ({
          id: item.product_id,
          name: item.product_name,
        }));
        setProductsList((current) => mergeProductOptions(current, apiProducts));
      }

      setAnalyticsData(nextData);
      setApiStatus(nextStatus);
      setLastRefresh(new Date());

      if (!hasLiveData) {
        toast({
          title: "Analytics unavailable",
          description: "API-backed analytics sections are unavailable right now.",
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch analytics data",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedProducts, toast]);

  useEffect(() => {
    fetchAnalyticsData();

    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        fetchAnalyticsData();
      }, 30000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, fetchAnalyticsData]);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  const filteredProductsList = useMemo(() => {
    const normalizedQuery = normalizeSearchText(productSearchQuery);
    if (!normalizedQuery) return productsList;

    const queryParts = normalizedQuery.split(" ");

    return productsList.filter(
      (product) => {
        const normalizedProductName = normalizeSearchText(product.name);
        return queryParts.every((part) => normalizedProductName.includes(part));
      },
    );
  }, [productSearchQuery, productsList]);

  const selectedProductsLabel = useMemo(() => {
    if (selectedProducts.length === 0) return "All products";
    if (selectedProducts.length === 1) {
      return productsList.find((product) => product.id === selectedProducts[0])?.name || "1 product selected";
    }
    return `${selectedProducts.length} products selected`;
  }, [productsList, selectedProducts]);

  const filteredProductPerformance = useMemo(() => {
    if (selectedProducts.length === 0) return analyticsData.productPerformance;
    return analyticsData.productPerformance.filter(
      (item) => item.productId && selectedProducts.includes(item.productId),
    );
  }, [analyticsData.productPerformance, selectedProducts]);

  const productPerformanceChartData = useMemo(() => {
    return filteredProductPerformance.map((item) => ({
      product: item.product,
      proposals: item.proposals,
      quotes: item.quotes,
      policies: item.policies,
    }));
  }, [filteredProductPerformance]);

  const overviewProposalChartData = analyticsData.overviewTrends.proposals.map((item) => ({
    date: formatShortDate(item.date),
    value: item.value,
  }));

  const overviewQuoteChartData = analyticsData.overviewTrends.quotes.map((item) => ({
    date: formatShortDate(item.date),
    value: item.value,
  }));

  const conversionChartData = analyticsData.conversionRatios.chart.categories.map((category, index) => {
    const chartRow: Record<string, string | number> = {
      date: formatShortDate(category),
    };

    analyticsData.conversionRatios.chart.series.forEach((series) => {
      chartRow[series.key] = series.data[index] ?? 0;
    });

    return chartRow;
  });

  const quoteSummaryChartData = [
    { period: "Today", quotes: analyticsData.quotes.today },
    { period: "This Week", quotes: analyticsData.quotes.thisWeek },
    { period: "This Month", quotes: analyticsData.quotes.thisMonth },
    { period: "Total", quotes: analyticsData.quotes.total },
  ];

  const hasOverviewTrendData =
    overviewProposalChartData.length > 0 || overviewQuoteChartData.length > 0;
  const hasConversionChartData =
    conversionChartData.length > 0 && analyticsData.conversionRatios.chart.series.length > 0;
  const hasProductsData = filteredProductPerformance.length > 0;

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex-1 overflow-auto p-6">
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analytics & Reporting</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Real-time analytics and performance metrics
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 xl:justify-end">
            <div className="flex items-center gap-2">
              <Label htmlFor="auto-refresh" className="text-sm">
                Auto Refresh (30s)
              </Label>
              <Switch id="auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAnalyticsData}
              disabled={isRefreshing}
              className="gap-2"
            >
              {isRefreshing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Refresh Now
                </>
              )}
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="h-10 min-w-[220px] justify-between rounded-md border-border bg-card px-4 text-left font-normal shadow-sm hover:bg-muted/40"
                >
                  <span className="truncate text-sm text-foreground">{selectedProductsLabel}</span>
                  <ChevronDown className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="w-[340px] rounded-md border border-border bg-card p-0 shadow-xl"
              >
                <div className="space-y-4 p-4">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">Select Products</h4>
                      <p className="text-xs text-muted-foreground">
                        Used for the Products tab and chart
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {filteredProductsList.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs text-primary hover:text-primary/80"
                          onClick={() => {
                            const allFilteredIds = filteredProductsList.map((product) => product.id);
                            setSelectedProducts((current) => Array.from(new Set([...current, ...allFilteredIds])));
                          }}
                        >
                          Select All
                        </Button>
                      )}
                      {selectedProducts.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs text-destructive hover:text-destructive/80"
                          onClick={() => setSelectedProducts([])}
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={productSearchQuery}
                      onChange={(event) => setProductSearchQuery(event.target.value)}
                      placeholder="Filter products..."
                      className="h-10 rounded-lg border-border pl-9 text-sm"
                    />
                  </div>

                  <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                    {productsLoading ? (
                      <div className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
                        Loading products...
                      </div>
                    ) : filteredProductsList.length > 0 ? (
                      filteredProductsList.map((product) => (
                        <div
                          key={product.id}
                          className="flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-3 py-2 transition-colors hover:border-border hover:bg-muted/40"
                          onClick={() => {
                            setSelectedProducts((current) =>
                              current.includes(product.id)
                                ? current.filter((id) => id !== product.id)
                                : [...current, product.id],
                            );
                          }}
                        >
                          <Checkbox
                            id={`analytics-product-${product.id}`}
                            checked={selectedProducts.includes(product.id)}
                            onCheckedChange={() => undefined}
                          />
                          <label
                            htmlFor={`analytics-product-${product.id}`}
                            className="flex-1 cursor-pointer text-sm font-medium text-foreground"
                          >
                            {product.name}
                          </label>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
                        No products found
                      </div>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <ScrollableTabs className="pb-2">
            <TabsList className="flex w-full min-w-max justify-between gap-2 rounded-lg border border-primary/10 bg-primary/5 p-1 shadow-sm transition-all duration-300">
              <TabsTrigger value="overview" className="shrink-0 whitespace-nowrap rounded-md px-6 py-2 transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                Overview
              </TabsTrigger>
              <TabsTrigger value="summary" className="shrink-0 whitespace-nowrap rounded-md px-6 py-2 transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                Summary
              </TabsTrigger>
              <TabsTrigger value="conversion" className="shrink-0 whitespace-nowrap rounded-md px-6 py-2 transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                Conversion
              </TabsTrigger>
              <TabsTrigger value="lost-business" className="shrink-0 whitespace-nowrap rounded-md px-6 py-2 transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                Lost Business
              </TabsTrigger>
              <TabsTrigger value="activity-logs" className="shrink-0 whitespace-nowrap rounded-md px-6 py-2 transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                Activity Logs
              </TabsTrigger>
              <TabsTrigger value="products" className="shrink-0 whitespace-nowrap rounded-md px-6 py-2 transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                Products
              </TabsTrigger>
              <TabsTrigger value="channel-performance" className="shrink-0 whitespace-nowrap rounded-md px-6 py-2 transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                Channel Performance
              </TabsTrigger>
              <TabsTrigger value="loss-ratios" className="shrink-0 whitespace-nowrap rounded-md px-6 py-2 transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                Loss Ratios
              </TabsTrigger>
            </TabsList>
          </ScrollableTabs>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Proposals</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analyticsData.proposals.total.toLocaleString()}</div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    {analyticsData.proposals.trend >= 0 ? (
                      <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
                    ) : (
                      <TrendingDown className="mr-1 h-3 w-3 text-red-600" />
                    )}
                    {Math.abs(analyticsData.proposals.trend)}% from last period
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Quotes</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analyticsData.quotes.total.toLocaleString()}</div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    {analyticsData.quotes.trend >= 0 ? (
                      <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
                    ) : (
                      <TrendingDown className="mr-1 h-3 w-3 text-red-600" />
                    )}
                    {Math.abs(analyticsData.quotes.trend)}% from last period
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Policies</CardTitle>
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analyticsData.policies.total.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Live from overview metrics</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analyticsData.overviewConversionRate.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">Proposal to policy conversion</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Proposal Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  {apiStatus.overview === "success" && overviewProposalChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={overviewProposalChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="value" stroke="#2563eb" name="Proposals" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                      Proposal trend data is unavailable.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quote Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  {apiStatus.overview === "success" && overviewQuoteChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={overviewQuoteChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="value" stroke="#059669" name="Quotes" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                      Quote trend data is unavailable.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Channel Performance Overview</CardTitle>
                <CardDescription>Static fallback until a dedicated API is available</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={analyticsData.distributionChannelPerformance.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="channel" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="proposals" fill="#2563eb" name="Proposals" />
                    <Bar dataKey="quotes" fill="#10b981" name="Quotes" />
                    <Bar dataKey="policies" fill="#f59e0b" name="Policies" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="summary" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quotes Summary</CardTitle>
                <CardDescription>Live quote counts from the summary API</CardDescription>
              </CardHeader>
              <CardContent>
                {apiStatus.summary === "success" ? (
                  <>
                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div className="rounded-lg border p-4 text-center">
                    <div className="text-2xl font-bold">{analyticsData.quotes.total.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Total Quotes</div>
                  </div>
                  <div className="rounded-lg border p-4 text-center">
                    <div className="text-2xl font-bold">{analyticsData.quotes.today.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Today</div>
                  </div>
                  <div className="rounded-lg border p-4 text-center">
                    <div className="text-2xl font-bold">{analyticsData.quotes.thisWeek.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">This Week</div>
                  </div>
                  <div className="rounded-lg border p-4 text-center">
                    <div className="text-2xl font-bold">{analyticsData.quotes.thisMonth.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">This Month</div>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={360}>
                  <BarChart data={quoteSummaryChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="quotes" fill="#0f766e" name="Quotes" />
                  </BarChart>
                </ResponsiveContainer>
                  </>
                ) : (
                  <div className="flex h-[360px] items-center justify-center text-sm text-muted-foreground">
                    Quotes summary data is unavailable.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="conversion" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Conversion Ratios</CardTitle>
                <CardDescription>Track conversion from proposal to quote to policy</CardDescription>
              </CardHeader>
              <CardContent>
                {apiStatus.conversion === "success" ? (
                  <>
                <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <div className="mb-2 text-sm text-muted-foreground">Proposal to Quote</div>
                    <div className="text-3xl font-bold">{analyticsData.conversionRatios.proposalToQuote.toFixed(1)}%</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="mb-2 text-sm text-muted-foreground">Quote to Policy</div>
                    <div className="text-3xl font-bold">{analyticsData.conversionRatios.quoteToPolicy.toFixed(1)}%</div>
                  </div>
                </div>
                {hasConversionChartData ? (
                  <ResponsiveContainer width="100%" height={340}>
                    <LineChart data={conversionChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      {analyticsData.conversionRatios.chart.series.map((series, index) => (
                        <Line
                          key={series.key}
                          type="monotone"
                          dataKey={series.key}
                          stroke={index === 0 ? "#2563eb" : "#f59e0b"}
                          name={series.label}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[340px] items-center justify-center text-sm text-muted-foreground">
                    Conversion chart data is unavailable.
                  </div>
                )}
                  </>
                ) : (
                  <div className="flex h-[340px] items-center justify-center text-sm text-muted-foreground">
                    Conversion data is unavailable.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lost-business" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Lost Business Analysis</CardTitle>
                <CardDescription>Static fallback until a dedicated API is available</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="mb-2 text-2xl font-bold">Total Lost: {analyticsData.lostBusiness.total}</div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reason</TableHead>
                      <TableHead>Count</TableHead>
                      <TableHead>Percentage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analyticsData.lostBusiness.reasons.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.reason}</TableCell>
                        <TableCell>{item.count}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-32 rounded-full bg-muted">
                              <div className="h-2 rounded-full bg-primary" style={{ width: `${item.percentage}%` }} />
                            </div>
                            <span className="text-sm">{item.percentage.toFixed(1)}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.lostBusiness.reasons}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="reason" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#FF8042" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity-logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Underwriter & BRM Activity Logs</CardTitle>
                <CardDescription>Static fallback until a dedicated API is available</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analyticsData.activityLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">{log.user}</TableCell>
                        <TableCell>
                          <Badge variant={log.role === "UNDERWRITER" ? "default" : "secondary"}>
                            {log.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{log.action}</TableCell>
                        <TableCell>{log.details}</TableCell>
                        <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Product-Level Performance</CardTitle>
                <CardDescription>Live product metrics by proposal, quote, and policy</CardDescription>
              </CardHeader>
              <CardContent>
                {apiStatus.products === "success" ? (
                  <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Proposals</TableHead>
                      <TableHead>Quotes</TableHead>
                      <TableHead>Policies</TableHead>
                      <TableHead>Revenue (AED)</TableHead>
                      <TableHead>Conversion Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProductPerformance.map((item, index) => (
                      <TableRow key={item.productId || index}>
                        <TableCell className="font-medium">{item.product}</TableCell>
                        <TableCell>{item.proposals}</TableCell>
                        <TableCell>{item.quotes}</TableCell>
                        <TableCell>{item.policies}</TableCell>
                        <TableCell>{formatCurrency(item.revenue)}</TableCell>
                        <TableCell>
                          <Badge variant={item.conversionRate > 60 ? "default" : item.conversionRate > 40 ? "secondary" : "destructive"}>
                            {item.conversionRate.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-6">
                  {hasProductsData ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={productPerformanceChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="product" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="proposals" fill="#2563eb" name="Proposals" />
                        <Bar dataKey="quotes" fill="#10b981" name="Quotes" />
                        <Bar dataKey="policies" fill="#f59e0b" name="Policies" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground">
                      No product data available.
                    </div>
                  )}
                </div>
                  </>
                ) : (
                  <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground">
                    Product analytics data is unavailable.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="channel-performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribution Channel Performance</CardTitle>
                <CardDescription>Static fallback until a dedicated API is available</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Channel</TableHead>
                      <TableHead>Proposals</TableHead>
                      <TableHead>Quotes</TableHead>
                      <TableHead>Policies</TableHead>
                      <TableHead>Revenue (AED)</TableHead>
                      <TableHead>Conversion Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analyticsData.distributionChannelPerformance.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.channel}</TableCell>
                        <TableCell>{item.proposals}</TableCell>
                        <TableCell>{item.quotes}</TableCell>
                        <TableCell>{item.policies}</TableCell>
                        <TableCell>{formatCurrency(item.revenue)}</TableCell>
                        <TableCell>
                          <Badge variant={item.conversionRate > 60 ? "default" : item.conversionRate > 40 ? "secondary" : "destructive"}>
                            {item.conversionRate.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="loss-ratios" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Loss Ratios</CardTitle>
                <CardDescription>Static fallback until claims integration is available</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 rounded-lg border bg-muted/30 p-4">
                  <div className="mb-2 text-sm text-muted-foreground">Overall Loss Ratio</div>
                  <div className="text-3xl font-bold">{analyticsData.lossRatios.overall.toFixed(1)}%</div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Claims</TableHead>
                      <TableHead>Premium (AED)</TableHead>
                      <TableHead>Loss Ratio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analyticsData.lossRatios.byProduct.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.product}</TableCell>
                        <TableCell>{item.claims}</TableCell>
                        <TableCell>{formatCurrency(item.premium)}</TableCell>
                        <TableCell>
                          <Badge variant={item.lossRatio > 70 ? "destructive" : item.lossRatio > 50 ? "secondary" : "default"}>
                            {item.lossRatio.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AnalyticsReporting;
