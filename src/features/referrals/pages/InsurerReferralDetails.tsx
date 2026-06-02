import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
    ArrowLeft,
    Brain,
    CheckCircle,
    XCircle,
    Clock,
    User,
    FileText,
    MessageSquare,
    Download,
    ChevronDown,
    ChevronUp,
    CheckCircle2,
    X,
    Edit,
    Shield,
    ChevronRight,
    Loader2,
    Lock,
    History,
} from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';

import {
    getReferralDetail,
    updateReferralStatus,
    getReinsuranceContext,
    downloadReferralPdf,
    type ReferralStatus,
    type ReinsuranceContextSection,
    type TriggeredTreatyItem,
    type TreatyAllocation,
} from '@/features/proposals/api/referrals';
import { ReferralOriginBadge } from '@/features/referrals/components/ReferralOriginBadge';
import { RatingBreakdownDialog } from '@/features/referrals/components/RatingBreakdownDialog';
import type { PricingVersion } from '@/features/quotes/api/quotes';
import { mapApiPricingVersions } from '@/features/quotes/api/quotes';
import {
    COMBINED_FAC_HISTORY_CHANGED,
    getCombinedFacHistoryForReferral,
    registerCombinedFacDraft,
    type CombinedFacRequestRecord,
} from '@/features/referrals/utils/combinedFacRequestHistory';


// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('en-AE', { style: 'decimal', maximumFractionDigits: 0 }).format(n);

const STATUS_OPTIONS: Array<{ value: ReferralStatus; label: string }> = [
    { value: 'open', label: 'Open' },
    { value: 'in_review', label: 'In Review' },
    { value: 'query_raised', label: 'Query Raised' },
    { value: 'approved', label: 'Approved' },
    { value: 'approved_with_conditions', label: 'Approved with Conditions' },
    { value: 'declined', label: 'Declined' },
    { value: 'closed', label: 'Closed' },
];

