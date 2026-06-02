import { useCallback, useRef, type SetStateAction } from 'react';
import { Plus, Shield, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { FormattedNumberInput } from '@/components/ui/FormattedNumberInput';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/shared/hooks/use-toast';
import type { TreatyAllocation } from '@/features/proposals/api/referrals';
import type { Reinsurer } from '@/features/reinsurers/api/reinsurers';

const fmtAED = (n: number, currency = 'AED') =>
  new Intl.NumberFormat('en-AE', { style: 'decimal', maximumFractionDigits: 0 }).format(n) +
  ' ' +
  currency;

/** Mutable row type for fac panel (used in arrange dialog + reinsurance handling save logic). */
export interface FacRow {
  id: string;
  reinsurerId: string;
  name: string;
  sharePercent: number;
  commissionPercent: number;
}

export type FacultativeArrangeDraft = {
  id: string;
  cededSumInsured: number;
  rows: FacRow[];
  isNew: boolean;
  /** Which affordance opened the dialog — `'new'` for Facultative New, `'need'` for Need Facultative. */
  flow?: 'need' | 'new';
};

interface FacLayerBreakdownSectionProps {
  allocation: TreatyAllocation;
  currency: string;
  initialRows: FacRow[];
  onRowsChange: (rows: FacRow[]) => void;
  reinsurers: Reinsurer[];
}

function FacultativeLayerBreakdownSection({
  allocation,
  currency,
  initialRows,
  onRowsChange,
  reinsurers,
}: FacLayerBreakdownSectionProps) {
  const rows = initialRows;

  const effectivePanel = rows.map((r) => {
    const risk = (allocation.cessionSumInsured * r.sharePercent) / 100;
    const sharedPremium = (allocation.cessionAmount * r.sharePercent) / 100;
    const commissionAmount = (sharedPremium * r.commissionPercent) / 100;
    const ratePer = risk > 0 ? sharedPremium / risk : 0;
    const rateAfterCommission = risk > 0 ? (sharedPremium - commissionAmount) / risk : 0;
    return { ...r, risk, sharedPremium, commissionAmount, ratePer, rateAfterCommission };
  });

  const totalShare = rows.reduce((s, r) => s + r.sharePercent, 0);
  const totalCommission = effectivePanel.reduce((s, r) => s + r.commissionAmount, 0);

  const updateRows = (updated: FacRow[]) => {
    onRowsChange(updated);
  };

  const updateRow = (id: string, patch: Partial<FacRow>) => {
    updateRows(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const addRow = () => {
    const newRow: FacRow = {
      id: `new-${Date.now()}`,
      reinsurerId: '',
      name: '',
      sharePercent: 0,
      commissionPercent: 0,
    };
    updateRows([...rows, newRow]);
  };

  const removeRow = (id: string) => {
    if (rows.length <= 1) return;
    updateRows(rows.filter((r) => r.id !== id));
  };

  const shareWarning = Math.abs(totalShare - 100) > 0.01 && totalShare > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{allocation.structureType}</CardTitle>
            <CardDescription>{allocation.treatyCode}</CardDescription>
          </div>
          <Badge variant="outline" className="text-xs bg-amber-50 border-amber-200 text-amber-700">
            Facultative
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="overflow-x-auto">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium">Facultative reinsurers</p>
            <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={addRow}>
              <Plus className="h-3.5 w-3.5" />
              Add reinsurer
            </Button>
          </div>

          {shareWarning && (
            <p className="text-xs text-amber-600 mb-2">
              Share total: {totalShare.toFixed(1)}% — must equal 100% before saving.
            </p>
          )}
          {!shareWarning && totalShare > 0 && (
            <p className="text-xs text-muted-foreground mb-2">Share total: {totalShare.toFixed(1)}%</p>
          )}

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground text-xs">
                <th className="text-left pb-2 font-medium">Reinsurer</th>
                <th className="text-right pb-2 font-medium">Risk</th>
                <th className="text-right pb-2 font-medium">Share %</th>
                <th className="text-right pb-2 font-medium">Shared Premium</th>
                <th className="text-right pb-2 font-medium">Comm. %</th>
                <th className="text-right pb-2 font-medium">Commission</th>
                <th className="text-right pb-2 font-medium">Rate %</th>
                <th className="text-right pb-2 font-medium">Rate After Comm.</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {effectivePanel.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-2 pr-2">
                    {reinsurers.length > 0 ? (
                      <Select
                        value={r.name || undefined}
                        onValueChange={(value) => {
                          const selected = reinsurers.find((x) => x.name === value);
                          updateRow(r.id, {
                            reinsurerId: selected?.id ?? '',
                            name: value,
                          });
                        }}
                      >
                        <SelectTrigger className="h-7 text-sm min-w-[160px]">
                          <SelectValue placeholder="Select reinsurer" />
                        </SelectTrigger>
                        <SelectContent>
                          {reinsurers.map((re) => (
                            <SelectItem key={re.id} value={re.name}>
                              {re.name}
                              {re.grade ? ` (${re.grade})` : ''}
                            </SelectItem>
                          ))}
                          {r.name && !reinsurers.some((re) => re.name === r.name) && (
                            <SelectItem value={r.name}>{r.name} (custom)</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        className="h-7 text-sm min-w-[130px]"
                        placeholder="Reinsurer name"
                        value={r.name}
                        onChange={(e) => updateRow(r.id, { name: e.target.value })}
                      />
                    )}
                  </td>
                  <td className="py-2 text-right tabular-nums pr-2">{fmtAED(r.risk, currency)}</td>
                  <td className="py-2 text-right pr-2">
                    <div className="flex items-center justify-end gap-1">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step={0.01}
                        className="w-20 h-7 text-sm text-right"
                        value={r.sharePercent}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val) && val >= 0 && val <= 100)
                            updateRow(r.id, { sharePercent: val });
                        }}
                      />
                    </div>
                  </td>
                  <td className="py-2 text-right tabular-nums pr-2">{fmtAED(r.sharedPremium, currency)}</td>
                  <td className="py-2 text-right pr-2">
                    <div className="flex items-center justify-end gap-1">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        className="w-20 h-7 text-sm text-right"
                        value={r.commissionPercent}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (!isNaN(val) && val >= 0 && val <= 100)
                            updateRow(r.id, { commissionPercent: val });
                        }}
                      />
                    </div>
                  </td>
                  <td className="py-2 text-right tabular-nums text-green-700 pr-2">
                    {fmtAED(r.commissionAmount, currency)}
                  </td>
                  <td className="py-2 text-right tabular-nums pr-2">{(r.ratePer * 100).toFixed(2)}</td>
                  <td className="py-2 text-right tabular-nums pr-2">
                    {(r.rateAfterCommission * 100).toFixed(2)}
                  </td>
                  <td className="py-2 pl-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      disabled={rows.length <= 1}
                      onClick={() => removeRow(r.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t font-semibold bg-muted/30">
                <td className="pt-2.5 pb-1">Total</td>
                <td className="pt-2.5 pb-1 text-right tabular-nums">
                  {fmtAED(allocation.cessionSumInsured, currency)}
                </td>
                <td className="pt-2.5 pb-1 text-right tabular-nums">
                  <span className={shareWarning ? 'text-amber-600' : ''}>{totalShare.toFixed(1)}%</span>
                </td>
                <td className="pt-2.5 pb-1 text-right tabular-nums">
                  {fmtAED(allocation.cessionAmount, currency)}
                </td>
                <td />
                <td className="pt-2.5 pb-1 text-right tabular-nums text-green-700">
                  {fmtAED(totalCommission, currency)}
                </td>
                <td />
                <td />
                <td />
              </tr>
            </tfoot>
          </table>
        </div>

        <p className="text-sm font-medium">Summary</p>
        <div className="rounded-lg border bg-muted/20 p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Commission on Cession</span>
            <span className="font-medium tabular-nums text-green-700">
              {fmtAED(totalCommission, currency)}
            </span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Net Retention (after commission)</span>
            <span className="tabular-nums">
              {fmtAED(allocation.retentionAmount + totalCommission, currency)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export type ArrangeFacultativeReinsuranceDialogProps = {
  draft: FacultativeArrangeDraft;
  updateDraft: (updater: SetStateAction<FacultativeArrangeDraft | null>) => void;
  totalSI: number;
  grossPremium: number;
  currency: string;
  retentionAvailable: number;
  reinsurers: Reinsurer[];
  onCommit: (layer: { id: string; cededSumInsured: number; rows: FacRow[] }, isNew: boolean) => void;
};

export function ArrangeFacultativeReinsuranceDialog({
  draft,
  updateDraft,
  totalSI,
  grossPremium,
  currency,
  retentionAvailable,
  reinsurers,
  onCommit,
}: ArrangeFacultativeReinsuranceDialogProps) {
  const { toast } = useToast();
  const draftRef = useRef(draft);
  draftRef.current = draft;

  const syncUpdateDraft = useCallback(
    (updater: SetStateAction<FacultativeArrangeDraft | null>) => {
      updateDraft((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        draftRef.current = next;
        return next;
      });
    },
    [updateDraft],
  );

  const cededPremium = totalSI > 0 ? grossPremium * (draft.cededSumInsured / totalSI) : 0;

  const facAlloc: TreatyAllocation = {
    treatyId: `user-fac-${draft.id}`,
    structureType: 'Facultative',
    treatyCode: 'FAC',
    treatyName: 'Facultative',
    allocatedSumInsured: draft.cededSumInsured,
    allocatedPremium: cededPremium,
    percentOfTotal: totalSI > 0 ? (draft.cededSumInsured / totalSI) * 100 : 0,
    retentionPercent: 0,
    cessionPercent: 100,
    retentionAmount: 0,
    cessionAmount: cededPremium,
    retentionSumInsured: 0,
    cessionSumInsured: draft.cededSumInsured,
    commissionPercent: 0,
    commissionAmount: 0,
    netRetentionAfterCommission: 0,
    technicalRate: 0,
    isFacultative: true,
    reinsurerBreakdown: [],
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) syncUpdateDraft(null); }}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Arrange Facultative Reinsurance
          </DialogTitle>
          <DialogDescription>
            Case-by-case reinsurer panel. Enter the ceded sum insured and the reinsurers taking a share. Premium
            auto-derives from SI.
          </DialogDescription>
        </DialogHeader>

        {retentionAvailable > 0 && (
          <div className="rounded-md border bg-muted/30 px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-medium">Retention SI Available for Facultative</span>
            <span className="text-sm font-bold tabular-nums">{fmtAED(Math.round(retentionAvailable), currency)}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Ceded SI</span>
            <FormattedNumberInput
              allowDecimals={false}
              allowEmpty
              className="w-48 h-9 text-right tabular-nums"
              value={draft.cededSumInsured || undefined}
              onChange={(v) => {
                const newVal = v ?? 0;
                syncUpdateDraft((prev) => (prev ? { ...prev, cededSumInsured: newVal } : prev));
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Ceded Premium (derived)</span>
            <span className="text-sm font-semibold tabular-nums">{fmtAED(Math.round(cededPremium), currency)}</span>
          </div>
        </div>

        {retentionAvailable > 0 && draft.cededSumInsured > retentionAvailable && (
          <p className="text-xs text-destructive">
            Ceded SI ({fmtAED(draft.cededSumInsured, currency)}) exceeds available retention (
            {fmtAED(Math.round(retentionAvailable), currency)}).
          </p>
        )}

        <FacultativeLayerBreakdownSection
          allocation={facAlloc}
          currency={currency}
          initialRows={draft.rows}
          onRowsChange={(rows) => {
            syncUpdateDraft((prev) => (prev ? { ...prev, rows } : prev));
          }}
          reinsurers={reinsurers}
        />

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => syncUpdateDraft(null)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              const latestDraft = draftRef.current;
              if (!latestDraft) return;

              if (!latestDraft.cededSumInsured || latestDraft.cededSumInsured <= 0) {
                toast({
                  title: 'Ceded SI required',
                  description: 'Please enter a Ceded Sum Insured greater than 0.',
                  variant: 'destructive',
                });
                return;
              }
              if (retentionAvailable > 0 && latestDraft.cededSumInsured > retentionAvailable) {
                toast({
                  title: 'Ceded SI exceeds available retention',
                  description: `Ceded SI (${fmtAED(latestDraft.cededSumInsured, currency)}) exceeds the available retention (${fmtAED(Math.round(retentionAvailable), currency)}).`,
                  variant: 'destructive',
                });
                return;
              }
              if (latestDraft.rows.some((r) => !r.name.trim())) {
                toast({
                  title: 'Reinsurer required',
                  description: 'Please select a reinsurer for every row in the panel.',
                  variant: 'destructive',
                });
                return;
              }
              if (latestDraft.rows.some((r) => !(r.sharePercent > 0))) {
                toast({
                  title: 'Share % required',
                  description: 'Every reinsurer must have a Share % greater than 0.',
                  variant: 'destructive',
                });
                return;
              }
              if (latestDraft.rows.some((r) => r.commissionPercent > 100)) {
                toast({
                  title: 'Invalid commission',
                  description: 'Commission % cannot exceed 100%.',
                  variant: 'destructive',
                });
                return;
              }
              const latestTotalShare = latestDraft.rows.reduce((s, r) => s + r.sharePercent, 0);
              const latestShareValid = Math.abs(latestTotalShare - 100) <= 0.01;
              if (!latestShareValid) {
                toast({
                  title: 'Invalid share allocation',
                  description: `Panel share total is ${latestTotalShare.toFixed(2)}%. It must equal 100%.`,
                  variant: 'destructive',
                });
                return;
              }
              if (latestDraft.rows.some((r) => r.commissionPercent > 40)) {
                toast({ title: 'High commission warning', description: 'One or more reinsurers have commission above 40%.' });
              }
              const nameSet = new Set<string>();
              if (
                latestDraft.rows.some((r) => {
                  if (r.name && nameSet.has(r.name)) return true;
                  if (r.name) nameSet.add(r.name);
                  return false;
                })
              ) {
                toast({
                  title: 'Duplicate reinsurer warning',
                  description: 'The same reinsurer appears more than once on this panel.',
                });
              }

              const { isNew, ...layerData } = latestDraft;
              onCommit(layerData, isNew);
              syncUpdateDraft(null);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Facultative
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
