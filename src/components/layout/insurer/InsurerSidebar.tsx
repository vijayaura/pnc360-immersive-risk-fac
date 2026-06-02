import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    Building2,
    LayoutDashboard,
    Users,
    Shield,
    Settings,
    Bell,
    TrendingUp,
    LogOut,
    AlertTriangle,
    Upload,
    Cog,
    Calculator,
    FileEdit,
    BarChart3,
    FileText,
    Search,
    Package,
    Network,
    BookOpen,
    IdCard,
} from 'lucide-react';

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuItem,
    SidebarHeader,
    SidebarFooter,
} from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/shared/hooks/use-toast';
import { isDemoMode } from '@/lib/demo-mode';
import { logoutByRole } from '@/features/auth/api/auth';
import {
    getRefreshToken,
    getInsurerCompany,
    getInsurerCompanyId,
    setInsurerCompany,
    getAuthUser,
} from '@/lib/auth';
import { getInsurer } from '@/features/insurers/api/insurers';
import type { AuthUser } from '@/features/auth/api/auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { useAccessMatrix } from '@/shared/hooks/useAccessMatrix';
import { useMarketThemeStore } from '@/shared/stores/useMarketThemeStore';
import { getUserFriendlyMessage } from '@/lib/errorMessages';

export function CompanyLogoWithFallback({ logoUrl }: { logoUrl?: string | null }) {
    const [imageError, setImageError] = useState(false);

    if (!logoUrl || imageError) {
        return (
            <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                <Shield className="w-5 h-5 text-muted-foreground" />
            </div>
        );
    }

    return (
        <img
            src={logoUrl}
            alt="Company Logo"
            className="w-8 h-8 object-contain rounded"
            onError={() => setImageError(true)}
        />
    );
}

const sidebarItems = [
    {
        title: 'Dashboard',
        url: '/insurer/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: 'Reinsurers',
        url: '/insurer/reinsurer-management',
        icon: Network,
        show: true,
        navMatchPrefix: '/insurer/reinsurer-management',
    },
    {
        title: 'Users',
        id: 'insurerBrokerAssignments',
        url: '/insurer/user-management',
        icon: Users,
    },
    {
        title: 'Customer Profiles',
        url: '/insurer/customer-profiles',
        icon: IdCard,
    },
    {
        title: 'Product Configuration',
        id: 'productCreationManagement',
        url: '/insurer/product-config',
        icon: Cog,
    },
    {
        title: 'Broker Product Assignments',
        id: 'insurerBrokerAssignments',
        url: '/insurer/broker-assignments',
        icon: Calculator,
    },
    {
        title: "Create Broker's Quote",
        url: '/insurer/create-broker-quote',
        icon: Package,
        show: true,
    },
    {
        title: 'Endorsements',
        id: 'endorsementsManagement',
        url: '/insurer/endorsements',
        icon: FileEdit,
    },
    // {
    //     title: 'ILF Identification',
    //     url: '/insurer/ilf-identification',
    //     id: 'ilfIdentificationManagement',
    //     icon: Search,
    //     show: true,
    // },
    {
        title: 'Support',
        url: '/insurer/support',
        icon: BookOpen,
    },
    {
        title: 'Analytics & Reporting',
        id: 'analyticsReporting',
        url: '/insurer/analytics',
        icon: BarChart3,
    },
];

