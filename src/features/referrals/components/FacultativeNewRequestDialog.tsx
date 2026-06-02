import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Building2,
  CircleCheck,
  Download,
  Loader2,
  Mail,
  MessageSquareReply,
  Percent,
  Send,
  Shield,
  TrendingUp,
  Users,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { FormattedNumberInput } from '@/components/ui/FormattedNumberInput';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { listReinsuranceBrokers } from '@/features/reinsurance-brokers/api/reinsurance-brokers';
import { listReinsurers } from '@/features/reinsurers/api/reinsurers';
import { getReferralDetail, downloadReferralPdf } from '@/features/proposals/api/referrals';
import { useToast } from '@/shared/hooks/use-toast';
import { buildFacultativeDraftPlainText } from '@/features/referrals/components/FacultativeDraftMailPreview';
import { buildFacultativeReinsuranceSlipDocxBlob } from '@/features/referrals/utils/facultativeReinsuranceSlipDocx';
import {
  buildBrokerInsights,
  buildBrokerOverlapWarnings,
  buildReinsurerInsights,
  getBrokerMarketTags,
  type OutreachPartyInsights,
} from '@/features/referrals/utils/facultativeOutreachInsights';

export type PartyKind = 'reinsurer' | 'reinsurance_broker' | 'insurer';

export interface FacultativeNewParty {
  kind: PartyKind;
  id: string;
  name: string;
  email?: string;
}

interface OutreachRecipientRow extends FacultativeNewParty {
  insights: OutreachPartyInsights;
}

