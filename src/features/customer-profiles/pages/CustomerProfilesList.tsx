import React, { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import TableSkeleton from '@/components/loaders/TableSkeleton';
import { ArrowLeft, Users } from 'lucide-react';
import { useCustomerProfiles } from '../hooks/useCustomerProfiles';
import { TableSearchFilter, type FilterConfig } from '@/components/shared/TableSearchFilter';
import { formatDateShort } from '@/shared/utils/date-format';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

export default function CustomerProfilesList() {
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.split('/')[1] || 'broker';
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 5;
  const [search, setSearch] = useState('');
  const normalizedSearch = search.trim();
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const apiFilters = useMemo(
    () => ({
      minProposals:
        Number.isFinite(Number(activeFilters.minProposals)) && Number(activeFilters.minProposals) > 0
          ? Number(activeFilters.minProposals)
          : undefined,
      minQuotes:
        Number.isFinite(Number(activeFilters.minQuotes)) && Number(activeFilters.minQuotes) > 0
          ? Number(activeFilters.minQuotes)
          : undefined,
      minPolicies:
        Number.isFinite(Number(activeFilters.minPolicies)) && Number(activeFilters.minPolicies) > 0
          ? Number(activeFilters.minPolicies)
          : undefined,
    }),
    [activeFilters.minPolicies, activeFilters.minProposals, activeFilters.minQuotes],
  );
  const { profiles, meta, profilesQuery } = useCustomerProfiles(
    currentPage,
    limit,
    normalizedSearch || undefined,
    apiFilters,
  );

  const filters = useMemo<FilterConfig[]>(
    () => [
      { key: 'minProposals', label: 'Min Proposals', type: 'number' },
      { key: 'minQuotes', label: 'Min Quotes', type: 'number' },
      { key: 'minPolicies', label: 'Min Policies', type: 'number' },
    ],
    [],
  );

  const handleFilterChange = (key: string, value: any) => {
    setActiveFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setActiveFilters({});
    setCurrentPage(1);
  };

  return (
    <div className="w-full px-6 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Customer Profiles</h1>
          <p className="text-sm text-muted-foreground">
            Search and review customers by proposals, quotes, and policies.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Customers
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <TableSearchFilter
              searchTerm={search}
              onSearchChange={(value) => {
                setSearch(value);
                setCurrentPage(1);
              }}
              searchPlaceholder="Search customers…"
              filters={filters}
              activeFilters={activeFilters}
              onFilterChange={handleFilterChange}
              onClearFilters={clearFilters}
            />
          </div>
          {profilesQuery.isLoading ? (
            <TableSkeleton rows={8} />
          ) : profilesQuery.isError ? (
            <div className="py-10 text-center">
              <p className="text-sm text-destructive">Failed to load customer profiles.</p>
              <div className="mt-3">
                <Button variant="outline" onClick={() => profilesQuery.refetch()}>
                  Retry
                </Button>
              </div>
            </div>
          ) : profiles.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No customers match your search.
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[22%] text-left">Customer</TableHead>
                    <TableHead className="text-center">Products</TableHead>
                    <TableHead className="text-left">Customer Since</TableHead>
                    <TableHead className="text-left">Last Transaction</TableHead>
                    <TableHead className="text-center">Total Proposals</TableHead>
                    <TableHead className="text-center">Total Quotes</TableHead>
                    <TableHead className="text-center">Total Policies</TableHead>
                    <TableHead className="text-center">Total Referrals</TableHead>
                    <TableHead className="text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map((p) => (
                    <TableRow
                      key={p.key}
                      className="hover:bg-accent/30"
                    >
                      <TableCell>
                        <div className="font-medium text-foreground">{p.displayName}</div>
                      </TableCell>
                      <TableCell className="text-center tabular-nums">{p.products.length}</TableCell>
                      <TableCell className="whitespace-nowrap text-left">
                        {formatDateShort(p.customerSince)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-left">
                        {formatDateShort(p.lastTransactionAt)}
                      </TableCell>
                      <TableCell className="text-center tabular-nums">{p.totals.proposals}</TableCell>
                      <TableCell className="text-center tabular-nums">{p.totals.quotes}</TableCell>
                      <TableCell className="text-center tabular-nums">{p.totals.policies}</TableCell>
                      <TableCell className="text-center tabular-nums">{p.totals.referrals}</TableCell>
                      <TableCell className="text-center align-middle">
                        <div className="flex justify-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/${basePath}/customer-profiles/${encodeURIComponent(p.customerId)}`);
                            }}
                          >
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {meta.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs text-muted-foreground">
                Showing page {meta.page} of {meta.totalPages} ({meta.total} customers)
              </p>
              <Pagination className="mx-0 w-auto justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) setCurrentPage((p) => p - 1);
                      }}
                      className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                  {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === meta.totalPages || Math.abs(p - currentPage) <= 1)
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
                            isActive={page === currentPage}
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(page);
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
                        if (currentPage < meta.totalPages) setCurrentPage((p) => p + 1);
                      }}
                      className={currentPage >= meta.totalPages ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

