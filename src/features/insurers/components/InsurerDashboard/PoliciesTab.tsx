import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Shield } from 'lucide-react';
import { TableSearchFilter, FilterConfig } from '@/components/shared/TableSearchFilter';
import { ColumnVisibilityDropdown } from '@/components/shared/ColumnVisibilityDropdown';
import { useColumnVisibilityStore } from '@/shared/stores/useColumnVisibilityStore';
import { useQuery } from '@tanstack/react-query';
import { listPolicies } from '@/features/quotes/api/policies';
import { getProducts } from '@/features/product-config/api/products';
import TableSkeleton from '@/components/loaders/TableSkeleton';
import { formatDateShort } from '@/shared/utils/date-format';
import { formatCurrencyLocale } from '@/shared/utils/lib-utils';

const policyColumns = [
    { id: 'policyNumber', label: 'Policy Number', isMandatory: true },
    { id: 'projectName', label: 'Product Name', isMandatory: true },
    { id: 'sumInsured', label: 'Sum Insured' },
    { id: 'premium', label: 'Premium' },
    { id: 'startDate', label: 'Start Date' },
    { id: 'endDate', label: 'End Date' },
    { id: 'actions', label: 'Actions', isMandatory: true },
];

interface PoliciesTabProps {
    itemsPerPage: number;
    isActive: boolean;
    selectedProductIds?: string[];
}

