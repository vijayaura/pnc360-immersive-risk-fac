import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getQuoteStatusLabel, getQuoteStatusColor, QUOTE_STATUSES } from '@/lib/quote-status';
import { cn } from '@/shared/utils/lib-utils';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { Eye, FileText } from 'lucide-react';
import { TableSearchFilter, FilterConfig } from '@/components/shared/TableSearchFilter';
import { ColumnVisibilityDropdown } from '@/components/shared/ColumnVisibilityDropdown';
import { useTableSearch } from '@/shared/hooks/useTableSearch';
import { useQuery } from '@tanstack/react-query';
import { getQuotesDashboard, getQuoteDashboardById } from '@/features/quotes/api/quotes';
import { useInsurerDashboardStore } from '@/shared/stores/useInsurerDashboardStore';
import { useColumnVisibilityStore } from '@/shared/stores/useColumnVisibilityStore';
import TableSkeleton from '@/components/loaders/TableSkeleton';
import { formatDateShort } from '@/shared/utils/date-format';
import { formatCurrencyLocale } from '@/shared/utils/lib-utils';
import { getProducts } from '@/features/product-config/api/products';
import { getInsurerBrokerAssignments } from '@/features/insurers/api/insurers';

interface DashboardQuote {
    id: string;
    quoteId: string;
    quoteNumber: string;
    requestId: string;
    customerName?: string;
    companyName: string;
    brokerName: string;
    brokerId?: string;
    projectType?: string;
    productId?: string;
    projectValue: string;
    productName?: any;
    sumInsured?: any;
    sumInsuredRaw?: any;
    totalPremium: string;
    currency?: string;
    status: string;
    validityDate: string;
    submittedDate: string;
    createdAt: string;
    [key: string]: any;
}

const quoteColumns = [
    { id: 'quoteId', label: 'Request ID', isMandatory: true },
    { id: 'product', label: 'Product', isMandatory: true },
    { id: 'status', label: 'Status', isMandatory: true },
    { id: 'sumInsured', label: 'Sum Insured' },
    { id: 'premium', label: 'Premium' },
    { id: 'action', label: 'Action', isMandatory: true },
];

interface QuotesTabProps {
    itemsPerPage: number;
    isActive: boolean;
    selectedProductIds?: string[];
}

