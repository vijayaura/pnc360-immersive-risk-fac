import React, { useState } from 'react';
import { Bell, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { apiPatch } from '@/lib/api/client';

export type NotificationItem = {
    id: string | number;
    type: 'referral' | 'endorsement' | string;
    status?: 'received' | 'approved' | 'rejected' | string;
    message: string;
    details?: string;
    who?: string;
    when?: string;
    reference?: string;
    isRead?: boolean;
    [key: string]: any;
};

interface SharedNotificationBellProps {
    notifications: NotificationItem[];
    onNotificationClick: (notification: NotificationItem, openMessage?: boolean) => void;
}

export function SharedNotificationBell({ notifications, onNotificationClick }: SharedNotificationBellProps) {
    const [isOpen, setIsOpen] = useState(false);
    // Keep local state for INSTANT optimistic UI updates so the red dot disappears immediately
    const [optimisticallyReadIds, setOptimisticallyReadIds] = useState<Set<string>>(new Set());

    const handleNotificationClick = async (n: NotificationItem, openMessage?: boolean) => {
        // Collect all related unread notification IDs by subjectId, or just this single one
        const relatedIds = n.subjectId
            ? notifications.filter(notif => notif.subjectId === n.subjectId && !notif.isRead).map(notif => String(notif.id))
            : [String(n.id)];

        // 1. Optimistically hide the red dot instantly for a snappy UI
        setOptimisticallyReadIds(prev => {
            const next = new Set(prev);
            relatedIds.forEach(id => next.add(id));
            return next;
        });

        // 2. Close the popover BEFORE navigating so it doesn't float on top of the details page
        setIsOpen(false);

        // 3. Fire the actual backend API request
        if (relatedIds.length > 0) {
            try {
                await apiPatch(`/notifications/read`, {
                    ids: relatedIds,
                });
            } catch (err) {
                console.error('Failed to mark notifications as read on the backend', err);
            }
        }

        onNotificationClick(n, openMessage);
    };

    const effectiveNotifications = notifications?.map(n => ({
        ...n,
        isRead: optimisticallyReadIds.has(String(n.id)) ? true : n.isRead,
    })) || [];

    const unreadCount = effectiveNotifications.filter(n => n.isRead === false).length;

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" className="relative group h-10 w-10 p-1 mr-6 mt-1.5 rounded-full bg-muted/60 border border-border hover:bg-primary/10 hover:border-primary/40 transition-all">
                    <Bell className="!h-5 !w-5 text-foreground/80 group-hover:text-primary transition-colors cursor-pointer" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full p-0 text-[10px]"
                        >
                            {unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[480px] p-0">
                <div className="border-b px-4 py-3">
                    <h4 className="font-semibold">Notifications</h4>
                </div>
                <ScrollArea className="h-[450px]">
                    <div className="flex flex-col">
                        {effectiveNotifications.length === 0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                No new notifications
                            </div>
                        ) : (
                            effectiveNotifications.map((n) => (
                                <div
                                    key={n.id}
                                    className={`relative flex flex-col gap-1 border-b p-4 pl-7 last:border-b-0 transition-colors cursor-pointer ${
                                        n.isRead === false ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/50'
                                    }`}
                                    onClick={() => handleNotificationClick(n, false)}
                                >
                                    {n.isRead === false && (
                                        <span className="absolute left-3 top-5 h-2 w-2 rounded-full bg-destructive" />
                                    )}
                                    <div className="flex items-start justify-between">
                                        <span
                                            className="font-medium text-sm flex items-center gap-2 hover:text-primary transition-colors"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleNotificationClick(n, true);
                                            }}
                                        >
                                            {n.status === 'approved' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                                            {n.status === 'rejected' && <XCircle className="h-4 w-4 text-red-500" />}
                                            {n.status === 'received' && <Clock className="h-4 w-4 text-yellow-500" />}
                                            {n.message}
                                        </span>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">{n.when}</span>
                                    </div>
                                    {n.details && <p className="text-xs text-muted-foreground mt-1">{n.details}</p>}
                                    {(n.reference || n.who) && (
                                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-muted/50">
                                            {n.reference ? (
                                                <span className="text-[10px] bg-muted px-2 py-0.5 rounded flex-shrink-0">
                                                    {n.reference}
                                                </span>
                                            ) : (
                                                <span />
                                            )}
                                            {n.who && (
                                                <span className="text-[10px] text-muted-foreground truncate ml-2 text-right">
                                                    {n.who}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
