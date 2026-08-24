"use client";

import React from "react";
import { TeamLiveStats } from "@/types/race";
import { formatTime, formatGap } from "@/lib/presets";
import {
  Clock,
  Flag,
  Radio,
  Trophy,
} from "lucide-react";

interface TelemetryBarProps {
  currentLap: number;
  totalLaps: number;
  leader: TeamLiveStats | null;
  secondPlace: TeamLiveStats | null;
  elapsedTotalSeconds: number;
}

export function TelemetryBar({
  currentLap,
  totalLaps,
  leader,
  secondPlace,
  elapsedTotalSeconds,
}: TelemetryBarProps) {
  const overallProgress = Math.min(100, Math.max(0, (currentLap / totalLaps) * 100));
  const leaderGap = secondPlace ? secondPlace.cumulativeTime - (leader?.cumulativeTime || 0) : 0;

  return (
    <div className="w-full bg-card border border-border rounded-xl p-3.5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Grand Prix Lap Progress Bar */}
      <div className="w-full md:w-2/5 space-y-1.5">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="flex items-center gap-1.5 font-bold text-foreground">
            <Flag className="size-3.5 text-primary" /> GRAND PRIX PROGRESS
          </span>
          <span className="text-primary font-bold">
            {overallProgress.toFixed(0)}% · LAP {currentLap}/{totalLaps}
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary via-amber-500 to-emerald-500 transition-all duration-300 rounded-full"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Leader & Gap Telemetry */}
      <div className="flex items-center gap-4 text-xs font-mono divide-x divide-border">
        {/* P1 Leader */}
        <div className="flex items-center gap-2 pr-4">
          <Radio className="size-3.5 text-emerald-500 animate-pulse shrink-0" />
          <div>
            <div className="text-[10px] uppercase text-muted-foreground">RACE LEADER</div>
            <div className="font-display font-bold text-foreground flex items-center gap-1.5">
              {leader ? (
                <>
                  <span className="size-2 rounded-full inline-block shrink-0 shadow-sm" style={{ backgroundColor: leader.color }} />
                  <span className="truncate max-w-[140px]">{leader.name}</span>
                </>
              ) : (
                "—"
              )}
            </div>
          </div>
        </div>

        {/* Gap to P2 */}
        <div className="flex items-center gap-2 px-4">
          <Trophy className="size-3.5 text-amber-500 shrink-0" />
          <div>
            <div className="text-[10px] uppercase text-muted-foreground">LEAD MARGIN (P1 vs P2)</div>
            <div className="font-mono font-bold text-foreground">
              {secondPlace ? formatGap(leaderGap) : "SOLO"}
            </div>
          </div>
        </div>

        {/* Live Race Clock */}
        <div className="flex items-center gap-2 pl-4">
          <Clock className="size-3.5 text-primary shrink-0" />
          <div>
            <div className="text-[10px] uppercase text-muted-foreground">RACE CLOCK</div>
            <div className="font-mono font-bold text-foreground">
              {formatTime(elapsedTotalSeconds)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
