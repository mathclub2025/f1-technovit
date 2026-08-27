"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldAlert, Plus } from "lucide-react";
import { useRaceStore } from "@/lib/race-store";
import { getApiUrl } from "@/lib/api-config";
import { toast } from "sonner";

interface PenaltyLogEntry {
  lap: number;
  team: string;
  penalty: string;
  reason: string;
  type: string;
}

export default function PenaltiesPage() {
  const { cars, currentLap } = useRaceStore();
  const [targetTeam, setTargetTeam] = useState<string>("");
  const [penaltySeconds, setPenaltySeconds] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [penaltyLog, setPenaltyLog] = useState<PenaltyLogEntry[]>([]);
  const [isApplying, setIsApplying] = useState(false);

  const carList = Object.values(cars);

  const handleApplyPenalty = async () => {
    if (!targetTeam || !penaltySeconds) return;

    const car = cars[targetTeam];
    if (!car) return;

    setIsApplying(true);
    const secs = parseFloat(penaltySeconds);
    const newTotalTime = car.total_race_time + secs;

    try {
      const token = localStorage.getItem("race_token");
      await fetch(getApiUrl("/api/admin/god-mode"), {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          team_id: targetTeam,
          total_race_time: newTotalTime
        })
      });

      setPenaltyLog(prev => [{
        lap: currentLap,
        team: car.driver,
        penalty: `+${secs.toFixed(2)}s`,
        reason: reason || "Manual Override",
        type: "Manual"
      }, ...prev]);

      toast("Penalty Applied", { description: `${secs}s added to ${car.driver}` });
      setPenaltySeconds("");
      setReason("");
      setTargetTeam("");
    } catch (err) {
      toast("Error", { description: "Failed to apply penalty." });
    } finally {
      setIsApplying(false);
    }
  };

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
          <CardDescription>Select a team and specify the time penalty to apply directly to their cumulative race time.</CardDescription>
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
                  {carList.map((t) => (
                    <SelectItem key={t.team_id} value={t.team_id}>{t.driver} ({t.team_id})</SelectItem>
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
          <Button 
            disabled={!targetTeam || !penaltySeconds || isApplying} 
            className="gap-1.5"
            onClick={handleApplyPenalty}
          >
            <ShieldAlert className="h-4 w-4" /> {isApplying ? "Applying..." : "Apply Penalty"}
          </Button>
        </CardContent>
      </Card>

      {/* Penalty Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldAlert className="h-4 w-4" /> Local Penalty Log
          </CardTitle>
          <CardDescription>History of manual penalties applied during this browser session.</CardDescription>
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
                </tr>
              </thead>
              <tbody>
                {penaltyLog.map((p, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-xs">Lap {p.lap}</td>
                    <td className="py-2.5 px-3 font-medium">{p.team}</td>
                    <td className="py-2.5 px-3 font-mono text-xs text-destructive-foreground">{p.penalty}</td>
                    <td className="py-2.5 px-3 text-muted-foreground">{p.reason}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant={p.type === "Auto" ? "secondary" : "default"}>{p.type}</Badge>
                    </td>
                  </tr>
                ))}
                {penaltyLog.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-muted-foreground">No manual penalties applied yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
