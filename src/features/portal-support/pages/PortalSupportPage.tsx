import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, ArrowUpLeft, BookOpen, Loader2, PanelLeft, Paperclip, Search, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import {
  RichTextContent,
  RICH_TEXT_CHROMELESS_MEDIA_CLASS,
} from '@/features/product-config/proposal-form/components/RichTextEditor';
import {
  formatSupportTimestamp,
  usePortalSupportTopics,
  type SupportTopic,
} from '@/features/support/api/support';
import { useToast } from '@/shared/hooks/use-toast';
import { cn } from '@/shared/utils/lib-utils';
import { PortalHelpLayout } from './PortalHelpLayout';

const EMPTY_TOPICS: SupportTopic[] = [];
const SUPPORT_SIDEBAR_DEFAULT_WIDTH = 280;
const SUPPORT_SIDEBAR_MIN_WIDTH = 260;
const SUPPORT_SIDEBAR_MAX_WIDTH = 560;

interface SupportSearchSuggestion {
  id: string;
  topic: SupportTopic;
  label: string;
  fillValue: string;
  matchSource: 'title' | 'description' | 'faq-question' | 'faq-answer';
  highlightTerm: string;
}

function normalizeSearchText(value: string) {
  return value.trim().toLowerCase();
}

function getPlainTextFromHtml(html?: string | null) {
  if (!html) return '';

  if (typeof document === 'undefined') {
    return html.replace(/<[^>]*>/g, ' ');
  }

  const container = document.createElement('div');
  container.innerHTML = html;
  return container.textContent || '';
}

function getSearchSnippet(value: string, searchValue: string) {
  const normalizedSearch = normalizeSearchText(searchValue);
  const normalizedValue = value.toLowerCase();
  const matchIndex = normalizedValue.indexOf(normalizedSearch);

  if (!normalizedSearch || matchIndex < 0) return value.trim();

  const snippetStart = Math.max(0, matchIndex - 48);
  const snippetEnd = Math.min(value.length, matchIndex + normalizedSearch.length + 72);
  const prefix = snippetStart > 0 ? '...' : '';
  const suffix = snippetEnd < value.length ? '...' : '';

  return `${prefix}${value.slice(snippetStart, snippetEnd).trim()}${suffix}`;
}

function getSearchFillValue(value: string, searchValue: string) {
  const normalizedSearch = normalizeSearchText(searchValue);
  const normalizedValue = value.toLowerCase();
  const matchIndex = normalizedValue.indexOf(normalizedSearch);

  if (!normalizedSearch || matchIndex < 0) return value.trim();

  const fillStart = Math.max(0, matchIndex - 32);
  const fillEnd = Math.min(value.length, matchIndex + normalizedSearch.length + 48);

  return value.slice(fillStart, fillEnd).trim();
}

function buildTopicSearchSuggestions(topics: SupportTopic[], searchValue: string): SupportSearchSuggestion[] {
  const normalizedSearch = normalizeSearchText(searchValue);
  if (!normalizedSearch) return [];

  return topics.flatMap((topic) => {
    const suggestions: SupportSearchSuggestion[] = [];
    const titleMatches = topic.title.toLowerCase().includes(normalizedSearch);
    const descriptionText = getPlainTextFromHtml(topic.description).replace(/\s+/g, ' ').trim();
    const descriptionMatches = descriptionText.toLowerCase().includes(normalizedSearch);

    if (titleMatches) {
      suggestions.push({
        id: `${topic.id}-title`,
        topic,
        label: topic.title,
        fillValue: topic.title,
        matchSource: 'title',
        highlightTerm: searchValue,
      });
    }

    if (descriptionMatches) {
      suggestions.push({
        id: `${topic.id}-description`,
        topic,
        label: getSearchSnippet(descriptionText, searchValue),
        fillValue: getSearchFillValue(descriptionText, searchValue),
        matchSource: 'description',
        highlightTerm: searchValue,
      });
    }

    topic.faqs.forEach((faq) => {
      const questionMatches = faq.question.toLowerCase().includes(normalizedSearch);
      const answerText = getPlainTextFromHtml(faq.answer).replace(/\s+/g, ' ').trim();
      const answerMatches = answerText.toLowerCase().includes(normalizedSearch);

      if (questionMatches) {
        suggestions.push({
          id: `${topic.id}-${faq.id}-faq-question`,
          topic,
          label: faq.question,
          fillValue: faq.question,
          matchSource: 'faq-question',
          highlightTerm: searchValue,
        });
      }

      if (answerMatches) {
        suggestions.push({
          id: `${topic.id}-${faq.id}-faq-answer`,
          topic,
          label: getSearchSnippet(answerText, searchValue),
          fillValue: getSearchFillValue(answerText, searchValue),
          matchSource: 'faq-answer',
          highlightTerm: searchValue,
        });
      }
    });

    return suggestions;
  }).slice(0, 10);
}