function toSentenceCase(value: string | null | undefined): string {
    if (!value) return '';
    const lower = value.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function InsurerSidebar() {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { logout: logoutZustand, user } = useAuthStore();
    const { toast } = useToast();
    const [loggingOut, setLoggingOut] = useState(false);
    const [logoutError, setLogoutError] = useState<string | null>(null);
    const [company, setCompany] = useState(getInsurerCompany());
    const [companyLoading, setCompanyLoading] = useState(false);
    const [companyError, setCompanyError] = useState<string | null>(null);
    const authUser = getAuthUser<AuthUser>();
    const { hasPermission, isLoading } = useAccessMatrix('insurer');
    const { theme: marketTheme } = useMarketThemeStore();

    const displayLogo = marketTheme?.logoUrl || company?.logo;
    const displayName = marketTheme?.clientName || company?.name || 'Underwriter Portal';

    const menuItems = sidebarItems.map((item) => ({
        ...item,
        isActive: item.show ? true : item.id ? hasPermission(item.id) : true,
    }));
    const supportItem = menuItems.find((item) => item.title === 'Support');
    const mainNavigationItems = menuItems.filter((item) => item.title !== 'Support');

    useEffect(() => {
        if (!company) {
            const cid = getInsurerCompanyId();
            if (cid) {
                setCompanyLoading(true);
                setCompanyError(null);
                getInsurer(cid)
                    .then((data) => {
                        const stored = {
                            id: typeof data.id === 'number' ? data.id : Number(data.id),
                            name: data.name,
                            logo: data.companyLogo ?? null,
                        };
                        setInsurerCompany(stored);
                        setCompany(stored);
                    })
                    .catch((err: unknown) => {
                        setCompanyError(
                            getUserFriendlyMessage(err, 'Unable to load company details. Please try again.'),
                        );
                    })
                    .finally(() => setCompanyLoading(false));
            }
        }
    }, []);

    const getNavCls = (isActive: boolean) =>
        isActive
            ? 'bg-primary text-primary-foreground font-semibold shadow-md'
            : 'text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all';

    const handleLogout = async () => {
        try {
            setLoggingOut(true);
            setLogoutError(null);
            const rt = getRefreshToken();
            if (rt) {
                await logoutByRole({ refreshToken: rt }, user?.role);
            }
            toast({
                title: 'Logged out',
                description: 'You have been securely logged out.',
            });
            navigate('/insurer/login');
        } catch (err: any) {
            const status = err?.status as number | undefined;
            const message = err?.message as string | undefined;
            if (status === 400) setLogoutError(message || 'Bad request.');
            else if (status === 401) setLogoutError('Session expired.');
            else if (status === 403) setLogoutError("You don't have permission to logout.");
            else if (status && status >= 500) setLogoutError('Server error. Please try again later.');
            else setLogoutError(message || 'Failed to logout.');
        } finally {
            logoutZustand();
            setLoggingOut(false);
        }
    };

    return (
        <Sidebar className="border-r border-sidebar-border shadow-xl">
            <SidebarHeader className="border-b p-6">
                <div className="flex items-center gap-3">
                    {user?.userType !== 'REINSURER' && (
                        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center overflow-hidden">
                            <CompanyLogoWithFallback logoUrl={displayLogo} />
                        </div>
                    )}
                    <div>
                        {companyLoading ? (
                            <div className="space-y-1">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-3 w-28" />
                            </div>
                        ) : (
                            <>
                                <h2 className="text-lg font-extrabold text-slate-200">
                                    {isDemoMode() ? 'Riyadh Re' : displayName}
                                </h2>
                                <p className="text-sm text-slate-400">
                                    {isDemoMode() ? 'Riyadh Re Platform' : 'P&C Platform'}
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent className="p-4">
                {companyError && (
                    <Alert variant="destructive" className="mb-3">
                        <AlertTitle>Unable to Load Company</AlertTitle>
                        <AlertDescription>{companyError}</AlertDescription>
                    </Alert>
                )}
                {logoutError && (
                    <Alert variant="destructive" className="mb-3">
                        <AlertTitle>Logout failed</AlertTitle>
                        <AlertDescription>{logoutError}</AlertDescription>
                    </Alert>
                )}
                <SidebarGroup>
                    {!isDemoMode() && (
                        <div className="mb-6 p-3 bg-primary/5 rounded-lg border">
                            {companyLoading ? (
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-40" />
                                    <Skeleton className="h-3 w-28" />
                                </div>
                            ) : (
                                <>
                                    <p className="text-sm font-semibold text-sidebar-foreground mb-1">
                                        {authUser?.name || authUser?.email || 'User'}
                                    </p>
                                    <p className="text-xs font-medium text-sidebar-foreground/80">
                                        {toSentenceCase(authUser?.user_type)}
                                    </p>
                                </>
                            )}
                        </div>
                    )}
                    <SidebarGroupLabel className="text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider mb-3">
                        Main Navigation
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        {isLoading ? (
                            <div className="space-y-2">
                                <Skeleton className="h-8 w-full" />
                                <Skeleton className="h-8 w-full" />
                                <Skeleton className="h-8 w-full" />
                            </div>
                        ) : (
                            <SidebarMenu className="space-y-2">
                                {mainNavigationItems.map((item: any) => {
                                    if (!item.isActive) return null;
                                    const prefix = item.navMatchPrefix as string | undefined;
                                    const routeActive =
                                        prefix != null &&
                                        prefix !== ''
                                            ? pathname === item.url ||
                                              pathname.startsWith(`${prefix}/`)
                                            : null;
                                    return (
                                        <SidebarMenuItem key={item.title}>
                                            <NavLink
                                                to={item.url}
                                                end={!prefix}
                                                className={({ isActive }) =>
                                                    `${getNavCls(routeActive != null ? routeActive : isActive)} flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm`
                                                }
                                            >
                                                <item.icon className="w-5 h-5" />
                                                <span className="font-medium">{item.title}</span>
                                            </NavLink>
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarMenu>
                        )}
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t p-4">
                <div className="grid grid-cols-2 gap-2">
                    {supportItem?.isActive ? (
                        <NavLink
                            to={supportItem.url}
                            end
                            className={({ isActive }) =>
                                `${getNavCls(isActive)} flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm`
                            }
                        >
                            <supportItem.icon className="w-4 h-4" />
                            <span className="font-medium">{supportItem.title}</span>
                        </NavLink>
                    ) : null}
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            variant="ghost"
                            className="w-full justify-start gap-3 px-3 py-2.5 hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200 hover:text-destructive transition-all"
                            disabled={loggingOut}
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="font-medium">{loggingOut ? 'Logging out...' : 'Log Out'}</span>
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to log out? You will need to sign in again to access your account.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleLogout}>Log Out</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}


