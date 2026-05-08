import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/shared/utils/lib-utils';
import { ArrowLeft, Plus, Package, FileText, Shield, ScrollText, Layers, AlertTriangle } from 'lucide-react';
import { QuoteStatusDot } from '@/features/quotes/components/QuotesComparison/QuoteStatusDot';
import { useCustomerProfile, useCustomerProfileTransactions } from '../hooks/useCustomerProfiles';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDateShort } from '@/shared/utils/date-format';
import { formatCurrencyLocale } from '@/shared/utils/lib-utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import TableSkeleton from '@/components/loaders/TableSkeleton';
import { TableSearchFilter, type FilterConfig } from '@/components/shared/TableSearchFilter';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type ProductTab = 'quotes' | 'policies' | 'proposals' | 'endorsements' | 'referral';

export default function CustomerProfileDetail() {
  const navigate = useNavigate();
  const { customerId } = useParams<{ customerId: string }>();
  const customerKey = decodeURIComponent(customerId || '');
  const { data: profile, isLoading: isProfileLoading, isError: isProfileError, refetch: refetchProfile } =
    useCustomerProfile(customerKey);

  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ProductTab>('proposals');
  const [transactionsPage, setTransactionsPage] = useState(1);
  const transactionsLimit = 5;
  const [tableSearch, setTableSearch] = useState('');
  const [tableFilters, setTableFilters] = useState<Record<string, any>>({});

  const products = profile?.products ?? [];
  const effectiveProductId = activeProductId ?? (products.length > 0 ? products[0].productId : null);
  const activeProduct = products.find((p) => p.productId === effectiveProductId) ?? null;

  React.useEffect(() => {
    if (!activeProductId && products.length > 0) {
      setActiveProductId(products[0].productId);
    }
  }, [activeProductId, products]);

  React.useEffect(() => {
    setTransactionsPage(1);
  }, [activeProductId, activeTab]);

  const selectedStatus = String(tableFilters.status || '').trim().toLowerCase() || null;
  const normalizedTransactionSearch = tableSearch.trim() || null;

  const { transactions, meta: transactionsMeta, transactionsQuery } = useCustomerProfileTransactions(
    customerKey,
    effectiveProductId,
    activeTab,
    selectedStatus,
    normalizedTransactionSearch,
    transactionsPage,
    transactionsLimit,
  );
  const { isLoading: isTransactionsLoading, isError: isTransactionsError, refetch: refetchTransactions } =
    transactionsQuery;

  const statusOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of transactions) {
      const s = String(a.status || '').trim();
      if (!s) continue;
      map.set(s.toLowerCase(), s.charAt(0).toUpperCase() + s.slice(1));
    }
    return [...map.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [transactions]);

  const activityFilters = useMemo<FilterConfig[]>(
    () => [{ key: 'status', label: 'Status', type: 'select', options: statusOptions }],
    [statusOptions],
  );

  const currency = (transactions.find((a) => a.currency)?.currency ?? 'AED') as string;

  /** Same order as broker dashboard tabs (Proposals → Quotes → Policies → Endorsements). */
  const tabItems: Array<{ id: ProductTab; label: string; icon: React.ReactNode }> = [
    { id: 'proposals', label: 'Proposals', icon: <ScrollText className="w-4 h-4" /> },
    { id: 'quotes', label: 'Quotes', icon: <FileText className="w-4 h-4" /> },
    { id: 'policies', label: 'Policies', icon: <Shield className="w-4 h-4" /> },
    { id: 'referral', label: 'Referrals', icon: <AlertTriangle className="w-4 h-4" /> },
    { id: 'endorsements', label: 'Endorsements', icon: <FileText className="w-4 h-4" /> },
  ];

  const canCreateQuote = Boolean(activeProduct?.productId);

  const handleCreateNewQuote = () => {
    if (!activeProduct) return;
    const productId = activeProduct.productId;
    const productName = activeProduct.productName;

    navigate(`/customer/proposal/${productId}?productName=${encodeURIComponent(productName)}&new=true`, {
      state: {
        initialData: {
          customer: profile?.displayName,
          customerName: profile?.displayName,
          client_name: profile?.displayName,
        },
        source: 'customer-profiles',
      },
    });
  };

  return (
    <div className="w-full px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">
            {profile?.displayName || 'Customer Profile'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {profile?.customerRefId || ' '}
          </p>
        </div>
        <Button
          className="gap-2"
          onClick={handleCreateNewQuote}
          disabled={!canCreateQuote}
        >
          <Plus className="w-4 h-4" />
          Create New Quote
        </Button>
      </div>

      {isProfileLoading ? (
        <Card>
          <CardContent className="py-12">
            <div className="space-y-4">
              <Skeleton className="h-8 w-[250px]" />
              <Skeleton className="h-4 w-[350px]" />
              <div className="grid grid-cols-3 gap-4 mt-8">
                <Skeleton className="h-32 rounded-lg" />
                <Skeleton className="h-32 rounded-lg" />
                <Skeleton className="h-32 rounded-lg" />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : isProfileError ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-destructive">Failed to load customer profile.</p>
            <div className="mt-3">
              <Button variant="outline" onClick={() => refetchProfile()}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : !profile ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Customer not found.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  Products
                </CardTitle>
                <div className="text-xs text-muted-foreground">
                  Select a product to view proposals, quotes, policies, referrals and endorsements.
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {products?.map((p) => {
                  const selected = p.productId === effectiveProductId;
                  return (
                    <button
                      key={p.productId}
                      type="button"
                      onClick={() => {
                        setActiveProductId(p.productId);
                        setActiveTab('proposals');
                      }}
                      className={cn(
                        'group text-left rounded-lg border p-4 bg-background text-foreground transition-all hover:shadow-sm hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                        selected
                          ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary/15 hover:bg-primary/15'
                          : 'border-border',
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div
                            className={cn(
                              'font-semibold truncate',
                              selected ? 'text-primary' : 'text-foreground',
                            )}
                          >
                            {p.productName}
                          </div>
                          <div
                            className={cn(
                              'text-xs mt-1 flex flex-wrap items-center gap-x-1',
                              selected
                                ? 'text-muted-foreground'
                                : 'text-muted-foreground group-hover:text-foreground/80',
                            )}
                          >
                            <span className={cn('font-semibold', selected ? 'text-primary' : '')}>
                              {p.totals.proposals}
                            </span>{' '}
                            proposals •{' '}
                            <span className={cn('font-semibold', selected ? 'text-primary' : '')}>
                              {p.totals.quotes}
                            </span>{' '}
                            quotes •{' '}
                            <span className={cn('font-semibold', selected ? 'text-primary' : '')}>
                              {p.totals.policies}
                            </span>{' '}
                            policies •{' '}
                            <span className={cn('font-semibold', selected ? 'text-primary' : '')}>
                              {p.totals.referrals}
                            </span>{' '}
                            referrals
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            'shrink-0 transition-colors',
                            selected
                              ? 'border-primary/40 bg-background text-primary'
                              : 'group-hover:bg-background group-hover:text-foreground',
                          )}
                        >
                          {p.totals.proposals + p.totals.quotes + p.totals.policies + p.totals.referrals + p.totals.endorsements}
                        </Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ProductTab)} className="space-y-3">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <CardTitle className="text-base">
                    {activeProduct ? activeProduct.productName : 'Select a product'}
                  </CardTitle>
                </div>
                {activeProduct && (
                  <TabsList className="grid w-full grid-cols-5 gap-5 mb-2 bg-primary/5 px-0 py-1 rounded-lg border border-primary/10 shadow-sm">
                    {tabItems.map((t) => (
                      <TabsTrigger
                        key={t.id}
                        value={t.id}
                        className="flex items-center justify-center gap-2 whitespace-nowrap px-2 data-[state=active]:text-primary data-[state=active]:bg-background data-[state=active]:shadow-sm h-9"
                      >
                        {t.icon}
                        <span className="truncate">{t.label}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                )}
              </CardHeader>
              <CardContent>
                {!activeProduct ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    No products found for this customer.
                  </div>
                ) : (
                  <>
                    {/* Matches dashboard stat cards, plus Total Proposals for customer context */}
                    <div className={cn(
                      "grid grid-cols-1 gap-6 mb-8",
                      activeTab === 'proposals' ? "md:grid-cols-4" : "md:grid-cols-5"
                    )}>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Proposals
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-foreground">
                            {activeProduct.totals.proposals}
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Quotes
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-foreground">{activeProduct.totals.quotes}</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Policies
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-foreground">{activeProduct.totals.policies}</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Referrals
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-foreground">
                            {activeProduct.totals.referrals || 0}
                          </div>
                        </CardContent>
                      </Card>
                      {activeTab !== 'proposals' && (
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                              Total Premium Value
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-foreground">
                              {formatCurrencyLocale(
                                activeProduct.totals.totalPremium || profile?.totals.totalPremium || 0,
                                currency,
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>

                    {(() => {
                      const currentCount = !activeProduct ? 0 : (
                        activeTab === 'proposals' ? activeProduct.totals.proposals :
                          activeTab === 'quotes' ? activeProduct.totals.quotes :
                            activeTab === 'policies' ? activeProduct.totals.policies :
                              activeTab === 'referral' ? activeProduct.totals.referrals :
                                activeTab === 'endorsements' ? activeProduct.totals.endorsements : 0
                      );

                      const showUI = currentCount > 0 || tableSearch || Object.keys(tableFilters).length > 0;

                      if (!showUI) {
                        return (
                          <div className="py-20 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mb-4 border border-primary/10">
                              {tabItems.find(t => t.id === activeTab)?.icon}
                            </div>
                            <h3 className="text-lg font-semibold text-foreground">No {activeTab} found</h3>
                            <p className="text-sm text-muted-foreground max-w-[280px] mt-2">
                              There are currently no {activeTab} records for this product and customer.
                            </p>
                          </div>
                        );
                      }

                      return (
                        <>
                          <div className="mb-4">
                            <TableSearchFilter
                              searchTerm={tableSearch}
                              onSearchChange={(value) => {
                                setTableSearch(value);
                                setTransactionsPage(1);
                              }}
                              searchPlaceholder="Search transactions…"
                              filters={activityFilters}
                              activeFilters={tableFilters}
                              onFilterChange={(k, v) => {
                                setTableFilters((prev) => ({ ...prev, [k]: v }));
                                setTransactionsPage(1);
                              }}
                              onClearFilters={() => {
                                setTableSearch('');
                                setTableFilters({});
                                setTransactionsPage(1);
                              }}
                            />
                          </div>
                          {isTransactionsLoading ? (
                            <div className="rounded-lg border overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Loading...</TableHead>
                                    <TableHead></TableHead>
                                    <TableHead></TableHead>
                                    <TableHead className="text-right"></TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  <TableSkeleton cols={4} rows={5} />
                                </TableBody>
                              </Table>
                            </div>
                          ) : isTransactionsError ? (
                            <div className="py-6 text-center">
                              <p className="text-sm text-destructive">Failed to load customer transactions.</p>
                              <div className="mt-3">
                                <Button variant="outline" onClick={() => refetchTransactions()}>
                                  Retry
                                </Button>
                              </div>
                            </div>
                          ) : null}

                          <TabsContent value="quotes" className="mt-0">
                            <div className="rounded-lg border overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-[25%]">Reference ID</TableHead>
                                    <TableHead className="w-[25%]">Product</TableHead>
                                    <TableHead className="w-[25%]">Status</TableHead>
                                    <TableHead className="w-[12.5%]">Updated</TableHead>
                                    <TableHead className="w-[12.5%] text-right">Premium</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {transactions.length === 0 ? (
                                    <TableRow>
                                      <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-12">
                                        No records found.
                                      </TableCell>
                                    </TableRow>
                                  ) : (
                                    transactions.map((a) => (
                                      <TableRow key={a.id}>
                                        <TableCell className="font-medium whitespace-nowrap">
                                          {a.quoteNumber || a.quoteId || a.id}
                                        </TableCell>
                                        <TableCell>{a.productName ?? '—'}</TableCell>
                                        <TableCell>
                                          <QuoteStatusDot status={a.status || ''} />
                                        </TableCell>
                                        <TableCell>
                                          {a.updatedAt ? formatDateShort(a.updatedAt) : '—'}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                          {formatCurrencyLocale(
                                            Number(a.premium ?? 0),
                                            a.currency || currency,
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    ))
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          </TabsContent>

                          <TabsContent value="policies" className="mt-0">
                            <div className="rounded-lg border overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-[25%]">Reference ID</TableHead>
                                    <TableHead className="w-[25%]">Product</TableHead>
                                    <TableHead className="w-[25%]">Status</TableHead>
                                    <TableHead className="w-[12.5%]">Updated</TableHead>
                                    <TableHead className="w-[12.5%] text-right">Premium</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {transactions.length === 0 ? (
                                    <TableRow>
                                      <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-12">
                                        No records found.
                                      </TableCell>
                                    </TableRow>
                                  ) : (
                                    transactions.map((a) => (
                                      <TableRow key={a.id}>
                                        <TableCell className="font-medium whitespace-nowrap">
                                          {a.policyId || a.id}
                                        </TableCell>
                                        <TableCell>{a.productName ?? '—'}</TableCell>
                                        <TableCell>
                                          <QuoteStatusDot status={a.status || ''} />
                                        </TableCell>
                                        <TableCell>
                                          {a.updatedAt ? formatDateShort(a.updatedAt) : '—'}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                          {formatCurrencyLocale(
                                            Number(a.premium ?? 0),
                                            a.currency || currency,
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    ))
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          </TabsContent>

                          <TabsContent value="proposals" className="mt-0">
                            <div className="rounded-lg border overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-[33.33%]">Reference ID</TableHead>
                                    <TableHead className="w-[33.33%]">Product</TableHead>
                                    <TableHead className="w-[16.67%]">Status</TableHead>
                                    <TableHead className="w-[16.67%]">Updated</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {transactions.length === 0 ? (
                                    <TableRow>
                                      <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-12">
                                        No records found.
                                      </TableCell>
                                    </TableRow>
                                  ) : (
                                    transactions.map((a) => (
                                      <TableRow key={a.id}>
                                        <TableCell className="font-medium whitespace-nowrap">
                                          {a.proposalId || a.id}
                                        </TableCell>
                                        <TableCell>{a.productName ?? '—'}</TableCell>
                                        <TableCell>
                                          <QuoteStatusDot status={a.status || ''} />
                                        </TableCell>
                                        <TableCell>
                                          {a.updatedAt ? formatDateShort(a.updatedAt) : '—'}
                                        </TableCell>
                                      </TableRow>
                                    ))
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          </TabsContent>

                          <TabsContent value="endorsements" className="mt-0">
                            <div className="rounded-lg border overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-[25%]">Transaction ID</TableHead>
                                    <TableHead className="w-[25%]">Product</TableHead>
                                    <TableHead className="w-[25%]">Status</TableHead>
                                    <TableHead className="w-[12.5%]">Updated</TableHead>
                                    <TableHead className="w-[12.5%] text-right">Premium</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {transactions.length === 0 ? (
                                    <TableRow>
                                      <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-12">
                                        No records found.
                                      </TableCell>
                                    </TableRow>
                                  ) : (
                                    transactions.map((a) => (
                                      <TableRow key={a.id}>
                                        <TableCell className="font-medium whitespace-nowrap">
                                          {a.id}
                                        </TableCell>
                                        <TableCell>{a.productName ?? '—'}</TableCell>
                                        <TableCell>
                                          <QuoteStatusDot status={a.status || ''} />
                                        </TableCell>
                                        <TableCell>
                                          {a.updatedAt ? formatDateShort(a.updatedAt) : '—'}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                          {formatCurrencyLocale(
                                            Number(a.premium ?? 0),
                                            a.currency || currency,
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    ))
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          </TabsContent>

                          <TabsContent value="referral" className="mt-0">
                            <div className="rounded-lg border overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-[15%]">Referral ID</TableHead>
                                    <TableHead className="w-[15%]">Quote Number</TableHead>
                                    <TableHead className="w-[15%]">Product</TableHead>
                                    <TableHead className="w-[25%]">Reason</TableHead>
                                    <TableHead className="w-[12%] text-center">Status</TableHead>
                                    <TableHead className="w-[12%]">Updated</TableHead>
                                    <TableHead className="w-[10%] text-right">Premium</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {transactions.length === 0 ? (
                                    <TableRow>
                                      <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-12">
                                        No records found.
                                      </TableCell>
                                    </TableRow>
                                  ) : (
                                    transactions.map((a) => (
                                      <TableRow key={a.id}>
                                        <TableCell className="font-medium whitespace-nowrap">
                                          {a.referralId || a.id}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">
                                          {a.quoteNumber || '—'}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">{a.productName ?? '—'}</TableCell>
                                        <TableCell className="text-sm max-w-[250px]">
                                          {a.reason ? (
                                            <TooltipProvider delayDuration={300}>
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <div className="line-clamp-2 cursor-help text-muted-foreground transition-colors hover:text-foreground leading-relaxed text-xs">
                                                    {a.reason}
                                                  </div>
                                                </TooltipTrigger>
                                                <TooltipContent className="max-w-[300px] p-3 text-xs leading-relaxed bg-[#0a1a1a] text-white border-teal-900/50">
                                                  <div className="font-bold mb-1.5 text-emerald-400 uppercase tracking-wider text-[10px]">
                                                    Referral Reason
                                                  </div>
                                                  {a.reason}
                                                </TooltipContent>
                                              </Tooltip>
                                            </TooltipProvider>
                                          ) : (
                                            <span className="text-muted-foreground">—</span>
                                          )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                          <QuoteStatusDot status={a.status || ''} />
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">
                                          {a.updatedAt ? formatDateShort(a.updatedAt) : '—'}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                          {formatCurrencyLocale(
                                            Number(a.premium ?? 0),
                                            a.currency || currency,
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    ))
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          </TabsContent>
                          {transactionsMeta.totalPages > 1 && (
                            <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
                              <p className="text-xs text-muted-foreground">
                                Showing page {transactionsMeta.page} of {transactionsMeta.totalPages} (
                                {transactionsMeta.total} transactions)
                              </p>
                              <Pagination className="mx-0 w-auto justify-end">
                                <PaginationContent>
                                  <PaginationItem>
                                    <PaginationPrevious
                                      href="#"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        if (transactionsPage > 1) setTransactionsPage((p) => p - 1);
                                      }}
                                      className={transactionsPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                                    />
                                  </PaginationItem>
                                  {Array.from({ length: transactionsMeta.totalPages }, (_, i) => i + 1)
                                    .filter(
                                      (p) =>
                                        p === 1 ||
                                        p === transactionsMeta.totalPages ||
                                        Math.abs(p - transactionsPage) <= 1,
                                    )
                                    .map((page, idx, arr) => (
                                      <React.Fragment key={page}>
                                        {idx > 0 && arr[idx - 1] !== page - 1 && (
                                          <PaginationItem>
                                            <span className="px-2 text-muted-foreground">…</span>
                                          </PaginationItem>
                                        )}
                                        <PaginationItem>
                                          <PaginationLink
                                            href="#"
                                            isActive={page === transactionsPage}
                                            onClick={(e) => {
                                              e.preventDefault();
                                              setTransactionsPage(page);
                                            }}
                                          >
                                            {page}
                                          </PaginationLink>
                                        </PaginationItem>
                                      </React.Fragment>
                                    ))}
                                  <PaginationItem>
                                    <PaginationNext
                                      href="#"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        if (transactionsPage < transactionsMeta.totalPages) {
                                          setTransactionsPage((p) => p + 1);
                                        }
                                      }}
                                      className={
                                        transactionsPage >= transactionsMeta.totalPages
                                          ? 'pointer-events-none opacity-50'
                                          : ''
                                      }
                                    />
                                  </PaginationItem>
                                </PaginationContent>
                              </Pagination>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </>
                )}
              </CardContent>
            </Card>
          </Tabs>
        </>
      )}
    </div>
  );
}

