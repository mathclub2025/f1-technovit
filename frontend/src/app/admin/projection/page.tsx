import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Monitor } from "lucide-react";

export default function ProjectionPage() {
  return (
    <div className="flex flex-col gap-6 min-h-full pb-8">
      <PageHeader
        eyebrow="PROJECTOR VIEW"
        title="Race Projection"
        description="Full-screen race view designed for the event projector."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Monitor className="h-4 w-4" /> Leaderboard & Lap Chart
          </CardTitle>
          <CardDescription>
            This page will render the full live leaderboard, lap-by-lap chart, and current block timer for the projector screen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Mini Leaderboard Preview */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2.5 px-3 text-muted-foreground font-medium">Pos</th>
                    <th className="text-left py-2.5 px-3 text-muted-foreground font-medium">Team</th>
                    <th className="text-left py-2.5 px-3 text-muted-foreground font-medium">Compound</th>
                    <th className="text-left py-2.5 px-3 text-muted-foreground font-medium">Last Lap</th>
                    <th className="text-left py-2.5 px-3 text-muted-foreground font-medium">Total Time</th>
                    <th className="text-left py-2.5 px-3 text-muted-foreground font-medium">Gap</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { pos: 1, name: "Team Redbull", compound: "Hard", last: "82.60", total: "413.00", gap: "—" },
                    { pos: 2, name: "Team Mercedes", compound: "Medium", last: "83.60", total: "416.20", gap: "+3.20" },
                    { pos: 3, name: "Team Aston", compound: "Medium", last: "84.40", total: "418.10", gap: "+5.10" },
                    { pos: 4, name: "Team Ferrari", compound: "Medium", last: "84.80", total: "419.95", gap: "+6.95" },
                    { pos: 5, name: "Team McLaren", compound: "Soft", last: "81.75", total: "421.40", gap: "+8.40" },
                    { pos: 6, name: "Team Alpine", compound: "Soft", last: "84.15", total: "425.30", gap: "+12.30" },
                    { pos: 7, name: "Team Haas", compound: "Hard", last: "85.00", total: "428.60", gap: "+15.60" },
                    { pos: 8, name: "Team Williams", compound: "Hard", last: "85.60", total: "432.10", gap: "+19.10" },
                  ].map((t, i) => (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-xs font-bold">P{t.pos}</td>
                      <td className="py-2.5 px-3 font-medium">{t.name}</td>
                      <td className="py-2.5 px-3 font-mono text-xs">{t.compound}</td>
                      <td className="py-2.5 px-3 font-mono text-xs">{t.last}s</td>
                      <td className="py-2.5 px-3 font-mono text-xs">{t.total}s</td>
                      <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground">{t.gap === "—" ? "Leader" : `+${t.gap}s`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Full projector mode with real-time WebSocket data will be connected by the backend team.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
