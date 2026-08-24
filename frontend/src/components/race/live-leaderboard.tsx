"use client";

import React from "react";
import { TeamLiveStats } from "@/types/race";
import { formatTime, formatGap } from "@/lib/presets";
import {
  Trophy,
  ArrowUp,
  ArrowDown,
  Minus,
  Timer,
  Zap,
  Star,
  CheckCircle2,
} from "lucide-react";

interface LiveLeaderboardProps {
  stats: TeamLiveStats[];
  currentRound: number;
  fastestRoundTeamId?: string | null;
  bestEverRoundTime?: number | null;
}

export function LiveLeaderboard({
  stats,
  currentRound,
  fastestRoundTeamId,
  bestEverRoundTime,
}: LiveLeaderboardProps) {
  // Sort stats by position (lowest cumulative time)
  const sortedStats = [...stats].sort((a, b) => a.position - b.position);

  const getPositionBadge = (pos: number) => {
    if (pos === 1) {
      return (
        <span className="size-6 rounded-md bg-amber-500 text-black font-black text-xs flex items-center justify-center shadow-md">
          1
        </span>
      );
    }
    if (pos === 2) {
      return (
        <span className="size-6 rounded-md bg-slate-300 text-slate-900 font-black text-xs flex items-center justify-center shadow">
          2
        </span>
      );
    }
    if (pos === 3) {
      return (
        <span className="size-6 rounded-md bg-amber-700 text-white font-black text-xs flex items-center justify-center shadow">
          3
        </span>
      );
    }
    return (
      <span className="size-6 rounded-md bg-muted text-muted-foreground font-bold text-xs flex items-center justify-center border border-border">
        {pos}
      </span>
    );
  };

  const getDeltaBadge = (curr: number, prev: number) => {
    const diff = prev - curr; // if prev was 3 and curr is 1, diff = +2 (gained 2 places)
    if (diff > 0) {
      return (
        <span className="flex items-center text-[10px] font-bold text-emerald-500 font-mono">
          <ArrowUp className="size-2.5" />
          {diff}
        </span>
      );
    }
    if (diff < 0) {
      return (
        <span className="flex items-center text-[10px] font-bold text-rose-500 font-mono">
          <ArrowDown className="size-2.5" />
          {Math.abs(diff)}
        </span>
      );
    }
    return (
      <span className="flex items-center text-[10px] text-muted-foreground/60 font-mono">
        <Minus className="size-2.5" />
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border border-border overflow-hidden shadow-sm">
      {/* Tower Header */}
      <div className="p-3.5 bg-muted/40 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="size-4 text-amber-500" />
          <h2 className="font-display font-bold text-sm text-foreground uppercase tracking-tight">
            Live Timing Tower
          </h2>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
          <Timer className="size-3" />
          <span>REAL-TIME INTERVALS</span>
        </div>
      </div>

      {/* Leaderboard Table / Rows */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/50">
        {sortedStats.map((team) => {
          const isLeader = team.position === 1;
          const hasFastestRound = team.teamId === fastestRoundTeamId;

          return (
            <div
              key={team.teamId}
              className={`p-3 transition-colors duration-200 flex items-center justify-between gap-2.5 ${
                isLeader
                  ? "bg-amber-500/5 hover:bg-amber-500/10 dark:bg-amber-500/10"
                  : "hover:bg-muted/40"
              }`}
            >
              {/* Left: Position, Delta, Car info */}
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Pos & Delta */}
                <div className="flex flex-col items-center justify-center shrink-0 w-6">
                  {getPositionBadge(team.position)}
                  <div className="mt-0.5">{getDeltaBadge(team.position, team.previousPosition)}</div>
                </div>

                {/* Team Color Accent Bar */}
                <div
                  className="w-1.5 h-9 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: team.color }}
                />

                {/* Team Name and Driver */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-display font-bold text-xs text-foreground truncate">
                      {team.name}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      #{team.carNumber}
                    </span>
                    {hasFastestRound && (
                      <span title="Fastest round overall" className="text-purple-400 shrink-0">
                        <Star className="size-3 fill-purple-400" />
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground mt-0.5">
                    <span>Lap {team.currentLap}/50</span>
                    <span>·</span>
                    <span className="flex items-center gap-0.5 text-zinc-400">
                      <Zap className="size-2 text-amber-400" />
                      {team.speedKmh.toFixed(0)} km/h
                    </span>
                    {team.isRoundFinished && (
                      <span className="text-emerald-500 font-bold flex items-center gap-0.5">
                        <CheckCircle2 className="size-2.5" /> FIN
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Round & Cumulative Timings */}
              <div className="flex flex-col items-end shrink-0 font-mono text-right">
                {/* Cumulative / Gap */}
                <div className="text-xs font-bold text-foreground">
                  {formatTime(team.cumulativeTime)}
                </div>

                {/* Gap to Leader */}
                <div className="text-[10px] font-medium">
                  {isLeader ? (
                    <span className="text-amber-500 font-bold">LEADER</span>
                  ) : (
                    <span className="text-muted-foreground">{formatGap(team.gapToLeader)}</span>
                  )}
                </div>

                {/* Current Round target or best */}
                <div className="text-[9px] text-muted-foreground/80 mt-0.5">
                  R{currentRound}: {team.currentRoundTime > 0 ? `${team.currentRoundTime.toFixed(1)}s` : "—"}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info / Fastest Lap Notice */}
      {bestEverRoundTime && (
        <div className="p-2.5 bg-muted/40 border-t border-border flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-1 text-purple-400 font-semibold">
            <Star className="size-3 fill-purple-400" /> FASTEST ROUND
          </div>
          <div className="text-foreground font-bold">
            {formatTime(bestEverRoundTime)}
          </div>
        </div>
      )}
    </div>
  );
}
