import React, { useState } from 'react';

import {
  Ban,
  Calculator,
  FileDown,
  Loader2,
  MessageSquarePlus,
  Send,
  ShieldAlert,
  Stethoscope,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/shared/utils/lib-utils';

import {
  ReferralDecisions,
  ReferralPremiumLoadingTypes,
  ReferralRiskRatings,
  type Decision,
  type PremiumLoadingType,
  type RiskRating,
} from '@/features/quotes/api/quotes';

import { useRiskRoom } from '../RiskRoomContext';
import { rr } from '../risk-room-theme';
import { formatAED } from '../risk-room-data';

const DECISION_LABELS: Record<Decision, string> = {
  [ReferralDecisions.APPROVE_AS_IS]: 'Approve as Is',
  [ReferralDecisions.APPROVE_WITH_CONDITIONS]: 'Approve with Conditions',
  [ReferralDecisions.REQUEST_MORE_DOCUMENTS]: 'Request More Documents',
  [ReferralDecisions.APPLY_PREMIUM_LOADING]: 'Apply Premium Loading',
  [ReferralDecisions.APPLY_DEDUCTIBLE_CHANGE]: 'Apply Deductible Change',
  [ReferralDecisions.APPLY_COVERAGE_EXCLUSION]: 'Apply Coverage Exclusion',
  [ReferralDecisions.DECLINE_QUOTE]: 'Decline Quote',
};

const controlClass =
  'h-8 bg-white border-primary/40 shadow-sm text-foreground text-xs placeholder:text-muted-foreground';

type ActionDialog = 'quote' | 'refer' | 'survey' | 'fac' | 'decline';

export function ActionRail() {
  const { property, addNotepadEntry, uwNotepad, insightStatuses, setNotepadOpen } = useRiskRoom();

  const [dialog, setDialog] = useState<ActionDialog | null>(null);
  const [rationale, setRationale] = useState('');

  const [notes, setNotes] = useState('');
  const [riskRating, setRiskRating] = useState<RiskRating | ''>('');
  const [decision, setDecision] = useState<Decision | ''>('');
  const [premiumLoadingType, setPremiumLoadingType] = useState<PremiumLoadingType>(
    ReferralPremiumLoadingTypes.PERCENTAGE,
  );
  const [premiumLoading, setPremiumLoading] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const acceptedInsights = Object.entries(insightStatuses).filter(([, s]) => s === 'accepted').length;

  const exportBrief = () => {
    const lines = [
      `RISK BRIEF — ${property.name}`,
      `Generated ${new Date().toLocaleString()}`,
      '',
      `Address: ${property.address}`,
      `TSI: ${formatAED(property.sumInsured)} · Score: ${property.riskScore}`,
      '',
      '--- Identified risks (proposal) ---',
      ...property.renewalDeltas.filter((d) => d.source === 'proposal').map((d) => `• ${d.label}: ${d.value}`),
      '',
      '--- AI-identified risks ---',
      ...property.renewalDeltas.filter((d) => d.source === 'ai').map((d) => `• ${d.label}: ${d.value}`),
      '',
      '--- Accepted insights ---',
      ...property.enrichedInsights
        .filter((i) => insightStatuses[i.id] === 'accepted')
        .map((i) => `• [${i.severity}] ${i.text}`),
      '',
      '--- Observations ---',
      ...uwNotepad.filter((n) => n.kind === 'observation').map((n) => `• ${n.text}`),
      '',
      '--- Decisions ---',
      ...uwNotepad.filter((n) => n.kind === 'decision').map((n) => `• ${n.text}`),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `risk-brief-${property.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    addNotepadEntry('decision', 'Exported risk brief — committee-ready one-pager downloaded');
  };

  const closeDialog = () => setDialog(null);

  const openAction = (id: ActionDialog) => {
    setDialog(id);
    if (id === 'fac') {
      setRationale(
        `Facultative placement recommended for ${property.name}. ${acceptedInsights} accepted risk factors. Primary perils: ${property.primaryPerils.join(', ')}.`,
      );
    } else if (id !== 'quote') {
      setRationale('');
    }
  };

  const handleConfirmAction = () => {
    if (!dialog || dialog === 'quote') return;
    const labels = {
      refer: 'Referred to senior UW',
      survey: 'Survey requested',
      fac: 'Facultative outreach initiated',
      decline: 'Declined',
    };
    const action = labels[dialog];
    addNotepadEntry('decision', rationale ? `${action}: ${rationale}` : action);
    setNotepadOpen(true);
    closeDialog();
    setRationale('');
  };

  const handleQuoteSubmit = async () => {
    if (!decision) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 450));

    const parts = [
      'Indicative quote prepared',
      DECISION_LABELS[decision],
      riskRating ? `Risk rating: ${riskRating}` : null,
      decision === ReferralDecisions.APPLY_PREMIUM_LOADING && premiumLoading
        ? `Premium loading: ${premiumLoading}${premiumLoadingType === ReferralPremiumLoadingTypes.PERCENTAGE ? '%' : ' AED'}`
        : null,
      notes.trim() ? `Notes: ${notes.trim()}` : null,
    ].filter(Boolean);

    addNotepadEntry('decision', parts.join(' · '));
    setNotepadOpen(true);
    setSubmitting(false);
    closeDialog();
  };

  const actions = [
    { id: 'quote' as const, label: 'Quote', icon: Calculator, tone: 'bg-emerald-600 hover:bg-emerald-500' },
    { id: 'refer' as const, label: 'Refer', icon: ShieldAlert, tone: 'bg-amber-600 hover:bg-amber-500' },
    { id: 'survey' as const, label: 'Survey', icon: Stethoscope, tone: 'bg-sky-600 hover:bg-sky-500' },
    { id: 'fac' as const, label: 'Fac out', icon: Send, tone: 'bg-violet-600 hover:bg-violet-500' },
    { id: 'decline' as const, label: 'Decline', icon: Ban, tone: 'bg-red-900/90 hover:bg-red-800 ring-1 ring-red-700/50' },
  ];

  return (
    <>
      <div className={cn('px-3 py-3 md:px-4 md:py-4', rr.decisionRail)}>
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn('mr-2', rr.timelineLabel)}>Decision closure</span>
          {actions.map(({ id, label, icon: Icon, tone }) => (
            <button
              key={id}
              type="button"
              onClick={() => openAction(id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm transition-colors',
                tone,
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={exportBrief}
            className={cn(
              'ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-semibold transition-colors',
              rr.decisionSecondary,
            )}
          >
            <FileDown className="h-3.5 w-3.5" />
            Risk brief
          </button>
          <button
            type="button"
            onClick={() => setNotepadOpen(true)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-semibold transition-colors',
              rr.decisionSecondary,
            )}
          >
            <MessageSquarePlus className="h-3.5 w-3.5" />
            UW Log
          </button>
        </div>
      </div>

      <Dialog open={dialog === 'quote'} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-w-3xl border-border bg-card text-foreground">
          <DialogHeader>
            <DialogTitle className="text-primary">Underwriter Review</DialogTitle>
            <DialogDescription>Make your decision</DialogDescription>
          </DialogHeader>

          {decision === ReferralDecisions.APPLY_PREMIUM_LOADING && (
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-primary/15 bg-muted/30 px-3 py-2.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-primary">Modification details</span>
              <Select
                value={premiumLoadingType}
                onValueChange={(v) => setPremiumLoadingType(v as PremiumLoadingType)}
              >
                <SelectTrigger className={cn(controlClass, 'w-32 shrink-0')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ReferralPremiumLoadingTypes.PERCENTAGE}>Percentage (%)</SelectItem>
                  <SelectItem value={ReferralPremiumLoadingTypes.AMOUNT}>Amount (AED)</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder={
                  premiumLoadingType === ReferralPremiumLoadingTypes.PERCENTAGE ? 'Enter %' : 'Enter amount'
                }
                value={premiumLoading}
                onChange={(e) => setPremiumLoading(e.target.value)}
                className={cn(controlClass, 'w-32 shrink-0')}
              />
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-primary">Assessment notes</label>
              <Textarea
                placeholder="Enter your assessment notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="resize-none border-primary/40 bg-white text-sm focus-visible:ring-primary/40"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <label className="mb-1.5 block text-xs font-semibold text-foreground">Risk Rating</label>
                <Select value={riskRating} onValueChange={(v) => setRiskRating(v as RiskRating)}>
                  <SelectTrigger className={cn(controlClass, 'w-full')}>
                    <SelectValue placeholder="Risk Rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ReferralRiskRatings.LOW}>Low</SelectItem>
                    <SelectItem value={ReferralRiskRatings.MEDIUM}>Medium</SelectItem>
                    <SelectItem value={ReferralRiskRatings.HIGH}>High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <label className="mb-1.5 block text-xs font-semibold text-foreground">Select Decision</label>
                <Select value={decision} onValueChange={(v) => setDecision(v as Decision)}>
                  <SelectTrigger className={cn(controlClass, 'w-full')}>
                    <SelectValue placeholder="Select Decision" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ReferralDecisions.APPROVE_AS_IS}>Approve as Is</SelectItem>
                    <SelectItem value={ReferralDecisions.APPLY_PREMIUM_LOADING}>Apply Premium Loading</SelectItem>
                    <SelectItem value={ReferralDecisions.DECLINE_QUOTE}>Decline Quote</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              onClick={closeDialog}
              className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted/50"
            >
              Cancel
            </button>
            <Button
              type="button"
              className="h-8 px-5 text-xs font-semibold"
              onClick={handleQuoteSubmit}
              disabled={submitting || !decision}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                  Submitting…
                </>
              ) : (
                'Submit Decision'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog !== null && dialog !== 'quote'} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="border-border bg-card text-foreground">
          <DialogHeader>
            <DialogTitle>Confirm underwriting action</DialogTitle>
            <DialogDescription className="text-foreground">
              Rationale is saved to your decisions notepad for committee and reinsurance packs.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            placeholder="Underwriting rationale…"
            className="border-border bg-background text-foreground"
            rows={4}
          />
          <DialogFooter>
            <button
              type="button"
              onClick={closeDialog}
              className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted/50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmAction}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Confirm & save
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
