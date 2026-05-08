import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Copy, Pencil, Plus, Search, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/shared/utils/lib-utils';
import { useToast } from '@/shared/hooks/use-toast';
import { TreatyStructureFormContent } from './TreatyStructureFormContent';
import type { TreatyStructure, TreatyStructureType } from './types';
import { createNewTreatyStructure, genId } from './types';
import { findSameTypeDateOverlap } from './treatyDateOverlapValidation';
import { findSurplusChainError, findNewSurplusTriggerError } from './surplusTriggerValidation';
import { searchReinsuranceTreaties } from '@/features/product-config/api/reinsurance';
import type { Reinsurer } from '@/features/reinsurers/api/reinsurers';

// ─────────────────────────────────────────────────────────────────────────────
// Loss ratio band validation (Commission sliding scale + Loss Participation share state)
// ─────────────────────────────────────────────────────────────────────────────

function validateLossRatioBandsForTreatySave(
  draft: TreatyStructure,
  draftType: TreatyStructureType,
): { ok: true } | { ok: false; title: string; description: string } {
  const isQS = draftType === 'Quota Share (QS)';
  const isSurplus = draftType === 'Surplus';
  if (!isQS && !isSurplus) {
    return { ok: true };
  }

  const commissionType = isQS ? draft.cedingCommissionType : draft.surplusCommissionType;
  if (commissionType !== 'Flat' && commissionType !== 'Sliding Scale') {
    return { ok: true };
  }

  const bands = isQS ? draft.lossRatioBands : draft.surplusLossRatioBands;

  if (commissionType === 'Sliding Scale' && bands.length === 0) {
    return {
      ok: false,
      title: 'Loss ratio bands required',
      description:
        'Sliding scale commission needs at least one loss ratio band. Add rows under Commission Types or Loss Participation.',
    };
  }

  for (let i = 0; i < bands.length; i++) {
    const b = bands[i];
    const minLR = Number(b.minLR);
    const maxLR = Number(b.maxLR);
    const participation = Number(b.commissionPercent);
    if (!Number.isFinite(minLR) || !Number.isFinite(maxLR) || !Number.isFinite(participation)) {
      return {
        ok: false,
        title: 'Incomplete loss ratio row',
        description: `Row ${i + 1}: Enter loss ratio min, max, and participation (or commission) %.`,
      };
    }
    if (minLR >= maxLR) {
      return {
        ok: false,
        title: 'Invalid loss ratio band',
        description: `Row ${i + 1}: Loss ratio min must be less than max (within 0–100%).`,
      };
    }
    if (minLR < 0 || maxLR > 100) {
      return {
        ok: false,
        title: 'Invalid loss ratio band',
        description: `Row ${i + 1}: Loss ratio values must be between 0 and 100%.`,
      };
    }
    if (participation < 0 || participation > 100) {
      return {
        ok: false,
        title: 'Invalid loss ratio band',
        description: `Row ${i + 1}: Commission / participation % must be between 0 and 100.`,
      };
    }
  }

  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  treatyStructures: TreatyStructure[];
  onAddStructure: (type: TreatyStructureType, initialData?: Partial<TreatyStructure>) => void;
  onUpdateStructure: (id: string, updates: Partial<TreatyStructure>) => void;
  onDeleteStructure: (id: string) => void;
  reinsurers?: Reinsurer[];
  brokers?: Array<{ id: string; name: string; isDirect?: boolean }>;
  allBrokers?: Array<{ id: string; name: string }>;
  productId?: string;
  programStartDate?: string | null;
  programEndDate?: string | null;
  productValidityStartDate?: string | null;
  productValidityEndDate?: string | null;
  productCurrency?: string;
}

