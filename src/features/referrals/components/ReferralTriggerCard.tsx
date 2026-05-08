import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronUp, ChevronDown, Flag, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ReferralApiResponse } from '@/features/quotes/api/quotes';

interface ReferralTriggerCardProps {
    referralData: ReferralApiResponse;
    isExpanded: boolean;
    onToggle: () => void;
    mockRiskFlags?: string[];
}

interface ReinsuranceTriggerCover {
    coverId: string;
    coverName?: string;
    sumInsured?: number;
    grossPremium?: number;
    reinsuranceRequired?: boolean;
}

interface ReinsuranceTriggerContext {
    evaluationLevel?: string;
    totalSumInsured?: number;
    totalGrossPremium?: number;
    covers?: ReinsuranceTriggerCover[];
}

const titleCase = (s: string) => {
    if (!s) return '-';
    return s
        .replace(/[_-]+/g, ' ')
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
};

const fmtNum = (n: number) =>
    new Intl.NumberFormat('en-AE', { style: 'decimal', maximumFractionDigits: 0 }).format(n);

export const ReferralTriggerCard = React.memo(
    ({ referralData, isExpanded, onToggle, mockRiskFlags }: ReferralTriggerCardProps) => {
        const rules = referralData.triggerDetails?.rules || [];
        const reinsuranceTrigger = (
            referralData.triggerDetails as Record<string, unknown> | null | undefined
        )?.reinsurance as ReinsuranceTriggerContext | undefined;
        const hasReinsuranceContext =
            reinsuranceTrigger &&
            (reinsuranceTrigger.totalSumInsured !== undefined ||
                reinsuranceTrigger.totalGrossPremium !== undefined ||
                (Array.isArray(reinsuranceTrigger.covers) && reinsuranceTrigger.covers.length > 0));

        return (
            <Card className="bg-card border border-border shadow-sm overflow-hidden" data-section="referral_trigger">
                <CardHeader className="pb-3 cursor-pointer hover:bg-muted/5 transition-colors" onClick={onToggle}>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <Flag className="h-4 w-4" />
                            Referral Trigger
                        </CardTitle>
                        {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-gray-500" />
                        ) : (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                        )}
                    </div>
                </CardHeader>
                {isExpanded && (
                    <CardContent className="p-0 border-t border-border">
                        {/* Boxed Summary Section */}
                        <div className="p-4">
                            <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                                <div className="px-4 py-3 bg-muted/30 border-b border-border">
                                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">General Summary</div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-border">
                                                <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-r border-border/50">Referral Source</th>
                                                <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-r border-border/50">System Recommendation</th>
                                                <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-r border-border/50">Manual Reason</th>
                                                <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Risk Flags</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td className="px-4 py-3 border-r border-border/50">
                                                    <Badge variant="outline" className="bg-muted/50 border-border/60 font-medium text-xs">
                                                        {referralData.triggerSourceType
                                                            ? titleCase(String(referralData.triggerSourceType).replace(/_/g, ' '))
                                                            : 'Rule-based'}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 border-r border-border/50">
                                                    <Badge variant="secondary" className="font-bold bg-primary/10 text-primary border-transparent text-xs">
                                                        {referralData.reason || 'Approve with Conditions'}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 border-r border-border/50 font-medium text-foreground">
                                                    {referralData.reason || '-'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap gap-1">
                                                        {mockRiskFlags && mockRiskFlags.length > 0 ? mockRiskFlags.map((flag, idx) => (
                                                            <Badge key={idx} variant="destructive" className="text-[10px] font-bold uppercase px-2 py-0 rounded-full">
                                                                <AlertTriangle className="w-3 h-3 mr-1" />
                                                                {flag}
                                                            </Badge>
                                                        )) : <span className="text-sm text-muted-foreground">-</span>}
                                                    </div>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {rules.length > 0 && (
                            <div className="border-t border-border p-4 pt-0">
                                <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
                                    <div className="px-4 py-3 bg-muted/30 border-b border-border">
                                        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Triggered Rules ({rules.length})</div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-border">
                                                    <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-10 border-r border-border/50">#</th>
                                                    <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-r border-border/50">Rule Name</th>
                                                    <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-r border-border/50">Rule Type</th>
                                                    <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-r border-border/50">Threshold Breached</th>
                                                    <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-r border-border/50">Action</th>
                                                    <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-r border-border/50">Recommendation</th>
                                                    <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Description</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/50">
                                                {rules.map((rule, idx) => (
                                                    <tr key={idx} className="hover:bg-muted/5 transition-colors">
                                                        <td className="px-3 py-3 text-xs text-muted-foreground font-medium border-r border-border/50">{idx + 1}</td>
                                                        <td className="px-3 py-3 text-sm font-bold text-foreground border-r border-border/50">
                                                            {rule.ruleName || rule.formFieldLabel || rule.name || '-'}
                                                        </td>
                                                        <td className="px-3 py-3 border-r border-border/50">
                                                            <Badge 
                                                                variant={rule.ruleSeverity === 'Hard' || rule.quoteAction === 'NO_QUOTE' ? 'destructive' : 'secondary'}
                                                                className="rounded-full px-2 py-0 text-[10px] font-bold uppercase tracking-tighter"
                                                            >
                                                                {rule.ruleSeverity || (rule.quoteAction === 'NO_QUOTE' ? 'Hard' : 'Soft')}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-3 py-3 text-sm text-muted-foreground font-medium border-r border-border/50">
                                                            {rule.thresholdBreached || rule.conditions || (rule.rangeStart !== undefined ? `> ${rule.rangeStart}` : '-')}
                                                        </td>
                                                        <td className="px-3 py-3 text-sm text-primary font-bold border-r border-border/50">
                                                            {rule.quoteAction ? titleCase(String(rule.quoteAction)) : '-'}
                                                        </td>
                                                        <td className="px-3 py-3 text-sm text-foreground font-medium border-r border-border/50">{rule.recommendation || '-'}</td>
                                                        <td className="px-3 py-3 text-sm text-muted-foreground italic">{rule.description || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {hasReinsuranceContext && (
                            <div className="border-t border-border p-4 pt-0 space-y-4">
                                <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
                                    <div className="px-4 py-3 bg-muted/30 border-b border-border">
                                        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Reinsurance Summary</div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-border">
                                                    {reinsuranceTrigger?.evaluationLevel && (
                                                        <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-r border-border/50">Evaluation Level</th>
                                                    )}
                                                    {reinsuranceTrigger?.totalSumInsured !== undefined && (
                                                        <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-r border-border/50">Total Sum Insured</th>
                                                    )}
                                                    {reinsuranceTrigger?.totalGrossPremium !== undefined && (
                                                        <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Gross Premium</th>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    {reinsuranceTrigger?.evaluationLevel && (
                                                        <td className="px-4 py-3 bg-muted/5 font-bold capitalize border-r border-border/50">{reinsuranceTrigger.evaluationLevel}</td>
                                                    )}
                                                    {reinsuranceTrigger?.totalSumInsured !== undefined && (
                                                        <td className="px-4 py-3 font-bold tabular-nums border-r border-border/50 text-foreground">{fmtNum(reinsuranceTrigger.totalSumInsured)}</td>
                                                    )}
                                                    {reinsuranceTrigger?.totalGrossPremium !== undefined && (
                                                        <td className="px-4 py-3 bg-muted/5 font-bold tabular-nums text-foreground">{fmtNum(reinsuranceTrigger.totalGrossPremium)}</td>
                                                    )}
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {Array.isArray(reinsuranceTrigger?.covers) && reinsuranceTrigger!.covers!.length > 0 && (
                                    <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
                                        <div className="px-4 py-3 bg-muted/30 border-b border-border">
                                            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cover Reinsurance Details</div>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm border-collapse table-fixed">
                                                <colgroup>
                                                    <col style={{ width: '4%' }} />
                                                    <col style={{ width: '36%' }} />
                                                    <col style={{ width: '20%' }} />
                                                    <col style={{ width: '20%' }} />
                                                    <col style={{ width: '20%' }} />
                                                </colgroup>
                                                <thead>
                                                    <tr className="bg-slate-50 border-b border-border">
                                                        <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-r border-border/50">#</th>
                                                        <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-r border-border/50">Cover</th>
                                                        <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-r border-border/50">Sum Insured</th>
                                                        <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-r border-border/50">Gross Premium</th>
                                                        <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Reinsurance Required</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border/50">
                                                    {reinsuranceTrigger!.covers!.map((cover, idx) => (
                                                        <tr key={cover.coverId} className="hover:bg-muted/5 transition-colors">
                                                            <td className="px-3 py-3 text-xs text-muted-foreground font-medium border-r border-border/50">{idx + 1}</td>
                                                            <td className="px-3 py-3 font-bold text-foreground text-sm border-r border-border/50">{cover.coverName ?? cover.coverId}</td>
                                                            <td className="px-3 py-3 text-left tabular-nums text-muted-foreground font-medium border-r border-border/50">{cover.sumInsured !== undefined ? fmtNum(cover.sumInsured) : '—'}</td>
                                                            <td className="px-3 py-3 text-left tabular-nums text-muted-foreground font-medium border-r border-border/50">{cover.grossPremium !== undefined ? fmtNum(cover.grossPremium) : '—'}</td>
                                                            <td className="px-3 py-3 text-left">
                                                                {cover.reinsuranceRequired
                                                                    ? <Badge className="bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-bold uppercase px-2 py-0 rounded-full">Yes</Badge>
                                                                    : <Badge variant="outline" className="text-[10px] font-bold uppercase px-2 py-0 rounded-full text-muted-foreground">No</Badge>}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                )}
            </Card>
        );
    },
);
