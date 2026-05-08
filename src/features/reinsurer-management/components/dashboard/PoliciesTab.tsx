import { useEffect, useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, ChevronRight, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  fetchAllReinsurancePoliciesPages,
  batchEnrichPolicyRecordsForFilters,
  getReinsurancePolicyDetail,
} from '../../api/reinsurerManagement';
import type { ReinsurerPolicyRecord, DashboardFilters } from '../../types';
import { formatCurrencyCompact } from '@/shared/utils/lib-utils';
import {
  applyDashboardFilters,
  paginateRecords,
  POLICY_STATUSES,
  normalizeStatus,
  dashboardFiltersNeedDetailEnrichment,
} from '../../utils/filterReinsuranceRecords';

const PAGE_SIZE = 5;
const COLUMN_COUNT = 10;

function getStatusBadge(status: string) {
  const s = status?.toLowerCase() ?? '';
  if (s === 'bound')
    return <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">Bound</Badge>;
  if (s === 'active')
    return <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">Active</Badge>;
  if (s === 'quoted' || s === 'quote_generated')
    return <Badge variant="outline" className="text-yellow-700 border-yellow-300 bg-yellow-50">Quoted</Badge>;
  return <Badge variant="outline">{status ?? '-'}</Badge>;
}

interface PoliciesTabProps {
  filters: DashboardFilters;
  reinsurerOptions: { id: string; name: string; gradeId?: string }[];
  brokerOptions: { id: string; name: string }[];
  gradeOptions?: { id: string; valueLabel: string }[];
}

