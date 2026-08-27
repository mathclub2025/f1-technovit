"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Trophy, ArrowRight, Clock } from "lucide-react";
import { useRaceStore } from "@/lib/race-store";
import { toast } from "sonner";

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
  const [selectedPower, setSelectedPower] = useState<string>("NONE");
  const [alonsoTarget, setAlonsoTarget] = useState<string>("");
  const [planEPenalty, setPlanEPenalty] = useState<string>("5");
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

    // Heartbeat poll for fast window open / lock sync
    const poll = setInterval(() => {
      fetch("/api/standings")
        .then((res) => res.json())
        .then((data) => {
          if (data.current_block !== undefined) useRaceStore.setState({ currentBlock: data.current_block });
          if (data.current_lap !== undefined) useRaceStore.setState({ currentLap: data.current_lap });
          if (data.track_state !== undefined) useRaceStore.setState({ trackState: data.track_state });
          if (data.window_open !== undefined) useRaceStore.setState({ windowOpen: data.window_open });
          if (data.window_expires_at !== undefined) useRaceStore.setState({ windowExpiresAt: data.window_expires_at });
          if (data.standings !== undefined) useRaceStore.setState({ standings: data.standings });
          if (data.cars !== undefined) useRaceStore.setState({ cars: data.cars });
        })
        .catch(() => {});
    }, 2000);

    return () => {
      clearInterval(poll);
      disconnect();
    };
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

  const normalize = (id?: string) => (id || "").toLowerCase().replace(/[^a-z0-9]/g, "");

  const myCar = Object.values(cars).find(
    c => normalize(c.team_id) === normalize(teamId) || normalize(c.driver) === normalize(teamId)
  ) || cars[teamId];

  const myStandings = standings.find(
    s => normalize(s.team_id) === normalize(teamId) || normalize(s.driver) === normalize(teamId)
  );

  const otherCars = Object.values(cars).filter(
    c => normalize(c.team_id) !== normalize(teamId) && normalize(c.driver) !== normalize(teamId)
  );

  const myPos = myStandings?.position || "--";
  const myGap = (myStandings?.gap_to_ahead ?? 0).toFixed(3);

  const handleSubmit = async () => {
    const token = localStorage.getItem("race_token");
    const targetTeamId = myCar?.team_id || teamId;
    const payload = {
      team_id: targetTeamId,
      round_number: currentBlock,
      action: action,
      pit_lap: action === "PIT" ? parseInt(targetLap) : null,
      new_compound: action === "PIT" ? newCompound : null,
      use_power: selectedPower !== "NONE" ? selectedPower : null,
      power_target_team_id: selectedPower === "MINISTER_OF_DEFENCE" ? alonsoTarget : null,
      plan_e_penalty: selectedPower === "PLAN_E" ? parseFloat(planEPenalty) : null,
    };

    try {
      const res = await fetch("/api/strategy/submit", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        const powerMsg = selectedPower !== "NONE" ? ` + Activated ${selectedPower}!` : "";
        toast("Strategy Locked In!", { description: `${action === "PIT" ? `Pit on Lap ${targetLap} for ${newCompound}` : "Staying Out"}${powerMsg}` });
      } else {
        toast("Submission Error", { description: data.detail || "Could not submit strategy." });
      }
    } catch (e) {
      toast("Network Error", { description: "Failed to connect to pit wall server." });
    }
  };

  return (
    <div className="flex flex-col gap-6 min-h-full pb-8">
      <PageHeader
        eyebrow="RACE LIVE"
        title="Strategy Submission"
        description="Monitor your telemetry, calculate mathematical tire models, and lock in your strategy."
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card text-card-foreground shadow-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Window:</span>
              <span className={`font-mono text-sm font-bold ${windowOpen ? "text-primary animate-pulse" : "text-muted-foreground"}`}>
                {windowOpen ? `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, "0")}` : "CLOSED"}
              </span>
            </div>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Current Status */}
        <Card className="lg:col-span-1">
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
            <div className="flex justify-between items-center text-sm border-b border-border pb-2.5">
              <span className="text-muted-foreground">Tire Age</span>
              <span className="font-mono font-medium">{myCar?.tire_age || 0} Laps</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Superpower Status</span>
              <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${myCar?.has_used_power ? "bg-zinc-800 text-zinc-400" : "bg-purple-900/60 text-purple-200 border border-purple-500/40"}`}>
                {myCar?.has_used_power ? "REDEEMED" : "AVAILABLE"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Strategy Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">Strategy Input</CardTitle>
            <CardDescription>
              {windowOpen 
                ? "Select your preferred strategy and optional tactical superpower for the upcoming block." 
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

            {/* Tactical Superpower Section */}
            <div className="border-t border-border pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <span>⚡</span> Tactical Superpower <span className="text-xs text-muted-foreground font-normal">(1-time activation per race)</span>
                </label>
                {myCar?.has_used_power && (
                  <span className="text-xs text-zinc-500 font-mono">Already used</span>
                )}
              </div>

              {myCar?.has_used_power ? (
                <div className="p-3 bg-zinc-900/60 rounded-lg border border-border text-xs text-muted-foreground flex items-center justify-between">
                  <span>Superpower redeemed: <strong className="text-zinc-300 uppercase">{myCar.active_power || "Activated"}</strong></span>
                  <span className="text-[10px] uppercase tracking-wider font-mono text-zinc-500">Locked</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <Select 
                    value={selectedPower} 
                    onValueChange={(v) => setSelectedPower(v ?? "NONE")}
                    disabled={!windowOpen || myCar?.has_submitted}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a superpower to activate..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">None (Save superpower for later block)</SelectItem>
                      <SelectItem value="HAMMERTIME">🔨 Lewis Hamilton (Hammertime) — Freeze tire degradation (x = 1)</SelectItem>
                      <SelectItem value="BLITZKRIEG">⚡ Max Verstappen (Blitzkrieg) — 10.00s pit stop & congestion immunity</SelectItem>
                      <SelectItem value="RAINMASTER">🌧️ Michael Schumacher (Rainmaster) — Wet-on-slicks penalty cut to +2.00s</SelectItem>
                      <SelectItem value="PLAN_E">🎲 Charles Leclerc (Plan E) — Tactical pit gamble (5.00s / 30.00s)</SelectItem>
                      <SelectItem value="MINISTER_OF_DEFENCE">🛡️ Fernando Alonso (Minister of Defence) — Block rival pit entry</SelectItem>
                    </SelectContent>
                  </Select>

                  {selectedPower === "MINISTER_OF_DEFENCE" && (
                    <div className="p-3 bg-red-950/30 border border-red-500/40 rounded-lg space-y-2 animate-in fade-in duration-200">
                      <label className="text-xs font-semibold text-red-300">Select Opponent Team to Block from Pitlane:</label>
                      <Select value={alonsoTarget} onValueChange={(v) => setAlonsoTarget(v ?? "")} disabled={!windowOpen || myCar?.has_submitted}>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select target team..." />
                        </SelectTrigger>
                        <SelectContent>
                          {otherCars.map((c) => (
                            <SelectItem key={c.team_id} value={c.team_id}>{c.driver} ({c.team_id})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {selectedPower === "PLAN_E" && (
                    <div className="p-3 bg-purple-950/30 border border-purple-500/40 rounded-lg space-y-2 animate-in fade-in duration-200">
                      <label className="text-xs font-semibold text-purple-300">Plan E Die-Roll Pit Delta:</label>
                      <Select value={planEPenalty} onValueChange={(v) => setPlanEPenalty(v ?? "5")} disabled={!windowOpen || myCar?.has_submitted}>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select outcome..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5.00s (Success outcome)</SelectItem>
                          <SelectItem value="30">30.00s (Fail outcome)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-2">
            <Button 
              className="w-full gap-1.5" 
              onClick={handleSubmit} 
              disabled={
                !windowOpen || 
                myCar?.has_submitted || 
                (action === "PIT" && (!targetLap || !newCompound)) ||
                (selectedPower === "MINISTER_OF_DEFENCE" && !alonsoTarget)
              }
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
