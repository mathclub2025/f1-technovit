"use client";

import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Eye } from "lucide-react";

export default function SubmissionsPage() {
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
            <Users className="h-4 w-4" /> Block 1 — Submissions
          </CardTitle>
          <CardDescription>Laps 1–5. All strategies for this block.</CardDescription>
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
                  <th className="text-left py-2.5 px-3 text-muted-foreground font-medium">Submitted At</th>
                  <th className="text-left py-2.5 px-3 text-muted-foreground font-medium">Status</th>
                  <th className="text-left py-2.5 px-3 text-muted-foreground font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "Team Redbull", action: "Stay Out", lap: "—", compound: "—", time: "09:12:34", status: "Locked" },
                  { name: "Team Mercedes", action: "Pit Stop", lap: "Lap 3", compound: "Medium", time: "09:13:01", status: "Locked" },
                  { name: "Team Aston", action: "Stay Out", lap: "—", compound: "—", time: "09:14:22", status: "Locked" },
                  { name: "Team Ferrari", action: "Pit Stop", lap: "Lap 4", compound: "Soft", time: "09:14:55", status: "Locked" },
                  { name: "Team McLaren", action: "Stay Out", lap: "—", compound: "—", time: "09:15:00", status: "Locked" },
                  { name: "Team Alpine", action: "Stay Out", lap: "—", compound: "—", time: "—", status: "Defaulted" },
                  { name: "Team Haas", action: "Pit Stop", lap: "Lap 2", compound: "Hard", time: "09:12:10", status: "Locked" },
                  { name: "Team Williams", action: "Stay Out", lap: "—", compound: "—", time: "—", status: "Defaulted" },
                ].map((t, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="py-2.5 px-3 font-medium">{t.name}</td>
                    <td className="py-2.5 px-3">{t.action}</td>
                    <td className="py-2.5 px-3 font-mono text-xs">{t.lap}</td>
                    <td className="py-2.5 px-3 font-mono text-xs">{t.compound}</td>
                    <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground">{t.time}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant={t.status === "Locked" ? "default" : "secondary"}>
                        {t.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3">
                      <Button variant="ghost" size="icon-xs" title="View Details">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
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
