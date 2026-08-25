"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRaceStore } from "@/lib/race-store";
import { TOTAL_LAPS, TOTAL_ROUNDS } from "@/lib/race-store";
import { OvalTrack } from "@/components/race/oval-track";
import { StraightTrack } from "@/components/race/straight-track";
import { LiveLeaderboard } from "@/components/race/live-leaderboard";
import { TelemetryBar } from "@/components/race/telemetry-bar";
import { Flag, Radio, Timer, Trophy } from "lucide-react";

type TrackMode = "oval" | "straight";

export default function RacePage() {
  const {
    status,
    currentRound,
    speedMultiplier,
    tick,
    getLiveStats,
  } = useRaceStore();

  const [trackMode, setTrackMode] = useState<TrackMode>("oval");

  const animRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const speedRef = useRef(speedMultiplier);

  useEffect(() => {
    speedRef.current = speedMultiplier;
  }, [speedMultiplier]);

  /*
   * Projector animation loop.
   *
   * The admin dashboard already has its own animation loop.
   * This page needs one because it intentionally does not use
   * DashboardShell.
   */
  useEffect(() => {
    if (status !== "RUNNING") {
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current);
      }

      animRef.current = null;
      lastTimestampRef.current = null;
      return;
    }

    const animate = (timestamp: number) => {
      if (lastTimestampRef.current === null) {
        lastTimestampRef.current = timestamp;
      }

      const deltaMs = timestamp - lastTimestampRef.current;
      lastTimestampRef.current = timestamp;

      const deltaSec =
        (deltaMs / 1000) * speedRef.current;

      tick(deltaSec);

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current);
      }

      animRef.current = null;
      lastTimestampRef.current = null;
    };
  }, [status, tick]);

  /*
   * Keyboard controls:
   *
   * 1 = straight
   * 2 = oval
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "1") {
        setTrackMode("straight");
      }

      if (event.key === "2") {
        setTrackMode("oval");
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const stats = getLiveStats();

  const leader = stats[0] || null;
  const secondPlace = stats[1] || null;

  const currentLap = leader
    ? leader.currentLap
    : Math.min(
        TOTAL_LAPS,
        (currentRound - 1) * 5 + 1
      );

  const elapsedTotalSeconds = leader
    ? leader.cumulativeTime
    : 0;

  const isRunning = status === "RUNNING";

  return (
    <main className="min-h-screen w-full bg-[#050609] text-white overflow-hidden">

      {/* ================= HEADER ================= */}

      <header className="h-20 px-8 flex items-center justify-between border-b border-white/10 bg-[#08090d]">

        {/* Left branding */}

        <div className="flex items-center gap-5">

          <div className="flex items-center gap-3">

            <div className="size-11 rounded-xl bg-red-600 flex items-center justify-center shadow-[0_0_25px_rgba(239,68,68,0.35)]">
              <Flag className="size-6 text-white" />
            </div>

            <div>
              <div className="text-xl font-black tracking-tight">
                F1 APEX
              </div>

              <div className="text-[10px] tracking-[0.3em] text-zinc-500 font-mono">
                GRAND PRIX SIMULATOR
              </div>
            </div>

          </div>

          <div className="h-9 w-px bg-white/10" />

          <div>
            <div className="text-xs text-zinc-500 font-mono">
              ROUND
            </div>

            <div className="text-lg font-black font-mono">
              {currentRound}
              <span className="text-zinc-600">
                /{TOTAL_ROUNDS}
              </span>
            </div>
          </div>

        </div>


        {/* Center race status */}

        <div className="hidden md:flex items-center gap-3">

          <div
            className={`size-2.5 rounded-full ${
              isRunning
                ? "bg-emerald-400 animate-pulse shadow-[0_0_12px_#34d399]"
                : "bg-zinc-600"
            }`}
          />

          <span className="font-mono text-sm font-bold tracking-widest">
            {status === "RUNNING"
              ? "LIVE"
              : status === "ROUND_COMPLETE"
                ? "ROUND COMPLETE"
                : status === "FINISHED"
                  ? "CHEQUERED FLAG"
                  : "STANDBY"}
          </span>

        </div>


        {/* Right information */}

        <div className="flex items-center gap-6">

          <div className="text-right">
            <div className="text-[9px] text-zinc-500 font-mono">
              LAP
            </div>

            <div className="font-mono font-black text-lg">
              {currentLap}
              <span className="text-zinc-600">
                /{TOTAL_LAPS}
              </span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[9px] text-zinc-500 font-mono">
              SPEED
            </div>

            <div className="font-mono font-black text-lg">
              {speedMultiplier}x
            </div>
          </div>

        </div>

      </header>


      {/* ================= RACE CONTENT ================= */}

      <section className="h-[calc(100vh-80px)] p-5 flex flex-col gap-4">

        {/* Top telemetry */}

        <TelemetryBar
          currentLap={currentLap}
          totalLaps={TOTAL_LAPS}
          leader={leader}
          secondPlace={secondPlace}
          elapsedTotalSeconds={elapsedTotalSeconds}
        />


        {/* Main area */}

        <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[1fr_350px] gap-4">

          {/* ================= TRACK ================= */}

          <div className="min-h-0 relative rounded-2xl overflow-hidden border border-white/10 bg-[#090a0d] shadow-2xl">

            {/* Track label */}

            <div className="absolute top-4 left-5 z-30 flex items-center gap-3">

              <div className="px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur border border-white/10 font-mono text-xs font-bold tracking-widest">
                {trackMode === "oval"
                  ? "OVAL CIRCUIT"
                  : "STRAIGHT SPRINT"}
              </div>

              <div className="px-3 py-1.5 rounded-lg bg-red-600/90 font-mono text-xs font-black">
                R{currentRound}
              </div>

            </div>


            {/* Track */}

            <div className="w-full h-full">

              {trackMode === "oval" ? (
                <OvalTrack
                  stats={stats}
                  currentRound={currentRound}
                  isRoundRunning={isRunning}
                />
              ) : (
                <StraightTrack
                  stats={stats}
                  currentRound={currentRound}
                  isRoundRunning={isRunning}
                />
              )}

            </div>


            {/* Keyboard hint */}

            <div className="absolute bottom-4 left-5 z-30 flex items-center gap-2 text-[9px] font-mono text-zinc-500">

              <span className="px-2 py-1 rounded bg-black/70 border border-white/10">
                1
              </span>

              STRAIGHT

              <span className="px-2 py-1 rounded bg-black/70 border border-white/10 ml-2">
                2
              </span>

              OVAL

            </div>

          </div>


          {/* ================= LEADERBOARD ================= */}

          <div className="min-h-0 rounded-2xl overflow-hidden">

            <LiveLeaderboard
              stats={stats}
              currentRound={currentRound}
              fastestRoundTeamId={
                stats
                  .filter((team) => team.bestRoundTime !== null)
                  .sort(
                    (a, b) =>
                      (a.bestRoundTime ?? Infinity) -
                      (b.bestRoundTime ?? Infinity)
                  )[0]?.teamId ?? null
              }
              bestEverRoundTime={
                stats
                  .map((team) => team.bestRoundTime)
                  .filter(
                    (time): time is number =>
                      time !== null
                  )
                  .sort((a, b) => a - b)[0] ?? null
              }
            />

          </div>

        </div>


        {/* ================= BOTTOM STATUS ================= */}

        <div className="h-11 shrink-0 flex items-center justify-between px-5 rounded-xl bg-[#0b0c11] border border-white/10">

          <div className="flex items-center gap-3 text-[10px] font-mono">

            <Radio
              className={`size-3 ${
                isRunning
                  ? "text-emerald-400 animate-pulse"
                  : "text-zinc-600"
              }`}
            />

            <span className="text-zinc-400">
              LIVE TELEMETRY
            </span>

            <span className="text-zinc-700">
              |
            </span>

            <span className="text-zinc-500">
              {trackMode === "oval"
                ? "OVAL MODE"
                : "STRAIGHT MODE"}
            </span>

          </div>


          <div className="flex items-center gap-6 font-mono text-[10px]">

            <div className="flex items-center gap-2 text-zinc-500">
              <Timer className="size-3" />
              <span>
                {isRunning
                  ? "SIMULATION RUNNING"
                  : "WAITING FOR ROUND"}
              </span>
            </div>

            <div className="flex items-center gap-2">

              <Trophy className="size-3 text-amber-400" />

              <span className="text-zinc-500">
                LEADER:
              </span>

              <span
                className="font-bold"
                style={{
                  color: leader?.color || "white",
                }}
              >
                {leader?.name || "—"}
              </span>

            </div>

          </div>

        </div>

      </section>

    </main>
  );
}