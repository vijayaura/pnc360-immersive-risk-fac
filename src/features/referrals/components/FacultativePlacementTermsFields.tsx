import { useState } from 'react';
import { Plus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormattedNumberInput } from '@/components/ui/FormattedNumberInput';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DEFAULT_FAC_DEDUCTIBLES,
  DEFAULT_FAC_PLACEMENT_CEWS,
  FAC_CEW_TYPES,
  type FacPlacementCewItem,
} from '@/features/referrals/utils/facultativePlacementDefaults';

const fmtAED = (n: number, currency = 'AED') =>
  new Intl.NumberFormat('en-AE', { style: 'decimal', maximumFractionDigits: 0 }).format(n) + ' ' + currency;

export type FacPlacementDeductibles = {
  allOtherPerils: string;
  naturalPerils: string;
};

export type FacPlacementTermsState = {
  ratePerMille: number;
  commissionPercent: number;
  premium: number;
  deductibles: FacPlacementDeductibles;
  cewItems: FacPlacementCewItem[];
  includedCewIds: Set<string>;
};

export function createDefaultFacPlacementTerms(
  sumInsured: number,
  grossPremium: number,
  cededSumInsured: number,
): FacPlacementTermsState {
  const premium =
    sumInsured > 0 && cededSumInsured > 0 ? Math.round(grossPremium * (cededSumInsured / sumInsured)) : 0;
  const ratePerMille =
    cededSumInsured > 0 && premium > 0
      ? Math.round((premium / cededSumInsured) * 1000 * 100) / 100
      : sumInsured > 0 && grossPremium > 0
        ? Math.round((grossPremium / sumInsured) * 1000 * 100) / 100
        : 0;

  return {
    ratePerMille,
    commissionPercent: 12.5,
    premium,
    deductibles: { ...DEFAULT_FAC_DEDUCTIBLES },
    cewItems: DEFAULT_FAC_PLACEMENT_CEWS.map((item) => ({ ...item })),
    includedCewIds: new Set(DEFAULT_FAC_PLACEMENT_CEWS.map((item) => item.id)),
  };
}

type FacultativePlacementTermsFieldsProps = {
  currency: string;
  sumInsured: number;
  grossPremium: number;
  cededSumInsured: number;
  onCededSumInsuredChange: (value: number) => void;
  terms: FacPlacementTermsState;
  onTermsChange: (updater: (prev: FacPlacementTermsState) => FacPlacementTermsState) => void;
  retentionAvailable?: number;
  className?: string;
};

