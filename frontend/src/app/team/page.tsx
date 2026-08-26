"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Trophy, ArrowRight, Clock } from "lucide-react";
import { useRaceStore } from "@/lib/race-store";

export default function TeamStrategyPage() {
  const { 
    currentBlock, 
    currentLap, 
    windowOpen, 
    windowExpiresAt, 
    cars,
    standings,
    connectTeam,
    disconnect
  } = useRaceStore();

  const [teamId, setTeamId] = useState<string>("");
  const [action, setAction] = useState<"STAY_OUT" | "PIT">("STAY_OUT");
  const [targetLap, setTargetLap] = useState<string>("");
  const [newCompound, setNewCompound] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const token = localStorage.getItem("race_token");
    if (token) {
      let resolvedTeamId = "";
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.teamId) {
          resolvedTeamId = payload.teamId;
          setTeamId(payload.teamId);
        }
      } catch (e) {}

      if (resolvedTeamId) {
        connectTeam(resolvedTeamId, token);
      }
    }
    return () => disconnect();
  }, [connectTeam, disconnect]);

  useEffect(() => {
    if (!windowOpen || !windowExpiresAt) {
      setTimeLeft(0);
      return;
    }
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor(windowExpiresAt - Date.now() / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [windowOpen, windowExpiresAt]);

  const handleSubmit = async () => {
    const token = localStorage.getItem("race_token");
    const payload = {
      team_id: teamId,
      action: action,
      pit_lap: action === "PIT" ? parseInt(targetLap) : null,
      new_compound: action === "PIT" ? newCompound : null
    };

    await fetch("/api/strategy/submit", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` 
      },
      body: JSON.stringify(payload)
    });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const myCar = cars[teamId];
  const myPos = standings.find(s => s.team_id === teamId)?.position || "--";
  const myGap = (standings.find(s => s.team_id === teamId)?.gap_to_ahead ?? 0).toFixed(3);

  return (
    <div className="flex flex-col gap-6 min-h-full pb-8">
      <PageHeader
        eyebrow={windowOpen ? `BLOCK ${currentBlock} SUBMISSION OPEN` : "RACE LIVE"}
        title="Strategy Submission"
        description="Monitor your telemetry and lock in your strategy."
        actions={
          windowOpen ? (
            <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-md font-mono text-sm border border-border">
              <Clock className="h-4 w-4 text-primary" /> {formatTime(timeLeft)}
            </div>
          ) : null
        }
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
              <span className="text-3xl font-bold font-display">P{myPos}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-border pb-2.5">
              <span className="text-muted-foreground">Gap to Ahead</span>
              <span className="font-mono font-medium text-destructive-foreground">+{myGap}s</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-border pb-2.5">
              <span className="text-muted-foreground">Compound</span>
              <span className="flex items-center gap-2 font-medium">
                {myCar?.compound || "Unknown"}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Tire Age</span>
              <span className="font-mono font-medium">{myCar?.tire_age || 0} Laps</span>
            </div>
          </CardContent>
        </Card>

        {/* Strategy Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">Strategy Input</CardTitle>
            <CardDescription>
              {windowOpen 
                ? "Select your preferred strategy for the upcoming block." 
                : "Submission window is closed. Waiting for race block execution."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {myCar?.is_pit_blocked && (
              <div className="p-3 bg-red-600/20 border border-red-500/50 rounded-lg text-red-400 text-sm font-semibold flex items-center gap-2">
                <span>⚠️</span> MINISTER OF DEFENCE ACTIVE — PIT ENTRY CLOSED FOR THIS BLOCK
              </div>
            )}
            {myCar?.is_hammertime && (
              <div className="p-3 bg-purple-600/20 border border-purple-500/50 rounded-lg text-purple-300 text-sm font-semibold flex items-center gap-2">
                <span>🔨</span> HAMMERTIME ACTIVE — DEGRADATION COEFFICIENT FROZEN (x = 1)
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Driver Action</label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={action === "STAY_OUT" ? "default" : "outline"}
                  onClick={() => setAction("STAY_OUT")}
                  className="h-9"
                  disabled={!windowOpen || myCar?.has_submitted}
                >
                  Stay Out
                </Button>
                <Button
                  variant={action === "PIT" ? "default" : "outline"}
                  onClick={() => setAction("PIT")}
                  className="h-9"
                  disabled={!windowOpen || myCar?.has_submitted || Boolean(myCar?.is_pit_blocked)}
                >
                  Pit Stop
                </Button>
              </div>
            </div>

            {action === "PIT" && (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-200">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Target Lap</label>
                  <Select value={targetLap} onValueChange={(v) => setTargetLap(v ?? "")} disabled={!windowOpen || myCar?.has_submitted}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Lap..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({length: 5}, (_, i) => currentLap + i + 1).map(lap => (
                        <SelectItem key={lap} value={lap.toString()}>Lap {lap}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">New Compound</label>
                  <Select value={newCompound} onValueChange={(v) => setNewCompound(v ?? "")} disabled={!windowOpen || myCar?.has_submitted}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Compound..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SOFT">Soft (Red)</SelectItem>
                      <SelectItem value="MEDIUM">Medium (Yellow)</SelectItem>
                      <SelectItem value="HARD">Hard (White)</SelectItem>
                      <SelectItem value="INTER">Intermediate (Green)</SelectItem>
                      <SelectItem value="WET">Full Wet (Blue)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-2">
            <Button 
              className="w-full gap-1.5" 
              onClick={handleSubmit} 
              disabled={!windowOpen || myCar?.has_submitted || (action === "PIT" && (!targetLap || !newCompound))}
            >
              {myCar?.has_submitted ? "Strategy Locked In" : "Confirm Submission"}
              {!myCar?.has_submitted && <ArrowRight className="size-4" />}
            </Button>
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
            {standings.map((row) => (
              <div
                key={row.team_id}
                className={`flex items-center justify-between px-3 py-2.5 rounded-md text-sm ${row.team_id === teamId ? "bg-primary/10 font-medium border border-primary/20" : "hover:bg-muted/50 transition-colors"}`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-muted-foreground w-5">P{row.position}</span>
                  <span>{row.driver} <span className="text-muted-foreground text-xs">({row.team_id})</span></span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs text-muted-foreground">
                    {row.position === 1 ? "LEADER" : `+${(row.gap_to_leader ?? 0).toFixed(3)}s`}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">{row.compound || "—"}</span>
                </div>
              </div>
            ))}
            {standings.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">Grid not initialized yet.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
