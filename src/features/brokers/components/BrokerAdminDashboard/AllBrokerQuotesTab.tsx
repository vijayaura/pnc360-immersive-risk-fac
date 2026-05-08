import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Eye, FileText } from "lucide-react";
import { QUOTE_STATUSES } from "@/lib/quote-status";
import { QuoteStatusDot } from "@/features/quotes/components/QuotesComparison/QuoteStatusDot";
import { ColumnVisibilityDropdown } from "@/components/shared/ColumnVisibilityDropdown";
import { useColumnVisibilityStore } from "@/shared/stores/useColumnVisibilityStore";
import { useQuery } from "@tanstack/react-query";
import { getAdminDashboardQuotes } from "@/features/market-admin/api/admin";
import TableSkeleton from "@/components/loaders/TableSkeleton";
import { formatCurrencyLocale } from "@/shared/utils/lib-utils";
import { formatDateShort } from "@/shared/utils/date-format";

const allBrokerQuotesColumns = [
    { id: 'broker', label: 'Broker', isMandatory: true },
    { id: 'clientName', label: 'Client Name', isMandatory: true },
    { id: 'projectName', label: 'Product Name', isMandatory: true },
    { id: 'projectType', label: 'Product Type' },
    { id: 'insurer', label: 'Insurer' },
    { id: 'sumInsured', label: 'Sum Insured' },
    { id: 'premium', label: 'Premium' },
    { id: 'status', label: 'Status', isMandatory: true },
    { id: 'created', label: 'Created At' },
    { id: 'validityEnd', label: 'Validity End' },
    { id: 'action', label: 'Actions', isMandatory: true },
];

interface AllBrokerQuotesTabProps {
    itemsPerPage?: number;
}

export const AllBrokerQuotesTab = ({ itemsPerPage = 5 }: AllBrokerQuotesTabProps) => {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);

    const { toggleColumnVisibility, getTableVisibility, setColumnVisibility } = useColumnVisibilityStore();
    const visibleColumns = getTableVisibility('broker-admin-all-quotes', allBrokerQuotesColumns.map(c => c.id));

    const { data: quotesData, isLoading, error } = useQuery({
        queryKey: ['broker-admin-all-quotes', currentPage, itemsPerPage],
        queryFn: () => getAdminDashboardQuotes({ page: currentPage, limit: itemsPerPage }),
    });

    const activeAllQuotes = useMemo(() => quotesData?.recentQuotes || [], [quotesData]);
    const totalAllQuotePages = useMemo(() => quotesData?.totalPages || 0, [quotesData]);

    const handlePreviousPage = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        if (currentPage > 1) setCurrentPage(p => p - 1);
    }, [currentPage]);

    const handleNextPage = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        if (currentPage < totalAllQuotePages) setCurrentPage(p => p + 1);
    }, [currentPage, totalAllQuotePages]);

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            All Broker Quotes
                        </CardTitle>
                        <CardDescription>
                            View and manage quotes from all brokers in the system
                        </CardDescription>
                    </div>
                    <ColumnVisibilityDropdown
                        columns={allBrokerQuotesColumns}
                        visibleColumns={visibleColumns}
                        onToggleColumn={(id) => toggleColumnVisibility('broker-admin-all-quotes', id, allBrokerQuotesColumns.map(c => c.id))}
                        onReset={() => setColumnVisibility('broker-admin-all-quotes', allBrokerQuotesColumns.map(c => c.id))}
                    />
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <TableSkeleton cols={visibleColumns.length} rows={itemsPerPage} />
                ) : error ? (
                    <div className="p-8 text-center text-destructive">
                        Error loading quotes. Please try again later.
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto table-scrollbars">
                        <Table equalColumns columnCount={visibleColumns.length} minColumnWidth={150}>
                            <TableHeader>
                                <TableRow>
                                    {visibleColumns.includes('quoteId') && <TableHead>Quote ID</TableHead>}
                                    {visibleColumns.includes('broker') && <TableHead>Broker</TableHead>}
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
                                {activeAllQuotes.map((quote) => (
                                    <TableRow
                                        key={quote.id}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => navigate(`/broker/quote/${quote.id}`)}
                                    >
                                        {visibleColumns.includes('quoteId') && <TableCell className="font-medium">{quote.quote_number || quote.quote_id}</TableCell>}
                                        {visibleColumns.includes('broker') && <TableCell className="font-medium text-primary">{quote.broker_name}</TableCell>}
                                        {visibleColumns.includes('clientName') && <TableCell>{quote.client_name}</TableCell>}
                                        {visibleColumns.includes('projectName') && <TableCell>{quote.project_name}</TableCell>}
                                        {visibleColumns.includes('projectType') && <TableCell>{quote.project_type}</TableCell>}
                                        {visibleColumns.includes('insurer') && <TableCell className="font-medium text-primary">{quote.inusrer_name}</TableCell>}
                                        {visibleColumns.includes('sumInsured') && (
                                            <TableCell className="font-medium">
                                                {formatCurrencyLocale(quote.sum_insured, quote.currency || 'AED')}
                                            </TableCell>
                                        )}
                                        {visibleColumns.includes('premium') && (
                                            <TableCell className="font-medium text-primary">
                                                {formatCurrencyLocale(quote.total_premium || quote.base_premium, quote.currency || 'AED')}
                                            </TableCell>
                                        )}
                                        {visibleColumns.includes('status') && (
                                            <TableCell>
                                                <QuoteStatusDot status={quote.status} />
                                            </TableCell>
                                        )}
                                        {visibleColumns.includes('created') && (
                                            <TableCell className="text-sm text-muted-foreground">
                                                {formatDateShort(quote.created_at)}
                                            </TableCell>
                                        )}
                                        {visibleColumns.includes('validityEnd') && (
                                            <TableCell className="text-sm text-muted-foreground">
                                                {formatDateShort(quote.validity_date)}
                                            </TableCell>
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
                                    {[...Array(totalAllQuotePages)].map((_, i) => (
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
                                            className={currentPage === totalAllQuotePages ? "pointer-events-none opacity-50" : ""}
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