export function PoliciesTab({ filters, reinsurerOptions, brokerOptions, gradeOptions }: PoliciesTabProps) {
  const [allListRows, setAllListRows] = useState<ReinsurerPolicyRecord[]>([]);
  const [enrichedRows, setEnrichedRows] = useState<ReinsurerPolicyRecord[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);
  const [page, setPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = useCallback((id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Build lookup maps: reinsurerId → gradeId, gradeId → label
  const gradeIdByReinsurer = useMemo(() => {
    const map = new Map<string, string | undefined>();
    for (const r of reinsurerOptions) {
      map.set(r.id, r.gradeId);
    }
    return map;
  }, [reinsurerOptions]);

  const gradeLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const g of (gradeOptions ?? [])) {
      map.set(g.id, g.valueLabel);
    }
    return map;
  }, [gradeOptions]);

  const brokerNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of (brokerOptions ?? [])) {
      map.set(b.id, b.name);
    }
    return map;
  }, [brokerOptions]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    const timeout = setTimeout(() => {
      fetchAllReinsurancePoliciesPages({
        search: filters.search || undefined,
        reinsurerId: filters.reinsurerId,
        brokerId: filters.brokerId,
      })
        .then((rows) => {
          if (isMounted) {
            setEnrichedRows(null);
            setAllListRows(rows);
          }
        })
        .catch((err) => {
          console.error('[PoliciesTab] Failed to fetch policies:', err);
          if (isMounted) setAllListRows([]);
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [filters.search, filters.reinsurerId, filters.brokerId]);

  const phaseFiltered = useMemo(() => {
    const policyStatusSet = new Set<string>(POLICY_STATUSES.map((s) => normalizeStatus(s)));
    return allListRows.filter((r) => policyStatusSet.has(normalizeStatus(r.status || '')));
  }, [allListRows]);

  useEffect(() => {
    let isMounted = true;

    if (!dashboardFiltersNeedDetailEnrichment(filters)) {
      setEnrichedRows(null);
      setEnriching(false);
      return;
    }

    if (phaseFiltered.length === 0) {
      setEnrichedRows([]);
      setEnriching(false);
      return;
    }

    setEnrichedRows(null);
    setEnriching(true);
    batchEnrichPolicyRecordsForFilters(phaseFiltered, filters)
      .then((rows) => {
        if (isMounted) setEnrichedRows(rows);
      })
      .catch((err) => {
        console.error('[PoliciesTab] Enrichment failed:', err);
        if (isMounted) setEnrichedRows(phaseFiltered);
      })
      .finally(() => {
        if (isMounted) setEnriching(false);
      });

    return () => {
      isMounted = false;
    };
  }, [
    phaseFiltered,
    filters.location,
    filters.coverType,
    filters.brokerId,
    filters.creditRating,
  ]);

  useEffect(() => {
    setPage(1);
  }, [
    filters.search,
    filters.reinsurerId,
    filters.brokerId,
    filters.coverType,
    filters.location,
    filters.dateFrom,
    filters.dateTo,
    filters.creditRating,
    filters.sumInsuredBand,
  ]);

  const baseForFilters = enrichedRows ?? phaseFiltered;

  const { data: pageRecords, totalPages, total: totalRecords } = useMemo(() => {
    const filtered = applyDashboardFilters(baseForFilters, filters, gradeIdByReinsurer);
    return paginateRecords(filtered, page, PAGE_SIZE);
  }, [baseForFilters, filters, page, gradeIdByReinsurer]);

  // Always enrich the visible page rows so covers/totals/retention/cession show
  const [detailCache, setDetailCache] = useState<Record<string, ReinsurerPolicyRecord>>({});
  const pageIds = useMemo(() => pageRecords.map((r) => r.id).join(','), [pageRecords]);

  useEffect(() => {
    let isMounted = true;
    const idsToFetch = pageRecords
      .filter((r) => !detailCache[r.id] && r.productBreakdown.length === 0)
      .map((r) => r.id);

    if (idsToFetch.length === 0) return;

    Promise.allSettled(idsToFetch.map((id) => getReinsurancePolicyDetail(id))).then(
      (results) => {
        if (!isMounted) return;
        setDetailCache((prev) => {
          const next = { ...prev };
          results.forEach((res, idx) => {
            if (res.status === 'fulfilled') next[idsToFetch[idx]] = res.value;
          });
          return next;
        });
      },
    );

    return () => { isMounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIds]);

  // Merge detail-enriched data into page rows
  const displayRecords = useMemo(
    () => pageRecords.map((r) => detailCache[r.id] ?? r),
    [pageRecords, detailCache],
  );

  const paginationRange = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

    const pages: (number | 'ellipsis')[] = [1];
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);

    if (start > 2) pages.push('ellipsis');
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push('ellipsis');
    pages.push(totalPages);

    return pages;
  }, [page, totalPages]);

  const showTableSkeleton = loading || (dashboardFiltersNeedDetailEnrichment(filters) && enriching);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-foreground">Policies</h2>
          <p className="text-sm text-muted-foreground">
            Issued policy cases with reinsurance. Filters apply across the full list.
          </p>
          {enriching && (
            <p className="text-xs text-muted-foreground mt-1">Applying cover / reinsurer filters…</p>
          )}
        </div>

        <div className="min-h-[320px] overflow-x-auto">
        <Table className="min-w-[1000px]">
          <TableHeader>
            <TableRow>
              <TableHead />
              <TableHead>Case</TableHead>
              <TableHead>Insured</TableHead>
              <TableHead>Broker / Intermediary</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Credit Rating</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Sum Insured</TableHead>
              <TableHead className="text-right">Cession</TableHead>
              <TableHead className="text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {showTableSkeleton ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: COLUMN_COUNT }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-16" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : displayRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COLUMN_COUNT}>
                  <div className="py-8 text-center text-muted-foreground">
                    No policies found.
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              displayRecords.flatMap((r) => {
                const sumInsured = r.totals?.sumInsured ?? 0;
                const cession = r.totals?.cededToTreaty ?? 0;
                const cessionPct = sumInsured > 0 ? Math.round((cession / sumInsured) * 100) : 0;

                const isExpanded = expandedRows.has(r.id);
                const entries = r.reinsurerBreakdownEntries ?? [];

                const rows = [
                  <TableRow key={r.id} className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => toggleRow(r.id)}>
                    <TableCell className="w-8 px-2">
                      {entries.length > 0 ? (
                        isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      ) : null}
                    </TableCell>
                    <TableCell className="font-medium whitespace-nowrap">
                      {(() => {
                        const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-/.test(s);
                        const caseId = r.policyOrQuoteId && !isUuid(r.policyOrQuoteId) ? r.policyOrQuoteId : null;
                        return caseId ?? <Skeleton className="h-4 w-24" />;
                      })()}
                    </TableCell>
                    <TableCell>{r.customerName}</TableCell>
                    <TableCell>
                      {(() => {
                        if (r.brokerNames && r.brokerNames.length > 0) return r.brokerNames.join(', ');
                        const fromEntries = [...new Set(
                          (r.reinsurerBreakdownEntries ?? [])
                            .map(e => e.brokerName || (e.brokerId ? brokerNameById.get(e.brokerId) : undefined))
                            .filter(Boolean)
                        )];
                        if (fromEntries.length > 0) return fromEntries.join(', ');
                        if (r.brokerIds && r.brokerIds.length > 0) {
                          const resolved = [...new Set(r.brokerIds.map(id => brokerNameById.get(id)).filter(Boolean))];
                          if (resolved.length > 0) return resolved.join(', ');
                        }
                        return '-';
                      })()}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {r.createdDateIso ? new Date(r.createdDateIso).toLocaleDateString() : r.referralInfo.createdDate !== '-' ? r.referralInfo.createdDate : '-'}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const ids = r.reinsurerIds ?? [];
                        const grades = [...new Set(ids.map((id) => {
                          const gid = gradeIdByReinsurer.get(id);
                          return gid ? gradeLabelById.get(gid) : undefined;
                        }).filter(Boolean))];
                        return grades.length > 0 ? grades.join(', ') : '-';
                      })()}
                    </TableCell>
                    <TableCell>{getStatusBadge(r.status)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {sumInsured > 0 ? formatCurrencyCompact(sumInsured) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {cession > 0 ? (
                        <div>
                          <div className="font-medium">{formatCurrencyCompact(cession)}</div>
                          <div className="text-xs text-muted-foreground">{cessionPct}% ceded</div>
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <Link
                        to={`/market-admin/reinsurer-management/${r.id}`}
                        className={buttonVariants({ variant: 'outline', size: 'sm' }) + ' gap-1.5'}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Link>
                    </TableCell>
                  </TableRow>,
                ];

                if (isExpanded) {
                  rows.push(
                    <TableRow key={`${r.id}-breakdown`} className="bg-muted/30">
                      <TableCell colSpan={COLUMN_COUNT} className="p-0">
                        <div className="px-8 py-3">
                          {entries.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-2">No reinsurer breakdown available.</p>
                          ) : (
                            <Table>
                              <TableHeader>
                                <TableRow className="text-xs">
                                  <TableHead className="h-8">Cover</TableHead>
                                  <TableHead className="h-8">Reinsurer</TableHead>
                                  <TableHead className="h-8">Rating</TableHead>
                                  <TableHead className="h-8">Treaty</TableHead>
                                  <TableHead className="h-8">Type</TableHead>
                                  <TableHead className="h-8 text-right">Share %</TableHead>
                                  <TableHead className="h-8 text-right">Sum Insured</TableHead>
                                  <TableHead className="h-8 text-right">Premium</TableHead>
                                  <TableHead className="h-8 text-right">Commission %</TableHead>
                                  <TableHead className="h-8 text-right">Commission</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {entries.map((entry, idx) => {
                                  const entryGradeId = gradeIdByReinsurer.get(entry.reinsurerId);
                                  const entryGradeLabel = entryGradeId ? gradeLabelById.get(entryGradeId) : (entry.rating || undefined);
                                  return (
                                  <TableRow key={`${r.id}-rb-${idx}`} className="text-xs">
                                    <TableCell className="py-1.5">{entry.coverName ?? '-'}</TableCell>
                                    <TableCell className="py-1.5">{entry.reinsurerName}</TableCell>
                                    <TableCell className="py-1.5">{entryGradeLabel ?? '-'}</TableCell>
                                    <TableCell className="py-1.5">{entry.treatyName ?? '-'}</TableCell>
                                    <TableCell className="py-1.5">{entry.structureType ?? '-'}</TableCell>
                                    <TableCell className="py-1.5 text-right">{entry.sharePercent.toFixed(1)}%</TableCell>
                                    <TableCell className="py-1.5 text-right">{formatCurrencyCompact(entry.sumInsured)}</TableCell>
                                    <TableCell className="py-1.5 text-right">{formatCurrencyCompact(entry.premium)}</TableCell>
                                    <TableCell className="py-1.5 text-right">{entry.commissionPercent.toFixed(1)}%</TableCell>
                                    <TableCell className="py-1.5 text-right">{formatCurrencyCompact(entry.commissionAmount)}</TableCell>
                                  </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>,
                  );
                }

                return rows;
              })
            )}
          </TableBody>
        </Table>
        </div>

        {!showTableSkeleton && totalRecords > 0 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {Math.min((page - 1) * PAGE_SIZE + 1, totalRecords)}–{Math.min(page * PAGE_SIZE, totalRecords)} of {totalRecords} results
            </p>
            {totalPages > 1 && (
              <Pagination className="mx-0 w-auto">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => { e.preventDefault(); if (page > 1) setPage(page - 1); }}
                      className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                  {paginationRange.map((p, idx) =>
                    p === 'ellipsis' ? (
                      <PaginationItem key={`ellipsis-${idx}`}>
                        <span className="px-2 text-muted-foreground">...</span>
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={p}>
                        <PaginationLink
                          href="#"
                          isActive={page === p}
                          onClick={(e) => { e.preventDefault(); setPage(p as number); }}
                        >
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    ),
                  )}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => { e.preventDefault(); if (page < totalPages) setPage(page + 1); }}
                      className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
