"use client";

import React from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StraightTrack } from "@/components/race/straight-track";
import { LiveLeaderboard } from "@/components/race/live-leaderboard";
import { TelemetryBar } from "@/components/race/telemetry-bar";
import { useRaceStore } from "@/lib/race-store";

export default function StraightTrackPage() {
  const {
    currentRound,
    status,
    getLiveStats,
  } = useRaceStore();

  const stats = getLiveStats();

  const leader = stats[0] || null;
  const secondPlace = stats[1] || null;

  const currentLap =
    leader?.currentLap ||
    Math.min(50, (currentRound - 1) * 5 + 1);

  const elapsedTotalSeconds = leader?.cumulativeTime || 0;

  const fastestRoundTeam = stats.reduce((best, team) => {
    if (!team.bestRoundTime) return best;
    if (!best || !best.bestRoundTime) return team;
    return team.bestRoundTime < best.bestRoundTime ? team : best;
  }, null as (typeof stats)[number] | null);

  return (
    <DashboardShell>
      <div className="w-full space-y-4">

        <TelemetryBar
          currentLap={currentLap}
          totalLaps={50}
          leader={leader}
          secondPlace={secondPlace}
          elapsedTotalSeconds={elapsedTotalSeconds}
        />

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">

          <div className="min-h-[600px]">
            <StraightTrack
              stats={stats}
              currentRound={currentRound}
              isRoundRunning={status === "RUNNING"}
            />
          </div>

          <div className="min-h-[600px]">
            <LiveLeaderboard
              stats={stats}
              currentRound={currentRound}
              fastestRoundTeamId={fastestRoundTeam?.teamId}
              bestEverRoundTime={fastestRoundTeam?.bestRoundTime}
            />
          </div>

        </div>

      </div>
    </DashboardShell>
  );
}