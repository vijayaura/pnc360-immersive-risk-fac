import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { MessageSquare, X, Send, User, Paperclip, Plus, Loader2, FileText, Download } from 'lucide-react';
import { ChatMessage } from '@/features/quotes/api/quotes';
import { toast } from '@/components/ui/sonner';
import { validateChatFile, CHAT_FILE_ACCEPT, downloadChatAttachment } from '@/shared/utils/fileUtils';
import { formatDateTimeDDMMYYYY } from '@/shared/utils/date-format';

interface ReferralChatProps {
    referralId: string;
    isExpanded: boolean;
    onToggle: () => void;
    messages: ChatMessage[];
    unreadCount: number;
    userRole: 'insurer' | 'broker';
    onSendQuery?: (message: string, files: File[]) => Promise<void>;
    onSyncReadStatus?: () => Promise<void>;
}

export const ReferralChat = React.memo(
    ({
        referralId,
        isExpanded,
        onToggle,
        messages,
        unreadCount,
        userRole,
        onSendQuery,
        onSyncReadStatus,
    }: ReferralChatProps) => {
        const [newQueryDescription, setNewQueryDescription] = useState('');
        const [newQueryAttachments, setNewQueryAttachments] = useState<File[]>([]);
        const [querySubmitting, setQuerySubmitting] = useState(false);
        const [locallyReadMessageIds, setLocallyReadMessageIds] = useState<Set<string>>(new Set());
        const queryAttachmentInputRef = useRef<HTMLInputElement | null>(null);
        const chatScrollAreaRef = useRef<HTMLDivElement | null>(null);
        const markVisibleUnreadAsReadRef = useRef<() => void>(() => {});
        const onSyncReadStatusRef = useRef<(() => void | Promise<void>) | undefined>(undefined);
        const firstUnreadIncomingMessageIdRef = useRef<string | null>(null);
        const lastMessageTailIdRef = useRef<string | null>(null);

        const unreadIncomingMessageIds = useMemo(
            () =>
                messages
                    .filter((msg) => {
                        if (msg.senderRole === userRole) return false;
                        const readAt = userRole === 'broker' ? msg.brokerReadAt : msg.insurerReadAt;
                        return !readAt;
                    })
                    .map((msg) => msg.id)
                    .filter((id) => !locallyReadMessageIds.has(id)),
            [messages, userRole, locallyReadMessageIds],
        );
        const firstUnreadIncomingMessageId = unreadIncomingMessageIds[0] ?? null;
        const floatingUnreadCount = isExpanded ? unreadIncomingMessageIds.length : unreadCount;

        const markVisibleUnreadAsRead = useCallback(() => {
            if (unreadIncomingMessageIds.length === 0) return;
            setLocallyReadMessageIds((prev) => {
                const next = new Set(prev);
                unreadIncomingMessageIds.forEach((id) => next.add(id));
                return next;
            });
        }, [unreadIncomingMessageIds]);

        markVisibleUnreadAsReadRef.current = markVisibleUnreadAsRead;
        onSyncReadStatusRef.current = onSyncReadStatus;
        firstUnreadIncomingMessageIdRef.current = firstUnreadIncomingMessageId;

        const getChatViewport = (): HTMLDivElement | null => {
            const root = chatScrollAreaRef.current;
            if (!root) return null;
            return root.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement | null;
        };

        // Stable scroll listener: do not re-attach when read-state / message metadata changes
        // (that was re-running scrollToTarget and causing flicker when scrolling up).
        useEffect(() => {
            if (!isExpanded) return;
            const viewport = getChatViewport();
            if (!viewport) return;

            const onScroll = () => {
                const distanceFromBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
                if (distanceFromBottom <= 16) {
                    markVisibleUnreadAsReadRef.current();
                    const sync = onSyncReadStatusRef.current;
                    if (sync) void sync();
                }
            };

            viewport.addEventListener('scroll', onScroll, { passive: true });
            return () => viewport.removeEventListener('scroll', onScroll);
        }, [isExpanded]);

        // Auto-scroll logic: ensures we scroll to bottom (or first unread) on open and on new message.
        useEffect(() => {
            if (!isExpanded) {
                lastMessageTailIdRef.current = null;
                return;
            }
            if (messages.length === 0) return;

            const run = () => {
                const viewport = getChatViewport();
                if (!viewport) return;

                const lastId = messages[messages.length - 1]?.id ?? '';
                const prevTail = lastMessageTailIdRef.current;
                const isFirstContent = prevTail === null && Boolean(lastId);

                const unreadId = firstUnreadIncomingMessageIdRef.current;

                if (isFirstContent && unreadId) {
                    const firstUnreadEl = viewport.querySelector(
                        `[data-chat-message-id="${unreadId}"]`
                    ) as HTMLDivElement | null;
                    if (firstUnreadEl) {
                        firstUnreadEl.scrollIntoView({ block: 'center', behavior: 'auto' });
                    } else {
                        viewport.scrollTop = viewport.scrollHeight;
                    }
                } else {
                    // For new messages or if no unread, simply force scroll to bottom
                    viewport.scrollTop = viewport.scrollHeight;
                }

                lastMessageTailIdRef.current = lastId;
            };

            // Wait a bit to ensure the DOM and Radix ScrollArea have fully updated
            const timer = setTimeout(() => {
                requestAnimationFrame(run);
            }, 100);

            return () => clearTimeout(timer);
        }, [isExpanded, messages.length]);

        const handleQueryFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
            const files = event.target.files;
            if (!files || files.length === 0) return;
            const acceptedFiles: File[] = [];
            Array.from(files).forEach((file) => {
                const result = validateChatFile(file);
                if (result.valid) {
                    acceptedFiles.push(file);
                } else {
                    toast.error('File rejected', { description: result.error });
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
            if (!onSendQuery || querySubmitting) return;
            if (!newQueryDescription.trim() && newQueryAttachments.length === 0) return;

            try {
                setQuerySubmitting(true);
                await onSendQuery(newQueryDescription.trim(), newQueryAttachments);
                setNewQueryDescription('');
                setNewQueryAttachments([]);
                if (queryAttachmentInputRef.current) {
                    queryAttachmentInputRef.current.value = '';
                }
            } finally {
                setQuerySubmitting(false);
            }
        };

        if (!isExpanded) {
            return (
                <div className="fixed bottom-10 right-10 z-[100] group">
                    <div className="relative">
                        <Button
                            onClick={onToggle}
                            className="h-14 w-14 group-hover:w-[13.5rem] rounded-full shadow-lg flex items-center justify-start overflow-hidden bg-primary hover:bg-primary/90 text-primary-foreground border-0 transition-all duration-300 ease-in-out p-0"
                        >
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center">
                                <MessageSquare className="h-7 w-7" />
                            </div>
                            <span className="font-medium whitespace-nowrap opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100 pr-6">
                                Referral Chat
                            </span>
                        </Button>
                        {floatingUnreadCount > 0 && (
                            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-red-500 text-white border-0 shadow-sm pointer-events-none">
                                {floatingUnreadCount}
                            </Badge>
                        )}
                    </div>
                </div>
            );
        }
        

        return (
            <div className="fixed bottom-6 right-6 z-50 w-[400px] h-[700px] flex flex-col shadow-2xl rounded-lg overflow-hidden bg-white border border-gray-200">
                <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        <h3 className="text-base font-semibold">Queries & Communication</h3>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onToggle}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div
                    className="flex-1 flex flex-col p-0 overflow-hidden relative"
                    style={{
                        backgroundImage: `radial-gradient(circle, rgba(0,0,0,0.08) 1.5px, transparent 1.5px)`,
                        backgroundSize: '24px 24px',
                        backgroundColor: '#f9fafb',
                    }}
                >
                    <ScrollArea ref={chatScrollAreaRef} className="flex-1 px-4 py-4">
                        {messages.length > 0 ? (
                            <div className="space-y-4">
                                {messages.map((msg) => {
                                    const isMine = msg.senderRole === userRole;
                                    return (
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
                                                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div className="max-w-[80%]">
                                                    <div
                                                        className={`rounded-lg px-4 py-3 shadow-md border ${isMine
                                                            ? 'bg-primary text-primary-foreground border-transparent'
                                                            : 'bg-white text-gray-900 border-gray-200'
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between mb-1">
                                                            <div className="flex items-center gap-2">
                                                                <User
                                                                    className={`w-3 h-3 ${isMine ? 'text-white' : 'text-gray-600'}`}
                                                                />
                                                                <span
                                                                    className={`text-xs font-medium ${isMine ? 'text-white' : 'text-gray-700'}`}
                                                                >
                                                                    {isMine ? 'You' : userRole === 'broker' ? 'Insurer' : 'Broker'}
                                                                </span>
                                                            </div>
                                                            <Badge
                                                                variant={isMine ? 'secondary' : 'default'}
                                                                className={`text-xs ml-2 ${isMine ? 'bg-white/20 text-white hover:bg-white/30' : ''}`}
                                                            >
                                                                {isMine ? 'Sent' : 'Received'}
                                                            </Badge>
                                                        </div>

                                                        {msg.message && msg.message !== 'Shared file(s)' && (
                                                            <p
                                                                className={`text-sm leading-relaxed break-all whitespace-pre-wrap ${isMine ? 'text-white' : 'text-gray-800'}`}
                                                            >
                                                                {msg.message}
                                                            </p>
                                                        )}

                                                        {msg.attachments && msg.attachments.length > 0 && (
                                                            <div className="mt-2 space-y-2">
                                                                {msg.attachments.map((att) => {
                                                                    const isImage = att.documentType?.startsWith('image/') ||
                                                                        /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(att.documentName || '');
                                                                    return isImage ? (
                                                                        <div key={att.id} className="relative group inline-block">
                                                                            <img
                                                                                src={att.documentUrl}
                                                                                alt={att.documentName}
                                                                                className="max-w-[200px] max-h-[150px] rounded border object-cover"
                                                                            />
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => downloadChatAttachment(referralId, att.id)}
                                                                                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded cursor-pointer"
                                                                            >
                                                                                <Download className="h-6 w-6 text-white" />
                                                                            </button>
                                                                        </div>
                                                                    ) : (
                                                                        <button
                                                                            key={att.id}
                                                                            type="button"
                                                                            onClick={() => downloadChatAttachment(referralId, att.id)}
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

                                                        <div className={`text-xs mt-2 ${isMine ? 'opacity-70 text-white' : 'text-gray-500'}`}>
                                                            {msg.createdAt ? formatDateTimeDDMMYYYY(msg.createdAt) : '-'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center py-12">
                                <MessageSquare className="w-12 h-12 text-gray-300 mb-4" />
                                <p className="text-sm text-gray-500 font-medium">No queries yet</p>
                                <p className="text-xs text-gray-400 mt-1">Start a conversation by sending a query</p>
                            </div>
                        )}
                    </ScrollArea>
                </div>

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
                                    <Badge key={`${file.name}-${file.size}-${index}`} variant="secondary" className="gap-1 pr-1">
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
                                disabled={querySubmitting || !onSendQuery}
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
                                    !onSendQuery
                                }
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
        );
    },
);
