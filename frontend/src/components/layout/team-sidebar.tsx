"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/hooks/use-sidebar";
import { Flag, Calculator, BookOpen, Users, Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TeamSidebar() {
  const { isOpen, toggle } = useSidebar();
  const pathname = usePathname();

  const navItems = [
    { name: "Strategy Input", href: "/team", icon: Flag },
    { name: "Formulas", href: "/team/formulas", icon: Calculator },
    { name: "Rules", href: "/team/rules", icon: BookOpen },
    { name: "Team Details", href: "/team/details", icon: Users },
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
      <div
        className={cn(
          "hidden md:flex flex-col h-full bg-background/80 backdrop-blur-xl border-r border-border transition-all duration-300 z-40 supports-backdrop-filter:bg-background/60",
          isOpen ? "w-64" : "w-16"
        )}
      >
        {/* Brand Header */}
        <div className={cn("flex h-14 shrink-0 items-center border-b border-border", isOpen ? "px-4 justify-between" : "px-0 justify-center")}>
          {isOpen && (
            <Link href="/" className="flex items-center gap-2.5 min-w-0">
              <div className="size-7 rounded-md flex items-center justify-center shrink-0 overflow-hidden bg-background">
                <img src="/image.png" alt="F1 Logo" className="object-contain w-5 h-5" />
              </div>
              <span className="font-display font-bold text-lg tracking-widest text-foreground truncate mt-0.5">
                Pit Wall
              </span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
            className="h-8 w-8 text-sidebar-foreground shrink-0"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 min-h-0 overflow-y-auto py-4 flex flex-col gap-1">
          <div className="px-2 flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-md transition-all duration-200",
                    isOpen ? "gap-4 px-4 py-3 text-base font-medium" : "justify-center p-3",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                  title={!isOpen ? item.name : undefined}
                >
                  <item.icon className={cn("shrink-0", isOpen ? "h-5 w-5" : "h-6 w-6")} />
                  {isOpen && <span>{item.name}</span>}
                </Link>
              );
            })}
          </div>

          {/* Logout */}
          <div className="px-2 flex flex-col gap-1 pt-1 mt-auto">
            <Link
              href="/"
              className={cn(
                "flex w-full items-center rounded-md text-destructive hover:bg-destructive/10 transition-colors",
                isOpen ? "gap-4 px-4 py-3 text-base font-medium" : "justify-center p-3"
              )}
              title="Log Out"
            >
              <LogOut className={cn("shrink-0", isOpen ? "h-5 w-5" : "h-6 w-6")} />
              {isOpen && <span>Log Out</span>}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
