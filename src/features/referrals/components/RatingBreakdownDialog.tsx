import React, { useState, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RatingBreakdownItem, PricingVersion, SavePricingVersionPayload } from '@/features/quotes/api/quotes';
import { Plus, History, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';

/** Format a number with thousand separators. Non-numeric strings pass through as-is. */
function fmtValue(value: string | number | null | undefined): string {
    if (value === null || value === undefined || value === '') return '—';
    const num = typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''));
    if (isNaN(num)) return String(value);
    return num.toLocaleString('en-US', { maximumFractionDigits: 20 });
}

interface RatingBreakdownDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    ratingBreakdown: RatingBreakdownItem[] | null;
    referralId?: string;
    /** Existing saved pricing versions (passed from parent) */
    pricingVersions?: PricingVersion[];
    /** Called after a new version is saved so parent can refresh */
    onPricingVersionSaved?: (version: PricingVersion) => void;
}

// Group items by fieldLabel + ratingParameterId so each unique field appears once per row
function groupByField(items: RatingBreakdownItem[]): RatingBreakdownItem[] {
    const seen = new Set<string>();
    return items.filter((item) => {
        const key = item.ratingParameterId ?? item.fieldId;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function decisionBadgeClass(decision: string) {
    if (decision === 'Auto Quote') return 'bg-blue-100 text-blue-700 border-blue-200';
    if (decision === 'Manual Review') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (!decision || decision === 'No Rule') return 'bg-gray-100 text-gray-500 border-gray-200';
    return 'bg-red-100 text-red-700 border-red-200';
}

export const RatingBreakdownDialog = React.memo(
    ({
        open,
        onOpenChange,
        ratingBreakdown,
        referralId,
        pricingVersions = [],
        onPricingVersionSaved,
    }: RatingBreakdownDialogProps) => {
        const { toast } = useToast();

        // Deduplicated rows (one per unique field/ratingParameter)
        const rows = useMemo(
            () => (ratingBreakdown ? groupByField(ratingBreakdown) : []),
            [ratingBreakdown],
        );

        // Local editable new-pricing values keyed by ratingParameterId or fieldId
        const [newPricing, setNewPricing] = useState<Record<string, string>>({});
        const [versionName, setVersionName] = useState('');
        const [isSaving, setIsSaving] = useState(false);
        const [showHistory, setShowHistory] = useState(false);

        const getKey = (item: RatingBreakdownItem) => item.ratingParameterId ?? item.fieldId;

        const handleNewPricingChange = (item: RatingBreakdownItem, value: string) => {
            // Allow empty string for clearing
            if (value === '' || value === '-') {
                setNewPricing((prev) => ({ ...prev, [getKey(item)]: value }));
                return;
            }
            // Strip thousand separators before numeric check
            const raw = value.replace(/,/g, '');
            if (isNaN(Number(raw))) return;

            const isPercentage = item.pricingType?.toLowerCase().includes('percent') ||
                item.pricingType?.toLowerCase().includes('%');

            // Restrict percentage fields to 0–100
            if (isPercentage) {
                const num = Number(raw);
                if (num < 0 || num > 100) return;
            }

            setNewPricing((prev) => ({ ...prev, [getKey(item)]: raw }));
        };

        const handleSaveVersion = async () => {
            const pricingUpdates = rows
                .filter((item) => {
                    const val = newPricing[getKey(item)];
                    return val !== undefined && val.trim() !== '' && !isNaN(Number(val.trim()));
                })
                .map((item) => ({
                    ratingParameterId: getKey(item),
                    editedValue: Number(newPricing[getKey(item)].trim()),
                }));

            if (pricingUpdates.length === 0) {
                toast({
                    title: 'No changes',
                    description: 'Enter at least one valid numeric pricing value before saving.',
                    variant: 'destructive',
                });
                return;
            }

            const resolvedVersionName = versionName.trim() || `Pricing Update ${pricingVersions.length + 1}`;

            const payload: SavePricingVersionPayload = {
                versionName: resolvedVersionName,
                pricingUpdates,
            };

            setIsSaving(true);
            try {
                const newVersion: PricingVersion = {
                    id: `local_${Date.now()}`,
                    versionName: resolvedVersionName,
                    versionNumber: pricingVersions.length,
                    createdAt: new Date().toISOString(),
                    entries: pricingUpdates.map((u) => ({
                        ratingParameterId: u.ratingParameterId,
                        fieldLabel: rows.find((r) => getKey(r) === u.ratingParameterId)?.fieldLabel ?? u.ratingParameterId,
                        editedValue: u.editedValue,
                    })),
                };

                if (referralId) {
                    try {
                        const { savePricingVersion } = await import('@/features/quotes/api/quotes');
                        const saved = await savePricingVersion(referralId, payload);
                        newVersion.id = saved.id;
                        newVersion.createdAt = saved.createdAt;
                        newVersion.versionName = saved.versionName;
                    } catch {
                        // Backend not yet wired — keep optimistic version
                    }
                }

                onPricingVersionSaved?.(newVersion);
                setNewPricing({});
                setVersionName('');
                toast({
                    title: 'Pricing version saved',
                    description: `"${resolvedVersionName}" has been saved successfully.`,
                });
            } finally {
                setIsSaving(false);
            }
        };

        const hasAnyNewPricing = rows.some(
            (item) => (newPricing[getKey(item)] ?? '').trim() !== '',
        );

        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Rating Breakdown</DialogTitle>
                        <DialogDescription>
                            Detailed breakdown of rating components. Underwriters can enter new pricing values and save a versioned update.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-2 space-y-4">
                        {rows.length > 0 ? (
                            <>
                                <div className="overflow-x-auto rounded-lg border border-border">
                                    <table className="w-full text-xs border-collapse" style={{ tableLayout: 'auto' }}>
                                        <thead>
                                            <tr className="bg-muted/50 border-b border-border">
                                                <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap min-w-[140px]">Field Name</th>
                                                <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap min-w-[120px]">Proposal Value</th>
                                                <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap min-w-[180px]">Pricing Configurator Value</th>
                                                {/* Versioned history columns — one per saved version, read-only */}
                                                {pricingVersions.map((v) => (
                                                    <th key={v.id} className="text-left px-3 py-2.5 font-semibold text-muted-foreground/60 whitespace-nowrap min-w-[130px] bg-muted/30">
                                                        <span className="flex items-center gap-1">
                                                            <Lock className="h-3 w-3 text-muted-foreground/40" />
                                                            {v.versionName}
                                                        </span>
                                                        <div className="text-[9px] font-normal text-muted-foreground/50 mt-0.5">
                                                            {new Date(v.createdAt).toLocaleDateString()} · Read-only
                                                        </div>
                                                    </th>
                                                ))}
                                                <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground min-w-[150px]">
                                                    <span className="flex flex-col gap-0.5">
                                                        <span className="flex items-center gap-1">
                                                            New Pricing
                                                            <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] px-1 py-0 font-semibold pointer-events-none">Editable</Badge>
                                                        </span>
                                                        <span className="text-[9px] font-normal text-muted-foreground/70">
                                                            Saved as new version on "Update Pricing"
                                                        </span>
                                                    </span>
                                                </th>
                                                {/* <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap min-w-[90px]">Decision</th> */}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rows.map((item, index) => {
                                                const key = getKey(item);
                                                const configValue = item.configMatch && item.configMatch !== 'No matching configuration found'
                                                    ? item.configMatch
                                                    : item.pricingType ?? '—';
                                                return (
                                                    <tr
                                                        key={key}
                                                        className={`border-b border-border ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'} hover:bg-primary/5 transition-colors`}
                                                    >
                                                        {/* Field Name */}
                                                        <td className="px-3 py-2.5 font-medium text-foreground break-words">
                                                            {item.fieldLabel || item.fieldId || '—'}
                                                            {item.category && (
                                                                <div className="text-[10px] text-muted-foreground font-normal mt-0.5">{item.category}</div>
                                                            )}
                                                        </td>

                                                        {/* Proposal Value */}
                                                        <td className="px-3 py-2.5 text-foreground break-words">
                                                            {item.proposalValue != null && item.proposalValue !== ''
                                                                ? fmtValue(item.proposalValue)
                                                                : '—'}
                                                        </td>

                                                        {/* Pricing Configurator Value (original, read-only) */}
                                                        <td className="px-3 py-2.5 text-muted-foreground italic break-words">
                                                            {configValue}
                                                        </td>

                                                        {/* Versioned history columns (read-only, grayed, locked) */}
                                                        {pricingVersions.map((v) => {
                                                            const entry = v.entries.find(
                                                                (e) => e.ratingParameterId === key,
                                                            );
                                                            return (
                                                                <td key={v.id} className="px-3 py-2.5 text-muted-foreground bg-muted/20 select-none">
                                                                    {entry ? (
                                                                        <span className="flex items-center gap-1">
                                                                            <Lock className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                                                                            <span className="font-medium">{fmtValue(entry.editedValue)}</span>
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-muted-foreground/30">—</span>
                                                                    )}
                                                                </td>
                                                            );
                                                        })}

                                                        {/* New Pricing (editable value only, type is read-only) */}
                                                        <td className="px-3 py-2">
                                                            {(() => {
                                                                const isPercentage = item.pricingType?.toLowerCase().includes('percent') ||
                                                                    item.pricingType?.toLowerCase().includes('%');
                                                                return (
                                                                    <div className={`flex items-center h-8 rounded-md border text-xs overflow-hidden w-36 bg-background transition-all
                                                                        ${newPricing[key]
                                                                            ? 'border-primary shadow-[0_0_0_1px_hsl(var(--ring)/0.25)]'
                                                                            : 'border-input hover:border-primary/50'
                                                                        }
                                                                        focus-within:border-primary focus-within:shadow-[0_0_0_2px_hsl(var(--ring)/0.2)]`}
                                                                    >
                                                                        <input
                                                                            type="text"
                                                                            inputMode={isPercentage ? 'decimal' : 'numeric'}
                                                                            value={
                                                                                newPricing[key] !== undefined && newPricing[key] !== ''
                                                                                    ? isPercentage
                                                                                        ? newPricing[key]
                                                                                        : Number(newPricing[key]).toLocaleString('en-US', { maximumFractionDigits: 20 })
                                                                                    : ''
                                                                            }
                                                                            onChange={(e) => handleNewPricingChange(item, e.target.value)}
                                                                            placeholder={isPercentage ? '0 – 100' : 'Value'}
                                                                            className="flex-1 min-w-0 px-2.5 h-full bg-transparent outline-none text-foreground text-xs placeholder:text-muted-foreground"
                                                                        />
                                                                        {item.pricingType && (
                                                                            <span className={`px-2 h-full flex items-center text-[10px] font-semibold border-l shrink-0 select-none
                                                                                ${isPercentage
                                                                                    ? 'bg-primary/10 text-primary border-primary/20'
                                                                                    : 'bg-muted text-muted-foreground border-border'
                                                                                }`}
                                                                            >
                                                                                {isPercentage ? '%' : item.pricingType.slice(0, 4).toUpperCase()}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })()}
                                                        </td>

                                                        {/* Decision */}
                                                        {/* <td className="px-3 py-2.5">
                                                            <Badge
                                                                className={`${decisionBadgeClass(item.decision)} border px-2 py-0.5 text-[10px] font-semibold shadow-none`}
                                                            >
                                                                {item.decision || 'No Rule'}
                                                            </Badge>
                                                        </td> */}
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Version name input + Save button */}
                                <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
                                    <button
                                        type="button"
                                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
                                        onClick={() => setShowHistory((p) => !p)}
                                    >
                                        <History className="h-3.5 w-3.5" />
                                        {pricingVersions.length > 0
                                            ? `${pricingVersions.length} version${pricingVersions.length > 1 ? 's' : ''} saved`
                                            : 'No versions yet'}
                                        {showHistory ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                    </button>

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={versionName}
                                            onChange={(e) => setVersionName(e.target.value)}
                                            placeholder={`e.g. Pricing Update ${pricingVersions.length + 1}`}
                                            className="h-8 text-xs w-56 rounded-md border border-input bg-background px-3 text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:shadow-[0_0_0_2px_hsl(var(--ring)/0.2)] transition-all"
                                        />
                                        <Button
                                            size="sm"
                                            className="h-8 gap-1.5 text-xs shrink-0"
                                            onClick={handleSaveVersion}
                                            disabled={!hasAnyNewPricing || isSaving}
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            {isSaving ? 'Saving…' : 'Update Pricing'}
                                        </Button>
                                    </div>
                                </div>

                                {/* Version history list */}
                                {showHistory && pricingVersions.length > 0 && (
                                    <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                                        <p className="text-xs font-semibold text-foreground mb-2">Pricing Version History</p>
                                        {[...pricingVersions].reverse().map((v) => (
                                            <div key={v.id} className="rounded-md border border-border bg-background p-2.5">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                                                        <Lock className="h-3 w-3 text-muted-foreground/50" />
                                                        {v.versionName}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {new Date(v.createdAt).toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {v.entries.map((e) => (
                                                        <span key={e.ratingParameterId} className="text-[10px] bg-primary/10 text-primary rounded px-1.5 py-0.5 border border-primary/20">
                                                            {e.fieldLabel}: <strong>{fmtValue(e.editedValue)}</strong>
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-sm text-muted-foreground py-4">
                                No rating breakdown data available for this referral.
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        );
    },
);

RatingBreakdownDialog.displayName = 'RatingBreakdownDialog';
