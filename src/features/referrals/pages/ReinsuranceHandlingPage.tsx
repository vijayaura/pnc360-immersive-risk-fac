import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FormattedNumberInput } from '@/components/ui/FormattedNumberInput';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  ArrowLeft,
  Shield,
  Layers,
  FileText,
  Users,
  Loader2,
  XCircle,
  Save,
  Plus,
  Trash2,
  ArrowRight,
} from 'lucide-react';
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
import {
  getReinsuranceContext,
  getReinsuranceHandling,
  saveReinsuranceHandling,
  type TreatyAllocation,
  type TreatyReinsurerAllocation,
  type TriggeredTreatyItem,
} from '@/features/proposals/api/referrals';
import {
  facultativeRequestStatusBadgeClass,
  matchFacultativeDemoTemplateByReinsurerName,
  reinsurerSlugForDemoRow,
} from '@/features/referrals/components/InsurerReferralFacultativeRequestsCard';
import {
  ArrangeFacultativeReinsuranceDialog,
  type FacRow,
  type FacultativeArrangeDraft,
} from '@/features/referrals/components/ArrangeFacultativeReinsuranceDialog';
import { FacultativeNewRequestDialog, type FacultativeNewParty } from '@/features/referrals/components/FacultativeNewRequestDialog';
import {
  FacOutreachRequestsSection,
  createOutreachCaseFromParties,
  type FacOutreachCaseState,
} from '@/features/referrals/components/FacOutreachRequestsCard';
import { completeCombinedFacBundle } from '@/features/referrals/utils/combinedFacRequestHistory';
import { listReinsurers, type Reinsurer } from '@/features/reinsurers/api/reinsurers';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtAED = (n: number, currency = 'AED') =>
  new Intl.NumberFormat('en-AE', { style: 'decimal', maximumFractionDigits: 0 }).format(n) +
  ' ' +
  currency;

// ─── Derived types ────────────────────────────────────────────────────────────

interface LayerOverride {
  overridePremium: number;
  isFacultativeMode: boolean;
  isManualOverride: boolean;
}

interface ManualReinsurerRow {
  reinsurerId: string;
  name: string;
  sharePercent: number;
  sharedPremium: number;
  commissionPercent: number;
}

interface SavedHandlingLayer {
  layerType: string;
  treatyId?: string;
  cededSumInsured?: number;
  overridePremium: number;
  isFacultativeMode: boolean;
  isManualOverride: boolean;
  reinsurerBreakdown: Array<{
    name: string;
    reinsurerId?: string;
    sharePercentage?: number;
    sharePercent?: number;
    risk?: number;
    premium: number;
    commissionPercent: number;
    commissionAmount: number;
  }>;
}