const PoliciesTab = React.memo(({ itemsPerPage, isActive, selectedProductIds }: PoliciesTabProps) => {
    const navigate = useNavigate();
    const selectedProductsParam = useMemo(
        () => (selectedProductIds && selectedProductIds.length > 0 ? selectedProductIds.join(',') : undefined),
        [selectedProductIds],
    );

    const [currentPolicyPage, setCurrentPolicyPage] = useState(1);
    const [policySearchInput, setPolicySearchInput] = useState('');
    const [policySearchDebounced, setPolicySearchDebounced] = useState('');
    const [policyStatusFilter, setPolicyStatusFilter] = useState<string | undefined>(undefined);
    const [policyProductFilter, setPolicyProductFilter] = useState<string | undefined>(undefined);
    const [policyStartFilter, setPolicyStartFilter] = useState<string | undefined>(undefined);
    const [policyEndFilter, setPolicyEndFilter] = useState<string | undefined>(undefined);
    
    // Column Visibility Store Integration
    const { toggleColumnVisibility, getTableVisibility, setColumnVisibility } = useColumnVisibilityStore();
    const visiblePolicyColumns = getTableVisibility('insurer-policies', policyColumns.map(c => c.id));
    const policyDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { data: productsRes } = useQuery({
        queryKey: ['insurer-products'],
        queryFn: () => getProducts(),
        staleTime: 1000 * 60 * 5,
        enabled: isActive,
    });

    const handlePolicySearchChange = useCallback((value: string) => {
        setPolicySearchInput(value);
        if (policyDebounceRef.current) clearTimeout(policyDebounceRef.current);
        policyDebounceRef.current = setTimeout(() => {
            setPolicySearchDebounced(value);
            setCurrentPolicyPage(1);
        }, 400);
    }, []);

    const handlePolicyFilterChange = useCallback((key: string, value: any) => {
        if (key === 'status') {
            const statusVal = Array.isArray(value) ? (value[0] as string | undefined) : (value as string | undefined);
            setPolicyStatusFilter(statusVal ? statusVal.toLowerCase() : undefined);
        } else if (key === 'productId') {
            const v = typeof value === 'string' ? value : undefined;
            setPolicyProductFilter(v && v.trim() ? v : undefined);
        } else if (key === 'startDate') {
            setPolicyStartFilter(value || undefined);
        } else if (key === 'endDate') {
            setPolicyEndFilter(value || undefined);
        }
        setCurrentPolicyPage(1);
    }, []);

    const handleClearPolicyFilters = useCallback(() => {
        setPolicySearchInput('');
        setPolicySearchDebounced('');
        setPolicyStatusFilter(undefined);
        setPolicyProductFilter(undefined);
        setPolicyStartFilter(undefined);
        setPolicyEndFilter(undefined);
        setCurrentPolicyPage(1);
    }, []);

    const policyFiltersState = useMemo<Record<string, any>>(() => {
        const f: Record<string, any> = {};
        if (policyStatusFilter) f['status'] = policyStatusFilter;
        if (policyProductFilter) f['productId'] = policyProductFilter;
        if (policyStartFilter) f['startDate'] = policyStartFilter;
        if (policyEndFilter) f['endDate'] = policyEndFilter;
        return f;
    }, [policyStatusFilter, policyProductFilter, policyStartFilter, policyEndFilter]);

    const policyFilters = useMemo<FilterConfig[]>(() => [
        {
            key: 'status',
            label: 'Status',
            type: 'select',
            options: [
                { value: 'draft', label: 'Draft' },
                { value: 'active', label: 'Active' },
                { value: 'cancelled', label: 'Cancelled' },
                { value: 'expired', label: 'Expired' },
            ],
        },
        {
            key: 'productId',
            label: 'Product Type',
            type: 'select',
            options:
                productsRes?.items
                    ?.filter((p: { id?: unknown }) => p != null && p.id != null && String(p.id).length > 0)
                    .map((p: { id: string | number; name?: string }) => ({
                        value: String(p.id),
                        label: p.name != null ? String(p.name) : 'Product',
                    })) || [],
        },
        {
            key: 'startDate',
            label: 'Start Date',
            type: 'date',
        },
        {
            key: 'endDate',
            label: 'End Date',
            type: 'date',
        },
    ], [productsRes]);

    const {
        data: policiesRes,
        isLoading: policiesLoading,
        error: policiesError,
    } = useQuery({
        queryKey: [
            'insurer-policies',
            currentPolicyPage,
            itemsPerPage,
            policySearchDebounced,
            policyStatusFilter,
            selectedProductsParam,
            policyProductFilter,
            policyStartFilter,
            policyEndFilter,
        ],
        queryFn: () =>
            listPolicies({
                page: currentPolicyPage,
                limit: itemsPerPage,
                search: policySearchDebounced || undefined,
                status: policyStatusFilter || undefined,
                productId: selectedProductsParam || policyProductFilter || undefined,
                startDate: policyStartFilter || undefined,
                endDate: policyEndFilter || undefined,
            }),
        staleTime: 1000 * 60 * 2,
        enabled: isActive,
    });

    useEffect(() => {
        setCurrentPolicyPage(1);
    }, [selectedProductsParam]);

    const activePoliciesList = useMemo(() => {
        try {
            const items = policiesRes?.data || [];
            if (!Array.isArray(items)) return [];
            return items.map((p: any) => {
                const currency = p.currency || '';
                return {
                    id: String(p.id),
                    policyNumber: p.policyNumber || '-',
                    customerName: p.customerName || '-',
                    companyName: p.projectName || p.productName || '-',
                    productName: p.productName || '-',
                    projectType: p.productName || 'Construction',
                    // Keep numeric values here; currency formatting is handled at render time via `formatCurrencyLocale`.
                    // If we prefix currency here (e.g. "AED 123"), `formatCurrencyLocale` will treat it as NaN and render "-".
                    sumInsured: p.sumInsured ?? null,
                    premium: p.premium ?? null,
                    currency: currency,
                    startDate: p.startDate ?? null,
                    endDate: p.endDate ?? null,
                    brokerName: p.brokerName || '-',
                    brokerId: String(p.broker_id || p.brokerId || ''),
                    productId: String(p.product_id || p.productId || ''),
                };
            });
        } catch (error) {
            console.error('Error mapping policies data:', error);
            return [];
        }
    }, [policiesRes]);

    const totalPolicyPages = Math.ceil((policiesRes?.meta?.total || activePoliciesList.length) / itemsPerPage) || 1;

    return (
        <Card className="border-border bg-card">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            Issued Policies
                        </CardTitle>
                        <CardDescription>Manage active insurance policies</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <TableSearchFilter
                  searchTerm={policySearchInput}
                  onSearchChange={handlePolicySearchChange}
                  searchPlaceholder="Search policies by customer name, company, or policy number..."
                  filters={policyFilters}
                  activeFilters={policyFiltersState}
                  onFilterChange={handlePolicyFilterChange}
                  onClearFilters={handleClearPolicyFilters}
                  className="mb-4"
                >
                  <ColumnVisibilityDropdown
                    columns={policyColumns}
                    visibleColumns={visiblePolicyColumns}
                    onToggleColumn={(id) => toggleColumnVisibility('insurer-policies', id, policyColumns.map(c => c.id))}
                    onReset={() => setColumnVisibility('insurer-policies', policyColumns.map(c => c.id))}
                  />
                </TableSearchFilter>

                {policiesLoading ? (
                    <TableSkeleton rows={5} cols={visiblePolicyColumns.length} />
                ) : policiesError ? (
                    <div className="rounded-md border border-destructive/20 bg-destructive/10 text-destructive px-3 py-2">
                        {(policiesError as any)?.message || 'Failed to load policies'}
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
                                {visiblePolicyColumns.includes('actions') && <TableHead className="text-center">Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {activePoliciesList.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={visiblePolicyColumns.length} className="text-center text-muted-foreground p-4">
                                        No policies found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                activePoliciesList.map((policy) => (
                                    <TableRow
                                        key={policy.id}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => navigate(`/insurer/policy/${policy.id}`)}
                                    >
                                        {visiblePolicyColumns.includes('policyNumber') && (
                                            <TableCell className="font-medium">
                                                {policy.policyNumber}
                                            </TableCell>
                                        )}
                                        {visiblePolicyColumns.includes('projectName') && (
                                            <TableCell className="truncate" title={policy.companyName}>
                                                {policy.companyName.length > 15
                                                    ? `${policy.companyName.substring(0, 15)}...`
                                                    : policy.companyName}
                                            </TableCell>
                                        )}
                                        {visiblePolicyColumns.includes('sumInsured') && (
                                            <TableCell className="font-medium">
                                                {formatCurrencyLocale(policy.sumInsured, policy.currency)}
                                            </TableCell>
                                        )}
                                        {visiblePolicyColumns.includes('premium') && (
                                            <TableCell className="font-medium text-primary">
                                                {formatCurrencyLocale(policy.premium, policy.currency)}
                                            </TableCell>
                                        )}
                                        {visiblePolicyColumns.includes('startDate') && (
                                            <TableCell className="text-sm text-muted-foreground">
                                                {formatDateShort(policy.startDate)}
                                            </TableCell>
                                        )}
                                        {visiblePolicyColumns.includes('endDate') && (
                                            <TableCell className="text-sm text-muted-foreground">
                                                {formatDateShort(policy.endDate)}
                                            </TableCell>
                                        )}
                                        {visiblePolicyColumns.includes('actions') && (
                                            <TableCell className="text-center">
                                                <div className="flex justify-center">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/insurer/policy/${policy.id}`);
                                                        }}
                                                    >
                                                        View Policy
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

                {/* Pagination for Policies */}
                <div className="px-6 py-4 border-t flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                        {policiesRes?.meta
                            ? `Page ${policiesRes.meta.page ?? currentPolicyPage} of ${totalPolicyPages} · ${policiesRes.meta.total} policies`
                            : `Showing ${activePoliciesList.length} policies`}
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
                                            currentPolicyPage >= totalPolicyPages
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

PoliciesTab.displayName = 'PoliciesTab';

export default PoliciesTab;
