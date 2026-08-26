"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Clock, Play, Flag, SkipForward, Monitor } from "lucide-react";
import { useRaceStore } from "@/lib/race-store";

export default function AdminOverviewPage() {
  const { 
    currentBlock, 
    currentLap, 
    trackState, 
    windowOpen, 
    windowExpiresAt, 
    cars,
    queuedPowers,
    clearPowers,
    connectRace,
    disconnect
  } = useRaceStore();

  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [customTeams, setCustomTeams] = useState<string>("");

  useEffect(() => {
    const token = localStorage.getItem("race_token");
    if (token) {
      connectRace(token);
    }
    return () => disconnect();
  }, [connectRace, disconnect]);

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

  const handleInitGrid = async () => {
    const token = localStorage.getItem("race_token");
    let payload = undefined;
    
    if (customTeams.trim()) {
      const teamNames = customTeams.split(",").map(t => t.trim()).filter(Boolean);
      payload = {
        teams: teamNames.map(name => ({
          team_id: name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
          driver: name
        }))
      };
    }

    await fetch("/api/admin/init-grid", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: payload ? JSON.stringify(payload) : undefined
    });
  };

  const handleStartWindow = async () => {
    const token = localStorage.getItem("race_token");
    await fetch("/api/admin/start-window", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ duration_seconds: 180, block_number: currentBlock })
    });
  };

  const handleExecuteBlock = async () => {
    const token = localStorage.getItem("race_token");
    await fetch("/api/admin/execute-block", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({
        block_number: currentBlock,
        start_lap: currentLap + 1,
        end_lap: currentLap + 5,
        track_state: trackState,
        active_modifiers: queuedPowers
      })
    });
    clearPowers();
  };

  const handleForceClose = async () => {
    const token = localStorage.getItem("race_token");
    await fetch("/api/admin/force-submit", {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` }
    });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const activeTeamsCount = Object.keys(cars).length;
  const submissionsCount = Object.values(cars).filter(c => c.has_submitted).length;

  return (
    <div className="flex flex-col gap-6 min-h-full pb-8">
      <PageHeader
        eyebrow="RACE DIRECTOR"
        title="Admin Overview"
        description="Monitor race state, team submissions, and manage the Grand Prix."
        actions={
          <div className="flex gap-2 items-center">
            <input 
              type="text" 
              placeholder="e.g. Alpha, Beta, Delta..."
              value={customTeams}
              onChange={(e) => setCustomTeams(e.target.value)}
              className="px-3 py-1.5 text-sm bg-black/50 border border-white/10 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-red-600 w-48"
              title="Comma-separated list of team names formed today"
            />
            <Button onClick={handleInitGrid} variant="outline" size="sm" className="gap-1.5">
              <Flag className="h-3.5 w-3.5" /> Setup Race Grid
            </Button>
            <Button onClick={handleStartWindow} variant="secondary" size="sm" className="gap-1.5" disabled={windowOpen}>
              <Play className="h-3.5 w-3.5" /> Start Window
            </Button>
            <Button onClick={handleExecuteBlock} size="sm" className="gap-1.5" disabled={windowOpen && timeLeft > 0}>
              <SkipForward className="h-3.5 w-3.5" /> Execute Block {currentBlock}
            </Button>
            <Link href="/race" target="_blank">
              <Button variant="default" size="sm" className="gap-1.5 bg-red-600 hover:bg-red-700 text-white font-bold">
                <Monitor className="h-3.5 w-3.5" /> Projector View (/race)
              </Button>
            </Link>
          </div>
        }
      />

      {/* Stat Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Lap</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display">{currentLap} / 50</div>
            <p className="text-xs text-muted-foreground mt-1">Block {currentBlock} of 10</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Teams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display">{activeTeamsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Connected on grid</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display text-emerald-600 dark:text-emerald-500">{submissionsCount} / {activeTeamsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">For current block</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Track State</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display">{trackState}</div>
            <p className="text-xs text-muted-foreground mt-1">Global weather</p>
          </CardContent>
        </Card>
      </div>

      {/* Strategy Inspection Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" /> Strategy Inspection Table
          </CardTitle>
          <CardDescription>Live view of all team strategies for the current block.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2.5 px-3 text-muted-foreground font-medium">Team</th>
                  <th className="text-left py-2.5 px-3 text-muted-foreground font-medium">Action</th>
                  <th className="text-left py-2.5 px-3 text-muted-foreground font-medium">Compound</th>
                  <th className="text-left py-2.5 px-3 text-muted-foreground font-medium">Tire Age</th>
                  <th className="text-left py-2.5 px-3 text-muted-foreground font-medium">Pit Count</th>
                  <th className="text-left py-2.5 px-3 text-muted-foreground font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(cars).map((car) => (
                  <tr key={car.team_id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="py-2.5 px-3 font-medium">{car.driver} ({car.team_id})</td>
                    <td className="py-2.5 px-3">{car.action}</td>
                    <td className="py-2.5 px-3 font-mono text-xs">{car.next_compound ? `${car.compound} → ${car.next_compound}` : car.compound}</td>
                    <td className="py-2.5 px-3 font-mono text-xs">{car.tire_age} laps</td>
                    <td className="py-2.5 px-3 font-mono text-xs">{car.pit_stop_count}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant={car.has_submitted ? "default" : "secondary"}>
                        {car.has_submitted ? "Submitted" : "Pending"}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {activeTeamsCount === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-muted-foreground">Grid not set up. Click Setup Race Grid.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Timer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" /> Submission Timer
          </CardTitle>
          <CardDescription>Time remaining for teams to submit their strategy.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-4xl font-bold font-display font-mono">
              {windowOpen ? formatTime(timeLeft) : "0:00"}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleForceClose} variant="destructive" size="sm" disabled={!windowOpen}>Force Close</Button>
            </div>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden mt-4">
            <div 
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: windowOpen ? `${(timeLeft / 180) * 100}%` : "0%" }}
            ></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