function partyKey(p: Pick<FacultativeNewParty, 'kind' | 'id'>) {
  return `${p.kind}:${p.id}`;
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

const fmtAED = (n: number, currency = 'AED') =>
  new Intl.NumberFormat('en-AE', { style: 'decimal', maximumFractionDigits: 0 }).format(n) +
  ' ' +
  currency;

function ConversionMetricsRow({ insights }: { insights: OutreachPartyInsights }) {
  const { sent, responses, placements } = insights.conversions;
  const responseRate = sent > 0 ? Math.round((responses / sent) * 100) : 0;
  const placementRate = sent > 0 ? Math.round((placements / sent) * 100) : 0;

  const metrics = [
    { icon: Send, label: 'Sent', value: sent, tone: 'text-blue-600 bg-blue-50' },
    { icon: MessageSquareReply, label: 'Responses', value: responses, tone: 'text-violet-600 bg-violet-50' },
    {
      icon: CircleCheck,
      label: 'Placements',
      value: placements,
      tone: 'text-green-700 bg-green-50',
      valueClass: 'text-green-700',
    },
    { icon: TrendingUp, label: 'Response rate', value: `${responseRate}%`, tone: 'text-amber-600 bg-amber-50' },
    { icon: Percent, label: 'Placement rate', value: `${placementRate}%`, tone: 'text-emerald-600 bg-emerald-50' },
  ] as const;

  return (
    <div className="min-w-0 flex-1 rounded-md border bg-muted/20 px-0.5 py-1">
      <div className="flex items-center divide-x divide-border/70">
        {metrics.map(({ icon: Icon, label, value, tone, valueClass }) => (
          <div
            key={label}
            className="flex min-w-0 flex-1 items-center gap-1.5 px-2 py-0.5 first:pl-1.5 last:pr-1.5"
          >
            <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded ${tone}`}>
              <Icon className="h-3 w-3" />
            </div>
            <div className="min-w-0 leading-none">
              <p className="text-[9px] font-medium text-muted-foreground truncate">{label}</p>
              <p className={`text-xs font-semibold tabular-nums ${valueClass ?? 'text-foreground'}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export interface FacultativeNewRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referralId: string;
  quoteId?: string;
  productName: string;
  coverTitle?: string;
  sumInsured: number;
  grossPremium: number;
  currency: string;
  /** Retention SI available for facultative cession (from reinsurance handling context). */
  retentionAvailable?: number;
  onOutreachSent?: (parties: FacultativeNewParty[]) => void;
}

export function FacultativeNewRequestDialog({
  open,
  onOpenChange,
  referralId,
  quoteId,
  productName,
  coverTitle,
  sumInsured,
  grossPremium,
  currency,
  retentionAvailable = 0,
  onOutreachSent,
}: FacultativeNewRequestDialogProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [sendMap, setSendMap] = useState<Record<string, boolean>>({});
  const [attachReinsuranceSlip, setAttachReinsuranceSlip] = useState(true);
  const [attachQuote, setAttachQuote] = useState(true);
  const [attachUwDocs, setAttachUwDocs] = useState(true);
  const [cededSumInsured, setCededSumInsured] = useState(0);
  const [attachmentDownloading, setAttachmentDownloading] = useState<string | null>(null);
  const [draftEmailBody, setDraftEmailBody] = useState('');
  const draftDirtyRef = useRef(false);
  const sendMapInitRef = useRef(false);

  const cededPremiumDerived = useMemo(
    () => (sumInsured > 0 ? grossPremium * (cededSumInsured / sumInsured) : 0),
    [sumInsured, grossPremium, cededSumInsured],
  );

  const referralQ = useQuery({
    queryKey: ['referral-detail', referralId],
    queryFn: () => getReferralDetail(referralId!),
    enabled: open && !!referralId,
    staleTime: 60_000,
  });

  const reinsurersQ = useQuery({
    queryKey: ['facultative-new-reinsurers'],
    queryFn: () => listReinsurers({ limit: 200, status: 'ACTIVE' }),
    enabled: open,
    staleTime: 60_000,
  });

  const brokersQ = useQuery({
    queryKey: ['facultative-new-reinsurance-brokers'],
    queryFn: () => listReinsuranceBrokers({ limit: 200, status: 'active' }),
    enabled: open,
    staleTime: 60_000,
  });

  const loadingLists = open && (reinsurersQ.isLoading || brokersQ.isLoading);

  const brokerOverlapWarnings = useMemo(() => {
    const brokers = (brokersQ.data?.data ?? []).map((x) => ({
      id: x.id,
      name: x.name,
      marketTags: getBrokerMarketTags(x),
      selected: !!sendMap[`reinsurance_broker:${x.id}`],
    }));
    return buildBrokerOverlapWarnings(brokers);
  }, [brokersQ.data, sendMap]);

  const reinsurerRows: OutreachRecipientRow[] = useMemo(
    () =>
      (reinsurersQ.data?.data ?? []).map((x) => ({
        kind: 'reinsurer' as const,
        id: x.id,
        name: x.name,
        email: x.adminEmail || undefined,
        insights: buildReinsurerInsights(x),
      })),
    [reinsurersQ.data],
  );

  const brokerRows: OutreachRecipientRow[] = useMemo(
    () =>
      (brokersQ.data?.data ?? []).map((x) => ({
        kind: 'reinsurance_broker' as const,
        id: x.id,
        name: x.name,
        email: x.adminEmail || x.email || undefined,
        insights: buildBrokerInsights(x),
      })),
    [brokersQ.data],
  );

  const parties: FacultativeNewParty[] = useMemo(
    () => [...reinsurerRows, ...brokerRows],
    [reinsurerRows, brokerRows],
  );

  const canonicalDraft = useMemo(
    () =>
      buildFacultativeDraftPlainText({
        referral: referralQ.data,
        referralLoading: referralQ.isLoading,
        productName,
        coverTitle,
        sumInsured,
        grossPremium,
        currency,
        referralId,
        quoteId,
        cededSumInsured,
        cededPremium: cededPremiumDerived,
      }),
    [
      referralQ.data,
      referralQ.isLoading,
      productName,
      coverTitle,
      sumInsured,
      grossPremium,
      currency,
      referralId,
      quoteId,
      cededSumInsured,
      cededPremiumDerived,
    ],
  );

  useEffect(() => {
    if (step === 1) draftDirtyRef.current = false;
  }, [step]);

  useEffect(() => {
    if (step !== 2 || draftDirtyRef.current) return;
    setDraftEmailBody(canonicalDraft);
  }, [step, canonicalDraft]);

  useEffect(() => {
    if (!open) {
      setStep(1);
      setSendMap({});
      setCededSumInsured(0);
      setDraftEmailBody('');
      draftDirtyRef.current = false;
      sendMapInitRef.current = false;
      return;
    }
    if (loadingLists || sendMapInitRef.current || parties.length === 0) return;

    const init: Record<string, boolean> = {};
    parties.forEach((p) => {
      init[partyKey(p)] = true;
    });
    setSendMap(init);
    sendMapInitRef.current = true;
  }, [open, loadingLists, parties]);

  const setSend = useCallback((key: string, value: boolean) => {
    setSendMap((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setAllInGroup = useCallback((kind: PartyKind, value: boolean) => {
    setSendMap((prev) => {
      const next = { ...prev };
      parties.filter((p) => p.kind === kind).forEach((p) => {
        next[partyKey(p)] = value;
      });
      return next;
    });
  }, [parties]);

  const selectedParties = useMemo(
    () => parties.filter((p) => sendMap[partyKey(p)]),
    [parties, sendMap],
  );

  const triggerBlobDownload = useCallback((blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }, []);

  const handleDownloadReinsuranceSlip = useCallback(async () => {
    setAttachmentDownloading('slip');
    try {
      const blob = await buildFacultativeReinsuranceSlipDocxBlob({
        referral: referralQ.data,
        referralId,
        productName,
        coverTitle,
        sumInsured,
        cededSumInsured,
        grossPremium,
        currency,
        selectedParties,
      });
      const ref = (referralQ.data?.referralId ?? referralId).replace(/[^a-zA-Z0-9_-]/g, '_');
      triggerBlobDownload(blob, `Facultative_Reinsurance_Slip_${ref}.docx`);
      toast({
        title: 'Download started',
        description: 'Facultative reinsurance slip (.docx) with current referral and outreach data.',
      });
    } catch {
      toast({
        title: 'Download failed',
        description: 'Could not generate the Word document.',
        variant: 'destructive',
      });
    } finally {
      setAttachmentDownloading(null);
    }
  }, [
    referralQ.data,
    referralId,
    productName,
    coverTitle,
    sumInsured,
    cededSumInsured,
    grossPremium,
    currency,
    selectedParties,
    triggerBlobDownload,
    toast,
  ]);

  const handleDownloadReferralPdf = useCallback(
    async (kind: 'quote' | 'uw') => {
      setAttachmentDownloading(kind);
      try {
        const id = referralQ.data?.id ?? referralId;
        const blob = await downloadReferralPdf(id);
        const safeRef = (referralQ.data?.referralId ?? referralId).replace(/[^a-zA-Z0-9_-]/g, '_');
        const name = kind === 'quote' ? `Quote_Proposal_${safeRef}.pdf` : `Underwriting_${safeRef}.pdf`;
        triggerBlobDownload(blob, name);
        toast({
          title: 'Download started',
          description: kind === 'quote' ? 'Quote / proposal PDF.' : 'Underwriting documents PDF.',
        });
      } catch {
        toast({
          title: 'Download failed',
          description: 'Could not fetch the document.',
          variant: 'destructive',
        });
      } finally {
        setAttachmentDownloading(null);
      }
    },
    [referralQ.data?.id, referralQ.data?.referralId, referralId, triggerBlobDownload, toast],
  );

  const handleContinue = () => {
    if (sumInsured > 0 && cededSumInsured <= 0) {
      toast({
        title: 'Ceded SI required',
        description: 'Enter a Ceded Sum Insured greater than 0 before continuing.',
        variant: 'destructive',
      });
      return;
    }
    if (retentionAvailable > 0 && cededSumInsured > retentionAvailable) {
      toast({
        title: 'Ceded SI exceeds available retention',
        description: `Ceded SI (${fmtAED(Math.round(cededSumInsured), currency)}) exceeds the available retention (${fmtAED(Math.round(retentionAvailable), currency)}).`,
        variant: 'destructive',
      });
      return;
    }
    if (selectedParties.length === 0) {
      toast({
        title: 'Select recipients',
        description: 'Turn on “Send request” for at least one party to continue.',
        variant: 'destructive',
      });
      return;
    }
    setStep(2);
  };

  const handleSendToAll = () => {
    if (sumInsured > 0 && cededSumInsured <= 0) {
      toast({
        title: 'Ceded SI required',
        description: 'Enter a Ceded Sum Insured greater than 0 before sending.',
        variant: 'destructive',
      });
      return;
    }
    if (retentionAvailable > 0 && cededSumInsured > retentionAvailable) {
      toast({
        title: 'Ceded SI exceeds available retention',
        description: `Ceded SI (${fmtAED(Math.round(cededSumInsured), currency)}) exceeds the available retention (${fmtAED(Math.round(retentionAvailable), currency)}).`,
        variant: 'destructive',
      });
      return;
    }
    if (selectedParties.length === 0) {
      toast({
        title: 'No recipients',
        description: 'Include at least one party with “Send request” on to send.',
        variant: 'destructive',
      });
      return;
    }
    onOutreachSent?.(selectedParties);
    toast({
      title: 'Requests prepared',
      description: `${selectedParties.length} draft message(s) queued. Attachments: ${[
        attachReinsuranceSlip && 'reinsurance request slip',
        attachQuote && 'quote / proposal',
        attachUwDocs && 'underwriting documents',
      ]
        .filter(Boolean)
        .join(', ')}.`,
    });
    onOpenChange(false);
  };

  const renderGroup = (
    kind: PartyKind,
    title: string,
    icon: ReactNode,
    rows: OutreachRecipientRow[],
  ) => {
    if (rows.length === 0) {
      return (
        <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
          No {title.toLowerCase()} found for your account.
        </div>
      );
    }
    const included = rows.filter((p) => sendMap[partyKey(p)]).length;
    return (
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b bg-muted/40 px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              {icon}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{title}</p>
              <p className="text-xs text-muted-foreground">
                {included} of {rows.length} marked to receive a request
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => setAllInGroup(kind, true)}>
              Include all
            </Button>
            <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setAllInGroup(kind, false)}>
              Exclude all
            </Button>
          </div>
        </div>
        <ScrollArea className="max-h-[360px]">
          <ul className="divide-y">
            {rows.map((p) => {
              const key = partyKey(p);
              const { insights } = p;
              const isSelected = !!sendMap[key];
              const overlapWarning =
                p.kind === 'reinsurance_broker' ? brokerOverlapWarnings[p.id] : undefined;
              return (
                <li key={key} className="px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-40 shrink-0 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.email || 'No email on file'}</p>
                    </div>
                    <ConversionMetricsRow insights={insights} />
                    <div className="flex shrink-0 items-center gap-2 pl-1">
                      <Label
                        htmlFor={`send-${key}`}
                        className="text-xs text-muted-foreground cursor-pointer whitespace-nowrap"
                      >
                        Send request
                      </Label>
                      <Switch
                        id={`send-${key}`}
                        checked={isSelected}
                        onCheckedChange={(v) => setSend(key, v)}
                      />
                    </div>
                  </div>
                  {overlapWarning && isSelected && (
                    <p className="mt-2 text-xs text-amber-700 flex items-start gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      {overlapWarning}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 shrink-0" />
            Facultative New — outreach
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? 'Choose which reinsurers and reinsurance brokers should receive a facultative assistance request.'
              : 'Review the draft message, attachment list, and send to all selected recipients.'}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4">
          {retentionAvailable > 0 && (
            <div className="rounded-md border border-pink-200/80 bg-pink-50/95 dark:bg-pink-950/30 dark:border-pink-900/50 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm font-medium text-foreground">Retention SI Available for Facultative</span>
              <span className="text-sm font-bold tabular-nums text-foreground">
                {fmtAED(Math.round(retentionAvailable), currency)}
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="fac-new-ceded-si" className="text-sm font-medium whitespace-nowrap">
                Ceded SI
              </Label>
              <FormattedNumberInput
                id="fac-new-ceded-si"
                allowDecimals={false}
                allowEmpty
                className="w-48 h-9 text-right tabular-nums"
                value={cededSumInsured || undefined}
                onChange={(v) => setCededSumInsured(v ?? 0)}
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm text-muted-foreground">Ceded Premium (derived)</span>
              <span className="text-sm font-semibold tabular-nums">
                {fmtAED(Math.round(cededPremiumDerived), currency)}
              </span>
            </div>
          </div>

          {retentionAvailable > 0 && cededSumInsured > retentionAvailable && (
            <p className="text-xs text-destructive">
              Ceded SI ({fmtAED(Math.round(cededSumInsured), currency)}) exceeds available retention (
              {fmtAED(Math.round(retentionAvailable), currency)}).
            </p>
          )}

          {step === 1 && (
            <>
              {loadingLists ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Loading directories…</p>
              ) : (
                <>
                  {renderGroup('reinsurer', 'Reinsurers', <Shield className="h-4 w-4" />, reinsurerRows)}
                  {renderGroup('reinsurance_broker', 'Reinsurance brokers', <Users className="h-4 w-4" />, brokerRows)}
                </>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleContinue} disabled={loadingLists || parties.length === 0}>
                  Continue to draft
                </Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Mail className="h-4 w-4" />
                  Draft email
                </div>
                <div className="text-xs space-y-1 text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">Subject:</span> Facultative support request —{' '}
                    {productName}
                    {coverTitle ? ` — ${coverTitle}` : ''}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fac-draft-body" className="text-xs font-medium text-muted-foreground">
                    Message body
                  </Label>
                  <Textarea
                    id="fac-draft-body"
                    autoResize={false}
                    value={draftEmailBody}
                    onChange={(e) => {
                      draftDirtyRef.current = true;
                      setDraftEmailBody(e.target.value);
                    }}
                    spellCheck
                    className="min-h-[240px] max-h-[min(50vh,420px)] font-sans text-sm leading-relaxed text-foreground border-black/20 bg-white"
                    placeholder="Draft message…"
                  />
                  <p className="text-xs text-muted-foreground">
                    {referralQ.isLoading
                      ? 'Referral details are still loading — the text will fill in automatically unless you edit it.'
                      : 'Edit freely. If you go back to recipient selection and continue again, the template refreshes unless you have changed the message.'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">Recipients</p>
                <div className="rounded-md border overflow-hidden">
                  <Table className="table-fixed w-full">
                    <colgroup>
                      <col className="w-[22%]" />
                      <col className="w-[40%]" />
                      <col className="w-[38%]" />
                    </colgroup>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-xs font-semibold">Category</TableHead>
                        <TableHead className="text-xs font-semibold">Organization</TableHead>
                        <TableHead className="text-xs font-semibold">Contact</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedParties.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-sm text-muted-foreground text-center py-6">
                            No recipients selected. Go back and include at least one party.
                          </TableCell>
                        </TableRow>
                      ) : (
                        selectedParties.map((p) => {
                          const key = partyKey(p);
                          return (
                            <TableRow key={key}>
                              <TableCell className="text-xs font-medium align-top">{kindLabel(p.kind)}</TableCell>
                              <TableCell className="text-sm align-top truncate max-w-0" title={p.name}>
                                {p.name}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground align-top break-all">
                                {p.email || '—'}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="rounded-lg border bg-card p-4 space-y-4">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Attachments
                </p>
                <div className="flex flex-wrap items-start gap-3 rounded-md border p-3">
                  <Checkbox
                    id="att-slip"
                    checked={attachReinsuranceSlip}
                    onCheckedChange={(v) => setAttachReinsuranceSlip(!!v)}
                    className="mt-1"
                  />
                  <div className="min-w-0 flex-1">
                    <Label htmlFor="att-slip" className="text-sm font-medium leading-none cursor-pointer">
                      Reinsurance Request Slip
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Word slip with insured, class, period, sums, deductibles, clauses, exclusions, and lead / share from
                      this outreach.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 gap-1.5"
                    disabled={attachmentDownloading !== null}
                    onClick={handleDownloadReinsuranceSlip}
                  >
                    {attachmentDownloading === 'slip' ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    Download
                  </Button>
                </div>
                <div className="flex flex-wrap items-start gap-3 rounded-md border p-3">
                  <Checkbox
                    id="att-quote"
                    checked={attachQuote}
                    onCheckedChange={(v) => setAttachQuote(!!v)}
                    className="mt-1"
                  />
                  <div className="min-w-0 flex-1">
                    <Label htmlFor="att-quote" className="text-sm font-medium leading-none cursor-pointer">
                      Quote / proposal form
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Latest priced quote or proposal document for this referral.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 gap-1.5"
                    disabled={attachmentDownloading !== null}
                    onClick={() => void handleDownloadReferralPdf('quote')}
                  >
                    {attachmentDownloading === 'quote' ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    Download
                  </Button>
                </div>
                <div className="flex flex-wrap items-start gap-3 rounded-md border p-3">
                  <Checkbox id="att-uw" checked={attachUwDocs} onCheckedChange={(v) => setAttachUwDocs(!!v)} className="mt-1" />
                  <div className="min-w-0 flex-1">
                    <Label htmlFor="att-uw" className="text-sm font-medium leading-none cursor-pointer">
                      Underwriting documents
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Schedules, risk details, loss info, and other underwriting files on file for this case.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 gap-1.5"
                    disabled={attachmentDownloading !== null}
                    onClick={() => void handleDownloadReferralPdf('uw')}
                  >
                    {attachmentDownloading === 'uw' ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    Download
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap justify-between gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button type="button" className="gap-2" onClick={handleSendToAll} disabled={selectedParties.length === 0}>
                  <Send className="h-4 w-4" />
                  Send to all
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
