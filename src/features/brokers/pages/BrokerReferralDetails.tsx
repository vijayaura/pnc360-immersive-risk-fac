import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  AlertCircle,
  AlertTriangle,
  Plus,
  Paperclip,
  X
} from "lucide-react";
import {
  getReferralData,
  ReferralApiResponse,
  Activity,
  ReferralStatus,
  addReferralComment,
  ActorType,
  RequestItem,
  getReferralChatHistory,
  sendReferralQuery,
  ChatMessage,
  ProposalBundleResponseV2
} from '@/features/quotes/api/quotes';
import { useToast } from '@/shared/hooks/use-toast';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQueryClient } from "@tanstack/react-query";
import { TemplatePages } from "@/features/quotes/components/QuoteDetailsV2/TemplatePages";

const MOCK_RISK_FLAGS = ["High Sum Insured", "Non-standard Occupancy"];

const MOCK_TRIGGERED_RULES = [
  {
    ruleName: "High Sum Insured",
    ruleType: "Hard",
    thresholdBreached: "Sum Insured > AED 50,000,000",
  },
];

interface RatingBreakdownItem {
  fieldId?: string;
  fieldLabel?: string;
  proposalValue?: unknown;
  configMatch?: string;
  formula?: string;
  pricingEffect?: string;
  category?: string;
  calculatedValue?: number;
  amount?: number;
  decision?: string;
}

const injectFormValuesIntoTemplateSnapshot = (
  node: unknown,
  valueMap: Map<string, { value: unknown; masterValueId: string | null }>,
  fileMap: Map<string, Array<{ url: string; metadata?: unknown }>>,
): unknown => {
  if (Array.isArray(node)) {
    return node.map((item) => injectFormValuesIntoTemplateSnapshot(item, valueMap, fileMap));
  }
  if (!node || typeof node !== "object") return node;

  const record = node as Record<string, unknown>;
  const merged: Record<string, unknown> = { ...record };
  const fieldId = typeof record.id === "string" ? record.id : null;

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
    typeof formResponse.templateVersionSnapshot !== "object"
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
    const fieldId = typeof file.fieldId === "string" ? file.fieldId : null;
    if (!fieldId) continue;
    const url =
      typeof file.url === "string"
        ? file.url
        : typeof file.fileUrl === "string"
          ? file.fileUrl
          : "";
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
    typeof mergedTemplate.name === "string" ? mergedTemplate.name : referral.productName || "Proposal Form";
  const templatePages = Array.isArray(mergedTemplate.pages) ? mergedTemplate.pages : [];
  const templateProductId =
    typeof mergedTemplate.productId === "string" ? mergedTemplate.productId : formResponse.productId;
  const templateId =
    typeof mergedTemplate.id === "string"
      ? mergedTemplate.id
      : typeof mergedTemplate.templateId === "string"
        ? mergedTemplate.templateId
        : formResponse.templateId;
  const currency =
    typeof mergedTemplate.currency === "string" ? mergedTemplate.currency : referral.currency || undefined;

  return {
    lastFilledPageId: "",
    responseId: formResponse.responseId,
    templateId: formResponse.templateId,
    templateVersionId: formResponse.templateVersionId,
    productId: formResponse.productId,
    status: formResponse.status,
    template: {
      name: templateName,
      pages: templatePages as ProposalBundleResponseV2["template"]["pages"],
      productId: templateProductId,
      templateId,
      currency,
    },
  };
};

