import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Plus, Trash2, Check, ChevronsUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/shared/utils/lib-utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useToast } from '@/shared/hooks/use-toast';
import { TreatyTriggerConditionsEditor } from './TreatyTriggerConditionsEditor';
import { FormattedNumberInput } from '@/components/ui/FormattedNumberInput';
import type {
  TreatyStructure,
  ReinsurancePanel,
  XOLRateType,
  ReinstatementPremiumType,
  PremiumBase,
  RatingGrade,
} from './types';
import { genId } from './types';
import type { Reinsurer } from '@/features/reinsurers/api/reinsurers';
import { computeSameTypeDateConstraints } from './treatyDateOverlapValidation';

/** Section header badges: `normal-case` avoids the first accordion’s uppercase title styling the badge; fixed min-width keeps Required/Optional chips aligned. Colors use Badge variants (destructive / secondary → tokens in index.css). */
const accordionSectionBadgeClass = cn(
  'normal-case shrink-0 inline-flex min-w-[4.5rem] justify-center items-center text-[10px] leading-none px-2 py-0.5 font-medium',
);

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Sanitise numeric text input: allow only digits + dot, strip leading zeros */
const sanitizeNumeric = (v: string): string => v.replace(/[^0-9.]/g, '').replace(/^0+(\d)/, '$1');

/** Sanitise decimal input: strips non-numeric chars, keeps first dot only, limits decimal places */
const sanitizeDecimalInput = (v: string, maxDecimals = 4): string => {
  let sanitized = v.replace(/[^0-9.]/g, '');
  const parts = sanitized.split('.');
  if (parts.length > 2) {
    sanitized = parts[0] + '.' + parts.slice(1).join('');
  }
  const dotIndex = sanitized.indexOf('.');
  if (dotIndex !== -1 && sanitized.length - dotIndex - 1 > maxDecimals) {
    sanitized = sanitized.slice(0, dotIndex + maxDecimals + 1);
  }
  return sanitized.replace(/^0+(\d)/, '$1');
};

// ─────────────────────────────────────────────────────────────────────────────
// Searchable Combobox helpers
// ─────────────────────────────────────────────────────────────────────────────

