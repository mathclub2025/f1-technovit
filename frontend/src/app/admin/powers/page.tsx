"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap } from "lucide-react";

const POWERS = [
  {
    name: "Hammertime",
    driver: "Lewis Hamilton",
    description: "Reduces lap time by 1.50s for ONE lap. Single-use.",
    category: "Offensive",
    usesLeft: 1,
  },
  {
    name: "Minister of Defence",
    driver: "Fernando Alonso",
    description: "Blocks pitlane entry for ALL teams for one block (including the team that uses it).",
    category: "Defensive",
    usesLeft: 1,
  },
  {
    name: "Schumacher Rainmaster",
    driver: "Michael Schumacher",
    description: "Reduces wet-on-slicks penalty from +12.00s to +2.00s per lap for one block.",
    category: "Weather",
    usesLeft: 1,
  },
  {
    name: "Safety Car",
    driver: "Bernd Mayländer",
    description: "Neutralises the race for one block. All teams receive the same lap time (85.00s).",
    category: "Neutral",
    usesLeft: 1,
  },
  {
    name: "DRS Boost",
    driver: "—",
    description: "Reduces lap time by 0.80s for the current block (5 laps). Single-use.",
    category: "Offensive",
    usesLeft: 1,
  },
];

export default function PowersPage() {
  const [targetTeam, setTargetTeam] = useState<string>("");

  return (
    <div className="flex flex-col gap-6 min-h-full pb-8">
      <PageHeader
        eyebrow="SPECIAL ABILITIES"
        title="Superpower Matrix"
        description="Assign and activate special powers for teams during the race."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4" /> Available Powers
          </CardTitle>
          <CardDescription>Click &quot;Activate&quot; to apply a power to the selected team.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <label className="text-sm font-medium mb-2 block">Target Team</label>
            <Select value={targetTeam} onValueChange={(v) => setTargetTeam(v ?? "")}>
              <SelectTrigger className="max-w-xs">
                <SelectValue placeholder="Select a team..." />
              </SelectTrigger>
              <SelectContent>
                {["Team Redbull", "Team Mercedes", "Team Aston", "Team Ferrari", "Team McLaren", "Team Alpine", "Team Haas", "Team Williams"].map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2.5 px-3 text-muted-foreground font-medium">Power</th>
                  <th className="text-left py-2.5 px-3 text-muted-foreground font-medium">Driver</th>
                  <th className="text-left py-2.5 px-3 text-muted-foreground font-medium">Effect</th>
                  <th className="text-left py-2.5 px-3 text-muted-foreground font-medium">Category</th>
                  <th className="text-left py-2.5 px-3 text-muted-foreground font-medium">Uses Left</th>
                  <th className="text-left py-2.5 px-3 text-muted-foreground font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {POWERS.map((p, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="py-2.5 px-3 font-medium">{p.name}</td>
                    <td className="py-2.5 px-3 text-muted-foreground">{p.driver}</td>
                    <td className="py-2.5 px-3 text-muted-foreground max-w-xs">{p.description}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant="secondary">{p.category}</Badge>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-xs">{p.usesLeft}</td>
                    <td className="py-2.5 px-3">
                      <Button size="sm" disabled={!targetTeam}>Activate</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