const QuotesTab = React.memo(({ itemsPerPage, isActive, selectedProductIds }: QuotesTabProps) => {
    const navigate = useNavigate();
    const {
        quotePage: currentQuotePage,
        setQuotePage: setCurrentQuotePage,
        quoteSearch,
        setQuoteSearch,
        quoteStatusFilter,
        setQuoteStatusFilter,
    } = useInsurerDashboardStore();

    // Fetch products
    const { data: productsRes } = useQuery({
        queryKey: ['insurer-products'],
        queryFn: () => getProducts(),
        staleTime: 1000 * 60 * 5,
        enabled: isActive,
    });

    // Fetch brokers
    const { data: brokersRes } = useQuery({
        queryKey: ['insurer-brokers'],
        queryFn: () => getInsurerBrokerAssignments(),
        staleTime: 1000 * 60 * 5,
        enabled: isActive,
    });

    const [apiProductId, setApiProductId] = useState<string | undefined>(undefined);
    const [apiBrokerId, setApiBrokerId] = useState<string | undefined>(undefined);
    const [viewDetailsLoadingId, setViewDetailsLoadingId] = useState<string | null>(null);
    const selectedProductsParam = useMemo(
        () => (selectedProductIds && selectedProductIds.length > 0 ? selectedProductIds.join(',') : undefined),
        [selectedProductIds],
    );
    
    // Column Visibility Store Integration
    const { toggleColumnVisibility, getTableVisibility, setColumnVisibility } = useColumnVisibilityStore();
    const visibleQuoteColumns = getTableVisibility('insurer-quotes', quoteColumns.map(c => c.id));

    const {
        data: quotesRes,
        isLoading: quotesLoading,
        error: quotesError,
    } = useQuery({
        queryKey: [
            'insurer-quotes',
            currentQuotePage,
            itemsPerPage,
            quoteSearch,
            quoteStatusFilter,
            selectedProductsParam,
            apiProductId,
            apiBrokerId,
        ],
        queryFn: () =>
            getQuotesDashboard({
                page: currentQuotePage,
                limit: itemsPerPage,
                search: quoteSearch || undefined,
                status: quoteStatusFilter || undefined,
                productId: selectedProductsParam || apiProductId,
                brokerId: apiBrokerId,
            }),
        placeholderData: (prev) => prev,
        staleTime: 1000 * 60 * 2,
        enabled: isActive,
    });

    const activeQuotes = useMemo<DashboardQuote[]>(() => {
        try {
            const quotesData = quotesRes?.data || [];
            if (!quotesData || !Array.isArray(quotesData)) {
                return [];
            }
            return quotesData
                .filter((q) => q != null && (q as any).id != null && String((q as any).id).length > 0)
                .map((q) => {
                const currency = (q as any).currency ?? '';

                return {
                    id: String((q as any).id),
                    quoteId: q.requestId,
                    quoteNumber: q.quoteNumber || '',
                    requestId: q.requestId,
                    companyName: q.project || '',
                    brokerName: q.broker || 'Broker Name',
                    brokerId: q.submittingOrgId ?? undefined,
                    productName: q.productName || 'Construction',
                    productId: q.productId,
                    projectValue: (() => {
                        const sib: any = (q as any).value;
                        if (sib === null || sib === undefined) {
                            const v = q.value;
                            return v === null || v === undefined ? '-' : String(v);
                        }
                        if (typeof sib === 'string' || typeof sib === 'number') {
                            return String(sib);
                        }
                        try {
                            return JSON.stringify(sib);
                        } catch {
                            return String(sib);
                        }
                    })(),
                    sumInsuredRaw: (q as any).sumInsuredBreakdown ?? q.value ?? '-',
                    sumInsured: formatCurrencyLocale((q as any).sumInsured, currency),
                    currency,
                    totalPremium: formatCurrencyLocale((q as any).totalPremium, currency),
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

    const allQuotes = useMemo<DashboardQuote[]>(() => {
        const combined = [...activeQuotes];
        return combined.sort((a, b) => {
            const dateA = a.submittedDate || a.createdAt || '';
            const dateB = b.submittedDate || b.createdAt || '';
            const parseDate = (dateStr: string): Date => {
                if (!dateStr || dateStr === '-') return new Date(0);
                if (dateStr.includes('T') || dateStr.includes('-')) {
                    const parsed = new Date(dateStr);
                    if (!isNaN(parsed.getTime())) return parsed;
                }
                const parts = dateStr.split('/');
                if (parts.length === 3) {
                    const parsed = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                    if (!isNaN(parsed.getTime())) return parsed;
                }
                return new Date(0);
            };
            const parsedA = parseDate(dateA);
            const parsedB = parseDate(dateB);
            return parsedB.getTime() - parsedA.getTime();
        });
    }, [activeQuotes]);

    const quotesByProduct = useMemo(() => allQuotes, [allQuotes]);

    const quoteFilters = useMemo<FilterConfig[]>(() => [
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
            type: 'multiselect',
            options:
                productsRes?.items
                    ?.filter((p: any) => p != null && p.id != null && String(p.id).length > 0)
                    .map((p: any) => ({
                        value: String(p.id),
                        label: p.name != null ? String(p.name) : 'Product',
                    })) || [],
        },
        {
            key: 'brokerId',
            label: 'Broker',
            type: 'select',
            options:
                brokersRes
                    ?.filter((b: any) => b != null && b.id != null && String(b.id).length > 0)
                    .map((b: any) => ({
                        value: String(b.id),
                        label: b.name != null ? String(b.name) : 'Broker',
                    })) || [],
        },
    ], [productsRes, brokersRes]);

    const {
        searchTerm: quoteSearchTerm,
        setSearchTerm: setQuoteSearchTerm,
        filters: quoteFiltersState,
        updateFilter: updateQuoteFilter,
        clearFilters: clearQuoteFilters,
    } = useTableSearch({
        data: quotesByProduct,
        searchableFields: ['id', 'customerName', 'companyName', 'brokerName', 'productName'],
        initialFilters: {},
    });

    // Server applies status / product / broker; client only refines the current page by search text
    const filteredQuotes = useMemo(() => {
        let result = quotesByProduct;
        const term = quoteSearchTerm.trim();
        if (term) {
            const searchLower = term.toLowerCase();
            const fields: (keyof DashboardQuote)[] = [
                'id',
                'customerName',
                'companyName',
                'brokerName',
                'productName',
            ];
            result = result.filter((item) =>
                fields.some((field) => {
                    const value = item[field];
                    if (value == null) return false;
                    return String(value).toLowerCase().includes(searchLower);
                }),
            );
        }
        return result;
    }, [quotesByProduct, quoteSearchTerm]);

    useEffect(() => {
        setQuoteSearch(quoteSearchTerm);
    }, [quoteSearchTerm, setQuoteSearch]);

    useEffect(() => {
        const status = (quoteFiltersState?.status as string) || undefined;
        setQuoteStatusFilter(status ? status.trim().toLowerCase() : undefined);

        const pid = Array.isArray(quoteFiltersState?.productId)
            ? quoteFiltersState.productId.join(',')
            : (quoteFiltersState?.productId as string);
        const bid = Array.isArray(quoteFiltersState?.brokerId)
            ? quoteFiltersState.brokerId.join(',')
            : (quoteFiltersState?.brokerId as string);

        setApiProductId(pid || undefined);
        setApiBrokerId(bid || undefined);
    }, [quoteFiltersState, setQuoteStatusFilter, setApiProductId, setApiBrokerId]);

    useEffect(() => {
        setCurrentQuotePage(1);
    }, [selectedProductsParam, setCurrentQuotePage]);

    const totalQuotes = quotesRes?.meta?.total ?? filteredQuotes.length;
    const totalQuotePages =
        totalQuotes > 0
            ? Math.ceil(totalQuotes / itemsPerPage)
            : Math.ceil(filteredQuotes.length / itemsPerPage);

    const startQuoteIndex = (currentQuotePage - 1) * itemsPerPage;
    const endQuoteIndex = startQuoteIndex + itemsPerPage;

    const currentQuotes =
        totalQuotes > 0 ? filteredQuotes : filteredQuotes.slice(startQuoteIndex, endQuoteIndex);

    return (
        <Card className="border-border bg-card">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Quote Requests
                        </CardTitle>
                        <CardDescription>Manage quotes from Brokers</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <TableSearchFilter
                  searchTerm={quoteSearchTerm}
                  onSearchChange={setQuoteSearchTerm}
                  searchPlaceholder="Search quotes by product name..."
                  filters={quoteFilters}
                  activeFilters={quoteFiltersState}
                  onFilterChange={updateQuoteFilter}
                  onClearFilters={clearQuoteFilters}
                  className="mb-4"
                >
                  <ColumnVisibilityDropdown
                    columns={quoteColumns}
                    visibleColumns={visibleQuoteColumns}
                    onToggleColumn={(id) => toggleColumnVisibility('insurer-quotes', id, quoteColumns.map(c => c.id))}
                    onReset={() => setColumnVisibility('insurer-quotes', quoteColumns.map(c => c.id))}
                  />
                </TableSearchFilter>

                {quotesLoading ? (
                    <TableSkeleton rows={5} cols={visibleQuoteColumns.length} />
                ) : quotesError ? (
                    <div className="rounded-md border border-destructive/20 bg-destructive/10 text-destructive px-3 py-2">
                        {(quotesError as any)?.message || 'Failed to load quotes'}
                    </div>
                ) : (
                    <Table
                        equalColumns
                        columnCount={visibleQuoteColumns.length}
                        minColumnWidth={150}
                    >
                        <TableHeader>
                            <TableRow>
                                {visibleQuoteColumns.includes('quoteId') && <TableHead>Request ID</TableHead>}
                                {visibleQuoteColumns.includes('product') && <TableHead>Product</TableHead>}
                                {visibleQuoteColumns.includes('status') && <TableHead>Status</TableHead>}
                                {visibleQuoteColumns.includes('sumInsured') && <TableHead>Sum Insured</TableHead>}
                                {visibleQuoteColumns.includes('premium') && <TableHead>Premium</TableHead>}
                                {visibleQuoteColumns.includes('action') && <TableHead className="text-center">Action</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredQuotes.length > 0 ? (
                                currentQuotes.map((quote, index) => (
                                    <TableRow
                                        key={`${quote.id}-${quote.quoteNumber || quote.requestId || 'quote'}-${index}`}
                                        className="cursor-pointer hover:bg-muted/50"
                                    >
                                        {visibleQuoteColumns.includes('quoteId') && <TableCell className="font-medium">{quote.quoteNumber}</TableCell>}
                                        {visibleQuoteColumns.includes('product') && <TableCell className="font-medium">{quote.productName}</TableCell>}
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
                                        {visibleQuoteColumns.includes('sumInsured') && <TableCell className="font-medium">{quote.sumInsured}</TableCell>}
                                        {visibleQuoteColumns.includes('premium') && <TableCell className="font-medium">{quote.totalPremium}</TableCell>}
                                        {visibleQuoteColumns.includes('action') && (
                                            <TableCell className="text-center">
                                                <div className="flex justify-center">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        disabled={viewDetailsLoadingId === quote.id}
                                                        onClick={async () => {
                                                            setViewDetailsLoadingId(quote.id);
                                                            try {
                                                                const details = await getQuoteDashboardById(quote.id);
                                                                navigate(`/insurer/quote/${quote.id}`, {
                                                                    state: { quoteDashboard: details },
                                                                });
                                                            } catch {
                                                                navigate(`/insurer/quote/${quote.id}`);
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
                                    <TableCell colSpan={visibleQuoteColumns.length} className="text-center">
                                        No quotes found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}

                <div className="px-6 py-4 border-t flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                        {quotesRes?.meta
                            ? `Page ${quotesRes.meta.page ?? currentQuotePage} of ${totalQuotePages} · ${quotesRes.meta.total} quotes`
                            : `Showing ${filteredQuotes.length} quotes`}
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
            </CardContent>
        </Card>
    );
});

QuotesTab.displayName = 'QuotesTab';

export default QuotesTab;
