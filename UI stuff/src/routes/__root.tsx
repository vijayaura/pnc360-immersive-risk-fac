import { Outlet, Link, createRootRoute, HeadContent, Scripts, useLocation } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { FloatingCopilot } from "@/components/copilot/floating-copilot";
import { CopilotContextProvider } from "@/hooks/use-copilot-context";
import { EmailPollingProvider } from "@/hooks/use-email-polling";
import { Bell, Search, Sun, Moon, Command, LogOut } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { AuthProvider, useAuth } from "@/hooks/use-auth";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "P&C 360 — Immersive Risk View" },
      { name: "description", content: "Immersive underwriting platform with spatial risk intelligence, AI-powered insights, and scenario simulation." },
      { property: "og:title", content: "P&C 360 — Immersive Risk View" },
      { name: "twitter:title", content: "P&C 360 — Immersive Risk View" },
      { property: "og:description", content: "Immersive underwriting platform with spatial risk intelligence, AI-powered insights, and scenario simulation." },
      { name: "twitter:description", content: "Immersive underwriting platform with spatial risk intelligence, AI-powered insights, and scenario simulation." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/8bf53c24-1651-4ff2-acb3-d9a1ceea6c39/id-preview-6b2236df--10c0aaa2-b737-47da-ab0a-00805db3671a.lovable.app-1777718784941.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/8bf53c24-1651-4ff2-acb3-d9a1ceea6c39/id-preview-6b2236df--10c0aaa2-b737-47da-ab0a-00805db3671a.lovable.app-1777718784941.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "stylesheet", href: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" as const },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

function AuthGate() {
  const location = useLocation();
  if (location.pathname === "/login") {
    return <Outlet />;
  }
  return <AppShell />;
}

function AppShell() {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const displayName = user?.email?.split("@")[0] || "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <EmailPollingProvider>
    <CopilotContextProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            {/* Premium Header */}
            <header className="h-14 flex items-center border-b border-border px-4 gap-4 shrink-0 frosted-header sticky top-0 z-30">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />

              {/* Command Palette Search */}
              <div className="flex-1 flex items-center gap-2 max-w-lg search-command px-3.5 py-2">
                <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  placeholder="Search properties, submissions..."
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none"
                />
                <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-md border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  <Command className="h-2.5 w-2.5" />K
                </kbd>
              </div>

              {/* Right section */}
              <div className="flex items-center gap-1.5 ml-auto">
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                  title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
                <button className="relative p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                  <Bell className="h-4 w-4" />
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-risk-high ring-2 ring-card" />
                </button>
                <button
                  onClick={signOut}
                  className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
                <div className="h-px w-4 bg-border rotate-90 mx-1 hidden sm:block" />
                {/* User avatar + info */}
                <div className="flex items-center gap-2.5 pl-1">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-[11px] font-bold text-primary-foreground ring-2 ring-primary/20">
                    {initials}
                  </div>
                  <div className="hidden md:flex flex-col">
                    <span className="text-xs font-semibold text-foreground leading-tight">{user?.email}</span>
                    <span className="text-[10px] text-muted-foreground leading-tight">Administrator</span>
                  </div>
                </div>
              </div>
            </header>
            <main className="flex-1 overflow-auto">
              <Outlet />
            </main>
          </div>
        </div>
        <FloatingCopilot />
      </SidebarProvider>
    </CopilotContextProvider>
    </EmailPollingProvider>
  );
}
