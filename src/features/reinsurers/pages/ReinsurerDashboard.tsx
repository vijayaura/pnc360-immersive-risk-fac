import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, Network, Shield, ShieldAlert } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TableSearchFilter, type FilterConfig } from '@/components/shared/TableSearchFilter';
import { ReinsurerTable } from '@/features/reinsurer-management/components/ReinsurerTable';
import type { ReinsurerPolicyRecord } from '@/features/reinsurer-management/types';
import { formatCurrencyCompact } from '@/shared/utils/lib-utils';
import FacInCasesTab, { FacInCasesSummaryCards } from '@/features/insurers/components/InsurerDashboard/FacInCasesTab';

const rows: ReinsurerPolicyRecord[] = [
  {
    id: 'demo-pol-001',
    policyOrQuoteId: 'PNC-QA-24001',
    riskId: 'RISK-24001',
    customerName: 'Apex Infrastructure Pvt Ltd',
    productName: 'Contractors All Risk',
    status: 'Bound',
    hasReinsurance: true,
    referralInfo: {
      source: 'Underwriter',
      createdBy: 'Demo Underwriter',
      createdDate: '2026-05-01',
      status: 'Approved',
    },
    productBreakdown: [],
    policyUuid: 'demo-policy-001',
    programNames: ['Property Cat XL'],
    treatyNames: ['2026 India Property Treaty'],
    totals: {
      sumInsured: 125000000,
      grossPremium: 3400000,
      cededToTreaty: 87500000,
      facultativeCeded: 0,
      netRetention: 37500000,
      commissionEarned: 425000,
      netRetentionAfterCommission: 37075000,
    },
  },
  {
    id: 'demo-pol-002',
    policyOrQuoteId: 'PNC-QA-24018',
    riskId: 'RISK-24018',
    customerName: 'Northstar Warehousing',
    productName: 'Fire and Allied Perils',
    status: 'Active',
    hasReinsurance: true,
    referralInfo: {
      source: 'Market Admin',
      createdBy: 'Demo Admin',
      createdDate: '2026-05-03',
      status: 'Approved',
    },
    productBreakdown: [],
    policyUuid: 'demo-policy-002',
    programNames: ['Quota Share'],
    treatyNames: ['Commercial Property QS'],
    totals: {
      sumInsured: 82000000,
      grossPremium: 2100000,
      cededToTreaty: 49200000,
      facultativeCeded: 8200000,
      netRetention: 24600000,
      commissionEarned: 315000,
      netRetentionAfterCommission: 24285000,
    },
  },
  {
    id: 'demo-pol-003',
    policyOrQuoteId: 'PNC-QA-24027',
    riskId: 'RISK-24027',
    customerName: 'Greenline Energy Services',
    productName: 'Public Liability',
    status: 'Pending Review',
    hasReinsurance: true,
    referralInfo: {
      source: 'Underwriter',
      createdBy: 'Demo Underwriter',
      createdDate: '2026-05-05',
      status: 'In Review',
    },
    productBreakdown: [],
    quoteId: 'demo-quote-003',
    programNames: ['Surplus Treaty'],
    treatyNames: ['Liability Surplus 2026'],
    totals: {
      sumInsured: 54000000,
      grossPremium: 1460000,
      cededToTreaty: 35100000,
      facultativeCeded: 0,
      netRetention: 18900000,
      commissionEarned: 182500,
      netRetentionAfterCommission: 18717500,
    },
  },
  {
    id: 'demo-pol-004',
    policyOrQuoteId: 'PNC-QA-24041',
    riskId: 'RISK-24041',
    customerName: 'Harbor Logistics Group',
    productName: 'Marine Cargo',
    status: 'Pending Review',
    hasReinsurance: true,
    referralInfo: {
      source: 'Underwriter',
      createdBy: 'Demo Underwriter',
      createdDate: '2026-05-06',
      status: 'In Review',
    },
    productBreakdown: [],
    quoteId: 'demo-quote-004',
    programNames: ['Facultative Placement'],
    treatyNames: ['Single Risk Facultative'],
    totals: {
      sumInsured: 68000000,
      grossPremium: 1750000,
      cededToTreaty: 0,
      facultativeCeded: 47600000,
      netRetention: 20400000,
      commissionEarned: 210000,
      netRetentionAfterCommission: 20190000,
    },
  },
  {
    id: 'demo-pol-005',
    policyOrQuoteId: 'PNC-QA-24052',
    riskId: 'RISK-24052',
    customerName: 'BluePeak Manufacturing',
    productName: 'Industrial All Risk',
    status: 'Pending Review',
    hasReinsurance: true,
    referralInfo: {
      source: 'Underwriter',
      createdBy: 'Demo Underwriter',
      createdDate: '2026-05-07',
      status: 'In Review',
    },
    productBreakdown: [],
    quoteId: 'demo-quote-005',
    programNames: ['Special Acceptance'],
    treatyNames: ['Special Acceptance Review'],
    totals: {
      sumInsured: 92000000,
      grossPremium: 2350000,
      cededToTreaty: 0,
      facultativeCeded: 64400000,
      netRetention: 27600000,
      commissionEarned: 282000,
      netRetentionAfterCommission: 27318000,
    },
  },
  {
    id: 'demo-pol-006',
    policyOrQuoteId: 'PNC-QA-24063',
    riskId: 'RISK-24063',
    customerName: 'Summit Metro Projects',
    productName: 'Contractors All Risk',
    status: 'Bound',
    hasReinsurance: true,
    referralInfo: {
      source: 'Market Admin',
      createdBy: 'Demo Admin',
      createdDate: '2026-05-08',
      status: 'Approved',
    },
    productBreakdown: [],
    policyUuid: 'demo-policy-006',
    programNames: ['Special Acceptance'],
    treatyNames: ['Special Acceptance Bound'],
    totals: {
      sumInsured: 118000000,
      grossPremium: 3100000,
      cededToTreaty: 0,
      facultativeCeded: 82600000,
      netRetention: 35400000,
      commissionEarned: 372000,
      netRetentionAfterCommission: 35028000,
    },
  },
];