const STATUS_BADGE_CFG: Record<string, { className: string; icon: React.ComponentType<{ className?: string }> }> = {
    open: { className: 'bg-primary/10 text-primary border-primary/20', icon: Clock },
    in_review: { className: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: Edit },
    query_raised: { className: 'bg-orange-50 text-orange-700 border-orange-200', icon: MessageSquare },
    approved: { className: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle },
    approved_with_conditions: { className: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
    declined: { className: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
    closed: { className: 'bg-gray-100 text-gray-700 border-gray-200', icon: CheckCircle },
};

const getStatusLabel = (status: string) =>
    STATUS_OPTIONS.find((o) => o.value === status)?.label ??
    status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');

function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS_BADGE_CFG[status] ?? { className: 'bg-gray-100 text-gray-700 border-gray-200', icon: Clock };
    const Icon = cfg.icon;
    return (
        <Badge variant="outline" className={`flex w-fit items-center gap-1 ${cfg.className}`}>
            <Icon className="w-3 h-3" />
            {getStatusLabel(status)}
        </Badge>
    );
}

function PriorityBadge({ priority }: { priority: string | null }) {
    if (!priority) return null;
    const colors: Record<string, string> = {
        low: 'bg-green-100 text-green-800',
        medium: 'bg-yellow-100 text-yellow-800',
        high: 'bg-orange-100 text-orange-800',
        urgent: 'bg-red-100 text-red-800',
    };
    return (
        <Badge className={colors[priority.toLowerCase()] ?? 'bg-gray-100 text-gray-800'}>
            {priority.charAt(0).toUpperCase() + priority.slice(1)}
        </Badge>
    );
}

// ─── Reinsurance section helpers ──────────────────────────────────────────────

function getTreatiesForCover(
    coverId: string,
    triggered: TriggeredTreatyItem[],
    allocations?: TreatyAllocation[],
): string[] {
    if (allocations?.length) {
        const allocated = allocations
            .filter((a) => a.coverId === coverId && a.cessionSumInsured > 0)
            .map((a) => a.structureType)
            .filter(Boolean);
        if (allocated.length) return [...new Set(allocated)];
    }
    return triggered
        .filter((t) => t.coverId === coverId)
        .map((t) => t.treaty.structureType || t.program.reinsuranceType)
        .filter(Boolean);
}

function collectFacKeysForSection(
    section: ReinsuranceContextSection,
    unitsByCoverId: Map<string, Array<{ unitId: string }>>,
): string[] {
    const keys: string[] = [];
    for (const cover of section.covers) {
        const units = unitsByCoverId.get(cover.id);
        if (units?.length) {
            for (const u of units) {
                keys.push(`u:${section.id}:${cover.id}:${u.unitId}`);
            }
        } else {
            keys.push(`c:${section.id}:${cover.id}`);
        }
    }
    return keys;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const InsurerReferralDetails = ({ fullWidth, hideHeader, hideStatusDropdown, hideBackButton }: { fullWidth?: boolean; hideHeader?: boolean; hideStatusDropdown?: boolean; hideBackButton?: boolean }) => {
    const { referralId } = useParams<{ referralId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const basePath = location.pathname.startsWith('/market-admin') ? '/market-admin' : '/insurer';
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [expandedSections, setExpandedSections] = useState<Set<string>>(
        new Set(['reinsurance_referral']),
    );
    const [treatiesOpen, setTreatiesOpen] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);
    const [showRatingBreakdownDialog, setShowRatingBreakdownDialog] = useState(false);
    const [pricingVersions, setPricingVersions] = useState<PricingVersion[]>([]);
    /** Row keys: `u:{sectionId}:{coverId}:{unitId}` or `c:{sectionId}:{coverId}` for cover-level rows. */
    const [selectedFacKeys, setSelectedFacKeys] = useState<string[]>([]);
    const [combinedFacHistory, setCombinedFacHistory] = useState<CombinedFacRequestRecord[]>([]);

    // ── Data fetching ──────────────────────────────────────────────────────────

    const {
        data: detail,
        isLoading: detailLoading,
        error: detailError,
    } = useQuery({
        queryKey: ['referral-detail', referralId],
        queryFn: () => getReferralDetail(referralId!),
        enabled: !!referralId,
        staleTime: 1000 * 60 * 2,
    });

    // Seed pricing versions from API response when detail loads
    useEffect(() => {
        if (Array.isArray(detail?.pricingVersions) && detail.pricingVersions.length > 0) {
            const ratingBreakdown = (detail.triggerDetails as any)?.ratingBreakdown ?? [];
            setPricingVersions(mapApiPricingVersions(detail.pricingVersions, ratingBreakdown));
        }
    }, [detail?.id]);

    const { data: reinsuranceContext } = useQuery({
        queryKey: ['referral-reinsurance-context', referralId],
        queryFn: () => getReinsuranceContext(referralId!),
        enabled: !!referralId,
        staleTime: 1000 * 60 * 5,
    });

    // ── Mutations ──────────────────────────────────────────────────────────────

    const statusMutation = useMutation({
        mutationFn: (status: string) => updateReferralStatus(referralId!, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['referral-detail', referralId] });
            toast({ title: 'Status updated', description: 'Referral status has been saved.' });
        },
        onError: () => {
            toast({ title: 'Error', description: 'Failed to update status.', variant: 'destructive' });
        },
    });

    const refreshCombinedFacHistory = useCallback(() => {
        if (!referralId) return;
        const q = searchParams.get('quoteId');
        setCombinedFacHistory(getCombinedFacHistoryForReferral(referralId, q === null ? undefined : q));
    }, [referralId, searchParams]);

    useEffect(() => {
        refreshCombinedFacHistory();
    }, [refreshCombinedFacHistory]);

    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === 'aura_insurer_combined_fac_history_v1') refreshCombinedFacHistory();
        };
        window.addEventListener('storage', onStorage);
        window.addEventListener(COMBINED_FAC_HISTORY_CHANGED, refreshCombinedFacHistory);
        return () => {
            window.removeEventListener('storage', onStorage);
            window.removeEventListener(COMBINED_FAC_HISTORY_CHANGED, refreshCombinedFacHistory);
        };
    }, [refreshCombinedFacHistory]);

    // ── Handlers ──────────────────────────────────────────────────────────────

    const toggleSection = (key: string) => {
        setExpandedSections((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    // ── Reinsurance context derived values (before loading gates — hooks below must run every render) ──

    const triggerReinsurance =
        detail &&
        typeof detail.triggerDetails === 'object' &&
        detail.triggerDetails !== null
            ? (detail.triggerDetails as {
                reinsurance?: {
                    totalGrossPremium?: number;
                    covers?: Array<{
                        coverId: string;
                        coverName?: string;
                        coverCode?: string;
                        sectionId?: string;
                        sectionName?: string;
                        sumInsured?: number;
                        grossPremium?: number;
                        units?: Array<{
                            unitId: string;
                            unitLabel: string;
                            sumInsured: number;
                            grossPremium: number;
                            reinsuranceRequired?: boolean;
                        }>;
                    }>;
                };
            }).reinsurance
            : undefined;

    const apiSections: ReinsuranceContextSection[] = reinsuranceContext?.sections ?? [];

    /** Prefer live API sections; if empty (e.g. product not linked), group stored quote trigger covers. */
    const sections: ReinsuranceContextSection[] =
        apiSections.length > 0
            ? apiSections
            : (() => {
                  const cov = triggerReinsurance?.covers;
                  if (!Array.isArray(cov) || cov.length === 0) return [];
                  const bySection = new Map<string, ReinsuranceContextSection>();
                  for (const c of cov) {
                      const sid = c.sectionId || 'default';
                      const sname = c.sectionName || 'Coverage';
                      let sec = bySection.get(sid);
                      if (!sec) {
                          sec = { id: sid, name: sname, covers: [] };
                          bySection.set(sid, sec);
                      }
                      sec.covers.push({
                          id: c.coverId,
                          name: c.coverName ?? c.coverCode ?? c.coverId,
                      });
                  }
                  return Array.from(bySection.values());
              })();

    const triggered: TriggeredTreatyItem[] = reinsuranceContext?.triggeredTreaties ?? [];

    const grossPremium =
        (reinsuranceContext && reinsuranceContext.grossPremium > 0
            ? reinsuranceContext.grossPremium
            : triggerReinsurance?.totalGrossPremium) ?? 0;

    const unitsByCoverId = new Map<
        string,
        Array<{
            unitId: string;
            unitLabel: string;
            sumInsured: number;
            grossPremium: number;
            reinsuranceRequired?: boolean;
        }>
    >();

    const coverTotalsByCoverId = new Map<
        string,
        {
            sumInsured: number;
            grossPremium: number;
        }
    >();

    if (triggerReinsurance?.covers) {
        triggerReinsurance.covers.forEach((c) => {
            const totalSi = typeof c.sumInsured === 'number' ? c.sumInsured : 0;
            const totalGp = typeof c.grossPremium === 'number' ? c.grossPremium : 0;
            coverTotalsByCoverId.set(c.coverId, {
                sumInsured: totalSi,
                grossPremium: totalGp,
            });

            if (Array.isArray(c.units) && c.units.length > 0) {
                unitsByCoverId.set(c.coverId, c.units);
            }
        });
    }

    const programName =
        triggered[0]?.treaty?.name ??
        triggered[0]?.program?.treatyName ??
        detail?.productName ??
        'Reinsurance Program';

    const isFacultative = triggered.some(
        (t) =>
            t.treaty.structureType === 'Mandatory Facultative' ||
            (reinsuranceContext?.programsByCover?.[t.coverId] ?? []).some(
                (p) => p.facultativeMandatory,
            ),
    );

    const allAllocations: TreatyAllocation[] = reinsuranceContext?.treatyAllocations ?? [];
    const allocatedTypes = [...new Set(
        allAllocations.filter((a) => a.cessionSumInsured > 0).map((a) => a.structureType).filter(Boolean),
    )];
    const uniqueTreatyTypes = allocatedTypes.length > 0
        ? allocatedTypes
        : [...new Set(triggered.map((t) => t.treaty.structureType).filter(Boolean))];
    const treatyMatchLabel = uniqueTreatyTypes.length > 0 ? uniqueTreatyTypes.join(', ') : '—';

    const selectedFacSet = useMemo(() => new Set(selectedFacKeys), [selectedFacKeys]);

    const facMultiSummary = useMemo(() => {
        if (selectedFacKeys.length === 0) return null;
        const sectionNames = new Set<string>();
        const coverLines = new Set<string>();
        const unitLines: string[] = [];
        let sumInsured = 0;
        let grossPremium = 0;
        const coverIds = new Set<string>();

        for (const section of sections) {
            for (const cover of section.covers) {
                const units = unitsByCoverId.get(cover.id);
                if (units?.length) {
                    for (const u of units) {
                        const key = `u:${section.id}:${cover.id}:${u.unitId}`;
                        if (selectedFacSet.has(key)) {
                            sectionNames.add(section.name);
                            coverLines.add(`${section.name} › ${cover.name}`);
                            unitLines.push(`${cover.name}: ${u.unitLabel}`);
                            sumInsured += u.sumInsured;
                            grossPremium += u.grossPremium;
                            coverIds.add(cover.id);
                        }
                    }
                } else {
                    const key = `c:${section.id}:${cover.id}`;
                    if (selectedFacSet.has(key)) {
                        sectionNames.add(section.name);
                        coverLines.add(`${section.name} › ${cover.name}`);
                        unitLines.push(`${cover.name}: all`);
                        const t = coverTotalsByCoverId.get(cover.id);
                        sumInsured += t?.sumInsured ?? 0;
                        grossPremium += t?.grossPremium ?? 0;
                        coverIds.add(cover.id);
                    }
                }
            }
        }
        if (coverIds.size === 0) return null;
        return {
            sectionNames: [...sectionNames],
            coverLines: [...coverLines],
            unitLines,
            sumInsured,
            grossPremium,
            coverIds,
        };
    }, [sections, selectedFacKeys, selectedFacSet, unitsByCoverId, coverTotalsByCoverId]);

    const toggleFacKey = useCallback((key: string) => {
        setSelectedFacKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
    }, []);

    const toggleSectionFacKeys = useCallback(
        (section: ReinsuranceContextSection) => {
            const keys = collectFacKeysForSection(section, unitsByCoverId);
            setSelectedFacKeys((prev) => {
                const prevSet = new Set(prev);
                const allOn = keys.length > 0 && keys.every((k) => prevSet.has(k));
                if (allOn) return prev.filter((k) => !keys.includes(k));
                const next = new Set(prev);
                keys.forEach((k) => next.add(k));
                return [...next];
            });
        },
        [unitsByCoverId],
    );

    // ── Loading / Error states (after all hooks) ─────────────────────────────

    if (detailLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                    <p className="text-gray-600">Loading referral details...</p>
                </div>
            </div>
        );
    }

    if (detailError || !detail) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center space-y-3">
                    <XCircle className="h-10 w-10 text-destructive mx-auto" />
                    <p className="text-gray-700 font-medium">Failed to load referral details.</p>
                    <Button variant="outline" size="sm" onClick={() => navigate('/insurer/dashboard')}>
                        Back to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    const navigateFacFromMultiSelection = () => {
        if (!facMultiSummary || facMultiSummary.coverIds.size === 0) return;
        const coverIdsArr = [...facMultiSummary.coverIds];
        const p = new URLSearchParams({
            quoteId: detail.quoteId ?? '',
            productName: detail.productName ?? '',
            currency: detail.currency ?? 'AED',
        });
        p.set('sumInsured', String(facMultiSummary.sumInsured));
        p.set('grossPremium', String(facMultiSummary.grossPremium));
        p.set('coverIds', coverIdsArr.join(','));
        const coverTitle =
            coverIdsArr.length === 1
                ? sections.flatMap((s) => s.covers).find((c) => c.id === coverIdsArr[0])?.name ??
                  coverIdsArr[0]
                : `${coverIdsArr.length} covers selected`;
        p.set('coverTitle', coverTitle);
        if (coverIdsArr.length === 1) p.set('coverId', coverIdsArr[0]);
        const bundleId = crypto.randomUUID();
        registerCombinedFacDraft({
            bundleId,
            referralId: referralId!,
            quoteId: detail.quoteId ?? null,
            coverIds: coverIdsArr,
            coverTitle,
            sectionNames: [...facMultiSummary.sectionNames],
            coverLines: [...facMultiSummary.coverLines],
            unitLines: [...facMultiSummary.unitLines],
            sumInsured: facMultiSummary.sumInsured,
            grossPremium: facMultiSummary.grossPremium,
            currency: detail.currency ?? 'AED',
            createdAt: new Date().toISOString(),
        });
        p.set('combinedFacBundleId', bundleId);
        navigate(`${basePath}/referral/${referralId}/reinsurance?${p}`);
    };

    // ── PDF download (server-generated) ─────────────────────────────────────

    const handleDownloadPdf = async () => {
        setIsDownloading(true);
        try {
            const blob = await downloadReferralPdf(detail.id);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const safeProduct = String(detail.productName || 'Referral')
                .replace(/[^a-zA-Z0-9 _-]/g, '')
                .trim()
                .replace(/\s+/g, '_');
            link.download = `${safeProduct}_${detail.referralId}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast({
                title: 'Referral downloaded',
                description: 'Referral PDF has been generated and downloaded.',
            });
        } catch (error) {
            console.error('[handleDownloadPdf] Failed for referralId:', detail.referralId, error);
            let description = 'Failed to download referral PDF';
            try {
                const errorObj = error as { data?: unknown; response?: { data?: unknown } };
                const errorData = errorObj?.data ?? errorObj?.response?.data;
                if (errorData instanceof Blob) {
                    const text = await errorData.text();
                    const json = JSON.parse(text) as { message?: string };
                    if (json.message) description = json.message;
                }
            } catch {
                /* keep default */
            }
            toast({
                title: 'Download failed',
                description,
                variant: 'destructive',
            });
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="bg-background">
            {/* ── Sticky header ─────────────────────────────────────────────── */}
            {!hideHeader && (
            <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-20">
                <div className="flex items-center justify-between gap-6">
                    {/* Left section: Back button and Title with badges */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        {!hideBackButton && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(-1)}
                                className="flex items-center gap-2 shrink-0"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back
                            </Button>
                        )}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1 flex-wrap">
                                <h1 className="text-lg font-semibold text-gray-900">
                                    Referral Details — {detail.referralId}
                                </h1>
                                <div className="flex items-center gap-2">
                                    <StatusBadge status={detail.status} />
                                    <PriorityBadge priority={detail.priority} />
                                    <ReferralOriginBadge triggerSourceType={detail.triggerSourceType} />
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 truncate">
                                {detail.productName ?? '—'} · Quote {detail.quoteId ?? '—'}
                                {detail.customerName && ` · ${detail.customerName}`}
                            </p>
                        </div>
                    </div>
                    {/* Right section: Immersive assessment, status, rating */}
                    <div className="flex items-center gap-3 shrink-0">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="ai-gradient-shimmer h-9 shrink-0 gap-2"
                            onClick={() => navigate('/insurer/command-center')}
                        >
                            <Brain className="h-4 w-4" />
                            Immersive Risk Assessment
                        </Button>
                        {!hideStatusDropdown && (
                            <Select
                                value={detail.status}
                                onValueChange={(value) => statusMutation.mutate(value)}
                                disabled={statusMutation.isPending}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUS_OPTIONS.map((o) => (
                                        <SelectItem key={o.value} value={o.value}>
                                            {o.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        {Array.isArray((detail.triggerDetails as any)?.ratingBreakdown) &&
                            ((detail.triggerDetails as any).ratingBreakdown as any[]).length > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2 shrink-0 h-9 text-xs"
                                onClick={() => setShowRatingBreakdownDialog(true)}
                            >
                                View Rating Breakdown
                            </Button>
                        )}
                        {/* <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2 shrink-0"
                            onClick={handleDownloadPdf}
                            disabled={isDownloading}
                        >
                            {isDownloading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Download className="h-4 w-4" />
                            )}
                            Download
                        </Button> */}
                    </div>
                </div>
            </div>
            )}

            <div
                className={
                    hideHeader
                        ? ''
                        : fullWidth
                        ? 'mx-auto w-full max-w-none px-4 pt-8 pb-0'
                        : 'container mx-auto px-4 pt-8 pb-0 max-w-7xl'
                }
            >
                {/* ── Reinsurance Referral collapsible ──────────────────────── */}
                {/* Hide this section if hideBackButton is true (used in combined page) and there's no reinsurance data */}
                {!(hideBackButton && sections.length === 0) && (
                <div className={hideHeader ? '' : 'rounded-lg border overflow-hidden'}>
                    <div className="bg-muted/30 p-6 space-y-6 pb-40">
                            {/* Program Overview */}
                            <section>
                                <h3 className="text-sm font-semibold text-slate-900 mb-3">Program Overview</h3>
                                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                                    <div className="flex items-center justify-between gap-4 flex-wrap">
                                        <div className="flex items-center gap-2">
                                            <div className="rounded-lg bg-primary/10 p-2">
                                                <Shield className="h-5 w-5 text-primary" />
                                            </div>
                                            <span className="text-sm font-medium text-foreground">{programName}</span>
                                        </div>
                                        {reinsuranceContext && (
                                            <Button
                                                variant="default"
                                                size="sm"
                                                className="gap-1 shrink-0"
                                                onClick={() => {
                                                    const params = new URLSearchParams({
                                                        quoteId: detail.quoteId ?? '',
                                                        productName: detail.productName ?? '',
                                                        currency: detail.currency ?? 'AED',
                                                    });
                                                    if (grossPremium)
                                                        params.set('grossPremium', String(grossPremium));
                                                    if (reinsuranceContext?.sumInsured)
                                                        params.set('sumInsured', String(reinsuranceContext.sumInsured));
                                                    navigate(`${basePath}/referral/${referralId}/reinsurance?${params}`);
                                                }}
                                            >
                                                Reinsurance
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </section>

                            {facMultiSummary && (
                                <Card className="border-primary/25 bg-primary/[0.03] shadow-sm">
                                    <CardHeader className="pb-2">
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                            <div>
                                                <CardTitle className="text-base">
                                                    Facultative request selection
                                                </CardTitle>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Selected sections, covers, and units are combined below. Adjust the
                                                    table checkboxes to change this bundle.
                                                </p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 text-xs shrink-0"
                                                onClick={() => setSelectedFacKeys([])}
                                            >
                                                Clear selection
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4 pt-0">
                                        <div className="grid gap-4 sm:grid-cols-3">
                                            <div className="space-y-1.5">
                                                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                                    Sections
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {facMultiSummary.sectionNames.map((name) => (
                                                        <Badge
                                                            key={name}
                                                            variant="secondary"
                                                            className="font-normal text-xs"
                                                        >
                                                            {name}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-1.5 sm:col-span-2">
                                                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                                    Covers
                                                </div>
                                                <ul className="text-sm text-foreground space-y-1 list-disc list-inside">
                                                    {facMultiSummary.coverLines.map((line) => (
                                                        <li key={line}>{line}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                                Units
                                            </div>
                                            <ul className="text-sm text-foreground space-y-1 list-disc list-inside max-h-32 overflow-y-auto">
                                                {facMultiSummary.unitLines.map((line, i) => (
                                                    <li key={`${line}-${i}`}>{line}</li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-t border-border pt-4">
                                            <div className="grid grid-cols-2 gap-6 text-sm">
                                                <div>
                                                    <div className="text-xs text-muted-foreground mb-0.5">
                                                        Sum insured
                                                    </div>
                                                    <div className="font-semibold tabular-nums text-foreground">
                                                        {fmtCurrency(facMultiSummary.sumInsured)}{' '}
                                                        {detail.currency ?? 'AED'}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-muted-foreground mb-0.5">
                                                        Gross premium
                                                    </div>
                                                    <div className="font-semibold tabular-nums text-primary">
                                                        {fmtCurrency(facMultiSummary.grossPremium)}{' '}
                                                        {detail.currency ?? 'AED'}
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                type="button"
                                                className="shrink-0 gap-1"
                                                onClick={navigateFacFromMultiSelection}
                                            >
                                                Request facultative
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {combinedFacHistory.length > 0 && (
                                <Card className="border-slate-200 shadow-sm">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <History className="h-4 w-4 text-muted-foreground" />
                                            Combined facultative request history
                                        </CardTitle>
                                        <p className="text-xs text-muted-foreground">
                                            Bundles created from <strong>Facultative request selection</strong> appear
                                            here. After you send facultative mails on the reinsurance screen, the row
                                            updates to <strong>Submitted</strong> with recipients.
                                        </p>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="overflow-x-auto rounded-md border">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                                                        <th className="px-3 py-2 font-medium">Started</th>
                                                        <th className="px-3 py-2 font-medium">Bundle</th>
                                                        <th className="px-3 py-2 font-medium text-right">Sum insured</th>
                                                        <th className="px-3 py-2 font-medium text-right">Gross prem.</th>
                                                        <th className="px-3 py-2 font-medium">Status</th>
                                                        <th className="px-3 py-2 font-medium">Recipients</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {combinedFacHistory.map((row) => (
                                                        <tr key={row.bundleId} className="bg-background hover:bg-muted/20">
                                                            <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                                                                {new Date(row.createdAt).toLocaleString()}
                                                            </td>
                                                            <td className="px-3 py-2.5 max-w-[220px]">
                                                                <div className="font-medium text-foreground truncate" title={row.coverTitle}>
                                                                    {row.coverTitle}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                                                    {row.sectionNames.join(' · ')}
                                                                    {row.unitLines.length > 0 && (
                                                                        <span>
                                                                            {' '}
                                                                            · {row.unitLines.length} unit
                                                                            {row.unitLines.length !== 1 ? 's' : ''}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-2.5 text-right tabular-nums">
                                                                {fmtCurrency(row.sumInsured)} {row.currency}
                                                            </td>
                                                            <td className="px-3 py-2.5 text-right tabular-nums text-primary">
                                                                {fmtCurrency(row.grossPremium)} {row.currency}
                                                            </td>
                                                            <td className="px-3 py-2.5">
                                                                {row.status === 'submitted' ? (
                                                                    <Badge className="bg-green-50 text-green-800 border-green-200 font-normal">
                                                                        Submitted
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge variant="outline" className="font-normal text-amber-800 border-amber-200 bg-amber-50/80">
                                                                        Pending mail
                                                                    </Badge>
                                                                )}
                                                            </td>
                                                            <td className="px-3 py-2.5 text-xs text-muted-foreground max-w-[200px]">
                                                                {row.status === 'submitted' &&
                                                                row.recipientCount != null &&
                                                                row.recipientNames?.length ? (
                                                                    <span className="line-clamp-3" title={row.recipientNames.join(', ')}>
                                                                        {row.recipientCount} · {row.recipientNames.join(', ')}
                                                                    </span>
                                                                ) : (
                                                                    '—'
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Sections → Covers (from reinsurance context) */}
                            {sections.length > 0 ? (
                                sections.map((section) => {
                                    const sectionRowKeys = collectFacKeysForSection(section, unitsByCoverId);
                                    const sectionAllSelected =
                                        sectionRowKeys.length > 0 &&
                                        sectionRowKeys.every((k) => selectedFacSet.has(k));
                                    const sectionSomeSelected =
                                        sectionRowKeys.some((k) => selectedFacSet.has(k)) &&
                                        !sectionAllSelected;
                                    return (
                                    <section key={section.id}>
                                        <div className="flex items-center justify-between gap-3 mb-3">
                                            <h3 className="text-sm font-semibold text-slate-900">{section.name}</h3>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <Checkbox
                                                    checked={
                                                        sectionAllSelected
                                                            ? true
                                                            : sectionSomeSelected
                                                              ? 'indeterminate'
                                                              : false
                                                    }
                                                    onCheckedChange={() => toggleSectionFacKeys(section)}
                                                    aria-label={`Select all covers and units in ${section.name}`}
                                                />
                                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                    Select section
                                                </span>
                                            </div>
                                        </div>
                                        <div className="overflow-hidden rounded-lg border border-slate-200 shadow-sm bg-white">
                                            <div style={{ overflowX: 'auto' }}>
                                                <table style={{ width: '100%', minWidth: '900px', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                                                    <colgroup>
                                                        <col style={{ width: '44px' }} />
                                                        <col style={{ width: '17%' }} />
                                                        <col style={{ width: '13%' }} />
                                                        <col style={{ width: '15%' }} />
                                                        <col style={{ width: '15%' }} />
                                                        <col style={{ width: '13%' }} />
                                                        <col style={{ width: '11%' }} />
                                                        <col style={{ width: '10%' }} />
                                                    </colgroup>
                                                    <thead>
                                                        <tr style={{ backgroundColor: 'rgb(248 250 252)', borderBottom: '1px solid rgb(226 232 240)' }}>
                                                            {['', 'Cover', 'Unit', 'Treaty', 'Program', 'Sum Insured', 'Gross Premium', 'Action'].map((h, i) => (
                                                                <th key={`${h}-${i}`} style={{ padding: '12px 16px', textAlign: i === 0 || i === 7 ? 'center' : 'left', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgb(100 116 139)' }}>{h}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {section.covers.map((cover) => {
                                                            const coverTriggered = triggered.filter((t) => t.coverId === cover.id);
                                                            const programName_ = [...new Set(coverTriggered.map((t) => t.program.treatyName || t.program.treatyCode).filter(Boolean))].join(', ');
                                                            const treatyName_ = [...new Set(coverTriggered.map((t) => t.treaty.name || t.treaty.treatyCode).filter(Boolean))].join(', ');
                                                            const coverTreaties = getTreatiesForCover(cover.id, triggered, allAllocations);
                                                            const units = unitsByCoverId.get(cover.id);
                                                            const totals = coverTotalsByCoverId.get(cover.id);

                                                            const buildParams = (coverId: string, coverTitle: string, si?: number, gp?: number) => {
                                                                const p = new URLSearchParams({ quoteId: detail.quoteId ?? '', productName: detail.productName ?? '', coverId, coverTitle, currency: detail.currency ?? 'AED' });
                                                                if (gp) p.set('grossPremium', String(gp));
                                                                if (si) p.set('sumInsured', String(si));
                                                                return p;
                                                            };

                                                            const tdStyle: React.CSSProperties = { padding: '13px 16px', verticalAlign: 'middle', fontSize: '13px', color: 'rgb(51 65 85)', borderBottom: '1px solid rgb(226 232 240)' };

                                                            const hasTreaties = coverTreaties.length > 0;
                                                            const fullRetentionBadge = (
                                                                <span style={{ display: 'inline-block', padding: '2px 8px', fontSize: '10px', fontWeight: 600, borderRadius: '4px', backgroundColor: 'rgb(241 245 249)', color: 'rgb(100 116 139)', letterSpacing: '0.03em' }}>Full Retention</span>
                                                            );

                                                            const tdCheckStyle: React.CSSProperties = {
                                                                ...tdStyle,
                                                                width: 44,
                                                                textAlign: 'center',
                                                                padding: '10px 8px',
                                                            };

                                                            if (units?.length) {
                                                                return units.map((u, ui) => {
                                                                    const rowKey = `u:${section.id}:${cover.id}:${u.unitId}`;
                                                                    return (
                                                                    <tr key={u.unitId} className="hover:bg-slate-50/30 transition-colors">
                                                                        <td style={tdCheckStyle}>
                                                                            <div className="flex justify-center">
                                                                                <Checkbox
                                                                                    checked={selectedFacSet.has(rowKey)}
                                                                                    onCheckedChange={() => toggleFacKey(rowKey)}
                                                                                    aria-label={`Select ${cover.name} — ${u.unitLabel}`}
                                                                                />
                                                                            </div>
                                                                        </td>
                                                                        <td style={tdStyle}>
                                                                            {ui === 0 ? (
                                                                                <div>
                                                                                    <div style={{ fontSize: '13px', color: 'rgb(15 23 42)' }}>{cover.name}</div>
                                                                                    <div style={{ fontSize: '10px', color: 'rgb(148 163 184)', fontWeight: 500 }}>COVER</div>
                                                                                </div>
                                                                            ) : null}
                                                                        </td>
                                                                        <td style={tdStyle}>
                                                                            <div style={{ fontSize: '13px', color: 'rgb(15 23 42)' }}>{u.unitLabel}</div>
                                                                            <div style={{ fontSize: '10px', color: 'rgb(148 163 184)' }}>UNIT</div>
                                                                        </td>
                                                                        <td style={tdStyle}>{hasTreaties ? (programName_ || <span style={{ color: 'rgb(148 163 184)', fontStyle: 'italic' }}>—</span>) : fullRetentionBadge}</td>
                                                                        <td style={tdStyle}>{hasTreaties ? (treatyName_ || <span style={{ color: 'rgb(148 163 184)', fontStyle: 'italic' }}>—</span>) : <span style={{ color: 'rgb(148 163 184)', fontStyle: 'italic' }}>—</span>}</td>
                                                                        <td style={{ ...tdStyle, fontVariantNumeric: 'tabular-nums' }}>{fmtCurrency(u.sumInsured)} {detail.currency ?? 'AED'}</td>
                                                                        <td style={{ ...tdStyle, fontVariantNumeric: 'tabular-nums', color: 'hsl(var(--primary))' }}>{fmtCurrency(u.grossPremium)} {detail.currency ?? 'AED'}</td>
                                                                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                                                                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                                                <Button
                                                                                    variant="outline"
                                                                                    size="sm"
                                                                                    className="h-7 px-3 text-xs border-slate-200 shadow-sm"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        navigate(
                                                                                            `${basePath}/referral/${referralId}/reinsurance?${buildParams(
                                                                                                cover.id,
                                                                                                `${cover.name} — ${u.unitLabel}`,
                                                                                                u.sumInsured,
                                                                                                u.grossPremium,
                                                                                            )}`,
                                                                                        );
                                                                                    }}
                                                                                >
                                                                                    {hasTreaties ? 'Reinsurance' : 'Request Facultative'}
                                                                                </Button>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                    );
                                                                });
                                                            }

                                                            if (hasTreaties && totals) {
                                                                const coverRowKey = `c:${section.id}:${cover.id}`;
                                                                return (
                                                                    <tr key={cover.id} className="hover:bg-slate-50/30 transition-colors">
                                                                        <td style={tdCheckStyle}>
                                                                            <div className="flex justify-center">
                                                                                <Checkbox
                                                                                    checked={selectedFacSet.has(coverRowKey)}
                                                                                    onCheckedChange={() => toggleFacKey(coverRowKey)}
                                                                                    aria-label={`Select ${cover.name}`}
                                                                                />
                                                                            </div>
                                                                        </td>
                                                                        <td style={tdStyle}>
                                                                            <div style={{ fontSize: '13px', color: 'rgb(15 23 42)' }}>{cover.name}</div>
                                                                            <div style={{ fontSize: '10px', color: 'rgb(148 163 184)', fontWeight: 500 }}>COVER</div>
                                                                        </td>
                                                                        <td style={{ ...tdStyle, color: 'rgb(148 163 184)', fontStyle: 'italic' }}>—</td>
                                                                        <td style={tdStyle}>{programName_ || <span style={{ color: 'rgb(148 163 184)', fontStyle: 'italic' }}>—</span>}</td>
                                                                        <td style={tdStyle}>{treatyName_ || <span style={{ color: 'rgb(148 163 184)', fontStyle: 'italic' }}>—</span>}</td>
                                                                        <td style={{ ...tdStyle, fontVariantNumeric: 'tabular-nums' }}>{fmtCurrency(totals.sumInsured)} {detail.currency ?? 'AED'}</td>
                                                                        <td style={{ ...tdStyle, fontVariantNumeric: 'tabular-nums', color: 'hsl(var(--primary))' }}>{fmtCurrency(totals.grossPremium)} {detail.currency ?? 'AED'}</td>
                                                                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                                                                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                                                <Button variant="outline" size="sm" className="h-7 px-3 text-xs border-slate-200 shadow-sm" onClick={(e) => { e.stopPropagation(); navigate(`${basePath}/referral/${referralId}/reinsurance?${buildParams(cover.id, cover.name, totals.sumInsured, totals.grossPremium)}`); }}>
                                                                                    Reinsurance
                                                                                </Button>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            }

                                                            const coverRowKey = `c:${section.id}:${cover.id}`;
                                                            return (
                                                                <tr key={cover.id} className="hover:bg-slate-50/30 transition-colors">
                                                                    <td style={tdCheckStyle}>
                                                                        <div className="flex justify-center">
                                                                            <Checkbox
                                                                                checked={selectedFacSet.has(coverRowKey)}
                                                                                onCheckedChange={() => toggleFacKey(coverRowKey)}
                                                                                aria-label={`Select ${cover.name}`}
                                                                            />
                                                                        </div>
                                                                    </td>
                                                                    <td style={tdStyle}>
                                                                        <div style={{ fontSize: '13px', color: 'rgb(15 23 42)' }}>{cover.name}</div>
                                                                        <div style={{ fontSize: '10px', color: 'rgb(148 163 184)', fontWeight: 500 }}>COVER</div>
                                                                    </td>
                                                                    <td style={{ ...tdStyle, color: 'rgb(148 163 184)', fontStyle: 'italic' }}>—</td>
                                                                    <td style={tdStyle}>{fullRetentionBadge}</td>
                                                                    <td style={{ ...tdStyle, color: 'rgb(148 163 184)', fontStyle: 'italic' }}>—</td>
                                                                    <td style={{ ...tdStyle, fontVariantNumeric: 'tabular-nums' }}>{totals ? `${fmtCurrency(totals.sumInsured)} ${detail.currency ?? 'AED'}` : <span style={{ color: 'rgb(148 163 184)', fontStyle: 'italic' }}>—</span>}</td>
                                                                    <td style={{ ...tdStyle, fontVariantNumeric: 'tabular-nums', color: totals ? 'hsl(var(--primary))' : 'rgb(148 163 184)' }}>{totals ? `${fmtCurrency(totals.grossPremium)} ${detail.currency ?? 'AED'}` : <span style={{ fontStyle: 'italic' }}>—</span>}</td>
                                                                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                                                                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                                            <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                className="h-7 px-3 text-xs border-slate-200 shadow-sm"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    navigate(
                                                                                        `${basePath}/referral/${referralId}/reinsurance?${buildParams(cover.id, cover.name, totals?.sumInsured, totals?.grossPremium)}`,
                                                                                    );
                                                                                }}
                                                                            >
                                                                                Request Facultative
                                                                            </Button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </section>
                                    );
                                })
                            ) : (
                                <p className="text-sm text-muted-foreground px-1">
                                    {reinsuranceContext
                                        ? 'No reinsurance sections found for this referral.'
                                        : 'Loading reinsurance data…'}
                                </p>
                            )}
                        </div>
                </div>
                    )}

            </div>

            <RatingBreakdownDialog
                open={showRatingBreakdownDialog}
                onOpenChange={setShowRatingBreakdownDialog}
                ratingBreakdown={
                    Array.isArray((detail.triggerDetails as any)?.ratingBreakdown)
                        ? (detail.triggerDetails as any).ratingBreakdown
                        : null
                }
                referralId={detail.id}
                pricingVersions={pricingVersions}
                onPricingVersionSaved={(version) =>
                    setPricingVersions((prev) => [...prev, version])
                }
            />
        </div>
    );
};

export default InsurerReferralDetails;




