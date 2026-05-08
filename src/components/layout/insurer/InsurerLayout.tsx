import React, { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { apiGet, apiPatch } from '@/lib/api/client';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { useToast } from '@/shared/hooks/use-toast';
import { UnsavedChangesProvider } from '@/shared/hooks/use-unsaved-changes';
import { useMarketThemeStore } from '@/shared/stores/useMarketThemeStore';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import auraLogo from '/lovable-uploads/a1521c76-be1d-45e9-8d86-5df99d190608.png';
import { SharedNotificationBell, NotificationItem } from '@/components/layout/SharedNotificationBell';
import {
    normalizeNotificationEventKind,
    shouldOpenChatFromNotification,
} from '@/shared/notifications/notificationEventKinds';
import { formatDistanceToNow } from 'date-fns';

// Components being switched manually via routing/layout logic
import InsurerUserManagement from '@/features/insurers/pages/InsurerUserManagement';
import InsurerProductConfig from '@/features/product-config/pages/InsurerProductConfig';
import InsurerBrokerAssignments from '@/features/insurers/pages/InsurerBrokerAssignments';
import InsurerEndorsements from '@/features/insurers/pages/InsurerEndorsements';

import { InsurerSidebar } from './InsurerSidebar';

/** Replace backend "Technical"/"Non-Technical" labels with "Financial"/"Non-Financial" in notification text. */
function normalizeEndorsementLabels(text: string): string {
    if (!text) return text;
    return text
        .replace(/\bNon[-_\s]?Technical\b/gi, 'Non-Financial')
        .replace(/\bTechnical\b/gi, 'Financial');
}

export function InsurerLayout() {
    const { toast } = useToast();
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const { theme: marketTheme } = useMarketThemeStore();
    const { user: authUser } = useAuthStore();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);

    const displayLogo = marketTheme?.logoUrl;
    const isReinsurer = authUser?.userType === 'REINSURER';

    useEffect(() => {
        if (!notifications || notifications.length === 0) return;

        // Pattern matching for referral or endorsement IDs to mark related notifications as read
        const patterns = [
            /\/referral\/([^\/\?]+)/,
            /\/endorsements\/view\/([^\/\?]+)/,
            /\/endorsement\/([^\/\?]+)/
        ];

        let subjectId: string | null = null;
        for (const pattern of patterns) {
            const match = pathname.match(pattern);
            if (match && match[1]) {
                subjectId = match[1];
                break;
            }
        }

        if (subjectId) {
            const unreadForSubject = notifications.filter(
                (n) => String(n.subjectId) === String(subjectId) && !n.isRead
            );

            if (unreadForSubject.length > 0) {
                const ids = unreadForSubject.map((n) => String(n.id));
                // Direct call to API
                apiPatch('/notifications/read', { ids }).catch((err) => {
                    console.error('Failed to mark notifications read from layout:', err);
                });

                // Optimistically update local state so the bell count updates immediately
                setNotifications((prev) =>
                    prev.map((n) => (ids.includes(String(n.id)) ? { ...n, isRead: true } : n))
                );
            }
        }
    }, [pathname, notifications]);

    const fetchNotifications = useCallback(async () => {
        try {
            const response = await apiGet('/notifications/unread-count');
            const referralNotifs = (response as any)?.referral?.notifications || [];
            const endorsementNotifs = (response as any)?.endorsement?.notifications || [];

            const allNotifs = [...referralNotifs, ...endorsementNotifs];

            // Map API response to NotificationItem format
            const formattedNotifs: NotificationItem[] = allNotifs.map((n: any) => {
                let status = 'received';
                if (n.eventKind?.includes('APPROVED') || n.eventKind?.includes('ACCEPT')) status = 'approved';
                if (n.eventKind?.includes('REJECTED') || n.eventKind?.includes('DECLINE')) status = 'rejected';

                return {
                    id: n.id || Math.random().toString(),
                    type: n.domain || 'notification',
                    status,
                    message: normalizeEndorsementLabels(n.title || 'New Notification'),
                    details: normalizeEndorsementLabels(n.body || ''),
                    who: n.actor ? `${n.actor.name} (${n.actor.userType})` : '',
                    when: n.createdAt ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: true }) : '',
                    reference: n.subjectLabel || '',
                    isRead: n.isRead || false,
                    subjectId: n.subjectId,
                    createdAt: n.createdAt,
                    eventKind: n.eventKind || '',
                };
            });

            // Sort by newest first
            formattedNotifs.sort((a, b) => {
                return (new Date(b.createdAt || Date.now()).getTime() - new Date(a.createdAt || Date.now()).getTime());
            });

            setNotifications(formattedNotifs);
        } catch (error) {
            console.error('Failed to fetch unread notifications:', error);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();

        // Polling every 60 seconds
        const intervalId = setInterval(fetchNotifications, 60000);
        return () => clearInterval(intervalId);
    }, [fetchNotifications]);

    useEffect(() => {
        void fetchNotifications();
    }, [pathname, fetchNotifications]);

    useEffect(() => {
        const onFocus = () => {
            void fetchNotifications();
        };
        const onVisibility = () => {
            if (document.visibilityState === 'visible') {
                void fetchNotifications();
            }
        };

        window.addEventListener('focus', onFocus);
        document.addEventListener('visibilitychange', onVisibility);
        return () => {
            window.removeEventListener('focus', onFocus);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, [fetchNotifications]);

    return (
        <UnsavedChangesProvider>
            <SidebarProvider>
                <div className="flex min-h-screen w-full bg-background">
                    <InsurerSidebar />
                    <div className="flex-1 flex flex-col min-w-0">
                        <header className="h-16 flex items-center border-b bg-primary/5 shadow-sm">
                            <div className="flex items-center gap-4 px-6 w-full">
                                <SidebarTrigger className="hover:bg-muted/50 transition-colors" />
                                <div className="flex-1">
                                    <h1 className="text-xl font-bold text-foreground">Underwriter Portal</h1>
                                    <p className="text-sm text-muted-foreground">
                                        Insurance underwriter management platform
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <SharedNotificationBell 
                                        notifications={notifications} 
                                        onNotificationClick={(n) => {
                                            let path = '';
                                            const targetId = n.subjectId || n.id;
                                            const shouldOpenMessage = shouldOpenChatFromNotification(n.eventKind);
                                            const eventKind = normalizeNotificationEventKind(n.eventKind);

                                            const type = n.type?.toLowerCase();

                                            const isEndorsement = type === 'endorsement' || type === 'endorsements' || eventKind.includes('ENDORSEMENT');
                                            const isReferral = type === 'referral' || type === 'referrals' || eventKind.includes('REFERRAL') || (!isEndorsement && (eventKind.includes('QUERY') || eventKind.includes('CHAT')));

                                            if (isEndorsement) {
                                                path = `/insurer/endorsements/view/${targetId}`;
                                            } else if (isReferral) {
                                                path = `/insurer/referral/${targetId}`;
                                            }
                                            
                                            if (shouldOpenMessage && path) {
                                                path += '?openMessage=true';
                                            }
                                            
                                            if (path) {
                                                navigate(path);
                                            }
                                        }} 
                                    />
                                    {/* {!isReinsurer && (
                                        <img
                                            src={displayLogo}
                                            alt="Market Logo"
                                            className="h-10 w-auto mr-4"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = auraLogo;
                                            }}
                                        />
                                    )} */}
                                </div>
                            </div>
                        </header>
                        <main className="flex-1 overflow-hidden">
                            {location.pathname === '/insurer/user-management' ? (
                                <InsurerUserManagement />
                            ) : location.pathname === '/insurer/product-config' ? (
                                <InsurerProductConfig />
                            ) : location.pathname === '/insurer/broker-assignments' ? (
                                <InsurerBrokerAssignments />
                            ) : location.pathname === '/insurer/endorsements' ? (
                                <InsurerEndorsements />
                            ) : (
                                <Outlet />
                            )}
                        </main>
                    </div>
                </div>
            </SidebarProvider>
        </UnsavedChangesProvider>
    );
}
