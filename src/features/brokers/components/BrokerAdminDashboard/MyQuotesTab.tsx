import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Eye, Shield } from "lucide-react";
import { QUOTE_STATUSES } from "@/lib/quote-status";
import { QuoteStatusDot } from "@/features/quotes/components/QuotesComparison/QuoteStatusDot";
import { useQuery } from "@tanstack/react-query";
import { getQuotesDashboard } from "@/features/quotes/api/quotes";
import TableSkeleton from "@/components/loaders/TableSkeleton";
import { formatCurrencyLocale } from "@/shared/utils/lib-utils";
import { formatDateShort } from "@/shared/utils/date-format";
import { ColumnVisibilityDropdown } from "@/components/shared/ColumnVisibilityDropdown";
import { useColumnVisibilityStore } from "@/shared/stores/useColumnVisibilityStore";

const myQuotesColumns = [
    { id: 'quoteId', label: 'Quote ID', isMandatory: true },
    { id: 'clientName', label: 'Client Name', isMandatory: true },
    { id: 'projectName', label: 'Product Name', isMandatory: true },
    { id: 'projectType', label: 'Product Type' },
    { id: 'insurer', label: 'Insurer', isMandatory: true },
    { id: 'sumInsured', label: 'Sum Insured' },
    { id: 'premium', label: 'Premium' },
    { id: 'status', label: 'Status', isMandatory: true },
    { id: 'created', label: 'Created At' },
    { id: 'validityEnd', label: 'Validity End' },
    { id: 'action', label: 'Actions', isMandatory: true },
];

interface MyQuotesTabProps {
    itemsPerPage?: number;
}

