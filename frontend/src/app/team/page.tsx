"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Trophy, ArrowRight } from "lucide-react";

export default function TeamStrategyPage() {
  const [action, setAction] = useState<"STAY_OUT" | "PIT_STOP">("STAY_OUT");
  const [targetLap, setTargetLap] = useState<string>("");
  const [newCompound, setNewCompound] = useState<string>("");

  return (
    <div className="flex flex-col gap-6 min-h-full pb-8">
      <PageHeader
        eyebrow="3-MINUTE WINDOW"
        title="Strategy Submission"
        description="Lock in your pit strategy for the upcoming 5-lap block."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Current Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" /> Current Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center text-sm border-b border-border pb-2.5">
              <span className="text-muted-foreground">Position</span>
              <span className="text-3xl font-bold font-display">P4</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-border pb-2.5">
              <span className="text-muted-foreground">Gap to P3</span>
              <span className="font-mono font-medium text-destructive-foreground">+1.850s</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-border pb-2.5">
              <span className="text-muted-foreground">Compound</span>
              <span className="flex items-center gap-2 font-medium">
                <span className="size-2.5 rounded-full bg-yellow-400"></span>
                Medium
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Tire Age (x)</span>
              <span className="font-mono font-medium">4 Laps</span>
            </div>
          </CardContent>
        </Card>

        {/* Strategy Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">Strategy Input</CardTitle>
            <CardDescription>Select your preferred strategy for the next block.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Driver Action</label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={action === "STAY_OUT" ? "default" : "outline"}
                  onClick={() => setAction("STAY_OUT")}
                  className="h-9"
                >
                  Stay Out
                </Button>
                <Button
                  variant={action === "PIT_STOP" ? "default" : "outline"}
                  onClick={() => setAction("PIT_STOP")}
                  className="h-9"
                >
                  Pit Stop
                </Button>
              </div>
            </div>

            {action === "PIT_STOP" && (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-200">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Target Lap</label>
                  <Select value={targetLap} onValueChange={(v) => setTargetLap(v ?? "")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Lap..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">Lap 6</SelectItem>
                      <SelectItem value="7">Lap 7</SelectItem>
                      <SelectItem value="8">Lap 8</SelectItem>
                      <SelectItem value="9">Lap 9</SelectItem>
                      <SelectItem value="10">Lap 10</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">New Compound</label>
                  <Select value={newCompound} onValueChange={(v) => setNewCompound(v ?? "")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Compound..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SOFT">
                        <span className="flex items-center gap-2">
                          <span className="size-2.5 rounded-full bg-red-500"></span> Soft
                        </span>
                      </SelectItem>
                      <SelectItem value="MEDIUM">
                        <span className="flex items-center gap-2">
                          <span className="size-2.5 rounded-full bg-yellow-400"></span> Medium
                        </span>
                      </SelectItem>
                      <SelectItem value="HARD">
                        <span className="flex items-center gap-2">
                          <span className="size-2.5 rounded-full bg-white border border-border"></span> Hard
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-2">
            <Button className="w-full gap-1.5">
              Confirm Submission
              <ArrowRight className="size-4" />
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Backend payload construction is pending. Visual UI only.
            </p>
          </CardFooter>
        </Card>
      </div>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Trophy className="h-4 w-4" /> Live Leaderboard</CardTitle>
          <CardDescription>Current race standings across all teams.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {[
              { p: "P1", name: "Team Redbull", gap: "Leader", tire: "HARD", color: "bg-white border border-border" },
              { p: "P2", name: "Team Mercedes", gap: "+3.200s", tire: "SOFT", color: "bg-red-500" },
              { p: "P3", name: "Team Aston", gap: "+5.100s", tire: "MED", color: "bg-yellow-400" },
              { p: "P4", name: "Your Team", gap: "+6.950s", tire: "MED", color: "bg-yellow-400", highlight: true },
              { p: "P5", name: "Team Ferrari", gap: "+8.400s", tire: "HARD", color: "bg-white border border-border" },
            ].map((row, i) => (
              <div
                key={i}
                className={`flex items-center justify-between px-3 py-2.5 rounded-md text-sm ${row.highlight ? "bg-primary/5 font-medium" : "hover:bg-muted/50 transition-colors"}`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-muted-foreground w-5">{row.p}</span>
                  <span>{row.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-muted-foreground">{row.gap}</span>
                  <span className={`size-2.5 rounded-full ${row.color}`}></span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
