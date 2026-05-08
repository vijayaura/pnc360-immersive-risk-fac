import React, { useMemo, useCallback, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getQuotesDashboard, getQuoteDashboardById } from '@/features/quotes/api/quotes';
import { TableSearchFilter, FilterConfig } from '@/components/shared/TableSearchFilter';
import { ColumnVisibilityDropdown } from '@/components/shared/ColumnVisibilityDropdown';
import { useColumnVisibilityStore } from '@/shared/stores/useColumnVisibilityStore';
import TableSkeleton from '@/components/loaders/TableSkeleton';
import { getProductsList } from '@/features/product-config/api/products-list';
import { getQuoteStatusLabel, getQuoteStatusColor } from '@/lib/quote-status';
import { cn } from '@/shared/utils/lib-utils';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { formatDateShort } from '@/shared/utils/date-format';
import { formatCurrencyLocale } from '@/shared/utils/lib-utils';

const quoteColumns = [
    { id: 'quoteId', label: 'Request ID', isMandatory: true },
    { id: 'product', label: 'Product', isMandatory: true },
    { id: 'sumInsured', label: 'Sum Insured' },
    { id: 'premium', label: 'Premium' },
    { id: 'status', label: 'Status', isMandatory: true },
    { id: 'action', label: 'Action', isMandatory: true },
];

interface QuotesTabProps {
    itemsPerPage: number;
    isActive: boolean;
    selectedProductIds?: string[];
}

