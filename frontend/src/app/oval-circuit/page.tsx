"use client";

import React, { useMemo } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { useRaceStore } from "@/lib/race-store";
import { Formula1CarSVG } from "@/components/race/formula1-car-svg";
import { LiveLeaderboard } from "@/components/race/live-leaderboard";
import { TelemetryBar } from "@/components/race/telemetry-bar";

function getOvalPosition(progress: number, lane: number, totalCars: number) {
  const p = ((progress % 1) + 1) % 1;

  const centerX = 50;
  const centerY = 50;

  const baseRx = 34;
  const baseRy = 29;

  const laneSpacing = 2.8;
  const laneOffset = (lane - (totalCars - 1) / 2) * laneSpacing;

  const rx = baseRx + laneOffset;
  const ry = baseRy + laneOffset * 0.65;

  const angle = -Math.PI / 2 + p * Math.PI * 2;

  return {
    x: centerX + rx * Math.cos(angle),
    y: centerY + ry * Math.sin(angle),
    angle: (angle * 180) / Math.PI + 90,
  };
}

export default function OvalCircuitPage() {
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

    return team.bestRoundTime < best.bestRoundTime
      ? team
      : best;
  }, null as (typeof stats)[number] | null);

  const trackCars = useMemo(() => {
    return stats.map((team, index) => ({
      team,
      index,
      position: getOvalPosition(
        team.progress,
        index,
        stats.length
      ),
    }));
  }, [stats]);

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

          {/* OVAL CIRCUIT */}
          <div className="relative min-h-[650px] rounded-xl overflow-hidden border border-border bg-[#080a0d] shadow-2xl">

            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-5 py-3 bg-black/75 backdrop-blur-md border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="size-2.5 rounded-full bg-emerald-400 animate-pulse" />

                <div>
                  <div className="text-xs font-mono font-black tracking-widest text-white">
                    OVAL GRAND PRIX CIRCUIT
                  </div>

                  <div className="text-[10px] font-mono text-zinc-500">
                    ROUND {currentRound} · LAPS {(currentRound - 1) * 5 + 1}–
                    {currentRound * 5}
                  </div>
                </div>
              </div>

              <div className="font-mono text-xs text-zinc-300">
                {status === "RUNNING" ? "● LIVE" : status}
              </div>
            </div>

            {/* Track Area */}
            <div className="absolute inset-0 pt-14">

              {/* Outer Track */}
              <div className="absolute left-[7%] right-[7%] top-[12%] bottom-[8%] rounded-[45%] bg-zinc-700 shadow-[inset_0_0_0_8px_#17191d]">

                {/* Asphalt */}
                <div className="absolute inset-[7%] rounded-[44%] bg-[#15171a]">

                  {/* Racing Lane */}
                  <div className="absolute inset-[8%] rounded-[43%] border-2 border-dashed border-white/20" />

                  {/* Inner Grass */}
                  <div className="absolute inset-[18%] rounded-[40%] bg-[#07140d] border border-emerald-500/10" />

                  {/* Inner Track Glow */}
                  <div className="absolute inset-[21%] rounded-[38%] border border-white/5" />

                </div>

                {/* Start / Finish */}
                <div className="absolute top-[-1px] left-1/2 -translate-x-1/2 w-12 h-7 finish-line-pattern border-x border-white/30 z-20">
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold text-white whitespace-nowrap">
                    START / FINISH
                  </div>
                </div>

              </div>

              {/* Cars */}
              {trackCars.map(({ team, position }) => {

                const isMoving =
                  status === "RUNNING" &&
                  !team.isRoundFinished;

                return (
                  <div
                    key={team.teamId}
                    className="absolute z-20 pointer-events-none"
                    style={{
                      left: `${position.x}%`,
                      top: `${position.y}%`,
                      transform: `translate(-50%, -50%) rotate(${position.angle}deg)`,
                    }}
                  >

                    {/* Glow */}
                    {isMoving && (
                      <div
                        className="absolute inset-0 rounded-full blur-xl opacity-50"
                        style={{
                          backgroundColor: team.color,
                        }}
                      />
                    )}

                    {/* Car */}
                    <Formula1CarSVG
                      color={team.color}
                      carNumber={team.carNumber}
                      facing="right"
                      glow={isMoving}
                      className="w-16 h-6 sm:w-20 sm:h-7"
                    />

                    {/* Position Badge */}
                    <div
                      className="absolute -top-5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-black/90 border text-[8px] font-mono font-bold whitespace-nowrap"
                      style={{
                        borderColor: team.color,
                      }}
                    >
                      P{team.position}
                    </div>
                  </div>
                );
              })}

              {/* Center Information */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">

                <div className="text-[10px] font-mono tracking-[0.35em] text-zinc-600">
                  F1
                </div>

                <div className="text-3xl font-black tracking-tight text-white/10">
                  GRAND PRIX
                </div>

                <div className="mt-2 text-xs font-mono text-zinc-600">
                  LAP {currentLap} / 50
                </div>

              </div>

              {/* Corner Labels */}
              <div className="absolute left-[13%] top-[27%] text-[9px] font-mono text-zinc-600">
                T1
              </div>

              <div className="absolute right-[13%] top-[27%] text-[9px] font-mono text-zinc-600">
                T2
              </div>

              <div className="absolute right-[13%] bottom-[22%] text-[9px] font-mono text-zinc-600">
                T3
              </div>

              <div className="absolute left-[13%] bottom-[22%] text-[9px] font-mono text-zinc-600">
                T4
              </div>

            </div>
          </div>

          {/* LEADERBOARD */}
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