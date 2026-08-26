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

const POWERS = [
  {
    id: "HAMMERTIME",
    name: "Hammertime",
    description: "Reduces lap time by 1.50s for ONE lap.",
    category: "Offensive",
  },
  {
    id: "BLITZKRIEG",
    name: "Blitzkrieg",
    description: "Reduces lap time by 0.80s for the current block.",
    category: "Offensive",
  },
  {
    id: "MINISTER_OF_DEFENCE",
    name: "Minister of Defence",
    description: "Blocks pitlane entry for ALL teams for one block.",
    category: "Defensive",
  },
  {
    id: "RAINMASTER",
    name: "Schumacher Rainmaster",
    description: "Reduces wet-on-slicks penalty from +12s to +2s per lap.",
    category: "Weather",
  },
  {
    id: "PLAN_E",
    name: "Plan E",
    description: "Custom penalty for a specific team (requires target & penalty value).",
    category: "Malicious",
  }
];

export default function PowersPage() {
  const { cars, queuedPowers, addPower, clearPowers } = useRaceStore();
  
  const [targetTeam, setTargetTeam] = useState<string>("");
  const [planETarget, setPlanETarget] = useState<string>("");
  const [planEPenalty, setPlanEPenalty] = useState<string>("");

  const carList = Object.values(cars);

  const handleQueuePower = (powerId: string) => {
    if (!targetTeam) return;
    addPower({
      team_id: targetTeam,
      power: powerId,
      target_team_id: powerId === "PLAN_E" ? planETarget : null,
      plan_e_penalty: powerId === "PLAN_E" ? parseFloat(planEPenalty) : null,
    });
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
                        {p.id === "PLAN_E" && targetTeam && (
                          <div className="mt-2 flex gap-2">
                            <Select value={planETarget} onValueChange={setPlanETarget}>
                              <SelectTrigger className="h-8 w-[130px]">
                                <SelectValue placeholder="Target Team" />
                              </SelectTrigger>
                              <SelectContent>
                                {carList.map((c) => (
                                  <SelectItem key={c.team_id} value={c.team_id}>{c.driver}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input 
                              type="number" 
                              placeholder="+ Secs" 
                              className="h-8 w-[80px]"
                              value={planEPenalty}
                              onChange={(e) => setPlanEPenalty(e.target.value)}
                            />
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Button 
                          size="sm" 
                          disabled={!targetTeam || (p.id === "PLAN_E" && (!planETarget || !planEPenalty))}
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
