import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { StatusBadge, PriorityBadge } from './ReferralStatusBadges';
import { Button } from '@/components/ui/button';
import { ReferralApiResponse } from '@/features/quotes/api/quotes';
import { formatDateTimeDDMMYYYY } from '@/shared/utils/date-format';

interface ReferralInfoCardProps {
    referralData: ReferralApiResponse;
    isExpanded: boolean;
    onToggle: () => void;
    onShowProposal?: () => void;
    canShowProposal?: boolean;
}

const t = (v: any) => {
    if (v === null || v === undefined) return '-';
    const s = String(v).trim();
    return s.length ? s : '-';
};

export const ReferralInfoCard = React.memo(
    ({ referralData, isExpanded, onToggle, onShowProposal, canShowProposal = false }: ReferralInfoCardProps) => {
        return (
            <Card className="bg-card border border-border overflow-hidden shadow-sm" data-section="referral_header">
                <CardHeader className="pb-3 cursor-pointer hover:bg-muted/5 transition-colors" onClick={onToggle}>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold">Referral Information</CardTitle>
                        {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                    </div>
                </CardHeader>
                {isExpanded && (
                    <CardContent className="p-0 border-t border-border">
                        <div className="grid grid-cols-3 divide-x divide-y divide-border">
                            <div className="px-4 py-3 bg-muted/30">
                                <div className="text-xs text-muted-foreground mb-1">Referral ID</div>
                                <div className="text-sm font-semibold text-foreground">{t(referralData.referralId)}</div>
                            </div>
                            <div className="px-4 py-3">
                                <div className="text-xs text-muted-foreground mb-1">Quote No</div>
                                <div className="text-sm font-semibold text-foreground">{t(referralData.quoteNumber)}</div>
                            </div>
                            <div className="px-4 py-3 bg-muted/30">
                                <div className="text-xs text-muted-foreground mb-1">Product</div>
                                <div className="text-sm font-semibold text-foreground">{t(referralData.productName)}</div>
                            </div>
                            <div className="px-4 py-3">
                                <div className="text-xs text-muted-foreground mb-1">Insurer</div>
                                <div className="text-sm font-semibold text-foreground">{t(referralData.insurerName)}</div>
                            </div>
                            <div className="px-4 py-3 bg-muted/30">
                                <div className="text-xs text-muted-foreground mb-1">Broker Name</div>
                                <div className="text-sm font-semibold text-foreground">{t(referralData.brokerName)}</div>
                            </div>
                            <div className="px-4 py-3">
                                <div className="text-xs text-muted-foreground mb-1">Status</div>
                                <div className="text-sm"><StatusBadge status={referralData.status} /></div>
                            </div>
                            <div className="px-4 py-3 bg-muted/30">
                                <div className="text-xs text-muted-foreground mb-1">Priority</div>
                                <div className="text-sm">
                                    <PriorityBadge priority={referralData.priority} />
                                    {t(referralData.priority) === '-' && <span className="text-muted-foreground italic text-xs">Not specified</span>}
                                </div>
                            </div>
                            <div className="px-4 py-3">
                                <div className="text-xs text-muted-foreground mb-1">Created Date</div>
                                <div className="text-sm font-semibold text-foreground">{referralData.referredAt ? formatDateTimeDDMMYYYY(referralData.referredAt) : '-'}</div>
                            </div>
                            <div className="px-4 py-3 bg-muted/30">
                                <div className="text-xs text-muted-foreground mb-1">Last Updated</div>
                                <div className="text-sm font-semibold text-foreground">{referralData.updatedAt ? formatDateTimeDDMMYYYY(referralData.updatedAt) : '-'}</div>
                            </div>
                        </div>
                        {onShowProposal && (
                            <div className="px-4 py-3 border-t border-border bg-muted/20 flex justify-end">
                                <Button variant="outline" size="sm" onClick={onShowProposal} className="h-8" disabled={!canShowProposal}>
                                    View Proposal
                                </Button>
                            </div>
                        )}
                    </CardContent>
                )}
            </Card>
        );
    },
);
