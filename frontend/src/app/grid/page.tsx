"use client";

import React from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { useRaceStore } from "@/lib/race-store";
import { TeamSetup } from "@/components/race/team-setup";
import { useRouter } from "next/navigation";

export default function GridPage() {
  const router = useRouter();
  const { teams, setTeams, startRace } = useRaceStore();

  return (
    <DashboardShell>
      <TeamSetup
        teams={teams}
        onUpdateTeams={setTeams}
        onStartRace={() => {
          startRace();
          router.push("/straight-track");
        }}
      />
    </DashboardShell>
  );
}
