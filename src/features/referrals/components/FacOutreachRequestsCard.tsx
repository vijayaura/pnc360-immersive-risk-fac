import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FileText, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormattedNumberInput } from '@/components/ui/FormattedNumberInput';
import { Label } from '@/components/ui/label';
import { facultativeReferrals } from '@/features/reinsurer-brokers/data/mockData';
import type { PartyKind } from '@/features/referrals/components/FacultativeNewRequestDialog';

/** Demo facultative placement shell (fac-out details) — matches insurer route convention. */
const FAC_OUTREACH_RECORD_ID = 'demo-pol-004';
const FAC_OUTREACH_REINSURER_SLUG = 'demo-reinsurer';

export type FacOutreachRowStatus =
  | 'request_sent'
  | 'awaiting_response'
  | 'offer_received'
  | 'approved'
  | 'rejected';

export interface FacOutreachRowState {
  id: string;
  kind: PartyKind;
  partyId: string;
  name: string;
  email?: string;
  status: FacOutreachRowStatus;
  receivedSi?: number;
  receivedPremium?: number;
}

export interface FacOutreachCaseState {
  id: string;
  createdAt: number;
  /** Total SI sought in the facultative outreach (from risk at send time). */
  soughtSumInsured: number;
  rows: FacOutreachRowState[];
}

function kindLabel(kind: PartyKind): string {
  switch (kind) {
    case 'reinsurer':
      return 'Reinsurer';
    case 'reinsurance_broker':
      return 'Reinsurance broker';
    case 'insurer':
      return 'Insurer';
    default:
      return kind;
  }
}

function statusLabel(status: FacOutreachRowStatus): string {
  switch (status) {
    case 'request_sent':
      return 'Request sent';
    case 'awaiting_response':
      return 'Awaiting response';
    case 'offer_received':
      return 'Offer received';
    case 'approved':
      return 'Accepted';
    case 'rejected':
      return 'Declined';
    default:
      return status;
  }
}

function outreachStatusBadgeClass(status: FacOutreachRowStatus): string {
  switch (status) {
    case 'approved':
      return 'bg-green-50 text-green-800 border-green-200';
    case 'rejected':
      return 'bg-red-50 text-red-800 border-red-200';
    case 'offer_received':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'awaiting_response':
      return 'bg-blue-50 text-blue-800 border-blue-200';
    case 'request_sent':
    default:
      return 'bg-slate-50 text-slate-800 border-slate-200';
  }
}

const fmtAED = (n: number, currency: string) =>
  new Intl.NumberFormat('en-AE', { style: 'decimal', maximumFractionDigits: 0 }).format(n) + ' ' + currency;

export function createOutreachCaseFromParties(
  parties: Array<{ kind: PartyKind; id: string; name: string; email?: string }>,
  soughtSumInsured: number,
): FacOutreachCaseState {
  const ts = Date.now();
  return {
    id: `outreach-${ts}`,
    createdAt: ts,
    soughtSumInsured,
    rows: parties.map((p, i) => ({
      id: `outreach-row-${ts}-${i}`,
      kind: p.kind,
      partyId: p.id,
      name: p.name,
      email: p.email,
      status: 'request_sent' as const,
    })),
  };
}

interface FacOutreachRequestsSectionProps {
  cases: FacOutreachCaseState[];
  setCases: React.Dispatch<React.SetStateAction<FacOutreachCaseState[]>>;
  currency: string;
  referralId: string;
  /** e.g. `/insurer` or `/market-admin` */
  basePath?: string;
}

