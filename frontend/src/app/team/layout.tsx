import React from "react";
import { TeamShell } from "@/components/layout/team-shell";

export const metadata = {
  title: "Pit Wall | Team Dashboard",
};

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  return <TeamShell>{children}</TeamShell>;
}