const QuotesTab = React.memo(({ itemsPerPage, isActive, selectedProductIds }: QuotesTabProps) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [currentQuotePage, setCurrentQuotePage] = useState(1);
    const [quoteSearch, setQuoteSearch] = useState('');
    const [quoteStatusFilter, setQuoteStatusFilter] = useState<string | undefined>(undefined);
    const [quoteProductFilter, setQuoteProductFilter] = useState<string | undefined>(undefined);
    const [quotesSearchInput, setQuotesSearchInput] = useState('');
    const [quotesFilterWidgetsKey, setQuotesFilterWidgetsKey] = useState(0);
    /** Bumps on "Clear filters" so the list query key never reuses pre-filter TanStack cache for the same search/status/product tuple. */
    const [quotesListRevision, setQuotesListRevision] = useState(0);
    const [viewDetailsLoadingId, setViewDetailsLoadingId] = useState<string | null>(null);
    
    // Column Visibility Store Integration
    const { toggleColumnVisibility, getTableVisibility, setColumnVisibility } = useColumnVisibilityStore();
    const visibleQuoteColumns = getTableVisibility('broker-quotes', quoteColumns.map(c => c.id));
    const quoteDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { user } = useAuthStore();
    const brokerOrgRaw = user?.organizationId ?? user?.organization_id;
    const brokerOrgId =
        brokerOrgRaw !== undefined && brokerOrgRaw !== null && brokerOrgRaw !== ''
            ? String(brokerOrgRaw)
            : undefined;
    const selectedProductsParam = useMemo(
        () => (selectedProductIds && selectedProductIds.length > 0 ? selectedProductIds.join(',') : undefined),
        [selectedProductIds],
    );

    const handleQuotesSearchChange = useCallback((value: string) => {
        setQuotesSearchInput(value);
        if (quoteDebounceRef.current) clearTimeout(quoteDebounceRef.current);
        quoteDebounceRef.current = setTimeout(() => {
            setQuoteSearch(value);
            setCurrentQuotePage(1);
        }, 400);
    }, []);

    const handleQuotesStatusFilterChange = useCallback((key: string, value: any) => {
        if (key === 'status') {
            const statusVal = Array.isArray(value) ? (value[0] as string | undefined) : (value as string | undefined);
            const s = typeof statusVal === 'string' ? statusVal.trim() : '';
            setQuoteStatusFilter(s || undefined);
        } else if (key === 'productId') {
            const v = typeof value === 'string' ? value.trim() : '';
            setQuoteProductFilter(v || undefined);
        }
        setCurrentQuotePage(1);
    }, []);

    const handleClearQuotesFilters = useCallback(() => {
        if (quoteDebounceRef.current) {
            clearTimeout(quoteDebounceRef.current);
            quoteDebounceRef.current = null;
        }
        flushSync(() => {
            setQuotesSearchInput('');
            setQuoteSearch('');
            setQuoteStatusFilter(undefined);
            setQuoteProductFilter(undefined);
            setQuotesFilterWidgetsKey((k) => k + 1);
            setCurrentQuotePage(1);
            setQuotesListRevision((r) => r + 1);
        });
        void queryClient.cancelQueries({ queryKey: ['broker-quotes-dashboard'] });
        queryClient.removeQueries({ queryKey: ['broker-quotes-dashboard'] });
    }, [queryClient]);

    const quotesDashboardFiltersState = useMemo<Record<string, any>>(() => {
        const f: Record<string, any> = {};
        if (quoteStatusFilter) f['status'] = quoteStatusFilter;
        if (quoteProductFilter) f['productId'] = quoteProductFilter;
        return f;
    }, [quoteStatusFilter, quoteProductFilter]);

    // Fetch products for filter
    const { data: productsRes } = useQuery({
        queryKey: ['broker-products-list', brokerOrgId],
        queryFn: () =>
            getProductsList({ assignedProduct: true, distributorOrgId: brokerOrgId }),
        staleTime: 1000 * 60 * 10,
        enabled: isActive && Boolean(brokerOrgId),
    });

    const quotesDashboardFilters = useMemo<FilterConfig[]>(() => [
        {
            key: 'status',
            label: 'Status',
            type: 'select',
            options: [
                { value: 'draft', label: 'Draft' },
                { value: 'in_progress', label: 'In Progress' },
            ],
        },
        {
            key: 'productId',
            label: 'Product Type',
            type: 'select',
            options: (productsRes?.items || [])
                .filter((p) => p != null && p.id != null && String(p.id).length > 0)
                .map((p) => ({
                    value: String(p.id),
                    label: p.name || p.code || String(p.id),
                })),
        },
    ], [productsRes]);

    const {
        data: quotesRes,
        isPending: quotesPending,
        isFetching: quotesFetching,
        error: quotesError,
    } = useQuery({
        queryKey: [
            'broker-quotes-dashboard',
            quotesListRevision,
            currentQuotePage,
            itemsPerPage,
            quoteSearch,
            quoteStatusFilter,
            selectedProductsParam,
            quoteProductFilter,
        ],
        queryFn: () =>
            getQuotesDashboard({
                page: currentQuotePage,
                limit: itemsPerPage,
                search: quoteSearch || undefined,
                status: quoteStatusFilter || undefined,
                productId: selectedProductsParam || quoteProductFilter || undefined,
                type: 'broker',
            }),
        enabled: isActive,
        staleTime: 0,
        structuralSharing: false,
    });

    const quotesTableLoading =
        isActive && (quotesPending || (quotesFetching && quotesRes === undefined));

    React.useEffect(() => {
        setCurrentQuotePage(1);
    }, [selectedProductsParam]);

    const activeQuotes = useMemo(() => {
        try {
            const quotesData = quotesRes?.data || [];
            if (!quotesData || !Array.isArray(quotesData)) return [];
            return quotesData.map((q: any) => {
                const currency = q.currency ?? '';

                return {
                    id: q.id,
                    quoteId: q.requestId,
                    requestId: q.requestId,
                    quoteNumber: q.quoteNumber || '',
                    customerName: q.customerName || '',
                    companyName: q.project || '',
                    insurer: q.insurer || 'Insurer Name',
                    productName: q.productName || 'Construction',
                    projectType: q.projectType || 'Construction',
                    projectValue: (() => {
                        const sib = q.value;
                        if (sib === null || sib === undefined) return '-';
                        if (typeof sib === 'string' || typeof sib === 'number') return String(sib);
                        try {
                            return JSON.stringify(sib);
                        } catch {
                            return String(sib);
                        }
                    })(),
                    sumInsured: formatCurrencyLocale(q.sumInsured as any, currency),
                    currency,
                    policyCreated: q.policyCreated,
                    totalPremium: formatCurrencyLocale(q.totalPremium as any, currency),
                    status: q.status || '',
                    validityDate: formatDateShort(q.updatedAt),
                    submittedDate: formatDateShort(q.createdAt),
                    createdAt: q.createdAt,
                };
            });
        } catch (error) {
            console.error('Error mapping quotes data:', error);
            return [];
        }
    }, [quotesRes]);

    const totalQuotesDashboardPages = quotesRes?.meta?.totalPages ?? 1;

    return (
        <Card className="border-border bg-card">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Quote Requests
                        </CardTitle>
                        <CardDescription>Manage quotes for Broker</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <TableSearchFilter
                  searchTerm={quotesSearchInput}
                  onSearchChange={handleQuotesSearchChange}
                  searchPlaceholder="Search quotes by product name..."
                  filters={quotesDashboardFilters}
                  activeFilters={quotesDashboardFiltersState}
                  onFilterChange={handleQuotesStatusFilterChange}
                  onClearFilters={handleClearQuotesFilters}
                  filterWidgetsKey={quotesFilterWidgetsKey}
                  className="mb-4"
                >
                  <ColumnVisibilityDropdown
                    columns={quoteColumns}
                    visibleColumns={visibleQuoteColumns}
                    onToggleColumn={(id) => toggleColumnVisibility('broker-quotes', id, quoteColumns.map(c => c.id))}
                    onReset={() => setColumnVisibility('broker-quotes', quoteColumns.map(c => c.id))}
                  />
                </TableSearchFilter>

                <Table
                    equalColumns
                    columnCount={visibleQuoteColumns.length}
                    minColumnWidth={150}
                >
                    <TableHeader>
                        <TableRow>
                            {visibleQuoteColumns.includes('quoteId') && <TableHead>Request ID</TableHead>}
                            {visibleQuoteColumns.includes('product') && <TableHead>Product</TableHead>}
                            {visibleQuoteColumns.includes('sumInsured') && <TableHead>Sum Insured</TableHead>}
                            {visibleQuoteColumns.includes('premium') && <TableHead>Premium</TableHead>}
                            {visibleQuoteColumns.includes('status') && <TableHead>Status</TableHead>}
                            {visibleQuoteColumns.includes('action') && <TableHead className="text-center">Action</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody
                        key={`${quotesListRevision}-${currentQuotePage}-${quoteSearch}-${quoteStatusFilter ?? ''}-${quoteProductFilter ?? ''}`}
                    >
                        {quotesTableLoading ? (
                            <TableSkeleton rows={5} cols={visibleQuoteColumns.length} />
                        ) : quotesError ? (
                            <TableRow>
                                <TableCell colSpan={visibleQuoteColumns.length} className="text-center">
                                    <div className="rounded-md border border-destructive/20 bg-destructive/10 text-destructive px-3 py-2">
                                        {(quotesError as any)?.message || 'Failed to load quotes'}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : activeQuotes.length > 0 ? (
                            activeQuotes.map((quote) => (
                                <TableRow
                                    key={`${quotesListRevision}-${currentQuotePage}-${String(quote.id)}`}
                                    className="hover:bg-muted/50 transition-colors"
                                >
                                    {visibleQuoteColumns.includes('quoteId') && <TableCell className="font-medium">{quote.quoteNumber}</TableCell>}
                                    {visibleQuoteColumns.includes('product') && <TableCell>{quote.productName}</TableCell>}
                                    {visibleQuoteColumns.includes('sumInsured') && <TableCell className="font-medium break-all min-w-[120px]">{quote.sumInsured}</TableCell>}
                                    {visibleQuoteColumns.includes('premium') && <TableCell className="font-medium text-primary break-all min-w-[120px]">{quote.totalPremium}</TableCell>}
                                    {visibleQuoteColumns.includes('status') && (
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={cn("capitalize font-semibold whitespace-nowrap", getQuoteStatusColor(quote.status))}
                                            >
                                                {getQuoteStatusLabel(quote.status)}
                                            </Badge>
                                        </TableCell>
                                    )}
                                    {visibleQuoteColumns.includes('action') && (
                                        <TableCell className="text-center">
                                            <div className="flex gap-2 justify-center">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={viewDetailsLoadingId === quote.id}
                                                    onClick={async () => {
                                                        setViewDetailsLoadingId(quote.id);
                                                        try {
                                                            const details = await getQuoteDashboardById(quote.id);
                                                            navigate(`/broker/quote/${quote.id}?policy-created=${details?.policyCreated}`, {
                                                                state: { quoteDashboard: details },
                                                            });
                                                        } catch {
                                                            navigate(`/broker/quote/${quote.id}`);
                                                        } finally {
                                                            setViewDetailsLoadingId(null);
                                                        }
                                                    }}
                                                >
                                                    <Eye className="w-4 h-4 mr-1" />
                                                    View Details
                                                </Button>
                                            </div>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={visibleQuoteColumns.length} className="text-center text-muted-foreground p-4">
                                    No quotes found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                <div className="px-6 py-4 border-t flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                        {quotesRes?.meta
                            ? `Page ${quotesRes.meta.page} of ${quotesRes.meta.totalPages} · ${quotesRes.meta.total} quotes`
                            : `Showing ${activeQuotes.length} quotes`}
                    </div>
                    <div className="ml-auto">
                        <Pagination className="w-auto justify-end">
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (currentQuotePage > 1) setCurrentQuotePage(currentQuotePage - 1);
                                        }}
                                        className={currentQuotePage === 1 ? 'pointer-events-none opacity-50' : ''}
                                    />
                                </PaginationItem>
                                {(() => {
                                    const maxPages = 5;
                                    let startPage = 1;
                                    let endPage = Math.min(maxPages, totalQuotesDashboardPages);
                                    if (totalQuotesDashboardPages > maxPages) {
                                        if (currentQuotePage <= 3) {
                                            startPage = 1;
                                            endPage = maxPages;
                                        } else if (currentQuotePage >= totalQuotesDashboardPages - 2) {
                                            startPage = totalQuotesDashboardPages - maxPages + 1;
                                            endPage = totalQuotesDashboardPages;
                                        } else {
                                            startPage = currentQuotePage - 2;
                                            endPage = currentQuotePage + 2;
                                        }
                                    }
                                    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map((pageNum) => (
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
                                            if (currentQuotePage < totalQuotesDashboardPages) setCurrentQuotePage(currentQuotePage + 1);
                                        }}
                                        className={currentQuotePage === totalQuotesDashboardPages ? 'pointer-events-none opacity-50' : ''}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
});

QuotesTab.displayName = 'QuotesTab';

export default QuotesTab;
