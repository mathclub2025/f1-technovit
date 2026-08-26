"use client";

import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { useRaceStore } from "@/lib/race-store";

export default function SubmissionsPage() {
  const { cars, currentBlock, currentLap } = useRaceStore();
  const carList = Object.values(cars);

  return (
    <div className="flex flex-col gap-6 min-h-full pb-8">
      <PageHeader
        eyebrow="BLOCK MANAGEMENT"
        title="Team Submissions"
        description="View and manage all team strategy submissions per block."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" /> Block {currentBlock} — Submissions
          </CardTitle>
          <CardDescription>Laps {currentLap + 1}–{currentLap + 5}. All strategies for this block.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2.5 px-3 text-muted-foreground font-medium">Team</th>
                  <th className="text-left py-2.5 px-3 text-muted-foreground font-medium">Action</th>
                  <th className="text-left py-2.5 px-3 text-muted-foreground font-medium">Target Lap</th>
                  <th className="text-left py-2.5 px-3 text-muted-foreground font-medium">New Compound</th>
                  <th className="text-left py-2.5 px-3 text-muted-foreground font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {carList.map((car, i) => (
                  <tr key={car.team_id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="py-2.5 px-3 font-medium">{car.driver} ({car.team_id})</td>
                    <td className="py-2.5 px-3">{car.action}</td>
                    <td className="py-2.5 px-3 font-mono text-xs">{car.pit_lap ? `Lap ${car.pit_lap}` : "—"}</td>
                    <td className="py-2.5 px-3 font-mono text-xs">{car.next_compound || "—"}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant={car.has_submitted ? "default" : "secondary"}>
                        {car.has_submitted ? "Submitted" : "Pending"}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {carList.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-muted-foreground">No teams active.</td>
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
