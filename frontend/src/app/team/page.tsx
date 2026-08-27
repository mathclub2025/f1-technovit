"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Activity, Trophy, ArrowRight, Clock, Zap } from "lucide-react";
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
        {/* Left: Current Status */}
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

        {/* Right: Strategy Input */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">Strategy Input</CardTitle>
            <CardDescription>
              {windowOpen 
                ? "Select your driver action for the upcoming 5-lap block." 
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
        </Card>
      </div>

      {/* Separate Row: Available Powers (Matching Admin Powers Table Style) */}
      <Card className="w-full">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="h-4 w-4 text-purple-400" /> Available Powers
              </CardTitle>
              <CardDescription>
                Deploy your 1-time tactical superpower to gain a mathematical edge or disrupt rivals for this 5-lap block.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Status:</span>
              <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded border ${
                myCar?.has_used_power 
                  ? "bg-zinc-900 border-zinc-700 text-zinc-400" 
                  : selectedPower !== "NONE" 
                  ? "bg-purple-950 border-purple-500 text-purple-300 animate-pulse" 
                  : "bg-emerald-950/60 border-emerald-500/50 text-emerald-300"
              }`}>
                {myCar?.has_used_power 
                  ? `REDEEMED (${myCar.active_power || "USED"})` 
                  : selectedPower !== "NONE" 
                  ? `QUEUED: ${selectedPower}` 
                  : "AVAILABLE TO USE"}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {myCar?.has_used_power ? (
            <div className="p-4 bg-zinc-900/60 rounded-xl border border-border text-sm text-muted-foreground flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔒</span>
                <div>
                  <div className="font-semibold text-zinc-300">Superpower Redeemed</div>
                  <div className="text-xs text-zinc-500">Your team has already utilized its 1-time tactical superpower for this Grand Prix.</div>
                </div>
              </div>
              <span className="text-xs font-mono uppercase bg-zinc-800 text-zinc-400 px-2.5 py-1 rounded">Locked</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2.5 px-3 text-muted-foreground font-medium w-[260px]">Power</th>
                    <th className="text-left py-2.5 px-3 text-muted-foreground font-medium">Effect</th>
                    <th className="text-right py-2.5 px-3 text-muted-foreground font-medium w-[120px]">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Hammertime */}
                  <tr className={`border-b border-border hover:bg-muted/40 transition-colors ${selectedPower === "HAMMERTIME" ? "bg-purple-950/20" : ""}`}>
                    <td className="py-3 px-3 font-medium">
                      Lewis Hamilton (Hammertime)
                      <br />
                      <Badge variant="secondary" className="mt-1 text-[10px] bg-purple-900/40 text-purple-300 border border-purple-500/30">Offensive</Badge>
                    </td>
                    <td className="py-3 px-3 text-muted-foreground">
                      Forces tire age <strong className="text-foreground">x = 1</strong> for all 5 laps, ignoring actual tire degradation and preserving maximum grip.
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Button
                        size="sm"
                        variant={selectedPower === "HAMMERTIME" ? "default" : "outline"}
                        className={`h-8 px-3 text-xs ${selectedPower === "HAMMERTIME" ? "bg-purple-600 hover:bg-purple-700 text-white" : ""}`}
                        onClick={() => setSelectedPower(selectedPower === "HAMMERTIME" ? "NONE" : "HAMMERTIME")}
                        disabled={!windowOpen || myCar?.has_submitted}
                      >
                        {selectedPower === "HAMMERTIME" ? "✓ Queued" : "Queue"}
                      </Button>
                    </td>
                  </tr>

                  {/* Blitzkrieg */}
                  <tr className={`border-b border-border hover:bg-muted/40 transition-colors ${selectedPower === "BLITZKRIEG" ? "bg-amber-950/20" : ""}`}>
                    <td className="py-3 px-3 font-medium">
                      Max Verstappen (Blitzkrieg)
                      <br />
                      <Badge variant="secondary" className="mt-1 text-[10px] bg-amber-900/40 text-amber-300 border border-amber-500/30">Pit Strategy</Badge>
                    </td>
                    <td className="py-3 px-3 text-muted-foreground">
                      Flat <strong className="text-foreground">10.00s</strong> pit stop delta and complete immunity from pitlane traffic congestion penalties (+6.00s).
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Button
                        size="sm"
                        variant={selectedPower === "BLITZKRIEG" ? "default" : "outline"}
                        className={`h-8 px-3 text-xs ${selectedPower === "BLITZKRIEG" ? "bg-amber-500 hover:bg-amber-600 text-black font-bold" : ""}`}
                        onClick={() => setSelectedPower(selectedPower === "BLITZKRIEG" ? "NONE" : "BLITZKRIEG")}
                        disabled={!windowOpen || myCar?.has_submitted}
                      >
                        {selectedPower === "BLITZKRIEG" ? "✓ Queued" : "Queue"}
                      </Button>
                    </td>
                  </tr>

                  {/* Rainmaster */}
                  <tr className={`border-b border-border hover:bg-muted/40 transition-colors ${selectedPower === "RAINMASTER" ? "bg-blue-950/20" : ""}`}>
                    <td className="py-3 px-3 font-medium">
                      Michael Schumacher (Rainmaster)
                      <br />
                      <Badge variant="secondary" className="mt-1 text-[10px] bg-blue-900/40 text-blue-300 border border-blue-500/30">Weather</Badge>
                    </td>
                    <td className="py-3 px-3 text-muted-foreground">
                      Reduces wet-on-slicks penalty from <strong className="text-foreground">+12.00s down to +2.00s</strong> per lap on a wet track.
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Button
                        size="sm"
                        variant={selectedPower === "RAINMASTER" ? "default" : "outline"}
                        className={`h-8 px-3 text-xs ${selectedPower === "RAINMASTER" ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}`}
                        onClick={() => setSelectedPower(selectedPower === "RAINMASTER" ? "NONE" : "RAINMASTER")}
                        disabled={!windowOpen || myCar?.has_submitted}
                      >
                        {selectedPower === "RAINMASTER" ? "✓ Queued" : "Queue"}
                      </Button>
                    </td>
                  </tr>

                  {/* Plan E */}
                  <tr className={`border-b border-border hover:bg-muted/40 transition-colors ${selectedPower === "PLAN_E" ? "bg-emerald-950/20" : ""}`}>
                    <td className="py-3 px-3 font-medium">
                      Charles Leclerc (Plan E)
                      <br />
                      <Badge variant="secondary" className="mt-1 text-[10px] bg-emerald-900/40 text-emerald-300 border border-emerald-500/30">Tactical</Badge>
                    </td>
                    <td className="py-3 px-3 text-muted-foreground">
                      Sets pit penalty to exact die-roll value (<strong className="text-foreground">5.00s success / 30.00s fail</strong>).
                      {selectedPower === "PLAN_E" && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">Die-roll Pit Penalty:</span>
                          <Select value={planEPenalty} onValueChange={(v) => setPlanEPenalty(v ?? "5")} disabled={!windowOpen || myCar?.has_submitted}>
                            <SelectTrigger className="h-8 w-[150px]">
                              <SelectValue placeholder="Penalty" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5.00s (Success)</SelectItem>
                              <SelectItem value="30">30.00s (Fail)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Button
                        size="sm"
                        variant={selectedPower === "PLAN_E" ? "default" : "outline"}
                        className={`h-8 px-3 text-xs ${selectedPower === "PLAN_E" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`}
                        onClick={() => setSelectedPower(selectedPower === "PLAN_E" ? "NONE" : "PLAN_E")}
                        disabled={!windowOpen || myCar?.has_submitted}
                      >
                        {selectedPower === "PLAN_E" ? "✓ Queued" : "Queue"}
                      </Button>
                    </td>
                  </tr>

                  {/* Minister of Defence */}
                  <tr className={`border-b-0 hover:bg-muted/40 transition-colors ${selectedPower === "MINISTER_OF_DEFENCE" ? "bg-red-950/20" : ""}`}>
                    <td className="py-3 px-3 font-medium">
                      Fernando Alonso (Minister of Defence)
                      <br />
                      <Badge variant="secondary" className="mt-1 text-[10px] bg-red-900/40 text-red-300 border border-red-500/30">Defensive</Badge>
                    </td>
                    <td className="py-3 px-3 text-muted-foreground">
                      Closes pit entry and blocks pit execution for the selected target team.
                      {selectedPower === "MINISTER_OF_DEFENCE" && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">Target Opponent:</span>
                          <Select value={alonsoTarget} onValueChange={(v) => setAlonsoTarget(v ?? "")} disabled={!windowOpen || myCar?.has_submitted}>
                            <SelectTrigger className="h-8 w-[200px]">
                              <SelectValue placeholder="Select Target..." />
                            </SelectTrigger>
                            <SelectContent>
                              {otherCars.map((c) => (
                                <SelectItem key={c.team_id} value={c.team_id}>{c.driver} ({c.team_id})</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Button
                        size="sm"
                        variant={selectedPower === "MINISTER_OF_DEFENCE" ? "default" : "outline"}
                        className={`h-8 px-3 text-xs ${selectedPower === "MINISTER_OF_DEFENCE" ? "bg-red-600 hover:bg-red-700 text-white" : ""}`}
                        onClick={() => setSelectedPower(selectedPower === "MINISTER_OF_DEFENCE" ? "NONE" : "MINISTER_OF_DEFENCE")}
                        disabled={!windowOpen || myCar?.has_submitted}
                      >
                        {selectedPower === "MINISTER_OF_DEFENCE" ? "✓ Queued" : "Queue"}
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Master Confirm Submission Button */}
      <div className="flex flex-col gap-2">
        <Button 
          size="lg"
          className="w-full h-12 text-base font-bold gap-2 shadow-lg" 
          onClick={handleSubmit} 
          disabled={
            !windowOpen || 
            myCar?.has_submitted || 
            (action === "PIT" && (!targetLap || !newCompound)) ||
            (selectedPower === "MINISTER_OF_DEFENCE" && !alonsoTarget)
          }
        >
          {myCar?.has_submitted ? "Strategy & Powers Locked In" : "Confirm Submission"}
          {!myCar?.has_submitted && <ArrowRight className="size-5" />}
        </Button>
        {selectedPower !== "NONE" && !myCar?.has_submitted && (
          <p className="text-xs text-center text-purple-300">
            Submitting will lock in your strategy + activate <strong className="uppercase">{selectedPower}</strong> for the upcoming block.
          </p>
        )}
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