const BrokerReferralDetails = () => {
  const { referralId } = useParams<{ referralId?: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const quoteId = searchParams.get("quoteId") || undefined;
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [referralData, setReferralData] = useState<ReferralApiResponse | null>(null);
  const [proposalBundle, setProposalBundle] = useState<ProposalBundleResponseV2 | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["referral_header", "referral_history", "referral_trigger"])
  );

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [totalQueries, setTotalQueries] = useState(0);
  const [chatHistoryLoaded, setChatHistoryLoaded] = useState(false);
  const [initialListUnreadCount, setInitialListUnreadCount] = useState(0);

  // Comment states
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);

  // Chat widget state - lazy init from URL so ?openMessage=true auto-opens the panel
  const [isChatExpanded, setIsChatExpanded] = useState<boolean>(
    () => searchParams.get('openMessage') === 'true'
  );

  // Sync state with URL parameter for notification auto-open (important for component reuse)
  useEffect(() => {
    if (searchParams.get("openMessage") === "true") {
      setIsChatExpanded(true);
    }
  }, [searchParams]);
  const [newQueryDescription, setNewQueryDescription] = useState("");
  const [newQueryAttachments, setNewQueryAttachments] = useState<File[]>([]);
  const [querySubmitting, setQuerySubmitting] = useState(false);
  const [showRatingBreakdownDialog, setShowRatingBreakdownDialog] = useState(false);
  const [showProposalDialog, setShowProposalDialog] = useState(false);
  const [locallyReadMessageIds, setLocallyReadMessageIds] = useState<Set<string>>(new Set());
  const queryAttachmentInputRef = useRef<HTMLInputElement | null>(null);
  const chatScrollAreaRef = useRef<HTMLDivElement | null>(null);
  const chatReadSyncingRef = useRef(false);

  const getReferralUnreadFromCache = useCallback(
    (refId: string): number | null => {
      const caches = [
        queryClient.getQueriesData({ queryKey: ["broker-referrals"] }),
        queryClient.getQueriesData({ queryKey: ["insurer-referrals"] }),
      ].flat();
      for (const [, data] of caches) {
        if (
          data &&
          typeof data === "object" &&
          "data" in data &&
          Array.isArray((data as { data?: unknown[] }).data)
        ) {
          const rows = (data as { data: Array<Record<string, unknown>> }).data;
          const match = rows.find((row) => row.id === refId);
          if (match) return Number(match.unreadMessageCount || 0);
        }
      }
      return null;
    },
    [queryClient]
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
        // Prioritize referralId if available
        const idToFetch = referralId || quoteId;
        if (idToFetch) {
          const referral = await getReferralData(idToFetch);

          // Normalize status if needed (matching ReferralDetails.tsx logic)
          const statusNormalized: ReferralStatus =
            String(referral.status || "").toLowerCase() === "responded"
              ? "Responded"
              : String(referral.status || "").toLowerCase() === "closed"
                ? "Closed"
                : "Open";

          setReferralData({ ...referral, status: statusNormalized });
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
            (referral as unknown as { unreadMessageCount?: number }).unreadMessageCount || 0
          );
          setInitialListUnreadCount(unreadFromCache ?? unreadFromDetail);

        }
      } catch (err) {
        console.error("Error loading referral data:", err);
        toast({
          title: "Error",
          description: "Failed to load referral data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [referralId, quoteId, toast, getReferralUnreadFromCache]);

  // 3. Fetch Chat History - polling for updates to support real-time notifications
  useEffect(() => {
    if (!referralData?.id) return;
    let cancelled = false;

    const fetchChat = async () => {
      try {
        const chatRes = await getReferralChatHistory(referralData.id, "true");
        if (!cancelled && chatRes) {
          setChatMessages(chatRes.data ?? []);
          setTotalQueries(chatRes.meta?.totalQuery ?? 0);
          setChatHistoryLoaded(true);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Error loading chat history:", error);
        }
      }
    };

    fetchChat();
    // Poll every 30 seconds when expanded, 60 seconds when closed
    const intervalId = setInterval(fetchChat, isChatExpanded ? 30000 : 60000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
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

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast({
        title: "Comment Required",
        description: "Please enter a comment",
        variant: "destructive",
      });
      return;
    }

    try {
      const id = referralId || referralData?.referralId;
      if (!id) throw new Error("Referral ID not found");

      const res = await addReferralComment(id, { comment: newComment.trim() });

      // Optimistic update or refetch
      if (referralData) {
        const newActivity: Activity = {
          id: `A${Date.now()}`,
          actorType: "user", // Assuming current user is 'user' or 'broker'
          actionType: "comment_added",
          comment: newComment.trim(),
          createdAt: new Date().toISOString(),
        };

        setReferralData({
          ...referralData,
          activities: [...referralData.activities, newActivity],
          updatedAt: new Date().toISOString(),
        });
      }

      if (res.message) {
        console.log(res.message);
      }

      setNewComment("");
      setShowCommentForm(false);

      toast({
        title: "Comment Added",
        description: "Your comment has been added to the referral history",
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to add comment",
        variant: "destructive",
      });
    }
  };

  const handleQueryFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const acceptedFiles: File[] = [];
    Array.from(files).forEach((file) => {
      if (file.type === "application/pdf" || file.type.startsWith("image/")) {
        acceptedFiles.push(file);
      } else {
        toast({
          title: "Invalid File Type",
          description: `${file.name} is not a PDF or image file.`,
          variant: "destructive",
        });
      }
    });
    if (acceptedFiles.length > 0) {
      setNewQueryAttachments((prev) => [...prev, ...acceptedFiles]);
    }
    event.target.value = "";
  };

  const removeQueryAttachment = (indexToRemove: number) => {
    setNewQueryAttachments((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSendQuery = async () => {
    if (!newQueryDescription.trim() && newQueryAttachments.length === 0) {
      toast({
        title: "Message or Document Required",
        description: "Please enter a query message or attach a document.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (!referralData?.id) throw new Error("Missing ID");

      setQuerySubmitting(true);
      await sendReferralQuery(referralData.id, {
        message: newQueryDescription.trim(),
        dueDate: new Date().toISOString().split("T")[0],
        files: newQueryAttachments,
      });

      // Refresh chat
      const chatRes = await getReferralChatHistory(referralData.id, "true");
      if (chatRes) {
        setChatMessages(chatRes.data ?? []);
        setTotalQueries(chatRes.meta?.totalQuery ?? 0);
        setChatHistoryLoaded(true);
      }

      setNewQueryDescription("");
      setNewQueryAttachments([]);
      if (queryAttachmentInputRef.current) {
        queryAttachmentInputRef.current.value = "";
      }

      toast({
        title: "Query Sent",
        description: `Your query has been sent successfully${newQueryAttachments.length > 0 ? ` with ${newQueryAttachments.length} attachment(s)` : ""}.`,
      });

    } catch (error: any) {
      console.error("Failed to send query", error);
      toast({
        title: "Error",
        description: "Failed to send query. Please try again.",
        variant: "destructive"
      });
    } finally {
      setQuerySubmitting(false);
    }
  };

  const currentViewerRole: "broker" | "insurer" = "broker";
  const unreadIncomingMessageIds = useMemo(
    () =>
      chatMessages
        .filter((msg) => {
          if (msg.senderRole === currentViewerRole) return false;
          const readAt = currentViewerRole === "broker" ? msg.brokerReadAt : msg.insurerReadAt;
          return !readAt;
        })
        .map((msg) => msg.id)
        .filter((id) => !locallyReadMessageIds.has(id)),
    [chatMessages, currentViewerRole, locallyReadMessageIds]
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
          typeof oldData === "object" &&
          "data" in oldData &&
          Array.isArray((oldData as { data?: unknown[] }).data)
        ) {
          const typed = oldData as { data: Array<Record<string, unknown>> };
          return {
            ...typed,
            data: typed.data.map((item) =>
              item.id === referralData.id ? { ...item, unreadMessageCount: count } : item
            ),
          };
        }
        return oldData;
      };
      queryClient.setQueriesData({ queryKey: ["broker-referrals"] }, applyPatch);
      queryClient.setQueriesData({ queryKey: ["insurer-referrals"] }, applyPatch);
    },
    [queryClient, referralData?.id]
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
        const readAt = currentViewerRole === "broker" ? msg.brokerReadAt : msg.insurerReadAt;
        return !readAt;
      }).length,
    [currentViewerRole]
  );

  const syncServerReadStatusAtBottom = useCallback(async () => {
    if (!referralData?.id || chatReadSyncingRef.current) return;
    chatReadSyncingRef.current = true;
    try {
      let attempts = 0;
      let previousUnread = Number.MAX_SAFE_INTEGER;
      let latestMessages = chatMessages;
      while (attempts < 20) {
        const res = await getReferralChatHistory(referralData.id, "true");
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
      console.error("Failed to sync referral chat read status:", error);
    } finally {
      chatReadSyncingRef.current = false;
    }
  }, [referralData?.id, chatMessages, countUnreadForRole]);

  useEffect(() => {
    if (!chatHistoryLoaded || !referralData?.id) return;
    patchReferralUnreadCountInCache(unreadIncomingCount);
  }, [chatHistoryLoaded, referralData?.id, unreadIncomingCount, patchReferralUnreadCountInCache]);

  useEffect(() => {
    if (!isChatExpanded) return;
    const root = chatScrollAreaRef.current;
    if (!root) return;
    const viewport = root.querySelector("[data-radix-scroll-area-viewport]") as HTMLDivElement | null;
    if (!viewport) return;

    const scrollToTarget = () => {
      if (firstUnreadIncomingMessageId) {
        const firstUnreadEl = viewport.querySelector(
          `[data-chat-message-id="${firstUnreadIncomingMessageId}"]`
        ) as HTMLDivElement | null;
        if (firstUnreadEl) {
          firstUnreadEl.scrollIntoView({ block: "center", behavior: "auto" });
          return;
        }
      }
      viewport.scrollTop = viewport.scrollHeight;
    };

    const timer = window.setTimeout(scrollToTarget, 0);
    const onScroll = () => {
      const distanceFromBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
      if (distanceFromBottom <= 16) {
        markVisibleUnreadAsRead();
        void syncServerReadStatusAtBottom();
      }
    };

    viewport.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(timer);
      viewport.removeEventListener("scroll", onScroll);
    };
  }, [isChatExpanded, chatMessages, firstUnreadIncomingMessageId, markVisibleUnreadAsRead, syncServerReadStatusAtBottom]);

  const t = (v: any) => {
    if (v === null || v === undefined) return "-";
    const s = String(v).trim();
    return s.length ? s : "-";
  };

  const titleCase = (s: string) => {
    if (!s) return "-";
    return s
      .replace(/[_-]+/g, " ")
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const getStatusBadge = (status: any) => {
    const statusConfig: Record<
      string,
      { variant: "default" | "secondary" | "destructive" | "outline"; icon: any }
    > = {
      Open: { variant: "default", icon: Clock },
      Responded: { variant: "secondary", icon: MessageSquare },
      Closed: { variant: "outline", icon: CheckCircle },
    };

    // Fallback for known referral statuses
    const normalizedStatus = String(status);
    const config = statusConfig[normalizedStatus] || { variant: "outline", icon: AlertCircle };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {status || "-"}
      </Badge>
    );
  };

  const getPriorityBadge = (priority?: any | null) => {
    const priorityConfig: Record<string, { color: string }> = {
      Low: { color: "bg-green-100 text-green-800" },
      Medium: { color: "bg-yellow-100 text-yellow-800" },
      High: { color: "bg-orange-100 text-orange-800" },
      Urgent: { color: "bg-red-100 text-red-800" },
    };

    const key = priority || "-";
    const color = priorityConfig[key]?.color || "bg-gray-100 text-gray-600";
    return <Badge className={color}>{priority || "-"}</Badge>;
  };

  const hasRatingBreakdown =
    Array.isArray(
      (referralData.triggerDetails?.ratingBreakdown as RatingBreakdownItem[] | null) || undefined,
    ) &&
    ((((referralData.triggerDetails?.ratingBreakdown as RatingBreakdownItem[] | null) || []) as RatingBreakdownItem[])
      .length > 0);

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

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8fafc" }}>
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/broker/dashboard")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Referral Details - {t(referralData.referralId)}
                </h1>
                <p className="text-sm text-gray-600">
                  {t(referralData.productName)} (Quote No: {t(referralData.quoteNumber)})
                </p>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(referralData.status)}
                {getPriorityBadge(referralData.priority)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => window.print()}
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl pb-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - 2x2 Grid Layout */}
          <div className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Referral Header / Context */}
            <Card className="bg-white border border-blue-200" data-section="referral_header">
              <CardHeader
                className="pb-3 cursor-pointer"
                onClick={() => toggleSectionExpansion("referral_header")}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Referral Information</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowProposalDialog(true);
                      }}
                      className="h-7 px-2.5 text-xs"
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
                      className="h-7 px-2.5 text-xs"
                      disabled={!hasRatingBreakdown}
                    >
                      View Rating Breakdown
                    </Button>
                    {expandedSections.has("referral_header") ? (
                      <ChevronUp className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                </div>
              </CardHeader>
              {expandedSections.has("referral_header") && (
                <CardContent className="pt-0">
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="grid lg:grid-cols-3 gap-0">
                      <div className="p-3 border-r border-b border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">Referral ID</div>
                        <div className="text-sm font-medium">{t(referralData.referralId)}</div>
                      </div>
                      <div className="p-3 border-r border-b border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">Quote No</div>
                        <div className="text-sm font-medium">{t(referralData.quoteNumber)}</div>
                      </div>
                      <div className="p-3 border-b border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">Product</div>
                        <div className="text-sm font-medium">{t(referralData.productName)}</div>
                      </div>
                      <div className="p-3 border-r border-b border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">Insurer</div>
                        <div className="text-sm font-medium">{t(referralData.insurerName)}</div>
                      </div>
                      <div className="p-3 border-r border-b border-gray-200">
                        {/* Broker doesn't necessarily see distribution channel if they are the channel, but keeping placeholder */}
                        <div className="text-xs text-gray-500 mb-1">Distribution Channel</div>
                        <div className="text-sm font-medium">-</div>
                      </div>
                      <div className="p-3 border-b border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">Status</div>
                        <div className="text-sm">{getStatusBadge(referralData.status)}</div>
                      </div>
                      <div className="p-3 border-r border-b border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">Priority</div>
                        <div className="text-sm">{getPriorityBadge(referralData.priority)}</div>
                      </div>
                      <div className="p-3 border-r border-b border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">Created Date</div>
                        <div className="text-sm font-medium">
                          {referralData.referredAt
                            ? new Date(referralData.referredAt).toLocaleString()
                            : "-"}
                        </div>
                      </div>
                      <div className="p-3 border-b border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">Last Updated</div>
                        <div className="text-sm font-medium">
                          {referralData.updatedAt
                            ? new Date(referralData.updatedAt).toLocaleString()
                            : "-"}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* 2. Referral Trigger Summary */}
            <Card className="bg-white border border-blue-200" data-section="referral_trigger">
              <CardHeader
                className="pb-3 cursor-pointer"
                onClick={() => toggleSectionExpansion("referral_trigger")}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Referral Trigger
                  </CardTitle>
                  {expandedSections.has("referral_trigger") ? (
                    <ChevronUp className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  )}
                </div>
              </CardHeader>
              {expandedSections.has("referral_trigger") && (
                <CardContent className="pt-0">
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="grid lg:grid-cols-2 gap-0">
                      <div className="p-3 border-r border-b border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">Referral Source</div>
                        <div className="text-sm">
                          <Badge variant="outline">Rule-based</Badge>
                        </div>
                      </div>
                      <div className="p-3 border-b border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">System Recommendation</div>
                        <div className="text-sm">
                          <Badge variant="secondary">Approve with Conditions</Badge>
                        </div>
                      </div>
                      <div className="p-3 border-b border-gray-200 lg:col-span-2">
                        <div className="text-xs text-gray-500 mb-2">Risk Flags</div>
                        <div className="flex flex-wrap gap-1">
                          {MOCK_RISK_FLAGS.map((flag, idx) => (
                            <Badge key={idx} variant="destructive" className="text-xs">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              {flag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200">
                      <div className="p-3 bg-gray-50">
                        <div className="text-xs font-medium text-gray-700 mb-2">
                          Triggered Rules
                        </div>
                      </div>
                      <div className="divide-y divide-gray-200">
                        {(referralData.triggerDetails?.rules || []).map(
                          (rule: any, idx: number) => (
                            <div key={idx} className="p-3">
                              <div className="grid lg:grid-cols-3 gap-2">
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Rule Name</div>
                                  <div className="text-sm font-medium">
                                    {rule.ruleName ||
                                      rule.formFieldLabel ||
                                      rule.name ||
                                      '-'}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Rule Type</div>
                                  <div className="text-sm">
                                    <Badge
                                      variant={
                                        (rule.ruleSeverity === 'Hard' ||
                                          rule.quoteAction === 'NO_QUOTE')
                                          ? 'destructive'
                                          : 'secondary'
                                      }
                                    >
                                      {rule.ruleSeverity ||
                                        (rule.quoteAction === 'NO_QUOTE' ? 'Hard' : 'Soft')}
                                    </Badge>
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">
                                    Threshold Breached
                                  </div>
                                  <div className="text-sm font-medium">
                                    {rule.thresholdBreached ||
                                      rule.conditions ||
                                      (rule.rangeStart !== undefined
                                        ? `> ${rule.rangeStart}`
                                        : '-')}
                                  </div>
                                </div>
                              </div>
                              <div className="grid lg:grid-cols-3 gap-2 mt-2">
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Recommendation</div>
                                  <div className="text-sm font-medium">
                                    {rule.recommendation || '-'}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Action</div>
                                  <div className="text-sm font-medium">
                                    {rule.quoteAction
                                      ? titleCase(String(rule.quoteAction))
                                      : '-'}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Description</div>
                                  <div className="text-sm font-medium text-gray-600">
                                    {rule.description || '-'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>

                    {referralData.reason && (
                      <div className="border-t border-gray-200 p-3">
                        <div className="text-xs text-gray-500 mb-1">Manual Referral Reason</div>
                        <div className="text-sm">{referralData.reason}</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>

            {/* 2.5 Queries & Communication Summary */}
            <Card className="bg-white border border-gray-200 shadow-sm" data-section="queries_summary">
              <CardHeader className="pb-3 px-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    Queries & Communication
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => setIsChatExpanded(true)}
                  >
                    Open Chat
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0 px-6">
                <div className="text-sm text-gray-600 mb-4">
                  {chatMessages.length > 0
                    ? `You have ${chatMessages.length} total message(s) in this referral conversation.`
                    : "No queries or messages have been exchanged yet."}
                </div>
                {unreadIncomingCount > 0 && (
                  <div className="flex items-center gap-2 text-red-600 animate-pulse bg-red-50 p-2 rounded border border-red-100 mb-2">
                    <div className="h-2 w-2 rounded-full bg-red-600" />
                    <span className="text-xs font-bold">{unreadIncomingCount} new message(s) waiting for your response</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 3. Referral History & Timeline */}
            <Card className="bg-white border border-gray-200 shadow-sm lg:col-span-2" data-section="referral_history">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => toggleSectionExpansion("referral_history")}
                  >
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <History className="h-5 w-5 text-primary" />
                      Referral History & Timeline
                    </CardTitle>
                    <CardDescription>Click on any item to view detailed information</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {expandedSections.has("referral_history") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowCommentForm(!showCommentForm);
                        }}
                        className="flex items-center gap-2"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Add Comment
                      </Button>
                    )}
                    <div
                      className="cursor-pointer"
                      onClick={() => toggleSectionExpansion("referral_history")}
                    >
                      {expandedSections.has("referral_history") ? (
                        <ChevronUp className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              {expandedSections.has("referral_history") && (
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
                            setNewComment("");
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

                  <div className="space-y-3">
                    {referralData.activities && referralData.activities.length > 0 ? (
                      referralData.activities.map((activity) => {
                        const isSystem = String(activity.actorType).toLowerCase() === "system";
                        const isExpanded = selectedActivityId === activity.id;

                        const getIcon = () => {
                          if (isSystem) {
                            return <AlertCircle className="w-4 h-4 text-primary" />;
                          }
                          switch (titleCase(activity.actionType)) {
                            case "Comment Added":
                              return <MessageSquare className="w-4 h-4 text-white" />;
                            case "Query Raised":
                              return <Send className="w-4 h-4 text-white" />;
                            case "Assigned":
                              return <User className="w-4 h-4 text-white" />;
                            default:
                              return <CheckCircle className="w-4 h-4 text-white" />;
                          }
                        };

                        return (
                          <div key={activity.id} className="border border-gray-200 rounded-lg overflow-hidden transition-all hover:shadow-sm">
                            <div
                              className="p-3 cursor-pointer bg-white hover:bg-gray-50 transition-colors"
                              onClick={() => setSelectedActivityId(isExpanded ? null : activity.id)}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isSystem ? "bg-primary/10 border border-primary/20" : "bg-primary"
                                  }`}>
                                  {getIcon()}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-medium text-gray-900">{titleCase(activity.actionType)}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {titleCase(activity.actorType)}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                    <span>{titleCase(activity.actorType)}</span>
                                    <span>•</span>
                                    <span>{activity.createdAt ? new Date(activity.createdAt).toLocaleString() : "-"}</span>
                                  </div>
                                </div>

                                <div className="flex-shrink-0">
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-gray-400" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                  )}
                                </div>
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="border-t border-gray-200 bg-gray-50 p-4 animate-in slide-in-from-top-2 duration-200">
                                <div className="space-y-3">
                                  {activity.comment ? (
                                    <div>
                                      <div className="text-xs font-medium text-gray-700 mb-2">Comment</div>
                                      <div className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-200">
                                        {activity.comment}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-sm text-gray-500 italic">No additional details available</div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-6 text-gray-500">No history available</div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>

      </div>

      {/* Floating Chat Widgets - Moved outside main container to avoid layout/clipping issues */}
      {!isChatExpanded && (
        <div className="fixed bottom-6 right-6 z-50 group cursor-pointer" onClick={() => setIsChatExpanded(true)}>
          <Button
            className="relative pointer-events-none h-14 w-14 group-hover:w-56 rounded-full shadow-[0_4px_14px_0_rgba(0,0,0,0.2)] bg-primary group-hover:bg-primary/95 text-primary-foreground border-0 transition-width duration-300 ease-out overflow-hidden p-0 flex items-center"
          >
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

      {/* Chat Header */}
      {isChatExpanded && (
        <div className="fixed bottom-6 right-6 z-50 w-[400px] h-[700px] flex flex-col shadow-2xl rounded-lg overflow-hidden bg-white border border-gray-200">
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <h3 className="text-base font-semibold">Queries & Communication</h3>
              {unreadIncomingCount > 0 && (
                <Badge variant="outline" className="text-xs">
                  {unreadIncomingCount} {unreadIncomingCount === 1 ? "Unread" : "Unread"}
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
              backgroundSize: "24px 24px",
              backgroundColor: "#f9fafb",
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
                        className={`flex ${msg.senderRole === "broker" ? "justify-end" : "justify-start"
                          }`}
                      >
                        <div className="max-w-[80%]">
                          <div
                            className={`rounded-lg px-4 py-3 shadow-md border ${msg.senderRole === "broker"
                              ? "bg-primary text-primary-foreground border-transparent"
                              : "bg-white text-gray-900 border-gray-200"
                              }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <User
                                  className={`w-3 h-3 ${msg.senderRole === "broker" ? "text-white" : "text-gray-600"
                                    }`}
                                />
                                <span
                                  className={`text-xs font-medium ${msg.senderRole === "broker" ? "text-white" : "text-gray-700"
                                    }`}
                                >
                                  {msg.senderRole === "broker" ? "You" : "Insurer"}
                                </span>
                              </div>
                              <Badge
                                variant={msg.status === "Responded" ? "default" : "secondary"}
                                className={`text-xs ml-2 ${msg.senderRole === "broker"
                                  ? "bg-white/20 text-white hover:bg-white/30"
                                  : ""
                                  }`}
                              >
                                {msg.status ? msg.status.charAt(0).toUpperCase() + msg.status.slice(1) : "-"}
                              </Badge>
                            </div>

                            <p
                              className={`text-sm leading-relaxed break-all whitespace-pre-wrap ${msg.senderRole === "broker" ? "text-white" : "text-gray-800"
                                }`}
                            >
                              {msg.message}
                            </p>

                            {((msg.attachments as any[])?.length ?? 0) > 0 && (
                              <div className="mt-2 space-y-1">
                                {(msg.attachments as any[] ?? []).map((att) => (
                                  <a
                                    href={att.documentUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    key={att.id}
                                    className={`block text-xs underline ${msg.senderRole === "broker" ? "text-blue-100" : "text-blue-600"
                                      }`}
                                  >
                                    {att.documentName}
                                  </a>
                                ))}
                              </div>
                            )}

                            <div
                              className={`text-xs mt-2 ${msg.senderRole === "broker"
                                ? "opacity-70 text-white"
                                : "text-gray-500"
                                }`}
                            >
                              {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : "-"}
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
                    Start a conversation by expecting a query
                  </p>
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Chat Input Area - Fixed at bottom */}
          <div className="border-t p-4 bg-gray-50 flex-shrink-0">
            {newQueryAttachments.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {newQueryAttachments.map((file, index) => (
                  <Badge key={`${file.name}-${file.size}-${index}`} variant="secondary" className="gap-1 pr-1">
                    <Paperclip className="h-3 w-3" />
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
                ))}
              </div>
            )}
            <div className="relative">
              <input
                ref={queryAttachmentInputRef}
                type="file"
                multiple
                accept="application/pdf,image/*"
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
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleSendQuery();
                  }
                }}
              />
              <div className="absolute inset-y-0 right-2 flex items-center">
                <Button
                  onClick={() => void handleSendQuery()}
                  disabled={querySubmitting || (!newQueryDescription.trim() && newQueryAttachments.length === 0) || !referralData?.id}
                  size="sm"
                  className="h-8 px-3 gap-1"
                >
                  {querySubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      <Dialog open={showRatingBreakdownDialog} onOpenChange={setShowRatingBreakdownDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Rating Breakdown</DialogTitle>
            <DialogDescription>
              Detailed breakdown of rating components used for this referral.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            {hasRatingBreakdown ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">Field</th>
                      <th className="text-left p-2 font-medium">Proposal Value</th>
                      <th className="text-left p-2 font-medium">Config Match</th>
                      <th className="text-left p-2 font-medium">Pricing Effect</th>
                      <th className="text-left p-2 font-medium">Calculated</th>
                      <th className="text-left p-2 font-medium">Amount</th>
                      <th className="text-left p-2 font-medium">Decision</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(
                      ((referralData.triggerDetails?.ratingBreakdown as RatingBreakdownItem[] | null) ||
                        []) as RatingBreakdownItem[]
                    ).map((item, index) => (
                      <tr key={index} className={`border-b ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                        <td className="p-2 font-medium">{item.fieldLabel || item.fieldId || "-"}</td>
                        <td className="p-2">
                          {item.proposalValue !== null && item.proposalValue !== undefined
                            ? String(item.proposalValue)
                            : "-"}
                        </td>
                        <td className="p-2">{item.configMatch || item.formula || "-"}</td>
                        <td className="p-2">{item.pricingEffect || item.category || "-"}</td>
                        <td className="p-2">
                          {typeof item.calculatedValue === "number"
                            ? item.calculatedValue.toLocaleString()
                            : "-"}
                        </td>
                        <td className="p-2">{typeof item.amount === "number" ? item.amount.toLocaleString() : "-"}</td>
                        <td className="p-2">
                          <Badge
                            className={`${
                              item.decision === "Auto Quote"
                                ? "bg-blue-100 text-blue-700 border-blue-200"
                                : item.decision === "Manual Review"
                                  ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                                  : "bg-red-100 text-red-700 border-red-200"
                            } border px-2 py-0.5 text-[10px] font-semibold shadow-none`}
                          >
                            {item.decision || "-"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No rating breakdown data available for this referral.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
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
