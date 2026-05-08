import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
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
import { Eye, MessageSquare, Send } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { listReferrals } from '@/features/proposals/api/referrals';
import { ColumnVisibilityDropdown } from '@/components/shared/ColumnVisibilityDropdown';
import { useColumnVisibilityStore } from '@/shared/stores/useColumnVisibilityStore';
import TableSkeleton from '@/components/loaders/TableSkeleton';
import { getReferralStatusColor, getReferralStatusLabel, REFERRAL_STATUSES } from '@/lib/referral-status';
import { cn } from '@/shared/utils/lib-utils';
import { TableSearchFilter, FilterConfig } from '@/components/shared/TableSearchFilter';
import { TruncatedStatusBadge } from '@/components/shared/TruncatedStatusBadge';

const referralColumns = [
    { id: 'referralId', label: 'Referral ID', isMandatory: true },
    { id: 'quoteId', label: 'Quote ID', isMandatory: true },
    { id: 'projectType', label: 'Product Type', isMandatory: true },
    { id: 'status', label: 'Status', isMandatory: true },
    { id: 'reason', label: 'Reason' },
    { id: 'messages', label: 'Messages' },
    { id: 'action', label: 'Action', isMandatory: true },
];

interface ReferralsTabProps {
    itemsPerPage: number;
    isActive: boolean;
    selectedProductIds?: string[];
}

