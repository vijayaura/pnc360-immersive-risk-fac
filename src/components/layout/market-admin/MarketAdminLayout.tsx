import React from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { isDemoMode } from "@/lib/demo-mode";
import { MarketAdminSidebar } from "./MarketAdminSidebar";

export function MarketAdminLayout() {
    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full bg-background">
                <MarketAdminSidebar />
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    <header className="h-16 flex items-center border-b bg-primary/5 shadow-sm backdrop-blur-sm z-10 transition-all">
                        <div className="flex items-center gap-4 px-6 w-full">
                            <SidebarTrigger className="hover:bg-muted/50 transition-colors" />
                            <div className="flex-1">
                                <h1 className="text-xl font-bold text-foreground">Market Admin Portal</h1>
                                <p className="text-sm text-muted-foreground">Comprehensive insurance marketplace management</p>
                            </div>
                            {isDemoMode() && (
                                <img
                                    src="/riyadh.png"
                                    alt="Riyadh Re"
                                    className="h-10 w-auto object-contain"
                                />
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
