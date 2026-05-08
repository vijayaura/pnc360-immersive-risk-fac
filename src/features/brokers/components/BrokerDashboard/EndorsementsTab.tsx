import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Eye, FileText, MessageSquare, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/shared/utils/lib-utils';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { listEndorsements } from '@/lib/api/endorsements';
import { ColumnVisibilityDropdown } from '@/components/shared/ColumnVisibilityDropdown';
import { useColumnVisibilityStore } from '@/shared/stores/useColumnVisibilityStore';
import { mapListItemToRow } from '@/features/insurers/components/endorsement-types';
import type { EndorsementListRow, Status } from '@/features/insurers/components/endorsement-types';
import TableSkeleton from '@/components/loaders/TableSkeleton';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { format } from 'date-fns';

const endorsementColumns = [
    { id: 'reference', label: 'Endorsement Reference', isMandatory: true },
    { id: 'policyNumber', label: 'Policy Number', isMandatory: true },
    { id: 'type', label: 'Type' },
    { id: 'createdDate', label: 'Created Date' },
    { id: 'effectiveDate', label: 'Effective Date' },
    { id: 'premium', label: 'Premium Amount' },
    { id: 'status', label: 'Status', isMandatory: true },
    { id: 'messages', label: 'Messages' },
    { id: 'action', label: 'Action', isMandatory: true },
];

interface EndorsementsTabProps {
    itemsPerPage: number;
    isActive: boolean;
    brokerOrgId: string | undefined;
    selectedProductIds?: string[];
}

const getEndorsementStatusColor = (status: Status): string => {
    switch (status) {
        case 'Draft':
            return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
        case 'Submitted':
            return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
        case 'Approved':
            return 'bg-green-500/10 text-green-600 border-green-500/20';
        case 'Rejected':
            return 'bg-red-500/10 text-red-600 border-red-500/20';
        default:
            return 'bg-muted text-muted-foreground border-border';
    }
};

