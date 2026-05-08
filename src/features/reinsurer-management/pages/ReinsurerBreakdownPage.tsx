import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Shield,
  Layers,
  FileText,
  Save,
  Loader2,
  Plus,
  Trash2,
  Check,
  ChevronsUpDown,
  Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { FormattedNumberInput } from '@/components/ui/FormattedNumberInput';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { listReinsurers, listReinsurerGrades, type Reinsurer } from '@/features/reinsurers/api/reinsurers';
import { listReinsuranceBrokers, type ReinsuranceBroker } from '@/features/reinsurance-brokers/api/reinsurance-brokers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/shared/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn, formatCurrency } from '@/shared/utils/lib-utils';
import type { TreatyAllocation, TreatyReinsurerAllocation } from '@/features/proposals/api/referrals';
import {
  getReinsuranceCoverBreakdown,
  saveReinsuranceBreakdown,
  type ReinsuranceCoverBreakdownDto,
  type HandlingLayer,
} from '../api/reinsurerManagement';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LayerOverride {
  overridePremium: number;
  isManualOverride: boolean;
}

interface ManualReinsurerRow {
  reinsurerId: string;
  name: string;
  sharePercent: number;
  sharedPremium: number;
  commissionPercent: number;
  brokerId?: string;
  brokerName?: string;
}

interface FacultativeReinsurerRow {
  reinsurerId?: string;
  name: string;
  rating?: string;
  brokerId?: string;
  brokerName?: string;
  sharePercent: number;
  risk: number;
  premium: number;
  commissionPercent: number;
}

