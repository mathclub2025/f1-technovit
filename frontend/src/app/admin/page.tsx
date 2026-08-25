"use client";

import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Users, Clock, Play, Pause } from "lucide-react";

export default function AdminOverviewPage() {
  return (
    <div className="flex flex-col gap-6 min-h-full pb-8">
      <PageHeader
        eyebrow="RACE DIRECTOR"
        title="Admin Overview"
        description="Monitor race state, team submissions, and manage the Grand Prix."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Pause className="h-3.5 w-3.5" /> Pause Race
            </Button>
            <Button size="sm" className="gap-1.5">
              <Play className="h-3.5 w-3.5" /> Start Next Block
            </Button>
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
            <div className="text-3xl font-bold font-display">5 / 50</div>
            <p className="text-xs text-muted-foreground mt-1">Block 1 of 10</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Teams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display">8</div>
            <p className="text-xs text-muted-foreground mt-1">All teams registered</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display text-emerald-600 dark:text-emerald-500">6 / 8</div>
            <p className="text-xs text-muted-foreground mt-1">For current block</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Track State</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display">Dry</div>
            <p className="text-xs text-muted-foreground mt-1">Phase A active</p>
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
                  <th className="text-left py-2.5 px-3 text-muted-foreground font-medium">Position</th>
                  <th className="text-left py-2.5 px-3 text-muted-foreground font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "Team Redbull", action: "Stay Out", compound: "Hard", age: 5, pos: "P1", submitted: true },
                  { name: "Team Mercedes", action: "Pit Stop", compound: "Soft → Med", age: 0, pos: "P2", submitted: true },
                  { name: "Team Aston", action: "Stay Out", compound: "Medium", age: 3, pos: "P3", submitted: true },
                  { name: "Team Ferrari", action: "Stay Out", compound: "Hard", age: 5, pos: "P4", submitted: true },
                  { name: "Team McLaren", action: "Pit Stop", compound: "Med → Soft", age: 0, pos: "P5", submitted: true },
                  { name: "Team Alpine", action: "Stay Out", compound: "Soft", age: 4, pos: "P6", submitted: true },
                  { name: "Team Haas", action: "—", compound: "Medium", age: 5, pos: "P7", submitted: false },
                  { name: "Team Williams", action: "—", compound: "Hard", age: 5, pos: "P8", submitted: false },
                ].map((t, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="py-2.5 px-3 font-medium">{t.name}</td>
                    <td className="py-2.5 px-3">{t.action}</td>
                    <td className="py-2.5 px-3 font-mono text-xs">{t.compound}</td>
                    <td className="py-2.5 px-3 font-mono text-xs">{t.age} laps</td>
                    <td className="py-2.5 px-3 font-mono text-xs">{t.pos}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant={t.submitted ? "default" : "secondary"}>
                        {t.submitted ? "Submitted" : "Pending"}
                      </Badge>
                    </td>
                  </tr>
                ))}
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
            <div className="text-4xl font-bold font-display font-mono">2:47</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Reset Timer</Button>
              <Button variant="destructive" size="sm">Force Close</Button>
            </div>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden mt-4">
            <div className="h-full rounded-full bg-primary w-[85%] transition-all"></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