export function TreatyStructureSection({
  treatyStructures,
  onAddStructure,
  onUpdateStructure,
  onDeleteStructure,
  reinsurers = [],
  brokers = [],
  allBrokers = [],
  productId,
  programStartDate,
  programEndDate,
  productValidityStartDate,
  productValidityEndDate,
  productCurrency,
}: Props) {
  const { toast } = useToast();

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draftType, setDraftType] = useState<TreatyStructureType | null>(null);
  const [draft, setDraft] = useState<TreatyStructure | null>(null);
  const [editingStructureId, setEditingStructureId] = useState<string | null>(null);
  const [isSavingTreaty, setIsSavingTreaty] = useState(false);

  // Exit confirmation state
  const [showExitAlert, setShowExitAlert] = useState(false);

  // Search / import dialog state
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TreatyStructure[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const performSearch = useCallback(
    async (q: string) => {
      if (!productId) return;
      setSearching(true);
      try {
        const results = await searchReinsuranceTreaties(productId, q || undefined);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    },
    [productId],
  );

  const handleSearchQueryChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => performSearch(value), 300);
    },
    [performSearch],
  );

  const openSearchDialog = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchDialogOpen(true);
    // Load all treaties for this product on open
    setTimeout(() => performSearch(''), 0);
  }, [performSearch]);

  const importTreaty = useCallback(
    (treaty: TreatyStructure) => {
      const { id: _id, ...rest } = treaty;
      const imported = {
        ...rest,
        id: genId('struct'),
        effectiveDate: null, // Clear — user picks dates for current program
        // expiryDate left intact — the form's useEffect will default it to the
        // parent program's endDate when empty.
      };
      // Close search dialog, open main dialog pre-populated (same pattern as Clone)
      setSearchDialogOpen(false);
      setEditingStructureId(null);
      setDraftType(imported.structureType);
      setDraft(imported);
      setDialogOpen(true);
    },
    [],
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const openDialog = () => {
    setEditingStructureId(null);
    setDraftType(null);
    setDraft(null);
    setDialogOpen(true);
  };

  const openForEdit = (s: TreatyStructure) => {
    setEditingStructureId(s.id);
    setDraftType(s.structureType);
    setDraft({ ...s });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingStructureId(null);
    setDraftType(null);
    setDraft(null);
    setShowExitAlert(false);
  };

  const isDirty = useMemo(() => {
    if (!draft) return false;
    if (!editingStructureId) {
      // New structure — dirty if any meaningful field was filled
      return (
        (draft.name?.trim() ?? '') !== '' ||
        (draft.reinsurancePanel?.length ?? 0) > 0
      );
    }
    // Editing — compare draft with original
    const original = treatyStructures.find((s) => s.id === editingStructureId);
    if (!original) return true;
    return JSON.stringify(draft) !== JSON.stringify(original);
  }, [draft, editingStructureId, treatyStructures]);

  const handleCloseAttempt = () => {
    if (isDirty) {
      setShowExitAlert(true);
    } else {
      closeDialog();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Treaty Structure</CardTitle>
          <div className="flex items-center gap-2">
            {productId && (
              <Button variant="outline" onClick={openSearchDialog} className="gap-2">
                <Search className="w-4 h-4 mr-1.5 shrink-0" />
                Import Existing
              </Button>
            )}
            <Button onClick={openDialog} className="gap-2">
              <Plus className="w-4 h-4 mr-1.5 shrink-0" />
              Add Treaty Structure
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {treatyStructures.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No treaty structures. Click "Add Treaty Structure" to create one.
          </div>
        ) : (
          <div className="space-y-4">
            {/* ── Structure cards ── */}
            <div className="space-y-2">
              {treatyStructures.map((s) => (
                <Card
                  key={s.id}
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                  onClick={() => openForEdit(s)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0 space-y-3">
                        <div className="min-w-0 space-y-2">
                          <Badge variant="outline" className="text-xs shrink-0">
                            {s.structureType}
                          </Badge>

                          <div className="space-y-0.5">
                            <h4 className="font-semibold text-base truncate">
                              {s.name || 'Untitled'}
                            </h4>
                            <p className="text-sm text-muted-foreground truncate">
                              {s.notes || 'No description'}
                            </p>
                          </div>
                        </div>

                        {/* Quick summary row */}
                        <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                          {s.structureType === 'Quota Share (QS)' && (
                            <>
                              <div>Cedant Retention: {s.retentionPercent}%</div>
                              <div>Cession: {s.quotaSharePercent}%</div>
                              {s.cedingCommissionPercent > 0 && (
                                <div>Commission: {s.cedingCommissionPercent}%</div>
                              )}
                            </>
                          )}
                          {s.structureType === 'Surplus' && (
                            <>
                              <div>Cedant Retention: {s.surplusRetentionPercent}%</div>
                              <div>Cession: {100 - (s.surplusRetentionPercent ?? 0)}%</div>
                              {s.surplusCedingCommission > 0 && (
                                <div>Commission: {s.surplusCedingCommission}%</div>
                              )}
                            </>
                          )}
                          {s.structureType === 'Excess of Loss (XOL)' && (
                            <>
                              <div>Limit: {s.xolLimitPerOccurrence?.toLocaleString()}</div>
                              <div>Deductible: {s.xolDeductible?.toLocaleString()}</div>
                            </>
                          )}
                          {s.structureType === 'Stop Loss' && (
                            <>
                              <div>Attachment: {s.stopLossAttachment}%</div>
                              <div>Detachment: {s.stopLossDetachment}%</div>
                            </>
                          )}
                          {(s.reinsurancePanel?.length ?? 0) > 0 && (
                            <div>Panel Members: {s.reinsurancePanel.length}</div>
                          )}
                        </div>
                        {s.totalCessionPercent > 0 && (
                          <div
                            className={cn(
                              'text-sm font-medium',
                              s.totalCessionPercent === 100
                                ? 'text-green-600'
                                : 'text-orange-600',
                            )}
                          >
                            Total Cession: {s.totalCessionPercent.toFixed(1)}%
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="Clone this treaty structure"
                          onClick={(e) => {
                            e.stopPropagation();
                            const clone = {
                              ...s,
                              id: genId('struct'),
                              name: s.name || 'Treaty',
                              effectiveDate: null,
                              expiryDate: null,
                            };
                            setEditingStructureId(null);
                            setDraftType(clone.structureType);
                            setDraft(clone);
                            setDialogOpen(true);
                          }}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            openForEdit(s);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteStructure(s.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {/* ── Import Existing Treaty Dialog ── */}
      <Dialog open={searchDialogOpen} onOpenChange={(open) => { if (!open) setSearchDialogOpen(false); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Import Existing Treaty</DialogTitle>
            <DialogDescription>
              Search by treaty name or code to import an existing treaty structure.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by treaty name or code..."
                value={searchQuery}
                onChange={(e) => handleSearchQueryChange(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 space-y-2">
              {searching ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Searching...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'No treaties found matching your search.' : 'No existing treaties found for this product.'}
                </div>
              ) : (
                searchResults.map((treaty) => (
                  <Card
                    key={treaty.id}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                    onClick={() => importTreaty(treaty)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs shrink-0">
                              {treaty.structureType}
                            </Badge>
                            {treaty.treatyCode && (
                              <span className="text-xs text-muted-foreground font-mono">
                                {treaty.treatyCode}
                              </span>
                            )}
                          </div>
                          <h4 className="font-medium text-sm truncate">
                            {treaty.name || 'Untitled'}
                          </h4>
                          {treaty.notes && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {treaty.notes}
                            </p>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" className="shrink-0">
                          Import
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSearchDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add / Edit Treaty Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) handleCloseAttempt(); }}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingStructureId ? 'Edit Treaty Structure' : 'Add Treaty Structure'}</DialogTitle>
            <DialogDescription className="text-foreground">
              Select a structure type and configure the treaty details.
            </DialogDescription>
          </DialogHeader>

          {/* Sticky info bar — visible when a draft exists */}
          {draft && draftType && (
            <div className="flex items-center gap-3 border-b bg-muted/50 px-6 py-2 -mx-6 text-sm">
              <Badge variant="outline" className="text-xs shrink-0">{draftType}</Badge>
              {draft.name && (
                <>
                  <span className="text-muted-foreground">·</span>
                  <span className="font-medium truncate">{draft.name}</span>
                </>
              )}
              {draft.treatyCode && (
                <>
                  <span className="text-muted-foreground">·</span>
                  <span className="font-mono text-xs text-muted-foreground">{draft.treatyCode}</span>
                </>
              )}
            </div>
          )}

          <div className="space-y-6 py-4 flex-1 overflow-y-auto min-h-0">
            {!draftType ? (
              /* Step 1: pick type (only for new structures) */
              <div className="space-y-3">
                <Label>Structure Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      'Quota Share (QS)',
                      'Surplus',
                      'Excess of Loss (XOL)',
                      'Stop Loss',
                    ] as TreatyStructureType[]
                  ).map((type) => (
                    <Button
                      key={type}
                      variant="outline"
                      className="h-auto py-4 justify-start"
                      onClick={() => {
                        setDraftType(type);
                        const newStructure = createNewTreatyStructure(type);
                        setDraft({
                          ...newStructure,
                          currency: productCurrency || 'AED',
                          settlementCurrency: (productCurrency as TreatyStructure['settlementCurrency']) || 'AED',
                        });
                      }}
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              draft && (
                /* Step 2: configure */
                <div className="space-y-6">
                  {!editingStructureId && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDraftType(null);
                          setDraft(null);
                        }}
                      >
                        Change type
                      </Button>
                    </div>
                  )}
                  <TreatyStructureFormContent
                    structure={draft}
                    onUpdate={(u) => setDraft((prev) => (prev ? { ...prev, ...u } : null))}
                    reinsurers={reinsurers}
                    brokers={brokers}
                    allBrokers={allBrokers}
                    productId={productId}
                    programStartDate={programStartDate}
                    programEndDate={programEndDate}
                    productValidityStartDate={productValidityStartDate}
                    productValidityEndDate={productValidityEndDate}
                    existingStructures={treatyStructures}
                    editingStructureId={editingStructureId}
                  />
                </div>
              )
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseAttempt}>
              Cancel
            </Button>
            {draftType && draft && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  disabled={isSavingTreaty}
                  onClick={() => {
                    if (isSavingTreaty) return;
                    setIsSavingTreaty(true);
                    // Save as Draft (relaxed validation, mirrors program "Save as Draft" behavior)
                    try {
                      if (editingStructureId) {
                        onUpdateStructure(editingStructureId, { ...draft, status: 'Draft' });
                        toast({ title: 'Draft saved', description: 'Treaty structure has been saved as draft.' });
                      } else {
                        const { id: _id, ...rest } = draft;
                        onAddStructure(draftType, { ...rest, status: 'Draft', id: genId('struct') });
                        toast({ title: 'Draft saved', description: 'Treaty structure has been saved as draft.' });
                      }
                      closeDialog();
                    } finally {
                      setIsSavingTreaty(false);
                    }
                  }}
                >
                  {isSavingTreaty ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    'Save as Draft'
                  )}
                </Button>

                <Button
                  disabled={isSavingTreaty}
                  onClick={() => {
                    if (isSavingTreaty) return;
                    setIsSavingTreaty(true);
                    // ── Mandatory field validation ──
                    if (!draft.name?.trim()) {
                      toast({ title: 'Treaty Name required', description: 'Please enter a treaty name.', variant: 'destructive' });
                      setIsSavingTreaty(false);
                      return;
                    }
                    // Duplicate name check within the same program
                    const duplicateName = treatyStructures.find(
                      (s) =>
                        s.id !== editingStructureId &&
                        s.name?.trim().toLowerCase() === draft.name?.trim().toLowerCase(),
                    );
                    if (duplicateName) {
                      toast({
                        title: 'Duplicate treaty name',
                        description: `A treaty named "${duplicateName.name}" already exists in this program. Please use a unique name.`,
                        variant: 'destructive',
                      });
                      setIsSavingTreaty(false);
                      return;
                    }
                    if (!draft.treatyYear?.trim()) {
                      toast({ title: 'Treaty Year required', description: 'Please select a treaty year.', variant: 'destructive' });
                      setIsSavingTreaty(false);
                      return;
                    }
                    if (!draft.currency?.trim()) {
                      toast({ title: 'Currency required', description: 'Please select a currency.', variant: 'destructive' });
                      setIsSavingTreaty(false);
                      return;
                    }
                    if (!draft.effectiveDate) {
                      toast({ title: 'Effective Date required', description: 'Please select an effective date.', variant: 'destructive' });
                      setIsSavingTreaty(false);
                      return;
                    }
                    if (!draft.expiryDate) {
                      toast({ title: 'Expiry Date required', description: 'Please select an expiry date.', variant: 'destructive' });
                      setIsSavingTreaty(false);
                      return;
                    }
                    if (draft.effectiveDate && draft.expiryDate && new Date(draft.expiryDate) < new Date(draft.effectiveDate)) {
                      toast({ title: 'Invalid date range', description: 'Expiry Date cannot be before Effective Date.', variant: 'destructive' });
                      setIsSavingTreaty(false);
                      return;
                    }
                    if (!draft.premiumBasisOgrOnr) {
                      toast({ title: 'Premium Basis required', description: 'Please select a premium basis (OGR/ONR).', variant: 'destructive' });
                      setIsSavingTreaty(false);
                      return;
                    }

                    const brokerage = Number(draft.brokeragePercent);
                    if (!Number.isFinite(brokerage) || brokerage < 0 || brokerage > 100) {
                      toast({ title: 'Brokerage % required', description: 'Please enter Brokerage % between 0 and 100.', variant: 'destructive' });
                      setIsSavingTreaty(false);
                      return;
                    }
                    const fronting = Number(draft.overrideFrontingFeePercent);
                    if (!Number.isFinite(fronting) || fronting < 0 || fronting > 100) {
                      toast({ title: 'Fronting Fee % required', description: 'Please enter Override / Fronting Fee % between 0 and 100.', variant: 'destructive' });
                      setIsSavingTreaty(false);
                      return;
                    }

                    if (draftType === 'Quota Share (QS)' && (!draft.quotaSharePercent || draft.quotaSharePercent <= 0)) {
                      toast({ title: 'Quota Share % required', description: 'Quota share percentage must be greater than 0.', variant: 'destructive' });
                      setIsSavingTreaty(false);
                      return;
                    }
                    if (draftType === 'Quota Share (QS)') {
                      if (draft.retentionPercent < 0 || draft.retentionPercent > 100) {
                        toast({ title: 'Cedant Retention % required', description: 'Cedant retention % must be between 0 and 100.', variant: 'destructive' });
                        setIsSavingTreaty(false);
                        return;
                      }
                      const sum = Number(draft.retentionPercent || 0) + Number(draft.quotaSharePercent || 0);
                      if (Math.abs(sum - 100) > 0.01) {
                        toast({ title: 'Invalid retention/cession', description: 'Cedant retention % + cession % must equal 100%.', variant: 'destructive' });
                        setIsSavingTreaty(false);
                        return;
                      }
                      if (!draft.maxTreatyCapacity || draft.maxTreatyCapacity <= 0) {
                        toast({ title: 'Max Treaty Capacity required', description: 'Please enter Max Treaty Capacity greater than 0.', variant: 'destructive' });
                        setIsSavingTreaty(false);
                        return;
                      }

                      // Commission Types (QS)
                      if (!draft.cedingCommissionType) {
                        toast({ title: 'Commission Type required', description: 'Please select a commission type (Flat or Sliding Scale).', variant: 'destructive' });
                        setIsSavingTreaty(false);
                        return;
                      }
                      if (draft.cedingCommissionType === 'Flat' && Number(draft.cedingCommissionPercent || 0) <= 0) {
                        toast({ title: 'Ceding Commission % required', description: 'Please enter Ceding Commission % greater than 0.', variant: 'destructive' });
                        setIsSavingTreaty(false);
                        return;
                      }
                      if (draft.cedingCommissionType === 'Sliding Scale' && Number(draft.bookingCommission || 0) <= 0) {
                        toast({ title: 'Booking Commission % required', description: 'Please enter Booking (Provisional) Commission % greater than 0.', variant: 'destructive' });
                        setIsSavingTreaty(false);
                        return;
                      }
                      if (draft.profitCommissionEnabled) {
                        if (Number(draft.profitCommissionPercent || 0) <= 0) {
                          toast({ title: 'Profit Commission % required', description: 'Please enter Profit Commission % greater than 0.', variant: 'destructive' });
                          setIsSavingTreaty(false);
                          return;
                        }
                        if (Number(draft.carryForwardLossPercent) < 0 || Number(draft.expenseRatioPercent) < 0) {
                          toast({ title: 'Invalid profit commission inputs', description: 'Carry Forward Loss % and Expense Ratio % must be 0 or greater.', variant: 'destructive' });
                          setIsSavingTreaty(false);
                          return;
                        }
                      }
                    }

                    if (draftType === 'Surplus') {
                      if (!draft.surplusMaxTreatyCapacity || draft.surplusMaxTreatyCapacity <= 0) {
                        toast({ title: 'Max Treaty Capacity required', description: 'Please enter Max Treaty Capacity greater than 0.', variant: 'destructive' });
                        setIsSavingTreaty(false);
                        return;
                      }

                      if (!draft.surplusCommissionType) {
                        toast({ title: 'Commission Type required', description: 'Please select a commission type (Flat or Sliding Scale).', variant: 'destructive' });
                        setIsSavingTreaty(false);
                        return;
                      }
                      if (draft.surplusCommissionType === 'Flat' && Number(draft.surplusCedingCommission || 0) <= 0) {
                        toast({ title: 'Ceding Commission % required', description: 'Please enter Ceding Commission % greater than 0.', variant: 'destructive' });
                        setIsSavingTreaty(false);
                        return;
                      }
                      if (draft.surplusCommissionType === 'Sliding Scale' && Number(draft.surplusBookingCommission || 0) <= 0) {
                        toast({ title: 'Booking Commission % required', description: 'Please enter Booking (Provisional) Commission % greater than 0.', variant: 'destructive' });
                        setIsSavingTreaty(false);
                        return;
                      }

                      // Validate surplus sequential waterfall ordering
                      if (editingStructureId) {
                        // Edit: check the full chain doesn't overlap after replacement
                        const simulatedList = treatyStructures.map((s) =>
                          s.id === editingStructureId ? draft : s,
                        );
                        const chainError = findSurplusChainError(simulatedList);
                        if (chainError) {
                          toast({
                            title: 'Surplus sequential ordering',
                            description: chainError.message,
                            variant: 'destructive',
                          });
                          setIsSavingTreaty(false);
                          return;
                        }
                      } else {
                        // Create: new surplus must extend above the highest existing ceiling
                        const triggerError = findNewSurplusTriggerError(draft, treatyStructures);
                        if (triggerError) {
                          toast({
                            title: 'Surplus sequential ordering',
                            description: triggerError.message,
                            variant: 'destructive',
                          });
                          setIsSavingTreaty(false);
                          return;
                        }
                      }
                    }

                    if (draftType === 'Excess of Loss (XOL)') {
                      if (!draft.xolCoverBasis) {
                        toast({ title: 'Cover Basis required', description: 'Please select a cover basis.', variant: 'destructive' });
                        setIsSavingTreaty(false);
                        return;
                      }
                      if (!draft.xolLimitPerOccurrence || draft.xolLimitPerOccurrence <= 0) {
                        toast({ title: 'XOL Limit required', description: 'XOL limit per occurrence must be greater than 0.', variant: 'destructive' });
                        setIsSavingTreaty(false);
                        return;
                      }
                      if (draft.xolDeductible == null || draft.xolDeductible < 0) {
                        toast({ title: 'XOL Deductible required', description: 'XOL deductible must be 0 or greater.', variant: 'destructive' });
                        setIsSavingTreaty(false);
                        return;
                      }
                    }

                    if (draftType === 'Stop Loss') {
                      if (!draft.stopLossAttachment || draft.stopLossAttachment <= 0) {
                        toast({ title: 'Loss Ratio Attachment required', description: 'Please enter Loss Ratio Attachment (%) greater than 0.', variant: 'destructive' });
                        setIsSavingTreaty(false);
                        return;
                      }
                      if (!draft.stopLossDetachment || draft.stopLossDetachment <= 0) {
                        toast({ title: 'Loss Ratio Detachment required', description: 'Please enter Loss Ratio Detachment (%) greater than 0.', variant: 'destructive' });
                        setIsSavingTreaty(false);
                        return;
                      }
                      if (draft.stopLossDetachment <= draft.stopLossAttachment) {
                        toast({ title: 'Invalid stop loss corridor', description: 'Detachment (%) must be greater than attachment (%).', variant: 'destructive' });
                        setIsSavingTreaty(false);
                        return;
                      }
                    }

                  // Validate panel members
                  const panelMembers = draft.reinsurancePanel ?? [];

                  // 1. Require at least one panel member
                  if (panelMembers.length === 0) {
                    toast({
                      title: 'Panel members required',
                      description: 'Please add at least one panel member before saving.',
                      variant: 'destructive',
                    });
                    setIsSavingTreaty(false);
                    return;
                  }

                  // 2. Validate all members have reinsurer selected
                  const incomplete = panelMembers.filter((p) => !p.reinsurerId);
                  if (incomplete.length > 0) {
                    toast({
                      title: 'Incomplete member details',
                      description: 'All panel members must have a reinsurer selected.',
                      variant: 'destructive',
                    });
                    setIsSavingTreaty(false);
                    return;
                  }

                  // 2a. Validate all members have broker selected
                  const missingBroker = panelMembers.filter((p) => !p.brokerId && !p.reinsuranceBroker?.trim());
                  if (missingBroker.length > 0) {
                    toast({
                      title: 'Broker required',
                      description: 'All panel members must have a broker selected.',
                      variant: 'destructive',
                    });
                    setIsSavingTreaty(false);
                    return;
                  }

                  // 2b. Validate all members have share % > 0
                  const missingShare = panelMembers.filter((p) => !(p.sharePercent > 0));
                  if (missingShare.length > 0) {
                    toast({
                      title: 'Share % required',
                      description: 'All panel members must have Share % greater than 0.',
                      variant: 'destructive',
                    });
                    setIsSavingTreaty(false);
                    return;
                  }

                  // 2b. Validate all members have a rating (auto-filled from reinsurer selection)
                  const unrated = panelMembers.filter((p) => !p.rating);
                  if (unrated.length > 0) {
                    toast({
                      title: 'Reinsurer rating missing',
                      description: 'All panel members must have a reinsurer rating. Please select a rated reinsurer.',
                      variant: 'destructive',
                    });
                    setIsSavingTreaty(false);
                    return;
                  }

                  // 3. Validate exactly one lead insurer
                  const leadCount = panelMembers.filter((p) => p.isLead).length;
                  if (leadCount === 0) {
                    toast({
                      title: 'Lead insurer required',
                      description: 'Please designate one panel member as lead before saving.',
                      variant: 'destructive',
                    });
                    setIsSavingTreaty(false);
                    return;
                  }
                  if (leadCount > 1) {
                    toast({
                      title: 'Only one lead allowed',
                      description: 'Only one panel member can be designated as lead.',
                      variant: 'destructive',
                    });
                    setIsSavingTreaty(false);
                    return;
                  }

                  // 4. Validate panel share % totals 100%
                  const totalShare = panelMembers.reduce((sum, p) => sum + (p.sharePercent || 0), 0);
                  if (Math.abs(totalShare - 100) > 0.01) {
                    toast({
                      title: 'Invalid share allocation',
                      description: `Panel share total is ${totalShare.toFixed(1)}%. It must equal 100% before saving.`,
                      variant: 'destructive',
                    });
                    setIsSavingTreaty(false);
                    return;
                  }

                  const lossBandResult = validateLossRatioBandsForTreatySave(draft, draftType);
                  if (!lossBandResult.ok) {
                    toast({
                      title: lossBandResult.title,
                      description: lossBandResult.description,
                      variant: 'destructive',
                    });
                    setIsSavingTreaty(false);
                    return;
                  }

                  // Validate no same-type date overlap
                  const overlapConflict = findSameTypeDateOverlap(
                    draft,
                    treatyStructures,
                    editingStructureId,
                  );
                  if (overlapConflict) {
                    toast({
                      title: 'Date range conflict',
                      description: overlapConflict.message,
                      variant: 'destructive',
                    });
                    setIsSavingTreaty(false);
                    return;
                  }

                  try {
                    if (editingStructureId) {
                      onUpdateStructure(editingStructureId, { ...draft });
                      toast({ title: 'Treaty updated', description: 'Treaty structure has been updated.' });
                    } else {
                      const { id: _id, ...rest } = draft;
                      onAddStructure(draftType, { ...rest, id: genId('struct') });
                      toast({ title: 'Treaty added', description: 'Treaty structure has been added.' });
                    }
                    closeDialog();
                  } finally {
                    setIsSavingTreaty(false);
                  }
                }}
              >
                {isSavingTreaty ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  (editingStructureId ? 'Save Changes' : 'Save & Add')
                )}
               </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Unsaved Changes Confirmation ── */}
      <AlertDialog open={showExitAlert} onOpenChange={setShowExitAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes in this treaty structure. What would you like to do?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowExitAlert(false)}>
              Keep Editing
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowExitAlert(false);
                closeDialog();
              }}
            >
              Discard
            </Button>
            <Button
              onClick={() => {
                setShowExitAlert(false);
                // Trigger the save-as-draft flow
                if (draft && draftType) {
                  if (editingStructureId) {
                    onUpdateStructure(editingStructureId, { ...draft, status: 'Draft' });
                    toast({ title: 'Draft saved', description: 'Treaty structure has been saved as draft.' });
                  } else {
                    const { id: _id, ...rest } = draft;
                    onAddStructure(draftType, { ...rest, status: 'Draft', id: genId('struct') });
                    toast({ title: 'Draft saved', description: 'Treaty structure has been saved as draft.' });
                  }
                  closeDialog();
                }
              }}
            >
              Save &amp; Close
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
