import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FileText,
  Map,
  Shield,
  Activity,
  TrendingUp,
  Brain,
} from "lucide-react";
import { useEmailPolling } from "@/hooks/use-email-polling";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const mainNav = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Submissions", url: "/submissions", icon: FileText },
];

const toolsNav = [
  { title: "Risk Map", url: "/risk-map", icon: Map },
  { title: "AI Compare", url: "/ai-compare", icon: Brain },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pendingCount } = useEmailPolling();
  const currentPath = useRouterState({
    select: (r) => r.location.pathname,
  });

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath.startsWith(path);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="border-b border-border px-4 py-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-sm shadow-primary/20">
            <Shield className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-foreground tracking-tight leading-tight">P&C 360</span>
              <span className="text-[10px] text-muted-foreground leading-tight">Immersive Risk View</span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 pt-3">
        <SidebarGroup>
          <SidebarGroupLabel className="section-label px-3 mb-1.5">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span className="flex-1">{item.title}</span>}
                      {item.title === "Submissions" && pendingCount > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-risk-high text-[10px] font-bold text-white px-1.5">
                          {pendingCount}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="section-label px-3 mb-1.5">Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolsNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Quick Stats Widget */}
        {!collapsed && (
          <div className="mx-3 mt-4 rounded-xl bg-accent/40 border border-border/50 p-3.5 space-y-3">
            <div className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-primary" />
              <span className="section-label">Portfolio</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-lg font-bold text-foreground leading-none">8</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Properties</p>
              </div>
              <div>
                <p className="text-lg font-bold text-foreground leading-none">3</p>
                <p className="text-[10px] text-status-pending mt-0.5">Pending</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-status-approved font-medium">
              <TrendingUp className="h-3 w-3" />
              <span>12% approval rate ↑</span>
            </div>
          </div>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <div className="flex items-center gap-2.5 px-2 py-1.5 cursor-default">
                <div className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-accent">
                  <Shield className="h-3.5 w-3.5 text-accent-foreground" />
                  <span className="status-dot-active absolute -top-0.5 -right-0.5 ring-2 ring-card" />
                </div>
                {!collapsed && (
                  <div className="flex flex-col">
                    <span className="text-[11px] font-semibold text-foreground leading-tight">AURA Engine</span>
                    <span className="text-[10px] text-muted-foreground leading-tight">v2.4 · Online</span>
                  </div>
                )}
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
