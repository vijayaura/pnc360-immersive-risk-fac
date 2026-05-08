import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    ReferralDecisions,
    ReferralRiskRatings,
    ReferralPremiumLoadingTypes,
    RiskRating,
    PremiumLoadingType,
    Decision,
} from '@/features/quotes/api/quotes';

interface UnderwriterReviewCardProps {
    isReadOnly: boolean;
    underwriterNotes: string;
    setUnderwriterNotes: (v: string) => void;
    riskRating: RiskRating;
    setRiskRating: (v: RiskRating) => void;
    decision: Decision | '';
    setDecision: (v: Decision) => void;
    premiumLoadingType: PremiumLoadingType;
    setPremiumLoadingType: (v: PremiumLoadingType) => void;
    premiumLoading: string;
    setPremiumLoading: (v: string) => void;
    revisedDeductible: string;
    setRevisedDeductible: (v: string) => void;
    coverageExclusions: string[];
    setCoverageExclusions: (v: string[]) => void;
    specialConditions: string;
    setSpecialConditions: (v: string) => void;
    validityPeriod: string;
    setValidityPeriod: (v: string) => void;
    reReferralRequired: boolean;
    setReReferralRequired: (v: boolean) => void;
    onSubmit: () => void;
}

export const UnderwriterReviewCard = React.memo(
    ({
        isReadOnly,
        underwriterNotes,
        setUnderwriterNotes,
        riskRating,
        setRiskRating,
        decision,
        setDecision,
        premiumLoadingType,
        setPremiumLoadingType,
        premiumLoading,
        setPremiumLoading,
        revisedDeductible,
        setRevisedDeductible,
        coverageExclusions,
        setCoverageExclusions,
        specialConditions,
        setSpecialConditions,
        validityPeriod,
        setValidityPeriod,
        reReferralRequired,
        setReReferralRequired,
        onSubmit,
    }: UnderwriterReviewCardProps) => {
        return (
            <Card className="bg-card border border-border overflow-hidden shadow-sm" data-section="underwriter_review">
                <CardHeader className="pb-3 bg-muted/5 border-b border-border/40">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        Underwriter Review
                    </CardTitle>
                    <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Make your decision on this referral</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="space-y-4">
                        <div className="p-4 bg-muted/30 rounded-lg border border-border/40">
                            <Label htmlFor="underwriter-notes-review" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 block">
                                Underwriter Notes *
                            </Label>
                            <Textarea
                                id="underwriter-notes-review"
                                placeholder="Enter your assessment notes..."
                                value={underwriterNotes}
                                onChange={(e) => setUnderwriterNotes(e.target.value)}
                                rows={3}
                                className="resize-none mt-1 bg-background border-border/60 focus-visible:ring-primary shadow-inner"
                                disabled={isReadOnly}
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end bg-muted/20 p-4 rounded-lg border border-border/40">
                            <div className="lg:col-span-3">
                                <Label htmlFor="risk-rating-review" className="text-xs font-medium">
                                    Internal Risk Rating *
                                </Label>
                                <Select
                                    value={riskRating}
                                    onValueChange={(value) => setRiskRating(value as RiskRating)}
                                    disabled={isReadOnly}
                                >
                                    <SelectTrigger id="risk-rating-review" className="h-9 mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={ReferralRiskRatings.LOW}>Low</SelectItem>
                                        <SelectItem value={ReferralRiskRatings.MEDIUM}>Medium</SelectItem>
                                        <SelectItem value={ReferralRiskRatings.HIGH}>High</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="lg:col-span-4">
                                <Label htmlFor="decision-review" className="text-xs font-medium">
                                    Decision *
                                </Label>
                                <Select
                                    value={decision}
                                    onValueChange={(value) => setDecision(value as Decision)}
                                    disabled={isReadOnly}
                                >
                                    <SelectTrigger id="decision-review" className="h-9 mt-1">
                                        <SelectValue placeholder="Select decision" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={ReferralDecisions.APPROVE_AS_IS}>Approve as Is</SelectItem>
                                        <SelectItem value={ReferralDecisions.APPLY_PREMIUM_LOADING}>
                                            Apply Premium Loading
                                        </SelectItem>
                                        <SelectItem value={ReferralDecisions.DECLINE_QUOTE}>Decline Quote</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="lg:col-span-5">
                                <Button
                                    onClick={onSubmit}
                                    disabled={isReadOnly || !decision || !underwriterNotes.trim()}
                                    className="h-9 w-full"
                                >
                                    {isReadOnly ? 'Decision Submitted' : 'Submit Decision'}
                                </Button>
                            </div>
                        </div>

                        {((decision && decision !== ReferralDecisions.APPROVE_AS_IS && decision !== ReferralDecisions.DECLINE_QUOTE && decision !== ReferralDecisions.REQUEST_MORE_DOCUMENTS) ||
                            isReadOnly) && (
                                <div className="mt-6 pt-6 border-t border-border/40">
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Action Details & Modifications</div>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {(decision === ReferralDecisions.APPLY_PREMIUM_LOADING || (isReadOnly && premiumLoading)) && (
                                            <div className="p-4 bg-background rounded-lg border border-border/60 shadow-sm transition-all hover:border-primary/30">
                                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Premium Loading</Label>
                                                <div className="flex gap-2">
                                                    <Select
                                                        value={premiumLoadingType}
                                                        onValueChange={(value) =>
                                                            setPremiumLoadingType(value as PremiumLoadingType)
                                                        }
                                                        disabled={isReadOnly}
                                                    >
                                                        <SelectTrigger className="w-32 h-9 bg-muted/5 font-semibold text-xs border-border/60">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value={ReferralPremiumLoadingTypes.PERCENTAGE}>
                                                                Percentage (%)
                                                            </SelectItem>
                                                            <SelectItem value={ReferralPremiumLoadingTypes.AMOUNT}>
                                                                Amount (AED)
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <Input
                                                        type="number"
                                                        placeholder={
                                                            premiumLoadingType === ReferralPremiumLoadingTypes.PERCENTAGE
                                                                ? 'Enter %'
                                                                : 'Enter amount'
                                                        }
                                                        value={premiumLoading}
                                                        onChange={(e) => setPremiumLoading(e.target.value)}
                                                        className="h-9 flex-1 font-bold border-border/60 placeholder:text-muted-foreground/50"
                                                        disabled={isReadOnly}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {(decision === ReferralDecisions.APPLY_DEDUCTIBLE_CHANGE || (isReadOnly && revisedDeductible)) && (
                                            <div className="p-4 bg-background rounded-lg border border-border/60 shadow-sm transition-all hover:border-primary/30">
                                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Revised Deductible</Label>
                                                <Input
                                                    type="text"
                                                    placeholder="Enter revised deductible"
                                                    value={revisedDeductible}
                                                    onChange={(e) => setRevisedDeductible(e.target.value)}
                                                    className="h-9 font-bold border-border/60 placeholder:text-muted-foreground/50"
                                                    disabled={isReadOnly}
                                                />
                                            </div>
                                        )}

                                        {(decision === ReferralDecisions.APPLY_COVERAGE_EXCLUSION || (isReadOnly && coverageExclusions.length > 0)) && (
                                            <div className="p-4 bg-background rounded-lg border border-border/60 shadow-sm transition-all hover:border-primary/30 lg:col-span-2">
                                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Coverage Exclusions</Label>
                                                <Textarea
                                                    placeholder="Enter coverage exclusions..."
                                                    value={coverageExclusions.join(', ')}
                                                    onChange={(e) =>
                                                        setCoverageExclusions(e.target.value.split(',').map((s) => s.trim()))
                                                    }
                                                    rows={2}
                                                    className="resize-none font-medium bg-muted/5 border-border/60 placeholder:text-muted-foreground/50"
                                                    disabled={isReadOnly}
                                                />
                                            </div>
                                        )}

                                        {(decision === ReferralDecisions.APPROVE_WITH_CONDITIONS || (isReadOnly && (specialConditions || validityPeriod))) && (
                                            <>
                                                <div className="p-4 bg-background rounded-lg border border-border/60 shadow-sm transition-all hover:border-primary/30">
                                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Special Conditions</Label>
                                                    <Textarea
                                                        placeholder="Enter special conditions..."
                                                        value={specialConditions}
                                                        onChange={(e) => setSpecialConditions(e.target.value)}
                                                        rows={2}
                                                        className="resize-none font-medium bg-muted/5 border-border/60 placeholder:text-muted-foreground/50"
                                                        disabled={isReadOnly}
                                                    />
                                                </div>
                                                <div className="p-4 bg-background rounded-lg border border-border/60 shadow-sm transition-all hover:border-primary/30 flex flex-col justify-between">
                                                    <div>
                                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Validity Period</Label>
                                                        <Input
                                                            type="text"
                                                            placeholder="e.g., 30 days"
                                                            value={validityPeriod}
                                                            onChange={(e) => setValidityPeriod(e.target.value)}
                                                            className="h-9 font-bold border-border/60 placeholder:text-muted-foreground/50"
                                                            disabled={isReadOnly}
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-4 p-2.5 rounded-lg bg-primary/5 border border-primary/20">
                                                        <input
                                                            type="checkbox"
                                                            id="re-referral-review"
                                                            checked={reReferralRequired}
                                                            onChange={(e) => setReReferralRequired(e.target.checked)}
                                                            className="h-4 w-4 rounded-sm border-border accent-primary"
                                                            disabled={isReadOnly}
                                                        />
                                                        <Label htmlFor="re-referral-review" className="cursor-pointer text-[11px] font-bold uppercase tracking-tight text-foreground">
                                                            Re-referral Required
                                                        </Label>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                    </div>
                </CardContent>
                {!isReadOnly && (
                    <CardFooter className="bg-muted/5 border-t border-border/40 p-4 flex justify-end">
                        <Button
                            onClick={onSubmit}
                            disabled={!decision || !underwriterNotes.trim()}
                            variant="default"
                            className="font-bold uppercase tracking-widest text-[10px] h-9 px-8 transition-all hover:scale-105"
                        >
                            Submit Review
                        </Button>
                    </CardFooter>
                )}
            </Card>
        );
    },
);
