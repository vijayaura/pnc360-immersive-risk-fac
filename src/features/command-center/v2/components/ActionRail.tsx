import React, { useState } from 'react';

import {
  Ban,
  Calculator,
  FileDown,
  MessageSquarePlus,
  Send,
  ShieldAlert,
  Stethoscope,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/shared/utils/lib-utils';

import { useRiskRoom } from '../RiskRoomContext';
import { rr } from '../risk-room-theme';
import { formatAED } from '../risk-room-data';

export function ActionRail() {
  const { property, addNotepadEntry, uwNotepad, insightStatuses, setNotepadOpen } = useRiskRoom();
  const [dialog, setDialog] = useState<'quote' | 'refer' | 'survey' | 'fac' | 'decline' | null>(null);
  const [rationale, setRationale] = useState('');

  const acceptedInsights = Object.entries(insightStatuses).filter(([, s]) => s === 'accepted').length;

  const handleConfirm = () => {
    if (!dialog) return;
    const labels = {
      quote: 'Indicative quote prepared',
      refer: 'Referred to senior UW',
      survey: 'Survey requested',
      fac: 'Facultative outreach initiated',
      decline: 'Declined',
    };
    const action = labels[dialog];
    addNotepadEntry('decision', rationale ? `${action}: ${rationale}` : action);
    setNotepadOpen(true);
    setDialog(null);
    setRationale('');
  };

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
              onClick={() => {
                setDialog(id);
                if (id === 'fac') {
                  setRationale(
                    `Facultative placement recommended for ${property.name}. ${acceptedInsights} accepted risk factors. Primary perils: ${property.primaryPerils.join(', ')}.`,
                  );
                }
              }}
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

      <Dialog open={dialog !== null} onOpenChange={(o) => !o && setDialog(null)}>
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
              onClick={() => setDialog(null)}
              className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted/50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
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
