import React, { useMemo, useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Shield, Download, Upload } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { listPolicies, exportBrokerPolicies, type PoliciesListResponse } from '@/features/quotes/api/policies';
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
import { format } from 'date-fns';
import { toast } from 'sonner';
import { listInsurers } from '@/features/insurers/api/insurer-core';
import { formatCurrencyLocale } from '@/shared/utils/lib-utils';

const policyColumns = [
    { id: 'policyNumber', label: 'Policy Number', isMandatory: true },
    { id: 'projectName', label: 'Product Name', isMandatory: true },
    { id: 'sumInsured', label: 'Sum Insured' },
    { id: 'premium', label: 'Premium' },
    { id: 'startDate', label: 'Start Date' },
    { id: 'endDate', label: 'End Date' },
    { id: 'action', label: 'Action', isMandatory: true },
];

interface PoliciesTabProps {
    itemsPerPage: number;
    isActive: boolean;
    selectedProductIds?: string[];
}

const PoliciesTab = React.memo(({ itemsPerPage, isActive, selectedProductIds }: PoliciesTabProps) => {
    const navigate = useNavigate();
    const [currentPolicyPage, setCurrentPolicyPage] = useState(1);
    const [policySearchInput, setPolicySearchInput] = useState('');
    const [policySearchDebounced, setPolicySearchDebounced] = useState('');
    const [policyStatusFilter, setPolicyStatusFilter] = useState<string | undefined>(undefined);
    const [policyInsurerFilter, setPolicyInsurerFilter] = useState<string | undefined>(undefined);
    const [policyStartFilter, setPolicyStartFilter] = useState<string | undefined>(undefined);
    
    // Column Visibility Store Integration
    const { toggleColumnVisibility, getTableVisibility, setColumnVisibility } = useColumnVisibilityStore();
    const visiblePolicyColumns = getTableVisibility('broker-policies', policyColumns.map(c => c.id));
    const policyDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const selectedProductsParam = useMemo(
        () => (selectedProductIds && selectedProductIds.length > 0 ? selectedProductIds.join(',') : undefined),
        [selectedProductIds],
    );

    const { data: insurersRes } = useQuery({
        queryKey: ['broker-dashboard-insurers-list'],
        queryFn: () => listInsurers({ limit: 100 }),
        staleTime: 1000 * 60 * 10,
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
            const s = typeof statusVal === 'string' ? statusVal.trim().toLowerCase() : '';
            setPolicyStatusFilter(s || undefined);
            setCurrentPolicyPage(1);
        } else if (key === 'insurer') {
            const v = typeof value === 'string' ? value.trim() : '';
            setPolicyInsurerFilter(v || undefined);
            setCurrentPolicyPage(1);
        } else if (key === 'startDate') {
            setPolicyStartFilter(value || undefined);
            setCurrentPolicyPage(1);
        }
    }, []);

    const handleClearPolicyFilters = useCallback(() => {
        setPolicySearchInput('');
        setPolicySearchDebounced('');
        setPolicyStatusFilter(undefined);
        setPolicyInsurerFilter(undefined);
        setPolicyStartFilter(undefined);
        setCurrentPolicyPage(1);
    }, []);

    const policyFiltersState = useMemo<Record<string, any>>(() => {
        const f: Record<string, any> = {};
        if (policyStatusFilter) f['status'] = policyStatusFilter;
        if (policyInsurerFilter) f['insurer'] = policyInsurerFilter;
        if (policyStartFilter) f['startDate'] = policyStartFilter;
        return f;
    }, [policyStatusFilter, policyInsurerFilter, policyStartFilter]);

    const policyFilters = useMemo<FilterConfig[]>(() => {
        const seen = new Set<string>();
        const insurerOptions: { value: string; label: string }[] = [];
        
        const insurersList = Array.isArray(insurersRes?.data) 
            ? insurersRes.data 
            : [];

        for (const i of insurersList) {
            if (!i?.name || !i?.id) continue;
            const name = String(i.name).trim();
            if (seen.has(i.id)) continue;
            seen.add(i.id);
            insurerOptions.push({ value: i.id, label: name });
        }

        return [
            {
                key: 'insurer',
                label: 'Insurer',
                type: 'select',
                options: insurerOptions,
            },
            {
                key: 'status',
                label: 'Status',
                type: 'select',
                options: [
                    { value: 'draft', label: 'Draft' },
                    { value: 'active', label: 'Active' },
                    { value: 'expired', label: 'Expired' },
                    { value: 'cancelled', label: 'Cancelled' },
                ],
            },
            {
                key: 'startDate',
                label: 'Start Date',
                type: 'date',
            },
        ];
    }, [insurersRes]);

    const {
        data: policiesRes,
        isLoading: policiesLoading,
        error: policiesError,
    } = useQuery<PoliciesListResponse, Error>({
        queryKey: [
            'broker-policies',
            currentPolicyPage,
            itemsPerPage,
            policySearchDebounced,
            policyStatusFilter,
            policyInsurerFilter,
            selectedProductsParam,
            policyStartFilter,
        ],
        queryFn: () => {
            const searchMerged = [policySearchDebounced]
                .filter((x) => typeof x === 'string' && x.trim().length > 0)
                .join(' ')
                .trim();
            return listPolicies({
                page: currentPolicyPage,
                limit: itemsPerPage,
                search: searchMerged || undefined,
                insurerId: policyInsurerFilter || undefined,
                productId: selectedProductsParam || undefined,
                status: policyStatusFilter || undefined,
                startDate: policyStartFilter || undefined,
            });
        },
        enabled: isActive,
        staleTime: 1000 * 60 * 2,
    });

    React.useEffect(() => {
        setCurrentPolicyPage(1);
    }, [selectedProductsParam]);

    const currentPolicies = useMemo(() => {
        try {
            const items = policiesRes?.data || [];
            if (!Array.isArray(items)) return [];
            return items.map((p: any) => {
                const currency = typeof p.currency === 'string' ? p.currency : '';
                const sumInsuredNumber =
                    p.sumInsured !== undefined && p.sumInsured !== null && !Number.isNaN(Number(p.sumInsured))
                        ? Number(p.sumInsured)
                        : null;
                const premiumNumber =
                    p.premium !== undefined && p.premium !== null && !Number.isNaN(Number(p.premium))
                        ? Number(p.premium)
                        : null;
                return {
                    id: String(p.id),
                    policyNumber: p.policyNumber || '-',
                    projectName: p.projectName || p.productName || '-',
                    productName: p.productName || '-',
                    projectType: p.productName || 'Construction',
                    insurer: p.insurerName || '-',
                    sumInsured: sumInsuredNumber,
                    premium: premiumNumber,
                    startDate: p.startDate,
                    endDate: p.endDate,
                    clientName: p.clientName || '-',
                    currency: currency,
                };
            });
        } catch (error) {
            console.error('Error mapping policies data:', error);
            return [];
        }
    }, [policiesRes]);

    const totalPolicyPages = policiesRes?.meta?.totalPages ?? 1;

    const handleExportExcelPolicies = useCallback(async () => {
        try {
            const params: any = {};
            const searchMerged = [policySearchDebounced]
                .filter((x) => typeof x === 'string' && x.trim().length > 0)
                .join(' ')
                .trim();
            if (searchMerged) params.search = searchMerged;
            if (policyInsurerFilter) params.insurerId = policyInsurerFilter;
            if (selectedProductsParam) params.productId = selectedProductsParam;
            if (policyStatusFilter) params.status = policyStatusFilter;
            if (policyStartFilter) params.startDate = policyStartFilter;

            // Add selected columns as comma-separated string in original order (exclude action columns)
            if (visiblePolicyColumns && visiblePolicyColumns.length > 0) {
                // Sort columns according to their original order in policyColumns definition
                const orderedColumns = policyColumns
                    .map(col => col.id)
                    .filter(colId => visiblePolicyColumns.includes(colId) && colId !== 'action');
                params.columns = orderedColumns.join(',');
            }

            toast.loading('Exporting policies...', { id: 'export-policies' });
            const blob = await exportBrokerPolicies(params);

            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `broker_policies_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`);
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
    }, [policySearchDebounced, policyStatusFilter, policyInsurerFilter, selectedProductsParam, policyStartFilter, visiblePolicyColumns]);

    return (
        <Card className="border-border bg-card">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Active Policies
                </CardTitle>
                <CardDescription>Manage your issued insurance policies</CardDescription>
            </CardHeader>
            <CardContent>
                <TableSearchFilter
                  searchTerm={policySearchInput}
                  onSearchChange={handlePolicySearchChange}
                  searchPlaceholder="Search policies by client name, project, or policy number..."
                  filters={policyFilters}
                  activeFilters={policyFiltersState}
                  onFilterChange={handlePolicyFilterChange}
                  onClearFilters={handleClearPolicyFilters}
                  className="mb-4"
                >
                  <ColumnVisibilityDropdown
                    columns={policyColumns}
                    visibleColumns={visiblePolicyColumns}
                    onToggleColumn={(id) => toggleColumnVisibility('broker-policies', id, policyColumns.map(c => c.id))}
                    onReset={() => setColumnVisibility('broker-policies', policyColumns.map(c => c.id))}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportExcelPolicies}
                    className="h-10 shrink-0 gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Export Excel
                  </Button>
                </TableSearchFilter>
                {policiesLoading ? (
                    <Table>
                        <TableBody key={currentPolicyPage}>
                            <TableSkeleton rows={5} cols={visiblePolicyColumns.length} />
                        </TableBody>
                    </Table>
                ) : policiesError ? (
                    <div className="rounded-md border border-destructive/20 bg-destructive/10 text-destructive px-3 py-2">
                        {policiesError.message}
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
                        <TableBody key={currentPolicyPage}>
                            {currentPolicies.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={visiblePolicyColumns.length} className="text-center text-muted-foreground p-4">
                                        No active policies found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                currentPolicies.map((policy) => (
                                    <TableRow
                                        key={`${currentPolicyPage}-${policy.id}`}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => navigate(`/broker/policy/${policy.id}`)}
                                    >
                                        {visiblePolicyColumns.includes('policyNumber') && (
                                            <TableCell className="font-medium">
                                                {policy.policyNumber}
                                            </TableCell>
                                        )}
                                        {visiblePolicyColumns.includes('projectName') && (
                                            <TableCell className="truncate" title={policy.projectName}>
                                                {policy.projectName.length > 15
                                                    ? `${policy.projectName.substring(0, 15)}...`
                                                    : policy.projectName}
                                            </TableCell>
                                        )}
                                        {visiblePolicyColumns.includes('sumInsured') && (
                                            <TableCell className="font-medium break-all min-w-[120px]">
                                                {formatCurrencyLocale(policy.sumInsured, policy.currency)}
                                            </TableCell>
                                        )}
                                        {visiblePolicyColumns.includes('premium') && (
                                            <TableCell className="font-medium text-primary break-all min-w-[120px]">
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
                                        {visiblePolicyColumns.includes('action') && (
                                            <TableCell className="text-center">
                                                <div className="flex justify-center">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/broker/policy/${policy.id}`);
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

                <div className="px-6 py-4 border-t flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                        {policiesRes?.meta
                            ? `Page ${policiesRes.meta.page} of ${policiesRes.meta.totalPages} · ${policiesRes.meta.total} policies`
                            : `Showing ${currentPolicies.length} policies`}
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
                                    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map((pageNum) => (
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
