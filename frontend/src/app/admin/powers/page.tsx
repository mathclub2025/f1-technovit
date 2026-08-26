"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Zap, X } from "lucide-react";
import { useRaceStore } from "@/lib/race-store";
import { toast } from "sonner";

const POWERS = [
  {
    id: "HAMMERTIME",
    name: "Lewis Hamilton (Hammertime)",
    description: "Forces tire age x = 1 for all 5 laps, ignoring actual degradation.",
    category: "Offensive",
  },
  {
    id: "BLITZKRIEG",
    name: "Max Verstappen (Blitzkrieg)",
    description: "Flat 10.00s pit stop and complete immunity from pitlane traffic congestion.",
    category: "Offensive",
  },
  {
    id: "RAINMASTER",
    name: "Michael Schumacher (Rainmaster)",
    description: "Reduces wet-on-slicks penalty from +12.00s to +2.00s per lap on wet track.",
    category: "Weather",
  },
  {
    id: "PLAN_E",
    name: "Charles Leclerc (Plan E)",
    description: "Sets pit penalty to exact die-roll value (5.00s success / 30.00s fail).",
    category: "Tactical",
  },
  {
    id: "MINISTER_OF_DEFENCE",
    name: "Fernando Alonso (Minister of Defence)",
    description: "Closes pit entry and blocks pit execution for the selected target team.",
    category: "Defensive",
  }
];

export default function PowersPage() {
  const { cars, queuedPowers, addPower, clearPowers } = useRaceStore();
  
  const [targetTeam, setTargetTeam] = useState<string>("");
  const [alonsoTarget, setAlonsoTarget] = useState<string>("");
  const [planEPenalty, setPlanEPenalty] = useState<string>("5");

  const carList = Object.values(cars);

  const handleQueuePower = (powerId: string) => {
    if (!targetTeam) return;
    addPower({
      team_id: targetTeam,
      power: powerId,
      target_team_id: powerId === "MINISTER_OF_DEFENCE" ? alonsoTarget : null,
      plan_e_penalty: powerId === "PLAN_E" ? parseFloat(planEPenalty) : null,
    });
    toast.success("Power Queued", { description: `${powerId} queued for ${targetTeam}. Will execute in next block.` });
  };

  return (
    <div className="flex flex-col gap-6 min-h-full pb-8">
      <PageHeader
        eyebrow="SPECIAL ABILITIES"
        title="Superpower Matrix"
        description="Queue special powers to be applied when the next block executes."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-4 w-4" /> Available Powers
            </CardTitle>
            <CardDescription>Select a team and queue their power usage.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">Team Using Power</label>
              <Select value={targetTeam} onValueChange={(v) => setTargetTeam(v ?? "")}>
                <SelectTrigger className="max-w-xs">
                  <SelectValue placeholder="Select a team..." />
                </SelectTrigger>
                <SelectContent>
                  {carList.map((c) => (
                    <SelectItem key={c.team_id} value={c.team_id}>{c.driver} ({c.team_id})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2.5 px-3 text-muted-foreground font-medium">Power</th>
                    <th className="text-left py-2.5 px-3 text-muted-foreground font-medium">Effect</th>
                    <th className="text-left py-2.5 px-3 text-muted-foreground font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {POWERS.map((p) => (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="py-2.5 px-3 font-medium">
                        {p.name}
                        <br />
                        <Badge variant="secondary" className="mt-1 text-[10px]">{p.category}</Badge>
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground max-w-xs">
                        {p.description}
                        {p.id === "MINISTER_OF_DEFENCE" && targetTeam && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs font-semibold text-white">Target:</span>
                            <Select value={alonsoTarget} onValueChange={(v) => setAlonsoTarget(v ?? "")}>
                              <SelectTrigger className="h-8 w-[160px]">
                                <SelectValue placeholder="Select Target..." />
                              </SelectTrigger>
                              <SelectContent>
                                {carList.filter(c => c.team_id !== targetTeam).map((c) => (
                                  <SelectItem key={c.team_id} value={c.team_id}>{c.driver} ({c.team_id})</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        {p.id === "PLAN_E" && targetTeam && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs font-semibold text-white">Die-roll Pit Penalty:</span>
                            <Select value={planEPenalty} onValueChange={(v) => setPlanEPenalty(v ?? "5")}>
                              <SelectTrigger className="h-8 w-[130px]">
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
                      <td className="py-2.5 px-3 text-right">
                        <Button 
                          size="sm" 
                          disabled={
                            !targetTeam || 
                            (p.id === "MINISTER_OF_DEFENCE" && !alonsoTarget) ||
                            (p.id === "PLAN_E" && !planEPenalty)
                          }
                          onClick={() => handleQueuePower(p.id)}
                        >
                          Queue
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Queue Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              Execution Queue
              <Badge variant="outline">{queuedPowers.length}</Badge>
            </CardTitle>
            <CardDescription>Powers pending next block execution.</CardDescription>
          </CardHeader>
          <CardContent>
            {queuedPowers.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-6">
                No powers queued.
              </div>
            ) : (
              <div className="space-y-3">
                {queuedPowers.map((q, i) => (
                  <div key={i} className="flex items-center justify-between border border-border p-3 rounded-md bg-muted/20">
                    <div>
                      <div className="font-medium text-sm">{q.power}</div>
                      <div className="text-xs text-muted-foreground">Used by: {q.team_id}</div>
                      {q.target_team_id && <div className="text-xs text-destructive-foreground">Target: {q.target_team_id} (+{q.plan_e_penalty}s)</div>}
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full mt-2" onClick={clearPowers}>
                  <X className="h-4 w-4 mr-1" /> Clear Queue
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