type ProgramTab = 'facultative' | 'treaties' | 'special-acceptance';
type RecordTab = 'quotes' | 'policies';

const isSpecialAcceptanceRow = (row: ReinsurerPolicyRecord) =>
  (row.programNames ?? []).some((name) => name.toLowerCase().includes('special acceptance'));

export default function ReinsurerDashboard() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [productFilter, setProductFilter] = useState<string | undefined>();
  const [activeProgramTab, setActiveProgramTab] = useState<ProgramTab>('facultative');
  const [activeRecordTab, setActiveRecordTab] = useState<RecordTab>('policies');

  const tabRows = useMemo(
    () => {
      const programRows = rows.filter((row) => {
        if (activeProgramTab === 'special-acceptance') return isSpecialAcceptanceRow(row);
        if (activeProgramTab === 'facultative') {
          return (row.totals?.facultativeCeded ?? 0) > 0 && !isSpecialAcceptanceRow(row);
        }
        return (row.totals?.cededToTreaty ?? 0) > 0 && !isSpecialAcceptanceRow(row);
      });

      if (activeProgramTab === 'treaties') {
        return programRows.filter((row) => row.policyUuid);
      }

      return activeRecordTab === 'quotes'
        ? programRows.filter((row) => row.quoteId && !row.policyUuid)
        : programRows.filter((row) => row.policyUuid);
    },
    [activeProgramTab, activeRecordTab],
  );

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return tabRows.filter((row) => {
      const matchesSearch =
        !term ||
        [row.policyOrQuoteId, row.customerName, row.productName, row.status, ...(row.programNames ?? []), ...(row.treatyNames ?? [])]
          .join(' ')
          .toLowerCase()
          .includes(term);
      const matchesProduct = !productFilter || row.productName === productFilter;

      return matchesSearch && matchesProduct;
    });
  }, [productFilter, search, tabRows]);

  const productFilterOptions = useMemo(
    () =>
      Array.from(new Set(tabRows.map((row) => row.productName))).map((name) => ({
        value: name,
        label: name,
      })),
    [tabRows],
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

  const activeFilters = productFilter ? { productName: productFilter } : {};

  const handleFilterChange = (key: string, value: unknown) => {
    if (key === 'productName') {
      const nextValue = typeof value === 'string' ? value.trim() : '';
      setProductFilter(nextValue || undefined);
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setProductFilter(undefined);
  };

  const resetTableState = () => {
    setSearch('');
    setProductFilter(undefined);
  };

  const handleProgramTabChange = (value: string) => {
    const nextTab = value as ProgramTab;
    setActiveProgramTab(nextTab);
    if (nextTab === 'treaties') {
      setActiveRecordTab('policies');
    }
    resetTableState();
  };

  const handleRecordTabChange = (value: string) => {
    setActiveRecordTab(value as RecordTab);
    resetTableState();
  };

  const handleViewDetails = (recordId: string) => {
    const record = rows.find((row) => row.id === recordId);
    navigate(`/reinsurer/dashboard/${recordId}`, { state: { record } });
  };

  const renderPolicyTable = () => (
    <>
      <TableSearchFilter
        searchTerm={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search policies..."
        filters={filters}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        className="mb-4"
      />

      <ReinsurerTable
        rows={filteredRows}
        onViewDetails={handleViewDetails}
      />

      <div className="mt-4 border-t px-1 py-4 text-sm text-muted-foreground">
        Showing {filteredRows.length} of {tabRows.length} demo records
      </div>
    </>
  );

  const summary = useMemo(
    () =>
      rows.reduce(
        (acc, row) => ({
          totalPolicies: acc.totalPolicies + 1,
          totalSumInsured: acc.totalSumInsured + (row.totals?.sumInsured ?? 0),
          totalRetention: acc.totalRetention + (row.totals?.netRetention ?? 0),
          totalCession:
            acc.totalCession + (row.totals?.cededToTreaty ?? 0) + (row.totals?.facultativeCeded ?? 0),
        }),
        {
          totalPolicies: 0,
          totalSumInsured: 0,
          totalRetention: 0,
          totalCession: 0,
        },
      ),
    [],
  );

  return (
    <div className="min-h-full overflow-auto bg-background p-6">
      <div className="w-full space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reinsurance Management</h1>
          <p className="text-sm text-muted-foreground">
            Demo dashboard for reinsurer-facing policy participation and exposure monitoring.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: 'Total Policies',
              icon: Shield,
              value: summary.totalPolicies,
              isCurrency: false,
              iconBg: 'bg-primary/10',
              iconColor: 'text-primary',
            },
            {
              label: 'Sum Insured',
              icon: ShieldAlert,
              value: summary.totalSumInsured,
              isCurrency: true,
              iconBg: 'bg-primary/10',
              iconColor: 'text-primary',
            },
            {
              label: 'Total Retention',
              icon: ArrowDownLeft,
              value: summary.totalRetention,
              isCurrency: true,
              iconBg: 'bg-accent/10',
              iconColor: 'text-accent',
            },
            {
              label: 'Total Cession',
              icon: ArrowUpRight,
              value: summary.totalCession,
              isCurrency: true,
              iconBg: 'bg-accent/10',
              iconColor: 'text-accent',
            },
          ].map(({ label, icon: Icon, value, isCurrency, iconBg, iconColor }) => (
            <Card key={label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{label}</p>
                    <p className="mt-1 text-2xl font-bold text-foreground">
                      {isCurrency ? formatCurrencyCompact(value) : value}
                    </p>
                  </div>
                  <div className={`rounded-lg ${iconBg} p-3`}>
                    <Icon className={`h-6 w-6 ${iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={activeProgramTab} onValueChange={handleProgramTabChange}>
          <TabsList className="mb-3">
            <TabsTrigger value="facultative">Facultative</TabsTrigger>
            <TabsTrigger value="treaties">Treaties</TabsTrigger>
            <TabsTrigger value="special-acceptance">Special acceptance</TabsTrigger>
          </TabsList>

          {activeProgramTab === 'facultative' ? (
            <div className="mb-4">
              <FacInCasesSummaryCards />
            </div>
          ) : null}

          {activeProgramTab !== 'treaties' && (
            <Tabs value={activeRecordTab} onValueChange={handleRecordTabChange} className="mb-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="quotes" className="w-full">
                  Slips
                </TabsTrigger>
                <TabsTrigger value="policies" className="w-full">
                  Policies
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          <TabsContent value="treaties" className="mt-0">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  {activeRecordTab === 'quotes' ? 'Slips' : 'Policies'}
                </CardTitle>
                <CardDescription>
                  Search, filter, and open treaty-backed records to view referral information and product breakdown.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderPolicyTable()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="special-acceptance" className="mt-0">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  {activeRecordTab === 'quotes' ? 'Slips' : 'Policies'}
                </CardTitle>
                <CardDescription>
                  Search, filter, and open special acceptance records to view referral information and product breakdown.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderPolicyTable()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="facultative" className="mt-0">
            {activeRecordTab === 'quotes' ? (
              <FacInCasesTab hideSummary referralBasePath="/reinsurer/fac-slips" />
            ) : (
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="h-5 w-5" />
                    Policies
                  </CardTitle>
                  <CardDescription>
                    Search, filter, and open facultative-backed policy records to view referral information and product
                    breakdown.
                  </CardDescription>
                </CardHeader>
                <CardContent>{renderPolicyTable()}</CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
