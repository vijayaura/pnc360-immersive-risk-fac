import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { facultativeReferrals as facRowTemplates } from '@/features/reinsurer-brokers/data/mockData';

export function facultativeRequestStatusBadgeClass(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes('bound') || normalized.includes('active')) return 'bg-green-50 text-green-700 border-green-200';
  if (normalized.includes('review') || normalized.includes('shared')) return 'bg-blue-50 text-blue-700 border-blue-200';
  return 'bg-yellow-50 text-yellow-700 border-yellow-200';
}

/** Map a facultative panel reinsurer line to a demo facultative request row for navigation and status. */
export function matchFacultativeDemoTemplateByReinsurerName(
  panelName: string,
): (typeof facRowTemplates)[number] {
  const n = panelName.trim().toLowerCase();
  if (!n) return facRowTemplates[0];

  const falcon = facRowTemplates.find((t) => t.reinsurer.toLowerCase().includes('falcon'));
  if (falcon && n.includes('falcon')) return falcon;

  const global = facRowTemplates.find((t) => t.reinsurer.toLowerCase().includes('global'));
  if (global && n.includes('global')) return global;

  if (n.includes('partner')) {
    const demo = facRowTemplates.find((t) => t.reinsurer.toLowerCase().includes('demo'));
    if (demo) return demo;
  }

  for (const t of facRowTemplates) {
    const r = t.reinsurer.toLowerCase();
    if (r.includes(n) || (r.split(/\s+/)[0] && n.includes(r.split(/\s+/)[0] ?? ''))) return t;
  }
  return facRowTemplates[0];
}

export function reinsurerSlugForDemoRow(row: (typeof facRowTemplates)[number]): string {
  const r = row.reinsurer.toLowerCase();
  if (r.includes('falcon')) return 'falcon-re';
  if (r.includes('global')) return 'global-re';
  return 'demo-reinsurer';
}

/** Same relative weights as the original mock SIs (52000k : 47600k : 35000k). */
const POOL_WEIGHTS = [52000000, 47600000, 35000000];
const POOL_WEIGHT_SUM = POOL_WEIGHTS.reduce((a, b) => a + b, 0);

function fmtMoney(value: number, currency: string) {
  return `${new Intl.NumberFormat('en-AE', { maximumFractionDigits: 0 }).format(value)} ${currency}`;
}

export type InsurerReferralFacRow = (typeof facRowTemplates)[number] & {
  requestedCededSI: number;
  premium: number;
  product: string;
  insured: string;
};

export function InsurerReferralFacultativeRequestsCard({
  referralId,
  currency,
  coverSumInsured,
  coverGrossPremium,
  facultativeCededFromContext,
  userFacSlipsCededSi,
  productLabel,
  insuredLabel,
}: {
  referralId: string;
  currency: string;
  coverSumInsured: number;
  coverGrossPremium: number;
  facultativeCededFromContext: number;
  userFacSlipsCededSi: number;
  productLabel: string;
  insuredLabel: string;
}) {
  const navigate = useNavigate();

  const displayRows: InsurerReferralFacRow[] = useMemo(() => {
    const siBase = Math.max(0, coverSumInsured);
    const premBase = Math.max(0, coverGrossPremium);
    const poolSi = Math.max(
      facultativeCededFromContext,
      userFacSlipsCededSi,
      siBase > 0 ? Math.round(siBase * 0.45) : 0,
    );

    return facRowTemplates.map((template, i) => {
      const requestedCededSI =
        poolSi > 0 ? Math.max(0, Math.round(poolSi * (POOL_WEIGHTS[i] / POOL_WEIGHT_SUM))) : template.requestedCededSI;
      const premium =
        siBase > 0 && premBase > 0
          ? Math.max(0, Math.round(premBase * (requestedCededSI / siBase)))
          : template.premium;

      return {
        ...template,
        requestedCededSI,
        premium,
        product: productLabel,
        insured: insuredLabel,
      };
    });
  }, [
    coverGrossPremium,
    coverSumInsured,
    facultativeCededFromContext,
    insuredLabel,
    productLabel,
    userFacSlipsCededSi,
  ]);

  return (
    <Card className="border-primary/20 shadow-sm">
      <CardHeader className="border-b border-border/80">
        <CardTitle className="text-lg">Made facultative requests</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full min-w-[44rem] text-sm">
            <thead className="bg-muted/60 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
            <tbody className="divide-y">
              {displayRows.map((row) => (
                <tr key={row.id} className="bg-background hover:bg-muted/40">
                  <td className="px-4 py-3 font-semibold text-foreground">{row.requestId}</td>
                  <td className="px-4 py-3">{row.riskId}</td>
                  <td className="px-4 py-3">{row.reinsurer}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={facultativeRequestStatusBadgeClass(row.status)}>
                      {row.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtMoney(row.requestedCededSI, currency)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtMoney(row.premium, currency)}</td>
                  <td className="px-4 py-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 whitespace-nowrap"
                      onClick={() =>
                        navigate(
                          `/insurer/referral/${referralId}/reinsurance/fac/${row.id}/reinsurer/${reinsurerSlugForDemoRow(row)}`,
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
  );
}
