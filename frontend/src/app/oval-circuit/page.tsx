
"use client";

import React from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { LiveLeaderboard } from "@/components/race/live-leaderboard";
import { TelemetryBar } from "@/components/race/telemetry-bar";
import { Formula1CarSVG } from "@/components/race/formula1-car-svg";
import { useRaceStore, TOTAL_LAPS } from "@/lib/race-store";
import { RaceCountdown } from "@/components/race/race-countdown";
export default function OvalCircuitPage() {
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
    <DashboardShell>
      <RaceCountdown active={status === "INPUT"} />
      <div className="w-full max-w-[1800px] mx-auto space-y-4">

        <TelemetryBar
          currentLap={currentLap}
          totalLaps={TOTAL_LAPS}
          leader={leader}
          secondPlace={secondPlace}
          elapsedTotalSeconds={elapsedTotalSeconds}
        />

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-4">

          {/* OVAL TRACK */}
          <div className="relative min-h-[650px] rounded-xl border border-border bg-zinc-950 overflow-hidden">

            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-5 py-3 bg-black/80 border-b border-white/10">
              <div className="font-mono text-sm font-bold tracking-wider text-white">
                🏁 OVAL CIRCUIT — ROUND {currentRound}
              </div>

              <div className="font-mono text-xs text-zinc-400">
                LAPS {(currentRound - 1) * 5 + 1}–{currentRound * 5}
              </div>
            </div>

            {/* Track */}
            <div className="absolute inset-0 flex items-center justify-center pt-10">

              <div
                className="relative w-[82%] max-w-[1000px] aspect-[2/1] rounded-[50%] border-[55px] border-zinc-700 shadow-[inset_0_0_0_8px_#18181b,0_0_50px_rgba(255,255,255,0.08)]"
              >

                {/* Inner track */}
                <div className="absolute inset-[15px] rounded-[50%] border-2 border-dashed border-white/20" />

                {/* Start / Finish */}
                <div className="absolute top-1/2 -right-[28px] -translate-y-1/2 z-20">
                  <div className="finish-line-pattern w-8 h-16 border border-white/40" />
                </div>

                {/* Cars */}
                {stats.map((team) => {

                  const progress = Math.min(
                    1,
                    Math.max(0, team.progress)
                  );

                  const angle = progress * Math.PI * 2 - Math.PI / 2;

                  const radiusX = 46;
                  const radiusY = 38;

                  const x =
                    50 + Math.cos(angle) * radiusX;

                  const y =
                    50 + Math.sin(angle) * radiusY;

                  return (
                    <div
                      key={team.teamId}
                      className="absolute z-20"
                      style={{
                        left: `${x}%`,
                        top: `${y}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      <div className="relative">

                        {status === "RUNNING" &&
                          !team.isRoundFinished && (
                            <div
                              className="absolute -inset-2 rounded-full blur-md opacity-50"
                              style={{
                                backgroundColor: team.color,
                              }}
                            />
                          )}

                        <Formula1CarSVG
                          color={team.color}
                          carNumber={team.carNumber}
                          facing="right"
                          className="w-20 h-6"
                          glow={
                            status === "RUNNING" &&
                            !team.isRoundFinished
                          }
                        />

                        {/* Position */}
                        <div
                          className="absolute -top-5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-black/90 border border-white/20 text-[9px] font-mono font-bold text-white whitespace-nowrap"
                        >
                          P{team.position}
                        </div>

                      </div>
                    </div>
                  );
                })}

                {/* Centre */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">

                    <div className="text-3xl font-black text-white tracking-tight">
                      ROUND {currentRound}
                    </div>

                    <div className="mt-1 text-xs font-mono text-zinc-500">
                      {status === "RUNNING"
                        ? "● LIVE RACING"
                        : status === "ROUND_COMPLETE"
                        ? "ROUND COMPLETE"
                        : "READY"}
                    </div>

                  </div>
                </div>

              </div>

            </div>

            {/* Bottom legend */}
            <div className="absolute bottom-4 left-5 right-5 flex justify-between text-[10px] font-mono text-zinc-500">
              <span>START / FINISH</span>
              <span>50 LAPS GRAND PRIX</span>
              <span>LIVE TELEMETRY</span>
            </div>

          </div>

          {/* LEADERBOARD */}
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
    </DashboardShell>
  );
}