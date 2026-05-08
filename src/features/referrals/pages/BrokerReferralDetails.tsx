import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQueryClient } from '@tanstack/react-query';
import {
    getReferralData,
    ReferralApiResponse,
    addReferralComment,
    getReferralChatHistory,
    sendReferralQuery,
    ChatMessage,
    ReferralStatus,
    ProposalBundleResponseV2,
} from '@/features/quotes/api/quotes';
import { useToast } from '@/shared/hooks/use-toast';

// Refactored Shared Components
import { StatusBadge, PriorityBadge } from '../components/ReferralStatusBadges';
import { ReferralInfoCard } from '../components/ReferralInfoCard';
import { ReferralTriggerCard } from '../components/ReferralTriggerCard';
import { ReferralHistory } from '../components/ReferralHistory';
import { ReferralChat } from '../components/ReferralChat';
import { TemplatePages } from '@/features/quotes/components/QuoteDetailsV2/TemplatePages';
import { downloadBrokerReferralPdf } from '@/features/proposals/api/referrals';

const MOCK_RISK_FLAGS = ['High Sum Insured', 'Non-standard Occupancy'];

const injectFormValuesIntoTemplateSnapshot = (
    node: unknown,
    valueMap: Map<string, { value: unknown; masterValueId: string | null }>,
    fileMap: Map<string, Array<{ url: string; metadata?: unknown }>>,
): unknown => {
    if (Array.isArray(node)) {
        return node.map((item) => injectFormValuesIntoTemplateSnapshot(item, valueMap, fileMap));
    }
    if (!node || typeof node !== 'object') return node;

    const record = node as Record<string, unknown>;
    const merged: Record<string, unknown> = { ...record };
    const fieldId = typeof record.id === 'string' ? record.id : null;

    if (fieldId && valueMap.has(fieldId)) {
        const valueEntry = valueMap.get(fieldId)!;
        merged.value = valueEntry.value;
        merged.masterValueId = valueEntry.masterValueId;
    }
    if (fieldId && fileMap.has(fieldId)) {
        merged.files = fileMap.get(fieldId);
    }
    if (Array.isArray(record.pages)) {
        merged.pages = record.pages.map((item) =>
            injectFormValuesIntoTemplateSnapshot(item, valueMap, fileMap),
        );
    }
    if (Array.isArray(record.sections)) {
        merged.sections = record.sections.map((item) =>
            injectFormValuesIntoTemplateSnapshot(item, valueMap, fileMap),
        );
    }
    if (Array.isArray(record.fields)) {
        merged.fields = record.fields.map((item) =>
            injectFormValuesIntoTemplateSnapshot(item, valueMap, fileMap),
        );
    }
    if (Array.isArray(record.subFields)) {
        merged.subFields = record.subFields.map((item) =>
            injectFormValuesIntoTemplateSnapshot(item, valueMap, fileMap),
        );
    }
    if (Array.isArray(record.childFields)) {
        merged.childFields = record.childFields.map((item) =>
            injectFormValuesIntoTemplateSnapshot(item, valueMap, fileMap),
        );
    }
    return merged;
};

const buildProposalBundleFromFormResponseData = (
    referral: ReferralApiResponse,
): ProposalBundleResponseV2 | null => {
    const formResponse = referral.formResponseData;
    if (
        !formResponse?.templateVersionSnapshot ||
        typeof formResponse.templateVersionSnapshot !== 'object'
    ) {
        return null;
    }

    const valueMap = new Map<string, { value: unknown; masterValueId: string | null }>();
    for (const item of formResponse.values || []) {
        const rawValue =
            item.valueJson !== null && item.valueJson !== undefined ? item.valueJson : item.valueText;
        valueMap.set(item.fieldId, {
            value: rawValue,
            masterValueId: item.masterValueId ?? null,
        });
    }

    const fileMap = new Map<string, Array<{ url: string; metadata?: unknown }>>();
    for (const file of (formResponse.files || []) as Array<Record<string, unknown>>) {
        const fieldId = typeof file.fieldId === 'string' ? file.fieldId : null;
        if (!fieldId) continue;
        const url =
            typeof file.url === 'string'
                ? file.url
                : typeof file.fileUrl === 'string'
                    ? file.fileUrl
                    : '';
        if (!url) continue;
        const existing = fileMap.get(fieldId) || [];
        existing.push({ url, metadata: file.metadata });
        fileMap.set(fieldId, existing);
    }

    const mergedTemplate = injectFormValuesIntoTemplateSnapshot(
        formResponse.templateVersionSnapshot,
        valueMap,
        fileMap,
    ) as Record<string, unknown>;

    const templateName =
        typeof mergedTemplate.name === 'string' ? mergedTemplate.name : referral.productName || 'Proposal Form';
    const templatePages = Array.isArray(mergedTemplate.pages) ? mergedTemplate.pages : [];
    const templateProductId =
        typeof mergedTemplate.productId === 'string' ? mergedTemplate.productId : formResponse.productId;
    const templateId =
        typeof mergedTemplate.id === 'string'
            ? mergedTemplate.id
            : typeof mergedTemplate.templateId === 'string'
                ? mergedTemplate.templateId
                : formResponse.templateId;
    const currency =
        typeof mergedTemplate.currency === 'string' ? mergedTemplate.currency : referral.currency || undefined;

    return {
        lastFilledPageId: '',
        responseId: formResponse.responseId,
        templateId: formResponse.templateId,
        templateVersionId: formResponse.templateVersionId,
        productId: formResponse.productId,
        status: formResponse.status,
        template: {
            name: templateName,
            pages: templatePages as ProposalBundleResponseV2['template']['pages'],
            productId: templateProductId,
            templateId,
            currency,
        },
    };
};

