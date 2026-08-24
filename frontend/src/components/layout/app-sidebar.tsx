"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/hooks/use-sidebar";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Trophy,
  Table as TableIcon,
  Menu,
  Settings,
  RotateCcw,
  Zap,
  CircleDot,
  Flag,
} from "lucide-react";
import { RaceStatus } from "@/types/race";

export type NavTab = "simulation" | "grid" | "matrix" | "standings" | "settings";

interface AppSidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  status: RaceStatus;
  currentRound: number;
  totalRounds: number;
  onStartRace: () => void;
  onResetRace: () => void;
}

export function AppSidebar({
  status,
  onResetRace,
}: AppSidebarProps) {
  const { isOpen, toggle } = useSidebar();
  const pathname = usePathname();

  const navItems = [
    {
      label: "Race Dashboard",
      href: "/",
      icon: LayoutDashboard,
    },
    {
      label: "Teams & Grid Setup",
      href: "/grid",
      icon: Users,
    },
    {
      label: "Straight Sprint Track",
      href: "/straight-track",
      icon: Zap,
      badge: status === "RUNNING" && !pathname.includes("oval") ? "LIVE" : undefined,
    },
    {
      label: "Oval Circuit",
      href: "/oval-circuit",
      icon: CircleDot,
      badge: status === "RUNNING" && pathname.includes("oval") ? "LIVE" : undefined,
    },
    {
      label: "Timing Matrix",
      href: "/timing",
      icon: TableIcon,
    },
    {
      label: "Live Leaderboard",
      href: "/standings",
      icon: Trophy,
    },
    {
      label: "Race Regulations",
      href: "/regulations",
      icon: Settings,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={toggle}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 md:relative flex flex-col h-full bg-background/95 backdrop-blur-xl border-r border-border transition-all duration-300 shrink-0 select-none",
          isOpen ? "w-64 translate-x-0" : "w-16 -translate-x-full md:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className={cn("flex h-14 shrink-0 items-center border-b border-border", isOpen ? "px-4 justify-between" : "px-0 justify-center")}>
        {isOpen && (
          <Link href="/" className="flex items-center gap-2.5 min-w-0">
            <div className="size-7 rounded-md flex items-center justify-center shrink-0 shadow-sm overflow-hidden bg-background">
              <img src="/image.png" alt="F1 Grand Prix Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-display font-bold text-base tracking-wider text-foreground truncate mt-0.5">
              F1 Grand Prix
            </span>
          </Link>
        )}

        <Button
          variant="ghost"
          size="icon-xs"
          onClick={toggle}
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          className="text-muted-foreground hover:text-foreground shrink-0 h-8 w-8"
        >
          <Menu className="size-4" />
        </Button>
      </div>

      {/* Nav links */}
      <div className="flex-1 py-3 px-2 flex flex-col gap-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center rounded-md transition-all duration-150 text-left font-medium",
                isOpen ? "gap-3.5 px-3 py-2.5 text-sm" : "justify-center p-2.5",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
              title={item.label}
            >
              <item.icon className={cn("shrink-0", isOpen ? "size-4" : "size-5")} />
              {isOpen && (
                <div className="flex-1 flex items-center justify-between truncate">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-emerald-500 text-black animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}

        {/* Reset Action */}
        <div className="pt-2 mt-auto">
          <button
            type="button"
            onClick={onResetRace}
            className={cn(
              "flex w-full items-center rounded-md text-destructive hover:bg-destructive/10 transition-colors text-left font-medium",
              isOpen ? "gap-3.5 px-3 py-2.5 text-sm" : "justify-center p-2.5"
            )}
            title="Reset Race"
          >
            <RotateCcw className={cn("shrink-0", isOpen ? "size-4" : "size-5")} />
            {isOpen && <span>Reset Grand Prix</span>}
          </button>
        </div>
      </div>

      </aside>
    </>
  );
}