interface SavedHandling {
  coverId?: string | null;
  unitId?: string | null;
  layers: SavedHandlingLayer[];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function OverviewLayerCard({
  allocation,
  currency,
  onClick,
}: {
  allocation: TreatyAllocation;
  currency: string;
  onClick?: () => void;
}) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className="rounded-lg border border-border bg-background p-4 space-y-3 text-foreground hover:border-primary/40 hover:bg-muted/50 transition-colors cursor-pointer"
    >
      <div className="flex items-start gap-2">
        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="min-w-0">
          <span className="font-semibold text-sm block">{allocation.structureType}</span>
          <p className="text-xs text-muted-foreground truncate">{allocation.treatyCode}</p>
        </div>
      </div>
      <div className="space-y-1 text-sm border-t pt-2">
        <div className="flex justify-between">
          <span className="text-gray-500">Sum Insured</span>
          <span className="font-medium tabular-nums text-gray-900">
            {fmtAED(allocation.allocatedSumInsured, currency)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Premium</span>
          <span className="font-medium tabular-nums text-gray-900">
            {fmtAED(allocation.allocatedPremium, currency)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">% of Total</span>
          <span className="font-medium tabular-nums text-gray-900">
            {allocation.percentOfTotal.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}

interface LayerBreakdownSectionProps {
  allocation: TreatyAllocation;
  currency: string;
  override: LayerOverride;
  isFac?: boolean;
  manualReinsurerRows?: ManualReinsurerRow[];
  onManualReinsurerRowsChange?: (rows: ManualReinsurerRow[]) => void;
  onOverridePremiumChange: (val: number) => void;
  onFacultativeModeChange: (val: boolean) => void;
}

function LayerBreakdownSection({
  allocation,
  currency,
  override,
  isFac = false,
  manualReinsurerRows,
  onManualReinsurerRowsChange,
  onOverridePremiumChange,
  onFacultativeModeChange,
}: LayerBreakdownSectionProps) {
  // Derive retention percent from amounts when backend sends 0 (e.g. surplus treaties)
  const retentionPct =
    allocation.retentionPercent ||
    (allocation.allocatedPremium > 0
      ? Math.round((allocation.retentionAmount / allocation.allocatedPremium) * 100)
      : 0);

  const activeOverride = override.isFacultativeMode ? (override.overridePremium ?? 0) : 0;
  const { grossPremium, effectiveCession, effectiveRetention, cessionPct } =
    computeEffectiveCession(allocation, activeOverride);

  // Scale panel reinsurer breakdown proportionally to new cession (base values when override OFF)
  const overrideRatio =
    allocation.cessionAmount > 0 ? effectiveCession / allocation.cessionAmount : 1;
  const basePanel = allocation.reinsurerBreakdown.map((r) => {
    const sharedPremium = r.sharedPremium * overrideRatio;
    const commissionAmount = (sharedPremium * r.commissionPercent) / 100;
    const risk = r.risk;
    const ratePer = risk > 0 ? sharedPremium / risk : 0;
    const rateAfterCommission = risk > 0 ? (sharedPremium - commissionAmount) / risk : 0;
    return { ...r, sharedPremium, commissionAmount, ratePer, rateAfterCommission };
  });

  // When manual override ON: use manual rows; derive Commission, Rate Per, Rate After Commission
  const effectivePanel =
    override.isFacultativeMode && manualReinsurerRows && manualReinsurerRows.length > 0
      ? manualReinsurerRows.map((m) => {
          const risk =
            allocation.reinsurerBreakdown.find((r) => r.reinsurerId === m.reinsurerId)?.risk ?? 0;
          const commissionAmount = (m.sharedPremium * m.commissionPercent) / 100;
          const ratePer = risk > 0 ? m.sharedPremium / risk : 0;
          const rateAfterCommission = risk > 0 ? (m.sharedPremium - commissionAmount) / risk : 0;
          return {
            ...m,
            risk,
            sharedPremium: m.sharedPremium,
            commissionAmount,
            ratePer,
            rateAfterCommission,
          };
        })
      : basePanel;

  const effectiveTotalCommission = effectivePanel.reduce((s, r) => s + r.commissionAmount, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{allocation.structureType}</CardTitle>
            <CardDescription>
              {allocation.treatyCode} · Retention {retentionPct}% / Cession {cessionPct}%
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch
                checked={override.isFacultativeMode}
                onCheckedChange={onFacultativeModeChange}
              />
              <span className="text-sm font-semibold">Manual override</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Premium Split Box — hidden for Mandatory Facultative */}
        {!isFac && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Premium split</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border bg-green-50/50 p-4 space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Retention
                </p>
                <p className="text-lg font-semibold tabular-nums">
                  {fmtAED(effectiveRetention, currency)}
                </p>
                <p className="text-xs text-muted-foreground">{retentionPct}%</p>
              </div>
              <div className="rounded-lg border bg-blue-50/50 p-4 space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Cession
                </p>
                <p className="text-lg font-semibold tabular-nums">
                  {fmtAED(effectiveCession, currency)}
                </p>
                <p className="text-xs text-muted-foreground">{cessionPct}%</p>
              </div>
            </div>
          </div>
        )}

        {/* Technical Rate + Override + Gross Premium — hidden for Mandatory Facultative */}
        {!isFac && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="font-medium">Technical rate</span>
              <span className="tabular-nums">{fmtAED(allocation.technicalRate, currency)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Override premium</span>
              <div className="flex items-center gap-2">
                {override.isFacultativeMode ? (
                  <>
                    <Input
                      type="number"
                      min={0}
                      className="w-36 h-7 text-sm text-right"
                      value={override.overridePremium}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (!isNaN(val) && val >= 0) onOverridePremiumChange(val);
                      }}
                    />
                    <span className="text-xs text-muted-foreground">{currency}</span>
                  </>
                ) : (
                  <span className="tabular-nums">{fmtAED(0, currency)}</span>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">
                {allocation.premiumBasisOgrOnr === 'ONR' ? 'Net premium' : 'Gross premium'}
              </span>
              <span className="tabular-nums">{fmtAED(grossPremium, currency)}</span>
            </div>
          </div>
        )}

        {/* Reinsurer Cession Share Table */}
        {effectivePanel.length > 0 ? (
          <div className="overflow-x-auto">
            <p className="text-sm font-medium mb-2">Reinsurer Cession Share</p>
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
                </tr>
              </thead>
              <tbody className="divide-y">
                {effectivePanel.map((r, idx) => {
                  const updateManualRow = (patch: Partial<ManualReinsurerRow>) => {
                    if (!onManualReinsurerRowsChange || !manualReinsurerRows) return;
                    const updated = manualReinsurerRows.map((row, i) =>
                      i === idx ? { ...row, ...patch } : row,
                    );
                    onManualReinsurerRowsChange(updated);
                  };
                  const isEditable = override.isFacultativeMode && !!onManualReinsurerRowsChange;
                  return (
                    <tr key={r.reinsurerId} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 font-medium">{r.name}</td>
                      <td className="py-2.5 text-right tabular-nums">{fmtAED(r.risk, currency)}</td>
                      <td className="py-2.5 text-right">
                        {isEditable ? (
                          <div className="flex items-center justify-end gap-1">
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              step={0.01}
                              className="w-20 h-7 text-sm text-right tabular-nums"
                              value={r.sharePercent}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val) && val >= 0 && val <= 100) {
                                  const sharedPremium = Math.round(
                                    effectiveCession * (val / 100),
                                  );
                                  updateManualRow({ sharePercent: val, sharedPremium });
                                }
                              }}
                            />
                            <span className="text-xs text-muted-foreground">%</span>
                          </div>
                        ) : (
                          <span className="tabular-nums">{r.sharePercent}%</span>
                        )}
                      </td>
                      <td className="py-2.5 text-right">
                        {isEditable ? (
                          <div className="flex items-center justify-end gap-1">
                            <Input
                              type="number"
                              min={0}
                              className="w-24 h-7 text-sm text-right tabular-nums"
                              value={r.sharedPremium}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                if (!isNaN(val) && val >= 0) {
                                  const sharePercent =
                                    effectiveCession > 0
                                      ? Math.round((val / effectiveCession) * 10000) / 100
                                      : r.sharePercent;
                                  updateManualRow({ sharedPremium: val, sharePercent });
                                }
                              }}
                            />
                            <span className="text-xs text-muted-foreground">{currency}</span>
                          </div>
                        ) : (
                          <span className="tabular-nums">{fmtAED(r.sharedPremium, currency)}</span>
                        )}
                      </td>
                      <td className="py-2.5 text-right">
                        {isEditable ? (
                          <div className="flex items-center justify-end gap-1">
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              className="w-20 h-7 text-sm text-right tabular-nums"
                              value={r.commissionPercent}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                if (!isNaN(val) && val >= 0 && val <= 100)
                                  updateManualRow({ commissionPercent: val });
                              }}
                            />
                            <span className="text-xs text-muted-foreground">%</span>
                          </div>
                        ) : (
                          <span className="tabular-nums">{r.commissionPercent}%</span>
                        )}
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-green-700">
                        {fmtAED(r.commissionAmount, currency)}
                      </td>
                      <td className="py-2.5 text-right tabular-nums">{(r.ratePer * 100).toFixed(2)}</td>
                      <td className="py-2.5 text-right tabular-nums">
                        {(r.rateAfterCommission * 100).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t font-semibold bg-muted/30">
                  <td className="pt-2.5 pb-1">Total</td>
                  <td className="pt-2.5 pb-1 text-right tabular-nums">
                    {fmtAED(allocation.cessionSumInsured, currency)}
                  </td>
                  <td className="pt-2.5 pb-1 text-right tabular-nums">100%</td>
                  <td className="pt-2.5 pb-1 text-right tabular-nums">
                    {fmtAED(effectiveCession, currency)}
                  </td>
                  <td />
                  <td className="pt-2.5 pb-1 text-right tabular-nums text-green-700">
                    {fmtAED(effectiveTotalCommission, currency)}
                  </td>
                  <td />
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No panel reinsurers configured for this treaty.
          </p>
        )}

        {/* Summary */}
        <p className="text-sm font-medium">Summary</p>
        <div className="rounded-lg border bg-muted/20 p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Commission on Cession ({allocation.commissionPercent}%)
            </span>
            <span className="font-medium tabular-nums text-green-700">
              {fmtAED(effectiveTotalCommission, currency)}
            </span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Net Retention (after commission)</span>
            <span className="tabular-nums">
              {fmtAED(effectiveRetention + effectiveTotalCommission, currency)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Mandatory Facultative component ──────────────────────────────────────────

const isMandatoryFac = (alloc: TreatyAllocation) =>
  alloc.structureType?.toLowerCase().includes('mandatory facultative') ||
  alloc.structureType?.toLowerCase().includes('facultative') ||
  alloc.treatyId === 'mandatory-facultative' ||
  alloc.treatyCode === 'FAC';

/** Aligns with `isMandatoryFac` for triggered-treaty rows (no program treaty → hide manual extra retention). */
function triggeredTreatyIsMandatoryFacOnly(t: TriggeredTreatyItem): boolean {
  const st = t.treaty.structureType?.toLowerCase() ?? '';
  const code = (t.treaty.treatyCode ?? '').toUpperCase();
  const id = t.treaty.id;
  return (
    st.includes('mandatory facultative') ||
    st.includes('facultative') ||
    id === 'mandatory-facultative' ||
    code === 'FAC'
  );
}

const allocKey = (alloc: TreatyAllocation, index: number) =>
  `${alloc.coverId || 'all'}_${alloc.treatyId}_${index}`;

/** Pure helper — compute effective cession using OGR/ONR logic. */
function computeEffectiveCession(
  alloc: TreatyAllocation,
  overridePremium: number,
): { grossPremium: number; effectiveCession: number; effectiveRetention: number; cessionPct: number } {
  const grossPremium = alloc.technicalRate + overridePremium;
  const cessionPct =
    alloc.cessionPercent ||
    (alloc.allocatedPremium > 0
      ? Math.round((alloc.cessionAmount / alloc.allocatedPremium) * 100)
      : 0);
  const premiumForCession =
    alloc.premiumBasisOgrOnr === 'ONR' ? alloc.technicalRate : grossPremium;
  const effectiveCession = premiumForCession * (cessionPct / 100);
  const effectiveRetention = grossPremium - effectiveCession;
  return { grossPremium, effectiveCession, effectiveRetention, cessionPct };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function ReinsuranceHandlingPage() {
  const { referralId } = useParams<{ referralId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith('/market-admin') ? '/market-admin' : '/insurer';
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const quoteId = searchParams.get('quoteId') ?? '';
  const productName = searchParams.get('productName') ?? 'Product';
  const coverId = searchParams.get('coverId') ?? undefined;
  const coverTitle = searchParams.get('coverTitle') ?? undefined;
  const currency = searchParams.get('currency') ?? 'AED';
  const policyInceptionDate = searchParams.get('policyInceptionDate') ?? undefined;
  const sumInsuredParam = searchParams.get('sumInsured');
  const grossPremiumParam = searchParams.get('grossPremium');
  const coverIdsParam = searchParams.get('coverIds');
  const combinedFacBundleId = searchParams.get('combinedFacBundleId');
  const coverIdsList = useMemo(
    () =>
      coverIdsParam
        ? [...new Set(coverIdsParam.split(',').map((s) => s.trim()).filter(Boolean))]
        : [],
    [coverIdsParam],
  );
  const handlingScopeKey =
    coverIdsList.length > 0 ? coverIdsList.slice().sort().join('|') : coverId ?? '';
  /** Prefer explicit multi-select list; else single coverId from URL (API accepts one cover). */
  const handlingCoverIdForApi =
    coverIdsList.length === 1 ? coverIdsList[0] : coverId;
  const effectiveCoverIdSet =
    coverIdsList.length > 0
      ? new Set(coverIdsList)
      : coverId
        ? new Set([coverId])
        : undefined;

  const [isDirty, setIsDirty] = useState(false);
  const [extraRetentionPct, setExtraRetentionPct] = useState<number>(0);
  const [appliedExtraRetPct, setAppliedExtraRetPct] = useState<number>(0);
  const [layerOverrides, setLayerOverrides] = useState<Record<string, LayerOverride>>({});
  // treatyCode → mutable row list for Mandatory Facultative panels
  const [facRows, setFacRows] = useState<Record<string, FacRow[]>>({});
  // Manual override rows for QS/Surplus (Share %, Shared Premium, Comm. %)
  const [manualReinsurerRows, setManualReinsurerRows] = useState<
    Record<string, ManualReinsurerRow[]>
  >({});
  // User-created facultative layers (rich breakdown with reinsurer rows)
  const [userFacLayers, setUserFacLayers] = useState<Array<{
    id: string;
    cededSumInsured: number;
    rows: FacRow[];
  }>>([]);
  const [facOutreachCases, setFacOutreachCases] = useState<FacOutreachCaseState[]>([]);
  // Modal state: null = closed, object = draft being edited in modal
  const [facModalDraft, setFacModalDraft] = useState<FacultativeArrangeDraft | null>(null);
  const [facNewRequestOpen, setFacNewRequestOpen] = useState(false);
  const updateFacModalDraft = useCallback((updater: React.SetStateAction<FacultativeArrangeDraft | null>) => {
    setFacModalDraft(updater);
  }, []);
  // Editing state for inline fac cards
  const [editingFacLayerId, setEditingFacLayerId] = useState<string | null>(null);
  const hasInitializedRef = useRef(false);
  useEffect(() => {
    hasInitializedRef.current = false;
  }, [handlingScopeKey]);
  // Refs for scroll-to-section
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  // Onboarded reinsurers for dropdown — try API first, fall back to context panel data
  const [onboardedReinsurers, setOnboardedReinsurers] = useState<Reinsurer[]>([]);
  useEffect(() => {
    listReinsurers({ limit: 200, status: 'ACTIVE' })
      .then((res) => setOnboardedReinsurers(res.data ?? []))
      .catch(() => {}); // Silently fail — insurer may not have access
  }, []);

  const {
    data: context,
    isLoading,
    isFetching: contextFetching,
    error,
  } = useQuery({
    queryKey: ['reinsurance-context', referralId, coverId, coverIdsParam, policyInceptionDate, appliedExtraRetPct],
    queryFn: () =>
      getReinsuranceContext(referralId!, {
        ...(policyInceptionDate ? { policyInceptionDate } : {}),
        ...(sumInsuredParam ? { sumInsured: Number(sumInsuredParam) } : {}),
        ...(grossPremiumParam ? { grossPremium: Number(grossPremiumParam) } : {}),
        ...(appliedExtraRetPct > 0 ? { extraRetentionPercent: appliedExtraRetPct } : {}),
      }),
    enabled: !!referralId,
    staleTime: 1000 * 60 * 5,
    placeholderData: (prev) => prev,
  });

  const {
    data: savedHandling,
    isLoading: handlingLoading,
    isFetching: handlingFetching,
  } = useQuery({
    queryKey: ['reinsurance-handling', referralId, handlingScopeKey],
    queryFn: () =>
      getReinsuranceHandling(
        referralId!,
        handlingCoverIdForApi ? { coverId: handlingCoverIdForApi } : undefined,
      ),
    enabled: !!referralId,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const saveMutation = useMutation({
    mutationFn: (payload: Parameters<typeof saveReinsuranceHandling>[1]) =>
      saveReinsuranceHandling(referralId!, payload),
    onSuccess: () => {
      setIsDirty(false);
      queryClient.invalidateQueries({ queryKey: ['reinsurance-handling', referralId, handlingScopeKey] });
      toast({
        title: 'Handling saved',
        description: 'Reinsurance handling decisions have been saved.',
      });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[saveReinsuranceHandling] Failed:', err);
      toast({
        title: 'Error',
        description: `Failed to save handling decisions. ${message}`,
        variant: 'destructive',
      });
    },
  });

  // Filter triggered treaties by coverId (kept for Treaty Details section)
  const triggeredForCover = effectiveCoverIdSet
    ? (context?.triggeredTreaties ?? []).filter((t) => effectiveCoverIdSet.has(t.coverId))
    : (context?.triggeredTreaties ?? []);

  const grossPremium = context?.grossPremium ?? 0;
  const allAllocations: TreatyAllocation[] = context?.treatyAllocations ?? [];
  const allocations: TreatyAllocation[] = effectiveCoverIdSet
    ? allAllocations.filter((a) => effectiveCoverIdSet.has(a.coverId))
    : allAllocations;

  const hasTreatyProgramForExtraRetention = useMemo(
    () =>
      allocations.some((a) => !isMandatoryFac(a)) ||
      triggeredForCover.some((t) => !triggeredTreatyIsMandatoryFacOnly(t)),
    [allocations, triggeredForCover],
  );

  const effectiveExtraRetentionPct = hasTreatyProgramForExtraRetention ? extraRetentionPct : 0;

  useEffect(() => {
    if (!hasTreatyProgramForExtraRetention && (extraRetentionPct !== 0 || appliedExtraRetPct !== 0)) {
      setExtraRetentionPct(0);
      setAppliedExtraRetPct(0);
    }
  }, [hasTreatyProgramForExtraRetention, extraRetentionPct, appliedExtraRetPct]);

  const retentionAvailableForOutreach = useMemo(() => {
    const totalSI = context?.sumInsured ?? 0;
    const treatyAllocatedSI = allocations.reduce((s, a) => s + a.allocatedSumInsured, 0);
    const otherFacCededSI = userFacLayers
      .filter((l) => l.cededSumInsured > 0)
      .reduce((s, l) => s + l.cededSumInsured, 0);
    const er = effectiveExtraRetentionPct;
    return (
      allocations.reduce((s, a) => s + a.retentionSumInsured, 0) +
      totalSI * (er / 100) +
      Math.max(0, totalSI * (1 - er / 100) - treatyAllocatedSI) -
      otherFacCededSI
    );
  }, [context?.sumInsured, allocations, userFacLayers, effectiveExtraRetentionPct]);

  const handleOutreachSent = useCallback(
    (parties: FacultativeNewParty[]) => {
      const sought = context?.sumInsured ?? (sumInsuredParam ? Number(sumInsuredParam) : 0);
      setFacOutreachCases((prev) => [...prev, createOutreachCaseFromParties(parties, sought)]);
      setIsDirty(true);
      if (combinedFacBundleId) {
        completeCombinedFacBundle(combinedFacBundleId, {
          recipientCount: parties.length,
          recipientNames: parties.map((p) => p.name),
        });
      }
    },
    [context?.sumInsured, sumInsuredParam, combinedFacBundleId],
  );

  // Build reinsurer list: prefer API data, fall back to panel data from context
  const availableReinsurers: Reinsurer[] =
    onboardedReinsurers.length > 0
      ? onboardedReinsurers
      : (() => {
          const seen = new Set<string>();
          const result: Reinsurer[] = [];
          // Extract from triggered treaty panels
          for (const t of triggeredForCover) {
            for (const p of t.treaty.panel ?? []) {
              if (p.name && !seen.has(p.name)) {
                seen.add(p.name);
                result.push({ id: p.reinsurerId || p.name, name: p.name, status: 'active' });
              }
            }
          }
          // Also extract from allocation reinsurer breakdowns
          for (const a of allocations) {
            for (const r of a.reinsurerBreakdown ?? []) {
              if (r.name && !seen.has(r.name)) {
                seen.add(r.name);
                result.push({ id: r.reinsurerId || r.name, name: r.name, status: 'active' });
              }
            }
          }
          return result;
        })();

  // Initialize override state once when data is ready
  useEffect(() => {
    if (hasInitializedRef.current) return;
    if (isLoading || handlingLoading || handlingFetching) return;
    // For no-treaty scenarios, still initialize from saved handling (fac layers)
    if (allocations.length === 0 && !savedHandling) return;

    hasInitializedRef.current = true;
    const saved = savedHandling as (SavedHandling & { extraRetentionPercent?: number }) | null | undefined;
    if (saved?.extraRetentionPercent && hasTreatyProgramForExtraRetention) {
      setExtraRetentionPct(saved.extraRetentionPercent);
      setAppliedExtraRetPct(saved.extraRetentionPercent);
    }
    const newOverrides: Record<string, LayerOverride> = {};
    const newFacRows: Record<string, FacRow[]> = {};

    const newManualRows: Record<string, ManualReinsurerRow[]> = {};
    allocations.forEach((alloc, idx) => {
      const savedLayer = saved?.layers?.find((sl) => sl.layerType === alloc.structureType);
      const isFac = isMandatoryFac(alloc);
      const key = allocKey(alloc, idx);
      newOverrides[key] = {
        overridePremium: savedLayer?.overridePremium ?? 0,
        isFacultativeMode: isFac ? true : (savedLayer?.isFacultativeMode ?? false),
        isManualOverride: savedLayer?.isManualOverride ?? false,
      };
      if (!isFac && (savedLayer?.isFacultativeMode ?? false)) {
        if (savedLayer?.reinsurerBreakdown?.length) {
          newManualRows[key] = savedLayer.reinsurerBreakdown.map((sr) => {
            const orig = alloc.reinsurerBreakdown.find((r) => r.name === sr.name);
            return {
              reinsurerId: orig?.reinsurerId ?? '',
              name: sr.name,
              sharePercent: sr.sharePercentage ?? 0,
              sharedPremium: sr.premium ?? 0,
              commissionPercent: sr.commissionPercent ?? 0,
            };
          });
        } else {
          const activeOverride = savedLayer?.overridePremium ?? 0;
          const { effectiveCession } = computeEffectiveCession(alloc, activeOverride);
          const overrideRatio =
            alloc.cessionAmount > 0 ? effectiveCession / alloc.cessionAmount : 1;
          newManualRows[key] = alloc.reinsurerBreakdown.map((r) => ({
            reinsurerId: r.reinsurerId,
            name: r.name,
            sharePercent: r.sharePercent,
            sharedPremium: Math.round(r.sharedPremium * overrideRatio),
            commissionPercent: r.commissionPercent,
          }));
        }
      }
      if (isFac) {
        if (savedLayer?.reinsurerBreakdown?.length) {
          newFacRows[key] = savedLayer.reinsurerBreakdown.map((sr, i) => ({
            id: `saved-${i}`,
            reinsurerId:
              alloc.reinsurerBreakdown.find((r) => r.name === sr.name)?.reinsurerId ?? '',
            name: sr.name,
            sharePercent: sr.sharePercentage ?? 0,
            commissionPercent: sr.commissionPercent ?? 0,
          }));
        } else {
          newFacRows[key] = alloc.reinsurerBreakdown.map((r, i) => ({
            id: `ctx-${i}`,
            reinsurerId: r.reinsurerId,
            name: r.name,
            sharePercent: r.sharePercent,
            commissionPercent: r.commissionPercent,
          }));
        }
      }
    });

    setLayerOverrides(newOverrides);
    setFacRows(newFacRows);
    setManualReinsurerRows((prev) =>
      Object.keys(newManualRows).length > 0 ? { ...prev, ...newManualRows } : prev,
    );

    // Hydrate user-created fac layers from saved handling
    console.log('[ReinsuranceHandling] Saved handling raw data:', JSON.stringify(saved, null, 2));
    const facSlipLayers = saved?.layers?.filter(
      (l) => !l.treatyId && l.isFacultativeMode,
    ) ?? [];
    console.log('[ReinsuranceHandling] Fac slip layers to hydrate:', JSON.stringify(facSlipLayers, null, 2));
    if (facSlipLayers.length > 0) {
      const totalSI = context?.sumInsured ?? 1;
      setUserFacLayers(facSlipLayers.map((l, i) => {
        // Prefer cededSumInsured from API; fall back to reverse-calculating from premium
        const savedPremium = l.overridePremium ?? 0;
        const cededSI = l.cededSumInsured
          ? l.cededSumInsured
          : grossPremium > 0 ? Math.round((savedPremium / grossPremium) * totalSI) : 0;
        return {
          id: `saved-fac-${i}`,
          cededSumInsured: cededSI,
          rows: (l.reinsurerBreakdown ?? []).map((sr, j) => ({
            id: `saved-row-${i}-${j}`,
            reinsurerId: sr.reinsurerId ?? '',
            name: sr.name,
            // API may return sharePercentage or sharePercent — handle both
            sharePercent: sr.sharePercentage ?? sr.sharePercent ?? 0,
            commissionPercent: sr.commissionPercent ?? 0,
          })),
        };
      }));
    }
  }, [
    allocations,
    savedHandling,
    isLoading,
    handlingLoading,
    handlingFetching,
    handlingScopeKey,
    hasTreatyProgramForExtraRetention,
  ]);

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

  const handleOverridePremiumChange = (treatyCode: string, val: number) => {
    setIsDirty(true);
    setLayerOverrides((prev) => ({
      ...prev,
      [treatyCode]: { ...prev[treatyCode], overridePremium: val, isManualOverride: true },
    }));

    // Recalculate manual reinsurer rows based on new effective cession
    const allocation = allocations.find((a, i) => allocKey(a, i) === treatyCode);
    if (!allocation) return;

    const { effectiveCession: newEffectiveCession } = computeEffectiveCession(allocation, val);

    setManualReinsurerRows((prev) => {
      const rows = prev[treatyCode];
      if (!rows || rows.length === 0) return prev;
      return {
        ...prev,
        [treatyCode]: rows.map((row) => ({
          ...row,
          sharedPremium: Math.round(newEffectiveCession * (row.sharePercent / 100)),
        })),
      };
    });
  };

  const handleFacRowsChange = (treatyCode: string, rows: FacRow[]) => {
    setIsDirty(true);
    setFacRows((prev) => ({ ...prev, [treatyCode]: rows }));
  };

  const handleManualReinsurerRowsChange = (key: string, rows: ManualReinsurerRow[]) => {
    setIsDirty(true);
    setManualReinsurerRows((prev) => ({ ...prev, [key]: rows }));
  };

  const handleFacultativeModeChange = (key: string, val: boolean) => {
    setIsDirty(true);
    setLayerOverrides((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        isFacultativeMode: val,
        // Reset override when turning off
        ...(val === false ? { overridePremium: 0, isManualOverride: false } : {}),
      },
    }));
    // When turning manual override ON, init manual reinsurer rows from allocation
    if (val) {
      const alloc = allocations.find((a, i) => allocKey(a, i) === key);
      if (alloc && !isMandatoryFac(alloc)) {
        const override = layerOverrides[key];
        const activeOverride = override?.overridePremium ?? 0;
        const { effectiveCession } = computeEffectiveCession(alloc, activeOverride);
        const overrideRatio = alloc.cessionAmount > 0 ? effectiveCession / alloc.cessionAmount : 1;
        const rows: ManualReinsurerRow[] = alloc.reinsurerBreakdown.map((r) => ({
          reinsurerId: r.reinsurerId,
          name: r.name,
          sharePercent: r.sharePercent,
          sharedPremium: Math.round(r.sharedPremium * overrideRatio),
          commissionPercent: r.commissionPercent,
        }));
        setManualReinsurerRows((prev) => ({ ...prev, [key]: rows }));
      }
    } else {
      setManualReinsurerRows((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleSave = () => {
    // If any fac layer doesn't have 100% share, scroll to it instead of saving
    if (!facShareValid) {
      let incompleteKey = '';
      const incomplete = allocations.find((a, i) => {
        if (!isMandatoryFac(a)) return false;
        const k = allocKey(a, i);
        const rows = facRows[k] ?? [];
        const total = rows.reduce((s, r) => s + r.sharePercent, 0);
        if (Math.abs(total - 100) > 0.01) { incompleteKey = k; return true; }
        return false;
      });
      if (incomplete) {
        scrollToSection(incompleteKey);
        toast({
          title: 'Incomplete share allocation',
          description: 'Mandatory Facultative share total must equal 100% before saving.',
          variant: 'destructive',
        });
      }
      return;
    }

    // Validate user-created fac layers have 100% share total
    const invalidFacLayer = userFacLayers.find((layer) => {
      if (layer.cededSumInsured <= 0 || layer.rows.length === 0) return false;
      const total = layer.rows.reduce((s, r) => s + r.sharePercent, 0);
      return Math.abs(total - 100) > 0.01;
    });
    if (invalidFacLayer) {
      toast({
        title: 'Incomplete share allocation',
        description: 'Facultative reinsurer share total must equal 100% before saving.',
        variant: 'destructive',
      });
      return;
    }

    // Validate total ceded SI does not exceed sum insured
    const totalSI = context?.sumInsured ?? 0;
    const totalCededSI = facSlipsCededSI;
    if (totalSI > 0 && totalCededSI > totalSI) {
      toast({
        title: 'Ceded SI exceeds Sum Insured',
        description: `Total ceded SI (${fmtAED(totalCededSI, currency)}) exceeds sum insured (${fmtAED(totalSI, currency)}).`,
        variant: 'destructive',
      });
      return;
    }

    const layersPayload = allocations.map((alloc, idx) => {
      const key = allocKey(alloc, idx);
      const override = layerOverrides[key];
      const isFac = isMandatoryFac(alloc);

      if (isFac) {
        const mutableRows = facRows[key] ?? [];
        const effectivePanel = mutableRows.map((r) => {
          const sharedPremium = (alloc.cessionAmount * r.sharePercent) / 100;
          const commissionAmount = Math.round((sharedPremium * r.commissionPercent) / 100);
          return {
            name: r.name,
            sharePercentage: r.sharePercent,
            premium: Math.round(sharedPremium),
            commissionPercent: r.commissionPercent,
            commissionAmount,
          };
        });
        return {
          layerType: alloc.structureType,
          treatyId: alloc.treatyId,
          overridePremium: 0,
          isFacultativeMode: true,
          isManualOverride: false,
          reinsurerBreakdown: effectivePanel,
        };
      }

      // Standard QS / Surplus
      const manualRows = manualReinsurerRows[key];
      const useManual =
        override?.isFacultativeMode && manualRows && manualRows.length > 0;
      const effectivePanel = useManual
        ? manualRows.map((m) => ({
            name: m.name,
            sharePercentage: m.sharePercent,
            premium: Math.round(m.sharedPremium),
            commissionPercent: m.commissionPercent,
            commissionAmount: Math.round((m.sharedPremium * m.commissionPercent) / 100),
          }))
        : (() => {
            const activeOverride = override?.isFacultativeMode ? (override.overridePremium ?? 0) : 0;
            const { effectiveCession } = computeEffectiveCession(alloc, activeOverride);
            const overrideRatio = alloc.cessionAmount > 0 ? effectiveCession / alloc.cessionAmount : 1;
            return alloc.reinsurerBreakdown.map((r) => {
              const premium = r.sharedPremium * overrideRatio;
              const commissionAmount = (premium * r.commissionPercent) / 100;
              return {
                name: r.name,
                sharePercentage: r.sharePercent,
                premium: Math.round(premium),
                commissionPercent: r.commissionPercent,
                commissionAmount: Math.round(commissionAmount),
              };
            });
          })();
      return {
        layerType: alloc.structureType,
        treatyId: alloc.treatyId,
        overridePremium: override?.isManualOverride ? (override.overridePremium ?? 0) : 0,
        isFacultativeMode: override?.isFacultativeMode ?? false,
        isManualOverride: override?.isManualOverride ?? false,
        reinsurerBreakdown: effectivePanel,
      };
    });

    // Add user-created facultative layers
    const facSlipLayers = userFacLayers
      .filter((layer) => layer.cededSumInsured > 0 && layer.rows.length > 0)
      .map((layer) => {
        const totalSI = context?.sumInsured ?? 1;
        const cededPremium = totalSI > 0 ? grossPremium * (layer.cededSumInsured / totalSI) : 0;
        return {
          layerType: 'facultative',
          treatyId: undefined as string | undefined,
          cededSumInsured: layer.cededSumInsured,
          overridePremium: Math.round(cededPremium),
          isFacultativeMode: true,
          isManualOverride: true,
          reinsurerBreakdown: layer.rows.map((r) => ({
            reinsurerId: r.reinsurerId || undefined,
            name: r.name,
            sharePercentage: r.sharePercent,
            sharePercent: r.sharePercent,
            risk: Math.round((layer.cededSumInsured * r.sharePercent) / 100),
            premium: Math.round((cededPremium * r.sharePercent) / 100),
            commissionPercent: r.commissionPercent,
            commissionAmount: Math.round(((cededPremium * r.sharePercent) / 100) * r.commissionPercent / 100),
          })),
        };
      });

    saveMutation.mutate({
      coverId:
        coverIdsList.length === 1
          ? coverIdsList[0]
          : coverIdsList.length > 1
            ? null
            : coverId ?? null,
      unitId: null,
      extraRetentionPercent: effectiveExtraRetentionPct,
      layers: [...layersPayload, ...facSlipLayers],
    });
  };

  const treatyCommission = allocations.reduce((s, alloc, idx) => {
    const key = allocKey(alloc, idx);
    const override = layerOverrides[key];
    const manualRows = manualReinsurerRows[key];

    // If manual override ON and manual rows exist, sum commission from them directly
    if (override?.isFacultativeMode && manualRows && manualRows.length > 0) {
      return s + manualRows.reduce((ps, m) => ps + (m.sharedPremium * m.commissionPercent) / 100, 0);
    }

    // Otherwise compute from allocation with override scaling (OGR/ONR aware)
    const activeOverride = override?.isFacultativeMode ? (override?.overridePremium ?? 0) : 0;
    const { effectiveCession } = computeEffectiveCession(alloc, activeOverride);
    const overrideRatio = alloc.cessionAmount > 0 ? effectiveCession / alloc.cessionAmount : 1;

    return (
      s +
      alloc.reinsurerBreakdown.reduce((ps, r) => {
        const premium = r.sharedPremium * overrideRatio;
        return ps + (premium * r.commissionPercent) / 100;
      }, 0)
    );
  }, 0);

  // Fac layer premium & commission contributions
  const facSlipCededPremium = userFacLayers
    .filter((layer) => layer.cededSumInsured > 0)
    .reduce((sum, layer) => {
      const totalSI = context?.sumInsured ?? 1;
      const cededPremium = totalSI > 0 ? grossPremium * (layer.cededSumInsured / totalSI) : 0;
      return sum + cededPremium;
    }, 0);

  const facSlipCommission = userFacLayers
    .filter((layer) => layer.cededSumInsured > 0)
    .reduce((sum, layer) => {
      const totalSI = context?.sumInsured ?? 1;
      const cededPremium = totalSI > 0 ? grossPremium * (layer.cededSumInsured / totalSI) : 0;
      return sum + layer.rows.reduce((rs, r) => {
        const sharedPremium = (cededPremium * r.sharePercent) / 100;
        return rs + (sharedPremium * r.commissionPercent) / 100;
      }, 0);
    }, 0);

  const totalCommission = treatyCommission + facSlipCommission;

  const treatyRetention = allocations.reduce((s, alloc, idx) => {
    const key = allocKey(alloc, idx);
    const override = layerOverrides[key];
    const activeOverride = override?.isFacultativeMode ? (override?.overridePremium ?? 0) : 0;
    const { effectiveRetention } = computeEffectiveCession(alloc, activeOverride);
    return s + effectiveRetention;
  }, 0);

  const totalEffectiveRetention = treatyRetention - facSlipCededPremium + facSlipCommission;

  const facSlipsCededSI = userFacLayers
    .filter((layer) => layer.cededSumInsured > 0)
    .reduce((sum, layer) => sum + layer.cededSumInsured, 0);

  const isMultiTreaty = allocations.length > 1;
  const programName = triggeredForCover[0]?.program?.treatyName ?? productName;

  // Check if all fac layers have 100% share total
  const facShareValid = allocations.every((a, i) => {
    if (!isMandatoryFac(a)) return true;
    const rows = facRows[allocKey(a, i)] ?? [];
    const total = rows.reduce((s, r) => s + r.sharePercent, 0);
    return Math.abs(total - 100) <= 0.01;
  });

  // Average commission percent across all allocations
  const avgCommissionPercent =
    allocations.length > 0
      ? Math.round(allocations.reduce((s, a) => s + a.commissionPercent, 0) / allocations.length)
      : 0;

  const scrollToSection = (treatyCode: string) => {
    sectionRefs.current[treatyCode]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const showInsurerFacRequestColumns = basePath === '/insurer' && Boolean(referralId);

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading reinsurance data…</p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <XCircle className="h-10 w-10 text-destructive mx-auto" />
          <p className="text-sm text-muted-foreground">Failed to load reinsurance context.</p>
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            Go Back
          </Button>
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

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="border-b bg-card px-6 py-4 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto max-w-6xl flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => guardedNavigate(() => navigate(`${basePath}/referral/${referralId}?quoteId=${quoteId}`))}
            className="flex items-center gap-2 shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Shield className="h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <h1 className="text-lg font-semibold leading-tight">Reinsurance Breakdown</h1>
              <p className="text-sm text-muted-foreground">
                {productName}
                {coverTitle && ` — ${coverTitle}`}
                {quoteId && ` — ${quoteId}`}
              </p>
            </div>
            {isMultiTreaty && (
              <Badge className="ml-2 bg-purple-100 text-purple-700 border border-purple-200 text-xs">
                Multi-Treaty
              </Badge>
            )}
          </div>
          {(allocations.length > 0 || userFacLayers.length > 0) && (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="shrink-0 gap-2"
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Handling Decisions
            </Button>
          )}
        </div>
      </div>

      <div className="container mx-auto max-w-6xl py-8 px-4 space-y-8">
            {/* ── Cover breakdown + overview + summary (single card) ── */}
            <Card className="border-primary bg-primary text-primary-foreground">
              <CardHeader>
                <CardTitle className="flex items-start gap-3 text-primary-foreground">
                  <div className="rounded-lg bg-primary-foreground/20 p-2 shrink-0">
                    <Layers className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-primary-foreground/70">
                      Cover Breakdown
                    </p>
                    <p className="text-lg font-semibold leading-tight tracking-tight">{programName}</p>
                  </div>
                </CardTitle>
                <CardDescription className="text-primary-foreground/80">
                  Reinsurance Overview · Sum Insured: {fmtAED(context?.sumInsured ?? 0, currency)} ·
                  Gross Premium: {fmtAED(grossPremium, currency)}
                  {coverTitle && ` · ${coverTitle}`}
                  {contextFetching && !isLoading && (
                    <span className="inline-flex items-center gap-1 ml-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Updating…
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {allocations.length === 0 && (
                  <>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-primary-foreground/70">
                      Reinsurance Summary
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'SUM INSURED', value: fmtAED(context?.sumInsured ?? 0, currency) },
                        { label: 'GROSS PREMIUM', value: fmtAED(grossPremium, currency) },
                        { label: 'CESSION (SI)', value: fmtAED(facSlipsCededSI, currency) },
                        { label: 'RETENTION (SI)', value: fmtAED((context?.sumInsured ?? 0) - facSlipsCededSI, currency) },
                        { label: 'COMMISSION', value: fmtAED(facSlipCommission, currency) },
                        {
                          label: 'NET PREMIUM RETENTION AFTER COMMISSION',
                          value: fmtAED(grossPremium - facSlipCededPremium + facSlipCommission, currency),
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 p-3"
                        >
                          <p className="text-[10px] font-medium uppercase tracking-wide text-primary-foreground/60">
                            {item.label}
                          </p>
                          <p className="mt-1 text-sm font-bold tabular-nums text-primary-foreground">{item.value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-primary-foreground/20" />
                  </>
                )}

                <div
                  className={`grid gap-4 ${
                    allocations.length === 1 ? 'sm:grid-cols-1 max-w-sm' : 'sm:grid-cols-3'
                  }`}
                >
                  {allocations.map((alloc, idx) => (
                    <OverviewLayerCard
                      key={allocKey(alloc, idx)}
                      allocation={alloc}
                      currency={currency}
                      onClick={() => scrollToSection(allocKey(alloc, idx))}
                    />
                  ))}
                  {userFacLayers.filter((l) => l.cededSumInsured > 0).map((layer, i) => {
                    const totalSI = context?.sumInsured ?? 0;
                    const cededPremium = totalSI > 0 ? grossPremium * (layer.cededSumInsured / totalSI) : 0;
                    const retainedSI = layer.cededSumInsured > totalSI ? 0 : totalSI - layer.cededSumInsured;
                    return (
                      <div key={layer.id} className="rounded-lg border border-border bg-background p-4 space-y-3 text-foreground">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <span className="font-semibold text-sm block">Facultative Slip</span>
                              <p className="text-xs text-muted-foreground truncate">FAC-{layer.id.slice(4, 8).toUpperCase()}</p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-xs">Facultative</Badge>
                        </div>
                        <div className="space-y-1 text-sm border-t pt-2">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Sum Insured</span>
                            <span className="font-medium tabular-nums text-gray-900">{fmtAED(totalSI, currency)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Ceded SI</span>
                            <span className="font-medium tabular-nums text-gray-900">{fmtAED(layer.cededSumInsured, currency)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Retained SI</span>
                            <span className="font-medium tabular-nums text-gray-900">{fmtAED(retainedSI, currency)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Premium</span>
                            <span className="font-medium tabular-nums text-gray-900">{fmtAED(Math.round(cededPremium), currency)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">% of Total</span>
                            <span className="font-medium tabular-nums text-gray-900">{totalSI > 0 ? ((layer.cededSumInsured / totalSI) * 100).toFixed(1) : '0.0'}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Summary totals */}
                <div className="rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 p-4 space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-primary-foreground">
                      Commission on cession ({avgCommissionPercent}%)
                    </span>
                    <span className="font-bold tabular-nums text-primary-foreground">
                      {fmtAED(totalCommission, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-primary-foreground">
                      Net retention (after commission)
                    </span>
                    <span className="font-bold tabular-nums text-primary-foreground">
                      {fmtAED(totalEffectiveRetention + totalCommission, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t border-primary-foreground/20 pt-2">
                    <span className="font-medium text-primary-foreground">
                      Total Retention Available for Facultative
                    </span>
                    <span className="font-bold tabular-nums text-primary-foreground">
                      {fmtAED(
                        allocations.reduce((s, a) => s + a.retentionSumInsured, 0) +
                        (context?.sumInsured ?? 0) * (effectiveExtraRetentionPct / 100) +
                        ((context?.sumInsured ?? 0) * (1 - effectiveExtraRetentionPct / 100) -
                          allocations.reduce((s, a) => s + a.allocatedSumInsured, 0)) -
                        facSlipsCededSI,
                        currency,
                      )}
                    </span>
                  </div>
                </div>

                {hasTreatyProgramForExtraRetention && (
                  <>
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
                    <Button
                      size="sm"
                      disabled={extraRetentionPct === appliedExtraRetPct}
                      onClick={() => setAppliedExtraRetPct(extraRetentionPct)}
                    >
                      {contextFetching && !isLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        'Apply'
                      )}
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-4 items-end">
                    <div>
                      <label className="text-xs font-medium text-gray-500">Retention %</label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={extraRetentionPct === 0 ? '' : extraRetentionPct}
                        onChange={(e) => {
                          const v = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0));
                          setExtraRetentionPct(v);
                          setIsDirty(true);
                        }}
                        placeholder="0"
                        className="bg-white text-gray-900 border-gray-300"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Retained Amount</label>
                      <div className="text-sm font-semibold mt-1 text-gray-900">
                        {fmtAED((context?.sumInsured ?? 0) * (extraRetentionPct / 100), currency)}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Effective SI for Treaties</label>
                      <div className="text-sm font-semibold mt-1 text-gray-900">
                        {fmtAED((context?.sumInsured ?? 0) * (1 - extraRetentionPct / 100), currency)}
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
                  </>
                )}
              </CardContent>
            </Card>

            {/* ── Per-layer breakdowns (treaty program only) ──────── */}
            {allocations.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Treaty Breakdowns
              </h2>
              {allocations.map((alloc, idx) => {
                const key = allocKey(alloc, idx);
                return (
                  <div
                    key={key}
                    ref={(el) => {
                      sectionRefs.current[key] = el;
                    }}
                  >
                    {isMandatoryFac(alloc) ? (
                      <FacultativeLayerBreakdownSection
                        allocation={alloc}
                        currency={currency}
                        initialRows={
                          facRows[key] ??
                          alloc.reinsurerBreakdown.map((r, i) => ({
                            id: `ctx-${i}`,
                            reinsurerId: r.reinsurerId,
                            name: r.name,
                            sharePercent: r.sharePercent,
                            commissionPercent: r.commissionPercent,
                          }))
                        }
                        onRowsChange={(rows) => handleFacRowsChange(key, rows)}
                        reinsurers={availableReinsurers}
                      />
                    ) : (
                      <LayerBreakdownSection
                        allocation={alloc}
                        currency={currency}
                        isFac={isMandatoryFac(alloc)}
                        override={
                          layerOverrides[key] ?? {
                            overridePremium: 0,
                            isFacultativeMode: false,
                            isManualOverride: false,
                          }
                        }
                        manualReinsurerRows={
                          layerOverrides[key]?.isFacultativeMode ? manualReinsurerRows[key] : undefined
                        }
                        onManualReinsurerRowsChange={
                          layerOverrides[key]?.isFacultativeMode
                            ? (rows) => handleManualReinsurerRowsChange(key, rows)
                            : undefined
                        }
                        onOverridePremiumChange={(val) => handleOverridePremiumChange(key, val)}
                        onFacultativeModeChange={(val) => handleFacultativeModeChange(key, val)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            )}

        {/* ── Treaty Allocations / Facultative (always visible) ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Treaty Allocations
            </h2>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => setFacNewRequestOpen(true)}
              >
                <Plus className="h-4 w-4" />
                FAC Out
              </Button>
            </div>
          </div>
          {allocations.length === 0 && userFacLayers.length === 0 && facOutreachCases.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-6 text-center text-sm text-muted-foreground">
                No treaties triggered. Use &quot;FAC Out&quot; to arrange a case-by-case reinsurer panel.
              </CardContent>
            </Card>
          )}

          {facOutreachCases.length > 0 && (
            <FacOutreachRequestsSection
              cases={facOutreachCases}
              setCases={setFacOutreachCases}
              currency={currency}
              referralId={referralId ?? ''}
              basePath={basePath}
            />
          )}

          {/* ── Facultative Reinsurance Section ── */}
          {userFacLayers.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Facultative Reinsurance
              </h2>
              {userFacLayers.map((layer, layerIdx) => {
                const totalSI = context?.sumInsured ?? 0;
                const cededPremium = totalSI > 0 ? grossPremium * (layer.cededSumInsured / totalSI) : 0;
                const isEditing = editingFacLayerId === layer.id;

                // Build synthetic allocation for the breakdown section
                const facAlloc: TreatyAllocation = {
                  treatyId: `user-fac-${layer.id}`,
                  structureType: 'Facultative',
                  treatyCode: 'FAC',
                  treatyName: 'Facultative',
                  allocatedSumInsured: layer.cededSumInsured,
                  allocatedPremium: cededPremium,
                  percentOfTotal: totalSI > 0 ? (layer.cededSumInsured / totalSI) * 100 : 0,
                  retentionPercent: 0,
                  cessionPercent: 100,
                  retentionAmount: 0,
                  cessionAmount: cededPremium,
                  retentionSumInsured: 0,
                  cessionSumInsured: layer.cededSumInsured,
                  commissionPercent: 0,
                  commissionAmount: 0,
                  netRetentionAfterCommission: 0,
                  technicalRate: 0,
                  isFacultative: true,
                  reinsurerBreakdown: [],
                };

                const effectivePanel = layer.rows.map((r) => {
                  const risk = (layer.cededSumInsured * r.sharePercent) / 100;
                  const sharedPremium = (cededPremium * r.sharePercent) / 100;
                  const commissionAmount = (sharedPremium * r.commissionPercent) / 100;
                  const ratePer = risk > 0 ? sharedPremium / risk : 0;
                  const rateAfterCommission = risk > 0 ? (sharedPremium - commissionAmount) / risk : 0;
                  return { ...r, risk, sharedPremium, commissionAmount, ratePer, rateAfterCommission };
                });
                const totalShare = layer.rows.reduce((s, r) => s + r.sharePercent, 0);
                const totalCommission = effectivePanel.reduce((s, r) => s + r.commissionAmount, 0);
                const totalRisk = effectivePanel.reduce((s, r) => s + r.risk, 0);
                const totalPremium = effectivePanel.reduce((s, r) => s + r.sharedPremium, 0);

                return (
                  <Card key={layer.id} className="border-blue-100 bg-blue-50/30">
                    {/* Card Header — Facultative Case #N */}
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base text-blue-900 flex items-center gap-2">
                            Facultative Case #{layerIdx + 1}
                            <Badge variant="outline" className="text-xs bg-amber-50 border-amber-200 text-amber-700">
                              Facultative
                            </Badge>
                          </CardTitle>
                          <CardDescription>
                            Case-by-case reinsurer panel (no treaty)
                            {showInsurerFacRequestColumns
                              ? ' · Made facultative requests: use Status and View details on each reinsurer line below.'
                              : ''}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {!isEditing ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 text-xs"
                              onClick={() => setEditingFacLayerId(layer.id)}
                            >
                              <FileText className="h-3.5 w-3.5" />
                              Edit
                            </Button>
                          ) : (
                            <Button
                              variant="default"
                              size="sm"
                              className="gap-1.5 text-xs"
                              onClick={() => setEditingFacLayerId(null)}
                            >
                              Apply
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-xs text-destructive hover:text-destructive"
                            disabled={isEditing}
                            onClick={() => {
                              setIsDirty(true);
                              setUserFacLayers((prev) => prev.filter((l) => l.id !== layer.id));
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Ceded SI & Premium */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Ceded SI</span>
                          {isEditing ? (
                            <FormattedNumberInput
                              allowDecimals={false}
                              allowEmpty
                              className="w-44 h-8 text-sm text-right tabular-nums"
                              value={layer.cededSumInsured || undefined}
                              onChange={(v) => {
                                setIsDirty(true);
                                setUserFacLayers((prev) =>
                                  prev.map((l) => l.id === layer.id ? { ...l, cededSumInsured: v ?? 0 } : l),
                                );
                              }}
                            />
                          ) : (
                            <span className="font-semibold tabular-nums">{fmtAED(layer.cededSumInsured, currency)}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Ceded Premium (derived)</span>
                          <span className="font-semibold tabular-nums">{fmtAED(Math.round(cededPremium), currency)}</span>
                        </div>
                      </div>

                      {/* Reinsurer Panel */}
                      {isEditing ? (
                        <FacultativeLayerBreakdownSection
                          allocation={facAlloc}
                          currency={currency}
                          initialRows={layer.rows}
                          onRowsChange={(rows) => {
                            setIsDirty(true);
                            setUserFacLayers((prev) =>
                              prev.map((l) => l.id === layer.id ? { ...l, rows } : l),
                            );
                          }}
                          reinsurers={availableReinsurers}
                        />
                      ) : (
                        <>
                          {/* Read-only reinsurer table */}
                          <div className="overflow-x-auto rounded-lg border border-border/60">
                            <p className="text-sm font-medium mb-2 px-1">Reinsurer Panel</p>
                            <table
                              className={`w-full border-collapse text-sm ${showInsurerFacRequestColumns ? 'min-w-[72rem]' : 'min-w-[42rem]'}`}
                            >
                              <thead>
                                <tr className="border-b border-border text-muted-foreground text-xs">
                                  <th className="px-3 py-2 text-left font-medium whitespace-nowrap">
                                    Reinsurer Name
                                  </th>
                                  <th className="px-3 py-2 text-right font-medium whitespace-nowrap">Risk</th>
                                  <th className="px-3 py-2 text-right font-medium whitespace-nowrap">Share %</th>
                                  <th className="px-3 py-2 text-right font-medium whitespace-nowrap">Premium</th>
                                  <th className="px-3 py-2 text-right font-medium whitespace-nowrap">Comm. %</th>
                                  <th className="px-3 py-2 text-right font-medium whitespace-nowrap">Commission</th>
                                  <th className="px-3 py-2 text-right font-medium whitespace-nowrap">Rate %</th>
                                  <th
                                    className="px-3 py-2 text-right font-medium whitespace-nowrap"
                                    title="Rate after commission"
                                  >
                                    Rate after comm.
                                  </th>
                                  {showInsurerFacRequestColumns ? (
                                    <>
                                      <th className="px-3 py-2 text-left font-medium whitespace-nowrap">Status</th>
                                      <th className="px-3 py-2 text-right font-medium whitespace-nowrap w-[1%]">
                                        Action
                                      </th>
                                    </>
                                  ) : null}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border">
                                {effectivePanel.map((r) => {
                                  const demoTpl = showInsurerFacRequestColumns
                                    ? matchFacultativeDemoTemplateByReinsurerName(r.name || '')
                                    : null;
                                  return (
                                    <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                                      <td className="px-3 py-2.5 font-medium whitespace-nowrap">{r.name || '—'}</td>
                                      <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">
                                        {fmtAED(Math.round(r.risk), currency)}
                                      </td>
                                      <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">
                                        {r.sharePercent}%
                                      </td>
                                      <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">
                                        {fmtAED(Math.round(r.sharedPremium), currency)}
                                      </td>
                                      <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">
                                        {r.commissionPercent}%
                                      </td>
                                      <td className="px-3 py-2.5 text-right tabular-nums text-green-700 whitespace-nowrap">
                                        {fmtAED(Math.round(r.commissionAmount), currency)}
                                      </td>
                                      <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">
                                        {(r.ratePer * 100).toFixed(2)}
                                      </td>
                                      <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">
                                        {(r.rateAfterCommission * 100).toFixed(2)}
                                      </td>
                                      {showInsurerFacRequestColumns && demoTpl && referralId ? (
                                        <>
                                          <td className="px-3 py-2.5 whitespace-nowrap align-middle">
                                            <Badge
                                              variant="outline"
                                              className={facultativeRequestStatusBadgeClass(demoTpl.status)}
                                            >
                                              {demoTpl.status}
                                            </Badge>
                                          </td>
                                          <td className="px-3 py-2.5 text-right whitespace-nowrap align-middle w-[1%]">
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="gap-1.5 whitespace-nowrap"
                                              onClick={() =>
                                                navigate(
                                                  `/insurer/referral/${referralId}/reinsurance/fac/${demoTpl.id}/reinsurer/${reinsurerSlugForDemoRow(demoTpl)}`,
                                                  {
                                                    state: {
                                                      record: {
                                                        ...demoTpl,
                                                        requestedCededSI: Math.round(r.risk),
                                                        premium: Math.round(r.sharedPremium),
                                                      },
                                                    },
                                                  },
                                                )
                                              }
                                            >
                                              View details
                                              <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                                            </Button>
                                          </td>
                                        </>
                                      ) : null}
                                    </tr>
                                  );
                                })}
                              </tbody>
                              <tfoot>
                                <tr className="border-t border-border font-semibold bg-muted/30">
                                  <td className="px-3 py-2">Total</td>
                                  <td className="px-3 py-2 text-right tabular-nums whitespace-nowrap">
                                    {fmtAED(Math.round(totalRisk), currency)}
                                  </td>
                                  <td className="px-3 py-2 text-right tabular-nums whitespace-nowrap">
                                    {totalShare.toFixed(2)}%
                                  </td>
                                  <td className="px-3 py-2 text-right tabular-nums whitespace-nowrap">
                                    {fmtAED(Math.round(totalPremium), currency)}
                                  </td>
                                  <td className="px-3 py-2" />
                                  <td className="px-3 py-2 text-right tabular-nums text-green-700 whitespace-nowrap">
                                    {fmtAED(Math.round(totalCommission), currency)}
                                  </td>
                                  <td className="px-3 py-2" />
                                  <td className="px-3 py-2" />
                                  {showInsurerFacRequestColumns ? (
                                    <>
                                      <td className="px-3 py-2" />
                                      <td className="px-3 py-2" />
                                    </>
                                  ) : null}
                                </tr>
                              </tfoot>
                            </table>
                          </div>

                          {/* Summary */}
                          <p className="text-sm font-medium">Summary</p>
                          <div className="rounded-lg border bg-muted/20 p-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Commission on Cession</span>
                              <span className="font-medium tabular-nums text-green-700">
                                {fmtAED(Math.round(totalCommission), currency)}
                              </span>
                            </div>
                            <div className="flex justify-between font-medium">
                              <span>Net Premium Retention (after commission)</span>
                              <span className="tabular-nums">
                                {fmtAED(Math.round(cededPremium - totalCommission), currency)}
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Arrange Facultative Reinsurance Modal ── */}
        {facModalDraft && (() => {
          const draft = facModalDraft;
          const totalSI = context?.sumInsured ?? 0;
          const treatyAllocatedSI = allocations.reduce((s, a) => s + a.allocatedSumInsured, 0);
          const otherFacCededSI = userFacLayers
            .filter((l) => l.id !== draft.id && l.cededSumInsured > 0)
            .reduce((s, l) => s + l.cededSumInsured, 0);
          const retentionAvailable =
            allocations.reduce((s, a) => s + a.retentionSumInsured, 0) +
            totalSI * (effectiveExtraRetentionPct / 100) +
            Math.max(0, totalSI * (1 - effectiveExtraRetentionPct / 100) - treatyAllocatedSI) -
            otherFacCededSI;

          return (
            <ArrangeFacultativeReinsuranceDialog
              draft={draft}
              updateDraft={updateFacModalDraft}
              totalSI={totalSI}
              grossPremium={grossPremium}
              currency={currency}
              retentionAvailable={retentionAvailable}
              reinsurers={availableReinsurers}
              onCommit={(layerData, isNew) => {
                if (isNew) {
                  setUserFacLayers((prev) => [...prev, layerData]);
                } else {
                  setUserFacLayers((prev) => prev.map((l) => (l.id === layerData.id ? layerData : l)));
                }
                setIsDirty(true);
              }}
            />
          );
        })()}

        <FacultativeNewRequestDialog
          open={facNewRequestOpen}
          onOpenChange={setFacNewRequestOpen}
          referralId={referralId ?? ''}
          quoteId={quoteId || undefined}
          productName={productName}
          coverTitle={coverTitle}
          sumInsured={context?.sumInsured ?? (sumInsuredParam ? Number(sumInsuredParam) : 0)}
          grossPremium={grossPremium}
          currency={currency}
          retentionAvailable={retentionAvailableForOutreach}
          onOutreachSent={handleOutreachSent}
        />

      </div>
    </div>
  );
}

export default ReinsuranceHandlingPage;
