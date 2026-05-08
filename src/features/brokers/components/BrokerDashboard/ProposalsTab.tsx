import React, { useMemo, useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
    getBrokerDashboardProposals,
    type BrokerDashboardQuoteItemResponse,
    type BrokerDashboardQuotesResponse,
} from '@/features/market-admin/api/admin';
import { TableSearchFilter, FilterConfig } from '@/components/shared/TableSearchFilter';
import { ColumnVisibilityDropdown } from '@/components/shared/ColumnVisibilityDropdown';
import { useColumnVisibilityStore } from '@/shared/stores/useColumnVisibilityStore';
import TableSkeleton from '@/components/loaders/TableSkeleton';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { formatDateShort } from '@/shared/utils/date-format';
import { QuoteStatusDot } from '@/features/quotes/components/QuotesComparison/QuoteStatusDot';

const proposalColumns = [
    { id: 'proposalId', label: 'Proposal ID', isMandatory: true },
    { id: 'projectName', label: 'Product Name', isMandatory: true },
    { id: 'status', label: 'Status', isMandatory: true },
    { id: 'createdDate', label: 'Created Date' },
    { id: 'validity', label: 'Proposal Validity' },
    { id: 'actions', label: 'Actions', isMandatory: true },
];

interface ProposalsTabProps {
    itemsPerPage: number;
    isActive: boolean;
    selectedProductIds?: string[];
}

type BrokerDashboardQuoteItemWithCurrency = BrokerDashboardQuoteItemResponse & {
    currency?: string;
};

