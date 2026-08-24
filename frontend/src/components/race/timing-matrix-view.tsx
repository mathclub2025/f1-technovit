"use client";

import React from "react";
import { Team, RoundTiming } from "@/types/race";
import { formatTime } from "@/lib/presets";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Table as TableIcon, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface TimingMatrixViewProps {
  teams: Team[];
  roundHistory: RoundTiming[];
  currentRound: number;
}

export function TimingMatrixView({
  teams,
  roundHistory,
  currentRound,
}: TimingMatrixViewProps) {
  const handleExportCSV = () => {
    let csv = "Car Number,Team Name,Driver," + Array.from({ length: 10 }).map((_, i) => `Round ${i + 1} (s)`).join(",") + ",Total Time (s)\n";
    teams.forEach((t) => {
      let total = 0;
      const roundCols = Array.from({ length: 10 }).map((_, rIdx) => {
        const roundData = roundHistory.find((rh) => rh.round === rIdx + 1);
        const time = roundData?.times[t.id];
        if (time) total += time;
        return time ? time.toFixed(2) : "";
      });
      csv += `${t.carNumber},"${t.name}","${t.driverName || ""}",${roundCols.join(",")},${total.toFixed(2)}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "f1-timing-matrix.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Timing Matrix exported to CSV!");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="OFFICIAL FIA TELEMETRY"
        title="10-Round Timing Matrix"
        description="Detailed breakdown of 5-lap duration records for all registered constructors across the 50-lap race distance."
        actions={
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCSV}
            className="text-xs gap-1.5 h-8"
          >
            <Download className="size-3.5" /> Export Matrix (CSV)
          </Button>
        }
      />

      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display font-bold flex items-center gap-2">
            <TableIcon className="size-4 text-primary" />
            Round Breakdown (5 Laps Per Round)
          </CardTitle>
          <CardDescription className="text-xs">
            {roundHistory.length} of 10 rounds completed. Current active round: Round {currentRound}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-border text-[10px] font-mono uppercase text-muted-foreground bg-muted/20">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Constructor</th>
                  {Array.from({ length: 10 }).map((_, i) => (
                    <th
                      key={i}
                      className={`py-2.5 px-2 text-right ${
                        currentRound === i + 1 ? "text-primary font-bold bg-primary/5" : ""
                      }`}
                    >
                      R{i + 1}
                      <span className="block text-[8px] font-normal opacity-70">
                        {i * 5 + 1}–{(i + 1) * 5}L
                      </span>
                    </th>
                  ))}
                  <th className="py-2.5 px-3 text-right font-bold text-foreground">Cumulative</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-mono text-[11px]">
                {teams.map((team, idx) => {
                  let totalCumulative = 0;
                  return (
                    <tr key={team.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-3 text-muted-foreground w-6">
                        {idx + 1}
                      </td>

                      <td className="py-2.5 px-3 font-sans font-semibold text-foreground">
                        <div className="flex items-center gap-2">
                          <span
                            className="size-2.5 rounded-full shrink-0 shadow-sm"
                            style={{ backgroundColor: team.color }}
                          />
                          <span className="truncate">{team.name}</span>
                          <span className="text-muted-foreground font-mono text-[10px]">
                            #{team.carNumber}
                          </span>
                        </div>
                      </td>

                      {Array.from({ length: 10 }).map((_, rIdx) => {
                        const roundData = roundHistory.find((rh) => rh.round === rIdx + 1);
                        const time = roundData?.times[team.id];
                        if (time) totalCumulative += time;

                        const isCurrent = currentRound === rIdx + 1;
                        return (
                          <td
                            key={rIdx}
                            className={`py-2.5 px-2 text-right ${
                              isCurrent ? "bg-primary/5 font-semibold text-primary" : "text-muted-foreground"
                            }`}
                          >
                            {time ? `${time.toFixed(1)}s` : "—"}
                          </td>
                        );
                      })}

                      <td className="py-2.5 px-3 text-right font-bold text-foreground">
                        {totalCumulative > 0 ? formatTime(totalCumulative) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
