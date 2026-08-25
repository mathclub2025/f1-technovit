"use client";

import React from "react";

import { AdminShell } from "@/components/layout/admin-shell";
import { StraightTrack } from "@/components/race/straight-track";
import { LiveLeaderboard } from "@/components/race/live-leaderboard";
import { TelemetryBar } from "@/components/race/telemetry-bar";
import { useRaceStore, TOTAL_LAPS } from "@/lib/race-store";
import { RaceCountdown } from "@/components/race/race-countdown";

export default function StraightTrackPage() {
  const { currentRound, status, getLiveStats } = useRaceStore();

  const stats = getLiveStats();

  const leader = stats[0] || null;
  const secondPlace = stats[1] || null;

  const currentLap = leader?.currentLap || 1;

  const elapsedTotalSeconds = leader?.cumulativeTime || 0;

  const fastestRoundTeamId =
    stats.length > 0
      ? [...stats].sort(
          (a, b) => a.currentRoundTime - b.currentRoundTime
        )[0]?.teamId
      : null;

  const bestEverRoundTime =
    stats.length > 0
      ? Math.min(...stats.map((team) => team.currentRoundTime))
      : null;

  return (
    <AdminShell>
      <RaceCountdown key={status} active={status === "INPUT"} />
      <div className="w-full max-w-[1800px] mx-auto space-y-4">

        {/* TOP TELEMETRY */}
        <TelemetryBar
          currentLap={currentLap}
          totalLaps={TOTAL_LAPS}
          leader={leader}
          secondPlace={secondPlace}
          elapsedTotalSeconds={elapsedTotalSeconds}
        />

        {/* RACE AREA */}
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-4 min-h-[600px]">

          {/* TRACK */}
          <div className="min-w-0">
            <StraightTrack
              stats={stats}
              currentRound={currentRound}
              isRoundRunning={status === "RUNNING"}
            />
          </div>

          {/* LIVE TIMING */}
          <div className="min-h-[500px]">
            <LiveLeaderboard
              stats={stats}
              currentRound={currentRound}
              fastestRoundTeamId={fastestRoundTeamId}
              bestEverRoundTime={bestEverRoundTime}
            />
          </div>

        </div>

      </div>
    </AdminShell>
  );
  
}