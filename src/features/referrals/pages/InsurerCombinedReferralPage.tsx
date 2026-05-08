import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InsurerReferralDetails from './InsurerReferralDetails';
import ReferralDetails from '@/features/proposals/pages/ReferralDetails';
import { getReferralDetail, updateReferralStatus, downloadReferralPdf } from '@/features/proposals/api/referrals';
import { useToast } from '@/shared/hooks/use-toast';

// Status options mapping
export const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
    { value: 'open', label: 'Open' },
    { value: 'in_review', label: 'In Review' },
    { value: 'query_raised', label: 'Query Raised' },
    { value: 'approved', label: 'Approved' },
    { value: 'approved_with_conditions', label: 'Approved with Conditions' },
    { value: 'declined', label: 'Declined' },
    { value: 'closed', label: 'Closed' },
];

const getStatusLabel = (status: string) => {

    return STATUS_OPTIONS.find(o => o.value == status)?.label || status;
};

const InsurerCombinedReferralPage = () => {
    const { referralId } = useParams<{ referralId: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [combinedNotes, setCombinedNotes] = useState('');
    const [riskRating, setRiskRating] = useState('');
    const [decision, setDecision] = useState('');
    const [isDownloading, setIsDownloading] = useState(false);

    const { data: detail, isLoading } = useQuery({
        queryKey: ['referral-detail', referralId],
        queryFn: () => getReferralDetail(referralId!),
        enabled: !!referralId,
        staleTime: 1000 * 60,
    });

    // Scroll to top when component mounts or referralId changes
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [referralId]);


    const submitDecisionMutation = useMutation({
        mutationFn: async () => {
            if (!decision) {
                throw new Error('Please select a decision');
            }
            return updateReferralStatus(referralId!, {
                status: decision,
                comment: combinedNotes,
            });
        },
        onSuccess: () => {
            toast({
                title: 'Success',
                description: 'Decision submitted successfully',
            });
            setDecision('');
            setCombinedNotes('');
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error?.message || 'Failed to submit decision',
                variant: 'destructive',
            });
        },
    });

    const statusMutation = useMutation({
        mutationFn: (status: string) => updateReferralStatus(referralId!, { status }),
        onSuccess: (_, newStatus) => {
            // Update local detail state immediately
            queryClient.setQueryData(['referral-detail', referralId], (oldData: any) => 
                oldData ? { ...oldData, status: newStatus } : null
            );
            toast({
                title: 'Status updated',
                description: 'Referral status has been saved.',
            });
        },
        onError: () => {
            toast({
                title: 'Error',
                description: 'Failed to update status.',
                variant: 'destructive',
            });
        },
    });

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
            console.error('[handleDownloadPdf] Failed:', error);
            toast({
                title: 'Download failed',
                description: 'Failed to download referral PDF',
                variant: 'destructive',
            });
        } finally {
            setIsDownloading(false);
        }
    };

    const triggerDetails: Record<string, unknown> | null =
        detail?.triggerDetails && typeof detail.triggerDetails === 'object'
            ? (detail.triggerDetails as Record<string, unknown>)
            : null;

    const isReinsuranceTriggered = Boolean(triggerDetails?.['reinsurance']);

    // Any referral that exists is an underwriting referral — no need to detect from trigger fields.
    // Only reinsurance needs explicit detection since it's an optional overlay.
    const showUnderwriting = isLoading || !!detail;
    const showReinsurance = isLoading || isReinsuranceTriggered;
    const showCombined = !isLoading && !!detail && isReinsuranceTriggered;

    // Both present — single wrapper with sub-headings + shared footer
    if (showCombined) {
        return (
            <div className="min-h-screen" style={{ backgroundColor: '#f8fafc' }}>
                <div className="mx-auto w-full max-w-none px-4 py-8 pb-40 relative">
                    {/* Main heading */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
                        <div className="flex items-center justify-between px-6 py-5">
                            <div className="flex items-center gap-4 flex-1">
                                <button
                                    onClick={() => navigate('/insurer/dashboard')}
                                    className="text-primary hover:text-primary flex items-center justify-center p-1 h-8 w-8 shrink-0 rounded hover:bg-primary/10 transition-all"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </button>
                                <div className="w-px h-6 bg-gray-200" />
                                <div className="flex-1">
                                    <h2 className="text-xl font-semibold text-gray-900">Referral &amp; Reinsurance Details</h2>
                                    <p className="text-sm text-gray-500 mt-1">ID: {detail?.referralId}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 ml-6">
                                <div className="relative w-[200px]">
                                    <Select
                                        value={detail?.status || ''}
                                        onValueChange={(value) => statusMutation.mutate(value)}
                                        disabled={statusMutation.isPending}
                                    >
                                        <SelectTrigger className="w-full bg-gray-50 text-foreground border-gray-300 h-10 px-3 py-2 hover:bg-gray-100 transition-colors">
                                            <div className="flex items-center justify-between w-full">
                                                <span className="text-sm font-medium text-gray-900">
                                                    {getStatusLabel(detail?.status || 'Select Status')}
                                                </span>
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {STATUS_OPTIONS.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button
                                    size="sm"
                                    className="bg-primary hover:bg-primary/90 text-white font-medium px-4 py-2 h-10 flex items-center gap-2 whitespace-nowrap"
                                    onClick={handleDownloadPdf}
                                    disabled={isDownloading}
                                >
                                    {isDownloading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Download className="h-4 w-4" />
                                    )}
                                    Download
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Underwriting sub-section */}
                        <div className="rounded-lg border border-border overflow-hidden">
                            <div
                                className="flex items-center justify-between px-6 py-2.5 bg-muted/40"
                            >
                                <h3 className="text-sm font-semibold text-primary">Underwriting Referral</h3>
                            </div>
                            <ReferralDetails fullWidth hideHeader />
                        </div>

                        {/* Reinsurance sub-section */}
                        <div className="rounded-lg border border-border overflow-hidden">
                            <div
                                className="flex items-center justify-between px-6 py-2.5 bg-muted/40"
                            >
                                <h3 className="text-sm font-semibold text-primary">Reinsurance Details</h3>
                            </div>
                            <InsurerReferralDetails fullWidth hideHeader hideBackButton hideStatusDropdown />
                        </div>
                    </div>
                </div>

                {/* Shared Underwriter Review Footer */}
                <div
                    className="fixed bottom-0 right-0 z-50 border-t border-primary/15 bg-[hsl(180,45%,96%)] shadow-[0_-2px_8px_rgba(0,0,0,0.06)]"
                    style={{ left: 'var(--sidebar-width, 16rem)' }}
                >
                    <div className="px-6 py-4 flex items-center gap-3">
                        <div className="shrink-0 w-36">
                            <div className="text-sm font-semibold text-primary leading-tight">Underwriter Review</div>
                            <div className="text-xs text-muted-foreground">Make your decision</div>
                        </div>
                        <div className="w-px h-8 bg-primary/20 shrink-0" />
                        <Popover>
                            <PopoverTrigger asChild>
                                <div className="flex-1 min-w-0 cursor-text">
                                    <Input
                                        placeholder="Enter your assessment notes..."
                                        value={combinedNotes}
                                        readOnly
                                        className="h-8 bg-white border-primary/40 shadow-sm text-foreground placeholder:text-muted-foreground text-xs cursor-text"
                                    />
                                </div>
                            </PopoverTrigger>
                            <PopoverContent side="top" align="start" className="w-[--radix-popover-trigger-width] p-3 shadow-lg">
                                <div className="text-xs font-semibold text-primary mb-2">Underwriter Notes</div>
                                <Textarea
                                    placeholder="Enter your assessment notes..."
                                    value={combinedNotes}
                                    onChange={(e) => setCombinedNotes(e.target.value)}
                                    rows={5}
                                    className="resize-none text-sm bg-white border-primary/40 focus-visible:ring-primary/40"
                                    autoFocus
                                />
                                <div className="text-xs text-muted-foreground mt-1.5 text-right">{combinedNotes.length} chars</div>
                            </PopoverContent>
                        </Popover>
                        <div className="w-px h-8 bg-primary/20 shrink-0" />
                        <Select value={riskRating} onValueChange={setRiskRating}>
                            <SelectTrigger className="h-8 w-36 bg-white border-primary/40 shadow-sm text-foreground text-xs shrink-0">
                                <SelectValue placeholder="Risk Rating" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={decision} onValueChange={setDecision}>
                            <SelectTrigger className="h-8 w-44 bg-white border-primary/40 shadow-sm text-foreground text-xs shrink-0">
                                <SelectValue placeholder="Select Decision" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="approved">Approve as Is</SelectItem>
                                <SelectItem value="approved_with_conditions">Apply Premium Loading</SelectItem>
                                <SelectItem value="declined">Decline Quote</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button 
                            className="h-8 px-5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs shrink-0"
                            onClick={() => submitDecisionMutation.mutate()}
                            disabled={submitDecisionMutation.isPending || !decision}
                        >
                            {submitDecisionMutation.isPending ? (
                                <>
                                    <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                'Submit Decision'
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Only one present — render standalone (footer handled internally)
    // Use CSS display to avoid unmounting (preserves chat state from ?openMessage=true)
    return (
        <>
            <div style={{ display: showReinsurance ? 'block' : 'none' }}>
                <InsurerReferralDetails fullWidth />
            </div>
            <div style={{ display: showUnderwriting ? 'block' : 'none' }}>
                <ReferralDetails fullWidth />
            </div>
        </>
    );
};

export default InsurerCombinedReferralPage;