interface FacultativeCard {
  id: string; // local-only key
  cededSumInsured: number;
  overridePremium: number;
  reinsurers: FacultativeReinsurerRow[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtAED = (n: number, currency = 'AED') => {
  // Normalize negative zero / sub-rounding residues so we never render "-0"
  const safe = !Number.isFinite(n) || Math.abs(n) < 0.5 ? 0 : n;
  return (
    new Intl.NumberFormat('en-AE', { style: 'decimal', maximumFractionDigits: 0 }).format(safe) +
    ' ' +
    currency
  );
};

const allocKey = (a: TreatyAllocation, index: number) =>
  `${a.treatyId}_${index}`;

// ─── Searchable Reinsurer Combobox ────────────────────────────────────────────

function ReinsurerCombobox({
  value,
  onSelect,
  reinsurers,
  loading,
  disabled,
  disabledIds,
  className,
}: {
  value?: string;
  onSelect: (reinsurer: Reinsurer) => void;
  reinsurers: Reinsurer[];
  loading?: boolean;
  disabled?: boolean;
  disabledIds?: Set<string>;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = reinsurers.find((x) => x.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn('justify-between font-normal', className)}
        >
          <span className="truncate">
            {loading
              ? 'Loading reinsurers…'
              : selected
                ? selected.name
                : 'Select reinsurer'}
          </span>
          <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
        <Command>
          <CommandInput placeholder="Search reinsurer..." />
          <CommandList>
            <CommandEmpty>No reinsurer found.</CommandEmpty>
            <CommandGroup>
              {reinsurers.filter((r) => !!r.grade).map((x) => {
                const isDisabled = disabledIds?.has(x.id) ?? false;
                return (
                  <CommandItem
                    key={x.id}
                    value={x.name}
                    disabled={isDisabled}
                    onSelect={() => {
                      onSelect(x);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-3.5 w-3.5',
                        value === x.id ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    {x.name}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ─── Broker Combobox ─────────────────────────────────────────────────────────

function BrokerCombobox({
  value,
  onSelect,
  brokers,
  disabled,
  className,
}: {
  value?: string;
  onSelect: (b: { id: string; name: string; isDirect?: boolean }) => void;
  brokers: ReinsuranceBroker[];
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = brokers.find((x) => x.id === value);
  const directBrokers = brokers.filter((b) => b.isDirect);
  const reinsuranceBrokers = brokers.filter((b) => !b.isDirect);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn('justify-between font-normal', className)}
        >
          <span className="truncate">{selected ? selected.name : 'Select broker'}</span>
          <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
        <Command>
          <CommandInput placeholder="Search broker..." />
          <CommandList>
            <CommandEmpty>No broker found.</CommandEmpty>
            {directBrokers.length > 0 && (
              <CommandGroup heading="Direct">
                {directBrokers.map((b) => (
                  <CommandItem
                    key={b.id}
                    value={`direct-${b.name}`}
                    onSelect={() => {
                      onSelect(b);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-3.5 w-3.5',
                        value === b.id ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    {b.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {reinsuranceBrokers.length > 0 && (
              <CommandGroup heading="Reinsurance Brokers">
                {reinsuranceBrokers.map((b) => (
                  <CommandItem
                    key={b.id}
                    value={`reinsurance-${b.name}`}
                    onSelect={() => {
                      onSelect(b);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-3.5 w-3.5',
                        value === b.id ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    {b.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function OverviewLayerCard({ allocation, currency }: { allocation: TreatyAllocation; currency: string }) {
  const primaryTitle = allocation.treatyName?.trim() || allocation.structureType;
  const cededSI = (allocation.allocatedSumInsured * (allocation.cessionPercent ?? 0)) / 100;
  const retainedSI = allocation.allocatedSumInsured - cededSI;
  return (
    <div className="rounded-lg border border-border bg-background p-4 space-y-3 text-foreground">
      <div className="flex items-start gap-2">
        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="min-w-0 flex-1">
          <span className="font-semibold text-sm block truncate">{primaryTitle}</span>
          <p className="text-xs text-muted-foreground truncate">{allocation.treatyCode}</p>
        </div>
        {allocation.isFacultative ? (
          <Badge variant="secondary" className="shrink-0 text-[10px] whitespace-nowrap">Facultative</Badge>
        ) : allocation.structureType ? (
          <Badge variant="outline" className="shrink-0 text-[10px] capitalize whitespace-nowrap">
            {allocation.structureType.replace(/_/g, ' ')}
          </Badge>
        ) : null}
      </div>
      <div className="space-y-1 text-sm border-t pt-2">
        <div className="flex justify-between">
          <span className="text-gray-500">Sum Insured</span>
          <span className="font-medium tabular-nums text-gray-900">{fmtAED(allocation.allocatedSumInsured, currency)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Ceded SI</span>
          <span className="font-medium tabular-nums text-gray-900">{fmtAED(cededSI, currency)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Retained SI</span>
          <span className="font-medium tabular-nums text-gray-900">{fmtAED(retainedSI, currency)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Premium</span>
          <span className="font-medium tabular-nums text-gray-900">{fmtAED(allocation.allocatedPremium, currency)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">% of Total</span>
          <span className="font-medium tabular-nums text-gray-900">{allocation.percentOfTotal.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}

function LayerBreakdownSection({
  allocation,
  currency,
  override,
  manualRows,
  readOnly,
  brokers,
  onOverridePremiumChange,
  onManualOverrideChange,
  onManualRowChange,
}: {
  allocation: TreatyAllocation;
  currency: string;
  override: LayerOverride;
  manualRows: ManualReinsurerRow[];
  readOnly: boolean;
  brokers: ReinsuranceBroker[];
  onOverridePremiumChange: (val: number) => void;
  onManualOverrideChange: (val: boolean) => void;
  onManualRowChange: (rows: ManualReinsurerRow[]) => void;
}) {
  const effectivePanel = override.isManualOverride && manualRows.length > 0
    ? manualRows.map((m) => {
        const base = allocation.reinsurerBreakdown.find((r) => r.reinsurerId === m.reinsurerId);
        const risk = base?.risk ?? 0;
        const commissionAmount = (m.sharedPremium * m.commissionPercent) / 100;
        const ratePer = risk > 0 ? m.sharedPremium / risk : 0;
        const rateAfterCommission = risk > 0 ? (m.sharedPremium - commissionAmount) / risk : 0;
        return { ...m, risk, commissionAmount, ratePer, rateAfterCommission };
      })
    : allocation.reinsurerBreakdown;

  const effectiveCession = override.isManualOverride && override.overridePremium > 0
    ? override.overridePremium
    : allocation.cessionAmount;

  const effectiveRetention = allocation.allocatedPremium - effectiveCession;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base">
                {allocation.treatyName?.trim() || allocation.structureType}
              </CardTitle>
              {allocation.isFacultative && (
                <Badge variant="secondary">Facultative</Badge>
              )}
            </div>
            <CardDescription>
              {allocation.treatyCode} · Retention {allocation.retentionPercent}% / Cession {allocation.cessionPercent}%
            </CardDescription>
          </div>
          {!readOnly && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Switch
                  checked={override.isManualOverride}
                  onCheckedChange={onManualOverrideChange}
                />
                <span className="text-sm font-semibold">Manual override</span>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Premium split */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Premium split</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border bg-green-50/50 p-4 space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Retention</p>
              <p className="text-lg font-semibold tabular-nums">{fmtAED(effectiveRetention, currency)}</p>
              <p className="text-xs text-muted-foreground">{allocation.retentionPercent}%</p>
            </div>
            <div className="rounded-lg border bg-blue-50/50 p-4 space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cession</p>
              <p className="text-lg font-semibold tabular-nums">{fmtAED(effectiveCession, currency)}</p>
              <p className="text-xs text-muted-foreground">{allocation.cessionPercent}%</p>
            </div>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="font-medium">Technical rate</span>
            <span className="tabular-nums">{fmtAED(allocation.technicalRate, currency)}</span>
          </div>
          {override.isManualOverride && (
            <div className="flex justify-between items-center pt-2">
              <span className="font-medium">Override Premium</span>
              <FormattedNumberInput
                className="h-8 w-40 text-right tabular-nums"
                value={override.overridePremium || undefined}
                placeholder="0"
                disabled={readOnly}
                allowEmpty

                onChange={(v) => onOverridePremiumChange(v ?? 0)}
              />
            </div>
          )}
          <div className="flex justify-between items-center border-t border-dashed pt-2">
            <span className="font-medium">{allocation.premiumBasisOgrOnr === 'ONR' ? 'Net premium' : 'Gross premium'}</span>
            <span className="tabular-nums">{fmtAED(allocation.allocatedPremium, currency)}</span>
          </div>
        </div>

        {/* Reinsurer Cession Share table */}
        <div className="overflow-x-auto">
          <p className="text-sm font-medium mb-3">Reinsurer Cession Share</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground text-xs">
                <th className="text-left pb-2 font-medium">Reinsurer</th>
                <th className="text-left pb-2 font-medium">Reinsurer Broker</th>
                <th className="text-right pb-2 font-medium">Risk</th>
                <th className="text-right pb-2 font-medium">Share %</th>
                <th className="text-right pb-2 pl-3 font-medium">Shared Premium</th>
                <th className="text-right pb-2 pl-3 font-medium">Comm. %</th>
                <th className="text-right pb-2 font-medium">Commission</th>
                <th className="text-right pb-2 font-medium">Rate %</th>
                <th className="text-right pb-2 font-medium">Rate After Comm.</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {effectivePanel.map((r, idx) => (
                <tr key={r.reinsurerId} className="hover:bg-muted/30 transition-colors">
                  <td className="py-2.5 font-medium">{r.name}</td>
                  <td className="py-2.5 font-medium">{r.brokerName || '-'}</td>
                  <td className="py-2.5 text-right tabular-nums">{fmtAED(r.risk, currency)}</td>
                  {override.isManualOverride ? (
                    <>
                      <td className="py-2.5 text-right">
                        <FormattedNumberInput
                          className="h-7 w-20 text-xs text-right ml-auto"
                          value={manualRows[idx]?.sharePercent ?? r.sharePercent}
                          disabled={readOnly}
                          allowEmpty
          
                          useGrouping={false}
                          onChange={(v) => { const clamped = Math.max(0, Math.min(100, v ?? 0)); const rows = [...manualRows]; rows[idx] = { ...rows[idx], sharePercent: clamped }; onManualRowChange(rows); }}
                        />
                      </td>
                      <td className="py-2.5 pl-3 text-right">
                        <FormattedNumberInput
                          className="h-7 w-28 text-xs text-right ml-auto tabular-nums"
                          value={manualRows[idx]?.sharedPremium ?? r.sharedPremium}
                          disabled={readOnly}
                          allowEmpty

                          onChange={(v) => {
                            const rows = [...manualRows];
                            rows[idx] = { ...rows[idx], sharedPremium: v ?? 0 };
                            onManualRowChange(rows);
                          }}
                        />
                      </td>
                      <td className="py-2.5 pl-3 text-right">
                        <FormattedNumberInput
                          className="h-7 w-16 text-xs text-right ml-auto"
                          value={manualRows[idx]?.commissionPercent ?? r.commissionPercent}
                          disabled={readOnly}
                          allowEmpty
          
                          useGrouping={false}
                          onChange={(v) => { const rows = [...manualRows]; rows[idx] = { ...rows[idx], commissionPercent: Math.max(0, Math.min(100, v ?? 0)) }; onManualRowChange(rows); }}
                        />
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-2.5 text-right tabular-nums">{r.sharePercent}%</td>
                      <td className="py-2.5 text-right tabular-nums">{fmtAED(r.sharedPremium, currency)}</td>
                      <td className="py-2.5 text-right tabular-nums">{r.commissionPercent}%</td>
                    </>
                  )}
                  <td className="py-2.5 text-right tabular-nums text-green-700">{fmtAED(r.commissionAmount, currency)}</td>
                  <td className="py-2.5 text-right tabular-nums">{(r.ratePer * 100).toFixed(2)}</td>
                  <td className="py-2.5 text-right tabular-nums">{(r.rateAfterCommission * 100).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t font-semibold bg-muted/30">
                <td className="pt-2.5 pb-2">Total</td>
                <td />
                <td className="pt-2.5 pb-2 text-right tabular-nums">{fmtAED(allocation.cessionSumInsured, currency)}</td>
                <td className="pt-2.5 pb-2 text-right tabular-nums">100%</td>
                <td className="pt-2.5 pb-2 text-right tabular-nums">{fmtAED(effectiveCession, currency)}</td>
                <td />
                <td className="pt-2.5 pb-2 text-right tabular-nums text-green-700">{fmtAED(allocation.commissionAmount, currency)}</td>
                <td /><td />
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Summary */}
        <p className="text-sm font-medium">Summary</p>
        <div className="rounded-lg border bg-muted/20 p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Commission on Cession ({allocation.commissionPercent}%)</span>
            <span className="font-medium tabular-nums text-green-700">{fmtAED(allocation.commissionAmount, currency)}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Net Premium Retention (after commission)</span>
            <span className="tabular-nums">{fmtAED(allocation.netRetentionAfterCommission, currency)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FacultativeCardSection({
  card,
  index,
  currency,
  readOnly,
  onChange,
  onRemove,
  reinsurers,
  reinsurersLoading,
  brokers,
  grossPremium,
  grossSumInsured,
}: {
  card: FacultativeCard;
  index: number;
  currency: string;
  readOnly: boolean;
  onChange: (next: FacultativeCard) => void;
  onRemove: () => void;
  reinsurers: Reinsurer[];
  reinsurersLoading: boolean;
  brokers: ReinsuranceBroker[];
  grossPremium: number;
  grossSumInsured: number;
}) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const isReadOnly = readOnly || !editing;

  const fmtMoney = (n: number) =>
    new Intl.NumberFormat('en-AE', { maximumFractionDigits: 2 }).format(
      Number.isFinite(n) ? n : 0,
    );

  const totals = card.reinsurers.reduce(
    (acc, r) => {
      const commission = (r.premium * r.commissionPercent) / 100;
      const risk = card.cededSumInsured * (r.sharePercent / 100);
      return {
        share: acc.share + (r.sharePercent || 0),
        risk: acc.risk + risk,
        premium: acc.premium + (r.premium || 0),
        commission: acc.commission + commission,
      };
    },
    { share: 0, risk: 0, premium: 0, commission: 0 },
  );

  const totalShare = Math.round(totals.share * 100) / 100;
  const shareExactlyHundred = totalShare === 100;

  const derivePremium = (cededSI: number) =>
    grossSumInsured > 0 ? grossPremium * (cededSI / grossSumInsured) : 0;

  const updateRow = (idx: number, patch: Partial<FacultativeReinsurerRow>) => {
    const next = card.reinsurers.map((r, i) => (i === idx ? { ...r, ...patch } : r));
    onChange({ ...card, reinsurers: next });
  };

  const addRow = () => {
    onChange({
      ...card,
      reinsurers: [
        ...card.reinsurers,
        { name: '', sharePercent: 0, risk: 0, premium: 0, commissionPercent: 0 },
      ],
    });
  };

  const removeRow = (idx: number) => {
    onChange({ ...card, reinsurers: card.reinsurers.filter((_, i) => i !== idx) });
  };

  const handleApply = () => {
    // Hard validation 1: Ceded SI > 0
    if (!card.cededSumInsured || card.cededSumInsured <= 0) {
      toast({ title: 'Ceded SI required', description: 'Please enter a Ceded Sum Insured greater than 0.', variant: 'destructive' });
      return;
    }

    // Hard validation 2: Every row must have a reinsurer selected
    if (card.reinsurers.some((r) => !r.name.trim())) {
      toast({ title: 'Reinsurer required', description: 'Please select a reinsurer for every row in the panel.', variant: 'destructive' });
      return;
    }

    // Hard validation 3: Every row must have share % > 0
    if (card.reinsurers.some((r) => !(r.sharePercent > 0))) {
      toast({ title: 'Share % required', description: 'Every reinsurer must have a Share % greater than 0.', variant: 'destructive' });
      return;
    }

    // Hard validation 5: Every row must have premium > 0
    if (card.reinsurers.some((r) => !(r.premium > 0))) {
      toast({ title: 'Premium required', description: 'Every reinsurer must have a Premium amount greater than 0.', variant: 'destructive' });
      return;
    }

    // Hard validation 6: Commission % ≤ 100
    if (card.reinsurers.some((r) => r.commissionPercent > 100)) {
      toast({ title: 'Invalid commission', description: 'Commission % cannot exceed 100%.', variant: 'destructive' });
      return;
    }

    // Hard validation 7: Total share must equal 100%
    if (!shareExactlyHundred) {
      toast({ title: 'Invalid share allocation', description: `Panel share total is ${totalShare.toFixed(2)}%. It must equal 100%.`, variant: 'destructive' });
      return;
    }

    // Soft warning: High commission
    if (card.reinsurers.some((r) => r.commissionPercent > 40)) {
      toast({ title: 'High commission warning', description: 'One or more reinsurers have commission above 40%.' });
    }

    // Soft warning: Duplicate reinsurer
    const nameSet = new Set<string>();
    const hasDuplicate = card.reinsurers.some((r) => {
      if (nameSet.has(r.name)) return true;
      if (r.name) nameSet.add(r.name);
      return false;
    });
    if (hasDuplicate) {
      toast({ title: 'Duplicate reinsurer warning', description: 'The same reinsurer appears more than once on this panel.' });
    }

    setEditing(false);
  };

  const handleCededSIChange = (newCededSI: number) => {
    const newPremium = derivePremium(newCededSI);
    const updatedReinsurers = card.reinsurers.map((r) => ({
      ...r,
      premium: r.sharePercent > 0
        ? Math.round(newPremium * r.sharePercent) / 100
        : r.premium,
      risk: newCededSI * (r.sharePercent / 100),
    }));
    onChange({ ...card, cededSumInsured: newCededSI, overridePremium: newPremium, reinsurers: updatedReinsurers });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base">Facultative Case #{index + 1}</CardTitle>
              <Badge variant="secondary">Facultative</Badge>
            </div>
            <CardDescription>Case-by-case reinsurer panel (no treaty)</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {editing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleApply}
                className="gap-1"
              >
                <Check className="h-4 w-4" />
                Apply
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(true)}
                disabled={readOnly}
                className="gap-1"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              disabled={readOnly || editing}
              className="text-destructive hover:text-destructive gap-1"
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium">Ceded SI</span>
            {isReadOnly ? (
              <span className="text-sm font-semibold tabular-nums">{fmtAED(card.cededSumInsured, currency)}</span>
            ) : (
              <FormattedNumberInput
                className="h-8 w-40 text-right tabular-nums"
                value={card.cededSumInsured || undefined}
                allowEmpty
                onChange={(v) => handleCededSIChange(v ?? 0)}
              />
            )}
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium text-muted-foreground">Ceded Premium (derived)</span>
            <span className="text-sm font-semibold tabular-nums">{fmtAED(card.overridePremium, currency)}</span>
          </div>
        </div>

        <div className="rounded-md border">
          <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
            <p className="text-sm font-medium">Reinsurer Panel</p>
            {!isReadOnly && (
              <Button
                variant="outline"
                size="sm"
                onClick={addRow}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Reinsurer
              </Button>
            )}
          </div>

          <div className="overflow-x-auto px-3 pb-2">
          {card.reinsurers.length === 0 ? (
            <div className="rounded-md border border-dashed py-4 text-center text-xs text-muted-foreground my-2">
              No reinsurers yet. Click "Add Reinsurer" to start.
            </div>
          ) : (
            <table className="w-full text-sm border-separate border-spacing-x-2 border-spacing-y-0">
              <thead>
                <tr className="border-b text-muted-foreground text-xs">
                  <th className="text-left py-2 font-medium w-[200px]">Reinsurer Name {!isReadOnly && <span className="text-destructive">*</span>}</th>
                  <th className="text-center py-2 font-medium">Rating</th>
                  <th className="text-right py-2 font-medium">Risk</th>
                  <th className="text-right py-2 font-medium">Share %</th>
                  <th className="text-right py-2 font-medium">Premium</th>
                  <th className="text-right py-2 font-medium">Comm. %</th>
                  <th className="text-right py-2 font-medium">Commission</th>
                  {!isReadOnly && <th className="py-2" />}
                </tr>
              </thead>
              <tbody className="divide-y">
                {card.reinsurers.map((r, idx) => {
                  const commission = (r.premium * r.commissionPercent) / 100;
                  const riskValue = r.risk ?? card.cededSumInsured * (r.sharePercent / 100);

                  if (isReadOnly) {
                    return (
                      <tr key={idx} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 font-medium">{r.name || '—'}</td>
                        <td className="py-2.5 text-center">
                          {r.rating ? (
                            <Badge variant="outline" className="text-xs whitespace-nowrap">{r.rating}</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-2.5 text-right tabular-nums">{fmtAED(riskValue, currency)}</td>
                        <td className="py-2.5 text-right tabular-nums">{r.sharePercent}%</td>
                        <td className="py-2.5 pr-5 text-right tabular-nums">{fmtAED(r.premium, currency)}</td>
                        <td className="py-2.5 text-right tabular-nums">{r.commissionPercent}%</td>
                        <td className="py-2.5 text-right tabular-nums text-green-700">{fmtAED(commission, currency)}</td>
                      </tr>
                    );
                  }

                  const selectedIdsOther = new Set(
                    card.reinsurers
                      .filter((_, i) => i !== idx)
                      .map((x) => x.reinsurerId)
                      .filter((v): v is string => !!v),
                  );
                  return (
                    <tr key={idx} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 w-[200px]">
                        <ReinsurerCombobox
                          value={r.reinsurerId}
                          onSelect={(picked) => updateRow(idx, {
                            reinsurerId: picked.id,
                            name: picked.name,
                            rating: picked.grade || '',
                          })}
                          reinsurers={reinsurers}
                          loading={reinsurersLoading}
                          disabledIds={selectedIdsOther}
                          className="h-7 text-xs w-full"
                        />
                      </td>
                      <td className="py-2.5 text-center">
                        {r.rating ? (
                          <Badge variant="outline" className="text-xs whitespace-nowrap">{r.rating}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-2.5 text-right">
                        <FormattedNumberInput
                          className="h-7 w-36 text-xs text-right ml-auto"
                          value={riskValue || undefined}
                          placeholder="0"
                          allowEmpty
                          onChange={(v) => {
                            const risk = Math.max(0, v ?? 0);
                            const newShare = card.cededSumInsured > 0
                              ? Math.round((risk / card.cededSumInsured) * 10000) / 100
                              : 0;
                            const newPremium = card.overridePremium > 0
                              ? Math.round(card.overridePremium * newShare) / 100
                              : r.premium;
                            updateRow(idx, { sharePercent: newShare, premium: newPremium, risk });
                          }}
                        />
                      </td>
                      <td className="py-2.5 text-right">
                        <FormattedNumberInput
                          className="h-7 w-24 text-xs text-right ml-auto"
                          value={r.sharePercent || undefined}
                          placeholder="0"
                          allowEmpty
                          useGrouping={false}
                          onChange={(v) => {
                            const parsed = v ?? 0;
                            const othersTotal = card.reinsurers
                              .filter((_, i) => i !== idx)
                              .reduce((s, x) => s + (x.sharePercent || 0), 0);
                            const maxAllowed = Math.round((100 - othersTotal) * 100) / 100;
                            const clamped = Math.max(0, Math.min(maxAllowed, parsed));
                            const newPremium = card.overridePremium > 0
                              ? Math.round(card.overridePremium * clamped) / 100
                              : r.premium;
                            const newRisk = card.cededSumInsured * (clamped / 100);
                            updateRow(idx, { sharePercent: clamped, premium: newPremium, risk: newRisk });
                          }}
                        />
                      </td>
                      <td className="py-2.5 pr-5 text-right">
                        <FormattedNumberInput
                          className="h-7 w-28 text-xs text-right ml-auto tabular-nums"
                          value={r.premium || undefined}
                          placeholder="0"
                          allowEmpty
                          onChange={(v) => {
                            updateRow(idx, { premium: v ?? 0 });
                          }}
                        />
                      </td>
                      <td className="py-2.5 pl-3 text-right">
                        <FormattedNumberInput
                          className="h-7 w-20 text-xs text-right ml-auto"
                          value={r.commissionPercent || undefined}
                          placeholder="0"
                          allowEmpty
                          useGrouping={false}
                          onChange={(v) => {
                            updateRow(idx, { commissionPercent: Math.max(0, Math.min(100, v ?? 0)) });
                          }}
                        />
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-green-700">
                        {fmtAED(commission, currency)}
                      </td>
                      <td className="py-2.5 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRow(idx)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          aria-label="Remove reinsurer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t font-semibold bg-muted/30">
                  <td className="pt-2.5 pb-2">Total</td>
                  <td />
                  <td className="pt-2.5 pb-2 text-right tabular-nums">
                    {fmtAED(totals.risk, currency)}
                  </td>
                  <td className={cn(
                    "pt-2.5 pb-2 text-right tabular-nums",
                    !shareExactlyHundred && 'text-destructive',
                  )}>
                    {totals.share.toFixed(2)}%
                  </td>
                  <td className="pt-2.5 pb-2 text-right tabular-nums">
                    {fmtAED(totals.premium, currency)}
                  </td>
                  <td />
                  <td className="pt-2.5 pb-2 text-right tabular-nums text-green-700">
                    {fmtAED(totals.commission, currency)}
                  </td>
                  {!isReadOnly && <td />}
                </tr>
              </tfoot>
            </table>
          )}

          {!shareExactlyHundred && card.reinsurers.some((r) => r.sharePercent > 0) && (
            <p className="text-xs text-destructive mt-2">
              Total share is {totals.share.toFixed(2)}% — must equal 100%.
            </p>
          )}
          </div>
        </div>

        {/* Summary */}
        {card.reinsurers.length > 0 && (
          <>
            <p className="text-sm font-medium">Summary</p>
            <div className="rounded-lg border bg-muted/20 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Commission on Cession</span>
                <span className="font-medium tabular-nums text-green-700">{fmtAED(totals.commission, currency)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Net Premium Retention (after commission)</span>
                <span className="tabular-nums">
                  {fmtAED(card.overridePremium - totals.premium + totals.commission, currency)}
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function FacultativeDialog({
  open,
  onOpenChange,
  currency,
  onSubmit,
  reinsurers,
  reinsurersLoading,
  brokers,
  totalRetentionAvailable,
  grossPremium,
  grossSumInsured,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currency: string;
  onSubmit: (card: Omit<FacultativeCard, 'id'>) => void;
  reinsurers: Reinsurer[];
  reinsurersLoading: boolean;
  brokers: ReinsuranceBroker[];
  totalRetentionAvailable?: number;
  grossPremium: number;
  grossSumInsured: number;
}) {
  const { toast } = useToast();
  const [cededSI, setCededSI] = useState<number>(0);
  const overridePremium = grossSumInsured > 0 ? grossPremium * (cededSI / grossSumInsured) : 0;
  const [rows, setRows] = useState<FacultativeReinsurerRow[]>([
    { name: '', sharePercent: 0, risk: 0, premium: 0, commissionPercent: 0 },
  ]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setCededSI(0);
      setRows([{ name: '', sharePercent: 0, risk: 0, premium: 0, commissionPercent: 0 }]);
    }
  }, [open]);

  const fmtMoney = (n: number) =>
    new Intl.NumberFormat('en-AE', { maximumFractionDigits: 2 }).format(
      Number.isFinite(n) ? n : 0,
    );

  const updateRow = (idx: number, patch: Partial<FacultativeReinsurerRow>) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const addRow = () =>
    setRows((prev) => [
      ...prev,
      { name: '', sharePercent: 0, risk: 0, premium: 0, commissionPercent: 0 },
    ]);

  const removeRow = (idx: number) =>
    setRows((prev) => prev.filter((_, i) => i !== idx));

  const totals = rows.reduce(
    (acc, r) => ({
      share: acc.share + (r.sharePercent || 0),
      risk: acc.risk + (r.risk || 0),
      premium: acc.premium + (r.premium || 0),
      commission: acc.commission + (r.premium * r.commissionPercent) / 100,
    }),
    { share: 0, risk: 0, premium: 0, commission: 0 },
  );

  // Round once at the aggregate to avoid floating-point noise
  const totalShare = Math.round(totals.share * 100) / 100;
  const shareExactlyHundred = totalShare === 100;

  const handleSubmit = () => {
    // Ceded SI must be > 0
    if (!cededSI || cededSI <= 0) {
      toast({
        title: 'Ceded SI required',
        description: 'Please enter a Ceded Sum Insured greater than 0.',
        variant: 'destructive',
      });
      return;
    }

    // Ceded SI must not exceed available retention
    if (totalRetentionAvailable != null && cededSI > totalRetentionAvailable) {
      toast({
        title: 'Ceded SI exceeds available retention',
        description: `Ceded SI (${fmtMoney(cededSI)}) exceeds the available retention (${fmtMoney(totalRetentionAvailable)}).`,
        variant: 'destructive',
      });
      return;
    }

    // Every row must have a reinsurer selected
    const missingReinsurer = rows.some((r) => !r.name.trim());
    if (missingReinsurer) {
      toast({
        title: 'Reinsurer required',
        description: 'Please select a reinsurer for every row in the panel.',
        variant: 'destructive',
      });
      return;
    }

    // Every row must have share % > 0
    const missingShare = rows.some((r) => !(r.sharePercent > 0));
    if (missingShare) {
      toast({
        title: 'Share % required',
        description: 'Every reinsurer must have a Share % greater than 0.',
        variant: 'destructive',
      });
      return;
    }

    // Every row must have premium > 0
    const missingPremium = rows.some((r) => !(r.premium > 0));
    if (missingPremium) {
      toast({
        title: 'Premium required',
        description: 'Every reinsurer must have a Premium amount greater than 0.',
        variant: 'destructive',
      });
      return;
    }

    // Commission % > 100 is a hard error
    const invalidCommission = rows.some((r) => r.commissionPercent > 100);
    if (invalidCommission) {
      toast({
        title: 'Invalid commission',
        description: 'Commission % cannot exceed 100%.',
        variant: 'destructive',
      });
      return;
    }

    // Total share must equal 100%
    if (!shareExactlyHundred) {
      toast({
        title: 'Invalid share allocation',
        description: `Panel share total is ${totalShare.toFixed(2)}%. It must equal 100%.`,
        variant: 'destructive',
      });
      return;
    }

    // Soft warnings (don't block)
    const highCommission = rows.some((r) => r.commissionPercent > 40);
    if (highCommission) {
      toast({
        title: 'High commission warning',
        description: 'One or more reinsurers have commission above 40%.',
      });
    }
    const nameSet = new Set<string>();
    const duplicateReinsurer = rows.some((r) => {
      if (nameSet.has(r.name)) return true;
      if (r.name) nameSet.add(r.name);
      return false;
    });
    if (duplicateReinsurer) {
      toast({
        title: 'Duplicate reinsurer warning',
        description: 'The same reinsurer appears more than once on this panel.',
      });
    }

    onSubmit({ cededSumInsured: cededSI, overridePremium, reinsurers: rows });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[76vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Arrange Facultative Reinsurance
          </DialogTitle>
          <DialogDescription>
            Case-by-case reinsurer panel. Enter the ceded sum insured and the reinsurers
            taking a share. Premium auto-derives from SI.
          </DialogDescription>
        </DialogHeader>

        {totalRetentionAvailable != null && totalRetentionAvailable > 0 && (
          <div className="rounded-md border bg-muted/30 px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-medium">Retention SI Available for Facultative</span>
            <span className="text-sm font-bold tabular-nums ">
              {fmtAED(totalRetentionAvailable, currency)}
            </span>
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium">Ceded SI</span>
              <FormattedNumberInput
                className="h-9 w-48 text-right tabular-nums"
                value={cededSI || undefined}
                allowEmpty

                onChange={(v) => {
                  const newCededSI = v ?? 0;
                  setCededSI(newCededSI);
                  const newPremium = grossSumInsured > 0 ? grossPremium * (newCededSI / grossSumInsured) : 0;
                  setRows((prev) =>
                    prev.map((r) => ({
                      ...r,
                      premium: r.sharePercent > 0
                        ? Math.round(newPremium * r.sharePercent) / 100
                        : r.premium,
                      risk: newCededSI * (r.sharePercent / 100),
                    })),
                  );
                }}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-muted-foreground">Ceded Premium (derived)</span>
              <span className="text-sm font-semibold tabular-nums">{fmtAED(overridePremium, currency)}</span>
            </div>
          </div>

          <div className="rounded-md border">
            <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
              <p className="text-sm font-medium">Reinsurer Panel</p>
              <Button variant="default" size="sm" onClick={addRow} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Reinsurer
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm table-fixed">
                <thead className='w-full'>
                  <tr className="border-b text-muted-foreground text-xs">
                    <th className="text-left py-2 pr-6 font-medium w-[22%]">Reinsurer Name <span className="text-destructive">*</span></th>
                    <th className="text-center py-2 pr-4 font-medium w-[8%]">Rating</th>
                    <th className="text-right px-3 py-2 font-medium w-[14%]">Risk <span className="text-destructive">*</span></th>
                    <th className="text-right px-3 py-2 font-medium w-[10%]">Share % <span className="text-destructive">*</span></th>
                    <th className="text-right px-3 py-2 pr-5 font-medium w-[16%]">Premium</th>
                    <th className="text-right px-3 py-2 font-medium w-[10%]">Comm. %</th>
                    <th className="text-right px-3 py-2 font-medium w-[12%]">Commission</th>
                    <th className="px-3 py-2 w-[5%]" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map((r, idx) => {
                    const commission = (r.premium * r.commissionPercent) / 100;
                    const selectedIdsOther = new Set(
                      rows
                        .filter((_, i) => i !== idx)
                        .map((x) => x.reinsurerId)
                        .filter((v): v is string => !!v),
                    );
                    return (
                      <tr key={idx} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2 pr-6">
                          <ReinsurerCombobox
                            value={r.reinsurerId}
                            onSelect={(picked) => updateRow(idx, {
                              reinsurerId: picked.id,
                              name: picked.name,
                              rating: picked.grade || '',
                            })}
                            reinsurers={reinsurers}
                            loading={reinsurersLoading}
                            disabledIds={selectedIdsOther}
                            className="h-8 text-xs w-full"
                          />
                        </td>
                        <td className="py-2 pr-4 text-center" >
                          {r.rating ? (
                            <Badge variant="outline" className="text-xs whitespace-nowrap">
                              {r.rating}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <FormattedNumberInput
                            className="h-8 w-full text-xs text-right ml-auto"
                            value={r.risk || undefined}
                            placeholder="0"
                            allowEmpty
            
                            onChange={(v) => {
                              const risk = Math.max(0, v ?? 0);
                              const newShare = cededSI > 0
                                ? Math.round((risk / cededSI) * 10000) / 100
                                : 0;
                              const newPremium = overridePremium > 0
                                ? Math.round(overridePremium * newShare) / 100
                                : r.premium;
                              updateRow(idx, { sharePercent: newShare, premium: newPremium, risk });
                            }}
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <FormattedNumberInput
                            className="h-8 w-full text-xs text-right ml-auto"
                            value={r.sharePercent || undefined}
                            placeholder="0"
                            allowEmpty
            
                            useGrouping={false}
                            onChange={(v) => {
                              const parsed = v ?? 0;
                              const othersTotal = rows
                                .filter((_, i) => i !== idx)
                                .reduce((s, x) => s + (x.sharePercent || 0), 0);
                              const maxAllowed = Math.round((100 - othersTotal) * 100) / 100;
                              const clamped = Math.max(0, Math.min(maxAllowed, parsed));
                              const newPremium = overridePremium > 0
                                ? Math.round(overridePremium * clamped) / 100
                                : r.premium;
                              const newRisk = cededSI * (clamped / 100);
                              updateRow(idx, { sharePercent: clamped, premium: newPremium, risk: newRisk });
                            }}
                          />
                        </td>
                        <td className="px-3 pr-5 py-2 text-right">
                          <FormattedNumberInput
                            className="h-8 w-full text-xs text-right ml-auto tabular-nums"
                            value={r.premium || undefined}
                            allowEmpty

                            onChange={(v) => {
                              updateRow(idx, { premium: v ?? 0 });
                            }}
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <FormattedNumberInput
                            className="h-8 w-full text-xs text-right ml-auto"
                            value={r.commissionPercent || undefined}
                            placeholder="0"
                            allowEmpty
            
                            useGrouping={false}
                            onChange={(v) => {
                              updateRow(idx, { commissionPercent: Math.max(0, Math.min(100, v ?? 0)) });
                            }}
                          />
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-green-700">
                          {fmtAED(commission, currency)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRow(idx)}
                            disabled={rows.length === 1}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            aria-label="Remove reinsurer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t font-semibold bg-muted/30">
                    <td className="px-3 py-2">Total</td>
                    <td />
                    <td />
                    <td className="px-3 py-2 text-right tabular-nums">
                      {fmtAED(totals.risk, currency)}
                    </td>
                    <td
                      className={cn(
                        'px-3 py-2 text-right tabular-nums',
                        !shareExactlyHundred && 'text-destructive',
                      )}
                    >
                      {totals.share.toFixed(2)}%
                    </td>
                    <td className="px-3 pr-5 py-2 text-right tabular-nums">
                      {fmtAED(totals.premium, currency)}
                    </td>
                    <td />
                    <td className="px-3 py-2 text-right tabular-nums text-green-700">
                      {fmtAED(totals.commission, currency)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {!shareExactlyHundred && rows.some((r) => r.sharePercent > 0) && (
            <p className="text-xs text-destructive">
              Total share is {totals.share.toFixed(2)}% — must equal 100%.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Facultative
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ReinsurerBreakdownPage() {
  const { policyId, unitId } = useParams<{ policyId: string; unitId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as { coverName?: string; quoteNumber?: string; customerName?: string } | null;
  const isMarketAdmin = location.pathname.startsWith('/market-admin');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // policyId = allocationId, unitId = coverId
  const allocationId = policyId;
  const coverId = unitId;

  const [breakdownData, setBreakdownData] = useState<ReinsuranceCoverBreakdownDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  // ── Override state ──
  const [isDirty, setIsDirty] = useState(false);
  const [extraRetentionPct, setExtraRetentionPct] = useState<number>(0);
  const [appliedExtraRetPct, setAppliedExtraRetPct] = useState<number>(0);
  const [refetching, setRefetching] = useState(false);
  const extraRetInitRef = useRef(false);

  useEffect(() => {
    if (!allocationId || !coverId) return;
    let cancelled = false;
    const isRefetch = !!breakdownData;
    if (isRefetch) {
      setRefetching(true);
    } else {
      setLoading(true);
    }
    setFetchError(false);

    getReinsuranceCoverBreakdown(allocationId, coverId, appliedExtraRetPct > 0 ? { extraRetentionPercent: appliedExtraRetPct } : undefined)
      .then((data) => {
        if (!cancelled) setBreakdownData(data);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('[ReinsurerBreakdownPage] Failed to load breakdown:', allocationId, coverId, err);
          toast({ title: 'Error', description: 'Failed to load breakdown details.', variant: 'destructive' });
          setFetchError(true);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setRefetching(false);
        }
      });

    return () => { cancelled = true; };
  }, [allocationId, coverId, appliedExtraRetPct]);
  const [layerOverrides, setLayerOverrides] = useState<Record<string, LayerOverride>>({});
  const [manualReinsurerRows, setManualReinsurerRows] = useState<Record<string, ManualReinsurerRow[]>>({});
  const [facultativeCards, setFacultativeCards] = useState<FacultativeCard[]>([]);
  const [facultativeDialogOpen, setFacultativeDialogOpen] = useState(false);
  const [reinsurersList, setReinsurersList] = useState<Reinsurer[]>([]);
  const [reinsurersLoading, setReinsurersLoading] = useState(false);
  const [brokersList, setBrokersList] = useState<ReinsuranceBroker[]>([]);

  useEffect(() => {
    let cancelled = false;
    setReinsurersLoading(true);
    Promise.all([
      listReinsurers({ limit: 100, status: 'active' }),
      listReinsurerGrades(),
    ])
      .then(([res, grades]) => {
        if (cancelled) return;
        const gradeMap = Object.fromEntries(
          (grades || []).map((g) => [g.id, g.valueLabel]),
        );
        const enriched = (res.data || []).map((r) => ({
          ...r,
          grade: gradeMap[r.gradeId || ''] || r.grade || undefined,
        }));
        setReinsurersList(enriched);
      })
      .catch((err) => {
        console.error('[ReinsurerBreakdownPage] Failed to load reinsurers list:', err);
        if (!cancelled) setReinsurersList([]);
      })
      .finally(() => {
        if (!cancelled) setReinsurersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    listReinsuranceBrokers({ limit: 100, status: 'active' })
      .then((res) => {
        if (!cancelled) setBrokersList(res.data ?? []);
      })
      .catch((err) => {
        console.error('[ReinsurerBreakdownPage] Failed to load brokers list:', err);
      });
    return () => { cancelled = true; };
  }, []);

  // Navigation guard state
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const pendingNavRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const guardedNavigate = useCallback((navFn: () => void) => {
    if (isDirty) {
      pendingNavRef.current = navFn;
      setShowLeaveDialog(true);
    } else {
      navFn();
    }
  }, [isDirty]);

  const handleAddFacultative = () => {
    setIsDirty(true);
    setFacultativeDialogOpen(true);
  };

  const handleFacultativeDialogSubmit = (card: Omit<FacultativeCard, 'id'>) => {
    setFacultativeCards((prev) => [
      ...prev,
      {
        id:
          typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `fac-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        ...card,
      },
    ]);
  };

  const updateFacultativeCard = (id: string, next: FacultativeCard) => {
    setFacultativeCards((prev) => prev.map((c) => (c.id === id ? next : c)));
  };

  const removeFacultativeCard = (id: string) => {
    setFacultativeCards((prev) => prev.filter((c) => c.id !== id));
  };

  // Effective totals — recomputed whenever overrides change so the Reinsurance
  // Summary tiles and the teal card's footer strip stay in sync with the
  // Override Premium / manual rows entered inside each LayerBreakdownSection.
  const effectiveTotals = useMemo(() => {
    const grossPremium = breakdownData?.grossPremium ?? 0;
    const sumInsured = breakdownData?.sumInsured ?? 0;

    let totalTreatyCession = 0;
    let totalFacultativeCession = 0;
    let totalCommission = 0;

    (breakdownData?.treatyAllocations ?? []).forEach((alloc, idx) => {
      const key = allocKey(alloc, idx);
      const override = layerOverrides[key] ?? { overridePremium: 0, isManualOverride: false };
      const manual = manualReinsurerRows[key] ?? [];

      const effCession =
        override.isManualOverride && override.overridePremium > 0
          ? override.overridePremium
          : alloc.cessionAmount;

      const effCommission =
        override.isManualOverride && manual.length > 0
          ? manual.reduce(
              (s, m) => s + ((m.sharedPremium || 0) * (m.commissionPercent || 0)) / 100,
              0,
            )
          : alloc.commissionAmount;

      if (alloc.isFacultative) {
        totalFacultativeCession += effCession;
      } else {
        totalTreatyCession += effCession;
      }
      totalCommission += effCommission;
    });

    // Add fac cards' cession and commission
    let facCessionSI = 0;
    let facCessionPremium = 0;
    let facCommission = 0;
    for (const card of facultativeCards) {
      facCessionSI += card.cededSumInsured;
      facCessionPremium += card.reinsurers.reduce((s, r) => s + r.premium, 0);
      facCommission += card.reinsurers.reduce((s, r) => s + (r.premium * r.commissionPercent) / 100, 0);
    }
    totalFacultativeCession += facCessionPremium;
    totalCommission += facCommission;

    const totalCession = totalTreatyCession + totalFacultativeCession;
    const netRetention = grossPremium - totalCession;

    // Sum Insured-based cession/retention for summary boxes (V9)
    let totalCessionSI = 0;
    (breakdownData?.treatyAllocations ?? []).forEach((alloc) => {
      totalCessionSI += alloc.cessionSumInsured ?? 0;
    });
    totalCessionSI += facCessionSI;
    const retentionSI = sumInsured - totalCessionSI;

    return {
      sumInsured,
      grossPremium,
      cession: totalCession,
      cessionSI: totalCessionSI,
      retentionSI,
      facultativeCession: totalFacultativeCession,
      retention: netRetention,
      commission: totalCommission,
      netRetentionAfterCommission: netRetention + totalCommission,
    };
  }, [breakdownData, layerOverrides, manualReinsurerRows, facultativeCards]);

  const summaryBoxes = useMemo(() => {
    if (!breakdownData) return [];
    const includesFacultative = effectiveTotals.facultativeCession > 0;
    return [
      { label: 'Sum Insured', value: effectiveTotals.sumInsured },
      { label: 'Gross Premium', value: effectiveTotals.grossPremium },
      { label: 'Cession (SI)', value: effectiveTotals.cessionSI, includesFacultative },
      { label: 'Retention (SI)', value: effectiveTotals.retentionSI },
      { label: 'Commission', value: effectiveTotals.commission },
      { label: 'Net Premium Retention After Commission', value: effectiveTotals.netRetentionAfterCommission },
    ];
  }, [breakdownData, effectiveTotals]);

  // Build reinsurerId → broker lookup from triggered treaties panel data
  const enrichedAllocations = useMemo(() => {
    if (!breakdownData) return [];

    // Build brokerId → brokerName lookup from loaded brokers list
    const brokerNameById = new Map<string, string>();
    for (const b of brokersList) {
      if (b.id && b.name) brokerNameById.set(b.id, b.name);
    }

    const brokerByReinsurer = new Map<string, { brokerId?: string; brokerName?: string }>();
    for (const tt of breakdownData.triggeredTreaties ?? []) {
      for (const p of tt.treaty?.panel ?? []) {
        const panelEntry = p as Record<string, unknown>;
        const rid = (panelEntry.reinsurerId || panelEntry.reinsurerOrganizationId) as string | undefined;
        const bName = panelEntry.brokerName as string | undefined;
        const bId = (panelEntry.brokerOrganizationId || panelEntry.brokerId) as string | undefined;
        if (rid && (bName || bId)) {
          brokerByReinsurer.set(rid, { brokerId: bId, brokerName: bName });
        }
      }
    }
    for (const layer of breakdownData.handling?.layers ?? []) {
      for (const rb of layer.reinsurerBreakdown ?? []) {
        if (rb.reinsurerId && (rb.brokerName || rb.brokerId)) {
          brokerByReinsurer.set(rb.reinsurerId, { brokerId: rb.brokerId, brokerName: rb.brokerName });
        }
      }
    }
    return breakdownData.treatyAllocations.map((alloc) => ({
      ...alloc,
      reinsurerBreakdown: alloc.reinsurerBreakdown.map((r) => {
        if (r.brokerName) return r;
        const broker = brokerByReinsurer.get(r.reinsurerId);
        const resolvedBrokerId = r.brokerId || broker?.brokerId;
        const resolvedBrokerName = broker?.brokerName || (resolvedBrokerId ? brokerNameById.get(resolvedBrokerId) : undefined);
        if (!resolvedBrokerId && !resolvedBrokerName) return r;
        return { ...r, brokerId: resolvedBrokerId || r.brokerId, brokerName: resolvedBrokerName || r.brokerName };
      }),
    }));
  }, [breakdownData, brokersList]);

  // Initialize overrides when data loads — restore saved handling if present
  useEffect(() => {
    if (!breakdownData) return;
    const initOverrides: Record<string, LayerOverride> = {};
    const initManual: Record<string, ManualReinsurerRow[]> = {};
    const savedLayers = breakdownData.handling?.layers ?? [];
    if (!extraRetInitRef.current && breakdownData.handling?.extraRetentionPercent) {
      setExtraRetentionPct(breakdownData.handling.extraRetentionPercent);
      setAppliedExtraRetPct(breakdownData.handling.extraRetentionPercent);
    }
    extraRetInitRef.current = true;

    enrichedAllocations.forEach((a, idx) => {
      const key = allocKey(a, idx);
      const saved = savedLayers.find((l) => l.treatyId === a.treatyId);

      if (saved && saved.isManualOverride) {
        initOverrides[key] = {
          overridePremium: saved.overridePremium ?? 0,
          isManualOverride: true,
        };
        initManual[key] = saved.reinsurerBreakdown.map((r) => {
          const enriched = a.reinsurerBreakdown.find((rb) => rb.name === r.name);
          return {
            reinsurerId: enriched?.reinsurerId ?? '',
            name: r.name,
            sharePercent: r.sharePercent ?? (r as any).sharePercentage ?? 0,
            sharedPremium: r.premium,
            commissionPercent: r.commissionPercent,
            brokerId: r.brokerId || enriched?.brokerId,
            brokerName: r.brokerName || enriched?.brokerName,
          };
        });
      } else {
        initOverrides[key] = { overridePremium: 0, isManualOverride: false };
        initManual[key] = a.reinsurerBreakdown.map((r) => ({
          reinsurerId: r.reinsurerId, name: r.name,
          brokerId: r.brokerId, brokerName: r.brokerName,
          sharePercent: r.sharePercent, sharedPremium: r.sharedPremium, commissionPercent: r.commissionPercent,
        }));
      }
    });
    setLayerOverrides(initOverrides);
    setManualReinsurerRows(initManual);

    // Hydrate facultative cards — layers with no treatyId + isFacultativeMode
    const facLayers = savedLayers.filter(
      (l) => !l.treatyId && l.isFacultativeMode,
    );
    setFacultativeCards(
      facLayers.map((l) => ({
        id:
          typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `fac-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        cededSumInsured: l.cededSumInsured ?? l.overridePremium ?? 0,
        overridePremium: l.overridePremium ?? 0,
        reinsurers: (l.reinsurerBreakdown ?? []).map((r) => ({
          reinsurerId: r.reinsurerId,
          name: r.name,
          rating: r.rating,
          brokerId: r.brokerId,
          brokerName: r.brokerName,
          sharePercent: r.sharePercent ?? (r as any).sharePercentage ?? 0,
          risk: r.risk ?? 0,
          premium: r.premium,
          commissionPercent: r.commissionPercent,
        })),
      })),
    );
  }, [breakdownData, enrichedAllocations]);

  // ── Save mutation ──
  const saveMutation = useMutation({
    mutationFn: (payload: { layers: HandlingLayer[]; extraRetentionPercent?: number; cededToTreaty?: number; netRetention?: number }) =>
      saveReinsuranceBreakdown(allocationId!, coverId!, payload),
    onSuccess: () => {
      setIsDirty(false);
      queryClient.invalidateQueries({ queryKey: ['reinsurance-handling', breakdownData?.allocationId] });
      queryClient.invalidateQueries({ queryKey: ['reinsurance-policy-detail'] });
      toast({ title: 'Handling saved', description: 'Reinsurance handling decisions have been saved.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to save handling decisions.', variant: 'destructive' });
    },
  });

  const handleSave = () => {
    if (!breakdownData) return;

    // Validate facultative cards before saving
    // Compute total retention SI available
    const treatyRetentionSI = breakdownData.treatyAllocations.reduce((s, a) => s + a.retentionSumInsured, 0);
    const extraRetSI = (breakdownData.sumInsured ?? 0) * (extraRetentionPct / 100);
    const unallocatedSI = (breakdownData.sumInsured ?? 0) * (1 - extraRetentionPct / 100) -
      breakdownData.treatyAllocations.reduce((s, a) => s + a.allocatedSumInsured, 0);
    const totalRetentionSI = treatyRetentionSI + extraRetSI + unallocatedSI;

    let cumulativeFacSI = 0;
    for (let i = 0; i < facultativeCards.length; i++) {
      const card = facultativeCards[i];
      const cardLabel = `Facultative Case #${i + 1}`;

      if (!card.cededSumInsured || card.cededSumInsured <= 0) {
        toast({ title: `${cardLabel}: Ceded SI required`, description: 'Please enter a Ceded Sum Insured greater than 0.', variant: 'destructive' });
        return;
      }

      cumulativeFacSI += card.cededSumInsured;
      if (cumulativeFacSI > totalRetentionSI) {
        toast({ title: `${cardLabel}: Ceded SI exceeds available retention`, description: 'Total facultative cessions exceed the available retention SI.', variant: 'destructive' });
        return;
      }

      const missingReinsurer = card.reinsurers.some((r) => !r.name.trim());
      if (missingReinsurer) {
        toast({ title: `${cardLabel}: Reinsurer required`, description: 'Please select a reinsurer for every row in the panel.', variant: 'destructive' });
        return;
      }

      const missingShare = card.reinsurers.some((r) => !(r.sharePercent > 0));
      if (missingShare) {
        toast({ title: `${cardLabel}: Share % required`, description: 'Every reinsurer must have a Share % greater than 0.', variant: 'destructive' });
        return;
      }

      const missingPremium = card.reinsurers.some((r) => !(r.premium > 0));
      if (missingPremium) {
        toast({ title: `${cardLabel}: Premium required`, description: 'Every reinsurer must have a Premium amount greater than 0.', variant: 'destructive' });
        return;
      }

      const invalidCommission = card.reinsurers.some((r) => r.commissionPercent > 100);
      if (invalidCommission) {
        toast({ title: `${cardLabel}: Invalid commission`, description: 'Commission % cannot exceed 100%.', variant: 'destructive' });
        return;
      }

      const totalShare = Math.round(card.reinsurers.reduce((s, r) => s + (r.sharePercent || 0), 0) * 100) / 100;
      if (totalShare !== 100) {
        toast({ title: `${cardLabel}: Invalid share allocation`, description: `Panel share total is ${totalShare.toFixed(2)}%. It must equal 100%.`, variant: 'destructive' });
        return;
      }

      // Soft warnings
      if (card.reinsurers.some((r) => r.commissionPercent > 40)) {
        toast({ title: `${cardLabel}: High commission warning`, description: 'One or more reinsurers have commission above 40%.' });
      }
    }

    const treatyLayers: HandlingLayer[] = breakdownData.treatyAllocations.map((alloc, idx) => {
      const key = allocKey(alloc, idx);
      const override = layerOverrides[key] ?? { overridePremium: 0, isManualOverride: false };
      const manual = manualReinsurerRows[key] ?? [];
      const breakdown = override.isManualOverride && manual.length > 0
        ? manual.map((m) => ({ reinsurerId: m.reinsurerId, name: m.name, brokerId: m.brokerId, brokerName: m.brokerName, sharePercent: m.sharePercent, premium: m.sharedPremium, commissionPercent: m.commissionPercent, commissionAmount: (m.sharedPremium * m.commissionPercent) / 100 }))
        : alloc.reinsurerBreakdown.map((r) => ({ name: r.name, brokerId: r.brokerId, brokerName: r.brokerName, sharePercent: r.sharePercent, premium: r.sharedPremium, commissionPercent: r.commissionPercent, commissionAmount: r.commissionAmount }));
      return {
        layerType: alloc.structureType, treatyId: alloc.treatyId,
        overridePremium: override.overridePremium,
        isFacultativeMode: Boolean(alloc.isFacultative),
        isManualOverride: override.isManualOverride, reinsurerBreakdown: breakdown,
      };
    });

    const facultativeLayers: HandlingLayer[] = facultativeCards.map((c) => ({
      layerType: 'facultative',
      treatyId: undefined,
      overridePremium: c.overridePremium,
      cededSumInsured: c.cededSumInsured,
      isFacultativeMode: true,
      isManualOverride: true,
      reinsurerBreakdown: c.reinsurers.map((r) => ({
        reinsurerId: r.reinsurerId,
        name: r.name,
        rating: r.rating,
        brokerId: r.brokerId,
        brokerName: r.brokerName,
        sharePercent: r.sharePercent,
        risk: r.risk || c.cededSumInsured * (r.sharePercent / 100),
        premium: r.premium,
        commissionPercent: r.commissionPercent,
        commissionAmount: (r.premium * r.commissionPercent) / 100,
      })),
    }));

    saveMutation.mutate({
      layers: [...treatyLayers, ...facultativeLayers],
      extraRetentionPercent: extraRetentionPct,
      cededToTreaty: effectiveTotals.cessionSI,
      netRetention: effectiveTotals.retentionSI,
    });
  };

  const readOnly = isMarketAdmin;
  const currency = breakdownData?.currency ?? 'AED';

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (fetchError || !breakdownData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-slate-600 text-sm">Breakdown details not found.</p>
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation guard dialog */}
      <AlertDialog open={showLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved reinsurance handling changes. Are you sure you want to leave without saving?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowLeaveDialog(false)}>Stay</AlertDialogCancel>
            <AlertDialogAction onClick={() => { pendingNavRef.current?.(); setShowLeaveDialog(false); }}>Leave</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <div className="border-b bg-card px-6 py-4 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto max-w-6xl flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => guardedNavigate(() => navigate(-1))} className="flex items-center gap-2 shrink-0">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <span className="h-6 w-px bg-border" />
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Shield className="h-5 w-5 shrink-0 text-muted-foreground" />
            <h1 className="text-lg font-semibold leading-tight truncate">
              Reinsurance Breakdown {locationState?.quoteNumber ? `— ${locationState.quoteNumber}` : ''} — {locationState?.coverName || breakdownData.coverId}
            </h1>
          </div>
          {!isMarketAdmin && (
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="shrink-0 gap-2"
            >
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Handling Decisions
            </Button>
          )}
        </div>
      </div>

      <div className="container mx-auto max-w-6xl py-8 px-4 space-y-8">
        {/* Overview card */}
        <Card className="border-primary bg-primary text-primary-foreground">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary-foreground">
              <div className="rounded-lg bg-primary-foreground/20 p-2">
                <Layers className="h-4 w-4 text-primary-foreground" />
              </div>
              Cover Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {summaryBoxes.length > 0 && (
              <section aria-labelledby="reinsurance-totals-heading">
                <h3
                  id="reinsurance-totals-heading"
                  className="text-xs font-semibold uppercase tracking-wide text-primary-foreground/80 mb-3"
                >
                  Reinsurance Summary
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {summaryBoxes.map((box) => (
                    <div
                      key={box.label}
                      className="rounded-lg bg-background p-4 shadow-sm text-foreground"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          {box.label}
                        </p>
                        {box.includesFacultative && (
                          <Badge variant="secondary" className="text-[10px]">
                            Includes Facultative
                          </Badge>
                        )}
                      </div>
                      <p className="text-lg font-semibold tabular-nums">
                        {formatCurrency(box.value, currency)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="border-t border-primary-foreground/20" />

            {/* Extra Retention */}
            <div className="rounded-lg bg-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Extra Retention (Manual)</h3>
                  <p className="text-xs text-muted-foreground">
                    Retain a percentage of sum insured before treaty allocation
                  </p>
                </div>
                {!isMarketAdmin && (
                  <Button
                    size="sm"
                    disabled={extraRetentionPct === appliedExtraRetPct}
                    onClick={() => setAppliedExtraRetPct(extraRetentionPct)}
                  >
                    {refetching ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      'Apply'
                    )}
                  </Button>
                )}
              </div>
              <div className={`grid gap-4 items-end ${isMarketAdmin ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {!isMarketAdmin && (
                  <div>
                    <label className="text-xs font-medium text-gray-500">Retention %</label>
                    <FormattedNumberInput
                      value={extraRetentionPct}
                      onChange={(v) => {
                        const val = Math.min(100, Math.max(0, v ?? 0));
                        setExtraRetentionPct(val);
                        setIsDirty(true);
                      }}
                      placeholder="0"
                      allowEmpty

                      useGrouping={false}
                      className="bg-white text-gray-900 border-gray-300"
                    />
                  </div>
                )}
                <div>
                  <label className="text-xs font-medium text-gray-500">Retained Amount</label>
                  <div className="text-sm font-semibold mt-1 text-gray-900">
                    {fmtAED((breakdownData.sumInsured ?? 0) * (extraRetentionPct / 100), currency)}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Effective SI for Treaties</label>
                  <div className="text-sm font-semibold mt-1 text-gray-900">
                    {fmtAED((breakdownData.sumInsured ?? 0) * (1 - extraRetentionPct / 100), currency)}
                  </div>
                </div>
              </div>
              {extraRetentionPct > 0 && (
                <div className="space-y-1.5">
                  <div className="flex h-3 rounded-full overflow-hidden">
                    <div className="bg-primary transition-all" style={{ width: `${extraRetentionPct}%` }} />
                    <div className="bg-gray-200 transition-all" style={{ width: `${100 - extraRetentionPct}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Extra Retention: {extraRetentionPct}%</span>
                    <span>To Treaties: {100 - extraRetentionPct}%</span>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-primary-foreground/20" />

            <section aria-labelledby="treaty-allocations-heading">
              <div className="flex items-center justify-between mb-3 gap-3">
                <h3
                  id="treaty-allocations-heading"
                  className="text-xs font-semibold uppercase tracking-wide text-primary-foreground/80"
                >
                  Treaty Allocations
                </h3>
                {!isMarketAdmin && (
                  <Button
                    size="sm"
                    className="gap-2 shrink-0"
                    onClick={handleAddFacultative}
                    disabled={readOnly}
                  >
                    <Plus className="h-4 w-4" />
                    Need Facultative
                  </Button>
                )}
              </div>
              {enrichedAllocations.length === 0 && facultativeCards.length === 0 ? (
                <div className="rounded-lg border border-dashed border-primary-foreground/30 bg-primary-foreground/5 p-4 text-center text-sm text-primary-foreground/80">
                  No treaties triggered. Use "Need Facultative" to arrange a case-by-case
                  reinsurer panel.
                </div>
              ) : (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {enrichedAllocations.map((alloc, idx) => (
                    <OverviewLayerCard key={allocKey(alloc, idx)} allocation={alloc} currency={currency} />
                  ))}
                  {facultativeCards.map((card) => {
                    const totalPremium = card.reinsurers.reduce((s, r) => s + r.premium, 0);
                    const facAlloc: TreatyAllocation = {
                      treatyId: `fac-${card.id}`,
                      structureType: 'Facultative',
                      treatyCode: `FAC-${card.id.slice(0, 4).toUpperCase()}`,
                      treatyName: 'Facultative Slip',
                      allocatedSumInsured: card.cededSumInsured,
                      allocatedPremium: totalPremium,
                      percentOfTotal: breakdownData.sumInsured > 0 ? (card.cededSumInsured / breakdownData.sumInsured) * 100 : 0,
                      retentionPercent: 0,
                      cessionPercent: 100,
                      retentionAmount: 0,
                      cessionAmount: totalPremium,
                      retentionSumInsured: 0,
                      cessionSumInsured: card.cededSumInsured,
                      commissionPercent: card.reinsurers[0]?.commissionPercent ?? 0,
                      commissionAmount: card.reinsurers.reduce((s, r) => s + (r.premium * r.commissionPercent) / 100, 0),
                      netRetentionAfterCommission: 0,
                      technicalRate: 0,
                      isFacultative: true,
                      reinsurerBreakdown: card.reinsurers.map((r) => ({
                        reinsurerId: r.reinsurerId ?? '',
                        name: r.name,
                        sharePercent: r.sharePercent,
                        risk: r.risk || card.cededSumInsured * (r.sharePercent / 100),
                        sharedPremium: r.premium,
                        commissionPercent: r.commissionPercent,
                        commissionAmount: (r.premium * r.commissionPercent) / 100,
                        ratePer: 0,
                        rateAfterCommission: 0,
                      })),
                    };
                    return <OverviewLayerCard key={card.id} allocation={facAlloc} currency={currency} />;
                  })}
                </div>
              )}
            </section>

            {/* <div className="rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 p-4 space-y-2 text-sm"> */}
              {/* <div className="flex justify-between items-center">
                <span className="font-medium text-primary-foreground">Commission on cession</span>
                <span className="font-bold tabular-nums text-primary-foreground">
                  {fmtAED(effectiveTotals.commission, currency)}
                </span>
              </div> */}
              {/* <div className="flex justify-between items-center">
                <span className="font-medium text-primary-foreground">Net retention (after commission)</span>
                <span className="font-bold tabular-nums text-primary-foreground">
                  {fmtAED(effectiveTotals.netRetentionAfterCommission, currency)}
                </span>
              </div> */}
              {/* <div className="flex justify-between items-center border-t border-primary-foreground/20 pt-2"> */}
                {/* <span className="font-medium text-primary-foreground">Total Retention Available for Facultative</span>
                <span className="font-bold tabular-nums text-primary-foreground">
                  {fmtAED(
                    breakdownData.treatyAllocations.reduce((s, a) => s + a.retentionSumInsured, 0) +
                    (breakdownData.sumInsured ?? 0) * (extraRetentionPct / 100) +
                    ((breakdownData.sumInsured ?? 0) * (1 - extraRetentionPct / 100) -
                      breakdownData.treatyAllocations.reduce((s, a) => s + a.allocatedSumInsured, 0)),
                    currency,
                  )}
                </span> */}
              {/* </div> */}
            {/* </div> */}
          </CardContent>
        </Card>


        {/* Per-layer breakdowns */}
        {enrichedAllocations.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Detailed Breakdown</h2>
          {enrichedAllocations.map((alloc, idx) => {
            const key = allocKey(alloc, idx);
            const override = layerOverrides[key] ?? { overridePremium: 0, isManualOverride: false };
            const manual = manualReinsurerRows[key] ?? [];
            return (
              <LayerBreakdownSection
                key={key}
                allocation={alloc}
                currency={currency}
                override={override}
                manualRows={manual}
                readOnly={readOnly}
                onOverridePremiumChange={(val) => { setIsDirty(true); setLayerOverrides((prev) => ({ ...prev, [key]: { ...prev[key], overridePremium: val } })); }}
                onManualOverrideChange={(val) => {
                  setIsDirty(true);
                  setLayerOverrides((prev) => ({ ...prev, [key]: { ...prev[key], isManualOverride: val } }));
                  if (val && !(manualReinsurerRows[key]?.length)) {
                    setManualReinsurerRows((prev) => ({
                      ...prev,
                      [key]: alloc.reinsurerBreakdown.map((r) => ({
                        reinsurerId: r.reinsurerId,
                        name: r.name,
                        brokerId: r.brokerId,
                        brokerName: r.brokerName,
                        sharePercent: r.sharePercent,
                        sharedPremium: r.sharedPremium,
                        commissionPercent: r.commissionPercent,
                      })),
                    }));
                  }
                }}
                onManualRowChange={(rows) => setManualReinsurerRows((prev) => ({ ...prev, [key]: rows }))}
              />
            );
          })}
        </div>
        )}

        <FacultativeDialog
          open={facultativeDialogOpen}
          onOpenChange={setFacultativeDialogOpen}
          currency={currency}
          onSubmit={handleFacultativeDialogSubmit}
          reinsurers={reinsurersList}
          reinsurersLoading={reinsurersLoading}
          brokers={brokersList}
          grossPremium={breakdownData.grossPremium ?? 0}
          grossSumInsured={breakdownData.sumInsured ?? 0}
          totalRetentionAvailable={
            breakdownData.treatyAllocations.reduce((s, a) => s + a.retentionSumInsured, 0) +
            (breakdownData.sumInsured ?? 0) * (extraRetentionPct / 100) +
            ((breakdownData.sumInsured ?? 0) * (1 - extraRetentionPct / 100) -
              breakdownData.treatyAllocations.reduce((s, a) => s + a.allocatedSumInsured, 0)) -
            facultativeCards.reduce((s, c) => s + c.cededSumInsured, 0)
          }
        />

        {/* Facultative Reinsurance — detail panels (button lives in Treaty Allocations header above) */}
        {facultativeCards.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Facultative Reinsurance
            </h2>
            {facultativeCards.map((card, idx) => (
              <FacultativeCardSection
                key={card.id}
                card={card}
                index={idx}
                currency={currency}
                readOnly={readOnly}
                onChange={(next) => updateFacultativeCard(card.id, next)}
                onRemove={() => removeFacultativeCard(card.id)}
                reinsurers={reinsurersList}
                reinsurersLoading={reinsurersLoading}
                brokers={brokersList}
                grossPremium={breakdownData.grossPremium ?? 0}
                grossSumInsured={breakdownData.sumInsured ?? 0}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
