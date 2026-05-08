import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDateDDMMYYYY, formatDateTimeDDMMYYYY } from '@/shared/utils/date-format';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  User,
  MessageSquare,
  Send,
  Loader2,
  Download,
  ChevronDown,
  ChevronUp,
  History,
  Flag,
  X,
  AlertCircle,
  Plus,
  Paperclip,
  FileText,
  ClipboardCheck,
  Lock,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ReferralOriginBadge } from '@/features/referrals/components/ReferralOriginBadge';
import {
  InsurerPricingConfigResponse,
  getReferralData,
  ReferralApiResponse,
  Activity,
  ActorType,
  ReferralStatus,
  RequestItem,
  addReferralComment,
  ProposalBundleResponseV2,
  getReferralChatHistory,
  sendReferralQuery,
  ChatMessage,
  type RatingBreakdownItem,
  type PricingVersion,
  mapApiPricingVersions,
} from '@/features/quotes/api/quotes';
import { updateReferralStatus, downloadReferralPdf } from '@/features/proposals/api/referrals';
import { useToast } from '@/shared/hooks/use-toast';
import { validateChatFile, CHAT_FILE_ACCEPT, downloadChatAttachment } from '@/shared/utils/fileUtils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ReferralDecisions,
  ReferralRiskRatings,
  submitReferralReview,
  SubmitReferralReviewRequest,
  ReferralPremiumLoadingTypes,
} from '@/features/quotes/api/quotes';
import { ProjectBreakdownWithRiskLevels } from '@/components/ProjectBreakdownWithRiskLevels';
import { PremiumCalculationSummaryContent } from '@/features/quotes/components/QuotesComparison/PremiumCalculationSummaryContent';
import { SelectedRisksPanel } from '@/components/SelectedRisksPanel';
import type { SelectedRiskDetail } from '@/types/selected-risk';
import { TemplatePages } from '@/features/quotes/components/QuoteDetailsV2/TemplatePages';
import { RatingBreakdownDialog } from '@/features/referrals/components/RatingBreakdownDialog';

// Status options mapping
const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
    { value: 'open', label: 'Open' },
    { value: 'in_review', label: 'In Review' },
    { value: 'query_raised', label: 'Query Raised' },
    { value: 'approved', label: 'Approved' },
    { value: 'approved_with_conditions', label: 'Approved with Conditions' },
    { value: 'declined', label: 'Declined' },
    { value: 'closed', label: 'Closed' },
];

const getStatusLabel = (status: string) => {
    return STATUS_OPTIONS.find(o => o.value === status)?.label || status;
};