const ProposalsTab = React.memo(({ itemsPerPage, isActive, selectedProductIds }: ProposalsTabProps) => {
    const navigate = useNavigate();
    const [currentProposalPage, setCurrentProposalPage] = useState(1);
    const [proposalSearchInput, setProposalSearchInput] = useState('');
    const [proposalSearchDebounced, setProposalSearchDebounced] = useState('');
    const [proposalStatusFilter, setProposalStatusFilter] = useState<string | undefined>(undefined);
    const [proposalCreatedAtFilter, setProposalCreatedAtFilter] = useState<string | undefined>(undefined);

    // Column Visibility Store Integration
    const { toggleColumnVisibility, getTableVisibility, setColumnVisibility } = useColumnVisibilityStore();
    const visibleProposalColumns = getTableVisibility('broker-proposals', proposalColumns.map(c => c.id));
    const proposalDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const selectedProductsParam = useMemo(
        () => (selectedProductIds && selectedProductIds.length > 0 ? selectedProductIds.join(',') : undefined),
        [selectedProductIds],
    );

    const handleProposalSearchChange = useCallback((value: string) => {
        setProposalSearchInput(value);
        if (proposalDebounceRef.current) clearTimeout(proposalDebounceRef.current);
        proposalDebounceRef.current = setTimeout(() => {
            setProposalSearchDebounced(value);
            setCurrentProposalPage(1);
        }, 400);
    }, []);

    const handleProposalStatusFilterChange = useCallback((key: string, value: any) => {
        if (key === 'status') {
            const statusVal = Array.isArray(value) ? (value[0] as string | undefined) : (value as string | undefined);
            setProposalStatusFilter(statusVal || undefined);
            setCurrentProposalPage(1);
        } else if (key === 'createdDate') {
            const dateVal = Array.isArray(value) ? (value[0] as string | undefined) : (value as string | undefined);
            setProposalCreatedAtFilter(dateVal || undefined);
            setCurrentProposalPage(1);
        }
    }, []);

    const handleClearProposalFilters = useCallback(() => {
        setProposalSearchInput('');
        setProposalSearchDebounced('');
        setProposalStatusFilter(undefined);
        setProposalCreatedAtFilter(undefined);
        setCurrentProposalPage(1);
    }, []);

    const proposalFiltersState = useMemo<Record<string, any>>(() => {
        const f: Record<string, any> = {};
        if (proposalStatusFilter) f['status'] = proposalStatusFilter;
        if (proposalCreatedAtFilter) f['createdDate'] = proposalCreatedAtFilter;
        return f;
    }, [proposalStatusFilter, proposalCreatedAtFilter]);

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
            key: 'createdDate',
            label: 'Created Date',
            type: 'date',
        },
    ], []);

    const {
        data: proposalDetailRes,
        isLoading: isLoadingProposals,
        error,
    } = useQuery<BrokerDashboardQuotesResponse, Error>({
        queryKey: [
            'proposals',
            currentProposalPage,
            itemsPerPage,
            proposalSearchDebounced,
            proposalStatusFilter,
            proposalCreatedAtFilter,
            selectedProductsParam,
        ],
        queryFn: () =>
            getBrokerDashboardProposals({
                page: currentProposalPage,
                limit: itemsPerPage,
                search: proposalSearchDebounced || undefined,
                status: proposalStatusFilter || undefined,
                createdAt: proposalCreatedAtFilter || undefined,
                productId: selectedProductsParam || undefined,
                type: 'broker',
            }),
        enabled: isActive,
        staleTime: 1000 * 60 * 2,
    });

    React.useEffect(() => {
        setCurrentProposalPage(1);
    }, [selectedProductsParam]);

    const totalQuotePages = proposalDetailRes?.meta?.totalPages ?? 1;

    return (
        <Card className="border-border bg-card">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Recent Proposals
                        </CardTitle>
                        <CardDescription>
                            Manage and track all contractor insurance proposals
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <TableSearchFilter
                    searchTerm={proposalSearchInput}
                    onSearchChange={handleProposalSearchChange}
                    searchPlaceholder="Search proposals by client name, project, or quote ID..."
                    filters={quoteFilters}
                    activeFilters={proposalFiltersState}
                    onFilterChange={handleProposalStatusFilterChange}
                    onClearFilters={handleClearProposalFilters}
                    className="mb-4"
                >
                    <ColumnVisibilityDropdown
                        columns={proposalColumns}
                        visibleColumns={visibleProposalColumns}
                        onToggleColumn={(id) => toggleColumnVisibility('broker-proposals', id, proposalColumns.map(c => c.id))}
                        onReset={() => setColumnVisibility('broker-proposals', proposalColumns.map(c => c.id))}
                    />
                </TableSearchFilter>

                {isLoadingProposals ? (
                    <Table>
                        <TableBody key={currentProposalPage}>
                            <TableSkeleton rows={6} cols={visibleProposalColumns.length} />
                        </TableBody>
                    </Table>
                ) : error ? (
                    <div className="rounded-md border border-destructive/20 bg-destructive/10 text-destructive px-3 py-2">
                        {error.message}
                    </div>
                ) : (
                    <Table
                        equalColumns
                        columnCount={visibleProposalColumns.length}
                        minColumnWidth={150}
                    >
                        <TableHeader>
                            <TableRow>
                                {visibleProposalColumns.includes('proposalId') && <TableHead>Proposal ID</TableHead>}
                                {visibleProposalColumns.includes('projectName') && <TableHead>Product Name</TableHead>}
                                {visibleProposalColumns.includes('status') && <TableHead>Status</TableHead>}
                                {visibleProposalColumns.includes('createdDate') && <TableHead>Created Date</TableHead>}
                                {visibleProposalColumns.includes('validity') && <TableHead>Proposal Validity</TableHead>}
                                {visibleProposalColumns.includes('actions') && <TableHead className="text-center">Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody key={currentProposalPage}>
                            {proposalDetailRes?.items?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={visibleProposalColumns.length} className="text-center text-muted-foreground py-8">
                                        No proposals found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                proposalDetailRes?.items?.map((quote) => (
                                    <TableRow
                                        key={`${currentProposalPage}-${String(quote.id)}`}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => navigate(`/broker/quote/${quote.id}`)}
                                    >
                                        {visibleProposalColumns.includes('proposalId') && (
                                            <TableCell className="font-medium">
                                                {quote.proposalId}
                                            </TableCell>
                                        )}
                                        {visibleProposalColumns.includes('projectName') && (
                                            <TableCell className="truncate" title={quote.productName}>
                                                {quote.productName && quote.productName.length > 15
                                                    ? `${quote.productName.substring(0, 15)}...`
                                                    : quote.productName || '-'}
                                            </TableCell>
                                        )}
                                        {visibleProposalColumns.includes('status') && (
                                            <TableCell>
                                                <QuoteStatusDot status={quote.status} />
                                            </TableCell>
                                        )}
                                        {visibleProposalColumns.includes('createdDate') && (
                                            <TableCell className="text-sm text-muted-foreground">
                                                {quote.createdAt ? formatDateShort(quote.createdAt) : '-'}
                                            </TableCell>
                                        )}
                                        {visibleProposalColumns.includes('validity') && (
                                            <TableCell className="text-sm text-muted-foreground">
                                                {quote.validityDate
                                                    ? formatDateShort(quote.validityDate)
                                                    : typeof (quote as any).validUntil === 'string'
                                                        ? formatDateShort((quote as any).validUntil)
                                                        : '-'}
                                            </TableCell>
                                        )}
                                        {visibleProposalColumns.includes('actions') && (
                                            <TableCell className="text-center">
                                                <div className="flex gap-2 justify-center">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/broker/quote/${quote.id}?isProposal=${true}`);
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
                            )}
                        </TableBody>
                    </Table>
                )}

                <div className="px-6 py-4 border-t flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                        {proposalDetailRes?.meta
                            ? `Page ${proposalDetailRes.meta.currentPage} of ${proposalDetailRes.meta.totalPages
                            } · ${proposalDetailRes.meta.totalItems ?? proposalDetailRes.items?.length ?? 0
                            } proposals`
                            : ''}
                    </div>
                    <div className="ml-auto">
                        <Pagination className="w-auto justify-end">
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (currentProposalPage > 1)
                                                setCurrentProposalPage(currentProposalPage - 1);
                                        }}
                                        className={
                                            currentProposalPage === 1 ? 'pointer-events-none opacity-50' : ''
                                        }
                                    />
                                </PaginationItem>
                                {(() => {
                                    const maxPages = 5;
                                    let startPage = 1;
                                    let endPage = Math.min(maxPages, totalQuotePages);

                                    if (totalQuotePages > maxPages) {
                                        if (currentProposalPage <= 3) {
                                            startPage = 1;
                                            endPage = maxPages;
                                        } else if (currentProposalPage >= totalQuotePages - 2) {
                                            startPage = totalQuotePages - maxPages + 1;
                                            endPage = totalQuotePages;
                                        } else {
                                            startPage = currentProposalPage - 2;
                                            endPage = currentProposalPage + 2;
                                        }
                                    }

                                    return Array.from(
                                        { length: endPage - startPage + 1 },
                                        (_, i) => startPage + i,
                                    ).map((pageNum) => (
                                        <PaginationItem key={pageNum}>
                                            <PaginationLink
                                                href="#"
                                                isActive={currentProposalPage === pageNum}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setCurrentProposalPage(pageNum);
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
                                            if (currentProposalPage < totalQuotePages)
                                                setCurrentProposalPage(currentProposalPage + 1);
                                        }}
                                        className={
                                            currentProposalPage === totalQuotePages
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

ProposalsTab.displayName = 'ProposalsTab';

export default ProposalsTab;