const BrokerReferralDetails = () => {
    const { referralId } = useParams<{ referralId?: string }>();
    const [searchParams] = useSearchParams();
    const quoteId = searchParams.get('quoteId') || undefined;
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [referralData, setReferralData] = useState<ReferralApiResponse | null>(null);
    const [proposalBundle, setProposalBundle] = useState<ProposalBundleResponseV2 | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(
        new Set(['referral_header', 'referral_history', 'referral_trigger']),
    );

    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const location = useLocation();

    // Lazy-init from URL so ?openMessage=true auto-opens the chat panel
    const [isChatExpanded, setIsChatExpanded] = useState<boolean>(
        () => new URLSearchParams(location.search).get('openMessage') === 'true',
    );
    const [isDownloading, setIsDownloading] = useState(false);
    const [showProposalDialog, setShowProposalDialog] = useState(false);

    // Re-sync when React Router reuses this component instance with a new URL
    useEffect(() => {
        if (new URLSearchParams(location.search).get('openMessage') === 'true') {
            setIsChatExpanded(true);
            
            // Remove the param without adding a new history entry so refresh doesn't reopen it
            const newParams = new URLSearchParams(location.search);
            newParams.delete('openMessage');
            const newSearch = newParams.toString();
            navigate({ search: newSearch }, { replace: true });
        }
    }, [location.search, navigate]);
    const chatReadSyncingRef = useRef(false);
    const [chatHistoryLoaded, setChatHistoryLoaded] = useState(false);
    const [initialListUnreadCount, setInitialListUnreadCount] = useState(0);

    const getReferralUnreadFromCache = useCallback(
        (refId: string): number | null => {
            const caches = [
                queryClient.getQueriesData({ queryKey: ['broker-referrals'] }),
                queryClient.getQueriesData({ queryKey: ['insurer-referrals'] }),
            ].flat();

            for (const [, data] of caches) {
                if (
                    data &&
                    typeof data === 'object' &&
                    'data' in data &&
                    Array.isArray((data as { data?: unknown[] }).data)
                ) {
                    const rows = (data as { data: Array<Record<string, unknown>> }).data;
                    const match = rows.find((row) => row.id === refId);
                    if (match) return Number(match.unreadMessageCount || 0);
                }
            }

            return null;
        },
        [queryClient],
    );

    useEffect(() => {
        const loadData = async () => {
            if (!referralId && !quoteId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setChatHistoryLoaded(false);
                setChatMessages([]);
                const idToFetch = referralId || quoteId;
                if (idToFetch) {
                    const referral = await getReferralData(idToFetch);

                    const sStatus = String(referral.status || '').toLowerCase();
                    const statusNormalized: ReferralStatus =
                        sStatus === 'responded' ? 'Responded' :
                        sStatus === 'closed' ? 'Closed' :
                        sStatus === 'approved' ? 'Approved' :
                        sStatus === 'declined' ? 'Declined' :
                        sStatus === 'approved_with_conditions' ? 'Approved With Conditions' :
                        sStatus === 'query_raised' ? 'Query Raised' :
                        sStatus === 'in_review' ? 'In Review' :
                        'Open';

                    const normalizedReferral = { ...referral, status: statusNormalized };
                    setReferralData(normalizedReferral);
                    const referralProposalBundle =
                        referral.proposalBundle ?? buildProposalBundleFromFormResponseData(referral);
                    setProposalBundle(referralProposalBundle);
                    if (referralProposalBundle) {
                        setExpandedSections((prev) => {
                            const next = new Set(prev);
                            (referralProposalBundle.template?.pages ?? []).forEach((page) => {
                                next.add(`page_${page.id}`);
                            });
                            return next;
                        });
                    }
                    const unreadFromCache = getReferralUnreadFromCache(referral.id);
                    const unreadFromDetail = Number(
                        (referral as unknown as { unreadMessageCount?: number }).unreadMessageCount || 0,
                    );
                    setInitialListUnreadCount(unreadFromCache ?? unreadFromDetail);
                }
            } catch (err) {
                console.error('Error loading referral data:', err);
                toast({
                    title: 'Error',
                    description: 'Failed to load referral data',
                    variant: 'destructive',
                });
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [referralId, quoteId, toast, getReferralUnreadFromCache]);

    useEffect(() => {
        if (!isChatExpanded || !referralData?.id) return;
        let cancelled = false;

        (async () => {
            try {
                const chatRes = await getReferralChatHistory(referralData.id, 'true');
                if (!cancelled) {
                    setChatMessages(chatRes.data ?? []);
                    setChatHistoryLoaded(true);
                }
            } catch (error) {
                if (!cancelled) {
                    console.error('Error loading chat history:', error);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [isChatExpanded, referralData?.id]);

    const toggleSectionExpansion = useCallback((sectionKey: string) => {
        setExpandedSections((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(sectionKey)) {
                newSet.delete(sectionKey);
            } else {
                newSet.add(sectionKey);
            }
            return newSet;
        });
    }, []);

    const handleAddComment = async (comment: string) => {
        try {
            const id = referralId || referralData?.referralId;
            if (!id) throw new Error('Referral ID not found');

            await addReferralComment(id, { comment });

            if (referralData) {
                setReferralData({
                    ...referralData,
                    activities: [
                        ...referralData.activities,
                        {
                            id: `A${Date.now()}`,
                            actorType: 'user',
                            actionType: 'comment_added',
                            comment: comment,
                            createdAt: new Date().toISOString(),
                        },
                    ],
                    updatedAt: new Date().toISOString(),
                });
            }

            toast({
                title: 'Comment Added',
                description: 'Your comment has been added to the referral history',
            });
        } catch (error: unknown) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to add comment',
                variant: 'destructive',
            });
        }
    };

    const handleSendQuery = async (message: string, files: File[]) => {
        if (!referralData?.id) return;

        try {
            await sendReferralQuery(referralData.id, {
                message: message.trim(),
                dueDate: new Date().toISOString().split('T')[0],
                files,
            });

            const chatRes = await getReferralChatHistory(referralData.id, 'true');
            setChatMessages(chatRes.data);
            setChatHistoryLoaded(true);

            toast({
                title: 'Query Sent',
                description: `Your query has been sent successfully${files.length > 0 ? ` with ${files.length} attachment(s)` : ''}.`,
            });
        } catch (error: unknown) {
            console.error('Failed to send query', error);
            toast({
                title: 'Error',
                description: 'Failed to send query',
                variant: 'destructive',
            });
        }
    };

    // ── PDF download (server-generated) ─────────────────────────────────────

    const handleDownloadPdf = async () => {
        setIsDownloading(true);
        try {
            const blob = await downloadBrokerReferralPdf(referralData!.id);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const safeProduct = String(referralData!.productName || 'Referral')
                .replace(/[^a-zA-Z0-9 _-]/g, '')
                .trim()
                .replace(/\s+/g, '_');
            link.download = `${safeProduct}_${referralData!.referralId}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast({
                title: 'Referral downloaded',
                description: 'Referral PDF has been generated and downloaded.',
            });
        } catch (error) {
            console.error('[handleDownloadPdf] Failed for referralId:', referralData?.referralId, error);
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

    const countUnreadForRole = useCallback(
        (messages: ChatMessage[]) =>
            messages.filter((msg) => {
                if (msg.senderRole === 'broker') return false;
                return !msg.brokerReadAt;
            }).length,
        [],
    );

    const unreadIncomingCount = useMemo(() => countUnreadForRole(chatMessages), [chatMessages, countUnreadForRole]);
    const floatingUnreadCount = chatHistoryLoaded ? unreadIncomingCount : initialListUnreadCount;
    const patchReferralUnreadCountInCache = useCallback(
        (count: number) => {
            if (!referralData?.id) return;
            const applyPatch = (oldData: unknown) => {
                if (
                    oldData &&
                    typeof oldData === 'object' &&
                    'data' in oldData &&
                    Array.isArray((oldData as { data?: unknown[] }).data)
                ) {
                    const typed = oldData as { data: Array<Record<string, unknown>> };
                    return {
                        ...typed,
                        data: typed.data.map((item) =>
                            item.id === referralData.id ? { ...item, unreadMessageCount: count } : item,
                        ),
                    };
                }
                return oldData;
            };

            queryClient.setQueriesData({ queryKey: ['broker-referrals'] }, applyPatch);
            queryClient.setQueriesData({ queryKey: ['insurer-referrals'] }, applyPatch);
        },
        [queryClient, referralData?.id],
    );

    const syncServerReadStatusAtBottom = useCallback(async () => {
        if (!referralData?.id || chatReadSyncingRef.current) return;
        chatReadSyncingRef.current = true;
        try {
            let attempts = 0;
            let previousUnread = Number.MAX_SAFE_INTEGER;
            let latestMessages = chatMessages;
            while (attempts < 20) {
                const res = await getReferralChatHistory(referralData.id, 'true');
                latestMessages = res.data ?? [];
                setChatHistoryLoaded(true);
                const unread = countUnreadForRole(latestMessages);
                if (unread === 0) break;
                if (unread >= previousUnread) break;
                previousUnread = unread;
                attempts += 1;
            }
            setChatMessages(latestMessages);
        } catch (error) {
            console.error('Failed to sync referral chat read status:', error);
        } finally {
            chatReadSyncingRef.current = false;
        }
    }, [referralData?.id, chatMessages, countUnreadForRole]);

    useEffect(() => {
        if (!chatHistoryLoaded || !referralData?.id) return;
        patchReferralUnreadCountInCache(unreadIncomingCount);
    }, [chatHistoryLoaded, referralData?.id, unreadIncomingCount, patchReferralUnreadCountInCache]);

    const t = (v: unknown) => (v && String(v).trim().length ? String(v).trim() : '-');

    if (loading && !referralData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading referral details...</p>
                </div>
            </div>
        );
    }

    if (!referralData) return null;

    return (
        <div className="min-h-screen pb-8" style={{ backgroundColor: '#f8fafc' }}>
            {/* Sticky header bar */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-40">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate('/broker/dashboard')}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Dashboard
                        </Button>
                        <div className="flex items-center gap-4">
                            <div>
                                <h1 className="text-lg font-semibold text-gray-900">
                                    Referral Details — {t(referralData.referralId)}
                                </h1>
                                <p className="text-sm text-gray-600">
                                    {t(referralData.productName)}
                                    {referralData.quoteNumber && ` · Quote ${referralData.quoteNumber}`}
                                    {referralData.brokerName && ` · ${referralData.brokerName}`}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-2">
                            <StatusBadge status={referralData.status} compact />
                            <PriorityBadge priority={referralData.priority} />
                        </div>
                        <div className="w-px h-5 bg-gray-200 mx-1" />
                        <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={isDownloading} className="shrink-0">
                            {isDownloading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Download className="h-4 w-4 mr-1.5" />}
                            {isDownloading ? 'Generating...' : 'Download'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="mx-auto w-full max-w-none px-4 py-8 relative">
                <div className="rounded-lg border overflow-hidden">
                    {/* Section heading */}
                    <div className="flex items-center px-4 py-3 bg-primary text-primary-foreground">
                        <h2 className="text-lg font-semibold">Underwriting Referral</h2>
                    </div>

                    {/* Content area */}
                    <div className="bg-muted/30 px-6 pt-6 pb-6 space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            <ReferralInfoCard
                                referralData={referralData}
                                isExpanded={expandedSections.has('referral_header')}
                                onToggle={() => toggleSectionExpansion('referral_header')}
                                onShowProposal={() => setShowProposalDialog(true)}
                                canShowProposal={!!proposalBundle}
                            />

                            <ReferralTriggerCard
                                referralData={referralData}
                                isExpanded={expandedSections.has('referral_trigger')}
                                onToggle={() => toggleSectionExpansion('referral_trigger')}
                                mockRiskFlags={MOCK_RISK_FLAGS}
                            />

                            <ReferralHistory
                                activities={referralData.activities}
                                isExpanded={expandedSections.has('referral_history')}
                                onToggle={() => toggleSectionExpansion('referral_history')}
                                onAddComment={handleAddComment}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <ReferralChat
                referralId={referralData?.id ?? ''}
                isExpanded={isChatExpanded}
                onToggle={() => setIsChatExpanded(!isChatExpanded)}
                messages={chatMessages}
                unreadCount={floatingUnreadCount}
                userRole="broker"
                onSendQuery={handleSendQuery}
                onSyncReadStatus={syncServerReadStatusAtBottom}
            />

            <Dialog open={showProposalDialog} onOpenChange={setShowProposalDialog}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Proposal Form</DialogTitle>
                        <DialogDescription>
                            Full proposal template with submitted values.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-2">
                        {proposalBundle ? (
                            <TemplatePages
                                v2Response={proposalBundle}
                                expandedSections={expandedSections}
                                onToggle={toggleSectionExpansion}
                            />
                        ) : (
                            <div className="text-sm text-muted-foreground">
                                Proposal form data is not available for this referral.
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default BrokerReferralDetails;
