"use client";

import React from "react";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { useSidebar } from "@/hooks/use-sidebar";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { toggle } = useSidebar();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <AdminSidebar />
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Admin Topbar */}
        <header className="flex h-14 items-center justify-between gap-2 sm:gap-4 border-b border-border bg-background/80 backdrop-blur-xl px-4 lg:px-6 z-20 sticky top-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggle}
              className="md:hidden text-muted-foreground hover:text-foreground shrink-0 size-8"
            >
              <Menu className="size-4" />
            </Button>
            <h1 className="font-display font-semibold text-lg tracking-tight">Director's Cut</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
