import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DatePicker } from '@/components/ui/date-picker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Plus,
  FileText,
  Shield,
  Eye,
  Search,
  Filter,
  BarChart3,
  TrendingUp,
  Calendar,
  Clock,
  Download,
  ChevronDown,
  Send,
  Banknote,
  Upload,
  X,
} from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { getAdminDashboardQuotes, getAdminDashboardPolicies, getAdminDashboardReferrals, getAdminDashboardStatistics, ActivityData, GWPData, getAdminDashboardProducts, exportAdminDashboardQuotes, exportAdminDashboardPolicies, exportAdminDashboardReferrals, AdminDashboardPoliciesResponse, AdminDashboardQuotesResponse, AdminDashboardReferralsResponse } from '@/features/market-admin/api/admin';
import type { Product } from '@/features/product-config/api/products';
import {
  listMasterCountries,
  listMasterRegions,
  listMasterZones,
} from '@/features/product-config/masters/api/masters';
import { listInsurers } from '@/features/insurers/api/insurers';
import { listBrokersViaManagement } from '@/features/brokers/api/brokers';;
import { toast } from '@/components/ui/sonner';
import { getQuoteDashboardById } from '@/features/quotes/api/quotes';
import TableSkeleton from '@/components/loaders/TableSkeleton';
import {
  QUOTE_STATUSES,
  getQuoteStatusLabel,
  getQuoteStatusColor,
  filterActiveQuotes,
} from '@/lib/quote-status';
import { getReferralStatusLabel, getReferralStatusColor } from '@/lib/referral-status';
import { cn } from '@/shared/utils/lib-utils';
import { formatDateShort } from '@/shared/utils/date-format';
import { QuoteStatusDot } from '@/features/quotes/components/QuotesComparison/QuoteStatusDot';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import * as XLSX from 'xlsx';
import { isDemoMode } from '@/lib/demo-mode';
import { getAuthToken } from '@/lib/auth';
import {
  formatCurrencyCompactMillions,
  formatCurrencyLocale,
  formatNumberCompactMillions,
} from '@/shared/utils/lib-utils';
import { ColumnVisibilityDropdown, ColumnDefinition } from '@/components/shared/ColumnVisibilityDropdown';
import { useColumnVisibilityStore } from '@/shared/stores/useColumnVisibilityStore';
import { TruncatedStatusBadge } from '@/components/shared/TruncatedStatusBadge';
import { MarketAdminHeatMap } from '@/features/market-admin/components/MarketAdminHeatMap';
import { buildHeatmapLocations } from '@/features/market-admin/utils/buildHeatmapLocations';
import { parseDashboardProductPayload } from '@/features/market-admin/utils/parseDashboardProductPayload';
import {
  heatmapLocationsWithFallback,
  resolveSumInsuredForDisplay,
} from '@/features/market-admin/constants/dashboardDemoFallbacks';

// Export functions
// Quote Export removed local handling, now fetched via backend API
// Quotes policies handled by backend 
const parseLocalDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const getNextDate = (dateStr: string) => {
  if (!dateStr) return undefined;
  const date = parseLocalDate(dateStr);
  return format(addDays(date, 1), 'yyyy-MM-dd');
};

const getPrevDate = (dateStr: string) => {
  if (!dateStr) return undefined;
  const date = parseLocalDate(dateStr);
  return format(subDays(date, 1), 'yyyy-MM-dd');
};

const MultiSelectDropdown = ({
  options,
  selectedValues,
  onToggle,
  label,
  placeholder,
}: {
  options: { id: string; name: string }[];
  selectedValues: string[];
  onToggle: (id: string) => void;
  label: string;
  placeholder: string;
}) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button
        variant="outline"
        className="w-full justify-between h-10 border-border hover:bg-muted/50 text-left font-normal"
      >
        <span className="truncate">
          {selectedValues.length === 0 ? placeholder : `${selectedValues.length} ${label} selected`}
        </span>
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    </PopoverTrigger>
    <PopoverContent
      className="w-[300px] p-0 bg-card border border-border shadow-large"
      align="start"
    >
      <div className="p-3 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-foreground text-sm">{label}</h4>
          {selectedValues.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                options.forEach((opt) => {
                  if (selectedValues.includes(opt.id)) onToggle(opt.id);
                })
              }
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear All
            </Button>
          )}
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
          {options.map((option) => (
            <div key={option.id} className="flex items-center space-x-2">
              <Checkbox
                id={`filter-${option.id}`}
                checked={selectedValues.includes(option.id)}
                onCheckedChange={() => onToggle(option.id)}
              />
              <label
                htmlFor={`filter-${option.id}`}
                className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
              >
                {option.name}
              </label>
            </div>
          ))}
        </div>
      </div>
    </PopoverContent>
  </Popover>
);