function getSearchMatchSourceLabel(matchSource: SupportSearchSuggestion['matchSource']) {
  if (matchSource === 'description') return 'Matched in description';
  if (matchSource === 'faq-question') return 'Matched in FAQ question';
  if (matchSource === 'faq-answer') return 'Matched in FAQ answer';
  return 'Matched in title';
}

function highlightFirstTextMatch(root: HTMLElement, searchValue: string) {
  const normalizedSearch = normalizeSearchText(searchValue);
  if (!normalizedSearch) return null;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let textNode = walker.nextNode() as Text | null;

  while (textNode) {
    const text = textNode.textContent || '';
    const matchIndex = text.toLowerCase().indexOf(normalizedSearch);

    if (matchIndex >= 0) {
      const range = document.createRange();
      range.setStart(textNode, matchIndex);
      range.setEnd(textNode, matchIndex + normalizedSearch.length);

      const mark = document.createElement('mark');
      mark.dataset.supportSearchHighlight = 'true';
      mark.className = 'rounded bg-amber-200 px-0.5 text-foreground ring-2 ring-amber-300/70';
      range.surroundContents(mark);
      return mark;
    }

    textNode = walker.nextNode() as Text | null;
  }

  return null;
}

const PortalSupportPage = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const isSearching = debouncedSearchTerm.length > 0;
  const topicsQuery = usePortalSupportTopics({ page: 1, limit: 100 });
  const allSupportTopics = topicsQuery.data?.data ?? EMPTY_TOPICS;
  const [activeTopicId, setActiveTopicId] = useState('');
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
  const [isTopicSidebarOpen, setIsTopicSidebarOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedSearchTerm, setSelectedSearchTerm] = useState('');
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [sidebarWidth, setSidebarWidth] = useState(SUPPORT_SIDEBAR_DEFAULT_WIDTH);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);
  const sidebarResizeRef = useRef({ startX: 0, startWidth: SUPPORT_SIDEBAR_DEFAULT_WIDTH });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchTerm]);

  const searchSuggestions = useMemo(
    () => buildTopicSearchSuggestions(allSupportTopics, debouncedSearchTerm || searchTerm),
    [allSupportTopics, debouncedSearchTerm, searchTerm],
  );
  const supportTopics = useMemo(() => {
    if (!isSearching) return allSupportTopics;

    const seenTopicIds = new Set<string>();
    return searchSuggestions.reduce<SupportTopic[]>((matchedTopics, suggestion) => {
      if (!seenTopicIds.has(suggestion.topic.id)) {
        seenTopicIds.add(suggestion.topic.id);
        matchedTopics.push(suggestion.topic);
      }
      return matchedTopics;
    }, []);
  }, [allSupportTopics, isSearching, searchSuggestions]);

  const resolvedActiveTopicId = supportTopics.some((topic) => topic.id === activeTopicId)
    ? activeTopicId
    : supportTopics[0]?.id ?? '';
  const activeTopic =
    supportTopics.find((topic) => topic.id === resolvedActiveTopicId) ?? supportTopics[0] ?? null;

  const dashboardPath = useMemo(() => {
    if (pathname.startsWith('/market-admin/')) return '/market-admin/dashboard';
    if (pathname.startsWith('/insurer/')) return '/insurer/dashboard';
    if (pathname.startsWith('/broker/')) return '/broker/dashboard';
    return '/';
  }, [pathname]);

  const topicsByCategory = useMemo(() => {
    return supportTopics.reduce<Record<string, SupportTopic[]>>((accumulator, topic) => {
      if (!accumulator[topic.categoryName]) {
        accumulator[topic.categoryName] = [];
      }
      accumulator[topic.categoryName].push(topic);
      return accumulator;
    }, {});
  }, [supportTopics]);

  const orderedCategories = useMemo(
    () => Object.keys(topicsByCategory).sort((left, right) => left.localeCompare(right)),
    [topicsByCategory],
  );

  const resetTicketForm = () => {
    setTicketTitle('');
    setTicketDescription('');
    setAttachments([]);
    if (attachmentInputRef.current) {
      attachmentInputRef.current.value = '';
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsCreateTicketOpen(open);
    if (!open) {
      resetTicketForm();
    }
  };

  const handleAttachmentsChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    if (selectedFiles.length === 0) return;

    setAttachments((currentFiles) => {
      const seen = new Set(currentFiles.map((file) => `${file.name}-${file.size}-${file.lastModified}`));
      const nextFiles = [...currentFiles];

      selectedFiles.forEach((file) => {
        const fileKey = `${file.name}-${file.size}-${file.lastModified}`;
        if (!seen.has(fileKey)) {
          seen.add(fileKey);
          nextFiles.push(file);
        }
      });

      return nextFiles;
    });

    event.target.value = '';
  };

  const handleRemoveAttachment = (indexToRemove: number) => {
    setAttachments((currentFiles) => currentFiles.filter((_, index) => index !== indexToRemove));
  };

  const handleCreateTicket = () => {
    toast({
      title: 'Ticket created',
      description: 'Your support ticket has been added successfully.',
    });
    setIsCreateTicketOpen(false);
    resetTicketForm();
  };

  const handleSidebarResizePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const pointerId = event.pointerId;
    event.currentTarget.setPointerCapture(pointerId);
    sidebarResizeRef.current = {
      startX: event.clientX,
      startWidth: sidebarWidth,
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - sidebarResizeRef.current.startX;
      const nextWidth = Math.max(
        SUPPORT_SIDEBAR_MIN_WIDTH,
        Math.min(SUPPORT_SIDEBAR_MAX_WIDTH, sidebarResizeRef.current.startWidth + deltaX),
      );
      setSidebarWidth(nextWidth);
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const isCreateDisabled = ticketTitle.trim().length === 0 || ticketDescription.trim().length === 0;
  const isInitialTopicsLoading =
    !topicsQuery.data && (topicsQuery.isPending || topicsQuery.isLoading || topicsQuery.isFetching);
  const showTopicShell = isInitialTopicsLoading || topicsQuery.isError || Boolean(activeTopic);
  const emptyTitle = isSearching ? 'No matching support topics' : 'No support topics are available yet';
  const emptyDescription = isSearching
    ? 'Try another keyword or clear the search to browse all published support topics.'
    : 'Support guidance has not been published yet. Please check back later or create a ticket if you need help right now.';
  const shouldShowSearchSuggestions = isSearchFocused && searchTerm.trim().length > 0;

  const handleSelectSearchSuggestion = (suggestion: SupportSearchSuggestion) => {
    setActiveTopicId(suggestion.topic.id);
    setSelectedSearchTerm(suggestion.highlightTerm);
    setIsSearchFocused(false);
  };

  const handleFillSearchFromSuggestion = (suggestion: SupportSearchSuggestion) => {
    setSearchTerm(suggestion.fillValue);
    setDebouncedSearchTerm(suggestion.fillValue);
    setSelectedSearchTerm('');
    setIsSearchFocused(true);
    window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.setSelectionRange(suggestion.fillValue.length, suggestion.fillValue.length);
    });
  };

  return (
    <PortalHelpLayout onBack={() => navigate(dashboardPath)}>
      <div className="flex h-full min-h-0 flex-col bg-background">
        <div className="border-b border-border/70 px-8 py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(dashboardPath)}
                aria-label="Back to Dashboard"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h3 className="mb-1 text-2xl font-bold tracking-tight text-foreground">Support</h3>
                <p className="text-sm text-muted-foreground">
                  Browse support topics and read portal guidance from the shared knowledge base.
                </p>
              </div>
            </div>
            <div className="flex w-full flex-col gap-3 lg:w-auto lg:min-w-[420px] lg:flex-row lg:items-center lg:justify-end">
              <div className="relative w-full lg:w-[360px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    setSelectedSearchTerm('');
                  }}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => window.setTimeout(() => setIsSearchFocused(false), 120)}
                  placeholder="Search support topics and FAQs"
                  className="h-11 rounded-md pl-10 pr-10"
                  aria-label="Search support topics and FAQs"
                />
                {topicsQuery.isFetching && searchTerm.trim() ? (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                ) : searchTerm ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-9 w-9 -translate-y-1/2 rounded-lg"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedSearchTerm('');
                    }}
                    aria-label="Clear support topic search"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                ) : null}
                {shouldShowSearchSuggestions ? (
                  <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border/70 bg-background shadow-xl">
                    <div className="max-h-80 overflow-y-auto py-2">
                      {topicsQuery.isFetching && allSupportTopics.length === 0 ? (
                        <div className="flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Searching topics...
                        </div>
                      ) : searchSuggestions.length > 0 ? (
                        searchSuggestions.map((suggestion) => (
                          <button
                            key={suggestion.id}
                            type="button"
                            className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/70 focus:bg-muted/70 focus:outline-none"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => handleSelectSearchSuggestion(suggestion)}
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-foreground">
                                {suggestion.label}
                              </span>
                              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                                {getSearchMatchSourceLabel(suggestion.matchSource)} - {suggestion.topic.title}
                              </span>
                            </span>
                            <span
                              role="button"
                              tabIndex={0}
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={(event) => {
                                event.stopPropagation();
                                handleFillSearchFromSuggestion(suggestion);
                              }}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  handleFillSearchFromSuggestion(suggestion);
                                }
                              }}
                              aria-label={`Fill search with ${suggestion.fillValue}`}
                            >
                              <ArrowUpLeft className="h-4 w-4" />
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-muted-foreground">
                          No matching support topics or FAQs found.
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
              <Button onClick={() => setIsCreateTicketOpen(true)} className="gap-2 self-start lg:self-auto">
                <Paperclip className="h-4 w-4" />
                Create Ticket
              </Button>
            </div>
          </div>
        </div>

        {showTopicShell ? (
          <div className="flex min-h-0 flex-1">
            <aside
              className="relative hidden shrink-0 border-r border-border/70 bg-background xl:block"
              style={{ width: sidebarWidth }}
            >
              <ScrollArea className="h-full">
                <PortalSupportTopicsSidebar
                  orderedCategories={orderedCategories}
                  topicsByCategory={topicsByCategory}
                  activeTopicId={resolvedActiveTopicId}
                  onSelectTopic={setActiveTopicId}
                />
              </ScrollArea>
              <button
                type="button"
                className="absolute inset-y-0 -right-1 z-20 w-2 cursor-col-resize border-0 bg-transparent p-0 outline-none"
                onPointerDown={handleSidebarResizePointerDown}
                aria-label="Resize support topics sidebar"
                title="Resize sidebar"
              />
            </aside>

            <section className="min-w-0 flex-1 overflow-hidden">
              {isInitialTopicsLoading ? (
                <div className="flex min-h-[420px] items-center justify-center px-6 py-10 text-sm text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    Loading support topics...
                  </div>
                </div>
              ) : topicsQuery.isError ? (
                <div className="px-8 py-8 text-sm text-muted-foreground">
                  Unable to load support topics right now.
                </div>
              ) : activeTopic ? (
                <>
                  <Sheet open={isTopicSidebarOpen} onOpenChange={setIsTopicSidebarOpen}>
                    <SheetContent side="left" className="w-[88vw] max-w-sm p-0">
                      <SheetHeader className="border-b border-border/70 px-6 py-5 text-left">
                        <SheetTitle>Support Topics</SheetTitle>
                        <SheetDescription>
                          Browse available support topics and switch between articles.
                        </SheetDescription>
                      </SheetHeader>

                      <ScrollArea className="h-[calc(100vh-89px)]">
                        <PortalSupportTopicsSidebar
                          orderedCategories={orderedCategories}
                          topicsByCategory={topicsByCategory}
                          activeTopicId={resolvedActiveTopicId}
                          onSelectTopic={(topicId) => {
                            setActiveTopicId(topicId);
                            setIsTopicSidebarOpen(false);
                          }}
                        />
                      </ScrollArea>
                    </SheetContent>
                  </Sheet>

                  <PortalSupportTopicView
                    topic={activeTopic}
                    highlightTerm={selectedSearchTerm}
                    onOpenTopics={() => setIsTopicSidebarOpen(true)}
                  />
                </>
              ) : (
                <div className="flex min-h-[420px] items-center justify-center rounded-3xl px-6 py-10">
                  <div className="mx-auto flex max-w-md flex-col items-center text-center">
                    <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary shadow-sm">
                      <BookOpen className="h-8 w-8" />
                    </div>
                    <h2 className="text-2xl font-semibold tracking-tight text-foreground">{emptyTitle}</h2>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{emptyDescription}</p>
                  </div>
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="flex min-h-[420px] items-center justify-center rounded-3xl px-6 py-10">
            <div className="mx-auto flex max-w-md flex-col items-center text-center">
              <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary shadow-sm">
                <BookOpen className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">{emptyTitle}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{emptyDescription}</p>
            </div>
          </div>
        )}
      </div>

      <Dialog open={isCreateTicketOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Ticket</DialogTitle>
            <DialogDescription>
              Share the issue details and add attachments like images, videos, or supporting files.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="ticket-title">Title</Label>
              <Input
                id="ticket-title"
                value={ticketTitle}
                onChange={(event) => setTicketTitle(event.target.value)}
                placeholder="Enter ticket title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticket-description">Description</Label>
              <Textarea
                id="ticket-description"
                value={ticketDescription}
                onChange={(event) => setTicketDescription(event.target.value)}
                placeholder="Describe the issue in detail"
                className="min-h-[140px]"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Label htmlFor="ticket-attachments">Attachments</Label>
                  <p className="text-sm text-muted-foreground">
                    Upload screenshots, videos, documents, or other supporting files.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() => attachmentInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  Add Files
                </Button>
              </div>

              <Input
                id="ticket-attachments"
                ref={attachmentInputRef}
                type="file"
                multiple
                className="hidden"
                accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                onChange={handleAttachmentsChange}
              />

              {attachments.length > 0 ? (
                <div className="space-y-2 rounded-2xl border border-border/70 bg-muted/20 p-4">
                  {attachments.map((file, index) => (
                    <div
                      key={`${file.name}-${file.lastModified}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveAttachment(index)}
                        aria-label={`Remove ${file.name}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                  No attachments added yet.
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleDialogOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleCreateTicket} disabled={isCreateDisabled}>
              Create Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PortalHelpLayout>
  );
};

interface PortalSupportTopicsSidebarProps {
  orderedCategories: string[];
  topicsByCategory: Record<string, SupportTopic[]>;
  activeTopicId: string;
  onSelectTopic: (topicId: string) => void;
}

function PortalSupportTopicsSidebar({
  orderedCategories,
  topicsByCategory,
  activeTopicId,
  onSelectTopic,
}: PortalSupportTopicsSidebarProps) {
  return (
    <div className="space-y-4 p-6">
      {orderedCategories.map((category) => (
        <div key={category} className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {category}
          </p>
          {topicsByCategory[category].map((topic) => {
            const isActive = topic.id === activeTopicId;
            return (
              <button
                key={topic.id}
                type="button"
                onClick={() => onSelectTopic(topic.id)}
                className={cn(
                  'w-full rounded-lg px-4 py-2 text-left text-sm transition-all',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                    : 'text-foreground hover:bg-muted/70',
                )}
              >
                {topic.title}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function PortalSupportTopicView({
  topic,
  highlightTerm,
  onOpenTopics,
}: {
  topic: SupportTopic;
  highlightTerm: string;
  onOpenTopics: () => void;
}) {
  const topicFaqs = topic.faqs;
  const normalizedHighlightTerm = normalizeSearchText(highlightTerm);
  const highlightedFaq = useMemo(() => {
    if (!normalizedHighlightTerm) return undefined;

    const matchedFaq = topicFaqs.find((faq) => {
      const questionMatches = faq.question.toLowerCase().includes(normalizedHighlightTerm);
      const answerMatches = getPlainTextFromHtml(faq.answer).toLowerCase().includes(normalizedHighlightTerm);
      return questionMatches || answerMatches;
    });

    if (!matchedFaq) return undefined;

    return {
      id: matchedFaq.id,
      questionMatches: matchedFaq.question.toLowerCase().includes(normalizedHighlightTerm),
    };
  }, [normalizedHighlightTerm, topicFaqs]);
  const highlightedFaqId = highlightedFaq?.id;
  const [openFaqId, setOpenFaqId] = useState<string | undefined>();

  useEffect(() => {
    setOpenFaqId(highlightedFaqId);
  }, [highlightedFaqId, topic.id]);

  useEffect(() => {
    if (!highlightedFaqId || !highlightedFaq?.questionMatches) return;

    const timeoutId = window.setTimeout(() => {
      const item = document.querySelector<HTMLElement>(
        `[data-support-faq-id="${CSS.escape(highlightedFaqId)}"]`,
      );
      item?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      item?.focus({ preventScroll: true });
    }, 260);

    return () => window.clearTimeout(timeoutId);
  }, [highlightedFaq?.questionMatches, highlightedFaqId]);

  return (
    <div className="h-full min-h-0 bg-background">
      <ScrollArea className="h-full">
        <div className="px-8 py-8">
          <div className="mb-4 xl:hidden">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-11 w-11 rounded-xl border border-border/70"
              onClick={onOpenTopics}
              aria-label="Open support topics"
            >
              <PanelLeft className="h-5 w-5" />
            </Button>
          </div>

          <div className="mb-6">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">{topic.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Updated at {formatSupportTimestamp(topic.updatedAt)}
            </p>
          </div>
          <HighlightedRichTextContent
            html={topic.description}
            highlightTerm={highlightTerm}
            shouldFocus={Boolean(normalizedHighlightTerm) && !highlightedFaqId}
            className={RICH_TEXT_CHROMELESS_MEDIA_CLASS}
          />

          <div className="mt-8 border-t border-border/70 pt-6">
            <h2 className="mb-2 text-2xl font-semibold tracking-tight text-foreground">FAQs</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Common questions related to this support topic.
            </p>

            {topicFaqs.length > 0 ? (
              <Accordion
                type="single"
                collapsible
                value={openFaqId}
                onValueChange={setOpenFaqId}
                className="space-y-4"
              >
                {topicFaqs.map((faq) => (
                  <AccordionItem
                    key={faq.id}
                    value={faq.id}
                    data-support-faq-id={faq.id}
                    tabIndex={-1}
                    className="overflow-hidden rounded-md border border-border/70 bg-background shadow-sm"
                  >
                    <AccordionTrigger className="px-6 py-5 text-left text-base font-medium text-foreground hover:no-underline">
                      <HighlightedPlainText
                        text={faq.question}
                        highlightTerm={highlightTerm}
                        className="truncate"
                      />
                    </AccordionTrigger>
                    <AccordionContent>
                      <CardContent className="border-t border-border/70 px-6 py-5">
                        <HighlightedRichTextContent
                          html={faq.answer}
                          highlightTerm={highlightTerm}
                          shouldFocus={faq.id === highlightedFaqId}
                          className={RICH_TEXT_CHROMELESS_MEDIA_CLASS}
                        />
                      </CardContent>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="rounded-md border border-border/70 px-6 py-8 text-sm text-muted-foreground shadow-sm">
                No FAQs have been added for this support topic yet.
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

function HighlightedRichTextContent({
  html,
  className,
  highlightTerm,
  shouldFocus,
}: {
  html?: string | null;
  className?: string;
  highlightTerm: string;
  shouldFocus: boolean;
}) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || !normalizeSearchText(highlightTerm)) return;

    const timeoutId = window.setTimeout(() => {
      const mark = highlightFirstTextMatch(wrapper, highlightTerm);
      if (!mark || !shouldFocus) return;

      mark.tabIndex = -1;
      mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
      mark.focus({ preventScroll: true });
    }, shouldFocus ? 260 : 0);

    return () => window.clearTimeout(timeoutId);
  }, [highlightTerm, html, shouldFocus]);

  return (
    <div ref={wrapperRef}>
      <RichTextContent
        key={`${highlightTerm}-${html ? html.length : 0}`}
        html={html}
        className={className}
      />
    </div>
  );
}

function HighlightedPlainText({
  text,
  highlightTerm,
  className,
}: {
  text: string;
  highlightTerm: string;
  className?: string;
}) {
  const normalizedHighlightTerm = normalizeSearchText(highlightTerm);
  const matchIndex = normalizedHighlightTerm
    ? text.toLowerCase().indexOf(normalizedHighlightTerm)
    : -1;

  if (matchIndex < 0) {
    return <span className={className}>{text}</span>;
  }

  const beforeMatch = text.slice(0, matchIndex);
  const match = text.slice(matchIndex, matchIndex + normalizedHighlightTerm.length);
  const afterMatch = text.slice(matchIndex + normalizedHighlightTerm.length);

  return (
    <span className={className}>
      {beforeMatch}
      <mark className="rounded bg-amber-200 px-0.5 text-foreground ring-2 ring-amber-300/70">
        {match}
      </mark>
      {afterMatch}
    </span>
  );
}

export default PortalSupportPage;
