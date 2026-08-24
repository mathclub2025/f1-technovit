"use client";

import React, { useEffect } from "react";
import { Team, TeamLiveStats, RoundTiming } from "@/types/race";
import { formatTime, formatGap } from "@/lib/presets";
import { soundManager } from "@/lib/sound";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Crown,
  Medal,
  Download,
  RotateCcw,
  Sparkles,
  Table as TableIcon,
} from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";

interface FinishPodiumProps {
  stats: TeamLiveStats[];
  teams: Team[];
  roundHistory: RoundTiming[];
  onRestartRace: () => void;
  onNewSetup: () => void;
}

export function FinishPodium({
  stats,
  roundHistory,
  onRestartRace,
  onNewSetup,
}: FinishPodiumProps) {
  // Final standings sorted by cumulative time
  const standings = [...stats].sort((a, b) => a.cumulativeTime - b.cumulativeTime);
  const p1 = standings[0];
  const p2 = standings[1];
  const p3 = standings[2];

  useEffect(() => {
    soundManager.playVictoryFanfare();

    const duration = 3.5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ["#E10600", "#FF8000", "#00D2BE", "#FFD700"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ["#E10600", "#FF8000", "#00D2BE", "#FFD700"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const handleExportCSV = (e: React.MouseEvent) => {
    e.preventDefault();
    let csv = "Rank,Car Number,Team Name,Driver,Total Time (s),Gap to Leader,Best Round (s)\n";
    standings.forEach((st, idx) => {
      csv += `${idx + 1},${st.carNumber},"${st.name}","${st.driverName || ""}",${st.cumulativeTime.toFixed(3)},"${formatGap(st.gapToLeader)}",${st.bestRoundTime?.toFixed(3) || "N/A"}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "50-lap-race-results.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Race results exported to CSV!");
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-8 animate-fade-up">
      {/* Victory Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-card to-card p-6 md:p-8 text-center space-y-3 shadow-lg">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-500 font-bold text-xs">
          <Crown className="size-4" /> GRAND PRIX COMPLETED · 50 LAPS
        </div>

        <h1 className="text-3xl md:text-5xl font-display font-black tracking-tight text-foreground">
          {p1?.name} WINS!
        </h1>

        <p className="text-sm text-muted-foreground font-mono">
          Winning Time: <span className="font-bold text-foreground">{formatTime(p1?.cumulativeTime)}</span> across 10 rounds
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            size="sm"
            onClick={handleExportCSV}
            variant="outline"
            className="text-xs gap-1.5"
          >
            <Download className="size-3.5" /> Export Results (CSV)
          </Button>
          <Button
            size="sm"
            onClick={onRestartRace}
            variant="secondary"
            className="text-xs gap-1.5"
          >
            <RotateCcw className="size-3.5" /> Re-run with Same Grid
          </Button>
          <Button
            size="sm"
            onClick={onNewSetup}
            className="text-xs gap-1.5 bg-primary text-primary-foreground font-bold"
          >
            <Sparkles className="size-3.5" /> New Race Setup
          </Button>
        </div>
      </div>

      {/* 3D Podium Display */}
      {standings.length >= 2 && (
        <div className="flex items-end justify-center gap-2 sm:gap-4 max-w-2xl mx-auto pt-6 px-2">
          {/* P2 Silver */}
          {p2 && (
            <div className="flex-1 flex flex-col items-center">
              <div className="mb-2 text-center">
                <div
                  className="size-10 sm:size-12 rounded-xl mx-auto flex items-center justify-center font-mono font-black text-white text-sm sm:text-base shadow-md border-2 border-slate-300"
                  style={{ backgroundColor: p2.color }}
                >
                  {p2.carNumber}
                </div>
                <div className="mt-1.5 font-display font-bold text-xs sm:text-sm text-foreground truncate max-w-[120px]">
                  {p2.name}
                </div>
                <div className="text-[11px] font-mono text-muted-foreground">
                  {formatTime(p2.cumulativeTime)}
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  {formatGap(p2.gapToLeader)}
                </div>
              </div>
              <div className="w-full h-28 sm:h-36 rounded-t-xl bg-gradient-to-b from-slate-300 to-slate-400 dark:from-slate-700 dark:to-slate-800 flex flex-col items-center justify-center border-t-2 border-slate-300 shadow-md">
                <Medal className="size-6 text-slate-900 dark:text-slate-200" />
                <span className="font-mono font-black text-2xl text-slate-900 dark:text-slate-200">2</span>
              </div>
            </div>
          )}

          {/* P1 Gold */}
          {p1 && (
            <div className="flex-1 flex flex-col items-center">
              <div className="mb-2 text-center">
                <div className="inline-block p-1 bg-amber-500/20 rounded-full mb-1">
                  <Crown className="size-5 text-amber-500 fill-amber-500 animate-bounce" />
                </div>
                <div
                  className="size-12 sm:size-16 rounded-2xl mx-auto flex items-center justify-center font-mono font-black text-white text-base sm:text-lg shadow-xl border-4 border-amber-400"
                  style={{ backgroundColor: p1.color }}
                >
                  {p1.carNumber}
                </div>
                <div className="mt-1.5 font-display font-black text-sm sm:text-base text-foreground truncate max-w-[140px]">
                  {p1.name}
                </div>
                <div className="text-xs font-mono font-bold text-amber-500">
                  {formatTime(p1.cumulativeTime)}
                </div>
                <div className="text-[10px] font-mono font-bold text-emerald-500">
                  WINNER
                </div>
              </div>
              <div className="w-full h-36 sm:h-48 rounded-t-xl bg-gradient-to-b from-amber-400 to-amber-500 dark:from-amber-600 dark:to-amber-800 flex flex-col items-center justify-center border-t-4 border-amber-300 shadow-xl">
                <Trophy className="size-8 text-amber-950 dark:text-amber-100" />
                <span className="font-mono font-black text-3xl text-amber-950 dark:text-amber-100">1</span>
              </div>
            </div>
          )}

          {/* P3 Bronze */}
          {p3 && (
            <div className="flex-1 flex flex-col items-center">
              <div className="mb-2 text-center">
                <div
                  className="size-10 sm:size-12 rounded-xl mx-auto flex items-center justify-center font-mono font-black text-white text-sm sm:text-base shadow-md border-2 border-amber-700"
                  style={{ backgroundColor: p3.color }}
                >
                  {p3.carNumber}
                </div>
                <div className="mt-1.5 font-display font-bold text-xs sm:text-sm text-foreground truncate max-w-[120px]">
                  {p3.name}
                </div>
                <div className="text-[11px] font-mono text-muted-foreground">
                  {formatTime(p3.cumulativeTime)}
                </div>
                <div className="text-[10px] font-mono text-amber-700 dark:text-amber-500">
                  {formatGap(p3.gapToLeader)}
                </div>
              </div>
              <div className="w-full h-20 sm:h-28 rounded-t-xl bg-gradient-to-b from-amber-700 to-amber-800 dark:from-amber-900 dark:to-amber-950 flex flex-col items-center justify-center border-t-2 border-amber-600 shadow-md">
                <Medal className="size-6 text-amber-100" />
                <span className="font-mono font-black text-2xl text-amber-100">3</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Standings Table Card */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-display font-bold flex items-center gap-2">
            <Trophy className="size-4 text-amber-500" />
            Official Grand Prix Final Standings
          </CardTitle>
          <Badge variant="outline" className="font-mono text-[11px]">
            50 LAPS TOTAL
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-border text-[11px] font-mono uppercase text-muted-foreground">
                <tr>
                  <th className="py-2.5 px-3">Pos</th>
                  <th className="py-2.5 px-3">Team & Driver</th>
                  <th className="py-2.5 px-3 text-right">Total Time</th>
                  <th className="py-2.5 px-3 text-right">Gap to Leader</th>
                  <th className="py-2.5 px-3 text-right">Best 5-Lap Round</th>
                  <th className="py-2.5 px-3 text-right">Avg Lap Pace</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-mono">
                {standings.map((st, idx) => {
                  const avgLap = st.cumulativeTime / 50;
                  return (
                    <tr
                      key={st.teamId}
                      className={`hover:bg-muted/30 transition-colors ${
                        idx === 0 ? "bg-amber-500/5 font-semibold" : ""
                      }`}
                    >
                      <td className="py-3 px-3">
                        <span
                          className={`size-6 rounded flex items-center justify-center text-xs font-black ${
                            idx === 0
                              ? "bg-amber-500 text-black"
                              : idx === 1
                              ? "bg-slate-300 text-black"
                              : idx === 2
                              ? "bg-amber-700 text-white"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {idx + 1}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-sans">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="size-3 rounded-full shrink-0 shadow-sm"
                            style={{ backgroundColor: st.color }}
                          />
                          <div>
                            <div className="font-display font-bold text-foreground">
                              {st.name} <span className="font-mono text-muted-foreground text-xs">#{st.carNumber}</span>
                            </div>
                            {st.driverName && (
                              <div className="text-[11px] text-muted-foreground font-mono">
                                {st.driverName}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-foreground">
                        {formatTime(st.cumulativeTime)}
                      </td>

                      <td className="py-3 px-3 text-right text-muted-foreground">
                        {idx === 0 ? <span className="text-amber-500 font-bold">WINNER</span> : formatGap(st.gapToLeader)}
                      </td>

                      <td className="py-3 px-3 text-right text-purple-400 font-semibold">
                        {st.bestRoundTime ? formatTime(st.bestRoundTime) : "—"}
                      </td>

                      <td className="py-3 px-3 text-right text-muted-foreground">
                        {avgLap.toFixed(2)}s/lap
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Round by Round Breakdown Matrix */}
      {roundHistory.length > 0 && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base font-display font-bold flex items-center gap-2">
              <TableIcon className="size-4 text-primary" />
              Round-by-Round Breakdown (All 10 Rounds)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-border text-[10px] font-mono uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2 px-2.5">Team</th>
                    {Array.from({ length: 10 }).map((_, i) => (
                      <th key={i} className="py-2 px-2 text-right">
                        R{i + 1}
                      </th>
                    ))}
                    <th className="py-2 px-2.5 text-right font-bold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 font-mono text-[11px]">
                  {standings.map((st) => (
                    <tr key={st.teamId} className="hover:bg-muted/30">
                      <td className="py-2.5 px-2.5 font-sans font-semibold text-foreground flex items-center gap-2">
                        <span className="size-2 rounded-full" style={{ backgroundColor: st.color }} />
                        {st.name}
                      </td>
                      {Array.from({ length: 10 }).map((_, rIdx) => {
                        const roundData = roundHistory.find((rh) => rh.round === rIdx + 1);
                        const time = roundData?.times[st.teamId];
                        return (
                          <td key={rIdx} className="py-2.5 px-2 text-right text-muted-foreground">
                            {time ? `${time.toFixed(1)}s` : "—"}
                          </td>
                        );
                      })}
                      <td className="py-2.5 px-2.5 text-right font-bold text-foreground">
                        {formatTime(st.cumulativeTime)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
