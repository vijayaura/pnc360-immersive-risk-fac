import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Network, Shield, ShieldAlert, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/sonner';
import { TableSearchFilter, type FilterConfig } from '@/components/shared/TableSearchFilter';
import { listReinsurancePolicies, fetchReinsuranceSummary, listReinsuranceProductNames } from '../api/reinsurerManagement';
import type { ReinsurerPolicyRecord, ReinsuranceSummary } from '../types';
import { ReinsurerTable } from '../components/ReinsurerTable';
import { formatCurrencyCompact } from '@/shared/utils/lib-utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const PAGE_SIZE = 5;

type ReinsuranceManagementTab = 'fac-out' | 'treaty';

export default function ReinsurerManagementPage() {
  const navigate = useNavigate();
  const [managementTab, setManagementTab] = useState<ReinsuranceManagementTab>('fac-out');
  const [policies, setPolicies] = useState<ReinsurerPolicyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [productFilter, setProductFilter] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [summary, setSummary] = useState<ReinsuranceSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [productNames, setProductNames] = useState<string[]>([]);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const result = await listReinsurancePolicies({
          page,
          limit: PAGE_SIZE,
          search: searchDebounced || undefined,
          productId: productFilter || undefined,
        });
        if (isMounted) {
          setPolicies(result.data);
          setTotalPages(result.meta.totalPages || 1);
          setTotalRecords(result.meta.total || 0);
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('[ReinsurerManagementPage] Failed to fetch policies:', error);
        toast.error('Failed to load policies', {
          description: 'Please try again later.',
        });
        setPolicies([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const timeoutId = setTimeout(load, 300);
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [page, searchDebounced, productFilter]);

  useEffect(() => {
    setSummaryLoading(true);
    fetchReinsuranceSummary()
      .then(setSummary)
      .catch(() => setSummary(null))
      .finally(() => setSummaryLoading(false));

    listReinsuranceProductNames()
      .then(setProductNames)
      .catch(() => setProductNames([]));
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setSearchDebounced(value);
      setPage(1);
    }, 400);
  }, []);

  const handleFilterChange = useCallback((key: string, value: unknown) => {
    if (key === 'productName') {
      const v = typeof value === 'string' ? value.trim() : '';
      setProductFilter(v || undefined);
    }
    setPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchInput('');
    setSearchDebounced('');
    setProductFilter(undefined);
    setPage(1);
  }, []);

  const activeFilters = productFilter ? { productName: productFilter } : {};

  const productFilterOptions = useMemo(
    () => productNames.map((name) => ({ value: name, label: name })),
    [productNames],
  );

  const filters = useMemo<FilterConfig[]>(
    () => [
      {
        key: 'productName',
        label: 'Product',
        type: 'select',
        options: productFilterOptions,
      },
    ],
    [productFilterOptions],
  );

  const handleViewDetails = (policyId: string) => {
    navigate(`/insurer/reinsurer-management/${policyId}`);
  };

  return (
    <div className="min-h-full overflow-auto bg-background p-6">
      <div className="w-full space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reinsurance Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage facultative outwards and treaty reinsurance.{' '}
            <span className="font-medium text-foreground">Facultative In</span> cases live on the main{' '}
            <span className="font-medium text-foreground">Dashboard</span> (Facultative In tab).
          </p>
        </div>

        <Tabs
          value={managementTab}
          onValueChange={(v) => setManagementTab(v as ReinsuranceManagementTab)}
          className="w-full space-y-6"
        >
          <TabsList className="grid h-10 w-full max-w-2xl grid-cols-2 bg-muted/60 p-1">
            <TabsTrigger value="fac-out" className="text-sm">
              Facultative Out
            </TabsTrigger>
            <TabsTrigger value="treaty" className="text-sm">
              Treaty
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {managementTab === 'fac-out' ? (
          <div className="mt-0 space-y-4" role="tabpanel" aria-label="Facultative out">
            <InsurerFacOutboundRequestsDashboard returnTo="/insurer/reinsurer-management" />
          </div>
        ) : null}

        {managementTab === 'treaty' ? (
          <div className="mt-0 space-y-6" role="tabpanel" aria-label="Treaty">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {[
            { label: 'Total Policies', icon: Shield, value: summary?.totalPolicies, isCurrency: false, iconBg: 'bg-primary/10', iconColor: 'text-primary' },
            { label: 'Sum Insured', icon: ShieldAlert, value: summary?.totalSumInsured, isCurrency: true, iconBg: 'bg-primary/10', iconColor: 'text-primary' },
            { label: 'Total Retention', icon: ArrowDownLeft, value: summary?.totalRetention, isCurrency: true, iconBg: 'bg-accent/10', iconColor: 'text-accent' },
            { label: 'Total Cession', icon: ArrowUpRight, value: summary?.totalCession, isCurrency: true, iconBg: 'bg-accent/10', iconColor: 'text-accent' },
          ].map(({ label, icon: Icon, value, isCurrency, iconBg, iconColor }) => (
            <Card key={label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{label}</p>
                    {summaryLoading ? (
                      <Skeleton className="h-7 w-24 mt-1" />
                    ) : (
                      <p className="text-2xl font-bold text-foreground">
                        {isCurrency ? formatCurrencyCompact(value ?? 0) : (value ?? 0)}
                      </p>
                    )}
                  </div>
                  <div className={`rounded-lg ${iconBg} p-3`}>
                    <Icon className={`h-6 w-6 ${iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
            </div>

        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Network className="w-5 h-5" />
                  Policies
                </CardTitle>
                <CardDescription>
                  Search, filter, and open a policy to view referral information and product breakdown.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <TableSearchFilter
              searchTerm={searchInput}
              onSearchChange={handleSearchChange}
              searchPlaceholder="Search policies..."
              filters={filters}
              activeFilters={activeFilters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              className="mb-4"
            />

            <div className="relative">
              {loading && policies.length === 0 && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/60">
                  <p className="text-sm text-muted-foreground">Loading…</p>
                </div>
              )}
              <div className={`overflow-x-auto w-full ${loading && policies.length > 0 ? 'opacity-60 transition-opacity duration-200' : ''} ${loading && policies.length === 0 ? 'min-h-[200px]' : ''}`}>
                <ReinsurerTable rows={policies} onViewDetails={handleViewDetails} />
              </div>

              <div className="px-6 py-4 border-t flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mt-0">
                <div className="text-sm text-muted-foreground">
                  Showing {policies.length} of {totalRecords} records (page {page} of{' '}
                  {totalPages})
                </div>
                <div className="ml-auto">
                  <Pagination className="w-auto justify-end mx-0">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (page > 1) setPage(page - 1);
                          }}
                          className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            href="#"
                            isActive={page === pageNum}
                            onClick={(e) => {
                              e.preventDefault();
                              setPage(pageNum);
                            }}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (page < totalPages) setPage(page + 1);
                          }}
                          className={
                            page === totalPages ? 'pointer-events-none opacity-50' : ''
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
          </div>
        ) : null}
      </div>
    </div>
  );
}
