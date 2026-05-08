import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';

import { TableSearchFilter, type FilterConfig } from '@/components/shared/TableSearchFilter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { facultativePolicies, facultativeReferrals } from '@/features/reinsurer-brokers/data/mockData';
import { useTableSearch } from '@/shared/hooks/useTableSearch';

function uniqueSorted(values: string[]) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

const fmtAED = (value: number) =>
  `${new Intl.NumberFormat('en-AE', { maximumFractionDigits: 0 }).format(value)} AED`;

const statusClass = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized.includes('bound') || normalized.includes('active')) return 'bg-green-50 text-green-700 border-green-200';
  if (normalized.includes('review') || normalized.includes('shared')) return 'bg-blue-50 text-blue-700 border-blue-200';
  return 'bg-yellow-50 text-yellow-700 border-yellow-200';
};

export interface FacInCasesTabProps {
  /** Base path for facultative slip detail URLs (e.g. `/insurer/fac-in-cases` or `/reinsurer/fac-slips`). */
  referralBasePath?: string;
  /** When true, omit the summary metric row (e.g. parent renders it above sibling tabs). */
  hideSummary?: boolean;
}

/** Open Referrals / Bound Policies / Requested Ceded SI / Premium — shared with reinsurer dashboard layout. */
export function FacInCasesSummaryCards() {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Open Referrals</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-bold">{facultativeReferrals.length}</CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Bound Policies</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-bold">{facultativePolicies.length}</CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Requested Ceded SI</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-bold">
          {fmtAED(facultativeReferrals.reduce((sum, row) => sum + row.requestedCededSI, 0))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Premium</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-bold">
          {fmtAED(facultativeReferrals.reduce((sum, row) => sum + row.premium, 0))}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Matches the facultative Referrals / Policies experience from the reinsurer broker dashboard
 * (summary cards + Facultative Inwards), with configurable navigation prefix.
 */
export default function FacInCasesTab({
  referralBasePath = '/insurer/fac-in-cases',
  hideSummary = false,
}: FacInCasesTabProps) {
  const navigate = useNavigate();
  const [recordsTab, setRecordsTab] = useState<'referrals' | 'policies'>('referrals');

  const referralsSearch = useTableSearch({
    data: facultativeReferrals,
    searchableFields: ['requestId', 'riskId', 'insured', 'product', 'status', 'reinsurer', 'submittedDate'],
  });

  const policiesSearch = useTableSearch({
    data: facultativePolicies,
    searchableFields: ['policyId', 'riskId', 'insured', 'product', 'status', 'reinsurer', 'inception'],
  });

  const activeSearch = recordsTab === 'referrals' ? referralsSearch : policiesSearch;

  const referralFilters = useMemo((): FilterConfig[] => {
    const statusOpts = uniqueSorted(facultativeReferrals.map((r) => r.status));
    const productOpts = uniqueSorted(facultativeReferrals.map((r) => r.product));
    const reinsurerOpts = uniqueSorted(facultativeReferrals.map((r) => r.reinsurer));
    return [
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: statusOpts.map((v) => ({ value: v, label: v })),
      },
      {
        key: 'product',
        label: 'Product',
        type: 'select',
        options: productOpts.map((v) => ({ value: v, label: v })),
      },
      {
        key: 'reinsurer',
        label: 'Reinsurer',
        type: 'select',
        options: reinsurerOpts.map((v) => ({ value: v, label: v })),
      },
    ];
  }, []);

  const policyFilters = useMemo((): FilterConfig[] => {
    const statusOpts = uniqueSorted(facultativePolicies.map((r) => r.status));
    const productOpts = uniqueSorted(facultativePolicies.map((r) => r.product));
    const reinsurerOpts = uniqueSorted(facultativePolicies.map((r) => r.reinsurer));
    return [
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: statusOpts.map((v) => ({ value: v, label: v })),
      },
      {
        key: 'product',
        label: 'Product',
        type: 'select',
        options: productOpts.map((v) => ({ value: v, label: v })),
      },
      {
        key: 'reinsurer',
        label: 'Reinsurer',
        type: 'select',
        options: reinsurerOpts.map((v) => ({ value: v, label: v })),
      },
    ];
  }, []);

  return (
    <div className="space-y-6">
      {hideSummary ? null : <FacInCasesSummaryCards />}

      <Card className="border-border bg-card shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Facultative Inwards
              </CardTitle>
              <CardDescription>
                Search across facultative requests, slips, and bound policy records.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TableSearchFilter
            searchTerm={activeSearch.searchTerm}
            onSearchChange={activeSearch.setSearchTerm}
            searchPlaceholder={
              recordsTab === 'referrals'
                ? 'Search request, risk, insured, reinsurer…'
                : 'Search policy, risk, insured, reinsurer…'
            }
            filters={recordsTab === 'referrals' ? referralFilters : policyFilters}
            activeFilters={activeSearch.filters}
            onFilterChange={activeSearch.updateFilter}
            onClearFilters={activeSearch.clearFilters}
            className="mb-4"
          />
          <Tabs
            value={recordsTab}
            onValueChange={(v) => setRecordsTab(v as 'referrals' | 'policies')}
            className="space-y-4"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="referrals">Referrals</TabsTrigger>
              <TabsTrigger value="policies">Policies</TabsTrigger>
            </TabsList>

            <TabsContent value="referrals" className="mt-0">
              <div className="overflow-x-auto rounded-lg border bg-white">
                <table className="w-full min-w-[68rem] text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Request ID</th>
                      <th className="px-4 py-3">Risk ID</th>
                      <th className="px-4 py-3">Insured</th>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Requested Ceded SI</th>
                      <th className="px-4 py-3">Premium</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {referralsSearch.filteredData.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-slate-900">{row.requestId}</td>
                        <td className="px-4 py-3">{row.riskId}</td>
                        <td className="px-4 py-3">{row.insured}</td>
                        <td className="px-4 py-3">{row.product}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={statusClass(row.status)}>{row.status}</Badge>
                        </td>
                        <td className="px-4 py-3">{fmtAED(row.requestedCededSI)}</td>
                        <td className="px-4 py-3">{fmtAED(row.premium)}</td>
                        <td className="px-4 py-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() =>
                              navigate(`${referralBasePath}/${row.id}`, { state: { record: row } })
                            }
                          >
                            View
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="policies" className="mt-0">
              <div className="overflow-x-auto rounded-lg border bg-white">
                <table className="w-full min-w-[62rem] text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Policy ID</th>
                      <th className="px-4 py-3">Risk ID</th>
                      <th className="px-4 py-3">Insured</th>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Ceded SI</th>
                      <th className="px-4 py-3">Reinsurer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {policiesSearch.filteredData.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-slate-900">{row.policyId}</td>
                        <td className="px-4 py-3">{row.riskId}</td>
                        <td className="px-4 py-3">{row.insured}</td>
                        <td className="px-4 py-3">{row.product}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={statusClass(row.status)}>{row.status}</Badge>
                        </td>
                        <td className="px-4 py-3">{fmtAED(row.cededSI)}</td>
                        <td className="px-4 py-3">{row.reinsurer}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