export function FacOutreachRequestsSection({
  cases,
  setCases,
  currency,
  referralId,
  basePath = '/insurer',
}: FacOutreachRequestsSectionProps) {
  const navigate = useNavigate();
  const [offerTarget, setOfferTarget] = useState<{ caseId: string; rowId: string } | null>(null);
  const [offerSi, setOfferSi] = useState<number>(0);
  const [offerPremium, setOfferPremium] = useState<number>(0);

  const updateRow = (caseId: string, rowId: string, patch: Partial<FacOutreachRowState>) => {
    setCases((prev) =>
      prev.map((c) =>
        c.id !== caseId
          ? c
          : {
              ...c,
              rows: c.rows.map((r) => (r.id === rowId ? { ...r, ...patch } : r)),
            },
      ),
    );
  };

  const openRecordOffer = (caseId: string, row: FacOutreachRowState, defaultSi: number) => {
    setOfferTarget({ caseId, rowId: row.id });
    setOfferSi(row.receivedSi ?? defaultSi);
    setOfferPremium(row.receivedPremium ?? 0);
  };

  const saveOffer = () => {
    if (!offerTarget) return;
    updateRow(offerTarget.caseId, offerTarget.rowId, {
      status: 'offer_received',
      receivedSi: offerSi,
      receivedPremium: offerPremium,
    });
    setOfferTarget(null);
  };

  const demoFacTemplate =
    facultativeReferrals.find((r) => r.id === FAC_OUTREACH_RECORD_ID) ?? facultativeReferrals[0];

  const navigateToFacOutDetails = (facCase: FacOutreachCaseState, row: FacOutreachRowState) => {
    if (!referralId) return;
    const path = `${basePath}/referral/${referralId}/reinsurance/fac/${FAC_OUTREACH_RECORD_ID}/reinsurer/${FAC_OUTREACH_REINSURER_SLUG}`;
    const cededSi = row.receivedSi ?? facCase.soughtSumInsured;
    let premium = row.receivedPremium ?? 0;
    if (
      premium === 0 &&
      cededSi > 0 &&
      demoFacTemplate.requestedCededSI > 0 &&
      demoFacTemplate.premium > 0
    ) {
      premium = Math.round((demoFacTemplate.premium * cededSi) / demoFacTemplate.requestedCededSI);
    }
    navigate(path, {
      state: {
        record: {
          ...demoFacTemplate,
          reinsurer: row.name,
          requestedCededSI: Math.round(cededSi),
          premium: Math.round(premium),
        },
      },
    });
  };

  if (cases.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        <FileText className="h-4 w-4" />
        Facultative outreach
      </h2>

      {cases.map((facCase, caseIdx) => {
        const acceptedSi = facCase.rows
          .filter((r) => r.status === 'approved' && typeof r.receivedSi === 'number')
          .reduce((s, r) => s + (r.receivedSi ?? 0), 0);
        const pendingPlacement = Math.max(0, facCase.soughtSumInsured - acceptedSi);

        return (
          <Card key={facCase.id} className="border-blue-100 bg-blue-50/30">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="flex flex-wrap items-center gap-2 text-base text-blue-900">
                    Facultative outreach #{caseIdx + 1}
                    <Badge variant="outline" className="text-xs bg-amber-50 border-amber-200 text-amber-700">
                      Outreach
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Case-by-case reinsurer panel (no treaty) · Made facultative requests: use Status and View details
                    on each line below.
                  </CardDescription>
                  <div className="mt-3 rounded-lg border border-blue-200/80 bg-white/80 px-4 py-3 text-sm">
                    <div className="flex flex-wrap gap-x-8 gap-y-2">
                      <div>
                        <span className="text-muted-foreground">Cumulative accepted SI</span>
                        <p className="font-semibold tabular-nums text-blue-950">{fmtAED(acceptedSi, currency)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Pending SI (unplaced)</span>
                        <p className="font-semibold tabular-nums text-blue-950">{fmtAED(pendingPlacement, currency)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total sought SI</span>
                        <p className="font-semibold tabular-nums text-blue-950">
                          {fmtAED(facCase.soughtSumInsured, currency)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 gap-1.5 text-xs text-destructive hover:text-destructive"
                  onClick={() => setCases((prev) => prev.filter((c) => c.id !== facCase.id))}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto rounded-lg border border-border/60 bg-card">
                <p className="text-sm font-medium mb-0 px-3 py-2 border-b bg-muted/20">Recipients</p>
                <table className="w-full border-collapse text-sm min-w-[40rem]">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground text-xs">
                      <th className="px-3 py-2 text-left font-medium whitespace-nowrap">Organization</th>
                      <th className="px-3 py-2 text-left font-medium whitespace-nowrap">Category</th>
                      <th className="px-3 py-2 text-right font-medium whitespace-nowrap">Received SI</th>
                      <th className="px-3 py-2 text-right font-medium whitespace-nowrap">Received premium</th>
                      <th className="px-3 py-2 text-left font-medium whitespace-nowrap">Status</th>
                      <th className="px-3 py-2 text-right font-medium whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {facCase.rows.map((row) => (
                      <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-3 py-2.5 font-medium whitespace-nowrap">{row.name}</td>
                        <td className="px-3 py-2.5 text-xs whitespace-nowrap">{kindLabel(row.kind)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">
                          {row.receivedSi != null && row.receivedSi > 0 ? fmtAED(row.receivedSi, currency) : '—'}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">
                          {row.receivedPremium != null && row.receivedPremium > 0
                            ? fmtAED(Math.round(row.receivedPremium), currency)
                            : '—'}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap align-middle">
                          <Badge variant="outline" className={`text-xs ${outreachStatusBadgeClass(row.status)}`}>
                            {statusLabel(row.status)}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 text-right align-middle">
                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1 text-xs"
                              onClick={() => navigateToFacOutDetails(facCase, row)}
                            >
                              View details
                              <ArrowRight className="h-3 w-3 shrink-0" />
                            </Button>
                            {(row.status === 'request_sent' || row.status === 'awaiting_response') && (
                              <Button
                                variant="secondary"
                                size="sm"
                                className="h-8 text-xs"
                                onClick={() => openRecordOffer(facCase.id, row, facCase.soughtSumInsured)}
                              >
                                Record offer
                              </Button>
                            )}
                            {row.status === 'offer_received' && (
                              <>
                                <Button
                                  size="sm"
                                  className="h-8 text-xs bg-green-600 hover:bg-green-600/90"
                                  onClick={() =>
                                    updateRow(facCase.id, row.id, { status: 'approved' })
                                  }
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs text-destructive border-destructive/50 hover:bg-destructive/10"
                                  onClick={() =>
                                    updateRow(facCase.id, row.id, { status: 'rejected' })
                                  }
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Dialog open={!!offerTarget} onOpenChange={(o) => !o && setOfferTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record offer from market</DialogTitle>
            <DialogDescription>SI and premium proposed by this party (reinsurer / broker / insurer).</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <Label>Received SI ({currency})</Label>
              <FormattedNumberInput
                allowDecimals={false}
                className="mt-1.5 w-full h-9 text-right tabular-nums"
                value={offerSi || undefined}
                onChange={(v) => setOfferSi(v ?? 0)}
              />
            </div>
            <div>
              <Label>Received premium ({currency})</Label>
              <FormattedNumberInput
                allowDecimals={false}
                className="mt-1.5 w-full h-9 text-right tabular-nums"
                value={offerPremium || undefined}
                onChange={(v) => setOfferPremium(v ?? 0)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOfferTarget(null)}>
              Cancel
            </Button>
            <Button onClick={saveOffer}>Save offer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
