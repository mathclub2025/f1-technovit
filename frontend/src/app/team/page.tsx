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

            {/* Tactical Superpowers Section */}
            <div className="border-t border-border pt-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold flex items-center gap-2">
                    <span className="text-purple-400">⚡</span> Tactical Superpowers
                    <span className="text-xs text-muted-foreground font-normal">(1-Time Activation Per Grand Prix)</span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Deploy a legendary driver power to gain a mathematical edge or disrupt rivals for this 5-lap block.
                  </p>
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

              {myCar?.has_used_power ? (
                <div className="p-4 bg-zinc-900/60 rounded-xl border border-border text-sm text-muted-foreground flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🔒</span>
                    <div>
                      <div className="font-semibold text-zinc-300">Superpower Redeemed</div>
                      <div className="text-xs text-zinc-500">Your team has already utilized its 1-time tactical superpower for this Grand Prix.</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono uppercase bg-zinc-800 text-zinc-400 px-2 py-1 rounded">Locked</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* Hammertime */}
                    <div 
                      onClick={() => !myCar?.has_submitted && windowOpen && setSelectedPower(selectedPower === "HAMMERTIME" ? "NONE" : "HAMMERTIME")}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        selectedPower === "HAMMERTIME"
                          ? "border-purple-500 bg-purple-950/40 shadow-[0_0_15px_rgba(168,85,247,0.25)] ring-1 ring-purple-500"
                          : "border-border bg-card/60 hover:bg-muted/40 hover:border-zinc-700"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-lg">🔨</span>
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            selectedPower === "HAMMERTIME" ? "bg-purple-600 text-white" : "bg-zinc-800 text-zinc-400"
                          }`}>
                            {selectedPower === "HAMMERTIME" ? "SELECTED" : "OFFENSIVE"}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-foreground">Hammertime</h4>
                        <p className="text-[11px] text-purple-300 font-medium">Lewis Hamilton</p>
                        <p className="text-xs text-muted-foreground mt-2 leading-snug">
                          Freezes tire degradation coefficient at <strong className="text-zinc-200">x = 1</strong> for all 5 laps. Full fresh-rubber grip regardless of tire age.
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        variant={selectedPower === "HAMMERTIME" ? "default" : "outline"}
                        className={`w-full mt-3 h-8 text-xs ${selectedPower === "HAMMERTIME" ? "bg-purple-600 hover:bg-purple-700 text-white" : ""}`}
                        disabled={!windowOpen || myCar?.has_submitted}
                      >
                        {selectedPower === "HAMMERTIME" ? "✓ Redeemed for Block" : "Redeem Hammertime"}
                      </Button>
                    </div>

                    {/* Blitzkrieg */}
                    <div 
                      onClick={() => !myCar?.has_submitted && windowOpen && setSelectedPower(selectedPower === "BLITZKRIEG" ? "NONE" : "BLITZKRIEG")}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        selectedPower === "BLITZKRIEG"
                          ? "border-amber-500 bg-amber-950/40 shadow-[0_0_15px_rgba(245,158,11,0.25)] ring-1 ring-amber-500"
                          : "border-border bg-card/60 hover:bg-muted/40 hover:border-zinc-700"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-lg">⚡</span>
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            selectedPower === "BLITZKRIEG" ? "bg-amber-600 text-black" : "bg-zinc-800 text-zinc-400"
                          }`}>
                            {selectedPower === "BLITZKRIEG" ? "SELECTED" : "PIT STRATEGY"}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-foreground">Blitzkrieg</h4>
                        <p className="text-[11px] text-amber-300 font-medium">Max Verstappen</p>
                        <p className="text-xs text-muted-foreground mt-2 leading-snug">
                          Pit stop penalty slashed to flat <strong className="text-zinc-200">10.00s</strong> (saving 10s) with 100% immunity to pitlane traffic congestion.
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        variant={selectedPower === "BLITZKRIEG" ? "default" : "outline"}
                        className={`w-full mt-3 h-8 text-xs ${selectedPower === "BLITZKRIEG" ? "bg-amber-500 hover:bg-amber-600 text-black font-bold" : ""}`}
                        disabled={!windowOpen || myCar?.has_submitted}
                      >
                        {selectedPower === "BLITZKRIEG" ? "✓ Redeemed for Block" : "Redeem Blitzkrieg"}
                      </Button>
                    </div>

                    {/* Rainmaster */}
                    <div 
                      onClick={() => !myCar?.has_submitted && windowOpen && setSelectedPower(selectedPower === "RAINMASTER" ? "NONE" : "RAINMASTER")}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        selectedPower === "RAINMASTER"
                          ? "border-blue-500 bg-blue-950/40 shadow-[0_0_15px_rgba(59,130,246,0.25)] ring-1 ring-blue-500"
                          : "border-border bg-card/60 hover:bg-muted/40 hover:border-zinc-700"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-lg">🌧️</span>
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            selectedPower === "RAINMASTER" ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400"
                          }`}>
                            {selectedPower === "RAINMASTER" ? "SELECTED" : "WEATHER"}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-foreground">Rainmaster</h4>
                        <p className="text-[11px] text-blue-300 font-medium">Michael Schumacher</p>
                        <p className="text-xs text-muted-foreground mt-2 leading-snug">
                          Wet track slick penalty reduced from <strong className="text-zinc-200">+12.00s down to +2.00s</strong>. Brave the rain on slicks without losing time.
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        variant={selectedPower === "RAINMASTER" ? "default" : "outline"}
                        className={`w-full mt-3 h-8 text-xs ${selectedPower === "RAINMASTER" ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}`}
                        disabled={!windowOpen || myCar?.has_submitted}
                      >
                        {selectedPower === "RAINMASTER" ? "✓ Redeemed for Block" : "Redeem Rainmaster"}
                      </Button>
                    </div>

                    {/* Plan E */}
                    <div 
                      onClick={() => !myCar?.has_submitted && windowOpen && setSelectedPower(selectedPower === "PLAN_E" ? "NONE" : "PLAN_E")}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        selectedPower === "PLAN_E"
                          ? "border-emerald-500 bg-emerald-950/40 shadow-[0_0_15px_rgba(16,185,129,0.25)] ring-1 ring-emerald-500"
                          : "border-border bg-card/60 hover:bg-muted/40 hover:border-zinc-700"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-lg">🎲</span>
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            selectedPower === "PLAN_E" ? "bg-emerald-600 text-white" : "bg-zinc-800 text-zinc-400"
                          }`}>
                            {selectedPower === "PLAN_E" ? "SELECTED" : "GAMBLE"}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-foreground">Plan E</h4>
                        <p className="text-[11px] text-emerald-300 font-medium">Charles Leclerc</p>
                        <p className="text-xs text-muted-foreground mt-2 leading-snug">
                          High-risk pit gamble. Success results in an ultra-fast <strong className="text-zinc-200">5.00s</strong> stop; failure yields <strong className="text-zinc-200">30.00s</strong>.
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        variant={selectedPower === "PLAN_E" ? "default" : "outline"}
                        className={`w-full mt-3 h-8 text-xs ${selectedPower === "PLAN_E" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`}
                        disabled={!windowOpen || myCar?.has_submitted}
                      >
                        {selectedPower === "PLAN_E" ? "✓ Redeemed for Block" : "Redeem Plan E"}
                      </Button>
                    </div>

                    {/* Minister of Defence */}
                    <div 
                      onClick={() => !myCar?.has_submitted && windowOpen && setSelectedPower(selectedPower === "MINISTER_OF_DEFENCE" ? "NONE" : "MINISTER_OF_DEFENCE")}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between md:col-span-2 lg:col-span-2 ${
                        selectedPower === "MINISTER_OF_DEFENCE"
                          ? "border-red-500 bg-red-950/40 shadow-[0_0_15px_rgba(239,68,68,0.25)] ring-1 ring-red-500"
                          : "border-border bg-card/60 hover:bg-muted/40 hover:border-zinc-700"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🛡️</span>
                            <h4 className="font-bold text-sm text-foreground">Minister of Defence</h4>
                          </div>
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            selectedPower === "MINISTER_OF_DEFENCE" ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-400"
                          }`}>
                            {selectedPower === "MINISTER_OF_DEFENCE" ? "SELECTED" : "DEFENSIVE BLOCK"}
                          </span>
                        </div>
                        <p className="text-[11px] text-red-300 font-medium">Fernando Alonso</p>
                        <p className="text-xs text-muted-foreground mt-1 leading-snug">
                          Target an opponent team to <strong className="text-red-300">block their pit entry</strong> for this block. If they attempt to pit, their stop is rejected!
                        </p>
                      </div>

                      {selectedPower === "MINISTER_OF_DEFENCE" && (
                        <div className="mt-3 p-2.5 bg-black/50 border border-red-500/40 rounded-lg space-y-1.5 animate-in fade-in" onClick={(e) => e.stopPropagation()}>
                          <label className="text-xs font-semibold text-red-300">Choose Target Opponent Team to Block:</label>
                          <Select value={alonsoTarget} onValueChange={(v) => setAlonsoTarget(v ?? "")} disabled={!windowOpen || myCar?.has_submitted}>
                            <SelectTrigger className="bg-background h-8 text-xs">
                              <SelectValue placeholder="Select target opponent..." />
                            </SelectTrigger>
                            <SelectContent>
                              {otherCars.map((c) => (
                                <SelectItem key={c.team_id} value={c.team_id}>{c.driver} ({c.team_id})</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <Button 
                        size="sm" 
                        variant={selectedPower === "MINISTER_OF_DEFENCE" ? "default" : "outline"}
                        className={`w-full mt-3 h-8 text-xs ${selectedPower === "MINISTER_OF_DEFENCE" ? "bg-red-600 hover:bg-red-700 text-white" : ""}`}
                        disabled={!windowOpen || myCar?.has_submitted}
                      >
                        {selectedPower === "MINISTER_OF_DEFENCE" ? "✓ Redeemed for Block" : "Redeem Minister of Defence"}
                      </Button>
                    </div>
                  </div>

                  {selectedPower !== "NONE" && (
                    <div className="flex items-center justify-between px-3 py-2 bg-purple-950/30 border border-purple-500/30 rounded-lg text-xs">
                      <span className="text-purple-300 font-medium flex items-center gap-1.5">
                        <span>⚡</span> Queued: <strong>{selectedPower}</strong>
                      </span>
                      <button 
                        type="button"
                        onClick={() => setSelectedPower("NONE")} 
                        className="text-xs text-zinc-400 hover:text-white underline cursor-pointer"
                      >
                        Cancel & Save Power for Later
                      </button>
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
