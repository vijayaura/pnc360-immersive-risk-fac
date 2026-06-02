import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, PlusCircle, Search, ShieldCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { facultativePolicies, facultativeReferrals } from '@/features/reinsurer-brokers/data/mockData';

const fmtAED = (value: number) =>
  `${new Intl.NumberFormat('en-AE', { maximumFractionDigits: 0 }).format(value)} AED`;

const statusClass = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized.includes('bound') || normalized.includes('active')) return 'bg-green-50 text-green-700 border-green-200';
  if (normalized.includes('review') || normalized.includes('shared')) return 'bg-blue-50 text-blue-700 border-blue-200';
  return 'bg-yellow-50 text-yellow-700 border-yellow-200';
};

export default function ReinsurerBrokerDashboard() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const filteredReferrals = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return facultativeReferrals;
    return facultativeReferrals.filter((row) =>
      [row.requestId, row.riskId, row.insured, row.product, row.status, row.reinsurer]
        .join(' ')
        .toLowerCase()
        .includes(search),
    );
  }, [query]);

  return (
    <div className="min-h-full overflow-auto bg-slate-50">
      <div className="mx-auto w-full max-w-none space-y-6 px-4 py-6 pb-8">
        <div className="flex flex-col gap-4 rounded-xl border bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Facultative placement</p>
            <h2 className="text-2xl font-bold text-slate-900">Reinsurance Requester Dashboard</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage facultative referrals, slip submissions, and policies from one requester workspace.
            </p>
          </div>
          <Button className="gap-2" onClick={() => navigate('/reinsurer-broker/facultative-request')}>
            <PlusCircle className="h-4 w-4" />
            Create Facultative Request
          </Button>
        </div>

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

        <Card className="shadow-sm">
          <CardHeader className="gap-4 border-b">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Facultative Records
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Search across facultative referrals and slip submissions.
                </p>
              </div>
              <div className="relative w-full lg:w-80">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search request, risk, insured..."
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
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
                  {filteredReferrals.map((row) => (
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
                          onClick={() => navigate(`/reinsurer-broker/referral/${row.id}`, { state: { record: row } })}
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