function formatPremiumAmount(amount?: number | null): string {
    if (amount == null || Number.isNaN(Number(amount))) return 'N/A';
    return Number(amount).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function getUnreadRowClassName(isUnread?: boolean): string {
    return isUnread ? 'bg-primary/12 hover:bg-primary/18' : 'hover:bg-muted/50';
}

const EndorsementsTab = React.memo(({ itemsPerPage, isActive, brokerOrgId, selectedProductIds }: EndorsementsTabProps) => {
    const navigate = useNavigate();
    const [endorsementPage, setEndorsementPage] = useState(1);
    const [endorsementSearch, setEndorsementSearch] = useState('');
    const [debouncedEndorsementSearch, setDebouncedEndorsementSearch] = useState('');
    const endorsementSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [endorsementStatusFilter, setEndorsementStatusFilter] = useState<string>('all-statuses');
    const [endorsementTypeFilter, setEndorsementTypeFilter] = useState<string>('all-types');
    
    // Column Visibility Store Integration
    const { toggleColumnVisibility, getTableVisibility, setColumnVisibility } = useColumnVisibilityStore();
    const visibleEndorsementColumns = getTableVisibility('broker-endorsements', endorsementColumns.map(c => c.id));
    const hasActiveFilters =
        endorsementSearch.trim() !== '' ||
        endorsementStatusFilter !== 'all-statuses' ||
        endorsementTypeFilter !== 'all-types';
    const selectedProductsParam = useMemo(
        () => (selectedProductIds && selectedProductIds.length > 0 ? selectedProductIds.join(',') : undefined),
        [selectedProductIds],
    );

    const handleSearchChange = useCallback((value: string) => {
        setEndorsementSearch(value);
        if (endorsementSearchDebounceRef.current) clearTimeout(endorsementSearchDebounceRef.current);
        endorsementSearchDebounceRef.current = setTimeout(() => {
            setDebouncedEndorsementSearch(value);
            setEndorsementPage(1);
        }, 400);
    }, []);

    const handleClearFilters = useCallback(() => {
        if (endorsementSearchDebounceRef.current) clearTimeout(endorsementSearchDebounceRef.current);
        setEndorsementSearch('');
        setDebouncedEndorsementSearch('');
        setEndorsementStatusFilter('all-statuses');
        setEndorsementTypeFilter('all-types');
        setEndorsementPage(1);
    }, []);

    const {
        data: endorsementsRes,
        isLoading: endorsementsLoading,
        error: endorsementsError,
    } = useQuery({
        queryKey: [
            'broker-endorsements',
            endorsementPage,
            itemsPerPage,
            debouncedEndorsementSearch,
            endorsementStatusFilter,
            endorsementTypeFilter,
            brokerOrgId,
            selectedProductsParam,
        ],
        queryFn: () =>
            listEndorsements({
                page: endorsementPage,
                limit: itemsPerPage,
                search: debouncedEndorsementSearch.trim() || undefined,
                status: endorsementStatusFilter !== 'all-statuses' ? endorsementStatusFilter : undefined,
                type: endorsementTypeFilter !== 'all-types' ? endorsementTypeFilter : undefined,
                productId: selectedProductsParam || undefined,
                brokerId: brokerOrgId,
            }),
        enabled: isActive,
        staleTime: 1000 * 60 * 2,
    });

    React.useEffect(() => {
        setEndorsementPage(1);
    }, [selectedProductsParam]);

    const endorsementRows = useMemo<EndorsementListRow[]>(() => {
        try {
            return (endorsementsRes?.data || []).map(mapListItemToRow);
        } catch {
            return [];
        }
    }, [endorsementsRes]);

    const endorsementMeta = endorsementsRes?.meta ?? null;

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Endorsements
                            {endorsementMeta != null ? ` (${endorsementMeta.total})` : ''}
                        </CardTitle>
                        <CardDescription>
                            View and manage policy endorsements
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="search-filter-container mb-6 flex items-start gap-3">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input
                                placeholder="Search endorsements..."
                                className="pl-10 bg-background"
                                value={endorsementSearch}
                                onChange={(e) => handleSearchChange(e.target.value)}
                            />
                        </div>

                        <Select
                            value={endorsementStatusFilter}
                            onValueChange={(val) => {
                                setEndorsementStatusFilter(val);
                                setEndorsementPage(1);
                            }}
                        >
                            <SelectTrigger className="bg-background">
                                <span className="truncate">
                                    {endorsementStatusFilter === 'all-statuses'
                                        ? 'All Statuses'
                                        : endorsementStatusFilter.charAt(0).toUpperCase() + endorsementStatusFilter.slice(1)}
                                </span>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all-statuses">All Statuses</SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="submitted">Submitted</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={endorsementTypeFilter}
                            onValueChange={(val) => {
                                setEndorsementTypeFilter(val);
                                setEndorsementPage(1);
                            }}
                        >
                            <SelectTrigger className="bg-background">
                                <span className="truncate">
                                    {endorsementTypeFilter === 'all-types'
                                        ? 'All Types'
                                        : endorsementTypeFilter === 'technical'
                                            ? 'Financial'
                                            : endorsementTypeFilter === 'non_technical'
                                                ? 'Non-Financial'
                                                : endorsementTypeFilter === 'extensions'
                                                    ? 'Extensions'
                                                    : 'Cancellation'}
                                </span>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all-types">All Types</SelectItem>
                                <SelectItem value="technical">Financial</SelectItem>
                                <SelectItem value="non_technical">Non-Financial</SelectItem>
                                <SelectItem value="extensions">Extensions</SelectItem>
                                <SelectItem value="cancellation">Cancellation</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClearFilters}
                            disabled={!hasActiveFilters}
                        >
                            Clear Filter
                        </Button>
                    </div>
                    <div className="ml-auto pt-0.5">
                      <ColumnVisibilityDropdown
                        columns={endorsementColumns}
                        visibleColumns={visibleEndorsementColumns}
                        onToggleColumn={(id) => toggleColumnVisibility('broker-endorsements', id, endorsementColumns.map(c => c.id))}
                        onReset={() => setColumnVisibility('broker-endorsements', endorsementColumns.map(c => c.id))}
                      />
                    </div>
                </div>

                {endorsementsLoading ? (
                    <TableSkeleton rows={5} cols={visibleEndorsementColumns.length} />
                ) : endorsementsError ? (
                    <div className="rounded-md border border-destructive/20 bg-destructive/10 text-destructive px-3 py-2">
                        {endorsementsError instanceof Error ? endorsementsError.message : 'Failed to load endorsements'}
                    </div>
                ) : (
                    <Table className="table-auto w-auto min-w-full">
                        <TableHeader>
                            <TableRow>
                                {visibleEndorsementColumns.includes('reference') && <TableHead className="min-w-fit whitespace-nowrap">Endorsement Reference</TableHead>}
                                {visibleEndorsementColumns.includes('policyNumber') && <TableHead className="min-w-fit whitespace-nowrap">Policy Number</TableHead>}
                                {visibleEndorsementColumns.includes('type') && <TableHead className="min-w-fit whitespace-nowrap">Type</TableHead>}
                                {visibleEndorsementColumns.includes('createdDate') && <TableHead className="min-w-fit whitespace-nowrap">Created Date</TableHead>}
                                {visibleEndorsementColumns.includes('effectiveDate') && <TableHead className="min-w-fit whitespace-nowrap">Effective Date</TableHead>}
                                {visibleEndorsementColumns.includes('premium') && <TableHead className="min-w-fit whitespace-nowrap">Premium Amount</TableHead>}
                                {visibleEndorsementColumns.includes('status') && <TableHead className="min-w-fit whitespace-nowrap">Status</TableHead>}
                                {visibleEndorsementColumns.includes('messages') && <TableHead className="min-w-fit whitespace-nowrap text-center">Messages</TableHead>}
                                {visibleEndorsementColumns.includes('action') && <TableHead className="min-w-fit whitespace-nowrap text-center">Action</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody key={endorsementPage}>
                            {endorsementRows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={visibleEndorsementColumns.length} className="text-center text-muted-foreground py-8">
                                        {endorsementSearch
                                            ? 'No endorsements match your search.'
                                            : 'No endorsements found.'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                endorsementRows.map((end) => (
                                    <TableRow
                                        key={`${endorsementPage}-${String(end.id)}`}
                                        className={getUnreadRowClassName(end.isUnreadEndorsement)}
                                    >
                                        {visibleEndorsementColumns.includes('reference') && (
                                            <TableCell className="font-medium whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span>{end.endorsementReference}</span>
                                                    {end.isUnreadEndorsement && (
                                                        <Badge
                                                            variant="secondary"
                                                            className="border border-primary/30 bg-primary/20 text-primary hover:bg-primary/20"
                                                        >
                                                            New
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                        )}
                                        {visibleEndorsementColumns.includes('policyNumber') && <TableCell className="whitespace-nowrap">{end.policyNumber}</TableCell>}
                                        {visibleEndorsementColumns.includes('type') && <TableCell className="whitespace-nowrap"><span className="text-sm">{end.endorsementType}</span></TableCell>}
                                        {visibleEndorsementColumns.includes('createdDate') && <TableCell className="whitespace-nowrap">{end.createdAt ? format(end.createdAt, 'yyyy-MM-dd') : '-'}</TableCell>}
                                        {visibleEndorsementColumns.includes('effectiveDate') && <TableCell className="whitespace-nowrap">{end.effectiveDate ? format(end.effectiveDate, 'yyyy-MM-dd') : '-'}</TableCell>}
                                        {visibleEndorsementColumns.includes('premium') && <TableCell className="break-all min-w-[120px]">{formatPremiumAmount(end.totalEndorsementAmount)}</TableCell>}
                                        {visibleEndorsementColumns.includes('status') && (
                                            <TableCell className="whitespace-nowrap">
                                                <Badge
                                                    variant="outline"
                                                    className={cn("capitalize font-semibold whitespace-nowrap", getEndorsementStatusColor(end.status))}
                                                >
                                                    {end.status}
                                                </Badge>
                                            </TableCell>
                                        )}
                                        {visibleEndorsementColumns.includes('messages') && (
                                            <TableCell 
                                                className="whitespace-nowrap text-center cursor-pointer hover:bg-muted/30 transition-colors"
                                                onClick={() => {
                                                    const targetUrl = end.status === 'Draft'
                                                        ? `/broker/endorsements/edit/${end.id}`
                                                        : `/broker/endorsements/view/${end.id}`;
                                                    navigate(`${targetUrl}?openMessage=true`);
                                                }}
                                            >
                                                <div className="flex justify-center">
                                                    {(() => {
                                                        const count = Number(end.unreadMessageCount || 0);
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
                                        {visibleEndorsementColumns.includes('action') && (
                                            <TableCell className="text-center whitespace-nowrap">
                                                <div className="flex justify-center">
                                                    {(() => {
                                                        const isDraft = end.status === 'Draft';
                                                        const targetUrl = isDraft
                                                            ? `/broker/endorsements/edit/${end.id}`
                                                            : `/broker/endorsements/view/${end.id}`;

                                                        return (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => navigate(targetUrl)}
                                                    >
                                                        {isDraft ? <Edit className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                                                        {isDraft ? 'Edit' : 'View'}
                                                    </Button>
                                                        );
                                                    })()}
                                                </div>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                )}

                {endorsementMeta && endorsementMeta.total > 0 && (
                    <div className="px-6 py-4 border-t flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                            Showing {endorsementRows.length} of {endorsementMeta.total} results
                        </div>
                        <div className="ml-auto">
                            <Pagination className="w-auto justify-end">
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (endorsementPage > 1) setEndorsementPage(endorsementPage - 1);
                                            }}
                                            className={endorsementPage === 1 ? 'pointer-events-none opacity-50' : ''}
                                        />
                                    </PaginationItem>
                                    {(() => {
                                        const maxPages = 5;
                                        const totalPages = endorsementMeta.totalPages;
                                        let startPage = 1;
                                        let endPage = Math.min(maxPages, totalPages);
                                        if (totalPages > maxPages) {
                                            if (endorsementPage <= 3) {
                                                startPage = 1;
                                                endPage = maxPages;
                                            } else if (endorsementPage >= totalPages - 2) {
                                                startPage = totalPages - maxPages + 1;
                                                endPage = totalPages;
                                            } else {
                                                startPage = endorsementPage - 2;
                                                endPage = endorsementPage + 2;
                                            }
                                        }
                                        return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map((pageNum) => (
                                            <PaginationItem key={pageNum}>
                                                <PaginationLink
                                                    href="#"
                                                    isActive={endorsementPage === pageNum}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setEndorsementPage(pageNum);
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
                                                if (endorsementPage < endorsementMeta.totalPages) setEndorsementPage(endorsementPage + 1);
                                            }}
                                            className={endorsementPage === endorsementMeta.totalPages ? 'pointer-events-none opacity-50' : ''}
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

EndorsementsTab.displayName = 'EndorsementsTab';

export default EndorsementsTab;
