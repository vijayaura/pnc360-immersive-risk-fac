import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import { TableSearchFilter, type FilterConfig } from '@/components/shared/TableSearchFilter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { facultativeReferrals as facTemplates } from '@/features/reinsurer-brokers/data/mockData';
import { useTableSearch } from '@/shared/hooks/useTableSearch';

function uniqueSorted(values: string[]) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

/** Demo referral whose reinsurance breakdown links these outbound fac rows (bookmarkable dashboard). */
export const INSURER_FAC_OUT_DEMO_REFERRAL_ID = '30208509-bc45-4622-aeb3-ae7f5e32024e';

const CURRENCY = 'AED';

const statusClass = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized.includes('bound') || normalized.includes('active')) return 'bg-green-50 text-green-700 border-green-200';
  if (normalized.includes('review') || normalized.includes('shared')) return 'bg-blue-50 text-blue-700 border-blue-200';
  return 'bg-yellow-50 text-yellow-700 border-yellow-200';
};

function reinsurerSlugForDemoRow(row: (typeof facTemplates)[number]): string {
  const r = row.reinsurer.toLowerCase();
  if (r.includes('falcon')) return 'falcon-re';
  if (r.includes('global')) return 'global-re';
  return 'demo-reinsurer';
}

function fmtMoney(value: number) {
  return `${new Intl.NumberFormat('en-AE', { maximumFractionDigits: 0 }).format(value)} ${CURRENCY}`;
}

/** Scale mock SI/premium so the dashboard matches illustrative outbound amounts (~9.4M SI first row). */
function useOutboundDisplayRows() {
  return useMemo(() => {
    const anchor = facTemplates[0];
    const targetSi = 9_387_816;
    const targetPrem = 7_823;
    const siScale = anchor.requestedCededSI > 0 ? targetSi / anchor.requestedCededSI : 1;
    const premPerSi = targetSi > 0 ? targetPrem / targetSi : 0;

    return facTemplates.map((template) => {
      const requestedCededSI = Math.max(0, Math.round(template.requestedCededSI * siScale));
      const premium = Math.max(0, Math.round(requestedCededSI * premPerSi));
      return {
        ...template,
        requestedCededSI,
        premium,
        product: 'General Third Party & Public Liability Insurance',
        insured: 'Per referral schedule',
      };
    });
  }, []);
}

export function InsurerFacOutboundRequestsDashboard() {
  const navigate = useNavigate();
  const rows = useOutboundDisplayRows();

  const {
    searchTerm,
    setSearchTerm,
    filters,
    filteredData,
    updateFilter,
    clearFilters,
  } = useTableSearch({
    data: rows,
    searchableFields: ['requestId', 'riskId', 'insured', 'product', 'status', 'reinsurer'],
  });

  const filterConfigs = useMemo((): FilterConfig[] => {
    const statusOpts = uniqueSorted(rows.map((r) => r.status));
    const reinsurerOpts = uniqueSorted(rows.map((r) => r.reinsurer));
    return [
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: statusOpts.map((v) => ({ value: v, label: v })),
      },
      {
        key: 'reinsurer',
        label: 'Target reinsurer',
        type: 'select',
        options: reinsurerOpts.map((v) => ({ value: v, label: v })),
      },
    ];
  }, [rows]);

  const outboundMetrics = useMemo(() => {
    const count = filteredData.length;
    const totalSi = filteredData.reduce((acc, row) => acc + row.requestedCededSI, 0);
    const totalPrem = filteredData.reduce((acc, row) => acc + row.premium, 0);
    const reinsurers = new Set(filteredData.map((r) => r.reinsurer)).size;
    return { count, totalSi, totalPrem, reinsurers };
  }, [filteredData]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Outbound requests</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{outboundMetrics.count}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Requested ceded SI</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{fmtMoney(outboundMetrics.totalSi)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Premium</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{fmtMoney(outboundMetrics.totalPrem)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Reinsurers</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{outboundMetrics.reinsurers}</CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Facultative Outwards</CardTitle>
              <CardDescription>
                Outbound facultative placements and capacity requests sent to reinsurers.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TableSearchFilter
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search request, risk, insured, reinsurer…"
            filters={filterConfigs}
            activeFilters={filters}
            onFilterChange={updateFilter}
            onClearFilters={clearFilters}
            className="mb-4"
          />
          <div className="overflow-x-auto rounded-lg border bg-card">
            <table className="w-full min-w-[46rem] text-sm">
              <thead className="bg-rose-50/80 dark:bg-rose-950/20 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Request ID</th>
                  <th className="px-4 py-3">Risk ID</th>
                  <th className="px-4 py-3">Target reinsurer</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Requested ceded SI</th>
                  <th className="px-4 py-3 text-right">Premium</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredData.map((row) => (
                  <tr key={row.id} className="bg-background hover:bg-muted/50">
                    <td className="px-4 py-3 font-semibold text-foreground">{row.requestId}</td>
                    <td className="px-4 py-3 tabular-nums">{row.riskId}</td>
                    <td className="px-4 py-3">{row.reinsurer}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`font-normal ${statusClass(row.status)}`}>
                        {row.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{fmtMoney(row.requestedCededSI)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{fmtMoney(row.premium)}</td>
                    <td className="px-4 py-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 whitespace-nowrap"
                        onClick={() =>
                          navigate(
                            `/insurer/referral/${INSURER_FAC_OUT_DEMO_REFERRAL_ID}/reinsurance/fac/${row.id}/reinsurer/${reinsurerSlugForDemoRow(row)}`,
                            { state: { record: row } },
                          )
                        }
                      >
                        View details
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