const ReferralsTab = React.memo(({ itemsPerPage, isActive, selectedProductIds }: ReferralsTabProps) => {
    const navigate = useNavigate();
    const selectedProductsParam = useMemo(
        () => (selectedProductIds && selectedProductIds.length > 0 ? selectedProductIds.join(',') : undefined),
        [selectedProductIds],
    );
    const [currentReferralPage, setCurrentReferralPage] = useState(1);
    const [referralSearch, setReferralSearch] = useState('');
    const [referralSearchInput, setReferralSearchInput] = useState('');
    const [referralStatusFilter, setReferralStatusFilter] = useState<string | undefined>(undefined);
    
    // Column Visibility Store Integration
    const { toggleColumnVisibility, getTableVisibility, setColumnVisibility } = useColumnVisibilityStore();
    const visibleReferralColumns = getTableVisibility('insurer-referrals', referralColumns.map(c => c.id));
    const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleSearchChange = useCallback((value: string) => {
        setReferralSearchInput(value);
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = setTimeout(() => {
            setReferralSearch(value);
            setCurrentReferralPage(1);
        }, 400);
    }, []);

    const handleFilterChange = useCallback((key: string, value: any) => {
        if (key === 'status') {
            const statusVal = Array.isArray(value) ? (value[0] as string | undefined) : (value as string | undefined);
            setReferralStatusFilter(statusVal || undefined);
        }
        setCurrentReferralPage(1);
    }, []);

    const handleClearFilters = useCallback(() => {
        setReferralSearchInput('');
        setReferralSearch('');
        setReferralStatusFilter(undefined);
        setCurrentReferralPage(1);
    }, []);

    const activeFiltersState = useMemo<Record<string, any>>(() => {
        const f: Record<string, any> = {};
        if (referralStatusFilter) f['status'] = referralStatusFilter;
        return f;
    }, [referralStatusFilter]);

    const filtersConfig = useMemo<FilterConfig[]>(() => [
        {
            key: 'status',
            label: 'Status',
            type: 'select',
            options: [
                { value: REFERRAL_STATUSES.OPEN, label: 'Open' },
                { value: REFERRAL_STATUSES.IN_REVIEW, label: 'In Review' },
                { value: REFERRAL_STATUSES.QUERY_RAISED, label: 'Query Raised' },
                { value: REFERRAL_STATUSES.APPROVED, label: 'Approved' },
                { value: REFERRAL_STATUSES.APPROVED_WITH_CONDITIONS, label: 'Approved w/ Conditions' },
                { value: REFERRAL_STATUSES.DECLINED, label: 'Declined' },
                { value: REFERRAL_STATUSES.CLOSED, label: 'Closed' },
            ],
        },
    ], []);

    const {
        data: referralsRes,
        isLoading: referralsLoading,
        error: referralsError,
    } = useQuery({
        queryKey: [
            'insurer-referrals', 
            currentReferralPage, 
            itemsPerPage,
            referralSearch,
            referralStatusFilter,
            selectedProductsParam,
        ],
        queryFn: () => listReferrals({ 
            page: currentReferralPage, 
            limit: itemsPerPage,
            search: referralSearch || undefined,
            status: referralStatusFilter || undefined,
            productId: selectedProductsParam || undefined,
        }),
        placeholderData: (prev) => prev,
        staleTime: 1000 * 60 * 2,
        enabled: isActive,
    });

    useEffect(() => {
        setCurrentReferralPage(1);
    }, [selectedProductsParam]);

    return (
        <Card className="border-border bg-card">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Send className="w-5 h-5" />
                            Referrals
                        </CardTitle>
                        <CardDescription>Manage and review quotes up for referral</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <TableSearchFilter
                  searchTerm={referralSearchInput}
                  onSearchChange={handleSearchChange}
                  searchPlaceholder="Search referrals by referralId quoteId..."
                  filters={filtersConfig}
                  activeFilters={activeFiltersState}
                  onFilterChange={handleFilterChange}
                  onClearFilters={handleClearFilters}
                  className="mb-4"
                >
                  <ColumnVisibilityDropdown
                    columns={referralColumns}
                    visibleColumns={visibleReferralColumns}
                    onToggleColumn={(id) => toggleColumnVisibility('insurer-referrals', id, referralColumns.map(c => c.id))}
                    onReset={() => setColumnVisibility('insurer-referrals', referralColumns.map(c => c.id))}
                  />
                </TableSearchFilter>

                {referralsLoading ? (
                    <TableSkeleton rows={5} cols={visibleReferralColumns.length} />
                ) : referralsError ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                        Failed to load referrals. Please try again.
                    </div>
                ) : (
                    <Table
                        equalColumns
                        columnCount={visibleReferralColumns.length}
                        minColumnWidth={160}
                    >
                        <TableHeader>
                            <TableRow>
                                {visibleReferralColumns.includes('referralId') && <TableHead>Referral ID</TableHead>}
                                {visibleReferralColumns.includes('quoteId') && <TableHead>Quote ID</TableHead>}
                                {visibleReferralColumns.includes('projectType') && <TableHead>Product Type</TableHead>}
                                {visibleReferralColumns.includes('status') && <TableHead className="w-[160px]">Status</TableHead>}
                                {visibleReferralColumns.includes('reason') && <TableHead>Reason</TableHead>}
                                {visibleReferralColumns.includes('messages') && <TableHead className="text-center">Messages</TableHead>}
                                {visibleReferralColumns.includes('action') && <TableHead className="text-center">Action</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(referralsRes?.data || []).length > 0 ? (
                                (referralsRes?.data || []).map((referral) => (
                                    <TableRow key={referral.id} className="hover:bg-muted/50">
                                        {visibleReferralColumns.includes('referralId') && <TableCell className="font-medium">{referral.referralId}</TableCell>}
                                        {visibleReferralColumns.includes('quoteId') && <TableCell className="font-medium">{referral.quoteId}</TableCell>}
                                        {visibleReferralColumns.includes('projectType') && (
                                            <TableCell className="font-medium">
                                                {referral.projectType || referral.productName || '-'}
                                            </TableCell>
                                        )}
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
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <div className="line-clamp-2 cursor-help text-muted-foreground transition-colors hover:text-foreground leading-relaxed">
                                                                    {referral.reason}
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent className="max-w-[300px] p-3 text-xs leading-relaxed bg-[#0a1a1a] text-white border-teal-900/50">
                                                                <div className="font-bold mb-1.5 text-emerald-400 uppercase tracking-wider text-[10px]">Referral Reason</div>
                                                                {referral.reason}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                        )}
                                        {visibleReferralColumns.includes('messages') && (
                                            <TableCell 
                                                className="text-center cursor-pointer hover:bg-muted/30 transition-colors"
                                                onClick={() => navigate(`/insurer/referral/${referral.id}?openMessage=true`)}
                                            >
                                                <div className="flex justify-center">
                                                {(() => {
                                                    const count = Number(referral.unreadMessageCount || 0);
                                                    return count > 0 ? (
                                                        <div className="relative w-fit">
                                                            <MessageSquare className="w-5 h-5 text-blue-500" />
                                                            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                                                {count}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <MessageSquare className="w-5 h-5 text-gray-400" />
                                                    );
                                                })()}
                                                </div>
                                            </TableCell>
                                        )}
                                        {visibleReferralColumns.includes('action') && (
                                            <TableCell className="text-center">
                                                <div className="flex justify-center">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            navigate(
                                                                `/insurer/referral/${referral.id}?quoteId=${referral.quoteId}`,
                                                            )
                                                        }
                                                    >
                                                        <Eye className="w-4 h-4 mr-1" />
                                                        Review
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={visibleReferralColumns.length} className="text-center py-8 text-muted-foreground">
                                        No referrals available
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}

                {referralsRes?.meta && (
                    <div className="px-6 py-4 border-t flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                            {`Page ${referralsRes.meta.page ?? currentReferralPage} of ${referralsRes.meta.totalPages || 1} · ${referralsRes.meta.total} referrals`}
                        </div>
                        <div className="ml-auto">
                            <Pagination className="w-auto justify-end">
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (currentReferralPage > 1) setCurrentReferralPage(currentReferralPage - 1);
                                            }}
                                            className={
                                                currentReferralPage === 1 ? 'pointer-events-none opacity-50' : ''
                                            }
                                        />
                                    </PaginationItem>
                                    {(() => {
                                        const maxPages = 5;
                                        const totalPages = referralsRes.meta.totalPages || 1;
                                        let startPage = 1;
                                        let endPage = Math.min(maxPages, totalPages);
                                        if (totalPages > maxPages) {
                                            if (currentReferralPage <= 3) {
                                                startPage = 1;
                                                endPage = maxPages;
                                            } else if (currentReferralPage >= totalPages - 2) {
                                                startPage = totalPages - maxPages + 1;
                                                endPage = totalPages;
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
                                                if (currentReferralPage < (referralsRes.meta?.totalPages || 1))
                                                    setCurrentReferralPage(currentReferralPage + 1);
                                            }}
                                            className={
                                                currentReferralPage === (referralsRes.meta?.totalPages || 1)
                                                    ? 'pointer-events-none opacity-50'
                                                    : ''
                                            }
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
});

ReferralsTab.displayName = 'ReferralsTab';

export default ReferralsTab;