export function FacultativePlacementTermsFields({
  currency,
  sumInsured,
  grossPremium,
  cededSumInsured,
  onCededSumInsuredChange,
  terms,
  onTermsChange,
  retentionAvailable = 0,
  className,
}: FacultativePlacementTermsFieldsProps) {
  const [addCewOpen, setAddCewOpen] = useState(false);
  const [newCewType, setNewCewType] = useState<string>(FAC_CEW_TYPES[0]);
  const [newCewName, setNewCewName] = useState('');
  const [newCewDetail, setNewCewDetail] = useState('');

  const resetAddCewForm = () => {
    setNewCewType(FAC_CEW_TYPES[0]);
    setNewCewName('');
    setNewCewDetail('');
  };

  const handleAddCew = () => {
    const name = newCewName.trim();
    const detail = newCewDetail.trim();
    if (!name) return;
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? `cew-custom-${crypto.randomUUID()}`
        : `cew-custom-${Date.now()}`;
    const item: FacPlacementCewItem = { id, type: newCewType, name, detail };
    onTermsChange((prev) => ({
      ...prev,
      cewItems: [...prev.cewItems, item],
      includedCewIds: new Set(prev.includedCewIds).add(id),
    }));
    setAddCewOpen(false);
    resetAddCewForm();
  };

  const syncPremiumFromCession = (ceded: number, rate: number) => {
    if (ceded <= 0) return 0;
    if (rate > 0) return Math.round((ceded * rate) / 1000);
    if (sumInsured > 0 && grossPremium > 0) return Math.round(grossPremium * (ceded / sumInsured));
    return 0;
  };

  return (
    <div className={cn('space-y-4 rounded-lg border bg-muted/20 p-4', className)}>
      <div className="flex flex-nowrap items-end gap-4 overflow-x-auto pb-0.5">
        <div className="flex w-[min(100%,14rem)] shrink-0 items-center gap-2">
          <Label htmlFor="fac-new-ceded-si" className="shrink-0 text-sm font-medium whitespace-nowrap">
            Ceded SI
          </Label>
          <FormattedNumberInput
            id="fac-new-ceded-si"
            allowDecimals={false}
            allowEmpty
            className="h-9 min-w-0 flex-1 text-right tabular-nums"
            value={cededSumInsured || undefined}
            onChange={(v) => {
              const ceded = v ?? 0;
              onCededSumInsuredChange(ceded);
              onTermsChange((prev) => ({
                ...prev,
                premium: syncPremiumFromCession(ceded, prev.ratePerMille),
              }));
            }}
          />
        </div>
        <div className="flex w-[11rem] shrink-0 items-center gap-2">
          <Label htmlFor="fac-new-rate" className="shrink-0 text-sm font-medium whitespace-nowrap">
            Rate (‰)
          </Label>
          <FormattedNumberInput
            id="fac-new-rate"
            allowDecimals
            allowEmpty
            className="h-9 min-w-0 flex-1 text-right tabular-nums"
            value={terms.ratePerMille || undefined}
            onChange={(v) => {
              const rate = v ?? 0;
              onTermsChange((prev) => ({
                ...prev,
                ratePerMille: rate,
                premium: syncPremiumFromCession(cededSumInsured, rate),
              }));
            }}
          />
        </div>
        <div className="flex w-[12rem] shrink-0 items-center gap-2">
          <Label htmlFor="fac-new-commission" className="shrink-0 text-sm font-medium whitespace-nowrap">
            Commission %
          </Label>
          <FormattedNumberInput
            id="fac-new-commission"
            allowDecimals
            allowEmpty
            className="h-9 min-w-0 flex-1 text-right tabular-nums"
            value={terms.commissionPercent || undefined}
            onChange={(v) =>
              onTermsChange((prev) => ({
                ...prev,
                commissionPercent: v ?? 0,
              }))
            }
          />
        </div>
        <div className="flex w-[11rem] shrink-0 items-center gap-2">
          <Label htmlFor="fac-new-premium" className="shrink-0 text-sm font-medium whitespace-nowrap">
            Premium
          </Label>
          <FormattedNumberInput
            id="fac-new-premium"
            allowDecimals={false}
            allowEmpty
            className="h-9 min-w-0 flex-1 text-right tabular-nums"
            value={terms.premium || undefined}
            onChange={(v) => {
              const premium = v ?? 0;
              onTermsChange((prev) => ({
                ...prev,
                premium,
                ratePerMille:
                  cededSumInsured > 0 && premium > 0
                    ? Math.round((premium / cededSumInsured) * 1000 * 100) / 100
                    : prev.ratePerMille,
              }));
            }}
          />
        </div>
      </div>

      {retentionAvailable > 0 && cededSumInsured > retentionAvailable && (
        <p className="text-xs text-destructive">
          Ceded SI ({fmtAED(Math.round(cededSumInsured), currency)}) exceeds available retention (
          {fmtAED(Math.round(retentionAvailable), currency)}).
        </p>
      )}

      <div className="space-y-2">
        <p className="text-sm font-semibold text-foreground">Deductibles</p>
        <div className="space-y-2">
          <div>
            <Label htmlFor="fac-ded-all" className="text-xs text-muted-foreground">
              All other perils
            </Label>
            <Input
              id="fac-ded-all"
              className="mt-1"
              value={terms.deductibles.allOtherPerils}
              onChange={(e) =>
                onTermsChange((prev) => ({
                  ...prev,
                  deductibles: { ...prev.deductibles, allOtherPerils: e.target.value },
                }))
              }
            />
          </div>
          <div>
            <Label htmlFor="fac-ded-nat" className="text-xs text-muted-foreground">
              Natural perils
            </Label>
            <Input
              id="fac-ded-nat"
              className="mt-1"
              value={terms.deductibles.naturalPerils}
              onChange={(e) =>
                onTermsChange((prev) => ({
                  ...prev,
                  deductibles: { ...prev.deductibles, naturalPerils: e.target.value },
                }))
              }
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Clauses / CEWs</p>
            <p className="text-xs text-muted-foreground">
              Uncheck any clause, extension, or warranty that should not apply to this facultative placement.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 gap-1.5"
            onClick={() => {
              resetAddCewForm();
              setAddCewOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Add CEW
          </Button>
        </div>
        <div className="divide-y rounded-lg border bg-card shadow-sm">
          {terms.cewItems.map((item) => (
            <label
              key={item.id}
              htmlFor={`fac-new-cew-${item.id}`}
              className="flex cursor-pointer gap-3 px-4 py-3 hover:bg-muted/40"
            >
              <Checkbox
                id={`fac-new-cew-${item.id}`}
                checked={terms.includedCewIds.has(item.id)}
                onCheckedChange={(checked) =>
                  onTermsChange((prev) => {
                    const next = new Set(prev.includedCewIds);
                    if (checked === true) next.add(item.id);
                    else next.delete(item.id);
                    return { ...prev, includedCewIds: next };
                  })
                }
                className="mt-1"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{item.name}</span>
                  <Badge variant="outline" className="h-fit shrink-0">
                    {item.type}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
              </div>
            </label>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {terms.includedCewIds.size} of {terms.cewItems.length} selected for placement
        </p>
      </div>

      <Dialog
        open={addCewOpen}
        onOpenChange={(open) => {
          setAddCewOpen(open);
          if (!open) resetAddCewForm();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add CEW</DialogTitle>
            <DialogDescription>
              Add a clause, extension, or warranty to this facultative placement. It will be included by default.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="add-fac-cew-name">Title</Label>
              <Input
                id="add-fac-cew-name"
                value={newCewName}
                onChange={(e) => setNewCewName(e.target.value)}
                placeholder="e.g. 72 Hours Clause"
              />
            </div>
            <div>
              <Label htmlFor="add-fac-cew-type">Type</Label>
              <Select value={newCewType} onValueChange={setNewCewType}>
                <SelectTrigger id="add-fac-cew-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FAC_CEW_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="add-fac-cew-detail">Detail</Label>
              <Textarea
                id="add-fac-cew-detail"
                value={newCewDetail}
                onChange={(e) => setNewCewDetail(e.target.value)}
                rows={3}
                placeholder="Wording or underwriting note…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddCewOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleAddCew} disabled={!newCewName.trim()}>
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
