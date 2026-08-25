"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldAlert, Plus } from "lucide-react";

export default function PenaltiesPage() {
  const [targetTeam, setTargetTeam] = useState<string>("");
  const [penaltySeconds, setPenaltySeconds] = useState<string>("");
  const [reason, setReason] = useState<string>("");

  return (
    <div className="flex flex-col gap-6 min-h-full pb-8">
      <PageHeader
        eyebrow="STEWARDS PANEL"
        title="Penalty Overrides"
        description="Manually apply or remove time penalties for any team."
      />

      {/* Apply Penalty Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4" /> Apply New Penalty
          </CardTitle>
          <CardDescription>Select a team and specify the time penalty to apply.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Team</label>
              <Select value={targetTeam} onValueChange={(v) => setTargetTeam(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team..." />
                </SelectTrigger>
                <SelectContent>
                  {["Team Redbull", "Team Mercedes", "Team Aston", "Team Ferrari", "Team McLaren", "Team Alpine", "Team Haas", "Team Williams"].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Penalty (seconds)</label>
              <Input
                type="number"
                placeholder="e.g. 5.00"
                value={penaltySeconds}
                onChange={(e) => setPenaltySeconds(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason</label>
              <Input
                placeholder="e.g. Unsafe release"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
          <Button disabled={!targetTeam || !penaltySeconds} className="gap-1.5">
            <ShieldAlert className="h-4 w-4" /> Apply Penalty
          </Button>
        </CardContent>
      </Card>

      {/* Penalty Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldAlert className="h-4 w-4" /> Penalty Log
          </CardTitle>
          <CardDescription>History of all penalties applied during this Grand Prix.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2.5 px-3 text-muted-foreground font-medium">Lap</th>
                  <th className="text-left py-2.5 px-3 text-muted-foreground font-medium">Team</th>
                  <th className="text-left py-2.5 px-3 text-muted-foreground font-medium">Penalty</th>
                  <th className="text-left py-2.5 px-3 text-muted-foreground font-medium">Reason</th>
                  <th className="text-left py-2.5 px-3 text-muted-foreground font-medium">Type</th>
                  <th className="text-left py-2.5 px-3 text-muted-foreground font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {[
                  { lap: 3, team: "Team Mercedes", penalty: "+6.00s", reason: "Traffic Jam (4 teams pitted)", type: "Auto" },
                  { lap: 3, team: "Team Ferrari", penalty: "+6.00s", reason: "Traffic Jam (4 teams pitted)", type: "Auto" },
                  { lap: 3, team: "Team Haas", penalty: "+6.00s", reason: "Traffic Jam (4 teams pitted)", type: "Auto" },
                  { lap: 3, team: "Team McLaren", penalty: "+6.00s", reason: "Traffic Jam (4 teams pitted)", type: "Auto" },
                  { lap: 5, team: "Team Alpine", penalty: "+5.00s", reason: "Unsafe pit release", type: "Manual" },
                ].map((p, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-xs">Lap {p.lap}</td>
                    <td className="py-2.5 px-3 font-medium">{p.team}</td>
                    <td className="py-2.5 px-3 font-mono text-xs text-destructive-foreground">{p.penalty}</td>
                    <td className="py-2.5 px-3 text-muted-foreground">{p.reason}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant={p.type === "Auto" ? "secondary" : "default"}>{p.type}</Badge>
                    </td>
                    <td className="py-2.5 px-3">
                      {p.type === "Manual" && (
                        <Button variant="ghost" size="sm" className="text-destructive text-xs">Revoke</Button>
                      )}
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