type RiskRating = (typeof ReferralRiskRatings)[keyof typeof ReferralRiskRatings];
type Decision = (typeof ReferralDecisions)[keyof typeof ReferralDecisions];
type PremiumLoadingType =
  (typeof ReferralPremiumLoadingTypes)[keyof typeof ReferralPremiumLoadingTypes];

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value === 'string') {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

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
    typeof mergedTemplate.name === 'string'
      ? mergedTemplate.name
      : referral.productName || 'Proposal Form';
  const templatePages = Array.isArray(mergedTemplate.pages) ? mergedTemplate.pages : [];
  const templateProductId =
    typeof mergedTemplate.productId === 'string'
      ? mergedTemplate.productId
      : formResponse.productId;
  const templateId =
    typeof mergedTemplate.id === 'string'
      ? mergedTemplate.id
      : typeof mergedTemplate.templateId === 'string'
        ? mergedTemplate.templateId
        : formResponse.templateId;
  const currency =
    typeof mergedTemplate.currency === 'string'
      ? mergedTemplate.currency
      : referral.currency || undefined;

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

const ReferralDetails = ({ fullWidth, hideHeader }: { fullWidth?: boolean; hideHeader?: boolean }) => {
  const { referralId } = useParams<{ referralId?: string }>();
  const [searchParams] = useSearchParams();
  const quoteId = searchParams.get('quoteId') || undefined;
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [referralData, setReferralData] = useState<ReferralApiResponse | null | any>(null);
  const [proposalBundle, setProposalBundle] = useState<ProposalBundleResponseV2 | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set([
      'uw_referral',
      'referral_header',
      'referral_trigger',
      'proposal_form',
      'referral_history',
      'quote_summary',
      'pricing_snapshot',
      'quote_summary_right',
      'pricing_snapshot_right',
      'customer_info',
    ]),
  ); // referral_history is now in the default set, so it's open by default

  // Comment states for referral history
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [newComment, setNewComment] = useState('');

  // Underwriter review states
  const [underwriterNotes, setUnderwriterNotes] = useState('');
  const [riskRating, setRiskRating] = useState<RiskRating>(ReferralRiskRatings.MEDIUM);
  const [decision, setDecision] = useState<Decision>(ReferralDecisions.APPROVE_AS_IS);

  // Download and status mutation states
  const [isDownloading, setIsDownloading] = useState(false);

  // Status mutation
  const statusMutation = useMutation({
    mutationFn: (status: string) => updateReferralStatus(referralId!, { status }),
    onSuccess: (_, newStatus) => {
      // Update local state immediately
      setReferralData((prev: any) => prev ? { ...prev, status: newStatus } : null);
      // Update query cache
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

  // Download PDF handler
  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      const blob = await downloadReferralPdf(referralData.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const safeProduct = String(referralData.productName || 'Referral')
        .replace(/[^a-zA-Z0-9 _-]/g, '')
        .trim()
        .replace(/\s+/g, '_');
      link.download = `${safeProduct}_${referralData.referralId}.pdf`;
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

  // Conditional approval states
  const [premiumLoading, setPremiumLoading] = useState('');
  const [premiumLoadingType, setPremiumLoadingType] = useState<PremiumLoadingType>(
    ReferralPremiumLoadingTypes.PERCENTAGE,
  );
  const [revisedDeductible, setRevisedDeductible] = useState('');
  const [coverageExclusions, setCoverageExclusions] = useState<string[]>([]);
  const [specialConditions, setSpecialConditions] = useState('');
  const [validityPeriod, setValidityPeriod] = useState('');
  const [reReferralRequired, setReReferralRequired] = useState(false);

  // Query states
  const [newQueryDescription, setNewQueryDescription] = useState('');
  const [newQueryAttachments, setNewQueryAttachments] = useState<File[]>([]);
  const [querySubmitting, setQuerySubmitting] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [totalQueries, setTotalQueries] = useState(0);
  const [chatHistoryLoaded, setChatHistoryLoaded] = useState(false);
  const [initialListUnreadCount, setInitialListUnreadCount] = useState(0);


  // Chat widget state - lazy init from URL so ?openMessage=true auto-opens the panel
  const [isChatExpanded, setIsChatExpanded] = useState<boolean>(
    () => searchParams.get('openMessage') === 'true',
  );

  useEffect(() => {
    // Cleanup the openMessage parameter from URL to prevent it showing up on refresh
    if (searchParams.get('openMessage') === 'true') {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('openMessage');
      const newSearch = newParams.toString();
      navigate({ search: newSearch }, { replace: true });
    }
  }, [searchParams, navigate]);

  const [isReadOnly, setIsReadOnly] = useState(false);
  const [showRatingBreakdownDialog, setShowRatingBreakdownDialog] = useState(false);
  const [showProposalDialog, setShowProposalDialog] = useState(false);
  const [pricingVersions, setPricingVersions] = useState<PricingVersion[]>([]);
  const [locallyReadMessageIds, setLocallyReadMessageIds] = useState<Set<string>>(new Set());
  const queryAttachmentInputRef = useRef<HTMLInputElement | null>(null);
  const chatScrollAreaRef = useRef<HTMLDivElement | null>(null);
  const chatReadSyncingRef = useRef(false);
  const chatMarkVisibleRef = useRef<() => void>(() => { });
  const chatSyncReadAtBottomRef = useRef<() => void | Promise<void>>(() => { });
  const chatFirstUnreadIdRef = useRef<string | null>(null);
  const chatLastTailIdRef = useRef<string | null>(null);
  const chatForceScrollToBottomRef = useRef(false);

  const getReferralUnreadFromCache = useCallback(
    (refId: string): number | null => {
      const caches = [
        queryClient.getQueriesData({ queryKey: ['insurer-referrals'] }),
        queryClient.getQueriesData({ queryKey: ['broker-referrals'] }),
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
        setLocallyReadMessageIds(new Set());

        const referral = await getReferralData(referralId!);
       const status = String(referral.status || '').toLowerCase();

const statusNormalized: ReferralStatus | string =
  status === 'responded'
    ? 'Responded'
    : status === 'closed'
    ? 'Closed'
    : STATUS_OPTIONS.find(
        (item) => item.value.toLowerCase() === status
      )?.label || referral.status;
        setReferralData({ ...referral, status: statusNormalized });
        const unreadFromCache = getReferralUnreadFromCache(referral.id);
        const unreadFromDetail = Number(
          (referral as unknown as { unreadMessageCount?: number }).unreadMessageCount || 0,
        );
        setInitialListUnreadCount(unreadFromCache ?? unreadFromDetail);

        // Seed pricing versions from API response
        if (Array.isArray(referral.pricingVersions) && referral.pricingVersions.length > 0) {
          const ratingBreakdown = (referral.triggerDetails?.ratingBreakdown as any[]) ?? [];
          setPricingVersions(mapApiPricingVersions(referral.pricingVersions, ratingBreakdown));
        }
        const referralProposalBundle =
          referral.proposalBundle ?? buildProposalBundleFromFormResponseData(referral);
        setProposalBundle(referralProposalBundle);
        if (referralProposalBundle) {
          setExpandedSections((prev) => {
            const next = new Set(prev);
            next.add('proposal_form');
            (referralProposalBundle.template?.pages ?? []).forEach((page) => {
              next.add(`page_${page.id}`);
            });
            return next;
          });
        }

        // Populate review data if available
        if (referral.referralReview) {
          setUnderwriterNotes(referral.referralReview.comments || '');
          setRiskRating(referral.referralReview.riskRating as RiskRating);
          setDecision(referral.referralReview.decision as Decision);

          if (referral.referralReview.modificationDetails) {
            const details = referral.referralReview.modificationDetails;

            if (referral.referralReview.decision === ReferralDecisions.APPLY_PREMIUM_LOADING) {
              setPremiumLoadingType(details.premiumLoadingType as PremiumLoadingType);
              setPremiumLoading(details.premiumLoadingValue);
            } else if (
              referral.referralReview.decision === ReferralDecisions.APPLY_DEDUCTIBLE_CHANGE
            ) {
              setRevisedDeductible(details.revisedDeductible);
            } else if (
              referral.referralReview.decision === ReferralDecisions.APPLY_COVERAGE_EXCLUSION
            ) {
              setCoverageExclusions(details.coverageExclusions || []);
            } else if (
              referral.referralReview.decision === ReferralDecisions.APPROVE_WITH_CONDITIONS
            ) {
              setSpecialConditions(details.specialConditions);
              setValidityPeriod(details.validityPeriod);
              setReReferralRequired(details.reReferralRequired);
            }
          }

          setIsReadOnly(true);
        }

        // Load proposal bundle
        // if (referral.quoteId) {
        //   const proposalData = await getProposalBundle(parseInt(referral.quoteId));
        //   console.log(proposalData);
        //   setProposalBundle(proposalData);

        //   // Load product bundle
        //   if (proposalData?.quote_meta?.insurer_id) {
        //     const productData = await getInsurerPricingConfig(proposalData.quote_meta.insurer_id);
        //     setProductBundle(productData);
        //   }
        // }
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
  }, [referralId, quoteId, getReferralUnreadFromCache]);

  useEffect(() => {
    if (!isChatExpanded || !referralData?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const chatRes = await getReferralChatHistory(referralData.id, 'true');
        if (!cancelled) {
          setChatMessages(chatRes.data ?? []);
          setTotalQueries(chatRes.meta.totalQuery ?? 0);
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

  const toggleSectionExpansion = (sectionKey: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionKey)) {
        newSet.delete(sectionKey);
      } else {
        newSet.add(sectionKey);
      }
      return newSet;
    });
  };

  const handleQueryFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const acceptedFiles: File[] = [];
    Array.from(files).forEach((file) => {
      const result = validateChatFile(file);
      if (result.valid) {
        acceptedFiles.push(file);
      } else {
        toast({
          title: 'File rejected',
          description: result.error,
          variant: 'destructive',
        });
      }
    });
    if (acceptedFiles.length > 0) {
      setNewQueryAttachments((prev) => [...prev, ...acceptedFiles]);
    }
    event.target.value = '';
  };

  const removeQueryAttachment = (indexToRemove: number) => {
    setNewQueryAttachments((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSendQuery = async () => {
    if (!referralData?.id) return;
    if (!newQueryDescription.trim() && newQueryAttachments.length === 0) {
      toast({
        title: 'Message or Document Required',
        description: 'Please enter a query message or attach a document.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setQuerySubmitting(true);
      await sendReferralQuery(referralData.id, {
        message: newQueryDescription.trim(),
        dueDate: new Date().toISOString().split('T')[0],
        files: newQueryAttachments,
      });

      const chatRes = await getReferralChatHistory(referralData.id, 'true');
      chatForceScrollToBottomRef.current = true;
      setChatMessages(chatRes.data ?? []);
      setTotalQueries(chatRes.meta.totalQuery ?? 0);
      setChatHistoryLoaded(true);
      setNewQueryDescription('');
      setNewQueryAttachments([]);
      if (queryAttachmentInputRef.current) {
        queryAttachmentInputRef.current.value = '';
      }
      toast({
        title: 'Query Sent',
        description: `Your query has been sent successfully${newQueryAttachments.length > 0 ? ` with ${newQueryAttachments.length} attachment(s)` : ''}.`,
      });
    } catch (error) {
      console.error('Failed to send query:', error);
      toast({
        title: 'Error',
        description: 'Failed to send query. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setQuerySubmitting(false);
    }
  };

  const currentViewerRole = 'insurer' as const;
  const unreadIncomingMessageIds = useMemo(
    () =>
      chatMessages
        .filter((msg) => {
          if (msg.senderRole === currentViewerRole) return false;
          const readAt = msg.insurerReadAt;
          return !readAt;
        })
        .map((msg) => msg.id)
        .filter((id) => !locallyReadMessageIds.has(id)),
    [chatMessages, currentViewerRole, locallyReadMessageIds],
  );
  const unreadIncomingCount = unreadIncomingMessageIds.length;
  const firstUnreadIncomingMessageId = unreadIncomingMessageIds[0] ?? null;
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
      queryClient.setQueriesData({ queryKey: ['insurer-referrals'] }, applyPatch);
      queryClient.setQueriesData({ queryKey: ['broker-referrals'] }, applyPatch);
    },
    [queryClient, referralData?.id],
  );

  const markVisibleUnreadAsRead = useCallback(() => {
    if (unreadIncomingMessageIds.length === 0) return;
    setLocallyReadMessageIds((prev) => {
      const next = new Set(prev);
      unreadIncomingMessageIds.forEach((id) => next.add(id));
      return next;
    });
  }, [unreadIncomingMessageIds]);

  const countUnreadForRole = useCallback(
    (messages: ChatMessage[]) =>
      messages.filter((msg) => {
        if (msg.senderRole === currentViewerRole) return false;
        const readAt = msg.insurerReadAt;
        return !readAt;
      }).length,
    [currentViewerRole],
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

  chatMarkVisibleRef.current = markVisibleUnreadAsRead;
  chatSyncReadAtBottomRef.current = syncServerReadStatusAtBottom;
  chatFirstUnreadIdRef.current = firstUnreadIncomingMessageId;

  const getReferralDetailsChatViewport = (): HTMLDivElement | null => {
    const root = chatScrollAreaRef.current;
    if (!root) return null;
    return root.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement | null;
  };

  useEffect(() => {
    if (!chatHistoryLoaded || !referralData?.id) return;
    patchReferralUnreadCountInCache(unreadIncomingCount);
  }, [chatHistoryLoaded, referralData?.id, unreadIncomingCount, patchReferralUnreadCountInCache]);

  useEffect(() => {
    if (!isChatExpanded) return;
    const viewport = getReferralDetailsChatViewport();
    if (!viewport) return;

    const onScroll = () => {
      const distanceFromBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
      if (distanceFromBottom <= 16) {
        chatMarkVisibleRef.current();
        void chatSyncReadAtBottomRef.current();
      }
    };

    viewport.addEventListener('scroll', onScroll, { passive: true });
    return () => viewport.removeEventListener('scroll', onScroll);
  }, [isChatExpanded]);

  useEffect(() => {
    if (!isChatExpanded) {
      chatLastTailIdRef.current = null;
      return;
    }
    if (chatMessages.length === 0) return;

    const viewport = getReferralDetailsChatViewport();
    if (!viewport) return;

    const lastId = chatMessages[chatMessages.length - 1]?.id ?? '';
    const prevTail = chatLastTailIdRef.current;
    const isFirstContent = prevTail === null && Boolean(lastId);
    const isNewTailMessage = Boolean(lastId && prevTail !== null && lastId !== prevTail);

    const scrollToUnreadOrBottom = () => {
      const unreadId = chatFirstUnreadIdRef.current;
      if (unreadId) {
        const firstUnreadEl = viewport.querySelector(
          `[data-chat-message-id="${unreadId}"]`,
        ) as HTMLDivElement | null;
        if (firstUnreadEl) {
          firstUnreadEl.scrollIntoView({ block: 'center', behavior: 'auto' });
          return;
        }
      }
      viewport.scrollTop = viewport.scrollHeight;
    };

    const run = () => {
      if (isFirstContent) {
        scrollToUnreadOrBottom();
        chatLastTailIdRef.current = lastId;
        return;
      }
      if (isNewTailMessage) {
        if (chatForceScrollToBottomRef.current) {
          viewport.scrollTop = viewport.scrollHeight;
          chatForceScrollToBottomRef.current = false;
          chatLastTailIdRef.current = lastId;
          return;
        }
        const distanceFromBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
        if (distanceFromBottom <= 80) {
          viewport.scrollTop = viewport.scrollHeight;
        }
        chatLastTailIdRef.current = lastId;
      }
    };

    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(run);
    });
    return () => cancelAnimationFrame(frame);
  }, [isChatExpanded, chatMessages.length, chatMessages[chatMessages.length - 1]?.id]);

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast({
        title: 'Comment Required',
        description: 'Please enter a comment',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (!referralId) {
        throw new Error('Missing referralId');
      }
      const res = await addReferralComment(referralId, { comment: newComment.trim() });
      const newActivity: Activity = {
        id: `A${Date.now()}`,
        actorType: 'user' as ActorType,
        actionType: 'comment_added',
        comment: newComment.trim(),
        createdAt: new Date().toISOString(),
      };

      if (res.message === 'Comment added successfully') {
        console.log(res);
        const updatedReferral = await getReferralData(referralId!);
        setReferralData({
          ...updatedReferral,
          activities: [...updatedReferral.activities, newActivity],
          updatedAt: new Date().toISOString(),
        });
      }

      setNewComment('');
      setShowCommentForm(false);

      toast({
        title: 'Comment Added',
        description: 'Your comment has been added to the referral history',
      });
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e?.message || 'Failed to add comment',
        variant: 'destructive',
      });
    }
  };

  const handleSubmitDecision = async () => {
    if (!decision) {
      toast({
        title: 'Decision Required',
        description: 'Please select a decision',
        variant: 'destructive',
      });
      return;
    }

    if (!underwriterNotes.trim()) {
      toast({
        title: 'Notes Required',
        description: 'Please add underwriter notes before submitting',
        variant: 'destructive',
      });
      return;
    }

    // Validation for Premium Loading
    if (decision === ReferralDecisions.APPLY_PREMIUM_LOADING) {
      if (!premiumLoading || Number(premiumLoading) <= 0) {
        toast({
          title: 'Premium Loading Required',
          description: 'Please enter a valid premium loading value',
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      const modificationDetails: Record<string, any> = {};

      if (decision === ReferralDecisions.APPLY_PREMIUM_LOADING) {
        modificationDetails['premiumLoadingType'] = premiumLoadingType;
        modificationDetails['premiumLoadingValue'] = Number(premiumLoading);
      } else if (decision === ReferralDecisions.APPLY_DEDUCTIBLE_CHANGE) {
        modificationDetails['revisedDeductible'] = revisedDeductible;
      } else if (decision === ReferralDecisions.APPLY_COVERAGE_EXCLUSION) {
        modificationDetails['coverageExclusions'] = coverageExclusions;
      } else if (decision === ReferralDecisions.APPROVE_WITH_CONDITIONS) {
        modificationDetails['specialConditions'] = specialConditions;
        modificationDetails['validityPeriod'] = validityPeriod;
        modificationDetails['reReferralRequired'] = reReferralRequired;
      }

      if (!referralId) throw new Error('Referral ID missing');

      const payload: SubmitReferralReviewRequest = {
        underwriterNotes,
        riskRating,
        decision,
        modificationDetails,
      };

      await submitReferralReview(referralId, payload);

      toast({
        title: 'Decision Submitted',
        description: `Referral decision submitted successfully`,
      });

      navigate('/insurer/dashboard');
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit decision',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: any) => {
    const statusConfig: Record<string, { className: string; icon: any }> = {
      open: { className: 'bg-primary/10 text-primary border-primary/20', icon: Clock },
      in_review: { className: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: MessageSquare },
      query_raised: { className: 'bg-orange-50 text-orange-700 border-orange-200', icon: AlertCircle },
      approved: { className: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle },
      approved_with_conditions: { className: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
      declined: { className: 'bg-red-50 text-red-700 border-red-200', icon: X },
      closed: { className: 'bg-gray-100 text-gray-600 border-gray-200', icon: CheckCircle },
      // Legacy status values
      Open: { className: 'bg-primary/10 text-primary border-primary/20', icon: Clock },
      Responded: { className: 'bg-blue-50 text-blue-700 border-blue-200', icon: MessageSquare },
      Closed: { className: 'bg-gray-100 text-gray-600 border-gray-200', icon: CheckCircle },
    };

    const config = statusConfig[status];
    const Icon = config ? config.icon : Clock;
    const cls = config ? config.className : 'bg-primary/10 text-primary border-primary/20';
    
    // Convert status to display label
    const displayLabel = getStatusLabel(status);

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cls}`}>
        <Icon className="w-3 h-3" />
        {displayLabel || '-'}
      </span>
    );
  };

  const getPriorityBadge = (priority?: any | null) => {
    const priorityConfig: Record<string, { color: string }> = {
      Low: { color: 'bg-green-100 text-green-800' },
      Medium: { color: 'bg-yellow-100 text-yellow-800' },
      High: { color: 'bg-orange-100 text-orange-800' },
      Urgent: { color: 'bg-red-100 text-red-800' },
    };

    const key = priority || '-';
    const color = priorityConfig[key]?.color || 'bg-gray-100 text-gray-600';
    return <Badge className={color}>{priority || '-'}</Badge>;
  };

  const t = (v: any) => {
    if (v === null || v === undefined) return '-';
    const s = String(v).trim();
    return s.length ? s : '-';
  };

  const titleCase = (s: string) => {
    if (!s) return '-';
    return s
      .replace(/[_-]+/g, ' ')
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading referral details...</p>
        </div>
      </div>
    );
  }

  if (!referralData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Referral not found</p>
        </div>
      </div>
    );
  }

  const hasRatingBreakdown =
    Array.isArray(
      (referralData.triggerDetails?.ratingBreakdown as RatingBreakdownItem[] | null) || undefined,
    ) &&
    (
      ((referralData.triggerDetails?.ratingBreakdown as RatingBreakdownItem[] | null) ||
        []) as RatingBreakdownItem[]
    ).length > 0;

  return (
    <>
      <div className={hideHeader ? '' : 'min-h-screen'} style={hideHeader ? {} : { backgroundColor: '#f8fafc' }}>
        <div
          className={
            hideHeader
              ? ''
              : fullWidth
                ? 'mx-auto w-full max-w-none px-4 py-8 pb-40 relative'
                : 'container mx-auto px-4 py-8 max-w-7xl pb-40 relative'
          }
        >
          <div className={hideHeader ? '' : 'rounded-lg border overflow-hidden'}>
            {!hideHeader && (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5">
                  <div className="flex items-center gap-4 flex-1">
                    <button
                      onClick={() => navigate(-1)}
                      className="text-primary hover:text-primary flex items-center justify-center p-1 h-8 w-8 shrink-0 rounded hover:bg-primary/10 transition-all"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="w-px h-6 bg-gray-200" />
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-gray-900">Underwriting Referral</h2>
                      <p className="text-sm text-gray-500 mt-1">Manage and review referral details</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-6">
                    <div className="relative w-[200px]">
                      <Select
                        value={referralData?.status || ''}
                        onValueChange={(value) => statusMutation.mutate(value)}
                        disabled={statusMutation.isPending}
                      >
                        <SelectTrigger className="w-full bg-gray-50 text-foreground border-gray-300 h-10 px-3 py-2 hover:bg-gray-100 transition-colors">
                          <div className="flex items-center justify-between w-full">
                            <span className="text-sm font-medium text-gray-900">
                              {getStatusLabel(referralData?.status || 'Select Status')}
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
            )}
            {(hideHeader || true) && (
              <>
                <div className={`bg-muted/30 px-6 space-y-4 ${hideHeader ? 'pt-4 pb-4' : 'pt-6 pb-6'}`}>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column - 2x2 Grid Layout */}
                    <div className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Customer Information - Only if data exists */}
                      {referralData.customerDetails && (
                        <Card
                          className="bg-white border border-slate-200 shadow-sm lg:col-span-2 mb-6"
                          data-section="customer_info"
                        >
                          <CardHeader
                            className="py-3 px-4 cursor-pointer border-b border-slate-200"
                            onClick={() => toggleSectionExpansion('customer_info')}
                          >
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                <User className="w-4 h-4 text-primary" />
                                Customer Information
                              </CardTitle>
                              {expandedSections.has('customer_info') ? (
                                <ChevronUp className="h-4 w-4 text-slate-500" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-slate-500" />
                              )}
                            </div>
                          </CardHeader>
                          {expandedSections.has('customer_info') && (
                            <CardContent className="p-0">
                              <div className="grid grid-cols-1 md:grid-cols-3">
                                <div className="px-4 py-3 bg-muted/30 border-r border-b border-border">
                                  <div className="text-xs text-muted-foreground mb-1">Customer Name</div>
                                  <div className="text-sm font-semibold text-foreground">{t(referralData.customerDetails.customerName)}</div>
                                </div>
                                <div className="px-4 py-3 border-r border-b border-border">
                                  <div className="text-xs text-muted-foreground mb-1">Customer Reference</div>
                                  <div className="text-sm font-semibold text-foreground">{t(referralData.customerDetails.customerRefId)}</div>
                                </div>
                                <div className="px-4 py-3 bg-muted/30 border-b border-border">
                                  <div className="text-xs text-muted-foreground mb-1">Customer Since</div>
                                  <div className="text-sm font-semibold text-foreground">
                                    {referralData.customerDetails.customerSince ? formatDateDDMMYYYY(referralData.customerDetails.customerSince) : '-'}
                                  </div>
                                </div>
                                <div className="px-4 py-3 border-r border-b border-border">
                                  <div className="text-xs text-muted-foreground mb-1">Last Transaction</div>
                                  <div className="text-sm font-semibold text-foreground">
                                    {referralData.customerDetails.lastTransactionAt ? formatDateTimeDDMMYYYY(referralData.customerDetails.lastTransactionAt) : '-'}
                                  </div>
                                </div>
                                {referralData.customerDetails.lockedFields?.map((field, idx) => {
                                  const cellIdx = 5 + idx; // 1:Name, 2:Ref, 3:Since, 4:Trans, 5:FirstLocked
                                  const isLastInRow = cellIdx % 3 === 0;
                                  return (
                                    <div key={idx} className={`px-4 py-3 border-b border-border ${!isLastInRow ? 'border-r' : ''} ${Math.floor((cellIdx - 1) / 3) % 2 === 0 ? 'bg-muted/30' : ''}`}>
                                      <div className="text-xs text-muted-foreground mb-1 flex items-center justify-between">
                                        <span>{field.keyName}</span>
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Lock className="w-4 h-4 text-primary cursor-help" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p className="text-xs">Locked Field</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      </div>
                                      <div className="text-sm font-semibold text-foreground">{t(field.value)}</div>
                                    </div>
                                  );
                                })}
                                {/* Empty cells to maintain 3-column layout grid if needed */}
                                {Array.from({ length: (3 - ((4 + (referralData.customerDetails.lockedFields?.length || 0)) % 3)) % 3 }).map((_, i) => {
                                  const totalCellsBefore = 4 + (referralData.customerDetails.lockedFields?.length || 0);
                                  const currentCellIdx = totalCellsBefore + i + 1;
                                  const isLastInRow = currentCellIdx % 3 === 0;
                                  return (
                                    <div key={`empty-${i}`} className={`px-4 py-3 hidden md:block border-b border-border ${!isLastInRow ? 'border-r' : ''} ${Math.floor((currentCellIdx - 1) / 3) % 2 === 0 ? 'bg-muted/30' : ''}`} />
                                  );
                                })}
                              </div>
                            </CardContent>
                          )}
                        </Card>
                      )}

                      {/* 1. Referral Header / Context */}
                      <Card
                        className="bg-white border border-slate-200 shadow-sm lg:col-span-2"
                        data-section="referral_header"
                      >
                        <CardHeader
                          className="py-3 px-4 cursor-pointer border-b border-slate-200"
                          onClick={() => toggleSectionExpansion('referral_header')}
                        >
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-semibold text-slate-900">
                              Referral Information
                            </CardTitle>
                            <div className="flex items-center gap-2">
                              <ReferralOriginBadge
                                triggerSourceType={referralData.triggerSourceType}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowProposalDialog(true);
                                }}
                                className="h-7 px-2.5 border-slate-300 text-xs"
                                disabled={!proposalBundle}
                              >
                                View Proposal
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowRatingBreakdownDialog(true);
                                }}
                                className="h-7 px-2.5 border-slate-300 text-xs"
                                disabled={
                                  !Array.isArray(
                                    (referralData.triggerDetails?.ratingBreakdown as
                                      | RatingBreakdownItem[]
                                      | null) || undefined,
                                  ) ||
                                  (
                                    ((referralData.triggerDetails?.ratingBreakdown as
                                      | RatingBreakdownItem[]
                                      | null) || []) as RatingBreakdownItem[]
                                  ).length === 0
                                }
                              >
                                View Rating Breakdown
                              </Button>
                              {expandedSections.has('referral_header') ? (
                                <ChevronUp className="h-4 w-4 text-slate-500" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-slate-500" />
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        {expandedSections.has('referral_header') && (
                          <CardContent className="p-0 border-t border-border">
                            <div className="grid grid-cols-3 divide-x divide-y divide-border">
                              <div className="px-4 py-3 bg-muted/30">
                                <div className="text-xs text-muted-foreground mb-1">Referral ID</div>
                                <div className="text-sm font-semibold text-foreground break-words">{t(referralData.referralId)}</div>
                              </div>
                              {/* <div className="px-4 py-3">
                              <div className="text-xs text-muted-foreground mb-1">Quote ID</div>
                              <div className="text-sm font-semibold text-foreground break-words">{t(referralData.quoteNumber)}</div>
                            </div> */}
                              <div className="px-4 py-3 bg-muted/30">
                                <div className="text-xs text-muted-foreground mb-1">Product</div>
                                <div className="text-sm font-semibold text-foreground break-words">{t(referralData.productName)}</div>
                              </div>
                              <div className="px-4 py-3">
                                <div className="text-xs text-muted-foreground mb-1">Insurer</div>
                                <div className="text-sm font-semibold text-foreground break-words">{t(referralData.insurerName)}</div>
                              </div>
                              <div className="px-4 py-3 bg-muted/30">
                                <div className="text-xs text-muted-foreground mb-1">Distributor</div>
                                <div className="text-sm font-semibold text-foreground break-words">{t(referralData.brokerName)}</div>
                              </div>
                              <div className="px-4 py-3">
                                <div className="text-xs text-muted-foreground mb-1">Status</div>
                                <div className="text-sm">{getStatusBadge(referralData.status)}</div>
                              </div>
                              <div className="px-4 py-3 bg-muted/30">
                                <div className="text-xs text-muted-foreground mb-1">Priority</div>
                                <div className="text-sm">{getPriorityBadge(referralData.priority)}</div>
                              </div>
                              <div className="px-4 py-3">
                                <div className="text-xs text-muted-foreground mb-1">Created Date</div>
                                <div className="text-sm font-semibold text-foreground break-words">{referralData.referredAt ? formatDateTimeDDMMYYYY(referralData.referredAt) : '-'}</div>
                              </div>
                              <div className="px-4 py-3 bg-muted/30">
                                <div className="text-xs text-muted-foreground mb-1">Last Updated</div>
                                <div className="text-sm font-semibold text-foreground break-words">{referralData.updatedAt ? formatDateTimeDDMMYYYY(referralData.updatedAt) : '-'}</div>
                              </div>
                              <div className="px-4 py-3"></div>
                            </div>
                          </CardContent>
                        )}
                      </Card>

                      {/* 2. Referral Trigger Summary */}
                      <Card
                        className="bg-white border border-blue-200 lg:col-span-2"
                        data-section="referral_trigger"
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                              <Flag className="h-4 w-4" />
                              Referral Trigger
                            </CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="p-0 border-t border-border">
                          {/* Top summary row */}
                          <div className="grid grid-cols-4 divide-x divide-border border-b border-border">
                            <div className="px-4 py-3 bg-muted/30">
                              <div className="text-xs text-muted-foreground mb-1">Referral Source</div>
                              <div className="text-sm font-medium">
                                <Badge variant="outline">
                                  {referralData.triggerSourceType
                                    ? titleCase(String(referralData.triggerSourceType).replace(/_/g, ' '))
                                    : '-'}
                                </Badge>
                              </div>
                            </div>
                            <div className="px-4 py-3">
                              <div className="text-xs text-muted-foreground mb-1">System Recommendation</div>
                              <div className="text-sm font-medium">{referralData.reason || '-'}</div>
                            </div>
                            <div className="px-4 py-3 bg-muted/30">
                              <div className="text-xs text-muted-foreground mb-1">Manual Referral Reason</div>
                              <div className="text-sm font-medium">-</div>
                            </div>
                            <div className="px-4 py-3">
                              <div className="text-xs text-muted-foreground mb-1">Trigger Source Type</div>
                              <div className="text-sm font-medium">{referralData.triggerSourceType ? titleCase(String(referralData.triggerSourceType).replace(/_/g, ' ')) : '-'}</div>
                            </div>
                          </div>

                          {/* Triggered Rules table */}
                          {Array.isArray(referralData.triggerDetails?.rules) &&
                            referralData.triggerDetails!.rules!.length > 0 && (
                              <div className="mt-4 mx-4 mb-4 rounded-lg border border-border overflow-hidden">
                                <div className="px-4 py-3 bg-muted/30 border-b border-border">
                                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Triggered Rules
                                  </div>
                                </div>
                                <div className="w-full overflow-x-auto">
                                  <table className="w-full text-sm border-collapse">
                                    <colgroup>
                                      <col style={{ width: '4%' }} />
                                      <col style={{ width: '20%' }} />
                                      <col style={{ width: '10%' }} />
                                      <col style={{ width: '20%' }} />
                                      <col style={{ width: '10%' }} />
                                      <col style={{ width: '18%' }} />
                                      <col style={{ width: '18%' }} />
                                    </colgroup>
                                    <thead>
                                      <tr className="bg-muted/30 border-b border-border">
                                        <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">#</th>
                                        <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rule Name</th>
                                        <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rule Type</th>
                                        <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Threshold Breached</th>
                                        <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Action</th>
                                        <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recommendation</th>
                                        <th className="text-center px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                      {referralData.triggerDetails!.rules!.map((rule, idx) => (
                                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-muted/30'}>
                                          <td className="px-3 py-2 text-xs text-gray-400 font-medium align-middle">{idx + 1}</td>
                                          <td className="px-3 py-2 text-sm font-medium text-gray-900 align-middle">{rule.ruleName || rule.formFieldLabel || rule.name || <span className="text-gray-300 text-center w-full inline-block">—</span>}</td>
                                          <td className="px-3 py-2 align-middle">
                                            <Badge variant={rule.ruleSeverity === 'Hard' || rule.quoteAction === 'NO_QUOTE' ? 'destructive' : 'secondary'}>
                                              {rule.ruleSeverity || (rule.quoteAction === 'NO_QUOTE' ? 'Hard' : 'Soft')}
                                            </Badge>
                                          </td>
                                          <td className="px-3 py-2 text-sm text-gray-700 align-middle">{rule.thresholdBreached || rule.conditions || (rule.rangeStart !== undefined ? `> ${rule.rangeStart}` : <span className="text-gray-300 text-center w-full inline-block">—</span>)}</td>
                                          <td className="px-3 py-2 text-sm text-gray-700 align-middle">{rule.quoteAction ? titleCase(String(rule.quoteAction)) : <span className="text-gray-300 text-center w-full inline-block">—</span>}</td>
                                          <td className="px-3 py-2 text-sm text-gray-700 align-middle">{rule.recommendation || <span className="text-gray-300 text-center w-full inline-block">—</span>}</td>
                                          <td className="px-3 py-2 text-sm text-gray-600 align-middle text-center">{rule.description || <span className="text-gray-300">—</span>}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                          {/* Selected Risks */}
                          {(() => {
                            const raw = (referralData.triggerDetails as Record<string, unknown> | null)?.risks;
                            if (!Array.isArray(raw) || raw.length === 0) return null;
                            const items: SelectedRiskDetail[] = [];
                            for (const r of raw) {
                              if (!r || typeof r !== 'object') continue;
                              const obj = r as Record<string, unknown>;
                              const coverId = typeof obj.coverId === 'string' ? obj.coverId : null;
                              const coverTitle = typeof obj.coverTitle === 'string' ? obj.coverTitle : null;
                              const riskCategoryId = typeof obj.riskCategoryId === 'string' ? obj.riskCategoryId : null;
                              const riskCategoryTitle = typeof obj.riskCategoryTitle === 'string' ? obj.riskCategoryTitle : null;
                              const riskLevelId = typeof obj.riskLevelId === 'string' ? obj.riskLevelId : null;
                              const riskLevelLabel = typeof obj.riskLevelLabel === 'string' ? obj.riskLevelLabel : null;
                              const quoteAction = typeof obj.quoteAction === 'string' ? obj.quoteAction : null;
                              const adjustmentType = typeof obj.adjustmentType === 'string' ? obj.adjustmentType : null;
                              const adjustmentValue = typeof obj.adjustmentValue === 'number' ? obj.adjustmentValue : null;
                              const riskLevelIndex = typeof obj.riskLevelIndex === 'number' ? obj.riskLevelIndex : null;
                              const riskLevelCount = typeof obj.riskLevelCount === 'number' ? obj.riskLevelCount : null;
                              const unitId = typeof obj.unitId === 'string' ? obj.unitId : null;
                              if (!coverId || !riskCategoryId || !riskLevelId) continue;
                              items.push({ coverId, coverTitle, riskCategoryId, riskCategoryTitle, riskLevelId, riskLevelLabel, quoteAction, adjustmentType, adjustmentValue, riskLevelIndex, riskLevelCount, unitId });
                            }
                            if (items.length === 0) return null;
                            return (
                              <div className="mx-4 mb-4 mt-4 border-t border-border pt-4">
                                <SelectedRisksPanel items={items} />
                              </div>
                            );
                          })()}
                        </CardContent>
                      </Card>

                      {/* 3. Product Breakdown — pricingBreakdown (granular) only */}
                      {referralData.pricingBreakdown && (
                        <div className="lg:col-span-2">
                          <Card className="bg-white border border-gray-200 shadow-sm">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base font-semibold flex items-center gap-2">
                                Product Breakdown
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <PremiumCalculationSummaryContent
                                premium={referralData.pricingBreakdown as any}
                                currency={referralData.currency ?? 'AED'}
                                showPremiumSummaryFormulas={false}
                                productSections={[]}
                                showCheckboxes={false}
                              />
                            </CardContent>
                          </Card>
                        </div>
                      )}
                      {/* projectBreakdown hidden — use pricingBreakdown instead
                      {referralData.projectBreakdown && referralData.projectBreakdown.length > 0 && (
                        <div className="lg:col-span-2">
                          <ProjectBreakdownWithRiskLevels
                            projectBreakdown={referralData.projectBreakdown}
                            totalSumInsured={toNumber(referralData.totalSumInsured)}
                            finalPremium={toNumber(referralData.finalPremium)}
                          />
                        </div>
                      )}
                      */}

                      {/* 4. Referral History & Timeline - Vertical List */}
                      <Card
                        className="bg-white border border-gray-200 shadow-sm lg:col-span-2"
                        data-section="referral_history"
                      >
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <History className="h-5 w-5 text-primary" />
                                Referral History & Timeline
                              </CardTitle>
                              <CardDescription>
                                Click on any item to view detailed information
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setShowCommentForm(!showCommentForm);
                                }}
                                className="flex items-center gap-2"
                              >
                                <MessageSquare className="h-4 w-4" />
                                Add Comment
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0 pb-6">
                          {/* Add Comment Form */}
                          {showCommentForm && (
                            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                              <Label className="text-sm font-medium mb-2 block">Add Comment</Label>
                              <Textarea
                                placeholder="Enter your comment..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                rows={3}
                                className="resize-none mb-3"
                              />
                              <div className="flex items-center gap-2 justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setShowCommentForm(false);
                                    setNewComment('');
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={handleAddComment}
                                  disabled={!newComment.trim()}
                                >
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  Add Comment
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Activities Table */}
                           <div className="w-full overflow-x-auto rounded-lg border border-gray-200">
                            <table className="w-full text-sm border-collapse">
                              <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 w-10">#</th>
                                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Action</th>
                                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Actor Type</th>
                                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Date & Time</th>
                                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 w-[40%]">Comment / Details</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {referralData.activities.map((activity, idx) => {
                                  const isSystem = String(activity.actorType).toLowerCase() === 'system';
                                  const actionLabel = titleCase(activity.actionType);
                                  const getActionBadgeClass = () => {
                                    return 'bg-primary/10 text-primary border-primary/20';
                                  };
                                  return (
                                    <tr
                                      key={activity.id}
                                      className={`hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}
                                    >
                                      <td className="px-4 py-3 text-xs text-gray-400 font-medium">{idx + 1}</td>
                                      <td className="px-4 py-3">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getActionBadgeClass()}`}>
                                          {actionLabel === 'Comment Added' && <MessageSquare className="w-3 h-3" />}
                                          {actionLabel === 'Query Raised' && <Send className="w-3 h-3" />}
                                          {actionLabel === 'Assigned' && <User className="w-3 h-3" />}
                                          {actionLabel === 'Referral Created' && <Flag className="w-3 h-3" />}
                                          {!['Comment Added', 'Query Raised', 'Assigned', 'Referral Created'].includes(actionLabel) && <CheckCircle className="w-3 h-3" />}
                                          {actionLabel}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3">
                                        <Badge
                                          variant="outline"
                                          className={`text-xs ${isSystem ? 'border-primary/30 text-primary bg-primary/5' : ''}`}
                                        >
                                          {titleCase(activity.actorType)}
                                        </Badge>
                                      </td>
                                      <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                                        {activity.createdAt
                                          ? new Date(activity.createdAt).toLocaleString()
                                          : '-'}
                                      </td>
                                      <td className="px-4 py-3 text-xs text-gray-700">
                                        {activity.comment ? (
                                          <div className="line-clamp-2 hover:line-clamp-none transition-all duration-300">
                                            {activity.comment}
                                          </div>
                                        ) : (
                                          <span className="text-gray-300 text-center w-full inline-block">&mdash;</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                            {referralData.activities.length === 0 && (
                              <div className="text-center py-8 text-sm text-gray-400">No activity recorded yet.</div>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      {/* 4. Underwriter Review - moved to footer below */}
                    </div>
                  </div>
                </div>

              </>
            )}
          </div>

          {/* Underwriter Review Footer - sticky at bottom of viewport */}
          {!hideHeader && expandedSections.has('uw_referral') && referralData && (
            <div
              className="fixed bottom-0 right-0 z-30 border-t border-primary/15 bg-[hsl(180,45%,96%)] shadow-[0_-2px_8px_rgba(0,0,0,0.06)]"
              style={{ left: 'var(--sidebar-width, 16rem)' }}
            >
              {/* Modification details row - shown above main row when needed */}
              {(decision === ReferralDecisions.APPROVE_WITH_CONDITIONS ||
                decision === ReferralDecisions.APPLY_PREMIUM_LOADING ||
                decision === ReferralDecisions.APPLY_DEDUCTIBLE_CHANGE ||
                decision === ReferralDecisions.APPLY_COVERAGE_EXCLUSION) && (
                  <div className="border-b border-primary/20 px-6 py-2 flex items-center gap-4 flex-wrap">
                    <span className="text-xs font-semibold uppercase tracking-wide text-primary/60 shrink-0">Modification Details</span>
                    {decision === ReferralDecisions.APPLY_PREMIUM_LOADING && (
                      <div className="flex items-center gap-2">
                        <Select value={premiumLoadingType} onValueChange={(value) => setPremiumLoadingType(value as PremiumLoadingType)} disabled={isReadOnly}>
                          <SelectTrigger className="w-32 h-7 text-xs bg-white border-primary/40 shadow-sm text-foreground"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value={ReferralPremiumLoadingTypes.PERCENTAGE}>Percentage (%)</SelectItem>
                            <SelectItem value={ReferralPremiumLoadingTypes.AMOUNT}>Amount (AED)</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input type="number" placeholder={premiumLoadingType === ReferralPremiumLoadingTypes.PERCENTAGE ? 'Enter %' : 'Enter amount'} value={premiumLoading} onChange={(e) => setPremiumLoading(e.target.value)} className="h-7 w-32 text-xs bg-white border-primary/40 shadow-sm text-foreground placeholder:text-muted-foreground" disabled={isReadOnly} />
                      </div>
                    )}
                    {decision === ReferralDecisions.APPLY_DEDUCTIBLE_CHANGE && (
                      <Input type="text" placeholder="Revised deductible" value={revisedDeductible} onChange={(e) => setRevisedDeductible(e.target.value)} className="h-7 w-48 text-xs bg-white border-primary/40 shadow-sm text-foreground placeholder:text-muted-foreground" disabled={isReadOnly} />
                    )}
                    {decision === ReferralDecisions.APPLY_COVERAGE_EXCLUSION && (
                      <Input type="text" placeholder="Coverage exclusions (comma separated)" value={coverageExclusions.join(', ')} onChange={(e) => setCoverageExclusions(e.target.value.split(',').map((s) => s.trim()))} className="h-7 w-72 text-xs bg-white border-primary/40 shadow-sm text-foreground placeholder:text-muted-foreground" disabled={isReadOnly} />
                    )}
                    {decision === ReferralDecisions.APPROVE_WITH_CONDITIONS && (
                      <div className="flex items-center gap-3">
                        <Input type="text" placeholder="Special conditions" value={specialConditions} onChange={(e) => setSpecialConditions(e.target.value)} className="h-7 w-56 text-xs bg-white border-primary/40 shadow-sm text-foreground placeholder:text-muted-foreground" disabled={isReadOnly} />
                        <Input type="text" placeholder="Validity (e.g. 30 days)" value={validityPeriod} onChange={(e) => setValidityPeriod(e.target.value)} className="h-7 w-40 text-xs bg-white border-primary/40 shadow-sm text-foreground placeholder:text-muted-foreground" disabled={isReadOnly} />
                        <label className="flex items-center gap-1.5 text-xs text-primary/80 cursor-pointer">
                          <input type="checkbox" checked={reReferralRequired} onChange={(e) => setReReferralRequired(e.target.checked)} className="h-3.5 w-3.5" disabled={isReadOnly} />
                          Re-referral Required
                        </label>
                      </div>
                    )}
                  </div>
                )}

              {/* Main row */}
              <div className="px-6 py-3 flex items-center gap-3 overflow-hidden">
                {/* Title */}
                <div className="shrink-0 w-36">
                  <div className="text-sm font-semibold text-primary leading-tight">Underwriter Review</div>
                  <div className="text-xs text-muted-foreground">Make your decision</div>
                </div>

                <div className="w-px h-8 bg-primary/20 shrink-0" />

                {/* Notes — click to expand into popover */}
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="flex-1 min-w-0 cursor-text">
                      <Input
                        id="underwriter-notes-review"
                        placeholder="Enter your assessment notes..."
                        value={underwriterNotes}
                        readOnly
                        className="h-8 bg-white border-primary/40 shadow-sm text-foreground placeholder:text-muted-foreground text-xs cursor-text"
                        disabled={isReadOnly}
                      />
                    </div>
                  </PopoverTrigger>
                  {!isReadOnly && (
                    <PopoverContent side="top" align="start" className="w-[--radix-popover-trigger-width] p-3 shadow-lg">
                      <div className="text-xs font-semibold text-primary mb-2">Underwriter Notes</div>
                      <Textarea
                        placeholder="Enter your assessment notes..."
                        value={underwriterNotes}
                        onChange={(e) => setUnderwriterNotes(e.target.value)}
                        rows={5}
                        className="resize-none text-sm bg-white border-primary/40 focus-visible:ring-primary/40"
                        autoFocus
                      />
                      <div className="text-xs text-muted-foreground mt-1.5 text-right">{underwriterNotes.length} chars</div>
                    </PopoverContent>
                  )}
                </Popover>

                <div className="w-px h-8 bg-primary/20 shrink-0" />

                {/* Risk Rating */}
                <Select value={riskRating} onValueChange={(value) => setRiskRating(value as RiskRating)} disabled={isReadOnly}>
                  <SelectTrigger id="risk-rating-review" className="h-8 w-36 bg-white border-primary/40 shadow-sm text-foreground text-xs shrink-0">
                    <SelectValue placeholder="Risk Rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ReferralRiskRatings.LOW}>Low</SelectItem>
                    <SelectItem value={ReferralRiskRatings.MEDIUM}>Medium</SelectItem>
                    <SelectItem value={ReferralRiskRatings.HIGH}>High</SelectItem>
                  </SelectContent>
                </Select>

                {/* Decision */}
                <Select value={decision} onValueChange={(value) => setDecision(value as any)} disabled={isReadOnly}>
                  <SelectTrigger id="decision-review" className="h-8 w-44 bg-white border-primary/40 shadow-sm text-foreground text-xs shrink-0">
                    <SelectValue placeholder="Select Decision" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ReferralDecisions.APPROVE_AS_IS}>Approve as Is</SelectItem>
                    <SelectItem value={ReferralDecisions.APPLY_PREMIUM_LOADING}>Apply Premium Loading</SelectItem>
                    <SelectItem value={ReferralDecisions.DECLINE_QUOTE}>Decline Quote</SelectItem>
                  </SelectContent>
                </Select>

                {/* Submit / Status */}
                {isReadOnly ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-300 shrink-0">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Decision Submitted
                  </span>
                ) : (
                  <Button
                    onClick={handleSubmitDecision}
                    disabled={!decision || !underwriterNotes.trim()}
                    className="h-8 px-5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs shrink-0"
                  >
                    Submit Decision
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Minimized Chat Widget - Bottom Right */}
          {!isChatExpanded && (
            <div
              className="fixed bottom-20 right-6 z-50 group cursor-pointer"
              onClick={() => setIsChatExpanded(true)}
            >
              <Button className="relative pointer-events-none h-14 w-14 group-hover:w-56 rounded-full shadow-[0_4px_14px_0_rgba(0,0,0,0.2)] bg-primary group-hover:bg-primary/95 text-primary-foreground border-0 transition-width duration-300 ease-out overflow-hidden p-0 flex items-center">
                {/* Icon Wrapper - Perfectly centered in the initial 56px circle */}
                <div className="absolute left-0 top-0 w-14 h-14 flex items-center justify-center shrink-0 z-20">
                  <MessageSquare className="h-6 w-6" />
                </div>
                {/* Text - Revealed on hover with enough space */}
                <span className="pl-14 font-bold text-[15px] max-w-0 opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 group-hover:pr-5 transition-all duration-300 ease-out whitespace-nowrap overflow-hidden">
                  Referral Chat
                </span>
              </Button>
              {floatingUnreadCount > 0 && (
                <Badge className="absolute min-w-[20px] -top-1 -right-1 h-5 flex items-center justify-center p-0 px-1 text-[11px] bg-red-500 text-white border-0 z-10 transition-all pointer-events-none">
                  {floatingUnreadCount}
                </Badge>
              )}
            </div>
          )}

          {/* Expanded Chat Widget - Modal-like */}
          {isChatExpanded && (
            <div className="fixed bottom-6 right-6 z-50 w-[400px] h-[700px] flex flex-col shadow-2xl rounded-lg overflow-hidden bg-white border border-gray-200">
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <h3 className="text-base font-semibold">Queries & Communication</h3>
                  {unreadIncomingCount > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {unreadIncomingCount} {unreadIncomingCount === 1 ? 'Unread' : 'Unread'}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setIsChatExpanded(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Chat Messages Area - Scrollable */}
              <div
                className="flex-1 flex flex-col p-0 overflow-hidden relative"
                style={{
                  backgroundImage: `radial-gradient(circle, rgba(0,0,0,0.08) 1.5px, transparent 1.5px)`,
                  backgroundSize: '24px 24px',
                  backgroundColor: '#f9fafb',
                }}
              >
                <ScrollArea ref={chatScrollAreaRef} className="flex-1 px-4 py-4">
                  {chatMessages.length > 0 ? (
                    <div className="space-y-4">
                      {chatMessages.map((msg) => (
                        <div key={msg.id} className="space-y-2">
                          {firstUnreadIncomingMessageId === msg.id && (
                            <div className="flex items-center gap-2 py-1">
                              <div className="h-px bg-red-200 flex-1" />
                              <span className="text-[11px] font-medium text-red-600 whitespace-nowrap px-2 py-0.5 rounded-full bg-red-50 border border-red-200">
                                New messages
                              </span>
                              <div className="h-px bg-red-200 flex-1" />
                            </div>
                          )}
                          <div
                            data-chat-message-id={msg.id}
                            className={`flex ${msg.senderRole === 'insurer' ? 'justify-end' : 'justify-start'
                              }`}
                          >
                            <div className="max-w-[80%]">
                              <div
                                className={`rounded-lg px-4 py-3 shadow-md border ${msg.senderRole === 'insurer'
                                    ? 'bg-primary text-primary-foreground border-transparent'
                                    : 'bg-white text-gray-900 border-gray-200'
                                  }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <User
                                      className={`w-3 h-3 ${msg.senderRole === 'insurer'
                                          ? 'text-white'
                                          : 'text-gray-600'
                                        }`}
                                    />
                                    <span
                                      className={`text-xs font-medium ${msg.senderRole === 'insurer'
                                          ? 'text-white'
                                          : 'text-gray-700'
                                        }`}
                                    >
                                      {msg.senderRole === 'insurer' ? 'You' : 'Broker'}
                                    </span>
                                  </div>
                                  <Badge
                                    variant={msg.senderRole === 'insurer' ? 'secondary' : 'default'}
                                    className={`text-xs ml-2 ${msg.senderRole === 'insurer'
                                        ? 'bg-white/20 text-white hover:bg-white/30'
                                        : ''
                                      }`}
                                  >
                                    {msg.senderRole === 'insurer' ? 'Sent' : 'Received'}
                                  </Badge>
                                </div>

                                {msg.message && msg.message !== 'Shared file(s)' && (
                                  <p
                                    className={`text-sm leading-relaxed break-all whitespace-pre-wrap ${msg.senderRole === 'insurer' ? 'text-white' : 'text-gray-800'
                                      }`}
                                  >
                                    {msg.message}
                                  </p>
                                )}

                                {((msg.attachments as any[])?.length ?? 0) > 0 && (
                                  <div className="mt-2 space-y-2">
                                    {((msg.attachments as any[]) ?? []).map((att) => {
                                      const isImage = att.documentType?.startsWith('image/') ||
                                        /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(att.documentName || '');
                                      const isMine = msg.senderRole === 'insurer';
                                      return isImage ? (
                                        <div key={att.id} className="relative group inline-block">
                                          <img
                                            src={att.documentUrl}
                                            alt={att.documentName}
                                            className="max-w-[200px] max-h-[150px] rounded border object-cover"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => downloadChatAttachment(referralData!.id, att.id)}
                                            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded cursor-pointer"
                                          >
                                            <Download className="h-6 w-6 text-white" />
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          key={att.id}
                                          type="button"
                                          onClick={() => downloadChatAttachment(referralData!.id, att.id)}
                                          className={`flex items-center gap-1.5 text-xs cursor-pointer max-w-full overflow-hidden ${isMine ? 'text-blue-100 hover:text-white' : 'text-blue-600 hover:text-blue-800'}`}
                                        >
                                          <FileText className="h-3.5 w-3.5 shrink-0" />
                                          <span className="underline truncate min-w-0">{att.documentName}</span>
                                          <Download className="h-3 w-3 shrink-0" />
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}

                                <div
                                  className={`text-xs mt-2 ${msg.senderRole === 'insurer'
                                      ? 'opacity-70 text-white'
                                      : 'text-gray-500'
                                    }`}
                                >
                                  {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : '-'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                      <MessageSquare className="w-12 h-12 text-gray-300 mb-4" />
                      <p className="text-sm text-gray-500 font-medium">No queries yet</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Start a conversation by raising a query
                      </p>
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Chat Input Area - Fixed at bottom */}
              <div className="border-t p-4 bg-gray-50 flex-shrink-0">
                {newQueryAttachments.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {newQueryAttachments.map((file, index) => {
                      const isImage = file.type.startsWith('image/');
                      return isImage ? (
                        <div key={`${file.name}-${file.size}-${index}`} className="relative group">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="h-16 w-16 rounded border object-cover"
                            onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                          />
                          <button
                            type="button"
                            onClick={() => removeQueryAttachment(index)}
                            className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label={`Remove ${file.name}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <Badge
                          key={`${file.name}-${file.size}-${index}`}
                          variant="secondary"
                          className="gap-1 pr-1"
                        >
                          <FileText className="h-3 w-3" />
                          <span className="max-w-[180px] truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeQueryAttachment(index)}
                            className="hover:bg-gray-200 rounded-full p-0.5"
                            aria-label={`Remove ${file.name}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
                <div className="relative">
                  <input
                    ref={queryAttachmentInputRef}
                    type="file"
                    multiple
                    accept={CHAT_FILE_ACCEPT}
                    onChange={handleQueryFileChange}
                    className="hidden"
                  />
                  <div className="absolute inset-y-0 left-1 flex items-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => queryAttachmentInputRef.current?.click()}
                      disabled={querySubmitting || !referralData?.id}
                      aria-label="Attach documents"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Type a query message..."
                    value={newQueryDescription}
                    onChange={(e) => setNewQueryDescription(e.target.value)}
                    className="h-11 pl-11 pr-24"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        void handleSendQuery();
                      }
                    }}
                  />
                  <div className="absolute inset-y-0 right-2 flex items-center">
                    <Button
                      onClick={() => void handleSendQuery()}
                      disabled={
                        querySubmitting ||
                        (!newQueryDescription.trim() && newQueryAttachments.length === 0) ||
                        !referralData?.id
                      }
                      size="sm"
                      className="h-8 px-3 gap-1"
                    >
                      {querySubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Send
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <RatingBreakdownDialog
          open={showRatingBreakdownDialog}
          onOpenChange={setShowRatingBreakdownDialog}
          ratingBreakdown={
            ((referralData?.triggerDetails?.ratingBreakdown as RatingBreakdownItem[] | null) || null)
          }
          referralId={referralData?.id}
          pricingVersions={pricingVersions}
          onPricingVersionSaved={(version) =>
            setPricingVersions((prev) => [...prev, version])
          }
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
    </>
  );
};

export default ReferralDetails;


