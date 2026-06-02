import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, PlusCircle, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { clearAuth } from '@/lib/auth';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import siteLogo from '@/assets/logo.png';

const sidebarItems = [
  { title: 'Dashboard', url: '/reinsurer-broker/dashboard', icon: LayoutDashboard },
  { title: 'Create Facultative Request', url: '/reinsurer-broker/facultative-request', icon: PlusCircle },
];

export function ReinsurerBrokerLayout() {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();

  const getNavCls = (isActive: boolean) =>
    isActive
      ? 'bg-primary text-primary-foreground font-semibold shadow-md'
      : 'text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all';

  const handleLogout = () => {
    logout();
    clearAuth();
    navigate('/reinsurer-broker/login');
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar className="border-r border-sidebar-border shadow-xl">
          <SidebarHeader className="border-b p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center overflow-hidden">
                <img src={siteLogo} alt="Aura" className="h-8 w-auto object-contain" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-200">Reinsurance Requester</h2>
                <p className="text-sm text-slate-400">Facultative placement portal</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="p-4">
            <SidebarGroup>
              <div className="mb-6 p-3 bg-primary/5 rounded-lg border">
                <p className="text-sm font-semibold text-sidebar-foreground mb-1">
                  {user?.name || 'Demo Reinsurance Requester'}
                </p>
                <p className="text-xs font-medium text-sidebar-foreground/80">Reinsurance Requester</p>
              </div>

              <SidebarGroupLabel className="text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider mb-3">
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

          <SidebarFooter className="border-t p-4">
            <div className="mb-3 rounded-lg bg-primary/5 border p-3">
              <p className="text-sm font-semibold text-sidebar-foreground">{user?.name || 'Demo Reinsurance Requester'}</p>
              <p className="truncate text-xs font-medium text-sidebar-foreground/80">
                {user?.email || 'broker@reinsurance.local'}
              </p>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-3 py-2.5 hover:bg-red-500/10 hover:text-red-500 transition-all duration-200"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span className="font-medium">Log Out</span>
            </Button>
          </SidebarFooter>
        </Sidebar>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 items-center border-b bg-primary/5 shadow-sm">
            <div className="flex w-full items-center gap-4 px-6">
              <SidebarTrigger className="hover:bg-muted/50" />
              <div className="flex-1">
                <h1 className="text-xl font-bold text-foreground">Reinsurance Requester Portal</h1>
                <p className="text-sm text-muted-foreground">Manage facultative placements, referrals, and bound policies</p>
              </div>
              <div className="hidden items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary sm:flex">
                <ShieldCheck className="h-4 w-4" />
                Demo Access
              </div>
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