function ReinsurerCombobox({
  value,
  onSelect,
  reinsurers,
  disabledIds,
}: {
  value?: string;
  onSelect: (r: Reinsurer) => void;
  reinsurers: Reinsurer[];
  disabledIds?: Set<string>;
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
          className="w-full justify-between font-normal"
        >
          <span className="truncate">{selected ? selected.name : 'Select Reinsurer'}</span>
          <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
        <Command>
          <CommandInput placeholder="Search reinsurer..." />
          <CommandList>
            <CommandEmpty>No reinsurer found.</CommandEmpty>
            <CommandGroup>
              {reinsurers
                .filter((r) => !!r.grade)
                .map((r) => {
                  const isDisabled = disabledIds?.has(r.id) ?? false;
                  return (
                    <CommandItem
                      key={r.id}
                      value={r.name}
                      disabled={isDisabled}
                      onSelect={() => {
                        onSelect(r);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-3.5 w-3.5',
                          value === r.id ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      {r.name}
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

function BrokerCombobox({
  value,
  onSelect,
  brokers,
}: {
  value?: string;
  onSelect: (b: { id: string; name: string; isDirect?: boolean }) => void;
  brokers: Array<{ id: string; name: string; isDirect?: boolean }>;
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
          className="w-full justify-between font-normal"
        >
          <span className="truncate">{selected ? selected.name : 'Select Broker'}</span>
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

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  structure: TreatyStructure;
  onUpdate: (updates: Partial<TreatyStructure>) => void;
  reinsurers?: Reinsurer[];
  brokers?: Array<{ id: string; name: string; isDirect?: boolean }>;
  allBrokers?: Array<{ id: string; name: string }>;
  productId?: string;
  programStartDate?: string | null;
  programEndDate?: string | null;
  productValidityStartDate?: string | null;
  productValidityEndDate?: string | null;
  existingStructures?: TreatyStructure[];
  editingStructureId?: string | null;
}

export function TreatyStructureFormContent({
  structure,
  onUpdate,
  reinsurers = [],
  brokers = [],
  allBrokers = [],
  productId,
  programStartDate,
  programEndDate,
  productValidityStartDate,
  productValidityEndDate,
  existingStructures = [],
  editingStructureId,
}: Props) {
  const { toast } = useToast();
  const panel = structure.reinsurancePanel ?? [];
  const totalCessionPercent = structure.totalCessionPercent ?? 0;

  const dateConstraints = useMemo(() => {
    const effStr = structure.effectiveDate
      ? format(new Date(structure.effectiveDate), 'yyyy-MM-dd')
      : undefined;
    const expStr = structure.expiryDate
      ? format(new Date(structure.expiryDate), 'yyyy-MM-dd')
      : undefined;
    return computeSameTypeDateConstraints(
      structure.structureType,
      existingStructures,
      editingStructureId,
      programStartDate,
      programEndDate,
      effStr,
      expStr,
    );
  }, [
    structure.structureType,
    structure.effectiveDate,
    structure.expiryDate,
    existingStructures,
    editingStructureId,
    programStartDate,
    programEndDate,
  ]);

  // ── Panel helpers ──────────────────────────────────────────────────────────

  const handleAddPanelMember = () => {
    const direct = brokers.find((b) => b.isDirect);
    onUpdate({
      reinsurancePanel: [
        ...panel,
        {
          id: genId('panel'),
          reinsurerName: '',
          brokerId: direct?.id,
          reinsuranceBroker: direct?.name || 'Direct',
          rating: '',
          sharePercent: 0,
          isLead: false,
        },
      ],
    });
  };

  const handleUpdatePanel = (panelId: string, updates: Partial<ReinsurancePanel>) => {
    // Check for duplicate reinsurer+broker combination
    if (updates.reinsurerId || updates.brokerId) {
      const current = panel.find((p) => p.id === panelId);
      if (current) {
        const newReinsurerId = updates.reinsurerId ?? current.reinsurerId;
        const newBrokerId = updates.brokerId ?? current.brokerId;
        if (newReinsurerId && newBrokerId) {
          const duplicate = panel.find(
            (p) =>
              p.id !== panelId && p.reinsurerId === newReinsurerId && p.brokerId === newBrokerId,
          );
          if (duplicate) {
            toast({
              title: 'Duplicate entry',
              description: 'This reinsurer and broker combination already exists in the panel.',
              variant: 'destructive',
            });
            return;
          }
        }
      }
    }

    const updated = panel.map((p) => {
      if (p.id === panelId) return { ...p, ...updates };
      // When toggling lead ON for a member, unset lead on all others
      if (updates.isLead) return { ...p, isLead: false };
      return p;
    });

    if (updates.sharePercent !== undefined) {
      const total = updated.reduce((sum, p) => sum + p.sharePercent, 0);
      if (total > 100) {
        const excess = total - 100;
        const member = updated.find((p) => p.id === panelId);
        if (member) {
          member.sharePercent = Math.max(0, member.sharePercent - excess);
        }
        toast({
          title: 'Cession limit reached',
          description: 'Total cession cannot exceed 100%. Share % has been clamped.',
          variant: 'destructive',
        });
      }
    }

    const total = updated.reduce((sum, p) => sum + p.sharePercent, 0);
    onUpdate({ reinsurancePanel: updated, totalCessionPercent: total });
  };

  const handleDeletePanel = (panelId: string) => {
    const updated = panel.filter((p) => p.id !== panelId);
    const total = updated.reduce((sum, p) => sum + p.sharePercent, 0);
    onUpdate({ reinsurancePanel: updated, totalCessionPercent: total });
  };

  // Auto-seed one blank row so the table is never empty on first render
  useEffect(() => {
    if (panel.length === 0) {
      const direct = brokers.find((b) => b.isDirect);
      onUpdate({
        reinsurancePanel: [
          {
            id: genId('panel'),
            reinsurerName: '',
            brokerId: direct?.id,
            reinsuranceBroker: direct?.name || 'Direct',
            rating: '',
            sharePercent: 0,
            isLead: false,
          },
        ],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Default treaty expiry date from the parent program's end date when not set.
  useEffect(() => {
    if (!programEndDate) return;
    if (structure.expiryDate) return;
    const [year, month, day] = programEndDate.split('-').map(Number);
    if (!year || !month || !day) return;
    onUpdate({ expiryDate: new Date(year, month - 1, day) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programEndDate]);

  // ── Panel sub-section ─────────────────────────────────────────────────────

  const renderPanelSection = (title: string) => (
    <div className="space-y-4 border-t pt-4">
      <div className="flex items-center justify-between">
        <h5 className="font-semibold">{title}</h5>
        <div className="flex items-center gap-3">
          <Badge variant={totalCessionPercent === 100 ? 'default' : 'destructive'}>
            Total Cession: {totalCessionPercent.toFixed(2)}%
          </Badge>
          <Button size="sm" onClick={handleAddPanelMember} className="gap-2">
            <Plus className="w-4 h-4" /> Add Member
          </Button>
        </div>
      </div>
      {panel.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No panel members. Click 'Add Member' to add one.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[25%]">
                Reinsurer Name <span className="text-destructive">*</span>
              </TableHead>
              <TableHead className="w-[25%]">
                Reinsurer Broker Name <span className="text-destructive">*</span>
              </TableHead>
              <TableHead className="w-[8%]">Rating</TableHead>
              <TableHead className="w-[12%]">
                Share % <span className="text-destructive">*</span>
              </TableHead>
              <TableHead className="w-[8%]">Lead?</TableHead>
              <TableHead className="w-[8%] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {panel.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  {reinsurers.length > 0 ? (
                    <ReinsurerCombobox
                      value={p.reinsurerId}
                      onSelect={(r) =>
                        handleUpdatePanel(p.id, {
                          reinsurerId: r.id,
                          reinsurerName: r.name,
                          rating: (r.grade || '') as RatingGrade,
                        })
                      }
                      reinsurers={reinsurers}
                      disabledIds={new Set(
                        panel
                          .filter((other) => other.id !== p.id && other.reinsurerId)
                          .map((other) => other.reinsurerId!)
                      )}
                    />
                  ) : (
                    <Input
                      value={p.reinsurerName}
                      onChange={(e) => handleUpdatePanel(p.id, { reinsurerName: e.target.value })}
                      placeholder="Reinsurer name"
                    />
                  )}
                </TableCell>
                <TableCell>
                  {brokers.length > 0 ? (
                    <BrokerCombobox
                      value={p.brokerId}
                      onSelect={(b) =>
                        handleUpdatePanel(p.id, { brokerId: b.id, reinsuranceBroker: b.name })
                      }
                      brokers={brokers}
                    />
                  ) : (
                    <Input
                      value={p.reinsuranceBroker}
                      onChange={(e) =>
                        handleUpdatePanel(p.id, { reinsuranceBroker: e.target.value })
                      }
                      placeholder="Broker name"
                    />
                  )}
                </TableCell>
                <TableCell>
                  {p.rating ? (
                    <Badge variant="outline" className="text-xs whitespace-nowrap text-black">
                      {p.rating}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min={0}
                    max={100}
                    value={p.sharePercent === 0 ? '' : String(p.sharePercent)}
                    placeholder="0"
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === '') {
                        handleUpdatePanel(p.id, { sharePercent: 0 });
                        return;
                      }
                      const parsed = parseFloat(raw);
                      if (Number.isNaN(parsed)) return;
                      const num = Math.min(100, Math.max(0, parsed));
                      handleUpdatePanel(p.id, { sharePercent: num });
                    }}
                    className="w-24"
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={p.isLead}
                    onCheckedChange={(checked) => handleUpdatePanel(p.id, { isLead: checked })}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleDeletePanel(p.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );

  // ── Commission-type helpers ────────────────────────────────────────────────

  const isQS = structure.structureType === 'Quota Share (QS)';
  const isSurplus = structure.structureType === 'Surplus';
  const showCommissionConfig = isQS || isSurplus;
  const commissionType = isQS ? structure.cedingCommissionType : structure.surplusCommissionType;
  const profitEnabled = isQS
    ? structure.profitCommissionEnabled
    : structure.surplusProfitCommissionEnabled;
  const showLossParticipation =
    showCommissionConfig && (commissionType === 'Flat' || commissionType === 'Sliding Scale');

  const setCommissionType = (v: 'Flat' | 'Sliding Scale' | '') =>
    isQS ? onUpdate({ cedingCommissionType: v }) : onUpdate({ surplusCommissionType: v });

  const setProfitEnabled = (v: boolean) =>
    isQS
      ? onUpdate({ profitCommissionEnabled: v })
      : onUpdate({ surplusProfitCommissionEnabled: v });

  const defaultQSBands = [
    { minLR: 0, maxLR: 60, commissionPercent: 35 },
    { minLR: 60, maxLR: 80, commissionPercent: 30 },
    { minLR: 80, maxLR: 100, commissionPercent: 25 },
  ];

  const handleAddQSBand = () => {
    if (structure.lossRatioBands.length === 0) {
      onUpdate({ lossRatioBands: defaultQSBands });
    } else {
      onUpdate({
        lossRatioBands: [...structure.lossRatioBands, { minLR: 0, maxLR: 0, commissionPercent: 0 }],
      });
    }
  };

  const handleDeleteQSBand = (idx: number) =>
    onUpdate({ lossRatioBands: structure.lossRatioBands.filter((_, i) => i !== idx) });

  const handleUpdateQSBand = (
    idx: number,
    patch: Partial<{ minLR: number; maxLR: number; commissionPercent: number }>,
  ) => {
    const updated = [...structure.lossRatioBands];
    updated[idx] = { ...updated[idx], ...patch };
    onUpdate({ lossRatioBands: updated });
  };

  const handleAddSurplusBand = () => {
    if (structure.surplusLossRatioBands.length === 0) {
      onUpdate({ surplusLossRatioBands: defaultQSBands });
    } else {
      onUpdate({
        surplusLossRatioBands: [
          ...structure.surplusLossRatioBands,
          { minLR: 0, maxLR: 0, commissionPercent: 0 },
        ],
      });
    }
  };

  const handleDeleteSurplusBand = (idx: number) =>
    onUpdate({
      surplusLossRatioBands: structure.surplusLossRatioBands.filter((_, i) => i !== idx),
    });

  const handleUpdateSurplusBand = (
    idx: number,
    patch: Partial<{ minLR: number; maxLR: number; commissionPercent: number }>,
  ) => {
    const updated = [...structure.surplusLossRatioBands];
    updated[idx] = { ...updated[idx], ...patch };
    onUpdate({ surplusLossRatioBands: updated });
  };

  // Loss Participation "Add row" defaults differ from commission defaults
  const defaultLossParticipationRows = [
    { minLR: 70, maxLR: 80, commissionPercent: 30 },
    { minLR: 80, maxLR: 90, commissionPercent: 50 },
    { minLR: 90, maxLR: 100, commissionPercent: 70 },
  ];

  const handleAddQSLossParticipationRow = () => {
    if (structure.lossRatioBands.length === 0) {
      onUpdate({ lossRatioBands: defaultLossParticipationRows });
    } else {
      onUpdate({
        lossRatioBands: [...structure.lossRatioBands, { minLR: 0, maxLR: 0, commissionPercent: 0 }],
      });
    }
  };

  const handleAddSurplusLossParticipationRow = () => {
    if (structure.surplusLossRatioBands.length === 0) {
      onUpdate({ surplusLossRatioBands: defaultLossParticipationRows });
    } else {
      onUpdate({
        surplusLossRatioBands: [
          ...structure.surplusLossRatioBands,
          { minLR: 0, maxLR: 0, commissionPercent: 0 },
        ],
      });
    }
  };

  const bands = isQS ? structure.lossRatioBands : structure.surplusLossRatioBands;

  // Treaty Trigger Amount is shown only for Surplus; Max Treaty Capacity is shown for both QS and Surplus

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Accordion type="single" collapsible defaultValue="basic-details" className="space-y-3">
      {/* ── Treaty Basic Details ── */}
      <AccordionItem value="basic-details" className="border rounded-lg overflow-hidden">
        <AccordionTrigger className="px-5 py-4 text-sm font-semibold hover:no-underline hover:bg-muted/40">
          <span className="flex items-center gap-2">
            <span className="uppercase tracking-wide text-teal-700">Treaty Basic Details</span>
            <Badge variant="destructive" className={accordionSectionBadgeClass}>
              Required
            </Badge>
          </span>
        </AccordionTrigger>
        <AccordionContent className="px-5 pb-5">
          <div className="space-y-4 pt-2">
            {/* Row 1: Treaty Title | Treaty Code (auto-generated, read-only) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Treaty Title <span className="text-destructive">*</span></Label>
                <Input
                  value={structure.name}
                  onChange={(e) => onUpdate({ name: e.target.value })}
                  placeholder="e.g., Layer 1, Primary QS"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Treaty Code / Reference</Label>
                <Input
                  value={structure.treatyCode}
                  disabled
                  className="mt-1 bg-muted"
                  placeholder="Auto-generated"
                />
              </div>
            </div>

            {/* Row 2: Effective Date | Expiry Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Effective Date <span className="text-destructive">*</span></Label>
                <DatePicker
                  value={
                    structure.effectiveDate
                      ? format(structure.effectiveDate, 'yyyy-MM-dd')
                      : undefined
                  }
                  onChange={(dateString) => {
                    if (dateString) {
                      const [year, month, day] = dateString.split('-').map(Number);
                      onUpdate({ effectiveDate: new Date(year, month - 1, day) });
                    } else {
                      onUpdate({ effectiveDate: null });
                    }
                  }}
                  placeholder="Select date"
                  className="mt-1"
                  min={dateConstraints.effectiveDateMin ?? programStartDate ?? productValidityStartDate ?? undefined}
                  max={dateConstraints.effectiveDateMax ?? programEndDate ?? productValidityEndDate ?? undefined}
                  disabledRanges={dateConstraints.occupiedRanges}
                />
              </div>
              <div>
                <Label>Expiry Date <span className="text-destructive">*</span></Label>
                <DatePicker
                  value={
                    structure.expiryDate ? format(structure.expiryDate, 'yyyy-MM-dd') : undefined
                  }
                  onChange={(dateString) => {
                    if (dateString) {
                      const [year, month, day] = dateString.split('-').map(Number);
                      onUpdate({ expiryDate: new Date(year, month - 1, day) });
                    } else {
                      onUpdate({ expiryDate: null });
                    }
                  }}
                  placeholder="Select date"
                  className="mt-1"
                  min={dateConstraints.expiryDateMin ?? (structure.effectiveDate ? format(new Date(structure.effectiveDate), 'yyyy-MM-dd') : undefined) ?? programStartDate ?? productValidityStartDate ?? undefined}
                  max={dateConstraints.expiryDateMax ?? programEndDate ?? productValidityEndDate ?? undefined}
                  disabledRanges={dateConstraints.occupiedRanges}
                />
              </div>
            </div>

            {/* Row 3: Treaty Year | Currency */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Treaty Year <span className="text-destructive">*</span></Label>
                <DatePicker
                  mode="year"
                  value={structure.treatyYear}
                  onChange={(val) => onUpdate({ treatyYear: val ?? '' })}
                  placeholder="Select year"
                  className="mt-1"
                  min={String(new Date().getFullYear())}
                />
                <p className="text-xs text-teal-600 mt-1">Important for annual accounts</p>
              </div>
              <div>
                <Label>Currency <span className="text-destructive">*</span></Label>
                <Select value={structure.currency} onValueChange={(v) => onUpdate({ currency: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {['AED', 'USD', 'EUR', 'GBP', 'SAR', 'Other'].map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 6: Description (full width) */}
            <div>
              <Label>Description</Label>
              <Input
                value={structure.notes}
                onChange={(e) => onUpdate({ notes: e.target.value })}
                placeholder="Optional description or notes"
                className="mt-1"
              />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* ── Treaty Trigger ── */}
      <AccordionItem value="treaty-trigger" className="border rounded-lg overflow-hidden">
        <AccordionTrigger className="px-5 py-4 font-semibold hover:no-underline hover:bg-muted/40">
          <span className="flex items-center gap-2">
            Treaty Trigger
            <Badge variant="secondary" className={accordionSectionBadgeClass}>
              Optional
            </Badge>
          </span>
        </AccordionTrigger>
        <AccordionContent className="px-5 pb-5">
          <div className="pt-2">
            <TreatyTriggerConditionsEditor
              productId={productId}
              inclusionRules={structure.inclusionRules ?? []}
              exclusionRules={structure.exclusionRules ?? []}
              onUpdate={(updates) => onUpdate(updates)}
            />
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* ── Structure Type Settings ── */}
      <AccordionItem value="structure-type-settings" className="border rounded-lg overflow-hidden">
        <AccordionTrigger className="px-5 py-4 font-semibold hover:no-underline hover:bg-muted/40">
          <span className="flex items-center gap-2">
            Treaty Structure Type
            <Badge variant="destructive" className={accordionSectionBadgeClass}>
              Required
            </Badge>
          </span>
        </AccordionTrigger>
        <AccordionContent className="px-5 pb-5">
          <div className="space-y-4 pt-2">
            {/* Premium Basis */}
            <div className="space-y-2">
              <Label>Premium Basis <span className="text-destructive">*</span></Label>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    { value: 'OGR', label: 'OGR', sub: 'Original Gross Premium' },
                    { value: 'ONR', label: 'ONR', sub: 'Original Net Premium' },
                  ] as const
                ).map(({ value, label, sub }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onUpdate({ premiumBasisOgrOnr: value })}
                    className={cn(
                      'rounded-lg border p-4 text-left transition-colors',
                      structure.premiumBasisOgrOnr === value
                        ? 'border-amber-400 bg-amber-50'
                        : 'border-border bg-background hover:bg-muted/40',
                    )}
                  >
                    <p className="font-semibold text-sm">{label}</p>
                    <p className="text-xs text-amber-600 mt-0.5">{sub}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Quota Share ── */}
            {structure.structureType === 'Quota Share (QS)' && (
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Quota Share Settings</h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Cedant Retention % <span className="text-destructive">*</span></Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={structure.retentionPercent === 0 ? '' : structure.retentionPercent}
                      onChange={(e) => {
                        const v = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0));
                        onUpdate({ retentionPercent: v, quotaSharePercent: 100 - v });
                      }}
                      placeholder="e.g., 70"
                    />
                  </div>
                  <div>
                    <Label>Cession % <span className="text-destructive">*</span></Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={structure.quotaSharePercent === 0 ? '' : structure.quotaSharePercent}
                      onChange={(e) => {
                        const v = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0));
                        onUpdate({ quotaSharePercent: v, retentionPercent: 100 - v });
                      }}
                      placeholder="e.g., 30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Max Treaty Capacity <span className="text-destructive">*</span></Label>
                    <FormattedNumberInput
                      value={structure.maxTreatyCapacity}
                      onChange={(v) => onUpdate({ maxTreatyCapacity: v })}
                      allowDecimals
                      placeholder="e.g., 5,000,000"
                    />
                  </div>
                </div>

                {/* Split bar */}
                {((structure.quotaSharePercent ?? 0) > 0 ||
                  (structure.retentionPercent ?? 0) > 0) && (
                  <div className="space-y-1.5">
                    <div className="flex h-3 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 transition-all"
                        style={{ width: `${structure.retentionPercent}%` }}
                      />
                      <div
                        className="bg-amber-500 transition-all"
                        style={{ width: `${structure.quotaSharePercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Cedant Retention: {structure.retentionPercent}%</span>
                      <span>Cession: {structure.quotaSharePercent}%</span>
                    </div>
                  </div>
                )}

                {renderPanelSection('Capacity & Panel Setup')}
              </div>
            )}

            {/* ── Surplus ── */}
            {structure.structureType === 'Surplus' && (
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Surplus Settings</h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Treaty Trigger Amount</Label>
                    <FormattedNumberInput
                      value={structure.treatyTriggerAmount}
                      onChange={(v) => onUpdate({ treatyTriggerAmount: v })}
                      allowDecimals
                      placeholder="e.g., 0"
                    />
                  </div>
                  <div>
                    <Label>Max Treaty Capacity <span className="text-destructive">*</span></Label>
                    <FormattedNumberInput
                      value={structure.surplusMaxTreatyCapacity}
                      onChange={(v) => onUpdate({ surplusMaxTreatyCapacity: v })}
                      allowDecimals
                      placeholder="e.g., 10,000,000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Cedant Retention %</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={structure.surplusRetentionPercent === 0 ? '' : structure.surplusRetentionPercent}
                      onChange={(e) => {
                        const v = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0));
                        onUpdate({ surplusRetentionPercent: v, surplusSeededPercent: 100 - v });
                      }}
                      placeholder="e.g., 50"
                    />
                  </div>
                  <div>
                    <Label>Cession %</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={structure.surplusSeededPercent === 0 ? '' : structure.surplusSeededPercent}
                      onChange={(e) => {
                        const v = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0));
                        onUpdate({ surplusSeededPercent: v, surplusRetentionPercent: 100 - v });
                      }}
                      placeholder="e.g., 50"
                    />
                  </div>
                </div>

                {/* Split bar */}
                {((structure.surplusSeededPercent ?? 0) > 0 ||
                  (structure.surplusRetentionPercent ?? 0) > 0) && (
                  <div className="space-y-1.5">
                    <div className="flex h-3 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 transition-all"
                        style={{ width: `${structure.surplusRetentionPercent ?? 0}%` }}
                      />
                      <div
                        className="bg-amber-500 transition-all"
                        style={{ width: `${structure.surplusSeededPercent ?? 0}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Cedant Retention: {structure.surplusRetentionPercent ?? 0}%</span>
                      <span>Cession: {structure.surplusSeededPercent ?? 0}%</span>
                    </div>
                  </div>
                )}

                {renderPanelSection('Capacity & Panel Setup')}
              </div>
            )}

            {/* ── Excess of Loss (XOL) ── */}
            {structure.structureType === 'Excess of Loss (XOL)' && (
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">XOL (Excess of Loss) Settings</h4>
                {/* Row 1: Cover Basis | Layer Position */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Cover Basis <span className="text-destructive">*</span></Label>
                    <Select
                      value={structure.xolCoverBasis}
                      onValueChange={(v) =>
                        onUpdate({ xolCoverBasis: v as 'Risk' | 'Event' | 'Cat' })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Risk/Event/Cat" />
                      </SelectTrigger>
                      <SelectContent>
                        {(['Risk', 'Event', 'Cat'] as const).map((b) => (
                          <SelectItem key={b} value={b}>
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Layer Position</Label>
                    <Input
                      type="number"
                      min={1}
                      value={structure.xolLayerPosition}
                      onChange={(e) =>
                        onUpdate({ xolLayerPosition: Math.max(1, parseInt(e.target.value) || 1) })
                      }
                    />
                  </div>
                </div>
                {/* Row 2: XOL Rate | Rate Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>XOL Rate (%)</Label>
                    <Input
                      type="number"
                      value={structure.xolRate}
                      onChange={(e) => onUpdate({ xolRate: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label>Rate Type</Label>
                    <Select
                      value={structure.xolRateType}
                      onValueChange={(v) => onUpdate({ xolRateType: v as XOLRateType })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Rate Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {(['Per Occurrence', 'Per Risk', 'Per Policy', 'Flat Rate'] as const).map(
                          (t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Minimum Deposit Premium (MDP)</Label>
                  <FormattedNumberInput
                    value={structure.xolMinimumDepositPremium}
                    onChange={(v) => onUpdate({ xolMinimumDepositPremium: v })}
                    allowDecimals
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Minimum premium amount required for the treaty
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Limit per Occurrence <span className="text-destructive">*</span></Label>
                    <FormattedNumberInput
                      value={structure.xolLimitPerOccurrence}
                      onChange={(v) => onUpdate({ xolLimitPerOccurrence: v })}
                      allowDecimals
                    />
                  </div>
                  <div>
                    <Label>Deductible / Retention per Occurrence <span className="text-destructive">*</span></Label>
                    <FormattedNumberInput
                      value={structure.xolDeductible}
                      onChange={(v) => onUpdate({ xolDeductible: v })}
                      allowDecimals
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Aggregate Limit</Label>
                    <FormattedNumberInput
                      value={structure.xolAggregateLimit}
                      onChange={(v) => onUpdate({ xolAggregateLimit: v })}
                      allowDecimals
                    />
                  </div>
                  <div>
                    <Label>Reinstatements (Number)</Label>
                    <Input
                      type="number"
                      value={structure.xolReinstatements}
                      onChange={(e) =>
                        onUpdate({ xolReinstatements: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label>Reinstatement Premium Type</Label>
                  <Select
                    value={structure.xolReinstatementPremiumType}
                    onValueChange={(v) =>
                      onUpdate({ xolReinstatementPremiumType: v as ReinstatementPremiumType })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {(['Pro-rata', 'Fixed', 'Sliding'] as const).map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {renderPanelSection('Panel Setup')}
              </div>
            )}

            {/* ── Stop Loss ── */}
            {structure.structureType === 'Stop Loss' && (
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Stop Loss Settings</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Loss Ratio Attachment (%) <span className="text-destructive">*</span></Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min={0}
                      max={100}
                      value={structure.stopLossAttachment === 0 ? '' : String(structure.stopLossAttachment)}
                      placeholder="0"
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === '') { onUpdate({ stopLossAttachment: 0 }); return; }
                        const parsed = parseFloat(raw);
                        if (Number.isNaN(parsed)) return;
                        const v = Math.min(100, Math.max(0, parsed));
                        onUpdate({ stopLossAttachment: v });
                      }}
                    />
                  </div>
                  <div>
                    <Label>Loss Ratio Detachment (%) <span className="text-destructive">*</span></Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min={0}
                      max={100}
                      value={structure.stopLossDetachment === 0 ? '' : String(structure.stopLossDetachment)}
                      placeholder="0"
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === '') { onUpdate({ stopLossDetachment: 0 }); return; }
                        const parsed = parseFloat(raw);
                        if (Number.isNaN(parsed)) return;
                        const v = Math.min(100, Math.max(0, parsed));
                        onUpdate({ stopLossDetachment: v });
                      }}
                    />
                  </div>
                </div>
                <div>
                  <Label>Premium Base</Label>
                  <Select
                    value={structure.stopLossPremiumBase}
                    onValueChange={(v) => onUpdate({ stopLossPremiumBase: v as PremiumBase })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {(['Net Earned Premium', 'Gross Earned Premium'] as const).map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Row 3: Limit of Liability | Annual Aggregate Limit */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Limit of Liability</Label>
                    <FormattedNumberInput
                      value={structure.stopLossLimitOfLiability}
                      onChange={(v) => onUpdate({ stopLossLimitOfLiability: v })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Maximum recoverable</p>
                  </div>
                  <div>
                    <Label>Annual Aggregate Limit</Label>
                    <FormattedNumberInput
                      value={structure.stopLossAnnualAggregateLimit}
                      onChange={(v) => onUpdate({ stopLossAnnualAggregateLimit: v })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Common in stop loss</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* ── Commission Types ── */}
      <AccordionItem value="commission-type" className="border rounded-lg overflow-hidden">
        <AccordionTrigger className="px-5 py-4 font-semibold hover:no-underline hover:bg-muted/40">
          <span className="flex items-center gap-2">
            Commission Types
            <Badge variant="destructive" className={accordionSectionBadgeClass}>
              Required
            </Badge>
          </span>
        </AccordionTrigger>
        <AccordionContent className="px-5 pb-5">
          <div className="space-y-4 pt-2">
            {/* Part 1 — Brokerage & Fronting Fee (all types) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Brokerage % <span className="text-destructive">*</span></Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.0001"
                  min={0}
                  max={100}
                  value={structure.brokeragePercent === 0 ? '' : String(structure.brokeragePercent)}
                  placeholder="e.g., 27.1234"
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === '') { onUpdate({ brokeragePercent: 0 }); return; }
                    const parsed = parseFloat(raw);
                    if (Number.isNaN(parsed)) return;
                    const v = Math.min(100, Math.max(0, parsed));
                    onUpdate({ brokeragePercent: v });
                  }}
                />
              </div>
              <div>
                <Label>Override / Fronting Fee % <span className="text-destructive">*</span></Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.0001"
                  min={0}
                  max={100}
                  value={structure.overrideFrontingFeePercent === 0 ? '' : String(structure.overrideFrontingFeePercent)}
                  placeholder="e.g., 5.2500"
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === '') { onUpdate({ overrideFrontingFeePercent: 0 }); return; }
                    const parsed = parseFloat(raw);
                    if (Number.isNaN(parsed)) return;
                    const v = Math.min(100, Math.max(0, parsed));
                    onUpdate({ overrideFrontingFeePercent: v });
                  }}
                />
              </div>
            </div>

            {/* Part 2 — Commission Type Configuration (QS and Surplus only) */}
            {showCommissionConfig && (
              <div className="space-y-4 border-t pt-4">
                <h5 className="font-semibold">Commission Type</h5>

                {/* 2a — Commission type checkboxes */}
                <div className="flex flex-wrap gap-4">
                  {(['Flat', 'Sliding Scale'] as const).map((type) => (
                    <label
                      key={type}
                      htmlFor={type}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={commissionType === type}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setCommissionType(type);
                            // auto-populate default bands if empty
                            if (isQS && structure.lossRatioBands.length === 0) {
                              onUpdate({ lossRatioBands: defaultQSBands });
                            } else if (isSurplus && structure.surplusLossRatioBands.length === 0) {
                              onUpdate({ surplusLossRatioBands: defaultQSBands });
                            }
                          } else {
                            setCommissionType('');
                          }
                        }}
                        id={type}
                      />
                      {type}
                    </label>
                  ))}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={profitEnabled}
                      onCheckedChange={(checked) => setProfitEnabled(!!checked)}
                    />
                    Profit Commission
                  </label>
                </div>

                {/* 2b — Flat fields */}
                {commissionType === 'Flat' && (
                  <div>
                    <Label>Ceding Commission % <span className="text-destructive">*</span></Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min={0}
                      max={100}
                      value={
                        (isQS ? structure.cedingCommissionPercent : structure.surplusCedingCommission) === 0
                          ? ''
                          : String(isQS ? structure.cedingCommissionPercent : structure.surplusCedingCommission)
                      }
                      placeholder="0"
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === '') {
                          isQS ? onUpdate({ cedingCommissionPercent: 0 }) : onUpdate({ surplusCedingCommission: 0 });
                          return;
                        }
                        const parsed = parseFloat(raw);
                        if (Number.isNaN(parsed)) return;
                        const v = Math.min(100, Math.max(0, parsed));
                        isQS
                          ? onUpdate({ cedingCommissionPercent: v })
                          : onUpdate({ surplusCedingCommission: v });
                      }}
                      className="mt-1"
                    />
                  </div>
                )}

                {/* 2c — Sliding Scale fields */}
                {commissionType === 'Sliding Scale' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Booking (Provisional) Commission % <span className="text-destructive">*</span></Label>
                        <Input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          min={0}
                          max={100}
                          value={
                            (isQS ? structure.bookingCommission : structure.surplusBookingCommission) === 0
                              ? ''
                              : String(isQS ? structure.bookingCommission : structure.surplusBookingCommission)
                          }
                          placeholder="0"
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (raw === '') {
                              isQS ? onUpdate({ bookingCommission: 0 }) : onUpdate({ surplusBookingCommission: 0 });
                              return;
                            }
                            const parsed = parseFloat(raw);
                            if (Number.isNaN(parsed)) return;
                            const v = Math.min(100, Math.max(0, parsed));
                            isQS
                              ? onUpdate({ bookingCommission: v })
                              : onUpdate({ surplusBookingCommission: v });
                          }}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex items-center gap-2 mt-6">
                        <Checkbox
                          checked={
                            isQS
                              ? structure.finalAdjustmentAtYearEnd
                              : structure.surplusFinalAdjustmentAtYearEnd
                          }
                          onCheckedChange={(v) =>
                            isQS
                              ? onUpdate({ finalAdjustmentAtYearEnd: !!v })
                              : onUpdate({ surplusFinalAdjustmentAtYearEnd: !!v })
                          }
                        />
                        <Label>Final adjustment at year-end</Label>
                      </div>
                    </div>

                    {/* Sliding Scale Commission table */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Sliding Scale Commission</div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Loss Ratio Min %</TableHead>
                            <TableHead>Loss Ratio Max %</TableHead>
                            <TableHead>Commission %</TableHead>
                            <TableHead />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {bands.map((band, idx) => (
                            <TableRow key={idx}>
                              <TableCell>
                                <Input
                                  type="number"
                                  inputMode="decimal"
                                  step="0.01"
                                  min={0}
                                  max={100}
                                  value={band.minLR === 0 ? '' : String(band.minLR)}
                                  placeholder="0"
                                  onChange={(e) => {
                                    const raw = e.target.value;
                                    if (raw === '') { isQS ? handleUpdateQSBand(idx, { minLR: 0 }) : handleUpdateSurplusBand(idx, { minLR: 0 }); return; }
                                    const parsed = parseFloat(raw);
                                    if (Number.isNaN(parsed)) return;
                                    const v = Math.min(100, Math.max(0, parsed));
                                    isQS
                                      ? handleUpdateQSBand(idx, { minLR: v })
                                      : handleUpdateSurplusBand(idx, { minLR: v });
                                  }}
                                  className="w-24"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  inputMode="decimal"
                                  step="0.01"
                                  min={0}
                                  max={100}
                                  value={band.maxLR === 0 ? '' : String(band.maxLR)}
                                  placeholder="0"
                                  onChange={(e) => {
                                    const raw = e.target.value;
                                    if (raw === '') { isQS ? handleUpdateQSBand(idx, { maxLR: 0 }) : handleUpdateSurplusBand(idx, { maxLR: 0 }); return; }
                                    const parsed = parseFloat(raw);
                                    if (Number.isNaN(parsed)) return;
                                    const v = Math.min(100, Math.max(0, parsed));
                                    isQS
                                      ? handleUpdateQSBand(idx, { maxLR: v })
                                      : handleUpdateSurplusBand(idx, { maxLR: v });
                                  }}
                                  className="w-24"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  inputMode="decimal"
                                  step="0.01"
                                  min={0}
                                  max={100}
                                  value={band.commissionPercent === 0 ? '' : String(band.commissionPercent)}
                                  placeholder="0"
                                  onChange={(e) => {
                                    const raw = e.target.value;
                                    if (raw === '') { isQS ? handleUpdateQSBand(idx, { commissionPercent: 0 }) : handleUpdateSurplusBand(idx, { commissionPercent: 0 }); return; }
                                    const parsed = parseFloat(raw);
                                    if (Number.isNaN(parsed)) return;
                                    const v = Math.min(100, Math.max(0, parsed));
                                    isQS
                                      ? handleUpdateQSBand(idx, { commissionPercent: v })
                                      : handleUpdateSurplusBand(idx, { commissionPercent: v });
                                  }}
                                  className="w-24"
                                />
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    isQS ? handleDeleteQSBand(idx) : handleDeleteSurplusBand(idx)
                                  }
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={isQS ? handleAddQSBand : handleAddSurplusBand}
                        className="gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Row
                      </Button>
                    </div>
                  </div>
                )}

                {/* 2d — Profit Commission fields (QS & Surplus) */}
                {profitEnabled && (isQS || isSurplus) && (
                  <div className="space-y-4 border-l-2 border-muted pl-4">
                    <h6 className="font-medium">Profit Commission Configuration</h6>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Profit Commission % <span className="text-destructive">*</span></Label>
                        <Input
                          type="number"
                          value={structure.profitCommissionPercent || ''}
                          onChange={(e) =>
                            onUpdate({ profitCommissionPercent: parseFloat(e.target.value) || 0 })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Carry Forward Loss % <span className="text-destructive">*</span></Label>
                        <Input
                          type="number"
                          value={structure.carryForwardLossPercent || ''}
                          onChange={(e) =>
                            onUpdate({ carryForwardLossPercent: parseFloat(e.target.value) || 0 })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Expense Ratio % <span className="text-destructive">*</span></Label>
                        <Input
                          type="number"
                          value={structure.expenseRatioPercent || ''}
                          onChange={(e) =>
                            onUpdate({ expenseRatioPercent: parseFloat(e.target.value) || 0 })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div className="flex items-center gap-2 mt-6">
                        <Checkbox
                          checked={structure.deficitCarryForward}
                          onCheckedChange={(v) => onUpdate({ deficitCarryForward: !!v })}
                        />
                        <Label>Deficit Carry Forward</Label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* ── Loss Participation / Loss Corridor ── */}
      {showLossParticipation && (
        <AccordionItem value="loss-participation" className="border rounded-lg overflow-hidden">
          <AccordionTrigger className="px-5 py-4 font-semibold hover:no-underline hover:bg-muted/40">
            Loss Participation / Loss Corridor
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5">
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h6 className="font-medium">Loss Participation</h6>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={
                    isQS ? handleAddQSLossParticipationRow : handleAddSurplusLossParticipationRow
                  }
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Row
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      Loss Ratio Min % <span className="text-destructive">*</span>
                    </TableHead>
                    <TableHead>
                      Loss Ratio Max % <span className="text-destructive">*</span>
                    </TableHead>
                    <TableHead>
                      Cedant Participation % <span className="text-destructive">*</span>
                    </TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bands.map((band, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          min={0}
                          max={100}
                          value={band.minLR === 0 ? '' : String(band.minLR)}
                          placeholder="0"
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (raw === '') { isQS ? handleUpdateQSBand(idx, { minLR: 0 }) : handleUpdateSurplusBand(idx, { minLR: 0 }); return; }
                            const parsed = parseFloat(raw);
                            if (Number.isNaN(parsed)) return;
                            const v = Math.min(100, Math.max(0, parsed));
                            isQS
                              ? handleUpdateQSBand(idx, { minLR: v })
                              : handleUpdateSurplusBand(idx, { minLR: v });
                          }}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          min={0}
                          max={100}
                          value={band.maxLR === 0 ? '' : String(band.maxLR)}
                          placeholder="0"
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (raw === '') { isQS ? handleUpdateQSBand(idx, { maxLR: 0 }) : handleUpdateSurplusBand(idx, { maxLR: 0 }); return; }
                            const parsed = parseFloat(raw);
                            if (Number.isNaN(parsed)) return;
                            const v = Math.min(100, Math.max(0, parsed));
                            isQS
                              ? handleUpdateQSBand(idx, { maxLR: v })
                              : handleUpdateSurplusBand(idx, { maxLR: v });
                          }}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          min={0}
                          max={100}
                          value={band.commissionPercent === 0 ? '' : String(band.commissionPercent)}
                          placeholder="0"
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (raw === '') { isQS ? handleUpdateQSBand(idx, { commissionPercent: 0 }) : handleUpdateSurplusBand(idx, { commissionPercent: 0 }); return; }
                            const parsed = parseFloat(raw);
                            if (Number.isNaN(parsed)) return;
                            const v = Math.min(100, Math.max(0, parsed));
                            isQS
                              ? handleUpdateQSBand(idx, { commissionPercent: v })
                              : handleUpdateSurplusBand(idx, { commissionPercent: v });
                          }}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            isQS ? handleDeleteQSBand(idx) : handleDeleteSurplusBand(idx)
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </AccordionContent>
        </AccordionItem>
      )}

      {/* ── Claims & Recoveries Rules ── */}
      <AccordionItem value="claims-recoveries" className="border rounded-lg overflow-hidden">
        <AccordionTrigger className="px-5 py-4 font-semibold hover:no-underline hover:bg-muted/40">
          <span className="flex items-center gap-2">
            Claims & Recoveries Rules
            <Badge variant="secondary" className={accordionSectionBadgeClass}>
              Optional
            </Badge>
          </span>
        </AccordionTrigger>
        <AccordionContent className="px-5 pb-5">
          <div className="space-y-4 pt-2">
            {/* Persisted fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Switch
                  id="cashCallAllowed"
                  checked={structure.cashCallAllowed}
                  onCheckedChange={(checked) => onUpdate({ cashCallAllowed: checked })}
                />
                <Label htmlFor="cashCallAllowed">Cash Call Allowed</Label>
              </div>
              <div>
                <Label>Claim Notification Threshold</Label>
                <FormattedNumberInput
                  value={structure.claimNotificationThreshold}
                  onChange={(v) => onUpdate({ claimNotificationThreshold: v })}
                  placeholder="e.g., 100,000"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Claim Settlement Basis</Label>
              <Select
                value={structure.claimSettlementBasis}
                onValueChange={(v) =>
                  onUpdate({ claimSettlementBasis: v as TreatyStructure['claimSettlementBasis'] })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select basis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Follow the fortunes">Follow the fortunes</SelectItem>
                  <SelectItem value="Follow the settlements">Follow the settlements</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Non-persisted fields */}
            <div>
              <Label>Claims Notification Rules</Label>
              <Textarea
                placeholder="Define rules for claims notification to reinsurers"
                rows={3}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Recovery Process Rules</Label>
              <Textarea
                placeholder="Define rules for recovery process and procedures"
                rows={3}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Claims Settlement Rules</Label>
              <Textarea
                placeholder="Define rules for claims settlement with reinsurers"
                rows={3}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Claims Reporting Frequency</Label>
                <Select>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                    <SelectItem value="as-needed">As Needed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Recovery Time Limit (Days)</Label>
                <Input type="number" placeholder="e.g., 30, 60, 90" className="mt-1" />
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* ── Accounts & Settlement ── */}
      <AccordionItem value="accounts-settlement" className="border rounded-lg overflow-hidden">
        <AccordionTrigger className="px-5 py-4 font-semibold hover:no-underline hover:bg-muted/40">
          <span className="flex items-center gap-2">
            Accounts & Settlement
            <Badge variant="secondary" className={accordionSectionBadgeClass}>
              Optional
            </Badge>
          </span>
        </AccordionTrigger>
        <AccordionContent className="px-5 pb-5">
          <div className="border rounded-md p-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Accounting Frequency */}
              <div>
                <Label>Accounting Frequency</Label>
                <Select
                  value={structure.accountingFrequency}
                  onValueChange={(v) =>
                    onUpdate({ accountingFrequency: v as TreatyStructure['accountingFrequency'] })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Quarterly">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Bordereaux Type */}
              <div>
                <Label>Bordereaux Type</Label>
                <Select
                  value={structure.bordereauxType}
                  onValueChange={(v) =>
                    onUpdate({ bordereauxType: v as TreatyStructure['bordereauxType'] })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Premium">Premium</SelectItem>
                    <SelectItem value="Claims">Claims</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Settlement Currency */}
              <div>
                <Label>Settlement Currency</Label>
                <Select
                  value={structure.settlementCurrency}
                  onValueChange={(v) =>
                    onUpdate({ settlementCurrency: v as TreatyStructure['settlementCurrency'] })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {['AED', 'USD', 'EUR', 'GBP', 'SAR', 'Other'].map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Statement Due Days */}
              <div>
                <Label>Statement Due Days</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  step="1"
                  min={0}
                  value={structure.statementDueDays === 0 ? '' : String(structure.statementDueDays)}
                  placeholder="e.g., 30"
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === '') { onUpdate({ statementDueDays: 0 }); return; }
                    const parsed = parseInt(raw, 10);
                    if (Number.isNaN(parsed)) return;
                    onUpdate({ statementDueDays: Math.max(0, parsed) });
                  }}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* ── Documentation & Attachments ── */}
      <AccordionItem value="documentation" className="border rounded-lg overflow-hidden">
        <AccordionTrigger className="px-5 py-4 font-semibold hover:no-underline hover:bg-muted/40">
          <span className="flex items-center gap-2">
            Documentation & Attachments
            <Badge variant="secondary" className={accordionSectionBadgeClass}>
              Optional
            </Badge>
          </span>
        </AccordionTrigger>
        <AccordionContent className="px-5 pb-5">
          <div className="space-y-4 pt-2">
            {/* Treaty Documents */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Treaty Documents</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdate({ treatyDocuments: [...structure.treatyDocuments, ''] })}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              </div>
              {structure.treatyDocuments.length === 0 && (
                <p className="text-sm text-muted-foreground">No documents added yet.</p>
              )}
              <div className="space-y-2">
                {structure.treatyDocuments.map((doc, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      value={doc}
                      onChange={(e) => {
                        const updated = [...structure.treatyDocuments];
                        updated[idx] = e.target.value;
                        onUpdate({ treatyDocuments: updated });
                      }}
                      placeholder="URL or path"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const updated = structure.treatyDocuments.filter((_, i) => i !== idx);
                        onUpdate({ treatyDocuments: updated });
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Underwriting Guidelines Link</Label>
              <Input
                value={structure.underwritingGuidelinesLink}
                onChange={(e) => onUpdate({ underwritingGuidelinesLink: e.target.value })}
                placeholder="URL or link"
              />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
