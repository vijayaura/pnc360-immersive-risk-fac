import React, { useCallback, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
    Building2,
    LayoutDashboard,
    Users,
    Shield,
    Settings,
    LogOut,
    Package,
    BarChart3,
    Activity,
    Layers,
    LayoutTemplate,
    BookOpen,
    Sparkles,
} from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuItem,
    SidebarHeader,
    SidebarFooter
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { useToast } from '@/shared/hooks/use-toast';
import { isDemoMode } from "@/lib/demo-mode";
import { logoutByRole } from '@/features/auth/api/auth';
import { getRefreshToken, clearAuth, getAuthUser } from "@/lib/auth";
import { useAuthStore } from '@/shared/stores/useAuthStore';

import { useMarketThemeStore } from '@/shared/stores/useMarketThemeStore';

interface SidebarItem {
    title: string;
    url: string;
    icon: React.ElementType;
    /** Extra URL prefixes that should also activate this menu item */
    matchPaths?: string[];
}

const sidebarItems: SidebarItem[] = [{
    title: "Dashboard",
    url: "/market-admin/dashboard",
    icon: LayoutDashboard
}, {
    title: "Product Studio",
    url: "/market-admin/product-management",
    icon: Package
}, {
    title: "FAC AI Studio",
    url: "/market-admin/fac-ai-studio",
    icon: Sparkles,
    matchPaths: ["/market-admin/fac-ai-studio"],
}, {
    title: "Template Management",
    url: "/market-admin/customer-template-management",
    icon: LayoutTemplate
}, {
    title: "Masters Management",
    url: "/market-admin/masters-management",
    icon: Settings
}, {
    title: "Risk Categorisation",
    url: "/market-admin/risk-categorisation",
    icon: Layers,
    matchPaths: ["/market-admin/risk-categorisation"],
}, {
    title: "Underwriter Management",
    url: "/market-admin/insurer-management",
    icon: Building2,
    matchPaths: [
        "/market-admin/insurer-management",
        "/market-admin/insurer/",
        "/market-admin/insurers",
    ]
}, {
    title: "Distributor Management",
    url: "/market-admin/broker-management",
    icon: Users,
    matchPaths: [
        "/market-admin/broker-management",
        "/market-admin/broker/",
    ]
}, {
    title: "Reinsurance Management",
    url: "/market-admin/reinsurance-management",
    icon: Shield,
    matchPaths: [
        "/market-admin/reinsurance-management",
        "/market-admin/create-reinsurer",
        "/market-admin/reinsurer/",
        "/market-admin/create-reinsurance-broker",
        "/market-admin/reinsurance-broker/",
    ]
}, {
    title: "Support",
    url: "/market-admin/support",
    icon: BookOpen
}, {
    title: "Analytics & Reporting",
    url: "/market-admin/analytics",
    icon: BarChart3
}, {
    title: "Audit Logs",
    url: "/market-admin/audit-logs",
    icon: Activity
}];

const CompanyLogoWithFallback = React.memo(function CompanyLogoWithFallback({ logoUrl }: { logoUrl?: string | null }) {
    const [imageError, setImageError] = useState(false);
    const handleError = useCallback(() => setImageError(true), []);

    if (!logoUrl || imageError) {
        return (
            <Shield className="w-5 h-5 text-muted-foreground" />
        );
    }

    return (
        <img
            src={logoUrl}
            alt="Market Logo"
            className="w-8 h-8 object-contain"
            onError={handleError}
        />
    );
});