export const MyQuotesTab = ({ itemsPerPage = 5 }: MyQuotesTabProps) => {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);

    const { toggleColumnVisibility, getTableVisibility, setColumnVisibility } = useColumnVisibilityStore();
    const visibleColumns = getTableVisibility('broker-admin-my-quotes', myQuotesColumns.map(c => c.id));

    const { data: quotesData, isLoading, error } = useQuery({
        queryKey: ['broker-admin-my-quotes', currentPage, itemsPerPage],
        queryFn: () => getQuotesDashboard({ page: currentPage, limit: itemsPerPage, type: 'broker' }),
    });

    const activeMyQuotes = useMemo(() => quotesData?.data || [], [quotesData]);
    const totalMyQuotePages = useMemo(() => quotesData?.meta.totalPages || 0, [quotesData]);

    const handlePreviousPage = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        if (currentPage > 1) setCurrentPage(p => p - 1);
    }, [currentPage]);

    const handleNextPage = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        if (currentPage < totalMyQuotePages) setCurrentPage(p => p + 1);
    }, [currentPage, totalMyQuotePages]);

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            My Quotes
                        </CardTitle>
                        <CardDescription>
                            View and manage your personal quotes
                        </CardDescription>
                    </div>
                    <ColumnVisibilityDropdown
                        columns={myQuotesColumns}
                        visibleColumns={visibleColumns}
                        onToggleColumn={(id) => toggleColumnVisibility('broker-admin-my-quotes', id, myQuotesColumns.map(c => c.id))}
                        onReset={() => setColumnVisibility('broker-admin-my-quotes', myQuotesColumns.map(c => c.id))}
                    />
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <TableSkeleton cols={visibleColumns.length} rows={itemsPerPage} />
                ) : error ? (
                    <div className="p-8 text-center text-destructive">
                        Error loading your quotes. Please try again later.
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto table-scrollbars">
                        <Table equalColumns columnCount={visibleColumns.length} minColumnWidth={150}>
                            <TableHeader>
                                <TableRow>
                                    {visibleColumns.includes('quoteId') && <TableHead>Quote ID</TableHead>}
                                    {visibleColumns.includes('clientName') && <TableHead>Client Name</TableHead>}
                                    {visibleColumns.includes('projectName') && <TableHead>Product Name</TableHead>}
                                    {visibleColumns.includes('projectType') && <TableHead>Product Type</TableHead>}
                                    {visibleColumns.includes('insurer') && <TableHead>Insurer</TableHead>}
                                    {visibleColumns.includes('sumInsured') && <TableHead>Sum Insured</TableHead>}
                                    {visibleColumns.includes('premium') && <TableHead>Premium</TableHead>}
                                    {visibleColumns.includes('status') && <TableHead>Status</TableHead>}
                                    {visibleColumns.includes('created') && <TableHead>Created At</TableHead>}
                                    {visibleColumns.includes('validityEnd') && <TableHead>Validity End</TableHead>}
                                    {visibleColumns.includes('action') && <TableHead className="text-center">Actions</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {activeMyQuotes.map((quote) => (
                                    <TableRow
                                        key={quote.id}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => navigate(`/broker/quote/${quote.id}`)}
                                    >
                                        {visibleColumns.includes('quoteId') && <TableCell className="font-medium">{quote.quoteNumber || quote.requestId || quote.id}</TableCell>}
                                        {visibleColumns.includes('clientName') && <TableCell>{quote.customer || '-'}</TableCell>}
                                        {visibleColumns.includes('projectName') && <TableCell>{quote.project || '-'}</TableCell>}
                                        {visibleColumns.includes('projectType') && <TableCell>{quote.productName || '-'}</TableCell>}
                                        {visibleColumns.includes('insurer') && <TableCell className="font-medium text-primary">{quote.broker || '-'}</TableCell>}
                                        {visibleColumns.includes('sumInsured') && (
                                            <TableCell className="font-medium">
                                                {formatCurrencyLocale(quote.value, quote.currency || 'AED')}
                                            </TableCell>
                                        )}
                                        {visibleColumns.includes('premium') && (
                                            <TableCell className="font-medium text-primary">
                                                {formatCurrencyLocale(quote.totalPremium || quote.premium, quote.currency || 'AED')}
                                            </TableCell>
                                        )}
                                        {visibleColumns.includes('status') && (
                                            <TableCell>
                                                <QuoteStatusDot status={quote.status || ''} />
                                            </TableCell>
                                        )}
                                        {visibleColumns.includes('created') && (
                                            <TableCell className="text-sm text-muted-foreground">{formatDateShort(quote.createdAt)}</TableCell>
                                        )}
                                        {visibleColumns.includes('validityEnd') && (
                                            <TableCell className="text-sm text-muted-foreground">{formatDateShort((quote as any).validityEnd) || '-'}</TableCell>
                                        )}
                                        {visibleColumns.includes('action') && (
                                            <TableCell className="text-center">
                                                <div className="flex gap-2 justify-center">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/broker/quote/${quote.id}`);
                                                        }}
                                                    >
                                                        <Eye className="w-4 h-4 mr-1" />
                                                        View Details
                                                    </Button>
                                                    {(quote.status === QUOTE_STATUSES.POLICY_GENERATED || quote.status === QUOTE_STATUSES.PAYMENT_PENDING) && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(`/broker/policy/${quote.id}`);
                                                            }}
                                                        >
                                                            View Policy
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                        <div className="px-6 py-4 border-t">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            href="#"
                                            onClick={handlePreviousPage}
                                            className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                                        />
                                    </PaginationItem>
                                    {[...Array(totalMyQuotePages)].map((_, i) => (
                                        <PaginationItem key={i + 1}>
                                            <PaginationLink
                                                href="#"
                                                isActive={currentPage === i + 1}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setCurrentPage(i + 1);
                                                }}
                                            >
                                                {i + 1}
                                            </PaginationLink>
                                        </PaginationItem>
                                    ))}
                                    <PaginationItem>
                                        <PaginationNext
                                            href="#"
                                            onClick={handleNextPage}
                                            className={currentPage === totalMyQuotePages ? "pointer-events-none opacity-50" : ""}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
};
