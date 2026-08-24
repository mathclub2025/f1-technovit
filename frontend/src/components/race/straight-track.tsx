"use client";

import React from "react";
import { TeamLiveStats } from "@/types/race";
import { CheckCircle2, Zap } from "lucide-react";
import { formatTime } from "@/lib/presets";
import { Formula1CarSVG } from "@/components/race/formula1-car-svg";

interface StraightTrackProps {
  stats: TeamLiveStats[];
  currentRound: number;
  isRoundRunning: boolean;
}

export function StraightTrack({
  stats,
  currentRound,
  isRoundRunning,
}: StraightTrackProps) {
  // Sort lanes by car number for static, non-jumping lanes
  const lanes = [...stats].sort((a, b) => a.carNumber - b.carNumber);

  return (
    <div className="flex flex-col w-full h-full bg-card rounded-xl border border-border overflow-hidden shadow-sm">
      {/* Header Info */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40 border-b border-border text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-block size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono font-bold tracking-wider text-foreground uppercase">
            STRAIGHT SPRINT COURSE — ROUND {currentRound} (LAPS {(currentRound - 1) * 5 + 1}–{currentRound * 5})
          </span>
        </div>
        <div className="flex items-center gap-4 text-muted-foreground font-mono text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-sm bg-red-500 inline-block" /> START (0m)
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-sm bg-foreground inline-block" /> FINISH (1000m)
          </div>
        </div>
      </div>

      {/* Distance Markers Row */}
      <div className="relative w-full h-6 bg-muted/20 border-b border-border/60 text-[10px] font-mono text-muted-foreground select-none">
        <div className="absolute left-[135px] right-[70px] h-full flex justify-between items-center px-1">
          <span className="border-l border-border/80 pl-1">0%</span>
          <span className="border-l border-border/80 pl-1 hidden sm:inline">25%</span>
          <span className="border-l border-border/80 pl-1">50%</span>
          <span className="border-l border-border/80 pl-1 hidden sm:inline">75%</span>
          <span className="border-r border-border/80 pr-1 text-primary font-bold">100% FINISH</span>
        </div>
      </div>

      {/* Track Lanes Area - Zero CSS transitions for smooth, non-vibrating RAF motion */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 asphalt-pattern min-h-[360px]">
        {lanes.map((team) => {
          const progressPercent = Math.min(100, Math.max(0, team.progress * 100));

          return (
            <div
              key={team.teamId}
              className="relative flex items-center h-14 rounded-lg bg-black/70 backdrop-blur-sm border border-white/10 hover:border-white/20 overflow-hidden"
            >
              {/* Lane Info Column (Fixed Left) */}
              <div
                className="w-[130px] shrink-0 h-full flex items-center gap-2 px-2.5 bg-black/90 border-r border-white/15 z-20"
                style={{ borderLeft: `4px solid ${team.color}` }}
              >
                <div
                  className="size-6 rounded font-mono font-black text-xs flex items-center justify-center text-white shrink-0 shadow-sm"
                  style={{ backgroundColor: team.color }}
                >
                  {team.carNumber}
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-white truncate leading-tight">
                    {team.name}
                  </div>
                  <div className="text-[10px] font-mono text-zinc-400 truncate flex items-center gap-1">
                    P{team.position} · {team.currentRoundTime > 0 ? `${team.currentRoundTime.toFixed(1)}s` : "—"}
                  </div>
                </div>
              </div>

              {/* Lane Road Strip */}
              <div className="relative flex-1 h-full flex items-center pr-14 pl-2 overflow-visible">
                {/* Distance Grid Lines */}
                <div className="absolute inset-0 flex justify-between pointer-events-none opacity-20">
                  <div className="w-px h-full bg-white/40" />
                  <div className="w-px h-full bg-white/30" />
                  <div className="w-px h-full bg-white/40" />
                  <div className="w-px h-full bg-white/30" />
                  <div className="w-px h-full bg-white/60" />
                </div>

                {/* Progress Bar Track Trace (No CSS transition to avoid jitter) */}
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-1 rounded-full opacity-60"
                  style={{
                    width: `${progressPercent}%`,
                    backgroundColor: team.color,
                    boxShadow: `0 0 10px ${team.color}`,
                  }}
                />

                {/* Animated Formula 1 Car Sprite (Pure RAF coordinate, no CSS transition conflict) */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 z-10 will-change-transform flex items-center"
                  style={{
                    left: `calc(${progressPercent}% * 0.88)`,
                  }}
                >
                  <div className="relative flex items-center">
                    {/* Speed exhaust glow when running */}
                    {isRoundRunning && !team.isRoundFinished && (
                      <div
                        className="absolute -left-6 top-1/2 -translate-y-1/2 w-7 h-2 rounded-full blur-[2px] opacity-75 pointer-events-none"
                        style={{ backgroundColor: team.color }}
                      />
                    )}

                    {/* Official Formula 1 Car SVG */}
                    <div className="relative flex items-center">
                      <Formula1CarSVG
                        color={team.color}
                        carNumber={team.carNumber}
                        facing="right"
                        className="w-16 h-5.5 drop-shadow-md"
                        glow={isRoundRunning && !team.isRoundFinished}
                      />
                    </div>

                    {/* Speed indicator */}
                    <div className="ml-1 hidden md:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-black/90 border border-white/20 text-[9px] font-mono text-zinc-300 shadow">
                      <Zap className="size-2 text-amber-400" />
                      {team.speedKmh.toFixed(0)} km/h
                    </div>
                  </div>
                </div>

                {/* Finish Line Banner */}
                <div className="absolute right-0 top-0 bottom-0 w-4 finish-line-pattern border-l border-white/40 shadow-inner z-10" />
              </div>

              {/* Status / Time Column (Right) */}
              <div className="w-[85px] shrink-0 h-full flex flex-col justify-center items-end px-2.5 bg-black/90 border-l border-white/10 z-20 font-mono">
                {team.isRoundFinished ? (
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">
                      <CheckCircle2 className="size-2.5" /> DONE
                    </span>
                    <span className="text-xs font-bold text-white">
                      {formatTime(team.currentRoundTime)}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-zinc-400">
                      {progressPercent.toFixed(0)}%
                    </span>
                    <span className="text-xs font-medium text-zinc-200">
                      {team.currentRoundElapsed.toFixed(1)}s
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