const MarketAdminDashboard = () => {
  const navigate = useNavigate();
  const [currentQuotePage, setCurrentQuotePage] = useState(1);
  const [currentPolicyPage, setCurrentPolicyPage] = useState(1);
  const [currentReferralPage, setCurrentReferralPage] = useState(1);
  const [activeTab, setActiveTab] = useState('quotes');
  // Global State
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [productsList, setProductsList] = useState<{ id: string; name: string }[]>([]);
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

  // Quotes Tab State
  const [quoteSearchTerm, setQuoteSearchTerm] = useState('');
  const [quoteSelectedBroker, setQuoteSelectedBroker] = useState('all-brokers');
  const [quoteSelectedStatus, setQuoteSelectedStatus] = useState('all-statuses');

  // Referrals Tab State
  const [referralSearchTerm, setReferralSearchTerm] = useState('');
  const [referralSelectedBroker, setReferralSelectedBroker] = useState('all-brokers');
  const [referralSelectedInsurer, setReferralSelectedInsurer] = useState('all-insurers');
  const [referralSelectedStatus, setReferralSelectedStatus] = useState('all-statuses');

  // Policies Tab State
  const [policySearchTerm, setPolicySearchTerm] = useState('');

  // Separate date states for each tab
  const [quoteDateFrom, setQuoteDateFrom] = useState('');
  const [quoteDateTo, setQuoteDateTo] = useState('');
  const [referralDateFrom, setReferralDateFrom] = useState('');
  const [referralDateTo, setReferralDateTo] = useState('');
  const [policyDateFrom, setPolicyDateFrom] = useState('');
  const [policyDateTo, setPolicyDateTo] = useState('');
  const [activityViewType, setActivityViewType] = useState<'day' | 'month'>('day');
  const [gwpViewType, setGwpViewType] = useState<'day' | 'month'>('day');
  const itemsPerPage = 5;
  const [quotesData, setQuotesData] = useState<AdminDashboardQuotesResponse | null>(null);
  const [statisticsData, setStatisticsData] = useState<any>(null);
  const [statisticsError, setStatisticsError] = useState<any>('');
  const [policiesData, setPoliciesData] = useState<AdminDashboardPoliciesResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [policiesLoading, setPoliciesLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [policiesError, setPoliciesError] = useState<string | null>(null);
  const [filterListsLoading, setFilterListsLoading] = useState<boolean>(true);
  const [referralsData, setReferralsData] = useState<AdminDashboardReferralsResponse | null>(null);
  const [referralsLoading, setReferralsLoading] = useState<boolean>(false);
  const [referralsError, setReferralsError] = useState<string | null>(null);
  const [viewDetailsLoadingId, setViewDetailsLoadingId] = useState<string | null>(null);
  const [dayWiseActivityData, setDayWiseActivityData] = useState<ActivityData[]>([]);
  const [monthWiseActivityData, setMonthWiseActivityData] = useState<ActivityData[]>([]);
  const [dayWiseGWPData, setDayWiseGWPData] = useState<GWPData[]>([]);
  const [monthWiseGWPData, setMonthWiseGWPData] = useState<GWPData[]>([]);

  // Quotes Column Visibility
  const quoteColumns: ColumnDefinition[] = useMemo(() => [
    { id: 'quoteId', label: 'Quote ID', isMandatory: true },
    { id: 'broker', label: 'Broker', isMandatory: true },
    { id: 'productName', label: 'Product Name', isMandatory: true },
    { id: 'sumInsured', label: 'Sum Insured' },
    { id: 'premium', label: 'Premium' },
    { id: 'validUntil', label: 'Validity Date' },
    { id: 'status', label: 'Status', isMandatory: true },
    { id: 'createdAt', label: 'Created Date' },
    { id: 'action', label: 'Actions', isMandatory: true },
  ], []);

  const referralColumns: ColumnDefinition[] = useMemo(() => [
    { id: 'referralId', label: 'Referral ID', isMandatory: true },
    { id: 'quoteId', label: 'Quote ID', isMandatory: true },
    { id: 'broker', label: 'Broker', isMandatory: true },
    { id: 'product', label: 'Product', isMandatory: true },
    { id: 'status', label: 'Status', isMandatory: true },
    { id: 'reason', label: 'Reason' },
    { id: 'createdAt', label: 'Created At' },
    { id: 'action', label: 'Action', isMandatory: true },
  ], []);

  const policyColumns: ColumnDefinition[] = useMemo(() => [
    { id: 'policyNumber', label: 'Policy Number', isMandatory: true },
    { id: 'projectName', label: 'Product Name', isMandatory: true },
    { id: 'sumInsured', label: 'Sum Insured' },
    { id: 'premium', label: 'Premium' },
    { id: 'startDate', label: 'Start Date' },
    { id: 'endDate', label: 'End Date' },
    { id: 'action', label: 'Action', isMandatory: true },
  ], []);

  // Column Visibility Store Integration
  const { toggleColumnVisibility: storeToggle, getTableVisibility, setColumnVisibility } = useColumnVisibilityStore();

  // Force reset quotes columns to use new productName and correct order
  useEffect(() => {
    const currentColumns = getTableVisibility('admin-quotes', []);
    if (currentColumns.includes('projectName') || 
        (currentColumns.length > 0 && currentColumns[3] === 'status')) { // Check if old order
      // Clear the old cache and set new default with correct order
      setColumnVisibility('admin-quotes', quoteColumns.map(c => c.id));
    }
  }, []); // Run only once on mount

  const visibleQuoteColumns = getTableVisibility('admin-quotes', quoteColumns.map(c => c.id));
  const visiblePolicyColumns = getTableVisibility('admin-policies', policyColumns.map(c => c.id));
  const visibleReferralColumns = getTableVisibility('admin-referrals', referralColumns.map(c => c.id));

  const toggleColumnVisibility = (tableId: string, columnId: string, defaultVisible: string[]) => {
    storeToggle(tableId, columnId, defaultVisible);
  };

  // Filter Lists
  const [insurersList, setInsurersList] = useState<{ id: string; name: string }[]>([]);
  const [brokersList, setBrokersList] = useState<{ id: string; name: string }[]>([]);
  const [productSearchQuery, setProductSearchQuery] = useState('');

  useEffect(() => {
    const fetchFilters = async () => {
      setFilterListsLoading(true);
      try {
        const results = await Promise.allSettled([
          listInsurers({ limit: 100 }),
          listBrokersViaManagement('default', { limit: 100 }),
          getAdminDashboardProducts(),
          listMasterCountries(),
          listMasterRegions(),
          listMasterZones(),
        ]);

        const [insurersRes, brokersRes, productsRes, countriesRes, regionsRes, zonesRes] = results;

        if (insurersRes.status === 'fulfilled') {
          setInsurersList(insurersRes.value.data.map((i) => ({ id: i.id, name: i.name })));
        } else {
          console.error('Failed to fetch insurers:', insurersRes.reason);
        }

        if (brokersRes.status === 'fulfilled') {
          setBrokersList(brokersRes.value.data.map((b) => ({ id: b.id, name: b.name })));
        } else {
          console.error('Failed to fetch brokers:', brokersRes.reason);
        }

        if (productsRes.status === 'fulfilled') {
          const productsItems = parseDashboardProductPayload(productsRes.value);

          setDashboardProducts(productsItems);

          // Map to standard { id, name } format with fallbacks for different field names
          const formattedProducts = productsItems
            .filter((p) => p && typeof p === 'object')
            .map((p: any) => ({
              id: String(p.id || p.productId || p.product_id || p._id || ''),
              name: String(
                p.name ||
                p.productName ||
                p.product_name ||
                p.label ||
                p.title ||
                'Unknown Product',
              ),
            }))
            .filter((p) => p.id); // Ensure we have an ID

          setProductsList(formattedProducts);
        } else {
          console.error('Failed to fetch products:', productsRes.reason);
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
          console.error('Failed to fetch countries:', countriesRes.reason);
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
          console.error('Failed to fetch regions:', regionsRes.reason);
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
          console.error('Failed to fetch zones:', zonesRes.reason);
        }
      } catch (error) {
        console.error('Unexpected error in fetchFilters:', error);
      } finally {
        setFilterListsLoading(false);
      }
    };
    fetchFilters();
  }, []);

  const filteredProductsList = useMemo(() => {
    if (!productSearchQuery.trim()) return productsList;
    const query = productSearchQuery.toLowerCase();
    return productsList.filter(
      (p) => p.name.toLowerCase().includes(query) || p.id.toLowerCase().includes(query),
    );
  }, [productsList, productSearchQuery]);

  const productNameById = useMemo(
    () => new Map(productsList.map((product) => [product.id, product.name])),
    [productsList],
  );

  const selectedProductLabel = useMemo(() => {
    if (selectedProducts.length === 0) return 'all products';
    if (selectedProducts.length === 1) {
      return productNameById.get(selectedProducts[0]) || 'the selected product';
    }
    return `${selectedProducts.length} selected products`;
  }, [productNameById, selectedProducts]);

  const heatmapLocations = useMemo(() => {
    const built = buildHeatmapLocations(
      dashboardProducts,
      selectedProducts,
      statisticsData?.data?.totalQuotes ?? 0,
      statisticsData?.data?.totalPolicies ?? 0,
      masterCountries,
      masterRegions,
      masterZones,
    );
    return heatmapLocationsWithFallback(built);
  }, [
    dashboardProducts,
    masterCountries,
    masterRegions,
    masterZones,
    selectedProducts,
    statisticsData?.data?.totalPolicies,
    statisticsData?.data?.totalQuotes,
  ]);

  const sumInsuredCardDisplay = useMemo(
    () => resolveSumInsuredForDisplay(statisticsData?.data),
    [statisticsData?.data],
  );

  const isInDateRange = (
    createdAt: string | null | undefined,
    updatedAt: string | null | undefined,
    fromDateStr: string,
    toDateStr: string,
  ) => {
    if (!fromDateStr && !toDateStr) return true;

    const dates: Date[] = [];

    if (createdAt) {
      const d = new Date(createdAt);
      if (!isNaN(d.getTime())) dates.push(d);
    }

    if (updatedAt) {
      const d = new Date(updatedAt);
      if (!isNaN(d.getTime())) dates.push(d);
    }

    // If we don't have any valid dates on the record, don't filter it out by date
    if (!dates.length) return true;

    const fromDate = fromDateStr ? new Date(fromDateStr) : null;
    const toDate = toDateStr ? new Date(`${toDateStr}T23:59:59.999Z`) : null;

    return dates.some((d) => {
      const afterFrom = !fromDate || d >= fromDate;
      const beforeTo = !toDate || d <= toDate;
      return afterFrom && beforeTo;
    });
  };

  useEffect(() => {
    (async () => {
      try {
        const params: any = {};
        if (selectedProducts && selectedProducts.length > 0) {
          params.productId = selectedProducts;
        }

        const data = await getAdminDashboardStatistics(params);
        setStatisticsData(data);
        setDayWiseActivityData(data?.data?.charts?.activityOverview.day);
        setMonthWiseActivityData(data?.data?.charts?.activityOverview?.month);
        setDayWiseGWPData(data?.data?.charts?.gwpPerformance?.day);
        setMonthWiseGWPData(data?.data?.charts?.gwpPerformance?.month);
      } catch (err: any) {
        setStatisticsError(err?.message || 'Failed to load dashboard statistics');
      }
    })();
  }, [selectedProducts]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        // Skip API calls in demo mode - use mock data instead
        const isDemo = isDemoMode();
        const token = getAuthToken();
        const isDemoToken =
          token && (token.startsWith('dummy-') || token.startsWith('demo-token-'));

        const params: any = {
          page: currentQuotePage,
          limit: itemsPerPage,
        };

        if (quoteSearchTerm) params.search = quoteSearchTerm;
        if (quoteSelectedBroker && quoteSelectedBroker !== 'all-brokers')
          params.brokerId = quoteSelectedBroker;

        if (quoteSelectedStatus && quoteSelectedStatus !== 'all-statuses')
          params.status = quoteSelectedStatus;

        if (selectedProducts && selectedProducts.length > 0) {
          params.productId = selectedProducts;
        }

        if (quoteDateFrom) params.startDate = quoteDateFrom;
        if (quoteDateTo) params.endDate = quoteDateTo;

        const data = await getAdminDashboardQuotes(params);
        if (!mounted) return;
        setQuotesData(data);
      } catch (err: any) {
        if (!mounted) return;
        setLoadError(err?.message || 'Failed to load dashboard quotes');
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [
    currentQuotePage,
    itemsPerPage,
    quoteSearchTerm,
    quoteSelectedBroker,
    quoteSelectedStatus,
    selectedProducts,
    quoteDateFrom,
    quoteDateTo,
  ]);

  // Load policies data
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setPoliciesLoading(true);
        setPoliciesError(null);

        // Skip API calls in demo mode - use mock data instead
        const isDemo = isDemoMode();
        const token = getAuthToken();
        const isDemoToken =
          token && (token.startsWith('dummy-') || token.startsWith('demo-token-'));

        if (isDemo || isDemoToken) {
          // Use mock data for demo mode
          if (!mounted) return;
          setPoliciesData({
            data: [],
            meta: {
              total: 0,
              page: 1,
              limit: 10,
              totalPages: 1,
            },
          });
          setPoliciesLoading(false);
          return;
        }

        const params: any = {
          page: currentPolicyPage,
          limit: itemsPerPage,
        };

        if (policySearchTerm) params.search = policySearchTerm;

        // Use policy-specific filters if they existed in UI, currently only search and date
        if (selectedProducts && selectedProducts.length > 0) {
          params.productId = selectedProducts;
        }

        if (policyDateFrom) params.startDate = policyDateFrom;
        if (policyDateTo) params.endDate = policyDateTo;

        const data = await getAdminDashboardPolicies(params);
        if (!mounted) return;
        setPoliciesData(data);
      } catch (err: any) {
        if (!mounted) return;
        setPoliciesError(err?.message || 'Failed to load dashboard policies');
      } finally {
        if (mounted) setPoliciesLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [
    currentPolicyPage,
    itemsPerPage,
    policySearchTerm,
    policyDateFrom,
    policyDateTo,
    selectedProducts,
  ]);

  // Load referrals data
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setReferralsLoading(true);
        setReferralsError(null);

        const isDemo = isDemoMode();
        const token = getAuthToken();
        const isDemoToken =
          token && (token.startsWith('dummy-') || token.startsWith('demo-token-'));

        if (isDemo || isDemoToken) {
          if (!mounted) return;
          setReferralsData({
            data: [],
            meta: {
              total: 0,
              page: 1,
              limit: 10,
              totalPages: 1,
            },
          });
          setReferralsLoading(false);
          return;
        }

        const params: any = {
          page: currentReferralPage,
          limit: itemsPerPage,
        };

        if (referralSearchTerm) params.search = referralSearchTerm;
        if (referralSelectedBroker && referralSelectedBroker !== 'all-brokers')
          params.brokerId = referralSelectedBroker;
        if (referralSelectedInsurer && referralSelectedInsurer !== 'all-insurers')
          params.insurerId = referralSelectedInsurer;
        if (referralSelectedStatus && referralSelectedStatus !== 'all-statuses')
          params.status = referralSelectedStatus;

        if (selectedProducts && selectedProducts.length > 0) {
          params.productId = selectedProducts;
        }

        if (referralDateFrom) params.startDate = referralDateFrom;
        if (referralDateTo) params.endDate = referralDateTo;

        const data = await getAdminDashboardReferrals(params);
        if (!mounted) return;
        setReferralsData(data);
      } catch (err: any) {
        if (!mounted) return;
        setReferralsError(err?.message || 'Failed to load dashboard referrals');
      } finally {
        if (mounted) setReferralsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [
    currentReferralPage,
    itemsPerPage,
    referralSearchTerm,
    referralSelectedBroker,
    referralSelectedInsurer,
    referralSelectedStatus,
    selectedProducts,
    referralDateFrom,
    referralDateTo,
  ]);

  // Get unique values for filters
  const recentQuotes = quotesData?.recentQuotes || [];
  // Use fetched lists instead of derived ones
  const uniqueBrokers = brokersList;
  const uniqueInsurers = insurersList;

  // Products from Product Studio
  const productFactoryProducts = [];
  // Merge unique products from data with Product Studio products, prioritizing Product Studio
  // const allProducts = [...new Set([...productFactoryProducts, ...uniqueProducts])];
  const allProducts = [];
  const quoteStatusOptions = [
    'draft',
    'in_progress',
  ] as string[];

  const referrals = referralsData?.data || [];
  const referralStatusOptions = [...new Set(referrals.map((r) => r.status))].filter(
    Boolean,
  ) as string[];

  // Filter quotes based on search and filters
  const filteredQuotes = recentQuotes.filter((quote) => {
    // API handles search and filters
    // const matchesBroker = quoteSelectedBroker === 'all-brokers' || quote.broker_name === quoteSelectedBroker;
    const matchesStatus =
      quoteSelectedStatus === 'all-statuses' || quote.status === quoteSelectedStatus;
    const matchesProduct =
      selectedProducts.length === 0 ||
      (quote.product_id && selectedProducts.includes(quote.product_id));

    const matchesDateRange = isInDateRange(
      quote.created_at,
      (quote as any).updated_at,
      quoteDateFrom,
      quoteDateTo,
    );

    return matchesStatus && matchesProduct && matchesDateRange;
  });

  // Map policies data from API
  const recentPolicies = useMemo(() => {
    try {
      if (!policiesData?.data || !Array.isArray(policiesData.data)) {
        return [];
      }
      return policiesData.data.map((p) => ({
        id: p.id,
        policyNumber: p.policyNumber,
        projectName: p.projectName || p.productName || '',
        projectType: 'Construction', // Default since not provided in API
        insurer: p.insurerName || '-',
        sumInsured: formatCurrencyLocale(p.sumInsured, (p as any).currency ?? 'AED'),
        premium: formatCurrencyLocale(p.premium, (p as any).currency ?? 'AED'),
        startDate: formatDateShort(p.startDate),
        endDate: formatDateShort(p.endDate),
        createdAtRaw: (p as any).createdAt ?? p.startDate,
        updatedAtRaw: (p as any).updatedAt ?? p.endDate ?? p.startDate,
        broker: 'Admin', // Default for admin view
      }));
    } catch (error) {
      console.error('Error mapping policies data:', error);
      return [];
    }
  }, [policiesData]);

  // Filter policies based on search and filters
  const filteredPolicies = recentPolicies.filter((policy) => {
    // API handles search
    const matchesDateRange = isInDateRange(
      policy.createdAtRaw,
      policy.updatedAtRaw,
      policyDateFrom,
      policyDateTo,
    );

    return matchesDateRange;
  });

  // Filter referrals based on search and filters
  const filteredReferrals = referrals.filter((referral) => {
    // API handles search and filters
    // const matchesBroker = referralSelectedBroker === 'all-brokers' || referral.broker === referralSelectedBroker;
    // const matchesInsurer =
    //   referralSelectedInsurer === 'all-insurers' || referral.insurer === referralSelectedInsurer;
    const matchesStatus =
      referralSelectedStatus === 'all-statuses' || referral.status === referralSelectedStatus;

    const matchesDateRange = isInDateRange(
      referral.createdAt,
      (referral as any).updatedAt,
      referralDateFrom,
      referralDateTo,
    );

    return matchesStatus && matchesDateRange;
  });

  // Pagination calculations for quotes
  const mappedQuotes = filteredQuotes.map((q) => ({
    id: q.id,
    broker: q.broker_name,
    productName: q.project_name,
    sumInsured: formatCurrencyLocale(q.sum_insured, q.currency ?? 'AED'),
    premium: formatCurrencyLocale(q.base_premium ?? q.total_premium, q.currency ?? 'AED'),
    status: q.status,
    validUntil: formatDateShort(q.validity_date),
    createdAt: formatDateShort(q.created_at),
    quoteId: q.quote_number,
  }));
  const activeQuotes = filterActiveQuotes(mappedQuotes);
  // Pagination for quotes
  const currentQuotes = activeQuotes;
  const totalQuotePages = quotesData?.totalPages ?? 1;

  // Pagination for policies
  const currentPolicies = filteredPolicies;
  const totalPolicyPages = policiesData?.meta?.totalPages ?? 1;
  const totalPolicies = policiesData?.meta?.total ?? 0;

  // Pagination for referrals
  const currentReferrals = filteredReferrals;
  const totalReferralPages = referralsData?.meta?.totalPages ?? 1;
  const totalReferrals = referralsData?.meta?.total ?? 0;

  const clearFilters = () => {
    // Quotes
    setQuoteSearchTerm('');
    setQuoteSelectedBroker('all-brokers');

    setQuoteSelectedStatus('all-statuses');
    setQuoteDateFrom('');
    setQuoteDateTo('');

    // Referrals
    setReferralSearchTerm('');
    setReferralSelectedBroker('all-brokers');
    setReferralSelectedInsurer('all-insurers');
    setReferralSelectedStatus('all-statuses');
    setReferralDateFrom('');
    setReferralDateTo('');

    // Policies
    setPolicySearchTerm('');

    setPolicyDateFrom('');
    setPolicyDateTo('');

    // Global
    setSelectedProducts([]);
  };

  const hasActiveQuoteFilters = useMemo(
    () =>
      quoteSearchTerm.trim().length > 0 ||
      quoteSelectedBroker !== 'all-brokers' ||
      quoteSelectedStatus !== 'all-statuses' ||
      Boolean(quoteDateFrom) ||
      Boolean(quoteDateTo) ||
      selectedProducts.length > 0,
    [
      quoteSearchTerm,
      quoteSelectedBroker,
      quoteSelectedStatus,
      quoteDateFrom,
      quoteDateTo,
      selectedProducts,
    ],
  );

  const hasActiveReferralFilters = useMemo(
    () =>
      referralSearchTerm.trim().length > 0 ||
      referralSelectedBroker !== 'all-brokers' ||
      referralSelectedInsurer !== 'all-insurers' ||
      referralSelectedStatus !== 'all-statuses' ||
      Boolean(referralDateFrom) ||
      Boolean(referralDateTo) ||
      selectedProducts.length > 0,
    [
      referralSearchTerm,
      referralSelectedBroker,
      referralSelectedInsurer,
      referralSelectedStatus,
      referralDateFrom,
      referralDateTo,
      selectedProducts,
    ],
  );

  const hasActivePolicyFilters = useMemo(
    () =>
      policySearchTerm.trim().length > 0 ||
      Boolean(policyDateFrom) ||
      Boolean(policyDateTo) ||
      selectedProducts.length > 0,
    [policySearchTerm, policyDateFrom, policyDateTo, selectedProducts],
  );

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setCurrentQuotePage(1);
    setCurrentPolicyPage(1);
    setCurrentReferralPage(1);
  };

  const handleExportExcelQuotes = async () => {
    try {
      const params: any = {};

      if (quoteSearchTerm) params.search = quoteSearchTerm;
      if (quoteSelectedBroker && quoteSelectedBroker !== 'all-brokers')
        params.brokerId = quoteSelectedBroker;

      if (quoteSelectedStatus && quoteSelectedStatus !== 'all-statuses')
        params.status = quoteSelectedStatus;

      if (selectedProducts && selectedProducts.length > 0) {
        params.productId = selectedProducts;
      }

      if (quoteDateFrom) params.startDate = quoteDateFrom;
      if (quoteDateTo) params.endDate = quoteDateTo;

      // Add selected columns as comma-separated string in original order (exclude action columns)
      if (visibleQuoteColumns && visibleQuoteColumns.length > 0) {
        // Sort columns according to their original order in quoteColumns definition
        const orderedColumns = quoteColumns
          .map(col => col.id)
          .filter(colId => visibleQuoteColumns.includes(colId) && colId !== 'action');
        params.columns = orderedColumns.join(',');
      }

      toast.loading('Exporting quotes...', { id: 'export-quotes' });
      const blob = await exportAdminDashboardQuotes(params);

      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `market_dashboard_quotes_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.dismiss('export-quotes');
      toast.success('Quotes exported successfully');
    } catch (err) {
      console.error('Export failed', err);
      toast.dismiss('export-quotes');
      toast.error('Failed to export quotes');
    }
  };

  const handleExportExcelPolicies = async () => {
    try {
      const params: any = {};

      if (policySearchTerm) params.search = policySearchTerm;

      if (selectedProducts && selectedProducts.length > 0) {
        params.productId = selectedProducts;
      }

      if (policyDateFrom) params.startDate = policyDateFrom;
      if (policyDateTo) params.endDate = policyDateTo;

      // Add selected columns as comma-separated string in original order (exclude action columns)
      if (visiblePolicyColumns && visiblePolicyColumns.length > 0) {
        // Sort columns according to their original order in policyColumns definition
        const orderedColumns = policyColumns
          .map(col => col.id)
          .filter(colId => visiblePolicyColumns.includes(colId) && colId !== 'action');
        params.columns = orderedColumns.join(',');
      }

      toast.loading('Exporting policies...', { id: 'export-policies' });
      const blob = await exportAdminDashboardPolicies(params);

      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `market_dashboard_policies_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.dismiss('export-policies');
      toast.success('Policies exported successfully');
    } catch (err) {
      console.error('Export failed', err);
      toast.dismiss('export-policies');
      toast.error('Failed to export policies');
    }
  };

  const handleExportExcelReferrals = async () => {
    try {
      const params: any = {};

      if (referralSearchTerm) params.search = referralSearchTerm;
      if (referralSelectedBroker && referralSelectedBroker !== 'all-brokers')
        params.brokerId = referralSelectedBroker;
      if (referralSelectedInsurer && referralSelectedInsurer !== 'all-insurers')
        params.insurerId = referralSelectedInsurer;
      if (referralSelectedStatus && referralSelectedStatus !== 'all-statuses')
        params.status = referralSelectedStatus;

      if (selectedProducts && selectedProducts.length > 0) {
        params.productId = selectedProducts;
      }

      if (referralDateFrom) params.startDate = referralDateFrom;
      if (referralDateTo) params.endDate = referralDateTo;

      // Add selected columns as comma-separated string in original order (exclude action columns)
      if (visibleReferralColumns && visibleReferralColumns.length > 0) {
        // Sort columns according to their original order in referralColumns definition
        const orderedColumns = referralColumns
          .map(col => col.id)
          .filter(colId => visibleReferralColumns.includes(colId) && colId !== 'action');
        params.columns = orderedColumns.join(',');
      }

      toast.loading('Exporting referrals...', { id: 'export-referrals' });
      const blob = await exportAdminDashboardReferrals(params);

      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `market_dashboard_referrals_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.dismiss('export-referrals');
      toast.success('Referrals exported successfully');
    } catch (err) {
      console.error('Export failed', err);
      toast.dismiss('export-referrals');
      toast.error('Failed to export referrals');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex flex-col cityscape-bg">
      <div className="flex-1 p-6">
        <div className="w-full px-4">
          {/* Header with Product Filter */}
          <div className="mb-8">
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
                              ? `${productsList.find((p) => p.id === selectedProducts[0])?.name || selectedProducts[0]} Dashboard`
                              : 'Selected Products Dashboard'
                        }
                      >
                        {selectedProducts.length === 0
                          ? 'All Products Dashboard'
                          : selectedProducts.length === 1
                            ? `${productsList.find((p) => p.id === selectedProducts[0])?.name || selectedProducts[0]} Dashboard`
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
                              const allFilteredIds = filteredProductsList.map((p) => p.id);
                              setSelectedProducts((prev) => {
                                const newSet = new Set([...prev, ...allFilteredIds]);
                                return Array.from(newSet);
                              });
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
                      {filterListsLoading ? (
                        <div className="text-center py-4 text-sm text-muted-foreground italic">
                          Loading products...
                        </div>
                      ) : filteredProductsList.length > 0 ? (
                        filteredProductsList.map((product) => (
                          <div
                            key={product.id}
                            className="flex items-center space-x-2 p-1 hover:bg-muted/50 rounded-md transition-colors cursor-pointer"
                            onClick={() => {
                              setSelectedProducts((prev) =>
                                prev.includes(product.id)
                                  ? prev.filter((id) => id !== product.id)
                                  : [...prev, product.id],
                              );
                            }}
                          >
                            <Checkbox
                              id={`header-product-${product.id}`}
                              checked={selectedProducts.includes(product.id)}
                              onCheckedChange={() => { }} // Handled by div click
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
            <p className="text-muted-foreground mt-2">
              Comprehensive insurance marketplace management
            </p>
            {selectedProducts.length > 0 && (
              <div className="mt-3 flex max-w-[min(90vw,42rem)] flex-wrap gap-2">
                {selectedProducts.map((productId) => {
                  const productName =
                    productsList.find((product) => product.id === productId)?.name || productId;

                  return (
                    <Badge
                      key={productId}
                      variant="secondary"
                      className="flex max-w-[220px] items-center gap-1.5 px-2.5 py-1 text-xs"
                      title={productName}
                    >
                      <span className="truncate">{productName}</span>
                      <button
                        type="button"
                        className="shrink-0 rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-background/70 hover:text-foreground"
                        onClick={() =>
                          setSelectedProducts((prev) => prev.filter((id) => id !== productId))
                        }
                        aria-label={`Remove ${productName}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          <MarketAdminHeatMap
            locations={heatmapLocations}
            selectedProductLabel={selectedProductLabel}
            isAllProductsView={selectedProducts.length === 0}
            masterCountries={masterCountries}
            masterRegions={masterRegions}
            masterZones={masterZones}
          />

          {/* Stats Cards - Full Width */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statisticsError ? (
              <Card className="hover-scale">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">{statisticsError}</div>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className="hover-scale">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          Total Quotes
                        </p>
                        <p className="text-3xl font-bold text-foreground">
                          {statisticsData?.data?.totalQuotes ?? 0}
                        </p>
                      </div>
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <FileText className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="hover-scale">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          Total Policies
                        </p>
                        <p className="text-3xl font-bold text-foreground">
                          {statisticsData?.data?.totalPolicies ?? 0}
                        </p>
                      </div>
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <Shield className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="hover-scale">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          Total Premium Value
                        </p>
                        <p className="text-2xl font-bold text-foreground">
                          {formatCurrencyCompactMillions(
                            statisticsData?.data?.totalValue || 0,
                            statisticsData?.data?.totalValueCurrency || 'AED',
                          )}
                        </p>
                      </div>
                      <div className="p-3 bg-accent/10 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-accent" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="hover-scale">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          Total Sum Insured
                        </p>
                        <p className="text-2xl font-bold text-foreground">
                          {sumInsuredCardDisplay.currency}{' '}
                          {formatNumberCompactMillions(sumInsuredCardDisplay.value)}
                        </p>
                      </div>
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <Banknote className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Activity Chart */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div>
                      <CardTitle className="text-lg font-semibold">Activity Overview</CardTitle>
                      <CardDescription>Quotes and policies trends</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-primary/5 rounded-lg p-1 border border-primary/10">
                    <Button
                      size="sm"
                      variant={activityViewType === 'day' ? 'default' : 'ghost'}
                      onClick={() => setActivityViewType('day')}
                      className={`h-8 px-3 text-xs transition-all ${activityViewType === 'day'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-primary/60 hover:text-primary hover:bg-primary/10'
                        }`}
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      Day
                    </Button>
                    <Button
                      size="sm"
                      variant={activityViewType === 'month' ? 'default' : 'ghost'}
                      onClick={() => setActivityViewType('month')}
                      className={`h-8 px-3 text-xs transition-all ${activityViewType === 'month'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-primary/60 hover:text-primary hover:bg-primary/10'
                        }`}
                    >
                      <Calendar className="w-3 h-3 mr-1" />
                      Month
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-4 pt-6">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={activityViewType === 'day' ? dayWiseActivityData : monthWiseActivityData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis
                      dataKey="period"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      className="text-muted-foreground"
                    />
                    <YAxis
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      className="text-muted-foreground"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="quotes"
                      fill="hsl(var(--primary))"
                      name="Quotes"
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar
                      dataKey="policies"
                      fill="hsl(var(--primary) / 0.6)"
                      name="Policies"
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* GWP Chart */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div>
                      <CardTitle className="text-lg font-semibold">GWP Performance</CardTitle>
                      <CardDescription>Gross Written Premium trends</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-primary/5 rounded-lg p-1 border border-primary/10">
                    <Button
                      size="sm"
                      variant={gwpViewType === 'day' ? 'default' : 'ghost'}
                      onClick={() => setGwpViewType('day')}
                      className={`h-8 px-3 text-xs transition-all ${gwpViewType === 'day'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-primary/60 hover:text-primary hover:bg-primary/10'
                        }`}
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      Day
                    </Button>
                    <Button
                      size="sm"
                      variant={gwpViewType === 'month' ? 'default' : 'ghost'}
                      onClick={() => setGwpViewType('month')}
                      className={`h-8 px-3 text-xs transition-all ${gwpViewType === 'month'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-primary/60 hover:text-primary hover:bg-primary/10'
                        }`}
                    >
                      <Calendar className="w-3 h-3 mr-1" />
                      Month
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-4 pt-6">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={gwpViewType === 'day' ? dayWiseGWPData : monthWiseGWPData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis
                      dataKey="period"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      className="text-muted-foreground"
                    />
                    <YAxis
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      className="text-muted-foreground"
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      formatter={(value, name) => [
                        `AED ${Number(value).toLocaleString()}`,
                        name === 'gwp' ? 'GWP' : name === 'commission' ? 'Commission' : name,
                      ]}
                    />
                    <Legend />
                    <Bar
                      dataKey="gwp"
                      fill="hsl(var(--primary))"
                      name="GWP"
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar
                      dataKey="commission"
                      fill="hsl(var(--primary) / 0.6)"
                      name="Commission"
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Quotes and Policies Tabs - Outside Container */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 bg-primary/5 p-1 h-12">
              <TabsTrigger
                value="quotes"
                className="data-[state=active]:text-primary data-[state=active]:bg-background data-[state=active]:shadow-sm h-10"
              >
                <FileText className="w-4 h-4 mr-2" />
                All Quotes ({quotesData?.totalQuotes ?? 0})
              </TabsTrigger>
              <TabsTrigger
                value="referrals"
                className="data-[state=active]:text-primary data-[state=active]:bg-background data-[state=active]:shadow-sm h-10"
              >
                <Send className="w-4 h-4 mr-2" />
                Referrals ({totalReferrals})
              </TabsTrigger>
              <TabsTrigger
                value="policies"
                className="data-[state=active]:text-primary data-[state=active]:bg-background data-[state=active]:shadow-sm h-10"
              >
                <Shield className="w-4 h-4 mr-2" />
                All Policies ({totalPolicies})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="quotes" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>All Quote Requests</CardTitle>
                  <CardDescription>
                    View and manage quote requests from all brokers across the market
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="search-filter-container mb-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                          <Input
                            placeholder="Search by product name, Quote Id, Broker name etc..."
                            value={quoteSearchTerm}
                            onChange={(e) => {
                              setQuoteSearchTerm(e.target.value);
                              setCurrentQuotePage(1);
                            }}
                            className="pl-10 h-10 w-full bg-background hover:border-primary transition-colors"
                          />
                        </div>

                        <Select
                          value={quoteSelectedStatus}
                          onValueChange={(val) => {
                            setQuoteSelectedStatus(val);
                            setCurrentQuotePage(1);
                          }}
                        >
                          <SelectTrigger className="h-10 w-full bg-background hover:bg-background hover:text-foreground hover:border-primary transition-colors">
                            <SelectValue placeholder="All Statuses" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all-statuses">All Statuses</SelectItem>
                            {quoteStatusOptions.map((status) => (
                              <SelectItem key={status} value={status}>
                                {getQuoteStatusLabel(status)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select
                          value={quoteSelectedBroker}
                          onValueChange={(val) => {
                            setQuoteSelectedBroker(val);
                            setCurrentQuotePage(1);
                          }}
                        >
                          <SelectTrigger className="h-10 w-full bg-background hover:bg-background hover:text-foreground hover:border-primary transition-colors">
                            <SelectValue placeholder="All Brokers" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all-brokers">All Brokers</SelectItem>
                            {uniqueBrokers.map((broker) => (
                              <SelectItem key={broker.id} value={broker.id}>
                                {broker.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:gap-3">
                        <div className="flex min-w-0 w-full flex-1 flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-2">
                          <div className="min-h-10 min-w-0 flex-1 basis-0 sm:min-w-[140px]">
                            <DatePicker
                              className="w-full h-10 bg-background hover:bg-background hover:text-foreground hover:border-primary transition-colors"
                              placeholder="Start Date"
                              value={quoteDateFrom || undefined}
                              onChange={(date) => {
                                setQuoteDateFrom(date || '');
                                setCurrentQuotePage(1);
                              }}
                              max={getPrevDate(quoteDateTo) || undefined}
                            />
                          </div>
                          <div className="min-h-10 min-w-0 flex-1 basis-0 sm:min-w-[140px]">
                            <DatePicker
                              className="w-full h-10 bg-background hover:bg-background hover:text-foreground hover:border-primary transition-colors"
                              placeholder="End Date"
                              value={quoteDateTo || undefined}
                              onChange={(date) => {
                                setQuoteDateTo(date || '');
                                setCurrentQuotePage(1);
                              }}
                              min={getNextDate(quoteDateFrom) || undefined}
                            />
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <Button
                            variant="outline"
                            onClick={clearFilters}
                            disabled={!hasActiveQuoteFilters}
                            title={!hasActiveQuoteFilters ? 'No filters applied' : undefined}
                            className="flex h-10 shrink-0 items-center gap-2 bg-background hover:bg-background hover:text-foreground hover:border-primary transition-colors"
                          >
                            <Filter className="w-4 h-4" />
                            Clear Filters
                          </Button>
                          <ColumnVisibilityDropdown
                            columns={quoteColumns}
                            visibleColumns={visibleQuoteColumns}
                            onToggleColumn={(id) => toggleColumnVisibility('admin-quotes', id, quoteColumns.map(c => c.id))}
                            onReset={() => useColumnVisibilityStore.getState().setColumnVisibility('admin-quotes', quoteColumns.map(c => c.id))}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportExcelQuotes}
                            className="h-10 shrink-0 gap-2"
                          >
                            <Upload className="w-4 h-4" />
                            Export Excel
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {isLoading ? (
                    <Table>
                      <TableBody>
                        <TableSkeleton rowCount={6} colCount={visibleQuoteColumns.length} />
                      </TableBody>
                    </Table>
                  ) : loadError ? (
                    <div className="rounded-md border border-destructive/20 bg-destructive/10 text-destructive px-3 py-2">
                      {loadError}
                    </div>
                  ) : (
                    <>
                      <div className="mt-8 overflow-x-auto table-scrollbars">
                        <Table
                          equalColumns
                          columnCount={visibleQuoteColumns.length}
                          minColumnWidth={150}
                        >
                          <TableHeader>
                            <TableRow>
                              {visibleQuoteColumns.includes('quoteId') && <TableHead>Quote ID</TableHead>}
                              {visibleQuoteColumns.includes('broker') && <TableHead>Broker</TableHead>}
                              {visibleQuoteColumns.includes('productName') && <TableHead>Product Name</TableHead>}
                              {visibleQuoteColumns.includes('sumInsured') && <TableHead>Sum Insured</TableHead>}
                              {visibleQuoteColumns.includes('premium') && <TableHead>Premium</TableHead>}
                              {visibleQuoteColumns.includes('validUntil') && <TableHead>Validity Date</TableHead>}
                              {visibleQuoteColumns.includes('status') && <TableHead>Status</TableHead>}
                              {visibleQuoteColumns.includes('createdAt') && <TableHead>Created Date</TableHead>}
                              {visibleQuoteColumns.includes('action') && <TableHead className="text-center">Actions</TableHead>}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {currentQuotes.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={visibleQuoteColumns.length} className="text-center text-muted-foreground py-8">
                                  No quotes found matching your filters.
                                </TableCell>
                              </TableRow>
                            ) : (
                              currentQuotes.map((quote, index) => (
                                <TableRow
                                  key={`${quote.id}-${quote.quoteId || 'quote'}-${index}`}
                                  className="cursor-pointer hover:bg-muted/50"
                                >
                                  {visibleQuoteColumns.includes('quoteId') && <TableCell className="font-medium">{quote.quoteId}</TableCell>}
                                  {visibleQuoteColumns.includes('broker') && (
                                    <TableCell className="font-medium text-primary">
                                      {quote.broker}
                                    </TableCell>
                                  )}
                                  {visibleQuoteColumns.includes('productName') && <TableCell>{quote.productName}</TableCell>}
                                  {visibleQuoteColumns.includes('sumInsured') && <TableCell className="font-medium">{quote.sumInsured}</TableCell>}
                                  {visibleQuoteColumns.includes('premium') && (
                                    <TableCell className="font-medium text-primary">
                                      {quote.premium}
                                    </TableCell>
                                  )}
                                  {visibleQuoteColumns.includes('validUntil') && (
                                    <TableCell className="text-sm text-muted-foreground">
                                      {quote.validUntil}
                                    </TableCell>
                                  )}
                                  {visibleQuoteColumns.includes('status') && (
                                    <TableCell>
                                      <QuoteStatusDot status={quote.status} />
                                    </TableCell>
                                  )}
                                  {visibleQuoteColumns.includes('createdAt') && (
                                    <TableCell className="text-sm text-muted-foreground">
                                      {quote.createdAt}
                                    </TableCell>
                                  )}
                                  {visibleQuoteColumns.includes('action') && (
                                    <TableCell className="text-center">
                                      <div className="flex gap-2 justify-center">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          disabled={viewDetailsLoadingId === quote.id}
                                          onClick={async () => {
                                            setViewDetailsLoadingId(quote.id);
                                            try {
                                              const details = await getQuoteDashboardById(quote.id);
                                              navigate(`/market-admin/quote/${quote.id}`, {
                                                state: { quoteDashboard: details },
                                              });
                                            } catch {
                                              navigate(`/market-admin/quote/${quote.id}`);
                                            } finally {
                                              setViewDetailsLoadingId(null);
                                            }
                                          }}
                                        >
                                          <Eye className="w-4 h-4 mr-1" />
                                          View Details
                                        </Button>
                                        {(quote.status === QUOTE_STATUSES.POLICY_GENERATED ||
                                          quote.status === QUOTE_STATUSES.PAYMENT_PENDING) && (
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              disabled={viewDetailsLoadingId === quote.id}
                                              onClick={async () => {
                                                setViewDetailsLoadingId(quote.id);
                                                try {
                                                  const details = await getQuoteDashboardById(quote.id);
                                                  navigate(`/market-admin/quote/${quote.id}`, {
                                                    state: { quoteDashboard: details },
                                                  });
                                                } catch {
                                                  navigate(`/market-admin/quote/${quote.id}`);
                                                } finally {
                                                  setViewDetailsLoadingId(null);
                                                }
                                              }}
                                            >
                                              View Policy
                                            </Button>
                                          )}
                                      </div>
                                    </TableCell>
                                  )}
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Quotes Pagination */}
                      <div className="px-6 py-4 border-t">
                        <div className="text-sm text-muted-foreground mb-4">
                          Showing {currentQuotes.length} of {quotesData?.totalQuotes ?? 0} quotes
                          (Page {currentQuotePage} of {totalQuotePages})
                          {activeQuotes.length > totalQuotePages * itemsPerPage && (
                            <span className="ml-2 text-amber-600">
                              • Showing first {totalQuotePages * itemsPerPage} results
                            </span>
                          )}
                        </div>
                        <div className="ml-auto">
                          <Pagination className="w-auto justify-end">
                            <PaginationContent>
                              <PaginationItem>
                                <PaginationPrevious
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    if (currentQuotePage > 1)
                                      setCurrentQuotePage(currentQuotePage - 1);
                                  }}
                                  className={
                                    currentQuotePage === 1 ? 'pointer-events-none opacity-50' : ''
                                  }
                                />
                              </PaginationItem>
                              {(() => {
                                const maxPages = 5;
                                let startPage = 1;
                                let endPage = Math.min(maxPages, totalQuotePages);

                                if (totalQuotePages > maxPages) {
                                  if (currentQuotePage <= 3) {
                                    startPage = 1;
                                    endPage = maxPages;
                                  } else if (currentQuotePage >= totalQuotePages - 2) {
                                    startPage = totalQuotePages - maxPages + 1;
                                    endPage = totalQuotePages;
                                  } else {
                                    startPage = currentQuotePage - 2;
                                    endPage = currentQuotePage + 2;
                                  }
                                }

                                return Array.from(
                                  { length: endPage - startPage + 1 },
                                  (_, i) => startPage + i,
                                ).map((pageNum) => (
                                  <PaginationItem key={pageNum}>
                                    <PaginationLink
                                      href="#"
                                      isActive={currentQuotePage === pageNum}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setCurrentQuotePage(pageNum);
                                      }}
                                    >
                                      {pageNum}
                                    </PaginationLink>
                                  </PaginationItem>
                                ));
                              })()}
                              <PaginationItem>
                                <PaginationNext
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    if (currentQuotePage < totalQuotePages)
                                      setCurrentQuotePage(currentQuotePage + 1);
                                  }}
                                  className={
                                    currentQuotePage === totalQuotePages
                                      ? 'pointer-events-none opacity-50'
                                      : ''
                                  }
                                />
                              </PaginationItem>
                            </PaginationContent>
                          </Pagination>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="referrals" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Referrals</CardTitle>
                  <CardDescription>Manage and track referral requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="search-filter-container mb-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="relative md:col-span-2 lg:col-span-2">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                          <Input
                            placeholder="Search referrals by referralId quoteId..."
                            value={referralSearchTerm}
                            onChange={(e) => {
                              setReferralSearchTerm(e.target.value);
                              setCurrentReferralPage(1);
                            }}
                            className="pl-10 h-10 w-full"
                          />
                        </div>

                        <Select
                          value={referralSelectedBroker}
                          onValueChange={(val) => {
                            setReferralSelectedBroker(val);
                            setCurrentReferralPage(1);
                          }}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="All Brokers" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all-brokers">All Brokers</SelectItem>
                            {uniqueBrokers.map((broker) => (
                              <SelectItem key={broker.id} value={broker.id}>
                                {broker.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select
                          value={referralSelectedInsurer}
                          onValueChange={(val) => {
                            setReferralSelectedInsurer(val);
                            setCurrentReferralPage(1);
                          }}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="All Insurers" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all-insurers">All Insurers</SelectItem>
                            {uniqueInsurers.map((insurer) => (
                              <SelectItem key={insurer.id} value={insurer.id}>
                                {insurer.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:gap-3">
                        <div className="flex min-w-0 w-full flex-1 flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-2">
                          <Select
                            value={referralSelectedStatus}
                            onValueChange={(val) => {
                              setReferralSelectedStatus(val);
                              setCurrentReferralPage(1);
                            }}
                          >
                            <SelectTrigger className="h-10 w-full min-w-[160px] shrink-0 sm:w-[220px]">
                              <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all-statuses">All Statuses</SelectItem>
                              {referralStatusOptions.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <div className="min-h-10 min-w-0 flex-1 basis-0 sm:min-w-[140px]">
                            <DatePicker
                              className="h-10 w-full"
                              placeholder="Start Date"
                              value={referralDateFrom || undefined}
                              onChange={(date) => {
                                setReferralDateFrom(date || '');
                                setCurrentReferralPage(1);
                              }}
                              max={getPrevDate(referralDateTo) || undefined}
                            />
                          </div>

                          <div className="min-h-10 min-w-0 flex-1 basis-0 sm:min-w-[140px]">
                            <DatePicker
                              className="h-10 w-full"
                              placeholder="End Date"
                              value={referralDateTo || undefined}
                              onChange={(date) => {
                                setReferralDateTo(date || '');
                                setCurrentReferralPage(1);
                              }}
                              min={getNextDate(referralDateFrom) || undefined}
                            />
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <Button
                            variant="outline"
                            onClick={clearFilters}
                            disabled={!hasActiveReferralFilters}
                            title={!hasActiveReferralFilters ? 'No filters applied' : undefined}
                            className="flex h-10 shrink-0 items-center gap-2"
                          >
                            <Filter className="w-4 h-4" />
                            Clear Filters
                          </Button>
                          <ColumnVisibilityDropdown
                            columns={referralColumns}
                            visibleColumns={visibleReferralColumns}
                            onToggleColumn={(id) => toggleColumnVisibility('admin-referrals', id, referralColumns.map(c => c.id))}
                            onReset={() => useColumnVisibilityStore.getState().setColumnVisibility('admin-referrals', referralColumns.map(c => c.id))}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportExcelReferrals}
                            className="h-10 shrink-0 gap-2"
                          >
                            <Upload className="w-4 h-4" />
                            Export Excel
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {referralsLoading ? (
                    <Table>
                      <TableBody>
                        <TableSkeleton rowCount={6} colCount={visibleReferralColumns.length} />
                      </TableBody>
                    </Table>
                  ) : referralsError ? (
                    <div className="rounded-md border border-destructive/20 bg-destructive/10 text-destructive px-3 py-2">
                      {referralsError}
                    </div>
                  ) : (
                    <>
                      <div className="mt-8 overflow-x-auto table-scrollbars">
                        <Table
                          equalColumns
                          columnCount={visibleReferralColumns.length}
                          minColumnWidth={160}
                        >
                          <TableHeader>
                            <TableRow>
                              {visibleReferralColumns.includes('referralId') && <TableHead>Referral ID</TableHead>}
                              {visibleReferralColumns.includes('quoteId') && <TableHead>Quote ID</TableHead>}
                              {visibleReferralColumns.includes('broker') && <TableHead>Broker</TableHead>}
                              {visibleReferralColumns.includes('product') && <TableHead>Product</TableHead>}
                              {visibleReferralColumns.includes('status') && <TableHead className="w-[160px]">Status</TableHead>}
                              {visibleReferralColumns.includes('reason') && <TableHead>Reason</TableHead>}
                              {visibleReferralColumns.includes('createdAt') && <TableHead>Created At</TableHead>}
                              {visibleReferralColumns.includes('action') && <TableHead className="text-center">Action</TableHead>}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {currentReferrals.length === 0 ? (
                              <TableRow>
                                <TableCell
                                  colSpan={visibleReferralColumns.length}
                                  className="text-center text-muted-foreground py-6"
                                >
                                  No referrals available for the selected filters.
                                </TableCell>
                              </TableRow>
                            ) : (
                              currentReferrals.map((referral) => (
                                <TableRow key={referral.id} className="hover:bg-muted/50">
                                  {visibleReferralColumns.includes('referralId') && (
                                    <TableCell className="font-medium">
                                      {referral.referralId}
                                    </TableCell>
                                  )}
                                  {visibleReferralColumns.includes('quoteId') && <TableCell>{referral.quoteId}</TableCell>}
                                  {visibleReferralColumns.includes('broker') && <TableCell>{referral.broker}</TableCell>}
                                  {visibleReferralColumns.includes('product') && <TableCell>{referral.productName}</TableCell>}
                                  {visibleReferralColumns.includes('status') && (
                                    <TableCell className="max-w-[160px] overflow-hidden">
                                      <TruncatedStatusBadge
                                        label={getReferralStatusLabel(referral.status)}
                                        color={getReferralStatusColor(referral.status)}
                                      />
                                    </TableCell>
                                  )}
                                  {visibleReferralColumns.includes('reason') && (
                                    <TableCell className="text-sm max-w-[250px]">
                                      {referral.reason ? (
                                        <TooltipProvider delayDuration={300}>
                                          <UITooltip>
                                            <TooltipTrigger asChild>
                                              <div className="line-clamp-2 cursor-help text-muted-foreground transition-colors hover:text-foreground leading-relaxed">
                                                {referral.reason}
                                              </div>
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-[300px] p-3 text-xs leading-relaxed bg-[#0a1a1a] text-white border-teal-900/50">
                                              <div className="font-bold mb-1.5 text-emerald-400 uppercase tracking-wider text-[10px]">Referral Reason</div>
                                              {referral.reason}
                                            </TooltipContent>
                                          </UITooltip>
                                        </TooltipProvider>
                                      ) : (
                                        <span className="text-muted-foreground">-</span>
                                      )}
                                    </TableCell>
                                  )}
                                  {visibleReferralColumns.includes('createdAt') && (
                                    <TableCell className="text-sm text-muted-foreground">
                                      {formatDateShort(referral.createdAt)}
                                    </TableCell>
                                  )}
                                  {visibleReferralColumns.includes('action') && (
                                    <TableCell className="text-center">
                                      <div className="flex justify-center">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => navigate(`/market-admin/referral/${referral.id}`)}
                                        >
                                          <Eye className="w-4 h-4 mr-1" />
                                          View Details
                                        </Button>
                                      </div>
                                    </TableCell>
                                  )}
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Referrals Pagination */}
                      <div className="px-6 py-4 border-t">
                        <div className="text-sm text-muted-foreground mb-4">
                          Showing {currentReferrals.length} of {totalReferrals} referrals (Page{' '}
                          {currentReferralPage} of {totalReferralPages})
                          {filteredReferrals.length > totalReferralPages * itemsPerPage && (
                            <span className="ml-2 text-amber-600">
                              • Showing first {totalReferralPages * itemsPerPage} results
                            </span>
                          )}
                        </div>
                        <div className="ml-auto">
                          <Pagination className="w-auto justify-end">
                            <PaginationContent>
                              <PaginationItem>
                                <PaginationPrevious
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    if (currentReferralPage > 1) {
                                      setCurrentReferralPage(currentReferralPage - 1);
                                    }
                                  }}
                                  className={
                                    currentReferralPage === 1
                                      ? 'pointer-events-none opacity-50'
                                      : ''
                                  }
                                />
                              </PaginationItem>
                              {(() => {
                                const maxPages = 5;
                                let startPage = 1;
                                let endPage = Math.min(maxPages, totalReferralPages);

                                if (totalReferralPages > maxPages) {
                                  if (currentReferralPage <= 3) {
                                    startPage = 1;
                                    endPage = maxPages;
                                  } else if (currentReferralPage >= totalReferralPages - 2) {
                                    startPage = totalReferralPages - maxPages + 1;
                                    endPage = totalReferralPages;
                                  } else {
                                    startPage = currentReferralPage - 2;
                                    endPage = currentReferralPage + 2;
                                  }
                                }

                                return Array.from(
                                  { length: endPage - startPage + 1 },
                                  (_, i) => startPage + i,
                                ).map((pageNum) => (
                                  <PaginationItem key={pageNum}>
                                    <PaginationLink
                                      href="#"
                                      isActive={currentReferralPage === pageNum}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setCurrentReferralPage(pageNum);
                                      }}
                                    >
                                      {pageNum}
                                    </PaginationLink>
                                  </PaginationItem>
                                ));
                              })()}
                              <PaginationItem>
                                <PaginationNext
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    if (currentReferralPage < totalReferralPages) {
                                      setCurrentReferralPage(currentReferralPage + 1);
                                    }
                                  }}
                                  className={
                                    currentReferralPage === totalReferralPages
                                      ? 'pointer-events-none opacity-50'
                                      : ''
                                  }
                                />
                              </PaginationItem>
                            </PaginationContent>
                          </Pagination>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="policies" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>All Policies</CardTitle>
                  <CardDescription>
                    View and manage active policies from all brokers and insurers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="search-filter-container mb-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="relative md:col-span-2 lg:col-span-4">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                          <Input
                            placeholder="Search policies, clients, projects..."
                            value={policySearchTerm}
                            onChange={(e) => {
                              setPolicySearchTerm(e.target.value);
                              setCurrentPolicyPage(1);
                            }}
                            className="h-10 pl-10"
                          />
                        </div>
                      </div>

                      <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:gap-3">
                        <div className="flex min-w-0 w-full flex-1 flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-2">
                          <div className="min-h-10 min-w-0 flex-1 basis-0 sm:min-w-[140px]">
                            <DatePicker
                              className="h-10 w-full"
                              placeholder="Start Date"
                              value={policyDateFrom || undefined}
                              onChange={(date) => {
                                setPolicyDateFrom(date || '');
                                setCurrentPolicyPage(1);
                              }}
                              max={getPrevDate(policyDateTo) || undefined}
                            />
                          </div>
                          <div className="min-h-10 min-w-0 flex-1 basis-0 sm:min-w-[140px]">
                            <DatePicker
                              className="h-10 w-full"
                              placeholder="End Date"
                              value={policyDateTo || undefined}
                              onChange={(date) => {
                                setPolicyDateTo(date || '');
                                setCurrentPolicyPage(1);
                              }}
                              min={getNextDate(policyDateFrom) || undefined}
                            />
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <Button
                            variant="outline"
                            onClick={clearFilters}
                            disabled={!hasActivePolicyFilters}
                            title={!hasActivePolicyFilters ? 'No filters applied' : undefined}
                            className="flex h-10 items-center gap-2"
                          >
                            <Filter className="w-4 h-4" />
                            Clear Filters
                          </Button>
                          <ColumnVisibilityDropdown
                            columns={policyColumns}
                            visibleColumns={visiblePolicyColumns}
                            onToggleColumn={(id) => toggleColumnVisibility('admin-policies', id, policyColumns.map(c => c.id))}
                            onReset={() => useColumnVisibilityStore.getState().setColumnVisibility('admin-policies', policyColumns.map(c => c.id))}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportExcelPolicies}
                            className="h-10 gap-2"
                          >
                            <Upload className="w-4 h-4" />
                            Export Excel
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 overflow-x-auto table-scrollbars">
                    {policiesLoading ? (
                      <Table>
                        <TableBody>
                          <TableSkeleton rowCount={6} colCount={visiblePolicyColumns.length} />
                        </TableBody>
                      </Table>
                    ) : policiesError ? (
                      <div className="rounded-md border border-destructive/20 bg-destructive/10 text-destructive px-3 py-2">
                        {policiesError}
                      </div>
                    ) : (
                      <Table
                        equalColumns
                        columnCount={visiblePolicyColumns.length}
                        minColumnWidth={150}
                      >
                        <TableHeader>
                          <TableRow>
                            {visiblePolicyColumns.includes('policyNumber') && <TableHead>Policy Number</TableHead>}
                            {visiblePolicyColumns.includes('projectName') && <TableHead>Product Name</TableHead>}
                            {visiblePolicyColumns.includes('sumInsured') && <TableHead>Sum Insured</TableHead>}
                            {visiblePolicyColumns.includes('premium') && <TableHead>Premium</TableHead>}
                            {visiblePolicyColumns.includes('startDate') && <TableHead>Start Date</TableHead>}
                            {visiblePolicyColumns.includes('endDate') && <TableHead>End Date</TableHead>}
                            {visiblePolicyColumns.includes('action') && <TableHead className="text-center">Actions</TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentPolicies.map((policy) => (
                            <TableRow key={policy.id} className="cursor-pointer hover:bg-muted/50">
                              {visiblePolicyColumns.includes('policyNumber') && (
                                <TableCell className="font-medium">
                                  {policy.policyNumber}
                                </TableCell>
                              )}
                              {visiblePolicyColumns.includes('projectName') && (
                                <TableCell className="truncate" title={policy.projectName}>
                                  {policy.projectName || 'N/A'}
                                </TableCell>
                              )}
                              {visiblePolicyColumns.includes('sumInsured') && (
                                <TableCell>
                                  {policy.sumInsured}
                                </TableCell>
                              )}
                              {visiblePolicyColumns.includes('premium') && (
                                <TableCell>
                                  {policy.premium}
                                </TableCell>
                              )}
                              {visiblePolicyColumns.includes('startDate') && (
                                <TableCell>
                                  {policy.startDate}
                                </TableCell>
                              )}
                              {visiblePolicyColumns.includes('endDate') && (
                                <TableCell>
                                  {policy.endDate}
                                </TableCell>
                              )}
                              {visiblePolicyColumns.includes('action') && (
                                <TableCell className="text-center">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(`/market-admin/policy/${policy.id}`)}
                                  >
                                    View Policy
                                  </Button>
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}

                    {/* Policies Pagination */}
                    <div className="px-6 py-4 border-t">
                      <div className="text-sm text-muted-foreground mb-4">
                        Showing {currentPolicies.length} of {totalPolicies} policies (Page{' '}
                        {currentPolicyPage} of {totalPolicyPages})
                        {filteredPolicies.length > totalPolicyPages * itemsPerPage && (
                          <span className="ml-2 text-amber-600">
                            • Showing first {totalPolicyPages * itemsPerPage} results
                          </span>
                        )}
                      </div>
                      <div className="ml-auto">
                        <Pagination className="w-auto justify-end">
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (currentPolicyPage > 1)
                                    setCurrentPolicyPage(currentPolicyPage - 1);
                                }}
                                className={
                                  currentPolicyPage === 1 ? 'pointer-events-none opacity-50' : ''
                                }
                              />
                            </PaginationItem>
                            {(() => {
                              const maxPages = 5;
                              let startPage = 1;
                              let endPage = Math.min(maxPages, totalPolicyPages);

                              if (totalPolicyPages > maxPages) {
                                if (currentPolicyPage <= 3) {
                                  startPage = 1;
                                  endPage = maxPages;
                                } else if (currentPolicyPage >= totalPolicyPages - 2) {
                                  startPage = totalPolicyPages - maxPages + 1;
                                  endPage = totalPolicyPages;
                                } else {
                                  startPage = currentPolicyPage - 2;
                                  endPage = currentPolicyPage + 2;
                                }
                              }

                              return Array.from(
                                { length: endPage - startPage + 1 },
                                (_, i) => startPage + i,
                              ).map((pageNum) => (
                                <PaginationItem key={pageNum}>
                                  <PaginationLink
                                    href="#"
                                    isActive={currentPolicyPage === pageNum}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setCurrentPolicyPage(pageNum);
                                    }}
                                  >
                                    {pageNum}
                                  </PaginationLink>
                                </PaginationItem>
                              ));
                            })()}
                            <PaginationItem>
                              <PaginationNext
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (currentPolicyPage < totalPolicyPages)
                                    setCurrentPolicyPage(currentPolicyPage + 1);
                                }}
                                className={
                                  currentPolicyPage === totalPolicyPages
                                    ? 'pointer-events-none opacity-50'
                                    : ''
                                }
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default MarketAdminDashboard;
