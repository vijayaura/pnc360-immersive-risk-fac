import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, Shield, Database, BookOpen } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
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
import { logout } from '@/features/auth/api/auth';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { applySuperAdminTheme } from '@/lib/market-theme';

const sidebarItems = [
  {
    title: 'Dashboard',
    url: '/super-admin/dashboard',
    icon: LayoutDashboard,
  },
  // {
  //   title: 'Environments',
  //   url: '/super-admin/environments',
  //   icon: Globe,
  // },
  {
    title: 'Masters Management',
    url: '/super-admin/masters-management',
    icon: Database,
  },
  {
    title: 'Support',
    url: '/super-admin/support-center/support',
    icon: BookOpen,
  },
  // {
  //   title: 'Settings',
  //   url: '/super-admin/settings',
  //   icon: Settings,
  // },
];

function SuperAdminSidebar() {
  const navigate = useNavigate();
  const { logout: logoutZustand, refreshToken } = useAuthStore();
  const { toast } = useToast();
  const getNavCls = (isActive: boolean) =>
    isActive
      ? 'bg-primary text-primary-foreground font-semibold shadow-md [&_svg]:text-primary-foreground'
      : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all text-sidebar-foreground [&_svg]:text-sidebar-foreground';
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const rt = refreshToken;
      await logout({ refreshToken: rt });
      logoutZustand();
    } catch (err: unknown) {
      const status =
        typeof err === 'object' && err !== null && 'status' in err
          ? (err as { status?: number }).status
          : undefined;
      const message =
        typeof err === 'object' && err !== null && 'message' in err
          ? (err as { message?: string }).message
          : undefined;
      if (status === 400) {
        toast({ title: 'Logout failed', description: message || 'Refresh token is required.' });
      }
    } finally {
      toast({ title: 'Logged out successfully' });
      navigate('/super-admin/login');
      logoutZustand();
      setIsLoggingOut(false);
    }
  };

  return (
    <Sidebar className="border-r bg-background">
      <SidebarHeader className="border-b bg-primary/5 p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">
            {isDemoMode() ? (
              <img src="/riyadh.png" alt="Riyadh Re" className="w-8 h-8 object-contain" />
            ) : (
              <Shield className="w-5 h-5 text-primary" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-foreground tracking-tight">
              {isDemoMode() ? 'Riyadh Re Platform' : 'P&C Platform'}
            </h2>
            <p className="text-sm text-muted-foreground font-medium">Super Admin Portal</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Main Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {sidebarItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <NavLink
                    to={item.url}
                    end
                    className={({ isActive }) =>
                      `${getNavCls(isActive)} flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm`
                    }
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.title}</span>
                  </NavLink>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t bg-primary/5 p-4">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-3 py-2.5 hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200 hover:text-destructive transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Log Out</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to log out? You will need to sign in again to access your
                account.
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
      </SidebarFooter>
    </Sidebar>
  );
}

export function SuperAdminLayout() {
  // Super-admin always uses #bad5ea (Aura) theme and variants
  useEffect(() => {
    applySuperAdminTheme();
  }, []);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <SuperAdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 flex items-center border-b bg-primary/5 shadow-sm">
            <div className="flex items-center gap-4 px-6 w-full">
              <SidebarTrigger className="hover:bg-muted/50 transition-colors" />
              <div className="flex-1">
                <h1 className="text-xl font-bold text-foreground">Super Admin Portal</h1>
                <p className="text-sm text-muted-foreground">
                  Manage environments and access controls
                </p>
              </div>
              {isDemoMode() && (
                <img src="/riyadh.png" alt="Riyadh Re" className="h-10 w-auto object-contain" />
              )}
            </div>
          </header>
          <main className="flex-1 overflow-hidden">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}