export const MarketAdminSidebar = React.memo(function MarketAdminSidebar() {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { toast } = useToast();
    const { user } = useAuthStore();
    const authUser = getAuthUser<{ name?: string; email?: string; user_type?: string }>();
    const { theme: marketTheme } = useMarketThemeStore();

    const displayLogo = marketTheme?.logoUrl;
    const displayName = marketTheme?.clientName || "P&C Platform";
    const supportItem = sidebarItems.find(item => item.title === "Support");
    const mainNavigationItems = sidebarItems.filter(item => item.title !== "Support");

    const isItemActive = (item: SidebarItem): boolean => {
        const paths = item.matchPaths ?? [item.url];
        return paths.some(p => pathname.startsWith(p));
    };

    const getNavCls = (active: boolean) =>
        active
            ? "bg-primary text-primary-foreground font-semibold shadow-md"
            : "text-sidebar-foreground hover:bg-primary/10 hover:text-primary transition-all duration-200";

    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = useCallback(async () => {
        try {
            setIsLoggingOut(true);
            const rt = getRefreshToken();
            if (rt) {
                await logoutByRole({ refreshToken: rt }, user?.role);
            } else {
                toast({ title: 'Session expired', description: 'No refresh token found. Logging you out.' });
            }
        } catch (err: any) {
            const status = err?.status as number | undefined;
            const message = err?.message as string | undefined;
            if (status === 400) {
                toast({ title: 'Logout failed', description: message || 'Refresh token is required.' });
            }
        } finally {
            clearAuth();
            sessionStorage.clear();
            toast({ title: 'Logged out successfully' });
            navigate('/admin/login');
            setIsLoggingOut(false);
        }
    }, [user?.role, navigate, toast]);

    return <Sidebar className="border-r border-sidebar-border shadow-xl">
        <SidebarHeader className="border-b p-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center overflow-hidden">
                    {isDemoMode() ? (
                        <img src="/riyadh.png" alt="Riyadh Re" className="w-8 h-8 object-contain" />
                    ) : (
                        <CompanyLogoWithFallback logoUrl={displayLogo} />
                    )}
                </div>
                <div className="flex-1 overflow-hidden">
                    <h2 className="text-lg font-extrabold text-slate-200 truncate" title={isDemoMode() ? "Riyadh Re Platform" : displayName}>
                        {isDemoMode() ? "Riyadh Re Platform" : displayName}
                    </h2>
                    <p className="text-sm text-slate-400">Market Admin Portal</p>
                </div>
            </div>
        </SidebarHeader>

        <SidebarContent className="p-4">
            <SidebarGroup>
                <div className="mb-6 p-3 bg-primary/5 rounded-lg border">
                    <p className="text-sm font-semibold text-sidebar-foreground mb-1">
                        {authUser?.name || authUser?.email || 'Admin'}
                    </p>
                    <p className="text-xs font-medium text-sidebar-foreground/80">
                        {authUser?.user_type ? authUser.user_type.charAt(0).toUpperCase() + authUser.user_type.slice(1).toLowerCase() : 'Market Admin'}
                    </p>
                </div>
                <SidebarGroupLabel className="text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider mb-3">
                    Main Navigation
                </SidebarGroupLabel>
                <SidebarGroupContent>
                    <SidebarMenu className="space-y-2">
                        {mainNavigationItems.map(item => {
                            const active = isItemActive(item);
                            return (
                                <SidebarMenuItem key={item.title}>
                                    <NavLink
                                        to={item.url}
                                        className={`${getNavCls(active)} flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm`}
                                    >
                                        <item.icon className="w-5 h-5" />
                                        <span className="font-medium">{item.title}</span>
                                    </NavLink>
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t p-4">
            <div className="grid grid-cols-2 gap-2">
                {supportItem ? (
                    <NavLink
                        to={supportItem.url}
                        className={`${getNavCls(isItemActive(supportItem))} flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm`}
                    >
                        <supportItem.icon className="w-4 h-4" />
                        <span className="font-medium">{supportItem.title}</span>
                    </NavLink>
                ) : null}
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start gap-3 px-3 py-2.5 hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200 hover:text-destructive transition-all">
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Log Out</span>
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
                        <AlertDialogAction onClick={handleLogout} disabled={isLoggingOut}>
                            {isLoggingOut ? 'Logging out...' : 'Log Out'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            </div>
        </SidebarFooter>
    </Sidebar>;
});

